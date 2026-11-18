// Library: exercise screen with steps/mistakes/YouTube search, then Today's prescription from seeded history.
import assert from 'node:assert/strict';

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Part 1: the exercise screen opened from Today
  await page.click('[data-exercise=leg_press_45] a');
  await page.waitFor("!!document.querySelector('[data-screen=exercicio]')");
  const q = (sel, fn) => page.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? (${fn})(el) : null; })()`);
  assert.ok((await q('[data-role=steps]', 'e => e.querySelectorAll("li").length')) >= 3, 'passo a passo com 3+ passos');
  assert.ok((await q('[data-role=mistakes]', 'e => e.querySelectorAll("li").length')) >= 2, '2+ erros comuns');
  assert.ok((await q('[data-role=muscles]', 'e => e.innerText.trim().length')) > 0, 'músculos');
  assert.ok((await q('[data-role=setup]', 'e => e.innerText.trim().length')) > 0, 'ajuste do aparelho');
  assert.ok((await q('[data-role=alternative]', 'e => e.innerText')).includes('Não tem essa máquina'), 'alternativa do exercício');
  const href = await q('[data-action=youtube]', 'e => e.getAttribute("href")');
  assert.ok(href.startsWith('https://www.youtube.com/results?search_query='), 'busca do YouTube: ' + href);
  assert.equal(await q('[data-action=youtube]', 'e => e.getAttribute("target")'), '_blank');
  assert.equal(await q('[data-action=youtube]', 'e => e.getAttribute("rel")'), 'noopener');

  // Part 2: seeded history drives phase, load and reason on Today
  await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    const dates = await import(new URL('src/domain/dates.js', location.href).href);
    const DAY = 86400000;
    const mk = (id, templateId, daysAgo, exerciseId, sets) => {
      const startedAt = Date.now() - daysAgo * DAY;
      return {
        id, templateId, startedAt, endedAt: startedAt + 3600000, localDate: dates.localDate(startedAt),
        complete: true, schemaVersion: 1,
        entries: [{ exerciseId, plannedSets: 3, repMin: 10, repMax: 15, restSec: 120, load: 60, reps: 15, feel: null, sets }],
      };
    };
    const work = [0, 1, 2].map((i) => ({ kind: 'work', load: 60, reps: 15, at: Date.now() }));
    const goblet = [0, 1, 2].map((i) => ({ kind: 'work', load: 8, reps: 10, at: Date.now() }));
    await db.put('sessions', mk('seed-1', 'A', 5, 'leg_press_45', work));
    await db.put('sessions', mk('seed-2', 'A', 3, 'leg_press_45', work));
    await db.put('sessions', mk('seed-3', 'B', 1, 'goblet_squat', goblet));
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.reload();
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  await page.waitFor("!!document.querySelector('[data-exercise=leg_press_45] [data-role=reason]')");
  const row = (id, role) => q(`[data-exercise=${id}] [data-role=${role}]`, 'e => e.innerText');
  assert.equal(await row('leg_press_45', 'phase'), 'Adaptação');
  assert.ok((await row('leg_press_45', 'reason')).includes('suba para 65 kg'), await row('leg_press_45', 'reason'));
  assert.equal(await row('db_bench_press', 'phase'), 'Calibração');
}
