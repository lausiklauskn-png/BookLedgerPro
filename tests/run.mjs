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
import { baueBuchungZeilen, istAusgeglichen, validateBuchung, summeSeiten, stornoZeilen } from '../src/domain/journal.js';
import { hashBuchung, verifyChain, GENESIS, canonicalize } from '../src/domain/audit.js';
import { computeEUR, computeUStVoranmeldung, saldenliste } from '../src/domain/taxes.js';
import { seedAccounts } from '../src/domain/accounts.js';
import { extractFromText } from '../src/ai/extract.js';
import { categorize } from '../src/ai/categorize.js';
import { buildVorschlag } from '../src/ai/suggest.js';
import { auftragSummen, darfWechseln, validateAuftrag } from '../src/domain/orders.js';
import { rechnungZeilen } from '../src/domain/invoicing.js';
import { zeitSummen, formatDauer } from '../src/domain/employees.js';
import { kostenstellenAuswertung } from '../src/domain/costcenters.js';
import { buildLedgerCsv, buildDatevCsv, buildUstVa, centsToComma, ustVaToCsv } from '../src/domain/export.js';
import { buildKennzahlenText } from '../src/ai/taxAssist.js';

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

await section('Steuer-Assistent: Kennzahlen-Text (Datenminimierung)', () => {
  const va = { kz81: 20000, kz81Steuer: 3800, kz86: 0, kz86Steuer: 0, kz66: 1900, kz83: 1900 };
  const eur = { einnahmen: 20000, ausgaben: 10000, ueberschuss: 10000 };
  const txt = buildKennzahlenText(va, eur, { von: '2026-06-01', bis: '2026-06-30' });
  ok('Text enthält Zahllast', /Zahllast/.test(txt));
  ok('Text enthält Überschuss', /Überschuss/.test(txt));
  ok('Text enthält keine Kontonummern/Belege', !/4930|1576|Beleg/.test(txt));
});

console.log(`\n— ${passed} bestanden, ${failed} fehlgeschlagen —`);
process.exit(failed ? 1 : 0);
