# PULS.md — Lückenloser Nachfolge-Brief (Stand-Schnappschuss)

> **Diese Datei ist der zentrale Andockpunkt für jede neue Sitzung.** Sie ergänzt
> `CLAUDE.md` (Regeln/Verträge), `ROADMAP.md` (Phasen-Checklisten) und `docs/SESSIONS.md`
> (Verlauf). Wer hier + im obersten SESSIONS-Eintrag liest, weiß **genau, wo es weitergeht**.
> Pflege: bei Sitzungsende oben „Letzter Stand" + „Nächste konkrete Schritte" aktualisieren.

---

## ⏭ START HIER — Nachfolge-Brief (Stand 2026-06-17): **eine PR pro Sitzung**, Plan in NACHFOLGE_PLAN.md

> **Lies das zuerst und vollständig. Danach OHNE Rückfragen loslegen.**

> **📨 Selbstfortschreibende Nachfolge-Kette (verbindlich, vom Nutzer gewünscht):**
> Der **paste-fertige Brief** für die jeweils nächste Sitzung steht in
> `docs/NAECHSTE_SITZUNG.md` (Block zwischen `>>> COPY <<<` / `>>> END COPY <<<`). **Jede
> Sitzung MUSS** diesen Brief am Ende neu auf den dann nächsten Schritt setzen **und** die
> Selbst-Fortschreibungs-Anweisung darin behalten (Kette darf nie abreißen) — und den
> COPY-Block am Sitzungsende im Chat ausgeben. **Mehrere saubere, in sich abgeschlossene
> PRs pro Sitzung sind erlaubt** (pro Punkt 1 PR, jeder einzeln grün + gemergt; nie halb
> mergen, im Zweifel feiner schneiden).

**🟢 FREIBRIEF + Sitzungs-Ritual (vom Nutzer ausdrücklich so gewünscht):**
- **Genau EINE PR pro Sitzung.** Die Sitzung ist nur so lang, bis **diese eine PR abgeschlossen** ist.
- **Sauber & fehlerfrei vor schnell:** keine unschlüssigen/halben Codepfade, die später Probleme machen.
  Lieber kleiner schneiden als überstürzen. Reine Logik **zuerst node-getestet** (`node tests/run.mjs`),
  dann UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser hier).
- **Ablauf je PR:** Branch `claude/v2-ox8bu7` auf `origin/main` setzen → bauen → Tests grün →
  `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen → **Draft-PR** → ready → CI abwarten →
  **bei grün squash-mergen** → lokal `git reset --hard origin/main`.
- **Abschlussbrief am Ende JEDER Sitzung (Pflicht):** in `docs/PULS.md` diesen „START HIER"-Block auf
  die **nächste** PR zeigen lassen (Kopf-Status v-Nummer/Tests aktualisieren), `docs/NACHFOLGE_PLAN.md`
  die erledigte Zeile abhaken, obersten `docs/SESSIONS.md`-Eintrag schreiben, `OFFENE_PUNKTE.md` pflegen.
  So startet die Folgesitzung **konfliktfrei** allein aus diesen Dateien.
- **Unverrückbar:** DB-Suffix `bookledgerpro` NIE ändern · build-frei (keine Bundler/CDNs/npm-Runtime) ·
  Krypto-/Durabilitäts-Disziplin (Regel #2) · GoBD/DSGVO · EU-KI opt-in.

**📋 Der vollständige, geordnete Mehr-Sitzungs-Plan steht in `docs/NACHFOLGE_PLAN.md`.**
**Nächste PR = NACHFOLGE_PLAN.md, Schritt „R5"** (Rest-SOLL): Bankformate härten (CAMT .052/.054, SWIFT-
Validierung), NER (PII über Anker hinaus), dreistufiger Briefkasten. **Alternativ/zuerst sinnvoll:** **Browser-
Sichttest** (WorkFloh-Datei mit Rechnung importieren → Buchungsentwurf prüfen; OCR→Verbindlichkeit-Klickpfad,
Vision EU). Reihenfolge im Rest-SOLL nach Bedarf (R5/R6); Details in `docs/NACHFOLGE_PLAN.md` Abschnitt R + `docs/OFFENE_PUNKTE.md`.
**R4 (Rechnungs-Übernahme aus WorkFloh: fertige Rechnung → Forderung/Buchung; Austauschformat v2; API/Push bewusst offen) ist abgeschlossen + gemergt (PR #95).**
**R3 (Verbindlichkeiten aus Foto/PDF + eigene Verbindlichkeiten-Ansicht + Zahlungsziel je Rechnung) ist abgeschlossen + gemergt.**
**R2b (Sammelzahlungen — eine Bankzahlung auf mehrere offene Rechnungen) ist abgeschlossen + gemergt.**
**R2a (Skonto-Buchung mit USt-/Vorsteuer-Korrektur §17 UStG) ist abgeschlossen + gemergt.**
**R1 (Verzugszinsen/Mahngebühren buchen) ist abgeschlossen + gemergt.**
**Abschnitt B (Bilanzierung) ist abgeschlossen:** B1 (Modus + Kontengrundlage), B2 (GuV), B3 (Bilanz) erledigt + gemergt.
**Mehrmandantenfähigkeit (Abschnitt A: M1–M3) ist abgeschlossen** — siehe `docs/MANDANTEN.md`.

**Kopf-Status (Stand nach R4):** SW **v91** · Tests **885/885** grün · 94 JS-Module.
**Abschnitt A komplett (M1/M2a/M2b/M3); Abschnitt B komplett (B1/B2/B3); R1 ✅; R2a ✅; R2b ✅; R3 ✅; R4 ✅.** Reihenfolge im Plan:
~~M1~~ → ~~M2a~~ → ~~M2b~~ → ~~M3~~ (Mehrmandanten) · ~~B1~~ → ~~B2~~ → ~~B3~~ (Bilanzierung) · ~~R1~~ → ~~R2a~~ → ~~R2b~~ → ~~R3~~ → ~~R4~~ → Rest-SOLL (R5/R6).
**R2b erledigt:** `domain/zahlungsabgleich.js` — `findeSammelzuordnung` (tiefenbeschränkte Subset-Summe: Kombinationen
gleichgerichteter offener Posten, deren Summe der Zahlung ± Toleranz entspricht, ≥2 Teile, Score nach Referenz/Name/
Datumsnähe), `verteileSammelzahlung` (Zahlbetrag der Reihe nach verteilen, Restbildung/Überzahlung sauber),
`sammelBuchungZeilen` (eine Zeile je Rechnung, Bank an Forderung/Verbindlichkeit, ausgeglichen). UI: Knopf
**„◫ Sammelzahlung (mehrere Rechnungen)"** im Bankimport (`documents.js`) → Auswahl-Panel mit Checkboxen
(Vorschlag vorausgewählt, laufende Summe/Status) → `saveEntwurf` (manuell, GoBD). +22 Tests.
**R1 erledigt:** `domain/mahnwesen.js` bucht Verzugszinsen/Mahngebühren als **Forderung 1400 an Zinserträge 2650 /
sonstige betr. Erträge 2700 — ohne USt** (nicht steuerbarer Schadensersatz §288 BGB / Abschn. 1.3 UStAE):
`mahnbuchungZeilen`/`mahnbuchungEntwurf` (rein, node-getestet) + Knopf **„Als Buchungsentwurf übernehmen"** im
Mahnschreiben (`reports.js` → `saveEntwurf`, **manuell/kein Auto-Festschreiben**, GoBD). **EHRLICH:** USt-Freiheit
gilt für echten Schadensersatz; vertraglich vereinbarte Bearbeitungsgebühren ggf. anders → im Zweifel Berater.

**✅ Bereits fertig & gemergt (NICHT wiederholen):** Profi-Readiness **V1–V10** (Kontenrahmen, §13b,
AfA/Anlagen, Kassenbuch, USt-VA komplett, Berichte/SuSa, GoBD/GDPdU, DATEV-EXTF, Kleinfälle,
Selbstdiagnose) · A1–A3 (Mahnwesen/Verbindlichkeiten/Zahlungsabgleich) · Entscheidungen 2026-06-17
(ELSTER-Link, AVV-Links, §19-Onboarding, abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung,
ZUGFeRD-Empfang+KoSIT-Precheck, A4 offene Anbindung Stufe 1) · **M1 + M2a + M2b Mehrmandanten (Fundament + Core + Sperrbildschirm-UI).**
**PRs #64–#84 + M1/M2a/M2b, Tests 699/699, SW `v82`.**
→ **Nicht** Erledigtes neu bauen, **kein** Redesign. „Vx/Mx/Bx" = Schritt aus dem Plan, keine Programm-Version.

### V2 — was genau zu bauen ist (§13b/Reverse-Charge + EU/Ausland)
Ziel: Die Firma bezieht selbst Leistungen mit **Steuerschuldumkehr** — z. B. **Google Cloud
Vision / Mistral** (EU bzw. Ausland), Software-Abos, Drittland-Dienste. Heute kann die App das
nicht korrekt buchen. Das ist ein **MUSS** für eine echte Firma.

1. **Reverse-Charge §13b (Hauptfall, zuerst):** Eine Eingangsleistung ohne USt-Ausweis.
   Buchung erzeugt **gleichzeitig**: Aufwand (Soll) · **abziehbare Vorsteuer §13b** (Soll, Konto
   **1577**) · **Umsatzsteuer §13b geschuldet** (Haben, Konto **1787**) · Gegenkonto Bank/
   Verbindlichkeit (Haben) über den **Netto**-Betrag. Netto an Lieferant; USt und VSt heben sich
   i. d. R. auf (voller Vorsteuerabzug). Konten 1577/1787 ggf. via `addKonto` ergänzen bzw. in
   `accounts.js` seedfähig machen (mit `rolle`-Markern für die USt-VA).
2. **Innergem. Erwerb / Lieferung + Ausfuhr (danach):** ig Erwerb (Steuer + Vorsteuer), steuerfreie
   ig Lieferung, steuerfreie Ausfuhr (Drittland).
3. **USt-VA-Kennzahlen erweitern** (`export.js buildUstVa`, heute nur 81/86/66/83):
   - §13b Leistungsempfänger: **Kz 46** (Bemessungsgrundlage) / **Kz 47** (Steuer);
     abziehbare Vorsteuer §13b → **Kz 67**.
   - ig Erwerb: **Kz 89** (BMG 19 %) / **Kz 93** (Steuer); Vorsteuer ig Erwerb → **Kz 61**.
   - steuerfreie ig Lieferung **Kz 41**, steuerfreie Ausfuhr **Kz 43/Kz 21** (Formular prüfen).
   - **EHRLICH/PFLICHT:** exakte Kennzahl-Zuordnung am **amtlichen ELSTER-USt-VA-Formular** bzw.
     mit Berater verifizieren; im Zweifel konservativ + In-App-Hinweis „im Zweifel Berater".
4. **UI:** im Beleg-/E-Rechnung-/Buchungs-Fluss eine Option „§13b/Reverse-Charge" bzw. Umsatzart
   (Inland / §13b / ig Erwerb / ig Lieferung / Ausfuhr); Buchungsvorschlag entsprechend.

### Arbeitsvertrag (verbindlich — so wie die letzten 8 PRs)
- **Reine Logik ZUERST node-getestet** (`tests/run.mjs`): Buchungszeilen-Bau + VA-Kennzahlen.
  Dann erst UI (UI ist nicht headless-E2E-testbar → klar als „statisch geprüft" kennzeichnen).
- **`node tests/run.mjs` muss grün bleiben** (aktuell 444). **SW-Cache** `CACHE_VERSION` in `sw.js`
  erhöhen (→ `v64`); neue Module ins Precache. **DB-Suffix `bookledgerpro` nie ändern.**
- **1 PR für V2.** Branch z. B. `claude/v2-13b-reverse-charge-<kürzel>`. Draft-PR anlegen, CI
  abwarten, **bei grün mergen** (Freibrief), danach lokal `git reset --hard origin/main`.
- **Docs pflegen:** `OFFENE_PUNKTE.md` Abschnitt V → V2 abhaken; `PULS.md` (dieser Brief: oben
  „Aktuell: V3" setzen) + Kopf-Status; obersten `SESSIONS.md`-Eintrag schreiben (Was getan/Stand/
  Offen). PR-Beschreibung mit **ehrlicher Verifikation** (auch was NICHT geprüft wurde).
- **Steuer-Disziplin:** nichts automatisch falsch buchen; §13b/EU ist heikel → konservativ,
  Hinweise statt stiller Annahmen.

### Schnellstart-Befehle
```
node tests/run.mjs                 # erwartet 444/444 grün (vor deinen Änderungen)
git rev-parse --short HEAD         # sollte main = 607d2f2 (oder neuer) sein
```
Relevante Dateien für V2: `src/domain/accounts.js` (Konten 1577/1787 + rolle),
`src/domain/journal.js` (Buchungszeilen-Bau), `src/domain/export.js` (`buildUstVa`),
`src/domain/taxes.js` (USt-Berechnung), `src/ui/views/documents.js` + `journal.js` (UI),
`src/ai/mistral.js`/`rechtsregeln.js` (Kontierungs-Hinweise). Tests: `tests/run.mjs`.

---

**Letzte Aktualisierung:** 2026-06-17 (B3) · **Branch (letzte PR):** `claude/balance-sheet-b3-56djmn`
· **Tests:** `node tests/run.mjs` → **760/760 grün**
· **SW-Cache:** `v86` · **92 JS-Module** · **12 Bild- + 5 Icon-Assets** · **Fahrplan V1–V10 ✅ · A (M1–M3) ✅ · B (B1–B3) ✅**
· **Mehr-Sitzungs-Plan:** `docs/NACHFOLGE_PLAN.md` (je 1 PR/Sitzung; nächste = **R1 — Verzugszinsen buchen**).
· **B1 ✅:** Bilanzierung-Modus (`gewinnermittlung` euer|bilanz, Default euer) + Konten-Klassifikation
  (`domain/bilanzierung.js`) + Bilanz-Grundkonten 0800/0840/0860/0970 im Seed + Modus-Schalter (PR #87).
· **B2 ✅:** GuV (`domain/bilanz.js gewinnUndVerlust`) — Erträge/Aufwendungen je Erfolgskonto, Jahresüberschuss;
  GuV-Karte in „Auswertung" (nur Bilanz-Modus) + `buildGuvCsv` (PR #89).
· **B3 ✅:** Bilanz (`domain/bilanz.js bilanz`) — Aktiva/Passiva aus Bestandskonten zum Stichtag, Ergebnis ins
  Eigenkapital, **Aktiva = Passiva (inkl. Ergebnis)** geprüft, Eröffnungssalden (Saldenvortrag 9000 ODER Parameter);
  Bilanz-Karte in „Auswertung" + `buildBilanzCsv`; +21 Tests (760/760), SW `v86`.
· **Entscheidungen 17.06.:** ELSTER-Link ✅ · AVV-Links ✅ · §19-Onboarding ✅ · Wirtschaftsjahr ✅ ·
  Übergabe-Datenblatt ✅ · Beleg-Verknüpfung/GoBD-Aufbewahrung ✅ · ZUGFeRD-Empfang+KoSIT ✅ ·
  A4 offene Anbindung (Import/Export + Partner-Link) ✅; **nächste (groß):** Mehrmandanten → Bilanzierung.
· **V2 ✅:** §13b/Reverse-Charge + EU/Ausland (Kz 41/43/46/47/61/67/89/93, Umsatzart im Journal).
· **V3 ✅:** Anlagevermögen + AfA (GWG/Sammelposten/linear pro rata), Ansicht „Anlagen",
  Anlagenverzeichnis + AfA-Buchung-Entwurf + AVEÜR-CSV (`domain/anlagen.js`, `anlagen-store.js`).
· **V4 ✅:** GoBD-Kassenbuch + Anfangsbestände (laufender Bestand, „nie negativ"-Prüfung,
  Anfangsbestand-Buchung an 9000, CSV) — `domain/kassenbuch.js`, `anfangsbestand-store.js`,
  Ansicht „Kassenbuch".
· **V5 ✅:** USt-VA komplett — Voranmeldungszeitraum (Monat/Quartal/Jahr, ELSTER-Codes),
  Sondervorauszahlung (1/11), ELSTER-Datenpaket-Export; `domain/umsatzsteuer.js`, Karte
  „USt-VA je Zeitraum", Setting `vaZeitraum`.
· **V6 ✅:** Berichte — SuSa, Kontenblatt (laufender Saldo), Anlage-EÜR-Gruppierung;
  `domain/berichte.js`, Ansicht „Berichte", je CSV-Export.
· **V7 ✅:** GoBD-Betriebsprüfer-Export (GDPdU „Z3") — `core/zip.js` (zero-dep ZIP+CRC32),
  `domain/gdpdu.js` (index.xml-Beschreibungsstandard + CSV-Tabellen), ZIP-Paket-Button in „Berichte".
· **V9 ✅:** Kleinfälle — Bewirtung 70/30 (rechnend), Geschenke-/Kleinbetragsgrenze, Periodensperre
  (`store.festschreiben` + Einstellung), Kleinunternehmer-Warnung. **+ Simulations-Testharness**
  (`domain/demodaten.js`, `docs/TESTDATEN.md`, Berichte „Demo-Export" → echte Dateien, dok. Sollwerte).
· **V8 ✅:** DATEV-EXTF berater-fest vorbereitet — Header (Berater/Mandant/SKL/WJ), BU-Schlüssel
  9/8/3/2, §13b zeilenweiser Split ohne BU; Einstellungen-Sektion; `docs/DATEV_IMPORT.md`.
· **V10 ✅:** In-App-Selbstdiagnose (`domain/selbsttest.js`, Ansicht „Selbsttest") + manuelle
  Abnahme-Checkliste (`docs/ABNAHME_CHECKLISTE.md`).
· **Profi-Readiness (V-Fahrplan):** V1 ✅ Kontenrahmen 57 Konten + Konten anlegen/bearbeiten/löschen.
· **Mahnwesen A1 erweitert:** persistente Mahnstufe (`mahnungen[]`, `vorschlagNaechsteStufe`) +
  manuelle/editierbare Zins-/Gebühren-Erfassung im Mahnschreiben (keine Auto-Steuerbuchung).
· **Zahlungsabgleich** (Forderungen + Verbindlichkeiten, Matching, Ausgleichsbuchung,
  Teilzahlung/Skonto/Toleranz via `findeKandidaten`, **NEU Forderungs-Teilzahlung/OP-Rest**) ✓ ·
  **Bankimport** MT940+CAMT.053 ✓.
· **Nächste große Option (A4, spätere Sitzung):** **WorkFloh-/App-Anbindung** — Angebote/Arbeiten
  → Rechnung → in BLP weiterverarbeiten; Seam da (`importworkfloh.js`/`importWorkFloh`), Details
  in `OFFENE_PUNKTE.md` A4.
· **A2 — Verbindlichkeiten (Eingangsrechnungen):** `src/domain/payables.js` (+`payables-store.js`)
  — `eingangsrechnungZeilen` (Aufwand+Vorsteuer an 1600), `offeneVerbindlichkeiten`
  (Posten-Quelle für den Zahlungsabgleich, `richtung:'ausgabe'`), Status/Zahlungen/Storno.
  UI: E-Rechnung „+ Als offene Verbindlichkeit erfassen" + Bankimport matcht Ausgangszahlungen.
· **NEU OP-Liste:** Auswertungen-Karte **„Offene Verbindlichkeiten (Kreditoren)"** mit
  Fälligkeit/Überfällig-Badge + CSV-Export (`anreichereVerbindlichkeiten`/`verbindlichkeitenSummen`).
· **Mahnwesen (A1-Kern):** `src/domain/mahnwesen.js` — Fälligkeit/Überfälligkeit, Mahnstufen,
  Verzugszinsen §288 BGB, Mahnschreiben; Auswertungen-Karte „Offene Forderungen & Mahnwesen".
  **NEU B2B/Verbraucher je Kunde** (`istVerbraucher`-Flag, `kundeIstB2B`): Verzugszins-Aufschlag
  9 %/5 % + Pauschale nur B2B, je Kunde. **Offen (A1-Rest):** Mahnstufe persistent, Buchung Zinsen/Gebühren.
· **Datenschutz-Modi ABGESCHLOSSEN** (Schritt 1+2+Transparenz+AVV).
· **E-Rechnung:** Erzeugung (`erechnung.js`, CII-XML + Download) + Empfang (`erechnungLesen.js`,
  CII+UBL → Vorschlag). Ehrlich: nicht KoSIT-validiert, ZUGFeRD-PDF nicht ausgepackt.
· **NEU Bankimport (Schritt 1):** `src/domain/bankimport.js` `parseMT940()` → normalisierte
  Umsätze → Buchungsvorschlag je Umsatz (Import-Karte in Belegen). **Offen:** CAMT.053 (XML),
  echter Zahlungsabgleich auf offene Posten.

---

## 0★. LEITBILD / strategische Priorität (verbindlich beim Priorisieren)
**Der Kern-Vorteil: Komfort UND Datenschutz zugleich.** Die meisten KI-Buchhaltungs-Tools
zwingen zur Wahl „KI-Komfort ODER Datenschutz". BookLedgerPro löst das auf — Vertrauen durch
**technischen Beleg**, nicht durch Reputation/Firmenname: „hier ist belegt, dass deine Daten
das Gerät nicht im Klartext verlassen".
- **Pseudonymisierung = Schlüssel-Enabler (Bau-Schritt 1)** — funktioniert sie gut, wird ALLES
  andere einfacher: mehr Anbieter-Flexibilität, **Privat-/Bürger-Modus**, vor allem Vertrauen.
  → Status: **gebaut & gemergt** (#40–#43, anker-basiert, Transparenz-Vorschau, AVV).
- **WICHTIG / Klarstellung (Nutzer, 16.06.):** **Aktive Nutzung bleibt strikt EU**
  (Vision EU + Mistral EU, CLAUDE.md §8 gilt unverändert). **Nicht-EU-Anbieter sind NICHT
  zur Auswahl freigegeben** — sie waren nur als ruhende, strukturelle Option im Gerüst gedacht,
  nicht als Nutzer-Auswahl. Eine etwaige Öffnung wäre eine ausdrückliche Produktentscheidung
  des Nutzers; bis dahin: geschlossen/dormant.
- **Priorisierungsregel:** Features, die den Kern-Vorteil (Komfort + Datenschutz, Vertrauen
  durch Beleg) stärken/erlebbar machen, haben Vorrang — z. B. **Privat-/Bürger-Modus**,
  Anbieterwahl **innerhalb der EU**. „P2" bezieht sich auf EU-interne Wahl; Nicht-EU bleibt dormant.

## 0. BRAINSTORMING — zuerst klären (Funktionalität, ohne Code)
Am Sitzungsanfang mit dem Nutzer durchgehen; entscheidet über viele Bau-Wege:
1. **Zielgruppe/Rechtsform:** primär EÜR (Freiberufler/Kleinunternehmer) oder auch Bilanzierer (GmbH, GuV/Bilanz)?
2. **Kleinunternehmer §19:** soll das Onboarding danach fragen und global steuern (Rechnungen ohne USt, keine USt-VA)?
3. **E-Rechnung (XRechnung/ZUGFeRD):** B2B-Empfang in DE seit 2025 Pflicht — Erzeugen und/oder Einlesen? (großes Thema)
4. **Bank/Zahlungen:** Bankimport (CAMT/MT940) + Zahlungsabgleich? Macht die Ist-EÜR (§4 Abs.3) erst echt + Offene Posten.
5. **USt-VA-Abgabe:** bei Kennzahlen/CSV bleiben oder echte ELSTER/ERiC (nicht build-frei → Architektur-Entscheidung)?
6. **DATEV/Berater:** welches Format braucht der Berater konkret? Steuerschlüssel-Mapping mit ihm verifizieren (aktuell „EXTF-orientiert", nicht zertifiziert).
7. **Mandanten:** mehrere Firmen je Installation? Aktuell 1 Tresor = 1 Mandant.
8. **Geschäftsjahr:** immer Kalenderjahr? USt-VA monatlich/quartalsweise?
9. **WorkFloh-Anschluss — Umfang/Richtung:** nur Kunden+Aufträge (steht) oder auch Zeiten/Rechnungen/Zahlungen? nur Import oder Rückmeldung „berechnet"? Datei oder Sage-Sync?
10. **Betriebsprüfung/Aufbewahrung:** GoBD-Export (DSFinV-K/GDPdU), Fristen, Beleg-Originalarchiv?
11. **AVV/Datenschutz bei KI:** Auftragsverarbeitungsverträge mit Google/Mistral? Hinweis im Datenblatt?

---

## 1. Was BookLedgerPro ist (in einem Satz)
Offline-first, **verschlüsselte** Buchhaltungs-PWA (Deutschland zuerst), build-frei (native
ES-Module, keine CDNs, GitHub Pages), **EU-KI-gestützt** (Google Vision EU + Mistral EU),
GoBD/DSGVO als Architektur, vorbereitet als **Sage-Mycel**-Knoten (SBKIM).

## 2. Eckdaten / unveränderliche Fakten
- **Repo:** `lausiklauskn-png/bookledgerpro` · **Live-URL (KLEIN!):** `https://lausiklauskn-png.github.io/bookledgerpro/` (Großschreib-Variante 404't — Pfad case-sensitive)
- **DB-Suffix:** `bookledgerpro` (NIE ändern — gemeinsamer Origin auf GitHub Pages → sonst
  Kollision mit Geschwister-Apps, real beobachtet als `blocked-origin-collision`).
- **Arbeitsbranch:** `claude/general-discussion-x9xyk9`; pro Thema 1 PR, **Freibrief: mergen
  wenn sinnvoll & CI grün**. Nach Merge lokal `git reset --hard origin/main`.
- **SW-Cache:** bei jeder Shell-Änderung `CACHE_VERSION` in `sw.js` erhöhen (Browser-Lehre 4).
- **Verbindlich:** `docs/SAGE_BROWSER_LEHREN.md` (8 Browser-Lehren) + `docs/SAGE_SYNC_BRIEFKASTEN.md`
  (Sync/Briefkasten §11) + `docs/AI.md` (KI-Konzept EU).

## 3. Phasenstand (Details in ROADMAP.md)
| Phase | Inhalt | Stand |
|---|---|---|
| 0 | Fundament: Krypto (AES-GCM/PBKDF2), Shamir, IndexedDB, Durabilität, Tresor, Shell, Modi | ✅ in main |
| 1 | Buchhaltungs-Kern: SKR03, doppelte Buchführung, USt/EÜR, GoBD-Festschreibung + Hash-Kette | ✅ |
| 2 | Belege & Erkennung: verschl. Beleg-Store, Extraktion, Vorschlag, Autonomie-Schalter | ✅ |
| 3 | Aufträge/Kunden/Mitarbeiter/Kostenstellen, Rechnung→Buchung (verschlüsselt, DSGVO) | ✅ |
| 4 | Steuer & Export: USt-VA-Kennzahlen, EÜR, CSV/DATEV-orientiert, Recht-Doku in-app | ✅ |
| 5 | Sage-Mycel: SBKIM byte-kompatibel **lokal vorbereitet** | ◑ lokal fertig |
| 6 | Design-Politur: Dashboard-KPIs, Mycel-Canvas, A11y | ✅ |
| 6.1 | **Bild-Assets/Branding** (Icons, Hero, 7 Leerzustände, OG, Onboarding) — vom Nutzer 3D-generiert | ✅ |
| EU-KI | **Google Vision (EU) OCR + Mistral (EU) Kontierung/Steuer**, Claude entfernt | ✅ |

## 4. KI-Architektur (WICHTIG — EU, BYOK, opt-in)
- **OCR/Texterkennung NUR Google Cloud Vision, EU-Endpoint** `eu-vision.googleapis.com/v1`
  (`ai/vision.js`): Bild→`images:annotate`, PDF→`files:annotate`, `DOCUMENT_TEXT_DETECTION`,
  Auth `?key=`. Kamera/Foto/Scanner/PDF im Upload (`pickFile(accept, capture)`).
- **Kontierung + Steuer-Assistent NUR Mistral, EU** `api.mistral.ai/v1` (`ai/mistral.js`,
  OpenAI-kompatibel, Bearer). **Fallback** auf On-Device-Heuristik (`ai/categorize.js`),
  wenn Mistral nicht konfiguriert.
- Pipeline: `Foto/PDF → Vision EU (Text) → ai/extract (Felder) → Mistral EU (Konto) →
  ai/suggest (Vorschlag) → Entwurf` (Festschreiben bleibt manuell, GoBD).
- Config verschlüsselt: `ai/aiConfig.js` (`visionKey`, `mistralKey`, `mistralModel`),
  in Einstellungen mit **„Verbindung testen"**-Knöpfen, Direktlinks zur Schlüssel-Erstellung
  und Fehler-Klartext (`visionFehlerHinweis`). Vorbild: **Mein-WorkFloh** (gleiche Endpoints).

## 5. ✅ Live vom Nutzer verifiziert (Sichttests 2026-06-14)
- **Vision (EU): „aktiv ✓"** und **Mistral (EU): „aktiv ✓"** — beide EU-Dienste real verbunden.
  (Stolperstein: Vertex/Agent-Express-Key taugt NICHT für Vision → Standard-Cloud-Vision-Key.)
- **Geführter Browser-Sichttest (DeX/Chrome) — bestätigt:**
  - **Beleg→Buchung-Pipeline end-to-end** ✅: Schnellerfassung-Text → Erkennung (Betrag/Datum/USt/
    Vendor) → Kontierung **4930 + 1576 + 1200**, Konfidenz 90 % → Auto-Entwurf (Autonomie autonom).
  - **Plausibilität/Spielraum** ✅ (USt-vergessen-Hinweis, Entwurf trotzdem gespeichert).
  - **Entwurf-Lebenszyklus** ✅ (speichern · bearbeiten mit korrekter USt-Rückrechnung · löschen ·
    festschreiben mit Warn-Dialog · Storno → „Storno-Buchung").
  - **KI-Begründung (Mistral EU) mit §-Bezug** ✅ (z. B. „§ 4 Abs. 4 EStG" für Büromaterial).
  - **Rechnung §14** ✅ (Firmenprofil + Kunde → fortlaufende Nr. 2026-0001 → druckbar/PDF, alle
    Pflichtangaben).
  - **Auswertungen** ✅ (USt-Verprobung erkennt vergessene USt; EÜR vereinfacht + **EÜR Ist §4(3)**;
    USt-VA-Kennzahlen; GoBD-Audit; DATEV-EXTF-Export). **Zeiterfassung** ✅ (Std-Summe + Kosten).
  - Im Test gefunden & sofort gefixt (gemergt): Storno-Kaskade, KI-Kontoname, Firmenprofil-„✓",
    Position entfernen + Etikett-Umbruch, Steuer-Assistent „Claude"→**Mistral (EU)** (PRs #23–#27).

## 6. ⚠️ Ehrlich offen / ungetestet (nicht beschönigen)
- **NEU Plausibilitäts-Ebene mit Spielraum** (`src/domain/pruefung.js`): trennt harte Fehler
  (nur festschreibe-relevant) von nicht-blockierenden Hinweisen (USt vergessen, Zukunftsdatum,
  zeitgerecht, Buchungstext, Soll=Haben). Entwürfe immer speicherbar, Festschreiben bleibt streng.
  **Die neuen UI-Hinweise (Journal-Karte, Festschreib-Dialog, Beleg-Karte) sind nicht
  headless-E2E geklickt** — nur Logik node-getestet. Kein Kleinunternehmer-Schalter in den
  Einstellungen (opts vorhanden, UI-Toggle offen).
- **Browser-UI generell nicht headless E2E-getestet** (kein Headless-Browser in der
  Build-Umgebung) — Kernlogik ist node-getestet (134/134), DOM-Pfade statisch geprüft.
- **Sage Phase 5b/c/d offen** (menschlich vermittelt, fremde Repos):
  - 5b: echte `sbkim/spore.json` **in-app** erzeugen (Ansicht „Mycel-Netz") + committen +
    im Sage-Hub `status.json` registrieren + erster Handshake → `verified-spore`.
    (Bewusst KEINE erfundene spore.json eingecheckt.)
  - 5c: echter `domainVector` (Transformers.js, `Xenova/multilingual-e5-small`) statt
    `_demo` → `verified-match`.
  - 5d: Symbiose-Import (Belege aus **Mein-Tresor**, Aufträge aus **WorkFloh** → Buchungen).
  - Briefkasten-Ritual (§11.6, `docs/SAGE_SYNC_BRIEFKASTEN.md`) wird **erst aktiv**, wenn
    BookLedgerPro ein deployter Sage-Knoten ist.
- **Steuer-Recht-Resterledigung:** EÜR Zufluss/Abfluss (§4 Abs.3) ✅ (vereinfachtes Ist-Modell);
  DATEV-EXTF: Envelope + Konto/Gegenkonto + Standard-Steuerschlüssel ✅ (NICHT zertifiziert/116-Spalten); **keine** ELSTER/ERiC-Einreichung
  (nur Datenpaket). Rechnungsdokument mit §14-Pflichtangaben ✅ (druckbar via Browser-Print → PDF).
- **Performance/Lighthouse** nicht gemessen (kein Headless-Browser).
- **Lokales Offline-OCR** (Tesseract.js) nicht eingebunden — Vision EU ist der OCR-Pfad.
- **Git-Nebensache:** Abzweig `claude/eu-ki-vision-mistral` zeigt remote noch auf denselben
  Commit; der Git-Proxy erlaubt kein Branch-Löschen → bei Gelegenheit serverseitig entfernen.

## 6b. Folge-PRs
- ✅ **KI-Berater mit Rechts-Grundlage** umgesetzt: `begruendung`-Feld an der Buchung (in der
  Hash-Kette, rückwärtskompatibel); `domain/rechtsregeln.js` (kuratiertes §-Set) groundet
  `ai/berater.js` → Mistral formuliert, On-Device-Fallback; UI im Journal. „Keine Steuerberatung".
  ✅ auch im Beleg-Vorschlag (documents.js) integriert. Offen: Regel-Set erweitern.
- **EÜR §4(3) (Zufluss/Abfluss, Ist-Prinzip)** + **zertifiziertes DATEV-EXTF** — größer, eigener PR.

## 7. Nächste konkrete Schritte (Priorität)
0a. **★ AKTIVER MASTER-PLAN: `docs/OFFENE_PUNKTE.md` → Abschnitt „V. PROFI-READINESS"** —
   Vollständigkeits-Fahrplan, damit ein Steuerberater/Betriebsprüfer die Buchhaltung NICHT wegen
   fehlender Pflicht-Bausteine ablehnt. Reihenfolge **V1→V10** (V1 Kontenrahmen+anlegen, V2 §13b/
   Reverse-Charge, V3 AfA/Anlagenverzeichnis, V4 Anfangsbestände/Kassenbuch, V5 USt-VA komplett,
   V6 Anlage-EÜR/Kontenblätter, V7 GoBD-Prüfer-Export, V8 DATEV berater-fest, V9 Validierung, V10 E2E).
   **V1 erledigt** (Kontenrahmen 57 Konten + Konto anlegen/bearbeiten/löschen). **Aktuell: V2** (§13b/
   Reverse-Charge + EU/Ausland) als Nächstes.
0b. **Erledigt (A1–A3):** Mahnwesen (Fälligkeit/Mahnstufen/§288/persistente Stufe), Verbindlichkeiten
   als OP-Quelle + OP-Liste, Teilzahlungen (Debitor+Kreditor), Skonto/Toleranz-Matching.
1. **Brainstorming (Abschnitt 0) klären** — v. a. E-Rechnung, Bankimport, §19-Default, DATEV mit Berater.
2. **WorkFloh-Anschluss vollenden:** WorkFloh-Export auf `docs/WORKFLOH_IMPORT.md` ausrichten
   (oder WorkFloh-Repo/Beispiel-JSON bereitstellen) → echten End-to-End-Import testen
   (Menü „Aufträge" → „Aus WorkFloh importieren").
3. **Bild-Optimierung:** `cover.png` (~2,4 MB) / `onboard-key.png` (~1,8 MB) → WebP/kleiner
   (schnellerer Erststart, schlanker SW-Cache).
4. **Kleinbetrags-Regel (≤250 €, §33 UStDV)** an die KI-Begründung der UI verdrahten (`betragCent`).
5. **Browser-E2E** der neuen UI-Teile (Plausibilität, KI-Begründung, Rechnung-Druck, Auswertungen,
   Passwortwechsel) — bisher nur Logik node-getestet.
6. **Optional groß:** E-Rechnung (XRechnung/ZUGFeRD), Bankimport (CAMT), Sage 5b (Spore in-app +
   Hub-Registrierung; `node tools/verify_remote_spore.mjs sbkim/spore.json`), Lighthouse/Perf,
   lokaler OCR-Fallback (Tesseract).

## 8. Architektur-Landkarte (wo was liegt)
- `src/core/` crypto · shamir · db · durability · files · vault · backup
- `src/domain/` money · accounts · journal · pruefung · rechtsregeln · audit · taxes · store · documents · orders ·
  invoicing · employees · costcenters · encstore · crm-store · export · summary
- `src/ai/` extract · categorize · suggest · **aiConfig · vision · mistral** · taxAssist · **pseudonym** (Datenschutz-Modi)
- `src/sbkim/` spore · identity · domainvector · signal  (+ `tools/verify_remote_spore.mjs`)
- `src/ui/` dom · i18n · theme · mycel · mycelCanvas · empty · lock · shell ·
  `views/` dashboard · accounts · journal · reports · documents · customers · orders ·
  employees · legal · network
- `assets/` tokens.css · app.css · icon.svg · `icons/` (PWA) · `img/` (Hero/Leerzustände/OG/Onboarding)
- `sbkim/` (Repo-Root) README · SIGNAL.template.json · AUSTAUSCH-template.md (+ spore.json nach Deploy)
- `docs/` ARCHITECTURE · ROADMAP · PULS (diese Datei) · SESSIONS · **OFFENE_PUNKTE** (Backlog/
  Merkliste) · KONZEPT_DATENSCHUTZ_MODI · TRANSPARENZ_ZWISCHENSTAND.html · AI · SAGE_BROWSER_LEHREN ·
  SAGE_SYNC_BRIEFKASTEN · `legal/` (Verfahrensdokumentation, Datenschutz)

## 9. Definition of Done (aus CLAUDE.md, verbindlich)
Pro Phase/Änderung: real implementiert (kein Fake) · `node tests/run.mjs` grün · CI grün ·
ROADMAP abgehakt · **PULS.md + SESSIONS.md fortgeschrieben** · PR mit ehrlicher Verifikation
(inkl. was NICHT geprüft wurde).

## 10. Verifikations-Schnellbefehle
```
node tests/run.mjs                       # 134/134 erwartet
python3 -m http.server 8000              # lokal testen → http://localhost:8000
node tools/verify_remote_spore.mjs <url> # SBKIM-Spore prüfen (VALID/UNGÜLTIG)
```
