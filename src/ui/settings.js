import { h } from './dom.js';
import { getSetting, isPersisted } from '../data/db.js';
import { formatNumber } from '../domain/numbers.js';
import { APP_VERSION } from '../version.js';
import { PROGRAM } from '../data/program.js';

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

export async function renderSettings() {
  const persisted = await isPersisted();
  const profile = await getSetting('profile', null);
  return h('div', { class: 'screen', 'data-screen': 'config' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Configurações')),
    h('div', { class: 'card' },
      h('p', null, `Versão do app: ${APP_VERSION}`),
      h('p', null, `Armazenamento protegido: ${persisted ? 'sim' : 'não'}`),
      h('p', { class: 'muted small' }, 'Não limpe os dados do Chrome para este site: seus treinos ficam só neste celular.'),
      profile ? h('p', null, `Peso: ${formatNumber(profile.weightKg)} kg · Altura: ${formatNumber(profile.heightCm)} cm`) : null),
    planCard(),
    h('div', { class: 'notice' }, 'Este app não é aconselhamento médico.'),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big', 'data-action': 'home',
        onclick: () => { location.hash = '#/hoje'; },
      }, 'Voltar')));
}
