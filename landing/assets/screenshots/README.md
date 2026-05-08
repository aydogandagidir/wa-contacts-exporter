# Landing screenshots

Mirror of `docs/screenshots/`, kept in sync by `scripts/take-screenshots.mjs`.

## Layout

```
landing/assets/screenshots/
├── README.md                ← this file
├── en/
│   ├── 01_chats_tab.png
│   ├── 02_messages_tab.png
│   ├── 03_ai_provider.png
│   ├── 04_ai_suggestion.png
│   └── 05_auto_reply.png
└── tr/
    ├── 01_sohbetler_tab.png
    ├── 02_mesajlar_tab.png
    ├── 03_ai_provider.png
    ├── 04_ai_suggestion.png
    └── 05_oto_cevap.png
```

The landing's `index.html` swaps these per-language: TR mode loads
`tr/…`, EN mode loads `en/…`. See `landing/i18n.js` for the swap logic.

## How to regenerate

From the repo root:

```bash
npm run build
node scripts/take-screenshots.mjs
```

This writes to `docs/screenshots/{en,tr}/` AND
`landing/assets/screenshots/{en,tr}/` in one pass. Run with
`--locale=en` or `--locale=tr` to regenerate just one set.

See `docs/screenshots/README.md` for full details.
