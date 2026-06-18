// src/core/backupOrdner.js
// Gemerkter Backup-Zielordner (Schritt 3). Persistiert das FileSystemDirectoryHandle
// GERÄTELOKAL in einer EIGENEN, UNVERSCHLÜSSELTEN kv-DB — getrennt von den Tresor-DBs
// (das Handle ist kein personenbezogener Inhalt, sondern eine Geräte-Einstellung und
// muss auch vor/ohne Tresor wählbar sein). FileSystemDirectoryHandle ist
// strukturiert-klonbar → in IndexedDB speicherbar.
//
// DOM/IndexedDB-Schicht → statisch geprüft (kein Headless-Browser). Die reine
// Ziel-/Strategie-Logik liegt node-getestet in `domain/backupStrategie.js`.

import { DB_SUFFIX } from './db.js';

const DB_NAME = `blpr_backupordner_${DB_SUFFIX}`; // DB-Suffix unverändert (Regel #3)
const STORE = 'kv';
const KEY = 'handle';
let _p = null;

function openDb() {
  if (_p) return _p;
  _p = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _p;
}

/** Merkt sich den gewählten Zielordner (Handle) gerätelokal. */
export async function merkeBackupOrdner(handle) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readwrite').objectStore(STORE).put(handle, KEY);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

/** Lädt den gemerkten Zielordner (Handle) oder null. */
export async function ladeBackupOrdner() {
  let db;
  try { db = await openDb(); } catch { return null; }
  return new Promise((resolve) => {
    try {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

/** Vergisst den gemerkten Zielordner. */
export async function vergissBackupOrdner() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(KEY);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
