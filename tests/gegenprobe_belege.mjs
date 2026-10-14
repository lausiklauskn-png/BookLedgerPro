// tests/gegenprobe_belege.mjs — jeder eingebaute Fehler muss seine EIGENE rote Zeile werfen.
//
//   node tests/gegenprobe_belege.mjs              # alle Fälle (Wegwerf-Kopie unter /tmp)
//   NUR_ANKER=1 node tests/gegenprobe_belege.mjs  # nur: trifft jeder Anker genau einmal? (Sekunden)
//   NUR_FALL="TEXT:" node tests/gegenprobe_belege.mjs
//
// Ausgänge je Fall: gefangen · DURCHGERUTSCHT (blinder Wächter) · STOLPERT (die Probe stürzte ab
// oder die erste rote Zeile trägt einen fremden Namen) · TOTER ANKER (der Eingriff ändert nichts).
// ⚠ Gearbeitet wird NIE im echten Baum. ⚠ Während des Laufs die Datei hier nicht anfassen.

import { cp, readFile, writeFile, rm, mkdtemp, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Die Kopie liegt unter /tmp — der Workflow-PDF-Klon daneben fehlt dort. Ohne ihn wäre der Weg
// „Blatt sicher erkannt" ungemessen und seine Fälle blind.
if (!process.env.WFPDF_KLON && existsSync(resolve(WURZEL, '../Workflow-PDF/assets/scanner.js'))) process.env.WFPDF_KLON = resolve(WURZEL, '../Workflow-PDF');

// [Name, Datei, Anker, Ersatz, Probe ('smoke'|'run'), erwartete erste rote Zeile]
const FAELLE = [
  ['SCAN: das Foto wird nicht zum Scan-PDF', 'src/ui/views/documents.js',
    "  if (/^image\\//.test(art)) {\n    try {\n      const sc = await fotoZuScan(file);",
    "  if (false) {\n    try {\n      const sc = await fotoZuScan(file);",
    'smoke', 'das Foto liegt als Scan-PDF'],
  ['SCAN: das Originalfoto wird nicht aufbewahrt', 'src/ui/views/documents.js',
    "await saveBeleg(pdf, { original: file, originalTyp: art, scan: sc });",
    "await saveBeleg(pdf, { scan: sc });",
    'smoke', 'das Originalfoto liegt verschlüsselt dabei'],
  ['SCAN: wieder 200 dpi', 'src/core/scanPdf.js',
    'export const SCAN_DPI = 300;', 'export const SCAN_DPI = 200;',
    'run', 'Scan: 300 dpi, JPEG 92 %'],
  ['SCAN: unsicher wird trotzdem geschnitten', 'src/core/scanPdf.js',
    '      if (sicher) {\n        const SB = window.WFP.ScanBild;', '      if (true) {\n        const SB = window.WFP.ScanBild;',
    'smoke', 'der Scan hat 300 dpi auf A4'],
  ['SCAN: sicher erkannt wird NICHT gerade gezogen', 'src/core/scanPdf.js',
    '      if (sicher) {\n        const SB = window.WFP.ScanBild;', '      if (false) {\n        const SB = window.WFP.ScanBild;',
    'smoke', 'gerade gezogen auf A4 hoch'],
  ['SCAN: die Prüfung nimmt den Scan statt des Originalfotos', 'src/domain/belegPruefung.js',
    'ausFoto ? rec.originalDaten : rec.data', 'rec.data',
    'run', 'die Prüfung nimmt bei einem Scan das Originalfoto'],
  ['PLATZ: es wird nie gefragt', 'src/ui/views/documents.js',
    'if (plan.passt === false || gross.length) {', 'if (false) {',
    'smoke', 'es wird gefragt, mit Zahl, Größe und freiem Platz'],
  ['PLATZ: der freie Platz wird ignoriert', 'src/domain/importPlatz.js',
    'passt: frei == null ? null : bedarf <= frei', 'passt: frei == null ? null : true',
    'run', 'Plan: passt nicht, wenn der Bedarf über dem freien Platz liegt'],
  ['REINIGUNG: das ORIGINAL geht an die OCR', 'src/ui/views/documents.js',
    'r = await belegFuersKi(bytes, b.mediaType, {',
    "r = { bilder: ['data:' + b.mediaType + ';base64,' + bytesToBase64(bytes)], liste: [], seiten: 1, gesamt: 1 }; if (0) await belegFuersKi(bytes, b.mediaType, {",
    'smoke', 'Halt: versteckter Text gefunden'],
  ['REINIGUNG: versteckter Text wird nicht gemeldet', 'src/ai/kiVorbereitung.js',
    'if (g) { liste.push({ seite: i, text: t.str, grund: g }); RE.zudecken(img, st, vp.scale); zu++; }',
    'if (g) { RE.zudecken(img, st, vp.scale); zu++; }',
    'smoke', 'Halt: versteckter Text gefunden'],
  ['REINIGUNG: blasser Text wird nicht zugedeckt', 'src/ai/kiVorbereitung.js',
    'if (g) { liste.push({ seite: i, text: t.str, grund: g }); RE.zudecken(img, st, vp.scale); zu++; }',
    'if (g) { liste.push({ seite: i, text: t.str, grund: g }); zu++; }',
    'smoke', 'der blasse Text ist im gesendeten Bild zugedeckt'],
  ['REINIGUNG: das Foto geht mit Metadaten', 'src/ai/kiVorbereitung.js',
    '    const eins = jpegEinsZuEins(RE, bytes);\n    if (eins) return eins;',
    "    let bb = ''; for (const z of bytes) bb += String.fromCharCode(z); return { bilder: ['data:image/jpeg;base64,' + btoa(bb)], liste: [], seiten: 1, gesamt: 1 };",
    'smoke', '… OHNE den Ort aus den Metadaten'],
  ['QUALITÄT: PDF wieder mit 1400 px', 'src/ai/kiVorbereitung.js',
    'scale: Math.min(KI_PDF_DPI / 72, KI_PDF_MAX_KANTE / Math.max(v1.width, v1.height))',
    'scale: 1400 / v1.width',
    'smoke', 'die Seitenbilder haben 300 dpi'],
  ['QUALITÄT: das Foto wird neu gezeichnet statt 1:1', 'src/ai/kiVorbereitung.js',
    '    if (eins) return eins;', '    if (false) return eins;',
    'smoke', 'Bilddaten Byte für Byte wie im Original'],
  ['QUALITÄT: Angehängtes hinter dem Bildende geht mit', 'src/ai/kiVorbereitung.js',
    '    b = b.subarray(0, ende);\n', '',
    'smoke', 'OHNE das Angehängte hinter dem Bildende'],
  ['RICHTER: ohne Prüfliste läuft der Richter doch', 'src/sbkim/match.js',
    "if (!liste || typeof liste.pruefeMail !== 'function') {", 'if (false) {',
    'run', 'ohne Prüfliste: Richter aus, nichts an Mistral'],
  ['RICHTER: der fremde Kandidat geht an Mistral', 'src/sbkim/match.js',
    '    if (f.length) {\n      ausgeschlossen.push({', '    if (false) {\n      ausgeschlossen.push({',
    'run', 'der fremde Kandidat mit Anweisung steht NICHT im Text an Mistral'],
  ['RICHTER: die Anfrage wird nicht geprüft', 'src/sbkim/match.js',
    "if (sperrFunde(liste, qText).length || (queryLabel && sperrFunde(liste, queryLabel).length)) {", 'if (false) {',
    'run', 'Anweisung in der Anfrage: Richter aus, nichts an Mistral'],
  ['HALT: Abbrechen beim versteckten Text sendet trotzdem', 'src/ui/views/documents.js',
    "if (versteckt.length && !(await kiReinigungHalt(b.name, versteckt))) { alert(t('beleg.abgebrochen')); return; }",
    "if (versteckt.length && !(await kiReinigungHalt(b.name, versteckt)) && false) { alert(t('beleg.abgebrochen')); return; }",
    'smoke', 'Abbrechen beim versteckten Text: nichts an die OCR'],
  ['HALT: ein auffälliger Beleg hält nicht an', 'src/ui/views/documents.js',
    'if (p && p.stand === PRUEF_STAND.WARNUNG) {',
    'if (false) {',
    'smoke', 'Halt: der Beleg ist auffällig'],
  ['HALT: ein ungeprüfter Beleg fragt nicht', 'src/ui/views/documents.js',
    'if (stand === PRUEF_STAND.OFFEN) {',
    'if (false) {',
    'smoke', 'Halt: „noch nicht geprüft"'],
  ['VERMERK: was nicht mitging, wird nicht vermerkt', 'src/ui/views/documents.js',
    "await vermerkeKiEntfernt(b.id, r.liste, 'Texterkennung');",
    '',
    'smoke', 'Vermerk am Beleg: was nicht mitging'],
  ['TEXT: der OCR-Text hält nie an', 'src/ui/views/documents.js',
    'if (!zeilen.length) return { kiText: text, nurLokal: false };',
    'return { kiText: text, nurLokal: false };',
    'smoke', 'Halt: Anweisung an eine KI im erkannten Text'],
  ['TEXT: „Ohne diese Zeilen" lässt sie drin', 'src/domain/kiReinigung.js',
    'if (wahl === TEXT_WAHL.TROTZDEM) return',
    'if (wahl !== TEXT_WAHL.LOKAL) return',
    'smoke', '… OHNE die Anweisung'],
  ['TEXT: „Nur auf dem Gerät" geht trotzdem an Mistral', 'src/ai/mistral.js',
    'if (useMistral && !opts.nurLokal) {',
    'if (useMistral) {',
    'smoke', '„Nur auf dem Gerät": nichts an Mistral'],
  ['FREMDTEXT: E-Rechnung geht ungeprüft an die Kontierung', 'src/ui/views/documents.js',
    "const frei = await kiTextFreigabe(p.lieferant || '');",
    "const frei = { kiText: p.lieferant || '', nurLokal: false };",
    'smoke', 'Halt: Anweisung im Lieferantennamen der E-Rechnung'],
  ['FREMDTEXT: Verwendungszweck geht ungeprüft an die Kontierung', 'src/ui/views/documents.js',
    "const frei = await kiTextFreigabe(u.zweck || u.gegen || '');",
    "const frei = { kiText: u.zweck || u.gegen || '', nurLokal: false };",
    'smoke', 'Halt: Anweisung im Verwendungszweck'],
  ['ANZEIGE: kein Drehkreis an der Zeile', 'src/ui/views/documents.js',
    "role: 'status' }, [drehkreis(), t('beleg.laeuft')]);",
    "role: 'status' }, [t('beleg.laeuft')]);",
    'smoke', 'Drehkreis an der Zeile'],
  ['ANZEIGE: kein Fortschrittsbalken', 'src/ui/views/documents.js',
    "el('progress', { max: String(_pruefStapel.n), value: String(_pruefStapel.i - 1), 'data-pruef-balken': '' }),",
    '',
    'smoke', 'Balken mit Fortschritt'],
  ['ANZEIGE: die Arbeitsleiste nennt die Seiten nicht', 'src/ui/views/documents.js',
    "onSeite: (i, n) => arbeit.setzen(",
    "onSeiteAus: (i, n) => arbeit.setzen(",
    'smoke', 'Arbeitsleiste: Seiten werden gezeichnet'],
  ['IMPORT: beim Einlesen wird geprüft', 'src/ui/views/documents.js',
    'const r = await belegAblegen(nehmen[i].file, nehmen[i].typ); n++;',
    'const r = await belegAblegen(nehmen[i].file, nehmen[i].typ); n++; for (const bb of await listBelege()) if (!bb.pruefung) await pruefeBeleg(bb.id);',
    'smoke', 'beim Einlesen wird NICHT geprüft'],
  ['IMPORT: Übersprungenes verschwindet still', 'src/domain/kiReinigung.js',
    "if (!typ) { ueberspringen.push({ pfad, grund: 'art' }); continue; }",
    'if (!typ) { continue; }',
    'smoke', 'notiz.txt und .DS_Store werden beim Namen genannt'],
  ['IMPORT: nur die erste Datei eines Ordners', 'src/core/files.js',
    'input.onchange = () => resolve(input.files ? Array.from(input.files) : []);',
    'input.onchange = () => resolve(input.files && input.files[0] ? [input.files[0]] : []);',
    'smoke', 'Ordner: drei Belege abgelegt'],
  ['BERICHT: unverschlüsselt am Beleg', 'src/domain/belegPruefung.js',
    'neu.pruefDaten = await encryptWithKey(key(), JSON.stringify(p));',
    'neu.pruefDaten = p;',
    'smoke', 'der Prüfbericht liegt VERSCHLÜSSELT am Beleg'],
  ['BERICHT: der Fund fehlt im Bericht', 'src/ui/belegDialoge.js',
    "teile.push(el('ul', { class: 'hinweis-liste', 'data-pruef-funde': '' }",
    "teile.push(el('ul', { class: 'hinweis-liste' }",
    'smoke', 'Prüfbericht nennt „Unsichtbarer Text im PDF"'],
  ['KANON: Prüfliste abgewandelt', 'assets/pruefer-mail.js',
    '_meta: { herkunft: "PWA Toolpoint 2026-09-09", fassung: "1", zwilling: false }',
    '_meta: { herkunft: "PWA Toolpoint 2026-09-09", fassung: "1b", zwilling: false }',
    'run', 'assets/pruefer-mail.js unverändert'],
  ['KANON: pdf.js mit eval', 'src/ai/kiVorbereitung.js',
    'isEvalSupported: false',
    'isEvalSupported: true',
    'run', 'pdf.js läuft ohne eval'],
];

const nurAnker = process.env.NUR_ANKER === '1';
const nurFall = process.env.NUR_FALL || '';
const faelle = FAELLE.filter((f) => !nurFall || f[0].startsWith(nurFall) || f[0].includes(nurFall));
const zaehle = (s, a) => s.split(a).length - 1;

let tot = 0;
for (const [name, datei, anker] of faelle) {
  const n = zaehle(await readFile(join(WURZEL, datei), 'utf8'), anker);
  if (n !== 1) { tot++; console.log(`TOTER ANKER (${n}×): ${name} — ${datei}`); }
}
if (nurAnker) { console.log(`\n${faelle.length - tot} leben · ${tot} tot`); process.exit(tot ? 1 : 0); }

const PROBE = { smoke: 'tests/smoke_belege.mjs', run: 'tests/run.mjs' };
let gefangen = 0, durch = 0, stolpert = 0;
for (const [name, datei, anker, ersatz, probe, erwartet] of faelle) {
  const kopie = await mkdtemp(join(tmpdir(), 'blp-gp-'));
  await cp(WURZEL, kopie, { recursive: true, filter: (q) => !/[\\/](\.git|node_modules)([\\/]|$)/.test(q.slice(WURZEL.length)) });
  if (existsSync(join(WURZEL, 'node_modules'))) await symlink(join(WURZEL, 'node_modules'), join(kopie, 'node_modules'));
  const ziel = join(kopie, datei);
  const alt = await readFile(ziel, 'utf8');
  if (zaehle(alt, anker) !== 1) { tot++; console.log(`TOTER ANKER: ${name}`); await rm(kopie, { recursive: true, force: true }); continue; }
  const neu = alt.replace(anker, ersatz);
  if (neu === alt) { tot++; console.log(`TOTER ANKER (ändert nichts): ${name}`); await rm(kopie, { recursive: true, force: true }); continue; }
  await writeFile(ziel, neu);
  const r = spawnSync(process.execPath, [PROBE[probe]], { cwd: kopie, encoding: 'utf8', timeout: 900000 });
  const aus = (r.stdout || '') + (r.stderr || '');
  const ersteRot = (aus.split('\n').find((z) => /✗/.test(z)) || '').trim();
  if (r.status === 0) { durch++; console.log(`DURCHGERUTSCHT: ${name}`); }
  else if (r.status === 1 && ersteRot.includes(erwartet)) { gefangen++; console.log(`gefangen: ${name}\n    ${ersteRot}`); }
  else { stolpert++; console.log(`STOLPERT: ${name} (Rückgabe ${r.status})\n    erwartet: ${erwartet}\n    erste rote Zeile: ${ersteRot || '—'}`); }
  await rm(kopie, { recursive: true, force: true });
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht · ${stolpert} gestolpert · ${tot} tote Anker`);
process.exit(durch || stolpert || tot ? 1 : 0);
