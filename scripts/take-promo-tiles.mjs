// take-promo-tiles.mjs — Chrome Web Store promotional tiles.
//
// Generates the three CWS-spec promotional images:
//   - 440x280  (small tile, required for search results)
//   - 920x680  (large tile, recommended for detail page)
//   - 1400x560 (marquee, optional for featured listing)
//
// All tiles share the same Bluedev brand language used in screenshots
// and demo video — gradient background, bluedev wordmark, WA mark,
// product title, tagline, BETA pill.

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const OUT = path.join(ROOT, "docs", "promotional");
const OUT_LANDING = path.join(ROOT, "landing", "assets", "promo");

const TILES = [
  { name: "small-tile-440x280",  w: 440,  h: 280  },
  { name: "large-tile-920x680",  w: 920,  h: 680  },
  { name: "marquee-1400x560",    w: 1400, h: 560  },
];

const COLORS = {
  primary: "#015AFF",
  primaryDark: "#0143C4",
  text: "#1F2937",
  muted: "#6B7280",
  bg1: "#E8F0FF",
  bg2: "#F8FAFC",
  bg3: "#FFF4E6",
  white: "#FFFFFF",
};

// Each tile gets its own layout. Helper: scale fonts/marks proportionally.

function buildSvg({ w, h, style }) {
  if (style === "small") return smallTile(w, h);
  if (style === "large") return largeTile(w, h);
  if (style === "marquee") return marqueeTile(w, h);
  throw new Error("unknown style " + style);
}

// ──────────────── 440×280 (small) ────────────────
// Compact: bluedev top-left, WA mark center-left, title + tagline right,
// BETA pill bottom-right.

function smallTile(w, h) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  ${gradientDefs(w, h)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- bluedev wordmark top-left -->
  <g transform="translate(20, 20)">
    <text x="0" y="22"
          font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-weight="900" font-size="26" letter-spacing="-1.5">
      <tspan fill="${COLORS.primary}">blue</tspan><tspan fill="${COLORS.text}">dev</tspan>
    </text>
  </g>

  <!-- WA mark + title group -->
  <g transform="translate(20, 90)">
    <rect x="0" y="0" width="64" height="64" rx="14" fill="${COLORS.primary}"/>
    <text x="32" y="44"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="900" font-size="26" fill="${COLORS.white}"
          text-anchor="middle" letter-spacing="-1">WA</text>
    <text x="80" y="26"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="800" font-size="22" fill="${COLORS.text}"
          letter-spacing="-0.6">Contacts Exporter</text>
    <text x="80" y="48"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="500" font-size="13" fill="${COLORS.muted}">
      WhatsApp Web Export + AI
    </text>
  </g>

  <!-- BETA pill bottom-right -->
  <g transform="translate(${w - 90}, ${h - 35})">
    <rect x="0" y="0" width="70" height="22" rx="11"
          fill="rgba(1, 90, 255, 0.12)" stroke="${COLORS.primary}" stroke-opacity="0.3"/>
    <text x="35" y="15"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="800" font-size="11" fill="${COLORS.primary}"
          text-anchor="middle" letter-spacing="2">BETA</text>
  </g>

  <!-- bluedev.dev URL bottom-left -->
  <text x="20" y="${h - 18}"
        font-family="-apple-system, Segoe UI, sans-serif"
        font-weight="600" font-size="11" fill="${COLORS.muted}"
        letter-spacing="0.5">bluedev.dev</text>
</svg>`;
}

// ──────────────── 920×680 (large) ────────────────
// More room: full feature list, prominent CTA-style title.

function largeTile(w, h) {
  const features = [
    "📤  CSV / XLSX / VCard dışa aktarma",
    "🤖  6 AI sağlayıcı (yerel veya bulut)",
    "🔒  KVKK uyumlu — veri yerelde",
    "💬  İteratif cevap önerisi",
    "⚡  Otomatik cevap (taslak modu)",
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  ${gradientDefs(w, h)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- bluedev wordmark top-left -->
  <g transform="translate(48, 48)">
    <text x="0" y="38"
          font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-weight="900" font-size="44" letter-spacing="-2.5">
      <tspan fill="${COLORS.primary}">blue</tspan><tspan fill="${COLORS.text}">dev</tspan>
    </text>
  </g>

  <!-- BETA pill top-right -->
  <g transform="translate(${w - 130}, 60)">
    <rect x="0" y="0" width="100" height="34" rx="17"
          fill="rgba(1, 90, 255, 0.12)" stroke="${COLORS.primary}" stroke-opacity="0.3"/>
    <text x="50" y="22"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="800" font-size="14" fill="${COLORS.primary}"
          text-anchor="middle" letter-spacing="3">BETA</text>
  </g>

  <!-- Hero: WA mark + title -->
  <g transform="translate(48, 200)">
    <rect x="0" y="0" width="120" height="120" rx="26" fill="${COLORS.primary}"/>
    <text x="60" y="82"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="900" font-size="50" fill="${COLORS.white}"
          text-anchor="middle" letter-spacing="-1.5">WA</text>
  </g>

  <g transform="translate(200, 215)">
    <text x="0" y="0"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="900" font-size="56" fill="${COLORS.text}"
          letter-spacing="-2">Contacts Exporter</text>
    <text x="0" y="42"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="500" font-size="22" fill="${COLORS.muted}">
      WhatsApp Web Export + AI Asistan
    </text>
  </g>

  <!-- Feature list -->
  <g transform="translate(48, 400)">
    ${features.map((f, i) => `
    <text x="0" y="${i * 38}"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="500" font-size="20" fill="${COLORS.text}">${escapeXml(f)}</text>`).join("")}
  </g>

  <!-- Footer URL bottom-left -->
  <text x="48" y="${h - 32}"
        font-family="-apple-system, Segoe UI, sans-serif"
        font-weight="700" font-size="14" fill="${COLORS.muted}"
        letter-spacing="1">bluedev.dev/products/wa-contacts-exporter</text>
</svg>`;
}

// ──────────────── 1400×560 (marquee) ────────────────
// Wide horizontal: left = brand+title+tagline, right = feature row.

function marqueeTile(w, h) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  ${gradientDefs(w, h)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- bluedev wordmark top-left -->
  <g transform="translate(60, 50)">
    <text x="0" y="38"
          font-family="-apple-system, Segoe UI, Inter, sans-serif"
          font-weight="900" font-size="42" letter-spacing="-2.5">
      <tspan fill="${COLORS.primary}">blue</tspan><tspan fill="${COLORS.text}">dev</tspan>
    </text>
  </g>

  <!-- WA mark + main title (left side, vertically centered) -->
  <g transform="translate(60, 175)">
    <rect x="0" y="0" width="110" height="110" rx="24" fill="${COLORS.primary}"/>
    <text x="55" y="76"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="900" font-size="46" fill="${COLORS.white}"
          text-anchor="middle" letter-spacing="-1.5">WA</text>
  </g>

  <g transform="translate(200, 195)">
    <text x="0" y="0"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="900" font-size="64" fill="${COLORS.text}"
          letter-spacing="-2.5">Contacts Exporter</text>
    <text x="0" y="44"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="500" font-size="22" fill="${COLORS.muted}">
      WhatsApp Web Export + AI · Bluedev
    </text>
  </g>

  <!-- Right side feature column (centered vertically) -->
  <g transform="translate(820, 165)">
    <text x="0" y="0"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="800" font-size="13" fill="${COLORS.primary}"
          letter-spacing="3">ÖZELLİKLER</text>
    <text x="0" y="42"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="600" font-size="20" fill="${COLORS.text}">
      📤  CSV / XLSX / VCard tek tıkla
    </text>
    <text x="0" y="80"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="600" font-size="20" fill="${COLORS.text}">
      🤖  6 AI sağlayıcı — yerel veya bulut
    </text>
    <text x="0" y="118"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="600" font-size="20" fill="${COLORS.text}">
      🔒  KVKK uyumlu · Veri cihazda kalır
    </text>
    <text x="0" y="156"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="600" font-size="20" fill="${COLORS.text}">
      💬  İteratif cevap önerisi (Yenile / Düzelt)
    </text>
  </g>

  <!-- BETA pill top-right -->
  <g transform="translate(${w - 150}, 60)">
    <rect x="0" y="0" width="100" height="34" rx="17"
          fill="rgba(1, 90, 255, 0.12)" stroke="${COLORS.primary}" stroke-opacity="0.3"/>
    <text x="50" y="22"
          font-family="-apple-system, Segoe UI, sans-serif"
          font-weight="800" font-size="14" fill="${COLORS.primary}"
          text-anchor="middle" letter-spacing="3">BETA</text>
  </g>

  <!-- Footer URL bottom-left -->
  <text x="60" y="${h - 36}"
        font-family="-apple-system, Segoe UI, sans-serif"
        font-weight="700" font-size="14" fill="${COLORS.muted}"
        letter-spacing="1">bluedev.dev/products/wa-contacts-exporter</text>
</svg>`;
}

// ──────────────── Shared SVG helpers ────────────────

function gradientDefs(w, h) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.bg1}"/>
      <stop offset="55%" stop-color="${COLORS.bg2}"/>
      <stop offset="100%" stop-color="${COLORS.bg3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="35%" r="55%">
      <stop offset="0%" stop-color="${COLORS.primary}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${COLORS.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ──────────────── Main ────────────────

async function main() {
  console.log("🎨 WA Contacts Exporter — promotional tile generator\n");
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(OUT_LANDING, { recursive: true });

  for (const tile of TILES) {
    const style = tile.w === 440 ? "small" : tile.w === 920 ? "large" : "marquee";
    const svg = buildSvg({ w: tile.w, h: tile.h, style });
    const outPath = path.join(OUT, `${tile.name}.png`);
    const landingPath = path.join(OUT_LANDING, `${tile.name}.png`);

    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, palette: false })
      .toFile(outPath);
    await fs.copyFile(outPath, landingPath);

    const stat = await fs.stat(outPath);
    console.log(`  ✓ ${tile.name}.png  (${tile.w}×${tile.h}, ${(stat.size / 1024).toFixed(0)} KB)`);
  }

  console.log("\n✅ Done.");
  console.log(`   → ${path.relative(ROOT, OUT)}/`);
  console.log(`   → ${path.relative(ROOT, OUT_LANDING)}/`);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
