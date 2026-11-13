#!/usr/bin/env node
// tools/sortierkern-nachziehen.mjs — Sortier-Kern des Datei-Organizers (als JavaScript übersetzt in dessen kern-js/, Werkzeug
// scripts/kern-js.mjs dort) byte-gleich mit Pin nach src/vendor/sortierkern/ holen. Nie von Hand ändern; keine zweite Fassung.
//   node tools/sortierkern-nachziehen.mjs --quelle ../Datei-Organizer      (nachziehen)
//   node tools/sortierkern-nachziehen.mjs --pruefen                         (nur Pins prüfen; Ausgabe 1 bei Abweichung)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'src/vendor/sortierkern');
const DATEIEN = ['erkennen.js', 'kategorien.js']; // was BookLedgerPro braucht (Aussteller); Abhängigkeiten eingeschlossen
const sha = (b) => createHash('sha256').update(b).digest('hex');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };

if (process.argv.includes('--pruefen')) {
  const pin = JSON.parse(readFileSync(join(ZIEL, 'HERKUNFT.json'), 'utf8'));
  const falsch = DATEIEN.filter((f) => !existsSync(join(ZIEL, f)) || sha(readFileSync(join(ZIEL, f))) !== pin.dateien[f]);
  console.log(falsch.length ? 'Sortier-Kern weicht vom Pin ab: ' + falsch.join(', ') : `Sortier-Kern passt zum Pin (${pin.commit.slice(0, 7)})`);
  process.exit(falsch.length ? 1 : 0);
}
const quelle = resolve(arg('--quelle') || '../Datei-Organizer');
const herkunft = JSON.parse(readFileSync(join(quelle, 'kern-js/HERKUNFT.json'), 'utf8'));
const commit = execFileSync('git', ['-C', quelle, 'log', '-1', '--format=%H', '--', 'kern-js'], { encoding: 'utf8' }).trim();
mkdirSync(ZIEL, { recursive: true });
const dateien = {};
for (const f of DATEIEN) {
  const b = readFileSync(join(quelle, 'kern-js', f));
  if (sha(b) !== herkunft.dateien[f]) { console.error(`${f} passt nicht zu kern-js/HERKUNFT.json der Quelle`); process.exit(1); }
  writeFileSync(join(ZIEL, f), b); dateien[f] = sha(b);
}
writeFileSync(join(ZIEL, 'HERKUNFT.json'), JSON.stringify({ quelle: 'Datei-Organizer kern-js/', werkzeug: 'tools/sortierkern-nachziehen.mjs', commit, dateien }, null, 1) + '\n');
console.log(`Sortier-Kern nachgezogen @ ${commit.slice(0, 7)}: ${DATEIEN.join(', ')}`);
