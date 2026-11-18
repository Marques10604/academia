import test from 'node:test';
import assert from 'node:assert/strict';
import { brDate, brShort } from '../src/domain/dates.js';
import {
  BACKUP_STORES, BACKUP_NUDGE_WORKOUTS, buildBackup, parseBackup, backupSummary, prepareRestore, backupFileName, backupStatus,
} from '../src/domain/backup.js';

const NOW = Date.UTC(2026, 10, 18, 12);

const sess = (id, localDate, extra = {}) => ({
  id,
  templateId: 'A',
  short: false,
  startedAt: Date.parse(localDate + 'T12:00:00'),
  endedAt: Date.parse(localDate + 'T12:50:00'),
  localDate,
  complete: true,
  schemaVersion: 1,
  currentIdx: 0,
  restEndsAt: null,
  entries: [{
    exerciseId: 'leg_press_45', plannedSets: 2, repMin: 8, repMax: 12, restSec: 120, load: 20, reps: 12,
    incrementKg: 2.5, unit: 'kg', type: 'reps', feel: 'ok', phase: 'learn', calibrating: false,
    sets: [{ kind: 'work', load: 20, reps: 12, rir: 3, at: 1 }, { kind: 'work', load: 20, reps: 12, at: 2 }],
  }],
  ...extra,
});

const stores = () => ({
  settings: [{ key: 'onboardingDone', value: true }, { key: 'profile', value: { weightKg: 72.5, heightCm: 175, savedAt: 1 } }],
  sessions: [sess('b-1', '2026-11-12'), sess('b-2', '2026-11-16')],
  exercisePrefs: [{ exerciseId: 'lat_pulldown', incrementKg: 2.5, unit: 'placa', unitChangedAt: 5, note: 'banco no furo 4' }],
});

const doc = (extra = {}) => ({ ...buildBackup({ stores: stores(), schemaVersion: 1, appVersion: '0.2.1', now: NOW }), ...extra });

test('brDate and brShort format a local date as pt-BR', () => {
  assert.equal(brDate('2026-11-18'), '18/11/2026');
  assert.equal(brShort('2026-11-18'), '18/11');
});

test('buildBackup wraps the stores in a versioned envelope', () => {
  const d = buildBackup({ stores: stores(), schemaVersion: 1, appVersion: '0.2.1', now: NOW });
  assert.equal(d.app, 'academia');
  assert.equal(d.format, 1);
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.appVersion, '0.2.1');
  assert.equal(d.exportedAt, '2026-11-18T12:00:00.000Z');
  assert.deepEqual(d.counts, { settings: 2, sessions: 2, exercisePrefs: 1 });
  assert.deepEqual(d.stores, stores());
});

test('parseBackup round trip keeps every row verbatim', () => {
  const d = doc();
  const r = parseBackup(JSON.stringify(d), 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.settings, d.stores.settings);
  assert.deepEqual(r.doc.stores.sessions, d.stores.sessions);
  assert.deepEqual(r.doc.stores.exercisePrefs, d.stores.exercisePrefs);
});

test('parseBackup validates only: extra and unknown fields survive untouched', () => {
  const s = sess('b-1', '2026-11-12', { restEndsAt: 123, futureField: { a: 1 } });
  s.entries[0].futureEntryField = 'x';
  s.entries[0].sets[0].rir = 2;
  const d = buildBackup({ stores: { sessions: [s] }, schemaVersion: 1, appVersion: '0.2.1', now: NOW });
  const r = parseBackup(JSON.stringify(d), 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.sessions, [s]);
});

test('parseBackup refuses non-backups with a pt-BR error', () => {
  const badSession = sess('x', '2026-11-12');
  badSession.entries[0].sets[0].load = 'pesado';
  const bad = [
    'isto não é json',
    JSON.stringify({ ...doc(), app: 'outro' }),
    JSON.stringify({ app: 'academia', format: 1, schemaVersion: 1 }),
    JSON.stringify({ ...doc(), stores: { sessions: [{ startedAt: 1, entries: [] }] } }),
    JSON.stringify({ ...doc(), stores: { sessions: [sess('x', '2026-11-12', { entries: 'nope' })] } }),
    JSON.stringify({ ...doc(), stores: { sessions: [badSession] } }),
  ];
  for (const text of bad) {
    const r = parseBackup(text, 1);
    assert.equal(r.ok, false, text.slice(0, 60));
    assert.ok(typeof r.error === 'string' && r.error.length > 10);
  }
});

test('parseBackup refuses a backup from a newer schema', () => {
  const r = parseBackup(JSON.stringify(doc({ schemaVersion: 2 })), 1);
  assert.equal(r.ok, false);
  assert.ok(r.error.includes('versão mais nova'));
});

test('parseBackup fills missing stores and drops unknown ones and active', () => {
  const d = doc();
  d.stores = { sessions: d.stores.sessions, active: [{ id: 'current' }], lixo: [{ id: 1 }] };
  const r = parseBackup(JSON.stringify(d), 1);
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.doc.stores).sort(), Object.keys(BACKUP_STORES).sort());
  assert.deepEqual(r.doc.stores.settings, []);
  assert.equal(r.doc.stores.sessions.length, 2);
});

test('exercisePrefs validates each field only when present (partial rows are normal)', () => {
  const ok = [
    { exerciseId: 'a', note: 'banco no furo 4' },
    { exerciseId: 'b', unit: 'placa', unitChangedAt: 9 },
    { exerciseId: 'c', incrementKg: 2.5 },
    { exerciseId: 'd' },
  ];
  const d = doc();
  d.stores.exercisePrefs = ok;
  const r = parseBackup(JSON.stringify(d), 1);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.exercisePrefs, ok);
  const wrong = [{ exerciseId: 'a', incrementKg: 0 }, { exerciseId: 'a', incrementKg: 'x' }, { exerciseId: 'a', unit: 'lb' }, { exerciseId: 'a', note: 5 }];
  for (const bad of wrong) {
    d.stores.exercisePrefs = [bad];
    const rb = parseBackup(JSON.stringify(d), 1);
    assert.equal(rb.ok, false, JSON.stringify(bad));
    assert.ok(rb.error.includes('exercisePrefs'));
  }
});

test('backupSummary is one line with count, dates and export day', () => {
  const sessions = [sess('1', '2026-11-10'), sess('2', '2026-11-14'), sess('3', '2026-11-17')];
  const mk = (s) => ({ exportedAt: '2026-11-18T12:00:00.000Z', stores: { sessions: s } });
  assert.equal(backupSummary(mk(sessions)), '3 treinos, de 10/11/2026 a 17/11/2026 · salvo em 18/11/2026');
  assert.equal(backupSummary(mk([sessions[2]])), '1 treino, em 17/11/2026 · salvo em 18/11/2026');
  assert.equal(backupSummary(mk([])), 'Nenhum treino · salvo em 18/11/2026');
});

test('prepareRestore returns every store and stamps lastBackupAt from exportedAt', () => {
  const d = doc();
  d.stores.settings.push({ key: 'lastBackupAt', value: 1 });
  const parsed = parseBackup(JSON.stringify(d), 1).doc;
  const out = prepareRestore(parsed, 999);
  assert.deepEqual(Object.keys(out).sort(), Object.keys(BACKUP_STORES).sort());
  const rows = out.settings.filter((r) => r.key === 'lastBackupAt');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, Date.parse(d.exportedAt));
  assert.equal(out.settings.length, 3);
  const fallback = prepareRestore({ ...parsed, exportedAt: 'ontem' }, 999);
  assert.equal(fallback.settings.find((r) => r.key === 'lastBackupAt').value, 999);
});

test('backupFileName', () => {
  assert.equal(backupFileName('2026-11-18', 'json'), 'academia-backup-2026-11-18.json');
  assert.equal(backupFileName('2026-11-18', 'txt'), 'academia-backup-2026-11-18.txt');
});

const log = (extra = {}) => ({ localDate: '2026-11-17', weightKg: 70.4, sleep: 4, energy: 3, updatedAt: 1763380000000, ...extra });

test('schema 1 backup without dailyLogs is accepted by schema 2 and gets an empty store', () => {
  const r = parseBackup(JSON.stringify(doc()), 2);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.dailyLogs, []);
});

test('schema 3 backup is refused by schema 2', () => {
  const r = parseBackup(JSON.stringify(doc({ schemaVersion: 3 })), 2);
  assert.equal(r.ok, false);
  assert.ok(r.error.includes('versão mais nova'));
});

test('dailyLogs rows are validated and round trip unchanged', () => {
  const d = buildBackup({ stores: { dailyLogs: [log(), log({ localDate: '2026-11-16', waistCm: 82 })] }, schemaVersion: 2, appVersion: '0.2.1', now: NOW });
  const r = parseBackup(JSON.stringify(d), 2);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.dailyLogs, d.stores.dailyLogs);
  for (const bad of [log({ localDate: 'ontem' }), log({ sleep: 7 }), log({ weightKg: '70' }), log({ energy: 2.5 }), log({ waistCm: null })]) {
    const rb = parseBackup(JSON.stringify({ ...d, stores: { dailyLogs: [bad] } }), 2);
    assert.equal(rb.ok, false, JSON.stringify(bad));
    assert.ok(rb.error.includes('Backup danificado'));
  }
});

test('backupSummary adds the check-in count only when there are check-ins', () => {
  const mk = (n) => ({ exportedAt: '2026-11-18T12:00:00.000Z', stores: { sessions: [sess('1', '2026-11-17')], dailyLogs: Array.from({ length: n }, (_, i) => log({ localDate: '2026-11-1' + i })) } });
  assert.equal(backupSummary(mk(2)), '1 treino, em 17/11/2026 · 2 check-ins · salvo em 18/11/2026');
  assert.equal(backupSummary(mk(1)), '1 treino, em 17/11/2026 · 1 check-in · salvo em 18/11/2026');
  assert.equal(backupSummary(mk(0)), '1 treino, em 17/11/2026 · salvo em 18/11/2026');
});

test('BACKUP_NUDGE_WORKOUTS is 3', () => {
  assert.equal(BACKUP_NUDGE_WORKOUTS, 3);
});

test('backupStatus counts workouts saved since the last backup', () => {
  const at = (day, hh) => Date.parse(`2026-11-${day}T${hh}:00:00`);
  const s = (id, day) => ({ id, startedAt: at(day, '10'), endedAt: at(day, '11') });
  const two = [s('1', '10'), s('2', '12')];
  const three = [...two, s('3', '14')];
  assert.deepEqual(backupStatus({ lastBackupAt: null, sessions: two, today: '2026-11-18' }), { daysAgo: null, since: 2, due: false });
  assert.equal(backupStatus({ lastBackupAt: null, sessions: three, today: '2026-11-18' }).due, true);
  // backup between the end of session 2 and session 3: only session 3 is newer
  const mid = backupStatus({ lastBackupAt: at('13', '09'), sessions: three, today: '2026-11-18' });
  assert.equal(mid.since, 1);
  assert.equal(mid.due, false);
  assert.equal(mid.daysAgo, 5);
  assert.equal(backupStatus({ lastBackupAt: at('18', '08'), sessions: three, today: '2026-11-18' }).daysAgo, 0);
  assert.equal(backupStatus({ lastBackupAt: at('17', '08'), sessions: three, today: '2026-11-18' }).daysAgo, 1);
  // a session without endedAt counts by its startedAt
  const open = { id: 'x', startedAt: at('15', '10') };
  assert.equal(backupStatus({ lastBackupAt: at('14', '12'), sessions: [open], today: '2026-11-18' }).since, 1);
  assert.equal(backupStatus({ lastBackupAt: at('15', '12'), sessions: [open], today: '2026-11-18' }).since, 0);
});

test('dailyLogs protein lists: partial entries are accepted, damaged ones are refused', () => {
  const protein = [{ meal: 'almoco', food: 'frango', g: 28, at: 1 }, { g: 10 }];
  const d = buildBackup({ stores: { dailyLogs: [log({ protein }), { localDate: '2026-11-15', protein: [{ g: 5 }] }] }, schemaVersion: 2, appVersion: '0.4.0', now: NOW });
  const r = parseBackup(JSON.stringify(d), 2);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.stores.dailyLogs, d.stores.dailyLogs);
  for (const bad of ['abc', [{ g: 'x' }], [{ g: -1 }], [{ g: 1000 }], [{ g: 10, food: 3 }], [{ g: 10, meal: 5 }], [null], [{ g: 10, at: 'x' }], null]) {
    const rb = parseBackup(JSON.stringify({ ...d, stores: { dailyLogs: [log({ protein: bad })] } }), 2);
    assert.equal(rb.ok, false, JSON.stringify(bad));
    assert.ok(rb.error.includes('Backup danificado'));
  }
});

test('backupSummary counts only real check-ins, not protein-only or waist-only days', () => {
  const doc2 = { exportedAt: '2026-11-18T12:00:00.000Z', stores: { sessions: [sess('1', '2026-11-17')], dailyLogs: [
    log({ localDate: '2026-11-10' }), log({ localDate: '2026-11-11' }),
    { localDate: '2026-11-12', protein: [{ g: 28 }] }, { localDate: '2026-11-13', waistCm: 82 },
  ] } };
  assert.equal(backupSummary(doc2), '1 treino, em 17/11/2026 · 2 check-ins · salvo em 18/11/2026');
});
