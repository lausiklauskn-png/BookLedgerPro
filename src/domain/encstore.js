// src/domain/encstore.js
// Generischer verschlüsselter Record-Store. Für personenbezogene Daten (Kunden,
// Mitarbeiter, Zeiten) — DSGVO-konform verschlüsselt at rest, wie Buchungen.
// Layout: { id, type, enc:{iv,ct} }; `type` bleibt im Klartext (für den Index).

import { recAll, recGet, recPut, recDel } from '../core/db.js';
import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

export async function encPut(obj) {
  if (!obj || !obj.id || !obj.type) throw new Error('encPut: id/type fehlt');
  const enc = await encryptWithKey(key(), JSON.stringify(obj));
  await recPut({ id: obj.id, type: obj.type, enc });
  return obj;
}

export async function encGet(id) {
  const r = await recGet(id);
  if (!r) return null;
  return r.enc ? JSON.parse(await decryptWithKey(key(), r.enc)) : r;
}

export async function encList(type) {
  const recs = await recAll(type);
  const out = [];
  for (const r of recs) out.push(r.enc ? JSON.parse(await decryptWithKey(key(), r.enc)) : r);
  return out;
}

export async function encDel(id) {
  await recDel(id);
}

export function neueId(prefix) {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}
