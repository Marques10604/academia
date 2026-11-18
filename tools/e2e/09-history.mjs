// History: list of saved workouts -> summary of an older workout (records only against earlier ones),
// per-exercise history with the SVG chart, and the link from the exercise screen.
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  // Four workouts: h-1 (6 days ago) ... h-4 (yesterday, short). Leg press: 20, 20, 25, 30 kg.
  await page.eval(`(async () => {
    ${dbImport}
    const dates = await import(new URL('src/domain/dates.js', location.href).href);
    const DAY = 86400000;
    const w = (load, reps) => ({ kind: 'work', load, reps, at: 0 });
    const mk = (id, daysAgo, extra, entries) => {
      const startedAt = Date.now() - daysAgo * DAY;
      return { id, templateId: 'A', startedAt, endedAt: startedAt + 50 * 60000, localDate: dates.localDate(startedAt),
        complete: true, schemaVersion: 1, ...extra, entries };
    };
    await db.put('sessions', mk('h-1', 6, {}, [
      { exerciseId: 'leg_press_45', unit: 'kg', type: 'reps', sets: [w(20, 12), w(20, 12)] },
      { exerciseId: 'plank', type: 'time', sets: [w(0, 30)] }]));
    await db.put('sessions', mk('h-2', 4, { complete: false }, [
      { exerciseId: 'leg_press_45', unit: 'kg', type: 'reps', sets: [w(20, 12), w(20, 12)] },
      { exerciseId: 'plank', type: 'time', sets: [w(0, 35)] }]));
    await db.put('sessions', mk('h-3', 2, {}, [
      { exerciseId: 'leg_press_45', unit: 'kg', type: 'reps', sets: [{ kind: 'warmup', load: 10, reps: 8, at: 0 }, w(25, 12)] },
      { exerciseId: 'lat_pulldown', unit: 'placa', type: 'reps', sets: [w(5, 10)] }]));
    await db.put('sessions', mk('h-4', 1, { short: true }, [
      { exerciseId: 'leg_press_45', unit: 'kg', type: 'reps', sets: [w(30, 12)] }]));
    return true;
  })()`);

  // --- Task 1: workout list and the summary of an older workout ---
  await page.goto('#/hoje');
  await page.reload();
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  await page.click('[data-action=history]');
  await page.waitFor("!!document.querySelector('[data-screen=historico]')");

  const order = await page.eval("[...document.querySelectorAll('[data-session]')].map((e) => e.getAttribute('data-session')).join(',')");
  assert.equal(order, 'h-4,h-3,h-2,h-1', 'treinos do mais recente ao mais antigo: ' + order);
  const rowText = (id) => page.eval(`document.querySelector('[data-session="${id}"]').innerText`);
  const r4 = await rowText('h-4');
  assert.ok(r4.includes('Treino curto: Treino A') && r4.includes('1 série') && !r4.includes('séries'), 'linha h-4: ' + r4);
  const r3 = await rowText('h-3');
  assert.ok(r3.includes('2 séries'), 'aquecimento não conta: ' + r3);
  assert.ok((await rowText('h-2')).includes('(incompleto)'), 'h-2 incompleto');
  assert.ok(!(await rowText('h-1')).includes('(incompleto)'), 'h-1 completo');

  await page.click('[data-session="h-3"] a');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  const pr = await page.eval("(document.querySelector('[data-role=pr]') || {}).innerText || ''");
  assert.ok(pr.includes('Leg press 45°') && pr.includes('25 kg × 12'), 'recorde do treino antigo: ' + pr);
  assert.ok(!(await page.text()).includes('Próximo treino'), 'treino antigo sem "Próximo treino"');
  await page.click('[data-action=history-back]');
  await page.waitFor("!!document.querySelector('[data-screen=historico]')");
  await page.click('[data-session="h-4"] a');
  await page.waitFor("!!document.querySelector('[data-screen=resumo]')");
  assert.ok((await page.text()).includes('Próximo treino'), 'o treino mais recente mantém "Próximo treino"');

  // --- Task 2: per-exercise history and the SVG chart ---
  await page.click('[data-action=home]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");
  await page.click('[data-action=history]');
  await page.waitFor("!!document.querySelector('[data-screen=historico]')");
  assert.equal(await page.eval("document.querySelectorAll('[data-history-exercise]').length"), 15, '15 exercícios na lista');
  const last = await page.eval("document.querySelector('[data-history-exercise=leg_press_45]').innerText");
  assert.ok(last.includes('último: 30 kg × 12'), 'último resultado: ' + last);
  assert.ok((await page.eval("document.querySelector('[data-history-exercise=pec_deck]').innerText")).includes('ainda sem registro'));

  await page.click('[data-history-exercise=leg_press_45] a');
  await page.waitFor("!!document.querySelector('[data-screen=evolucao]')");
  assert.equal(await page.eval("document.querySelectorAll('[data-role=history-row]').length"), 4, '4 treinos de leg press');
  const first = await page.eval("document.querySelector('[data-role=history-row]').innerText");
  assert.ok(first.includes('30 kg × 12'), 'linha mais recente: ' + first);
  assert.equal(await page.eval("document.querySelectorAll('svg.chart').length"), 1, 'um gráfico');
  assert.ok((await page.eval("document.querySelector('svg.chart').getAttribute('aria-label')")).includes('Carga'));
  assert.equal(await page.eval("document.querySelectorAll('svg.chart circle.chart-dot').length"), 4, '4 pontos');
  assert.equal(await page.eval("document.querySelectorAll('svg.chart path.chart-line').length"), 1, '1 linha');
  assert.ok((await page.eval("document.querySelector('svg.chart path.chart-line').getAttribute('d')")).startsWith('M'));

  // Hash navigation between two exercise screens: wait for the new title so the old screen is not mistaken for it.
  const open = async (id, title) => {
    await page.eval(`location.hash = '#/historico/${id}'`);
    await page.waitFor(`!!document.querySelector('[data-screen=evolucao]') && document.querySelector('h1').innerText === ${JSON.stringify(title)}`);
  };
  await open('plank', 'Prancha');
  await page.waitFor("[...document.querySelectorAll('[data-role=history-row]')].some((e) => e.innerText.includes('35 s'))");
  assert.ok((await page.eval("document.querySelector('svg.chart').getAttribute('aria-label')")).includes('Tempo'), 'prancha em segundos');
  await open('lat_pulldown', 'Puxada frontal');
  await page.waitFor("[...document.querySelectorAll('[data-role=history-row]')].some((e) => e.innerText.includes('placa 5 × 10'))");
  await open('pec_deck', 'Voador');
  await page.waitFor("document.body.innerText.includes('Ainda sem registro')");
  assert.equal(await page.eval("document.querySelectorAll('svg.chart').length"), 0, 'sem gráfico sem registros');

  await page.eval("location.hash = '#/exercicio/leg_press_45'");
  await page.click('[data-action=exercise-history]');
  await page.waitFor("!!document.querySelector('[data-screen=evolucao]') && !!document.querySelector('svg.chart')");

  await page.eval("location.hash = '#/historico/nao_existe'");
  await page.waitFor("document.body.innerText.includes('Exercício não encontrado')");
}
