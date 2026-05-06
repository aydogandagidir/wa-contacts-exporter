# Screenshot Çekim Rehberi — WA Contacts Exporter

**Hedef:** Chrome Web Store + landing page için 5 adet **1280×800 PNG** ekran görüntüsü.

CWS gerektiriyor: minimum 1 screenshot, önerilen 4-5. Boyut: **1280×800** veya **640×400**.
1280×800 daha kaliteli + landing page'de yeniden kullanılabilir.

---

## Hazırlık (her çekimden önce)

1. Chrome'u temiz bir profille aç (öneri: yeni Chrome profili veya Incognito-with-extensions kapalı)
2. WA Web'e giriş yap, sohbetlerin tamamen yüklenmesini bekle
3. Eklenti popup'ında KVKK rıza ekranını onayla
4. AI sekmesi → "Ollama" sağlayıcı seç (varsayılan), `aya-expanse:8b` model — bağlantıyı test et ✓
5. Tarayıcı zoom seviyesi: **%100** (Ctrl+0)
6. Sistem dili: Türkçe (popup'ta TR metinler doğru görünsün)
7. Test verisi olarak hazırlanmış 1-2 sohbet aç (gerçek kişisel veriler **kullanılmayacak**)

> ⚠️ **Gizlilik:** Screenshots'ta **gerçek telefon numaraları, gerçek isimler, gerçek mesaj içerikleri** GÖRÜNMEMELİ. Demo amaçlı sahte kişiler oluştur (örn. "Ahmet Demo", "Ayşe Test" gibi) veya WA Web'de **demo grupları** kur.

---

## 5 Screenshot

### 01 — `01_sohbetler_tab.png`

**Sahne:** Eklenti popup'ı açık, **Sohbetler** sekmesi seçili, "Çıkar" yapılmış, preview tablosunda 6-10 satır.

**Içerik kontrolü:**
- Üstte yeşil dot + "WhatsApp Web algılandı ✓"
- Tabs şeridi görünür (Sohbetler aktif)
- Preview tablo: ad / telefon / tip / son mesaj
- Footer: "Made by Bluedev"

**Anonimleştirme:** Telefon numaraları `+90 *** *** ** **` veya örnek `+1 555-0100` (rezerv numarası)

### 02 — `02_mesajlar_tab.png`

**Sahne:** **Mesajlar** sekmesi, "Sohbet başına en fazla = 500", "Eski mesaj yükleme turu = 5" seçili, "Çıkar" sonrası preview ile.

**Içerik kontrolü:**
- KVKK uyarı kartı görünür ("WhatsApp Web hâlâ hafızasında olan mesajları çıkarır...")
- Limit dropdown'ları
- Çıkarma sonrası ortalama göstergesi: "X mesaj · Y sohbet (ort. Z msj/sohbet)"
- Tablo: Sohbet / Gönderen / Mesaj / Zaman

### 03 — `03_ai_provider.png`

**Sahne:** **AI ✨** sekmesi, "Sağlayıcı ayarları" expanded, dropdown açık ya da provider seçilmiş — "Detay" butonu açık (info banner extended).

**Içerik kontrolü:**
- Üstte "Hazır · Local — Ollama · aya-expanse:8b" durumu
- AI bilgi banner'ı (yeşil ✓ ile)
- Sağlayıcı dropdown'unda iki grup: **Yerel** (ücretsiz) + **Cloud** (API anahtarı)
- Model bilgi kartı (Aya Expanse 8B · Cohere · 7 GB RAM · TR ⭐⭐⭐⭐)
- "Sohbet özetle / Cevap öner" kartı
- "Bağlantıyı test et" butonu

### 04 — `04_ai_suggestion.png`

**Sahne:** AI sekmesinde **iteratif tek-öneri kartı** dolu görünür durumda.

**Içerik kontrolü:**
- Başlık: "Cevap önerisi — [Kontak Adı]" veya "Takip mesajı önerileri"
- Yeşil çerçeveli kart
- 📩 Hedef mesaj alıntısı (italic)
- AI önerisi (gerçek üretim — anonim demo)
- Yenile / Düzelt butonları
- Modern kopyala ikonu (sağ üst köşe)

### 05 — `05_oto_cevap.png`

**Sahne:** **Oto-Cevap 🤖** sekmesi, master switch açık, bir bekleyen taslak kartı görünür durumda.

**Içerik kontrolü:**
- Üstte "Açık · Taslak" status
- "Nasıl çalışır?" detail expanded
- Saat/gün limit + sessiz saatler ayarları
- Sohbet seçim + talimat textarea (örnek talimat dolu)
- "Bekleyen taslaklar" bölümü — 1 taslak kartı: gelen mesaj alıntısı + AI cevabı + Gönder/Sil butonları

---

## Çekim teknik talimat

### Yöntem 1: Chrome popup screenshot (önerilen)

Chrome popup'ını **yakalama** zor — popup tıklama dışında focus kaybedince kapanır. Çözüm:

1. Chrome DevTools'u eklenti popup'ı için aç:
   - `chrome://extensions` → "WA Contacts Exporter" → **Inspect views: popup**
   - DevTools açılırken popup yakalanmış olur (kapanmaz)
2. DevTools'un kendi panelini ayrı pencere yap (üst sağ "..." → "Detach into separate window")
3. Popup'ı browser pencereye taşıyamadığında: aşağıdaki Yöntem 2'yi kullan

### Yöntem 2: Test penceresinde popup'ı açık tut

1. Chrome'u **kioskmode değil** ama tek pencere modunda aç
2. Eklenti popup'ı açıkken **PrintScreen** veya **Win+Shift+S** (Windows Snip) kullan
3. Yakalanan görüntüyü 1280×800'a kırp / yeniden boyutlandır

### Yöntem 3: HTML render export (en kalitelisi)

`dist/src/popup/popup.html` dosyasını **standalone** browser tab'da aç:
1. `dist/` klasörünü servis et: `npx serve dist` veya `python -m http.server 8000 --directory dist/`
2. `http://localhost:8000/src/popup/popup.html` adresinde popup'ı **fake data ile** doldur (test için)
3. F12 → Device Mode → 380×600 (popup'ın gerçek boyutları)
4. DevTools "Capture full size screenshot" (Ctrl+Shift+P → "screenshot")

> Bu yöntem en yüksek çözünürlük + tutarlı kompozisyon sağlar. Ama "fake data" ile kompozisyon yapman gerek.

### Düzenleme

Çekim sonrası her görsel için:
- 1280×800'e crop (popup ortalanmış, etrafında biraz boşluk)
- Görüntüye gölge ekle (opsiyonel — Photoshop / Figma "Drop Shadow")
- Bluedev brand rengi (#015AFF) tek tıklayarak vurgulanabilir öğeler
- Optimize: `pngquant 256` veya `tinypng.com` ile dosya boyutunu < 200 KB yap

---

## Anonim demo verisi nasıl üretilir?

WA Web'de yeni bir grup oluştur:
- **Grup adı**: "Bluedev Demo Grubu"
- **Üyeler**: 3-5 sahte kişi (eğer 2. telefon yoksa, bir grupla iletişim kurarken WA Web grupları kullanılabilir)

Veya:
- Kendinizle yeni mesajlaşma başlatın (telefonunuza WA mesaj at)
- Test sohbetinde 8-10 mesaj alıştırma şeklinde

Telefon numaralarını anonimleştirmek için **GIMP / Photoshop / Pixelmator** ile blur veya "Spot Healing" filtresi.

---

## Dosya isimlendirme + boyut

```
docs/screenshots/
├── 01_sohbetler_tab.png      # 1280×800, < 200 KB
├── 02_mesajlar_tab.png       # aynı
├── 03_ai_provider.png        # aynı
├── 04_ai_suggestion.png      # aynı
└── 05_oto_cevap.png          # aynı
```

Hepsi tamamlandıktan sonra:
- Landing page `landing/assets/screenshots/` altına kopyala
- CWS yayın taslağına yükle (5 slot)

---

## Promotional images (CWS bonus)

CWS opsiyonel olarak **küçük + büyük tile** ister:

| Görsel | Boyut | Kullanım |
|---|---|---|
| **Small tile** | 440×280 PNG | Search results küçük thumbnail |
| **Large tile** | 920×680 PNG | Detay sayfası kapak |
| **Marquee** | 1400×560 PNG | Featured listing (önerilen mağaza) |

Bu üç adet ayrı zaman alır; beta için **sadece 5 screenshot + small tile** yeter. Marquee yayında ihtiyaç olursa eklersin.

### Tile tasarımı (önerilen kompozisyon)

- Sol: Bluedev brand mark (mavi #015AFF "WA" ikon, 96×96)
- Orta: "WhatsApp Web Export + AI" başlık
- Sağ: Sohbetler tab'ından kırpılmış UI parçası
- Footer: "bluedev.dev"

Figma / Canva / GIMP ile tek taslak hazırla, üç boyuta export et.

---

## Sonuç

5 screenshot + small tile çekimi: **~2 saat** (test verisi hazırlama dahil).
Bu dosyalar tamamlandığında Aşama D (CWS yayın) yarı yarıya bitmiş olur.
