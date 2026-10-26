// src/core/vault.js
// Tresor mit Envelope-Verschlüsselung:
//   • DEK (Data Encryption Key): zufälliger AES-GCM-256-Key, verschlüsselt ALLE Daten.
//     Er ist die stabile Identität (Mandant-ID) und wird per Shamir gesichert.
//   • KEK (Key Encryption Key): aus dem Passwort abgeleitet (PBKDF2), „wickelt" nur den DEK.
// Vorteil: Passwortwechsel = DEK neu einwickeln (kein Daten-Re-Encrypt, Identität bleibt).
//
// Abwärtskompatibel: Alt-Tresore (v1, Passwort-Key == Daten-Key) werden beim Entsperren
// TRANSPARENT migriert — der vorhandene Passwort-Key wird zum DEK erklärt und nur neu
// eingewickelt; es werden KEINE Daten neu verschlüsselt (Mandant-ID & Shamir bleiben gleich).

import {
  deriveAesKey, exportRawAesKey, importRawAesKey, randomBytes, bytesToB64u, b64uToBytes,
  encryptWithKey, decryptWithKey, encryptBytesWithKey, decryptBytesWithKey,
} from './crypto.js';
import { kvGet, kvSet } from './db.js';
import { splitSecret, encodeShare } from './shamir.js';

const META_KEY = 'vaultMeta';     // v2: { v, salt, wrappedDek, check }
const SETTINGS_KEY = 'settings';
const CHECK_PLAINTEXT = 'BookLedgerPro:vault-ok';

let _sessionKey = null;   // DEK als CryptoKey (extractable) — nur im RAM
let _mandantId = null;

export function isUnlocked() { return _sessionKey !== null; }
export function getMandantId() { return _mandantId; }

export async function vaultExists() {
  return Boolean(await kvGet(META_KEY));
}

function deriveMandantId(rawDek) {
  return bytesToB64u(rawDek.slice(0, 6));
}

/** Baut ein v2-Meta: wickelt den DEK mit einem aus `password` abgeleiteten KEK ein. */
async function buildMeta(rawDek, password) {
  const salt = randomBytes(16);
  const kek = await deriveAesKey(password, salt, /* extractable */ false);
  const wrappedDek = await encryptBytesWithKey(kek, rawDek);
  const dek = await importRawAesKey(rawDek, /* extractable */ true);
  const check = await encryptWithKey(dek, CHECK_PLAINTEXT);
  return { v: 2, salt: bytesToB64u(salt), wrappedDek, check };
}

/** Aktiviert den DEK als Sitzungs-Key + setzt die Mandant-ID. */
async function activate(rawDek) {
  _sessionKey = await importRawAesKey(rawDek, /* extractable */ true);
  _mandantId = deriveMandantId(rawDek);
}

/**
 * Richtet einen neuen Tresor ein (Envelope). Der DEK ist zufällig.
 * @returns {Promise<{shares: string[], mandantId: string}>} Shamir-Shares des DEK.
 */
export async function setupVault(password, { shares = 3, threshold = 2 } = {}) {
  if (await vaultExists()) throw new Error('Tresor existiert bereits');
  const rawDek = randomBytes(32);
  await kvSet(META_KEY, await buildMeta(rawDek, password));
  await activate(rawDek);
  const parts = splitSecret(rawDek, shares, threshold);
  const encoded = parts.map((p) => encodeShare(p, threshold));
  return { shares: encoded, mandantId: _mandantId };
}

/** Entsperrt den Tresor. Migriert v1→v2 transparent (ohne Daten-Re-Encrypt). */
export async function unlockVault(password) {
  const meta = await kvGet(META_KEY);
  if (!meta) throw new Error('Kein Tresor vorhanden');

  if (meta.v === 2) {
    const kek = await deriveAesKey(password, b64uToBytes(meta.salt), false);
    let rawDek;
    try { rawDek = await decryptBytesWithKey(kek, meta.wrappedDek); }
    catch { throw new Error('Falsches Passwort'); }
    await activate(rawDek);
    // Integritäts-Check
    let plain; try { plain = await decryptWithKey(_sessionKey, meta.check); } catch { plain = null; }
    if (plain !== CHECK_PLAINTEXT) { lockVault(); throw new Error('Falsches Passwort'); }
    return { mandantId: _mandantId };
  }

  // --- v1 (Alt-Tresor): Passwort-Key == Daten-Key. Verifizieren, dann migrieren. ---
  const key = await deriveAesKey(password, b64uToBytes(meta.salt), /* extractable */ true);
  let plain;
  try { plain = await decryptWithKey(key, meta.check); }
  catch { throw new Error('Falsches Passwort'); }
  if (plain !== CHECK_PLAINTEXT) throw new Error('Falsches Passwort');

  // Der vorhandene Daten-Key wird zum DEK (Daten bleiben unberührt), neu eingewickelt.
  const rawDek = await exportRawAesKey(key);
  await kvSet(META_KEY, await buildMeta(rawDek, password));
  await activate(rawDek);
  return { mandantId: _mandantId };
}

/**
 * Ändert das Passwort: prüft das alte, wickelt denselben DEK mit dem neuen Passwort
 * neu ein. KEINE Daten-Neuverschlüsselung; Mandant-ID & Shamir-Shares bleiben gültig.
 */
export async function changePassword(oldPassword, newPassword) {
  if (!_sessionKey) throw new Error('Tresor gesperrt');
  if (!newPassword || newPassword.length < 8) throw new Error('Neues Passwort: mindestens 8 Zeichen.');
  const meta = await kvGet(META_KEY);
  if (!meta) throw new Error('Kein Tresor vorhanden');

  // Altes Passwort verifizieren und den DEK gewinnen.
  let rawDek;
  if (meta.v === 2) {
    const oldKek = await deriveAesKey(oldPassword, b64uToBytes(meta.salt), false);
    try { rawDek = await decryptBytesWithKey(oldKek, meta.wrappedDek); }
    catch { throw new Error('Aktuelles Passwort ist falsch.'); }
  } else {
    const oldKey = await deriveAesKey(oldPassword, b64uToBytes(meta.salt), true);
    let plain; try { plain = await decryptWithKey(oldKey, meta.check); } catch { plain = null; }
    if (plain !== CHECK_PLAINTEXT) throw new Error('Aktuelles Passwort ist falsch.');
    rawDek = await exportRawAesKey(oldKey);
  }

  await kvSet(META_KEY, await buildMeta(rawDek, newPassword));
  await activate(rawDek); // DEK unverändert; Session bleibt gültig
  return { mandantId: _mandantId };
}

export function lockVault() { _sessionKey = null; _mandantId = null; }

export async function saveSettings(settingsObj) {
  if (!_sessionKey) throw new Error('Tresor gesperrt');
  const pkg = await encryptWithKey(_sessionKey, JSON.stringify(settingsObj));
  await kvSet(SETTINGS_KEY, pkg);
}

export async function loadSettings() {
  if (!_sessionKey) throw new Error('Tresor gesperrt');
  const pkg = await kvGet(SETTINGS_KEY);
  if (!pkg) return null;
  return JSON.parse(await decryptWithKey(_sessionKey, pkg));
}

export function getSessionKey() { return _sessionKey; }
