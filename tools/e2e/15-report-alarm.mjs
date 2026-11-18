// The AI report on '#/relatorio' (content, privacy, copy with the clipboard and with the select fallback) and the
// morning-alarm guide on '#/lembrete' (3 illustrated Clock steps, the daily .ics download, the remembered time).
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";
const datesImport = "const dates = await import(new URL('src/domain/dates.js', location.href).href);";
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
const textOf = (sel) => `(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`;
const count = (sel) => `document.querySelectorAll(${JSON.stringify(sel)}).length`;
const tabbarHidden = "(document.querySelector('[data-role=tabbar]') || { hidden: true }).hidden === true";

// One complete session (same shape as 08-backup) with leg press and plank, `daysAgo` days back.
const seedSession = (id, daysAgo, legSets, plankReps) => `(async () => {
  ${dbImport} ${datesImport}
  const startedAt = Date.now() - ${daysAgo} * 86400000;
  const mk = (kind, load, reps, i) => ({ kind, load, reps, at: startedAt + i * 1000 });
  await db.put('sessions', {
    id: ${JSON.stringify(id)}, templateId: 'A', short: false, startedAt, endedAt: startedAt + 50 * 60000,
    localDate: dates.localDate(startedAt), complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null,
    entries: [
      { exerciseId: 'leg_press_45', plannedSets: 2, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12,
        incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
        sets: ${JSON.stringify(legSets)}.map(([kind, load, reps], i) => mk(kind, load, reps, i)) },
      { exerciseId: 'plank', plannedSets: 2, repMin: 20, repMax: 60, restSec: 60, load: 0, reps: ${plankReps},
        incrementKg: 0, unit: 'kg', type: 'time', feel: 'ok', phase: 'learn', calibrating: false,
        sets: [mk('work', 0, ${plankReps}, 5)] },
    ],
  });
  return true;
})()`;

const seedDay = (daysAgo, patch) => `(async () => {
  ${dbImport} ${datesImport}
  const at = Date.now() - ${daysAgo} * 86400000;
  const localDate = dates.localDate(at);
  const old = (await db.get('dailyLogs', localDate)) || {};
  await db.put('dailyLogs', { ...old, localDate, ...${JSON.stringify(patch)}, updatedAt: at });
  return true;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));

  // ---- Task 1: the AI report ----
  // The onboarding profile carries the name 'Ivonilson': it must never reach the report.
  await page.eval(seedSession('r-1', 14, [['warmup', 100, 5], ['work', 40, 12], ['work', 40, 11]], 30));
  await page.eval(seedSession('r-2', 2, [['work', 45, 10]], 45));
  await page.eval(seedDay(3, { weightKg: 70.4, sleep: 4, energy: 3, protein: [{ meal: 'almoco', food: 'frango', g: 28, at: 1 }, { meal: 'almoco', food: 'whey', g: 22, at: 2 }] }));
  await page.eval(seedDay(1, { weightKg: 70.6, sleep: 3, energy: 4, protein: [{ meal: 'cafe', food: 'ovos2', g: 12, at: 1 }] }));

  await page.goto('#/config');
  await page.waitFor(has('[data-screen=config]') + ' && ' + has('[data-action=ai-report]'));
  await page.click('[data-action=ai-report]');
  await page.waitFor(has('[data-screen=relatorio]'));
  assert.equal(await page.eval(tabbarHidden), true, 'relatorio esconde a barra de abas');

  const report = await page.eval("document.querySelector('textarea[name=ai-report]').value");
  for (const part of ['Leg press 45°', '→', 'Prancha', 'Peso médio (7 dias)', 'Sono: média', 'PROTEÍNA', 'Responda em português']) {
    assert.ok(report.includes(part), 'relatorio tem: ' + part + '\n' + report);
  }
  assert.ok(report.includes('- Treinos concluídos: 2'), report);
  assert.ok(!report.includes('100'), 'o aquecimento mais pesado nao entra');
  for (const bad of ['Ivonilson', 'undefined', 'NaN']) assert.ok(!report.includes(bad), 'relatorio nao tem: ' + bad);
  assert.equal(await page.eval("document.querySelector('textarea[name=ai-report]').readOnly"), true);

  // Copy with the Clipboard API.
  await page.eval(`(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } } });
    return true;
  })()`);
  await page.click('[data-action=copy-report]');
  await page.waitFor('typeof window.__copied === "string"');
  assert.equal(await page.eval('window.__copied'), report, 'copiou o texto inteiro');
  await page.waitFor(`${textOf('[data-role=copy-msg]')}.includes('Copiado')`);

  // Copy when the clipboard refuses: select the text and use the old copy command.
  await page.eval(`(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('negado')) } });
    window.__cmds = [];
    document.execCommand = (c) => { window.__cmds.push(c); return true; };
    document.querySelector('[data-role=copy-msg]').textContent = '';
    return true;
  })()`);
  await page.click('[data-action=copy-report]');
  await page.waitFor('window.__cmds.length === 1');
  assert.equal(await page.eval('window.__cmds[0]'), 'copy');
  await page.waitFor(`${textOf('[data-role=copy-msg]')}.includes('Copiado')`);
  assert.equal(await page.eval("document.activeElement === document.querySelector('textarea[name=ai-report]')"), true, 'texto selecionado');

  // And when even the old command fails the user is told what to do.
  await page.eval(`(() => { document.execCommand = () => false; return true; })()`);
  await page.click('[data-action=copy-report]');
  await page.waitFor(`${textOf('[data-role=copy-msg]')}.includes('selecionado')`);

  await page.click('[data-action=back]');
  await page.waitFor(has('[data-screen=config]'));

  // ---- Task 2: the morning-alarm guide ----
  await page.click('[data-action=reminder]');
  await page.waitFor(has('[data-screen=lembrete]'));
  assert.equal(await page.eval(tabbarHidden), true, 'lembrete esconde a barra de abas');
  assert.equal(await page.eval(count('[data-role=alarm-step]')), 3, 'tres passos');
  assert.equal(await page.eval(count('[data-role=alarm-step] svg')), 3, 'cada passo com um icone');
  const guide = await page.text();
  assert.ok(guide.includes('Relógio') && guide.includes('Treino'), guide);
  assert.equal(await page.eval('typeof Notification === "undefined" || Notification.permission'), 'default', 'sem pedir permissao de notificacao');

  // Capture the downloaded Blob and the file name, as in 08-backup.
  await page.eval(`(() => {
    window.__blobs = []; window.__downloads = [];
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { window.__blobs.push(b); return create(b); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { window.__downloads.push(this.download); return click.call(this); };
    return true;
  })()`);
  await page.type('input[name=reminder-time]', '06:45');
  await page.click('[data-action=download-ics]');
  await page.waitFor('window.__blobs.length === 1');
  assert.equal(await page.eval('window.__blobs[0].type'), 'text/calendar');
  const ics = await page.eval('window.__blobs[0].text()');
  for (const part of ['BEGIN:VCALENDAR', 'RRULE:FREQ=DAILY', 'BEGIN:VALARM', 'SUMMARY:Treino']) {
    assert.ok(ics.includes(part), 'ics tem: ' + part + '\n' + ics);
  }
  const today = await page.eval(`(async () => { ${datesImport} return dates.localDate(Date.now()).replace(/-/g, ''); })()`);
  assert.ok(ics.includes(`DTSTART:${today}T064500`), ics);
  assert.equal(await page.eval('window.__downloads[0]'), 'progride-lembrete.ics');
  assert.ok((await page.eval(textOf('[data-role=ics-msg]'))).includes('progride-lembrete.ics'));
  assert.equal(await page.eval(`(async () => { ${dbImport} return await db.getSetting('reminderTime', null); })()`), '06:45');

  // The chosen time is remembered after a reload.
  await page.reload();
  await page.waitFor(has('[data-screen=lembrete]'));
  assert.equal(await page.eval("document.querySelector('input[name=reminder-time]').value"), '06:45');

  await page.click('[data-action=back]');
  await page.waitFor(has('[data-screen=config]'));
}
