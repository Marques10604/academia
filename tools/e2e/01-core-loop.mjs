// Core loop: Today -> start -> log set -> reload resumes.
import assert from 'node:assert/strict';

const draftSetCount = `(async () => {
  const db = await import(new URL('src/data/db.js', location.href).href);
  const d = await db.getActive();
  return d ? d.entries[0].sets.length : -1;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  const text = await page.text();
  assert.ok(text.includes('Treino A'), 'Today deve mostrar Treino A');
  assert.ok(text.includes('Leg press 45°'), 'Today deve listar Leg press 45°');

  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");

  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");

  await page.reload();
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  assert.equal(await page.eval(draftSetCount), 1, 'o rascunho no IndexedDB deve ter 1 série');

  // (a) double tap: two clicks in one tick must save two sets
  await page.eval(`(() => { const b = document.querySelector('[data-action=log-set]'); b.click(); b.click(); return true; })()`);
  await page.waitFor(`(async () => (await ${draftSetCount.trim()}) === 3)()`);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await page.eval(draftSetCount), 3, 'duplo toque deve manter exatamente 3 séries');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 3");
  assert.equal(await page.eval("document.querySelectorAll('[data-set-kind=work]').length"), 3);

  // (b) move between exercises
  await page.click('[data-action=next-exercise]');
  await page.waitFor("document.body.innerText.includes('Exercício 2 de 8')");
  await page.click('[data-action=prev-exercise]');
  await page.waitFor("document.body.innerText.includes('Exercício 1 de 8')");

  // (c) Today offers to continue the open workout
  await page.goto('#/hoje');
  await page.waitFor("!!document.querySelector('[data-action=resume]')");
  assert.ok((await page.text()).includes('Continuar treino'));
  await page.click('[data-action=resume]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  // (d) finish with 6 of 8 exercises done (75% >= 70%) -> summary -> rotation moves to Treino B
  for (let i = 2; i <= 6; i++) {
    await page.click('[data-action=next-exercise]');
    await page.waitFor(`document.body.innerText.includes('Exercício ${i} de 8')`);
    await page.click('[data-action=log-set]');
    await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  }
  await page.click('[data-action=finish]');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  const summary = await page.text();
  assert.ok(summary.includes('Treino A concluído'), 'resumo deve mostrar Treino A concluído');
  assert.ok(summary.includes('Próximo treino: Treino B'), 'próximo treino deve ser B');
  await page.click('[data-action=home]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  const today = await page.text();
  assert.ok(today.includes('Treino B') && today.includes('Iniciar treino'), 'Hoje deve oferecer Treino B');
}
