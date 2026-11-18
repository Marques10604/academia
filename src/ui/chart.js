// The app's own SVG line chart (no chart library: no CDN, no build step, nothing to update for years -
// see CLAUDE.md). Colors come from CSS classes (styles.css), so it follows the app theme.
//   chartGeometry(series, opts)  pure maths, unit-tested, never touches the DOM
//   lineChart(series, {label, xLabels, yFormat})  builds the <svg> with createElementNS and textContent
// series = [{points: [{x, y}], style: 'line' | 'dots' | 'linedots'}]. Several series share one y scale
// (the body-weight chart in 02-03 draws raw dots plus a trend line).
import { formatNumber } from '../domain/numbers.js';

const DEFAULTS = { width: 320, height: 160, left: 40, right: 10, top: 10, bottom: 22 };
const round1 = (v) => Math.round(v * 10) / 10;

export function chartGeometry(series, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const pad = yMax === yMin ? 1 : (yMax - yMin) * 0.1;
  const lo = yMin - pad;
  const hi = yMax + pad;
  const plotBottom = o.height - o.bottom;
  const mapX = (x) => (xMax === xMin ? (o.left + o.width - o.right) / 2 : o.left + ((x - xMin) / (xMax - xMin)) * (o.width - o.right - o.left));
  const mapY = (y) => plotBottom - ((y - lo) / (hi - lo)) * (plotBottom - o.top);
  const out = series.map((s) => {
    const coords = s.points.map((p) => ({ x: round1(mapX(p.x)), y: round1(mapY(p.y)) }));
    const d = coords.length < 2 ? '' : coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    return { style: s.style, coords, d };
  });
  const tickValues = [...new Set([yMin, (yMin + yMax) / 2, yMax].map(round1))];
  return {
    width: o.width, height: o.height, left: o.left, right: o.right, top: o.top, bottom: o.bottom,
    series: out,
    yTicks: tickValues.map((value) => ({ value, y: round1(mapY(value)) })),
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Tiny SVG element builder: attributes via setAttribute, children as text nodes or elements.
function s(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v));
  for (const c of children) el.append(c);
  return el;
}

export function lineChart(series, { label = '', xLabels = [], yFormat = formatNumber, opts } = {}) {
  const g = chartGeometry(series, opts);
  const plotRight = g.width - g.right;
  const svg = s('svg', { viewBox: `0 0 ${g.width} ${g.height}`, class: 'chart', role: 'img', 'aria-label': label });
  for (const t of g.yTicks) {
    svg.append(s('line', { class: 'chart-grid', x1: g.left, x2: plotRight, y1: t.y, y2: t.y }));
    svg.append(s('text', { class: 'chart-axis', x: g.left - 4, y: t.y + 3.5, 'text-anchor': 'end' }, yFormat(t.value)));
  }
  const baseline = g.height - 6;
  if (xLabels[0]) svg.append(s('text', { class: 'chart-axis', x: g.left, y: baseline, 'text-anchor': 'start' }, xLabels[0]));
  if (xLabels[1]) svg.append(s('text', { class: 'chart-axis', x: plotRight, y: baseline, 'text-anchor': 'end' }, xLabels[1]));
  for (const ser of g.series) {
    if (ser.style !== 'dots' && ser.d) svg.append(s('path', { class: 'chart-line', d: ser.d }));
    const cls = ser.style === 'dots' ? 'chart-raw' : 'chart-dot';
    const r = ser.style === 'dots' ? 3 : 3.5;
    if (ser.style === 'dots' || ser.style === 'linedots') {
      for (const c of ser.coords) svg.append(s('circle', { class: cls, cx: c.x, cy: c.y, r }));
    }
  }
  return svg;
}
