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
const storedLength = (n) => `(async () => { ${dbImport} ${datesImport}
  const r = await db.get('dailyLogs', dates.localDate(Date.now())); return !!r && Array.isArray(r.protein) && r.protein.length === ${n}; })()`;
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

  // --- Task 2: remove a wrong tap, Outro grams, editable target, 7-day line ---
  await page.click('[data-action=protein]');
  await page.waitFor(has('[data-screen=proteina]'));
  assert.equal(await page.eval("document.querySelectorAll('[data-role=protein-item]').length"), 3, 'tres itens na lista');
  assert.ok((await page.eval(textOf('[data-role=protein-item]'))).includes('2 ovos'), 'o mais novo vem primeiro');
  await page.click('[data-action=remove-protein]'); // the newest one (2 ovos)
  await page.waitFor(storedLength(2));
  assert.deepEqual((await page.eval(todayRow)).protein.map((e) => e.g), [28, 28]);
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('56 de 120 g'));

  await page.type('input[name=protein-grams]', '15');
  await page.click('[data-action=add-grams]');
  await page.waitFor(storedLength(3));
  row = await page.eval(todayRow);
  assert.equal(row.protein[2].food, 'outro');
  assert.equal(row.protein[2].g, 15);
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('71 de 120 g'));
  assert.equal(await page.eval("document.querySelector('input[name=protein-grams]').value"), '', 'campo limpo');

  await page.type('input[name=protein-grams]', 'abc');
  await page.click('[data-action=add-grams]');
  assert.equal(await page.eval("document.querySelector('[data-role=protein-error]').hidden"), false, 'erro nos gramas');
  assert.equal((await page.eval(todayRow)).protein.length, 3, 'gramas invalidos nao sao salvos');

  // The target: 140 -> 71 de 140; 20 is refused; empty = automatic again.
  await page.type('input[name=protein-target]', '140');
  await page.waitFor(`(async () => { ${dbImport} return (await db.getSetting('proteinTargetG', null)) === 140; })()`);
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('71 de 140 g'));
  await page.type('input[name=protein-target]', '20');
  assert.equal(await page.eval("document.querySelector('[data-role=protein-target-error]').hidden"), false, 'meta invalida');
  assert.equal(await page.eval(setting('proteinTargetG')), 140, 'a meta continua 140');
  await page.type('input[name=protein-target]', '');
  await page.waitFor(`(async () => { ${dbImport} return (await db.getSetting('proteinTargetG', null)) === null; })()`);
  assert.ok((await page.eval(textOf('[data-role=protein-total]'))).startsWith('71 de 120 g'));
  assert.equal(await page.eval("document.querySelector('[data-role=protein-target-error]').hidden"), true, 'erro some');

  // Seven-day line: 120, 100, 115, 90, 130 on 1-5 days ago, 200 eight days ago, 71 today -> 6 days, average 104, 3 days >= 112.
  await page.eval(`(async () => {
    ${dbImport} ${datesImport}
    const DAY = 86400000;
    const totals = { 1: 120, 2: 100, 3: 115, 4: 90, 5: 130, 8: 200 };
    for (const [k, g] of Object.entries(totals)) {
      const d = dates.localDate(Date.now() - Number(k) * DAY);
      const old = (await db.get('dailyLogs', d)) || { localDate: d };
      await db.put('dailyLogs', { ...old, protein: [{ meal: 'almoco', food: 'outro', g, at: 1 }], updatedAt: 1 });
    }
    return true;
  })()`);
  await page.reload();
  await page.waitFor(has('[data-screen=proteina]'));
  const weekText = await page.eval(textOf('[data-role=protein-week]'));
  assert.ok(weekText.includes('média de 104 g por dia anotado (6 dias)'), weekText);
  assert.ok(weekText.includes('3 dias com 112 g ou mais'), weekText);
  assert.equal(weekText.toLowerCase().includes('kcal'), false);
  await page.click('[data-action=home]');
  await page.waitFor(has('[data-screen=hoje]'));
  assert.equal(await page.eval(textOf('[data-role=protein-line]')), 'Proteína hoje: 71 de 120 g');
}
