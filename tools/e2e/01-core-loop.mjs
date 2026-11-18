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
}
