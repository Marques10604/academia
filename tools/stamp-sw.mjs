// Dev only: copia APP_VERSION para sw.js e reescreve a lista ASSETS.
// Uso: node tools/stamp-sw.mjs          (reescreve sw.js)
//      node tools/stamp-sw.mjs --check  (exit 1 se sw.js estiver desatualizado)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SW = join(ROOT, 'sw.js');

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const versionSrc = readFileSync(join(ROOT, 'src', 'version.js'), 'utf8');
const m = versionSrc.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!m) {
  console.error('APP_VERSION nao encontrado em src/version.js');
  process.exit(2);
}
const version = m[1];

const files = ['./'];
if (existsSync(join(ROOT, 'index.html'))) files.push('./index.html');
for (const f of ['styles.css', 'manifest.webmanifest']) {
  if (existsSync(join(ROOT, f))) files.push('./' + f);
}
for (const d of ['icons', 'src']) {
  for (const p of walk(join(ROOT, d))) files.push('./' + relative(ROOT, p).split(sep).join('/'));
}
const assets = [...new Set(files)].sort();

const current = readFileSync(SW, 'utf8').replace(/\r\n/g, '\n');
const startMark = '// ASSETS-START';
const endMark = '// ASSETS-END';
const a = current.indexOf(startMark);
const b = current.indexOf(endMark);
if (a < 0 || b < 0 || b < a) {
  console.error('marcadores ASSETS-START/ASSETS-END nao encontrados em sw.js');
  process.exit(2);
}
const list = assets.map((f) => `  '${f}',`).join('\n');
let next =
  current.slice(0, a) + startMark + '\n' + list + '\n  ' + current.slice(b);
next = next.replace(/^const VERSION = '[^']*';/m, `const VERSION = '${version}';`);

if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error('sw.js desatualizado: rode node tools/stamp-sw.mjs');
    process.exit(1);
  }
  console.log('sw.js em dia');
} else {
  writeFileSync(SW, next);
  console.log(`sw.js v${version} com ${assets.length} arquivos`);
}
