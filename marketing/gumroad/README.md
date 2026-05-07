# Gumroad Marketing Assets

This directory contains the source pipeline + final assets for the
**WA Contacts Exporter Pro** Gumroad listing.

## Final assets (in `out/`)

| File | Size | Purpose |
|---|---|---|
| `01-cover.png` | 1280×720 | Gumroad cover image |
| `02-thumbnail.png` | 600×600 | Custom square thumbnail |
| `03-comparison.png` | 1280×720 | Gallery: Free vs Pro pricing card |
| `04-hero.png` | 1280×720 | Gallery: 3-up superpowers showcase |
| `wa-contacts-pro-demo.mp4` | 1280×720 · 30fps · 67.7 s · H.264 · 4.3 MB | Demo video (no audio) |

These files are **committed to the repo** as historical snapshots of
what was uploaded to Gumroad. Regenerate them by running the pipeline
(see below).

## Source files

- `style.css` — shared brand system (colors, type, animations)
- `cover.html`, `thumbnail.html`, `comparison.html`, `hero.html` — 4 static graphic sources
- `scenes/01-brand-intro.html` … `scenes/08-cta.html` — 8 video scenes (CSS-animated, auto-play)
- `capture.mjs` — Playwright + ffmpeg pipeline runner

## Regenerating the assets

Prerequisites: Node 22+, `npx playwright install chromium` once, ffmpeg
available either on `PATH` or via `FFMPEG_PATH` env var.

```bash
# From the repo root:
FFMPEG_PATH="C:/Users/adagidir/ffmpeg/ffmpeg-8.0.1-essentials_build/bin/ffmpeg.exe" \
  node marketing/gumroad/capture.mjs
```

Output lands in `marketing/gumroad/out/`. Total runtime ≈ 90 seconds.

## Editing tips

- Want a different price (e.g. $19 or $39)? Search & replace `$29` in
  `cover.html`, `thumbnail.html`, `comparison.html`, `scenes/07-pricing.html`,
  and `scenes/08-cta.html`. Then re-run the pipeline.
- Want a different domain in the CTA? Edit the URL in `scenes/08-cta.html`.
- Want to swap a screenshot for a real captured one? Drop it under
  `scenes/0X-…html` as a `<img>` element, keep dimensions tight to the
  device frame.

## Storyboard (video)

| # | Scene | Duration |
|---|---|---|
| 01 | Brand intro | 4.5 s |
| 02 | Problem (locked WhatsApp UI) | 7.5 s |
| 03 | Solution reveal (3 pillars) | 6.5 s |
| 04 | Export demo | 9.5 s |
| 05 | AI demo + 6 providers | 11.5 s |
| 06 | Auto-reply with safety pills | 9.5 s |
| 07 | Privacy + Pricing | 11.5 s |
| 08 | CTA + URL + guarantees | 7.5 s |
| **Total** | | **67.5 s** |

## Notes

- `out/_scenes/` is gitignored — those are intermediate WebM/MP4 parts
  produced during the ffmpeg concat step (~30 MB). Pipeline regenerates
  them; no need to keep them in git.
- The 4 PNGs and the final MP4 are committed because they're what got
  uploaded to Gumroad. If you re-record, replace them and commit the
  new snapshot — diffs in PRs let reviewers see visual changes.
