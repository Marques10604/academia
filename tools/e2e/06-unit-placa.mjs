// Load unit per exercise: "kg" (default) or "placa" for pin-loaded machines/cables.
// Covers the choice on the exercise screen, "placa N" in Today / workout / summary, whole-number steps,
// and the confirm that restarts the calibration when the unit changes with history.
import assert from 'node:assert/strict';

const draftEntry = (i) => `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  const d = await db.getActive();
  return d ? d.entries[${i}] : null;
})()`;
const prefOf = (id) => `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  return (await db.get('exercisePrefs', ${JSON.stringify(id)})) || null;
})()`;
const rowText = (id, role) => `(document.querySelector('[data-exercise=${id}] [data-role=${role}]') || {}).innerText || ''`;

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Leg press is plate-loaded: no unit choice. A selectorized machine has one, kg by default.
  await page.goto('#/exercicio/leg_press_45');
  await page.waitFor("!!document.querySelector('[data-screen=exercicio] [data-increment]')");
  assert.equal(await page.eval("!!document.querySelector('[data-role=unit]')"), false, 'leg press sem unidade');
  await page.goto('#/exercicio/lat_pulldown');
  await page.waitFor("!!document.querySelector('[data-role=unit]')");
  assert.ok((await page.text()).includes("Use 'placa' se a máquina mostra só números (1, 2, 3…) e não kg."), 'linha de ajuda');
  assert.equal(await page.eval("document.querySelector('[data-unit=kg]').classList.contains('selected')"), true, 'kg e o padrao');

  // A kg increment saved first must survive the unit choice (prefs are merged, not replaced).
  await page.click('[data-increment="10"]');
  await page.waitFor("document.querySelector('[data-increment=\"10\"]').classList.contains('selected')");
  await page.eval("window.__confirms = []; window.__answer = true; window.confirm = (m) => { window.__confirms.push(m); return window.__answer; }; true");
  await page.click('[data-unit=placa]');
  await page.waitFor("document.querySelector('[data-unit=placa]').classList.contains('selected')");
  const pref = await page.eval(prefOf('lat_pulldown'));
  assert.equal(pref.unit, 'placa');
  assert.equal(pref.incrementKg, 10, 'incremento em kg preservado');
  assert.equal(await page.eval('window.__confirms.length'), 0, 'sem historico, sem confirmacao');
  assert.equal(await page.eval("!!document.querySelector('[data-increment]')"), false, 'sem chips de kg em placa');
  assert.ok((await page.text()).includes('o salto é sempre 1 placa'), 'incremento fixo');

  // Today and the workout speak "placa".
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-exercise=lat_pulldown]')");
  assert.equal(await page.eval(rowText('lat_pulldown', 'load')), 'placa 3', 'carga inicial em placa');
  assert.equal(await page.eval(rowText('leg_press_45', 'load')), '20 kg', 'leg press continua em kg');
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  await page.click('[data-overview="2"]');
  await page.waitFor("(document.querySelector('.card.current h2') || {}).innerText === 'Puxada frontal'");
  const e = await page.eval(draftEntry(2));
  assert.equal(e.unit, 'placa');
  assert.equal(e.incrementKg, 1);
  assert.equal(e.load, 3);
  assert.equal(await page.eval("document.querySelector('input[name=load]').value"), '3');
  assert.ok((await page.text()).includes('placa (número da máquina)'), 'legenda do campo');
  await page.click('[data-action=log-ramp]');
  await page.waitFor("!!document.querySelector('[data-rir]')");
  assert.ok((await page.text()).includes('Rampa 1: placa 3 × 10'), 'rampa em placa');
  await page.click('[data-rir="4"]');
  await page.waitFor(`(async () => (await ${draftEntry(2).trim()}).load === 4)()`);
  await page.click('[data-action=log-ramp]');
  await page.waitFor("!!document.querySelector('[data-rir]')");
  await page.click('[data-rir="3"]');
  await page.waitFor(`(async () => (await ${draftEntry(2).trim()}).calibrating === false)()`);
  // The draft is saved before the screen re-renders: wait for the text instead of reading it right away (was a flake).
  await page.waitFor("document.body.innerText.includes('Sua carga de trabalho: placa 4.')");
  assert.ok((await page.text()).includes('Sua carga de trabalho: placa 4.'), 'faixa em placa');
  await page.click('[data-action=load-plus]');
  await page.waitFor("document.querySelector('input[name=load]').value === '5'");
  await page.click('[data-action=load-minus]');
  await page.waitFor("document.querySelector('input[name=load]').value === '4'");
  await page.type('input[name=load]', '5,6'); // a placa is a whole number
  await page.waitFor("document.querySelector('input[name=load]').value === '6'");
  await page.type('input[name=load]', '4');
  await page.waitFor("document.querySelector('input[name=load]').value === '4'");
  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  assert.ok((await page.text()).includes('1ª série: placa 4 × 10'), 'serie em placa');
  assert.ok((await page.text()).includes('anterior') || (await page.text()).includes('primeira vez'), 'linha anterior');

  await page.click('[data-action=finish]');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  assert.ok((await page.text()).includes('Puxada frontal: placa 4 × 10'), 'resumo em placa');
  await page.click('[data-action=home]');
  await page.waitFor("!!document.querySelector('[data-exercise=lat_pulldown]')");
  assert.equal(await page.eval(rowText('lat_pulldown', 'load')), 'placa 3', '2o treino: 90% de placa 4, arredondado para baixo');
  assert.ok((await page.eval(rowText('lat_pulldown', 'reason'))).includes('treino 2 de 2'));

  // Changing the unit with history asks first; "cancel" keeps everything as is.
  await page.goto('#/exercicio/lat_pulldown');
  await page.waitFor("!!document.querySelector('[data-role=unit]')");
  await page.eval("window.__confirms = []; window.__answer = false; window.confirm = (m) => { window.__confirms.push(m); return window.__answer; }; true");
  await page.click('[data-unit=kg]');
  await page.waitFor("window.__confirms.length === 1");
  assert.equal(await page.eval('window.__confirms[0]'), 'Trocar a unidade recomeça a calibração deste exercício');
  assert.equal((await page.eval(prefOf('lat_pulldown'))).unit, 'placa', 'cancelar mantem a unidade');
  // "ok" switches back to kg and the calibration starts over (start load in kg, calibration phase)
  await page.eval('window.__answer = true; true');
  await page.click('[data-unit=kg]');
  await page.waitFor("document.querySelector('[data-unit=kg]').classList.contains('selected')");
  const after = await page.eval(prefOf('lat_pulldown'));
  assert.equal(after.unit, 'kg');
  assert.ok(after.unitChangedAt > 0);
  assert.equal(after.incrementKg, 10, 'incremento em kg continua salvo');
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-exercise=lat_pulldown]')");
  assert.equal(await page.eval(rowText('lat_pulldown', 'load')), '20 kg', 'calibracao recomeca em kg');
  assert.ok((await page.eval(rowText('lat_pulldown', 'reason'))).includes('treino 1 de 2'));
}
