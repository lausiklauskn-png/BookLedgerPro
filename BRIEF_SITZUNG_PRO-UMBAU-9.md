# Brief für die nächste Sitzung: Pro-Umbau 9 (geschrieben 2026-10-29 abends)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (bei Bedarf Meine-Familienakte, Privat-Brain-Pro-V3).
Branch: der im ersten Prompt vorgegebene. Zuerst lesen: `CLAUDE.md` je Repo, `BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-8.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md` (neu § 1.7–1.9), Forschung § 21–22 (`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`).

## Ausgangslage

BookLedgerPro main `2fe06d9`: Belege neu geordnet (Knöpfe oben, Ablagefläche, „neu“ mit Uhrzeit), Seitentitel klein im Kopf, Schriftgröße „A··A“,
⋯-Menü ganz sichtbar, X in der Vorschau, Version + Update-Knopf in einer Zeile. Basic `3a6f05a` nachgezogen. **Nicht veröffentlicht** — die APK am
Tablet ist noch 0.1.3, Klaus sieht das Neue erst mit der nächsten Veröffentlichung (oder in Basic über Pages).

## Reihenfolge

1. Wenn Klaus „veröffentlichen“ sagt: vorher `releases` lesen, BookLedgerPro Android 0.1.4 (Buildnummer +1), Gegenprobe-Schritte aus dem Abschluss 8.
2. Klaus' nächste Befunde aufnehmen (besonders: Einfügen per langem Druck in der APK, Schriftgröße am Gerät, Titel im Kopf am Handy).
3. **Leitfaden § 1.7–1.9 in die anderen Pro-Apps** (Workflow PDF Pro, Private Brain Pro): Titel im Kopf, Schriftgröße „A··A“, Neues markiert — nach Rückfrage.
4. Wenn Klaus „Windows“ sagt: BLP Windows (`windows-release.yml`, eigener Server), WPP Windows, PB Windows — vorher `releases` lesen.
5. Nach Rückfrage: Private Brain V3, WPP-Windows Tresorordner, Bilder einfügen in Workflow PDF Pro und Private Brain Pro.

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort; vor jeder Veröffentlichung `releases` lesen und Version + Buildnummer erhöhen. Keine Schlüssel oder Passwörter im
Chat oder in Dateien. Nichts an echten Tresoren ohne Kopie und Rückweg. Tresor-Paket und Scanner-Baustein nur in WPP, Bedien-Bausteine nur in PB, Kopien nie
von Hand, Kern (`upstream/`) nie von Hand. Keine Emojis. PR-Ereignisse nicht für bare Münze nehmen — den Lauf selbst lesen. Kein Force-Push: ein schon
gemergter Zweig wird vorgespult (`git merge --ff-only origin/main`), dann normal weitergeschoben. Jeder Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 9. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-9.md und BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-8.md,
docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md (§ 1.7–1.9 neu), Forschung § 21–22.
Erst: meine Befunde aufnehmen und beheben. Veröffentlichen und Windows erst auf mein Wort (vorher releases lesen).
Danach nach Rückfrage: Leitfaden § 1.7–1.9 in Workflow PDF Pro und Private Brain Pro, Private Brain V3, WPP-Windows Tresorordner,
Bilder einfügen in Workflow PDF Pro und Private Brain Pro.
Ein PR je App, bei grüner CI selbst mergen. Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat,
nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
