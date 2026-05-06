// Background service worker.
// Two jobs:
//   1. Relay WA_HEALTH broadcasts from content script to any open popup.
//   2. Handle download requests from popup (chrome.downloads is not callable
//      from content scripts directly, and blob URLs created in popup context
//      are not always retained — using data: URLs in messages is simplest).

console.log("[wa-exporter] background service worker starting");

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;

  if (msg.kind === "WA_HEALTH") {
    chrome.runtime.sendMessage(msg).catch(() => {});
    return false;
  }

  if (msg.kind === "WA_NEW_MSG") {
    chrome.runtime.sendMessage(msg).catch(() => {});
    return false;
  }

  if (msg.kind === "DOWNLOAD") {
    const { filename, dataUrl } = msg;
    chrome.downloads.download({ url: dataUrl, filename, saveAs: true })
      .then((id) => sendResponse({ ok: true, id }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
    return true;
  }

  return false;
});
