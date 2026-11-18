// Full-body program, alternating A/B. Exercise ids are permanent and never reused.

const item = (exerciseId, sets, repMin, repMax, restSec) =>
  Object.freeze({ exerciseId, sets, repMin, repMax, restSec });

export const ROTATION = Object.freeze(['A', 'B']);

export const PROGRAM = Object.freeze({
  A: Object.freeze({
    id: 'A',
    name: 'Treino A',
    goal: 'Corpo todo: pernas (leg press e mesa flexora), peito, costas, ombro, bíceps, panturrilha e abdômen. Base de força com máquinas e halteres.',
    items: Object.freeze([
      item('leg_press_45', 3, 10, 15, 120),
      item('db_bench_press', 3, 8, 12, 120),
      item('lat_pulldown', 3, 8, 12, 120),
      item('lying_leg_curl', 2, 10, 15, 90),
      item('db_lateral_raise', 2, 12, 20, 60),
      item('db_biceps_curl', 2, 10, 15, 60),
      item('standing_calf_raise', 2, 10, 15, 60),
      item('plank', 2, 20, 45, 60), // seconds
    ]),
  }),
  B: Object.freeze({
    id: 'B',
    name: 'Treino B',
    goal: 'Corpo todo de novo, com outros exercícios: agachamento, ombro, remada, posterior de coxa (stiff), peito, tríceps e abdômen. Alternar A e B trabalha os mesmos músculos por ângulos diferentes.',
    items: Object.freeze([
      item('goblet_squat', 3, 8, 12, 120),
      item('db_shoulder_press', 3, 8, 12, 120),
      item('seated_cable_row', 3, 8, 12, 120),
      item('db_romanian_deadlift', 3, 8, 12, 120),
      item('pec_deck', 2, 10, 15, 90),
      item('cable_triceps_pushdown', 2, 10, 15, 60),
      item('crunch', 2, 12, 20, 60),
    ]),
  }),
});

// "Treino curto (dia corrido)": the same template, only its first SHORT_ITEMS exercises (~25 min).
export const SHORT_ITEMS = 4;

export function workoutItems(templateId, short) {
  const items = PROGRAM[templateId].items;
  return short ? items.slice(0, SHORT_ITEMS) : items;
}
