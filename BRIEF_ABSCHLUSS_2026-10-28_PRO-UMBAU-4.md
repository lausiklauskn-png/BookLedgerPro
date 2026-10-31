# Abschluss Pro-Umbau 4 (2026-10-28, Claude Code)

Nichts veröffentlicht, nichts am Tablet gemessen. Alle PRs mit grüner CI selbst gemergt (Freibrief).

## Gemergt

| Repo | PR | Stand | Inhalt |
|---|---|---|---|
| Privat-Brain-Pro | #110 | `2ad2b15` | Hintergrundaufgabe (`native/pro-hintergrund.js`, Android-Dienst `de.familyprojekt.hintergrund`), „Alle prüfen“ und Einordnen melden sich an; Windows-Angaben auf 1.0.42 (main war rot) |
| Privat-Brain-Pro | #111 | `f76b366` | Mikrofon nur an Suche und Freitext; Gerätecheck vor dem Modell-Laden (`native/pro-geraet.js`, Fassung 3, Windows über CIM, Android über ActivityManager); Lernlauf zweites Bedeutungs-Modell (e5-base/e5-large, Pins + Messung in `tools/native/meaning-models.json`) — **noch nicht in der App verdrahtet** |
| Workflow-PDF-Pro | #37 | `c97359e` | Bildbeschreibung nur auf „Beschreiben“; Sichern/Prüfen/Einordnen/Beschreiben als Hintergrundaufgabe |
| BookLedgerPro | #392 | `661d69c` | Hintergrundaufgabe (Sicherung, Einordnen), keine Emojis in allen Ansichten, „An Pro-App geben …“ in der Belegzeile |
| BookLedgerPro | #394 | `7ec9488` | Klaus' Tablet-Befunde: Kamera (`file_paths.xml` ohne `Pictures/`), „Mit Workflow PDF scannen“ startet WPP, Mikrofon über Androids Sprachfenster (`BlpSpeechPlugin`), Modell-Ladebalken, Mikrofon nur an Suche/Freitext, Knöpfe ≤ 32 px, Stift/Papierkorb, Erklärsätze hinter ⓘ, Prüfen über Auswahl, Angebotsplaner/Bedarfsanalyse in BLP-Farben ohne Emojis |
| BookLedger-Basic | #11, #12 | `f7a1ff2` | Nachgezogen auf #392 und #394 (PWA) |

## Gemessen

- BLP: `smoke_befunde` 50 · `smoke_umbau4` 23 · `smoke_design` 92 · `smoke_mikro` 19 · `smoke_apps` 22 · `test-native` 44 · `run.mjs` 2602/0 · `smoke_belege` 46/14 wie auf main.
- PB: `test-pro-bedienung` 41 · `test-hintergrund` 9 · `test-semantic` 19 · `test-speech` 28 · `test-adaptive` 263.
- Zweites Modell (Lernlauf 40758382311, headless Chromium, erfundene Texte): klein 129 MB / 54 ms je Abschnitt / 762 MB; mittel 282 MB / 144 ms / 1332 MB; groß 552 MB / 470 ms / 2252 MB; alle 10/10 Treffer — die Probe trennt die Stufen nicht.

## Offen

- Am Tablet/Windows ungemessen: Kamera, Sprachfenster, ob die Hintergrundaufgabe wirklich weiterläuft, CIM-Werte.
- WPP hat keinen Intent-Einstieg „Scanner direkt“; WPP zeigt `Eingang-WorkflowPDF` noch nicht an; PB hat kein Eingangsfach im Tresor-Paket.
- Angebotsplaner/Bedarfsanalyse: neues Aussehen erst beim zweiten Öffnen (Vorrat).
- „KI-Begründung vorschlagen“ ersetzt das Feld direkt (Klaus wünscht Vorschlag → annehmen, markiert).
- Scanner-/Druckerauswahl nicht gebaut.
- Ursachen und Lehren: Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md § 14–15.

Nächste Sitzung: [`BRIEF_SITZUNG_PRO-UMBAU-5.md`](BRIEF_SITZUNG_PRO-UMBAU-5.md).

## Stundennachweis

Heute (2026-10-28, aus Commits aller vier Repos): Blöcke 11:34–12:55 und 14:30–21:56, Summe 8,8 h; Spanne 09:34 → 21:56 (12,4 h), Abschluss danach
bis etwa 22:00. Nachgetragen für alle Tage seit 2026-10-12: [`docs/STUNDENNACHWEIS.md`](docs/STUNDENNACHWEIS.md).
