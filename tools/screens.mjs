// Dev-only, zero dependencies. Takes mobile-size (375x812) screenshots of the main screens with some seeded data,
// using the same headless-Chrome harness as tools/smoke.mjs.
//   node tools/screens.mjs [outDir]     (default: .planning/phases/04-identity-publish-handoff/screens)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, findChrome, launchChrome, makePage } from './smoke.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(REPO, '.planning/phases/04-identity-publish-handoff/screens'));
const W = 375;
const H = 812;

const DB = "await import(new URL('src/data/db.js', location.href).href)";
const DATES = "await import(new URL('src/domain/dates.js', location.href).href)";

// Three finished workouts (A, B, A) and a week of weigh-ins, a setup note and a recent backup.
const SEED = `(async () => {
  const db = ${DB};
  const dates = ${DATES};
  const DAY = 86400000;
  const w = (load, reps, i) => ({ kind: 'work', load, reps, at: i });
  const entry = (exerciseId, load, reps, n, extra = {}) => ({
    exerciseId, plannedSets: n, repMin: 8, repMax: 12, restSec: 120, load, reps, incrementKg: 2.5, unit: 'kg', type: 'reps',
    feel: 'ponto', phase: 'adaptacao', calibrating: false, sets: Array.from({ length: n }, (_, i) => w(load, reps, i)), ...extra });
  const mk = (id, tpl, daysAgo, entries) => {
    const startedAt = Date.now() - daysAgo * DAY;
    return { id, templateId: tpl, short: false, startedAt, endedAt: startedAt + 52 * 60000, localDate: dates.localDate(startedAt),
      complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null, entries };
  };
  await db.put('sessions', mk('s1', 'A', 8, [entry('leg_press_45', 40, 12, 3), entry('lat_pulldown', 30, 10, 3)]));
  await db.put('sessions', mk('s2', 'B', 5, [entry('goblet_squat', 10, 10, 3), entry('seated_cable_row', 30, 10, 3)]));
  await db.put('sessions', mk('s3', 'A', 2, [entry('leg_press_45', 45, 12, 3), entry('lat_pulldown', 32.5, 10, 3)]));
  const kg = [70.2, 70.0, 70.4, 69.9, 70.1, 70.3, 70.0];
  for (let k = 6; k >= 0; k--) {
    const at = Date.now() - k * DAY;
    await db.put('dailyLogs', { localDate: dates.localDate(at), weightKg: kg[6 - k], sleep: k === 0 ? 4 : undefined, energy: k === 0 ? 3 : undefined, updatedAt: at });
  }
  await db.put('exercisePrefs', { exerciseId: 'leg_press_45', note: 'banco no furo 4, encosto no 2' });
  await db.setSetting('lastBackupAt', Date.now() - 3 * DAY);
  return true;
})()`;

export async function main() {
  const chrome = findChrome();
  if (!chrome) throw new Error('Chrome não encontrado (defina CHROME_PATH)');
  fs.mkdirSync(OUT, { recursive: true });
  const { server, url } = await startServer(REPO, 0);
  const browser = await launchChrome(chrome);
  try {
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');
    await browser.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
    const page = makePage(browser.send, url);
    const shot = async (name, { full = false } = {}) => {
      await new Promise((r) => setTimeout(r, 300)); // let fonts/layout settle
      const save = async (file) => {
        const { data } = await browser.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
        console.log('salvo', path.join(OUT, file));
      };
      await save(`${name}.png`);
      if (full) {
        // same screen, tall viewport: the whole page in one image
        const height = await page.eval('Math.ceil(document.documentElement.scrollHeight)');
        await browser.send('Emulation.setDeviceMetricsOverride', { width: W, height: Math.max(H, height), deviceScaleFactor: 2, mobile: true });
        await new Promise((r) => setTimeout(r, 300));
        await save(`${name}-completo.png`);
        await browser.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
      }
    };
    const screen = (name) => page.waitFor(`!!document.querySelector('[data-screen=${name}]')`);

    await page.goto('');
    await screen('inicio');
    await shot('boas-vindas');
    await page.click('[data-action=accept-onboarding]');
    await screen('hoje');
    await page.eval(SEED);
    await page.reload();
    await screen('hoje');
    await shot('hoje', { full: true });

    await page.click('[data-action=start]');
    await screen('treino');
    await page.click('[data-action=log-set]');
    await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
    await page.click('[data-action=log-set]');
    await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 2");
    await shot('treino-em-andamento', { full: true });

    await page.goto('#/exercicio/leg_press_45');
    await screen('exercicio');
    await shot('exercicio', { full: true });
    await page.goto('#/historico');
    await screen('historico');
    await shot('historico', { full: true });
    await page.goto('#/corpo');
    await screen('corpo');
    await shot('corpo', { full: true });
    await page.goto('#/config');
    await screen('config');
    await shot('config', { full: true });
  } finally {
    await browser.close();
    server.close();
  }
}

main().then(() => setTimeout(() => process.exit(0), 300)).catch((err) => {
  console.error(err);
  process.exit(1);
});
