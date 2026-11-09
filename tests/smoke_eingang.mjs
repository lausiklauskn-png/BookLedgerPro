// tests/smoke_eingang.mjs — Belege aus „Eingang-BookLedgerPro“ übernehmen: ein Tipp oder von selbst (Klaus 2026-11-09:
// „Ja, bau das mit dem automatischen Übernehmen ein“). Echter Browser, echter Tresor der App, echte Belegseite; die
// Android-Brücke ist gestellt (dieselbe wie in smoke_tresorordner.mjs). Fremde Fächer werden nie von selbst übernommen.
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig. Gegenprobe: EG_WURZEL=<Kopie> node tests/smoke_eingang.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(process.env.EG_WURZEL || join(dirname(fileURLToPath(import.meta.url)), '..'));
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const BRUECKE = `
window.__log = [];
(function () {
  const z = { gewaehlt: false, vorhanden: false, offen: false, ordner: '', gemerkt: false };
  const faecher = { 'bookledgerpro': [], 'eingang-bookledgerpro': [], 'private-brain': [], 'workflow-pdf-pro': [], 'eingang-workflowpdf': [] };
  const inhalte = new Map(), marken = new Map(), tickets = new Map();
  let nr = 0;
  const log = (m, a) => window.__log.push([m, JSON.parse(JSON.stringify(a || {}))]);
  const b64 = (s) => btoa(String.fromCharCode(...s));
  const eintrag = (fach, e, bytes) => { faecher[fach].push(e); if (bytes) inhalte.set(fach + '|' + e.id, bytes); };
  window.__fach = { eintrag, faecher, inhalte };
  const zustand = () => ({ ...z, kennung: 'erfundener-pro-tresor', erreichbar: z.gewaehlt, faecher: z.offen ? Object.keys(faecher).map((f) => ({ fach: f })) : undefined,
    ersatz: z.offen ? (z.ersatz ? { vorhanden: true, angelegt: z.ersatz } : { vorhanden: false }) : undefined });
  const T = {
    zustand: async () => (log('zustand'), zustand()),
    ordnerWaehlen: async () => { log('ordnerWaehlen'); z.gewaehlt = true; z.ordner = 'SD-Karte'; return zustand(); },
    anlegen: async (a) => { log('anlegen', a); z.vorhanden = true; z.offen = true; z.gemerkt = !!a.merken; return zustand(); },
    entsperren: async (a) => { log('entsperren', a); z.offen = true; return zustand(); },
    ...(window.__einrichtenProbe ? { tresorEinrichten: async (a) => { log('tresorEinrichten', a); return { ...zustand(), angelegt: true }; } } : {}),
    sperren: async (a) => { log('sperren', a); z.offen = false; return zustand(); },
    passwortAendern: async () => (log('passwortAendern'), { geaendert: true }),
    ersatzErstellen: async () => { log('ersatzErstellen'); z.ersatz = Date.now(); return { teile: [1, 2, 3, 4, 5].map((i) => 'FPT1-PROBE-' + i), n: 5, k: 3 }; },
    wiederherstellen: async (a) => { log('wiederherstellen', a); z.offen = true; return zustand(); },
    ablegenBeginnen: async (a) => { log('ablegenBeginnen', a); if (!z.offen) throw new Error('TRESOR_GESPERRT'); const t = 't' + (++nr); tickets.set(t, { ...a, teile: [] }); return { ticket: t }; },
    ablegenTeil: async (a) => { const t = tickets.get(a.ticket); t.teile.push(Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0))); return {}; },
    ablegenFertig: async (a) => {
      const t = tickets.get(a.ticket); tickets.delete(a.ticket);
      const n = t.teile.reduce((s, x) => s + x.length, 0), bytes = new Uint8Array(n); let o = 0; for (const x of t.teile) { bytes.set(x, o); o += x.length; }
      const id = crypto.randomUUID();
      const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (x) => x.toString(16).padStart(2, '0')).join('');
      const e = { id, name: t.name, art: t.art, datum: t.datum, groesse: n, auszug: t.auszug, verweis: (t.unterordner ? t.unterordner + '/' : '') + id + '.fpt', schreiber: 'bookledgerpro', verschluesselung: 'fpt1', sha256: sha };
      log('ablegenFertig', { fach: t.fach, unterordner: t.unterordner, name: t.name, groesse: n });
      eintrag(t.fach, e, bytes); return e;
    },
    ablegenAbbrechen: async () => ({}),
    verzeichnis: async (a) => { log('verzeichnis', a); if (!z.offen) throw new Error('TRESOR_GESPERRT'); return { eintraege: faecher[a.fach], marken: [...(marken.get(a.fach) || [])] }; },
    lesenOeffnen: async (a) => { log('lesenOeffnen', a); const e = faecher[a.fach].find((x) => x.id === a.id); if (!e || e.verschluesselung !== 'fpt1') throw new Error('TRESOR_NUR_IN_DER_APP'); tickets.set('l' + a.id, { bytes: inhalte.get(a.fach + '|' + a.id), pos: 0 }); return { ticket: 'l' + a.id, name: e.name, art: e.art, groesse: e.groesse }; },
    lesenTeil: async (a) => { const t = tickets.get(a.ticket); const stueck = t.bytes.subarray(t.pos, t.pos + 262144); t.pos += stueck.length; const fertig = t.pos >= t.bytes.length; return { data: b64(stueck), fertig }; },
    markieren: async (a) => {
      const { listBelege, getBelegBytes } = await import('./src/domain/documents.js');
      const original = inhalte.get(a.fach + '|' + a.id), sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', original)), x => x.toString(16).padStart(2, '0')).join('');
      const gespeichert = (await listBelege()).find(x => x.proUebergabe?.sha256 === sha);
      if (!gespeichert || new TextDecoder().decode(await getBelegBytes(gespeichert.id)) !== new TextDecoder().decode(original)) throw new Error('Vor dauerhaftem Original markiert');
      log('markieren', a); if (!marken.has(a.fach)) marken.set(a.fach, new Set()); marken.get(a.fach).add(a.id);
    },
  };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T } };
})();`;


const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
<script>${BRUECKE}</script><script src="./native/blp-native.js"></script>
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, subscribe, getRoute } from './src/state.js';
import { mountDocuments } from './src/ui/views/documents.js';
import { listBelege } from './src/domain/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await window.Capacitor.Plugins.BlpTresor.ordnerWaehlen();
await window.Capacitor.Plugins.BlpTresor.anlegen({ merken: false });
const sha = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b)), (x) => x.toString(16).padStart(2, '0')).join('');
window.__ablegen = async (fach, name, schreiber, text) => {
  const bytes = new TextEncoder().encode('%PDF-1.4 ' + text);
  const id = crypto.randomUUID();
  window.__fach.eintrag(fach, { id, name, art: 'beleg', datum: Date.now(), groesse: bytes.length, auszug: text, verweis: id + '.fpt', schreiber, verschluesselung: 'fpt1', sha256: await sha(bytes) }, bytes);
  return id;
};
const app = document.getElementById('app');
window.__mount = () => mountDocuments(app);
subscribe(() => { if (getRoute() === 'documents') mountDocuments(app); });
window.__p = { updateSettings, listBelege };
window.__bereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__probe.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE); }
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
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true);
  const wppId = await page.evaluate(() => window.__ablegen('eingang-bookledgerpro', 'Scan-Tankbeleg.pdf', 'workflow-pdf-pro', 'Tankstelle 61,20'));
  await page.evaluate(() => window.__ablegen('private-brain', 'Notiz.pdf', 'private-brain', 'Private Notiz'));

  console.log('— A. Ein Tipp: „Alle übernehmen“ —');
  await page.evaluate(() => window.__mount());
  await page.waitForSelector('[data-belege-eingang]');
  const zeile = await page.textContent('[data-belege-eingang]');
  ok('Zeile über den Belegen nennt Zahl und Herkunft', /1 neue Belege von Workflow PDF Pro/.test(zeile), zeile);
  ok('fremdes Fach (Private Brain) steht getrennt als „Neu im Tresorordner“', /Neu im Tresorordner: 1/.test(await page.textContent('[data-belege-tresor-neu]')));
  await page.click('[data-belege-eingang-uebernehmen]');
  await page.waitForFunction(async () => (await window.__p.listBelege()).some((b) => /Scan-Tankbeleg/.test(b.name || '')));
  ok('Beleg ist übernommen', true);
  // Markiert wird erst NACH dem dauerhaften Speichern (die gestellte Brücke prüft das) — darauf warten.
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'markieren'));
  const mk = await page.evaluate(() => window.__log.filter((x) => x[0] === 'markieren').map((x) => x[1]));
  ok('nur der Eingang ist markiert, nicht das fremde Fach', mk.length === 1 && mk[0].fach === 'eingang-bookledgerpro' && mk[0].id === wppId, JSON.stringify(mk));
  await page.waitForFunction(() => !document.querySelector('[data-belege-eingang]'));
  ok('danach keine Eingangs-Zeile mehr', true);

  console.log('— B. Von selbst (Schalter an) —');
  await page.evaluate(() => window.__ablegen('eingang-bookledgerpro', 'Mail-Rechnung.pdf', 'private-brain', 'Rechnung Strom'));
  await page.evaluate(() => window.__p.updateSettings({ eingangAutomatisch: true }));
  await page.evaluate(() => window.__mount());
  await page.waitForFunction(() => window.__log.filter((x) => x[0] === 'markieren').length >= 2);
  ok('neuer Eingangs-Beleg wurde ohne Tipp übernommen', true);
  await page.waitForFunction(() => /übernommen/.test(window.__blpToast || ''));
  ok('Meldung „1 Belege aus dem Eingang übernommen.“', /1 Belege aus dem Eingang übernommen/.test(await page.evaluate(() => window.__blpToast)));
  const mk2 = await page.evaluate(() => window.__log.filter((x) => x[0] === 'markieren').map((x) => x[1].fach));
  ok('fremdes Fach bleibt auch mit Schalter unberührt', mk2.length === 2 && mk2.every((f) => f === 'eingang-bookledgerpro'), JSON.stringify(mk2));
  const anz = await page.evaluate(async () => (await window.__p.listBelege()).filter((b) => /Scan-Tankbeleg|Mail-Rechnung/.test(b.name || '')).length);
  ok('kein Beleg doppelt', anz === 2, String(anz));
  ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
} catch (e) {
  ok('Probe lief durch', false, String(e && e.message || e) + ' · ' + fehler.join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
