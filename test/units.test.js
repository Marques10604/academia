import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../src/data/exercises.js';
import { PROGRAM } from '../src/data/program.js';
import { unitFor, incrementFor, historyOpts, loadLabel, PLACA_START } from '../src/domain/units.js';
import { planExercise } from '../src/domain/plan.js';
import { exerciseHistory } from '../src/domain/history.js';
import { detectPRs } from '../src/domain/records.js';
import { loadText, reasonText } from '../src/ui/reasons.js';
import { calibrationStep, roundToStep } from '../src/domain/progression.js';
import { warmupSets } from '../src/domain/draft.js';

const item = PROGRAM.A.items.find((i) => i.exerciseId === 'lat_pulldown');
const pulldown = EXERCISES.lat_pulldown;
const PLACA = { exerciseId: 'lat_pulldown', unit: 'placa' };

// A past session of `ex` with the given sets [[load, reps], ...] in the given unit (undefined = 0.2.0 session, no unit).
const sess = (n, ex, sets, unit) => ({
  id: 's' + n,
  templateId: 'A',
  startedAt: Date.UTC(2026, 11, n),
  localDate: `2026-12-${String(n).padStart(2, '0')}`,
  complete: true,
  entries: [{ exerciseId: ex, ...(unit ? { unit } : {}), sets: sets.map(([load, reps], i) => ({ load, reps, kind: 'work', at: i })) }],
});

test('only pin-loaded machines and cables can use placa', () => {
  const ids = Object.values(EXERCISES).filter((e) => e.selectorized).map((e) => e.id).sort();
  assert.deepEqual(ids, [
    'cable_triceps_pushdown', 'lat_pulldown', 'lying_leg_curl', 'pec_deck', 'seated_cable_row', 'standing_calf_raise',
  ]);
  for (const e of Object.values(EXERCISES).filter((x) => x.selectorized)) {
    assert.ok(['maquina', 'polia'].includes(e.equipment), e.id);
    assert.equal(e.type, 'reps', e.id);
  }
  assert.equal(EXERCISES.leg_press_45.selectorized, false, 'leg press e de anilhas');
});

test('unit defaults to kg and placa only applies to selectorized exercises', () => {
  assert.equal(unitFor(pulldown, undefined), 'kg');
  assert.equal(unitFor(pulldown, { incrementKg: 2.5 }), 'kg'); // record written by 0.2.0
  assert.equal(unitFor(pulldown, PLACA), 'placa');
  assert.equal(unitFor(EXERCISES.db_biceps_curl, { unit: 'placa' }), 'kg');
  assert.equal(unitFor(EXERCISES.leg_press_45, { unit: 'placa' }), 'kg');
  assert.equal(incrementFor(pulldown, { incrementKg: 2.5 }), 2.5);
  assert.equal(incrementFor(pulldown, { incrementKg: 2.5, unit: 'placa' }), 1);
  assert.equal(incrementFor(pulldown, undefined), undefined);
});

test('loadLabel and loadText say "placa N" for placa and keep kg otherwise', () => {
  assert.equal(loadLabel(6, 'placa'), 'placa 6');
  assert.equal(loadLabel(22.5, 'kg'), '22,5 kg');
  assert.equal(loadText(6, pulldown, 'placa'), 'placa 6');
  assert.equal(loadText(20, pulldown), '20 kg');
  assert.equal(loadText(8, EXERCISES.goblet_squat), '8 kg cada halter');
});

test('reason texts use the placa label', () => {
  assert.equal(reasonText('increase', { sets: 3, reps: 12, load: 6 }, pulldown, 'placa'), 'Você fez 3×12 — suba para placa 6');
  assert.equal(reasonText('hold', { load: 5 }, pulldown, 'placa'), 'Mantenha placa 5 e tente +1 repetição na série mais fraca');
  assert.equal(reasonText('layoff10', { days: 12, load: 5 }, pulldown, 'placa'), '12 dias sem treinar — retome com 90%: placa 5');
  assert.equal(reasonText('increase', { sets: 3, reps: 12, load: 25 }, pulldown), 'Você fez 3×12 — suba para 25 kg');
});

test('placa plan: first calibration starts at a small whole placa, step 1', () => {
  const plan = planExercise({ item, exercise: pulldown, history: [], incrementKg: 5, unit: 'placa', today: '2026-12-01' });
  assert.equal(plan.unit, 'placa');
  assert.equal(plan.load, PLACA_START);
  assert.equal(plan.incrementKg, 1);
  assert.equal(plan.mode, 'calibration');
  // the kg plan is unchanged
  const kg = planExercise({ item, exercise: pulldown, history: [], today: '2026-12-01' });
  assert.equal(kg.unit, 'kg');
  assert.equal(kg.load, pulldown.startLoadKg);
  assert.equal(kg.incrementKg, 5);
});

test('placa plan: loads stay whole numbers through calibration, increase and layoff', () => {
  const hist = (rows) => rows.map(([d, sets]) => ({
    localDate: `2026-12-${String(d).padStart(2, '0')}`,
    startedAt: d,
    sets: sets.map(([load, reps]) => ({ load, reps, kind: 'work' })),
    feel: null,
  }));
  const run = (rows, today) => planExercise({ item, exercise: pulldown, history: hist(rows), unit: 'placa', today });
  // 2nd calibration session: 90% of the first, rounded down to a whole placa
  assert.equal(run([[1, [[7, 10], [7, 10]]]], '2026-12-03').load, 6);
  // at the top of the range with a step of 1 placa: +1 placa (small loads need repMax + 2 reps first)
  const inc = run([[3, [[6, 14], [6, 14], [6, 14]]], [1, [[6, 12], [6, 12]]]], '2026-12-05');
  assert.equal(inc.load, 7);
  assert.equal(inc.reasonCode, 'increase');
  assert.equal(reasonText(inc.reasonCode, inc.reasonParams, pulldown, 'placa'), 'Você fez 3×14 — suba para placa 7');
  // 10+ days away: 90% rounded to a whole placa, and always lower than before
  const layoff = run([[3, [[8, 10], [8, 10]]], [1, [[8, 10], [8, 10]]]], '2026-12-20');
  assert.equal(layoff.load, 7);
  assert.equal(run([[3, [[2, 10], [2, 10]]], [1, [[2, 10], [2, 10]]]], '2026-12-20').load, 1);
  assert.equal(roundToStep(0.9 * 7, 1), 6);
});

test('placa calibration ramp steps by one placa and warm-ups are whole placas', () => {
  assert.deepEqual(calibrationStep({ rampSets: [{ load: 3, reps: 10, rir: 4 }], incrementKg: 1 }), { done: false, nextLoad: 4 });
  assert.deepEqual(calibrationStep({ rampSets: [{ load: 8, reps: 10, rir: 4 }], incrementKg: 1 }), { done: false, nextLoad: 9 });
  assert.deepEqual(calibrationStep({ rampSets: [{ load: 8, reps: 10, rir: 1 }], incrementKg: 1 }), { done: true, workingLoad: 7 });
  assert.deepEqual(warmupSets(7, 1), [{ load: 3, reps: 8 }, { load: 5, reps: 5 }]);
});

test('exerciseHistory can be limited to one unit and to after a unit change', () => {
  const sessions = [
    sess(1, 'lat_pulldown', [[30, 10]]), // 0.2.0 session: no unit = kg
    sess(2, 'lat_pulldown', [[30, 12]], 'kg'),
    sess(3, 'lat_pulldown', [[4, 10]], 'placa'),
    sess(4, 'lat_pulldown', [[5, 10]], 'placa'),
  ];
  assert.equal(exerciseHistory(sessions, 'lat_pulldown').length, 4, 'sem filtro: tudo');
  assert.deepEqual(exerciseHistory(sessions, 'lat_pulldown', { unit: 'kg' }).map((s) => s.sets[0].load), [30, 30]);
  assert.deepEqual(exerciseHistory(sessions, 'lat_pulldown', { unit: 'placa' }).map((s) => s.sets[0].load), [5, 4]);
  const since = Date.UTC(2026, 11, 4);
  assert.deepEqual(exerciseHistory(sessions, 'lat_pulldown', { unit: 'placa', since }).map((s) => s.sets[0].load), [5]);
  assert.deepEqual(historyOpts(pulldown, { unit: 'placa', unitChangedAt: 99 }), { unit: 'placa', since: 99 });
  assert.deepEqual(historyOpts(pulldown, undefined), { unit: 'kg', since: 0 });
});

test('changing the unit restarts the calibration of that exercise', () => {
  const sessions = [
    sess(1, 'lat_pulldown', [[30, 10], [30, 10]], 'kg'),
    sess(2, 'lat_pulldown', [[30, 12], [30, 12]], 'kg'),
  ];
  const pref = { exerciseId: 'lat_pulldown', unit: 'placa', unitChangedAt: Date.UTC(2026, 11, 5) };
  const history = exerciseHistory(sessions, 'lat_pulldown', historyOpts(pulldown, pref));
  assert.equal(history.length, 0);
  const plan = planExercise({
    item, exercise: pulldown, history, incrementKg: incrementFor(pulldown, pref), unit: unitFor(pulldown, pref), today: '2026-12-06',
  });
  assert.equal(plan.phase, 'calibracao');
  assert.equal(plan.load, PLACA_START);
});

test('records never compare loads across units', () => {
  const prev = [
    sess(1, 'lat_pulldown', [[40, 10]], 'kg'),
    sess(2, 'lat_pulldown', [[40, 12]], 'kg'),
    sess(3, 'lat_pulldown', [[5, 10]], 'placa'),
    sess(4, 'lat_pulldown', [[5, 12]], 'placa'),
  ].reverse();
  const cur = sess(5, 'lat_pulldown', [[6, 10]], 'placa');
  const prs = detectPRs(prev, cur);
  assert.equal(prs.length, 1, 'placa 6 supera placa 5 e nao e comparada com 40 kg');
  assert.equal(prs[0].prevLoad, 5);
  // the first placa sessions after a unit change are calibration again: no record yet
  const kgOnly = [sess(1, 'lat_pulldown', [[40, 10]], 'kg'), sess(2, 'lat_pulldown', [[40, 12]], 'kg')].reverse();
  assert.equal(detectPRs(kgOnly, cur).length, 0);
  // sessions from 0.2.0 (no unit) keep working as kg
  const old = [sess(1, 'lat_pulldown', [[40, 10]]), sess(2, 'lat_pulldown', [[40, 12]])].reverse();
  assert.equal(detectPRs(old, sess(3, 'lat_pulldown', [[42, 8]])).length, 1);
});
