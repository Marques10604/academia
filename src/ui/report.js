// '#/relatorio': the AI report. A read-only text built from the user's own data, copied in one tap (or shared)
// to paste into any free AI. No key, no network call: the text leaves the phone only when the user pastes it.
import { h } from './dom.js';
import { listSessions, getSetting } from '../data/db.js';
import { listDays } from '../data/daily.js';
import { EXERCISES } from '../data/exercises.js';
import { buildReport } from '../domain/report.js';
import { readWeeklyGoal } from '../domain/week.js';
import { localDate } from '../domain/dates.js';

const COPIED = 'Copiado! Agora cole na IA.';
const NOT_COPIED = 'Não deu para copiar sozinho: o texto está selecionado, use Copiar do celular.';

export async function renderReport() {
  const profile = await getSetting('profile', null);
  const text = buildReport({
    sessions: await listSessions(),
    days: await listDays(),
    exercises: EXERCISES,
    today: localDate(Date.now()),
    weeklyGoal: readWeeklyGoal(await getSetting('weeklyGoal', null)),
    proteinTargetG: await getSetting('proteinTargetG', null),
    weightGoal: await getSetting('weightGoal', null),
    profileKg: profile?.weightKg,
  });

  const area = h('textarea', { name: 'ai-report', readonly: 'readonly', rows: '14', 'aria-label': 'Texto do relatório', value: text });
  const msg = h('p', { class: 'small', 'data-role': 'copy-msg' });

  // Clipboard API first; when it is missing or refused, select the text and use the old copy command.
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      msg.textContent = COPIED;
      return;
    } catch { /* falls through to the selection fallback */ }
    area.focus();
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    msg.textContent = ok ? COPIED : NOT_COPIED;
  };

  const onShare = async () => {
    try {
      await navigator.share({ title: 'Relatório do treino (Progride)', text });
      msg.textContent = '';
    } catch (err) {
      if (err && err.name === 'AbortError') return; // the user closed the sheet
      msg.textContent = 'Não deu para compartilhar. Use Copiar texto.';
    }
  };

  return h('div', { class: 'screen', 'data-screen': 'relatorio' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Relatório para IA')),
    h('p', { class: 'muted' }, 'Copie o texto e cole no ChatGPT, no Gemini ou no Claude (as versões grátis servem). O relatório não tem o seu nome. Confira antes de colar.'),
    area,
    h('button', { class: 'btn btn-big btn-primary', 'data-action': 'copy-report', onclick: onCopy }, 'Copiar texto'),
    typeof navigator.share === 'function'
      ? h('button', { class: 'btn', 'data-action': 'share-report', onclick: onShare }, 'Compartilhar')
      : null,
    msg,
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big', 'data-action': 'back', onclick: () => { location.hash = '#/config'; } }, 'Voltar')));
}
