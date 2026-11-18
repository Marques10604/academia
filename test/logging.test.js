import test from 'node:test';
import assert from 'node:assert/strict';
import { undoLast, warmupSets } from '../src/domain/draft.js';

const set = (at, kind = 'work') => ({ load: 20, reps: 10, kind, at });

test('undoLast removes the set with the greatest at across entries and clears the rest timer', () => {
  const draft = {
    id: 'current', restEndsAt: 99999,
    entries: [
      { exerciseId: 'a', sets: [set(100), set(300)] },
      { exerciseId: 'b', sets: [set(200)] },
    ],
  };
  const next = undoLast(draft);
  assert.deepEqual(next.entries[0].sets.map((s) => s.at), [100]);
  assert.deepEqual(next.entries[1].sets.map((s) => s.at), [200]);
  assert.equal(next.restEndsAt, null);
  assert.equal(draft.entries[0].sets.length, 2, 'does not mutate the input');
});

test('undoLast also removes a warm-up set when it is the latest', () => {
  const draft = { restEndsAt: null, entries: [{ sets: [set(1), set(2, 'warmup')] }] };
  assert.deepEqual(undoLast(draft).entries[0].sets.map((s) => s.kind), ['work']);
});

test('undoLast on a draft with no sets returns an equal draft', () => {
  const draft = { id: 'current', restEndsAt: null, entries: [{ exerciseId: 'a', sets: [] }] };
  assert.deepEqual(undoLast(draft), draft);
});

test('warmupSets gives 50% x 8 and 75% x 5 rounded down to the step', () => {
  assert.deepEqual(warmupSets(40, 5), [{ load: 20, reps: 8 }, { load: 30, reps: 5 }]);
  assert.deepEqual(warmupSets(25, 5), [{ load: 10, reps: 8 }, { load: 15, reps: 5 }]);
  assert.deepEqual(warmupSets(0, 5), []);
});

import { restRemainingMs, formatClock, overdueSeconds } from '../src/domain/timer.js';

test('restRemainingMs is endsAt minus now, never negative', () => {
  assert.equal(restRemainingMs(null, 5000), 0);
  assert.equal(restRemainingMs(91000, 1000), 90000);
  assert.equal(restRemainingMs(1000, 5000), 0);
});

test('formatClock rounds up to whole seconds as M:SS', () => {
  assert.equal(formatClock(90000), '1:30');
  assert.equal(formatClock(1), '0:01');
  assert.equal(formatClock(0), '0:00');
});

test('overdueSeconds counts whole seconds past the end time', () => {
  assert.equal(overdueSeconds(10000, 52000), 42);
  assert.equal(overdueSeconds(10000, 9000), 0);
  assert.equal(overdueSeconds(null, 9000), 0);
});

import { beats, detectPRs } from '../src/domain/records.js';

test('beats compares load first, then reps', () => {
  assert.equal(beats({ load: 30, reps: 8 }, { load: 25, reps: 12 }), true);
  assert.equal(beats({ load: 25, reps: 13 }, { load: 25, reps: 12 }), true);
  assert.equal(beats({ load: 25, reps: 12 }, { load: 25, reps: 12 }), false);
});

const sess = (startedAt, exerciseId, sets) => ({
  id: 's' + startedAt, startedAt, localDate: '2026-12-0' + startedAt,
  entries: [{ exerciseId, sets: sets.map(([load, reps, kind = 'work']) => ({ load, reps, kind, at: startedAt })) }],
});

test('detectPRs gives no PR while an exercise has fewer than 2 prior sessions', () => {
  const none = detectPRs([], sess(3, 'leg', [[30, 12]]));
  assert.deepEqual(none, []);
  const one = detectPRs([sess(1, 'leg', [[20, 12]])], sess(3, 'leg', [[30, 12]]));
  assert.deepEqual(one, []);
});

test('detectPRs reports a beaten best after 2 prior sessions', () => {
  const prior = [sess(2, 'leg', [[20, 12], [20, 11]]), sess(1, 'leg', [[20, 12]])];
  const prs = detectPRs(prior, sess(3, 'leg', [[30, 12], [25, 12]]));
  assert.deepEqual(prs, [{ exerciseId: 'leg', load: 30, reps: 12, prevLoad: 20, prevReps: 12 }]);
});

test('detectPRs ignores warm-up and ramp sets on the current session', () => {
  const prior = [sess(2, 'leg', [[20, 12]]), sess(1, 'leg', [[20, 12]])];
  const cur = sess(3, 'leg', [[100, 8, 'warmup'], [100, 5, 'ramp'], [20, 12]]);
  assert.deepEqual(detectPRs(prior, cur), []);
});

test('detectPRs ignores warm-up sets in the prior sessions too', () => {
  const prior = [sess(2, 'leg', [[100, 8, 'warmup'], [20, 12]]), sess(1, 'leg', [[20, 12]])];
  const prs = detectPRs(prior, sess(3, 'leg', [[25, 10]]));
  assert.equal(prs.length, 1);
  assert.equal(prs[0].prevLoad, 20);
});
