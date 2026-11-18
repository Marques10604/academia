// Dev only: gera icons/icon-192.png e icons/icon-512.png (provisorios).
// Uso: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const BG = [0x00, 0x00, 0x00];
const FG = [0x22, 0xc5, 0x5e];

// Halteres centralizado dentro de 60% do quadrado (seguro para icone maskable).
// Coordenadas em fracoes do lado: [x0, y0, x1, y1]
const RECTS = [
  [0.22, 0.47, 0.78, 0.53], // barra
  [0.22, 0.36, 0.30, 0.64], // anilha esquerda interna
  [0.70, 0.36, 0.78, 0.64], // anilha direita interna
  [0.31, 0.42, 0.36, 0.58], // anilha esquerda externa
  [0.64, 0.42, 0.69, 0.58], // anilha direita externa
];

function makePng(size) {
  const rowLen = 1 + size * 4;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filtro 0
    for (let x = 0; x < size; x++) {
      const fx = (x + 0.5) / size;
      const fy = (y + 0.5) / size;
      const on = RECTS.some(([x0, y0, x1, y1]) => fx >= x0 && fx < x1 && fy >= y0 && fy < y1);
      const [r, g, b] = on ? FG : BG;
      const i = y * rowLen + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(join(ROOT, 'icons'), { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(ROOT, 'icons', `icon-${size}.png`), makePng(size));
  console.log(`icons/icon-${size}.png`);
}
