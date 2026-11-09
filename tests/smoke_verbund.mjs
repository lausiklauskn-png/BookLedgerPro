// tests/smoke_verbund.mjs — Vorschau-Hilfe „Pro-App-Verbund“ (Klaus 2026-11-09: „Jetzt die Karte in die Apps einbauen“).
// Echter Browser: Anleitung mit dem Kasten, Tipp öffnet den Vollbild-Rahmen, die Karte lädt (#graph im Rahmen),
// „Schließen“ und die Zurück-Taste schließen, keine Seitenfehler. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
// Gegenprobe: BH_WURZEL=<Kopie ohne verbundKasten()> node tests/smoke_verbund.mjs → ROT.

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
import { mountAnleitung } from './src/ui/views/anleitung.js';
mountAnleitung(document.getElementById('app'));
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
  for (const breite of [1000, 360]) {
    console.log(`— Breite ${breite} px —`);
    const ctx = await browser.newContext({ viewport: { width: breite, height: 800 } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', (e) => fehler.push(String(e.message || e)));
    await page.goto(`${BASIS}/__probe.html`);
    await page.waitForFunction(() => window.__bereit === true);
    const kasten = await page.$('[data-verbund-kasten]');
    ok('Kasten „Pro-App-Verbund (Vorschau)“ in der Anleitung', !!kasten && /Pro-App-Verbund \(Vorschau\)/.test(await kasten.textContent()));
    if (!kasten) { await ctx.close(); continue; }
    ok('Knopf sichtbar', await page.isVisible('[data-verbund-oeffnen]'));
    const laenge = await page.evaluate(() => history.length);
    await page.click('[data-verbund-oeffnen]');
    await page.waitForSelector('[data-verbund-rahmen]');
    const mass = await page.evaluate(() => { const r = document.querySelector('[data-verbund]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height, innerWidth, innerHeight]; });
    ok('Rahmen deckt das ganze Fenster', mass[0] === 0 && mass[1] === 0 && Math.abs(mass[2] - mass[4]) < 1 && Math.abs(mass[3] - mass[5]) < 1, JSON.stringify(mass));
    ok('kein neues Fenster', ctx.pages().length === 1);
    const frame = await (await page.$('[data-verbund-rahmen]')).contentFrame();
    await frame.waitForSelector('#graph');
    ok('Karte lädt im Rahmen (#graph, Titel „Pro-App-Verbund“)', (await frame.title()) === 'Pro-App-Verbund');
    await page.click('[data-verbund-zu]');
    await page.waitForFunction(() => !document.querySelector('[data-verbund]'));
    ok('„Schließen“ schließt den Rahmen und baut den Verlaufseintrag ab', await page.evaluate((l) => history.length >= l && !(history.state && history.state.blpVerbund), laenge));
    await page.click('[data-verbund-oeffnen]');
    await page.waitForSelector('[data-verbund-rahmen]');
    await page.goBack({ waitUntil: 'commit' }).catch(() => {});
    await page.waitForFunction(() => !document.querySelector('[data-verbund]'));
    ok('Zurück-Taste schließt den Rahmen, die Anleitung bleibt', !!(await page.$('[data-verbund-kasten]')));
    await page.click('[data-verbund-oeffnen]');
    await page.waitForSelector('[data-verbund-rahmen]');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-verbund]'));
    ok('Esc schließt den Rahmen', true);
    await ctx.close();
  }
  ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
} catch (e) {
  ok('Probe lief durch', false, String(e && e.message || e) + ' · ' + fehler.join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
