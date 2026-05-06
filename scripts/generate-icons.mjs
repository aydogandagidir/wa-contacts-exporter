import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const svgPath = resolve(root, "icons/source.svg");
const sizes = [16, 48, 128];

const svg = await readFile(svgPath);

for (const size of sizes) {
  const out = resolve(root, `icons/icon${size}.png`);
  const png = await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(out, png);
  console.log(`✓ icons/icon${size}.png (${png.length} bytes)`);
}
