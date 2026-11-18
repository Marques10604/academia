// Dev-only, zero dependencies. Static server + headless-Chrome E2E runner.
//   node tools/smoke.mjs --serve [port]   serve the repo on http://localhost:PORT/
//   node tools/smoke.mjs [filter ...]     run tools/e2e/*.mjs whose name contains any filter
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export function startServer(root, port = 0) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = path.resolve(base, '.' + urlPath);
      // path traversal guard
      if (file !== base && !file.startsWith(base + path.sep)) {
        res.writeHead(403).end('403');
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404).end('404');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(400).end('400');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const p = server.address().port;
      resolve({ server, port: p, url: `http://127.0.0.1:${p}/` });
    });
  });
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const cmd of ['google-chrome', 'chromium']) {
    const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.split(/\r?\n/)[0].trim();
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome(chrome) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'academia-smoke-'));
  const proc = spawn(chrome, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });
  const portFile = path.join(profile, 'DevToolsActivePort');
  let port = null;
  for (let i = 0; i < 100 && !port; i++) {
    try {
      const first = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
      if (first) port = Number(first);
    } catch { /* not written yet, or briefly locked by Chrome on Windows */ }
    if (!port) await sleep(100);
  }
  if (!port) {
    proc.kill();
    throw new Error('Chrome não abriu a porta de depuração');
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('falha ao conectar no WebSocket do Chrome'));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const close = () => {
    try { ws.close(); } catch { /* ignore */ }
    proc.kill();
    // Chrome can hold files on Windows for a moment
    setTimeout(() => {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* ignore */ }
    }, 500);
  };
  return { send, close };
}

function makePage(send, baseUrl) {
  const page = {
    async goto(p = '') {
      await send('Page.navigate', { url: baseUrl + p });
      await page.waitFor("document.readyState === 'complete'");
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('eval falhou: ' + (d.exception?.description || d.text));
      }
      return r.result.value;
    },
    async waitFor(expr, ms = 8000) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        let ok = false;
        try { ok = await page.eval(expr); } catch { /* page may be navigating */ }
        if (ok) return;
        await sleep(100);
      }
      throw new Error('timeout: ' + expr);
    },
    async click(selector) {
      const sel = JSON.stringify(selector);
      await page.waitFor(`!!document.querySelector(${sel})`);
      await page.eval(`document.querySelector(${sel}).click()`);
    },
    async type(selector, value) {
      const sel = JSON.stringify(selector);
      await page.waitFor(`!!document.querySelector(${sel})`);
      await page.eval(`(() => { const el = document.querySelector(${sel}); el.value = ${JSON.stringify(String(value))};
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    },
    text() {
      return page.eval('document.body.innerText');
    },
    async reload() {
      await page.eval('window.__smk = 1');
      await send('Page.reload');
      await page.waitFor("window.__smk === undefined && document.readyState === 'complete'");
    },
  };
  return page;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--serve') {
    const port = Number(args[1]) || 8080;
    const { server } = await startServer(REPO, port);
    console.log(`Servindo em http://localhost:${server.address().port}/`);
    return 0; // server keeps the process alive
  }

  const dir = path.join(REPO, 'tools', 'e2e');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort()
    .filter((f) => args.length === 0 || args.some((a) => f.includes(a)));

  const chrome = findChrome();
  if (!chrome) {
    console.error('Chrome não encontrado. Defina a variável CHROME_PATH com o caminho do chrome.exe.');
    return 2;
  }

  const { server, url } = await startServer(REPO, 0);
  let passed = 0;
  let failed = 0;
  for (const f of files) {
    const name = f.replace(/\.mjs$/, '');
    let browser = null;
    try {
      browser = await launchChrome(chrome);
      await browser.send('Page.enable');
      await browser.send('Runtime.enable');
      const mod = await import(pathToFileURL(path.join(dir, f)).href);
      await mod.default(makePage(browser.send, url));
      console.log(`PASS ${name}`);
      passed++;
    } catch (err) {
      console.log(`FAIL ${name}: ${err.message}`);
      failed++;
    } finally {
      if (browser) browser.close();
    }
  }
  server.close();
  console.log(`smoke: ${passed} passed, ${failed} failed`);
  return failed > 0 || passed === 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    if (code !== 0 || process.argv[2] !== '--serve') {
      // let the cleanup timers run briefly, then exit
      setTimeout(() => process.exit(code), 800);
    }
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
