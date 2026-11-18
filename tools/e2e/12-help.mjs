// Config: help card with the two guide links (github.com, new tab), Progride brand, first-day checklist button.
import assert from 'node:assert/strict';
import { APP_VERSION } from '../../src/version.js';

const KIT_URL = 'https://github.com/Marques10604/academia/blob/main/KIT-SOCORRO-IA.md';
const MANUAL_URL = 'https://github.com/Marques10604/academia/blob/main/MANUAL.md';
const has = (sel) => `!!document.querySelector(${JSON.stringify(sel)})`;

export default async function (page) {
  await page.goto('');
  await page.waitFor(has('[data-screen=inicio]'));
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor(has('[data-screen=hoje]'));
  await page.click('[data-action=settings]');
  await page.waitFor(has('[data-screen=config]'));

  const text = await page.text();
  assert.ok(text.includes('Versão do app: ' + APP_VERSION), 'config mostra a versão');
  assert.ok(text.includes('Precisa de ajuda?'), 'cartão de ajuda');
  assert.ok(text.includes('Progride'), 'nome do app na Config');

  // brand: the logo really loads
  await page.waitFor("(() => { const i = document.querySelector('[data-screen=config] img.brand-logo'); return !!i && i.complete && i.naturalWidth > 0; })()");

  // links to the two guides: fixed github.com addresses, new tab, no opener (never clicked: it would open a tab)
  for (const [action, url] of [['help-kit', KIT_URL], ['manual', MANUAL_URL]]) {
    const link = await page.eval(`(() => { const a = document.querySelector('a[data-action=${action}]'); return a && { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') }; })()`);
    assert.ok(link, `link ${action} existe`);
    assert.equal(link.href, url, `href de ${action}`);
    assert.equal(link.target, '_blank', `target de ${action}`);
    assert.ok(/noopener/.test(link.rel), `rel de ${action}: ${link.rel}`);
  }

  // first-day checklist is reachable from Config
  await page.click('[data-action=first-day]');
  await page.waitFor(has('[data-screen=primeiro-dia]'));
  assert.ok((await page.text()).includes('Checklist do 1º dia'), 'abriu o checklist');
}
