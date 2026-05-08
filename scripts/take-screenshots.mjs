// take-screenshots.mjs — automated CWS screenshot generator (locale-aware)
//
// Spins up a local static server for dist/, launches Playwright Chromium,
// stubs all chrome.* APIs the popup uses, drives the popup through 5
// scripted UI states for each requested locale, then composites each shot
// onto a 1280×800 canvas with Bluedev brand styling via Sharp.
//
// Output:
//   docs/screenshots/{en,tr}/0X_*.png
//   landing/assets/screenshots/{en,tr}/0X_*.png
//
// CLI:
//   node scripts/take-screenshots.mjs              # both locales
//   node scripts/take-screenshots.mjs --locale=en  # EN only
//   node scripts/take-screenshots.mjs --locale=tr  # TR only
//   node scripts/take-screenshots.mjs --keep-tmp   # keep tmp-screenshots/

import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const DIST = path.join(ROOT, "dist");
const TMP = path.join(ROOT, "tmp-screenshots");
const OUT_DOCS = path.join(ROOT, "docs", "screenshots");
const OUT_LANDING = path.join(ROOT, "landing", "assets", "screenshots");
const PORT = 5174;

const POPUP_W = 380;
const POPUP_H = 1100;         // tall viewport so AI/auto-reply content all renders without scroll

// ─────────────────────────────────────────────────────────────
// CLI parsing

function parseArgs(argv) {
  const opts = { locales: ["en", "tr"], keepTmp: false };
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--locale=(en|tr)$/);
    if (m) {
      opts.locales = [m[1]];
      continue;
    }
    if (arg === "--keep-tmp") {
      opts.keepTmp = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/take-screenshots.mjs [--locale=en|tr] [--keep-tmp]");
      process.exit(0);
    }
  }
  return opts;
}

// ─────────────────────────────────────────────────────────────
// Demo data — anonymized, deliberately marked "Demo".
// All timestamps are Unix seconds, set to look like "today" relative to
// the popup's locale-aware formatter. We pin to 2026-05-06 mid-afternoon.

const NOW_S = Math.floor(new Date("2026-05-06T15:00:00+03:00").getTime() / 1000);
const minutesAgo = (m) => NOW_S - m * 60;
const hoursAgo = (h) => NOW_S - h * 3600;
const daysAgo = (d) => NOW_S - d * 86400;

// ─── TR demo data ──────────────────────────────────────────

const DEMO_CHATS_TR = [
  { id: "chat_1", contactName: "Ahmet Demo Yıldız",  phone: "+90 555 010 0001", isGroup: false, t: minutesAgo(8),  lastMessage: { t: minutesAgo(8) } },
  { id: "chat_2", contactName: "Ayşe Demo Çelik",    phone: "+90 555 010 0002", isGroup: false, t: minutesAgo(45), lastMessage: { t: minutesAgo(45) } },
  { id: "chat_3", formattedTitle: "Bluedev Demo Grubu",                         isGroup: true,  t: hoursAgo(2),    lastMessage: { t: hoursAgo(2) } },
  { id: "chat_4", contactName: "Mehmet Demo Kaya",   phone: "+90 555 010 0003", isGroup: false, t: hoursAgo(3),    lastMessage: { t: hoursAgo(3) } },
  { id: "chat_5", contactName: "Fatma Demo Aydın",   phone: "+90 555 010 0004", isGroup: false, t: hoursAgo(5),    lastMessage: { t: hoursAgo(5) } },
  { id: "chat_6", formattedTitle: "Ekip Demo Sohbeti",                          isGroup: true,  t: hoursAgo(7),    lastMessage: { t: hoursAgo(7) } },
  { id: "chat_7", contactName: "Hasan Demo Bey",     phone: "+90 555 010 0005", isGroup: false, t: hoursAgo(11),   lastMessage: { t: hoursAgo(11) } },
  { id: "chat_8", contactName: "Zeynep Demo Acar",   phone: "+90 555 010 0006", isGroup: false, t: daysAgo(1),     lastMessage: { t: daysAgo(1) } },
];

const DEMO_MESSAGES_TR = [
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: false, sender_name: "Ahmet Demo Yıldız", sender_phone: "+90 555 010 0001", body: "Merhaba, yarın saat 10:00'daki toplantı kalıyor mu?", t: minutesAgo(12) },
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: true,  body: "Evet, 10:00'da Zoom'da görüşelim. Linki birazdan gönderiyorum.",                                         t: minutesAgo(10) },
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: false, sender_name: "Ahmet Demo Yıldız", body: "Süper, teşekkürler.",                                                  t: minutesAgo(8) },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Grubu", from_me: false, sender_name: "Mehmet Demo Kaya", sender_phone: "+90 555 010 0003", body: "Sunum dosyasını paylaşır mısınız?", t: hoursAgo(2) - 60 },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Grubu", from_me: true,  body: "Tamam, birazdan drive linkini atıyorum.",                                                                t: hoursAgo(2) },
  { chat_id: "chat_2", chat_name: "Ayşe Demo Çelik",    from_me: false, sender_name: "Ayşe Demo Çelik",  sender_phone: "+90 555 010 0002", body: "Ürün demosunu nasıl ayarlayabiliriz?", t: minutesAgo(45) },
  { chat_id: "chat_2", chat_name: "Ayşe Demo Çelik",    from_me: true,  body: "Bu hafta perşembe öğleden sonra uygun musunuz?",                                                          t: minutesAgo(40) },
  { chat_id: "chat_4", chat_name: "Mehmet Demo Kaya",   from_me: false, sender_name: "Mehmet Demo Kaya", sender_phone: "+90 555 010 0003", body: "Faturayı bugün gönderebilir miyiz?",  t: hoursAgo(3) },
  { chat_id: "chat_5", chat_name: "Fatma Demo Aydın",   from_me: false, sender_name: "Fatma Demo Aydın", sender_phone: "+90 555 010 0004", body: "Toplantı notlarını paylaşırsanız sevinirim.", t: hoursAgo(5) },
  { chat_id: "chat_6", chat_name: "Ekip Demo Sohbeti",  from_me: false, sender_name: "Hasan Demo Bey",   sender_phone: "+90 555 010 0005", body: "Sprint planlama yarın 14:00'da mı?",   t: hoursAgo(7) },
];

const DEMO_GROUPS_TR = [
  { id: "chat_3", formattedTitle: "Bluedev Demo Grubu", participants: [{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }], t: hoursAgo(2), lastMessage: { t: hoursAgo(2) } },
  { id: "chat_6", formattedTitle: "Ekip Demo Sohbeti",  participants: [{ id: "u1" }, { id: "u5" }, { id: "u6" }], t: hoursAgo(7), lastMessage: { t: hoursAgo(7) } },
];

const DEMO_AUTOREPLY_PENDING_TR = [
  {
    id: "p1",
    chatId: "chat_2",
    chatName: "Ayşe Demo Çelik",
    incoming: "Ürün demosunu nasıl ayarlayabiliriz?",
    draft: "Merhaba Ayşe Hanım, demo için bu hafta perşembe 14:00 veya cuma 11:00 saatlerinde Zoom üzerinden buluşabiliriz. Sizin için hangisi daha uygun olur?",
    ts: minutesAgo(45) * 1000,
  },
];

const DEMO_SUGGESTION_TR = {
  title: "Cevap önerisi — Ahmet Demo Yıldız",
  targetMessage: "Merhaba, yarın saat 10:00'daki toplantı kalıyor mu?",
  body: "Merhaba Ahmet Bey, evet toplantı 10:00'da kalıyor. Zoom linkini birazdan size iletiyorum. Eğer ek bir gündem maddesi eklemek isterseniz bana yazabilirsiniz.",
  meta: "Local — Ollama · aya-expanse:8b · 2.4 sn",
};

const DEMO_LABELS_TR = [
  { id: "lbl_1", name: "Müşteri",     color: "#10B981", chatCount: 12, isSystem: false },
  { id: "lbl_2", name: "Beklemede",   color: "#FB923C", chatCount: 5,  isSystem: false },
  { id: "lbl_3", name: "Tamamlandı",  color: "#6B7280", chatCount: 28, isSystem: false },
];

const AR_INSTRUCTIONS_TR = "Profesyonel ve nazik ton kullan, randevu önerirken 2 alternatif sun.";

// ─── EN demo data ──────────────────────────────────────────

const DEMO_CHATS_EN = [
  { id: "chat_1", contactName: "Alex Demo Smith",     phone: "+1 555 010 0001", isGroup: false, t: minutesAgo(8),  lastMessage: { t: minutesAgo(8) } },
  { id: "chat_2", contactName: "Emma Demo Johnson",   phone: "+1 555 010 0002", isGroup: false, t: minutesAgo(45), lastMessage: { t: minutesAgo(45) } },
  { id: "chat_3", formattedTitle: "Bluedev Demo Group",                         isGroup: true,  t: hoursAgo(2),    lastMessage: { t: hoursAgo(2) } },
  { id: "chat_4", contactName: "Mike Demo Brown",     phone: "+1 555 010 0003", isGroup: false, t: hoursAgo(3),    lastMessage: { t: hoursAgo(3) } },
  { id: "chat_5", contactName: "Sarah Demo Wilson",   phone: "+1 555 010 0004", isGroup: false, t: hoursAgo(5),    lastMessage: { t: hoursAgo(5) } },
  { id: "chat_6", formattedTitle: "Team Demo Channel",                          isGroup: true,  t: hoursAgo(7),    lastMessage: { t: hoursAgo(7) } },
  { id: "chat_7", contactName: "David Demo Lee",      phone: "+1 555 010 0005", isGroup: false, t: hoursAgo(11),   lastMessage: { t: hoursAgo(11) } },
  { id: "chat_8", contactName: "Lisa Demo Chen",      phone: "+1 555 010 0006", isGroup: false, t: daysAgo(1),     lastMessage: { t: daysAgo(1) } },
];

const DEMO_MESSAGES_EN = [
  { chat_id: "chat_1", chat_name: "Alex Demo Smith",   from_me: false, sender_name: "Alex Demo Smith",   sender_phone: "+1 555 010 0001", body: "Hi, is the 10am meeting tomorrow still on?",       t: minutesAgo(12) },
  { chat_id: "chat_1", chat_name: "Alex Demo Smith",   from_me: true,  body: "Sure — sending the Zoom link now.",                                                                                       t: minutesAgo(10) },
  { chat_id: "chat_1", chat_name: "Alex Demo Smith",   from_me: false, sender_name: "Alex Demo Smith",   body: "Awesome, thanks!",                                                                       t: minutesAgo(8) },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Group", from_me: false, sender_name: "Mike Demo Brown",   sender_phone: "+1 555 010 0003", body: "Could you share the slides?",                          t: hoursAgo(2) - 60 },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Group", from_me: true,  body: "Will do — uploading to Drive in a minute.",                                                                               t: hoursAgo(2) },
  { chat_id: "chat_2", chat_name: "Emma Demo Johnson",  from_me: false, sender_name: "Emma Demo Johnson", sender_phone: "+1 555 010 0002", body: "How can we set up the product demo?",                  t: minutesAgo(45) },
  { chat_id: "chat_2", chat_name: "Emma Demo Johnson",  from_me: true,  body: "Let's catch up Thursday afternoon — does that work?",                                                                     t: minutesAgo(40) },
  { chat_id: "chat_4", chat_name: "Mike Demo Brown",    from_me: false, sender_name: "Mike Demo Brown",   sender_phone: "+1 555 010 0003", body: "Quick question on the invoice — can we send it today?", t: hoursAgo(3) },
  { chat_id: "chat_5", chat_name: "Sarah Demo Wilson",  from_me: false, sender_name: "Sarah Demo Wilson", sender_phone: "+1 555 010 0004", body: "Notes from yesterday's standup?",                      t: hoursAgo(5) },
  { chat_id: "chat_6", chat_name: "Team Demo Channel",  from_me: false, sender_name: "David Demo Lee",    sender_phone: "+1 555 010 0005", body: "Sprint planning tomorrow at 2pm?",                     t: hoursAgo(7) },
];

const DEMO_GROUPS_EN = [
  { id: "chat_3", formattedTitle: "Bluedev Demo Group", participants: [{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }], t: hoursAgo(2), lastMessage: { t: hoursAgo(2) } },
  { id: "chat_6", formattedTitle: "Team Demo Channel",  participants: [{ id: "u1" }, { id: "u5" }, { id: "u6" }], t: hoursAgo(7), lastMessage: { t: hoursAgo(7) } },
];

const DEMO_AUTOREPLY_PENDING_EN = [
  {
    id: "p1",
    chatId: "chat_2",
    chatName: "Emma Demo Johnson",
    incoming: "How can we set up the product demo?",
    draft: "Hi Emma — happy to set up the demo. Thursday at 2pm or Friday at 11am works for me, both via Zoom. Which one suits you better?",
    ts: minutesAgo(45) * 1000,
  },
];

const DEMO_SUGGESTION_EN = {
  title: "Reply suggestion — Alex Demo Smith",
  targetMessage: "Hi, is the 10am meeting tomorrow still on?",
  body: "Hi Alex — yes, 10am works. I'll send the Zoom link shortly. If you want to add anything to the agenda, just let me know.",
  meta: "Local — Ollama · llama3.2:8b · 2.4 sec",
};

const DEMO_LABELS_EN = [
  { id: "lbl_1", name: "Customer",   color: "#10B981", chatCount: 12, isSystem: false },
  { id: "lbl_2", name: "On hold",    color: "#FB923C", chatCount: 5,  isSystem: false },
  { id: "lbl_3", name: "Completed",  color: "#6B7280", chatCount: 28, isSystem: false },
];

const AR_INSTRUCTIONS_EN = "Use a professional and friendly tone; when proposing meetings, offer 2 alternatives.";

// ─── Locale dispatcher ────────────────────────────────────

function getDemoData(locale) {
  if (locale === "en") {
    return {
      chats: DEMO_CHATS_EN,
      messages: DEMO_MESSAGES_EN,
      groups: DEMO_GROUPS_EN,
      autoreplyPending: DEMO_AUTOREPLY_PENDING_EN,
      suggestion: DEMO_SUGGESTION_EN,
      labels: DEMO_LABELS_EN,
      arInstructions: AR_INSTRUCTIONS_EN,
    };
  }
  return {
    chats: DEMO_CHATS_TR,
    messages: DEMO_MESSAGES_TR,
    groups: DEMO_GROUPS_TR,
    autoreplyPending: DEMO_AUTOREPLY_PENDING_TR,
    suggestion: DEMO_SUGGESTION_TR,
    labels: DEMO_LABELS_TR,
    arInstructions: AR_INSTRUCTIONS_TR,
  };
}

// Per-locale microcopy used in the auto-reply pending card (built inline in
// the popup DOM by the screenshot script). Mirrors what the live UI renders.
const PENDING_CARD_COPY = {
  en: {
    timeAgo: "45 min ago",
    aiSuggestion: "AI suggestion (draft):",
    btnSend: "Send",
    btnEdit: "Edit",
    btnDelete: "Delete",
  },
  tr: {
    timeAgo: "45 dk önce",
    aiSuggestion: "AI önerisi (taslak):",
    btnSend: "Gönder",
    btnEdit: "Düzelt",
    btnDelete: "Sil",
  },
};

// ─────────────────────────────────────────────────────────────
// Init script — runs in browser context BEFORE popup.js boots.
// Replaces window.chrome with mocks pre-seeded with demo state.
// IMPORTANT: must be a self-contained string (no template-string
// interpolation collisions). We send demo data + locale as JSON.

function buildInitScript(locale) {
  const demo = getDemoData(locale);
  const stateJson = JSON.stringify({
    chats: demo.chats,
    messages: demo.messages,
    groups: demo.groups,
    pendingAutoReply: demo.autoreplyPending,
    labels: demo.labels,
  });
  const localeJson = JSON.stringify(locale);
  const arInstructionsJson = JSON.stringify(demo.arInstructions);

  return `
(() => {
  const DEMO = ${stateJson};
  const LOCALE = ${localeJson};
  const AR_INSTRUCTIONS = ${arInstructionsJson};

  // Persistent-ish in-memory storage. Seeding wa_ui_locale forces the popup's
  // i18n.js to load the correct locale's bundled messages map regardless of
  // the headless browser's UI language.
  const STORE = {
    wa_ui_locale: LOCALE,
    wa_consent: { accepted: true, ts: Date.now() },
    wa_settings: { includeUnsaved: false },
    wa_ai: {
      provider: "ollama",
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
      model: LOCALE === "en" ? "llama3.2:8b" : "aya-expanse:8b",
      modelMigrated: true,
    },
    wa_ai_per_chat: {},
    wa_autoreply: {
      masterEnabled: true,
      mode: "draft",
      perChat: { chat_2: { enabled: true, instructions: AR_INSTRUCTIONS } },
      rateLimit: { maxPerHour: 10, maxPerDay: 50 },
      quietHours: { enabled: true, startHour: 22, endHour: 8 },
      history: [],
      pending: DEMO.pendingAutoReply,
    },
    wa_debug_log: [],
  };

  const HEALTH_OK = {
    ok: true,
    modules: { Chat: true, GroupMetadata: true, Label: true, LabelAssociation: true, Contact: true, WidFactory: true },
    version: "2.3000.demo",
    moduleCount: 6,
  };

  function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch { return v; } }

  function storageGet(keys) {
    if (keys == null) return clone(STORE);
    if (typeof keys === "string") return { [keys]: clone(STORE[keys]) };
    if (Array.isArray(keys)) {
      const out = {};
      for (const k of keys) out[k] = clone(STORE[k]);
      return out;
    }
    if (typeof keys === "object") {
      const out = {};
      for (const k of Object.keys(keys)) out[k] = clone(STORE[k] !== undefined ? STORE[k] : keys[k]);
      return out;
    }
    return {};
  }

  function storageSet(items) {
    for (const k of Object.keys(items)) STORE[k] = items[k];
  }

  function storageRemove(keys) {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (const k of arr) delete STORE[k];
  }

  // Tabs.sendMessage handler — content script bridge mock
  function handleTabsMessage(msg) {
    if (!msg) return null;
    if (msg.kind === "GET_HEALTH") return { ok: true, health: HEALTH_OK };
    if (msg.kind === "WA_REQ") {
      switch (msg.op) {
        case "re-probe":         return { ok: true };
        case "get-health":       return { ok: true, data: HEALTH_OK };
        case "list-chats":       return { ok: true, data: DEMO.chats };
        case "list-messages":    return { ok: true, data: DEMO.messages, diag: { totalChats: DEMO.chats.length, msgSource: { getModelsArray: 4, _models: 2, lastMessage: 2 }, loadStrategy: { none: 1 } } };
        case "list-groups":      return { ok: true, data: DEMO.groups };
        case "list-labels":      return { ok: true, data: DEMO.labels };
        case "list-contacts":    return { ok: true, data: DEMO.chats.filter(c => !c.isGroup) };
        case "subscribe-new-messages":   return { ok: true };
        case "unsubscribe-new-messages": return { ok: true };
        case "send-text-message": return { ok: true };
        default: return { ok: true, data: [] };
      }
    }
    return { ok: true };
  }

  // Runtime.sendMessage handler — background SW mock
  function handleRuntimeMessage(msg) {
    if (msg && msg.kind === "DOWNLOAD") return { ok: true };
    return { ok: true };
  }

  // chrome.i18n.getUILanguage shim — popup uses this in "auto" mode but we
  // override via wa_ui_locale anyway. Returning the chosen locale keeps
  // <html lang> consistent.
  const i18nStub = {
    getUILanguage: () => (LOCALE === "tr" ? "tr-TR" : "en-US"),
    getMessage: () => "",
  };

  // Shim chrome.* — must be ready before popup.js loads.
  const chromeStub = {
    i18n: i18nStub,
    runtime: {
      id: "demo-extension-id",
      sendMessage: (msg) => Promise.resolve(handleRuntimeMessage(msg)),
      onMessage: { addListener: () => {}, removeListener: () => {} },
      getURL: (p) => "/" + p.replace(/^\\.?\\//, ""),
      lastError: null,
    },
    tabs: {
      query: (filter) => Promise.resolve([{ id: 99, url: "https://web.whatsapp.com/", active: true }]),
      sendMessage: (tabId, msg) => Promise.resolve(handleTabsMessage(msg)),
    },
    storage: {
      local: {
        get: (keys) => Promise.resolve(storageGet(keys)),
        set: (items) => { storageSet(items); return Promise.resolve(); },
        remove: (keys) => { storageRemove(keys); return Promise.resolve(); },
        clear: () => { for (const k of Object.keys(STORE)) delete STORE[k]; return Promise.resolve(); },
      },
    },
    downloads: {
      download: () => Promise.resolve(1),
    },
  };

  Object.defineProperty(window, "chrome", {
    value: chromeStub,
    writable: false,
    configurable: false,
  });
})();
`;
}

// ─────────────────────────────────────────────────────────────
// Static server for dist/

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".woff2":"font/woff2",
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split("?")[0]);
        if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
        const filePath = path.join(DIST, urlPath);
        // basic traversal guard
        if (!filePath.startsWith(DIST)) { res.statusCode = 403; return res.end("Forbidden"); }
        const ext = path.extname(filePath).toLowerCase();
        const data = await fs.readFile(filePath);
        res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
        res.setHeader("Cache-Control", "no-store");
        res.end(data);
      } catch (err) {
        res.statusCode = 404;
        res.end("Not Found: " + req.url);
      }
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

// ─────────────────────────────────────────────────────────────
// Screenshot scenarios (per-locale builder)
//
// Each scenario produces a setup() that drives the popup into the desired
// state, plus the brand-canvas marketing copy (heading / subhead / body).
// File names differ per locale to keep TR muscle memory ("sohbetler" stays
// in the TR set) and EN-friendly slugs in the EN set.

function buildScenarios(locale) {
  if (locale === "en") {
    return [
      {
        name: "01_chats_tab",
        title: "Chats tab",
        heading: "Chat list",
        subhead: "→ CSV / XLSX / VCard",
        body: "1-on-1 chats, groups, last-message timestamps. UTF-8 BOM CSV opens cleanly in Excel.",
        setup: async (page) => {
          await page.click('[data-tab="chats"]');
          await page.click('#extract-chats-btn');
          await page.waitForSelector('#chats-preview:not([hidden])', { timeout: 5000 });
          await page.waitForTimeout(300);
        },
      },
      {
        name: "02_messages_tab",
        title: "Messages tab",
        heading: "Message history",
        subhead: "Controlled extraction",
        body: "100–5000 messages per chat. Earlier-message load rounds for older history. All processing on-device.",
        setup: async (page) => {
          await page.click('[data-tab="messages"]');
          await page.click('#extract-messages-btn');
          await page.waitForSelector('#messages-preview:not([hidden])', { timeout: 5000 });
          await page.waitForTimeout(300);
        },
      },
      {
        name: "03_ai_provider",
        title: "AI provider panel",
        heading: "6 AI providers",
        subhead: "Local or cloud",
        body: "Ollama, LM Studio, Claude, ChatGPT, Gemini, Groq. Start free with local Ollama.",
        setup: async (page) => {
          await page.click('[data-tab="ai"]');
          await page.waitForTimeout(200);
          await page.evaluate(() => {
            const d = document.querySelector('#ai-config');
            if (d) d.open = true;
          });
          await page.waitForTimeout(200);
        },
      },
      {
        name: "04_ai_suggestion",
        title: "AI iterative single-suggestion card",
        heading: "Iterative suggestion",
        subhead: "Refresh / Refine / Copy",
        body: "AI learns your style from past messages. Refresh suggestions you don't like, refine with feedback.",
        setup: async (page, suggestion) => {
          await page.click('[data-tab="ai"]');
          await page.waitForTimeout(200);
          await page.evaluate((sug) => {
            const card = document.getElementById('suggestion-card');
            const title = document.getElementById('suggestion-title');
            const target = document.getElementById('suggestion-target');
            const body = document.getElementById('suggestion-body');
            const meta = document.getElementById('suggestion-meta');
            if (!card) return;
            title.textContent = sug.title;
            target.textContent = '📩  ' + sug.targetMessage;
            body.textContent = sug.body;
            meta.textContent = sug.meta;
            card.hidden = false;
          }, suggestion);
          await page.waitForTimeout(300);
        },
      },
      {
        name: "05_auto_reply",
        title: "Auto-reply module",
        heading: "Auto-reply",
        subhead: "Draft mode by default",
        body: "AI proposes, you approve and send. Hourly limits, quiet hours, per-chat opt-in. Master switch off by default.",
        setup: async (page) => {
          await renderPendingCard(page, "en");
        },
      },
    ];
  }

  // TR (default)
  return [
    {
      name: "01_sohbetler_tab",
      title: "Sohbetler sekmesi",
      heading: "Sohbet listesi",
      subhead: "→ CSV / XLSX / VCard",
      body: "Birebir sohbetler, gruplar, son mesaj zaman damgaları. UTF-8 BOM ile Excel'de Türkçe karakter sorunsuz açılır.",
      setup: async (page) => {
        await page.click('[data-tab="chats"]');
        await page.click('#extract-chats-btn');
        await page.waitForSelector('#chats-preview:not([hidden])', { timeout: 5000 });
        await page.waitForTimeout(300);
      },
    },
    {
      name: "02_mesajlar_tab",
      title: "Mesajlar sekmesi",
      heading: "Mesaj geçmişi",
      subhead: "Kontrollü çıkarma",
      body: "Sohbet başına 100-5000 mesaj. Eski mesajlar için scroll-load tur sayısı ayarı. Tüm işlem cihazda yereldir.",
      setup: async (page) => {
        await page.click('[data-tab="messages"]');
        await page.click('#extract-messages-btn');
        await page.waitForSelector('#messages-preview:not([hidden])', { timeout: 5000 });
        await page.waitForTimeout(300);
      },
    },
    {
      name: "03_ai_provider",
      title: "AI sağlayıcı paneli",
      heading: "6 AI sağlayıcı",
      subhead: "Yerel veya bulut",
      body: "Ollama, LM Studio, Claude, ChatGPT, Gemini, Groq. Aya Expanse 8B Türkçe için önerilen. Yerel Ollama ile tamamen ücretsiz başla.",
      setup: async (page) => {
        await page.click('[data-tab="ai"]');
        await page.waitForTimeout(200);
        await page.evaluate(() => {
          const d = document.querySelector('#ai-config');
          if (d) d.open = true;
        });
        await page.waitForTimeout(200);
      },
    },
    {
      name: "04_ai_suggestion",
      title: "AI iteratif tek-öneri kartı",
      heading: "İteratif öneri",
      subhead: "Yenile / Düzelt / Kopyala",
      body: "AI sizin geçmiş mesajlarınızdan üslubunuzu öğrenir. Beğenmediğiniz öneriyi yenileyin, geri bildirimle iyileştirin.",
      setup: async (page, suggestion) => {
        await page.click('[data-tab="ai"]');
        await page.waitForTimeout(200);
        await page.evaluate((sug) => {
          const card = document.getElementById('suggestion-card');
          const title = document.getElementById('suggestion-title');
          const target = document.getElementById('suggestion-target');
          const body = document.getElementById('suggestion-body');
          const meta = document.getElementById('suggestion-meta');
          if (!card) return;
          title.textContent = sug.title;
          target.textContent = '📩  ' + sug.targetMessage;
          body.textContent = sug.body;
          meta.textContent = sug.meta;
          card.hidden = false;
        }, suggestion);
        await page.waitForTimeout(300);
      },
    },
    {
      name: "05_oto_cevap",
      title: "Otomatik cevap modülü",
      heading: "Otomatik cevap",
      subhead: "Taslak modu varsayılan",
      body: "AI önerir, siz onaylayıp gönderirsiniz. Saatlik limit, sessiz saatler, sohbet bazlı opt-in. Master switch varsayılan kapalı.",
      setup: async (page) => {
        await renderPendingCard(page, "tr");
      },
    },
  ];
}

// Auto-reply pending card renderer — both locales share the same DOM
// scaffold, just with locale-specific copy. Inline styles guarantee the
// card renders correctly even though popup.css doesn't define
// `.ar-pending-card` (the live UI builds these from JS at runtime).
async function renderPendingCard(page, locale) {
  await page.click('[data-tab="autoreply"]');
  await page.waitForTimeout(300);
  const demo = getDemoData(locale);
  const copy = PENDING_CARD_COPY[locale];
  const pending = demo.autoreplyPending[0];
  await page.evaluate(({ pending, copy }) => {
    const list = document.getElementById('ar-pending-list');
    const empty = document.getElementById('ar-pending-empty');
    if (!list) return;
    const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `
      <div style="background:#fff;border:1px solid #015AFF;border-radius:8px;padding:12px;margin-top:8px;box-shadow:0 1px 3px rgba(45,49,66,0.08);">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#2D3142;margin-bottom:6px;">
          <strong>${escapeHtml(pending.chatName)}</strong>
          <span style="color:#6B7280;">${escapeHtml(copy.timeAgo)}</span>
        </div>
        <div style="font-size:12px;color:#2D3142;background:#F8FAFC;padding:6px 8px;border-radius:4px;margin-bottom:6px;">📩 ${escapeHtml(pending.incoming)}</div>
        <div style="font-size:11px;color:#6B7280;margin-bottom:2px;">${escapeHtml(copy.aiSuggestion)}</div>
        <div style="font-size:12px;color:#2D3142;background:#E8F0FF;padding:6px 8px;border-radius:4px;margin-bottom:8px;line-height:1.45;">${escapeHtml(pending.draft)}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn--primary" style="font-size:12px;padding:5px 10px;">${escapeHtml(copy.btnSend)}</button>
          <button class="btn btn--ghost" style="font-size:12px;padding:5px 10px;">${escapeHtml(copy.btnEdit)}</button>
          <button class="btn btn--ghost" style="font-size:12px;padding:5px 10px;">${escapeHtml(copy.btnDelete)}</button>
        </div>
      </div>
    `;
    list.innerHTML = html;
    if (empty) empty.style.display = 'none';
  }, { pending, copy });
  await page.waitForTimeout(200);
}

// ─────────────────────────────────────────────────────────────
// Main capture loop

async function ensureDirs(locales) {
  await fs.mkdir(TMP, { recursive: true });
  for (const parent of [OUT_DOCS, OUT_LANDING]) {
    await fs.mkdir(parent, { recursive: true });
    for (const loc of locales) {
      await fs.mkdir(path.join(parent, loc), { recursive: true });
    }
  }
}

async function ensureBuilt() {
  if (!existsSync(path.join(DIST, "src", "popup", "popup.html"))) {
    throw new Error(`dist/src/popup/popup.html not found. Run 'npm run build' first.`);
  }
}

async function takeRawShotsForLocale(locale, scenarios) {
  const initScript = buildInitScript(locale);
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: POPUP_W, height: POPUP_H },
      deviceScaleFactor: 2, // retina-quality raw
      locale: locale === "tr" ? "tr-TR" : "en-US",
    });
    await ctx.addInitScript(initScript);
    const page = await ctx.newPage();

    const url = `http://127.0.0.1:${PORT}/src/popup/popup.html`;
    const demo = getDemoData(locale);
    for (const sc of scenarios) {
      console.log(`  • [${locale}] ${sc.name}: ${sc.title}`);
      await page.goto(url, { waitUntil: "networkidle" });
      // Wait for popup boot (status renders + tabs visible)
      await page.waitForSelector("#tabs:not([hidden])", { timeout: 10000 });
      await page.waitForTimeout(300);
      try {
        await sc.setup(page, demo.suggestion);
      } catch (err) {
        console.warn(`    ⚠ setup error: ${err.message}`);
      }
      await page.screenshot({
        path: path.join(TMP, `${locale}_${sc.name}.png`),
        fullPage: false,
        clip: { x: 0, y: 0, width: POPUP_W, height: POPUP_H },
      });
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────
// Composite raw shots onto 1280×800 brand canvas

async function compositeShot(rawPath, outPath, scenario) {
  const CANVAS_W = 1280, CANVAS_H = 800;
  const POPUP_TARGET_H = 720;        // popup column height
  const SHADOW_PAD = 36;             // shadow halo on each side
  const POPUP_COL_X = 80;            // left margin for popup
  const TEXT_COL_X = 540;            // where copy column starts
  const TEXT_COL_W = CANVAS_W - TEXT_COL_X - 80; // right padding 80

  // Scale popup raw (380×1100) to target height preserving aspect
  const raw = await sharp(rawPath).png().toBuffer();
  const meta = await sharp(raw).metadata();
  const scale = POPUP_TARGET_H / meta.height;
  const popupW = Math.round(meta.width * scale);
  const popupH = POPUP_TARGET_H;
  const popup = await sharp(raw).resize(popupW, popupH, { fit: "fill" }).png().toBuffer();

  // SVG escape helper for text
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Background + right-column marketing copy as a single SVG.
  // Word-wrap the body manually using <tspan> rows; we estimate ~36 chars/line at this width.
  function wrapText(text, maxChars) {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  const bodyLines = wrapText(scenario.body, 38);

  const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E8F0FF"/>
      <stop offset="55%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#FFF4E6"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#015AFF" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#015AFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bg)"/>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#glow)"/>

  <!-- Brand mark + name (top-right) -->
  <g transform="translate(${CANVAS_W - 80}, 60)">
    <rect x="-220" y="-26" rx="8" ry="8" width="44" height="44" fill="#015AFF"/>
    <text x="-198" y="6" font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="18" font-weight="800" fill="#fff" text-anchor="middle">WA</text>
    <text x="-160" y="-2" font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="16" font-weight="700" fill="#2D3142">Contacts Exporter</text>
    <text x="-160" y="16" font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="11" fill="#6B7280">v1.0.0 · Bluedev</text>
  </g>

  <!-- Right column copy -->
  <g transform="translate(${TEXT_COL_X}, ${(CANVAS_H - 380) / 2})">
    <text x="0" y="0" font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="13" font-weight="700" fill="#015AFF" letter-spacing="2">
      ${esc(scenario.subhead.toUpperCase())}
    </text>
    <text x="0" y="56" font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="46" font-weight="800" fill="#2D3142" letter-spacing="-1">
      ${esc(scenario.heading)}
    </text>
    <g transform="translate(0, 110)">
      ${bodyLines
        .map(
          (ln, i) => `<text x="0" y="${i * 28}"
            font-family="-apple-system, Segoe UI, Inter, sans-serif"
            font-size="18" fill="#4B5563" font-weight="400">${esc(ln)}</text>`
        )
        .join("\n      ")}
    </g>
    <line x1="0" y1="${110 + bodyLines.length * 28 + 28}"
          x2="160" y2="${110 + bodyLines.length * 28 + 28}"
          stroke="#015AFF" stroke-width="2"/>
    <text x="0" y="${110 + bodyLines.length * 28 + 60}"
          font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-size="13" fill="#6B7280" font-weight="500">
      bluedev.dev/products/wa-contacts-exporter
    </text>
  </g>
</svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // Compose popup with drop shadow
  const popupWithShadow = await sharp({
    create: {
      width: popupW + SHADOW_PAD * 2,
      height: popupH + SHADOW_PAD * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: popupW,
            height: popupH,
            channels: 4,
            background: { r: 1, g: 41, b: 116, alpha: 0.32 },
          },
        }).blur(20).png().toBuffer(),
        top: SHADOW_PAD + 8,
        left: SHADOW_PAD,
      },
      { input: popup, top: SHADOW_PAD, left: SHADOW_PAD },
    ])
    .png()
    .toBuffer();

  const composedH = popupH + SHADOW_PAD * 2;
  const top = Math.round((CANVAS_H - composedH) / 2);
  const left = POPUP_COL_X - SHADOW_PAD;

  await sharp(bg)
    .composite([{ input: popupWithShadow, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

// ─────────────────────────────────────────────────────────────
// Legacy cleanup — remove the flat 0X_*.png files after the new
// locale-aware files are confirmed present.

const LEGACY_FLAT_FILES = [
  "01_sohbetler_tab.png",
  "02_mesajlar_tab.png",
  "03_ai_provider.png",
  "04_ai_suggestion.png",
  "05_oto_cevap.png",
];

async function removeLegacyFlatFiles() {
  for (const parent of [OUT_DOCS, OUT_LANDING]) {
    for (const f of LEGACY_FLAT_FILES) {
      const p = path.join(parent, f);
      try {
        await fs.unlink(p);
        console.log(`  ✗ removed legacy ${path.relative(ROOT, p)}`);
      } catch (err) {
        if (err && err.code !== "ENOENT") {
          console.warn(`  ⚠ could not remove ${p}: ${err.message}`);
        }
      }
    }
  }
}

async function cleanupTmp() {
  try {
    await fs.rm(TMP, { recursive: true, force: true });
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// Main

async function main() {
  const opts = parseArgs(process.argv);
  const localeLabel = opts.locales.join(" + ");
  console.log(`📸 WA Contacts Exporter — screenshot generator [${localeLabel}]\n`);
  await ensureBuilt();
  await ensureDirs(opts.locales);

  console.log("→ Static server :" + PORT + "  (serving dist/)");
  const server = await startServer();

  try {
    for (const locale of opts.locales) {
      const scenarios = buildScenarios(locale);
      console.log(`\n→ Capturing ${scenarios.length} scenarios via Playwright [${locale}]…`);
      await takeRawShotsForLocale(locale, scenarios);

      console.log(`\n→ Compositing [${locale}] onto 1280×800 brand canvas…`);
      for (const sc of scenarios) {
        const raw = path.join(TMP, `${locale}_${sc.name}.png`);
        const outDocs = path.join(OUT_DOCS, locale, `${sc.name}.png`);
        const outLanding = path.join(OUT_LANDING, locale, `${sc.name}.png`);
        await compositeShot(raw, outDocs, sc);
        await fs.copyFile(outDocs, outLanding);
        const stat = await fs.stat(outDocs);
        const kb = stat.size / 1024;
        const tag = kb < 50 ? " ⚠ TOO SMALL" : "";
        console.log(`  ✓ ${locale}/${sc.name}.png  (${kb.toFixed(0)} KB)${tag}`);
      }
    }

    // Legacy cleanup — only after all locales succeed.
    console.log("\n→ Removing legacy flat screenshots…");
    await removeLegacyFlatFiles();

    console.log("\n✅ Done. Screenshots written to:");
    for (const locale of opts.locales) {
      console.log(`   - ${path.relative(ROOT, path.join(OUT_DOCS, locale))}/`);
      console.log(`   - ${path.relative(ROOT, path.join(OUT_LANDING, locale))}/`);
    }

    if (!opts.keepTmp) await cleanupTmp();
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
