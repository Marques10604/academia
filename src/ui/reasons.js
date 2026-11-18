// pt-BR texts for the prescription shown on Today and the exercise screen.
// Formatting only: every decision is made in src/domain/progression.js.
import { formatNumber } from '../domain/numbers.js';
import { loadLabel } from '../domain/units.js';

const PHASES = { calibracao: 'Calibração', adaptacao: 'Adaptação', base: 'Base' };

export function phaseLabel(phase) {
  return PHASES[phase] ?? '';
}

// How many reps should be left in the tank (TRAINING-SCIENCE 1.5, incl. the no-failure safety override).
export function effortText(phase, exercise) {
  if (exercise.type === 'time') return 'Segure com boa forma, sem chegar ao limite';
  if (phase === 'calibracao') return 'Deixe sobrar 3–4 repetições — aprenda o movimento';
  if (phase === 'adaptacao') return 'Deixe sobrar 2–3 repetições';
  return exercise.noFailure
    ? 'Deixe sobrar 2 repetições — nunca até a falha'
    : 'Última série: deixe sobrar 1–2 repetições';
}

// 22 -> "22 kg"; dumbbells say "cada halter"; load 0 on a bodyweight exercise says so; unit 'placa' -> "placa 6".
export function loadText(load, exercise, unit = 'kg') {
  if (load === 0 && exercise.equipment === 'peso-corporal') return 'peso do corpo';
  return loadLabel(load, unit) + (exercise.equipment === 'halter' ? ' cada halter' : '');
}

// 90 -> "descanso 1:30"
export function restText(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `descanso ${m}:${s}`;
}

// One line explaining the suggestion. Unknown codes give ''.
export function reasonText(code, params, exercise, unit = 'kg') {
  const p = params || {};
  const load = p.load === undefined ? '' : loadText(p.load, exercise, unit);
  switch (code) {
    case 'increase': return `Você fez ${p.sets}×${p.reps} — suba para ${load}`;
    case 'boost': return `Você fez ${p.sets}×${p.reps} e estava leve — suba para ${load}`;
    case 'hold': return `Mantenha ${load} e tente +1 repetição na série mais fraca`;
    case 'dropFail': return `Abaixo de ${p.repMin} repetições em 2 treinos — baixe para ${load}`;
    case 'stall': return `3 treinos sem progresso — recomece com ${load} (−10%)`;
    case 'layoff10': return `${p.days} dias sem treinar — retome com 90%: ${load}`;
    case 'layoff28': return `${p.days} dias sem treinar — retome com 80%: ${load}`;
    case 'calibration': return `Calibração (treino ${p.session} de 2): comece leve e descubra sua carga`;
    case 'timeUp': return `Tente segurar ${p.seconds} s`;
    case 'timeMax': return `Você chegou a ${p.seconds} s — mantenha com boa forma`;
    default: return '';
  }
}
