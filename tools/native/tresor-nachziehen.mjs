#!/usr/bin/env node
// Gemeinsames Paket de.familyprojekt.tresor (Tresorordner) aus Workflow PDF Pro byte-gleich übernehmen.
// Gepflegt wird es dort (Klaus 2026-10-27); hier NIE von Hand ändern.
//   node tools/native/tresor-nachziehen.mjs --quelle ../workflow-pdf-pro   kopieren + Herkunft pinnen
//   node tools/native/tresor-nachziehen.mjs                                 prüfen (Rückgabe 1 bei Abweichung)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const herkunftDatei = join(root, 'native/tresor-herkunft.json');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const PAKET = 'android/app/src/main/java/de/familyprojekt/tresor/';
const PROBE = 'android/app/src/test/java/de/familyprojekt/tresor/';

export function pruefen() {
  const fehler = [];
  if (!existsSync(herkunftDatei)) return ['native/tresor-herkunft.json fehlt'];
  const h = JSON.parse(readFileSync(herkunftDatei, 'utf8'));
  for (const [p, s] of Object.entries(h.dateien)) {
    if (!existsSync(join(root, p))) { fehler.push('fehlt: ' + p); continue; }
    if (sha(readFileSync(join(root, p))) !== s) fehler.push('von Hand geändert: ' + p);
  }
  for (const ordner of [PAKET, PROBE])
    if (existsSync(join(root, ordner))) for (const n of readdirSync(join(root, ordner))) if (!((ordner + n) in h.dateien)) fehler.push('nicht gepinnt: ' + ordner + n);
  const vc = readFileSync(join(root, PAKET, 'VaultCrypto.java'), 'utf8');
  if (sha(vc.slice(vc.indexOf('\n') + 1)) !== h.vaultCryptoRumpf) fehler.push('VaultCrypto-Rumpf weicht ab');
  return fehler;
}

const direkt = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const i = direkt ? process.argv.indexOf('--quelle') : -1;
if (i > 0) {
  const quelle = process.argv[i + 1];
  const pins = JSON.parse(readFileSync(join(quelle, 'tools/tresor/tresor-pins.json'), 'utf8'));
  const commit = execFileSync('git', ['-C', quelle, 'rev-parse', 'HEAD']).toString().trim();
  const sauber = execFileSync('git', ['-C', quelle, 'status', '--porcelain', '--', 'android/app/src/main/java/de/familyprojekt/tresor', 'android/app/src/test/java/de/familyprojekt/tresor', 'tools/tresor']).toString().trim() === '';
  if (!sauber) { console.error('Quelle hat ungesicherte Änderungen am Paket — erst dort committen.'); process.exit(1); }
  for (const ordner of [PAKET, PROBE]) rmSync(join(root, ordner), { recursive: true, force: true });
  for (const [p, s] of Object.entries(pins.dateien)) {
    const b = readFileSync(join(quelle, p));
    if (sha(b) !== s) { console.error('Quelle weicht von ihren Pins ab: ' + p); process.exit(1); }
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), b);
  }
  writeFileSync(herkunftDatei, JSON.stringify({
    quelle: 'lausiklauskn-png/Workflow-PDF-Pro', commit, ordnerFormat: pins.ordnerFormat,
    vaultCryptoRumpf: pins.vaultCryptoRumpf, dateien: pins.dateien,
  }, null, 2) + '\n');
  console.log(`übernommen: ${Object.keys(pins.dateien).length} Dateien aus ${commit.slice(0, 7)}`);
}
if (direkt) {
const f = pruefen();
if (f.length) { console.error('ROT:\n' + f.join('\n')); process.exit(1); }
console.log('Tresor-Paket byte-gleich mit der Herkunft (Workflow PDF Pro).');
}
