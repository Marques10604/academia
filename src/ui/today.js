import { h } from './dom.js';
import { listSessions, getActive } from '../data/db.js';
import { PROGRAM, ROTATION } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { nextTemplate } from '../domain/history.js';
import { startWorkout } from '../actions/workout.js';

function planned(item) {
  const ex = EXERCISES[item.exerciseId];
  const range = `${item.repMin}–${item.repMax}`;
  return ex.type === 'time' ? `${item.sets} × ${range} s` : `${item.sets} × ${range}`;
}

export async function renderToday() {
  const draft = await getActive();
  const sessions = await listSessions();
  // With an open workout, Today shows that workout instead of the rotation's next one.
  const templateId = draft ? draft.templateId : nextTemplate(sessions, ROTATION);
  const tpl = PROGRAM[templateId];

  const onStart = async (e) => {
    e.currentTarget.disabled = true;
    await startWorkout(templateId, Date.now());
    location.hash = '#/treino';
  };
  const onResume = () => {
    location.hash = '#/treino';
  };

  return h('div', { class: 'screen', 'data-screen': 'hoje' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, `Hoje: ${tpl.name}`)),
    h('ul', { class: 'list' },
      tpl.items.map((item) =>
        h('li', { class: 'list-item row', 'data-exercise': item.exerciseId },
          h('span', null, EXERCISES[item.exerciseId].name),
          h('span', { class: 'muted small' }, planned(item))))),
    h('div', { class: 'bottom-bar' },
      draft
        ? h('button', { class: 'btn btn-big btn-primary', 'data-action': 'resume', onclick: onResume }, 'Continuar treino')
        : h('button', { class: 'btn btn-big btn-primary', 'data-action': 'start', onclick: onStart }, 'Iniciar treino')));
}
