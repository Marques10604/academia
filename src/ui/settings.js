import { h } from './dom.js';
import { getSetting, isPersisted } from '../data/db.js';
import { formatNumber } from '../domain/numbers.js';
import { APP_VERSION } from '../version.js';

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
    h('div', { class: 'notice' }, 'Este app não é aconselhamento médico.'),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big', 'data-action': 'home',
        onclick: () => { location.hash = '#/hoje'; },
      }, 'Voltar')));
}
