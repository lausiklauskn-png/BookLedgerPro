// tests/smoke_buchhaltungen.mjs — Startbild ohne „+ Neuer Mandant“, weitere Buchhaltung über die Einstellungen
// (Klaus 2026-11-09: „neuer Mandant … völlig überflüssig“ · „Im Privaten … und die private Haushaltsführung“).
// Echter Browser, echter Tresor (setupVault), echte Registry (mandantenStore), echtes showLockScreen.
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. Gegenprobe: BH_WURZEL=<Kopie> node tests/smoke_buchhaltungen.mjs

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

// Schritt 1 legt einen Tresor an (Legacy-DB) und registriert ihn wie main.js; Schritt 2 zeigt das Startbild.
const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
<script type="module">
import { setupVault, vaultExists, lockVault } from './src/core/vault.js';
import { initMandanten } from './src/core/mandantenStore.js';
import { showLockScreen } from './src/ui/lock.js';
const q = new URLSearchParams(location.search);
if (q.get('schritt') === 'anlegen') {
  if (!(await vaultExists())) await setupVault('probe-passwort-123');
  lockVault();
  await initMandanten();
  window.__fertig = true;
} else {
  if (q.get('merker')) sessionStorage.setItem('blpr_weiterer_betrieb', '1');
  await initMandanten();
  window.__bereit = true;
  showLockScreen(document.getElementById('app'));
}
</script></body></html>`;

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
  await page.goto(`${BASIS}/__probe.html?schritt=anlegen`);
  await page.waitForFunction(() => window.__fertig === true);

  console.log('— A. Startbild mit genau einer Buchhaltung —');
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForSelector('input[type=password]');
  const text = await page.textContent('#app');
  ok('Passwortfeld da (Entsperren)', true);
  ok('kein „Neuer Mandant“ und kein „Weitere Buchhaltung“ auf dem Startbild', !/Neuer Mandant|Weitere Buchhaltung|Mandant/.test(text), text.slice(0, 200));

  console.log('— B. aus den Einstellungen: Merker öffnet die Anlage —');
  await page.goto(`${BASIS}/__probe.html?merker=1`);
  await page.waitForFunction(() => /Weitere Buchhaltung anlegen/.test(document.querySelector('#app').textContent));
  const t2 = await page.textContent('#app');
  ok('Überschrift „Weitere Buchhaltung anlegen“', /Weitere Buchhaltung anlegen/.test(t2));
  ok('Beispiele Laden und Haushalt genannt', /Haushalt/.test(t2) && /Alis Moderaum/.test(t2));
  ok('Merker ist danach weg (einmalig)', await page.evaluate(() => sessionStorage.getItem('blpr_weiterer_betrieb') === null));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForSelector('input[type=password]');
  ok('nach Neuladen wieder das normale Startbild', !/Weitere Buchhaltung anlegen/.test(await page.textContent('#app')));

  console.log('— C. Einstellungen —');
  const shell = await readFile(join(WURZEL, 'src/ui/shell.js'), 'utf8');
  ok('Einstellungen haben „+ Weitere Buchhaltung anlegen“ (data-weiterer-betrieb, setzt den Merker)',
    /data-weiterer-betrieb/.test(shell) && /sessionStorage\.setItem\('blpr_weiterer_betrieb', '1'\)/.test(shell));
  const nm = await import(join(WURZEL, 'src/domain/nutzungsmodus.js'));
  ok('„Buchhaltungen auf diesem Gerät“ in jedem Modus sichtbar', ['privat', 'kleinunternehmer', 'selbststaendig', 'berater']
    .every((m) => nm.zeigeEinstellung({ nutzungsmodus: m }, nm.EINSTELLUNG.MANDANTEN) && nm.zeigeFeature({ nutzungsmodus: m }, nm.FEATURE.MANDANTEN)));
  ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
} catch (e) {
  ok('Probe lief durch', false, String(e && e.message || e));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
