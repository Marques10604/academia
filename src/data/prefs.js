// Per-exercise preferences (store exercisePrefs): incrementKg, unit ('kg' | 'placa'), unitChangedAt, note.
// Every save MERGES into the stored record, so records written by 0.2.0 (only incrementKg) keep working
// and a missing field always means "default".
import { get, put, getAll } from './db.js';

export async function loadPrefs() {
  const all = await getAll('exercisePrefs');
  return new Map(all.map((p) => [p.exerciseId, p]));
}

export async function getPref(exerciseId) {
  return (await get('exercisePrefs', exerciseId)) ?? null;
}

export async function savePref(exerciseId, patch) {
  const current = (await get('exercisePrefs', exerciseId)) ?? { exerciseId };
  await put('exercisePrefs', { ...current, ...patch, exerciseId });
}
