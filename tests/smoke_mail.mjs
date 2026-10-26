// tests/smoke_mail.mjs — „Mail an BookLedgerPro teilen" (Klaus 2026-10-26): eine geteilte .eml landet im Vorrat des Workers
// wie aus Androids Teilen-Liste; die Belegseite legt die Mail als Beleg ab (Text durchsuchbar) und den PDF-Anhang als eigenen
// Beleg mit Verweis; die Textebene des Anhangs wird sofort gemerkt, die Positionen (S1) stehen am Beleg; „Text aus dem PDF
// übernehmen" führt zum Buchungsvorschlag (nach dem Halt „noch nie geprüft"). Echter Tresor, erfundene Daten, keine KI.
// Aufruf: node tests/smoke_mail.mjs   (Chromium + playwright-core; fehlt eines → „nicht lauffähig", Rückgabe 2)
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

async function pdfMitText(zeilen) {
  const d = await PDFLib.PDFDocument.create();
  const p = d.addPage([595, 842]);
  const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
  zeilen.forEach((z, i) => p.drawText(z, { x: 60, y: 760 - i * 22, size: 13, font: f }));
  return Buffer.from(await d.save());
}
const RECHNUNG = await pdfMitText(['Baeckerei Mueller - Rechnung 2026-117 vom 12.10.2026', 'Brot und Broetchen fuer das Vereinsfest', '1  Brot Roggen   10 x 3,20 EUR   32,00 EUR', '2  Broetchen   50 x 0,45 EUR   22,50 EUR', 'Nettobetrag 54,50 EUR', 'USt 7 % 3,82 EUR', 'Gesamtbetrag 58,32 EUR']);
const EML = Buffer.from([
  'From: =?utf-8?Q?B=C3=A4ckerei_M=C3=BCller?= <post@baeckerei.example>', 'To: klaus@example', 'Subject: Rechnung 2026-117 Vereinsfest',
  'Date: Mon, 26 Oct 2026 10:00:00 +0100', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="XYZ"', '',
  '--XYZ', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', 'Hallo Klaus,', 'anbei die Rechnung für das Vereinsfest. Zahlbar bis 26.11.2026.', 'Viele Grüße, Bäckerei Müller', '',
  '--XYZ', 'Content-Type: application/pdf; name="Rechnung-2026-117.pdf"', 'Content-Disposition: attachment; filename="Rechnung-2026-117.pdf"', 'Content-Transfer-Encoding: base64', '', RECHNUNG.toString('base64').replace(/(.{76})/g, '$1\r\n'), '',
  '--XYZ', 'Content-Type: application/octet-stream; name="daten.xyz"', 'Content-Disposition: attachment', 'Content-Transfer-Encoding: base64', '', 'AAEC', '--XYZ--', '',
].join('\r\n'), 'utf8');

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings } from './src/state.js';
import { mountDocuments, merkeGeteilt } from './src/ui/views/documents.js';
import { listBelege, getBelegText, getBelegPositionen } from './src/domain/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true });
window.__probe = { listBelege, getBelegText, getBelegPositionen, merkeGeteilt, neu: () => mountDocuments(document.getElementById('app')) };
window.__probeBereit = true;
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
try {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 });
  // Die Mail liegt im Vorrat des Workers, wie nach dem POST aus Androids Teilen-Liste (tests/smoke_teilen.mjs misst den POST selbst)
  await page.evaluate(async (b64) => {
    const c = await caches.open('blpr-geteilt');
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    await c.put(new Request('./geteilt/1'), new Response(new Blob([bytes], { type: 'message/rfc822' }), { headers: { 'Content-Type': 'message/rfc822', 'X-Name': encodeURIComponent('Rechnung Vereinsfest.eml') } }));
    window.__probe.merkeGeteilt('1');
    await window.__probe.neu();
  }, EML.toString('base64'));
  await page.waitForFunction(() => window.__blpImport && window.__blpImport.quelle === 'teilen', null, { timeout: 60000 });
  const imp = await page.evaluate(() => window.__blpImport);
  ok('eine Mail → zwei Belege (Mail + PDF-Anhang), fremde Datei übergangen, Text des Anhangs gelesen', imp.abgelegt === 2 && imp.mails === 1 && imp.mailAnhaenge === 1 && imp.gelesen === 1 && imp.mailUebergangen.length === 1 && /daten\.xyz/.test(imp.mailUebergangen[0]), JSON.stringify(imp));
  ok('Statuszeile nennt die Mail und den Anhang', await page.evaluate(() => /1 Mail\(s\) abgelegt/.test(document.querySelector('[data-import-status]')?.textContent || '')), await page.evaluate(() => document.querySelector('[data-import-status]')?.textContent));
  const belege = await page.evaluate(() => window.__probe.listBelege());
  const mail = belege.find((b) => b.mediaType === 'message/rfc822'), anh = belege.find((b) => b.mediaType === 'application/pdf');
  ok('Mail-Beleg: Name „Mail 2026-10-26 – Rechnung 2026-117 Vereinsfest.eml", Absender als Name, 2 Anhänge gezählt (auch der übergangene), Quelle teilen', !!mail && mail.name === 'Mail 2026-10-26 – Rechnung 2026-117 Vereinsfest.eml' && mail.mail.von === 'Bäckerei Müller' && mail.mail.anhaenge === 2 && mail.quelle === 'teilen', JSON.stringify(mail && { name: mail.name, mail: mail.mail, quelle: mail.quelle }));
  ok('Anhang-Beleg: Name aus der Mail, Verweis auf die Mail (mailId, Betreff, Absender), kein eigener Scan', !!anh && anh.name === 'Rechnung-2026-117.pdf' && anh.mail && anh.mail.mailId === mail.id && anh.mail.betreff === 'Rechnung 2026-117 Vereinsfest' && anh.mail.von === 'Bäckerei Müller' && !anh.herkunft, JSON.stringify(anh && { name: anh.name, mail: anh.mail, herkunft: anh.herkunft }));
  const mailText = await page.evaluate((id) => window.__probe.getBelegText(id), mail.id);
  ok('Mailtext am Mail-Beleg (verschlüsselt, hier gelesen): Kopf + Text', /^Betreff: Rechnung 2026-117 Vereinsfest\nVon: Bäckerei Müller/.test(mailText) && /Zahlbar bis 26\.11\.2026/.test(mailText), mailText.slice(0, 160));
  const anhText = await page.evaluate((id) => window.__probe.getBelegText(id), anh.id);
  ok('Textebene des Anhangs sofort gemerkt (Rechnungsnummer, Positionen)', /2026-117/.test(anhText) && /Broetchen/.test(anhText), anhText.slice(0, 120));
  const pos = await page.evaluate((id) => window.__probe.getBelegPositionen(id), anh.id);
  ok('Positionen (S1) am Anhang: zwei Zeilen mit Menge × Einzelpreis, Netto erkannt, stimmt', !!pos && pos.positionen.length === 2 && pos.positionen[0].menge === 10 && pos.positionen[0].einzelpreisCent === 320 && pos.positionen[1].betragCent === 2250 && pos.nettoCent === 5450 && pos.stimmt === true, JSON.stringify(pos));
  ok('Mail-Beleg hat keinen Prüf-Stand (—), kein Texterkennungs-Knopf', await page.evaluate(() => { const tr = [...document.querySelectorAll('tbody tr')].find((x) => /Mail 2026-10-26/.test(x.textContent)); return !!tr && !tr.querySelector('[data-pruefung]') && !tr.querySelector('[data-texterkennung]'); }));
  ok('Zeilen zeigen „📧 Mail von Bäckerei Müller · 1 Anhang" und „📎 aus Mail …"', await page.evaluate(() => /Bäckerei Müller/.test(document.querySelector('[data-mail="mail"]')?.textContent || '') && /Rechnung 2026-117 Vereinsfest/.test(document.querySelector('[data-mail="anhang"]')?.textContent || '')));
  const posKnopf = await page.evaluate(() => document.querySelector('[data-positionen="2"] [data-positionen-zeigen]')?.textContent || '');
  ok('„2 Positionen · Summe stimmt" steht am Anhang', /^2 Positionen · Summe stimmt$/.test(posKnopf), posKnopf);
  await page.click('[data-positionen="2"] [data-positionen-zeigen]');
  await page.waitForSelector('[data-positionen-tabelle]', { timeout: 10000 }).catch(() => null);
  const tab = await page.evaluate(() => { const t = document.querySelector('[data-positionen-tabelle]'); return t ? { zeilen: t.querySelectorAll(':scope > tbody > tr').length, text: t.textContent } : null; /* die Tabelle steht in einer Zeile der Belegtabelle — 'tbody tr' zählte deren Kopfzeile mit */ });
  ok('ein Tipp klappt die Tabelle auf: zwei Zeilen, Bezeichnung, Betrag', !!tab && tab.zeilen === 2 && /Brot Roggen/.test(tab.text) && /32,00/.test(tab.text), JSON.stringify(tab));
  // Suche findet Mail (Text) und Anhang (Textebene)
  await page.fill('[data-belegsuche]', 'Vereinsfest');
  await page.waitForFunction(() => window.__blpSuche && window.__blpSuche.frage === 'Vereinsfest', null, { timeout: 10000 });
  const s = await page.evaluate(() => window.__blpSuche);
  ok('Wortsuche „Vereinsfest" findet Mail und Anhang', s.wort === 2, JSON.stringify(s && { wort: s.wort, treffer: s.treffer.map((x) => x.id) }));
  await page.fill('[data-belegsuche]', '');
  // Anhang → „Text aus dem PDF übernehmen" (fremdes PDF: Halt „noch nie geprüft" → ohne Prüfung weiter) → Buchungsvorschlag
  await page.evaluate(() => { const tr = [...document.querySelectorAll('tbody tr')].find((x) => /Rechnung-2026-117\.pdf/.test(x.textContent)); tr.querySelector('[data-texterkennung]').click(); });
  await page.waitForSelector('[data-ungeprueft-halt]', { timeout: 15000 });
  ok('fremder Anhang: der Halt „noch nie geprüft" kommt wie bei jedem fremden PDF', true);
  await page.click('[data-ungeprueft-weiter]');
  await page.waitForSelector('.vorschlag', { timeout: 30000 });
  ok('ein Buchungsvorschlag aus dem Anhang steht da (ohne KI, Heuristik) — der Weg in die Buchhaltung', !!(await page.$('.vorschlag')) && await page.evaluate(() => /58,32|54,50/.test(document.querySelector('.vorschlag')?.textContent || '')), await page.evaluate(() => (document.querySelector('.vorschlag')?.textContent || '').slice(0, 200)));
  await ctx.close();
  ok('keine Skriptfehler', fehler.length === 0, fehler.join(' | '));
} catch (e) { rot++; console.log('  ✗ ROT: Probe stolperte — ' + (e && e.message)); }
finally { await browser.close(); server.close(); }
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
