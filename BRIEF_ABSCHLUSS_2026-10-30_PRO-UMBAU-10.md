# Abschluss Pro-Umbau 10 (2026-10-29 spät → 2026-10-30 nachts)

Repos: BookLedgerPro, BookLedger-Basic. Workflow-PDF-Pro und Privat-Brain-Pro nur gelesen (Releases); Sage-Protokol lesend geklont (Vergleich SBKIM/Mycel).
Auftrag: Klaus' Befunde aufnehmen und beheben, Windows prüfen und vorbereiten; Klaus' Freund testet Windows am eigenen PC, Klaus Android.
Klaus (2026-10-30): „Ändert das bitte selbstständig … keine Gegenprobe … alles fertig bauen, inklusive der Windows-Version. Und veröffentlichen. Und machst
mir wieder eine HTML-Datei mit den Downloads.“ Für Mycel/SBKIM: „Vorschläge … eine Ja-Nein-Liste.“

## Klaus' Befunde und was daraus wurde

| Befund (Klaus, Tablet) | Ursache | Behoben in |
|---|---|---|
| Oben „Belege“, „Konten“, „Kassenbuch“, „neue Buchung“ — steht links schon | Seitentitel klein im Kopf (Umbau 8) | #422: kein Titel mehr, `<h1>` nur für Vorleser (`kopfTitel.js`) |
| Ein ⓘ je Kasten; ein Tipp öffnet alle Informationen | ⓘ hingen an Feldbeschriftungen und am Kopftitel | #422: alle Sätze eines Kastens am ⓘ hinter dessen Titel (`schlank.js` `kastenTitel`) |
| Text oben (Anlagen, Nachkalkulation, Berichte …) in den Kasten | Satz unter der Seitenüberschrift hing am Kopftitel | #422: zieht in den ersten Kasten; ohne Kasten hinter den Satz der Leer-Anzeige; Seite ohne beides: Satz sichtbar |
| ⓘ bei „Neue Buchung“ funktioniert nicht | dahinter lag nur der §13b-Hinweis, den die Ansicht selbst ausblendet | #422: Hinweise mit Inline-Stil sind keine Erklärsätze |
| SBKIM-Suche: Mikrofon und Sprache nicht im Feld | eigene Sprach-Zeile (`speechControls`) | #422: `data-mikro`, Mikrofon und „DE ▾“ im Feld |
| Anleitung anpassen | — | #422: „Bedienung in Kürze“, Stift/Papierkorb; Windows-Testanleitung |
| (Nebenbefund auf Bildern) „null“ unter „Tresor entsperren“ | `replaceChildren(…, null)` | #422: `.filter(Boolean)` |
| Mycel und SBKIM-Suche: Nutzen unklar, „dieselbe Suche wie beim Netz“ | Vergleich mit dem Sage-Kanon (Forschung § 25.7) | Ja/Nein-Liste: https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk — nichts gebaut |

## PRs

| PR | Inhalt | CI |
|---|---|---|
| BLP #421 | Windows vorbereitet: 0.1.4 wie Android, `smoke_befunde9` auch als „win“, `docs/WINDOWS-TESTANLEITUNG.md` | grün, übernommen `7a4eb61` |
| Basic #25 | Pro `7a4eb61` nachgezogen | grün, übernommen `b328e7c` |
| BLP #422 | Befunde oben, 0.1.5 (Android Code 6, Windows gleich), `smoke_befunde10`, `sw.js` v285 | grün (smoke, engine, android, windows), übernommen `d7d1d8e` |
| Basic #26 | Pro `d7d1d8e` nachgezogen | grün, übernommen `631230a` |

Proben BLP: `run.mjs` 2610/0 · neu `smoke_befunde10` **54** (pwa/app/win × 1000/400) · `befunde9` 170 (+61 Windows-Modus) · `befunde8` 129 · `befunde7` 47 · `befunde` 52 ·
`design` 92 · `umbau4` 23 · `ohne_web` 28 · `tresorordner` 30 · `windows` 23 · `teilen` 26 · `test-native` 51 · Windows-Engine 58 · Kindprozess grün.
Gegenproben: Version unter Windows weg → ROT; Kasten-Regel weg → B/C ROT; Stil-Hinweis hinter ⓘ → C ROT; SBKIM ohne Mikrofon → E ROT (4/4 gefangen).
Basic: `basic_gleichstand` 25 · `run.mjs` 2608/0 · `befunde10` 18 · `befunde9` 48 · `befunde8` 72 · `design` 92.

## Veröffentlicht (Klaus' Wort: „alles fertig bauen, inklusive der Windows-Version. Und veröffentlichen.“)

- **Android 0.1.5:** [APK](https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.5/BookLedgerPro-0.1.5.apk) ·
  [eigener Server](https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-0.1.5.apk). Lauf 40979794493 (build, publish grün; überinstallieren mit Tresor im
  Emulator), Tag `v0.1.5`, Quelle `d7d1d8ef2aa2227d9abad6b3c6c549155991b502` (#422), Buildnummer 6, 28.302.651 B, SHA-256
  `5cf5d33ec75c80247277de29178a19a45e17c7b310a2dfd42049a3a00c834b64`, Zertifikat `7a6217eb…`; **unabhängig geladen und gleich `.sha256`**; Server im Lauf geprüft.
- **Windows 0.1.5 (erste Windows-Veröffentlichung):** [Setup](https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-Windows-0.1.5-x64-setup.exe), Lauf
  40979485465 (bauen: Engine-Proben, Auslieferungsbau installiert/gestartet/entfernt; veröffentlichen: `aktuell-windows.json` unterschrieben, gegen den Schlüssel
  der App geprüft, hochgeladen, von außen Feed + Unterschrift + SHA-256 verglichen), Quelle `d7d1d8e`, 40.942.894 B, SHA-256
  `e01025f0a58e77757f88de3f673430ddaba568de61683a75efe2007c48b19bf6`, unsigniert (SmartScreen). ⚠ **Nicht unabhängig geladen:** `family-projekt.de` und der
  Artefakt-Speicher sind aus diesem Behälter gesperrt; Beleg ist der Vergleich im Lauf selbst.
- Basic über Pages (#26). Download-Seite: https://claude.ai/artifact/MFaYdbzH9MreBQSC5Mkr1H (Version 2). Nicht erneut auslösen.

## Gegenprobe für Klaus (Android 0.1.5) und den Windows-Tester

Klaus: kein Titel oben · „Neue Buchung“ ⓘ zeigt alle Sätze · Anlagen-Satz im Kasten · SBKIM-Suche Mikrofon im Feld · kein „null“ · „v0.1.5“ antippen.
Freund (Windows): `docs/WINDOWS-TESTANLEITUNG.md` — nur Kopien, neuer leerer Tresorordner, SmartScreen „Trotzdem ausführen“, Befunde mit Bildschirmfoto.

## Nicht gemessen / offen

- Alles am Gerät; Windows an einem echten PC (kommt mit dem Tester); WebView2-Schrift.
- Mycel/SBKIM: Klaus' Antworten auf die Ja/Nein-Liste stehen aus (nächste Sitzung).
- WPP und PB haben Umbau 9/10 noch nicht (nach Rückfrage).

## Stundennachweis

Erste Spur 29.10. ≈ 23:50 (Ortszeit Berlin), Windows vorbereitet 23:50 → 00:09 (Merge #421), Basic 00:10, Befundliste 00:20 → 00:40, Klaus' Befunde
00:45 → 01:14 (Commit), Vergleich Sage, Merge #422 01:24, Veröffentlichungen 01:24 → 01:35, Download-Seite und Abschluss bis ≈ 01:45. Ein Block, dazwischen Warten
auf CI. Spanne ≈ 2,0 h. Klaus' Zeit am Tablet (Bilder, Diktat) liegt darin; seine eigene Angabe geht vor. Zeile in `docs/STUNDENNACHWEIS.md`.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-11.md`.
