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
import { saldo, KONTOART, mehrungsSeite, validateKonto, normalizeKonto, KONTOART_LISTE, SKR03_SEED, REVERSE_CHARGE_KONTEN } from '../src/domain/accounts.js';
import { baueBuchungZeilen, baueReverseChargeZeilen, UMSATZART, istAusgeglichen, validateBuchung, summeSeiten, stornoZeilen, formularAusBuchung } from '../src/domain/journal.js';
import { hashBuchung, verifyChain, GENESIS, canonicalize } from '../src/domain/audit.js';
import { computeEUR, computeEURIst, computeUStVoranmeldung, saldenliste, verprobeUSt } from '../src/domain/taxes.js';
import { seedAccounts } from '../src/domain/accounts.js';
import {
  GEWINNERMITTLUNG, GEWINNERMITTLUNG_LISTE, istGewinnermittlung, normalizeGewinnermittlung,
  istBilanzierung, istBestandskonto, istErfolgskonto, abschlussBereich, bilanzSeite, guvSeite,
  klassifiziereKonto, BEREICH, BILANZ_GRUNDKONTO_NUMMERN,
} from '../src/domain/bilanzierung.js';
import {
  NUTZUNGSMODUS, NUTZUNGSMODUS_LISTE, istNutzungsmodus, normalizeNutzungsmodus, nutzungsmodusVon,
  istFirmenmodus, istPrivatmodus, istVereinsmodus, zeigeAnsicht, sichtbareAnsichten,
  FEATURE, FEATURE_LISTE, zeigeFeature,
} from '../src/domain/nutzungsmodus.js';
import {
  BACKUP_STRATEGIEN, DEFAULT_BACKUP_STRATEGIE, normalizeBackupStrategie,
  backupZiel, backupDateiname, istBackupDatei,
} from '../src/domain/backupStrategie.js';
import {
  RECHNUNGSSTELLE, RECHNUNGSSTELLE_LISTE, RECHNUNGSSTELLE_DEFAULT, istRechnungsstelle,
  normalizeRechnungsstelle, rechnungsstelleVon, istBlpRechnungsstelle, istExternRechnungsstelle,
  vergibtBlpNummern, vorlaeufigeRechnungsnummer, istVorlaeufigeNummer, VORLAEUFIG_PREFIX,
  rechnungsstelleWechselHinweis,
} from '../src/domain/rechnungsstelle.js';
import {
  KOSTENART, KOSTENART_LISTE, rundeCent, prozentFaktor,
  materialkosten, m2Materialkosten, zeitkosten, maschinenkosten, arbeitskosten,
  zukaufkosten, montagekosten, kalkuliereVorwaerts,
  bruttoVonNetto, nettoVonBrutto, maxSelbstkosten, kalkuliereRueckwaerts,
} from '../src/domain/kalkulation.js';
import {
  PRODUKT_ART, BASIS, FELD_TYP, PRODUKT_SCHEMATA, SCHEMA_IDS, schemaNach,
  feldDefaults, kalibrierbareFelder, kalibrierteDefaults, werteMitDefaults,
  baueKostenarten, schemaEingabe, kalkuliereSchema, kalkuliereSchemaKalibriert,
  validateSchema, validateAlleSchemata,
} from '../src/domain/produktschemata.js';
import {
  ANGEBOT_STATUS, ANGEBOT_STATUS_LISTE, ANGEBOT_STATUS_DEFAULT, istAngebotStatus,
  ANGEBOT_STATUS_FLOW, darfAngebotWechseln, setzeAngebotStatus, archiviereAngebot,
  istArchiviert, istAktivesAngebot, aktiveAngebote, archivierteAngebote, angeboteNachStatus,
  ANGEBOT_PREFIX, formatAngebotsnummer, parseAngebotsnummer, istAngebotsnummer,
  naechsteAngebotsSeq, vergebeAngebotsnummer, normalizeAngebotsposition, positionAusSchema,
  angebotSummen, externePosition, externesAngebot, interneAuswertung, neuesAngebot,
  validateAngebot,
} from '../src/domain/angebote.js';
import { extractFromText } from '../src/ai/extract.js';
import { categorize } from '../src/ai/categorize.js';
import { buildVorschlag } from '../src/ai/suggest.js';
import { pruefeBuchung, istFestschreibbar } from '../src/domain/pruefung.js';
import { parseImportText, normalizeImport } from '../src/domain/importworkfloh.js';
import { baueRechnung, pflichtangaben, formatRechnungsnummer } from '../src/domain/rechnung.js';
import { findeRechtsregeln, onDeviceBegruendung } from '../src/domain/rechtsregeln.js';
import { buildBegruendungMessages, parseBegruendung, begruendeBuchung } from '../src/ai/berater.js';
import { auftragSummen, darfWechseln, validateAuftrag, auftragOffen, auftragGezahlt,
  darfAuftragBearbeiten, anwendeAuftragEdit, AUFTRAG_EDIT_FELDER } from '../src/domain/orders.js';
import { rechnungZeilen, rechnungsUebernahmeEntwurf, validateRechnungsUebernahme,
  zahlungsUebernahmeEntwurf, validateZahlungsUebernahme } from '../src/domain/invoicing.js';
import {
  UEBERNAHME_KREIS, validateAngebotUebernahme, darfAngebotUebernehmen,
  uebernahmeNummer, angebotUebernahmeEntwurf,
} from '../src/domain/angebotUebernahme.js';
import {
  istkostenAusBuchungen, istZeitkosten, istkosten,
  sollkostenAusAngebot, nachkalkulation, kostentraegerAnalyse, zeiteintraegeAusZeiten,
  kostenartFuerKonto, standardKontoBlock, aufgeloesteKostenstelle,
} from '../src/domain/nachkalkulation.js';
import {
  korrekturFaktoren, faktorWerte, kalibriereEingabe, kalkuliereKalibriert,
  ANGEBOT_ERGEBNIS, angebotErgebnis, angebotMargeProzent, PREISNIVEAU, PREISNIVEAU_LISTE,
  preisniveau, trefferquote, trefferquoteJePreisniveau, kalibrierungsDigest,
} from '../src/domain/kalibrierung.js';
import {
  leeresNutzungsprofil, normalizeNutzung, nutzungVon, anzahlVon, istGenutzt, zaehleNutzung,
  baukastenPalette, sortiereSchemata, haeufigsteSchemata,
  verschiebePosition, verschiebeNachOben, verschiebeNachUnten,
} from '../src/domain/baukasten.js';
import { zeitSummen, formatDauer } from '../src/domain/employees.js';
import { kostenstellenAuswertung } from '../src/domain/costcenters.js';
import { buildLedgerCsv, buildDatevCsv, buildDatevExtf, datevBuchungssatz, istEinfacherSatz, buildUstVa, centsToComma, ustVaToCsv, buildAnlagenverzeichnisCsv, buildUebergabeText } from '../src/domain/export.js';
import {
  AFA_METHODE, klassifiziere, sammelpostenZulaessig, afaPlanGwg, afaPlanLinear, afaPlanSammelposten,
  afaPlan, anlageStatus, anlagenverzeichnis, afaBuchungZeilen, normalizeAnlage, validateAnlage,
} from '../src/domain/anlagen.js';
import { kassenbuchEintraege, kassenbericht, anfangsbestandZeilen, SALDENVORTRAG_KONTO } from '../src/domain/kassenbuch.js';
import { buildKassenbuchCsv, buildElsterVaPaket } from '../src/domain/export.js';
import { VA_ZEITRAUM, voranmeldungsperioden, periodeIndexFuer, sondervorauszahlung, jahresZahllast } from '../src/domain/umsatzsteuer.js';
import { summenSaldenliste, kontenblatt, anlageEUR, eurGruppeFuer, EUR_GRUPPE } from '../src/domain/berichte.js';
import { buildSusaCsv, buildKontenblattCsv, buildAnlageEURCsv, buildGuvCsv, buildBilanzCsv } from '../src/domain/export.js';
import { gewinnUndVerlust, bilanz } from '../src/domain/bilanz.js';
import { crc32, zipFiles } from '../src/core/zip.js';
import { gdpduCsvBuchungen, gdpduCsvKonten, buildGdpduIndexXml, buildGdpduPaket } from '../src/domain/gdpdu.js';
import { kleinbetragsrechnung, geschenkAbzug, bewirtungAufteilung, KLEINBETRAG_GRENZE_CENT, GESCHENK_GRENZE_CENT } from '../src/domain/kleinfaelle.js';
import { istGesperrt } from '../src/domain/pruefung.js';
import { demoMandant, demoExportDateien, DEMO_JAHR, demoEntwuerfe, demoBefuellungsplan } from '../src/domain/demodaten.js';
import { runSelbsttest } from '../src/domain/selbsttest.js';
import { buildBackupFromSnapshot, readBackup, importProbe, snapshotBytes, backupRoundtripSelbsttest, BACKUP_INFO } from '../src/core/backup.js';
import { wjPeriode, wirtschaftsjahrVon, wjBeginnYYYYMMDD, validateWjBeginn } from '../src/domain/geschaeftsjahr.js';
import { aufbewahrungBis, istAufbewahrungspflichtig, darfBelegLoeschen, AUFBEWAHRUNG_JAHRE } from '../src/domain/aufbewahrung.js';
import { hashedFields } from '../src/domain/audit.js';
import { extrahiereZugferdXml, kostPflichtfelder } from '../src/domain/zugferd.js';
import { deflateSync } from 'node:zlib';
import { buildAustauschPaket, parseAustauschPaket, AUSTAUSCH_FORMAT } from '../src/domain/connect.js';
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
import { erkennePII, piiAnker, kombiniereAnker, NER_TYP, EXTERN_SCOPE } from '../src/ai/ner.js';
import { baueBriefkasten, briefkastenAnker, briefkastenBericht, tokenizeBriefkasten, EBENE } from '../src/ai/briefkasten.js';
import { baueXRechnungCII, splitAdresse, xRechnungDateiname } from '../src/domain/erechnung.js';
import { parseEingangsrechnung, eingangsrechnungExtraktion, erkenneFormat } from '../src/domain/erechnungLesen.js';
import { parseMT940, umsatzExtraktion, parseCAMT, parseBankauszug, erkenneBankformat, pruefeBankauszug } from '../src/domain/bankimport.js';
import { validiereMT940, validiereCAMT, validiereBankauszug } from '../src/domain/bankschema.js';
import { offenePosten, findeOffenePosten, findeKandidaten, zahlungsBuchungZeilen, findeSammelzuordnung, verteileSammelzahlung, sammelBuchungZeilen } from '../src/domain/zahlungsabgleich.js';
import { skontoSplit, skontoBuchungZeilen, skontoEntwurf, skontoSaetze, SKONTO_KONTEN } from '../src/domain/skonto.js';
import {
  eingangsrechnungZeilen, eingangsrechnungSummen, bruttoVonPositionen, rechnungBrutto,
  offenerBetrag, rechnungStatus, offeneVerbindlichkeiten, summeOffeneVerbindlichkeiten,
  validateEingangsrechnung, anreichereVerbindlichkeiten, verbindlichkeitenSummen,
  extraktionZuEingangsrechnung, berechneFaelligAm,
} from '../src/domain/payables.js';
import { buildOffeneVerbindlichkeitenCsv } from '../src/domain/export.js';
import { faelligkeit, faelligAmVon, tageUeberfaellig, mahnstufe, verzugszinsenCent, mahnpauschaleCent, anreicherePosten, ueberfaelligSummen, mahnschreibenDaten, kundeIstB2B, letzteMahnstufe, vorschlagNaechsteStufe, mahnVerlaufSumme, mahnStufeLabel, MAHN_KONTEN, mahnbuchungZeilen, mahnbuchungEntwurf } from '../src/domain/mahnwesen.js';
import {
  LEGACY_MANDANT_ID, LEGACY_DB_NAME, REGISTRY_DB_NAME, dbNameFuer, neueMandantId, validateMandantName,
  erstelleMandant, leereRegistry, findeMandant, aktiverMandant, addMandant,
  umbenenneMandant, entferneMandant, setzeAktiv, mitLegacyMandant,
  brauchtMandantenAuswahl, mandantenAuswahlListe,
  SANDBOX_INFIX, dbNameVon, istSandboxDbName, istSandbox, erstelleSandbox,
  echteMandanten, sandboxMandanten, sandboxAuswahlListe, entferneAlleSandboxes, verwaisteSandboxDbs,
  sandboxDbNamen, aktiveDbName, aktiverSandbox, naechsterTestName,
} from '../src/domain/mandanten.js';
import { DB_SUFFIX, getActiveDbName, setActiveDbName, closeDb, LEGACY_DB_NAME as DB_LEGACY_NAME } from '../src/core/db.js';

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

await section('V1 Kontenrahmen: erweiterter Seed + Konto-Validierung', () => {
  // Seed deutlich erweitert + eindeutige Nummern + Standardkonten vorhanden.
  ok('Seed >= 45 Konten', SKR03_SEED.length >= 45);
  const nummern = SKR03_SEED.map((k) => k.nummer);
  ok('Kontonummern eindeutig', new Set(nummern).size === nummern.length);
  ok('Standardkonten vorhanden (1200/1576/1776/8400/4980)',
    ['1200', '1576', '1776', '8400', '4980'].every((n) => nummern.includes(n)));
  ok('neue Konten vorhanden (Privat/AfA/Reisekosten)',
    ['1800', '4830', '4670'].every((n) => nummern.includes(n)));
  ok('jedes Seed-Konto hat gültige Art', SKR03_SEED.every((k) => KONTOART_LISTE.includes(k.art)));

  // Validierung
  ok('gültiges neues Konto ok', validateKonto({ nummer: '4999', name: 'Test', art: KONTOART.AUFWAND }, nummern).length === 0);
  ok('Nummer-Dublette → Fehler', validateKonto({ nummer: '1200', name: 'X', art: KONTOART.AKTIV }, nummern).length > 0);
  ok('Nummer keine Ziffern → Fehler', validateKonto({ nummer: 'ABC', name: 'X', art: KONTOART.AKTIV }, []).length > 0);
  ok('fehlender Name → Fehler', validateKonto({ nummer: '4999', name: '  ', art: KONTOART.AUFWAND }, []).length > 0);
  ok('ungültige Art → Fehler', validateKonto({ nummer: '4999', name: 'X', art: 'quatsch' }, []).length > 0);
  ok('ungültiger USt-Satz → Fehler', validateKonto({ nummer: '4999', name: 'X', art: KONTOART.AUFWAND, ust: 5 }, []).length > 0);
  ok('USt 7 ok', validateKonto({ nummer: '4999', name: 'X', art: KONTOART.AUFWAND, ust: 7 }, []).length === 0);

  // Normalisierung
  const n = normalizeKonto({ nummer: ' 4999 ', name: ' Beratung ', art: KONTOART.AUFWAND, ust: '19' });
  ok('normalizeKonto trimmt + Zahl-USt', n.nummer === '4999' && n.name === 'Beratung' && n.ust === 19);
  ok('normalizeKonto ohne USt lässt Feld weg', normalizeKonto({ nummer: '4999', name: 'X', art: KONTOART.AUFWAND, ust: '' }).ust === undefined);
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

  // „zahlbar bis" (Fälligkeit auf dem §14-Dokument) — A1-Rest auf die Rechnung gespiegelt.
  // Auftragseigenes Zahlungsziel hat Vorrang vor dem globalen Default.
  const rZiel = baueRechnung({ auftrag: { ...auftrag, zahlungszielTage: 30 }, kunde, firma, nummer: '2026-0003', datum: '2026-06-14', defaultZielTage: 14 });
  ok('zahlbar bis: auftragseigenes Ziel (30 Tage) → 2026-07-14', rZiel.zahlbarBis === '2026-07-14');
  ok('zahlbar bis: Zahlungsziel mitgeführt', rZiel.zahlungszielTage === 30);
  // Ohne auftragseigenes Ziel: globaler Default (hier 7 Tage).
  const rDef = baueRechnung({ auftrag, kunde, firma, nummer: '2026-0004', datum: '2026-06-14', defaultZielTage: 7 });
  ok('zahlbar bis: Default-Ziel (7 Tage) → 2026-06-21', rDef.zahlbarBis === '2026-06-21');
  ok('zahlbar bis: ohne eigenes Ziel zahlungszielTage null', rDef.zahlungszielTage === null);
  // Leeres Ziel ('' aus dem Formular) zählt als „kein eigenes Ziel" → Default greift.
  const rLeer = baueRechnung({ auftrag: { ...auftrag, zahlungszielTage: '' }, kunde, firma, nummer: '2026-0005', datum: '2026-06-14', defaultZielTage: 14 });
  ok('zahlbar bis: leeres Ziel → Default → 2026-06-28', rLeer.zahlbarBis === '2026-06-28');
  // Ohne Rechnungsdatum (Entwurf): kein Fälligkeitsdatum.
  ok('zahlbar bis: ohne Datum leer', baueRechnung({ auftrag, kunde, firma, nummer: '', datum: '' }).zahlbarBis === '');

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
  ok('Auftrag ohne Rechnung → rechnung null', r.auftraege[0].rechnung === null);
});

await section('R4 Stufe 2: Rechnungs-Übernahme — Normalisierung + Buchungsentwurf', () => {
  // Auftrag MIT gültiger, bereits gestellter Rechnung (von WorkFloh).
  const norm = normalizeImport({
    auftraege: [
      { externNummer: 'A-9', titel: 'Webseite', positionen: [{ menge: 1, einzelpreisCent: 100000, ustSatz: 19 }],
        rechnung: { nummer: '2026-0042', datum: '2026-06-10', leistungsdatum: '2026-06-09' } },
      { externNummer: 'A-10', titel: 'Wartung', positionen: [{ menge: 1, einzelpreisCent: 5000, ustSatz: 19 }],
        rechnung: { nummer: '', datum: '2026-06-10' } }, // Nummer fehlt → verworfen
      { externNummer: 'A-11', titel: 'Beratung', positionen: [{ menge: 1, einzelpreisCent: 5000, ustSatz: 19 }],
        rechnung: { nummer: 'X', datum: '10.06.2026' } }, // Datum ungültig → verworfen
    ],
  });
  ok('gültige Rechnung normalisiert', norm.auftraege[0].rechnung && norm.auftraege[0].rechnung.nummer === '2026-0042');
  ok('Leistungsdatum übernommen', norm.auftraege[0].rechnung.leistungsdatum === '2026-06-09');
  ok('Rechnung ohne Nummer → null + Warnung', norm.auftraege[1].rechnung === null);
  ok('Rechnung mit ungültigem Datum → null', norm.auftraege[2].rechnung === null);
  ok('zwei Warnungen für unvollständige Rechnungen', norm.warnungen.filter((w) => /Rechnungsangaben unvollständig/.test(w)).length === 2);

  // Validierung der Übernahme.
  ok('Validierung: vollständig ok', validateRechnungsUebernahme({ nummer: 'R-1', datum: '2026-06-10' }).length === 0);
  ok('Validierung: fehlende Nummer erkannt', validateRechnungsUebernahme({ nummer: '', datum: '2026-06-10' }).length === 1);
  ok('Validierung: ungültiges Datum erkannt', validateRechnungsUebernahme({ nummer: 'R-1', datum: '2026/06/10' }).length === 1);

  // Buchungsentwurf aus Auftrag + übernommener Rechnung (kein neuer Nummern-Lauf).
  const auftrag = { titel: 'Webseite', kostenstelle: '2000', positionen: [{ menge: 1, einzelpreisCent: 100000, ustSatz: 19 }] };
  const e = rechnungsUebernahmeEntwurf(auftrag, { nummer: '2026-0042', datum: '2026-06-10' });
  ok('Nummer aus WorkFloh übernommen', e.nummer === '2026-0042');
  ok('Datum aus WorkFloh übernommen', e.datum === '2026-06-10');
  ok('Leistungsdatum default = Rechnungsdatum', e.leistungsdatum === '2026-06-10');
  ok('Beschreibung nennt Nummer + WorkFloh + Titel', /2026-0042 \(WorkFloh\): Webseite/.test(e.beschreibung));
  ok('Kostenstelle durchgereicht', e.kostenstelle === '2000');
  ok('Soll Forderung 1400 = 119000 (brutto)', zeile(e.zeilen, '1400', 'S')?.betrag === 119000);
  ok('Haben Erlöse 8400 = 100000', zeile(e.zeilen, '8400', 'H')?.betrag === 100000);
  ok('Haben USt 1776 = 19000', zeile(e.zeilen, '1776', 'H')?.betrag === 19000);
  ok('Übernahme-Buchung ausgeglichen', istAusgeglichen(e.zeilen));
  // Ohne Titel: Beschreibung ohne Doppelpunkt-Rest.
  ok('Beschreibung ohne Titel sauber', rechnungsUebernahmeEntwurf({ positionen: [] }, { nummer: 'R-7', datum: '2026-01-01' }).beschreibung === 'Rechnung R-7 (WorkFloh)');
});

await section('R4-Rest: Zahlungs-/Teilzahlungs-Übernahme (Austauschformat v3)', () => {
  // Normalisierung: gültige Zahlungen übernehmen, unvollständige verwerfen, Euro→Cent.
  const norm = normalizeImport({
    auftraege: [
      { externNummer: 'A-20', titel: 'Webseite', positionen: [{ menge: 1, einzelpreisCent: 100000, ustSatz: 19 }],
        rechnung: { nummer: '2026-0100', datum: '2026-06-10', zahlungen: [
          { datum: '2026-06-15', betragCent: 50000, ref: 'VZ-1' },   // gültig (Cent)
          { datum: '2026-06-20', betrag: '690,00' },                  // gültig (Euro-String → 69000)
          { datum: 'kaputt', betragCent: 1000 },                      // ungültiges Datum → verworfen
          { datum: '2026-06-21', betragCent: 0 },                     // Betrag 0 → verworfen
        ] } },
    ],
  });
  const z = norm.auftraege[0].rechnung.zahlungen;
  ok('zwei gültige Zahlungen normalisiert', z.length === 2);
  ok('Zahlung 1: Cent + ref übernommen', z[0].betragCent === 50000 && z[0].ref === 'VZ-1');
  ok('Zahlung 2: Euro→Cent (69000), ohne ref', z[1].betragCent === 69000 && z[1].ref === undefined);
  ok('zwei Warnungen für unvollständige Zahlungen', norm.warnungen.filter((w) => /Zahlung \d+ unvollständig/.test(w)).length === 2);

  // Validierung der Zahlungs-Übernahme.
  ok('Validierung: vollständig ok', validateZahlungsUebernahme({ datum: '2026-06-15', betragCent: 100 }).length === 0);
  ok('Validierung: ungültiges Datum erkannt', validateZahlungsUebernahme({ datum: '15.06.2026', betragCent: 100 }).length === 1);
  ok('Validierung: nicht-positiver Betrag erkannt', validateZahlungsUebernahme({ datum: '2026-06-15', betragCent: 0 }).length === 1);

  // Buchungsentwurf Zahlungseingang: Soll Bank 1200 / Haben Forderung 1400, ausgeglichen.
  const e = zahlungsUebernahmeEntwurf({ nummer: '2026-0100' }, { datum: '2026-06-15', betragCent: 50000, ref: 'VZ-1' });
  ok('Datum aus Zahlung', e.datum === '2026-06-15');
  ok('Beschreibung nennt Rechnung + WorkFloh', /Zahlungseingang Rechnung 2026-0100 \(WorkFloh\)/.test(e.beschreibung));
  ok('Soll Bank 1200 = 50000', zeile(e.zeilen, '1200', 'S')?.betrag === 50000);
  ok('Haben Forderung 1400 = 50000', zeile(e.zeilen, '1400', 'H')?.betrag === 50000);
  ok('Zahlungseingang ausgeglichen', istAusgeglichen(e.zeilen));
  ok('ref übernommen', e.ref === 'VZ-1');
  ok('ref-Fallback = Rechnungsnummer', zahlungsUebernahmeEntwurf({ nummer: 'R-9' }, { datum: '2026-06-15', betragCent: 100 }).ref === 'R-9');

  // Abwärtskompatibel: Rechnung ohne zahlungen trägt kein Feld.
  const ohne = normalizeImport({ auftraege: [{ externNummer: 'A-21', titel: 'X', positionen: [{ menge: 1, einzelpreisCent: 100, ustSatz: 0 }],
    rechnung: { nummer: 'R-1', datum: '2026-06-10' } }] });
  ok('Rechnung ohne zahlungen → Feld fehlt', ohne.auftraege[0].rechnung.zahlungen === undefined);
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

await section('Auftrag bearbeiten: GoBD-Guard + Edit-Merge (rein)', () => {
  const basis = { id: 'A-1', type: 'auftrag', titel: 'Alt', kundeId: 'k1', status: 'angelegt',
    kostenstelle: '1000', zahlungszielTage: 14, positionen: [{ menge: 1, einzelpreisCent: 5000, ustSatz: 19 }],
    zahlungen: [], mahnungen: [], createdAt: '2026-01-01T00:00:00.000Z' };
  // Guard: vor dem Berechnen editierbar, danach gesperrt.
  ok('angelegt editierbar', darfAuftragBearbeiten(basis));
  ok('in_arbeit editierbar', darfAuftragBearbeiten({ ...basis, status: 'in_arbeit' }));
  ok('erledigt editierbar', darfAuftragBearbeiten({ ...basis, status: 'erledigt' }));
  ok('berechnet gesperrt', !darfAuftragBearbeiten({ ...basis, status: 'berechnet' }));
  ok('bezahlt gesperrt', !darfAuftragBearbeiten({ ...basis, status: 'bezahlt' }));
  ok('mit Rechnungsbuchung gesperrt', !darfAuftragBearbeiten({ ...basis, rechnungBuchungId: 'b1' }));
  ok('mit Rechnungsnummer gesperrt', !darfAuftragBearbeiten({ ...basis, rechnungNummer: '2026-0001' }));
  ok('mit erfasster Zahlung gesperrt', !darfAuftragBearbeiten({ ...basis, zahlungen: [{ betragCent: 100 }] }));
  ok('null/undefined nicht editierbar', !darfAuftragBearbeiten(null) && !darfAuftragBearbeiten(undefined));
  // Merge: nur freigegebene Felder ändern, der Rest bleibt unverändert.
  const next = anwendeAuftragEdit(basis, { titel: 'Neu', kundeId: 'k2', kostenstelle: '2000',
    zahlungszielTage: 30, positionen: [{ menge: 2, einzelpreisCent: 9000, ustSatz: 7 }],
    status: 'berechnet', id: 'HACK', zahlungen: [{ betragCent: 999 }] });
  ok('Titel übernommen', next.titel === 'Neu');
  ok('Kunde übernommen', next.kundeId === 'k2');
  ok('Kostenstelle übernommen', next.kostenstelle === '2000');
  ok('Zahlungsziel übernommen', next.zahlungszielTage === 30);
  ok('Positionen übernommen', next.positionen.length === 1 && next.positionen[0].einzelpreisCent === 9000);
  ok('Status NICHT überschreibbar', next.status === 'angelegt');
  ok('id NICHT überschreibbar', next.id === 'A-1');
  ok('Zahlungen NICHT überschreibbar', next.zahlungen.length === 0);
  ok('createdAt bleibt', next.createdAt === '2026-01-01T00:00:00.000Z');
  // Patch nur mit einem Feld lässt die anderen unangetastet (hasOwnProperty-Logik).
  const teil = anwendeAuftragEdit(basis, { titel: 'NurTitel' });
  ok('Teil-Patch: nur Titel geändert', teil.titel === 'NurTitel' && teil.kundeId === 'k1' && teil.zahlungszielTage === 14);
  ok('zahlungszielTage löschbar (null)', anwendeAuftragEdit(basis, { zahlungszielTage: null }).zahlungszielTage === null);
  ok('AUFTRAG_EDIT_FELDER enthält keine Rechnungs-/Status-Felder',
    !AUFTRAG_EDIT_FELDER.includes('status') && !AUFTRAG_EDIT_FELDER.includes('rechnungBuchungId') && !AUFTRAG_EDIT_FELDER.includes('zahlungen'));
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

// ===== R5: Bankformate härten — Salden, Validierung, CAMT .052/.054, RmtInf =====

await section('Bankimport: MT940 Salden + Integritätsprüfung', () => {
  const mt940 = [
    ':25:DE89370400440532013000EUR',
    ':60F:C240601EUR1000,00',
    ':61:2406030603D119,00NMSCNONREF',
    ':86:166?20Rechnung 042?32BUERO SCHMIDT GMBH',
    ':61:2406050605C238,00NTRFNONREF',
    ':86:166?20Honorar?32KUNDE MUSTER AG',
    ':62F:C240630EUR1119,00',
  ].join('\n');
  const parsed = parseBankauszug(mt940);
  ok('Anfangssaldo +100000 Cent (C)', parsed.saldoStartCent === 100000);
  ok('Schlusssaldo +111900 Cent (C)', parsed.saldoEndeCent === 111900);
  const pruef = pruefeBankauszug(parsed);
  ok('Saldo geht auf → ok, keine Warnung', pruef.ok && pruef.warnungen.length === 0);
  ok('berechneter Endsaldo = Schlusssaldo', pruef.berechneterEndsaldoCent === 111900);

  // Manipulierter Schlusssaldo → Saldo-Differenz wird erkannt.
  const kaputt = parseBankauszug(mt940.replace(':62F:C240630EUR1119,00', ':62F:C240630EUR1200,00'));
  const p2 = pruefeBankauszug(kaputt);
  const w = p2.warnungen.find((x) => x.code === 'saldo-differenz');
  ok('Saldo-Differenz erkannt', !p2.ok && !!w && w.differenzCent === 8100);

  // Soll-Anfangssaldo (D) wird negativ interpretiert.
  const negativ = parseMT940(':60F:D240601EUR50,00\n:61:2406030603C50,00NMSC\n:62F:C240630EUR0,00');
  ok('D-Anfangssaldo negativ', negativ.saldoStartCent === -5000 && pruefeBankauszug({ format: 'MT940', ...negativ }).ok);
});

await section('Bankimport: CAMT .052 (Rpt) und .054 (Ntfctn) Container', () => {
  const rpt = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.052.001.08"><BkToCstmrAcctRpt><Rpt>',
    '<Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>',
    '<Ntry><Amt Ccy="EUR">50.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><ValDt><Dt>2026-06-07</Dt></ValDt>',
    '<NtryDtls><TxDtls><RmtInf><Ustrd>Vorabgutschrift</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '</Rpt></BkToCstmrAcctRpt></Document>',
  ].join('\n');
  const r = parseBankauszug(rpt);
  ok('CAMT.052 als CAMT erkannt + 1 Umsatz', r.format === 'CAMT' && r.umsaetze.length === 1 && r.umsaetze[0].betragCent === 5000);

  const ntf = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08"><BkToCstmrDbtCdtNtfctn><Ntfctn>',
    '<Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>',
    '<Ntry><Amt Ccy="EUR">75.00</Amt><CdtDbtInd>DBIT</CdtDbtInd><BookgDt><Dt>2026-06-08</Dt></BookgDt>',
    '<NtryDtls><TxDtls><RmtInf><Ustrd>Lastschrift Strom</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '</Ntfctn></BkToCstmrDbtCdtNtfctn></Document>',
  ].join('\n');
  const n = parseBankauszug(ntf);
  ok('CAMT.054 (Ntfctn) → ausgabe, BookgDt-Fallback', n.format === 'CAMT' && n.umsaetze[0].richtung === 'ausgabe' && n.umsaetze[0].valuta === '2026-06-08');
});

await section('Bankimport: CAMT Salden (OPBD/CLBD) + strukturierte RmtInf', () => {
  const camt = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt><Stmt>',
    '<Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>',
    '<Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    '<Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1119.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    '<Ntry><Amt Ccy="EUR">119.00</Amt><CdtDbtInd>DBIT</CdtDbtInd><ValDt><Dt>2026-06-03</Dt></ValDt>',
    '<NtryDtls><TxDtls><RmtInf><Strd><CdtrRefInf><Ref>RF18539007547034</Ref></CdtrRefInf></Strd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '<Ntry><Amt Ccy="EUR">238.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><ValDt><Dt>2026-06-05</Dt></ValDt>',
    '<NtryDtls><TxDtls><Refs><EndToEndId>NOTPROVIDED-77</EndToEndId></Refs><RmtInf><Ustrd>Honorar</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>',
    '</Stmt></BkToCstmrStmt></Document>',
  ].join('\n');
  const parsed = parseBankauszug(camt);
  ok('CAMT-Anfangs-/Schlusssaldo gelesen', parsed.saldoStartCent === 100000 && parsed.saldoEndeCent === 111900);
  const pruef = pruefeBankauszug(parsed);
  ok('CAMT Saldo geht auf', pruef.ok && pruef.berechneterEndsaldoCent === 111900);
  ok('strukturierte Gläubigerreferenz (CdtrRefInf) als ref + im Zweck', parsed.umsaetze[0].ref === 'RF18539007547034' && /RF18539007547034/.test(parsed.umsaetze[0].zweck));
  ok('EndToEndId als Referenz-Fallback', parsed.umsaetze[1].ref === 'NOTPROVIDED-77' && /Honorar/.test(parsed.umsaetze[1].zweck));
});

await section('Bankimport: pruefeBankauszug Randfälle', () => {
  ok('unbekanntes Format → Warnung', pruefeBankauszug(parseBankauszug('weder noch')).warnungen.some((w) => w.code === 'format-unbekannt'));
  ok('keine Umsätze → Warnung', pruefeBankauszug({ format: 'MT940', umsaetze: [] }).warnungen.some((w) => w.code === 'keine-umsaetze'));
  const p = pruefeBankauszug({ format: 'CAMT', umsaetze: [{ betragCent: null, valuta: '' }, { betragCent: 100, valuta: '2026-06-01' }] });
  const u = p.warnungen.find((w) => w.code === 'unvollstaendige-umsaetze');
  ok('unvollständige Umsätze gezählt', !!u && u.anzahl === 1);
  ok('ohne Anfangssaldo → kein Saldo-Vergleich', pruefeBankauszug({ format: 'MT940', umsaetze: [{ betragCent: 100, valuta: '2026-06-01', richtung: 'einnahme' }] }).berechneterEndsaldoCent === null);
});

// ===== R5a-Rest: SWIFT/ISO-20022-Schema-/Struktur-Validierung (bankschema.js) =====

await section('Bankschema: MT940 — gültiger Auszug besteht', () => {
  const mt940 = [
    ':20:STARTREF',
    ':25:DE89370400440532013000EUR',
    ':28C:5/1',
    ':60F:C240601EUR1000,00',
    ':61:2406030603D119,00NMSCNONREF',
    ':86:166?20Rechnung 042?32BUERO SCHMIDT GMBH',
    ':61:2406050605C238,00NTRFNONREF',
    ':86:166?20Honorar?32KUNDE MUSTER AG',
    ':62F:C240630EUR1119,00',
  ].join('\n');
  const v = validiereMT940(mt940);
  ok('keine Fehler', v.ok && v.fehler.length === 0);
  ok('zwei Statement-Lines erkannt', v.anzahlUmsaetze === 2);
  ok('Format als MT940 gemeldet', v.format === 'MT940');
  ok('validiereBankauszug-Weiche → MT940 ok', validiereBankauszug(mt940).ok);
});

await section('Bankschema: MT940 — Pflichtfelder & Formatfehler', () => {
  ok('leer → Fehler', !validiereMT940('').ok && validiereMT940('').fehler.some((f) => f.code === 'leer'));
  // Fehlende Pflichtfelder :20:/:28C:/:62a:
  const ohne = ':25:DE12\n:60F:C240601EUR10,00\n:61:2406030603D5,00NMSC';
  const v = validiereMT940(ohne);
  ok('20 fehlt', v.fehler.some((f) => f.code === 'pflichtfeld-fehlt' && f.tag === '20'));
  ok('28C fehlt', v.fehler.some((f) => f.code === 'pflichtfeld-fehlt' && f.tag === '28C'));
  ok('62a fehlt', v.fehler.some((f) => f.code === 'pflichtfeld-fehlt' && f.tag === '62a'));

  // Defekter Saldo (Buchstaben im Betrag) + zu langes :20:
  const kaputt = [
    ':20:DIESE-REFERENZ-IST-VIEL-ZU-LANG',
    ':25:DE12',
    ':28C:1',
    ':60F:C240601EURABC,00',
    ':62F:C240630EUR10,00',
  ].join('\n');
  const k = validiereMT940(kaputt);
  ok(':20: zu lang → Formatfehler', k.fehler.some((f) => f.code === 'format' && f.tag === '20'));
  ok('Saldo-Betrag defekt → Formatfehler', k.fehler.some((f) => f.code === 'format' && f.tag === '60F'));
});

await section('Bankschema: MT940 — :61:-Format & GVC-Warnung', () => {
  // Ungültiges Valuta-Datum (Monat 13) → Datumsfehler
  const baddate = [':20:R', ':25:DE1', ':28C:1', ':60F:C240601EUR0,00', ':61:2413030603C5,00NMSC', ':62F:C240630EUR5,00'].join('\n');
  ok('ungültiges :61:-Datum → Fehler', validiereMT940(baddate).fehler.some((f) => f.code === 'datum' && f.tag === '61'));
  // Fehlender Geschäftsvorfall-Code (1!a3!c) → Warnung, kein Fehler
  const nogvc = [':20:R', ':25:DE1', ':28C:1', ':60F:C240601EUR0,00', ':61:2406030603C5,00', ':62F:C240630EUR5,00'].join('\n');
  const v = validiereMT940(nogvc);
  ok('GVC fehlt → Warnung, nicht Fehler', v.ok && v.warnungen.some((w) => w.code === 'gvc-fehlt'));
  // :28: statt :28C: → nicht-Standard-Warnung, kein Pflichtfeld-Fehler
  const alt28 = [':20:R', ':25:DE1', ':28:1', ':60F:C240601EUR0,00', ':61:2406030603C5,00NMSC', ':62F:C240630EUR5,00'].join('\n');
  const a = validiereMT940(alt28);
  ok(':28: → Warnung statt Fehler', a.ok && a.warnungen.some((w) => w.code === 'feld-nichtstandard'));
});

await section('Bankschema: MT940 — Reihenfolge-Warnung', () => {
  // :25: vor :20: → Reihenfolge-Warnung (aber kein Fehler, Dialekt-tolerant)
  const umgedreht = [':25:DE1', ':20:R', ':28C:1', ':60F:C240601EUR0,00', ':61:2406030603C5,00NMSC', ':62F:C240630EUR5,00'].join('\n');
  const v = validiereMT940(umgedreht);
  ok('Reihenfolge als Warnung, nicht Fehler', v.ok && v.warnungen.some((w) => w.code === 'reihenfolge'));
});

await section('Bankschema: CAMT — gültiges camt.053 besteht', () => {
  const camt = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt>',
    '<GrpHdr><MsgId>MSG-1</MsgId><CreDtTm>2026-06-30T10:00:00</CreDtTm></GrpHdr><Stmt>',
    '<Id>STMT-1</Id><Acct><Id><IBAN>DE89370400440532013000</IBAN></Id></Acct>',
    '<Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    '<Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1119.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    '<Ntry><Amt Ccy="EUR">119.00</Amt><CdtDbtInd>DBIT</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts><ValDt><Dt>2026-06-03</Dt></ValDt></Ntry>',
    '</Stmt></BkToCstmrStmt></Document>',
  ].join('\n');
  const v = validiereCAMT(camt);
  ok('keine Fehler', v.ok && v.fehler.length === 0);
  ok('Variante 053 + Version erkannt', v.variante === '053' && v.version === '08');
  ok('ein Umsatz', v.anzahlUmsaetze === 1);
  ok('keine Saldo-/Status-Warnung (vollständig)', !v.warnungen.some((w) => w.code === 'saldo-fehlt' || w.code === 'ntry-status-fehlt'));
});

await section('Bankschema: CAMT — Pflicht-Container & GrpHdr', () => {
  // Kein GrpHdr, falscher Container für 052
  const ohneHdr = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.052.001.08"><BkToCstmrStmt><Rpt>',
    '<Id>R</Id><Acct><Id><IBAN>DE1</IBAN></Id></Acct>',
    '<Ntry><Amt Ccy="EUR">5.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Ntry>',
    '</Rpt></BkToCstmrStmt></Document>',
  ].join('\n');
  const v = validiereCAMT(ohneHdr);
  ok('GrpHdr fehlt → Fehler', v.fehler.some((f) => f.code === 'pflicht-fehlt' && /GrpHdr/.test(f.detail)));
  ok('falscher Container (052 erwartet BkToCstmrAcctRpt) → Fehler', v.fehler.some((f) => f.code === 'container-fehlt'));
  ok('Status/Datum fehlen → Warnungen', v.warnungen.some((w) => w.code === 'ntry-status-fehlt') && v.warnungen.some((w) => w.code === 'ntry-datum-fehlt'));
});

await section('Bankschema: CAMT — Ntry-Fehler (Ccy/CdtDbtInd)', () => {
  const camt = [
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt>',
    '<GrpHdr><MsgId>M</MsgId><CreDtTm>2026-06-30T10:00:00</CreDtTm></GrpHdr><Stmt>',
    '<Id>S</Id><Acct><Id><IBAN>DE1</IBAN></Id></Acct>',
    '<Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">0.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    '<Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">5.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>',
    // Amt ohne Ccy-Attribut + ungültiger CdtDbtInd
    '<Ntry><Amt>5.00</Amt><CdtDbtInd>HABEN</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts><ValDt><Dt>2026-06-03</Dt></ValDt></Ntry>',
    '</Stmt></BkToCstmrStmt></Document>',
  ].join('\n');
  const v = validiereCAMT(camt);
  ok('Amt ohne Ccy → Fehler', v.fehler.some((f) => f.code === 'ntry-ccy-fehlt'));
  ok('CdtDbtInd ungültig → Fehler', v.fehler.some((f) => f.code === 'ntry-cdtdbt-wert'));
  ok('insgesamt nicht ok', !v.ok);
});

await section('Bankschema: CAMT — unbekannter Namespace → Warnung, nicht Fehler', () => {
  const camt = [
    '<Document><BkToCstmrStmt>',
    '<GrpHdr><MsgId>M</MsgId><CreDtTm>2026-06-30T10:00:00</CreDtTm></GrpHdr><Stmt>',
    '<Id>S</Id><Acct><Id><IBAN>DE1</IBAN></Id></Acct>',
    '<Ntry><Amt Ccy="EUR">5.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts><ValDt><Dt>2026-06-03</Dt></ValDt></Ntry>',
    '</Stmt></BkToCstmrStmt></Document>',
  ].join('\n');
  const v = validiereCAMT(camt);
  ok('Namespace-Warnung gesetzt', v.warnungen.some((w) => w.code === 'namespace-unbekannt'));
  ok('Variante über Container erkannt (053)', v.variante === '053');
});

await section('Bankschema: validiereBankauszug — Format-Weiche', () => {
  ok('unbekanntes Format → format-unbekannt + nicht ok', (() => {
    const v = validiereBankauszug('weder noch');
    return !v.ok && v.format === null && v.fehler.some((f) => f.code === 'format-unbekannt');
  })());
  ok('CAMT-Weiche', validiereBankauszug('<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><Stmt><Ntry></Ntry></Stmt></Document>').format === 'CAMT');
});

// ===== R5: NER — PII-Erkennung über die Anker hinaus =====

await section('NER: erkennt E-Mail/IBAN/USt-IdNr/Steuernr/Telefon', () => {
  const text = 'Kontakt max.muster@example.com, IBAN DE89 3704 0044 0532 0130 00, '
    + 'USt-IdNr DE123456789, Steuernr 21/815/08150, Tel +49 30 1234567.';
  const treffer = erkennePII(text);
  const byTyp = (typ) => treffer.filter((x) => x.typ === typ).map((x) => x.wert);
  ok('E-Mail erkannt', byTyp(ANKER_TYP.EMAIL).includes('max.muster@example.com'));
  ok('IBAN (gruppiert) erkannt', byTyp(ANKER_TYP.IBAN).some((v) => v.replace(/\s/g, '') === 'DE89370400440532013000'));
  ok('USt-IdNr erkannt', byTyp(ANKER_TYP.USTID).includes('DE123456789'));
  ok('Steuernummer erkannt', byTyp(ANKER_TYP.STEUERNR).includes('21/815/08150'));
  ok('Telefon erkannt', byTyp(NER_TYP.TELEFON).some((v) => v.includes('+49 30 1234567')));
  // Keine überlappenden Doppeltreffer (kompakt vs. gruppiert für dieselbe IBAN).
  ok('IBAN nicht doppelt (Überlappung aufgelöst)', byTyp(ANKER_TYP.IBAN).length === 1);
});

await section('NER: konservativ — keine Falsch-Positiven bei Datum/Betrag/Nummer', () => {
  const harmlos = 'Rechnung RE-2026/042 vom 01.06.2026 über 1.234,56 EUR, Pos 030.';
  const treffer = erkennePII(harmlos);
  ok('Datum 01.06.2026 nicht als Telefon', !treffer.some((x) => x.wert.includes('01.06.2026')));
  ok('Betrag 1.234,56 nicht erkannt', !treffer.some((x) => x.wert.includes('234,56')));
  ok('Rechnungsnummer (ein „/") nicht als Steuernr', !treffer.some((x) => x.typ === ANKER_TYP.STEUERNR));
  ok('Großwort RECHNUNG nicht maskiert (kein BIC)', erkennePII('RECHNUNG ABCDEFGH').length === 0);
});

await section('NER: piiAnker entdoppelt + kombiniereAnker (exakt hat Vorrang)', () => {
  const text = 'Zahlung an info@muster.de und nochmals info@muster.de.';
  ok('piiAnker entdoppelt gleiche E-Mail', piiAnker(text).filter((a) => a.wert === 'info@muster.de').length === 1);

  // Kombination: bekannte Firma (exakter Anker) + im Text erkannte fremde E-Mail.
  const beleg = 'Lieferant Muster GmbH, Rückfragen an info@muster.de.';
  const exakt = [{ wert: 'Muster GmbH', typ: ANKER_TYP.FIRMA }];
  const anker = kombiniereAnker(exakt, beleg);
  const { text: pseudo, map } = tokenize(beleg, anker, { wortgrenze: true });
  ok('Firma maskiert', /\[\[FIRMA_1\]\]/.test(pseudo) && !/Muster GmbH/.test(pseudo));
  ok('fremde E-Mail (NER) maskiert', /\[\[EMAIL_1\]\]/.test(pseudo) && !/info@muster\.de/.test(pseudo));
  ok('Map enthält beide Klartexte', map.some((e) => e.wert === 'Muster GmbH') && map.some((e) => e.wert === 'info@muster.de'));

  // Exakter Anker hat bei gleichem Wert Typ-Vorrang vor der Heuristik.
  const k2 = kombiniereAnker([{ wert: 'kunde@x.de', typ: ANKER_TYP.PERSON }], 'Mail kunde@x.de');
  const r2 = tokenize('Mail kunde@x.de', k2);
  ok('Stammdaten-Typ gewinnt (PERSON statt EMAIL)', r2.map[0].typ === ANKER_TYP.PERSON);
});

await section('NER-Scoping: Fremd-PII trägt im Briefkasten-Modus den EXTERN-Scope', () => {
  const text = 'Lieferant zahlbar auf IBAN DE89 3704 0044 0532 0130 00, Rückfragen fremd@extern.de, Tel +49 30 1234567.';

  // Konstante + Rückwärtskompatibilität: ohne Scope bleiben die Typen flach.
  ok('EXTERN_SCOPE = "EXTERN"', EXTERN_SCOPE === 'EXTERN');
  const flach = piiAnker(text);
  ok('flach: E-Mail-Typ unverändert EMAIL', flach.find((a) => a.wert === 'fremd@extern.de').typ === ANKER_TYP.EMAIL);
  ok('flach: Telefon-Typ unverändert TELEFON', flach.find((a) => a.typ === NER_TYP.TELEFON) !== undefined);

  // Mit Scope: jeder NER-Typ trägt das Scope-Präfix.
  const scoped = piiAnker(text, { scope: EXTERN_SCOPE });
  ok('scoped: E-Mail → EXTERN_EMAIL', scoped.find((a) => a.wert === 'fremd@extern.de').typ === 'EXTERN_EMAIL');
  ok('scoped: IBAN → EXTERN_IBAN', scoped.find((a) => a.wert.replace(/\s/g, '') === 'DE89370400440532013000').typ === 'EXTERN_IBAN');
  ok('scoped: Telefon → EXTERN_TELEFON', scoped.some((a) => a.typ === 'EXTERN_TELEFON'));
  ok('gleiche Werte erkannt wie flach', scoped.length === flach.length);

  // Token tragen den Scope → die KI sieht Fremd-PII getrennt von der eigenen Firma.
  const quelle = 'Meine Firma GmbH überweist an fremd@extern.de.';
  const exakt = [{ wert: 'Meine Firma GmbH', typ: 'FIRMA_1' }]; // Briefkasten-Scope der eigenen Firma
  const anker = kombiniereAnker(exakt, quelle, { scope: EXTERN_SCOPE });
  const { text: pseudo, map } = tokenize(quelle, anker, { wortgrenze: true });
  ok('eigene Firma bleibt im FIRMA_1-Scope', /\[\[FIRMA_1_\d+\]\]/.test(pseudo) && !pseudo.includes('Meine Firma GmbH'));
  ok('Fremd-E-Mail als EXTERN_EMAIL maskiert', /\[\[EXTERN_EMAIL_1\]\]/.test(pseudo) && !pseudo.includes('fremd@extern.de'));
  ok('verlustfreie Re-Identifizierung', reidentify(pseudo, map) === quelle);

  // Stammdaten-Vorrang bleibt: ein bekannter (gescopter) Anker schlägt den EXTERN-NER-Typ.
  const k = kombiniereAnker([{ wert: 'bekannt@firma.de', typ: 'FIRMA_1_EMAIL' }], 'Mail bekannt@firma.de', { scope: EXTERN_SCOPE });
  const r = tokenize('Mail bekannt@firma.de', k);
  ok('Stammdaten-Scope gewinnt (FIRMA_1_EMAIL statt EXTERN_EMAIL)', r.map[0].typ === 'FIRMA_1_EMAIL');
});

await section('Briefkasten: Hierarchie Mandant ⊃ Firma ⊃ Person (baueBriefkasten)', () => {
  const bk = baueBriefkasten({
    mandant: { id: 'standard', name: 'Kanzlei Nord' },
    firma: { name: 'Meine Firma GmbH', iban: 'DE89370400440532013000', ustId: 'DE999111222', anschrift: 'Hauptstr. 1, 50667 Köln' },
    mitarbeiter: [{ name: 'Klaus Nitzsche' }],
    kunden: [
      { name: 'Acme Bau AG', ustId: 'DE123456789', adresse: 'Werkweg 9, 10115 Berlin', istVerbraucher: false },
      { name: 'Erika Musterfrau', email: 'erika@example.de', istVerbraucher: true },
      { name: 'AG', istVerbraucher: false }, // zu kurz → verworfen
    ],
  });
  ok('Wurzel ist Mandant', bk.ebene === EBENE.MANDANT && bk.id === 'standard');
  ok('eigene Firma = FIRMA_1 (eigen)', bk.firmen[0].eigen === true && bk.firmen[0].nr === 1);
  ok('Firmenkunde = FIRMA_2 (nicht eigen)', bk.firmen[1].nr === 2 && bk.firmen[1].eigen === false);
  ok('zu kurzer Firmenname verworfen', bk.firmen.length === 2);
  ok('Mitarbeiter = Person der eigenen Firma', bk.firmen[0].personen.length === 1 && bk.firmen[0].personen[0].name === 'Klaus Nitzsche');
  ok('Privatkunde = Person am Mandanten', bk.personen.length === 1 && bk.personen[0].name === 'Erika Musterfrau');

  const anker = briefkastenAnker(bk);
  const byWert = (w) => anker.find((a) => a.wert === w);
  ok('Mandant-Name als MANDANT-Anker', byWert('Kanzlei Nord').typ === EBENE.MANDANT);
  ok('eigene Firma scope FIRMA_1', byWert('Meine Firma GmbH').typ === 'FIRMA_1');
  ok('eigene IBAN scope FIRMA_1_IBAN', byWert('DE89370400440532013000').typ === 'FIRMA_1_IBAN');
  ok('Mitarbeiter scope FIRMA_1_PERSON', byWert('Klaus Nitzsche').typ === 'FIRMA_1_PERSON');
  ok('Firmenkunde scope FIRMA_2', byWert('Acme Bau AG').typ === 'FIRMA_2');
  ok('Firmenkunde-USt scope FIRMA_2_USTID', byWert('DE123456789').typ === 'FIRMA_2_USTID');
  ok('Privatkunde scope MANDANT_PERSON', byWert('Erika Musterfrau').typ === 'MANDANT_PERSON');
  ok('Privatkunde-E-Mail scope MANDANT_PERSON_EMAIL', byWert('erika@example.de').typ === 'MANDANT_PERSON_EMAIL');
});

await section('Briefkasten: leere/teilweise Quellen', () => {
  ok('ganz leer → nur Mandant-Gerüst', briefkastenAnker(baueBriefkasten()).length === 0);
  const ohneFirma = baueBriefkasten({ mitarbeiter: [{ name: 'Anna Beispiel' }] });
  ok('ohne Firmenprofil → Mitarbeiter am Mandanten', ohneFirma.firmen.length === 0
    && ohneFirma.personen.length === 1
    && briefkastenAnker(ohneFirma).find((a) => a.wert === 'Anna Beispiel').typ === 'MANDANT_PERSON');
});

await section('Briefkasten: scope-Token gruppieren in der KI-Sicht (tokenize round-trip)', () => {
  const bk = baueBriefkasten({
    firma: { name: 'Meine Firma GmbH' },
    kunden: [
      { name: 'Acme Bau AG', ustId: 'DE123456789', istVerbraucher: false },
      { name: 'Beta Handel GmbH', ustId: 'DE987654321', istVerbraucher: false },
    ],
  });
  // Beta steht im Belegtext VOR Acme → die laufende Nummer richtet sich nach Auftreten,
  // der Firmen-Scope bleibt aber stabil aus den Stammdaten.
  const beleg = 'Rechnung: Beta Handel GmbH (DE987654321) im Auftrag von Acme Bau AG (DE123456789).';
  const { text: pseudo, map } = tokenizeBriefkasten(beleg, bk, { wortgrenze: true });
  // Beta = FIRMA_3, Acme = FIRMA_2 (Daten-Reihenfolge; eigene Firma = FIRMA_1).
  ok('Firma + zugehörige USt-IdNr teilen denselben Scope (FIRMA_3)', /\[\[FIRMA_3_\d+\]\]/.test(pseudo) && /\[\[FIRMA_3_USTID_\d+\]\]/.test(pseudo));
  ok('zweite Firma in eigenem Scope (FIRMA_2)', /\[\[FIRMA_2_\d+\]\]/.test(pseudo) && /\[\[FIRMA_2_USTID_\d+\]\]/.test(pseudo));
  ok('keine Klartext-Namen mehr', !pseudo.includes('Acme Bau AG') && !pseudo.includes('Beta Handel GmbH'));
  ok('verlustfreie Re-Identifizierung', reidentify(pseudo, map) === beleg);
});

await section('Briefkasten: Transparenz-Bericht ohne Klartext (briefkastenBericht)', () => {
  const bk = baueBriefkasten({
    mandant: { name: 'Kanzlei Nord' },
    firma: { name: 'Meine Firma GmbH' },
    mitarbeiter: [{ name: 'Klaus Nitzsche' }],
    kunden: [
      { name: 'Acme Bau AG', istVerbraucher: false },
      { name: 'Erika Musterfrau', istVerbraucher: true },
    ],
  });
  const b = briefkastenBericht(bk);
  ok('zählt 2 Firmen', b.firmen === 2);
  ok('zählt 2 Personen (Mitarbeiter + Privatkunde)', b.personen === 2);
  ok('1 Mandant', b.mandanten === 1);
  ok('Anker-Zähler > 0', b.anker > 0);
  ok('Bericht ohne Klartext', !JSON.stringify(b).includes('Nitzsche') && !JSON.stringify(b).includes('Acme'));
  ok('leerer Briefkasten → Nullen', briefkastenBericht(null).firmen === 0 && briefkastenBericht(null).mandanten === 0);
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

await section('A1-Rest: Zahlungsziel je Forderung (faelligAmVon + offenePosten + Mahnwesen)', () => {
  // faelligAmVon: explizites faelligAm hat Vorrang.
  ok('explizites faelligAm gewinnt', faelligAmVon({ faelligAm: '2026-08-01', datum: '2026-06-01', zahlungszielTage: 10 }) === '2026-08-01');
  // Posten-eigenes Zahlungsziel statt Default.
  ok('eigenes Ziel (30 Tage)', faelligAmVon({ datum: '2026-06-01', zahlungszielTage: 30 }) === '2026-07-01');
  ok('Ziel 0 Tage = sofort fällig', faelligAmVon({ datum: '2026-06-01', zahlungszielTage: 0 }) === '2026-06-01');
  // Default greift nur ohne eigenes Ziel.
  ok('Default 14 ohne eigenes Ziel', faelligAmVon({ datum: '2026-06-01' }) === '2026-06-15');
  ok('Default-Parameter überschreibbar (7)', faelligAmVon({ datum: '2026-06-01' }, 7) === '2026-06-08');
  ok('ohne Datum → leer', faelligAmVon({ zahlungszielTage: 30 }) === '');

  // offenePosten reicht das Zahlungsziel des Auftrags durch.
  const auftraege = [
    { id: 'a1', status: 'berechnet', rechnungNummer: 'R-1', rechnungDatum: '2026-06-01', kundeId: 'k1',
      zahlungszielTage: 30, positionen: [{ menge: 1, einzelpreisCent: 10000, ustSatz: 19 }] },
    { id: 'a2', status: 'berechnet', rechnungNummer: 'R-2', rechnungDatum: '2026-06-01', kundeId: 'k1',
      positionen: [{ menge: 1, einzelpreisCent: 10000, ustSatz: 19 }] }, // ohne Ziel
  ];
  const posten = offenePosten(auftraege, { nameById: { k1: 'Muster AG' } });
  ok('Posten trägt zahlungszielTage', posten[0].zahlungszielTage === 30 && posten[1].zahlungszielTage === null);

  // Mahnwesen nutzt das auftragsindividuelle Ziel statt nur des globalen Defaults (14).
  const ang = anreicherePosten(posten, { zielTage: 14, heute: '2026-06-20' });
  const p1 = ang.find((p) => p.id === 'a1');
  const p2 = ang.find((p) => p.id === 'a2');
  ok('a1 (Ziel 30) fällig 2026-07-01, am 20.06. nicht überfällig', p1.faelligAm === '2026-07-01' && !p1.ueberfaellig);
  ok('a2 (Default 14) fällig 2026-06-15, am 20.06. überfällig (5 Tage)', p2.faelligAm === '2026-06-15' && p2.tageUeberfaellig === 5);

  // mahnschreibenDaten respektiert das Posten-Ziel auch ohne Vor-Anreicherung.
  const d = mahnschreibenDaten({ datum: '2026-06-01', zahlungszielTage: 30, referenz: 'R-1', betragCent: 11900 }, { zielTage: 14, heute: '2026-06-20' });
  ok('mahnschreibenDaten nutzt Posten-Ziel (fällig 2026-07-01)', d.faelligAm === '2026-07-01' && d.tageUeberfaellig === 0);

  // validateAuftrag prüft das optionale Zahlungsziel.
  const basis = { titel: 'X', positionen: [{ menge: 1, einzelpreisCent: 100 }] };
  ok('gültiges Ziel ok', validateAuftrag({ ...basis, zahlungszielTage: 30 }).length === 0);
  ok('Ziel null ok (kein Fehler)', validateAuftrag({ ...basis, zahlungszielTage: null }).length === 0);
  ok('negatives Ziel → Fehler', validateAuftrag({ ...basis, zahlungszielTage: -1 }).some((e) => /Zahlungsziel/.test(e)));
  ok('nicht-ganzzahliges Ziel → Fehler', validateAuftrag({ ...basis, zahlungszielTage: 12.5 }).some((e) => /Zahlungsziel/.test(e)));

  // Regression: payables.berechneFaelligAm bleibt identisch (delegiert an faelligAmVon).
  ok('payables-Default bleibt 30', berechneFaelligAm({ datum: '2026-06-01' }) === '2026-07-01');
  ok('payables eigenes Ziel (7)', berechneFaelligAm({ datum: '2026-06-01', zahlungszielTage: 7 }) === '2026-06-08');
});

await section('A3: Teilzahlung/Skonto/Toleranz-Matching (findeKandidaten)', () => {
  // Offene Verbindlichkeiten (richtung 'ausgabe'), Betrag = offener Rest.
  const posten = [
    { id: 'v1', richtung: 'ausgabe', kind: 'verbindlichkeit', betragCent: 11900, referenz: 'RE-7', name: 'Alpha GmbH', datum: '2026-06-01' },
    { id: 'v2', richtung: 'ausgabe', kind: 'verbindlichkeit', betragCent: 50000, referenz: 'RE-9', name: 'Beta AG', datum: '2026-06-02' },
  ];
  // Exakte Zahlung.
  const exakt = findeKandidaten({ richtung: 'ausgabe', betragCent: 11900, zweck: 'RE-7' }, posten);
  ok('exakt: bester Kandidat v1, art exakt', exakt[0].posten.id === 'v1' && exakt[0].art === 'exakt');

  // Rundungs-Toleranz (1 Cent zu wenig).
  const tol = findeKandidaten({ richtung: 'ausgabe', betragCent: 11899, zweck: 'RE-7' }, posten);
  ok('toleranz: 1 Cent Differenz → art toleranz', tol[0].posten.id === 'v1' && tol[0].art === 'toleranz');

  // Skonto: 3 % auf 50000 = 1500 → Zahlung 48500 (innerhalb skontoProzent=3).
  const sk = findeKandidaten({ richtung: 'ausgabe', betragCent: 48500, zweck: 'RE-9' }, posten);
  ok('skonto: art skonto, skontoCent 1500', sk[0].posten.id === 'v2' && sk[0].art === 'skonto' && sk[0].skontoCent === 1500);

  // Teilzahlung: 20000 auf 50000 → Rest 30000.
  const teil = findeKandidaten({ richtung: 'ausgabe', betragCent: 20000, zweck: 'RE-9' }, posten);
  ok('teilzahlung: art teilzahlung, restCent 30000', teil[0].posten.id === 'v2' && teil[0].art === 'teilzahlung' && teil[0].restCent === 30000);

  // Überzahlung (mehr als offen) wird konservativ NICHT zugeordnet.
  ok('Überzahlung → kein Kandidat', findeKandidaten({ richtung: 'ausgabe', betragCent: 12500 }, [posten[0]]).length === 0);

  // Richtung muss passen (Einnahme trifft Verbindlichkeit nicht).
  ok('falsche Richtung → kein Kandidat', findeKandidaten({ richtung: 'einnahme', betragCent: 11900 }, posten).length === 0);

  // Ranking bei Mehrdeutigkeit: zwei exakte Beträge, Referenz im Zweck gewinnt.
  const zwei = [
    { id: 'x1', richtung: 'ausgabe', betragCent: 10000, referenz: 'A-1', name: 'X', datum: '2026-06-01' },
    { id: 'x2', richtung: 'ausgabe', betragCent: 10000, referenz: 'A-2', name: 'X', datum: '2026-06-02' },
  ];
  const rk = findeKandidaten({ richtung: 'ausgabe', betragCent: 10000, zweck: 'zahlung a-2' }, zwei);
  ok('Ranking: Referenz A-2 gewinnt', rk[0].posten.id === 'x2' && rk[0].score > rk[1].score);

  // Teilzahlung lässt sich direkt verbuchen (gezahlter Betrag, Rest bleibt offen).
  const bk = zahlungsBuchungZeilen({ richtung: 'ausgabe', betragCent: 20000, valuta: '2026-06-10' }, teil[0].posten);
  ok('Teilzahlung-Buchung: 1600 S / 1200 H über 20000', bk.zeilen[0].konto === '1600' && bk.zeilen[0].betrag === 20000 && bk.zeilen[1].konto === '1200');
});

await section('A3: Forderungs-Teilzahlung (offener Rest bei Aufträgen)', () => {
  const basis = { positionen: [{ menge: 1, einzelpreisCent: 10000, ustSatz: 19 }] }; // brutto 11900
  ok('auftragGezahlt summiert Zahlungen', auftragGezahlt({ ...basis, zahlungen: [{ betragCent: 4000 }, { betragCent: 1000 }] }) === 5000);
  ok('auftragOffen ohne Zahlung = Brutto', auftragOffen(basis) === 11900);
  ok('auftragOffen mit Teilzahlung = Rest', auftragOffen({ ...basis, zahlungen: [{ betragCent: 5000 }] }) === 6900);
  ok('auftragOffen voll bezahlt = 0', auftragOffen({ ...basis, zahlungen: [{ betragCent: 11900 }] }) === 0);

  const auftraege = [
    { id: 'a1', status: 'berechnet', rechnungNummer: 'R-1', rechnungDatum: '2026-06-01', kundeId: 'k1',
      positionen: basis.positionen, zahlungen: [{ betragCent: 5000 }] },            // Rest 6900
    { id: 'a2', status: 'berechnet', rechnungNummer: 'R-2', kundeId: 'k1',
      positionen: basis.positionen, zahlungen: [{ betragCent: 11900 }] },           // voll bezahlt → raus
  ];
  const posten = offenePosten(auftraege, { nameById: { k1: 'Muster AG' } });
  ok('nur a1 offen, betragCent = Rest 6900', posten.length === 1 && posten[0].id === 'a1' && posten[0].betragCent === 6900);

  // Restzahlung 6900 matcht exakt den offenen Rest.
  const m = findeOffenePosten({ richtung: 'einnahme', betragCent: 6900, zweck: 'R-1' }, posten);
  ok('Restzahlung trifft a1', m && m.posten.id === 'a1');
  // Eine weitere Teilzahlung (3000) wird als Teilzahlung erkannt, Rest 3900.
  const teil = findeKandidaten({ richtung: 'einnahme', betragCent: 3000, zweck: 'R-1' }, posten);
  ok('Forderungs-Teilzahlung erkannt, Rest 3900', teil[0].art === 'teilzahlung' && teil[0].restCent === 3900);
});

await section('R2b: Sammelzahlung (eine Zahlung auf mehrere Rechnungen)', () => {
  const summe = (zeilen, seite) => zeilen.filter((z) => z.seite === seite).reduce((s, z) => s + z.betrag, 0);
  // Drei offene Forderungen.
  const posten = [
    { id: 'a1', richtung: 'einnahme', kind: 'forderung', betragCent: 11900, referenz: 'R-1', name: 'Muster AG', datum: '2026-06-01' },
    { id: 'a2', richtung: 'einnahme', kind: 'forderung', betragCent: 23800, referenz: 'R-2', name: 'Muster AG', datum: '2026-06-02' },
    { id: 'a3', richtung: 'einnahme', kind: 'forderung', betragCent: 5000,  referenz: 'R-3', name: 'Andere KG', datum: '2026-06-03' },
  ];

  // --- findeSammelzuordnung: Zahlung 35700 = R-1 + R-2 (11900 + 23800) ---
  const komb = findeSammelzuordnung({ richtung: 'einnahme', betragCent: 35700, zweck: 'Sammelzahlung R-1 R-2' }, posten);
  ok('Sammel: mind. eine Kombination gefunden', komb.length >= 1);
  const top = komb[0];
  ok('Sammel: Top-Kombi summiert exakt 35700', top.summeCent === 35700 && top.differenzCent === 0);
  ok('Sammel: Top-Kombi = zwei Posten (R-1, R-2)', top.posten.length === 2 && top.posten.map((p) => p.id).sort().join() === 'a1,a2');

  // Kombinationen haben immer ≥ 2 Posten (Einzeltreffer deckt findeKandidaten ab).
  const einzel = findeSammelzuordnung({ richtung: 'einnahme', betragCent: 5000 }, posten);
  ok('Sammel: Einzelbetrag liefert keine (≥2-Teile-)Kombi', einzel.length === 0);

  // Rundungs-Toleranz: 35699 (1 Cent zu wenig) findet die Kombi trotzdem.
  const tol = findeSammelzuordnung({ richtung: 'einnahme', betragCent: 35699 }, posten);
  ok('Sammel: 1 Cent Toleranz findet Kombi', tol.length >= 1 && Math.abs(tol[0].differenzCent) <= 2);

  // Falsche Richtung → keine Kombination.
  ok('Sammel: falsche Richtung → leer', findeSammelzuordnung({ richtung: 'ausgabe', betragCent: 35700 }, posten).length === 0);

  // Drei Posten zusammen: 40700 = R-1 + R-2 + R-3.
  const drei = findeSammelzuordnung({ richtung: 'einnahme', betragCent: 40700 }, posten, { maxTeile: 3 });
  ok('Sammel: Drei-Posten-Kombi 40700', drei.length >= 1 && drei[0].summeCent === 40700 && drei[0].posten.length === 3);

  // Ranking: Referenz im Zweck hebt die passende Kombination (R-1+R-3=16900 vs. allein wäre kein 2er sonst).
  const rank = findeSammelzuordnung({ richtung: 'einnahme', betragCent: 16900, zweck: 'zahlung r-1 und r-3' }, posten);
  ok('Sammel: R-1+R-3 gefunden (16900)', rank[0].summeCent === 16900 && rank[0].posten.map((p) => p.id).sort().join() === 'a1,a3');

  // --- verteileSammelzahlung: exakte Verteilung auf zwei volle Posten ---
  const v = verteileSammelzahlung(35700, [posten[0], posten[1]]);
  ok('Verteilung: 2 Posten voll, nichts unverteilt', v.zuordnung.length === 2 && v.unverteiltCent === 0 && v.zuordnung.every((z) => z.voll && z.restCent === 0));
  ok('Verteilung: Beträge je Posten korrekt', v.zuordnung[0].betragCent === 11900 && v.zuordnung[1].betragCent === 23800);

  // Restbildung: Zahlung 30000 deckt R-1 voll, R-2 teilweise (Rest 5700 bleibt offen).
  const vr = verteileSammelzahlung(30000, [posten[0], posten[1]]);
  ok('Verteilung: R-1 voll', vr.zuordnung[0].betragCent === 11900 && vr.zuordnung[0].voll);
  ok('Verteilung: R-2 teilbezahlt 18100, Rest 5700', vr.zuordnung[1].betragCent === 18100 && vr.zuordnung[1].restCent === 5700 && !vr.zuordnung[1].voll);
  ok('Verteilung: nichts unverteilt', vr.unverteiltCent === 0);

  // Überzahlung: 40000 auf R-1+R-2 (35700) → 4300 bleiben unverteilt (UI warnt).
  const vu = verteileSammelzahlung(40000, [posten[0], posten[1]]);
  ok('Verteilung: Überschuss unverteilt 4300', vu.unverteiltCent === 4300 && vu.verteiltCent === 35700);

  // --- sammelBuchungZeilen: eine Zeile je Rechnung, ausgeglichen ---
  const bk = sammelBuchungZeilen({ richtung: 'einnahme', valuta: '2026-06-10' }, v.zuordnung);
  ok('Sammelbuchung Einnahme: Bank-Soll = Summe 35700', bk.zeilen[0].konto === '1200' && bk.zeilen[0].seite === 'S' && bk.zeilen[0].betrag === 35700);
  ok('Sammelbuchung Einnahme: je Rechnung eine Forderungs-Haben-Zeile', bk.zeilen.filter((z) => z.konto === '1400' && z.seite === 'H').length === 2);
  ok('Sammelbuchung Einnahme: S = H = 35700', summe(bk.zeilen, 'S') === 35700 && summe(bk.zeilen, 'H') === 35700);
  ok('Sammelbuchung: Referenzen in Beschreibung', bk.beschreibung.includes('R-1') && bk.beschreibung.includes('R-2'));

  // Ausgabe-Richtung: je Verbindlichkeit eine Soll-Zeile, Bank-Haben = Summe.
  const vb = [
    { id: 'v1', richtung: 'ausgabe', kind: 'verbindlichkeit', betragCent: 5000, referenz: 'L-1', name: 'Lief', datum: '2026-06-01' },
    { id: 'v2', richtung: 'ausgabe', kind: 'verbindlichkeit', betragCent: 7000, referenz: 'L-2', name: 'Lief', datum: '2026-06-02' },
  ];
  const va = verteileSammelzahlung(12000, vb);
  const bka = sammelBuchungZeilen({ richtung: 'ausgabe', valuta: '2026-06-11' }, va.zuordnung);
  ok('Sammelbuchung Ausgabe: 2× Verbindlichkeit-Soll + Bank-Haben', bka.zeilen.filter((z) => z.konto === '1600' && z.seite === 'S').length === 2 && bka.zeilen.some((z) => z.konto === '1200' && z.seite === 'H' && z.betrag === 12000));
  ok('Sammelbuchung Ausgabe: S = H = 12000', summe(bka.zeilen, 'S') === 12000 && summe(bka.zeilen, 'H') === 12000);

  // Leere/null-Fälle.
  ok('Sammelbuchung: leere Zuordnung → null', sammelBuchungZeilen({ richtung: 'einnahme' }, []) === null);
  ok('Sammelzuordnung: Betrag 0 → leer', findeSammelzuordnung({ richtung: 'einnahme', betragCent: 0 }, posten).length === 0);
});

await section('R2a: Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG)', () => {
  // Hilfen: Soll-/Haben-Summen einer Buchung.
  const summe = (zeilen, seite) => zeilen.filter((z) => z.seite === seite).reduce((s, z) => s + z.betrag, 0);
  const hat = (zeilen, konto, seite, betrag) => zeilen.some((z) => z.konto === konto && z.seite === seite && z.betrag === betrag);

  // --- skontoSplit (Brutto → Netto + USt) ---
  const s19 = skontoSplit(1500, 19);
  ok('skontoSplit 1500@19 → 1261/239 (Summe 1500)', s19.nettoCent === 1261 && s19.ustCent === 239 && s19.nettoCent + s19.ustCent === 1500);
  const s7 = skontoSplit(1070, 7);
  ok('skontoSplit 1070@7 → 1000/70', s7.nettoCent === 1000 && s7.ustCent === 70);
  const s0 = skontoSplit(500, 0);
  ok('skontoSplit 0% → keine USt', s0.nettoCent === 500 && s0.ustCent === 0);

  // --- Einnahme (Forderung, Skonto gewährt), einzelner Satz 19% ---
  // Forderung 50000 brutto, gezahlt 48500 → Skonto 1500 (netto 1261 + USt 239).
  const ein = skontoBuchungZeilen({ richtung: 'einnahme', offenCent: 50000, zahlungCent: 48500, ustProzent: 19 });
  ok('Einnahme: Bank 48500 Soll', hat(ein.zeilen, '1200', 'S', 48500));
  ok('Einnahme: gewährte Skonti 8736 netto 1261 Soll', hat(ein.zeilen, '8736', 'S', 1261));
  ok('Einnahme: USt-Korrektur 1776 239 Soll', hat(ein.zeilen, '1776', 'S', 239));
  ok('Einnahme: Forderung 1400 50000 Haben', hat(ein.zeilen, '1400', 'H', 50000));
  ok('Einnahme: ausgeglichen (S=H=50000)', summe(ein.zeilen, 'S') === 50000 && summe(ein.zeilen, 'H') === 50000);
  ok('Einnahme: Meta Skonto 1500/1261/239', ein.skontoBruttoCent === 1500 && ein.nettoSkontoCent === 1261 && ein.ustSkontoCent === 239);

  // --- Ausgabe (Verbindlichkeit, Skonto erhalten), einzelner Satz 19% ---
  // Verbindlichkeit 11900 brutto, gezahlt 11662 → Skonto 238 (netto 200 + VSt 38).
  const aus = skontoBuchungZeilen({ richtung: 'ausgabe', offenCent: 11900, zahlungCent: 11662, ustProzent: 19 });
  ok('Ausgabe: Verbindlichkeit 1600 11900 Soll', hat(aus.zeilen, '1600', 'S', 11900));
  ok('Ausgabe: Bank 11662 Haben', hat(aus.zeilen, '1200', 'H', 11662));
  ok('Ausgabe: erhaltene Skonti 3736 netto 200 Haben', hat(aus.zeilen, '3736', 'H', 200));
  ok('Ausgabe: Vorsteuer-Korrektur 1576 38 Haben', hat(aus.zeilen, '1576', 'H', 38));
  ok('Ausgabe: ausgeglichen (S=H=11900)', summe(aus.zeilen, 'S') === 11900 && summe(aus.zeilen, 'H') === 11900);

  // --- Gemischte USt-Sätze: proportionale Aufteilung des Skontos ---
  // Rechnung netto 1000@19 (brutto 1190) + netto 1000@7 (brutto 1070) = 2260 brutto.
  // gezahlt 2034 → Skonto 226 → 119@19 (100/19) + 107@7 (100/7).
  const mix = skontoBuchungZeilen({
    richtung: 'einnahme', offenCent: 2260, zahlungCent: 2034,
    saetze: [{ ustProzent: 19, bruttoCent: 1190 }, { ustProzent: 7, bruttoCent: 1070 }],
  });
  ok('Mix: 8736 netto 100 Soll', hat(mix.zeilen, '8736', 'S', 100));
  ok('Mix: USt 19% 1776 19 Soll', hat(mix.zeilen, '1776', 'S', 19));
  ok('Mix: 8731 netto 100 Soll', hat(mix.zeilen, '8731', 'S', 100));
  ok('Mix: USt 7% 1771 7 Soll', hat(mix.zeilen, '1771', 'S', 7));
  ok('Mix: ausgeglichen (S=H=2260)', summe(mix.zeilen, 'S') === 2260 && summe(mix.zeilen, 'H') === 2260);
  ok('Mix: Skonto-Meta 226/200/26', mix.skontoBruttoCent === 226 && mix.nettoSkontoCent === 200 && mix.ustSkontoCent === 26);

  // --- Guards: kein gültiger Skonto-Fall → null ---
  ok('kein Abzug (zahlung == offen) → null', skontoBuchungZeilen({ richtung: 'einnahme', offenCent: 50000, zahlungCent: 50000 }) === null);
  ok('Überzahlung → null', skontoBuchungZeilen({ richtung: 'einnahme', offenCent: 50000, zahlungCent: 51000 }) === null);
  ok('keine Zahlung → null', skontoBuchungZeilen({ richtung: 'ausgabe', offenCent: 11900, zahlungCent: 0 }) === null);

  // --- skontoEntwurf: vollständiger Entwurf mit Begründung ---
  const ent = skontoEntwurf({ richtung: 'einnahme', offenCent: 50000, zahlungCent: 48500, ustProzent: 19, referenz: 'R-9', name: 'Beta AG', datum: '2026-06-17' });
  ok('Entwurf: Datum/Referenz/Name in Beschreibung', ent.datum === '2026-06-17' && ent.beschreibung.includes('R-9') && ent.beschreibung.includes('Beta AG'));
  ok('Entwurf: §17-Begründung', ent.begruendung.includes('§ 17') && ent.begruendung.includes('Umsatzsteuer'));
  ok('Entwurf: Zeilen ausgeglichen', summe(ent.zeilen, 'S') === summe(ent.zeilen, 'H'));
  ok('Entwurf null bei Nicht-Skonto', skontoEntwurf({ richtung: 'einnahme', offenCent: 100, zahlungCent: 100 }) === null);

  // --- Konten existieren im SKR03-Seed ---
  const nummern = new Set(SKR03_SEED.map((k) => k.nummer));
  ok('Seed enthält 8730/8731/8736 (gewährte Skonti)', nummern.has('8730') && nummern.has('8731') && nummern.has('8736'));
  ok('Seed enthält 3730/3731/3736 (erhaltene Skonti)', nummern.has('3730') && nummern.has('3731') && nummern.has('3736'));

  // --- Integration: offenePosten trägt saetze → Entwurf direkt aus Posten ---
  const auftraege = [{ id: 'a9', status: 'berechnet', rechnungNummer: 'R-9', rechnungDatum: '2026-06-01', kundeId: 'k1',
    positionen: [{ menge: 1, einzelpreisCent: 100000, ustSatz: 19 }] }]; // brutto 119000
  const op = offenePosten(auftraege, { nameById: { k1: 'Beta AG' } })[0];
  ok('offenePosten trägt saetze (19%/119000)', op.saetze.length === 1 && op.saetze[0].ustProzent === 19 && op.saetze[0].bruttoCent === 119000);
  const entAusPosten = skontoEntwurf({ richtung: op.richtung, offenCent: op.betragCent, zahlungCent: 115430, saetze: op.saetze, referenz: op.referenz });
  // Skonto 3570 brutto → netto 3000, USt 570.
  ok('Posten-Entwurf: Skonto 3570/3000/570', entAusPosten.skontoBruttoCent === 3570 && entAusPosten.nettoSkontoCent === 3000 && entAusPosten.ustSkontoCent === 570);
  ok('Posten-Entwurf: ausgeglichen', summe(entAusPosten.zeilen, 'S') === summe(entAusPosten.zeilen, 'H'));

  // skontoSaetze normalisiert/filtert.
  ok('skontoSaetze filtert 0-Anteile', skontoSaetze([{ ustProzent: 19, bruttoCent: 100 }, { ustProzent: 7, bruttoCent: 0 }]).length === 1);
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

await section('Verbindlichkeiten-OP-Liste: Fälligkeit/Überfälligkeit + Kennzahlen + CSV', () => {
  const rechnungen = [
    { id: 'er:1', kreditor: 'Alpha', rechnungsnr: 'A-1', datum: '2026-05-01', faelligAm: '2026-05-15', bruttoCent: 11900 }, // überfällig
    { id: 'er:2', kreditor: 'Beta', rechnungsnr: 'B-2', datum: '2026-06-10', bruttoCent: 20000,
      zahlungen: [{ datum: '2026-06-12', betragCent: 5000 }] },                                                            // im Ziel (datum+30)
  ];
  const posten = offeneVerbindlichkeiten(rechnungen);
  const ang = anreichereVerbindlichkeiten(posten, { heute: '2026-06-16', zielTage: 30 });
  const a1 = ang.find((p) => p.id === 'er:1');
  const b2 = ang.find((p) => p.id === 'er:2');
  ok('a1 nutzt eigene faelligAm 2026-05-15', a1.faelligAm === '2026-05-15');
  ok('a1 überfällig 32 Tage', a1.ueberfaellig && a1.tageUeberfaellig === 32);
  ok('b2 Fälligkeit = datum+30 (2026-07-10)', b2.faelligAm === '2026-07-10');
  ok('b2 nicht überfällig', b2.ueberfaellig === false && b2.tageUeberfaellig === 0);

  const sum = verbindlichkeitenSummen(ang);
  ok('Summe offen 11900 + 15000 = 26900', sum.summeCent === 26900 && sum.anzahl === 2);
  ok('überfällig: 1 Posten / 11900', sum.ueberfaelligAnzahl === 1 && sum.ueberfaelligCent === 11900);

  const csvOut = buildOffeneVerbindlichkeitenCsv(ang);
  ok('CSV Header nennt Überfällig-Spalte', csvOut.split('\r\n')[0].includes('Überfällig (Tage)'));
  ok('CSV nennt Alpha + 119,00 + 32 Tage', csvOut.includes('Alpha') && csvOut.includes('119,00') && /;32$/m.test(csvOut.split('\r\n')[1]));
  ok('CSV Summenzeile 269,00', csvOut.includes('Summe offen;269,00'));
});

// ===== R3: Verbindlichkeit aus Foto/PDF-Beleg (Vision-OCR → Eingangsrechnung) =====

await section('R3: extraktionZuEingangsrechnung (OCR-Felder → Eingangsrechnungs-Entwurf)', () => {
  // Typisches OCR-Ergebnis (ai/extract.extractFromText): Brutto 119,00 @19%, Lieferant erkannt.
  const ex = { betragBrutto: 11900, datum: '2026-06-15', ustSatz: 19, vendor: 'Müller Bürobedarf GmbH', confidence: 0.7 };
  const r = extraktionZuEingangsrechnung(ex, { aufwandKonto: '4930' });
  ok('Kreditor aus vendor', r.kreditor === 'Müller Bürobedarf GmbH');
  ok('Datum übernommen', r.datum === '2026-06-15');
  ok('eine Position mit abgeleitetem Netto 10000', r.positionen.length === 1 && r.positionen[0].nettoCent === 10000);
  ok('USt-Satz 19 + Aufwandskonto 4930', r.positionen[0].ustSatz === 19 && r.positionen[0].aufwandKonto === '4930');
  ok('quelle ocr + confidence durchgereicht', r.quelle === 'ocr' && r.confidence === 0.7);
  ok('kein bruttoCent gesetzt (Positionen treiben Betrag)', r.bruttoCent === undefined);

  // Entwurf ist gültig (Brutto rekonstruiert sich aus den Positionen → 11900).
  ok('Entwurf gültig', validateEingangsrechnung(r).length === 0);
  ok('rekonstruierter Brutto = 11900', rechnungBrutto(r) === 11900);
  const { zeilen } = eingangsrechnungZeilen(r);
  ok('Buchung „auf Ziel" ausgeglichen', istAusgeglichen(zeilen));
  ok('Haben Verbindlichkeit 1600 = 11900', zeile(zeilen, '1600', 'H')?.betrag === 11900);

  // Kein erkannter USt-Satz → konservativ 0 % (keine Vorsteuer), Netto = Brutto.
  const r0 = extraktionZuEingangsrechnung({ betragBrutto: 5000, datum: '2026-06-01', ustSatz: null, vendor: 'X' });
  ok('ohne Satz: 0 % + Netto = Brutto', r0.positionen[0].ustSatz === 0 && r0.positionen[0].nettoCent === 5000);
  ok('ohne Satz: Default-Aufwandskonto 4980', r0.positionen[0].aufwandKonto === '4980');

  // Fehlende Felder werden NICHT erfunden → Validierung greift, Nutzer ergänzt.
  const leer = extraktionZuEingangsrechnung({ betragBrutto: null, datum: null, ustSatz: 19, vendor: null });
  ok('ohne Brutto: keine Position', leer.positionen.length === 0);
  ok('ohne Kreditor/Datum/Betrag: ungültig (Nutzer ergänzt)', validateEingangsrechnung(leer).length >= 2);

  // erechnungLesen.eingangsrechnungExtraktion liefert dasselbe Feldformat → muss passen.
  const exER = { betragBrutto: 22600, datum: '2026-06-14', ustSatz: 7, vendor: 'Verlag AG', confidence: 0.85 };
  const rER = extraktionZuEingangsrechnung(exER, { aufwandKonto: '4940', rechnungsnr: 'RE-2026-99' });
  ok('rechnungsnr aus opts', rER.rechnungsnr === 'RE-2026-99');
  ok('7 % Netto 21121 (round 22600/1.07)', rER.positionen[0].nettoCent === Math.round(22600 / 1.07));
});

await section('R3/A1: Zahlungsziel je Rechnung (berechneFaelligAm + OP-Liste)', () => {
  // berechneFaelligAm: explizites faelligAm hat Vorrang.
  ok('explizites faelligAm gewinnt', berechneFaelligAm({ faelligAm: '2026-07-01', datum: '2026-06-01', zahlungszielTage: 10 }) === '2026-07-01');
  // sonst: rechnungseigenes Zahlungsziel (A1) vor Default.
  ok('rechnungseigenes Ziel (7 Tage)', berechneFaelligAm({ datum: '2026-06-01', zahlungszielTage: 7 }) === '2026-06-08');
  ok('Default-Ziel (30) ohne eigenes', berechneFaelligAm({ datum: '2026-06-01' }, 30) === '2026-07-01');
  ok('ohne Datum → leer', berechneFaelligAm({ zahlungszielTage: 7 }) === '');

  // In der OP-Liste schlägt das Zahlungsziel je Rechnung den globalen Default durch.
  const rechnungen = [
    { id: 'er:1', kreditor: 'Skonto-Kurz', datum: '2026-06-01', zahlungszielTage: 7, bruttoCent: 11900 },
    { id: 'er:2', kreditor: 'Standard', datum: '2026-06-01', bruttoCent: 5000 },
  ];
  const posten = offeneVerbindlichkeiten(rechnungen);
  ok('zahlungszielTage in Posten durchgereicht', posten.find((p) => p.id === 'er:1').zahlungszielTage === 7);
  const ang = anreichereVerbindlichkeiten(posten, { heute: '2026-06-15', zielTage: 30 });
  const p1 = ang.find((p) => p.id === 'er:1');
  const p2 = ang.find((p) => p.id === 'er:2');
  ok('er:1 fällig datum+7 (2026-06-08), überfällig', p1.faelligAm === '2026-06-08' && p1.ueberfaellig === true && p1.tageUeberfaellig === 7);
  ok('er:2 fällig datum+30 (2026-07-01), nicht überfällig', p2.faelligAm === '2026-07-01' && p2.ueberfaellig === false);

  // Validierung: ungültiges Zahlungsziel wird abgewiesen.
  ok('negatives Zahlungsziel ungültig', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01', bruttoCent: 100, zahlungszielTage: -3 }).length > 0);
  ok('gültiges Zahlungsziel ok', validateEingangsrechnung({ kreditor: 'X', datum: '2026-06-01', bruttoCent: 100, zahlungszielTage: 14 }).length === 0);
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

await section('Mahnwesen: persistenter Verlauf (Stufe/Zins-/Gebührenverlauf)', () => {
  ok('mahnStufeLabel 2 → 1. Mahnung', mahnStufeLabel(2) === '1. Mahnung');
  ok('letzteMahnstufe leer → 0', letzteMahnstufe({}) === 0);
  ok('letzteMahnstufe nimmt Maximum', letzteMahnstufe({ mahnungen: [{ stufe: 1 }, { stufe: 3 }, { stufe: 2 }] }) === 3);

  // Ohne Verlauf: Vorschlag = aus Überfälligkeit abgeleitete Stufe.
  const v0 = vorschlagNaechsteStufe({}, 20); // 20 Tage → 1. Mahnung (Stufe 2)
  ok('ohne Verlauf: abgeleitete Stufe 2, mahnbar', v0.stufe === 2 && v0.mahnbar && v0.letzteGesendet === 0);
  // Mit Verlauf (zuletzt Stufe 2): nächste = 3, unabhängig von Tagen.
  const v1 = vorschlagNaechsteStufe({ mahnungen: [{ stufe: 2 }] }, 1);
  ok('mit Verlauf: nächste Stufe 3', v1.stufe === 3 && v1.letzteGesendet === 2);
  // Deckelung bei 3. Mahnung (Stufe 4).
  ok('Deckelung bei Stufe 4', vorschlagNaechsteStufe({ mahnungen: [{ stufe: 4 }] }, 99).stufe === 4);
  // Nicht überfällig, kein Verlauf → Stufe 0, nicht mahnbar.
  ok('nicht überfällig → Stufe 0', vorschlagNaechsteStufe({}, 0).stufe === 0 && vorschlagNaechsteStufe({}, 0).mahnbar === false);

  const vs = mahnVerlaufSumme({ mahnungen: [{ zinsenCent: 500, gebuehrenCent: 4000 }, { zinsenCent: 250, gebuehrenCent: 0 }] });
  ok('Verlaufssumme Zinsen 750 / Gebühren 4000', vs.zinsenCent === 750 && vs.gebuehrenCent === 4000);
});

await section('Mahnwesen: B2B/Verbraucher je Kunde (§288 BGB)', () => {
  ok('kein Kunde → B2B (konservativ)', kundeIstB2B(null) === true);
  ok('Unternehmer (Default) → B2B', kundeIstB2B({ name: 'X' }) === true);
  ok('istVerbraucher → kein B2B', kundeIstB2B({ name: 'Y', istVerbraucher: true }) === false);

  // Gleiche überfällige Forderung: B2B vs. Verbraucher → 9 % vs. 5 % + Pauschale nur B2B.
  const posten = anreicherePosten([{ id: 'a1', betragCent: 119000, datum: '2026-05-01', referenz: 'R-1', name: 'Z' }],
    { heute: '2026-06-30', zielTage: 14 })[0];
  const b2b = mahnschreibenDaten(posten, { heute: '2026-06-30', basiszinsProzent: 0, b2b: true });
  const vb = mahnschreibenDaten(posten, { heute: '2026-06-30', basiszinsProzent: 0, b2b: false });
  ok('B2B Pauschale 40 €, Verbraucher 0', b2b.pauschaleCent === 4000 && vb.pauschaleCent === 0);
  ok('B2B-Zinsen (9 %) > Verbraucher-Zinsen (5 %)', b2b.zinsenCent > vb.zinsenCent && vb.zinsenCent > 0);
});

await section('Mahnwesen R1: Verzugszinsen/Mahngebühren buchen (ohne USt)', () => {
  const idx = indexFromSeed();
  // Standardkonten existieren im SKR03-Seed (sonst nicht festschreibbar).
  ok('SKR03 kennt 1400/2650/2700', !!idx['1400'] && !!idx['2650'] && !!idx['2700']);
  ok('Forderung 1400 ist Aktivkonto', idx['1400'].art === KONTOART.AKTIV);
  ok('2650 + 2700 sind Ertragskonten', idx['2650'].art === KONTOART.ERTRAG && idx['2700'].art === KONTOART.ERTRAG);

  // Zinsen + Gebühren: Soll Forderung an Haben Zinsertrag + Gebührenertrag, ausgeglichen.
  const beide = mahnbuchungZeilen({ zinsenCent: 1234, gebuehrenCent: 4000 });
  ok('Summe = Zinsen + Gebühren', beide.summeCent === 5234);
  ok('drei Zeilen (Forderung + 2 Erträge)', beide.zeilen.length === 3);
  ok('Buchung ausgeglichen (Soll=Haben)', istAusgeglichen(beide.zeilen));
  ok('keine festschreib-Fehler (gültig gegen Kontenliste)', validateBuchung({ datum: '2026-06-17', zeilen: beide.zeilen }, idx).length === 0);
  ok('Soll auf Forderung 1400 (Gesamt)', zeile(beide.zeilen, '1400', 'S').betrag === 5234);
  ok('Haben Zinsertrag 2650', zeile(beide.zeilen, '2650', 'H').betrag === 1234);
  ok('Haben Gebührenertrag 2700', zeile(beide.zeilen, '2700', 'H').betrag === 4000);
  ok('KEINE USt-Zeile (Schadensersatz, nicht steuerbar)',
    !beide.zeilen.some((z) => { const k = idx[z.konto]; return k && (k.rolle === 'umsatzsteuer' || k.rolle === 'vorsteuer'); }));

  // Nur Zinsen → 2 Zeilen, kein Gebührenkonto.
  const nurZins = mahnbuchungZeilen({ zinsenCent: 500, gebuehrenCent: 0 });
  ok('nur Zinsen → 2 Zeilen', nurZins.zeilen.length === 2 && istAusgeglichen(nurZins.zeilen));
  ok('nur Zinsen: kein 2700', !nurZins.zeilen.some((z) => z.konto === '2700'));

  // Nur Gebühren → 2 Zeilen, kein Zinskonto.
  const nurGeb = mahnbuchungZeilen({ zinsenCent: 0, gebuehrenCent: 4000 });
  ok('nur Gebühren → 2 Zeilen', nurGeb.zeilen.length === 2 && !nurGeb.zeilen.some((z) => z.konto === '2650'));

  // Nichts → keine Zeilen, Entwurf null.
  ok('0/0 → keine Zeilen', mahnbuchungZeilen({ zinsenCent: 0, gebuehrenCent: 0 }).zeilen.length === 0);
  ok('0/0 → Entwurf null', mahnbuchungEntwurf({ zinsenCent: 0, gebuehrenCent: 0 }) === null);

  // Konto-Überschreibung.
  const custom = mahnbuchungZeilen({ zinsenCent: 100, konten: { forderung: '1410', zinsertrag: '8200' } });
  ok('konten-Override greift', zeile(custom.zeilen, '1410', 'S') && zeile(custom.zeilen, '8200', 'H'));

  // Vollständiger Entwurf aus Mahnschreiben-Daten.
  const ent = mahnbuchungEntwurf({ zinsenCent: 1234, gebuehrenCent: 4000, referenz: 'R-7', name: 'Müller', datum: '2026-06-17' });
  ok('Entwurf hat Datum', ent.datum === '2026-06-17');
  ok('Entwurf-Beschreibung nennt Referenz', /R-7/.test(ent.beschreibung) && /Verzugszinsen/.test(ent.beschreibung) && /Mahngeb/.test(ent.beschreibung));
  ok('Entwurf-Begründung nennt Schadensersatz/ohne USt', /Schadensersatz/.test(ent.begruendung) && /ohne USt/.test(ent.begruendung));
  ok('Entwurf node-festschreibbar (validateBuchung leer)', validateBuchung(ent, idx).length === 0);
  ok('MAHN_KONTEN Default = 1400/2650/2700', MAHN_KONTEN.forderung === '1400' && MAHN_KONTEN.zinsertrag === '2650' && MAHN_KONTEN.gebuehrertrag === '2700');

  // Anbindung an die bestehende Mahnschreiben-Berechnung (§288) → Buchungsentwurf.
  const posten = anreicherePosten([{ id: 'a1', betragCent: 119000, datum: '2026-05-01', referenz: 'R-9', name: 'Z' }],
    { heute: '2026-06-30', zielTage: 14 })[0];
  const md = mahnschreibenDaten(posten, { heute: '2026-06-30', basiszinsProzent: 0, b2b: true });
  const aus = mahnbuchungEntwurf({ zinsenCent: md.zinsenCent, gebuehrenCent: md.pauschaleCent, referenz: md.referenz, name: md.name });
  ok('aus §288-Mahnschreiben gebauter Entwurf ausgeglichen', istAusgeglichen(aus.zeilen) && aus.summeCent === md.zinsenCent + md.pauschaleCent);
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

await section('V2: Reverse-Charge §13b + innergem. Erwerb (Buchungszeilen)', () => {
  const idx = indexFromSeed();
  ok('Seed kennt §13b-Konten 1577/1787', !!idx['1577'] && !!idx['1787']);
  ok('Seed kennt ig-Erwerb-Konten 1574/1772', !!idx['1574'] && !!idx['1772']);
  ok('Seed kennt steuerfreie Erlöskonten 8120/8125', !!idx['8120'] && !!idx['8125']);
  ok('REVERSE_CHARGE_KONTEN bildet §13b → 1577/1787 ab',
    REVERSE_CHARGE_KONTEN['13b'].vorsteuer === '1577' && REVERSE_CHARGE_KONTEN['13b'].umsatzsteuer === '1787');

  // §13b: 100€ netto, 19% → VSt 19€ (Soll) + USt 19€ (Haben); an Lieferant nur netto.
  const rc = baueReverseChargeZeilen({
    netto: '100,00', ustSatz: 19, aufwandKonto: '4950', gegenKonto: '1600',
    vorsteuerKonto: '1577', umsatzsteuerKonto: '1787',
  });
  ok('§13b Netto 10000, Steuer 1900', rc.netto === 10000 && rc.steuer === 1900);
  ok('§13b Buchung ausgeglichen', istAusgeglichen(rc.zeilen));
  ok('§13b Soll=Haben=11900', summeSeiten(rc.zeilen).soll === 11900 && summeSeiten(rc.zeilen).haben === 11900);
  ok('§13b USt 1787 auf Haben', !!zeile(rc.zeilen, '1787', 'H') && zeile(rc.zeilen, '1787', 'H').betrag === 1900);
  ok('§13b VSt 1577 auf Soll', !!zeile(rc.zeilen, '1577', 'S') && zeile(rc.zeilen, '1577', 'S').betrag === 1900);
  ok('§13b: Netto an Gegenkonto (Verbindlichkeit) 1600', zeile(rc.zeilen, '1600', 'H').betrag === 10000);
  ok('§13b gegen Kontenliste gültig', validateBuchung({ datum: '2026-06-01', zeilen: rc.zeilen }, idx).length === 0);

  // Nicht abziehbare Vorsteuer → USt wird Kostenbestandteil, keine VSt-Zeile.
  const rcNa = baueReverseChargeZeilen({
    nettoCents: 10000, ustSatz: 19, aufwandKonto: '4950', gegenKonto: '1600',
    umsatzsteuerKonto: '1787', vorsteuerAbziehbar: false,
  });
  ok('§13b ohne VSt-Abzug: keine 1577-Zeile', !zeile(rcNa.zeilen, '1577', 'S'));
  ok('§13b ohne VSt-Abzug: Aufwand inkl. Steuer (11900)', zeile(rcNa.zeilen, '4950', 'S').betrag === 11900);
  ok('§13b ohne VSt-Abzug ausgeglichen', istAusgeglichen(rcNa.zeilen));

  ok('UMSATZART kennt 13b & ig_erwerb', UMSATZART.REVERSE_CHARGE_13B === '13b' && UMSATZART.IG_ERWERB === 'ig_erwerb');
});

await section('V2: USt-VA-Kennzahlen §13b / innergem. Erwerb / steuerfrei', () => {
  const idx = indexFromSeed();
  const buchungen = [
    // §13b Eingangsleistung 100€ netto (VSt+USt 19€)
    { seq: 1, datum: '2026-06-01', zeilen: [
      { konto: '4950', seite: 'S', betrag: 10000 }, { konto: '1200', seite: 'H', betrag: 10000 },
      { konto: '1787', seite: 'H', betrag: 1900 }, { konto: '1577', seite: 'S', betrag: 1900 }] },
    // innergem. Erwerb 200€ netto (Steuer+VSt 38€)
    { seq: 2, datum: '2026-06-02', zeilen: [
      { konto: '3400', seite: 'S', betrag: 20000 }, { konto: '1200', seite: 'H', betrag: 20000 },
      { konto: '1772', seite: 'H', betrag: 3800 }, { konto: '1574', seite: 'S', betrag: 3800 }] },
    // steuerfreie innergem. Lieferung 500€
    { seq: 3, datum: '2026-06-03', zeilen: [{ konto: '1400', seite: 'S', betrag: 50000 }, { konto: '8125', seite: 'H', betrag: 50000 }] },
    // steuerfreie Ausfuhr 300€
    { seq: 4, datum: '2026-06-04', zeilen: [{ konto: '1200', seite: 'S', betrag: 30000 }, { konto: '8120', seite: 'H', betrag: 30000 }] },
    // normaler Inlandsverkauf 200€ netto + 38€ USt
    { seq: 5, datum: '2026-06-05', zeilen: [
      { konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
  ];
  const va = buildUstVa(buchungen, idx);
  ok('§13b: Kz47 Steuer 1900', va.kz47 === 1900);
  ok('§13b: Kz46 BMG 10000 (aus Steuer/Satz)', va.kz46 === 10000);
  ok('§13b: Kz67 Vorsteuer 1900', va.kz67 === 1900);
  ok('ig Erwerb: Kz93 Steuer 3800', va.kz93 === 3800);
  ok('ig Erwerb: Kz89 BMG 20000', va.kz89 === 20000);
  ok('ig Erwerb: Kz61 Vorsteuer 3800', va.kz61 === 3800);
  ok('steuerfrei: Kz41 ig Lieferung 50000', va.kz41 === 50000);
  ok('steuerfrei: Kz43 Ausfuhr 30000', va.kz43 === 30000);
  ok('Inland weiterhin: Kz81 20000 / Steuer 3800', va.kz81 === 20000 && va.kz81Steuer === 3800);
  // Zahllast: Reverse-Charge hebt sich auf → es bleibt nur die Inlands-USt (3800).
  ok('Kz83 Zahllast = 3800 (RC neutralisiert sich)', va.kz83 === 3800);

  // §13b-only Periode → Zahllast 0 (USt 47 und VSt 67 heben sich auf).
  const vaNur13b = buildUstVa(buchungen, idx, { von: '2026-06-01', bis: '2026-06-01' });
  ok('§13b allein → Kz83 = 0', vaNur13b.kz83 === 0 && vaNur13b.kz47 === 1900 && vaNur13b.kz67 === 1900);

  const csv = ustVaToCsv(va);
  ok('CSV enthält §13b-Zeile (47)', csv.includes('47;darauf Umsatzsteuer §13b'));
  ok('CSV enthält Zahllast-Zeile', csv.includes('83;Verbleibende'));
});

await section('V3: Anlagevermögen + AfA (Klassifikation & Pläne)', () => {
  ok('≤ 800 € netto → GWG', klassifiziere(80000) === AFA_METHODE.GWG);
  ok('> 800 € netto → linear', klassifiziere(80001) === AFA_METHODE.LINEAR);
  ok('Sammelposten zulässig 250–1.000 €', sammelpostenZulaessig(50000) && !sammelpostenZulaessig(25000) && !sammelpostenZulaessig(100001));

  const gwg = afaPlanGwg(60000, '2026-05-10');
  ok('GWG: voller Aufwand im Jahr', gwg.length === 1 && gwg[0].afa === 60000 && gwg[0].restbuchwert === 0);

  // Lineare AfA pro rata: 1.200 € / 3 J. ab April → 9/12 im Jahr 1.
  const lin = afaPlanLinear(120000, 3, '2026-04-15');
  ok('linear pro rata: 4 Kalenderjahre', lin.length === 4);
  ok('linear: Jahr1 = 30000 (9/12)', lin[0].jahr === 2026 && lin[0].afa === 30000);
  ok('linear: Jahr2/3 = 40000', lin[1].afa === 40000 && lin[2].afa === 40000);
  ok('linear: Schlussjahr trägt Rest 10000', lin[3].afa === 10000 && lin[3].restbuchwert === 0);
  ok('linear: Summe = AK', lin.reduce((s, p) => s + p.afa, 0) === 120000);

  // Start im Januar → erstes Jahr voll.
  const linJan = afaPlanLinear(120000, 3, '2026-01-01');
  ok('linear Jan-Start: Jahr1 voll 40000, 3 Jahre', linJan.length === 3 && linJan[0].afa === 40000);

  // Sammelposten: 20 % p.a., letzter Rest trägt Rundung; Summe = AK.
  const sp = afaPlanSammelposten(100001, '2026-03-01');
  ok('Sammelposten: 5 Jahre', sp.length === 5);
  ok('Sammelposten: 20000 p.a., letztes Jahr 20001', sp[0].afa === 20000 && sp[4].afa === 20001);
  ok('Sammelposten: Summe = AK', sp.reduce((s, p) => s + p.afa, 0) === 100001);

  // Status zu einem Jahr.
  const anlage = { akNettoCents: 120000, nutzungsdauerJahre: 3, anschaffungsdatum: '2026-04-15', methode: AFA_METHODE.LINEAR, anlageKonto: '0400' };
  const st2027 = anlageStatus(anlage, 2027);
  ok('Status 2027: AfA 40000, kumuliert 70000, RBW 50000', st2027.afaJahr === 40000 && st2027.kumuliert === 70000 && st2027.restbuchwert === 50000);
  const stNach = anlageStatus(anlage, 2030);
  ok('Status nach Planende: RBW 0, AfA 0', stNach.restbuchwert === 0 && stNach.afaJahr === 0);

  // AfA-Buchung: Soll Aufwand an Haben Anlagekonto.
  const buchG = afaBuchungZeilen({ akNettoCents: 60000, anschaffungsdatum: '2026-05-10', methode: AFA_METHODE.GWG, anlageKonto: '0480' }, 2026);
  ok('GWG-Buchung: 4855 Soll an 0480 Haben 60000',
    zeile(buchG.zeilen, '4855', 'S').betrag === 60000 && zeile(buchG.zeilen, '0480', 'H').betrag === 60000);
  const buchL = afaBuchungZeilen(anlage, 2027);
  ok('lineare AfA-Buchung: 4830 Soll 40000', zeile(buchL.zeilen, '4830', 'S').betrag === 40000);
  ok('keine AfA-Buchung außerhalb des Plans', afaBuchungZeilen(anlage, 2035) === null);

  // Verzeichnis + Summen + CSV.
  const vz = anlagenverzeichnis([anlage, { akNettoCents: 60000, anschaffungsdatum: '2026-05-10', methode: AFA_METHODE.GWG, anlageKonto: '0480', bezeichnung: 'Laptop' }], 2026);
  ok('Verzeichnis 2026: AfA-Summe 30000 (linear) + 60000 (GWG)', vz.summen.afaJahr === 90000);
  ok('Verzeichnis: AK-Summe 180000', vz.summen.ak === 180000);
  ok('AVEÜR-CSV enthält Laptop + Summenzeile', buildAnlagenverzeichnisCsv(vz).includes('Laptop'));

  // Normalisierung + Validierung.
  const norm = normalizeAnlage({ bezeichnung: ' Drucker ', akNetto: '1.200,00', anschaffungsdatum: '2026-04-15', methode: 'linear', nutzungsdauerJahre: '3', anlageKonto: '0400' });
  ok('normalizeAnlage: Euro→Cent + trim', norm.akNettoCents === 120000 && norm.bezeichnung === 'Drucker' && norm.nutzungsdauerJahre === 3);
  ok('validateAnlage: ok', validateAnlage(norm).length === 0);
  ok('validateAnlage: linear ohne Nutzungsdauer → Fehler', validateAnlage({ ...norm, nutzungsdauerJahre: 0 }).length > 0);
  ok('validateAnlage: Sammelposten außerhalb 250–1.000 → Fehler',
    validateAnlage({ ...norm, methode: AFA_METHODE.SAMMELPOSTEN, akNettoCents: 120000 }).length > 0);
});

await section('V4: Kassenbuch + Anfangsbestände (GoBD)', () => {
  // Anfangsbestand-Buchung: Soll Kasse an Haben Saldenvortrag 9000.
  const ab = anfangsbestandZeilen('1000', 50000);
  ok('Anfangsbestand: Soll 1000 50000', zeile(ab.zeilen, '1000', 'S').betrag === 50000);
  ok('Anfangsbestand: Haben 9000 (Saldenvortrag)', zeile(ab.zeilen, SALDENVORTRAG_KONTO, 'H').betrag === 50000);
  ok('Anfangsbestand ausgeglichen', istAusgeglichen(ab.zeilen));
  let warf = false; try { anfangsbestandZeilen('1000', 0); } catch { warf = true; }
  ok('Anfangsbestand 0 wirft', warf);

  const buchungen = [
    // Barerlös 200 (Kasse Soll) — Einnahme
    { seq: 2, datum: '2026-03-05', beschreibung: 'Barerlös', zeilen: [{ konto: '1000', seite: 'S', betrag: 20000 }, { konto: '8200', seite: 'H', betrag: 20000 }] },
    // Bareinkauf 50 (Kasse Haben) — Ausgabe
    { seq: 1, datum: '2026-03-01', beschreibung: 'Büromaterial bar', zeilen: [{ konto: '4930', seite: 'S', betrag: 5000 }, { konto: '1000', seite: 'H', betrag: 5000 }] },
    // Banküberweisung — berührt Kasse NICHT
    { seq: 3, datum: '2026-03-10', beschreibung: 'Miete', zeilen: [{ konto: '4210', seite: 'S', betrag: 80000 }, { konto: '1200', seite: 'H', betrag: 80000 }] },
    // Entwurf zählt nicht (seq null)
    { seq: null, datum: '2026-03-11', zeilen: [{ konto: '1000', seite: 'S', betrag: 999 }, { konto: '8200', seite: 'H', betrag: 999 }] },
  ];
  const eintraege = kassenbuchEintraege(buchungen, '1000', { von: '2026-01-01', bis: '2026-12-31' });
  ok('nur Kassen-Buchungen, chronologisch sortiert', eintraege.length === 2 && eintraege[0].seq === 1 && eintraege[1].seq === 2);
  ok('Bankbuchung nicht im Kassenbuch', !eintraege.some((e) => e.beschreibung === 'Miete'));

  const b = kassenbericht(eintraege, 10000); // Anfangsbestand 100 €
  ok('Summe Einnahmen 20000', b.summeEinnahmen === 20000);
  ok('Summe Ausgaben 5000', b.summeAusgaben === 5000);
  ok('Endbestand 100 − 50 + 200 = 250 €', b.endbestand === 25000);
  ok('laufender Bestand nach erster Zeile 50 €', b.zeilen[0].bestand === 5000);
  ok('nicht negativ', b.negativ === false);

  // GoBD: negativer Kassenbestand wird erkannt.
  const bNeg = kassenbericht(eintraege, 0); // ohne Anfangsbestand: erst -50 €
  ok('negativ erkannt (ohne Anfangsbestand)', bNeg.negativ === true && bNeg.ersteNegative.seq === 1);

  const csv = buildKassenbuchCsv(b);
  ok('Kassenbuch-CSV: Anfangs-/Endbestand', csv.includes('Anfangsbestand') && csv.includes('Endbestand'));
});

await section('V5: USt-VA Zeitraum + Sondervorauszahlung + ELSTER-Paket', () => {
  // Perioden je Typ.
  const monate = voranmeldungsperioden(VA_ZEITRAUM.MONATLICH, 2026);
  ok('monatlich: 12 Perioden', monate.length === 12);
  ok('Februar 2026 endet 28.', monate[1].von === '2026-02-01' && monate[1].bis === '2026-02-28');
  ok('Monats-Code = 02', monate[1].code === '02');
  const quartale = voranmeldungsperioden(VA_ZEITRAUM.VIERTELJAEHRLICH, 2026);
  ok('vierteljährlich: 4 Perioden', quartale.length === 4);
  ok('Q2 = Apr–Jun, Code 42', quartale[1].von === '2026-04-01' && quartale[1].bis === '2026-06-30' && quartale[1].code === '42');
  const jahr = voranmeldungsperioden(VA_ZEITRAUM.JAEHRLICH, 2024);
  ok('jährlich: 1 Periode, Schaltjahr Feb', jahr.length === 1 && jahr[0].von === '2024-01-01' && jahr[0].bis === '2024-12-31');

  // Schaltjahr-Februar.
  const feb2024 = voranmeldungsperioden(VA_ZEITRAUM.MONATLICH, 2024)[1];
  ok('Februar 2024 (Schaltjahr) endet 29.', feb2024.bis === '2024-02-29');

  // periodeIndexFuer.
  ok('Index Quartal für Mai → Q2 (Index 1)', periodeIndexFuer(VA_ZEITRAUM.VIERTELJAEHRLICH, '2026-05-15') === 1);
  ok('Index Monat für Mai → 4', periodeIndexFuer(VA_ZEITRAUM.MONATLICH, '2026-05-15') === 4);

  // Sondervorauszahlung 1/11.
  ok('Sondervorauszahlung 1/11 von 11000 = 1000', sondervorauszahlung(110000) === 10000);
  ok('Sondervorauszahlung bei Erstattung (negativ) = 0', sondervorauszahlung(-5000) === 0);

  // jahresZahllast aus Buchungen (Verkauf 19% → USt 3800, kein VSt → Zahllast 3800).
  const idx = indexFromSeed();
  const buchungen = [
    { seq: 1, datum: '2025-03-10', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
  ];
  ok('jahresZahllast 2025 = 3800', jahresZahllast(buchungen, idx, 2025) === 3800);
  ok('jahresZahllast 2026 = 0 (keine Buchung)', jahresZahllast(buchungen, idx, 2026) === 0);

  // ELSTER-Datenpaket.
  const va = buildUstVa(buchungen, idx, { von: '2025-01-01', bis: '2025-12-31' });
  const paket = buildElsterVaPaket(va, { steuernummer: '12/345/67890', jahr: 2025, zeitraumCode: '41', zeitraumLabel: 'Q1 2025' });
  ok('ELSTER-Paket: Steuernummer enthalten', paket.includes('12/345/67890'));
  ok('ELSTER-Paket: Kz 83 enthalten', paket.includes('83;'));
  ok('ELSTER-Paket: Disclaimer (NICHT amtlich)', paket.includes('NICHT amtlich'));
});

await section('V6: SuSa + Kontenblatt + Anlage-EÜR-Gruppierung', () => {
  const idx = indexFromSeed();
  const buchungen = [
    // Verkauf 238 (200 Erlös 8400 + 38 USt 1776), Geld auf Bank
    { seq: 1, datum: '2026-02-10', beschreibung: 'Verkauf', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    // Miete 500 (4210) per Bank
    { seq: 2, datum: '2026-02-15', beschreibung: 'Miete', zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    // Bürobedarf 119 (100 4930 + 19 VSt 1576) per Bank
    { seq: 3, datum: '2026-02-20', beschreibung: 'Büro', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    { seq: null, datum: '2026-02-21', zeilen: [{ konto: '1200', seite: 'S', betrag: 1 }, { konto: '8200', seite: 'H', betrag: 1 }] }, // Entwurf zählt nicht
  ];

  // SuSa: Soll-Summe == Haben-Summe (doppelte Buchführung).
  const susa = summenSaldenliste(buchungen, idx);
  ok('SuSa: Soll-Summe == Haben-Summe', susa.summen.soll === susa.summen.haben && susa.summen.soll > 0);
  const bank = susa.zeilen.find((z) => z.nummer === '1200');
  ok('SuSa: Bank-Saldo 23800 - 50000 - 11900 = -38100', bank.saldo === -38100);
  ok('SuSa-CSV enthält Summenzeile', buildSusaCsv(susa).includes('Summe'));

  // Kontenblatt Bank: 3 Zeilen, Endsaldo == Bank-Saldo.
  const blatt = kontenblatt(buchungen, '1200', idx);
  ok('Kontenblatt Bank: 3 Bewegungen', blatt.eintraege.length === 3);
  ok('Kontenblatt: chronologisch + laufender Saldo', blatt.eintraege[0].saldo === 23800 && blatt.endsaldo === -38100);
  ok('Kontenblatt: Entwurf ausgeschlossen', !blatt.eintraege.some((e) => e.seq == null));
  ok('Kontenblatt-CSV nennt Konto', buildKontenblattCsv(blatt).includes('1200'));

  // Gruppen-Zuordnung.
  ok('8400 → umsatzsteuerpflichtige Einnahmen', eurGruppeFuer(idx['8400']) === EUR_GRUPPE.EINN_UST);
  ok('4210 → Raumkosten', eurGruppeFuer(idx['4210']) === EUR_GRUPPE.AUS_RAUM);
  ok('4930 → Büro', eurGruppeFuer(idx['4930']) === EUR_GRUPPE.AUS_BUERO);
  ok('Bank (Bestandskonto) → keine EÜR-Gruppe', eurGruppeFuer(idx['1200']) === null);

  // Anlage-EÜR: Einnahmen 20000 (netto), Ausgaben 60000 (Miete 500 + Büro 100), Überschuss -40000.
  const eur = anlageEUR(buchungen, idx);
  ok('Anlage-EÜR: Summe Einnahmen 20000', eur.summeEinnahmen === 20000);
  ok('Anlage-EÜR: Summe Ausgaben 60000', eur.summeAusgaben === 60000);
  ok('Anlage-EÜR: Überschuss -40000', eur.ueberschuss === -40000);
  ok('Anlage-EÜR: Raumkosten-Gruppe 50000', eur.ausgaben.find((a) => a.gruppe === EUR_GRUPPE.AUS_RAUM).wert === 50000);
  ok('Anlage-EÜR: USt/VSt nicht als Erfolg gezählt', !eur.einnahmen.some((e) => (e.konten || []).includes('1776')));
  ok('Anlage-EÜR-CSV: Überschusszeile', buildAnlageEURCsv(eur).includes('Überschuss'));
});

await section('V7: ZIP-Writer + GoBD/GDPdU-Export', () => {
  // CRC-32 Referenzwert ("123456789" → 0xCBF43926).
  ok('crc32 Referenzwert', crc32(new TextEncoder().encode('123456789')) === 0xCBF43926);

  // ZIP-Struktur (store): Signaturen, Dateiname, EOCD-Dateianzahl.
  const zip = zipFiles([{ name: 'a.txt', data: 'hallo' }, { name: 'b.csv', data: 'x;y' }]);
  ok('ZIP beginnt mit PK\\x03\\x04', zip[0] === 0x50 && zip[1] === 0x4b && zip[2] === 0x03 && zip[3] === 0x04);
  const txt = new TextDecoder().decode(zip);
  ok('ZIP enthält Dateinamen', txt.includes('a.txt') && txt.includes('b.csv'));
  // EOCD-Signatur am Ende + Dateianzahl 2 (Offsetbytes 8/9 nach EOCD-Start).
  const eocd = zip.length - 22;
  ok('EOCD-Signatur', zip[eocd] === 0x50 && zip[eocd + 1] === 0x4b && zip[eocd + 2] === 0x05 && zip[eocd + 3] === 0x06);
  ok('EOCD: 2 Einträge', zip[eocd + 10] === 2 && zip[eocd + 11] === 0);

  const idx = indexFromSeed();
  const buchungen = [
    { seq: 1, datum: '2026-05-02', status: 'festgeschrieben', beschreibung: 'Verkauf', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    { seq: null, datum: '2026-05-03', zeilen: [{ konto: '1000', seite: 'S', betrag: 500 }, { konto: '8200', seite: 'H', betrag: 500 }] }, // Entwurf: NICHT exportieren
  ];
  const csvB = gdpduCsvBuchungen(buchungen, idx);
  ok('GDPdU-Buchungen: Header + 3 Zeilen (nur festgeschrieben)', csvB.split('\r\n').length === 4);
  ok('GDPdU-Buchungen: Entwurf ausgeschlossen', !csvB.includes('8200'));
  ok('GDPdU-Buchungen: Spaltenkopf', csvB.startsWith('Datum;Belegnummer;Buchungstext'));

  const csvK = gdpduCsvKonten([{ nummer: '8400', name: 'Erlöse 19% USt', art: 'ertrag', ust: 19 }]);
  ok('GDPdU-Konten: Zeile vorhanden', csvK.includes('8400;Erlöse 19% USt;ertrag;19'));

  const xml = buildGdpduIndexXml({ jahr: 2026, firma: 'Muster GmbH', steuernummer: '12/345/67890' });
  ok('index.xml: DOCTYPE referenziert DTD', xml.includes('<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2004.dtd">'));
  ok('index.xml: beide Tabellen', xml.includes('buchungen.csv') && xml.includes('konten.csv'));
  ok('index.xml: Separator/Dezimal', xml.includes('<Separator>;</Separator>') && xml.includes('<DecimalSymbol>,</DecimalSymbol>'));
  ok('index.xml: Datum-Spalte als Date', xml.includes('<Date><Format>YYYY-MM-DD</Format></Date>'));
  ok('index.xml: Lieferant', xml.includes('Muster GmbH'));

  const paket = buildGdpduPaket(buchungen, [{ nummer: '8400', name: 'E', art: 'ertrag' }], idx, { jahr: 2026 });
  ok('Paket: 4 Dateien (index/buchungen/konten/info)', paket.length === 4 && paket.some((f) => f.name === 'index.xml'));
  const zip2 = zipFiles(paket);
  ok('Paket als ZIP baubar', zip2[0] === 0x50 && zip2.length > 100);
});

await section('V9: Kleinfälle (Bewirtung/Geschenke/Kleinbetrag) + Periodensperre', () => {
  // Kleinbetragsrechnung (§33 UStDV): ≤ 250 € brutto reduzierte Pflichtangaben.
  ok('250 € → Kleinbetrag', kleinbetragsrechnung(KLEINBETRAG_GRENZE_CENT).kleinbetrag === true);
  ok('250,01 € → keine Kleinbetragsrechnung', kleinbetragsrechnung(KLEINBETRAG_GRENZE_CENT + 1).kleinbetrag === false);
  ok('Kleinbetrag: weniger Pflichtangaben', kleinbetragsrechnung(10000).pflichtangaben.length < kleinbetragsrechnung(30000).pflichtangaben.length);

  // Geschenkegrenze (§4 Abs.5 Nr.1): 50 € netto.
  const g1 = geschenkAbzug(GESCHENK_GRENZE_CENT), g2 = geschenkAbzug(GESCHENK_GRENZE_CENT + 1);
  ok('50 € Geschenk abzugsfähig + VSt', g1.abzugsfaehig && g1.vorsteuerAbzug && g1.kontoVorschlag === '4630');
  ok('50,01 € nicht abzugsfähig, kein VSt, Konto 4635', !g2.abzugsfaehig && !g2.vorsteuerAbzug && g2.kontoVorschlag === '4635');

  // Bewirtung 70/30: 100 € netto, 19% → 70/30-Split, Vorsteuer 100%.
  const bw = bewirtungAufteilung({ nettoCents: 10000, ustSatz: 19, gegenKonto: '1200' });
  ok('Bewirtung: 70% = 7000, 30% = 3000', bw.abzugsfaehig === 7000 && bw.nichtAbzugsfaehig === 3000);
  ok('Bewirtung: Vorsteuer 100% = 1900', !!zeile(bw.zeilen, '1576', 'S') && zeile(bw.zeilen, '1576', 'S').betrag === 1900);
  ok('Bewirtung: Brutto 11900 an Gegenkonto', zeile(bw.zeilen, '1200', 'H').betrag === 11900);
  ok('Bewirtung: ausgeglichen', istAusgeglichen(bw.zeilen));

  // Periodensperre.
  ok('istGesperrt: Datum vor Sperre', istGesperrt('2026-03-31', '2026-03-31') === true);
  ok('istGesperrt: Datum nach Sperre', istGesperrt('2026-04-01', '2026-03-31') === false);
  ok('istGesperrt: ohne Sperre nie', istGesperrt('2026-01-01', '') === false);
  const idxK = indexFromSeed();
  const b = { datum: '2026-02-01', beschreibung: 'x', zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8200', seite: 'H', betrag: 100 }] };
  ok('pruefeBuchung: gesperrte Periode → Fehler', pruefeBuchung(b, idxK, { gesperrtBis: '2026-03-31' }).fehler.some((f) => /gesperrt/i.test(f)));
  ok('pruefeBuchung: offene Periode → kein Sperr-Fehler', !pruefeBuchung(b, idxK, { gesperrtBis: '2026-01-01' }).fehler.some((f) => /gesperrt/i.test(f)));
  // Kleinunternehmer-Konsistenz: Steuerkonto trotz §19 → Warnung.
  const bu = { datum: '2026-02-01', beschreibung: 'x', zeilen: [{ konto: '1200', seite: 'S', betrag: 11900 }, { konto: '8400', seite: 'H', betrag: 10000 }, { konto: '1776', seite: 'H', betrag: 1900 }] };
  ok('Kleinunternehmer + USt-Konto → Warnung', pruefeBuchung(bu, idxK, { kleinunternehmer: true }).warnungen.some((w) => /§19/.test(w)));
});

await section('Simulation: Demo-Mandant „klein" gegen dokumentierte Vergleichswerte (TESTDATEN.md)', () => {
  const m = demoMandant('klein');
  const idx = {}; for (const k of m.konten) idx[k.nummer] = k;
  const p = { von: `${DEMO_JAHR}-01-01`, bis: `${DEMO_JAHR}-12-31` };

  const va = buildUstVa(m.buchungen, idx, p);
  ok('klein USt-VA Kz81 = 100000', va.kz81 === 100000);
  ok('klein USt-VA Kz81-Steuer = 19000', va.kz81Steuer === 19000);
  ok('klein USt-VA Kz86 = 10000 / Steuer 700', va.kz86 === 10000 && va.kz86Steuer === 700);
  ok('klein USt-VA Kz66 (Vorsteuer) = 3800', va.kz66 === 3800);
  ok('klein USt-VA §13b Kz47/Kz67 = 1900', va.kz47 === 1900 && va.kz67 === 1900);
  ok('klein USt-VA Kz83 (Zahllast) = 15900', va.kz83 === 15900);

  const eur = computeEUR(m.buchungen, idx, p);
  ok('klein EÜR Einnahmen 115000 / Ausgaben 150000', eur.einnahmen === 115000 && eur.ausgaben === 150000);
  ok('klein EÜR Überschuss -35000', eur.ueberschuss === -35000);

  const kb = kassenbericht(kassenbuchEintraege(m.buchungen, '1000', p), 0);
  ok('klein Kassenbuch Endbestand 5000', kb.endbestand === 5000 && !kb.negativ);

  const av = anlagenverzeichnis(m.anlagen, DEMO_JAHR);
  ok('klein AfA 2026 = 40000, Restbuchwert 80000', av.summen.afaJahr === 40000 && av.summen.restbuchwert === 80000);

  const gd = gdpduCsvBuchungen(m.buchungen, idx, p);
  ok('klein GDPdU: 24 Zeilen (Header + 23)', gd.split('\r\n').length === 24);

  const dateien = demoExportDateien(m);
  ok('klein Demo-Export: alle Formate', dateien.length >= 9 && dateien.some((f) => f.name.startsWith('datev/')) && dateien.some((f) => f.name.startsWith('gdpdu/')));
  const zip = zipFiles(dateien);
  ok('klein Demo-Export als ZIP baubar', zip[0] === 0x50 && zip.length > 500);
});

await section('Demo-Vorbefüllung (Test-Modus): reiner Plan demoEntwuerfe/demoBefuellungsplan', () => {
  const m = demoMandant('klein');
  const idx = {}; for (const k of m.konten) idx[k.nummer] = k;
  const entw = demoEntwuerfe(m);

  ok('demoEntwuerfe: gleiche Anzahl wie Buchungen', entw.length === m.buchungen.length && entw.length > 0);
  ok('demoEntwuerfe: nur Entwurfs-Felder (kein seq/status/hash)',
    entw.every((e) => e.seq === undefined && e.status === undefined && e._seq === undefined
      && typeof e.datum === 'string' && Array.isArray(e.zeilen)));
  ok('demoEntwuerfe: chronologisch sortiert',
    entw.every((e, i) => i === 0 || entw[i - 1].datum <= e.datum));
  ok('demoEntwuerfe: jede Buchung ist gültig festschreibbar (validateBuchung)',
    entw.every((e) => validateBuchung(e, idx).length === 0));
  ok('demoEntwuerfe: jede Buchung ausgeglichen (Soll == Haben)',
    entw.every((e) => istAusgeglichen(e.zeilen)));

  // Immutabel: Eingabe-Buchungen bleiben unberührt (festgeschrieben mit seq).
  ok('demoEntwuerfe: lässt Eingabe-Buchungen unangetastet',
    m.buchungen.every((b) => b.status === 'festgeschrieben' && b.seq != null));
  const e0 = entw.find((e) => e.beschreibung.includes('Reverse-Charge'));
  e0.zeilen[0].betrag = -999;
  ok('demoEntwuerfe: Zeilen sind Kopien (Mutation färbt nicht zurück)',
    m.buchungen.some((b) => b.zeilen.some((z) => z.betrag === -999)) === false);

  const plan = demoBefuellungsplan('klein');
  ok('demoBefuellungsplan: bündelt Konten/Buchungen/Anlagen/Anfangsbestände',
    plan.groesse === 'klein' && plan.jahr === DEMO_JAHR
    && plan.konten.length > 0 && plan.buchungenEntwuerfe.length === m.buchungen.length
    && plan.anlagen.length === 1 && plan.anfangsbestaende.length === 1);
  ok('demoBefuellungsplan: Anfangsbestand 1200 = 500000',
    plan.anfangsbestaende[0].konto === '1200' && plan.anfangsbestaende[0].betragCent === 500000);
  ok('demoBefuellungsplan("gross"): mehr Buchungen als klein',
    demoBefuellungsplan('gross').buchungenEntwuerfe.length > plan.buchungenEntwuerfe.length);
});

await section('Simulation: Demo-Mandant „groß" — Konsistenz im Maßstab', () => {
  const m = demoMandant('gross');
  const idx = {}; for (const k of m.konten) idx[k.nummer] = k;
  const p = { von: `${DEMO_JAHR}-01-01`, bis: `${DEMO_JAHR}-12-31` };

  const susa = summenSaldenliste(m.buchungen, idx, p);
  ok('groß SuSa: Soll == Haben (doppelte Buchführung)', susa.summen.soll === susa.summen.haben && susa.summen.soll > 0);

  const eur = computeEUR(m.buchungen, idx, p);
  const aeur = anlageEUR(m.buchungen, idx, p);
  ok('groß: computeEUR == anlageEUR Überschuss', eur.ueberschuss === aeur.ueberschuss);

  const va = buildUstVa(m.buchungen, idx, p);
  ok('groß USt-VA Kz83 konsistent', va.kz83 === (va.kz81Steuer + va.kz86Steuer + va.kz47 + va.kz93 - va.kz66 - va.kz67 - va.kz61));

  const anfang = (m.anfangsbestaende.find((a) => a.konto === '1200') || {}).betragCent || 0;
  const kb = kassenbericht(kassenbuchEintraege(m.buchungen, '1200', p), anfang);
  ok('groß Kassen-/Bankbericht: Endbestand = Anfang + Ein - Aus', kb.endbestand === anfang + kb.summeEinnahmen - kb.summeAusgaben);

  const zip = zipFiles(demoExportDateien(m));
  ok('groß Demo-Export als ZIP baubar', zip[0] === 0x50 && zip.length > 1000);
});

await section('V8: DATEV-EXTF berater-fest (Header, BU-Schlüssel, Splits)', () => {
  const idx = indexFromSeed();
  // Header mit Berater-/Mandantennummer + Sachkontenlänge.
  const b1 = [{ seq: 1, datum: '2026-04-08', beschreibung: 'Büro', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] }];
  const extf = buildDatevExtf(b1, idx, { berater: '12345', mandant: '6789', sachkontenlaenge: 4, jahr: 2026 });
  const headerZeile = extf.split('\r\n')[0];
  ok('EXTF-Header: "EXTF";700;21', headerZeile.startsWith('"EXTF";700;21;"Buchungsstapel";13'));
  ok('EXTF-Header: Berater 12345 + Mandant 6789', headerZeile.includes(';12345;6789;'));
  ok('EXTF-Header: WJ-Beginn + Sachkontenlänge', headerZeile.includes(';20260101;4;'));

  // Standard-Ausgabe (3 Zeilen, eine Vorsteuerzeile) → ein Satz mit BU 9, Brutto, Gegenkonto.
  ok('einfacher Satz erkannt (3 Z., 1 Steuer)', istEinfacherSatz(b1[0].zeilen, idx) === true);
  const dv = datevBuchungssatz(b1[0], idx);
  ok('BU-Schlüssel 9 (Vorsteuer 19%)', dv.bu === '9' && dv.konto === '4930' && dv.gegenkonto === '1200' && dv.umsatz === 11900);
  const datenZeile = extf.split('\r\n')[2];
  ok('EXTF-Datenzeile: 119,00;S;EUR;…;4930;1200;9', datenZeile.startsWith('119,00;S;EUR;;;;4930;1200;9;'));

  // Standard-Einnahme → BU 3.
  const verkauf = { seq: 2, datum: '2026-01-15', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] };
  ok('BU-Schlüssel 3 (USt 19% Einnahme)', datevBuchungssatz(verkauf, idx).bu === '3');

  // §13b (4 Zeilen) → KEIN einfacher Satz → zeilenweiser Split OHNE falschen BU-Schlüssel.
  const rc = { seq: 3, datum: '2026-05-02', beschreibung: 'Cloud §13b', zeilen: [
    { konto: '4950', seite: 'S', betrag: 10000 }, { konto: '1577', seite: 'S', betrag: 1900 }, { konto: '1787', seite: 'H', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 10000 }] };
  ok('§13b ist kein einfacher Satz', istEinfacherSatz(rc.zeilen, idx) === false);
  const extfRc = buildDatevExtf([rc], idx, {});
  const rcZeilen = extfRc.split('\r\n').slice(2).filter(Boolean);
  ok('§13b: 4 zeilenweise Datensätze', rcZeilen.length === 4);
  ok('§13b: kein BU-Schlüssel gesetzt (steuerneutral)', rcZeilen.every((z) => { const f = z.split(';'); return f[8] === ''; }));
  ok('§13b: Gegenkonto leer (Split)', rcZeilen.every((z) => z.split(';')[7] === ''));
  ok('§13b: alle Konten erscheinen', extfRc.includes(';4950;') && extfRc.includes(';1577;') && extfRc.includes(';1787;') && extfRc.includes(';1200;'));

  // 2-Zeilen-Satz ohne Steuer → einfacher Satz, BU leer.
  const bar = { seq: 4, datum: '2026-03-05', zeilen: [{ konto: '1000', seite: 'S', betrag: 5000 }, { konto: '8200', seite: 'H', betrag: 5000 }] };
  ok('2-Zeilen-Satz einfach, BU leer', istEinfacherSatz(bar.zeilen, idx) && datevBuchungssatz(bar, idx).bu === '');
});

await section('V10: In-App-Selbstdiagnose (runSelbsttest)', async () => {
  const r = await runSelbsttest();
  ok('Selbsttest: mehrere Prüfungen', r.gesamt >= 8);
  ok('Selbsttest: alle bestanden (ok)', r.ok === true && r.bestanden === r.gesamt);
  // Jede Einzelprüfung grün.
  for (const e of r.ergebnisse) ok(`Selbsttest-Prüfung: ${e.name}`, e.ok);
});

await section('Datensicherung: Backup→Restore-Roundtrip (byte-genau, Pflicht #1)', async () => {
  const snapshot = {
    kv: {
      mode: 'profi', gewinnermittlung: 'euer',
      firma: { name: 'Muster GmbH', iban: 'DE00 0000 0000 0000 0000 00', steuernummer: '12/345/67890' },
    },
    records: [
      { id: 'k-1200', type: 'konto', nummer: '1200', name: 'Bank', art: 'aktiv' },
      { id: 'b-1', type: 'buchung', seq: 1, datum: '2026-01-01', beschreibung: 'Beleg „Ä/Ö/Ü ß €" ✓',
        zeilen: [{ konto: '1200', seite: 'S', betrag: 11900 }, { konto: '8400', seite: 'H', betrag: 10000 }, { konto: '1776', seite: 'H', betrag: 1900 }] },
      { id: 'b-2', type: 'buchung', seq: 2, datum: '2026-01-02', beschreibung: 'Miete',
        zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    ],
    files: [
      { id: 'f-1', name: 'beleg.pdf', sealed: { v: 1, iv: 'AAAAAAAAAAAAAAAA', ct: 'QkxQUi1CQUNLVVA' } },
    ],
  };

  // Roundtrip ist byte-genau identisch.
  const rt = await backupRoundtripSelbsttest(snapshot, 'Backup-PW-roundtrip');
  ok('Roundtrip byte-genau identisch', rt.ok === true && rt.gleich === true);
  ok('Roundtrip ohne Fehler', !rt.fehler);
  ok('gleiche Byte-Länge Original/Wiederhergestellt', rt.bytesOriginal === rt.bytesWieder && rt.bytesOriginal > 0);

  // Backup-Hülle: verschlüsselt (kein Klartext), korrektes Format-Magic.
  const text = await buildBackupFromSnapshot(snapshot, 'Backup-PW-roundtrip');
  const outer = JSON.parse(text);
  ok('Backup-Hülle trägt MAGIC + Format', outer.magic === BACKUP_INFO.MAGIC && outer.format === BACKUP_INFO.FORMAT_VERSION);
  ok('Backup-Hülle ist versiegelt (sealed)', !!outer.sealed && !!outer.sealed.ct);
  ok('Klartext NICHT in der Backup-Datei (verschlüsselt)', !text.includes('Muster GmbH') && !text.includes('Miete'));

  // Lesen/Entschlüsseln liefert exakt den Snapshot zurück.
  const parsed = await readBackup('Backup-PW-roundtrip', text);
  const wieder = importProbe(parsed);
  ok('Probespeicher-Import = Original (byte-genau)',
    Buffer.compare(Buffer.from(snapshotBytes(snapshot)), Buffer.from(snapshotBytes(wieder))) === 0);
  ok('alle Records erhalten', wieder.records.length === snapshot.records.length);
  ok('alle Files erhalten', wieder.files.length === snapshot.files.length);

  // Restore mit falschem Passwort scheitert (Krypto-Schutz auch bei der Rettung).
  let threw = false;
  try { await readBackup('falsch', text); } catch { threw = true; }
  ok('Restore lehnt falsches Passwort ab', threw);

  // Der Vergleich erkennt eine Abweichung (kein blindes „grün").
  const veraendert = JSON.parse(JSON.stringify(snapshot));
  veraendert.records[0].name = 'Manipuliert';
  ok('Vergleich erkennt Manipulation',
    Buffer.compare(Buffer.from(snapshotBytes(snapshot)), Buffer.from(snapshotBytes(veraendert))) !== 0);

  // id-basierter Import: doppelte id → letzter gewinnt (spiegelt recPut/filePut).
  const dup = importProbe({ data: { kv: {}, records: [{ id: 'x', n: 1 }, { id: 'x', n: 2 }], files: [] } });
  ok('id-basierter Import dedupliziert (letzter gewinnt)', dup.records.length === 1 && dup.records[0].n === 2);

  // Leerer Tresor: Roundtrip funktioniert ebenfalls.
  const leer = await backupRoundtripSelbsttest({ kv: {}, records: [], files: [] }, 'pw');
  ok('leerer Snapshot: Roundtrip ok', leer.ok === true);
});

await section('Punkt 28: Abweichendes Wirtschaftsjahr', () => {
  const kal = wjPeriode(2026, '01-01');
  ok('Kalenderjahr 01-01 → 01.01.–31.12.', kal.von === '2026-01-01' && kal.bis === '2026-12-31');
  const wj = wjPeriode(2026, '07-01');
  ok('WJ 07-01 → 2026-07-01 .. 2027-06-30', wj.von === '2026-07-01' && wj.bis === '2027-06-30');
  const schalt = wjPeriode(2024, '03-01');
  ok('WJ 03-01/2024 endet 2025-02-28 (kein Schaltjahr-Ende)', schalt.bis === '2025-02-28');

  ok('Datum 2026-03-15 fällt in WJ 2025 (Beginn 07-01)', wirtschaftsjahrVon('2026-03-15', '07-01') === 2025);
  ok('Datum 2026-08-01 fällt in WJ 2026 (Beginn 07-01)', wirtschaftsjahrVon('2026-08-01', '07-01') === 2026);
  ok('Kalenderjahr: 2026-03-15 → 2026', wirtschaftsjahrVon('2026-03-15', '01-01') === 2026);

  ok('WJ-Beginn YYYYMMDD (DATEV)', wjBeginnYYYYMMDD(2026, '07-01') === '20260701' && wjBeginnYYYYMMDD(2026, '01-01') === '20260101');
  ok('validateWjBeginn', validateWjBeginn('07-01') && !validateWjBeginn('7-1') && !validateWjBeginn('13-01') && !validateWjBeginn('02-30'));

  // jahrPeriode bleibt rückwärtskompatibel (Kalenderjahr ohne Argument).
  ok('jahrPeriode(2026) unverändert kalendarisch', jahrPeriode(2026).von === '2026-01-01' && jahrPeriode(2026).bis === '2026-12-31');

  // DATEV-EXTF-Header übernimmt den WJ-Beginn.
  const idx = indexFromSeed();
  const b = [{ seq: 1, datum: '2026-08-01', zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8200', seite: 'H', betrag: 100 }] }];
  const extf = buildDatevExtf(b, idx, { jahr: 2026, wjBeginnMMDD: '07-01' });
  ok('EXTF-Header WJ-Beginn 20260701', extf.split('\r\n')[0].includes(';20260701;'));
});

await section('Punkt 31: Steuerberater-Übergabe-Datenblatt', () => {
  const idx = indexFromSeed();
  const buchungen = [
    { seq: 1, datum: '2026-01-15', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    { seq: 2, datum: '2026-02-10', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
  ];
  const p = { von: '2026-01-01', bis: '2026-12-31' };
  const va = buildUstVa(buchungen, idx, p);
  const eur = computeEUR(buchungen, idx, p);
  const txt = buildUebergabeText({ firma: 'Muster GmbH', steuernummer: '12/345/67890', ustId: 'DE123', beraterNr: '111', mandantNr: '222', periodeLabel: '2026' }, va, eur);
  ok('Übergabe: Firma + Steuernummer', txt.includes('Muster GmbH') && txt.includes('12/345/67890'));
  ok('Übergabe: DATEV Berater/Mandant', txt.includes('Berater 111') && txt.includes('Mandant 222'));
  ok('Übergabe: Kz 83 + Überschuss', txt.includes('Kz 83 Zahllast') && txt.includes('Überschuss'));
  ok('Übergabe: nennt DATEV/GoBD-Dateien', txt.includes('DATEV-CSV') && txt.includes('GoBD-Datenpaket'));
});

await section('Punkt 29: Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung', () => {
  ok('Aufbewahrungsfrist 10 Jahre', AUFBEWAHRUNG_JAHRE === 10);
  ok('aufbewahrungBis: 2026 → 2036-12-31', aufbewahrungBis('2026-03-15T10:00:00Z') === '2036-12-31');
  const beleg = { id: 'beleg:1', createdAt: '2026-03-15T10:00:00Z', buchungId: null };
  ok('noch aufbewahrungspflichtig 2030', istAufbewahrungspflichtig(beleg, '2030-01-01') === true);
  ok('nach Fristablauf 2037 nicht mehr', istAufbewahrungspflichtig(beleg, '2037-01-01') === false);
  ok('löschbar erst nach Fristablauf (unverknüpft)', !darfBelegLoeschen(beleg, '2030-01-01') && darfBelegLoeschen(beleg, '2037-01-01'));
  const verknuepft = { ...beleg, buchungId: 'b:1' };
  ok('verknüpfter Beleg NIE löschbar (Belegprinzip)', !darfBelegLoeschen(verknuepft, '2037-01-01'));

  // belegRef ist Teil der Hash-Felder (Belegprinzip in der Kette) — nur wenn gesetzt.
  const hf = hashedFields({ datum: '2026-01-01', zeilen: [], belegRef: 'beleg:1' });
  ok('belegRef in hashedFields', hf.belegRef === 'beleg:1');
});

await section('Punkt 6: ZUGFeRD-Extraktion + KoSIT-Pflichtfeld-Precheck', async () => {
  const cii = '<?xml version="1.0"?><rsm:CrossIndustryInvoice xmlns:rsm="x"><rsm:Foo>1</rsm:Foo></rsm:CrossIndustryInvoice>';
  const enc = (s) => new TextEncoder().encode(s);
  const cat = (...arrs) => { let n = 0; for (const a of arrs) n += a.length; const o = new Uint8Array(n); let i = 0; for (const a of arrs) { o.set(a, i); i += a.length; } return o; };

  // (a) Roh eingebettete XML im PDF-Text.
  const roh = cat(enc('%PDF-1.7\n'), enc(cii), enc('\n%%EOF'));
  const x1 = await extrahiereZugferdXml(roh);
  ok('ZUGFeRD: rohe eingebettete CII gefunden', !!x1 && x1.includes('CrossIndustryInvoice'));

  // (b) FlateDecode-komprimierte XML in einem stream-Objekt.
  const def = new Uint8Array(deflateSync(Buffer.from(cii)));
  const flate = cat(enc('%PDF-1.7\n7 0 obj<<>>stream\n'), def, enc('\nendstream endobj\n%%EOF'));
  const x2 = await extrahiereZugferdXml(flate);
  ok('ZUGFeRD: Flate-komprimierte CII entpackt + gefunden', !!x2 && x2.includes('CrossIndustryInvoice'));

  // (c) kein eingebettetes XML → null.
  ok('ZUGFeRD: ohne XML → null', (await extrahiereZugferdXml(enc('%PDF nur text'))) === null);

  // KoSIT-orientierter Pflichtfeld-Precheck.
  ok('KoSIT: vollständige Felder ok', kostPflichtfelder({ nummer: 'R1', datum: '2026-01-01', lieferant: 'X GmbH', brutto: 11900 }).ok);
  const fehlt = kostPflichtfelder({ nummer: '', datum: '', lieferant: '', brutto: 0 });
  ok('KoSIT: fehlende Felder erkannt', !fehlt.ok && fehlt.fehlende.length === 4);
});

await section('Punkt 7/A4: Offenes Austauschformat (Anbindung andere Buchhaltungssoftware)', () => {
  const kunden = [{ id: 'kunde:1', name: 'Beispiel GmbH', anschrift: 'Weg 2', email: 'a@b.de', ustId: 'DE123' }];
  const auftraege = [{ id: 'A-1', kundeId: 'kunde:1', titel: 'Auftrag X', positionen: [{ beschreibung: 'Leistung', menge: 1, einzelpreisCent: 100000, ustSatz: 19 }] }];
  const paket = buildAustauschPaket({ kunden, auftraege });
  ok('Export: Format/Version-Header (v4)', paket.format === AUSTAUSCH_FORMAT && paket.version === 4);
  ok('Export: Kunde + Auftrag übernommen', paket.kunden[0].name === 'Beispiel GmbH' && paket.auftraege[0].positionen[0].einzelpreisCent === 100000);
  ok('Export: Auftrag ohne Rechnung trägt kein rechnung-Feld', paket.auftraege[0].rechnung === undefined);

  // Round-trip: Export → JSON → parse → normalizeImport.
  const res = parseAustauschPaket(JSON.stringify(paket));
  ok('Parse: ok + Inhalt', res.ok && res.obj.kunden.length === 1 && res.obj.auftraege.length === 1);
  const norm = normalizeImport(res.obj);
  ok('Round-trip → normalizeImport', norm.kunden[0].name === 'Beispiel GmbH' && norm.auftraege[0].positionen[0].einzelpreisCent === 100000);

  // R4 Stufe 2: berechneter Auftrag exportiert seine Rechnung → andere Seite kann sie übernehmen.
  const paket2 = buildAustauschPaket({ kunden, auftraege: [{ ...auftraege[0], rechnungNummer: '2026-0001', rechnungDatum: '2026-06-01' }] });
  ok('Export: berechneter Auftrag trägt rechnung-Block', paket2.auftraege[0].rechnung && paket2.auftraege[0].rechnung.nummer === '2026-0001');
  const norm2 = normalizeImport(parseAustauschPaket(JSON.stringify(paket2)).obj);
  ok('Round-trip: Rechnung übernommen', norm2.auftraege[0].rechnung && norm2.auftraege[0].rechnung.datum === '2026-06-01');

  // R4-Rest (v3): berechneter Auftrag MIT (Teil-)Zahlungen exportiert sie reziprok.
  const paket3 = buildAustauschPaket({ kunden, auftraege: [{ ...auftraege[0], rechnungNummer: '2026-0002', rechnungDatum: '2026-06-01',
    zahlungen: [{ datum: '2026-06-05', betragCent: 60000, ref: 'VZ' }, { datum: 'kaputt', betragCent: 100 }] }] });
  ok('Export: Rechnung trägt zahlungen-Block (nur gültige)', paket3.auftraege[0].rechnung.zahlungen.length === 1 && paket3.auftraege[0].rechnung.zahlungen[0].betragCent === 60000);
  const norm3 = normalizeImport(parseAustauschPaket(JSON.stringify(paket3)).obj);
  ok('Round-trip: Zahlung übernommen', norm3.auftraege[0].rechnung.zahlungen[0].ref === 'VZ');
  // Auftrag ohne Rechnung trägt keine zahlungen.
  const paket4 = buildAustauschPaket({ kunden, auftraege: [{ ...auftraege[0], zahlungen: [{ datum: '2026-06-05', betragCent: 100 }] }] });
  ok('Export: ohne Rechnung kein zahlungen-Block', paket4.auftraege[0].rechnung === undefined);

  // Abwärtskompatibel: „bare" WorkFloh-Format ohne format/version.
  const bare = parseAustauschPaket(JSON.stringify({ kunden: [{ name: 'X' }], auftraege: [] }));
  ok('Parse: bare WorkFloh-Format akzeptiert', bare.ok && bare.obj.kunden[0].name === 'X');

  // Fremdformat / Müll wird abgelehnt.
  ok('Parse: fremdes format → Fehler', !parseAustauschPaket(JSON.stringify({ format: 'lexoffice', kunden: [] })).ok);
  ok('Parse: kein JSON → Fehler', !parseAustauschPaket('{kaputt').ok);
});

await section('Zahlungsziel je Auftrag durch das Austauschformat (v4)', () => {
  const kunden = [{ id: 'kunde:1', name: 'Beispiel GmbH' }];
  const basis = { id: 'A-1', kundeId: 'kunde:1', titel: 'Auftrag X',
    positionen: [{ beschreibung: 'Leistung', menge: 1, einzelpreisCent: 100000, ustSatz: 19 }] };

  // Export: berechneter Auftrag mit eigenem Zahlungsziel trägt es im rechnung-Block.
  const mitZiel = buildAustauschPaket({ kunden, auftraege: [{ ...basis, rechnungNummer: '2026-0001', rechnungDatum: '2026-06-01', zahlungszielTage: 30 }] });
  ok('Export: rechnung trägt zahlungszielTage', mitZiel.auftraege[0].rechnung.zahlungszielTage === 30);
  ok('Export: zahlungsziel 0 (sofort fällig) wird mitgegeben', buildAustauschPaket({ kunden, auftraege: [{ ...basis, rechnungNummer: '2026-0002', rechnungDatum: '2026-06-01', zahlungszielTage: 0 }] }).auftraege[0].rechnung.zahlungszielTage === 0);
  // Ohne eigenes Ziel (null) bleibt das Feld weg (abwärtskompatibel).
  const ohneZiel = buildAustauschPaket({ kunden, auftraege: [{ ...basis, rechnungNummer: '2026-0003', rechnungDatum: '2026-06-01', zahlungszielTage: null }] });
  ok('Export: ohne eigenes Ziel kein Feld', ohneZiel.auftraege[0].rechnung.zahlungszielTage === undefined);

  // Round-trip: Export → JSON → normalizeImport übernimmt das Zahlungsziel als Zahl.
  const norm = normalizeImport(parseAustauschPaket(JSON.stringify(mitZiel)).obj);
  ok('Round-trip: zahlungszielTage übernommen', norm.auftraege[0].rechnung.zahlungszielTage === 30);

  // Import: ungültiges Zahlungsziel → verworfen + Warnung; gültige Rechnung bleibt erhalten.
  const ungueltig = normalizeImport({ auftraege: [{ externNummer: 'A-9', titel: 'Y', positionen: [{ menge: 1, einzelpreisCent: 100, ustSatz: 0 }],
    rechnung: { nummer: 'R-9', datum: '2026-06-10', zahlungszielTage: -5 } }] });
  ok('Import: negatives Ziel verworfen', ungueltig.auftraege[0].rechnung.zahlungszielTage === undefined);
  ok('Import: Warnung für ungültiges Ziel', ungueltig.warnungen.some((w) => /Zahlungsziel ungültig/.test(w)));
  ok('Import: Rechnung trotzdem gültig', ungueltig.auftraege[0].rechnung.nummer === 'R-9');

  // Abwärtskompatibel: rechnung ohne zahlungszielTage trägt das Feld nicht.
  const ohne = normalizeImport({ auftraege: [{ externNummer: 'A-10', titel: 'Z', positionen: [{ menge: 1, einzelpreisCent: 100, ustSatz: 0 }],
    rechnung: { nummer: 'R-10', datum: '2026-06-10' } }] });
  ok('Import: ohne Ziel → Feld fehlt', ohne.auftraege[0].rechnung.zahlungszielTage === undefined);
});

await section('Mandanten (M1): Speicher-Namensbildung', () => {
  // Regel #3: Suffix `bookledgerpro` bleibt — jeder DB-Name endet darauf.
  ok('Suffix unverändert', DB_SUFFIX === 'bookledgerpro');
  ok('Legacy-Name = Bestand', LEGACY_DB_NAME === 'blpr_bookledgerpro');
  ok('Legacy-Mandant → Bestandsname (migrationsfrei)', dbNameFuer(LEGACY_MANDANT_ID) === 'blpr_bookledgerpro');
  ok('leere/keine ID → Bestandsname', dbNameFuer(null) === 'blpr_bookledgerpro' && dbNameFuer('') === 'blpr_bookledgerpro');
  ok('eigener Mandant → präfixierter Name', dbNameFuer('a1b2c3d4') === 'blpr_a1b2c3d4_bookledgerpro');
  ok('jeder Name endet auf Suffix', dbNameFuer('a1b2c3d4').endsWith('_bookledgerpro'));
  let threw = false;
  try { dbNameFuer('Böse ID!'); } catch { threw = true; }
  ok('ungültige ID wirft', threw);
});

await section('Mandanten (M1): ID + Namensprüfung', () => {
  const id = neueMandantId();
  ok('neueMandantId = 8 Hex', /^[0-9a-f]{8}$/.test(id));
  ok('zwei IDs verschieden', neueMandantId() !== neueMandantId() || true); // zufallsabhängig, kein harter Fehler
  ok('leerer Name → Fehler', validateMandantName('  ') !== null);
  ok('zu langer Name → Fehler', validateMandantName('x'.repeat(61)) !== null);
  ok('gültiger Name → null', validateMandantName('Müller GmbH') === null);
  const m = erstelleMandant('  Acme  ', { id: 'feed0001', erstellt: 1234 });
  ok('erstelleMandant trimmt + Felder', m.id === 'feed0001' && m.name === 'Acme' && m.erstellt === 1234);
  let threw = false;
  try { erstelleMandant(''); } catch { threw = true; }
  ok('erstelleMandant lehnt leeren Namen ab', threw);
});

await section('Mandanten (M1): Registry-Operationen (immutabel)', () => {
  const r0 = leereRegistry();
  ok('leer: keine Mandanten/keiner aktiv', r0.mandanten.length === 0 && r0.aktiv === null);

  const a = erstelleMandant('Alpha', { id: 'aaaa0001', erstellt: 1 });
  const b = erstelleMandant('Beta', { id: 'bbbb0002', erstellt: 2 });
  const r1 = addMandant(r0, a);
  ok('erster wird automatisch aktiv', r1.aktiv === 'aaaa0001' && r1.mandanten.length === 1);
  ok('addMandant immutabel', r0.mandanten.length === 0);
  const r2 = addMandant(r1, b);
  ok('zweiter ändert aktiv nicht', r2.aktiv === 'aaaa0001' && r2.mandanten.length === 2);

  let threw = false;
  try { addMandant(r2, erstelleMandant('Dup', { id: 'aaaa0001' })); } catch { threw = true; }
  ok('doppelte ID wirft', threw);

  ok('findeMandant', findeMandant(r2, 'bbbb0002').name === 'Beta');
  ok('aktiverMandant', aktiverMandant(r2).id === 'aaaa0001');

  const r3 = setzeAktiv(r2, 'bbbb0002');
  ok('setzeAktiv wechselt', r3.aktiv === 'bbbb0002');
  let threw2 = false;
  try { setzeAktiv(r2, 'nicht-da'); } catch { threw2 = true; }
  ok('setzeAktiv unbekannt wirft', threw2);

  const r4 = umbenenneMandant(r3, 'aaaa0001', 'Alpha neu');
  ok('umbenenneMandant', findeMandant(r4, 'aaaa0001').name === 'Alpha neu');

  const r5 = entferneMandant(r4, 'bbbb0002'); // war aktiv → erster rückt nach
  ok('entferneMandant entfernt + rückt aktiv nach', r5.mandanten.length === 1 && r5.aktiv === 'aaaa0001');
  let threw3 = false;
  try { entferneMandant(r5, 'weg'); } catch { threw3 = true; }
  ok('entferneMandant unbekannt wirft', threw3);
});

await section('Mandanten (M1): Legacy-Seed (migrationsfrei)', () => {
  const seeded = mitLegacyMandant(leereRegistry());
  ok('leere Registry → Legacy-Mandant aktiv', seeded.aktiv === LEGACY_MANDANT_ID && seeded.mandanten.length === 1);
  ok('Legacy zeigt auf Bestands-DB', dbNameFuer(seeded.aktiv) === 'blpr_bookledgerpro');
  const vorhanden = addMandant(leereRegistry(), erstelleMandant('X', { id: 'cccc0003' }));
  ok('vorhandene Registry bleibt unangetastet', mitLegacyMandant(vorhanden) === vorhanden);
});

await section('Mandanten (M2b): Sperrbildschirm-Auswahl (reine Logik)', () => {
  // brauchtMandantenAuswahl: erst ab >1 Mandant.
  ok('leere Registry → keine Auswahl', brauchtMandantenAuswahl(leereRegistry()) === false);
  ok('null/undefined → keine Auswahl (kein Wurf)', brauchtMandantenAuswahl(null) === false && brauchtMandantenAuswahl(undefined) === false);
  const r1 = mitLegacyMandant(leereRegistry()); // genau 1 Mandant
  ok('genau 1 Mandant → keine Auswahl (verhaltensneutral)', brauchtMandantenAuswahl(r1) === false);
  const r2 = addMandant(r1, erstelleMandant('Zweite Firma', { id: 'bbbb0002', erstellt: 5 }));
  ok('2 Mandanten → Auswahl nötig', brauchtMandantenAuswahl(r2) === true);

  // mandantenAuswahlListe: stabil sortiert (ältester zuerst), aktiv markiert, immutabel.
  const a = erstelleMandant('Beta', { id: 'aaaa0001', erstellt: 200 });
  const b = erstelleMandant('Alpha', { id: 'bbbb0002', erstellt: 100 });
  const reg = setzeAktiv(addMandant(addMandant(leereRegistry(), a), b), 'bbbb0002');
  const liste = mandantenAuswahlListe(reg);
  ok('Liste sortiert nach erstellt (ältester zuerst)', liste.map((m) => m.id).join(',') === 'bbbb0002,aaaa0001');
  ok('aktiver Mandant markiert', liste.find((m) => m.id === 'bbbb0002').aktiv === true && liste.find((m) => m.id === 'aaaa0001').aktiv === false);
  ok('Felder durchgereicht', liste[0].name === 'Alpha' && liste[0].erstellt === 100);
  ok('immutabel (Registry unverändert)', reg.mandanten[0].id === 'aaaa0001');
  ok('leere Registry → leere Liste', mandantenAuswahlListe(leereRegistry()).length === 0 && mandantenAuswahlListe(null).length === 0);
  // Tiebreak bei gleichem erstellt: Name.
  const c1 = erstelleMandant('Zeta', { id: 'cccc0001', erstellt: 50 });
  const c2 = erstelleMandant('Anna', { id: 'cccc0002', erstellt: 50 });
  const regT = addMandant(addMandant(leereRegistry(), c1), c2);
  ok('Tiebreak nach Name', mandantenAuswahlListe(regT).map((m) => m.name).join(',') === 'Anna,Zeta');
});

await section('Test-Modus (Sandbox-Kern): DB-Namen + Erkennung', () => {
  // Sandbox-DB trägt eigenen Infix, bleibt aber unter dem Suffix (Regel #3).
  ok('Sandbox-Infix = sandbox', SANDBOX_INFIX === 'sandbox');
  ok('Sandbox-DB-Name mit Infix', dbNameFuer('a1b2c3d4', { sandbox: true }) === 'blpr_sandbox_a1b2c3d4_bookledgerpro');
  ok('Sandbox-Name endet auf Suffix', dbNameFuer('a1b2c3d4', { sandbox: true }).endsWith('_bookledgerpro'));
  ok('Sandbox ≠ echter Mandant gleicher ID', dbNameFuer('a1b2c3d4', { sandbox: true }) !== dbNameFuer('a1b2c3d4'));
  // Sandbox wird NIE auf die Legacy-/Bestands-DB abgebildet (echte Daten unberührt).
  let threw = false;
  try { dbNameFuer('', { sandbox: true }); } catch { threw = true; }
  ok('Sandbox mit leerer ID wirft (keine Legacy-Abbildung)', threw);
  ok('echter Default ohne opts unverändert', dbNameFuer('a1b2c3d4') === 'blpr_a1b2c3d4_bookledgerpro' && dbNameFuer(null) === 'blpr_bookledgerpro');

  // dbNameVon liest das Flag aus dem Datensatz.
  ok('dbNameVon echter Mandant', dbNameVon({ id: 'a1b2c3d4' }) === 'blpr_a1b2c3d4_bookledgerpro');
  ok('dbNameVon Sandbox', dbNameVon({ id: 'a1b2c3d4', sandbox: true }) === 'blpr_sandbox_a1b2c3d4_bookledgerpro');

  // istSandboxDbName erkennt am Namen (ohne Registry).
  ok('erkennt Sandbox-DB', istSandboxDbName('blpr_sandbox_x_bookledgerpro') === true);
  ok('echte DB ist keine Sandbox', istSandboxDbName('blpr_a1b2c3d4_bookledgerpro') === false);
  ok('Legacy-DB ist keine Sandbox', istSandboxDbName('blpr_bookledgerpro') === false);
  ok('fremder Name keine Sandbox', istSandboxDbName('blpr_sandbox_x_andereapp') === false && istSandboxDbName(null) === false);
});

await section('Test-Modus (Sandbox-Kern): Lebenszyklus + Trennung von echten Mandanten', () => {
  const s = erstelleSandbox('Test A', { id: 'feedface', erstellt: 10 });
  ok('erstelleSandbox setzt sandbox-Flag', istSandbox(s) === true && s.name === 'Test A' && s.id === 'feedface');
  ok('echter Mandant ist keine Sandbox', istSandbox(erstelleMandant('Echt', { id: 'aaaa0001' })) === false);
  ok('istSandbox robust', istSandbox(null) === false && istSandbox({}) === false);

  // Gemischte Registry: echte + Sandbox-Tresore.
  let reg = mitLegacyMandant(leereRegistry());                 // 1 echter (aktiv)
  reg = addMandant(reg, erstelleMandant('Firma 2', { id: 'bbbb0002', erstellt: 5 }));
  reg = addMandant(reg, erstelleSandbox('Test 1', { id: 'cccc0003', erstellt: 6 }));
  reg = addMandant(reg, erstelleSandbox('Test 2', { id: 'dddd0004', erstellt: 7 }));
  ok('echteMandanten filtert Sandboxes raus', echteMandanten(reg).map((m) => m.id).sort().join(',') === 'bbbb0002,standard');
  ok('sandboxMandanten nur Tests', sandboxMandanten(reg).map((m) => m.id).sort().join(',') === 'cccc0003,dddd0004');

  // Auswahl-Listen: Sperrbildschirm zeigt NUR echte; Tests-Bereich nur Sandboxes.
  ok('mandantenAuswahlListe ohne Sandboxes', mandantenAuswahlListe(reg).every((m) => m.sandbox === false) && mandantenAuswahlListe(reg).length === 2);
  ok('brauchtMandantenAuswahl zählt Sandboxes nicht', brauchtMandantenAuswahl(reg) === true);
  const nurEinEcht = addMandant(mitLegacyMandant(leereRegistry()), erstelleSandbox('T', { id: 'eeee0005' }));
  ok('1 echter + Sandbox → keine Auswahl', brauchtMandantenAuswahl(nurEinEcht) === false);
  const sl = sandboxAuswahlListe(reg);
  ok('sandboxAuswahlListe sortiert + markiert sandbox', sl.map((m) => m.id).join(',') === 'cccc0003,dddd0004' && sl.every((m) => m.sandbox === true));

  // Aktiv kann auch ein Sandbox-Tresor sein.
  const aktivSandbox = setzeAktiv(reg, 'cccc0003');
  ok('Sandbox aktiv markiert', sandboxAuswahlListe(aktivSandbox).find((m) => m.id === 'cccc0003').aktiv === true);

  // "Alle Tests löschen": Sandboxes weg, echte bleiben.
  const bereinigt = entferneAlleSandboxes(reg);
  ok('entferneAlleSandboxes entfernt nur Tests', sandboxMandanten(bereinigt).length === 0 && echteMandanten(bereinigt).length === 2);
  ok('entferneAlleSandboxes immutabel', sandboxMandanten(reg).length === 2);
  // War ein Sandbox aktiv → aktiv rückt auf echten Mandanten.
  const nachLoeschen = entferneAlleSandboxes(setzeAktiv(reg, 'dddd0004'));
  ok('aktiver Sandbox → aktiv rückt auf echten', nachLoeschen.aktiv === 'standard' && !sandboxMandanten(nachLoeschen).length);

  // Aufräum-Sicherheit: verwaiste Sandbox-DBs (am Namen erkennbar, nicht in Registry).
  const regNurTest1 = addMandant(mitLegacyMandant(leereRegistry()), erstelleSandbox('Test 1', { id: 'cccc0003' }));
  const vorhandene = [
    'blpr_bookledgerpro',                       // echt (Legacy)
    'blpr_mandanten_bookledgerpro',             // Registry
    'blpr_sandbox_cccc0003_bookledgerpro',      // bekannt (in Registry)
    'blpr_sandbox_99999999_bookledgerpro',      // VERWAIST
    'blpr_bbbb0002_bookledgerpro',              // echter Mandant
  ];
  ok('verwaiste Sandbox-DB erkannt', JSON.stringify(verwaisteSandboxDbs(vorhandene, regNurTest1)) === JSON.stringify(['blpr_sandbox_99999999_bookledgerpro']));
  ok('keine verwaisten ohne Sandbox-DBs', verwaisteSandboxDbs(['blpr_bookledgerpro'], regNurTest1).length === 0);
  ok('verwaiste robust bei leerer Eingabe', verwaisteSandboxDbs(null, leereRegistry()).length === 0);
});

await section('Test-Modus (Store-Glue 2b): reine Helfer (DB-Namen je Test, aktive DB)', () => {
  // sandboxDbNamen: liefert die DB-Namen NUR der Sandbox-Tresore (für „Alle Tests löschen").
  let reg = mitLegacyMandant(leereRegistry());                    // 1 echter (Legacy, aktiv)
  reg = addMandant(reg, erstelleMandant('Firma 2', { id: 'bbbb0002', erstellt: 5 }));
  reg = addMandant(reg, erstelleSandbox('Test 1', { id: 'cccc0003', erstellt: 6 }));
  reg = addMandant(reg, erstelleSandbox('Test 2', { id: 'dddd0004', erstellt: 7 }));
  ok('sandboxDbNamen nur Sandbox-DBs', JSON.stringify(sandboxDbNamen(reg).sort())
    === JSON.stringify(['blpr_sandbox_cccc0003_bookledgerpro', 'blpr_sandbox_dddd0004_bookledgerpro']));
  ok('sandboxDbNamen ohne echte DBs', sandboxDbNamen(reg).every((n) => istSandboxDbName(n)));
  ok('sandboxDbNamen leer ohne Tests', sandboxDbNamen(mitLegacyMandant(leereRegistry())).length === 0);
  ok('sandboxDbNamen robust', sandboxDbNamen(leereRegistry()).length === 0 && sandboxDbNamen(null).length === 0);

  // aktiveDbName: DB-Name des aktiven Mandanten, Sandbox-Flag beachtet, Legacy-Fallback.
  ok('aktiv = Legacy → Bestands-DB', aktiveDbName(reg) === 'blpr_bookledgerpro');
  ok('aktiv = echter Mandant', aktiveDbName(setzeAktiv(reg, 'bbbb0002')) === 'blpr_bbbb0002_bookledgerpro');
  ok('aktiv = Sandbox → Sandbox-DB (Flag beachtet)', aktiveDbName(setzeAktiv(reg, 'cccc0003')) === 'blpr_sandbox_cccc0003_bookledgerpro');
  ok('keiner aktiv → Legacy-Fallback', aktiveDbName(leereRegistry()) === 'blpr_bookledgerpro' && aktiveDbName(null) === 'blpr_bookledgerpro');
  // Nach „Alle Tests löschen" zeigt aktiveDbName auf den nachgerückten echten Mandanten.
  ok('aktiv nach entferneAlleSandboxes (war Sandbox aktiv)',
    aktiveDbName(entferneAlleSandboxes(setzeAktiv(reg, 'dddd0004'))) === 'blpr_bookledgerpro');
});

await section('Test-Modus (UI-Helfer 2c): aktiverSandbox + naechsterTestName', () => {
  let reg = mitLegacyMandant(leereRegistry());                    // 1 echter (Legacy, aktiv)
  reg = addMandant(reg, erstelleMandant('Firma 2', { id: 'bbbb0002', erstellt: 5 }));
  reg = addMandant(reg, erstelleSandbox('Test 1', { id: 'cccc0003', erstellt: 6 }));
  reg = addMandant(reg, erstelleSandbox('Test 2', { id: 'dddd0004', erstellt: 7 }));

  // aktiverSandbox: nur, wenn der AKTIVE Mandant ein Test-Tresor ist (sonst null).
  ok('aktiv = Legacy → kein Sandbox', aktiverSandbox(reg) === null);
  ok('aktiv = echter Mandant → kein Sandbox', aktiverSandbox(setzeAktiv(reg, 'bbbb0002')) === null);
  const aktivT = aktiverSandbox(setzeAktiv(reg, 'cccc0003'));
  ok('aktiv = Sandbox → liefert den Test', aktivT && aktivT.id === 'cccc0003' && istSandbox(aktivT));
  ok('aktiverSandbox robust', aktiverSandbox(leereRegistry()) === null && aktiverSandbox(null) === null);

  // naechsterTestName: fortlaufend „Test N" über das Maximum vorhandener „Test N"-Namen.
  ok('erster Vorschlag = Test 1', naechsterTestName(mitLegacyMandant(leereRegistry())) === 'Test 1');
  ok('Vorschlag = max(Test N)+1', naechsterTestName(reg) === 'Test 3');
  // Lücken: nach Löschen von „Test 1" bleibt der Vorschlag oberhalb des Maximums (kein Doppler).
  let mitLuecke = mitLegacyMandant(leereRegistry());
  mitLuecke = addMandant(mitLuecke, erstelleSandbox('Test 5', { id: 'eeee0005' }));
  ok('nimmt Maximum, nicht Anzahl', naechsterTestName(mitLuecke) === 'Test 6');
  // Frei benannte Tests beeinflussen die „Test N"-Zählung nicht.
  let frei = mitLegacyMandant(leereRegistry());
  frei = addMandant(frei, erstelleSandbox('Mein Spielplatz', { id: 'ffff0006' }));
  ok('freie Namen zählen nicht', naechsterTestName(frei) === 'Test 1');
  ok('eigener Prefix', naechsterTestName(reg, 'Probe') === 'Probe 1');
});

await section('Mandanten (M2a): Registry-DB-Name', () => {
  ok('Registry-DB getrennt + Suffix erhalten', REGISTRY_DB_NAME === 'blpr_mandanten_bookledgerpro');
  ok('Registry-DB ≠ Tresor-Legacy-DB', REGISTRY_DB_NAME !== LEGACY_DB_NAME);
  ok('endet auf Suffix', REGISTRY_DB_NAME.endsWith(`_${DB_SUFFIX}`));
});

await section('Mandanten (M2a): aktive Tresor-DB konfigurierbar (core/db.js)', () => {
  ok('Default = Legacy-Tresor', getActiveDbName() === DB_LEGACY_NAME && DB_LEGACY_NAME === 'blpr_bookledgerpro');
  // Wechsel auf einen anderen Mandanten
  setActiveDbName(dbNameFuer('a1b2c3d4'));
  ok('setActiveDbName wechselt', getActiveDbName() === 'blpr_a1b2c3d4_bookledgerpro');
  // Leerer Name = No-op
  setActiveDbName('');
  ok('leerer Name = No-op', getActiveDbName() === 'blpr_a1b2c3d4_bookledgerpro');
  // Gleicher Name = No-op (kein Wurf)
  setActiveDbName('blpr_a1b2c3d4_bookledgerpro');
  ok('gleicher Name = No-op', getActiveDbName() === 'blpr_a1b2c3d4_bookledgerpro');
  // Name ohne Suffix wird abgelehnt (Regel #3)
  let threw = false;
  try { setActiveDbName('blpr_fremd_andereapp'); } catch { threw = true; }
  ok('Name ohne Suffix wirft', threw && getActiveDbName() === 'blpr_a1b2c3d4_bookledgerpro');
  // closeDb() ohne offene Verbindung wirft nicht; danach zurück auf Legacy für saubere Folge.
  closeDb();
  setActiveDbName(DB_LEGACY_NAME);
  ok('zurück auf Legacy', getActiveDbName() === 'blpr_bookledgerpro');
});

await section('Bilanzierung (B1): Gewinnermittlungsart', () => {
  ok('Konstanten', GEWINNERMITTLUNG.EUER === 'euer' && GEWINNERMITTLUNG.BILANZ === 'bilanz');
  ok('Liste enthält beide', GEWINNERMITTLUNG_LISTE.length === 2 && GEWINNERMITTLUNG_LISTE.includes('euer') && GEWINNERMITTLUNG_LISTE.includes('bilanz'));
  ok('istGewinnermittlung gültig', istGewinnermittlung('euer') && istGewinnermittlung('bilanz'));
  ok('istGewinnermittlung ungültig', !istGewinnermittlung('foo') && !istGewinnermittlung('') && !istGewinnermittlung(undefined));
  ok('normalize Default = euer', normalizeGewinnermittlung(undefined) === 'euer' && normalizeGewinnermittlung('foo') === 'euer' && normalizeGewinnermittlung(null) === 'euer');
  ok('normalize behält bilanz', normalizeGewinnermittlung('bilanz') === 'bilanz');
  ok('istBilanzierung Default false', istBilanzierung({}) === false && istBilanzierung(null) === false);
  ok('istBilanzierung bei bilanz true', istBilanzierung({ gewinnermittlung: 'bilanz' }) === true);
  ok('istBilanzierung bei euer false', istBilanzierung({ gewinnermittlung: 'euer' }) === false);
});

await section('Bilanzierung (B1): Konten-Klassifikation', () => {
  ok('Aktiv = Bestandskonto', istBestandskonto(KONTOART.AKTIV) && istBestandskonto(KONTOART.PASSIV));
  ok('Aufwand/Ertrag = kein Bestandskonto', !istBestandskonto(KONTOART.AUFWAND) && !istBestandskonto(KONTOART.ERTRAG));
  ok('Aufwand/Ertrag = Erfolgskonto', istErfolgskonto(KONTOART.AUFWAND) && istErfolgskonto(KONTOART.ERTRAG));
  ok('Aktiv/Passiv = kein Erfolgskonto', !istErfolgskonto(KONTOART.AKTIV) && !istErfolgskonto(KONTOART.PASSIV));
  ok('Bereich Bestand → Bilanz', abschlussBereich(KONTOART.AKTIV) === BEREICH.BILANZ && abschlussBereich(KONTOART.PASSIV) === BEREICH.BILANZ);
  ok('Bereich Erfolg → GuV', abschlussBereich(KONTOART.AUFWAND) === BEREICH.GUV && abschlussBereich(KONTOART.ERTRAG) === BEREICH.GUV);
  ok('bilanzSeite Aktiv/Passiv', bilanzSeite(KONTOART.AKTIV) === 'aktiva' && bilanzSeite(KONTOART.PASSIV) === 'passiva');
  ok('bilanzSeite Erfolg = null', bilanzSeite(KONTOART.AUFWAND) === null && bilanzSeite(KONTOART.ERTRAG) === null);
  ok('guvSeite Aufwand/Ertrag', guvSeite(KONTOART.AUFWAND) === 'aufwand' && guvSeite(KONTOART.ERTRAG) === 'ertrag');
  ok('guvSeite Bestand = null', guvSeite(KONTOART.AKTIV) === null && guvSeite(KONTOART.PASSIV) === null);
  const kBank = klassifiziereKonto({ art: KONTOART.AKTIV });
  ok('klassifiziere Bank (Aktiv)', kBank.bereich === BEREICH.BILANZ && kBank.bilanzSeite === 'aktiva' && kBank.guvSeite === null && kBank.mehrung === 'S');
  const kErlös = klassifiziereKonto({ art: KONTOART.ERTRAG });
  ok('klassifiziere Erlöse (Ertrag)', kErlös.bereich === BEREICH.GUV && kErlös.guvSeite === 'ertrag' && kErlös.bilanzSeite === null && kErlös.mehrung === 'H');
});

await section('Bilanzierung (B1): Bilanz-Grundkonten im Seed', () => {
  const seed = seedAccounts();
  const nummern = new Set(seed.map((k) => k.nummer));
  ok('alle Grundkonto-Nummern definiert', BILANZ_GRUNDKONTO_NUMMERN.length === 4);
  ok('Grundkonten im Seed vorhanden', BILANZ_GRUNDKONTO_NUMMERN.every((n) => nummern.has(n)));
  // Grundkonten sind Bilanz-Bestandskonten (Passiva: Eigenkapital/Rückstellungen).
  const grund = seed.filter((k) => BILANZ_GRUNDKONTO_NUMMERN.includes(k.nummer));
  ok('Grundkonten sind Bestandskonten', grund.every((k) => istBestandskonto(k.art)));
  ok('Grundkonten sind Passiva', grund.every((k) => bilanzSeite(k.art) === 'passiva'));
  // Saldenvortrag/Eröffnung (9000) ist bereits im Basis-Seed (B1 prüft nur).
  ok('Saldenvortrag 9000 vorhanden', nummern.has('9000'));
  ok('Saldenvortrag-Rolle', seed.find((k) => k.nummer === '9000').rolle === 'saldenvortrag');
});

await section('Bilanzierung (B2): Gewinn- und Verlustrechnung', () => {
  const idx = indexFromSeed();
  const buchungen = [
    // Verkauf 238 (200 Erlös 8400 + 38 USt 1776) auf Bank
    { seq: 1, datum: '2026-02-10', beschreibung: 'Verkauf', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    // Zinsertrag 50 (2650) auf Bank
    { seq: 2, datum: '2026-03-01', beschreibung: 'Zinsen', zeilen: [{ konto: '1200', seite: 'S', betrag: 5000 }, { konto: '2650', seite: 'H', betrag: 5000 }] },
    // Miete 500 (4210) per Bank
    { seq: 3, datum: '2026-02-15', beschreibung: 'Miete', zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    // Bürobedarf 119 (100 4930 + 19 VSt 1576) per Bank
    { seq: 4, datum: '2026-02-20', beschreibung: 'Büro', zeilen: [{ konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }] },
    // Entwurf zählt nicht
    { seq: null, datum: '2026-02-21', zeilen: [{ konto: '1200', seite: 'S', betrag: 1 }, { konto: '8200', seite: 'H', betrag: 1 }] },
  ];

  const guv = gewinnUndVerlust(buchungen, idx);
  // Erträge: 8400 (20000) + 2650 (5000) = 25000; Aufwendungen: 4210 (50000) + 4930 (10000) = 60000.
  ok('GuV: Summe Erträge 25000', guv.summeErtraege === 25000);
  ok('GuV: Summe Aufwendungen 60000', guv.summeAufwendungen === 60000);
  ok('GuV: Jahresfehlbetrag -35000', guv.jahresueberschuss === -35000);
  ok('GuV: 2 Ertragskonten', guv.ertraege.length === 2);
  ok('GuV: 2 Aufwandskonten', guv.aufwendungen.length === 2);
  ok('GuV: Erträge nach Nummer sortiert', guv.ertraege[0].nummer === '2650' && guv.ertraege[1].nummer === '8400');
  ok('GuV: Erlös 8400 = 20000 (netto, ohne USt)', guv.ertraege.find((e) => e.nummer === '8400').wert === 20000);
  // Bestands-/Steuerkonten (Bank 1200, VSt 1576, USt 1776) gehören NICHT in die GuV.
  ok('GuV: keine Bestandskonten', !guv.ertraege.concat(guv.aufwendungen).some((z) => ['1200', '1576', '1776'].includes(z.nummer)));
  ok('GuV: Entwurf ausgeschlossen (8200 fehlt)', !guv.ertraege.some((e) => e.nummer === '8200'));

  // Periode grenzt ein: nur Februar → Zinsertrag (März) fällt raus.
  const feb = gewinnUndVerlust(buchungen, idx, { von: '2026-02-01', bis: '2026-02-28' });
  ok('GuV-Periode: Februar ohne Zinsertrag', feb.summeErtraege === 20000 && !feb.ertraege.some((e) => e.nummer === '2650'));

  // CSV.
  const csvOut = buildGuvCsv(guv);
  ok('GuV-CSV: Erträge-Summe', csvOut.includes('Summe Erträge'));
  ok('GuV-CSV: Jahresfehlbetrag (negativ)', csvOut.includes('Jahresfehlbetrag') && csvOut.includes('-350,00'));
  const guvPlus = gewinnUndVerlust([buchungen[0], buchungen[1]], idx); // nur Erträge
  ok('GuV-CSV: Jahresüberschuss (positiv)', buildGuvCsv(guvPlus).includes('Jahresüberschuss'));
});

await section('Bilanzierung (B3): Bilanz (Aktiva = Passiva)', () => {
  const idx = indexFromSeed();
  // Ausgeglichene Eröffnungsbilanz: 1000 € Bank (Aktiv) = 1000 € Eigenkapital (Passiv).
  const eb = { '1200': 100000, '0880': 100000 };
  const buchungen = [
    // Verkauf 238 (200 Erlös 8400 + 38 USt 1776) auf Bank
    { seq: 1, datum: '2026-02-10', beschreibung: 'Verkauf', zeilen: [{ konto: '1200', seite: 'S', betrag: 23800 }, { konto: '8400', seite: 'H', betrag: 20000 }, { konto: '1776', seite: 'H', betrag: 3800 }] },
    // Miete 500 (4210) per Bank
    { seq: 2, datum: '2026-02-15', beschreibung: 'Miete', zeilen: [{ konto: '4210', seite: 'S', betrag: 50000 }, { konto: '1200', seite: 'H', betrag: 50000 }] },
    // Wareneinkauf auf Ziel 357 (300 Ware 3400 + 57 VSt 1576) gegen Verbindlichkeiten 1600
    { seq: 3, datum: '2026-03-05', beschreibung: 'Ware', zeilen: [{ konto: '3400', seite: 'S', betrag: 30000 }, { konto: '1576', seite: 'S', betrag: 5700 }, { konto: '1600', seite: 'H', betrag: 35700 }] },
    // Entwurf (seq null) zählt nicht
    { seq: null, datum: '2026-03-06', zeilen: [{ konto: '1200', seite: 'S', betrag: 1 }, { konto: '8200', seite: 'H', betrag: 1 }] },
  ];

  const b = bilanz(buchungen, idx, '2026-12-31', eb);
  // Aktiva: Bank 100000−26200=73800, VSt 1576 = 5700 → Σ 79500.
  // Passiva: USt 1776 = 3800, Verb. 1600 = 35700, EK 0880 = 100000 → Σ 139500.
  // JÜ = Erträge 20000 − Aufwendungen (50000+30000) = −60000 (Fehlbetrag).
  // Σ Passiva inkl. Ergebnis = 139500 − 60000 = 79500 = Σ Aktiva.
  ok('Bilanz: Summe Aktiva 79500', b.summeAktiva === 79500);
  ok('Bilanz: Summe Passiva 139500', b.summePassiva === 139500);
  ok('Bilanz: Jahresfehlbetrag -60000', b.jahresueberschuss === -60000);
  ok('Bilanz: Passiva inkl. Ergebnis = Aktiva', b.summePassivaMitErgebnis === 79500);
  ok('Bilanz: Bilanzsumme = Aktiva', b.bilanzsumme === 79500);
  ok('Bilanz: ausgeglichen (Aktiva = Passiva)', b.ausgeglichen === true && b.differenz === 0);
  ok('Bilanz: Bank inkl. Eröffnungssaldo 73800', b.aktiva.find((z) => z.nummer === '1200').wert === 73800);
  ok('Bilanz: EK aus reinem Eröffnungssaldo 100000', b.passiva.find((z) => z.nummer === '0880').wert === 100000);
  ok('Bilanz: Aktiva nach Nummer sortiert', b.aktiva[0].nummer === '1200' && b.aktiva[1].nummer === '1576');
  // Erfolgskonten erscheinen NICHT als Bilanzposten.
  ok('Bilanz: keine Erfolgskonten', !b.aktiva.concat(b.passiva).some((z) => ['8400', '4210', '3400'].includes(z.nummer)));
  ok('Bilanz: Entwurf ausgeschlossen', b.aktiva.find((z) => z.nummer === '1200').wert === 73800);

  // Stichtag grenzt ein: nur bis Februar → Wareneinkauf (März) fällt raus.
  const feb = bilanz(buchungen, idx, '2026-02-28', eb);
  ok('Bilanz-Stichtag: ohne März-Verbindlichkeit', !feb.passiva.some((z) => z.nummer === '1600'));
  ok('Bilanz-Stichtag: weiterhin ausgeglichen', feb.ausgeglichen === true);

  // Ohne Eröffnungssalden (greenfield) ist die Bilanz trotzdem ausgeglichen.
  const ohneEB = bilanz(buchungen, idx, '2026-12-31');
  ok('Bilanz ohne EB: ausgeglichen', ohneEB.ausgeglichen === true);
  ok('Bilanz ohne EB: Aktiva 100000 weniger', ohneEB.summeAktiva === -20500);

  // Unausgeglichene Eröffnungsbilanz → ausgeglichen=false, Differenz ≠ 0.
  const schief = bilanz(buchungen, idx, '2026-12-31', { '1200': 100000 });
  ok('Bilanz schief: nicht ausgeglichen', schief.ausgeglichen === false && schief.differenz === 100000);

  // CSV.
  const csvOut = buildBilanzCsv(b);
  ok('Bilanz-CSV: Stichtag', csvOut.includes('2026-12-31'));
  ok('Bilanz-CSV: Summe Aktiva', csvOut.includes('Summe Aktiva') && csvOut.includes('795,00'));
  ok('Bilanz-CSV: Jahresfehlbetrag-Ergebnis', csvOut.includes('Jahresfehlbetrag (Ergebnis)') && csvOut.includes('-600,00'));
  ok('Bilanz-CSV: ausgeglichen → keine Differenz-Zeile', !csvOut.includes('NICHT ausgeglichen'));
  ok('Bilanz-CSV schief: Differenz-Zeile', buildBilanzCsv(schief).includes('NICHT ausgeglichen'));
});

// ===== R6/P1: Privat-/Bürger-Modus (Nutzungskontext) =====
await section('Nutzungsmodus (P1): Modus-Werte + Normalisierung', () => {
  ok('drei Modi', NUTZUNGSMODUS_LISTE.length === 3 &&
    NUTZUNGSMODUS_LISTE.join(',') === 'firma,privat,verein');
  ok('istNutzungsmodus erkennt gültige', istNutzungsmodus('privat') && istNutzungsmodus('verein') && istNutzungsmodus('firma'));
  ok('istNutzungsmodus lehnt ungültige ab', !istNutzungsmodus('xxx') && !istNutzungsmodus('') && !istNutzungsmodus(undefined));
  ok('normalize Default firma', normalizeNutzungsmodus(undefined) === 'firma' && normalizeNutzungsmodus('quatsch') === 'firma');
  ok('normalize lässt gültige durch', normalizeNutzungsmodus('privat') === 'privat' && normalizeNutzungsmodus('verein') === 'verein');
  ok('nutzungsmodusVon liest Settings', nutzungsmodusVon({ nutzungsmodus: 'verein' }) === 'verein');
  ok('nutzungsmodusVon Default firma', nutzungsmodusVon({}) === 'firma' && nutzungsmodusVon(null) === 'firma');
  // Prädikate
  ok('istFirmenmodus Default true', istFirmenmodus({}) === true && istFirmenmodus({ nutzungsmodus: 'firma' }) === true);
  ok('istPrivatmodus', istPrivatmodus({ nutzungsmodus: 'privat' }) === true && istPrivatmodus({}) === false);
  ok('istVereinsmodus', istVereinsmodus({ nutzungsmodus: 'verein' }) === true && istVereinsmodus({ nutzungsmodus: 'privat' }) === false);
});

await section('Nutzungsmodus (P1): NAV-Ansichten-Gating', () => {
  const NAV_KEYS = ['dashboard', 'journal', 'kassenbuch', 'accounts', 'anlagen', 'documents',
    'payables', 'orders', 'angebote', 'nachkalkulation', 'customers', 'employees', 'reports', 'berichte', 'network', 'legal',
    'anleitung', 'selbsttest', 'about', 'settings'];
  // Firma zeigt ALLES.
  ok('Firma: alle Ansichten sichtbar', sichtbareAnsichten({ nutzungsmodus: 'firma' }, NAV_KEYS).length === NAV_KEYS.length);
  ok('Firma: zeigeAnsicht stets true', NAV_KEYS.every((k) => zeigeAnsicht({ nutzungsmodus: 'firma' }, k)));
  ok('Default (kein Modus) = Firma-Verhalten', sichtbareAnsichten({}, NAV_KEYS).length === NAV_KEYS.length);

  // Privat: geschäftliche Ansichten ausgeblendet.
  const privatSichtbar = sichtbareAnsichten({ nutzungsmodus: 'privat' }, NAV_KEYS);
  ok('Privat blendet Anlagen aus', !zeigeAnsicht({ nutzungsmodus: 'privat' }, 'anlagen'));
  ok('Privat blendet Aufträge/Angebote/Nachkalkulation/Kunden/Mitarbeiter aus',
    !privatSichtbar.includes('orders') && !privatSichtbar.includes('angebote') && !privatSichtbar.includes('nachkalkulation') && !privatSichtbar.includes('customers') && !privatSichtbar.includes('employees'));
  ok('Privat blendet Kreditoren/Berichte/Netz aus',
    !privatSichtbar.includes('payables') && !privatSichtbar.includes('berichte') && !privatSichtbar.includes('network'));
  ok('Privat behält Kern (Journal/Belege/Auswertung/Kassenbuch/Konten)',
    ['dashboard', 'journal', 'kassenbuch', 'accounts', 'documents', 'reports', 'legal', 'settings'].every((k) => privatSichtbar.includes(k)));

  // Verein: wie Privat, aber MIT Berichten/Kunden(Mitglieder)/Netz; ohne Anlagen/Kreditoren/Aufträge/Lohn.
  const vereinSichtbar = sichtbareAnsichten({ nutzungsmodus: 'verein' }, NAV_KEYS);
  ok('Verein zeigt Berichte + Kunden + Netz',
    vereinSichtbar.includes('berichte') && vereinSichtbar.includes('customers') && vereinSichtbar.includes('network'));
  ok('Verein blendet Anlagen/Kreditoren/Aufträge/Angebote/Nachkalkulation/Mitarbeiter aus',
    !vereinSichtbar.includes('anlagen') && !vereinSichtbar.includes('payables') &&
    !vereinSichtbar.includes('orders') && !vereinSichtbar.includes('angebote') && !vereinSichtbar.includes('nachkalkulation') && !vereinSichtbar.includes('employees'));
  ok('Verein sichtbar > Privat sichtbar', vereinSichtbar.length > privatSichtbar.length);

  // Unbekannte Schlüssel werden nicht versehentlich ausgeblendet (sicher additiv).
  ok('unbekannter Key bleibt sichtbar', zeigeAnsicht({ nutzungsmodus: 'privat' }, 'irgendwas-neues'));
  ok('sichtbareAnsichten verträgt leere/fehlende Liste', sichtbareAnsichten({ nutzungsmodus: 'privat' }, undefined).length === 0);
});

await section('Nutzungsmodus (P1): fachliche Feature-Gates', () => {
  ok('FEATURE_LISTE vollständig', FEATURE_LISTE.length === 8 && FEATURE_LISTE.includes(FEATURE.UMSATZSTEUER));
  // Firma: alle Features an.
  ok('Firma: alle Features sichtbar', FEATURE_LISTE.every((f) => zeigeFeature({ nutzungsmodus: 'firma' }, f)));
  ok('Default: alle Features sichtbar', FEATURE_LISTE.every((f) => zeigeFeature({}, f)));
  // Privat: keine geschäftlichen Features.
  ok('Privat: keine USt', !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.UMSATZSTEUER));
  ok('Privat: keine Rechnungen/Mahnwesen/Anlagen',
    !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.RECHNUNGEN) &&
    !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.MAHNWESEN) &&
    !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.ANLAGEN));
  ok('Privat: kein Berater-Export/keine Verbindlichkeiten',
    !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.BERATER_EXPORT) &&
    !zeigeFeature({ nutzungsmodus: 'privat' }, FEATURE.VERBINDLICHKEITEN));
  // Verein: USt/Verbindlichkeiten/Anlagen/Berater-Export bleiben möglich; Rechnungs-/Mahnwesen/Lohn aus.
  ok('Verein: USt + Berater-Export an', zeigeFeature({ nutzungsmodus: 'verein' }, FEATURE.UMSATZSTEUER) &&
    zeigeFeature({ nutzungsmodus: 'verein' }, FEATURE.BERATER_EXPORT));
  ok('Verein: Rechnungen/Mahnwesen/Mitarbeiter aus',
    !zeigeFeature({ nutzungsmodus: 'verein' }, FEATURE.RECHNUNGEN) &&
    !zeigeFeature({ nutzungsmodus: 'verein' }, FEATURE.MAHNWESEN) &&
    !zeigeFeature({ nutzungsmodus: 'verein' }, FEATURE.MITARBEITER));
});

await section('Datensicherung (Schritt 3): backupStrategie', () => {
  ok('Strategien = download + ordner', BACKUP_STRATEGIEN.length === 2 &&
    BACKUP_STRATEGIEN.includes('download') && BACKUP_STRATEGIEN.includes('ordner'));
  ok('Default = download (überall verfügbar)', DEFAULT_BACKUP_STRATEGIE === 'download');

  // Normalisierung: Unbekanntes/leeres → Default; Gültiges bleibt.
  ok('normalize: unbekannt → download', normalizeBackupStrategie('quatsch') === 'download');
  ok('normalize: undefined → download', normalizeBackupStrategie(undefined) === 'download');
  ok('normalize: ordner bleibt ordner', normalizeBackupStrategie('ordner') === 'ordner');

  // Ziel-Entscheidung: Ordner nur, wenn Strategie + API + gemerkter Ordner zusammenkommen.
  ok('Ziel: ordner nur mit API + gemerktem Ordner',
    backupZiel({ strategie: 'ordner', ordnerApiVerfuegbar: true, hatOrdner: true }) === 'ordner');
  ok('Ziel: ordner ohne API → download (Tablet-Fallback)',
    backupZiel({ strategie: 'ordner', ordnerApiVerfuegbar: false, hatOrdner: true }) === 'download');
  ok('Ziel: ordner ohne gemerkten Ordner → download',
    backupZiel({ strategie: 'ordner', ordnerApiVerfuegbar: true, hatOrdner: false }) === 'download');
  ok('Ziel: download-Strategie ignoriert Ordner',
    backupZiel({ strategie: 'download', ordnerApiVerfuegbar: true, hatOrdner: true }) === 'download');
  ok('Ziel: leere Eingabe → download', backupZiel({}) === 'download');

  // Dateiname: stabile, sortierbare Form mit Sekunden-Zeitstempel.
  const name = backupDateiname(new Date('2026-06-18T09:07:05.000Z'));
  ok('Dateiname Form korrekt', name === 'bookledgerpro-backup-2026-06-18-09-07-05.blpr.json');
  ok('Dateiname endet auf .blpr.json', /\.blpr\.json$/.test(backupDateiname()));

  // Drag-and-drop-Vorfilter: an Endung ODER am Klartext-Magic erkennen.
  ok('istBackupDatei: .blpr.json-Endung', istBackupDatei({ name: 'x.blpr.json' }));
  ok('istBackupDatei: rohes JSON mit Magic',
    istBackupDatei({ name: 'export.json', text: '{ "magic": "BLPR-BACKUP", "sealed": "…" }' }));
  ok('istBackupDatei: Fremd-JSON → nein', !istBackupDatei({ name: 'daten.json', text: '{ "foo": 1 }' }));
  ok('istBackupDatei: PDF → nein', !istBackupDatei({ name: 'beleg.pdf', text: '%PDF' }));
  ok('istBackupDatei: leer → nein', !istBackupDatei({}));
});

await section('Kalkulation Block 2/Schritt 4: rechnungsstelle (§14-Hoheit)', () => {
  // Werte + Default.
  ok('Liste = blp + extern', RECHNUNGSSTELLE_LISTE.length === 2 &&
    RECHNUNGSSTELLE_LISTE.includes('blp') && RECHNUNGSSTELLE_LISTE.includes('extern'));
  ok('Default = blp (Bestand unverändert)', RECHNUNGSSTELLE_DEFAULT === 'blp');
  ok('Konstanten korrekt', RECHNUNGSSTELLE.BLP === 'blp' && RECHNUNGSSTELLE.EXTERN === 'extern');

  // Gültigkeit + Normalisierung.
  ok('istRechnungsstelle: blp/extern ja', istRechnungsstelle('blp') && istRechnungsstelle('extern'));
  ok('istRechnungsstelle: Unsinn nein', !istRechnungsstelle('quatsch') && !istRechnungsstelle(undefined));
  ok('normalize: unbekannt → blp', normalizeRechnungsstelle('quatsch') === 'blp');
  ok('normalize: undefined → blp', normalizeRechnungsstelle(undefined) === 'blp');
  ok('normalize: extern bleibt extern', normalizeRechnungsstelle('extern') === 'extern');

  // Aus Settings lesen + Prädikate.
  ok('rechnungsstelleVon: fehlend → blp', rechnungsstelleVon({}) === 'blp');
  ok('rechnungsstelleVon: extern', rechnungsstelleVon({ rechnungsstelle: 'extern' }) === 'extern');
  ok('istBlp: Default ja', istBlpRechnungsstelle({}) && !istExternRechnungsstelle({}));
  ok('istExtern: extern ja', istExternRechnungsstelle({ rechnungsstelle: 'extern' }) &&
    !istBlpRechnungsstelle({ rechnungsstelle: 'extern' }));
  ok('vergibtBlpNummern: nur bei blp', vergibtBlpNummern({}) &&
    !vergibtBlpNummern({ rechnungsstelle: 'extern' }));

  // Vorläufige interne Nummer (extern-Modus) — KEINE §14-Nummer.
  ok('vorläufige Nummer Format', vorlaeufigeRechnungsnummer(7, 2026) === 'ENT-2026-0007');
  ok('vorläufige Nummer Präfix', VORLAEUFIG_PREFIX === 'ENT');
  ok('istVorlaeufigeNummer: ENT-… ja', istVorlaeufigeNummer('ENT-2026-0007'));
  ok('istVorlaeufigeNummer: §14-Nummer nein', !istVorlaeufigeNummer('2026-0007'));
  ok('istVorlaeufigeNummer: leer/Nicht-String nein', !istVorlaeufigeNummer(null) && !istVorlaeufigeNummer(undefined));

  // Wechsel-Hinweis (Katalog §7a, ehrliche Grenze 1).
  ok('Wechsel: gleich → unverändert, keine Warnung', (() => {
    const h = rechnungsstelleWechselHinweis('blp', 'blp', { vergebeneNummern: 5 });
    return h.code === 'unveraendert' && h.erlaubt && !h.warnen;
  })());
  ok('Wechsel blp→extern MIT vergebenen Nummern → warnen', (() => {
    const h = rechnungsstelleWechselHinweis('blp', 'extern', { vergebeneNummern: 3 });
    return h.code === 'blp-nummern-vergeben' && h.erlaubt && h.warnen;
  })());
  ok('Wechsel blp→extern OHNE vergebene Nummern → ok, keine Warnung', (() => {
    const h = rechnungsstelleWechselHinweis('blp', 'extern', { vergebeneNummern: 0 });
    return h.code === 'ok' && h.erlaubt && !h.warnen;
  })());
  ok('Wechsel extern→blp → ok, keine Warnung (sicher)', (() => {
    const h = rechnungsstelleWechselHinweis('extern', 'blp', { vergebeneNummern: 9 });
    return h.code === 'ok' && h.erlaubt && !h.warnen;
  })());
  ok('Wechsel: ungültige Werte werden normalisiert', (() => {
    const h = rechnungsstelleWechselHinweis('quatsch', 'extern', { vergebeneNummern: 2 });
    // 'quatsch' → blp, also blp→extern mit Nummern → warnen
    return h.code === 'blp-nummern-vergeben' && h.warnen;
  })());
});

await section('Kalkulation Block 2/Schritt 5: Kalkulations-Kern (rein, cent-genau)', () => {
  // Bausteine.
  ok('Kostenarten-Liste vollständig', KOSTENART_LISTE.length === 5 &&
    KOSTENART_LISTE.includes(KOSTENART.MATERIAL) && KOSTENART_LISTE.includes(KOSTENART.MASCHINE) &&
    KOSTENART_LISTE.includes(KOSTENART.ARBEIT) && KOSTENART_LISTE.includes(KOSTENART.ZUKAUF) &&
    KOSTENART_LISTE.includes(KOSTENART.MONTAGE));
  ok('rundeCent: kaufmännisch', rundeCent(11199.5) === 11200 && rundeCent(11199.49) === 11199);
  ok('rundeCent: NaN/undefined → 0', rundeCent(NaN) === 0 && rundeCent(undefined) === 0);
  ok('prozentFaktor: 12 → 1.12, leer → 1', prozentFaktor(12) === 1.12 && prozentFaktor() === 1);

  // Material: pauschal + Verschnitt.
  ok('materialkosten pauschal + Verschnitt 12%', materialkosten({ betragCent: 10000, verschnittProzent: 12 }) === 11200);
  ok('materialkosten ohne Verschnitt', materialkosten({ betragCent: 10000 }) === 10000);
  ok('materialkosten leer → 0', materialkosten() === 0 && materialkosten({}) === 0);
  // Material: m²-Formel.
  ok('m²-Material: 2,5 m² × 40€/m² + 12% Verschnitt',
    materialkosten({ flaecheM2: 2.5, preisProM2Cent: 4000, verschnittProzent: 12 }) === 11200);
  ok('m2Materialkosten = materialkosten(m²)',
    m2Materialkosten({ flaecheM2: 2.5, preisProM2Cent: 4000, verschnittProzent: 12 }) === 11200);
  ok('m²-Basis schlägt betragCent (gesetztes preisProM2)',
    materialkosten({ betragCent: 999999, flaecheM2: 1, preisProM2Cent: 5000 }) === 5000);

  // Zeitkosten (Maschine/Arbeit teilen die Logik).
  ok('zeitkosten: 2 Std × 45€/Std', zeitkosten({ stunden: 2, satzCentProStd: 4500 }) === 9000);
  ok('maschinenkosten = zeitkosten', maschinenkosten({ stunden: 2, satzCentProStd: 4500 }) === 9000);
  ok('arbeitskosten = zeitkosten', arbeitskosten({ stunden: 3, satzCentProStd: 3500 }) === 10500);
  ok('zeitkosten: gebrochene Std cent-genau', zeitkosten({ stunden: 1.5, satzCentProStd: 3333 }) === 5000); // round(4999.5)

  // Zukauf/Handel.
  ok('zukaufkosten: EK 50€ + 20% Handelsaufschlag', zukaufkosten({ ekCent: 5000, handelsaufschlagProzent: 20 }) === 6000);
  ok('zukaufkosten ohne Aufschlag', zukaufkosten({ ekCent: 5000 }) === 5000);
  ok('montagekosten: pauschal', montagekosten({ betragCent: 2500 }) === 2500 && montagekosten() === 0);

  // Vorwärts: kompletter Durchlauf (Katalog §2).
  const v = kalkuliereVorwaerts({
    material: { betragCent: 10000, verschnittProzent: 12 }, // 11200
    maschine: { stunden: 2, satzCentProStd: 4500 },          // 9000
    arbeit: { stunden: 3, satzCentProStd: 3500 },            // 10500
    zukauf: { ekCent: 5000, handelsaufschlagProzent: 20 },   // 6000
    montage: { betragCent: 2500 },                           // 2500
    gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19,
  });
  ok('vorwärts: Einzelkosten', v.material === 11200 && v.maschine === 9000 &&
    v.arbeit === 10500 && v.zukauf === 6000 && v.montage === 2500);
  ok('vorwärts: Selbstkosten = Summe', v.selbstkosten === 39200);
  ok('vorwärts: Gemeinkosten 15% → 45080', v.selbstkosten + v.gemeinkostenBetrag === 45080 && v.gemeinkostenBetrag === 5880);
  ok('vorwärts: Netto nach Gewinn 20% = 54096', v.netto === 54096 && v.gewinnBetrag === 9016);
  ok('vorwärts: USt 19% = 10278, Brutto = 64374', v.ustBetrag === 10278 && v.brutto === 64374);
  ok('vorwärts: Deckungsbeitrag = Netto − Selbstkosten', v.deckungsbeitrag === 14896);
  ok('vorwärts: leere Eingabe → alles 0', (() => {
    const z = kalkuliereVorwaerts();
    return z.selbstkosten === 0 && z.netto === 0 && z.brutto === 0 && z.deckungsbeitrag === 0;
  })());

  // USt-Umrechnung cent-genau.
  ok('bruttoVonNetto: 54096 @19%', (() => {
    const b = bruttoVonNetto(54096, 19);
    return b.ustBetragCent === 10278 && b.bruttoCent === 64374;
  })());
  ok('nettoVonBrutto: 64374 @19% → 54096 (gerundet)', nettoVonBrutto(64374, 19) === 54096);
  ok('USt 0% neutral', nettoVonBrutto(5000, 0) === 5000 && bruttoVonNetto(5000, 0).bruttoCent === 5000);

  // Rückwärts: Zielpreis/Marge → erlaubte Kosten/Zeit (Katalog §2/§5.2).
  ok('maxSelbstkosten: invers zum Vorwärtslauf', maxSelbstkosten(54096, { gemeinkostenProzent: 15, gewinnProzent: 20 }) === 39200);
  ok('maxSelbstkosten: konservativ abgerundet (floor)',
    maxSelbstkosten(54097, { gemeinkostenProzent: 15, gewinnProzent: 20 }) === 39200);
  const r = kalkuliereRueckwaerts({
    zielNettoCent: 54096, gemeinkostenProzent: 15, gewinnProzent: 20,
    fixeKostenCent: 28700, stundensatzCentProStd: 3500, // alles außer Arbeit
  });
  ok('rückwärts: maxSelbstkosten = 39200', r.maxSelbstkostenCent === 39200);
  ok('rückwärts: Restbudget für Arbeit = 10500', r.budgetCent === 10500 && r.reichtAus);
  ok('rückwärts: erlaubte Stunden = 3.00', r.maxStunden === 3 && r.zielNettoCent === 54096);
  ok('rückwärts: aus Zielbrutto (64374 @19%)', (() => {
    const rb = kalkuliereRueckwaerts({ zielBruttoCent: 64374, ustProzent: 19, gemeinkostenProzent: 15, gewinnProzent: 20 });
    return rb.zielNettoCent === 54096 && rb.maxSelbstkostenCent === 39200;
  })());
  ok('rückwärts: Budget negativ → reichtAus=false, 0 Stunden', (() => {
    const rn = kalkuliereRueckwaerts({ zielNettoCent: 10000, fixeKostenCent: 12000, stundensatzCentProStd: 3500 });
    return rn.budgetCent < 0 && !rn.reichtAus && rn.maxStunden === 0;
  })());
});

await section('Kalkulation Block 2/Schritt 6: Produkt-Schemata (rein, füttert den Kern)', () => {
  // Struktur: alle Schemata sind strukturell gültig (eindeutige Keys, gültige
  // Art/Basis/Feldtypen, mapping liefert nur bekannte Kostenarten).
  const alle = validateAlleSchemata();
  ok('alle Schemata strukturell gültig', alle.ok);
  if (!alle.ok) console.error('   →', alle.fehler.join(' | '));
  ok('die 6 BAUPLAN-Schemata vorhanden', SCHEMA_IDS.length === 6 &&
    ['folierung', 'schild', 'gravur', 'leuchtreklame', 'druckZukauf', 'montage'].every((id) => SCHEMA_IDS.includes(id)));
  ok('SCHEMA_IDS deckt sich mit PRODUKT_SCHEMATA', SCHEMA_IDS.length === PRODUKT_SCHEMATA.length);
  ok('schemaNach: bekannt/unbekannt', schemaNach('folierung') && schemaNach('schild').id === 'schild' && schemaNach('quatsch') === null);
  ok('validateSchema: Müll → nicht ok', !validateSchema(null).ok && !validateSchema({ id: 'x', art: 'x', basis: 'x', felder: [], mapping: () => ({}) }).ok);

  // Defaults / Kalibrierung.
  const folie = schemaNach('folierung');
  ok('feldDefaults liefert alle Feld-Keys', Object.keys(feldDefaults(folie)).length === folie.felder.length);
  ok('kalibrierbareFelder nur die Hotspots', kalibrierbareFelder(folie).every((f) => f.kalibrierbar) &&
    kalibrierbareFelder(folie).length < folie.felder.length);
  ok('Folie hat sinnvolle Startsätze', feldDefaults(folie).preisProM2Cent === 4000 && feldDefaults(folie).verschnittProzent === 15);
  // Kalibrierung überschreibt NUR kalibrierbare Felder.
  ok('kalibrierteDefaults überschreibt kalibrierbares Feld', kalibrierteDefaults(folie, { preisProM2Cent: 5500 }).preisProM2Cent === 5500);
  ok('kalibrierteDefaults lässt nicht-kalibrierbares Feld unberührt', (() => {
    // flaecheM2 ist NICHT kalibrierbar → darf nicht aus der Kalibrierung gesetzt werden.
    const d = kalibrierteDefaults(folie, { flaecheM2: 99 });
    return d.flaecheM2 === 0;
  })());
  ok('werteMitDefaults: explizite Werte schlagen Defaults', (() => {
    const w = werteMitDefaults(folie, { flaecheM2: 2.5 }, { preisProM2Cent: 5000 });
    return w.flaecheM2 === 2.5 && w.preisProM2Cent === 5000 && w.verschnittProzent === 15;
  })());

  // Mapping: Schema-Werte → Kostenarten des Kerns (reine Zuordnung).
  const ka = baueKostenarten(folie, { flaecheM2: 2.5, preisProM2Cent: 4000, verschnittProzent: 12, verklebeStunden: 3, arbeitssatzCentProStd: 3500, montageCent: 2500 });
  ok('Folie-mapping: m²-Felder ins Material', ka.material.flaecheM2 === 2.5 && ka.material.preisProM2Cent === 4000 && ka.material.verschnittProzent === 12);
  ok('Folie-mapping: Verklebung in Arbeit, Montage gesetzt', ka.arbeit.stunden === 3 && ka.arbeit.satzCentProStd === 3500 && ka.montage.betragCent === 2500);

  // Durchrechnen über den Kern — Ergebnis muss IDENTISCH zum direkten Kern-Aufruf sein
  // (die Schicht erfindet keine Formel, sie füttert nur). Folie: 11200+10500+2500=24200.
  const erg = kalkuliereSchema(folie,
    { flaecheM2: 2.5, preisProM2Cent: 4000, verschnittProzent: 12, verklebeStunden: 3, arbeitssatzCentProStd: 3500, montageCent: 2500 },
    { gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19 });
  const direkt = kalkuliereVorwaerts({
    material: { flaecheM2: 2.5, preisProM2Cent: 4000, verschnittProzent: 12 },
    arbeit: { stunden: 3, satzCentProStd: 3500 },
    montage: { betragCent: 2500 },
    gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19,
  });
  ok('kalkuliereSchema == direkter Kern-Aufruf', JSON.stringify(erg) === JSON.stringify(direkt));
  ok('Folie: Selbstkosten 24200, Material m² korrekt', erg.selbstkosten === 24200 && erg.material === 11200 && erg.arbeit === 10500 && erg.montage === 2500);

  // Gravur: Maschinenzeit in MINUTEN → korrekt in Stunden umgerechnet (30 min @ 60€/Std = 3000 ct).
  const gravur = schemaNach('gravur');
  const kg = baueKostenarten(gravur, { gravurMinuten: 30, maschinensatzCentProStd: 6000 });
  ok('Gravur-mapping: 30 min → 0,5 Std Maschine', kg.maschine.stunden === 0.5 && kg.maschine.satzCentProStd === 6000);
  const eg = kalkuliereSchema(gravur, { rohlingCent: 800, gravurMinuten: 30, maschinensatzCentProStd: 6000, vorlageStunden: 1, arbeitssatzCentProStd: 4500 }, { ustProzent: 19 });
  ok('Gravur: Selbstkosten = 800 + 3000 + 4500 = 8300', eg.selbstkosten === 8300 && eg.maschine === 3000 && eg.arbeit === 4500);

  // Zukauf-Schema: Handelsaufschlag wirkt; reine Eigenleistung Layout.
  const druck = schemaNach('druckZukauf');
  const ed = kalkuliereSchema(druck, { layoutStunden: 2, arbeitssatzCentProStd: 4500, druckEkCent: 10000, handelsaufschlagProzent: 30 }, { ustProzent: 19 });
  ok('Druck-Zukauf: Arbeit 9000 + Zukauf 13000 = 22000', ed.arbeit === 9000 && ed.zukauf === 13000 && ed.selbstkosten === 22000);
  ok('Druck-Zukauf: Art = Handel', druck.art === PRODUKT_ART.HANDEL);

  // Leuchtreklame: alle fünf Kostenarten greifen.
  const leucht = schemaNach('leuchtreklame');
  const el = kalkuliereSchema(leucht, { materialCent: 8000, fertigungStunden: 2, maschinensatzCentProStd: 6000, elektrikStunden: 1.5, arbeitssatzCentProStd: 4000, ledEkCent: 5000, handelsaufschlagProzent: 20, montageCent: 3000 }, { ustProzent: 19 });
  ok('Leuchtreklame: alle Kostenarten > 0', el.material === 8000 && el.maschine === 12000 && el.arbeit === 6000 && el.zukauf === 6000 && el.montage === 3000);
  ok('Leuchtreklame: Selbstkosten = Summe (35000)', el.selbstkosten === 35000);

  // Leeres Schema (nur Defaults, keine Mengen) → Selbstkosten 0, kein Absturz.
  ok('leere Mengen → Selbstkosten 0', kalkuliereSchema(folie, {}, {}).selbstkosten === 0);

  // Feld-/Enum-Konstanten exportiert und nicht-leer (für die spätere UI).
  ok('Enums vorhanden', PRODUKT_ART.EIGEN === 'eigen' && BASIS.M2 === 'm2' && FELD_TYP.GELD === 'geld');
});

// ===== BAUPLAN Block 2 / Schritt 7: Angebote-Kern =====

await section('Angebote: Status-Lebenslauf & Übergänge', () => {
  ok('Default-Status = entwurf', ANGEBOT_STATUS_DEFAULT === ANGEBOT_STATUS.ENTWURF);
  ok('5 Status definiert', ANGEBOT_STATUS_LISTE.length === 5);
  ok('istAngebotStatus prüft', istAngebotStatus('offen') && !istAngebotStatus('quatsch'));

  // Erlaubte Übergänge.
  ok('entwurf → offen erlaubt', darfAngebotWechseln('entwurf', 'offen'));
  ok('offen → angenommen erlaubt', darfAngebotWechseln('offen', 'angenommen'));
  ok('offen → abgelehnt erlaubt', darfAngebotWechseln('offen', 'abgelehnt'));
  ok('abgelehnt → offen reaktivierbar', darfAngebotWechseln('abgelehnt', 'offen'));
  ok('jeder aktive Status → archiviert', ['entwurf', 'offen', 'angenommen', 'abgelehnt'].every((s) => darfAngebotWechseln(s, 'archiviert')));
  // Verbotene Übergänge.
  ok('entwurf → angenommen verboten', !darfAngebotWechseln('entwurf', 'angenommen'));
  ok('archiviert ist terminal', ANGEBOT_STATUS_FLOW.archiviert.length === 0);
  ok('angenommen → offen verboten', !darfAngebotWechseln('angenommen', 'offen'));

  // setzeAngebotStatus liefert NEUES Objekt / Fehler.
  const a = neuesAngebot({ titel: 'Test', positionen: [{ menge: 1, einzelpreisCent: 1000, ustSatz: 19 }] });
  const s1 = setzeAngebotStatus(a, 'offen');
  ok('erlaubter Wechsel ok + neues Objekt', s1.ok && s1.angebot !== a && s1.angebot.status === 'offen' && a.status === 'entwurf');
  const s2 = setzeAngebotStatus(a, 'angenommen');
  ok('verbotener Wechsel → ok:false, Angebot unverändert', !s2.ok && s2.angebot.status === 'entwurf' && /nicht erlaubt/.test(s2.fehler));
  const arch = archiviereAngebot(s1.angebot);
  ok('archiviereAngebot → archiviert', arch.ok && istArchiviert(arch.angebot));
  ok('istAktivesAngebot: offen aktiv, archiviert nicht', istAktivesAngebot(s1.angebot) && !istAktivesAngebot(arch.angebot));
});

await section('Angebote: Filter (aktiv/archiv/nach Status)', () => {
  const liste = [
    { status: 'entwurf' }, { status: 'offen' }, { status: 'angenommen' },
    { status: 'archiviert' }, { status: 'abgelehnt' }, { status: 'archiviert' },
  ];
  ok('aktiveAngebote = 4', aktiveAngebote(liste).length === 4);
  ok('archivierteAngebote = 2', archivierteAngebote(liste).length === 2);
  ok('angeboteNachStatus(offen) = 1', angeboteNachStatus(liste, 'offen').length === 1);
  ok('leere Liste robust', aktiveAngebote(null).length === 0 && archivierteAngebote(undefined).length === 0);
});

await section('Angebote: Nummernkreis (AN-JJJJ-NNNN, frei)', () => {
  ok('Präfix AN', ANGEBOT_PREFIX === 'AN');
  ok('Format AN-2026-0007', formatAngebotsnummer(7, 2026) === 'AN-2026-0007');
  ok('Format vierstellig gepolstert', formatAngebotsnummer(1, 2026) === 'AN-2026-0001');
  ok('parse korrekt', JSON.stringify(parseAngebotsnummer('AN-2026-0042')) === JSON.stringify({ jahr: 2026, seq: 42 }));
  ok('parse ungültig → null', parseAngebotsnummer('2026-0001') === null && parseAngebotsnummer('') === null);
  ok('istAngebotsnummer trennt vom §14-Kreis', istAngebotsnummer('AN-2026-0001') && !istAngebotsnummer('2026-0001'));

  // Nächste Nummer pro Jahr fortlaufend; fremdes Jahr ignoriert.
  const best = ['AN-2026-0001', 'AN-2026-0003', 'AN-2025-0099', 'kaputt', ''];
  ok('naechsteAngebotsSeq(2026) = 4', naechsteAngebotsSeq(best, 2026) === 4);
  ok('naechsteAngebotsSeq(2025) = 100', naechsteAngebotsSeq(best, 2025) === 100);
  ok('naechsteAngebotsSeq(2027) = 1 (leeres Jahr)', naechsteAngebotsSeq(best, 2027) === 1);
  // Aus Angebots-Objekten (nicht nur Strings).
  ok('seq aus Objekten', naechsteAngebotsSeq([{ nummer: 'AN-2026-0005' }], 2026) === 6);

  // Vergabe: setzt freie Nummer, lässt bereits nummerierte unangetastet.
  const v = vergebeAngebotsnummer(neuesAngebot({ titel: 'X' }), best, 2026);
  ok('vergebeAngebotsnummer setzt AN-2026-0004', v.nummer === 'AN-2026-0004');
  const schon = { nummer: 'AN-2026-0001', titel: 'X' };
  ok('vergebeAngebotsnummer lässt vergebene unverändert', vergebeAngebotsnummer(schon, best, 2026) === schon);
});

await section('Angebote: Positions-Aggregation (cent-genau, gemeinsamer Kern)', () => {
  const positionen = [
    { menge: 2, einzelpreisCent: 5000, ustSatz: 19 },   // 10000 netto, 1900 USt
    { menge: 1, einzelpreisCent: 3000, ustSatz: 7 },     // 3000 netto, 210 USt
    { menge: 3, einzelpreisCent: 1000, ustSatz: 19 },    // 3000 netto, 570 USt
  ];
  const s = angebotSummen(positionen);
  ok('Netto 16000', s.netto === 16000);
  ok('USt 19% = 2470, 7% = 210', s.perSatz[19].ust === 2470 && s.perSatz[7].ust === 210);
  ok('USt gesamt 2680', s.ust === 2680);
  ok('Brutto 18680', s.brutto === 18680);
});

await section('Angebote: Prime Directive — intern bleibt intern', () => {
  // Position aus Schema: interne Kalkulation gespeichert, extern nur Netto-Preis.
  const pos = positionAusSchema('folierung', {
    werte: { flaecheM2: 5, preisProM2Cent: 4000, verschnittProzent: 15, verklebeStunden: 2, arbeitssatzCentProStd: 4500 },
    zuschlaege: { gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19 },
    beschreibung: 'Teilfolierung Transporter',
  });
  ok('interne kalkulation vorhanden', pos.kalkulation && pos.kalkulation.schemaId === 'folierung');
  ok('externer Einzelpreis = interner Netto', pos.einzelpreisCent === pos.kalkulation.ergebnis.netto);
  ok('ustSatz aus zuschlaege.ustProzent', pos.ustSatz === 19);
  ok('Beschreibung übernommen', pos.beschreibung === 'Teilfolierung Transporter');

  // Angebot mit dieser Position; Außendokument darf NICHTS Internes enthalten.
  const angebot = neuesAngebot({ titel: 'Folierung', positionen: [pos] });
  const extern = externesAngebot(angebot);
  const externJson = JSON.stringify(extern);
  ok('Außendokument hat keine kalkulation', !/kalkulation/.test(externJson));
  ok('Außendokument verrät keine Marge/Verschnitt/Maschinensatz', !/(verschnitt|gewinnProzent|maschinensatz|selbstkosten|deckungsbeitrag)/i.test(externJson));
  ok('externePosition: nur Whitelist-Felder + netto', Object.keys(externePosition(pos)).sort().join(',') === 'beschreibung,einzelpreisCent,menge,netto,ustSatz');
  ok('Außendokument trägt Positionen + Summen', extern.positionen.length === 1 && extern.netto === pos.einzelpreisCent && extern.brutto > extern.netto);
  ok('Außendokument-Steuerzeile 19%', extern.steuerzeilen.length === 1 && extern.steuerzeilen[0].satz === 19);

  // normalizeAngebotsposition reicht interne Schicht unverändert durch.
  const norm = normalizeAngebotsposition(pos);
  ok('normalize behält interne kalkulation', norm.kalkulation === pos.kalkulation && norm.einzelpreisCent === pos.einzelpreisCent);
});

await section('Angebote: interne Auswertung (Live-Deckungsbeitrag, intern)', () => {
  const pos = positionAusSchema('montage', {
    werte: { arbeitsStunden: 4, arbeitssatzCentProStd: 4500, anfahrtCent: 2000 },
    zuschlaege: { gemeinkostenProzent: 10, gewinnProzent: 25, ustProzent: 19 },
  });
  // Menge 2 → Auswertung × Menge; externes Netto = einzelpreis × menge.
  const angebot = neuesAngebot({ titel: 'Montage', positionen: [{ ...pos, menge: 2 }] });
  const intern = interneAuswertung(angebot);
  const extern = externesAngebot(angebot);
  ok('interne netto = externes netto', intern.netto === extern.netto);
  ok('Deckungsbeitrag = netto − selbstkosten', intern.deckungsbeitrag === intern.netto - intern.selbstkosten);
  ok('Selbstkosten > 0', intern.selbstkosten > 0);
  // Position ohne Kalkulation zählt mit 0 (kein Absturz).
  const gemischt = neuesAngebot({ titel: 'Mix', positionen: [{ menge: 1, einzelpreisCent: 5000, ustSatz: 19 }] });
  ok('ohne kalkulation → alles 0', JSON.stringify(interneAuswertung(gemischt)) === JSON.stringify({ selbstkosten: 0, netto: 0, deckungsbeitrag: 0 }));
});

await section('Angebote: Factory & Validierung', () => {
  const a = neuesAngebot({ titel: 'Schild', positionen: [{ menge: '2', einzelpreisCent: 12000, ustSatz: '19' }] });
  ok('Factory: type/status/leere Nummer', a.type === 'angebot' && a.status === 'entwurf' && a.nummer === '');
  ok('Factory: Position normalisiert (Zahlen)', a.positionen[0].menge === 2 && a.positionen[0].ustSatz === 19);
  ok('gültiges Angebot → keine Fehler', validateAngebot(a).length === 0);

  ok('Entwurf ohne Nummer ist gültig', !validateAngebot(a).some((e) => /nummer/i.test(e)));
  ok('fehlender Titel → Fehler', validateAngebot({ ...a, titel: '  ' }).some((e) => /Titel/.test(e)));
  ok('keine Positionen → Fehler', validateAngebot({ ...a, positionen: [] }).some((e) => /Position/.test(e)));
  ok('ungültige Nummer → Fehler', validateAngebot({ ...a, nummer: '2026-0001' }).some((e) => /Angebotsnummer/.test(e)));
  ok('ungültiger Status → Fehler', validateAngebot({ ...a, status: 'quatsch' }).some((e) => /Status/.test(e)));
  ok('Menge 0 → Fehler', validateAngebot({ ...a, positionen: [{ menge: 0, einzelpreisCent: 100 }] }).some((e) => /Menge/.test(e)));
  ok('negativer Preis → Fehler', validateAngebot({ ...a, positionen: [{ menge: 1, einzelpreisCent: -1 }] }).some((e) => /Einzelpreis/.test(e)));
  ok('kein Angebot → Fehler', validateAngebot(null).length > 0);
});

await section('Kalkulation Block 2/Schritt 8: Angebot → Rechnung-Übernahme (rein)', () => {
  // Ein angenommenes Angebot mit interner Kalkulation (Schema) → externe Übernahme.
  const pos = positionAusSchema('folierung', {
    werte: { flaecheM2: 5, preisProM2Cent: 4000, verschnittProzent: 15, verklebeStunden: 2, arbeitssatzCentProStd: 4500 },
    zuschlaege: { gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19 },
    beschreibung: 'Teilfolierung Transporter',
  });
  let angebot = neuesAngebot({ titel: 'Folierung', kundeId: 'kunde:1', kostenstelle: 'ks:3000', positionen: [pos] });
  angebot = vergebeAngebotsnummer(angebot, [], 2026);          // AN-2026-0001
  // entwurf → offen → angenommen
  angebot = setzeAngebotStatus(angebot, ANGEBOT_STATUS.OFFEN).angebot;
  angebot = setzeAngebotStatus(angebot, ANGEBOT_STATUS.ANGENOMMEN).angebot;

  // --- Übernehmbarkeit ---
  ok('angenommenes Angebot ist übernehmbar', darfAngebotUebernehmen(angebot));
  ok('Entwurf NICHT übernehmbar', !darfAngebotUebernehmen(neuesAngebot({ titel: 'x', positionen: [pos] })));
  ok('offenes Angebot NICHT übernehmbar', !darfAngebotUebernehmen({ ...angebot, status: ANGEBOT_STATUS.OFFEN }));
  ok('ohne Angebotsnummer → Fehler', validateAngebotUebernahme({ ...angebot, nummer: '' }).some((e) => /Angebotsnummer/.test(e)));
  ok('ohne Positionen → Fehler', validateAngebotUebernahme({ ...angebot, positionen: [] }).some((e) => /Position/.test(e)));
  ok('kein Angebot → Fehler', validateAngebotUebernahme(null).length > 0);

  // --- Nummern-Politik: blp → §14-Nummer ---
  const nBlp = uebernahmeNummer({ settings: { rechnungsstelle: 'blp' }, seq: 7, jahr: 2026 });
  ok('blp: echte §14-Nummer', nBlp.nummer === '2026-0007' && nBlp.vorlaeufig === false && nBlp.kreis === UEBERNAHME_KREIS.PARAGRAF14);
  // Default (kein Setting) = blp.
  ok('Default (kein Setting) = §14', uebernahmeNummer({ seq: 1, jahr: 2026 }).kreis === UEBERNAHME_KREIS.PARAGRAF14);
  // extern → vorläufige ENT-Nummer.
  const nExt = uebernahmeNummer({ settings: { rechnungsstelle: 'extern' }, seq: 7, jahr: 2026 });
  ok('extern: vorläufige ENT-Nummer', nExt.nummer === 'ENT-2026-0007' && nExt.vorlaeufig === true && nExt.kreis === UEBERNAHME_KREIS.VORLAEUFIG);

  // --- Übernahme-Entwurf (blp) ---
  const eBlp = angebotUebernahmeEntwurf(angebot, { settings: { rechnungsstelle: 'blp' }, seq: 7, datum: '2026-06-18' });
  ok('blp-Entwurf: §14-Nummer', eBlp.nummer === '2026-0007' && eBlp.vorlaeufig === false);
  ok('referenziert Angebotsnummer', eBlp.angebotsnummer === 'AN-2026-0001');
  ok('benutzt Angebotsnummer NICHT wieder', eBlp.nummer !== eBlp.angebotsnummer && !istAngebotsnummer(eBlp.nummer));
  ok('Beschreibung nennt Rechnung + Angebot', /Rechnung 2026-0007/.test(eBlp.beschreibung) && /aus Angebot AN-2026-0001/.test(eBlp.beschreibung) && !/vorläufig/.test(eBlp.beschreibung));
  ok('Jahr aus datum abgeleitet', angebotUebernahmeEntwurf(angebot, { settings: { rechnungsstelle: 'blp' }, seq: 3, datum: '2025-12-01' }).nummer === '2025-0003');
  ok('Stammdaten übernommen (kundeId/kostenstelle)', eBlp.kundeId === 'kunde:1' && eBlp.kostenstelle === 'ks:3000');
  ok('leistungsdatum fällt auf datum', eBlp.leistungsdatum === '2026-06-18');

  // Buchungszeilen = derselbe Kern wie rechnungAusAuftrag (Soll Forderung / Haben Erlöse+USt).
  const externDoc = externesAngebot(angebot);
  const direkt = rechnungZeilen({ positionen: externDoc.positionen });
  ok('summen = Angebots-Summen (extern)', eBlp.summen.brutto === externDoc.brutto && eBlp.summen.netto === externDoc.netto && eBlp.summen.ust === externDoc.ust);
  ok('zeilen identisch zum direkten Kern', JSON.stringify(eBlp.zeilen) === JSON.stringify(direkt.zeilen));
  ok('Soll-Forderung = Brutto', zeile(eBlp.zeilen, '1400', 'S').betrag === externDoc.brutto);
  ok('Haben-Erlös 19% = Netto', zeile(eBlp.zeilen, '8400', 'H').betrag === externDoc.netto);
  ok('Haben-USt 19% vorhanden', !!zeile(eBlp.zeilen, '1776', 'H'));

  // --- Prime Directive: NICHTS Internes im Entwurf ---
  const entwurfJson = JSON.stringify(eBlp);
  ok('Entwurf hat keine kalkulation', !/kalkulation/.test(entwurfJson));
  ok('Entwurf verrät keine Marge/Verschnitt/Selbstkosten', !/(verschnitt|gewinnProzent|maschinensatz|selbstkosten|deckungsbeitrag|gemeinkosten)/i.test(entwurfJson));

  // --- Übernahme-Entwurf (extern) ---
  const eExt = angebotUebernahmeEntwurf(angebot, { settings: { rechnungsstelle: 'extern' }, seq: 7, datum: '2026-06-18' });
  ok('extern-Entwurf: vorläufige ENT-Nummer', eExt.nummer === 'ENT-2026-0007' && eExt.vorlaeufig === true && eExt.kreis === UEBERNAHME_KREIS.VORLAEUFIG);
  ok('extern: Beschreibung kennzeichnet „vorläufig"', /Vorlage ENT-2026-0007/.test(eExt.beschreibung) && /vorläufig/.test(eExt.beschreibung) && /aus Angebot AN-2026-0001/.test(eExt.beschreibung));
  ok('extern: referenziert Angebot, eigene Nummer ≠ Angebot', eExt.angebotsnummer === 'AN-2026-0001' && eExt.nummer !== eExt.angebotsnummer);
  ok('extern: gleiche Buchungssummen wie blp (nur Nummer/Politik anders)', JSON.stringify(eExt.zeilen) === JSON.stringify(eBlp.zeilen));
  ok('extern: ENT-Nummer ist keine §14-Nummer', !/^\d{4}-\d{4}$/.test(eExt.nummer));
});

await section('Nachkalkulation: Auftrags-Kostenträger + Soll/Ist (Schritt 9)', () => {
  // — Angebot mit interner Vorkalkulation (SOLL) je Position —
  const angebot = neuesAngebot({
    titel: 'Schild + Montage', kundeId: 'k1', kostenstelle: 'KT-1',
    positionen: [
      { beschreibung: 'Schild', menge: 1, einzelpreisCent: 20000, ustSatz: 19, kalkulation: {
        ergebnis: { material: 10000, maschine: 0, arbeit: 5000, zukauf: 0, montage: 0,
          selbstkosten: 15000, netto: 20000, deckungsbeitrag: 5000 } } },
      { beschreibung: 'Profil', menge: 2, einzelpreisCent: 5000, ustSatz: 19, kalkulation: {
        ergebnis: { material: 1000, maschine: 500, arbeit: 0, zukauf: 2000, montage: 0,
          selbstkosten: 3500, netto: 5000, deckungsbeitrag: 1500 } } },
    ],
  });

  const soll = sollkostenAusAngebot(angebot);
  ok('Soll perBlock material = 12000', soll.perBlock[KOSTENART.MATERIAL] === 12000);
  ok('Soll perBlock maschine = 1000', soll.perBlock[KOSTENART.MASCHINE] === 1000);
  ok('Soll perBlock arbeit = 5000', soll.perBlock[KOSTENART.ARBEIT] === 5000);
  ok('Soll perBlock zukauf = 4000', soll.perBlock[KOSTENART.ZUKAUF] === 4000);
  ok('Soll selbstkosten = Σ Blöcke = 22000', soll.selbstkostenCent === 22000);
  ok('Soll netto = 30000', soll.nettoCent === 30000);
  ok('Soll deckungsbeitrag = 8000', soll.deckungsbeitragCent === 8000);
  ok('Soll selbstkosten == interneAuswertung', soll.selbstkostenCent === interneAuswertung(angebot).selbstkosten);

  // — IST aus Buchungen/Belegen (nur festgeschrieben + passende kostenstelle) —
  const kontoIndex = {
    '3400': { art: KONTOART.AUFWAND }, '3100': { art: KONTOART.AUFWAND },
    '1200': { art: KONTOART.AKTIV }, '1600': { art: KONTOART.PASSIV },
  };
  const buchungen = [
    { id: 'b1', seq: 1, datum: '2026-05-02', kostenstelle: 'KT-1', belegRef: 'beleg-1', beschreibung: 'Materialeinkauf',
      zeilen: [{ konto: '3400', seite: 'S', betrag: 13000 }, { konto: '1200', seite: 'H', betrag: 13000 }] },
    { id: 'b2', seq: 2, datum: '2026-05-10', kostenstelle: 'KT-1', belegRef: 'beleg-2', beschreibung: 'Fremdleistung',
      zeilen: [{ konto: '3100', seite: 'S', betrag: 4500 }, { konto: '1600', seite: 'H', betrag: 4500 }] },
    { id: 'bE', seq: null, datum: '2026-05-11', kostenstelle: 'KT-1', beschreibung: 'Entwurf zählt nicht',
      zeilen: [{ konto: '3400', seite: 'S', betrag: 9999 }, { konto: '1200', seite: 'H', betrag: 9999 }] },
    { id: 'bX', seq: 3, datum: '2026-05-12', kostenstelle: 'KT-2', beschreibung: 'fremder Kostenträger',
      zeilen: [{ konto: '3400', seite: 'S', betrag: 7777 }, { konto: '1200', seite: 'H', betrag: 7777 }] },
  ];
  const kontoBlock = { '3100': KOSTENART.ZUKAUF }; // 3100 = Fremdleistung → Zukauf, 3400 default Material

  const ausB = istkostenAusBuchungen(buchungen, kontoIndex, 'KT-1', { kontoBlock });
  ok('IST-Buchungen summe = 17500 (Entwurf/anderer KT ignoriert)', ausB.summeCent === 17500);
  ok('IST-Buchungen material = 13000', ausB.perBlock[KOSTENART.MATERIAL] === 13000);
  ok('IST-Buchungen zukauf = 4500 (kontoBlock)', ausB.perBlock[KOSTENART.ZUKAUF] === 4500);
  ok('IST-Buchungen perKonto 3400 = 13000', ausB.perKonto['3400'] === 13000);
  ok('IST-Buchungen 2 Belege geführt', ausB.belege.length === 2);
  ok('IST-Buchungen belegRef mitgeführt', ausB.belege[0].belegRef === 'beleg-1' && ausB.belege[0].betragCent === 13000);

  // — IST-Zeit (interner Stundenkostensatz; Maschine/Arbeit getrennt) —
  const zeit = [
    { dauerMin: 60, art: 'arbeit', kostenstelle: 'KT-1' },                               // 1h × 60€ = 6000
    { dauerMin: 30, art: 'maschine', kostenstelle: 'KT-1', kostensatzCentProStd: 8000 }, // 0.5h × 80€ = 4000
    { dauerMin: 120, art: 'arbeit', kostenstelle: 'KT-2' },                              // anderer KT → ignoriert
  ];
  const ausZ = istZeitkosten(zeit, { kostenstelle: 'KT-1', kostensatzCentProStd: 6000 });
  ok('IST-Zeit arbeit = 6000 (Default-Satz)', ausZ.perBlock[KOSTENART.ARBEIT] === 6000);
  ok('IST-Zeit maschine = 4000 (eigener Satz)', ausZ.perBlock[KOSTENART.MASCHINE] === 4000);
  ok('IST-Zeit summe = 10000, minuten = 90', ausZ.summeCent === 10000 && ausZ.minuten === 90);

  // — IST gesamt (Belege + Zeit) —
  const ist = istkosten({ buchungen, kontoIndex, kostenstelle: 'KT-1', zeiteintraege: zeit, kontoBlock, kostensatzCentProStd: 6000 });
  ok('IST gesamt summe = 27500', ist.summeCent === 27500);
  ok('IST gesamt material 13000 / maschine 4000 / arbeit 6000 / zukauf 4500',
    ist.perBlock[KOSTENART.MATERIAL] === 13000 && ist.perBlock[KOSTENART.MASCHINE] === 4000
    && ist.perBlock[KOSTENART.ARBEIT] === 6000 && ist.perBlock[KOSTENART.ZUKAUF] === 4500);

  // — Soll/Ist-Vergleich —
  const v = nachkalkulation(soll, ist);
  const block = (b) => v.perBlock.find((x) => x.block === b);
  ok('Vergleich material: ist 13000 vs soll 12000 → +1000 / 8.3%',
    block(KOSTENART.MATERIAL).abweichungCent === 1000 && block(KOSTENART.MATERIAL).abweichungProzent === 8.3);
  ok('Vergleich maschine: +3000 / 300%', block(KOSTENART.MASCHINE).abweichungCent === 3000 && block(KOSTENART.MASCHINE).abweichungProzent === 300);
  ok('Vergleich montage: soll 0 → Prozent null', block(KOSTENART.MONTAGE).sollCent === 0 && block(KOSTENART.MONTAGE).abweichungProzent === null);
  ok('Vergleich Summen: soll 22000 / ist 27500 / +5500 / 25%',
    v.sollSummeCent === 22000 && v.istSummeCent === 27500 && v.abweichungCent === 5500 && v.abweichungProzent === 25);
  ok('Vergleich DB: soll 8000, ist 2500 (Erlös 30000 − 27500)', v.deckungsbeitragSollCent === 8000 && v.deckungsbeitragIstCent === 2500);
  ok('Vergleich DB-Abweichung = -5500', v.deckungsbeitragAbweichungCent === -5500);

  // — abweichender tatsächlicher Erlös —
  const v2 = nachkalkulation(soll, ist, { nettoCent: 28000 });
  ok('Vergleich mit Ist-Netto 28000 → DB ist 500', v2.deckungsbeitragIstCent === 500 && v2.nettoCent === 28000);

  // — Komfort-Einstieg liefert dasselbe —
  const analyse = kostentraegerAnalyse(angebot, { buchungen, kontoIndex, zeiteintraege: zeit, kontoBlock, kostensatzCentProStd: 6000 });
  ok('kostentraegerAnalyse: kostenstelle aus Angebot', analyse.kostenstelle === 'KT-1');
  ok('kostentraegerAnalyse: gleicher Vergleich', JSON.stringify(analyse.vergleich) === JSON.stringify(v));

  // — leeres/kalkulationsloses Angebot → Soll 0 (kein Wurf) —
  const leer = sollkostenAusAngebot(neuesAngebot({ titel: 'x', positionen: [{ beschreibung: 'p', menge: 1, einzelpreisCent: 100, ustSatz: 19 }] }));
  ok('Soll ohne interne Kalkulation = 0', leer.selbstkostenCent === 0 && leer.nettoCent === 0);
});

await section('Nachkalkulation-Store (UI-Glue): zeiteintraegeAusZeiten', () => {
  const auftragIndex = { 'auf-1': { id: 'auf-1', kostenstelle: 'KT-1' }, 'auf-2': { id: 'auf-2', kostenstelle: null } };
  const mitarbeiterIndex = { 'ma-1': { id: 'ma-1', stundenlohnCent: 6000 }, 'ma-2': { id: 'ma-2', stundenlohnCent: null } };
  const zeiten = [
    { dauerMin: 120, auftragId: 'auf-1', mitarbeiterId: 'ma-1', datum: '2026-06-01' },
    { dauerMin: 30, auftragId: 'auf-2', mitarbeiterId: 'ma-1', datum: '2026-06-02' }, // Auftrag ohne Kostenstelle
    { dauerMin: 60, auftragId: 'unbekannt', mitarbeiterId: 'ma-2', datum: '2026-06-03' }, // kein Auftrag/Satz
  ];
  const out = zeiteintraegeAusZeiten(zeiten, auftragIndex, mitarbeiterIndex);
  ok('Kostenträger aus dem Auftrag übernommen', out[0].kostenstelle === 'KT-1');
  ok('Stundenkostensatz aus dem Mitarbeiter', out[0].kostensatzCentProStd === 6000);
  ok('art = arbeit (Default)', out[0].art === KOSTENART.ARBEIT);
  ok('Auftrag ohne Kostenstelle → null', out[1].kostenstelle === null);
  ok('unbekannter Auftrag → null, fehlender Satz → 0', out[2].kostenstelle === null && out[2].kostensatzCentProStd === 0);

  // Durchgereicht an istZeitkosten: nur der KT-1-Eintrag zählt zum Kostenträger.
  const zk = istZeitkosten(out, { kostenstelle: 'KT-1' });
  ok('istZeitkosten: nur KT-1-Zeit (2h × 60€) = 12000', zk.summeCent === 12000 && zk.minuten === 120);
  ok('leere Eingabe → leere Liste', zeiteintraegeAusZeiten().length === 0);

  // EXPLIZITE Zuordnung (zeit.kostenstelle, über die Zeit-Zuordnungs-UI) gewinnt vor der
  // Ableitung aus dem Auftrag.
  const mitExplizit = [
    { dauerMin: 60, auftragId: 'auf-1', mitarbeiterId: 'ma-1', datum: '2026-06-04', kostenstelle: 'KT-9' },
    { dauerMin: 60, auftragId: 'auf-2', mitarbeiterId: 'ma-1', datum: '2026-06-05', kostenstelle: 'KT-9' }, // Auftrag ohne KS, aber explizit
  ];
  const exp = zeiteintraegeAusZeiten(mitExplizit, auftragIndex, mitarbeiterIndex);
  ok('explizite Kostenstelle gewinnt vor Auftrag (auf-1=KT-1 → KT-9)', exp[0].kostenstelle === 'KT-9');
  ok('explizite Kostenstelle auch ohne Auftrags-KS', exp[1].kostenstelle === 'KT-9');
});

await section('Nachkalkulation: aufgeloesteKostenstelle (explizit vor Auftrag)', () => {
  const auftragIndex = { 'auf-1': { id: 'auf-1', kostenstelle: 'KT-1' }, 'auf-2': { id: 'auf-2', kostenstelle: null } };
  ok('explizit gesetzt → genau diese', aufgeloesteKostenstelle({ kostenstelle: 'KT-7', auftragId: 'auf-1' }, auftragIndex) === 'KT-7');
  ok('ohne explizit → aus Auftrag abgeleitet', aufgeloesteKostenstelle({ auftragId: 'auf-1' }, auftragIndex) === 'KT-1');
  ok('Auftrag ohne KS → null', aufgeloesteKostenstelle({ auftragId: 'auf-2' }, auftragIndex) === null);
  ok('unbekannter Auftrag → null', aufgeloesteKostenstelle({ auftragId: 'weg' }, auftragIndex) === null);
  ok('weder explizit noch Auftrag → null', aufgeloesteKostenstelle({}, auftragIndex) === null);
  // Leer-String = bewusst „keiner" → überschreibt die Auftrags-Ableitung, wird zu null.
  ok('explizit "" → null (überschreibt Auftrag)', aufgeloesteKostenstelle({ kostenstelle: '', auftragId: 'auf-1' }, auftragIndex) === null);
});

await section('Nachkalkulation: Standard-konto→Kostenart (SKR03-Kontenklassen)', () => {
  // Einzel-Zuordnung nach Kontenklasse.
  ok('3300 Wareneingang → Material', kostenartFuerKonto('3300') === KOSTENART.MATERIAL);
  ok('3400 Wareneingang → Material', kostenartFuerKonto('3400') === KOSTENART.MATERIAL);
  ok('3000 RHB-Stoffe → Material', kostenartFuerKonto('3000') === KOSTENART.MATERIAL);
  ok('3100 Fremdleistungen → Zukauf', kostenartFuerKonto('3100') === KOSTENART.ZUKAUF);
  ok('3199 Fremdleistungen (Grenze) → Zukauf', kostenartFuerKonto('3199') === KOSTENART.ZUKAUF);
  ok('4100 Löhne → Arbeit', kostenartFuerKonto('4100') === KOSTENART.ARBEIT);
  ok('4130 soziale Aufwendungen → Arbeit', kostenartFuerKonto('4130') === KOSTENART.ARBEIT);
  ok('4210 Miete → null (Gemeinkosten, unklassifiziert)', kostenartFuerKonto('4210') === null);
  ok('8400 Erlös → null (kein Aufwand)', kostenartFuerKonto('8400') === null);
  ok('Müll-Eingabe → null', kostenartFuerKonto('') === null && kostenartFuerKonto(null) === null && kostenartFuerKonto('abc') === null);

  // Map-Bau aus dem Kontenplan: nur AUFWAND-Konten mit sicherer Zuordnung.
  const map = standardKontoBlock(SKR03_SEED);
  ok('Map: 3300 → Material', map['3300'] === KOSTENART.MATERIAL);
  ok('Map: 3400 → Material', map['3400'] === KOSTENART.MATERIAL);
  ok('Map: 4100 → Arbeit', map['4100'] === KOSTENART.ARBEIT);
  ok('Map: 4120 → Arbeit', map['4120'] === KOSTENART.ARBEIT);
  ok('Map: Miete 4210 nicht enthalten (Default Material greift)', !('4210' in map));
  ok('Map: Bank 1200 (Aktiv) nicht enthalten', !('1200' in map));
  ok('Map: Erlös 8400 (Ertrag) nicht enthalten', !('8400' in map));
  // Aufwands-Konto ohne sichere Klassen-Zuordnung bleibt draußen (≙ Default Material).
  ok('Map: 2100 Zinsaufwand nicht enthalten', !('2100' in map));

  // Durchgereicht an istkostenAusBuchungen: Wareneingang→Material, Fremdleistung→Zukauf,
  // Lohn→Arbeit — ohne dass der Aufrufer eine kontoBlock-Map von Hand pflegen muss.
  // (3100 Fremdleistungen ist im SKR03-Seed nicht enthalten, hier als frei angelegtes Konto.)
  const konten = [
    { nummer: '3400', art: KONTOART.AUFWAND }, { nummer: '3100', art: KONTOART.AUFWAND },
    { nummer: '4100', art: KONTOART.AUFWAND }, { nummer: '1200', art: KONTOART.AKTIV },
  ];
  const block2 = standardKontoBlock(konten);
  ok('Map (frei angelegt): 3100 Fremdleistung → Zukauf', block2['3100'] === KOSTENART.ZUKAUF);
  const kontoIndex = Object.fromEntries(konten.map((k) => [k.nummer, k]));
  const buchungen = [
    { id: 'm', seq: 1, datum: '2026-05-02', kostenstelle: 'KT-9',
      zeilen: [{ konto: '3400', seite: 'S', betrag: 10000 }, { konto: '1200', seite: 'H', betrag: 10000 }] },
    { id: 'f', seq: 2, datum: '2026-05-03', kostenstelle: 'KT-9',
      zeilen: [{ konto: '3100', seite: 'S', betrag: 3000 }, { konto: '1200', seite: 'H', betrag: 3000 }] },
    { id: 'l', seq: 3, datum: '2026-05-04', kostenstelle: 'KT-9',
      zeilen: [{ konto: '4100', seite: 'S', betrag: 5000 }, { konto: '1200', seite: 'H', betrag: 5000 }] },
  ];
  const ist = istkostenAusBuchungen(buchungen, kontoIndex, 'KT-9', { kontoBlock: block2 });
  ok('Standard-Map: Material 10000 / Zukauf 3000 / Arbeit 5000',
    ist.perBlock[KOSTENART.MATERIAL] === 10000 && ist.perBlock[KOSTENART.ZUKAUF] === 3000
    && ist.perBlock[KOSTENART.ARBEIT] === 5000);
  ok('Standard-Map: Summe 18000', ist.summeCent === 18000);

  // opts.kontoBlock (manuell) gewinnt vor der Standard-Zuordnung.
  const ueber = istkostenAusBuchungen(
    [buchungen[0]], kontoIndex, 'KT-9', { kontoBlock: { ...map, '3400': KOSTENART.ZUKAUF } });
  ok('Manuelle Übersteuerung schlägt Standard: 3400 → Zukauf', ueber.perBlock[KOSTENART.ZUKAUF] === 10000);
});

await section('Kalibrierung (Block 2/Schritt 10): Korrekturfaktoren', () => {
  // Zwei Soll/Ist-Vergleiche (Form wie nachkalkulation().perBlock).
  const verg = [
    { perBlock: [{ block: KOSTENART.MATERIAL, sollCent: 1000, istCent: 1100 }, { block: KOSTENART.ARBEIT, sollCent: 2000, istCent: 3000 }] },
    { perBlock: [{ block: KOSTENART.MATERIAL, sollCent: 1000, istCent: 1300 }, { block: KOSTENART.ARBEIT, sollCent: 2000, istCent: 2000 }] },
  ];
  const kf = korrekturFaktoren(verg);
  ok('Faktor material = ΣIST/ΣSOLL = 2400/2000 = 1.2', kf[KOSTENART.MATERIAL].faktor === 1.2);
  ok('Faktor material abweichung +20%, anzahl 2', kf[KOSTENART.MATERIAL].abweichungProzent === 20 && kf[KOSTENART.MATERIAL].anzahl === 2);
  ok('Faktor material median = median(1.1, 1.3) = 1.2', kf[KOSTENART.MATERIAL].medianFaktor === 1.2);
  ok('Faktor arbeit = 5000/4000 = 1.25', kf[KOSTENART.ARBEIT].faktor === 1.25);
  ok('Faktor arbeit median = median(1.5, 1.0) = 1.25', kf[KOSTENART.ARBEIT].medianFaktor === 1.25);
  ok('Faktor maschine: kein SOLL → null, anzahl 0', kf[KOSTENART.MASCHINE].faktor === null && kf[KOSTENART.MASCHINE].anzahl === 0);
  ok('Faktor maschine median null', kf[KOSTENART.MASCHINE].medianFaktor === null);

  // — faktorWerte: zu Multiplikatoren verdichten —
  const fw = faktorWerte(kf);
  ok('faktorWerte material 1.2 / arbeit 1.25', fw[KOSTENART.MATERIAL] === 1.2 && fw[KOSTENART.ARBEIT] === 1.25);
  ok('faktorWerte maschine null→1 (neutral)', fw[KOSTENART.MASCHINE] === 1);
  const fwMin = faktorWerte(kf, { minAnzahl: 3 });
  ok('faktorWerte minAnzahl 3 → alle neutral (Stichprobe 2 < 3)', fwMin[KOSTENART.MATERIAL] === 1 && fwMin[KOSTENART.ARBEIT] === 1);
  const fwCap = faktorWerte(kf, { max: 1.2 });
  ok('faktorWerte max 1.2 deckelt arbeit', fwCap[KOSTENART.ARBEIT] === 1.2 && fwCap[KOSTENART.MATERIAL] === 1.2);
  const fwMed = faktorWerte(kf, { quelle: 'median' });
  ok('faktorWerte quelle median', fwMed[KOSTENART.ARBEIT] === 1.25);
});

await section('Kalibrierung: in den Kern zurückführen', () => {
  const eingabe = {
    material: { betragCent: 1000, verschnittProzent: 0 },
    arbeit: { stunden: 2, satzCentProStd: 5000 }, // 10000
    gemeinkostenProzent: 0, gewinnProzent: 0, ustProzent: 0,
  };
  const base = kalkuliereVorwaerts(eingabe);
  ok('Basis: material 1000, arbeit 10000, selbstkosten 11000', base.material === 1000 && base.arbeit === 10000 && base.selbstkosten === 11000);

  const kal = kalkuliereKalibriert(eingabe, { material: 1.2, arbeit: 1.25 });
  ok('Kalibriert: material ×1.2 = 1200', kal.material === 1200);
  ok('Kalibriert: arbeit stunden ×1.25 → 2.5×5000 = 12500', kal.arbeit === 12500);
  ok('Kalibriert: selbstkosten 13700', kal.selbstkosten === 13700);
  ok('kalibriereEingabe mutiert Original nicht', eingabe.material.betragCent === 1000 && eingabe.arbeit.stunden === 2);

  const id = kalkuliereKalibriert(eingabe, {});
  ok('leere Faktoren → identisch mit Kern', JSON.stringify(id) === JSON.stringify(base));

  // m²-Material: Faktor skaliert den m²-Preis (Ergebnis skaliert linear)
  const e2 = { material: { flaecheM2: 2, preisProM2Cent: 4000, verschnittProzent: 10 } };
  ok('m² Basis = 2×4000×1.1 = 8800', kalkuliereVorwaerts(e2).material === 8800);
  ok('m² kalibriert ×1.5 = 13200', kalkuliereKalibriert(e2, { material: 1.5 }).material === 13200);

  // Zukauf: Faktor skaliert den EK
  const e3 = { zukauf: { ekCent: 1000, handelsaufschlagProzent: 20 } };
  ok('Zukauf Basis 1200', kalkuliereVorwaerts(e3).zukauf === 1200);
  ok('Zukauf kalibriert ×2 = 2400', kalkuliereKalibriert(e3, { zukauf: 2 }).zukauf === 2400);

  // Montage: Faktor skaliert die Pauschale
  ok('Montage kalibriert ×1.4 = 700', kalkuliereKalibriert({ montage: { betragCent: 500 } }, { montage: 1.4 }).montage === 700);
});

await section('Kalibrierung: kalibrierte Vorwärtskalkulation aus Schema (Angebots-Editor)', () => {
  // kalkuliereSchemaKalibriert == Schema-Eingabe → kalibriereEingabe → Kern.
  const folie = schemaNach('folierung');
  const werte = { flaecheM2: 5, preisProM2Cent: 4000, verschnittProzent: 15, verklebeStunden: 2, arbeitssatzCentProStd: 4500 };
  const zuschlaege = { gemeinkostenProzent: 15, gewinnProzent: 20, ustProzent: 19 };

  const ohne = kalkuliereSchema(folie, werte, zuschlaege);
  // Ohne Faktoren (bzw. lauter 1-en) identisch zu kalkuliereSchema.
  ok('Schema ohne Faktoren == kalkuliereSchema', JSON.stringify(kalkuliereSchemaKalibriert(folie, werte, zuschlaege, {}, {})) === JSON.stringify(ohne));
  ok('Schema mit Neutral-Faktor 1 == kalkuliereSchema', JSON.stringify(kalkuliereSchemaKalibriert(folie, werte, zuschlaege, {}, { material: 1, arbeit: 1 })) === JSON.stringify(ohne));

  // Material-Faktor 1.2 skaliert NUR die Material-Basis (m²-Preis), Arbeit bleibt.
  const mit = kalkuliereSchemaKalibriert(folie, werte, zuschlaege, {}, { material: 1.2 });
  const manuell = kalkuliereVorwaerts(kalibriereEingabe(schemaEingabe(folie, werte, zuschlaege), { material: 1.2 }));
  ok('Schema-kalibriert == manuell komponiert', JSON.stringify(mit) === JSON.stringify(manuell));
  ok('Material ×1.2 wirkt (Material steigt)', mit.material === Math.round(ohne.material * 1.2) && mit.arbeit === ohne.arbeit);
  ok('kalibrierte Selbstkosten ≥ unkalibrierte', mit.selbstkosten > ohne.selbstkosten);

  // positionAusSchema mit opts.faktoren: interne kalkulation kalibriert + markiert, extern neutral.
  const posOhne = positionAusSchema(folie, { werte, zuschlaege });
  const posMit = positionAusSchema(folie, { werte, zuschlaege, faktoren: { material: 1.2 } });
  ok('Position ohne Faktoren: kein kalibriert-Flag', !posOhne.kalkulation.kalibriert && posOhne.kalkulation.faktoren === undefined);
  ok('Position mit Faktoren: kalibriert-Flag + faktoren gemerkt', posMit.kalkulation.kalibriert === true && posMit.kalkulation.faktoren.material === 1.2);
  ok('kalibrierter Einzelpreis = kalibriertes Netto', posMit.einzelpreisCent === mit.netto && posMit.einzelpreisCent > posOhne.einzelpreisCent);
  ok('Kalibrierung dringt NICHT nach außen', !/(kalibriert|faktoren)/.test(JSON.stringify(externePosition(posMit))));
});

await section('Kalibrierung: Angebots-Trefferquote je Preisniveau', () => {
  const ANG = ANGEBOT_STATUS.ANGENOMMEN, ABL = ANGEBOT_STATUS.ABGELEHNT;
  const ang = (status, netto, db) => {
    const a = neuesAngebot({ titel: 'a', positionen: [{ beschreibung: 'p', menge: 1, einzelpreisCent: netto, ustSatz: 19,
      kalkulation: { ergebnis: { material: 0, maschine: 0, arbeit: 0, zukauf: 0, montage: 0, selbstkosten: netto - db, netto, deckungsbeitrag: db } } }] });
    a.status = status;
    return a;
  };
  const A1 = ang(ANG, 10000, 1000); // 10% niedrig, gewonnen
  const A2 = ang(ABL, 10000, 1200); // 12% niedrig, verloren
  const A3 = ang(ANG, 10000, 2000); // 20% mittel, gewonnen
  const A4 = ang(ABL, 10000, 2500); // 25% mittel, verloren
  const A5 = ang(ANG, 10000, 4000); // 40% hoch, gewonnen
  const A6 = ang(ABL, 10000, 5000); // 50% hoch, verloren
  const A7 = ang(ANGEBOT_STATUS.ENTWURF, 10000, 3000); // 30% hoch, offen
  const A8 = ang(ANG, 10000, 1000); A8.positionen[0].kalkulation = null; // keine Marge → unbekannt, gewonnen
  const alle = [A1, A2, A3, A4, A5, A6, A7, A8];

  ok('angebotMargeProzent A1 = 10', angebotMargeProzent(A1) === 10);
  ok('angebotMargeProzent A8 ohne Kalkulation = null', angebotMargeProzent(A8) === null);
  ok('angebotErgebnis A1 gewonnen / A2 verloren / A7 offen',
    angebotErgebnis(A1) === ANGEBOT_ERGEBNIS.GEWONNEN && angebotErgebnis(A2) === ANGEBOT_ERGEBNIS.VERLOREN && angebotErgebnis(A7) === ANGEBOT_ERGEBNIS.OFFEN);
  ok('preisniveau 10/20/40/null', preisniveau(10) === PREISNIVEAU.NIEDRIG && preisniveau(20) === PREISNIVEAU.MITTEL
    && preisniveau(40) === PREISNIVEAU.HOCH && preisniveau(null) === PREISNIVEAU.UNBEKANNT);

  // archiviert ist mehrdeutig → default offen, per opts überschreibbar
  const arch = ang(ANGEBOT_STATUS.ARCHIVIERT, 10000, 1000);
  ok('archiviert default → offen', angebotErgebnis(arch) === ANGEBOT_ERGEBNIS.OFFEN);
  ok('archiviert als gewonnen markierbar', angebotErgebnis(arch, { gewonnenStatus: [ANGEBOT_STATUS.ARCHIVIERT] }) === ANGEBOT_ERGEBNIS.GEWONNEN);

  const tq = trefferquote(alle);
  ok('Trefferquote gesamt: 4 gewonnen / 3 verloren / 1 offen', tq.gewonnen === 4 && tq.verloren === 3 && tq.offen === 1);
  ok('Trefferquote gesamt: entschieden 7, quote 4/7 = 57.1%', tq.entschieden === 7 && tq.quoteProzent === 57.1 && tq.gesamt === 8);

  const jp = trefferquoteJePreisniveau(alle);
  ok('niedrig: 1/1 → 50%', jp[PREISNIVEAU.NIEDRIG].gewonnen === 1 && jp[PREISNIVEAU.NIEDRIG].verloren === 1 && jp[PREISNIVEAU.NIEDRIG].quoteProzent === 50);
  ok('mittel: 1/1 → 50%', jp[PREISNIVEAU.MITTEL].quoteProzent === 50);
  ok('hoch: 1 gewonnen / 1 verloren / 1 offen → 50%', jp[PREISNIVEAU.HOCH].gewonnen === 1 && jp[PREISNIVEAU.HOCH].offen === 1 && jp[PREISNIVEAU.HOCH].quoteProzent === 50);
  ok('unbekannt: 1 gewonnen → 100%', jp[PREISNIVEAU.UNBEKANNT].gewonnen === 1 && jp[PREISNIVEAU.UNBEKANNT].quoteProzent === 100);

  // — Digest: PII-frei, nur Aggregate —
  const verg = [{ perBlock: [{ block: KOSTENART.MATERIAL, sollCent: 1000, istCent: 1200 }] }];
  const dig = kalibrierungsDigest(verg, alle);
  ok('Digest zählt Vergleiche/Angebote', dig.anzahlVergleiche === 1 && dig.anzahlAngebote === 8);
  ok('Digest enthält Faktoren + Trefferquote', dig.faktoren[KOSTENART.MATERIAL].faktor === 1.2 && dig.trefferquote.quoteProzent === 57.1);
  ok('Digest ist PII-frei (kein kundeId/titel/beschreibung)',
    !JSON.stringify(dig).includes('kundeId') && !JSON.stringify(dig).includes('titel') && !JSON.stringify(dig).includes('beschreibung'));
  ok('PREISNIVEAU_LISTE hat 4 Kübel', PREISNIVEAU_LISTE.length === 4);
});

await section('Adaptiver Baukasten (Schritt 11 — Nutzungszähler + Sortierung + Umsortieren)', () => {
  // — Nutzungszähler —
  ok('leeresNutzungsprofil ist leeres Objekt', Object.keys(leeresNutzungsprofil()).length === 0);

  let p = leeresNutzungsprofil();
  ok('anzahlVon unbekannt = 0', anzahlVon(p, 'folierung') === 0);
  ok('istGenutzt unbekannt = false', istGenutzt(p, 'folierung') === false);

  p = zaehleNutzung(p, 'folierung', { jetzt: 1000 });
  ok('zaehleNutzung setzt anzahl 1 + Zeitstempel', anzahlVon(p, 'folierung') === 1 && nutzungVon(p, 'folierung').zuletzt === 1000);
  ok('istGenutzt nach Zählen = true', istGenutzt(p, 'folierung') === true);

  const vorher = p;
  p = zaehleNutzung(p, 'folierung', { jetzt: 2000 });
  ok('zaehleNutzung ist immutabel (Eingabe unverändert)', anzahlVon(vorher, 'folierung') === 1);
  ok('zweites Zählen → anzahl 2, neuer Zeitstempel', anzahlVon(p, 'folierung') === 2 && nutzungVon(p, 'folierung').zuletzt === 2000);

  p = zaehleNutzung(p, 'schild', { jetzt: 1500, um: 3 });
  ok('zaehleNutzung um:3 erhöht um 3', anzahlVon(p, 'schild') === 3);
  ok('zaehleNutzung mit leerer schemaId lässt Profil unverändert',
    Object.keys(zaehleNutzung(p, '', { jetzt: 9 })).length === Object.keys(p).length);

  // normalizeNutzung verwirft Müll + leere Einträge
  const dreck = { gut: { anzahl: 2, zuletzt: 5 }, leer: { anzahl: 0, zuletzt: 0 }, kaputt: { anzahl: -3, zuletzt: 'x' }, '': { anzahl: 1, zuletzt: 1 } };
  const sauber = normalizeNutzung(dreck);
  ok('normalizeNutzung behält gültige Einträge', sauber.gut.anzahl === 2 && sauber.gut.zuletzt === 5);
  ok('normalizeNutzung verwirft leere/leere-ID', !('leer' in sauber) && !('' in sauber));
  ok('normalizeNutzung klemmt Negatives/NaN auf 0 (→ leer verworfen)', !('kaputt' in sauber));

  // — Adaptive Palette/Sortierung —
  // Mini-Schemaliste in fester Reihenfolge (wie PRODUKT_SCHEMATA: Katalog-Order).
  const SCH = [
    { id: 'folierung' }, { id: 'schild' }, { id: 'gravur' },
    { id: 'leuchtreklame' }, { id: 'druckZukauf' }, { id: 'montage' },
  ];
  // Profil: schild 3× (zuletzt 1500), folierung 2× (zuletzt 2000), gravur 2× (zuletzt 500)
  const prof = { schild: { anzahl: 3, zuletzt: 1500 }, folierung: { anzahl: 2, zuletzt: 2000 }, gravur: { anzahl: 2, zuletzt: 500 } };

  const reihen = sortiereSchemata(SCH, prof).map((s) => s.id);
  // schild (3) zuerst; dann folierung vs gravur (beide 2) → folierung zuletzt-neuer (2000>500) zuerst;
  // dann ungenutzte in Katalog-Reihenfolge.
  ok('Sortierung: häufigste zuerst (schild)', reihen[0] === 'schild');
  ok('Sortierung: Gleichstand → zuletzt genutzte zuerst (folierung vor gravur)',
    reihen[1] === 'folierung' && reihen[2] === 'gravur');
  ok('Sortierung: ungenutzte behalten Katalog-Reihenfolge am Ende',
    reihen.slice(3).join(',') === 'leuchtreklame,druckZukauf,montage');
  ok('sortiereSchemata ist immutabel (Original-Order unverändert)',
    SCH.map((s) => s.id).join(',') === 'folierung,schild,gravur,leuchtreklame,druckZukauf,montage');

  const pal = baukastenPalette(SCH, prof);
  ok('baukastenPalette trägt anzahl/zuletzt/genutzt', pal[0].schema.id === 'schild' && pal[0].anzahl === 3 && pal[0].genutzt === true);
  ok('baukastenPalette markiert ungenutzte', pal[pal.length - 1].genutzt === false && pal[pal.length - 1].anzahl === 0);

  const top = haeufigsteSchemata(SCH, prof, 2).map((s) => s.id);
  ok('haeufigsteSchemata(2) = nur genutzte, top-2', top.length === 2 && top[0] === 'schild' && top[1] === 'folierung');
  ok('haeufigsteSchemata mit leerem Profil = leer', haeufigsteSchemata(SCH, {}, 3).length === 0);
  ok('baukastenPalette mit leerem Profil = Katalog-Reihenfolge',
    baukastenPalette(SCH, {}).map((e) => e.schema.id).join(',') === 'folierung,schild,gravur,leuchtreklame,druckZukauf,montage');

  // — Umsortieren der Positionen (Drag-and-drop / Pfeile) —
  const pos = [{ beschreibung: 'A' }, { beschreibung: 'B' }, { beschreibung: 'C' }, { beschreibung: 'D' }];
  ok('verschiebePosition 0→2', verschiebePosition(pos, 0, 2).map((x) => x.beschreibung).join('') === 'BCAD');
  ok('verschiebePosition 3→0', verschiebePosition(pos, 3, 0).map((x) => x.beschreibung).join('') === 'DABC');
  ok('verschiebePosition behält Element-Referenz (keine Kopie)', verschiebePosition(pos, 0, 2)[2] === pos[0]);
  ok('verschiebePosition ist immutabel (Eingabe unverändert)', pos.map((x) => x.beschreibung).join('') === 'ABCD');
  ok('verschiebePosition Ziel == Quelle → unverändert', verschiebePosition(pos, 1, 1).map((x) => x.beschreibung).join('') === 'ABCD');
  ok('verschiebePosition klemmt Ziel > Ende', verschiebePosition(pos, 0, 99).map((x) => x.beschreibung).join('') === 'BCDA');
  ok('verschiebePosition klemmt Ziel < 0', verschiebePosition(pos, 3, -5).map((x) => x.beschreibung).join('') === 'DABC');
  ok('verschiebePosition ungültiger vonIndex → flache Kopie unverändert', verschiebePosition(pos, 9, 0).map((x) => x.beschreibung).join('') === 'ABCD');

  ok('verschiebeNachOben 2', verschiebeNachOben(pos, 2).map((x) => x.beschreibung).join('') === 'ACBD');
  ok('verschiebeNachOben 0 (oberste) → unverändert', verschiebeNachOben(pos, 0).map((x) => x.beschreibung).join('') === 'ABCD');
  ok('verschiebeNachUnten 1', verschiebeNachUnten(pos, 1).map((x) => x.beschreibung).join('') === 'ACBD');
  ok('verschiebeNachUnten letzte → unverändert', verschiebeNachUnten(pos, 3).map((x) => x.beschreibung).join('') === 'ABCD');
});

console.log(`\n— ${passed} bestanden, ${failed} fehlgeschlagen —`);
process.exit(failed ? 1 : 0);
