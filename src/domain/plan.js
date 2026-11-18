// planExercise contract consumed by Today and Workout: what to do for one exercise next time.
// Phases and double progression live in progression.js; this file only assembles the result.
import { phaseFor, suggestNext } from './progression.js';

export function planExercise({ item, exercise, history, incrementKg, today }) {
  const hist = Array.isArray(history) ? history : [];
  const inc = incrementKg ?? exercise.incrementKg;
  const phase = phaseFor(hist.length);
  const next = suggestNext({ item, exercise, history: hist, incrementKg: inc, today });
  return {
    exerciseId: item.exerciseId,
    // Early phases use fewer sets while the body adapts (TRAINING-SCIENCE 2.x).
    sets: phase === 'base' ? item.sets : Math.min(2, item.sets),
    repMin: item.repMin,
    repMax: item.repMax,
    restSec: item.restSec,
    load: next.load,
    targetReps: next.targetReps,
    phase,
    mode: next.mode,
    reasonCode: next.reasonCode,
    reasonParams: next.reasonParams,
    incrementKg: inc,
  };
}
