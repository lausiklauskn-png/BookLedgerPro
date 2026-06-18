# NACHFOLGE_PLAN.md — Geordneter Mehr-Sitzungs-Plan (eine PR pro Sitzung)

> **Brief an die nachfolgenden Sitzungen.** Jede Sitzung erledigt **genau einen** Schritt unten
> als **eine** PR, sauber und fehlerfrei, und endet mit einem **Abschlussbrief** (siehe Ritual),
> damit die nächste Sitzung **konfliktfrei** startet. Ergänzt `docs/PULS.md` (START HIER) und
> `docs/OFFENE_PUNKTE.md`. Stand: 2026-06-18. Tests-Basis: **1158/1158 grün**, SW `v107`.
> **Aktiver Plan jetzt: `docs/BAUPLAN.md`** (Block 1 Vertrauen/Sicherheit). Schritt 1
> **Roundtrip-Selbsttest ✅ (PR #116)** · Schritt 2 **Test-Modus komplett**: 2a Sandbox-Kern ✅ (PR #118),
> 2b Store-Glue ✅ (PR #120), 2c UI ✅ (PR #122) — `docs/TEST_MODUS.md` · **Schritt 3 Datensicherungs-UX +
> `backupStrategie` ✅ (PR #124)** — `docs/DATENSICHERUNG.md`. **→ Block 1 abgeschlossen.** **Block 2/Schritt 4: Setting
> `rechnungsstelle` ✅ (PR #126)** — `domain/rechnungsstelle.js` (blp|extern, Default blp; Onboarding + Einstellungen;
> `docs/KALKULATION_KATALOG.md` §7a). **Nächster Schritt: Block 2/Schritt 5 — Kalkulations-Kern (rein)** (`docs/KALKULATION_KATALOG.md`
> §2/§9); optional kleiner 2c-Folgeschritt Demo-Vorbefüllung (`domain/demodaten.js`).
> Nächster Schritt: **mit dem Nutzer abstimmen** (AskUserQuestion) — der **build-freie Rest-Korb ist leer**
> (R4-Rest ✅, **R5a-Rest SWIFT/ISO-20022-Schema-Validierung ✅**). Verbleibend nur noch **umgebungs-/menschen-
> blockierte** [KANN]-Punkte (**R6/Rest**: Lighthouse/Perf → Headless-Browser; lokales OCR → Tesseract ist wasm/
> npm-Runtime, NICHT build-frei; ZUGFeRD-Erzeugen → PDF-Lib, nicht build-frei; Sage 5b–d → fremde Repos, menschlich
> vermittelt) **oder Browser-Sichttest** (echter Nutzer) **oder eine neue, mit dem Nutzer vereinbarte Feature-Idee**.
> A+B fertig; R1–R5 ✅ inkl. **R5a-Rest ✅** + **R5c-Rest NER-Scoping ✅**; **R4-Rest Zahlungs-/Teilzahlungs-Übernahme ✅**
> (Austauschformat v3); **R6/P1 ✅**; **R6/P2 ✅**; **A1-Rest/„zahlbar bis"/Zahlungsziel durabel v4 ✅**; **Edit bestehender Aufträge ✅**. Tests **1080/1080**, SW `v102`.

## Sitzungs-Ritual (verbindlich, jede Sitzung)
1. `git fetch origin main && git reset --hard origin/main` (Branch `claude/v2-ox8bu7`).
2. **Genau einen** Schritt unten umsetzen — **reine Logik zuerst node-getestet**, dann UI.
   Lieber feiner schneiden als überstürzen; **keine halben/unschlüssigen Codepfade** hinterlassen.
3. `node tests/run.mjs` muss **grün** bleiben/werden. `CACHE_VERSION` in `sw.js` erhöhen, neue Module precachen.
4. **Draft-PR → ready → CI grün → squash-merge** (Freibrief), dann `git reset --hard origin/main`.
5. **Abschlussbrief:** `PULS.md` „START HIER" auf nächsten Schritt + Kopf-Status (v-Nr./Tests) aktualisieren;
   diese Datei: erledigten Schritt abhaken; `SESSIONS.md` obersten Eintrag schreiben; `OFFENE_PUNKTE.md` pflegen.
6. **Eine Sitzung = eine PR.** Danach Stopp.

> Sicherheit vor Tempo: Wenn ein Schritt größer wird als gedacht, **in Teil-PRs splitten** (z. B. M2a/M2b)
> und den Plan hier entsprechend fortschreiben — nie einen Schritt „halb" mergen.

---

## A) Mehrmandantenfähigkeit (Architektur: **mehrere getrennte Tresore**, 1 Mandant = 1 Tresor)
> Begründung: getrennte verschlüsselte Tresore statt Record-Namespacing → **keine Kreuz-Kontamination**,
> passt zum Krypto-Modell, schützt die Datendurabilität (Regel #2). **DB-Suffix `bookledgerpro` bleibt.**
> Trennung über einen **Mandanten-Präfix in den IndexedDB-Namen** bzw. eine Mandanten-Registry.

- [x] **M1 — Fundament (rein + Design).** ✅ `src/domain/mandanten.js` (rein, node-getestet, 29 Tests):
  Registry `{mandanten:[{id,name,erstellt}], aktiv}`, `aktiverMandant`, immutable Ops
  (`addMandant`/`umbenenneMandant`/`entferneMandant`/`setzeAktiv`/`findeMandant`), `validateMandantName`,
  `neueMandantId`, **Speicher-Namensbildung** `dbNameFuer(id)` ohne das DB-Suffix `bookledgerpro` zu
  ändern, sowie `mitLegacyMandant` (migrationsfreier Seed). **Keine** Tresor-Umverdrahtung. (PR M1.)
- [x] **M2a — Core-Verdrahtung (rein + glue, node-getestet).** ✅ `core/db.js`: aktive Tresor-DB
  konfigurierbar (`getActiveDbName`/`setActiveDbName`/`closeDb`, Default = Legacy, Suffix-Schutz);
  neue `core/mandantenStore.js` (unverschlüsselte Registry-DB `blpr_mandanten_bookledgerpro`:
  `ladeRegistry`/`speichereRegistry`/`initMandanten`/`registriereMandant`/`wechsleAktivenMandant`);
  `mandanten.js` um `REGISTRY_DB_NAME` ergänzt; `main.js`-Boot ruft `initMandanten()` (registriert den
  Alt-Tresor migrationsfrei, richtet aktive DB aus — **verhaltensneutral** bei einem Mandanten). 9 neue
  Tests. (PR M2a.)
- [x] **M2b — Sperrbildschirm: Auswahl/Anlegen/Wechsel (UI, statisch geprüft).** ✅ `lock.js`: bei >1 Mandant
  Auswahlliste vor dem Entsperren (`renderMandantenAuswahl`, sortiert/aktiv markiert); „Neuer Mandant" →
  `registriereMandant` + `wechsleAktivenMandant` → Onboarding in **eigener** leerer Tresor-DB (eigenes Passwort/
  Shamir/Backup); Auswahl/Wechsel über `wechsleAktivenMandant` (DEK verwerfen + DB-Wechsel dort gekapselt).
  Bei genau 1 Mandant verhaltensneutral (direktes Entsperren) + diskreter „+ Neuer Mandant"-Link als Bootstrap
  bis zum Shell-Trigger in M3. DSGVO-Hinweis im UI: Mandanten-Namen liegen unverschlüsselt. Reine Logik
  (`brauchtMandantenAuswahl`, `mandantenAuswahlListe`) in `domain/mandanten.js`, +10 Tests. (PR M2b.)
- [x] **M3 — Shell-Indikator + Verwaltung.** ✅ `ui/shell.js`: aktiver Mandanten-**Name** im Header
  (`ladeRegistry`/`aktiverMandant`, async via `refreshMandant`; Fallback `getMandantId()`), „Mandant
  wechseln" (>1 Mandant; `lockVault`+Reboot → Auswahl). Einstellungen „Mandanten verwalten"
  (`mandantenSection`/`mandantRow`): **umbenennen** (`umbenenneMandant`+`speichereRegistry`) + **entfernen**
  (`entferneMandant`, nur mit `confirm`; Tresor-DB bleibt — kein Datenverlust; aktiver Mandant nicht
  entfernbar). i18n de+en, CSS `.mandant-admin`, SW `v83`, Doku `docs/MANDANTEN.md`. Reine Logik war
  node-getestet; Glue/UI statisch geprüft. **→ Abschnitt A abgeschlossen.** (PR M3.)

### Design-Abschnitt Mehrmandanten (entstanden in M1, verbindlich für M2/M3)
- **1 Mandant = 1 getrennter, eigenständig verschlüsselter Tresor.** Kein Record-Namespacing →
  keine Kreuz-Kontamination, jeder Tresor hat eigenen DEK/Passwort/Shamir/Backup.
- **Speichertrennung über DB-Namens-Präfix, Suffix bleibt:** `dbNameFuer(id)` →
  Legacy/Default = `blpr_bookledgerpro` (unverändert → **migrationsfrei**); weitere Mandanten =
  `blpr_<id>_bookledgerpro`. Jeder Name endet auf `bookledgerpro` (Regel #3 → keine Origin-Kollision).
- **Legacy-Mandant:** feste ID `standard`. Der bestehende Einzel-Tresor wird in M2 als „Mandant 1"
  (ID `standard`) registriert und behält seinen DB-Namen — **ohne Migration**.
- **Registry-Speicherort (M2-Entscheidung, hier festgehalten):** Die Mandanten-Liste muss **vor** dem
  Entsperren lesbar sein (Auswahl am Sperrbildschirm) → sie liegt **unverschlüsselt** in einer eigenen
  kleinen kv-DB (Vorschlag: `blpr_mandanten_bookledgerpro`, Suffix wieder erhalten). Konsequenz: die
  **Namen** der Mandanten sind unverschlüsselt (DSGVO-Hinweis im UI; keine personenbezogenen Pflichtdaten
  im Namen erzwingen). Tresor-Inhalte bleiben pro Mandant verschlüsselt.
- **Wechsel (M2):** beim Mandantenwechsel den Sitzungs-DEK sauber verwerfen (`lockVault`), DB-Handle der
  alten DB schließen, dann Ziel-DB öffnen + entsperren. `core/db.js` braucht dafür eine konfigurierbare
  DB-Namens-Quelle (heute Konstante) — in M2 umzuverdrahten, NICHT in M1.

## B) Bilanzierung (zweite Gewinnermittlungsart neben EÜR)
> Begründung: GmbH/OHG brauchen GuV + Bilanz (§4 Abs.1/§5 EStG). Modus-Schalter, Bestandskonten-Vortrag.

- [x] **B1 — Modus + Kontengrundlage.** ✅ Setting `gewinnermittlung: 'euer'|'bilanz'` (Default `euer`,
  bestehende Nutzer unverändert) in `state.js`. **`src/domain/bilanzierung.js`** (rein, node-getestet):
  `GEWINNERMITTLUNG`/`normalizeGewinnermittlung`/`istBilanzierung` + Konten-Klassifikation
  (`istBestandskonto`/`istErfolgskonto`/`abschlussBereich`/`bilanzSeite`/`guvSeite`/`klassifiziereKonto`) als
  Grundlage für B2/B3 + `BILANZ_GRUNDKONTO_NUMMERN`. Bilanz-Grundkonten **0800/0840/0860/0970** in den
  SKR03-Seed ergänzt (Saldenvortrag/Eröffnung **9000** war vorhanden). Minimaler Modus-Schalter in den
  Einstellungen (`shell.js`), Wechsel auf Bilanz zieht Grundkonten via `ensureSeedKonten` nach. i18n de+en,
  SW `v84`, **+27 Tests (726/726)**. UI/Glue statisch geprüft. (PR #87.)
- [x] **B2 — GuV.** ✅ `src/domain/bilanz.js` (rein, node-getestet): `gewinnUndVerlust(buchungen, idx, periode)`
  → Erträge/Aufwendungen aus den Erfolgskonten je Periode (Salden über `accounts.js saldo`/`mehrungsSeite`),
  gegliedert nach `guvSeite`, **Jahresüberschuss/-fehlbetrag = Σ Erträge − Σ Aufwendungen**. `buildGuvCsv` in
  `domain/export.js`. GuV-Karte in „Auswertung" (`ui/views/reports.js`), **nur im Bilanz-Modus** sichtbar
  (B1-Schalter `gewinnermittlung` gatet die Ansicht), inkl. CSV-Export + Druck. i18n de+en, SW `v85`, **+13 Tests
  (739/739)**. UI/Glue statisch geprüft. EHRLICH: GuV im Konten-Sinn, KEINE amtliche §275-HGB-Gliederung. (PR B2.)
- [x] **B3 — Bilanz.** ✅ `src/domain/bilanz.js` (rein, node-getestet): `bilanz(buchungen, idx, stichtag, eröffnungssalden)`
  → Aktiva/Passiva aus den **Bestandskonten-Salden** zum Stichtag (`accounts.saldo`/`mehrungsSeite`, gegliedert nach
  `bilanzSeite`), der **Jahresüberschuss/-fehlbetrag** der Erfolgskonten fließt als Ergebnis ins **Eigenkapital
  (Passiva)** → **Summengleichheit Aktiva = Passiva (inkl. Ergebnis)** (`ausgeglichen`/`differenz`). Eröffnungssalden
  über gebuchten **Saldenvortrag (9000)** ODER den Parameter `eröffnungssalden`. `buildBilanzCsv` in `domain/export.js`.
  Bilanz-Karte in „Auswertung" (`ui/views/reports.js`), **nur im Bilanz-Modus** (B1-Schalter `gewinnermittlung` gatet,
  neben der GuV-Karte), inkl. CSV-Export + Druck; Stichtag = Perioden-`bis`. i18n de+en, SW `v86`, **+21 Tests
  (760/760)**. UI/Glue statisch geprüft. EHRLICH: Bilanz im Konten-Sinn, KEINE §266-HGB-Gliederung, kein
  Konzernabschluss, keine E-Bilanz-Taxonomie; Konten nach Kontoart, nicht nach Saldovorzeichen umgegliedert. (PR B3.)

## R) Rest-SOLL (nach A+B, Reihenfolge nach Bedarf)
- [x] **R1** Verzugszinsen/Mahngebühren **buchen** (A1-Rest): ✅ `domain/mahnwesen.js` (rein, node-getestet):
  `MAHN_KONTEN` (SKR03: Forderung **1400** an Zinserträge **2650** / sonstige betr. Erträge **2700**),
  `mahnbuchungZeilen` (Soll Forderung an Haben Zinsertrag+Gebührenertrag, **ohne USt** — nicht steuerbarer
  Schadensersatz §288 BGB / Abschn. 1.3 UStAE) + `mahnbuchungEntwurf` (vollständiger Buchungs-Entwurf mit
  Beschreibung/Begründung aus den `mahnschreibenDaten`). UI: Knopf **„Als Buchungsentwurf übernehmen"** im
  Mahnschreiben (`reports.js`) → `saveEntwurf` (manuell, **kein** Auto-Festschreiben, GoBD); Standardkonten via
  `ensureSeedKonten` sichergestellt. i18n de+en, SW `v87`, **+23 Tests (783/783)**. UI/Glue statisch geprüft. (PR R1.)
- [x] **R2a** Skonto-Buchung mit **USt-/Vorsteuer-Korrektur §17 UStG** (A3-Rest): ✅ `domain/skonto.js` (rein,
  node-getestet): `SKONTO_KONTEN` (SKR03: gewährte Skonti **8730/8731/8736**, erhaltene Skonti **3730/3731/3736**,
  USt-Korrektur 1776/1771, Vorsteuer-Korrektur 1576/1571), `skontoSplit` (Brutto→Netto+USt je Satz),
  `skontoBuchungZeilen`/`skontoEntwurf` — gleichen den offenen Posten **komplett** aus (Bank + Skonto-Netto +
  USt-/Vorsteuer-Korrektur = offener Brutto) und korrigieren bei Zahlung **das Entgelt nach §17 UStG**
  (Einnahme: USt mindern; Ausgabe: Vorsteuer mindern); **gemischte USt-Sätze** werden proportional je
  Brutto-Anteil aufgeteilt (über `posten.saetze`, neu angereichert in `zahlungsabgleich.offenePosten` +
  `payables.offeneVerbindlichkeiten`). UI: der Skonto-Hinweis im Bankimport (`documents.js`) wird zum Knopf
  **„Skonto buchen (§17 UStG)"** → `saveEntwurf` (manuell, **kein** Auto-Festschreiben, GoBD) + Posten
  ausgeglichen. i18n de+en, SW `v88`, **+33 Tests (816/816)**. UI/Glue statisch geprüft. (PR R2a.)
- [x] **R2b** Sammelzahlungen (eine Bankzahlung auf **mehrere** offene Rechnungen → Mehrfach-Zuordnung in der UI,
  Score-Schwelle mit expliziter Auswahl). ✅ `domain/zahlungsabgleich.js` (rein, node-getestet): `findeSammelzuordnung`
  (tiefen-/kandidatenbeschränkte **Subset-Summe** über gleichgerichtete offene Posten, Summe == Zahlung ± Toleranz,
  **≥2 Teile**, Score nach Referenz/Name im Verwendungszweck + Datumsnähe, weniger Teile bevorzugt), `verteileSammelzahlung`
  (Zahlbetrag der Reihe nach auf die **explizit gewählten** Posten verteilen → letzter teilbar, **Restbildung**; Überschuss
  bleibt `unverteiltCent`), `sammelBuchungZeilen` (**eine Zeile je Rechnung**: Einnahme Soll Bank/Haben Forderung je Posten;
  Ausgabe Soll Verbindlichkeit je Posten/Haben Bank — ausgeglichen). UI (`documents.js`): Knopf **„◫ Sammelzahlung
  (mehrere Rechnungen)"** im Bankimport → Auswahl-Panel mit Checkboxen (Vorschlag vorausgewählt, laufende Summe + Status
  passt/über/unter) → `saveEntwurf` (manuell, **kein Auto-Festschreiben**, GoBD) + Zahlung je Posten erfasst. i18n de+en,
  CSS `.sammel-*`, SW `v89`, **+22 Tests (838/838)**. UI/Glue statisch geprüft. (PR R2b.)
- [x] **R3** Verbindlichkeiten aus **Foto/PDF-Belegen** + eigene Verbindlichkeiten-Ansicht (A2-Rest); Zahlungsziel je Rechnung (A1-Rest): ✅
  `domain/payables.js` (rein, node-getestet): `extraktionZuEingangsrechnung(ex, opts)` (OCR/Extraktions-Felder → Eingangsrechnungs-Entwurf,
  Netto cent-genau aus Brutto+USt, 0-%-Fallback, fehlende Felder nicht erfunden), **Zahlungsziel je Rechnung** via Feld `zahlungszielTage`
  + `berechneFaelligAm(rechnung, defaultZielTage)` (durchgereicht in `offeneVerbindlichkeiten`/`anreichereVerbindlichkeiten`, validiert).
  UI (statisch): **neue Ansicht „Verbindlichkeiten"** (`ui/views/payables.js`, Nav nach „Belege") — Liste + manuelles Anlegen/Bearbeiten/
  Stornieren/Löschen + optional „auf Ziel" buchen; **Foto/PDF-Beleg → Verbindlichkeit** im Beleg-OCR (`documents.js`). i18n de+en,
  SW `v90`, **+25 Tests (863/863)**. UI/Glue statisch geprüft. (PR R3.)
- [x] **R4** A4 **Stufe 2**: Rechnungs-Übernahme (statt nur Auftrag). ✅ `importworkfloh.normalizeImport` nimmt je Auftrag
  einen optionalen `rechnung`-Block `{nummer,datum,leistungsdatum?}` (unvollständig → verworfen + Warnung, nichts erfunden);
  `invoicing.rechnungsUebernahmeEntwurf`/`validateRechnungsUebernahme` (rein, node-getestet) bauen den Buchungs-Entwurf
  (Forderung an Erlöse + USt) mit der **WorkFloh-Nummer/-Datum** — **keine neue BLP-Nummer**; `crm-store.importWorkFloh`
  erzeugt bei gültiger Rechnung direkt den Entwurf + setzt den Auftrag „berechnet" (Festschreiben manuell, GoBD) und meldet
  `rechnungenUebernommen`; `connect.buildAustauschPaket` → **Format v2** (abwärtskompatibel), berechnete Aufträge tragen ihre
  Rechnung reziprok mit. UI: Import-Banner zählt übernommene Rechnungen; i18n de+en, SW `v91`, **+22 Tests (885/885)**.
  UI/Glue statisch geprüft. **Bewusst offen:** API/Push (Echtzeit), Übernahme von Zahlungsstatus/Teilzahlungen. (PR #95.)
- [x] **R4-Rest** Zahlungsstatus/Teilzahlungen aus WorkFloh übernehmen (Austauschformat **v3**). ✅ Eine `rechnung` darf ein
  optionales `zahlungen[]` `{datum, betragCent|betrag, ref?}` tragen. `importworkfloh.normalizeZahlungen` (rein, node-getestet)
  normalisiert konservativ (ISO-Datum + positiver Betrag, Euro/Cent, unvollständig → verworfen + Warnung); `invoicing.zahlungs-
  UebernahmeEntwurf`/`validateZahlungsUebernahme` (rein) bauen je Zahlung einen Zahlungseingang-ENTWURF **Soll Bank 1200 / Haben
  Forderung 1400** (gleicht die Forderung der Rechnungs-Übernahme aus → Ist-EÜR); `crm-store.importWorkFloh` bucht je Zahlung den
  Entwurf + vermerkt die (Teil-)Zahlung am Auftrag (Auto-„bezahlt" bei `auftragOffen <= 0`) und meldet `zahlungenUebernommen`;
  `connect.buildAustauschPaket` → **Format v3** (abwärtskompatibel), berechnete Aufträge tragen ihre Zahlungen reziprok mit. UI:
  Import-Banner zählt übernommene Zahlungen; i18n de+en, SW `v97`, **+18 Tests (1001/1001)**. UI/Glue statisch geprüft.
  **Bewusst offen:** API/Push (Echtzeit); Überzahlung wird nicht gesondert behandelt (faithful gebucht, manuell korrigierbar). (PR R4-Rest.)
- [x] **R5** Bankformate härten + NER + dreistufiger Briefkasten — **in Teil-PRs (alle ✅):**
  - [x] **R5a — Bankformate härten.** ✅ `domain/bankimport.js`: CAMT-Container **.052 (`<Rpt>`)** und
    **.054 (`<Ntfctn>`)** zusätzlich zu .053 (`<Stmt>`); **Saldo-Parsing** (MT940 `:60F/M:`/`:62F/M:`, CAMT
    `<Bal>` OPBD/PRCD ↔ CLBD/CLAV, signiert via C/D bzw. CdtDbtInd) → `parseMT940`/`parseCAMT` liefern
    `saldoStartCent`/`saldoEndeCent`; **`pruefeBankauszug(parsed)`** rechnet (Anfang ± Umsätze) gegen den
    Schlusssaldo und meldet `saldo-differenz`/`unvollstaendige-umsaetze`/`format-unbekannt`/`keine-umsaetze`;
    **strukturierte RmtInf** (CAMT `CdtrRefInf`/`EndToEndId` → `umsatz.ref` + in den Zweck, hilft dem
    Zahlungsabgleich auf die Rechnungsnummer). UI: Bankimport zeigt Prüf-Hinweise; i18n de+en. **Grenze:**
    Plausibilitäts-/Integritätsprüfung, **KEINE** SWIFT-/ISO-20022-Schema-Validierung. (PR R5a.)
  - [x] **R5a-Rest — SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung.** ✅ Neues Modul
    `src/domain/bankschema.js` (rein, node-getestet, +28 → **1029/1029**): `validiereMT940(text)` prüft die
    **SWIFT-FIN-Feldformate** — Pflichtfelder `:20:/:25:/:28C:/:60a:/:62a:`, Feldformate (16x, 35x, `5n[/5n]`,
    Saldo `1!a6!n3!a15d`, Statement-Line `:61:` Front `6!n[4!n]2a[1!a]15d1!a3!c`), Reihenfolge der Sequenz,
    Datums-/Betrags-Plausibilität; `validiereCAMT(xml)` prüft die **ISO-20022-Nachrichten-Struktur** von
    camt.052/.053/.054 — Namespace→Variante/Version, Pflicht-Container (`BkToCstmr…`, `GrpHdr`+`MsgId`+`CreDtTm`,
    Statement+`Id`+`Acct`), je `<Ntry>`: `<Amt>` mit **Ccy-Attribut** (ISO 4217), `CdtDbtInd` ∈ {CRDT,DBIT},
    Status/Datum, .053-Salden OPBD/CLBD; `validiereBankauszug` = Format-Weiche. **Klare Verstöße = Fehler,
    dialekt-strittige Punkte = Warnungen** (konservativ, nicht-blockierend). UI: Bankimport (`documents.js`)
    zeigt den Schema-Hinweis (`bankSchemaHinweis`, grün/gelb/rot) vor der Saldo-Plausibilität; i18n de+en, SW
    `v98`, Modul precached. UI/Glue statisch geprüft. **EHRLICHE GRENZE:** Struktur-/Feldformat-Prüfung nach den
    dokumentierten Spezifikationen — **KEINE zertifizierte XSD-Validierung** (ein echter XSD-Validator ist nicht
    build-frei) und **KEINE** SWIFT-Netzwerk-Konformitätsprüfung; es wird keine Konformität behauptet, die nicht
    belegt ist. **→ build-freier Rest-Korb damit leer.** (PR R5a-Rest.)
  - [x] **R5b — NER (PII über die Anker hinaus).** ✅ `ai/ner.js` (rein, node-getestet): `erkennePII(text)`
    erkennt **konservativ** E-Mail/IBAN (kompakt+gruppiert)/USt-IdNr (DE/AT)/Steuernr (FF/BBB/UUUU)/Telefon
    (intl + national mit Trenner, **ohne Punkt** → keine Datums-/Betrags-Falschtreffer), löst Überlappungen
    Longest-Match auf; **kein BIC** (kollidiert mit Großwörtern wie „RECHNUNG"). `piiAnker`/`kombiniereAnker`
    ergänzen die Stammdaten-Anker um im Text gefundene PII **Dritter** (exakte Anker behalten Typ-Vorrang) →
    fließen vor dem KI-Versand in `pseudonym.tokenize`. Gated über Setting `nerPii` (Default an, nur im
    Pseudonym-Modus sichtbar); `anker.ladeAnker(text)` + Call-Sites (journal/documents) reichen den Text durch.
    i18n de+en (inkl. `pseudonym.typ.TELEFON`). UI/Glue statisch geprüft. (PR R5b.)
  - [x] **R5c — Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person, P7) für Pseudonymisierung/CRM. ✅
    `ai/briefkasten.js` (rein, node-getestet): `baueBriefkasten({mandant,firma,kunden,mitarbeiter})` ordnet die
    exakten Stammdaten-Anker in die Hierarchie ein — **eigene Firma = `FIRMA_1`** (`eigen`), **Mitarbeiter** = deren
    Personen; **Firmenkunden** (`istVerbraucher !== true`) = weitere **`FIRMA_n`** mit ihren E-Mail/USt-IdNr/Adresse-
    Ankern; **Privatkunden** (`istVerbraucher === true`) = **Personen am Mandanten**. Firmen-Nummer **deterministisch
    nach Daten-Reihenfolge** (Scope stabil, unabhängig von der Text-Reihenfolge). `briefkastenAnker` plättet das in
    eine **scope-präfixierte** `{wert,typ}`-Liste → `pseudonym.tokenize` erzeugt gruppierende Token
    (`[[FIRMA_2_IBAN_1]]`, `[[FIRMA_1_PERSON_1]]`), sodass die KI Zugehörigkeiten erkennt — bei gleichem Schutz +
    verlustfreier Re-Identifizierung (kein Umbau an tokenize/reidentify nötig, nur die `typ`-Strings tragen die
    Hierarchie). `briefkastenBericht` (Zähler ohne Klartext), `tokenizeBriefkasten`. Glue: `ai/anker.js ladeAnker`
    routet bei Setting **`briefkastenScopes`** (Default aus, opt-in) über den Briefkasten und liest den aktiven
    Mandanten aus der Registry; UI-Schalter im Pseudonym-Modus (`shell.js`), i18n de+en, SW `v93`, **+26 Tests
    (942/942)**. UI/Glue statisch geprüft. **Grenze:** Person-Attribute (E-Mail/USt-IdNr) sind dem Parent-Scope
    (Firma/Mandant) zugeordnet, nicht dem einzelnen Personen-Token. (PR R5c.)
  - [x] **R5c-Rest — NER-Scoping.** ✅ Im Briefkasten-Modus (`briefkastenScopes`) tragen jetzt auch die im Belegtext
    erkannten **Fremd-PII** (NER) einen Scope — den externen Scope **`EXTERN`** (`piiAnker(text,{scope})`/
    `kombiniereAnker(…,{scope})`, `EXTERN_SCOPE` in `ai/ner.js`), sodass `tokenize()` gruppierende, sichtbar externe
    Token erzeugt (`[[EXTERN_IBAN_1]]`, `[[EXTERN_EMAIL_1]]`) statt flacher `[[IBAN_1]]`. `ai/anker.js` reicht den
    Scope **nur** im Briefkasten-Modus durch (flacher Pseudonym-Modus unverändert/abwärtskompatibel); exakte
    (gescopte) Stammdaten-Anker behalten bei gleichem Wert Typ-Vorrang. Nebenbei: Transparenz-Badge (`documents.js`)
    zeigt scope-präfixierte Typen lesbar (neuer `tOpt`-i18n-Fallback statt rohem Schlüssel). node-getestet
    (**+11 → 983/983**), SW `v96`. UI/Glue statisch geprüft. **Grenze:** EIN gemeinsamer `EXTERN`-Scope — verschiedene
    Drittparteien werden NICHT geclustert (aus flachem Belegtext nur heuristisch/FP-riskant trennbar → konservativ). (PR R5c-Rest.)
- [ ] **R6 [KANN]** ZUGFeRD-**Erzeugen** (nur falls build-frei lösbar), Lighthouse, lokales OCR, Privat-/Bürger-Modus, Sage 5b–d. **In Teil-PRs (fein geschnitten):**
  - [x] **R6/P1 — Privat-/Bürger-Modus (Grundlage + NAV-Gating).** ✅ `src/domain/nutzungsmodus.js` (rein,
    node-getestet, +30 → 972/972): Nutzungskontext **`firma|privat|verein`** (Default `firma`, Bestand
    unverändert) NEBEN dem UI-Komplexitäts-`mode` (einfach/profi/berater); `normalizeNutzungsmodus`/
    `nutzungsmodusVon` + Prädikate; **NAV-Ansichten-Gating** `zeigeAnsicht`/`sichtbareAnsichten`
    (Allowlist-Komplement, unbekannte Keys bleiben sichtbar → sicher additiv) + **fachliche Feature-Gates**
    `zeigeFeature`/`FEATURE`/`FEATURE_LISTE`. Privat blendet `anlagen/payables/orders/customers/employees/
    berichte/network` aus; Verein blendet `anlagen/payables/orders/employees` aus (mit Berichten/Mitgliedern/
    Netz). UI (statisch geprüft): `shell.js` filtert die NAV über `zeigeAnsicht` + Schalter „Nutzungskontext";
    Setting `nutzungsmodus` in `state.js`; i18n de+en; SW `v94` + Modul precached. **Grenze:** Anzeige-
    Vereinfachung (keine rechtliche Sperre), Routing bleibt intakt; Feature-Gates definiert/getestet, aber
    noch NICHT ansichtsintern konsumiert (→ P2). (PR #99.)
  - [x] **R6/P2 [KANN] — Feature-Gates ansichtsintern konsumieren.** ✅ `zeigeFeature(settings, FEATURE.*)`
    (und `zeigeAnsicht` für view-spiegelnde KPIs) jetzt in den Ansichten gelesen, die im Privat-/Verein-
    Kontext sichtbar bleiben: **journal.js** (USt-Satz + Umsatzart/Reverse-Charge + Bewirtungs-Split nur bei
    `UMSATZSTEUER`; Kostenstelle nur bei `KOSTENSTELLEN`; Submit erzwingt im Privat-Modus 0 %/Inland),
    **reports.js** (USt-Karten VA/Verprobung/Assistent, Mahnwesen, Kreditoren-OP, Kostenstellen, DATEV-/
    USt-VA-Export je Modus ausgeblendet), **documents.js** (Kreditoren-OP aus E-Rechnung/OCR nur bei
    `VERBINDLICHKEITEN`), **dashboard.js** (USt-Zahllast-KPI nur bei USt; Kunden-/Aufträge-KPI nur, wenn die
    Ansicht im Modus sichtbar ist). Reine Politik unverändert (bereits node-getestet, 972/972 grün);
    UI/Glue statisch geprüft. SW `v95`. **Grenze:** Anzeige-Vereinfachung, keine rechtliche Sperre;
    `el()` filtert nur `null`-Kinder → durchgehend Ternär-Form (`? card : null`). (PR R6/P2.)
  - [ ] **R6/Rest [KANN]** Lighthouse/Perf (braucht Headless-Browser), lokales OCR (nur build-frei-sauber),
    ZUGFeRD-Erzeugen (PDF-Lib → nicht build-frei), Sage 5b–d (fremde Repos, menschlich vermittelt).
- [x] **A1-Rest — Zahlungsziel je Forderung** (mit dem Nutzer abgestimmt, da build-freier Rest-Korb leer). ✅
  Symmetrie zu R3/payables: bisher trugen nur Eingangsrechnungen ein **rechnungseigenes** `zahlungszielTage`,
  Forderungen leiteten die Fälligkeit nur aus dem **globalen** Setting ab → bei kundenindividuellen Zielen falsch.
  Neuer reiner Helfer **`mahnwesen.faelligAmVon(posten, defaultZielTage=14)`** (explizites `faelligAm` → Rechnungs-
  datum + posten-eigenes `zahlungszielTage` → Default), genutzt von `anreicherePosten`/`mahnschreibenDaten`;
  `payables.berechneFaelligAm` **delegiert** an ihn (Duplikat weg, Verhalten identisch). `zahlungsabgleich.offenePosten`
  reicht `faelligAm`/`zahlungszielTage` des Auftrags durch; `orders.validateAuftrag` prüft das optionale Ziel
  (ganzzahlig ≥ 0). UI: Feld **„Zahlungsziel (Tage)"** im Auftragsformular (`ui/views/orders.js`), i18n de+en.
  SW `v99`, **+16 Tests (1045/1045)**. UI/Glue statisch geprüft. **Grenze:** kein Edit bestehender Aufträge, kein
  Ziel auf dem gedruckten §14-Dokument, WorkFloh-`rechnung`-Block überträgt (noch) kein Ziel. (PR A1-Rest.)
- [x] **„zahlbar bis" auf der §14-Rechnung** (mit dem Nutzer abgestimmt, build-freier Rest-Korb leer). ✅
  Folgeschritt zu A1-Rest: das auftragseigene `zahlungszielTage` erscheint jetzt als **Fälligkeitsdatum** auf dem
  gedruckten Rechnungsdokument. `rechnung.baueRechnung` bekam Parameter **`defaultZielTage`** + Feld **`zahlbarBis`**
  (= `mahnwesen.faelligAmVon({datum, zahlungszielTage}, defaultZielTage)`; auftragseigenes Ziel vor globalem Default;
  ohne Rechnungsdatum leer → Entwurf ohne Fälligkeit) + mitgeführtes `zahlungszielTage`; `pflichtangaben`
  **unverändert** (Fälligkeit ist KEINE §14-Pflichtangabe). UI (`ui/views/orders.js`): `rechnungAnzeigen` reicht
  `defaultZielTage: s.zahlungszielTage` durch, die Rechnungs-Kopfzeile zeigt **„zahlbar bis JJJJ-MM-TT"** neben
  Datum/Leistungsdatum (nur wenn vorhanden). i18n `orders.payableUntil` de+en. SW `v100`, **+6 Tests (1051/1051)**.
  UI/Glue statisch geprüft. **Grenze:** kein Edit bestehender Aufträge; WorkFloh-`rechnung`-Block überträgt weiter
  kein Ziel; Eingangsrechnungs-Verzug der Gegenseite weiter offen. (PR „zahlbar bis".)
- [x] **Zahlungsziel je Auftrag durabel + im Austauschformat (v4)** (mit dem Nutzer abgestimmt, „nach deiner
  Empfehlung"; build-freier Rest-Korb leer). ✅ Zwei eng gekoppelte Teile in EINEM PR:
  **(1) Bugfix Persistenz:** `crm-store.saveAuftrag` hat das A1-Rest-Feld `zahlungszielTage` aus der Whitelist
  **fallen gelassen** → Fälligkeit/„zahlbar bis"/Mahnwesen fielen nach dem Speichern **immer** auf den globalen
  Default zurück. `saveAuftrag` persistiert es jetzt (ganze Tage ≥ 0 / null). **(2) Übertragung (v4):**
  `connect.buildAustauschPaket` trägt `rechnung.zahlungszielTage` reziprok mit (nur eigenes Ziel; null → Feld weg);
  `importworkfloh.normalizeRechnung` übernimmt es konservativ (Integer ≥ 0, sonst verworfen + Warnung);
  `crm-store.importWorkFloh` setzt es beim Import auf den Auftrag → die Gegenstelle erbt dieselbe Fälligkeit.
  `AUSTAUSCH_VERSION` 3→**4** (abwärtskompatibel). +8 Tests (**1059/1059**), SW `v101`. Docs CONNECT.md/
  WORKFLOH_IMPORT.md auf v4. **Grenze:** `saveAuftrag`-Persistenz ist IndexedDB → **statisch geprüft** (kein
  Headless-Browser); reine Logik (Export/Normalisierung) node-getestet. Edit bestehender Aufträge + Eingangs-
  rechnungs-Verzug der Gegenseite weiter offen. (PR „Zahlungsziel durabel + v4".)
- [x] **Edit bestehender Aufträge** (mit dem Nutzer abgestimmt „keine Präferenz" → empfohlene Folge-Idee). ✅
  Ein noch **nicht berechneter** Auftrag ist nachträglich editierbar (Titel/Kunde/Kostenstelle/Zahlungsziel/
  Positionen). Reine Logik (`orders.js`): **`darfAuftragBearbeiten`** (GoBD-Guard — gesperrt sobald
  `rechnungBuchungId`/`rechnungNummer` gesetzt oder (Teil-)Zahlung erfasst bzw. Status berechnet/bezahlt) +
  **`anwendeAuftragEdit`** (übernimmt nur `AUFTRAG_EDIT_FELDER`, lässt Status/Zahlungen/Mahnungen/Rechnungsbezug/
  createdAt/id unverändert; per-Feld `hasOwnProperty`). Store: **`crm-store.updateAuftrag`** (Guard + Validierung
  + `encPut`). UI (`ui/views/orders.js`, statisch geprüft): „Bearbeiten"-Knopf nur wenn editierbar →
  prefill-fähiges Formular (`_editAuftrag`, `positionsRow(init)`, „Speichern"/„Abbrechen"). i18n `orders.edit`
  de+en. SW `v102`, **+21 Tests (1080/1080)**. **Grenze:** berechnete/bezahlte Aufträge bewusst nicht editierbar
  (Storno-Pfad); UI/IndexedDB statisch geprüft. (PR „Edit Aufträge".)

---

## Bereits erledigt (zur Orientierung, NICHT erneut bauen)
Profi-Readiness **V1–V10** · **A1–A3** · Entscheidungen 2026-06-17 (ELSTER-Link, AVV-Links, §19-Onboarding,
abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung, ZUGFeRD-Empfang+KoSIT, A4 offene Anbindung Stufe 1).
Details: `docs/OFFENE_PUNKTE.md` + `docs/SESSIONS.md`.
