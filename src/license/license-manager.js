// License manager — high-level Pro entitlement layer over the Gumroad API.
//
// Storage shape (chrome.storage.local key: "wa_pro_license"):
//   {
//     key:            string,           // user-entered Gumroad license key
//     email:          string,           // email associated with the purchase
//     productId:      string,           // Gumroad product_id used at activation
//     activatedAt:    number,           // ms epoch
//     lastVerifiedAt: number,           // ms epoch — last successful online verify
//     uses:           number | null,    // Gumroad uses counter snapshot
//     graceUntil:     number,           // ms epoch — Pro stays active offline until this
//     productName:    string | null,
//   }
//
// Verification policy — periodic re-verify + offline grace:
//   - On activate(): online verify with increment_uses_count=true (counts the device).
//   - Periodic re-verify (chrome.alarms in background.js): every 7 days, increment=false.
//   - If a re-verify fails with kind=invalid|refunded → deactivate immediately.
//     This closes the refund-abuse loop (a buyer cannot activate, refund, then
//     keep Pro forever — we catch refunded/chargebacked/disputed within 7 days).
//   - If it fails with kind=network|server → keep Pro until graceUntil expires
//     (30 days from lastVerifiedAt). After grace expiry, downgrade to free.
//   - This protects honest buyers from network outages / travel (30-day grace)
//     while still closing the refund-abuse loophole.
//
// Security note: This is client-side. A determined attacker can patch the bundle
// to always return Pro. Acceptable trade-off — honest-user deterrent only.

import { verifyLicense, GumroadApiError } from "./gumroad-api.js";

const STORAGE_KEY = "wa_pro_license";
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

// True if a Pro license is currently honored (verified recently OR within grace).
export async function isPro() {
  const lic = await getStoredLicense();
  if (!lic || !lic.key) return false;
  const now = Date.now();
  if (lic.lastVerifiedAt && (now - lic.lastVerifiedAt) < GRACE_PERIOD_MS) return true;
  if (lic.graceUntil && now < lic.graceUntil) return true;
  return false;
}

// Detailed status for the UI.
export async function getStatus() {
  const lic = await getStoredLicense();
  if (!lic || !lic.key) {
    return { tier: "free", reason: "no-license" };
  }
  const now = Date.now();
  const sinceVerify = lic.lastVerifiedAt ? now - lic.lastVerifiedAt : Infinity;
  if (sinceVerify < GRACE_PERIOD_MS) {
    return {
      tier: "pro",
      reason: "verified",
      email: lic.email,
      productName: lic.productName,
      activatedAt: lic.activatedAt,
      lastVerifiedAt: lic.lastVerifiedAt,
      key: lic.key,
    };
  }
  if (lic.graceUntil && now < lic.graceUntil) {
    return {
      tier: "pro",
      reason: "grace",
      email: lic.email,
      productName: lic.productName,
      activatedAt: lic.activatedAt,
      lastVerifiedAt: lic.lastVerifiedAt,
      graceUntil: lic.graceUntil,
      key: lic.key,
    };
  }
  return {
    tier: "free",
    reason: "expired-grace",
    email: lic.email,
    activatedAt: lic.activatedAt,
    lastVerifiedAt: lic.lastVerifiedAt,
    key: lic.key,
  };
}

// First-time activation — counts a device against the Gumroad uses counter.
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
    graceUntil: now + GRACE_PERIOD_MS,
  };
  await setStoredLicense(stored);
  return stored;
}

// Background re-check — does NOT count a device. Updates lastVerifiedAt.
// Called by chrome.alarms every 7 days, and by the manual "Re-check now"
// button in the Pro tab.
//
// Outcomes:
//   - { ok: true, license }                — verified; grace extended.
//   - { ok: false, kind: "invalid" }       — Gumroad says the key is invalid.
//   - { ok: false, kind: "refunded" }      — refunded/chargebacked/disputed.
//                                            License is cleared from storage.
//   - { ok: false, kind: "network" }       — transient; license untouched, grace
//   - { ok: false, kind: "server" }          window keeps Pro alive offline.
//   - { ok: false, kind: "no-license" }    — nothing to verify.
export async function reverify() {
  const lic = await getStoredLicense();
  if (!lic || !lic.key) return { ok: false, kind: "no-license" };
  try {
    const result = await verifyLicense({
      productId: lic.productId,
      licenseKey: lic.key,
      incrementUsesCount: false,
    });
    const now = Date.now();
    const next = {
      ...lic,
      lastVerifiedAt: now,
      uses: result.uses != null ? result.uses : lic.uses,
      graceUntil: now + GRACE_PERIOD_MS,
      productName: result.productName || lic.productName,
    };
    await setStoredLicense(next);
    return { ok: true, license: next };
  } catch (err) {
    if (err instanceof GumroadApiError && (err.kind === "invalid" || err.kind === "refunded")) {
      await setStoredLicense(null);
      return { ok: false, kind: err.kind, message: err.message };
    }
    return { ok: false, kind: err && err.kind ? err.kind : "network", message: err.message };
  }
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
