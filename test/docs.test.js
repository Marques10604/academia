// The guides (KIT-SOCORRO-IA.md, MANUAL.md) must not drift from the repository or from the app:
// every path they name exists and every app label they quote exists in src/ui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Normalize CRLF: git autocrlf on Windows rewrites the working copy when switching branches.
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const APP_URL = 'https://marques10604.github.io/academia/';
const ROOT_FILES = ['index.html', 'sw.js', 'styles.css', 'manifest.webmanifest', 'package.json', 'MANUAL.md', 'README.md', 'KIT-SOCORRO-IA.md'];

const SKIP = new Set(['MANUAL.md', 'README.md']); // created in Task 2

// Backticked tokens that look like repository paths.
function backtickedPaths(text) {
  const out = [];
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const t = m[1];
    if (t.includes('*') || /\s/.test(t)) continue;
    if (/^(src|tools|test|icons)\//.test(t) || ROOT_FILES.includes(t)) out.push(t);
  }
  return out;
}

// Plain "dir/file.ext" mentions (the file map inside the AI prompt is not backticked).
function plainPaths(text) {
  return [...text.matchAll(/\b((?:src|tools|test|icons)\/[A-Za-z0-9_./-]+\.(?:js|mjs|css|html|svg|png|webmanifest|json))\b/g)].map((m) => m[1]);
}

function assertPathsExist(text, name) {
  const paths = [...new Set([...backtickedPaths(text), ...plainPaths(text)])];
  assert.ok(paths.length > 0, `${name} deveria citar caminhos do repositório`);
  for (const p of paths) if (!SKIP.has(p)) assert.ok(existsSync(join(ROOT, p)), `${name} cita "${p}", que não existe no repositório`);
}

function uiSource() {
  const dir = join(ROOT, 'src', 'ui');
  return readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => read(`src/ui/${f}`)).join('\n');
}

const KIT_URL = 'https://github.com/Marques10604/academia/blob/main/KIT-SOCORRO-IA.md';
const MANUAL_URL = 'https://github.com/Marques10604/academia/blob/main/MANUAL.md';

test('KIT-SOCORRO-IA.md: seções e conteúdo essencial', () => {
  const kit = read('KIT-SOCORRO-IA.md');
  for (const heading of [
    '## 1. Texto para colar na IA',
    '## 2. Como descrever o problema',
    '## 3. Como aplicar a correção e publicar',
    '## 4. (Opcional) Rodar os testes no computador',
  ]) assert.ok(kit.includes(heading), `falta o título "${heading}"`);
  for (const needle of ['innerHTML', 'h()', 'SCHEMA_VERSION', 'BACKUP_STORES', 'node tools/stamp-sw.mjs', 'node --test', 'src/version.js', 'sw.js', 'ARQUIVO INTEIRO', APP_URL]) {
    assert.ok(kit.includes(needle), `o kit deveria conter "${needle}"`);
  }
  assert.ok(kit.split('\n').length >= 80, 'kit curto demais');
});

test('KIT-SOCORRO-IA.md: todo caminho citado existe', () => {
  assertPathsExist(read('KIT-SOCORRO-IA.md'), 'KIT-SOCORRO-IA.md');
});

test('KIT-SOCORRO-IA.md: não pede nem contém segredos', () => {
  const kit = read('KIT-SOCORRO-IA.md');
  assert.ok(/nunca/i.test(kit) && kit.includes('backup'), 'o kit deve proibir colar o backup na IA');
  assert.equal(/[\w.+-]+@[\w-]+\.[\w.]+/.test(kit), false, 'sem e-mails no kit');
  assert.equal(/\b(ghp_|github_pat_|sk-[A-Za-z0-9]{10,})/.test(kit), false, 'sem tokens no kit');
});

test('Config: o link do kit aponta para um arquivo que existe', () => {
  const settings = read('src/ui/settings.js');
  assert.ok(settings.includes(`'${KIT_URL}'`), 'settings.js deve conter KIT_URL exato');
  assert.ok(existsSync(join(ROOT, 'KIT-SOCORRO-IA.md')));
  assert.ok(settings.includes("rel: 'noopener noreferrer'") && settings.includes("target: '_blank'"), 'link externo com target e rel');
});
