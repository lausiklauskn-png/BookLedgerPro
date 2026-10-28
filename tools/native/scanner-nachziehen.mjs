#!/usr/bin/env node
// Scanner und Kamera unter Windows (Pro-Umbau 5): byte-gleich aus Workflow PDF Pro übernehmen (dort gepflegt, Klaus' Wahl).
// Welche Dateien dazugehören, sagt der Pin der Quelle (native/pro-scanner-herkunft.json → pfade). Hier NIE von Hand ändern.
//   node tools/native/scanner-nachziehen.mjs --quelle ../Workflow-PDF-Pro   kopieren + Herkunft pinnen
//   node tools/native/scanner-nachziehen.mjs                                prüfen (Rückgabe 1 bei Abweichung)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PIN = 'native/pro-scanner-herkunft.json';
const sha = (b) => createHash('sha256').update(b).digest('hex');
export function pruefen() {
  if (!existsSync(join(root, PIN))) return [PIN + ' fehlt'];
  const h = JSON.parse(readFileSync(join(root, PIN), 'utf8'));
  return h.pfade.filter((p) => !existsSync(join(root, p)) || sha(readFileSync(join(root, p))) !== h.dateien[p]).map((p) => 'weicht ab oder fehlt: ' + p);
}
const direkt = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const i = direkt ? process.argv.indexOf('--quelle') : -1;
if (i > 0) {
  const q = process.argv[i + 1], pin = JSON.parse(readFileSync(join(q, PIN), 'utf8'));
  if (execFileSync('git', ['-C', q, 'status', '--porcelain', '--', ...pin.pfade, PIN]).toString().trim()) { console.error('Quelle hat ungesicherte Änderungen — erst dort committen.'); process.exit(1); }
  for (const p of pin.pfade) {
    const b = readFileSync(join(q, p));
    if (sha(b) !== pin.dateien[p]) { console.error('Quelle weicht von ihrem Pin ab: ' + p); process.exit(1); }
    mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), b);
  }
  const commit = execFileSync('git', ['-C', q, 'rev-parse', 'HEAD']).toString().trim();
  writeFileSync(join(root, PIN), JSON.stringify({ ...pin, commit }, null, 2) + '\n');
  console.log(`übernommen: Scanner-Baustein (Fassung ${pin.fassung}, ${pin.pfade.length} Dateien) aus ${commit.slice(0, 7)}`);
}
if (direkt) { const f = pruefen(); if (f.length) { console.error('ROT:\n' + f.join('\n')); process.exit(1); } console.log('Scanner-Baustein byte-gleich mit der Herkunft (Workflow PDF Pro).'); }
