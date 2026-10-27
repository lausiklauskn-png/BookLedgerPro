// tests/smoke_tresorordner.mjs — Ansicht „Tresorordner“ und automatische Sicherung im ECHTEN Browser (Schritt C/C2, 2026-10-27).
//
//   node tests/smoke_tresorordner.mjs      (Chromium + playwright/playwright-core aus der Umgebung)
//
// Echt: Web-App-Module, Tresor der App (IndexedDB, setupVault), native/blp-native.js (Klebstoff), Sicherungsformat,
// Einspielen über importSnapshot. GESTELLT: die Android-Brücke (Capacitor.Plugins.BlpTresor) — sie hält die Fächer im
// Speicher und tut so, als hätte der native Passwort-Dialog „OK“ bekommen. Die Ordnerschicht selbst (Java, Passwort,
// Ersatzschlüssel, Rechte) prüft TresorOrdnerTest auf der JVM; ob Android den Ordner und den Dialog zeigt, misst diese
// Probe NICHT. Nur erfundene Daten. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

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
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

// Gestellte Brücke: dieselben Methoden wie BlpTresorPlugin.java, Fächer im Speicher, Protokoll jedes Aufrufs.
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
  const zustand = () => ({ ...z, erreichbar: z.gewaehlt, faecher: z.offen ? Object.keys(faecher).map((f) => ({ fach: f })) : undefined,
    ersatz: z.offen ? (z.ersatz ? { vorhanden: true, angelegt: z.ersatz } : { vorhanden: false }) : undefined });
  const T = {
    zustand: async () => (log('zustand'), zustand()),
    ordnerWaehlen: async () => { log('ordnerWaehlen'); z.gewaehlt = true; z.ordner = 'SD-Karte'; return zustand(); },
    anlegen: async (a) => { log('anlegen', a); z.vorhanden = true; z.offen = true; z.gemerkt = !!a.merken; return zustand(); },
    entsperren: async (a) => { log('entsperren', a); z.offen = true; return zustand(); },
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
    markieren: async (a) => { log('markieren', a); if (!marken.has(a.fach)) marken.set(a.fach, new Set()); marken.get(a.fach).add(a.id); },
  };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T } };
})();`;

const PROBE = (mitBruecke) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
${mitBruecke ? `<script>${BRUECKE}</script><script src="./native/blp-native.js"></script>` : ''}
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getRoute, updateSettings } from './src/state.js';
import { recPut, recGet, recDel, dumpAll } from './src/core/db.js';
import { mountTresorordner, tresorordnerVerfuegbar } from './src/ui/views/tresorordner.js';
import { sicherungLesen } from './src/domain/tresorordner.js';
import { saveBeleg, setBelegText } from './src/domain/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await recPut({ id: 'probe-1', type: 'probe', wert: 'Bäckerei Muster 7,50' });
const beleg = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 Tankstelle')], 'Tankbeleg.pdf', { type: 'application/pdf' }));
await setBelegText(beleg.id || beleg, 'Tankstelle Diesel 61,20 EUR');
window.__probe = { updateSettings, getRoute, recPut, recGet, recDel, dumpAll, sicherungLesen, tresorordnerVerfuegbar, neu: () => mountTresorordner(document.getElementById('app')) };
window.__probeBereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad === '/__mit.html' || pfad === '/__ohne.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(pfad === '/__mit.html')); }
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

const warte = (page, sel) => page.waitForSelector(sel, { timeout: 15000 });
const log = (page) => page.evaluate(() => window.__log.map((x) => x[0]));

console.log('— A. PWA ohne Brücke —');
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(BASIS + '/__ohne.html'); await page.waitForFunction(() => window.__probeBereit === true);
  ok('ohne Android-Brücke ist der Tresorordner nicht verfügbar (Menüpunkt fehlt)', await page.evaluate(() => !window.__probe.tresorordnerVerfuegbar()));
  await page.evaluate(() => window.__probe.neu());
  ok('… und die Ansicht sagt ehrlich, dass es ihn nur in der App gibt', await page.evaluate(() => /nur in der Android-App/.test(document.body.textContent)));
  await ctx.close();
}

console.log('— B. App mit gestellter Brücke: wählen, anlegen, Ersatzschlüssel —');
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(15000);
const fehler = [];
page.on('pageerror', (e) => fehler.push(String(e.message || e)));
page.on('dialog', (d) => d.accept());
await page.goto(BASIS + '/__mit.html'); await page.waitForFunction(() => window.__probeBereit === true);
ok('mit Brücke verfügbar', await page.evaluate(() => window.__probe.tresorordnerVerfuegbar()));
await page.evaluate(() => window.__probe.neu());
await warte(page, '[data-tresor-waehlen]');
await page.click('[data-tresor-waehlen]');
await warte(page, '[data-tresor-anlegen]');
ok('nach der Ordnerwahl: „anlegen“ mit Ordnername', await page.evaluate(() => /SD-Karte/.test(document.querySelector('[data-tresor-status]').textContent)));
await page.check('[data-tresor-merken]');
await page.click('[data-tresor-anlegen]');
await warte(page, '[data-tresor-offen]');
const anlegen = await page.evaluate(() => window.__log.find((x) => x[0] === 'anlegen'));
ok('anlegen geht an die Brücke mit „merken“, ohne irgendein Passwort aus der Seite', anlegen && anlegen[1].merken === true && Object.keys(anlegen[1]).join() === 'merken');
ok('offen: Warnung „noch kein Ersatzschlüssel“', await page.evaluate(() => !!document.querySelector('[data-tresor-ohne-ersatz]')));
await page.click('[data-tresor-ersatz]');
await warte(page, '[data-tresor-ersatz-teile]');
ok('Ersatzschlüssel: fünf Teile werden gezeigt, Warnung weg', await page.evaluate(() => (document.querySelector('[data-tresor-ersatz-teile] pre').textContent.match(/FPT1-PROBE-/g) || []).length === 5 && !document.querySelector('[data-tresor-ohne-ersatz]')));

console.log('— C. Sicherung ins eigene Fach —');
await page.click('[data-tresor-sichern]');
await page.waitForFunction(() => window.__log.some((x) => x[0] === 'ablegenFertig'));
await warte(page, '[data-tresor-meldung]');
const ab = await page.evaluate(() => window.__log.filter((x) => x[0] === 'ablegenBeginnen' && x[1].unterordner === 'Sicherung').map((x) => x[1]));
ok('„Jetzt sichern“ legt genau eine Datei in BookLedgerPro/Sicherung (JSON, Auszug ohne Inhalte)', ab.length === 1 && ab[0].fach === 'bookledgerpro' && ab[0].unterordner === 'Sicherung' && ab[0].art === 'application/json' && /^bookledgerpro-tresorordner-\d{4}-/.test(ab[0].name) && /^Datensicherung BookLedgerPro · \d+ Datensätze/.test(ab[0].auszug) && !/Bäckerei/.test(ab[0].auszug), JSON.stringify(ab));
const inhalt = await page.evaluate(async () => {
  const e = window.__fach.faecher['bookledgerpro'].find((x) => x.verweis.startsWith('Sicherung/'));
  const text = new TextDecoder().decode(window.__fach.inhalte.get('bookledgerpro|' + e.id));
  const s = window.__probe.sicherungLesen(text); const d = await window.__probe.dumpAll();
  const ohne = (kv) => { const o = { ...kv }; delete o.lastBackupAt; return JSON.stringify(o); };
  return { gleich: JSON.stringify(s.data.records) === JSON.stringify(d.records) && ohne(s.data.kv) === ohne(d.kv), records: s.data.records.length, hatMeta: !!s.data.kv.vaultMeta };
});
ok('die Sicherung ist der ganze Bestand der App (Datensätze und Schlüssel-Hülle gleich dumpAll)', inhalt.gleich && inhalt.records >= 1 && inhalt.hatMeta, JSON.stringify(inhalt));
ok('Meldung „Gesichert.“ und Zeile „Letzte Sicherung“', await page.evaluate(() => /Gesichert/.test(document.querySelector('[data-tresor-meldung]').textContent) && /Letzte Sicherung/.test(document.querySelector('[data-tresor-letzte]').textContent)));
await page.click('[data-tresor-sichern]');
await page.waitForFunction(() => window.__log.filter((x) => x[0] === 'zustand').length >= 0 && /Nichts geändert|Gesichert/.test(document.querySelector('[data-tresor-meldung]')?.textContent || '') && window.__log.filter((x) => x[0] === 'verzeichnis').length >= 10).catch(() => {});
await page.waitForTimeout(500);
ok('unveränderter Bestand: keine zweite Datei, Meldung „Nichts geändert“', await page.evaluate(() => window.__fach.faecher['bookledgerpro'].filter((e) => e.verweis.startsWith('Sicherung/')).length === 1 && /Nichts geändert/.test(document.querySelector('[data-tresor-meldung]')?.textContent || '')));
// Automatisch: Bestand ändern, letzte Sicherung „alt“ machen, App geht in den Hintergrund
await page.evaluate(async () => {
  await window.__probe.recPut({ id: 'probe-2', type: 'probe', wert: 'neu' });
  const m = JSON.parse(localStorage.getItem('blpr_tresor_sicherung')); m.zeit -= 11 * 60 * 1000; localStorage.setItem('blpr_tresor_sicherung', JSON.stringify(m));
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForFunction(() => window.__fach.faecher['bookledgerpro'].filter((e) => e.verweis.startsWith('Sicherung/')).length === 2, null, { timeout: 15000 }).catch(() => {});
ok('automatisch: Hintergrund + geänderter Bestand + 10 Minuten vorbei → neue Sicherung', await page.evaluate(() => window.__fach.faecher['bookledgerpro'].filter((e) => e.verweis.startsWith('Sicherung/')).length === 2));
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); });

await page.evaluate(() => window.__probe.neu());
await warte(page, '[data-tresor-belege]');
const belegeImFach = await page.evaluate(() => window.__fach.faecher['bookledgerpro'].filter((e) => e.verweis.startsWith('Belege/')).map((e) => ({ name: e.name, auszug: e.auszug, inhalt: new TextDecoder().decode(window.__fach.inhalte.get('bookledgerpro|' + e.id)) })));
ok('nach der Sicherung liegt das Beleg-Original einzeln im Fach (Belege/), mit Textauszug, Inhalt für die anderen Apps lesbar — und nur einmal, obwohl zweimal gesichert wurde', belegeImFach.length === 1 && belegeImFach[0].name === 'Tankbeleg.pdf' && /Diesel/.test(belegeImFach[0].auszug) && belegeImFach[0].inhalt === '%PDF-1.4 Tankstelle', JSON.stringify(belegeImFach));
await page.click('[data-tresor-belege]');
await page.waitForFunction(() => /Belege im Fach/.test(document.querySelector('[data-tresor-meldung]')?.textContent || '')).catch(() => {});
ok('Knopf „Belege ins Fach legen“: kein Doppel („0 neu, 1 lagen schon da“)', await page.evaluate(() => window.__fach.faecher['bookledgerpro'].filter((e) => e.verweis.startsWith('Belege/')).length === 1 && /0 neu, 1 lagen schon da/.test(document.querySelector('[data-tresor-meldung]')?.textContent || '')));

console.log('— D. Fächer lesen, suchen, übernehmen, einspielen —');
await page.evaluate(() => {
  const enc = (s) => new TextEncoder().encode(s);
  window.__fach.eintrag('eingang-bookledgerpro', { id: '11111111-1111-4111-8111-111111111111', name: 'Rechnung Bäckerei.pdf', art: 'application/pdf', datum: Date.now() - 1000, groesse: 9, auszug: 'Brötchen 7,50 EUR vom 26.10.2026', verweis: '11111111-1111-4111-8111-111111111111.fpt', schreiber: 'private-brain', verschluesselung: 'fpt1', sha256: '' }, enc('%PDF-1.4 x'));
  window.__fach.eintrag('private-brain', { id: 'mail-1', name: 'Mietvertrag.eml', art: 'message/rfc822', datum: Date.now() - 5000, groesse: 1234, auszug: 'Miete Oktober', verweis: 'Mails/ab12', schreiber: 'private-brain', verschluesselung: 'app', sha256: '' });
});
await page.evaluate(() => window.__probe.neu());
await warte(page, '[data-tresor-fach="eingang-bookledgerpro"] [data-tresor-uebernehmen]');
ok('Eingang offen: Beleg mit „Als Beleg übernehmen“', await page.evaluate(() => /Rechnung Bäckerei/.test(document.querySelector('[data-tresor-fach="eingang-bookledgerpro"]').textContent)));
ok('fremdes Fach (Private Brain): Zeile lesbar, aber „Öffnet nur in ihrer eigenen App“, kein Übernehmen', await page.evaluate(() => { const f = document.querySelector('[data-tresor-fach="private-brain"]'); return /Mietvertrag/.test(f.textContent) && /nur in ihrer eigenen App/.test(f.textContent) && !f.querySelector('[data-tresor-uebernehmen]'); }));
await page.fill('[data-tresor-suche]', 'brotchen 26.10.2026');
await page.press('[data-tresor-suche]', 'Enter');
await page.waitForFunction(() => /Treffer/.test(document.querySelector('[data-tresor-treffer]')?.textContent || ''));
ok('Wortsuche über alle Fächer: „brotchen 26.10.2026“ findet den Eingangsbeleg, nicht die Mail', await page.evaluate(() => { const t = document.querySelector('[data-tresor-treffer]'); return /^1 Treffer/.test(t.textContent) && /Rechnung Bäckerei/.test(t.textContent) && !/Mietvertrag/.test(t.textContent); }));
// Bedeutungssuche (opt-in): gestelltes Modell — „Frühstück“ liegt nahe bei „Brötchen“, das Wort selbst kommt nirgends vor.
await page.evaluate(async () => {
  const v = (t) => (/br(o|ö)tchen|fr(u|ü)hst(u|ü)ck/i.test(t) ? [1, 0] : [0, 1]);
  window.__blpEmbedderStub = { embedQuery: async (t) => v(t), embedPassage: async (t) => v(t) };
  await window.__probe.updateSettings({ bedeutungssuche: 'an' }, { still: true });
});
await page.fill('[data-tresor-suche]', 'Frühstück');
await page.press('[data-tresor-suche]', 'Enter');
await page.waitForFunction(() => /nach Bedeutung/.test(document.querySelector('[data-tresor-bedeutung]')?.textContent || ''));
ok('Bedeutungssuche: „Frühstück“ (0 Worttreffer) findet den Bäckerei-Beleg nach Bedeutung, nicht die Mail', await page.evaluate(() => { const t = document.querySelector('[data-tresor-treffer]'); const b = document.querySelector('[data-tresor-bedeutung]'); return /^0 Treffer/.test(t.textContent) && /^1 weitere/.test(b.textContent) && /Rechnung Bäckerei/.test(b.textContent) && !/Mietvertrag/.test(b.textContent); }));
await page.evaluate(() => window.__probe.updateSettings({ bedeutungssuche: 'aus' }, { still: true }));
await page.click('[data-tresor-fach="eingang-bookledgerpro"] [data-tresor-uebernehmen]');
await page.waitForFunction(() => window.__probe.getRoute() === 'documents');
const mk = await page.evaluate(() => window.__log.filter((x) => x[0] === 'markieren').map((x) => x[1]));
ok('Übernehmen: Datei gelesen, Marke gesetzt, weiter zu den Belegen (Teilen-Weg)', mk.length === 1 && mk[0].fach === 'eingang-bookledgerpro' && await page.evaluate(() => window.__log.some((x) => x[0] === 'lesenOeffnen')));
ok('… die Datei im Eingang bleibt (nichts gelöscht)', await page.evaluate(() => window.__fach.faecher['eingang-bookledgerpro'].length === 1));
await page.evaluate(() => window.__probe.neu());
await warte(page, '[data-tresor-fach]');
ok('… und steht jetzt als „übernommen“ da', await page.evaluate(() => !!document.querySelector('[data-tresor-fach="eingang-bookledgerpro"] [data-tresor-uebernommen]')));
// Einspielen: Datensatz löschen, älteste Sicherung einspielen (ergänzen) → wieder da
await page.evaluate(() => window.__probe.recDel('probe-1'));
ok('Ausgangslage: Datensatz gelöscht', await page.evaluate(async () => !(await window.__probe.recGet('probe-1'))));
await page.click('[data-tresor-fach="bookledgerpro"]  summary');
const knopfe = await page.$$('[data-tresor-fach="bookledgerpro"] [data-tresor-einspielen]');
await knopfe[knopfe.length - 1].click();
await page.waitForFunction(() => /Eingespielt/.test(document.querySelector('[data-tresor-meldung]')?.textContent || ''));
ok('Einspielen (ergänzen) bringt den gelöschten Datensatz zurück', await page.evaluate(async () => !!(await window.__probe.recGet('probe-1'))));

console.log('— A5. Schrift bei 320 px und 200 % —');
for (const [breite, zoom] of [[320, 1], [320, 2], [412, 2], [1366, 1]]) {
  await page.setViewportSize({ width: breite, height: 800 });
  await page.evaluate((z) => { document.documentElement.style.fontSize = (16 * z) + 'px'; return window.__probe.neu(); }, zoom);
  await warte(page, '[data-tresor-fach]');
  const m = await page.evaluate(() => {
    const raus = [...document.querySelectorAll('[data-tresorordner] button, [data-tresorordner] summary, [data-tresorordner] strong')]
      .filter((x) => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((x) => x.textContent.trim().slice(0, 30));
    return { raus, quer: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  });
  ok(`${breite} px · ${zoom * 100} %: keine Beschriftung abgeschnitten oder übergelaufen, kein Querlaufen`, !m.raus.length && !m.quer, JSON.stringify(m));
}
await page.setViewportSize({ width: 1280, height: 800 });
await page.evaluate(() => { document.documentElement.style.fontSize = ''; return window.__probe.neu(); });
await warte(page, '[data-tresor-sperren]');

console.log('— E. Sperren —');
await page.click('[data-tresor-sperren]');
await warte(page, '[data-tresor-entsperren]');
ok('gesperrt: keine Fächer mehr sichtbar, „Entsperren“ und „Passwort vergessen?“', await page.evaluate(() => !document.querySelector('[data-tresor-fach]') && !!document.querySelector('[data-tresor-teile]')));
ok('keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
const alle = await page.evaluate(() => JSON.stringify(window.__log));
ok('kein Aufruf an die Brücke trägt ein Passwort', !/pass|kennwort/i.test(alle));

await schluss();
