// Profile defaults, greeting and plan summary texts. Pure: the UI passes the hour, this module never reads the clock.
import { formatNumber } from './numbers.js';

// The single user of the app: the first screen saves these without asking anything.
export const DEFAULT_PROFILE = Object.freeze({ name: 'Ivonilson', weightKg: 70 });

export const NAME_MAX = 40;

// Single line, no stray spaces, at most NAME_MAX characters. Always plain text (rendered as a text node).
export function cleanName(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

// Before 12h: Bom dia · 12h to 17h59: Boa tarde · from 18h: Boa noite. No name -> no comma.
export function greetingFor(hour, name) {
  const part = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const who = cleanName(name);
  return who ? `${part}, ${who}!` : `${part}!`;
}

// The plan in three lines (shown on the first screen and in Settings > Meu perfil).
export const PLAN_LINES = Object.freeze([
  'Full body, 3x por semana, de manhã',
  'Objetivo: ganhar massa e força',
  'Começa leve: o app descobre sua carga',
]);

export const initialWeightLine = (weightKg) => `Peso inicial: ${formatNumber(weightKg)} kg`;
