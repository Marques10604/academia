// Exercise detail screen (#/exercicio/<id>). Works offline: all content is in src/data/exercises.js.
import { h } from './dom.js';
import { EXERCISES, youtubeUrl } from '../data/exercises.js';
import { PROGRAM } from '../data/program.js';
import { restText } from './reasons.js';
import { listSessions } from '../data/db.js';
import { getPref, savePref } from '../data/prefs.js';
import { exerciseHistory } from '../domain/history.js';
import { formatNumber } from '../domain/numbers.js';
import { unitFor, historyOpts, noteOf, cleanNote, NOTE_MAX, NOTE_LINES } from '../domain/units.js';
import { rerender } from '../app.js';

function prescriptions(exercise) {
  const lines = [];
  for (const tpl of Object.values(PROGRAM)) {
    const item = tpl.items.find((i) => i.exerciseId === exercise.id);
    if (!item) continue;
    const unit = exercise.type === 'time' ? ' s' : '';
    lines.push(`${tpl.name}: ${item.sets} × ${item.repMin}–${item.repMax}${unit} · ${restText(item.restSec)}`);
  }
  return lines;
}

// Fixed lists only (no free text): the stored value is always one of these numbers.
const INCREMENTS = { reps: [1, 2, 2.5, 5, 10], time: [5, 10] };

// "kg" or "placa" (only pin-loaded machines/cables). Changing it restarts that exercise's calibration.
function unitSection(exercise, pref) {
  const current = unitFor(exercise, pref);
  const choose = (next) => async () => {
    if (next === current) return;
    const hasHistory = exerciseHistory(await listSessions(), exercise.id, historyOpts(exercise, pref)).length > 0;
    if (hasHistory && !window.confirm('Trocar a unidade recomeça a calibração deste exercício')) return;
    await savePref(exercise.id, { unit: next, unitChangedAt: Date.now() });
    await rerender();
  };
  return h('div', { class: 'stack', 'data-role': 'unit' },
    h('h3', { class: 'card-sub' }, 'Unidade da carga'),
    h('div', { class: 'chips' },
      ['kg', 'placa'].map((u) => h('button', {
        class: `chip${u === current ? ' selected' : ''}`, 'data-unit': u, onclick: choose(u),
      }, u))),
    h('p', { class: 'muted small' }, "Use 'placa' se a máquina mostra só números (1, 2, 3…) e não kg."));
}

// "Minha regulagem": the user's own machine setup (seat hole, pad position...). Saved when the field loses focus.
function noteCard(exercise, pref) {
  const field = h('textarea', {
    name: 'note', rows: String(NOTE_LINES), maxlength: String(NOTE_MAX),
    placeholder: 'ex: banco no furo 4, almofada no 2', 'aria-label': 'Minha regulagem',
    value: noteOf(pref),
    onchange: async (e) => {
      const el = e.currentTarget;
      const note = cleanNote(el.value);
      el.value = note;
      await savePref(exercise.id, { note });
    },
  });
  return h('div', { class: 'card stack', 'data-role': 'note' },
    h('h2', null, 'Minha regulagem'),
    field,
    h('p', { class: 'muted small' }, 'Aparece no treino e na tela Hoje, para você não esquecer o ajuste do aparelho.'));
}

function incrementSection(exercise, current, unitName) {
  if (unitName === 'placa') {
    return h('div', { class: 'stack', 'data-role': 'increment' },
      h('h3', { class: 'card-sub' }, 'Incremento de carga'),
      h('p', null, 'Em placa, o salto é sempre 1 placa.'),
      h('p', { class: 'muted small' }, 'A carga sugerida é só uma sugestão: no treino você pode trocar com − e + a qualquer momento.'));
  }
  const unit = exercise.type === 'time' ? ' s' : ' kg';
  const values = [...INCREMENTS[exercise.type === 'time' ? 'time' : 'reps']];
  if (!values.includes(current)) values.push(current);
  values.sort((a, b) => a - b);
  return h('div', { class: 'stack', 'data-role': 'increment' },
    h('h3', { class: 'card-sub' }, 'Incremento de carga'),
    h('p', { class: 'muted small' }, 'Use o menor salto que sua academia permite: 1 pino, o próximo halter ou a menor anilha.'),
    h('div', { class: 'chips' },
      values.map((v) => h('button', {
        class: `chip${v === current ? ' selected' : ''}`, 'data-increment': String(v),
        onclick: async () => {
          await savePref(exercise.id, { incrementKg: v });
          await rerender();
        },
      }, formatNumber(v) + unit))),
    h('p', { class: 'muted small' }, 'A carga sugerida é só uma sugestão: no treino você pode trocar com − e + a qualquer momento.'));
}

export async function renderExercise(hash) {
  let id = '';
  try {
    id = decodeURIComponent(String(hash || '').split('/')[2] || '');
  } catch { /* malformed escape: treated as unknown id */ }
  const exercise = Object.hasOwn(EXERCISES, id) ? EXERCISES[id] : null;
  if (!exercise) {
    return h('div', { class: 'screen', 'data-screen': 'exercicio' },
      h('h1', { class: 'title' }, 'Exercício não encontrado'),
      h('a', { class: 'btn btn-primary', href: '#/hoje' }, 'Voltar para Hoje'));
  }

  const pref = await getPref(exercise.id);
  const unitName = unitFor(exercise, pref);
  const increment = pref?.incrementKg ?? exercise.incrementKg;
  const { primary, secondary } = exercise.muscles;
  const muscles = 'Músculos: ' + primary.join(', ') + (secondary.length ? ' · também: ' + secondary.join(', ') : '');

  // Cards, in order: Como fazer (setup + steps) · Erros comuns · Não tem a máquina? · Minha regulagem · Carga · links
  return h('div', { class: 'screen', 'data-screen': 'exercicio' },
    h('div', { class: 'stack tight' },
      h('h1', { class: 'title' }, exercise.name),
      h('p', { class: 'muted', 'data-role': 'muscles' }, muscles),
      prescriptions(exercise).map((line) => h('p', { class: 'muted small', 'data-role': 'prescription' }, line))),
    h('div', { class: 'card stack' },
      h('h2', null, 'Como fazer'),
      h('p', { 'data-role': 'setup' }, exercise.setup),
      h('ol', { 'data-role': 'steps' }, exercise.steps.map((s) => h('li', null, s)))),
    h('div', { class: 'card stack' },
      h('h2', null, 'Erros comuns'),
      h('ul', { 'data-role': 'mistakes' }, exercise.mistakes.map((m) => h('li', null, m)))),
    h('div', { class: 'card stack', 'data-role': 'alternative' },
      h('h2', null, 'Não tem a máquina?'),
      h('p', null, 'Está ocupada ou sua academia não tem? Use: ', h('strong', null, exercise.alternative))),
    noteCard(exercise, pref),
    h('div', { class: 'card stack', 'data-role': 'load-settings' },
      h('h2', null, 'Carga'),
      exercise.selectorized ? unitSection(exercise, pref) : null,
      incrementSection(exercise, increment, unitName)),
    h('div', { class: 'card stack' },
      h('a', { class: 'btn', 'data-action': 'exercise-history', href: '#/historico/' + exercise.id }, 'Ver histórico e gráfico'),
      h('a', {
        class: 'btn btn-big btn-primary',
        'data-action': 'youtube',
        href: youtubeUrl(exercise),
        target: '_blank',
        rel: 'noopener',
      }, 'Ver vídeo no YouTube'),
      h('p', { class: 'muted small' }, 'Precisa de internet. O app guarda seu treino enquanto você assiste.')),
    h('button', { class: 'btn btn-ghost', 'data-action': 'back', onclick: () => history.back() }, '‹ Voltar'));
}
