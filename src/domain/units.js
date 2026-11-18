// Load unit per exercise: "kg" (default) or "placa" (selectorized machines that show only 1, 2, 3...).
// Pure. A placa is just a whole number with a step of 1: the progression math is unchanged.
import { formatNumber } from './numbers.js';

// First calibration load in placa (the ramp then finds the real working load).
export const PLACA_START = 3;

// Only pin-loaded machines/cables can use "placa" (see `selectorized` in src/data/exercises.js).
export function unitFor(exercise, pref) {
  return exercise?.selectorized === true && pref?.unit === 'placa' ? 'placa' : 'kg';
}

// Increment in force for this exercise: 1 placa, or the saved kg increment (undefined = library default).
export function incrementFor(exercise, pref) {
  return unitFor(exercise, pref) === 'placa' ? 1 : pref?.incrementKg;
}

// Which past sessions count for this exercise right now: same unit, and after the last unit change.
export function historyOpts(exercise, pref) {
  return { unit: unitFor(exercise, pref), since: pref?.unitChangedAt ?? 0 };
}

// 6 -> "placa 6"; 22.5 -> "22,5 kg".
export function loadLabel(load, unit) {
  return unit === 'placa' ? `placa ${formatNumber(load)}` : `${formatNumber(load)} kg`;
}

// Free text typed by the user: no CR, trimmed, at most 120 chars.
export const NOTE_MAX = 120;
export function cleanNote(text) {
  return String(text ?? '').replace(/\r/g, '').trim().slice(0, NOTE_MAX).trim();
}
