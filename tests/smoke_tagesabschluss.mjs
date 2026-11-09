// tests/smoke_tagesabschluss.mjs — Tagesabschluss der offenen Ladenkasse und Quittung (Klaus 2026-11-09, Weg c)
// im ECHTEN Browser: echter Tresor (setupVault), echte Ansicht „Kasse & Shop“, echter Store (Festschreiben, Hash-Kette).
//
//   node tests/smoke_tagesabschluss.mjs      (Chromium + playwright/playwright-core aus der Umgebung)
//
// GESTELLT: window.print (zählt nur). Nicht gemessen: echte Spracherkennung (die Probe tippt den Satz), Kamera,
// Tablet. Nur erfundene Daten. Rückgabe: 0 grün · 1 ROT · 2 nicht lauffähig.
// Gegenprobe: TA_WURZEL=<Kopie> node tests/smoke_tagesabschluss.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const WURZEL = resolve(process.env.TA_WURZEL || join(dirname(fileURLToPath(import.meta.url)), '..'));
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch { console.log('nicht lauffähig: playwright(-core) fehlt'); process.exit(2); } }
const CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM].find((p) => p && existsSync(p));

let gruen = 0, rot = 0;
const ok = (name, cond, info) => { if (cond) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ROT: ' + name + (info ? '  — ' + info : '')); } };

const PROBE = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/tokens.css"><link rel="stylesheet" href="./assets/app.css"></head>
<body><div id="app"></div>
<script>window.__drucke = []; window.print = () => { window.__drucke.push(document.documentElement.classList.contains('druck-quittung')); };</script>
<script type="module">
import { setupVault } from './src/core/vault.js';
import { hydrateSettings, updateSettings, getSettings } from './src/state.js';
import { setAnfangsbestand } from './src/domain/anfangsbestand-store.js';
import { mountKassenbuch } from './src/ui/views/kassenbuch.js';
import * as store from './src/domain/store.js';
import * as docs from './src/domain/documents.js';
import * as tas from './src/domain/tagesabschluss-store.js';
import { mitMikrofon } from './src/ui/mikro.js';
import { recAll } from './src/core/db.js';
window.__p = { store, docs, tas, mitMikrofon, recAll, updateSettings, getSettings, mountKassenbuch };
await setupVault('probe-passwort-123');
await hydrateSettings();
const d = new Date();
window.__heute = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
await setAnfangsbestand('1000', d.getFullYear(), 20000);
await mountKassenbuch(document.getElementById('app'));
window.__probeBereit = true;
</script></body></html>`;

const TYP = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
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
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => fehler.push(String(e.message || e)));
  await page.goto(`${BASIS}/__probe.html`);
  await page.waitForFunction(() => window.__probeBereit === true);
  await page.waitForSelector('[data-tagesabschluss]');

  console.log('— A. Seite „Kasse & Shop“ —');
  ok('Titel „Kasse & Shop“', (await page.textContent('h1')).trim() === 'Kasse & Shop');
  ok('Tagesabschluss, Quittung und Weg zur Shop-Übernahme sichtbar', await page.evaluate(() =>
    !!document.querySelector('[data-tagesabschluss]') && !!document.querySelector('[data-quittung]') && !!document.querySelector('[data-zur-shop] button')));
  ok('Sprachfeld trägt ein Mikrofon (mitMikrofon)', await page.evaluate(() => window.__p.mitMikrofon(document.querySelector('[data-ta-satz]'))));
  ok('ohne Zählung: Festschreiben gesperrt', await page.isDisabled('[data-ta-fest]'));
  ok('noch keine Lücken gemeldet (kein Abschluss bisher)', !(await page.$('[data-ta-fehlend]')));

  console.log('— B. Satz → Felder → Rückrechnung —');
  await page.fill('[data-ta-satz]', 'Bestand 612 Euro, 20 Euro Kaffee ausgegeben, 300 zur Bank, 50 privat entnommen');
  await page.click('[data-ta-satz-los]');
  const felder = await page.evaluate(() => ({
    end: document.querySelector('[data-ta-end]').value, bank: document.querySelector('[data-ta-bank]').value,
    ent: document.querySelector('[data-ta-entnahme]').value,
    aus: [...document.querySelectorAll('[data-ta-ausgabe-betrag]')].map((x) => x.value).join('|'),
    text: [...document.querySelectorAll('[data-ta-ausgabe-text]')].map((x) => x.value).join('|'),
    unklar: document.querySelector('[data-ta-meldung]').dataset.unklar,
  }));
  ok('Felder gefüllt: 612,00 · 300,00 · 50,00 · Ausgabe 20,00 Kaffee', felder.end === '612,00' && felder.bank === '300,00' && felder.ent === '50,00' && felder.aus === '20,00' && felder.text === 'Kaffee' && felder.unklar === '0', JSON.stringify(felder));
  const erg = await page.evaluate(() => ({
    ein: document.querySelector('[data-ta-einnahme]')?.dataset.taEinnahme, ust: document.querySelector('[data-ta-ust]')?.dataset.taUst,
    netto: document.querySelector('[data-ta-netto]')?.dataset.taNetto, buch: document.querySelector('[data-ta-buchungen]')?.dataset.taBuchungen,
  }));
  ok('Einnahme 782,00 € = 612 − 200 + 20 + 300 + 50', erg.ein === '78200', JSON.stringify(erg));
  ok('USt 19 % heraus: 124,86 €, netto 657,14 €', erg.ust === '12486' && erg.netto === '65714');
  ok('vier Buchungen angezeigt (Einnahme, Ausgabe, Bank, Entnahme)', erg.buch === '4');
  ok('Festschreiben jetzt möglich', !(await page.isDisabled('[data-ta-fest]')));

  console.log('— C. Festschreiben mit Foto —');
  await page.setInputFiles('[data-ta-foto]', { name: 'zaehlprotokoll.png', mimeType: 'image/png', buffer: PNG });
  await page.click('[data-ta-fest]');
  await page.waitForFunction(() => document.querySelector('[data-ta-meldung]')?.dataset.fertig, null, { timeout: 15000 }).catch(() => {});
  const fest = await page.evaluate(async () => {
    const { store, docs, tas, recAll } = window.__p;
    const b = (await store.listBuchungen()).filter((x) => /Tagesabschluss|Barausgabe|Bankeinzahlung|Privatentnahme/.test(x.beschreibung));
    const belege = await docs.listBelege();
    const roh = await recAll('tagesabschluss');
    return {
      meldung: document.querySelector('[data-ta-meldung]')?.textContent || '',
      anzahl: b.length, alleFest: b.every((x) => x.status === 'festgeschrieben' && x.seq != null && x.hash),
      kette: await store.verifyAuditChain(),
      beleg: belege.filter((x) => x.quelle === 'tagesabschluss').length, verknuepft: belege.some((x) => x.quelle === 'tagesabschluss' && x.buchungId),
      rec: (await tas.listTagesabschluesse()).map((a) => [a.datum, a.einnahmeCent, a.ustCent, !!a.belegId]),
      rohOffen: JSON.stringify(roh).includes('Kaffee'), rohEnc: roh.every((r) => r.enc),
    };
  });
  ok('Meldung „festgeschrieben: Einnahme 782,00 €“', /festgeschrieben/.test(fest.meldung) && /782,00/.test(fest.meldung), fest.meldung);
  ok('vier Buchungen festgeschrieben (seq + Hash)', fest.anzahl === 4 && fest.alleFest, JSON.stringify(fest));
  ok('Hash-Kette intakt', fest.kette && (fest.kette.ok === true || fest.kette === true), JSON.stringify(fest.kette));
  ok('Foto als Beleg abgelegt und mit der Buchung verknüpft', fest.beleg === 1 && fest.verknuepft);
  ok('Abschluss gespeichert (Tag, 78200, 12486, mit Foto)', JSON.stringify(fest.rec[0]) === JSON.stringify([await page.evaluate(() => window.__heute), 78200, 12486, true]), JSON.stringify(fest.rec));
  ok('Abschluss verschlüsselt im Speicher („Kaffee“ nicht im Klartext)', fest.rohEnc && !fest.rohOffen);

  console.log('— D. Nach dem Festschreiben —');
  await page.waitForFunction(() => document.querySelector('[data-ta-schon]'), null, { timeout: 8000 }).catch(() => {});
  ok('derselbe Tag: „schon festgeschrieben“, kein zweiter Abschluss', !!(await page.$('[data-ta-schon]')) && await page.isDisabled('[data-ta-fest]'));
  const zweit = await page.evaluate(async () => { try { await window.__p.tas.tagesabschlussFestschreiben({ datum: window.__heute, endCent: 61200 }); return 'angenommen'; } catch (e) { return String(e.message); } });
  ok('Store weist einen zweiten Abschluss für denselben Tag ab', /schon einen festgeschriebenen/.test(zweit), zweit);
  ok('Kassenbericht: Endbestand 612,00 €', await page.evaluate(() => [...document.querySelectorAll('.report-line.strong')].some((x) => /612,00/.test(x.textContent))));

  console.log('— E. Fehlbetrag, Lücken —');
  const fb = await page.evaluate(async () => {
    const d = document.querySelector('[data-ta-datum]');
    const morgen = new Date(); morgen.setDate(morgen.getDate() + 1);
    d.value = morgen.toISOString().slice(0, 10); d.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 400));
    const e = document.querySelector('[data-ta-end]'); e.value = '100,00'; e.dispatchEvent(new Event('input'));
    return { fehler: document.querySelector('[data-ta-fehler]')?.textContent || '', aus: document.querySelector('[data-ta-fest]').disabled };
  });
  ok('Kassenfehlbetrag (100 € statt 612 €) gemeldet, nicht festschreibbar', /Kassenfehlbetrag/.test(fb.fehler) && /512,00/.test(fb.fehler) && fb.aus, JSON.stringify(fb));
  // Abschluss vor fünf Tagen → Lücken bis gestern
  await page.evaluate(async () => {
    const t = new Date(); t.setDate(t.getDate() - 6);
    const iso = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    window.__vor6 = iso;
    await window.__p.tas.tagesabschlussFestschreiben({ datum: iso, endCent: 20000 });
    await window.__p.mountKassenbuch(document.getElementById('app'));
  });
  await page.waitForSelector('[data-tagesabschluss]');
  const l1 = await page.evaluate(() => Number(document.querySelector('[data-ta-fehlend]')?.dataset.taFehlend || 0));
  ok('fehlende Tage zwischen dem früheren Abschluss und gestern gemeldet', l1 >= 4, String(l1));
  const erster = await page.evaluate(() => document.querySelector('[data-ta-fehlt]')?.dataset.taFehlt);
  ok('Datum springt auf den ersten fehlenden Tag', await page.evaluate((d) => document.querySelector('[data-ta-datum]').value === d, erster));
  await page.click(`[data-ta-zu="${erster}"]`);
  await page.waitForTimeout(500);
  const l2 = await page.evaluate(() => Number(document.querySelector('[data-ta-fehlend]')?.dataset.taFehlend || 0));
  ok('„zu“ nimmt einen geschlossenen Tag aus der Liste', l2 === l1 - 1, `${l1} → ${l2}`);

  console.log('— F. Quittung —');
  await page.fill('[data-q-leistung]', '1 Seidentuch');
  await page.fill('[data-q-betrag]', '49,00');
  await page.click('[data-q-zeigen]');
  ok('ohne Firmenprofil: fehlende Pflichtangaben genannt, nichts gedruckt', /Name des Betriebs/.test(await page.textContent('[data-q-pruef]')) && (await page.evaluate(() => window.__drucke.length)) === 0);
  await page.evaluate(async () => {
    await window.__p.updateSettings({ firma: { name: 'Muster Boutique', anschrift: 'Musterweg 1, 12345 Musterstadt', steuernummer: '', ustId: '', iban: '' } });
    await window.__p.mountKassenbuch(document.getElementById('app'));
  });
  await page.waitForSelector('[data-quittung]');
  await page.fill('[data-q-leistung]', '1 Seidentuch');
  await page.fill('[data-q-betrag]', '49,00');
  await page.click('[data-q-zeigen]');
  const q = await page.evaluate(() => ({ text: document.querySelector('[data-q-blatt]').textContent, n: document.querySelectorAll('.q-eine').length,
    druck: window.__drucke.slice(), ok: document.querySelector('[data-q-pruef]').dataset.ok, nachher: document.documentElement.classList.contains('druck-quittung') }));
  ok('Quittung mit Name, Anschrift, Ware, 49,00 €, 19 %, darin USt 7,82 €', q.n === 1 && /Muster Boutique/.test(q.text) && /Musterweg 1/.test(q.text) && /Seidentuch/.test(q.text) && /49,00/.test(q.text) && /19 %/.test(q.text) && /7,82/.test(q.text) && q.ok === 'true', q.text);
  ok('gedruckt wird nur das Quittungsblatt (Druckklasse beim Drucken gesetzt)', q.druck.length === 1 && q.druck[0] === true);
  await page.click('[data-q-leer]');
  ok('leeres Blatt: drei Quittungen mit Name für den Quittungsblock', await page.evaluate(() => document.querySelectorAll('.q-eine').length === 3 && /Muster Boutique/.test(document.querySelector('[data-q-blatt]').textContent)));
  await page.fill('[data-q-betrag]', '300,00');
  await page.click('[data-q-zeigen]');
  ok('über 250 €: Hinweis auf vollständige Rechnung', /250 €/.test(await page.textContent('[data-q-pruef]')));

  console.log('— H. Quittung als Beleg, Durchschläge, Nachfrage bei hoher Einnahme —');
  const morgen = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  await page.waitForFunction(() => document.querySelectorAll('[data-q-abgelegt]').length === 1 && /abgelegt/.test(document.querySelector('[data-q-abgelegt]').textContent), null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { const a = document.querySelector('[data-q-abgelegt]'); a.textContent = ''; delete a.dataset.belegId; });
  await page.fill('[data-q-leistung]', '1 Seidentuch');
  await page.fill('[data-q-betrag]', '49,00');
  await page.fill('[data-q-datum]', morgen);
  await page.evaluate(() => { document.querySelector('[data-ta-satz]').value = 'noch nicht fertig'; });
  await page.click('[data-q-zeigen]');
  // warten, bis GENAU diese Quittung (Tag morgen) gespeichert ist – waitForFunction wartet nicht auf async
  for (let i = 0; i < 50; i++) {
    if (await page.evaluate(async (m) => (await window.__p.tas.listQuittungen(m)).length === 1, morgen)) break;
    await page.waitForTimeout(200);
  }
  const qa = await page.evaluate(async (m) => {
    const belege = await window.__p.docs.listBelege();
    const q = await window.__p.tas.listQuittungen(m);
    const roh = await window.__p.recAll('quittung');
    const b = belege.find((x) => x.quelle === 'quittung' && q[0] && x.id === q[0].belegId);
    return { text: document.querySelector('[data-q-abgelegt]')?.textContent || '', beleg: !!b, pdf: b && b.mediaType === 'application/pdf',
      anzahl: q.length, betrag: q[0] && q[0].bruttoCent, verknuepft: q[0] && b && q[0].belegId === b.id,
      verschluesselt: roh.every((r) => r.enc) && !JSON.stringify(roh).includes('Seidentuch'),
      gebucht: (await window.__p.store.listBuchungen()).some((x) => /Seidentuch|Quittung/.test(x.beschreibung)) };
  }, morgen);
  ok('gedruckte Quittung als PDF-Beleg abgelegt und dem Tag zugeordnet', /abgelegt/.test(qa.text) && qa.beleg && qa.pdf && qa.anzahl === 1 && qa.betrag === 4900 && qa.verknuepft, JSON.stringify(qa));
  ok('Quittungs-Datensatz verschlüsselt, keine Buchung für die Quittung', qa.verschluesselt && !qa.gebucht);
  await page.waitForTimeout(600);
  ok('Quittung drucken lässt den angefangenen Tagesabschluss stehen (kein Neuzeichnen)', await page.evaluate(() => document.querySelector('[data-ta-satz]').value === 'noch nicht fertig'));
  await page.evaluate(async (m) => { const d = document.querySelector('[data-ta-datum]'); d.value = m; d.dispatchEvent(new Event('change')); await new Promise((r) => setTimeout(r, 500)); }, morgen);
  // 612 Anfang (Endbestand heute) + 1.500 gezählt-Plus → Einnahme 1.500 € (ohne Verlauf > 1.000 € → auffällig)
  await page.fill('[data-ta-end]', '2.112,00');
  await page.waitForTimeout(200);
  const vor = await page.evaluate(() => ({ ein: document.querySelector('[data-ta-einnahme]')?.dataset.taEinnahme, nachfrage: !!document.querySelector('[data-ta-nachfrage]'),
    aus: document.querySelector('[data-ta-fest]').disabled, appQ: document.querySelector('[data-ta-app-quittungen]')?.dataset.taAppQuittungen }));
  ok('App-Quittung des Tages wird im Abschluss genannt (1 Stück)', vor.appQ === '1', JSON.stringify(vor));
  ok('auffällig hohe Einnahme (1.500 €): Nachfrage, Festschreiben gesperrt', vor.ein === '150000' && vor.nachfrage && vor.aus, JSON.stringify(vor));
  await page.click('[data-ta-privat-ja]');
  ok('„Ja – Privateinlage“ führt ins Feld „Privat eingelegt“', await page.evaluate(() => document.activeElement === document.querySelector('[data-ta-einlage]')));
  await page.fill('[data-ta-einlage]', '1.000,00');
  await page.waitForTimeout(200);
  const nach = await page.evaluate(() => ({ ein: document.querySelector('[data-ta-einnahme]')?.dataset.taEinnahme, nachfrage: !!document.querySelector('[data-ta-nachfrage]'), aus: document.querySelector('[data-ta-fest]').disabled }));
  ok('mit 1.000 € Privateinlage: Einnahme 500 €, keine Nachfrage, Festschreiben frei', nach.ein === '50000' && !nach.nachfrage && !nach.aus, JSON.stringify(nach));
  await page.fill('[data-ta-einlage]', '');
  await page.waitForTimeout(200);
  ok('Einlage wieder weg → Nachfrage kommt wieder', await page.evaluate(() => !!document.querySelector('[data-ta-nachfrage]') && document.querySelector('[data-ta-fest]').disabled));
  const ohne = await page.evaluate(async (m) => { try { await window.__p.tas.tagesabschlussFestschreiben({ datum: m, endCent: 211200 }); return 'angenommen'; } catch (e) { return String(e.message); } }, morgen);
  ok('Store: ohne Bestätigung kein Abschluss bei auffälliger Einnahme', /Ungewöhnlich hohe Einnahme/.test(ohne), ohne);
  await page.click('[data-ta-stimmt]');
  ok('„Nein, stimmt so“ gibt das Festschreiben frei', await page.evaluate(() => !document.querySelector('[data-ta-nachfrage]') && !document.querySelector('[data-ta-fest]').disabled));
  await page.setInputFiles('[data-ta-quittungen]', [
    { name: 'durchschlag-1.png', mimeType: 'image/png', buffer: PNG }, { name: 'durchschlag-2.png', mimeType: 'image/png', buffer: PNG }]);
  await page.click('[data-ta-fest]');
  await page.waitForFunction((m) => document.querySelector('[data-ta-meldung]')?.dataset.fertig === m, morgen, { timeout: 15000 }).catch(() => {});
  const qf = await page.evaluate(async (m) => {
    const rec = await window.__p.tas.getTagesabschluss(m);
    const belege = await window.__p.docs.listBelege();
    const ein = rec && rec.buchungIds[0];
    const qb = belege.filter((b) => rec && rec.quittungBelegIds.includes(b.id));
    const bs = (await window.__p.store.listBuchungen()).filter((b) => b.datum === m);
    return { da: !!rec, ids: rec && rec.quittungBelegIds.length, alleVerknuepft: qb.length === 3 && qb.every((b) => b.buchungId === ein),
      durch: belege.filter((b) => b.quelle === 'quittung-durchschlag').length, q: rec && rec.quittungen, auff: rec && rec.auffaellig,
      buchungen: bs.length, einnahme: rec && rec.einnahmeCent };
  }, morgen);
  ok('Abschluss mit Bestätigung festgeschrieben, Antwort vermerkt', qf.da && qf.auff && qf.auff.antwort === 'kein-privatgeld' && qf.einnahme === 150000, JSON.stringify(qf));
  ok('2 Durchschläge + 1 App-Quittung als Belege an der Einnahme-Buchung', qf.ids === 3 && qf.durch === 2 && qf.alleVerknuepft && qf.q.anzahl === 1 && qf.q.durchschlaege === 2, JSON.stringify(qf));
  ok('Quittungen nicht gebucht: nur die Einnahme-Buchung an dem Tag', qf.buchungen === 1, String(qf.buchungen));

  console.log('— I. Ruhetage und Abschluss stornieren —');
  await page.evaluate(() => window.__p.mountKassenbuch(document.getElementById('app')));
  await page.waitForSelector('[data-tagesabschluss]');
  const vorR = await page.evaluate(() => Number(document.querySelector('[data-ta-fehlend]')?.dataset.taFehlend || 0));
  await page.evaluate(() => { document.querySelector('[data-ta-ruhetage]').open = true; });
  const tagWeg = await page.evaluate(() => { const b = document.querySelector('[data-ta-fehlt]'); return b ? new Date(b.dataset.taFehlt + 'T12:00:00').getDay() : null; });
  if (tagWeg != null) {
    await page.click(`[data-ta-ruhetag="${tagWeg}"]`);
    await page.waitForTimeout(800);
    await page.waitForSelector('[data-tagesabschluss]');
    const nachR = await page.evaluate(() => Number(document.querySelector('[data-ta-fehlend]')?.dataset.taFehlend || 0));
    const gemerkt = await page.evaluate((w) => (window.__p.getSettings().kasseRuhetage || []).includes(w), tagWeg);
    ok('Ruhetag angekreuzt: weniger fehlende Tage, in den Einstellungen gemerkt', nachR < vorR && gemerkt, `${vorR} → ${nachR}`);
  } else ok('Ruhetag angekreuzt (kein fehlender Tag zum Prüfen)', false, 'keine Lücke');
  const heute = await page.evaluate(() => window.__heute);
  await page.evaluate(() => { const d = document.querySelector('[data-tagesabschluss] details:last-of-type'); if (d) d.open = true; });
  await page.click(`[data-ta-storno="${heute}"]`);
  ok('Stornieren fragt erst nach', await page.isVisible(`[data-ta-storno-ja="${heute}"]`));
  await page.click(`[data-ta-storno-ja="${heute}"]`);
  await page.waitForFunction((h) => /Storniert/.test(document.querySelector(`[data-ta-storno-meldung="${h}"]`)?.textContent || ''), heute, { timeout: 15000 }).catch(() => {});
  const st = await page.evaluate(async (h) => {
    const { store, tas } = window.__p;
    const bs = await store.listBuchungen();
    const tag = bs.filter((b) => b.datum === h && !b.stornoVon && /Tagesabschluss|Barausgabe|Bankeinzahlung|Privatentnahme/.test(b.beschreibung));
    const storni = bs.filter((b) => b.stornoVon && tag.some((x) => x.id === b.stornoVon));
    return { offen: !(await tas.getTagesabschluss(h)), archiv: (await tas.listStornierteAbschluesse(h)).length,
      alleStorniert: tag.length === 4 && tag.every((b) => b.status === 'storniert'), storni: storni.length,
      kette: await store.verifyAuditChain() };
  }, heute);
  ok('alle 4 Buchungen des Tages storniert, 4 Gegenbuchungen, Kette intakt', st.alleStorniert && st.storni === 4 && st.kette && st.kette.ok === true, JSON.stringify(st));
  ok('Tag wieder offen, alter Abschluss als „storniert“ aufbewahrt', st.offen && st.archiv === 1, JSON.stringify(st));
  await page.waitForTimeout(800);
  await page.waitForSelector('[data-tagesabschluss]');
  await page.evaluate((h) => { const d = document.querySelector('[data-ta-datum]'); d.value = h; d.dispatchEvent(new Event('change')); }, heute);
  await page.waitForTimeout(400);
  await page.fill('[data-ta-end]', '612,00');
  await page.waitForTimeout(200);
  ok('nach dem Storno: Anfangsbestand wieder 200 €, derselbe Tag neu zählbar', await page.evaluate(() => !document.querySelector('[data-ta-schon]') && !!document.querySelector('[data-ta-einnahme]')));

  console.log('— G. schmal (360 px) —');
  await page.setViewportSize({ width: 360, height: 800 });
  ok('kein Querlaufen bei 360 px', await page.evaluate(() => document.documentElement.scrollWidth <= 362), String(await page.evaluate(() => document.documentElement.scrollWidth)));

  ok('keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
  await ctx.close();
} finally { await browser.close(); server.close(); }
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
