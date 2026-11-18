// Launch: first-gym-day checklist (shown until the first completed workout, ticks saved in settings and backed up).
import assert from 'node:assert/strict';

const DB = "await import(new URL('src/data/db.js', location.href).href)";
const DATES = "await import(new URL('src/domain/dates.js', location.href).href)";
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
const textOf = (sel) => `(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`;
const count = (sel) => `document.querySelectorAll(${JSON.stringify(sel)}).length`;
const checklist = `(async () => (await (${DB}).getSetting('firstDayChecklist', null)))()`;
const isChecked = (item) => `document.querySelector('input[data-item=${item}]').checked`;

// One finished workout, same row shape the app saves.
const completeSession = () => `(async () => {
  const db = ${DB};
  const dates = ${DATES};
  const startedAt = Date.now() - 3600000;
  await db.put('sessions', {
    id: 'launch-1', templateId: 'A', short: false, startedAt, endedAt: startedAt + 50 * 60000,
    localDate: dates.localDate(startedAt), complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null,
    entries: [{
      exerciseId: 'leg_press_45', plannedSets: 2, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12,
      incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
      sets: [0, 1].map((i) => ({ kind: 'work', load: 20, reps: 12, at: startedAt + i * 1000 })),
    }],
  });
  return true;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));

  // --- identity: title, onboarding heading with the logo, manifest and its icons ---
  assert.equal(await page.eval('document.title'), 'Progride');
  assert.ok((await page.text()).includes('Bem-vindo ao Progride'), 'titulo do onboarding');
  await page.waitFor("(() => { const i = document.querySelector('img.brand-logo'); return !!i && i.complete && i.naturalWidth > 0; })()");
  const manifest = await page.eval("fetch('manifest.webmanifest').then((r) => r.json())");
  assert.equal(manifest.name, 'Progride');
  assert.equal(manifest.short_name, 'Progride');
  assert.equal(manifest.id, 'academia');
  assert.equal(manifest.icons.length, 4);
  for (const icon of manifest.icons) {
    const type = await page.eval(`fetch(${JSON.stringify(icon.src)}).then((r) => (r.ok ? r.headers.get('content-type') : 'HTTP ' + r.status))`);
    assert.ok(String(type).startsWith('image/png'), `${icon.src} servido como ${type}`);
  }

  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));

  // --- Today's top: one dashboard card with date, week, backup status; average weight only after a weigh-in ---
  assert.equal(await page.eval(count('[data-role=dashboard]')), 1, 'um cartao de resumo');
  assert.ok((await page.eval(textOf('[data-role=dashboard] [data-role=date]'))).length > 5, 'data no cartao');
  assert.equal(await page.eval("document.querySelector('[data-role=dashboard] [data-role=week]').dataset.count"), '0');
  assert.ok((await page.eval(textOf('[data-role=dashboard] [data-role=week]'))).includes('0 de 3'));
  assert.equal(await page.eval("document.querySelector('[data-role=dashboard] [data-role=backup-status]').innerText"), 'Nenhum backup ainda');
  assert.equal(await page.eval(has('[data-role=avg-weight]')), false, 'sem pesagem, sem media');
  await page.eval(`(async () => {
    const dates = ${DATES};
    await (${DB}).put('dailyLogs', { localDate: dates.localDate(Date.now()), weightKg: 70.4, updatedAt: 1 });
    return true;
  })()`);
  await page.reload(); // already on #/hoje: a hash navigation would not re-render
  await page.waitFor(has('[data-role=dashboard] [data-role=avg-weight]'));
  assert.ok((await page.eval(textOf('[data-role=dashboard] [data-role=avg-weight]'))).includes('70,4 kg · 1 pesagem'));

  // --- first-gym-day checklist ---
  assert.ok(await page.eval(has('[data-role=first-day]')), 'cartao do primeiro dia na tela Hoje');
  await page.click('[data-action=first-day]');
  await page.waitFor(has('[data-screen=primeiro-dia]'));
  assert.equal(await page.eval(count('input[name=first-day]')), 6, 'seis itens');
  const text = await page.text();
  for (const s of ['Puxada frontal', 'placa', 'Minha regulagem', '0 de 6 feitos']) {
    assert.ok(text.includes(s), 'texto do checklist: ' + s);
  }
  await page.click('input[data-item=professor]');
  await page.click('input[data-item=leve]');
  await page.waitFor(`(async () => JSON.stringify(await ${checklist}) === '["professor","leve"]')()`);
  assert.ok((await page.eval(textOf('[data-role=first-day-progress]'))).includes('2 de 6 feitos'));

  await page.reload();
  await page.waitFor(has('[data-screen=primeiro-dia]'));
  assert.equal(await page.eval(isChecked('professor')), true, 'professor continua marcado');
  assert.equal(await page.eval(isChecked('leve')), true, 'leve continua marcado');
  for (const id of ['faltando', 'kg-placa', 'regulagem', 'garrafa']) {
    assert.equal(await page.eval(isChecked(id)), false, id + ' continua desmarcado');
  }
  assert.ok((await page.eval(textOf('[data-role=first-day-progress]'))).includes('2 de 6 feitos'));

  await page.click('input[data-item=leve]');
  await page.waitFor(`(async () => JSON.stringify(await ${checklist}) === '["professor"]')()`);

  // The ticks travel in the backup: the settings store is exported.
  const backupHasSettings = await page.eval(`(async () => {
    const backup = await import(new URL('src/domain/backup.js', location.href).href);
    const rows = (await (${DB}).readStores(['settings'])).settings;
    return 'settings' in backup.BACKUP_STORES && rows.some((r) => r.key === 'firstDayChecklist');
  })()`);
  assert.equal(backupHasSettings, true, 'o checklist vai no backup');

  // After the first completed workout the card leaves Today; the screen itself still opens.
  await page.eval(completeSession());
  await page.goto('#/hoje');
  await page.waitFor(has('[data-screen=hoje]'));
  assert.equal(await page.eval(has('[data-role=first-day]')), false, 'sem cartao depois do 1o treino');
  await page.goto('#/primeiro-dia');
  await page.waitFor(has('[data-screen=primeiro-dia]'));
  assert.ok((await page.eval(textOf('[data-role=first-day-progress]'))).includes('1 de 6 feitos'));
}
