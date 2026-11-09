# Brief für die nächste Sitzung: Pro-Umbau 7 (geschrieben 2026-10-29)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (später Privat-Brain-Pro-V3, Meine Familienakte).
Branch: der im ersten Prompt vorgegebene. Zuerst lesen: `CLAUDE.md` je Repo, `BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-6.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`, Forschung § 19–20.

## Ausgangslage

Klaus macht die **Gegenprobe an den echten Apps** (Tablet): BookLedgerPro 0.1.2 + Workflow PDF Pro 1.0.8 (APK) und die PWAs. Schritte im Abschluss
Umbau 6 („Gegenprobe für Klaus“). **Zuerst seine Befunde aufnehmen** und beheben. Windows erst, wenn APK und PWA in Ordnung sind.

## Reihenfolge

1. Befunde aus Klaus' Gegenprobe (Scanner-Intent, Rückweg „Teilen“, alles, was er meldet). Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen.
2. Wenn Klaus „Windows“ sagt: BookLedgerPro Windows (Lauf `windows-release.yml`, erster Lauf über den eigenen Server; Windows-Version steht noch auf 0.1.1,
   vorher `releases` lesen), Workflow PDF Pro Windows 1.0.8, Private Brain Pro Windows 1.0.42.
3. Nach Rückfrage: Private Brain V3 (Mikrofon-Regel, Gerätecheck, zweites Modell, Hintergrund), WPP-Windows Tresorordner.

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort. Vor jeder Veröffentlichung `releases` lesen (Version schon draußen?). Keine Schlüssel im Chat. Nichts an echten
Tresoren ohne Kopie und Rückweg. Tresor-Paket und Scanner-Baustein nur in WPP, Bedien-Bausteine nur in PB, Kopien nie von Hand. Keine Emojis.
PR-Ereignisse nicht für bare Münze nehmen — den Lauf selbst lesen. Jeder Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 7. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-7.md und BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-6.md,
docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md, Forschung § 19–20.
Erst: meine Befunde aus der Gegenprobe am Tablet (BookLedgerPro 0.1.2 + Workflow PDF Pro 1.0.8, PWA) aufnehmen und beheben.
Windows erst auf mein Wort (vorher releases lesen). Danach nach Rückfrage: Private Brain V3, WPP-Windows Tresorordner.
Ein PR je App, bei grüner CI selbst mergen. Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat,
nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
