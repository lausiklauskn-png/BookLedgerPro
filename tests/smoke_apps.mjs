// tests/smoke_apps.mjs — Eingebettete Apps Workflow Calculate / Workflow Needs (Klaus 2026-10-26): echter Browser, echter
// Tresor, die byte-1:1-Kopien unter apps/ im <iframe> (gleicher Ursprung). Misst: Menü (Bild-Symbole, keine BLP-Angebote),
// App läuft eingebettet (WC/WN, Brücke aktiv, kein eigener Service Worker, Installieren-Knopf weg), Thema kommt an
// (hell/dunkel + Farbe, Akzent gemessen), Übergabe „An BookLedgerPro" ohne Sprung (Calculate-Haken → BLP-Angebotsformular
// vorbefüllt), Offline-Vorrat, Vollbild. Rückgabe 0 grün · 1 ROT · 2 nicht lauffähig.
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
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true, theme: 'light', themeFarbe: 'blau' });
window.__p = { getSettings, updateSettings, navigate, getRoute, shell: () => renderShell(document.getElementById('app'), {}) };
window.__p.shell();
window.__bereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const warte = (fn, arg, ms = 15000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  await warte(() => document.querySelector('.nav-item[data-nav="calculate"]'));
  ok('Menü: Angebotsplaner und Bedarfsanalyse mit dem Original-Bild der App, in der Gruppe Verkauf; BLP-Angebote nicht mehr im Menü', await page.evaluate(() => {
    const c = document.querySelector('.nav-item[data-nav="calculate"]'), n = document.querySelector('.nav-item[data-nav="needs"]');
    return !!c && !!n && !!c.querySelector('img.ic-img[src*="apps/calculate/icons/icon-192.png"]') && !!n.querySelector('img.ic-img[src*="apps/needs/icons/icon-192.png"]') && !document.querySelector('.nav-item[data-nav="angebote"]') && c.closest('.nav-gruppe').querySelector('.nav-gruppe-titel').textContent === 'Verkauf';
  }));
  // Calculate öffnen
  await page.click('.nav-item[data-nav="calculate"]');
  await warte(() => document.querySelector('iframe[data-app-frame="calculate"]'));
  const fc = async () => { for (let i = 0; i < 100; i++) { const f = page.frames().find((x) => /\/apps\/calculate\//.test(x.url())); if (f) return f; await page.waitForTimeout(100); } return null; };
  const frame = await fc();
  ok('Rahmen zeigt apps/calculate/index.html (gleicher Ursprung)', !!frame);
  await frame.waitForFunction(() => window.WC && window.WC.angebot && document.documentElement.getAttribute('data-blp-eingebettet') === '1', null, { timeout: 30000 }).catch(() => null);
  ok('Calculate läuft im Rahmen (WC.angebot), Brücke aktiv (data-blp-eingebettet)', await frame.evaluate(() => !!(window.WC && window.WC.angebot) && document.documentElement.getAttribute('data-blp-eingebettet') === '1' && window.__wcSprungAbfangen === true));
  ok('Rahmen-Leiste: Bild, Name „Workflow Calculate", Vollbild, Eigenes Fenster, Offline bereitlegen; „alte Angebote" ohne alte Daten versteckt', await page.evaluate(() => { const l = document.querySelector('.app-leiste'); return !!l && l.textContent.includes('Workflow Calculate') && !!l.querySelector('img.app-bild') && !!l.querySelector('[data-apps-vollbild]') && !!l.querySelector('[data-apps-fenster][target="_blank"]') && !!l.querySelector('[data-apps-offline]') && l.querySelector('[data-apps-alte-angebote]').hidden; }));
  ok('kein eigener Service Worker der App, keine Anmeldung im HTML', await frame.evaluate(() => !navigator.serviceWorker.controller && !document.documentElement.outerHTML.includes('serviceWorker.register')));
  // Thema: hell/blau → Akzent der App bleibt; dann petrol/dunkel
  await frame.waitForFunction(() => document.documentElement.getAttribute('data-blp-farbe') === 'blau', null, { timeout: 10000 }).catch(() => null);
  const hell = await frame.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), farbe: document.documentElement.getAttribute('data-blp-farbe'), accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() }));
  ok('Thema kommt an: hell + blau → App hell, eigener Blau-Akzent bleibt', hell.theme === 'light' && hell.farbe === 'blau' && hell.accent.toLowerCase() === '#1f6fb2', JSON.stringify(hell));
  await frame.evaluate(() => { window.__marke = 'bleibt'; });
  await page.evaluate(() => window.__p.updateSettings({ theme: 'dark', themeFarbe: 'petrol' }));
  await frame.waitForFunction(() => document.documentElement.getAttribute('data-blp-farbe') === 'petrol' && !document.documentElement.hasAttribute('data-theme'), null, { timeout: 10000 }).catch(() => null);
  const dunkel = await frame.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), farbe: document.documentElement.getAttribute('data-blp-farbe'), accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() }));
  ok('Thema wechselt mit: dunkel + petrol → App dunkel, Petrol-Akzent aus blp-thema.css', dunkel.theme === null && dunkel.farbe === 'petrol' && dunkel.accent.toLowerCase() === '#2dd4bf', JSON.stringify(dunkel));
  ok('die App lädt beim Neuzeichnen der Shell NICHT neu (dauerhaftes Fenster außerhalb der Shell)', await frame.evaluate(() => window.__marke === 'bleibt') && await page.evaluate(() => document.querySelectorAll('#blp-app-frames iframe[data-app-frame="calculate"]').length === 1 && document.querySelectorAll('#content iframe').length === 0));
  await page.waitForTimeout(500);
  const lage = await page.evaluate(() => { const p = document.querySelector('[data-app-platz="calculate"]').getBoundingClientRect(), f = document.querySelector('iframe[data-app-frame="calculate"]').getBoundingClientRect(); return { p: [p.left, p.top, p.width, p.height].map(Math.round), f: [f.left, f.top, f.width, f.height].map(Math.round), d: getComputedStyle(document.querySelector('iframe[data-app-frame="calculate"]')).display }; });
  ok('das Fenster liegt genau über dem Platzhalter der Ansicht', lage.d === 'block' && lage.p.every((v, i) => Math.abs(v - lage.f[i]) <= 1) && lage.f[3] > 300, JSON.stringify(lage));
  const inst = await frame.evaluate(() => { const b = document.getElementById('installieren'); return b ? getComputedStyle(b).display : 'fehlt'; });
  ok('Installieren-Knopf der App im Rahmen ausgeblendet (oder nicht gebaut)', inst === 'none' || inst === 'fehlt', inst);
  // Übergabe ohne Sprung: Calculates Haken → BLP-Angebotsformular
  const nutz = b64u({ v: 1, quelle: 'workflow-calculate', modus: 'angebot', titel: 'Banner 2 m', kundeName: 'Muster GmbH', auftragNr: '', angebotsNr: 'AN-2026-0001', positionen: [{ beschreibung: 'Banner', menge: 2, einzelpreisCent: 5000, ustSatz: 19 }] });
  await frame.evaluate((u) => { window.__wcSprung = u; }, 'https://lausiklauskn-png.github.io/BookLedgerPro/?uebernahme=' + nutz);
  await warte(() => window.__p.getRoute() === 'angebote' && window.__blpAppsUebernahme && window.__blpAppsUebernahme.ok === true);
  await warte(() => document.querySelector('#content') && ([...document.querySelectorAll('#content input')].some((i) => i.value === 'Banner 2 m') || document.querySelector('#content').textContent.includes('Banner 2 m')));
  ok('„An BookLedgerPro" in Calculate bleibt im Rahmen (kein Sprung) und öffnet BLPs Angebotsformular vorbefüllt', await page.evaluate(() => window.__p.getRoute() === 'angebote' && window.__blpAppsUebernahme && window.__blpAppsUebernahme.app === 'calculate' && getComputedStyle(document.querySelector('iframe[data-app-frame="calculate"]')).display === 'none' && ([...document.querySelectorAll('#content input')].some((i) => i.value === 'Banner 2 m') || document.querySelector('#content').textContent.includes('Banner 2 m'))), JSON.stringify(await page.evaluate(() => ({ route: window.__p.getRoute(), ueb: window.__blpAppsUebernahme || null, inhalt: document.querySelector('#content').textContent.slice(0, 160) }))) + ' | Haken: ' + JSON.stringify(await frame.evaluate(() => { const d = Object.getOwnPropertyDescriptor(window, '__wcSprung'); return { set: !!(d && d.set), abfangen: window.__wcSprungAbfangen }; })));
  ok('die Seite selbst blieb BookLedgerPro (keine Navigation nach github.io)', page.url().includes('127.0.0.1'));
  // Needs
  await page.evaluate(() => window.__p.navigate('needs'));
  await warte(() => document.querySelector('iframe[data-app-frame="needs"]'));
  const fn = async () => { for (let i = 0; i < 100; i++) { const f = page.frames().find((x) => /\/apps\/needs\//.test(x.url())); if (f) return f; await page.waitForTimeout(100); } return null; };
  const frameN = await fn();
  await frameN.waitForFunction(() => window.WN && window.WN.bedarf && document.documentElement.getAttribute('data-blp-farbe') === 'petrol', null, { timeout: 30000 }).catch(() => null);
  ok('Needs läuft im Rahmen (WN.bedarf), Brücke aktiv, Thema petrol/dunkel angekommen', await frameN.evaluate(() => !!(window.WN && window.WN.bedarf) && document.documentElement.getAttribute('data-blp-eingebettet') === '1' && document.documentElement.getAttribute('data-blp-farbe') === 'petrol'), JSON.stringify(await frameN.evaluate(() => ({ wn: !!window.WN, bedarf: !!(window.WN && window.WN.bedarf), ein: document.documentElement.getAttribute('data-blp-eingebettet'), farbe: document.documentElement.getAttribute('data-blp-farbe') }))));
  ok('Needs behält Bilder/Emojis und Namen (erkennbar)', await frameN.evaluate(() => document.body.textContent.includes('Workflow Bedarfsanalyse') && !!document.querySelector('img[src*="icon-192"]')));
  ok('Seitenwechsel: Calculate-Fenster bleibt geladen (nur verborgen), Needs-Fenster sichtbar', await page.evaluate(() => getComputedStyle(document.querySelector('iframe[data-app-frame="calculate"]')).display === 'none' && getComputedStyle(document.querySelector('iframe[data-app-frame="needs"]')).display === 'block') && await frame.evaluate(() => window.__marke === 'bleibt'));
  // Offline bereitlegen (Vorrat blpr-apps)
  await page.click('[data-apps-offline]');
  await warte(() => /Offline bereit: \d+ Dateien/.test(document.querySelector('[data-apps-offline-stand]').textContent), null, 60000);
  const vorrat = await page.evaluate(async () => { const hat = await caches.has('blpr-apps'); const n = hat ? (await (await caches.open('blpr-apps')).keys()).length : 0; return { hat, n, text: document.querySelector('[data-apps-offline-stand]').textContent }; });
  ok('„Offline bereitlegen" legt alle Needs-Dateien in den Vorrat blpr-apps (aus HERKUNFT.json)', vorrat.hat && vorrat.n >= 60 && /Offline bereit: 6\d Dateien/.test(vorrat.text), JSON.stringify(vorrat));
  // Vollbild
  await page.click('[data-apps-vollbild]');
  ok('Vollbild: Rahmen liegt über der ganzen Seite, das Fenster folgt', await page.evaluate(() => { const r = document.querySelector('.app-rahmen'); const b = r.getBoundingClientRect(); const f = document.querySelector('iframe[data-app-frame="needs"]').getBoundingClientRect(); return r.classList.contains('vollbild') && Math.round(b.width) === window.innerWidth && Math.round(b.height) === window.innerHeight && f.width > window.innerWidth - 20 && f.height > window.innerHeight * 0.8; }));
  await page.click('[data-apps-vollbild]');
  ok('… und zurück', await page.evaluate(() => !document.querySelector('.app-rahmen').classList.contains('vollbild')));
  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e) + '\n  Seitenfehler: ' + fehler.join(' | ').slice(0, 600));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
