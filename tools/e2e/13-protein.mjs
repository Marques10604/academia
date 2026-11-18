// Protein without a scale: Today's "Proteína hoje" line, the #/proteina screen with meal chips and home-portion
// buttons, fast taps that are never lost, removing a wrong tap, "Outro" grams, the editable target and the 7-day line.
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";
const datesImport = "const dates = await import(new URL('src/domain/dates.js', location.href).href);";
const todayRow = `(async () => {
  ${dbImport} ${datesImport}
  return (await db.get('dailyLogs', dates.localDate(Date.now()))) || null;
})()`;
const setting = (key) => `(async () => { ${dbImport} return await db.getSetting(${JSON.stringify(key)}, null); })()`;
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
const textOf = (sel) => `(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));

  // --- Task 1: Today line, then the protein screen ---
  // Onboarding stores a 70 kg weigh-in today, so the automatic target is 1,7 x 70 = 120 g.
  assert.equal(await page.eval(textOf('[data-role=protein-line]')), 'Proteína hoje: 0 de 120 g');
  await page.click('[data-action=protein]');
  await page.waitFor(has('[data-screen=proteina]'));
  assert.equal(await page.eval("document.querySelectorAll('[data-meal].selected').length"), 1, 'uma refeicao marcada');
  await page.click('[data-meal=almoco]');
  assert.equal(await page.eval("document.querySelector('[data-meal=almoco]').classList.contains('selected')"), true);
  assert.equal(await page.eval("document.querySelectorAll('[data-meal].selected').length"), 1, 'continua uma so');

  // Three taps in the same tick: none may be lost.
  await page.eval(`(() => {
    document.querySelector('[data-portion=frango]').click();
    document.querySelector('[data-portion=frango]').click();
    document.querySelector('[data-portion=ovos2]').click();
    return true;
  })()`);
  await page.waitFor(`(async () => { ${dbImport} ${datesImport}
    const r = await db.get('dailyLogs', dates.localDate(Date.now())); return !!r && Array.isArray(r.protein) && r.protein.length === 3; })()`);
  let row = await page.eval(todayRow);
  assert.deepEqual(row.protein.map((e) => e.g), [28, 28, 12]);
  assert.ok(row.protein.every((e) => e.meal === 'almoco'), 'todas no almoco');
  assert.deepEqual(row.protein.map((e) => e.food), ['frango', 'frango', 'ovos2']);
  assert.equal(row.weightKg, 70, 'o peso do check-in continua (merge)');
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('68 de 120 g'), 'total na tela');

  await page.reload();
  await page.waitFor(has('[data-screen=proteina]'));
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('68 de 120 g'), 'total depois de recarregar');
  await page.click('[data-action=home]');
  await page.waitFor(has('[data-screen=hoje]'));
  assert.equal(await page.eval(textOf('[data-role=protein-line]')), 'Proteína hoje: 68 de 120 g');
}
