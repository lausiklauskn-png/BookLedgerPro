// src/domain/documents.js
// Verschlüsselter Beleg-Store. Belege (Bild/PDF) liegen AES-GCM-verschlüsselt im
// IndexedDB-files-Store; Metadaten unverschlüsselt für Listenanzeige. Verknüpfung
// zu Buchungen über buchungId.

import { filePut, fileGet, fileDel, fileAllMeta } from '../core/db.js';
import { encryptBytesWithKey, decryptBytesWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { readFileBytes } from '../core/files.js';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

function neueId() {
  return 'beleg:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8);
}

/** Speichert eine Datei verschlüsselt als Beleg, gibt die Metadaten zurück.
 *  `opt.typ` ersetzt einen fehlenden Dateityp (aus einem Ordner kommt oft '').
 *  `opt.original` (File) ist das Originalfoto eines Scans (Klaus 2026-10-14: „Scan + Original
 *  behalten", GoBD): es liegt UNVERÄNDERT und verschlüsselt am selben Beleg (`originalDaten`),
 *  `opt.scan` = {sicher, grund, weg} sagt, wie der Scan entstand.
 *  Geprüft wird NICHT beim Ablegen (Klaus 2026-10-14: prüfen erst auf Knopfdruck). */
export async function saveBeleg(file, opt = {}) {
  const bytes = await readFileBytes(file);
  const data = await encryptBytesWithKey(key(), bytes);   // { v, iv, ct }
  const rec = {
    id: neueId(),
    name: file.name || 'Beleg',
    mediaType: file.type || opt.typ || 'application/octet-stream',
    size: bytes.length,
    createdAt: new Date().toISOString(),
    buchungId: null,
    data, // verschlüsselt — von fileAllMeta() ausgeblendet
  };
  if (opt.original) {
    const ob = await readFileBytes(opt.original);
    rec.originalDaten = await encryptBytesWithKey(key(), ob);   // verschlüsselt — von fileAllMeta() ausgeblendet
    rec.original = { name: opt.original.name || 'Foto', mediaType: opt.original.type || opt.originalTyp || 'application/octet-stream', size: ob.length };
    if (opt.scan) rec.scan = { sicher: !!opt.scan.sicher, grund: String(opt.scan.grund || ''), weg: String(opt.scan.weg || '') };
  }
  await filePut(rec);
  const { data: _, ...meta } = rec;
  return meta;
}

/** Listet Beleg-Metadaten (ohne die verschlüsselten Inhalte). */
export async function listBelege() {
  const metas = await fileAllMeta();
  metas.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return metas;
}

/** Entschlüsselt und liefert die Roh-Bytes eines Belegs. */
export async function getBelegBytes(id) {
  const rec = await fileGet(id);
  if (!rec) return null;
  return decryptBytesWithKey(key(), rec.data);
}

/** Das Originalfoto eines Scans (entschlüsselt) oder null. */
export async function getOriginalBytes(id) {
  const rec = await fileGet(id);
  if (!rec || !rec.originalDaten) return null;
  return decryptBytesWithKey(key(), rec.originalDaten);
}

export async function linkBeleg(belegId, buchungId) {
  const rec = await fileGet(belegId);
  if (!rec) throw new Error('Beleg nicht gefunden');
  rec.buchungId = buchungId;
  await filePut(rec);
}

export async function deleteBeleg(id) {
  await fileDel(id);
}

// GoBD-Aufbewahrung: reine Helfer in aufbewahrung.js (ohne Speicher-Abhängigkeit), hier re-exportiert.
export { AUFBEWAHRUNG_JAHRE, aufbewahrungBis, istAufbewahrungspflichtig, darfBelegLoeschen } from './aufbewahrung.js';

/** Wandelt Bytes in Standard-Base64 (für die Vision-API). */
export function bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
