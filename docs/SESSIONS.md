# Sitzungs-Log

Chronologische Notizen über Sitzungen hinweg. Neueste oben. Pflicht-Felder:
**Datum · Was getan · Stand · Offen/Nächstes.**

---

## 2026-06-17 — R2a: Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) [Branch `claude/r2-skonto-ust-korrektur-iwybxg`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **R2a** — A3-Rest, „R2" feiner geschnitten in R2a Skonto / R2b Sammelzahlung)
- **Reine Logik zuerst (`src/domain/skonto.js`, node-getestet):**
  - `SKONTO_KONTEN` — SKR03: gewährte Skonti **8730/8731/8736** (Erlösschmälerung Verkauf), erhaltene Skonti
    **3730/3731/3736** (Aufwandsminderung Einkauf), USt-Korrektur **1776/1771**, Vorsteuer-Korrektur **1576/1571**.
  - `skontoSplit(brutto, ustProzent)` → zerlegt einen Bruttobetrag in Netto + USt je Satz.
  - `skontoBuchungZeilen({richtung, offenCent, zahlungCent, ustProzent|saetze, konten?})` → gleicht den offenen
    Posten **komplett** aus: **Einnahme** (Forderung, Skonto gewährt) = Soll Bank + Soll gewährte Skonti (netto)
    + Soll USt (Korrektur) / Haben Forderung; **Ausgabe** (Verbindlichkeit, Skonto erhalten) = Soll Verbindlichkeit /
    Haben Bank + Haben erhaltene Skonti (netto) + Haben Vorsteuer (Korrektur). **Gemischte USt-Sätze** werden
    **proportional** je Brutto-Anteil aufgeteilt (größter-Rest-Methode, kein Cent-Verlust). Guards: kein Abzug /
    Überzahlung / keine Zahlung → `null`.
  - `skontoEntwurf(...)` → vollständiger Buchungs-**Entwurf** (Datum/Beschreibung/§17-Begründung) inkl. Skonto-Meta.
- **§17 UStG (ehrlich):** Zahlt der Kunde mit Skonto, mindert sich das Entgelt → beim **Ausgangsumsatz** sinkt die
  geschuldete **USt**, beim **Eingangsumsatz** die abziehbare **Vorsteuer** (§17 Abs. 1 UStG). Buchung gleicht den
  Posten exakt aus (Bank + Skonto-Netto + USt-/Vorsteuer-Korrektur = offener Brutto).
- **Posten-Anreicherung:** `zahlungsabgleich.offenePosten` (Forderungen) + `payables.offeneVerbindlichkeiten`
  (Kreditoren) tragen jetzt `saetze` = Brutto-Anteile je USt-Satz (aus `auftragSummen`/`eingangsrechnungSummen`).
- **UI (statisch geprüft, kein Headless-Browser):** Der bisherige Skonto-**Hinweis** im Bankimport
  (`ui/views/documents.js`) wird zum Knopf **„Skonto buchen (§17 UStG)"** → `skontoEntwurf` → `saveEntwurf`
  (manuell, **kein Auto-Festschreiben** — GoBD) und markiert den Posten als ausgeglichen. Teilzahlung bleibt davon
  getrennt (nur gezahlter Betrag, Rest offen). i18n de+en (`bankSkonto` neu betextet, `bankSkontoDone`/`bankSkontoUst`).
  SW `v88`, neues Modul precacht.

**Stand:** `node tests/run.mjs` **816/816 grün** (+33). Reine Skonto-Logik node-getestet (Split, Einnahme/Ausgabe
einzelner Satz, gemischte Sätze proportional, Ausgeglichenheit S=H, Guards, Entwurf-Begründung §17, Seed-Konten,
Integration mit `offenePosten.saetze`). UI/Glue statisch geprüft.

**Offen/Nächstes:** **R2b** — Sammelzahlungen (eine Bankzahlung auf mehrere offene Rechnungen → Mehrfach-Zuordnung
in der UI). **Grenze (ehrlich):** Skonto-Entwurf wird nicht auto-festgeschrieben; Klickpfad nicht headless E2E
getestet; bei gemischten Rechnungen wird der Skonto proportional je Brutto-Anteil je Satz verteilt (kaufmännisch
üblich) — exakte Rechnungsaufteilung im Zweifel mit Berater prüfen.

---

## 2026-06-17 — R1: Verzugszinsen/Mahngebühren buchen [Branch `claude/r1-delayed-interest-dunning-ckk0bb`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **R1** — A1-Rest, schließt das Mahnwesen-Soll „Buchung" ab)
- **Reine Logik zuerst (`src/domain/mahnwesen.js`, node-getestet):**
  - `MAHN_KONTEN` — SKR03-Kontenzuordnung: Forderungen **1400** (Soll) an Zinserträge **2650** /
    sonstige betriebliche Erträge **2700** (Haben).
  - `mahnbuchungZeilen({zinsenCent, gebuehrenCent, konten?})` → ausgeglichene Buchungszeilen
    (Soll Forderung an Haben Zinsertrag + Gebührenertrag), **ohne USt-Zeile**, mit Summe;
    nur Zinsen ODER nur Gebühren → 2 Zeilen; 0/0 → keine Zeilen.
  - `mahnbuchungEntwurf(...)` → vollständiger Buchungs-**Entwurf** (Datum/Beschreibung/Begründung)
    aus den `mahnschreibenDaten`; gibt `null` zurück, wenn nichts anfällt.
- **USt-Behandlung (ehrlich dokumentiert):** Verzugszinsen UND Mahngebühren sind nach h. M.
  (Abschn. 1.3 UStAE) **nicht steuerbarer echter Schadensersatz** → **keine Umsatzsteuer**; die
  Forderung gegen den Schuldner erhöht sich um den Betrag. Begründungstext + Hinweis „im Zweifel Berater".
- **UI (statisch geprüft, kein Headless-Browser):** Knopf **„Als Buchungsentwurf übernehmen"** im
  Mahnschreiben (`ui/views/reports.js zeigeMahnung`) nutzt die editierbaren Zinsen/Gebühren-Felder →
  `saveEntwurf` (manuell, **kein Auto-Festschreiben** — GoBD); `ensureSeedKonten` stellt 1400/2650/2700
  sicher. i18n de+en (`mahnBook`/`mahnBooked`/`mahnBookNone`, `mahnBookHint` aktualisiert). SW `v87`.

**Stand:** `node tests/run.mjs` **783/783 grün** (+23). Reine Buchungslogik node-getestet (Ausgeglichenheit,
keine USt-Zeile, Konto-Override, Entwurf aus §288-Mahnschreiben, `validateBuchung` leer). UI/Glue statisch geprüft.

**Offen/Nächstes:** **R2** — Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) + Sammelzahlungen
(eine Zahlung, mehrere Rechnungen). **Grenze (ehrlich):** USt-Freiheit gilt für echten Schadensersatz;
vertraglich vereinbarte Bearbeitungsgebühren können abweichen → Berater. Klickpfad nicht headless E2E getestet.

---

## 2026-06-17 — B3: Bilanzierung — Bilanz (Aktiva = Passiva) [Branch `claude/balance-sheet-b3-56djmn`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B3** — Abschnitt B Bilanzierung, schließt Abschnitt B ab)
- **Reine Logik zuerst (`src/domain/bilanz.js`, node-getestet):** `bilanz(buchungen, idx, stichtag, eröffnungssalden)`
  saldiert die **Bestandskonten** (Aktiv/Passiv) aus den **festgeschriebenen** Buchungen bis einschließlich Stichtag
  (`taxes.kontoBewegungen({bis: stichtag})`, Bestand kumulativ → kein `von`), Salden über die Mehrungsseite
  (`accounts.saldo`/`mehrungsSeite`), gegliedert nach `bilanzSeite` (B1) in **Aktiva**/**Passiva** (je {nummer,name,wert},
  nach Nummer sortiert, Null-Salden raus). Der **Jahresüberschuss/-fehlbetrag** der Erfolgskonten (Σ Erträge − Σ
  Aufwendungen über denselben Zeitraum) fließt als **Ergebnis ins Eigenkapital (Passiva)** → Grundgleichung
  **Aktiva = Passiva (inkl. Ergebnis)** mit `summePassivaMitErgebnis`, `bilanzsumme`, `differenz`, `ausgeglichen`.
  **Eröffnungssalden** via gebuchtem Saldenvortrag (Konto 9000) ODER über den Parameter `eröffnungssalden`
  (Kontonummer→Cent, Mehrungsseite-positiv; ausgeglichene Eröffnungsbilanz vorausgesetzt). Entwürfe (`seq==null`)
  zählen nicht.
- **`domain/export.js`:** `buildBilanzCsv(bilanz)` (Spalten Seite/Konto/Bezeichnung/Betrag, Stichtag-Kopf, Summe
  Aktiva, Passiva-Posten + Ergebnis, Summe Passiva inkl. Ergebnis, bei Unausgeglichenheit Differenz-Zeile).
- **UI (`ui/views/reports.js`, statisch geprüft):** **Bilanz-Karte** in „Auswertung" neben der GuV-Karte — **nur im
  Bilanz-Modus** (`istBilanzierung(getSettings())` gatet, B1-Schalter `gewinnermittlung`), Stichtag = Perioden-`bis`,
  Aktiva-/Passiva-Listen, Ergebnis-Posten, Ausgeglichen-Status (✓ oder Differenz), CSV-Export-Knopf + Druck.
- **i18n** (de+en) `reports.bilanz*`. **SW-Cache `v86`** (`bilanz.js`/`bilanzierung.js` bereits precached).
- **Tests 760/760** grün (+21 neue: Summengleichheit, Ergebnis ins EK, Eröffnungssalden (gebucht + reiner Bestand),
  Stichtag-Eingrenzung, greenfield-Ausgleich, unausgeglichene Eröffnungsbilanz → `ausgeglichen=false`/`differenz`,
  Erfolgskonten-Ausschluss, Entwurf-Ausschluss, CSV inkl. Differenz-Zeile).

**Stand:** B3 vollständig → **Abschnitt B (Bilanzierung) abgeschlossen** (B1+B2+B3). Reine Logik node-getestet
(760/760); UI/Glue (Bilanz-Karte, Modus-Gate über IndexedDB-Settings) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **R1 — Verzugszinsen/Mahngebühren buchen** (A1-Rest): Konto-Mapping + USt-Behandlung
(manuell, kein Auto-Buchen). Danach R2…R6 nach Bedarf (siehe NACHFOLGE_PLAN.md Abschnitt R).
**Grenze (ehrlich):** Bilanz im **Konten-Sinn** (Salden je Konto), **KEINE** amtliche §266-HGB-Gliederung, **kein**
Konzernabschluss, **keine** E-Bilanz-Taxonomie. Konten werden nach **Kontoart** zugeordnet, **nicht** nach
Saldovorzeichen umgegliedert (ein Bankkonto im Haben-Saldo bleibt negativ auf der Aktivseite). Eine separate
**Eröffnungsbilanz-Eingabemaske** gibt es noch nicht — Eröffnungssalden kommen aus gebuchten Saldenvorträgen (9000).

---

## 2026-06-17 — B2: Bilanzierung — GuV (Gewinn- und Verlustrechnung) [Branch `claude/bookledgerpro-b2-guv-n3r6or`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B2** — Abschnitt B Bilanzierung)
- **Reine Logik zuerst (`src/domain/bilanz.js`, NEU, node-getestet):** `gewinnUndVerlust(buchungen, idx, periode)`
  aggregiert die **Erfolgskonten** (Aufwand/Ertrag) aus den **festgeschriebenen** Buchungen je Periode
  (`taxes.kontoBewegungen`), bildet die Salden über die Mehrungsseite (`accounts.saldo`/`mehrungsSeite`),
  gliedert nach `guvSeite` (B1, `domain/bilanzierung.js`) in **Erträge**/**Aufwendungen** (je {nummer,name,wert},
  nach Nummer sortiert, Null-Salden raus), Summen, **Jahresüberschuss/-fehlbetrag = Σ Erträge − Σ Aufwendungen**.
  Bestands-/Steuerkonten (Bank, USt, VSt) bleiben außen vor; Entwürfe (`seq==null`) zählen nicht.
- **`domain/export.js`:** `buildGuvCsv(guv)` (Spalten Art/Konto/Bezeichnung/Betrag, Summen + Jahresüberschuss/
  -fehlbetrag je nach Vorzeichen).
- **UI (`ui/views/reports.js`, statisch geprüft):** GuV-Karte in „Auswertung" — **nur im Bilanz-Modus**
  sichtbar (`istBilanzierung(getSettings())` gatet die Ansicht, B1-Schalter `gewinnermittlung`), respektiert
  den Perioden-Filter, mit CSV-Export-Knopf + Druck.
- **i18n** (de+en) `reports.guv*`. **SW-Cache `v85`** + `bilanz.js` precached.
- **Tests 739/739** grün (+13 neue: Summen/Gliederung, Periodengrenze, Bestandskonten-Ausschluss, Entwurf-Ausschluss,
  CSV Überschuss/Fehlbetrag).

**Stand:** B2 vollständig. Reine Logik node-getestet (739/739); UI/Glue (GuV-Karte, Modus-Gate über
IndexedDB-Settings) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B3 — Bilanz.** `bilanz(buchungen, idx, stichtag, eröffnungssalden)` → Aktiva/Passiva aus den
Bestandskonten-Salden, Summengleichheit (Aktiva = Passiva), Eröffnungs-/Schlussbilanzkonto; Ansicht + CSV.
EHRLICH: keine Konzernabschlüsse/E-Bilanz-Taxonomie.

---

## 2026-06-17 — B1: Bilanzierung Modus + Kontengrundlage [Branch `claude/bilanzierung-b1-setup-4cx6s3`] (PR #87, gemergt)

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B1** — startet Abschnitt B Bilanzierung)
- **Reine Logik zuerst (`src/domain/bilanzierung.js`, node-getestet):** Gewinnermittlungsart
  `GEWINNERMITTLUNG` (`euer` | `bilanz`) + `GEWINNERMITTLUNG_LISTE`, `istGewinnermittlung`,
  `normalizeGewinnermittlung` (Fallback EÜR), `istBilanzierung(settings)`. **Konten-Klassifikation**
  als Grundlage für B2/B3: `istBestandskonto`/`istErfolgskonto`, `abschlussBereich` (+`BEREICH`),
  `bilanzSeite` (aktiva/passiva), `guvSeite` (aufwand/ertrag), `klassifiziereKonto`. Konstante
  `BILANZ_GRUNDKONTO_NUMMERN`.
- **`accounts.js`:** Bilanz-Grundkonten **0800** (Gezeichnetes Kapital), **0840** (Kapitalrücklage),
  **0860** (Gewinn-/Verlustvortrag), **0970** (Sonstige Rückstellungen) in den SKR03-Seed ergänzt.
  **Saldenvortrag/Eröffnung 9000** war bereits vorhanden (geprüft).
- **`state.js`:** Setting `gewinnermittlung` mit **Default `'euer'`** → **Bestandsnutzer unverändert**.
- **`shell.js`:** Modus-Schalter „Gewinnermittlung" in den Einstellungen; Wechsel auf **Bilanz**
  zieht die Grundkonten in älteren Tresoren via `ensureSeedKonten` nach (neue Tresore haben sie im Seed).
- **i18n** (de+en) `settings.gewinn*`. **SW-Cache `v84`** + `bilanzierung.js` precached.
- **Tests 726/726** grün (+27 neue: Modus-Logik, Konten-Klassifikation, Seed-Grundkonten).

**Stand:** B1 vollständig + gemergt. Reine Logik node-getestet; UI/Glue (Settings-Schalter,
`ensureSeedKonten` über IndexedDB) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B2 — GuV.** `domain/bilanz.js` (rein, node-getestet):
`gewinnUndVerlust(buchungen, idx, periode)` → Erträge/Aufwendungen gegliedert, Jahresüberschuss;
Ansicht + CSV. Dann B3 (Bilanz).
**Grenze (ehrlich):** Der Modus-Schalter setzt aktuell **nur Modus + Kontengrundlage** und ändert
**noch keine Berichte** — GuV/Bilanz folgen in B2/B3. **Keine** Konzernabschlüsse, **keine** E-Bilanz-Taxonomie.

---

## 2026-06-17 — M3: Shell-Mandanten-Indikator + Verwaltung [Branch `claude/m3-shell-tenant-mgmt-d13v6s`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **M3** — schließt Abschnitt A Mehrmandanten ab)
- **`ui/shell.js` Header:** zeigt jetzt den **aktiven Mandanten-Namen** (aus der Registry via
  `ladeRegistry`/`aktiverMandant`, async nachgeladen in `refreshMandant`, Fallback `getMandantId()`)
  statt der DB-ID. **„Mandant wechseln"**-Knopf (nur bei >1 Mandant): `lockVault()` + Reboot →
  der Boot zeigt die Auswahl (showLockScreen).
- **Einstellungen „Mandanten verwalten"** (`mandantenSection`/`mandantRow`): pro Mandant
  **umbenennen** (`validateMandantName` → `umbenenneMandant` → `speichereRegistry`, Header zieht
  bei aktivem Mandanten via `refreshMandant` mit) und **entfernen** (`entferneMandant` →
  `speichereRegistry`, **nur mit `confirm`**; Tresor-DB bleibt erhalten — kein Datenverlust).
  Der **aktuell geöffnete** Mandant ist nicht entfernbar (Button disabled + Hinweis).
- **i18n** (de+en): `mandant.current/confirmRemove/removeActiveHint`, `settings.mandanten(+Hint)`.
  **CSS** `.mandant-admin(-row)`. **SW-Cache `v83`** (Module bereits precached). Doku **`docs/MANDANTEN.md`** neu.
- **Tests 699/699** unverändert grün — reine Registry-Logik (`umbenenneMandant`/`entferneMandant`/
  `mandantenAuswahlListe`/`aktiverMandant`) war schon node-getestet; M3 ist reiner Glue/UI.

**Stand:** M3 vollständig → **Abschnitt A (Mehrmandantenfähigkeit) abgeschlossen** (M1✅ M2a✅ M2b✅ M3✅).
Reine Logik node-getestet; die neuen DOM-/IndexedDB-Pfade (Header-Nachladen, Verwaltungs-Sektion)
sind **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B1 — Bilanzierung Modus + Kontengrundlage** (Setting `gewinnermittlung:'euer'|'bilanz'`,
Default `euer`, Bilanz-Grundkonten/Saldenvortrag, minimale UI; reine Klassifikation node-getestet).
**Grenze:** „Entfernen" = aus der Liste nehmen, kein Löschen + keine Re-Import-UI für eine entfernte,
aber vorhandene Tresor-DB (in `docs/MANDANTEN.md` als Grenze dokumentiert).

---

## 2026-06-17 — M2b: Sperrbildschirm Mandanten-Auswahl/-Anlage/-Wechsel [Branch `claude/lock-screen-tenant-selection-9uhoh8`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **M2b** — Sperrbildschirm-UI, nutzt fertige M2a-Core)
- **Reine Logik zuerst (`domain/mandanten.js`, node-getestet):** `brauchtMandantenAuswahl(registry)`
  (Auswahl erst ab **>1** Mandant → verhaltensneutral für Bestandsnutzer) + `mandantenAuswahlListe(registry)`
  (stabil sortiert: ältester zuerst, Name als Tiebreak; aktiv markiert; immutabel).
- **`ui/lock.js`:** `showLockScreen` lädt die Registry und zeigt bei >1 Mandant **`renderMandantenAuswahl`**
  (Liste + „+ Neuer Mandant" + DSGVO-Hinweis). Auswahl → `wechsleAktivenMandant(id)` (DEK verwerfen +
  DB-Wechsel gekapselt) → entsperren. **`renderNeuerMandant`**: Name → `registriereMandant` →
  `wechsleAktivenMandant` → Onboarding (eigenes Passwort/Shamir/Backup) in der neuen, leeren Tresor-DB.
  Bei genau 1 Mandant direktes Entsperren + diskreter „+ Neuer Mandant"-Link (Bootstrap bis M3).
  `renderOnboarding` zeigt optional, für welchen Mandanten der Tresor eingerichtet wird.
- **i18n** (de+en) `mandant.*`-Keys inkl. DSGVO-Hinweis (Namen unverschlüsselt). **CSS** `.mandant-list/
  -item/-badge`, `.btn-link`. **SW-Cache `v82`** (betroffene Module waren bereits precached).
- **Tests 699/699** (+10: `brauchtMandantenAuswahl`-Schwelle, Sortierung/Tiebreak/aktiv-Markierung,
  Immutabilität, null-Sicherheit). `node tests/run.mjs` grün.

**Stand:** M2b vollständig. Reine Entscheid-/Sortierlogik node-getestet; die DOM-/IndexedDB-Pfade
(`lock.js`, Tresor-Umschaltung) sind **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **M3** — Shell-Indikator: aktiver Mandant (Name aus Registry) im Header sichtbar,
„Mandant wechseln" + Verwaltung (umbenennen/entfernen, Bestätigung) in Einstellungen, Doku `docs/MANDANTEN.md`.
**Grenze:** Der 1→2-Bootstrap geht aktuell nur über den Lock-Link; der reguläre Shell-Trigger kommt in M3.

---

## 2026-06-17 — M2a: Mehrmandanten Core-Verdrahtung [Branch `claude/m2a-mandanten-core`]

**Was getan** (NACHFOLGE_PLAN.md, M2 gesplittet → **M2a** = Core, M2b = UI)
- **`core/db.js`:** aktive Tresor-DB ist jetzt **konfigurierbar** — `getActiveDbName`,
  `setActiveDbName` (mit Suffix-Schutz/No-op-Logik), `closeDb` (Verbindung schließen +
  Cache verwerfen), Export `LEGACY_DB_NAME`. Default bleibt der Legacy-Tresor → **kein
  Verhalten ändert sich**, solange nur ein Mandant existiert. `openDb` öffnet die aktive DB.
- **Neu `core/mandantenStore.js`:** unverschlüsselte Registry-DB `blpr_mandanten_bookledgerpro`
  (getrennt von Tresor-DBs, muss vor dem Entsperren lesbar sein). `ladeRegistry`/
  `speichereRegistry`; **`initMandanten`** (Boot: Alt-Tresor migrationsfrei als „Mandant 1"/
  ID `standard` registrieren, aktive DB ausrichten); `registriereMandant`; **`wechsleAktivenMandant`**
  (verwirft DEK via `lockVault`, schließt DB, richtet Ziel-DB aus, persistiert).
- **`mandanten.js`:** `REGISTRY_DB_NAME` ergänzt. **`main.js`:** Boot ruft `initMandanten()`
  vor dem Sperrbildschirm.
- **Tests 689/689** (+9: Registry-DB-Name/Suffix, aktive-DB-Umschaltung inkl. Suffix-Schutz/
  No-op). `node tests/run.mjs` grün. **SW-Cache `v81`**, neues Modul precached.

**Stand:** M2a vollständig (Core node-getestet/verhaltensneutral verdrahtet). IndexedDB-Glue
in `mandantenStore.js` statisch geprüft (kein Headless-Browser).
**Offen/Nächstes:** **M2b** — Sperrbildschirm-UI: bei >1 Mandant Auswahlliste, „Neuer Mandant"
(Onboarding in eigener DB), Wechsel über `wechsleAktivenMandant`; DSGVO-Hinweis (Namen
unverschlüsselt). Core dafür ist fertig nutzbar.

---

## 2026-06-17 — M1: Mehrmandanten-Fundament (reine Schicht) [Branch `claude/m1-mehrmandanten-fundament-0k6qiu`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt M1 — „Fundament rein + Design")
- **Neues `src/domain/mandanten.js` (rein, kein IndexedDB-Zugriff):** Registry-Datenmodell
  `{mandanten:[{id,name,erstellt}], aktiv}` mit immutablen Operationen `addMandant`,
  `umbenenneMandant`, `entferneMandant`, `setzeAktiv`, `findeMandant`, `aktiverMandant`;
  `erstelleMandant`/`validateMandantName`/`neueMandantId`.
- **Speicher-Namensbildung `dbNameFuer(id)`:** Legacy/Default (ID `standard` oder leer) →
  unveränderter Bestandsname `blpr_bookledgerpro` (**migrationsfrei**); weitere Mandanten →
  `blpr_<id>_bookledgerpro`. **Suffix `bookledgerpro` bleibt** (Regel #3, keine Origin-Kollision).
- **`mitLegacyMandant`:** migrationsfreier Seed — leere Registry → Bestand als „Mandant 1"
  (ID `standard`) aktiv; vorhandene Registries bleiben unangetastet.
- **Design-Abschnitt** in `NACHFOLGE_PLAN.md` (Abschnitt A) ergänzt: 1 Mandant = 1 getrennter
  Tresor, unverschlüsselte Registry-DB für Sperrbildschirm-Auswahl, DEK-Verwerfen beim Wechsel.
- **Tests 680/680** (29 neu: Namensbildung inkl. Suffix/Legacy/ungültige ID, ID-/Namensprüfung,
  Registry-Ops immutabel, Legacy-Seed). `node tests/run.mjs` grün. **SW-Cache `v80`**, Modul precached.

**Stand:** M1 vollständig (reine Logik node-getestet; **keine** Tresor-Umverdrahtung — bewusst M2).
**Offen/Nächstes:** **M2** — Tresor je Mandant + Auswahl am Sperrbildschirm (`lock.js`/`vault.js`/
`core/db.js` DB-Namen konfigurierbar machen, Bestand als „Mandant 1" registrieren, Wechsel mit
sauberem DEK-Verwerfen). Design-Abschnitt in `NACHFOLGE_PLAN.md` ist verbindlich.

---

## 2026-06-16 — V2: §13b/Reverse-Charge + EU/Ausland (USt) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V2, „weiter laut PULS")
- **`baueReverseChargeZeilen` (journal.js)** + `UMSATZART`: Steuerschuldumkehr (§13b UStG /
  innergem. Erwerb) bucht **gleichzeitig** abziehbare Vorsteuer (Soll) und geschuldete USt
  (Haben); an den Lieferanten fließt nur der **Netto**-Betrag. Option „nicht abziehbar" →
  USt wird Kostenbestandteil. Buchung ist immer ausgeglichen.
- **Konten (accounts.js):** 1577/1787 (§13b VSt/USt), 1574/1772 (ig Erwerb VSt/USt),
  8125/8120 (steuerfreie ig Lieferung / Ausfuhr) mit neuen `rolle`-Markern; Map
  `REVERSE_CHARGE_KONTEN` + `STEUERFREI_ERLOES_KONTEN`. `store.ensureSeedKonten` zieht die
  Konten in älteren Tresoren nach.
- **USt-VA (export.js `buildUstVa`):** neue Kennzahlen **Kz 46/47/67** (§13b),
  **Kz 89/93/61** (ig Erwerb), **Kz 41/43** (steuerfrei); BMG aus Steuer/Satz; Kz 83
  inkl. RC (geschuldete USt erhöht, Vorsteuer mindert → hebt sich bei vollem Abzug auf).
  `ustVaToCsv` + Auswertungs-Karte zeigen die Kennzahlen (nur wenn ≠ 0).
- **UI:** Umsatzart-Auswahl (Inland / §13b / innergem. Erwerb) im Journal-Formular; bei
  Reverse-Charge gilt der Betrag als Netto. i18n de/en. SW-Cache `v64`.
- **Tests 472/472** (28 neu: Buchungszeilen, Ausgleich, USt-VA-Kennzahlen, Zahllast-
  Neutralisierung, §13b-only → Kz83=0, CSV).

**Stand:** V2 vollständig (Logik node-getestet, UI statisch geprüft — nicht headless-E2E).
**Offen/Ehrlich:** §13b modelliert für 19 % (Hauptfall Cloud/Software); exakte Kennzahl-
Zuordnung am amtlichen ELSTER-Formular/mit Berater zu verifizieren; E-Rechnungs-Empfang
erkennt die Umsatzart noch nicht automatisch (manuelle Wahl). **Nächstes:** V3 (Anlagevermögen
+ AfA + Anlagenverzeichnis), `docs/OFFENE_PUNKTE.md` Abschnitt V.

> Hinweis: Branch `claude/v2-ox8bu7` war zunächst auf veraltetem `main` (PR #63 Ist-EÜR);
> Ist-EÜR existierte bereits in `main` → #63 geschlossen, Branch auf `main` zurückgesetzt,
> V2 korrekt umgesetzt.

---

## 2026-06-17 — Nachfolge-Brief: Mehr-Sitzungs-Plan (je 1 PR/Sitzung) [Branch `claude/v2-ox8bu7`]

**Was getan** (reine Doku/Planung, kein Code — auf Nutzerwunsch)
- **`docs/NACHFOLGE_PLAN.md`** neu: geordneter Mehr-Sitzungs-Plan mit **Sitzungs-Ritual**
  (genau 1 PR pro Sitzung, sauber/fehlerfrei vor schnell, Abschlussbrief am Ende jeder Sitzung →
  konfliktfreier Start der nächsten). Reihenfolge: **A) Mehrmandanten M1→M2→M3** (Architektur
  „mehrere getrennte Tresore", DB-Suffix unverändert), **B) Bilanzierung B1→B2→B3** (GuV+Bilanz),
  **R) Rest-SOLL R1…R6**. Jeder Schritt mit konkretem Scope + Splitting-Hinweis.
- **`docs/PULS.md` „START HIER"** neu geschrieben: verweist auf den Plan, **nächste PR = M1**,
  Freibrief + Ritual ausdrücklich übergeben; veraltete/doppelte Blöcke entfernt.
- Tests **651/651** (unverändert; Doku-only). SW bleibt `v79`.

**Stand:** Plan steht. **Nächste Sitzung:** **M1** (Mehrmandanten-Fundament) — siehe NACHFOLGE_PLAN.md.

---

## 2026-06-17 — Punkt 7/A4: Offene Anbindung an andere Buchhaltungssoftware (Stufe 1) [Branch `claude/v2-ox8bu7`]

**Was getan** (A4 erweitert: WorkFloh public + generischer Konnektor)
- **`domain/connect.js`** (rein, node-getestet): versioniertes, offenes **Austauschformat**
  (`bookledgerpro-austausch` v1) — `buildAustauschPaket` (Export BLP→offen), `parseAustauschPaket`
  (Import, **abwärtskompatibel** zum bare WorkFloh-`{kunden,auftraege}`, lehnt Fremdformate ab).
- **Aufträge-Ansicht:** Import läuft jetzt über `parseAustauschPaket`→`normalizeImport` (akzeptiert
  beide Formate) + neuer **„Austausch-Datei exportieren"**-Knopf (Kunden+Aufträge offen herausgeben).
- **Einstellungen:** „Verbundene App"-URL (reziproke Verlinkung zu WorkFloh/anderer Software) + Öffnen-Link.
- **`docs/CONNECT.md`**: Format-Spezifikation + „so bindet andere Software an". i18n de/en. SW `v79`.
- Tests **651/651** (7 neu: Export-Header/Inhalt, Round-trip→normalizeImport, bare-Format, Fremdformat/Müll abgelehnt).

**Stand:** A4 Stufe 1 (datei-basiert, Import+Export+Link) erledigt. **Offen:** API/Push-Echtzeit,
Rechnungs-Übernahme statt nur Auftrag. **Nächste (groß):** Mehrmandantenfähigkeit → Bilanzierung.
> Hinweis: Mehrmandanten + Bilanzierung sind große Architektur-Brocken — je dedizierter PR.

---

## 2026-06-17 — Punkt 6: ZUGFeRD-Empfang + KoSIT-Pflichtfeld-Precheck [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/zugferd.js`** (rein, node-getestet): `extrahiereZugferdXml(pdfBytes)` — best-effort-
  Extraktion der eingebetteten CII/UBL-XML aus PDF; FlateDecode-Streams werden **build-frei** über
  natives `DecompressionStream('deflate')` entpackt. `kostPflichtfelder(parsed)` — KoSIT-orientierter
  EN16931-Pflichtfeld-Precheck (BT-1/2/27/112).
- **Belege → E-Rechnung-Empfang** akzeptiert jetzt zusätzlich **ZUGFeRD/Factur-X-PDF**: extrahiert die
  XML, nutzt den bestehenden CII/UBL-Parser, zeigt den **KoSIT-Precheck** (✓/⚠ fehlende Felder). i18n de/en.
  SW `v78` (+zugferd.js precached).
- Tests **644/644** (5 neu: rohe + Flate-komprimierte CII-Extraktion, kein-XML→null, KoSIT ok/fehlend).

**Stand:** Punkt 6 erledigt (Empfang). **Offen/Ehrlich:** ZUGFeRD-*Erzeugen* (XML in PDF/A-3 einbetten)
braucht eine PDF-Lib → nicht build-frei, bleibt offen; KoSIT-Precheck ist KEIN amtlicher Validator.
**Nächstes (groß):** A4 (WorkFloh public, beidseitige Verlinkung + generische Buchhaltungs-Anbindung)
→ Mehrmandanten → Bilanzierung.

---

## 2026-06-17 — Punkt 29: Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/aufbewahrung.js`** (rein, node-getestet): `aufbewahrungBis` (Jahr + 10, §147 AO),
  `istAufbewahrungspflichtig`, `darfBelegLoeschen` (Belegprinzip: verknüpfte Belege nie löschbar).
  Re-Export über `documents.js`.
- **Beleg-Verknüpfung:** Beim Beleg→Entwurf wird jetzt **`belegRef`** in die Buchung gesetzt
  (Teil der Hash-Kette, GoBD-Belegprinzip) zusätzlich zum rückwärtigen `linkBeleg` (buchungId).
- **Belege-Ansicht:** Spalte „aufbewahren bis"; **Löschen verknüpfter Belege blockiert**,
  Frist-Warnung bei noch laufender Aufbewahrung. i18n de/en. SW `v77` (+aufbewahrung.js precached).
- Tests **639/639** (7 neu). **A4-Scope erweitert (Nutzer 17.06.):** WorkFloh public →
  beidseitige Verlinkung + generische Anbindung an andere Buchhaltungssoftware (in OFFENE_PUNKTE/PULS notiert).

**Stand:** Punkt 29 erledigt; alle kleinen Folgepunkte (27/28/29/31) durch. **Nächstes (groß, je eigener PR,
Freibrief-Merge):** ZUGFeRD/KoSIT → A4 (erweitert) → Mehrmandanten → Bilanzierung.

---

## 2026-06-17 — Punkt 31: Steuerberater-Übergabe-Datenblatt [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`export.buildUebergabeText`** (rein, node-getestet): Klartext-Datenblatt mit Firmenprofil,
  Steuernummer/USt-IdNr., DATEV Berater/Mandant, Zeitraum, USt-VA-Kennzahlen, EÜR-Überschuss und
  Liste der **mitzugebenden Dateien** (DATEV-CSV, GoBD-ZIP, SuSa/Kontenblätter, USt-VA/ELSTER).
- **Karte „Übergabe an den Steuerberater"** in „Berichte" (`berichte.js`): zeigt das Datenblatt für
  den gewählten Zeitraum (echte Daten) + **Drucken→PDF** + **TXT-Download**. i18n de/en. SW `v76`.
- Tests **632/632** (4 neu). 

**Stand:** Punkt 31 erledigt. **Nächstes:** Punkt 29 (Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung),
danach die großen Optionen (ZUGFeRD/KoSIT, A4-WorkFloh, Mehrmandanten, Bilanzierung) je eigener PR.

---

## 2026-06-17 — Punkt 28: Abweichendes Wirtschaftsjahr [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/geschaeftsjahr.js`** (rein, node-getestet): `wjPeriode(jahr, wjBeginn)` (Beginn +1J −1Tag,
  schaltjahr-sicher), `wirtschaftsjahrVon(datum)`, `wjBeginnYYYYMMDD`, `validateWjBeginn`.
- **`summary.jahrPeriode(jahr, wjBeginn='01-01')`** delegiert an `wjPeriode` (rückwärtskompatibel);
  `dashboardKennzahlen` nimmt optionalen `wjBeginn`.
- **Setting `wirtschaftsjahrBeginn`** (MM-TT, Default 01-01) + Einstellungen-Sektion „Wirtschaftsjahr".
- **Dashboard** zeigt WJ-Label + rechnet auf das laufende Wirtschaftsjahr; **DATEV-EXTF-Header**
  übernimmt den WJ-Beginn (`opts.wjBeginnMMDD`). **USt-VA bleibt bewusst kalendarisch** (Gesetz).
- i18n de/en, SW-Cache `v75` (+1 Modul). Tests **628/628** (10 neu).

**Stand:** Punkt 28 erledigt. **Nächstes:** Punkt 31 (Steuerberater-Übergabe-Datenblatt).

---

## 2026-06-17 — Punkt 27: §19-Kleinunternehmer-Abfrage im Onboarding [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`lock.js`**: neuer Onboarding-Schritt `stepProfil()` zwischen Shamir-Sicherung und Pflicht-Backup —
  fragt „Kleinunternehmer §19?" (Ja/Nein) und speichert `kleinunternehmer` via `updateSettings`
  (Backup bleibt der erzwungene Gate-Schritt; Auswahl später in Einstellungen änderbar). i18n de/en.
- SW-Cache `v74`. Tests **618/618** (reine UI-Ergänzung, Onboarding nicht headless-E2E → Selbsttest/
  Checkliste decken Engine ab).

**Stand:** Punkt 27 erledigt. **Nächstes:** Punkt 28 (abweichendes Wirtschaftsjahr).

---

## 2026-06-17 — Entscheidungen Teil 1 (ELSTER-Link + AVV) + Nachfolge-Brief mit Freibrief [Branch `claude/v2-ox8bu7`]

**Was getan**
- **Nutzer-Entscheidungen festgehalten** (`OFFENE_PUNKTE.md` neuer Kopf-Abschnitt): ELSTER **JA**
  (Datenpaket + Link, kein ERiC), Mehrmandanten **JA**, Bilanzierung **JA**, AVV **umsetzen**;
  inkl. **festgelegter Bau-Reihenfolge** (je 1 PR, Freibrief-Merge) + neue Klein-Punkte 27/28/29/31.
- **ELSTER-Weiterleitung (Entscheidung, klein):** Link „Bei ELSTER eingeben ↗" in der Karte
  „USt-VA je Zeitraum" (`reports.js`) zusätzlich zum ELSTER-Datenpaket-Download.
- **AVV/DPA (Entscheidung, klein):** neue Karte in „Recht & Doku" (`legal.js`) mit Direktlinks
  zu **Google Cloud DPA** und **Mistral DPA** (Art. 28 DSGVO). i18n de/en. SW-Cache `v73`.
- **Neuer Nachfolge-Brief** in `PULS.md` („START HIER") mit **ausdrücklich weitergereichtem
  Freibrief** (selbstständiges Mergen bei grüner CI) + priorisierter Reihenfolge der nächsten PRs.
- Tests **618/618 grün** (reine UI/Doku-Ergänzung, keine Logikänderung).

**Stand:** Fahrplan V1–V10 komplett; Entscheidungen verankert; Reihenfolge der Folge-PRs steht.
**Nächstes (lt. Brief):** §19-Onboarding (27) → abweichendes Wirtschaftsjahr (28) → Übergabe-
Datenblatt (31) → Beleg-Verknüpfung/Aufbewahrung (29) → ZUGFeRD/KoSIT → A4 → Mehrmandanten → Bilanz.

---

## 2026-06-16 — V10: Browser-E2E (In-App-Selbstdiagnose + Abnahme-Checkliste) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V10 — letzter Punkt; Fahrplan V1–V10 damit komplett)
- **`domain/selbsttest.js`** (`runSelbsttest`, rein/async, offline): AES-GCM-Roundtrip + Ablehnung
  falsches Passwort, Shamir 2-von-3, GoBD-Hash-Kette + **Manipulationserkennung**, Geldrundung
  (de-Format), doppelte Buchführung (SuSa Soll=Haben), USt-VA-Zahllast (Demo „klein" = 159,00 €),
  EÜR == Anlage-EÜR, GDPdU-Tabelle vollständig, Export-Pipeline (Demo-ZIP).
- **Ansicht „Selbsttest"** (`ui/views/selbsttest.js`, neuer Nav-Eintrag/Route): führt die Diagnose
  aus, zeigt ✓/✗ je Prüfung + Zusammenfassung + „erneut ausführen". i18n de/en. SW-Cache `v72`.
- **`docs/ABNAHME_CHECKLISTE.md`**: manueller Klickpfad (Onboarding/Buchen/Belege/Rechnung/
  Auswertung/Berichte/Export/Backup/PWA/„ohne DATEV") für die DOM-/IndexedDB-Pfade.
- **Tests 618/618** (13 neu: runSelbsttest gesamt grün + jede Einzelprüfung).

**Stand:** **Profi-Readiness-Fahrplan V1–V10 vollständig abgeschlossen.** Logik node-getestet
(618), Kern-Engine zusätzlich in-App offline prüfbar; DOM-Pfade via Checkliste manuell. **Offen
(kein Pflicht-Fahrplan mehr):** A4 WorkFloh-Anbindung, Sage 5b–d, echter Praxistest des Nutzers
(Foto-OCR→App→Finanzamt, DATEV-Testimport via Steuerberater), optional V-Bilanz/V-Lohn/V-Multi.

---

## 2026-06-16 — V8: DATEV-EXTF berater-fest (vorbereitet) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V8, gleiche Sitzung)
- **`export.js`**: vollständiger EXTF-Header aus Einstellungen — **Berater-/Mandanten-Nr.,
  Sachkontenlänge, WJ-Beginn**, Bezeichnung. Neue Hilfsfunktion **`istEinfacherSatz`**:
  einfache Sätze (2 Zeilen, oder 3 Zeilen mit genau 1 Standard-Steuerzeile) → **ein** Satz mit
  Brutto + **BU-Schlüssel** (SKR03: Vorsteuer 9/8, USt 3/2); **§13b/innergem. Erwerb/Mehrfach-
  Splits → zeilenweiser, steuerneutraler Export OHNE BU/Gegenkonto** (verhindert Doppelsteuer
  beim Import — vorher falsch konsolidiert).
- **`state.js`** + **Einstellungen-Sektion „DATEV-Export"** (`shell.js`): Berater-/Mandanten-Nr.,
  Sachkontenlänge; Reports-Export übergibt sie an `buildDatevExtf`.
- **`docs/DATEV_IMPORT.md`**: Aufbau, BU-Schlüssel-Tabelle, Automatik-vs-Split, Import-Schritte,
  Prüf-Checkliste gegen die Demo-Werte, ehrliche Grenzen.
- **Tests 605/605** (13 neu: Header mit Berater/Mandant/SKL/WJ, BU 9 Ausgabe / BU 3 Einnahme,
  EXTF-Datenzeile, §13b-Split ohne BU + leeres Gegenkonto + alle Konten, 2-Zeilen-Satz BU leer).
  SW-Cache `v71`.

**Stand:** V8 vorbereitet & node-getestet. **Offen/Ehrlich:** endgültige „Berater-Festigkeit" =
**realer DATEV-Testimport** (privat/Steuerberater) — mit Demo-Export + TESTDATEN.md vorbereitbar;
kein zertifiziertes 116-Spalten-EXTF. **Nächstes/letzter Punkt:** V10 (Browser-E2E / In-App-
Selbstdiagnose, manuell).

---

## 2026-06-16 — V9: Korrektheit/Kleinfälle + Simulations-Testharness [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V9 + vom Nutzer gewünschte Testmöglichkeit, gleiche Sitzung)
- **`domain/kleinfaelle.js`** (rein, node-getestet): `kleinbetragsrechnung` (§33 UStDV, ≤250 €
  → reduzierte Pflichtangaben), `geschenkAbzug` (§4 Abs.5 Nr.1, 50 € netto → abzugsfähig/Konto/
  VSt), **`bewirtungAufteilung`** (§4 Abs.5 Nr.2, **rechnender** 70/30-Split, Vorsteuer 100%).
  Neue Konten 4654 (Bewirtung nicht abzugsf.) / 4635 (Geschenke nicht abzugsf.).
- **Periodensperre:** `pruefung.istGesperrt` + harte Sperre in `store.festschreiben`
  (kv `buchungssperreBis`) + Einstellung „Buchungssperre" (shell). `pruefeBuchung` liefert
  Sperr-Fehler + **Kleinunternehmer-Konsistenz-Warnung** (§19: kein USt/VSt-Konto).
- **Journal-UI:** Schnellbuchung **„Bewirtung 70/30"** (nutzt Betrag=netto/USt/Haben).
- **Simulations-Testmöglichkeit (Nutzerwunsch):** `domain/demodaten.js` — deterministischer
  Demo-Mandant **klein** (hand-geprüfte Sollwerte) **und groß** (Konsistenz im Maßstab);
  `demoExportDateien` erzeugt alle Formate. Berichte-Karte **„Demo-/Test-Export"** → lädt ZIP
  mit ECHTEN Dateien (DATEV-EXTF, ELSTER-USt-VA, EÜR/SuSa/Anlage-EÜR, Kassenbuch, Kontenblatt,
  Anlagenverzeichnis, GDPdU) — **ohne** DATEV/ELSTER-Zugang, **ohne** Berührung echter Daten.
  **`docs/TESTDATEN.md`** dokumentiert Buchungen + Vergleichswerte (USt-VA Kz83 159,00 €,
  EÜR −350,00 €, AfA 400 €, …) zum späteren Abgleich mit echtem DATEV/ELSTER.
- **Tests 592/592** (33 neu: Kleinfälle, Periodensperre, Kleinunternehmer-Warnung, Demo „klein"
  Goldwerte, Demo „groß" Invarianten, Demo-Export-ZIP). SW-Cache `v70` (+2 Module).

**Stand:** V9 vollständig; **alle MUSS-Punkte V2–V7 + V9 erledigt**. Logik node-getestet, UI
statisch geprüft. **Offen (nur SOLL):** V8 (DATEV-EXTF berater-fest — echter DATEV-Testimport;
teils via TESTDATEN.md simulierbar), V10 (Browser-E2E manuell). **Nutzer testet** privat in
1–2 Wochen (Foto-OCR → App → Finanzamt).

---

## 2026-06-16 — V7: GoBD-Betriebsprüfer-Export (GDPdU „Z3") [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V7, gleiche Sitzung)
- **`core/zip.js`** (rein, zero-dep): ZIP-Writer (Methode 0 „store") + `crc32` — für build-freie
  Binär-Datenpakete im Browser.
- **`domain/gdpdu.js`** (rein, node-getestet): `buildGdpduIndexXml` (GDPdU-Beschreibungs-
  standard, `<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2004.dtd">`, Tabellen mit Spaltentypen
  Date/Numeric/AlphaNumeric, Separator `;`, DecimalSymbol `,`), `gdpduCsvBuchungen` (nur
  festgeschrieben), `gdpduCsvKonten`, `buildGdpduPaket` (Dateiliste index.xml/buchungen.csv/
  konten.csv/info).
- **„Berichte"**: Karte **GoBD-Betriebsprüfer-Export** → baut ZIP via `zipFiles` und lädt
  `GoBD-GDPdU-Export-<Jahr>.zip` (Validity/Steuernummer aus Firmenprofil). i18n de/en.
  SW-Cache `v69` (+2 Module precached).
- **Tests 559/559** (16 neu: CRC-32-Referenzwert, ZIP-Signaturen/EOCD/Dateianzahl, GDPdU-CSV
  nur festgeschrieben + Spaltenkopf, index.xml DOCTYPE/Tabellen/Spaltentypen/Lieferant, Paket→ZIP).

**Stand:** V7 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
GDPdU-*orientiert* — die DTD wird bewusst NICHT mitgepackt (Prüfsoftware liefert sie),
vor echter Prüfung mit IDEA testen; **kein DSFinV-K** (Kassendaten). **Nächstes:** V8
(DATEV-EXTF berater-fest) — „SOLL"; alternativ V9 (Korrektheit/Kleinfälle, „SOLL").

---

## 2026-06-16 — V6: Anlage EÜR + Kontenblätter + SuSa [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V6, gleiche Sitzung)
- **`domain/berichte.js`** (rein, node-getestet): `summenSaldenliste` (SuSa = Saldenliste +
  Soll-/Haben-Gesamtsummen), `kontenblatt` (Kontoauszug je Konto, chronologisch, **laufender
  Saldo**, Entwürfe ausgeschlossen), `anlageEUR` (Erfolgskonten → **Anlage-EÜR-Gruppen**,
  netto, Überschuss = computeEUR) + `eurGruppeFuer` (Konto→Gruppe mit Fallback je Kontoart).
- **`domain/export.js`**: `buildSusaCsv`, `buildKontenblattCsv`, `buildAnlageEURCsv`.
- **Ansicht „Berichte"** (`ui/views/berichte.js`, neuer Nav-Eintrag/Route): Anlage-EÜR-
  Gruppierung (Einnahmen/Ausgaben/Überschuss), SuSa-Tabelle, Kontenblatt mit Konto-Auswahl;
  Periodenfilter; je CSV-Export. i18n de/en. SW-Cache `v68` (+2 Module precached).
- **Tests 543/543** (17 neu: SuSa Soll=Haben, Bank-Saldo, Kontenblatt laufender Saldo +
  Entwurf-Ausschluss, Gruppen-Zuordnung, Anlage-EÜR-Summen/Überschuss, USt/VSt nicht als
  Erfolg, CSV-Inhalte).

**Stand:** V6 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
Anlage-EÜR an der Formularstruktur *orientiert* — exakte **Zeilennummern** (jahresabhängig)
am amtlichen Formular/mit Berater prüfen. **Nächstes:** V7 (GoBD-Betriebsprüfer-Export
GDPdU/DSFinV-K „Z3"/IDEA + Beschreibungsdatei).

---

## 2026-06-16 — V5: USt-VA komplett (Zeitraum + Sondervorauszahlung + ELSTER-Paket) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V5, gleiche Sitzung)
- **`domain/umsatzsteuer.js`** (rein, node-getestet): `voranmeldungsperioden(typ, jahr)` für
  **monatlich/vierteljährlich/jährlich** (ELSTER-Zeitraum-Codes 01–12 / 41–44, Monatsenden
  schaltjahr-sicher via `Date`), `periodeIndexFuer`, **`sondervorauszahlung`** (Dauerfrist-
  verlängerung: 1/11 der Vorjahres-Zahllast, nur bei Zahllast > 0), `jahresZahllast` (Kz 83
  des Jahres via `buildUstVa`).
- **`domain/export.js`**: `buildElsterVaPaket(va, meta)` — strukturierte Übergabedatei
  (Kennzahlen 41/43/81/86/89/93/46/47/66/61/67/83 + Steuernummer/USt-IdNr./Zeitraum) mit
  Disclaimer „NICHT amtlich".
- **Auswertungen**: Karte **„USt-VA je Zeitraum"** (`reports.js`): Typ/Jahr/Periode wählbar,
  Zahllast + Sondervorauszahlungs-Hinweis (nur monatlich), **ELSTER-Datenpaket-Export** +
  Perioden-USt-VA-CSV. Setting **`vaZeitraum`** (Default vierteljährlich) persistiert.
  i18n de/en. SW-Cache `v67` (+1 Modul precached).
- **Tests 526/526** (16 neu: Perioden je Typ, Schaltjahr-Februar, ELSTER-Codes, Index-Mapping,
  Sondervorauszahlung 1/11 + Erstattung=0, jahresZahllast, ELSTER-Paket-Inhalt/Disclaimer).

**Stand:** V5 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
„ELSTER-Datenpaket" ist eine Übergabedatei, **KEIN** ERiC-XML/-Direktversand; Jahres-USt-
Erklärung (eigenes Formular) nicht abgebildet. **Nächstes:** V6 (Anlage EÜR amtliches
Zeilenschema + Kontenblätter + SuSa).

---

## 2026-06-16 — V4: Eröffnungs-/Anfangsbestände + GoBD-Kassenbuch [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V4, gleiche Sitzung)
- **`domain/kassenbuch.js`** (rein, node-getestet): `kassenbuchEintraege` (chronologische
  Kassenbewegungen aus festgeschriebenen Buchungen, sortiert nach Datum/seq), `kassenbericht`
  (Anfangsbestand + Σ Einnahmen − Σ Ausgaben = Endbestand, **laufender Bestand je Zeile**,
  **GoBD-Prüfung „Kasse nie negativ"** mit erster Verstoß-Stelle), `anfangsbestandZeilen`
  (Soll Geldkonto an Haben Saldenvortrag **9000**).
- **`domain/accounts.js`**: neues Konto **9000** Saldenvorträge/Anfangsbestände (rolle
  'saldenvortrag', erfolgs-/USt-neutral). **`anfangsbestand-store.js`**: Bestand je Konto+Jahr.
- **`domain/export.js`**: `buildKassenbuchCsv` (chronologisch, Anfangs-/Endbestand).
- **Ansicht „Kassenbuch"** (`ui/views/kassenbuch.js`, neuer Nav-Eintrag/Route): Geldkonto-/
  Jahr-Wahl, Anfangsbestand speichern + **als Buchungsentwurf**, Kassenbericht-Karte,
  Negativ-Warnung (GoBD), Bewegungstabelle mit laufendem Bestand, Kassenbuch-CSV. i18n de/en.
  SW-Cache `v66` (+4 Module precached).
- **Tests 510/510** (13 neu: Anfangsbestand-Zeilen, chronologische Filterung, Bank ≠ Kasse,
  Bericht-Summen/Endbestand, laufender Bestand, Negativ-Erkennung, CSV).

**Stand:** V4 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
offenes Kassenbuch — **KEINE** zertifizierte TSE/Kassensicherungsverordnung. **Nächstes:**
V5 (USt-VA komplett: Periodentyp + Dauerfristverlängerung + ELSTER-Datenpaket).

---

## 2026-06-16 — V3: Anlagevermögen + AfA + Anlagenverzeichnis [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V3, gleiche Sitzung wie V2)
- **`domain/anlagen.js`** (rein, node-getestet): AfA-Methoden **GWG-Sofortabschreibung**
  (§6 Abs.2, ≤ 800 € netto), **Sammelposten** (§6 Abs.2a, 250–1.000 €, 20 %/J. über 5 J.,
  ohne zeitanteilige Kürzung), **lineare AfA** (§7 Abs.1, **pro rata temporis** monatsgenau im
  Anschaffungs-/Schlussjahr). `klassifiziere`, `afaPlan*`, `anlageStatus`, `anlagenverzeichnis`,
  `afaBuchungZeilen` (Soll 4830/4855 an Anlagekonto), `normalizeAnlage`/`validateAnlage`.
- **`domain/anlagen-store.js`**: Stammdaten-CRUD (Klartext-Records `type:'anlage'`, wie Konten).
- **`domain/export.js`**: `buildAnlagenverzeichnisCsv` (AVEÜR-orientiert).
- **Ansicht „Anlagen"** (`ui/views/anlagen.js`, neuer Nav-Eintrag/Route): Erfassen/Bearbeiten
  (Methodenvorschlag nach Betrag), Anlagenverzeichnis je Wirtschaftsjahr mit Summen,
  **„AfA buchen"** → Buchungsentwurf (Festschreiben bleibt manuell, GoBD), AVEÜR-CSV-Export.
  i18n de/en. SW-Cache `v65` (+3 Module precached).
- **Tests 497/497** (25 neu: Klassifikation, Pläne GWG/linear-prorata/Sammelposten,
  Status, AfA-Buchung, Verzeichnis-Summen, CSV, Normalisierung/Validierung).

**Stand:** V3 vollständig (Logik node-getestet, UI statisch geprüft — nicht headless-E2E).
**Offen/Ehrlich:** AVEÜR-CSV ist AVEÜR-*orientiert* (kein amtliches Formular); GWG-250-€-
Aufzeichnungsgrenze, degressive AfA, Sonderabschreibungen, **Anlagenabgang/Verkauf** nicht
modelliert. **Nächstes:** V4 (Eröffnungs-/Anfangsbestände + GoBD-Kassenbuch).

---

## 2026-06-16 — V2: §13b/Reverse-Charge + EU/Ausland (USt) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V2, „weiter laut PULS")
- **`baueReverseChargeZeilen` (journal.js)** + `UMSATZART`: Steuerschuldumkehr (§13b UStG /
  innergem. Erwerb) bucht **gleichzeitig** abziehbare Vorsteuer (Soll) und geschuldete USt
  (Haben); an den Lieferanten fließt nur der **Netto**-Betrag. Option „nicht abziehbar" →
  USt wird Kostenbestandteil. Buchung ist immer ausgeglichen.
- **Konten (accounts.js):** 1577/1787 (§13b VSt/USt), 1574/1772 (ig Erwerb VSt/USt),
  8125/8120 (steuerfreie ig Lieferung / Ausfuhr) mit neuen `rolle`-Markern; Map
  `REVERSE_CHARGE_KONTEN` + `STEUERFREI_ERLOES_KONTEN`. `store.ensureSeedKonten` zieht die
  Konten in älteren Tresoren nach.
- **USt-VA (export.js `buildUstVa`):** neue Kennzahlen **Kz 46/47/67** (§13b),
  **Kz 89/93/61** (ig Erwerb), **Kz 41/43** (steuerfrei); Kz 83 inkl. RC (hebt sich bei
  vollem Abzug auf). `ustVaToCsv` + Auswertungs-Karte zeigen die Kennzahlen (nur ≠ 0).
- **UI:** Umsatzart-Auswahl im Journal-Formular (Betrag = Netto bei RC). i18n de/en. SW `v64`.
- **Tests 472/472** (28 neu). PR #64 gemergt.

> Hinweis: Branch `claude/v2-ox8bu7` war zunächst auf veraltetem `main` (PR #63 Ist-EÜR);
> Ist-EÜR existierte bereits in `main` → #63 geschlossen, Branch auf `main` zurückgesetzt,
> V2/V3 korrekt umgesetzt.

---

## 2026-06-16 — Profi-Readiness-Fahrplan (V1–V10) + V1 Kontenrahmen

**Was getan**
- **Master-Plan verankert** (PR #60): `OFFENE_PUNKTE.md` Abschnitt „V. PROFI-READINESS" —
  ehrliches Audit + V1–V10 (damit kein Steuerberater/Prüfer wegen fehlender Pflicht-Bausteine
  ablehnt) + Scope-Annahmen (EÜR primär; Bilanz/Lohn eigene Spuren).
- **V1 umgesetzt:** Kontenrahmen 18 → **57 gängige SKR03-Konten** (`accounts.js`); **Konto
  anlegen/bearbeiten/löschen** im UI (`views/accounts.js`) mit `addKonto`/`updateKonto`/`deleteKonto`
  (`store.js`; Nummer unveränderlich, Löschen nur unbenutzt) + reine, node-getestete
  `validateKonto`/`normalizeKonto`. i18n de/en. SW `v62 → v63`.
- **14 neue Node-Tests** → `node tests/run.mjs` **444/444 grün**.

**Ehrlich offen:** UI nicht headless-E2E. Seed ist gängige Auswahl, NICHT vollständiger SKR03 —
weitere Konten frei anlegbar; vor DATEV-Export mit Berater abgleichen. SKR04-Profil später.

**Offen / Nächstes (Master-Plan):** **V2** §13b/Reverse-Charge + EU/Ausland, dann V3 AfA/Anlagen, …
**Details: `docs/OFFENE_PUNKTE.md` Abschnitt V.**

---

## 2026-06-16 — A1-Rest: Persistente Mahnstufe + manuelle Zins-/Gebühren-Erfassung

**Was getan**
- **Reine Logik** `mahnwesen.js` (node-getestet): `letzteMahnstufe`, `vorschlagNaechsteStufe`
  (nächste Stufe aus persistentem Verlauf statt nur aus Überfälligkeits-Tagen; Deckelung bei
  3. Mahnung), `mahnVerlaufSumme`, `mahnStufeLabel`.
- **Store** `crm-store.mahnungErfassen()` — Auftrag führt `mahnungen[]` (Datum/Stufe/Zinsen/
  Gebühren). **Bewusst keine Auto-Steuerlogik.**
- **UI** `reports.js`: Mahn-Karte zeigt „zuletzt gemahnt"; Mahnschreiben mit **editierbaren**
  Verzugszinsen/Mahngebühren (vorbelegt §288) + „Als gesendet vermerken" (zählt Stufe hoch);
  Hinweis, dass die Buchung der Zinsen/Gebühren separat im Journal erfolgt. i18n de/en.
- **8 neue Node-Tests** → `node tests/run.mjs` **430/430 grün**. SW-Cache `v61 → v62`.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. Auto-Buchung von Zinsen/Gebühren
bewusst NICHT (manuell/separat). Offen: Zahlungsziel je Rechnung, Eingangsrechnungs-Verzug
(Gegenseite); A3-Rest (Skonto-Buchung §17, Sammelzahlungen); A4 WorkFloh-Vollanbindung.

**Offen / Nächstes:** Zahlungsziel je Rechnung; A3-Rest; später A4. **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A3-Rest: Forderungs-Teilzahlung (OP-Tracking) + WorkFloh-Andock verankert

**Was getan**
- **Reine Logik** `orders.js`: `auftragGezahlt()`/`auftragOffen()` (node-getestet) — Auftrag führt
  jetzt `zahlungen[]`, offener Rest = Brutto − Teilzahlungen. `zahlungsabgleich.offenePosten`
  liefert den **offenen Rest** (statt Brutto); voll bezahlte „berechnet"-Aufträge fallen heraus.
- **Store** `crm-store.auftragZahlungHinzufuegen()` — erfasst (Teil-)Zahlung, markiert bei
  Ausgleich automatisch „bezahlt". (Browser-Pfad.)
- **UI** `documents.js`: Bankimport-Aktion „◑ Teilzahlung verbuchen" gilt jetzt **auch für
  Forderungen** (Bank an Forderung, Rest bleibt offen); exakte Zahlungen werden ebenfalls als
  Zahlung erfasst (Historie) — gemeinsamer Helfer `zahlungVerbuchen`.
- **Docs:** `OFFENE_PUNKTE.md` **A4 App-Anbindung / WorkFloh-Integration** verankert (Angebote/
  Arbeiten → Rechnung → BLP; als Option, spätere Sitzung; Seam: `importworkfloh.js`/`importWorkFloh`).
- **7 neue Node-Tests** → `node tests/run.mjs` **422/422 grün**. SW-Cache `v60 → v61`.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. Skonto-Buchung §17 weiterhin nur Hinweis;
Sammelzahlungen offen. WorkFloh-**Vollanbindung** bewusst noch nicht gebaut (nur Datei-Import-Seam +
verbindlich dokumentiert).

**Offen / Nächstes:** A3-Rest (Sammelzahlungen, Skonto-Buchung), A1-Rest (persistente Mahnstufe,
Zins-/Gebührenbuchung), später **A4 WorkFloh-Vollanbindung**. **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A1-Rest: B2B/Verbraucher je Kunde (korrekte Verzugszinsen)

**Was getan**
- **Kundenmodell** `crm-store.js`: Flag `istVerbraucher` (Default false = Unternehmer/B2B).
- **Reine Logik** `mahnwesen.kundeIstB2B(kunde)` (node-getestet; Default konservativ B2B).
- **UI** `customers.js`: Checkbox „Verbraucher (Privatperson)" im Kundenformular + Spalte „Art"
  in der Liste. `reports.js`: Mahnschreiben nutzt jetzt den Aufschlag **je Kunde** (Unternehmer
  +9, Verbraucher +5 %-Punkte über Basiszins) und die **40-€-Pauschale nur bei Unternehmern**.
  i18n de/en.
- **5 neue Node-Tests** → `node tests/run.mjs` **415/415 grün**. SW-Cache `v59 → v60`.
  `OFFENE_PUNKTE.md` A1-Teil „B2B/Verbraucher je Kunde" abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. A1-Rest weiterhin offen: **Mahnstufe
persistent** je Forderung, **Buchung** von Zinsen/Gebühren (Konto-Mapping + USt), Zahlungsziel je
Rechnung, Eingangsrechnungs-Verzug (Gegenseite).

**Offen / Nächstes:** A1-Rest (persistente Mahnstufe, Zins-/Gebührenbuchung); A3-Rest
(Forderungs-Teilzahlung, Skonto-Buchung §17, Sammelzahlungen). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A3 (Kern): Teilzahlung/Skonto/Toleranz-Matching im Zahlungsabgleich

**Was getan**
- **Reine Logik** `src/domain/zahlungsabgleich.js`: `findeKandidaten(umsatz, posten, opts)` —
  gerankte Kandidaten mit Art `exakt`/`toleranz` (Rundungs-Cent)/`skonto` (Zahlung knapp unter
  offen, ≤ skontoProzent → **Hinweis**, kein Auto-Buchen)/`teilzahlung` (Rest bleibt offen).
  Überzahlung wird konservativ nicht zugeordnet; Mehrdeutigkeit über Score (Referenz/Name/
  Datumsnähe). `findeOffenePosten` (exakt) bleibt unverändert.
- **UI** `src/ui/views/documents.js`: Bankimport bietet bei Verbindlichkeiten ohne exakten
  Treffer **„◑ Teilzahlung verbuchen"** → bucht gezahlten Betrag (Verbindlichkeit an Bank) +
  `zahlungHinzufuegen` (Rest bleibt offen, erscheint weiter in der OP-Liste); Skonto als Hinweis
  inkl. „USt-Korrektur §17 manuell". i18n de/en.
- **8 neue Node-Tests** → `node tests/run.mjs` **410/410 grün**. SW-Cache `v58 → v59`.
  `OFFENE_PUNKTE.md` A3-Kern abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. **Teilzahlung bei Forderungen** fehlt
(Aufträge führen nur Status, keinen Rest); **Skonto-Buchung mit USt/§17-Korrektur** bewusst nicht
automatisiert; **Sammelzahlungen** (1 Zahlung → mehrere Rechnungen) offen.

**Offen / Nächstes:** A3-Rest (Forderungs-Teilzahlung, Skonto-Buchung, Sammelzahlung); A1-Rest
(Mahnwesen je Kunde/persistent/Buchung). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A2-Anschluss: OP-Liste „Offene Verbindlichkeiten" (Auswertungen)

**Was getan**
- **Reine Logik** `src/domain/payables.js` (node-getestet): `anreichereVerbindlichkeiten`
  (offene Posten + Fälligkeit/Überfälligkeit — nutzt rechnungseigene `faelligAm`, sonst
  Datum + Zahlungsziel, Default 30 Tage; keine Mahnstufe, da eigene Zahlungspflicht),
  `verbindlichkeitenSummen` (Summe/Anzahl + überfällig). Wiederverwendet `mahnwesen.faelligkeit`/
  `tageUeberfaellig`.
- **Export** `export.buildOffeneVerbindlichkeitenCsv` (OP-Liste als CSV, Summenzeile).
- **UI** `src/ui/views/reports.js`: neue Karte **„Offene Verbindlichkeiten (Kreditoren)"**
  (spiegelt „Offene Forderungen & Mahnwesen"): Tabelle Lieferant/Rechnung/Offen/Fällig +
  **Überfällig-Badge**, Summe + überfällige Summe, **CSV-Export-Knopf**. i18n de/en.
- **9 neue Node-Tests** → `node tests/run.mjs` **402/402 grün**. SW-Cache `v57 → v58`.
  `OFFENE_PUNKTE.md` A2-OP-Liste abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E (Kernlogik node-getestet). Noch kein
**Skonto**/Zahlungsbedingungen, kein manuelles Anlegen/Bearbeiten von Verbindlichkeiten
(heute nur via E-Rechnung-Import), Teilzahlungs-Matching = A3.

**Offen / Nächstes:** A3 (Teilzahlungen & unscharfes Matching im Zahlungsabgleich); A1-Rest
(Mahnwesen je Kunde/persistent/Buchung). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A2: Eingangsrechnungen als offene Verbindlichkeiten (Posten-Quelle Zahlungsabgleich)

**Was getan**
- **Reine Logik** `src/domain/payables.js` (node-getestet): `eingangsrechnungZeilen`
  (Eingangsrechnung „auf Ziel": Aufwand + abziehbare Vorsteuer **an** Verbindlichkeiten 1600),
  `eingangsrechnungSummen`/`bruttoVonPositionen`/`rechnungBrutto`, `summeZahlungen`/`offenerBetrag`,
  `rechnungStatus` (offen/teilbezahlt/bezahlt/storniert), **`offeneVerbindlichkeiten`** (offene
  Kreditoren-Posten **im selben Format wie `zahlungsabgleich.offenePosten`**, `richtung:'ausgabe'`
  + `kind:'verbindlichkeit'`, `betragCent`=offener Rest, nach Fälligkeit sortiert),
  `summeOffeneVerbindlichkeiten`, `validateEingangsrechnung`.
- **Store** `src/domain/payables-store.js` (verschlüsselt via `encstore`): CRUD +
  `zahlungHinzufuegen` + `stornoEingangsrechnung` + `offeneVerbindlichkeitenPosten`.
  ⚠️ Browser-Pfad (Vault/IndexedDB) — nicht node-getestet.
- **UI-Einbindung** `src/ui/views/documents.js`: E-Rechnung-Empfang bekommt
  **„+ Als offene Verbindlichkeit erfassen"** (speichert Kreditorenrechnung + bucht „auf Ziel"
  als Entwurf, `buchungRef` verknüpft); **Bankimport** lädt jetzt Forderungen **und**
  Verbindlichkeiten → Ausgangszahlungen matchen offene Verbindlichkeiten (`findeOffenePosten`),
  buchen „Verbindlichkeit an Bank" und vermerken die Zahlung. i18n de/en.
- **40 neue Node-Tests** → `node tests/run.mjs` **393/393 grün**. SW-Cache `v56 → v57`
  (+ `payables.js`, `payables-store.js`). `OFFENE_PUNKTE.md` A2 abgehakt.

**Ehrlich offen / ungetestet**
- UI-Pfade (E-Rechnung-Erfassen, Bankimport-Verbindlichkeits-Abgleich) **nicht headless-E2E**
  getestet (kein Browser) — nur statisch/`node --check`. Kernlogik node-getestet.
- Keine eigene **Verbindlichkeiten-/OP-Liste**-Ansicht; Erfassung bislang aus E-Rechnung-XML
  (nicht aus Foto/PDF-Beleg). Teilzahlungs-/unscharfes Matching = A3 (offen).

**Offen / Nächstes:** Verbindlichkeiten-OP-Liste (Ansicht) + Skonto/Fälligkeit; A3 (Teilzahlungen/
unscharfes Matching); A1-Rest (Mahnwesen: B2B/VB je Kunde, persistente Mahnstufe, Buchung
Zinsen/Gebühren). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — Mahnwesen (A1-Kern): Fälligkeit/Überfälligkeit + Verzugszinsen + Mahnschreiben

**Was getan:** `src/domain/mahnwesen.js` (neu, rein/getestet): `faelligkeit`, `tageUeberfaellig`,
`mahnstufe` (Erinnerung→1./2./3. Mahnung), `verzugszinsenCent` (§288 BGB: B2B +9, Verbraucher +5
%-Punkte über Basiszins, zeitanteilig), `mahnpauschaleCent` (40 € B2B), `anreicherePosten`,
`ueberfaelligSummen`, `mahnschreibenDaten` (Zinsen/Pauschale erst ab „1. Mahnung"). UI: Auswertungen-
Karte **„Offene Forderungen & Mahnwesen"** (überfällig-Badge + Summe) mit **druckbarem
Mahnschreiben**. Settings `zahlungszielTage` (14) + `verzugBasiszinsProzent` (§247 BGB). i18n de/en,
`.badge-warn`-Style, SW `v55→v56`. **+20 Tests → 353/353 grün.**

**Ehrlich offen (OFFENE_PUNKTE A1):** B2B/Verbraucher global (nicht je Kunde); Mahnstufe nur
abgeleitet (nicht persistent); Buchung der Zinsen/Gebühren als Ertrag fehlt; Basiszinssatz muss
manuell aktuell gehalten werden; UI nicht headless-E2E.

---

## 2026-06-16 — Merkliste angelegt: docs/OFFENE_PUNKTE.md (inkl. Mahnwesen)

**Was getan (Nutzerwunsch):** Lebende Backlog-/Merkliste `docs/OFFENE_PUNKTE.md` angelegt —
unbedingt-beachten/nacharbeiten/verbessern, priorisiert (MUSS/SOLL/KANN). **Hochprioritär &
ausführlich: Mahnwesen / überfällige Forderungen** — Fälligkeit je Rechnung, automatische
Überfällig-Markierung (Dashboard/OP-Liste), Mahnstufen, Verzugszinsen (§288 BGB), Mahngebühren,
Mahnschreiben (druckbar), Buchung; zuerst reine node-testbare Kernlogik. Plus: Verbindlichkeiten
als OP-Quelle, Teilzahlungen, KoSIT-Validierung, ZUGFeRD, Format-Härtung, NER, E2E u. a.
Aus PULS verlinkt (§7.0 + Doku-Map). Reine Doku.

---

## 2026-06-16 — Klarstellung: Nicht-EU-KI ist dormant, nicht auswählbar

**Was getan (Nutzer-Korrektur):** Die Strategie-Formulierung in `docs/PULS.md` §0★ und
`docs/TRANSPARENZ_ZWISCHENSTAND.html` §0a/§8 präzisiert: **aktive KI-Nutzung bleibt strikt EU**
(Vision EU + Mistral EU, CLAUDE.md §8 unverändert). **Nicht-EU-Anbieter sind NICHT zur Auswahl
freigegeben** — nur als ruhende, strukturelle Option im Gerüst gedacht. „freie Anbieterwahl"
zuvor missverständlich → jetzt: Flexibilität **innerhalb der EU**; Nicht-EU-Öffnung nur per
ausdrücklicher, gesonderter Produktentscheidung. Reine Doku.

---

## 2026-06-16 — Zahlungsabgleich: offene Posten + Matching + Ausgleichsbuchung

**Was getan:** `src/domain/zahlungsabgleich.js` (neu, rein/getestet): `offenePosten(auftraege)`
(offene Forderungen aus Aufträgen mit Status „berechnet"), `findeOffenePosten(umsatz, posten)`
(konservativ: gleiche Richtung + exakter Betrag; Bewertung über Rechnungsnummer im Zweck +
Kundenname + Datumsnähe), `zahlungsBuchungZeilen()` (Einnahme → Bank an Forderung; Ausgabe →
Verbindlichkeit an Bank). Neuer Auftrags-Status **`bezahlt`** (orders.js + Flow). UI: Bank-Import
zeigt je passendem Umsatz „✓ Zahlung auf Rechnung …" → bucht Ausgleich + markiert Auftrag bezahlt;
sonst der normale Kategorisierungs-Vorschlag. SW `v54→v55`. **+10 Tests → 333/333 grün.**

**Ehrlich offen:** Verbindlichkeiten-Posten (Eingangsrechnungen) noch nicht als Quelle erfasst
(Logik ist richtungsneutral vorbereitet); **Teilzahlungen / unscharfes Matching** nicht abgedeckt
(nur exakter Betrag); UI nicht headless-E2E. Damit ist die Ist-EÜR §4(3) praktisch nutzbar
(Geldfluss ↔ offene Rechnungen), aber kein vollständiges OP-Management.

---

## 2026-06-16 — Bankimport (Schritt 2): CAMT.053 + Format-Weiche

**Was getan:** `src/domain/bankimport.js` um **CAMT.053** (ISO-20022-XML) erweitert: `parseCAMT()`
(namespace-tolerant, `<Ntry>` → Betrag/Soll-Haben/Valuta/Verwendungszweck/Gegenpartei — Cdtr bei
Lastschrift, Dbtr bei Gutschrift) liefert dasselbe Umsatz-Modell wie `parseMT940`. Neu
`erkenneBankformat()` + `parseBankauszug()` (Auto-Erkennung MT940/CAMT). UI (`documents.js`) nutzt
jetzt den einheitlichen Einstieg + akzeptiert `.xml`; i18n de/en; SW `v53→v54`. **+9 Tests →
323/323 grün** (CAMT-Parsing inkl. Richtung/Gegenpartei, Format-Weiche).

**Ehrlich offen:** keine vollständige ISO-20022-Validierung; **echter Zahlungsabgleich** (Matching
auf offene Forderungen/Verbindlichkeiten → Bank-gegen-Forderung-Buchung statt Erlös/Aufwand) ist
der direkt nächste Schritt und macht die Ist-EÜR §4(3) + offene Posten komplett.

---

## 2026-06-16 — Strategie verankert: Pseudonymisierung als Schlüssel-Enabler

**Was getan (auf Nutzerwunsch, „sehr wichtig"):** Den strategischen Kern festgehalten und
priorisiert — *Komfort UND Datenschutz zugleich* als Wettbewerbsvorteil; Vertrauen durch
technischen Beleg statt Reputation. Pseudonymisierung = **Schlüssel-Enabler (Bau-Schritt 1,
bereits gebaut)**, der freie Anbieterwahl im Einfach-Modus, einen Privat-/Bürger-Modus und das
Vertrauen freischaltet. Verankert in `docs/PULS.md` (neues §0★ Leitbild/Priorität) und in
`docs/TRANSPARENZ_ZWISCHENSTAND.html` (neuer Abschnitt §0a). 
**Offen/Entscheidung:** P2 (KI-Anbieterwahl je Modus) berührt die strenge EU-KI-Regel
(CLAUDE.md §8) → Produktentscheidung des Nutzers nötig, bevor gebaut wird.

---

## 2026-06-16 — Doku: Transparenz-/Zwischenstands-HTML aktualisiert

**Was getan:** Die kanonische, druckbare Transparenz-Doku `docs/TRANSPARENZ_ZWISCHENSTAND.html`
(vom Nutzer bereitgestellt, war veraltet: 134 Tests, Pseudonymisierung/AVV „geplant") ehrlich auf
den aktuellen Stand gebracht: **314/314 Tests**; Pseudonymisierung (§6) als **gebaut** markiert und
**wahrheitsgemäß als anker-basiert** beschrieben (nicht NER — diese Klarstellung war wichtig);
AVV (Art. 28/32) ✓; neuer §7 **E-Rechnung (erzeugen+empfangen) + Bankimport MT940**; P-Liste
(P1 ✓, P5 ✓, P7 teilweise) und §9-Stand aktualisiert. Druck-Button → PDF. Build-frei, keine
externen Ressourcen. Meine zwischenzeitlich erstellte `STATUS.html` wieder entfernt (konsolidiert).

**Ehrlich:** reines Doku-Artefakt; Statusangaben gespiegelt aus PULS/SESSIONS/ROADMAP, kein Test.

---

## 2026-06-16 — Bankimport (Schritt 1): MT940-Parser → Buchungsvorschläge

**Was getan**
- **`src/domain/bankimport.js`** (neu, rein/getestet): `parseMT940(text)` liest SWIFT-MT940
  (:25: Konto, :61: Umsatzzeile inkl. C/D/RC/RD-Vorzeichen + Valuta, :86: Verwendungszweck
  inkl. mehrzeiliger Fortsetzung + ?32/?33-Gegenname) → normalisierte Umsätze
  {valuta, betragCent, richtung, zweck, gegen}. `umsatzExtraktion()` mappt aufs
  `ai/extract`-Format (Richtung kommt verbindlich aus dem Auszug, USt-Satz offen).
- **UI:** Karte „Bankauszug importieren (MT940)" in Belegen (`documents.js`): Datei wählen →
  Umsatzliste → je Umsatz „→ Buchungsentwurf" (categorize auf Zweck, Richtung aus Auszug
  überschreibt, `buildVorschlag`, Vorschlagskarte). i18n de/en, CSS, SW `v52→v53`.
- **+11 Tests** (Lastschrift/Gutschrift, IBAN, Valuta, Zweck/Gegenname, mehrzeiliger :86:,
  Extraktion, leerer Auszug) → **314/314 grün**.

**Ehrlich offen / NICHT geprüft:** übliche MT940-Felder abgedeckt, KEINE vollständige
SWIFT-Validierung (exotische Bank-Dialekte können abweichen); UI nicht headless-E2E. USt-Satz
aus reinem Zahlungsfluss nicht ableitbar (Nutzer/Heuristik ergänzt). **Folgeschritte:**
CAMT.053 (XML, via vorhandenes block/tag-Muster), **echter Zahlungsabgleich** auf offene
Forderungen/Verbindlichkeiten (macht Ist-EÜR §4(3) + offene Posten komplett).

---

## 2026-06-16 — E-Rechnung (Schritt 2): Empfang/Einlesen (CII + UBL) → Vorschlag

**Was getan**
- **`src/domain/erechnungLesen.js`** (neu, rein/getestet): `parseEingangsrechnung(xml)` liest
  eine eingehende XRechnung in **beiden** Syntaxen (UN/CEFACT **CII** und OASIS **UBL**),
  namespace-tolerant über lokale Element-Namen + Block-Scoping (Verkäufer/Summen/Steuer).
  Extrahiert Nummer, Datum (102→ISO), Lieferant, Netto/USt/Brutto (Cent), USt-Satz, Format,
  Confidence. `eingangsrechnungExtraktion()` mappt aufs `ai/extract`-Format →
  bestehender `buildVorschlag` nutzbar. `erkenneFormat()`.
- **UI:** Karte „E-Rechnung empfangen (XRechnung XML)" in Belegen (`documents.js`): .xml wählen
  → parsen → Lieferant via `categorize` → Buchungsvorschlag (Vorschlagskarte, Autonomie/
  Datenschutz-Modus greifen mit). i18n de/en. SW `v51→v52` (+ `erechnungLesen.js` precached).
- **+15 Tests** → **303/303 grün**, darunter **CII Round-Trip** (eigene Erzeugung wieder
  eingelesen) und ein handgeschriebenes **UBL**-Beispiel + Unbekannt-Format-Fall.

**Ehrlich offen / NICHT geprüft:** best-effort Text-/Regex-Extraktion (kein Schema-Parsing,
kein CDATA/Kommentar-Handling), **nicht KoSIT-validiert**; **ZUGFeRD-PDF wird nicht ausgepackt**
(nur reine XML); UI nicht headless-E2E. Mehrsatz-Eingangsrechnungen werden auf einen
USt-Satz/Vorschlag vereinfacht (Entwurf, Nutzer prüft). **Folgeschritte:** ZUGFeRD-PDF-Extraktion
(PDF/A-3, evtl. nicht build-frei); Bankimport (CAMT/MT940) + Zahlungsabgleich.

---

## 2026-06-16 — E-Rechnung (Schritt 1): XRechnung/CII-Erzeugung aus Rechnung

**Was getan**
- **`src/domain/erechnung.js`** (neu, rein/getestet): `baueXRechnungCII(rechnung)` erzeugt aus
  dem vorhandenen Rechnungs-Dokument (`baueRechnung`) eine **UN/CEFACT CII-XML**, Profil
  EN16931/XRechnung 3.0 — mit Kern-Pflichtfeldern (Rechnungsnr. BT-1, Datum BT-2, Leistungs-
  datum, Verkäufer/Käufer + Adressen, USt-IdNr. BT-31, IBAN BT-84, Steueraufschlüsselung je
  Satz, Summen). `splitAdresse()` zerlegt Freitext-Adressen best-effort; XML-Escaping;
  Kleinunternehmer → Kategorie „E" + §19-Befreiungsgrund. `xRechnungDateiname()`.
- **UI:** Download-Knopf „XRechnung (XML)" im Rechnungs-Dokument (`orders.js`, `downloadText`).
  i18n de/en. SW `v50→v51` (+ `erechnung.js` precached).
- **+19 Tests** (Adress-Split, Regelfall 19%+7% inkl. Tag-Balance/Wohlgeformtheit & Escaping,
  Kleinunternehmer) → **288/288 grün**.

**Ehrlich offen / NICHT geprüft:** **NICHT gegen den KoSIT-Validator/Schematron geprüft**
(kein Validator in der Bau-Umgebung) — daher „XRechnung-**orientiert**", vor echtem Versand
validieren. Freitext-Adress-Split ist heuristisch (PLZ/Ort). UI-Download nicht headless-E2E.
**Folgeschritte:** ZUGFeRD (CII in PDF/A-3 einbetten — braucht PDF-Lib, evtl. nicht build-frei);
XRechnung-**Empfang** (eingehende XML parsen → Buchungsvorschlag); Bankimport (CAMT/MT940).

---

## 2026-06-16 — Datenschutz-Modi: AVV-Hinweis (Art. 28/32 DSGVO) — Topic abgeschlossen

**Was getan:** „Recht & Doku" (`ui/views/legal.js`) DSGVO-Sektion um zwei Punkte ergänzt:
**Auftragsverarbeitung (Art. 28)** — Anbieter (Google Cloud Vision, Mistral AI) sind bei
aktiver EU-KI Auftragsverarbeiter; Nutzer muss vor produktiver Nutzung mit Personendaten den
AVV/DPA abschließen, bleibt Verantwortliche/r. **Pseudonymisierung als techn. Maßnahme
(Art. 32)** — beschreibt den Datenschutz-Modus. SW `v49→v50`. Tests unverändert **269/269**
(reine Doku-Strings, keine Logik). **Datenschutz-Modi damit funktional rund** (KONZEPT §6.3).

**Ehrlich:** reine in-App-Doku, kein automatischer Test; AVV/DPA-Abschluss liegt beim Nutzer.

---

## 2026-06-16 — Datenschutz-Modi: Transparenz (§6.3) — Bericht + Vorschau

**Was getan**
- **`pseudonym.maskierungsBericht(map)`** (rein, getestet): fasst zusammen, wie viele
  Identifikatoren ersetzt wurden, aufgeschlüsselt nach Typ — **ohne Klartextwerte** (nur
  Zähler; Typ notfalls aus der Token-Form `[[TYP_N]]` abgeleitet).
- **Transparenz-Vorschau in Belegen** (`documents.js`): bei aktivem Datenschutz-Modus zeigt
  die Vorschlagskarte ein aufklappbares „🛡 N Identifikatoren pseudonymisiert an die EU-KI
  gesendet (2× Person, 1× Firma …)" samt **Vorschau des tatsächlich gesendeten Textes**
  (deterministisch dieselbe Maskierung wie der Versand). i18n de/en, CSS, SW `v48→v49`.
- **+5 Tests** → **269/269 grün**.

**Ehrlich offen / NICHT geprüft:** `maskierungsBericht` node-getestet; die UI-Vorschau
(documents.js) ist **nicht headless-E2E** geklickt. Vorschau gilt für den Kontierungs-
Belegtext (Hauptversand); die Berater-Begründung maskiert separat (kein eigener Badge).
Folgeschritte (KONZEPT §6.3): AVV-Hinweis im Datenblatt; Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 2: Pipeline-Verdrahtung + Modus

**Was getan**
- **Kritische Review von `src/ai/pseudonym.js`** → gehärtet (alle Round-Trips waren schon
  korrekt): opt-in **Wortgrenzen-Modus** (`{wortgrenze:true}`, Unicode-`\p{L}` korrekt für
  ä/ö/ü/ß) gegen Teilwort-Treffer (z.B. „Anna" in „Annahme"); **First-Char-Index** (Perf statt
  O(Text×Anker)); gemeinsames **`ANKER_TYP`**-Vokabular. Standard bleibt exakt (datenschutz-
  sicherste Richtung). +7 Tests.
- **`src/ai/anker.js`** (neu): `baueAnker({kunden,mitarbeiter,firma})` (rein, getestet) baut
  typisierte Anker (PERSON/FIRMA/EMAIL/IBAN/USTID/STEUERNR/ADRESSE), entdoppelt, < 3 Zeichen
  verworfen; `ladeAnker()` zieht CRM + Firmenprofil (Browser/IndexedDB).
- **Verdrahtung:** `mistral.categorize(text, idx, {anker})` maskiert den GESENDETEN Belegtext
  (Antwort `{konto,richtung}` → kein reidentify); `berater.begruendeBuchung(kontext, {anker})`
  maskiert Beschreibung/Belegtext und **re-identifiziert** die formulierte Antwort.
  Lokale Extraktion/Vorschlag laufen weiter auf dem ECHTEN Text.
- **Setting** `datenschutzModus` (`aus`|`pseudonym`, Default `aus`) in `state.js`; Umschalter in
  Einstellungen (`shell.js`) + i18n de/en; `documents.js` lädt Anker nur bei `pseudonym` und
  reicht sie an beide KI-Aufrufe. SW-Cache `v47→v48` (+ `pseudonym.js`/`anker.js` precached).
- **Konzept nachgereicht:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (Modi + Bau-Reihenfolge §6).
- **+11 Tests** (baueAnker, Wortgrenze, Belegtext-Komposition) → **264/264 grün**.

**Ehrlich offen / NICHT geprüft:** reine Logik node-getestet; `ladeAnker()`, Settings-Schalter
und documents.js-Verdrahtung **nicht headless-E2E**, Mistral nicht live getestet. Over-Masking-
Restrisiko bei sehr kurzen/gängigen Namen (Wortgrenze mildert, Round-Trip bleibt verlustfrei).
Folgeschritte (KONZEPT §6.3): maskierten Text vor Senden anzeigen (Transparenz), AVV-Hinweis,
Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 1: Pseudonym-Logik

**Was getan**
- Reines Logik-Modul **`src/ai/pseudonym.js`** angelegt (Datenschutz-Modi, Bau-Schritt 1):
  `tokenize()` ersetzt **exakte** bekannte Identifikatoren (Anker) durch **stabile** Token
  `[[TYP_N]]`, `reidentify()` macht es verlustfrei rückgängig. Longest-Match (überlappende
  Anker), Sonderzeichen-/Regex-sicher (Links-nach-rechts-Scan, kein Regex), Token-Nummern
  je Typ in Reihenfolge des ersten Auftretens, optionales `createRegistry()` für
  aufrufsübergreifend stabile Token, `normalizeAnchors()` (entdoppelt, Typ-Normalisierung).
  Kein Netz, keine Krypto im Modul — reine Abbildung; Übertragung bleibt opt-in.
- **23 Node-Tests** in `tests/run.mjs` ergänzt; nach Merge mit main → **246/246 grün**
  (Round-Trip, stabile Token, Longest-Match, Sonderzeichen, Register-Stabilität inkl.
  Präfix-Sicherheit `_1` vs `_11`, Objekt-Map in `reidentify`).
- main war beim PR-Merge weit voraus (223 Tests, SW v47, neue Module rechnung/pruefung/
  rechtsregeln/berater/importworkfloh); sauber zurückgemergt, alle Tests beider Seiten erhalten.

**Hinweis zur Vorlage:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (§6 Bau-Reihenfolge) existiert im
Repo (noch) nicht — gebaut wurde strikt nach der selbsttragenden Aufgaben-Spezifikation.
(`PULS.md §0 Brainstorming` existiert inzwischen auf main.) Diese Lücke ehrlich offen lassen.

**Offen / Nächstes:** Konzept-Doku `docs/KONZEPT_DATENSCHUTZ_MODI.md` nachreichen (Modi +
Bau-Reihenfolge festschreiben); Bau-Schritt 2 = Anker-Quelle aus CRM/verschl. Speicher
(`crm-store`) + Verdrahtung in die KI-Pipeline **vor** `ai/mistral.js` (Kontierung) und
`ai/berater.js` (Steuer-Assistent), mit opt-in/Bestätigung; reidentify auf die KI-Antwort.
**Nicht im Browser E2E getestet** — Kernlogik node-getestet.

---

## 2026-06-14 — EÜR nach Zufluss/Abfluss (§4 Abs.3 EStG, Ist-Prinzip)

**Was getan**
- `src/domain/taxes.js`: NEU `computeEURIst(buchungen, idx, periode, opts)` — Betriebseinnahmen/
  -ausgaben beim **Geldfluss** (§11 EStG, brutto), gerechnet aus Geldkonten-Bewegungen
  (Kasse/Bank). Erfasst direkte Barbuchungen **und Zahlungen früher gebuchter Rechnungen**
  (Forderung/Verbindlichkeit) zum Zahlungszeitpunkt; Privateinlagen/-entnahmen (Eigenkapital)
  zählen nicht. Reine, node-getestete Funktion.
- Reports: zusätzliche Karte „EÜR nach Zufluss/Abfluss (§4 Abs.3)"; bestehende periodengerechte
  EÜR bleibt als Soll-Sicht. i18n de/en. SW-Cache `v32→v33`.
- `tests/run.mjs`: +5 (Abfluss-Ausgabe, Rechnung zählt nicht, Zahlung als Einnahme, Privateinlage
  ausgeschlossen, Entwurf/Periode). **Gesamt 208/208 grün**.

**Verifiziert:** `node tests/run.mjs` → 208/0; `node --check`.
**EHRLICH:** vereinfachtes Ist-Modell für die üblichen Buchungsstile; Sonderfälle (durchlaufende
Posten, Anzahlungen, Sachentnahmen) nicht abgebildet — im Zweifel Berater. Geldkonten-Set
(1000/1200) und Forderung/Verbindlichkeit (1400/1600) per opts konfigurierbar.

---

## 2026-06-14 — DATEV-EXTF formkonform gehärtet (Konto/Gegenkonto + Steuerschlüssel)

**Was getan**
- `src/domain/export.js`: NEU `buildDatevExtf()` — **EXTF-Envelope** (Header `"EXTF";700;21;
  "Buchungsstapel";…` + Spaltenüberschriften) + Datenzeilen im **Konto/Gegenkonto-Brutto-Modell**.
  NEU `datevBuchungssatz()` (rein, testbar) verdichtet USt-Split-Buchungen zu EINEM Brutto-Satz
  mit **BU-/Steuerschlüssel** (SKR03: Vorsteuer 9/8, Umsatzsteuer 3/2), Belegdatum als TTMM.
- Reports-Export-Button nutzt jetzt EXTF (`EXTF_Buchungsstapel_*.csv`), Label „DATEV (EXTF)".
  Altes `buildDatevCsv` bleibt erhalten.
- SW-Cache `v31→v32`. `tests/run.mjs`: +7. **Gesamt 203/203 grün**.

**Verifiziert:** `node tests/run.mjs` → 203/0; `node --check`.
**EHRLICH (wichtig):** KEIN vollständig zertifiziertes 116-Spalten-EXTF. Steuerschlüssel-Mapping
deckt Standardsätze (0/7/19 %) ab und ist Kontenrahmen-/Versionsabhängig — **vor Übergabe mit
Berater/DATEV verifizieren**.

---

## 2026-06-14 — WorkFloh-Import (Empfangsseite) + Anleitung + ISO/IEC-Beleg + PW-Layout

**Was getan (mehrere PRs):**
- **Gebrauchsanleitung** als Menüpunkt „Anleitung" (Installations- + Schritt-für-Schritt-Teil)
  mit **Copy-Buttons** für Splitscreen. Hinweis „Beispieltexte…" in App-Grün/fett.
- **ISO/IEC-Beleg** im Siegel — korrekt als **Anbieter**-Zertifizierung (Google Cloud/Mistral),
  nicht als Eigen-Zertifikat. „Passwort ändern"-Layout (einspaltig + Abstand).
- **WorkFloh-Import (Empfangsseite)**: `src/domain/importworkfloh.js` (rein, node-getestet)
  + `crm-store.importWorkFloh` (Dedupe über externId/externNummer, USt-Ergänzung, Status
  „angelegt"); UI-Karte in Aufträgen („Aus WorkFloh importieren", JSON). Felder `externId`
  (Kunde) / `externNummer` (Auftrag) ergänzt. **Schema-Vertrag**: `docs/WORKFLOH_IMPORT.md`
  (WorkFloh exportiert dorthin — „Verknüpfung mit Buchhaltungssoftware"). +7 Node-Tests.

**Ehrlich offen:** WorkFloh-Repo war in dieser Sitzung nicht zugänglich (Scope + 403) → Schema
unilateral von BookLedgerPro definiert; WorkFloh-Seite muss darauf exportieren (oder Repo/Beispiel
nächste Sitzung). Import-Persistenz (IndexedDB) nur UI-testbar; Mapping node-getestet. SW `v47`,
Tests **223/223**.

---

## 2026-06-14 — Deckblatt/Siegel, neue 3D-Assets & „Passwort ändern" (Envelope-Krypto)

**Was getan (mehrere PRs):**
- **Deckblatt/Datenblatt** vor dem Login + Menüpunkt „Über" + **Konformitäts-Siegel** (nur
  nachprüfbare Aussagen: EU-Datenresidenz Vision EU/Mistral EU, AES-GCM-256 lokal, DSGVO/GoBD,
  Links zu echten Compliance-Programmen — KEIN erfundenes Zertifikat). Siegel auch in Recht & Doku.
- **Neue 3D-Assets:** ornamentaler Schlüssel (`onboard-key.png`) beim Passwort-Festlegen;
  Mycel-Buch-**Titelbild** (`cover.png`) oben aufs Deckblatt.
- **Tresor auf Envelope-Verschlüsselung umgestellt** (`src/core/vault.js`): zufälliger DEK
  verschlüsselt alle Daten, Passwort-KEK „wickelt" nur den DEK ein. **„Passwort ändern"** in
  den Einstellungen wickelt den DEK neu ein → **keine Daten-Neuverschlüsselung, Mandant-ID &
  Shamir bleiben stabil**. Alt-Tresore (v1) werden beim Entsperren **transparent migriert**
  (Daten unberührt, gleiche Mandant-ID). +6 Node-Tests (Envelope wrap/unwrap/PW-Wechsel).

**Ehrlich offen:** Bilder sind groß (~2 MB, optional optimieren). Envelope: bestehende v1-Migration
ist im Code node-getestet auf Krypto-Ebene; die DB-/Browser-Migration selbst nicht headless-E2E.
SW-Cache → `v42`, Tests **216/216**.

---

## 2026-06-14 — Geführter Browser-Sichttest (DeX/Chrome) + 5 Live-Fixes

**Was getan:** Kompletter, gemeinsam mit dem Nutzer durchgeführter Sichttest der neuen Features
auf der deployten PWA. **Bestätigt:** Beleg→Buchung-Pipeline end-to-end (Erkennung→Kontierung
4930/1576/1200, Konf. 90 %, Auto-Entwurf), Plausibilität/Spielraum, Entwurf-Lebenszyklus
(speichern/bearbeiten/löschen/festschreiben/storno), KI-Begründung mit §-Bezug (Mistral EU),
§14-Rechnung druckbar (Nr. 2026-0001), USt-Verprobung/EÜR-Ist/USt-VA/Audit/DATEV-EXTF,
Zeiterfassung (Std-Summe + Kosten korrekt).

**Im Test gefunden & sofort behoben (gemergt #23–#27):**
1. Storno-Endlos-Kaskade → Storno-Gegenbuchung nicht erneut stornierbar (#23).
2. KI-Begründung nannte Konto-Namen falsch → echte Kontierung mit Namen an Mistral (#24).
3. Firmenprofil „Gespeichert ✓" erschien nicht (Re-Render) → Flag überlebt Re-Render (#25).
4. Auftrag: Position entfernen fehlte + Status-Etikett umgebrochen (#26).
5. „Steuer-Assistent (Claude)/Anthropic" veraltet → **Mistral (EU)**; tote Claude-Keys raus (#27).

**Erkenntnis (kein Bug):** „0 h/0 €" beim Mitarbeiter war ein **Duplikat** „Klaus Nitzsche";
der korrekte zeigt 41h 40m / 1.250 € — Summen/Kosten rechnen korrekt.

**Verifiziert:** alles live im Browser bestätigt; `node tests/run.mjs` → 210/210; SW `v38`.
**Offen:** EXTF/EÜR-Ist sind vereinfacht (nicht zertifiziert); ELSTER-Einreichung weiterhin nur
Datenpaket; Sage 5b–d. Optional: Kleinbetrag-`betragCent` an KI-Begründung der UI verdrahten.

---

## 2026-06-14 — Rechtsregel-Set erweitert (mehr §-Grundlagen für KI-Berater)

**Was getan**
- `src/domain/rechtsregeln.js`: +7 kuratierte Regeln — Arbeitszimmer/Homeoffice (§4(5) 6b/6c),
  Fortbildung (§4(4)), Anlagevermögen/AfA >800 € (§7), Betriebsveranstaltung 110 € (§19(1)1a),
  nicht abziehbar: Bußgelder/privat (§4(5)8 / §12), Kleinbetragsrechnung ≤250 € (§33 UStDV,
  betragsbasiert). Bessere Grounding-Abdeckung für `begruendeBuchung`.
- `tests/run.mjs`: +5 (Fortbildung, Arbeitszimmer, Bußgeld, Kleinbetrag-Grenze). **196/196 grün**.

**Verifiziert:** `node tests/run.mjs` → 196/0; `node --check`.
**Hinweis:** UI reicht aktuell `betragCent` nicht an `begruendeBuchung` → Kleinbetragsregel greift
nur, wenn der Betrag mitgegeben wird (Logik vorhanden, optionale UI-Verdrahtung später).

---

## 2026-06-14 — Rechnungsdokument mit §14-UStG-Pflichtangaben (ausstellbare Rechnung)

**Was getan** (wichtige Produkt-Lücke: bisher nur Buchung, kein Rechnungsdokument)
- NEU `src/domain/rechnung.js` (rein, node-getestet): `baueRechnung({auftrag,kunde,firma,nummer,
  datum,leistungsdatum,kleinunternehmer})` → strukturiertes Dokument (Positionen mit Netto,
  Steuerzeilen je Satz, Summen, Kleinunternehmer-Variante ohne USt); `pflichtangaben(rechnung)`
  prüft § 14 Abs. 4 UStG (Aussteller-Name/Anschrift, Steuernr./USt-IdNr., Empfänger, Datum,
  fortlaufende Nummer, Leistungsbeschreibung, Leistungsdatum, Steuerausweis); `formatRechnungsnummer`.
- `crm-store`: **fortlaufende Rechnungsnummer** (`naechsteRechnungsnummer`, kv `rechnungSeq`,
  Format JAHR-NNNN) — bei `rechnungAusAuftrag` vergeben + `rechnungNummer`/`rechnungDatum` am Auftrag.
- **Firmenprofil** (`settings.firma`: name, anschrift, steuernummer, ustId, iban) — Formular in
  den Einstellungen (verschlüsselt gespeichert).
- **Orders-UI:** Knopf „Rechnung anzeigen" → druckbares Rechnungs-Dokument (window.print),
  §14-Lücken als Hinweis, Kleinunternehmer-Hinweis. Print-/Layout-CSS.
- i18n de/en; SW-Cache `v30→v31`, `rechnung.js` in CORE_ASSETS.
- `tests/run.mjs`: +11 (Aufbau, Summen mehrerer Sätze, Pflichtangaben vollständig/unvollständig,
  Kleinunternehmer, Nummern-Format). **Gesamt 191/191 grün**.

**Verifiziert:** `node tests/run.mjs` → 191/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Rechnungs-UI/Druck nicht headless-E2E geklickt; `naechsteRechnungsnummer`/
Firmenprofil-Persistenz nutzen IndexedDB/Vault (nicht node-getestet, Logik minimal).

**Offen / Nächstes:** EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifizieren; Regel-Set erweitern.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Entwurf bearbeiten & löschen (geschlossene Lücke im Bedien-Lebenszyklus)

**Was getan** (Feinschliff: wichtige Bedien-Lücke)
- Entwürfe konnten angelegt, aber weder **gelöscht** noch **bearbeitet** werden (durch die
  „immer speicherbar"-Änderung verschärft). Jetzt:
  - `store.deleteEntwurf(id)` — löscht nur Entwürfe (festgeschrieben → nur Storno).
  - `journal.formularAusBuchung(buchung, idx)` — **reine, node-getestete** Rekonstruktion der
    Formularfelder (Soll/Haben/Brutto/USt) aus den Zeilen, inkl. USt-Split-Erkennung.
  - Journal-Tabelle: pro Entwurf Knöpfe **Bearbeiten** (Formular vorbefüllen, speichert per id
    in-place) und **Löschen**; Formular-Titel/Button passen sich an; **Abbrechen** im Edit-Modus.
- i18n de/en; SW-Cache `v29→v30`.
- `tests/run.mjs`: +6 `formularAusBuchung` (Ausgabe/Einnahme mit USt, ohne USt, Notizfelder).
  **Gesamt 180/180 grün**.

**Verifiziert:** `node tests/run.mjs` → 180/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Journal-UI (Edit/Delete-Knöpfe) nicht headless-E2E geklickt; `deleteEntwurf`
nutzt IndexedDB (nicht node-getestet) — Logik ist aber minimal und analog zu bestehenden Pfaden.

**Offen / Nächstes:** EÜR §4(3) + DATEV-EXTF; Regel-Set erweitern. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Berater im Beleg-Vorschlag (documents.js) konsistent

**Was getan** (Abrundung des KI-Berater-Features)
- Beleg-Vorschlag (Foto/PDF & Schnellerfassung) zeigt jetzt ebenfalls ein **Begründungs-
  Feld mit §-Bezug**: on-device aus `rechtsregeln.js` vorbefüllt (kein Netz), per Knopf
  „KI-Begründung" über Mistral (EU, opt-in) verfeinerbar; wird mit dem Entwurf gespeichert
  (`saveEntwurf({begruendung})`). Quelltext (OCR/Eingabe) fließt als Kontext ein.
- SW-Cache `v28→v29`. Keine neuen Module/Logik → bestehende **174/174 Tests** weiter grün.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check src/ui/views/documents.js`.
**Nicht verifiziert:** UI nicht headless-E2E geklickt (reine Wiring-Änderung; genutzte Logik
`onDeviceBegruendung`/`begruendeBuchung` ist node-getestet).

**Offen / Nächstes:** Regel-Set erweitern; EÜR §4(3) + DATEV-EXTF (eigener PR). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Berater mit Rechts-Grundlage (Begründung/Notiz mit §-Bezug)

**Was getan** (eigener PR nach Merge von #15)
- **Grounding statt Halluzination:** NEU `src/domain/rechtsregeln.js` — kuratiertes lokales
  Regel-Set (Bewirtung §4(5)2, Geschenke §4(5)1, GWG §6(2), Kfz-Privatnutzung §6(1)4,
  Telekommunikation, Reisekosten, Kleinunternehmer §19) mit Paragraph + Kurzregel +
  Doku-Hinweis. `findeRechtsregeln(kontext)` + `onDeviceBegruendung(kontext)`.
- **KI-Berater:** NEU `src/ai/berater.js` — `begruendeBuchung(kontext)` schlägt eine kurze
  Begründung MIT §-Bezug vor (Eigenbeleg/Notiz, „parat fürs Finanzamt"). Über Mistral (EU,
  BYOK) wird nur FORMULIERT, gegroundet auf die Regeln; ohne Mistral On-Device-Fallback aus
  den Regeln. `buildBegruendungMessages`/`parseBegruendung` rein & node-getestet. Disclaimer
  „keine Steuerberatung". Nutzer entscheidet/editiert.
- **Datenmodell:** `begruendung`-Feld an der Buchung (`store.js saveEntwurf`); in die GoBD-
  Hash-Kette aufgenommen, aber **rückwärtskompatibel** (nur gehasht wenn vorhanden →
  Altbestände behalten ihren Hash). `audit.js hashedFields` entsprechend angepasst.
- **UI Journal:** Begründungs-Textfeld + Knopf „KI-Begründung vorschlagen" (zeigt Quelle
  Mistral/on-device), Anzeige 📝 in der Tabelle. i18n de/en. SW-Cache `v27→v28`,
  `rechtsregeln.js`+`berater.js` in CORE_ASSETS, 56 JS-Module.
- `tests/run.mjs`: +12 (Rechtsregeln, Prompt/Parser, On-Device-Fallback). **174/174 grün**.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral-Begründung im Browser; das neue Journal-UI
(Begründungsfeld/KI-Knopf) nicht headless-E2E geklickt. Regel-Set ist bewusst kompakt
(erweiterbar), KEINE abschließende Rechtsberatung/Aktualitätsgarantie.

**Offen / Nächstes:** Regel-Set erweitern; Begründung auch im Beleg-Vorschlag (documents);
EÜR §4(3) Zufluss/Abfluss + zertifiziertes DATEV-EXTF. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — USt-Verprobung + Kleinunternehmer-Schalter (Berater-Substanz)

**Was getan** (Folge-Batch zur Profi-Härtung, gleiche PR-Branch)
- **USt-Verprobung** (`src/domain/taxes.js` → `verprobeUSt`): reiner Berater-Check, der die
  GEBUCHTE Vor-/Umsatzsteuer mit der aus Netto×Satz ERWARTETEN vergleicht (pro Buchung/Satz
  gerundet → keine Rundungs-Fehlalarme). Deckt vergessene/falsch gerechnete USt auf. In den
  Auswertungen als grün/rot-Karte (`verprobungCard`) mit „gebucht / erwartet (Abweichung)".
- **Kleinunternehmer-Schalter (§19 UStG)**: `kleinunternehmer` in den Einstellungen
  (Ja/Nein-Segment), `state.js`-Default `false`. Wird an `pruefeBuchung`/`buildVorschlag`
  durchgereicht → unterdrückt die USt-„vergessen"-Hinweise für §19-Nutzer.
- **Audit-Kette war bereits sichtbar** (Dashboard-Badge + Reports `auditCard` via
  `verifyAuditChain`) — nichts dupliziert.
- i18n de/en (reports.verprobung*, settings.kleinunternehmer, common.yes/no). SW-Cache `v26→v27`.
- `tests/run.mjs`: +6 `verprobeUSt`. **Gesamt 162/162 grün**.

**Verifiziert:** `node tests/run.mjs` → 162/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** neue UI (Verprobungs-Karte, Kleinunternehmer-Segment) nicht
headless-E2E geklickt. **EÜR §4(3)/DATEV** und **KI-Berater mit Rechts-Grundlage** sind als
eigene Folge-PRs geplant (zu groß für diesen Batch — Ehrlichkeits-Vertrag).

**Offen / Nächstes:** KI-Berater (Begründung/Notiz-Feld + kuratiertes Regel-Set
`rechtsregeln.js` + Prompt + UI); EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifiziert.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Profi-Härtung mit Spielraum: Kontoart-Richtung + Plausibilitäts-Hinweise

**Was getan**
- `src/ai/mistral.js`: neue reine, node-testbare Funktion **`resolveKategorie(parsed, kontoIndex)`**.
  Die Buchungs-**Richtung** (einnahme/ausgabe) wird jetzt VERBINDLICH aus der Kontoart
  abgeleitet (ERTRAG→einnahme, AUFWAND→ausgabe) statt der Modell-Antwort blind zu trauen.
  Folge: ein vom Modell falsch gelabeltes Erlöskonto („ausgabe") kann **keine falsche
  Soll/Haben-Buchung** mehr erzeugen. Nicht-Erfolgskonten (z.B. Bank 1200) werden
  abgelehnt → On-Device-Heuristik greift. `categorize()` nutzt jetzt diese Funktion.
- **Profi-Substanz mit Spielraum** (Leitlinie des Nutzers: „hart wie Diamant, aber
  bedienerfreundlich, mit Spielraum — keine Haken beim Eintragen, trotzdem Berater-tauglich"):
  - NEU `src/domain/pruefung.js` — reine `pruefeBuchung(buchung, idx, opts)` trennt **harte
    Fehler** (validateBuchung, nur festschreibe-relevant) von **nicht-blockierenden Hinweisen**:
    USt vergessen (nur Erlös/Output-VAT, low-noise), Zukunftsdatum, Datum vor letzter
    Festschreibung (zeitgerecht), fehlender Buchungstext, Soll=Haben-Konto;
    `opts.kleinunternehmer` unterdrückt USt-Hinweise. Plus `istFestschreibbar()`.
  - **Haken entfernt:** Journal-Formular speichert Entwürfe jetzt IMMER (vorher blockierte
    `validateBuchung` das Speichern); `buildVorschlag()` liefert IMMER einen Vorschlag (mit
    `fehler`/`warnungen` als Metadaten) statt `ok:false`. Streng bleibt nur `festschreiben()`.
  - **Hinweise sichtbar, Profi entscheidet:** Journal zeigt gelbe Hinweis-Karte nach dem
    Speichern; Festschreiben fragt bei Warnungen nach („… Trotzdem festschreiben?"); Beleg-
    Vorschlagskarte zeigt Hinweise. i18n (de/en) + `.hinweis`-Style. SW-Cache `v25 → v26`,
    `pruefung.js` in CORE_ASSETS, 54 JS-Module.
- `tests/run.mjs`: +6 `resolveKategorie`, +4 Vorschlag-Spielraum, +13 `pruefeBuchung`/
  Plausibilität. **Gesamt 156/156 grün** (vorher 134).

**Verifiziert:** `node tests/run.mjs` → 156 bestanden, 0 fehlgeschlagen; `node --check` für alle
geänderten UI-Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral im Browser; die neuen UI-Hinweise (Journal-Karte,
Festschreib-Dialog, Beleg-Karte) sind **nicht headless-E2E** geklickt — nur Logik node-getestet.
Kein Kleinunternehmer-Schalter in den Einstellungen (opts vorhanden, UI-Toggle offen).

**Offen / Nächstes:** Browser-Sichttest der Pipeline + neuer Hinweise; optional Kleinunternehmer-
Schalter in Einstellungen; Sage 5b. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Setup-Politur + Nachfolge-Brief

**Was getan**
- KI-Einstellungen: **„Verbindung testen"**-Knöpfe (Vision/Mistral), Direktlinks zur
  Schlüssel-Erstellung, Schritt-Anleitung + „Vision-API aktivieren"-Link, Persistenz-Hinweis,
  **Klartext-Fehlerhinweise** (`visionFehlerHinweis`: Vertex/Agent-Key, Referrer, API nicht
  aktiv, Abrechnung, Key ungültig). SW bis `v25`.
- **`docs/PULS.md` angelegt** — zentraler Nachfolge-Brief/Stand-Schnappschuss; in `CLAUDE.md`
  als Pflicht-Andockpunkt verankert.

**Live verifiziert (Nutzer-Sichttest):** Vision (EU) **aktiv ✓** + Mistral (EU) **aktiv ✓**.
Gelöst: Vertex/Agent-Express-Key taugt nicht für Vision → Standard-Cloud-Vision-Key nötig.

**Offen / Nächstes:** Beleg→Buchung-Pipeline im Browser durchklicken; Sage 5b (Spore in-app
erzeugen + Hub-Registrierung). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — EU-KI-Umstellung (Google Vision EU + Mistral EU)

**Was getan (auf Nutzerwunsch, Vorbild Mein-WorkFloh)**
- **Beleg-Texterkennung nur noch über Google Cloud Vision — EU-Endpoint** (`ai/vision.js`,
  `eu-vision.googleapis.com`): Bild → `images:annotate`, PDF → `files:annotate`,
  `DOCUMENT_TEXT_DETECTION`. **Kamera/Foto/Scanner/PDF** im Belege-Upload (`pickFile` mit
  `capture`).
- **Textsortierung/Kontierung + Steuer-Assistent über Mistral (EU)** (`ai/mistral.js`,
  `api.mistral.ai/v1`, OpenAI-kompatibel), mit **On-Device-Heuristik-Fallback**.
- Claude-Provider entfernt (`ai/provider.js` gelöscht); neue verschlüsselte Config
  `ai/aiConfig.js` (Vision-Key + Mistral-Key + Modell). Settings, documents- und reports-
  View angepasst. `taxAssist.js` nutzt jetzt Mistral.
- Tests **134/134** (Vision-Request/Parser, Mistral-Prompt/Parser). SW-Cache `v21`.
- CLAUDE.md Regel 8 + `docs/AI.md` auf EU-Stack umgestellt.

**Offen / Grenzen (ehrlich)**
- Vision-/Mistral-Pfade nicht gegen Live-APIs getestet (kein Schlüssel/Netz); reine
  Logik node-getestet. CORS/Live erst im echten Browser mit Schlüssel prüfen.

---

## 2026-06-14 — Phase 6.1: Bild-Assets / Branding

**Was getan**
- Vom Nutzer generierte 3D-Render-Bilder eingebunden (Teal/Mint-Marke):
  - **PWA-Icons**: `icon-192/512`, `maskable-512`, `apple-touch-icon`, `favicon-32`
    (Manifest + `index.html` + SW-Cache).
  - **Hero** `hero-lock.png` (transparent) am Sperrbildschirm; `shell()` nimmt jetzt ein
    **kontextabhängiges** Hero-Bild → Onboarding zeigt `onboard-key/-shamir/-backup`.
  - **7 Leerzustände** (`empty-*`) via neuer `emptyState`-Komponente in Journal/Belege/
    Kunden/Aufträge/Mitarbeiter/Auswertung/Mycel-Netz.
  - **`og-image.png`** (opak, Wortmarke als echter Text) + OG/Twitter-Meta-Tags.
- Bild-Aufbereitung mit Pillow (Alpha-Erhalt, Flood-Fill/weiche Matte gegen weiße/
  eingebackene Karo-Hintergründe). SW-Cache bis `v20`.

**Stand**
- Vollständiges, konsistentes Marken-Bildset; alle referenzierten Bilder vorhanden,
  121/121 Tests grün, i18n vollständig.

**Offen / Grenzen (ehrlich)**
- Lighthouse/Performance ungemessen (kein Headless-Browser); Browser-UI nicht E2E-getestet
  → **Sichttest** als nächster Schritt.

---

## 2026-06-14 — Phase 6: Design-Politur & Bilder

**Was getan**
- `domain/summary.js` (rein, getestet): Dashboard-Jahres-Kennzahlen (Ertrag/Aufwand/
  Überschuss/USt-Zahllast/festgeschrieben/Entwürfe).
- `ui/views/dashboard.js`: KPI-Karten + Zähler (Belege/Kunden/Aufträge) + Audit-Status +
  Schnellaktionen. Ersetzt das statische Dashboard.
- `ui/mycelCanvas.js`: dezente, animierte Mycel-Fäden am Sperrbildschirm — **additiv**
  (Browser-Lehre 8), `prefers-reduced-motion`-bewusst, beendet sich beim Entfernen aus DOM.
- Barrierefreiheit: Skip-Link, `:focus-visible`, `aria-current`/`aria-live`, `role=main`,
  Fokus-Ring-Token.
- Tests **121/121**; i18n-Vollständigkeit ok; SW-Cache `v7`.

**Stand**
- Visuell deutlich aufgewertet; Dashboard zeigt echte Zahlen; A11y-Grundlagen vorhanden.

**Offen / Grenzen (ehrlich)**
- **Echte promptgenerierte Bilder** (KI-Bildgenerierung) sind in dieser Umgebung nicht
  möglich → Hero/Illustrations-Assets bleiben offen (Phase 6.x).
- **Lighthouse/Performance** nicht gemessen (kein Headless-Browser).
- **Mycel-Canvas + alle UI** nicht headless E2E-getestet — nur statisch geprüft.

**Nächstes** — offene Sage-Schritte (5b/c/d, menschlich vermittelt) und/oder
Bild-Assets/Performance (6.x); ein manueller Browser-Durchlauf bleibt empfohlen.

---

## 2026-06-14 — Phase 5: Sage-Mycel-Symbiose (lokale Andock-Vorbereitung)

**Was getan**
- SBKIM-Protokoll `src/sbkim/`: `spore.js` (Ed25519-Keygen, Spore-Bau, Verifikation §11.2,
  kanonische Form §11.1, `id==base64url(SHA256(pubkey))`), `identity.js` (verschlüsselte
  Identität), `domainvector.js` (deterministischer `_demo`-Vektor 384-dim, §11.5),
  `signal.js` (SIGNAL.json §11.6).
- **Headless-Verifizierer** `tools/verify_remote_spore.mjs` (node:crypto, zero-dep).
- Ansicht „Mycel-Netz": Identität erzeugen, spore.json/SIGNAL.json herunterladen, fremde
  Spore prüfen. `sbkim/README.md` + Templates (SIGNAL, AUSTAUSCH).
- Tests **113/113** inkl. Verifizierer-Paar-Einigkeit (Browser ↔ headless) und
  Manipulationsprobe. SW-Cache `v6`.

**Wichtig (extern, gegenkontrolliert):** Mein nodeId-Derivat und die §11.1-Signatur wurden
gegen eine **echte Geschwister-Spore (Mein-Tresor)** geprüft → **VALID**. Format ist also
byte-kompatibel zum Netz.

**Stand**
- Andock ist **lokal vorbereitet**; kein fremdes Repo verändert.

**Offen / Grenzen (ehrlich)**
- **Keine echte `spore.json` im Repo** — sie wird in-app mit dem privaten Schlüssel erzeugt
  und vom Nutzer committet (kein erfundenes Signatur-File).
- `domainVector` ist `_demo` → nur `verified-spore`, nicht `verified-match` (echtes
  Embedding/Transformers.js = Phase 5c).
- Hub-Registrierung + Handshake = menschlich vermittelter Schritt (Phase 5b, fremde Repos).
- Symbiose-Import (Tresor/WorkFloh → Buchungen) = Phase 5d.
- Browser-UI nicht headless E2E-getestet.

**Nächstes** — Phase 5b/c/d (s.o.) bzw. Phase 6 (Design-Politur & Bilder).

---

## 2026-06-14 — Phase 4: Steuer & Export

**Was getan**
- `domain/export.js` (rein, getestet): Journal-CSV, DATEV-orientierte CSV, USt-VA-Kennzahlen
  (Kz 81/86/66/83), EÜR-CSV; CSV-Escaping + Cent→Komma.
- `ai/taxAssist.js`: Steuer-Assistent (opt-in Claude), sendet nur aggregierte Kennzahlen
  (Datenminimierung). Nicht live getestet.
- UI `reports.js`: USt-VA-Kennzahlen-Karte, Export-Buttons (CSV/DATEV/USt-VA/EÜR),
  Drucken→PDF (Print-CSS), Steuer-Assistent (wenn Claude konfiguriert).
- `ui/views/legal.js` + Nav „Recht & Doku": GoBD-Verfahrensdokumentation + DSGVO in-app,
  Betroffenenrechte (verschlüsselter Export, vollständiges Löschen).
- `docs/legal/Verfahrensdokumentation.md` + `docs/legal/Datenschutz.md`.
- Tests **98/98**; i18n-Vollständigkeit ok; SW-Cache `v5`.

**Stand**
- Steuerliche Aufbereitung (USt-VA-Kennzahlen, EÜR) + Exporte + Recht/Doku vorhanden.
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- DATEV = orientiert, kein zertifiziertes EXTF; **keine** ELSTER-Einreichung (nur Datenpaket).
- „PDF" = Browser-Druck (keine PDF-Bibliothek).
- Claude-Pfade (Belegerkennung, Steuer-Assistent) nicht live getestet.
- Browser-UI nicht headless E2E-getestet.

**Nächstes (Phase 5)** — Sage-Mycel-Symbiose: SBKIM-Client (Modul 09 kopieren),
Ed25519-Identität, `spore.json`, Synchronisationsvereinbarung/Briefkasten
(`docs/SAGE_SYNC_BRIEFKASTEN.md`), Symbiose (Belege aus Tresor, Aufträge aus WorkFloh).

---

## 2026-06-14 — Phase 3: Aufträge, Kunden, Mitarbeiter, Kostenstellen

**Was getan**
- Domäne (rein, getestet): `orders.js` (Positionen, Summen über mehrere USt-Sätze,
  Status-Flow), `invoicing.js` (Ausgangsrechnung → Buchungszeilen, mehrere Sätze),
  `employees.js` (Zeit-Summen/Kosten), `costcenters.js` (Auswertung je Kostenstelle).
- Verschlüsselter generischer Store `encstore.js` + `crm-store.js` (Kunden, Aufträge,
  Mitarbeiter, Zeiten verschlüsselt = DSGVO; Kostenstellen als Klartext-Stammdaten).
- Rechnung → automatische Buchung (`rechnungAusAuftrag` → Buchungs-Entwurf, Auftrag
  „berechnet"); Festschreiben bleibt manuell (GoBD).
- UI: Ansichten Kunden / Aufträge (Positionen-Editor, Status, Rechnung→Buchung) /
  Mitarbeiter+Zeiterfassung; Kostenstelle-Auswahl im Journal; Kostenstellen-Auswertung
  in der Auswertung. Nav erweitert.
- Tests **85/85**; i18n-Vollständigkeit ok; SW-Cache `v4`.

**Stand**
- Voller Auftrags-/CRM-Kreis: Kunde → Auftrag → Rechnung → Buchung; Zeiterfassung;
  Kostenstellen-Auswertung. Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser): alle Phase-1–3-
  Ansichten sind statisch geprüft, aber nicht klickend verifiziert → einmal manuell
  durchgehen.
- Rechnung erzeugt bisher kein PDF-Dokument (nur Buchung); PDF-Rechnung später.

**Nächstes (Phase 4)** — Steuer & Export: Steuer-Assistent (opt-in), USt-VA/EÜR-
Aufbereitung, Export (PDF/CSV, DATEV-CSV, ELSTER/ERiC-Datenpakete), DSGVO/GoBD-Doku in-app.

---

## 2026-06-14 — Phase 2: Belege & Erkennung (Kern)

**Was getan**
- Verschlüsselter Beleg-Store `domain/documents.js` (AES-GCM, Bild/PDF, Metadaten +
  Verknüpfung zu Buchungen).
- On-Device-Pipeline (rein, getestet): `ai/extract.js` (Betrag/Datum/USt/Vendor aus Text),
  `ai/categorize.js` (Schlüsselwort → SKR03-Konto + Richtung), `ai/suggest.js`
  (ausgeglichener Buchungssatz inkl. USt-Aufteilung).
- Externe KI `ai/provider.js`: Claude-Vision per BYOK (neueste Modelle), opt-in,
  verschlüsselter Schlüssel, Bestätigung vor Versand.
- UI `ui/views/documents.js`: Upload, Schnellerfassung aus Text, KI-Extraktion; **Autonomie-
  Schalter wirksam** (Vorschlag/Entwurf/auto). KI-Settings (BYOK) in Shell.
- Bugfix: doppelte Cent-Konvertierung in `baueBuchungZeilen` (nimmt jetzt `bruttoCents`).
- Tests **65/65**; i18n-Vollständigkeit geprüft; SW-Cache `v3`.
- `docs/AI.md` (KI-Konzept + ehrliche Grenzen).

**Stand**
- Beleg→Buchungsvorschlag funktioniert on-device (Text) und via Claude-Vision (BYOK).
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Lokales OCR (Tesseract.js) NICHT eingebunden** — Bild→Text nur via Claude-Vision/Text.
- **Embeddings (Transformers.js) ausstehend** — derzeit Schlüsselwort-Heuristik.
- **Claude-API-Pfad nicht live getestet** (kein Schlüssel/Netz).
- **Browser-UI nicht headless E2E-getestet.**

**Nächstes (Phase 3)** — Aufträge/Kunden/Mitarbeiter/Kostenstellen (WorkFloh-Domänenmodell),
Rechnung → automatische Buchung.

---

## 2026-06-14 — Phase 1: Buchhaltungs-Kern

**Was getan**
- Domänenlogik (rein, node-getestet): `domain/money.js` (Cent-genau, dt. Format),
  `domain/accounts.js` (SKR03-Auswahl, Konto-Arten, Saldo-Logik), `domain/journal.js`
  (doppelte Buchführung mehrzeilig, USt-Aufteilung brutto→netto+USt, Storno-Spiegelung),
  `domain/audit.js` (kanonische Form wie Sage §11.1, Hash-Kette, `verifyChain`),
  `domain/taxes.js` (Saldenliste, USt-Voranmeldung, EÜR vereinfacht, Periodenfilter).
- Persistenz `domain/store.js`: Konten-Seed, **verschlüsselte** Buchungen (AES-GCM mit
  Sitzungs-Key), **GoBD-Festschreibung** (lückenloser Nummernkreis + Hash-Kette),
  unveränderlich, Korrektur nur per `storno()`.
- UI: Ansichten Konten/Journal/Auswertung (`ui/views/*`), Neue-Buchung-Formular mit
  autom. USt-Konto-Wahl, Festschreiben/Storno, Audit-Status. In Shell + Nav verdrahtet.
- Tests erweitert auf **45/45** (inkl. Integration Festschreiben+Storno+Kette).
- SW-Cache auf `v2` gebumpt + neue Module precached (Browser-Lehre 4).

**Stand**
- Voll funktionsfähiger Buchhaltungs-Kern (Konten, Buchen, USt/EÜR, GoBD-Audit), Kernlogik
  echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser in der Umgebung):
  DOM/IndexedDB/Verschlüsselungs-Pfad ist sorgfältig gebaut + statisch geprüft, aber nicht
  klickend verifiziert. Erste reale Sitzung: Onboarding → Buchung → Festschreiben → Storno
  → Auswertung manuell durchklicken.
- Strenge §4-Abs.3-EStG-EÜR + Kostenstellen-UI später (Phase 3/4).

**Nächstes (Phase 2)** — Belege & Erkennung (verschlüsselter Beleg-Store, OCR lokal,
Extraktion → Buchungsvorschlag, KI-Autonomie-Schalter wirksam).

---

## 2026-06-14 — Phase 0: Fundament

**Was getan**
- Repo-Gerüst angelegt (build-frei, native ES-Module, PWA-Manifest, App-SW mit
  versioniertem Cache).
- Krypto (`src/core/crypto.js`): AES-GCM-256, PBKDF2 (600k), SHA-256, base64url.
- Shamir GF(256) (`src/core/shamir.js`): Split/Combine + Share-Kodierung.
- IndexedDB (`src/core/db.js`): KV/Records/Files, DB-Suffix `bookledgerpro`, Dump/Wipe.
- Datendurabilität (`src/core/durability.js`): `storage.persist()`, Quota, Backup-Status.
- Tresor (`src/core/vault.js`): Setup/Unlock, Sitzungs-Key, verschlüsselte Settings,
  Mandant-ID. Backup (`src/core/backup.js`): bauen/lesen/importieren.
- UI: DOM-Helfer, i18n (de/en), Theme (hell/dunkel/system), Mycel-Marke, Sperrbildschirm
  + Onboarding (Passwort → Shamir → erzwungenes erstes Backup), App-Shell mit Modus- und
  KI-Autonomie-Schaltern + Durabilitäts-Banner + Mandant-Indikator.
- Node-Smoke-Test (`tests/run.mjs`) für Krypto + Shamir, CI-Workflow.
- Docs: README, ARCHITECTURE, ROADMAP, CLAUDE/AGENTS, SAGE_BROWSER_LEHREN.

**Stand**
- App bootet, Onboarding/Unlock/Settings funktionieren lokal. Buchhaltungs-Kern noch leer
  (Ansichten Konten/Journal/Belege sind Platzhalter).

**Nachtrag (gleiche Sitzung)**
- Sage-**Synchronisationsvereinbarung & Briefkasten** analysiert (INTERFACES §11) und als
  `docs/SAGE_SYNC_BRIEFKASTEN.md` verankert (SIGNAL.json seq/ack, AUSTAUSCH-Postfächer,
  Inbox-Konvention, Signier-Norm, Start-/End-Ritual). In CLAUDE/ROADMAP/ARCHITECTURE/README
  verlinkt. Wird ab Phase 5 Pflicht.

**Offen / Nächstes (Phase 1)**
- Kontenplan + Buchungssätze (doppelte Buchführung), Journal, EÜR/USt.
- GoBD: Festschreibung, Storno, Audit-Hash-Kette (`core/audit.js`), Nummernkreise.
