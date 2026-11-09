# Abschluss Pro-Umbau 9 (2026-10-29, spät)

Repos: BookLedgerPro, BookLedger-Basic. Workflow-PDF-Pro, Privat-Brain-Pro, project-cleaner-pro und Meine-Familienakte nur gelesen (Download-Seite).
Auftrag: Klaus' Befunde aus der Gegenprobe am Tablet aufnehmen und beheben, danach BookLedgerPro 0.1.4 veröffentlichen (Klaus: „müssen auf main und veröffentlicht werden“).

## Klaus' Befunde und was daraus wurde

| Befund (Klaus, Tablet, APK 0.1.3 und Basic) | Ursache | Behoben in |
|---|---|---|
| ⓘ erzeugt eine neue Zeile (manchmal zwei), soll hinter „Modus“, „Alle Einstellungen zeigen“, „Erscheinungsbild“ stehen | `schlank.js` hängte das ⓘ nur an eine Zwischenüberschrift direkt davor, sonst vor den Satz — in den Einstellungen steht davor die Knopfreihe | BLP #418: `erklaerZiel` sucht die Beschriftung rückwärts (auch eine Ebene höher), mehrere Sätze ein ⓘ, Satz unter dem Seitentitel → ⓘ hinter dem kleinen Titel im Kopf |
| APK hat größere Schrift als die PWA; lieber klein starten, mit „A··A“ größer; nur die Schrift, nicht die Knöpfe | Android-WebView übernimmt die Systemschrift (`textZoom`) | BLP #418: `setTextZoom(100)`; Knöpfe mit Höhe in px und fast ohne Innenabstand |
| Versionsnummer oben unter „BookLedgerPro“ als Update-Link, zusätzlich in den Einstellungen / bei „Weiteres“ | gab es nur unter „Über“ | BLP #418: `v0.1.4` im Kopf (Tipp prüft gleich), „Version und Updates“ oben in den Einstellungen, „Auf Updates prüfen“ bei „Weiteres“ |
| Mikrofon und „DE“ nie in eigener Zeile, sondern im Feld | Leiste hing hinter dem Feld | BLP #418: rechts im Feld (`.mikro-im-feld`) |
| Kästchen „Verbraucher“ / „Auf Ziel buchen“ mitten im Feld | `.form-grid input { width: 100% }` traf auch Kästchen | BLP #418: Kästchen links, Text dahinter |
| Passwort-Eingang passt farblich nicht zum Thema (blauer Knopf, grünes Bild) | Eingang folgte dem Farbthema | BLP #418: Eingang fest Petrol hell |
| BLP Basic am Logo erkennbar, weißer Hintergrund | gleiches Logo wie Pro | Basic #23: eigene Symbole (weiß, Innenleben dunkelgrün) |
| Einfügen, „neu“, Knöpfe oben, A··A | — (bestanden, Klaus' Bilder) | — |
| Frage: warum öffnen alle Einlese-Knöpfe denselben Ordner? | Android merkt sich den letzten Ordner; die Knöpfe unterscheiden sich danach (Belege, ganzer Ordner, E-Rechnung → Buchungsvorschlag, Bankauszug → Umsätze und Abgleich) | erklärt; fester Ordner je Knopf nur auf Klaus' Wunsch |

## Außerdem

- **GitHub-Läufe starteten nicht** (nach 3 s „fehlgeschlagen“, kein Runner): Freiminuten des privaten Repos verbraucht, Budget 0 $ → gestoppt, **nichts berechnet**
  (Abrechnung: 274,47 $ Listenpreis − 274,62 $ enthaltene Nutzung, nächste Zahlung „-“). Klaus hat BookLedgerPro nach Prüfung **öffentlich** gestellt (Signaturschlüssel
  nur verschlüsselt, keine Zugangsschlüssel im Verlauf, nur Beispiel-IBANs). CI sparsamer: Push nur `main`, Android/Windows nur bei passenden Pfaden.
- Logo-Prompt für ein neues Basic-Logo (GPT) an Klaus gegeben.
- Download-Seite für die Gegenprobe (alle Apps, Artifact) erstellt.

## PRs

| PR | Inhalt | CI |
|---|---|---|
| BLP #418 | Befunde oben, `smoke_befunde9` (109), CI sparsam, sw v284 | grün (smoke, engine, android, windows), übernommen `805f8b1` |
| Basic #23 | Pro `02ec023` + eigenes Logo, Regeln Fassung 2, Nachziehen löscht nie Basic-eigenes | grün, übernommen `a160813` |
| Basic #24 | Pin auf Pro-main `805f8b1`, sparsame CI | grün, übernommen `d49f779` |

Proben BLP: `run.mjs` 2610/0 · `test-native` 51 · neu `smoke_befunde9` **109** · `befunde8` 125 · `befunde7` 47 · `befunde` 52 · `design` 92 · `umbau4` 23 · `ohne_web` 28 ·
`tresorordner` 30 · `windows` 23 · `teilen` 26. Gegenprobe (Sabotage): Eingang 1 · ⓘ-Ziel 5 · Mikrofon 6 · Knopfabstand 4 ROT — 4 gefangen · 0 blind.
Nicht lauffähig im Behälter (suchen Chromium 1194): `mikro`, `belegliste`, `handnamen`, `belegsuche`, `scanner`, `frage`, `apps`, `vorgang`, `mail`, `wfpdf`.
Basic: `basic_gleichstand` 25 · `run.mjs` 2608/0 · `befunde9` 48 · `befunde8` 70 · `befunde` 40 · `design` 92.

## Veröffentlicht

**BookLedgerPro 0.1.4 für Android** (Klaus' Wort: „müssen auf main gezogen werden und veröffentlicht werden“): [APK](https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.4/BookLedgerPro-0.1.4.apk)
· [eigener Server](https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-0.1.4.apk). Lauf 40966924207 (build, publish grün; Updateprobe 0.1.3 → 0.1.4 im Emulator),
Tag `v0.1.4`, Quelle `805f8b13dd20651a362200d01d1114ce2e7545dd` (#418), Buildnummer 5, 28.302.651 B, SHA-256 `c7f94e39aa628d548fa890e97faaba27143c2474506417759d8e875f8fa90882`,
unabhängig geladen und gleich `.sha256`; auf dem Update-Server im Lauf selbst verglichen (`aktuell-android.json` + Unterschrift + APK). Nicht erneut auslösen.
Basic über Pages (#23, #24). Windows nicht (kommt in Umbau 10). Download-Seite für Klaus: https://claude.ai/artifact/MFaYdbzH9MreBQSC5Mkr1H

## Gegenprobe für Klaus (Tablet, APK 0.1.4)

1. Kopf: unter „BookLedgerPro“ klein „v0.1.4“ — Tipp prüft auf Updates.
2. Schrift so klein wie im Browser; „A··A“ größer, Knöpfe bleiben gleich hoch.
3. Einstellungen: ⓘ hinter „Modus“, „Helligkeit“, keine eigene Zeile.
4. Belege: Mikrofon und „DE“ im Suchfeld.
5. Kunden / Verbindlichkeiten: Kästchen links.
6. Sperren: Passwortseite grün, egal welches Thema.

## Nicht gemessen / offen

- Alles am Gerät (textZoom am Samsung, Update-Link mit echtem Server, Mikrofon im Feld bei echter Erkennung).
- Workflow PDF Pro und Private Brain Pro haben textZoom und § 1.7–1.9 noch nicht (nächste Sitzungen, nach Rückfrage).
- Windows (BLP) gebaut, nicht veröffentlicht — nächste Sitzung (`BRIEF_SITZUNG_PRO-UMBAU-10.md`).

## Stundennachweis

Erste Spur 22:00 (Ortszeit Berlin; 21:00 UTC Sitzungsbeginn), Befunde und Bau 22:05 → 22:50 (Commit `02ec023` 22:52), Basic 22:57, Abrechnungsfrage und
Öffentlich-Stellen 23:00 → 23:20, CI sparsam 23:12, Merge 23:32, Veröffentlichung und Abschluss 23:41 (APK), Abschluss gegen 23:50. Ein Block, dazwischen Warten auf CI. Spanne ≈ 1,8 h.
Klaus' Zeit am Tablet (Bilder, Abrechnung prüfen) liegt in dieser Spanne; seine eigene Angabe geht vor. Zeile in `docs/STUNDENNACHWEIS.md`.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-10.md`.
