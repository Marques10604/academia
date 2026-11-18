// Goals and gentle cues: the weekly workout goal (Config) and the forgiving weekly streak, the no-guilt gap notice,
// the 4-week progress-photo reminder (Corpo card + Today card), the body-weight goal with the healthy pace and
// the carbohydrate nudge after a 2-week stall (Corpo and '#/proteina').
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";
const datesImport = "const dates = await import(new URL('src/domain/dates.js', location.href).href);";
const weekImport = "const week = await import(new URL('src/domain/week.js', location.href).href);";
const setting = (key) => `(async () => { ${dbImport} return await db.getSetting(${JSON.stringify(key)}, null); })()`;
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
const textOf = (sel) => `(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`;
const count = (sel) => `document.querySelectorAll(${JSON.stringify(sel)}).length`;

// One complete session row (same shape as 08-backup) at a given start time.
const sessionRow = (id, startedAt, localDate) => ({
  id, templateId: 'A', short: false, startedAt, endedAt: startedAt + 50 * 60000,
  localDate, complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null,
  entries: [{
    exerciseId: 'leg_press_45', plannedSets: 2, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12,
    incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
    sets: [0, 1].map((i) => ({ kind: 'work', load: 20, reps: 12, at: startedAt + i * 1000 })),
  }],
});

// Removes every session, then seeds one complete session per entry of `daysAgoList`.
const reseed = (daysAgoList) => `(async () => {
  ${dbImport} ${datesImport}
  for (const s of await db.getAll('sessions')) await db.del('sessions', s.id);
  const make = ${sessionRow.toString()};
  let i = 0;
  for (const daysAgo of ${JSON.stringify(daysAgoList)}) {
    const d = new Date(); d.setHours(10, 0, 0, 0); d.setDate(d.getDate() - daysAgo);
    await db.put('sessions', make('g-' + (i++), d.getTime(), dates.localDate(d.getTime())));
  }
  return true;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));

  // ---- Task 1: weekly goal setting -> Today week row; streak with a grace week ----
  const weekText = await page.eval(textOf('[data-role=week]'));
  assert.ok(weekText.includes('0 de 3'), weekText);
  assert.equal(await page.eval(count('[data-role=week] .dot')), 3, 'tres bolinhas por padrao');
  assert.equal(await page.eval(has('[data-role=streak]')), false, 'sem sequencia no inicio');

  await page.goto('#/config');
  await page.waitFor(has('[data-screen=config]') + ' && ' + has('[data-weekly-goal="2"]'));
  assert.equal(await page.eval("document.querySelector('[data-weekly-goal=\"3\"]').classList.contains('selected')"), true, '3 marcado por padrao');
  await page.click('[data-weekly-goal="2"]');
  await page.waitFor(`(async () => { ${dbImport} return (await db.getSetting('weeklyGoal', null)) === 2; })()`);
  assert.equal(await page.eval("document.querySelector('[data-weekly-goal=\"2\"]').classList.contains('selected')"), true);
  assert.equal(await page.eval(count('[data-weekly-goal].selected')), 1, 'so uma meta marcada');
  await page.goto('#/hoje');
  await page.waitFor(has('[data-screen=hoje]'));
  assert.ok((await page.eval(textOf('[data-role=week]'))).includes('0 de 2'));
  assert.equal(await page.eval(count('[data-role=week] .dot')), 2, 'duas bolinhas');

  // Two workouts (Monday and Wednesday) in each of the 3 previous weeks: a streak of 3 weeks.
  await page.eval(`(async () => {
    ${dbImport} ${datesImport} ${weekImport}
    const monday = week.weekStart(dates.localDate(Date.now()));
    let i = 0;
    for (let k = 1; k <= 3; k++) {
      for (const add of [0, 2]) {
        const d = new Date(monday + 'T10:00:00');
        d.setDate(d.getDate() - 7 * k + add);
        const startedAt = d.getTime();
        await db.put('sessions', (${sessionRow.toString()})('s-' + (i++), startedAt, dates.localDate(startedAt)));
      }
    }
    return true;
  })()`);
  await page.reload();
  await page.waitFor(has('[data-screen=hoje]') + ' && ' + has('[data-role=streak]'));
  assert.equal(await page.eval(textOf('[data-role=streak]')), 'Sequência: 3 semanas');

  // ---- Task 2: gap notice, then the progress-photo reminder ----
  await page.eval(reseed([6]));
  await page.reload();
  await page.waitFor(has('[data-screen=hoje]') + ' && ' + has('[data-role=gap-notice]'));
  const gap6 = await page.eval(textOf('[data-role=gap-notice]'));
  assert.ok(gap6.includes('Faz 6 dias'), gap6);
  assert.ok(gap6.includes('Tudo bem: o plano continua de onde parou.'), gap6);
  assert.equal(gap6.includes('mais leves'), false, 'abaixo de 10 dias nao fala de cargas mais leves');
  await page.eval(reseed([12]));
  await page.reload();
  await page.waitFor(has('[data-screen=hoje]') + ' && ' + has('[data-role=gap-notice]'));
  const gap12 = await page.eval(textOf('[data-role=gap-notice]'));
  assert.ok(gap12.includes('Faz 12 dias'), gap12);
  assert.ok(gap12.includes('mais leves'), gap12);

  // A workout exists and the user never took photos: the small reminder shows on Today.
  assert.equal(await page.eval(has('[data-role=photo-reminder]')), true, 'lembrete de fotos na tela Hoje');
  await page.click('[data-action=photos]');
  await page.waitFor(has('[data-screen=corpo]') + ' && ' + has('[data-role=photos-status]'));
  assert.ok((await page.eval(textOf('[data-role=photos-status]'))).includes('Hora de tirar as fotos'));
  assert.ok((await page.eval(textOf('[data-role=photos]'))).includes('Progride'));

  // "Tirei as fotos hoje" restarts the 28 days and never discards an unsaved check-in.
  await page.eval("(() => { const i = document.querySelector('input[name=checkin-weight]'); i.value = ''; return true; })()");
  await page.type('input[name=checkin-weight]', '71,2');
  await page.click('[data-action=photos-done]');
  await page.waitFor(`(document.querySelector('[data-role=photos-status]') || {}).textContent === 'Próximas fotos em 28 dias'`);
  assert.equal(await page.eval(`(async () => { ${dbImport} ${datesImport} return (await db.getSetting('lastPhotosAt', null)) === dates.localDate(Date.now()); })()`), true);
  assert.equal(await page.eval("document.querySelector('input[name=checkin-weight]').value"), '71,2', 'peso digitado continua no campo');
  await page.goto('#/hoje');
  await page.waitFor(has('[data-screen=hoje]'));
  assert.equal(await page.eval(has('[data-role=photo-reminder]')), false, 'sem lembrete por 28 dias');

  // A workout today: no gap notice.
  await page.eval(reseed([0]));
  await page.reload();
  await page.waitFor(has('[data-screen=hoje]'));
  assert.equal(await page.eval(has('[data-role=gap-notice]')), false, 'treinou hoje: sem aviso');
}
