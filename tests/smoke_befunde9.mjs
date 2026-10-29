// tests/smoke_befunde9.mjs — Klaus' Befunde 2026-10-29 spät (Pro-Umbau 9):
//   A · ⓘ steht hinter der Beschriftung („hinter Modus … Alle Einstellungen zeigen … Erscheinungsbild“), nie auf eigener Zeile, nie zwei.
//   B · Schriftgröße: alle Schrift wächst mit „A··A“, die Knöpfe nicht (Höhe ≤ 32 px bei 150 %).
//   C · App: Versionsnummer unter dem Namen im Kopf = Update-Link; „Auf Updates prüfen“ auch in den Einstellungen und bei „Weiteres“.
// Gerüst wie smoke_befunde8. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
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
  const SP = { zuhoeren: async () => ({ text: '' }) };
  const U = { pruefen: async () => ({ version: '0.1.3' }), installieren: async () => ({}), addListener: () => ({ remove() {} }) };
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H, BlpUpdates: U, BlpSpeech: SP } };
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

// Ein ⓘ ist „allein“, wenn in seiner Zeile kein Text seines Elternteils steht (es also eine eigene Zeile erzeugt).
const erklaerLage = (page) => page.evaluate(() => {
  const aus = [];
  for (const k of document.querySelectorAll('#content .erklaer-knopf')) {
    if (!k.getClientRects().length || k.closest('.titel-im-kopf')) continue;
    const eltern = k.parentElement, r = k.getBoundingClientRect();
    const text = [...eltern.childNodes].filter((n) => n !== k && !(n.classList && n.classList.contains('erklaer-knopf'))).map((n) => n.textContent).join('').trim();
    let nebenText = false;
    if (text) { const rng = document.createRange(); rng.selectNodeContents(eltern); for (const q of rng.getClientRects()) if (q.width > 2 && q.right <= r.left + 1 && q.bottom > r.top && q.top < r.bottom) nebenText = true; }
    if (!text || !nebenText) aus.push((eltern.className || eltern.tagName) + ' «' + text.slice(0, 30) + '»');
  }
  const doppelt = [...document.querySelectorAll('#content *')].filter((e) => [...e.children].filter((c) => c.classList.contains('erklaer-knopf')).length > 1).length;
  return { allein: aus, doppelt, anzahl: document.querySelectorAll('#content .erklaer-knopf').length };
});

console.log('— A. ⓘ hinter der Beschriftung, in jeder Ansicht —');
for (const art of arten) for (const b of [1000, 640, 400]) {
  const { ctx, page, fehler } = await oeffnen(art, b);
  // „Alle Einstellungen zeigen“ gibt es nur, wenn der Modus etwas ausblendet (Privat).
  await page.evaluate(async () => { await window.__probe.updateSettings({ nutzungsmodus: 'privat', alleEinstellungen: false }); window.__probe.navigate('dashboard'); window.__probe.navigate('settings'); }); await page.waitForTimeout(600);
  const ein = await page.evaluate(() => {
    const label = (txt) => [...document.querySelectorAll('#content .setting-label')].find((l) => l.firstChild && l.firstChild.textContent.trim() === txt);
    return ['Modus', 'Alle Einstellungen zeigen', 'Helligkeit'].map((w) => { const l = label(w); return [w, !!l && !!l.querySelector(':scope > .erklaer-knopf')]; });
  });
  for (const [w, da] of ein) ok(`${art} ${b} px: ⓘ steht hinter „${w}“`, da);
  const s = await erklaerLage(page);
  await page.evaluate(async () => { await window.__probe.updateSettings({ nutzungsmodus: 'berater', alleEinstellungen: true }); window.__probe.navigate('dashboard'); window.__probe.navigate('settings'); }); await page.waitForTimeout(600);
  const s2 = await erklaerLage(page); s.allein.push(...s2.allein); s.doppelt += s2.doppelt;
  ok(`${art} ${b} px Einstellungen: kein ⓘ auf eigener Zeile (${s.anzahl} ⓘ)`, s.allein.length === 0, s.allein.join(' | '));
  ok(`${art} ${b} px Einstellungen: nie zwei ⓘ an einer Beschriftung`, s.doppelt === 0);
  // Tipp: der Satz geht auf und zu, die Zeile davor bleibt.
  const tipp = await page.evaluate(() => { const k = [...document.querySelectorAll('#content .setting-label > .erklaer-knopf')][0]; const p = k._saetze[0];
    const vorher = p.hidden; k.click(); const auf = !p.hidden; k.click(); return vorher && auf && p.hidden; });
  ok(`${art} ${b} px: Tipp aufs ⓘ öffnet den Satz und schließt ihn wieder`, tipp);
  if (b === 1000) {
    const keys = await page.evaluate(() => window.__probe.NAV_KEYS);
    const funde = [];
    for (const k of keys) {
      if (k === 'calculate' || k === 'needs') continue;
      await page.evaluate((k) => window.__probe.navigate(k), k); await page.waitForTimeout(350);
      const l = await erklaerLage(page);
      if (l.allein.length || l.doppelt) funde.push(k + ': ' + l.allein.join(', ') + (l.doppelt ? ' doppelt ' + l.doppelt : ''));
    }
    await page.evaluate(() => window.__probe.navigate('kassenbuch')); await page.waitForTimeout(400);
    const kopf = await page.evaluate(() => { const k = document.querySelector('[data-kopf-titel] .erklaer-knopf'); if (!k) return null; const h = document.querySelector('#content h1 > .erklaer-knopf'); const p = h && h._saetze[0];
      const r = k.getBoundingClientRect(), t = document.querySelector('[data-kopf-titel] .kopf-titel-text').getBoundingClientRect(); const neben = Math.abs(r.top + r.height / 2 - (t.top + t.height / 2)) < 6 && r.left >= t.right - 1;
      const zu = p.hidden; k.click(); const auf = !p.hidden; k.click(); return { neben, wechselt: zu && auf && p.hidden }; });
    ok(`${art} ${b} px: Satz unter dem Seitentitel → ⓘ hinter dem Titel im Kopf, Tipp öffnet und schließt`, !!kopf && kopf.neben && kopf.wechselt, JSON.stringify(kopf));
    ok(`${art} ${b} px: in keiner Ansicht ein ⓘ auf eigener Zeile`, funde.length === 0, funde.join(' || '));
  }
  ok(`${art} ${b} px: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

console.log('— D. Belege: offene Bereiche ohne ⓘ-Zeile; Mikrofon und DE im Suchfeld; Kästchen links —');
for (const art of arten) for (const b of [1000, 640, 400]) {
  const { ctx, page, fehler } = await oeffnen(art, b);
  for (const w of ['text', 'erechnung', 'bank']) await page.evaluate((w) => { const k = document.querySelector('[data-werkzeug="' + w + '"]'); if (k) k.click(); }, w);
  await page.waitForTimeout(400); await page.keyboard.press('Escape');
  const l = await erklaerLage(page);
  ok(`${art} ${b} px Belege mit offenen Bereichen: kein ⓘ auf eigener Zeile (${l.anzahl} ⓘ)`, l.allein.length === 0 && l.doppelt === 0, l.allein.join(' | '));
  const mik = await page.evaluate(() => { const f = document.querySelector('[data-belegsuche] input, .suche-feld input'); const m = document.querySelector('.suche-feld [data-mikro]');
    if (!f || !m) return { da: false }; const rf = f.getBoundingClientRect(), rm = m.getBoundingClientRect(), sp = m.querySelector('[data-mikro-sprache]').getBoundingClientRect();
    return { da: true, imFeld: rm.top >= rf.top - 1 && rm.bottom <= rf.bottom + 1 && rm.right <= rf.right + 1 && rm.left >= rf.left, deImFeld: sp.right <= rf.right + 1 && sp.top >= rf.top - 1,
      textFrei: parseFloat(getComputedStyle(f).paddingRight) >= rm.width - 2 }; });
  ok(`${art} ${b} px: Mikrofon und „DE“ sitzen im Suchfeld (keine eigene Zeile), der Text läuft nicht darunter`, mik.da && mik.imFeld && mik.deImFeld && mik.textFrei, JSON.stringify(mik));
  ok(`${art} ${b} px: keine Seitenfehler (Belege)`, fehler.length === 0, fehler.join(' | '));
  for (const [ansicht, sel] of [['customers', '.inline-field'], ['payables', '.inline-field']]) {
    await page.evaluate((k) => window.__probe.navigate(k), ansicht); await page.waitForTimeout(400);
    const k = await page.evaluate((sel) => { const lab = [...document.querySelectorAll('#content ' + sel)].find((x) => x.querySelector('input[type=checkbox]')); if (!lab) return null;
      const c = lab.querySelector('input[type=checkbox]').getBoundingClientRect(), t = lab.querySelector('span').getBoundingClientRect(), z = lab.parentElement.getBoundingClientRect(), r = lab.getBoundingClientRect();
      return { links: c.left - r.left < 4 && r.left - z.left < 40 || c.left - z.left < 20, textGleichDahinter: t.left - c.right < 14 && t.left > c.right - 1, eineZeile: Math.abs((c.top + c.bottom) / 2 - (t.top + t.bottom) / 2) < 8 }; }, sel);
    ok(`${art} ${b} px ${ansicht}: Kästchen links, Beschriftung gleich dahinter in einer Zeile`, !!k && k.links && k.textGleichDahinter && k.eineZeile, JSON.stringify(k));
  }
  await ctx.close();
}

console.log('— B. Schriftgröße: Schrift wächst, Knöpfe nicht —');
for (const art of arten) for (const b of [1000, 640]) {
  const { ctx, page } = await oeffnen(art, b);
  const mass = () => page.evaluate(() => {
    const groesse = (sel) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; };
    const hoch = [...document.querySelectorAll('.app-header .btn, .app-header .seg, #content .btn, #content .seg, .app-nav .nav-item')]
      .filter((e) => e.getClientRects().length && !e.closest('[hidden]') && e.getBoundingClientRect().width > 0)
      .filter((e) => { const cs = getComputedStyle(e); return cs.whiteSpace === 'nowrap' || e.querySelectorAll('br').length === 0; })
      .map((e) => ({ h: Math.round(e.getBoundingClientRect().height), t: (e.textContent || e.title || '').trim().slice(0, 24), zeilen: Math.round(e.getBoundingClientRect().height / (parseFloat(getComputedStyle(e).lineHeight) || 99)) }));
    return { knopf: groesse('#content .btn'), text: groesse('#content p') || groesse('#content'), nav: groesse('.app-nav .nav-item'), seg: groesse('#content .seg'), hoch };
  });
  await page.evaluate(() => window.__probe.navigate('settings')); await page.waitForTimeout(400);
  const a = await mass();
  await page.click('[data-schrift-knopf]'); await page.waitForSelector('[data-schrift-regler]');
  await page.evaluate(() => { const r = document.querySelector('[data-schrift-regler]'); r.value = '150'; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const g = await mass();
  const f = (x, y) => (x ? y / x : 0);
  ok(`${art} ${b} px: bei 150 % wächst die Schrift überall (Text, Knopf, Reiter, Leiste ×1,5)`, [f(a.text, g.text), f(a.knopf, g.knopf), f(a.seg, g.seg), f(a.nav, g.nav)].every((x) => x > 1.45 && x < 1.55), JSON.stringify({ a: [a.text, a.knopf, a.seg, a.nav], g: [g.text, g.knopf, g.seg, g.nav] }));
  const zuHoch = g.hoch.filter((x) => x.h > 32 && x.zeilen <= 1);
  ok(`${art} ${b} px: bei 150 % bleiben einzeilige Knöpfe ≤ 32 px hoch (${g.hoch.length} gemessen)`, zuHoch.length === 0, zuHoch.slice(0, 5).map((x) => x.t + ' ' + x.h).join(' | '));
  const normal = a.hoch.filter((x) => x.h > 32 && x.zeilen <= 1);
  ok(`${art} ${b} px: bei 100 % ebenso`, normal.length === 0, normal.slice(0, 5).map((x) => x.t + ' ' + x.h).join(' | '));
  await page.evaluate(() => { localStorage.removeItem('blpr_schrift'); document.documentElement.style.fontSize = ''; });
  await ctx.close();
}

console.log('— C. Version im Kopf als Update-Link, auch in den Einstellungen und bei „Weiteres“ —');
for (const art of arten) for (const b of [1000, 640, 400]) {
  const { ctx, page, fehler } = await oeffnen(art, b);
  await page.waitForTimeout(200);
  const kopf = await page.evaluate(() => { const v = document.querySelector('[data-kopf-version]'), n = document.querySelector('.brand-name');
    if (!v || v.hidden) return { da: false };
    const rv = v.getBoundingClientRect(), rn = n.getBoundingClientRect();
    return { da: true, text: v.textContent, unter: rv.top >= rn.bottom - 2, rechts: Math.abs(rv.right - rn.right) <= 2, sichtbar: rv.width > 0 && rv.right <= innerWidth };
  });
  if (art === 'pwa') { ok(`pwa ${b} px: keine Versionsnummer im Kopf (Updates kommen über Pages)`, !kopf.da); await ctx.close(); continue; }
  ok(`app ${b} px: „v0.1.1“ steht unter „BookLedgerPro“, rechtsbündig, im Bild`, kopf.da && kopf.text === 'v0.1.1' && kopf.unter && kopf.rechts && kopf.sichtbar, JSON.stringify(kopf));
  await page.click('[data-kopf-version]');
  await page.waitForFunction(() => /aktuelle Version 0\.1\.3/.test((document.querySelector('[data-update-popover] [data-update-status]') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
  const pop = await page.evaluate(() => { const p = document.querySelector('[data-update-popover]'); if (!p) return null; const r = p.getBoundingClientRect();
    return { text: p.textContent, imBild: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0, pruefen: window.__log.length >= 0 }; });
  ok(`app ${b} px: Tipp auf die Version öffnet das Fenster und prüft gleich (Version + Ergebnis)`, !!pop && /Version 0\.1\.1/.test(pop.text) && /aktuelle Version 0\.1\.3/.test(pop.text) && pop.imBild, JSON.stringify(pop));
  await page.keyboard.press('Escape');
  ok(`app ${b} px: Escape schließt das Fenster`, await page.evaluate(() => !document.querySelector('[data-update-popover]')));
  await page.evaluate(() => window.__probe.navigate('settings')); await page.waitForTimeout(400);
  const ein = await page.evaluate(() => { const z = document.querySelector('[data-einstellung-version]'); const alle = [...document.querySelectorAll('#content > section > *')];
    return { da: !!z && !!z.querySelector('[data-update-pruefen]') && /Version 0\.1\.1/.test(z.textContent), platz: z ? alle.indexOf(z) : -1 }; });
  ok(`app ${b} px: Einstellungen oben: „Version und Updates“ mit Version und „Auf Updates prüfen“`, ein.da && ein.platz >= 0 && ein.platz <= 3, JSON.stringify(ein));
  if (b >= 641) {
    const nav = await page.evaluate(() => { const k = document.querySelector('[data-nav-updates]'); const g = k && k.closest('.nav-gruppe'); return { da: !!k, gruppe: g ? g.querySelector('.nav-gruppe-titel').textContent : '' }; });
    ok(`app ${b} px: „Auf Updates prüfen“ in der Leiste bei „Weiteres“`, nav.da && nav.gruppe === 'Weiteres', JSON.stringify(nav));
    await page.click('[data-nav-updates]');
    await page.waitForFunction(() => /aktuelle Version/.test((document.querySelector('[data-update-popover] [data-update-status]') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
    ok(`app ${b} px: der Eintrag prüft gleich`, await page.evaluate(() => /aktuelle Version 0\.1\.3/.test(document.querySelector('[data-update-popover]')?.textContent || '')));
  }
  ok(`app ${b} px: keine Seitenfehler`, fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
console.log('— E. Eingang (Passwort, Deckblatt) unabhängig vom Farbthema —');
{ const farben = {};
  for (const [farbe, hell] of [['blau', 'light'], ['blau', 'dark'], ['graphit', 'light'], ['petrol', 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 900 } }); const page = await ctx.newPage();
    await page.goto(BASIS + '/__pwa.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 });
    await page.evaluate(async ([farbe, hell]) => { document.documentElement.setAttribute('data-farbe', farbe); document.documentElement.setAttribute('data-theme', hell);
      const { showLockScreen } = await import('./src/ui/lock.js'); const c = document.createElement('div'); document.body.replaceChildren(c); showLockScreen(c); }, [farbe, hell]);
    await page.waitForSelector('.lock-screen .btn-primary', { timeout: 8000 }).catch(() => {});
    farben[farbe + '/' + hell] = await page.evaluate(() => { const b = document.querySelector('.lock-screen .btn-primary'), k = document.querySelector('.lock-card'), s = document.querySelector('.lock-screen');
      return b ? [getComputedStyle(b).backgroundColor, getComputedStyle(k).backgroundColor, getComputedStyle(s).backgroundColor].join(' ') : 'fehlt'; });
    await ctx.close();
  }
  const werte = Object.values(farben);
  ok('Passwort-Seite sieht in allen Themen gleich aus (Petrol hell: grüner Knopf, weiße Karte)', werte.every((w) => w === werte[0]) && /rgb\(15, 118, 110\)/.test(werte[0]), JSON.stringify(farben));
}
await schluss();
