import test from 'node:test';
import assert from 'node:assert/strict';
import { photoStatus, PHOTO_EVERY_DAYS } from '../src/domain/goals.js';

test('PHOTO_EVERY_DAYS is 28 (every 4 weeks)', () => {
  assert.equal(PHOTO_EVERY_DAYS, 28);
});

test('photoStatus: never photographed is due', () => {
  assert.deepEqual(photoStatus(null, '2026-11-18'), { due: true, daysSince: null, dueInDays: 0 });
});

test('photoStatus: recent photos are not due and say when', () => {
  assert.deepEqual(photoStatus('2026-11-01', '2026-11-18'), { due: false, daysSince: 17, dueInDays: 11 });
  assert.deepEqual(photoStatus('2026-11-18', '2026-11-18'), { due: false, daysSince: 0, dueInDays: 28 });
});

test('photoStatus: due from 28 days on', () => {
  assert.deepEqual(photoStatus('2026-10-21', '2026-11-18'), { due: true, daysSince: 28, dueInDays: 0 });
  assert.equal(photoStatus('2026-10-22', '2026-11-18').due, false);
  assert.equal(photoStatus('2026-09-01', '2026-11-18').due, true);
});

test('photoStatus: a value that is not a YYYY-MM-DD string counts as never', () => {
  for (const bad of ['ontem', 5, undefined, {}, '2026-11-1', '18/11/2026']) {
    assert.deepEqual(photoStatus(bad, '2026-11-18'), { due: true, daysSince: null, dueInDays: 0 }, String(bad));
  }
});

import {
  weightTrend, carbNudge, healthyPace, readWeightGoal, weightGoalStatus, paceVerdict, startWeight,
} from '../src/domain/goals.js';
import { addDays } from '../src/domain/dates.js';

test('addDays moves a YYYY-MM-DD date across month and year edges', () => {
  assert.equal(addDays('2026-11-18', -14), '2026-11-04');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-11-18', 0), '2026-11-18');
});

const TODAY = '2026-11-18';
const w = (offset, weightKg) => ({ localDate: addDays(TODAY, offset), weightKg });
const FLAT = [w(-20, 70), w(-18, 70), w(-15, 70), w(-6, 70.1), w(-3, 70.0), w(0, 70.2)];

test('weightTrend compares the 7-day average now with the one 14 days ago', () => {
  assert.deepEqual(weightTrend(FLAT, TODAY), { nowKg: 70.1, thenKg: 70, gainKg: 0.1, perWeekKg: 0.05 });
});

test('weightTrend needs 2+ weigh-ins in each window', () => {
  assert.equal(weightTrend([w(-20, 70), w(-15, 70), w(0, 70.2)], TODAY), null);
  assert.equal(weightTrend([w(-20, 70), w(-6, 70.1), w(0, 70.2)], TODAY), null);
  assert.equal(weightTrend([], TODAY), null);
});

test('carbNudge fires when the average rose less than 0,2 kg in 2 weeks', () => {
  assert.deepEqual(carbNudge(FLAT, TODAY, null), { gainKg: 0.1 });
  assert.deepEqual(carbNudge(FLAT, TODAY, { targetKg: 75, startKg: 70 }), { gainKg: 0.1 });
});

test('carbNudge is silent with a weight-loss goal, a real gain or too little data', () => {
  assert.equal(carbNudge(FLAT, TODAY, { targetKg: 65, startKg: 70 }), null);
  const gaining = [w(-20, 70), w(-18, 70), w(-15, 70), w(-6, 70.5), w(-3, 70.6), w(0, 70.4)];
  assert.equal(carbNudge(gaining, TODAY, null), null);
  assert.equal(carbNudge([w(0, 70)], TODAY, null), null);
});

test('healthyPace is 0,25% to 0,4% of body weight per week, in steps of 0,05 kg', () => {
  assert.deepEqual(healthyPace(70), { minKg: 0.2, maxKg: 0.3 });
  assert.deepEqual(healthyPace(60), { minKg: 0.15, maxKg: 0.25 });
});

test('readWeightGoal accepts only a complete goal in range', () => {
  const ok = { targetKg: 75, startKg: 70.2, setAt: '2026-11-18' };
  assert.deepEqual(readWeightGoal(ok), ok);
  assert.deepEqual(readWeightGoal({ targetKg: 75, startKg: 70.2, setAt: 'ontem' }), { targetKg: 75, startKg: 70.2, setAt: null });
  for (const bad of [{ targetKg: 75 }, { targetKg: '75', startKg: 70 }, { targetKg: 300, startKg: 70 }, { targetKg: 75, startKg: 5 }, null, 'x', 5, undefined]) {
    assert.equal(readWeightGoal(bad), null, JSON.stringify(bad));
  }
});

test('weightGoalStatus: what is left, the progress and the weeks it implies', () => {
  assert.deepEqual(weightGoalStatus({ targetKg: 75, startKg: 70 }, 70.2),
    { direction: 'gain', remainingKg: 4.8, progressPct: 4, weeksMin: 16, weeksMax: 24 });
  assert.equal(weightGoalStatus({ targetKg: 75, startKg: 70 }, 75.1).direction, 'done');
  assert.equal(weightGoalStatus({ targetKg: 75, startKg: 70 }, 69).progressPct, 0);
  assert.equal(weightGoalStatus({ targetKg: 65, startKg: 70 }, 68).direction, 'lose');
  assert.equal(weightGoalStatus({ targetKg: 65, startKg: 70 }, 68).progressPct, 40);
});

test('paceVerdict compares the real weekly rate with the healthy band', () => {
  const pace = { minKg: 0.2, maxKg: 0.3 };
  assert.equal(paceVerdict(0.05, pace, 'gain'), 'slow');
  assert.equal(paceVerdict(0.25, pace, 'gain'), 'ok');
  assert.equal(paceVerdict(0.5, pace, 'gain'), 'fast');
  assert.equal(paceVerdict(null, pace, 'gain'), null);
  assert.equal(paceVerdict(-0.25, pace, 'lose'), 'ok');
  assert.equal(paceVerdict(0.1, pace, 'lose'), 'slow');
});

test('startWeight: 7-day average, else the latest weigh-in, else the profile, else null', () => {
  assert.equal(startWeight([w(-1, 70.2), w(0, 70.4)], TODAY, 60), 70.3);
  assert.equal(startWeight([w(-30, 68), w(-20, 69)], TODAY, 60), 69);
  assert.equal(startWeight([], TODAY, 70), 70);
  assert.equal(startWeight([], TODAY, undefined), null);
});
