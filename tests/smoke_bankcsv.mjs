// tests/smoke_bankcsv.mjs — Kontoauszug als CSV/Excel und die Monatsdatei des Portemonnaies (Klaus 2026-11-18: jedes Konto frei,
// Verfahren wählbar; Übergabe einmal im Monat). Echter Browser, echter Tresor, echte Belege-Seite, Dateiwahl gestellt.
// Alle Dateien erfunden. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(process.env.BH_WURZEL || join(dirname(fileURLToPath(import.meta.url)), '..'));
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings } from './src/state.js';
import { mountDocuments } from './src/ui/views/documents.js';
import { listBuchungen } from './src/domain/store.js';
import { baueMonatsdatei } from './src/domain/portemonnaieImport.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
window.__p = { getSettings, listBuchungen, baueMonatsdatei, neu: () => mountDocuments(document.getElementById('app')) };
await mountDocuments(document.getElementById('app'));
window.__bereit = true;
</script></body></html>`;

// Windows-1252 wie bei vielen Banken: „Bäckerei“ mit 0xE4.
const CSV1 = Buffer.from('"Buchungstag";"Wertstellung";"Buchungstext";"Auftraggeber / Begünstigter";"Verwendungszweck";"Betrag (EUR)"\r\n'
  + '"05.11.2026";"05.11.2026";"Kartenzahlung";"Bäckerei Beispiel";"Brötchen";"-4,20"\r\n'
  + '"04.11.2026";"04.11.2026";"Gutschrift";"Muster GmbH";"Erstattung";"12,00"\r\n', 'latin1');
const CSV2 = Buffer.from('"Kontonummer:";"DE00 0000 0000 0000 0000 01"\r\n\r\n"Buchungstag";"Wertstellung";"Buchungstext";"Auftraggeber / Begünstigter";"Verwendungszweck";"Betrag (EUR)"\r\n'
  + '"06.12.2026";"06.12.2026";"Kartenzahlung";"Markt Beispiel";"Obst";"-7,50"\r\n', 'utf8');

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  const datei = join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(datei); res.writeHead(200, { 'content-type': TYP[extname(datei)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASIS = `http://127.0.0.1:${server.address().port}`;
let browser;
try { browser = await pw.chromium.launch(CHROMIUM ? { executablePath: CHROMIUM, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }

const fehler = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true);
  const einlesen = async (name, mime, buffer) => {
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-werkzeug="bank"]')]);
    await fc.setFiles({ name, mimeType: mime, buffer });
  };
  const zu = async () => { if (await page.$('[data-werkzeug-fenster="bank"]')) await page.click('[data-werkzeug="bank"]'); };

  console.log('— A. CSV (Windows-1252) zum ersten Mal: Zuordnung offen, Umsätze da —');
  await einlesen('auszug-nov.csv', 'text/csv', CSV1);
  await page.waitForSelector('.bank-row');
  ok('Zuordnung steht offen zum Prüfen', await page.evaluate(() => document.querySelector('[data-bank-zuordnung-karte]').open === true));
  ok('Datum = Buchungstag, Betrag = „Betrag (EUR)“', await page.evaluate(() => document.querySelector('[data-bank-zuordnung="datum"]').value === '0' && document.querySelector('[data-bank-zuordnung="betrag"]').value === '5'));
  const zeilen = await page.$$eval('.bank-row .mono', (xs) => xs.map((x) => x.textContent));
  ok('zwei Umsätze, Umlaut aus Windows-1252 lesbar, Vorzeichen', zeilen.length === 2 && /−4,20/.test(zeilen[0]) && /Bäckerei Beispiel/.test(zeilen[0]) && /\+12,00/.test(zeilen[1]), zeilen.join(' | '));
  await page.selectOption('[data-bank-zuordnung="gegen"]', '-1');
  await page.waitForFunction(() => /Brötchen/.test(document.querySelector('.bank-row .mono')?.textContent || ''));
  ok('Zuordnung von Hand geändert (Gegenseite weg) → Text statt Name', true);
  await page.click('[data-bank-merken]');
  await page.waitForFunction(() => (window.__p.getSettings().bankZuordnungen || []).length === 1);
  ok('Zuordnung am Gerät gemerkt (verschlüsselte Einstellungen)', true);

  console.log('— B. Nächste Datei derselben Bank: ohne Fragen —');
  await zu();
  await einlesen('auszug-dez.csv', 'text/csv', CSV2);
  await page.waitForSelector('.bank-row');
  ok('Zuordnung zu (gemerkt), Kopfzeile tiefer gefunden', await page.evaluate(() => document.querySelector('[data-bank-zuordnung-karte]').open === false && /gemerkt/.test(document.querySelector('[data-bank-zuordnung-karte] summary').textContent)));
  ok('gemerkte Änderung gilt (Text statt Name)', /Obst/.test(await page.textContent('.bank-row .mono')));

  console.log('— C. Excel-Datei —');
  const xlsx = await page.evaluate(async () => {
    // .xlsx im Browser bauen: ZIP „gespeichert“ (Verfahren 0) mit einem Blatt, Inline-Texten und einer Datumszelle.
    const enc = new TextEncoder();
    const teile = [['xl/workbook.xml', '<workbook><sheets><sheet name="Umsätze" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
      ['xl/styles.xml', '<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>'],
      ['xl/worksheets/sheet1.xml', '<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>Datum</t></is></c><c r="B1" t="inlineStr"><is><t>Verwendungszweck</t></is></c><c r="C1" t="inlineStr"><is><t>Betrag</t></is></c></row>'
        + '<row><c r="A2" s="1"><v>46331</v></c><c r="B2" t="inlineStr"><is><t>Miete</t></is></c><c r="C2"><v>-750</v></c></row></sheetData></worksheet>']];
    const crc = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
    const lok = [], zen = []; let off = 0;
    for (const [n, t] of teile) {
      const d = enc.encode(t), nb = enc.encode(n), h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
      h.setUint32(0, 0x04034b50, true); h.setUint32(14, crc(d), true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nb.length, true);
      c.setUint32(0, 0x02014b50, true); c.setUint32(16, crc(d), true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
      lok.push(new Uint8Array(h.buffer), nb, d); zen.push(new Uint8Array(c.buffer), nb); off += 30 + nb.length + d.length;
    }
    const zl = zen.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, teile.length, true); e.setUint16(10, teile.length, true); e.setUint32(12, zl, true); e.setUint32(16, off, true);
    const alle = [...lok, ...zen, new Uint8Array(e.buffer)], out = new Uint8Array(alle.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of alle) { out.set(x, p); p += x.length; }
    return Array.from(out);
  });
  await zu();
  await einlesen('umsaetze.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from(xlsx));
  await page.waitForSelector('.bank-row');
  const xt = await page.textContent('.bank-row .mono');
  ok('Excel: Datum aus der Datumszelle, Betrag −750,00, Text', /2026-11-05/.test(xt) && /−750,00/.test(xt) && /Miete/.test(xt), xt);

  console.log('— D. Monatsdatei des Portemonnaies → Entwürfe —');
  const json = await page.evaluate(() => JSON.stringify(window.__p.baueMonatsdatei({ monat: '2026-11', faecher: [
    { id: 'bargeld', art: 'bargeld', name: 'Bargeld', anfangCent: 1000, posten: [{ id: 'p1', datum: '2026-11-03', cent: 1299, richtung: 'raus', text: 'Einkauf' }, { id: 'p2', datum: '2026-11-04', cent: 5000, richtung: 'rein', text: 'Abhebung', vomKonto: true }] },
    { id: 'bank-1', art: 'bank', name: 'Beispielbank', anfangCent: 0, posten: [{ id: 'b1', datum: '2026-11-04', cent: 5000, richtung: 'raus', text: 'Automat', zumBargeld: true }, { id: 'b2', datum: '2026-11-01', cent: 2000, richtung: 'rein', text: 'Erstattung' }] }] })));
  await zu();
  await einlesen('portemonnaie-2026-11.json', 'application/json', Buffer.from(json));
  await page.waitForSelector('[data-pm-anlegen]');
  ok('drei Entwürfe angezeigt (Abhebung nur einmal)', (await page.$$('[data-pm-entwurf]')).length === 3);
  await page.check('[data-pm-nur-bargeld]');
  ok('„Nur Bargeld“: zwei Entwürfe', (await page.$$('[data-pm-entwurf]')).length === 2);
  await page.uncheck('[data-pm-nur-bargeld]');
  await page.click('[data-pm-anlegen]');
  await page.waitForSelector('[data-pm-fertig]');
  const b = await page.evaluate(async () => (await window.__p.listBuchungen()).map((x) => ({ s: x.status, z: x.zeilen.map((z) => z.seite + z.konto).join(' ') })));
  ok('drei Buchungen als Entwurf (nicht festgeschrieben), Abhebung Kasse an Bank', b.length === 3 && b.every((x) => x.s === 'entwurf') && b.some((x) => x.z === 'S1000 H1200'), JSON.stringify(b));
  await zu();
  await einlesen('portemonnaie-2026-11.json', 'application/json', Buffer.from(json));
  await page.waitForSelector('[data-pm-anlegen]');
  ok('derselbe Monat zum zweiten Mal: Hinweis „schon eingelesen“', !!(await page.$('[data-pm-schon]')));

  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
} catch (e) { rot++; console.log('  ✗ ROT: Ablauf warf — ' + (e && e.message)); }
await browser.close(); server.close();
console.log(`\n— ${gruen} grün, ${rot} rot —`);
process.exit(rot ? 1 : 0);
