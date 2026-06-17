# NACHFOLGE_PLAN.md — Geordneter Mehr-Sitzungs-Plan (eine PR pro Sitzung)

> **Brief an die nachfolgenden Sitzungen.** Jede Sitzung erledigt **genau einen** Schritt unten
> als **eine** PR, sauber und fehlerfrei, und endet mit einem **Abschlussbrief** (siehe Ritual),
> damit die nächste Sitzung **konfliktfrei** startet. Ergänzt `docs/PULS.md` (START HIER) und
> `docs/OFFENE_PUNKTE.md`. Stand: 2026-06-17. Tests-Basis: **885/885 grün**, SW `v91`.
> Nächster Schritt: **R5c** (dreistufiger Briefkasten, P7) oder **R6**/Sichttest nach Bedarf. A+B fertig; R1–R4 ✅; **R5a ✅ (Bankformate härten: CAMT .052/.054 + Saldo-Prüfung + strukturierte RmtInf); R5b ✅ (NER: PII Dritter über die Anker hinaus maskieren)**. Tests **916/916**, SW `v92`.

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
- [~] **R5** Bankformate härten + NER + dreistufiger Briefkasten — **in Teil-PRs:**
  - [x] **R5a — Bankformate härten.** ✅ `domain/bankimport.js`: CAMT-Container **.052 (`<Rpt>`)** und
    **.054 (`<Ntfctn>`)** zusätzlich zu .053 (`<Stmt>`); **Saldo-Parsing** (MT940 `:60F/M:`/`:62F/M:`, CAMT
    `<Bal>` OPBD/PRCD ↔ CLBD/CLAV, signiert via C/D bzw. CdtDbtInd) → `parseMT940`/`parseCAMT` liefern
    `saldoStartCent`/`saldoEndeCent`; **`pruefeBankauszug(parsed)`** rechnet (Anfang ± Umsätze) gegen den
    Schlusssaldo und meldet `saldo-differenz`/`unvollstaendige-umsaetze`/`format-unbekannt`/`keine-umsaetze`;
    **strukturierte RmtInf** (CAMT `CdtrRefInf`/`EndToEndId` → `umsatz.ref` + in den Zweck, hilft dem
    Zahlungsabgleich auf die Rechnungsnummer). UI: Bankimport zeigt Prüf-Hinweise; i18n de+en. **Grenze:**
    Plausibilitäts-/Integritätsprüfung, **KEINE** SWIFT-/ISO-20022-Schema-Validierung. (PR R5a.)
  - [x] **R5b — NER (PII über die Anker hinaus).** ✅ `ai/ner.js` (rein, node-getestet): `erkennePII(text)`
    erkennt **konservativ** E-Mail/IBAN (kompakt+gruppiert)/USt-IdNr (DE/AT)/Steuernr (FF/BBB/UUUU)/Telefon
    (intl + national mit Trenner, **ohne Punkt** → keine Datums-/Betrags-Falschtreffer), löst Überlappungen
    Longest-Match auf; **kein BIC** (kollidiert mit Großwörtern wie „RECHNUNG"). `piiAnker`/`kombiniereAnker`
    ergänzen die Stammdaten-Anker um im Text gefundene PII **Dritter** (exakte Anker behalten Typ-Vorrang) →
    fließen vor dem KI-Versand in `pseudonym.tokenize`. Gated über Setting `nerPii` (Default an, nur im
    Pseudonym-Modus sichtbar); `anker.ladeAnker(text)` + Call-Sites (journal/documents) reichen den Text durch.
    i18n de+en (inkl. `pseudonym.typ.TELEFON`). UI/Glue statisch geprüft. (PR R5b.)
  - [ ] **R5c — Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person, P7) für Pseudonymisierung/CRM — offen.
- [ ] **R6 [KANN]** ZUGFeRD-**Erzeugen** (nur falls build-frei lösbar), Lighthouse, lokales OCR, Privat-/Bürger-Modus, Sage 5b–d.

---

## Bereits erledigt (zur Orientierung, NICHT erneut bauen)
Profi-Readiness **V1–V10** · **A1–A3** · Entscheidungen 2026-06-17 (ELSTER-Link, AVV-Links, §19-Onboarding,
abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung, ZUGFeRD-Empfang+KoSIT, A4 offene Anbindung Stufe 1).
Details: `docs/OFFENE_PUNKTE.md` + `docs/SESSIONS.md`.
