// src/core/vault.js
// Tresor: Passwort → AES-Key, verschlüsselter Meta-Blob, Sitzungs-Key im RAM.
// Trägt die Identität (Mandant) der Instanz. Onboarding erzwingt Shamir-Backup.

import {
  deriveAesKey, exportRawAesKey, randomBytes, bytesToB64u, b64uToBytes,
  encryptWithKey, decryptWithKey,
} from './crypto.js';
import { kvGet, kvSet } from './db.js';
import { splitSecret, encodeShare } from './shamir.js';

const META_KEY = 'vaultMeta';     // { v, salt, check } — Salt + Verifikations-Chiffre
const SETTINGS_KEY = 'settings';  // verschlüsselte App-Settings (mode, theme, lang, …)
const CHECK_PLAINTEXT = 'BookLedgerPro:vault-ok';

let _sessionKey = null;   // CryptoKey (extractable) — nur im RAM
let _mandantId = null;    // öffentliche Kurz-ID der aktiven Identität

export function isUnlocked() { return _sessionKey !== null; }
export function getMandantId() { return _mandantId; }

/** Gibt es bereits einen eingerichteten Tresor in dieser Browser-Instanz? */
export async function vaultExists() {
  return Boolean(await kvGet(META_KEY));
}

function deriveMandantId(rawKey) {
  // Kurze, stabile Anzeige-ID aus dem Key-Material (kein Geheimnis-Leak: nur 6 Zeichen Hash-Präfix in Phase 5 ersetzt durch Ed25519-nodeId).
  return bytesToB64u(rawKey.slice(0, 6));
}

/**
 * Richtet einen neuen Tresor ein.
 * @returns {Promise<{shares: string[], mandantId: string}>} Shamir-Shares zum Sichern.
 */
export async function setupVault(password, { shares = 3, threshold = 2 } = {}) {
  if (await vaultExists()) throw new Error('Tresor existiert bereits');
  const salt = randomBytes(16);
  const key = await deriveAesKey(password, salt, /* extractable */ true);
  const check = await encryptWithKey(key, CHECK_PLAINTEXT);
  await kvSet(META_KEY, { v: 1, salt: bytesToB64u(salt), check });

  const rawKey = await exportRawAesKey(key);
  _mandantId = deriveMandantId(rawKey);
  _sessionKey = key;

  // Shamir-Backup des ROH-Schlüssels (schützt vor IndexedDB-Verlust).
  const parts = splitSecret(rawKey, shares, threshold);
  const encoded = parts.map((p) => encodeShare(p, threshold));
  return { shares: encoded, mandantId: _mandantId };
}

/** Entsperrt den Tresor mit dem Passwort. Wirft bei falschem Passwort. */
export async function unlockVault(password) {
  const meta = await kvGet(META_KEY);
  if (!meta) throw new Error('Kein Tresor vorhanden');
  const salt = b64uToBytes(meta.salt);
  const key = await deriveAesKey(password, salt, /* extractable */ true);
  // Verifikation
  let plain;
  try { plain = await decryptWithKey(key, meta.check); }
  catch { throw new Error('Falsches Passwort'); }
  if (plain !== CHECK_PLAINTEXT) throw new Error('Falsches Passwort');

  _sessionKey = key;
  const rawKey = await exportRawAesKey(key);
  _mandantId = deriveMandantId(rawKey);
  return { mandantId: _mandantId };
}

export function lockVault() { _sessionKey = null; _mandantId = null; }

/** Verschlüsselt & speichert die App-Settings. */
export async function saveSettings(settingsObj) {
  if (!_sessionKey) throw new Error('Tresor gesperrt');
  const pkg = await encryptWithKey(_sessionKey, JSON.stringify(settingsObj));
  await kvSet(SETTINGS_KEY, pkg);
}

/** Lädt & entschlüsselt die App-Settings (oder null, wenn keine vorhanden). */
export async function loadSettings() {
  if (!_sessionKey) throw new Error('Tresor gesperrt');
  const pkg = await kvGet(SETTINGS_KEY);
  if (!pkg) return null;
  return JSON.parse(await decryptWithKey(_sessionKey, pkg));
}

/** Gibt den Sitzungs-Key heraus (für Belegverschlüsselung in Phase 2). */
export function getSessionKey() { return _sessionKey; }
