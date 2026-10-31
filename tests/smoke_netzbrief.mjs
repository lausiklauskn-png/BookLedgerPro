// tests/smoke_netzbrief.mjs — Pro-Umbau 14 A2 (Klaus 2026-10-31: „Herr Meier am Ende wird nicht gefunden“).
// Echter Tresor, echte Belege (saveBeleg/setBelegText), echtes Modul 04 (Treffer, Hybrid mit BM25), src/sbkim/netz.js und der
// Antwort-Filter wie in der App; Modul 23 ist auf das Nötige gestellt (kein Relais in der Probe), das Sprachmodell ebenso
// (Wort-Hash, 384 Stellen). Geprüft:
//   1 ein langer Brief (> 3000 Zeichen), „Mit freundlichen Grüßen … Hans Meier“ nur ganz am Ende → „Brief von Herrn Meier“ trifft ihn,
//     die Antwortzeile zeigt „Meier“ im Ausschnitt (≤ 200 Zeichen), eine Zeile je Beleg
//   2 ein neuer Beleg NACH dem Einschalten wird gefunden, ohne Aus/An (Neubau entprellt, Modul 23 nicht neu eingeschaltet)
//   3 ohne Ausschnitt (öffentlich) geht nie Belegtext in den Korpus
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. WURZEL=<Pfad> prüft eine andere Kopie (Gegenprobe).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(process.env.WURZEL || join(dirname(fileURLToPath(import.meta.url)), '..'));
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body>
<script src="./sbkim/04_match.js"></script>
<script>
// Gestelltes Sprachmodell: jedes Wort (klein, ohne Umlaut-Unterschied) auf eine Stelle von 384 — gleiche Wörter = nahe Vektoren.
(function () {
  const vec = (s) => { const v = new Float32Array(384); for (const w of String(s).toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').match(/[a-z0-9]{3,}/g) || []) {
    let h = 7; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 384] += 1; } const n = Math.hypot(...v) || 1; for (let i = 0; i < 384; i++) v[i] /= n; return v; };
  window.__passagen = 0;
  window.SbkimEmbedding = { init: async () => {}, embedPassage: async (s) => { window.__passagen++; return vec(s); }, embedQuery: async (s) => vec(s) };
  // Modul 23, auf das Nötige gestellt: eigenes Netz, Korpus wie der Kanon über prepareCorpus → Modul 04 (setLocalCorpus).
  const meta = { network: 'eigen', answering: false };
  window.__rdv = { an: 0, aus: 0, match: null };
  window.SbkimRendezvous = { _meta: meta,
    configure(o) { if ('prepareCorpus' in o) this._prep = o.prepareCorpus; if ('match' in o) window.__rdv.match = o.match; },
    connectAndAnnounce: async () => ({ ok: true }),
    enableAnswering: async () => { window.__rdv.an++; meta.answering = true; if (this && false) return; const k = await window.SbkimRendezvous._prep(); window.SbkimMatch.setLocalCorpus(k); return { ok: true }; },
    disableAnswering() { window.__rdv.aus++; meta.answering = false; } };
})();
</script>
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings } from './src/state.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
const D = await import('./src/domain/documents.js');
const N = await import('./src/sbkim/netz.js');
const leg = async (name, text) => { const b = await D.saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 ' + name)], name, { type: 'application/pdf' })); if (text) await D.setBelegText(b.id, text); return b; };
const fuell = (n, w = '') => Array.from({ length: n }, (_, i) => 'Absatz ' + (i + 1) + ': Wir bestätigen den Eingang Ihrer Unterlagen und prüfen die Angaben zur Lieferung sorgfältig.' + w).join(' ');
const brief = 'Sehr geehrte Damen und Herren, ' + fuell(40, ' Warenannahme Lager Nord.') + ' Mit freundlichen Grüßen Hans Meier';
window.__brief = { laenge: brief.length, meierAb: brief.indexOf('Meier') };
window.__meier = (await leg('Schreiben-2026-09.pdf', brief)).id;
for (let i = 1; i <= 12; i++) await leg('Rechnung-' + i + '.pdf', 'Rechnung Nr. ' + i + ' ' + fuell(6) + ' Mit freundlichen Grüßen Ihre Buchhaltung');
await leg('Quittung.pdf', '');
const laden = (mitText) => async () => {
  const belege = await D.listBelege();
  const texte = new Map();
  if (mitText) for (const b of belege) if ((b.textZeichen || 0) > 0) texte.set(b.id, await D.getBelegText(b.id));
  return { belege, buchungen: new Map(), texte: mitText ? texte : null };
};
window.__N = N; window.__leg = leg; window.__laden = laden;
window.__frage = async (f) => { const h = await window.__rdv.match.queryLocal(f, 5, { hybrid: true, exclude: true }); return h.map((x) => ({ a: x.anchorId, l: x.label })); };
window.__probeBereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' };
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
try { browser = await pw.chromium.launch(CHROMIUM ? { executablePath: CHROMIUM, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] }); }
catch (e) { console.log('nicht lauffähig: Chromium startet nicht — ' + e.message); server.close(); process.exit(2); }
const schluss = async () => { try { await browser.close(); } catch { /* egal */ } server.close(); console.log(`\n${gruen} grün · ${rot} ROT`); process.exitCode = rot ? 1 : 0; };

const page = await (await browser.newContext()).newPage();
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
const bereit = await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 }).then(() => true).catch(() => false);
if (!bereit) { ok('Probe-Seite lädt (Tresor, Belege, netz.js)', false, fehler.join(' | ')); await schluss(); process.exit(1); }

const br = await page.evaluate(() => window.__brief);
ok('Selbst-Riegel: der Brief ist lang, „Meier“ steht hinter den ersten 1500 Zeichen (dort endete der Korpus bis 0.1.8)', br.laenge > 3000 && br.meierAb > 1500, JSON.stringify(br));

// 3 — öffentlich: nie Belegtext
const oeff = await page.evaluate(async () => { const r = await window.__N.antwortenAn({ laden: window.__laden(false) }); const k = await window.SbkimRendezvous._prep(); window.__N.antwortenAus();
  return { ok: r.ok, texte: k.every((e) => e.text === e.label), anzahl: r.anzahl }; });
ok('Ohne Ausschnitt: Korpus nur Titel · Datum · Betrag (nie Belegtext), ein Eintrag je Beleg', oeff.ok && oeff.texte && oeff.anzahl === 14, JSON.stringify(oeff));

// 1 — mit Ausschnitt: ganzer Brief
const an = await page.evaluate(async () => { const r = await window.__N.antwortenAn({ laden: window.__laden(true) }); return { ok: r.ok, anzahl: r.anzahl, abschnitte: r.abschnitte, reason: r.reason }; });
ok('Mit Ausschnitt an: 14 Belege, deutlich mehr Abschnitte als Belege', an.ok && an.anzahl === 14 && an.abschnitte > 30, JSON.stringify(an));
const h = await page.evaluate(() => window.__frage('Brief von Herrn Hans Meier'));
const meier = await page.evaluate(() => 'beleg:' + window.__meier);
ok('„Brief von Herrn Hans Meier“ → erster Treffer ist der Brief, dessen Name nur am Ende steht', h.length > 0 && h[0].a === meier, JSON.stringify(h));
ok('Antwortzeile: Titel — Ausschnitt mit „Meier“, ≤ 200 Zeichen', h.length > 0 && / — .*Meier/.test(h[0].l) && h[0].l.length <= 200, h[0] && h[0].l);
const hv = await page.evaluate(() => window.__frage('Warenannahme Lager Nord'));
ok('Je Beleg höchstens eine Antwortzeile, auch wenn viele Abschnitte passen (Abschnitte teilen die anchorId)', hv.length >= 1 && new Set(hv.map((x) => x.a)).size === hv.length, JSON.stringify(hv.map((x) => x.a)));

// 2 — neuer Beleg nach dem Einschalten
const vorher = await page.evaluate(() => ({ an: window.__rdv.an, aus: window.__rdv.aus }));
await page.evaluate(() => window.__leg('Angebot-Gartenbau.pdf', 'Angebot über Heckenschnitt. Mit freundlichen Grüßen Otto Schmidt Gartenbau'));
await page.waitForFunction(() => window.__N.netzStand().korpusAnzahl > 0 && Date.now() - window.__N.netzStand().korpusAm < 60000 && window.__N.netzStand().korpusAm > (window.__seit || 0), null, { timeout: 1 }).catch(() => {});
await page.evaluate(() => { window.__seit = window.__N.netzStand().korpusAm; });
await page.waitForFunction(() => window.__N.netzStand().korpusAm > window.__seit, null, { timeout: 15000 }).catch(() => {});
const h2 = await page.evaluate(() => window.__frage('Schmidt Gartenbau'));
const nach = await page.evaluate(() => ({ an: window.__rdv.an, aus: window.__rdv.aus }));
ok('Neuer Beleg nach dem Einschalten → von selbst im Korpus und gefunden', h2.length > 0 && /Angebot-Gartenbau/.test(h2[0].l) && /Schmidt/.test(h2[0].l), JSON.stringify(h2));
ok('… ohne Aus/An (Modul 23 nicht neu eingeschaltet)', nach.an === vorher.an && nach.aus === vorher.aus, JSON.stringify({ vorher, nach }));
const p = await page.evaluate(async () => { const v = window.__passagen; window.__seit = window.__N.netzStand().korpusAm; await window.__N.korpusNeuBauen(); return window.__passagen - v; });
ok('Neubau ohne Änderung rechnet keinen Vektor neu (Zwischenspeicher)', p === 0, String(p));
await page.evaluate(() => window.__N.antwortenAus());
await page.evaluate(() => window.__leg('Spaet.pdf', 'Später Beleg Zacharias'));
await page.waitForTimeout(3600);
ok('Nach dem Ausschalten baut nichts mehr neu', await page.evaluate(() => window.__N.netzStand().korpusAm === window.__seit || !window.__N.netzStand().antwortet));
ok('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await schluss();
