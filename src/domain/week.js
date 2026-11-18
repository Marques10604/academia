// Weekly frequency counting. Pure: "today" is passed in as 'YYYY-MM-DD', the clock is never read.

export const WEEKLY_GOAL = 3;

const pad = (n) => String(n).padStart(2, '0');

// Monday (ISO week start) of the week containing the given 'YYYY-MM-DD', as 'YYYY-MM-DD'.
export function weekStart(date) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const sinceMonday = (t.getUTCDay() + 6) % 7; // Monday 0 ... Sunday 6
  t.setUTCDate(t.getUTCDate() - sinceMonday);
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
