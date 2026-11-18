import { h } from './dom.js';
import { listSessions, getActive, getSetting } from '../data/db.js';
import { loadPrefs } from '../data/prefs.js';
import { PROGRAM, ROTATION, workoutItems } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { nextTemplate, exerciseHistory } from '../domain/history.js';
import { planExercise } from '../domain/plan.js';
import { localDate } from '../domain/dates.js';
import { unitFor, incrementFor, historyOpts, noteOf } from '../domain/units.js';
import { sessionsThisWeek, WEEKLY_GOAL } from '../domain/week.js';
import { startWorkout } from '../actions/workout.js';
import { listDays } from '../data/daily.js';
import { hasCheckin, averageWeight } from '../domain/body.js';
import { formatNumber } from '../domain/numbers.js';
import { avgWeightText } from './body.js';
import { backupStatus } from '../domain/backup.js';
import { backupAgeText } from './backup.js';
import { dayText } from './datefmt.js';
import { phaseLabel, effortText, loadText, restText, reasonText } from './reasons.js';

function plannedText(item, plan, exercise) {
  const range = `${item.repMin}–${item.repMax}`;
  const unit = exercise.type === 'time' ? ' s' : '';
  return `${plan.sets} × ${range}${unit} · ${restText(item.restSec)}`;
}

function exerciseRow(item, plan, note) {
  const exercise = EXERCISES[item.exerciseId];
  const isTime = exercise.type === 'time';
  const reason = reasonText(plan.reasonCode, plan.reasonParams, exercise, plan.unit);
  return h('li', { class: 'list-item', 'data-exercise': item.exerciseId },
    h('div', { class: 'stack', style: { gap: '4px', flex: '1' } },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('a', { href: '#/exercicio/' + item.exerciseId }, exercise.name),
        h('span', { class: 'badge badge-' + plan.phase, 'data-role': 'phase' }, phaseLabel(plan.phase))),
      h('span', { class: 'muted small', 'data-role': 'prescription' }, plannedText(item, plan, exercise)),
      isTime ? null : h('strong', { 'data-role': 'load' }, loadText(plan.load, exercise, plan.unit)),
      h('span', { class: 'muted small', 'data-role': 'effort' }, effortText(plan.phase, exercise)),
      reason ? h('span', { class: 'muted small', 'data-role': 'reason' }, reason) : null,
      // user text: h() only ever adds it as a text node
      note ? h('span', { class: 'small setup-note', 'data-role': 'setup-note' }, 'Minha regulagem: ', note) : null));
}

// "Esta semana ●●○ 2 de 3": filled dots for finished workouts this week; above the goal all dots stay filled.
function weekCard(done) {
  const dots = Array.from({ length: WEEKLY_GOAL }, (_, i) => (
    h('span', { class: i < done ? 'dot on' : 'dot', 'aria-hidden': 'true' }, i < done ? '●' : '○')));
  return h('div', { class: 'card week-card', 'data-role': 'week', 'data-count': String(done) },
    h('span', { class: 'muted' }, 'Esta semana'),
    h('span', { class: 'dots' }, dots),
    h('strong', null, `${done} de ${WEEKLY_GOAL}`));
}

// "Check-in de hoje: 70,4 kg · sono 4 · energia 3" (only the parts filled in) + a small edit button, or the
// button that opens the check-in (not primary: the primary button of Today is "Iniciar treino").
function checkinBlock(row) {
  if (!hasCheckin(row)) {
    return h('button', { class: 'btn', 'data-action': 'checkin', onclick: () => { location.hash = '#/corpo'; } },
      'Check-in da manhã (peso, sono, energia)');
  }
  const parts = [];
  if (typeof row.weightKg === 'number') parts.push(formatNumber(row.weightKg) + ' kg');
  if (typeof row.sleep === 'number') parts.push('sono ' + row.sleep);
  if (typeof row.energy === 'number') parts.push('energia ' + row.energy);
  return h('div', { class: 'card row', 'data-role': 'checkin-today', style: { justifyContent: 'space-between' } },
    h('span', null, 'Check-in de hoje: ' + parts.join(' · ')),
    h('button', { class: 'btn btn-ghost', 'data-action': 'edit-checkin', onclick: () => { location.hash = '#/corpo'; } }, 'editar'));
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
  const prefs = await loadPrefs();
  // With an open workout, Today shows that workout instead of the rotation's next one.
  const templateId = draft ? draft.templateId : nextTemplate(sessions, ROTATION);
  const tpl = PROGRAM[templateId];
  const today = localDate(Date.now()); // the clock is read here in the UI layer, never in src/domain

  const rows = workoutItems(templateId, draft ? draft.short === true : false).map((item) => {
    const exercise = EXERCISES[item.exerciseId];
    const pref = prefs.get(item.exerciseId);
    const plan = planExercise({
      item,
      exercise,
      history: exerciseHistory(sessions, item.exerciseId, historyOpts(exercise, pref)),
      incrementKg: incrementFor(exercise, pref),
      unit: unitFor(exercise, pref),
      today,
    });
    return exerciseRow(item, plan, noteOf(pref));
  });

  const days = await listDays();
  const todayRow = days.find((d) => d.localDate === today) ?? null;
  const avg = averageWeight(days, today);

  const backup = backupStatus({ lastBackupAt: await getSetting('lastBackupAt', null), sessions, today });

  const onStart = (short) => async (e) => {
    e.currentTarget.disabled = true;
    await startWorkout(templateId, Date.now(), short);
    location.hash = '#/treino';
  };
  const onResume = () => {
    location.hash = '#/treino';
  };

  return h('div', { class: 'screen', 'data-screen': 'hoje' },
    h('div', { class: 'topbar' },
      h('h1', { class: 'title' }, `Hoje: ${tpl.name}`),
      h('button', { class: 'btn btn-ghost', 'data-action': 'settings', onclick: () => { location.hash = '#/config'; } }, 'Config')),
    h('div', { class: 'row nav' },
      h('button', { class: 'btn btn-ghost', 'data-action': 'history', onclick: () => { location.hash = '#/historico'; } }, 'Histórico'),
      h('button', { class: 'btn btn-ghost', 'data-action': 'body', onclick: () => { location.hash = '#/corpo'; } }, 'Corpo')),
    h('p', { class: 'muted small', 'data-role': 'date' }, dayText(Date.now())),
    checkinBlock(todayRow),
    weekCard(sessionsThisWeek(sessions, today)),
    avg
      ? h('p', { 'data-role': 'avg-weight' }, avgWeightText(avg))
      : null,
    backup.due
      ? h('div', { class: 'notice stack', 'data-role': 'backup-nudge' },
        h('p', null, `Você tem ${backup.since} treinos sem backup. Salve uma cópia para não perder seus dados.`),
        h('button', { class: 'btn btn-primary', 'data-action': 'backup-now', onclick: () => { location.hash = '#/backup'; } }, 'Fazer backup agora'))
      : h('p', { class: 'muted small', 'data-role': 'backup-status' }, backupAgeText(backup)),
    h('p', { class: 'muted small', 'data-role': 'goal' }, tpl.goal),
    h('p', { class: 'small', 'data-role': 'month-step' }, monthStep(sessions.length + 1)),
    h('ul', { class: 'list' }, rows),
    h('div', { class: 'bottom-bar' },
      draft
        ? h('button', { class: 'btn btn-big btn-primary', 'data-action': 'resume', onclick: onResume }, 'Continuar treino')
        : [
          h('button', { class: 'btn btn-big btn-primary', 'data-action': 'start', onclick: onStart(false) }, 'Iniciar treino'),
          h('button', { class: 'btn', 'data-action': 'start-short', onclick: onStart(true) }, 'Treino curto (dia corrido, ~25 min)'),
        ]));
}
