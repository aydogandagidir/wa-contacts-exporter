// Typed request/response helpers used across MAIN <-> ISOLATED <-> popup boundaries.
// Every envelope carries a fixed `source` discriminator so we don't accidentally
// react to unrelated postMessage traffic from web.whatsapp.com itself.

export const SOURCE = "wa-exporter";

export const MSG = {
  // popup -> content script (chrome.runtime)
  PING: "PING",
  GET_HEALTH: "GET_HEALTH",
  // content script -> background (chrome.runtime)
  INJECT_READY: "INJECT_READY",
  // MAIN world -> ISOLATED (window.postMessage)
  WA_HEALTH: "WA_HEALTH",
  WA_REQ: "WA_REQ",
  WA_RES: "WA_RES",
  WA_ERR: "WA_ERR",
};

export function makeReqId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Request/response over window.postMessage between the page MAIN world and
// the content script ISOLATED world. Filters by SOURCE + reqId.
export function pageRequest(op, payload = {}, { timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const reqId = makeReqId();

    const onMsg = (event) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== SOURCE) return;
      if (data.reqId !== reqId) return;
      if (data.type === MSG.WA_RES) {
        cleanup();
        resolve(data.data);
      } else if (data.type === MSG.WA_ERR) {
        cleanup();
        reject(new Error(data.error || "WA_ERR"));
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`pageRequest timeout: ${op}`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
    }

    window.addEventListener("message", onMsg);
    window.postMessage(
      { source: SOURCE, type: MSG.WA_REQ, reqId, op, payload },
      window.location.origin,
    );
  });
}
