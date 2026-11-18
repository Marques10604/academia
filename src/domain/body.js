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

// Moving average of the weigh-ins: one point per weigh-in day -> [{localDate, avg}] ascending.
export function movingAverage(days) {
  const w = days.filter((d) => isNum(d.weightKg)).sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
  return w.map((d) => ({ localDate: d.localDate, avg: averageWeight(w, d.localDate).avg }));
}

// {raw, avg} ready for the chart: x = days since the first weigh-in, y = weight / 7-day average.
export function weightSeries(days) {
  const w = days.filter((d) => isNum(d.weightKg)).sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
  if (w.length === 0) return { raw: [], avg: [] };
  const first = w[0].localDate;
  const avgs = movingAverage(days);
  return {
    raw: w.map((d) => ({ x: daysBetween(first, d.localDate), y: d.weightKg, localDate: d.localDate })),
    avg: avgs.map((a) => ({ x: daysBetween(first, a.localDate), y: a.avg, localDate: a.localDate })),
  };
}

// When the waist is due: never measured, or the last measurement is 28+ days old.
export function waistStatus(days, today) {
  const m = days.filter((d) => isNum(d.waistCm)).sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
  if (m.length === 0) return { last: null, daysSince: null, due: true, dueInDays: 0 };
  const last = m[m.length - 1];
  const daysSince = daysBetween(last.localDate, today);
  return {
    last: { localDate: last.localDate, waistCm: last.waistCm },
    daysSince,
    due: daysSince >= WAIST_EVERY_DAYS,
    dueInDays: Math.max(0, WAIST_EVERY_DAYS - daysSince),
  };
}

// Measurements, most recent first: change versus the previous (older) one, and the 7-day average weight on that date.
export function waistRows(days) {
  const m = days.filter((d) => isNum(d.waistCm)).sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
  return m.map((d, i) => ({
    localDate: d.localDate,
    waistCm: d.waistCm,
    delta: i === 0 ? null : round1(d.waistCm - m[i - 1].waistCm),
    avgWeight: averageWeight(days, d.localDate)?.avg ?? null,
  })).reverse();
}
