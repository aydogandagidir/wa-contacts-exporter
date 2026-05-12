# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.
Format [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standardına dayanır.

## [1.0.2] — 2026-05-12

Removed unused `activeTab` permission to address Chrome Web Store rejection (Violation: "Use of Permissions — requesting but not using activeTab"). No functional change for users; the extension already accesses `web.whatsapp.com` exclusively via `host_permissions`, which is the correct scope.

### 🗑️ Kaldırıldı

- **`activeTab` permission'ı manifest'ten silindi** — Eklenti `chrome.tabs.query` ve `chrome.tabs.sendMessage` çağrılarını sadece `https://web.whatsapp.com/*` sekmesine yapıyor. Bu erişim zaten `host_permissions` üzerinden veriliyor; `activeTab` redundant'tı. CWS reviewer'ı tespit etti, biz teyit edip kaldırdık.
- Permission justification doc'larından activeTab bölümleri çıkarıldı; özet body'leri buna göre kısaltıldı.

### 🔄 Değişti

- Brand badge `v1.0.1 · Bluedev` → `v1.0.2 · Bluedev` (her iki locale).

### Sebep

CWS rejection (`Violation reference: Purple Potassium`) — reviewer manifest'te istenen ama runtime'da kullanılmayan permission'ı tespit etti. Düzeltme reviewer'ın önerdiği yöntemle uyumlu: "Remove the unused permission(s) listed above from your manifest file." Hiçbir kullanıcı akışı bu değişiklikten etkilenmez; host_permissions zaten gerekli erişimi sağlıyor.

---

## [1.0.1] — 2026-05-08

Restored periodic license re-verification with offline grace, closing the refund-abuse window that was open in v1.0.0.

### 🔄 Değişti

- **Lisans modeli yeniden periyodik** — Aktivasyon tek seferlik kalır, ancak `chrome.alarms` ile haftada bir Gumroad'a non-incrementing re-verify atılır. Refund / chargeback / dispute durumlarında Gumroad anlık döner ve eklenti license'i siler — Pro maksimum 7 gün gecikmeyle Free'ye iner. Bu, v1.0.0'da kapatılmamış olan "aktive et, kullan, refund al, ücretsiz Pro" döngüsünü kapatır.
- **30 günlük offline grace** geri eklendi — Çevrimdışı / seyahat / wifi değişimi senaryolarında lock-out riski yok. Son başarılı re-verify'dan itibaren 30 gün boyunca Pro çalışır.

### ✨ Eklendi

- Pro 🔑 sekmesinde **"Şimdi yeniden doğrula"** butonu — kullanıcı isterse manuel re-verify tetikleyebilir.
- "Pro · grace" durumu UI'da görünür hâle geldi (offline grace pencere son tarihi gösterilir).

### Sebep

v1.0.0'da kullanıcı kararıyla periodik re-verify kaldırılmıştı. Ancak bu, refund abuse'a kapı bıraktığı için 24 saat içinde geri alındı. v1.0.1, v1.0.0'ın doğrulanmış UX iyileştirmelerini (i18n, locale-screenshots, doğru Gumroad değerleri) korur, sadece lisans yaşam döngüsünü revize eder.

---

## [1.0.0] — 2026-05-08

İlk production sürümü. Tek-aktivasyon lisans modeli, EN/TR i18n ve canlı Gumroad listing.

### ✨ Eklendi

- **Bilingual EN (default) + TR UI** — `chrome.i18n` altyapısı + popup header'da Auto / English / Türkçe seçici. 379 message key, EN ↔ TR parity. Browser locale `tr` ise otomatik Türkçeye düşer; başka her dilde varsayılan İngilizce. Manuel override `chrome.storage.local` üzerinde tutulur.
- **Manifest çift dilli** — `__MSG_extName__` / `__MSG_extDescription__` token'larıyla, `default_locale: "en"`.
- **Locale-aware tarih/saat** — `localeTag()` helper'ı `tr-TR` / `en-US` / auto formatlarını uygular.
- **Canlı Gumroad listing** — `product_id: axfxg`, `https://bluedev.gumroad.com/l/wa-contacts-exporter`. Aktivasyon + lisans verifikasyonu uçtan uca çalışır.

### 🔄 Değişti

- **Lisans modeli tek-aktivasyon oldu** — Aktivasyonda Gumroad'a tek istek atılır; başarılıysa eklenti bir daha hiç Gumroad'a bağlanmaz. Haftalık `chrome.alarms` re-verify ve 30 günlük offline grace pencere kaldırıldı. Alıcı seyahat / çevrimdışı / wifi değişikliği senaryolarında lock-out yaşamaz.
- **`isPro()` sadeleşti** — Yalnızca local key varlığını kontrol eder. `GRACE_PERIOD_MS` ve `graceUntil` mantığı kaldırıldı.

### 🗑️ Kaldırıldı

- Pro sekmesindeki **"Şimdi yeniden doğrula"** butonu (artık gerekli değil — model tek-aktivasyon).
- Background service worker'daki periyodik `chrome.alarms` lisans yenileme alarmı (legacy alarm tek-seferlik temizleme bırakıldı).

### 🐛 Düzeltildi

- README'deki "Sadece Türkçe arayüz — İngilizce locale gelecek sürümlerde" sınırlaması artık geçersiz; not kaldırıldı.

---

## [0.1.0] — 2026-05-06

İlk beta sürümü. Çekirdek export + AI asistan + otomatik cevap modülleri tamamlandı.

### ✨ Eklendi

#### Veri çıkarımı (export)
- **Sohbetler**: tüm 1-on-1 ve grup sohbetleri, son mesaj zaman damgalarıyla
- **Mesajlar**: WA Web hafızasındaki mesajları sohbet bazında çıkarma; "Eski mesaj yükleme turu" ile geriye doğru gidebilme
- **Gruplar**: her grup için katılımcı listesi + admin/super-admin işaretleri
  (modern WA Web shape değişikliklerine dayanıklı çoklu yükleme stratejisi)
- **Etiketler**: WhatsApp Business etiketleri + sohbet eşleşmeleri
  (sistem filtrelerini ayrı işaretler — `Unread`, `Favorites`, `Groups` gibi)
- **Tüm Kişiler**: kayıtlı + (opt-in ile) kayıtsız kişiler

#### Format desteği
- **CSV**: PapaParse + UTF-8 BOM (Excel TR Türkçe karakter uyumlu)
- **XLSX**: SheetJS lazy-loaded (~430 KB sadece ihtiyaç duyulduğunda); 5 sayfa
  (Sohbetler / Mesajlar / Gruplar / Etiketler / Kişiler), bold header + üst satır frozen
- **VCard 3.0**: hand-rolled (sıfır dependency); chats / contacts / group-members 3 varyant

#### AI Asistan (yeni)
- **6 sağlayıcı** desteği:
  - Yerel: Ollama, OpenAI uyumlu (LM Studio / llama.cpp)
  - Bulut: Anthropic Claude, OpenAI ChatGPT, Google Gemini, Groq
- **Sohbet özetleme**: TR formatlı çıktı (özet + ana konular + eylem maddeleri + ton)
- **Cevap önerisi**: hedef mesaja kilitli iteratif tek-öneri (Yenile/Düzelt/Geri bildirim)
- **Takip mesajı**: kullanıcının yanıtsız kalan mesajına göre otomatik hatırlatma
- **Önceliklendirme**: hibrit (kural-tabanlı skor + AI gerekçe) + doğrulama UI
- **Üslup taklit**: kullanıcının kendi geçmiş mesajlarını üslup örneği olarak kullanma
- **SENDER → RECEIVER prompt çerçevesi**: rol karışıklığını yapısal engelleme
- **Per-chat talimat**: her sohbet için özel AI yönlendirmesi (kalıcı)
- **Anti-hallucination**: sohbette geçmeyen konu/aktivite/kişi uydurma yasağı

#### Otomatik cevap (oto-cevap)
- **Taslak modu** (default): AI cevap üretir → kullanıcı onaylayıp gönderir
- **Otomatik mod**: opt-in per-chat, anında gönderim
- **Güvenlik katmanları**: master switch + per-chat opt-in + saat/gün limiti +
  sessiz saatler + kendi mesajlarına cevap verme + status mesajı filtreleme
- **Audit log**: son 100 olay (gönderildi/iptal/sessiz-saat/limit-aşıldı/hata)

#### KVKK & gizlilik
- First-run **rıza ekranı** (mecburi onay olmadan extraction yok)
- Türkçe **Aydınlatma Metni** sayfası (privacy.html, 7 madde)
- "Kayıtsız kişileri dahil et" toggle'ı **default kapalı** (KVKK uyumlu varsayılan)
- Tüm veri yerel: hiçbir şey Bluedev sunucusuna gitmez
- API anahtarları yalnızca `chrome.storage.local`'da

#### Mimari
- **Manifest V3** uyumlu
- **Multi-strategy webpack/MetroBundler hook** (modern WA Web shape değişikliklerine dayanıklı)
- **document_start MAIN-world inject** ile `Object.defineProperty` üzerinden `window.__d` yakalama
- **`window.require` tabanlı modül çözümü** + 6 modül için functional fallback

#### UI/UX
- 7 sekmeli popup: Sohbetler / Mesajlar / AI ✨ / Oto-Cevap 🤖 / Gruplar / Etiketler / Tüm Kişiler
- Modern ikon-tabanlı kopyala butonu (Claude tarzı)
- Sağlayıcıya duyarlı bilgi banner'ı (Ollama/Anthropic/OpenAI/Gemini/Groq metinleri farklı)
- Bağlam yetersizliği uyarıları (⚠️ az veri, üslup yetersiz)
- "Hata raporu kopyala" — JSON formatlı debug log

### 📦 Build
- Vite + `@crxjs/vite-plugin`
- Lazy-loaded XLSX chunk (popup ana JS gzipped ~33 KB)
- Otomatik PNG icon üretimi (sharp + SVG kaynak)
- `npm run package` ile Chrome Web Store-ready ZIP

---

[1.0.2]: https://github.com/aydogandagidir/wa-contacts-exporter/releases/tag/v1.0.2
[1.0.1]: https://github.com/aydogandagidir/wa-contacts-exporter/releases/tag/v1.0.1
[1.0.0]: https://github.com/aydogandagidir/wa-contacts-exporter/releases/tag/v1.0.0
[0.1.0]: https://github.com/aydogandagidir/wa-contacts-exporter/releases/tag/v0.1.0
