// tests/smoke_ohne_web.mjs — Pro-App ohne Web-Reste (Leitfaden § 4, Klaus 2026-10-28) und „Tresor & Ablage“ in den Einstellungen.
//
//   node tests/smoke_ohne_web.mjs        (Chromium + playwright/playwright-core aus der Umgebung)
//
// Echt: Shell (src/ui/shell.js), Tresor der App, native/blp-native.js, native/pro-bedienung.js. GESTELLT: die Android-Brücken
// (BlpTresor, BlpFiles) — wie in smoke_tresorordner. Gang durch JEDE Ansicht der Seitenleiste (alle Einstellungen gezeigt) im
// App-Modus: sichtbarer Text ohne „Browser“, „installieren“, „localStorage“, „dauerhafter Speicher“. Gegenprobe im selben Lauf:
// dieselbe Seite als PWA (ohne Brücke) zeigt Browser-Sätze — dort stimmen sie, und die Probe sieht sie.
// Dazu: Kasten „Tresor & Ablage“ (● Zustand, ganzer Pfad, „In Dateien öffnen“, ein farbiger Knopf), Version unter „Über“,
// Startseite ohne „Willkommen“, „Geschäftsjahr“ in der Kopfleiste. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

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

const BRUECKE = `
window.__log = [];
(function () {
  const z = window.__z = { gewaehlt: true, vorhanden: true, offen: false, gemerkt: true, erreichbar: true, ordner: 'Privat Brain Pro Hauptablageordner', pfad: 'Privat Brain Pro Hauptablageordner', speicher: 'karte' };
  const log = (m, a) => window.__log.push([m, JSON.parse(JSON.stringify(a || {}))]);
  const E = (id, verweis, extra = {}) => ({ id, name: id + '.pdf', art: 'application/pdf', verweis, verschluesselung: 'fpt1', datum: 1761650000000 + id.length, groesse: 9, auszug: 'Rechnung ' + id, ...extra });
  window.__marken = {};
  window.__fach = { 'eingang-bookledgerpro': [E('Rechnung-Strom', 'Mails/r1.fpt'), E('Rechnung-Gas', 'Mails/r2.fpt'), E('Quittung', 'q.fpt')],
    'private-brain': [E('Notiz', 'Katalog/n1', { verschluesselung: 'pbv1', schreiber: 'private-brain' })], 'bookledgerpro': [E('Sicherung-1', 'Sicherung/s1.fpt')] };
  const zustand = () => ({ ...z, faecher: z.offen ? [] : undefined, ersatz: z.offen ? { vorhanden: false } : undefined });
  const T = {
    zustand: async () => (log('zustand'), zustand()),
    ordnerWaehlen: async () => { log('ordnerWaehlen'); z.gewaehlt = true; return zustand(); },
    anlegen: async (a) => { log('anlegen', a); z.vorhanden = true; z.offen = true; return zustand(); },
    entsperren: async (a) => { log('entsperren', a); z.offen = true; return zustand(); },
    sperren: async (a) => { log('sperren', a); z.offen = false; return zustand(); },
    ordnerOeffnen: async (a) => { log('ordnerOeffnen', a); return {}; },
    verzeichnis: async (a) => { if (!z.offen) throw new Error('TRESOR_GESPERRT'); return { eintraege: window.__fach[a.fach] || [], marken: [...(window.__marken[a.fach] || [])] }; },
    appOeffnen: async (a) => { log('appOeffnen', a); return {}; },
    ablegenBeginnen: async () => { throw new Error('TRESOR_GESPERRT'); }, ablegenTeil: async () => ({}), ablegenFertig: async () => ({}), ablegenAbbrechen: async () => ({}),
    lesenOeffnen: async (a) => { log('lesenOeffnen', a); const e = (window.__fach[a.fach] || []).find((x) => x.id === a.id); if (!e || e.verschluesselung !== 'fpt1') throw new Error('TRESOR_NUR_IN_DER_APP'); return { ticket: 'l' + a.id, name: e.name, art: 'application/pdf', groesse: 9 }; },
    lesenTeil: async () => ({ data: btoa('%PDF-1.4 probe'), fertig: true }),
    markieren: async (a) => { log('markieren', a); (window.__marken[a.fach] = window.__marken[a.fach] || new Set()).add(a.id); },
    passwortAendern: async () => ({}), ersatzErstellen: async () => ({ teile: [] }), wiederherstellen: async () => zustand(),
  };
  const F = { save: async () => ({ saved: true }), share: async () => ({ shared: true }), appInfo: async () => ({ version: '0.1.1-debug' }) };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F } };
})();`;

const PROBE = (app) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script>' + BRUECKE + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
<body><div id="app-root"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings, navigate } from './src/state.js';
import { ensureAccountsSeeded } from './src/domain/store.js';
import { ensureKostenstellenSeeded } from './src/domain/crm-store.js';
import { renderShell, NAV_KEYS } from './src/ui/shell.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ alleEinstellungen: true, nutzungsmodus: 'berater' });
await ensureAccountsSeeded(); await ensureKostenstellenSeeded();
renderShell(document.getElementById('app-root'), { onLock: () => {} });
window.__probe = { navigate, NAV_KEYS, getSettings };
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
const schluss = async () => { try { await browser.close(); } catch { /* egal */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0; };
process.on('unhandledRejection', async (e) => { rot++; console.log('  ✗ ROT: Probe stürzte ab — ' + ((e && e.message) || e)); await schluss(); process.exit(1); });

const WEB = /\b(Browser\w*|browser\w*|[Ii]nstallier\w*|[Ii]nstall\b|localStorage|dauerhaft(e[rn]?)? (Speicher|zugesichert)\w*|persistent storage)/;
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
}, WEB.source);
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

console.log('— A. Gegenprobe: PWA (ohne Brücke) —');
{
  const { ctx, page } = await oeffnen('pwa');
  const f = await rundgang(page);
  ok('als PWA sieht die Probe Browser-Sätze (dort richtig) — sonst wäre sie blind', Object.keys(f).length >= 1, JSON.stringify(f).slice(0, 200));
  ok('PWA: kein Kasten „Tresor & Ablage“', await page.evaluate(() => { window.__probe.navigate('settings'); return new Promise((r) => setTimeout(() => r(!document.querySelector('[data-tresor-ablage]')), 300)); }));
  await ctx.close();
}

if (!existsSync(join(WURZEL, 'native/blp-native.js'))) {
  // BookLedger Basic (PWA-Kopie) hat keine Android-Hülle: dort gilt nur Teil A (wie smoke_tresorordner).
  console.log('  (B–D nur in der Pro-App mit Android-Hülle — hier keine native/blp-native.js, übersprungen)');
  await schluss(); process.exit(rot ? 1 : 0);
}
console.log('— B. App: jede Ansicht ohne Web-Reste —');
{
  const { ctx, page, fehler } = await oeffnen('app');
  const f = await rundgang(page);
  ok('keine sichtbaren Web-Reste in allen Ansichten (Leitfaden § 4)', Object.keys(f).length === 0, JSON.stringify(f, null, 1));
  ok('Installieren-Knopf in der Kopfleiste ist weg', await page.evaluate(() => { const k = document.getElementById('install-kopf'); return !k || getComputedStyle(k).display === 'none'; }));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— C. Tresor & Ablage, Version, Startseite, Kopfleiste —');
{
  const { ctx, page, fehler } = await oeffnen('app');
  await page.evaluate(() => window.__probe.navigate('settings'));
  await page.waitForSelector('[data-ta-tresor-ort]');
  const g = await page.evaluate(() => { const h = document.querySelector('[data-tresor-ablage]');
    return { erst: h === document.querySelector('[data-einstellungen] > :nth-child(2)'), titel: h.querySelector('.ta-kopf span')?.textContent,
      ablage: h.querySelector('[data-ta-ablage] h4')?.textContent, tresor: h.querySelector('[data-ta-tresor] h4')?.textContent,
      tz: h.querySelector('[data-ta-tresor-ort] .pro-zustand')?.textContent, tp: h.querySelector('[data-ta-tresor-ort] .pro-pfad')?.textContent,
      haupt: [...h.querySelectorAll('.btn-primary')].map((b) => b.textContent), infoZu: h.querySelector('.pro-info-inhalt')?.hidden }; });
  ok('Kasten steht als erstes in den Einstellungen', g.erst);
  ok('„Tresor & Ablage“ mit „Ablage von BookLedgerPro“ und „Tresor (alle Pro-Apps)“', g.titel === 'Tresor & Ablage' && g.ablage === 'Ablage von BookLedgerPro' && g.tresor === 'Tresor (alle Pro-Apps)', JSON.stringify(g));
  ok('gesperrt: ● Gesperrt, ganzer Pfad, genau ein farbiger Knopf „Tresor entsperren …“', g.tz === 'Gesperrt' && g.tp === 'SD-Karte/Privat Brain Pro Hauptablageordner' && g.haupt.join() === 'Tresor entsperren …', JSON.stringify(g));
  ok('Erklärung hinter ⓘ, zugeklappt', g.infoZu === true);
  ok('gesperrt: kein „Tresor sperren“', await page.locator('[data-ta-sperren]').count() === 0);
  await page.click('[data-ta-entsperren]');
  await page.waitForSelector('[data-ta-ablage-ort]');
  const o = await page.evaluate(() => ({ az: document.querySelector('[data-ta-ablage-ort] .pro-zustand')?.textContent, ap: document.querySelector('[data-ta-ablage-ort] .pro-pfad')?.textContent,
    tz: document.querySelector('[data-ta-tresor-ort] .pro-zustand')?.textContent, haupt: document.querySelectorAll('[data-tresor-ablage] .btn-primary').length,
    merken: window.__log.filter((x) => x[0] === 'entsperren').map((x) => x[1].merken) }));
  ok('entsperrt: Ablage ● Entsperrt mit Pfad …/BookLedgerPro; Tresor ● Entsperrt; kein farbiger Knopf mehr', o.az === 'Entsperrt' && o.ap === 'SD-Karte/Privat Brain Pro Hauptablageordner/BookLedgerPro' && o.tz === 'Entsperrt' && o.haupt === 0, JSON.stringify(o));
  ok('Entsperren behält „gemerkt“ (kein stilles Vergessen)', o.merken.join() === 'true');
  await page.click('[data-ta-ablage-ort] [data-pro-knopf="in-dateien"]'); await page.click('[data-ta-tresor-ort] [data-pro-knopf="in-dateien"]');
  await page.waitForTimeout(200);
  ok('„In Dateien öffnen“ fragt Android nach Ablage, dann Tresor', JSON.stringify(await page.evaluate(() => window.__log.filter((x) => x[0] === 'ordnerOeffnen').map((x) => x[1].welcher))) === '["ablage","tresor"]');
  await page.click('[data-ta-sperren]'); await page.waitForSelector('[data-ta-entsperren]');
  ok('Sperren: wieder ● Gesperrt und der farbige Knopf ist „entsperren“', await page.evaluate(() => document.querySelector('[data-ta-tresor-ort] .pro-zustand')?.textContent === 'Gesperrt'));
  await page.evaluate(() => window.__probe.navigate('about'));
  await page.waitForFunction(() => /Version 0\.1\.1/.test(document.querySelector('[data-app-version]')?.textContent || ''), null, { timeout: 5000 }).catch(() => {});
  ok('„Über“ nennt die Version der App (ohne -debug)', await page.evaluate(() => document.querySelector('[data-app-version]')?.textContent === 'Version 0.1.1'));
  await page.evaluate(() => window.__probe.navigate('dashboard')); await page.waitForSelector('.kpi-grid');
  const d = await page.evaluate(() => ({ h1: document.querySelector('#content h1')?.textContent, text: document.querySelector('#content').textContent, kopf: document.querySelector('[data-geschaeftsjahr]')?.textContent }));
  ok('Startseite ohne „Willkommen“ und ohne Werbesatz', !/Willkommen/.test(d.text) && !/offline, verschlüsselt, EU-KI/.test(d.text), d.h1);
  ok('„Geschäftsjahr“ steht in der Kopfleiste', /Geschäftsjahr \d{4}/.test(d.kopf || ''), d.kopf);
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
console.log('— D. Tresorordner-Ansicht 1 → 2 → 4 → 3 —');
{
  const { ctx, page, fehler } = await oeffnen('app');
  await page.evaluate(async () => { await window.Capacitor.Plugins.BlpTresor.entsperren({ merken: true }); });
  await page.evaluate(() => window.__probe.navigate('documents'));
  const h = await page.waitForSelector('[data-belege-tresor-zeigen]', { timeout: 8000 }).then(() => true, () => false);
  ok('1 · Belege: „Neu im Tresorordner: 3“ mit Knopf zum Tresorordner', h && /Neu im Tresorordner: 3/.test(await page.textContent('[data-belege-tresor-neu]')));
  await page.click('[data-belege-tresor-zeigen]');
  await page.waitForSelector('[data-tresor-neu]');
  ok('1 · Ansicht: Karte „Neu im Tresorordner: 3“ (fremdes Format und eigene Sicherung zählen nicht)', await page.getAttribute('[data-tresor-neu]', 'data-tresor-neu') === '3');
  await page.click('[data-tresor-alle-auf]');
  ok('2 · „Alle auf“ öffnet jedes Fach und jeden Unterordner (Mails)', await page.evaluate(() => [...document.querySelectorAll('[data-tresor-fach],[data-tresor-unter]')].every((d) => d.open) && !!document.querySelector('[data-tresor-unter="Mails"]')));
  await page.click('[data-tresor-alle-zu]');
  ok('2 · „Alle zu“ schließt alle', await page.evaluate(() => [...document.querySelectorAll('[data-tresor-fach]')].every((d) => !d.open)));
  await page.click('[data-tresor-alle-auf]');
  await page.locator('[data-tresor-fach="eingang-bookledgerpro"] [data-tresor-wahl="Rechnung-Strom"]').check();
  await page.locator('[data-tresor-fach="eingang-bookledgerpro"] [data-tresor-wahl="Rechnung-Gas"]').check();
  ok('4 · Auswahl: Leiste „2 ausgewählt“; die gleiche Zeile in „Neu“ ist mitgewählt', await page.evaluate(() => /2 ausgewählt/.test(document.querySelector('[data-tresor-wahl-leiste]').textContent) && !document.querySelector('[data-tresor-wahl-leiste]').hidden
    && document.querySelector('[data-tresor-neu] [data-tresor-wahl="Rechnung-Gas"]').checked));
  ok('3 · fremdes Format: „In Private Brain Pro öffnen“ statt „nur in der App“', await page.locator('[data-tresor-app="private-brain"]').first().isVisible());
  await page.locator('[data-tresor-app="private-brain"]').first().click(); await page.waitForTimeout(150);
  ok('3 · der Tipp startet nur Private Brain Pro (feste Kennung)', JSON.stringify(await page.evaluate(() => window.__log.filter((x) => x[0] === 'appOeffnen').map((x) => x[1].app))) === '["private-brain"]');
  await page.click('[data-tresor-auswahl-uebernehmen]');
  await page.waitForFunction(() => window.__log.filter((x) => x[0] === 'markieren').length === 2, null, { timeout: 8000 }).catch(() => {});
  const m = await page.evaluate(() => window.__log.filter((x) => x[0] === 'markieren' || x[0] === 'lesenOeffnen').map((x) => x[0] + ':' + x[1].id));
  ok('4 · Übernehmen: erst beide gelesen, dann beide markiert, dann bei den Belegen', JSON.stringify(m) === JSON.stringify(['lesenOeffnen:Rechnung-Strom', 'lesenOeffnen:Rechnung-Gas', 'markieren:Rechnung-Strom', 'markieren:Rechnung-Gas']), JSON.stringify(m));
  ok('… und die Ansicht wechselt zu den Belegen', await page.waitForFunction(() => /Belege|Receipts/.test(document.querySelector('#content h1')?.textContent || ''), null, { timeout: 8000 }).then(() => true, () => false));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
await schluss();
