# Abschluss Pro-Umbau 11 (2026-10-30 nachts): Mycel und „Überall suchen“, autonom

Repos: BookLedgerPro, BookLedger-Basic. Workflow-PDF-Pro, Privat-Brain-Pro, project-cleaner-pro, Meine-Familienakte, Privat-Brain-Pro-V3 nur gelesen (Releases
für das Gesamtpaket); Sage-Protokol lesend geklont (Paper, Module 22/23). Auftrag (Klaus): „autonom arbeiten … am Ende eine fertige BookLedgerPro-Neuversion
von PWA, APK und Windows“ · Gesamtpaket aller Apps als eine HTML-Seite.

## Klaus' Liste und was daraus wurde

Runde 1 (Ja): m1 m2 m3 m4 m5 m7 m8 m10 m11 m12; Notizen zu m0, m6, m9, frei. **Runde 2 (r1–r7) war unbeantwortet** — entschieden wie unten, je mit Grund.

| Punkt | Gebaut | Entscheidung und Grund |
|---|---|---|
| m0 Erklärung kürzer + „Mehr dazu“ | „Dokumente finden in allen deinen verbundenen Programmen.“ + aufklappbar | Klaus' eigener Wortlaut (r1 = Ja angenommen) |
| m1 Seite „SBKIM-Suche“ weg | ersetzt durch **„Überall suchen“** (Schlüssel bleibt `sbkimsuche`, Menü/Modi/Lesezeichen gelten weiter) | ein Ort statt drei |
| m2 Kontosuche als Knopf | **„Passendes Konto finden“** in Neue Buchung (setzt Soll/Haben) und bei den Konten; Wörter sofort, Bedeutung auf Wunsch | Hilfe dort, wo man bucht |
| m3 BLP antwortet dem Netz | Schalter **„Anderen antworten“**: nur Titel · Datum · Betrag, nie Belegtext, höchstens 300, nur im Speicher, nur solange die App offen ist | Chefcode (Inhalt für Vertraute) ist größer und braucht Klaus' Plan → Brief 12 |
| m4 Überall suchen | BLP (Belege mit Text, Buchungen, Kunden, Aufträge) · Angebotsplaner/Bedarfsanalyse · Tresorordner (App) · Netz (Haken) — eine Liste mit Herkunft | so weit es mit dem Vorhandenen geht |
| m5 ein Gerät = Tresorordner | Tresorordner-Fächer aller Pro-Apps werden mitgesucht, ohne Internet; gesperrt wird gesagt | — |
| m6 „für alle, jeder wählt selbst“ | Netz-Haken ab Werk aus, für alle sichtbar | Klaus' Notiz wörtlich (r2) |
| m7 Mycel/SBKIM im Design der App, Siegel rein | **Siegel unten in der Leiste** („Läuft mit SBKIM · Siegel“), Kanon-Fenster in App-Farben | gleiche Suche in WPP/PB: Brief 12 (zu groß für diese Sitzung, wenn am Ende veröffentlicht werden soll) |
| m8 Mycel-Seite einfacher Kasten | Siegel, Verbinden, Gerätename, Antworten, verbundene Programme; Rest hinter „Für Entwickler“ | — |
| m9 „läuft mit SBKIM“, Siegel sichtbar | „Läuft mit SBKIM“ im Kasten und in der Leiste; Kanon-Widget (Lampen + Siegel) bleibt schwebend | Klaus' Notiz: bei ihm ist das schwebende Fenster der sichtbare Beleg |
| m10 Kanon statt Nachbau, Design BLP | app-eigene Lampengruppe oben entfernt (Kanon-Widget 17 zeigt sie), Module 16/17/23 byte-1:1 und per `assets/sbkim-blp.css` im BLP-Design | „Was ist besser?“: Kanon + eigenes Blatt — kein Eingriff in die Module, Gleichstand mit Sage bleibt. Modul 22 (dritte schwebende Suche) **nicht** eingebaut: widerspräche m1 |
| m11 Alltagssprache | Mycel-Kasten, Überall suchen, Konto finden ohne „Korpus/Spore/Richter“; Hinweise „SBKIM-Suche“ in Einstellungen/Anleitung ersetzt | — |
| m12 KI-Prüfung nur Schalter | Schalter unter der Liste, aus; ohne Schlüssel sagt er es; nur Titel und Fundstelle gehen hinaus | — |
| frei: Test über drei Orte | Windows-Testanleitung nennt die Probe (verbinden, „Wer ist im Raum?“, Antworten an, Netz-Haken) | Abhakliste im Brief 12 |

## PRs

| PR | Inhalt | CI |
|---|---|---|
| BLP #427 | Umbau 11, 0.1.6 (Android Code 7, Windows), `sw.js` v286 | CI, Android-Hülle, Windows-Hülle grün; übernommen `918dbd8` |
| BLP (Abschluss) | Probe `smoke_umbau11` ohne `native/` nur PWA-Teile (für Basic), dieser Abschluss, Brief 12, Stundennachweis | siehe unten |
| Basic | Pro nachgezogen | siehe unten |

Proben BLP (im Behälter): `run.mjs` 2624/0 · neu **`smoke_umbau11` 129** (pwa/app/win, 1280/1000/400, hell + dunkel, Kontrast ≥ 4,5) · `befunde10` 54 · `befunde9` 170 ·
`befunde8` 129 · `befunde` 52 · `design` 92 · `mikro` 19 · `umbau4` 23 · `ohne_web` 28 · `windows` 23 · `tresorordner` 30 · `test-native` 51. Basic: `basic_gleichstand` 25 ·
`run.mjs` 2622/0 · `smoke_umbau11` 49 (PWA-Teile).

## Veröffentlicht

Klaus' Wort lag im Auftrag vor („am Ende veröffentlichen (freigegeben)“).

- **Android 0.1.6:** [APK](https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.6/BookLedgerPro-0.1.6.apk) · Tag `v0.1.6`, Quelle
  `918dbd87a6e3ddc187f0ef8c2bf734e889ad0b3a` (#427), Buildnummer 7, 28.315.259 B, SHA-256 `66db9781cd573891a88b9b301cc672f279fc61aa1d2acf32b8a7e78640c5c3d1`;
  **unabhängig geladen und gleich**. Erster Versuch (Lauf 40987582189) brach vor dem Bau ab, weil die Android-Prüfung auf main noch lief (Torwächter
  „android grün auf diesem Commit“); nach deren Grün neu ausgelöst. Auch über den eigenen Server (Lauf lädt dorthin hoch) und in der App über „v0.1.5“ antippen.
- **Windows 0.1.6:** [Setup](https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-Windows-0.1.6-x64-setup.exe), Lauf 40987585298 (Engine-Proben,
  Auslieferungsbau installiert/gestartet/entfernt, `aktuell-windows.json` unterschrieben, hochgeladen, von außen verglichen), Quelle `918dbd8`,
  40.976.593 B, SHA-256 `ef92354323a1d8b41945e5b1304aae9d21f0b19994f4bb5d7c9394d5f69d18e0`, unsigniert (SmartScreen). ⚠ family-projekt.de ist aus dem Behälter
  gesperrt (403) — Beleg ist der Vergleich im Lauf.
- **Basic/PWA:** Pro `918dbd8` + dieser Abschluss nachgezogen, über Pages.
- Gesamtpaket aller Apps: https://claude.ai/artifact/MFaYdbzH9MreBQSC5Mkr1H (neue Fassung). Nicht erneut auslösen.

## Nicht gemessen / offen

- Ein echtes Relais (aus dem Behälter gesperrt), eine echte Antwort über zwei Orte, das Sprachmodell im Antwortweg, alles am Gerät.
- „Überall suchen“ in Workflow PDF Pro und Private Brain Pro, Umbau 9/10 dort, Chefcode → `BRIEF_SITZUNG_PRO-UMBAU-12.md`.
- Spätere automatische Aufnahme weiterer Apps aus ihrem Werkzeug-Vorrat (z. B. über einen KI-Agenten): nur Plan — jede App braucht dafür einen
  `prepareCorpus` (Titel/Datum/Wert) und einen Eintrag in „Verbundene Programme“; ihr Kanon-Modul 23 hat sie schon.

## Stundennachweis

Erste Spur 30.10. ≈ 02:05 (Ortszeit Berlin: Briefe, Antworten, Sage), Bau 02:20 → 02:33 (Commit), Proben bis 02:33, Merge 02:43, Android + Windows
0.1.6 02:44 → 02:57, Basic, Gesamtpaket und Abschluss bis ≈ 03:10. Ein Block, dazwischen Warten auf CI und zwei Veröffentlichungsläufe. Spanne ≈ 1,1 h
(Obergrenze). Klaus' Zeit (Liste ankreuzen, Notizen) liegt davor; seine eigene Angabe geht vor. Zeile in `docs/STUNDENNACHWEIS.md`.
