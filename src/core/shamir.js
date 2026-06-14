// src/core/shamir.js
// Shamir's Secret Sharing über GF(256) (adaptiert aus Mein-Tresor-Key-Backup).
// Zweck: den rohen AES-Schlüssel in N Teile splitten, von denen K zur
// Wiederherstellung genügen. Schützt vor IndexedDB-Verlust (Browser-Lehre 2).

// ---- GF(256)-Arithmetik mit Log/Exp-Tabellen (Generator 0x03, AES-Polynom) --

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
  // Generator 0x03 über GF(2^8) mit Reduktionspolynom 0x11b (AES).
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    // x = x * 0x03 = (x*2) ^ x
    const hi = x & 0x80;
    let x2 = (x << 1) & 0xff;
    if (hi) x2 ^= 0x1b;
    x = x2 ^ x;
  }
  // Verdopplung der EXP-Tabelle erspart Modulo bei Indexsummen.
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function gfDiv(a, b) {
  if (b === 0) throw new Error('GF(256): Division durch 0');
  if (a === 0) return 0;
  return EXP[(LOG[a] - LOG[b] + 255) % 255];
}

// ---- Polynom-Auswertung + Lagrange-Interpolation ----------------------------

function evalPoly(coeffs, x) {
  // Horner-Schema in GF(256)
  let result = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    result = gfMul(result, x) ^ coeffs[i];
  }
  return result;
}

/**
 * Teilt ein Geheimnis (Uint8Array) in `shares` Teile, `threshold` davon nötig.
 * Rückgabe: Array von { x, y: Uint8Array } — x ist die Share-Nummer (1..N).
 */
export function splitSecret(secret, shares, threshold) {
  if (threshold < 2 || threshold > shares) throw new Error('Ungültige (k,n)-Parameter');
  if (shares > 255) throw new Error('Maximal 255 Shares');
  const result = [];
  for (let s = 1; s <= shares; s++) result.push({ x: s, y: new Uint8Array(secret.length) });

  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    const coeffs = new Uint8Array(threshold);
    coeffs[0] = secret[byteIdx];
    const rand = new Uint8Array(threshold - 1);
    crypto.getRandomValues(rand);
    for (let i = 1; i < threshold; i++) coeffs[i] = rand[i - 1];
    for (let s = 0; s < shares; s++) {
      result[s].y[byteIdx] = evalPoly(coeffs, result[s].x);
    }
  }
  return result;
}

/** Stellt das Geheimnis aus mindestens `threshold` Shares wieder her. */
export function combineShares(shareList) {
  if (shareList.length < 2) throw new Error('Mindestens 2 Shares nötig');
  const len = shareList[0].y.length;
  const secret = new Uint8Array(len);
  const xs = shareList.map((s) => s.x);

  for (let byteIdx = 0; byteIdx < len; byteIdx++) {
    let acc = 0;
    for (let i = 0; i < shareList.length; i++) {
      let num = 1, den = 1;
      for (let j = 0; j < shareList.length; j++) {
        if (i === j) continue;
        num = gfMul(num, xs[j]);
        den = gfMul(den, xs[i] ^ xs[j]);
      }
      const lagrange = gfDiv(num, den);
      acc ^= gfMul(shareList[i].y[byteIdx], lagrange);
    }
    secret[byteIdx] = acc;
  }
  return secret;
}

// ---- Share-Serialisierung (kompakt, copy-paste-freundlich) ------------------

import { bytesToB64u, b64uToBytes } from './crypto.js';

/** Kodiert eine Share als "BLPR1-<k>-<x>-<base64url(y)>". */
export function encodeShare(share, threshold) {
  return `BLPR1-${threshold}-${share.x}-${bytesToB64u(share.y)}`;
}

export function decodeShare(str) {
  const m = String(str).trim().match(/^BLPR1-(\d+)-(\d+)-(.+)$/);
  if (!m) throw new Error('Ungültiges Share-Format');
  return { threshold: parseInt(m[1], 10), x: parseInt(m[2], 10), y: b64uToBytes(m[3]) };
}
