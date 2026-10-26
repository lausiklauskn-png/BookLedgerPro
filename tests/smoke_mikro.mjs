// tests/smoke_mikro.mjs — 🎙 an jeder Texteingabe (Klaus 2026-10-26, Plan B1): echter Browser, echter Tresor,
// Spracherkennung GESTELLT (window.webkitSpeechRecognition liefert einen festen Satz). Misst: Leiste an Feldern
// (Buchungen, Kunden, Belege), Sprachmarke sichtbar und je Feld gemerkt (auch nach Neuzeichnen), Einsetzen an der
// Cursorstelle, Wort-Speicher (datalist, Chips), Löschen in den Einstellungen, A5 (28 px, kein Überlauf).
// Rückgabe 0 grün · 1 ROT · 2 nicht lauffähig.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));
if (!CHROMIUM) { console.log('nicht lauffähig: Chromium fehlt'); process.exit(2); }
let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script>
// Gestellte Browser-Spracherkennung (BEIDE Namen — Chromium hat seit 128 auch das unpräfixierte SpeechRecognition; die echte
// meldet headless „not-allowed“): liefert nach start() den Satz aus window.__satz in der gesetzten Sprache.
window.__erkannt = [];
window.SpeechRecognition = window.webkitSpeechRecognition = function () { const r = this; r.lang = ''; r.start = () => { window.__erkannt.push(r.lang); setTimeout(() => { r.onresult && r.onresult({ results: [[{ transcript: window.__satz || 'Miete Büro Hamburg' }]] }); r.onend && r.onend(); }, 20); }; r.stop = () => { r.onend && r.onend(); }; };
</script><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true });
window.__p = { getSettings, updateSettings, navigate, hydrateSettings, shell: () => renderShell(document.getElementById('app'), {}) };
window.__p.shell();
window.__bereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
  const datei = join(WURZEL, pfad);
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(datei); res.writeHead(200, { 'content-type': TYP[extname(datei)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
let browser;
try { browser = await pw.chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const warte = (fn, ms = 10000) => page.waitForFunction(fn, null, { timeout: ms }).catch(() => null);
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });

  // Buchungen: Textfelder bekommen die Leiste
  await page.evaluate(() => window.__p.navigate('journal'));
  await warte(() => document.querySelectorAll('#content .mikro').length > 0);
  const z1 = await page.evaluate(() => ({ felder: [...document.querySelectorAll('#content input, #content textarea')].filter((f) => f.type !== 'date' && f.type !== 'number' && f.type !== 'checkbox' && f.type !== 'hidden' && f.tagName !== 'SELECT').length, leisten: document.querySelectorAll('#content .mikro').length, marke: document.querySelector('#content .mikro-sprache') && document.querySelector('#content .mikro-sprache').textContent, hoehe: Math.max(...[...document.querySelectorAll('#content .mikro .btn')].map((b) => b.getBoundingClientRect().height)), seite: document.documentElement.scrollWidth }));
  ok('Buchungen: jedes Textfeld hat eine 🎙-Leiste', z1.leisten > 0 && z1.leisten >= z1.felder, JSON.stringify(z1));
  ok('die Sprachmarke ist sichtbar und sagt „DE ▾“ (App-Sprache Deutsch)', z1.marke === 'DE ▾', z1.marke);
  ok('flach: Knöpfe höchstens 30 px, Seite nicht breiter als 390 px', z1.hoehe <= 30 && z1.seite <= 390, JSON.stringify(z1));

  // Sprache je Feld wählen: Liste öffnet sich, Wahl bleibt nach Neuzeichnen, anderes Feld bleibt DE
  const erste = '#content .mikro:first-of-type';
  const alleLeisten = await page.$$('#content .mikro');
  const l0 = alleLeisten[0], l1 = alleLeisten[1];
  await (await l0.$('.mikro-sprache')).click();
  ok('ein Tipp auf die Marke öffnet die Sprachliste', await l0.$eval('.mikro-liste', (e) => !e.hidden && e.querySelectorAll('.mikro-wahl').length === 10));
  await (await l0.$('.mikro-wahl[data-code="ru-RU"]')).click();
  await warte(() => Object.values(window.__p.getSettings().mikroSprachen || {}).includes('ru-RU'));
  const k0 = await l0.getAttribute('data-mikro');
  ok('Wahl „RU“ wird für genau dieses Feld gemerkt', (await page.evaluate((k) => (window.__p.getSettings().mikroSprachen || {})[k], k0)) === 'ru-RU' && await l0.$eval('.mikro-sprache', (e) => e.textContent === 'RU ▾'));
  ok('das Nachbarfeld bleibt bei „DE“', l1 ? await l1.$eval('.mikro-sprache', (e) => e.textContent === 'DE ▾') : true);
  await page.evaluate(() => { window.__p.navigate('dashboard'); window.__p.navigate('journal'); });
  await warte(() => document.querySelectorAll('#content .mikro').length > 0);
  ok('nach dem Neuzeichnen zeigt dasselbe Feld wieder „RU ▾“', await page.$eval(`#content .mikro[data-mikro="${k0}"] .mikro-sprache`, (e) => e.textContent === 'RU ▾').catch(() => false));

  // Einsprechen: gestellte Erkennung → Text an der Cursorstelle, Sprache des Feldes
  const feld = await page.evaluateHandle((k) => document.querySelector(`#content .mikro[data-mikro="${k}"]`).previousElementSibling, k0);
  await feld.evaluate((f) => { f.focus(); f.value = 'Zahlung an'; f.setSelectionRange(f.value.length, f.value.length); });
  await page.evaluate(() => { window.__satz = 'Muster GmbH'; });
  await page.click(`#content .mikro[data-mikro="${k0}"] .mikro-knopf`);
  await warte(() => window.__erkannt.length === 1);
  await page.waitForFunction((k) => (document.querySelector(`#content .mikro[data-mikro="${k}"]`).previousElementSibling.value || '').includes('Muster GmbH'), k0, { timeout: 5000 }).catch(() => null);
  ok('die Erkennung läuft in der Sprache des Feldes (ru-RU)', (await page.evaluate(() => window.__erkannt))[0] === 'ru-RU', JSON.stringify(await page.evaluate(() => window.__erkannt)) + ' Fehler: ' + fehler.join(' | ').slice(0, 300));
  ok('der erkannte Text steht an der Cursorstelle, mit Leerzeichen', await feld.evaluate((f) => f.value) === 'Zahlung an Muster GmbH', await feld.evaluate((f) => f.value));
  await feld.evaluate((f) => { f.setSelectionRange(0, 0); });
  await page.evaluate(() => { window.__satz = 'Vorab'; });
  await page.click(`#content .mikro[data-mikro="${k0}"] .mikro-knopf`);
  await warte(() => window.__erkannt.length === 2);
  await page.waitForFunction((k) => (document.querySelector(`#content .mikro[data-mikro="${k}"]`).previousElementSibling.value || '').startsWith('Vorab'), k0, { timeout: 5000 }).catch(() => null);
  ok('… auch am Anfang (Cursor vorn)', await feld.evaluate((f) => f.value) === 'Vorab Zahlung an Muster GmbH', await feld.evaluate((f) => f.value));

  // Wort-Speicher: change → Eintrag gemerkt → datalist am einzeiligen Feld
  await feld.evaluate((f) => { f.dispatchEvent(new Event('change', { bubbles: true })); });
  await warte(() => Object.keys(window.__p.getSettings().wortSpeicher || {}).length > 0);
  const ws = await page.evaluate(() => window.__p.getSettings().wortSpeicher);
  const istTextarea = await feld.evaluate((f) => f.tagName === 'TEXTAREA');
  ok('der Eintrag ist im Wort-Speicher (verschlüsselte Einstellung)', JSON.stringify(ws).includes(istTextarea ? 'Muster' : 'Vorab Zahlung an Muster GmbH'), JSON.stringify(ws).slice(0, 160));
  if (!istTextarea) ok('einzeiliges Feld: datalist mit dem Eintrag', await feld.evaluate((f) => { const d = document.getElementById(f.getAttribute('list') || ''); return !!d && [...d.options].some((o) => o.value === 'Vorab Zahlung an Muster GmbH'); }));
  // mehrzeilig: Belegtext → Chips
  await page.evaluate(() => window.__p.navigate('documents'));
  await warte(() => document.querySelector('#content textarea.beleg-text') && document.querySelector('#content textarea.beleg-text + .mikro'));
  const ta = await page.$('#content textarea.beleg-text');
  if (ta) {
    await ta.fill('Miete Büro Hamburg'); await ta.evaluate((f) => f.dispatchEvent(new Event('change', { bubbles: true })));
    await warte(() => JSON.stringify(window.__p.getSettings().wortSpeicher || {}).includes('Hamburg'));
    await ta.fill('Miete Ha'); await ta.evaluate((f) => { f.setSelectionRange(8, 8); f.dispatchEvent(new Event('input', { bubbles: true })); });
    await warte(() => document.querySelector('#content .mikro-wort'));
    const chip = await page.$('#content .mikro-wort[data-wort="Hamburg"]');
    ok('mehrzeiliges Feld: beim Tippen „Ha“ erscheint der Chip „Hamburg“', !!chip);
    if (chip) { await chip.click(); ok('ein Tipp ergänzt das Wort', await ta.evaluate((f) => f.value) === 'Miete Hamburg', await ta.evaluate((f) => f.value)); }
  } else ok('Belegtext-Feld vorhanden', false);
  ok('die SBKIM-Suche bekommt kein zweites Mikrofon', await page.evaluate(() => { window.__p.navigate('sbkimsuche'); return true; }) && (await warte(() => document.querySelector('#content input.beleg-text'))) !== undefined && !(await page.$('#content input.beleg-text + .mikro')));

  // Einstellungen: Vorgabesprache, Wort-Speicher an/aus, löschen
  await page.evaluate(() => window.__p.navigate('settings'));
  await warte(() => document.querySelector('[data-mikro-einstellungen]'));
  ok('Einstellungen zeigen Vorgabesprache, Wort-Speicher-Schalter und Löschen', !!(await page.$('[data-mikro-standard]')) && !!(await page.$('[data-wortspeicher-loeschen]')));
  page.once('dialog', (d) => d.accept());
  await page.click('[data-wortspeicher-loeschen]');
  await warte(() => Object.keys(window.__p.getSettings().wortSpeicher || {}).length === 0 && Object.keys(window.__p.getSettings().mikroSprachen || {}).length === 0);
  const nach = await page.evaluate(() => ({ w: window.__p.getSettings().wortSpeicher, s: window.__p.getSettings().mikroSprachen }));
  ok('Löschen leert Wort-Speicher und Sprachwahlen', Object.keys(nach.w || {}).length === 0 && Object.keys(nach.s || {}).length === 0, JSON.stringify(nach));
  await page.evaluate(() => window.__p.navigate('journal'));
  await warte(() => document.querySelectorAll('#content .mikro').length > 0);
  ok('danach steht das Feld wieder auf „DE ▾“', await page.$eval(`#content .mikro[data-mikro="${k0}"] .mikro-sprache`, (e) => e.textContent === 'DE ▾').catch(() => false));
  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
