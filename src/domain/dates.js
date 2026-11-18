// Pure date helpers. The only place that does Date arithmetic.

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' in LOCAL time (never via ISO/UTC strings).
export function localDate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Integer days from a to b (both 'YYYY-MM-DD').
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
