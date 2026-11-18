// Serialized write-through workout actions. IndexedDB is the only source of truth:
// nothing here keeps a draft copy in memory between calls.
import { getActive, putActive, listSessions, getAll } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { exerciseHistory } from '../domain/history.js';
import { planExercise } from '../domain/plan.js';
import { localDate } from '../domain/dates.js';

let chain = Promise.resolve();

// Runs async tasks one at a time, in call order. A failed task never blocks later ones.
export function queue(task) {
  const run = chain.then(task);
  chain = run.catch(() => {});
  return run;
}

// Read the draft, let fn change and return it, write it back. Returns null without a draft.
export function mutate(fn) {
  return queue(async () => {
    const draft = await getActive();
    if (!draft) return null;
    const next = fn(draft);
    await putActive(next);
    return next;
  });
}

export function startWorkout(templateId, now) {
  return queue(async () => {
    const sessions = await listSessions();
    const prefs = await getAll('exercisePrefs');
    const incrementById = new Map(prefs.map((p) => [p.exerciseId, p.incrementKg]));
    const today = localDate(now);
    const entries = PROGRAM[templateId].items.map((item) => {
      const exercise = EXERCISES[item.exerciseId];
      const plan = planExercise({
        item,
        exercise,
        history: exerciseHistory(sessions, item.exerciseId),
        incrementKg: incrementById.get(item.exerciseId),
        today,
      });
      return {
        exerciseId: item.exerciseId,
        plannedSets: plan.sets,
        repMin: plan.repMin,
        repMax: plan.repMax,
        restSec: plan.restSec,
        load: plan.load,
        reps: plan.targetReps,
        feel: null,
        sets: [],
      };
    });
    const draft = {
      id: 'current',
      templateId,
      startedAt: now,
      localDate: today,
      currentIdx: 0,
      restEndsAt: null,
      entries,
    };
    await putActive(draft);
    return draft;
  });
}

export function logSet(entryIdx, now) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry) return draft;
    entry.sets.push({ load: entry.load, reps: entry.reps, kind: 'work', at: now });
    return draft;
  });
}

export function setCurrent(idx) {
  return mutate((draft) => {
    const max = draft.entries.length - 1;
    draft.currentIdx = Math.max(0, Math.min(max, idx));
    return draft;
  });
}
