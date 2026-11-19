import { h } from './dom.js';
import { listSessions, getActive, getSetting } from '../data/db.js';
import { loadPrefs } from '../data/prefs.js';
import { PROGRAM, ROTATION, workoutItems } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import { videoLink } from './video.js';
import { nextTemplate, exerciseHistory } from '../domain/history.js';
import { planExercise } from '../domain/plan.js';
import { localDate } from '../domain/dates.js';
import { unitFor, incrementFor, historyOpts, noteOf } from '../domain/units.js';
import {
  sessionsThisWeek, readWeeklyGoal, weeklyStreak, daysSinceLastWorkout, GAP_NOTICE_DAYS,
} from '../domain/week.js';
import { RULES } from '../domain/progression.js';
import { photoStatus } from '../domain/goals.js';
import { startWorkout } from '../actions/workout.js';
import { listDays } from '../data/daily.js';
import { hasCheckin, averageWeight } from '../domain/body.js';
import { formatNumber } from '../domain/numbers.js';
import { proteinTarget, dayTotal } from '../domain/protein.js';
import { proteinLineText } from './protein.js';
import { avgWeightText } from './body.js';
import { backupStatus } from '../domain/backup.js';
import { backupAgeText } from './backup.js';
import { greetingFor } from '../domain/profile.js';
import { dayText } from './datefmt.js';
import { phaseLabel, effortText, loadText, restText, reasonText } from './reasons.js';

const FULL_MINUTES = 55; // about how long the full workout takes
const SHORT_MINUTES = 25;

function plannedText(item, plan, exercise) {
  const range = `${item.repMin}–${item.repMax}`;
  const unit = exercise.type === 'time' ? ' s' : '';
  return `${plan.sets} × ${range}${unit} · ${restText(item.restSec)}`;
}

// One compact card per exercise: name ›, phase badge, the load big, "2 × 10–15 · descanso 2:00". The effort
// and the reason of the suggestion sit behind a small "ver detalhes" toggle (a native <details>).
function exerciseCard(item, plan, note) {
  const exercise = EXERCISES[item.exerciseId];
  const isTime = exercise.type === 'time';
  const reason = reasonText(plan.reasonCode, plan.reasonParams, exercise, plan.unit);
  return h('div', { class: 'card ex-card', 'data-exercise': item.exerciseId },
    h('div', { class: 'ex-head' },
      h('a', { class: 'ex-name', href: '#/exercicio/' + item.exerciseId }, exercise.name),
      h('span', { class: 'badge badge-' + plan.phase, 'data-role': 'phase' }, phaseLabel(plan.phase)),
      videoLink(exercise)),
    isTime ? null : h('strong', { class: 'ex-load', 'data-role': 'load' }, loadText(plan.load, exercise, plan.unit)),
    h('span', { class: 'muted small', 'data-role': 'prescription' }, plannedText(item, plan, exercise)),
    // user text: h() only ever adds it as a text node
    note ? h('span', { class: 'small setup-note', 'data-role': 'setup-note' }, 'Minha regulagem: ', note) : null,
    h('details', { class: 'ex-details' },
      h('summary', null, 'ver detalhes'),
      h('p', { class: 'muted small', 'data-role': 'effort' }, effortText(plan.phase, exercise)),
      reason ? h('p', { class: 'muted small', 'data-role': 'reason' }, reason) : null));
}

// "Esta semana ●●○ 2 de 3": filled dots for finished workouts this week; above the goal all dots stay filled.
function weekRow(done, goal) {
  const dots = Array.from({ length: goal }, (_, i) => (
    h('span', { class: i < done ? 'dot on' : 'dot', 'aria-hidden': 'true' }, i < done ? '●' : '○')));
  return h('div', { class: 'week', 'data-role': 'week', 'data-count': String(done) },
    h('span', { class: 'muted' }, 'Esta semana'),
    h('span', { class: 'dots' }, dots),
    h('strong', null, `${done} de ${goal}`));
}

// "Sequência: 3 semanas" (neutral text; a forgiven week is mentioned kindly). Nothing before the first full week.
function streakLine(streak) {
  if (streak.weeks < 1) return null;
  return h('p', { class: 'small', 'data-role': 'streak' },
    `Sequência: ${streak.weeks} ${streak.weeks === 1 ? 'semana' : 'semanas'}`
    + (streak.lastWeekMissed ? ' · a semana passada foi de folga' : ''));
}

// "Check-in de hoje: 70,4 kg · sono 4 · energia 3" (only the parts filled in) + a small edit button, or the
// button that opens the check-in (not primary: the primary button of Today is "Iniciar treino").
function checkinBlock(row) {
  if (!hasCheckin(row)) {
    return h('div', { class: 'card row between', 'data-role': 'checkin-card' },
      h('div', { class: 'stack tight' },
        h('strong', null, 'Check-in da manhã'),
        h('span', { class: 'muted small' }, 'Peso, sono e energia')),
      h('button', { class: 'btn', 'data-action': 'checkin', onclick: () => { location.hash = '#/corpo'; } }, 'Fazer agora'));
  }
  const parts = [];
  if (typeof row.weightKg === 'number') parts.push(formatNumber(row.weightKg) + ' kg');
  if (typeof row.sleep === 'number') parts.push('sono ' + row.sleep);
  if (typeof row.energy === 'number') parts.push('energia ' + row.energy);
  return h('div', { class: 'card row between', 'data-role': 'checkin-today' },
    h('div', { class: 'stack tight' },
      h('strong', null, 'Check-in da manhã'),
      h('span', { 'data-role': 'checkin-values' }, parts.join(' · '))),
    h('button', { class: 'btn btn-ghost', 'data-action': 'edit-checkin', onclick: () => { location.hash = '#/corpo'; } }, 'editar'));
}

// Shown until the first completed workout: opens the first-gym-day checklist.
function firstDayCard() {
  return h('div', { class: 'card row between', 'data-role': 'first-day' },
    h('div', { class: 'stack tight' },
      h('strong', null, 'Primeiro dia na academia?'),
      h('span', { class: 'muted small' }, 'Seis coisas para fazer no 1º treino.')),
    h('button', { class: 'btn', 'data-action': 'first-day', onclick: () => { location.hash = '#/primeiro-dia'; } }, 'Ver checklist'));
}

// Every 4 weeks, once a workout exists: a small reminder that opens the photo how-to on Corpo (nothing is stored here).
function photoReminderCard() {
  return h('div', { class: 'card row between', 'data-role': 'photo-reminder' },
    h('div', { class: 'stack tight' },
      h('strong', null, 'Fotos de progresso'),
      h('span', { class: 'muted small' }, 'Frente, lado e costas, no álbum Progride da galeria.')),
    h('button', { class: 'btn', 'data-action': 'photos', onclick: () => { location.hash = '#/corpo'; } }, 'Ver como'));
}

// Kind, neutral note after a few days without training (no warning colour, no blame).
function gapNotice(days) {
  return h('p', { class: 'small', 'data-role': 'gap-notice' },
    `Faz ${days} dias desde o último treino. Tudo bem: o plano continua de onde parou.`
    + (days >= RULES.LAYOFF_DAYS ? ' Voltando de uma pausa, as cargas sugeridas já vêm mais leves.' : ''));
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
    return exerciseCard(item, plan, noteOf(pref));
  });
  const isShort = draft ? draft.short === true : false;

  const weeklyGoal = readWeeklyGoal(await getSetting('weeklyGoal', null));
  const anyDone = sessions.some((s) => s.complete === true);
  const gapDays = draft ? null : daysSinceLastWorkout(sessions, today);
  const photosDue = !draft && anyDone && photoStatus(await getSetting('lastPhotosAt', null), today).due;
  const days = await listDays();
  const todayRow = days.find((d) => d.localDate === today) ?? null;
  const avg = averageWeight(days, today);

  const profile = await getSetting('profile', null);
  const greeting = greetingFor(new Date().getHours(), profile?.name); // the clock is read here in the UI layer only

  const target = proteinTarget({ settingG: await getSetting('proteinTargetG', null), avgKg: avg?.avg, profileKg: profile?.weightKg });

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
      h('h1', { class: 'title', 'data-role': 'greeting' }, greeting)),
    // ONE compact card: date, week progress, 7-day average weight, protein of the day and last backup (the nudge below replaces the last line when due).
    h('div', { class: 'card dashboard', 'data-role': 'dashboard' },
      h('p', { class: 'muted small', 'data-role': 'date' }, dayText(Date.now())),
      weekRow(sessionsThisWeek(sessions, today), weeklyGoal),
      streakLine(weeklyStreak(sessions, today, weeklyGoal)),
      avg ? h('p', { 'data-role': 'avg-weight' }, avgWeightText(avg)) : null,
      h('div', { class: 'row between', 'data-role': 'protein-today' },
        h('span', { 'data-role': 'protein-line' }, proteinLineText(dayTotal(todayRow), target.g)),
        h('button', { class: 'btn btn-ghost', 'data-action': 'protein', onclick: () => { location.hash = '#/proteina'; } }, 'Anotar')),
      backup.due ? null : h('p', { class: 'muted small', 'data-role': 'backup-status' }, backupAgeText(backup))),
    checkinBlock(todayRow),
    anyDone ? null : firstDayCard(),
    backup.due
      ? h('div', { class: 'notice stack', 'data-role': 'backup-nudge' },
        h('p', null, `Você tem ${backup.since} treinos sem backup. Salve uma cópia para não perder seus dados.`),
        h('button', { class: 'btn btn-primary', 'data-action': 'backup-now', onclick: () => { location.hash = '#/backup'; } }, 'Fazer backup agora'))
      : null,
    photosDue ? photoReminderCard() : null,
    h('h2', { class: 'section-label' }, 'Treino de hoje'),
    // the hero card: what to do today, and the big start button
    h('div', { class: 'card stack hero', 'data-role': 'hero' },
      h('h2', { class: 'hero-title', 'data-role': 'workout-name' }, `${tpl.name} · corpo todo`),
      h('p', { class: 'muted small', 'data-role': 'goal' }, tpl.goal),
      h('p', { 'data-role': 'workout-meta' }, `${rows.length} exercícios · ~${isShort ? SHORT_MINUTES : FULL_MINUTES} min`),
      h('p', { class: 'small', 'data-role': 'month-step' }, monthStep(sessions.length + 1)),
      gapDays !== null && gapDays >= GAP_NOTICE_DAYS ? gapNotice(gapDays) : null,
      draft
        ? h('button', { class: 'btn btn-big btn-primary', 'data-action': 'resume', onclick: onResume }, 'Continuar treino')
        : [
          h('button', { class: 'btn btn-big btn-primary', 'data-action': 'start', onclick: onStart(false) }, 'Iniciar treino'),
          h('button', { class: 'btn', 'data-action': 'start-short', onclick: onStart(true) }, `Treino curto (~${SHORT_MINUTES} min)`),
        ]),
    h('h2', { class: 'section-label' }, 'Exercícios'),
    rows);
}
