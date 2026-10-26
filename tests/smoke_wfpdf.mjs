// tests/smoke_wfpdf.mjs — Workflow PDF im Rundlauf (Klaus 2026-10-26: „Wenn, dann beides. Also PDF teilen und Daten teilen."):
//   Hinweg: am Angebot „📄 An Workflow PDF" → Arbeitsstand-Datei (*.workfloh.json) mit PDF + Feldern (Unterschrift, Ort/Datum,
//           Haken) aus dem echten Tresor; Vermerk am Angebot.
//   Rückweg: Workflow PDF gibt das unterschriebene PDF fest aus (hier in Node nachgestellt: pdf-lib lädt das PDF, setzt
//           Title/Producer/Creator wie export.js) und teilt es → BLP legt den Beleg ab und ordnet ihn dem Angebot zu
//           (Keywords; zweiter Fall: nur die Fußzeile in der Textebene; dritter Fall: fremdes PDF bleibt ohne Zuordnung).
//   Aufruf: node tests/smoke_wfpdf.mjs   (Chromium + playwright-core; fehlt eines → „nicht lauffähig", Rückgabe 2)
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
const PDFLib = require('./vendor/pdf-lib.min.js');
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));
if (!CHROMIUM) { console.log('nicht lauffähig: Chromium fehlt'); process.exit(2); }
let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + String(info).slice(0, 400) : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
import { saveKunde } from './src/domain/crm-store.js';
import { saveAngebot, listAngebote, getAngebot } from './src/domain/angebote-store.js';
import { neuesAngebot } from './src/domain/angebote.js';
import { listBelege } from './src/domain/documents.js';
import { merkeGeteilt } from './src/ui/views/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true, angeboteAlt: true, firma: { name: 'Werkstatt Beispiel', anschrift: 'Musterweg 1\\n12345 Musterstadt', steuernummer: '', ustId: '', iban: '' } });
const k = await saveKunde({ name: 'SV Blau-Weiß 09', email: 'post@svbw09.example', adresse: 'Sportplatz 1, 12345 Musterstadt', telefon: '0123 4567' });
const a = await saveAngebot({ ...neuesAngebot({ titel: 'Vereins-Tassen', kundeId: k.id, datum: '2026-10-26', nummer: 'AN-2026-0042',
  positionen: [{ beschreibung: 'Tasse 11oz bedruckt (Digitaldruck)', menge: 10, einzelpreisCent: 1290, ustSatz: 19, kalkulation: { marge: 0.4 } }, { beschreibung: 'Versand', menge: 1, einzelpreisCent: 590, ustSatz: 19 }] }), status: 'offen' });
window.__p = { getSettings, updateSettings, navigate, listAngebote, getAngebot, listBelege, merkeGeteilt, ids: { k: k.id, a: a.id }, shell: () => renderShell(document.getElementById('app'), {}) };
window.__blpTeilenAbfangen = true;
window.__p.shell();
window.__bereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.gz': 'application/gzip' };
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
const fehler = [];
let page;
const warte = (fn, arg, ms = 15000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
// Teilen-Empfang nachstellen: Datei in den Vorrat des Workers legen und die Belegseite öffnen (wie tests/smoke_mail.mjs)
async function teilen(bytes, name, typ, kennung) {
  await page.evaluate(async ({ b64, name, typ, kennung }) => {
    const c = await caches.open('blpr-geteilt');
    const u8 = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    await c.put(new Request('./geteilt/' + kennung), new Response(new Blob([u8], { type: typ }), { headers: { 'Content-Type': typ, 'X-Name': encodeURIComponent(name) } }));
    window.__blpImport = null; window.__p.merkeGeteilt(kennung);
    window.__p.navigate('documents');
  }, { b64: Buffer.from(bytes).toString('base64'), name, typ, kennung });
  await warte(() => window.__blpImport && window.__blpImport.quelle === 'teilen', null, 60000);
  return page.evaluate(() => window.__blpImport);
}
// Workflow PDFs fester Export, nachgestellt wie assets/export.js: PDF laden, Title/Producer/Creator setzen, Keywords bleiben.
async function wfpdfExport(bytes, { ohneKeywords = false } = {}) {
  const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
  pdf.setTitle('Angebot AN-2026-0042'); pdf.setProducer('Workfloh PDF'); pdf.setCreator('Workflow PDF (lausiklauskn-png.github.io/Workflow-PDF)');
  if (ohneKeywords) pdf.setKeywords([]);
  const f = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
  pdf.getPages().at(-1).drawText('Unterschrift (Probe)', { x: 310, y: 100, size: 11, font: f });
  return pdf.save();
}
try {
  console.log('\nHinweg · Angebot → Workflow PDF (PDF + Felder)');
  page = await (await browser.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  page.on('pageerror', (e) => fehler.push(e.message)); page.on('dialog', (d) => d.accept());
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  await page.evaluate(() => window.__p.navigate('angebote'));
  ok('der Knopf „📄 An Workflow PDF" steht am offenen Angebot', !!(await warte(() => { const b = document.querySelector('[data-wfpdf-angebot]'); return b && /Workflow PDF/.test(b.textContent); })));
  await page.click('[data-wfpdf-angebot]');
  const w = (await warte(() => window.__blpWfpdf && window.__blpWfpdf.inhalt, null, 30000)) ? await page.evaluate(() => ({ name: window.__blpWfpdf.name, bytes: window.__blpWfpdf.bytes, seiten: window.__blpWfpdf.seiten, inhalt: window.__blpWfpdf.inhalt })) : null;
  ok('die Übergabe wird abgefangen: Arbeitsstand-Datei „Angebot-AN-2026-0042.workfloh.json", eine Seite', !!w && w.name === 'Angebot-AN-2026-0042.workfloh.json' && w.seiten === 1 && w.bytes > 1000, w && w.name);
  const j = w ? JSON.parse(w.inhalt) : null;
  const pdfBytes = j ? Buffer.from(j.pdf, 'base64') : null;
  ok('Arbeitsstand wie Workflow PDF: Format, Version 1, doc mit 3 Feldern (Haken · Ort/Datum · Unterschrift), Vorschaubild, pages', !!j && j.format === 'workfloh-pdf-arbeitsstand' && j.version === 1 && j.doc.fields.length === 3 && j.doc.fields.map((f) => f.type).join() === 'check,datum,unterschrift' && /^data:image\/png/.test(j.doc.thumb) && j.doc.pages.length === 1 && j.doc.name === 'Angebot AN-2026-0042', j && JSON.stringify({ f: j.doc.fields.length, thumb: (j.doc.thumb || '').slice(0, 20) }));
  const geladen = pdfBytes ? await PDFLib.PDFDocument.load(pdfBytes, { updateMetadata: false }) : null;   // pdf-lib überschreibt beim Laden sonst den Producer
  const aId = await page.evaluate(() => window.__p.ids.a);
  ok('das PDF trägt Keywords mit Kennung und Nummer, Producer BookLedgerPro, Title „Angebot AN-2026-0042"', !!geladen && (geladen.getKeywords() || '').includes('blp-angebot=' + aId) && geladen.getProducer() === 'BookLedgerPro' && geladen.getTitle() === 'Angebot AN-2026-0042', geladen && geladen.getKeywords());
  const nachHin = await page.evaluate((id) => window.__p.getAngebot(id), aId);
  ok('am Angebot steht der Zeitpunkt der Übergabe; Status bleibt offen', !!nachHin.verweise && /^\d{4}-/.test(nachHin.verweise.wfpdfUebergabeAm || '') && nachHin.status === 'offen', JSON.stringify(nachHin.verweise));
  ok('die Zeile zeigt „→ an Workflow PDF übergeben"', !!(await warte(() => !!document.querySelector('[data-wfpdf-verweis="uebergeben"]'))));

  console.log('\nRückweg · unterschriebenes PDF aus Workflow PDF → Beleg am Angebot');
  const fest = await wfpdfExport(pdfBytes);
  const imp = await teilen(fest, 'Angebot AN-2026-0042.pdf', 'application/pdf', '1');
  ok('Beleg abgelegt und EINEM Angebot zugeordnet (Keywords)', !!imp && imp.abgelegt === 1 && Array.isArray(imp.angebote) && imp.angebote.length === 1 && imp.angebote[0] === 'AN-2026-0042', JSON.stringify(imp));
  ok('Statuszeile nennt die Zuordnung', await page.evaluate(() => /aus Workflow PDF dem Angebot zugeordnet/.test(document.querySelector('[data-import-status]')?.textContent || '')));
  ok('Belegzeile: „✍ zu Angebot AN-2026-0042 (zurück aus Workflow PDF)"', !!(await warte((id) => { const z = document.querySelector('[data-angebot-beleg="' + id + '"]'); return z && /AN-2026-0042/.test(z.textContent); }, aId)));
  const belege = await page.evaluate(() => window.__p.listBelege());
  const nachRueck = await page.evaluate((id) => window.__p.getAngebot(id), aId);
  ok('am Angebot: wfpdfBelegId zeigt auf den Beleg, Name und Zeitpunkt dabei, Status weiter offen (nichts automatisch angenommen)', belege.length === 1 && nachRueck.verweise.wfpdfBelegId === belege[0].id && /AN-2026-0042/.test(nachRueck.verweise.wfpdfBelegName || '') && /^\d{4}-/.test(nachRueck.verweise.wfpdfZurueckAm || '') && nachRueck.status === 'offen', JSON.stringify(nachRueck.verweise));
  await page.evaluate(() => window.__p.navigate('angebote'));
  ok('die Angebotszeile zeigt „✍ Unterschrieben zurück aus Workflow PDF: … (Beleg)"', !!(await warte(() => { const z = document.querySelector('[data-wfpdf-verweis="zurueck"]'); return z && /Workflow PDF/.test(z.textContent) && /AN-2026-0042/.test(z.textContent); })));

  console.log('\nRückweg ohne Keywords · nur die Fußzeile in der Textebene');
  const ohne = await wfpdfExport(pdfBytes, { ohneKeywords: true });
  const imp2 = await teilen(ohne, 'Angebot ohne Keywords.pdf', 'application/pdf', '2');
  ok('auch ohne Keywords: Marke aus der Textebene gelesen, Angebot zugeordnet', !!imp2 && imp2.abgelegt === 1 && imp2.angebote.length === 1 && imp2.angebote[0] === 'AN-2026-0042', JSON.stringify(imp2));

  console.log('\nFremdes PDF · keine Zuordnung');
  const fremd = await (async () => { const d = await PDFLib.PDFDocument.create(); const p = d.addPage([595, 842]); const f = await d.embedFont(PDFLib.StandardFonts.Helvetica); p.drawText('Rechnung 4711 Baeckerei', { x: 60, y: 760, size: 12, font: f }); d.setProducer('Fremdprogramm'); return d.save(); })();
  const imp3 = await teilen(fremd, 'Rechnung.pdf', 'application/pdf', '3');
  ok('fremdes PDF (anderer Producer, keine Marke) wird abgelegt, aber keinem Angebot zugeordnet', !!imp3 && imp3.abgelegt === 1 && imp3.angebote.length === 0, JSON.stringify(imp3));
  ok('keine Skriptfehler', fehler.length === 0, fehler.join(' | '));
} catch (e) { rot++; console.log('  ✗ ROT: Probe stolperte — ' + (e && e.message)); }
finally { await browser.close(); server.close(); }
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
