# Brief für die nächste Sitzung: Pro-Umbau 10 — BookLedgerPro für Windows (geschrieben 2026-10-29 spät)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-9.md`, `docs/WINDOWS.md`, `docs/UPDATES-EIGENER-SERVER.md`, `docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`,
Forschung § 23–24.

## Ausgangslage

BookLedgerPro ist seit 2026-10-29 **öffentlich** (Freiminuten des privaten Repos waren aufgebraucht). Android **0.1.4** veröffentlicht (Abschluss 9),
Basic nachgezogen (eigenes weißes Logo). Die **Windows-Fassung ist gebaut** (Pro-Umbau 5: `windows/`, Tauri 2 + Java-Engine, Tresor-Paket, DPAPI, SAPI,
Scanner/Kamera WIA, Updates vom eigenen Server, `windows.yml` grün), aber **nie veröffentlicht** und nie an einem echten Windows-PC gemessen.

## Reihenfolge

1. **Klaus' Befunde aus der Gegenprobe 0.1.4 (Tablet)** aufnehmen und beheben — zuerst, damit sie in Android und Windows gleich landen.
2. **Windows vorbereiten:** `windows.yml` von Hand starten (läuft nur noch bei Windows-Änderungen oder auf Knopfdruck), alles aus Umbau 8/9 im
   Windows-Modus prüfen (`tests/smoke_windows.mjs`; neu: Version im Kopf, ⓘ, Schrift — unter Windows gibt es keinen textZoom, die Schrift kommt von WebView2).
   Version und Buildnummer erhöhen, `releases` lesen.
3. **Erst auf Klaus' Wort „Windows veröffentlichen“:** `windows-release.yml` mit „ja“ (eigener Server `family-projekt.de/updates/bookledgerpro/`,
   Ed25519-Unterschrift), Download unabhängig laden und SHA-256 vergleichen. Unsigniertes Setup → SmartScreen-Warnung nennen.
   **Wer testet was:** Klaus' Freund (hat die Familienakte gebaut, baut parallel ein eigenes Programm; die beiden tauschen sich aus) testet
   Windows **an seinem eigenen PC mit seinen eigenen Daten**; Klaus testet Android. Keine Daten von Klaus auf dem PC des Freundes.
   - eine kurze Anleitung für den Freund: Download, Windows-Warnung beim unsignierten Setup („Weitere Informationen“ → „Trotzdem ausführen“),
     erster Start (Tresor anlegen), was er prüfen soll, wie er Befunde schickt;
   - auf Klaus' Wunsch eine Abgleich-Seite für ihn (Download, kurze Beschreibung, Link zum öffentlichen Repo), Vorbild Familienakte
     `BRIEF_ABSCHLUSS_2026-10-29_FASSUNG-2.28.3-UND-ABGLEICH.md`.
4. Danach nach Rückfrage: Leitfaden § 1.7–1.9 und die Befunde aus Umbau 9 (ⓘ hinter dem Wort, textZoom 100, Knöpfe fest, Version im Kopf) in
   Workflow PDF Pro und Private Brain Pro; Private Brain V3; WPP-Windows Tresorordner; Bilder einfügen in WPP und PB; fester Ordner je Einlese-Knopf
   (Klaus' Frage, nur wenn er es will).

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort; vor jeder Veröffentlichung `releases` lesen und Version + Buildnummer erhöhen. Keine Schlüssel oder Passwörter
im Chat oder in Dateien (das Repo ist jetzt öffentlich!). Nichts an echten Tresoren ohne Kopie und Rückweg. Tresor-Paket und Scanner-Baustein nur in WPP,
Bedien-Bausteine nur in PB, Kopien nie von Hand. Keine Emojis. Kein Force-Push. CI sparsam: keine unnötigen Läufe auslösen. Jeder Abschluss mit
Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 10: BookLedgerPro für Windows. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-10.md und BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-9.md, docs/WINDOWS.md,
docs/UPDATES-EIGENER-SERVER.md, Forschung § 23–24.
Erst: meine Befunde aus der Gegenprobe 0.1.4 aufnehmen und beheben. Dann die Windows-Fassung prüfen und vorbereiten.
Windows veröffentlichen erst auf mein Wort (vorher releases lesen). Windows testet mein Freund an seinem eigenen PC mit eigenen Daten,
ich teste Android: kurze Anleitung für ihn, auf Wunsch eine Abgleich-Seite. BookLedgerPro ist öffentlich: keine Schlüssel in Dateien oder im Chat.
Ein PR je App, bei grüner CI selbst mergen. Nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
