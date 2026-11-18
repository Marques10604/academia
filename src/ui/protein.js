// '#/proteina': light protein tracking without a scale. Meal chips, big home-portion buttons, the day total with
// a neutral bar. Entries live in today's dailyLogs row (field `protein`). Labels come from the fixed tables in
// src/domain/protein.js by id, so text read from a stored row or a backup file is never displayed.
import { h } from './dom.js';
import { listDays, saveDay } from '../data/daily.js';
import { getSetting } from '../data/db.js';
import { averageWeight } from '../domain/body.js';
import { localDate } from '../domain/dates.js';
import { MEALS, PORTIONS, mealForHour, proteinTarget, dayTotal } from '../domain/protein.js';

// Same text as Today's dashboard line.
export function proteinLineText(total, targetG) {
  return `Proteína hoje: ${total} de ${targetG} g`;
}

export async function renderProtein() {
  const today = localDate(Date.now()); // the clock is read here in the UI layer, never in src/domain
  const days = await listDays();
  const row = days.find((d) => d.localDate === today) ?? null;
  const profile = await getSetting('profile', null);
  const avg = averageWeight(days, today);
  const target = proteinTarget({
    settingG: await getSetting('proteinTargetG', null), avgKg: avg?.avg, profileKg: profile?.weightKg,
  });

  // The in-memory list is the source of truth; every change writes the WHOLE list.
  const items = Array.isArray(row?.protein) ? row.protein.map((e) => ({ ...e })) : [];
  let meal = mealForHour(new Date().getHours()); // the clock is read here in the UI layer only

  const totalText = h('strong', { class: 'protein-total', 'data-role': 'protein-total' });
  const barFill = h('div', { class: 'bar-fill' });
  const error = h('div', { class: 'banner', 'data-role': 'protein-save-error', hidden: true });

  const refresh = () => {
    const total = dayTotal({ protein: items });
    totalText.textContent = `${total} de ${target.g} g hoje`;
    barFill.style.width = Math.min(100, (total / target.g) * 100) + '%';
  };

  // Writes run strictly one after the other, so three fast taps end with three entries and the last write holds the latest list.
  let chain = Promise.resolve();
  const persist = () => {
    const snapshot = items.map((e) => ({ ...e }));
    chain = chain
      .then(() => saveDay(today, { protein: snapshot.length ? snapshot : null }))
      .then(() => { error.hidden = true; })
      .catch(() => {
        error.textContent = 'Não foi possível salvar. Tente de novo.';
        error.hidden = false;
      });
    return chain;
  };

  const add = (food, g) => {
    items.push({ meal, food, g, at: Date.now() });
    refresh();
    persist();
  };

  const chips = MEALS.map((m) => h('button', {
    type: 'button',
    class: 'chip' + (m.id === meal ? ' selected' : ''),
    'data-meal': m.id,
    onclick: () => {
      meal = m.id;
      chips.forEach((c, i) => c.classList.toggle('selected', MEALS[i].id === meal));
    },
  }, m.label));

  const portions = PORTIONS.map((p) => h('button', {
    type: 'button', class: 'btn portion', 'data-portion': p.id, onclick: () => add(p.id, p.g),
  }, h('strong', null, p.label), h('span', { class: 'muted small' }, '~' + p.g + ' g')));

  refresh();
  return h('div', { class: 'screen', 'data-screen': 'proteina' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Proteína')),
    h('div', { class: 'card stack', 'data-role': 'protein-day' },
      totalText,
      h('div', { class: 'bar', 'aria-hidden': 'true' }, barFill),
      h('p', { class: 'muted small' }, 'Sem balança: cada botão é uma porção caseira. É uma estimativa.')),
    error,
    h('h2', { class: 'section-label' }, 'Refeição'),
    h('div', { class: 'chips', 'data-role': 'meals' }, chips),
    h('h2', { class: 'section-label' }, 'Toque para somar'),
    h('div', { class: 'portions' }, portions),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big', 'data-action': 'home', onclick: () => { location.hash = '#/hoje'; } }, 'Voltar')));
}
