# Abschluss Pro-Umbau 6 (2026-10-29, Nacht)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro. Auftrag: „Mit Workflow PDF scannen“ in BookLedgerPro auf den Intent
`de.familyprojekt.workflowpdf.pro.SCANNEN` umstellen, Basic nachziehen; danach (Klaus' Nachricht in der Sitzung) **eine APK und die PWA zur
Gegenprobe an den echten Apps**, Windows später.

## Erledigt

| Schritt | PR | Inhalt |
|---|---|---|
| Doku Umbau 5 | BLP #401, WPP #41 | lagen noch offen (der Abschluss Umbau 5 sagte „alles auf main“ — stimmte für diese zwei nicht); CI grün, übernommen |
| Scanner direkt | BLP #402 | `BlpTresor.scanStarten` → Intent `SCANNEN` (Paket fest, `von=BookLedgerPro`); ältere Workflow PDF Pro ohne Intent → nur starten; ältere Hülle/Windows → `appOeffnen`; keine App → „nicht installiert“ |
| Version | BLP #403 | Android 0.1.2 / Buildnummer 3 (0.1.1 ist seit 2026-10-28 veröffentlicht — der Brief Umbau 6 nannte 0.1.1 irrtümlich als neu) |
| Release-Probe | BLP #404–#408 | Passwortfelder über drei Wege, Lage im Protokoll · Deckblatt ohne sichtbaren Knopf weiterwischen · Fehlerdialoge im Wegwerf-Emulator ausblenden (`hide_error_dialogs`) statt „Warten“ zu tippen · „Zur Anmeldung“ außerhalb der schwebenden SBKIM-Leiste tippen · versehentliche `.pyc` entfernt |
| Basic | Basic #16, #17 | Pro `f9b1b6e` und den Endstand nachgezogen (für die PWA nichts sichtbar) |
| Doku WPP | WPP #42 | 1.0.8 in `CLAUDE.md` |

## Veröffentlicht (nur Android, auf Klaus' Wort „eine APK-App … zur Gegenprobe“)

- **Workflow PDF Pro 1.0.8:** [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.8/Workflow-PDF-Pro-1.0.8.apk) — Lauf 40794715829
  (Versuch 2), Quelle `f614e4a`, Buildnummer 9, 83.238.351 B, SHA-256 `dabab89ec3623d118b88fa0cd482e7472433b9e2e7eb8eb9494a4b87c825f4b6`; unabhängig geladen, gleich.
- **BookLedgerPro 0.1.2:** [Release](https://github.com/lausiklauskn-png/BookLedgerPro/releases/tag/v0.1.2) (Repo privat, mit Anmeldung) und über den eigenen
  Server `https://family-projekt.de/updates/bookledgerpro/` — **erster Lauf über den eigenen Server**, Hochladen und Außenprüfung im Lauf grün. Lauf 40811612794
  (sechster Anlauf, siehe Forschung § 20.5), Quelle `35cd0c3`, Buildnummer 3, 28.281.919 B, SHA-256 `889845ad6f4c6f9e77a656097ae99e474e9b450073d0ae1500a9a729f459d79c`,
  Zertifikat `7a6217eb…`; mit Anmeldung unabhängig geladen, gleich. In der App: Über → „Auf Updates prüfen“ meldet 0.1.2 (0.1.1 kannte den Server noch nicht —
  0.1.2 einmal von Hand installieren, über die vorhandene App).
- **PWA:** BookLedger Basic über Pages (Merge #16); für die PWA ändert sich durch diesen Umbau nichts Sichtbares. Workflow PDF (PWA) unverändert.

## Gegenprobe für Klaus (am Tablet)

1. Workflow PDF Pro 1.0.8 über die vorhandene App installieren, dann BookLedgerPro 0.1.2.
2. BookLedgerPro → Belege → „Mit Workflow PDF scannen“: **der Scanner** von Workflow PDF Pro muss sofort offen sein (nicht nur die Bibliothek).
3. Scannen, „Teilen“ → BookLedgerPro: der Scan kommt als Beleg (Stand „eigen“) an.
4. Gegenprobe ohne Workflow PDF Pro (oder ältere Fassung): Satz „nicht installiert“ bzw. „ist offen: dort scannen“.
5. Am Handy (schmal): liegt die schwebende Leiste (LEBT/VERKEHR/Siegel) über „Zur Anmeldung“? Im Emulator war es so (Forschung § 20.5).
6. PWA: BookLedger Basic (`https://lausiklauskn-png.github.io/BookLedger-Basic/`) — „Mit Workflow PDF scannen“ öffnet die Workflow-PDF-PWA mit Scanner wie bisher.

## Nicht gemessen / offen

- Kein Gerät: ob Android den Intent zwischen den beiden signierten Apps auflöst, zeigt erst Klaus' Tablet.
- WPP-Probe Versuch 1: nach Enter im Ordner-Dialog stand der Startbildschirm da (App weg). Im Browser fehlerfrei nachgespielt, Versuch 2 auf demselben
  Emulator (API 31) bestanden. Ursache offen — wenn es am Tablet auftritt, ist es echt.
- Windows (BLP, WPP) bewusst nicht veröffentlicht (Klaus: erst wenn APK und PWA in Ordnung sind). Private Brain Pro Windows 1.0.42 ebenso nicht.
- Nicht begonnen: Private Brain V3, WPP-Windows Tresorordner (beide „nach Rückfrage“), Meine Familienakte.

## Stundennachweis

Erste Spur 01:00 (Ortszeit Berlin, 00:00 UTC, erste Abfrage), Commits 01:07 → 04:1x in einem Block, Abschluss gegen 04:45. Dazwischen lange Wartezeiten
auf CI und Emulator-Läufe (acht Veröffentlichungsanläufe für zwei APKs). Summe der Blöcke ≈ 3,7 h, Spanne ≈ 3,75 h. Klaus' Zeit am Bildschirm ohne Commit nicht messbar;
seine eigene Angabe geht vor. Zeile in `docs/STUNDENNACHWEIS.md`.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-7.md`.
