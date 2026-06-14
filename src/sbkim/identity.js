// src/sbkim/identity.js
// SBKIM-Identität: Ed25519-Schlüsselpaar erzeugen, VERSCHLÜSSELT speichern
// (Sitzungs-Key), laden. Eine PWA = eine Identität (origin-/instanzgebunden).
// Privater Schlüssel verlässt das Gerät nie im Klartext.

import { encryptWithKey, decryptWithKey } from '../core/crypto.js';
import { getSessionKey } from '../core/vault.js';
import { kvGet, kvSet, kvDel } from '../core/db.js';
import { generateKeyPair, publicX, nodeId } from './spore.js';

const ID_KEY = 'sbkimIdentity';

function key() {
  const k = getSessionKey();
  if (!k) throw new Error('Tresor gesperrt');
  return k;
}

/** Gibt es bereits eine SBKIM-Identität in dieser Instanz? */
export async function identityExists() {
  return Boolean(await kvGet(ID_KEY));
}

async function importFromJwk(privJwk, pubJwk) {
  const privateKey = await crypto.subtle.importKey('jwk', privJwk, { name: 'Ed25519' }, true, ['sign']);
  const publicKey = await crypto.subtle.importKey('jwk', pubJwk, { name: 'Ed25519' }, true, ['verify']);
  return { privateKey, publicKey };
}

/** Erzeugt eine neue Identität und speichert sie verschlüsselt. */
export async function createIdentity() {
  if (await identityExists()) throw new Error('SBKIM-Identität existiert bereits');
  const kp = await generateKeyPair();
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const enc = await encryptWithKey(key(), JSON.stringify({ privJwk, pubJwk }));
  await kvSet(ID_KEY, enc);
  return { id: await nodeId(kp.publicKey), x: await publicX(kp.publicKey), keys: kp };
}

/** Lädt die gespeicherte Identität (CryptoKeys + Meta) oder null. */
export async function loadIdentity() {
  const enc = await kvGet(ID_KEY);
  if (!enc) return null;
  const { privJwk, pubJwk } = JSON.parse(await decryptWithKey(key(), enc));
  const keys = await importFromJwk(privJwk, pubJwk);
  return { id: await nodeId(keys.publicKey), x: await publicX(keys.publicKey), keys };
}

/** Löscht die SBKIM-Identität (z.B. vor Neu-Andock). */
export async function deleteIdentity() {
  await kvDel(ID_KEY);
}
