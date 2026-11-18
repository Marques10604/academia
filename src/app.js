// Boot, hash router, rerender(). Add a route by adding an entry to ROUTES.
import { openDb, getActive, getSetting } from './data/db.js';
import { mount } from './ui/dom.js';
import { renderToday } from './ui/today.js';
import { renderWorkout } from './ui/workout.js';
import { renderSummary } from './ui/summary.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderSettings } from './ui/settings.js';
import { renderExercise } from './ui/exercise.js';

const ROUTES = {
  '#/exercicio': renderExercise,
  '#/hoje': renderToday,
  '#/treino': renderWorkout,
  '#/resumo': renderSummary,
  '#/inicio': renderOnboarding,
  '#/config': renderSettings,
};

const root = () => document.getElementById('app');

async function render() {
  const hash = location.hash;
  // First open always goes through the medical notice + weight/height screen.
  if (hash !== '#/inicio' && (await getSetting('onboardingDone', false)) !== true) {
    location.hash = '#/inicio';
    return; // hashchange re-enters render()
  }
  // Exact match first; routes with a parameter ('#/resumo/<id>') match by prefix.
  const key = ROUTES[hash] ? hash : Object.keys(ROUTES).find((k) => hash.startsWith(k + '/'));
  if (!key) {
    const draft = await getActive();
    location.hash = draft ? '#/treino' : '#/hoje';
    return; // hashchange re-enters render()
  }
  const node = await ROUTES[key](hash);
  if (node) mount(root(), node); // a screen that redirects returns null
}

export function rerender() {
  return render();
}

async function boot() {
  try {
    await openDb();
  } catch (err) {
    mount(root(), document.createTextNode('Não foi possível abrir o armazenamento do aparelho: ' + err));
    return;
  }
  window.addEventListener('hashchange', render);
  await render();
  // A failed registration must never break the workout. The worker never takes over an open app.
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    } catch { /* offline support is a bonus */ }
  }
}

boot();
