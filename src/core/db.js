// src/core/db.js
// IndexedDB-Schicht (adaptiert aus Mein-WorkFloh).
//
// WICHTIG (Browser-Lehre 1 + Sage Modul 09): GitHub-Pages-Project-Sites teilen
// denselben Origin (lausiklauskn-png.github.io). Ohne eigenen DB-Namen würde
// BookLedgerPro mit den Geschwister-Apps kollidieren ("blocked-origin-collision").
// Deshalb trägt JEDE Datenbank das Suffix `bookledgerpro`.

export const DB_SUFFIX = 'bookledgerpro';
const DB_NAME = `blpr_${DB_SUFFIX}`;
const DB_VERSION = 1;

// Object-Stores:
//  kv       — kleine Schlüssel/Wert-Paare (Settings, verschlüsselter Meta-Blob)
//  records  — Buchhaltungs-Datensätze (Konten, Buchungen, …), Index nach "type"
//  files    — verschlüsselte Belege/Binärdaten
export const STORES = { KV: 'kv', RECORDS: 'records', FILES: 'files' };

let _dbPromise = null;

export function openDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.KV)) {
        db.createObjectStore(STORES.KV);
      }
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        const rs = db.createObjectStore(STORES.RECORDS, { keyPath: 'id' });
        rs.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.FILES)) {
        db.createObjectStore(STORES.FILES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn('[db] open blocked — anderer Tab hält eine ältere Version');
  });
  return _dbPromise;
}

function tx(store, mode) {
  return openDb().then((db) => db.transaction(store, mode).objectStore(store));
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---- KV-Store ---------------------------------------------------------------

export async function kvGet(key) {
  return wrap((await tx(STORES.KV, 'readonly')).get(key));
}
export async function kvSet(key, value) {
  return wrap((await tx(STORES.KV, 'readwrite')).put(value, key));
}
export async function kvDel(key) {
  return wrap((await tx(STORES.KV, 'readwrite')).delete(key));
}

// ---- Records-Store (keyPath: id) -------------------------------------------

export async function recPut(record) {
  if (!record || !record.id) throw new Error('recPut: id fehlt');
  return wrap((await tx(STORES.RECORDS, 'readwrite')).put(record));
}
export async function recGet(id) {
  return wrap((await tx(STORES.RECORDS, 'readonly')).get(id));
}
export async function recDel(id) {
  return wrap((await tx(STORES.RECORDS, 'readwrite')).delete(id));
}
export async function recAll(type) {
  const store = await tx(STORES.RECORDS, 'readonly');
  if (!type) return wrap(store.getAll());
  return wrap(store.index('type').getAll(type));
}

// ---- Files-Store ------------------------------------------------------------

export async function filePut(fileRecord) {
  if (!fileRecord || !fileRecord.id) throw new Error('filePut: id fehlt');
  return wrap((await tx(STORES.FILES, 'readwrite')).put(fileRecord));
}
export async function fileGet(id) {
  return wrap((await tx(STORES.FILES, 'readonly')).get(id));
}
export async function fileDel(id) {
  return wrap((await tx(STORES.FILES, 'readwrite')).delete(id));
}
export async function fileAllMeta() {
  // Belege können groß sein; für Listen nur Metadaten zurückgeben.
  const all = await wrap((await tx(STORES.FILES, 'readonly')).getAll());
  return all.map(({ data, ...meta }) => meta);
}

/** Exportiert den kompletten Datenbestand (für Backup). */
export async function dumpAll() {
  const db = await openDb();
  const out = { kv: {}, records: [], files: [] };
  await Promise.all([
    new Promise((res) => {
      const s = db.transaction(STORES.KV, 'readonly').objectStore(STORES.KV);
      const cur = s.openCursor();
      cur.onsuccess = (e) => {
        const c = e.target.result;
        if (c) { out.kv[c.key] = c.value; c.continue(); } else res();
      };
    }),
    tx(STORES.RECORDS, 'readonly').then((s) => wrap(s.getAll())).then((r) => (out.records = r)),
    tx(STORES.FILES, 'readonly').then((s) => wrap(s.getAll())).then((f) => (out.files = f)),
  ]);
  return out;
}

/** Löscht ALLE Daten (für Reset / Test des Wiederherstellungs-Pfads). */
export async function wipeAll() {
  const db = await openDb();
  await Promise.all(
    [STORES.KV, STORES.RECORDS, STORES.FILES].map(
      (s) => wrap(db.transaction(s, 'readwrite').objectStore(s).clear())
    )
  );
}
