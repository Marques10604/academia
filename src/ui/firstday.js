// First-gym-day checklist screen ('#/primeiro-dia'). Six things to do on the first visit; the ticks live in the
// settings store under FIRST_DAY_KEY, so src/domain/backup.js (BACKUP_STORES.settings) exports and restores them.
import { h } from './dom.js';
import { getSetting, setSetting } from '../data/db.js';
import { EXERCISES } from '../data/exercises.js';
import { PROGRAM } from '../data/program.js';

export const FIRST_DAY_KEY = 'firstDayChecklist';

// Machine names come from the data, so the texts follow future program edits.
const machinesA = PROGRAM.A.items
  .map((i) => EXERCISES[i.exerciseId])
  .filter((e) => e.equipment === 'maquina' || e.equipment === 'polia')
  .map((e) => e.name)
  .join(', ');
const pinMachines = Object.values(EXERCISES)
  .filter((e) => e.selectorized)
  .map((e) => e.name)
  .join(', ');

export const FIRST_DAY_ITEMS = Object.freeze([
  { id: 'professor', text: `Peça ao professor para mostrar as máquinas do Treino A (${machinesA}) e como ajustar cada uma.` },
  { id: 'faltando', text: 'Anote as máquinas que sua academia não tem. Na tela de cada exercício o app mostra o que usar no lugar.' },
  { id: 'kg-placa', text: `Veja se as máquinas de pino (${pinMachines}) mostram kg ou só números (1, 2, 3…). Se for só número, marque "placa" na tela do exercício.` },
  { id: 'regulagem', text: 'Depois de ajustar cada máquina, anote em "Minha regulagem" na tela do exercício (ex: banco no furo 4). Aparece no treino e na tela Hoje.' },
  { id: 'garrafa', text: 'Leve garrafa de água e toalha.' },
  { id: 'leve', text: 'Comece leve. Os 2 primeiros treinos de cada exercício são de calibração: o app ajuda a achar a carga, sobrando 3–4 repetições.' },
].map((i) => Object.freeze(i)));

const progressText = (n) => `${n} de ${FIRST_DAY_ITEMS.length} feitos`;

export async function renderFirstDay() {
  const saved = await getSetting(FIRST_DAY_KEY, []);
  const known = new Set(FIRST_DAY_ITEMS.map((i) => i.id));
  // The row can come from an imported backup: anything that is not a list of known ids is ignored.
  const done = new Set(Array.isArray(saved) ? saved.filter((id) => known.has(id)) : []);

  const progress = h('p', { class: 'small', 'data-role': 'first-day-progress' }, progressText(done.size));

  const onChange = async (e) => {
    const id = e.currentTarget.value;
    if (e.currentTarget.checked) done.add(id);
    else done.delete(id);
    progress.textContent = progressText(done.size);
    // The whole list is written each time, so rapid taps always end with the latest state.
    await setSetting(FIRST_DAY_KEY, FIRST_DAY_ITEMS.filter((i) => done.has(i.id)).map((i) => i.id));
  };

  const items = FIRST_DAY_ITEMS.map((item) => h('label', { class: 'check-item' },
    h('input', { type: 'checkbox', name: 'first-day', value: item.id, 'data-item': item.id, checked: done.has(item.id), onchange: onChange }),
    h('span', null, item.text)));

  return h('div', { class: 'screen', 'data-screen': 'primeiro-dia' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Checklist do 1º dia')),
    h('p', { class: 'muted' }, 'Para o seu primeiro treino. Marque o que já fez: fica salvo no celular e vai junto no backup.'),
    progress,
    h('div', { class: 'list' }, items),
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big', 'data-action': 'home', onclick: () => { location.hash = '#/hoje'; } }, 'Voltar')));
}
