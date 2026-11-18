// dailyLogs store: one row per local day 'YYYY-MM-DD'. Fields (all optional except localDate):
//   weightKg, sleep (1-5), energy (1-5), waistCm, updatedAt.
// saveDay MERGES into the stored row, so a check-in never erases the waist saved the same day
// and later phases can add fields (protein...) without touching this module.
import { get, put, getAll } from './db.js';

export async function listDays() {
  const all = await getAll('dailyLogs');
  return all.sort((a, b) => (a.localDate < b.localDate ? -1 : a.localDate > b.localDate ? 1 : 0));
}

export async function getDay(localDate) {
  return (await get('dailyLogs', localDate)) ?? null;
}

// patch: a key with null/undefined deletes that field, anything else sets it.
export async function saveDay(localDate, patch) {
  const row = { ...((await get('dailyLogs', localDate)) ?? {}), localDate };
  for (const [key, val] of Object.entries(patch)) {
    if (val === null || val === undefined) delete row[key];
    else row[key] = val;
  }
  row.updatedAt = Date.now();
  await put('dailyLogs', row);
  return row;
}
