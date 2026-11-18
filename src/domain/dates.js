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

// 'YYYY-MM-DD' -> 'DD/MM/AAAA' by splitting the string (no Date object, no clock).
export function brDate(localDate) {
  const [y, m, d] = localDate.split('-');
  return `${d}/${m}/${y}`;
}

// 'YYYY-MM-DD' -> 'DD/MM'.
export function brShort(localDate) {
  const [, m, d] = localDate.split('-');
  return `${d}/${m}`;
}

// 'YYYY-MM-DD' plus n days (n may be negative), as 'YYYY-MM-DD'. UTC math: no local clock, no timezone shift.
export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
