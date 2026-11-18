// Backup: export -> wipe the database -> restore from the first screen -> identical data.
import assert from 'node:assert/strict';

const DB = "await import(new URL('src/data/db.js', location.href).href)";
const DATES = "await import(new URL('src/domain/dates.js', location.href).href)";

// every store except the draft, as { name: rows }
const SNAPSHOT = `(async () => {
  const db = ${DB};
  const conn = await db.openDb();
  const out = {};
  for (const name of conn.objectStoreNames) if (name !== 'active') out[name] = await db.getAll(name);
  return out;
})()`;

const seed = (id, daysAgo) => `(async () => {
  const db = ${DB};
  const dates = ${DATES};
  const startedAt = Date.now() - ${daysAgo} * 86400000;
  await db.put('sessions', {
    id: ${JSON.stringify(id)}, templateId: 'A', short: false, startedAt, endedAt: startedAt + 50 * 60000,
    localDate: dates.localDate(startedAt), complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null,
    entries: [{ exerciseId: 'leg_press_45', plannedSets: 2, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12,
      incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
      sets: [0, 1].map((i) => ({ kind: 'work', load: 20, reps: 12, at: startedAt + i * 1000 })) }],
  });
  return true;
})()`;

// Puts a File with the given text on the backup-file input and fires change.
const pickFile = (text, name) => `(() => {
  const input = document.querySelector('input[name=backup-file]');
  const dt = new DataTransfer();
  dt.items.add(new File([${JSON.stringify(text)}], ${JSON.stringify(name)}, { type: 'text/plain' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`;

export default async function (page) {
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  await page.type('input[name=weight]', '72,5');
  await page.type('input[name=height]', '175');
  await page.click('[data-action=accept-onboarding]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  await page.eval(seed('b-1', 6));
  await page.eval(seed('b-2', 3));
  await page.eval(seed('b-3', 1));
  // partial preference rows are normal: a full one, a note-only one and a unit-only one
  await page.eval(`(async () => {
    const db = ${DB};
    await db.put('exercisePrefs', { exerciseId: 'lat_pulldown', incrementKg: 2.5, unit: 'placa', unitChangedAt: Date.now(), note: 'banco no furo 4' });
    await db.put('exercisePrefs', { exerciseId: 'leg_press_45', note: 'encosto no 3' });
    await db.put('exercisePrefs', { exerciseId: 'seated_row', unit: 'placa', unitChangedAt: Date.now() });
    return true;
  })()`);
  const before = await page.eval(SNAPSHOT);
  assert.equal(before.sessions.length, 3);
  assert.equal(before.exercisePrefs.length, 3);

  // Export: capture the Blob and the file name the download would use.
  await page.goto('#/backup');
  await page.waitFor("!!document.querySelector('[data-action=export-download]')");
  await page.eval(`(() => {
    window.__blobs = []; window.__downloads = [];
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { window.__blobs.push(b); return create(b); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { window.__downloads.push(this.download); return click.call(this); };
    return true;
  })()`);
  await page.click('[data-action=export-download]');
  await page.waitFor('window.__blobs.length === 1');
  const exported = await page.eval('window.__blobs[0].text()');
  const doc = JSON.parse(exported);
  const schema = await page.eval(`(async () => (${DB}).SCHEMA_VERSION)()`);
  assert.equal(doc.app, 'academia');
  assert.equal(doc.schemaVersion, schema);
  assert.ok(!('active' in doc.stores), 'o rascunho nunca vai no backup');
  assert.deepEqual(Object.keys(doc.stores).sort(), Object.keys(before).sort(), 'nenhum store ficou de fora');
  assert.equal(doc.stores.sessions.length, 3);
  assert.match(await page.eval('window.__downloads[0]'), /^academia-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await page.waitFor(`(async () => typeof ((await (${DB}).get('settings', 'lastBackupAt')) || {}).value === 'number')()`);

  // Wipe: leaving the app closes its connection, then the database is deleted.
  await page.goto('manifest.webmanifest');
  await page.eval(`new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('academia');
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  })`);
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=inicio]')");
  assert.ok((await page.text()).includes('Já tenho um backup'));

  // Restore from the first screen.
  await page.click('[data-action=restore-backup]');
  await page.waitFor("!!document.querySelector('[data-screen=backup]')");
  await page.eval(pickFile(exported, 'academia-backup-2026-11-18.txt'));
  await page.waitFor("(document.querySelector('[data-role=import-summary]') || {}).innerText?.includes('3 treinos')");
  await page.click('[data-action=confirm-import]');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')");

  const after = await page.eval(SNAPSHOT);
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  for (const name of Object.keys(before)) {
    if (name === 'settings') continue;
    assert.deepEqual(after[name], before[name], `store ${name} identico`);
  }
  const stripped = (rows) => rows.filter((r) => r.key !== 'lastBackupAt');
  assert.deepEqual(stripped(after.settings), stripped(before.settings));
  assert.equal(after.settings.find((r) => r.key === 'lastBackupAt').value, Date.parse(doc.exportedAt));
}
