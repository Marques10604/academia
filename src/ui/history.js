// History screens: '#/historico' (saved workouts + exercises) and '#/historico/<id>' (one exercise: chart + sessions).
import { h } from './dom.js';
import { listSessions } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { workoutRows, exerciseLog, chartPoints } from '../domain/progress.js';
import { brDate, brShort } from '../domain/dates.js';
import { dayText } from './datefmt.js';
import { setsText } from './summary.js';
import { lineChart } from './chart.js';

function workoutItem(row) {
  const name = (row.short ? 'Treino curto: ' : '') + (PROGRAM[row.templateId]?.name ?? 'Treino') + (row.complete ? '' : ' (incompleto)');
  return h('li', { class: 'list-item', 'data-session': row.id },
    h('div', { class: 'stack', style: { gap: '4px', flex: '1' } },
      h('a', { href: '#/resumo/' + encodeURIComponent(row.id) }, name),
      h('span', { class: 'muted small' },
        `${dayText(row.startedAt)} · ${row.minutes} min · ${row.workSets} ${row.workSets === 1 ? 'série' : 'séries'}`)));
}

function exerciseItem(exercise, sessions) {
  const last = exerciseLog(sessions, exercise.id)[0];
  return h('li', { class: 'list-item', 'data-history-exercise': exercise.id },
    h('div', { class: 'stack', style: { gap: '4px', flex: '1' } },
      h('a', { href: '#/historico/' + exercise.id }, exercise.name),
      h('span', { class: 'muted small' }, last ? 'último: ' + setsText(exercise, last.sets, last.unit) : 'ainda sem registro')));
}

function renderList(sessions) {
  const rows = workoutRows(sessions);
  const ids = [...PROGRAM.A.items, ...PROGRAM.B.items].map((i) => i.exerciseId);
  return h('div', { class: 'screen', 'data-screen': 'historico' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Histórico')),
    h('h2', null, 'Treinos'),
    rows.length === 0
      ? h('p', { class: 'muted' }, 'Nenhum treino ainda. Seus treinos aparecem aqui quando você finalizar.')
      : h('ul', { class: 'list' }, rows.map(workoutItem)),
    h('h2', null, 'Exercícios'),
    h('ul', { class: 'list' }, ids.map((id) => exerciseItem(EXERCISES[id], sessions))),
    h('div', { class: 'bottom-bar' },
      h('a', { class: 'btn btn-big', 'data-action': 'back-today', href: '#/hoje' }, 'Voltar')));
}

function chartHeading(chart) {
  if (chart.metric === 'time') return 'Tempo — melhor série (s)';
  if (chart.metric === 'reps') return 'Repetições — melhor série';
  return `Carga — melhor série de cada treino (${chart.unit === 'placa' ? 'placa' : 'kg'})`;
}

function renderExerciseHistory(exercise, sessions) {
  const log = exerciseLog(sessions, exercise.id);
  const chart = chartPoints(log, exercise);
  const heading = chartHeading(chart);
  const first = chart.points[0];
  const last = chart.points[chart.points.length - 1];
  return h('div', { class: 'screen', 'data-screen': 'evolucao' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, exercise.name)),
    h('div', { class: 'card', 'data-role': 'chart' },
      h('h2', null, heading),
      chart.points.length >= 2
        ? lineChart([{ points: chart.points, style: 'linedots' }], {
          label: heading, xLabels: [brShort(first.localDate), brShort(last.localDate)],
        })
        : h('p', { class: 'muted' }, 'Faça mais um treino deste exercício para ver o gráfico.')),
    log.length === 0
      ? h('p', { class: 'muted' }, 'Ainda sem registro deste exercício.')
      : h('ul', { class: 'list' }, log.map((r) => h('li', { class: 'list-item', 'data-role': 'history-row' },
        brDate(r.localDate) + ' · ' + setsText(exercise, r.sets, r.unit)))),
    h('div', { class: 'bottom-bar' },
      h('a', { class: 'btn', 'data-action': 'how-to', href: '#/exercicio/' + exercise.id }, 'Como fazer'),
      h('button', { class: 'btn btn-ghost', 'data-action': 'back', onclick: () => history.back() }, '‹ Voltar')));
}

export async function renderHistory(hash) {
  const sessions = await listSessions();
  if (!String(hash || '').startsWith('#/historico/')) return renderList(sessions);
  let id = '';
  try {
    id = decodeURIComponent(hash.slice('#/historico/'.length));
  } catch { /* malformed escape: treated as unknown id */ }
  if (!Object.hasOwn(EXERCISES, id)) {
    return h('div', { class: 'screen', 'data-screen': 'evolucao' },
      h('h1', { class: 'title' }, 'Exercício não encontrado'),
      h('a', { class: 'btn btn-primary', href: '#/historico' }, 'Voltar ao histórico'));
  }
  return renderExerciseHistory(EXERCISES[id], sessions);
}
