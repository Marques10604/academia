import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, roundToStep, roundDownToStep, phaseFor, suggestNext, calibrationStep } from '../src/domain/progression.js';
import { planExercise } from '../src/domain/plan.js';
import { EXERCISES } from '../src/data/exercises.js';

const TODAY = '2026-12-20';

// sets are [load, reps] pairs; startedAt is only used for ordering by exerciseHistory, not here.
const session = (localDate, sets, feel = null) => ({
  localDate,
  startedAt: Date.parse(localDate + 'T09:00:00Z'),
  sets: sets.map(([load, reps]) => ({ kind: 'work', load, reps })),
  feel,
});
const rep3 = (load, reps) => [[load, reps], [load, reps], [load, reps]];

const LEG = { item: { exerciseId: 'leg_press_45', sets: 3, repMin: 10, repMax: 15, restSec: 120 }, exercise: EXERCISES.leg_press_45, incrementKg: 5 };
const BENCH = { item: { exerciseId: 'db_bench_press', sets: 3, repMin: 8, repMax: 12, restSec: 120 }, exercise: EXERCISES.db_bench_press, incrementKg: 2 };
const PLANK = { item: { exerciseId: 'plank', sets: 2, repMin: 20, repMax: 45, restSec: 60 }, exercise: EXERCISES.plank, incrementKg: 5 };
const CRUNCH = { item: { exerciseId: 'crunch', sets: 2, repMin: 12, repMax: 20, restSec: 60 }, exercise: EXERCISES.crunch, incrementKg: 2.5 };
const LAT = { item: { exerciseId: 'lat_pulldown', sets: 3, repMin: 8, repMax: 12, restSec: 120 }, exercise: EXERCISES.lat_pulldown, incrementKg: 5 };

const run = (base, history, today = TODAY) => suggestNext({ ...base, history, today });

test('phaseFor: calibração, adaptação, base', () => {
  assert.equal(phaseFor(0), 'calibracao');
  assert.equal(phaseFor(1), 'calibracao');
  for (const n of [2, 3, 4, 5]) assert.equal(phaseFor(n), 'adaptacao');
  assert.equal(phaseFor(6), 'base');
  assert.equal(phaseFor(40), 'base');
});

test('RULES is frozen with the documented constants', () => {
  assert.ok(Object.isFrozen(RULES));
  assert.equal(RULES.LAYOFF_DAYS, 10);
  assert.equal(RULES.LONG_LAYOFF_DAYS, 28);
  assert.equal(RULES.LAYOFF_PCT, 0.9);
  assert.equal(RULES.LONG_LAYOFF_PCT, 0.8);
  assert.equal(RULES.FAIL_SESSIONS, 2);
  assert.equal(RULES.STALL_SESSIONS, 3);
});

test('roundToStep / roundDownToStep: step multiples without float noise', () => {
  assert.equal(roundToStep(27, 5), 25);
  assert.equal(roundToStep(28, 5), 30);
  assert.equal(roundToStep(20.25, 2.5), 20);
  assert.equal(roundToStep(0.1 + 0.2, 0.1), 0.3);
  assert.equal(roundDownToStep(27, 5), 25);
  assert.equal(roundDownToStep(29.99, 5), 25);
  assert.equal(roundDownToStep(-3, 5), 0);
  assert.equal(roundToStep(-3, 5), 0);
});

test('calibration: no history starts at the start load, session 1', () => {
  const r = run(LEG, []);
  assert.equal(r.mode, 'calibration');
  assert.equal(r.load, EXERCISES.leg_press_45.startLoadKg);
  assert.equal(r.reasonCode, 'calibration');
  assert.equal(r.reasonParams.session, 1);
  assert.equal(r.targetReps, 10);
});

test('calibration: one prior session restarts at 90% rounded down to the increment', () => {
  const r = run(LEG, [session('2026-12-18', rep3(30, 10))]);
  assert.equal(r.mode, 'calibration');
  assert.equal(r.load, 25);
  assert.equal(r.reasonParams.session, 2);
});

test('calibration for a time exercise targets repMin seconds', () => {
  const r = run(PLANK, []);
  assert.equal(r.load, 0);
  assert.equal(r.targetReps, 20);
});

test('increase: all sets at the top of the range -> +increment', () => {
  const r = run(LEG, [session('2026-12-18', rep3(60, 15)), session('2026-12-15', rep3(60, 12))]);
  assert.equal(r.load, 65);
  assert.equal(r.reasonCode, 'increase');
  assert.deepEqual(r.reasonParams, { sets: 3, reps: 15, load: 65 });
  assert.equal(r.targetReps, 10);
  assert.equal(r.mode, 'normal');
});

test('increase: a jump over 10% of the load needs repMax + 2', () => {
  const two = (reps) => [session('2026-12-18', rep3(6, reps)), session('2026-12-15', rep3(6, 10))];
  const held = run(BENCH, two(12));
  assert.equal(held.load, 6);
  assert.equal(held.reasonCode, 'hold');
  const up = run(BENCH, two(14));
  assert.equal(up.load, 8);
  assert.equal(up.reasonCode, 'increase');
});

test('boost: early session with feel "leve" doubles the step (capped at 10%)', () => {
  const boosted = run(LEG, [session('2026-12-18', rep3(100, 15), 'leve'), session('2026-12-15', rep3(100, 12))]);
  assert.equal(boosted.load, 110);
  assert.equal(boosted.reasonCode, 'boost');
  const prior = Array.from({ length: 12 }, (_, i) => session(`2026-11-${String(i + 1).padStart(2, '0')}`, rep3(100, 12)));
  const late = run(LEG, [session('2026-12-18', rep3(100, 15), 'leve'), ...prior]); // 13 prior sessions
  assert.equal(late.load, 105);
  assert.equal(late.reasonCode, 'increase');
});

test('dropFail: two sessions in a row below repMin at the same load -> lower', () => {
  const bad = [[40, 10], [40, 9], [40, 7]];
  const r = run(LAT, [session('2026-12-18', bad), session('2026-12-15', bad)]);
  assert.equal(r.load, 35);
  assert.equal(r.reasonCode, 'dropFail');
  assert.equal(r.reasonParams.repMin, 8);
});

test('only the latest session failing holds the load', () => {
  const r = run(LAT, [session('2026-12-18', [[40, 10], [40, 9], [40, 7]]), session('2026-12-15', rep3(40, 10))]);
  assert.equal(r.load, 40);
  assert.equal(r.reasonCode, 'hold');
});

test('stall: three sessions at the same load without more reps -> 90% rounded to the step', () => {
  // oldest to newest totals: 30, 31, 30
  const r = run(LAT, [
    session('2026-12-18', rep3(40, 10)),
    session('2026-12-15', [[40, 11], [40, 10], [40, 10]]),
    session('2026-12-12', rep3(40, 10)),
  ]);
  assert.equal(r.load, 35);
  assert.equal(r.reasonCode, 'stall');
});

test('stall that rounds back to the same load goes down one increment', () => {
  const r = run(BENCH, [
    session('2026-12-18', rep3(6, 9)),
    session('2026-12-15', rep3(6, 10)),
    session('2026-12-12', rep3(6, 10)),
  ]);
  assert.equal(r.load, 4);
  assert.equal(r.reasonCode, 'stall');
});

test('three sessions with real progress are not a stall', () => {
  const r = run(LAT, [
    session('2026-12-18', rep3(40, 11)),
    session('2026-12-15', rep3(40, 10)),
    session('2026-12-12', rep3(40, 9)),
  ]);
  assert.equal(r.reasonCode, 'hold');
  assert.equal(r.load, 40);
});

test('layoff: 10+ days -> 90%, 28+ days -> 80%, never for load 0', () => {
  const hist = (date) => [session(date, rep3(50, 12)), session('2026-11-01', rep3(50, 12))];
  const a = run(LEG, hist('2026-12-08')); // 12 days before 2026-12-20
  assert.equal(a.load, 45);
  assert.equal(a.reasonCode, 'layoff10');
  assert.equal(a.reasonParams.days, 12);
  const b = run(LEG, hist('2026-11-20')); // 30 days
  assert.equal(b.load, 40);
  assert.equal(b.reasonCode, 'layoff28');
  assert.equal(b.reasonParams.days, 30);
  const c = run(CRUNCH, [session('2026-11-20', rep3(0, 14)), session('2026-11-10', rep3(0, 14))]);
  assert.equal(c.load, 0);
  assert.ok(!c.reasonCode.startsWith('layoff'));
});

test('layoff never suggests a load equal to the last one', () => {
  const r = run(BENCH, [session('2026-12-01', rep3(2, 10)), session('2026-11-20', rep3(2, 10))]);
  assert.ok(r.load < 2);
  assert.equal(r.reasonCode, 'layoff10');
});

test('time exercise: +increment seconds, capped at repMax', () => {
  const up = run(PLANK, [session('2026-12-18', [[0, 30], [0, 28]]), session('2026-12-15', [[0, 30]])]);
  assert.equal(up.load, 0);
  assert.equal(up.targetReps, 35);
  assert.equal(up.reasonCode, 'timeUp');
  const max = run(PLANK, [session('2026-12-18', [[0, 45], [0, 40]]), session('2026-12-15', [[0, 30]])]);
  assert.equal(max.targetReps, 45);
  assert.equal(max.reasonCode, 'timeMax');
});

test('hold targets the weakest set + 1 rep, capped at repMax', () => {
  const r = run(LAT, [session('2026-12-18', [[40, 10], [40, 9], [40, 8]]), session('2026-12-15', rep3(40, 9))]);
  assert.equal(r.load, 40);
  assert.equal(r.targetReps, 9);
  assert.equal(r.reasonCode, 'hold');
  const cap = run(BENCH, [session('2026-12-18', rep3(6, 12)), session('2026-12-15', rep3(6, 10))]);
  assert.equal(cap.targetReps, 12);
});

test('results carry no float noise', () => {
  const r = run(
    { ...BENCH, incrementKg: 0.1, exercise: { ...EXERCISES.db_bench_press } },
    [session('2026-12-18', rep3(0.7, 12)), session('2026-12-15', rep3(0.7, 12))],
  );
  assert.equal(r.load, Math.round(r.load * 100) / 100);
});

test('suggestNext never reads the clock (source check)', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../src/domain/progression.js', import.meta.url), 'utf8');
  assert.equal(/Date\.now|new Date\(/.test(src), false);
});

test('planExercise: sets by phase and shape preserved', () => {
  const none = planExercise({ ...LEG, history: [], today: TODAY });
  assert.equal(none.sets, 2);
  assert.equal(none.phase, 'calibracao');
  assert.equal(none.mode, 'calibration');
  for (const k of ['exerciseId', 'sets', 'repMin', 'repMax', 'restSec', 'load', 'targetReps', 'phase', 'mode', 'reasonCode', 'reasonParams', 'incrementKg']) {
    assert.ok(k in none, k);
  }
  const hist6 = Array.from({ length: 6 }, (_, i) => session(`2026-12-${String(10 + i).padStart(2, '0')}`, rep3(60, 10 + i % 2)));
  const base = planExercise({ ...LEG, history: hist6.reverse(), today: '2026-12-18' });
  assert.equal(base.phase, 'base');
  assert.equal(base.sets, 3);
  const adapt = planExercise({ ...LEG, history: [session('2026-12-18', rep3(60, 15)), session('2026-12-15', rep3(60, 12))], today: TODAY });
  assert.equal(adapt.phase, 'adaptacao');
  assert.equal(adapt.sets, 2);
  assert.equal(adapt.load, 65);
  assert.equal(adapt.incrementKg, 5);
});

// ---- calibrationStep: guided ramp of sets of 10 (TRAINING-SCIENCE 4) ----
const ramp = (...pairs) => pairs.map(([load, rir]) => ({ load, reps: 10, rir }));

test('calibrationStep: rir 4+ raises the load by one increment at least', () => {
  assert.deepEqual(calibrationStep({ rampSets: ramp([20, 4]), incrementKg: 5 }), { done: false, nextLoad: 25 });
});

test('calibrationStep: the step is about +15% rounded to the increment', () => {
  assert.deepEqual(calibrationStep({ rampSets: ramp([60, 4]), incrementKg: 5 }), { done: false, nextLoad: 70 });
});

test('calibrationStep: rir 3 or 2 keeps the load as the working load', () => {
  assert.deepEqual(calibrationStep({ rampSets: ramp([20, 4], [25, 3]), incrementKg: 5 }), { done: true, workingLoad: 25 });
  assert.deepEqual(calibrationStep({ rampSets: ramp([20, 2]), incrementKg: 5 }), { done: true, workingLoad: 20 });
});

test('calibrationStep: rir 1 or 0 steps back one increment, never to zero', () => {
  assert.deepEqual(calibrationStep({ rampSets: ramp([20, 4], [25, 1]), incrementKg: 5 }), { done: true, workingLoad: 20 });
  assert.deepEqual(calibrationStep({ rampSets: ramp([5, 0]), incrementKg: 5 }), { done: true, workingLoad: 5 });
});

test('calibrationStep: at most MAX_RAMP_SETS ramp sets', () => {
  assert.equal(RULES.MAX_RAMP_SETS, 4);
  const four = ramp([20, 4], [25, 4], [30, 4], [35, 4]);
  assert.deepEqual(calibrationStep({ rampSets: four, incrementKg: 5 }), { done: true, workingLoad: 35 });
  assert.equal(calibrationStep({ rampSets: four.slice(0, 3), incrementKg: 5 }).done, false);
});
