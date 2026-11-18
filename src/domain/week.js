// Weekly frequency counting. Pure: "today" is passed in as 'YYYY-MM-DD', the clock is never read.
import { daysBetween } from './dates.js';

// Full body 3x per week is the program; 1-6 are the choices on the Config card.
export const DEFAULT_WEEKLY_GOAL = 3;
export const WEEKLY_GOAL_MAX = 6;
// At 3 workouts per week the normal gap between workouts is 2-3 days, so only 4+ days earns a kind note.
export const GAP_NOTICE_DAYS = 4;

const pad = (n) => String(n).padStart(2, '0');

// A whole number from 1 to 6 is the goal; anything else (a value read from an imported backup included) is 3.
export function readWeeklyGoal(value) {
  return Number.isInteger(value) && value >= 1 && value <= WEEKLY_GOAL_MAX ? value : DEFAULT_WEEKLY_GOAL;
}

// Monday (ISO week start) of the week containing the given 'YYYY-MM-DD', as 'YYYY-MM-DD'.
export function weekStart(date) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const sinceMonday = (t.getUTCDay() + 6) % 7; // Monday 0 ... Sunday 6
  t.setUTCDate(t.getUTCDate() - sinceMonday);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// The Monday one week before the given Monday.
function previousMonday(monday) {
  const [y, m, d] = monday.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - 7));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// Completed sessions whose local date falls in the Monday-Sunday week of `today`.
// Lexicographic compare is safe for zero-padded 'YYYY-MM-DD'.
export function sessionsThisWeek(sessions, today) {
  const start = weekStart(today);
  const t = new Date(`${start}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 6);
  const end = `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  return (sessions || []).filter((s) => s.complete === true && s.localDate >= start && s.localDate <= end).length;
}

// Weekly streak with a grace week: weeks (Monday-Sunday) that met the goal, counted back from now.
// One week below the goal is skipped (it neither adds nor resets); two in a row end the streak.
// The current week counts only once it meets the goal (in progress it is neither a hit nor a miss), and
// weeks before the first completed workout are never misses.
export function weeklyStreak(sessions, today, goal) {
  const done = (sessions || []).filter((s) => s.complete === true);
  if (done.length === 0) return { weeks: 0, lastWeekMissed: false };
  const perWeek = new Map();
  for (const s of done) {
    const w = weekStart(s.localDate);
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
  }
  const first = weekStart(done.reduce((min, s) => (s.localDate < min ? s.localDate : min), done[0].localDate));
  const current = weekStart(today);
  const met = (w) => (perWeek.get(w) ?? 0) >= goal;

  let weeks = met(current) ? 1 : 0;
  let misses = 0;
  let lastWeekMissed = false;
  let w = previousMonday(current);
  if (w >= first && !met(w)) lastWeekMissed = true;
  while (w >= first) {
    if (met(w)) {
      weeks += 1;
      misses = 0;
    } else {
      misses += 1;
      if (misses >= 2) break;
    }
    w = previousMonday(w);
  }
  return { weeks, lastWeekMissed };
}

// Days from the latest completed workout to today, or null when there is none.
export function daysSinceLastWorkout(sessions, today) {
  let last = null;
  for (const s of sessions || []) if (s.complete === true && (last === null || s.localDate > last)) last = s.localDate;
  return last === null ? null : daysBetween(last, today);
}
