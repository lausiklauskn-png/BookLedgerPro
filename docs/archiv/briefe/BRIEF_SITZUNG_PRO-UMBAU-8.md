# Brief für die nächste Sitzung: Pro-Umbau 8 (geschrieben 2026-10-29)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (bei Bedarf Meine-Familienakte, Privat-Brain-Pro-V3).
Branch: der im ersten Prompt vorgegebene. Zuerst lesen: `CLAUDE.md` je Repo, `BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-7.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`, Forschung § 20–21 (Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md).

## Ausgangslage

Klaus prüft BookLedgerPro 0.1.3 und Workflow PDF Pro 1.0.9 am Tablet (Schritte im Abschluss Umbau 7, „Gegenprobe für Klaus“). Neu: Vorschau beim Tipp,
Bilder in die Schnellerfassung, Teilen ohne zweites Fenster mit Rücksprung, gesammeltes Speichern in Workflow PDF Pro. Noch offen aus Umbau 6: schwebende
Leiste über „Zur Anmeldung“ am Handy, PWA BookLedger Basic mit Scanner.

## Reihenfolge

1. Klaus' Befunde aufnehmen und beheben (ein PR je App, bei grüner CI selbst mergen, Basic nachziehen). Besonders: kommt der Scan im offenen Fenster an,
   springt das Fenster zurück zu Workflow PDF, bleibt die Liste in geteilter Ansicht im Bild.
2. Wenn Klaus „Windows“ sagt: BookLedgerPro Windows (`windows-release.yml`, eigener Server, Windows-Version steht auf 0.1.1), Workflow PDF Pro Windows 1.0.9,
   Private Brain Pro Windows 1.0.42 — vorher `releases` lesen.
3. Nach Rückfrage: Private Brain V3 (Mikrofon-Regel, Gerätecheck, zweites Modell, Hintergrund), WPP-Windows Tresorordner; Einfügen von Bildern auch in
   Workflow PDF Pro und Private Brain Pro (Klaus' Wunsch, dort gibt es es noch nicht).

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort; vor jeder Veröffentlichung `releases` lesen und Version + Buildnummer erhöhen. Keine Schlüssel oder Passwörter im
Chat oder in Dateien — schickt Klaus versehentlich eins, nicht verwenden, nirgends hinschreiben, vor dem Push alle Repos danach durchsuchen. Nichts an echten
Tresoren ohne Kopie und Rückweg. Tresor-Paket und Scanner-Baustein nur in WPP, Bedien-Bausteine nur in PB, Kopien nie von Hand, Kern (`upstream/`) nie von
Hand. Keine Emojis. PR-Ereignisse nicht für bare Münze nehmen — den Lauf selbst lesen. Jeder Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 8. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-8.md und BRIEF_ABSCHLUSS_2026-10-29_PRO-UMBAU-7.md,
docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md, Forschung § 20–21.
Erst: meine Befunde aus der Gegenprobe am Tablet (BookLedgerPro 0.1.3 + Workflow PDF Pro 1.0.9, PWA) aufnehmen und beheben.
Windows erst auf mein Wort (vorher releases lesen). Danach nach Rückfrage: Private Brain V3, WPP-Windows Tresorordner,
Bilder einfügen auch in Workflow PDF Pro und Private Brain Pro.
Ein PR je App, bei grüner CI selbst mergen. Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat,
nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
