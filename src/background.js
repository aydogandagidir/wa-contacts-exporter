// Background service worker.
// Two jobs:
//   1. Relay WA_HEALTH / WA_NEW_MSG broadcasts from content script to popup.
//   2. Handle download requests from popup (chrome.downloads is not callable
//      from content scripts directly, and blob URLs created in popup context
//      are not always retained — using data: URLs in messages is simplest).
//
// One-time license model: no background license checks, no chrome.alarms.
// Activation does the verify; after that the extension never contacts
// Gumroad again. We do clear the legacy "wa-pro-license-reverify" alarm on
// install / startup, in case any pre-launch dev install registered it.

console.log("[wa-exporter] background service worker starting");

const LEGACY_LICENSE_ALARM = "wa-pro-license-reverify";

async function clearLegacyLicenseAlarm() {
  try {
    if (chrome.alarms && typeof chrome.alarms.clear === "function") {
      await chrome.alarms.clear(LEGACY_LICENSE_ALARM);
    }
  } catch (err) {
    console.warn("[wa-exporter] legacy license alarm cleanup failed:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => { clearLegacyLicenseAlarm(); });
chrome.runtime.onStartup.addListener(() => { clearLegacyLicenseAlarm(); });

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
