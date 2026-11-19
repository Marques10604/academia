import { h } from './dom.js';
import { youtubeUrl } from '../data/exercises.js';

// Small "▶ Vídeo" pill on exercise cards: one tap opens the YouTube search for the exercise (needs internet).
export function videoLink(exercise) {
  return h('a', {
    class: 'video-link',
    'data-action': 'video',
    href: youtubeUrl(exercise),
    target: '_blank',
    rel: 'noopener',
    'aria-label': 'Ver vídeo de ' + exercise.name + ' no YouTube',
  }, '▶ Vídeo');
}
