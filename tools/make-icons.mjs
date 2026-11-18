// Dev only: gera os icones do Progride (halter com seta para cima, verde sobre preto), sem dependencias.
// Uso: node tools/make-icons.mjs
// Escreve icons/icon-192.png, icon-512.png (purpose "any"), maskable-192.png, maskable-512.png (purpose "maskable")
// e icons/icon.svg (favicon). Importar este arquivo NAO escreve nada (so quando executado direto).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

// Arte numa caixa unitaria [0,1]x[0,1]: halter horizontal na parte de baixo e seta para cima saindo do meio da barra.
const ARTWORK = [
  { rect: [0.08, 0.70, 0.92, 0.80] }, // barra
  { rect: [0.16, 0.56, 0.28, 0.94] }, // anilha esquerda
  { rect: [0.72, 0.56, 0.84, 0.94] }, // anilha direita
  { rect: [0.06, 0.63, 0.16, 0.87] }, // ponta esquerda
  { rect: [0.84, 0.63, 0.94, 0.87] }, // ponta direita
  { rect: [0.43, 0.30, 0.57, 0.70] }, // haste da seta
  { tri: [[0.50, 0.04], [0.22, 0.36], [0.78, 0.36]] }, // ponta da seta
];

// Onde a caixa da arte fica dentro do icone: [offset, lado] em fracoes do lado do icone.
// 'any' usa 76% do icone; 'maskable' usa um quadrado de 56% centralizado, inscrito no circulo seguro de 80%.
const PLACEMENT = { any: [0.12, 0.76], maskable: [0.22, 0.56] };

function place(kind, [x, y]) {
  const [offset, side] = PLACEMENT[kind];
  return [offset + x * side, offset + y * side];
}

function inTriangle(px, py, [a, b, c]) {
  const sign = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const p = [px, py];
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function shapesFor(kind) {
  return ARTWORK.map((s) => (s.rect
    ? { rect: [...place(kind, [s.rect[0], s.rect[1]]), ...place(kind, [s.rect[2], s.rect[3]])] }
    : { tri: s.tri.map((p) => place(kind, p)) }));
}

const SS = 4; // 4x4 amostras por pixel

// RGBA (size*size*4). Opaco em todo o quadrado (sem transparencia, exigido pelo maskable).
export function renderIcon(size, kind) {
  const shapes = shapesFor(kind);
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hit = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + 0.5) / SS) / size;
          const fy = (y + (sy + 0.5) / SS) / size;
          const on = shapes.some((s) => (s.rect
            ? fx >= s.rect[0] && fx < s.rect[2] && fy >= s.rect[1] && fy < s.rect[3]
            : inTriangle(fx, fy, s.tri)));
          if (on) hit++;
        }
      }
      const c = hit / (SS * SS);
      const i = (y * size + x) * 4;
      for (let k = 0; k < 3; k++) out[i + k] = Math.round(BG[k] + (FG[k] - BG[k]) * c);
      out[i + 3] = 255;
    }
  }
  return out;
}

// PNG RGBA 8 bits, filtro 0 em cada linha.
export function encodePng(size, rgba) {
  const rowLen = 1 + size * 4;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0;
    rgba.copy(raw, y * rowLen + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Favicon: a mesma arte (posicao 'any') num SVG de 100x100 com cantos arredondados.
export function iconSvg() {
  const n = (v) => String(Math.round(v * 10000) / 100);
  const parts = shapesFor('any').map((s) => (s.rect
    ? `<rect x="${n(s.rect[0])}" y="${n(s.rect[1])}" width="${n(s.rect[2] - s.rect[0])}" height="${n(s.rect[3] - s.rect[1])}" fill="#22c55e"/>`
    : `<polygon points="${s.tri.map((p) => `${n(p[0])},${n(p[1])}`).join(' ')}" fill="#22c55e"/>`));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n<rect width="100" height="100" rx="20" fill="#000000"/>\n${parts.join('\n')}\n</svg>\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(join(ROOT, 'icons'), { recursive: true });
  const files = [
    ['icon-192.png', 192, 'any'],
    ['icon-512.png', 512, 'any'],
    ['maskable-192.png', 192, 'maskable'],
    ['maskable-512.png', 512, 'maskable'],
  ];
  for (const [name, size, kind] of files) {
    writeFileSync(join(ROOT, 'icons', name), encodePng(size, renderIcon(size, kind)));
    console.log(`icons/${name}`);
  }
  writeFileSync(join(ROOT, 'icons', 'icon.svg'), iconSvg());
  console.log('icons/icon.svg');
}
