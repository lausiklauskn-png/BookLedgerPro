#!/usr/bin/env node
// tools/wfpdf-nachziehen.mjs — den Scanner-Kern von Workflow PDF byte-1:1 nach BookLedgerPro holen (Klaus 2026-10-26:
// „der Scannerkern wird mit eingebaut"). Dieselbe Bauart wie in den WorkFlohs (Mein-WorkFloh scripts/wfpdf_kanon.mjs):
// scanner.js · scan-bild.js · blatt.js · zip.js und die Ausgabe-Bibliotheken (pdf-lib, fontkit, Noto Sans) liegen
// unter assets/wfpdf/, das Scanic-Modell unter vendor/scanic/ (die Texterkennung Tesseract liegt schon unter
// vendor/tesseract/, byte-gleich). Pins (SHA-256 je Datei, Commit) in assets/wfpdf/HERKUNFT.json; tests/run.mjs prüft.
// Nur in Workflow-PDF ändern, dann hier nachziehen — NIE von Hand.
//   node tools/wfpdf-nachziehen.mjs            # Klon unter ../workflow-pdf (sonst WFPDF_KLON=…)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// [Ziel in BLP, Quelle im Workflow-PDF-Klon]
export const DATEIEN = [
  ['assets/wfpdf/scanner.js', 'assets/scanner.js'],
  ['assets/wfpdf/scan-bild.js', 'assets/scan-bild.js'],
  ['assets/wfpdf/blatt.js', 'assets/blatt.js'],
  ['assets/wfpdf/zip.js', 'assets/zip.js'],
  ['assets/wfpdf/pdf-lib.min.js', 'vendor/pdf-lib.min.js'],
  ['assets/wfpdf/fontkit.umd.min.js', 'vendor/fontkit.umd.min.js'],
  ['assets/wfpdf/fontkit-LICENSE.txt', 'vendor/fontkit-LICENSE.txt'],
  ['assets/wfpdf/fonts/NotoSans-Regular.ttf', 'vendor/fonts/NotoSans-Regular.ttf'],
  ['assets/wfpdf/fonts/OFL.txt', 'vendor/fonts/OFL.txt'],
];
export const ORDNER = [['vendor/scanic', 'vendor/scanic']];   // ganzer Ordner (Modell, ONNX-Laufzeit, Lizenz)
const sha = (b) => createHash('sha256').update(b).digest('hex');

export function nachziehen(klon) {
  if (!existsSync(join(klon, 'assets', 'scanner.js'))) throw new Error('kein Workflow-PDF-Klon: ' + klon);
  let commit = ''; try { commit = execSync('git rev-parse HEAD', { cwd: klon, encoding: 'utf8' }).trim(); } catch { commit = ''; }
  const dateien = {};
  const kopiere = (ziel, quelle) => {
    const b = readFileSync(join(klon, quelle));
    mkdirSync(join(WURZEL, dirname(ziel)), { recursive: true });
    writeFileSync(join(WURZEL, ziel), b);
    dateien[ziel] = { quelle, sha256: sha(b) };
  };
  for (const [z, q] of DATEIEN) kopiere(z, q);
  for (const [z, q] of ORDNER) for (const n of readdirSync(join(klon, q)).sort()) if (statSync(join(klon, q, n)).isFile()) kopiere(z + '/' + n, q + '/' + n);
  return { repo: 'lausiklauskn-png/Workflow-PDF', commit, stand: new Date().toISOString().slice(0, 10), dateien,
    hinweis: 'Byte-1:1 aus Workflow-PDF (tools/wfpdf-nachziehen.mjs). Nie von Hand ändern. scanner.css ist BLP-eigen (nach Mein-WorkFloh assets/wfpdf/scanner.css).' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const klon = resolve(WURZEL, process.env.WFPDF_KLON || '../workflow-pdf');
  const h = nachziehen(klon);
  writeFileSync(join(WURZEL, 'assets', 'wfpdf', 'HERKUNFT.json'), JSON.stringify(h, null, 2) + '\n');
  console.log(`Workflow PDF ${h.commit.slice(0, 7)}: ${Object.keys(h.dateien).length} Dateien nachgezogen.`);
}
