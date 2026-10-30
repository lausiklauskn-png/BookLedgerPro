// tests/smoke_befunde10.mjs — Klaus' Befunde 2026-10-30 (Pro-Umbau 10), Gerüst wie smoke_befunde9 (pwa · app · win):
//   A kein Seitentitel im Kopf · B ein ⓘ je Kasten, ein Tipp öffnet alle Sätze · C Neue Buchung: ⓘ wirkt, §13b-Hinweis nicht dahinter
//   D Anlagen: Seitensatz im Kasten „Anlage erfassen“ · E SBKIM-Suche: Mikrofon und Sprache im Feld · F Einstellungen ohne „null“ · G Seite ohne Kasten: Satz sichtbar
// Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
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

const BRUECKE = (plattform) => `
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
  const SP = { zuhoeren: async () => ({ text: '' }) };
  const U = { pruefen: async () => ({ version: '0.1.3' }), installieren: async () => ({}), addListener: () => ({ remove() {} }) };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => '${plattform}', Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H, BlpUpdates: U, BlpSpeech: SP } };
})();`;

const PROBE = (art) => { const app = art !== 'pwa'; return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>' + BRUECKE(art === 'win' ? 'windows' : 'android') + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
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
</script></body></html>`; };

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const probeArt = { '/__app.html': 'app', '/__pwa.html': 'pwa', '/__win.html': 'win' }[pfad];
  if (probeArt) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PROBE(probeArt)); }
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
// „win“ = dieselbe App in der Windows-Hülle (getPlatform() = 'windows', Pro-Umbau 10): ⓘ, Schrift und Version im Kopf gelten dort ebenso.
const arten = ['pwa', ...(existsSync(join(WURZEL, 'native/blp-native.js')) ? ['app', 'win'] : [])];

for (const art of arten) for (const b of [1000, 400]) {
  const { ctx, page, fehler } = await oeffnen(art, b, 800);
  const keys = (await page.evaluate(() => window.__probe.NAV_KEYS)).filter((k) => k !== 'calculate' && k !== 'needs');
  const kopfFunde = [], kastenFunde = [];
  for (const k of keys) {
    await page.evaluate((k) => window.__probe.navigate(k), k); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const kt = document.querySelector('[data-kopf-titel]'); const kopf = kt && (kt.textContent.trim() || kt.getBoundingClientRect().width > 0);
      const viele = [...document.querySelectorAll('#content .card')].filter((c) => [...c.querySelectorAll('.erklaer-knopf')].filter((x) => x.closest('.card') === c && x.getClientRects().length).length > 1).map((c) => (c.textContent || '').trim().slice(0, 24));
      return { kopf: !!kopf, viele };
    });
    if (r.kopf) kopfFunde.push(k); if (r.viele.length) kastenFunde.push(k + ': ' + r.viele.join(' / '));
  }
  ok(`${art} ${b} px A: in keiner Ansicht ein Seitentitel im Kopf (${keys.length} Ansichten)`, kopfFunde.length === 0, kopfFunde.join(', '));
  ok(`${art} ${b} px B: in keinem Kasten mehr als ein ⓘ`, kastenFunde.length === 0, kastenFunde.join(' || '));

  await page.evaluate(() => window.__probe.navigate('journal')); await page.waitForTimeout(400);
  const nb = await page.evaluate(() => { const c = document.querySelector('.buchung-form.card'); const k = c && c.querySelector('.erklaer-knopf'); if (!k) return null;
    const saetze = k._saetze; const vorher = saetze.filter((p) => p.getClientRects().length).length; k.click();
    const offen = saetze.filter((p) => p.getClientRects().length).length; k.click(); const danach = saetze.filter((p) => p.getClientRects().length).length;
    const seite = saetze.some((p) => /GoBD/.test(p.textContent)), notiz = saetze.some((p) => /Tippgeber/.test(p.textContent));
    return { anzahl: saetze.length, vorher, offen, danach, seite, notiz }; });
  ok(`${art} ${b} px C: „Neue Buchung“ hat ein ⓘ, ein Tipp zeigt alle Sätze (Seite + Notiz), zweiter Tipp schließt`, !!nb && nb.anzahl >= 3 && nb.vorher === 0 && nb.offen === nb.anzahl && nb.danach === 0 && nb.seite && nb.notiz, JSON.stringify(nb));
  const rc = await page.evaluate(async () => { const c = document.querySelector('.buchung-form.card'); const p = [...c.querySelectorAll('p')].find((x) => /13b/.test(x.textContent));
    const hinter = !!p && !!p.dataset.erklaer; const sel = [...c.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === 'inland'));
    if (!sel) return { hinter, sel: false }; const o = [...sel.options].find((o) => o.value !== 'inland'); sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 100)); return { hinter, sel: true, sichtbar: !!p && p.getClientRects().length > 0 }; });
  ok(`${art} ${b} px C: der §13b-Hinweis liegt nicht hinter dem ⓘ und erscheint bei Steuerschuldumkehr`, rc.sel && !rc.hinter && rc.sichtbar, JSON.stringify(rc));

  await page.evaluate(() => window.__probe.navigate('anlagen')); await page.waitForTimeout(400);
  const an = await page.evaluate(() => { const p = [...document.querySelectorAll('#content p')].find((x) => /Wirtschaftsgüter erfassen/.test(x.textContent)); const c = p && p.closest('.card');
    const titel = c && c.querySelector('h2, h3'); return { imKasten: !!c, titel: titel ? titel.textContent.trim() : '', ein: c ? c.querySelectorAll('.erklaer-knopf').length : 0 }; });
  ok(`${art} ${b} px D: Anlagen — der Seitensatz steht im Kasten „Anlage erfassen“, ein ⓘ`, an.imKasten && /Anlage erfassen/.test(an.titel) && an.ein === 1, JSON.stringify(an));

  await page.evaluate(() => window.__probe.navigate('sbkimsuche')); await page.waitForTimeout(500);
  const sb = await page.evaluate(() => { const f = document.querySelector('#content input.beleg-text'); const h = f && f.closest('[data-mikro-huelle]');
    const mik = h && h.querySelector('.mikro'); const fr = f && f.getBoundingClientRect(), mr = mik && mik.getBoundingClientRect();
    return { huelle: !!h, imFeld: !!mr && mr.top >= fr.top - 1 && mr.bottom <= fr.bottom + 1 && mr.right <= fr.right + 1, sprachmarke: !!(mik && /DE/.test(mik.textContent)), eigeneZeile: !!document.querySelector('#content .speech-row, #content .speech-block') }; });
  ok(`${art} ${b} px E: SBKIM-Suche — Mikrofon und „DE“ im Suchfeld, keine eigene Sprach-Zeile`, sb.huelle && sb.imFeld && sb.sprachmarke && !sb.eigeneZeile, JSON.stringify(sb));

  await page.evaluate(() => window.__probe.navigate('settings')); await page.waitForTimeout(500);
  ok(`${art} ${b} px F: Einstellungen ohne das Wort „null“`, await page.evaluate(() => !/(^|\s)null(\s|$)/.test(document.querySelector('#content').innerText)));

  await page.evaluate(() => window.__probe.navigate('shopbuchung')); await page.waitForTimeout(400);
  const sh = await page.evaluate(() => { const p = document.querySelector('#content section.view > p'); return { sichtbar: !!p && p.getClientRects().length > 0, allein: !!document.querySelector('#content section.view > .erklaer-knopf') }; });
  ok(`${art} ${b} px G: Seite ohne Kasten (Shop-Buchung) — Satz sichtbar, kein ⓘ allein`, sh.sichtbar && !sh.allein, JSON.stringify(sh));
  ok(`${art} ${b} px: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
await schluss();
