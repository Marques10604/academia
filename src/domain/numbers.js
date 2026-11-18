// pt-BR number helpers. Pure. Phone keyboards in Brazil type "72,5".

export function formatNumber(n) {
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

// '72,5' / '72.5' / ' 72 ' -> number; anything else (empty, text, negative, '7,2,5') -> null.
export function parseDecimal(text) {
  const t = String(text ?? '').trim();
  if (!/^\d+([.,]\d+)?$/.test(t)) return null;
  return Number(t.replace(',', '.'));
}

// '175' -> 175; '1,75' -> 175 (values under 3 are meters).
export function parseHeightCm(text) {
  const n = parseDecimal(text);
  if (n === null) return null;
  return n < 3 ? Math.round(n * 100) : Math.round(n);
}
