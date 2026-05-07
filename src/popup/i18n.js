// Lightweight i18n helper for the popup UI.
//
// Modes:
//   - "auto"  → use chrome.i18n.getMessage which resolves via the browser locale
//               and the manifest's default_locale fallback chain.
//   - "en" / "tr" → manual override. Loads the chosen messages.json bundled at
//                   build time (Vite JSON imports) and serves t() from that map,
//                   ignoring chrome.i18n. We do NOT publish _locales via
//                   web_accessible_resources (Chrome treats that path
//                   specially), so bundling is the cleanest way to override.
//
// Public API:
//   - initI18n() — read the saved override, hydrate the override map, then run
//                  applyDomTranslations() so all [data-i18n*] elements update.
//   - t(key, substitutions?) — get a localized string with optional $1$/$2$
//                              placeholder substitution.
//   - setLocale(locale)  — persist & reload (UI re-render is via location.reload).
//   - getCurrentLocale() — returns the persisted choice ("auto"|"en"|"tr").
//
// Persistence: chrome.storage.local key `wa_ui_locale`.

import enMessages from "../../_locales/en/messages.json";
import trMessages from "../../_locales/tr/messages.json";

const STORAGE_KEY = "wa_ui_locale";
const SUPPORTED = new Set(["auto", "en", "tr"]);

const MESSAGES_BY_LOCALE = {
  en: enMessages,
  tr: trMessages,
};

let currentLocale = "auto";
let activeMap = null; // null → defer to chrome.i18n; else use this map

function readSubstitutions(subs) {
  if (subs == null) return [];
  if (Array.isArray(subs)) return subs.map((v) => String(v));
  return [String(subs)];
}

// chrome.i18n's $1/$2 substitution syntax happens to be the same shape we use
// in messages.json, so we mirror its expansion logic for the override path.
function expandPlaceholders(template, subs) {
  if (!template) return "";
  if (!subs || subs.length === 0) return template;
  return template.replace(/\$(\d+)\$/g, (m, idx) => {
    const i = parseInt(idx, 10) - 1;
    if (i < 0 || i >= subs.length) return m;
    return subs[i];
  });
}

export function t(key, substitutions) {
  const subs = readSubstitutions(substitutions);
  // Override path
  if (activeMap) {
    const entry = activeMap[key];
    if (entry && typeof entry.message === "string") {
      return expandPlaceholders(entry.message, subs);
    }
    // Fallback to EN map if override doesn't have the key
    const fallback = MESSAGES_BY_LOCALE.en[key];
    if (fallback && typeof fallback.message === "string") {
      return expandPlaceholders(fallback.message, subs);
    }
    // Last resort: chrome.i18n (browser-locale)
  }
  // chrome.i18n auto mode (or final fallback)
  try {
    const msg = chrome.i18n.getMessage(key, subs.length ? subs : undefined);
    if (msg) return msg;
  } catch (_) {
    // chrome.i18n may not be available in some test contexts
  }
  // Hard fallback: lookup in EN bundle directly
  const en = MESSAGES_BY_LOCALE.en[key];
  if (en && typeof en.message === "string") {
    return expandPlaceholders(en.message, subs);
  }
  return key; // ultimate fallback: return the key as-is
}

export function getCurrentLocale() {
  return currentLocale;
}

export async function initI18n() {
  // Read the persisted override, default to "auto"
  let stored = "auto";
  try {
    const obj = await chrome.storage.local.get(STORAGE_KEY);
    if (obj && SUPPORTED.has(obj[STORAGE_KEY])) {
      stored = obj[STORAGE_KEY];
    }
  } catch (_) {
    // chrome.storage may not be available; stay with default
  }
  currentLocale = stored;
  activeMap = (stored === "auto") ? null : (MESSAGES_BY_LOCALE[stored] || null);
  applyDomTranslations(document);
  // Reflect the chosen locale on <html lang>
  const lang = stored === "auto"
    ? (chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage().split("-")[0] : "en")
    : stored;
  if (lang && document.documentElement) {
    document.documentElement.lang = (lang === "tr") ? "tr" : "en";
  }
}

export async function setLocale(locale) {
  if (!SUPPORTED.has(locale)) return;
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: locale });
  } catch (_) {}
  // Simplest correct UX: reload the popup so every dynamic string re-renders
  // from scratch with the new locale. The popup is small and reload is cheap.
  location.reload();
}

// Walk the DOM, looking for our i18n attributes, and apply translations.
export function applyDomTranslations(root) {
  if (!root || !root.querySelectorAll) return;
  const apply = (attrName, setter) => {
    root.querySelectorAll(`[${attrName}]`).forEach((el) => {
      const key = el.getAttribute(attrName);
      if (!key) return;
      const value = t(key);
      setter(el, value);
    });
  };
  apply("data-i18n", (el, v) => { el.textContent = v; });
  apply("data-i18n-html", (el, v) => { el.innerHTML = v; });
  apply("data-i18n-placeholder", (el, v) => { el.placeholder = v; });
  apply("data-i18n-title", (el, v) => { el.title = v; });
  apply("data-i18n-aria-label", (el, v) => { el.setAttribute("aria-label", v); });
  apply("data-i18n-value", (el, v) => { el.value = v; });
  // <optgroup label="..."> needs special handling since `label` isn't an
  // accessibility attribute — we use a dedicated attribute name.
  apply("data-i18n-label-key", (el, v) => { el.label = v; });
}
