// History: list of saved workouts -> summary of an older workout (records only against earlier ones),
// per-exercise history with the SVG chart, and the link from the exercise screen.
import assert from 'node:assert/strict';

const dbImport = "const db = await import(new URL('src/data/db.js', location.href).href);";

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
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
}
