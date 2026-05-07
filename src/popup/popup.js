// Popup logic — Step 4: tabs UI (Chats/Groups/Labels/AllContacts) +
// persisted toggles + debug log copy. Only Chats is wired to data; the other
// three tabs show empty states until Step 5.

import {
  chatsToCsvBlob,
  groupsToCsvBlob,
  labelsToCsvBlob,
  contactsToCsvBlob,
  messagesToCsvBlob,
} from "../lib/csv.js";
import { chatsToVcard, contactsToVcard, groupMembersToVcard, vcardBlob } from "../lib/vcard.js";
import {
  summarizeChat, suggestFollowups, suggestOne, triageChats, draftAutoReply,
  pingProvider, PROVIDERS, MODEL_META,
} from "../lib/ai.js";
import {
  getSettings, setSettings, appendDebugLog, getDebugLog,
  getConsent, setConsent, getAiSettings, setAiSettings, clearAiMigrationNote,
  getAiChatInstruction, setAiChatInstruction,
  getAutoReply, setAutoReply, appendAutoReplyHistory,
} from "../utils/storage.js";
import { initLicenseTab, requirePro, refreshLicenseTab } from "./license-tab.js";
import { effectiveMessageLimit, FREE_MSG_LIMIT_PER_CHAT, isPro } from "../license/license-manager.js";

const $ = (id) => document.getElementById(id);
const dot = $("status-dot");
const text = $("status-text");
const healthCard = $("health-card");
const healthBody = $("health-body");
const healthToggle = $("health-toggle");
const healthList = $("health-list");
const healthMeta = $("health-meta");
const tabsNav = $("tabs");
const ctaRow = $("cta-row");
const refreshBtn = $("refresh-btn");
const copyDebugBtn = $("copy-debug-btn");

// Chats tab
const includeUnsavedCb = $("include-unsaved");
const extractChatsBtn = $("extract-chats-btn");
const chatsCount = $("chats-count");
const chatsPreview = $("chats-preview");
const chatsTbody = $("chats-tbody");
const chatsNote = $("chats-note");
const chatsExportRow = $("chats-export-row");
const chatsExportCsv = $("chats-export-csv");

// Chats tab — additional XLSX/VCard
const chatsExportXlsx = $("chats-export-xlsx");
const chatsExportVcard = $("chats-export-vcard");

// AI tab
const aiStatus = $("ai-status");
const aiProviderSelect = $("ai-provider");
const aiBaseUrlInput = $("ai-baseurl");
const aiBaseUrlRow = $("ai-baseurl-row");
const aiApiKeyRow = $("ai-apikey-row");
const aiApiKeyInput = $("ai-api-key");
const aiModelInput = $("ai-model");
const aiModelSelect = $("ai-model-select");
const aiModelInfo = $("ai-model-info");
const MODEL_MANUAL_VALUE = "__manual__";
const aiHelpLink = $("ai-help-link");
const aiProviderHelp = $("ai-provider-help");
const aiSaveKeyBtn = $("ai-save-key");
const aiTestKeyBtn = $("ai-test-key");
const aiChatSelect = $("ai-chat-select");
const aiSummarizeBtn = $("ai-summarize-btn");
const aiFollowupsBtn = $("ai-followups-btn");
const aiTriageBtn = $("ai-triage-btn");
const aiOutput = $("ai-output");
const aiOutputTitle = $("ai-output-title");
const aiOutputBody = $("ai-output-body");
const aiOutputMeta = $("ai-output-meta");
const aiOutputCopy = $("ai-output-copy");
const aiChatInstructions = $("ai-chat-instructions");
const aiInstructionsSave = $("ai-instructions-save");
const aiInstructionsHint = $("ai-instructions-hint");

// Auto-reply tab
const arStatus = $("autoreply-status");
const arMasterEnabled = $("ar-master-enabled");
const arMode = $("ar-mode");
const arMaxHour = $("ar-max-hour");
const arMaxDay = $("ar-max-day");
const arQuietEnabled = $("ar-quiet-enabled");
const arQuietStart = $("ar-quiet-start");
const arQuietEnd = $("ar-quiet-end");
const arChatSelect = $("ar-chat-select");
const arInstructions = $("ar-instructions");
const arChatEnabled = $("ar-chat-enabled");
const arSaveChat = $("ar-save-chat");
const arPendingList = $("ar-pending-list");
const arPendingEmpty = $("ar-pending-empty");
const arHistoryList = $("ar-history-list");

// Mesajlar tab
const extractMessagesBtn = $("extract-messages-btn");
const messagesCount = $("messages-count");
const messagesPreview = $("messages-preview");
const messagesTbody = $("messages-tbody");
const messagesNote = $("messages-note");
const messagesExportRow = $("messages-export-row");
const messagesExportCsv = $("messages-export-csv");
const messagesExportXlsx = $("messages-export-xlsx");
const messagesPerChatLimitSel = $("messages-per-chat-limit");
const messagesLoadEarlierSel = $("messages-load-earlier");

// Gruplar tab
const groupsIncludeUnsavedCb = $("groups-include-unsaved");
const extractGroupsBtn = $("extract-groups-btn");
const groupsCount = $("groups-count");
const groupsPreview = $("groups-preview");
const groupsTbody = $("groups-tbody");
const groupsNote = $("groups-note");
const groupsExportRow = $("groups-export-row");
const groupsExportCsv = $("groups-export-csv");
const groupsExportXlsx = $("groups-export-xlsx");
const groupsExportVcard = $("groups-export-vcard");

// Etiketler tab
const extractLabelsBtn = $("extract-labels-btn");
const labelsCount = $("labels-count");
const labelsPreview = $("labels-preview");
const labelsTbody = $("labels-tbody");
const labelsNote = $("labels-note");
const labelsExportRow = $("labels-export-row");
const labelsExportCsv = $("labels-export-csv");
const labelsExportXlsx = $("labels-export-xlsx");

// Tüm Kişiler tab
const contactsIncludeUnsavedCb = $("contacts-include-unsaved");
const extractContactsBtn = $("extract-contacts-btn");
const contactsCount = $("contacts-count");
const contactsPreview = $("contacts-preview");
const contactsTbody = $("contacts-tbody");
const contactsNote = $("contacts-note");
const contactsExportRow = $("contacts-export-row");
const contactsExportCsv = $("contacts-export-csv");
const contactsExportXlsx = $("contacts-export-xlsx");
const contactsExportVcard = $("contacts-export-vcard");

const MODULE_LABELS = {
  Chat: "Sohbetler",
  GroupMetadata: "Grup üyeleri",
  Label: "Etiketler",
  LabelAssociation: "Etiket eşleşmeleri",
  Contact: "Kişiler",
  WidFactory: "WID yardımcısı",
};

const REQUIRED_MODULES = new Set(["Chat"]);

const REASON_MESSAGES = {
  "not-yet-probed": "Modül taraması hâlâ sürüyor… birkaç saniye bekleyip Yenile'ye basın.",
  "in-progress": "Modüller yükleniyor… eksik olanlar için biraz daha bekleyin.",
  "interception-not-installed": "Eklenti çok geç yüklendi: WhatsApp modül sistemi yakalanamadı. Sayfayı yenileyin.",
  "no-modules-captured": "Hiç modül kaydı yakalanamadı. Sayfayı yenileyip QR ile giriş yapın.",
  "require-missing": "WhatsApp Web modül erişim fonksiyonu bulunamadı. WA Web sürümü uyumsuz olabilir.",
  "modules-not-found": "Modüller tarandı ama hedef shape'ler bulunamadı. Eklenti güncellemesi bekleniyor.",
  "partial-modules": "Modüllerin bir kısmı bulunamadı. Bazı özellikler kısıtlı çalışabilir.",
  "webpack-missing": "WhatsApp Web yüklenmemiş görünüyor. Sayfayı yenileyip QR ile giriş yapın.",
  "require-not-captured": "Modül kayıtçısı yakalanamadı. Sayfayı yenileyin.",
  "timeout": "WhatsApp Web henüz hazır değil. Sayfayı yenileyin ve QR ile giriş yapın.",
};

let currentTab = null;        // active WA Web chrome tab
let activeTabKey = "chats";   // active UI tab
let healthExpanded = false;
const state = {
  chats: { extracted: null },
  groups: { extracted: null },
  labels: { extracted: null },
  contacts: { extracted: null },
  messages: { extracted: null },
};
let lastError = null;
let lastHealth = null;

async function init() {
  const privacyUrl = chrome.runtime.getURL("src/popup/privacy.html");
  const privacyLink = $("consent-privacy-link");
  const footerPrivacyLink = $("footer-privacy-link");
  if (privacyLink) privacyLink.href = privacyUrl;
  if (footerPrivacyLink) footerPrivacyLink.href = privacyUrl;

  const consentAccepted = await getConsent();
  if (!consentAccepted) {
    showConsentGate();
    return;
  }

  const settings = await getSettings();
  includeUnsavedCb.checked = !!settings.includeUnsaved;
  groupsIncludeUnsavedCb.checked = !!settings.includeUnsaved;
  contactsIncludeUnsavedCb.checked = !!settings.includeUnsaved;
  setStatus("idle", "WhatsApp Web aranıyor…");
  bindEvents();
  await refresh();
}

function showConsentGate() {
  const gate = $("consent-gate");
  const checkbox = $("consent-checkbox");
  const acceptBtn = $("consent-accept");
  const main = $("app");
  gate.hidden = false;
  main.hidden = true;
  checkbox.addEventListener("change", () => {
    acceptBtn.disabled = !checkbox.checked;
  });
  acceptBtn.addEventListener("click", async () => {
    if (!checkbox.checked) return;
    acceptBtn.disabled = true;
    acceptBtn.textContent = "Kaydediliyor…";
    await setConsent(true);
    gate.hidden = true;
    main.hidden = false;
    // Continue with normal init now that consent is granted.
    const settings = await getSettings();
    includeUnsavedCb.checked = !!settings.includeUnsaved;
    groupsIncludeUnsavedCb.checked = !!settings.includeUnsaved;
    contactsIncludeUnsavedCb.checked = !!settings.includeUnsaved;
    setStatus("idle", "WhatsApp Web aranıyor…");
    bindEvents();
    await refresh();
  });
}

function syncToggles(value) {
  includeUnsavedCb.checked = value;
  groupsIncludeUnsavedCb.checked = value;
  contactsIncludeUnsavedCb.checked = value;
}

function bindEvents() {
  refreshBtn.addEventListener("click", () => refresh({ reProbe: true }));
  copyDebugBtn.addEventListener("click", copyDebugReport);
  extractChatsBtn.addEventListener("click", extractChats);
  chatsExportCsv.addEventListener("click", exportChatsCsv);

  for (const cb of [includeUnsavedCb, groupsIncludeUnsavedCb, contactsIncludeUnsavedCb]) {
    cb.addEventListener("change", async () => {
      syncToggles(cb.checked);
      await setSettings({ includeUnsaved: cb.checked });
    });
  }

  extractGroupsBtn.addEventListener("click", extractGroups);
  groupsExportCsv.addEventListener("click", exportGroupsCsv);
  extractLabelsBtn.addEventListener("click", extractLabels);
  labelsExportCsv.addEventListener("click", exportLabelsCsv);
  extractContactsBtn.addEventListener("click", extractContacts);
  contactsExportCsv.addEventListener("click", exportContactsCsv);
  extractMessagesBtn.addEventListener("click", extractMessages);
  messagesExportCsv.addEventListener("click", exportMessagesCsv);
  messagesExportXlsx.addEventListener("click", () => exportXlsx("messages", messagesExportXlsx));

  // AI controls
  aiProviderSelect.addEventListener("change", onProviderChange);
  aiSaveKeyBtn.addEventListener("click", saveAiSettings);
  aiTestKeyBtn.addEventListener("click", testAiConnection);
  aiModelSelect.addEventListener("change", onModelSelectChange);
  aiModelInput.addEventListener("input", () => renderModelInfo(aiModelInput.value.trim()));
  aiSummarizeBtn.addEventListener("click", runAiSummarize);
  aiFollowupsBtn.addEventListener("click", runAiFollowups);
  bindSuggestionCardOnce();
  aiTriageBtn.addEventListener("click", runAiTriage);
  aiChatSelect.addEventListener("change", onAiChatSelectChange);
  if (aiInstructionsSave) aiInstructionsSave.addEventListener("click", saveAiChatInstruction);
  if (aiChatInstructions) aiChatInstructions.addEventListener("input", () => updateInstructionHint("dirty"));
  setupCopyButton(aiOutputCopy, () => aiOutputBody.textContent);
  loadAiSettings();

  // License tab — bind once
  initLicenseTab();

  // Auto-reply controls
  arMasterEnabled.addEventListener("change", onMasterToggle);
  arMode.addEventListener("change", saveAutoReplyMaster);
  arMaxHour.addEventListener("change", saveAutoReplyMaster);
  arMaxDay.addEventListener("change", saveAutoReplyMaster);
  arQuietEnabled.addEventListener("change", saveAutoReplyMaster);
  arQuietStart.addEventListener("change", saveAutoReplyMaster);
  arQuietEnd.addEventListener("change", saveAutoReplyMaster);
  arChatSelect.addEventListener("change", loadChatPerSettings);
  arSaveChat.addEventListener("click", saveChatPerSettings);
  loadAutoReplySettings();

  // Listen for new-message events (forwarded by content.js → background → popup).
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.kind === "WA_NEW_MSG" && msg.payload) {
      handleIncomingMessage(msg.payload);
    }
  });

  // XLSX exports — lazy: workbook builder dynamic-imports SheetJS on click.
  chatsExportXlsx.addEventListener("click", () => exportXlsx("chats", chatsExportXlsx));
  groupsExportXlsx.addEventListener("click", () => exportXlsx("groups", groupsExportXlsx));
  labelsExportXlsx.addEventListener("click", () => exportXlsx("labels", labelsExportXlsx));
  contactsExportXlsx.addEventListener("click", () => exportXlsx("contacts", contactsExportXlsx));

  // VCard exports
  chatsExportVcard.addEventListener("click", () => exportVcard("chats", chatsExportVcard));
  groupsExportVcard.addEventListener("click", () => exportVcard("group-members", groupsExportVcard));
  contactsExportVcard.addEventListener("click", () => exportVcard("contacts", contactsExportVcard));

  // VCard help banner controls
  const vcardCopyBtn = $("vcard-copy-btn");
  const vcardHelpCloseBtn = $("vcard-help-close");
  if (vcardCopyBtn) vcardCopyBtn.addEventListener("click", copyVcardToClipboard);
  if (vcardHelpCloseBtn) vcardHelpCloseBtn.addEventListener("click", () => { $("vcard-help").hidden = true; });

  tabsNav.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  healthToggle.addEventListener("click", () => {
    healthExpanded = !healthExpanded;
    healthBody.hidden = !healthExpanded;
    healthToggle.setAttribute("aria-expanded", String(healthExpanded));
    healthCard.dataset.expanded = String(healthExpanded);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.kind === "WA_HEALTH" && msg.payload) {
      renderHealth(msg.payload);
      show(ctaRow);
    }
  });
}

// Tabs that need an active Pro license to open. Free users get bounced
// to the license tab so the upsell + activation form is one click away.
// The lock glyph on these tab buttons is maintained by refreshLicenseTab
// (license-tab.js) — it already runs whenever Pro state can change.
const PRO_GATED_TABS = new Set(["ai", "autoreply"]);

async function switchTab(key) {
  if (PRO_GATED_TABS.has(key) && !await isPro()) {
    return switchTab("license");
  }

  activeTabKey = key;
  tabsNav.querySelectorAll(".tab").forEach((btn) => {
    const isActive = btn.dataset.tab === key;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.hidden = p.dataset.tab !== key;
  });
}

async function findWaTab() {
  const tabs = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
  return tabs[0] || null;
}

async function refresh({ reProbe = false } = {}) {
  setStatus("idle", reProbe ? "Yeniden taranıyor…" : "WhatsApp Web aranıyor…");
  hide(healthCard);
  hide(tabsNav);
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = true));
  hide(ctaRow);
  refreshBtn.disabled = true;

  currentTab = await findWaTab();
  if (!currentTab) {
    setStatus("err", "WhatsApp Web sekmesi bulunamadı. Lütfen https://web.whatsapp.com adresini açın.");
    show(ctaRow);
    refreshBtn.disabled = false;
    return;
  }

  if (reProbe) {
    try { await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "re-probe" }); } catch {}
    await new Promise((r) => setTimeout(r, 700));
  }

  let cached;
  try {
    cached = await chrome.tabs.sendMessage(currentTab.id, { kind: "GET_HEALTH" });
  } catch (err) {
    setStatus("err", "Content script'e ulaşılamadı. Sayfayı yenileyip tekrar deneyin.");
    await logError("content-unreachable", err);
    show(ctaRow);
    refreshBtn.disabled = false;
    return;
  }

  if (cached && cached.ok && cached.health) {
    renderHealth(cached.health);
  } else {
    try {
      const reply = await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "get-health" });
      if (reply && reply.ok && reply.data) renderHealth(reply.data);
      else setStatus("err", "Sağlık probu cevap vermedi. WhatsApp Web hazır olmayabilir.");
    } catch (err) {
      setStatus("err", `Hata: ${err && err.message ? err.message : err}`);
      await logError("health-fetch", err);
    }
  }
  show(ctaRow);
  refreshBtn.disabled = false;
}

function renderHealth(health) {
  lastHealth = health;
  if (health.ok) {
    setStatus("ok", "WhatsApp Web algılandı ✓");
    show(tabsNav);
    document.querySelector(`.tab-panel[data-tab="${activeTabKey}"]`).hidden = false;
  } else {
    const msg = REASON_MESSAGES[health.reason] || `Sağlık probu başarısız: ${health.reason || "bilinmeyen hata"}`;
    setStatus("err", msg);
    hide(tabsNav);
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = true));
  }

  show(healthCard);
  healthList.replaceChildren();
  const modules = health.modules || {};
  for (const [key, label] of Object.entries(MODULE_LABELS)) {
    const li = document.createElement("li");
    li.className = "health-item";
    const status = modules[key];
    const required = REQUIRED_MODULES.has(key);
    let icon, cls, suffix = "";
    if (status) {
      icon = "✓";
      cls = "health-pill health-pill--ok";
    } else if (required) {
      icon = "✗";
      cls = "health-pill health-pill--off";
    } else {
      icon = "—";
      cls = "health-pill health-pill--neutral";
      suffix = " <span class=\"health-tag\">opsiyonel</span>";
    }
    li.innerHTML = `<span class="${cls}">${icon}</span><span class="health-label">${label}${suffix}</span><span class="health-key">${key}</span>`;
    healthList.appendChild(li);
  }

  const parts = [];
  if (health.waVersion) parts.push(`WA sürümü: ${health.waVersion}`);
  if (typeof health.moduleCount === "number") parts.push(`${health.moduleCount} modül taranıyor`);
  if (health.ts) parts.push(`Son kontrol: ${new Date(health.ts).toLocaleTimeString("tr-TR")}`);
  healthMeta.textContent = parts.join(" · ");
}

// ---------------- Chats tab ------------------

async function extractChats() {
  if (!currentTab) return;
  extractChatsBtn.disabled = true;
  extractChatsBtn.textContent = "Çıkarılıyor…";
  hide(chatsPreview);
  hide(chatsExportRow);

  try {
    const reply = await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "list-chats" });
    if (!reply || !reply.ok) throw new Error(reply?.error || "list-chats failed");
    state.chats.extracted = reply.data || [];
    renderChatsPreview(state.chats.extracted);
    refreshAiButtons();
    refreshAutoReplyChatSelect();
  } catch (err) {
    chatsCount.textContent = "—";
    chatsTbody.replaceChildren();
    chatsNote.textContent = `Hata: ${err && err.message ? err.message : err}`;
    show(chatsPreview);
    await logError("extract-chats", err);
  } finally {
    extractChatsBtn.disabled = false;
    extractChatsBtn.textContent = "Yeniden Çıkar";
  }
}

function renderChatsPreview(chats) {
  chatsCount.textContent = `${chats.length} sohbet`;
  chatsTbody.replaceChildren();
  for (const c of chats.slice(0, 10)) {
    const tr = document.createElement("tr");
    const name = c.contactName || c.formattedName || c.name || c.formattedTitle || "(isimsiz)";
    const phone = c.phone || "—";
    const type = c.isGroup ? "Grup" : "Birey";
    const lastMsgTs = c.lastMessage?.t || c.t;
    const lastMsg = lastMsgTs ? new Date(lastMsgTs * 1000).toLocaleString("tr-TR") : "—";
    tr.innerHTML = `<td>${esc(name)}</td><td>${esc(phone)}</td><td>${type}</td><td>${esc(lastMsg)}</td>`;
    chatsTbody.appendChild(tr);
  }
  chatsNote.textContent = chats.length > 10 ? `İlk 10 / ${chats.length} sohbet gösteriliyor.` : `${chats.length} sohbet listelendi.`;
  show(chatsPreview);
  show(chatsExportRow);
}

async function exportChatsCsv() {
  if (!state.chats.extracted || state.chats.extracted.length === 0) return;
  chatsExportCsv.disabled = true;
  chatsExportCsv.textContent = "Hazırlanıyor…";
  try {
    const includeUnsaved = includeUnsavedCb.checked;
    const { blob, rows } = chatsToCsvBlob(state.chats.extracted, { includeUnsaved });
    if (rows.length === 0) {
      alert("Filtreden geçen kayıt yok. \"Kayıtlı olmayan kişileri dahil et\" işaretini deneyin.");
      return;
    }
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-chats-${stamp()}.csv`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`İndirme hatası: ${err && err.message ? err.message : err}`);
    await logError("export-chats-csv", err);
  } finally {
    chatsExportCsv.disabled = false;
    chatsExportCsv.textContent = "CSV indir";
  }
}

// ---------------- Groups tab ------------------

async function extractGroups() {
  if (!currentTab) return;
  extractGroupsBtn.disabled = true;
  extractGroupsBtn.textContent = "Çıkarılıyor…";
  hide(groupsPreview);
  hide(groupsExportRow);
  try {
    const reply = await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "list-groups" });
    if (!reply || !reply.ok) throw new Error(reply?.error || "list-groups failed");
    state.groups.extracted = reply.data || [];
    renderGroupsPreview(state.groups.extracted);
  } catch (err) {
    groupsCount.textContent = "—";
    groupsTbody.replaceChildren();
    groupsNote.textContent = `Hata: ${err && err.message ? err.message : err}`;
    show(groupsPreview);
    await logError("extract-groups", err);
  } finally {
    extractGroupsBtn.disabled = false;
    extractGroupsBtn.textContent = "Yeniden Çıkar";
  }
}

function renderGroupsPreview(groups) {
  const totalParticipants = groups.reduce((s, g) => s + (g.participants?.length || 0), 0);
  groupsCount.textContent = `${groups.length} grup · ${totalParticipants} üye`;
  groupsTbody.replaceChildren();
  for (const g of groups.slice(0, 10)) {
    const tr = document.createElement("tr");
    const name = g.formattedTitle || g.name || "(isimsiz)";
    const memberCount = g.participants?.length || 0;
    const lastMsgTs = g.lastMessage?.t || g.t;
    const lastMsg = lastMsgTs ? new Date(lastMsgTs * 1000).toLocaleString("tr-TR") : "—";
    tr.innerHTML = `<td>${esc(name)}</td><td>${memberCount}</td><td>${esc(lastMsg)}</td>`;
    groupsTbody.appendChild(tr);
  }
  groupsNote.textContent = groups.length > 10 ? `İlk 10 / ${groups.length} grup gösteriliyor.` : `${groups.length} grup listelendi.`;
  if (totalParticipants === 0) {
    groupsNote.textContent += " Üye listesi alınamadı (GroupMetadata modülü hazır olmayabilir — Yenile/QR sonrası tekrar deneyin).";
  }
  show(groupsPreview);
  show(groupsExportRow);
}

async function exportGroupsCsv() {
  const groups = state.groups.extracted;
  if (!groups || groups.length === 0) return;
  groupsExportCsv.disabled = true;
  groupsExportCsv.textContent = "Hazırlanıyor…";
  try {
    const includeUnsaved = groupsIncludeUnsavedCb.checked;
    const { blob, rows } = groupsToCsvBlob(groups, { includeUnsaved });
    if (rows.length === 0) {
      alert("Filtreden geçen kayıt yok.");
      return;
    }
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-groups-${stamp()}.csv`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`İndirme hatası: ${err && err.message ? err.message : err}`);
    await logError("export-groups-csv", err);
  } finally {
    groupsExportCsv.disabled = false;
    groupsExportCsv.textContent = "CSV indir";
  }
}

// ---------------- Labels tab ------------------

async function extractLabels() {
  if (!currentTab) return;
  extractLabelsBtn.disabled = true;
  extractLabelsBtn.textContent = "Çıkarılıyor…";
  hide(labelsPreview);
  hide(labelsExportRow);
  try {
    const reply = await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "list-labels" });
    if (!reply || !reply.ok) throw new Error(reply?.error || "list-labels failed");
    state.labels.extracted = reply.data || [];
    renderLabelsPreview(state.labels.extracted);
  } catch (err) {
    labelsCount.textContent = "—";
    labelsTbody.replaceChildren();
    labelsNote.textContent = `Hata: ${err && err.message ? err.message : err}`;
    show(labelsPreview);
    await logError("extract-labels", err);
  } finally {
    extractLabelsBtn.disabled = false;
    extractLabelsBtn.textContent = "Yeniden Çıkar";
  }
}

function renderLabelsPreview(labels) {
  const includeSystem = $("labels-include-system")?.checked || false;
  const userLabels = labels.filter((l) => !l.isSystem);
  const systemLabels = labels.filter((l) => l.isSystem);
  const visible = includeSystem ? labels : userLabels;

  // Header count: distinguish user labels from system filters
  const countParts = [];
  countParts.push(`${userLabels.length} kullanıcı etiketi`);
  if (systemLabels.length) countParts.push(`${systemLabels.length} sistem filtresi`);
  labelsCount.textContent = countParts.join(" + ");

  labelsTbody.replaceChildren();
  for (const l of visible.slice(0, 10)) {
    const tr = document.createElement("tr");
    const color = l.hexColor || (typeof l.color === "number" ? `#${l.color.toString(16).padStart(6, "0")}` : "—");
    const swatch = color.startsWith("#") ? `<span class="swatch" style="background:${color}"></span>` : "";
    const sysBadge = l.isSystem ? ` <span class="health-tag">sistem</span>` : "";
    tr.innerHTML = `<td>${esc(l.name || "")}${sysBadge}</td><td>${swatch}${esc(color)}</td><td>${l.count || 0}</td>`;
    labelsTbody.appendChild(tr);
  }

  // Helpful messaging
  let note = "";
  if (userLabels.length === 0 && systemLabels.length > 0) {
    note = "Bu hesapta kullanıcı etiketi bulunamadı — listede yalnızca WA'nın sistem filtreleri var. " +
           "Kullanıcı etiketleri WhatsApp Business özelliğidir; sıradan WhatsApp hesabında etiket oluşturulamaz.";
  } else if (visible.length === 0) {
    note = "Etiket bulunamadı. Sistem filtrelerini görmek için yukarıdaki kutucuğu işaretleyin.";
  } else if (visible.length > 10) {
    note = `İlk 10 / ${visible.length} ${includeSystem ? "etiket+filtre" : "etiket"} gösteriliyor.`;
  } else {
    note = `${visible.length} ${includeSystem ? "etiket+filtre" : "etiket"} listelendi.`;
  }
  labelsNote.textContent = note;

  show(labelsPreview);
  show(labelsExportRow);
}

async function exportLabelsCsv() {
  const labels = state.labels.extracted;
  if (!labels || labels.length === 0) return;
  labelsExportCsv.disabled = true;
  labelsExportCsv.textContent = "Hazırlanıyor…";
  try {
    const includeSystem = $("labels-include-system")?.checked || false;
    const { blob, rows } = labelsToCsvBlob(labels, { includeSystem });
    if (rows.length === 0) {
      alert(includeSystem
        ? "Etiket/filtre bulunamadı."
        : "Kullanıcı etiketi bulunamadı. Sistem filtrelerini de eklemek için \"Sistem filtrelerini de göster\" işaretini açın.");
      return;
    }
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-labels-${stamp()}.csv`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`İndirme hatası: ${err && err.message ? err.message : err}`);
    await logError("export-labels-csv", err);
  } finally {
    labelsExportCsv.disabled = false;
    labelsExportCsv.textContent = "CSV indir";
  }
}

// ---------------- Contacts tab ------------------

async function extractContacts() {
  if (!currentTab) return;
  extractContactsBtn.disabled = true;
  extractContactsBtn.textContent = "Çıkarılıyor…";
  hide(contactsPreview);
  hide(contactsExportRow);
  try {
    const reply = await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "list-contacts" });
    if (!reply || !reply.ok) throw new Error(reply?.error || "list-contacts failed");
    state.contacts.extracted = reply.data || [];
    renderContactsPreview(state.contacts.extracted);
  } catch (err) {
    contactsCount.textContent = "—";
    contactsTbody.replaceChildren();
    contactsNote.textContent = `Hata: ${err && err.message ? err.message : err}`;
    show(contactsPreview);
    await logError("extract-contacts", err);
  } finally {
    extractContactsBtn.disabled = false;
    extractContactsBtn.textContent = "Yeniden Çıkar";
  }
}

function renderContactsPreview(contacts) {
  const saved = contacts.filter((c) => c.isMyContact).length;
  contactsCount.textContent = `${contacts.length} kişi · ${saved} kayıtlı`;
  contactsTbody.replaceChildren();
  const visible = contactsIncludeUnsavedCb.checked ? contacts : contacts.filter((c) => c.isMyContact);
  for (const c of visible.slice(0, 10)) {
    const tr = document.createElement("tr");
    const name = c.name || c.formattedName || c.verifiedName || c.pushName || "(isimsiz)";
    const phone = c.phone || "—";
    const type = c.isBusiness ? "İşletme" : (c.isMyContact ? "Kayıtlı" : "Kayıtsız");
    tr.innerHTML = `<td>${esc(name)}</td><td>${esc(phone)}</td><td>${type}</td>`;
    contactsTbody.appendChild(tr);
  }
  contactsNote.textContent = visible.length > 10 ? `İlk 10 / ${visible.length} kişi gösteriliyor.` : `${visible.length} kişi listelendi.`;
  show(contactsPreview);
  show(contactsExportRow);
}

async function exportContactsCsv() {
  const contacts = state.contacts.extracted;
  if (!contacts || contacts.length === 0) return;
  contactsExportCsv.disabled = true;
  contactsExportCsv.textContent = "Hazırlanıyor…";
  try {
    const includeUnsaved = contactsIncludeUnsavedCb.checked;
    const { blob, rows } = contactsToCsvBlob(contacts, { includeUnsaved });
    if (rows.length === 0) {
      alert("Filtreden geçen kayıt yok. \"Kayıtlı olmayan kişileri dahil et\" işaretini deneyin.");
      return;
    }
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-contacts-${stamp()}.csv`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`İndirme hatası: ${err && err.message ? err.message : err}`);
    await logError("export-contacts-csv", err);
  } finally {
    contactsExportCsv.disabled = false;
    contactsExportCsv.textContent = "CSV indir";
  }
}

// ---------------- AI tab ------------------

async function loadAiSettings() {
  const ai = await getAiSettings();
  aiProviderSelect.value = ai.provider || "ollama";
  await applyProviderUI(ai);
  showMigrationBannerIfAny(ai);
}

function showMigrationBannerIfAny(ai) {
  const banner = $("ai-migration-banner");
  const body = $("ai-migration-body");
  const close = $("ai-migration-close");
  if (!banner || !ai.modelMigrationNote) return;
  body.textContent = ai.modelMigrationNote;
  banner.hidden = false;
  close.onclick = async () => {
    banner.hidden = true;
    await clearAiMigrationNote();
  };
}

async function applyProviderUI(ai) {
  const cfg = PROVIDERS[ai.provider] || PROVIDERS.ollama;
  aiBaseUrlRow.hidden = false; // we always allow override
  aiApiKeyRow.hidden = !cfg.requiresKey;
  aiBaseUrlInput.value = ai.baseUrl || cfg.defaultBaseUrl;
  renderAiInfoBanner(ai, cfg);

  const currentModel = ai.model || cfg.defaultModel;
  aiModelInput.value = currentModel;
  populateModelSelect(cfg.suggestedModels || [], currentModel);
  renderModelInfo(currentModel);

  aiHelpLink.href = cfg.helpLink;
  aiHelpLink.textContent = cfg.id === "anthropic" ? "Anahtar nasıl alınır?" : "Kurulum rehberi";
  aiProviderHelp.innerHTML = providerHelpHtml(cfg.id);
  if (ai.apiKey && cfg.requiresKey) {
    aiApiKeyInput.placeholder = "•••• kayıtlı (yenisi için yaz ve Kaydet'e bas)";
  } else {
    aiApiKeyInput.placeholder = cfg.id === "anthropic" ? "sk-ant-..." : "(opsiyonel)";
  }
  await refreshAiStatus();
}

// Single dropdown holds suggested models + a sentinel "Manuel yaz" option at
// the bottom. Picking it swaps to a text input. Picking any model swaps back.
function populateModelSelect(modelIds, currentModel) {
  aiModelSelect.replaceChildren();
  let currentIsKnown = false;
  for (const id of modelIds) {
    const meta = MODEL_META[id];
    const opt = document.createElement("option");
    opt.value = id;
    if (meta) {
      const trStars = "⭐".repeat(meta.trQuality);
      opt.textContent = `${meta.label}  ·  ${meta.ram} RAM  ·  TR ${trStars}`;
    } else {
      opt.textContent = id;
    }
    if (id === currentModel) { opt.selected = true; currentIsKnown = true; }
    aiModelSelect.appendChild(opt);
  }
  // If current model is custom (not in list), add it as an extra option.
  if (currentModel && !currentIsKnown) {
    const opt = document.createElement("option");
    opt.value = currentModel;
    opt.textContent = `${currentModel}  ·  (özel)`;
    opt.selected = true;
    aiModelSelect.appendChild(opt);
  }
  const sep = document.createElement("option");
  sep.disabled = true;
  sep.textContent = "──────────";
  aiModelSelect.appendChild(sep);
  const manual = document.createElement("option");
  manual.value = MODEL_MANUAL_VALUE;
  manual.textContent = "✏️  Manuel yaz...";
  aiModelSelect.appendChild(manual);

  // Mode: manual input visible only when MANUAL is the active value.
  setManualMode(false);
}

function setManualMode(on) {
  aiModelInput.hidden = !on;
  aiModelSelect.hidden = on;
  if (on) {
    setTimeout(() => { aiModelInput.focus(); aiModelInput.select(); }, 0);
  }
}

function onModelSelectChange() {
  const id = aiModelSelect.value;
  if (id === MODEL_MANUAL_VALUE) {
    setManualMode(true);
    renderModelInfo(aiModelInput.value.trim());
    return;
  }
  if (!id) { aiModelInfo.hidden = true; return; }
  aiModelInput.value = id;
  renderModelInfo(id);
}

function renderModelInfo(modelId) {
  if (!modelId) { aiModelInfo.hidden = true; return; }
  const meta = MODEL_META[modelId];
  if (!meta) {
    aiModelInfo.hidden = false;
    aiModelInfo.innerHTML = `<div class="ai-model-info__head"><span class="ai-model-info__title">${escHtml(modelId)}</span><span class="ai-model-info__vendor">özel</span></div><div class="ai-model-info__desc">Bu model için detaylı bilgi mevcut değil; kurulum komutu: <code>ollama pull ${escHtml(modelId)}</code></div>`;
    return;
  }
  const trStars = "⭐".repeat(meta.trQuality) + "☆".repeat(5 - meta.trQuality);
  const speedStars = "⚡".repeat(meta.speed) + "·".repeat(5 - meta.speed);
  aiModelInfo.hidden = false;
  aiModelInfo.innerHTML = `
    <div class="ai-model-info__head">
      <span class="ai-model-info__title">${escHtml(meta.label)}</span>
      <span class="ai-model-info__vendor">${escHtml(meta.vendor)}</span>
    </div>
    <div class="ai-model-info__meta">
      <span><strong>İndirme:</strong> ${escHtml(meta.size)}</span>
      <span><strong>RAM:</strong> ${escHtml(meta.ram)}</span>
      <span><strong>TR:</strong> ${trStars}</span>
      <span><strong>Hız:</strong> ${speedStars}</span>
    </div>
    <div class="ai-model-info__desc">${escHtml(meta.description)}</div>
    <div class="ai-model-info__best"><strong>İdeal:</strong> ${escHtml(meta.bestFor)}</div>
  `;
}

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// AI info banner — kompakt tek satır + isteğe bağlı detay.
function renderAiInfoBanner(ai, cfg) {
  const el = $("ai-info");
  if (!el) return;
  let summary, detail;
  if (cfg.id === "anthropic") {
    summary = "Anthropic Claude · veriler Anthropic'e gider · API anahtarınızla";
    detail = "İstekler tarayıcıdan doğrudan <strong>api.anthropic.com</strong>'a gider. API anahtarı yalnızca bu cihazda saklanır; aracı sunucu yok. Maliyet kendi Anthropic hesabınıza yansır.";
  } else if (cfg.id === "openai") {
    summary = "OpenAI ChatGPT · veriler OpenAI'ya gider · API anahtarınızla";
    detail = "İstekler tarayıcıdan doğrudan <strong>api.openai.com</strong>'a gider. API anahtarı yalnızca bu cihazda saklanır. Maliyet kendi OpenAI hesabınıza yansır.";
  } else if (cfg.id === "gemini") {
    summary = "Google Gemini · veriler Google'a gider · ücretsiz tier mevcut";
    detail = "İstekler tarayıcıdan doğrudan Google AI Studio'ya gider. Ücretsiz tier: günde 1500 istek (Gemini 2.0 Flash). Anahtar bu cihazda saklanır.";
  } else if (cfg.id === "groq") {
    summary = "Groq · veriler Groq'a gider · ücretsiz tier · çok hızlı";
    detail = "İstekler tarayıcıdan doğrudan <strong>api.groq.com</strong>'a gider. Açık modelleri (Llama 3.3 70B, Qwen, DeepSeek) bulut donanımında çalıştırır — saniyede ~500 token. Cömert ücretsiz tier.";
  } else if (cfg.id === "ollama") {
    const url = (ai.baseUrl || cfg.defaultBaseUrl).replace(/\/v1\/?$/, "");
    summary = `Yerel Ollama · 0 ₺ · veriler bilgisayarınızda`;
    detail = `İstekler tarayıcıdan doğrudan yerel Ollama sunucusuna gider (<strong>${escHtml(url)}</strong>). Mesajlar internete çıkmaz.`;
  } else {
    const url = ai.baseUrl || cfg.defaultBaseUrl;
    summary = `Yerel LLM · 0 ₺ · veriler bilgisayarınızda`;
    detail = `İstekler tarayıcıdan doğrudan yerel sunucuya gider (<strong>${escHtml(url)}</strong>). Mesajlar internete çıkmaz.`;
  }
  el.innerHTML = `
    <div class="ai-info__compact">
      <span class="ai-info__icon">✓</span>
      <span class="ai-info__text">${summary}</span>
      <button type="button" class="ai-info__more" id="ai-info-more">Detay</button>
    </div>
    <div class="ai-info__detail" id="ai-info-detail" hidden>${detail}</div>
  `;
  const moreBtn = $("ai-info-more");
  const detailEl = $("ai-info-detail");
  if (moreBtn && detailEl) {
    moreBtn.addEventListener("click", () => {
      detailEl.hidden = !detailEl.hidden;
      moreBtn.textContent = detailEl.hidden ? "Detay" : "Gizle";
    });
  }
}

function providerHelpHtml(id) {
  if (id === "ollama") {
    return `<strong>Ollama (ücretsiz, yerel):</strong>
      <a href="https://ollama.com/download" target="_blank" rel="noopener">indir</a>,
      <code>ollama pull aya-expanse:8b</code> ile model yükle, sonra
      <code>OLLAMA_ORIGINS=chrome-extension://* ollama serve</code>
      ile çalıştır (CORS izni). Veriler bilgisayardan çıkmaz, maliyet 0 ₺.`;
  }
  if (id === "openai_compat") {
    return `<strong>LM Studio / llama.cpp (ücretsiz, yerel):</strong>
      <a href="https://lmstudio.ai/" target="_blank" rel="noopener">LM Studio</a>'da
      bir model indir → "Local Server"ı başlat (varsayılan port 1234).
      <a href="https://github.com/ggerganov/llama.cpp" target="_blank" rel="noopener">llama.cpp</a>
      için <code>llama-server</code> komutunu kullan.`;
  }
  if (id === "anthropic") {
    return `<strong>Anthropic Claude:</strong>
      <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>'dan
      API anahtarı alın. Tipik fiyat: Haiku 4.5 ~$0.001/sohbet, Sonnet 4.6 ~$0.01.
      Mesajlar Anthropic'e gider; maliyet kendi hesabınıza yansır.`;
  }
  if (id === "openai") {
    return `<strong>OpenAI ChatGPT:</strong>
      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com</a>'dan
      API anahtarı alın. Tipik fiyat: gpt-4o-mini ~$0.0002/sohbet, gpt-4o ~$0.005.
      Mesajlar OpenAI'ya gider.`;
  }
  if (id === "gemini") {
    return `<strong>Google Gemini:</strong>
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com</a>'dan
      ücretsiz API anahtarı alın. Gemini 2.0 Flash günde 1500 istek ücretsiz.
      Mesajlar Google'a gider.`;
  }
  if (id === "groq") {
    return `<strong>Groq (çok hızlı):</strong>
      <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com</a>'dan
      ücretsiz API anahtarı alın. Açık modelleri (Llama 3.3 70B, Qwen 2.5) saniyede
      ~500 token hızla çalıştırır. Cömert ücretsiz tier.`;
  }
  return "";
}

async function onProviderChange() {
  // Switching provider — load defaults but don't overwrite saved key.
  const provId = aiProviderSelect.value;
  const cur = await getAiSettings();
  const cfg = PROVIDERS[provId] || PROVIDERS.ollama;
  const next = {
    provider: provId,
    baseUrl: cur.provider === provId ? (cur.baseUrl || cfg.defaultBaseUrl) : cfg.defaultBaseUrl,
    model: cur.provider === provId ? (cur.model || cfg.defaultModel) : cfg.defaultModel,
  };
  await applyProviderUI({ ...cur, ...next });
}

async function saveAiSettings() {
  const provider = aiProviderSelect.value;
  const baseUrl = aiBaseUrlInput.value.trim();
  const model = aiModelInput.value.trim();
  const newKey = aiApiKeyInput.value.trim();
  const patch = { provider, baseUrl, model };
  if (newKey) patch.apiKey = newKey;
  await setAiSettings(patch);
  aiApiKeyInput.value = "";
  aiSaveKeyBtn.textContent = "Kaydedildi ✓";
  setTimeout(() => (aiSaveKeyBtn.textContent = "Kaydet"), 1500);
  await refreshAiStatus();
}

async function testAiConnection() {
  const orig = aiTestKeyBtn.textContent;
  aiTestKeyBtn.disabled = true;
  aiTestKeyBtn.textContent = "Test ediliyor…";
  try {
    const ai = await getAiSettings();
    const res = await pingProvider(ai);
    if (res.ok) {
      aiTestKeyBtn.textContent = `✓ ${res.ms}ms`;
    } else {
      alert(`Bağlantı başarısız (${res.ms}ms):\n${res.error}`);
      aiTestKeyBtn.textContent = "✗ başarısız";
    }
  } catch (err) {
    alert(`Test hatası: ${err.message || err}`);
    aiTestKeyBtn.textContent = "✗ hata";
  } finally {
    setTimeout(() => { aiTestKeyBtn.textContent = orig; aiTestKeyBtn.disabled = false; }, 2500);
  }
}

async function refreshAiStatus() {
  const ai = await getAiSettings();
  const cfg = PROVIDERS[ai.provider] || PROVIDERS.ollama;
  const ready = !cfg.requiresKey || !!ai.apiKey;
  aiStatus.textContent = ready ? `Hazır · ${cfg.label} · ${ai.model || cfg.defaultModel}` : "Anahtar gerekli";
  refreshAiButtons();
}

async function refreshAiButtons() {
  const ai = await getAiSettings();
  const cfg = PROVIDERS[ai.provider] || PROVIDERS.ollama;
  const ready = !cfg.requiresKey || !!ai.apiKey;
  const haveChats = !!(state.chats.extracted && state.chats.extracted.length);
  const haveMsgsForSelected = haveSelectedChatMessages();
  aiSummarizeBtn.disabled = !(ready && haveMsgsForSelected);
  aiFollowupsBtn.disabled = !(ready && haveMsgsForSelected);
  aiTriageBtn.disabled = !(ready && haveChats);
}

function haveSelectedChatMessages() {
  if (!state.messages.extracted) return false;
  const chatId = aiChatSelect.value;
  if (!chatId) return false;
  return state.messages.extracted.some((m) => m.chat_id === chatId);
}

function refreshAiChatSelect() {
  // Populate the select with chats that we have messages for, sorted by most
  // recent activity (not by count). Counts indicate ONLY the messages we
  // managed to extract — not the actual chat history length. We surface a
  // visible warning when the count is too low for AI quality.
  const placeholder = aiChatSelect.querySelector('option[value=""]');
  aiChatSelect.replaceChildren(placeholder);
  if (!state.messages.extracted || state.messages.extracted.length === 0) {
    placeholder.textContent = "— Önce Mesajlar sekmesinden çıkar —";
    refreshAiButtons();
    return;
  }
  placeholder.textContent = "— Sohbet seç —";

  // Aggregate per chat: { name, count, ownCount, lastT }
  const byChat = new Map();
  for (const m of state.messages.extracted) {
    if (!m.chat_id) continue;
    if (!byChat.has(m.chat_id)) {
      byChat.set(m.chat_id, { name: m.chat_name || m.chat_id, count: 0, ownCount: 0, lastT: 0 });
    }
    const e = byChat.get(m.chat_id);
    e.count++;
    if (m.from_me) e.ownCount++;
    if (typeof m.t === "number" && m.t > e.lastT) e.lastT = m.t;
  }

  // Sort by most-recent-first, ties broken by total count descending.
  const sorted = [...byChat.entries()].sort((a, b) => {
    const dt = (b[1].lastT || 0) - (a[1].lastT || 0);
    if (dt !== 0) return dt;
    return b[1].count - a[1].count;
  });

  for (const [id, info] of sorted) {
    const opt = document.createElement("option");
    opt.value = id;
    // Visual cue when too few messages for reliable AI output.
    // <3 own outgoing messages → AI cannot mimic style.
    // <5 total messages → AI lacks context to stay on topic.
    let badge = "";
    if (info.count < 3) badge = " ⚠️ az veri";
    else if (info.ownCount < 3) badge = " ⚠️ üslup yetersiz";
    opt.textContent = `${info.name} (${info.count} mesaj${badge})`;
    aiChatSelect.appendChild(opt);
  }
  refreshAiButtons();
}

async function saveAiKey() {
  const key = aiApiKeyInput.value.trim();
  const model = aiModelSelect.value;
  if (!key && !(await getAiSettings()).apiKey) {
    alert("API anahtarı boş olamaz.");
    return;
  }
  const patch = { model };
  if (key) patch.apiKey = key;
  await setAiSettings(patch);
  aiApiKeyInput.value = "";
  aiApiKeyInput.placeholder = "•••• kayıtlı (yeni anahtar girip Kaydet'e basın)";
  aiSaveKeyBtn.textContent = "Kaydedildi ✓";
  setTimeout(() => (aiSaveKeyBtn.textContent = "Kaydet"), 1500);
  await refreshAiStatus();
}

async function clearAiKey() {
  if (!confirm("API anahtarı silinsin mi?")) return;
  await setAiSettings({ apiKey: "" });
  aiApiKeyInput.value = "";
  aiApiKeyInput.placeholder = "sk-ant-...";
  await refreshAiStatus();
}

function showAiOutput(title, text, usage) {
  aiOutputTitle.textContent = title;
  aiOutputBody.textContent = text;
  const parts = [];
  if (usage) {
    if (usage.input_tokens) parts.push(`giriş: ${usage.input_tokens} token`);
    if (usage.output_tokens) parts.push(`çıkış: ${usage.output_tokens} token`);
  }
  aiOutputMeta.textContent = parts.join(" · ");
  aiOutput.hidden = false;
}

function aiBusy(btn, on, idleText) {
  if (on) {
    btn.dataset.idle = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Üretiliyor… (5-30sn)";
  } else {
    btn.disabled = false;
    btn.textContent = idleText || btn.dataset.idle || btn.textContent;
  }
}

async function runAiSummarize() {
  if (!await requirePro({ feature: "AI Sohbet Özeti", anchorEl: aiSummarizeBtn })) return;
  const ai = await getAiSettings();
  const chatId = aiChatSelect.value;
  if (!chatId) return;
  const messages = state.messages.extracted.filter((m) => m.chat_id === chatId);
  const chatName = (messages[0] && messages[0].chat_name) || chatId;
  const instructions = aiChatInstructions ? aiChatInstructions.value.trim() : "";
  aiBusy(aiSummarizeBtn, true);
  try {
    const res = await summarizeChat({ ...ai, messages, chatName, instructions });
    showAiOutput(`Özet — ${chatName}`, res.text, res.usage);
  } catch (err) {
    alert(`AI hatası: ${err.message || err}`);
    await logError("ai-summarize", err);
  } finally {
    aiBusy(aiSummarizeBtn, false, "Özet üret");
  }
}

// State for the iterative single-suggestion session.
const suggestionSession = {
  chatId: null,
  rejected: [],   // strings — suggestions the user refreshed past
  current: null,  // { suggestion, target, mode, usage }
};

async function runAiFollowups() {
  if (!await requirePro({ feature: "AI Cevap Önerileri", anchorEl: aiFollowupsBtn })) return;
  const ai = await getAiSettings();
  const chatId = aiChatSelect.value;
  if (!chatId) return;
  const messages = state.messages.extracted.filter((m) => m.chat_id === chatId);

  const ownCount = messages.filter((m) => m.from_me && m.body).length;
  const totalNonEmpty = messages.filter((m) => m.body && m.body.trim()).length;
  if (ownCount < 3 || totalNonEmpty < 5) {
    const proceed = confirm(
      `⚠️ Bu sohbet için yeterli mesaj geçmişi yok (${totalNonEmpty} mesaj, sizin: ${ownCount}).\n\n` +
      `AI üslubunuzu ve sohbet bağlamını öğrenmek için en az 5+ mesaj gerekir. ` +
      `Yetersiz bağlamda model genel/varsayım önerileri üretir.\n\n` +
      `Önerilen: Mesajlar sekmesine geçip bu sohbet için "Eski mesaj yükleme turu" seçeneğini 5+ ` +
      `yapıp mesajları yeniden çıkarın.\n\n` +
      `Yine de devam etmek ister misiniz?`
    );
    if (!proceed) return;
  }

  // Reset session if chat changed
  if (suggestionSession.chatId !== chatId) {
    suggestionSession.chatId = chatId;
    suggestionSession.rejected = [];
    suggestionSession.current = null;
  }
  // First-time entry from "Öneri üret" — clear rejected (fresh session)
  suggestionSession.rejected = [];
  suggestionSession.current = null;

  await fetchSuggestion();
}

async function fetchSuggestion(userFeedback = "") {
  const chatId = suggestionSession.chatId || aiChatSelect.value;
  if (!chatId) return;
  const ai = await getAiSettings();
  const messages = state.messages.extracted.filter((m) => m.chat_id === chatId);
  const chatName = (messages[0] && messages[0].chat_name) || chatId;
  const instructions = aiChatInstructions ? aiChatInstructions.value.trim() : "";

  // Show loading state
  showSuggestionCard({ loading: true, chatName });
  aiFollowupsBtn.disabled = true;
  const refreshBtn = $("suggestion-refresh");
  const feedbackBtn = $("suggestion-feedback");
  if (refreshBtn) refreshBtn.disabled = true;
  if (feedbackBtn) feedbackBtn.disabled = true;

  try {
    const res = await suggestOne({
      ...ai, messages, chatName, instructions,
      previousAttempts: suggestionSession.rejected,
      userFeedback,
    });
    suggestionSession.current = {
      suggestion: res.suggestion,
      target: res.target,
      mode: res.mode,
      usage: res.usage,
      chatName,
    };
    showSuggestionCard({
      suggestion: res.suggestion,
      target: res.target,
      mode: res.mode,
      usage: res.usage,
      chatName,
      ownCount: messages.filter((m) => m.from_me && m.body).length,
    });
  } catch (err) {
    alert(`AI hatası: ${err.message || err}`);
    await logError("ai-suggest-one", err);
    hide($("suggestion-card"));
  } finally {
    aiFollowupsBtn.disabled = false;
    if (refreshBtn) refreshBtn.disabled = false;
    if (feedbackBtn) feedbackBtn.disabled = false;
  }
}

function showSuggestionCard({ loading, suggestion, target, mode, usage, chatName, ownCount }) {
  const card = $("suggestion-card");
  const title = $("suggestion-title");
  const targetEl = $("suggestion-target");
  const body = $("suggestion-body");
  const meta = $("suggestion-meta");
  const history = $("suggestion-history");
  const historyList = $("suggestion-history-list");
  if (!card) return;

  // Hide the legacy 3-suggestion text panel
  const legacy = $("ai-output");
  if (legacy) legacy.hidden = true;

  if (loading) {
    title.textContent = `Öneri hazırlanıyor — ${chatName}`;
    targetEl.innerHTML = "";
    body.className = "suggestion-body suggestion-body--loading";
    body.textContent = "AI çalışıyor… (5–30 sn)";
    meta.textContent = "";
    card.hidden = false;
    return;
  }

  title.textContent = mode === "reminder"
    ? `Takip mesajı — ${chatName} (cevap bekleniyor)`
    : `Cevap önerisi — ${chatName}`;

  if (target?.body) {
    const label = target.fromMe ? "Senin yanıtsız mesajın" : `${target.sender || "Karşı taraf"}'ın mesajı`;
    targetEl.innerHTML = `📩 <span class="suggestion-target__label">${esc(label)}:</span><span class="suggestion-target__quote">${esc(target.body)}</span>`;
  } else {
    targetEl.innerHTML = "";
  }

  body.className = "suggestion-body";
  body.textContent = suggestion;

  const parts = [];
  if (suggestionSession.rejected.length > 0) parts.push(`${suggestionSession.rejected.length}. deneme`);
  if (typeof ownCount === "number" && ownCount < 3) parts.push(`üslup örneği az (${ownCount})`);
  if (usage?.input_tokens) parts.push(`giriş: ${usage.input_tokens} tok`);
  if (usage?.output_tokens) parts.push(`çıkış: ${usage.output_tokens} tok`);
  meta.textContent = parts.join(" · ");

  // History of rejected suggestions
  if (suggestionSession.rejected.length > 0) {
    history.hidden = false;
    historyList.replaceChildren();
    for (const r of suggestionSession.rejected) {
      const li = document.createElement("li");
      li.textContent = r.length > 120 ? r.slice(0, 117) + "…" : r;
      historyList.appendChild(li);
    }
  } else {
    history.hidden = true;
  }

  card.hidden = false;
}

function bindSuggestionCardOnce() {
  if (bindSuggestionCardOnce._bound) return;
  bindSuggestionCardOnce._bound = true;

  // Refresh — push current to rejected, request a different one
  const refresh = $("suggestion-refresh");
  if (refresh) refresh.addEventListener("click", async () => {
    if (suggestionSession.current?.suggestion) {
      suggestionSession.rejected.push(suggestionSession.current.suggestion);
    }
    await fetchSuggestion("");
  });

  // Feedback — show textarea
  const feedback = $("suggestion-feedback");
  const feedbackRow = $("suggestion-feedback-row");
  if (feedback && feedbackRow) feedback.addEventListener("click", () => {
    feedbackRow.hidden = !feedbackRow.hidden;
    if (!feedbackRow.hidden) $("suggestion-feedback-text")?.focus();
  });

  // Apply feedback — push current to rejected, fetch with user steering
  const apply = $("suggestion-feedback-apply");
  if (apply) apply.addEventListener("click", async () => {
    const text = $("suggestion-feedback-text")?.value.trim() || "";
    if (suggestionSession.current?.suggestion) {
      suggestionSession.rejected.push(suggestionSession.current.suggestion);
    }
    feedbackRow.hidden = true;
    await fetchSuggestion(text);
    const ta = $("suggestion-feedback-text");
    if (ta) ta.value = "";
  });

  // Cancel feedback row
  const cancel = $("suggestion-feedback-cancel");
  if (cancel) cancel.addEventListener("click", () => { feedbackRow.hidden = true; });

  // Copy current suggestion
  const copyBtn = $("suggestion-copy");
  setupCopyButton(copyBtn, () => suggestionSession.current?.suggestion || "", { force: true });
}

// Per-chat AI instructions: load on chat selection, persist on save.
async function onAiChatSelectChange() {
  const id = aiChatSelect.value;
  if (aiChatInstructions) {
    aiChatInstructions.value = id ? await getAiChatInstruction(id) : "";
    updateInstructionHint(aiChatInstructions.value ? "saved" : "empty");
  }
  refreshAiButtons();
}

async function saveAiChatInstruction() {
  const id = aiChatSelect.value;
  if (!id) {
    alert("Önce bir sohbet seçin.");
    return;
  }
  if (!aiChatInstructions) return;
  const text = aiChatInstructions.value.trim();
  await setAiChatInstruction(id, text);
  updateInstructionHint("saved");
  if (aiInstructionsSave) {
    const orig = aiInstructionsSave.textContent;
    aiInstructionsSave.textContent = "Kaydedildi ✓";
    setTimeout(() => (aiInstructionsSave.textContent = orig), 1500);
  }
}

function updateInstructionHint(state) {
  if (!aiInstructionsHint) return;
  if (state === "saved") {
    aiInstructionsHint.textContent = "Bu sohbet için talimat kaydedildi.";
    aiInstructionsHint.classList.add("ai-instructions__hint--saved");
  } else if (state === "dirty") {
    aiInstructionsHint.textContent = "Kaydedilmemiş değişiklik — Talimatı kaydet'e basın.";
    aiInstructionsHint.classList.remove("ai-instructions__hint--saved");
  } else {
    aiInstructionsHint.textContent = "";
    aiInstructionsHint.classList.remove("ai-instructions__hint--saved");
  }
}

async function runAiTriage() {
  if (!await requirePro({ feature: "Sohbet Önceliklendirme", anchorEl: aiTriageBtn })) return;
  const ai = await getAiSettings();
  if (!state.chats.extracted || state.chats.extracted.length === 0) {
    alert("Önce Sohbetler sekmesinde 'Çıkar' deyin.");
    return;
  }
  aiBusy(aiTriageBtn, true);
  try {
    const res = await triageChats({ ...ai, chats: state.chats.extracted });
    renderTriageResult(res);
  } catch (err) {
    alert(`AI hatası: ${err.message || err}`);
    await logError("ai-triage", err);
  } finally {
    aiBusy(aiTriageBtn, false, "Sıralamayı üret");
  }
}

function renderTriageResult(res) {
  // Hide the plain text output and show the structured triage view.
  const aiOutEl = $("ai-output");
  const triageOut = $("ai-triage-output");
  const list = $("ai-triage-list");
  const stats = $("ai-triage-stats");
  const meta = $("ai-triage-meta");
  if (aiOutEl) aiOutEl.hidden = true;
  if (!triageOut || !list) return;

  list.replaceChildren();

  // Iterate over the deterministic ranking. For each ranked chat, show the
  // AI's reason if it was verified, else fall back to a simple summary line.
  const verifiedByChatId = new Map();
  for (const r of res.parsed.rows) {
    if (r.verified && r.chat) verifiedByChatId.set(r.chat.id, r);
  }

  res.ranked.forEach(({ chat, score }, i) => {
    const li = document.createElement("li");
    const verified = verifiedByChatId.get(chat.id);
    li.className = "triage-row " + (verified ? "triage-row--verified" : "triage-row--unverified");

    const name = chat.contactName || chat.formattedName || chat.name || chat.formattedTitle || chat.phone || chat.id || "?";
    const dis = computeDisplayDisambig(chat);
    const lm = chat.lastMessage;
    const fromMe = lm && lm.fromMe;
    const fallbackReason = lm && lm.body
      ? `${fromMe ? "siz: " : ""}${lm.body.slice(0, 80)}`
      : "(içerik yok)";
    const reason = verified ? verified.reason : `[AI bu satırı üretmedi] ${fallbackReason}`;

    const tags = [];
    if (chat.unreadCount > 0) tags.push(`<span class="triage-tag triage-tag--unread">${chat.unreadCount} ok'mamış</span>`);
    if (chat.pinned) tags.push(`<span class="triage-tag triage-tag--pinned">📌</span>`);
    if (chat.isGroup) tags.push(`<span class="triage-tag">GRUP</span>`);

    li.innerHTML = `
      <span class="triage-num">${i + 1}.</span>
      <span class="triage-name-block">
        <span class="triage-name">${esc(name)}</span>
        <span class="triage-disambig">${esc(dis)}</span>
        ${tags.length ? `<span class="triage-tags">${tags.join("")}</span>` : ""}
      </span>
      <span class="triage-badge ${verified ? "triage-badge--ok" : "triage-badge--warn"}"
            title="${verified ? "Girdideki sohbetle eşleşti" : "AI bu satır için doğrulanabilir gerekçe üretmedi"}">
        ${verified ? "✓" : "⚠️"}
      </span>
      <span class="triage-reason">— ${esc(reason)}</span>
    `;
    list.appendChild(li);
  });

  // Append any AI lines that didn't match any chat (true hallucinations)
  for (const r of res.parsed.rows) {
    if (r.verified) continue;
    const li = document.createElement("li");
    li.className = "triage-row triage-row--unverified";
    li.innerHTML = `
      <span class="triage-num">?</span>
      <span class="triage-name-block">
        <span class="triage-name">${esc(r.name || "(?)")}</span>
        <span class="triage-disambig">${esc(r.disambig || "")}</span>
      </span>
      <span class="triage-badge triage-badge--warn"
            title="Bu isim girdideki sohbetlerle eşleşmedi — AI uydurmuş olabilir">⚠️</span>
      <span class="triage-reason">— ${esc(r.reason || r.rawLine || "")}</span>
    `;
    list.appendChild(li);
  }

  const verified = res.parsed.stats.verified;
  const unmatched = res.parsed.stats.unmatched;
  const total = res.ranked.length;
  stats.innerHTML = `
    <span class="triage-stats__verified">✓ ${verified} doğrulandı</span>
    ${unmatched > 0 ? ` · <span class="triage-stats__unmatched">⚠️ ${unmatched} uyumsuz</span>` : ""}
    · ${total} sohbet kural-tabanlı sıralandı
  `;

  const usageParts = [];
  if (res.usage?.input_tokens) usageParts.push(`giriş: ${res.usage.input_tokens} token`);
  if (res.usage?.output_tokens) usageParts.push(`çıkış: ${res.usage.output_tokens} token`);
  meta.textContent = usageParts.join(" · ");

  triageOut.hidden = false;

  // Build a clean Markdown for the copy button
  const mdLines = res.ranked.map(({ chat }, i) => {
    const v = verifiedByChatId.get(chat.id);
    const name = chat.contactName || chat.formattedName || chat.name || chat.formattedTitle || chat.phone || chat.id;
    const dis = computeDisplayDisambig(chat);
    const reason = v ? v.reason : (chat.lastMessage?.body || "(içerik yok)").slice(0, 80);
    return `${i + 1}. ${name} (${dis}) — ${reason}`;
  });
  const copyBtn = $("ai-triage-copy");
  if (copyBtn) setupCopyButton(copyBtn, () => mdLines.join("\n"), { force: true });
}

// ----- Modern copy button (Claude-tarzı clipboard ikonu + check feedback) ---
const COPY_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;
const CHECK_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

function setupCopyButton(btn, getText, opts = {}) {
  if (!btn) return;
  // Replace any existing text/handlers with the icon-based UX. `force` lets
  // us re-bind even if a previous setup already attached a listener.
  if (btn.dataset.copyBound === "1" && !opts.force) return;
  btn.dataset.copyBound = "1";
  btn.classList.add("copy-btn");
  btn.innerHTML = COPY_ICON_SVG;
  btn.title = "Kopyala";
  btn.setAttribute("aria-label", "Kopyala");
  btn.onclick = async () => {
    try {
      const text = typeof getText === "function" ? getText() : getText;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      btn.innerHTML = CHECK_ICON_SVG;
      btn.title = "Kopyalandı ✓";
      btn.setAttribute("aria-label", "Kopyalandı");
      btn.classList.add("copy-btn--success");
      setTimeout(() => {
        btn.innerHTML = COPY_ICON_SVG;
        btn.title = "Kopyala";
        btn.setAttribute("aria-label", "Kopyala");
        btn.classList.remove("copy-btn--success");
      }, 1800);
    } catch (err) {
      btn.title = "Kopyalanamadı";
      btn.classList.add("copy-btn--error");
      setTimeout(() => btn.classList.remove("copy-btn--error"), 1800);
    }
  };
}

function computeDisplayDisambig(chat) {
  if (chat.phone) {
    const digits = String(chat.phone).replace(/[^\d]/g, "");
    if (digits.length >= 2) return "•••" + digits.slice(-4).padStart(4, "•").slice(-4);
  }
  if (chat.lidUser) {
    const d = String(chat.lidUser).replace(/[^\d]/g, "");
    if (d.length >= 2) return "lid•" + d.slice(-4).padStart(4, "•").slice(-4);
  }
  if (chat.id) {
    const tail = String(chat.id).replace(/[^a-zA-Z0-9]/g, "").slice(-6);
    if (tail) return "id•" + tail;
  }
  return "?";
}

// ---------------- Otomatik Cevap (Auto-Reply) ------------------

async function loadAutoReplySettings() {
  const ar = await getAutoReply();
  arMasterEnabled.checked = !!ar.masterEnabled;
  arMode.value = ar.mode || "draft";
  arMaxHour.value = ar.rateLimit?.maxPerHour ?? 10;
  arMaxDay.value = ar.rateLimit?.maxPerDay ?? 50;
  arQuietEnabled.checked = !!ar.quietHours?.enabled;
  arQuietStart.value = ar.quietHours?.startHour ?? 22;
  arQuietEnd.value = ar.quietHours?.endHour ?? 8;
  arStatus.textContent = ar.masterEnabled ? `Açık · ${ar.mode === "auto" ? "Otomatik" : "Taslak"}` : "Kapalı";
  refreshAutoReplyChatSelect();
  renderPending(ar);
  renderHistory(ar);
  if (ar.masterEnabled) await ensureSubscribed();
}

async function saveAutoReplyMaster() {
  await setAutoReply({
    mode: arMode.value,
    rateLimit: {
      maxPerHour: parseInt(arMaxHour.value, 10) || 10,
      maxPerDay: parseInt(arMaxDay.value, 10) || 50,
    },
    quietHours: {
      enabled: arQuietEnabled.checked,
      startHour: parseInt(arQuietStart.value, 10) || 22,
      endHour: parseInt(arQuietEnd.value, 10) || 8,
    },
  });
  const ar = await getAutoReply();
  arStatus.textContent = ar.masterEnabled ? `Açık · ${ar.mode === "auto" ? "Otomatik" : "Taslak"}` : "Kapalı";
}

async function onMasterToggle() {
  if (arMasterEnabled.checked && !await requirePro({ feature: "Otomatik Cevap", anchorEl: arMasterEnabled })) {
    arMasterEnabled.checked = false;
    return;
  }
  await setAutoReply({ masterEnabled: arMasterEnabled.checked });
  if (arMasterEnabled.checked) {
    await ensureSubscribed();
    arStatus.textContent = "Açık · " + (arMode.value === "auto" ? "Otomatik" : "Taslak");
  } else {
    await unsubscribe();
    arStatus.textContent = "Kapalı";
  }
}

async function ensureSubscribed() {
  if (!currentTab) return;
  try {
    await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "subscribe-new-messages" });
  } catch (err) {
    await logError("ar-subscribe", err);
  }
}

async function unsubscribe() {
  if (!currentTab) return;
  try {
    await chrome.tabs.sendMessage(currentTab.id, { kind: "WA_REQ", op: "unsubscribe-new-messages" });
  } catch {}
}

function refreshAutoReplyChatSelect() {
  const placeholder = arChatSelect.querySelector('option[value=""]');
  arChatSelect.replaceChildren(placeholder);
  if (!state.chats.extracted || state.chats.extracted.length === 0) {
    placeholder.textContent = "— Önce Sohbetler sekmesinden çıkar —";
    return;
  }
  placeholder.textContent = "— Sohbet seç —";
  for (const c of state.chats.extracted) {
    const opt = document.createElement("option");
    opt.value = c.id;
    const name = c.contactName || c.formattedName || c.name || c.formattedTitle || c.phone || c.id;
    opt.textContent = name + (c.isGroup ? " (grup)" : "");
    arChatSelect.appendChild(opt);
  }
}

async function loadChatPerSettings() {
  const id = arChatSelect.value;
  if (!id) {
    arInstructions.value = "";
    arChatEnabled.checked = false;
    return;
  }
  const ar = await getAutoReply();
  const cfg = ar.perChat[id] || {};
  arInstructions.value = cfg.instructions || "";
  arChatEnabled.checked = !!cfg.enabled;
}

async function saveChatPerSettings() {
  const id = arChatSelect.value;
  if (!id) { alert("Önce bir sohbet seçin."); return; }
  const ar = await getAutoReply();
  ar.perChat[id] = {
    enabled: arChatEnabled.checked,
    instructions: arInstructions.value.trim(),
  };
  await setAutoReply({ perChat: ar.perChat });
  arSaveChat.textContent = "Kaydedildi ✓";
  setTimeout(() => (arSaveChat.textContent = "Sohbet ayarını kaydet"), 1500);
}

function isInQuietHours(qh) {
  if (!qh.enabled) return false;
  const h = new Date().getHours();
  const s = qh.startHour ?? 22, e = qh.endHour ?? 8;
  if (s === e) return false;
  if (s < e) return h >= s && h < e;
  return h >= s || h < e; // wraps around midnight
}

async function checkRateLimit(rl, history) {
  const now = Date.now();
  const hourAgo = now - 3600 * 1000;
  const dayAgo = now - 86400 * 1000;
  const hour = history.filter((h) => h.sent && h.ts >= hourAgo).length;
  const day = history.filter((h) => h.sent && h.ts >= dayAgo).length;
  if (hour >= (rl.maxPerHour || 10)) return "saat başı limit aşıldı";
  if (day >= (rl.maxPerDay || 50)) return "gün başı limit aşıldı";
  return null;
}

async function handleIncomingMessage(rec) {
  // Called whenever inject.js posts a new INCOMING message.
  try {
    const ar = await getAutoReply();
    if (!ar.masterEnabled) return;
    // Pro gate: silently no-op for free users (no UI prompt — auto-reply runs
    // in background; surfacing prompts here would spam the user).
    const { isPro } = await import("../license/license-manager.js");
    if (!await isPro()) return;
    const chatCfg = ar.perChat[rec.chat_id];
    if (!chatCfg || !chatCfg.enabled) return;

    if (isInQuietHours(ar.quietHours)) {
      await appendAutoReplyHistory({ chatId: rec.chat_id, chatName: rec.chat_name, incoming: rec.body, sent: false, status: "sessiz-saat" });
      await loadAutoReplySettings();
      return;
    }
    const limitErr = await checkRateLimit(ar.rateLimit, ar.history);
    if (limitErr) {
      await appendAutoReplyHistory({ chatId: rec.chat_id, chatName: rec.chat_name, incoming: rec.body, sent: false, status: limitErr });
      await loadAutoReplySettings();
      return;
    }

    // Build the chat history snippet from messages tab if available, else
    // fall back to a single-line context.
    let chatMessages = [];
    if (state.messages.extracted) {
      chatMessages = state.messages.extracted.filter((m) => m.chat_id === rec.chat_id);
    }
    if (!chatMessages.length) {
      chatMessages = [{ from_me: false, sender_name: rec.sender_name, body: rec.body, t: rec.t }];
    }

    const ai = await getAiSettings();
    const draftRes = await draftAutoReply({
      ...ai, messages: chatMessages, lastIncoming: rec.body || "", chatName: rec.chat_name, instructions: chatCfg.instructions,
    });
    const draft = (draftRes.text || "").trim();
    if (!draft) {
      await appendAutoReplyHistory({ chatId: rec.chat_id, chatName: rec.chat_name, incoming: rec.body, sent: false, status: "boş-cevap" });
      await loadAutoReplySettings();
      return;
    }

    const mode = chatCfg.mode || ar.mode || "draft";
    if (mode === "auto") {
      // Send immediately
      try {
        const reply = await chrome.tabs.sendMessage(currentTab.id, {
          kind: "WA_REQ", op: "send-text-message",
          payload: { chatId: rec.chat_id, body: draft },
        });
        if (!reply || !reply.ok) throw new Error(reply?.error || "send failed");
        await appendAutoReplyHistory({ chatId: rec.chat_id, chatName: rec.chat_name, incoming: rec.body, draft, sent: true, status: "gönderildi" });
      } catch (err) {
        await appendAutoReplyHistory({ chatId: rec.chat_id, chatName: rec.chat_name, incoming: rec.body, draft, sent: false, status: "hata: " + (err.message || err) });
        await logError("ar-auto-send", err);
      }
    } else {
      // Draft mode: queue for user approval
      const cur = await getAutoReply();
      cur.pending.push({
        ts: Date.now(),
        chatId: rec.chat_id,
        chatName: rec.chat_name,
        incoming: rec.body || "",
        draft,
      });
      await setAutoReply({ pending: cur.pending });
    }
    await loadAutoReplySettings();
  } catch (err) {
    await logError("ar-handle-incoming", err);
  }
}

function renderPending(ar) {
  arPendingList.replaceChildren();
  const pending = ar.pending || [];
  arPendingEmpty.hidden = pending.length > 0;
  for (let i = pending.length - 1; i >= 0; i--) {
    const p = pending[i];
    const card = document.createElement("div");
    card.className = "ar-card";
    const when = new Date(p.ts).toLocaleString("tr-TR");
    card.innerHTML = `
      <div class="ar-card__head"><span class="ar-card__name">${esc(p.chatName)}</span><span>${esc(when)}</span></div>
      <div class="ar-card__incoming">${esc(p.incoming || "(boş)")}</div>
      <div class="ar-card__draft"><textarea data-idx="${i}">${esc(p.draft)}</textarea></div>
      <div class="ar-card__actions">
        <button class="btn btn--primary" data-action="send" data-idx="${i}">Gönder</button>
        <button class="btn" data-action="discard" data-idx="${i}">Sil</button>
      </div>`;
    arPendingList.appendChild(card);
  }
  arPendingList.querySelectorAll("button[data-action]").forEach((b) => {
    b.addEventListener("click", onPendingAction);
  });
}

async function onPendingAction(e) {
  const idx = parseInt(e.currentTarget.dataset.idx, 10);
  const action = e.currentTarget.dataset.action;
  const ar = await getAutoReply();
  const item = ar.pending[idx];
  if (!item) return;
  if (action === "discard") {
    ar.pending.splice(idx, 1);
    await setAutoReply({ pending: ar.pending });
    await appendAutoReplyHistory({ chatId: item.chatId, chatName: item.chatName, incoming: item.incoming, draft: item.draft, sent: false, status: "iptal" });
    await loadAutoReplySettings();
    return;
  }
  if (action === "send") {
    // Read possibly-edited draft from the textarea
    const ta = arPendingList.querySelector(`textarea[data-idx="${idx}"]`);
    const draft = ta ? ta.value.trim() : item.draft;
    if (!draft) { alert("Boş mesaj gönderilemez."); return; }
    try {
      const reply = await chrome.tabs.sendMessage(currentTab.id, {
        kind: "WA_REQ", op: "send-text-message",
        payload: { chatId: item.chatId, body: draft },
      });
      if (!reply || !reply.ok) throw new Error(reply?.error || "send failed");
      ar.pending.splice(idx, 1);
      await setAutoReply({ pending: ar.pending });
      await appendAutoReplyHistory({ chatId: item.chatId, chatName: item.chatName, incoming: item.incoming, draft, sent: true, status: "gönderildi" });
    } catch (err) {
      alert(`Gönderim hatası: ${err.message || err}`);
      await logError("ar-manual-send", err);
    }
    await loadAutoReplySettings();
  }
}

function renderHistory(ar) {
  arHistoryList.replaceChildren();
  const hist = (ar.history || []).slice(-20).reverse();
  for (const h of hist) {
    const card = document.createElement("div");
    card.className = "ar-card";
    const when = new Date(h.ts).toLocaleString("tr-TR");
    const statusClass = h.sent ? "sent" : (h.status && /hata/i.test(h.status) ? "error" : "skipped");
    card.innerHTML = `
      <div class="ar-card__head">
        <span class="ar-card__name">${esc(h.chatName || "?")}</span>
        <span class="ar-card__status ar-card__status--${statusClass}">${esc(h.status || (h.sent ? "gönderildi" : "geçildi"))}</span>
      </div>
      <div class="ar-card__incoming">${esc((h.incoming || "").slice(0, 200))}</div>
      ${h.draft ? `<div class="ar-card__draft">${esc(h.draft.slice(0, 200))}</div>` : ""}
      <div class="ar-card__head"><span></span><span>${esc(when)}</span></div>`;
    arHistoryList.appendChild(card);
  }
}

// ---------------- Mesajlar tab ------------------

async function extractMessages() {
  if (!currentTab) return;
  extractMessagesBtn.disabled = true;
  extractMessagesBtn.textContent = "Çıkarılıyor… (uzun sürebilir)";
  hide(messagesPreview);
  hide(messagesExportRow);
  try {
    const requestedLimit = parseInt(messagesPerChatLimitSel.value, 10) || 500;
    const { limit: perChatLimit, capped } = await effectiveMessageLimit(requestedLimit);
    if (capped) {
      const proceed = confirm(
        `Free sürümde sohbet başına en fazla ${FREE_MSG_LIMIT_PER_CHAT} mesaj çıkarılabilir.\n\n` +
        `Seçtiğiniz ${requestedLimit} → ${perChatLimit} olarak sınırlanacak.\n\n` +
        `Daha yüksek limit için Pro sekmesinden lisansınızı aktive edin.\n\nDevam edilsin mi?`
      );
      if (!proceed) {
        extractMessagesBtn.disabled = false;
        extractMessagesBtn.textContent = "Mesajları Çıkar";
        return;
      }
    }
    const loadEarlierBatches = parseInt(messagesLoadEarlierSel.value, 10) || 0;
    const reply = await chrome.tabs.sendMessage(currentTab.id, {
      kind: "WA_REQ",
      op: "list-messages",
      payload: { perChatLimit, loadEarlierBatches },
    });
    if (!reply || !reply.ok) throw new Error(reply?.error || "list-messages failed");
    // Backwards-compat: older inject.js returned a raw array, newer one wraps
    // in { messages, diag } so we can surface load diagnostics.
    const payload = reply.data;
    const msgs = Array.isArray(payload) ? payload : (payload?.messages || []);
    const diag = Array.isArray(payload) ? null : payload?.diag;
    state.messages.extracted = msgs;
    state.messages.diag = diag;
    renderMessagesPreview(msgs, diag);
    refreshAiChatSelect();
  } catch (err) {
    messagesCount.textContent = "—";
    messagesTbody.replaceChildren();
    messagesNote.textContent = `Hata: ${err && err.message ? err.message : err}`;
    show(messagesPreview);
    await logError("extract-messages", err);
  } finally {
    extractMessagesBtn.disabled = false;
    extractMessagesBtn.textContent = "Yeniden Çıkar";
  }
}

function renderMessagesPreview(messages, diag) {
  const distinctChats = new Set(messages.map((m) => m.chat_id)).size;
  const avg = distinctChats ? (messages.length / distinctChats).toFixed(1) : 0;
  messagesCount.textContent = `${messages.length} mesaj · ${distinctChats} sohbet (ort. ${avg} msj/sohbet)`;
  messagesTbody.replaceChildren();

  const sorted = messages.slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  for (const m of sorted.slice(0, 10)) {
    const tr = document.createElement("tr");
    const chatName = m.chat_name || "(?)";
    const sender = m.from_me ? "(siz)" : (m.sender_name || m.sender_phone || "—");
    const body = m.body ? (m.body.length > 50 ? m.body.slice(0, 50) + "…" : m.body) : (m.type ? `[${m.type}]` : "");
    const when = m.t ? new Date(m.t * 1000).toLocaleString("tr-TR") : "—";
    tr.innerHTML = `<td>${esc(chatName)}</td><td>${esc(sender)}</td><td>${esc(body)}</td><td>${esc(when)}</td>`;
    messagesTbody.appendChild(tr);
  }

  // Build a context-aware note. The diagnostic from inject.js tells us which
  // strategy worked for which chats — surface that so user can act on it.
  let note = `${distinctChats} sohbetten ${messages.length} mesaj çekildi.`;
  if (diag) {
    const lastOnly = (diag.msgSource?.lastMessage || 0);
    const real = (diag.msgSource?.getModelsArray || 0) + (diag.msgSource?.["_models"] || 0) + (diag.msgSource?.messages || 0);
    const noLoadStrategy = (diag.loadStrategy?.none || 0);
    const ratio = diag.totalChats ? Math.round(100 * lastOnly / diag.totalChats) : 0;
    if (avg < 2 && lastOnly > real) {
      note += ` ⚠️ Sohbetlerin %${ratio}'i için yalnızca son mesaj alınabildi (WA Web hafızasında daha eskisi yok).`;
      note += ` Daha kaliteli AI çıktısı için WA Web'de **istediğin sohbeti açıp yukarı kaydır** (eski mesajlar yüklenir), sonra "Yeniden Çıkar" de.`;
    } else if (avg >= 2 && avg < 10) {
      note += ` Bağlam için yeterli ama daha iyi AI sonucu için sohbetleri WA Web'de açıp scroll'la, sonra Yeniden Çıkar.`;
    } else {
      note += ` ✓ İyi bağlam.`;
    }
  } else {
    note += ` Daha eski mesajlar için her sohbeti açıp yukarı kaydırın, sonra "Yeniden Çıkar" deyin.`;
  }
  messagesNote.textContent = note;

  show(messagesPreview);
  show(messagesExportRow);
}

async function exportMessagesCsv() {
  const msgs = state.messages.extracted;
  if (!msgs || msgs.length === 0) return;
  messagesExportCsv.disabled = true;
  messagesExportCsv.textContent = "Hazırlanıyor…";
  try {
    const { blob, rows } = messagesToCsvBlob(msgs);
    if (rows.length === 0) { alert("Kayıt yok."); return; }
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-messages-${stamp()}.csv`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`İndirme hatası: ${err && err.message ? err.message : err}`);
    await logError("export-messages-csv", err);
  } finally {
    messagesExportCsv.disabled = false;
    messagesExportCsv.textContent = "CSV indir";
  }
}

// ---------------- XLSX (lazy) ------------------

async function exportXlsx(tabKey, btn) {
  if (!hasAnyExtracted()) {
    alert("Önce en az bir sekmede veri çıkarın.");
    return;
  }
  // Inform user about which sheets will/won't appear so they can decide
  // whether to extract more before exporting.
  const status = {
    Sohbetler: !!state.chats.extracted,
    Mesajlar: !!state.messages.extracted,
    Gruplar: !!state.groups.extracted,
    Etiketler: !!state.labels.extracted,
    Kişiler: !!state.contacts.extracted,
  };
  const included = Object.entries(status).filter(([, v]) => v).map(([k]) => k);
  const excluded = Object.entries(status).filter(([, v]) => !v).map(([k]) => k);
  if (excluded.length > 0) {
    const proceed = confirm(
      `XLSX dosyasında şu sayfalar OLACAK:\n  ✓ ${included.join(", ")}\n\n` +
      `Çıkarılmamış olanlar GELMEYECEK:\n  ✗ ${excluded.join(", ")}\n\n` +
      `Tüm sayfaları içeren dosya istiyorsanız, önce "İptal"e basıp eksik sekmelerden de "Çıkar" yapın.\n\n` +
      `Mevcut sekmelerle devam etmek ister misiniz?`
    );
    if (!proceed) return;
  }
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Yükleniyor…";
  try {
    const { buildWorkbookBlob } = await import("../lib/xlsx.js");
    btn.textContent = "Hazırlanıyor…";
    const datasets = {
      chats: state.chats.extracted,
      groups: state.groups.extracted,
      labels: state.labels.extracted,
      contacts: state.contacts.extracted,
      messages: state.messages.extracted,
    };
    const includeUnsaved = (tabKey === "chats" ? includeUnsavedCb
                          : tabKey === "groups" ? groupsIncludeUnsavedCb
                          : tabKey === "contacts" ? contactsIncludeUnsavedCb
                          : includeUnsavedCb).checked;
    const blob = await buildWorkbookBlob(datasets, { includeUnsaved });
    const dataUrl = await blobToDataUrl(blob);
    const filename = `wa-export-${stamp()}.xlsx`;
    const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
    if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
  } catch (err) {
    alert(`XLSX dışa aktarım hatası: ${err && err.message ? err.message : err}`);
    await logError(`export-xlsx-${tabKey}`, err);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function hasAnyExtracted() {
  return !!(state.chats.extracted || state.groups.extracted || state.labels.extracted || state.contacts.extracted || state.messages.extracted);
}

// ---------------- VCard ------------------

// Holds the most recent VCard text so the help banner's "panoya kopyala"
// button can re-emit it without rebuilding the dataset.
let lastVcardText = null;

async function exportVcard(kind, btn) {
  let text;
  let filename;
  let includeUnsaved;
  try {
    if (kind === "chats") {
      if (!state.chats.extracted) { alert("Önce 'Sohbetleri Çıkar' deyin."); return; }
      includeUnsaved = includeUnsavedCb.checked;
      text = chatsToVcard(state.chats.extracted, { includeUnsaved });
      filename = `wa-chats-${stamp()}.vcf`;
    } else if (kind === "contacts") {
      if (!state.contacts.extracted) { alert("Önce 'Kişileri Çıkar' deyin."); return; }
      includeUnsaved = contactsIncludeUnsavedCb.checked;
      text = contactsToVcard(state.contacts.extracted, { includeUnsaved });
      filename = `wa-contacts-${stamp()}.vcf`;
    } else if (kind === "group-members") {
      if (!state.groups.extracted) { alert("Önce 'Grupları Çıkar' deyin."); return; }
      includeUnsaved = groupsIncludeUnsavedCb.checked;
      text = groupMembersToVcard(state.groups.extracted, { includeUnsaved });
      filename = `wa-group-members-${stamp()}.vcf`;
    } else {
      throw new Error(`unknown vcard kind: ${kind}`);
    }
    if (!text || text.trim() === "") {
      alert("Filtreden geçen kayıt yok. \"Kayıtlı olmayan kişileri dahil et\" işaretini deneyin.");
      return;
    }
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Hazırlanıyor…";
    try {
      const blob = vcardBlob(text);
      const dataUrl = await blobToDataUrl(blob);
      const reply = await chrome.runtime.sendMessage({ kind: "DOWNLOAD", filename, dataUrl });
      if (!reply || !reply.ok) throw new Error(reply?.error || "indirme başarısız");
      lastVcardText = text;
      showVcardHelp();
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  } catch (err) {
    alert(`VCard dışa aktarım hatası: ${err && err.message ? err.message : err}`);
    await logError(`export-vcard-${kind}`, err);
  }
}

function showVcardHelp() {
  const help = $("vcard-help");
  if (help) help.hidden = false;
}

async function copyVcardToClipboard() {
  if (!lastVcardText) return;
  const btn = $("vcard-copy-btn");
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(lastVcardText);
    btn.textContent = "Kopyalandı ✓";
    setTimeout(() => (btn.textContent = original), 1800);
  } catch (err) {
    btn.textContent = "Kopyalanamadı";
    setTimeout(() => (btn.textContent = original), 1800);
    await logError("vcard-copy-clipboard", err);
  }
}

// ---------------- Debug + utilities ------------------

async function logError(scope, err) {
  lastError = { scope, message: err && err.message ? err.message : String(err), stack: err && err.stack };
  await appendDebugLog({ kind: "error", scope, message: lastError.message, stack: lastError.stack });
}

async function copyDebugReport() {
  copyDebugBtn.disabled = true;
  const original = copyDebugBtn.textContent;
  try {
    const log = await getDebugLog();
    const report = {
      generatedAt: new Date().toISOString(),
      version: "0.1.0",
      userAgent: navigator.userAgent,
      activeTab: activeTabKey,
      lastHealth,
      lastError,
      log,
    };
    const text = JSON.stringify(report, null, 2);
    await navigator.clipboard.writeText(text);
    copyDebugBtn.textContent = "Kopyalandı ✓";
    setTimeout(() => (copyDebugBtn.textContent = original), 1800);
  } catch (err) {
    copyDebugBtn.textContent = "Kopyalanamadı";
    setTimeout(() => (copyDebugBtn.textContent = original), 1800);
  } finally {
    copyDebugBtn.disabled = false;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function setStatus(kind, message) {
  dot.classList.remove("status-dot--idle", "status-dot--ok", "status-dot--err");
  dot.classList.add(`status-dot--${kind}`);
  text.textContent = message;
}

function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

init();
