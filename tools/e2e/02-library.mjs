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
  const href = await q('[data-action=youtube]', 'e => e.getAttribute("href")');
  assert.ok(href.startsWith('https://www.youtube.com/results?search_query='), 'busca do YouTube: ' + href);
  assert.equal(await q('[data-action=youtube]', 'e => e.getAttribute("target")'), '_blank');
  assert.equal(await q('[data-action=youtube]', 'e => e.getAttribute("rel")'), 'noopener');
}
