import { h } from './dom.js';
import { setSetting, requestPersist } from '../data/db.js';
import { parseDecimal, parseHeightCm } from '../domain/numbers.js';

export function renderOnboarding() {
  const msg = h('div', { class: 'banner', 'data-role': 'error', hidden: true });
  const weight = h('input', { type: 'text', inputmode: 'decimal', name: 'weight', autocomplete: 'off' });
  const height = h('input', { type: 'text', inputmode: 'decimal', name: 'height', autocomplete: 'off' });

  const fail = (text) => {
    msg.textContent = text;
    msg.hidden = false;
  };

  const onAccept = async (e) => {
    const w = parseDecimal(weight.value);
    const hCm = parseHeightCm(height.value);
    if (w === null || w < 30 || w > 250) return fail('Digite um peso válido em kg, entre 30 e 250 (ex: 72,5).');
    if (hCm === null || hCm < 120 || hCm > 230) return fail('Digite uma altura válida em cm, entre 120 e 230 (ex: 175).');
    e.currentTarget.disabled = true;
    await setSetting('profile', { weightKg: Math.round(w * 100) / 100, heightCm: hCm, savedAt: Date.now() });
    await setSetting('onboardingDone', true);
    await requestPersist(); // ask to protect the data right after the first real save
    location.hash = '#/hoje';
  };

  return h('div', { class: 'screen', 'data-screen': 'inicio' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Bem-vindo')),
    h('div', { class: 'notice' },
      h('p', null, 'Este app não é aconselhamento médico.'),
      h('p', null, 'Antes de começar a treinar, faça um check-up médico (coração e pressão), principalmente se você nunca treinou.'),
      h('p', null, 'Pare o exercício e procure ajuda se sentir dor no peito, falta de ar fora do normal, tontura ou dor forte nas articulações.')),
    h('div', { class: 'field' },
      h('label', null, 'Seu peso (kg)'), weight, h('span', { class: 'muted small' }, 'ex: 72,5')),
    h('div', { class: 'field' },
      h('label', null, 'Sua altura (cm)'), height, h('span', { class: 'muted small' }, 'ex: 175')),
    msg,
    h('div', { class: 'bottom-bar' },
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'accept-onboarding', onclick: onAccept }, 'Entendi, começar')));
}
