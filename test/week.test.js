import test from 'node:test';
import assert from 'node:assert/strict';
import { weekStart, sessionsThisWeek, WEEKLY_GOAL } from '../src/domain/week.js';

const s = (localDate, complete = true) => ({ localDate, complete });

test('weekStart returns the Monday of the week (also across month/year edges)', () => {
  assert.equal(weekStart('2026-11-18'), '2026-11-16'); // Wednesday
  assert.equal(weekStart('2026-11-16'), '2026-11-16'); // Monday itself
  assert.equal(weekStart('2026-11-22'), '2026-11-16'); // Sunday belongs to the week that began Monday
  assert.equal(weekStart('2027-01-01'), '2026-12-28'); // Friday, previous year
  assert.equal(weekStart('2026-03-01'), '2026-02-23'); // Sunday, previous month
});

test('sessionsThisWeek counts only completed sessions from Monday to Sunday', () => {
  const sessions = [
    s('2026-11-15'), // Sunday before: out
    s('2026-11-16'), // Monday: in
    s('2026-11-18'), // in
    s('2026-11-19', false), // incomplete: out
    s('2026-11-22'), // Sunday: in
    s('2026-11-23'), // next Monday: out
  ];
  assert.equal(sessionsThisWeek(sessions, '2026-11-18'), 3);
  assert.equal(sessionsThisWeek(sessions, '2026-11-22'), 3);
  assert.equal(sessionsThisWeek(sessions, '2026-11-23'), 1);
  assert.equal(sessionsThisWeek([], '2026-11-18'), 0);
});

test('weekly goal is 3', () => {
  assert.equal(WEEKLY_GOAL, 3);
});
