import { h } from './dom.js';
import { getActive } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { logSet } from '../actions/workout.js';
import { rerender } from '../app.js';

const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export async function renderWorkout() {
  const draft = await getActive();
  if (!draft) {
    location.hash = '#/hoje';
    return null;
  }
  const tpl = PROGRAM[draft.templateId];
  const entry = draft.entries[draft.currentIdx];
  const ex = EXERCISES[entry.exerciseId];
  const isTime = ex.type === 'time';

  const onLog = async () => {
    await logSet(draft.currentIdx, Date.now());
    await rerender();
  };

  return h('div', { class: 'screen', 'data-screen': 'treino' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, tpl.name)),
    h('div', { class: 'card current' },
      h('h2', { class: 'title' }, ex.name),
      h('p', { class: 'muted' }, `${entry.plannedSets} × ${entry.repMin}–${entry.repMax}${isTime ? ' s' : ''}`),
      h('p', { class: 'big-number' }, isTime ? `${fmt(entry.reps)} s` : `${fmt(entry.load)} kg`),
      isTime ? null : h('p', { class: 'muted' }, `${fmt(entry.reps)} repetições`),
      h('ul', { class: 'list' },
        entry.sets.map((s, i) =>
          h('li', { class: `set-row${s.kind === 'work' ? '' : ' ' + s.kind}`, 'data-set-kind': s.kind },
            isTime ? `${i + 1}ª série: ${fmt(s.reps)} s` : `${i + 1}ª série: ${fmt(s.load)} kg × ${s.reps}`)))),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'log-set', onclick: onLog }, 'Concluir série')));
}
