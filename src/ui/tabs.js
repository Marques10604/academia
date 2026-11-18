// Bottom tab bar for the four main screens (Hoje, Histórico, Corpo, Config). One <nav> for the whole app,
// created on first use and shown/hidden after every render by app.js. Icons are inline SVG built with
// createElementNS (no markup strings, no icon font, no image files).
import { h } from './dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// [screen name (data-screen), data-action hook, route, label, drawing]
const TABS = [
  ['hoje', 'home', '#/hoje', 'Hoje', [['path', { d: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11' }]]],
  ['historico', 'history', '#/historico', 'Histórico', [
    ['circle', { cx: '12', cy: '12', r: '9' }], ['path', { d: 'M12 7v5l3 2' }]]],
  ['corpo', 'body', '#/corpo', 'Corpo', [
    ['circle', { cx: '12', cy: '6', r: '3' }], ['path', { d: 'M5 21v-3a7 7 0 0 1 14 0v3' }]]],
  ['config', 'settings', '#/config', 'Config', [
    ['path', { d: 'M4 7h9M19 7h1M4 17h1M11 17h9' }],
    ['circle', { cx: '16', cy: '7', r: '2.5' }], ['circle', { cx: '8', cy: '17', r: '2.5' }]]],
];

function icon(shapes) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24', width: '26', height: '26', fill: 'none', stroke: 'currentColor',
    'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  })) svg.setAttribute(k, v);
  for (const [tag, attrs] of shapes) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  }
  return svg;
}

let nav = null;

function build() {
  nav = h('nav', { class: 'tabbar', 'data-role': 'tabbar', 'aria-label': 'Navegação principal', hidden: true },
    TABS.map(([screen, action, route, label, shapes]) => h('button', {
      type: 'button', class: 'tab', 'data-tab': screen, 'data-action': action,
      onclick: () => { location.hash = route; },
    }, h('span', { class: 'tab-icon' }, icon(shapes)), h('span', { class: 'tab-label' }, label))));
  document.body.appendChild(nav);
}

// screen = the data-screen of the screen just shown. Main screens get the bar with their tab highlighted;
// everything else (live workout, welcome, backup, checklist, exercise, summary) hides it.
export function updateTabs(screen) {
  if (!nav) build();
  const known = TABS.some((t) => t[0] === screen);
  nav.hidden = !known;
  document.body.classList.toggle('has-tabs', known);
  for (const tab of nav.querySelectorAll('.tab')) {
    const on = tab.getAttribute('data-tab') === screen;
    tab.classList.toggle('active', on);
    if (on) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}
