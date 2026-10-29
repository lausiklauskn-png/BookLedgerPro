// tests/smoke_befunde7.mjs — Klaus' Gegenprobe am Tablet (2026-10-29, Pro-Umbau 7): Belegliste passt in jede Breite (⋯ sichtbar, Datum nicht
// überschrieben), Tipp auf den Namen zeigt das Dokument (PDF-Seiten, Bild) mit Weitergeben/Löschen, Bilder/PDFs lassen sich in die
// Schnellerfassung einfügen oder hineinziehen. Gerüst und gestellte Brücken wie smoke_umbau4. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
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
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H } };
})();`;

const PROBE = (app) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>' + BRUECKE + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
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


// Sichtbare Bildzeichen: Text, title/aria-label/placeholder; SBKIM-Fenster (Kanon, byte-1:1) ausgenommen.
const emojis = (page) => page.evaluate(() => {
  const ist = (v) => /\p{Extended_Pictographic}/u.test(String(v || '').replace(/[↗©™®↔↕↺↻]/gu, ''));
  const aus = '[id^="sbkim"],[class*="sbkim"],[hidden],script,style,iframe,[data-symbole]';
  const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!ist(n.nodeValue)) continue; const e = n.parentElement;
    if (!e || e.closest(aus)) continue;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width <= 1 || r.height <= 1 || cs.visibility === 'hidden' || !e.getClientRects().length) continue;
    out.push('«' + n.nodeValue.trim().slice(0, 60) + '»');
  }
  for (const e of document.querySelectorAll('[title],[aria-label],[placeholder]')) {
    if (e.closest(aus) || !e.getClientRects().length) continue;
    for (const a of ['title', 'aria-label', 'placeholder']) if (ist(e.getAttribute(a))) out.push(a + ' «' + e.getAttribute(a).slice(0, 60) + '»');
  }
  return out;
});
async function rundgang(page) {
  const funde = {};
  const keys = await page.evaluate(() => window.__probe.NAV_KEYS);
  for (const k of keys) {
    if (k === 'calculate' || k === 'needs') continue;   // eingebettete Apps: byte-1:1 (apps/), eigener Rahmen
    await page.evaluate((k) => window.__probe.navigate(k), k);
    await page.waitForTimeout(450);
    await page.evaluate(() => document.querySelectorAll('#content details').forEach((d) => { d.open = true; }));
    await page.waitForTimeout(120);
    const f = await emojis(page); if (f.length) funde[k] = f;
  }
  return funde;
}


const oeffnen = async (art, breite, hoehe = 900) => { const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } }); const page = await ctx.newPage(); const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message)); page.on('dialog', (d) => d.accept());
  await page.goto(BASIS + '/__' + art + '.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 });
  await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-zeilen-menue]', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300);
  return { ctx, page, fehler }; };
const arten = ['pwa', ...(existsSync(join(WURZEL, 'native/blp-native.js')) ? ['app'] : [])];

console.log('— A. Belegliste passt in jede Breite —');
for (const art of arten) for (const b of [400, 640, 800, 1000, 1280, 1920]) {
  const { ctx, page } = await oeffnen(art, b);
  const m = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, raus = [];
    for (const e of document.querySelectorAll('.beleg-liste *')) { const r = e.getBoundingClientRect(); if (r.width && r.right > W + 0.5 && !e.closest('.zeilen-menue-liste')) raus.push(e.className && e.className.baseVal === undefined ? String(e.className).slice(0, 30) : e.tagName); }
    const karte = document.querySelector('.beleg-liste-karte'); const tab = document.querySelector('.beleg-liste');
    const knopf = document.querySelector('[data-zeilen-menue] > summary'); const kr = knopf && knopf.getBoundingClientRect();
    const zelleUeber = [...document.querySelectorAll('td.datum-zelle, td.groesse-zelle')].filter((e) => e.scrollWidth > e.clientWidth + 0.5).length;
    return { raus: raus.length, erstes: raus[0] || '', tabUeber: tab ? tab.scrollWidth > tab.clientWidth + 1 || (karte && karte.scrollWidth > karte.clientWidth + 1) : true,
      knopf: !!kr && kr.right <= W && kr.left >= 0 && kr.width > 0, zelleUeber };
  });
  ok(`${art} ${b} px: nichts ragt rechts hinaus, ⋯ ganz sichtbar, Datum/Größe ohne Überlauf`, m.raus === 0 && !m.tabUeber && m.knopf && m.zelleUeber === 0, JSON.stringify(m));
  await ctx.close();
}
// Breite Festbreitenschrift (Tablet): Datum darf trotzdem nicht in die Größe laufen.
{ const { ctx, page } = await oeffnen('pwa', 1000);
  await page.addStyleTag({ content: ':root{--mono: "DejaVu Sans Mono", monospace} .mono{letter-spacing:.12em}' }); await page.waitForTimeout(100);
  const ue = await page.evaluate(() => [...document.querySelectorAll('td.datum-zelle')].map((e) => { const r = e.getBoundingClientRect(), n = e.nextElementSibling.getBoundingClientRect(); return e.scrollWidth <= e.clientWidth + 0.5 && r.right <= n.left + 0.5; }));
  ok('weite Schrift: Datumszelle läuft nicht in die Größe', ue.length > 0 && ue.every(Boolean), JSON.stringify(ue));
  await ctx.close(); }

console.log('— B. Tipp auf den Namen zeigt das Dokument —');
for (const art of arten) {
  const { ctx, page, fehler } = await oeffnen(art, 1000);
  const echt = await page.evaluate(() => { const z = [...document.querySelectorAll('[data-vorschau-oeffnen]')].find((x) => x.textContent.includes('Echt.pdf')); return z && z.getAttribute('data-vorschau-oeffnen'); });
  await page.click(`[data-vorschau-oeffnen="${echt}"] .beleg-name`);
  await page.waitForFunction(() => window.__blpVorschau, null, { timeout: 15000 }).catch(() => {});
  const v = await page.evaluate(() => ({ seiten: document.querySelectorAll('[data-beleg-vorschau] canvas.vorschau-seite').length, mehr: document.querySelector('[data-vorschau-mehr]')?.textContent || '',
    geben: !!document.querySelector('[data-beleg-vorschau] [data-geben-menue]'), loeschen: !!document.querySelector('[data-vorschau-loeschen]'), zu: !!document.querySelector('[data-vorschau-zu]'),
    titel: document.querySelector('[data-beleg-vorschau] h2')?.textContent || '', weiss: (() => { const c = document.querySelector('canvas.vorschau-seite'); if (!c) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dunkel = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dunkel++; return dunkel > 20; })() }));
  ok(`${art}: PDF-Vorschau zeigt 3 von 4 Seiten gezeichnet, „Weitere Seiten (1)“`, v.seiten === 3 && /\(1\)/.test(v.mehr) && v.weiss, JSON.stringify(v));
  ok(`${art}: Vorschau hat Name, Weitergeben, Löschen, Schließen`, v.titel === 'Echt.pdf' && v.geben && v.loeschen && v.zu, JSON.stringify(v));
  await page.click('[data-vorschau-mehr]'); await page.waitForTimeout(400);
  ok(`${art}: „Weitere Seiten“ zeichnet die vierte`, await page.evaluate(() => document.querySelectorAll('canvas.vorschau-seite').length === 4 && !document.querySelector('[data-vorschau-mehr]')));
  await page.click('[data-vorschau-zu]');
  ok(`${art}: Schließen nimmt die Vorschau weg`, await page.evaluate(() => !document.querySelector('[data-beleg-vorschau]')));
  // Kaputtes PDF: ehrlicher Satz statt leerer Fläche, Knöpfe bleiben
  await page.evaluate(() => { window.__blpVorschau = null; [...document.querySelectorAll('[data-vorschau-oeffnen]')].find((x) => x.textContent.includes('Rechnung-2')).querySelector('.beleg-name').click(); });
  await page.waitForFunction(() => window.__blpVorschau !== null || document.querySelector('[data-vorschau-fehler]'), null, { timeout: 10000 }).catch(() => {});
  ok(`${art}: unlesbares PDF → Satz, Knöpfe bleiben`, await page.evaluate(() => !!document.querySelector('[data-vorschau-fehler]') && !!document.querySelector('[data-vorschau-loeschen]')));
  // Löschen aus der Vorschau
  const vorher = await page.evaluate(() => document.querySelectorAll('[data-beleg-zeile]').length);
  await page.click('[data-vorschau-loeschen]'); await page.waitForTimeout(700);
  const nachher = await page.evaluate(() => ({ n: document.querySelectorAll('[data-beleg-zeile]').length, offen: !!document.querySelector('[data-beleg-vorschau]') }));
  ok(`${art}: Löschen in der Vorschau löscht den Beleg und schließt`, nachher.n === vorher - 1 && !nachher.offen, JSON.stringify({ vorher, ...nachher }));
  // ⋯-Menü nennt den Weitergeben-Weg mit Worten
  ok(`${art}: ⋯-Menü hat „${art === 'app' ? 'An Pro-App geben …' : 'Teilen …'}“ mit Text`, await page.evaluate((app) => { const k = document.querySelector('[data-zeilen-menue] [data-geben-menue]'); return !!k && k.textContent.includes(app ? 'An Pro-App geben' : 'Teilen'); }, art === 'app'));
  ok(`${art}: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— C. Bilder in die Schnellerfassung einfügen oder hineinziehen —');
{ const { ctx, page, fehler } = await oeffnen('pwa', 1000);
  const zahl = () => page.evaluate(() => document.querySelectorAll('[data-beleg-zeile]').length);
  await page.click('[data-werkzeug="text"]');   // Pro-Umbau 8: das Feld geht erst auf Knopfdruck auf
  const vorher = await zahl();
  const erg = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 60; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 60, 40);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const ta = document.querySelector('textarea.beleg-text');
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); ta.dispatchEvent(ev);
    return { verhindert: ev.defaultPrevented, namen: window.__blpSchnellDatei || [] };
  });
  await page.waitForFunction((v) => document.querySelectorAll('[data-beleg-zeile]').length > v, vorher, { timeout: 8000 }).catch(() => {});
  ok('Einfügen eines Bildes legt einen Beleg mit Datum im Namen an', erg.verhindert && /^Eingefügt \d{4}-\d\d-\d\d \d\d-\d\d\.png$/.test(erg.namen[0] || '') && (await zahl()) === vorher + 1, JSON.stringify(erg));
  const text = await page.evaluate(() => { const ta = document.querySelector('textarea.beleg-text'); const dt = new DataTransfer(); dt.setData('text/plain', 'Rechnung 12,00 EUR');
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return ev.defaultPrevented; });
  ok('Text einfügen bleibt Text (kein Beleg)', text === false);
  const v2 = await zahl();
  await page.evaluate(() => { const ta = document.querySelector('textarea.beleg-text'); const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], 'Foto vom Beleg.jpg', { type: 'image/jpeg' }));
    ta.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true })); ta.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
  await page.waitForFunction((v) => document.querySelectorAll('[data-beleg-zeile]').length > v, v2, { timeout: 8000 }).catch(() => {});
  ok('Hineinziehen eines Fotos legt einen Beleg an (Name bleibt)', (await zahl()) === v2 + 1 && (await page.evaluate(() => (window.__blpSchnellDatei || [])[0])) === 'Foto vom Beleg.jpg');
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close(); }

console.log('— D. Sicherung in der Leiste statt Balken —');
for (const art of arten) {
  const { ctx, page, fehler } = await oeffnen(art, 1280);
  const lesen = () => page.evaluate(() => { const k = document.getElementById('nav-sicherung'); const kopf = document.getElementById('kopf-sicherung');
    return { da: !!k, farbe: k && k.dataset.sicherung, text: k && k.textContent.trim(), balken: document.querySelectorAll('#durability-slot *').length, kopfSichtbar: !!kopf && !kopf.hidden && getComputedStyle(kopf).display !== 'none', oben: !!k && k.closest('.app-nav').firstElementChild.contains(k) }; });
  await page.waitForFunction(() => document.getElementById('nav-sicherung')?.dataset.sicherung, null, { timeout: 8000 }).catch(() => {});
  let m = await lesen();
  ok(`${art}: Eintrag oben in der Leiste, rot „Jetzt sichern“, kein Balken`, m.da && m.oben && m.farbe === 'rot' && /Jetzt sichern/.test(m.text) && m.balken === 0, JSON.stringify(m));
  ok(`${art}: am breiten Bildschirm kein zusätzlicher Knopf oben`, !m.kopfSichtbar, JSON.stringify(m));
  await page.evaluate(async () => { const d = await import('./src/core/durability.js'); await d.markBackupDone(); window.dispatchEvent(new Event('blp-gesichert')); });
  await page.waitForFunction(() => document.getElementById('nav-sicherung')?.dataset.sicherung === 'gruen', null, { timeout: 5000 }).catch(() => {});
  m = await lesen();
  ok(`${art}: nach dem Sichern grün „Gesichert · HH:MM“`, m.farbe === 'gruen' && /^Gesichert · \d\d:\d\d$/.test(m.text), JSON.stringify(m));
  await page.evaluate(async () => { const db = await import('./src/core/db.js'); await db.recPut({ id: 'probe-aenderung', type: 'probe' }); window.dispatchEvent(new Event('blp-gesichert')); });
  await page.waitForTimeout(400);
  m = await lesen();
  ok(`${art}: Änderung kurz nach dem Sichern bleibt grün`, m.farbe === 'gruen', JSON.stringify(m));
  await page.evaluate(async () => { const db = await import('./src/core/db.js'); await db.kvSet('lastBackupAt', Date.now() - 11 * 60e3); await db.recPut({ id: 'probe-aenderung-2', type: 'probe' }); window.dispatchEvent(new Event('blp-gesichert')); });
  await page.waitForFunction(() => document.getElementById('nav-sicherung')?.dataset.sicherung === 'rot', null, { timeout: 5000 }).catch(() => {});
  m = await lesen();
  ok(`${art}: Änderung und 10 Minuten vorbei → wieder rot`, m.farbe === 'rot' && /Jetzt sichern/.test(m.text), JSON.stringify(m));
  await page.setViewportSize({ width: 400, height: 800 }); await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForTimeout(500);
  m = await lesen();
  ok(`${art}: am Handy (Leiste als Schublade) roter Knopf oben`, m.kopfSichtbar, JSON.stringify(m));
  ok(`${art}: keine Seitenfehler (D)`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

await schluss();
