// Jede Zusicherung wird mit einem absichtlichen Fehler in einer Wegwerfkopie geprüft.
// Der Browser und die echte verschlüsselte IndexedDB bleiben dieselben wie in der Positivprobe.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cases = [
  ['Anfrage wird vor Transaktionsende bestätigt', 'src/core/db.js', 'request.onsuccess = () => { result = request.result; };', 'request.onsuccess = () => { result = request.result; resolve(result); };', 'Request-Erfolg'],
  ['Wiederholung bekommt eine zufällige Belegkennung', 'src/domain/proUebergabe.js', 'JSON.stringify([m.quelle, m.id])', 'JSON.stringify([m.quelle, m.id, crypto.randomUUID()])', 'Parallele Wiederholung'],
  ['Original-Prüfsumme wird nicht geprüft', 'src/domain/proUebergabe.js', 'if (await proHash(await file.arrayBuffer()) !== m.sha256)', 'if (false)', 'Veränderte Bytes'],
  ['Gleiche Kennung darf fremden Quellbezug annehmen', 'src/domain/documents.js', 'if (!vorhanden.proUebergabe || JSON.stringify(vorhanden.proUebergabe) !== JSON.stringify(uebergabe))', 'if (false)', 'Wiederholung erhält Buchungsverknüpfung'],
  ['Zielbestätigung wird ohne Empfängermarke angenommen', 'src/core/proVerbund.js', 'if (r?.bestaetigt !== true) return a;', 'void r;', 'Ausgang bleibt'],
  ['Abgebrochener Ausgang bekommt jedes Mal eine neue Kennung', 'src/core/proVerbund.js', "[z.kennung, dokumentId, ziel, file.name, file.type, sha256, bezug || '']", "[z.kennung, dokumentId, ziel, file.name, file.type, sha256, bezug || '', crypto.randomUUID()]", 'Ausgang bleibt'],
];
const run = dir => spawnSync(process.execPath, [join(root, 'tests/pro_uebergabe.mjs')], {
  env: { ...process.env, PRO_PROBE_ROOT: dir }, encoding: 'utf8', timeout: 120000,
});
let caught = 0;
for (const [name, file, before] of cases) {
  if (readFileSync(join(root, file), 'utf8').split(before).length !== 2) throw new Error('Kein eindeutiger Anker: ' + name);
}
const baseline = run(root);
if (baseline.status !== 0) throw new Error('Positivprobe nicht grün: ' + baseline.stdout + baseline.stderr);
console.log('PASS Positivprobe vor den Gegenproben');
for (const [name, file, before, after, expected] of cases) {
  const dir = mkdtempSync(join(tmpdir(), 'blp-pro-gegen-'));
  try {
    cpSync(join(root, 'src'), join(dir, 'src'), { recursive: true });
    const path = join(dir, file);
    writeFileSync(path, readFileSync(path, 'utf8').replace(before, after));
    const result = run(dir), output = result.stdout + result.stderr;
    if (result.status !== 1 || !output.includes('AssertionError') || !result.stderr.includes(expected)) throw new Error('Nicht passend erkannt: ' + name + '\n' + output);
    caught++; console.log('PASS Fehler erkannt: ' + name);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log(`${caught}/${cases.length} absichtliche Fehler erkannt`);
