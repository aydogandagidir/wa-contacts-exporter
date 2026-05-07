// Gumroad License API client.
// Docs: https://help.gumroad.com/article/76-license-keys
//
// Single endpoint we use:
//   POST https://api.gumroad.com/v2/licenses/verify
//   Body (form-encoded): product_id, license_key, increment_uses_count
//   Response: { success, uses, purchase: { email, sale_timestamp, refunded, ... } }
//
// We treat a license as VALID when:
//   - HTTP 200
//   - success === true
//   - purchase.refunded === false
//   - purchase.chargebacked is not true
//   - purchase.disputed is not true (or dispute_won === true)

const VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

export class GumroadApiError extends Error {
  constructor(message, { status, body, kind } = {}) {
    super(message);
    this.name = "GumroadApiError";
    this.status = status || null;
    this.body = body || null;
    this.kind = kind || "unknown"; // "network" | "invalid" | "refunded" | "server" | "unknown"
  }
}

export async function verifyLicense({ productId, licenseKey, incrementUsesCount = false }) {
  if (!productId) throw new GumroadApiError("product_id eksik", { kind: "unknown" });
  if (!licenseKey) throw new GumroadApiError("license_key eksik", { kind: "invalid" });

  const form = new URLSearchParams();
  form.set("product_id", productId);
  form.set("license_key", licenseKey.trim());
  form.set("increment_uses_count", incrementUsesCount ? "true" : "false");

  let res;
  try {
    res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch (err) {
    throw new GumroadApiError(`Ağ hatası: ${err.message || err}`, { kind: "network" });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new GumroadApiError(`Geçersiz yanıt (${res.status})`, { status: res.status, kind: "server" });
  }

  if (res.status === 404 || (data && data.success === false)) {
    const msg = (data && data.message) || "Lisans anahtarı bulunamadı.";
    throw new GumroadApiError(msg, { status: res.status, body: data, kind: "invalid" });
  }
  if (!res.ok) {
    throw new GumroadApiError(`Sunucu hatası (${res.status})`, { status: res.status, body: data, kind: "server" });
  }

  const purchase = data.purchase || {};
  if (purchase.refunded === true) {
    throw new GumroadApiError("Bu satış iade edilmiş — lisans geçersiz.", { body: data, kind: "refunded" });
  }
  if (purchase.chargebacked === true) {
    throw new GumroadApiError("Ödeme iptal edildi — lisans geçersiz.", { body: data, kind: "refunded" });
  }
  if (purchase.disputed === true && purchase.dispute_won !== true) {
    throw new GumroadApiError("Ödeme itiraz altında — lisans geçici olarak askıda.", { body: data, kind: "refunded" });
  }

  return {
    success: true,
    uses: typeof data.uses === "number" ? data.uses : null,
    email: purchase.email || null,
    saleTimestamp: purchase.sale_timestamp || null,
    productName: purchase.product_name || null,
    purchaseId: purchase.id || purchase.sale_id || null,
    raw: data,
  };
}
