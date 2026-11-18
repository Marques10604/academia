import { h } from './dom.js';
import { getActive, listSessions } from '../data/db.js';
import { PROGRAM } from '../data/program.js';
import { EXERCISES } from '../data/exercises.js';
import {
  logSet, setCurrent, finishWorkout, discardWorkout,
  adjustLoad, setLoad, adjustReps, setFeel, undoLastSet, logWarmup,
} from '../actions/workout.js';
import { exerciseHistory } from '../domain/history.js';
import { warmupSets } from '../domain/draft.js';
import { formatNumber as fmt, parseDecimal } from '../domain/numbers.js';
import { rerender } from '../app.js';

const FEEL_CHIPS = [
  ['leve', 'Leve (sobrou 3+)'],
  ['ponto', 'No ponto (sobrou 1–2)'],
  ['pesado', 'Pesado (não sobrou nada)'],
];

const workSets = (entry) => entry.sets.filter((s) => s.kind === 'work');

function previousLine(entry, ex, prev) {
  if (!prev) return 'primeira vez neste exercício';
  const set = prev.sets[workSets(entry).length] ?? prev.sets[prev.sets.length - 1];
  return ex.type === 'time' ? `anterior: ${fmt(set.reps)} s` : `anterior: ${fmt(set.load)} kg × ${set.reps}`;
}

function setRowText(entry, ex, s, workNumber) {
  if (s.kind === 'warmup') return `Aquecimento: ${fmt(s.load)} kg × ${s.reps}`;
  if (s.kind === 'ramp') return `Série de ajuste: ${fmt(s.load)} kg × ${s.reps}`;
  return ex.type === 'time' ? `${workNumber}ª série: ${fmt(s.reps)} s` : `${workNumber}ª série: ${fmt(s.load)} kg × ${s.reps}`;
}

export async function renderWorkout() {
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
  const prev = exerciseHistory(await listSessions(), entry.exerciseId)[0];

  // The set goes to the entry shown on screen (index captured at render time).
  const onLog = async () => {
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
    const session = await finishWorkout(Date.now());
    location.hash = session ? '#/resumo/' + session.id : '#/hoje';
  };
  const onDiscard = async () => {
    if (!window.confirm('Descartar este treino? As séries registradas serão perdidas.')) return;
    await discardWorkout();
    location.hash = '#/hoje';
  };

  // Load and reps update their own nodes: no screen re-render, so a field that was just
  // typed in (and blurred by tapping + or -) is never replaced under the user's finger.
  const loadInput = isTime ? null : h('input', {
    name: 'load', type: 'text', inputmode: 'decimal', class: 'stepper-value',
    value: fmt(entry.load), 'aria-label': 'Carga em kg',
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
          h('span', null, `Aquecimento ${i + 1}: ${fmt(w.load)} kg × ${w.reps}`),
          h('button', {
            class: 'btn', 'data-action': 'log-warmup', 'data-idx': String(i),
            onclick: async () => {
              await logWarmup(0, w.load, w.reps, Date.now());
              await rerender();
            },
          }, 'Feito')))),
      h('p', { class: 'muted small' }, 'Séries de aquecimento não contam para recorde.'))
    : null;

  let workNumber = 0;
  const setRows = entry.sets.map((s) => {
    if (s.kind === 'work') workNumber += 1;
    return h('li', { class: `set-row${s.kind === 'work' ? '' : ' ' + s.kind}`, 'data-set-kind': s.kind },
      setRowText(entry, ex, s, workNumber));
  });

  const planned = entry.plannedSets;
  const header = done < planned ? `Série ${done + 1} de ${planned}` : `Séries planejadas concluídas (${planned} de ${planned})`;

  return h('div', { class: 'screen', 'data-screen': 'treino' },
    h('div', { class: 'topbar' },
      h('div', null,
        h('h1', { class: 'title' }, tpl.name),
        h('p', { class: 'subtitle muted' }, `Exercício ${idx + 1} de ${total}`))),
    h('div', { class: 'chips', 'data-role': 'overview' },
      draft.entries.map((e, i) => h('button', {
        class: `chip${i === idx ? ' selected' : ''}`, 'data-overview': String(i),
        'aria-label': EXERCISES[e.exerciseId].name,
        onclick: () => go(i),
      }, `${i + 1}: ${workSets(e).length}/${e.plannedSets}`))),
    warmupCard,
    h('div', { class: 'card current' },
      h('h2', { class: 'title' },
        h('a', { href: '#/exercicio/' + entry.exerciseId }, ex.name)),
      h('p', { class: 'muted' }, `${planned} × ${entry.repMin}–${entry.repMax}${isTime ? ' s' : ''}`),
      h('p', { 'data-role': 'set-header' }, header),
      isTime ? null : h('div', { class: 'stepper' },
        h('button', { class: 'btn btn-icon', 'data-action': 'load-minus', 'aria-label': 'Menos carga', onclick: onLoadStep(-1) }, '−'),
        loadInput,
        h('button', { class: 'btn btn-icon', 'data-action': 'load-plus', 'aria-label': 'Mais carga', onclick: onLoadStep(1) }, '+')),
      isTime ? null : h('p', { class: 'muted small' }, ex.equipment === 'halter' ? 'kg (cada halter)' : 'kg'),
      h('div', { class: 'stepper' },
        h('button', { class: 'btn btn-icon', 'data-action': 'reps-minus', 'aria-label': 'Menos repetições', onclick: onRepsStep(-1) }, '−'),
        repsSpan,
        h('button', { class: 'btn btn-icon', 'data-action': 'reps-plus', 'aria-label': 'Mais repetições', onclick: onRepsStep(1) }, '+')),
      h('p', { class: 'muted small' }, isTime ? 'segundos' : 'repetições'),
      h('p', { class: 'muted', 'data-role': 'previous' }, previousLine(entry, ex, prev)),
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
}
