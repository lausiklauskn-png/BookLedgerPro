# Abschluss Pro-Umbau 7 (2026-10-29, Vormittag)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro (Privat-Brain-Pro unverändert; Meine-Familienakte nur gelesen). Auftrag: Klaus' Befunde aus der
Gegenprobe am Tablet (BookLedgerPro 0.1.2 + Workflow PDF Pro 1.0.8, Samsung, zwei Fenster nebeneinander) aufnehmen und beheben; am Ende (Klaus' Wort)
„die Downloads für die aktuellen Versionen bereitstellen“, Abschluss, Brief, Forschung mit Arbeitszeit.

## Klaus' Befunde und was daraus wurde

| Befund (Klaus, mit Bildern) | Ursache | Behoben in |
|---|---|---|
| Installation über die Links, Scanner sofort offen | — (bestanden) | — |
| Belegliste zu breit, rechts verschwindet der Knopf, keine weitere Aktion sichtbar | `.table td.actions { width: 1% }` (schlanker, #394) galt auch für die Belegliste; mit `table-layout: fixed` wurde die Spalte 4–10 px breit, ⋯ lag 40–180 px außerhalb | BLP #410: feste Spaltenbreite, „An Pro-App geben …“ zusätzlich mit Worten im ⋯-Menü |
| Datum/Größe: „die 8, die 9 immer von einer anderen Zahl überschrieben“ | Festbreitenschrift des Tablets breiter als die Spalte, kein Überlauf-Schutz | BLP #410: normale Schrift mit gleich breiten Ziffern, breitere Spalte, `overflow: hidden` |
| „Ich klicke rauf, sehe nur den Text … kann nicht löschen oder weitergeben“ | Tipp klappte nur den Text auf | BLP #410: Vorschau (`src/ui/belegVorschau.js`): PDF-Seiten (pdf.js, 3 + weitere), Bild, Text; Weitergeben, Löschen, Schließen |
| Schnellerfassung: Fotos per Copy-Paste/Hineinziehen | gab es nicht (Familienakte kann nur Hineinziehen) | BLP #410: Bild/PDF einfügen oder hineinziehen → Beleg |
| „Nach dem Teilen ist Workflow PDF zu BookLedgerPro geworden“; der Scan fehlte in der Liste; „sollte wieder zurück zu Workflow-PDF springen“ | Samsung startete eine **zweite** BookLedgerPro im Fenster der sendenden App (Bild: zwei BLP-Fenster gleichzeitig) | BLP #410: zweite Kopie reicht an das offene Fenster weiter und schließt sich nach dem Speichern; bei laufender App zurück zur sendenden App |
| Workflow PDF Pro: „verschlüsselt gespeichert“ bei jedem Klick, Rechenaufwand | Kern speichert 350 ms nach jedem Klick; im Tresor je drei verschlüsselte Schreibvorgänge mit Rücklesen | WPP #43: Arbeitsstand gesammelt (10 s Ruhe, Speichern, Schließen, Hintergrund, Sperren), Meldung nur bei > 1,2 s |
| (aus den Bildern) „Durchsuchbar“ beim Direktstart leer | Kern setzt den Zustand erst nach dem Zeichnen | WPP #43: sichtbarer Haken folgt dem Zustand (Kern unverändert) |
| Punkt 4 (ältere Fassung) | nicht prüfbar (nur aktuelle Fassung da) | — |
| Punkt 5 (schwebende Leiste über „Zur Anmeldung“ am Handy) | im Emulator bestätigt (Release-Lauf 1 blieb davor stehen) | BLP #411: Deckblatt unten Platz für die Leiste |
| Punkt 6 (PWA) | noch nicht gemeldet | offen |

## PRs

| PR | Inhalt | CI |
|---|---|---|
| WPP #43 | Sammeln im Tresor, stille Meldung, Haken „Durchsuchbar“, 1.0.9 / Buildnummer 10 | grün, übernommen `3ff194c` |
| BLP #410 | Belegliste, Datum, Vorschau, Einfügen/Hineinziehen, Teilen ohne zweites Fenster, Android 0.1.3 / Buildnummer 4, `sw.js` v279 | grün, übernommen `023b531` |
| BLP #411 | Deckblatt: Platz für die schwebende Leiste (Punkt 5), Release-Probe schließt die Leiste, `sw.js` v280, Doku-Entwurf | grün, übernommen `a64315b` |
| WPP #44 | `CLAUDE.md`: 1.0.9 | grün, übernommen |
| Basic #18, #19 | Pro `023b531` und `a64315b` nachgezogen | grün, übernommen |

Proben: BLP `run.mjs` 2602/0 · neu `smoke_befunde7` **33 grün** (Gegenprobe ohne CSS: 8+ rot) · `test-native` 48 · alle Browser-Proben grün (Liste im PR).
WPP `test-vault-journal` 26/26 (+4, Gegenprobe 2 rot) · `test:native-web` 57/57 · `test-scan-direkt` 2/2 (Gegenprobe rot). Basic `basic_gleichstand` 23 ·
`run.mjs` 2600/0 · `smoke_befunde7` 19 · `smoke_design` 92.

## Veröffentlicht (nur Android, Klaus' Wort „die Downloads für die aktuellen Versionen bereitstellen“)

- **Workflow PDF Pro 1.0.9:** [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.9/Workflow-PDF-Pro-1.0.9.apk) — Lauf 40840592772
  (Versuch 1), Quelle `3ff194c` (= #43), Buildnummer 10, 83.242.447 B, SHA-256 `c1abd2dd7171176364fae582a01ee313f19b0c846ff9e17995bfa8fee599474f`;
  unabhängig geladen, gleich.
- **BookLedgerPro 0.1.3:** erster Lauf 40840596381 rot in der Emulator-Probe — die ausgeklappte SBKIM-Leiste lag über „Zur Anmeldung“, die Probe fand keine
  freie Stelle und wischte zwei Minuten ins Leere (Forschung § 21.9). Behoben in der App (Deckblatt unten so viel Platz wie die Leiste, = Klaus' Punkt 5) und in
  der Probe (Leiste im Wegwerf-Emulator über ihren eigenen Knopf schließen): BLP #411. **Zweiter Lauf 40846706541 grün:** [Release](https://github.com/lausiklauskn-png/BookLedgerPro/releases/tag/v0.1.3) (Repo privat, mit Anmeldung)
  und über den eigenen Server `https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-0.1.3.apk`; Quelle `a64315b` (= #411), Buildnummer 4,
  28.286.098 B, SHA-256 `61f704b93a9c98912b5b422f372888735a622d28aa1f149516f7a46aa8fb61cd`, Zertifikat `7a6217eb…`. Im Lauf: signierte Erstinstallation,
  Tresor anlegen, überinstallieren, Tresor noch da; Download bytegleich, Update-Datei unterschrieben, Hochladen und Außenprüfung grün. ⚠ Aus der Sitzung
  nicht selbst geladen (Repo privat, eigener Server im Behälter gesperrt). In der App: Über → „Auf Updates prüfen“ meldet 0.1.3 (0.1.2 kennt den Server).
- **PWA:** BookLedger Basic über Pages (Merges #18, #19).

## Gegenprobe für Klaus (am Tablet)

1. Beide APKs über die vorhandenen Apps installieren (Workflow PDF Pro zuerst).
2. BookLedgerPro → Belege in geteilter Ansicht und im Vollbild: ⋯ rechts sichtbar, Datum vollständig.
3. Tipp auf einen Belegnamen: das Dokument erscheint; „Weitere Seiten“, „An Pro-App geben …“, „Löschen“, „Schließen“.
4. Schnellerfassung: ein Foto aus der Galerie hineinziehen oder kopieren + einfügen → neuer Beleg „Eingefügt …“.
5. „Mit Workflow PDF scannen“ → Haken „Durchsuchbar“ sichtbar gesetzt → scannen → „Teilen“ → BookLedgerPro: kurze Meldung „An BookLedgerPro übergeben“,
   im Fenster steht wieder Workflow PDF; im BookLedgerPro-Fenster ist der Scan in der Liste (bei gesperrtem BookLedgerPro: nach dem Entsperren).
6. Workflow PDF Pro: im Editor mehrere Felder setzen — keine Meldung bei jedem Klick; „Speichern“ oder Zurück zur Bibliothek schreibt den Stand.
7. Am Handy: „Zur Anmeldung“ frei, auch ganz unten gerollt. BookLedger Basic (PWA) mit Scanner.

## Nicht gemessen / offen

- Nichts davon am Tablet. Zweites Fenster und Rücksprung: Java nur in der CI übersetzt, kein Samsung-Fenster im Emulator.
- Sammeln in Workflow PDF Pro: bis zu 10 s Arbeitsstand nur im Arbeitsspeicher; beim Wechsel in den Hintergrund wird geschrieben, ein harter Absturz davor kann
  diese Sekunden kosten (benannt, Klaus' Wunsch „erst beim Speichern“).
- Windows (BLP, WPP, PB 1.0.42) nicht veröffentlicht — erst auf Klaus' Wort.
- Nicht begonnen: Private Brain V3, WPP-Windows Tresorordner (beide nach Rückfrage).
- Klaus' Nachricht enthielt versehentlich ein Passwort; es steht nirgends in Repos oder Verlauf (geprüft), nur im Chat. Klaus wurde geraten, es zu ändern.

## Stundennachweis

Erste Spur 06:47 (Ortszeit Berlin, 05:47 UTC: Behälter angelegt, erste Abfrage), Klaus' Befunde 07:45–08:15 (Bilder vom Tablet), Commits
08:34 → 10:30 in einem Block, Abschluss gegen 10:35. Dazwischen Wartezeiten auf CI und zwei Veröffentlichungsläufe (WPP einmal, BLP zweimal).
Summe der Blöcke ≈ 3,8 h, Spanne ≈ 3,8 h. Klaus' Zeit am Tablet (Gegenprobe, Bilder, Diktat) liegt in dieser Spanne; seine eigene Angabe geht vor.
Zeile in `docs/STUNDENNACHWEIS.md`.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-8.md`.
