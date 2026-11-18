// History screens: '#/historico' (saved workouts) and, from Task 2, '#/historico/<id>' (one exercise).
import { h } from './dom.js';
import { listSessions } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { workoutRows } from '../domain/progress.js';
import { dayText } from './datefmt.js';

function workoutItem(row) {
  const name = (row.short ? 'Treino curto: ' : '') + (PROGRAM[row.templateId]?.name ?? 'Treino') + (row.complete ? '' : ' (incompleto)');
  return h('li', { class: 'list-item', 'data-session': row.id },
    h('div', { class: 'stack', style: { gap: '4px', flex: '1' } },
      h('a', { href: '#/resumo/' + encodeURIComponent(row.id) }, name),
      h('span', { class: 'muted small' },
        `${dayText(row.startedAt)} · ${row.minutes} min · ${row.workSets} ${row.workSets === 1 ? 'série' : 'séries'}`)));
}

export async function renderHistory(hash) {
  const sessions = await listSessions();
  const rows = workoutRows(sessions);
  return h('div', { class: 'screen', 'data-screen': 'historico' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Histórico')),
    h('h2', null, 'Treinos'),
    rows.length === 0
      ? h('p', { class: 'muted' }, 'Nenhum treino ainda. Seus treinos aparecem aqui quando você finalizar.')
      : h('ul', { class: 'list' }, rows.map(workoutItem)),
    h('div', { class: 'bottom-bar' },
      h('a', { class: 'btn btn-big', 'data-action': 'back-today', href: '#/hoje' }, 'Voltar')));
}
