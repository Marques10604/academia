// Pure protein rules (no DOM, no IndexedDB, never reads the clock; the UI passes the hour and "today").
// Protein of a local day lives in that day's dailyLogs row as `protein: [{meal, food, g, at}]`. The grams are
// stored per entry, so editing the portion table later never rewrites history.
import { daysBetween } from './dates.js';

// 1,7 g per kg of body weight a day (TRAINING-SCIENCE 5.1): 70 kg -> 120 g.
export const PROTEIN_PER_KG = 1.7;
// Used until the first weigh-in exists.
export const DEFAULT_KG = 70;
// An edited daily target outside this range is a typing mistake.
export const TARGET_MIN = 40;
export const TARGET_MAX = 300;
// One tap of "Outro": 1 to 150 g of protein (a whole chicken breast is about 40 g).
export const GRAMS_MIN = 1;
export const GRAMS_MAX = 150;
export const OTHER_ID = 'outro';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export const MEALS = Object.freeze([
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche' },
  { id: 'jantar', label: 'Jantar' },
].map((m) => Object.freeze(m)));

// Cheap Brazilian home portions, no scale needed (TRAINING-SCIENCE 5.3, TACO values).
export const PORTIONS = Object.freeze([
  { id: 'ovos2', label: '2 ovos', g: 12 },
  { id: 'frango', label: 'Frango (1 filé ou palma)', g: 28 },
  { id: 'carne_moida', label: 'Carne moída (1 porção)', g: 22 },
  { id: 'sardinha', label: 'Sardinha (1 lata)', g: 20 },
  { id: 'feijao', label: 'Feijão (1 concha)', g: 6 },
  { id: 'leite', label: 'Leite (1 copo)', g: 7 },
  { id: 'queijo', label: 'Queijo (1 fatia)', g: 6 },
  { id: 'iogurte', label: 'Iogurte (1 pote)', g: 7 },
  { id: 'whey', label: 'Whey (1 dose)', g: 22 },
].map((p) => Object.freeze(p)));

// Which meal chip is preselected at this hour (0-23).
export function mealForHour(hour) {
  if (hour < 10) return 'cafe';
  if (hour < 15) return 'almoco';
  if (hour < 18) return 'lanche';
  return 'jantar';
}

// Automatic daily target: 1,7 g per kg, rounded to 5 g.
export function autoTarget(kg) {
  return Math.round((PROTEIN_PER_KG * kg) / 5) * 5;
}

// The target the user typed (a number inside the limits) wins; otherwise 1,7 g/kg of the 7-day average weight,
// else of the profile weight, else of 70 kg. -> {g, auto, kg} (kg only when automatic).
export function proteinTarget({ settingG, avgKg, profileKg } = {}) {
  if (isNum(settingG) && settingG >= TARGET_MIN && settingG <= TARGET_MAX) return { g: settingG, auto: false };
  const kg = isNum(avgKg) ? avgKg : isNum(profileKg) ? profileKg : DEFAULT_KG;
  return { g: autoTarget(kg), auto: true, kg };
}

// A day with at least this much counts as "target reached": the 112/120 ratio of 1,6 vs 1,7 g/kg (TRAINING-SCIENCE 5.1).
export function proteinFloor(targetG) {
  return Math.round((targetG * 112) / 120);
}

// Grams of protein noted on a dailyLogs row (0 when there is none).
export function dayTotal(row) {
  const list = row && Array.isArray(row.protein) ? row.protein : [];
  return Math.round(list.reduce((sum, e) => sum + (e && isNum(e.g) ? e.g : 0), 0));
}

export function portionLabel(food) {
  return PORTIONS.find((p) => p.id === food)?.label ?? 'Outro';
}

export function mealLabel(id) {
  return MEALS.find((m) => m.id === id)?.label ?? '';
}

// The 7 days ending today (today and the 6 before): only days with something noted count as "logged".
// -> {logged, avg (rounded mean of those days' totals, null when none), hit (days with a total >= floor)}.
export function weekStats(days, today, floor) {
  const totals = days
    .filter((d) => { const n = daysBetween(d.localDate, today); return n >= 0 && n <= 6; })
    .map(dayTotal)
    .filter((t) => t > 0);
  if (totals.length === 0) return { logged: 0, avg: null, hit: 0 };
  return {
    logged: totals.length,
    avg: Math.round(totals.reduce((a, t) => a + t, 0) / totals.length),
    hit: totals.filter((t) => t >= floor).length,
  };
}
