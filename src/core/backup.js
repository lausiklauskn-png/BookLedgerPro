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
 * Baut ein passwortverschlüsseltes Backup des gesamten Datenbestands.
 * @returns {Promise<string>} JSON-Text (verschlüsselt) zum Download.
 */
export async function buildBackup(password) {
  const snapshot = await dumpAll();
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

export const BACKUP_INFO = { MAGIC, FORMAT_VERSION };
