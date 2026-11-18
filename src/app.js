// Boot, hash router, rerender(). Add a route by adding an entry to ROUTES.
import { openDb, getActive, getSetting } from './data/db.js';
import { mount } from './ui/dom.js';
import { renderToday } from './ui/today.js';
import { renderWorkout } from './ui/workout.js';
import { renderSummary } from './ui/summary.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderSettings } from './ui/settings.js';
import { renderExercise } from './ui/exercise.js';
import { renderBackup } from './ui/backup.js';
import { renderHistory } from './ui/history.js';
import { renderBody } from './ui/body.js';
import { renderFirstDay } from './ui/firstday.js';
import { renderProtein } from './ui/protein.js';
import { renderReport } from './ui/report.js';
import { updateTabs } from './ui/tabs.js';

const ROUTES = {
  '#/primeiro-dia': renderFirstDay,
  '#/exercicio': renderExercise,
  '#/hoje': renderToday,
  '#/treino': renderWorkout,
  '#/resumo': renderSummary,
  '#/inicio': renderOnboarding,
  '#/config': renderSettings,
  '#/backup': renderBackup,
  '#/historico': renderHistory,
  '#/corpo': renderBody,
  '#/proteina': renderProtein,
  '#/relatorio': renderReport,
};

const root = () => document.getElementById('app');

async function render() {
  const hash = location.hash;
  // First open always goes through the medical notice + weight/height screen. '#/backup' is let through
  // so a fresh or wiped phone can restore a backup first (the restore brings onboardingDone back).
  if (hash !== '#/inicio' && hash !== '#/backup' && (await getSetting('onboardingDone', false)) !== true) {
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
  if (node) {
    mount(root(), node); // a screen that redirects returns null
    updateTabs(node.getAttribute('data-screen')); // bottom tab bar only on the four main screens
  }
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
