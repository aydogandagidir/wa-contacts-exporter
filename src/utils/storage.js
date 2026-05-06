// chrome.storage.local wrapper.
// Holds: user settings (toggles), KVKK consent (Step 7), debug log entries.

const KEYS = {
  SETTINGS: "wa_settings",
  CONSENT: "wa_consent",
  DEBUG_LOG: "wa_debug_log",
  AI: "wa_ai",
  AI_PER_CHAT: "wa_ai_per_chat",
  AUTOREPLY: "wa_autoreply",
};

const DEFAULTS = {
  includeUnsaved: false,
};

const AI_DEFAULTS = {
  provider: "ollama",                      // safer default: local & free
  apiKey: "",
  baseUrl: "http://localhost:11434/v1",
  // aya-expanse:8b — Cohere'in 23-dilde (Türkçe dahil) özel eğittiği model;
  // küçük llama3.2:3b'ye göre TR çıktısı ciddi şekilde daha kaliteli.
  model: "aya-expanse:8b",
};

const AUTOREPLY_DEFAULTS = {
  masterEnabled: false,                    // global kill switch
  mode: "draft",                           // "draft" | "auto"
  perChat: {},                             // chatId -> { enabled, instructions, mode? }
  rateLimit: { maxPerHour: 10, maxPerDay: 50 },
  quietHours: { enabled: false, startHour: 22, endHour: 8 },
  history: [],                             // { ts, chatId, chatName, incoming, draft, sent }
  pending: [],                             // unresolved drafts awaiting user action
};

const DEBUG_LOG_MAX = 50;

export async function getSettings() {
  try {
    const data = await chrome.storage.local.get(KEYS.SETTINGS);
    return { ...DEFAULTS, ...(data[KEYS.SETTINGS] || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [KEYS.SETTINGS]: next });
  return next;
}

export async function getConsent() {
  try {
    const data = await chrome.storage.local.get(KEYS.CONSENT);
    return !!(data[KEYS.CONSENT] && data[KEYS.CONSENT].accepted);
  } catch {
    return false;
  }
}

export async function setConsent(accepted) {
  await chrome.storage.local.set({
    [KEYS.CONSENT]: { accepted: !!accepted, ts: Date.now() },
  });
}

export async function appendDebugLog(entry) {
  try {
    const data = await chrome.storage.local.get(KEYS.DEBUG_LOG);
    const log = Array.isArray(data[KEYS.DEBUG_LOG]) ? data[KEYS.DEBUG_LOG] : [];
    const item = {
      ts: Date.now(),
      iso: new Date().toISOString(),
      ...entry,
    };
    log.push(item);
    while (log.length > DEBUG_LOG_MAX) log.shift();
    await chrome.storage.local.set({ [KEYS.DEBUG_LOG]: log });
  } catch {}
}

export async function getDebugLog() {
  try {
    const data = await chrome.storage.local.get(KEYS.DEBUG_LOG);
    return Array.isArray(data[KEYS.DEBUG_LOG]) ? data[KEYS.DEBUG_LOG] : [];
  } catch {
    return [];
  }
}

export async function clearDebugLog() {
  try { await chrome.storage.local.remove(KEYS.DEBUG_LOG); } catch {}
}

// AI provider settings. Stored ONLY in chrome.storage.local (per-device).
// Never synced, never sent to any server beyond the user-chosen LLM endpoint.
//
// Migration: when a user has the old default model "llama3.2" and never
// touched it (modelMigrated flag absent), bump them to "aya-expanse:8b" —
// the new default — and set a one-shot flag the popup uses to surface a
// "model güncellendi" banner.
const OLD_DEFAULT_MODELS = new Set(["llama3.2", "llama3.2:latest", "llama3.2:3b"]);

export async function getAiSettings() {
  try {
    const data = await chrome.storage.local.get(KEYS.AI);
    const cur = { ...AI_DEFAULTS, ...(data[KEYS.AI] || {}) };

    if (!cur.modelMigrated && cur.provider === "ollama" && OLD_DEFAULT_MODELS.has(cur.model)) {
      const previousModel = cur.model;
      cur.model = AI_DEFAULTS.model;
      cur.modelMigrated = true;
      cur.modelMigrationNote = `Otomatik güncelleme: "${previousModel}" → "${AI_DEFAULTS.model}" (Türkçe için çok daha kaliteli model)`;
      await chrome.storage.local.set({ [KEYS.AI]: cur });
    }
    return cur;
  } catch {
    return { ...AI_DEFAULTS };
  }
}

// Per-chat AI instructions for summarize / followups. Map of chatId -> string.
// Persists across popup sessions so the user doesn't retype guidance.
export async function getAiChatInstruction(chatId) {
  if (!chatId) return "";
  try {
    const data = await chrome.storage.local.get(KEYS.AI_PER_CHAT);
    const map = data[KEYS.AI_PER_CHAT] || {};
    return map[chatId] || "";
  } catch {
    return "";
  }
}

export async function setAiChatInstruction(chatId, text) {
  if (!chatId) return;
  try {
    const data = await chrome.storage.local.get(KEYS.AI_PER_CHAT);
    const map = data[KEYS.AI_PER_CHAT] || {};
    if (text && text.trim()) {
      map[chatId] = text.trim();
    } else {
      delete map[chatId];
    }
    await chrome.storage.local.set({ [KEYS.AI_PER_CHAT]: map });
  } catch {}
}

export async function getAllAiChatInstructions() {
  try {
    const data = await chrome.storage.local.get(KEYS.AI_PER_CHAT);
    return data[KEYS.AI_PER_CHAT] || {};
  } catch {
    return {};
  }
}

// Popup, banner gösterdikten sonra not'u temizler ki bir daha çıkmasın.
export async function clearAiMigrationNote() {
  try {
    const data = await chrome.storage.local.get(KEYS.AI);
    const cur = data[KEYS.AI] || {};
    if (cur.modelMigrationNote) {
      delete cur.modelMigrationNote;
      await chrome.storage.local.set({ [KEYS.AI]: cur });
    }
  } catch {}
}

export async function setAiSettings(patch) {
  const cur = await getAiSettings();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [KEYS.AI]: next });
  return next;
}

// Auto-reply config + history. History is capped to 100 events.
export async function getAutoReply() {
  try {
    const data = await chrome.storage.local.get(KEYS.AUTOREPLY);
    return { ...AUTOREPLY_DEFAULTS, ...(data[KEYS.AUTOREPLY] || {}) };
  } catch {
    return { ...AUTOREPLY_DEFAULTS };
  }
}

export async function setAutoReply(patch) {
  const cur = await getAutoReply();
  const next = { ...cur, ...patch };
  if (Array.isArray(next.history) && next.history.length > 100) {
    next.history = next.history.slice(-100);
  }
  if (Array.isArray(next.pending) && next.pending.length > 50) {
    next.pending = next.pending.slice(-50);
  }
  await chrome.storage.local.set({ [KEYS.AUTOREPLY]: next });
  return next;
}

export async function appendAutoReplyHistory(entry) {
  const cur = await getAutoReply();
  cur.history.push({ ts: Date.now(), ...entry });
  while (cur.history.length > 100) cur.history.shift();
  await chrome.storage.local.set({ [KEYS.AUTOREPLY]: cur });
}
