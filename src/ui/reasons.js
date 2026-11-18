// pt-BR texts for the prescription shown on Today and the exercise screen.
// Formatting only: every decision is made in src/domain/progression.js.

// 90 -> "descanso 1:30"
export function restText(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `descanso ${m}:${s}`;
}
