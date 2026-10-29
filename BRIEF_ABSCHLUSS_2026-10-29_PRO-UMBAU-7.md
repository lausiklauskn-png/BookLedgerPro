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
| Punkt 5 (schwebende Leiste über „Zur Anmeldung“ am Handy), Punkt 6 (PWA) | noch nicht gemeldet | offen |

## PRs

| PR | Inhalt | CI |
|---|---|---|
| WPP #43 | Sammeln im Tresor, stille Meldung, Haken „Durchsuchbar“, 1.0.9 / Buildnummer 10 | grün, übernommen `3ff194c` |
| BLP #410 | Belegliste, Datum, Vorschau, Einfügen/Hineinziehen, Teilen ohne zweites Fenster, Android 0.1.3 / Buildnummer 4, `sw.js` v279 | grün, übernommen `023b531` |
| Basic #18 | Pro `023b531` nachgezogen | siehe unten |

Proben: BLP `run.mjs` 2602/0 · neu `smoke_befunde7` **33 grün** (Gegenprobe ohne CSS: 8+ rot) · `test-native` 48 · alle Browser-Proben grün (Liste im PR).
WPP `test-vault-journal` 26/26 (+4, Gegenprobe 2 rot) · `test:native-web` 57/57 · `test-scan-direkt` 2/2 (Gegenprobe rot). Basic `basic_gleichstand` 23 ·
`run.mjs` 2600/0 · `smoke_befunde7` 19 · `smoke_design` 92.

## Veröffentlicht (nur Android, Klaus' Wort „die Downloads für die aktuellen Versionen bereitstellen“)

RELEASE_PLATZHALTER

## Gegenprobe für Klaus (am Tablet)

1. Beide APKs über die vorhandenen Apps installieren (Workflow PDF Pro zuerst).
2. BookLedgerPro → Belege in geteilter Ansicht und im Vollbild: ⋯ rechts sichtbar, Datum vollständig.
3. Tipp auf einen Belegnamen: das Dokument erscheint; „Weitere Seiten“, „An Pro-App geben …“, „Löschen“, „Schließen“.
4. Schnellerfassung: ein Foto aus der Galerie hineinziehen oder kopieren + einfügen → neuer Beleg „Eingefügt …“.
5. „Mit Workflow PDF scannen“ → Haken „Durchsuchbar“ sichtbar gesetzt → scannen → „Teilen“ → BookLedgerPro: kurze Meldung „An BookLedgerPro übergeben“,
   im Fenster steht wieder Workflow PDF; im BookLedgerPro-Fenster ist der Scan in der Liste (bei gesperrtem BookLedgerPro: nach dem Entsperren).
6. Workflow PDF Pro: im Editor mehrere Felder setzen — keine Meldung bei jedem Klick; „Speichern“ oder Zurück zur Bibliothek schreibt den Stand.
7. Noch offen aus der letzten Liste: schwebende Leiste über „Zur Anmeldung“ am Handy; BookLedger Basic (PWA) mit Scanner.

## Nicht gemessen / offen

- Nichts davon am Tablet. Zweites Fenster und Rücksprung: Java nur in der CI übersetzt, kein Samsung-Fenster im Emulator.
- Sammeln in Workflow PDF Pro: bis zu 10 s Arbeitsstand nur im Arbeitsspeicher; beim Wechsel in den Hintergrund wird geschrieben, ein harter Absturz davor kann
  diese Sekunden kosten (benannt, Klaus' Wunsch „erst beim Speichern“).
- Windows (BLP, WPP, PB 1.0.42) nicht veröffentlicht — erst auf Klaus' Wort.
- Nicht begonnen: Private Brain V3, WPP-Windows Tresorordner (beide nach Rückfrage).
- Klaus' Nachricht enthielt versehentlich ein Passwort; es steht nirgends in Repos oder Verlauf (geprüft), nur im Chat. Klaus wurde geraten, es zu ändern.

## Stundennachweis

STUNDEN_PLATZHALTER

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-8.md`.
