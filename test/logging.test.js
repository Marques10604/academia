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
