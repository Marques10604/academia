// Pure body rules (never reads the clock; the UI passes "today"). Rows come from the dailyLogs store:
// { localDate, weightKg?, sleep?, energy?, waistCm?, updatedAt }.
import { parseDecimal } from './numbers.js';
import { daysBetween } from './dates.js';

// Same limits as the onboarding screen: anything outside is a typing mistake.
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 250;
// A waist tape measure reads roughly 40-200 cm for an adult.
export const WAIST_MIN = 40;
export const WAIST_MAX = 200;
// Daily weight moves 0.5-1.5 kg with water and food (TRAINING-SCIENCE 6.3): decide on the 7-day average.
export const AVG_DAYS = 7;
// Tape measure every 4 weeks: waist changes slowly, more often is just noise.
export const WAIST_EVERY_DAYS = 28;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;

// '' -> {value: null, error: false}; '70,4' -> {value: 70.4}; text or out of [min, max] -> {value: null, error: true}.
export function readOptionalNumber(text, min, max) {
  if (String(text ?? '').trim() === '') return { value: null, error: false };
  const n = parseDecimal(text);
  if (n === null || n < min || n > max) return { value: null, error: true };
  return { value: Math.round(n * 100) / 100, error: false };
}

// True when the day has a weight, sleep or energy (a row holding only the waist is not a check-in).
export function hasCheckin(row) {
  return !!row && (isNum(row.weightKg) || isNum(row.sleep) || isNum(row.energy));
}

// Mean weight of the weigh-ins in the 7 days ending today (today and the 6 before) -> {avg, n} or null.
export function averageWeight(days, today) {
  const w = days.filter((d) => isNum(d.weightKg) && daysBetween(d.localDate, today) >= 0 && daysBetween(d.localDate, today) <= AVG_DAYS - 1);
  if (w.length === 0) return null;
  return { avg: round1(w.reduce((a, d) => a + d.weightKg, 0) / w.length), n: w.length };
}
