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
import { getSetting, setSetting } from '../data/db.js';
import {
  photoStatus, carbNudge, weightTrend, healthyPace, readWeightGoal, weightGoalStatus, paceVerdict, startWeight,
} from '../domain/goals.js';

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
    error,
    h('button', { class: 'btn btn-primary', 'data-action': 'save-checkin', onclick: save }, 'Salvar check-in'));
  return { node, save };
}

// Same text as Today's mini dashboard.
export function avgWeightText(avg) {
  return `Peso médio (7 dias): ${formatNumber(avg.avg)} kg · ${avg.n} ${avg.n === 1 ? 'pesagem' : 'pesagens'}`;
}

// The carbohydrate suggestion (no calories, only home portions). Also used by '#/proteina'.
export function carbText(gainKg) {
  const sign = gainKg > 0 ? '+' : gainKg < 0 ? '−' : '';
  return `Seu peso médio quase não mudou nas últimas 2 semanas (${sign}${formatNumber(Math.abs(gainKg))} kg). `
    + 'Para ganhar massa, acrescente 1 porção de carboidrato por dia: 1 banana com aveia, 4 colheres a mais de arroz ou 1 pão com ovo.';
}

const signed = (kg) => `${kg > 0 ? '+' : kg < 0 ? '−' : ''}${formatNumber(Math.abs(kg))}`;

function weightCard(days, today, goal) {
  const avg = averageWeight(days, today);
  const nudge = carbNudge(days, today, goal);
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
    nudge ? h('p', { class: 'small', 'data-role': 'carb-nudge' }, carbText(nudge.gainKg)) : null,
    h('p', { class: 'muted small' }, 'O peso do dia varia 0,5 a 1,5 kg com água e comida. Olhe a linha da média.'),
    chart);
}

const PACE_NOTE = {
  ok: ' (no ritmo)',
  slow: ' (mais devagar que o sugerido)',
  fast: ' (mais rápido que o sugerido: pode virar mais gordura que músculo)',
};

// "Meta de peso": target weight, what is left, the healthy pace and the user's own pace over the last 2 weeks.
// Like the waist card it redraws only itself (replaceWith) after a save, so an unsaved check-in is kept.
function weightGoalCard(days, today, goal, profileKg) {
  const avg = averageWeight(days, today);
  const nowKg = avg ? avg.avg : null;
  const input = h('input', {
    type: 'text', inputmode: 'decimal', name: 'weight-goal', autocomplete: 'off', placeholder: 'ex: 75',
  });
  const error = h('div', { class: 'banner', 'data-role': 'weight-goal-error', hidden: true });
  const redraw = async () => node.replaceWith(weightGoalCard(await listDays(), today, readWeightGoal(await getSetting('weightGoal', null)), profileKg));

  const status = goal && nowKg !== null ? weightGoalStatus(goal, nowKg) : null;
  const direction = status && status.direction !== 'done' ? status.direction : (goal && goal.targetKg < goal.startKg ? 'lose' : 'gain');
  const trend = weightTrend(days, today);
  const parts = [];
  if (!goal) {
    const pace = healthyPace(startWeight(days, today, profileKg) ?? 70);
    parts.push(h('p', { class: 'muted' },
      `Defina um peso-alvo. Ritmo saudável para ganhar massa: 0,25% a 0,4% do peso por semana (cerca de ${formatNumber(pace.minKg)} a ${formatNumber(pace.maxKg)} kg).`));
  } else {
    parts.push(h('p', { 'data-role': 'weight-goal-status' },
      status && status.direction === 'done'
        ? h('strong', null, 'Meta alcançada! Defina uma nova quando quiser.')
        : status
          ? `Meta: ${formatNumber(goal.targetKg)} kg · faltam ${formatNumber(status.remainingKg)} kg`
          : `Meta: ${formatNumber(goal.targetKg)} kg`));
    if (status) {
      parts.push(h('div', { class: 'bar', 'aria-hidden': 'true' }, h('div', { class: 'bar-fill', style: { width: `${status.progressPct}%` } })));
      if (status.direction !== 'done') {
        const pace = healthyPace(nowKg);
        parts.push(h('p', { class: 'small', 'data-role': 'weight-goal-pace' },
          `Ritmo saudável: ${formatNumber(pace.minKg)} a ${formatNumber(pace.maxKg)} kg por semana · de ${status.weeksMin} a ${status.weeksMax} semanas`));
      }
    }
    parts.push(h('p', { class: 'small', 'data-role': 'weight-goal-trend' },
      trend === null
        ? 'Registre o peso por 2 semanas para ver o seu ritmo.'
        : `Últimas 2 semanas: ${signed(trend.perWeekKg)} kg por semana`
          + PACE_NOTE[paceVerdict(trend.perWeekKg, healthyPace(trend.nowKg), direction)]));
  }
  const node = h('div', { class: 'card stack', 'data-role': 'weight-goal' },
    h('h2', null, 'Meta de peso'),
    parts,
    h('div', { class: 'field' }, h('label', null, 'Peso-alvo (kg)'), input),
    error,
    h('button', {
      class: 'btn', 'data-action': 'save-weight-goal',
      onclick: async (e) => {
        const r = readOptionalNumber(input.value, WEIGHT_MIN, WEIGHT_MAX);
        if (r.error || r.value === null) {
          error.textContent = 'Digite o peso-alvo em kg, entre 30 e 250 (ex: 75).';
          error.hidden = false;
          return;
        }
        e.currentTarget.disabled = true;
        await setSetting('weightGoal', { targetKg: r.value, startKg: startWeight(days, today, profileKg) ?? r.value, setAt: today });
        await redraw();
      },
    }, 'Salvar meta'),
    goal ? h('button', {
      class: 'btn btn-ghost', 'data-action': 'clear-weight-goal',
      onclick: async (e) => {
        e.currentTarget.disabled = true;
        await setSetting('weightGoal', null);
        await redraw();
      },
    }, 'Remover meta') : null);
  return node;
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

// Photos live in the phone gallery, never in the app: this card only reminds every 4 weeks and explains how.
// "Tirei as fotos hoje" redraws only this card (replaceWith), so an unsaved check-in above is kept.
function photosCard(lastPhotosAt, today) {
  const status = photoStatus(lastPhotosAt, today);
  const node = h('div', { class: 'card stack', 'data-role': 'photos' },
    h('h2', null, 'Fotos de progresso'),
    h('p', { 'data-role': 'photos-status' },
      status.due
        ? h('strong', null, 'Hora de tirar as fotos')
        : `Próximas fotos em ${status.dueInDays} ${status.dueInDays === 1 ? 'dia' : 'dias'}`),
    h('ul', { class: 'small plan-list' },
      h('li', null, 'Frente, lado e costas, em pé e relaxado.'),
      h('li', null, 'Mesmo lugar, mesma luz e mesma roupa, de manhã antes de comer.'),
      h('li', null, 'Celular na altura do umbigo, a uns 2 metros.'),
      h('li', null, 'Salve num álbum "Progride" na galeria do celular. As fotos não ficam no app e não vão no backup.')),
    h('button', {
      class: 'btn', 'data-action': 'photos-done',
      onclick: async (e) => {
        e.currentTarget.disabled = true;
        await setSetting('lastPhotosAt', today);
        node.replaceWith(photosCard(today, today));
      },
    }, 'Tirei as fotos hoje'));
  return node;
}

export async function renderBody() {
  const today = localDate(Date.now()); // the clock is read here in the UI layer only
  const days = await listDays();
  const goal = readWeightGoal(await getSetting('weightGoal', null));
  const profile = await getSetting('profile', null);
  const checkin = checkinCard(days.find((d) => d.localDate === today) ?? null, today);
  return h('div', { class: 'screen', 'data-screen': 'corpo' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Corpo')),
    checkin.node,
    weightCard(days, today, goal),
    weightGoalCard(days, today, goal, profile?.weightKg),
    waistCard(days, today),
    photosCard(await getSetting('lastPhotosAt', null), today));
}
