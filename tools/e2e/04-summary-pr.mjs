// Finish summary: duration, sets and a "Recorde!" row when a working-set best is beaten.
import assert from 'node:assert/strict';

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Two prior sessions (calibration is over) with leg press best 20 kg x 12.
  await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    const dates = await import(new URL('src/domain/dates.js', location.href).href);
    const DAY = 86400000;
    const mk = (id, daysAgo) => {
      const startedAt = Date.now() - daysAgo * DAY;
      return {
        id, templateId: 'B', startedAt, endedAt: startedAt + 3600000, localDate: dates.localDate(startedAt),
        complete: true, schemaVersion: 1,
        entries: [{ exerciseId: 'leg_press_45', plannedSets: 3, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12, feel: null,
          sets: [0, 1].map(() => ({ kind: 'work', load: 20, reps: 12, at: startedAt })) }],
      };
    };
    await db.put('sessions', mk('seed-1', 3));
    await db.put('sessions', mk('seed-2', 1));
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.reload();
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");

  await page.type('input[name=load]', '30');
  const draftReps = `(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    return (await db.getActive()).entries[0].reps;
  })()`;
  for (let i = 0; i < 30; i++) {
    const reps = await page.eval(draftReps);
    if (reps === 12) break;
    await page.click(reps < 12 ? '[data-action=reps-plus]' : '[data-action=reps-minus]');
    await page.waitFor(`(async () => (await ${draftReps.trim()}) !== ${reps})()`);
  }
  assert.equal(await page.eval(draftReps), 12, 'repetições em 12');
  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  await page.click('[data-action=finish]');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");

  assert.ok((await page.text()).includes('Duração'), 'resumo mostra a duração');
  const pr = await page.eval("(document.querySelector('[data-role=pr]') || {}).innerText || ''");
  assert.ok(pr.includes('Leg press 45°') && pr.includes('30 kg × 12') && pr.includes('Recorde!'), 'recorde: ' + pr);
}
