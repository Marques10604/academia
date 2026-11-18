import { h } from './dom.js';
import { get, listSessions } from '../data/db.js';
import { PROGRAM, ROTATION } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { nextTemplate } from '../domain/history.js';

export async function renderSummary(hash) {
  const id = decodeURIComponent(hash.slice('#/resumo/'.length));
  const session = await get('sessions', id);
  if (!session) {
    location.hash = '#/hoje';
    return null;
  }
  const tpl = PROGRAM[session.templateId];
  const next = PROGRAM[nextTemplate(await listSessions(), ROTATION)];
  const minutes = Math.max(0, Math.round((session.endedAt - session.startedAt) / 60000));
  const rows = session.entries
    .map((e) => ({ name: EXERCISES[e.exerciseId].name, n: e.sets.filter((s) => s.kind === 'work').length }))
    .filter((r) => r.n > 0);
  const totalSets = rows.reduce((sum, r) => sum + r.n, 0);

  return h('div', { class: 'screen', 'data-screen': 'resumo' },
    h('div', { class: 'topbar' },
      h('h1', { class: 'title' }, session.complete ? `${tpl.name} concluído` : 'Treino registrado (incompleto)')),
    h('div', { class: 'card' },
      h('p', null, `Duração: ${minutes} min`),
      h('p', null, `Séries: ${totalSets}`)),
    h('ul', { class: 'list' },
      rows.map((r) =>
        h('li', { class: 'list-item row' },
          h('span', null, r.name),
          h('span', { class: 'muted small' }, `${r.n} ${r.n === 1 ? 'série' : 'séries'}`)))),
    h('p', { class: 'muted' }, `Próximo treino: ${next.name}`),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big btn-primary', 'data-action': 'home',
        onclick: () => { location.hash = '#/hoje'; },
      }, 'Voltar ao início')));
}
