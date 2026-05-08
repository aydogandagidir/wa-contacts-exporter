# Landing page assets

Bu klasör landing page'in görsellerini içerir. **Henüz hiçbiri yok** — manuel
olarak üretilmesi gerekiyor.

## Beklenen yapı

```
landing/assets/
├── screenshots/                       # generator tarafından üretilir
│   ├── en/
│   │   ├── 01_chats_tab.png           # 1280×800 PNG
│   │   ├── 02_messages_tab.png
│   │   ├── 03_ai_provider.png
│   │   ├── 04_ai_suggestion.png
│   │   └── 05_auto_reply.png
│   └── tr/
│       ├── 01_sohbetler_tab.png       # 1280×800 PNG
│       ├── 02_mesajlar_tab.png
│       ├── 03_ai_provider.png
│       ├── 04_ai_suggestion.png
│       └── 05_oto_cevap.png
├── social-banner.png                  # 1200×630 (Open Graph share preview)
├── demo-90s.mp4                       # opsiyonel: direct video embed
└── hero-illustration.svg              # opsiyonel: hero görseli
```

## Üretim adımları

### 1. Screenshots (önce bunlar)

Generator hem `docs/screenshots/` hem de `landing/assets/screenshots/`
altına yazıyor — tek komut:

```bash
npm run build
node scripts/take-screenshots.mjs        # her iki locale
node scripts/take-screenshots.mjs --locale=en   # sadece EN
node scripts/take-screenshots.mjs --locale=tr   # sadece TR
```

Detay: `docs/screenshots/README.md`

### 2. Social banner (Open Graph)

1200×630 PNG, Bluedev brand:
- Sol: WA brand mark (büyük, mavi #015AFF)
- Orta-sağ: "WhatsApp Web Export + AI" başlık
- Alt sağ: "bluedev.dev" + version badge
- Arka plan: hafif gradient (#015AFF → #0143C4)

Canva / Figma / Adobe Express ücretsiz template'leriyle 15 dakikada hazırlanabilir.

### 3. Demo video (opsiyonel)

`docs/video-script.md`'ye göre 90 sn'lik MP4. YouTube unlisted'e yüklenip
`<iframe>` ile embed etmek dosya boyutu açısından önerilir.

## Geçici durum

Henüz görseller yokken landing page açılırsa:
- `<img>` etiketleri broken-image gösterecek
- `video-placeholder` div'i fallback olarak görünür

Bu kabul edilebilir bir geçici durum (placeholder fallback'lar var). Gerçek
yayından önce tüm görsellerin yerinde olması gerekir.
