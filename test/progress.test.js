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

// ---- exerciseLog and chartPoints ----
import { exerciseLog, chartPoints } from '../src/domain/progress.js';

const entry = (exerciseId, sets, unit) => ({ exerciseId, ...(unit ? { unit } : {}), sets });
const ses = (id, localDate, entries) => ({
  id, localDate, startedAt: Date.parse(localDate + 'T12:00:00'), endedAt: 0, templateId: 'A', complete: true, entries,
});
const W = (load, reps) => ({ kind: 'work', load, reps, at: 0 });
const LEG = { id: 'leg_press_45', type: 'reps' };
const PLANK = { id: 'plank', type: 'time' };
const CRUNCH = { id: 'crunch', type: 'reps' };

const legSessions = [
  ses('a', '2026-11-12', [entry('leg_press_45', [W(20, 12), W(20, 12)])]),
  ses('b', '2026-11-14', [entry('leg_press_45', [W(20, 12)])]),
  ses('c', '2026-11-16', [entry('leg_press_45', [{ kind: 'warmup', load: 10, reps: 8, at: 0 }, W(25, 12)])]),
  ses('d', '2026-11-17', [entry('leg_press_45', [W(30, 12)], 'kg'), entry('plank', [W(0, 30)])]),
];

test('exerciseLog: one row per session with a work set, most recent first, unit defaults to kg', () => {
  const log = exerciseLog(legSessions, 'leg_press_45');
  assert.deepEqual(log.map((r) => r.sessionId), ['d', 'c', 'b', 'a']);
  assert.equal(log[0].unit, 'kg');
  assert.equal(log[2].unit, 'kg'); // unit missing = kg
  assert.equal(log[1].sets.length, 1); // warm-up dropped
  assert.deepEqual(log[0].top, { kind: 'work', load: 30, reps: 12, at: 0 });
  assert.equal(log[0].localDate, '2026-11-17');
});

test('exerciseLog: sessions with only warm-up/ramp sets of the exercise are skipped', () => {
  const only = ses('x', '2026-11-10', [entry('leg_press_45', [{ kind: 'warmup', load: 10, reps: 8, at: 0 }])]);
  assert.deepEqual(exerciseLog([only], 'leg_press_45'), []);
  assert.deepEqual(exerciseLog([], 'leg_press_45'), []);
});

test('chartPoints: load metric, oldest first, x = days since the first session', () => {
  const c = chartPoints(exerciseLog(legSessions, 'leg_press_45'), LEG);
  assert.equal(c.metric, 'load');
  assert.equal(c.unit, 'kg');
  assert.deepEqual(c.points.map((p) => p.y), [20, 20, 25, 30]);
  assert.deepEqual(c.points.map((p) => p.x), [0, 2, 4, 5]);
  assert.equal(c.points[0].localDate, '2026-11-12');
});

test('chartPoints: plank is time (best seconds of each session)', () => {
  const s = [
    ses('p1', '2026-11-10', [entry('plank', [W(0, 30), W(0, 25)])]),
    ses('p2', '2026-11-12', [entry('plank', [W(0, 35)])]),
  ];
  const c = chartPoints(exerciseLog(s, 'plank'), PLANK);
  assert.equal(c.metric, 'time');
  assert.deepEqual(c.points.map((p) => p.y), [30, 35]);
});

test('chartPoints: all loads 0 gives reps (best reps per session)', () => {
  const s = [
    ses('c1', '2026-11-10', [entry('crunch', [W(0, 12), W(0, 15)])]),
    ses('c2', '2026-11-13', [entry('crunch', [W(0, 18)])]),
  ];
  const c = chartPoints(exerciseLog(s, 'crunch'), CRUNCH);
  assert.equal(c.metric, 'reps');
  assert.deepEqual(c.points.map((p) => p.y), [15, 18]);
  assert.deepEqual(c.points.map((p) => p.x), [0, 3]);
});

test('chartPoints: mixed units keep only the most recent unit', () => {
  const s = [
    ses('m1', '2026-11-10', [entry('lat_pulldown', [W(4, 10)], 'placa')]),
    ses('m2', '2026-11-12', [entry('lat_pulldown', [W(5, 10)], 'placa')]),
    ses('m3', '2026-11-14', [entry('lat_pulldown', [W(30, 10)], 'kg')]),
  ];
  const c = chartPoints(exerciseLog(s, 'lat_pulldown'), { id: 'lat_pulldown', type: 'reps' });
  assert.equal(c.unit, 'kg');
  assert.deepEqual(c.points.map((p) => p.y), [30]);
});

test('chartPoints: empty log gives no points', () => {
  assert.deepEqual(chartPoints([], LEG).points, []);
});
