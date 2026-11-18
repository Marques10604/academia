// Raw IndexedDB access. The only module that touches indexedDB.

export const DB_NAME = 'academia';
export const SCHEMA_VERSION = 1;

let dbPromise = null;

export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const names = db.objectStoreNames;
      if (!names.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      if (!names.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt');
      }
      if (!names.contains('active')) db.createObjectStore('active', { keyPath: 'id' });
      if (!names.contains('exercisePrefs')) db.createObjectStore('exercisePrefs', { keyPath: 'exerciseId' });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        location.reload();
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      // another tab holds an older version open; wait for it to close
    };
  });
  return dbPromise;
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function get(store, key) {
  const db = await openDb();
  return wrap(db.transaction(store, 'readonly').objectStore(store).get(key));
}

export async function put(store, value) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  tx.objectStore(store).put(value);
  await done;
  return value;
}

export async function getAll(store) {
  const db = await openDb();
  return wrap(db.transaction(store, 'readonly').objectStore(store).getAll());
}

export async function del(store, key) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  tx.objectStore(store).delete(key);
  await done;
}

export async function getSetting(key, fallback) {
  const row = await get('settings', key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  return put('settings', { key, value });
}

export async function listSessions() {
  const all = await getAll('sessions');
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function getActive() {
  return (await get('active', 'current')) || null;
}

export function putActive(draft) {
  return put('active', { ...draft, id: 'current' });
}

// All-or-nothing finish: save the session and drop the draft in ONE transaction.
export async function finishActive(session) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['sessions', 'active'], 'readwrite');
    tx.oncomplete = () => resolve(session);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    tx.objectStore('sessions').put(session);
    tx.objectStore('active').delete('current');
  });
}

// Backup export: every named store read in ONE readonly transaction -> { name: rows }.
export async function readStores(names) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, 'readonly');
    const out = {};
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    for (const name of names) {
      const req = tx.objectStore(name).getAll();
      req.onsuccess = () => { out[name] = req.result; };
    }
  });
}

// Backup restore: clear and refill every given store in ONE readwrite transaction.
// Any error aborts the whole transaction, so the current data stays untouched.
export async function replaceStores(stores) {
  const db = await openDb();
  const names = Object.keys(stores);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    try {
      for (const name of names) {
        const store = tx.objectStore(name);
        store.clear();
        for (const row of stores[name]) store.put(row);
      }
    } catch (err) {
      try { tx.abort(); } catch { /* already finished */ }
      reject(err);
    }
  });
}

export async function requestPersist() {
  if (navigator.storage && navigator.storage.persist) return navigator.storage.persist();
  return false;
}

export async function isPersisted() {
  if (navigator.storage && navigator.storage.persisted) return navigator.storage.persisted();
  return false;
}
