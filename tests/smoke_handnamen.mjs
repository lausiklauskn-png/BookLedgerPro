// tests/smoke_handnamen.mjs — Pseudonymisieren ab Werk an + „Weitere Namen" / „Nie verdecken"
// von Hand (Klaus 2026-10-14). Echter Browser, echter Tresor, gestellte Mistral-Antwort.
// Misst: Standard nach dem Entsperren · die zwei Felder in den Einstellungen speichern ·
// was WIRKLICH an Mistral geht (Kontierung), samt Müller ≠ Müller-Thurgau.
// Rückgabe 0 grün · 1 ROT · 2 nicht lauffähig (kein Grün).
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

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { saveAiConfig } from './src/ai/aiConfig.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { ladeAnker } from './src/ai/anker.js';
import { categorize } from './src/ai/mistral.js';
import { renderShell } from './src/ui/shell.js';
import { mountDocuments } from './src/ui/views/documents.js';
await setupVault('probe-passwort-123');
await saveAiConfig({ mistralKey: 'probe-mistral' });
await hydrateSettings();
window.__p = { getSettings, updateSettings, ladeAnker, categorize, navigate, hydrateSettings,
  shell: () => renderShell(document.getElementById('app'), {}), belege: () => mountDocuments(document.getElementById('app')) };
window.__bereit = true;
</script></body></html>`;
const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
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
const page = await browser.newPage();
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const gesendet = [];
await page.route('**/api.mistral.ai/**', (route) => {
  gesendet.push(route.request().postData() || '');
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: '{"konto":"4980","richtung":"soll"}' } }] }) });
});
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  const s0 = await page.evaluate(() => window.__p.getSettings());
  ok('ab Werk steht „Pseudonymisieren" an', s0.datenschutzModus === 'pseudonym', s0.datenschutzModus);

  // Die Einstellungen: zwei Felder, gespeichert beim Verlassen
  await page.evaluate(() => { window.__p.shell(); window.__p.navigate('settings'); });
  await page.waitForSelector('[data-hand-liste="kiWeitereNamen"]', { timeout: 15000 }).catch(() => {});
  const da = await page.$('[data-hand-liste="kiWeitereNamen"]') && await page.$('[data-hand-liste="kiNieVerdecken"]');
  ok('die Felder „Weitere Namen" und „Nie verdecken" stehen in den Einstellungen', !!da);
  if (da) {
    // Wie ein Mensch: ins erste Feld tippen, ins zweite tippen (das speichert das erste und
    // zeichnet die Seite neu), dann hinaus. Fokus und Getipptes im zweiten Feld müssen bleiben.
    await page.click('[data-hand-liste="kiWeitereNamen"]');
    await page.keyboard.type('Müller');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Frau Schneider');
    await page.click('[data-hand-liste="kiNieVerdecken"]');
    await page.keyboard.type('Müller-Thurgau', { delay: 15 });
    ok('nach dem Wechsel ins zweite Feld bleibt der Fokus dort', await page.evaluate(() => document.activeElement && document.activeElement.dataset.handListe === 'kiNieVerdecken'));
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => (window.__p.getSettings().kiNieVerdecken || []).length === 1, null, { timeout: 10000 }).catch(() => {});
  }
  const s1 = await page.evaluate(() => window.__p.getSettings());
  ok('… und speichern ihre Einträge', JSON.stringify(s1.kiWeitereNamen) === '["Müller","Frau Schneider"]' && JSON.stringify(s1.kiNieVerdecken) === '["Müller-Thurgau"]', JSON.stringify([s1.kiWeitereNamen, s1.kiNieVerdecken]));
  const s2 = await page.evaluate(async () => { await window.__p.hydrateSettings(); return window.__p.getSettings(); });
  ok('… auch nach dem neu Laden aus dem Tresor', JSON.stringify(s2.kiNieVerdecken) === '["Müller-Thurgau"]' && s2.datenschutzModus === 'pseudonym');

  // Was geht wirklich hinaus?
  const TEXT = 'Rechnung an Herrn Müller: 12 Flaschen Müller-Thurgau, 89,40 EUR. Frau Schneider grüßt. Bearbeiter: Thomas Berger, Berliner Sparkasse.';
  await page.evaluate(async (t) => { const anker = await window.__p.ladeAnker(t); await window.__p.categorize(t, { '4980': { nummer: '4980', name: 'Betriebsbedarf', art: 'aufwand' } }, { anker }); }, TEXT);
  const raus = gesendet.join('\n');
  ok('Mistral bekam eine Anfrage', gesendet.length === 1);
  ok('„Herrn Müller" geht NICHT hinaus', !/Herrn Müller/.test(raus) && /Herrn \[\[NAME_\d+\]\]/.test(raus), raus.slice(0, 200));
  ok('„Frau Schneider" geht NICHT hinaus', !/Frau Schneider/.test(raus));
  ok('„Müller-Thurgau" geht wörtlich hinaus (ein Wein, kein Name)', /12 Flaschen Müller-Thurgau/.test(raus));
  ok('der Betrag bleibt lesbar', /89,40 EUR/.test(raus));
  // Namen nach Muster (Klaus 2026-10-26): unbekannt, nicht in Stammdaten — trotzdem verdeckt; die Bank bleibt.
  ok('„Thomas Berger" (nur im Text, kein Stammdatum) geht NICHT hinaus — nach Muster verdeckt', !/Thomas Berger/.test(raus) && /Bearbeiter: \[\[PERSON_\d+\]\]/.test(raus), raus.slice(0, 260));
  ok('„Berliner Sparkasse" geht wörtlich hinaus (Bank, kein Name)', /Berliner Sparkasse/.test(raus));

  // Unter dem Text (Klaus 2026-10-26): nach Muster verdeckte Namen stehen GELB da und sind je Treffer rücknehmbar;
  // Modul-25-Vorschläge gibt es nur noch für Namen, die kein Muster trifft.
  await page.evaluate(() => window.__p.navigate('documents'));
  await page.waitForSelector('.beleg-text', { timeout: 15000 });
  const box = '[data-namen-vorschlag]';
  ok('vor dem Tippen steht nichts da', await page.$eval(box, (b) => b.hidden).catch(() => false));
  const BRIEF = 'Sehr geehrter Herr Müller,\nbitte 12 Flaschen Müller-Thurgau, 89,40 EUR.\nMit freundlichen Grüßen\nAnna Schneider';
  await page.fill('.beleg-text', BRIEF);
  let chipDa = true;
  try { await page.waitForSelector('[data-verdeckt="Anna Schneider"]', { timeout: 10000 }); } catch { chipDa = false; }
  ok('„Anna Schneider" steht als verdeckter Treffer (gelb) da — ohne Tipp', chipDa);
  ok('… und wird nicht zusätzlich vorgeschlagen; „Müller-Thurgau" nirgends', !(await page.$('[data-vorschlag="Anna Schneider"]')) && !(await page.$('[data-verdeckt*="Thurgau"]')) && !(await page.$('[data-vorschlag*="Thurgau"]')));
  gesendet.length = 0;
  await page.evaluate(async (t) => { const anker = await window.__p.ladeAnker(t); await window.__p.categorize(t, { '4980': { nummer: '4980', name: 'Betriebsbedarf', art: 'aufwand' } }, { anker }); }, BRIEF);
  ok('ohne Tipp geht „Anna Schneider" NICHT hinaus (nach Muster verdeckt)', gesendet.length === 1 && !/Anna Schneider/.test(gesendet.join('')) && /12 Flaschen Müller-Thurgau/.test(gesendet.join('')), gesendet.join('').slice(0, 260));
  // Rücknahme: ein Tipp auf den gelben Chip → „Nie verdecken", der Name geht wörtlich hinaus
  if (chipDa) await page.click('[data-verdeckt="Anna Schneider"]');
  await page.waitForFunction(() => (window.__p.getSettings().kiNieVerdecken || []).includes('Anna Schneider'), null, { timeout: 10000 }).catch(() => {});
  ok('ein Tipp legt „Anna Schneider" unter „Nie verdecken"', (await page.evaluate(() => window.__p.getSettings().kiNieVerdecken)).includes('Anna Schneider'));
  await page.waitForFunction(() => !document.querySelector('[data-verdeckt="Anna Schneider"]'), null, { timeout: 10000 }).catch(() => {});
  ok('… und der Chip verschwindet', !(await page.$('[data-verdeckt="Anna Schneider"]')));
  gesendet.length = 0;
  await page.getByRole('button', { name: 'Analysieren', exact: true }).first().click({ timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('.vorschlag-slot') && document.querySelector('.vorschlag-slot').children.length > 0, null, { timeout: 15000 }).catch(() => {});
  const raus2 = gesendet.join('\n');
  ok('nach der Rücknahme geht „Anna Schneider" wörtlich hinaus (über den echten Knopf), „Müller" weiter verdeckt', gesendet.length >= 1 && /Anna Schneider/.test(raus2) && !/Herr Müller/.test(raus2), raus2.slice(0, 260));

  // Gegenrichtung: eine eigene Wahl „Aus" bleibt über das neu Laden hinweg
  await page.evaluate(async () => { await window.__p.updateSettings({ datenschutzModus: 'aus', datenschutzGewaehlt: true }); await window.__p.hydrateSettings(); });
  ok('eine eigene Wahl „Aus" bleibt stehen', (await page.evaluate(() => window.__p.getSettings().datenschutzModus)) === 'aus');
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e));
} finally {
  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.slice(0, 2).join(' | '));
  await browser.close(); server.close();
  console.log(`\n${gruen} grün · ${rot} ROT`);
  process.exitCode = rot ? 1 : 0;
}
