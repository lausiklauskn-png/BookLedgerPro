// tests/run.mjs — Node-Smoke-Test reiner Logik (kein Browser nötig).
// Prüft Krypto-Roundtrip und GF(256)-Shamir-Wiederherstellung.
// Lauf: `node tests/run.mjs` (Node >= 18; nutzt globalThis.crypto, btoa/atob).

import {
  encryptWithPassword, decryptWithPassword, bytesToB64u, b64uToBytes, randomBytes,
  deriveAesKey, exportRawAesKey,
} from '../src/core/crypto.js';
import { splitSecret, combineShares, encodeShare, decodeShare } from '../src/core/shamir.js';
import { parseEuroToCents, formatCents } from '../src/domain/money.js';
import { saldo, KONTOART, mehrungsSeite } from '../src/domain/accounts.js';
import { baueBuchungZeilen, istAusgeglichen, validateBuchung, summeSeiten, stornoZeilen, formularAusBuchung } from '../src/domain/journal.js';
import { hashBuchung, verifyChain, GENESIS, canonicalize } from '../src/domain/audit.js';
import { computeEUR, computeEURIst, computeUStVoranmeldung, saldenliste, verprobeUSt } from '../src/domain/taxes.js';
import { seedAccounts } from '../src/domain/accounts.js';
import { extractFromText } from '../src/ai/extract.js';
import { categorize } from '../src/ai/categorize.js';
import { buildVorschlag } from '../src/ai/suggest.js';
import { pruefeBuchung, istFestschreibbar } from '../src/domain/pruefung.js';
import { baueRechnung, pflichtangaben, formatRechnungsnummer } from '../src/domain/rechnung.js';
import { findeRechtsregeln, onDeviceBegruendung } from '../src/domain/rechtsregeln.js';
import { buildBegruendungMessages, parseBegruendung, begruendeBuchung } from '../src/ai/berater.js';
import { auftragSummen, darfWechseln, validateAuftrag } from '../src/domain/orders.js';
import { rechnungZeilen } from '../src/domain/invoicing.js';
import { zeitSummen, formatDauer } from '../src/domain/employees.js';
import { kostenstellenAuswertung } from '../src/domain/costcenters.js';
import { buildLedgerCsv, buildDatevCsv, buildDatevExtf, datevBuchungssatz, buildUstVa, centsToComma, ustVaToCsv } from '../src/domain/export.js';
import { buildKennzahlenText } from '../src/ai/taxAssist.js';
import { generateKeyPair, buildSpore, verifySpore, nodeId, REQUIRED_FIELDS } from '../src/sbkim/spore.js';
import { demoVector, VECTOR_DIM } from '../src/sbkim/domainvector.js';
import { buildSignal } from '../src/sbkim/signal.js';
import { verifySporeObject } from '../tools/verify_remote_spore.mjs';
import { dashboardKennzahlen, jahrPeriode } from '../src/domain/summary.js';
import { buildVisionRequest, parseVisionText } from '../src/ai/vision.js';
import { buildClassifyMessages, parseClassify, resolveKategorie } from '../src/ai/mistral.js';

function indexFromSeed() {
  const idx = {};
  for (const k of seedAccounts()) idx[k.nummer] = k;
  return idx;
}
function zeile(zeilen, konto, seite) { return zeilen.find((z) => z.konto === konto && z.seite === seite); }

let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}
async function section(name, fn) {
  console.log(`\n${name}`);
  try { await fn(); } catch (e) { failed++; console.error(`  ✗ ${name} warf:`, e); }
}

await section('base64url', () => {
  const b = randomBytes(40);
  const round = b64uToBytes(bytesToB64u(b));
  ok('roundtrip identisch', Buffer.compare(Buffer.from(b), Buffer.from(round)) === 0);
  ok('keine +/=/ Zeichen', !/[+/=]/.test(bytesToB64u(b)));
});

await section('Krypto: Passwort-Roundtrip', async () => {
  const pkg = await encryptWithPassword('hunter2-correct-horse', 'Buchung 1200 EUR auf 1000');
  const back = await decryptWithPassword('hunter2-correct-horse', pkg);
  ok('entschlüsselt korrekt', back === 'Buchung 1200 EUR auf 1000');
  let threw = false;
  try { await decryptWithPassword('falsch', pkg); } catch { threw = true; }
  ok('falsches Passwort wirft', threw);
});

await section('Krypto: Key-Export deterministisch', async () => {
  const salt = randomBytes(16);
  const k1 = await deriveAesKey('pw', salt, true);
  const k2 = await deriveAesKey('pw', salt, true);
  const r1 = await exportRawAesKey(k1);
  const r2 = await exportRawAesKey(k2);
  ok('gleicher Key bei gleichem Salt+PW', Buffer.compare(Buffer.from(r1), Buffer.from(r2)) === 0);
  ok('Key ist 32 Byte', r1.length === 32);
});

await section('Shamir GF(256): split/combine', () => {
  const secret = randomBytes(32);
  const shares = splitSecret(secret, 3, 2);
  ok('3 Shares erzeugt', shares.length === 3);

  // Jede 2er-Teilmenge stellt das Geheimnis wieder her.
  const pairs = [[0, 1], [0, 2], [1, 2]];
  let allGood = true;
  for (const [a, b] of pairs) {
    const rec = combineShares([shares[a], shares[b]]);
    if (Buffer.compare(Buffer.from(secret), Buffer.from(rec)) !== 0) allGood = false;
  }
  ok('jede 2-von-3-Kombination rekonstruiert', allGood);

  // Alle 3 zusammen ebenfalls.
  const rec3 = combineShares(shares);
  ok('3-von-3 rekonstruiert', Buffer.compare(Buffer.from(secret), Buffer.from(rec3)) === 0);
});

await section('Shamir: Share-Kodierung', () => {
  const secret = randomBytes(32);
  const shares = splitSecret(secret, 5, 3);
  const encoded = shares.map((s) => encodeShare(s, 3));
  ok('Format BLPR1-…', encoded.every((e) => e.startsWith('BLPR1-3-')));
  const decoded = encoded.slice(0, 3).map(decodeShare);
  const rec = combineShares(decoded.map((d) => ({ x: d.x, y: d.y })));
  ok('decode+combine rekonstruiert', Buffer.compare(Buffer.from(secret), Buffer.from(rec)) === 0);
});

// ===== Phase 1: Buchhaltungs-Kern =====

await section('Geld: Parsen & Formatieren (Cent-genau)', () => {
  ok('deutsches Format 1.234,56 -> 123456', parseEuroToCents('1.234,56') === 123456);
  ok('Punkt-Dezimal 1234.56 -> 123456', parseEuroToCents('1234.56') === 123456);
  ok('Ganzzahl 12 -> 1200', parseEuroToCents('12') === 1200);
  ok('Zahl-Eingabe 19.99 -> 1999', parseEuroToCents(19.99) === 1999);
  ok('formatCents 123456 -> 1.234,56', formatCents(123456) === '1.234,56');
});

await section('Konten: Mehrungsseite & Saldo', () => {
  ok('Aktiv mehrt im Soll', mehrungsSeite(KONTOART.AKTIV) === 'S');
  ok('Ertrag mehrt im Haben', mehrungsSeite(KONTOART.ERTRAG) === 'H');
  ok('Aktiv-Saldo Soll-lastig positiv', saldo(KONTOART.AKTIV, { soll: 5000, haben: 2000 }) === 3000);
  ok('Ertrag-Saldo Haben-lastig positiv', saldo(KONTOART.ERTRAG, { soll: 0, haben: 5000 }) === 5000);
});

await section('Buchung: doppelte Buchführung & USt-Aufteilung', () => {
  const idx = { '4930': {}, '1576': {}, '1200': {}, '8400': {}, '1776': {} };

  // Aufwand mit Vorsteuer 19%: 119,00 brutto -> 100,00 netto + 19,00 VSt
  const a = baueBuchungZeilen({ sollKonto: '4930', habenKonto: '1200', brutto: '119,00', ustSatz: 19, steuerKonto: '1576', steuerSeite: 'S' });
  ok('Brutto 11900 Cent', a.brutto === 11900);
  ok('Netto 10000 Cent', a.netto === 10000);
  ok('Steuer 1900 Cent', a.steuer === 1900);
  ok('Aufwand-Buchung ausgeglichen', istAusgeglichen(a.zeilen));
  ok('Aufwand-Buchung gültig', validateBuchung({ datum: '2026-06-14', zeilen: a.zeilen }, idx).length === 0);

  // Ertrag mit USt 19%: 119,00 brutto -> 100,00 Erlös + 19,00 USt
  const e = baueBuchungZeilen({ sollKonto: '1200', habenKonto: '8400', brutto: '119,00', ustSatz: 19, steuerKonto: '1776', steuerSeite: 'H' });
  const s = summeSeiten(e.zeilen);
  ok('Ertrag Soll=Haben=11900', s.soll === 11900 && s.haben === 11900);

  // Unausgeglichene Buchung wird abgelehnt
  const bad = validateBuchung({ datum: '2026-06-14', zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8400', seite: 'H', betrag: 90 }] }, idx);
  ok('Unausgeglichen -> Fehler', bad.length > 0);

  // Storno tauscht Seiten
  const st = stornoZeilen(a.zeilen);
  ok('Storno spiegelt Seiten', st[0].seite === 'H' && st[2].seite === 'S' && istAusgeglichen(st));
});

await section('Audit: kanonische Form & Hash-Kette', async () => {
  ok('canonicalize sortiert Schlüssel', JSON.stringify(canonicalize({ b: 1, a: 2 })) === '{"a":2,"b":1}');
  ok('canonicalize lässt Arrays in Reihenfolge', JSON.stringify(canonicalize([3, 1, 2])) === '[3,1,2]');

  const b1 = { datum: '2026-06-01', beschreibung: 'A', seq: 1, zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8200', seite: 'H', betrag: 100 }] };
  const b2 = { datum: '2026-06-02', beschreibung: 'B', seq: 2, zeilen: [{ konto: '4980', seite: 'S', betrag: 50 }, { konto: '1200', seite: 'H', betrag: 50 }] };
  b1.prevHash = GENESIS; b1.hash = await hashBuchung(b1, GENESIS);
  b2.prevHash = b1.hash; b2.hash = await hashBuchung(b2, b1.hash);

  const good = await verifyChain([b2, b1]); // unsortiert übergeben
  ok('intakte Kette ist ok', good.ok && good.count === 2);

  // Manipulation eines Betrags fällt durch
  const tampered = JSON.parse(JSON.stringify(b1));
  tampered.zeilen[0].betrag = 999;
  const bad = await verifyChain([tampered, b2]);
  ok('manipulierte Buchung -> Kette ungültig', !bad.ok);

  // Lücke im Nummernkreis fällt durch
  const gap = await verifyChain([b1, { ...b2, seq: 3 }]);
  ok('Nummernkreis-Lücke -> ungültig', !gap.ok);
});

await section('Steuer: USt-Voranmeldung & EÜR', () => {
  const idx = {
    '1200': { art: KONTOART.AKTIV, name: 'Bank' },
    '4930': { art: KONTOART.AUFWAND, name: 'Bürobedarf' },
    '1576': { art: KONTOART.AKTIV, name: 'Vorsteuer 19%', rolle: 'vorsteuer' },
    '8400': { art: KONTOART.ERTRAG, name: 'Erlöse 19%' },
    '1776': { art: KONTOART.PASSIV, name: 'Umsatzsteuer 19%', rolle: 'umsatzsteuer' },
  };
  // Einkauf 119 (100 + 19 VSt), Verkauf 238 (200 + 38 USt)
  const buchungen = [
    { seq: 1, datum: '2026-06-05', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    { seq: 2, datum: '2026-06-10', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
  ];
  const ust = computeUStVoranmeldung(buchungen, idx);
  ok('Umsatzsteuer 3800', ust.umsatzsteuer === 3800);
  ok('Vorsteuer 1900', ust.vorsteuer === 1900);
  ok('Zahllast 1900', ust.zahllast === 1900);

  const eur = computeEUR(buchungen, idx);
  ok('Einnahmen 20000 (netto)', eur.einnahmen === 20000);
  ok('Ausgaben 10000 (netto)', eur.ausgaben === 10000);
  ok('Überschuss 10000', eur.ueberschuss === 10000);

  const sl = saldenliste(buchungen, idx);
  const bank = sl.find((x) => x.nummer === '1200');
  ok('Bank-Saldo 11900 (23800-11900)', bank.saldo === 11900);

  // Periodenfilter: nur Juni-05 zählt
  const ustVor = computeUStVoranmeldung(buchungen, idx, { von: '2026-06-01', bis: '2026-06-07' });
  ok('Periode filtert: nur Vorsteuer im Fenster', ustVor.vorsteuer === 1900 && ustVor.umsatzsteuer === 0);
});

await section('Integration: Festschreiben + Storno + Kette (spiegelt store.js)', async () => {
  // Spiegelt die Festschreibe-/Storno-Logik aus store.js mit den reinen Funktionen.
  async function festschreibe(buchung, seq, prevHash) {
    const b = { ...buchung, seq, prevHash };
    b.hash = await hashBuchung(b, prevHash);
    return b;
  }
  const b1 = await festschreibe({ datum: '2026-06-01', beschreibung: 'Verkauf', zeilen: [
    { konto: '1200', seite: 'S', betrag: 11900 }, { konto: '8400', seite: 'H', betrag: 10000 }, { konto: '1776', seite: 'H', betrag: 1900 },
  ] }, 1, GENESIS);
  const b2 = await festschreibe({ datum: '2026-06-02', beschreibung: 'Miete', zeilen: [
    { konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 },
  ] }, 2, b1.hash);
  // Storno von b1 (Seiten gespiegelt), als nächste festgeschriebene Buchung
  const b3 = await festschreibe({ datum: '2026-06-03', beschreibung: 'Storno zu #1', zeilen: stornoZeilen(b1.zeilen), stornoVon: b1.id }, 3, b2.hash);

  const chain = await verifyChain([b3, b1, b2]);
  ok('Kette nach Storno gültig & lückenlos', chain.ok && chain.count === 3);

  // b1 + sein Storno heben sich auf: betroffene Konten saldieren zu 0.
  const idx = {
    '1200': { art: KONTOART.AKTIV, name: 'Bank' }, '8400': { art: KONTOART.ERTRAG, name: 'Erlöse' },
    '1776': { art: KONTOART.PASSIV, name: 'USt', rolle: 'umsatzsteuer' }, '4210': { art: KONTOART.AUFWAND, name: 'Miete' },
  };
  const sl = saldenliste([b1, b3], idx);
  ok('storniertes Paar saldiert zu 0', sl.every((r) => r.saldo === 0));

  // Nur b2 bleibt wirksam: Bank -50000, Miete +50000
  const sl2 = saldenliste([b1, b2, b3], idx);
  const bank = sl2.find((r) => r.nummer === '1200');
  const miete = sl2.find((r) => r.nummer === '4210');
  ok('Bank-Saldo = -50000 (nur Miete wirkt)', bank.saldo === -50000);
  ok('Miete-Saldo = 50000', miete.saldo === 50000);
});

// ===== Phase 2: Beleg-Extraktion → Buchungsvorschlag =====

await section('Extraktion: Ausgabe-Beleg (Bürobedarf, 19% USt)', () => {
  const text = [
    'Bürobedarf Schmidt GmbH',
    'Musterstraße 1, 12345 Berlin',
    'Rechnung Nr. 2026-042',
    'Rechnungsdatum: 14.06.2026',
    'Toner und Papier',
    'Zwischensumme: 100,00',
    'zzgl. 19 % MwSt: 19,00',
    'Gesamtbetrag: 119,00 EUR',
  ].join('\n');
  const ex = extractFromText(text);
  ok('Brutto 11900 (aus Summen-Zeile)', ex.betragBrutto === 11900);
  ok('Datum 2026-06-14', ex.datum === '2026-06-14');
  ok('USt-Satz 19', ex.ustSatz === 19);
  ok('Vendor erkannt', /Schmidt/.test(ex.vendor || ''));

  const kat = categorize(text);
  ok('kategorisiert als Bürobedarf 4930', kat.konto === '4930' && kat.richtung === 'ausgabe');

  const res = buildVorschlag(ex, kat, indexFromSeed());
  ok('Vorschlag ok', res.ok);
  const z = res.vorschlag.zeilen;
  ok('Soll Aufwand 4930 = 10000', zeile(z, '4930', 'S')?.betrag === 10000);
  ok('Soll Vorsteuer 1576 = 1900', zeile(z, '1576', 'S')?.betrag === 1900);
  ok('Haben Bank 1200 = 11900', zeile(z, '1200', 'H')?.betrag === 11900);
  ok('Vorschlag ausgeglichen', istAusgeglichen(z));
});

await section('Extraktion: Einnahme-Beleg (Honorar, 19% USt)', () => {
  const text = [
    'Honorar für Beratung',
    'Rechnungsdatum 01.06.2026',
    'Unsere Leistung: 1.000,00',
    '19 % USt: 190,00',
    'Gesamt: 1.190,00 EUR',
  ].join('\n');
  const ex = extractFromText(text);
  ok('Brutto 119000', ex.betragBrutto === 119000);
  ok('Datum 2026-06-01', ex.datum === '2026-06-01');

  const kat = categorize(text);
  ok('kategorisiert als Einnahme 8400', kat.konto === '8400' && kat.richtung === 'einnahme');

  const res = buildVorschlag(ex, kat, indexFromSeed());
  const z = res.vorschlag.zeilen;
  ok('Soll Bank 1200 = 119000', zeile(z, '1200', 'S')?.betrag === 119000);
  ok('Haben Erlöse 8400 = 100000', zeile(z, '8400', 'H')?.betrag === 100000);
  ok('Haben Umsatzsteuer 1776 = 19000', zeile(z, '1776', 'H')?.betrag === 19000);
  ok('Vorschlag ausgeglichen', istAusgeglichen(z));
});

await section('Extraktion: leerer/unklarer Text', () => {
  const ex = extractFromText('Hallo, dies ist kein Beleg.');
  ok('kein Betrag → null', ex.betragBrutto === null);
  ok('niedrige Confidence', ex.confidence < 0.3);
  const res = buildVorschlag(ex, categorize('x'), indexFromSeed());
  ok('ohne Betrag kein Vorschlag', res.ok === false);
});

await section('Entwurf bearbeiten: Formular aus Buchung rekonstruieren', () => {
  const idx = indexFromSeed();
  const ausgabe = formularAusBuchung({
    datum: '2026-06-02', beschreibung: 'Toner', begruendung: 'Notiz', kostenstelle: 'K1',
    zeilen: [
      { konto: '4930', seite: 'S', betrag: 10000 },
      { konto: '1576', seite: 'S', betrag: 1900 },
      { konto: '1200', seite: 'H', betrag: 11900 },
    ],
  }, idx);
  ok('Ausgabe: Soll 4930 / Haben 1200', ausgabe.sollKonto === '4930' && ausgabe.habenKonto === '1200');
  ok('Ausgabe: Brutto 11900, USt 19', ausgabe.bruttoCent === 11900 && ausgabe.ustSatz === 19);
  ok('Ausgabe: Notizfelder erhalten', ausgabe.beschreibung === 'Toner' && ausgabe.begruendung === 'Notiz' && ausgabe.kostenstelle === 'K1');

  const einnahme = formularAusBuchung({ datum: '2026-06-03', zeilen: [
    { konto: '1200', seite: 'S', betrag: 11900 },
    { konto: '8400', seite: 'H', betrag: 10000 },
    { konto: '1776', seite: 'H', betrag: 1900 },
  ] }, idx);
  ok('Einnahme: Soll 1200 / Haben 8400', einnahme.sollKonto === '1200' && einnahme.habenKonto === '8400');
  ok('Einnahme: Brutto 11900, USt 19', einnahme.bruttoCent === 11900 && einnahme.ustSatz === 19);

  const ohneUst = formularAusBuchung({ zeilen: [
    { konto: '4980', seite: 'S', betrag: 5000 },
    { konto: '1200', seite: 'H', betrag: 5000 },
  ] }, idx);
  ok('ohne USt: Soll 4980 / Haben 1200 / 0 %', ohneUst.sollKonto === '4980' && ohneUst.habenKonto === '1200' && ohneUst.ustSatz === 0 && ohneUst.bruttoCent === 5000);
});

await section('Vorschlag: Spielraum statt Haken (Warnung statt Blockade)', () => {
  const ex = extractFromText('Bürobedarf\nGesamtbetrag: 119,00 EUR\n19 % MwSt');
  const kat = categorize('Bürobedarf Toner');
  // Unbekanntes Gegenkonto → Vorschlag entsteht trotzdem (Spielraum), trägt aber
  // den harten Fehler mit; blockiert würde erst beim Festschreiben.
  const grenz = buildVorschlag(ex, kat, indexFromSeed(), { gegenkonto: '9999' });
  ok('Vorschlag entsteht trotzdem (ok:true)', grenz.ok === true);
  ok('harter Fehler wird mitgeliefert', grenz.vorschlag.fehler.some((f) => /9999/.test(f)));
  // Gültiger Fall: keine harten Fehler, ausgeglichen.
  const good = buildVorschlag(ex, kat, indexFromSeed());
  ok('gültiger Vorschlag ok & ausgeglichen', good.ok === true && istAusgeglichen(good.vorschlag.zeilen));
  ok('gültiger Vorschlag ohne harte Fehler', good.vorschlag.fehler.length === 0);
});

await section('Plausibilitäts-Prüfung: Hinweise wie ein Berater (nicht-blockierend)', () => {
  const idx = indexFromSeed();
  const heute = '2026-06-14';
  const sauber = { datum: heute, beschreibung: 'Bürobedarf', zeilen: [
    { konto: '4930', seite: 'S', betrag: 10000 },
    { konto: '1576', seite: 'S', betrag: 1900 },
    { konto: '1200', seite: 'H', betrag: 11900 },
  ] };
  let p = pruefeBuchung(sauber, idx, { heute });
  ok('saubere Buchung: keine Fehler', p.fehler.length === 0);
  ok('saubere Buchung: keine Warnungen', p.warnungen.length === 0);
  ok('saubere Buchung festschreibbar', istFestschreibbar(p));

  // Erlöskonto USt-pflichtig, aber ohne Umsatzsteuer gebucht → Warnung (kein Fehler).
  const ohneUst = { datum: heute, beschreibung: 'Verkauf', zeilen: [
    { konto: '1200', seite: 'S', betrag: 11900 },
    { konto: '8400', seite: 'H', betrag: 11900 },
  ] };
  p = pruefeBuchung(ohneUst, idx, { heute });
  ok('USt-vergessen → Warnung', p.warnungen.some((w) => /Umsatzsteuer/i.test(w)));
  ok('USt-vergessen → kein harter Fehler', p.fehler.length === 0);
  ok('Kleinunternehmer unterdrückt USt-Warnung',
    pruefeBuchung(ohneUst, idx, { heute, kleinunternehmer: true }).warnungen.length === 0);

  // Zukunftsdatum, fehlende Beschreibung, identische Konten.
  p = pruefeBuchung({ datum: '2026-12-31', beschreibung: '', zeilen: [
    { konto: '4980', seite: 'S', betrag: 5000 },
    { konto: '4980', seite: 'H', betrag: 5000 },
  ] }, idx, { heute });
  ok('Zukunftsdatum → Warnung', p.warnungen.some((w) => /Zukunft/i.test(w)));
  ok('fehlender Buchungstext → Warnung', p.warnungen.some((w) => /Buchungstext/i.test(w)));
  ok('Soll=Haben-Konto → Warnung', p.warnungen.some((w) => /identisch/i.test(w)));

  // Zeitnähe: Datum vor zuletzt festgeschriebener Buchung.
  p = pruefeBuchung(sauber, idx, { heute, letztesFestDatum: '2026-06-30' });
  ok('Datum vor letzter Festschreibung → Warnung', p.warnungen.some((w) => /zeitgerecht/i.test(w)));

  // Harter Fehler (unausgeglichen) blockiert Festschreiben, Warnungen trotzdem berechnet.
  p = pruefeBuchung({ datum: heute, beschreibung: 'x', zeilen: [
    { konto: '4930', seite: 'S', betrag: 10000 },
    { konto: '1200', seite: 'H', betrag: 9000 },
  ] }, idx, { heute });
  ok('unausgeglichen → harter Fehler', p.fehler.length > 0);
  ok('unausgeglichen → nicht festschreibbar', istFestschreibbar(p) === false);
});

await section('EÜR Ist (§4 Abs.3, Zufluss/Abfluss)', () => {
  const idx = indexFromSeed();
  // Direkte Barausgabe (Aufwand+Vorsteuer an Bank) → Ausgabe brutto bei Abfluss.
  const barAusgabe = { seq: 1, datum: '2026-03-01', zeilen: [
    { konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 },
  ] };
  // Rechnung (Forderung an Erlös+USt) → KEIN Geldfluss, zählt nicht.
  const rechnung = { seq: 2, datum: '2026-03-02', zeilen: [
    { konto: '1400', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 },
  ] };
  // Zahlung der Rechnung (Bank an Forderung) → Einnahme brutto bei Zufluss.
  const zahlung = { seq: 3, datum: '2026-03-20', zeilen: [
    { konto: '1200', seite: 'S', betrag: 23800 }, { konto: '1400', seite: 'H', betrag: 23800 },
  ] };
  // Privateinlage (Bank an Eigenkapital) → kein BE/BA.
  const einlage = { seq: 4, datum: '2026-03-05', zeilen: [
    { konto: '1200', seite: 'S', betrag: 50000 }, { konto: '0880', seite: 'H', betrag: 50000 },
  ] };
  const r = computeEURIst([barAusgabe, rechnung, zahlung, einlage], idx);
  ok('Ist-Ausgaben 11900 (brutto, bei Abfluss)', r.ausgaben === 11900);
  ok('Ist-Einnahmen 23800 (bei Zahlung, nicht bei Rechnung)', r.einnahmen === 23800);
  ok('Überschuss 11900', r.ueberschuss === 11900);

  // Entwurf (seq null) zählt nicht; Periode grenzt ab.
  ok('Entwurf ignoriert', computeEURIst([{ seq: null, datum: '2026-03-01', zeilen: barAusgabe.zeilen }], idx).ausgaben === 0);
  ok('Periode grenzt ab', computeEURIst([zahlung], idx, { von: '2026-04-01' }).einnahmen === 0);
});

await section('USt-Verprobung: gebucht vs. erwartet (Netto × Satz)', () => {
  const idx = indexFromSeed();
  const ausgabe = { seq: 1, datum: '2026-06-02', zeilen: [
    { konto: '4930', seite: 'S', betrag: 10000 },
    { konto: '1576', seite: 'S', betrag: 1900 },
    { konto: '1200', seite: 'H', betrag: 11900 },
  ] };
  const einnahme = { seq: 2, datum: '2026-06-03', zeilen: [
    { konto: '1200', seite: 'S', betrag: 11900 },
    { konto: '8400', seite: 'H', betrag: 10000 },
    { konto: '1776', seite: 'H', betrag: 1900 },
  ] };
  let v = verprobeUSt([ausgabe, einnahme], idx);
  ok('korrekt gebucht → ok', v.ok === true);
  ok('Vorsteuer erwartet=gebucht=1900', v.vorsteuer.erwartet === 1900 && v.vorsteuer.gebucht === 1900 && v.vorsteuer.diff === 0);
  ok('Umsatzsteuer erwartet=gebucht=1900', v.umsatzsteuer.erwartet === 1900 && v.umsatzsteuer.gebucht === 1900);

  // Vergessene USt auf Erlös → Abweichung.
  const vergessen = { seq: 3, datum: '2026-06-04', zeilen: [
    { konto: '1200', seite: 'S', betrag: 11900 },
    { konto: '8400', seite: 'H', betrag: 11900 },
  ] };
  v = verprobeUSt([vergessen], idx);
  ok('vergessene USt → nicht ok', v.ok === false);
  ok('USt-Abweichung negativ (gebucht < erwartet)', v.umsatzsteuer.diff < 0 && v.umsatzsteuer.gebucht === 0);

  // Entwürfe (seq == null) zählen nicht mit.
  v = verprobeUSt([{ seq: null, datum: '2026-06-05', zeilen: vergessen.zeilen }], idx);
  ok('Entwurf wird ignoriert', v.ok === true && v.umsatzsteuer.erwartet === 0);
});

await section('Rechnungs-Dokument: Aufbau + §14-Pflichtangaben', () => {
  const auftrag = { titel: 'Projekt X', positionen: [
    { beschreibung: 'Beratung', menge: 2, einzelpreisCent: 5000, ustSatz: 19 },
    { beschreibung: 'Material', menge: 1, einzelpreisCent: 10000, ustSatz: 7 },
  ] };
  const firma = { name: 'Muster GmbH', anschrift: 'Weg 1, Berlin', steuernummer: '12/345/67890', ustId: '', iban: 'DE..' };
  const kunde = { name: 'Kunde AG', adresse: 'Platz 2, Köln' };
  const r = baueRechnung({ auftrag, kunde, firma, nummer: '2026-0001', datum: '2026-06-14', leistungsdatum: '2026-06-10' });
  ok('Netto 20000', r.netto === 20000);
  ok('USt 2600 (1900+700)', r.ust === 2600);
  ok('Brutto 22600', r.brutto === 22600);
  ok('Steuerzeilen: höchster Satz zuerst', r.steuerzeilen[0].satz === 19 && r.steuerzeilen[1].satz === 7);
  ok('Positionen mit Netto', r.positionen[0].netto === 10000);
  ok('vollständige Rechnung: keine fehlenden Pflichtangaben', pflichtangaben(r).length === 0);

  // Unvollständig: ohne Firma/Nummer → Pflichtangaben fehlen.
  const leer = baueRechnung({ auftrag, kunde: {}, firma: {}, nummer: '', datum: '', leistungsdatum: '' });
  const fehlt = pflichtangaben(leer);
  ok('fehlende Pflichtangaben erkannt', fehlt.length >= 5);
  ok('nennt Rechnungsnummer', fehlt.some((m) => /Rechnungsnummer/.test(m)));

  // Kleinunternehmer: keine USt, Hinweis-Pflicht erfüllt (kein USt-Mangel).
  const ku = baueRechnung({ auftrag, kunde, firma, nummer: '2026-0002', datum: '2026-06-14', leistungsdatum: '2026-06-14', kleinunternehmer: true });
  ok('Kleinunternehmer: USt 0', ku.ust === 0 && ku.brutto === ku.netto);
  ok('Kleinunternehmer: kein USt-Pflichtmangel', !pflichtangaben(ku).some((m) => /Steuersatz/.test(m)));

  ok('Rechnungsnummer-Format', formatRechnungsnummer(7, 2026) === '2026-0007');
});

await section('Rechtsregeln (Grounding) + KI-Berater (Begründung mit §-Bezug)', () => {
  const bewirtung = findeRechtsregeln({ text: 'Geschäftsessen mit Kunde im Restaurant' });
  ok('Bewirtung erkannt', bewirtung.some((r) => r.id === 'bewirtung' && /§ 4 Abs\. 5 S\. 1 Nr\. 2/.test(r.paragraph)));
  ok('Geschenke erkannt', findeRechtsregeln({ text: 'Geschenk an Geschäftsfreund' }).some((r) => r.id === 'geschenke'));
  ok('Kleinunternehmer aus Flag', findeRechtsregeln({ kleinunternehmer: true }).some((r) => r.id === 'kleinunternehmer'));
  ok('Fortbildung erkannt (§4(4))', findeRechtsregeln({ text: 'Seminar Buchhaltung' }).some((r) => r.id === 'fortbildung'));
  ok('Arbeitszimmer erkannt', findeRechtsregeln({ text: 'Homeoffice Anteil Miete' }).some((r) => r.id === 'arbeitszimmer'));
  ok('Bußgeld nicht abziehbar erkannt', findeRechtsregeln({ text: 'Bußgeld Parken' }).some((r) => r.id === 'nicht_abziehbar'));
  ok('Kleinbetragsrechnung bis 250 € (Betrag)', findeRechtsregeln({ betragCent: 12000 }).some((r) => r.id === 'kleinbetragsrechnung'));
  ok('keine Kleinbetragsregel über 250 €', !findeRechtsregeln({ betragCent: 30000 }).some((r) => r.id === 'kleinbetragsrechnung'));
  ok('kein Treffer bei neutralem Text', findeRechtsregeln({ text: 'allgemeine Lieferung' }).length === 0);

  const od = onDeviceBegruendung({ text: 'Bewirtung Restaurant' });
  ok('on-device Begründung nennt § und Quote', /§ 4 Abs\. 5/.test(od) && /70 %/.test(od));
  ok('on-device leer ohne Treffer', onDeviceBegruendung({ text: 'xyz' }) === '');

  const msgs = buildBegruendungMessages({ beschreibung: 'Geschäftsessen', text: 'Bewirtung Restaurant' });
  ok('Prompt: System + User', msgs.length === 2 && msgs[0].role === 'system');
  ok('Prompt enthält Rechtsregeln-Grundlage', /Rechtsregeln \(Grundlage\)/.test(msgs[1].content) && /§ 4 Abs\. 5/.test(msgs[1].content));
  // Kontoname/Kontierung landet im Prompt (kein Raten des Namens mehr).
  const m2 = buildBegruendungMessages({ konto: '1200', kontoName: 'Bank', kontierung: 'Soll 1200 Bank an Haben 8400 Erlöse 19% USt' });
  ok('Prompt nennt vollständige Kontierung mit Namen', /Soll 1200 Bank an Haben 8400 Erlöse/.test(m2[1].content));
  ok('ohne Kontierung: Nummer + Name', /Konto: 1200 Bank/.test(buildBegruendungMessages({ konto: '1200', kontoName: 'Bank' })[1].content));

  ok('parseBegruendung säubert', parseBegruendung('```\nMüll\n```  Text   mit  Leerzeichen ') === 'Text mit Leerzeichen');
});

await section('KI-Berater: On-Device-Fallback ohne Mistral', async () => {
  const r = await begruendeBuchung({ beschreibung: 'Geschäftsessen', text: 'Bewirtung im Restaurant', konto: '4980' });
  ok('Fallback liefert Text', typeof r.text === 'string' && r.text.length > 0);
  ok('Quelle on-device (keine KI konfiguriert)', r.quelle === 'on-device');
  ok('Regeln-Liste nennt Bewirtungs-§', r.regeln.some((p) => /§ 4 Abs\. 5 S\. 1 Nr\. 2/.test(p)));
});

// ===== Phase 3: Aufträge, Rechnung, Zeit, Kostenstellen =====

await section('Aufträge: Summen über mehrere USt-Sätze', () => {
  const positionen = [
    { menge: 2, einzelpreisCent: 5000, ustSatz: 19 },  // 100,00 @19
    { menge: 1, einzelpreisCent: 10000, ustSatz: 7 },  // 100,00 @7
  ];
  const s = auftragSummen(positionen);
  ok('Netto 20000', s.netto === 20000);
  ok('USt 2600 (1900+700)', s.ust === 2600);
  ok('Brutto 22600', s.brutto === 22600);
  ok('Status-Flow angelegt->in_arbeit erlaubt', darfWechseln('angelegt', 'in_arbeit'));
  ok('Status-Flow berechnet->x gesperrt', !darfWechseln('berechnet', 'angelegt'));
  ok('Auftrag ohne Position ungültig', validateAuftrag({ titel: 'x', positionen: [] }).length > 0);
});

await section('Rechnung → Buchung (Ausgangsrechnung, mehrere Sätze)', () => {
  const auftrag = { titel: 'Projekt', positionen: [
    { menge: 2, einzelpreisCent: 5000, ustSatz: 19 },
    { menge: 1, einzelpreisCent: 10000, ustSatz: 7 },
  ] };
  const { zeilen } = rechnungZeilen(auftrag);
  ok('Soll Forderung 1400 = 22600', zeile(zeilen, '1400', 'S')?.betrag === 22600);
  ok('Haben Erlöse 8400 = 10000', zeile(zeilen, '8400', 'H')?.betrag === 10000);
  ok('Haben USt 1776 = 1900', zeile(zeilen, '1776', 'H')?.betrag === 1900);
  ok('Haben Erlöse 8300 = 10000', zeile(zeilen, '8300', 'H')?.betrag === 10000);
  ok('Haben USt 1771 = 700', zeile(zeilen, '1771', 'H')?.betrag === 700);
  ok('Rechnungsbuchung ausgeglichen', istAusgeglichen(zeilen));
});

await section('Zeiterfassung: Summen & Kosten', () => {
  const s = zeitSummen([{ dauerMin: 90 }, { dauerMin: 30 }], 5000);
  ok('120 Minuten', s.minuten === 120);
  ok('2 Stunden', s.stunden === 2);
  ok('Kosten 10000 (2h × 50,00)', s.kostenCent === 10000);
  ok('ohne Lohn kein Kostenwert', zeitSummen([{ dauerMin: 60 }]).kostenCent === null);
  ok('formatDauer 90 → 1h 30m', formatDauer(90) === '1h 30m');
});

await section('Kostenstellen-Auswertung', () => {
  const idx = {
    '4210': { art: KONTOART.AUFWAND }, '1200': { art: KONTOART.AKTIV },
    '8400': { art: KONTOART.ERTRAG }, '1776': { art: KONTOART.PASSIV },
  };
  const buchungen = [
    { seq: 1, datum: '2026-06-01', kostenstelle: 'KS1', zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    { seq: 2, datum: '2026-06-02', kostenstelle: 'KS1', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
  ];
  const res = kostenstellenAuswertung(buchungen, idx);
  const ks1 = res.find((r) => r.kostenstelle === 'KS1');
  ok('KS1 Aufwand 50000', ks1.aufwand === 50000);
  ok('KS1 Ertrag 20000', ks1.ertrag === 20000);
  ok('KS1 Saldo -30000', ks1.saldo === -30000);
});

// ===== Phase 4: Steuer & Export =====

await section('Export: CSV-Formatierung & USt-VA-Kennzahlen', () => {
  ok('centsToComma 123456 -> 1234,56', centsToComma(123456) === '1234,56');
  ok('centsToComma negativ', centsToComma(-1900) === '-19,00');

  const idx = indexFromSeed();
  const buchungen = [
    { seq: 1, datum: '2026-06-05', status: 'festgeschrieben', beschreibung: 'Einkauf',
      zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    { seq: 2, datum: '2026-06-10', status: 'festgeschrieben', beschreibung: 'Verkauf',
      zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    { seq: 3, datum: '2026-06-11', status: 'festgeschrieben', beschreibung: 'Barerlös',
      zeilen: [{ konto: '1200', seite: 'S', betrag: 5000 }, { konto: '8200', seite: 'H', betrag: 5000 }] },
  ];

  const va = buildUstVa(buchungen, idx);
  ok('Kz81 (Umsätze 19%) = 20000', va.kz81 === 20000);
  ok('Kz81 Steuer = 3800', va.kz81Steuer === 3800);
  ok('Kz66 Vorsteuer = 1900', va.kz66 === 1900);
  ok('Kz83 Zahllast = 1900', va.kz83 === 1900);
  ok('USt-VA-CSV enthält Zahllast-Zeile', ustVaToCsv(va).includes('83;Verbleibende'));

  const ledger = buildLedgerCsv(buchungen, idx);
  const zeilenAnzahl = (buchungen[0].zeilen.length + buchungen[1].zeilen.length + buchungen[2].zeilen.length);
  ok('Journal-CSV hat Header + alle Zeilen', ledger.split('\r\n').length === zeilenAnzahl + 1);
  ok('Journal-CSV nennt Kontonamen', ledger.includes('Bürobedarf'));

  const datev = buildDatevCsv(buchungen, idx);
  ok('DATEV: 2-Zeilen-Buchung als Konto/Gegenkonto', datev.includes('50,00;S;1200;8200'));
});

await section('DATEV EXTF: Envelope + Konto/Gegenkonto-Brutto + Steuerschlüssel', () => {
  const idx = indexFromSeed();
  // Ausgabe mit Vorsteuer 19 % (USt-Split) → ein Brutto-Satz mit BU-Schlüssel.
  const ausgabe = datevBuchungssatz({ datum: '2026-06-05', zeilen: [
    { konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 },
  ] }, idx);
  ok('Ausgabe: Konto=4930, Gegenkonto=1200', ausgabe.konto === '4930' && ausgabe.gegenkonto === '1200');
  ok('Ausgabe: Brutto 11900, S, BU=9 (Vorsteuer 19%)', ausgabe.umsatz === 11900 && ausgabe.sh === 'S' && ausgabe.bu === '9');

  // Einnahme mit USt 19 %.
  const einnahme = datevBuchungssatz({ datum: '2026-06-10', zeilen: [
    { konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 },
  ] }, idx);
  ok('Einnahme: Konto=8400, Gegenkonto=1200, H, BU=3', einnahme.konto === '8400' && einnahme.gegenkonto === '1200' && einnahme.sh === 'H' && einnahme.bu === '3');

  const buchungen = [
    { seq: 1, datum: '2026-06-05', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    { seq: 2, datum: '2026-06-10', zeilen: [{ konto: '1200', seite: 'S', betrag: 5000 }, { konto: '8200', seite: 'H', betrag: 5000 }] },
    { seq: null, datum: '2026-06-12', zeilen: [{ konto: '4980', seite: 'S', betrag: 1000 }, { konto: '1200', seite: 'H', betrag: 1000 }] },
  ];
  const extf = buildDatevExtf(buchungen, idx, { bezeichnung: 'Test' });
  const zeilen = extf.split('\r\n');
  ok('EXTF-Header beginnt korrekt', zeilen[0].startsWith('"EXTF";700;21;"Buchungsstapel";'));
  ok('EXTF-Spaltenkopf enthält BU-Schlüssel', zeilen[1].includes('BU-Schlüssel') && zeilen[1].startsWith('Umsatz'));
  ok('EXTF: nur festgeschriebene (2 Datenzeilen)', zeilen.length === 4); // header + spalten + 2
  ok('EXTF: Belegdatum als TTMM', zeilen[2].includes(';0506;'));
});

await section('Steuer-Assistent: Kennzahlen-Text (Datenminimierung)', () => {
  const va = { kz81: 20000, kz81Steuer: 3800, kz86: 0, kz86Steuer: 0, kz66: 1900, kz83: 1900 };
  const eur = { einnahmen: 20000, ausgaben: 10000, ueberschuss: 10000 };
  const txt = buildKennzahlenText(va, eur, { von: '2026-06-01', bis: '2026-06-30' });
  ok('Text enthält Zahllast', /Zahllast/.test(txt));
  ok('Text enthält Überschuss', /Überschuss/.test(txt));
  ok('Text enthält keine Kontonummern/Belege', !/4930|1576|Beleg/.test(txt));
});

// ===== Phase 5: SBKIM (Sage-Mycel) — Identität, Spore, Verifizierer =====

await section('SBKIM: Demo-domainVector (§11.5)', () => {
  const a = demoVector(['Buchhaltung', 'Beleg', 'Konto']);
  ok('384 Dimensionen', a.vector.length === VECTOR_DIM);
  ok('_demo markiert', a._demo === true);
  ok('L2 ≈ 1', Math.abs(a.l2 - 1) < 1e-3);
  const b = demoVector(['Buchhaltung', 'Beleg', 'Konto']);
  ok('deterministisch (gleiche Stichworte → gleicher Vektor)', JSON.stringify(a.vector) === JSON.stringify(b.vector));
  const c = demoVector(['Rezept', 'Kochen']);
  ok('andere Stichworte → anderer Vektor', JSON.stringify(a.vector) !== JSON.stringify(c.vector));
});

await section('SBKIM: Spore bauen & verifizieren (§11.1/§11.2)', async () => {
  const keys = await generateKeyPair();
  const dv = demoVector(['Buchhaltung', 'Beleg', 'Konto', 'Rechnung', 'USt', 'EÜR']);
  const spore = await buildSpore(keys, {
    domain: 'BookLedgerPro-Buchhaltung',
    domainDescription: 'Offline-Buchhaltung; Belege, Konten, USt/EÜR, GoBD.',
    domainKeywords: ['Buchhaltung', 'Beleg', 'Konto', 'Rechnung', 'USt'],
    endpoint: 'https://lausiklauskn-png.github.io/BookLedgerPro/',
    nodeName: 'BookLedgerPro',
    domainVector: dv,
  });

  ok('9 Pflichtfelder vorhanden', REQUIRED_FIELDS.every((f) => spore[f] != null));
  ok('_demo-Markierung gesetzt', JSON.stringify(spore._demo) === '["domainVector"]');
  ok('id == nodeId(pubkey)', spore.id === await nodeId(keys.publicKey));

  const v = await verifySpore(spore);
  ok('eigene Spore VALID (Browser-Verifizierer)', v.valid && v.checks.id && v.checks.signature && v.checks.tamper);

  // Verifizierer-Paar: headless (node:crypto) muss dasselbe Urteil fällen.
  const v2 = await verifySporeObject(spore);
  ok('Verifizierer-Paar einig (headless VALID)', v2.valid === true);

  // Manipulation fällt durch
  const tampered = { ...spore, domain: spore.domain + '_x' };
  const v3 = await verifySpore(tampered);
  ok('manipulierte Spore UNGÜLTIG', v3.valid === false);
});

await section('SBKIM: SIGNAL.json (§11.6)', () => {
  const sig = buildSignal({ nodeId: 'ABC', seq: 1, headline: 'Andock vorbereitet', forNodes: ['*'] });
  ok('node = BookLedgerPro', sig.node === 'BookLedgerPro');
  ok('seq vorhanden', sig.seq === 1);
  ok('sporeUrl gesetzt', /BookLedgerPro\/main\/sbkim\/spore\.json$/.test(sig.sporeUrl));
  ok('forNodes = *', JSON.stringify(sig.forNodes) === '["*"]');
});

// ===== Phase 6: Dashboard-Kennzahlen =====

await section('Dashboard-Kennzahlen (Jahresfilter)', () => {
  const idx = indexFromSeed();
  const buchungen = [
    { seq: 1, datum: '2026-03-01', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    { seq: 2, datum: '2026-04-01', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    { seq: 3, datum: '2025-12-31', zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    { seq: null, datum: '2026-05-01', zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8200', seite: 'H', betrag: 100 }] },
  ];
  const k = dashboardKennzahlen(buchungen, idx, 2026);
  ok('Jahr 2026', k.jahr === 2026);
  ok('Ertrag netto 20000', k.ertrag === 20000);
  ok('Aufwand netto 10000 (nur 2026)', k.aufwand === 10000);
  ok('Überschuss 10000', k.ueberschuss === 10000);
  ok('USt-Zahllast 1900', k.ustZahllast === 1900);
  ok('2 festgeschrieben in 2026', k.festgeschrieben === 2);
  ok('1 Entwurf', k.entwuerfe === 1);
  ok('jahrPeriode korrekt', jahrPeriode(2026).von === '2026-01-01' && jahrPeriode(2026).bis === '2026-12-31');
});

// ===== EU-KI: Google Vision (OCR) + Mistral (Kontierung) =====

await section('Vision EU: Request-Aufbau & Antwort-Parser', () => {
  const img = buildVisionRequest('AAAA', 'image/jpeg');
  ok('Bild -> images:annotate', img.endpoint === 'images:annotate');
  ok('Bild: content gesetzt', img.body.requests[0].image.content === 'AAAA');
  ok('Feature DOCUMENT_TEXT_DETECTION', img.body.requests[0].features[0].type === 'DOCUMENT_TEXT_DETECTION');

  const pdf = buildVisionRequest('BBBB', 'application/pdf');
  ok('PDF -> files:annotate', pdf.endpoint === 'files:annotate');
  ok('PDF: inputConfig mimeType', pdf.body.requests[0].inputConfig.mimeType === 'application/pdf');

  ok('Bild-Antwort geparst', parseVisionText({ responses: [{ fullTextAnnotation: { text: 'Rechnung 119,00' } }] }) === 'Rechnung 119,00');
  ok('PDF-Antwort (mehrseitig) geparst', parseVisionText({ responses: [{ responses: [{ fullTextAnnotation: { text: 'A' } }, { fullTextAnnotation: { text: 'B' } }] }] }) === 'A\nB');
  let threw = false; try { parseVisionText({ responses: [{ error: { message: 'BAD_KEY' } }] }); } catch { threw = true; }
  ok('Vision-Fehler wirft', threw);
});

await section('Mistral EU: Kontierungs-Prompt & Parser', () => {
  const konten = seedAccounts();
  const msgs = buildClassifyMessages('Miete Büro', konten);
  ok('System + User Message', msgs.length === 2 && msgs[0].role === 'system');
  ok('nur Erfolgskonten gelistet (4210 ja, 1200 nein)', msgs[1].content.includes('4210') && !msgs[1].content.includes('1200 Bank'));

  ok('JSON geparst', JSON.stringify(parseClassify('{"konto":"4930","richtung":"ausgabe"}')) === '{"konto":"4930","richtung":"ausgabe"}');
  ok('JSON aus Text extrahiert', parseClassify('Antwort: {"konto":"8400","richtung":"einnahme"} ok').konto === '8400');
  ok('kein JSON -> null', parseClassify('keine Ahnung') === null);
});

await section('Mistral EU: resolveKategorie (Richtung folgt verbindlich der Kontoart)', () => {
  const idx = indexFromSeed();
  const aufwand = resolveKategorie({ konto: '4930', richtung: 'ausgabe' }, idx);
  ok('Aufwandskonto → ausgabe', aufwand && aufwand.richtung === 'ausgabe' && aufwand.quelle === 'mistral');
  const ertrag = resolveKategorie({ konto: '8400', richtung: 'einnahme' }, idx);
  ok('Ertragskonto → einnahme', ertrag && ertrag.richtung === 'einnahme');

  // Falsche Modell-Richtung wird durch die Kontoart korrigiert (kein Fehlbuchen).
  const korrigiert = resolveKategorie({ konto: '8400', richtung: 'ausgabe' }, idx);
  ok('Erlöskonto bleibt einnahme trotz falscher Modell-Richtung', korrigiert && korrigiert.richtung === 'einnahme');

  // Nicht-Erfolgskonten (z.B. Bank) dürfen nicht als Sachkonto durchrutschen → null.
  ok('Bestandskonto 1200 → null (Heuristik greift)', resolveKategorie({ konto: '1200', richtung: 'ausgabe' }, idx) === null);
  ok('unbekanntes Konto → null', resolveKategorie({ konto: '9999', richtung: 'ausgabe' }, idx) === null);
  ok('null-Eingabe → null', resolveKategorie(null, idx) === null);
});

console.log(`\n— ${passed} bestanden, ${failed} fehlgeschlagen —`);
process.exit(failed ? 1 : 0);
