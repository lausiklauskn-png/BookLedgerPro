# Abschluss Pro-Umbau 8 (2026-10-29, Abend)

Repos: BookLedgerPro, BookLedger-Basic, dazu **Projekt-Reiniger Pro** (Klaus' erste Befunde betrafen ihn; die Sitzung lief in dessen Repo).
Workflow-PDF-Pro und Privat-Brain-Pro gelesen, nicht geändert. Auftrag: Klaus' Befunde aus der Gegenprobe am Tablet aufnehmen und beheben.

## Klaus' Befunde und was daraus wurde

| Befund (Klaus, Tablet, APK 0.1.3) | Ursache | Behoben in |
|---|---|---|
| Belegliste vollständig, Vorschau kommt, Teilen geht, „Text aus PDF“ und Prüfen gehen; Workflow PDF blieb beim Teilen offen | — (bestanden) | — |
| „Ich füge oben ein Objekt ein … und sehe unten erst das Ergebnis“; Einfügen schien nicht zu gehen | Es ging (der Beleg hieß „Eingefügt 2026-10-29 17-07 (Scan).pdf“), landete aber unter 5–6 Kästen; das Feld sagte nur „Text“ | BLP #413: alle Knöpfe in einer Leiste oben, **Ablagefläche** (hineinziehen, einfügen, lange drücken → Einfügen, Knopf „Einfügen“, Strg+V auf der Seite), Meldung und Liste gleich darunter, neuer Beleg **markiert und ins Bild gerollt** |
| E-Rechnung / Bankauszug: Titel und Knopf doppelt, Schnellerfassung zu groß | drei Kästen mit Überschrift, Erklärung und Knopf | BLP #413: je ein Knopf, der seinen Bereich öffnet (E-Rechnung/Bankauszug gleich mit Dateiwahl); Archiv-Kasten unter die Liste |
| „Das Wort Belege nimmt so viel Platz weg … oben in der Kopfleiste klein … merken für die Zukunft“ | große `<h1>` je Seite | BLP #413: `src/ui/kopfTitel.js` (alle Seiten), Leitfaden § 1.7 |
| Update-Knopf hinter die Versionsnummer | Version und Knopf untereinander | BLP #413: eine Zeile in „Über“ |
| Schieberegler für die Schriftgröße („A··A“), auch Windows, APK, Basic | gab es nicht | BLP #413: Knopf im Kopf, 85–150 %, gemerkt auch vor der Anmeldung; Leitfaden § 1.8 |
| ⋯-Menü: erst nach Rollen zu sehen, Container zu klein | das Menü hing absolut in der Tabellenkarte, die es abschnitt | BLP #413: fest am Fenster, so hoch wie seine Einträge, über oder unter dem ⋯, rückt beim Rollen mit |
| X zum Schließen der Vorschau | nur „Schließen“ unten | BLP #413: X oben rechts |
| Frisch Geteiltes nicht zu finden („wie beim E-Mail … mit Uhrzeit“) | keine Markierung | BLP #413: „neu“ + fett + „heute 17:07“ in der Datumsspalte |

## PRs

| PR | Inhalt | CI |
|---|---|---|
| Reiniger #13 | Befund Fassung 9 (Knopf-Namen, „Neu“ links, Vorführung „So geht's“), Stufe 6 Zurückbauen, Fenster unter dem Kopf | keine PR-CI (nur auf main); `npm test` 322/0, Gegenproben 12/0; übernommen `8a3f437` |
| BLP #413 | Belege, Titel im Kopf, Schriftgröße, ⋯-Menü, X, Versionszeile, Leitfaden § 1.7–1.9, sw.js v282 | grün (engine, android ×2, windows, smoke ×2), übernommen `afc8f60` |
| BLP #415 | `smoke_befunde8`: Teil „Über“ nur mit App-Hülle (Basic) | grün, übernommen `2fe06d9` |
| Basic #21 | Pro `2fe06d9` nachgezogen | grün, übernommen `3a6f05a` |

Proben BLP: `run.mjs` 2602/0 · neu `smoke_befunde8` **125** · `befunde` 52 · `befunde7` 33 · `design` 92 · `belegliste` 23 · `umbau4` 23 · `mikro` 19 ·
`handnamen` 21 · `scanner` 13 · `teilen` 26 · `belegsuche` 18 · `tresorordner` 30 · `frage` 16 · `ohne_web` 28 · `windows` 23 · `apps` 22 · `wfpdf` 14 · `mail` 15 ·
`vorgang` 32 · `test-native` 48 — 0 ROT. Gegenproben (Sabotage, ganze Probe): MENUE, KOPFTITEL, REIHENFOLGE, NEUMARKE, SCHRIFT, ABLAGE — 6 gefangen · 0 blind.
`smoke_belege` 46/14 ROT — **auf main identisch** (Behälter: Workflow-PDF-Klon und playwright-core 1.56 fehlen). Basic: `basic_gleichstand` 23 · `run.mjs` 2600 ·
`smoke_befunde8` 70 · `befunde7` 19 · `design` 92 · `befunde` 40 · `belegliste` 23 · `mikro` 19 · `handnamen` 21.

## Veröffentlicht

Nichts (kein Wort von Klaus). Basic über Pages mit dem Merge #21; Reiniger-PWA und dessen Testfassung 10 baut GitHub nach dem Merge #13 von selbst (Vorab-Veröffentlichung `testfassung`, so im Reiniger eingerichtet).

## Gegenprobe für Klaus (Tablet, nach der nächsten APK)

1. Belege: oben eine Knopfleiste, darunter „Beleg hierher ziehen oder einfügen“. Ein Foto hineinziehen bzw. lange drücken → „Einfügen“: der Beleg erscheint **gleich darunter**, fett, „neu“, „heute hh:mm“.
2. „Text erfassen“, „E-Rechnung einlesen“, „Bankauszug einlesen“: je ein Tipp öffnet den Bereich (E-Rechnung/Bankauszug gleich mit Dateiwahl).
3. Oben steht „BookLedgerPro · Belege“, keine große Überschrift mehr; auf anderen Seiten deren Name.
4. „A··A“ im Kopf → Regler → größer: alles wächst; App neu starten: bleibt.
5. ⋯ an der untersten Zeile: Menü ganz zu sehen. Vorschau: X oben rechts. „Über“: Version und „Auf Updates prüfen“ in einer Zeile.

## Nicht gemessen / offen

- Nichts davon am Gerät; insbesondere Einfügen per langem Druck in der Android-WebView (Fläche ist `contenteditable` mit `inputmode=none`) und der
  Knopf „Einfügen“ (Zwischenablage lesen — die WebView kann es verweigern, dann sagt die Meldung den anderen Weg).
- „neu“ gilt bis zum nächsten Einlesen in dieser Sitzung (nicht über einen Neustart).
- Windows (BLP, WPP, PB) nicht veröffentlicht — erst auf Klaus' Wort.
- Nicht begonnen: Private Brain V3, WPP-Windows Tresorordner, Bilder einfügen in Workflow PDF Pro und Private Brain Pro (nach Rückfrage).

## Stundennachweis

Erste Spur 17:37 (Ortszeit Berlin; 16:37 UTC: vier Repos angehängt und geklont), Reiniger-Befunde und Bau 17:40 → 18:24 (PR #13), BLP-Befunde 18:15 → 19:05
(PR #413, #415), Basic 19:10, Abschluss gegen 19:20. Ein Block, dazwischen Warten auf Proben und CI. Spanne ≈ 1,7 h. Klaus' Zeit am Tablet (Gegenprobe,
Bilder, Diktat) liegt in dieser Spanne; seine eigene Angabe geht vor. Zeile in `docs/STUNDENNACHWEIS.md`.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-9.md`.
