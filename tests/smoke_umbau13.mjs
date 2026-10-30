// tests/smoke_umbau13.mjs — Pro-Umbau 13 (Klaus 2026-10-30), Gerüst aus smoke_umbau11 (pwa · app · win), die App-Seite lädt wie das
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

const PROBE = (art) => { const app = art !== 'pwa'; return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"><link rel="stylesheet" href="./assets/sbkim-blp.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><link rel="stylesheet" href="./native/pro-ueberall.css"><script src="./native/pro-ueberall.js"></script><script src="./native/pro-chefcode.js"></script><script>' + BRUECKE(art === 'win' ? 'windows' : 'android') + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
<body><div id="app-root"></div><script src="./assets/wfpdf/pdf-lib.min.js"></script><script type="module">
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
for (let i = 1; i <= 3; i++) { const b = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 probe ' + i)], (i === 1 ? 'Workflow-PDF-Scan-2026-10-29-14-33-12-Seite-1-bis-3-fuer-BookLedgerPro.pdf' : 'Rechnung-' + i + '.pdf'), { type: 'application/pdf' })); await setBelegText(b.id, 'Rechnung Nr. ' + i + ' Büromiete Oktober 2026, 890,00 EUR'); }
// Gestelltes Modell (wie smoke_belegsuche): langsam genug, dass der Abbruch aus der Mitteilung zwischen zwei Belegen ankommt.
const vec = (s) => { const v = new Float32Array(8); for (const c of String(s)) v[c.charCodeAt(0) % 8] += 1; const n = Math.hypot(...v) || 1; return Array.from(v, (x) => x / n); };
window.__blpEmbedderStub = { embedQuery: async (s) => vec(s), embedPassage: async (s) => { await new Promise((r) => setTimeout(r, window.__langsam || 0)); return vec(s); } };
{ const L = window.PDFLib; const d = await L.PDFDocument.create(); for (let k = 0; k < 4; k++) { const pg = d.addPage([300, 400]); pg.drawText('Seite ' + (k + 1), { x: 40, y: 340, size: 24 }); }
  await saveBeleg(new File([await d.save()], 'Echt.pdf', { type: 'application/pdf' })); }
window.__saveBeleg = saveBeleg;
// Eingebettete App Angebotsplaner (Workflow Calculate) mit einem Angebot — dieselbe Datenbank wie apps/calculate.
await new Promise((ok) => { const r = indexedDB.open('WorkflowCalculate1', 1); r.onupgradeneeded = () => { for (const s of ['angebote', 'kunden', 'bilder']) r.result.createObjectStore(s, { keyPath: 'id' }); };
  r.onsuccess = () => { const tx = r.result.transaction(['angebote', 'kunden'], 'readwrite'); tx.objectStore('angebote').put({ id: 'a1', nummer: 'A-2026-007', titel: 'Fassade streichen', kundeId: 'k1', positionen: [{ titel: 'Gerüst', menge: 1 }] });
    tx.objectStore('kunden').put({ id: 'k1', name: 'Malerbetrieb Sonne' }); tx.oncomplete = () => { r.result.close(); ok(); }; }; });
window.__probeBereit = true;
</script><script>window.SBKIM_DB_SUFFIX="bookledgerpro-sbkim";(function(){var st=['./sbkim/01_storage.js','./sbkim/20_schluessel_safe.js','./sbkim/02_spore.js','./sbkim/03_embedding.js','./sbkim/04_match.js','./assets/pruefer-mail.js?v=2','./sbkim/05_anastomose.js','./sbkim/07_apoptose.js','./sbkim/15_membran.js','./sbkim/16_siegel.js','./sbkim/17_floating_widget.js',['./sbkim/05b_nostr_relay.js','module'],'./sbkim/21_spracheingabe.js','./sbkim/23_rendezvous.js','./sbkim/23_rendezvous_ui.js','./sbkim/siegel-inhalt.js','./sbkim/sbkim-init.js'];for(var i=0;i<st.length;i++){var e=st[i];var s=document.createElement('script');if(Array.isArray(e)){s.type=e[1];e=e[0];}s.src=e;s.async=false;document.body.appendChild(s);}})();</script></body></html>`; };

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const probeArt = { '/__app.html': 'app', '/__pwa.html': 'pwa', '/__win.html': 'win' }[pfad];
  if (probeArt) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(probeArt)); }
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


const oeffnen = async (art, breite, hoehe = 900) => { const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } }); const page = await ctx.newPage(); const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message)); page.on('dialog', (d) => d.accept());
  await page.goto(BASIS + '/__' + art + '.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 });
  await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-zeilen-menue]', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300);
  return { ctx, page, fehler }; };

// Gestelltes Mycel: Raum mit einem Knoten, der auf jede Frage eine Zeile antwortet; Sprachmodell gestellt (kein Netz in der Probe).
const NETZ_STUB = () => {
  const r = window.SbkimRendezvous; window.__netz = { korpus: null, an: 0, aus: 0, fragen: [] };
  r.discover = async () => ({ ok: true, cards: [{ nodeId: 'n1', nodeName: 'BookLedgerPro · Büro-PC' }] });
  r.askNode = async (c, text) => { window.__netz.fragen.push(text); return { ok: true, bestaetigt: true, results: [{ label: 'Beleg · Miete Büro · 2026-10-01 · 890,00 €', score: 0.91, anchorId: 'beleg:x' }] }; };
  const conf = r.configure.bind(r); r.configure = (o) => { if (o && 'prepareCorpus' in o) window.__netz.prep = o.prepareCorpus; if (o && 'match' in o) window.__netz.match = o.match; return conf(o); };
  r.connectAndAnnounce = async () => ({ ok: true });
  r.enableAnswering = async () => { window.__netz.an++; window.__netz.korpus = window.__netz.prep ? await window.__netz.prep() : null; return { ok: true }; };
  r.disableAnswering = () => { window.__netz.aus++; };
  window.SbkimEmbedding = { init: async () => {}, embedPassage: async (s) => new Float32Array(384).fill(1 / Math.sqrt(384)), embedQuery: async () => new Float32Array(384) };
};
const warteStapel = (page) => page.waitForFunction(() => window.SbkimRendezvous && window.SbkimRendezvousUI && document.getElementById('sbkim-widget'), null, { timeout: 15000 }).catch(() => {});
const kontrast = (a, b) => { const L = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const [h, d] = [L(a), L(b)].sort((x, y) => y - x); return (h + 0.05) / (d + 0.05); };


const NATIV = existsSync(join(WURZEL, 'native/pro-ueberall.js'));
if (!NATIV) { console.log('nicht lauffähig: native/ fehlt (BookLedger Basic) — die PWA-Fassung prüft smoke_umbau11'); server.close(); await browser.close(); process.exit(0); }
for (const [art, b] of [['app', 1280], ['win', 1000], ['app', 400], ['pwa', 400]]) {
  const { ctx, page, fehler } = await oeffnen(art, b);
  await warteStapel(page); await page.evaluate(NETZ_STUB);
  const app = art !== 'pwa';

  // U — Überall suchen
  await page.evaluate(() => window.__probe.navigate('sbkimsuche')); await page.waitForTimeout(400);
  if (!app) {
    ok(`${art} ${b} px U: PWA behält ihre Fassung (kein gemeinsamer Kasten, eigene Karte)`, await page.evaluate(() => !document.getElementById('blpUeberall') && !!document.querySelector('[data-ue-karte]')));
  } else {
    const k = await page.evaluate(() => { const k = document.getElementById('blpUeberall'); if (!k) return null;
      return { titel: k.querySelector('h3')?.textContent, kurz: k.querySelector('.pro-ue-kurz')?.textContent, infoZu: k.querySelector('[data-pro-info-inhalt]')?.hidden,
        feld: !!k.querySelector('[data-pro-ue-frage][data-mikro]'), haken: [...k.querySelectorAll('[data-pro-ue-quelle]')].map((c) => c.dataset.proUeQuelle + '=' + c.checked).join(),
        tresorBruecke: !!(window.BLPNative && window.BLPNative.tresor) }; });
    ok(`${art} ${b} px U: gemeinsamer Kasten „Überall suchen“ (wie PB/WPP), Erklärung hinter ⓘ, Feld mit Mikrofon-Marke, Netz ab Werk aus`,
      k && k.titel === 'Überall suchen' && /verbundenen Programmen/.test(k.kurz) && k.infoZu && k.feld && k.haken === (k.tresorBruecke ? 'app=true,tresor=true,netz=false' : 'app=true,netz=false'), JSON.stringify(k));
    const suche = async (wort) => { await page.fill('#blpUeberall [data-pro-ue-frage]', wort); await page.click('#blpUeberall [data-pro-knopf="ueberall-suchen"]');
      await page.waitForFunction(() => /Treffer|Nichts/.test(document.querySelector('#blpUeberall [data-pro-ue-status]')?.textContent || ''), null, { timeout: 10000 }).catch(() => {}); };
    const gruppen = () => page.evaluate(() => [...document.querySelectorAll('#blpUeberall [data-pro-ue-gruppe]')].map((g) => g.dataset.proUeGruppe + ':' + g.querySelectorAll('li').length).join());
    await suche('Büromiete');
    ok(`${art} ${b} px U: „Büromiete“ → Gruppe BookLedgerPro mit den drei Belegen (Text am Beleg)`, (await gruppen()) === 'app:3' && await page.evaluate(() => /BookLedgerPro · 3/.test(document.querySelector('[data-pro-ue-gruppe="app"] h4').textContent)), await gruppen());
    ok(`${art} ${b} px U: KI-Prüfung ist ein Schalter unter der Liste, ab Werk aus`, await page.evaluate(() => { const s = document.querySelector('[data-ue-ki-schalter]'); return !!s && !s.checked; }));
    await page.click('[data-ue-ki-schalter]'); await page.waitForSelector('[data-ue-ki-hinweis]', { timeout: 5000 }).catch(() => {});
    ok(`${art} ${b} px U: ohne Mistral-Schlüssel sagt der Schalter es, nichts geht hinaus`, await page.evaluate(() => /Mistral-Schlüssel/.test(document.querySelector('[data-ue-ki-hinweis]')?.textContent || '')));
    await suche('Gerüst');
    ok(`${art} ${b} px U: „Gerüst“ → eigene Gruppe „Angebotsplaner“ mit dem Angebot`, await page.evaluate(() => /A-2026-007/.test(document.querySelector('[data-pro-ue-gruppe="app:Angebotsplaner"]')?.textContent || '')), await gruppen());
    if (k && k.tresorBruecke) {
      await page.evaluate(() => { window.__z.offen = true; }); await suche('Rechnung Strom');
      ok(`${art} ${b} px U: Tresorordner, Fach Eingang-BookLedgerPro, Zeile ist ein Knopf (öffnet die Tresorordner-Ansicht)`, await page.evaluate(() =>
        document.querySelector('[data-pro-ue-gruppe="tresor:eingang-bookledgerpro"] .pro-ue-name')?.tagName === 'BUTTON' && /Rechnung-Strom/.test(document.querySelector('[data-pro-ue-gruppe="tresor:eingang-bookledgerpro"]').textContent)), await gruppen());
      ok(`${art} ${b} px U: das eigene Fach „BookLedgerPro“ (Sicherungen) wird nicht gelesen`, await page.evaluate(() => !document.querySelector('[data-pro-ue-gruppe="tresor:bookledgerpro"]')));
      await page.evaluate(() => { window.__z.offen = false; }); await suche('Rechnung Strom');
      ok(`${art} ${b} px U: gesperrt → ruhiger Satz statt Fehler`, await page.evaluate(() => /gesperrt/.test(document.querySelector('#blpUeberall [data-pro-ue-status]').textContent)));
    }
    await page.check('#blpUeberall [data-pro-ue-quelle="netz"]'); await suche('Miete');
    await page.waitForSelector('#blpUeberall [data-pro-ue-gruppe="netz"]', { timeout: 8000 }).catch(() => {});
    ok(`${art} ${b} px U: Netz an → Knoten gefragt, Zeile „von BookLedgerPro · Büro-PC“`, await page.evaluate(() => window.__netz.fragen.includes('Miete') && /von BookLedgerPro · Büro-PC/.test(document.querySelector('[data-pro-ue-gruppe="netz"]')?.textContent || '')));
    await page.uncheck('#blpUeberall [data-pro-ue-quelle="netz"]');
    ok(`${art} ${b} px U: nichts läuft quer hinaus`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }

  // C — Chefcode und „Mit Ausschnitt antworten“
  await page.evaluate(() => window.__probe.navigate('network')); await page.waitForSelector('[data-net-einfach]');
  const c0 = await page.evaluate(() => ({ kasten: !!document.getElementById('blpChefcode'), aus: document.querySelector('[data-net-ausschnitt]')?.disabled, hinweis: !!document.querySelector('[data-net-ausschnitt-hinweis]'),
    lage: document.querySelector('#blpChefcode [data-pro-cc-lage]')?.dataset.proCcLage }));
  ok(`${art} ${b} px C: ${app ? 'Kasten „Chefcode“ auf der Mycel-Seite, öffentlich ab Werk' : 'PWA ohne Chefcode-Kasten'}; „Mit Ausschnitt“ gesperrt ohne eigenes Netz, mit Hinweis`,
    c0.kasten === app && (!app || c0.lage === 'oeffentlich') && c0.aus === true && c0.hinweis, JSON.stringify(c0));
  if (app) {
    await page.fill('#blpChefcode [data-pro-cc-feld]', 'probe-buero-2026-ab');
    await page.click('#blpChefcode [data-pro-knopf="chefcode-uebernehmen"]');
    await page.waitForFunction(() => window.SbkimRendezvous._meta.network === 'eigen' && document.querySelector('[data-net-ausschnitt]') && !document.querySelector('[data-net-ausschnitt]').disabled, null, { timeout: 20000 }).catch(() => {});
    ok(`${art} ${b} px C: Chefcode → Modul 23 im eigenen Netz, „Mit Ausschnitt“ frei, Code nirgends im Bild`, await page.evaluate(() =>
      window.SbkimRendezvous._meta.network === 'eigen' && !document.querySelector('[data-net-ausschnitt]').disabled && !/PROBEBUERO|probe-buero/i.test(document.body.innerHTML + document.body.innerText)));
    await page.click('[data-net-ausschnitt]'); await page.waitForTimeout(200);
    await page.click('[data-net-antworten]');
    await page.waitForFunction(() => window.__netz.an > 0 && window.__netz.match, null, { timeout: 10000 }).catch(() => {});
    const k1 = await page.evaluate(() => (window.__netz.korpus || []).map((e) => ({ l: e.label, t: e.text })));
    ok(`${art} ${b} px C: mit Ausschnitt → Belegtext zählt beim Vergleichen mit, Titelzeile bleibt Titel · Datum · Betrag`,
      k1.length === 4 && k1.filter((e) => /Büromiete/.test(e.t)).length === 3 && k1.every((e) => /^Beleg · /.test(e.l) && !/Büromiete/.test(e.l)), JSON.stringify(k1.map((e) => e.l)));
    await page.evaluate(() => { window.__filter = window.__netz.match; });   // derselbe Filter, den Modul 23 bei jeder Frage benutzt
    const antwort = () => page.evaluate(async () => { window.SbkimMatch.setLocalCorpus(window.__netz.korpus); const h = await window.__filter.queryLocal('Büromiete Oktober', 5, { hybrid: true }); return h.map((x) => x.label); });
    const imEigenen = await antwort();
    ok(`${art} ${b} px C: im eigenen Netz hängt jede Belegantwort einen Ausschnitt an (≤ 200 Zeichen, nie die Datei)`, imEigenen.length > 0 && imEigenen.every((l) => / — .*Büromiete/.test(l) && l.length <= 200), JSON.stringify(imEigenen));
    await page.click('#blpChefcode [data-pro-knopf="chefcode-entfernen"]');
    await page.waitForFunction(() => window.SbkimRendezvous._meta.network === 'oeffentlich', null, { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[data-net-antwort-status]'); await page.waitForTimeout(200);
    ok(`${art} ${b} px C: Chefcode entfernt → öffentlich, Antworten mit Ausschnitt aus (mit Satz), Filter abgemeldet`, await page.evaluate(() => window.SbkimRendezvous._meta.network === 'oeffentlich' && window.__netz.aus > 0 && window.__netz.match === null
      && /Ausschnitt sind aus/.test(document.querySelector('[data-net-antwort-status]')?.textContent || '') && document.querySelector('[data-net-ausschnitt]').disabled));
    const oeffentlich = await antwort();
    ok(`${art} ${b} px C: außerhalb eines eigenen Netzes antwortet der Ausschnitt-Filter gar nicht (auch nicht bei jeder späteren Frage)`, oeffentlich.length === 0, JSON.stringify(oeffentlich));
  }
  ok(`${art} ${b} px: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
await schluss();
