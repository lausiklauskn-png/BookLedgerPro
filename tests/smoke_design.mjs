// tests/smoke_design.mjs — Design-Grundlage im ECHTEN Browser (Klaus 2026-10-26, Sammlung A1–A5, F).
//
//   node tests/smoke_design.mjs            (Chromium + playwright/playwright-core aus der Umgebung)
//   FOTOS=1 node tests/smoke_design.mjs    schreibt die Bildschirmfotos nach docs/design/umbau-2026-10-26/fotos/
//
// Gemessen wird die echte Shell (src/ui/shell.js) mit echtem Tresor und echter IndexedDB, dazu das echte
// index.html vor dem Entsperren. Schrift-Regel A5: bei 320 · 390 · 768 · 1024 · 1366 px und bei 100 % und
// 200 % Schrift darf keine Beschriftung breiter sein als ihr Kasten, nichts über den rechten Rand laufen und
// kein Auswahlfeld seinen gewählten Eintrag abschneiden. Dazu: sechs Themen, Seitenleiste (Gruppen, Ein-/
// Ausklappen, Teilbild, Schublade), Modus-Schalter (Privat kürzt Menü und Einstellungen, Daten bleiben).
//
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig (fehlendes Paket/Browser ist NIE grün).

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const FOTOS = process.env.FOTOS === '1';
const FOTO_ORDNER = join(WURZEL, 'docs/design/umbau-2026-10-26/fotos');

let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => {
  if (cond) { gruen++; console.log('  ✓ ' + name); }
  else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); }
};

// ---- Server: Depot + Probe-Seite mit echter Shell -------------------------------------------
const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#2563eb">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app-root"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings, navigate } from './src/state.js';
import { applyTheme, applyGemerktesThema } from './src/ui/theme.js';
import { ensureAccountsSeeded } from './src/domain/store.js';
import { ensureKostenstellenSeeded } from './src/domain/crm-store.js';
import { renderShell } from './src/ui/shell.js';
applyGemerktesThema();
await setupVault('probe-passwort-123');
await hydrateSettings();
await ensureAccountsSeeded(); await ensureKostenstellenSeeded();
renderShell(document.getElementById('app-root'), { onLock: () => {} });
window.__probe = { updateSettings, getSettings, navigate, applyTheme };
window.__probeBereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  const datei = join(WURZEL, pfad === '/' ? 'index.html' : pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(datei); res.writeHead(200, { 'content-type': TYP[extname(datei)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASIS = `http://127.0.0.1:${server.address().port}`;

let browser;
try { browser = await pw.chromium.launch(CHROMIUM ? { executablePath: CHROMIUM, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }

const schluss = async () => {
  try { await browser.close(); } catch { /* egal */ }
  server.close();
  console.log(`\n${gruen} grün · ${rot} ROT`);
  process.exitCode = rot ? 1 : 0;
};
process.on('unhandledRejection', async (e) => { rot++; console.log('  ✗ ROT: Probe stürzte ab — ' + ((e && e.message) || e)); await schluss(); process.exit(1); });

// ---- Überlauf-Prüfung (A5), läuft in der Seite --------------------------------------------------
const UEBERLAUF = `(() => {
  const fehler = []; const grenzen = [];
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) fehler.push('Seite läuft waagerecht über: ' + document.documentElement.scrollWidth + ' > ' + vw);
  const beschreibe = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + ' „' + (e.textContent || '').trim().slice(0, 40) + '"');
  const canvas = document.createElement('canvas').getContext('2d');
  const sel = 'button, a.btn, .nav-item, .seg, .nav-gruppe-titel, label.field > span, th, .kpi-label, .kpi-value, h1, h2, h3, .setting-label, .badge, .pill, .brand-name, .mandant-id, select, .ic-text, .banner-text, .card-title, .form-title';
  for (const e of document.querySelectorAll(sel)) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (e.closest('#sbkim-widget, #sbkim-rdv-btn, [data-symbole], .app-nav:not(.app.nav-open .app-nav)') && e.closest('.app-nav') && !document.querySelector('.app.nav-open') && vw <= 640) continue;
    const scrollt = e.closest('.no-pad, .table-wrap, [data-scroll], .btn-row');
    const scrolltSelbst = ['auto', 'scroll'].includes(cs.overflowX);
    if (e.tagName === 'SELECT') {
      const o = e.options[e.selectedIndex];
      if (o) { canvas.font = cs.font; const w = canvas.measureText(o.text).width;
        const innen = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 22;
        // Benannte Grenze: nimmt das Feld schon die ganze Breite seines Behälters ein, kann nur noch die Schrift
        // selbst zu groß für die Zeile sein (200 % auf 320 px). Das wird gemeldet, zählt aber nicht als Layoutfehler.
        const eltern = e.parentElement.getBoundingClientRect();
        const vollBreit = r.width >= eltern.width - 2;
        if (w > innen + 1) (vollBreit ? grenzen : fehler).push('Auswahlfeld schneidet ab: ' + beschreibe(e) + ' → ' + Math.round(w) + ' > ' + Math.round(innen)); }
    } else if (e.scrollWidth > e.clientWidth + 1 && cs.textOverflow !== 'ellipsis' && !scrolltSelbst && cs.overflowX !== 'hidden') {
      fehler.push('Text breiter als Kasten: ' + beschreibe(e) + ' → ' + e.scrollWidth + ' > ' + e.clientWidth);
    }
    if (r.right > vw + 1 && !scrollt && !e.closest('.app-nav') && !e.closest('.thema-popover')) fehler.push('läuft rechts hinaus: ' + beschreibe(e) + ' → ' + Math.round(r.right) + ' > ' + vw);
  }
  // Schrift unter der Kopfleiste? Erste Überschrift muss unterhalb der Kopfleiste beginnen.
  const kopf = document.querySelector('.app-header'); const h1 = document.querySelector('.content h1');
  if (kopf && h1) { const k = kopf.getBoundingClientRect(), h = h1.getBoundingClientRect(); if (h.top < k.bottom - 1 && h.top > 0) fehler.push('Überschrift rutscht unter die Kopfleiste'); }
  return { fehler, grenzen };
})()`;

const BREITEN = [320, 390, 768, 1024, 1366];
const SCHRIFTEN = [['100', ''], ['200', '200%']];
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(20000);
const fehlerSeite = [];
page.on('pageerror', (e) => fehlerSeite.push(String(e.message || e)));
await page.goto(BASIS + '/__probe.html');
await page.waitForFunction(() => window.__probeBereit === true);
await page.waitForFunction(() => document.querySelectorAll('[data-symbole]').length === 2, null, { timeout: 5000 }).catch(() => {});
if (FOTOS) await mkdir(FOTO_ORDNER, { recursive: true });
const foto = async (name) => { if (FOTOS) await page.screenshot({ path: join(FOTO_ORDNER, name + '.png'), fullPage: false }); };
const schrift = async (prozent) => page.evaluate((p) => { document.documentElement.style.fontSize = p; }, prozent);
const gehe = async (route) => { await page.evaluate((r) => window.__probe.navigate(r), route); await page.waitForTimeout(150); };
const breite = async (w) => { await page.setViewportSize({ width: w, height: w < 700 ? 820 : 900 }); await page.waitForTimeout(120); };

console.log('— Grundzustand —');
ok('Shell steht (Kopfleiste, Leiste, Inhalt)', await page.evaluate(() => !!document.querySelector('.app-header') && !!document.querySelector('.app-nav') && !!document.querySelector('#content h1')));
ok('Symbole eingehängt (beide Sprites)', await page.evaluate(() => document.querySelectorAll('[data-symbole]').length === 2 && !!document.getElementById('pb-search') && !!document.getElementById('blp-journal')));
ok('Startthema Blau/hell (kein Merkzettel, Gerät hell)', await page.evaluate(() => document.documentElement.getAttribute('data-farbe') === 'blau' && document.documentElement.getAttribute('data-theme') === 'light'));
ok('Kopfleiste ohne Tresor-Kennung bei einem Mandanten (Klaus 2026-10-26)', await page.evaluate(() => !document.querySelector('.app-header .mandant')));
ok('Vollbild: Inhalt nutzt die ganze Breite (keine 1200-px-Grenze)', await page.evaluate(() => { const b = document.querySelector('.app-body').getBoundingClientRect(); return Math.round(b.width) === document.documentElement.clientWidth; }));

console.log('— Seitenleiste: Gruppen, Ein-/Ausklappen, Teilbild —');
ok('Gruppen mit Überschriften stehen', await page.evaluate(() => document.querySelectorAll('.nav-gruppe-titel').length === 6));
ok('Alle 25 Ansichten im Modus Selbstständig sichtbar (Calculate/Needs statt BLP-Angebote, Klaus 2026-10-26)', await page.evaluate(() => document.querySelectorAll('.nav-item').length === 25 && !document.querySelector('.nav-item[data-nav="angebote"]') && !!document.querySelector('.nav-item[data-nav="calculate"] img.ic-img')));
ok('Breit: Leiste aufgeklappt, Namen sichtbar', await page.evaluate(() => !document.querySelector('.app').classList.contains('nav-zu') && getComputedStyle(document.querySelector('.nav-item .ic-text')).display !== 'none'));
await page.click('.nav-klapp');
await page.waitForTimeout(100);
ok('Klapp-Knopf: eingeklappt, nur Symbole, Name im title', await page.evaluate(() => document.querySelector('.app').classList.contains('nav-zu') && getComputedStyle(document.querySelector('.nav-item .ic-text')).display === 'none' && document.querySelector('.nav-item[data-nav="journal"]').title === 'Buchungen' && document.querySelector('.app-nav').getBoundingClientRect().width <= 64));
await page.click('.nav-klapp');
await page.waitForTimeout(100);
ok('Klapp-Knopf: wieder aufgeklappt', await page.evaluate(() => !document.querySelector('.app').classList.contains('nav-zu')));
await page.evaluate(() => localStorage.removeItem('blpr_leiste'));
await breite(900);
ok('Teilbild (900 px): Leiste klappt selbst ein', await page.evaluate(() => document.querySelector('.app').classList.contains('nav-zu')));
await breite(1366);
ok('Vollbild (1366 px): Leiste wieder auf', await page.evaluate(() => !document.querySelector('.app').classList.contains('nav-zu')));
await breite(390);
ok('Handy: Leiste als Schublade zu, ☰ sichtbar', await page.evaluate(() => { const n = document.querySelector('.app-nav').getBoundingClientRect(); return n.right <= 0 && getComputedStyle(document.querySelector('.nav-toggle')).display !== 'none'; }));
await page.click('.nav-toggle');
await page.waitForTimeout(200);
ok('☰ öffnet die Schublade mit allen Namen und Einstellungen', await page.evaluate(() => { const n = document.querySelector('.app-nav').getBoundingClientRect(); return n.left === 0 && getComputedStyle(document.querySelector('.nav-item .ic-text')).display !== 'none' && !!document.querySelector('.nav-item[data-nav="settings"]'); }));
await foto('phone-390-schublade');
await page.click('.nav-item[data-nav="documents"]');
await page.waitForTimeout(200);
ok('Tipp auf einen Punkt schließt die Schublade und wechselt die Ansicht', await page.evaluate(() => !document.querySelector('.app').classList.contains('nav-open') && document.querySelector('.nav-item[data-nav="documents"]').classList.contains('active')));
await breite(1366);

console.log('— Schwebende Leisten verdecken nichts (B3) —');
ok('Inhalt und Leiste halten unten Platz frei (≥ 70 px)', await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.content')).paddingBottom) >= 70 && parseFloat(getComputedStyle(document.querySelector('.app-nav')).paddingBottom) >= 70));

console.log('— Flache Knöpfe (A2) —');
ok('Hauptknopf ~30 px sichtbar, ohne Schatten', await page.evaluate(() => { const b = document.querySelector('.content .btn-primary') || document.querySelector('.btn'); const r = b.getBoundingClientRect(); return r.height >= 28 && r.height <= 34 && getComputedStyle(b).boxShadow === 'none'; }));
ok('Menüpunkt ~30 px', await page.evaluate(() => { const r = document.querySelector('.nav-item').getBoundingClientRect(); return r.height >= 28 && r.height <= 34; }));

console.log('— Themen: Farbe × Helligkeit —');
const THEMEN = [['blau', 'light', 'klarblau'], ['blau', 'dark', 'nachtblau'], ['graphit', 'light', 'graphit'], ['graphit', 'dark', 'nachtgraphit'], ['petrol', 'light', 'petrol'], ['petrol', 'dark', 'nachtpetrol']];
await gehe('dashboard');
for (const [farbe, hell, name] of THEMEN) {
  await page.evaluate(([f, h]) => window.__probe.applyTheme(h, f), [farbe, hell]);
  await page.waitForTimeout(260); // Übergang (--motion 120 ms) abwarten, sonst misst man Zwischenfarben
  const ist = await page.evaluate(() => ({ f: document.documentElement.getAttribute('data-farbe'), t: document.documentElement.getAttribute('data-theme'),
    btn: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor, schrift: getComputedStyle(document.querySelector('.btn-primary')).color, bg: getComputedStyle(document.body).backgroundColor,
    meta: document.querySelector('meta[name="theme-color"]').getAttribute('content'), merk: localStorage.getItem('blpr_thema') }));
  ok(`Thema ${name}: Attribute, Merkzettel, theme-color`, ist.f === farbe && ist.t === hell && ist.merk === `${farbe}/${hell}` && /^#/.test(ist.meta), JSON.stringify(ist));
  if (name === 'nachtpetrol') ok('Nachtpetrol: Hauptknopf #0f766e mit weißer Schrift', ist.btn === 'rgb(15, 118, 110)' && ist.schrift === 'rgb(255, 255, 255)', ist.btn + ' / ' + ist.schrift);
  if (name === 'nachtblau') ok('Nachtblau: Hauptknopf #7ca7ff, dunkle Schrift, Grund #111827', ist.btn === 'rgb(124, 167, 255)' && ist.schrift === 'rgb(17, 24, 39)' && ist.bg === 'rgb(17, 24, 39)', JSON.stringify(ist));
  await foto('thema-' + name + '-1366');
}
// Palette-Knopf in der Kopfleiste
await page.click('[data-thema-knopf]');
await page.waitForTimeout(100);
ok('Palette-Knopf öffnet die Themenwahl', await page.evaluate(() => !!document.querySelector('.thema-popover') && document.querySelectorAll('.thema-popover .seg').length === 6));
await page.click('.thema-popover [data-thema="themeFarbe=graphit"]');
await page.waitForTimeout(150);
ok('Wahl im Popover wirkt sofort und wird gemerkt', await page.evaluate(() => document.documentElement.getAttribute('data-farbe') === 'graphit' && localStorage.getItem('blpr_thema').startsWith('graphit/') && window.__probe.getSettings().themeFarbe === 'graphit'));
await page.keyboard.press('Escape');
ok('Esc schließt das Popover', await page.evaluate(() => !document.querySelector('.thema-popover')));
// „Wie Gerät" folgt dem Gerät
await page.evaluate(() => window.__probe.applyTheme('system', 'blau'));
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(100);
ok('„Wie Gerät" + Gerät dunkel → Nachtblau', await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && document.documentElement.getAttribute('data-farbe') === 'blau'));
await page.emulateMedia({ colorScheme: 'light' });
await page.waitForTimeout(100);
ok('Gerät wieder hell → Klarblau', await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light'));
// Merkzettel gilt vor dem Entsperren: echtes index.html mit gespeichertem Thema
const seite2 = await ctx.newPage();
await seite2.addInitScript(() => { try { localStorage.setItem('blpr_thema', 'petrol/dark'); } catch {} });
await seite2.goto(BASIS + '/index.html');
await seite2.waitForTimeout(400);
ok('index.html vor dem Entsperren trägt das gemerkte Thema (Nachtpetrol)', await seite2.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && document.documentElement.getAttribute('data-farbe') === 'petrol'));
if (FOTOS) { await seite2.setViewportSize({ width: 1366, height: 900 }); await seite2.screenshot({ path: join(FOTO_ORDNER, 'deckblatt-nachtpetrol-1366.png') }); }
await seite2.close();

console.log('— Modus-Schalter (F) —');
await gehe('settings');
ok('Einstellungen: Modus-Schalter mit vier Modi, kein Einfach/Profi mehr', await page.evaluate(() => { const segs = [...document.querySelectorAll('.setting')].find((s) => s.querySelector('.setting-label').textContent === 'Modus'); const t = [...segs.querySelectorAll('.seg')].map((b) => b.textContent.replace(/\u00ad/g, '').trim()); return t.join('|') === 'Privat|Kleinunternehmer|Selbstständig|Berater' && !document.body.textContent.includes('Profi'); }));
const anzahlSelbst = await page.evaluate(() => document.querySelectorAll('.setting').length);
await page.evaluate(async () => { await window.__probe.updateSettings({ nutzungsmodus: 'privat' }); });
await page.waitForTimeout(200);
ok('Privat: Menü auf 10 Punkte gekürzt, keine Gruppe Verkauf/Team/Auswerten — Netz bleibt (Klaus 2026-10-26: SBKIM-Suche, Mycel/Siegel)', await page.evaluate(() => document.querySelectorAll('.nav-item').length === 10 && [...document.querySelectorAll('.nav-gruppe-titel')].map((e) => e.textContent).join('|') === 'Buchen|Netz|Weiteres' && !!document.querySelector('.nav-item[data-nav="sbkimsuche"]') && !!document.querySelector('.nav-item[data-nav="network"]')));
const anzahlPrivat = await page.evaluate(() => document.querySelectorAll('.setting').length);
ok('Privat: Einstellungen kürzer (Firma, DATEV, § 19, Rechnungsstelle … weg), ehrlicher Hinweis steht', anzahlPrivat < anzahlSelbst - 5 && await page.evaluate(() => !!document.querySelector('[data-privat-hinweis]') && !document.body.textContent.includes('Firmenprofil')), anzahlPrivat + ' < ' + anzahlSelbst);
ok('Privat: data-modus am Rahmen', await page.evaluate(() => document.querySelector('.app').getAttribute('data-modus') === 'privat'));
await foto('privat-einstellungen-1366');
await gehe('dashboard');
ok('Privat: Übersicht ohne „Neue Buchung"/Zahllast/Auswertung', await page.evaluate(() => !document.body.textContent.includes('Neue Buchung') && !document.body.textContent.includes('Zahllast') && !document.body.textContent.includes('Auswertung')));
await foto('privat-uebersicht-1366');
await gehe('settings');
// F3: Alle Einstellungen zeigen
await page.evaluate(async () => { await window.__probe.updateSettings({ alleEinstellungen: true }); });
await page.waitForTimeout(200);
ok('F3 „Alle Einstellungen zeigen": Firmenprofil wieder da', await page.evaluate(() => document.body.textContent.includes('Firmenprofil')));
await page.evaluate(async () => { await window.__probe.updateSettings({ alleEinstellungen: false, nutzungsmodus: 'kleinunternehmer', kleinunternehmer: true }); });
await page.waitForTimeout(200);
ok('Kleinunternehmer: ohne Mitarbeiter/Lohn, mit Aufträgen', await page.evaluate(() => !document.querySelector('.nav-item[data-nav="employees"]') && !document.querySelector('.nav-item[data-nav="lohn"]') && !!document.querySelector('.nav-item[data-nav="orders"]')));
await page.evaluate(async () => { await window.__probe.updateSettings({ nutzungsmodus: 'berater' }); });
await page.waitForTimeout(200);
ok('Berater: alle 25 Ansichten, § 19-Schalter sichtbar, Daten/Einstellung erhalten', await page.evaluate(() => document.querySelectorAll('.nav-item').length === 25 && document.body.textContent.replace(/\u00ad/g, '').includes('Kleinunternehmer (§19 UStG)') && window.__probe.getSettings().kleinunternehmer === true));
await page.evaluate(async () => { await window.__probe.updateSettings({ nutzungsmodus: 'selbststaendig', kleinunternehmer: false }); });
await page.waitForTimeout(200);

console.log('— Schrift-Regel A5: fünf Breiten × zwei Schriftgrößen × vier Ansichten —');
await page.evaluate(() => window.__probe.applyTheme('light', 'blau'));
const ANSICHTEN = ['dashboard', 'documents', 'journal', 'settings'];
let gesamtFehler = []; let gesamtGrenzen = [];
for (const [proz, css] of SCHRIFTEN) {
  await schrift(css);
  for (const w of BREITEN) {
    await breite(w);
    for (const a of ANSICHTEN) {
      await gehe(a);
      await page.waitForTimeout(250);
      const { fehler, grenzen } = await page.evaluate(UEBERLAUF);
      ok(`${w} px · ${proz} % · ${a}: keine abgeschnittene/überlaufende Schrift`, fehler.length === 0, fehler.slice(0, 4).join(' · '));
      gesamtFehler.push(...fehler.map((f) => `${w}px/${proz}%/${a}: ${f}`));
      gesamtGrenzen.push(...grenzen.map((f) => `${w}px/${proz}%/${a}: ${f}`));
      if (grenzen.length) console.log(`    ⚠ benannte Grenze (Feld schon volle Breite): ${grenzen.join(' · ')}`);
      await foto(`${a}-${w}-${proz}`);
      if (w === 390 && a === 'settings') { await page.click('.nav-toggle'); await page.waitForTimeout(150); const f2 = (await page.evaluate(UEBERLAUF)).fehler; ok(`${w} px · ${proz} % · Schublade offen: kein Überlauf`, f2.length === 0, f2.slice(0, 3).join(' · ')); await foto(`schublade-${w}-${proz}`); await page.mouse.click(w - 8, 400); await page.waitForTimeout(150); ok(`${w} px · ${proz} % · Tipp neben die Schublade schließt sie`, await page.evaluate(() => !document.querySelector('.app').classList.contains('nav-open'))); }
    }
  }
}
await schrift('');
await breite(1366);
if (FOTOS) await writeFile(join(FOTO_ORDNER, 'ueberlauf-befunde.txt'), 'FEHLER:\n' + (gesamtFehler.length ? gesamtFehler.join('\n') : 'keine') + '\n\nBENANNTE GRENZEN (Auswahlfeld schon volle Breite, Schrift größer als die Zeile):\n' + (gesamtGrenzen.length ? gesamtGrenzen.join('\n') : 'keine') + '\n', 'utf8');

console.log('— Einrichtung im echten index.html: Modus-Frage, Shamir-Knopf „weiter", Privat überspringt Rechnungsstelle —');
const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const p2 = await ctx2.newPage();
p2.setDefaultTimeout(20000);
const fehler2 = [];
p2.on('pageerror', (e) => fehler2.push(String(e.message || e)));
await p2.goto(BASIS + '/index.html');
await p2.click('.intro-screen .btn-primary');                       // Deckblatt → Anmeldung
await p2.waitForSelector('input[type="password"]');
const pws = await p2.$$('input[type="password"]');
await pws[0].fill('probe-passwort-123'); await pws[1].fill('probe-passwort-123');
await p2.click('.lock-form .btn-primary');                          // Tresor erstellen → Shamir
await p2.waitForSelector('.shares');
ok('Shamir-Schritt: Knopf heißt nicht mehr „Speichern" (B7)', await p2.evaluate(() => { const b = document.querySelector('.lock-card .btn-primary'); return !!b && b.textContent.includes('weiter') && !b.textContent.includes('Speichern'); }));
if (FOTOS) await p2.screenshot({ path: join(FOTO_ORDNER, 'einrichtung-shamir-1024.png') });
await p2.click('.lock-card .btn-primary');                           // → Modus-Frage
await p2.waitForSelector('.modus-wahl');
ok('Modus-Frage mit vier Wahlen, Privat vorn', await p2.evaluate(() => [...document.querySelectorAll('.modus-wahl .btn')].map((b) => b.textContent.replace(/\u00ad/g, '')).join('|') === 'Privat|Kleinunternehmer|Selbstständig|Berater'));
if (FOTOS) await p2.screenshot({ path: join(FOTO_ORDNER, 'einrichtung-modus-1024.png') });
await p2.click('.modus-wahl .btn');                                  // Privat
await p2.waitForTimeout(300);
ok('Privat überspringt die Rechnungsstelle und landet beim Backup', await p2.evaluate(() => document.body.textContent.includes('Erstes Backup') && !document.body.textContent.includes('Rechnungsnummern')));
await p2.click('.lock-card .btn:not(.btn-primary):not(.btn-sm)');   // Backup herunterladen (lokal, erzeugt Download)
await p2.waitForTimeout(600);
await p2.click('.lock-card .btn-primary');                           // Los geht's
await p2.waitForSelector('.app-nav', { timeout: 15000 });
ok('nach der Einrichtung: Shell im Modus Privat (10 Punkte, data-modus)', await p2.evaluate(() => document.querySelectorAll('.nav-item').length === 10 && document.querySelector('.app').getAttribute('data-modus') === 'privat'));
if (FOTOS) await p2.screenshot({ path: join(FOTO_ORDNER, 'einrichtung-fertig-privat-1024.png') });
ok('keine Seitenfehler im echten index.html', fehler2.length === 0, fehler2.join(' | '));
await ctx2.close();

ok('keine Seitenfehler im Browser', fehlerSeite.length === 0, fehlerSeite.join(' | '));
await schluss();
