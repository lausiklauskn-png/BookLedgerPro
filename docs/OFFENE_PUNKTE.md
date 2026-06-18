# OFFENE PUNKTE — unbedingt beachten · nacharbeiten · verbessern

> **Lebende Merkliste.** Hier wird festgehalten, was wichtig ist, noch fehlt, nachgearbeitet
> oder verbessert werden muss — damit über Sitzungen hinweg nichts verloren geht. Ergänzt
> `ROADMAP.md` (Phasen), `docs/PULS.md` (Stand/Leitbild) und `docs/SESSIONS.md` (Verlauf).
> Erledigte Punkte abhaken und ins SESSIONS-Log verschieben. Letzte Pflege: **2026-06-18** (BAUPLAN Block 1/Schritt 2b — Test-Modus **Store-Glue** `core/sandboxStore.js`, PR #120; SW `v105`, 1132/1132). Davor: Schritt 2a Sandbox-Kern (PR #118), Schritt 1 Roundtrip-Selbsttest (PR #116).

Legende: **[MUSS]** wichtig/rechtlich oder für Kernnutzen · **[SOLL]** deutlicher Mehrwert ·
**[KANN]** später/optional.

---

## ★ Nutzer-Entscheidungen (2026-06-17) — verbindlich für den weiteren Bau
Der Profi-Readiness-Fahrplan **V1–V10 ist abgeschlossen.** Folgende Richtungs-Entscheidungen
gelten ab jetzt (Reihenfolge der Umsetzung legt die jeweilige Sitzung fest; **Freibrief: je Punkt
ein PR, bei grüner CI selbstständig mergen**):
- **ELSTER: JA — „Download oder Weiterleiten per Link".** Kein eingebauter ERiC-Direktversand
  (nicht build-frei). Stattdessen: ELSTER-Datenpaket herunterladen **+ Weiterleitungs-Link auf die
  Anbieter-Seite (elster.de)**. ✅ erste Stufe umgesetzt (Link in „USt-VA je Zeitraum").
- **Mehrmandantenfähigkeit: JA** — eigener großer PR (DB-Suffix `bookledgerpro` NICHT ändern →
  Mandanten-Namespace innerhalb des Tresors / pro Tresor; sauber trennen).
- **Bilanzierung (GmbH/OHG, GuV + Bilanz): JA** — eigener großer PR (V-Bilanz).
- **AVV-Verträge: abschließen/umsetzen** — ✅ In-App-Links zu Google-/Mistral-DPA in „Recht & Doku"
  (Vertragsabschluss selbst bleibt organisatorische Nutzer-Aufgabe).
- **Angebote & Kalkulation (Werbetechnik): JA, geplant — Design steht.** Eigener großer Bereich,
  **NACH** den laufenden BLP-Schritten zu bauen. Verbindliche Bau-Grundlage: **`docs/KALKULATION_KATALOG.md`**
  (Kostentreiber-Matrix, Rechenformel, adaptiver Baukasten-UX, Nummernkreis-Bridge Angebot→Rechnung,
  selbstlernende Vor-/Nachkalkulation, BLP als Vorbereitungs-/Kontrollschicht für DATEV, Mehrrechner/Sync).
  **Prime Directive:** Kalkulation rein intern, Angebot/Rechnung neutral nach außen. Offene Entscheidung
  vor Baubeginn: **Nummernkreis-Hoheit** (stellt BLP die Rechnung aus oder DATEV/Steuerberater?) — gelöst
  als **Onboarding-Setting `rechnungsstelle` `blp|extern`** (Default `blp`), Katalog §7a.
- **Datensicherung — wählbare 3-2-1-Strategie (Pflicht #1): JA, Anforderung steht.** Verbindliches Doku:
  **`docs/DATENSICHERUNG.md`** (Stellen: BLP intern · verschlüsselter gewählter Ordner re-importierbar ·
  Server/Offsite; **freie Nutzer-Wahl `backupStrategie`** beim Onboarding + in Einstellungen änderbar;
  **Backup→Restore-Roundtrip-Selbsttest** als beweisbare Prüfung). Backup-Kern existiert bereits
  (`core/backup.js`, verschlüsselte `.blpr.json`, Shamir, persist).
  ✅ **Schritt 1 (Roundtrip-Selbsttest) erledigt + gemergt (PR #116, 2026-06-18):** `core/backup.js`
  `backupRoundtripSelbsttest` (byte-genauer Vergleich Original↔wiederhergestellt), in den „Selbsttest" (V10)
  gehängt; +15 Node-Tests (1095/1095), SW `v103`. **Verbleibend:** Schritt 2 Test-Modus, Schritt 3 Backup-UX +
  `backupStrategie`, Schritt 4 Server-/Offsite-Ziel.
- **Test-Modus (Sandbox-Tresor): JA, Spec steht.** Verbindliches Doku: **`docs/TEST_MODUS.md`** (wegwerfbarer
  Test-Tresor über die Mehrmandanten-Schicht; mehrere getrennte Tests, behalten/verwerfen/aufräumen, optional
  Demo-vorbefüllt; echte Daten unberührt; build-frei/node-testbar). **WICHTIG:** Auch **Mein-WorkFloh** soll
  einen Test-Modus nach dieser Spec bekommen (⇄-Abschnitt im Doku; eigenes Repo, über den Nutzer).
  ✅ **2a Sandbox-Kern (rein) erledigt + gemergt (PR #118, 2026-06-18):** `domain/mandanten.js`
  (`erstelleSandbox`/`dbNameFuer({sandbox})`/`istSandboxDbName`/`echteMandanten`/`sandboxMandanten`/
  `entferneAlleSandboxes`/`verwaisteSandboxDbs` …).
  ✅ **2b Store-Glue erledigt + gemergt (PR #120, 2026-06-18):** `core/sandboxStore.js`
  (`erstelleSandboxTresor`/`wechsleZuSandbox`/`leereSandboxTresor`/`loescheSandboxTresor`/`loescheAlleSandboxes`
  + `raeumeVerwaisteSandboxesAuf` Boot-Aufräumen via `indexedDB.databases()`, in `main.js` verdrahtet); reine
  Helfer `sandboxDbNamen`/`aktiveDbName` node-getestet; `wechsleAktivenMandant` nutzt jetzt `dbNameVon`.
  SW `v105`, 1132/1132. **Verbleibend:** 2c UI (Tests-Bereich + dauerhafter TEST-MODUS-Banner +
  behalten/verwerfen-Dialog + optional Demo-Vorbefüllung).
- **★ GESAMT-BAUPLAN nächste Phase:** **`docs/BAUPLAN.md`** — geordnete Reihenfolge aller vereinbarten Themen
  (Block 1 Vertrauen/Sicherheit: Roundtrip-Selbsttest → Test-Modus → Backup-UX/`backupStrategie`; Block 2
  Kalkulation/Angebote fein geschnitten; Block 3 später/blockiert). **Arbeitsweise:** mehrere saubere PRs pro
  Sitzung wo sinnvoll (nicht zwingend 1/Sitzung).

**Festgelegte Bau-Reihenfolge (je eigener PR, Freibrief-Merge):**
1. ✅ ELSTER-Weiterleitungs-Link + AVV-Anbieterlinks (klein) — *diese Sitzung*.
2. ✅ §19-Kleinunternehmer-Abfrage im Onboarding (Punkt 27) — *erledigt*.
3. ✅ Abweichendes Wirtschaftsjahr (Punkt 28) — *erledigt*.
4. ✅ Steuerberater-Übergabe-/Datenblatt (Punkt 31) — *erledigt*.
5. ✅ Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung (Punkt 29) — *erledigt*.
6. ✅ ZUGFeRD-Empfang (PDF→CII) + KoSIT-Pflichtfeld-Precheck — *erledigt* (ZUGFeRD-Erzeugen offen, PDF-Lib).
7. ✅ A4 (erweitert) **Stufe 1 + Stufe 2 erledigt:** offenes Austauschformat (`domain/connect.js`) —
   **Import UND Export** (Aufträge-Ansicht) + **verbundene-App-Link** (Einstellungen, reziprok zu
   WorkFloh) + `docs/CONNECT.md`. **Stufe 2 (R4, PR #95):** **Rechnungs-Übernahme** (fertige Rechnung →
   Forderung/Buchung) über `rechnung`-Block (Format v2), `invoicing.rechnungsUebernahmeEntwurf`.
   **R4-Rest ✅:** **Zahlungs-/Teilzahlungs-Übernahme** über `rechnung.zahlungen[]` (Format v3),
   `invoicing.zahlungsUebernahmeEntwurf` (Bank an Forderung) + (Teil-)Zahlung am Auftrag. **Offen:** API/Push-Echtzeit.
8. Mehrmandantenfähigkeit (groß).
9. Bilanzierung / V-Bilanz (groß).
10. ELSTER-Stufe 2 / Restpunkte B/C nach Bedarf.

### Neu aufgenommene Klein-/Folgepunkte (aus Brainstorming-Abgleich)
- [x] **27 — §19-Kleinunternehmer-Abfrage im Onboarding** ✅ (Schritt zwischen Shamir &amp; Backup,
      `lock.js stepProfil`, speichert `kleinunternehmer`; in Einstellungen weiter änderbar). [erledigt]
- [x] **28 — Abweichendes Wirtschaftsjahr** ✅ (`domain/geschaeftsjahr.js`: `wjPeriode`/
      `wirtschaftsjahrVon`/`wjBeginnYYYYMMDD`; Setting `wirtschaftsjahrBeginn` MM-TT; Dashboard +
      DATEV-EXTF-WJ-Beginn nutzen es; USt-VA bleibt bewusst kalendarisch). 10 Tests. [erledigt]
- [x] **29 — Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung** ✅ (`domain/aufbewahrung.js`:
      `aufbewahrungBis`/`istAufbewahrungspflichtig`/`darfBelegLoeschen`, §147 AO 10 J.; `belegRef`
      wird beim Beleg→Entwurf in die Buchung (Hash-Kette) gesetzt + `linkBeleg` rückwärts; Belege-
      Liste zeigt „aufbewahren bis", Löschen verknüpfter Belege blockiert, Frist-Warnung). 7 Tests. [erledigt]
- [x] **31 — Steuerberater-Übergabe-Datenblatt** ✅ (`export.buildUebergabeText`; Karte „Übergabe an
      den Steuerberater" in „Berichte": Firmenprofil/Zeitraum/USt-VA/EÜR + mitzugebende Dateien; Druck→PDF / TXT). [erledigt]

---

## V. PROFI-READINESS — Vollständigkeits-Fahrplan (echte Buchhaltung)

> **Ziel (Nutzer 16.06.):** Die Buchhaltung soll für eine **echte Firma** taugen, ohne dass ein
> Steuerberater/Buchhalter/Betriebsprüfer sie wegen **fehlender Pflicht-Bausteine sofort ablehnt**.
> Daher: lückenlos, Schritt für Schritt, nichts auslassen. Diese Liste ist der **verbindliche
> Master-Plan**; sie wird oben in `PULS.md §7` als oberste Priorität referenziert.
>
> **Annahmen (Scope, explizit — sonst ändern!):** primär **EÜR** (Freiberufler/Kleinunternehmer/
> Einzelunternehmer, §4 Abs.3 EStG), **Kalenderjahr**, **1 Mandant**. **Bilanzierung (GmbH, GuV/
> Bilanz)** und **Lohnbuchhaltung** sind **bewusst eigene große Spuren** (V-Bilanz / V-Lohn) — für
> eine EÜR-Firma nicht zwingend; Lohn macht i. d. R. separate Software/der Berater.
>
> Status aus Audit (2026-06-16): ✅ vorhanden · ◑ teilweise · ❌ fehlt.

**Bereits solide vorhanden (Fundament):** doppelte Buchführung mehrzeilig + USt-Split
(`journal.js`), **GoBD**-Festschreibung/Hash-Kette/Storno/lückenloser Nummernkreis (`store.js`,
`audit.js`), USt-VA-Kern (Kz 81/86/66/83), **EÜR Soll + Ist** (§4 Abs.3, `taxes.js`), Rechnung
§14-Pflichtangaben (`rechnung.js`), E-Rechnung XRechnung-CII (`erechnung.js`), Bankimport MT940/
CAMT + Zahlungsabgleich, **Offene Posten Debitoren/Kreditoren + Mahnwesen** (§288). Firmenstammdaten
verschlüsselt (`state.js firma`).

### Abzuarbeiten (Reihenfolge = Bau-Priorität)

- [x] **V1 — Kontenrahmen vollständiger + Konten anlegen/bearbeiten [MUSS] — erledigt (2026-06-16).**
      Seed von 18 → **57 gängige SKR03-Konten** (Anlagevermögen/GWG, Privat, Kfz/Reise/Werbung/
      Bewirtung, AfA, Beratung/Buchführung, steuerfreie Erlöse …). **UI „Konto anlegen/bearbeiten/
      löschen"** (`views/accounts.js`): `addKonto`/`updateKonto`/`deleteKonto` in `store.js`
      (Nummer unveränderlich, Löschen nur wenn unbenutzt), `validateKonto`/`normalizeKonto`
      (rein, node-getestet). Hinweis im Formular: vor DATEV-Export mit Berater abgleichen.
      Offen/später: vollständiger SKR03/SKR04-Profil.
- [x] **V2 — Vorsteuer §13b / Reverse-Charge + EU/Ausland [MUSS].** ✅ Umgesetzt:
      `baueReverseChargeZeilen` (journal.js) bucht bei §13b/innergem. Erwerb Vorsteuer **und**
      geschuldete USt gleichzeitig (Netto an den Lieferanten); neue Konten 1577/1787 (§13b) +
      1574/1772 (ig Erwerb) + 8120/8125 (steuerfreie Ausfuhr/ig Lieferung) mit `rolle`-Markern;
      `buildUstVa` erweitert um **Kz 46/47/67** (§13b), **Kz 89/93/61** (ig Erwerb), **Kz 41/43**
      (steuerfrei) inkl. korrekter Zahllast (RC neutralisiert sich); Umsatzart-Auswahl im
      Journal-Formular; node-getestet (28 Tests). **Offen/ehrlich:** §13b modelliert für 19 %
      (Hauptfall Cloud/Software); exakte Kz-Zuordnung am ELSTER-Formular/mit Berater verifizieren;
      noch nicht im E-Rechnungs-Empfang automatisch erkannt (manuelle Umsatzart-Wahl).
- [x] **V3 — Anlagevermögen + AfA + Anlagenverzeichnis [MUSS].** ✅ Umgesetzt: `domain/anlagen.js`
      (rein, node-getestet) mit **GWG-Sofortabschreibung (§6 Abs.2)**, **Sammelposten (§6 Abs.2a,
      5 J.)**, **lineare AfA (§7 Abs.1, pro rata temporis monatsgenau)**; `anlagen-store.js`
      (Stammdaten-CRUD), Ansicht **„Anlagen"** (Erfassen/Bearbeiten, Anlagenverzeichnis je
      Wirtschaftsjahr, **AfA-Buchung als Entwurf**, **Anlagenverzeichnis/AVEÜR-CSV**). 25 Tests.
      **Offen/ehrlich:** AVEÜR-CSV ist AVEÜR-*orientiert* (kein amtliches Formular); GWG-Aufzeichnungs-
      untergrenze (250 €), degressive AfA, Sonderabschreibungen, Abgang/Verkauf nicht modelliert.
- [x] **V4 — Eröffnungs-/Anfangsbestände + Kassenbuch [MUSS].** ✅ Umgesetzt: `domain/kassenbuch.js`
      (rein, node-getestet) — `kassenbuchEintraege` (chronologisch aus festgeschriebenen Buchungen),
      `kassenbericht` (Anfangsbestand + Einnahmen − Ausgaben = Endbestand, **laufender Bestand**,
      **GoBD-Prüfung „nie negativ"**), `anfangsbestandZeilen` (Soll Geldkonto an Saldenvortrag 9000;
      neues Konto 9000). `anfangsbestand-store.js` (je Konto/Jahr), Ansicht **„Kassenbuch"**
      (Konto-/Jahr-Wahl, Anfangsbestand speichern + als Buchungsentwurf, Kassenbericht,
      Negativ-Warnung, Kassenbuch-CSV). 13 Tests. **Offen/ehrlich:** offenes Kassenbuch — KEINE
      zertifizierte TSE/Kassensicherungsverordnung (elektronische Registrierkasse).
- [x] **V5 — USt-VA komplett: Periodentyp + Dauerfristverlängerung + ELSTER-Datenpaket [MUSS].**
      ✅ Umgesetzt: `domain/umsatzsteuer.js` (rein, node-getestet) — `voranmeldungsperioden`
      (monatlich/vierteljährlich/jährlich, ELSTER-Zeitraum-Codes 01–12/41–44, schaltjahr-sicher),
      `periodeIndexFuer`, **`sondervorauszahlung` (1/11 Vorjahres-Zahllast)**, `jahresZahllast`.
      `export.buildElsterVaPaket` (Kennzahlen + Steuernummer/Zeitraum, mit Disclaimer).
      Auswertungen: Karte **„USt-VA je Zeitraum"** (Typ/Jahr/Periode wählbar, Zahllast,
      Sondervorauszahlung-Hinweis, **ELSTER-Datenpaket-Export** + Perioden-CSV). Setting
      `vaZeitraum`. 16 Tests. **Offen/ehrlich:** „ELSTER-Datenpaket" = strukturierte Übergabedatei,
      **KEIN ERiC-XML/-Direktversand**; Jahres-USt-Erklärung (eigenes Formular) nicht abgebildet.
- [x] **V6 — Anlage EÜR (Zeilenschema) + Kontenblätter + SuSa [MUSS/SOLL].** ✅ Umgesetzt:
      `domain/berichte.js` (rein, node-getestet) — `summenSaldenliste` (SuSa mit Summen),
      `kontenblatt` (Kontoauszug je Konto, chronologisch, laufender Saldo, Entwürfe ausgeschlossen),
      `anlageEUR` (Erfolgskonten → **Anlage-EÜR-Gruppen**, netto, Überschuss wie computeEUR) +
      `eurGruppeFuer`. Export `buildSusaCsv`/`buildKontenblattCsv`/`buildAnlageEURCsv`. Neue
      Ansicht **„Berichte"** (Anlage-EÜR-Gruppierung, SuSa-Tabelle, Kontenblatt mit Konto-Auswahl;
      je CSV). 17 Tests. **Offen/ehrlich:** Anlage-EÜR ist an der Formularstruktur *orientiert* —
      exakte amtliche **Zeilennummern** (jahresabhängig) sind am Formular/mit Berater zu prüfen.
- [x] **V7 — Betriebsprüfer-Export GoBD (GDPdU, „Z3"/IDEA) [MUSS].** ✅ Umgesetzt:
      `core/zip.js` (zero-dep ZIP-Writer, store + CRC-32) + `domain/gdpdu.js` (rein,
      node-getestet): `buildGdpduIndexXml` (Beschreibungsstandard, DOCTYPE → `gdpdu-01-09-2004.dtd`),
      `gdpduCsvBuchungen` (nur festgeschrieben) / `gdpduCsvKonten`, `buildGdpduPaket`.
      Export-Karte in **„Berichte"** → ZIP-Datenpaket (index.xml + buchungen.csv + konten.csv +
      info). 16 Tests. **Offen/ehrlich:** GDPdU-*orientiert* — DTD wird bewusst NICHT mitgepackt
      (Prüfsoftware liefert sie), vor echter Prüfung mit IDEA testen; **kein DSFinV-K** (Kasse).
- [x] **V8 — DATEV-EXTF berater-fest [SOLL].** ✅ Vorbereitet & node-getestet: vollständiger
      EXTF-Header aus Einstellungen (**Berater-/Mandanten-Nr., Sachkontenlänge, WJ-Beginn**),
      SKR03-Standard-**BU-Schlüssel** (Vorsteuer 9/8, USt 3/2) bei einfachen Sätzen, **korrekter
      zeilenweiser Split ohne BU** bei §13b/innergem. Erwerb/Mehrfach-Splits (keine Doppelsteuer);
      Doku **`docs/DATEV_IMPORT.md`** („so importieren" + Prüf-Checkliste). 13 Tests. **Offen/ehrlich:**
      endgültige „Berater-Festigkeit" = **realer DATEV-Testimport** (privat/Steuerberater) — mit dem
      Demo-Export (`docs/TESTDATEN.md`) jetzt vorbereitbar; kein zertifiziertes 116-Spalten-EXTF.
- [x] **V9 — Korrektheit/Validierung & Kleinfälle [SOLL].** ✅ Umgesetzt: `domain/kleinfaelle.js`
      (rein, node-getestet) — `kleinbetragsrechnung` (§33 UStDV, ≤250 €), `geschenkAbzug`
      (§4 Abs.5 Nr.1, 50 € netto → Konto/VSt-Abzug), `bewirtungAufteilung` (§4 Abs.5 Nr.2,
      **rechnender** 70/30-Split, Vorsteuer 100% → Buchungsentwurf im Journal). Konten 4654/4635.
      **Periodensperre:** `pruefung.istGesperrt` + harte Sperre in `store.festschreiben` +
      Einstellung „Buchungssperre". **Kleinunternehmer-Konsistenz** (§19): Warnung bei
      USt-/Vorsteuer-Konto. **Plus Simulations-Testharness** (`domain/demodaten.js` + `docs/TESTDATEN.md`):
      deterministischer Demo-Mandant (klein/groß) → echte Export-Dateien (Berichte „Demo-Export")
      mit dokumentierten Vergleichswerten. 33 Tests.
- [x] **V10 — Browser-E2E der Buchungs-Kernpfade [SOLL].** ✅ Umgesetzt: **In-App-Selbstdiagnose**
      (`domain/selbsttest.js` + Ansicht „Selbsttest"): prüft die Kern-Engine OFFLINE (AES-GCM-
      Roundtrip + Ablehnung falsches PW, Shamir 2-von-3, GoBD-Hash-Kette + Manipulationserkennung,
      Geldrundung, doppelte Buchführung/USt-VA/EÜR/GDPdU an Demo-Daten, Export-ZIP) → ✓/✗,
      node-gespiegelt (13 Tests). **Manuelle Klickpfad-Abnahme** in `docs/ABNAHME_CHECKLISTE.md`
      (DOM/IndexedDB-Pfade, da kein Headless-Browser in der Bau-Umgebung).

### Bewusst eigene große Spuren (nur falls Rechtsform es verlangt)
- [x] **V-Bilanz — Bilanzierung (GmbH/OHG, GuV + Bilanz, §4 Abs.1/§5) [BESCHLOSSEN 2026-06-17] — ABGESCHLOSSEN.** In Teil-PRs (B1/B2/B3).
      **B1 ✅ (2026-06-17, PR #87):** Modus `gewinnermittlung` (euer|bilanz, Default euer) + Konten-Klassifikation
      (`src/domain/bilanzierung.js`, node-getestet) + Bilanz-Grundkonten 0800/0840/0860/0970 im SKR03-Seed +
      Modus-Schalter in den Einstellungen (zieht Grundkonten via `ensureSeedKonten` nach).
      **B2 ✅ (2026-06-17):** `domain/bilanz.js gewinnUndVerlust(buchungen, idx, periode)` (rein, node-getestet) +
      `buildGuvCsv` + GuV-Karte in „Auswertung" (nur Bilanz-Modus, Perioden-Filter, CSV/Druck), SW `v85`, 739/739.
      **B3 ✅ (2026-06-17):** `domain/bilanz.js bilanz(buchungen, idx, stichtag, eröffnungssalden)` (rein, node-getestet)
      → Aktiva/Passiva aus den Bestandskonten-Salden zum Stichtag, Ergebnis (Jahresüberschuss/-fehlbetrag) ins
      Eigenkapital, **Aktiva = Passiva (inkl. Ergebnis)** geprüft (`ausgeglichen`/`differenz`), Eröffnungssalden
      (Saldenvortrag 9000 ODER Parameter); `buildBilanzCsv` + Bilanz-Karte in „Auswertung" (nur Bilanz-Modus), SW `v86`,
      760/760. **Grenze:** Bilanz im Konten-Sinn, keine §266-HGB-Gliederung, keine Konzernabschlüsse/E-Bilanz-Taxonomie;
      Konten nach Kontoart, nicht nach Saldovorzeichen umgegliedert. **Rest-Idee (KANN):** Eröffnungsbilanz-Eingabemaske.
- [ ] **V-Lohn — Lohnbuchhaltung [KANN/extern].** Heute nur Zeiterfassung (`employees.js`); echte
      Lohnabrechnung/SV/Lohnsteuer ist eigenes Produkt — i. d. R. separate Software/Berater.
- [x] **V-Multi — Mehrmandantenfähigkeit ✅ abgeschlossen (2026-06-17).** M1 ✅ (reine Schicht
      `src/domain/mandanten.js`). M2a ✅ (Core: `core/db.js` aktive DB konfigurierbar + `core/mandantenStore.js`
      Registry/`initMandanten`/`wechsleAktivenMandant`). M2b ✅ (Sperrbildschirm-UI: Auswahlliste, „Neuer
      Mandant" → eigener Tresor-Onboarding, Wechsel, DSGVO-Hinweis). **M3 ✅** (`ui/shell.js`: aktiver
      Mandanten-Name im Header + „Mandant wechseln"; Einstellungen „Mandanten verwalten": umbenennen/entfernen
      — Entfernen nur mit Bestätigung, Tresor-DB bleibt; Doku **`docs/MANDANTEN.md`**). **Grenze:** Entfernen =
      aus Liste nehmen, kein Löschen + keine Re-Import-UI; Glue/UI statisch geprüft (kein Headless-Browser).

---

## A. HOCH — unbedingt beachten / als Nächstes

### A1. Mahnwesen & überfällige Forderungen — **Kern erledigt ✓, Rest offen**
**Erledigt (PR #53):** `src/domain/mahnwesen.js` (rein, node-getestet): Fälligkeit
(Rechnungsdatum + Zahlungsziel), Überfälligkeit, Mahnstufen, Verzugszinsen (§288 BGB),
40-€-Pauschale, `mahnschreibenDaten()`. Sichtbar in **Auswertungen** → Karte „Offene Forderungen
& Mahnwesen" (überfällig-Badge + Summe) inkl. **druckbarem Mahnschreiben**. Einstellungen
`zahlungszielTage` (14) + `verzugBasiszinsProzent` (§247 BGB, aktuell halten!).
**B2B/Verbraucher je Kunde erledigt (2026-06-16):** Kunden-Flag `istVerbraucher` (crm-store +
Kundenformular/-liste); `mahnwesen.kundeIstB2B()` (rein, node-getestet); das Mahnschreiben nutzt
nun den Aufschlag je Kunde (Unternehmer +9, Verbraucher +5 %-Punkte) und die 40-€-Pauschale nur
bei Unternehmern. Default konservativ B2B. SW `v60`.

**Persistente Mahnstufe + manuelle Zins-/Gebühren-Erfassung erledigt (2026-06-16):** Auftrag führt
`mahnungen[]` (Verlauf je gesendeter Mahnung mit Datum/Stufe/Zinsen/Gebühren);
`mahnwesen.letzteMahnstufe`/`vorschlagNaechsteStufe`/`mahnVerlaufSumme`/`mahnStufeLabel` (rein,
node-getestet). UI: Karte zeigt „zuletzt gemahnt: …", die nächste Stufe zählt hoch (nicht nur aus
Tagen abgeleitet); im Mahnschreiben **editierbare** Verzugszinsen/Mahngebühren (vorbelegt mit §288)
+ „Als gesendet vermerken". `crm-store.mahnungErfassen()`. SW `v62`.
**Buchung von Zinsen/Gebühren erledigt (R1, 2026-06-17):** `mahnwesen.mahnbuchungZeilen`/`mahnbuchungEntwurf`
(rein, node-getestet) buchen **Forderung 1400 an Zinserträge 2650 / sonstige betr. Erträge 2700 — ohne USt**
(nicht steuerbarer Schadensersatz §288 BGB / Abschn. 1.3 UStAE, ehrlich dokumentiert). Knopf
**„Als Buchungsentwurf übernehmen"** im Mahnschreiben (`reports.js`) → `saveEntwurf`, **manuell/kein
Auto-Festschreiben** (GoBD). SW `v87`, 783/783 Tests.
**Zahlungsziel je Rechnung erledigt (2026-06-17, R3):** Eingangsrechnungen tragen jetzt ein Feld
`zahlungszielTage`; `payables.berechneFaelligAm(rechnung, defaultZielTage)` (explizites `faelligAm` →
Datum + rechnungseigenes Ziel → Datum + Default 30) wird in `offeneVerbindlichkeiten`/
`anreichereVerbindlichkeiten`/der OP-Liste genutzt, validiert (ganzzahlig ≥ 0), node-getestet.
**Zahlungsziel je Forderung erledigt (2026-06-17, A1-Rest):** Aufträge tragen jetzt ein optionales
`zahlungszielTage`; `mahnwesen.faelligAmVon(posten, defaultZielTage)` (explizites `faelligAm` → Rechnungsdatum +
posten-eigenes Ziel → Default) wird von `anreicherePosten`/`mahnschreibenDaten` genutzt, `payables.berechneFaelligAm`
delegiert daran (Duplikat entfernt). `zahlungsabgleich.offenePosten` reicht `faelligAm`/`zahlungszielTage` des Auftrags
durch; `orders.validateAuftrag` validiert das Ziel; UI-Feld „Zahlungsziel (Tage)" im Auftragsformular. node-getestet
(+16 → 1045/1045), SW `v99`.
**„zahlbar bis" auf der §14-Rechnung erledigt (2026-06-17):** Das auftragseigene `zahlungszielTage` erscheint jetzt als
Fälligkeitsdatum **„zahlbar bis JJJJ-MM-TT"** auf dem gedruckten Rechnungsdokument. `rechnung.baueRechnung` bekam
Parameter `defaultZielTage` + Feld `zahlbarBis` (= `mahnwesen.faelligAmVon`, auftragseigenes Ziel vor globalem Default;
ohne Rechnungsdatum leer), `pflichtangaben` unverändert (Fälligkeit ist keine §14-Pflichtangabe); UI-Kopfzeile +
i18n `orders.payableUntil`. SW `v100`, +6 Tests (1051/1051).
**Zahlungsziel durabel + im Austauschformat (v4) erledigt (2026-06-17):** **(1)** Bugfix — `crm-store.saveAuftrag`
hatte `zahlungszielTage` aus seiner Feld-Whitelist **fallen gelassen**, sodass A1-Rest + „zahlbar bis" nach dem
Speichern faktisch wirkungslos waren (immer globaler Default); jetzt persistiert. **(2)** `connect.buildAustauschPaket`
trägt `rechnung.zahlungszielTage` reziprok mit (v4), `importworkfloh.normalizeRechnung` übernimmt es konservativ,
`crm-store.importWorkFloh` setzt es auf den Auftrag → Gegenstelle erbt die Fälligkeit. +8 Tests (1059/1059), SW `v101`.
**Edit bestehender Aufträge erledigt (2026-06-17):** ein noch nicht berechneter Auftrag (Status angelegt/
in_arbeit/erledigt, keine Rechnung gebucht, keine Zahlung erfasst) ist jetzt **nachträglich editierbar**
(Titel/Kunde/Kostenstelle/Zahlungsziel/Positionen). `orders.darfAuftragBearbeiten` (GoBD-Guard) +
`orders.anwendeAuftragEdit` (nur freigegebene Felder, `AUFTRAG_EDIT_FELDER`) rein/node-getestet;
`crm-store.updateAuftrag` (Guard + Validierung + `encPut`); UI: „Bearbeiten"-Knopf + prefill-fähiges Formular
(`_editAuftrag`). +21 Tests (1080/1080), SW `v102`.
**Noch offen [SOLL]:** Eingangsrechnungs-Verzug (Gegenseite, Mahnung erhalten/prüfen).
**[Sichttest]** `saveAuftrag`/`updateAuftrag`-Persistenz (IndexedDB) ist nur statisch geprüft → im Browser bestätigen.

**Warum (Ausgangslage):** Eine offene Rechnung mit abgelaufener Frist muss sofort sichtbar sein,
damit man nachmahnen kann — siehe jetzt Auswertungen.

Konkret nachzuarbeiten:
- **Fälligkeit je Rechnung:** Zahlungsziel (z. B. 14 Tage) → `faelligAm = rechnungDatum + Ziel`.
  Pro Firmenprofil/Auftrag konfigurierbar; Default hinterlegen.
- **Überfälligkeit automatisch erkennen & markieren:** offene Forderung mit `faelligAm < heute`
  → Status/Badge **„überfällig (N Tage)"** — sichtbar in **Dashboard** (Kennzahl „überfällige
  Forderungen", Summe + Anzahl), in der **Auftrags-/Forderungsliste** und idealerweise als
  **Offene-Posten-Liste (OP-Liste)**.
- **Mahnstufen** (branchenüblich): Zahlungserinnerung → 1. Mahnung → 2. Mahnung → 3. Mahnung
  (ggf. „letzte Mahnung/Inkasso-Androhung"). Stufe + Datum je Forderung mitführen.
- **Mahngebühren & Verzugszinsen** korrekt nach Recht:
  - Verzugszinsen **§ 288 BGB**: B2B (kein Verbraucher) **9 Prozentpunkte über Basiszinssatz**,
    Verbraucher **5 Prozentpunkte**; Basiszinssatz veränderlich → konfigurierbar/datierbar.
  - Pauschale **40 € (§ 288 Abs. 5 BGB)** bei B2B-Verzug möglich (Option).
  - Mahngebühren maßvoll/ortsüblich; transparent ausweisen.
- **Mahnschreiben erzeugen** (druckbar/PDF, analog zur §14-Rechnung): Bezug auf Rechnung(en),
  offener Betrag, neue Frist, ggf. Zinsen/Gebühren, Pflicht-/Höflichkeitstext je Stufe.
- **Buchung:** Mahngebühren/Verzugszinsen als sonstige Erträge buchen (Konto-Mapping SKR03,
  z. B. Zinserträge/sonstige betriebliche Erträge); USt-Behandlung beachten (Verzugszinsen
  i. d. R. nicht steuerbar, Mahngebühren als Schadenersatz strittig → konservativ + Hinweis
  „im Zweifel Berater").
- **Reine, node-testbare Kernlogik** zuerst: `faelligkeit()`, `istUeberfaellig()`,
  `mahnstufeVorschlag()`, `verzugszinsen(betrag, tage, basiszins, b2b)`, `mahnschreibenDaten()`.
  Danach UI (Dashboard-Kennzahl, OP-Liste, Mahnung-Button) — UI als nicht-headless-E2E kennzeichnen.

### A2. Verbindlichkeiten als Posten-Quelle für den Zahlungsabgleich — **erledigt ✓**
**Erledigt (2026-06-16):** `src/domain/payables.js` (rein, node-getestet) + `payables-store.js`
(verschlüsselt via `encstore`):
- `eingangsrechnungZeilen()` — Eingangsrechnung „auf Ziel" buchen: Aufwand + abziehbare
  Vorsteuer **an** Verbindlichkeiten aus L+L (1600), mehrere USt-Sätze/Aufwandskonten, ausgeglichen.
- **`offeneVerbindlichkeiten()`** — leitet offene Kreditoren-Posten ab (Brutto − Zahlungen,
  Stichtag-fähig, nach Fälligkeit sortiert) **im selben Posten-Format wie**
  `zahlungsabgleich.offenePosten()`, aber `richtung:'ausgabe'` + `kind:'verbindlichkeit'`;
  `betragCent` = offener Rest (Teilzahlung-tauglich). Damit greifen `findeOffenePosten()` und
  `zahlungsBuchungZeilen()` (Verbindlichkeit an Bank) direkt.
- `rechnungStatus` (offen/teilbezahlt/bezahlt/storniert), Zahlungen, Storno, Validierung.
- **UI** (`documents.js`): E-Rechnung-Empfang bietet **„+ Als offene Verbindlichkeit erfassen"**
  (speichert Kreditorenrechnung + bucht „auf Ziel" als Entwurf); der **Bankimport** lädt jetzt
  Forderungen **und** Verbindlichkeiten als Posten → Ausgangszahlungen werden offenen
  Verbindlichkeiten zugeordnet und als „Verbindlichkeit an Bank" gebucht + Zahlung vermerkt.
- 40 Node-Tests; `node tests/run.mjs` **393/393 grün**. SW-Cache `v57`.

**OP-Liste erledigt (2026-06-16):** Auswertungen-Karte **„Offene Verbindlichkeiten (Kreditoren)"**
(`reports.js` + `payables.anreichereVerbindlichkeiten`/`verbindlichkeitenSummen`): offene Posten
mit Fälligkeit (rechnungseigene `faelligAm`, sonst Datum + Zahlungsziel), **Überfällig-Badge**,
Summe + überfällige Summe, **CSV-Export der OP-Liste** (`export.buildOffeneVerbindlichkeitenCsv`).
Node-getestet; SW `v58`.

**Foto/PDF + eigene Ansicht erledigt (2026-06-17, R3):** `payables.extraktionZuEingangsrechnung(ex, opts)`
bildet aus einem OCR-/Extraktions-Ergebnis (Vision EU → `ai/extract`) einen Eingangsrechnungs-Entwurf
(Netto cent-genau aus Brutto+USt, 0-%-Fallback, fehlende Felder nicht erfunden); node-getestet.
UI: **neue Ansicht „Verbindlichkeiten"** (`ui/views/payables.js`, Nav nach „Belege") zum **manuellen
Anlegen/Bearbeiten/Stornieren/Löschen** + optional „auf Ziel" buchen; im Beleg-OCR (`documents.js`)
zusätzlich **„Verbindlichkeit aus diesem Beleg erfassen"**. SW `v90`, +25 Tests (863/863).
**Noch offen [SOLL]:** Verzug der Gegenseite (Eingangsrechnungs-Mahnung erhalten/prüfen) — Teilzahlung/
Skonto/Sammelzahlung sind über A3/R2a/R2b bereits abgedeckt.

### A3. Teilzahlungen & unscharfes Matching — **Kern erledigt ✓ (Verbindlichkeiten), Rest offen**
**Erledigt (2026-06-16):** `zahlungsabgleich.findeKandidaten()` (rein, node-getestet) liefert
**gerankte** Kandidaten mit Art `exakt` / `toleranz` (Rundungs-Cent) / `skonto` (Zahlung knapp
unter offen, ≤ skontoProzent — als **Hinweis**) / `teilzahlung` (Rest bleibt offen);
Überzahlungen werden konservativ nicht zugeordnet, Mehrdeutigkeit über Score (Referenz/Name/
Datumsnähe). **UI** (Bankimport): bei Verbindlichkeiten ohne exakten Treffer Knopf
**„◑ Teilzahlung verbuchen"** → bucht den gezahlten Betrag (Verbindlichkeit an Bank) + vermerkt
die Teilzahlung; Skonto wird als Hinweis gezeigt. `findeOffenePosten` (exakt) bleibt unverändert.

**Forderungs-Teilzahlung erledigt (2026-06-16):** Aufträge führen jetzt `zahlungen[]`;
`orders.auftragOffen()`/`auftragGezahlt()` (rein, node-getestet) + `zahlungsabgleich.offenePosten`
liefert den **offenen Rest** (statt Brutto). `crm-store.auftragZahlungHinzufuegen()` erfasst
(Teil-)Zahlungen und markiert bei Ausgleich automatisch „bezahlt". **UI** (Bankimport): die
„◑ Teilzahlung verbuchen"-Aktion gilt jetzt **auch für Forderungen** (Bank an Forderung, Rest
bleibt offen); exakte Zahlungen werden ebenfalls als Zahlung erfasst (Zahlungshistorie).

**Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) erledigt (R2a, 2026-06-17):**
`domain/skonto.js` (rein, node-getestet): `skontoSplit`/`skontoBuchungZeilen`/`skontoEntwurf` +
`SKONTO_KONTEN` (SKR03 8730/8731/8736 gewährt, 3730/3731/3736 erhalten, USt 1776/1771,
Vorsteuer 1576/1571). Gleicht den offenen Posten **komplett** aus und korrigiert das **Entgelt nach
§17 UStG** (Einnahme→USt mindern; Ausgabe→Vorsteuer mindern); **gemischte USt-Sätze** proportional je
Brutto-Anteil (`posten.saetze` in `offenePosten`/`offeneVerbindlichkeiten`). UI: Knopf **„Skonto buchen
(§17 UStG)"** im Bankimport (`documents.js`) → `saveEntwurf` (manuell, GoBD). SW `v88`, 816/816 Tests.
**Bewusst manuell** (kein Auto-Festschreiben — Korrektheit vor Bequemlichkeit).

**Sammelzahlungen erledigt (R2b, 2026-06-17):** Eine Bankzahlung deckt **mehrere** offene Rechnungen ab.
`zahlungsabgleich.findeSammelzuordnung` (rein, node-getestet) schlägt **Kombinationen** gleichgerichteter offener
Posten vor (tiefen-/kandidatenbeschränkte Subset-Summe, Summe == Zahlung ± Toleranz, **≥2 Teile**, Score nach
Referenz/Name/Datumsnähe); `verteileSammelzahlung` verteilt den Zahlbetrag der Reihe nach auf die **explizit
gewählten** Posten (Restbildung beim letzten, Überschuss bleibt `unverteiltCent`); `sammelBuchungZeilen` baut **eine
Zeile je Rechnung** (Bank an Forderung/Verbindlichkeit, ausgeglichen). UI: Knopf **„◫ Sammelzahlung (mehrere
Rechnungen)"** im Bankimport (`documents.js`) → Checkbox-Auswahl (Vorschlag vorausgewählt, laufende Summe/Status) →
`saveEntwurf` (manuell, GoBD) + Zahlung je Posten. SW `v89`, 838/838 Tests.

**Noch offen [SOLL]:** —

### A4. App-Anbindung / WorkFloh-Integration **[SOLL] — Stufe 1 + 2 + R4-Rest erledigt ✓, nur API/Push offen**
**Stufe 2 erledigt (R4, 2026-06-17, PR #95):** Rechnungs-Übernahme — ein Auftrag im Austauschformat
darf einen `rechnung`-Block `{nummer, datum, leistungsdatum?}` tragen (Format **v2**, abwärtskompatibel).
`importworkfloh.normalizeImport` normalisiert/verwirft unvollständige Rechnungen; `invoicing.rechnungs-
UebernahmeEntwurf`/`validateRechnungsUebernahme` (rein, node-getestet) bauen den Buchungs-Entwurf
(Forderung an Erlöse + USt) mit der **WorkFloh-Nummer/-Datum** (keine neue BLP-Nummer);
`crm-store.importWorkFloh` bucht ihn als Entwurf + setzt den Auftrag „berechnet" (Festschreiben manuell,
GoBD); `connect.buildAustauschPaket` trägt die Rechnung reziprok mit. SW `v91`, +22 Tests (885/885).
**R4-Rest erledigt (2026-06-17):** Zahlungs-/Teilzahlungs-Übernahme — die `rechnung` darf zusätzlich ein
`zahlungen[]` `{datum, betragCent|betrag, ref?}` tragen (Format **v3**, abwärtskompatibel).
`importworkfloh.normalizeZahlungen` (rein, node-getestet) normalisiert konservativ (ISO-Datum + positiver
Betrag, Euro/Cent; unvollständig → verworfen + Warnung); `invoicing.zahlungsUebernahmeEntwurf`/
`validateZahlungsUebernahme` bauen je Zahlung einen Zahlungseingang-ENTWURF (**Soll Bank 1200 / Haben
Forderung 1400**); `crm-store.importWorkFloh` bucht je Zahlung den Entwurf + vermerkt die (Teil-)Zahlung am
Auftrag (Auto-„bezahlt" bei `auftragOffen <= 0`) und meldet `zahlungenUebernommen`; `connect.buildAustauschPaket`
trägt die Zahlungen reziprok mit. SW `v97`, +18 Tests (1001/1001). UI/Glue statisch geprüft.
**Noch offen [SOLL/KANN]:** API/Push (Echtzeit) statt Datei. **Grenze:** Überzahlung nicht gesondert behandelt
(faithful gebucht, manuell korrigierbar); Festschreiben bleibt manuell (GoBD).

**Vision (Nutzer):** Funktionierende Apps sollen sich an BookLedgerPro **anbinden** können bzw.
BookLedgerPro bietet die Anbindung an. Konkretes Beispiel **Mein-WorkFloh**: Angebote → umgesetzte
Arbeiten werden dort in eine **Rechnung** übergeführt; diese Rechnung wird dann **kombiniert in
BookLedgerPro weiterverarbeitet** (Forderung/Buchung, Zahlungsabgleich, EÜR/USt). Soll **als Option**
möglich sein, nicht erzwungen.
**Heutiger Stand (Seam vorhanden):** `domain/importworkfloh.js` (Parser/Normalisierung) +
`crm-store.importWorkFloh()` (Dedupe Kunden/Aufträge, Aufträge kommen als „angelegt" herein →
Rechnung/USt-Buchung erfolgt in BLP). Damit ist der **Datei-Import** bereits der erste Andockpunkt.
**Für die spätere Umsetzung sauber vorzubereiten:**
- Stabiles **Austauschformat/Schema** (Angebot/Auftrag/Rechnung) versionieren; klare Feld-Map
  WorkFloh→BLP (inkl. Kunde, Positionen, USt-Sätze, Rechnungsnummer, Datum, Fälligkeit).
- **Anbindungs-Option** in der UI (Import-Knopf vorhanden) → ggf. „Verbindung/Quelle"-Einstellung;
  Richtung BLP-als-Empfänger zuerst (Datei/JSON), später optional API/Push.
- **Idempotenz/Dedupe** härten (externId/externNummer — teils vorhanden), Konflikt-/Update-Fälle.
- **Rechnung statt nur Auftrag** importieren können (WorkFloh erzeugt bereits Rechnung) → direkter
  Forderungs-Posten inkl. Zahlungsabgleich; GoBD-Festschreibung bleibt in BLP manuell.
- Build-frei/offline-first + Krypto-Disziplin wahren; **opt-in**, kein Zwang.
> Bewusst **noch nicht umgesetzt** — erst nach Freigabe/Bedarf (eigene Sitzung). Hier nur als
> verbindlicher Andockpunkt festgehalten, damit die Richtung nicht verloren geht.

---

## B. MITTEL — Mehrwert / Härtung

- **[TEILWEISE 2026-06-17] E-Rechnung KoSIT:** ✅ **KoSIT-orientierter Pflichtfeld-Precheck**
  (`zugferd.kostPflichtfelder`, EN16931-Kernfelder) beim Empfang. **Offen:** echter KoSIT-Validator
  (Java) ist nicht build-frei → externer/CI-Check; keine Konformität behaupten, die nicht belegt ist.
- **[TEILWEISE 2026-06-17] ZUGFeRD:** ✅ **Empfang** — eingebettete CII/UBL aus **PDF** best-effort
  auspacken (`zugferd.extrahiereZugferdXml`, native `DecompressionStream` für FlateDecode) → bestehender
  Buchungsvorschlag. **Offen:** ZUGFeRD *erzeugen* (XML in PDF/A-3 einbetten) braucht PDF-Lib → nicht build-frei.
- **[ERLEDIGT 2026-06-17] Bankformate härten (R5a + R5a-Rest):** ✅ CAMT-Varianten **.052 (`<Rpt>`)/.054
  (`<Ntfctn>`)** zusätzlich zu .053, **Saldo-Integritätsprüfung** (`pruefeBankauszug`: Anfang ± Umsätze
  vs. Schlusssaldo) und **strukturierte RmtInf** (`CdtrRefInf`/`EndToEndId` → Beleg-Referenz). **R5a-Rest ✅:**
  echte **SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung** in `src/domain/bankschema.js` (rein,
  node-getestet): `validiereMT940` (SWIFT-FIN-Feldformate + Pflichtfelder + Reihenfolge), `validiereCAMT`
  (ISO-20022-Nachrichten-Struktur camt.052/.053/.054: Pflicht-Container, `<Amt Ccy>`, `CdtDbtInd`, Status/Datum),
  `validiereBankauszug` (Format-Weiche); UI-Hinweis im Bankimport. SW `v98`, +28 Tests (1029/1029).
  **Grenze (ehrlich):** Struktur-/Feldformat-Prüfung nach den dokumentierten Specs — **KEINE zertifizierte
  XSD-Validierung** (nicht build-frei) und **KEINE** SWIFT-Netzwerk-Konformität; klare Verstöße = Fehler,
  dialekt-strittige Punkte = Warnungen (konservativ). Reale Bank-Dialekte weiter mit echten Auszügen testen.
- **[SOLL] DATEV-EXTF:** „EXTF-orientiert", **nicht** das zertifizierte 116-Spalten-Format;
  Steuerschlüssel-Mapping nur Standardsätze → mit Berater/DATEV verifizieren.
- **[ERLEDIGT 2026-06-17] PII-Erkennung über Anker hinaus (NER) (R5b):** ✅ `ai/ner.js` erkennt
  konservativ E-Mail/IBAN/USt-IdNr/Steuernr/Telefon **Dritter** im Belegtext und ergänzt sie als
  zusätzliche Anker für `pseudonym.tokenize` (Setting `nerPii`, Default an, nur im Pseudonym-Modus).
  Exakte Stammdaten-Anker behalten Typ-Vorrang; node-getestet. **Grenze:** kein BIC/Namens-NER (FP-Risiko).
- **[ERLEDIGT 2026-06-17] Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person) für Pseudonymisierung/CRM
  (P7, **R5c**): ✅ `ai/briefkasten.js` ordnet die exakten Stammdaten-Anker in die Hierarchie ein (eigene Firma =
  `FIRMA_1`/eigen, Mitarbeiter = deren Personen; Firmenkunden = `FIRMA_n`; Privatkunden = Personen am Mandanten) und
  vergibt **scope-präfixierte** Typen → `tokenize` erzeugt gruppierende Token (`[[FIRMA_2_IBAN_1]]`,
  `[[FIRMA_1_PERSON_1]]`). Setting `briefkastenScopes` (Default aus, opt-in), `ladeAnker` routet dann darüber + liest
  den aktiven Mandanten aus der Registry; node-getestet (+26), SW `v93`. **Grenze:** Person-Attribute hängen am
  Parent-Scope (Firma/Mandant), nicht am einzelnen Personen-Token.
- **[ERLEDIGT 2026-06-17] NER-Scoping (R5c-Rest):** ✅ Im Briefkasten-Modus (`briefkastenScopes`) tragen jetzt auch
  die im Belegtext erkannten **Fremd-PII** (NER: IBAN/E-Mail/USt-IdNr/Steuernr/Telefon Dritter) einen Scope —
  den externen Scope **`EXTERN`** (`EXTERN_IBAN`, `EXTERN_EMAIL` … → Token `[[EXTERN_IBAN_1]]`) statt flacher Typen.
  So sieht die KI sie als externe, gruppierte Dritt-Identifikatoren, sichtbar getrennt von den bekannten Mandant-/
  Firmen-Entitäten; exakte (gescopte) Stammdaten-Anker behalten bei gleichem Wert weiter Typ-Vorrang. `ai/ner.js`
  (`piiAnker(text,{scope})`/`kombiniereAnker(…,{scope})`, `EXTERN_SCOPE`), `ai/anker.js` reicht den Scope nur im
  Briefkasten-Modus durch; flacher Pseudonym-Modus unverändert. Plus: Transparenz-Badge (`documents.js`) zeigt
  scope-präfixierte Typen jetzt lesbar (i18n-`tOpt`-Fallback statt roher Schlüssel). node-getestet (+11), SW `v96`.
  **Grenze:** EIN gemeinsamer `EXTERN`-Scope — verschiedene Drittparteien werden NICHT geclustert (aus flachem
  Belegtext nur heuristisch/FP-riskant trennbar → bewusst konservativ).
- **[SOLL] UI end-to-end testen:** kein Headless-Browser in der Bau-Umgebung → DOM-/IndexedDB-Pfade
  sind nur statisch geprüft. Manuelle Sichttests dokumentieren oder Headless-E2E einführen.

---

## C. NIEDRIG / SPÄTER

- **[BESCHLOSSEN 2026-06-17] ELSTER:** Datenpaket-Download **+ Weiterleitungs-Link** zur Anbieter-Seite
  (elster.de) — **kein** ERiC-Direktversand (nicht build-frei). Stufe 1 (Link) ✅ umgesetzt.
- **[KANN] Lokales Offline-OCR** (z. B. Tesseract.js) als Vision-Alternative/Fallback.
- **[ERLEDIGT 2026-06-17] Privat-/Bürger-Modus** (vereinfachte Oberfläche für Privatpersonen/Vereine):
  ✅ **R6/P1 (PR #99)** — `domain/nutzungsmodus.js` (rein, node-getestet) führt den Nutzungskontext
  `firma|privat|verein` (Default `firma`) ein und blendet geschäftliche NAV-Ansichten je Kontext aus
  (`zeigeAnsicht`/`sichtbareAnsichten`, in `shell.js` konsumiert; Setting `nutzungsmodus`, Schalter
  „Nutzungskontext"). ✅ **R6/P2** — die **fachlichen Feature-Gates** (`zeigeFeature`) werden jetzt
  **ansichtsintern** gelesen: `journal.js` (USt-Satz/Umsatzart/Reverse-Charge + Bewirtungs-Split nur bei
  `UMSATZSTEUER`, Kostenstelle nur bei `KOSTENSTELLEN`, Submit erzwingt im Privat-Modus 0 %/Inland),
  `reports.js` (USt-Karten/Mahnwesen/Kreditoren-OP/Kostenstellen + DATEV-/USt-VA-Export je Modus),
  `documents.js` (Kreditoren-OP aus E-Rechnung/OCR nur bei `VERBINDLICHKEITEN`), `dashboard.js`
  (USt-Zahllast-KPI nur bei USt; Kunden-/Aufträge-KPI nach Ansichts-Sichtbarkeit). SW `v95`, 972/972.
  Gating ist eine **Anzeige-Vereinfachung, keine rechtliche Sperre** (im Zweifel „Firma" zeigt alles).
  **Bewusst belassen:** Verein behält per Politik USt/Verbindlichkeiten/Anlagen als Feature (nur deren
  dedizierte NAV-Ansichten sind im Verein ausgeblendet) — Policy unverändert, da node-getestet/gewollt.
- **[KANN] Sage-Mycel 5b–d:** echte Spore deployen, Hub-Registrierung, Handshake, Symbiose-Import.
- **[KANN] Performance/Lighthouse** messen.
- **[BESCHLOSSEN 2026-06-17] Mehrmandantenfähigkeit** (mehrere Firmen je Installation) — eigener großer PR.

---

## D. Disziplin / Architektur — beim Bauen immer beachten (aus CLAUDE.md)

- **Build-frei bleiben** (native ES-Module, keine Bundler/CDNs/npm-Runtime-Deps).
- **DB-Suffix `bookledgerpro` nie ändern** (gemeinsamer Origin auf GitHub Pages).
- **`CACHE_VERSION` in `sw.js` erhöhen** bei jeder Shell-Änderung; neue Module ins Precache.
- **Krypto-Disziplin:** Sitzungs-Key nur im RAM; Klartext nie ohne Bestätigung; **aktive KI strikt
  EU** (Vision EU + Mistral EU), **Nicht-EU bleibt dormant/nicht auswählbar**.
- **Recht ist Architektur** (GoBD-Festschreibung/Hash-Kette, DSGVO, USt/EÜR) — nicht aufpfropfen.
- **Ehrlichkeit:** keine vorgetäuschte Konformität; „orientiert/nicht zertifiziert" klar benennen;
  ungetestete (DOM/IndexedDB) Teile kennzeichnen; `node tests/run.mjs` muss grün sein.
