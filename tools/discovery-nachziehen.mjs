#!/usr/bin/env node
// tools/discovery-nachziehen.mjs — die Seite „Discovery“ des Datei-Organizers („so wurde der Sortier-Kern trainiert“:
// 3D-Baum, Lern-Kreislauf, Stadtfilm, Kurzfilme, Tonspuren; Klaus 2026-11-15: „Da wo der Sortierkern drin ist, Discovery nachziehen“)
// byte-gleich mit Pin nach assets/discovery/ holen. Quelle: Datei-Organizer src/public/ — ALLES, was dort „discovery…“ heißt
// (Dateien und Ordner wie discovery-ton/, samt Inhalt); keine feste Liste, neue Filme und Bilder kommen von selbst mit.
// Nie von Hand ändern.
//   node tools/discovery-nachziehen.mjs --quelle ../Datei-Organizer      (nachziehen)
//   node tools/discovery-nachziehen.mjs --quelle ../Datei-Organizer --commit <Hash>   (diesen Quell-Commit pinnen; nur bei gleichen Bytes)
//   node tools/discovery-nachziehen.mjs --pruefen                         (nur Pins prüfen; Ausgabe 1 bei Abweichung)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'assets/discovery');
const QUELL_ORDNER = 'src/public';
const PRAEFIX = 'discovery';
/** Alle Dateien unter `ordner` (relativ, mit „/“, sortiert); in der obersten Ebene nur Einträge, für die `oben` gilt. */
function dateienUnter(ordner, oben = () => true, vor = '') {
  if (!existsSync(ordner)) return [];
  const aus = [];
  for (const n of readdirSync(ordner)) {
    if (!vor && !oben(n)) continue;
    if (statSync(join(ordner, n)).isDirectory()) aus.push(...dateienUnter(join(ordner, n), oben, vor + n + '/'));
    else aus.push(vor + n);
  }
  return aus.sort();
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
/** Alle Dateien unter assets/discovery/ außer dem Pin (relativ, sortiert). */
const vorhanden = () => dateienUnter(ZIEL, (n) => n !== 'HERKUNFT.json');

if (process.argv.includes('--pruefen')) {
  const pin = JSON.parse(readFileSync(join(ZIEL, 'HERKUNFT.json'), 'utf8'));
  const soll = Object.keys(pin.dateien).sort();
  const falsch = soll.filter((f) => !existsSync(join(ZIEL, f)) || sha(readFileSync(join(ZIEL, f))) !== pin.dateien[f]);
  const fremd = vorhanden().filter((f) => !soll.includes(f));
  const schlecht = [...falsch, ...fremd.map((f) => f + ' (nicht im Pin)')];
  console.log(schlecht.length ? 'Discovery weicht vom Pin ab: ' + schlecht.join(', ') : `Discovery passt zum Pin (${pin.commit.slice(0, 7)}, ${soll.length} Dateien)`);
  process.exit(schlecht.length ? 1 : 0);
}
const quelle = resolve(arg('--quelle') || '../Datei-Organizer');
const von = join(quelle, QUELL_ORDNER);
const liste = dateienUnter(von, (n) => n.startsWith(PRAEFIX));
if (!liste.includes('discovery.html')) { console.error('In ' + von + ' liegt keine discovery.html – nichts nachgezogen.'); process.exit(1); }
// Nur was im Quell-Repo eingecheckt ist, wird gepinnt (ein liegengebliebener Entwurf „discovery-…“ käme sonst mit).
const eingecheckt = new Set(execFileSync('git', ['-C', quelle, 'ls-files', '-z', '--', QUELL_ORDNER], { encoding: 'utf8' }).split('\0'));
const fremd = liste.filter((f) => !eingecheckt.has(QUELL_ORDNER + '/' + f));
if (fremd.length) { console.error('Nicht im Quell-Repo eingecheckt: ' + fremd.join(', ')); process.exit(1); }
// Nur ein sauberer Quellstand wird gepinnt: der Commit muss die kopierten Bytes wirklich beschreiben.
const schmutz = execFileSync('git', ['-C', quelle, 'status', '--porcelain', '--', ...liste.map((f) => QUELL_ORDNER + '/' + f)], { encoding: 'utf8' }).trim();
if (schmutz) { console.error('Quelle hat ungesicherte Änderungen an der Discovery:\n' + schmutz); process.exit(1); }
// Gepinnt wird ohne Angabe der letzte Commit, der die Discovery-Dateien berührt hat. Mit --commit <Hash> (z. B. der Stand von
// main, wenn der Klon auf einem Zweig darüber steht) gilt der genannte – aber nur, wenn die Dateien dort Byte für Byte dieselben sind.
const pfade = liste.map((f) => QUELL_ORDNER + '/' + f);
let commit = execFileSync('git', ['-C', quelle, 'log', '-1', '--format=%H', '--', ...pfade], { encoding: 'utf8' }).trim();
if (arg('--commit')) {
  const genannt = execFileSync('git', ['-C', quelle, 'rev-parse', '--verify', arg('--commit') + '^{commit}'], { encoding: 'utf8' }).trim();
  try { execFileSync('git', ['-C', quelle, 'diff', '--quiet', genannt, '--', ...pfade], { stdio: 'ignore' }); }
  catch { console.error(`Die Discovery-Dateien im Klon sind nicht die von ${genannt.slice(0, 7)} – nichts gepinnt.`); process.exit(1); }
  commit = genannt;
}
rmSync(ZIEL, { recursive: true, force: true });
mkdirSync(ZIEL, { recursive: true });
const dateien = {};
let bytes = 0;
for (const f of liste) { const b = readFileSync(join(von, f)); mkdirSync(dirname(join(ZIEL, f)), { recursive: true }); writeFileSync(join(ZIEL, f), b); dateien[f] = sha(b); bytes += b.length; }
writeFileSync(join(ZIEL, 'HERKUNFT.json'), JSON.stringify({ quelle: 'Datei-Organizer ' + QUELL_ORDNER + '/', werkzeug: 'tools/discovery-nachziehen.mjs', commit, dateien }, null, 1) + '\n');
console.log(`Discovery nachgezogen @ ${commit.slice(0, 7)}: ${liste.length} Dateien, ${(bytes / 1048576).toFixed(1)} MB`);
