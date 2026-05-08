# Aydınlatma Metni — WA Contacts Exporter

**Privacy Policy / Aydınlatma Metni**
Son güncelleme: 6 Mayıs 2026
Sürüm: 1.0.0

> Bu eklenti çıkarılan hiçbir veriyi sunucuya göndermez, üçüncü taraflarla paylaşmaz, bulut tabanlı bir hizmet kullanmaz **(kullanıcının açıkça seçtiği AI sağlayıcısı dışında)**. Tüm işlem cihazınızda yereldir.

---

## 1. Veri Sorumlusu

Bu eklentiyi geliştiren **Bluedev**, eklentinin sizin cihazınızda çalışan bir yazılım parçası olduğunu ve eklenti kullanımında oluşturulan veriler üzerinde hiçbir sunucu işlemesi gerçekleştirmediğini beyan eder. Eklenti yalnızca sizin etkileşim ettiğiniz WhatsApp Web sayfasındaki verilere erişir.

İletişim: [bluedev.dev](https://bluedev.dev)

## 2. Hangi Veriler İşlenir?

Sizin tetiklediğiniz "Çıkar" işlemleri sırasında WhatsApp Web'in kendi `Store` nesnesinden okunan veriler:

- Sohbet adları, telefon numaraları, son mesaj zaman damgaları
- Grup adları, üye listesi, üyelerin telefon numaraları ve admin durumu (eğer GroupMetadata modülü mevcutsa)
- WhatsApp etiketleri ve hangi sohbete uygulandığı
- Kayıtlı kişiler (Contact koleksiyonu)
- (AI özelliklerini kullanırsanız) Mesaj içerikleri — yalnızca seçtiğiniz AI sağlayıcısına gönderilir

Bu veriler yalnızca sizin tarayıcınızın `chrome.storage.local` alanında geçici olarak (popup oturumu boyunca) ve indirdiğiniz CSV/XLSX/VCard dosyasında saklanır.

## 3. Verilerin Nereye Gönderildiği

**Bluedev'e: hiçbir yere.** Eklenti dışarıya HTTP isteği yapmaz. Bunu `chrome://extensions` → "WA Contacts Exporter" → "Site izinleri" üzerinden doğrulayabilirsiniz. Manifestteki `host_permissions` listesi:

- `https://web.whatsapp.com/*` — eklentinin temel işlevi
- `https://api.anthropic.com/*` — yalnızca Anthropic Claude'u sağlayıcı olarak seçerseniz
- `https://api.openai.com/*` — yalnızca OpenAI'ı sağlayıcı olarak seçerseniz
- `https://generativelanguage.googleapis.com/*` — yalnızca Google Gemini'yi sağlayıcı olarak seçerseniz
- `https://api.groq.com/*` — yalnızca Groq'u sağlayıcı olarak seçerseniz
- `http://localhost/*` — yerel Ollama / LM Studio sunucularına bağlanmak için

**AI özelliği opsiyoneldir.** Kullanmazsanız hiçbir veri internete çıkmaz. Yerel sağlayıcı (Ollama / LM Studio) seçerseniz veriler de yine cihazınızda kalır.

## 4. KVKK / GDPR Sorumluluğu

Eklentiyi kullanarak çıkardığınız veriler, üçüncü kişilere ait kişisel verileri içerebilir (sohbet ettiğiniz kişilerin telefon numaraları, isimleri, grup üyeleri vb.). Bu veriler için:

- İlgili kişilerden gerekli açık rızayı almak,
- KVKK 5. madde veya GDPR 6. madde anlamında bir hukuki sebep belirlemek,
- Verileri yalnızca işleme amacıyla sınırlı tutmak,
- Verileri güvenli bir şekilde saklamak veya silmek

**Tamamen kullanıcının (sizin) sorumluluğunuzdadır.** Bluedev, kullanıcının yetkisiz veri işleme faaliyetlerinden hiçbir şekilde sorumlu değildir.

GDPR Madde 20 (data portability) çerçevesinde kendi WhatsApp verilerinizi kendi cihazınıza export etmek meşru bir kullanımdır.

## 5. Varsayılan Ayarlar

KVKK / GDPR uyumlu varsayılanlar:

- **"Kayıtlı olmayan kişileri dahil et"** anahtarı varsayılan olarak **kapalıdır** — telefon defterinizde olmayan kişilerin verileri sizin açık opt-in'iniz olmadan dışa aktarılmaz.
- Eklenti ilk açılışta KVKK rızası istemekte; rıza verilmeden hiçbir çıkarma işlemi yapılamaz.
- Hata logu yalnızca yerel olarak `chrome.storage.local`'da tutulur, en fazla 50 kayıt; otomatik döner.
- AI sağlayıcısı varsayılan olarak **Yerel Ollama**'dır (veriler bilgisayarda kalır). Bulut sağlayıcı seçimi açık rıza gerektirir.
- **Otomatik cevap** modülü varsayılan olarak **kapalıdır** ve etkinleştirilirse default mod **Taslak**'tır (AI önerir → kullanıcı onaylar → gönderir).

## 6. Verilerin Silinmesi

Eklentinin tuttuğu yerel verileri silmek için:

- `chrome://extensions` → "WA Contacts Exporter" → "Detaylar" → "Site verilerini sil"
- Veya eklentinin popup'ında "Hata raporu kopyala" → kayıtlı log'lar görüntülenebilir, sonra Chrome Storage temizleme ile silinir

İndirdiğiniz dosyalar bilgisayarınızda kalmaya devam eder; onları kendiniz silmelisiniz.

## 7. WhatsApp / Meta İlişkisi

Bu eklenti **WhatsApp LLC veya Meta Platforms Inc.'in resmi ürünü değildir**, onlarla ilişkili, onlar tarafından desteklenen veya sponsorluğu yapılan bir yazılım değildir. "WhatsApp" ifadesi WhatsApp LLC'nin tescilli markasıdır. Eklenti, kullanıcının kendi tarayıcısındaki WhatsApp Web sekmesinde, kullanıcının kendi verilerine erişmek üzere çalışır.

## 8. İletişim

Bu metin veya eklenti hakkında soru ve görüşleriniz için: [bluedev.dev](https://bluedev.dev)

---

**English summary**: This extension processes WhatsApp Web data **locally on your device only**. No data is sent to Bluedev. AI features are opt-in; if you choose a cloud provider (Anthropic / OpenAI / Gemini / Groq), message content is sent **directly from your browser to that provider** using your own API key — Bluedev never sees it. The user is solely responsible for KVKK/GDPR compliance regarding any third-party data extracted.
