# WA Contacts Exporter

WhatsApp Web sohbetlerini, gruplarını, etiketlerini ve kişilerini **CSV / XLSX / VCard** olarak yerel dosyalara çıkaran + AI ile özet/cevap önerisi/önceliklendirme üreten Chrome eklentisi (Manifest V3).

> Bluedev tarafından geliştirildi · v1.0.0 · 🌐 Türkçe + English (English version: [README.en.md](./README.en.md))

[![Lisans](https://img.shields.io/badge/lisans-Proprietary-red)](./LICENSE) [![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)](./manifest.json) [![KVKK](https://img.shields.io/badge/KVKK-uyumlu-green)](./PRIVACY.md)

---

## Özellikler

### 📤 Veri çıkarımı (export)

- 🟢 **Sohbet listesi** — tüm 1-on-1 ve grup sohbetleri, son mesaj zaman damgaları
- 💬 **Mesajlar** — sohbet bazında mesaj geçmişi (sohbet başına 100–5000 mesaj limit)
- 👥 **Grup üyeleri** — admin/super-admin işaretleriyle her grupta katılımcı listesi
- 🏷️ **Etiketler** — WhatsApp Business etiketleri (sistem filtreleri ayrı işaretli)
- 📒 **Tüm Kişiler** — kayıtlı + (opt-in ile) kayıtsız kişiler
- 📤 Üç format: **CSV** (Excel TR uyumlu UTF-8 BOM), **XLSX** (5 sayfa, lazy-loaded), **VCard 3.0**

### 🤖 AI Asistan

6 sağlayıcı destekli — yerel veya bulut, kendiniz seçin:

| Sağlayıcı | Tip | API anahtarı | Maliyet |
|---|---|:---:|---|
| **Ollama** (önerilen) | 🟢 Yerel | Gerekmez | 0 ₺ |
| **LM Studio / llama.cpp** | 🟢 Yerel | Gerekmez | 0 ₺ |
| **Anthropic Claude** | ☁️ Bulut | Gerekir | $0.001–$0.05 / istek |
| **OpenAI ChatGPT** | ☁️ Bulut | Gerekir | $0.0002–$0.005 / istek |
| **Google Gemini** | ☁️ Bulut | Gerekir | **Ücretsiz tier** (1500 istek/gün) |
| **Groq** | ☁️ Bulut | Gerekir | **Ücretsiz tier** + çok hızlı |

#### AI özellikleri
- **Sohbet özetle** — ana konular + eylem maddeleri + ton analizi
- **Cevap öner** — iteratif tek-öneri (Yenile / Düzelt / Geri bildirim)
- **Takip mesajı** — yanıtsız kalan mesajınız için otomatik hatırlatma
- **Önceliklendirme** — hibrit kural-tabanlı + AI gerekçeli (doğrulamalı UI)
- **Üslup taklit** — kullanıcının geçmiş mesajlarından kendi sesini öğrenir

### 🤖 Otomatik cevap (oto-cevap)

Yeni gelen mesajlara AI ile cevap. **Default = Taslak modu**: AI önerir, sen onaylayıp gönderirsin. Otomatik gönderim opt-in per-chat.

**Güvenlik katmanları:**
- Master switch (default kapalı)
- Saat/gün rate limit (varsayılan: 10/saat, 50/gün)
- Sessiz saatler (örn. 22:00–08:00)
- Per-chat opt-in
- Audit log

### 🔒 KVKK & gizlilik

- ✅ İlk açılışta KVKK rıza ekranı zorunlu
- ✅ "Kayıtsız kişileri dahil et" toggle default kapalı
- ✅ Tüm veri yerel — Bluedev'e hiçbir şey gitmez
- ✅ AI istekleri tarayıcıdan **doğrudan** sağlayıcıya gider, Bluedev aracı sunucu kullanmaz
- ✅ API anahtarı yalnızca `chrome.storage.local`'da

Detaylı: [PRIVACY.md](./PRIVACY.md)

---

## Yükleme

### Beta sürümü (mevcut)

Şu an **Chrome Web Store onayı bekleniyor**. Beta için:

```bash
git clone <private-repo-url> wa-contacts-exporter
cd wa-contacts-exporter
npm install
npm run build
```

Sonra Chrome'da:
1. `chrome://extensions` → **Geliştirici modu** aç
2. **"Paketlenmemiş öğe yükle"** → `wa-contact/dist/`
3. Eklenti listede "WA Contacts Exporter" olarak görünür
4. İlk açılışta KVKK rıza ekranını onayla

### Sistem gereksinimleri

- **Chrome** 111+ (Manifest V3 + content_script world: MAIN)
- **Node.js** 18+ (build için)
- (Opsiyonel) **Ollama** — yerel AI için: [ollama.com/download](https://ollama.com/download)

---

## Kullanım

### 1. WhatsApp Web'e giriş yap

`https://web.whatsapp.com` aç → telefonundan QR kod tara → sohbetler yüklensin.

### 2. Eklenti popup'ı aç

Toolbar'daki mavi **WA** ikonu. Sağlık probu 5–15 saniye içinde tamamlanır:
- 🟢 **"WhatsApp Web algılandı ✓"** — hazır
- 🔴 hata mesajı — sayfayı yenile

### 3. Sekmeyi seç

| Sekme | Ne için? |
|---|---|
| **Sohbetler** | 1-on-1 + grup sohbet listesi |
| **Mesajlar** | Mesaj geçmişi (AI için kaynak) |
| **AI ✨** | Özet / Cevap öner / Önceliklendir |
| **Oto-Cevap 🤖** | Yeni mesajlara otomatik cevap |
| **Gruplar** | Sadece grup chat'leri + üye listesi |
| **Etiketler** | WhatsApp Business etiketleri |
| **Tüm Kişiler** | Contact koleksiyonu |

### 4. Çıkar + İndir

İlgili sekmede "Çıkar" → preview tablo → CSV / XLSX / VCard butonlarından birini seç.

### 5. AI ile çalışırken

1. **Mesajlar** sekmesi → ilgili sohbetin mesajlarını çıkar (tercihen "Eski mesaj yükleme turu = 5+")
2. **AI** sekmesi → Sağlayıcı seç (Ollama önerilir) → Kaydet
3. Sohbeti seç → "Özet üret" / "Öneri üret"
4. Beğenmezsen **Yenile** veya **Düzelt** ile iteratif yenile

### Daha kaliteli AI çıktısı için

WA Web her sohbet için sadece **son ~50 mesajı** RAM'de tutar. Daha eski bağlam için:
- WA Web'de o sohbeti aç → mesajların **en üstüne kadar yukarı kaydır** → tekrar Çıkar
- Veya "Eski mesaj yükleme turu" ayarını **5+** yap

---

## Sınırlamalar

- **WA Web sürüm değişikliği**: Meta her 2-3 ayda bir Store API'sini güncelliyor; eklenti çoklu shape matcher'ı var ama bazı sürümlerde hızlı patch gerekebilir
- **GroupMetadata** modülü bazı sürümlerde "OPSİYONEL" görünür — fallback'ler ile gruplar yine listelenir
- **Mesajlar sınırı**: WA Web'in hafıza modeli yüzünden tüm sohbet geçmişi otomatik gelmez; manuel scroll gerekebilir
- **Otomatik cevap popup açıkken çalışıyor** — popup kapalıyken yeni mesaj orchestration durur (gelecek sürümde background SW'a taşınacak)

## Sürüm uyumluluğu

WA Web sürümü 2.3000.x (Mayıs 2026'da test edildi). Yeni sürümlerde uyumsuzluk görürseniz "Hata raporu kopyala" butonuyla rapor gönderebilirsiniz.

---

## Geliştirme

```bash
npm run dev       # Vite dev server + popup HMR
npm run build     # production build → dist/
npm run icons     # SVG → PNG (16/48/128)
npm run package   # build + zip → wa-contacts-exporter-1.0.0.zip
```

### Mimari özet

```
src/
├── content/inject.js        # MAIN world @ document_start (window.__d hook)
├── content/content.js       # ISOLATED world: relay + script tag injection
├── background.js            # MV3 service worker: download relay
├── popup/                   # 7 sekmeli arayüz (vanilla JS, ~33 KB gzip)
├── lib/
│   ├── csv.js               # PapaParse + UTF-8 BOM
│   ├── xlsx.js              # SheetJS (lazy import)
│   ├── vcard.js             # VCard 3.0 hand-rolled
│   └── ai.js                # 6-provider unified API
└── utils/storage.js         # chrome.storage.local wrapper
```

---

## Lisans

Bu yazılım Bluedev'in özel mülkiyetindedir. **Tüm hakları saklıdır.** Detay: [LICENSE](./LICENSE)

Ticari lisanslama / ortaklık için: [bluedev.dev](https://bluedev.dev)

## İletişim

- **Web**: [bluedev.dev](https://bluedev.dev)
- **Destek**: bluedev.dev/destek
- **Hata raporu**: eklenti popup'ı → "Hata raporu kopyala" → JSON'u iletişim formuna yapıştır

---

## Sorumluluk reddi

Bu eklenti **WhatsApp LLC veya Meta Platforms Inc.'in resmi ürünü değildir**. WhatsApp markası WhatsApp LLC'nin tescilli markasıdır. Eklenti yalnızca kullanıcının **kendi cihazında**, **kendi WhatsApp Web hesabındaki** verilere erişmek üzere çalışır.

Çıkarılan veriler için **KVKK / GDPR uyumluluğu kullanıcının sorumluluğundadır**. Bluedev hiçbir kullanıcı verisini görmez, saklamaz, paylaşmaz.
