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

/** Speichert eine Datei verschlüsselt als Beleg, gibt die Metadaten zurück. */
export async function saveBeleg(file) {
  const bytes = await readFileBytes(file);
  const data = await encryptBytesWithKey(key(), bytes);   // { v, iv, ct }
  const rec = {
    id: neueId(),
    name: file.name || 'Beleg',
    mediaType: file.type || 'application/octet-stream',
    size: bytes.length,
    createdAt: new Date().toISOString(),
    buchungId: null,
    data, // verschlüsselt — von fileAllMeta() ausgeblendet
  };
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

export async function linkBeleg(belegId, buchungId) {
  const rec = await fileGet(belegId);
  if (!rec) throw new Error('Beleg nicht gefunden');
  rec.buchungId = buchungId;
  await filePut(rec);
}

export async function deleteBeleg(id) {
  await fileDel(id);
}

/** Wandelt Bytes in Standard-Base64 (für die Vision-API). */
export function bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
