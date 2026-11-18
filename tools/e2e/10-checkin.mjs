// Morning check-in (weight with comma, sleep, energy; all optional), Today's check-in line and 7-day average
// weight, the weight chart with the moving average, and the waist every 4 weeks on '#/corpo'.
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";
const datesImport = "const dates = await import(new URL('src/domain/dates.js', location.href).href);";
const todayRow = `(async () => {
  ${dbImport} ${datesImport}
  return (await db.get('dailyLogs', dates.localDate(Date.now()))) || null;
})()`;
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;
const textOf = (sel) => `(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`;
const count = (sel) => `document.querySelectorAll(${JSON.stringify(sel)}).length`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));

  // --- Task 1: check-in with only the sleep filled in ---
  assert.ok(await page.eval(has('[data-action=checkin]')), 'botao de check-in na tela Hoje');
  assert.equal(await page.eval(has('[data-role=avg-weight]')), false, 'sem pesagem, sem media');
  await page.click('[data-action=checkin]');
  await page.waitFor(has('[data-screen=corpo]'));
  await page.click('[data-sleep="4"]');
  await page.click('[data-action=save-checkin]');
  await page.waitFor(has('[data-screen=hoje]') + ' && ' + has('[data-role=checkin-today]'));
  const t1 = await page.eval(textOf('[data-role=checkin-today]'));
  assert.ok(t1.includes('Check-in de hoje: sono 4'), 'so o sono: ' + t1);
  assert.equal(t1.includes('kg'), false, 'sem peso, sem kg');
  let row = await page.eval(todayRow);
  assert.equal(row.sleep, 4);
  assert.equal('weightKg' in row, false, 'campo vazio nao e salvo');

  // --- edit: sleep chip comes back selected; weight typed with a comma; energy ---
  await page.click('[data-action=edit-checkin]');
  await page.waitFor(has('[data-screen=corpo]'));
  assert.equal(await page.eval("document.querySelector('[data-sleep=\"4\"]').classList.contains('selected')"), true);
  await page.type('input[name=checkin-weight]', '70,4');
  await page.click('[data-energy="3"]');
  await page.click('[data-action=save-checkin]');
  await page.waitFor(has('[data-screen=hoje]') + ' && ' + has('[data-role=avg-weight]'));
  const t2 = await page.text();
  assert.ok(t2.includes('Check-in de hoje: 70,4 kg · sono 4 · energia 3'), 'linha do check-in');
  assert.ok((await page.eval(textOf('[data-role=avg-weight]'))).includes('70,4 kg · 1 pesagem'), 'media com 1 pesagem');
  row = await page.eval(todayRow);
  assert.equal(row.weightKg, 70.4);
  assert.equal(row.sleep, 4);
  assert.equal(row.energy, 3);

  // --- invalid weight: message, stays on the screen, row unchanged ---
  await page.goto('#/corpo');
  await page.waitFor(has('[data-screen=corpo]'));
  await page.type('input[name=checkin-weight]', 'abc');
  await page.click('[data-action=save-checkin]');
  await page.waitFor("!document.querySelector('[data-role=checkin-error]').hidden");
  assert.ok((await page.eval(textOf('[data-role=checkin-error]'))).includes('entre 30 e 250'));
  assert.ok(await page.eval(has('[data-screen=corpo]')), 'continua no corpo');
  assert.deepEqual(await page.eval(todayRow), row, 'linha intacta');
  await page.type('input[name=checkin-weight]', '300');
  await page.click('[data-action=save-checkin]');
  assert.deepEqual(await page.eval(todayRow), row, '300 kg nao e salvo');

  // --- 7-day average on Today: six earlier weigh-ins + today's 70.4 ---
  await page.eval(`(async () => {
    ${dbImport} ${datesImport}
    const DAY = 86400000;
    const w = [70.0, 70.2, 69.8, 70.6, 70.4, 70.1];
    for (let k = 6; k >= 1; k--) await db.put('dailyLogs', { localDate: dates.localDate(Date.now() - k * DAY), weightKg: w[6 - k], updatedAt: 1 });
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.waitFor(has('[data-role=avg-weight]'));
  assert.ok((await page.eval(textOf('[data-role=avg-weight]'))).includes('70,2 kg · 7 pesagens'), 'media de 7 dias');

  // --- Task 2: weight chart (7 dots + average line) and the waist card ---
  await page.goto('#/corpo');
  await page.waitFor(has('[data-screen=corpo]') + ' && ' + has('svg.chart'));
  assert.equal(await page.eval(count('svg.chart')), 1, 'um grafico');
  assert.equal(await page.eval(count('svg.chart circle.chart-raw')), 7, 'um ponto por pesagem');
  assert.equal(await page.eval(count('svg.chart path.chart-line')), 1, 'uma linha da media');
  assert.ok((await page.eval(textOf('[data-role=weight] [data-role=avg-weight]'))).includes('70,2'));
  assert.ok((await page.eval(textOf('[data-role=waist-status]'))).includes('Hora de medir a cintura'));
  assert.equal(await page.eval(count('[data-role=waist-row]')), 0);

  // The weight card sits above the waist card.
  assert.equal(await page.eval("(() => { const w = document.querySelector('[data-role=weight]'), c = document.querySelector('[data-role=waist]');"
    + " return !!(w.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); })()"), true, 'cintura logo abaixo do peso');

  // Invalid waist: message, nothing saved.
  await page.type('input[name=waist]', 'x');
  await page.click('[data-action=save-waist]');
  await page.waitFor("!document.querySelector('[data-role=waist-error]').hidden");
  assert.ok((await page.eval(textOf('[data-role=waist-error]'))).includes('entre 40 e 200'));
  assert.equal('waistCm' in (await page.eval(todayRow)), false, 'cintura invalida nao e salva');

  // Saving the waist must never discard an unsaved check-in: type a new weight, do NOT save it, save the waist.
  await page.type('input[name=checkin-weight]', '71,9');
  await page.click('[data-sleep="2"]');
  await page.type('input[name=waist]', '82,5');
  await page.click('[data-action=save-waist]');
  await page.waitFor("(document.querySelector('[data-role=waist-row]') || {}).textContent");
  const waist1 = await page.eval(textOf('[data-role=waist-row]'));
  assert.ok(waist1.includes('82,5 cm'), waist1);
  assert.ok(waist1.includes('peso médio 70,2 kg'), waist1);
  assert.ok((await page.eval(textOf('[data-role=waist-status]'))).includes('Próxima medida em 28 dias'));
  assert.equal(await page.eval("document.querySelector('input[name=checkin-weight]').value"), '71,9', 'peso digitado continua no campo');
  assert.equal(await page.eval("document.querySelector('[data-sleep=\"2\"]').classList.contains('selected')"), true, 'chip de sono continua');
  assert.equal(await page.eval("document.querySelector('[data-sleep=\"4\"]').classList.contains('selected')"), false);
  assert.equal(await page.eval("document.querySelector('input[name=waist]').value"), '', 'campo da cintura limpo');
  row = await page.eval(todayRow);
  assert.equal(row.weightKg, 70.4, 'o peso nao salvo nao foi gravado');
  assert.equal(row.sleep, 4);
  assert.equal(row.energy, 3);
  assert.equal(row.waistCm, 82.5);

  // An older waist (30 days ago, no weight): two rows, the change is shown on the newer one.
  await page.eval(`(async () => {
    ${dbImport} ${datesImport}
    await db.put('dailyLogs', { localDate: dates.localDate(Date.now() - 30 * 86400000), waistCm: 83, updatedAt: 1 });
    return true;
  })()`);
  await page.goto('#/hoje');
  await page.waitFor(has('[data-screen=hoje]'));
  await page.goto('#/corpo');
  await page.waitFor(has('[data-screen=corpo]') + ' && ' + has('[data-role=waist-row]'));
  assert.equal(await page.eval(count('[data-role=waist-row]')), 2);
  const rows = await page.eval("Array.from(document.querySelectorAll('[data-role=waist-row]')).map((e) => e.textContent)");
  assert.ok(rows[0].includes('(−0,5 cm)'), rows[0]);
  assert.ok(rows[1].includes('83 cm'), rows[1]);
  assert.equal(rows[1].includes('('), false, 'a mais antiga nao tem variacao');
}
