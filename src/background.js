// Background service worker.
// Three jobs:
//   1. Relay WA_HEALTH / WA_NEW_MSG broadcasts from content script to popup.
//   2. Handle download requests from popup (chrome.downloads is not callable
//      from content scripts directly, and blob URLs created in popup context
//      are not always retained — using data: URLs in messages is simplest).
//   3. Periodic Pro license re-verification via chrome.alarms (every 7 days).
//      Uses license-manager.reverify() which silently extends graceUntil on
//      success and downgrades on definitive failures (refunded/invalid).

import { reverify } from "./license/license-manager.js";

console.log("[wa-exporter] background service worker starting");

const LICENSE_ALARM = "wa-pro-license-reverify";
const REVERIFY_PERIOD_MIN = 7 * 24 * 60; // 7 days

async function ensureLicenseAlarm() {
  try {
    const existing = await chrome.alarms.get(LICENSE_ALARM);
    if (!existing) {
      await chrome.alarms.create(LICENSE_ALARM, {
        // Run once shortly after startup (1 hour) and then every 7 days.
        delayInMinutes: 60,
        periodInMinutes: REVERIFY_PERIOD_MIN,
      });
    }
  } catch (err) {
    console.warn("[wa-exporter] license alarm setup failed:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => { ensureLicenseAlarm(); });
chrome.runtime.onStartup.addListener(() => { ensureLicenseAlarm(); });
ensureLicenseAlarm();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== LICENSE_ALARM) return;
  try {
    const res = await reverify();
    console.log("[wa-exporter] license reverify:", res.ok ? "ok" : `failed (${res.kind})`);
  } catch (err) {
    console.warn("[wa-exporter] license reverify threw:", err);
  }
});

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
