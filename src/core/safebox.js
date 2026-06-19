// src/core/safebox.js
// Geheim-Fach ("Tresor im Tresor"): ein UNABHÄNGIG verschlüsselter Bereich mit
// EIGENEM Code, getrennt vom Haupt-Tresor (vault.js). Vorbild: Mein-Tresor
// ("ein Tresorraum mit 20 nummerierten Fächern — jedes Fach = echter AES-Tresor").
//
// Eigenschaften:
//  - Eigener PBKDF2/AES-GCM-Schlüssel aus einem zweiten Passwort (eigenes Salt).
//  - Bleibt zu, auch wenn der Haupt-Tresor offen ist (Defense-in-Depth): der
//    Fach-Schlüssel liegt nur im RAM, wenn das Fach gerade entsperrt ist.
//  - Eigenes Shamir-Backup des Fach-Schlüssels (Datendurabilität, CLAUDE.md #2).
//  - Inhalt (Schlüssel, Verträge, Codes) als ein verschlüsselter Blob in IndexedDB;
//    landet damit auch im verschlüsselten Gesamt-Backup (doppelt verschlüsselt).
//
// Reine Krypto-/Recovery-Helfer sind exportiert und Node-getestet; die
// Speicher-Funktionen (IndexedDB) sind nur im Browser lauffähig.

import {
  deriveAesKey, exportRawAesKey, importRawAesKey, randomBytes,
  bytesToB64u, b64uToBytes, encryptWithKey, decryptWithKey,
} from './crypto.js';
import { kvGet, kvSet } from './db.js';
import { splitSecret, combineShares, encodeShare, decodeShare } from './shamir.js';

const META_KEY = 'safeboxMeta';   // { v, salt, check }
const DATA_KEY = 'safeboxData';   // encryptWithKey-Blob über JSON-Array der Einträge
const CHECK_PLAINTEXT = 'BookLedgerPro:safebox-ok';

export const ENTRY_TYPES = ['schluessel', 'text', 'datei'];

let _safeKey = null;   // CryptoKey (extractable) — nur im RAM, wenn Fach offen

// ---- Reine, Node-testbare Helfer -------------------------------------------

/** Leitet den Fach-Schlüssel aus Passwort + Salt ab (extractable für Shamir). */
export function deriveSafeKey(password, salt, extractable = true) {
  return deriveAesKey(password, salt, extractable);
}

/** Verschlüsselt die Einträge-Liste zu einem Blob. */
export function sealEntries(key, entries) {
  return encryptWithKey(key, JSON.stringify(entries || []));
}

/** Entschlüsselt einen Blob zur Einträge-Liste (oder [] wenn leer). */
export async function openEntries(key, blob) {
  if (!blob) return [];
  return JSON.parse(await decryptWithKey(key, blob));
}

/** Baut einen Eintrag mit stabiler id + Zeitstempel. */
export function makeEntry({ type, name, value = '', fileName = '', mime = '' }) {
  if (!ENTRY_TYPES.includes(type)) throw new Error('Unbekannter Eintrags-Typ');
  if (!name) throw new Error('Name fehlt');
  return { id: bytesToB64u(randomBytes(9)), type, name, value, fileName, mime, createdAt: new Date().toISOString() };
}

/** Splittet den rohen Fach-Schlüssel in kodierte Shamir-Shares. */
export function splitSafeKey(rawKey, shares = 3, threshold = 2) {
  return splitSecret(rawKey, shares, threshold).map((p) => encodeShare(p, threshold));
}

/** Stellt aus Share-Strings den Fach-Schlüssel (CryptoKey) wieder her. */
export async function safeKeyFromShares(shareStrings) {
  const decoded = shareStrings.map(decodeShare);
  const raw = combineShares(decoded);
  return importRawAesKey(raw, /* extractable */ true);
}

// ---- Zustand ---------------------------------------------------------------

export function isSafeOpen() { return _safeKey !== null; }
export function lockSafebox() { _safeKey = null; }
export async function safeboxExists() { return Boolean(await kvGet(META_KEY)); }

function requireOpen() {
  if (!_safeKey) throw new Error('Geheim-Fach ist gesperrt');
  return _safeKey;
}

// ---- Einrichtung / Entsperren ----------------------------------------------

/**
 * Richtet das Geheim-Fach mit einem zweiten Passwort ein.
 * @returns {Promise<{shares:string[]}>} Shamir-Shares zum Sichern.
 */
export async function setupSafebox(password, { shares = 3, threshold = 2 } = {}) {
  if (await safeboxExists()) throw new Error('Geheim-Fach existiert bereits');
  if (!password || password.length < 8) throw new Error('Passwort zu kurz (min. 8 Zeichen)');
  const salt = randomBytes(16);
  const key = await deriveSafeKey(password, salt, true);
  await kvSet(META_KEY, { v: 1, salt: bytesToB64u(salt), check: await encryptWithKey(key, CHECK_PLAINTEXT) });
  await kvSet(DATA_KEY, await sealEntries(key, []));
  _safeKey = key;
  return { shares: splitSafeKey(await exportRawAesKey(key), shares, threshold) };
}

/** Entsperrt das Geheim-Fach mit dem zweiten Passwort. */
export async function unlockSafebox(password) {
  const meta = await kvGet(META_KEY);
  if (!meta) throw new Error('Kein Geheim-Fach vorhanden');
  const key = await deriveSafeKey(password, b64uToBytes(meta.salt), true);
  let plain;
  try { plain = await decryptWithKey(key, meta.check); }
  catch { throw new Error('Falscher Fach-Code'); }
  if (plain !== CHECK_PLAINTEXT) throw new Error('Falscher Fach-Code');
  _safeKey = key;
}

/**
 * Wiederherstellung per Shamir, wenn der Fach-Code vergessen wurde: setzt mit
 * den Shares einen NEUEN Code, ohne den Inhalt zu verlieren.
 */
export async function recoverSafebox(shareStrings, newPassword) {
  if (!newPassword || newPassword.length < 8) throw new Error('Neues Passwort zu kurz (min. 8 Zeichen)');
  const meta = await kvGet(META_KEY);
  if (!meta) throw new Error('Kein Geheim-Fach vorhanden');
  const oldKey = await safeKeyFromShares(shareStrings);
  let entries;
  try { entries = await openEntries(oldKey, await kvGet(DATA_KEY)); }
  catch { throw new Error('Shares passen nicht zu diesem Fach'); }
  // Neuen Code setzen, Inhalt mit neuem Schlüssel neu verschlüsseln.
  const salt = randomBytes(16);
  const newKey = await deriveSafeKey(newPassword, salt, true);
  await kvSet(META_KEY, { v: 1, salt: bytesToB64u(salt), check: await encryptWithKey(newKey, CHECK_PLAINTEXT) });
  await kvSet(DATA_KEY, await sealEntries(newKey, entries));
  _safeKey = newKey;
  return { entries: entries.length };
}

// ---- Einträge ---------------------------------------------------------------

async function loadAll() { return openEntries(requireOpen(), await kvGet(DATA_KEY)); }
async function saveAll(entries) { await kvSet(DATA_KEY, await sealEntries(requireOpen(), entries)); }

/** Liste der Einträge OHNE Inhalt (value), nur Metadaten + Größe. */
export async function listEntries() {
  const all = await loadAll();
  return all.map(({ value, ...meta }) => ({ ...meta, size: (value || '').length }));
}

/** Vollständiger Eintrag inkl. value. */
export async function getEntry(id) {
  return (await loadAll()).find((e) => e.id === id) || null;
}

/** Fügt einen Eintrag hinzu. */
export async function addEntry(input) {
  const entry = makeEntry(input);
  const all = await loadAll();
  all.push(entry);
  await saveAll(all);
  return entry;
}

/** Löscht einen Eintrag. */
export async function deleteEntry(id) {
  await saveAll((await loadAll()).filter((e) => e.id !== id));
}
