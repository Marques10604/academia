// The AI report: a plain pt-BR text of the user's own data, with a ready question, to paste into any free AI.
// Pure (never reads the clock, the DOM or IndexedDB). It has no name input at all, so the name saved in the
// profile can never end up in the text (privacy by construction). Nothing here talks to a network.
import { exerciseLog } from './progress.js';
import { loadLabel } from './units.js';
import { averageWeight, waistRows } from './body.js';
import { proteinTarget, proteinFloor, weekStats } from './protein.js';
import { readWeeklyGoal, weeklyStreak } from './week.js';
import { readWeightGoal, carbNudge } from './goals.js';
import { addDays, daysBetween, brDate, brShort } from './dates.js';
import { formatNumber } from './numbers.js';

export const REPORT_QUESTION = 'Sou iniciante e sigo esse treino há algumas semanas. Com base nesses dados: 1) Minhas cargas estão subindo num ritmo bom para um iniciante? 2) Minha frequência, meu sono e minha proteína estão adequados para ganhar massa? 3) O que devo ajustar nas próximas 4 semanas? Responda em português, de forma simples e prática, sem dieta com contagem de calorias.';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;
const plural = (n, one, many) => (n === 1 ? one : many);

function frequency(sessions, today, goal) {
  const done = sessions.filter((s) => s.complete === true).sort((a, b) => (a.localDate < b.localDate ? -1 : 1));
  const lines = ['FREQUÊNCIA'];
  if (done.length === 0) {
    lines.push('- Ainda não concluí nenhum treino.');
    return lines;
  }
  const recent = done.filter((s) => { const n = daysBetween(s.localDate, today); return n >= 0 && n <= 27; }).length;
  lines.push(`- Treinos concluídos: ${done.length} (desde ${brDate(done[0].localDate)})`);
  lines.push(`- Últimas 4 semanas: ${recent} treinos (média de ${formatNumber(round1(recent / 4))} por semana)`);
  lines.push(`- Último treino: ${brDate(done[done.length - 1].localDate)}`);
  const streak = weeklyStreak(sessions, today, goal).weeks;
  if (streak >= 1) lines.push(`- Sequência: ${streak} ${plural(streak, 'semana', 'semanas')} com a meta batida`);
  return lines;
}

// The best work set of a workout, as short text. Time exercises show seconds; bodyweight shows repetitions.
function setText(row, exercise, withDate) {
  const reps = Math.max(...row.sets.map((s) => s.reps));
  if (exercise.type === 'time') return `${reps} s`;
  if (row.sets.every((s) => s.load === 0)) return `${reps} repetições`;
  const text = `${loadLabel(row.top.load, row.unit)} × ${row.top.reps}`;
  return withDate ? `${text} (${brShort(row.localDate)})` : text;
}

function loads(sessions, exercises) {
  const lines = ['CARGAS (melhor série do primeiro e do último treino de cada exercício)'];
  for (const id of Object.keys(exercises || {})) {
    const log = exerciseLog(sessions, id);
    if (log.length === 0) continue;
    const ex = exercises[id];
    const first = log[log.length - 1];
    const last = log[0];
    lines.push(log.length === 1
      ? `- ${ex.name}: ${setText(first, ex, true)}, 1 treino`
      : `- ${ex.name}: ${setText(first, ex, true)} → ${setText(last, ex, true)}, ${log.length} treinos`);
  }
  if (lines.length === 1) lines.push('- Ainda sem cargas registradas.');
  return lines;
}

function body(days, today, weightGoal) {
  const lines = ['CORPO'];
  const now = averageWeight(days, today);
  lines.push(now
    ? `- Peso médio (7 dias): ${formatNumber(now.avg)} kg (${now.n} ${plural(now.n, 'pesagem', 'pesagens')})`
    : '- Sem pesagens nos últimos 7 dias.');
  const before = averageWeight(days, addDays(today, -28));
  if (before) lines.push(`- Peso médio há 4 semanas: ${formatNumber(before.avg)} kg`);
  const goal = readWeightGoal(weightGoal);
  if (goal) lines.push(`- Meta de peso: ${formatNumber(goal.targetKg)} kg`);
  const waist = waistRows(days);
  if (waist.length > 0) {
    const prev = waist[1] ? ` (antes: ${formatNumber(waist[1].waistCm)} cm em ${brShort(waist[1].localDate)})` : '';
    lines.push(`- Cintura: ${formatNumber(waist[0].waistCm)} cm em ${brShort(waist[0].localDate)}${prev}`);
  }
  if (carbNudge(days, today, goal)) {
    lines.push('- Sugestão do app: o peso médio não subiu em 2 semanas; acrescentar 1 porção de carboidrato por dia.');
  }
  return lines;
}

function meanLine(label, days, today, field) {
  const values = days
    .filter((d) => isNum(d[field]) && daysBetween(d.localDate, today) >= 0 && daysBetween(d.localDate, today) <= 13)
    .map((d) => d[field]);
  if (values.length === 0) return `- ${label}: sem registros.`;
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  return `- ${label}: média ${formatNumber(round1(mean))} (${values.length} ${plural(values.length, 'registro', 'registros')})`;
}

function protein(days, today, proteinTargetG, profileKg) {
  const lines = ['PROTEÍNA (últimos 7 dias, estimativa por porções caseiras)'];
  const target = proteinTarget({ settingG: proteinTargetG, avgKg: averageWeight(days, today)?.avg, profileKg });
  lines.push(`- Meta: ${target.g} g por dia`);
  const floor = proteinFloor(target.g);
  const stats = weekStats(days, today, floor);
  lines.push(stats.logged === 0
    ? '- Sem anotações nos últimos 7 dias.'
    : `- Média: ${stats.avg} g por dia anotado (${stats.logged} ${plural(stats.logged, 'dia', 'dias')}); ${stats.hit} ${plural(stats.hit, 'dia', 'dias')} com ${floor} g ou mais`);
  return lines;
}

// sessions/days: the stored rows. exercises: id -> {name, type}. today: 'YYYY-MM-DD'. The rest are the raw
// settings (any of them can be missing or junk from an imported backup).
export function buildReport({ sessions, days, exercises, today, weeklyGoal, proteinTargetG, weightGoal, profileKg } = {}) {
  const all = Array.isArray(sessions) ? sessions : [];
  const logs = Array.isArray(days) ? days : [];
  const goal = readWeeklyGoal(weeklyGoal);
  const sections = [
    [
      `Relatório do meu treino (app Progride), gerado em ${brDate(today)}.`,
      `Sou iniciante na musculação. Treino full body (Treino A e Treino B alternados), meta de ${goal} ${plural(goal, 'treino', 'treinos')} por semana. Objetivo: ganhar massa muscular e força.`,
    ],
    frequency(all, today, goal),
    loads(all, exercises),
    body(logs, today, weightGoal),
    ['SONO E ENERGIA (últimos 14 dias, notas de 1 a 5)', meanLine('Sono', logs, today, 'sleep'), meanLine('Energia', logs, today, 'energy')],
    protein(logs, today, proteinTargetG, profileKg),
    ['PERGUNTA', REPORT_QUESTION],
  ];
  return sections.map((lines) => lines.join('\n')).join('\n\n');
}
