// UI-layer date text. Reads no clock: callers pass a timestamp in ms.
const FORMAT = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

// "Quarta, 18 de novembro" (weekday capitalized, "-feira" dropped to keep it short).
export function dayText(ms) {
  const text = FORMAT.format(ms).replace('-feira', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
