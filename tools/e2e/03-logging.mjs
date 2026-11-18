// Logging: prefilled 1-tap sets, steppers, typed comma load (and the typed-then-plus race),
// previous line, warm-up, undo, feel chips, rest timer.
import assert from 'node:assert/strict';

const draftEntry = `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  const d = await db.getActive();
  return d ? d.entries[0] : null;
})()`;
const fmt = (n) => String(n).replace('.', ',');

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Two prior sessions of leg press keep it out of calibration; the last result is 20 kg x 10.
  await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    const dates = await import(new URL('src/domain/dates.js', location.href).href);
    const DAY = 86400000;
    const mk = (id, daysAgo, sets) => {
      const startedAt = Date.now() - daysAgo * DAY;
      return {
        id, templateId: 'B', startedAt, endedAt: startedAt + 3600000, localDate: dates.localDate(startedAt),
        complete: true, schemaVersion: 1,
        entries: [{ exerciseId: 'leg_press_45', plannedSets: 3, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 10, feel: null,
          sets: sets.map((reps) => ({ kind: 'work', load: 20, reps, at: startedAt })) }],
      };
    };
    await db.put('sessions', mk('seed-1', 3, [10, 10]));
    await db.put('sessions', mk('seed-2', 1, [10, 9]));
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.reload();
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  assert.ok((await page.text()).includes('Treino A'), 'Treino A é o próximo');
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");

  const e0 = await page.eval(draftEntry);
  const L = e0.load;
  const I = e0.incrementKg;
  const P = e0.plannedSets;
  assert.ok(L > 0 && I > 0 && P > 0, 'carga, incremento e séries vêm do rascunho');
  const loadValue = () => page.eval("document.querySelector('input[name=load]').value");
  const draftLoad = async () => (await page.eval(draftEntry)).load;

  // previous result and warm-up
  assert.ok((await page.eval("document.querySelector('[data-role=previous]').innerText")).includes('anterior: 20 kg × 10'),
    'linha "anterior"');
  assert.equal(await page.eval("document.querySelectorAll('[data-action=log-warmup]').length"), 2, '2 aquecimentos');
  await page.click('[data-action=log-warmup]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=warmup]').length === 1");
  assert.equal(await page.eval("document.querySelectorAll('[data-action=log-warmup]').length"), 1, 'linha feita some');

  // steppers
  await page.click('[data-action=load-plus]');
  await page.waitFor(`document.querySelector('input[name=load]').value === ${JSON.stringify(fmt(L + I))}`);
  await page.click('[data-action=load-minus]');
  await page.waitFor(`document.querySelector('input[name=load]').value === ${JSON.stringify(fmt(L))}`);
  assert.equal(await draftLoad(), L, 'carga voltou');
  const r0 = e0.reps;
  await page.click('[data-action=reps-plus]');
  await page.waitFor(`document.querySelector('[data-role=reps]').innerText.trim() === ${JSON.stringify(String(r0 + 1))}`);
  await page.click('[data-action=reps-minus]');
  await page.waitFor(`document.querySelector('[data-role=reps]').innerText.trim() === ${JSON.stringify(String(r0))}`);

  // typed comma load
  await page.type('input[name=load]', '22,5');
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).load === 22.5)()`);

  // race: typed value then + in the same tick gives exactly one increment
  await page.eval(`(() => {
    const i = document.querySelector('input[name=load]');
    i.value = '22,5';
    i.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('[data-action=load-plus]').click();
    return true;
  })()`);
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).load === ${22.5 + I})()`);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await draftLoad(), 22.5 + I, 'um único incremento, nem zero nem dois');
  assert.equal(await loadValue(), fmt(22.5 + I), 'campo em dia');
  await page.type('input[name=load]', '22,5');
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).load === 22.5)()`);

  // log one set with the typed load, then undo it
  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  assert.ok((await page.eval("document.querySelector('[data-set-kind=work]').innerText")).includes('22,5 kg'));

  await page.click('[data-action=undo]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 0");

  // log the planned sets, then the feel chip appears
  for (let i = 1; i <= P; i++) {
    await page.click('[data-action=log-set]');
    await page.waitFor(`document.querySelectorAll('[data-set-kind=work]').length === ${i}`);
  }
  await page.click('[data-feel=ponto]');
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).feel === 'ponto')()`);
}
