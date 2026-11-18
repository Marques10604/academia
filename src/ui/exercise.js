// Exercise detail screen (#/exercicio/<id>). Works offline: all content is in src/data/exercises.js.
import { h } from './dom.js';
import { EXERCISES, youtubeUrl } from '../data/exercises.js';
import { PROGRAM } from '../data/program.js';
import { restText } from './reasons.js';

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

  const { primary, secondary } = exercise.muscles;
  const muscles = 'Músculos: ' + primary.join(', ') + (secondary.length ? ' · também: ' + secondary.join(', ') : '');

  return h('div', { class: 'screen', 'data-screen': 'exercicio' },
    h('div', { class: 'topbar' },
      h('h1', { class: 'title' }, exercise.name)),
    h('p', { class: 'muted', 'data-role': 'muscles' }, muscles),
    h('div', { class: 'stack' },
      prescriptions(exercise).map((line) => h('p', { class: 'small', 'data-role': 'prescription' }, line)),
      h('div', { class: 'card' },
        h('h2', null, 'Ajuste do aparelho'),
        h('p', { 'data-role': 'setup' }, exercise.setup)),
      h('div', { class: 'card' },
        h('h2', null, 'Como fazer'),
        h('ol', { 'data-role': 'steps' }, exercise.steps.map((s) => h('li', null, s)))),
      h('div', { class: 'card' },
        h('h2', null, 'Erros comuns'),
        h('ul', { 'data-role': 'mistakes' }, exercise.mistakes.map((m) => h('li', null, m)))),
      h('a', {
        class: 'btn btn-big btn-primary',
        'data-action': 'youtube',
        href: youtubeUrl(exercise),
        target: '_blank',
        rel: 'noopener',
      }, 'Ver vídeo no YouTube'),
      h('p', { class: 'muted small' }, 'Precisa de internet. O app guarda seu treino enquanto você assiste.'),
      h('button', { class: 'btn btn-ghost', 'data-action': 'back', onclick: () => history.back() }, '‹ Voltar')));
}
