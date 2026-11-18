import { h } from './dom.js';
import { setSetting, requestPersist } from '../data/db.js';
import { getDay, saveDay } from '../data/daily.js';
import { localDate } from '../domain/dates.js';
import { DEFAULT_PROFILE, PLAN_LINES, initialWeightLine } from '../domain/profile.js';

// First screen: a ready welcome, nothing to type. "Começar" saves the default profile and the first weigh-in
// (same dailyLogs row the morning check-in uses), then opens Today.
export function renderOnboarding() {
  const onStart = async (e) => {
    e.currentTarget.disabled = true;
    const now = Date.now();
    await setSetting('profile', { name: DEFAULT_PROFILE.name, weightKg: DEFAULT_PROFILE.weightKg, savedAt: now });
    const today = localDate(now); // the clock is read here in the UI layer only
    const row = await getDay(today);
    if (typeof row?.weightKg !== 'number') await saveDay(today, { weightKg: DEFAULT_PROFILE.weightKg });
    await setSetting('onboardingDone', true);
    requestPersist().catch(() => {}); // ask to protect the data right after the first real save; never wait on it
    location.hash = '#/hoje';
  };

  return h('div', { class: 'screen welcome', 'data-screen': 'inicio' },
    h('div', { class: 'brand brand-center' },
      h('img', { class: 'brand-logo', src: './icons/icon.svg', alt: '', width: '72', height: '72' }),
      h('span', { class: 'brand-name' }, 'Progride')),
    h('h1', { class: 'title welcome-title' }, `Bem-vindo, ${DEFAULT_PROFILE.name}!`),
    h('div', { class: 'card stack', 'data-role': 'plan-summary' },
      h('strong', null, 'Seu plano já está montado:'),
      h('ul', { class: 'plan-list' },
        [...PLAN_LINES, initialWeightLine(DEFAULT_PROFILE.weightKg)].map((line) => h('li', null, line)))),
    h('div', { class: 'notice small', 'data-role': 'medical-notice' },
      h('p', null, 'Este app não é aconselhamento médico. Faça um check-up (coração e pressão) antes de começar.'),
      h('p', null, 'Pare e procure ajuda se sentir dor no peito, falta de ar ou tontura.')),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'accept-onboarding', onclick: onStart }, 'Começar'),
      h('button', {
        class: 'btn btn-ghost', 'data-action': 'restore-backup',
        onclick: () => { location.hash = '#/backup'; },
      }, 'Já tenho um backup — restaurar')));
}
