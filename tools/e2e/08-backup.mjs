// Backup: schema 1 -> 2 upgrade, export -> wipe -> restore from the first screen, refusals, no restore during a workout.
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

const sessionRow = (id, startedAt, localDate) => ({
  id, templateId: 'A', short: false, startedAt, endedAt: startedAt + 50 * 60000,
  localDate, complete: true, schemaVersion: 1, currentIdx: 0, restEndsAt: null,
  entries: [{
    exerciseId: 'leg_press_45', plannedSets: 2, repMin: 10, repMax: 15, restSec: 120, load: 20, reps: 12,
    incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
    sets: [0, 1].map((i) => ({ kind: 'work', load: 20, reps: 12, at: startedAt + i * 1000 })),
  }],
});

const seedSession = (id, daysAgo) => `(async () => {
  const db = ${DB};
  const dates = ${DATES};
  const startedAt = Date.now() - ${daysAgo} * 86400000;
  await db.put('sessions', (${sessionRow.toString()})(${JSON.stringify(id)}, startedAt, dates.localDate(startedAt)));
  return true;
})()`;

const seedLog = (daysAgo, weightKg) => `(async () => {
  const db = ${DB};
  const dates = ${DATES};
  const at = Date.now() - ${daysAgo} * 86400000;
  await db.put('dailyLogs', { localDate: dates.localDate(at), weightKg: ${weightKg}, sleep: 4, energy: 3, updatedAt: at });
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

const sessionCount = (page) => page.eval(`(async () => (await (${DB}).getAll('sessions')).length)()`);

export default async function (page) {
  // ---- Part A: a real schema-1 database (a 0.2.x phone) opens under schema 2 with all data intact.
  await page.goto('manifest.webmanifest');
  const written = await page.eval(`new Promise((resolve, reject) => {
    const req = indexedDB.open('academia', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('settings', { keyPath: 'key' });
      db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('startedAt', 'startedAt');
      db.createObjectStore('active', { keyPath: 'id' });
      db.createObjectStore('exercisePrefs', { keyPath: 'exerciseId' });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const startedAt = Date.now() - 6 * 86400000;
      const d = new Date(startedAt);
      const p = (n) => String(n).padStart(2, '0');
      const session = (${sessionRow.toString()})('b-1', startedAt, d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()));
      const pref = { exerciseId: 'lat_pulldown', incrementKg: 2.5, unit: 'placa', unitChangedAt: startedAt, note: 'banco no furo 4' };
      const tx = db.transaction(['settings', 'sessions', 'exercisePrefs'], 'readwrite');
      tx.objectStore('settings').put({ key: 'onboardingDone', value: true });
      tx.objectStore('settings').put({ key: 'profile', value: { weightKg: 72.5, heightCm: 175, savedAt: startedAt } });
      tx.objectStore('sessions').put(session);
      tx.objectStore('exercisePrefs').put(pref);
      tx.oncomplete = () => { db.close(); resolve({ session, pref }); };
      tx.onerror = () => reject(tx.error);
    };
  })`);
  await page.goto('');
  await page.waitFor("!!document.querySelector('[data-screen=hoje]')"); // no onboarding: the data was kept
  assert.equal(await page.eval(`(async () => (await (${DB}).openDb()).version)()`), 2);
  assert.equal(await page.eval(`(async () => [...(await (${DB}).openDb()).objectStoreNames].includes('dailyLogs'))()`), true);
  assert.deepEqual(await page.eval(`(async () => (await (${DB}).get('sessions', 'b-1')))()`), written.session);
  assert.deepEqual(await page.eval(`(async () => (await (${DB}).get('exercisePrefs', 'lat_pulldown')))()`), written.pref);

  // ---- Part B: export -> wipe -> restore.
  await page.eval(seedSession('b-2', 3));
  await page.eval(seedSession('b-3', 1));
  await page.eval(seedLog(1, 70.4));
  await page.eval(seedLog(2, 70.1));
  // partial preference rows are normal: a note-only one and a unit-only one next to the full one
  await page.eval(`(async () => {
    const db = ${DB};
    await db.put('exercisePrefs', { exerciseId: 'leg_press_45', note: 'encosto no 3' });
    await db.put('exercisePrefs', { exerciseId: 'seated_row', unit: 'placa', unitChangedAt: Date.now() });
    return true;
  })()`);
  const before = await page.eval(SNAPSHOT);
  assert.equal(before.sessions.length, 3);
  assert.equal(before.exercisePrefs.length, 3);
  assert.equal(before.dailyLogs.length, 2);

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
  const beforeWithStamp = await page.eval(SNAPSHOT); // includes lastBackupAt written by the export

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

  await page.click('[data-action=restore-backup]');
  await page.waitFor("!!document.querySelector('[data-screen=backup]')");
  await page.eval(pickFile(exported, 'academia-backup-2026-11-18.txt'));
  await page.waitFor("(document.querySelector('[data-role=import-summary]') || {}).innerText?.includes('3 treinos')");
  const summary = await page.eval("document.querySelector('[data-role=import-summary]').innerText");
  assert.ok(summary.includes('2 check-ins'), summary);
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
  assert.ok(beforeWithStamp.settings.some((r) => r.key === 'lastBackupAt'));

  // ---- Part C: refusals change nothing.
  const refuse = async (text, expected) => {
    await page.goto('#/backup');
    await page.waitFor("!!document.querySelector('input[name=backup-file]')");
    await page.eval(pickFile(text, 'x.txt'));
    await page.waitFor("!document.querySelector('[data-role=import-error]').hidden");
    const msg = await page.eval("document.querySelector('[data-role=import-error]').innerText");
    assert.ok(msg.includes(expected), msg);
    assert.equal(await page.eval("!!document.querySelector('[data-action=confirm-import]')"), false);
    assert.equal(await sessionCount(page), 3);
  };
  await refuse('isto não é json', 'não é um backup');
  await refuse(JSON.stringify({ app: 'outro', schemaVersion: 1, stores: {} }), 'não é um backup');
  await refuse(JSON.stringify({ ...doc, schemaVersion: 99 }), 'versão mais nova');

  // ---- Part D: no restore while a workout is open.
  await page.goto('#/hoje');
  await page.click('[data-action=start]');
  await page.waitFor("!!document.querySelector('[data-screen=treino]')");
  await page.goto('#/backup');
  await page.waitFor("!!document.querySelector('input[name=backup-file]')");
  await page.eval(pickFile(exported, 'academia-backup-2026-11-18.txt'));
  await page.waitFor("!document.querySelector('[data-role=import-error]').hidden");
  assert.ok((await page.eval("document.querySelector('[data-role=import-error]').innerText")).includes('Finalize ou descarte'));
  assert.equal(await page.eval("!!document.querySelector('[data-action=confirm-import]')"), false);
  assert.equal(await sessionCount(page), 3);
}
