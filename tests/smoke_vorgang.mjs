// tests/smoke_vorgang.mjs — Rundlauf WorkFloh ⇄ BLP, R1 + R2 (Klaus 2026-10-26, D21): echter Browser, echter Tresor.
//   R1: angenommenes Angebot → „🛠 Als Auftrag an Mein WorkFloh" → Adresse ?vorgang=<base64url(v2)> mit Verweisen,
//       Ziel aus den Einstellungen (Tomys WorkFloh), Vermerk am Angebot.
//   R2: WorkFloh kommt mit ?uebernahme=<v1 + verweise.blpAngebotNr> zurück → KEIN neuer Entwurf, Banner, Auftragsnummer
//       am Angebot, „Rechnung aus Angebot" nennt den WorkFloh-Auftrag.
//   Aufruf: node tests/smoke_vorgang.mjs   (Chromium + playwright-core; fehlt eines → „nicht lauffähig", Rückgabe 2)
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
<body><div id="app"></div><script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, getSettings, updateSettings, navigate } from './src/state.js';
import { renderShell } from './src/ui/shell.js';
import { saveKunde } from './src/domain/crm-store.js';
import { saveAngebot, listAngebote, getAngebot } from './src/domain/angebote-store.js';
import { listBuchungen, festschreiben, getBuchung, ensureAccountsSeeded } from './src/domain/store.js';
import { neuesAngebot } from './src/domain/angebote.js';
await setupVault('probe-passwort-123');
await hydrateSettings();
await updateSettings({ nutzungsmodus: 'selbststaendig', einrichtungFertig: true, angeboteAlt: true });
const k = await saveKunde({ name: 'SV Blau-Weiß 09', email: 'post@svbw09.example', adresse: 'Sportplatz 1, 12345 Musterstadt', telefon: '0123 4567' });
const a = await saveAngebot({ ...neuesAngebot({ titel: 'Vereins-Tassen', kundeId: k.id, datum: '2026-10-26', nummer: 'AN-2026-0042',
  positionen: [{ beschreibung: 'Tasse 11oz bedruckt', menge: 10, einzelpreisCent: 1290, ustSatz: 19, kalkulation: { marge: 0.4 } }, { beschreibung: 'Versand', menge: 1, einzelpreisCent: 590, ustSatz: 19 }] }), status: 'angenommen' });
// ein zweites, NICHT angenommenes Angebot: es darf den Knopf nicht bekommen (Wächter gegen einen Knopf ohne Statusprüfung)
const o = await saveAngebot({ ...neuesAngebot({ titel: 'Offenes Angebot', kundeId: k.id, nummer: 'AN-2026-0043', positionen: [{ beschreibung: 'Schild', menge: 1, einzelpreisCent: 5000, ustSatz: 19 }] }), status: 'offen' });
await ensureAccountsSeeded();
window.__p = { getSettings, updateSettings, navigate, listAngebote, getAngebot, listBuchungen, festschreiben, getBuchung, ids: { k: k.id, a: a.id, o: o.id }, shell: () => renderShell(document.getElementById('app'), {}) };
window.__blpSprungAbfangen = true;
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
const fehler = [];
const dialoge = [];
let page;
const warte = (fn, arg, ms = 10000) => page.waitForFunction(fn, arg, { timeout: ms }).catch(() => null);
async function neueSeite(suche = '') {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => fehler.push(e.message));
  p.on('dialog', (d) => { dialoge.push({ type: d.type(), message: d.message() }); if (d.type() === 'prompt') d.accept('2026-10-27'); else d.accept(); });
  await p.goto(`http://127.0.0.1:${server.address().port}/__probe.html${suche}`);
  await p.waitForFunction(() => window.__bereit === true, null, { timeout: 30000 });
  return p;
}
const TITEL_PH = 'Titel';
const b64u = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uDec = (s) => JSON.parse(Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

try {
  // ───────────── R1: Angebot → Auftrag an WorkFloh ─────────────
  console.log('\nR1 · angenommenes Angebot → „Als Auftrag an WorkFloh"');
  page = await neueSeite();
  await page.evaluate(() => window.__p.navigate('angebote'));
  ok('der Knopf „🛠 Als Auftrag an Mein WorkFloh" steht am angenommenen Angebot (Vorgabe-Ziel)', !!(await warte(() => { const b = document.querySelector('[data-wf-auftrag]'); return b && /Mein WorkFloh/.test(b.textContent); })));
  await page.click('[data-wf-auftrag]');
  const v = await warte(() => window.__blpVorgang, null, 8000) ? await page.evaluate(() => window.__blpVorgang) : null;
  ok('der Sprung wird abgefangen und trägt Ziel + Adresse', !!v && v.ziel === 'mein-workfloh' && typeof v.url === 'string', JSON.stringify(v && { ziel: v.ziel, url: v.url && v.url.slice(0, 60) }));
  ok('Adresse: Mein WorkFloh unter github.io mit ?vorgang=', !!v && v.url.startsWith('https://lausiklauskn-png.github.io/Mein-WorkFloh/?vorgang='));
  const pl = v ? b64uDec(v.url.split('?vorgang=')[1]) : null;
  ok('Nutzlast v2: quelle bookledgerpro, art auftrag, Verweise auf AN-2026-0042 und die Angebots-Kennung', !!pl && pl.v === 2 && pl.quelle === 'bookledgerpro' && pl.art === 'auftrag' && pl.verweise.blpAngebotNr === 'AN-2026-0042' && !!pl.verweise.blpAngebotId, JSON.stringify(pl && pl.verweise));
  ok('… Titel, Kunde mit Adresse/E-Mail/Telefon, zwei Positionen mit Netto-Einzelpreis — keine Kalkulation', !!pl && pl.titel === 'Vereins-Tassen' && pl.kundeName === 'SV Blau-Weiß 09' && pl.kunde.email === 'post@svbw09.example' && pl.kunde.adresse.startsWith('Sportplatz') && pl.positionen.length === 2 && pl.positionen[0].einzelpreisCent === 1290 && JSON.stringify(pl).indexOf('marge') < 0, JSON.stringify(pl && pl.positionen));
  const rec = await page.evaluate(async () => window.__p.getAngebot(window.__p.ids.a));
  ok('am Angebot ist vermerkt: Ziel mein-workfloh, Zeitpunkt; Status bleibt angenommen', !!rec && rec.verweise && rec.verweise.wfZiel === 'mein-workfloh' && /^\d{4}-/.test(rec.verweise.wfUebergabeAm || '') && rec.status === 'angenommen', JSON.stringify(rec && rec.verweise));
  ok('die Zeile zeigt „→ an Mein WorkFloh übergeben"', !!(await warte(() => { const z = document.querySelector('[data-wf-verweis="uebergeben"]'); return z && /Mein WorkFloh/.test(z.textContent); })));
  // Ziel umstellen → Tomys WorkFloh
  await page.evaluate(async () => { await window.__p.updateSettings({ workflohZiel: 'tomy-workfloh' }); });
  await page.evaluate(() => window.__p.navigate('angebote'));
  ok('Einstellung „Tomys WorkFloh": der Knopf nennt das Ziel', !!(await warte(() => { const b = document.querySelector('[data-wf-auftrag]'); return b && /Tomys WorkFloh/.test(b.textContent); })));
  await page.evaluate(() => { window.__blpVorgang = null; });
  await page.click('[data-wf-auftrag]');
  const v2 = await warte(() => window.__blpVorgang, null, 8000) ? await page.evaluate(() => window.__blpVorgang) : null;
  ok('… und die Adresse geht an Tomys-Hub/workfloh/', !!v2 && v2.url.startsWith('https://lausiklauskn-png.github.io/Tomys-Hub/workfloh/?vorgang='), v2 && v2.url && v2.url.slice(0, 70));
  ok('das offene Angebot (AN-2026-0043) hat den Knopf NICHT — nur das angenommene', await page.evaluate((o) => { const bs = [...document.querySelectorAll('[data-wf-auftrag]')]; return bs.length === 1 && bs[0].getAttribute('data-wf-auftrag') !== o; }, await page.evaluate(() => window.__p.ids.o)), await page.evaluate(() => [...document.querySelectorAll('[data-wf-auftrag]')].map((b) => b.getAttribute('data-wf-auftrag'))));
  await page.context().close();

  // ───────────── R2: WorkFloh kommt mit Verweis zurück ─────────────
  console.log('\nR2 · Rückweg mit verweise.blpAngebotNr → Rechnung aus DEMSELBEN Angebot');
  const rueck = { v: 1, quelle: 'isd-workfloh', modus: 'rechnung', titel: 'Vereins-Tassen', kundeName: 'SV Blau-Weiß 09', auftragNr: '2026-0007', angebotsNr: '',
    positionen: [{ beschreibung: 'Tasse 11oz bedruckt', menge: 10, einzelpreisCent: 1290, ustSatz: 19 }], verweise: { blpAngebotNr: 'AN-2026-0042', wfAuftragNr: '2026-0007' } };
  page = await neueSeite('?uebernahme=' + b64u(rueck));
  ok('die Adresse ist gesäubert (kein ?uebernahme= mehr)', !/uebernahme=/.test(page.url()), page.url());
  const bannerText = async () => page.evaluate(() => [...document.querySelectorAll('.banner-text')].map((e) => e.textContent).join(' | '));
  ok('Banner: „Rückmeldung aus WorkFloh: Auftrag 2026-0007 gehört zu Angebot AN-2026-0042"', !!(await warte(() => [...document.querySelectorAll('.banner-text')].some((b) => /2026-0007/.test(b.textContent) && /AN-2026-0042/.test(b.textContent)))), await bannerText());
  ok('… mit der Führung „Rechnung aus Angebot" (das Angebot ist angenommen)', !!(await page.$('[data-rueckverweis]')) && /Rechnung aus Angebot/.test(await page.$eval('[data-rueckverweis]', (e) => e.textContent)));
  const liste = await page.evaluate(() => window.__p.listAngebote());
  const treffer = liste.find((a) => a.nummer === 'AN-2026-0042');
  ok('KEIN neues Angebot: weiter genau zwei (0042, 0043), und 0042 trägt wfAuftragNr 2026-0007', liste.length === 2 && treffer && treffer.verweise && treffer.verweise.wfAuftragNr === '2026-0007' && treffer.verweise.wfQuelle === 'isd-workfloh', JSON.stringify(liste.map((a) => [a.nummer, a.verweise])));
  const titelFeld = () => page.evaluate((ph) => { const i = [...document.querySelectorAll('input[type="text"]')].find((x) => x.placeholder === ph); return i ? i.value : null; }, TITEL_PH);
  ok('der Entwurf oben ist leer (Titel nicht vorbefüllt)', (await titelFeld()) === '', JSON.stringify(await titelFeld()));
  ok('die Zeile zeigt „→ WorkFloh-Auftrag 2026-0007"', !!(await warte(() => { const z = document.querySelector('[data-wf-verweis="auftrag"]'); return z && /2026-0007/.test(z.textContent); })));
  // „Rechnung aus Angebot" → Entwurf nennt den WorkFloh-Auftrag
  const btn = (await page.$$('button.btn-primary.btn-sm')).at(-1) || null;   // nur das angenommene 0042 hat ihn
  ok('Knopf „Rechnung aus Angebot" steht genau einmal (am angenommenen 0042)', !!btn && /Rechnung aus Angebot/.test(await btn.evaluate((b) => b.textContent)) && (await page.$$('button.btn-primary.btn-sm')).length === 1);
  if (btn) await btn.click();
  ok('Rechnungs-Entwurf erstellt (Banner nennt die Nummer), Angebot archiviert', !!(await warte(() => { const b = document.querySelector('.banner-warn'); return b && /Rechnungs-Entwurf/.test(b.textContent); })));
  const buch = await page.evaluate(() => window.__p.listBuchungen());
  ok('der Entwurf nennt „aus Angebot AN-2026-0042 · WorkFloh-Auftrag 2026-0007" — Rechnungsnummer nur hier, von Hand festzuschreiben', buch.length === 1 && /aus Angebot AN-2026-0042 · WorkFloh-Auftrag 2026-0007/.test(buch[0].beschreibung), JSON.stringify(buch.map((b) => b.beschreibung)));

  // ───────────── R3: Stand zurück an WorkFloh ─────────────
  console.log('\nR3 · Rechnung festgeschrieben / bezahlt → „Stand an WorkFloh"');
  await page.evaluate(async () => { await window.__p.updateSettings({ workflohZiel: 'tomy-workfloh' }); });   // Einstellung zeigt auf Tomy — der Auftrag kam aber aus Mein WorkFloh (isd-workfloh)
  await page.evaluate(() => { window.__blpVorgang = null; window.__p.navigate('angebote'); });
  ok('am archivierten Angebot 0042 stehen „Rechnung an WorkFloh melden" und „Bezahlt an WorkFloh melden"', !!(await warte(() => document.querySelector('[data-wf-stand="rechnung"]') && document.querySelector('[data-wf-stand="bezahlt"]'))));
  const a0 = await page.evaluate(async () => window.__p.getAngebot(window.__p.ids.a));
  ok('… die Rechnung ist am Angebot vermerkt (Buchungs-Kennung, Nummer, Datum)', !!(a0.verweise.rechnungBuchungId && a0.verweise.rechnungNr && a0.verweise.rechnungDatum) && a0.verweise.rechnungBuchungId === buch[0].id, JSON.stringify(a0.verweise));
  ok('das offene Angebot 0043 hat die Knöpfe NICHT (genau zwei Knöpfe)', await page.evaluate(() => document.querySelectorAll('[data-wf-stand]').length === 2));
  dialoge.length = 0;
  await page.click('[data-wf-stand="rechnung"]');
  await new Promise((r) => setTimeout(r, 500));
  ok('Rechnung noch Entwurf: Hinweis „noch ein Entwurf", KEIN Sprung, nichts vermerkt', dialoge.some((d) => /Entwurf/.test(d.message)) && (await page.evaluate(() => !window.__blpVorgang)) && !(await page.evaluate(async () => (await window.__p.getAngebot(window.__p.ids.a)).verweise.wfStand)), JSON.stringify(dialoge));
  await page.evaluate(async (id) => { await window.__p.festschreiben(id); window.__p.navigate('angebote'); }, buch[0].id);
  await warte(() => document.querySelector('[data-wf-stand="rechnung"]'));
  await page.click('[data-wf-stand="rechnung"]');
  const s1 = await warte(() => window.__blpVorgang, null, 8000) ? await page.evaluate(() => window.__blpVorgang) : null;
  const a1 = await page.evaluate(async () => window.__p.getAngebot(window.__p.ids.a));
  ok('festgeschrieben: Sprung an MEIN WorkFloh (Quelle des Auftrags, nicht die Einstellung) mit ?vorgang=', !!s1 && s1.ziel === 'mein-workfloh' && s1.url.startsWith('https://lausiklauskn-png.github.io/Mein-WorkFloh/?vorgang='), s1 && s1.url && s1.url.slice(0, 70));
  const p1 = s1 ? b64uDec(s1.url.split('?vorgang=')[1]) : null;
  ok('Nutzlast v2 art status, stand rechnung, Rechnungsnummer + Datum der Buchung, wfAuftragNr 2026-0007, Angebot 0042, keine Positionen', !!p1 && p1.v === 2 && p1.art === 'status' && p1.stand === 'rechnung' && p1.rechnungNr === a1.verweise.rechnungNr && p1.rechnungDatum === buch[0].datum && p1.verweise.wfAuftragNr === '2026-0007' && p1.verweise.blpAngebotNr === 'AN-2026-0042' && !('positionen' in p1), JSON.stringify(p1));
  ok('am Angebot vermerkt: wfStand rechnung + Zeitpunkt; die Zeile sagt „Stand gemeldet: Rechnung …"', a1.verweise.wfStand === 'rechnung' && /^\d{4}-/.test(a1.verweise.wfStandAm || '') && !!(await warte((nr) => { const z = document.querySelector('[data-wf-stand-gemeldet="rechnung"]'); return z && z.textContent.includes(nr); }, a1.verweise.rechnungNr)), JSON.stringify(a1.verweise));
  ok('„Rechnung melden" ist weg, „Bezahlt melden" bleibt', await page.evaluate(() => !document.querySelector('[data-wf-stand="rechnung"]') && !!document.querySelector('[data-wf-stand="bezahlt"]')));
  await page.evaluate(() => { window.__blpVorgang = null; });
  dialoge.length = 0;
  await page.click('[data-wf-stand="bezahlt"]');
  const s2 = await warte(() => window.__blpVorgang, null, 8000) ? await page.evaluate(() => window.__blpVorgang) : null;
  const p2 = s2 ? b64uDec(s2.url.split('?vorgang=')[1]) : null;
  const a2 = await page.evaluate(async () => window.__p.getAngebot(window.__p.ids.a));
  ok('bezahlt: Datum gefragt (prompt), Nutzlast stand bezahlt mit bezahltAm 2026-10-27 und Rechnungsnummer, Ziel Mein WorkFloh', dialoge.some((d) => d.type === 'prompt') && !!p2 && p2.stand === 'bezahlt' && p2.bezahltAm === '2026-10-27' && p2.rechnungNr === a1.verweise.rechnungNr && s2.ziel === 'mein-workfloh', JSON.stringify({ dialoge, p2 }));
  ok('am Angebot: wfStand bezahlt, wfBezahltAm; beide Knöpfe weg; Zeile „bezahlt am 27.10.2026"', a2.verweise.wfStand === 'bezahlt' && a2.verweise.wfBezahltAm === '2026-10-27' && !!(await warte(() => !document.querySelector('[data-wf-stand]') && /27\.10\.2026/.test(document.querySelector('[data-wf-stand-gemeldet="bezahlt"]')?.textContent || ''))), JSON.stringify(a2.verweise));
  await page.context().close();

  // ───────────── R2 ohne Treffer: Bestand v1 ─────────────
  console.log('\nR2 · Verweis auf ein unbekanntes Angebot → Bestand (neuer Entwurf vorbefüllt)');
  page = await neueSeite('?uebernahme=' + b64u({ ...rueck, verweise: { blpAngebotNr: 'AN-2020-9999' } }));
  ok('unbekannter Verweis: Formular wie bisher vorbefüllt (Titel), Banner „Übernahme aus WorkFloh"', !!(await warte((ph) => { const b = [...document.querySelectorAll('.banner-text')].some((x) => /Übernahme aus WorkFloh/.test(x.textContent)); const i = [...document.querySelectorAll('input[type="text"]')].find((x) => x.placeholder === ph); return b && i && i.value === 'Vereins-Tassen'; }, TITEL_PH)), (await bannerText()) + ' / ' + JSON.stringify(await titelFeld()));
  ok('… ohne Rückverweis-Zeile', !(await page.$('[data-rueckverweis]')));
  await page.context().close();

  ok('keine Skriptfehler auf der Seite', fehler.length === 0, fehler.join(' | ').slice(0, 300));
} catch (e) { rot++; console.log('  ✗ ROT: Probe stolperte — ' + (e && e.message)); }
finally { await browser.close(); server.close(); }
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
