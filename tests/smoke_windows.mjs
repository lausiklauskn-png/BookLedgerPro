// tests/smoke_windows.mjs — Klebstoff native/blp-native.js in der Windows-Hülle (Pro-Umbau 5, Klaus 2026-10-28).
//
//   node tests/smoke_windows.mjs        (Chromium + playwright/playwright-core aus der Umgebung)
//
// Echt: Shell, Tresor der App, native/blp-native.js, native/pro-bedienung.js, src/ui/i18n.js. GESTELLT: die Brücke der
// Windows-Hülle (windows/bridge/capacitor-tauri.js meldet getPlatform() = 'windows') mit BlpTresor, BlpFiles, BlpIncoming,
// BlpSpeech, BlpFenster. Geprüft: Plattform, keine Android-Sätze in irgendeiner Ansicht (Gegenprobe im Lauf: dieselbe Seite
// als Android-App zeigt sie), „Teilen“ = Speichern unter mit Satz, Hineinziehen und „Öffnen mit“ landen im Eingang der Seite,
// Schließen fragt bei laufender Aufgabe und sichert vorher. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const BRUECKE = (plattform) => `
window.__log = [];
(function () {
  const z = window.__z = { gewaehlt: true, vorhanden: true, offen: false, gemerkt: true, erreichbar: true, ordner: 'Tresorordner', pfad: 'C:\\\\Users\\\\Klaus\\\\Tresorordner', speicher: '' };
  const log = (m, a) => window.__log.push([m, JSON.parse(JSON.stringify(a || {}))]);
  const zustand = () => ({ ...z, faecher: z.offen ? [] : undefined, ersatz: z.offen ? { vorhanden: false } : undefined });
  const T = {
    zustand: async () => (log('zustand'), zustand()), ordnerWaehlen: async () => zustand(),
    anlegen: async () => zustand(), entsperren: async (a) => { log('entsperren', a); z.offen = true; return zustand(); },
    sperren: async () => { z.offen = false; return zustand(); }, ordnerOeffnen: async (a) => { log('ordnerOeffnen', a); return {}; },
    verzeichnis: async () => ({ eintraege: [], marken: [] }), appOeffnen: async (a) => { log('appOeffnen', a); throw Object.assign(new Error('APP_FEHLT'), { code: 'APP_FEHLT' }); },
    ablegenBeginnen: async (a) => { log('ablegenBeginnen', a); return { ticket: 't1' }; }, ablegenTeil: async () => ({}),
    ablegenFertig: async () => { log('ablegenFertig'); return { id: 'e1', groesse: 1 }; }, ablegenAbbrechen: async () => ({}),
    lesenOeffnen: async () => ({ ticket: 'l', name: 'x', art: '', groesse: 0 }), lesenTeil: async () => ({ data: '', fertig: true }),
    markieren: async () => ({}), passwortAendern: async () => ({}), ersatzErstellen: async () => ({ teile: [] }), wiederherstellen: async () => zustand(),
  };
  const F = { save: async (a) => { log('save', { name: a.name }); return { saved: true }; }, share: async (a) => { log('share', { name: a.name }); return { saved: true, shared: false }; }, appInfo: async () => ({ version: '0.1.1' }) };
  let hoerer = null; window.__eingang = null;
  const I = {
    addListener: async (n, fn) => { if (n === 'available') hoerer = fn; return { remove: async () => {} }; },
    pending: async () => window.__eingang ? { id: 'b1', files: [{ id: 'f1', name: window.__eingang.name, mime: 'application/pdf', size: 5 }] } : { empty: true },
    read: async () => ({ data: btoa('%PDF-'), done: true }),
    acknowledge: async (a) => { log('acknowledge', a); window.__eingang = null; return {}; },
    history: async () => ({ receipts: [] }), discardArchived: async () => ({}), restore: async () => ({}),
  };
  window.__liefern = (name) => { window.__eingang = { name }; if (hoerer) hoerer({}); };
  const S = { verfuegbar: async () => ({ verfuegbar: true }), zuhoeren: async (a) => (log('zuhoeren', a), { text: 'Hallo Welt' }) };
  const W = { schliessen: async () => { log('schliessen'); return {}; } };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => '${plattform}', Plugins: { BlpTresor: T, BlpFiles: F, BlpIncoming: I, BlpSpeech: S, BlpFenster: W } };
})();`;

const PROBE = (plattform) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>${BRUECKE(plattform)}</script><script src="./native/blp-native.js"></script></head>
<body><div id="app-root"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings, navigate } from './src/state.js';
import { ensureAccountsSeeded } from './src/domain/store.js';
import { ensureKostenstellenSeeded } from './src/domain/crm-store.js';
import { renderShell, NAV_KEYS } from './src/ui/shell.js';
import { t } from './src/ui/i18n.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ alleEinstellungen: true, nutzungsmodus: 'berater' });
await ensureAccountsSeeded(); await ensureKostenstellenSeeded();
renderShell(document.getElementById('app-root'), { onLock: () => {} });
window.__probe = { navigate, NAV_KEYS, getSettings, t };
window.__probeBereit = true;
</script></body></html>`;
// Nur der Klebstoff, ohne Shell: dort setzt die Probe selbst den Abnehmer des Eingangs.
const KLEBSTOFF = `<!doctype html><html lang="de"><head><meta charset="utf-8"><script src="./native/pro-hintergrund.js"></script><script>${BRUECKE('windows')}</script><script src="./native/blp-native.js"></script></head>
<body><div id="zone" style="width:300px;height:300px">Ziel</div><script>window.__probeBereit = true;</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__windows.html' || pfad === '/__android.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(pfad === '/__windows.html' ? 'windows' : 'android')); }
  if (pfad === '/__klebstoff.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(KLEBSTOFF); }
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
const schluss = async () => { try { await browser.close(); } catch { /* egal */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0; };
process.on('unhandledRejection', async (e) => { rot++; console.log('  ✗ ROT: Probe stürzte ab — ' + ((e && e.message) || e)); await schluss(); process.exit(1); });

const ANDROID = /\bAndroid\w*/;
// Sichtbarer Text je Ansicht; SBKIM-Fenster sprechen selbst (Kanon, byte-1:1) und sind ausgenommen.
const sichtbar = (page) => page.evaluate((src) => {
  const re = new RegExp(src), out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const v = n.nodeValue; if (!re.test(v)) continue; const e = n.parentElement;
    if (!e || e.closest('[id^="sbkim-"],[class^="sbkim-"],[hidden],script,style,iframe')) continue;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width <= 1 || r.height <= 1 || cs.visibility === 'hidden' || !e.getClientRects().length) continue;
    out.push((v.match(re) || [''])[0] + ' «' + v.trim().slice(0, 70) + '»');
  }
  for (const e of document.querySelectorAll('[placeholder]')) { const v = e.getAttribute('placeholder'); if (re.test(v) && e.getClientRects().length) out.push('placeholder «' + v + '»'); }
  return out;
}, ANDROID.source);
async function rundgang(page) {
  const funde = {};
  const keys = await page.evaluate(() => window.__probe.NAV_KEYS);
  for (const k of keys) {
    if (k === 'calculate' || k === 'needs') continue;   // eingebettete Apps: byte-1:1 (apps/), eigener Rahmen
    await page.evaluate((k) => window.__probe.navigate(k), k);
    await page.waitForTimeout(450);
    await page.evaluate(() => document.querySelectorAll('#content details').forEach((d) => { d.open = true; }));
    await page.waitForTimeout(80);
    const f = await sichtbar(page); if (f.length) funde[k] = f;
  }
  return funde;
}
const oeffnen = async (art) => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(BASIS + '/__' + art + '.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 }); await page.waitForTimeout(400); return { ctx, page, fehler }; };


if (!existsSync(join(WURZEL, 'native/blp-native.js'))) {
  console.log('  (nur in der Pro-App mit nativer Hülle — hier keine native/blp-native.js, übersprungen)');
  await schluss(); process.exit(0);
}
console.log('— A. Gegenprobe: dieselbe Seite als Android-App —');
{
  const { ctx, page } = await oeffnen('android');
  // Heute zeigt keine Ansicht einen Android-Satz sichtbar (sie stehen in Sätzen hinter Knöpfen und Meldungen). Damit die Probe
  // nicht blind ist: sie muss einen eingesetzten sichtbaren Satz finden, und Android-Sätze stehen in der Android-Fassung von t().
  await page.evaluate(() => { const p = document.createElement('p'); p.textContent = 'Über Androids Speichern-Fenster'; document.getElementById('content').prepend(p); });
  ok('Gegenprobe: die Suche findet einen sichtbaren Android-Satz', (await sichtbar(page)).some((x) => x.startsWith('Androids')));
  ok('Gegenprobe: Android-Fassung sagt Android', await page.evaluate(() => /Android/.test(window.__probe.t('backup.noApiHint'))));
  ok('Android: Plattform android', await page.evaluate(() => window.BLPNative.plattform === 'android' && document.documentElement.dataset.nativ === 'android'));
  await ctx.close();
}
console.log('— B. Windows: jede Ansicht ohne Android-Sätze —');
{
  const { ctx, page, fehler } = await oeffnen('windows');
  ok('Plattform windows (BLPNative und data-nativ)', await page.evaluate(() => window.BLPNative.plattform === 'windows' && document.documentElement.dataset.nativ === 'windows'));
  const f = await rundgang(page);
  ok('keine sichtbaren Android-Sätze in allen Ansichten', Object.keys(f).length === 0, JSON.stringify(f, null, 1));
  ok('Windows-Sätze für Sicherung, Mikrofon, Scannen', await page.evaluate(() => /Windows/.test(window.__probe.t('backup.noApiHint')) && /ohne Internet/.test(window.__probe.t('mikro.hinweisBrowser')) && /Öffnen mit/.test(window.__probe.t('docs.workflowScanHint'))));
  ok('Spracheingabe über die Hülle (Windows-Spracherkennung)', await page.evaluate(async () => (await window.BLPNative.sprechen('de-DE')).text === 'Hallo Welt'));
  ok('Version aus der Hülle', (await page.evaluate(() => window.BLPNative.version())) === '0.1.1');
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
console.log('— C. Teilen, Hineinziehen, Öffnen mit —');
{
  const { ctx, page, fehler } = await oeffnen('klebstoff');
  await page.evaluate(() => { window.__erhalten = []; window.launchQueue.setConsumer(async (p) => { for (const h of p.files) { const f = await h.getFile(); window.__erhalten.push(f.name + ':' + f.size); } }); });
  await page.evaluate(() => navigator.share({ files: [new File(['abc'], 'Angebot.json', { type: 'application/json' })], title: 'x' }));
  ok('„Teilen“ geht an Speichern unter … mit Satz „Gespeichert“', await page.evaluate(() => window.__log.some((x) => x[0] === 'share' && x[1].name === 'Angebot.json') && /Gespeichert: Angebot\.json/.test(document.querySelector('[data-nativ-hinweis]')?.textContent || '')));
  await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1'], 'Beleg-gezogen.pdf', { type: 'application/pdf' }));
    const z = document.getElementById('zone'); z.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); z.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); });
  await page.waitForTimeout(200);
  ok('hineingezogene Datei kommt beim Abnehmer der Seite an', await page.evaluate(() => window.__erhalten.includes('Beleg-gezogen.pdf:6')));
  await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['x'], 'eigen.pdf'));
    const z = document.getElementById('zone'); z.addEventListener('drop', (e) => e.preventDefault(), { once: true }); z.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); });
  await page.waitForTimeout(150);
  ok('eigene Ablagefläche der Seite hat Vorrang (kein doppeltes Einlesen)', await page.evaluate(() => !window.__erhalten.some((x) => x.startsWith('eigen.pdf'))));
  await page.evaluate(() => window.__liefern('Beleg-Öffnen-mit.pdf'));
  await page.waitForFunction(() => window.__erhalten.some((x) => x.startsWith('Beleg-Öffnen-mit.pdf')), null, { timeout: 5000 }).catch(() => {});
  ok('„Öffnen mit“ (Ereignis der Hülle) liefert und quittiert', await page.evaluate(() => window.__erhalten.some((x) => x.startsWith('Beleg-Öffnen-mit.pdf')) && window.__log.some((x) => x[0] === 'acknowledge' && x[1].discard === false)));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
console.log('— D. Schließen —');
{
  const { ctx, page } = await oeffnen('klebstoff');
  await page.evaluate(() => { window.__aufgabe = null; return window.ProHintergrund.beginnen({ art: 'sichern' }).then((a) => { window.__aufgabe = a; }); });
  page.once('dialog', (d) => d.dismiss());
  await page.evaluate(() => window.__blpSchliessen());
  await page.waitForTimeout(200);
  ok('laufende Aufgabe: Frage, „Abbrechen“ lässt das Fenster offen', await page.evaluate(() => !window.__log.some((x) => x[0] === 'schliessen')));
  await page.evaluate(() => window.__aufgabe.ende());
  await page.evaluate(() => window.__blpSchliessen());
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'schliessen'), null, { timeout: 5000 }).catch(() => {});
  ok('ohne Aufgabe und gesperrtem Tresor: schließt ohne Sicherung', await page.evaluate(() => window.__log.some((x) => x[0] === 'schliessen') && !window.__log.some((x) => x[0] === 'ablegenBeginnen')));
  await ctx.close();
}
{
  const { ctx, page } = await oeffnen('klebstoff');
  await page.evaluate(async () => { await window.Capacitor.Plugins.BlpTresor.entsperren({ merken: true }); window.__log.length = 0; window.__blpSchliessen(); });
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'schliessen'), null, { timeout: 25000 }).catch(() => {});
  const log = await page.evaluate(() => window.__log.map((x) => x[0]));
  ok('offener Tresorordner: erst sichern, dann schließen', log.includes('schliessen') && log.indexOf('zustand') >= 0 && log.indexOf('zustand') < log.indexOf('schliessen'), log.join(','));
  await ctx.close();
}
await schluss();
