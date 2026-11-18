import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { renderIcon } from '../tools/make-icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Normalize CRLF: git autocrlf on Windows rewrites the working copy when switching branches.
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// Minimal PNG reader for the files make-icons.mjs writes: RGBA 8-bit, filter byte 0 on every row.
function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, 'profundidade de bits');
      assert.equal(data[9], 6, 'RGBA');
    } else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const rowLen = 1 + width * 4;
  assert.equal(raw.length, rowLen * height, 'tamanho dos dados');
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * rowLen], 0, 'filtro 0 em todas as linhas');
    raw.copy(rgba, y * width * 4, y * rowLen + 1, (y + 1) * rowLen);
  }
  return { width, height, rgba };
}

test('styles: shared vocabulary is defined', () => {
  const css = read('styles.css');
  const selectors = [
    '.screen', '.topbar', '.title', '.subtitle', '.muted', '.small', '.big-number',
    '.stack', '.row', '.card', '.card.current', '.list', '.list-item',
    '.btn', '.btn-primary', '.btn-big', '.btn-ghost', '.btn-danger', '.btn-icon',
    '.bottom-bar', '.stepper', '.stepper-value', '.chips', '.chip', '.chip.selected',
    '.badge', '.badge-calibracao', '.badge-adaptacao', '.badge-base', '.badge-pr',
    '.timer', '.timer.done', '.banner', '.notice', '.field',
    '.set-row', '.set-row.warmup', '.set-row.ramp',
  ];
  for (const s of selectors) {
    assert.ok(css.includes(s), `styles.css sem o seletor ${s}`);
  }
  assert.ok(css.includes('overscroll-behavior-y'), 'sem overscroll-behavior-y');
  assert.ok(css.includes('min-height: 48px'), 'sem min-height: 48px');
});

test('manifest: install identity and icons', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  // The origin identity of the installed app never changes (it ties the phone's data to the app).
  assert.equal(m.id, 'academia');
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.lang, 'pt-BR');
  assert.equal(m.name, 'Progride');
  assert.equal(m.short_name, 'Progride');
  const any = m.icons.filter((i) => i.purpose === 'any');
  const maskable = m.icons.filter((i) => i.purpose === 'maskable');
  assert.equal(any.length, 2, 'dois icones any');
  assert.equal(maskable.length, 2, 'dois icones maskable');
  assert.deepEqual(any.map((i) => i.sizes).sort(), ['192x192', '512x512']);
  assert.deepEqual(maskable.map((i) => i.sizes).sort(), ['192x192', '512x512']);
  for (const icon of m.icons) {
    assert.ok(!/\s/.test(icon.purpose), `purpose nao pode combinar valores: "${icon.purpose}"`);
  }
  for (const mk of maskable) {
    assert.ok(!any.some((a) => a.src === mk.src), `maskable reutiliza o icone any: ${mk.src}`);
  }
  const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (const icon of m.icons) {
    assert.ok(!icon.src.startsWith('/') && !icon.src.includes('://'), `src nao relativo: ${icon.src}`);
    const file = join(ROOT, icon.src);
    assert.ok(existsSync(file), `icone ausente: ${icon.src}`);
    const buf = readFileSync(file);
    assert.ok(buf.subarray(0, 8).equals(SIG), `${icon.src} nao e PNG`);
    const [w, h] = icon.sizes.split('x').map(Number);
    assert.equal(buf.readUInt32BE(16), w, `largura de ${icon.src}`);
    assert.equal(buf.readUInt32BE(20), h, `altura de ${icon.src}`);
  }
});

test('icons: committed PNGs match the generator; maskable art stays in the safe zone', () => {
  for (const [file, kind] of [['icons/icon-512.png', 'any'], ['icons/maskable-512.png', 'maskable']]) {
    const png = decodePng(readFileSync(join(ROOT, file)));
    assert.equal(png.width, 512);
    assert.equal(png.height, 512);
    assert.ok(png.rgba.equals(renderIcon(512, kind)), `${file} nao bate com tools/make-icons.mjs (rode: node tools/make-icons.mjs)`);
  }
  const size = 512;
  const m = renderIcon(size, 'maskable');
  let accent = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      assert.equal(m[i + 3], 255, 'maskable e opaco (sem transparencia)');
      if (m[i] !== 0 || m[i + 1] !== 0 || m[i + 2] !== 0) {
        const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
        assert.ok(d <= 0.4 * size, `pixel fora da zona segura em (${x},${y})`);
      }
      if (m[i + 1] > 150) accent++;
    }
  }
  assert.ok(accent / (size * size) >= 0.03, 'arte muito pequena no maskable');

  const a = renderIcon(size, 'any');
  let minX = size; let minY = size; let maxX = -1; let maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (a[i] !== 0 || a[i + 1] !== 0 || a[i + 2] !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  assert.ok((maxX - minX + 1) / size >= 0.6, 'arte any estreita');
  assert.ok((maxY - minY + 1) / size >= 0.6, 'arte any baixa');
});

test('index.html and favicon carry the Progride identity', () => {
  const html = read('index.html');
  assert.ok(html.includes('<title>Progride</title>'));
  assert.ok(/<link rel="icon" href="\.\/icons\/icon\.svg"/.test(html), 'favicon svg');
  const svg = read('icons/icon.svg');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('viewBox'));
  assert.ok(!/<script/i.test(svg), 'svg sem script');
});

test('.nojekyll exists', () => {
  assert.ok(existsSync(join(ROOT, '.nojekyll')));
});

test('service worker: versioned precache, cache-first, no takeover', () => {
  const sw = read('sw.js');
  const ver = read('src/version.js').match(/APP_VERSION\s*=\s*'([^']+)'/)[1];
  assert.equal(sw.split('\n')[0], `const VERSION = '${ver}';`);
  assert.ok(sw.includes('// ASSETS-START') && sw.includes('// ASSETS-END'));
  for (const ev of ['install', 'activate', 'fetch']) {
    assert.ok(sw.includes(`addEventListener('${ev}'`), `sem listener ${ev}`);
  }
  assert.ok(!sw.includes('skipWaiting'), 'sw.js nao pode forcar ativacao');
  assert.ok(!sw.includes('clients.claim'), 'sw.js nao pode tomar clientes');
  const block = sw.split('// ASSETS-START')[1].split('// ASSETS-END')[0];
  const assets = [...block.matchAll(/'([^']+)'/g)].map((x) => x[1]);
  assert.ok(assets.includes('./styles.css') && assets.includes('./manifest.webmanifest'));
  for (const a of assets) {
    const rel = a === './' ? 'index.html' : a.replace(/^\.\//, '');
    assert.ok(existsSync(join(ROOT, rel)), `asset listado nao existe: ${a}`);
  }
  for (const bad of ['tools/', 'test/', '.planning', '.claude', 'package.json']) {
    assert.ok(!assets.some((a) => a.includes(bad)), `nao pode precachear ${bad}`);
  }
});
