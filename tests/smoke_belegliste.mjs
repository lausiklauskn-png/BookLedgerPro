// tests/smoke_belegliste.mjs — Pro-Umbau 3 (Leitfaden § 1, § 3, § 5, Klaus 2026-10-28): Belegliste für Hunderte.
// Echter Browser, echter Tresor, 300 Belege + eine Mail mit zwei Anhängen. Misst: flache Zeilen (Höhe), Name gekürzt,
// Zustandssymbol statt Satz, ⋯-Menü mit den Knöpfen, Mail-Gruppe auf/zu + „Alle zu/auf“ (gemerkt), keine Emojis auf der
// Belegseite (Strichgrafiken), Bedeutungs-Schalter in der Zeile des Suchfelds, Einordnen NICHT von selbst beim Öffnen
// (Embedder gestellt, zählt Aufrufe) erst nach „Einordnen“, Leistengriff in halber Höhe. Gegenprobe-Hinweise im Text.
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
window.__einbett = 0;
window.__blpEmbedderStub = { embedQuery: async () => new Array(8).fill(0.35), embedPassage: async () => { window.__einbett++; return new Array(8).fill(0.35); } };
</script><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
import { saveBeleg, setBelegText, listBelege } from './src/domain/documents.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true, bedeutungssuche: 'an' });
const leer = new TextEncoder().encode('%PDF-1.4 probe');
const mail = await saveBeleg(new File([new TextEncoder().encode('From: a@b.example')], 'Mail 2026-10-26 Rechnung Oktober.eml', { type: 'message/rfc822' }), { mail: { von: 'Lieferant GmbH', betreff: 'Rechnung Oktober', anhaenge: 2 } });
const a1 = await saveBeleg(new File([leer], 'Rechnung-2026-117.pdf', { type: 'application/pdf' }), { mail: { von: 'Lieferant GmbH', betreff: 'Rechnung Oktober', mailId: mail.id } });
const a2 = await saveBeleg(new File([leer], 'Lieferschein-2026-117.pdf', { type: 'application/pdf' }), { mail: { von: 'Lieferant GmbH', betreff: 'Rechnung Oktober', mailId: mail.id } });
await setBelegText(a1.id, 'Rechnung 117 Bueromaterial 119,00 EUR');
for (let i = 0; i < 300; i++) await saveBeleg(new File([leer], 'Sehr langer Belegname mit Lieferant Musterfirma Handelsgesellschaft und Rechnungsnummer und Bestellnummer ' + String(i).padStart(3, '0') + ' Oktober 2026 Kopie.pdf', { type: 'application/pdf' }));
window.__p = { getSettings, updateSettings, navigate, listBelege, ids: { mail: mail.id, a1: a1.id, a2: a2.id }, shell: () => renderShell(document.getElementById('app'), {}) };
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
const warte = (fn, arg, ms = 10000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/__probe.html`);
  await page.waitForFunction(() => window.__bereit === true, null, { timeout: 120000 });
  await page.evaluate(() => window.__p.navigate('documents'));
  await warte(() => document.querySelectorAll('tbody tr[data-beleg-zeile]').length >= 303, null, 60000);
  const zahl = await page.evaluate(() => document.querySelectorAll('tbody tr[data-beleg-zeile]').length);
  ok('303 Belege als Zeilen (300 + Mail + 2 Anhänge)', zahl === 303, String(zahl));
  ok('Kopf nennt die Zahl', (await page.getAttribute('[data-belege-zahl]', 'data-belege-zahl')) === '303');
  // flach: eine Zeile je Beleg, ohne Unterzeilen höchstens 40 px
  const hoehen = await page.evaluate(() => [...document.querySelectorAll('tbody tr[data-beleg-zeile]')].filter((tr) => !tr.querySelector('.zeile-unter, [data-mail], [data-positionen]')).map((tr) => tr.getBoundingClientRect().height));
  const hoechste = Math.max(...hoehen);
  ok('flache Zeilen: höchstens 40 px je einfacher Beleg', hoehen.length >= 300 && hoechste <= 40, 'höchste ' + hoechste);
  const lang = await page.evaluate(() => { const n = [...document.querySelectorAll('.beleg-name')].find((x) => /Kopie/.test(x.textContent)); return n ? { gekuerzt: n.scrollWidth > n.clientWidth, einzeilig: n.getBoundingClientRect().height < 24, title: n.title } : null; });
  ok('langer Name einzeilig gekürzt, ganzer Name im title', lang && lang.gekuerzt && lang.einzeilig && /Kopie\.pdf/.test(lang.title), JSON.stringify(lang));
  // Zustandssymbol statt Satz
  const zustand = await page.evaluate((id) => { const k = document.querySelector(`[data-beleg-id="${id}"] [data-pruefung]`); return k ? { stand: k.dataset.pruefung, text: k.textContent.trim(), title: k.title, svg: !!k.querySelector('svg use') } : null; }, await page.evaluate(() => window.__p.ids.a1));
  ok('Prüfung als kleines Symbol, Satz im title', zustand && zustand.stand === 'offen' && zustand.text === '' && zustand.svg && /geprüft/i.test(zustand.title), JSON.stringify(zustand));
  // ⋯-Menü
  const a1 = await page.evaluate(() => window.__p.ids.a1);
  const zu = await page.evaluate((id) => { const tr = document.querySelector(`[data-beleg-id="${id}"]`).closest('tr'); const m = tr.querySelector('[data-zeilen-menue]'); return { menue: !!m, offen: m && m.open, knopfSichtbar: !!tr.querySelector('[data-texterkennung]') && tr.querySelector('[data-texterkennung]').checkVisibility() }; }, a1);
  ok('Knöpfe einer Zeile im ⋯-Menü (zu: Texterkennung nicht sichtbar)', zu.menue && !zu.offen && !zu.knopfSichtbar, JSON.stringify(zu));
  await page.click(`tr:has([data-beleg-id="${a1}"]) [data-zeilen-menue] > summary`);
  const auf = await page.evaluate((id) => { const tr = document.querySelector(`[data-beleg-id="${id}"]`).closest('tr'); const t = tr.querySelector('[data-texterkennung]'); const r = t && t.getBoundingClientRect(); return { sichtbar: !!r && r.width > 0 && t.checkVisibility(), imFenster: !!r && r.right <= innerWidth && r.left >= 0, info: tr.querySelector('[data-menue-info]')?.textContent || '' }; }, a1);
  ok('⋯ öffnet: Texterkennung sichtbar und im Fenster, Aufbewahrung steht im Menü', auf.sichtbar && auf.imFenster && /Aufbewahr|Keep/i.test(auf.info), JSON.stringify(auf));
  await page.mouse.click(5, 5);
  ok('Tipp daneben schließt das Menü', await page.evaluate((id) => !document.querySelector(`[data-beleg-id="${id}"]`).closest('tr').querySelector('[data-zeilen-menue]').open, a1));
  // Mail-Gruppe
  const mailId = await page.evaluate(() => window.__p.ids.mail);
  const g = await page.evaluate((m) => { const rows = [...document.querySelectorAll('tbody tr[data-beleg-zeile]')]; const i = rows.findIndex((r) => r.dataset.belegZeile === m); return { klapp: !!rows[i].querySelector(`[data-gruppe-klapp="${m}"]`), naechste: [rows[i + 1]?.dataset.anhangVon, rows[i + 2]?.dataset.anhangVon], sichtbar: [rows[i + 1]?.hidden, rows[i + 2]?.hidden] }; }, mailId);
  ok('Mail ist eine Gruppe, die zwei Anhänge stehen direkt darunter (offen)', g.klapp && g.naechste.every((x) => x === mailId) && g.sichtbar.every((x) => x === false), JSON.stringify(g));
  await page.click(`[data-gruppe-klapp="${mailId}"]`);
  await warte((m) => [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].every((r) => r.hidden), mailId);
  ok('Tipp auf den Pfeil klappt die Anhänge zu', await page.evaluate((m) => [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].length === 2 && [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].every((r) => r.hidden), mailId));
  await page.evaluate(() => { window.__p.navigate('dashboard'); });
  await page.evaluate(() => window.__p.navigate('documents'));
  await warte(() => document.querySelectorAll('tbody tr[data-beleg-zeile]').length >= 303, null, 60000);
  ok('zu bleibt gemerkt (nach Wegnavigieren)', await page.evaluate((m) => [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].every((r) => r.hidden), mailId));
  await page.click('[data-gruppen-alle]');
  await warte((m) => [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].every((r) => !r.hidden), mailId);
  ok('„Alle auf“ öffnet wieder', await page.evaluate((m) => [...document.querySelectorAll(`[data-anhang-von="${m}"]`)].every((r) => !r.hidden), mailId));
  // Strichgrafiken statt Emojis auf der Belegseite
  const emo = await page.evaluate(() => { const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u; const out = []; const w = document.createTreeWalker(document.querySelector('.belege-ansicht'), NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { const e = n.parentElement; if (re.test(n.nodeValue) && e && e.getClientRects().length && !e.closest('input,textarea,[hidden],.mikro')) out.push(n.nodeValue.trim().slice(0, 40)); } return out; });
  ok('keine sichtbaren Emojis auf der Belegseite (Strichgrafiken)', emo.length === 0, emo.slice(0, 6).join(' | '));
  ok('… die Mail-Zeile trägt das Strichsymbol „Mail“', await page.evaluate((m) => !!document.querySelector(`tr[data-beleg-zeile="${m}"] [data-mail] use[href="#pb-mail"]`), mailId));
  // Bedeutungs-Schalter in der Zeile des Suchfelds
  const sch = await page.evaluate(() => { const i = document.querySelector('[data-belegsuche]').getBoundingClientRect(), s = document.querySelector('[data-bedeutung-schalter]'); const r = s.getBoundingClientRect(); return { rolle: s.getAttribute('role'), an: s.getAttribute('aria-checked'), gleicheZeile: Math.abs((r.top + r.height / 2) - (i.top + i.height / 2)) < 14, rechts: r.left >= i.right - 2, hoehe: r.height, i: [i.top, i.height], s: [r.top, r.height] }; });
  ok('Bedeutungs-Schalter steht rechts neben dem Suchfeld (eine Zeile), role=switch, an', sch.rolle === 'switch' && sch.an === 'true' && sch.gleicheZeile && sch.rechts && sch.hoehe <= 36, JSON.stringify(sch));
  // Einordnen nicht von selbst
  await page.waitForTimeout(1500);
  ok('Bedeutung an, aber beim Öffnen wird NICHT eingeordnet', (await page.evaluate(() => window.__einbett)) === 0);
  ok('… die Zeile sagt, was fehlt, und bietet „Einordnen“ an', !!(await page.$('[data-einordnen]')) && /noch nicht eingeordnet/.test(await page.textContent('[data-bedeutung-zustand]')), await page.textContent('[data-bedeutung-zustand]'));
  await page.click('[data-einordnen]');
  await warte(() => window.__blpBedeutung && window.__blpBedeutung.stand === 'bereit', null, 30000);
  ok('nach „Einordnen“: eingeordnet (Embedder gerufen), Zustand bereit', (await page.evaluate(() => window.__einbett)) > 0 && (await page.evaluate(() => window.__blpBedeutung.stand)) === 'bereit');
  // Leistengriff mittig
  const griff = await page.evaluate(() => { const k = document.querySelector('.nav-klapp'); const r = k.getBoundingClientRect(); const nav = document.querySelector('.app-nav').getBoundingClientRect(); return { mitte: Math.abs((r.top + r.height / 2) - innerHeight / 2), amRand: Math.abs((r.left + r.width / 2) - nav.right) < 4, sichtbar: r.width > 10 && r.height > 30, oben: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.nav-klapp') === k }; });
  ok('Leistengriff in halber Höhe am Rand der Leiste, sichtbar und obenauf', griff.mitte < 3 && griff.amRand && griff.sichtbar && griff.oben, JSON.stringify(griff));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  ok('… auch nach dem Rollen bis ans Ende', await page.evaluate(() => { const r = document.querySelector('.nav-klapp').getBoundingClientRect(); return Math.abs((r.top + r.height / 2) - innerHeight / 2) < 3; }));
  await page.click('.nav-klapp');
  const zuGriff = await page.evaluate(() => { const k = document.querySelector('.nav-klapp'); const r = k.getBoundingClientRect(); const nav = document.querySelector('.app-nav').getBoundingClientRect(); return { zu: document.querySelector('.app').classList.contains('nav-zu'), amRand: Math.abs((r.left + r.width / 2) - nav.right) < 4 }; });
  ok('eingeklappt: Griff wandert mit an den schmalen Rand', zuGriff.zu && zuGriff.amRand, JSON.stringify(zuGriff));
  await page.click('.nav-klapp');
  // Handy 360 px: kein Querlaufen der Liste
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(300);
  const quer = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok('360 px: kein Querlaufen (Liste passt)', quer <= 1, String(quer));
  ok('keine Skriptfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) {
  rot++; console.log('  ✗ ROT: Probe gestolpert — ' + (e && e.message || e) + '\n  Seitenfehler: ' + fehler.join(' | ').slice(0, 600));
} finally {
  await browser.close(); server.close();
}
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
