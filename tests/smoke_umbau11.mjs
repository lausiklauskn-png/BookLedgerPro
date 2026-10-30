// tests/smoke_umbau11.mjs — Pro-Umbau 11 (Klaus 2026-10-30): Mycel und „Überall suchen“, Gerüst wie smoke_befunde10 (pwa · app · win)
//   A Menü: „Überall suchen“ und „Mycel“ in der Gruppe Netz · B Überall suchen über App, eingebettete Apps, Tresorordner, Netz (gestellt)
//   C KI-Prüfung nur Schalter · D Passendes Konto finden in Neue Buchung · E Mycel-Kasten, Antworten nur Titel/Datum/Betrag
//   F Siegel unten in der Leiste · G Kanon-Fenster im Design der App (hell und dunkel) · H Mycel-Knopf nicht über der Leiste
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
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>' + BRUECKE(art === 'win' ? 'windows' : 'android') + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
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
  const conf = r.configure.bind(r); r.configure = (o) => { if (o && 'prepareCorpus' in o) window.__netz.prep = o.prepareCorpus; return conf(o); };
  r.connectAndAnnounce = async () => ({ ok: true });
  r.enableAnswering = async () => { window.__netz.an++; window.__netz.korpus = window.__netz.prep ? await window.__netz.prep() : null; return { ok: true }; };
  r.disableAnswering = () => { window.__netz.aus++; };
  window.SbkimEmbedding = { init: async () => {}, embedPassage: async (s) => new Float32Array(384).fill(1 / Math.sqrt(384)), embedQuery: async () => new Float32Array(384) };
};
const warteStapel = (page) => page.waitForFunction(() => window.SbkimRendezvous && window.SbkimRendezvousUI && document.getElementById('sbkim-widget'), null, { timeout: 15000 }).catch(() => {});
const kontrast = (a, b) => { const L = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const [h, d] = [L(a), L(b)].sort((x, y) => y - x); return (h + 0.05) / (d + 0.05); };

// In BookLedger Basic fehlt native/ — dort laufen nur die PWA-Teile (wie smoke_befunde10).
const NATIV = existsSync(join(WURZEL, 'native/blp-native.js'));
for (const [art, b] of [['pwa', 1280], ['app', 1280], ['win', 1000], ['pwa', 400], ['app', 400]].filter(([a]) => NATIV || a === 'pwa')) {
  const { ctx, page, fehler } = await oeffnen(art, b);
  await warteStapel(page); await page.evaluate(NETZ_STUB);
  const breit = b > 640;

  // A — Menü
  const menue = await page.evaluate(() => ({ ueberall: !!document.querySelector('.nav-item[data-nav="sbkimsuche"]'), text: document.querySelector('.nav-item[data-nav="sbkimsuche"]')?.textContent.trim(),
    mycel: document.querySelector('.nav-item[data-nav="network"]')?.textContent.trim(), alt: /SBKIM-Suche/.test(document.querySelector('.app-nav').textContent) }));
  ok(`${art} ${b} px A: Menü „Überall suchen“ und „Mycel“, kein „SBKIM-Suche“ mehr`, menue.ueberall && menue.text === 'Überall suchen' && menue.mycel === 'Mycel' && !menue.alt, JSON.stringify(menue));

  // B — Überall suchen
  await page.evaluate(() => window.__probe.navigate('sbkimsuche')); await page.waitForSelector('[data-ue-frage]'); await page.waitForTimeout(300);
  const kurz = await page.evaluate(() => { const p = document.querySelector('[data-ue-kurz]'); return { text: p?.textContent, sichtbar: !!p && p.getClientRects().length > 0, mehr: !!document.querySelector('[data-ue-mehr] > summary'),
    mikro: !!document.querySelector('[data-ue-frage]')?.closest('[data-mikro-huelle]'), tresor: !!document.querySelector('[data-ue-quelle="tresor"]'), netzAus: document.querySelector('[data-ue-quelle="netz"]')?.checked === false }; });
  ok(`${art} ${b} px B: kurze Zeile sichtbar, „Mehr dazu“, Mikrofon im Feld, Netz ab Werk aus`, kurz.sichtbar && /verbundenen Programmen/.test(kurz.text) && kurz.mehr && kurz.mikro && kurz.netzAus, JSON.stringify(kurz));
  ok(`${art} ${b} px B: Haken „Tresorordner“ nur in der App`, kurz.tresor === (art !== 'pwa'));
  await page.fill('[data-ue-frage]', 'Büromiete'); await page.click('[data-ue-suchen]');
  await page.waitForSelector('[data-ue-gruppe="app"]', { timeout: 8000 }).catch(() => {});
  ok(`${art} ${b} px B: „Büromiete“ findet die drei Belege (Text am Beleg, entschlüsselt nur hier)`, await page.evaluate(() => document.querySelectorAll('[data-ue-gruppe="app"] [data-ue-typ="beleg"]').length === 3));
  await page.fill('[data-ue-frage]', 'Gerüst'); await page.click('[data-ue-suchen]');
  await page.waitForSelector('[data-ue-gruppe="calculate"]', { timeout: 8000 }).catch(() => {});
  ok(`${art} ${b} px B: „Gerüst“ findet das Angebot im Angebotsplaner`, await page.evaluate(() => /A-2026-007/.test(document.querySelector('[data-ue-gruppe="calculate"]')?.textContent || '')));
  ok(`${art} ${b} px B: die Bedarfsanalyse-Datenbank wird beim Suchen nicht angelegt`, await page.evaluate(async () => !(await indexedDB.databases()).some((d) => d.name === 'WorkflowNeeds1')));
  if (art !== 'pwa') {
    await page.evaluate(() => { window.__z.offen = true; });
    await page.fill('[data-ue-frage]', 'Rechnung Strom'); await page.click('[data-ue-suchen]');
    await page.waitForSelector('[data-ue-gruppe="tresor"]', { timeout: 8000 }).catch(() => {});
    ok(`${art} ${b} px B: Tresorordner (Fach Eingang) wird mitgesucht`, await page.evaluate(() => /Rechnung-Strom/.test(document.querySelector('[data-ue-gruppe="tresor"]')?.textContent || '')));
    await page.evaluate(() => { window.__z.offen = false; }); await page.click('[data-ue-suchen]'); await page.waitForFunction(() => /gesperrt/.test(document.querySelector('[data-ue-status]')?.textContent || ''), null, { timeout: 5000 }).catch(() => {});
    ok(`${art} ${b} px B: gesperrter Tresorordner wird genannt, nicht still übergangen`, await page.evaluate(() => /gesperrt/.test(document.querySelector('[data-ue-status]')?.textContent || '')));
  }
  await page.check('[data-ue-quelle="netz"]'); await page.fill('[data-ue-frage]', 'Miete'); await page.click('[data-ue-suchen]');
  await page.waitForSelector('[data-ue-gruppe="netz"]', { timeout: 8000 }).catch(() => {});
  const netz = await page.evaluate(() => ({ zeile: document.querySelector('[data-ue-gruppe="netz"]')?.textContent || '', gefragt: window.__netz.fragen }));
  ok(`${art} ${b} px B: Netz an → Knoten im Raum gefragt, Zeile mit Herkunft „von BookLedgerPro · Büro-PC“`, netz.gefragt.includes('Miete') && /Miete Büro/.test(netz.zeile) && /Büro-PC/.test(netz.zeile), JSON.stringify(netz));
  await page.uncheck('[data-ue-quelle="netz"]');

  // C — KI nur Schalter
  const ki = await page.evaluate(() => { const s = document.querySelector('[data-ue-ki-schalter]'); return { da: !!s, aus: s && !s.checked }; });
  ok(`${art} ${b} px C: KI-Prüfung ist ein Schalter unter der Liste, ab Werk aus`, ki.da && ki.aus);
  await page.click('[data-ue-ki-schalter]'); await page.waitForSelector('[data-ue-ki-hinweis]', { timeout: 5000 }).catch(() => {});
  ok(`${art} ${b} px C: ohne Mistral-Schlüssel sagt der Schalter es, nichts geht hinaus`, await page.evaluate(() => /Mistral-Schlüssel/.test(document.querySelector('[data-ue-ki-hinweis]')?.textContent || '')));

  // D — Konto finden
  await page.evaluate(() => window.__probe.navigate('journal')); await page.waitForSelector('[data-konto-finden]', { timeout: 8000 }).catch(() => {});
  await page.click('[data-konto-finden]'); await page.fill('[data-kf-frage]', 'Büromiete');
  await page.waitForSelector('[data-kf-konto="4210"]', { timeout: 5000 }).catch(() => {});
  ok(`${art} ${b} px D: „Passendes Konto finden“ in Neue Buchung — „Büromiete“ → 4210 ohne Modell`, !!(await page.$('[data-kf-konto="4210"]')));
  if (await page.$('[data-kf-soll="4210"]')) await page.click('[data-kf-soll="4210"]');
  ok(`${art} ${b} px D: „Als Soll“ setzt das Konto im Formular`, await page.evaluate(() => [...document.querySelectorAll('#content form select')].some((s) => s.value === '4210')));
  await page.evaluate(() => window.__probe.navigate('accounts')); await page.waitForTimeout(400);
  ok(`${art} ${b} px D: der Knopf steht auch bei den Konten`, !!(await page.$('#content [data-konto-finden]')));

  // E — Mycel-Kasten
  await page.evaluate(() => window.__probe.navigate('network')); await page.waitForSelector('[data-net-einfach]');
  const net = await page.evaluate(() => ({ kurz: document.querySelector('[data-net-kurz]')?.textContent, sbkim: document.querySelector('[data-net-sbkim]')?.textContent, siegel: !!document.querySelector('[data-net-siegel] svg'),
    entw: document.querySelector('[data-net-entwickler]')?.open === false, programme: [...document.querySelectorAll('[data-net-programm]')].map((x) => x.dataset.netProgramm),
    fach: /Korpus|Spore|Richter/.test([...document.querySelectorAll('[data-net-einfach], [data-net-programme]')].map((x) => x.textContent).join(' ')) }));
  ok(`${art} ${b} px E: einfacher Kasten — kurze Zeile, „Läuft mit SBKIM“, Siegel, Fachliches hinter „Für Entwickler“ (zu)`, /Programme/.test(net.kurz) && /SBKIM/.test(net.sbkim) && net.siegel && net.entw && !net.fach, JSON.stringify(net));
  ok(`${art} ${b} px E: verbundene Programme — Angebotsplaner, Bedarfsanalyse, Workflow PDF Pro, Private Brain Pro, andere Arbeitsplätze`, net.programme.length === 5 && net.programme.includes('Workflow PDF Pro') && net.programme.includes('Private Brain Pro'));
  await page.click('[data-net-antworten]');
  await page.waitForFunction(() => window.__netz.an > 0, null, { timeout: 8000 }).catch(() => {});
  const korp = await page.evaluate(() => window.__netz.korpus);
  ok(`${art} ${b} px E: „Anderen antworten“ an → Korpus nur Titel · Datum · Betrag, nie der Belegtext`, Array.isArray(korp) && korp.length === 4 && korp.every((e) => /^Beleg · /.test(e.label) && !/Büromiete|890,00/.test(e.text) && Array.isArray(e.passageVec)), JSON.stringify((korp || []).map((e) => e.label)));
  await page.waitForSelector('[data-net-antworten]'); await page.click('[data-net-antworten]');
  ok(`${art} ${b} px E: aus → Antworten abgeschaltet`, await page.evaluate(() => window.__netz.aus > 0));
  await page.click('[data-net-verbinden]'); await page.waitForTimeout(400);
  ok(`${art} ${b} px E: „Verbinden …“ öffnet das Mycel-Fenster`, await page.evaluate(() => { const p = document.getElementById('sbkim-rdv-panel'); return !!p && p.getClientRects().length > 0; }));

  // G — Kanon-Fenster im Design der App (hell)
  const farbe = await page.evaluate(() => { const surf = getComputedStyle(document.querySelector('.app-nav')).backgroundColor; const p = document.getElementById('sbkim-rdv-panel'); const cs = getComputedStyle(p);
    const w = getComputedStyle(document.getElementById('sbkim-widget'));
    const texte = [...p.querySelectorAll('*')].filter((x) => x.childNodes.length && [...x.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) && x.getClientRects().length).slice(0, 40).map((x) => getComputedStyle(x).color);
    return { surf, panel: cs.backgroundColor, text: cs.color, widget: w.backgroundColor, texte }; });
  ok(`${art} ${b} px G: Mycel-Fenster und schwebendes Fenster haben die Fläche der App`, farbe.panel === farbe.surf && farbe.widget === farbe.surf, JSON.stringify(farbe).slice(0, 300));
  const schwach = farbe.texte.filter((c) => kontrast(c, farbe.surf) < 4.5);
  ok(`${art} ${b} px G: jede Schrift im Mycel-Fenster lesbar (≥ 4,5 : 1)`, schwach.length === 0, schwach.join(' | '));
  await page.evaluate(() => window.SbkimRendezvousUI.hide());

  // H — Mycel-Knopf nicht über der Leiste (ab 641 px)
  if (breit) {
    const lage = await page.evaluate(() => ({ btn: document.getElementById('sbkim-rdv-btn').getBoundingClientRect().left, nav: document.querySelector('.app-nav').getBoundingClientRect().right }));
    ok(`${art} ${b} px H: der Mycel-Knopf liegt rechts neben der Leiste`, lage.btn >= lage.nav, JSON.stringify(lage));
  }

  // F — Siegel unten in der Leiste
  if (!breit) await page.click('.nav-toggle');
  const sg = await page.evaluate(() => { const s = document.querySelector('[data-nav-siegel]'); const r = s && s.getBoundingClientRect(); return { da: !!s && s.getClientRects().length > 0, text: s?.textContent.trim(), svg: !!s?.querySelector('svg') }; });
  ok(`${art} ${b} px F: Siegel unten in der Leiste („Läuft mit SBKIM“)`, sg.da && sg.svg && /SBKIM/.test(sg.text), JSON.stringify(sg));
  await page.click('[data-nav-siegel]'); await page.waitForSelector('.siegel-modal', { timeout: 5000 }).catch(() => {});
  ok(`${art} ${b} px F: Tipp öffnet das Siegel groß, mit „Bausteine prüfen“ (Kanon-Siegel)`, await page.evaluate(() => !!document.querySelector('.siegel-modal .siegel-wappen-gross svg') && !!document.querySelector('[data-siegel-module]')));
  await page.click('[data-siegel-module]'); await page.waitForTimeout(500);
  const sm = await page.evaluate(() => { const d = document.querySelector('#sbkim-siegel-modal [role="dialog"]'); const surf = getComputedStyle(document.querySelector('.app-nav')).backgroundColor; return { da: !!d && d.getClientRects().length > 0, bg: d && getComputedStyle(d).backgroundColor, surf }; });
  ok(`${art} ${b} px G: das Kanon-Siegel (Modul 16) öffnet in den Farben der App`, sm.da && sm.bg === sm.surf, JSON.stringify(sm));
  await page.keyboard.press('Escape'); await page.evaluate(() => document.querySelectorAll('#sbkim-siegel-modal [data-siegel-backdrop]').forEach((x) => x.click()));

  // G dunkel
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); window.SbkimRendezvousUI.show(); }); await page.waitForTimeout(300);
  const dunkel = await page.evaluate(() => { const surf = getComputedStyle(document.querySelector('.app-nav')).backgroundColor; const p = document.getElementById('sbkim-rdv-panel');
    const texte = [...p.querySelectorAll('*')].filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) && x.getClientRects().length).slice(0, 40).map((x) => getComputedStyle(x).color);
    return { surf, panel: getComputedStyle(p).backgroundColor, texte }; });
  const schwachD = dunkel.texte.filter((c) => kontrast(c, dunkel.surf) < 4.5);
  ok(`${art} ${b} px G: dunkel — Fläche der App, Schrift lesbar`, dunkel.panel === dunkel.surf && schwachD.length === 0, schwachD.join(' | '));
  await page.evaluate(() => { window.SbkimRendezvousUI.hide(); document.documentElement.setAttribute('data-theme', 'light'); });

  ok(`${art} ${b} px: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
await schluss();
