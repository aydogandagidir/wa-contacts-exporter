// License tab UI controller — bound from popup.js after DOM is ready.
//
// Responsibilities:
//   - Render free vs pro view based on license-manager.getStatus()
//   - Activate flow: collect email + key, call license-manager.activate(), surface errors
//   - Re-check + deactivate buttons
//   - Tag the "Pro 🔑" tab with .is-pro when active (header indicator)
//   - Provide a public requirePro() helper used by other tabs to gate features.

import {
  isPro, getStatus, activate, reverify, deactivate,
  getPurchaseUrl, getProductId,
} from "../license/license-manager.js";
import { GumroadApiError } from "../license/gumroad-api.js";

const $ = (id) => document.getElementById(id);

let initialized = false;

function fmtDate(ms) {
  if (!ms) return "—";
  try { return new Date(ms).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return new Date(ms).toISOString(); }
}

function maskKey(key) {
  if (!key) return "—";
  const s = String(key);
  if (s.length <= 8) return s;
  return s.slice(0, 4) + "…" + s.slice(-4);
}

export async function refreshLicenseTab() {
  const status = await getStatus();
  const tier = status.tier;

  const tabBtn = document.querySelector('.tab[data-tab="license"]');
  if (tabBtn) tabBtn.classList.toggle("is-pro", tier === "pro");

  // Sync the lock indicators on Pro-gated tabs (AI / Auto-Reply) so they
  // flip on/off the moment activation succeeds or grace expires.
  for (const key of ["ai", "autoreply"]) {
    const t = document.querySelector(`.tab[data-tab="${key}"]`);
    if (t) t.classList.toggle("is-locked", tier !== "pro");
  }

  const pill = $("license-status-pill");
  if (pill) {
    pill.textContent = tier === "pro" ? (status.reason === "grace" ? "Pro · grace" : "Pro ✓") : "Free";
    pill.classList.toggle("is-pro", tier === "pro");
  }

  const freeBox = $("license-info-free");
  const proBox = $("license-info-pro");
  const activatePanel = $("license-activate");

  if (tier === "pro") {
    if (freeBox) freeBox.hidden = true;
    if (proBox) proBox.hidden = false;
    if (activatePanel) activatePanel.hidden = true;
    const meta = $("license-info-meta");
    if (meta) {
      const parts = [];
      if (status.email) parts.push(`<div>E-posta: <strong>${escapeHtml(status.email)}</strong></div>`);
      if (status.productName) parts.push(`<div>Ürün: <strong>${escapeHtml(status.productName)}</strong></div>`);
      parts.push(`<div>Anahtar: <strong>${escapeHtml(maskKey(status.key))}</strong></div>`);
      parts.push(`<div>Aktive edildi: <strong>${escapeHtml(fmtDate(status.activatedAt))}</strong></div>`);
      parts.push(`<div>Son doğrulama: <strong>${escapeHtml(fmtDate(status.lastVerifiedAt))}</strong></div>`);
      if (status.reason === "grace") {
        parts.push(`<div style="color:var(--c-danger)">⚠ Çevrimdışı destek penceresi: ${escapeHtml(fmtDate(status.graceUntil))}</div>`);
      }
      meta.innerHTML = parts.join("");
    }
  } else {
    if (freeBox) freeBox.hidden = false;
    if (proBox) proBox.hidden = true;
    if (activatePanel) activatePanel.hidden = false;
  }

  const buyBtn = $("license-buy-btn");
  if (buyBtn) buyBtn.href = getPurchaseUrl();
}

function setHint(el, text, kind) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.remove("license-activate__hint--ok", "license-activate__hint--err");
  if (kind === "ok") el.classList.add("license-activate__hint--ok");
  if (kind === "err") el.classList.add("license-activate__hint--err");
}

async function onActivateClick() {
  const emailEl = $("license-email");
  const keyEl = $("license-key");
  const btn = $("license-activate-btn");
  const hint = $("license-activate-hint");
  const email = emailEl ? emailEl.value.trim() : "";
  const key = keyEl ? keyEl.value.trim() : "";

  if (!key) {
    setHint(hint, "Lisans anahtarı boş olamaz.", "err");
    return;
  }
  const productId = await getProductId();
  if (!productId) {
    setHint(hint, "Henüz aktivasyon hizmeti yapılandırılmadı. Lütfen daha sonra deneyin.", "err");
    return;
  }

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Doğrulanıyor…";
  setHint(hint, "Gumroad'a bağlanılıyor…", null);

  try {
    await activate({ key, email });
    setHint(hint, "Aktivasyon başarılı ✓", "ok");
    if (keyEl) keyEl.value = "";
    if (emailEl) emailEl.value = "";
    await refreshLicenseTab();
  } catch (err) {
    let msg = err && err.message ? err.message : "Bilinmeyen hata.";
    if (err instanceof GumroadApiError) {
      if (err.kind === "invalid") msg = "Geçersiz lisans anahtarı. Lütfen Gumroad e-postanızdaki anahtarı kontrol edin.";
      else if (err.kind === "refunded") msg = err.message;
      else if (err.kind === "max-devices") msg = err.message;
      else if (err.kind === "network") msg = "Ağ hatası: internet bağlantınızı kontrol edin.";
      else if (err.kind === "server") msg = "Gumroad sunucu hatası. Birkaç dakika sonra tekrar deneyin.";
    }
    setHint(hint, msg, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function onRecheckClick() {
  const btn = $("license-recheck-btn");
  if (btn) btn.disabled = true;
  try {
    const res = await reverify();
    if (res.ok) {
      await refreshLicenseTab();
      flashTabPill("Yenilendi ✓", "ok");
    } else if (res.kind === "invalid" || res.kind === "refunded") {
      await refreshLicenseTab();
      flashTabPill(res.message || "Lisans geçersiz", "err");
    } else {
      flashTabPill("Çevrimdışı — sonra denenecek", null);
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function onDeactivateClick() {
  if (!confirm("Bu cihazda Pro'yu devre dışı bırakmak istediğinize emin misiniz? Aynı anahtarı yeniden aktive edebilirsiniz.")) return;
  await deactivate();
  await refreshLicenseTab();
}

function flashTabPill(text, kind) {
  const pill = $("license-status-pill");
  if (!pill) return;
  const prev = pill.textContent;
  pill.textContent = text;
  setTimeout(() => { refreshLicenseTab(); }, 1500);
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function initLicenseTab() {
  if (initialized) return;
  initialized = true;
  const activateBtn = $("license-activate-btn");
  const recheckBtn = $("license-recheck-btn");
  const deactivateBtn = $("license-deactivate-btn");
  if (activateBtn) activateBtn.addEventListener("click", onActivateClick);
  if (recheckBtn) recheckBtn.addEventListener("click", onRecheckClick);
  if (deactivateBtn) deactivateBtn.addEventListener("click", onDeactivateClick);
  refreshLicenseTab();
}

// Helper invoked by other tabs before running a Pro-only feature.
// Returns true if Pro is active. Otherwise switches to the License tab,
// shows an inline prompt under the requesting button (if anchorEl given),
// and returns false.
export async function requirePro({ feature = "Bu özellik", anchorEl = null } = {}) {
  if (await isPro()) return true;
  showProPrompt({ feature, anchorEl });
  return false;
}

function showProPrompt({ feature, anchorEl }) {
  // Inline prompt for the page where the user clicked
  if (anchorEl && anchorEl.parentElement) {
    let prompt = anchorEl.parentElement.querySelector(".pro-prompt[data-pro-prompt]");
    if (!prompt) {
      prompt = document.createElement("div");
      prompt.className = "pro-prompt";
      prompt.dataset.proPrompt = "1";
      anchorEl.parentElement.insertBefore(prompt, anchorEl.nextSibling);
    }
    prompt.innerHTML = `
      <div class="pro-prompt__title">🔒 ${escapeHtml(feature)} Pro özelliğidir</div>
      <div>Pro ile AI Asistan, Otomatik Cevap ve uzatılmış mesaj limiti açılır.</div>
      <div class="pro-prompt__actions">
        <button class="btn btn--primary" data-pp-action="open-license">Pro'yu aç</button>
        <button class="btn btn--ghost" data-pp-action="dismiss">Kapat</button>
      </div>
    `;
    prompt.querySelector('[data-pp-action="open-license"]').addEventListener("click", () => {
      const licenseTabBtn = document.querySelector('.tab[data-tab="license"]');
      if (licenseTabBtn) licenseTabBtn.click();
      prompt.remove();
    });
    prompt.querySelector('[data-pp-action="dismiss"]').addEventListener("click", () => prompt.remove());
  } else {
    // Fallback: open License tab directly
    const licenseTabBtn = document.querySelector('.tab[data-tab="license"]');
    if (licenseTabBtn) licenseTabBtn.click();
  }
}
