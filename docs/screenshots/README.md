# Screenshots — WA Contacts Exporter

Locale-aware Chrome Web Store screenshots, **1280×800 PNG**, 5 per locale.
Generated automatically from the bundled popup via Playwright + Sharp.

## Layout

```
docs/screenshots/
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

The same set is mirrored under `landing/assets/screenshots/{en,tr}/` for the
marketing site.

## What each shot shows

Both locales follow the same scenario sequence:

| # | Scenario              | EN file                  | TR file                    |
|---|-----------------------|--------------------------|----------------------------|
| 1 | Chats tab + extract   | `01_chats_tab.png`       | `01_sohbetler_tab.png`     |
| 2 | Messages tab + extract| `02_messages_tab.png`    | `02_mesajlar_tab.png`      |
| 3 | AI provider panel     | `03_ai_provider.png`     | `03_ai_provider.png`       |
| 4 | AI suggestion card    | `04_ai_suggestion.png`   | `04_ai_suggestion.png`     |
| 5 | Auto-reply pending    | `05_auto_reply.png`      | `05_oto_cevap.png`         |

Each PNG is a 1280×800 brand canvas: popup column on the left (380×720
scaled, with a soft shadow), marketing copy on the right (subhead,
heading, body, source URL), brand badge top-right (`WA Contacts Exporter
· v1.0.0 · Bluedev`).

## How to regenerate

```bash
# Both locales (default)
npm run build
node scripts/take-screenshots.mjs

# One locale only
node scripts/take-screenshots.mjs --locale=en
node scripts/take-screenshots.mjs --locale=tr

# Keep raw popup captures for debugging
node scripts/take-screenshots.mjs --keep-tmp
```

The generator:

1. Builds `dist/` (must be fresh — run `npm run build` first).
2. Spins up a static server on port 5174 serving `dist/`.
3. Launches Playwright Chromium (headless) and stubs `chrome.*` APIs with
   pre-seeded demo data and `wa_ui_locale` set to the chosen locale —
   forcing the popup to render in EN or TR regardless of the headless
   browser's UI language.
4. Walks each scenario, captures the popup at 380×1100 retina, then
   composites onto the brand canvas via Sharp.
5. Writes to both `docs/screenshots/{locale}/` and
   `landing/assets/screenshots/{locale}/`, then removes any legacy flat
   `0X_*.png` files from those parents.

## Demo data

All chat names, phone numbers, and message bodies are synthetic and
include the word "Demo" so they are obviously not real personal data.

| Field            | EN                                                  | TR                                                  |
|------------------|-----------------------------------------------------|-----------------------------------------------------|
| Chat names       | Alex Demo Smith, Emma Demo Johnson, …               | Ahmet Demo Yıldız, Ayşe Demo Çelik, …               |
| Group names      | Bluedev Demo Group, Team Demo Channel               | Bluedev Demo Grubu, Ekip Demo Sohbeti               |
| Phone format     | `+1 555 010 000X`                                   | `+90 555 010 000X`                                  |
| Labels           | Customer, On hold, Completed                        | Müşteri, Beklemede, Tamamlandı                      |
| AI suggestion    | "Hi Alex — yes, 10am works…"                        | "Merhaba Ahmet Bey, evet toplantı 10:00'da kalıyor…"|

## CWS submission

For the CWS listing upload **5 PNGs per locale**:

- EN listing → `docs/screenshots/en/0[1-5]_*.png`
- TR listing → `docs/screenshots/tr/0[1-5]_*.png`

CWS accepts a separate screenshot set per language, so each storefront
gets the locale-appropriate UI.

## Promotional images (CWS bonus)

CWS optionally takes a small + large tile + marquee:

| Image       | Size         | Use                              |
|-------------|--------------|----------------------------------|
| Small tile  | 440×280 PNG  | Search-results small thumbnail   |
| Large tile  | 920×680 PNG  | Detail-page header               |
| Marquee     | 1400×560 PNG | Featured listing (optional)      |

These are produced separately under `docs/promotional/`.
