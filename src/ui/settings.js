import { h } from './dom.js';
import { getSetting, setSetting, isPersisted, listSessions, clearAll } from '../data/db.js';
import { backupStatus } from '../domain/backup.js';
import { localDate } from '../domain/dates.js';
import { backupAgeText } from './backup.js';
import { APP_VERSION } from '../version.js';
import { PROGRAM } from '../data/program.js';
import { PLAN_LINES, DEFAULT_PROFILE, NAME_MAX, cleanName } from '../domain/profile.js';
import { readWeeklyGoal, WEEKLY_GOAL_MAX } from '../domain/week.js';

const p = (text) => h('p', { class: 'small' }, text);

// The two guides live in the repository; the app only links to them on github.com (opens in the browser).
const KIT_URL = 'https://github.com/Marques10604/academia/blob/main/KIT-SOCORRO-IA.md';
const MANUAL_URL = 'https://github.com/Marques10604/academia/blob/main/MANUAL.md';
const external = (props, text) => h('a', { class: 'btn', ...props, target: '_blank', rel: 'noopener noreferrer' }, text);

// Plain-language explanation of the program (source: .planning/research/TRAINING-SCIENCE.md).
function planCard() {
  return h('details', { class: 'card collapsible', 'data-role': 'plan' },
    h('summary', null, 'Como funciona seu treino'),
    h('div', { class: 'stack plan-body' },
    p('Full body: todo treino trabalha o corpo inteiro. Com 2 ou 3 treinos por semana cada músculo é treinado pelo menos 2 vezes, que é o que os estudos indicam para crescer. Faltou um dia? Nada quebra: o app segue do treino seguinte.'),
    p(`Treino A: ${PROGRAM.A.goal}`),
    p(`Treino B: ${PROGRAM.B.goal}`),
    p('Subir o peso (dupla progressão): tente fazer mais repetições com o mesmo peso. Quando fizer todas as séries no máximo da faixa (ex: 3 × 12), o app sobe a carga.'),
    h('strong', null, 'Seu plano do 1º mês (3 treinos por semana)'),
    p('Semana 1 (treinos 1–3): aprender. Nos treinos 1 e 2 você descobre a carga de cada exercício. 2 séries, sobrando 3–4 repetições.'),
    p('Semana 2 (treinos 4–6): adaptação. 2 séries, sobrando 3 e depois 2 repetições.'),
    p('Semanas 3 e 4 (treinos 7–12): base. 3 séries nos exercícios grandes, 2 nos pequenos; a última série sobrando 1–2 repetições. Não precisa ir até a falha.'),
    p('Descanso entre séries: 2 min nos grandes (leg press, supino, puxada, agachamento, desenvolvimento, remada, stiff), 1 min 30 s nos médios (mesa flexora, voador), 1 min nos pequenos.'),
    p('Entre treinos: pelo menos 1 dia livre se der (ex: seg/qua/sex). Mesmos exercícios por 8 a 12 semanas. Ficou 10+ dias parado: volte com 90% da carga; 4+ semanas: 80% (o app faz sozinho).')));
}

// "Meu perfil": the name (text field, saved when it changes) and the plan in three lines. Weight is not here:
// it lives in the morning check-in and in Corpo.
function profileCard(profile) {
  const name = h('input', {
    type: 'text', name: 'profile-name', autocomplete: 'off', maxlength: String(NAME_MAX), 'aria-label': 'Seu nome',
    value: profile?.name ?? DEFAULT_PROFILE.name,
    onchange: async (e) => {
      const el = e.currentTarget;
      const next = cleanName(el.value);
      el.value = next;
      // keeps any other fields of the saved profile (older backups carry weight/height)
      await setSetting('profile', { ...(await getSetting('profile', null)), name: next, savedAt: Date.now() });
    },
  });
  return h('div', { class: 'card stack', 'data-role': 'profile' },
    h('h2', null, 'Meu perfil'),
    h('div', { class: 'field' }, h('label', null, 'Nome'), name),
    h('ul', { class: 'plan-list small', 'data-role': 'profile-plan' }, PLAN_LINES.map((line) => h('li', null, line))));
}

// "Meta de treinos": 1-6 workouts per week. A tap saves and moves the selected class in place (no re-render).
function weeklyGoalCard(goal) {
  let current = goal;
  const chips = Array.from({ length: WEEKLY_GOAL_MAX }, (_, i) => i + 1).map((n) => h('button', {
    type: 'button',
    class: 'chip' + (n === current ? ' selected' : ''),
    'data-weekly-goal': String(n),
    onclick: async () => {
      current = n;
      chips.forEach((c, i) => c.classList.toggle('selected', i + 1 === current));
      await setSetting('weeklyGoal', n);
    },
  }, String(n)));
  return h('div', { class: 'card stack', 'data-role': 'weekly-goal' },
    h('h2', null, 'Meta de treinos'),
    h('div', { class: 'field' }, h('label', null, 'Treinos por semana'), h('div', { class: 'chips' }, chips)),
    h('p', { class: 'muted small' }, 'A sequência conta as semanas em que você bateu a meta. Pode falhar 1 semana: ela só zera com 2 semanas seguidas abaixo da meta.'));
}

// Two confirmations, then every store is cleared and the app goes back to the first-install screen.
// (Cancel on the first one leaves room to make a backup, right above on this screen.)
async function onResetAll(e) {
  const button = e.currentTarget;
  const first = confirm('Isso apaga todos os treinos, check-ins, cargas e configurações deste celular. Não dá para desfazer. Quer fazer um backup antes?\n\nToque em Cancelar para voltar e fazer o backup, ou em OK para continuar.');
  if (!first) return;
  if (!confirm('Apagar tudo agora?')) return;
  button.disabled = true;
  try {
    await clearAll();
  } catch {
    button.disabled = false;
    alert('Não foi possível apagar. Seus dados continuam no celular.');
    return;
  }
  location.hash = '#/inicio'; // no onboardingDone any more: the app behaves like a first install
}

export async function renderSettings() {
  const persisted = await isPersisted();
  const profile = await getSetting('profile', null);
  const backup = backupStatus({
    lastBackupAt: await getSetting('lastBackupAt', null),
    sessions: await listSessions(),
    today: localDate(Date.now()),
  });
  return h('div', { class: 'screen', 'data-screen': 'config' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Configurações')),
    profileCard(profile),
    weeklyGoalCard(readWeeklyGoal(await getSetting('weeklyGoal', null))),
    h('div', { class: 'card stack', 'data-role': 'backup' },
      h('h2', null, 'Backup'),
      h('p', { class: 'small' }, backupAgeText(backup)),
      h('button', { class: 'btn', 'data-action': 'open-backup', onclick: () => { location.hash = '#/backup'; } }, 'Backup e restauração')),
    h('div', { class: 'card stack', 'data-role': 'ai-report-card' },
      h('h2', null, 'Relatório para IA'),
      h('p', { class: 'small' }, 'Monta um resumo dos seus treinos, cargas, peso, sono e proteína com uma pergunta pronta, para colar numa IA grátis (ChatGPT, Gemini, Claude).'),
      h('button', { class: 'btn', 'data-action': 'ai-report', onclick: () => { location.hash = '#/relatorio'; } }, 'Gerar relatório para IA')),
    h('div', { class: 'card stack', 'data-role': 'first-day-link' },
      h('h2', null, 'Primeiro dia na academia'),
      h('button', { class: 'btn', 'data-action': 'first-day', onclick: () => { location.hash = '#/primeiro-dia'; } }, 'Checklist do 1º dia na academia')),
    h('div', { class: 'card stack', 'data-role': 'help' },
      h('h2', null, 'Precisa de ajuda?'),
      h('p', { class: 'small' }, 'Se algo quebrar ou você quiser mudar o app, o kit de socorro ensina a pedir ajuda a uma IA grátis (ChatGPT, Gemini) e a publicar a correção. O manual explica, passo a passo, como publicar uma mudança, desfazer e restaurar um backup. Os dois abrem no navegador e precisam de internet.'),
      external({ 'data-action': 'help-kit', href: KIT_URL }, 'Abrir kit de socorro'),
      external({ class: 'btn btn-ghost', 'data-action': 'manual', href: MANUAL_URL }, 'Manual de manutenção')),
    planCard(),
    h('div', { class: 'card stack', 'data-role': 'about' },
      h('h2', null, 'Sobre'),
      h('div', { class: 'brand' },
        h('img', { class: 'brand-logo', src: './icons/icon.svg', alt: '', width: '56', height: '56' }),
        h('strong', { class: 'subtitle' }, 'Progride')),
      h('p', null, `Versão do app: ${APP_VERSION}`),
      h('p', null, `Armazenamento protegido: ${persisted ? 'sim' : 'não'}`),
      h('p', { class: 'muted small' }, 'Não limpe os dados do Chrome para este site: seus treinos ficam só neste celular.'),
      h('p', { class: 'muted small' }, 'Este app não é aconselhamento médico.')),
    h('h2', { class: 'section-label' }, 'Zona de perigo'),
    h('div', { class: 'card stack', 'data-role': 'reset' },
      h('p', { class: 'muted small' }, 'Vai testar o app antes de começar? Depois de testar, apague tudo para começar o treino de verdade com o app limpo.'),
      h('button', { class: 'btn btn-danger', 'data-action': 'reset-all', onclick: onResetAll }, 'Apagar tudo e começar do zero')));
}
