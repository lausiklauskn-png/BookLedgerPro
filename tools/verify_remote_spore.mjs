// tools/verify_remote_spore.mjs
// Headless-Verifizierer einer SBKIM-Spore (INTERFACES §11.2), zero-dependency,
// nur node:crypto. Gegenstück zur Browser-Verifikation (src/sbkim/spore.js).
//
// Nutzung:
//   node tools/verify_remote_spore.mjs <pfad-oder-URL>
//   node tools/verify_remote_spore.mjs https://raw.githubusercontent.com/<repo>/main/sbkim/spore.json
//
// Urteil VALID nur wenn: id == base64url(SHA256(pubkey)) ∧ Signatur gültig ∧
// Manipulationsprobe fällt durch (Pflichtfelder vorausgesetzt).

import { webcrypto as crypto } from 'node:crypto';
import { readFileSync } from 'node:fs';

const REQUIRED = ['createdAt', 'domain', 'embeddingModel', 'endpoint', 'id', 'nodeType', 'protocolVersion', 'publicKey', 'signature'];

function b64uToBytes(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return new Uint8Array(Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64'));
}
function bytesToB64u(b) {
  return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function canon(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(canon);
  const o = {}; for (const k of Object.keys(v).sort()) o[k] = canon(v[k]); return o;
}

async function sha256B64u(bytes) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return bytesToB64u(d);
}
async function verifyCanonical(x, sig, objOhneSig) {
  const key = await crypto.subtle.importKey('jwk', { kty: 'OKP', crv: 'Ed25519', x }, { name: 'Ed25519' }, false, ['verify']);
  const bytes = new TextEncoder().encode(JSON.stringify(canon(objOhneSig)));
  return crypto.subtle.verify({ name: 'Ed25519' }, key, b64uToBytes(sig), bytes);
}

/** Verifiziert ein Spore-Objekt; liefert {valid, checks, errors}. */
export async function verifySporeObject(spore) {
  const errors = [];
  const checks = { fields: false, id: false, signature: false, tamper: false };
  const fehlend = REQUIRED.filter((f) => spore[f] == null);
  checks.fields = fehlend.length === 0;
  if (!checks.fields) errors.push('Pflichtfeld fehlt: ' + fehlend.join(', '));
  if (!spore.publicKey || !spore.publicKey.x) { errors.push('publicKey.x fehlt'); return { valid: false, checks, errors }; }

  checks.id = (await sha256B64u(b64uToBytes(spore.publicKey.x))) === spore.id;
  if (!checks.id) errors.push('id passt nicht zu SHA256(publicKey)');

  const { signature, ...ohneSig } = spore;
  try { checks.signature = await verifyCanonical(spore.publicKey.x, signature, ohneSig); }
  catch (e) { errors.push('Signaturprüfung: ' + e.message); }
  if (!checks.signature) errors.push('Signatur ungültig');

  const tampered = { ...ohneSig, domain: (spore.domain || '') + '_tamper' };
  checks.tamper = !(await verifyCanonical(spore.publicKey.x, signature, tampered).catch(() => false));
  if (!checks.tamper) errors.push('Manipulationsprobe nicht bestanden');

  return { valid: checks.fields && checks.id && checks.signature && checks.tamper, checks, errors };
}

async function main() {
  const src = process.argv[2];
  if (!src) { console.error('Nutzung: node tools/verify_remote_spore.mjs <pfad-oder-URL>'); process.exit(2); }
  let text;
  if (/^https?:\/\//.test(src)) text = await (await fetch(src)).text();
  else text = readFileSync(src, 'utf8');
  const res = await verifySporeObject(JSON.parse(text));
  console.log(JSON.stringify(res, null, 2));
  console.log(res.valid ? '\n✔ VALID' : '\n✗ UNGÜLTIG');
  process.exit(res.valid ? 0 : 1);
}

// Nur ausführen, wenn direkt gestartet (nicht beim Import im Test).
if (import.meta.url === `file://${process.argv[1]}`) main();
