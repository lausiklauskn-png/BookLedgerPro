// tests/run.mjs — Node-Smoke-Test reiner Logik (kein Browser nötig).
// Prüft Krypto-Roundtrip und GF(256)-Shamir-Wiederherstellung.
// Lauf: `node tests/run.mjs` (Node >= 18; nutzt globalThis.crypto, btoa/atob).

import {
  encryptWithPassword, decryptWithPassword, bytesToB64u, b64uToBytes, randomBytes,
  deriveAesKey, exportRawAesKey,
} from '../src/core/crypto.js';
import { splitSecret, combineShares, encodeShare, decodeShare } from '../src/core/shamir.js';

let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}
async function section(name, fn) {
  console.log(`\n${name}`);
  try { await fn(); } catch (e) { failed++; console.error(`  ✗ ${name} warf:`, e); }
}

await section('base64url', () => {
  const b = randomBytes(40);
  const round = b64uToBytes(bytesToB64u(b));
  ok('roundtrip identisch', Buffer.compare(Buffer.from(b), Buffer.from(round)) === 0);
  ok('keine +/=/ Zeichen', !/[+/=]/.test(bytesToB64u(b)));
});

await section('Krypto: Passwort-Roundtrip', async () => {
  const pkg = await encryptWithPassword('hunter2-correct-horse', 'Buchung 1200 EUR auf 1000');
  const back = await decryptWithPassword('hunter2-correct-horse', pkg);
  ok('entschlüsselt korrekt', back === 'Buchung 1200 EUR auf 1000');
  let threw = false;
  try { await decryptWithPassword('falsch', pkg); } catch { threw = true; }
  ok('falsches Passwort wirft', threw);
});

await section('Krypto: Key-Export deterministisch', async () => {
  const salt = randomBytes(16);
  const k1 = await deriveAesKey('pw', salt, true);
  const k2 = await deriveAesKey('pw', salt, true);
  const r1 = await exportRawAesKey(k1);
  const r2 = await exportRawAesKey(k2);
  ok('gleicher Key bei gleichem Salt+PW', Buffer.compare(Buffer.from(r1), Buffer.from(r2)) === 0);
  ok('Key ist 32 Byte', r1.length === 32);
});

await section('Shamir GF(256): split/combine', () => {
  const secret = randomBytes(32);
  const shares = splitSecret(secret, 3, 2);
  ok('3 Shares erzeugt', shares.length === 3);

  // Jede 2er-Teilmenge stellt das Geheimnis wieder her.
  const pairs = [[0, 1], [0, 2], [1, 2]];
  let allGood = true;
  for (const [a, b] of pairs) {
    const rec = combineShares([shares[a], shares[b]]);
    if (Buffer.compare(Buffer.from(secret), Buffer.from(rec)) !== 0) allGood = false;
  }
  ok('jede 2-von-3-Kombination rekonstruiert', allGood);

  // Alle 3 zusammen ebenfalls.
  const rec3 = combineShares(shares);
  ok('3-von-3 rekonstruiert', Buffer.compare(Buffer.from(secret), Buffer.from(rec3)) === 0);
});

await section('Shamir: Share-Kodierung', () => {
  const secret = randomBytes(32);
  const shares = splitSecret(secret, 5, 3);
  const encoded = shares.map((s) => encodeShare(s, 3));
  ok('Format BLPR1-…', encoded.every((e) => e.startsWith('BLPR1-3-')));
  const decoded = encoded.slice(0, 3).map(decodeShare);
  const rec = combineShares(decoded.map((d) => ({ x: d.x, y: d.y })));
  ok('decode+combine rekonstruiert', Buffer.compare(Buffer.from(secret), Buffer.from(rec)) === 0);
});

console.log(`\n— ${passed} bestanden, ${failed} fehlgeschlagen —`);
process.exit(failed ? 1 : 0);
