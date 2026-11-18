// planExercise contract consumed by Today and Workout: what to do for one exercise next time.
// Phases and double progression live in progression.js; this file only assembles the result.
import { phaseFor, suggestNext } from './progression.js';
import { PLACA_START } from './units.js';

// unit 'placa': whole-number loads, 1 placa per step, calibration starts at PLACA_START. The maths is unchanged.
export function planExercise({ item, exercise: baseExercise, history, incrementKg, today, unit }) {
  const placa = unit === 'placa';
  const exercise = placa ? { ...baseExercise, startLoadKg: PLACA_START, incrementKg: 1 } : baseExercise;
  const hist = Array.isArray(history) ? history : [];
  const inc = placa ? 1 : (incrementKg ?? exercise.incrementKg);
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
    unit: placa ? 'placa' : 'kg',
  };
}
