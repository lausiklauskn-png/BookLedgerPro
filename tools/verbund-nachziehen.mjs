#!/usr/bin/env node
// tools/verbund-nachziehen.mjs — die Karte „Pro-App-Verbund“ (Klaus 2026-11-09: „Jetzt die Karte in die Apps einbauen“)
// wird nur HIER gepflegt (assets/pro-verbund.html) und byte-gleich in die anderen Pro-Apps kopiert.
//
//   node tools/verbund-nachziehen.mjs --ziel ../Workflow-PDF-Pro --pfad www/pro-verbund.html
//
// Schreibt die Datei an <ziel>/<pfad> und daneben <Verzeichnis>/pro-verbund.herkunft.json
// ({ quelle, datei, sha256, stand }). Nie von Hand in den Ziel-Repos ändern.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = 'assets/pro-verbund.html';
const STAND = '2026-11-09';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const ziel = arg('--ziel');
const pfad = arg('--pfad');
if (!ziel || !pfad) {
  console.error('Aufruf: node tools/verbund-nachziehen.mjs --ziel <Repo> --pfad <relativer Pfad, z. B. www/pro-verbund.html>');
  process.exit(2);
}
if (isAbsolute(pfad) || pfad.split(/[\\/]/).includes('..')) {
  console.error('--pfad muss relativ zum Ziel-Repo sein (ohne ..).');
  process.exit(2);
}
const zielWurzel = resolve(ziel);
if (!existsSync(zielWurzel)) { console.error('Ziel-Repo fehlt: ' + zielWurzel); process.exit(2); }

const bytes = readFileSync(join(WURZEL, QUELLE));
const sha256 = createHash('sha256').update(bytes).digest('hex');
const pin = JSON.parse(readFileSync(join(WURZEL, 'assets/pro-verbund.herkunft.json'), 'utf8'));
if (pin.sha256 !== sha256) {
  console.error(`Quelle passt nicht zum eigenen Pin (assets/pro-verbund.herkunft.json): ${sha256} ≠ ${pin.sha256}`);
  process.exit(1);
}

const zielDatei = join(zielWurzel, pfad);
if (relative(zielWurzel, zielDatei).startsWith('..')) { console.error('Pfad verlässt das Ziel-Repo.'); process.exit(2); }
mkdirSync(dirname(zielDatei), { recursive: true });
writeFileSync(zielDatei, bytes);
const herkunft = { quelle: 'lausiklauskn-png/BookLedgerPro', datei: QUELLE, sha256, stand: STAND };
const herkunftDatei = join(dirname(zielDatei), 'pro-verbund.herkunft.json');
writeFileSync(herkunftDatei, JSON.stringify(herkunft, null, 2) + '\n');

const kontrolle = createHash('sha256').update(readFileSync(zielDatei)).digest('hex');
if (kontrolle !== sha256) { console.error('Kopie weicht ab.'); process.exit(1); }
console.log(`kopiert: ${relative(process.cwd(), zielDatei)} (${bytes.length} B, SHA-256 ${sha256})`);
console.log(`Herkunft: ${relative(process.cwd(), herkunftDatei)}`);
