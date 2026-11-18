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
