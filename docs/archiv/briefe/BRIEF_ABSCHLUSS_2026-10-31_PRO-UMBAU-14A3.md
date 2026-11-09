# Abschluss Pro-Umbau 14 A3, Teil 1 (2026-10-31)

Grundlage: `BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md` mit Klaus' Antworten (1–6 bauen, 7 erst die Ursache).

## Was getan ist

| Nr | Was | PR | Stand |
|---|---|---|---|
| — | offene PRs: BLP #433, PB #119 waren schon gemergt; Basic nachgezogen auf Pro `e9b4d94` | Basic #33 | gemergt |
| 7 | **Ursache der roten `test-ki-tresor`-Läufe (V3 #32)** gefunden und behoben, dann #32 übernommen | V3 #34 (enthält #32) | gemergt |
| 1, 2 | Tresor-Paket: Fächer „Private Brain V3“, „Familienakte“, „Eingang-Familienakte“ (acht Fächer, fünf Apps) | WPP #49 | gemergt |
| 5 | **Workflow PDF Pro antwortet im Netz** (`native/native-netz.js`) | WPP #49 | gemergt |
| 6 | Dokumentiert, was im Tresor liegt und was in der App bleibt (`Workflow-PDF-Pro/docs/TRESORORDNER.md`) | WPP #49 | gemergt |
| 1, 2 | Nachgezogen: Tresor-Paket + Bedien-Bausteine Fassung 7 (Überall suchen kennt die neuen Fächer) | PB #121, BLP #440 | gemergt (Klaus) |

### Ursache V3 #32 (Punkt 7)
CI-Log Lauf 41207246025: `IndexedDB-Re-Open mit Version 10 scheiterte: The requested version (10) is less than the existing version (11)`.
Die „Heilung“ in `assets/ki-tresor.js` öffnete die Datenbank von außen eine Version höher. Öffnet Modul 01 (byte-1:1) im selben Augenblick,
scheitert dessen Öffnung und bleibt bis zum Neuladen gemerkt — ohne offene Verbindung, die sie vergessen könnte; weitere Sprünge helfen nicht.
Nachgestellt im Browser: mit Sprung von außen 20 von 20 Zugriffen mit genau dieser Meldung und danach dauerhaft hängend, ohne Sprung 0 von 20.
Jetzt nur warten und wiederholen; die Probe hält fest, dass die Datei IndexedDB nie selbst öffnet (Gegenprobe rot). CI auf #34 zweimal grün.

### Im Netz antworten (Punkt 5)
- Öffentlich: nur der Dateiname, verglichen wird auch nur mit ihm.
- Eigenes Netz + „Mit Ausschnitt“: Abschnitte aus den gespeicherten Vektoren der Bedeutungssuche (Anfang + Briefende, ≤ 60 je Dokument),
  eine Zeile je Dokument, Ausschnitt ≤ 200 Zeichen; der Filter prüft bei jeder Frage, ob ein eigenes Netz steht.
- Korpus als Funktion, gesetzt **nach** `enableAnswering` (Fund: Modul 23 legt dort sonst einmal eine feste Liste ab, dann wäre nichts live).
- Datenbank des Kerns nur lesend, ohne Version.
- Probe `tools/native/test-netz.mjs` 16 grün gegen das echte Modul 04, Gegenprobe 4/4 mit eigenem Namen; `test:native-web` 73/0.

### Fortsetzung (15:30–16:25)
| Was | PR | Stand |
|---|---|---|
| Basic nachgezogen auf Pro `43f8a15` | Basic #35 | gemergt |
| Workflow PDF Pro: Bausteine Fassung 7 | WPP #50 | gemergt |
| **3 „Ort ändern“, Kern:** `de.familyprojekt.tresor.Umzug` (kopieren, jede Datei per SHA-256 prüfen, Kopf zuletzt, nie überschreiben, fremder Tresor abgewiesen, Vermerk `Tresorordner/umgezogen.json` am alten Ort); JUnit 12 grün, Gegenprobe 13/13 | WPP #50 | gemergt |
| Tresor-Paket mit Umzug nachgezogen | BLP #441, PB #122 | gemergt |
| Forschung Teil 1 in Kimhub (`forschung/messungen/pro-umbau-14-a3-2026-10-31.md`, Eintrag in `sitzungen.json`) | Kimhub #419 | gemergt |

PB #122: Windows-Abnahme einmal rot an „test-only empty publisher list is read“ (`page.route` griff nicht), main im selben Stand grün, nach einem Neustart grün. Kommentar im PR.

## Was NICHT getan ist (offen für die nächste Sitzung)
- **3 „Ort ändern“:** Kern gebaut (siehe oben). Fehlt: Knopf „Ort ändern …“ (Android: Ordnerwahl, Umzug im Hintergrund, Umschalten ohne den gemerkten Schlüssel zu verlieren; WPP zusätzlich den Dokumenttresor auf „Workflow PDF Pro/“ am neuen Ort umstellen), Hinweis bei Vermerk in den anderen Apps, Windows.
- **4 Windows-Tresorordner in PB und WPP** (Vorlage BLP `windows/engine/src/DesktopTresor.java`) — nicht begonnen.
- Workflow-PDF (PWA) antwortet noch nicht im Netz.
- V3 und die Familienakte ziehen das Tresor-Paket noch nicht ein (Fächer leer).
- B Familienakte, C Sage-Hinweis, D Briefkopf, E Geschenk-Seite — nicht begonnen.

## Nicht geprüft
Kein Gerät, kein Windows, kein echtes Relais, kein echtes Sprachmodell (gestellt). Der Kasten „Im Netz antworten“ wurde nicht im Einstellungs-Dialog
im Browser gefahren (nur seine Logik). Android-Bau nur in der CI. Nichts veröffentlicht.

## Stundennachweis
Erste Spur 14:34 (Uhr des Behälters, Reflog), letzte ≈ 15:30. Ein Block, ≈ 0.9 h, CI-Wartezeit darin ≈ 0.2 h. Obergrenze 0.9 h. Fortsetzung 15:30 → ≈ 16:25, ≈ 0.9 h (CI-Wartezeit ≈ 0.4 h). Zeilen in `docs/STUNDENNACHWEIS.md`.
Klaus' eigene Angabe geht vor.

## Forschung
Befunde dieser Sitzung (Ursache aus dem Log statt Wiederholung; Modul 23 überschreibt einen Funktions-Korpus; gestelltes Wort-Hash-Modell und Mindest-Nähe
von Modul 04) gehören nach Kimhub `forschung/messungen/` — eingetragen (Kimhub #419).
