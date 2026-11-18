// Exercise library. For equipment 'halter', load means kg per dumbbell.
// For type 'time', reps means seconds and load stays 0.

const ex = (id, name, type, equipment, startLoadKg, incrementKg, noFailure, calibrate, youtubeQuery) =>
  Object.freeze({ id, name, type, equipment, startLoadKg, incrementKg, noFailure, calibrate, youtubeQuery });

const LIST = [
  ex('leg_press_45', 'Leg press 45°', 'reps', 'maquina', 20, 5, true, true, 'leg press 45 como fazer execução correta iniciante'),
  ex('db_bench_press', 'Supino reto com halteres', 'reps', 'halter', 6, 2, false, true, 'supino reto com halteres execução correta iniciante'),
  ex('lat_pulldown', 'Puxada frontal', 'reps', 'polia', 20, 5, false, true, 'puxada frontal polia execução correta iniciante'),
  ex('lying_leg_curl', 'Mesa flexora', 'reps', 'maquina', 10, 5, false, true, 'mesa flexora como fazer execução correta'),
  ex('db_lateral_raise', 'Elevação lateral', 'reps', 'halter', 2, 1, false, true, 'elevação lateral halteres execução correta'),
  ex('db_biceps_curl', 'Rosca direta', 'reps', 'halter', 5, 1, false, true, 'rosca direta halteres execução correta'),
  ex('standing_calf_raise', 'Panturrilha em pé', 'reps', 'maquina', 20, 5, false, true, 'panturrilha em pé máquina execução correta'),
  ex('plank', 'Prancha', 'time', 'peso-corporal', 0, 5, false, false, 'prancha abdominal como fazer iniciante'),
  ex('goblet_squat', 'Agachamento goblet', 'reps', 'halter', 8, 2, true, true, 'agachamento goblet como fazer iniciante'),
  ex('db_shoulder_press', 'Desenvolvimento com halteres', 'reps', 'halter', 5, 2, true, true, 'desenvolvimento com halteres sentado execução correta'),
  ex('seated_cable_row', 'Remada baixa', 'reps', 'polia', 20, 5, false, true, 'remada baixa polia execução correta iniciante'),
  ex('db_romanian_deadlift', 'Stiff com halteres', 'reps', 'halter', 8, 2, true, true, 'stiff com halteres como fazer sem machucar a lombar'),
  ex('pec_deck', 'Voador', 'reps', 'maquina', 15, 5, false, true, 'voador peck deck execução correta'),
  ex('cable_triceps_pushdown', 'Tríceps na polia', 'reps', 'polia', 10, 2.5, false, true, 'tríceps na polia corda execução correta'),
  ex('crunch', 'Abdominal', 'reps', 'peso-corporal', 0, 2.5, false, false, 'abdominal crunch execução correta sem forçar o pescoço'),
];

export const EXERCISES = Object.freeze(Object.fromEntries(LIST.map((e) => [e.id, e])));
