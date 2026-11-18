// '#/corpo': morning check-in (weight, sleep, energy; all optional), the body-weight chart with its 7-day
// average, and the waist every 4 weeks. Values are plain numbers from fixed chips or from parseDecimal,
// so nothing typed is ever treated as markup.
import { h } from './dom.js';
import { listDays, saveDay } from '../data/daily.js';
import {
  readOptionalNumber, averageWeight, weightSeries, waistStatus, waistRows, WEIGHT_MIN, WEIGHT_MAX, WAIST_MIN, WAIST_MAX,
} from '../domain/body.js';
import { formatNumber } from '../domain/numbers.js';
import { localDate, brDate, brShort } from '../domain/dates.js';
import { lineChart } from './chart.js';

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

// Same text as Today's mini dashboard.
export function avgWeightText(avg) {
  return `Peso médio (7 dias): ${formatNumber(avg.avg)} kg · ${avg.n} ${avg.n === 1 ? 'pesagem' : 'pesagens'}`;
}

function weightCard(days, today) {
  const avg = averageWeight(days, today);
  const { raw, avg: line } = weightSeries(days);
  const chart = raw.length >= 2
    ? lineChart([{ points: raw, style: 'dots' }, { points: line, style: 'line' }], {
      label: 'Peso (kg): pontos = pesagens, linha = média de 7 dias',
      xLabels: [brShort(raw[0].localDate), brShort(raw[raw.length - 1].localDate)],
    })
    : h('p', { class: 'muted' }, 'Registre o peso por alguns dias para ver o gráfico.');
  return h('div', { class: 'card stack', 'data-role': 'weight' },
    h('h2', null, 'Peso'),
    avg ? h('p', { 'data-role': 'avg-weight' }, avgWeightText(avg)) : null,
    h('p', { class: 'muted small' }, 'O peso do dia varia 0,5 a 1,5 kg com água e comida. Olhe a linha da média.'),
    chart);
}

function deltaText(delta) {
  if (delta === null) return '';
  if (delta === 0) return ' (igual)';
  return ` (${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))} cm)`;
}

// The waist card re-draws only itself after a save (replaceWith), so anything typed in the check-in card stays.
function waistCard(days, today) {
  const status = waistStatus(days, today);
  const input = h('input', {
    type: 'text', inputmode: 'decimal', name: 'waist', autocomplete: 'off', placeholder: 'ex: 82,5',
  });
  const error = h('div', { class: 'banner', 'data-role': 'waist-error', hidden: true });
  const node = h('div', { class: 'card stack', 'data-role': 'waist' },
    h('h2', null, 'Cintura'),
    h('p', { class: 'muted' }, 'Fita na altura do umbigo, de manhã, relaxado, sem apertar. A cada 4 semanas.'),
    h('p', { 'data-role': 'waist-status' },
      status.due
        ? h('strong', null, 'Hora de medir a cintura')
        : `Próxima medida em ${status.dueInDays} ${status.dueInDays === 1 ? 'dia' : 'dias'}`),
    h('div', { class: 'field' }, h('label', null, 'Cintura (cm)'), input),
    error,
    h('button', {
      class: 'btn', 'data-action': 'save-waist',
      onclick: async (e) => {
        const r = readOptionalNumber(input.value, WAIST_MIN, WAIST_MAX);
        if (r.error || r.value === null) {
          error.textContent = 'Digite a cintura em cm, entre 40 e 200 (ex: 82,5).';
          error.hidden = false;
          return;
        }
        e.currentTarget.disabled = true;
        await saveDay(today, { waistCm: r.value });
        node.replaceWith(waistCard(await listDays(), today));
      },
    }, 'Salvar cintura'),
    waistRows(days).map((r) => h('p', { class: 'small', 'data-role': 'waist-row' },
      `${brDate(r.localDate)}: ${formatNumber(r.waistCm)} cm${deltaText(r.delta)}`
      + (r.avgWeight !== null ? ` · peso médio ${formatNumber(r.avgWeight)} kg` : ''))));
  return node;
}

export async function renderBody() {
  const today = localDate(Date.now()); // the clock is read here in the UI layer only
  const days = await listDays();
  const checkin = checkinCard(days.find((d) => d.localDate === today) ?? null, today);
  return h('div', { class: 'screen', 'data-screen': 'corpo' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Corpo')),
    checkin.node,
    weightCard(days, today),
    waistCard(days, today),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'save-checkin', onclick: checkin.save }, 'Salvar check-in')));
}
