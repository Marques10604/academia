import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

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
  assert.equal(m.id, 'academia');
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.lang, 'pt-BR');
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'), 'sem icone maskable');
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

test('.nojekyll exists', () => {
  assert.ok(existsSync(join(ROOT, '.nojekyll')));
});
