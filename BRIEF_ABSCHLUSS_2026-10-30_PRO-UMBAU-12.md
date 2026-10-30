# Abschluss Pro-Umbau 12 (2026-10-30): „Überall suchen“ in Workflow PDF Pro und Private Brain Pro

Repos: Privat-Brain-Pro, Workflow-PDF-Pro (gebaut), BookLedgerPro (dieser Abschluss), BookLedger-Basic (nur gelesen; dieser Abschluss enthält keinen
App-Code, Basic zieht ihn beim nächsten Pro-Nachziehen mit). Auftrag: Brief `BRIEF_SITZUNG_PRO-UMBAU-12.md`.

## 1 · Klaus' Gegenprobe 0.1.6 und Befunde des Windows-Testers

**Lagen nicht vor.** Gesucht: Klaus' Ja/Nein-Liste (https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk — Runde 2 r1–r7 weiter unbeantwortet, keine
neuen Notizen seit 2026-10-30 00:57), Issues in BookLedgerPro/WPP/PB (keine seit 29.10.), Mails (nur GitHub-Benachrichtigungen). Nichts erfunden;
die Punkte bleiben für Umbau 13 an erster Stelle (Brief).

## 2 · „Überall suchen“ als gemeinsamer Baustein (Klaus m7)

| | Private Brain Pro (PR #115) | Workflow PDF Pro (PR #45) |
|---|---|---|
| Baustein | `native/pro-ueberall.js`/`.css` **hier gepflegt**, Bedien-Bausteine **Fassung 4**, Pin erneuert | byte-gleich nachgezogen (`bedienung-nachziehen.mjs`) |
| Ort | Suchseite, vor der Trefferliste; Frage aus `#q` | Bibliothek, unter der Suchzeile; Frage aus `#bibSuche` |
| diese App | Katalog (Name, Pfad, Kurzfassung, Tags, Kategorie, Absender, Mailtext) | Bibliothek (Name, Ordner, Seitentext) |
| Tresorordner | `ProVault.tresorFach` (neu, liest nur Zeilen, Sperr-Regel wie Zustand) | `WorkflowVault.tresorFach` (neu, über `offenOderGemerkt`) |
| Netz | Modul 23, nur mit Haken (ab Werk aus) | dasselbe, Modul 23 des Kerns |
| Öffnen | Katalogzeile → `openFile` | Bibliothekszeile → Karte; nicht im Bild → Bibliothek nach Namen filtern |

Fremde Zeilen (andere App) sind nur Text: *„nur im Inhaltsverzeichnis – öffnen in …“*. Farben nur `--pro-*` → jede App behält ihr Design.
Beschreibung: Private Brain Pro `docs/UEBERALL-SUCHEN.md`. BookLedgerPro behält vorerst seine eigene Fassung (`src/domain/ueberall.js`).

## 3 · Umbau 9/10 in WPP und PB

| Punkt | PB | WPP |
|---|---|---|
| textZoom 100 (Schrift wie in der PWA) | `MainActivity.setTextZoom(100)` | dasselbe |
| Schriftgröße „A··A“ (§ 1.8) | gemeinsamer Baustein `ProBedienung.schriftKnopf`, **im ☰-Menü** — in der Kopfleiste bliebe am Handy kein Platz für das Siegel (gemessen 6 px bei 360 px) | vor dem Zahnrad |
| Knöpfe fest | `.pro-knopf` Innenabstand kleiner: bei 130 % weiter 30 px (gemessen) | dasselbe (gemeinsame Datei) |
| Version im Kopf | stand schon neben dem Namen | **neu** klein neben dem Namen, Tipp öffnet Einstellungen und prüft auf Updates |
| ⓘ je Kasten | seit Sitzung 3 | seit Umbau 2; neuer Kasten mit einem ⓘ |
| kein Titel oben | Suchintro seit .35 weg | Kern unverändert (Untertitel „Formulare einlesen …“ gehört zum Kern) — **offen**, braucht Kern-Änderung in Workflow-PDF |

Versionen (vorher `releases` gelesen): **PB 1.0.43** / Code 43 (Android zuletzt 1.0.42, Windows 1.0.41; Updateprobe 1.0.41 → 1.0.43),
**WPP 1.0.10** / Code 11 (Android zuletzt 1.0.9). **Nichts veröffentlicht** (kein Wort von Klaus).

## 4 · Chefcode — nur Plan (für Klaus, nichts gebaut)

Klaus' Notiz zu m3: *„wenn es ein kleiner Betrieb ist, muss die Suche auch mit Inhalt möglich sein. Nur über einen Chefcode? Der wird nur
vertrauenswürdigen Personen gegeben oder entsprechenden Arbeitsplätzen?“*

Was es schon gibt (Modul 23, byte-1:1, gelesen): `setNetwork({code})` leitet aus einem Netz-Code (≥ Mindestlänge, A–Z/0–9) per SHA-256 eine eigene
Raum-Marke und per PBKDF2 einen AES-GCM-Schlüssel ab; Zettel im eigenen Netz sind damit verschlüsselt, Fremde ohne Code sehen den Raum nicht.

Vorschlag in drei Schritten, jeder mit Klaus' Ja:
1. **Chefcode = eigenes Netz.** In jeder Pro-App unter „Netz“ ein Feld „Chefcode“ (nur im Speicher der App, nie in Dateien/Logs); wer denselben Code
   hat, ist im selben Netz. Ohne Code bleibt alles wie heute (öffentliches Netz, nur Titel · Datum · Betrag).
2. **Antworten mit Fundstelle nur im eigenen Netz.** Ist der Chefcode gesetzt, darf „Anderen antworten“ zusätzlich die Fundstelle (Ausschnitt ≤ 300
   Zeichen) schicken — nie die Datei. Schalter getrennt, ab Werk aus; jede Antwort nennt den fragenden Arbeitsplatz.
3. **Öffnen auf Wunsch.** Ein Tipp auf eine fremde Zeile fragt den anderen Arbeitsplatz, ob er die Datei schickt (dort bestätigen). Erst danach.

Offen für Klaus: Wer vergibt den Code (Chef legt ihn an, gibt ihn weiter — oder Admin-Schlüssel aus Modul 23 `admin`)? Wie lang? Was passiert beim
Wechsel (alter Code sofort ungültig)? Gilt er für alle drei Pro-Apps zugleich?

## Proben (Behälter, 2026-10-30)

- PB: `test-pro-bedienung` **63** · neu `test-ueberall` **18** · `test-tresorordner` **38** · `test-web` 126 · `test-first-paint` 38 · `test-mycel` 35 ·
  `test-adaptive` 263 · ganze Kette 50/58 grün; die 8 roten (`test-help`, `-check`, `-ocr`, `-meaning`, `-tools`, `-filme`, `-design-26`, einmal
  `-caption-model` als Ausreißer) sind **auf main im Behälter ebenso rot** (Bau ohne Netz: OCR, Modelle, Filme, Werkzeuge fehlen) — gegengeprüft
  in einem Arbeitsbaum auf `d8fc98b`; `-caption-model` danach allein grün.
- WPP: `npm run test:native-web` **69/0** (neu `test-ueberall` 11).
- Gegenprobe (Wegwerf-Kopie, 5 Fehler eingebaut): eigenes Fach doppelt · Netz ohne Haken gefragt · fremde Zeilen als Knopf · gesperrt wirft bis zur
  Ansicht · Netz-Text als HTML — **5 gefangen, 0 durchgerutscht**.
- CI: siehe PRs.

## Nicht gemessen / offen

- Alles am Gerät; die Java-Brücken (`tresorFach`) sind im Behälter nicht übersetzt (CI baut). Kein echtes Relais, keine zweite Stelle.
- „Kein Titel oben“ in WPP (Kern), BookLedgerPro auf den gemeinsamen Baustein umstellen, Chefcode, Probe über drei Orte (Abhakliste im Brief 13).

## Stundennachweis

Erste Spur 30.10. ≈ 13:10 (Uhr des Behälters; Briefe, Klaus' Liste, Repos), Baustein und PB bis 13:24, Schrift/Version bis 13:31, WPP bis 13:39,
Doku/PRs bis 13:45, Abschluss danach, CI und Merge im Anschluss. Ein Block; Spanne ≈ 0,8 h bis zu den PRs (Obergrenze mit CI ≈ 1,2 h).
Zeile in `docs/STUNDENNACHWEIS.md`. Klaus' eigene Angabe geht vor.
