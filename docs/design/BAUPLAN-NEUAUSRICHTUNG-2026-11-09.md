# Bauplan: Neuausrichtung BookLedgerPro (2026-11-09)

Grundlage: Gespräch mit Klaus am 2026-11-09 (Analyse der App, Vergleich mit herkömmlichen Buchhaltungs-Apps,
Klaus' Antworten). **Noch nichts davon ist gebaut.** Jeder Schritt braucht Klaus' Ja in der Ja/Nein-Liste unten.

## 1. Wofür BookLedgerPro da ist

**Geld und Steuer für kleine Betriebe und Familien – einfach, ohne Cloud, verbunden mit den anderen Pro-Apps.**

- Kleine Betriebe mit 19 % USt: Tomy (WorkFloh), Alinas Moderaum (Boutique, Kasse, Warenwirtschaft),
  Perfect Skin Beauty / Fashion.
- Privat: Zusammenfassung für die Lohn-/Einkommensteuererklärung.
- **Nicht** dazu (Profi-Werkzeuge, keine Konkurrenz): Lohnabrechnung mit Lohnsteuer/SV-Meldungen, Bilanz für
  Kapitalgesellschaften, Kostenstellen-Controlling, zertifizierte Registrierkasse.

Grenze zur Familienakte (Klaus' Wort): **Familienakte = Dokumente, Verträge, Erledigen (Brief, Aufgabe, Frist).
BookLedgerPro = Geld und Steuer.** Ein gemeinsamer Tresor, zwei Werkzeuge, nichts doppelt.

## 2. Was BookLedgerPro anders macht als herkömmliche Buchhaltung

Herkömmlich: „Auf welches Konto buchst du das?“ – BookLedgerPro: **„Was ist passiert?“** Die Buchung entsteht nebenbei.

| # | Merkmal | Vorteil |
|---|---|---|
| M1 | **Tagesabschluss per Sprache und Foto** – abends, nicht beim Verkauf: Kasse zählen, sagen „Bestand 612 €, 20 € Kaffee ausgegeben, 300 € zur Bank“ + Foto des Zählzettels; BookLedgerPro rechnet die Tageseinnahme zurück (offene Ladenkasse). Beim Verkauf: Preise sind brutto (USt steckt drin), Quittung nur auf Wunsch, von Hand aus dem Quittungsblock | Kassenbuch wird täglich geführt, Lücken sieht man sofort |
| M2 | **Steuer-Rücklage immer sichtbar** („2.340 € gehören dem Finanzamt, frei: 5.120 €“) | keine Nachzahlungs-Überraschung, die wichtigste Frage des Inhabers |
| M3 | **Jede Zahl führt zum Beleg** (Tipp auf „USt März“ → Rechnungen → Foto), Prüfungsmappe auf Tipp | man versteht seine Zahlen; Betriebsprüfung ohne Angst |
| M4 | **Geldkarte im Tresor** zwischen Familienakte und BookLedgerPro (Abschnitt 4) | Ablage und Buchhaltung verbunden, ohne doppelte Erfassung |
| M5 | **„Frag dein Geld“ über Private Brain Pro** (Netz, nur auf eigenen Geräten) | Fragen in normaler Sprache, Antwort mit Verweis auf den Beleg |
| M6 | **Ganzer Vorgang an einem Stück**: Needs/Calculate → Angebot → WorkFloh → Rechnung → Zahlung → Nachkalkulation zurück in Calculate; Warenwirtschaft Alinas Moderaum | kleine Apps können nur Teile, große sind zu teuer |
| M7 | **KI mit verdeckten Namen** (gebaut) | Datenschutz für Salon/Boutique mit Kundendaten |
| M8 | **Kein Abo, kein Konto, offline** | Daten gehören dem Betrieb |

## 3. Umfang: was bleibt, was geht

- **Bleibt:** Belege, Eingang, Rechnungen/Angebote, Kunden, **Kassenbuch**, Bank, USt-VA, EÜR, DATEV-Übergabe an den
  Steuerberater, mehrere Betriebe (nur wenn eine Person mehrere Betriebe führt – Frage F3).
- **Wandert:** Nachkalkulation → Workflow Calculate / Needs (Klaus' Wort); BookLedgerPro liefert nur die Ist-Zahlen zurück.
- **Bleibt und wird ausgebaut:** Shop-Buchung (`shopbuchung.js`) – sie ist der Empfänger der Übergabe aus Alinas Moderaum
  (Korrektur 2026-11-09, vorher fälschlich unter „geht“); künftig „Kasse & Shop“ zusammen mit dem Kassenbuch.
- **Geht oder kommt hinter „Profi“:** Lohn und Mitarbeiter, Bilanz, Kostenstellen, alte Angebotsansicht,
  „Anderen antworten“ aus der Buchhaltung ins Netz.
- **Aufräumen:** Briefe aus dem Hauptordner nach `docs/archiv/`, CLAUDE.md auf eine Seite, `documents.js` (1.867 Zeilen)
  und `shell.js` (1.481) aufteilen.

## 4. Geldkarte (Familienakte ⇄ BookLedgerPro), Entwurf

Befund Familienakte (gelesen 2026-11-09, `app/vorgang-offen.tsx`, `portal-data.ts`): kennt Dokumentart „Kauf / Rechnung“,
Vorgänge, Aufgaben und Fristen – **keine Beträge, keinen Zahlstand**. Workflow-PDF-Baustein `briefkopf.js` erkennt schon
„Zahlungsziel“ und Mahnstufen. Das passt: die Familienakte bleibt beim Erledigen, die Geldkarte trägt das Geld.

Ablauf: Brief → Familienakte erkennt Rechnung → **eine Frage „Wozu gehört das?“** (Betrieb X · Privat steuerlich ·
nur Haushalt) → Geldkarte neben dem Dokument im Tresor → BookLedgerPro-Eingang zeigt Vorschlag, ein Tipp bestätigt →
offener Posten, Frist, Steuer-Rücklage → bezahlt (wo auch immer) → Kontoauszug bestätigt, Buchung festgeschrieben →
Familienakte zeigt „gebucht ✓ · bezahlt am …“.

Datei `<dokument>.geldkarte.json` (Fassung 1, Vorschlag):

```json
{ "art": "geldkarte", "fassung": 1, "kennung": "uuid", "dokument": "relativer Pfad im Tresor", "dokumentSha256": "…",
  "zuordnung": "betrieb|privat-steuer|haushalt", "betrieb": "alinas-moderaum", "richtung": "ausgabe|einnahme",
  "absender": "…", "betragCent": 119000, "ustCent": 19000, "faellig": "2026-11-15",
  "stand": "offen|strittig|bezahlt|gebucht", "bezahltAm": null, "ersetzt": null, "geaendertVon": "familienakte|bookledgerpro" }
```

Regeln: jede App schreibt nur ihre Felder (Familienakte: Dokument, Zuordnung, strittig; BookLedgerPro: Betrag, USt,
gebucht); „strittig“ hält Mahnfrist und Buchung an; Korrektur = neue Karte mit `ersetzt`; BookLedgerPro merkt sich
`dokumentSha256` und meldet, wenn das Dokument verschwindet oder sich ändert (Aufbewahrungspflicht). Wiederkehrende
Verträge der Familienakte erzeugen erwartete Karten im Voraus.

## 5. Alinas Moderaum (Repo `Alis-Moderaum`), Befund 2026-11-09 (Code gelesen, nicht ausgeführt)

**Aufbau:** Boutique-Shop; dahinter (versteckter Zugang) die Warenwirtschaft `warehouse.html` (IndexedDB `alm_warehouse`,
Stores `articles`/`movements`/`meta`) mit eingebauter **Kasse** (`kasse.html` + `kasse-core.js`: Bar, Karte über SumUp,
Bon mit 19 % USt, Parken von Bons).

**Wohin die Kasse schreibt:** nur in die Warenwirtschaft. `verkaufBuchen` senkt den Bestand und legt eine Bewegung
„Verkauf“ an. **Nichts geht von selbst an BookLedgerPro.** Erst der Knopf „An Buchhaltung übergeben“ in der Warenwirtschaft
schickt **eine Summe je Zeitraum** (Umsatz brutto = Verkäufe − Retouren, Wareneinkauf) als `?uebernahme=`
(`art: "buchhaltung-summen"`) an `https://lausiklauskn-png.github.io/BookLedgerPro/`; dort entstehen in der Ansicht
Shop-Buchung Entwürfe zum Bestätigen. Es fehlen: einzelne Bons, Trennung Bar/Karte, Tagessummen, Zahlart.

**Weg-Fehler:** Die Adresse ist die Web-Fassung. Die Android-App BookLedgerPro hat dafür keinen App-Link
(`AndroidManifest.xml`), die Übergabe landet also im Browser und nicht in der App mit dem Tresor.

**Kassen-Vorschriften (Einschätzung, mit Steuerberater bestätigen):** Die Regeln sind deutsch, nicht EU
(§ 146a AO, Kassensicherungsverordnung). Eine Registrierkassenpflicht gibt es nicht; wer aber eine elektronische Kasse
benutzt, muss sie absichern. Die Kasse erfüllt das heute **nicht**:
- keine zertifizierte TSE (technische Sicherheitseinrichtung), keine Signatur je Bon;
- Bon-Nummer ist ein Zähler im `localStorage` (löschbar, je Gerät neu);
- Bewegungen sind löschbar („Alles zurücksetzen“ leert `movements`), Daten unverschlüsselt im Browser;
- kein Export nach DSFinV-K (Pflichtformat für die Kassen-Nachschau), keine Kassenmeldung ans Finanzamt;
- Bon enthält nicht alle Pflichtangaben eines TSE-Bons (Transaktionsnummer, Signatur, Start/Ende).
Mit Bargeld im echten Laden darf sie so nicht laufen. Kartenzahlung über SumUp ist davon getrennt zu sehen.

**Wege (F1):**
- (a) **SumUp-Kassensystem mit TSE** für den Verkauf (laufende Kosten), die Warenwirtschaft bleibt für Lager/Shop,
  BookLedgerPro liest den Tagesabschluss bzw. DSFinV-K-Export von SumUp.
- (b) **Cloud-TSE** (z. B. eines zertifizierten Anbieters) in `kasse.html` einbinden + DSFinV-K-Export + unveränderbares
  Kassenjournal + Kassenmeldung. Größter Bau, laufende TSE-Kosten, danach eigene Kasse rechtssicher.
- (c) **Offene Ladenkasse:** Bargeld nicht elektronisch erfassen, sondern täglicher Zählbericht in BookLedgerPro (M1);
  die Kasse in der Warenwirtschaft nur für Bestand und Kartenzahlung. Am wenigsten Bau, mehr Handarbeit am Abend.

**Entschieden (Klaus 2026-11-09): Bargeld wird angenommen, Weg (c) offene Ladenkasse.** Schritte:
- Alis-Moderaum `kasse.html`: Zahlart „Bar“ entfernen; an ihrer Stelle der Satz „Bargeld in die Kassenlade, abends
  zählen (BookLedgerPro → Tagesabschluss)“. Die Kasse bleibt für Karte (SumUp), Online und Bestand. Barverkäufe
  senken den Bestand weiter über „Warenausgang“ ohne Preis/Zahlart (nur Lager, keine Kassenaufzeichnung).
- Alis-Moderaum: „Alles zurücksetzen“ im Echtbetrieb sperren; Übergabe Fassung 2 mit Tagessummen Karte/Online.
- BookLedgerPro: Tagesabschluss (M1) als erster Baustein von „Kasse & Shop“ – Anfangsbestand, gezählter Endbestand,
  Ausgaben, Bankeinzahlung, Privatentnahme/-einlage → Tageseinnahme rückgerechnet, USt 19 % herausgerechnet,
  Foto des Zählprotokolls, festgeschrieben; Lücken-Tage werden gemeldet; Quittungsvorlage zum Ausdrucken für den
  Quittungsblock (Pflichtangaben Kleinbetragsrechnung).
- Mit dem Steuerberater bestätigen: Kasse nur für Karte zählt nicht als elektronische Kasse mit Bargeld.

**Unabhängig vom Weg (Vorschlag):** Übergabe Fassung 2 mit **Tagessummen je Zahlart** (bar/karte/online) und Bon-Spanne;
Übergabe über den **Tresor** (Fach `Eingang-BookLedgerPro`) statt URL, damit sie in der App ankommt; „Alles zurücksetzen“
im Echtbetrieb sperren.

## 6. ELSTER, Gesetze, Bank, Fristen

- **ELSTER-Versand:** ERiC (Schnittstelle des Finanzamts) gibt es für Windows, nicht für Android. Weg: Tablet erstellt
  die Meldung → „Senden“ legt einen Versandauftrag in den Tresor → die Windows-Fassung sendet und legt das Protokoll
  zurück. Bis dahin Ausfüllhilfe auf die Zeile genau. Nötig: Herstellerregistrierung bei ELSTER (kostenlos, dauert
  Wochen – **Klaus beantragt**, F4), ELSTER-Zertifikat des Nutzers.
- **Gesetze automatisch:** Regel-Paket je Jahr (Steuersätze, Pauschalen, Fristen, Formularzeilen) über den eigenen
  Update-Server, mit Ed25519 unterschrieben wie die App-Updates. KI hilft beim Erstellen, ein Mensch prüft vor dem
  Veröffentlichen. Keine KI, die in der App Steuerregeln rät.
- **Bank:** Stufe 1 GiroCode (QR) an Eingangs- und Ausgangsrechnungen · Stufe 2 SEPA-Datei für Überweisung/Lastschrift ·
  Stufe 3 (später, offen) direkte Bankverbindung FinTS, Registrierung bei der Deutschen Kreditwirtschaft.
- **Fristen:** USt-VA, Steuererklärung, Aufbewahrung, offene Rechnungen, fehlende Belege, aus dem Regel-Paket.
- **Privat:** Zusammenfassung Anlage N/Werbungskosten Zeile für Zeile, Zahlen aus Belegen und Bescheiden (Geldkarte).

## 7. Reihenfolge (Vorschlag)

1. Ausmisten und Aufräumen (Abschnitt 3) – 2–3 Sitzungen
2. Eingang + Geldkarte Fassung 1 in BookLedgerPro, Gegenstück in der Familienakte – 3–4 Sitzungen
3. Kasse per Sprache/Foto, Tagesabschluss, Steuer-Rücklage auf der Startseite (M1, M2) – 2–3 Sitzungen
4. Zahl → Beleg, Prüfungsmappe, Fristen (M3) – 2 Sitzungen
5. Regel-Paket 2027 + Ausfüllhilfe USt-VA/EÜR/Anlage N – 3 Sitzungen
6. Bank Stufe 1 und 2, Übergabe Alinas Moderaum Fassung 2 – 2–3 Sitzungen
7. ELSTER-Versand über Windows (nach Registrierung) – eigener Abschnitt
8. „Frag dein Geld“ mit Private Brain Pro (M5) – 1–2 Sitzungen

## 8. Ja/Nein-Liste für Klaus

| Nr | Frage | Ja/Nein |
|---|---|---|
| J1 | Ausrichtung Abschnitt 1 und Umfang Abschnitt 3 so übernehmen | |
| J2 | Geldkarte nach Abschnitt 4 als gemeinsames Format (BLP + Familienakte) | |
| J3 | Mit Schritt 1 (Ausmisten) beginnen | |
| J4 | Regel-Paket statt KI-Raten für Gesetzesänderungen | |
| J5 | ELSTER-Versand über die Windows-Fassung, Android über den Tresor | |
| J6 | Bank in Stufen, FinTS erst später entscheiden | |

Offene Fragen:
- ~~F1~~ **entschieden:** Weg (c) offene Ladenkasse (Klaus 2026-11-09).
- ~~F2~~ **entschieden:** Bargeld wird angenommen.
- **F3** Betreut eine Person mehrere Betriebe auf einem Gerät (dann bleibt „mehrere Betriebe“), oder hat jeder Betrieb sein eigenes Gerät?
- **F4** ELSTER-Herstellerregistrierung jetzt beantragen?
- **F5** Private Brain Pro: nur „Frag dein Geld“, oder auch Notizen → Fristen?

## 9. Startauftrag zum Einfügen

```
Repo lausiklauskn-png/BookLedgerPro, Branch laut Sitzung.
Zuerst lesen: docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md (ganz), dann CLAUDE.md, docs/PULS.md.
Klaus' Ja/Nein-Liste (Abschnitt 8) ist Grundlage: nur Schritte mit „Ja“ bauen.
Erster Schritt bei J3=Ja: Ausmisten nach Abschnitt 3 – Lohn/Mitarbeiter, Bilanz, Kostenstellen,
Shop-Buchung, alte Angebotsansicht hinter „Profi“ oder entfernen (Daten nie löschen, nur ausblenden
und mit Sicherung), Nachkalkulation nach Calculate verweisen; Briefe nach docs/archiv/.
Proben: node tests/run.mjs, smoke_design, smoke_ohne_web; Basic nachziehen.
Nicht: nichts veröffentlichen ohne Klaus' Wort, keine Daten löschen, kein Release erneut auslösen,
Alis-Moderaum-Kasse nur nach Abschnitt 5 „Entschieden“ ändern (Weg c).
```
