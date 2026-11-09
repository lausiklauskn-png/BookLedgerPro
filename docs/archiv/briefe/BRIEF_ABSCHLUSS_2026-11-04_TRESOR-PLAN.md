# Abschluss: Tresor-Plan für alle Pro-Apps, 3./4. November 2026

Auftrag: `BRIEF_SITZUNG_2026-11-03_TRESOR-UEBERSICHT.md` (dieses Repo) und die Übergabe aus Familienakte #70
(`BRIEF_ABSCHLUSS_2026-11-03_TRESOR-UEBERGABE-AN-CLAUDE.md`). Karte: https://claude.ai/artifact/Gp65AdKtqk7wf3wiwxdnaK
(Version 3, mit Klaus' Entscheidungen, Plan und Aufräumschritten).

## Klaus' Entscheidungen

1. Hilfe-Seite „Wo liegt was?“ in jede Pro-App.
2. SD-Karte aufräumen: Ersatzschlüssel-Datei, 0-Byte-Sicherungen, `workfloh.json`, alter Ablageordner – Klaus löscht selbst
   (Schritte auf der Karte; Ersatzschlüssel zuerst ausdrucken/woanders sichern).
3. Familienakte legt neue Originale im Pro-Tresor ab.
4. „Ja zum Plan“: jede App verbindet sich einmal mit dem Hauptablageordner (Ordner mit `tresorordner.json`), legt ihren
   eigenen Ordner selbst an, öffnet danach immer denselben Tresor, keine Vermischung, nichts Offenes in den Tresor,
   Original mit echtem Namen speichern. Dateinamen im Tresor bleiben Nummern (Absicht).
5. „Ja zu 1 und 2“: zusammenführen und Test-Versionen fürs Tablet; ausdrücklich: „Veröffentliche die Test-APKs von
   Familienakte 2.28.18 und Workflow PDF Pro 1.0.14.“ Die Frage „über den Server eingerichtet“ hat Klaus gestrichen.

## Gebaut und auf main

| App | Bau-PR | Version-PR | Nachweis-PR |
|---|---|---|---|
| Familienakte | #71 | #72 | #74 |
| Workflow PDF Pro | #62 | #63 | #64 |
| BookLedgerPro | #449 | #450 | #451 |
| Private Brain Pro | #126 | #127 | #128 |

- **Familienakte:** „Jetzt Abgleich durchführen“ prüft den Datentresor selbst (vorher immer Fehler „derselbe Ordner“);
  `FA_TRESOR_FREMDE_KENNUNG` → „Anderer Tresor verbunden …“; falscher Ordner vor der Passwortfrage erkannt; Bestätigung
  nach Ordnerwahl; Empfehlung „neue Originale im Ordner Familienakte“; Hilfe „Wo liegt was?“.
- **Workflow PDF Pro:** Hauptablageordner oder „Workflow PDF Pro“ öffnen dieselbe Ablage (keine Verschachtelung);
  Rückfrage vor neuer Ablage/neuem Tresor; Warnung bei „Speichern unter“ (PDF, workfloh.json, ZIP, Ersatzschlüssel) in
  den Tresor; Hilfe. Tresor-Paket unverändert.
- **BookLedgerPro:** keine 0-Byte-Sicherungen mehr (Inhalt im Zwischenspeicher, Löschen bei Fehler); Rückfrage beim
  Speichern in den Tresor; „Tresorordner anlegen“ nur nach Rückfrage; „Original speichern …“ mit echtem Namen; Hilfe.
- **Private Brain Pro:** Ersatzschlüssel-Datei wird nicht neben den Tresor geschrieben (Warnung, anderer Ort);
  einheitliche Ordnerwahl; Hilfe mit Hinweis, dass „Ablageordner wählen“ offene Kopien anlegt.

## Veröffentlicht (nur Android, Klaus' Wort)

| App | Fassung | Lauf | SHA-256 | Download |
|---|---|---|---|---|
| Familienakte | 2.28.18 (sichtbar 2.28.1) | 41742673788 | `d62138c5…62e3` | [APK](https://github.com/lausiklauskn-png/Meine-Familienakte/releases/download/android-v2.28.18/Familienakte-android-v2.28.18.apk) |
| Workflow PDF Pro | 1.0.14 / 15 | 41749829952 | `ba438634…df2a` | [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.14/Workflow-PDF-Pro-1.0.14.apk) |
| BookLedgerPro | 0.1.9 / 10 | 41742187280 | `8d7f340f…1250` | [APK](https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.9/BookLedgerPro-0.1.9.apk) |
| Private Brain Pro | 1.0.45 / 45 | 41746092281 | `fbed7652…d1b7` | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.45/Private-Brain-Pro-1.0.45.apk) |

Alle vier APKs anonym von GitHub geladen; Größe und SHA-256 gleich den veröffentlichten Prüfsummen. family-projekt.de war aus
der Sitzung nicht erreichbar (Proxy 403); den Server prüfen die Freigabeläufe selbst. Keine Windows-Fassung veröffentlicht.
Diese Fassungen nicht erneut ausgeben.

## Grenzen und Offenes

- **Nichts am Tablet/SD-Karte geprüft.** Die sechs Gerätefälle aus der Familienakte-Übergabe bleiben offen.
- Windows: die neuen Warnungen/Ordnerprüfungen fehlen dort noch (WPP, PB, BLP-Rückfrage).
- Warnung vor offenen Dateien greift nur auf Gerätespeicher/SD-Karte, nicht bei Downloads/Drive/Teilen.
- Wackelige Tests: PB `shared-engine` PDF-Renderer (`PDF_UNAVAILABLE`, #127 einmal neu gestartet, dann grün);
  WPP `NativeChromeTest` im Emulator (`Connection reset`, native Abnahme 41745099404 einmal neu gestartet, dann grün).
- BookLedger Basic: `src/`-Teile von #449 (Hilfe, Tresorordner-Ansicht) noch nicht nachgezogen.
- BLP-Tresor-Ansicht zeigt nur 5 der 9 Fächer; FA „Pro-Eingang prüfen“ nur im Sicherheitscenter, nicht in der
  Eingangszentrale; FA-Startseitenknopf „Abgleich“ trägt noch die alte FaWoGa-Erklärung.
- Codex-Prüfungen liefen nicht (Kontingent aufgebraucht) – kein Befund, aber auch keine Zweitmeinung.
- SD-Karte: Klaus räumt selbst auf (Schritte auf der Karte). Wartende WPP-Übergabe in `Eingang-Familienakte` mit
  „Pro-Eingang prüfen“ übernehmen.

## Stundennachweis

- Erste Spur: 03.11.2026 20:04 UTC (Repos geholt, Brief gelesen). Letzte Spur: 04.11.2026 ≈ 01:30 UTC (Abschlussbrief).
- Blöcke: Brief/Karte lesen und drei Fragen (20:04–20:10) · Warten auf Klaus, PR #70 lesen, seine Tresor-Fragen und Fotos
  (bis ≈ 22:30) · Plan und Bau in vier Repos parallel, PRs (22:34–23:15) · Prüfungen, Zusammenführen (bis 23:34) ·
  Versionserhöhung, Freigabeläufe, Downloadprüfung, Nachweise (23:35–01:30; überwiegend Warten auf CI).
- Obergrenze des Fensters: ≈ 5 h 25 min einschließlich Wartezeiten; aktive Zeit nicht gemessen. Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```
Repos: Meine-Familienakte, Workflow-PDF-Pro, BookLedgerPro, Privat-Brain-Pro – jeweils frisch von origin/main.
Zuerst lesen: BookLedgerPro/BRIEF_ABSCHLUSS_2026-11-04_TRESOR-PLAN.md und die Karte https://claude.ai/artifact/Gp65AdKtqk7wf3wiwxdnaK.
Stand: Tresor-Plan in allen vier Apps gebaut und auf main; Android-Testfassungen FA 2.28.18, WPP 1.0.14, BLP 0.1.9,
PB 1.0.45 veröffentlicht (nicht erneut ausgeben). Nichts am Tablet geprüft.
Erste Schritte: Klaus' Rückmeldung vom Tablet aufnehmen (Ordnerwahl, Warnungen, Abgleich, „Wo liegt was?“, Pro-Eingang).
Danach nach seinem Wort: Windows-Seite der Warnungen, BookLedger Basic nachziehen, wackelige Tests (PB PDF-Renderer,
WPP NativeChromeTest) untersuchen.
Nicht: nichts veröffentlichen ohne Klaus' Wort; keine Passwörter/Ersatzschlüssel in Dateien oder Chat; Tresor-Paket nur in
Workflow-PDF-Pro ändern; keine Dateien auf Klaus' SD-Karte löschen; Forschung nur in Kimhub.
```
