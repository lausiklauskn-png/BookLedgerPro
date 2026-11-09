# Brief für die nächste Sitzung: Pro-Umbau 11 — Mycel/SBKIM nach Klaus' Ja/Nein-Liste (geschrieben 2026-10-30)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-10.md`, Forschung § 25 (Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md), `docs/TRESORORDNER.md`,
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

## Klaus' Auftrag für diese Sitzung (2026-10-30, nach Runde 1) — **autonom arbeiten**

Klaus: „Nach dem Start der neuen Sitzung soll die Sitzung autonom arbeiten, ohne dass ich noch irgendetwas ankreuzen oder anhaken muss. Wenn es Unklarheiten
gibt, soll sie selber die Fragen beantworten — nach dem, was am sinnvollsten ist für diese Aufgabe … Das, was jetzt gemacht werden kann, wird gemacht, ohne
weiteren Kommentar von mir, sodass ich am Ende der Sitzung eine fertige BookLedgerPro-Neuversion von PWA, APK und Windows habe. Denn ich möchte gern die
Windows-Version abgleichen und testen, ob das funktioniert.“

Das heißt:
- **Keine Rückfragen, keine Abhak-Listen.** Runde 2 (r1–r7) nicht abwarten: wo Klaus nichts angekreuzt hat, selbst die sinnvollste Lösung wählen und im
  Abschluss begründen. Die Ja aus Runde 1 und seine Notizen sind die Richtschnur.
- **Selbst klären, wofür SBKIM und das Mycel gebaut wurden** (Sage-Protokol lesend klonen: `docs/PAPER_NUTZEN_UND_INTEGRATION.md`, `WARUM_SBKIM_STATT_KI.md`,
  `HYBRID-MATCH-KONZEPT.md`, `PLAN_MYCEL_SCHICHTEN.md`, Module 22/23) und daraus ableiten, wie es in den Apps am nützlichsten ist.
- **Die Apps sollen sich miteinander verbinden können.** Gemeint sind die Apps, die schon in der Menüleiste von BookLedgerPro stehen (eingebettet: Angebotsplaner
  = Workflow Calculate, Bedarfsanalyse = Workflow Needs; dazu die Pro-Apps Workflow PDF Pro und Private Brain Pro über „In ‹App› öffnen“/Tresorordner). Sie
  werden ins Mycel aufgenommen und können über das Sage-Protokoll miteinander arbeiten.
- **Die Suche („Überall suchen“) umfasst alle diese Apps** — so weit es mit dem Vorhandenen geht (eigene Belege, Tresorordner-Fächer der Pro-Apps, eingebettete
  Apps, auf Wunsch das Netz). Die spätere automatische Aufnahme weiterer Apps aus ihrem eigenen Werkzeug-Vorrat (z. B. über einen KI-Agenten) ist **nicht** Teil
  dieser Sitzung — nur als Plan im Abschluss festhalten.
- **Vorrang: das Vorhandene einbauen.** Was heute machbar ist, wird gebaut; Größeres (Chefcode/Inhalt im Netz zwischen Arbeitsplätzen) nur so weit, wie es sicher
  fertig wird, sonst als benannter nächster Schritt.
- **Klaus' feste Vorgaben aus Runde 1 gelten:** Design wie BookLedgerPro auch für Siegel und schwebendes Fenster; Siegel sichtbar (notfalls unten neben dem
  Impressum); kurze Erklärzeile mit „Mehr dazu“; Alltagssprache; KI-Prüfung nur als Schalter; Netz für alle, jeder schaltet es selbst ein.
- **Am Ende veröffentlichen (Klaus' Wort liegt damit vor):** neue Version (0.1.6 o. höher, vorher `releases` lesen, Buildnummer erhöhen) — Android-APK
  (`android-release.yml`), Windows (`windows-release.yml`, „ja“), Basic/PWA über Pages nachziehen; Download-Seite https://claude.ai/artifact/MFaYdbzH9MreBQSC5Mkr1H
  aktualisieren; Windows-Testanleitung anpassen. Alle Regeln unten („Was nicht passieren darf“) gelten weiter.
- **Ganz zum Schluss: Gesamtpaket als eine HTML-Seite** (Klaus 2026-10-30: „ein Paket … damit wir diese alle einmal zusammen runterladen und auf dem Rechner
  installieren können“). Die Download-Seite https://claude.ai/artifact/MFaYdbzH9MreBQSC5Mkr1H wird zum Gesamtpaket: je App **die aktuelle Version in allen
  gebauten Varianten** (Android-APK, Windows-Setup, PWA/Browser), jeweils mit Größe und SHA-256, wo vorhanden:
  BookLedgerPro (Android, Windows) · BookLedger Basic (PWA) · Workflow PDF (PWA) · Workflow PDF Pro (Android, Windows) · Private Brain Pro (Android, Windows;
  dazu die PWA/V3, falls aktuell) · Workflow Calculate / Angebotsplaner und Workflow Needs / Bedarfsanalyse (PWAs; Quelle laut `apps/HERKUNFT.json`) ·
  Projekt-Reiniger (alle Varianten: Basic/Pro, Android, Windows, Browser) · Meine Familienakte (aktuelle Version, auch wenn Klaus' Abgleich noch aussteht).
  Vor dem Eintragen jeden Stand an der Quelle lesen (`releases` der Repos bzw. Update-Server/Pages), nichts aus dem Gedächtnis; was nicht prüfbar ist (z. B. Repo
  nicht erreichbar), als „nicht geprüft“ kennzeichnen. Oben eine kurze Reihenfolge zum Installieren (Android über die vorhandene App, Windows-SmartScreen,
  PWA „Installieren“); keine Schlüssel, keine Daten.

## Reihenfolge

1. Antworten aus der Liste lesen (falls Runde 2 inzwischen beantwortet ist, gilt sie). Offene Punkte **selbst entscheiden**, nicht fragen (Auftrag oben).
2. Befunde des Windows-Testers (falls gemeldet) und Klaus' Gegenprobe 0.1.5 aufnehmen.
3. Danach wie in Brief 10 Punkt 4 (nach Rückfrage): Umbau 9/10 in Workflow PDF Pro und Private Brain Pro (textZoom, ⓘ je Kasten, kein Titel oben, Version im Kopf).

## Was nicht passieren darf

Veröffentlichen am Ende dieser Sitzung ist freigegeben (Auftrag oben), sonst nichts; vor jeder Veröffentlichung `releases` lesen, Version + Buildnummer erhöhen. Keine Schlüssel oder Passwörter in
Dateien oder im Chat (Repo öffentlich). Nichts an echten Tresoren ohne Kopie und Rückweg. Kanon-Module (Sage) byte-1:1, Tresor-Paket/Scanner nur in WPP,
Bedien-Bausteine nur in PB, Kopien nie von Hand. Keine Emojis. Kein Force-Push. CI sparsam. Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 11: Mycel und SBKIM-Suche, autonom. Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-11.md (Abschnitt „Klaus' Auftrag … autonom arbeiten“) und BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-10.md,
Forschung § 25, docs/TRESORORDNER.md; Sage-Protokol lesend klonen. Meine Antworten: https://claude.ai/artifact/CRYeXoARoNLnHEAscXeTHk (Sammlung „antworten“).
Arbeite ohne Rückfragen: offene Punkte selbst so entscheiden, wie es für die Aufgabe am sinnvollsten ist, und im Abschluss begründen.
Ziel: die Apps aus der Menüleiste von BookLedgerPro und die Pro-Apps verbinden sich über Mycel/Sage-Protokoll, „Überall suchen“ über alle diese Apps, Siegel sichtbar, Design wie BLP.
Am Ende veröffentlichen (freigegeben): neue Version für Android (APK) und Windows, Basic/PWA nachziehen — vorher releases lesen, Version + Buildnummer erhöhen.
Zum Schluss: Gesamtpaket als eine HTML-Seite (Download-Seite) mit allen Apps in aktueller Version und allen Varianten (BLP, Basic, Workflow PDF/Pro, Private Brain, Calculate, Needs, Projekt-Reiniger, Familienakte).
BookLedgerPro ist öffentlich: keine Schlüssel in Dateien oder im Chat. Ein PR je App, bei grüner CI selbst mergen. Nichts an echten Tresoren ohne Kopie und Rückweg.
Am Ende: Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Copy-Paste-Startauftrag.
```
