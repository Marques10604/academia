import { h } from './dom.js';
import { listSessions, getActive, getAll } from '../data/db.js';
import { PROGRAM, ROTATION } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { nextTemplate, exerciseHistory } from '../domain/history.js';
import { planExercise } from '../domain/plan.js';
import { localDate } from '../domain/dates.js';
import { startWorkout } from '../actions/workout.js';
import { dayText } from './datefmt.js';
import { phaseLabel, effortText, loadText, restText, reasonText } from './reasons.js';

function plannedText(item, plan, exercise) {
  const range = `${item.repMin}–${item.repMax}`;
  const unit = exercise.type === 'time' ? ' s' : '';
  return `${plan.sets} × ${range}${unit} · ${restText(item.restSec)}`;
}

function exerciseRow(item, plan) {
  const exercise = EXERCISES[item.exerciseId];
  const isTime = exercise.type === 'time';
  const reason = reasonText(plan.reasonCode, plan.reasonParams, exercise);
  return h('li', { class: 'list-item', 'data-exercise': item.exerciseId },
    h('div', { class: 'stack', style: { gap: '4px', flex: '1' } },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('a', { href: '#/exercicio/' + item.exerciseId }, exercise.name),
        h('span', { class: 'badge badge-' + plan.phase, 'data-role': 'phase' }, phaseLabel(plan.phase))),
      h('span', { class: 'muted small', 'data-role': 'prescription' }, plannedText(item, plan, exercise)),
      isTime ? null : h('strong', { 'data-role': 'load' }, loadText(plan.load, exercise)),
      h('span', { class: 'muted small', 'data-role': 'effort' }, effortText(plan.phase, exercise)),
      reason ? h('span', { class: 'muted small', 'data-role': 'reason' }, reason) : null));
}

// Where this workout sits in the first-month plan (counted in workouts, not dates).
function monthStep(n) {
  if (n <= 2) return `Treino ${n} · Semana de aprendizado: descubra a carga, 2 séries sobrando 3–4 reps`;
  if (n <= 6) return `Treino ${n} · Adaptação: 2 séries sobrando 3 → 2 reps`;
  if (n <= 12) return `Treino ${n} · Base: 3 séries nos grandes, última sobrando 1–2 reps`;
  return `Treino ${n} · Siga a carga sugerida e anote cada série`;
}

export async function renderToday() {
  const draft = await getActive();
  const sessions = await listSessions();
  const prefs = await getAll('exercisePrefs');
  const incrementById = new Map(prefs.map((p) => [p.exerciseId, p.incrementKg]));
  // With an open workout, Today shows that workout instead of the rotation's next one.
  const templateId = draft ? draft.templateId : nextTemplate(sessions, ROTATION);
  const tpl = PROGRAM[templateId];
  const today = localDate(Date.now()); // the clock is read here in the UI layer, never in src/domain

  const rows = tpl.items.map((item) => {
    const plan = planExercise({
      item,
      exercise: EXERCISES[item.exerciseId],
      history: exerciseHistory(sessions, item.exerciseId),
      incrementKg: incrementById.get(item.exerciseId),
      today,
    });
    return exerciseRow(item, plan);
  });

  const onStart = async (e) => {
    e.currentTarget.disabled = true;
    await startWorkout(templateId, Date.now());
    location.hash = '#/treino';
  };
  const onResume = () => {
    location.hash = '#/treino';
  };

  return h('div', { class: 'screen', 'data-screen': 'hoje' },
    h('div', { class: 'topbar' },
      h('h1', { class: 'title' }, `Hoje: ${tpl.name}`),
      h('button', { class: 'btn btn-ghost', 'data-action': 'settings', onclick: () => { location.hash = '#/config'; } }, 'Config')),
    h('p', { class: 'muted small', 'data-role': 'date' }, dayText(Date.now())),
    h('p', { class: 'muted small', 'data-role': 'goal' }, tpl.goal),
    h('p', { class: 'small', 'data-role': 'month-step' }, monthStep(sessions.length + 1)),
    h('ul', { class: 'list' }, rows),
    h('div', { class: 'bottom-bar' },
      draft
        ? h('button', { class: 'btn btn-big btn-primary', 'data-action': 'resume', onclick: onResume }, 'Continuar treino')
        : h('button', { class: 'btn btn-big btn-primary', 'data-action': 'start', onclick: onStart }, 'Iniciar treino')));
}
