// '#/proteina': light protein tracking without a scale. Meal chips, big home-portion buttons, "Outro" grams, the
// day list (remove a wrong tap), the day total with a neutral bar, the 7-day line and the daily target.
// Entries live in today's dailyLogs row (field `protein`). Labels come from the fixed tables in
// src/domain/protein.js by id, so text read from a stored row or a backup file is never displayed.
import { h } from './dom.js';
import { listDays, saveDay } from '../data/daily.js';
import { getSetting, setSetting } from '../data/db.js';
import { averageWeight, readOptionalNumber } from '../domain/body.js';
import { formatNumber } from '../domain/numbers.js';
import { localDate } from '../domain/dates.js';
import { carbNudge, readWeightGoal } from '../domain/goals.js';
import { carbText } from './body.js';
import {
  MEALS, PORTIONS, OTHER_ID, GRAMS_MIN, GRAMS_MAX, TARGET_MIN, TARGET_MAX,
  mealForHour, autoTarget, proteinTarget, proteinFloor, dayTotal, weekStats, portionLabel, mealLabel,
} from '../domain/protein.js';

// Same text as Today's dashboard line.
export function proteinLineText(total, targetG) {
  return `Proteína hoje: ${total} de ${targetG} g`;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export async function renderProtein() {
  const today = localDate(Date.now()); // the clock is read here in the UI layer, never in src/domain
  const days = await listDays();
  const row = days.find((d) => d.localDate === today) ?? null;
  const profile = await getSetting('profile', null);
  const avgKg = averageWeight(days, today)?.avg;
  const autoKg = proteinTarget({ avgKg, profileKg: profile?.weightKg }).kg; // the weight the automatic target is based on
  let settingG = await getSetting('proteinTargetG', null);
  let target = proteinTarget({ settingG, avgKg, profileKg: profile?.weightKg });

  // The in-memory list is the source of truth; every change writes the WHOLE list.
  const items = Array.isArray(row?.protein) ? row.protein.map((e) => ({ ...e })) : [];
  let meal = mealForHour(new Date().getHours()); // the clock is read here in the UI layer only

  const totalText = h('strong', { class: 'protein-total', 'data-role': 'protein-total' });
  const barFill = h('div', { class: 'bar-fill' });
  const list = h('div', { class: 'stack tight', 'data-role': 'protein-list' });
  const week = h('p', { 'data-role': 'protein-week' });
  const targetText = h('strong', { 'data-role': 'protein-target-text' });
  const floorText = h('p', { class: 'muted small' });
  const saveError = h('div', { class: 'banner', 'data-role': 'protein-save-error', hidden: true });
  const gramsError = h('div', { class: 'banner', 'data-role': 'protein-error', hidden: true });
  const targetError = h('div', { class: 'banner', 'data-role': 'protein-target-error', hidden: true });

  // Updates only the pieces that change (never re-renders the screen), so text typed in the fields is kept.
  const refresh = () => {
    const total = dayTotal({ protein: items });
    const floor = proteinFloor(target.g);
    totalText.textContent = `${total} de ${target.g} g hoje`;
    barFill.style.width = Math.min(100, (total / target.g) * 100) + '%';

    const others = days.filter((d) => d.localDate !== today);
    const stats = weekStats([...others, { localDate: today, protein: items }], today, floor);
    week.textContent = stats.logged === 0
      ? 'Anote por alguns dias para ver a média da semana.'
      : `Últimos 7 dias: média de ${stats.avg} g por dia anotado (${plural(stats.logged, 'dia', 'dias')}) · ${plural(stats.hit, 'dia', 'dias')} com ${floor} g ou mais`;

    targetText.textContent = `Meta: ${target.g} g por dia`
      + (target.auto ? ` (1,7 g por kg · peso ${formatNumber(target.kg)} kg)` : ' (definida por você)');
    floorText.textContent = `Dias com ${floor} g ou mais contam como meta batida.`;

    list.replaceChildren(...(items.length === 0
      ? [h('p', { class: 'muted' }, 'Nada anotado hoje.')]
      : items.map((e, i) => h('div', { class: 'row between', 'data-role': 'protein-item' },
        h('span', null, [mealLabel(e.meal), portionLabel(e.food), `${Math.round(e.g)} g`].filter((t) => t !== '').join(' · ')),
        h('button', {
          type: 'button', class: 'btn btn-ghost', 'data-action': 'remove-protein', 'aria-label': 'Remover',
          onclick: () => { items.splice(i, 1); refresh(); persist(); },
        }, 'remover'))).reverse())); // newest first
  };

  // Writes run strictly one after the other, so three fast taps end with three entries and the last write holds the latest list.
  let chain = Promise.resolve();
  const persist = () => {
    const snapshot = items.map((e) => ({ ...e }));
    chain = chain
      .then(() => saveDay(today, { protein: snapshot.length ? snapshot : null }))
      .then(() => { saveError.hidden = true; })
      .catch(() => {
        saveError.textContent = 'Não foi possível salvar. Tente de novo.';
        saveError.hidden = false;
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

  const gramsInput = h('input', {
    type: 'text', inputmode: 'numeric', name: 'protein-grams', autocomplete: 'off', placeholder: 'ex: 15',
  });
  const onAddGrams = () => {
    const r = readOptionalNumber(gramsInput.value, GRAMS_MIN, GRAMS_MAX);
    if (r.error || r.value === null) {
      gramsError.textContent = 'Digite os gramas de proteína, entre 1 e 150 (ex: 15).';
      gramsError.hidden = false;
      return;
    }
    gramsError.hidden = true;
    gramsInput.value = '';
    add(OTHER_ID, Math.round(r.value));
  };

  const targetInput = h('input', {
    type: 'text', inputmode: 'numeric', name: 'protein-target', autocomplete: 'off',
    placeholder: String(autoTarget(autoKg)),
    onchange: () => onTargetChange(),
  });
  const onTargetChange = async () => {
    const r = readOptionalNumber(targetInput.value, TARGET_MIN, TARGET_MAX);
    if (r.error) {
      targetError.textContent = 'Digite a meta em gramas, entre 40 e 300 (ex: 120).';
      targetError.hidden = false;
      return;
    }
    targetError.hidden = true;
    settingG = r.value === null ? null : Math.round(r.value); // empty = automatic again
    target = proteinTarget({ settingG, avgKg, profileKg: profile?.weightKg });
    refresh();
    await setSetting('proteinTargetG', settingG);
  };

  // One more carbohydrate portion when the 7-day average weight has stalled for 2 weeks (same text as Corpo).
  const nudge = carbNudge(days, today, readWeightGoal(await getSetting('weightGoal', null)));

  refresh();
  return h('div', { class: 'screen', 'data-screen': 'proteina' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Proteína')),
    h('div', { class: 'card stack', 'data-role': 'protein-day' },
      totalText,
      h('div', { class: 'bar', 'aria-hidden': 'true' }, barFill),
      h('p', { class: 'muted small' }, 'Sem balança: cada botão é uma porção caseira. É uma estimativa.')),
    saveError,
    h('h2', { class: 'section-label' }, 'Refeição'),
    h('div', { class: 'chips', 'data-role': 'meals' }, chips),
    h('h2', { class: 'section-label' }, 'Toque para somar'),
    h('div', { class: 'portions' }, portions),
    h('h2', { class: 'section-label' }, 'Anotado hoje'),
    h('div', { class: 'card' }, list),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' },
        h('label', null, 'Outro alimento (gramas de proteína)'),
        h('div', { class: 'row' }, gramsInput, h('button', { type: 'button', class: 'btn', 'data-action': 'add-grams', onclick: onAddGrams }, 'Somar'))),
      gramsError),
    h('h2', { class: 'section-label' }, 'Semana'),
    h('div', { class: 'card stack' },
      week,
      nudge ? h('p', { class: 'small', 'data-role': 'carb-nudge' }, carbText(nudge.gainKg)) : null),
    h('div', { class: 'card stack', 'data-role': 'protein-target' },
      targetText,
      floorText,
      h('div', { class: 'field' },
        h('label', null, 'Mudar a meta (g por dia, vazio = automática)'),
        targetInput),
      targetError),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big', 'data-action': 'home', onclick: () => { location.hash = '#/hoje'; } }, 'Voltar')));
}
