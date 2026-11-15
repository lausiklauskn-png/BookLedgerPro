// tests/smoke_discovery.mjs — Hilfe-Seite „Discovery“ (Klaus 2026-11-15: „Da wo der Sortierkern drin ist, Discovery nachziehen“).
// Echter Browser:
//   A  Anleitung mit dem Kasten direkt nach der Verbund-Karte, Tipp öffnet den Vollbild-Rahmen, die Seite lädt im Rahmen
//      (SPRECHTEXTE mit 13 Einträgen, kein Rückweg-Knopf der Seite), jede Tonspur und der Film sind abrufbar,
//      „Schließen“, Zurück-Taste und Esc schließen, keine Seitenfehler.
//   B  echter sw.js: Abruf legt die ganze Datei in den Discovery-Vorrat, Stücke (Range) kommen als 206 aus dem Vorrat,
//      ohne Server läuft Abgerufenes weiter, Film und Ton stehen nicht im Pflicht-Vorrat.
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
// Gegenprobe: BH_WURZEL=<Kopie ohne discoveryKasten() bzw. ohne den Discovery-Zweig in sw.js> node tests/smoke_discovery.mjs → ROT.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
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

const PIN = JSON.parse(readFileSync(join(WURZEL, 'assets/discovery/HERKUNFT.json'), 'utf8'));
const TON = Object.keys(PIN.dateien).filter((f) => f.startsWith('discovery-ton/'));

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
<script type="module">
import { mountAnleitung } from './src/ui/views/anleitung.js';
import { ladeSymbole } from './src/ui/icons.js';
try { await ladeSymbole(); } catch {}
mountAnleitung(document.getElementById('app'));
window.__bereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
let discoveryAus = false;                       // Teil B: „Server kennt die Discovery nicht mehr“ (wie offline)
const gesehen = [];                             // Discovery-Anfragen am Server: [Pfad, Range|'']
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  if (pfad === '/__leer.html' || pfad === '/' || pfad === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><meta charset="utf-8"><body></body>'); }
  if (pfad.startsWith('/assets/discovery/') && !pfad.endsWith('HERKUNFT.json')) {
    gesehen.push([pfad, req.headers.range || '']);
    if (discoveryAus) { res.writeHead(503); return res.end(); }
  }
  const datei = join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try {
    const b = await readFile(datei);
    const typ = TYP[extname(datei)] || 'application/octet-stream';
    const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (m) {                                    // wie ein echter Server: Stücke als 206
      const a = Number(m[1]), e = m[2] === '' ? b.length - 1 : Math.min(Number(m[2]), b.length - 1);
      res.writeHead(206, { 'content-type': typ, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${e}/${b.length}`, 'content-length': e - a + 1 });
      return res.end(b.subarray(a, e + 1));
    }
    res.writeHead(200, { 'content-type': typ, 'accept-ranges': 'bytes', 'content-length': b.length }); res.end(b);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASIS = `http://127.0.0.1:${server.address().port}`;
let browser;
try { browser = await pw.chromium.launch(CHROMIUM ? { executablePath: CHROMIUM, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }

const fehler = [];
try {
  for (const breite of [1000, 360]) {
    console.log(`— A. Breite ${breite} px —`);
    const ctx = await browser.newContext({ viewport: { width: breite, height: 800 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', (e) => fehler.push(String(e.message || e)));
    await page.goto(`${BASIS}/__probe.html`);
    await page.waitForFunction(() => window.__bereit === true);
    const kasten = await page.$('[data-discovery-kasten]');
    const text = kasten ? await kasten.textContent() : '';
    ok('Kasten „Discovery“ in der Anleitung, mit dem Satz zum Sortier-Kern, ohne Emoji', !!kasten && /Discovery/.test(text) && /Sortier-Kern/.test(text) && !/\p{Extended_Pictographic}/u.test(text), text.slice(0, 80));
    if (!kasten) { await ctx.close(); continue; }
    ok('Kasten steht direkt nach der Verbund-Karte', await page.evaluate(() => document.querySelector('[data-verbund-kasten]')?.nextElementSibling === document.querySelector('[data-discovery-kasten]')));
    ok('Knopf sichtbar, mit Strichsymbol', await page.isVisible('[data-discovery-oeffnen]') && await page.evaluate(() => !!document.querySelector('[data-discovery-oeffnen] svg.ic use')));
    ok('Knopf läuft nicht über den Kasten hinaus (A5)', await page.evaluate(() => { const k = document.querySelector('[data-discovery-kasten]').getBoundingClientRect(), b = document.querySelector('[data-discovery-oeffnen]').getBoundingClientRect(); return b.left >= k.left && b.right <= k.right + .5 && document.documentElement.scrollWidth <= innerWidth; }));
    const laenge = await page.evaluate(() => history.length);
    await page.click('[data-discovery-oeffnen]');
    await page.waitForSelector('[data-discovery-rahmen]');
    const mass = await page.evaluate(() => { const r = document.querySelector('[data-discovery]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height, innerWidth, innerHeight]; });
    ok('Rahmen deckt das ganze Fenster', mass[0] === 0 && mass[1] === 0 && Math.abs(mass[2] - mass[4]) < 1 && Math.abs(mass[3] - mass[5]) < 1, JSON.stringify(mass));
    ok('kein neues Fenster', ctx.pages().length === 1);
    const frame = await (await page.$('[data-discovery-rahmen]')).contentFrame();
    await frame.waitForFunction(() => { try { return typeof SPRECHTEXTE === 'object' && document.readyState === 'complete'; } catch { return false; } });
    const schluessel = await frame.evaluate(() => Object.keys(SPRECHTEXTE));
    ok('Seite lädt im Rahmen: SPRECHTEXTE mit 13 Einträgen', schluessel.length === 13 && schluessel.every((k) => typeof k === 'string'), schluessel.length + ': ' + schluessel.join(' '));
    ok('three.js liegt bei und ist geladen', await frame.evaluate(() => typeof THREE === 'object' && !!THREE.REVISION));
    ok('im Rahmen zeigt die Seite keinen eigenen Rückweg-Knopf', await frame.evaluate(() => !document.querySelector('[data-zurueck]')));
    const ton = await frame.evaluate(async (ks) => { const aus = []; for (const k of ks) { const r = await fetch('discovery-ton/' + k + '.mp3'); const b = await r.arrayBuffer(); aus.push([k, r.status, r.headers.get('content-type'), b.byteLength]); } return aus; }, schluessel);
    ok('alle 13 Tonspuren neben der Seite abrufbar (je Sprechtext eine)', ton.length === 13 && ton.every((x) => x[1] === 200 && /audio/.test(x[2]) && x[3] > 10000), JSON.stringify(ton.filter((x) => x[1] !== 200)));
    const spielt = await frame.evaluate((k) => new Promise((fertig) => { const a = new Audio('discovery-ton/' + k + '.mp3'); a.preload = 'auto'; a.addEventListener('loadedmetadata', () => fertig(a.duration)); a.addEventListener('error', () => fertig(-1)); setTimeout(() => fertig(-2), 8000); }), schluessel[0]);
    ok('eine Tonspur lässt sich als Ton laden (Dauer > 1 s)', spielt > 1, String(spielt));
    const film = await frame.evaluate(async () => { const r = await fetch('discovery-kreislauf.mp4', { headers: { Range: 'bytes=0-1023' } }); return [r.status, (await r.arrayBuffer()).byteLength]; });
    ok('Film neben der Seite abrufbar (Stück-Anfrage)', film[0] === 206 && film[1] === 1024, JSON.stringify(film));
    await page.click('[data-discovery-zu]');
    await page.waitForFunction(() => !document.querySelector('[data-discovery]'));
    ok('„Schließen“ schließt den Rahmen und baut den Verlaufseintrag ab', await page.evaluate((l) => history.length >= l && !(history.state && history.state.blpDiscovery), laenge));
    await page.click('[data-discovery-oeffnen]');
    await page.waitForSelector('[data-discovery-rahmen]');
    await (await (await page.$('[data-discovery-rahmen]')).contentFrame()).waitForFunction(() => document.readyState === 'complete');
    await page.goBack({ waitUntil: 'commit' }).catch(() => {});
    await page.waitForFunction(() => !document.querySelector('[data-discovery]'));
    ok('Zurück-Taste schließt den Rahmen, die Anleitung bleibt', !!(await page.$('[data-discovery-kasten]')));
    await page.click('[data-discovery-oeffnen]');
    await page.waitForSelector('[data-discovery-rahmen]');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-discovery]'));
    ok('Esc schließt den Rahmen', true);
    // Die Verbund-Karte daneben geht weiter auf (gleicher Rahmen-Stil, eigener Zustand).
    await page.click('[data-verbund-oeffnen]');
    await page.waitForSelector('[data-verbund-rahmen]');
    await page.click('[data-verbund-zu]');
    await page.waitForFunction(() => !document.querySelector('[data-verbund]'));
    ok('Verbund-Karte daneben öffnet und schließt weiter', true);
    await ctx.close();
  }
  ok('keine Fehler auf der Seite (App und Discovery im Rahmen)', fehler.length === 0, fehler.join(' | '));

  console.log('— B. Echter Worker: Vorrat beim Abruf, Stücke aus dem Vorrat, ohne Server —');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(BASIS + '/__leer.html');
  await page.evaluate(async () => { await navigator.serviceWorker.register('./sw.js', { scope: './' }); await navigator.serviceWorker.ready; });
  await page.reload();
  ok('der Worker steuert die Seite (Ausgangslage)', await page.evaluate(() => !!navigator.serviceWorker.controller));
  const vorrat = await page.evaluate(async () => (await caches.keys()).find((k) => /-discovery-/.test(k)) || '');
  const imVorrat = () => page.evaluate(async () => { const n = (await caches.keys()).find((k) => /-discovery-/.test(k)); return n ? (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname.replace('/assets/discovery/', '')) : []; });
  const schale = await page.evaluate(async () => { const n = (await caches.keys()).find((k) => /-shell-/.test(k)); return (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname); });
  ok('Pflicht-Vorrat: Einstieg und Pin ja, Film/Ton/Seite nein', schale.includes('/src/ui/discoveryKarte.js') && schale.includes('/assets/discovery/HERKUNFT.json') && !schale.some((p) => p.startsWith('/assets/discovery/') && !p.endsWith('HERKUNFT.json')) && (await imVorrat()).length === 0);
  const T = TON[0];
  const voll = await page.evaluate(async (f) => { const r = await fetch('./assets/discovery/' + f); return [r.status, (await r.arrayBuffer()).byteLength]; }, T);
  ok('Abruf einer Tonspur legt sie in den Discovery-Vorrat', voll[0] === 200 && voll[1] > 10000 && (await imVorrat()).includes(T), JSON.stringify(await imVorrat()));
  ok('Vorrat trägt den Pin-Commit im Namen', (vorrat || await page.evaluate(async () => (await caches.keys()).find((k) => /-discovery-/.test(k)) || '')).endsWith('-discovery-' + PIN.commit.slice(0, 7)));
  gesehen.length = 0;
  const stueck = await page.evaluate(async (f) => {
    const ganz = new Uint8Array(await (await fetch('./assets/discovery/' + f)).arrayBuffer());
    const r = await fetch('./assets/discovery/' + f, { headers: { Range: 'bytes=100-299' } });
    const b = new Uint8Array(await r.arrayBuffer());
    const ende = await fetch('./assets/discovery/' + f, { headers: { Range: 'bytes=' + (ganz.length - 50) + '-' } });
    const eb = new Uint8Array(await ende.arrayBuffer());
    const zuweit = await fetch('./assets/discovery/' + f, { headers: { Range: 'bytes=' + (ganz.length + 5) + '-' } });
    return { status: r.status, cr: r.headers.get('content-range'), n: b.length, gleich: b.every((x, i) => x === ganz[100 + i]), g: ganz.length,
      endeStatus: ende.status, endeGleich: eb.length === 50 && eb.every((x, i) => x === ganz[ganz.length - 50 + i]), zuweit: zuweit.status };
  }, T);
  ok('Stück-Anfrage (Range) kommt als 206 mit den richtigen Bytes', stueck.status === 206 && stueck.n === 200 && stueck.gleich && stueck.cr === `bytes 100-299/${stueck.g}` && stueck.endeStatus === 206 && stueck.endeGleich && stueck.zuweit === 416, JSON.stringify(stueck));
  ok('… aus dem Vorrat, nicht vom Server', gesehen.length === 0, JSON.stringify(gesehen));
  // Film noch nicht im Vorrat: die Stück-Anfrage geht durch (Film startet sofort), die ganze Datei kommt daneben in den Vorrat.
  const film = await page.evaluate(async () => { const r = await fetch('./assets/discovery/discovery-kreislauf.mp4', { headers: { Range: 'bytes=0-2047' } }); return [r.status, (await r.arrayBuffer()).byteLength]; });
  let filmDa = false;
  for (let i = 0; i < 80 && !filmDa; i++) { filmDa = (await imVorrat()).includes('discovery-kreislauf.mp4'); if (!filmDa) await page.waitForTimeout(100); }
  ok('Film: erstes Stück sofort (206), danach liegt der ganze Film im Vorrat', film[0] === 206 && film[1] === 2048 && filmDa);
  await page.evaluate(async () => { await (await fetch('./assets/discovery/discovery.html')).text(); await (await fetch('./assets/discovery/discovery-three.min.js')).text(); });
  discoveryAus = true;
  const ohne = await page.evaluate(async (f) => {
    const a = await fetch('./assets/discovery/' + f), b = await fetch('./assets/discovery/discovery-kreislauf.mp4', { headers: { Range: 'bytes=1000-1999' } });
    const c = await fetch('./assets/discovery/discovery.html'), d = await fetch('./assets/discovery/discovery-kreislauf.jpg');
    return [a.status, b.status, (await b.arrayBuffer()).byteLength, c.status, /SPRECHTEXTE/.test(await c.text()), d.status];
  }, T);
  ok('ohne Server: Abgerufenes (Ton, Film-Stück, Seite) läuft aus dem Vorrat; nie Abgerufenes fehlt ehrlich', ohne[0] === 200 && ohne[1] === 206 && ohne[2] === 1000 && ohne[3] === 200 && ohne[4] === true && ohne[5] !== 200, JSON.stringify(ohne));
  // Die Seite selbst im Rahmen, ohne Server: lädt aus dem Vorrat.
  await page.evaluate(() => { const f = document.createElement('iframe'); f.id = 'r'; f.src = './assets/discovery/discovery.html'; f.style.cssText = 'width:900px;height:600px'; document.body.appendChild(f); });
  const frame = await (await page.waitForSelector('#r')).contentFrame();
  await frame.waitForFunction(() => { try { return typeof SPRECHTEXTE === 'object' && typeof THREE === 'object'; } catch { return false; } });
  ok('ohne Server: die Seite öffnet im Rahmen aus dem Vorrat', true);
  discoveryAus = false;
  await ctx.close();
} catch (e) {
  ok('Probe lief durch', false, String(e && e.message || e) + ' · ' + fehler.join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
