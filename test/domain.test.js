import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, parseDecimal } from '../src/domain/numbers.js';
import { nextTemplate, exerciseHistory, topSet } from '../src/domain/history.js';
import { localDate, daysBetween } from '../src/domain/dates.js';

test('parseDecimal accepts comma and dot', () => {
  assert.equal(parseDecimal('72,5'), 72.5);
  assert.equal(parseDecimal('72.5'), 72.5);
  assert.equal(parseDecimal(' 72 '), 72);
  assert.equal(parseDecimal('0,25'), 0.25);
});

test('parseDecimal rejects junk', () => {
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('abc'), null);
  assert.equal(parseDecimal('7,2,5'), null);
  assert.equal(parseDecimal('-3'), null);
  assert.equal(parseDecimal(null), null);
});

test('formatNumber uses a comma decimal', () => {
  assert.equal(formatNumber(22.5), '22,5');
  assert.equal(formatNumber(20), '20');
});

const sess = (templateId, startedAt, complete, entries = []) => ({
  id: `${templateId}${startedAt}`, templateId, startedAt, complete, entries, localDate: localDate(startedAt),
});

test('nextTemplate rotates by completed workout only', () => {
  assert.equal(nextTemplate([]), 'A');
  assert.equal(nextTemplate([sess('A', 1000, true)]), 'B');
  assert.equal(nextTemplate([sess('B', 1000, true)]), 'A');
  assert.equal(nextTemplate([sess('A', 2000, false), sess('B', 1000, true)]), 'A');
});

test('exerciseHistory keeps work sets only, most recent first', () => {
  const mk = (t, sets) => sess('A', t, true, [{ exerciseId: 'x', sets, feel: null }]);
  const w = (load, reps) => ({ load, reps, kind: 'work' });
  const sessions = [
    mk(1000, [w(10, 10)]),
    mk(3000, [{ load: 5, reps: 10, kind: 'warmup' }, w(20, 10)]),
    mk(2000, [{ load: 5, reps: 10, kind: 'ramp' }]),
  ];
  const h = exerciseHistory(sessions, 'x');
  assert.equal(h.length, 2);
  assert.equal(h[0].startedAt, 3000);
  assert.deepEqual(h[0].sets, [w(20, 10)]);
  assert.equal(h[1].startedAt, 1000);
});

test('topSet prefers load, then reps', () => {
  assert.equal(topSet([]), null);
  const best = topSet([{ load: 20, reps: 8 }, { load: 25, reps: 6 }, { load: 25, reps: 9 }]);
  assert.deepEqual(best, { load: 25, reps: 9 });
});

test('localDate and daysBetween', () => {
  assert.equal(localDate(new Date(2026, 10, 18, 23, 30).getTime()), '2026-11-18');
  assert.equal(daysBetween('2026-11-01', '2026-11-11'), 10);
  assert.equal(daysBetween('2026-11-28', '2026-12-08'), 10);
});
