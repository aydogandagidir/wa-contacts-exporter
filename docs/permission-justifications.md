# Permission Gerekçeleri — Chrome Web Store Submission

CWS submission'da her permission için "neden gerekli?" açıklaması istenir. Bu doküman her **TR + EN** olarak hazırdır; CWS form'una doğrudan yapıştırabilirsin.

---

## Permissions

### `storage`

**TR**: Kullanıcının ayarlarını (KVKK rıza durumu, AI sağlayıcı tercihi, "kayıtsız kişileri dahil et" toggle, sohbet bazlı talimatlar, otomatik cevap konfigürasyonu) ve API anahtarlarını yerel olarak saklamak için kullanılır. Hiçbir veri Bluedev'in sunucusuna gitmez.

**EN**: Used to locally store user preferences (KVKK consent state, AI provider selection, "include unsaved contacts" toggle, per-chat instructions, auto-reply configuration) and API keys. No data is sent to Bluedev servers.

### `downloads`

**TR**: Çıkarılan CSV / XLSX / VCard dosyalarını kullanıcının seçtiği konuma indirmek için. Yalnızca kullanıcı "İndir" butonuna tıkladığında tetiklenir.

**EN**: Used to download extracted CSV / XLSX / VCard files to the user's chosen location. Triggered only when the user explicitly clicks "Download".

### `alarms`

**TR**: Pro lisans anahtarının haftada bir kez Gumroad License API'si üzerinden yeniden doğrulanması için. Anahtar yoksa hiçbir alarm tetiklenmez. Doğrulama, kullanıcı arayüzü ile etkileşmeden background service worker tarafında sessizce çalışır.

**EN**: Used to re-verify the Pro license key against Gumroad's License API once per week. No alarm fires when no license is present. Verification runs silently in the background service worker without user interaction.

---

## Host permissions

### `https://web.whatsapp.com/*`

**TR**: Eklentinin temel işlevi — kullanıcının kendi WhatsApp Web sekmesindeki kendi verilerini okumak ve dışa aktarmak. Bu olmadan eklenti hiçbir iş yapamaz.

**EN**: The extension's core function — reading and exporting the user's own data from their own WhatsApp Web session. Without this, the extension does nothing.

### `https://api.anthropic.com/*`

**TR**: Yalnızca kullanıcı AI sağlayıcısı olarak **Anthropic Claude**'u seçtiğinde kullanılır. İstekler kullanıcının kendi API anahtarıyla, doğrudan tarayıcıdan Anthropic'e gider; Bluedev aracı sunucu kullanmaz.

**EN**: Only used when the user explicitly selects **Anthropic Claude** as their AI provider. Requests go directly from the user's browser to Anthropic with the user's own API key; no Bluedev relay server.

### `https://api.openai.com/*`

**TR**: Yalnızca kullanıcı **OpenAI ChatGPT**'yi sağlayıcı olarak seçerse. Anahtar ve istekler kullanıcı kontrolünde, doğrudan OpenAI'ya gönderilir.

**EN**: Only used when the user selects **OpenAI ChatGPT** as their AI provider. Key and requests stay under user control, sent directly to OpenAI.

### `https://generativelanguage.googleapis.com/*`

**TR**: Yalnızca kullanıcı **Google Gemini**'yi seçerse — ücretsiz tier mevcut. İstekler doğrudan Google AI Studio API'sine gider.

**EN**: Only used when the user selects **Google Gemini** (free tier available). Requests go directly to Google AI Studio API.

### `https://api.groq.com/*`

**TR**: Yalnızca kullanıcı **Groq**'u seçerse — açık LLM modellerini yüksek hızda çalıştıran ücretsiz tier'lı sağlayıcı.

**EN**: Only used when the user selects **Groq** — a free-tier provider running open LLM models at high speed.

### `http://localhost/*` ve `http://127.0.0.1/*`

**TR**: Kullanıcının kendi bilgisayarında çalıştırdığı **Yerel Ollama** veya **LM Studio** sunucusuna bağlanmak için. Bu seçenek default'tur ve kullanıcı verilerinin tamamen yerel kalmasını sağlar.

**EN**: Used to connect to the user's locally running **Ollama** or **LM Studio** server. This is the default option and ensures user data stays entirely local.

### `https://api.gumroad.com/*`

**TR**: Yalnızca Pro lisans anahtarının doğrulanması için. Gumroad'un public License API endpoint'ine (`POST /v2/licenses/verify`) anahtar + ürün id ile istek atılır. İstek body'sinde mesaj/sohbet içeriği yer ALMAZ — yalnızca lisans anahtarı. Free sürüm hiç bu host'a istek yapmaz.

**EN**: Used solely to verify the Pro license key. Calls Gumroad's public License API endpoint (`POST /v2/licenses/verify`) with the license key + product id. The request body contains NO message/chat content — only the license key. Free users never hit this host.

---

## Single Purpose Declaration

**TR**: Bu eklentinin tek bir amacı vardır: Kullanıcının kendi WhatsApp Web verilerini (sohbetler, mesajlar, kişiler, gruplar, etiketler) yerel olarak dışa aktarmak ve isteğe bağlı olarak yapay zeka asistanıyla bu verileri özetleme/yanıtlama amaçlı işlemek. Tüm AI işlemleri, kullanıcının açıkça seçtiği bir sağlayıcı (yerel veya bulut) ile gerçekleşir.

**EN**: This extension has a single purpose: Exporting the user's own WhatsApp Web data (chats, messages, contacts, groups, labels) locally, and optionally processing it through an AI assistant for summarization/reply assistance. All AI operations occur with a user-selected provider (local or cloud).

---

## Data Usage Disclosure (CWS form)

### Categories of data this extension handles

- **Personally identifiable information** (e.g. name, address, email, age) — ❌ NO
- **Health information** — ❌ NO
- **Financial / payment information** — ❌ NO
- **Authentication information** (passwords, credentials) — ⚠️ YES (user-supplied AI provider API keys, stored locally only)
- **Personal communications** (emails, messages) — ⚠️ YES (WhatsApp messages — only when user explicitly extracts; processed locally or via user-chosen AI provider)
- **Location** — ❌ NO
- **Web history** — ❌ NO
- **User activity** (clicks, mouse position) — ❌ NO
- **Website content** (text, photos) — ⚠️ YES (WhatsApp Web page content — required for export functionality)

### Certifications (CWS form)

- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Permission justification şablon (CWS form'a paste etmek için)

### Title (TR)
> WA Contacts Exporter, WhatsApp Web verilerini yerel olarak dışa aktarmak ve isteğe bağlı AI ile işlemek için aşağıdaki izinlere ihtiyaç duyar:

### Title (EN)
> WA Contacts Exporter requires the following permissions to export WhatsApp Web data locally and process it with optional AI:

### Body (kısaltılmış, single-paragraph)

**TR**:
> `web.whatsapp.com` host izni eklentinin temel işlevi içindir; `storage` kullanıcı tercihlerini ve AI anahtarlarını yerel olarak saklar; `downloads` çıkarılan dosyaları kullanıcı seçtiği konuma kaydeder; `alarms` Pro lisansını haftada bir Gumroad'da yeniden doğrular. AI sağlayıcı host izinleri (Anthropic / OpenAI / Gemini / Groq) **yalnızca** kullanıcı o sağlayıcıyı seçtiğinde aktif olur. Localhost izni Yerel Ollama / LM Studio'ya bağlanmak içindir.

**EN**:
> The `web.whatsapp.com` host permission is for the extension's core function. `storage` keeps user preferences and AI keys locally. `downloads` saves extracted files to the user's chosen location. `alarms` re-verifies the Pro license against Gumroad once per week. AI provider host permissions (Anthropic / OpenAI / Gemini / Groq) are only used **if** the user selects that provider. The localhost permission connects to Local Ollama / LM Studio.

---

## Privacy practices URL

CWS form'da **Privacy policy URL** istenir:
- `https://bluedev.dev/wa-contacts-exporter/privacy` (ürün-spesifik kapsamlı policy — Limited Use disclosure + 3rd party listesi dahil)

(Henüz live değilse alternatif: GitHub'daki `PRIVACY.md` raw URL'si — ama private repo olduğu için bunu kullanamıyoruz. Landing page deploy edildikten sonra resmi URL kullanılır.)

---

## Notlar

- Bu doküman submission anına kadar değişmemeli — CWS reviewer'ı bu metinleri görür.
- Eğer ileride yeni bir permission eklenirse (örn. `notifications`, `alarms`), bu dosyaya yeni bölüm ekle ve nedenini açıkla.
- Reddedilirse, reviewer'ın belirttiği permission için bu doküman üzerinde rafine et.
