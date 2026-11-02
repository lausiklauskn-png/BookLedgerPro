# Abschluss 2026-11-02 · Gegenproben Pro-Umbau 14 „Parallel-Teil“ (Workflow-PDF im Netz, Sage C, D Briefkopf)

Nur nachgeprüft, nichts gebaut. Tabelle aus `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14-C-D.md`, je Repo frisch von `origin/main`.

## Ergebnis: alles grün, kein Fehler zu beheben

| # | Repo (Stand `origin/main`) | Befehl | Schlusszeile | Rückgabe |
|---|---|---|---|---|
| 1 | Workflow-PDF `742d912` | `npm install && npm test` | letzte Probe `56 grün · 0 ROT`, keine rote Zeile in der Kette | 0 |
| 2 | Workflow-PDF | `node tests/briefkopf.mjs` | `56 grün · 0 ROT` | 0 |
| 3 | Workflow-PDF | `node tests/gegenprobe_briefkopf.mjs` | `14 gefangen · 0 durchgerutscht/gestolpert · 0 tote Anker` | 0 |
| 4 | Workflow-PDF | `node tests/netz.mjs` | `netz: 28 grün · 0 ROT` | 0 |
| 5 | Workflow-PDF | `node tests/gegenprobe_netz.mjs` | `6 gefangen · 0 durchgerutscht · 0 aus falschem Grund · 0 tote Anker` | 0 |
| 6 | Workflow-PDF | `node tests/version.mjs` · `node tests/gegenprobe_version.mjs` | `12 grün · 0 ROT` · `7 gefangen · 0 durchgerutscht · 0 aus falschem Grund · 0 tote Anker` | 0 · 0 |
| 7 | BookLedgerPro `10f3992` | `node tests/run.mjs` | `— 2645 bestanden, 0 fehlgeschlagen —` | 0 |
| 8 | BookLedger-Basic `0ec5284` | `node tests/basic_gleichstand.mjs` | `27 grün · 0 ROT` (Pin auf Pro `10f3992`, neuer als `8ad35e1`) | 0 |
| 9 | Sage-Protokol `905f9e7` | lesen | `docs/NETZWEIT.md` § 3d (Z. 309) und `docs/INTERFACES.md` Modul 23 (Z. 5805) „Netzübergreifende Suche … und Chefcode“ stehen da | – |
| 10 | Klaus am Tablet | Sichttest Briefkopf | offen, nur Klaus kann ihn grün melden | – |

Zu Zeile 6: Workflow-PDF steht inzwischen auf **1.1.8 / `workfloh-pdf-v113`** (Meta = `package.json` = `CACHE_VERSION`), nicht mehr 1.1.6/v111
wie im Brief vom 31.10. — spätere Stände (#140 Importabschluss, #141 Ausgabe-Herkunft) haben weiter gezählt; die Probe verlangt Gleichstand, nicht 1.1.6.

## Befund am Rand (Behälter, nicht Repo)

Der erste `npm test` brach in `tests/ausgabe-herkunft.mjs` ab: der Behälter hat Chromium **1243**, die Proben suchen fest **1194**
(`/opt/pw-browsers/chromium-1194/…` bzw. Playwrights `chromium_headless_shell-1194`). Nur im Behälter zwei Verweise auf die vorhandene
Fassung gelegt, die Proben unverändert gelassen; danach grün. In der CI (eigener Browser) tritt das nicht auf. Wer will, kann die Probe-Pfade
später auf `/opt/pw-browsers/chromium` (Verweis auf die jeweils installierte Fassung) erweitern — bewusst nicht angefasst (keine Bauarbeit).

## Nicht geprüft
Kein Tablet, kein echtes Relais, kein echtes Sprachmodell, nur erfundene Briefe. Nichts veröffentlicht, nichts auf GitHub kommentiert.

## Stundennachweis
Erste Spur ≈ 11:31 (Uhr des Behälters), letzte ≈ 11:52. Ein Block ≈ 0.4 h, darin Wartezeit auf `npm test` ≈ 0.15 h. Obergrenze 0.4 h.
Zeile in `docs/STUNDENNACHWEIS.md`. Klaus' eigene Angabe geht vor.
