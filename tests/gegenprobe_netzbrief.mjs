// tests/gegenprobe_netzbrief.mjs — Gegenprobe zu smoke_netzbrief.mjs (Pro-Umbau 14 A2). Je Fall eine Wegwerf-Kopie (src/, sbkim/, tests/),
// eine Sabotage, dann die Probe: sie muss ROT werden. Erst ohne Sabotage (muss grün sein, Lehre § 29.3). NUR_ANKER=1 prüft nur die Anker.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FAELLE = [
  { name: 'Korpus liest wieder nur die ersten 1500 Zeichen', datei: 'src/domain/ueberall.js', alt: 'abschnitteWaehlen(zerlegen(roh),', neu: 'abschnitteWaehlen([roh.slice(0, 1500)],' },
  { name: 'kein Neubau bei Beleg-Änderung', datei: 'src/sbkim/netz.js', alt: "if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener(BELEGE_GEAENDERT, _beiAenderung);", neu: '' },
  { name: 'mehrere Zeilen je Beleg (keine Bündelung nach anchorId)', datei: 'src/domain/ueberall.js', alt: '      if (gesehen.has(a)) return false;\n', neu: '' },
  { name: 'Neubau tauscht die Belegtexte des Filters nicht', datei: 'src/sbkim/netz.js', alt: 'for (const [id, t] of (quelle.texte instanceof Map ? quelle.texte : Object.entries(quelle.texte))) _texteLive.set(id, t);', neu: '' },
  { name: 'documents.js meldet neue Belege nicht', datei: 'src/domain/documents.js', alt: 'window.dispatchEvent(new CustomEvent(BELEGE_GEAENDERT, { detail: { id } }))', neu: 'void 0' },
];
const lauf = (w) => spawnSync(process.execPath, [join(WURZEL, 'tests/smoke_netzbrief.mjs')], { env: { ...process.env, WURZEL: w }, encoding: 'utf8', timeout: 240000 });
let gefangen = 0, durch = 0, tot = 0;
const kopie = () => { const d = mkdtempSync(join(tmpdir(), 'gp-netzbrief-')); for (const t of ['src', 'sbkim', 'tests']) cpSync(join(WURZEL, t), join(d, t), { recursive: true }); return d; };
for (const f of FAELLE) { if (!readFileSync(join(WURZEL, f.datei), 'utf8').includes(f.alt)) { tot++; console.log('  ✗ toter Anker: ' + f.name); } }
if (process.env.NUR_ANKER) { console.log(`${tot} tote Anker`); process.exit(tot ? 1 : 0); }
{ const d = kopie(); const r = lauf(d); rmSync(d, { recursive: true, force: true });
  if (r.status !== 0) { console.log('ohne Sabotage NICHT grün — Gegenprobe sinnlos\n' + r.stdout); process.exit(1); } console.log('  ✓ ohne Sabotage grün'); }
for (const f of FAELLE) {
  const d = kopie(); const p = join(d, f.datei); const s = readFileSync(p, 'utf8');
  if (!s.includes(f.alt)) { rmSync(d, { recursive: true, force: true }); continue; }
  writeFileSync(p, s.replace(f.alt, f.neu));
  const r = lauf(d); rmSync(d, { recursive: true, force: true });
  const rotZeilen = (r.stdout || '').split('\n').filter((z) => z.includes('✗ ROT')).map((z) => z.trim().slice(0, 110));
  if (r.status === 1 && rotZeilen.length) { gefangen++; console.log('  ✓ gefangen: ' + f.name + '\n      ' + rotZeilen.join('\n      ')); }
  else { durch++; console.log('  ✗ durchgerutscht: ' + f.name + ' (Rückgabe ' + r.status + ')'); }
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht · ${tot} tote Anker`);
process.exitCode = durch || tot ? 1 : 0;
