import { h } from './dom.js';
import { getActive } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { logSet, setCurrent, finishWorkout, discardWorkout } from '../actions/workout.js';
import { formatNumber as fmt } from '../domain/numbers.js';
import { rerender } from '../app.js';

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

  const total = draft.entries.length;
  // The set goes to the entry shown on screen (index captured at render time).
  const onLog = async () => {
    await logSet(draft.currentIdx, Date.now());
    await rerender();
  };
  const go = async (idx) => {
    await setCurrent(idx);
    await rerender();
  };

  const onFinish = async (e) => {
    e.currentTarget.disabled = true;
    const session = await finishWorkout(Date.now());
    location.hash = session ? '#/resumo/' + session.id : '#/hoje';
  };
  const onDiscard = async () => {
    if (!window.confirm('Descartar este treino? As séries registradas serão perdidas.')) return;
    await discardWorkout();
    location.hash = '#/hoje';
  };

  return h('div', { class: 'screen', 'data-screen': 'treino' },
    h('div', { class: 'topbar' },
      h('div', null,
        h('h1', { class: 'title' }, tpl.name),
        h('p', { class: 'subtitle muted' }, `Exercício ${draft.currentIdx + 1} de ${total}`))),
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
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'log-set', onclick: onLog }, 'Concluir série'),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn', 'data-action': 'prev-exercise', disabled: draft.currentIdx === 0,
          onclick: () => go(draft.currentIdx - 1),
        }, '‹ Anterior'),
        h('button', {
          class: 'btn', 'data-action': 'next-exercise', disabled: draft.currentIdx === total - 1,
          onclick: () => go(draft.currentIdx + 1),
        }, 'Próximo ›')),
      h('button', { class: 'btn btn-primary', 'data-action': 'finish', onclick: onFinish }, 'Finalizar treino'),
      h('button', { class: 'btn btn-danger small', 'data-action': 'discard', onclick: onDiscard }, 'Descartar treino')));
}
