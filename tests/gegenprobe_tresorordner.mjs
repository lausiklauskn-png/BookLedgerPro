// tests/gegenprobe_tresorordner.mjs — baut je einen Fehler in eine Wegwerf-Kopie und verlangt, dass
// tests/smoke_tresorordner.mjs dann an der erwarteten Zeile rot wird.   node tests/gegenprobe_tresorordner.mjs
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FAELLE = [
  ['Sicherung ohne Fingerabdruck-Filter', 'src/domain/tresorordner.js', 'if (!FLUECHTIG.includes(k)) kv[k] = v;', 'kv[k] = v;', 'unveränderter Bestand'],
  ['Sicherung ignoriert die Fälligkeit', 'native/blp-native.js', "if (!to.sicherungFaellig({", "if (false && !to.sicherungFaellig({", 'unveränderter Bestand'],
  ['Hintergrund löst keine Sicherung aus', 'native/blp-native.js', "if (document.visibilityState === 'hidden') sichern(false);", '', 'automatisch'],
  ['Übernehmen setzt keine Marke', 'src/ui/views/tresorordner.js', '  await b.markieren(fach, e.id);\n', '', 'Übernehmen: Datei gelesen'],
  ['Fremde App-Dateien bekommen „Übernehmen“', 'src/domain/tresorordner.js', "return !!(e && e.verschluesselung === 'fpt1');", 'return !!e;', 'fremdes Fach'],
  ['Ansicht auch ohne Brücke', 'src/ui/views/tresorordner.js', 'export function tresorordnerVerfuegbar() { return !!brueckeVon(); }', 'export function tresorordnerVerfuegbar() { return true; }', 'ohne Android-Brücke'],
  ['Wortsuche ohne Umlaut-Faltung', 'src/domain/tresorordner.js', 'if (!woerter.length || wortTreffer(text, woerter))', 'if (!woerter.length || text.toLowerCase().includes(woerter[0]))', 'Wortsuche über alle Fächer'],
  ['Einspielen tut nichts', 'src/ui/views/tresorordner.js', "const r = await importSnapshot(s, mitEinstellungen ? 'replace' : 'merge');", 'const r = { records: 0, files: 0 };', 'Einspielen (ergänzen)'],
  ['Bedeutungssuche nimmt jeden Eintrag', 'src/ui/views/tresorordner.js', 'return aus.filter((x) => x.naehe >= 0.8).slice(0, 12);', 'return aus.slice(0, 12);', 'Bedeutungssuche'],
  ['Belege ohne Doppel-Schutz', 'src/core/tresorBelege.js', "if (da.has(sha)) { schon++; continue; }", '', 'nur einmal'],
  ['Belege ohne Textauszug', 'src/core/tresorBelege.js', "try { text = (await getBelegText(b.id)) || ''; }", "try { text = ''; }", 'Beleg-Original einzeln'],
];
if (!existsSync(join(WURZEL, 'native/blp-native.js'))) { console.log('nur in der Pro-App mit Android-Hülle — übersprungen'); process.exit(0); }
let gefangen = 0, durch = 0;
for (const [titel, datei, alt, neu, zeile] of FAELLE) {
  if (process.env.NUR_FALL && !titel.includes(process.env.NUR_FALL)) continue;
  const tmp = mkdtempSync(join(tmpdir(), 'blp-gp-'));
  try {
    for (const d of ['src', 'native', 'assets', 'tests']) cpSync(join(WURZEL, d), join(tmp, d), { recursive: true });
    if (existsSync(join(WURZEL, 'node_modules'))) symlinkSync(join(WURZEL, 'node_modules'), join(tmp, 'node_modules'));
    const text = readFileSync(join(tmp, datei), 'utf8');
    if (!text.includes(alt)) { console.log('TOTER ANKER  ' + titel); durch++; continue; }
    writeFileSync(join(tmp, datei), text.replace(alt, neu));
    let aus = '';
    try { aus = execFileSync('node', [join(tmp, 'tests/smoke_tresorordner.mjs')], { encoding: 'utf8', timeout: 240000, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { aus = String(e.stdout || '') + String(e.stderr || ''); }
    const rot = aus.split('\n').filter((l) => /✗ ROT/.test(l));
    const absturz = /Timeout|stürzte ab|TimeoutError/.test(aus);
    if (rot.some((l) => l.includes(zeile)) || (absturz && !rot.length)) { console.log('gefangen     ' + titel + (absturz && !rot.some((l) => l.includes(zeile)) ? ' (Probe bricht ab)' : '')); gefangen++; }
    else { console.log('DURCHGERUTSCHT ' + titel + (rot.length ? '  (rot an: ' + rot[0].trim().slice(0, 80) + ')' : '')); durch++; }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht`);
process.exit(durch ? 1 : 0);
