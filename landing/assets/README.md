# Landing page assets

Bu klasör landing page'in görsellerini içerir. **Henüz hiçbiri yok** — manuel
olarak üretilmesi gerekiyor.

## Beklenen yapı

```
landing/assets/
├── screenshots/                  # docs/screenshots/'tan kopyalanacak
│   ├── 01_sohbetler_tab.png      # 1280×800 PNG
│   ├── 02_mesajlar_tab.png       # 1280×800 PNG
│   ├── 03_ai_provider.png        # 1280×800 PNG
│   ├── 04_ai_suggestion.png      # 1280×800 PNG
│   └── 05_oto_cevap.png          # 1280×800 PNG
├── social-banner.png             # 1200×630 (Open Graph share preview)
├── demo-90s.mp4                  # opsiyonel: direct video embed
└── hero-illustration.svg         # opsiyonel: hero görseli
```

## Üretim adımları

### 1. Screenshots (önce bunlar)

`docs/screenshots/README.md` dosyasındaki rehbere göre 5 adet 1280×800 PNG çek.
Bittiğinde:

```bash
cp docs/screenshots/0*.png landing/assets/screenshots/
```

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
