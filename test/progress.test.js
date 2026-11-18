import test from 'node:test';
import assert from 'node:assert/strict';
import { workoutRows } from '../src/domain/progress.js';

const MIN = 60000;
const set = (kind, load, reps) => ({ kind, load, reps, at: 0 });
const session = (id, startedAt, extra = {}) => ({
  id, templateId: 'A', startedAt, endedAt: startedAt + 50 * MIN, localDate: '2026-11-1' + id.slice(-1),
  complete: true, entries: [], ...extra,
});

test('workoutRows: most recent first whatever the input order', () => {
  const rows = workoutRows([session('s1', 1000), session('s3', 3000), session('s2', 2000)]);
  assert.deepEqual(rows.map((r) => r.id), ['s3', 's2', 's1']);
});

test('workoutRows: minutes, short and complete flags, template', () => {
  const [row] = workoutRows([session('s1', 5000, { short: true, complete: false, templateId: 'B' })]);
  assert.equal(row.minutes, 50);
  assert.equal(row.short, true);
  assert.equal(row.complete, false);
  assert.equal(row.templateId, 'B');
  assert.equal(row.startedAt, 5000);
  assert.equal(row.localDate, '2026-11-11');
});

test('workoutRows: short is false when missing; minutes never negative', () => {
  const [row] = workoutRows([session('s1', 5000, { endedAt: 1000 })]);
  assert.equal(row.short, false);
  assert.equal(row.minutes, 0);
});

test('workoutRows: counts work sets only (warm-up and ramp are not counted)', () => {
  const entries = [
    { exerciseId: 'leg_press_45', sets: [set('warmup', 10, 8), set('ramp', 15, 8), set('work', 25, 12)] },
    { exerciseId: 'lat_pulldown', sets: [set('work', 5, 10), set('work', 5, 9)] },
  ];
  const [row] = workoutRows([session('s1', 5000, { entries })]);
  assert.equal(row.workSets, 3);
});

test('workoutRows: empty input gives an empty list', () => {
  assert.deepEqual(workoutRows([]), []);
});
