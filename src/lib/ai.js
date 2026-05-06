// AI integration — supports two providers, both called directly from the
// browser (no proxy server, no telemetry):
//
//   1. Anthropic Cloud — official Claude API. User-supplied API key, billed
//      to user's Anthropic account. Quality is best.
//
//   2. OpenAI-compatible local server — Ollama / LM Studio / llama.cpp.
//      Free, fully offline, messages never leave the machine. Endpoint URL
//      is user-configurable; default Ollama on http://localhost:11434/v1.
//      User must enable CORS on their local server (Ollama: set env
//      OLLAMA_ORIGINS=chrome-extension://*).

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const ANTHROPIC_MODELS = {
  haiku: { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 (hızlı, ucuz)" },
  sonnet: { id: "claude-sonnet-4-6", label: "Sonnet 4.6 (dengeli)" },
  opus: { id: "claude-opus-4-7", label: "Opus 4.7 (en güçlü, pahalı)" },
};

// Model-specific metadata used by the popup to render an info panel below
// the dropdown. Star ratings on a 1-5 scale (5 = best). RAM is the rough
// minimum for a comfortable run; size is the download.
export const MODEL_META = {
  // ---- Cohere — TR-tuned, en iyi seçim aralığımız ----
  "aya-expanse:8b": {
    label: "Aya Expanse 8B",
    vendor: "Cohere",
    size: "5.1 GB", ram: "7 GB", trQuality: 4, speed: 4,
    description: "Cohere'in Türkçe dahil 23 dil için özel eğittiği model. Türkçe sohbet özetleme/öneri için en iyi denge — boyut, hız ve kalite bir arada.",
    bestFor: "Türkçe WhatsApp sohbetleri (önerilen başlangıç)",
  },
  "aya-expanse:32b": {
    label: "Aya Expanse 32B",
    vendor: "Cohere",
    size: "19 GB", ram: "24 GB", trQuality: 5, speed: 2,
    description: "Aya'nın daha güçlü versiyonu. Açık modellerin Türkçe şampiyonu — ama 24 GB RAM ve daha yavaş yanıt.",
    bestFor: "Yüksek RAM'li masaüstü, en iyi TR kalite",
  },
  // ---- Alibaba — multilingual güçlü ----
  "qwen2.5:7b": {
    label: "Qwen 2.5 7B",
    vendor: "Alibaba",
    size: "4.7 GB", ram: "6 GB", trQuality: 4, speed: 5,
    description: "18 trilyon token ile eğitilmiş çok-dilli model. Türkçe akıcılığı çok iyi; 7B sınıfının en hızlısı.",
    bestFor: "Hız + TR kalite ikisi birden gerekenler",
  },
  "qwen2.5:32b": {
    label: "Qwen 2.5 32B",
    vendor: "Alibaba",
    size: "20 GB", ram: "24 GB", trQuality: 5, speed: 3,
    description: "Açık modellerin Türkçe şampiyonu (Aya 32B ile başa baş). 128K context — uzun sohbetler için ideal.",
    bestFor: "Çok uzun sohbet özetleri, akıl yürütme",
  },
  "qwen3:8b": {
    label: "Qwen 3 8B",
    vendor: "Alibaba",
    size: "5 GB", ram: "7 GB", trQuality: 5, speed: 4,
    description: "2025 yeni nesil. 7B sınıfında Türkçe için yeni şampiyon adayı.",
    bestFor: "En güncel teknolojiyi denemek",
  },
  "qwen3:30b": {
    label: "Qwen 3 30B (MoE)",
    vendor: "Alibaba",
    size: "18 GB", ram: "24 GB", trQuality: 5, speed: 4,
    description: "MoE: sadece 3B aktif → 30B kalitesi 7B hızında. 2025 yeni nesil.",
    bestFor: "Yüksek RAM, hız + kalite optimize",
  },
  // ---- OpenAI — gpt-oss açık ----
  "gpt-oss:20b": {
    label: "GPT-OSS 20B",
    vendor: "OpenAI",
    size: "13 GB", ram: "16 GB", trQuality: 3, speed: 3,
    description: "OpenAI'nin GPT-2'den beri ilk açık modeli. Reasoning + agentic odaklı, Türkçe ortalama (Qwen/Aya daha iyi TR'de).",
    bestFor: "Adım adım akıl yürütme, ChatGPT'nin açık karşılığı",
  },
  "gpt-oss:120b": {
    label: "GPT-OSS 120B",
    vendor: "OpenAI",
    size: "65 GB", ram: "80 GB+", trQuality: 4, speed: 1,
    description: "GPT-4 sınıfı kalite, sunucu/iş istasyonu gerektirir.",
    bestFor: "Ciddi GPU rig'i olanlar",
  },
  // ---- Google — Gemma ----
  "gemma3:27b": {
    label: "Gemma 3 27B",
    vendor: "Google",
    size: "16 GB", ram: "20 GB", trQuality: 4, speed: 3,
    description: "Multimodal (görsel+metin). Gemini'nin açık kuzeni.",
    bestFor: "Görsel içeren sohbetler",
  },
  "gemma2:9b": {
    label: "Gemma 2 9B",
    vendor: "Google",
    size: "5.3 GB", ram: "7 GB", trQuality: 3, speed: 4,
    description: "Google'ın dengeli açık modeli; Türkçe ortalama.",
    bestFor: "Genel amaçlı, kanıtlanmış",
  },
  // ---- Meta — Llama ----
  "llama3.3:70b": {
    label: "Llama 3.3 70B",
    vendor: "Meta",
    size: "42 GB", ram: "48 GB+", trQuality: 4, speed: 1,
    description: "Llama 3.1 405B kalitesi %15 boyutta. Frontier-class genel amaçlı.",
    bestFor: "Yüksek RAM, en iyi genel kalite",
  },
  "llama3.1:8b": {
    label: "Llama 3.1 8B",
    vendor: "Meta",
    size: "4.1 GB", ram: "6 GB", trQuality: 3, speed: 4,
    description: "Klasik baseline. Türkçe orta — generic İngilizce odaklı.",
    bestFor: "İngilizce ağırlıklı, temel kullanım",
  },
  "llama3.2:3b": {
    label: "Llama 3.2 3B",
    vendor: "Meta",
    size: "2 GB", ram: "3 GB", trQuality: 2, speed: 5,
    description: "Hafif, hızlı, ama Türkçe zayıf. Düşük donanımlı laptop için son çare.",
    bestFor: "Çok sınırlı RAM",
  },
  // ---- Mistral ----
  "mistral-nemo:12b": {
    label: "Mistral Nemo 12B",
    vendor: "Mistral AI",
    size: "7 GB", ram: "10 GB", trQuality: 4, speed: 3,
    description: "128K context + çok-dilli. Uzun sohbet geçmişlerinde rakipsiz.",
    bestFor: "Binlerce mesajlı sohbet özetleme",
  },
  // ---- Microsoft — Phi ----
  "phi4:14b": {
    label: "Phi-4 14B",
    vendor: "Microsoft",
    size: "9 GB", ram: "12 GB", trQuality: 3, speed: 4,
    description: "Boyut/kalite oranında en iyilerden. Format disiplini güçlü, JSON üretimde iyi.",
    bestFor: "Yapılandırılmış çıktı (CSV/JSON üretimi)",
  },
  // ---- DeepSeek — reasoning ----
  "deepseek-r1:32b": {
    label: "DeepSeek R1 32B",
    vendor: "DeepSeek",
    size: "20 GB", ram: "24 GB", trQuality: 3, speed: 1,
    description: "Chain-of-thought reasoning (o1-class). Adım adım düşünür ama yavaş; Türkçe ortalama.",
    bestFor: "Karmaşık akıl yürütme, triyaj",
  },
  "deepseek-r1:7b": {
    label: "DeepSeek R1 7B",
    vendor: "DeepSeek",
    size: "4.7 GB", ram: "6 GB", trQuality: 2, speed: 3,
    description: "Reasoning'in hafif versiyonu — ama bu boyutta zayıf. 32B'i tercih et.",
    bestFor: "Sadece reasoning denemek için",
  },
};

export const PROVIDERS = {
  // === Yerel ===
  ollama: {
    id: "ollama",
    label: "Yerel — Ollama (ücretsiz)",
    isLocal: true,
    requiresKey: false,
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "aya-expanse:8b",
    suggestedModels: [
      "aya-expanse:8b", "aya-expanse:32b", "qwen2.5:7b", "qwen2.5:32b",
      "phi4:14b", "gpt-oss:20b", "mistral-nemo:12b", "deepseek-r1:32b",
      "llama3.3:70b", "gemma3:27b", "llama3.2:3b",
    ],
    helpLink: "https://ollama.com/download",
  },
  openai_compat: {
    id: "openai_compat",
    label: "Yerel — OpenAI uyumlu (LM Studio / llama.cpp)",
    isLocal: true,
    requiresKey: false,
    defaultBaseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
    suggestedModels: ["local-model"],
    helpLink: "https://lmstudio.ai/",
  },
  // === Cloud — API key gerektirir ===
  anthropic: {
    id: "anthropic",
    label: "Anthropic Cloud (Claude)",
    isLocal: false,
    requiresKey: true,
    defaultBaseUrl: ANTHROPIC_URL,
    defaultModel: "claude-haiku-4-5-20251001",
    suggestedModels: Object.values(ANTHROPIC_MODELS).map((m) => m.id),
    helpLink: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    id: "openai",
    label: "OpenAI Cloud (ChatGPT)",
    isLocal: false,
    requiresKey: true,
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    suggestedModels: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o1-mini", "o3-mini"],
    helpLink: "https://platform.openai.com/api-keys",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    isLocal: false,
    requiresKey: true,
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    suggestedModels: ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    helpLink: "https://aistudio.google.com/apikey",
  },
  groq: {
    id: "groq",
    label: "Groq (çok hızlı, açık modeller)",
    isLocal: false,
    requiresKey: true,
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    suggestedModels: [
      "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen-2.5-32b",
      "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768",
    ],
    helpLink: "https://console.groq.com/keys",
  },
};

// ---- Prompt templates -----------------------------------------------------

const TYPE_LABELS = {
  chat: "", image: "[GÖRSEL]", video: "[VİDEO]", ptt: "[SES KAYDI]",
  audio: "[SES]", document: "[BELGE]", sticker: "[ÇIKARTMA]",
  location: "[KONUM]", vcard: "[KARTVİZİT]", call_log: "[ÇAĞRI]",
  e2e_notification: null, gp2: null, notification: null, notification_template: null,
  revoked: "[silinmiş mesaj]", protocol: null, group_notification: null,
};

function formatRelativeOrAbsolute(t) {
  if (!t) return "";
  const d = new Date(t * 1000);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "şimdi";
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 24 * 60) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `bugün ${hh}:${mm}`;
  }
  if (diffMin < 48 * 60) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `dün ${hh}:${mm}`;
  }
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Build a clean, info-rich transcript for the LLM with EXPLICIT direction
// labels. Format: "(time) [SENDER → RECEIVER] body".
//   USER   = the extension user (kullanıcı, fromMe=true)
//   <name> = the chat counterparty (e.g. "KARICIMMM", or contact name)
// This makes role direction unambiguous; the model cannot confuse perspective.
function buildTranscript(messages, approxMax = 25000, contactLabel = "CONTACT") {
  const sorted = messages.slice().sort((a, b) => (a.t || 0) - (b.t || 0));
  const lines = [];
  for (const m of sorted) {
    const t = m.type || "chat";
    if (TYPE_LABELS[t] === null) continue;
    const isUser = !!m.from_me;
    const direction = isUser ? `USER → ${contactLabel}` : `${m.sender_name || m.sender_phone || contactLabel} → USER`;
    const when = formatRelativeOrAbsolute(m.t);
    let body = (m.body || "").trim();
    if (!body) {
      const typeLabel = TYPE_LABELS[t];
      if (typeLabel) body = typeLabel;
      else continue;
    }
    const fwd = m.is_forwarded ? " (iletildi)" : "";
    const media = m.has_media && body && !body.startsWith("[") ? " [+medya]" : "";
    lines.push(`(${when}) [${direction}]${fwd}${media}: ${body}`);
  }
  let transcript = lines.join("\n");
  if (transcript.length > approxMax) {
    const head = "[…önceki mesajlar kısaltıldı…]\n";
    transcript = head + transcript.slice(-(approxMax - head.length));
  }
  return transcript;
}

// SYSTEM messages — kept compact. The model is told its role + non-negotiable
// constraints separately from the data, which improves format adherence and
// reduces hallucination across all model sizes.
const SYSTEMS = {
  summary: `Sen profesyonel bir Türkçe sohbet analisti yardımcısısın.
KURALLAR:
- Sadece sana verilen mesajlardaki bilgileri kullan, kendinden bilgi UYDURMA.
- Çıktın tamamen Türkçe olsun.
- İstenen başlık yapısına TIPATIP uy.
- Eğer bir alan için bilgi yoksa "—" yaz, doldurma.
- Asla "Tabii", "Elbette", "İşte özet" gibi giriş cümlesi kullanma.`,

  followups: `Sen kullanıcının ("Ben") kendi sesini ve üslubunu taklit ederek cevap yazan bir asistansın.

⛔ EN ÖNEMLİ KURAL — BİLGİ UYDURMA YASAĞI:
- SOHBETTE GEÇMEYEN hiçbir aktivite, yer, plan, konu, detay UYDURMA.
- "Kahve içmek", "yemek", "buluşma", "hafta sonu plan", "tatil", "spor", "sinema", "ofise gelmek" gibi konular sohbette yoksa BAHSETME.
- Eğer sohbet sadece bir randevu/zaman teyidi içeriyorsa, cevap da SADECE o konuda olsun. Yeni konu/aktivite EKLEME.
- Bilmediğin/sohbette görmediğin hiçbir şeyi varsayma. "Belki...", "Eğer...", "Sanırım..." ile yeni varsayım üretme.

ÜSLUP MUTLAK KURALI: Sana "BEN'İN ÜSLUP ÖRNEKLERİ" başlığı altında kullanıcının bu sohbette daha önce gönderdiği gerçek mesajları verilecek. Cevapların bu örneklere ÜSLUP, TON, UZUNLUK ve KELIME SEÇIMI olarak BİRE BİR uymalı:
- Kullanıcı kısa yazıyorsa, sen de kısa yaz.
- "Sayın", "Merhaba", "Selam X Bey" gibi formülsel açılışlar — kullanıcı kullanmıyorsa SEN DE KULLANMA.
- "Siz" mi "sen" mi? Aynısını kullan.

GENEL KURALLAR:
- ÇIKTI: yalnızca cevap metinleri. Köşeli parantezli etiket ASLA yazma.
- Format: "1) <metin>", "2) <metin>", "3) <metin>"
- Üç cevap içerik AÇISINDAN farklı, ama hepsi aynı kişinin sesinden ve hepsi sohbette BİLİNEN bilgiye dayalı.
- Sohbetteki özel adlar/detaylar korunmalı — uydurma yok.
- Açıklama, başlık, giriş cümlesi YOK.

YASAK:
- "Belki kahve içmek için" / "hafta sonu daha iyi" / "yemekte konuşalım" — sohbette yoksa
- "Sayın X Bey, ..." — kullanıcı kullanmıyorsa
- "Merhaba X, umarım iyisinizdir." — kullanıcı kullanmıyorsa
- "Önceki mesajıma istinaden..." — bürokratik
- "Anlayışınız için teşekkür ederim" — yapay`,

  followupReminder: `Sen kullanıcının ("Ben") kendi sesini ve üslubunu taklit ederek TAKİP mesajı yazan bir asistansın.

BAĞLAM: Sohbetteki son mesaj KULLANICININ kendi mesajıdır — karşı taraftan henüz cevap gelmemiş. Senin görevin kullanıcının nazikçe gönderebileceği 3 farklı takip mesajı yazmak.

⛔ EN ÖNEMLİ KURAL — BİLGİ UYDURMA YASAĞI:
- SOHBETTE GEÇMEYEN hiçbir aktivite, yer, plan, konu UYDURMA.
- "Kahve içmek", "yemek", "buluşma", "hafta sonu plan", "tatil", "spor", "sinema" gibi konular sohbette yoksa BAHSETME.
- Sohbette sadece "Cuma günü müsait misiniz?" varsa, takip mesajı SADECE bu zamanlama hakkında olsun. Yeni konu/aktivite EKLEME.
- "Belki hafta sonu daha iyi" / "kahve içmek için" gibi yeni öneriler — kullanıcı sohbette daha önce bahsetmediyse YASAK.
- Bilmediğin/görmediğin hiçbir şeyi varsayma. Tahmin yürütme.

ÜSLUP MUTLAK KURALI: Sana "BEN'İN ÜSLUP ÖRNEKLERİ" başlığı altında kullanıcının bu sohbette daha önce gönderdiği gerçek mesajları verilecek. Takip mesajların bu örneklere ÜSLUP, TON, UZUNLUK ve KELIME SEÇIMI olarak BİRE BİR uymalı:
- Kullanıcı kısa ve samimi yazıyorsa, sen de öyle yaz. UZUN YAZMA.
- Kullanıcı "selam"/"sayın" gibi açılış kullanmıyorsa, SEN DE KULLANMA.
- Kullanıcı "siz" mi "sen" mi kullanıyor? Aynısını kullan.
- Kullanıcının noktalama, kısaltma, kelime alışkanlıklarını yakala.

GENEL KURALLAR:
- ÇIKTI: yalnızca takip metinleri. Köşeli parantezli etiket ASLA yazma.
- Format: "1) <metin>", "2) <metin>", "3) <metin>"
- ASLA önceki kendi mesajını kelimesi kelimesine tekrar yazma — yeni bir takip metni üret.
- Üç farklı yaklaşım — ama hepsi sadece BİLİNEN bilgilere dayanır:
  · 1) en kısa hatırlatma ("haberini bekliyorum" gibi)
  · 2) yanıt almak için soruyu yeniden çerçevele (yeni konu ekleme)
  · 3) biraz daha resmi tekrar — ama yine sadece bilinen bağlamla
- Bağlam yetersizse: SADECE müsaitlik/cevap teyidini sor, yeni şey üretme.

YASAK:
- "Belki hafta sonu daha iyi" / "kahve içmek için" / "yemekte konuşalım" — sohbette yoksa
- "Spor/sinema/yemek" gibi aktivite önerisi — sohbette yoksa
- "Sayın X Bey, önceki mesajıma istinaden..." — bürokratik
- "Acele etmiyorum ama" — pasif-agresif
- "Tercihinizi öğrenmek isterim" — yapay
- "Anlayışınız için şimdiden teşekkürler"`,

  // Tek-öneri akışı. SENDER/RECEIVER etiketleri ile yapısal rol koruma.
  singleFollowup: `═══ ROL TANIMI ═══
İki taraf vardır:
  • USER = uygulamayı kullanan kişi (mesajları kendi hesabından gönderir)
  • CONTACT = sohbetin diğer tarafı (USER'ın yazıştığı kişi)

Tüm transcript ve örneklerde "[X → Y]" formatı kullanılır:
  • [USER → CONTACT] = USER tarafından CONTACT'a gönderilen mesaj
  • [CONTACT → USER] = CONTACT tarafından USER'a gönderilen mesaj

GÖREVİN: USER'ın CONTACT'a göndereceği YENİ MESAJI yazmak.
ÇIKTI YÖNÜ: USER → CONTACT (her zaman).

ASLA:
  • CONTACT'ın yerine yazma — onun cevabını üretme.
  • USER ve CONTACT rollerini ters çevirme.
  • Mesajını CONTACT'tan USER'a gidiyormuş gibi yazma.

⛔ MUTLAK KURALLAR:

1. PERSPEKTİF KORUMA (yapısal):
   - Çıktın ZORUNLU OLARAK USER → CONTACT yönünde olmalı.
   - Transcript'te [USER → CONTACT] etiketli son mesaj USER tarafından gönderildi → CONTACT henüz cevap vermediyse, sen CONTACT'ın yerine cevap UYDURMAYACAKSIN. USER'ın CONTACT'a göndereceği TAKİP mesajı yazacaksın.
   - [CONTACT → USER] etiketli mesajları CONTACT göndermiştir → senin "ben" sıfatınla yazılmış değildir, onların yerine konuşma.
   - USER'ın sohbet içindeki ROL'ünü (talep eden / planlayan / soran / yardım veren) DEĞİŞTİRME.

2. BİLGİ UYDURMA YASAĞI:
   - Sohbette GEÇMEYEN hiçbir aktivite, yer, plan, kişi, miktar, tarih uydurma.
   - "Kahve", "yemek", "buluşma", "hafta sonu", "tatil", "spor", "sinema", "krep", "makarna",
     "para transferi" gibi şeyler sohbette yoksa BAHSETME.
   - "Belki yorgun", "umarım iyisin", "muhtemelen yoğunsun" gibi karşı taraf hakkında
     VARSAYIM/empati YASAK — sohbette delil yoksa.

3. ÜSLUP TAKLİDİ:
   - "USER ÜSLUP ÖRNEKLERİ" bloğundaki [USER → CONTACT] etiketli mesajların kelime seçimi, uzunluk, formality, açılış alışkanlıklarını birebir kopyala.
   - USER kısa yazıyorsa SEN DE KISA YAZ.
   - "Sayın", "Merhaba", "Selam X Bey" formülsel açılışı USER kullanmıyorsa SEN DE KULLANMA.

4. TEK MESAJ:
   - Sadece TEK öneri üret — numaralandırma, alternatif, açıklama YOK.
   - Başına/sonuna etiket/tırnak/giriş cümlesi YOK.
   - Maksimum 2-3 cümle, sohbet üslubunda.

5. ÖNCEKİ DENEMELER:
   - "REDDEDİLEN ÖNERİLER" listesi varsa, oradakilere benzer bir şey üretme.

YASAK İFADELER:
- "Sayın X Bey, ..." (kullanıcı kullanmıyorsa)
- "Belki yorgun/rahatsız/uygun değildir"
- "Umarım iyisindir / iyisinizdir"
- "Senin için uygun olanı ben ayarlayabilirim" (kullanıcı talep eden taraf ise)
- "Anlayışınız için teşekkürler"
- "Önceki mesajıma istinaden"
- "Belki kahve / hafta sonu / yemek" (sohbette yoksa)
- "Para gönderdim", "yemek hazırlayalım" gibi sohbette geçmeyen aktivite/eylem önerisi`,

  triage: `Sen WhatsApp sohbetlerine 1 cümlelik Türkçe gerekçe yazan bir asistansın.
KURALLAR (mutlak):
- İsimleri ASLA değiştirme/kısaltma/birleştirme. Her satırdaki adı kelime kelime kopyala.
- Disambiguator (•••XX) kısmını da çıktıya AYNEN kopyala. Bunu uydurma — sadece girdide olanı kullan.
- Çıktıdaki her satır, girdide var olan bir satırın "Ad (•••XX)" alanıyla TIPATIP eşleşmeli.
- Yeni isim/sohbet UYDURMA. Listede olmayan birini eklemen yasak.
- SIRAYI DEĞİŞTİRME — girdideki sıra zaten önceliklendirilmiş; sen sadece her satıra TR gerekçe yazıyorsun.
- Format: "1. [Ad] (•••XX) — [tek cümle TR gerekçe]"
- Gerekçe son mesaj içeriğine ve fromMe sinyaline uygun olmalı.`,

  autoReply: `Sen kullanıcının ("Ben") kendi sesini bire bir taklit ederek WhatsApp cevabı yazan asistansın.

⛔ BİLGİ UYDURMA YASAĞI:
- Sohbette geçmeyen hiçbir aktivite/yer/plan/konu uydurma.
- Karşı tarafa yeni öneri sunma — sadece soruları/talepleri cevapla.
- Bilmediğin bir şey istenirse "birazdan bakıp döneyim" gibi kibar erteleme yap — UYDURMA.

ÜSLUP MUTLAK KURALI: Sana "BEN'İN ÜSLUP ÖRNEKLERİ" başlığı altında kullanıcının bu sohbette gönderdiği gerçek mesajları verilecek. Cevabın bu örneklerin TONU, UZUNLUĞU, KELIME SEÇİMİ ile bire bir eşleşmeli:
- Kullanıcı kısa yazıyorsa, sen de kısa yaz.
- "Selam"/"Sayın"/"Merhaba X Bey" formülsel açılışları kullanıcı kullanmıyorsa SEN DE KULLANMA.
- "Sen" mi "siz" mi? Aynısı.
- Noktalama, küçük/büyük harf alışkanlığı eşleşsin.

GENEL KURALLAR:
- ÇIKTI: sadece gönderilecek mesaj metni — başına "Cevap:", tırnak, açıklama, alt-not YOK.
- Türkçe ve doğal. Otomatik üretildiğini ASLA belli etme. "Bir AI olarak..." YASAK.
- 1-3 cümle.

YASAK KALIPLAR:
- "Sayın X Bey, anlayışınız için teşekkür ederim"
- "Merhaba X, umarım iyisinizdir"
- "Önceki mesajınıza istinaden"
- "Belki hafta sonu / kahve / yemek gibi yeni öneriler"`,
};

const PROMPTS = {
  summary: (transcript, chatName, instructions) =>
    `SOHBET ADI: ${chatName}

Aşağıdaki WhatsApp mesajlarını analiz et ve TIPATIP bu yapıda Türkçe çıktı üret:

## Özet
2-3 cümlelik genel özet.

## Ana konular
- madde 1
- madde 2
(en fazla 5 madde)

## Eylem maddeleri
- (varsa) [kim] [ne yapacak] [ne zaman]
(yoksa "—" yaz)

## Ton ve duygu
İlişkinin tonu hakkında 1 cümle.
${instructions ? `\nKULLANICININ BU SOHBETE ÖZEL TALİMATI (özet üretirken bunu dikkate al):\n${instructions}\n` : ""}
MESAJLAR:
\`\`\`
${transcript}
\`\`\``,

  followups: (voiceSamples, contextBlock, targetSender, targetBody, chatName, instructions) =>
    `SOHBET ADI: ${chatName}

BEN'İN ÜSLUP ÖRNEKLERİ (kullanıcının bu sohbette gönderdiği gerçek mesajları — ÜSLUBU BİRE BİR TAKLİT ET):
\`\`\`
${voiceSamples || "(üslup örneği yok — minimal, doğal Türkçe kullan)"}
\`\`\`

ÖNCEKİ BAĞLAM (sadece konu ve durumu anlamak için — üslup yukarıdaki blokta):
\`\`\`
${contextBlock || "(önceki bağlam yok)"}
\`\`\`

HEDEF MESAJ — ${targetSender} az önce şunu gönderdi (cevabın DOĞRUDAN BU mesaja olmalı):
"""
${targetBody}
"""
${instructions ? `\nBU SOHBETE ÖZEL TALİMAT:\n${instructions}\n` : ""}
Şimdi ${targetSender}'a 3 farklı cevap öner. Cevaplar BEN'İN ÜSLUBU İLE eşleşmeli — formülsel açılış (Sayın, Merhaba, Selam X Bey) yasak. Üç cevap birbirinden farklı içerikte ama aynı kişinin sesinden:
- 1) en doğal — kullanıcının tarzında, kısa
- 2) biraz daha bilgi/detay ekleyen
- 3) biraz daha resmi (ama YİNE kullanıcının üslubu içinde, kalıba düşmeden)

Yalnızca "1) ...", "2) ...", "3) ..." satırlarını yaz:`,

  followupReminder: (voiceSamples, contextBlock, lastOwnBody, chatName, instructions) =>
    `SOHBET ADI: ${chatName}

BEN'İN ÜSLUP ÖRNEKLERİ (kullanıcının bu sohbette gönderdiği gerçek mesajları — ÜSLUBU BİRE BİR TAKLİT ET):
\`\`\`
${voiceSamples || "(üslup örneği yok — minimal, doğal Türkçe kullan)"}
\`\`\`

ÖNCEKİ BAĞLAM (sadece konu ve durumu anlamak için):
\`\`\`
${contextBlock || "(önceki bağlam yok)"}
\`\`\`

KULLANICININ ("Ben") YANITSIZ KALAN SON MESAJI (cevap bekleniyor, takip bu mesaja yapılacak):
"""
${lastOwnBody}
"""
${instructions ? `\nBU SOHBETE ÖZEL TALİMAT:\n${instructions}\n` : ""}
Karşı taraftan cevap GELMEMİŞ. 3 farklı TAKİP mesajı yaz — KULLANICININ ÜSLUBUYLA. Formülsel açılış (Sayın, Merhaba) ve klişe (önceki mesajıma istinaden, anlayışınız için teşekkürler) YASAK. Önceki mesajı tekrar yazma:
- 1) en kısa/yumuşak hatırlatma — kullanıcının tarzında
- 2) alternatif/seçenek sunan takip
- 3) net soru veya özet — ama yine kullanıcının üslubunda

Yalnızca "1) ...", "2) ...", "3) ..." satırlarını yaz:`,

  singleFollowup: ({ voiceSamples, contextBlock, targetSender, targetBody, isReminder, chatName, instructions, previousAttempts, userFeedback }) =>
    `KİŞİ EŞLEMESİ:
  USER    = uygulama kullanıcısı (Ben)
  CONTACT = ${chatName}

USER ÜSLUP ÖRNEKLERİ — yalnızca [USER → CONTACT] etiketli mesajlardan üslup taklit et:
\`\`\`
${voiceSamples || "(üslup örneği yetersiz — minimal, samimi Türkçe kullan)"}
\`\`\`

ÖNCEKİ TRANSCRIPT (her satır SENDER → RECEIVER yönüyle etiketli):
\`\`\`
${contextBlock || "(önceki bağlam yok)"}
\`\`\`

${isReminder
  ? `╔═══ DURUM ═══╗
║ Son mesaj USER tarafından gönderildi:
║   [USER → CONTACT] "${targetBody}"
║ CONTACT henüz cevap vermedi.
╚═════════════╝

GÖREVİN: USER'ın CONTACT'a göndereceği bir TAKİP mesajı yaz.
ÇIKTI YÖNÜ (zorunlu): USER → CONTACT
- CONTACT'ın yerine cevap UYDURMA. CONTACT henüz konuşmadı.
- Yukarıdaki [USER → CONTACT] mesajını AYNEN TEKRAR ETME, yeni bir takip metni üret.
- USER'ın sohbet içindeki rolünü (talep eden / soran / planlayan) AYNI tut.`
  : `╔═══ DURUM ═══╗
║ Son mesaj CONTACT tarafından gönderildi:
║   [CONTACT → USER] "${targetBody}"
║ USER cevap verecek.
╚═════════════╝

GÖREVİN: USER'ın CONTACT'a göndereceği bir CEVAP yaz.
ÇIKTI YÖNÜ (zorunlu): USER → CONTACT
- CONTACT'ın yerine cevap UYDURMA — onun mesajına USER olarak cevap veriyorsun.
- USER'ın rolünü koru.`}
${instructions ? `\nBU SOHBETE ÖZEL TALİMAT (USER tarafından girildi):\n${instructions}\n` : ""}
${(previousAttempts && previousAttempts.length)
  ? `\nDAHA ÖNCE ÜRETTİĞİN VE USER'IN BEĞENMEDİĞİ ÖNERİLER (TEKRAR ETME, FARKLI bir yaklaşım dene):
${previousAttempts.map((p, i) => `${i + 1}. "${p}"`).join("\n")}\n`
  : ""}
${userFeedback
  ? `\nUSER'IN GERİBİLDİRİMİ (bunu mutlaka dikkate al):
"${userFeedback}"\n`
  : ""}

Şimdi USER'dan CONTACT'a giden TEK mesajı yaz. Sadece gönderilecek metni — başına/sonuna açıklama, etiket, tırnak, "[USER → CONTACT]:" prefiks KOYMA:`,

  triage: (rankedRows) =>
    `Aşağıda öncelik sırasına önceden dizilmiş sohbetler var. Her birine 1 cümlelik
TR gerekçe ekle. SIRAYI DEĞİŞTİRME, isim/disambiguator KOPYALA.

ÖRNEK ÇIKTI:
1. Ahmet Bey (•••42) — bugün 14:30 randevu için onay bekliyor
2. Ayşe Apartman (•••18) — fatura bilgisi geldi, eylem gerekmez

LİSTE:
\`\`\`
${rankedRows}
\`\`\``,

  autoReply: (voiceSamples, transcript, lastIncomingBody, chatName, instructions) =>
    `SOHBET ADI: ${chatName}

BEN'İN ÜSLUP ÖRNEKLERİ (kullanıcının bu sohbette gönderdiği gerçek mesajları — bire bir taklit et):
\`\`\`
${voiceSamples || "(üslup örneği yok — minimal, doğal Türkçe kullan)"}
\`\`\`

ÖNCEKİ MESAJLAR (durumu anlamak için):
\`\`\`
${transcript}
\`\`\`

KARŞI TARAFIN AZ ÖNCE GÖNDERDİĞİ:
"${lastIncomingBody}"
${instructions ? `\nBU SOHBETE ÖZEL TALİMAT:\n${instructions}\n` : ""}
Şimdi karşı tarafa göndereceğin mesajı yaz (sadece mesaj metni — kullanıcının üslubunda, kısa, doğal):`,
};

// ---- HTTP transports ------------------------------------------------------

async function callAnthropic({ apiKey, model, system, prompt, baseUrl, maxTokens, temperature }) {
  if (!apiKey) throw new Error("Anthropic API anahtarı tanımlı değil");
  const url = baseUrl || ANTHROPIC_URL;
  const body = {
    model,
    max_tokens: maxTokens,
    temperature: typeof temperature === "number" ? temperature : 0.4,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) {
    // Anthropic prompt caching: system block becomes cacheable; subsequent
    // identical system content reduces input cost ~%90 + latency.
    body.system = [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let bd = ""; try { bd = await res.text(); } catch {}
    throw new Error(`Anthropic ${res.status}: ${bd.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  return { text, usage: data.usage || null, model: data.model || model };
}

async function callOpenAICompat({ baseUrl, apiKey, model, system, prompt, maxTokens, temperature, isLocal }) {
  if (!baseUrl) throw new Error("Local LLM URL tanımlı değil");
  const trimmed = baseUrl.replace(/\/+$/, "");
  const url = trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: typeof temperature === "number" ? temperature : 0.4,
    top_p: 0.9,
    stream: false,
  };
  // Ollama-specific quality knobs accepted via OpenAI-compat extra params:
  // num_ctx pushes context window from default 2048 → 8192 (uzun transcript
  // lazımsa); keep_alive holds the model in RAM for 30 min so subsequent
  // calls skip cold-start (~25 sn → ~1 sn).
  if (isLocal) {
    body.options = { num_ctx: 8192, top_k: 40, repeat_penalty: 1.1 };
    body.keep_alive = "30m";
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    let bd = ""; try { bd = await res.text(); } catch {}
    throw new Error(`Local LLM ${res.status}: ${bd.slice(0, 300)} — Ollama için OLLAMA_ORIGINS=chrome-extension://* ortam değişkeni eklemeniz gerekebilir.`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    usage: data.usage ? { input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens } : null,
    model: data.model || model,
  };
}

async function callProvider({ provider, apiKey, baseUrl, model, system, prompt, maxTokens = 1024, temperature }) {
  const cfg = PROVIDERS[provider] || PROVIDERS.anthropic;
  if (cfg.id === "anthropic") {
    return callAnthropic({ apiKey, model, system, prompt, baseUrl, maxTokens, temperature });
  }
  return callOpenAICompat({ baseUrl, apiKey, model, system, prompt, maxTokens, temperature, isLocal: cfg.isLocal });
}

// ---- Public API used by popup ---------------------------------------------

export async function summarizeChat({ provider, apiKey, baseUrl, model, messages, chatName, instructions }) {
  const transcript = buildTranscript(messages);
  if (!transcript) throw new Error("Bu sohbet için yeterli metin mesajı bulunamadı.");
  return callProvider({
    provider, apiKey, baseUrl, model,
    system: SYSTEMS.summary,
    prompt: PROMPTS.summary(transcript, chatName, instructions),
    maxTokens: 1024,
    temperature: 0.3,
  });
}

// Extract user's own voice samples — recent outgoing (fromMe=true) messages
// in this chat. Each sample is labelled with the explicit direction to
// reinforce who said what.
function extractVoiceSamples(messages, { maxSamples = 12, maxTotalChars = 2500, excludeIdx = -1, contactLabel = "CONTACT" } = {}) {
  const sortedByT = messages.slice().sort((a, b) => (a.t || 0) - (b.t || 0));
  const out = [];
  let totalLen = 0;
  for (let i = sortedByT.length - 1; i >= 0; i--) {
    if (i === excludeIdx) continue;
    const m = sortedByT[i];
    if (!m || !m.from_me) continue;
    const body = (m.body || "").trim();
    if (!body) continue;
    if (body.length > 400) continue;
    out.unshift(body);
    totalLen += body.length;
    if (out.length >= maxSamples || totalLen >= maxTotalChars) break;
  }
  return out.map((b, i) => `${i + 1}. [USER → ${contactLabel}] "${b}"`).join("\n");
}

// Find the last meaningful (non-system, non-empty) message in chronological order.
// Returns { msg, idx } in the SORTED array (oldest → newest), or null.
function findLastMeaningful(sortedByT) {
  for (let i = sortedByT.length - 1; i >= 0; i--) {
    const m = sortedByT[i];
    if (!m) continue;
    const sysTypes = new Set(["e2e_notification", "gp2", "notification", "notification_template", "protocol", "group_notification"]);
    if (m.type && sysTypes.has(m.type)) continue;
    const hasContent = (m.body && m.body.trim()) || m.has_media;
    if (!hasContent) continue;
    return { msg: m, idx: i };
  }
  return null;
}

// Build "previous context" — every meaningful message EXCEPT the target.
// Uses the same SENDER → RECEIVER notation as buildTranscript so direction
// is impossible to confuse.
function buildContextExcluding(sortedByT, excludeIdx, approxMax = 6000, contactLabel = "CONTACT") {
  const lines = [];
  for (let i = 0; i < sortedByT.length; i++) {
    if (i === excludeIdx) continue;
    const m = sortedByT[i];
    if (!m) continue;
    const t = m.type || "chat";
    if (TYPE_LABELS[t] === null) continue;
    const isUser = !!m.from_me;
    const direction = isUser ? `USER → ${contactLabel}` : `${contactLabel} → USER`;
    const when = formatRelativeOrAbsolute(m.t);
    let body = (m.body || "").trim();
    if (!body) {
      const lbl = TYPE_LABELS[t];
      if (lbl) body = lbl; else continue;
    }
    lines.push(`(${when}) [${direction}]: ${body}`);
  }
  let txt = lines.join("\n");
  if (txt.length > approxMax) {
    txt = "[…önceki mesajlar kısaltıldı…]\n" + txt.slice(-(approxMax - 30));
  }
  return txt;
}

export async function suggestFollowups({ provider, apiKey, baseUrl, model, messages, chatName, instructions }) {
  const sortedByT = messages.slice().sort((a, b) => (a.t || 0) - (b.t || 0));
  const last = findLastMeaningful(sortedByT);
  if (!last) throw new Error("Bu sohbet için yeterli metin mesajı bulunamadı.");

  const lastIsMine = !!last.msg.from_me;
  const targetSender = lastIsMine ? "Ben" : (last.msg.sender_name || last.msg.sender_phone || "Karşı taraf");
  const targetBody = (last.msg.body && last.msg.body.trim())
    || (last.msg.type ? `[${last.msg.type}]` : "(boş)");

  // Build the "previous context" = everything EXCEPT the target message.
  const contextBlock = buildContextExcluding(sortedByT, last.idx);

  // Voice samples: kullanıcının bu sohbetteki kendi gönderilen mesajları.
  // Reminder modunda hedef mesajın kendisi de "Ben"den, onu üslup örneği
  // olarak göstermesin diye excludeIdx ile çıkar.
  const voiceSamples = extractVoiceSamples(messages, {
    maxSamples: 12, maxTotalChars: 2500,
    excludeIdx: lastIsMine ? last.idx : -1,
  });

  const system = lastIsMine ? SYSTEMS.followupReminder : SYSTEMS.followups;
  const prompt = lastIsMine
    ? PROMPTS.followupReminder(voiceSamples, contextBlock, targetBody, chatName, instructions)
    : PROMPTS.followups(voiceSamples, contextBlock, targetSender, targetBody, chatName, instructions);

  const res = await callProvider({
    provider, apiKey, baseUrl, model,
    system, prompt,
    maxTokens: 700,
    temperature: 0.7,
  });
  return {
    ...res,
    mode: lastIsMine ? "reminder" : "reply",
    target: { sender: targetSender, body: targetBody, fromMe: lastIsMine, t: last.msg.t },
  };
}

// ---------------- Triage helpers (hibrit: kural + AI) ----------------------

// User-facing display name for a chat — same priority as csv.pickDisplayName.
function chatDisplayName(c) {
  return c.contactName || c.formattedName || c.verifiedName || c.name || c.formattedTitle || c.pushName || c.phone || c.id || "(?)";
}

// Phone-last-4 disambiguator: "•••12". Falls back to lid-last-4 or chat_id-last-6.
export function disambiguator(c) {
  if (c.phone) {
    const digits = String(c.phone).replace(/[^\d]/g, "");
    if (digits.length >= 2) return "•••" + digits.slice(-4).padStart(4, "•").slice(-4);
  }
  if (c.lidUser) {
    const d = String(c.lidUser).replace(/[^\d]/g, "");
    if (d.length >= 2) return "lid•" + d.slice(-4).padStart(4, "•").slice(-4);
  }
  if (c.id) {
    const tail = String(c.id).replace(/[^a-zA-Z0-9]/g, "").slice(-6);
    if (tail) return "id•" + tail;
  }
  return "?";
}

// Deterministic rule-based score. Higher = more urgent.
const QUESTION_WORDS = /\?|\bm[ıiuü]\b|\bka[çc]ta\b|\bka[çc]\b|\bnasil\b|\bnas[ıi]l\b|\bne zaman\b/i;

export function scoreChat(c) {
  let score = 0;
  const unread = typeof c.unreadCount === "number" ? c.unreadCount : 0;
  score += unread * 10;

  const lm = c.lastMessage;
  const ts = (lm && typeof lm.t === "number" ? lm.t : null) || (typeof c.t === "number" ? c.t : null);
  const fromMe = !!(lm && lm.fromMe);
  const body = (lm && lm.body) || "";

  if (lm && !fromMe) score += 5;
  if (body && QUESTION_WORDS.test(body)) score += 3;

  if (ts) {
    const ageMin = (Date.now() / 1000 - ts) / 60;
    if (ageMin < 60) score += 4;
    else if (ageMin < 24 * 60) score += 2;
    else if (ageMin > 7 * 24 * 60) score -= 5;
  } else {
    score -= 5; // tarihsiz
  }

  if (c.pinned) score += 6;
  if (c.muteExpiration && c.muteExpiration > Date.now() / 1000) score -= 3;
  if (c.archived) score -= 8;
  if (c.isGroup) score -= 2;
  if (fromMe) score -= 1; // last message was yours; less urgent

  return score;
}

export function scoreAndRankChats(chats) {
  const scored = chats.map((c) => ({ chat: c, score: scoreChat(c) }));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// Build the AI input. One line per chat, all data the model needs.
// Format: "N. NAME (•••XX) | when | sender | body"
function buildTriageInput(rankedRows) {
  return rankedRows.map(({ chat: c }, i) => {
    const name = chatDisplayName(c).replace(/\|/g, "/");
    const dis = disambiguator(c);
    const lm = c.lastMessage;
    const ts = (lm && lm.t) || c.t;
    const when = formatRelativeOrAbsolute(ts);
    const sender = lm ? (lm.fromMe ? "BEN_GÖNDERDİM" : "KARŞI_TARAF") : "—";
    const body = lm && lm.body ? lm.body.slice(0, 120).replace(/\s+/g, " ") : "(boş)";
    const unread = c.unreadCount ? `, ${c.unreadCount} okunmamış` : "";
    const tags = [];
    if (c.pinned) tags.push("📌");
    if (c.isGroup) tags.push("GRUP");
    const tagPart = tags.length ? " " + tags.join(" ") : "";
    return `${i + 1}. ${name} (${dis})${tagPart} | ${when}${unread} | ${sender}: ${body}`;
  }).join("\n");
}

// Parse AI output. Each line should look like:
//   "1. NAME (•••XX) — gerekçe"
// Match against the input chats; if name+disambig found, mark verified.
// If a line can't be parsed or doesn't match, keep raw with verified=false.
const TRIAGE_LINE_RE = /^\s*(\d+)\.\s*(.+?)\s*\(([^)]+)\)\s*[—–-]+\s*(.+?)\s*$/;

export function parseTriageOutput(text, rankedRows) {
  if (!text) return { rows: [], stats: { verified: 0, unmatched: 0, total: 0 } };
  // Build lookup: "name|disambig" -> chat
  const map = new Map();
  for (const { chat } of rankedRows) {
    const key = (chatDisplayName(chat) + "|" + disambiguator(chat)).toLowerCase();
    map.set(key, chat);
  }
  // Also a name-only fallback (case-insensitive). If a name appears multiple
  // times, this set lets us know it's ambiguous and we'll require disambig.
  const nameOnly = new Map();
  for (const { chat } of rankedRows) {
    const k = chatDisplayName(chat).toLowerCase();
    if (!nameOnly.has(k)) nameOnly.set(k, []);
    nameOnly.get(k).push(chat);
  }

  const rows = [];
  let verified = 0, unmatched = 0;
  const seenChatIds = new Set();

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(TRIAGE_LINE_RE);
    if (!m) {
      // Not a numbered line — skip silently (introductions, blank lines, etc.)
      continue;
    }
    const [, , name, dis, reason] = m;
    const fullKey = (name.trim() + "|(" + dis.trim() + ")").toLowerCase().replace(/\(\(/g, "(");
    let chat = null;
    // 1. Exact name + exact disambig match
    const exact = map.get((name.trim() + "|" + dis.trim()).toLowerCase());
    if (exact) chat = exact;
    // 2. Fallback: name match if unambiguous
    if (!chat) {
      const candidates = nameOnly.get(name.trim().toLowerCase()) || [];
      if (candidates.length === 1) chat = candidates[0];
    }
    if (chat && !seenChatIds.has(chat.id)) {
      seenChatIds.add(chat.id);
      rows.push({ chat, name: name.trim(), disambig: dis.trim(), reason: reason.trim(), verified: true });
      verified++;
    } else {
      rows.push({ chat: null, name: name.trim(), disambig: dis.trim(), reason: reason.trim(), rawLine: line.trim(), verified: false });
      unmatched++;
    }
  }
  return { rows, stats: { verified, unmatched, total: rows.length } };
}

export async function triageChats({ provider, apiKey, baseUrl, model, chats }) {
  const ranked = scoreAndRankChats(chats).slice(0, 30);
  const inputText = buildTriageInput(ranked);
  const aiRes = await callProvider({
    provider, apiKey, baseUrl, model,
    system: SYSTEMS.triage,
    prompt: PROMPTS.triage(inputText),
    maxTokens: 1500,
    temperature: 0.2,
  });
  const parsed = parseTriageOutput(aiRes.text, ranked);
  return { ...aiRes, ranked, parsed, inputText };
}

// Single-suggestion iterative API. Returns one mesaj. Caller can call again
// with `previousAttempts` to get a different one, or `userFeedback` to steer.
export async function suggestOne({ provider, apiKey, baseUrl, model, messages, chatName, instructions, previousAttempts = [], userFeedback = "" }) {
  const contactLabel = chatName || "CONTACT";
  const sortedByT = messages.slice().sort((a, b) => (a.t || 0) - (b.t || 0));
  const last = findLastMeaningful(sortedByT);
  if (!last) throw new Error("Bu sohbet için yeterli metin mesajı bulunamadı.");
  const lastIsMine = !!last.msg.from_me;
  const targetSender = lastIsMine ? "USER" : contactLabel;
  const targetBody = (last.msg.body && last.msg.body.trim()) || (last.msg.type ? `[${last.msg.type}]` : "(boş)");
  const contextBlock = buildContextExcluding(sortedByT, last.idx, 6000, contactLabel);
  const voiceSamples = extractVoiceSamples(messages, {
    maxSamples: 12, maxTotalChars: 2500,
    excludeIdx: lastIsMine ? last.idx : -1,
    contactLabel,
  });
  const res = await callProvider({
    provider, apiKey, baseUrl, model,
    system: SYSTEMS.singleFollowup,
    prompt: PROMPTS.singleFollowup({
      voiceSamples, contextBlock, targetSender, targetBody,
      isReminder: lastIsMine, chatName, instructions,
      previousAttempts, userFeedback,
    }),
    maxTokens: 300,
    // Higher temperature when we already have rejected attempts to encourage divergence
    temperature: previousAttempts.length > 0 ? 0.85 : 0.55,
  });
  return {
    ...res,
    mode: lastIsMine ? "reminder" : "reply",
    target: { sender: targetSender, body: targetBody, fromMe: lastIsMine, t: last.msg.t },
    suggestion: (res.text || "").trim(),
  };
}

export async function draftAutoReply({ provider, apiKey, baseUrl, model, messages, lastIncoming, chatName, instructions }) {
  const contactLabel = chatName || "CONTACT";
  const transcript = buildTranscript(messages, 8000, contactLabel);
  const voiceSamples = extractVoiceSamples(messages, { maxSamples: 12, maxTotalChars: 2500, contactLabel });
  return callProvider({
    provider, apiKey, baseUrl, model,
    system: SYSTEMS.autoReply,
    prompt: PROMPTS.autoReply(voiceSamples, transcript, lastIncoming, chatName, instructions),
    maxTokens: 300,
    temperature: 0.5,
  });
}

// Quick health check — ping the configured provider with a tiny prompt.
export async function pingProvider({ provider, apiKey, baseUrl, model }) {
  const start = Date.now();
  try {
    const res = await callProvider({
      provider, apiKey, baseUrl, model,
      system: "You answer with a single token.",
      prompt: "Reply with just 'OK'.",
      maxTokens: 10,
      temperature: 0,
    });
    return { ok: true, ms: Date.now() - start, sample: (res.text || "").trim().slice(0, 40) };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: err.message || String(err) };
  }
}
