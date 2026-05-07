// record-demo.mjs — automated 90-second silent demo video.
//
// Pipeline:
//   1. Spin up local static server for dist/.
//   2. Generate a 1920×1080 wrapper page that hosts the popup in an iframe
//      surrounded by Bluedev brand chrome, scene title, caption banner,
//      synthetic cursor, click pulses.
//   3. Launch Playwright Chromium with recordVideo at viewport size.
//   4. Run a storyboard (7 scenes, ~90s) of cursor moves, clicks, captions.
//   5. Close the context to flush WebM, then ffmpeg → MP4 H.264 yuv420p.
//
// Output:  docs/demo/demo-90s.mp4 + landing/assets/demo.mp4

import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const DIST = path.join(ROOT, "dist");
const TMP = path.join(ROOT, "tmp-demo");
const OUT_DOCS = path.join(ROOT, "docs", "demo");
const OUT_LANDING = path.join(ROOT, "landing", "assets");
const PORT = 5175;

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const POPUP_W = 380;
const POPUP_H = 940;
const POPUP_X = 280;          // popup left edge — clears the bluedev logo at x=80
const POPUP_Y = 80;           // popup top edge inside canvas
const COPY_X  = 760;          // right column (scene info + caption) starts here
const COPY_W  = CANVAS_W - COPY_X - 100; // right padding 100

// ─────────────────────────────────────────────────────────────
// Demo data (mirrors take-screenshots.mjs)

const NOW_S = Math.floor(new Date("2026-05-06T15:00:00+03:00").getTime() / 1000);
const minutesAgo = (m) => NOW_S - m * 60;
const hoursAgo = (h) => NOW_S - h * 3600;
const daysAgo = (d) => NOW_S - d * 86400;

const DEMO_CHATS = [
  { id: "chat_1", contactName: "Ahmet Demo Yıldız",  phone: "+90 555 010 0001", isGroup: false, t: minutesAgo(8),  lastMessage: { t: minutesAgo(8) } },
  { id: "chat_2", contactName: "Ayşe Demo Çelik",    phone: "+90 555 010 0002", isGroup: false, t: minutesAgo(45), lastMessage: { t: minutesAgo(45) } },
  { id: "chat_3", formattedTitle: "Bluedev Demo Grubu",                         isGroup: true,  t: hoursAgo(2),    lastMessage: { t: hoursAgo(2) } },
  { id: "chat_4", contactName: "Mehmet Demo Kaya",   phone: "+90 555 010 0003", isGroup: false, t: hoursAgo(3),    lastMessage: { t: hoursAgo(3) } },
  { id: "chat_5", contactName: "Fatma Demo Aydın",   phone: "+90 555 010 0004", isGroup: false, t: hoursAgo(5),    lastMessage: { t: hoursAgo(5) } },
  { id: "chat_6", formattedTitle: "Ekip Demo Sohbeti",                          isGroup: true,  t: hoursAgo(7),    lastMessage: { t: hoursAgo(7) } },
  { id: "chat_7", contactName: "Hasan Demo Bey",     phone: "+90 555 010 0005", isGroup: false, t: hoursAgo(11),   lastMessage: { t: hoursAgo(11) } },
  { id: "chat_8", contactName: "Zeynep Demo Acar",   phone: "+90 555 010 0006", isGroup: false, t: daysAgo(1),     lastMessage: { t: daysAgo(1) } },
];

const DEMO_MESSAGES = [
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: false, sender_name: "Ahmet Demo Yıldız", body: "Merhaba, yarın saat 10:00'daki toplantı kalıyor mu?", t: minutesAgo(12) },
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: true,  body: "Evet, 10:00'da Zoom'da görüşelim. Linki birazdan gönderiyorum.",                          t: minutesAgo(10) },
  { chat_id: "chat_1", chat_name: "Ahmet Demo Yıldız", from_me: false, sender_name: "Ahmet Demo Yıldız", body: "Süper, teşekkürler.",                                   t: minutesAgo(8) },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Grubu", from_me: false, sender_name: "Mehmet Demo Kaya", body: "Sunum dosyasını paylaşır mısınız?",                     t: hoursAgo(2) - 60 },
  { chat_id: "chat_3", chat_name: "Bluedev Demo Grubu", from_me: true,  body: "Tamam, birazdan drive linkini atıyorum.",                                                  t: hoursAgo(2) },
  { chat_id: "chat_2", chat_name: "Ayşe Demo Çelik",    from_me: false, sender_name: "Ayşe Demo Çelik",  body: "Ürün demosunu nasıl ayarlayabiliriz?",                  t: minutesAgo(45) },
  { chat_id: "chat_2", chat_name: "Ayşe Demo Çelik",    from_me: true,  body: "Bu hafta perşembe öğleden sonra uygun musunuz?",                                            t: minutesAgo(40) },
  { chat_id: "chat_4", chat_name: "Mehmet Demo Kaya",   from_me: false, sender_name: "Mehmet Demo Kaya", body: "Faturayı bugün gönderebilir miyiz?",                    t: hoursAgo(3) },
  { chat_id: "chat_5", chat_name: "Fatma Demo Aydın",   from_me: false, sender_name: "Fatma Demo Aydın", body: "Toplantı notlarını paylaşırsanız sevinirim.",            t: hoursAgo(5) },
  { chat_id: "chat_6", chat_name: "Ekip Demo Sohbeti",  from_me: false, sender_name: "Hasan Demo Bey",   body: "Sprint planlama yarın 14:00'da mı?",                     t: hoursAgo(7) },
];

const DEMO_GROUPS = [
  { id: "chat_3", formattedTitle: "Bluedev Demo Grubu", participants: [{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }], t: hoursAgo(2), lastMessage: { t: hoursAgo(2) } },
  { id: "chat_6", formattedTitle: "Ekip Demo Sohbeti",  participants: [{ id: "u1" }, { id: "u5" }, { id: "u6" }], t: hoursAgo(7), lastMessage: { t: hoursAgo(7) } },
];

const DEMO_SUGGESTION = {
  title: "Cevap önerisi — Ahmet Demo Yıldız",
  targetMessage: "Merhaba, yarın saat 10:00'daki toplantı kalıyor mu?",
  body: "Merhaba Ahmet Bey, evet toplantı 10:00'da kalıyor. Zoom linkini birazdan size iletiyorum. Eğer ek bir gündem maddesi eklemek isterseniz bana yazabilirsiniz.",
  meta: "Local — Ollama · aya-expanse:8b · 2.4 sn",
};

// ─────────────────────────────────────────────────────────────
// Init script — runs in EVERY frame (main wrapper + popup iframe)
// Detects context via window.parent and sets up appropriate APIs.

function buildInitScript() {
  const stateJson = JSON.stringify({
    chats: DEMO_CHATS,
    messages: DEMO_MESSAGES,
    groups: DEMO_GROUPS,
  });
  return `
(() => {
  const isIframe = window !== window.top;
  const DEMO = ${stateJson};

  if (isIframe) {
    // ── Popup iframe context: stub chrome.* with demo data ──
    const STORE = {
      wa_consent: { accepted: true, ts: Date.now() },
      wa_settings: { includeUnsaved: false },
      wa_ai: {
        provider: "ollama", apiKey: "",
        baseUrl: "http://localhost:11434/v1",
        model: "aya-expanse:8b", modelMigrated: true,
      },
      wa_ai_per_chat: {},
      wa_autoreply: {
        masterEnabled: true, mode: "draft",
        perChat: { chat_2: { enabled: true, instructions: "Profesyonel ve nazik ton kullan." } },
        rateLimit: { maxPerHour: 10, maxPerDay: 50 },
        quietHours: { enabled: true, startHour: 22, endHour: 8 },
        history: [],
        pending: [],
      },
      wa_debug_log: [],
    };
    const HEALTH_OK = {
      ok: true,
      modules: { Chat: true, GroupMetadata: true, Label: true, LabelAssociation: true, Contact: true, WidFactory: true },
      version: "2.3000.demo", moduleCount: 6,
    };
    const clone = (v) => { try { return JSON.parse(JSON.stringify(v)); } catch { return v; } };

    function storageGet(keys) {
      if (keys == null) return clone(STORE);
      if (typeof keys === "string") return { [keys]: clone(STORE[keys]) };
      if (Array.isArray(keys)) { const o = {}; for (const k of keys) o[k] = clone(STORE[k]); return o; }
      if (typeof keys === "object") { const o = {}; for (const k of Object.keys(keys)) o[k] = clone(STORE[k] !== undefined ? STORE[k] : keys[k]); return o; }
      return {};
    }

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
          case "list-labels":      return { ok: true, data: [{ id: "lbl_1", name: "Müşteri", color: "#10B981", chatCount: 12, isSystem: false }] };
          case "list-contacts":    return { ok: true, data: DEMO.chats.filter(c => !c.isGroup) };
          case "subscribe-new-messages":   return { ok: true };
          case "unsubscribe-new-messages": return { ok: true };
          case "send-text-message": return { ok: true };
          default: return { ok: true, data: [] };
        }
      }
      return { ok: true };
    }

    Object.defineProperty(window, "chrome", {
      value: {
        runtime: {
          id: "demo-extension-id",
          sendMessage: (m) => Promise.resolve(m && m.kind === "DOWNLOAD" ? { ok: true } : { ok: true }),
          onMessage: { addListener: () => {}, removeListener: () => {} },
          getURL: (p) => "/" + p.replace(/^\\.?\\//, ""),
          lastError: null,
        },
        tabs: {
          query: () => Promise.resolve([{ id: 99, url: "https://web.whatsapp.com/", active: true }]),
          sendMessage: (id, m) => Promise.resolve(handleTabsMessage(m)),
        },
        storage: {
          local: {
            get: (k) => Promise.resolve(storageGet(k)),
            set: (i) => { for (const k of Object.keys(i)) STORE[k] = i[k]; return Promise.resolve(); },
            remove: (k) => { const a = Array.isArray(k) ? k : [k]; for (const x of a) delete STORE[x]; return Promise.resolve(); },
            clear: () => { for (const k of Object.keys(STORE)) delete STORE[k]; return Promise.resolve(); },
          },
        },
        downloads: { download: () => Promise.resolve(1) },
      },
      writable: false, configurable: false,
    });

    // Inject highlight style into iframe popup
    const styleId = "__demo-highlight-style";
    const installStyle = () => {
      if (document.getElementById(styleId)) return;
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = \`
        .__demo-highlight {
          outline: 3px solid #015AFF !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 6px rgba(1, 90, 255, 0.18) !important;
          border-radius: 6px !important;
          transition: box-shadow 0.3s, outline 0.3s !important;
        }
      \`;
      document.head.appendChild(s);
    };
    if (document.head) installStyle();
    else document.addEventListener("DOMContentLoaded", installStyle);
  } else {
    // ── Main wrapper page context: cursor + click pulse + captions ──
    window.__cursorPos = { x: 100, y: 100 };

    window.__moveCursor = (x, y, duration = 700) => new Promise((resolve) => {
      const el = document.getElementById("synthetic-cursor");
      if (!el) return resolve();
      el.style.opacity = "1";
      const sx = window.__cursorPos.x;
      const sy = window.__cursorPos.y;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        // smoothstep easing
        const e = t * t * (3 - 2 * t);
        const cx = sx + (x - sx) * e;
        const cy = sy + (y - sy) * e;
        el.style.transform = \`translate(\${cx}px, \${cy}px)\`;
        window.__cursorPos = { x: cx, y: cy };
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });

    window.__clickPulse = (x, y) => {
      const layer = document.getElementById("pulse-layer");
      if (!layer) return;
      const p = document.createElement("div");
      p.className = "click-pulse";
      p.style.left = (x - 30) + "px";
      p.style.top = (y - 30) + "px";
      layer.appendChild(p);
      setTimeout(() => p.remove(), 700);
    };

    window.__showCaption = (text) => {
      const c = document.getElementById("caption");
      if (!c) return;
      c.textContent = text;
      c.classList.add("visible");
    };
    window.__hideCaption = () => {
      const c = document.getElementById("caption");
      if (c) c.classList.remove("visible");
    };
    window.__setScene = (n, total, title, sub) => {
      const t = document.getElementById("scene-title");
      const s = document.getElementById("scene-sub");
      const p = document.getElementById("scene-progress");
      if (t) t.textContent = title;
      if (s) s.textContent = sub;
      if (p) p.textContent = \`Sahne \${n}/\${total}\`;
      // brief fade-in to draw attention
      if (t) {
        t.style.transition = "none";
        t.style.transform = "translateY(8px)";
        t.style.opacity = "0";
        requestAnimationFrame(() => {
          t.style.transition = "opacity 0.4s, transform 0.4s";
          t.style.transform = "translateY(0)";
          t.style.opacity = "1";
        });
      }
    };

    window.__setHeroVisible = (visible) => {
      const hero = document.getElementById("hero");
      if (!hero) return;
      // Hero starts visible (no class). To hide, add "hidden". To show, remove.
      if (visible) hero.classList.remove("hidden");
      else         hero.classList.add("hidden");
    };

    window.__setOutroVisible = (visible) => {
      const outro = document.getElementById("outro");
      if (!outro) return;
      if (visible) outro.classList.add("visible");
      else         outro.classList.remove("visible");
    };

    // Suggestion + autoreply pending injectors that reach into the iframe.
    window.__injectSuggestion = (data) => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr || !ifr.contentDocument) return;
      const d = ifr.contentDocument;
      const card = d.getElementById("suggestion-card");
      if (!card) return;
      d.getElementById("suggestion-title").textContent = data.title;
      d.getElementById("suggestion-target").textContent = "📩  " + data.targetMessage;
      d.getElementById("suggestion-body").textContent = data.body;
      d.getElementById("suggestion-meta").textContent = data.meta;
      card.hidden = false;
    };

    window.__injectAutoReplyPending = () => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr || !ifr.contentDocument) return;
      const d = ifr.contentDocument;
      const list = d.getElementById("ar-pending-list");
      const empty = d.getElementById("ar-pending-empty");
      if (!list) return;
      list.innerHTML = \`
        <div style="background:#fff;border:1px solid #015AFF;border-radius:8px;padding:12px;margin-top:8px;box-shadow:0 1px 3px rgba(45,49,66,0.08);">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#2D3142;margin-bottom:6px;">
            <strong>Ayşe Demo Çelik</strong><span style="color:#6B7280;">45 dk önce</span>
          </div>
          <div style="font-size:12px;background:#F8FAFC;padding:6px 8px;border-radius:4px;margin-bottom:6px;">📩 Ürün demosunu nasıl ayarlayabiliriz?</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:2px;">AI önerisi (taslak):</div>
          <div style="font-size:12px;background:#E8F0FF;padding:6px 8px;border-radius:4px;margin-bottom:8px;line-height:1.45;">
            Merhaba Ayşe Hanım, demo için bu hafta perşembe 14:00 veya cuma 11:00 saatlerinde Zoom üzerinden buluşabiliriz. Sizin için hangisi daha uygun olur?
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn--primary" style="font-size:12px;padding:5px 10px;">Gönder</button>
            <button class="btn btn--ghost" style="font-size:12px;padding:5px 10px;">Düzelt</button>
            <button class="btn btn--ghost" style="font-size:12px;padding:5px 10px;">Sil</button>
          </div>
        </div>\`;
      if (empty) empty.style.display = "none";
    };

    window.__highlightInIframe = (selector) => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr || !ifr.contentDocument) return;
      const d = ifr.contentDocument;
      // Clear previous highlights
      d.querySelectorAll(".__demo-highlight").forEach(el => el.classList.remove("__demo-highlight"));
      const target = d.querySelector(selector);
      if (target) target.classList.add("__demo-highlight");
    };

    window.__clearHighlight = () => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr || !ifr.contentDocument) return;
      ifr.contentDocument.querySelectorAll(".__demo-highlight").forEach(el => el.classList.remove("__demo-highlight"));
    };

    window.__getIframeBox = () => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr) return null;
      const r = ifr.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };

    window.__getIframeElementCenter = (selector) => {
      const ifr = document.getElementById("popup-iframe");
      if (!ifr || !ifr.contentDocument) return null;
      const r = ifr.getBoundingClientRect();
      const el = ifr.contentDocument.querySelector(selector);
      if (!el) return null;
      const er = el.getBoundingClientRect();
      return { x: r.left + er.left + er.width / 2, y: r.top + er.top + er.height / 2 };
    };
  }
})();
`;
}

// ─────────────────────────────────────────────────────────────
// Wrapper HTML — the recorder stage

function buildWrapperHtml() {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>WA Contacts Exporter — Demo</title>
  <style>
    /* No external font import — system stack only (avoids blank-render-on-load). */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${CANVAS_W}px; height: ${CANVAS_H}px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: #2D3142;
    }
    body {
      position: relative;
      background:
        radial-gradient(ellipse at 25% 30%, rgba(1, 90, 255, 0.10), transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(251, 146, 60, 0.10), transparent 60%),
        linear-gradient(135deg, #E8F0FF 0%, #F8FAFC 50%, #FFF4E6 100%);
    }

    /* Top-right is intentionally empty — the bluedev wordmark top-left
       already carries publisher branding, and the popup itself shows the
       product name in its own header. */

    /* Scene info — RIGHT column, above caption area, NEVER overlaps popup */
    .scene-info {
      position: absolute;
      left: ${COPY_X}px; top: 180px;
      width: ${COPY_W}px;
      z-index: 5;
    }
    .scene-progress {
      font-size: 14px; font-weight: 800; color: #015AFF;
      letter-spacing: 3px; text-transform: uppercase;
      margin-bottom: 16px;
    }
    .scene-title {
      font-size: 64px; font-weight: 900; color: #2D3142;
      letter-spacing: -2px; line-height: 1.0;
      margin-bottom: 14px;
      transition: opacity 0.4s, transform 0.4s;
    }
    .scene-sub {
      font-size: 22px; color: #6B7280; font-weight: 500;
      line-height: 1.4;
    }

    /* Stage = the popup area + caption */
    #stage { opacity: 1; transition: opacity 0.6s; }

    /* Popup iframe wrapper with shadow */
    .popup-wrap {
      position: absolute;
      left: ${POPUP_X}px; top: ${POPUP_Y}px;
      width: ${POPUP_W}px; height: ${POPUP_H}px;
      border-radius: 16px;
      box-shadow:
        0 30px 80px rgba(1, 41, 116, 0.25),
        0 8px 24px rgba(1, 41, 116, 0.10);
      background: #fff;
      overflow: hidden;
    }
    .popup-wrap iframe {
      width: 100%; height: 100%; border: none; display: block;
    }

    /* Caption banner — sits in the right column below scene-info */
    .caption {
      position: absolute;
      left: ${COPY_X}px;
      top: 480px;
      width: ${COPY_W}px;
      padding: 32px 40px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(1, 90, 255, 0.18);
      border-left: 6px solid #015AFF;
      border-radius: 16px;
      font-size: 28px;
      line-height: 1.5;
      color: #2D3142;
      font-weight: 500;
      box-shadow: 0 16px 40px rgba(45, 49, 66, 0.12);
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.4s, transform 0.4s;
      z-index: 4;
    }
    .caption.visible { opacity: 1; transform: translateY(0); }

    /* Hero scene (full-screen intro) — solid (opaque) so it covers stage cleanly */
    #hero {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 20px;
      opacity: 1;
      transition: opacity 0.6s;
      z-index: 8;
      background:
        radial-gradient(ellipse at 50% 35%, rgba(1, 90, 255, 0.20), transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(251, 146, 60, 0.10), transparent 60%),
        linear-gradient(135deg, #E8F0FF 0%, #F4F8FF 50%, #FFF4E6 100%);
    }
    #hero.hidden { opacity: 0; pointer-events: none; }
    .hero-mark {
      width: 140px; height: 140px;
      background: #015AFF; color: #fff;
      border-radius: 32px;
      display: grid; place-items: center;
      font-weight: 900; font-size: 60px;
      letter-spacing: -2px;
      box-shadow: 0 24px 64px rgba(1, 90, 255, 0.40);
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: 100px;
      font-weight: 900;
      letter-spacing: -3px;
      color: #2D3142;
      line-height: 1.0;
    }
    .hero-sub {
      font-size: 30px;
      color: #6B7280;
      font-weight: 500;
      margin-top: 8px;
    }
    .hero-tag {
      margin-top: 32px;
      padding: 12px 28px;
      background: rgba(1, 90, 255, 0.12);
      color: #015AFF;
      font-weight: 800;
      font-size: 18px;
      border-radius: 999px;
      letter-spacing: 2px;
    }

    /* Outro scene */
    #outro {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 26px;
      opacity: 0; pointer-events: none;
      transition: opacity 0.6s;
      z-index: 8;
      background:
        radial-gradient(ellipse at 50% 50%, rgba(1, 90, 255, 0.18), transparent 65%),
        linear-gradient(180deg, #F8FAFC 0%, #E8F0FF 100%);
    }
    #outro.visible { opacity: 1; }
    .outro-mark {
      width: 120px; height: 120px;
      background: #015AFF; color: #fff;
      border-radius: 26px;
      display: grid; place-items: center;
      font-weight: 900; font-size: 52px;
      box-shadow: 0 20px 60px rgba(1, 90, 255, 0.36);
    }
    .outro-title {
      font-size: 80px; font-weight: 900;
      color: #2D3142; letter-spacing: -2px;
    }
    .outro-tagline {
      font-size: 28px; color: #6B7280;
      max-width: 1000px; text-align: center;
      line-height: 1.5;
    }
    .outro-cta {
      margin-top: 24px;
      padding: 22px 48px;
      background: #015AFF; color: #fff;
      font-weight: 900; font-size: 26px;
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(1, 90, 255, 0.40);
      letter-spacing: 0.5px;
    }

    /* Synthetic cursor */
    #synthetic-cursor {
      position: absolute;
      left: 0; top: 0;
      width: 28px; height: 36px;
      pointer-events: none;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
      will-change: transform;
    }

    /* Click pulse */
    #pulse-layer { position: absolute; inset: 0; pointer-events: none; z-index: 99; }
    .click-pulse {
      position: absolute;
      width: 60px; height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(1,90,255,0.75) 0%, rgba(1,90,255,0) 70%);
      animation: pulse 700ms ease-out forwards;
      pointer-events: none;
    }
    @keyframes pulse {
      0%   { transform: scale(0.4); opacity: 0.85; }
      100% { transform: scale(2.6); opacity: 0;    }
    }

    /* Footer URL bottom-left */
    .footer-url {
      position: absolute;
      bottom: 40px; left: ${POPUP_X}px;
      font-size: 14px;
      color: #6B7280;
      font-weight: 700;
      letter-spacing: 1px;
      z-index: 5;
    }

    /* Persistent Bluedev wordmark — top-left, ABOVE every overlay */
    .bluedev-logo {
      position: absolute;
      top: 60px;
      left: 80px;
      z-index: 10;
      filter: drop-shadow(0 2px 6px rgba(45, 49, 66, 0.18));
    }
  </style>
</head>
<body>
  <!-- Stage (popup interaction) -->
  <div id="stage">
    <div class="scene-info">
      <div id="scene-progress" class="scene-progress">SAHNE 1/7</div>
      <div id="scene-title" class="scene-title">WhatsApp Web</div>
      <div id="scene-sub"   class="scene-sub">Yönetin · Dışa aktarın · AI ile geliştirin</div>
    </div>

    <div class="popup-wrap">
      <iframe id="popup-iframe" src="src/popup/popup.html"></iframe>
    </div>

    <div id="caption" class="caption">caption</div>

    <div class="footer-url">bluedev.dev/products/wa-contacts-exporter</div>
  </div>

  <!-- Hero (intro) overlay — visible by default, hidden after scene 1 -->
  <div id="hero">
    <div class="hero-mark">WA</div>
    <div class="hero-title">Contacts Exporter</div>
    <div class="hero-sub">WhatsApp Web · Export + AI · Bluedev</div>
    <div class="hero-tag">BETA</div>
  </div>

  <!-- Outro overlay -->
  <div id="outro">
    <div class="outro-mark">WA</div>
    <div class="outro-title">Beta · Ücretsiz</div>
    <div class="outro-tagline">
      WhatsApp Web verilerinizi yerel olarak dışa aktarın, AI ile yönetin.
      KVKK uyumlu — veri tarayıcınızdan çıkmaz.
    </div>
    <div class="outro-cta">bluedev.dev/products/wa-contacts-exporter</div>
  </div>

  <!-- Persistent Bluedev wordmark (always visible, above hero/outro) -->
  <svg class="bluedev-logo" width="170" height="46" viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="74"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
          font-weight="900" font-size="92" letter-spacing="-5">
      <tspan fill="#015AFF">blue</tspan><tspan fill="#1F2937">dev</tspan>
    </text>
  </svg>

  <!-- Effects layers -->
  <div id="pulse-layer"></div>
  <svg id="synthetic-cursor" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M 4 2 L 4 26 L 11 20 L 15 32 L 19 30 L 15 19 L 24 19 Z"
          fill="white" stroke="#1F2937" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────
// Static server

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

function startServer(wrapperHtml) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split("?")[0]);
        if (urlPath === "/" || urlPath === "/recorder.html") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          return res.end(wrapperHtml);
        }
        const filePath = path.join(DIST, urlPath);
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
// Storyboard helpers

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function moveTo(page, sel, dur = 700) {
  const c = await page.evaluate((s) => window.__getIframeElementCenter(s), sel);
  if (!c) return;
  await page.evaluate(([x, y, d]) => window.__moveCursor(x, y, d), [c.x, c.y, dur]);
  // page.evaluate returns when promise resolves; movement uses RAF — wait its duration
  await sleep(dur + 50);
}

async function moveToPoint(page, x, y, dur = 700) {
  await page.evaluate(([x, y, d]) => window.__moveCursor(x, y, d), [x, y, dur]);
  await sleep(dur + 50);
}

async function highlight(page, sel) {
  await page.evaluate((s) => window.__highlightInIframe(s), sel);
}

async function clearHighlight(page) {
  await page.evaluate(() => window.__clearHighlight());
}

async function clickInIframe(page, sel) {
  const c = await page.evaluate((s) => window.__getIframeElementCenter(s), sel);
  if (c) await page.evaluate(([x, y]) => window.__clickPulse(x, y), [c.x, c.y]);
  await sleep(120);
  // Real click via frameLocator
  await page.frameLocator("#popup-iframe").locator(sel).first().click();
}

async function caption(page, text, holdMs = 2400) {
  await page.evaluate((t) => window.__showCaption(t), text);
  await sleep(holdMs);
  await page.evaluate(() => window.__hideCaption());
  await sleep(350);
}

async function setScene(page, n, total, title, sub) {
  await page.evaluate(([n, t, ti, su]) => window.__setScene(n, t, ti, su), [n, total, title, sub]);
}

// ─────────────────────────────────────────────────────────────
// The 7-scene storyboard (~90 seconds total)

async function runStoryboard(page) {
  const TOTAL = 7;

  // ───── Scene 1: Hook (~6s) ─────
  // Pre-set scene-info text so when hero fades the placeholder defaults
  // are replaced with branded copy.
  await setScene(page, 1, TOTAL, "WhatsApp Web", "Yönetin · Dışa aktarın · AI ile geliştirin");
  // Hero overlay shown by default; hold long enough to read the headline.
  await sleep(5500);
  await page.evaluate(() => window.__setHeroVisible(false));
  await sleep(900);

  // ───── Scene 2: Sohbetler (12s) ─────
  await setScene(page, 2, TOTAL, "Sohbetler", "Tek tıkla CSV / XLSX / VCard");
  await highlight(page, '[data-tab="chats"]');
  await moveTo(page, '[data-tab="chats"]', 700);
  await caption(page, "Sohbetler sekmesi — 8 demo sohbet hazır.", 2200);
  await clearHighlight(page);

  await highlight(page, '#extract-chats-btn');
  await moveTo(page, '#extract-chats-btn', 600);
  await caption(page, "Çıkar — anında preview tablosunda.", 1800);
  await clickInIframe(page, '#extract-chats-btn');
  await clearHighlight(page);
  await sleep(1200);

  await highlight(page, '#chats-export-csv');
  await moveTo(page, '#chats-export-csv', 600);
  await caption(page, "CSV / XLSX / VCard — UTF-8 BOM ile Excel'de Türkçe karakter sorunsuz.", 2800);
  await clearHighlight(page);

  // ───── Scene 3: Mesajlar (12s) ─────
  await setScene(page, 3, TOTAL, "Mesajlar", "Sohbet başına 100-5000 mesaj");
  await highlight(page, '[data-tab="messages"]');
  await moveTo(page, '[data-tab="messages"]', 600);
  await caption(page, "Mesajlar sekmesi.", 1500);
  await clickInIframe(page, '[data-tab="messages"]');
  await clearHighlight(page);
  await sleep(700);

  await highlight(page, '#messages-per-chat-limit');
  await moveTo(page, '#messages-per-chat-limit', 500);
  await caption(page, "Sohbet başına 500 mesaj — istersen 5000'e kadar.", 2400);
  await clearHighlight(page);

  await highlight(page, '#extract-messages-btn');
  await moveTo(page, '#extract-messages-btn', 500);
  await clickInIframe(page, '#extract-messages-btn');
  await caption(page, "10 mesaj — 6 sohbet · ortalama 1.7 mesaj/sohbet.", 2600);
  await clearHighlight(page);

  // ───── Scene 4: AI sağlayıcı (18s) ─────
  await setScene(page, 4, TOTAL, "AI Asistan", "6 sağlayıcı · Yerel veya bulut");
  await highlight(page, '[data-tab="ai"]');
  await moveTo(page, '[data-tab="ai"]', 600);
  await clickInIframe(page, '[data-tab="ai"]');
  await caption(page, "AI Asistan sekmesi.", 1500);
  await clearHighlight(page);
  await sleep(500);

  await highlight(page, '#ai-config summary');
  await moveTo(page, '#ai-config summary', 600);
  await clickInIframe(page, '#ai-config summary');
  await caption(page, "Sağlayıcı: Yerel Ollama — sıfır maliyet, veri cihazda.", 2800);
  await clearHighlight(page);
  await sleep(500);

  await highlight(page, '#ai-provider');
  await moveTo(page, '#ai-provider', 700);
  await caption(page, "Ollama, LM Studio, Claude, ChatGPT, Gemini, Groq — tercih senin.", 3200);
  await clearHighlight(page);

  await highlight(page, '#ai-model-info, .ai-model-info');
  await caption(page, "Aya Expanse 8B — Cohere'in 23 dil için eğittiği Türkçe-dostu model.", 3000);
  await clearHighlight(page);

  // ───── Scene 5: Cevap önerisi (18s) ─────
  await setScene(page, 5, TOTAL, "İteratif öneri", "Yenile · Düzelt · Kopyala");
  await page.evaluate((sug) => window.__injectSuggestion(sug), DEMO_SUGGESTION);
  await sleep(600);

  await highlight(page, '#suggestion-card');
  await moveTo(page, '#suggestion-target', 700);
  await caption(page, "Hedef mesajı kart başına alıntılanır — bağlam net.", 2800);

  await moveTo(page, '#suggestion-body', 600);
  await caption(page, "AI sizin geçmiş mesajlarınızdan üslubunuzu öğrenir.", 3000);

  await highlight(page, '#suggestion-refresh');
  await moveTo(page, '#suggestion-refresh', 600);
  await caption(page, "Beğenmediğiniz öneriyi yenileyebilir,", 2000);

  await highlight(page, '#suggestion-feedback');
  await moveTo(page, '#suggestion-feedback', 600);
  await caption(page, "geri bildirimle iyileştirebilirsiniz.", 2000);

  await highlight(page, '#suggestion-copy');
  await moveTo(page, '#suggestion-copy', 600);
  await caption(page, "Tek tıkla kopyala → WhatsApp'a yapıştır.", 2400);
  await clearHighlight(page);

  // ───── Scene 6: Otomatik cevap (15s) ─────
  await setScene(page, 6, TOTAL, "Otomatik cevap", "Taslak modu varsayılan");
  await highlight(page, '[data-tab="autoreply"]');
  await moveTo(page, '[data-tab="autoreply"]', 600);
  await clickInIframe(page, '[data-tab="autoreply"]');
  await caption(page, "Oto-Cevap sekmesi.", 1400);
  await clearHighlight(page);
  await sleep(600);

  await highlight(page, '#ar-mode');
  await moveTo(page, '#ar-mode', 600);
  await caption(page, "Taslak modu varsayılan — AI önerir, siz onaylayıp gönderirsiniz.", 3200);
  await clearHighlight(page);

  await highlight(page, '#ar-quiet-enabled');
  await moveTo(page, '#ar-quiet-enabled', 600);
  await caption(page, "Sessiz saatler · saatlik limit · sohbet bazlı opt-in.", 2800);
  await clearHighlight(page);

  await page.evaluate(() => window.__injectAutoReplyPending());
  await sleep(400);
  await highlight(page, '#ar-pending-list');
  await moveTo(page, '#ar-pending-list', 700);
  await caption(page, "Bekleyen taslaklar — onayla ya da düzelt.", 2400);
  await clearHighlight(page);

  // ───── Scene 7: Outro (5s) ─────
  await page.evaluate(() => window.__setOutroVisible(true));
  await sleep(4500);
}

// ─────────────────────────────────────────────────────────────
// ffmpeg WebM → MP4

function findFfmpeg() {
  const candidates = [
    "ffmpeg",
    "C:\\Users\\adagidir\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe",
  ];
  return candidates[1]; // we know exact path from earlier check
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const bin = findFfmpeg();
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

// Generate a procedural ambient music bed:
//   C major chord pad (C3, G3, C4, E4, G4, C5) summed without normalization,
//   then aecho for reverb, gentle tremolo for shimmer, hi/lo-pass for warmth,
//   and an alimiter to keep peaks under control. Fades in 3s, fades out 5s.
//   Output: stereo 44.1 kHz WAV at roughly -20 LUFS (subtle background).
async function generateAmbient(outPath, durationSec) {
  const fadeOutSt = Math.max(0, durationSec - 5);
  await runFfmpeg([
    "-y",
    "-f", "lavfi", "-i", `sine=f=130.81:d=${durationSec}`,    // C3
    "-f", "lavfi", "-i", `sine=f=196.00:d=${durationSec}`,    // G3
    "-f", "lavfi", "-i", `sine=f=261.63:d=${durationSec}`,    // C4
    "-f", "lavfi", "-i", `sine=f=329.63:d=${durationSec}`,    // E4
    "-f", "lavfi", "-i", `sine=f=392.00:d=${durationSec}`,    // G4
    "-f", "lavfi", "-i", `sine=f=523.25:d=${durationSec}`,    // C5 sparkle
    "-filter_complex", [
      "[0]volume=0.30[a0]",
      "[1]volume=0.22[a1]",
      "[2]volume=0.18[a2]",
      "[3]volume=0.14[a3]",
      "[4]volume=0.11[a4]",
      "[5]volume=0.08[a5]",
      // Sum without normalization (normalize=0) so layered amplitude survives.
      "[a0][a1][a2][a3][a4][a5]amix=inputs=6:duration=longest:normalize=0",
      // Reverb-like multi-tap delay.
      "aecho=0.8:0.5:600|1100|1700|2300:0.4|0.3|0.2|0.1",
      // Gentle global tremolo for breathing effect.
      "tremolo=f=0.15:d=0.20",
      // Tone shaping.
      "highpass=f=80",
      "lowpass=f=3500",
      // Master gain + peak limiter (prevents any clipping while keeping loudness).
      "volume=3.5",
      "alimiter=level_in=1:level_out=1:limit=0.7:attack=5:release=80",
      `afade=t=in:st=0:d=3,afade=t=out:st=${fadeOutSt}:d=5`,
    ].join(","),
    "-ac", "2",
    "-ar", "44100",
    "-t", String(durationSec),
    outPath,
  ]);
}

// Convert the raw WebM screen capture into the final MP4, optionally mixing
// in a music bed. trimStartSec drops the page-boot blank seconds.
async function convertToMp4(webmPath, mp4Path, opts = {}) {
  const trimStartSec = opts.trimStartSec ?? 2;
  const audioPath = opts.audioPath ?? null;

  const args = [
    "-y",
    "-ss", String(trimStartSec), "-i", webmPath,
  ];
  if (audioPath) args.push("-i", audioPath);

  args.push(
    "-map", "0:v:0",
    ...(audioPath ? ["-map", "1:a:0"] : []),
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    // No fade-in: keeps the very first frame as the fully-rendered hero so
    // WhatsApp Status / other thumbnail extractors get a meaningful preview.
    "-vf", `scale=${CANVAS_W}:${CANVAS_H}:flags=lanczos`,
    "-r", "30",
  );
  if (audioPath) {
    args.push("-c:a", "aac", "-b:a", "128k", "-shortest");
  } else {
    args.push("-an");
  }
  args.push(mp4Path);

  await runFfmpeg(args);
}

// Re-mux the MP4 with an embedded poster image as MP4 cover art.
// Many players (WhatsApp Status, VLC, file-explorer thumbnails) prefer the
// embedded "attached_pic" stream over heuristic frame-grabbing.
async function attachPoster(mp4Path, posterPath) {
  const tmpOut = mp4Path.replace(/\.mp4$/, ".__tmp__.mp4");
  await runFfmpeg([
    "-y",
    "-i", mp4Path,
    "-i", posterPath,
    "-map", "0",
    "-map", "1",
    "-c", "copy",
    "-c:v:1", "mjpeg",
    "-disposition:v:1", "attached_pic",
    "-movflags", "+faststart",
    tmpOut,
  ]);
  await fs.rename(tmpOut, mp4Path);
}

// Extract a representative frame from the video to use as the poster.
// We grab a frame ~1 second in (well after the trim point) so the hero
// is fully rendered.
async function extractPoster(videoPath, posterPath, atSec = 1.0) {
  await runFfmpeg([
    "-y",
    "-ss", String(atSec),
    "-i", videoPath,
    "-frames:v", "1",
    "-q:v", "2",          // high-quality JPEG
    posterPath,
  ]);
}

// ─────────────────────────────────────────────────────────────
// Main

async function ensureDirs() {
  for (const d of [TMP, OUT_DOCS, OUT_LANDING]) {
    await fs.mkdir(d, { recursive: true });
  }
}

async function ensureBuilt() {
  if (!existsSync(path.join(DIST, "src", "popup", "popup.html"))) {
    throw new Error(`dist/src/popup/popup.html bulunamadı. Önce 'npm run build' çalıştır.`);
  }
}

async function main() {
  console.log("🎬 WA Contacts Exporter — silent demo recorder\n");
  await ensureBuilt();
  await ensureDirs();

  const wrapperHtml = buildWrapperHtml();
  const initScript = buildInitScript();

  console.log(`→ Static server :${PORT}  (serving dist/ + /recorder.html)`);
  const server = await startServer(wrapperHtml);

  let browser;
  let webmPath;
  try {
    console.log("→ Launching Chromium with recordVideo (1920×1080 @ 30fps)…");
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: CANVAS_W, height: CANVAS_H },
      deviceScaleFactor: 1,
      recordVideo: { dir: TMP, size: { width: CANVAS_W, height: CANVAS_H } },
    });
    await ctx.addInitScript(initScript);
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/recorder.html`, { waitUntil: "load" });
    // Wait for popup iframe to fully boot
    const frame = page.frameLocator("#popup-iframe");
    await frame.locator("#tabs:not([hidden])").waitFor({ timeout: 15000 });
    await sleep(800); // breathing room before scene 1

    console.log("→ Running 7-scene storyboard (~90s)…");
    const t0 = Date.now();
    await runStoryboard(page);
    console.log(`  · scenes complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    // Resolve video filename
    const videoHandle = page.video();
    await ctx.close();
    if (videoHandle) {
      webmPath = await videoHandle.path();
      console.log(`→ Raw WebM: ${path.relative(ROOT, webmPath)}`);
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (!webmPath) throw new Error("Video path could not be resolved.");

  // Music intentionally omitted — silent demo per user preference.
  // To add a track later, set MUSIC_PATH env var to an mp3/wav path and
  // pass it as { audioPath } to convertToMp4 below.
  console.log("→ ffmpeg: WebM → MP4 (h.264 yuv420p, silent, no fade-in)…");
  const mp4Out = path.join(OUT_DOCS, "demo-90s.mp4");
  const customAudio = process.env.MUSIC_PATH;
  await convertToMp4(webmPath, mp4Out, {
    trimStartSec: 2,
    audioPath: customAudio || null,
  });

  console.log("→ ffmpeg: extracting poster + embedding as MP4 cover art…");
  const posterPath = path.join(OUT_DOCS, "poster.jpg");
  await extractPoster(mp4Out, posterPath, 1.0);
  await attachPoster(mp4Out, posterPath);

  const landingMp4 = path.join(OUT_LANDING, "demo.mp4");
  const landingPoster = path.join(OUT_LANDING, "demo-poster.jpg");
  await fs.copyFile(mp4Out, landingMp4);
  await fs.copyFile(posterPath, landingPoster);

  const stat = await fs.stat(mp4Out);
  const posterStat = await fs.stat(posterPath);
  console.log("\n✅ Done.");
  console.log(`  → ${path.relative(ROOT, mp4Out)}      (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  → ${path.relative(ROOT, posterPath)}        (${(posterStat.size / 1024).toFixed(0)} KB · embedded as cover)`);
  console.log(`  → ${path.relative(ROOT, landingMp4)}  (copy)`);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
