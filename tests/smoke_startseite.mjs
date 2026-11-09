// tests/smoke_startseite.mjs — Startseite für Betriebe: Umsatzsteuer, Rücklage, Kasse heute; Modus bleibt (Klaus 2026-11-09:
// „sehe gar nicht, dass da … etwas für kleine Unternehmen mit 19 % [ist]“ · „die letzte Einstellung … privat … soll auch bleiben“).
// Echter Browser, echter Tresor, echte Buchungen (festgeschrieben), echte Übersicht. window.prompt gestellt.
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. Gegenprobe: BH_WURZEL=<Kopie> node tests/smoke_startseite.mjs

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
<script>window.__antwort = '30'; window.prompt = () => window.__antwort;</script>
<script type="module">
import { setupVault, lockVault, unlockVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings } from './src/state.js';
import * as store from './src/domain/store.js';
import { mountDashboard } from './src/ui/views/dashboard.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', vaZeitraum: 'monatlich' });
await store.ensureSeedKonten(['1200', '8400', '1776', '1576', '4930']);
const d = new Date(), heute = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const e = await store.saveEntwurf({ datum: heute, beschreibung: 'Verkauf', zeilen: [{ konto: '1200', seite: 'S', betrag: 11900 }, { konto: '8400', seite: 'H', betrag: 10000 }, { konto: '1776', seite: 'H', betrag: 1900 }] });
await store.festschreiben(e.id);
window.__p = { mountDashboard, updateSettings, getSettings, hydrateSettings, lockVault, unlockVault };
await mountDashboard(document.getElementById('app'));
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

const fehler = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true);
  await page.waitForSelector('[data-start-kacheln]');

  console.log('— A. Selbstständig: drei Kacheln oben —');
  ok('Kacheln stehen direkt unter der Überschrift', await page.evaluate(() => document.querySelector('.dash-head').nextElementSibling.hasAttribute('data-start-kacheln')));
  const ust = await page.textContent('[data-start-ust]');
  ok('Umsatzsteuer dieses Monats 19,00 € mit Fälligkeit', /19,00/.test(ust) && /Umsatzsteuer/.test(ust) && /fällig am 10\./.test(ust), ust);
  const r = await page.textContent('[data-start-ruecklage]');
  ok('Rücklage = 19 € + 25 % von 100 € = 44 €', /44,00/.test(r) && /25 %/.test(r) && /Faustregel/.test(r), r);
  ok('Kasse heute: offen', (await page.getAttribute('[data-start-kasse]', 'data-start-kasse')) === 'offen');
  await page.click('[data-start-ruecklage]');
  await page.waitForFunction(() => /30 %/.test(document.querySelector('[data-start-ruecklage]')?.textContent || ''));
  ok('Tipp auf die Rücklage ändert den Anteil (30 % → 49 €)', /49,00/.test(await page.textContent('[data-start-ruecklage]')));

  console.log('— B. Kleinunternehmer und Privat —');
  await page.evaluate(async () => { await window.__p.updateSettings({ nutzungsmodus: 'kleinunternehmer' }); await window.__p.mountDashboard(document.getElementById('app')); });
  await page.waitForSelector('[data-start-ruecklage]');
  ok('Kleinunternehmer: keine Umsatzsteuer-Kachel, Rücklage bleibt', !(await page.$('[data-start-ust]')));
  await page.evaluate(async () => { await window.__p.updateSettings({ nutzungsmodus: 'privat' }); await window.__p.mountDashboard(document.getElementById('app')); });
  await page.waitForFunction(() => !!document.querySelector('.dash-head') && !document.querySelector('[data-start-kacheln]'));
  ok('Privat: keine Betriebs-Kacheln', !(await page.$('[data-start-kacheln]')));

  console.log('— C. Modus bleibt (Sperren, neu laden, entsperren) —');
  await page.evaluate(() => window.__p.lockVault());
  await page.goto(`${BASIS}/__leer.html`);
  const modus = await page.evaluate(async () => {
    const v = await import('./src/core/vault.js'); const st = await import('./src/state.js');
    await v.unlockVault('probe-passwort-123'); const s = await st.hydrateSettings(); return [s.nutzungsmodus, s.ruecklageProzent];
  });
  ok('nach dem Neuladen: Privat und 30 % noch da', modus[0] === 'privat' && modus[1] === 30, JSON.stringify(modus));
  ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
} catch (e) {
  ok('Probe lief durch', false, String(e && e.message || e) + ' · ' + fehler.join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
