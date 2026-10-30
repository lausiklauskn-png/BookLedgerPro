# Abschluss Pro-Umbau 13 (2026-10-30): Chefcode in allen drei Pro-Apps, BookLedgerPro auf den gemeinsamen Kasten „Überall suchen“

Repos: Privat-Brain-Pro, Workflow-PDF-Pro, BookLedgerPro (gebaut), BookLedger-Basic (nachgezogen). Auftrag: `BRIEF_SITZUNG_PRO-UMBAU-13.md`.

## 1 · Befunde

Gesucht: Issues (keine seit 29.10.), Mails (keine von Klaus oder dem Windows-Tester), Ja/Nein-Liste (Runde 2 r1–r7 weiter offen, keine neuen
Notizen). Klaus auf Nachfrage: **„Keine, weitermachen“.** Nichts erfunden.

## 2 · Chefcode (Klaus: „Ja, Schritt 1+2“ · „Chef legt fest, alle 3“)

| | Private Brain Pro | Workflow PDF Pro | BookLedgerPro |
|---|---|---|---|
| Kasten „Chefcode“ | Einstellungen, nach dem Mycel-Kasten | Einstellungen, unter Sicherung/Tresor | Mycel-Seite, unter „Mit anderen Programmen verbinden“ (nur App) |
| Baustein | `native/pro-chefcode.js` **hier gepflegt**, Bedien-Bausteine **Fassung 5** | byte-gleich nachgezogen | byte-gleich nachgezogen |
| Ausschnitt (Schritt 2) | – | – | Schalter „Mit Ausschnitt antworten“, nur im eigenen Netz |

- **Schritt 1:** gleicher Code = eigenes Netz über Modul 23 (Kanon, unverändert: `saveNetwork`/`applyNetwork`). Mindestens 12 Buchstaben/Ziffern
  (Leerzeichen und Bindestriche zählen nicht), verdecktes Feld ohne Mikrofon, danach leer; der Code steht nirgends im Bild. Neuer Code gilt sofort,
  „Entfernen“ → öffentliches Netz. Antwortete die App vorher, antwortet sie im neuen Netz wieder. Gespeichert von Modul 23 im Speicher der App
  (`sbkim_netz_<Schublade>`), nie in Dateien oder im Tresorordner.
- **Schritt 2 (BLP):** ab Werk aus, nur mit eigenem Netz frei. Belegtext zählt beim Vergleichen mit (nur im Speicher), hinaus geht Titel · Datum · Betrag
  **— Ausschnitt um die Suchwörter**, zusammen ≤ 200 Zeichen (Kanon-Grenze `RDV_LABEL_MAX`, Klaus' Plan sagte ≤ 300), nie die Datei. Ein Filter vor
  Modul 04 (`antwortFilter`) prüft **bei jeder Frage**, ob noch ein eigenes Netz besteht — sonst antwortet dieser Modus gar nicht. Chefcode entfernt →
  Antworten mit Ausschnitt aus, mit Satz.
- Schritt 3 (Datei öffnen auf Anfrage) ist nicht gebaut (Klaus' Wahl).

## 3 · BookLedgerPro auf den gemeinsamen Kasten

In der App ist „Überall suchen“ jetzt derselbe Kasten wie in PB und WPP (`native/pro-ueberall.js` Fassung 2). BLP gibt dazu: Belege, Buchungen, Kunden,
Aufträge (Gruppe „BookLedgerPro“), Angebotsplaner und Bedarfsanalyse als eigene Gruppen, Tresorordner über `BLPNative.tresor` (eigenes Fach
„BookLedgerPro“ nicht), Netz über Modul 23, KI-Prüfung als Schalter unter der Liste (`nachSuche`). Die PWA (BookLedger Basic) hat `native/` nicht und
behält ihre Fassung.

**Fund:** „Anderen antworten“ in 0.1.6 gab die Vektoren als Listen; Modul 04 verlangt `Float32Array` → jede Antwort blieb still leer (Forschung § 28).
Behoben.

Version **0.1.7** / Code 8 (Android), Windows 0.1.7 — vorher `releases` gelesen (zuletzt 0.1.6). **Nichts veröffentlicht.** `sw.js` v287.

## 4 · Probe über drei Orte

Nicht gelaufen (braucht Klaus und zwei weitere Rechner). Abhakliste unverändert im Brief 14, ergänzt um den Chefcode.

## 5 · „Kein Titel oben“ in WPP

Nicht angefasst (Kern-Änderung, nur nach Rückfrage) — bleibt offen.

## Proben (Behälter, 2026-10-30)

- PB: `test-chefcode` **20** (neu, echtes Modul 23) · `test-pro-bedienung` 63 · `test-ueberall` 18 · `test-mycel` 35. Gegenprobe 3/3 (Feld nicht geleert ·
  Mindestlänge 6 · Antwortrecht nicht wieder an); der zweite Fall rutschte zuerst durch (Modul 23 lehnt selbst ab), Probe geschärft.
- WPP: `test:native-web` **72/0** (Chefcode in den Einstellungen, echtes Modul 23 des Kerns).
- BLP: `run.mjs` **2638/0** (neu „Pro-Umbau 13“) · `test-native` 52 · neu `smoke_umbau13` **54** (app 1280 · win 1000 · app 400 · pwa 400) · `smoke_design` 92 ·
  `smoke_befunde10` 54 · `smoke_umbau11` 128/1 — die eine rote Zeile wandert von Lauf zu Lauf (Gruppe B) und ist auf main ebenso rot (Flattern der alten
  Ansicht, die sich bei jedem Status ganz neu zeichnet; betrifft nur noch die PWA). Gegenprobe 4/4 (Filter ohne Netzprüfung · kein Aus beim Entfernen ·
  Listen statt Float32Array · Angebotsplaner ohne eigene Gruppe).
- Basic: siehe dortige `CLAUDE.md`.

## Nicht gemessen / offen

- Am Gerät, echtes Relais, zwei oder drei Arbeitsplätze mit demselben Code (Probe über drei Orte).
- Das Mycel-Fenster (Kanon) zeigt einen gespeicherten Netz-Code beim Bearbeiten wieder an.
- GitHub meldet für das Konto 100 % der freien Actions-Minuten (Mail vom 29.10.) — private Repos (PB, WPP) bauen dann womöglich nicht; BLP ist öffentlich.

## Stundennachweis

Erste Spur 30.10. ≈ 23:00 (Uhr des Behälters; Briefe, Befunde gesucht, Frage an Klaus), PB-Commit 23:28, WPP 23:32, BLP-Bau und Proben bis ≈ 23:45,
Basic/Doku/PRs danach, CI und Merge im Anschluss. Ein Block; ≈ 0,9 h bis zu den PRs (Obergrenze mit CI ≈ 1,3 h). Zeile in `docs/STUNDENNACHWEIS.md`.
Klaus' eigene Angabe geht vor.
