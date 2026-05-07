// License manager — high-level Pro entitlement layer over the Gumroad API.
//
// Storage shape (chrome.storage.local key: "wa_pro_license"):
//   {
//     key:            string,           // user-entered Gumroad license key
//     email:          string,           // email associated with the purchase
//     productId:      string,           // Gumroad product_id used at activation
//     activatedAt:    number,           // ms epoch
//     lastVerifiedAt: number,           // ms epoch — kept for completeness
//     uses:           number | null,    // Gumroad uses counter snapshot
//     productName:    string | null,
//   }
//
// Verification policy — one-time activation:
//   - On activate(): online verify with increment_uses_count=true. This counts
//     the device against the Gumroad uses counter, confirms the key is real,
//     and rejects refunded / charged-back / disputed sales.
//   - After that, NO further online checks. The extension never re-contacts
//     Gumroad for this license. This matches the lifetime-purchase promise:
//     pay once, install never goes offline-locked or breaks if the buyer
//     travels, switches networks, or our servers go away.
//   - Refund handling is operational (manual support: destek@bluedev.dev).
//     Acceptable trade-off for an early-launch, low-volume product.
//
// Security note: This is client-side. A determined attacker can patch the
// bundle to always return Pro. Acceptable trade-off — honest-user deterrent.

import { verifyLicense } from "./gumroad-api.js";

const STORAGE_KEY = "wa_pro_license";

// Real Gumroad listing values (set 2026-05-07 at launch).
const DEFAULT_PRODUCT_ID = "axfxg";
const PRODUCT_ID_OVERRIDE_KEY = "wa_pro_product_id";

const PURCHASE_URL = "https://bluedev.gumroad.com/l/wa-contacts-exporter";

export async function getProductId() {
  try {
    const data = await chrome.storage.local.get(PRODUCT_ID_OVERRIDE_KEY);
    return data[PRODUCT_ID_OVERRIDE_KEY] || DEFAULT_PRODUCT_ID;
  } catch {
    return DEFAULT_PRODUCT_ID;
  }
}

export function getPurchaseUrl() { return PURCHASE_URL; }

export async function getStoredLicense() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || null;
  } catch {
    return null;
  }
}

async function setStoredLicense(value) {
  if (value == null) {
    await chrome.storage.local.remove(STORAGE_KEY);
  } else {
    await chrome.storage.local.set({ [STORAGE_KEY]: value });
  }
}

// True if Pro was successfully activated on this device. One-time model:
// activation succeeds → Pro stays on until the user explicitly deactivates.
export async function isPro() {
  const lic = await getStoredLicense();
  return !!(lic && lic.key);
}

// Detailed status for the UI.
export async function getStatus() {
  const lic = await getStoredLicense();
  if (!lic || !lic.key) {
    return { tier: "free", reason: "no-license" };
  }
  return {
    tier: "pro",
    reason: "activated",
    email: lic.email,
    productName: lic.productName,
    activatedAt: lic.activatedAt,
    lastVerifiedAt: lic.lastVerifiedAt,
    key: lic.key,
  };
}

// First-time activation — counts a device against the Gumroad uses counter
// and confirms the key is real + not refunded. After this succeeds, the
// extension never contacts Gumroad again for this license.
export async function activate({ key, email }) {
  const productId = await getProductId();
  if (!productId) {
    throw new Error("Ürün kimliği tanımlı değil. Lütfen daha sonra tekrar deneyin.");
  }
  const result = await verifyLicense({ productId, licenseKey: key, incrementUsesCount: true });
  const now = Date.now();
  const stored = {
    key: key.trim(),
    email: email ? email.trim() : (result.email || ""),
    productId,
    productName: result.productName,
    purchaseId: result.purchaseId,
    activatedAt: now,
    lastVerifiedAt: now,
    uses: result.uses,
  };
  await setStoredLicense(stored);
  return stored;
}

export async function deactivate() {
  await setStoredLicense(null);
}

// Free-tier message-extract limit. Pro = use the user's chosen limit.
export const FREE_MSG_LIMIT_PER_CHAT = 500;

// Helper: clamp a user-selected per-chat message limit to the free ceiling
// when the user is not Pro. Returns the effective limit + a flag the UI
// uses to nudge the user toward Pro.
export async function effectiveMessageLimit(requested) {
  const pro = await isPro();
  const req = Math.max(1, parseInt(requested, 10) || FREE_MSG_LIMIT_PER_CHAT);
  if (pro) return { limit: req, capped: false };
  if (req <= FREE_MSG_LIMIT_PER_CHAT) return { limit: req, capped: false };
  return { limit: FREE_MSG_LIMIT_PER_CHAT, capped: true };
}
