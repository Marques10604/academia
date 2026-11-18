import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM, ROTATION, SHORT_ITEMS, workoutItems } from '../src/data/program.js';
import { isComplete } from '../src/domain/draft.js';
import { nextTemplate } from '../src/domain/history.js';
import { sessionsThisWeek } from '../src/domain/week.js';

const entry = (done) => ({ sets: done ? [{ kind: 'work', load: 20, reps: 10, at: 1 }] : [{ kind: 'warmup', load: 10, reps: 8, at: 1 }] });

test('short workout uses only the first 4 items of the template, in order', () => {
  for (const id of ROTATION) {
    const full = PROGRAM[id].items;
    const short = workoutItems(id, true);
    assert.equal(SHORT_ITEMS, 4);
    assert.equal(short.length, 4);
    assert.deepEqual(short.map((i) => i.exerciseId), full.slice(0, 4).map((i) => i.exerciseId));
    assert.equal(workoutItems(id, false).length, full.length);
  }
});

test('isComplete: full workouts need 70%; short ones count once an exercise was done', () => {
  assert.equal(isComplete([entry(true), entry(true), entry(true), entry(false)], false), true); // 3/4 = 75%
  assert.equal(isComplete([entry(true), entry(true), entry(false), entry(false)], false), false); // 50%
  assert.equal(isComplete([entry(true), entry(false), entry(false), entry(false)], true), true); // short: 1 is enough
  assert.equal(isComplete([entry(false), entry(false), entry(false), entry(false)], true), false); // nothing logged
  assert.equal(isComplete([], true), false);
  assert.equal(isComplete([entry(true), entry(true), entry(true)], false), true);
});

test('a finished short session flips the A/B rotation and adds 1 to the week count', () => {
  const entries = workoutItems('A', true).map((i, n) => ({ exerciseId: i.exerciseId, ...entry(n === 0) }));
  const session = { templateId: 'A', short: true, startedAt: 1000, localDate: '2026-11-18', complete: isComplete(entries, true), entries };
  assert.equal(session.complete, true);
  assert.equal(nextTemplate([], ROTATION), 'A');
  assert.equal(nextTemplate([session], ROTATION), 'B');
  assert.equal(sessionsThisWeek([], '2026-11-18'), 0);
  assert.equal(sessionsThisWeek([session], '2026-11-18'), 1);
});
