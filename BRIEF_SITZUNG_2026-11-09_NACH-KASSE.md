# Brief an die nächste Sitzung (nach Kasse & Tagesabschluss, 2026-11-09)

## Zuerst lesen
1. `BRIEF_ABSCHLUSS_2026-11-09_KASSE-TAGESABSCHLUSS.md`
2. `docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md` Abschnitt 8 (J3–J6 mit Empfehlung, F3–F5 entschieden)
3. `CLAUDE.md`, `docs/PULS.md`

## Erste Schritte
1. Klaus fragen, ob er der Empfehlung J3–J6 (alle Ja) zustimmt; erst dann Ausmisten (Bauplan Abschnitt 3).
2. PRs prüfen: BookLedgerPro (Branch `ccr-928a2344-tri4zq`), Alis-Moderaum #84, Basic-Nachzug. Mergen nur mit grüner CI.
3. Klaus' Probe am Tablet: Tagesabschluss mit echter Sprache und Foto, Quittung drucken.
4. Danach möglich: Abschluss stornieren (Knopf), gemischte Steuersätze, Übergabe Fassung 2 aus Alis-Moderaum über den Tresor.

## Was nicht passieren darf
- Nichts veröffentlichen ohne Klaus' Wort; kein Release erneut auslösen.
- Keine Daten löschen; keine Bargeld-Kassenfunktion/TSE bauen.
- Familienakte und Workflow PDF Pro nicht ändern, bevor die Geldkarte abgestimmt ist.
- Keine Forschungseinträge in diesem Repo (Kimhub).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/BookLedgerPro (Branch laut Sitzung), dazu Alis-Moderaum und BookLedger-Basic.
Zuerst lesen: BRIEF_ABSCHLUSS_2026-11-09_KASSE-TAGESABSCHLUSS.md, docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md
(Abschnitt 8), dann CLAUDE.md und docs/PULS.md.
1) Klaus fragen: Empfehlung J3–J6 alle Ja – zustimmen? Erst dann Ausmisten nach Bauplan Abschnitt 3.
2) Offene Entwurfs-PRs prüfen (BLP Kasse & Tagesabschluss, Alis-Moderaum #84, Basic-Nachzug), CI grün → mergen.
3) Nach Klaus' Tablet-Probe Befunde zum Tagesabschluss beheben.
Proben: node tests/run.mjs, smoke_tagesabschluss, smoke_design; Basic nachziehen.
Nicht: nichts veröffentlichen, keine Daten löschen, keine TSE/Bargeld-Kasse, Familienakte/Workflow PDF Pro
nicht ändern, keine Forschungseinträge hier.
```
