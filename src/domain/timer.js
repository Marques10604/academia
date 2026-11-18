// Pure rest-timer math. Every time value is a parameter; nothing here reads the clock.
// Remaining time is always endsAt minus now, never a counter that is decremented, so the
// timer stays right after screen-off, throttled timers or a reload.

export function restRemainingMs(restEndsAt, now) {
  if (restEndsAt == null) return 0;
  return Math.max(0, restEndsAt - now);
}

export function formatClock(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function overdueSeconds(restEndsAt, now) {
  if (restEndsAt == null || now <= restEndsAt) return 0;
  return Math.floor((now - restEndsAt) / 1000);
}
