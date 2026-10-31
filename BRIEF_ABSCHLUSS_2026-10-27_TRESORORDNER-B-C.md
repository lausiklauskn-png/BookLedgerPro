# Abschluss 2026-10-27: Tresorordner Schritt B (Paket) und C/C2 (BookLedgerPro im Ordner)

## Was Klaus entschieden hat
- **Pflegeort des Pakets `de.familyprojekt.tresor`: Workflow PDF Pro** (Empfehlung angenommen).
- Termux: offene Freigabe-Kopie gelöscht (Ausgabe: nur `blp-freigabe.age`, 246 B). Die Entschlüsselungs-Probe (`64`) kam nicht
  zustande — die eingefügte Zeile hat die Passwort-Abfrage leer beantwortet. Klaus' Tastatur ist gerade defekt; die Probe ist nicht eilig.

## Was gebaut ist
| | Wo | Stand |
|---|---|---|
| B · Paket (Kopf, Hauptschlüssel, Passwort-/Ersatzplätze 5/3, Fach-Schlüssel, Inhaltsverzeichnis, Marken, Rechte) | Workflow-PDF-Pro#29, gemergt `5009c95` | JVM 9/9, Gegenprobe 9/9, CI grün (Bau, Lint, JVM, Emulator 48/48) |
| C · Brücke, automatische Sicherung, Beleg-Originale, Eingangsfach | BookLedgerPro#371 | siehe unten |
| C2 · Ansicht „Tresorordner“ mit Wort-/Bedeutungssuche | BookLedgerPro#371 | siehe unten |

BookLedgerPro: `run.mjs` 2580/0 · `test-native` 37/0 · `smoke_tresorordner` 30/0 (Brücke gestellt, A5) · Gegenprobe 11/11 ·
`smoke_design` 90/0. Bedienung und Grenzen: `docs/TRESORORDNER.md`. Paket hier gepinnt: `native/tresor-herkunft.json`.

## Was nicht geprüft ist (ehrlich)
- Nichts am Gerät: kein Tablet, keine SD-Karte, kein echter Passwort-Dialog. `BlpTresorPlugin.java` und `SafAblage.java` sind in
  GitHub gebaut und gelintet, aber im Emulator nicht mit einem Ordner gefahren.
- Kein Windows-Zwilling (Rust) — Lücke steht in Workflow PDF Pros `docs/PRODUKTSTAND.md`.
- Schritt D (Private Brain Pro und Workflow PDF Pro ziehen ein) **nicht begonnen**: der Einzug schreibt neben Klaus' echten
  „Private Brain“-Ordner auf der SD-Karte; laut Regel erst an einer Kopie mit Klaus am Gerät. Brief: `BRIEF_SITZUNG_TRESORORDNER-SCHRITT-D.md`.

## Funde
In der Forschung § 8 (Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md): Ordnernamen passen schon · Fach-Schlüssel sind
32-Byte-Datenschlüssel · HMAC-Namen → Inhaltsverzeichnis · Fingerabdruck ohne eigenen Merker · doppelte Sicherung macht Gegenprobe
blind · Basic ohne `native/` · Termux-Einfügen beantwortet Passwort-Abfrage · JVM-Proben ohne Gradle · Repo-Name `Workflow-PDF-Pro`.

## Veröffentlicht
Nichts. Kein APK, kein Release.
