# Demo Video Çıktıları

Bu klasör otomatik üretilen demo videolarını içerir. **Git'e commit edilmez** —
dosya çok büyük olduğu için `.gitignore` üzerinden hariç tutulur.
Yeniden üretmek için:

```bash
npm run build               # dist/ güncel olmalı
node scripts/record-demo.mjs
```

## Dosyalar

| Dosya | Boyut | Süre | Çözünürlük |
|---|:---:|:---:|:---:|
| `demo-90s.mp4` | ~6 MB | 92 sn | 1920×1080 30fps |
| (kopyası) | | | |
| `landing/assets/demo.mp4` | ~6 MB | 92 sn | 1920×1080 30fps |

## Pipeline

```
Playwright Chromium (headless, recordVideo: 1920×1080)
   │
   ├── 1920×1080 wrapper sayfa (Bluedev brand zemin)
   ├── Popup iframe — chrome.* mock'lu, demo data ile dolu
   ├── 7 sahne storyboard (~92 sn):
   │     1. Hook (5s)              → "WA Contacts Exporter" hero
   │     2. Sohbetler (12s)        → tab + Çıkar + preview
   │     3. Mesajlar (12s)         → tab + dropdown + Çıkar
   │     4. AI sağlayıcı (18s)     → AI tab + provider settings
   │     5. İteratif öneri (18s)   → suggestion card + Yenile/Düzelt
   │     6. Otomatik cevap (15s)   → autoreply + bekleyen taslak
   │     7. Outro (5s)             → CTA URL
   ├── Sentetik cursor (smooth easing)
   ├── Click pulse animation (radial)
   ├── Element highlight (mavi outline)
   └── Caption banner (fade in/out)
   │
   ▼
Raw WebM (VP8)
   │
   ▼
ffmpeg (H.264, yuv420p, crf 23, -ss 2 trim, scale lanczos, fade in)
   │
   ▼
demo-90s.mp4
```

## Yayınlama

- **YouTube unlisted**: title "WA Contacts Exporter — Demo · Bluedev"
- **Landing page**: `<video src="./assets/demo.mp4" controls>` etiketi ile embed
- **Twitter/LinkedIn post**: gif'e dönüştür (ffmpeg ile aynı script ucu eklenebilir)
