// tests/smoke_updatefahne.mjs — Update-Fähnchen im Kopf (Klaus 2026-11-13, 0.1.18): erscheint von selbst, wenn ein Update
// bereitsteht; kein Fähnchen bei gleicher Fassung; ohne Netz still (kein Fähnchen, keine Fehlermeldung).
// Echter Browser, echte Shell. Gestellt: die Brücke window.BLPNative (App) bzw. die Antwort auf version.json (PWA).
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. Gegenprobe: BH_WURZEL=<Kopie> node tests/smoke_updatefahne.mjs

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
const CHROMIUM = ['/opt/pw-browsers/chromium/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const EIGENE = (readFileSync(join(WURZEL, 'src/ui/updateFahne.js'), 'utf8').match(/export const FASSUNG = '(v\d+)';/) || [])[1] || '';
const NEUER = 'v' + (Number(EIGENE.slice(1)) + 1);

// Gestellte Brücke: window.__lage = 'gleich' | 'neu' | 'weg' (vor dem Laden gesetzt, zur Laufzeit umstellbar).
const BRUECKE = `
window.__ruf = { pruefen: 0, installieren: 0 };
window.BLPNative = Object.freeze({ plattform: 'android', speichern: null, tresor: null, sprechen: null,
  version: async () => '0.1.18',
  updates: Object.freeze({
    pruefen: async () => { window.__ruf.pruefen++;
      if (window.__lage === 'weg') { const e = new Error('UPDATE_NICHT_ERREICHBAR'); e.code = 'UPDATE_NICHT_ERREICHBAR'; throw e; }
      return window.__lage === 'neu' ? { neu: '0.1.19', installiert: '0.1.18', groesse: 6291456 } : { aktuell: true, version: '0.1.18' }; },
    installieren: async () => { window.__ruf.installieren++; return {}; },
    beiStand: () => ({ remove() {} }),
  }) });`;

const PROBE = (app) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">${app ? '<script>' + BRUECKE + '</script>' : ''}</head>
<body><div id="app-root"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, navigate } from './src/state.js';
import { ensureAccountsSeeded } from './src/domain/store.js';
import { renderShell } from './src/ui/shell.js';
import * as fahne from './src/ui/updateFahne.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig' });
await ensureAccountsSeeded();
renderShell(document.getElementById('app-root'), { onLock: () => {} });
window.__probe = { navigate, fahne };
window.__probeBereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__app.html' || pfad === '/__pwa.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(pfad === '/__app.html')); }
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

// Lage des Fähnchens, gemessen wie ein Mensch es sieht (Rechtecke UND checkVisibility).
const lage = (page) => page.evaluate(() => {
  const f = document.querySelector('[data-update-fahne]'), v = document.querySelector('[data-kopf-version]'), n = document.querySelector('.brand-name'), k = document.querySelector('.app-header');
  if (!f) return { da: false, sichtbar: false };
  const r = f.getBoundingClientRect(), sichtbar = !f.hidden && f.getClientRects().length > 0 && r.width > 0 && (typeof f.checkVisibility !== 'function' || f.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
  const rv = v && !v.hidden ? v.getBoundingClientRect() : null, rn = n.getBoundingClientRect(), rk = k.getBoundingClientRect();
  return { da: true, sichtbar, text: f.textContent, titel: f.title, art: f.getAttribute('data-update-fahne'), h: Math.round(r.height),
    linksVonVersion: rv ? r.right <= rv.left + 1 : null, gleicheZeile: rv ? Math.abs((r.top + r.bottom) / 2 - (rv.top + rv.bottom) / 2) <= 3 : null,
    versionRechts: rv ? Math.abs(rv.right - rn.right) <= 2 : null, unterName: r.top >= rn.bottom - 2, imKopf: r.bottom <= rk.bottom + 1 && r.left >= 0 && r.right <= innerWidth,
    quer: document.documentElement.scrollWidth > innerWidth + 1 };
});
// Sichtbarer Fehlertext irgendwo (Meldung, Dialog, Status): das stille Prüfen darf nichts davon erzeugen.
const fehlertext = (page) => page.evaluate(() => /Update nicht möglich|nicht erreichbar|Failed to fetch|UPDATE_/.test(document.body.innerText) || !!document.querySelector('[data-update-popover], dialog[open], .toast'));

// Ein Tipp wie ein Nutzer — fehlt das Ziel, wird das GEMELDET statt 15 s gewartet und gestolpert (sonst bleibt alles dahinter ungemessen).
async function tipp(page, sel) {
  try { await page.click(sel, { timeout: 3000 }); return true; } catch { ok('Tipp auf ' + sel + ' möglich', false, 'nicht sichtbar'); return false; }
}
async function oeffnen(art, { breite = 1000, lageApp = 'gleich', versionJson = undefined } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 800 } });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  const fehler = []; page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/version\.json|Failed to load resource/.test(m.text())) fehler.push('console: ' + m.text()); });
  const z = { abrufe: 0, json: versionJson };
  await page.route('**/version.json*', async (route) => {
    z.abrufe++;
    if (z.json === 'weg') return route.abort('internetdisconnected');
    if (z.json === undefined) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(z.json) });
  });
  await page.addInitScript((l) => { window.__lage = l; }, lageApp);
  await page.goto(`${BASIS}/__${art}.html`);
  await page.waitForFunction(() => window.__probeBereit === true);
  await page.waitForSelector('.app-header');
  return { ctx, page, fehler, z };
}
// Wartet, bis die erste stille Frage hinausging UND beantwortet ist (Bedingung, keine blosse Frist).
const gefragtApp = async (page) => { await page.waitForFunction(() => window.__ruf && window.__ruf.pruefen >= 1, null, { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300); };
const gefragtPwa = async (page, z) => { const bis = Date.now() + 8000; while (!z.abrufe && Date.now() < bis) await page.waitForTimeout(100); await page.waitForTimeout(400); };

try {
  console.log('— A. App, gleiche Fassung —');
  { const { ctx, page, fehler } = await oeffnen('app', { lageApp: 'gleich' }); await gefragtApp(page);
    const ruf = await page.evaluate(() => window.__ruf), l = await lage(page);
    ok('es wurde von selbst gefragt (ohne Tipp), nichts installiert', ruf.pruefen >= 1 && ruf.installieren === 0, JSON.stringify(ruf));
    ok('kein Fähnchen bei gleicher Fassung', l.da && !l.sichtbar, JSON.stringify(l));
    ok('Version steht weiter rechtsbündig unter dem Namen', l.versionRechts === true, JSON.stringify(l));
    ok('kein Fenster, keine Meldung, keine Fehler', !(await fehlertext(page)) && fehler.length === 0, fehler.join(' | '));
    await ctx.close(); }

  console.log('— B. App, neuere Fassung —');
  for (const breite of [1000, 400, 320]) {
    const { ctx, page, fehler } = await oeffnen('app', { lageApp: 'neu', breite });
    await page.waitForFunction(() => { const f = document.querySelector('[data-update-fahne]'); return f && !f.hidden; }, null, { timeout: 8000 }).catch(() => {});
    const l = await lage(page);
    ok(`${breite} px: Fähnchen „Update 0.1.19“ erscheint von selbst`, l.sichtbar && l.text === 'Update 0.1.19' && l.art === 'app', JSON.stringify(l));
    ok(`${breite} px: neben der Version (links davon, gleiche Zeile), Version bleibt rechtsbündig, im Kopf, flach (≤ 20 px), kein Querlaufen`,
      l.linksVonVersion === true && l.gleicheZeile === true && l.versionRechts === true && l.unterName && l.imKopf && l.h <= 20 && !l.quer, JSON.stringify(l));
    if (breite === 1000) {
      ok('vor dem Tipp: kein Fenster, nichts installiert', !(await page.$('[data-update-popover]')) && (await page.evaluate(() => window.__ruf.installieren)) === 0);
      await page.evaluate(() => window.__probe.navigate('journal')); await page.waitForTimeout(400);
      ok('nach dem Neuzeichnen (andere Ansicht) steht das Fähnchen noch da', (await lage(page)).sichtbar);
      await tipp(page, '[data-update-fahne]');
      await page.waitForSelector('[data-update-popover] [data-update-installieren]', { timeout: 5000 }).catch(() => {});
      const pop = await page.evaluate(() => { const p = document.querySelector('[data-update-popover]'); return p ? { text: p.textContent, los: !!p.querySelector('[data-update-installieren]') } : null; });
      ok('Tipp = der vorhandene Weg: Fenster mit „Neu: 0.1.19“ und „Laden und installieren“', !!pop && pop.los && /Neu: 0\.1\.19 \(du hast 0\.1\.18\)/.test(pop.text), JSON.stringify(pop));
      await tipp(page, '[data-update-fahne]');
      await page.waitForSelector('[data-update-popover] [data-update-installieren]', { timeout: 5000 }).catch(() => {});
      ok('zweiter Tipp aufs Fähnchen lässt genau EIN Fenster stehen (es schließt nicht einfach)', (await page.$$('[data-update-popover]')).length === 1);
      await tipp(page, '[data-update-installieren]'); await page.waitForTimeout(300);
      ok('„Laden und installieren“ ruft die Brücke (erst jetzt)', (await page.evaluate(() => window.__ruf.installieren)) === 1);
      // Solange das Angebot im Fenster steht, fragt das stille Prüfen nicht dazwischen (die Hülle merkt sich das geprüfte Angebot).
      const vor = await page.evaluate(() => window.__ruf.pruefen);
      await page.evaluate(() => window.__probe.fahne.stillPruefen()); await page.waitForTimeout(200);
      ok('stilles Prüfen fragt nicht dazwischen, solange das Angebot im Fenster steht', (await page.evaluate(() => window.__ruf.pruefen)) === vor);
    }
    ok(`${breite} px: keine Fehler auf der Seite`, fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }

  console.log('— C. App ohne Netz (Server nicht erreichbar) —');
  { const { ctx, page, fehler } = await oeffnen('app', { lageApp: 'weg' }); await gefragtApp(page);
    const l = await lage(page);
    ok('gefragt, aber kein Fähnchen', (await page.evaluate(() => window.__ruf.pruefen)) >= 1 && !l.sichtbar, JSON.stringify(l));
    ok('still: keine Fehlermeldung, kein Fenster, keine Fehler auf der Seite', !(await fehlertext(page)) && fehler.length === 0, fehler.join(' | '));
    // Später ist das Netz da und es gibt ein Update: beim Zurückholen/nächsten Fragen erscheint es.
    await page.evaluate(async () => { window.__lage = 'neu'; await window.__probe.fahne.stillPruefen(); });
    ok('kommt das Netz zurück und es gibt ein Update, erscheint das Fähnchen beim nächsten Fragen', (await lage(page)).sichtbar);
    // … und ein späterer Fehlschlag nimmt es nicht wieder weg.
    await page.evaluate(async () => { window.__lage = 'weg'; await window.__probe.fahne.stillPruefen(); });
    ok('ein späterer Fehlschlag nimmt ein gezeigtes Fähnchen nicht weg', (await lage(page)).sichtbar && !(await fehlertext(page)));
    await ctx.close(); }

  console.log('— D. PWA (auch BookLedger Basic): version.json neben der Seite —');
  { const { ctx, page, fehler, z } = await oeffnen('pwa', { versionJson: undefined }); await gefragtPwa(page, z);
    const l = await lage(page);
    ok('die echte version.json wird von selbst gefragt', z.abrufe >= 1);
    ok('echte version.json = eigene Fassung (' + EIGENE + '): kein Fähnchen', l.da && !l.sichtbar, JSON.stringify(l));
    ok('keine Version im Kopf (PWA), keine Fehler', l.versionRechts === null && fehler.length === 0, fehler.join(' | '));
    await ctx.close(); }
  { const { ctx, page, fehler, z } = await oeffnen('pwa', { versionJson: { version: '0.1.19', cache: NEUER } });
    await page.waitForFunction(() => { const f = document.querySelector('[data-update-fahne]'); return f && !f.hidden; }, null, { timeout: 8000 }).catch(() => {});
    const l = await lage(page);
    ok('neuere Fassung auf dem Server (' + NEUER + '): Fähnchen „Update“ unter dem Namen, im Kopf, flach', l.sichtbar && l.text === 'Update' && l.art === 'pwa' && l.unterName && l.imKopf && l.h <= 20 && !l.quer, JSON.stringify(l));
    ok('Hinweis sagt, was der Tipp tut (neu laden)', /Neuladen/.test(l.titel || ''), l.titel);
    ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
    await page.evaluate(() => { window.__vorher = true; });
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 12000 }).catch(() => null), tipp(page, '[data-update-fahne]')]);
    // Nach dem Neuladen meldet die Probenseite „Tresor existiert bereits“ (sie legt ihn zweimal an) — das ist die Probe, nicht die App.
    ok('Tipp lädt die Seite neu', (await page.evaluate(() => window.__vorher)) !== true);
    await ctx.close(); }
  { const { ctx, page, fehler, z } = await oeffnen('pwa', { versionJson: { version: '0.1.16', cache: 'v' + (Number(EIGENE.slice(1)) - 1) } }); await gefragtPwa(page, z);
    ok('ältere Fassung auf dem Server: kein Fähnchen', !(await lage(page)).sichtbar && fehler.length === 0);
    await ctx.close(); }
  { const { ctx, page, fehler, z } = await oeffnen('pwa', { versionJson: 'weg' }); await gefragtPwa(page, z);
    ok('ohne Netz (Abruf bricht ab): gefragt, kein Fähnchen', z.abrufe >= 1 && !(await lage(page)).sichtbar);
    ok('still: keine Fehlermeldung, keine Fehler auf der Seite', !(await fehlertext(page)) && fehler.length === 0, fehler.join(' | '));
    await ctx.close(); }
  { const { ctx, page, z } = await oeffnen('pwa', { versionJson: { version: '0.1.19', cache: NEUER } });
    await ctx.setOffline(true); await page.evaluate(() => window.__probe.fahne._zuruecksetzen()); const vor = z.abrufe;
    await page.evaluate(() => window.__probe.fahne.stillPruefen());
    ok('meldet der Browser „offline“, wird gar nicht erst gefragt', z.abrufe === vor);
    await ctx.close(); }
} catch (e) {
  ok('Probe lief durch', false, String((e && e.message) || e));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
