import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readOptionalNumber, hasCheckin, averageWeight, movingAverage, weightSeries, waistStatus, waistRows, WEIGHT_MIN, WEIGHT_MAX,
} from '../src/domain/body.js';

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

const dayN = (n) => '2026-11-' + String(n).padStart(2, '0');

test('movingAverage: one point per weigh-in, mean of the weigh-ins in [day - 6, day]', () => {
  const days = Array.from({ length: 10 }, (_, i) => ({ localDate: dayN(i + 1), weightKg: 70 + i }));
  const avg = movingAverage(days);
  assert.equal(avg.length, 10);
  assert.deepEqual(avg[0], { localDate: dayN(1), avg: 70 });
  assert.equal(avg[6].avg, 73);
  assert.equal(avg[9].avg, 76);
  const sparse = movingAverage([{ localDate: dayN(1), weightKg: 70 }, { localDate: dayN(9), weightKg: 72 }]);
  assert.equal(sparse[1].avg, 72, 'day 1 is outside the window of day 9');
  assert.deepEqual(movingAverage([{ localDate: dayN(1), sleep: 3 }]), []);
});

test('weightSeries: raw and avg ascending, x = days since the first weigh-in', () => {
  const days = [{ localDate: dayN(3), weightKg: 71 }, { localDate: dayN(1), weightKg: 70 }, { localDate: dayN(2), sleep: 4 }];
  const s = weightSeries(days);
  assert.deepEqual(s.raw.map((p) => [p.x, p.y]), [[0, 70], [2, 71]]);
  assert.deepEqual(s.avg.map((p) => [p.x, p.y]), [[0, 70], [2, 70.5]]);
  assert.equal(s.raw[1].localDate, dayN(3));
  assert.deepEqual(weightSeries([]), { raw: [], avg: [] });
});

test('waistStatus: due when never measured or 28+ days ago', () => {
  assert.deepEqual(waistStatus([], dayN(18)), { last: null, daysSince: null, due: true, dueInDays: 0 });
  const ten = waistStatus([{ localDate: dayN(8), waistCm: 83 }], dayN(18));
  assert.equal(ten.due, false);
  assert.equal(ten.daysSince, 10);
  assert.equal(ten.dueInDays, 18);
  assert.deepEqual(ten.last, { localDate: dayN(8), waistCm: 83 });
  const old = waistStatus([{ localDate: '2026-10-21', waistCm: 83 }], dayN(18));
  assert.equal(old.daysSince, 28);
  assert.equal(old.due, true);
  assert.equal(old.dueInDays, 0);
  assert.equal(waistStatus([{ localDate: dayN(8), weightKg: 70 }], dayN(18)).last, null, 'a row without a waist does not count');
});

test('waistRows: most recent first, delta versus the older one, average weight of that date', () => {
  const days = [
    { localDate: '2026-10-19', waistCm: 83 },
    { localDate: dayN(16), weightKg: 70 }, { localDate: dayN(17), weightKg: 71 },
    { localDate: dayN(18), waistCm: 82.5, weightKg: 72 },
  ];
  const rows = waistRows(days);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { localDate: dayN(18), waistCm: 82.5, delta: -0.5, avgWeight: 71 });
  assert.deepEqual(rows[1], { localDate: '2026-10-19', waistCm: 83, delta: null, avgWeight: null });
});
