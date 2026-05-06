// Content script (ISOLATED world) — runs at document_start. Two jobs:
//   (1) IMMEDIATELY inject inject.js into the page via a <script src> tag.
//       This places inject.js in the MAIN world before WhatsApp Web's bundle
//       loads, so we can hook __d via Object.defineProperty.
//   (2) Bridge popup ↔ MAIN-world inject.js via window.postMessage + chrome.runtime.

const SOURCE = "wa-exporter";

console.log("[wa-exporter] content script loaded on", location.hostname);

// (1) Inject MAIN-world script tag — must be done as early as possible.
(function injectMainWorldScript() {
  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/inject.js");
    script.async = false;
    script.onload = () => {
      console.log("[wa-exporter] inject.js loaded into page (script tag)");
      script.remove();
    };
    script.onerror = (err) => {
      console.error("[wa-exporter] inject.js failed to load:", err);
    };
    (document.documentElement || document.head).appendChild(script);
  } catch (err) {
    console.error("[wa-exporter] script tag injection failed:", err);
  }
})();

// (2) Relay setup — same as before, hardened against extension reload.
let latestHealth = null;
let alive = true;

function isExtensionAlive() {
  if (!alive) return false;
  try { return !!(chrome.runtime && chrome.runtime.id); } catch { return false; }
}

function markDead() {
  if (!alive) return;
  alive = false;
  console.log("[wa-exporter] extension context invalidated — content script standing down");
}

function safeSendMessage(msg) {
  if (!isExtensionAlive()) return;
  try {
    const p = chrome.runtime.sendMessage(msg);
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        const s = err && err.message ? err.message : String(err);
        if (s.includes("Extension context invalidated")) markDead();
      });
    }
  } catch (err) {
    const s = err && err.message ? err.message : String(err);
    if (s.includes("Extension context invalidated")) markDead();
  }
}

window.addEventListener("message", (event) => {
  if (!isExtensionAlive()) return;
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== SOURCE) return;
  if (data.type === "WA_HEALTH") {
    latestHealth = data;
    safeSendMessage({ kind: "WA_HEALTH", payload: data });
  }
  // Forward new-message events to the background SW so any open popup can
  // receive them — and so a service-worker-hosted auto-reply orchestrator
  // could subscribe in the future. For now the popup needs to be open.
  if (data.type === "WA_NEW_MSG") {
    safeSendMessage({ kind: "WA_NEW_MSG", payload: data.data });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!isExtensionAlive()) return false;
  if (!msg || typeof msg !== "object") return false;

  if (msg.kind === "PING") {
    try { sendResponse({ ok: true, hasHealth: !!latestHealth }); } catch {}
    return false;
  }

  if (msg.kind === "GET_HEALTH") {
    try { sendResponse({ ok: true, health: latestHealth }); } catch {}
    return false;
  }

  if (msg.kind === "WA_REQ") {
    const reqId = `bg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const onMsg = (event) => {
      if (event.source !== window) return;
      const d = event.data;
      if (!d || d.source !== SOURCE) return;
      if (d.reqId !== reqId) return;
      if (d.type === "WA_RES") {
        cleanup();
        try { sendResponse({ ok: true, data: d.data }); } catch {}
      } else if (d.type === "WA_ERR") {
        cleanup();
        try { sendResponse({ ok: false, error: d.error }); } catch {}
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      try { sendResponse({ ok: false, error: "content-script-timeout" }); } catch {}
    }, 15000);
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
    }
    window.addEventListener("message", onMsg);
    window.postMessage(
      { source: SOURCE, type: "WA_REQ", reqId, op: msg.op, payload: msg.payload },
      window.location.origin,
    );
    return true;
  }

  return false;
});
