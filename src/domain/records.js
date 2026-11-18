// Pure personal-record detection. Derived on read from work sets only; nothing is stored,
// so correcting a set heals the records automatically.
import { exerciseHistory, topSet } from './history.js';

// a beats b when it has more load, or the same load with more reps.
export function beats(a, b) {
  return a.load > b.load || (a.load === b.load && a.reps > b.reps);
}

// Records of `session` against the sessions before it. The first two sessions of an exercise
// are calibration (every set would be a "record"), so they never produce one (EVOL-03).
// Warm-up and ramp sets are ignored on both sides: exerciseHistory and the filter keep 'work' only.
export function detectPRs(prevSessionsDesc, session) {
  const out = [];
  for (const entry of session.entries || []) {
    const work = (entry.sets || []).filter((s) => s.kind === 'work');
    if (work.length === 0) continue;
    const prior = exerciseHistory(prevSessionsDesc, entry.exerciseId);
    if (prior.length < 2) continue;
    const prevBest = topSet(prior.flatMap((p) => p.sets));
    const cur = topSet(work);
    if (prevBest && cur && beats(cur, prevBest)) {
      out.push({
        exerciseId: entry.exerciseId,
        load: cur.load,
        reps: cur.reps,
        prevLoad: prevBest.load,
        prevReps: prevBest.reps,
      });
    }
  }
  return out;
}
