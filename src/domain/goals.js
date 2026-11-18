// Pure body-goal rules (never reads the clock; the UI passes "today" as 'YYYY-MM-DD'). Every value read from
// the settings store goes through a reader here, so junk from an imported backup falls back to a safe default.
import { daysBetween, addDays } from './dates.js';
import { averageWeight, WEIGHT_MIN, WEIGHT_MAX } from './body.js';

// Progress photos every 4 weeks, same place / light / pose (TRAINING-SCIENCE 6.3): more often is just noise.
export const PHOTO_EVERY_DAYS = 28;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// lastPhotosAt: the local date of the last photos, or anything else (never photographed).
export function photoStatus(lastPhotosAt, today) {
  if (typeof lastPhotosAt !== 'string' || !DATE_RE.test(lastPhotosAt)) return { due: true, daysSince: null, dueInDays: 0 };
  const daysSince = daysBetween(lastPhotosAt, today);
  return { due: daysSince >= PHOTO_EVERY_DAYS, daysSince, dueInDays: Math.max(0, PHOTO_EVERY_DAYS - daysSince) };
}

// ---- Body-weight goal, healthy pace and the carbohydrate nudge (TRAINING-SCIENCE 5.5) ----

const TREND_DAYS = 14; // the 7-day average now against the one 14 days ago
const MIN_WEIGHINS = 2; // fewer weigh-ins than this in a window is noise, not a trend
const CARB_MIN_GAIN_KG = 0.2; // 5.5: "less than +0,10 kg per week for 2 weeks" -> add one carbohydrate portion
const PACE_MIN_PCT = 0.25; // 5.5: lean bulk for a beginner, 0,25% to 0,4% of body weight per week
const PACE_MAX_PCT = 0.4;
const DONE_KG = 0.3; // closer than this to the target counts as reached (daily weight swings more than that)

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;
const round2 = (v) => Math.round(v * 100) / 100;

// Average now (7 days ending today) against the average 14 days ago (7 days ending then). Both windows need
// 2+ weigh-ins, otherwise null. gainKg is over the 2 weeks, perWeekKg is per week.
export function weightTrend(days, today) {
  const now = averageWeight(days, today);
  const then = averageWeight(days, addDays(today, -TREND_DAYS));
  if (!now || !then || now.n < MIN_WEIGHINS || then.n < MIN_WEIGHINS) return null;
  const gainKg = round2(now.avg - then.avg);
  return { nowKg: now.avg, thenKg: then.avg, gainKg, perWeekKg: round2(gainKg / 2) };
}

// {gainKg} when the average rose less than 0,2 kg in 2 weeks (suggest one more carbohydrate portion), else null.
// Silent when the user's own goal is below his current weight (he wants to lose, so no extra food).
export function carbNudge(days, today, goal) {
  const trend = weightTrend(days, today);
  if (!trend) return null;
  if (goal && isNum(goal.targetKg) && goal.targetKg < trend.nowKg) return null;
  return trend.gainKg < CARB_MIN_GAIN_KG ? { gainKg: trend.gainKg } : null;
}

// Healthy weekly pace for a body weight, in kg, rounded to steps of 0,05 kg (integer math to avoid float noise).
export function healthyPace(kg) {
  return {
    minKg: (Math.round((kg * PACE_MIN_PCT * 10) / 50) * 5) / 100,
    maxKg: (Math.round((kg * PACE_MAX_PCT * 10) / 50) * 5) / 100,
  };
}

// The stored goal, or null when it is missing or not a complete goal in range.
export function readWeightGoal(value) {
  if (!value || typeof value !== 'object') return null;
  const ok = (n) => isNum(n) && n >= WEIGHT_MIN && n <= WEIGHT_MAX;
  if (!ok(value.targetKg) || !ok(value.startKg)) return null;
  const setAt = typeof value.setAt === 'string' && DATE_RE.test(value.setAt) ? value.setAt : null;
  return { targetKg: value.targetKg, startKg: value.startKg, setAt };
}

// Where the user stands against the goal. Weeks are worked out in integer grams at the healthy pace.
export function weightGoalStatus(goal, nowKg) {
  const diff = goal.targetKg - nowKg;
  if (Math.abs(diff) < DONE_KG) return { direction: 'done', remainingKg: 0, progressPct: 100, weeksMin: 0, weeksMax: 0 };
  const span = goal.targetKg - goal.startKg;
  const raw = span === 0 ? 100 : Math.round(((nowKg - goal.startKg) / span) * 100);
  const pace = healthyPace(nowKg);
  const remainingG = Math.round(Math.abs(diff) * 1000);
  const minG = Math.round(pace.minKg * 1000);
  const maxG = Math.round(pace.maxKg * 1000);
  return {
    direction: diff > 0 ? 'gain' : 'lose',
    remainingKg: round1(Math.abs(diff)),
    progressPct: Math.min(100, Math.max(0, raw)),
    weeksMin: Math.ceil(remainingG / maxG),
    weeksMax: Math.ceil(remainingG / minG),
  };
}

// 'slow' | 'ok' | 'fast' for the real weekly rate (kg per week, signed) against the healthy band; null without a rate.
export function paceVerdict(perWeekKg, pace, direction) {
  if (!isNum(perWeekKg)) return null;
  const rate = direction === 'lose' ? -perWeekKg : perWeekKg;
  if (rate < pace.minKg) return 'slow';
  if (rate > pace.maxKg) return 'fast';
  return 'ok';
}

// The weight a new goal starts from: the 7-day average, else the latest weigh-in, else the profile weight, else null.
export function startWeight(days, today, profileKg) {
  const avg = averageWeight(days, today);
  if (avg) return avg.avg;
  const latest = days.filter((d) => isNum(d.weightKg)).sort((a, b) => (a.localDate < b.localDate ? 1 : -1))[0];
  if (latest) return latest.weightKg;
  return isNum(profileKg) ? profileKg : null;
}
