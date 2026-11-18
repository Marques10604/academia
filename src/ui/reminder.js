// '#/lembrete': the morning-alarm guide. Three illustrated steps to create a repeating "Treino" alarm in the Android
// Clock app, plus an optional calendar file (.ics) with a daily event and an alarm at the chosen time.
// The app schedules nothing and never asks for notification permission (see src/domain/reminder.js for why).
import { h } from './dom.js';
import { getSetting, setSetting } from '../data/db.js';
import { buildIcs, cleanTime, ICS_FILE_NAME } from '../domain/reminder.js';
import { localDate } from '../domain/dates.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Same technique as src/ui/tabs.js: inline SVG made with createElementNS, no markup strings, no image files.
function icon(shapes) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24', width: '40', height: '40', fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'step-icon',
  })) svg.setAttribute(k, v);
  for (const [tag, attrs] of shapes) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  }
  return svg;
}

const STEPS = [
  {
    title: 'Abra o Relógio',
    text: 'Abra o app Relógio do celular e toque na aba Alarme.',
    shapes: [['circle', { cx: '12', cy: '12', r: '9' }], ['path', { d: 'M12 7v5l3 2' }]],
  },
  {
    title: 'Crie o alarme',
    text: 'Toque em + e escolha o horário (ex: 06:30). Marque os dias em que vai treinar, ou todos os dias.',
    shapes: [['circle', { cx: '12', cy: '12', r: '9' }], ['path', { d: 'M12 8v8M8 12h8' }]],
  },
  {
    title: 'Dê o nome Treino',
    text: 'Toque em Marcador (ou Nome do alarme) e escreva Treino. Pronto: ele toca todo dia, mesmo com o app fechado.',
    shapes: [['path', { d: 'M3 12V4h8l10 10-8 8z' }], ['circle', { cx: '7.5', cy: '7.5', r: '1.5' }]],
  },
];

export async function renderReminder() {
  const input = h('input', {
    type: 'time', name: 'reminder-time', 'aria-label': 'Horário do lembrete',
    value: cleanTime(await getSetting('reminderTime', null)),
  });
  const msg = h('p', { class: 'small', 'data-role': 'ics-msg' });

  // Same download mechanism as the backup: a text/calendar Blob and a temporary <a download>.
  const onDownload = async () => {
    const time = cleanTime(input.value);
    input.value = time;
    await setSetting('reminderTime', time);
    const now = Date.now();
    const text = buildIcs({ time, startDate: localDate(now), now, uid: `progride-${now}@progride` });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    const a = h('a', { href: url, download: ICS_FILE_NAME });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    msg.textContent = 'Arquivo salvo em Downloads: ' + ICS_FILE_NAME;
  };

  return h('div', { class: 'screen', 'data-screen': 'lembrete' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Lembrete matinal')),
    h('p', { class: 'muted' }, 'O app não consegue tocar um alarme sozinho: o Chrome não permite isso sem um servidor. O alarme do Relógio do celular é o jeito que nunca falha.'),
    h('h2', { class: 'section-label' }, 'No Relógio do Android'),
    STEPS.map((step) => h('div', { class: 'card row', 'data-role': 'alarm-step' },
      icon(step.shapes),
      h('div', { class: 'stack' }, h('strong', null, step.title), h('span', { class: 'small' }, step.text)))),
    h('h2', { class: 'section-label' }, 'Ou pela agenda (opcional)'),
    h('div', { class: 'card stack', 'data-role': 'ics' },
      h('div', { class: 'field' }, h('label', null, 'Horário'), input),
      h('button', { class: 'btn', 'data-action': 'download-ics', onclick: onDownload }, 'Baixar evento de calendário'),
      h('p', { class: 'muted small' }, 'Abra o arquivo baixado (pasta Downloads) e escolha a Agenda do Google: ela cria o evento Treino todo dia nesse horário. Se o aviso não tocar, abra o evento na agenda e adicione uma notificação.'),
      msg),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big', 'data-action': 'back', onclick: () => { location.hash = '#/config'; } }, 'Voltar')));
}
