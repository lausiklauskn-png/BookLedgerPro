// tests/smoke_befunde.mjs — Klaus' Befunde vom Tablet (2026-10-28, geteilte Ansicht), zweiter PR nach Pro-Umbau 4.
//
//   node tests/smoke_befunde.mjs        (Chromium + playwright/playwright-core aus der Umgebung)
//
// A2 „Mit Workflow PDF scannen“ öffnet in der App den Scanner von Workflow PDF Pro (scanStarten, Intent SCANNEN; Rückfälle: ältere WPP, ältere Hülle), fehlt es: ehrlicher Satz ·
// A3 Mikrofon in der App über Androids Sprachfenster (BLPNative.sprechen gestellt), ohne Sprachfenster kein Mikrofon ·
// A4 Modell laden mit Balken, Prozent und MB (gestellter Lader meldet Fortschritt), ohne Größe Drehkreis ·
// B Mikrofon nur an Suche und Freitext (Aufträge-Positionszeile ohne Mikrofon/DE, eine Zeile bei 1000 px) ·
// C schlanker: Felder/Knöpfe ≤ 32 px, Stift/Papierkorb statt Wortknöpfen, Konten „Aktiv“ ohne Umbruch, Erklärsätze hinter ⓘ (gemerkt),
//   kein Querlaufen bei 360/640/700/1000/1280 px und bei 200 % Schrift · D Auswahl-Prüfen · E eingebettete Apps flach, BLP-Farben, ohne Emoji.
// Gestellt: Android-Brücken (BlpTresor, BlpFiles, BlpSpeech, ProHintergrund). Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

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
    appOeffnen: async (a) => { log('appOeffnen', a); if (window.__appFehlt) { const e = new Error('APP_FEHLT'); e.code = 'APP_FEHLT'; throw e; } return {}; },
    ablegenBeginnen: async (a) => { if (!z.offen) throw new Error('TRESOR_GESPERRT'); log('ablegenBeginnen', a); return { ticket: 't1' }; },
    ablegenTeil: async (a) => (log('ablegenTeil', { laenge: a.data.length }), {}), ablegenFertig: async (a) => (log('ablegenFertig', a), { id: 'neu1' }), ablegenAbbrechen: async () => ({}),
    lesenOeffnen: async (a) => { log('lesenOeffnen', a); const e = (window.__fach[a.fach] || []).find((x) => x.id === a.id); if (!e || e.verschluesselung !== 'fpt1') throw new Error('TRESOR_NUR_IN_DER_APP'); return { ticket: 'l' + a.id, name: e.name, art: 'application/pdf', groesse: 9 }; },
    lesenTeil: async () => ({ data: btoa('%PDF-1.4 probe'), fertig: true }),
    markieren: async (a) => { log('markieren', a); (window.__marken[a.fach] = window.__marken[a.fach] || new Set()).add(a.id); },
    passwortAendern: async () => ({}), ersatzErstellen: async () => ({ teile: [] }), wiederherstellen: async () => zustand(),
  };
  // Pro-Umbau 6: Scanner direkt über den Intent SCANNEN; __alteHuelle = BookLedgerPro ohne die Methode, __wppAlt = Workflow PDF Pro ohne den Intent.
  if (!window.__alteHuelle) T.scanStarten = async () => { log('scanStarten'); if (window.__appFehlt) { const e = new Error('APP_FEHLT'); e.code = 'APP_FEHLT'; throw e; } return { weg: window.__wppAlt ? 'app' : 'direkt' }; };
  const F = { save: async () => ({ saved: true }), share: async () => ({ shared: true }), appInfo: async () => ({ version: '0.1.1-debug' }) };
  let hoerer = null;
  const H = { aufraeumen: async () => log('h.aufraeumen'), erlauben: async () => (log('h.erlauben'), { mitteilung: true }),
    beginnen: async (a) => (log('h.beginnen', a), { geschuetzt: true }), stand: async (a) => log('h.stand', a), ende: async (a) => log('h.ende', a),
    addListener: (n, fn) => { hoerer = fn; return { remove() {} }; } };
  window.__mitteilungAbbruch = () => { const b = window.__log.filter((x) => x[0] === 'h.beginnen').pop(); if (b && hoerer) hoerer({ id: b[1].id, grund: 'mitteilung' }); };
  const SP = { zuhoeren: async (a) => { log('sprechen', a); if (window.__sprachFehler) throw new Error(window.__sprachFehler); return { text: window.__satz || '' }; } };
  if (window.__ohneSprache) delete SP.zuhoeren;
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H, BlpSpeech: SP } };
})();`;

const PROBE = (app) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>' + BRUECKE + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
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
window.__probe = { navigate, NAV_KEYS, getSettings, updateSettings };
const { saveBeleg, setBelegText } = await import('./src/domain/documents.js');
for (let i = 1; i <= 3; i++) { const b = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 probe ' + i)], 'Rechnung-' + i + '.pdf', { type: 'application/pdf' })); await setBelegText(b.id, 'Rechnung Nr. ' + i + ' Büromiete Oktober 2026, 890,00 EUR'); }
// Gestelltes Modell (wie smoke_belegsuche): langsam genug, dass der Abbruch aus der Mitteilung zwischen zwei Belegen ankommt.
const vec = (s) => { const v = new Float32Array(8); for (const c of String(s)) v[c.charCodeAt(0) % 8] += 1; const n = Math.hypot(...v) || 1; return Array.from(v, (x) => x / n); };
window.__blpEmbedderStub = { embedQuery: async (s) => vec(s), embedPassage: async (s) => { await new Promise((r) => setTimeout(r, window.__langsam || 0)); return vec(s); } };
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


const oeffnen = async (art, breite = 1000, flags = {}, hoehe = 900) => {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } }); const page = await ctx.newPage(); const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.addInitScript((f) => { Object.assign(window, f); window.alert = (m) => { window.__alerts = (window.__alerts || []).concat(String(m)); }; }, flags);
  await page.goto(BASIS + '/__' + art + '.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 }); await page.waitForTimeout(400);
  return { ctx, page, fehler };
};
const nav = async (page, k) => { await page.evaluate((k) => window.__probe.navigate(k), k); await page.waitForTimeout(500); };
const klick = (page, sel) => page.click(sel, { timeout: 4000 }).then(() => true, () => { rot++; console.log('  ✗ ROT: Knopf fehlt — ' + sel); return false; });
const warte = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
const APP = existsSync(join(WURZEL, 'native/blp-native.js'));

if (APP) {
  console.log('— A2. „Mit Workflow PDF scannen“ in der App —');
  {
    const { ctx, page, fehler } = await oeffnen('app');
    await nav(page, 'documents');
    const art = await page.getAttribute('[data-workflow-scan]', 'data-workflow-scan').catch(() => null);
    ok('in der App ein Knopf (kein toter Web-Link)', art === 'app', String(art));
    await klick(page, '[data-workflow-scan]');
    await warte(page, () => !!window.__blpWfScan);
    const r = await page.evaluate(() => ({ log: window.__log.filter((x) => x[0] === 'scanStarten' || x[0] === 'appOeffnen').map((x) => x[0]), satz: window.__blpWfScan || '' }));
    ok('öffnet den Scanner direkt (scanStarten, Intent SCANNEN), kein bloßer App-Start, nennt den Rückweg über Teilen', r.log.join() === 'scanStarten' && /Scanner/.test(r.satz) && /Teilen/.test(r.satz), JSON.stringify(r));
    ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await oeffnen('app', 1000, { __wppAlt: true });
    await nav(page, 'documents'); await klick(page, '[data-workflow-scan]');
    await warte(page, () => !!window.__blpWfScan);
    const satz = await page.evaluate(() => window.__blpWfScan || '');
    ok('ältere Workflow PDF Pro ohne den Intent: App gestartet, Satz „ist offen: dort scannen“', /ist offen: dort scannen/.test(satz), satz);
    await ctx.close();
  }
  {
    const { ctx, page } = await oeffnen('app', 1000, { __alteHuelle: true });
    await nav(page, 'documents'); await klick(page, '[data-workflow-scan]');
    await warte(page, () => !!window.__blpWfScan);
    const r = await page.evaluate(() => ({ log: window.__log.filter((x) => x[0] === 'scanStarten' || x[0] === 'appOeffnen').map((x) => x[0] + ':' + (x[1].app || '')), satz: window.__blpWfScan || '' }));
    ok('ältere BookLedgerPro-Hülle ohne scanStarten: Rückfall appOeffnen „workflow-pdf-pro“', r.log.join() === 'appOeffnen:workflow-pdf-pro' && /Teilen/.test(r.satz), JSON.stringify(r));
    await ctx.close();
  }
  {
    const { ctx, page } = await oeffnen('app', 1000, { __appFehlt: true });
    await nav(page, 'documents'); await klick(page, '[data-workflow-scan]');
    await warte(page, () => !!window.__blpWfScan);
    ok('fehlt Workflow PDF Pro: ehrlicher Satz „nicht installiert“', /nicht installiert/.test(await page.evaluate(() => window.__blpWfScan || '')));
    await ctx.close();
  }

  console.log('— A3. Mikrofon in der App über Androids Sprachfenster —');
  {
    const { ctx, page, fehler } = await oeffnen('app', 1000, { __satz: 'Bewirtung mit Kunde' });
    await nav(page, 'journal');
    const da = await warte(page, () => document.querySelector('#content textarea + .mikro[data-mikro] .mikro-knopf'));
    ok('Begründung/Notiz hat ein Mikrofon', da);
    const ta = await page.evaluateHandle(() => document.querySelector('#content textarea + .mikro[data-mikro]').previousElementSibling);
    await ta.evaluate((f) => { f.value = ''; f.focus(); });
    await klick(page, '#content textarea + .mikro[data-mikro] .mikro-knopf');
    await warte(page, () => (document.querySelector('#content textarea + .mikro[data-mikro]').previousElementSibling.value || '').includes('Bewirtung'));
    const r = await page.evaluate(() => ({ wert: document.querySelector('#content textarea + .mikro[data-mikro]').previousElementSibling.value, an: document.querySelector('#content textarea + .mikro[data-mikro] .mikro-knopf').classList.contains('mikro-an'), log: window.__log.filter((x) => x[0] === 'sprechen').map((x) => x[1].sprache) }));
    ok('Androids Sprachfenster (de-DE) liefert den Text ins Feld; danach ist das Mikrofon wieder in Ruhe (kein blaues Feld)', r.wert === 'Bewirtung mit Kunde' && !r.an && r.log.join() === 'de-DE', JSON.stringify(r));
    ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await oeffnen('app', 1000, { __sprachFehler: 'SPRACHE_FEHLT' });
    await nav(page, 'journal'); await warte(page, () => document.querySelector('#content textarea + .mikro[data-mikro] .mikro-knopf'));
    await klick(page, '#content textarea + .mikro[data-mikro] .mikro-knopf'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => { const l = document.querySelector('#content textarea + .mikro[data-mikro]'); return { status: l.querySelector('.mikro-status').textContent, an: l.querySelector('.mikro-knopf').classList.contains('mikro-an') }; });
    ok('Fehler des Sprachfensters: sichtbar gesagt, Mikrofon zurück in Ruhe', !!r.status && !r.an, JSON.stringify(r));
    await ctx.close();
  }
  {
    const { ctx, page } = await oeffnen('app', 1000, { __ohneSprache: true });
    await nav(page, 'journal'); await page.waitForTimeout(400);
    ok('ältere Hülle ohne Sprachfenster: kein Mikrofon (statt eines, das hängt)', await page.evaluate(() => !document.querySelector('#content .mikro[data-mikro]')));
    await ctx.close();
  }
}

console.log('— A4. Modell laden: Balken, Prozent, MB —');
{
  const { ctx, page, fehler } = await oeffnen('pwa');
  await page.evaluate(() => {
    let weiter; window.__weiter = new Promise((r) => { weiter = r; }); window.__los = weiter;
    window.__blpLadeStub = async ({ onStatus, onProgress }) => {
      onStatus('lädt transformers.js …'); onProgress({ geladen: 0, gesamt: 0 });
      await new Promise((r) => { window.__schritt1 = r; });
      onProgress({ geladen: 30 * 1048576, gesamt: 120 * 1048576 });
      await window.__weiter;
      const vec = () => [1, 0, 0, 0];
      return { embedQuery: async () => vec(), embedPassage: async () => vec() };
    };
  });
  await nav(page, 'documents');
  await klick(page, '[data-bedeutung-schalter]');
  await warte(page, () => document.querySelector('[data-bedeutung-zustand="laedt"] .pruef-dreh'));
  ok('Größe noch unbekannt: Drehkreis', await page.evaluate(() => !!document.querySelector('[data-bedeutung-zustand="laedt"] .pruef-dreh')));
  await warte(page, () => typeof window.__schritt1 === 'function'); await page.evaluate(() => window.__schritt1 && window.__schritt1());
  await warte(page, () => document.querySelector('[data-bedeutung-balken]'));
  const b = await page.evaluate(() => ({ wert: document.querySelector('[data-bedeutung-balken]')?.value, text: document.querySelector('[data-bedeutung-zustand]')?.textContent || '' }));
  ok('mit Größe: Balken 25 %, Text „25 % · 30,0 von 120,0 MB“', b.wert === 25 && /25 % · 30,0 von 120,0 MB/.test(b.text), JSON.stringify(b));
  await page.evaluate(() => window.__los && window.__los());
  ok('danach kein Balken mehr', await warte(page, () => !document.querySelector('[data-bedeutung-balken]')));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— B/C. Aufträge: Positionszeile ohne Mikrofon/DE, eine Zeile —');
for (const breite of [1000, 640]) {
  const { ctx, page } = await oeffnen(APP ? 'app' : 'pwa', breite);
  await nav(page, 'orders');
  await warte(page, () => document.querySelector('#content .pos-row'));
  const r = await page.evaluate(() => {
    const row = document.querySelector('#content .pos-row'); const kinder = [...row.children].filter((k) => k.getClientRects().length && getComputedStyle(k).display !== 'contents');
    const mitten = kinder.map((k) => { const r = k.getBoundingClientRect(); return r.top + r.height / 2; });
    const tops = mitten.map((m) => Math.round((m - mitten[0]) / 8));   // eine Zeile = Mittellinien innerhalb ±4 px
    return { mik: !!row.querySelector('.mikro[data-mikro]'), sichtbar: kinder.length, zeilen: new Set(tops).size, besteller: [...document.querySelectorAll('#content input')].filter((i) => /Müller|Einkauf/.test(i.placeholder || '')).map((i) => !!(i.nextElementSibling && i.nextElementSibling.matches('.mikro[data-mikro]'))),
      breit: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(breite + ' px: Positionszeile ohne Mikrofon/DE', !r.mik, JSON.stringify(r));
  ok(breite + ' px: Beschreibung, Menge, Einzelpreis, USt, Löschen in einer Zeile', r.sichtbar === 5 && r.zeilen === 1, JSON.stringify(r));
  ok(breite + ' px: Besteller-Name/Funktion ohne Mikrofon, nichts läuft quer hinaus', r.besteller.every((x) => !x) && r.breit, JSON.stringify(r));
  await ctx.close();
}

console.log('— C. Schlanker: Felder/Knöpfe flach, Symbole statt Wortknöpfen, kein Querlaufen —');
const ANSICHTEN = ['journal', 'payables', 'anlagen', 'orders', 'customers', 'documents', 'accounts', 'kassenbuch'];
for (const breite of [360, 640, 700, 1000, 1280]) {
  const { ctx, page } = await oeffnen(APP ? 'app' : 'pwa', breite);
  const hoch = {}, quer = [];
  for (const k of ANSICHTEN) {
    await nav(page, k);
    const r = await page.evaluate(() => {
      const zu = [...document.querySelectorAll('#content input:not([type=checkbox]):not([type=radio]):not([type=file]), #content select, #content .btn')]
        .filter((e) => e.getClientRects().length && !e.closest('.modal,iframe,[data-kein-schlank]'))
        .map((e) => ({ h: Math.round(e.getBoundingClientRect().height), t: (e.textContent || e.placeholder || e.name || e.tagName).trim().slice(0, 30) }))
        .filter((x) => x.h > 32);
      return { zu, breit: document.documentElement.scrollWidth <= innerWidth + 1 };
    });
    if (r.zu.length) hoch[k] = r.zu.slice(0, 4);
    if (!r.breit) quer.push(k);
  }
  ok(breite + ' px: Felder und Knöpfe ≤ 32 px (Maß Private Brain Pro) in ' + ANSICHTEN.length + ' Ansichten', Object.keys(hoch).length === 0, JSON.stringify(hoch).slice(0, 600));
  ok(breite + ' px: keine Ansicht läuft quer hinaus', quer.length === 0, quer.join(','));
  await ctx.close();
}
{
  const { ctx, page, fehler } = await oeffnen(APP ? 'app' : 'pwa', 640);
  await nav(page, 'accounts');
  await warte(page, () => document.querySelector('#content td.kurz-spalte'));
  const r = await page.evaluate(() => ({
    wort: [...document.querySelectorAll('#content button')].filter((b) => /^(Bearbeiten|Löschen)$/.test(b.textContent.trim())).length,
    symbol: document.querySelectorAll('#content button[data-schlank="symbol"] use[href="#pb-edit"]').length,
    titel: document.querySelector('#content button[data-schlank="symbol"]')?.getAttribute('aria-label'),
    art: Math.max(...[...document.querySelectorAll('#content td.kurz-spalte')].map((td) => { const r = document.createRange(); r.selectNodeContents(td); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; })),
    aktionen: Math.max(...[...document.querySelectorAll('#content td.actions')].map((td) => new Set([...td.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top / 4))).size)),
    breit: document.documentElement.scrollWidth <= innerWidth + 1 }));
  ok('Konten (640 px): Stift/Papierkorb statt „Bearbeiten“/„Löschen“, Name im aria-label', r.wort === 0 && r.symbol > 0 && r.titel === 'Bearbeiten', JSON.stringify(r));
  ok('Konten: „Aktiv“ bricht nicht um (eine Textzeile), Stift und Papierkorb nebeneinander, nichts läuft hinaus', r.art === 1 && r.aktionen === 1 && r.breit, JSON.stringify(r));
  // Erklärsätze hinter ⓘ, zu und gemerkt
  await nav(page, 'anlagen');
  const e1 = await page.evaluate(() => { const p = document.querySelector('#content p[data-erklaer]'); return { da: !!p, zu: p ? p.hidden : null, knopf: !!document.querySelector('#content [data-erklaer-knopf]') }; });
  ok('Anlagen: langer Erklärsatz liegt hinter ⓘ (zu)', e1.da && e1.zu === true && e1.knopf, JSON.stringify(e1));
  const k = await page.getAttribute('#content [data-erklaer-knopf]', 'data-erklaer-knopf', { timeout: 3000 }).catch(() => 'fehlt');
  // Steht der Satz unter dem Seitentitel, ist das sichtbare ⓘ das hinter dem Titel im Kopf (Klaus 2026-10-29 spät).
  await klick(page, `[data-erklaer-knopf="${k}"]:visible`);
  ok('ⓘ öffnet den Satz', await page.evaluate((k) => document.querySelector(`#content p[data-erklaer="${k}"]`)?.hidden === false, k));
  await nav(page, 'journal'); await nav(page, 'anlagen');
  ok('offen/zu wird gemerkt (nach Neuzeichnen offen)', await page.evaluate((k) => document.querySelector(`#content p[data-erklaer="${k}"]`)?.hidden === false, k));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
{
  // 200 % Schrift (smoke_design-Muster): nichts läuft quer hinaus
  const { ctx, page } = await oeffnen(APP ? 'app' : 'pwa', 700);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const quer = [];
  for (const k of ANSICHTEN) { await nav(page, k); if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))) quer.push(k); }
  ok('700 px und 200 % Schrift: keine Ansicht läuft quer hinaus', quer.length === 0, quer.join(','));
  await ctx.close();
}

console.log('— D. Prüfen über eine Auswahl —');
{
  const { ctx, page, fehler } = await oeffnen(APP ? 'app' : 'pwa');
  await nav(page, 'documents');
  const vorher = await page.evaluate(() => ({ alle: !!document.querySelector('[data-pruef-alle]')?.textContent.match(/Alle ungeprüften/), wahl: document.querySelector('[data-pruef-wahl-ungeprueft]')?.textContent || '', haken: document.querySelectorAll('[data-beleg-wahl]').length }));
  ok('kein „Alle ungeprüften prüfen“ mehr; „Ungeprüfte wählen (3)“ und ein Haken je Zeile', !vorher.alle && /Ungeprüfte wählen \(3\)/.test(vorher.wahl) && vorher.haken === 3, JSON.stringify(vorher));
  await klick(page, '[data-pruef-wahl-ungeprueft]');
  await warte(page, () => document.querySelector('[data-pruef-gewaehlt]'));
  const w = await page.evaluate(() => ({ gew: document.querySelector('[data-pruef-gewaehlt]')?.textContent, haken: [...document.querySelectorAll('[data-beleg-wahl]')].filter((c) => c.checked).length }));
  ok('„Ungeprüfte wählen“ hakt die drei an, Knopf „Prüfen (3)“ erscheint', w.gew === 'Prüfen (3)' && w.haken === 3, JSON.stringify(w));
  await page.click('[data-beleg-wahl]:checked');   // einen abwählen
  await warte(page, () => document.querySelector('[data-pruef-gewaehlt]')?.textContent === 'Prüfen (2)');
  ok('einen abwählen → „Prüfen (2)“', await page.evaluate(() => document.querySelector('[data-pruef-gewaehlt]')?.textContent === 'Prüfen (2)'));
  await klick(page, '[data-pruef-gewaehlt]');
  await warte(page, () => document.querySelector('[data-pruef-stapel="fertig"]'), null, 60000);
  const e = await page.evaluate(() => ({ fertig: document.querySelector('[data-pruef-stapel="fertig"]')?.textContent || '', offen: document.querySelectorAll('[data-pruefung="offen"]').length, h: (window.__log || []).filter((x) => x[0] === 'h.beginnen').map((x) => x[1].titel) }));
  ok('geprüft werden genau die zwei gewählten (einer bleibt offen)', /Geprüft: 2/.test(e.fertig) && e.offen === 1, JSON.stringify(e));
  if (APP) ok('in der App als Hintergrundaufgabe angemeldet', e.h.some((x) => /geprüft/.test(x)), JSON.stringify(e.h));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— E. Eingebettete Apps: flach, BLP-Farben, ohne Emoji —');
for (const app of ['calculate', 'needs']) {
  const { ctx, page } = await oeffnen(APP ? 'app' : 'pwa', 1000);
  await page.evaluate(() => window.__probe.updateSettings({ themeFarbe: 'petrol' }).catch(() => {}));
  await nav(page, app);
  let frame = null;
  for (let i = 0; i < 100 && !frame; i++) { frame = page.frames().find((x) => new RegExp('/apps/' + app + '/').test(x.url())) || null; if (!frame) await page.waitForTimeout(100); }
  ok(app + ': Rahmen geladen', !!frame);
  if (frame) {
    await frame.waitForFunction(() => document.documentElement.getAttribute('data-blp-eingebettet') === '1' && window.BLP_BRUECKE_STRICH === true, null, { timeout: 20000 }).catch(() => null);
    await frame.waitForTimeout(800);
    const r = await frame.evaluate(() => {
      const knoepfe = [...document.querySelectorAll('.btn, .reiter button')].filter((b) => b.getClientRects().length);
      const ist = (v) => /\p{Extended_Pictographic}/u.test(String(v || '').replace(/[↗©™®↔↕↺↻]/gu, ''));
      const emo = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const e = n.parentElement; if (!ist(n.nodeValue) || !e || e.closest('[id^="sbkim"],[class*="sbkim"],script,style,[hidden]') || !e.getClientRects().length) continue; emo.push(n.nodeValue.trim().slice(0, 30)); }
      return { hoch: knoepfe.filter((b) => b.getBoundingClientRect().height > 32).map((b) => b.textContent.trim().slice(0, 20) + ':' + Math.round(b.getBoundingClientRect().height)).slice(0, 5),
        fett: knoepfe.filter((b) => !b.matches('.pri,.on') && Number(getComputedStyle(b).fontWeight) > 600).length, emo: emo.slice(0, 6),
        farbe: document.documentElement.getAttribute('data-blp-farbe'), bg: getComputedStyle(document.body).backgroundColor };
    });
    ok(app + ': Knöpfe und Reiter ≤ 32 px', r.hoch.length === 0, JSON.stringify(r.hoch));
    ok(app + ': normale Schriftstärke (nur der Hauptknopf kräftiger)', r.fett === 0, String(r.fett));
    ok(app + ': keine sichtbaren Emojis (Strichsymbole über die Brücke)', r.emo.length === 0, JSON.stringify(r.emo));
  }
  await ctx.close();
}
await schluss();
