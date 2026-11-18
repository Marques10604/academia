// "Minha regulagem": per-exercise note typed on the exercise screen, shown on Today and in the live workout.
// User text is rendered as text only, and a record written by 0.2.0 (only incrementKg) keeps working.
import assert from 'node:assert/strict';

const draftEntry = `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  const d = await db.getActive();
  return d ? d.entries[0] : null;
})()`;
const prefOf = (id) => `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  return (await db.get('exercisePrefs', ${JSON.stringify(id)})) || null;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Nothing shown while the note is empty; a 0.2.0 preference record has no note.
  await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    await db.put('exercisePrefs', { exerciseId: 'leg_press_45', incrementKg: 2.5 });
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-exercise=leg_press_45]')");
  assert.equal(await page.eval("!!document.querySelector('[data-role=setup-note]')"), false, 'sem nota, sem linha');

  await page.goto('#/exercicio/leg_press_45');
  await page.waitFor("!!document.querySelector('[data-role=note] textarea')");
  assert.equal(await page.eval("document.querySelector('[data-role=note] textarea').placeholder"), 'ex: banco no furo 4, almofada no 2');
  assert.equal(await page.eval("document.querySelector('[data-role=note] textarea').getAttribute('maxlength')"), '120');
  assert.ok((await page.text()).includes('Minha regulagem'), 'rotulo');
  const note = 'encosto no 3 <b>pés altos</b>';
  await page.type('[data-role=note] textarea', note);
  await page.waitFor(`(async () => ((await ${prefOf('leg_press_45').trim()}) || {}).note === ${JSON.stringify(note)})()`);
  assert.equal((await page.eval(prefOf('leg_press_45'))).incrementKg, 2.5, 'incremento preservado ao salvar a nota');

  // Reloading the exercise screen shows the saved note again.
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-exercise=leg_press_45]')");
  await page.goto('#/exercicio/leg_press_45');
  await page.waitFor("!!document.querySelector('[data-role=note] textarea')");
  assert.equal(await page.eval("document.querySelector('[data-role=note] textarea').value"), note);

  // Today: shown under the exercise, as text (the <b> is not a tag).
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-exercise=leg_press_45] [data-role=setup-note]')");
  const today = await page.eval("document.querySelector('[data-exercise=leg_press_45] [data-role=setup-note]').textContent");
  assert.equal(today, 'Minha regulagem: ' + note);
  assert.equal(await page.eval("document.querySelectorAll('[data-role=setup-note] b').length"), 0, 'texto, nunca HTML');
  assert.equal(await page.eval("document.querySelectorAll('[data-exercise=db_bench_press] [data-role=setup-note]').length"), 0, 'outros exercicios sem nota');

  // Live workout: at the top of that exercise.
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  assert.equal((await page.eval(draftEntry)).exerciseId, 'leg_press_45');
  const live = await page.eval("document.querySelector('[data-screen=treino] [data-role=setup-note]').textContent");
  assert.equal(live, 'Minha regulagem: ' + note);
  assert.equal(await page.eval("document.querySelectorAll('[data-screen=treino] [data-role=setup-note] b').length"), 0, 'texto, nunca HTML');
  await page.click('[data-overview="1"]');
  await page.waitFor("(document.querySelector('.card.current h2') || {}).innerText === 'Supino reto com halteres'");
  assert.equal(await page.eval("!!document.querySelector('[data-screen=treino] [data-role=setup-note]')"), false, 'exercicio sem nota');

  // Clearing the note removes it everywhere.
  await page.goto('#/exercicio/leg_press_45');
  await page.waitFor("!!document.querySelector('[data-role=note] textarea')");
  await page.type('[data-role=note] textarea', '   ');
  await page.waitFor(`(async () => ((await ${prefOf('leg_press_45').trim()}) || {}).note === '')()`);
  await page.goto('#/treino');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  await page.click('[data-overview="0"]');
  await page.waitFor("(document.querySelector('.card.current h2') || {}).innerText === 'Leg press 45°'");
  assert.equal(await page.eval("!!document.querySelector('[data-screen=treino] [data-role=setup-note]')"), false, 'nota apagada');
}
