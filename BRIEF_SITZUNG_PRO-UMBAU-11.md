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

## Stand der Ja/Nein-Liste (gelesen 2026-10-30, 02:10)

**Runde 1 (Ja):** m1 Seite „SBKIM-Suche“ weg · m2 Kontosuche als Knopf in „Neue Buchung“/Konten · m3 BLP bietet dem Netz Belege an (Klaus: kleiner Betrieb
braucht Inhaltssuche — „Chefcode“ nur für Vertraute?) · m4 „Überall suchen“ · m5 auf einem Gerät über den Tresorordner · m7 gleiche Suche in allen drei Pro-Apps,
Mycel/SBKIM im Design der App, **Siegel muss rein** (notfalls unten neben dem Impressum) · m8 Mycel-Seite als einfacher Kasten · m10 Kanon-Modul 22 statt Nachbau —
Klaus fragt „Was ist besser?“, **Design an BLP angepasst, auch Siegel und schwebendes Fenster, ausdrücklich verlangt** · m11 Alltagssprache · m12 KI-Prüfung nur Schalter.
**Ohne Ja/Nein, nur Notiz:** m0 Erklärung „viel kürzer, Schlagwörter, z. B. ‚Dokumente finden in allen deinen verbundenen Programmen‘, Ausführliches hinter ‚Mehr
dazu‘“ · m6 „sollte das nicht für alle da sein und jeder wählt selbst?“ · m9 unsicher: kleiner Hinweis „läuft mit SBKIM“, besser sichtbares Siegel als Beleg der
Integration · frei: **Test über drei Orte** (Klaus' Rechner, der eines Bekannten, ein dritter) — „bald in der Phase, es bei jemandem einzubauen“.

**Runde 2 (meine Vorschläge zu den Notizen, r1–r7) steht oben auf derselben Seite und war beim Schreiben noch unbeantwortet** — zuerst lesen
(`ArtifactData query`, Sammlung `antworten`, Schlüssel r1–r7). r3 (Chefcode) und r4 (Kanon-Modul mit BLP-Design) nur nach einem kurzen Plan mit Klaus.
Ohne Antwort in Runde 2: mit den eindeutigen Ja aus Runde 1 beginnen (m1, m2, m8, m11, m12, m5 Tresorordner-Suche, kurze Erklärung nach m0).

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
