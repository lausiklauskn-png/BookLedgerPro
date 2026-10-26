// tests/smoke_scanner.mjs — 📷 Scannen mit dem eingebauten Scanner-Kern von Workflow PDF (Klaus 2026-10-26): echter Browser,
// echter Tresor, echter Kern (assets/wfpdf, byte-1:1), echtes Scanic-Modell (vendor/scanic) und echte Texterkennung
// (vendor/tesseract, deu) — nichts gestellt, nichts im Netz. Gestelltes Handyfoto wie in Workflow-PDF/tests/scan.mjs.
// Misst: Knopf, Scanner öffnet über der App, Blatt gefunden (Ecken), „Durchsuchbar“ an, „Als Beleg ablegen“ → OCR → PDF
// mit Marke „Workfloh PDF · Scannen“ → Beleg „eigen“, Text am Beleg gemerkt, Wortsuche findet die Rechnungsnummer.
// Rückgabe 0 grün · 1 ROT · 2 nicht lauffähig.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));
if (!CHROMIUM) { console.log('nicht lauffähig: Chromium fehlt'); process.exit(2); }
let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate, getRoute } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
import { listBelege, getBelegText } from './src/domain/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true });
window.__p = { getSettings, updateSettings, navigate, getRoute, listBelege, getBelegText, shell: () => renderShell(document.getElementById('app'), {}) };
window.__p.shell();
window.__bereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.traineddata': 'application/octet-stream', '.ort': 'application/octet-stream' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  const datei = join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(datei); res.writeHead(200, { 'content-type': TYP[extname(datei)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
let browser;
try { browser = await pw.chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const konsole = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') konsole.push(m.text().slice(0, 120) + ' @' + (m.location() && m.location().url || '').slice(-60)); });
page.on('requestfailed', (r) => antworten.push('FAIL ' + r.url().slice(-80)));
const antworten = []; page.on('response', (r) => { if (r.status() >= 400) antworten.push(r.status() + ' ' + r.url().slice(-80)); });
const fremd = []; page.on('request', (r) => { const u = r.url(); if (!u.startsWith('http://127.0.0.1')) fremd.push(u); });
const warte = (fn, arg, ms = 15000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  await page.evaluate(() => window.__p.navigate('documents'));
  await warte(() => document.querySelector('[data-scan-start]'));
  ok('„📷 Scannen“ steht vorn in der Belegkarte (Hauptknopf), daneben Foto aufnehmen und Workflow PDF', await page.evaluate(() => { const b = document.querySelector('[data-scan-start]'); const r = b && b.closest('.btn-row'); return !!b && b.classList.contains('btn-primary') && r.children[0] === b && !!r.querySelector('[data-workflow-scan]'); }));
  await page.click('[data-scan-start]');
  await warte(() => window.WFP && window.WFP.Scanner && document.querySelector('.scan'), null, 60000);
  ok('Scanner öffnet über der App (Kern aus assets/wfpdf, scanner.css geladen, body.scan-offen)', await page.evaluate(() => !!document.querySelector('.scan[role="dialog"]') && document.body.classList.contains('scan-offen') && !!document.querySelector('link[data-scanner-css]') && getComputedStyle(document.querySelector('.scan')).zIndex === '100000'));
  ok('„Durchsuchbar“ ist an (BLP: Text immer mitlesen), Pfade zeigen auf vendor/scanic und vendor/ (Tesseract)', await page.evaluate(() => { const st = window.WFP.Scanner.zustand(); return st && st.durchsuchbar === true; }));
  // Gestelltes Handyfoto (wie Workflow-PDF/tests/scan.mjs und Mein-WorkFloh browser_scan.mjs): dunkler Tisch, schräges Blatt
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 1600; const x = c.getContext('2d');
    let z = 7; const zufall = () => (z = (z * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#2b2a2e'; x.fillRect(0, 0, 1200, 1600);
    for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${80 + zufall() * 60},${70 + zufall() * 50},60,.25)`; x.fillRect(zufall() * 1200, zufall() * 1600, 3, 3); }
    x.save(); x.translate(600, 800); x.rotate(5 * Math.PI / 180);
    const g = x.createLinearGradient(-420, 0, 420, 0); g.addColorStop(0, '#f6f3ea'); g.addColorStop(1, '#bdb8ad');
    x.fillStyle = g; x.fillRect(-420, -594, 840, 1188);
    x.fillStyle = '#1b1b22'; x.font = 'bold 64px Arial'; x.fillText('RECHNUNG 4711', -340, -400);
    x.font = '52px Arial'; x.fillText('Betrag 128,50 EUR', -340, -250); x.fillText('Musterstadt', -340, -130);
    x.restore();
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
    await window.WFP.Scanner.hinzu([new File([blob], 'handyfoto.jpg', { type: 'image/jpeg' })]);
  });
  await warte(() => { const st = window.WFP.Scanner.zustand(); return st.seiten.length === 1 && st.seiten[0].ecken && st.seiten[0].erkennung; }, null, 90000);
  const erk = await page.evaluate(() => { const s = window.WFP.Scanner.zustand().seiten[0]; return { ecken: s.ecken && s.ecken.length, sicher: s.erkennung && s.erkennung.sicher, quelle: s.erkennung && s.erkennung.quelle, grund: s.erkennung && s.erkennung.grund }; });
  ok('Blatt gefunden: vier Ecken (automatisch; Scanic-Modell aus vendor/scanic oder Kanten/blatt.js), Ecken sind ziehbar', erk.ecken === 4 && !!(await page.$('.scan [data-buehne] canvas')), JSON.stringify(erk));
  ok('kein Aufruf ins Netz (Modell und Texterkennung lokal)', fremd.length === 0, fremd.slice(0, 3).join(' | '));
  // „Als Beleg ablegen“ → Texterkennung (Tesseract, deu) → PDF → dateienEinlesen
  const fertigKnopf = await page.$('.scan [data-fertig]');
  ok('Fertig-Knopf heißt „Als Beleg ablegen“', !!fertigKnopf && /Als Beleg ablegen/.test(await fertigKnopf.textContent()));
  await page.click('.scan [data-fertig]');
  // Unsichere Erkennung fragt einmal nach — dann „Trotzdem übernehmen“ (so wie ein Mensch es täte)
  await page.waitForTimeout(500);
  const frage = await page.$('.scan-dlg [data-j]');
  if (frage) await frage.click();
  await warte(() => window.__blpImport && window.__blpImport.quelle === 'scanner', null, 180000);
  const imp = await page.evaluate(() => window.__blpImport);
  if (!imp) console.log('  DIAG toast=' + JSON.stringify(await page.evaluate(() => window.__blpToast)) + ' dlg=' + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.scan-dlg')].map((d) => d.textContent.slice(0, 160)))) + ' fertig=' + JSON.stringify(await page.evaluate(() => window.__blpScanFertig)) + ' status=' + JSON.stringify(await page.evaluate(() => (document.querySelector('[data-import-status]') || {}).textContent)) + '\n  konsole=' + konsole.slice(0, 6).join(' | ') + '\n  http=' + antworten.slice(0, 6).join(' | '));
  ok('Scan abgelegt: ein Beleg, Stand „eigen“ (Marke Workfloh PDF), Text aus der Textebene gemerkt', imp && imp.abgelegt === 1 && imp.eigen === 1 && imp.gelesen === 1, JSON.stringify(imp) + ' text=' + JSON.stringify(await page.evaluate(() => window.__blpScanText)));
  ok('Scanner ist danach zu', await page.evaluate(() => !document.querySelector('.scan') && !document.body.classList.contains('scan-offen')));
  const b = await page.evaluate(async () => { const l = await window.__p.listBelege(); const b = l[0]; const text = b ? await window.__p.getBelegText(b.id) : ''; return { n: l.length, name: b && b.name, herkunft: b && b.herkunft, quelle: b && b.quelle, textZeichen: b && b.textZeichen, text: String(text || '').slice(0, 200) }; });
  ok('Beleg: Name „Scan … .pdf“, Herkunft workflow-pdf, Quelle scanner, erkannter Text am Beleg (verschlüsselt, hier entschlüsselt gelesen)', b.n === 1 && /^Scan .*\.pdf$/.test(b.name) && b.herkunft === 'workflow-pdf' && b.quelle === 'scanner' && b.textZeichen > 10, JSON.stringify(b));
  ok('Texterkennung las die Rechnungsnummer („4711“) und den Betrag („128,50“)', /4711/.test(b.text) && /128[,.]50/.test(b.text), b.text);
  // Wortsuche findet den Scan
  await warte(() => document.querySelector('[data-belegsuche]'));
  await page.fill('[data-belegsuche]', '4711');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === '4711');
  ok('Wortsuche „4711“ findet den gescannten Beleg mit Fundstelle', await page.evaluate(async () => { const l = await window.__p.listBelege(); return window.__blpSuche.treffer.some((x) => x.id === l[0].id && x.typ === 'beleg'); }), JSON.stringify(await page.evaluate(() => window.__blpSuche)));
  ok('Belegliste zeigt die Marke „eigener Scan“', await page.evaluate(() => /Eigener Scan/i.test(document.querySelector('#content').textContent)));
  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e) + '\n  Seitenfehler: ' + fehler.join(' | ').slice(0, 600));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
