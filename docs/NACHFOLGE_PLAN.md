# NACHFOLGE_PLAN.md — Geordneter Mehr-Sitzungs-Plan (eine PR pro Sitzung)

> **Brief an die nachfolgenden Sitzungen.** Jede Sitzung erledigt **genau einen** Schritt unten
> als **eine** PR, sauber und fehlerfrei, und endet mit einem **Abschlussbrief** (siehe Ritual),
> damit die nächste Sitzung **konfliktfrei** startet. Ergänzt `docs/PULS.md` (START HIER) und
> `docs/OFFENE_PUNKTE.md`. Stand: 2026-06-17. Tests-Basis: **760/760 grün**, SW `v86`.
> Nächster Schritt: **R1 — Verzugszinsen/Mahngebühren buchen** (A abgeschlossen, B1/B2/B3 ✅ → Abschnitt B fertig).

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
- [ ] **R1** Verzugszinsen/Mahngebühren **buchen** (A1-Rest): Konto-Mapping + USt-Behandlung (manuell, kein Auto-Buchen).
- [ ] **R2** Skonto-Buchung mit **USt-/Vorsteuer-Korrektur §17 UStG** (A3-Rest); Sammelzahlungen (eine Zahlung, mehrere Rechnungen).
- [ ] **R3** Verbindlichkeiten aus **Foto/PDF-Belegen** + eigene Verbindlichkeiten-Ansicht (A2-Rest); Zahlungsziel je Rechnung (A1-Rest).
- [ ] **R4** A4 **Stufe 2**: Rechnungs-Übernahme (statt nur Auftrag) + optional API/Push; reziproke WorkFloh-Verlinkung schärfen.
- [ ] **R5** Bankformate härten (CAMT .052/.054, SWIFT-Validierung), NER (PII über Anker hinaus), dreistufiger Briefkasten (P7).
- [ ] **R6 [KANN]** ZUGFeRD-**Erzeugen** (nur falls build-frei lösbar), Lighthouse, lokales OCR, Privat-/Bürger-Modus, Sage 5b–d.

---

## Bereits erledigt (zur Orientierung, NICHT erneut bauen)
Profi-Readiness **V1–V10** · **A1–A3** · Entscheidungen 2026-06-17 (ELSTER-Link, AVV-Links, §19-Onboarding,
abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung, ZUGFeRD-Empfang+KoSIT, A4 offene Anbindung Stufe 1).
Details: `docs/OFFENE_PUNKTE.md` + `docs/SESSIONS.md`.
