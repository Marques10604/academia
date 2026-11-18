// planExercise contract consumed by Today and Workout.
// Tracer behaviour: repeat the last top load, else the start load. 01-04 replaces
// the internals with phases and double progression and keeps this return shape.
import { topSet } from './history.js';

export function planExercise({ item, exercise, history, incrementKg, today }) {
  void today;
  const hasHistory = Array.isArray(history) && history.length > 0;
  const top = hasHistory ? topSet(history[0].sets) : null;
  return {
    exerciseId: item.exerciseId,
    sets: item.sets,
    repMin: item.repMin,
    repMax: item.repMax,
    restSec: item.restSec,
    load: top ? top.load : exercise.startLoadKg,
    targetReps: item.repMin,
    phase: 'base',
    mode: 'normal',
    reasonCode: hasHistory ? 'repeat' : 'start',
    reasonParams: {},
    incrementKg: incrementKg ?? exercise.incrementKg,
  };
}
