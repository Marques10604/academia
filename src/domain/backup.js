// Pure backup format and rules. Imports only from ./dates.js; never touches data/ or ui/, never reads the clock.
//
// EVERY IndexedDB store except 'active' (the in-progress draft) must be listed in BACKUP_STORES,
// or it is silently left out of the backup. The 08-backup E2E compares this list with the real database.
import { localDate, brDate, daysBetween } from './dates.js';

// Remind after this many workouts without a backup: about one week at the weekly goal of 3.
// A trigger based on the data at risk, not calendar nagging (PITFALLS 2).
export const BACKUP_NUDGE_WORKOUTS = 3;

export const BACKUP_APP = 'academia';
export const BACKUP_FORMAT = 1; // version of the envelope, not of the database

// store name -> key field of its rows
export const BACKUP_STORES = Object.freeze({
  settings: 'key',
  sessions: 'id',
  exercisePrefs: 'exerciseId',
  dailyLogs: 'localDate', // morning check-in, one row per local day
});

export function buildBackup({ stores, schemaVersion, appVersion, now }) {
  const counts = {};
  for (const name of Object.keys(stores)) counts[name] = stores[name].length;
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion,
    appVersion,
    exportedAt: new Date(now).toISOString(),
    counts,
    stores,
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function validSet(s) {
  return isObj(s) && isNum(s.load) && isNum(s.reps) && isStr(s.kind);
}

function validEntry(e) {
  return isObj(e) && isStr(e.exerciseId) && Array.isArray(e.sets) && e.sets.every(validSet);
}

// Extra validation per store. A field is checked ONLY when present: partial rows are normal
// (a preference may hold just a note, or just a unit).
const ROW_CHECKS = {
  sessions: (r) => isNum(r.startedAt) && Array.isArray(r.entries) && r.entries.every(validEntry),
  exercisePrefs: (r) => (
    (r.incrementKg === undefined || (isNum(r.incrementKg) && r.incrementKg > 0))
    && (r.unit === undefined || r.unit === 'kg' || r.unit === 'placa')
    && (r.note === undefined || isStr(r.note))
  ),
  dailyLogs: (r) => (
    DAY.test(r.localDate)
    && (r.weightKg === undefined || isNum(r.weightKg))
    && (r.waistCm === undefined || isNum(r.waistCm))
    && (r.sleep === undefined || isRating(r.sleep))
    && (r.energy === undefined || isRating(r.energy))
  ),
};

const isRating = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const NOT_A_BACKUP = 'Este arquivo não é um backup do app.';

// Validates only. Accepted rows are kept verbatim (no field picking), so restored rows deep-equal exported rows.
export function parseBackup(text, currentSchema) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return { ok: false, error: NOT_A_BACKUP };
  }
  if (!isObj(doc) || doc.app !== BACKUP_APP || !Number.isInteger(doc.schemaVersion) || doc.schemaVersion < 1) {
    return { ok: false, error: NOT_A_BACKUP };
  }
  if (doc.schemaVersion > currentSchema) {
    return { ok: false, error: 'Este backup é de uma versão mais nova do app. Feche e abra o app para atualizar e tente de novo.' };
  }
  if (!isObj(doc.stores)) return { ok: false, error: NOT_A_BACKUP };

  const stores = {};
  for (const [name, keyField] of Object.entries(BACKUP_STORES)) {
    const rows = doc.stores[name];
    if (rows === undefined) {
      stores[name] = [];
      continue;
    }
    const check = ROW_CHECKS[name];
    const good = Array.isArray(rows) && rows.every((r) => (
      isObj(r) && isStr(r[keyField]) && r[keyField] !== '' && (!check || check(r))));
    if (!good) return { ok: false, error: `Backup danificado: registro inválido em ${name}.` };
    stores[name] = rows;
  }
  return {
    ok: true,
    doc: {
      app: doc.app,
      format: doc.format,
      schemaVersion: doc.schemaVersion,
      appVersion: doc.appVersion,
      exportedAt: doc.exportedAt,
      stores,
    },
  };
}

// One line shown before restoring: "3 treinos, de 10/11/2026 a 17/11/2026 · salvo em 18/11/2026".
export function backupSummary(doc) {
  const sessions = [...(doc.stores.sessions || [])].sort((a, b) => a.startedAt - b.startedAt);
  let line;
  if (sessions.length === 0) line = 'Nenhum treino';
  else if (sessions.length === 1) line = `1 treino, em ${brDate(sessions[0].localDate)}`;
  else line = `${sessions.length} treinos, de ${brDate(sessions[0].localDate)} a ${brDate(sessions[sessions.length - 1].localDate)}`;
  const checkins = (doc.stores.dailyLogs || []).length;
  if (checkins > 0) line += ` · ${checkins} ${checkins === 1 ? 'check-in' : 'check-ins'}`;
  const exported = Date.parse(doc.exportedAt);
  if (Number.isFinite(exported)) line += ` · salvo em ${brDate(localDate(exported))}`;
  return line;
}

// What to write to the database. After a restore the phone holds exactly that backup, so its age
// starts at the export date and the "3 workouts without a backup" count starts from zero.
export function prepareRestore(doc, now) {
  const out = {};
  for (const name of Object.keys(BACKUP_STORES)) out[name] = [...(doc.stores[name] || [])];
  const exported = Date.parse(doc.exportedAt);
  out.settings = out.settings.filter((r) => r.key !== 'lastBackupAt');
  out.settings.push({ key: 'lastBackupAt', value: Number.isFinite(exported) ? exported : now });
  return out;
}

// since = saved workouts (complete or not, both are data) newer than the last backup;
// daysAgo = whole local days since that backup (null when there is none).
export function backupStatus({ lastBackupAt, sessions, today }) {
  const since = sessions.filter((s) => lastBackupAt === null || lastBackupAt === undefined
    || (s.endedAt ?? s.startedAt) > lastBackupAt).length;
  const daysAgo = Number.isFinite(lastBackupAt) ? daysBetween(localDate(lastBackupAt), today) : null;
  return { daysAgo, since, due: since >= BACKUP_NUDGE_WORKOUTS };
}

export function backupFileName(today, ext) {
  return `academia-backup-${today}.${ext}`;
}
