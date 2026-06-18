// src/core/backup.js
// Verschlüsseltes Backup-Bundle (adaptiert aus Mein-Tresor Export/Import).
// Pages-spore.json ist KEIN Backup (Browser-Lehre 2) — DIES ist der echte Schutz
// vor IndexedDB-Verlust. Onboarding erzwingt den ersten Export.

import { encryptWithPassword, decryptWithPassword } from './crypto.js';
import { dumpAll, kvSet, recPut, filePut } from './db.js';
import { downloadText } from './files.js';
import { markBackupDone } from './durability.js';

const MAGIC = 'BLPR-BACKUP';
const FORMAT_VERSION = 1;

/**
 * Baut den passwortverschlüsselten Backup-Text aus einem gegebenen Snapshot
 * (Form wie `dumpAll()` → `{ kv, records, files }`). Reine Funktion ohne DB-Zugriff,
 * damit der Backup→Restore-Roundtrip node-/browser-testbar bleibt.
 * @returns {Promise<string>} JSON-Text (verschlüsselt) zum Download.
 */
export async function buildBackupFromSnapshot(snapshot, password) {
  const payload = JSON.stringify({
    magic: MAGIC,
    format: FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    app: 'BookLedgerPro',
    data: snapshot,
  });
  const sealed = await encryptWithPassword(password, payload);
  return JSON.stringify({ magic: MAGIC, format: FORMAT_VERSION, sealed }, null, 2);
}

/**
 * Baut ein passwortverschlüsseltes Backup des gesamten Datenbestands.
 * @returns {Promise<string>} JSON-Text (verschlüsselt) zum Download.
 */
export async function buildBackup(password) {
  return buildBackupFromSnapshot(await dumpAll(), password);
}

/** Baut das Backup und löst direkt einen Download aus; markiert Backup als erledigt. */
export async function exportBackupFile(password) {
  const text = await buildBackup(password);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadText(`bookledgerpro-backup-${stamp}.blpr.json`, text, 'application/json');
  await markBackupDone();
}

/**
 * Liest & entschlüsselt ein Backup. Gibt das Snapshot-Objekt zurück
 * (ohne es zu importieren — der Aufrufer entscheidet über Merge/Replace).
 */
export async function readBackup(password, fileText) {
  let outer;
  try { outer = JSON.parse(fileText); }
  catch { throw new Error('Datei ist kein gültiges JSON'); }
  if (outer.magic !== MAGIC || !outer.sealed) throw new Error('Keine BookLedgerPro-Sicherung');

  let inner;
  try { inner = await decryptWithPassword(password, outer.sealed); }
  catch { throw new Error('Falsches Passwort oder beschädigte Datei'); }

  const parsed = JSON.parse(inner);
  if (parsed.magic !== MAGIC) throw new Error('Sicherung beschädigt');
  return parsed;
}

/**
 * Importiert einen Snapshot in die lokale DB.
 * @param mode 'replace' überschreibt, 'merge' ergänzt (id-basiert, letzter gewinnt).
 */
export async function importSnapshot(snapshot, mode = 'merge') {
  const { kv = {}, records = [], files = [] } = snapshot.data || {};
  // KV (Settings/Meta): bei replace komplett, bei merge nur fehlende Schlüssel? —
  // Sicherheitshalber Settings/Meta nur bei 'replace' übernehmen, sonst Identität schützen.
  for (const [k, v] of Object.entries(kv)) {
    if (mode === 'replace') await kvSet(k, v);
  }
  for (const r of records) await recPut(r);
  for (const f of files) await filePut(f);
  return { records: records.length, files: files.length };
}

// ---- Backup→Restore-Roundtrip-Selbsttest (rein, ohne IndexedDB) -------------
// Datendurabilität ist Pflicht-Feature #1: die Rettung muss BEWIESEN sein, nicht
// behauptet (CLAUDE.md Regel #2). Die folgenden Funktionen arbeiten auf einem
// Snapshot-Objekt (Form wie `dumpAll()`) und prüfen den vollständigen Weg
// Snapshot → verschlüsseltes Backup → entschlüsseln → Probespeicher-Import →
// byte-genauer Vergleich mit dem Original. Vollständig node-/browser-testbar.

const _enc = new TextEncoder();

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Bringt einen Snapshot auf eine feste Feld-Reihenfolge (kv/records/files). */
function normSnapshot(s) {
  const x = s || {};
  return { kv: x.kv || {}, records: x.records || [], files: x.files || [] };
}

/** Kanonische Byte-Repräsentation eines Snapshots (Grundlage des byte-genauen Vergleichs). */
export function snapshotBytes(snapshot) {
  return _enc.encode(JSON.stringify(normSnapshot(snapshot)));
}

/**
 * Importiert einen gelesenen Backup-Snapshot in einen In-Memory-Probespeicher und
 * liefert ihn wieder als Snapshot zurück. Spiegelt `importSnapshot('replace')` +
 * `dumpAll()` ohne IndexedDB: kv vollständig (replace), records/files id-basiert
 * (letzter gewinnt), Reihenfolge erhalten.
 */
export function importProbe(parsed) {
  const { kv = {}, records = [], files = [] } = (parsed && parsed.data) || {};
  const store = { kv: {}, records: new Map(), files: new Map() };
  for (const [k, v] of Object.entries(kv)) store.kv[k] = v;
  for (const r of records) store.records.set(r.id, r);
  for (const f of files) store.files.set(f.id, f);
  return { kv: store.kv, records: [...store.records.values()], files: [...store.files.values()] };
}

/**
 * Backup→Restore-Roundtrip-Selbsttest (rein, kein IndexedDB).
 * Baut aus dem Snapshot ein verschlüsseltes Backup, liest/entschlüsselt es, importiert
 * es in einen Probespeicher und vergleicht **byte-genau** mit dem Original.
 * @returns {Promise<{ok:boolean, gleich:boolean, bytesOriginal:number, bytesWieder:number, fehler?:string}>}
 */
export async function backupRoundtripSelbsttest(snapshot, password = 'roundtrip-selbsttest-pw') {
  try {
    const text = await buildBackupFromSnapshot(snapshot, password);
    const parsed = await readBackup(password, text);
    const wieder = importProbe(parsed);
    const a = snapshotBytes(snapshot);
    const b = snapshotBytes(wieder);
    const gleich = bytesEqual(a, b);
    return { ok: gleich, gleich, bytesOriginal: a.length, bytesWieder: b.length };
  } catch (e) {
    return { ok: false, gleich: false, bytesOriginal: 0, bytesWieder: 0, fehler: String((e && e.message) || e) };
  }
}

export const BACKUP_INFO = { MAGIC, FORMAT_VERSION };
