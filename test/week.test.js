import test from 'node:test';
import assert from 'node:assert/strict';
import {
  weekStart, sessionsThisWeek, DEFAULT_WEEKLY_GOAL, readWeeklyGoal, weeklyStreak, daysSinceLastWorkout, GAP_NOTICE_DAYS,
} from '../src/domain/week.js';

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

test('the default weekly goal is 3', () => {
  assert.equal(DEFAULT_WEEKLY_GOAL, 3);
});

test('readWeeklyGoal accepts 1 to 6 and falls back to 3 for anything else', () => {
  assert.equal(readWeeklyGoal(4), 4);
  assert.equal(readWeeklyGoal(1), 1);
  assert.equal(readWeeklyGoal(6), 6);
  for (const bad of [undefined, null, '4', 0, 7, 2.5, NaN, {}, [], true]) assert.equal(readWeeklyGoal(bad), 3, String(bad));
});

// n complete sessions inside the week that starts on `monday` (Monday, Tuesday...)
const week = (monday, n, complete = true) => {
  const [y, m, d] = monday.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    return s(t.toISOString().slice(0, 10), complete);
  });
};
const TODAY = '2026-11-18'; // Wednesday of the week starting 2026-11-16

test('weeklyStreak with no sessions is 0', () => {
  assert.deepEqual(weeklyStreak([], TODAY, 3), { weeks: 0, lastWeekMissed: false });
});

test('weeklyStreak counts weeks that met the goal; the current week counts once it is met', () => {
  const past = [...week('2026-10-26', 3), ...week('2026-11-02', 3), ...week('2026-11-09', 3)];
  assert.deepEqual(weeklyStreak([...past, ...week('2026-11-16', 1)], TODAY, 3), { weeks: 3, lastWeekMissed: false });
  assert.deepEqual(weeklyStreak([...past, ...week('2026-11-16', 3)], TODAY, 3), { weeks: 4, lastWeekMissed: false });
});

test('one missed week is forgiven: it neither adds nor resets', () => {
  const sessions = [...week('2026-10-26', 3), ...week('2026-11-02', 3), ...week('2026-11-09', 1)];
  assert.deepEqual(weeklyStreak(sessions, TODAY, 3), { weeks: 2, lastWeekMissed: true });
});

test('two missed weeks in a row reset the streak', () => {
  const sessions = [...week('2026-10-19', 3), ...week('2026-10-26', 3), ...week('2026-11-02', 1), ...week('2026-11-09', 2)];
  assert.equal(weeklyStreak(sessions, TODAY, 3).weeks, 0);
});

test('single misses separated by a met week are each forgiven', () => {
  const sessions = [
    ...week('2026-10-19', 3), ...week('2026-10-26', 1), ...week('2026-11-02', 3), ...week('2026-11-09', 1), ...week('2026-11-16', 3),
  ];
  assert.equal(weeklyStreak(sessions, TODAY, 3).weeks, 3);
});

test('incomplete sessions never count; the goal can be lower', () => {
  assert.equal(weeklyStreak(week('2026-11-09', 3, false), TODAY, 3).weeks, 0);
  assert.equal(weeklyStreak(week('2026-11-09', 2), TODAY, 2).weeks, 1);
});

test('weeks before the first workout are not misses; only the current week met gives 1', () => {
  assert.deepEqual(weeklyStreak(week('2026-11-16', 3), TODAY, 3), { weeks: 1, lastWeekMissed: false });
});

test('GAP_NOTICE_DAYS is 4', () => {
  assert.equal(GAP_NOTICE_DAYS, 4);
});

test('daysSinceLastWorkout uses the latest completed session only', () => {
  assert.equal(daysSinceLastWorkout([s('2026-11-12'), s('2026-11-14', false)], TODAY), 6);
  assert.equal(daysSinceLastWorkout([s('2026-11-10'), s('2026-11-12')], TODAY), 6);
  assert.equal(daysSinceLastWorkout([], TODAY), null);
  assert.equal(daysSinceLastWorkout([s('2026-11-14', false)], TODAY), null);
});
