> **Überholt (2026-10-31, 13:40):** A2 ist in einer anderen Sitzung gebaut (BLP #436), die Inventur A3 steht in `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A2.md`. **Weiter mit `BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md`.** Forschung nur noch in Kimhub.

# Sitzungsplan Pro-Umbau 14 ab A2 (Stand 2026-10-31 nach Sitzung A)

Grundlage: `BRIEF_SITZUNG_PRO-UMBAU-14.md` (Plan A–E, Vorschläge für weitere Apps) und `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A.md`.
Klaus' Antworten (2026-10-31): 1 Beitritts-Zettel · 2 Familienakte ins Tresor-Fach „Familienakte“ · 3 Briefkopf-Quelle Workflow-PDF · 4 Betriebs-Themen:
Kunden, Lieferanten, Versicherungen, Steuern & Finanzamt, Personal, Bank & Kredite, Fahrzeuge, Miete & Räume, Verträge, Behörden, Werbung.

## Sitzung A2 — Netz liest den ganzen Brief (Klaus: „Herr Meier am Ende wird nicht gefunden“)
Befund (Abschluss 14A, Abschnitt „Forschung“ Punkt 5): BLP-Netz-Korpus = 1 Eintrag je Beleg, ≤ 1500 Zeichen Text, ≤ 300 Belege, nur beim Einschalten gebaut.
- Je Beleg alle Abschnitte (Zerlegung wie `belegsuche.js`) als Einträge mit derselben `anchorId`; Briefende/Gruß/Unterschrift immer dabei;
  neueste zuerst; Korpus bei neuen/geänderten Belegen von selbst neu (entprellt). Antwortzeile bleibt ≤ 200 Zeichen (Kanon), Ausschnitt um den Fund.
- Dasselbe in Private Brain Pro und Workflow PDF Pro nachsehen und angleichen (gemeinsamer Baustein?), V3.
- Probe: erfundener langer Brief, „Mit freundlichen Grüßen … Meier“ nur am Ende, Frage „Brief von Herrn Meier“ → Treffer; neuer Beleg nach dem
  Einschalten → Treffer ohne Aus/An. Gegenprobe.

## Sitzung A3 — Tresor-Speicherort und „alles hinein“ (Klaus 2026-10-31)
- Inventur je App (BLP, PB, WPP, V3, Familienakte): was liegt heute im Tresorordner, was nur im App-Speicher; Liste an Klaus mit Vorschlag.
- Ort wählen: Android schon frei (Ordnerwahl: SD-Karte, Tablet, USB); Windows prüfen (Ordner-Dialog? Laufwerk/USB-Stick?) und sichtbar machen
  („Tresor & Ablage“ zeigt den ganzen Pfad, „Ort ändern“ mit Umzug ohne Datenverlust).
- V3 in den Tresorordner aufnehmen (Fach wie PB? Klaus fragen) — Paket `de.familyprojekt.tresor` aus WPP, nie von Hand.

## Danach wie geplant
Sitzung B (Familienakte: Aktualisieren oben, Mycel, Chefcode Fassung 6, „Überall suchen“, **Fach „Familienakte“** im Tresorordner) → C (Hinweis im
Sage-Protokoll) → D (Briefkopf + Thema, Quelle Workflow-PDF, Themenlisten privat/Betrieb wie oben) → E (Geschenk-Seite).

## Was nicht passieren darf
Nichts veröffentlichen ohne Klaus' Wort (vorher Releases lesen, Version/Build erhöhen). Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat.
Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern (Bedienung/Chefcode: Private Brain Pro; Tresor/Scanner: WPP; Briefkopf: Workflow-PDF).
Keine Emojis. Kein Force-Push. Gegenprobe erst ohne Sabotage grün fahren (Lehre Abschluss 14A, Forschung Punkt 3). Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 14 ab A2: Netz liest den ganzen Brief (Herr Meier am Ende), Tresor-Speicherort und „alles hinein“, dann B Familienakte, C Sage-Hinweis, D Briefkopf, E Geschenk-Seite.
Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Privat-Brain-Pro-V3, Workflow-PDF-Pro, Workflow-PDF, Meine-Familienakte, Sage-Protokol, Mein-WorkFloh (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14B.md, BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A.md, Abschluss 14A (Forschung), BRIEF_SITZUNG_PRO-UMBAU-14.md (Plan B–E).
Meine Antworten stehen im Brief (Beitritts-Zettel, Familienakte eigenes Fach, Briefkopf in Workflow-PDF, Betriebs-Themen nach Vorschlag).
Nichts veröffentlichen ohne mein Wort; vorher Releases lesen, Version und Buildnummer erhöhen. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen. Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Startauftrag.
```
