// tests/run.mjs — Node-Smoke-Test reiner Logik (kein Browser nötig).
// Prüft Krypto-Roundtrip und GF(256)-Shamir-Wiederherstellung.
// Lauf: `node tests/run.mjs` (Node >= 18; nutzt globalThis.crypto, btoa/atob).

import {
  encryptWithPassword, decryptWithPassword, bytesToB64u, b64uToBytes, randomBytes,
  deriveAesKey, exportRawAesKey, importRawAesKey,
  encryptBytesWithKey, decryptBytesWithKey, encryptWithKey, decryptWithKey,
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
import { parseImportText, normalizeImport } from '../src/domain/importworkfloh.js';
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
import { tokenize, reidentify, normalizeAnchors, createRegistry, STANDARD_TYP, ANKER_TYP, maskierungsBericht } from '../src/ai/pseudonym.js';
import { baueAnker } from '../src/ai/anker.js';
import { baueXRechnungCII, splitAdresse, xRechnungDateiname } from '../src/domain/erechnung.js';
import { parseEingangsrechnung, eingangsrechnungExtraktion, erkenneFormat } from '../src/domain/erechnungLesen.js';
import { parseMT940, umsatzExtraktion, parseCAMT, parseBankauszug, erkenneBankformat } from '../src/domain/bankimport.js';
import { offenePosten, findeOffenePosten, zahlungsBuchungZeilen } from '../src/domain/zahlungsabgleich.js';
import {
  eingangsrechnungZeilen, eingangsrechnungSummen, bruttoVonPositionen, rechnungBrutto,
  offenerBetrag, rechnungStatus, offeneVerbindlichkeiten, summeOffeneVerbindlichkeiten,
  validateEingangsrechnung,
} from '../src/domain/payables.js';
import { faelligkeit, tageUeberfaellig, mahnstufe, verzugszinsenCent, mahnpauschaleCent, anreicherePosten, ueberfaelligSummen, mahnschreibenDaten } from '../src/domain/mahnwesen.js';

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

await section('Tresor-Envelope: DEK wrap/unwrap + Passwortwechsel', async () => {
  const b64 = (u) => bytesToB64u(u);
  const rawDek = randomBytes(32);
  // Daten unter dem DEK verschlüsseln (bleibt über den PW-Wechsel hinweg gültig).
  const dek = await importRawAesKey(rawDek, true);
  const ctData = await encryptWithKey(dek, 'geheime-buchung');

  // Passwort 1: DEK einwickeln.
  const salt1 = randomBytes(16);
  const kek1 = await deriveAesKey('passwort-eins', salt1, false);
  const wrapped1 = await encryptBytesWithKey(kek1, rawDek);
  const unwrapped1 = await decryptBytesWithKey(kek1, wrapped1);
  ok('Unwrap mit richtigem PW = DEK', b64(unwrapped1) === b64(rawDek));

  // Falsches Passwort -> Unwrap wirft (GCM-Auth).
  let threw = false;
  try { await decryptBytesWithKey(await deriveAesKey('falsch', salt1, false), wrapped1); } catch { threw = true; }
  ok('Unwrap mit falschem PW wirft', threw);

  // Passwortwechsel: DEK mit neuem PW (neuem Salt) neu einwickeln.
  const salt2 = randomBytes(16);
  const kek2 = await deriveAesKey('passwort-zwei', salt2, false);
  const wrapped2 = await encryptBytesWithKey(kek2, unwrapped1);
  const unwrapped2 = await decryptBytesWithKey(kek2, wrapped2);
  ok('DEK nach PW-Wechsel unverändert', b64(unwrapped2) === b64(rawDek));
  ok('Mandant-ID (DEK-Präfix) stabil', b64(unwrapped2.slice(0, 6)) === b64(rawDek.slice(0, 6)));

  // Mit dem neuen PW entschlüsseln die ALTEN Daten weiterhin (kein Re-Encrypt nötig).
  const dek2 = await importRawAesKey(unwrapped2, true);
  ok('Alte Daten nach PW-Wechsel lesbar', (await decryptWithKey(dek2, ctData)) === 'geheime-buchung');

  // Altes Passwort öffnet den neuen Umschlag NICHT mehr.
  let threw2 = false;
  try { await decryptBytesWithKey(await deriveAesKey('passwort-eins', salt2, false), wrapped2); } catch { threw2 = true; }
  ok('Altes PW öffnet neuen Umschlag nicht', threw2);
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

await section('WorkFloh-Import: Normalisierung (Kunden, Aufträge, USt-Ergänzung)', () => {
  const obj = parseImportText(JSON.stringify({
    kunden: [
      { externId: 'K-1', name: 'Kunde AG', adresse: 'Weg 1', ustId: 'DE1' },
      { name: '' }, // ohne Name -> übersprungen
    ],
    auftraege: [
      { externNummer: 'A-7', kundeExternId: 'K-1', titel: 'Projekt', positionen: [
        { beschreibung: 'Beratung', menge: 2, einzelpreisCent: 5000, ustSatz: 19 },
        { beschreibung: 'Material', menge: 1, einzelpreis: '100,00' }, // USt fehlt, Euro-Preis
      ] },
    ],
  }));
  const r = normalizeImport(obj, { defaultUstSatz: 19 });
  ok('1 Kunde (leerer übersprungen)', r.kunden.length === 1 && r.kunden[0].externId === 'K-1');
  ok('1 Auftrag mit externNummer', r.auftraege.length === 1 && r.auftraege[0].externNummer === 'A-7');
  ok('Position 1: Cent übernommen', r.auftraege[0].positionen[0].einzelpreisCent === 5000);
  ok('Position 2: Euro→Cent (10000)', r.auftraege[0].positionen[1].einzelpreisCent === 10000);
  ok('Position 2: USt-Satz ergänzt (19)', r.auftraege[0].positionen[1].ustSatz === 19);
  ok('Warnungen vorhanden (Name + USt)', r.warnungen.length >= 2);
  ok('ungültiges JSON wirft', (() => { try { parseImportText('kein json'); return false; } catch { return true; } })());
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

// ===== Datenschutz-Modi: Pseudonymisierung (tokenize/reidentify) =====

await section('Pseudonym: stabile Token & exakter Round-Trip', () => {
  const text = 'Rechnung an Max Mustermann. Zahlung von Max Mustermann auf DE89 3704 0044 0532 0130 00.';
  const anker = [
    { wert: 'Max Mustermann', typ: 'PERSON' },
    { wert: 'DE89 3704 0044 0532 0130 00', typ: 'IBAN' },
  ];
  const { text: pseudo, map } = tokenize(text, anker);
  ok('Person ersetzt', !pseudo.includes('Max Mustermann'));
  ok('IBAN ersetzt', !pseudo.includes('DE89 3704'));
  ok('gleicher Wert → gleicher Token (beide Vorkommen)', (pseudo.match(/\[\[PERSON_1\]\]/g) || []).length === 2);
  ok('Token je Typ nummeriert (PERSON_1, IBAN_1)', pseudo.includes('[[PERSON_1]]') && pseudo.includes('[[IBAN_1]]'));
  ok('Map enthält Originalwerte', map.find((e) => e.typ === 'PERSON').wert === 'Max Mustermann');
  ok('Round-Trip stellt Original her', reidentify(pseudo, map) === text);
});

await section('Pseudonym: Longest-Match (überlappende Anker)', () => {
  const text = 'Müller GmbH zahlt; Müller privat zahlt auch.';
  // Bewusst unsortiert: kürzerer Anker zuerst — Longest-Match muss trotzdem greifen.
  const { text: pseudo, map } = tokenize(text, ['Müller', 'Müller GmbH']);
  ok('längerer Anker zuerst ersetzt', pseudo.startsWith('[[ID_1]] zahlt'));
  ok('kürzerer Anker als eigener Token', /\[\[ID_2\]\] privat/.test(pseudo));
  ok('„Müller GmbH" nicht zerlegt', !pseudo.includes('[[ID_2]] GmbH'));
  ok('Round-Trip ok', reidentify(pseudo, map) === text);
});

await section('Pseudonym: Sonderzeichen-sichere, exakte Treffer', () => {
  const text = 'Konto a.b+c(2) und Muster (GmbH) [Test].';
  const anker = ['a.b+c(2)', 'Muster (GmbH)'];
  const { text: pseudo, map } = tokenize(text, anker);
  ok('Regex-Sonderzeichen literal ersetzt', pseudo.includes('[[ID_1]]') && !pseudo.includes('a.b+c(2)'));
  ok('zweiter Sonderzeichen-Anker ersetzt', !pseudo.includes('Muster (GmbH)'));
  ok('Round-Trip mit Sonderzeichen', reidentify(pseudo, map) === text);
});

await section('Pseudonym: Normalisierung & Nicht-Treffer', () => {
  const norm = normalizeAnchors(['Anna', { value: 'a@b.de', type: 'e-mail' }, '  ', '', 'Anna']);
  ok('leere/Whitespace-Anker verworfen + entdoppelt', norm.length === 2);
  ok('String-Anker erhält Standard-Typ', norm[0].typ === STANDARD_TYP);
  ok('Typ normalisiert (e-mail → E_MAIL)', norm[1].typ === 'E_MAIL');

  const { text: pseudo, map } = tokenize('Hier steht kein bekannter Name.', ['Zoltan']);
  ok('nicht vorkommender Anker → kein Token', map.length === 0 && pseudo === 'Hier steht kein bekannter Name.');
});

await section('Pseudonym: Register für aufrufsübergreifend stabile Token', () => {
  const reg = createRegistry();
  const a = tokenize('Brief an Klaus.', [{ wert: 'Klaus', typ: 'PERSON' }], { registry: reg });
  const b = tokenize('Auch Klaus erwähnt Petra.', [{ wert: 'Klaus', typ: 'PERSON' }, { wert: 'Petra', typ: 'PERSON' }], { registry: reg });
  ok('Klaus behält Token über Aufrufe', a.text.includes('[[PERSON_1]]') && b.text.includes('[[PERSON_1]]'));
  ok('neue Person bekommt nächste Nummer', b.text.includes('[[PERSON_2]]'));
  ok('Register sammelt alle Einträge', reg.entries.length === 2);

  // Präfix-Sicherheit: [[PERSON_1]] darf nicht in [[PERSON_11]] hineingreifen.
  const viele = createRegistry();
  const namen = Array.from({ length: 11 }, (_, k) => 'Name' + (k + 1));
  const original = 'X ' + namen.join(' ');
  let t = 'X';
  for (const name of namen) t = tokenize(t + ' ' + name, [{ wert: name, typ: 'PERSON' }], { registry: viele }).text;
  ok('11 Token vergeben', viele.entries.length === 11 && t.includes('[[PERSON_11]]'));
  ok('Round-Trip mit zweistelligen Token-Nummern', reidentify(t, viele.entries) === original);
});

await section('Pseudonym: reidentify akzeptiert auch Objekt-Map', () => {
  const out = reidentify('Hallo [[PERSON_1]], Ihre [[IBAN_2]].', { '[[PERSON_1]]': 'Eva', '[[IBAN_2]]': 'DE00' });
  ok('Objekt-Map re-identifiziert', out === 'Hallo Eva, Ihre DE00.');
});

await section('Pseudonym: Wortgrenzen-Modus (opt-in) gegen Teilwort-Treffer', () => {
  // Standard (exakt): kurzer Anker greift auch mitten im Wort — Round-Trip bleibt verlustfrei.
  const exakt = tokenize('Annahme von Anna', [{ wert: 'Anna', typ: 'PERSON' }]);
  ok('Standard ersetzt auch in „Annahme"', exakt.text === '[[PERSON_1]]hme von [[PERSON_1]]');
  ok('Standard Round-Trip dennoch verlustfrei', reidentify(exakt.text, exakt.map) === 'Annahme von Anna');

  // Wortgrenze: „Anna" in „Annahme" wird NICHT ersetzt, das echte „Anna" schon.
  const wg = tokenize('Annahme von Anna.', [{ wert: 'Anna', typ: 'PERSON' }], { wortgrenze: true });
  ok('Wortgrenze schützt „Annahme"', wg.text === 'Annahme von [[PERSON_1]].');
  ok('Wortgrenze Round-Trip', reidentify(wg.text, wg.map) === 'Annahme von Anna.');

  // Satzzeichen-berandete Anker passieren die Kante trotz Wortgrenze (ä/ö/ü korrekt).
  const wg2 = tokenize('Zahlung an Müller, danke.', ['Müller'], { wortgrenze: true });
  ok('Umlaut-Name an Komma erkannt', wg2.text === 'Zahlung an [[ID_1]], danke.');
  const wg3 = tokenize('XMüllerei', ['Müller'], { wortgrenze: true });
  ok('„Müller" in „XMüllerei" nicht ersetzt', wg3.text === 'XMüllerei' && wg3.map.length === 0);

  // Longest-Match + Wortgrenze: „Annabel" bleibt ganz, „Anna" je eigener Treffer.
  const multi = tokenize('Anna, Anna und Annabel', [{ wert: 'Anna', typ: 'P' }, { wert: 'Annabel', typ: 'P' }], { wortgrenze: true });
  ok('Longest-Match + Wortgrenze korrekt', multi.text === '[[P_1]], [[P_1]] und [[P_2]]');
});

await section('Datenschutz-Modi: Anker-Quelle aus Stammdaten (baueAnker)', () => {
  const anker = baueAnker({
    kunden: [
      { name: 'Erika Musterfrau', email: 'erika@example.de', ustId: 'DE123456789', adresse: 'Beispielweg 5, 10115 Berlin' },
      { name: 'AG', email: '' }, // zu kurz / leer → verworfen
      { name: 'Erika Musterfrau' }, // Dublette → einmal
    ],
    mitarbeiter: [{ name: 'Klaus Nitzsche' }],
    firma: { name: 'Meine Firma GmbH', anschrift: 'Hauptstr. 1, 50667 Köln', iban: 'DE89370400440532013000', ustId: 'DE999', steuernummer: '12/345/67890' },
  });
  const werte = anker.map((a) => a.wert);
  ok('Firma + Kunde + Mitarbeiter erfasst', werte.includes('Meine Firma GmbH') && werte.includes('Erika Musterfrau') && werte.includes('Klaus Nitzsche'));
  ok('IBAN/USt-IdNr./Steuernr. als Anker', werte.includes('DE89370400440532013000') && werte.includes('DE123456789') && werte.includes('12/345/67890'));
  ok('Typisierung korrekt (PERSON/FIRMA/IBAN)',
    anker.find((a) => a.wert === 'Klaus Nitzsche').typ === ANKER_TYP.PERSON &&
    anker.find((a) => a.wert === 'Meine Firma GmbH').typ === ANKER_TYP.FIRMA &&
    anker.find((a) => a.wert === 'DE89370400440532013000').typ === ANKER_TYP.IBAN);
  ok('zu kurze/leere Werte verworfen', !werte.includes('AG') && !werte.includes(''));
  ok('Dubletten entfernt', werte.filter((w) => w === 'Erika Musterfrau').length === 1);
  ok('leere Quellen → leere Liste', baueAnker().length === 0 && baueAnker({}).length === 0);
});

await section('Datenschutz-Modi: Belegtext-Pseudonymisierung für KI (Komposition)', () => {
  // Spiegelt den Versandpfad: Stammdaten → Anker → tokenize(Belegtext, {wortgrenze}).
  const anker = baueAnker({
    kunden: [{ name: 'Erika Musterfrau', adresse: 'Beispielweg 5, 10115 Berlin' }],
    firma: { name: 'Meine Firma GmbH' },
  });
  const beleg = 'Rechnung von Meine Firma GmbH an Erika Musterfrau, Beispielweg 5, 10115 Berlin. Betrag 119,00 EUR, 19% USt am 14.06.2026.';
  const { text: pseudo, map } = tokenize(beleg, anker, { wortgrenze: true });
  ok('Kundenname maskiert', !pseudo.includes('Erika Musterfrau') && /\[\[PERSON_\d+\]\]/.test(pseudo));
  ok('Firma maskiert', !pseudo.includes('Meine Firma GmbH') && /\[\[FIRMA_\d+\]\]/.test(pseudo));
  ok('Adresse maskiert', !pseudo.includes('Beispielweg 5, 10115 Berlin'));
  ok('Betrag/Datum/USt unberührt (KI braucht sie)', pseudo.includes('119,00') && pseudo.includes('14.06.2026') && pseudo.includes('19% USt'));
  ok('verlustfreie Re-Identifizierung der Antwort', reidentify(pseudo, map) === beleg);
});

await section('Datenschutz-Modi: Transparenz-Bericht (maskierungsBericht)', () => {
  const { map } = tokenize('Max Mustermann, Firma X und nochmals Max Mustermann',
    [{ wert: 'Max Mustermann', typ: ANKER_TYP.PERSON }, { wert: 'Firma X', typ: ANKER_TYP.FIRMA }]);
  const b = maskierungsBericht(map);
  ok('gesamt zählt eindeutige Anker (nicht Vorkommen)', b.gesamt === 2);
  ok('proTyp aufgeschlüsselt', b.proTyp.PERSON === 1 && b.proTyp.FIRMA === 1);
  ok('leere Map → 0', maskierungsBericht([]).gesamt === 0 && Object.keys(maskierungsBericht([]).proTyp).length === 0);
  // Ohne typ-Feld wird der Typ aus der Token-Form abgeleitet.
  ok('Typ aus Token-Form erkannt', maskierungsBericht([{ token: '[[IBAN_1]]', wert: 'DE..' }]).proTyp.IBAN === 1);
  // Bericht enthält keine Klartextwerte (nur Zähler).
  ok('Bericht ohne Klartext', !JSON.stringify(b).includes('Mustermann'));
});

// ===== E-Rechnung: XRechnung/CII-Erzeugung =====

// Minimaler Wohlgeformtheits-Check (Tag-Balance) — ersetzt KEINEN echten Validator.
function xmlWohlgeformt(xml) {
  const re = /<(\/?)([a-zA-Z:]+)(?:\s[^>]*?)?(\/?)>/g;
  const stack = []; let m;
  while ((m = re.exec(xml))) {
    const [, close, name, self] = m;
    if (self) continue;
    if (close) { if (stack.pop() !== name) return false; }
    else stack.push(name);
  }
  return stack.length === 0;
}

await section('E-Rechnung: Adresse zerlegen', () => {
  const a = splitAdresse('Hauptstr. 1, 50667 Köln');
  ok('Straße/PLZ/Ort getrennt', a.strasse === 'Hauptstr. 1' && a.plz === '50667' && a.ort === 'Köln');
  const b = splitAdresse('Nur eine Zeile');
  ok('ohne PLZ → alles als Straße', b.strasse === 'Nur eine Zeile' && b.plz === '' && b.ort === '');
});

await section('E-Rechnung: XRechnung (CII) aus Rechnung — Regelfall 19%+7%', () => {
  const r = baueRechnung({
    auftrag: { titel: 'Projekt', positionen: [
      { beschreibung: 'Beratung', menge: 2, einzelpreisCent: 5000, ustSatz: 19 }, // 100,00 @19
      { beschreibung: 'Material', menge: 1, einzelpreisCent: 10000, ustSatz: 7 }, // 100,00 @7
    ] },
    kunde: { name: 'Kunde & Co. KG', adresse: 'Beispielweg 5, 10115 Berlin', ustId: 'DE123456789' },
    firma: { name: 'Meine Firma GmbH', anschrift: 'Hauptstr. 1, 50667 Köln', ustId: 'DE999999999', iban: 'DE89 3704 0044 0532 0130 00' },
    nummer: '2026-0007', datum: '2026-06-16', leistungsdatum: '2026-06-15',
  });
  const xml = baueXRechnungCII(r);
  ok('XML-Deklaration + CII-Wurzel', xml.startsWith('<?xml') && xml.includes('<rsm:CrossIndustryInvoice'));
  ok('wohlgeformt (Tag-Balance)', xmlWohlgeformt(xml));
  ok('EN16931/XRechnung-Leitfaden', xml.includes('en16931') && xml.includes('xrechnung_3.0'));
  ok('Rechnungsnr. (BT-1) + TypeCode 380', xml.includes('<ram:ID>2026-0007</ram:ID>') && xml.includes('<ram:TypeCode>380</ram:TypeCode>'));
  ok('Ausstellungsdatum 102 (BT-2)', xml.includes('format="102">20260616<'));
  ok('Leistungsdatum 102 (BT-72)', xml.includes('format="102">20260615<'));
  ok('Verkäufer/Käufer (BT-27/44)', xml.includes('<ram:Name>Meine Firma GmbH</ram:Name>') && xml.includes('<ram:Name>Kunde &amp; Co. KG</ram:Name>'));
  ok('XML-Escaping des &', !xml.includes('Kunde & Co') && xml.includes('Kunde &amp; Co. KG'));
  ok('Verkäufer USt-IdNr. (BT-31)', xml.includes('schemeID="VA">DE999999999<'));
  ok('IBAN ohne Leerzeichen (BT-84)', xml.includes('<ram:IBANID>DE89370400440532013000</ram:IBANID>'));
  ok('zwei Steuerzeilen 19/7 %', xml.includes('<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>') && xml.includes('<ram:RateApplicablePercent>7.00</ram:RateApplicablePercent>'));
  ok('Summen: Netto 200,00 / USt 26,00 / Brutto 226,00', xml.includes('<ram:LineTotalAmount>200.00</ram:LineTotalAmount>') && xml.includes('<ram:TaxTotalAmount currencyID="EUR">26.00</ram:TaxTotalAmount>') && xml.includes('<ram:GrandTotalAmount>226.00</ram:GrandTotalAmount>'));
  ok('Dateiname-Vorschlag', xRechnungDateiname(r) === 'XRechnung_2026-0007.xml');
});

await section('E-Rechnung: Kleinunternehmer (§19) → Kategorie E, keine USt', () => {
  const r = baueRechnung({
    auftrag: { positionen: [{ beschreibung: 'Leistung', menge: 1, einzelpreisCent: 10000, ustSatz: 0 }] },
    kunde: { name: 'Kunde' }, firma: { name: 'Klein UG', anschrift: 'Weg 2, 12345 Stadt' },
    nummer: '2026-0001', datum: '2026-06-16', kleinunternehmer: true,
  });
  const xml = baueXRechnungCII(r);
  ok('wohlgeformt', xmlWohlgeformt(xml));
  ok('Kategorie E (befreit)', xml.includes('<ram:CategoryCode>E</ram:CategoryCode>'));
  ok('Befreiungsgrund §19', xml.includes('Kleinunternehmer gemäß § 19 UStG'));
  ok('keine USt (0,00)', xml.includes('<ram:TaxTotalAmount currencyID="EUR">0.00</ram:TaxTotalAmount>'));
});

await section('E-Rechnung Empfang: CII Round-Trip (erzeugen → einlesen)', () => {
  const r = baueRechnung({
    auftrag: { titel: 'Wartung', positionen: [{ beschreibung: 'Service', menge: 1, einzelpreisCent: 10000, ustSatz: 19 }] },
    kunde: { name: 'Empfänger GmbH', adresse: 'Zielstr. 3, 80331 München' },
    firma: { name: 'Lieferant & Sohn', anschrift: 'Quellweg 9, 20095 Hamburg', ustId: 'DE111111111' },
    nummer: 'RE-2026-555', datum: '2026-05-20', leistungsdatum: '2026-05-18',
  });
  const xml = baueXRechnungCII(r);
  ok('Format als CII erkannt', erkenneFormat(xml) === 'CII');
  const p = parseEingangsrechnung(xml);
  ok('Rechnungsnummer gelesen', p.nummer === 'RE-2026-555');
  ok('Datum normalisiert (102 → ISO)', p.datum === '2026-05-20');
  ok('Lieferant (Verkäufer) gelesen + entescaped', p.lieferant === 'Lieferant & Sohn');
  ok('Brutto 11900 / USt 1900 / Netto 10000 Cent', p.brutto === 11900 && p.ust === 1900 && p.netto === 10000);
  ok('USt-Satz 19', p.ustSatz === 19);
  ok('hohe Confidence', p.confidence >= 0.8);
  const ex = eingangsrechnungExtraktion(p);
  ok('Extraktion fürs Vorschlag-Format', ex.betragBrutto === 11900 && ex.datum === '2026-05-20' && ex.ustSatz === 19 && ex.vendor === 'Lieferant & Sohn');
});

await section('E-Rechnung Empfang: UBL-Syntax', () => {
  const ubl = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    '<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>',
    '<cbc:ID>UBL-7788</cbc:ID>',
    '<cbc:IssueDate>2026-04-10</cbc:IssueDate>',
    '<cac:AccountingSupplierParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>Muster Lieferant AG</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>',
    '<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">38.00</cbc:TaxAmount><cac:TaxSubtotal><cac:TaxCategory><cbc:Percent>19</cbc:Percent></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>',
    '<cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">200.00</cbc:TaxExclusiveAmount><cbc:PayableAmount currencyID="EUR">238.00</cbc:PayableAmount></cac:LegalMonetaryTotal>',
    '</Invoice>',
  ].join('\n');
  ok('Format als UBL erkannt', erkenneFormat(ubl) === 'UBL');
  const p = parseEingangsrechnung(ubl);
  ok('Nummer = erstes cbc:ID (nicht CustomizationID)', p.nummer === 'UBL-7788');
  ok('Datum gelesen', p.datum === '2026-04-10');
  ok('Lieferant aus PartyLegalEntity', p.lieferant === 'Muster Lieferant AG');
  ok('Brutto 23800 / USt 3800 / Netto 20000', p.brutto === 23800 && p.ust === 3800 && p.netto === 20000);
  ok('USt-Satz 19', p.ustSatz === 19);
});

await section('E-Rechnung Empfang: unbekanntes Format', () => {
  const p = parseEingangsrechnung('<html><body>kein eRechnung</body></html>');
  ok('Format null + Fehlerhinweis', p.format === null && /Unbekannt/.test(p.fehler) && p.confidence === 0);
});

// ===== Bankimport: MT940 =====

await section('Bankimport: MT940 parsen (Lastschrift + Gutschrift)', () => {
  const mt940 = [
    ':20:STARTUMS',
    ':25:DE89370400440532013000EUR',
    ':28C:00012/001',
    ':60F:C240601EUR1000,00',
    ':61:2406030603D119,00NMSCNONREF',
    ':86:166?00ONLINE-UEBERWEISUNG?20Rechnung 2026-042?32BUERO SCHMIDT GMBH',
    ':61:2406050605C238,00NTRFNONREF',
    ':86:166?00GUTSCHRIFT?20Honorar Beratung?32KUNDE MUSTER AG',
    ':62F:C240630EUR1119,00',
  ].join('\n');
  const { konto, umsaetze } = parseMT940(mt940);
  ok('Konto-IBAN gelesen (ohne EUR)', konto === 'DE89370400440532013000');
  ok('zwei Umsätze', umsaetze.length === 2);
  ok('Umsatz 1: Lastschrift → ausgabe 11900 Cent', umsaetze[0].richtung === 'ausgabe' && umsaetze[0].betragCent === 11900);
  ok('Umsatz 1: Valuta 2024-06-03', umsaetze[0].valuta === '2024-06-03');
  ok('Umsatz 1: Zweck + Gegenname', /Rechnung 2026-042/.test(umsaetze[0].zweck) && umsaetze[0].gegen === 'BUERO SCHMIDT GMBH');
  ok('Umsatz 2: Gutschrift → einnahme 23800 Cent', umsaetze[1].richtung === 'einnahme' && umsaetze[1].betragCent === 23800);
  ok('Umsatz 2: Gegenname', umsaetze[1].gegen === 'KUNDE MUSTER AG');
});

await section('Bankimport: MT940 mehrzeiliger :86:-Block + Extraktion', () => {
  const mt940 = [
    ':25:1234567890',
    ':61:2406100610D50,00NMSC',
    ':86:177?00MIETE',
    '?20Buero Mai 2026?32VERMIETER GMBH',
    ':62F:D240630EUR50,00',
  ].join('\n');
  const { umsaetze } = parseMT940(mt940);
  ok('Fortsetzungszeile in :86: übernommen', /Buero Mai 2026/.test(umsaetze[0].zweck) && umsaetze[0].gegen === 'VERMIETER GMBH');
  const ex = umsatzExtraktion(umsaetze[0]);
  ok('Extraktion: Betrag/Datum/Richtung', ex.betragBrutto === 5000 && ex.datum === '2024-06-10' && ex.richtung === 'ausgabe');
  ok('Extraktion: USt-Satz offen (null)', ex.ustSatz === null);
  ok('leerer Auszug → keine Umsätze', parseMT940('').umsaetze.length === 0);
});

await section('Bankimport: CAMT.053 (ISO 20022, XML) + Format-Weiche', () => {
  const camt = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt><Stmt>',
    '<Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>',
    '<Ntry><Amt Ccy="EUR">119.00</Amt><CdtDbtInd>DBIT</CdtDbtInd><ValDt><Dt>2026-06-03</Dt></ValDt>',
    '<NtryDtls><TxDtls><RltdPties><Cdtr><Nm>Buero Schmidt GmbH</Nm></Cdtr></RltdPties>',
    '<RmtInf><Ustrd>Rechnung 2026-042</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '<Ntry><Amt Ccy="EUR">238.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><ValDt><Dt>2026-06-05</Dt></ValDt>',
    '<NtryDtls><TxDtls><RltdPties><Dbtr><Nm>Kunde Muster AG</Nm></Dbtr></RltdPties>',
    '<RmtInf><Ustrd>Honorar Beratung</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '</Stmt></BkToCstmrStmt></Document>',
  ].join('\n');
  ok('Format als CAMT erkannt', erkenneBankformat(camt) === 'CAMT');
  const { konto, umsaetze } = parseCAMT(camt);
  ok('IBAN gelesen', konto === 'DE89370400440532013000');
  ok('zwei Umsätze', umsaetze.length === 2);
  ok('DBIT → ausgabe 11900', umsaetze[0].richtung === 'ausgabe' && umsaetze[0].betragCent === 11900 && umsaetze[0].valuta === '2026-06-03');
  ok('DBIT Gegenpartei = Cdtr', umsaetze[0].gegen === 'Buero Schmidt GmbH' && /Rechnung 2026-042/.test(umsaetze[0].zweck));
  ok('CRDT → einnahme 23800, Gegenpartei = Dbtr', umsaetze[1].richtung === 'einnahme' && umsaetze[1].betragCent === 23800 && umsaetze[1].gegen === 'Kunde Muster AG');

  // Einheitlicher Einstieg erkennt beide Formate.
  ok('parseBankauszug erkennt CAMT', parseBankauszug(camt).format === 'CAMT' && parseBankauszug(camt).umsaetze.length === 2);
  ok('parseBankauszug erkennt MT940', parseBankauszug(':25:DE12\n:61:2406030603D5,00NMSC\n:86:166?20Test').format === 'MT940');
  ok('parseBankauszug: unbekannt → leer', parseBankauszug('weder noch').format === null);
});

await section('Zahlungsabgleich: offene Posten + Matching + Ausgleichsbuchung', () => {
  const auftraege = [
    { id: 'a1', status: 'berechnet', rechnungNummer: '2026-0007', rechnungDatum: '2026-06-01', kundeId: 'k1',
      positionen: [{ menge: 1, einzelpreisCent: 10000, ustSatz: 19 }] }, // brutto 11900
    { id: 'a2', status: 'angelegt', kundeId: 'k2', positionen: [{ menge: 1, einzelpreisCent: 5000, ustSatz: 19 }] },
    { id: 'a3', status: 'bezahlt', rechnungNummer: '2026-0006', kundeId: 'k1', positionen: [{ menge: 1, einzelpreisCent: 9999, ustSatz: 19 }] },
  ];
  const posten = offenePosten(auftraege, { nameById: { k1: 'Muster AG', k2: 'Zweite GmbH' } });
  ok('nur „berechnet" ist offen', posten.length === 1 && posten[0].id === 'a1' && posten[0].betragCent === 11900);
  ok('Posten trägt Referenz + Name', posten[0].referenz === '2026-0007' && posten[0].name === 'Muster AG');

  // Treffer über Rechnungsnummer im Verwendungszweck.
  const u = { richtung: 'einnahme', betragCent: 11900, valuta: '2026-06-05', zweck: 'Zahlung Rechnung 2026-0007', gegen: 'Muster AG' };
  const m = findeOffenePosten(u, posten);
  ok('Treffer gefunden', m && m.posten.id === 'a1');
  ok('Score nutzt Nummer + Name', m.score >= 1 + 3 + 2);

  // Falscher Betrag → kein Treffer.
  ok('anderer Betrag → null', findeOffenePosten({ richtung: 'einnahme', betragCent: 9999 }, posten) === null);
  // Falsche Richtung → kein Treffer.
  ok('Ausgabe gegen Forderungsposten → null', findeOffenePosten({ richtung: 'ausgabe', betragCent: 11900 }, posten) === null);

  // Ausgleichsbuchung Einnahme: Bank an Forderung, ausgeglichen.
  const b = zahlungsBuchungZeilen(u, m.posten);
  ok('Einnahme: Soll Bank 1200 / Haben Forderung 1400', b.zeilen[0].konto === '1200' && b.zeilen[0].seite === 'S' && b.zeilen[1].konto === '1400' && b.zeilen[1].seite === 'H');
  ok('Beträge ausgeglichen 11900', b.zeilen[0].betrag === 11900 && b.zeilen[1].betrag === 11900);
  ok('Beschreibung nennt Rechnung', /2026-0007/.test(b.beschreibung));

  // Ausgleichsbuchung Ausgabe: Verbindlichkeit an Bank.
  const ba = zahlungsBuchungZeilen({ richtung: 'ausgabe', betragCent: 5000, valuta: '2026-06-09' });
  ok('Ausgabe: Soll Verbindlichkeit 1600 / Haben Bank 1200', ba.zeilen[0].konto === '1600' && ba.zeilen[1].konto === '1200' && ba.zeilen[1].seite === 'H');
});

// ===== A2: Eingangsrechnungen als offene Verbindlichkeiten (Kreditoren) =====

await section('Eingangsrechnung → Buchung (Aufwand + Vorsteuer an Verbindlichkeit 1600)', () => {
  // Bürobedarf 100,00 netto @19% + Bücher 100,00 netto @7%
  const rechnung = { kreditor: 'Schmidt GmbH', datum: '2026-06-14', positionen: [
    { nettoCent: 10000, ustSatz: 19, aufwandKonto: '4930' },
    { nettoCent: 10000, ustSatz: 7, aufwandKonto: '4940' },
  ] };
  const summen = eingangsrechnungSummen(rechnung.positionen);
  ok('Netto 20000', summen.netto === 20000);
  ok('Vorsteuer 2600 (1900+700)', summen.vorsteuer === 2600);
  ok('Brutto 22600', summen.brutto === 22600);
  ok('bruttoVonPositionen 22600', bruttoVonPositionen(rechnung.positionen) === 22600);

  const { zeilen } = eingangsrechnungZeilen(rechnung);
  ok('Soll Aufwand 4930 = 10000', zeile(zeilen, '4930', 'S')?.betrag === 10000);
  ok('Soll Aufwand 4940 = 10000', zeile(zeilen, '4940', 'S')?.betrag === 10000);
  ok('Soll Vorsteuer 1576 = 1900', zeile(zeilen, '1576', 'S')?.betrag === 1900);
  ok('Soll Vorsteuer 1571 = 700', zeile(zeilen, '1571', 'S')?.betrag === 700);
  ok('Haben Verbindlichkeit 1600 = 22600', zeile(zeilen, '1600', 'H')?.betrag === 22600);
  ok('Eingangsrechnungsbuchung ausgeglichen', istAusgeglichen(zeilen));

  // Mehrere Positionen auf demselben Aufwandskonto werden zusammengefasst.
  const z2 = eingangsrechnungZeilen({ datum: '2026-06-14', kreditor: 'X', positionen: [
    { nettoCent: 3000, ustSatz: 19, aufwandKonto: '4980' },
    { nettoCent: 2000, ustSatz: 19, aufwandKonto: '4980' },
  ] }).zeilen;
  ok('gleiches Aufwandskonto summiert (4980 = 5000)', zeile(z2, '4980', 'S')?.betrag === 5000);
  ok('Brutto 5950 als Verbindlichkeit', zeile(z2, '1600', 'H')?.betrag === 5950);

  // Validierung gegen den echten Kontenindex: Konten existieren, Buchung gültig.
  ok('Buchung gegen Seed-Konten gültig', validateBuchung({ datum: rechnung.datum, zeilen }, indexFromSeed()).length === 0);

  // bruttoCent hat Vorrang vor Positionen.
  ok('rechnungBrutto nutzt expliziten bruttoCent', rechnungBrutto({ bruttoCent: 11900, positionen: [{ nettoCent: 999, ustSatz: 19 }] }) === 11900);
});

await section('Offene Verbindlichkeiten + Status (Teilzahlung/Storno/Stichtag)', () => {
  const rechnungen = [
    { id: 'er:1', kreditor: 'Alpha', rechnungsnr: 'A-1', datum: '2026-06-01', faelligAm: '2026-07-01',
      bruttoCent: 11900, zahlungen: [] },                                              // offen
    { id: 'er:2', kreditor: 'Beta', rechnungsnr: 'B-2', datum: '2026-06-02', faelligAm: '2026-06-20',
      bruttoCent: 20000, zahlungen: [{ datum: '2026-06-10', betragCent: 5000 }] },     // teilbezahlt
    { id: 'er:3', kreditor: 'Gamma', rechnungsnr: 'G-3', datum: '2026-06-03',
      bruttoCent: 5000, zahlungen: [{ datum: '2026-06-15', betragCent: 5000 }] },       // bezahlt
    { id: 'er:4', kreditor: 'Delta', rechnungsnr: 'D-4', datum: '2026-06-04',
      bruttoCent: 9999, storniert: true },                                              // storniert
  ];
  ok('offen: er1 = 11900', offenerBetrag(rechnungen[0]) === 11900);
  ok('teilbezahlt: er2 offen = 15000', offenerBetrag(rechnungen[1]) === 15000);
  ok('Status er1 offen', rechnungStatus(rechnungen[0]) === 'offen');
  ok('Status er2 teilbezahlt', rechnungStatus(rechnungen[1]) === 'teilbezahlt');
  ok('Status er3 bezahlt', rechnungStatus(rechnungen[2]) === 'bezahlt');
  ok('Status er4 storniert', rechnungStatus(rechnungen[3]) === 'storniert');

  const posten = offeneVerbindlichkeiten(rechnungen);
  ok('nur 2 offene Posten (bezahlt+storniert raus)', posten.length === 2);
  ok('nach Fälligkeit sortiert (Beta 06-20 vor Alpha 07-01)', posten[0].name === 'Beta' && posten[1].name === 'Alpha');
  ok('richtung ausgabe + kind verbindlichkeit', posten[0].richtung === 'ausgabe' && posten[0].kind === 'verbindlichkeit');
  ok('betragCent = offener Rest (Beta 15000)', posten[0].betragCent === 15000 && posten[0].offenCent === 15000);
  ok('Posten-Format kompatibel (referenz/name)', posten[1].referenz === 'A-1' && posten[1].name === 'Alpha');
  ok('Summe offen = 26900', summeOffeneVerbindlichkeiten(posten) === 26900);
  ok('Beta bezahltCent = 5000', posten.find((p) => p.name === 'Beta').bezahltCent === 5000);

  // Stichtag vor der Teilzahlung → er2 voll offen, er3 noch offen (Zahlung am 06-15)
  const am0609 = offeneVerbindlichkeiten(rechnungen, { stichtag: '2026-06-09' });
  ok('Stichtag 06-09: 3 offene Posten', am0609.length === 3);
  ok('Stichtag 06-09: Beta voll offen 20000', am0609.find((p) => p.name === 'Beta').betragCent === 20000);
});

await section('A2-Integration: Bank-Ausgabe matcht offene Verbindlichkeit', () => {
  // Die offenen Verbindlichkeiten speisen denselben Zahlungsabgleich wie die Forderungen.
  const posten = offeneVerbindlichkeiten([
    { id: 'er:1', kreditor: 'Alpha GmbH', rechnungsnr: 'RE-2026-007', datum: '2026-06-01', bruttoCent: 11900 },
    { id: 'er:2', kreditor: 'Beta AG', rechnungsnr: 'B-2', datum: '2026-06-02', bruttoCent: 5000 },
  ]);
  const u = { richtung: 'ausgabe', betragCent: 11900, valuta: '2026-06-05', zweck: 'Ueberweisung RE-2026-007', gegen: 'Alpha GmbH' };
  const m = findeOffenePosten(u, posten);
  ok('Bank-Ausgabe trifft Verbindlichkeit er:1', m && m.posten.id === 'er:1');
  ok('Score nutzt Nummer + Name', m.score >= 1 + 3 + 2);
  ok('Forderungs-Einnahme trifft Verbindlichkeit NICHT', findeOffenePosten({ richtung: 'einnahme', betragCent: 11900 }, posten) === null);

  const b = zahlungsBuchungZeilen(u, m.posten);
  ok('Ausgleich: Soll Verbindlichkeit 1600 / Haben Bank 1200', b.zeilen[0].konto === '1600' && b.zeilen[0].seite === 'S' && b.zeilen[1].konto === '1200' && b.zeilen[1].seite === 'H');
  ok('Betrag 11900 ausgeglichen', b.zeilen[0].betrag === 11900 && b.zeilen[1].betrag === 11900);
});

await section('Validierung Eingangsrechnung', () => {
  ok('ohne Kreditor ungültig', validateEingangsrechnung({ datum: '2026-06-01', positionen: [{ nettoCent: 100, ustSatz: 19 }] }).length > 0);
  ok('ohne Datum ungültig', validateEingangsrechnung({ kreditor: 'X', positionen: [{ nettoCent: 100, ustSatz: 19 }] }).length > 0);
  ok('falscher USt-Satz ungültig', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01', positionen: [{ nettoCent: 100, ustSatz: 5 }] }).length > 0);
  ok('gültige Rechnung ohne Fehler', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01', positionen: [{ nettoCent: 100, ustSatz: 19 }] }).length === 0);
  ok('Brutto statt Positionen erlaubt', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01', bruttoCent: 11900 }).length === 0);
  ok('weder Position noch Brutto → Fehler', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01' }).length > 0);
});

await section('Mahnwesen: Fälligkeit, Überfälligkeit, Mahnstufe', () => {
  ok('Fälligkeit = Rechnungsdatum + 14', faelligkeit('2026-06-01', 14) === '2026-06-15');
  ok('nicht überfällig vor Frist', tageUeberfaellig('2026-06-15', '2026-06-10') === 0);
  ok('überfällig: 5 Tage', tageUeberfaellig('2026-06-15', '2026-06-20') === 5);
  ok('Stufe 0 (offen) bei 0 Tagen', mahnstufe(0).stufe === 0 && mahnstufe(0).mahnbar === false);
  ok('Stufe 1 Zahlungserinnerung ab 1 Tag', mahnstufe(1).stufe === 1 && mahnstufe(1).label === 'Zahlungserinnerung');
  ok('Stufe 2 (1. Mahnung) ab 14 Tagen', mahnstufe(14).stufe === 2 && mahnstufe(14).label === '1. Mahnung');
  ok('Stufe 4 (3. Mahnung) ab 42 Tagen', mahnstufe(50).stufe === 4);
});

await section('Mahnwesen: Verzugszinsen (§288 BGB) & Pauschale', () => {
  // 1.000 € · 365 Tage · Basiszins 0 · B2B (9 %) = 90 € = 9000 Cent.
  ok('B2B 9 % p.a. (volljährig)', verzugszinsenCent(100000, 365, { basiszinsProzent: 0, b2b: true }) === 9000);
  ok('Verbraucher 5 % p.a.', verzugszinsenCent(100000, 365, { basiszinsProzent: 0, b2b: false }) === 5000);
  ok('Basiszins addiert (3 % → 12 % B2B)', verzugszinsenCent(100000, 365, { basiszinsProzent: 3, b2b: true }) === 12000);
  ok('zeitanteilig (halbes Jahr ~ Hälfte)', verzugszinsenCent(100000, 182, { basiszinsProzent: 0, b2b: true }) === Math.round(100000 * 0.09 * 182 / 365));
  ok('40-€-Pauschale nur B2B', mahnpauschaleCent(true) === 4000 && mahnpauschaleCent(false) === 0);
});

await section('Mahnwesen: Posten anreichern + Mahnschreiben-Daten', () => {
  const posten = [
    { id: 'a1', betragCent: 119000, datum: '2026-05-01', referenz: '2026-0007', name: 'Muster AG' }, // alt → überfällig
    { id: 'a2', betragCent: 50000, datum: '2026-06-14', referenz: '2026-0009', name: 'Neu GmbH' },   // frisch
  ];
  const heute = '2026-06-30';
  const ang = anreicherePosten(posten, { heute, zielTage: 14 });
  ok('a1 fällig 2026-05-15, überfällig', ang[0].faelligAm === '2026-05-15' && ang[0].ueberfaellig && ang[0].tageUeberfaellig === 46);
  ok('a1 Mahnstufe 3. Mahnung (≥42)', ang[0].mahnstufe.stufe === 4);
  ok('a2 (Frist 2026-06-28) leicht überfällig, Stufe 1', ang[1].tageUeberfaellig === 2 && ang[1].mahnstufe.stufe === 1);

  const sum = ueberfaelligSummen(ang);
  ok('Summen: 2 überfällig, 169000 Cent', sum.anzahl === 2 && sum.summeCent === 169000);

  const m = mahnschreibenDaten(ang[0], { heute, basiszinsProzent: 0, b2b: true, neueFristTage: 7 });
  ok('Mahnschreiben: Forderung + Zinsen + Pauschale', m.forderungCent === 119000 && m.zinsenCent > 0 && m.pauschaleCent === 4000);
  ok('Mahnschreiben: Gesamt = Summe der Posten', m.gesamtCent === m.forderungCent + m.zinsenCent + m.pauschaleCent);
  ok('Mahnschreiben: neue Frist heute+7', m.neueFrist === '2026-07-07' && m.stufeLabel === '3. Mahnung');

  // Bei bloßer Zahlungserinnerung (Stufe 1) keine Zinsen/Pauschale.
  const m2 = mahnschreibenDaten(ang[1], { heute, basiszinsProzent: 0, b2b: true });
  ok('Erinnerung ohne Zinsen/Pauschale', m2.zinsenCent === 0 && m2.pauschaleCent === 0);
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
