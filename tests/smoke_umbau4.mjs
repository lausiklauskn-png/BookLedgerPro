// tests/smoke_umbau4.mjs — Pro-Umbau 4 (Klaus 2026-10-28): keine Emojis in irgendeiner Ansicht, Hintergrundaufgabe beim
// Einordnen, „An Pro-App geben …“ in der Knopfzeile der Belegliste.
//
//   node tests/smoke_umbau4.mjs        (Chromium + playwright/playwright-core aus der Umgebung)
//
// Echt: Shell, Tresor der App, strich.js, documents.js, native/blp-native.js, native/pro-hintergrund.js. GESTELLT: die
// Android-Brücken (BlpTresor, BlpFiles, ProHintergrund) wie in smoke_ohne_web. Emoji = \p{Extended_Pictographic} ohne
// ↗©™®↔↕↺↻ (dieselbe Regel wie der Wächter in Private Brain Pro). Ausgenommen: die byte-1:1 kopierten SBKIM-Fenster und die
// eingebetteten Apps (apps/). Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.

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
  window.Capacitor = { isNativePlatform: () => true, Plugins: { BlpTresor: T, BlpFiles: F, ProHintergrund: H } };
})();`;

const PROBE = (app) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css">
${app ? '<link rel="stylesheet" href="./native/pro-bedienung.css"><script src="./native/pro-bedienung.js"></script><script src="./native/pro-hintergrund.js"></script><script>' + BRUECKE + '</script><script src="./native/blp-native.js"></script>' : ''}</head>
<body><div id="app-root"></div><script type="module">
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
for (let i = 1; i <= 3; i++) { const b = await saveBeleg(new File([new TextEncoder().encode('%PDF-1.4 probe ' + i)], 'Rechnung-' + i + '.pdf', { type: 'application/pdf' })); await setBelegText(b.id, 'Rechnung Nr. ' + i + ' Büromiete Oktober 2026, 890,00 EUR'); }
// Gestelltes Modell (wie smoke_belegsuche): langsam genug, dass der Abbruch aus der Mitteilung zwischen zwei Belegen ankommt.
const vec = (s) => { const v = new Float32Array(8); for (const c of String(s)) v[c.charCodeAt(0) % 8] += 1; const n = Math.hypot(...v) || 1; return Array.from(v, (x) => x / n); };
window.__blpEmbedderStub = { embedQuery: async (s) => vec(s), embedPassage: async (s) => { await new Promise((r) => setTimeout(r, window.__langsam || 0)); return vec(s); } };
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
const oeffnen = async (art, breite = 1280) => { const ctx = await browser.newContext({ viewport: { width: breite, height: 900 } }); const page = await ctx.newPage(); const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(BASIS + '/__' + art + '.html'); await page.waitForFunction(() => window.__probeBereit === true, null, { timeout: 30000 }); await page.waitForTimeout(400); return { ctx, page, fehler }; };

const klick = (page, sel) => page.click(sel, { timeout: 4000 }).catch(() => { rot++; console.log('  ✗ ROT: Knopf fehlt — ' + sel); });
console.log('— A. Keine Emojis in irgendeiner Ansicht (Leitfaden § 5) —');
for (const art of ['pwa', ...(existsSync(join(WURZEL, 'native/blp-native.js')) ? ['app'] : [])]) {
  const { ctx, page, fehler } = await oeffnen(art);
  const f = await rundgang(page);
  ok(art + ': jede Ansicht der Seitenleiste ohne sichtbares Emoji (auch title/aria-label/placeholder)', Object.keys(f).length === 0, JSON.stringify(f, null, 1).slice(0, 1500));
  // Gegenprobe im selben Lauf: ein Emoji, das die Schicht nicht anfassen darf ([data-kein-strich]), sieht die Probe —
  // sonst wäre sie blind; ein neues Emoji ohne Marke ersetzt der Beobachter sofort durch ein Strichsymbol.
  const g = await page.evaluate(async () => {
    const c = document.querySelector('#content');
    const a = document.createElement('p'); a.dataset.kein = ''; a.setAttribute('data-kein-strich', ''); a.textContent = '📷 Probe'; c.prepend(a);
    const b = document.createElement('p'); b.dataset.mit = ''; b.textContent = '📷 Scannen 🦄 Einhorn'; b.title = '🧠 Bedeutung'; c.prepend(b);
    await new Promise((r) => setTimeout(r, 60));
    return { mit: b.textContent, svg: b.querySelectorAll('svg use[href="#blp-kamera"]').length, titel: b.title };
  });
  const sieht = await emojis(page);
  ok(art + ': Gegenprobe — die Probe sieht ein geschütztes Emoji', sieht.some((s) => s.includes('📷 Probe')), JSON.stringify(sieht));
  ok(art + ': neues Emoji → Strichsymbol, unbekanntes fällt weg, title ohne Emoji', g.svg === 1 && g.mit === ' Scannen Einhorn' && g.titel === 'Bedeutung', JSON.stringify(g));
  ok(art + ': keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

if (existsSync(join(WURZEL, 'native/blp-native.js'))) {
console.log('— B. Einordnen als Hintergrundaufgabe (Leitfaden § 3) —');
{
  const { ctx, page, fehler } = await oeffnen('app');
  await page.evaluate(() => window.__probe.updateSettings({ bedeutungssuche: 'an' }));
  await page.evaluate(() => window.__probe.navigate('documents'));
  await page.waitForSelector('[data-einordnen]', { timeout: 15000 }).catch(() => {});
  ok('vor dem Tipp: keine Hintergrundaufgabe (nichts startet von selbst)', await page.evaluate(() => !window.__log.some((x) => x[0] === 'h.beginnen')));
  await klick(page, '[data-einordnen]');
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'h.ende'), null, { timeout: 15000 }).catch(() => {});
  const l = await page.evaluate(() => window.__log.filter((x) => x[0].startsWith('h.')).map((x) => [x[0], x[1].titel || x[1].text || '', x[1].n || 0]));
  const b = l.find((x) => x[0] === 'h.beginnen');
  ok('„Einordnen“ meldet eine Aufgabe mit Titel an', !!b && /eingeordnet/.test(b[1]), JSON.stringify(l));
  ok('Stand je Beleg („… von 3“) geht an die Mitteilung', l.some((x) => x[0] === 'h.stand' && /von 3/.test(x[1]) && x[2] === 3), JSON.stringify(l));
  ok('am Ende genau ein „ende“', l.filter((x) => x[0] === 'h.ende').length === 1);
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await oeffnen('app');
  await page.evaluate(() => { window.__langsam = 600; return window.__probe.updateSettings({ bedeutungssuche: 'an' }); });
  await page.evaluate(() => window.__probe.navigate('documents'));
  await page.waitForSelector('[data-einordnen]', { timeout: 15000 }).catch(() => {});
  await klick(page, '[data-einordnen]');
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'h.beginnen'), null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.__mitteilungAbbruch());
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'h.ende'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(200);
  const z = await page.evaluate(() => ({ text: document.querySelector('[data-bedeutung-zustand]')?.textContent || '', knopf: !!document.querySelector('[data-einordnen]') }));
  ok('„Abbrechen“ in der Mitteilung hält an, sagt es und bietet „Einordnen“ wieder an', /angehalten/.test(z.text) && z.knopf, JSON.stringify(z));
  await ctx.close();
}
}

console.log('— C. „An Pro-App geben …“ in der Knopfzeile (Leitfaden § 5) —');
{
  const { ctx, page, fehler } = await oeffnen('pwa', 360);
  await page.evaluate(() => { window.__geteilt = []; navigator.canShare = () => true; navigator.share = async (d) => { window.__geteilt.push(d.files.map((f) => f.name)); }; });
  await page.evaluate(() => window.__probe.navigate('documents'));
  await page.waitForSelector('[data-geben]').catch(() => {});
  const k = await page.evaluate(() => { const b = document.querySelector('[data-geben]'); if (!b) return { fehlt: true }; const r = b.getBoundingClientRect(); return { titel: b.title, hoehe: r.height, sichtbar: !!b.checkVisibility?.(), imMenue: !!b.closest('details'), breit: document.documentElement.scrollWidth <= innerWidth }; });
  ok('PWA: Knopf sichtbar in der Zeile (nicht im ⋯), ehrlich „Teilen …“, flach, 360 px ohne Querlaufen', k.sichtbar && !k.imMenue && k.titel === 'Teilen …' && k.hoehe <= 32 && k.breit, JSON.stringify(k));
  await klick(page, '[data-geben]');
  await page.waitForFunction(() => window.__geteilt.length === 1, null, { timeout: 5000 }).catch(() => {});
  ok('PWA: Tipp teilt die Datei des Belegs (Web Share), kein Tresor-Dialog', await page.evaluate(() => window.__geteilt.length === 1 && /^Rechnung-\d\.pdf$/.test(window.__geteilt[0][0]) && !document.querySelector('[data-geben-auswahl]')), await page.evaluate(() => JSON.stringify(window.__geteilt)));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}
if (existsSync(join(WURZEL, 'native/blp-native.js'))) {
  const { ctx, page, fehler } = await oeffnen('app');
  await page.evaluate(() => { window.__geteilt = []; navigator.canShare = () => true; navigator.share = async (d) => { window.__geteilt.push(d.files.map((f) => f.name)); }; window.alert = (m) => { window.__alerts = (window.__alerts || []).concat(m); }; });
  await page.evaluate(() => window.__probe.navigate('documents'));
  await page.waitForSelector('[data-geben]').catch(() => {});
  ok('App: Knopf „An Pro-App geben …“ sichtbar in der Zeile, mit Namen', await page.evaluate(() => { const b = document.querySelector('[data-geben]'); return !!b && b.title === 'An Pro-App geben …' && b.textContent.includes('An Pro-App geben') && !b.closest('details') && b.checkVisibility(); }));
  await klick(page, '[data-geben]');
  await page.waitForSelector('[data-geben-auswahl]').catch(() => {});
  const a = await page.evaluate(() => ({ ziele: [...document.querySelectorAll('[data-geben-auswahl] .btn-primary')].map((b) => b.textContent), normal: !!document.querySelector('[data-geben-normal]'), grenze: document.querySelector('[data-geben-grenze]')?.textContent || '' }));
  ok('Auswahl: Workflow PDF Pro (Eingangsfach), „Normal teilen“ eigener Knopf, Grenze Private Brain genannt', a.ziele.join() === 'Workflow PDF Pro' && a.normal && /Private Brain Pro/.test(a.grenze), JSON.stringify(a));
  await klick(page, '[data-geben-workflow-pdf-pro]');
  await page.waitForSelector('[data-geben-gesperrt]').catch(() => {});
  ok('Tresor gesperrt: fragt „Entsperren oder normal teilen?“ — nichts abgelegt, nichts geteilt', await page.evaluate(() => !window.__log.some((x) => x[0] === 'ablegenBeginnen') && window.__geteilt.length === 0));
  await klick(page, '[data-geben-entsperren]');
  await page.waitForFunction(() => window.__log.some((x) => x[0] === 'ablegenFertig'), null, { timeout: 5000 }).catch(() => {});
  const ab = await page.evaluate(() => window.__log.filter((x) => x[0] === 'ablegenBeginnen').map((x) => x[1]));
  ok('nach „Entsperren“: Beleg liegt im Fach eingang-workflowpdf (eigener Name), Meldung nennt Fach', ab.length === 1 && ab[0].fach === 'eingang-workflowpdf' && /\.pdf$/.test(ab[0].name) && /Eingang-WorkflowPDF/.test((await page.evaluate(() => (window.__alerts || []).join(' ')))), JSON.stringify(ab));
  // Gesperrt → „Normal teilen“ geht den Teilen-Weg, ausdrücklich gewählt
  await page.evaluate(async () => { await window.Capacitor.Plugins.BlpTresor.sperren({}); });
  await klick(page, '[data-geben]'); await page.waitForSelector('[data-geben-auswahl]').catch(() => {});
  await klick(page, '[data-geben-workflow-pdf-pro]'); await page.waitForSelector('[data-geben-gesperrt]').catch(() => {});
  await klick(page, '[data-geben-gesperrt] [data-geben-normal]');
  await page.waitForFunction(() => window.__geteilt.length === 1, null, { timeout: 5000 }).catch(() => {});
  ok('gesperrt + „Normal teilen“: Android-Teilen, kein Ablegen', await page.evaluate(() => window.__geteilt.length === 1 && window.__log.filter((x) => x[0] === 'ablegenBeginnen').length === 1));
  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
}

await schluss();
