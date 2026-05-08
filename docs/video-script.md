# Demo Video Senaryosu — WA Contacts Exporter

**Hedef:** Chrome Web Store + landing page için **60-90 saniyelik** demo video.
**Çıktı formatı:** MP4 1920×1080 (yatay), 30fps, < 50 MB, sesli + (opsiyonel) altyazılı.

---

## Senaryonun yapısı (90 saniye)

| Saniye | Sahne | Görsel | Ses (TR) |
|:---:|---|---|---|
| **0–5** | **Hook** | Bluedev logosu + "WA Contacts Exporter" başlık animasyonu | "WhatsApp Web verilerinizi dışa aktarmak ve AI ile yönetmek istiyor musunuz? Bluedev'in yeni eklentisi tam istediğiniz şey." |
| **5–15** | **Yükleme + ilk açılış** | `chrome://extensions` → developer mode → "Load unpacked" → popup açılış (KVKK rıza ekranı) | "Eklentiyi yüklüyoruz, ilk açılışta KVKK rıza onayını alıyoruz — verileriniz cihazda kalıyor." |
| **15–30** | **Sohbetleri Çıkar** | Sohbetler tab → "Çıkar" → preview tablo → "CSV indir" → Excel'de Türkçe karakterli açılış | "Sohbet listenizi tek tıkla CSV, XLSX veya VCard olarak dışa aktarın. Excel'de Türkçe karakterler sorunsuz." |
| **30–50** | **AI Asistan** | AI sekmesi → "Local — Ollama" sağlayıcı → "Sohbet özetle" → AI çıktısı + alt başlıklar (Özet/Ana konular/Eylem maddeleri) | "Yerel Ollama ile sıfır maliyetli AI asistan — sohbetlerinizi özetler, eylem maddelerini çıkarır." |
| **50–70** | **Cevap önerisi + Yenile/Düzelt** | "Cevap öner" → tek-öneri kartı → "Yenile" → farklı öneri → "Düzelt: daha kısa olsun" → yeni iyileştirilmiş öneri | "Beğenmediğin öneriyi yenileyebilir, geri bildirimle iyileştirebilirsin. Üslubun senin sesinden öğrenilir." |
| **70–85** | **Otomatik cevap modu** | Oto-Cevap sekmesi → master switch açık → "Bekleyen taslaklar"da bir kart → onayla + gönder | "Otomatik cevap modülü taslak modunda çalışır — AI önerir, sen onaylayıp gönderirsin." |
| **85–90** | **Outro** | Bluedev logo + "Yerel ya da bulut · veriler cihazda · bluedev.dev" + indirme CTA | "Yerel ya da bulut AI seçimi, veriler cihazınızda. bluedev.dev'den indirin." |

**Toplam: 90 saniye** (Loom ücretsiz tier limiti dahilinde)

---

## Çekim teknik

### Ekipman
- **Ekran kaydı**: OBS Studio (ücretsiz) veya Loom (ücretsiz, 5 dk limit ✓)
- **Mikrofon**: telefon kulaklığı veya laptop dahili mikrofon (boş ses ortamı)
- **Çözünürlük**: 1920×1080, 30 fps
- **Codec**: H.264 (mp4)

### OBS ayarları (önerilen)
```
Output Mode: Simple
Video Bitrate: 4000 Kbps
Audio Bitrate: 160 Kbps
Output Format: mp4
FPS: 30
Resolution: 1920×1080
```

### Ses kaydı
- Pano sessizliği test et — sadece arka plan gürültüsü 5 saniye kaydet, gerçek senaryoyu sonra kaydet
- Audacity ile noise reduction (opsiyonel)
- Konuşma temposu: orta-hızlı, net telaffuz, "ee", "şey" gibi dolgu sözcükler yok
- TR senaryo metnini önceden 2-3 kez yüksek sesle prova et

---

## Sahne sahne detaylı talimat

### Sahne 1 (0-5 sn): Hook + Marka

**Görsel öğeler**:
- Beyaz arka plan
- Bluedev brand mark animasyonu (sol→sağ slide-in)
- "WA Contacts Exporter" başlık + alt başlık "v1.0.0"
- 0.5 sn fade-in, 4 sn statik, 0.5 sn fade-out

**Animasyon araçları**: Canva / Adobe Express ücretsiz template'leri.

### Sahne 2 (5-15 sn): Eklenti yükleme

**Adımlar (canlı çekim)**:
1. Chrome aç → `chrome://extensions` yaz, Enter
2. **Geliştirici modu** sağ üstte aç
3. **"Paketlenmemiş öğe yükle"** tıkla
4. `dist/` klasörü seç → "Aç"
5. Eklenti listede görünür → toolbar'daki **WA** ikonuna tıkla
6. KVKK rıza ekranı çıkar → checkbox işaretle → "Onaylıyorum, devam et"

**Anlatım**: 10 saniyelik akış, 3-4 cümle.

### Sahne 3 (15-30 sn): Sohbetleri Çıkar → CSV → Excel

**Adımlar**:
1. Eklenti popup'ı açıkken (KVKK sonrası)
2. **Sohbetler** sekmesi (zaten varsayılan açık)
3. **"Sohbetleri Çıkar"** tıkla
4. Preview tablo dolar (5-10 satır)
5. **"CSV indir"** tıkla
6. İndirilen CSV'yi Excel'de aç → Türkçe karakterli sohbet adları görünür

**Hız ipucu**: 15 sn'ye 6 adım sığdırmak için her tıklama arasında 1.5-2 sn duraksama. Hızlı ama anlaşılır.

### Sahne 4 (30-50 sn): AI Asistan

**Adımlar**:
1. **AI ✨** sekmesi
2. "Sağlayıcı ayarları" zaten "Local — Ollama" seçili
3. Üstte yeşil "Hazır · Local — Ollama · aya-expanse:8b" görünür
4. **Mesajlar** sekmesine bir saniyelik geçiş + Çıkar (önceden hazırlanmış demo sohbetin mesajlarını yükle)
5. AI sekmesine geri dön
6. Sohbet seç dropdown → demo sohbeti seç
7. **"Özet üret"** tıkla
8. ~5 saniye yükleme
9. Sonuç paneli açılır: "## Özet ... ## Ana konular ... ## Eylem maddeleri ..."

**Hız**: 20 saniyeye 9 adım. Sıkı tempo. AI yanıtı bekleme süresini **fast-forward** ile kısalt (post-prod).

### Sahne 5 (50-70 sn): İteratif cevap önerisi

**Adımlar**:
1. AI sekmesinde aynı sohbet seçili
2. **"Öneri üret"** tıkla
3. Tek-öneri kartı açılır: 📩 hedef mesaj alıntısı + AI önerisi
4. **"↻ Yenile"** tıkla → farklı bir öneri
5. **"✎ Düzelt"** tıkla → textarea açılır → "daha kısa olsun" yaz
6. **"Geri bildirimle yenile"** → daha kısa öneri çıkar
7. Sağ üst kopyala ikonu → check ile yeşil ✓

**Vurgu**: "Yenile" ve "Düzelt" butonlarına ZOOM (post-prod) — kullanıcının iteratif kontrolünü göstermek için.

### Sahne 6 (70-85 sn): Otomatik cevap

**Adımlar**:
1. **Oto-Cevap 🤖** sekmesi
2. Mevcut bir bekleyen taslak kartı görünür (önceden ayarlanmış)
3. Kart içeriği: gelen mesaj + AI önerisi + Gönder/Sil butonları
4. **Gönder** tıkla → kart kaybolur, "geçmiş"e düşer
5. WhatsApp Web sayfasına geç (split-screen veya hızlı tab geçişi) → mesajın gönderildiğini göster

**Anlatım**: "Otomatik cevap modülü taslak modunda çalışır — AI önerir, sen onaylayıp gönderirsin."

### Sahne 7 (85-90 sn): Outro

**Görsel**:
- Bluedev logo (büyük, ortada)
- Alt başlık: "Yerel ya da bulut AI · veriler cihazda · KVKK uyumlu"
- CTA: "bluedev.dev/products/wa-contacts-exporter"
- Fade-out 0.5 sn

---

## Post-prod (düzenleme)

### Araç önerileri
- **DaVinci Resolve** (ücretsiz, profesyonel) — render kalitesi yüksek
- **Adobe Premiere Rush** (basit) — hızlı kurgular için
- **Loom Edit** (eğer Loom ile çekildiyse) — dahili trim + speed-up

### Düzenleme adımları
1. Ham çekimi içeri al
2. Sahne 4'teki AI yükleme süresini **2x speed** ile sıkıştır (özetleme 5 sn → 2.5 sn göster)
3. Sahne 1 + 7 için **fade-in / fade-out** ekle
4. Sahne 5'teki "Yenile" ve "Düzelt" butonlarına **zoom** efekti (1.2x, 0.5 saniye)
5. Müzik (opsiyonel): YouTube Audio Library'den ücretsiz, sakin elektronik (-18 dB seviyesinde, narration'ın altında)
6. Final render: 1080p MP4, h.264, 30fps, 4 Mbps bitrate

### Altyazı (opsiyonel ama önerilen)
- Senaryo metnini SRT formatında manuel hazırla (veya otomatik: YouTube'a yükledikten sonra YouTube auto-caption'ı SRT olarak indir + manuel düzelt)
- Burned-in olabilir veya YouTube'da ayrı caption track

---

## Yayın

### YouTube unlisted (önerilen)
1. YouTube'a "Unlisted" olarak yükle (kanal: Bluedev)
2. Title: "WA Contacts Exporter — WhatsApp Web Export + AI · Bluedev"
3. Description: kısa özet + bluedev.dev link + GitHub link (private repo bilgisi yok)
4. Thumbnail: 1280×720, ana renk #015AFF, "WA Contacts Exporter" başlığı

### Direkt MP4
- Landing page'de `<video>` etiketiyle embed (autoplay=false, controls=true)
- Boyut < 50 MB (Sahne 4'ü daha agresif sıkıştır gerekirse)

---

## Bütçe

| Kalem | Süre | Maliyet |
|---|:---:|:---:|
| Senaryoyu prova et + senaryoda hata bul | 30 dk | 0 ₺ |
| Çekim (3-4 deneme) | 1.5 saat | 0 ₺ |
| Düzenleme + ses | 2 saat | 0 ₺ |
| YouTube yayın + thumbnail | 30 dk | 0 ₺ |
| **Toplam** | **~4.5 saat** | **0 ₺** |

OBS + DaVinci Resolve + YouTube Audio Library = tamamen ücretsiz pipeline.
