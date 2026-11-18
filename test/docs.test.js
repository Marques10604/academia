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
  for (const p of paths) assert.ok(existsSync(join(ROOT, p)), `${name} cita "${p}", que não existe no repositório`);
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

test('MANUAL.md: seções e conteúdo essencial', () => {
  const manual = read('MANUAL.md');
  for (const heading of [
    '## Antes de qualquer mudança: faça um backup',
    '## Publicar uma mudança',
    '## Desfazer uma mudança que quebrou o app',
    '## Adicionar ou trocar um exercício',
    '## Restaurar um backup',
    '## O que NÃO fazer',
    '## Precisa de mais ajuda?',
  ]) assert.ok(manual.includes(heading), `falta o título "${heading}"`);
  for (const needle of ['node tools/stamp-sw.mjs', 'src/version.js', 'sw.js', 'ASSETS-START', 'src/data/exercises.js', 'src/data/program.js', 'manifest.webmanifest', APP_URL, 'Edit this file', 'Commit changes', 'Actions']) {
    assert.ok(manual.includes(needle), `o manual deveria conter "${needle}"`);
  }
  assert.ok(manual.split('\n').length >= 90, 'manual curto demais');
});

test('MANUAL.md: todo caminho citado existe', () => {
  assertPathsExist(read('MANUAL.md'), 'MANUAL.md');
});

test('MANUAL.md: todo rótulo do app citado existe em src/ui', () => {
  const manual = read('MANUAL.md');
  const ui = uiSource();
  for (const label of ['Backup e restauração', 'Já tenho um backup — restaurar', 'Restaurar este backup', 'Restaurar um backup', 'Baixar arquivo', 'Precisa de ajuda?', 'Enviar (Drive, WhatsApp…)', 'Versão do app']) {
    assert.ok(manual.includes(label), `o manual deveria citar "${label}"`);
    assert.ok(ui.includes(label), `o rótulo "${label}" citado no manual não existe em src/ui`);
  }
});

test('README.md aponta para o app e para os dois guias', () => {
  const readme = read('README.md');
  for (const needle of ['MANUAL.md', 'KIT-SOCORRO-IA.md', APP_URL]) assert.ok(readme.includes(needle), `README sem "${needle}"`);
  assert.ok(/não renomeie/i.test(readme), 'README deve avisar para não renomear');
});

test('Config: o link do manual aponta para um arquivo que existe', () => {
  const settings = read('src/ui/settings.js');
  assert.ok(settings.includes(`'${MANUAL_URL}'`), 'settings.js deve conter MANUAL_URL exato');
  assert.ok(existsSync(join(ROOT, 'MANUAL.md')));
  assert.ok(settings.includes('#/primeiro-dia'), 'botão do checklist do 1º dia');
});
