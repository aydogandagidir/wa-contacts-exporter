# Chrome Web Store Submission Checklist

Bu doküman CWS Developer Console'da yayın taslağı doldururken kullanacağın **adım adım** rehberdir. Tüm metinler ve dosyalar hazır — sırasıyla doğru alana yapıştır.

> **🟢 Live URL'ler doğrulandı (2026-05-07):**
> - **Ürün sayfası**: https://bluedev.dev/products/wa-contacts-exporter
> - **Privacy URL (CWS form için)**: https://bluedev.dev/products/wa-contacts-exporter/privacy
> - **Eski URL** (geriye dönük uyumlu): https://bluedev.dev/wa-contacts-exporter → 301 → product page
>
> Privacy URL'i CWS Developer Console'da Step 5'teki "Privacy practices URL" alanına kopyala-yapıştır.

---

## 0. Hesap kurulumu (1-2 gün)

- [ ] [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) → Bluedev kurumsal Google hesabıyla giriş
- [ ] **$5 tek seferlik developer fee** öde (Stripe)
- [ ] Telefon doğrulama (1-2 gün sürebilir, parallel başlat)
- [ ] Hesap onaylanınca "**Developer Dashboard**" görünür

---

## 1. Yeni öğe oluştur

- [ ] "**+ New item**" tıkla
- [ ] Dosya seç: `wa-contacts-exporter-1.0.0.zip` (proje root'unda, 242 KB)
- [ ] Upload tamamlanınca yeni listing taslağı açılır

> Zip dosyası `npm run package` ile yeniden üretilir. Manifest validation hatası olursa önce yerel olarak `npm run build` ile doğrula.

---

## 2. Store listing — Türkçe

CWS form'da **Store listing → Add another language → Türkçe** seç.

Aşağıdaki dosyadan kopyala-yapıştır:
**[docs/store-listing-tr.md](store-listing-tr.md)**

| Form alanı | Kaynak |
|---|---|
| Title (45 char limit) | Dosyanın "Title" bölümü |
| Short description (132 char) | "Short description" bölümü |
| Detailed description (16k char) | "Full description" bölümünün code block'u |
| Category | **Productivity** |
| Language | **Türkçe** |

## 3. Store listing — English

Aynı şekilde **+ Add another language → English** seç, sonra:
**[docs/store-listing-en.md](store-listing-en.md)** dosyasından kopyala.

---

## 4. Görseller

### Screenshots (en az 1, önerilen 5)

Locale başına **5 PNG** (1280×800). EN listing → `docs/screenshots/en/`,
TR listing → `docs/screenshots/tr/`:

EN:
- [ ] `en/01_chats_tab.png` — Chats tab + export buttons
- [ ] `en/02_messages_tab.png` — Messages tab + dropdown
- [ ] `en/03_ai_provider.png` — AI provider panel
- [ ] `en/04_ai_suggestion.png` — Iterative suggestion card
- [ ] `en/05_auto_reply.png` — Auto-reply module

TR:
- [ ] `tr/01_sohbetler_tab.png` — Sohbetler sekmesi + export butonları
- [ ] `tr/02_mesajlar_tab.png` — Mesajlar sekmesi + dropdown
- [ ] `tr/03_ai_provider.png` — AI sağlayıcı paneli
- [ ] `tr/04_ai_suggestion.png` — İteratif öneri kartı
- [ ] `tr/05_oto_cevap.png` — Otomatik cevap modülü

Üretmek için: `node scripts/take-screenshots.mjs`
(detay: `docs/screenshots/README.md`)

### Promotional images

`docs/promotional/` altında 3 tile:

- [ ] **Small tile (zorunlu)**: `small-tile-440x280.png` (28 KB)
- [ ] **Large tile (önerilen)**: `large-tile-920x680.png` (91 KB)
- [ ] **Marquee (opsiyonel)**: `marquee-1400x560.png` (92 KB) — featured listing için

### Demo video (opsiyonel ama önerilen)

YouTube'a **Unlisted** olarak yükle:
- Dosya: `docs/demo/demo-90s.mp4` (5.8 MB, 92 sn, 1080p, sessiz)
- Title: `WA Contacts Exporter — WhatsApp Web Export + AI · Bluedev`
- Description: kısa özet + `bluedev.dev/products/wa-contacts-exporter` link
- Thumbnail: `docs/demo/poster.jpg` (otomatik embed edilmiş)

YouTube URL'i CWS form'undaki **YouTube video** alanına yapıştır.

---

## 5. Privacy practices

- [ ] **Privacy policy URL**: `https://YOUR-LANDING-DOMAIN/privacy.html`
  - Önce landing'i deploy et ([landing/README.md](../landing/README.md))
  - Sonra bu URL'i ekle

- [ ] **Single Purpose Declaration**:
  Kopyala: [docs/store-listing-tr.md](store-listing-tr.md) içindeki "Single Purpose Declaration" bölümü
  ya da daha kısa EN versiyon: [docs/store-listing-en.md](store-listing-en.md)

---

## 6. Permission justifications

Her permission için "Why is this needed?" alanı CWS form'da çıkar.
Tam metinler: **[docs/permission-justifications.md](permission-justifications.md)**

| Permission | Dosyadaki bölüm |
|---|---|
| `storage` | `### storage` (TR + EN) |
| `downloads` | `### downloads` |
| `activeTab` | `### activeTab` |
| `host_permissions: web.whatsapp.com` | `### https://web.whatsapp.com/*` |
| `host_permissions: api.anthropic.com` | `### https://api.anthropic.com/*` |
| `host_permissions: api.openai.com` | `### https://api.openai.com/*` |
| `host_permissions: generativelanguage.googleapis.com` | `### https://generativelanguage.googleapis.com/*` |
| `host_permissions: api.groq.com` | `### https://api.groq.com/*` |
| `host_permissions: localhost` | `### http://localhost/*` |

> CWS reviewer her permission için **en az 1 cümlelik gerekçe** ister; daha fazlası daha hızlı onaya yardım eder. Dosyadaki tam paragrafları kullan.

---

## 7. Data usage disclosure

CWS form'unda checkbox'lar var. Aşağıdaki tabloyu işaretle (kaynak: [docs/permission-justifications.md](permission-justifications.md) "Data Usage Disclosure" bölümü):

- [ ] Personally identifiable information — **NO**
- [ ] Health information — **NO**
- [ ] Financial / payment information — **NO**
- [ ] Authentication information — **YES** (user-supplied AI provider API keys, locally stored)
- [ ] Personal communications — **YES** (WhatsApp messages — only when user extracts)
- [ ] Location — **NO**
- [ ] Web history — **NO**
- [ ] User activity — **NO**
- [ ] Website content — **YES** (WhatsApp Web page content — required for export)

### Certifications (3 checkbox işaretle)

- [x] I do not sell or transfer user data to third parties...
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 8. Distribution

- [ ] Visibility: **Public** (Beta'da Unlisted da seçilebilir)
- [ ] Geographic distribution: **All regions**
- [ ] Pricing: **Free**

---

## 9. Submit for review

Final kontrol:
- [ ] Tüm zorunlu alanlar dolu (kırmızı uyarı yok)
- [ ] Privacy URL alive ve doğru içerik
- [ ] Title ≤ 45 char, short ≤ 132 char
- [ ] 5 screenshot upload edildi
- [ ] Small tile zorunlu — yüklendi mi?
- [ ] Demo video YouTube'da Unlisted yayında

→ **"Submit for review"** tıkla.

---

## 10. Bekleme + olası senaryolar

- **3-7 iş günü** standart review süresi (ilk submission daha uzun)
- E-posta gelir: ya **Approved** ya da **Rejected** + sebep

### Reddedilirse

CWS reviewer'ın e-postasındaki gerekçeyi oku, çoğunlukla:
- Permission justification yetersiz → daha detaylı yaz
- "Single purpose" net değil → declaration güncelle
- Brand/trademark concern → "WA" yerine "Contacts Exporter for WhatsApp Web" gibi rephrase et

Sonra ilgili alanı düzelt → **Submit for review** tekrar.

### Onaylandıktan sonra

- Otomatik public oldu (eğer Public seçtiysen)
- Listing URL: `https://chromewebstore.google.com/detail/[your-id]`
- Bu URL'i landing page + sosyal medya postlarına ekle (`docs/social-posts.md`)

---

## Hızlı asset envanteri

```
PROJECT ROOT
├── wa-contacts-exporter-1.0.0.zip      (242 KB · upload → CWS)
├── docs/
│   ├── store-listing-tr.md             (TR locale metin paketi)
│   ├── store-listing-en.md             (EN locale metin paketi)
│   ├── permission-justifications.md    (her izin için gerekçe)
│   ├── screenshots/{en,tr}/0[1-5]_*.png (5 × 1280×800 per locale — CWS upload)
│   ├── promotional/
│   │   ├── small-tile-440x280.png      (zorunlu)
│   │   ├── large-tile-920x680.png      (önerilen)
│   │   └── marquee-1400x560.png        (opsiyonel)
│   └── demo/
│       ├── demo-90s.mp4                 (YouTube unlisted upload)
│       └── poster.jpg                   (yedek thumbnail)
└── landing/
    ├── index.html                       (deploy → privacy URL kaynağı)
    ├── privacy.html                     ('https://X/privacy.html' = CWS Privacy URL)
    └── README.md                        (deploy adımları)
```

Hepsi yerinde — review süresi 3-7 iş günü, beta yayını ~1.5 hafta.
