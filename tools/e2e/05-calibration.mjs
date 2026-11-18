// Calibration ramp: sets of 10, "Quantas repetições ainda sobravam?", next ramp load, working load,
// ramp sets stay out of history and records. Part 2: per-exercise increment preference.
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
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");

  const e0 = await page.eval(draftEntry);
  assert.equal(e0.exerciseId, 'leg_press_45');
  assert.equal(e0.calibrating, true, 'primeiro treino calibra');
  assert.equal(e0.phase, 'calibracao');
  assert.ok(await page.eval("!!document.querySelector('[data-action=log-ramp]')"), 'botão de rampa');
  assert.ok(await page.eval("!!document.querySelector('[data-action=log-set]')"), 'Concluir série continua visível');
  assert.ok(await page.eval("!!document.querySelector('[data-role=phase]')"), 'fase no cartão');
  assert.ok(await page.eval("!!document.querySelector('[data-role=effort]')"), 'esforço no cartão');

  // ramp 1: 4+ left -> next load = start + max(increment, 15% rounded to the step)
  const L0 = e0.load;
  const I = e0.incrementKg;
  const jump = Math.max(I, Math.round((0.15 * L0) / I) * I);
  await page.click('[data-action=log-ramp]');
  await page.waitFor("!!document.querySelector('[data-rir]')");
  assert.ok((await page.text()).includes('Quantas repetições ainda sobravam?'), 'pergunta');
  assert.equal(await page.eval("document.querySelectorAll('[data-rir]').length"), 5, '5 chips');
  await page.click('[data-rir="4"]');
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).load === ${L0 + jump})()`);
  assert.equal((await page.eval(draftEntry)).calibrating, true, 'segue calibrando');
  assert.equal(await page.eval("document.querySelector('input[name=load]').value"), fmt(L0 + jump), 'campo em dia');

  // ramp 2: 3 left -> working load, ramp ends
  await page.click('[data-action=log-ramp]');
  await page.waitFor("!!document.querySelector('[data-rir]')");
  await page.click('[data-rir="3"]');
  await page.waitFor(`(async () => (await ${draftEntry.trim()}).calibrating === false)()`);
  assert.equal((await page.eval(draftEntry)).load, L0 + jump, 'carga de trabalho');
  assert.equal(await page.eval("document.querySelectorAll('[data-set-kind=ramp]').length"), 2, '2 séries de rampa');
  await page.waitFor("document.body.innerText.includes('carga de trabalho')"); // the screen re-renders after the draft is saved
  assert.ok((await page.text()).includes('carga de trabalho'), 'faixa da carga de trabalho');

  // a working set, finish: ramp sets are not records
  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  await page.click('[data-action=finish]');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  assert.equal(await page.eval("document.querySelectorAll('[data-role=pr]').length"), 0, 'sem recorde');
  await page.click('[data-action=home]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  const reason = await page.eval(`(document.querySelector('[data-exercise=leg_press_45] [data-role=reason]') || {}).innerText || ''`);
  assert.ok(reason.includes('treino 2 de 2'), 'rampa não vira histórico, a série valendo sim: ' + reason);

  // Part 2: per-exercise increment preference drives the next workout's steppers.
  await page.goto('#/exercicio/leg_press_45');
  await page.waitFor("!!document.querySelector('[data-screen=exercicio] [data-increment]')");
  await page.click('[data-increment="2.5"]');
  await page.waitFor("document.querySelector('[data-increment=\"2.5\"]').classList.contains('selected')");
  const pref = await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    return (await db.get('exercisePrefs', 'leg_press_45')).incrementKg;
  })()`);
  assert.equal(pref, 2.5, 'preferência salva');
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-action=start]')");
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  const e1 = await page.eval(draftEntry);
  assert.equal(e1.incrementKg, 2.5, 'rascunho usa o incremento escolhido');
  await page.click('[data-action=load-plus]');
  await page.waitFor(`document.querySelector('input[name=load]').value === ${JSON.stringify(fmt(e1.load + 2.5))}`);
}
