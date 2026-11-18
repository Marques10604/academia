import { h } from './dom.js';
import { getActive, listSessions } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import {
  logSet, setCurrent, finishWorkout, discardWorkout,
  adjustLoad, setLoad, adjustReps, setFeel, undoLastSet, logWarmup, skipRest, logRampSet, answerRamp,
} from '../actions/workout.js';
import { exerciseHistory } from '../domain/history.js';
import { getPref } from '../data/prefs.js';
import { loadLabel, noteOf } from '../domain/units.js';
import { warmupSets } from '../domain/draft.js';
import { formatNumber as fmt, parseDecimal } from '../domain/numbers.js';
import { restRemainingMs, formatClock, overdueSeconds } from '../domain/timer.js';
import { unlockAudio, beep, vibrate, requestWakeLock, releaseWakeLock, isWakeLockActive } from '../platform/device.js';
import { phaseLabel, effortText, loadText } from './reasons.js';
import { rerender } from '../app.js';

const FEEL_CHIPS = [
  ['leve', 'Leve (sobrou 3+)'],
  ['ponto', 'No ponto (sobrou 1–2)'],
  ['pesado', 'Pesado (não sobrou nada)'],
];

// Rest timer state. The countdown is always restEndsAt - now (never a decremented counter).
// One 250 ms interval updates only the timer node's text; the screen is never re-rendered by it.
let tick = null;
let currentUpdate = null;
let alertedFor = null; // restEndsAt value that already alerted
let doneText = '';

function stopTick() {
  if (tick !== null) clearInterval(tick);
  tick = null;
  currentUpdate = null;
}

// Back in the app after the screen was off or another app was in front: recompute at once.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentUpdate) currentUpdate();
});

const workSets = (entry) => entry.sets.filter((s) => s.kind === 'work');

function previousLine(entry, ex, prev, unit) {
  if (!prev) return 'primeira vez neste exercício';
  const set = prev.sets[workSets(entry).length] ?? prev.sets[prev.sets.length - 1];
  return ex.type === 'time' ? `anterior: ${fmt(set.reps)} s` : `anterior: ${loadLabel(set.load, unit)} × ${set.reps}`;
}

function setRowText(entry, ex, s, workNumber, rampNumber, unit) {
  if (s.kind === 'warmup') return `Aquecimento: ${loadLabel(s.load, unit)} × ${s.reps}`;
  if (s.kind === 'ramp') {
    const left = s.rir === undefined ? '' : ` · sobravam ${s.rir >= 4 ? '4+' : s.rir}`;
    return `Rampa ${rampNumber}: ${loadLabel(s.load, unit)} × ${s.reps}${left}`;
  }
  return ex.type === 'time' ? `${workNumber}ª série: ${fmt(s.reps)} s` : `${workNumber}ª série: ${loadLabel(s.load, unit)} × ${s.reps}`;
}

export async function renderWorkout() {
  stopTick();
  const draft = await getActive();
  if (!draft) {
    location.hash = '#/hoje';
    return null;
  }
  const tpl = PROGRAM[draft.templateId];
  const idx = draft.currentIdx;
  const entry = draft.entries[idx];
  const ex = EXERCISES[entry.exerciseId];
  const isTime = ex.type === 'time';
  const total = draft.entries.length;
  const done = workSets(entry).length;
  const hasAnySet = draft.entries.some((e) => e.sets.length > 0);
  const unit = entry.unit ?? 'kg'; // drafts from 0.2.0 have no unit
  const pref = await getPref(entry.exerciseId);
  const prev = exerciseHistory(await listSessions(), entry.exerciseId, { unit, since: pref?.unitChangedAt ?? 0 })[0];

  // The set goes to the entry shown on screen (index captured at render time).
  const onRamp = async () => {
    unlockAudio(); // needs the tap gesture so the end-of-rest beep can play later
    await logRampSet(idx, Date.now());
    await rerender();
  };
  const onRir = (rir) => async () => {
    await answerRamp(idx, rir);
    await rerender();
  };
  const onLog = async () => {
    unlockAudio(); // needs the tap gesture so the end-of-rest beep can play later
    await logSet(idx, Date.now());
    await rerender();
  };
  const go = async (i) => {
    await setCurrent(i);
    await rerender();
  };
  const onUndo = async () => {
    await undoLastSet();
    await rerender();
  };
  const onFeel = async (feel) => {
    await setFeel(idx, feel);
    await rerender();
  };
  const onFinish = async (e) => {
    e.currentTarget.disabled = true;
    stopTick();
    releaseWakeLock();
    const session = await finishWorkout(Date.now());
    location.hash = session ? '#/resumo/' + session.id : '#/hoje';
  };
  const onDiscard = async () => {
    if (!window.confirm('Descartar este treino? As séries registradas serão perdidas.')) return;
    stopTick();
    releaseWakeLock();
    await discardWorkout();
    location.hash = '#/hoje';
  };

  // Load and reps update their own nodes: no screen re-render, so a field that was just
  // typed in (and blurred by tapping + or -) is never replaced under the user's finger.
  const loadInput = isTime ? null : h('input', {
    name: 'load', type: 'text', inputmode: unit === 'placa' ? 'numeric' : 'decimal', class: 'stepper-value',
    value: fmt(entry.load), 'aria-label': unit === 'placa' ? 'Número da placa' : 'Carga em kg',
    onchange: async (e) => {
      const input = e.currentTarget;
      const value = parseDecimal(input.value);
      if (value === null) {
        input.value = fmt(entry.load);
        return;
      }
      const next = await setLoad(idx, value);
      if (next) input.value = fmt(next.entries[idx].load);
    },
  });
  const repsSpan = h('span', { class: 'stepper-value', 'data-role': 'reps' },
    isTime ? `${fmt(entry.reps)} s` : String(entry.reps));
  const onLoadStep = (dir) => async () => {
    const next = await adjustLoad(idx, dir);
    if (next && loadInput) loadInput.value = fmt(next.entries[idx].load);
  };
  const onRepsStep = (dir) => async () => {
    const next = await adjustReps(idx, dir);
    if (next) {
      const r = next.entries[idx].reps;
      repsSpan.textContent = isTime ? `${fmt(r)} s` : String(r);
    }
  };

  // Warm-up guidance on the very first exercise, before any work set (PROG-06).
  const warmups = entry.sets.filter((s) => s.kind === 'warmup').length;
  const warmupCard = idx === 0 && done === 0
    ? h('div', { class: 'card', 'data-role': 'warmup' },
      h('p', null, 'Aquecimento: 5 min leves na bicicleta ou esteira + mobilidade (balance as pernas, gire os braços, 10 agachamentos sem peso).'),
      warmupSets(entry.load, entry.incrementKg ?? ex.incrementKg).map((w, i) => (i < warmups ? null
        : h('div', { class: 'set-row' },
          h('span', null, `Aquecimento ${i + 1}: ${loadLabel(w.load, unit)} × ${w.reps}`),
          h('button', {
            class: 'btn', 'data-action': 'log-warmup', 'data-idx': String(i),
            onclick: async () => {
              await logWarmup(0, w.load, w.reps, Date.now());
              await rerender();
            },
          }, 'Feito')))),
      h('p', { class: 'muted small' }, 'Séries de aquecimento não contam para recorde.'))
    : null;

  const endsAt = draft.restEndsAt;
  const timerNode = endsAt == null ? null : h('div', { class: 'timer', 'data-role': 'timer' });
  const wakeNode = h('p', { class: 'muted small', 'data-role': 'wakelock' });
  requestWakeLock().then(() => {
    wakeNode.textContent = isWakeLockActive() ? 'Tela ligada durante o treino' : '';
  });

  let workNumber = 0;
  let rampNumber = 0;
  const setRows = entry.sets.map((s) => {
    if (s.kind === 'work') workNumber += 1;
    if (s.kind === 'ramp') rampNumber += 1;
    return h('li', { class: `set-row${s.kind === 'work' ? '' : ' ' + s.kind}`, 'data-set-kind': s.kind },
      setRowText(entry, ex, s, workNumber, rampNumber, unit));
  });

  // Calibration (CARGA-01): ramp sets of ~10 reps; after each the user says how many reps were left.
  const ramps = entry.sets.filter((s) => s.kind === 'ramp');
  const awaitingRir = ramps.length > 0 && ramps[ramps.length - 1].rir === undefined;
  const calibrationCard = entry.calibrating
    ? h('div', { class: 'card', 'data-role': 'calibration' },
      h('span', { class: 'badge badge-calibracao' }, 'Calibração'),
      h('p', null, 'Descubra sua carga: faça 10 repetições com boa forma, sem pressa.'),
      awaitingRir
        ? h('div', null,
          h('p', null, 'Quantas repetições ainda sobravam?'),
          h('div', { class: 'chips' },
            [0, 1, 2, 3, 4].map((n) => h('button', {
              class: 'chip', 'data-rir': String(n), onclick: onRir(n),
            }, n === 4 ? '4+' : String(n)))),
          h('p', { class: 'muted small' }, 'Na dúvida, escolha o número maior.'))
        : h('button', { class: 'btn btn-big btn-primary', 'data-action': 'log-ramp', onclick: onRamp }, 'Concluir série de rampa'))
    : null;
  const rampEndedBanner = !entry.calibrating && ramps.length > 0 && done === 0
    ? h('div', { class: 'banner', 'data-role': 'ramp-result' },
      'Sua carga de trabalho: ' + loadText(entry.load, ex, unit) + '. Agora faça as séries valendo.')
    : null;

  const planned = entry.plannedSets;
  const header = done < planned ? `Série ${done + 1} de ${planned}` : `Séries planejadas concluídas (${planned} de ${planned})`;

  const screen = h('div', { class: 'screen', 'data-screen': 'treino' },
    h('div', { class: 'topbar' },
      h('div', null,
        h('h1', { class: 'title' }, draft.short ? `${tpl.name} (curto)` : tpl.name),
        h('p', { class: 'subtitle muted' }, `Exercício ${idx + 1} de ${total}`))),
    h('div', { class: 'chips', 'data-role': 'overview' },
      draft.entries.map((e, i) => h('button', {
        class: `chip${i === idx ? ' selected' : ''}`, 'data-overview': String(i),
        'aria-label': EXERCISES[e.exerciseId].name,
        onclick: () => go(i),
      }, `${i + 1}: ${workSets(e).length}/${e.plannedSets}`))),
    timerNode
      ? h('div', { class: 'card' },
        timerNode,
        h('button', {
          class: 'btn btn-ghost', 'data-action': 'skip-rest',
          onclick: async () => {
            await skipRest();
            await rerender();
          },
        }, 'Pular'))
      : null,
    wakeNode,
    warmupCard,
    h('div', { class: 'card current' },
      h('h2', { class: 'title' },
        h('a', { href: '#/exercicio/' + entry.exerciseId }, ex.name)),
      noteOf(pref) ? h('p', { class: 'small setup-note', 'data-role': 'setup-note' }, h('strong', null, 'Minha regulagem: '), noteOf(pref)) : null,
      entry.phase ? h('p', null, h('span', { class: `badge badge-${entry.phase}`, 'data-role': 'phase' }, phaseLabel(entry.phase))) : null, // drafts from 0.1.0 have no phase
      entry.phase ? h('p', { class: 'muted small', 'data-role': 'effort' }, effortText(entry.phase, ex)) : null,
      h('p', { class: 'muted' }, `${planned} × ${entry.repMin}–${entry.repMax}${isTime ? ' s' : ''}`),
      h('p', { 'data-role': 'set-header' }, header),
      calibrationCard,
      rampEndedBanner,
      isTime ? null : h('div', { class: 'stepper' },
        h('button', { class: 'btn btn-icon', 'data-action': 'load-minus', 'aria-label': 'Menos carga', onclick: onLoadStep(-1) }, '−'),
        loadInput,
        h('button', { class: 'btn btn-icon', 'data-action': 'load-plus', 'aria-label': 'Mais carga', onclick: onLoadStep(1) }, '+')),
      isTime ? null : h('p', { class: 'muted small' }, unit === 'placa' ? 'placa (número da máquina)' : loadText(1, ex).replace(/^1 /, '')),
      h('div', { class: 'stepper' },
        h('button', { class: 'btn btn-icon', 'data-action': 'reps-minus', 'aria-label': 'Menos repetições', onclick: onRepsStep(-1) }, '−'),
        repsSpan,
        h('button', { class: 'btn btn-icon', 'data-action': 'reps-plus', 'aria-label': 'Mais repetições', onclick: onRepsStep(1) }, '+')),
      h('p', { class: 'muted small' }, isTime ? 'segundos' : 'repetições'),
      h('p', { class: 'muted', 'data-role': 'previous' }, previousLine(entry, ex, prev, unit)),
      h('ul', { class: 'list' }, setRows),
      done >= planned
        ? h('div', null,
          h('p', null, 'Como foi a última série?'),
          h('div', { class: 'chips' },
            FEEL_CHIPS.map(([key, label]) => h('button', {
              class: `chip${entry.feel === key ? ' selected' : ''}`, 'data-feel': key,
              onclick: () => onFeel(key),
            }, label))))
        : null),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'log-set', onclick: onLog }, 'Concluir série'),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn', 'data-action': 'prev-exercise', disabled: idx === 0,
          onclick: () => go(idx - 1),
        }, '‹ Anterior'),
        hasAnySet
          ? h('button', { class: 'btn btn-ghost', 'data-action': 'undo', onclick: onUndo }, 'Desfazer última série')
          : null,
        h('button', {
          class: 'btn', 'data-action': 'next-exercise', disabled: idx === total - 1,
          onclick: () => go(idx + 1),
        }, 'Próximo ›')),
      h('button', { class: 'btn btn-primary', 'data-action': 'finish', onclick: onFinish }, 'Finalizar treino'),
      h('button', { class: 'btn btn-danger small', 'data-action': 'discard', onclick: onDiscard }, 'Descartar treino')));

  const paint = () => {
    if (!timerNode) return;
    const now = Date.now();
    const remaining = restRemainingMs(endsAt, now);
    if (remaining > 0) {
      timerNode.classList.remove('done');
      timerNode.textContent = `Descanso ${formatClock(remaining)}`;
      return;
    }
    timerNode.classList.add('done');
    if (alertedFor !== endsAt) {
      if (document.visibilityState === 'visible') {
        alertedFor = endsAt;
        const over = overdueSeconds(endsAt, now);
        if (over > 2) {
          // came back to a timer that ended while away: one vibration, no beep
          doneText = `Descanso terminou há ${over} s`;
          vibrate(200);
        } else {
          doneText = 'Descanso terminou — próxima série!';
          beep();
          vibrate([300, 150, 300]);
        }
      } else {
        doneText = 'Descanso terminou — próxima série!';
      }
    }
    timerNode.textContent = doneText;
  };
  const update = () => {
    // The screen was replaced or left: stop. Leaving the workout route also frees the wake lock.
    if (!screen.isConnected) {
      stopTick();
      if (location.hash !== '#/treino') releaseWakeLock();
      return;
    }
    paint();
  };
  paint();
  stopTick();
  currentUpdate = update;
  tick = setInterval(update, 250);
  return screen;
}
