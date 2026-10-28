# Brief für die nächste Sitzung: Pro-Umbau 6 (geschrieben 2026-10-29)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro, später Privat-Brain-Pro-V3 und Meine Familienakte.
Branch: der im ersten Prompt vorgegebene. Zuerst lesen: `CLAUDE.md` je Repo, `BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-5.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`, Forschung § 18–19, `docs/UPDATES-EIGENER-SERVER.md`.

## Vorschlag Reihenfolge (Klaus entscheidet)

1. **BookLedgerPro „Mit Workflow PDF scannen“ auf den neuen Intent umstellen** (Android): `de.familyprojekt.workflowpdf.pro.SCANNEN`, Paket
   `de.familyprojekt.workflowpdf.pro`, Zusatz `von=BookLedgerPro`; fehlt die App → „nicht installiert“. Vorlage im Abschluss § 19.9. Basic nachziehen.
2. **Meine Familienakte: Updates über Klaus' Server** — Klaus bringt das Repo mit. Startauftrag unten (eigener Abschnitt).
3. **Private Brain V3** (Schritt 5 aus Umbau 5): Mikrofon-Regel, Gerätecheck, zweites Modell, Hintergrund.
4. **Workflow PDF Pro Windows: Tresorordner** nachrüsten (Lücke zu Android).
5. **Veröffentlichen nur auf Klaus' Wort:** BookLedgerPro 0.1.1 (erster Lauf über den eigenen Server, Windows + Android), Workflow PDF Pro 1.0.8,
   Private Brain Pro Windows 1.0.42. Danach unabhängig laden und Prüfsummen vergleichen.

## Meine Familienakte — Updates über den eigenen Server

Was steht (nicht neu einrichten): Server `167.233.204.72` (Hetzner, Caddy), Webordner `/srv/family-project/updates/<app>/`, von außen
`https://family-projekt.de/updates/<app>/`. Hochlade-Schlüssel bei Klaus in Termux `~/blp-update/upload` (darf über rrsync nur in
`/srv/family-project/updates` schreiben, für alle Apps nutzbar). Server-Kennung
`167.233.204.72 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIhzSmN0kY2Vk2oem2u6dH8rq04A8UXVZyay2WWRjOmR`.
Vorlage: `docs/UPDATES-EIGENER-SERVER.md`, Code in BookLedgerPro (`windows/engine/src/DesktopUpdates.java`, `android/.../UpdateFeed.java`,
`BlpUpdatesPlugin.java`, Proben, `windows-release.yml`, `android-release.yml`). Erst klären, ob die Familienakte Setup/APK hat (eine PWA braucht das nicht).
Eigener Signatur-Schlüssel je App (Termux-Block aus der Vorlage), nur der öffentliche Teil kommt in den Chat und in die App.

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort. Keine Schlüssel im Chat (nur öffentliche). Nichts an echten Tresoren ohne Kopie und Rückweg. Tresor-Paket und
Scanner-Baustein nur in WPP ändern, Bedien-Bausteine nur in PB. Kopien (`apps/`, `assets/wfpdf/`, `upstream/`, Modul 03, `assets/pb-icons.svg`) nie von Hand.
Keine Emojis. Jeder Abschluss mit Stundennachweis und Forschungseintrag. Termux als ein Block, Passwortabfragen als eigene Zeile.

## Startauftrag zum Einfügen

```
Pro-Umbau 6. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-6.md und BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-5.md,
docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md, Forschung § 18–19.
Erst: BookLedgerPro "Mit Workflow PDF scannen" auf den Intent de.familyprojekt.workflowpdf.pro.SCANNEN umstellen, Basic nachziehen.
Dann nach Rückfrage: Private Brain V3, WPP-Windows Tresorordner. Ein PR je App, bei grüner CI selbst mergen.
Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```

Für Meine Familienakte gibt es einen eigenen Startauftrag (im Chat vom 2026-10-29 ausgegeben, gleicher Inhalt wie der Abschnitt oben).
