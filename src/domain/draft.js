// Pure helpers over the workout draft. Never touch the clock or storage.

const clean = (v) => Math.round(v * 100) / 100;

// Private on purpose: this module does not depend on progression.js.
function floorToStep(x, step) {
  if (!(step > 0)) return clean(x);
  return clean(Math.floor(x / step + 1e-9) * step);
}

// Removes the most recent set across all entries (largest "at") and clears the rest timer.
export function undoLast(draft) {
  let bestEntry = -1;
  let bestSet = -1;
  let bestAt = -Infinity;
  draft.entries.forEach((entry, ei) => {
    entry.sets.forEach((s, si) => {
      if (s.at >= bestAt) {
        bestAt = s.at;
        bestEntry = ei;
        bestSet = si;
      }
    });
  });
  const entries = draft.entries.map((entry, ei) => (
    ei === bestEntry ? { ...entry, sets: entry.sets.filter((_, si) => si !== bestSet) } : entry
  ));
  return { ...draft, entries, restEndsAt: null };
}

// Two warm-up sets before the first compound: 50% x 8 and 75% x 5 (TRAINING-SCIENCE 6.2).
export function warmupSets(load, step) {
  if (!(load > 0)) return [];
  const out = [
    { load: floorToStep(0.5 * load, step), reps: 8 },
    { load: floorToStep(0.75 * load, step), reps: 5 },
  ];
  return out.filter((s) => s.load > 0);
}
