// tests/smoke_belegsuche.mjs — 🔎 Suche über Belege nach Wörtern und Bedeutung (Klaus 2026-10-26, A1/A2): echter Browser,
// echter Tresor, Belege mit verschlüsselt gespeichertem Text, Embedder GESTELLT (window.__blpEmbedderStub: Wortsack mit
// kleiner Synonymtafel statt 118-MB-Modell). Misst: Suchkarte, Wortsuche mit Fundstelle, A2 Buchung/Kunde, Opt-in-Dialog,
// Einordnen im Hintergrund (Vektoren verschlüsselt am Beleg), Bedeutungstreffer ohne das Suchwort, Aus-Schalter.
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
// Gestellter Embedder: Wortsack über 32 Fächer, Synonyme auf ein Stammwort, L2-normiert — deterministisch, offline.
(function(){ const SYN = { bueromiete: 'miete', mietkosten: 'miete', buromiete: 'miete', buero: 'buro', raum: 'buro' };
  // Nur Begriffe aus einem kleinen Wortschatz zählen (wie ein Bedeutungsmodell, das Füllwörter ignoriert).
  const VOK = new Set(['miete', 'buro', 'oktober', 'tankstelle', 'diesel', 'shell', 'liter', 'lager', 'hafen', 'logistik']);
  const norm = (s) => String(s||'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean).map((w) => SYN[w] || w).filter((w) => VOK.has(w));
  const vec = (s) => { const v = new Array(32).fill(0); for (const w of norm(s)) { let h = 0; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 32] += 1; } const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
  window.__blpEmbedderStub = { embedQuery: async (s) => vec(s.replace(/^query: /, '')), embedPassage: async (s) => vec(s.replace(/^passage: /, '')) };
  window.__stubVec = vec; })();
</script><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
import { saveBeleg, setBelegText, listBelege, getBelegText, getBelegVektoren } from './src/domain/documents.js';
import { saveEntwurf } from './src/domain/store.js';
import { saveKunde } from './src/domain/crm-store.js';
import { fileGet } from './src/core/db.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true });
const b1 = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 probe')], 'Rechnung-Miete.pdf', { type: 'application/pdf' }));
await setBelegText(b1.id, 'Rechnung Nr. 17 vom 03.09.2026\\nBüromiete Oktober 2026, 890,00 EUR\\nMuster GmbH, Hamburg');
const b2 = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 probe2')], 'Tankquittung.pdf', { type: 'application/pdf' }));
await setBelegText(b2.id, 'Tankstelle Shell, Diesel 48,2 l, 72,30 EUR, 12.10.2026');
const b3 = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 ohne')], 'OhneText.pdf', { type: 'application/pdf' }));
await saveEntwurf({ datum: '2026-10-01', beschreibung: 'Miete Oktober Lager', zeilen: [] });
await saveKunde({ name: 'Hamburger Hafen Logistik', email: 'info@hhl.example' });
window.__p = { getSettings, updateSettings, navigate, listBelege, getBelegText, getBelegVektoren, fileGet, ids: { b1: b1.id, b2: b2.id, b3: b3.id }, shell: () => renderShell(document.getElementById('app'), {}) };
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
const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const warte = (fn, arg, ms = 10000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  // Der Text liegt verschlüsselt: im Roh-Datensatz steht er nicht im Klartext, die Liste kennt nur die Zahl
  const roh1 = await page.evaluate(async () => { const id = window.__p.ids.b1; const r = await window.__p.fileGet(id); const m = (await window.__p.listBelege()).find((b) => b.id === id); return { hatTextDaten: !!(r.textDaten && r.textDaten.ct), klartextDrin: JSON.stringify(r).includes('Büromiete'), textZeichen: m.textZeichen, listeHatTextDaten: 'textDaten' in m, lesbar: await window.__p.getBelegText(id) }; });
  ok('Belegtext liegt verschlüsselt am Beleg (kein Klartext im Datensatz), Liste kennt nur die Zeichenzahl', roh1.hatTextDaten && !roh1.klartextDrin && roh1.textZeichen > 40 && !roh1.listeHatTextDaten, JSON.stringify(roh1).slice(0, 200));
  ok('… und ist entschlüsselt wieder lesbar', roh1.lesbar.includes('Büromiete Oktober'));

  await page.evaluate(() => window.__p.navigate('documents'));
  await warte(() => document.querySelector('[data-belegsuche]'));
  await warte(() => document.querySelector('[data-belegsuche] + .mikro'));   // das Mikrofon hängt der Beobachter nach dem Zeichnen an
  ok('Suchkarte steht über der Belegliste', !!(await page.$('[data-belegsuche-karte]')) && !!(await page.$('[data-belegsuche] + .mikro')));
  // Wortsuche
  await page.fill('[data-belegsuche]', 'miete hamburg');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === 'miete hamburg');
  let s = await page.evaluate(() => window.__blpSuche);
  ok('Wortsuche „miete hamburg“: der Mietbeleg (UND), nicht die Tankquittung', await page.evaluate(() => { const s = window.__blpSuche; return s.treffer.some((x) => x.id === window.__p.ids.b1) && !s.treffer.some((x) => x.id === window.__p.ids.b2); }), JSON.stringify(s));
  ok('A2: Kunde „Hamburger Hafen Logistik“ ist mit dabei (Wort „hamburg“ … nein: „miete“ fehlt → nicht)', !s.treffer.some((x) => x.typ === 'kunde'));
  await page.fill('[data-belegsuche]', 'miete');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === 'miete');
  s = await page.evaluate(() => window.__blpSuche);
  ok('„miete“: Beleg UND Buchung „Miete Oktober Lager“ (A2)', s.treffer.some((x) => x.typ === 'beleg') && s.treffer.some((x) => x.typ === 'buchung'), JSON.stringify(s));
  const stelle = await page.$eval('[data-suche-treffer] li[data-typ="beleg"] .suche-stelle', (e) => e.textContent).catch(() => '');
  ok('Fundstelle zeigt den Ausschnitt um das Wort', /Büromiete/.test(stelle), stelle);
  await page.fill('[data-belegsuche]', '3.9.2026');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === '3.9.2026');
  ok('Datum in anderer Schreibweise („3.9.2026“ findet „03.09.2026“)', (await page.evaluate(() => window.__blpSuche.treffer.some((x) => x.id === window.__p.ids.b1))));
  await page.fill('[data-belegsuche]', 'Mietkosten');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === 'Mietkosten');
  ok('„Mietkosten“ ohne Bedeutung: kein Treffer (das Wort steht nirgends)', (await page.evaluate(() => window.__blpSuche.treffer.length)) === 0 && !!(await page.$('[data-suche-leer]')));

  // Bedeutung einschalten: Dialog, Einordnen, Vektoren verschlüsselt am Beleg
  ok('Schalter „Bedeutung einschalten“ steht da (aus)', (await page.getAttribute('[data-bedeutung-schalter]', 'data-bedeutung-schalter')) === 'aus');
  page.once('dialog', (d) => { ok('Opt-in-Dialog nennt 118 MB und dass Belege das Gerät nicht verlassen', /118 MB/.test(d.message()) && /verlassen das Gerät nicht/.test(d.message())); d.accept(); });
  await page.click('[data-bedeutung-schalter]');
  await warte(() => window.__blpBedeutung && window.__blpBedeutung.stand === 'bereit', null, 20000);
  const z = await page.evaluate(() => window.__blpBedeutung);
  ok('Modell (gestellt) geladen, Belege eingeordnet, Zustand „bereit“ mit Zählern', z && z.stand === 'bereit' && /2 Belege/.test(z.text) && /1 ohne/.test(z.text), JSON.stringify(z));
  const vk = await page.evaluate(async () => { const id = window.__p.ids.b1; const r = await window.__p.fileGet(id); const m = (await window.__p.listBelege()).find((b) => b.id === id); const v = await window.__p.getBelegVektoren(id); return { verschluesselt: !!(r.vektorDaten && r.vektorDaten.ct), klartext: JSON.stringify(r).includes('Büromiete Oktober'), anzahl: m.vektorAnzahl, zerlegung: m.vektorZerlegung, gelesen: v.length, dim: v[0] && v[0].vec.length }; });
  ok('Vektoren liegen verschlüsselt am Beleg (Anzahl/Zerlegung offen), entschlüsselt lesbar', vk.verschluesselt && !vk.klartext && vk.anzahl >= 1 && vk.zerlegung === 'z1' && vk.gelesen === vk.anzahl && vk.dim === 32, JSON.stringify(vk));
  ok('Beleg ohne Text bekommt keine Vektoren', (await page.evaluate(async () => (await window.__p.listBelege()).find((b) => b.id === window.__p.ids.b3).vektorAnzahl)) === undefined);
  // Bedeutungstreffer ohne das Suchwort
  await page.fill('[data-belegsuche]', 'Mietkosten Oktober');
  await warte(() => window.__blpSuche && window.__blpSuche.frage === 'Mietkosten Oktober' && window.__blpSuche.bedeutung >= 0);
  s = await page.evaluate(() => window.__blpSuche);
  ok('„Mietkosten“ findet jetzt den Mietbeleg NACH BEDEUTUNG (🧠), nicht die Tankquittung', await page.evaluate(() => { const s = window.__blpSuche; return s.treffer.some((x) => x.id === window.__p.ids.b1 && x.art === 'bedeutung') && !s.treffer.some((x) => x.id === window.__p.ids.b2); }), JSON.stringify(s));
  await warte(() => document.querySelector('[data-suche-treffer] li[data-art="bedeutung"]'));
  const typ = await page.$eval('[data-suche-treffer] li[data-art="bedeutung"] .suche-typ', (e) => e.textContent + (e.querySelector('use[href="#blp-bedeutung"]') ? ' [Strich:Bedeutung]' : '')).catch(() => '');
  // Pro-Umbau 3 (Leitfaden § 5): Strichgrafik statt 🧠 — das Symbol steht als <svg><use #blp-bedeutung>, die Zahl bleibt.
  ok('die Liste zeigt die Nähe in Prozent beim Bedeutungs-Treffer (Strichsymbol statt 🧠)', /\d+ %/.test(typ) && /\[Strich:Bedeutung\]/.test(typ) && !/🧠/.test(typ), typ + ' | ' + (await page.$eval('[data-suche-treffer]', (e) => e.innerHTML.slice(0, 300)).catch(() => '')));
  // Aus-Schalter
  await page.click('[data-bedeutung-schalter]');
  await warte(() => document.querySelector('[data-bedeutung-schalter]') && document.querySelector('[data-bedeutung-schalter]').dataset.bedeutungSchalter === 'aus');
  ok('„Bedeutung aus“ schaltet die Einstellung zurück', (await page.evaluate(() => window.__p.getSettings().bedeutungssuche)) === 'aus');
  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e) + '\n  Seitenfehler: ' + fehler.join(' | ').slice(0, 600));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
