// tools/messen-rechnungsnummer.mjs — misst `rechnungsnummer` aus extractFromText (src/ai/extract.js) an einem
// Belegordner mit ERWARTUNG.json (dateien[].{datei, rechnungsnummer}). Vergleich ohne Leerzeichen, Groß/Klein egal.
// richtig = gleich; falsch = eine Nummer, die nicht dem Soll entspricht (auch wenn das Soll leer ist); leer = keine Nummer,
// obwohl das Soll eine hat. Aufruf: node tools/messen-rechnungsnummer.mjs <ordner> [--fehler]
globalThis.__BLP_VORSCHAU = { auszugText: true, rechnungsnummer: true }; // Messung: Vorschau-Funktionen an (src/domain/vorschau.js)
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractFromText } from '../src/ai/extract.js';

const ordner = resolve(process.argv[2] || '.');
const soll = JSON.parse(readFileSync(join(ordner, 'ERWARTUNG.json'), 'utf8')).dateien;
const fest = (x) => String(x || '').replace(/\s/g, '').toUpperCase();
const z = { belege: 0, mitSoll: 0, richtig: 0, falsch: 0, leer: 0, ohneSollLeer: 0 };
const fehler = [];
for (const b of soll) {
  const p = join(ordner, b.datei);
  if (!existsSync(p) || !('rechnungsnummer' in b)) continue;
  z.belege++;
  const ist = extractFromText(readFileSync(p, 'utf8')).rechnungsnummer;
  if (b.rechnungsnummer) z.mitSoll++;
  if (ist && fest(ist) === fest(b.rechnungsnummer)) z.richtig++;
  else if (ist) { z.falsch++; fehler.push(`falsch: ${b.datei}: „${ist}“ statt „${b.rechnungsnummer || '—'}“`); }
  else if (b.rechnungsnummer) { z.leer++; fehler.push(`leer: ${b.datei}: Soll „${b.rechnungsnummer}“`); }
  else z.ohneSollLeer++;
}
console.log(JSON.stringify({ ordner, ...z }, null, 1));
if (process.argv.includes('--fehler')) console.log(fehler.join('\n'));
