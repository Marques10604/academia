// Pure body-goal rules (never reads the clock; the UI passes "today" as 'YYYY-MM-DD'). Every value read from
// the settings store goes through a reader here, so junk from an imported backup falls back to a safe default.
import { daysBetween } from './dates.js';

// Progress photos every 4 weeks, same place / light / pose (TRAINING-SCIENCE 6.3): more often is just noise.
export const PHOTO_EVERY_DAYS = 28;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// lastPhotosAt: the local date of the last photos, or anything else (never photographed).
export function photoStatus(lastPhotosAt, today) {
  if (typeof lastPhotosAt !== 'string' || !DATE_RE.test(lastPhotosAt)) return { due: true, daysSince: null, dueInDays: 0 };
  const daysSince = daysBetween(lastPhotosAt, today);
  return { due: daysSince >= PHOTO_EVERY_DAYS, daysSince, dueInDays: Math.max(0, PHOTO_EVERY_DAYS - daysSince) };
}
