// Boot, hash router, rerender(). Add a route by adding an entry to ROUTES.
import { openDb, getActive } from './data/db.js';
import { mount } from './ui/dom.js';
import { renderToday } from './ui/today.js';
import { renderWorkout } from './ui/workout.js';
import { renderSummary } from './ui/summary.js';

const ROUTES = {
  '#/hoje': renderToday,
  '#/treino': renderWorkout,
  '#/resumo': renderSummary,
};

const root = () => document.getElementById('app');

async function render() {
  const hash = location.hash;
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
}

boot();
