// tests/smoke_tresorfund.mjs — Funde aus den Fächern der anderen Pro-Apps (Klaus 2026-11-09): Bedeutungssuche über die Tresor-
// Verzeichnisse mit „in Meine Familienakte“, Lesen fremder Dateien (nur lesen), Familienakte in der Fachliste.
// Gerüst und gestellte Brücke aus tests/smoke_umbau13.mjs — Pro-Umbau 13 (Klaus 2026-10-30), Gerüst aus smoke_umbau11 (pwa · app · win), die App-Seite lädt wie das
// echte Paket (tools/native/prepare-web.mjs) zusätzlich die gemeinsamen Bausteine pro-ueberall.css/.js und pro-chefcode.js:
//   U „Überall suchen“ = gemeinsamer Kasten wie in Private Brain Pro und Workflow PDF Pro (BLP-Quellen, Angebotsplaner als eigene
//     Gruppe, Tresorordner, Netz, KI-Schalter darunter) · PWA behält ihre Fassung
//   C Chefcode auf der Mycel-Seite gegen das echte Modul 23 · „Mit Ausschnitt antworten“ nur im eigenen Netz; der Antwort-Filter
//     antwortet außerhalb eines eigenen Netzes gar nicht und hängt im eigenen Netz einen Ausschnitt an (Modul 04 echt, Modell gestellt)
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
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
  const z = window.__z = { gewaehlt: true, vorhanden: true, offen: false, gemerkt: true, erreichbar: true, ordner: 'Privat Brain Pro Hauptablageordner', pfad: 'Privat Brain Pro Hauptablageordner', speicher: 'karte' };
  const log = (m, a) => window.__log.push([m, JSON.parse(JSON.stringify(a || {}))]);
  const E = (id, verweis, extra = {}) => ({ id, name: id + '.pdf', art: 'application/pdf', verweis, verschluesselung: 'fpt1', datum: 1761650000000 + id.length, groesse: 9, auszug: 'Rechnung ' + id, ...extra });
  window.__marken = {};
  window.__fach = { 'eingang-bookledgerpro': [E('Rechnung-Strom', 'Mails/r1.fpt'), E('Rechnung-Gas', 'Mails/r2.fpt'), E('Quittung', 'q.fpt')],
    'familienakte': [E('Beleg Apotheke am Markt', 'Gesundheit/fa1.fpt', { auszug: 'Gesundheit · Apotheke am Markt · Arznei · 2026-10-12 · 18,40 EUR' })],
    'eingang-familienakte': [E('Kita Beitrag', 'k1.fpt', { auszug: 'Kinder · Kita Sonnenschein · Beitrag November' })],
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
    ablegenBeginnen: async (a) => { if (!z.offen) throw new Error('TRESOR_GESPERRT'); log('ablegenBeginnen', a); return { ticket: 't1' }; },
    ablegenTeil: async (a) => (log('ablegenTeil', { laenge: a.data.length }), {}), ablegenFertig: async (a) => (log('ablegenFertig', a), { id: 'neu1' }), ablegenAbbrechen: async () => ({}),
    lesenOeffnen: async (a) => { log('lesenOeffnen', a); const e = (window.__fach[a.fach] || []).find((x) => x.id === a.id); if (!e || e.verschluesselung !== 'fpt1') throw new Error('TRESOR_NUR_IN_DER_APP'); return { ticket: 'l' + a.id, name: e.name, art: 'application/pdf', groesse: 9 }; },
    lesenTeil: async () => ({ data: btoa('%PDF-1.4 probe'), fertig: true }),
    markieren: async (a) => { log('markieren', a); (window.__marken[a.fach] = window.__marken[a.fach] || new Set()).add(a.id); },
    passwortAendern: async () => ({}), ersatzErstellen: async () => ({ teile: [] }), wiederherstellen: async () => zustand(),
  };
  const F = { save: async () => ({ saved: true }), share: async () => ({ shared: true }), appInfo: async () => ({ version: '0.1.1-debug' }) };
  let hoerer = null;
  const H = { aufraeumen: async () => log('h.aufraeumen'), erlauben: async () => (log('h.erlauben'), { mitteilung: true }),
    beginnen: async (a) => (log('h.beginnen', a), { geschuetzt: true }), stand: async (a) => log('h.stand', a), ende: async (a) => log('h.ende', a),
    addListener: (n, fn) => { hoerer = fn; return { remove() {} }; } };
  window.__mitteilungAbbruch = () => { const b = window.__log.filter((x) => x[0] === 'h.beginnen').pop(); if (b && hoerer) hoerer({ id: b[1].id, grund: 'mitteilung' }); };
  const SP = { zuhoeren: async () => ({ text: '' }) };
  const U = { pruefen: async () => ({ version: '0.1.3' }), installieren: async () => ({}), addListener: () => ({ remove() {} }) };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => '${plattform}', Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H, BlpUpdates: U, BlpSpeech: SP } };
})();`;

const PROBE = () => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><link rel="stylesheet" href="./native/pro-ueberall.css"><script src="./native/pro-ueberall.js"></script><script>${BRUECKE('android')}</script><script src="./native/blp-native.js"></script></head>
<body><div id="app-root"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, navigate } from './src/state.js';
import { ensureAccountsSeeded } from './src/domain/store.js';
import { renderShell } from './src/ui/shell.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', bedeutungssuche: 'an' });
await ensureAccountsSeeded();
renderShell(document.getElementById('app-root'), { onLock: () => {} });
// Gestelltes Modell mit kleinem Bedeutungsraum: Apotheke/Arznei/Medikament liegen beisammen, Kita woanders.
const GRUPPEN = [['apotheke', 'arznei', 'medikament', 'medizin'], ['kita', 'kinder', 'beitrag'], ['rechnung', 'quittung', 'beleg', 'bezahlt']];
const vec = (s) => { const v = new Float32Array(4); const w = String(s).toLowerCase(); GRUPPEN.forEach((g, i) => { for (const x of g) if (w.includes(x)) v[i] += 1; }); v[3] += 0.05; const n = Math.hypot(...v) || 1; return Array.from(v, (x) => x / n); };
window.__blpEmbedderStub = { embedQuery: async (s) => vec(s), embedPassage: async (s) => vec(s) };
window.__probe = { navigate };
window.__probeBereit = true;
</script></body></html>`;

const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__app.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE()); }
  const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const datei = join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(datei); res.writeHead(200, { 'content-type': TYP[extname(datei)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); }
});
if (!existsSync(join(WURZEL, 'native/pro-ueberall.js'))) { console.log('nur in der Pro-App (native/pro-ueberall.js fehlt) — übersprungen'); process.exit(0); }
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASIS = `http://127.0.0.1:${server.address().port}`;
let browser;
try { browser = await pw.chromium.launch(CHROMIUM ? { executablePath: CHROMIUM, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }
const fehler = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } }); const page = await ctx.newPage();
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(BASIS + '/__app.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 });
  await page.evaluate(() => { window.__z.offen = true; window.__probe.navigate('sbkimsuche'); }); await page.waitForSelector('#blpUeberall', { timeout: 8000 });
  const suche = async (wort) => { await page.fill('#blpUeberall [data-pro-ue-frage]', wort); await page.click('#blpUeberall [data-pro-knopf="ueberall-suchen"]');
    await page.waitForFunction(() => /Treffer|Nichts/.test(document.querySelector('#blpUeberall [data-pro-ue-status]')?.textContent || ''), null, { timeout: 10000 }).catch(() => {}); };
  const zeilen = () => page.evaluate(() => [...document.querySelectorAll('#blpUeberall li.pro-ue-zeile')].map((li) => ({ h: li.dataset.proUeHerkunft, typ: li.dataset.proUeTyp,
    name: li.querySelector('.pro-ue-name')?.textContent, knopf: li.querySelector('.pro-ue-name')?.tagName === 'BUTTON', stelle: li.querySelector('.pro-ue-stelle')?.textContent || '',
    gruppe: li.closest('[data-pro-ue-gruppe]')?.querySelector('h4')?.textContent || '' })));

  console.log('— A. Bedeutung: „Medikamente bezahlt“ steht so nirgends —');
  await suche('Medikamente bezahlt');
  let z = await zeilen();
  const fa = z.find((x) => /Apotheke/.test(x.name || ''));
  ok('Fund aus der Familienakte nach Bedeutung (ohne das Wort)', !!fa && fa.typ === 'familienakte', JSON.stringify(z));
  ok('Zeile sagt, in welchem Programm: „in Meine Familienakte“', !!fa && /in Meine Familienakte/.test(fa.stelle), fa && fa.stelle);
  ok('eigene Gruppe „Im Tresor nach Bedeutung“', !!fa && /Im Tresor nach Bedeutung/.test(fa.gruppe), fa && fa.gruppe);
  ok('Kita-Eintrag (andere Bedeutung) erscheint nicht', !z.some((x) => /Kita/.test(x.name || '')));
  ok('Fund ist antippbar (gemeinsames Format)', !!fa && fa.knopf);

  console.log('— B. Nur lesen —');
  await page.click('#blpUeberall li.pro-ue-zeile[data-pro-ue-typ="familienakte"] .pro-ue-name');
  await page.waitForSelector('[data-beleg-vorschau]', { timeout: 8000 }).catch(() => {});
  const v = await page.evaluate(() => { const box = document.querySelector('[data-beleg-vorschau]'); return box ? { id: box.dataset.belegVorschau, text: box.textContent,
    loeschen: !!box.querySelector('[data-vorschau-loeschen]'), uebernehmen: !!box.querySelector('[data-tresor-fund-uebernehmen]'),
    gelesen: window.__log.filter((x) => x[0] === 'lesenOeffnen').map((x) => x[1].fach + ':' + x[1].id), markiert: window.__log.some((x) => x[0] === 'markieren') } : null; });
  ok('Vorschau öffnet die Datei aus dem Fach familienakte', !!v && v.id === 'tresor:familienakte:Beleg Apotheke am Markt' && v.gelesen.includes('familienakte:Beleg Apotheke am Markt'), JSON.stringify(v));
  ok('„nur zum Lesen“ steht da, kein Löschen, Weg zum Übernehmen', !!v && /nur zum Lesen/.test(v.text) && /in Meine Familienakte/.test(v.text) && !v.loeschen && v.uebernehmen);
  ok('nichts markiert oder übernommen', !!v && !v.markiert);
  await page.click('[data-vorschau-zu]');

  console.log('— C. Wortsuche findet Familienakte im Tresor, fremdes Format nur als Zeile —');
  await suche('Apotheke');
  z = await zeilen();
  const wort = z.find((x) => x.h === 'tresor' && x.typ === 'familienakte');
  ok('Wortsuche: Familienakte-Eintrag in der Tresor-Gruppe, antippbar', !!wort && wort.knopf, JSON.stringify(z));
  ok('kein Doppel: derselbe Eintrag nicht noch einmal „nach Bedeutung“', z.filter((x) => /Apotheke/.test(x.name || '')).length === 1);
  await suche('Notiz');
  z = await zeilen();
  const pb = z.find((x) => x.typ === 'private-brain');
  ok('Private-Brain-Eintrag (eigenes Format) bleibt eine Zeile ohne Öffnen', !!pb && !pb.knopf, JSON.stringify(z));

  console.log('— D. Bedeutungssuche aus —');
  await page.evaluate(async () => { const { updateSettings } = await import('./src/state.js'); await updateSettings({ bedeutungssuche: 'aus' }, { still: true }); });
  await suche('Medikamente bezahlt');
  ok('ohne Bedeutungssuche keine Bedeutungs-Funde', !(await zeilen()).some((x) => /Apotheke/.test(x.name || '')));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
} finally { await browser.close(); server.close(); }
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
