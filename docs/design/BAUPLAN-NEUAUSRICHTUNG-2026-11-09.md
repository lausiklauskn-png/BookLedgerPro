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
| M1 | **Kasse per Sprache und Foto** („Heute 412 € bar, 20 € Kaffee für den Laden“ + Foto des Zählzettels) | Kassenbuch wird täglich geführt, Lücken sieht man sofort |
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
- **Geht oder kommt hinter „Profi“:** Lohn und Mitarbeiter, Bilanz, Kostenstellen, Shop-Buchung (ersetzt durch die
  Übergabe aus Alinas Moderaum), alte Angebotsansicht, „Anderen antworten“ aus der Buchhaltung ins Netz.
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

## 5. Alinas Moderaum (Repo `Alis-Moderaum`), Befund 2026-11-09

- Boutique-Shop + Warenwirtschaft (`warehouse.html`, IndexedDB `alm_warehouse`) + **virtuelle Kasse** (`kasse.html`,
  `kasse-core.js`: Bar, Karte über SumUp, Bon mit 19 % USt).
- Übergabe an BookLedgerPro existiert: „An Buchhaltung übergeben“ → `?uebernahme=` mit `art: "buchhaltung-summen"`
  (Summen eines Zeitraums, Entwürfe zum Bestätigen).
- **⚠ Rechtlich zu klären (Frage F1):** Eine Kasse, die Barverkäufe elektronisch erfasst, ist nach meinem Kenntnisstand
  ein elektronisches Aufzeichnungssystem im Sinne der Kassensicherungsverordnung – dann braucht sie eine zertifizierte
  TSE und muss dem Finanzamt gemeldet werden. Das ist mit dem Steuerberater zu bestätigen. Wege:
  (a) SumUp-Kassensystem mit TSE für den Verkauf, BookLedgerPro liest dessen Tagesabschluss/Export;
  (b) Cloud-TSE eines Anbieters in `kasse.html` einbinden (laufende Kosten);
  (c) offene Ladenkasse: keine elektronische Barerfassung, nur täglicher Zählbericht in BookLedgerPro (M1).
- Für das Kassenbuch braucht BookLedgerPro **Tagessummen getrennt nach Bar und Karte**; heute kommen Zeitraumsummen.
  Vorschlag: Vertrag `buchhaltung-summen` Fassung 2 mit Tageszeilen.

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
- **F1** Kasse Alinas Moderaum: Weg (a), (b) oder (c)? Vorher mit dem Steuerberater klären.
- **F2** Führt Alinas Moderaum Bargeld in der Kasse, oder nur Karte?
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
Alis-Moderaum-Kasse nicht ändern, bevor F1 entschieden ist.
```
