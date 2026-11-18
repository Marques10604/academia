import { h } from './dom.js';
import { getSetting, setSetting, isPersisted, listSessions, clearAll } from '../data/db.js';
import { backupStatus } from '../domain/backup.js';
import { localDate } from '../domain/dates.js';
import { backupAgeText } from './backup.js';
import { APP_VERSION } from '../version.js';
import { PROGRAM } from '../data/program.js';
import { PLAN_LINES, DEFAULT_PROFILE, NAME_MAX, cleanName } from '../domain/profile.js';

const p = (text) => h('p', { class: 'small' }, text);

// Plain-language explanation of the program (source: .planning/research/TRAINING-SCIENCE.md).
function planCard() {
  return h('div', { class: 'card stack', style: { gap: '10px' }, 'data-role': 'plan' },
    h('strong', null, 'Como funciona seu treino'),
    p('Full body: todo treino trabalha o corpo inteiro. Com 2 ou 3 treinos por semana cada músculo é treinado pelo menos 2 vezes, que é o que os estudos indicam para crescer. Faltou um dia? Nada quebra: o app segue do treino seguinte.'),
    p(`Treino A: ${PROGRAM.A.goal}`),
    p(`Treino B: ${PROGRAM.B.goal}`),
    p('Subir o peso (dupla progressão): tente fazer mais repetições com o mesmo peso. Quando fizer todas as séries no máximo da faixa (ex: 3 × 12), o app sobe a carga.'),
    h('strong', null, 'Seu plano do 1º mês (3 treinos por semana)'),
    p('Semana 1 (treinos 1–3): aprender. Nos treinos 1 e 2 você descobre a carga de cada exercício. 2 séries, sobrando 3–4 repetições.'),
    p('Semana 2 (treinos 4–6): adaptação. 2 séries, sobrando 3 e depois 2 repetições.'),
    p('Semanas 3 e 4 (treinos 7–12): base. 3 séries nos exercícios grandes, 2 nos pequenos; a última série sobrando 1–2 repetições. Não precisa ir até a falha.'),
    p('Descanso entre séries: 2 min nos grandes (leg press, supino, puxada, agachamento, desenvolvimento, remada, stiff), 1 min 30 s nos médios (mesa flexora, voador), 1 min nos pequenos.'),
    p('Entre treinos: pelo menos 1 dia livre se der (ex: seg/qua/sex). Mesmos exercícios por 8 a 12 semanas. Ficou 10+ dias parado: volte com 90% da carga; 4+ semanas: 80% (o app faz sozinho).'));
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
    h('strong', null, 'Meu perfil'),
    h('div', { class: 'field' }, h('label', null, 'Nome'), name),
    h('ul', { class: 'plan-list small', 'data-role': 'profile-plan' }, PLAN_LINES.map((line) => h('li', null, line))));
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
    h('div', { class: 'card' },
      h('p', null, `Versão do app: ${APP_VERSION}`),
      h('p', null, `Armazenamento protegido: ${persisted ? 'sim' : 'não'}`),
      h('p', { class: 'muted small' }, 'Não limpe os dados do Chrome para este site: seus treinos ficam só neste celular.')),
    h('div', { class: 'card stack', 'data-role': 'backup' },
      h('strong', null, 'Backup'),
      h('p', { class: 'small' }, backupAgeText(backup)),
      h('button', { class: 'btn', 'data-action': 'open-backup', onclick: () => { location.hash = '#/backup'; } }, 'Backup e restauração')),
    h('div', { class: 'card stack', 'data-role': 'reset' },
      h('p', { class: 'muted small' }, 'Vai testar o app antes de começar? Depois de testar, apague tudo para começar o treino de verdade com o app limpo.'),
      h('button', { class: 'btn btn-danger', 'data-action': 'reset-all', onclick: onResetAll }, 'Apagar tudo e começar do zero')),
    planCard(),
    h('div', { class: 'notice' }, 'Este app não é aconselhamento médico.'),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big', 'data-action': 'home',
        onclick: () => { location.hash = '#/hoje'; },
      }, 'Voltar')));
}
