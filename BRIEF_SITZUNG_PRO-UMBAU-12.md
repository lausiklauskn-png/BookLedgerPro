# Brief für die nächste Sitzung: Pro-Umbau 12 — „Überall suchen“ in Workflow PDF Pro und Private Brain Pro, Probe über drei Orte (geschrieben 2026-10-30)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-11.md`, Forschung § 26 (`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`), `docs/TRESORORDNER.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`.

## Ausgangslage

BookLedgerPro **0.1.6** (Umbau 11): „Überall suchen“ (App, Angebotsplaner/Bedarfsanalyse, Tresorordner, Netz), „Passendes Konto finden“, Mycel als einfacher
Kasten mit „Anderen antworten“ (nur Titel · Datum · Betrag), Siegel unten in der Leiste, Kanon-Fenster im Design der App (`assets/sbkim-blp.css`).
Klaus' Ja/Nein-Liste: https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk (Runde 2 r1–r7 war unbeantwortet; Entscheidungen im Abschluss 11 begründet).

## Aufgaben (in dieser Reihenfolge)

1. **Klaus' Gegenprobe 0.1.6 und Befunde des Windows-Testers** aufnehmen (Testanleitung `docs/WINDOWS-TESTANLEITUNG.md` nennt die Drei-Orte-Probe).
2. **„Überall suchen“ in Workflow PDF Pro und Private Brain Pro** (Klaus m7, „gemeinsamer Baustein“): dieselbe Liste mit Herkunft; auf einem Gerät über
   den Tresorordner (Fächer aller Pro-Apps), sonst über das Mycel. Vorschlag: reine Logik `ueberall.js` aus BLP als gemeinsamer Baustein in Private Brain
   Pro pflegen (wie `pro-bedienung.*`), Kopie per Nachzieh-Werkzeug, Pin. Design je App nach Leitfaden.
3. **Umbau 9/10 in WPP und PB** (textZoom, ⓘ je Kasten, kein Titel oben, Version im Kopf) — aus Brief 10, weiter offen.
4. **Chefcode (Klaus m3-Notiz, r3):** Inhalt nur zwischen Arbeitsplätzen mit demselben Code. Grundlage: Modul 23 kennt ein eigenes Netz mit Netz-Code
   (`setNetwork`, verschlüsselte Zettel) — „Chefcode“ = eigenes Netz + Antworten mit Fundstelle statt nur Titel. Erst als kurzer Plan mit Klaus.
5. **Probe über drei Orte** (Klaus' Rechner, der des Bekannten, ein dritter): kleines eigenes Netz, Abhakliste im Abschluss.

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort (vorher `releases` lesen, Version + Buildnummer erhöhen). Keine Schlüssel oder Passwörter in Dateien oder im Chat
(Repo öffentlich). Nichts an echten Tresoren ohne Kopie und Rückweg. Kanon-Module (Sage) byte-1:1 — Aussehen nur über `sbkim-blp.css`. Tresor-Paket/Scanner nur
in WPP, Bedien-Bausteine nur in PB, Kopien nie von Hand. Keine Emojis. Kein Force-Push. CI sparsam. Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 12: „Überall suchen“ in Workflow PDF Pro und Private Brain Pro. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-12.md und BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-11.md, Forschung § 26, docs/TRESORORDNER.md.
Erst Klaus' Gegenprobe 0.1.6 und Befunde des Windows-Testers aufnehmen, dann „Überall suchen“ als gemeinsamer Baustein (Quelle Private Brain Pro) in WPP und PB, dann Umbau 9/10 dort.
Chefcode nur als Plan mit Klaus. Nichts veröffentlichen ohne Klaus' Wort; vorher releases lesen, Version + Buildnummer erhöhen.
Keine Schlüssel in Dateien oder im Chat. Kanon-Module byte-1:1. Ein PR je App, bei grüner CI selbst mergen. Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Startauftrag.
```
