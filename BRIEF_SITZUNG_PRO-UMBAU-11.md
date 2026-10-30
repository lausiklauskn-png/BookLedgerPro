# Brief für die nächste Sitzung: Pro-Umbau 11 — Mycel/SBKIM nach Klaus' Ja/Nein-Liste (geschrieben 2026-10-30)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-10.md`, Forschung § 25 (`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`), `docs/TRESORORDNER.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`; im Sage-Protokol (öffentlich, lesend klonen) `docs/HYBRID-MATCH-KONZEPT.md`, `docs/PAPER_NUTZEN_UND_INTEGRATION.md`,
`src/modules/22_such_widget.js`, `src/modules/23_rendezvous_ui.js`.

## Ausgangslage

BookLedgerPro **0.1.5** ist für Android **und Windows** veröffentlicht (Windows zum ersten Mal, eigener Server; Abschluss 10). Klaus' Freund testet Windows
am eigenen PC (`docs/WINDOWS-TESTANLEITUNG.md`), Klaus Android. Seit Umbau 10: kein Seitentitel oben, ein ⓘ je Kasten, Mikrofon in der SBKIM-Suche.

Klaus' Ja/Nein-Liste zu Mycel und SBKIM-Suche: https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk — Antworten mit `ArtifactData list` (Sammlung `antworten`,
Schlüssel m0–m12, „frei“) lesen. Ziel laut Klaus: „arbeitsplatzübergreifend Dokumente und Notizen in den Programmen im Netz finden“.

## Reihenfolge

1. Antworten aus der Liste lesen. Nur bauen, was Klaus mit Ja beantwortet hat; bei „Nein“ nichts, bei offenen Punkten fragen.
2. Befunde des Windows-Testers (falls gemeldet) und Klaus' Gegenprobe 0.1.5 aufnehmen.
3. Danach wie in Brief 10 Punkt 4 (nach Rückfrage): Umbau 9/10 in Workflow PDF Pro und Private Brain Pro (textZoom, ⓘ je Kasten, kein Titel oben, Version im Kopf).

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort; vor jeder Veröffentlichung `releases` lesen, Version + Buildnummer erhöhen. Keine Schlüssel oder Passwörter in
Dateien oder im Chat (Repo öffentlich). Nichts an echten Tresoren ohne Kopie und Rückweg. Kanon-Module (Sage) byte-1:1, Tresor-Paket/Scanner nur in WPP,
Bedien-Bausteine nur in PB, Kopien nie von Hand. Keine Emojis. Kein Force-Push. CI sparsam. Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 11: Mycel und SBKIM-Suche nach meiner Ja/Nein-Liste. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-11.md und BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-10.md, Forschung § 25, docs/TRESORORDNER.md.
Meine Antworten stehen in https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk (Sammlung „antworten“). Nur bauen, was ich mit Ja beantwortet habe.
Dann meine Befunde zu 0.1.5 und die meines Freundes zu Windows aufnehmen. Veröffentlichen nur auf mein Wort (vorher releases lesen).
BookLedgerPro ist öffentlich: keine Schlüssel in Dateien oder im Chat. Ein PR je App, bei grüner CI selbst mergen. Nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
