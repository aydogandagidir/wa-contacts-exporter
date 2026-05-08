# Chrome Web Store Listing — Türkçe

> Bu dosya CWS Developer Console'daki **Mağaza listelemesi → Türkçe (tr)** sekmesine kopyalanır.
> Tüm uzunluk limitleri Google'ın Mart 2026 itibariyle yürürlükteki politikalarına uygundur.

---

## Title (45 karakter limiti)

```
WA Contacts Exporter — WA Web Export + AI
```
*(41 karakter ✓)*

**Alternatif başlıklar (yedek):**
- `WA Contacts Exporter — WhatsApp Export` *(38 karakter)*
- `WhatsApp Web Export + AI · Bluedev` *(34 karakter)*

> ⚠️ **Marka uyarısı:** Title'da "WhatsApp" tam adı yerine kısaltma kullanmak Meta brand guideline'a uygun. CWS reviewer'lar marka isimlerini başlıkta gördükçe ek inceleme yapabilir; "WA" kullanmak güvenli.

---

## Short description (132 karakter limiti)

```
WhatsApp Web sohbet, kişi ve mesajlarınızı dışa aktarın (CSV/XLSX/VCard). Yerel veya bulut AI ile özet ve cevap önerisi üretin.
```
*(128 karakter ✓ — manifest.json ile senkronize)*

---

## Category

**Birincil kategori:** Verimlilik (Productivity)
**İkincil kategori:** İş Araçları (Workflow & Planning)

---

## Languages

- ☑️ Türkçe (varsayılan)
- ☑️ İngilizce

---

## Full description (16,384 karakter limiti — Markdown destekli)

```markdown
# WA Contacts Exporter — WhatsApp Web Export + AI Asistan

WhatsApp Web verilerinizi tek tıkla CSV, XLSX veya VCard olarak dışa aktarın. Sohbetleri, kişileri, grupları, etiketleri ve mesaj geçmişinizi hiçbir sunucuya yüklemeden, doğrudan tarayıcınızda işleyin. Üstelik **isteğe bağlı yapay zeka asistanı** ile sohbetlerinizi özetleyin, cevap önerileri alın ve önceliklerinizi otomatik sıralayın.

## 📤 Dışa aktarma özellikleri

- **Sohbetler** — birebir ve grup sohbetlerinin tamamı, son mesaj zaman damgalarıyla
- **Mesajlar** — sohbet başına 100 ile 5000 arası mesaj geçmişi (kullanıcı kontrollü)
- **Grup üyeleri** — her grup için katılımcı listesi, admin/super-admin durumlarıyla
- **Etiketler** — WhatsApp Business etiketleri (sistem filtreleri ayrı işaretlenir)
- **Kayıtlı kişiler** — telefon defterinizdeki tüm WA kullanıcıları
- **Kayıtsız kişiler** — sohbet ettiğiniz fakat rehberinizde olmayan kullanıcılar (varsayılan KAPALI, opt-in)

**Üç format:**
- **CSV** — UTF-8 BOM ile, Excel'de Türkçe karakterler sorunsuz açılır
- **XLSX** — 5 ayrı sayfalı çalışma kitabı (sohbetler, mesajlar, gruplar, etiketler, kişiler)
- **VCard 3.0** — telefon defterinize aktarılabilen standart kart formatı

## 🤖 Yapay zeka asistanı (isteğe bağlı)

Altı sağlayıcı arasından kendi tercihinizi seçin:

| Sağlayıcı | Tip | Maliyet | API Anahtarı |
|---|:---:|:---:|:---:|
| **Ollama** (önerilen) | 🟢 Yerel | Ücretsiz | Gerekmez |
| **LM Studio / llama.cpp** | 🟢 Yerel | Ücretsiz | Gerekmez |
| **Anthropic Claude** | ☁️ Bulut | $0.001 - $0.05 / istek | Gerekli |
| **OpenAI ChatGPT** | ☁️ Bulut | $0.0002 - $0.005 / istek | Gerekli |
| **Google Gemini** | ☁️ Bulut | **Ücretsiz tier** (1500 istek/gün) | Gerekli |
| **Groq** | ☁️ Bulut | **Ücretsiz tier** + ultra hızlı | Gerekli |

### AI yetenekleri

- **Sohbet özetle** — ana konular, eylem maddeleri ve duygu tonu çıkarımı
- **Cevap öner** — iteratif tek-öneri akışı (Yenile / Düzelt / Geri bildirim)
- **Takip hatırlatması** — yanıtlamadığınız mesajlar için nazik öneriler
- **Triage (öncelikleme)** — kural tabanlı skor + AI gerekçesi karması, doğrulama UI ile
- **Üslup taklidi** — AI sizin geçmiş mesajlarınızdan yazım stilinizi öğrenir

## 🤖 Otomatik cevap modülü

AI gelen mesajlara cevap verir. **Varsayılan = Taslak modu**: AI önerir, siz onaylar ve gönderirsiniz. Otomatik gönderme her sohbet için ayrı opt-in.

**Güvenlik katmanları:**
- ✅ Master switch (varsayılan KAPALI)
- ✅ Saatlik / günlük limit (varsayılan: 10/saat, 50/gün)
- ✅ Sessiz saatler (örn. 22:00–08:00 arası gönderme yok)
- ✅ Sohbet bazlı opt-in
- ✅ Tüm gönderimlerin denetim kaydı

## 🔒 Gizlilik & KVKK

- ✅ İlk açılışta KVKK rıza ekranı (zorunlu)
- ✅ "Kayıtsız kişileri dahil et" toggle'ı varsayılan olarak KAPALI
- ✅ Tüm veri yerelde — Bluedev sunucusuna **hiçbir şey** gönderilmez
- ✅ AI istekleri tarayıcınızdan **doğrudan** sağlayıcıya gider, Bluedev aracı sunucu kullanılmaz
- ✅ API anahtarları yalnızca `chrome.storage.local`'da saklanır
- ✅ Open-source kütüphaneler şeffaf bağımlılık zinciri (PapaParse, SheetJS)

## 📋 Kullanım

1. **WhatsApp Web'e giriş yapın** (`web.whatsapp.com`)
2. **Mavi WA simgesine tıklayın** → 5-15 sn'lik sağlık kontrolü
3. **Sekme seçin**: Sohbetler / Mesajlar / AI / Oto-Cevap / Gruplar / Etiketler / Tüm Kişiler
4. **"Çıkar"** → Önizleme tablosu → İndir (CSV/XLSX/VCard)
5. AI için: **AI ✨** sekmesi → Sağlayıcı seçin → "Sohbet özetle" / "Cevap öner"

## ⚙️ Sistem gereksinimleri

- Chrome 111+ (veya uyumlu Chromium tabanlı tarayıcı)
- WhatsApp Web hesabı (telefonunuza eşleşmiş)
- Yerel AI için: Ollama veya LM Studio yüklü (opsiyonel)
- Bulut AI için: ilgili sağlayıcının API anahtarı (opsiyonel)

## ⚠️ Sınırlamalar

- WhatsApp Web yalnızca son ~50 mesajı RAM'de tutar; daha eski mesajlar için sohbeti yukarı kaydırın veya "Eski mesaj yükleme turu = 5+" ayarını kullanın
- WhatsApp Web sürüm güncellemeleri (her 2-3 ay) sonrası bazı modüller değişebilir; bu durumda eklenti güncellenir
- Otomatik cevap popup açıkken çalışır; popup kapatıldığında pasif olur (gelecek sürümde background SW'a taşınacak)
- Çift dilli arayüz: İngilizce (varsayılan) + Türkçe, popup header'ında dil seçici ile manuel değiştirilebilir

## 📞 İletişim & Destek

- **Web**: bluedev.dev
- **Destek**: bluedev.dev/contact
- **Hata raporu**: Eklenti popup'ında "Hata raporu kopyala" butonu → JSON'u destek formuna yapıştırın

## ⚖️ Yasal

Bu eklenti **Meta'nın resmi WhatsApp ürünü değildir** ve WhatsApp LLC veya Meta Platforms Inc. tarafından desteklenmez, sponsorluk almaz veya bağlantılı değildir. WhatsApp markası WhatsApp LLC'ye aittir.

Kullanıcının kendi cihazında, kendi WhatsApp Web oturumunda kendi verilerine erişir. Çıkarılan veriler için KVKK / GDPR / veri koruma yükümlülüğü tamamen kullanıcıya aittir.

**Tek amaç beyanı:** Kullanıcının kendi WhatsApp Web verilerini yerel olarak dışa aktarmak ve isteğe bağlı yapay zeka asistanıyla işlemek.

---

Bluedev tarafından geliştirilmiştir · Tüm hakları saklıdır · v1.0.0
```

---

## Single Purpose Declaration (CWS form)

```
Bu eklenti, kullanıcının kendi WhatsApp Web verilerini (sohbetler, mesajlar, kişiler, gruplar, etiketler) yerel olarak dışa aktarmak ve isteğe bağlı yapay zeka asistanıyla bu verileri özetleme/cevap önerisi/önceliklendirme amaçlı işlemek için tasarlanmıştır. Tüm AI işlemleri kullanıcı tarafından açıkça seçilen bir sağlayıcı (yerel Ollama/LM Studio veya bulut Claude/ChatGPT/Gemini/Groq) ile gerçekleşir. Bluedev hiçbir kullanıcı verisine erişmez, saklamaz veya iletmez.
```

---

## Privacy practices URL

✅ **LIVE**: `https://bluedev.dev/products/wa-contacts-exporter/privacy`

Bluedev ana sitesi içinde Next.js page olarak yayında, KVKK + GDPR (TR + EN) içerik. CWS submission'da bu URL'i Step 5 "Privacy practices URL" alanına yapıştır.

---

## Promotional images (CWS yükleme)

| Görsel | Boyut | Zorunlu mu? | Açıklama |
|---|:---:|:---:|---|
| Small tile | 440×280 PNG | ✅ Evet | Search results küçük thumbnail |
| Large tile | 920×680 PNG | ⚠️ Önerilir | Detay sayfası kapak |
| Marquee | 1400×560 PNG | ❌ Opsiyonel | Featured listing (gerekirse) |
| Screenshots | 1280×800 PNG × 5 | ✅ Evet | UI ekran görüntüleri (`docs/screenshots/tr/` altında) |

---

## Submission notlar

- **Review süresi**: Genelde 3-7 iş günü; ilk submission daha uzun olabilir
- **Reddedilirse**: CWS reviewer'ın e-postasında belirttiği permission/policy nedenini bu doküman üzerinde rafine et, yeniden gönder
- **Versiyonlama**: v1.0.1 yayını yapılırsa bu metinler bir sonraki submission'da güncellenir
- **Marka uyarısı**: Title ve description'da WhatsApp tam adı yerine "WA" veya "WhatsApp Web" kullan; "for WhatsApp Web" şeklinde Meta brand guideline'a uygun ifade tercih et
