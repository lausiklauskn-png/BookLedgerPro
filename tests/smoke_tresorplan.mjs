// tests/smoke_tresorplan.mjs — gemeinsamer Tresor-Plan (Klaus 2026-11-03: „Ja zum Plan“) im ECHTEN Browser.
//
//   node tests/smoke_tresorplan.mjs      (Chromium + playwright/playwright-core aus der Umgebung)
//
// Echt: Tresorordner-Ansicht, native/blp-native.js (Speichern-Weg), Hilfe „Wo liegt was?“. GESTELLT: die Android-Brücken
// BlpTresor (Zustand je Fall) und BlpFiles (nimmt das Speichern entgegen). Ob Android den Ordner/Dialog zeigt und die
// Datei wirklich schreibt oder löscht, misst diese Probe NICHT (BlpFilesPlugin.java ist hier nur gelesen).
// Nur erfundene Daten. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

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
if (!existsSync(join(WURZEL, 'native/blp-native.js'))) { console.log('nur in der Pro-App (native/blp-native.js fehlt)'); process.exit(0); }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const BRUECKE = (z) => `
window.__log = [];
(function () {
  const z = ${JSON.stringify(z)};
  const log = (m, a) => window.__log.push([m, JSON.parse(JSON.stringify(a || {}))]);
  const inhalt = new TextEncoder().encode('%PDF-1.4 Rechnung Muster');
  const eingang = [{ id: 'e1', name: 'Rechnung Muster GmbH 2026-11.pdf', art: 'application/pdf', datum: 1762128000000, groesse: inhalt.length, auszug: 'Rechnung', verweis: 'e1.fpt', schreiber: 'workflow-pdf-pro', verschluesselung: 'fpt1' }];
  const T = {
    zustand: async () => (log('zustand'), { ...z }),
    ordnerWaehlen: async () => (log('ordnerWaehlen'), { ...z }),
    anlegen: async (a) => { log('anlegen', a); return { ...z }; },
    entsperren: async () => ({ ...z }), sperren: async () => ({ ...z }),
    verzeichnis: async (a) => ({ eintraege: a.fach === 'eingang-bookledgerpro' ? eingang : [], marken: [] }),
    lesenOeffnen: async (a) => ({ ticket: 'l1', name: eingang[0].name, art: 'application/pdf', groesse: inhalt.length }),
    lesenTeil: async () => ({ data: btoa(String.fromCharCode(...inhalt)), fertig: true }),
  };
  const F = {
    save: async (a) => { log('save', { name: a.name, mime: a.mime, laenge: atob(a.data).length }); return { saved: true, imTresor: false }; },
    share: async () => ({ shared: true }),
  };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F } };
})();`;

const PROBE = (z) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
<script>${BRUECKE(z)}</script><script src="./native/blp-native.js"></script>
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings } from './src/state.js';
import { mountTresorordner } from './src/ui/views/tresorordner.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await mountTresorordner(document.getElementById('app'));
window.__probeBereit = true;
</script></body></html>`;

const FAELLE = {
  leer: { gewaehlt: true, erreichbar: true, vorhanden: false, offen: false, ordner: 'Download', pfad: 'Download' },
  verwaltung: { gewaehlt: true, erreichbar: true, vorhanden: false, offen: false, ordner: 'Privat Brain Pro Hauptablageordner/Tresorordner', pfad: 'Privat Brain Pro Hauptablageordner/Tresorordner' },
  fach: { gewaehlt: true, erreichbar: true, vorhanden: false, offen: false, ordner: 'Privat Brain Pro Hauptablageordner/BookLedgerPro', pfad: 'Privat Brain Pro Hauptablageordner/BookLedgerPro' },
  nichts: { gewaehlt: false },
  offen: { gewaehlt: true, erreichbar: true, vorhanden: true, offen: true, ordner: 'Privat Brain Pro Hauptablageordner', kennung: 'erfunden', faecher: [] },
};
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const fall = pfad.match(/^\/__(\w+)\.html$/);
  if (fall && FAELLE[fall[1]]) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(FAELLE[fall[1]])); }
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

const fehler = [];
async function seite(fall, dialog = 'dismiss') {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(fall + ': ' + String(e.message || e)));
  page.on('dialog', (d) => { page.__fragen = (page.__fragen || []).concat(d.message()); return dialog === 'accept' ? d.accept() : d.dismiss(); });
  await page.goto(`${BASIS}/__${fall}.html`); await page.waitForFunction(() => window.__probeBereit === true);
  await page.waitForSelector('[data-tresor-status]');
  return { ctx, page };
}

console.log('— A. Ordner ohne Tresor: erst der Hinweis, neu anlegen nur nach Rückfrage —');
{
  const { ctx, page } = await seite('leer', 'dismiss');
  const r = await page.evaluate(() => ({
    kein: document.querySelector('[data-tresor-kein-tresor]')?.textContent || '',
    primaer: document.querySelector('[data-tresor-status] .btn-primary')?.hasAttribute('data-tresor-waehlen'),
    zu: document.querySelector('[data-tresor-neu-anlegen]') && !document.querySelector('[data-tresor-neu-anlegen]').open,
  }));
  ok('Satz „In diesem Ordner liegt kein Tresor … wähle den Ordner, in dem tresorordner.json liegt“', /kein Tresor/.test(r.kein) && /tresorordner\.json/.test(r.kein), r.kein);
  ok('Hauptknopf = anderen Ordner wählen; „neu anlegen“ zugeklappt', r.primaer && r.zu);
  await page.click('[data-tresor-neu-anlegen] > summary');
  await page.click('[data-tresor-anlegen]');
  await page.waitForTimeout(300);
  ok('Tipp auf „Tresorordner anlegen“ fragt nach („NEUEN, leeren Tresor in „Download““) – Abbrechen legt nichts an',
    (page.__fragen || []).some((f) => /NEUEN, leeren Tresor in „Download“/.test(f)) && !(await page.evaluate(() => window.__log.some((x) => x[0] === 'anlegen'))));
  ok('Hilfe „Wo liegt was?“ steht offen da, mit dem App-Fach und dem Menüweg', await page.evaluate(() => {
    const h = document.querySelector('[data-wo-liegt-was]');
    return !!h && h.open && /Wo liegt was\?/.test(h.textContent) && /tresorordner\.json/.test(h.textContent) && /Eingang-BookLedgerPro/.test(h.textContent) && /Tresor & Ablage/.test(h.textContent);
  }));
  await ctx.close();
  const z = await seite('leer', 'accept');
  await z.page.click('[data-tresor-neu-anlegen] > summary');
  await z.page.click('[data-tresor-anlegen]');
  await z.page.waitForFunction(() => window.__log.some((x) => x[0] === 'anlegen'));
  ok('… ausdrückliches OK legt an (genau ein Aufruf an die Brücke)', await z.page.evaluate(() => window.__log.filter((x) => x[0] === 'anlegen').length === 1));
  await z.ctx.close();
}

console.log('— B. falscher Ordner im Tresor: nie neu anlegen —');
for (const [fall, satz] of [['verwaltung', /Verwaltungsordner/], ['fach', /„BookLedgerPro“ ist ein Fach im Tresor/]]) {
  const { ctx, page } = await seite(fall);
  const r = await page.evaluate(() => ({ problem: document.querySelector('[data-tresor-problem]')?.textContent || '', anlegen: !!document.querySelector('[data-tresor-anlegen]') }));
  ok(`${fall}: klarer Satz, „Ordner darüber wählen“, kein „anlegen“`, satz.test(r.problem) && /Ordner darüber/.test(r.problem) && !r.anlegen, JSON.stringify(r));
  await ctx.close();
}
{
  const { ctx, page } = await seite('nichts');
  ok('noch nichts gewählt: Hinweissatz „Wähle den Ordner, in dem „tresorordner.json“ liegt“ beim Knopf', await page.evaluate(() => /tresorordner\.json“ liegt/.test(document.querySelector('[data-tresor-waehlen-hinweis]')?.textContent || '')));
  await ctx.close();
}

console.log('— C. Speichern unter … mit echtem Namen —');
{
  const { ctx, page } = await seite('offen');
  await page.waitForSelector('[data-tresor-speichern="e1"]');
  ok('Hilfe bei verbundenem Tresor zugeklappt', await page.evaluate(() => !document.querySelector('[data-wo-liegt-was]').open));
  await page.click('[data-tresor-speichern="e1"]');
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'save'));
  const s = await page.evaluate(() => window.__log.find((x) => x[0] === 'save')[1]);
  ok('Eintrag aus dem Eingangsfach geht mit seinem echten Namen und ganzem Inhalt an Androids Speichern-Dialog', s.name === 'Rechnung Muster GmbH 2026-11.pdf' && s.mime === 'application/pdf' && s.laenge === 24, JSON.stringify(s));
  await ctx.close();
}
ok('keine Fehler auf den Seiten', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
