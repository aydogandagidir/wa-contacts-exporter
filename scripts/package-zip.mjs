import { createWriteStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, join } from "node:path";
import { createDeflateRaw } from "node:zlib";
import { Buffer } from "node:buffer";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const distDir = resolve(root, "dist");
const pkgJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const outZip = resolve(root, `${pkgJson.name}-${pkgJson.version}.zip`);

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function deflateRaw(buf) {
  return new Promise((resolveP, reject) => {
    const z = createDeflateRaw({ level: 9 });
    const chunks = [];
    z.on("data", (c) => chunks.push(c));
    z.on("end", () => resolveP(Buffer.concat(chunks)));
    z.on("error", reject);
    z.end(buf);
  });
}

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const entries = [];
const localChunks = [];
let offset = 0;

for await (const file of walk(distDir)) {
  const rel = relative(distDir, file).replaceAll("\\", "/");
  const data = await readFile(file);
  const compressed = await deflateRaw(data);
  const nameBuf = Buffer.from(rel, "utf8");
  const crc = crc32(data);

  const local = Buffer.alloc(30 + nameBuf.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  nameBuf.copy(local, 30);

  localChunks.push(local, compressed);
  entries.push({ rel, nameBuf, crc, compSize: compressed.length, size: data.length, offset });
  offset += local.length + compressed.length;
}

const centralChunks = [];
let centralSize = 0;
for (const e of entries) {
  const cd = Buffer.alloc(46 + e.nameBuf.length);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 8);
  cd.writeUInt16LE(8, 10);
  cd.writeUInt16LE(0, 12);
  cd.writeUInt16LE(0, 14);
  cd.writeUInt32LE(e.crc, 16);
  cd.writeUInt32LE(e.compSize, 20);
  cd.writeUInt32LE(e.size, 24);
  cd.writeUInt16LE(e.nameBuf.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt16LE(0, 36);
  cd.writeUInt32LE(0, 38);
  cd.writeUInt32LE(e.offset, 42);
  e.nameBuf.copy(cd, 46);
  centralChunks.push(cd);
  centralSize += cd.length;
}

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(entries.length, 8);
eocd.writeUInt16LE(entries.length, 10);
eocd.writeUInt32LE(centralSize, 12);
eocd.writeUInt32LE(offset, 16);
eocd.writeUInt16LE(0, 20);

const out = createWriteStream(outZip);
for (const c of localChunks) out.write(c);
for (const c of centralChunks) out.write(c);
out.write(eocd);
out.end();

console.log(`✓ ${outZip} (${entries.length} files)`);
