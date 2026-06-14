// src/sbkim/spore.js
// SBKIM-Protokoll: Ed25519-Identität, Spore-Bau & -Verifikation.
// Byte-kompatibel zur Sage-Norm (INTERFACES §11): kanonische Signier-Form,
// id == base64url(SHA256(roher 32-Byte-Pubkey)), 9 Pflichtfelder.
// Verifiziert gegen echte Geschwister-Sporen (nodeId + Ed25519 ✔).
//
// Reine Protokoll-Funktionen (browser- UND node-tauglich via crypto.subtle).
// Speicherung der Identität liegt in identity.js.

import { bytesToB64u, b64uToBytes, textToBytes, sha256B64u } from '../core/crypto.js';
import { canonicalize } from '../domain/audit.js';

export const PROTOCOL_VERSION = '0.1';
export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
export const REQUIRED_FIELDS = ['createdAt', 'domain', 'embeddingModel', 'endpoint', 'id', 'nodeType', 'protocolVersion', 'publicKey', 'signature'];

// ---- Schlüssel -------------------------------------------------------------

export async function generateKeyPair() {
  return crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
}

/** Roher 32-Byte-Public-Key. */
export async function exportRawPublic(publicKey) {
  return new Uint8Array(await crypto.subtle.exportKey('raw', publicKey));
}

/** publicKey.x (base64url des rohen Pubkeys) für die Spore. */
export async function publicX(publicKey) {
  return bytesToB64u(await exportRawPublic(publicKey));
}

/** nodeId = base64url(SHA256(roher Pubkey)). */
export async function nodeId(publicKey) {
  const raw = await exportRawPublic(publicKey);
  return sha256B64u(raw);
}

export async function importVerifyKey(xB64u) {
  return crypto.subtle.importKey('jwk', { kty: 'OKP', crv: 'Ed25519', x: xB64u }, { name: 'Ed25519' }, false, ['verify']);
}

// ---- Signatur über kanonische Bytes (§11.1) --------------------------------

function canonicalBytes(obj) {
  return textToBytes(JSON.stringify(canonicalize(obj)));
}

async function signCanonical(privateKey, objWithoutSignature) {
  const sig = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, canonicalBytes(objWithoutSignature));
  return bytesToB64u(new Uint8Array(sig));
}

async function verifyCanonical(xB64u, signatureB64u, objWithoutSignature) {
  const key = await importVerifyKey(xB64u);
  return crypto.subtle.verify({ name: 'Ed25519' }, key, b64uToBytes(signatureB64u), canonicalBytes(objWithoutSignature));
}

// ---- Spore-Bau -------------------------------------------------------------

/**
 * Baut & signiert eine Spore. `keys` = {publicKey, privateKey}.
 * `cfg` liefert Domänen-Felder; `domainVector` (+ ggf. _demo) optional.
 */
export async function buildSpore(keys, cfg) {
  const x = await publicX(keys.publicKey);
  const id = await nodeId(keys.publicKey);
  const spore = {
    createdAt: cfg.createdAt || new Date().toISOString(),
    domain: cfg.domain,
    domainDescription: cfg.domainDescription || '',
    domainKeywords: cfg.domainKeywords || [],
    embeddingModel: EMBEDDING_MODEL,
    endpoint: cfg.endpoint,
    guestCategories: cfg.guestCategories || [],
    id,
    nodeName: cfg.nodeName,
    nodeType: cfg.nodeType || 'hybrid',
    protocolVersion: PROTOCOL_VERSION,
    publicKey: { alg: 'Ed25519', crv: 'Ed25519', ext: true, key_ops: ['verify'], kty: 'OKP', x },
    stammCategories: cfg.stammCategories || [],
  };
  if (cfg.domainVector) {
    spore.domainVector = cfg.domainVector.vector || cfg.domainVector;
    if (cfg.domainVector._demo || cfg.demoVector) spore._demo = ['domainVector'];
  }
  spore.signature = await signCanonical(keys.privateKey, spore);
  return spore;
}

/**
 * Verifiziert eine (fremde) Spore — die 4 Pflicht-Prüfpunkte (§11.2).
 * @returns {Promise<{valid:boolean, checks:Object, errors:string[]}>}
 */
export async function verifySpore(spore) {
  const errors = [];
  const checks = { fields: false, id: false, signature: false, tamper: false };

  // 1) Pflichtfelder
  const fehlend = REQUIRED_FIELDS.filter((f) => spore[f] == null);
  checks.fields = fehlend.length === 0;
  if (!checks.fields) errors.push('Pflichtfeld fehlt: ' + fehlend.join(', '));
  if (!spore.publicKey || !spore.publicKey.x) { errors.push('publicKey.x fehlt'); return { valid: false, checks, errors }; }

  // 2) id == base64url(SHA256(roher Pubkey))
  const erwartetId = await sha256B64u(b64uToBytes(spore.publicKey.x));
  checks.id = erwartetId === spore.id;
  if (!checks.id) errors.push('id passt nicht zu SHA256(publicKey)');

  // 3) Signatur über kanonische Bytes (ohne signature)
  const { signature, ...ohneSig } = spore;
  try { checks.signature = await verifyCanonical(spore.publicKey.x, signature, ohneSig); }
  catch (e) { checks.signature = false; errors.push('Signaturprüfung fehlgeschlagen: ' + e.message); }
  if (!checks.signature && !errors.some((e) => e.startsWith('Signaturprüfung'))) errors.push('Signatur ungültig');

  // 4) Manipulationsprobe: ein verändertes Feld muss durchfallen
  try {
    const tampered = { ...ohneSig, domain: (spore.domain || '') + '_tamper' };
    const stillValid = await verifyCanonical(spore.publicKey.x, signature, tampered);
    checks.tamper = !stillValid;
  } catch { checks.tamper = true; }
  if (!checks.tamper) errors.push('Manipulationsprobe nicht bestanden');

  const valid = checks.id && checks.signature && checks.tamper && checks.fields;
  return { valid, checks, errors };
}
