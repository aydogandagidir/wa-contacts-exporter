/* WA Contacts Exporter — Landing page i18n
   Tek dosyada TR + EN sözlük + dil switcher */

const I18N = {
  tr: {
    "meta.title": "WA Contacts Exporter — WhatsApp Web Export + AI · Bluedev",
    "meta.description": "WhatsApp Web sohbet, kişi ve mesajlarınızı dışa aktarın (CSV/XLSX/VCard). Yerel veya bulut AI ile özet ve cevap önerisi üretin. KVKK uyumlu, açık kaynak şeffaflığı.",

    "nav.features": "Özellikler",
    "nav.providers": "AI Sağlayıcılar",
    "nav.privacy": "Gizlilik",
    "nav.faq": "SSS",
    "nav.install": "Kurulum",

    "hero.badge": "🚀 Beta açıldı · ücretsiz",
    "hero.title_html": "WhatsApp Web verilerinizi <span class=\"hl\">dışa aktarın</span>, <span class=\"hl-alt\">yapay zeka</span> ile yönetin.",
    "hero.sub_html": "Sohbetlerinizi, kişilerinizi, gruplarınızı ve mesajlarınızı tek tıkla CSV / XLSX / VCard olarak dışa aktarın. İsteğe bağlı AI asistanıyla özet üretin, cevap önerisi alın, önceliklerinizi sıralayın. <strong>Veri tarayıcınızdan çıkmaz.</strong>",
    "hero.cta_install": "Eklentiyi Yükle",
    "hero.cta_demo": "Demo Videosu",
    "hero.feature_1": "✓ KVKK / GDPR uyumlu — veri yerelde",
    "hero.feature_2": "✓ 6 AI sağlayıcı (yerel veya bulut)",
    "hero.feature_3": "✓ Türkçe karakter sorunsuz Excel çıktısı",
    "hero.feature_4": "✓ Otomatik cevap (taslak modu)",

    "features.heading": "Üç temel modül",
    "features.sub": "Eklentinin tek amacı: kendi verinizi kendi hızınızda yönetmek.",
    "features.export.title": "Veri dışa aktarma",
    "features.export.body": "Sohbet listesi, mesaj geçmişi, grup üyeleri, etiketler, kayıtlı kişiler — hepsi CSV (UTF-8 BOM), XLSX (5 sayfalı) veya VCard 3.0 formatında. Excel'de Türkçe karakter sorunu yok.",
    "features.ai.title": "AI asistan",
    "features.ai.body": "Yerel Ollama'dan Claude / ChatGPT / Gemini'ye altı sağlayıcı seçeneği. Sohbet özetleme, cevap önerisi, eylem maddesi çıkarımı ve sohbet önceliklendirme. AI sizin geçmiş mesajlarınızdan üslubunuzu öğrenir.",
    "features.auto.title": "Otomatik cevap",
    "features.auto.body": "Gelen mesajlara taslak modu ile cevap üretir; siz onaylar gönderirsiniz. Master switch varsayılan kapalı. Saatlik/günlük limit, sessiz saatler, sohbet bazlı opt-in zorunlu.",

    "demo.heading": "90 saniye — eklenti çalışırken",
    "demo.sub": "Kurulumdan ilk export'a, AI asistandan otomatik cevaba.",
    "demo.placeholder": "🎥 Demo videosu buraya gömülecek<br/><small>YouTube unlisted veya direkt MP4 — 90 sn / 1080p / &lt; 50 MB</small>",

    "providers.heading": "Altı AI sağlayıcı — siz seçin",
    "providers.sub": "Yerel veya bulut. Ücretsiz veya ücretli. Gizliliğinize ve bütçenize göre.",
    "providers.tag_recommended": "Önerilen",
    "providers.ollama.desc": "Bilgisayarınızda çalışan açık kaynak LLM sunucusu. Aya Expanse 8B önerilir (Türkçe ⭐⭐⭐⭐).",
    "providers.lmstudio.desc": "GUI ile model indirme + OpenAI uyumlu API. Ollama alternatifi.",
    "providers.claude.desc": "Türkçe kalitesi en yüksek bulut model. $0.001-0.05 / istek.",
    "providers.openai.desc": "gpt-4o-mini ve üstü; iyi balance maliyet/kalite.",
    "providers.gemini.desc": "1500 istek/gün ücretsiz tier. API key Gemini AI Studio'dan alınır.",
    "providers.groq.desc": "Ultra hızlı (saniyede 1000+ token). Llama 3.3, Mixtral.",

    "screenshots.heading": "Eklenti içinden",
    "screenshots.sub": "Tüm UI Türkçe; İngilizce locale yolda.",
    "screenshots.s1": "Sohbetler sekmesi · CSV / XLSX / VCard export",
    "screenshots.s2": "Mesajlar sekmesi · Sohbet başına 100-5000 mesaj",
    "screenshots.s3": "AI sekmesi · 6 sağlayıcı seçimi",
    "screenshots.s4": "İteratif tek-öneri · Yenile / Düzelt",
    "screenshots.s5": "Oto-Cevap sekmesi · Taslak modu",

    "privacy.heading": "Veri tarayıcınızda kalır",
    "privacy.body": "Bluedev'in sunucusu yok. Eklentinin manifest'inde tanımlı tüm host izinlerini chrome://extensions üzerinden inceleyebilirsiniz. AI istekleri tarayıcınızdan doğrudan seçtiğiniz sağlayıcıya gider — aracı sunucu kullanılmaz.",
    "privacy.l1": "✓ İlk açılışta KVKK rıza ekranı zorunlu",
    "privacy.l2": "✓ \"Kayıtsız kişileri dahil et\" varsayılan KAPALI",
    "privacy.l3": "✓ API anahtarları sadece chrome.storage.local",
    "privacy.l4": "✓ Hata logu max 50 kayıt, otomatik döner",
    "privacy.cta": "Aydınlatma Metni →",
    "privacy.code_caption": "Her host izni şeffaftır; AI sağlayıcısı seçmediğiniz sürece o domain'e istek yapılmaz.",

    "install.heading": "Kurulum",
    "install.sub": "Chrome Web Store yayını onay bekliyor. O zamana kadar dev mode kurulumu:",
    "install.s1_title": "GitHub release indir",
    "install.s1_body": "wa-contacts-exporter-1.0.0.zip dosyasını çıkar.",
    "install.s2_title": "Chrome'da uzantılar sayfası",
    "install.s2_body": "Adres çubuğuna chrome://extensions yaz, Enter.",
    "install.s3_title": "Geliştirici modu",
    "install.s3_body": "Sağ üstteki \"Geliştirici modu\" anahtarını aç.",
    "install.s4_title": "Paketlenmemiş yükle",
    "install.s4_body": "\"Paketlenmemiş öğe yükle\" tıkla → çıkardığın dist/ klasörünü seç.",
    "install.s5_title": "WhatsApp Web'i aç + KVKK rıza",
    "install.s5_body": "web.whatsapp.com adresine git, eklenti popup'ında rıza ekranını onayla.",
    "install.download_btn": "Beta zip indir (yakında)",
    "install.note": "CWS yayını sonrasında bu adım tek tıkla \"Chrome'a Ekle\" butonuna dönüşecek.",

    "faq.heading": "Sıkça sorulanlar",
    "faq.q1": "Bu Meta'nın resmi uzantısı mı?",
    "faq.a1": "Hayır. Bluedev tarafından geliştirilmiştir; WhatsApp / Meta ile bağlantılı değildir, sponsorluk almaz. Yalnızca sizin kendi WhatsApp Web oturumunuzdaki kendi verilerinize erişir. WhatsApp markası WhatsApp LLC'ye aittir.",
    "faq.q2": "Verilerim güvende mi?",
    "faq.a2": "Evet. Eklentinin manifest'inde web.whatsapp.com dışında yalnızca seçtiğiniz AI sağlayıcısının domain'i için istek yapılır. Bluedev'in sunucusu yok, aracı sunucu kullanılmaz, hiçbir telemetri toplanmaz.",
    "faq.q3": "Toplu pazarlama / spam için kullanılabilir mi?",
    "faq.a3": "Hayır — tasarımı buna karşı. Otomatik cevap modülü taslak modunda çalışır, rate limit + sessiz saat zorunludur, sohbet bazlı opt-in gerekir. KVKK uyum yükümlülüğü tamamen kullanıcıya aittir.",
    "faq.q4": "Yapay zeka için ücret ödemem gerekiyor mu?",
    "faq.a4": "Hayır. Yerel Ollama / LM Studio ücretsizdir. Bulut isteyenler için Gemini ve Groq'un ücretsiz tier'ları yeterli. Claude / ChatGPT için kendi API anahtarınızı kullanırsınız.",
    "faq.q5": "Mesajların tamamı export ediliyor mu?",
    "faq.a5": "WhatsApp Web yalnızca son ~50 mesajı RAM'de tutuyor. Daha eski geçmiş için sohbeti yukarı kaydırın veya \"Eski mesaj yükleme turu = 5+\" ayarını kullanın. Eklenti hafıza sınırını aşamaz; bu Meta'nın WA Web tarafındaki tasarım kararıdır.",
    "faq.q6": "Beta sürecinden sonra ne olacak?",
    "faq.a6": "Beta süresi boyunca ücretsiz kalacak. Geri bildirimleri toplayıp v0.2.0'da Pro tier seçenekleri sunmayı planlıyoruz (ekip özellikleri, gelişmiş AI). Beta kullanıcıları Pro'ya erken erişim hakkı kazanacak.",

    "footer.privacy": "Aydınlatma Metni",
    "footer.support": "Destek",
    "footer.web": "bluedev.dev",
    "footer.disclaimer": "WhatsApp™, WhatsApp LLC'nin tescilli markasıdır. Bu eklenti Meta / WhatsApp ile bağlantılı, onlar tarafından desteklenen veya sponsor edilen bir ürün değildir. © 2026 Bluedev. Tüm hakları saklıdır.",

    "_lang_flag": "🇹🇷 TR",
  },

  en: {
    "meta.title": "WA Contacts Exporter — WhatsApp Web Export + AI · Bluedev",
    "meta.description": "Export your WhatsApp Web chats, contacts, and messages (CSV/XLSX/VCard). Generate summaries and reply suggestions with local or cloud AI. GDPR-compliant.",

    "nav.features": "Features",
    "nav.providers": "AI Providers",
    "nav.privacy": "Privacy",
    "nav.faq": "FAQ",
    "nav.install": "Install",

    "hero.badge": "🚀 Beta is live · free",
    "hero.title_html": "<span class=\"hl\">Export</span> your WhatsApp Web data, manage it with <span class=\"hl-alt\">AI</span>.",
    "hero.sub_html": "Export your chats, contacts, groups, and messages to CSV / XLSX / VCard with a single click. Optional AI assistant summarizes, suggests replies, and prioritizes your inbox. <strong>Your data never leaves your browser.</strong>",
    "hero.cta_install": "Install Extension",
    "hero.cta_demo": "Watch Demo",
    "hero.feature_1": "✓ GDPR / KVKK compliant — local data",
    "hero.feature_2": "✓ 6 AI providers (local or cloud)",
    "hero.feature_3": "✓ Excel-compatible CSV (UTF-8 BOM)",
    "hero.feature_4": "✓ Auto-reply (draft mode default)",

    "features.heading": "Three core modules",
    "features.sub": "The extension has one purpose: manage your own data at your own pace.",
    "features.export.title": "Data export",
    "features.export.body": "Chat list, message history, group members, labels, saved contacts — all to CSV (UTF-8 BOM), XLSX (5-sheet workbook), or VCard 3.0. No encoding issues in Excel.",
    "features.ai.title": "AI assistant",
    "features.ai.body": "Six providers from local Ollama to Claude / ChatGPT / Gemini. Chat summarization, reply suggestions, action-item extraction, and chat prioritization. The AI learns your tone from your past messages.",
    "features.auto.title": "Auto-reply",
    "features.auto.body": "Generates replies in draft mode for incoming messages; you approve and send. Master switch defaults OFF. Hourly/daily rate limit, quiet hours, per-chat opt-in required.",

    "demo.heading": "90 seconds — extension in action",
    "demo.sub": "From install to first export, from AI assistant to auto-reply.",
    "demo.placeholder": "🎥 Demo video embeds here<br/><small>YouTube unlisted or direct MP4 — 90 s / 1080p / &lt; 50 MB</small>",

    "providers.heading": "Six AI providers — your choice",
    "providers.sub": "Local or cloud. Free or paid. Match your privacy needs and budget.",
    "providers.tag_recommended": "Recommended",
    "providers.ollama.desc": "Open-source LLM server running on your machine. Aya Expanse 8B recommended (Turkish ⭐⭐⭐⭐).",
    "providers.lmstudio.desc": "GUI model download + OpenAI-compatible API. Ollama alternative.",
    "providers.claude.desc": "Highest Turkish-quality cloud model. $0.001-0.05 / request.",
    "providers.openai.desc": "gpt-4o-mini and above; good cost/quality balance.",
    "providers.gemini.desc": "1500 requests/day free tier. API key from Gemini AI Studio.",
    "providers.groq.desc": "Ultra fast (1000+ tokens/sec). Llama 3.3, Mixtral.",

    "screenshots.heading": "Inside the extension",
    "screenshots.sub": "UI is currently Turkish; English locale on the way.",
    "screenshots.s1": "Chats tab · CSV / XLSX / VCard export",
    "screenshots.s2": "Messages tab · 100-5000 messages per chat",
    "screenshots.s3": "AI tab · 6-provider selection",
    "screenshots.s4": "Iterative single-suggestion · Refresh / Refine",
    "screenshots.s5": "Auto-Reply tab · Draft mode",

    "privacy.heading": "Your data stays in your browser",
    "privacy.body": "Bluedev runs no servers. You can audit every host permission declared in the manifest via chrome://extensions. AI requests go directly from your browser to the provider you select — no relay server.",
    "privacy.l1": "✓ Mandatory consent screen on first run",
    "privacy.l2": "✓ \"Include unsaved contacts\" defaults OFF",
    "privacy.l3": "✓ API keys only in chrome.storage.local",
    "privacy.l4": "✓ Error log capped at 50 entries, rotates",
    "privacy.cta": "Privacy Policy →",
    "privacy.code_caption": "Every host permission is transparent; if you don't pick an AI provider, no request is made to that domain.",

    "install.heading": "Install",
    "install.sub": "Chrome Web Store submission pending. Until then, dev-mode install:",
    "install.s1_title": "Download GitHub release",
    "install.s1_body": "Extract wa-contacts-exporter-1.0.0.zip.",
    "install.s2_title": "Open Chrome extensions",
    "install.s2_body": "Type chrome://extensions in the address bar and press Enter.",
    "install.s3_title": "Enable Developer mode",
    "install.s3_body": "Toggle \"Developer mode\" in the top-right.",
    "install.s4_title": "Load unpacked",
    "install.s4_body": "Click \"Load unpacked\" → select the extracted dist/ folder.",
    "install.s5_title": "Open WhatsApp Web + accept consent",
    "install.s5_body": "Visit web.whatsapp.com, accept the consent screen in the extension popup.",
    "install.download_btn": "Download beta zip (soon)",
    "install.note": "Once CWS approves, this will become a one-click \"Add to Chrome\" button.",

    "faq.heading": "Frequently asked",
    "faq.q1": "Is this an official Meta extension?",
    "faq.a1": "No. Built by Bluedev; not affiliated with, sponsored by, or endorsed by WhatsApp / Meta. It only accesses data from your own WhatsApp Web session on your own device. WhatsApp is a trademark of WhatsApp LLC.",
    "faq.q2": "Is my data safe?",
    "faq.a2": "Yes. The manifest only declares requests for web.whatsapp.com plus the AI provider you choose. No Bluedev server, no relay, no telemetry.",
    "faq.q3": "Can it be used for mass marketing / spam?",
    "faq.a3": "No — by design. Auto-reply runs in draft mode, rate limits and quiet hours are mandatory, per-chat opt-in is required. GDPR / KVKK compliance is the user's sole responsibility.",
    "faq.q4": "Do I have to pay for AI?",
    "faq.a4": "No. Local Ollama / LM Studio is free. For cloud, Gemini and Groq have free tiers that go a long way. Claude / ChatGPT use your own API key.",
    "faq.q5": "Are all messages exported?",
    "faq.a5": "WhatsApp Web only keeps the last ~50 messages per chat in RAM. For older history, scroll up in the chat or use \"Earlier-message load rounds = 5+\". The extension can't bypass that memory model — it's Meta's WA Web design choice.",
    "faq.q6": "What happens after the beta?",
    "faq.a6": "Beta stays free. We're collecting feedback to ship v0.2.0 with Pro-tier options (team features, advanced AI). Beta users will get early Pro access.",

    "footer.privacy": "Privacy Policy",
    "footer.support": "Support",
    "footer.web": "bluedev.dev",
    "footer.disclaimer": "WhatsApp™ is a trademark of WhatsApp LLC. This extension is not affiliated with, endorsed by, or sponsored by Meta / WhatsApp. © 2026 Bluedev. All rights reserved.",

    "_lang_flag": "🇬🇧 EN",
  },
};

const STORAGE_KEY = "wa-contacts-lang";

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && I18N[stored]) return stored;
  } catch (_) {}
  const browser = (navigator.language || "tr").toLowerCase();
  return browser.startsWith("tr") ? "tr" : "en";
}

function applyLang(lang) {
  if (!I18N[lang]) lang = "tr";
  const dict = I18N[lang];

  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("data-lang", lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    let value = dict[key];

    // Hero title and sub use HTML; check for _html variant
    const htmlKey = key + "_html";
    if (dict[htmlKey] !== undefined) {
      value = dict[htmlKey];
      el.innerHTML = value;
      return;
    }

    if (value === undefined) return;

    // <meta> tag uses content attribute
    if (el.tagName === "META") {
      el.setAttribute("content", value);
      return;
    }

    // <title> uses textContent
    if (el.tagName === "TITLE") {
      el.textContent = value;
      return;
    }

    // Some keys legitimately contain HTML markup
    if (value.includes("<")) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  // Special case: hero h1 + p
  const heroTitle = document.querySelector('[data-i18n="hero.title"]');
  if (heroTitle && dict["hero.title_html"]) heroTitle.innerHTML = dict["hero.title_html"];
  const heroSub = document.querySelector('[data-i18n="hero.sub"]');
  if (heroSub && dict["hero.sub_html"]) heroSub.innerHTML = dict["hero.sub_html"];

  // Lang flag in switcher
  const flag = document.querySelector("[data-lang-flag]");
  if (flag) flag.textContent = dict["_lang_flag"];

  try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
}

function toggleLang() {
  const current = document.documentElement.getAttribute("data-lang") || "tr";
  applyLang(current === "tr" ? "en" : "tr");
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang(getInitialLang());
  document.querySelectorAll('[data-action="toggle-lang"]').forEach((btn) => {
    btn.addEventListener("click", toggleLang);
  });
});
