// "Treino curto": starts the same template with only its first 4 exercises, finishing counts as
// a completed session (rotation flips to B, "Esta semana" goes 0 -> 1), and the summary says so.
import assert from 'node:assert/strict';

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  const text = (sel) => page.eval(`(document.querySelector('${sel}') || {}).innerText || ''`);
  assert.ok((await text('[data-role=date]')).length > 5, 'data do dia na tela Hoje');
  assert.equal(await page.eval("document.querySelector('[data-role=week]').getAttribute('data-count')"), '0', 'semana começa em 0');
  assert.ok((await text('[data-role=week]')).includes('0 de 3'), 'linha "0 de 3"');
  assert.ok((await text('h1')).includes('Treino A'), 'Treino A é o próximo');

  await page.click('[data-action=start-short]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  const draftInfo = await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    const d = await db.getActive();
    return { n: d.entries.length, short: d.short };
  })()`);
  assert.equal(draftInfo.n, 4, 'rascunho com 4 exercícios');
  assert.equal(draftInfo.short, true, 'rascunho marcado como curto');
  assert.ok((await page.text()).includes('Exercício 1 de 4'), '"Exercício 1 de 4"');

  await page.click('[data-action=log-set]');
  await page.waitFor("document.querySelectorAll('[data-set-kind=work]').length === 1");
  await page.click('[data-action=finish]');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  assert.ok((await text('h1')).includes('Treino curto'), 'título do resumo: ' + await text('h1'));
  assert.ok((await text('[data-role=date]')).length > 5, 'data no resumo');
  const saved = await page.eval(`(async () => {
    const db = await import(new URL('src/data/db.js', location.href).href);
    const s = (await db.listSessions())[0];
    return { complete: s.complete, short: s.short, n: s.entries.length };
  })()`);
  assert.deepEqual(saved, { complete: true, short: true, n: 4 }, 'sessão curta conta como concluída');

  await page.click('[data-action=home]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  assert.ok((await text('h1')).includes('Treino B'), 'rotação avança para o Treino B');
  assert.equal(await page.eval("document.querySelector('[data-role=week]').getAttribute('data-count')"), '1', 'semana = 1');
  assert.ok((await text('[data-role=week]')).includes('1 de 3'), 'linha "1 de 3"');
}
