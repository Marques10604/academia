// '#/corpo': morning check-in (weight, sleep, energy; all optional). Values are plain numbers from fixed chips
// or from parseDecimal, so nothing typed is ever treated as markup.
import { h } from './dom.js';
import { getDay, saveDay } from '../data/daily.js';
import { readOptionalNumber, WEIGHT_MIN, WEIGHT_MAX } from '../domain/body.js';
import { formatNumber } from '../domain/numbers.js';
import { localDate } from '../domain/dates.js';

// Five chips 1-5 for one rating. A tap selects, a tap on the selected chip clears. The selected class is
// toggled in place (no re-render), so a weight typed in the field above is never lost.
function ratingChips(attr, initial, onChange) {
  let current = initial ?? null;
  const chips = [1, 2, 3, 4, 5].map((v) => h('button', {
    type: 'button',
    class: 'chip' + (v === current ? ' selected' : ''),
    [attr]: String(v),
    onclick: () => {
      current = current === v ? null : v;
      chips.forEach((c, i) => c.classList.toggle('selected', i + 1 === current));
      onChange(current);
    },
  }, String(v)));
  return h('div', { class: 'chips' }, chips);
}

function checkinCard(row, today) {
  let sleep = row?.sleep ?? null;
  let energy = row?.energy ?? null;
  const weight = h('input', {
    type: 'text', inputmode: 'decimal', name: 'checkin-weight', autocomplete: 'off', placeholder: 'ex: 70,4',
    value: typeof row?.weightKg === 'number' ? formatNumber(row.weightKg) : '',
  });
  const error = h('div', { class: 'banner', 'data-role': 'checkin-error', hidden: true });
  const save = async (e) => {
    const r = readOptionalNumber(weight.value, WEIGHT_MIN, WEIGHT_MAX);
    if (r.error) {
      error.textContent = 'Digite o peso em kg, entre 30 e 250 (ex: 70,4).';
      error.hidden = false;
      return;
    }
    e.currentTarget.disabled = true;
    await saveDay(today, { weightKg: r.value, sleep, energy });
    location.hash = '#/hoje';
  };
  const node = h('div', { class: 'card stack', 'data-role': 'checkin' },
    h('h2', null, 'Check-in da manhã'),
    h('p', { class: 'muted' }, 'Ao acordar, depois do banheiro e antes de comer. Tudo é opcional.'),
    h('div', { class: 'field' }, h('label', null, 'Peso (kg)'), weight),
    h('div', { class: 'field' },
      h('label', null, 'Sono'),
      ratingChips('data-sleep', sleep, (v) => { sleep = v; }),
      h('span', { class: 'muted small' }, '1 = dormi muito mal · 5 = dormi muito bem')),
    h('div', { class: 'field' },
      h('label', null, 'Energia'),
      ratingChips('data-energy', energy, (v) => { energy = v; }),
      h('span', { class: 'muted small' }, '1 = sem energia · 5 = muita energia')),
    error);
  return { node, save };
}

export async function renderBody() {
  const today = localDate(Date.now()); // the clock is read here in the UI layer only
  const row = await getDay(today);
  const checkin = checkinCard(row, today);
  return h('div', { class: 'screen', 'data-screen': 'corpo' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Corpo')),
    checkin.node,
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'save-checkin', onclick: checkin.save }, 'Salvar check-in'),
      h('a', { class: 'btn', 'data-action': 'back-today', href: '#/hoje' }, 'Voltar')));
}
