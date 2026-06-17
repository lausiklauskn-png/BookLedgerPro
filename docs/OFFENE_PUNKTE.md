# OFFENE PUNKTE — unbedingt beachten · nacharbeiten · verbessern

> **Lebende Merkliste.** Hier wird festgehalten, was wichtig ist, noch fehlt, nachgearbeitet
> oder verbessert werden muss — damit über Sitzungen hinweg nichts verloren geht. Ergänzt
> `ROADMAP.md` (Phasen), `docs/PULS.md` (Stand/Leitbild) und `docs/SESSIONS.md` (Verlauf).
> Erledigte Punkte abhaken und ins SESSIONS-Log verschieben. Letzte Pflege: **2026-06-16**.

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

**Festgelegte Bau-Reihenfolge (je eigener PR, Freibrief-Merge):**
1. ✅ ELSTER-Weiterleitungs-Link + AVV-Anbieterlinks (klein) — *diese Sitzung*.
2. ✅ §19-Kleinunternehmer-Abfrage im Onboarding (Punkt 27) — *erledigt*.
3. ✅ Abweichendes Wirtschaftsjahr (Punkt 28) — *erledigt*.
4. ✅ Steuerberater-Übergabe-/Datenblatt (Punkt 31) — *erledigt*.
5. ✅ Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung (Punkt 29) — *erledigt*.
6. ✅ ZUGFeRD-Empfang (PDF→CII) + KoSIT-Pflichtfeld-Precheck — *erledigt* (ZUGFeRD-Erzeugen offen, PDF-Lib).
7. A4 Anbindung **erweitert (Nutzer 17.06.)** — **als Nächstes**: WorkFloh ist **public** → **beidseitige Verlinkung**
   (WorkFloh ↔ BookLedgerPro) **und generische Anbindung an andere Buchhaltungssoftware**
   (Import/Export-Schnittstellen, offene Formate). (groß).
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
- [ ] **V-Bilanz — Bilanzierung (GmbH/OHG, GuV + Bilanz, §4 Abs.1/§5) [BESCHLOSSEN 2026-06-17].** Eigener großer PR.
- [ ] **V-Lohn — Lohnbuchhaltung [KANN/extern].** Heute nur Zeiterfassung (`employees.js`); echte
      Lohnabrechnung/SV/Lohnsteuer ist eigenes Produkt — i. d. R. separate Software/Berater.
- [ ] **V-Multi — Mehrmandantenfähigkeit [KANN].**

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
**Noch offen [SOLL]:** **Buchung** von Zinsen/Gebühren als Ertrag (Konto-Mapping + USt-Behandlung)
— bewusst manuell/separat im Journal, kein Auto-Buchen; Eingangsrechnungs-Verzug (Gegenseite);
Zahlungsziel je Rechnung statt global.

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

**Noch offen [SOLL]:** **Skonto** (Zahlungsbedingungen je Rechnung), Verzug der Gegenseite
(Eingangsrechnungs-Mahnung erhalten/prüfen); Teilzahlungs-Matching (siehe A3); Erfassung von
Verbindlichkeiten auch aus **Foto/PDF-Belegen** (heute aus E-Rechnung-XML); eigene
**Verbindlichkeiten-Ansicht** zum manuellen Anlegen/Bearbeiten (heute nur via E-Rechnung-Import).

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

**Noch offen [SOLL]:**
- **Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG)** — bewusst NICHT automatisiert
  (Korrektheit vor Bequemlichkeit); heute nur Hinweis, manuelle Buchung.
- **Sammelzahlungen** (eine Zahlung auf mehrere Rechnungen), Score-Schwelle mit expliziter
  Mehrfach-Auswahl in der UI.

### A4. App-Anbindung / WorkFloh-Integration **[SOLL] — spätere Sitzung, sauber als Option vorbereiten**
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
- **[SOLL] Bankformate härten:** keine vollständige **SWIFT-(MT940)/ISO-20022-(CAMT)**-Validierung;
  reale Bank-Dialekte testen; weitere CAMT-Varianten (.052/.054), Strukturierte RmtInf.
- **[SOLL] DATEV-EXTF:** „EXTF-orientiert", **nicht** das zertifizierte 116-Spalten-Format;
  Steuerschlüssel-Mapping nur Standardsätze → mit Berater/DATEV verifizieren.
- **[SOLL] PII-Erkennung über Anker hinaus (NER):** heute anker-basiert (nur bekannte Stammdaten).
  Unbekannte Dritt-Namen in Fremdbelegen werden nicht erkannt → optionale lokale NER vormerken.
- **[SOLL] Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person) für Pseudonymisierung/CRM
  (P7); heute flache Anker, 1 Tresor = 1 Mandant.
- **[SOLL] UI end-to-end testen:** kein Headless-Browser in der Bau-Umgebung → DOM-/IndexedDB-Pfade
  sind nur statisch geprüft. Manuelle Sichttests dokumentieren oder Headless-E2E einführen.

---

## C. NIEDRIG / SPÄTER

- **[BESCHLOSSEN 2026-06-17] ELSTER:** Datenpaket-Download **+ Weiterleitungs-Link** zur Anbieter-Seite
  (elster.de) — **kein** ERiC-Direktversand (nicht build-frei). Stufe 1 (Link) ✅ umgesetzt.
- **[KANN] Lokales Offline-OCR** (z. B. Tesseract.js) als Vision-Alternative/Fallback.
- **[KANN] Privat-/Bürger-Modus** (vereinfachte Oberfläche für Privatpersonen/Vereine) — baut auf
  dem Pseudonymisierungs-Enabler auf.
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
