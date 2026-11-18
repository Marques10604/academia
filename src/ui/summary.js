import { h } from './dom.js';
import { get, listSessions } from '../data/db.js';
import { PROGRAM, ROTATION } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { nextTemplate } from '../domain/history.js';
import { detectPRs } from '../domain/records.js';
import { dayText } from './datefmt.js';
import { formatNumber as fmt } from '../domain/numbers.js';

// "30 kg × 12, 12, 11" when every set shares the load, else "30 kg × 12, 27,5 kg × 10"; time: "30 s, 35 s".
function setsText(ex, sets) {
  if (ex.type === 'time') return sets.map((s) => `${fmt(s.reps)} s`).join(', ');
  const sameLoad = sets.every((s) => s.load === sets[0].load);
  if (sameLoad) return `${fmt(sets[0].load)} kg × ${sets.map((s) => s.reps).join(', ')}`;
  return sets.map((s) => `${fmt(s.load)} kg × ${s.reps}`).join(', ');
}

function prText(ex, pr) {
  if (ex.type === 'time') return `${ex.name}: ${fmt(pr.reps)} s (antes: ${fmt(pr.prevReps)} s)`;
  return `${ex.name}: ${fmt(pr.load)} kg × ${pr.reps} (antes: ${fmt(pr.prevLoad)} kg × ${pr.prevReps})`;
}

export async function renderSummary(hash) {
  const id = decodeURIComponent(hash.slice('#/resumo/'.length));
  const session = await get('sessions', id);
  if (!session) {
    location.hash = '#/hoje';
    return null;
  }
  const sessions = await listSessions();
  const tpl = PROGRAM[session.templateId];
  const next = PROGRAM[nextTemplate(sessions, ROTATION)];
  const minutes = Math.max(0, Math.round((session.endedAt - session.startedAt) / 60000));
  const rows = session.entries
    .map((e) => ({ ex: EXERCISES[e.exerciseId], sets: e.sets.filter((s) => s.kind === 'work') }))
    .filter((r) => r.sets.length > 0);
  const totalSets = rows.reduce((sum, r) => sum + r.sets.length, 0);
  const prs = detectPRs(sessions.filter((s) => s.id !== session.id), session);

  return h('div', { class: 'screen', 'data-screen': 'resumo' },
    h('div', { class: 'topbar' },
      h('h1', { class: 'title' }, session.complete ? (session.short ? `Treino curto: ${tpl.name} concluído` : `${tpl.name} concluído`) : 'Treino registrado (incompleto)')),
    h('p', { class: 'muted small', 'data-role': 'date' }, dayText(session.startedAt)),
    h('div', { class: 'card' },
      h('p', null, `Duração: ${minutes} min`),
      h('p', null, `Séries: ${totalSets}`)),
    prs.length === 0 ? null : h('div', { class: 'card' },
      prs.map((pr) => h('p', { 'data-role': 'pr' },
        h('span', { class: 'badge badge-pr' }, 'Recorde!'),
        ' ' + prText(EXERCISES[pr.exerciseId], pr)))),
    h('div', { class: 'card', 'data-role': 'loads' },
      rows.map((r) => h('p', null, `${r.ex.name}: ${setsText(r.ex, r.sets)}`))),
    h('p', { class: 'muted' }, `Próximo treino: ${next.name}`),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big btn-primary', 'data-action': 'home',
        onclick: () => { location.hash = '#/hoje'; },
      }, 'Voltar ao início')));
}
