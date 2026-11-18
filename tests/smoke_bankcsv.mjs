// tests/smoke_bankcsv.mjs — Bankauszug-Werkzeug nimmt CSV, Excel und den Portemonnaie-Monat der Privaten Akte (Klaus 2026-11-18).
// Echter Browser, echter Tresor, echte Belegseite, echte Dateiwahl. Alle Dateien ERFUNDEN, keine echten Kontodaten.
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. Gegenprobe: BH_WURZEL=<Kopie> node tests/smoke_bankcsv.mjs

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
<body><div id="app"></div>
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings } from './src/state.js';
import * as store from './src/domain/store.js';
import { mountDocuments } from './src/ui/views/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig' });
await store.ensureSeedKonten(['1000', '1200', '1360', '4930']);
window.__p = { getSettings, store };
await mountDocuments(document.getElementById('app'));
window.__bereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  if (pfad === '/__leer.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><meta charset="utf-8"><body></body>'); }
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

const CSV_A = '"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Betrag";"Waehrung"\r\n'
  + '"DE00123456780000001234";"30.11.26";"30.11.26";"LASTSCHRIFT";"Strom November";"Beispiel Stadtwerke";"-58,40";"EUR"\r\n'
  + '"DE00123456780000001234";"15.11.26";"15.11.26";"GUTSCHRIFT";"Rückzahlung";"Musterfirma GmbH";"120,00";"EUR"\r\n';
// in Windows-1252 wie viele Banken: „ü“ = 0xFC
const csvBytes = Buffer.from(CSV_A, 'latin1');
const MONAT = JSON.stringify({ art: 'portemonnaie-monat', fassung: 1, quelle: 'private-akte', monat: '2026-11', erstellt: '2026-12-01T08:00:00Z', faecher: [
  { fach: 'bargeld', name: 'Bargeld', anfangCent: 0, endeCent: 17050, posten: [
    { id: 'p1', datum: '2026-11-02', cent: 20000, richtung: 'ein', text: 'Barabhebung', vomKonto: true },
    { id: 'p2', datum: '2026-11-03', cent: 2950, richtung: 'aus', text: 'Einkauf', wofuer: 'Bürobedarf' } ] },
  { fach: 'bank', name: 'Girokonto', ibanEnde: '1234', anfangCent: 50000, endeCent: 30000, posten: [
    { id: 'b1', datum: '2026-11-02', cent: 20000, richtung: 'aus', text: 'Barabhebung', zurKasse: true } ] } ] });

const fehler = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true);
  const datei = async (name, mimeType, buffer) => {
    const wahl = page.waitForEvent('filechooser');
    if (!(await page.$('[data-werkzeug-fenster="bank"]'))) await page.click('[data-werkzeug="bank"]');
    else await page.click('[data-werkzeug-fenster="bank"] [data-werkzeug-datei]');
    await (await wahl).setFiles({ name, mimeType, buffer });
  };

  console.log('— A. CSV (Windows-1252): Spalten geraten, einlesen, gemerkt —');
  await datei('umsaetze.csv', 'text/csv', csvBytes);
  await page.waitForSelector('[data-csv-zuordnung]');
  ok('Zuordnung steht als „geraten“ da', (await page.getAttribute('[data-csv-zuordnung]', 'data-csv-zuordnung')) === 'geraten');
  ok('Datum = Buchungstag, Betrag = Betrag', (await page.$eval('[data-csv-feld="datum"]', (s) => s.selectedOptions[0].textContent)) === 'Buchungstag'
    && (await page.$eval('[data-csv-feld="betrag"]', (s) => s.selectedOptions[0].textContent)) === 'Betrag');
  await page.click('[data-csv-einlesen]');
  await page.waitForSelector('[data-csv-zuordnung] .bank-row');
  const zeilen = await page.$$eval('[data-csv-zuordnung] .bank-row .mono', (z) => z.map((x) => x.textContent));
  ok('zwei Umsätze aus der Windows-1252-Datei', zeilen.length === 2 && zeilen.some((z) => /\+120,00 € · Musterfirma/.test(z)) && zeilen.some((z) => /−58,40/.test(z)), zeilen.join(' | '));
  ok('Zuordnung im Tresor gemerkt', await page.evaluate(() => (window.__p.getSettings().bankCsvZuordnungen || []).length === 1));
  await datei('umsaetze.csv', 'text/csv', csvBytes);
  await page.waitForSelector('[data-csv-zuordnung]');
  ok('zweites Mal: „gemerkt“', (await page.getAttribute('[data-csv-zuordnung]', 'data-csv-zuordnung')) === 'gemerkt');

  console.log('— B. Portemonnaie-Monat: Umbuchung einmal, Kasse als Geldkonto —');
  await datei('portemonnaie-2026-11.json', 'application/json', Buffer.from(MONAT));
  await page.waitForSelector('[data-pm-monat="2026-11"]');
  ok('eine Umbuchung, Bank-Seite übersprungen', (await page.$$('[data-pm-umbuchung]')).length === 1 && /einmal als Umbuchung/.test(await page.textContent('[data-werkzeug-fenster="bank"]')));
  await page.click('[data-pm-umbuchung] button');
  await page.waitForFunction(() => /Umbuchung als Entwurf/.test(document.querySelector('[data-pm-umbuchung]').textContent));
  const ent = await page.evaluate(async () => (await window.__p.store.listBuchungen()).map((b) => ({ s: b.status, z: b.zeilen.map((z) => z.konto + z.seite + z.betrag).join(',') })));
  ok('Entwurf Kasse 1000 an Bank 1200 über 200,00 (nicht festgeschrieben)', ent.length === 1 && ent[0].z === '1000S20000,1200H20000' && ent[0].s === 'entwurf', JSON.stringify(ent));
  const einkauf = await page.$$eval('[data-werkzeug-fenster="bank"] .bank-row .mono', (z) => z.map((x) => x.textContent).find((x) => /Bargeld · −/.test(x)) || '');
  ok('Einkauf steht mit Fach Bargeld da', /Bargeld · −29,50/.test(einkauf), einkauf);
  const reihe = '[data-werkzeug-fenster="bank"] .bank-row:not([data-pm-umbuchung])';
  const knopf = await page.$$(reihe + ' button');
  await knopf[knopf.length - 1].click();
  await page.waitForFunction((r) => /1000/.test(document.querySelector(r).textContent.replace(/\d{4}-\d{2}-\d{2}/g, '')), reihe).catch(() => {});
  ok('Buchungsvorschlag zum Einkauf nimmt Kasse 1000 als Geldkonto', /1000/.test((await page.textContent(reihe)).replace(/\d{4}-\d{2}-\d{2}/g, '')), (await page.textContent(reihe)).slice(0, 300));

  console.log('— C. Alte .xls benannt abgelehnt —');
  await datei('alt.xls', 'application/vnd.ms-excel', Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]));
  const xls = await page.waitForFunction(() => /\.xls/.test(document.querySelector('[data-werkzeug-fenster="bank"] .form-error')?.textContent || '')).then(() => true).catch(() => false);
  ok('Satz zu .xls steht da', xls);
  ok('keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));
} catch (e) { ok('Probe lief durch', false, String(e.message || e)); }
finally { await browser.close(); server.close(); }
console.log(`\n— ${gruen} grün, ${rot} ROT —`);
process.exit(rot ? 1 : 0);
