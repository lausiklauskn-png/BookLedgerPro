// tests/smoke_befunde8.mjs — Klaus' Gegenprobe am Tablet (2026-10-29 abends, Pro-Umbau 8, APK 0.1.3): „ich füge oben ein Objekt ein … und ich
// sehe unten erst das Ergebnis“. Belege: alle Knöpfe oben in einer Leiste, Ablagefläche (hineinziehen, einfügen), Meldung und Belege gleich
// darunter, der neue Beleg markiert und im Bild; Text erfassen / E-Rechnung / Bankauszug erst auf Knopfdruck, Archiv-Kasten unter der Liste.
// Gerüst wie smoke_befunde7. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
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
  const U = { pruefen: async () => ({ version: '0.1.3' }), installieren: async () => ({}), addListener: () => ({ remove() {} }) };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H, BlpUpdates: U } };
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


const bild = (page, name) => page.evaluate(async (name) => {
  const c = document.createElement('canvas'); c.width = 60; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#3a6'; x.fillRect(0, 0, 60, 40);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png')); window.__bild = new File([blob], name, { type: 'image/png' }); return true;
}, name);
const zahl = (page) => page.evaluate(() => document.querySelectorAll('[data-beleg-zeile]').length);

console.log('— A. Aufbau: Knöpfe oben, Belege gleich darunter, Archiv unten —');
for (const art of arten) for (const [b, h] of [[1000, 900], [640, 900], [400, 800]]) {
  const { ctx, page, fehler } = await oeffnen(art, b, h);
  const lage = await page.evaluate(() => {
    const w = document.querySelector('[data-beleg-werkzeuge]'), zeile = document.querySelector('[data-beleg-zeile]'), archiv = document.querySelector('[data-beleg-archiv]');
    const titel = [...document.querySelectorAll('#content .card-title')].map((x) => x.textContent);
    return {
      reihenfolge: !!w && !!zeile && !!archiv && !!(w.compareDocumentPosition(zeile) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(zeile.compareDocumentPosition(archiv) & Node.DOCUMENT_POSITION_FOLLOWING),
      knoepfe: ['text', 'erechnung', 'bank'].every((k) => w && w.querySelector('[data-werkzeug="' + k + '"]')) && !!w.querySelector('[data-scan-start]') && !!w.querySelector('[data-import-viele]'),
      farbig: w ? w.querySelectorAll('.btn-primary').length : -1,
      zu: !titel.some((x) => /E-Rechnung empfangen|Bankauszug importieren|Schnell/.test(x)) && !document.querySelector('#content textarea.beleg-text'),
      ablage: !!document.querySelector('[data-beleg-ablage]'),
      // Tablet/PC: die erste Belegzeile; Handy (schmal): wenigstens der Anfang der Liste (die Suche steht dazwischen).
      zeileOben: innerWidth < 560 ? Math.round(document.querySelector('.beleg-liste-karte').getBoundingClientRect().top) : zeile ? Math.round(zeile.getBoundingClientRect().top) : 99999, hoehe: innerHeight,
    };
  });
  ok(`${art} ${b}×${h}: Reihenfolge Knöpfe → Belege → Archiv-Kasten`, lage.reihenfolge);
  ok(`${art} ${b}×${h}: alle Knöpfe in einer Leiste (Scannen, Hochladen, Text erfassen, E-Rechnung, Bankauszug), genau ein farbiger`, lage.knoepfe && lage.farbig === 1, JSON.stringify(lage));
  ok(`${art} ${b}×${h}: Text erfassen, E-Rechnung und Bankauszug sind zu (kein doppelter Titel, kein Feld)`, lage.zu);
  ok(`${art} ${b}×${h}: Ablagefläche da`, lage.ablage);
  ok(`${art} ${b}×${h}: ${b < 560 ? 'die Liste beginnt' : 'der erste Beleg steht'} ohne Rollen im Bild`, lage.zeileOben < lage.hoehe, lage.zeileOben + ' ≥ ' + lage.hoehe);
  const quer = await page.evaluate(() => [...document.querySelectorAll('[data-beleg-werkzeuge] *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.tagName + '.' + e.className).slice(0, 3));
  ok(`${art} ${b}×${h}: nichts in der Leiste ragt über den Rand`, quer.length === 0, quer.join(' | '));
  ok(`${art} ${b}×${h}: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— B. Ablagefläche: einfügen, hineinziehen, Strg+V auf der Seite; der neue Beleg ist markiert und im Bild —');
{ const { ctx, page, fehler } = await oeffnen('app', 1000, 700);
  // Viele Belege, damit die Liste länger als das Fenster ist.
  await page.evaluate(async () => { for (let i = 0; i < 25; i++) await window.__saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 viel ' + i)], 'Alt-' + i + '.pdf', { type: 'application/pdf' })); window.__probe.navigate('dashboard'); });
  await page.waitForTimeout(300); await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-beleg-ablage]');
  await bild(page, 'image.png');
  const vorher = await zahl(page);
  const ev = await page.evaluate(() => { const f = document.querySelector('[data-beleg-ablage]'); const dt = new DataTransfer(); dt.items.add(window.__bild);
    const e = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); f.dispatchEvent(e); return e.defaultPrevented; });
  await page.waitForFunction((v) => document.querySelectorAll('[data-beleg-zeile]').length > v, vorher, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
  const neu = await page.evaluate(() => { const z = document.querySelector('.beleg-zeile.beleg-neu'); const st = document.querySelector('[data-import-status]');
    if (!z) return null; const r = z.getBoundingClientRect(), s = st.getBoundingClientRect();
    return { name: z.querySelector('.beleg-name').textContent, imBild: r.top >= 0 && r.bottom <= innerHeight, status: st.textContent, statusImBild: s.top >= 0 && s.bottom <= innerHeight || r.top >= 0 }; });
  ok('Einfügen auf der Ablagefläche: ein Beleg mehr, Name mit Datum', ev && (await zahl(page)) === vorher + 1 && !!neu && /^Eingefügt \d{4}-\d\d-\d\d \d\d-\d\d/.test(neu.name), JSON.stringify(neu));
  ok('der neue Beleg ist markiert und steht im Bild (auch bei 25 älteren)', !!neu && neu.imBild, JSON.stringify(neu));
  ok('die Meldung sagt, was angekommen ist', !!neu && /1/.test(neu.status), neu && neu.status);
  const v2 = await zahl(page);
  await page.evaluate(() => { const f = document.querySelector('[data-beleg-ablage]'); const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array([37, 80, 68, 70])], 'Quittung Tankstelle.pdf', { type: 'application/pdf' }));
    f.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true })); f.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
  await page.waitForFunction((v) => document.querySelectorAll('[data-beleg-zeile]').length > v, v2, { timeout: 10000 }).catch(() => {});
  ok('Hineinziehen auf die Ablagefläche: Beleg angelegt, Name bleibt, markiert', (await zahl(page)) === v2 + 1 && await page.evaluate(() => { const z = document.querySelector('.beleg-zeile.beleg-neu .beleg-name'); return !!z && /Quittung Tankstelle/.test(z.textContent); }));
  const v3 = await zahl(page);
  await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File([window.__bild], 'Foto.png', { type: 'image/png' })); document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await page.waitForFunction((v) => document.querySelectorAll('[data-beleg-zeile]').length > v, v3, { timeout: 10000 }).catch(() => {});
  ok('Strg+V irgendwo auf der Seite (nicht in einem Feld): Beleg angelegt', (await zahl(page)) === v3 + 1);
  const v4 = await zahl(page);
  await page.evaluate(() => { const f = document.querySelector('[data-beleg-ablage]'); const dt = new DataTransfer(); dt.setData('text/plain', 'nur Text'); f.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await page.waitForTimeout(400);
  ok('nur Text auf der Ablagefläche: kein Beleg, die Meldung verweist auf „Text erfassen“', (await zahl(page)) === v4 && await page.evaluate(() => /Text erfassen/.test(document.querySelector('[data-import-status]').textContent)) &&
    await page.evaluate(() => !/nur Text/.test(document.querySelector('[data-beleg-ablage]').textContent)));
  await page.click('[data-ablage-einfuegen]'); await page.waitForTimeout(400);
  ok('„Einfügen“ ohne Erlaubnis für die Zwischenablage sagt den anderen Weg (lange drücken, hineinziehen)', await page.evaluate(() => /lange|hineinziehen|kein Bild/i.test(document.querySelector('[data-import-status]').textContent)));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close(); }

console.log('— C. Text erfassen, E-Rechnung, Bankauszug: erst auf Knopfdruck —');
{ const { ctx, page, fehler } = await oeffnen('pwa', 1000, 900);
  await page.click('[data-werkzeug="text"]');
  ok('„Text erfassen“ öffnet das Feld unter der Leiste (mit Analysieren)', await page.evaluate(() => { const f = document.querySelector('[data-werkzeug-fenster="text"]'); return !!f && !!f.querySelector('textarea.beleg-text') && document.activeElement === f.querySelector('textarea') && document.querySelector('[data-werkzeug="text"]').getAttribute('aria-expanded') === 'true'; }));
  await page.fill('.beleg-text', 'Bürobedarf 12,00 EUR');
  await page.evaluate(() => window.__probe.navigate('dashboard')); await page.waitForTimeout(200); await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-beleg-werkzeuge]');
  ok('der Text und das offene Feld bleiben beim Zurückkommen', await page.evaluate(() => (document.querySelector('textarea.beleg-text') || {}).value === 'Bürobedarf 12,00 EUR'));
  await page.click('[data-werkzeug-zu]');
  ok('„Schließen“ macht es wieder zu', await page.evaluate(() => !document.querySelector('[data-werkzeug-fenster]')));
  const wahl = page.waitForEvent('filechooser', { timeout: 5000 }).then(() => true, () => false);
  await page.click('[data-werkzeug="erechnung"]');
  ok('„E-Rechnung einlesen“: ein Tipp öffnet den Bereich und gleich die Dateiwahl', await wahl && await page.evaluate(() => !!document.querySelector('[data-werkzeug-fenster="erechnung"]')));
  const wahl2 = page.waitForEvent('filechooser', { timeout: 5000 }).then(() => true, () => false);
  await page.click('[data-werkzeug="bank"]');
  ok('„Bankauszug einlesen“: ebenso; es ist immer nur ein Bereich offen', await wahl2 && await page.evaluate(() => document.querySelectorAll('[data-werkzeug-fenster]').length === 1 && !!document.querySelector('[data-werkzeug-fenster="bank"]')));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close(); }

console.log('— D. Schriftgröße: Knopf „A··A“ im Kopf, Schieberegler, gemerkt —');
for (const art of arten) for (const [b, h] of [[1000, 900], [400, 800]]) {
  const { ctx, page, fehler } = await oeffnen(art, b, h);
  const knopf = await page.evaluate(() => { const k = document.querySelector('.app-header [data-schrift-knopf]'); if (!k) return null; const r = k.getBoundingClientRect(); return { text: k.textContent, imBild: r.right <= innerWidth && r.left >= 0 && r.width > 0 }; });
  ok(`${art} ${b}: Knopf „A··A“ im Kopf, sichtbar`, !!knopf && knopf.text === 'A··A' && knopf.imBild, JSON.stringify(knopf));
  const h1vor = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#content h1')).fontSize));
  await page.click('[data-schrift-knopf]');
  ok(`${art} ${b}: ein Tipp öffnet den Schieberegler (85–150 %)`, await page.evaluate(() => { const r = document.querySelector('[data-schrift-regler]'); return !!r && r.min === '85' && r.max === '150'; }));
  await page.evaluate(() => { const r = document.querySelector('[data-schrift-regler]'); r.value = '130'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.waitForTimeout(150);
  const nach = await page.evaluate(() => ({ h1: parseFloat(getComputedStyle(document.querySelector('#content h1')).fontSize), wert: document.querySelector('[data-schrift-wert]').textContent, gemerkt: localStorage.getItem('blpr_schrift'), html: document.documentElement.style.fontSize }));
  ok(`${art} ${b}: 130 % — die Schrift wächst sofort mit (Überschrift ×1,3), gemerkt`, Math.abs(nach.h1 / h1vor - 1.3) < 0.02 && nach.wert === '130 %' && nach.gemerkt === '130' && nach.html === '130%', JSON.stringify({ h1vor, ...nach }));
  const quer = await page.evaluate(() => [...document.querySelectorAll('.app-header *, [data-beleg-werkzeuge] *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.tagName + '.' + e.className).slice(0, 3));
  ok(`${art} ${b}: auch bei 130 % ragt nichts aus Kopf und Knopfleiste`, quer.length === 0, quer.join(' | '));
  await page.evaluate(() => window.__probe.navigate('settings')); await page.waitForTimeout(200); await page.evaluate(() => window.__probe.navigate('documents'));
  ok(`${art} ${b}: beim Wechsel der Ansicht bleibt 130 %`, await page.evaluate(() => document.documentElement.style.fontSize === '130%'));
  await page.waitForSelector('[data-schrift-knopf]'); if (!(await page.$('[data-schrift-normal]'))) await page.click('[data-schrift-knopf]'); await page.click('[data-schrift-normal]');
  ok(`${art} ${b}: „Zurück auf 100 %“`, await page.evaluate(() => document.documentElement.style.fontSize === '' && localStorage.getItem('blpr_schrift') === '100'));
  await page.keyboard.press('Escape');
  ok(`${art} ${b}: Esc schließt den Regler`, await page.evaluate(() => !document.querySelector('.schrift-popover')));
  ok(`${art} ${b}: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
{ const ctx = await browser.newContext({ viewport: { width: 400, height: 800 } }); const page = await ctx.newPage();
  await page.goto(BASIS + '/index.html'); await page.evaluate(() => localStorage.setItem('blpr_schrift', '140')); await page.reload();
  ok('Startseite (vor der Anmeldung): die gemerkte Größe gilt schon beim ersten Anstrich', await page.evaluate(() => document.documentElement.style.fontSize === '140%'));
  await page.evaluate(() => localStorage.setItem('blpr_schrift', '999')); await page.reload();
  ok('… Unsinn im Speicher wird nicht angewandt', await page.evaluate(() => document.documentElement.style.fontSize === ''));
  const T = await page.evaluate(async () => { const m = await import('./src/ui/theme.js'); return [m.schriftNormal(112), m.schriftNormal(40), m.schriftNormal(400), m.schriftNormal('x'), m.schriftNormal(100)]; });
  ok('schriftNormal: 5er-Schritte, 85–150, Unsinn → 100', JSON.stringify(T) === '[110,85,150,100,100]', JSON.stringify(T));
  await ctx.close(); }

console.log('— E. „Über“: Update-Knopf hinter der Versionsnummer —');
{ const { ctx, page, fehler } = await oeffnen('app', 1000, 900);
  // Gestellte Update-Brücke (die Hülle liefert sie nur mit dem eigenen Server): Version und „Auf Updates prüfen“.
  const da = await page.evaluate(() => !!(window.BLPNative && window.BLPNative.updates && window.BLPNative.version));
  if (da) {
    const m = await page.evaluate(async () => { const { aboutContent } = await import('./src/ui/intro.js'); const d = aboutContent(); document.body.append(d); await new Promise((r) => setTimeout(r, 300));
      const v = d.querySelector('[data-app-version]'), k = d.querySelector('[data-update-pruefen]'); if (!v || !k) return null; const a = v.getBoundingClientRect(), b = k.getBoundingClientRect();
      return { gleicheZeile: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 8, dahinter: b.left >= a.right - 1, v: v.textContent }; });
    ok('Version und „Auf Updates prüfen“ stehen in einer Zeile, der Knopf hinter der Nummer', !!m && m.gleicheZeile && m.dahinter, JSON.stringify(m));
  } else ok('gestellte Update-Brücke (BlpUpdates) kommt in BLPNative an', false);
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close(); }

console.log('— F. Titel klein im Kopf, ⋯-Menü ganz sichtbar, X in der Vorschau, „neu“ mit Uhrzeit —');
for (const art of arten) for (const [b, h] of [[1000, 700], [400, 800]]) {
  const { ctx, page, fehler } = await oeffnen(art, b, h);
  const kopf = await page.evaluate(() => { const k = document.querySelector('[data-kopf-titel]'), h1 = document.querySelector('#content h1'), r = k.getBoundingClientRect();
    return { text: k.textContent, sichtbar: !k.hidden && r.width > 0 && r.right <= innerWidth + 1, h1weg: !!h1 && h1.classList.contains('titel-im-kopf') && h1.getBoundingClientRect().height <= 1 && h1.textContent === 'Belege' }; });
  ok(`${art} ${b}: „Belege“ steht klein im Kopf, die große Überschrift nimmt keinen Platz (für Vorleser bleibt sie)`, kopf.text === 'Belege' && kopf.sichtbar && kopf.h1weg, JSON.stringify(kopf));
  await page.evaluate(() => window.__probe.navigate('journal')); await page.waitForTimeout(400);
  const k2 = await page.evaluate(() => ({ kopf: document.querySelector('[data-kopf-titel]').textContent, h1: (document.querySelector('#content h1') || {}).textContent || '' }));
  ok(`${art} ${b}: auf einer anderen Seite steht deren Titel im Kopf`, !!k2.kopf && k2.kopf === k2.h1.trim() && k2.kopf !== 'Belege', JSON.stringify(k2));
  await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-zeilen-menue]');
  await page.evaluate(async () => { for (let i = 0; i < 18; i++) await window.__saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 m ' + i)], 'Menü-' + i + '.pdf', { type: 'application/pdf' })); window.__probe.navigate('dashboard'); });
  await page.waitForTimeout(300); await page.evaluate(() => window.__probe.navigate('documents')); await page.waitForSelector('[data-zeilen-menue]');
  // die letzte Zeile ganz unten ins Bild, dann ihr ⋯ öffnen
  await page.evaluate(() => { const m = [...document.querySelectorAll('[data-zeilen-menue]')].pop(); m.scrollIntoView({ block: 'end' }); });
  await page.evaluate(() => { [...document.querySelectorAll('[data-zeilen-menue] > summary')].pop().click(); });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => { const l = document.querySelector('details.zeilen-menue[open] .zeilen-menue-liste'); if (!l) return null; const r = l.getBoundingClientRect();
    return { imBild: r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1, ohneRollen: l.scrollHeight <= l.clientHeight + 1, knoepfe: l.querySelectorAll('button').length }; });
  ok(`${art} ${b}: ⋯ an der untersten Zeile: das Menü steht ganz im Bild, ohne Rollen (alle Knöpfe zu sehen)`, !!m && m.imBild && m.ohneRollen && m.knoepfe >= 2, JSON.stringify(m));
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelector('[data-vorschau-oeffnen]').click());
  await page.waitForSelector('[data-beleg-vorschau]', { timeout: 8000 }).catch(() => {});
  const x = await page.evaluate(() => { const k = document.querySelector('[data-vorschau-x]'), box = document.querySelector('[data-beleg-vorschau]'); if (!k || !box) return null;
    const r = k.getBoundingClientRect(), bx = box.getBoundingClientRect(); return { oben: r.top - bx.top < 60 && r.top >= 0, rechts: bx.right - r.right < 60 && r.right <= innerWidth }; });
  ok(`${art} ${b}: Vorschau hat oben rechts ein X`, !!x && x.oben && x.rechts, JSON.stringify(x));
  await page.click('[data-vorschau-x]');
  ok(`${art} ${b}: das X schließt die Vorschau`, await page.evaluate(() => !document.querySelector('[data-beleg-vorschau]')));
  await bild(page, 'image.png');
  await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(window.__bild); document.querySelector('[data-beleg-ablage]').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await page.waitForSelector('.beleg-zeile.beleg-neu [data-neu]', { timeout: 10000 }).catch(() => {});
  const neu = await page.evaluate(() => { const z = document.querySelector('.beleg-zeile.beleg-neu'); return z ? { marke: (z.querySelector('[data-neu]') || {}).textContent, datum: z.querySelector('.datum-zelle').textContent, alle: document.querySelectorAll('[data-neu]').length } : null; });
  ok(`${art} ${b}: der frische Beleg trägt „neu“ und die Uhrzeit („heute 17:07“), nur er`, !!neu && neu.marke === 'neu' && /^heute \d\d:\d\d$/.test(neu.datum) && neu.alle === 1, JSON.stringify(neu));
  const ueber = await page.evaluate(() => [...document.querySelectorAll('td.datum-zelle')].filter((e) => e.scrollWidth > e.clientWidth + 0.5).length);
  ok(`${art} ${b}: „heute 17:07“ passt in die Datumsspalte`, ueber === 0, String(ueber));
  ok(`${art} ${b}: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

await schluss();
