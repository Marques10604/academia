import test from 'node:test';
import assert from 'node:assert/strict';
import { readOptionalNumber, hasCheckin, averageWeight, WEIGHT_MIN, WEIGHT_MAX } from '../src/domain/body.js';

test('readOptionalNumber: comma and dot, empty is fine, junk and out of range are errors', () => {
  assert.deepEqual(readOptionalNumber('70,4', WEIGHT_MIN, WEIGHT_MAX), { value: 70.4, error: false });
  assert.deepEqual(readOptionalNumber('70.4', WEIGHT_MIN, WEIGHT_MAX), { value: 70.4, error: false });
  assert.deepEqual(readOptionalNumber('', WEIGHT_MIN, WEIGHT_MAX), { value: null, error: false });
  assert.deepEqual(readOptionalNumber('   ', WEIGHT_MIN, WEIGHT_MAX), { value: null, error: false });
  assert.deepEqual(readOptionalNumber('abc', WEIGHT_MIN, WEIGHT_MAX), { value: null, error: true });
  assert.deepEqual(readOptionalNumber('300', WEIGHT_MIN, WEIGHT_MAX), { value: null, error: true });
  assert.deepEqual(readOptionalNumber('20', WEIGHT_MIN, WEIGHT_MAX), { value: null, error: true });
  assert.deepEqual(readOptionalNumber('70,456', WEIGHT_MIN, WEIGHT_MAX), { value: 70.46, error: false });
});

test('hasCheckin: weight, sleep or energy; a waist alone is not a check-in', () => {
  assert.equal(hasCheckin({ localDate: 'x', weightKg: 70 }), true);
  assert.equal(hasCheckin({ localDate: 'x', sleep: 3 }), true);
  assert.equal(hasCheckin({ localDate: 'x', energy: 5 }), true);
  assert.equal(hasCheckin(null), false);
  assert.equal(hasCheckin({}), false);
  assert.equal(hasCheckin({ localDate: 'x', waistCm: 82 }), false);
});

test('averageWeight: mean of the weigh-ins in the 7 days ending today, rounded to 0.1', () => {
  const w = (localDate, weightKg) => ({ localDate, weightKg });
  const days = [w('2026-11-11', 90), w('2026-11-12', 70), w('2026-11-13', 71), w('2026-11-14', 72), w('2026-11-15', 70),
    w('2026-11-16', 71), w('2026-11-17', 72), w('2026-11-18', 70), { localDate: '2026-11-17b', sleep: 3 }];
  const r = averageWeight(days, '2026-11-18');
  assert.equal(r.n, 7);
  assert.equal(r.avg, 70.9);
  assert.equal(averageWeight([w('2026-11-01', 70)], '2026-11-18'), null);
  assert.equal(averageWeight([], '2026-11-18'), null);
  assert.equal(averageWeight([{ localDate: '2026-11-18', sleep: 4 }], '2026-11-18'), null);
  assert.equal(averageWeight([w('2026-11-19', 70)], '2026-11-18'), null, 'a future date is not in the window');
});
