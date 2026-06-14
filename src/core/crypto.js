// src/core/crypto.js
// Krypto-Fundament (adaptiert aus Mein-Tresor): AES-GCM-256 + PBKDF2-SHA256.
// Alles bleibt in der Browser-Welt. Klartext verlässt das Gerät nie unverschlüsselt.

const PBKDF2_ITERATIONS = 600000; // vgl. Tresor/SBKIM-Backup-Konvention
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Kryptografisch sichere Zufallsbytes. */
export function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// ---- Base64url-Helfer (URL-sicher, ohne Padding) ----------------------------

export function bytesToB64u(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64uToBytes(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export const textToBytes = (s) => enc.encode(s);
export const bytesToText = (b) => dec.decode(b);

// ---- Schlüsselableitung -----------------------------------------------------

/**
 * Leitet einen AES-GCM-256-Schlüssel aus einem Passwort ab.
 * @param {string} password
 * @param {Uint8Array} salt
 * @param {boolean} extractable - true, wenn der Roh-Key exportierbar sein soll (Shamir-Backup)
 */
export async function deriveAesKey(password, salt, extractable = false) {
  const baseKey = await crypto.subtle.importKey(
    'raw', textToBytes(password), 'PBKDF2', false, ['deriveKey', 'deriveBits']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/** Importiert rohe 32 Byte als AES-GCM-Key (für Identitäts-/Key-Wiederherstellung). */
export function importRawAesKey(rawBytes, extractable = false) {
  return crypto.subtle.importKey('raw', rawBytes, { name: 'AES-GCM' }, extractable, ['encrypt', 'decrypt']);
}

/** Exportiert den rohen Schlüssel (nur möglich, wenn extractable). */
export async function exportRawAesKey(key) {
  return new Uint8Array(await crypto.subtle.exportKey('raw', key));
}

// ---- Verschlüsselung --------------------------------------------------------

/**
 * Verschlüsselt UTF-8-Text mit einem abgeleiteten Key.
 * Rückgabe: selbstbeschreibendes Paket { v, salt, iv, ct } (alles base64url).
 */
export async function encryptWithPassword(password, plaintext) {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveAesKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textToBytes(plaintext));
  return { v: 1, salt: bytesToB64u(salt), iv: bytesToB64u(iv), ct: bytesToB64u(new Uint8Array(ct)) };
}

export async function decryptWithPassword(password, pkg) {
  const salt = b64uToBytes(pkg.salt);
  const iv = b64uToBytes(pkg.iv);
  const key = await deriveAesKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, b64uToBytes(pkg.ct));
  return bytesToText(new Uint8Array(pt));
}

/** Verschlüsselt mit einem bereits abgeleiteten CryptoKey (Hot-Path, kein PBKDF2). */
export async function encryptWithKey(key, plaintext) {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textToBytes(plaintext));
  return { v: 1, iv: bytesToB64u(iv), ct: bytesToB64u(new Uint8Array(ct)) };
}

export async function decryptWithKey(key, pkg) {
  const iv = b64uToBytes(pkg.iv);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, b64uToBytes(pkg.ct));
  return bytesToText(new Uint8Array(pt));
}

/** Verschlüsselt rohe Bytes (Belege/Binärdaten) mit einem CryptoKey. */
export async function encryptBytesWithKey(key, bytes) {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { v: 1, iv: bytesToB64u(iv), ct: bytesToB64u(new Uint8Array(ct)) };
}

export async function decryptBytesWithKey(key, pkg) {
  const iv = b64uToBytes(pkg.iv);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, b64uToBytes(pkg.ct));
  return new Uint8Array(pt);
}

/** SHA-256-Hash als base64url-String (für Audit-Hash-Ketten in Phase 1). */
export async function sha256B64u(input) {
  const bytes = typeof input === 'string' ? textToBytes(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToB64u(new Uint8Array(digest));
}

export const CRYPTO_PARAMS = { PBKDF2_ITERATIONS, SALT_BYTES, IV_BYTES };
