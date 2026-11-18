// Serialized write-through workout actions. IndexedDB is the only source of truth:
// nothing here keeps a draft copy in memory between calls.
import { getActive, putActive, listSessions, getAll, del, finishActive, SCHEMA_VERSION } from '../data/db.js';
import { workoutItems } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { exerciseHistory } from '../domain/history.js';
import { planExercise } from '../domain/plan.js';
import { localDate } from '../domain/dates.js';
import { undoLast, isComplete } from '../domain/draft.js';

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

export function startWorkout(templateId, now, short = false) {
  return queue(async () => {
    const sessions = await listSessions();
    const prefs = await getAll('exercisePrefs');
    const incrementById = new Map(prefs.map((p) => [p.exerciseId, p.incrementKg]));
    const today = localDate(now);
    const entries = workoutItems(templateId, short).map((item) => {
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
        incrementKg: plan.incrementKg,
        type: exercise.type,
        feel: null,
        sets: [],
      };
    });
    const draft = {
      id: 'current',
      templateId,
      short: short === true,
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
    // The end time is saved with the set, so the timer survives reload and screen-off (TREINO-05).
    draft.restEndsAt = now + entry.restSec * 1000;
    return draft;
  });
}

const clean = (v) => Math.round(v * 100) / 100;
const FEELS = ['leve', 'ponto', 'pesado'];
const incrementOf = (entry) => entry.incrementKg ?? EXERCISES[entry.exerciseId]?.incrementKg ?? 1;

// Load changes apply to every remaining set of that exercise in this workout (CARGA-06).
export function adjustLoad(entryIdx, direction) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry) return draft;
    entry.load = Math.max(0, clean(entry.load + (direction < 0 ? -1 : 1) * incrementOf(entry)));
    return draft;
  });
}

export function setLoad(entryIdx, value) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry || !Number.isFinite(value) || value < 0) return draft;
    entry.load = clean(value);
    return draft;
  });
}

export function adjustReps(entryIdx, direction) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry) return draft;
    const step = entry.type === 'time' ? 5 : 1;
    entry.reps = Math.max(1, entry.reps + (direction < 0 ? -1 : 1) * step);
    return draft;
  });
}

export function setFeel(entryIdx, feel) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry || !FEELS.includes(feel)) return draft;
    entry.feel = feel;
    return draft;
  });
}

export function undoLastSet() {
  return mutate((draft) => undoLast(draft));
}

// Warm-up sets are saved with kind 'warmup' so they never count for records or progression.
export function logWarmup(entryIdx, load, reps, now) {
  return mutate((draft) => {
    const entry = draft.entries[entryIdx];
    if (!entry) return draft;
    entry.sets.push({ load, reps, kind: 'warmup', at: now });
    draft.restEndsAt = now + 60000;
    return draft;
  });
}

export function skipRest() {
  return mutate((draft) => {
    draft.restEndsAt = null;
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

// Completion rule lives in domain/draft.js (isComplete). Runs in the queue so a set logged just before "Finalizar" is included.
export function finishWorkout(now) {
  return queue(async () => {
    const draft = await getActive();
    if (!draft) return null;
    const complete = isComplete(draft.entries, draft.short === true);
    const session = {
      ...draft,
      id: crypto.randomUUID(),
      endedAt: now,
      complete,
      schemaVersion: SCHEMA_VERSION,
      restEndsAt: null,
    };
    await finishActive(session);
    return session;
  });
}

export function discardWorkout() {
  return queue(() => del('active', 'current'));
}
