# Abschluss Pro-Umbau 14 A3 Rest, Teil „Parallel“: C Sage-Hinweis, Workflow-PDF im Netz, D Briefkopf (2026-10-31)

Diese Sitzung lief **parallel** zur Sitzung, die den Rest von A3 macht (Umzug, Windows-Tresorordner, V3/Familienakte-Einzug). Klaus hat
mitten in der Arbeit aufgeteilt: diese Sitzung macht Workflow-PDF (PWA) „Im Netz antworten“, Sage-Protokol Sitzung C und D Briefkopf
(Quelle Workflow-PDF). Der Umzug-Code, den diese Sitzung schon angefangen hatte, ist verworfen worden (er steht in WPP #50 der anderen Sitzung).

## Was getan ist

| Was | PR | Stand |
|---|---|---|
| Befunde aus A3 Teil 1 nach Kimhub (§ 33) | Kimhub #418 | gemergt |
| BLP „Tresor-Paket und Bausteine Fassung 7“ geprüft und gemergt | BLP #440 | gemergt |
| PB „Bausteine Fassung 7“ geprüft und gemergt | PB #121 | gemergt |
| Basic nachgezogen — doppelt mit der anderen Sitzung (#35), deshalb geschlossen | Basic #34 | geschlossen |
| **C:** Sage-Hinweis „Netzübergreifende Suche (Antworten aus einer App) und Chefcode“ in `docs/INTERFACES.md` (Modul 23) und `docs/NETZWEIT.md` § 3d | Sage #1160 | gemergt |
| Workflow-PDF (PWA) **antwortet im Netz** wie Workflow PDF Pro (`assets/netz.js`, ab Werk aus; öffentlich nur Dateiname, im eigenen Netz mit Ausschnitt) | Workflow-PDF #138 | gemergt |
| **D:** Briefkopf lesen und danach sortieren (`assets/briefkopf.js` Quelle, `assets/briefkopf-ansicht.js`), Version 1.1.6 | Workflow-PDF (dieser Zweig) | siehe PR |

### D Briefkopf — was es kann
- Briefdatum, Absender, Empfänger (Abgleich mit Familiennamen), Nummern (Kunden-, Rechnungs-, Auftrags-, Vertrags-, Versicherungsnummer,
  Aktenzeichen/Steuernummer, Unser/Ihr Zeichen), Betreff, Wichtigkeit 0–3, Thema (18 Lebensbereiche der Familienakte). Jede Angabe mit Fundstelle,
  unsicher bleibt leer.
- Bibliothek: Sortieren „Briefdatum, Absender“ (Briefdatum, sonst Eingang → Absender → Kundennummer → Wichtigkeit), Thema als Filter, Zeile an
  der Karte, „Briefkopf“ zum Ändern; von Hand geändert bleibt.
- Proben: `tests/briefkopf.mjs` 56 grün (Teil A erfundene Briefe, Teil B echter Browser) · Gegenprobe 14/14 gefangen. Beim Bau drei blinde Wächter
  geschärft, ein echter Fund behoben (Postfach als Absender).

## Was NICHT getan ist (offen)
- D in den anderen Apps: Workflow PDF Pro (Kern über `upstream/` nachziehen), Mein WorkFloh/Tomys (Anhänge), BLP/Basic (Belege), PB (an die
  vorhandenen Kategorien anschließen), Familienakte. Reihenfolge laut Plan.
- **Frage an Klaus:** Themenliste für Betriebe (BLP, WorkFloh) — der Baustein nimmt eine eigene Liste an, gebaut ist nur die private.
- B Familienakte und E Geschenk-Seite: nicht in dieser Sitzung (Aufteilung).
- Texterkennung für Scans ohne Textebene liefert dem Briefkopf noch keine Zeilen.

## Nicht geprüft
Kein Tablet, kein echtes Relais, kein echtes Sprachmodell (Netz-Probe mit gestelltem Embedder), nur erfundene Briefe. Nichts veröffentlicht.

## Stundennachweis
Erste Spur 15:26 (Uhr des Behälters, erster Befehl), letzte ≈ 16:35 (Push/PR Briefkopf). Ein Block ≈ 1.2 h; darin CI-Wartezeit ≈ 0.3 h und zwei
Hilfsagenten parallel (Netz 22 min, Sage 17 min). Obergrenze 1.2 h. Zeile in `docs/STUNDENNACHWEIS.md`. Klaus' eigene Angabe geht vor.

## Forschung
In Kimhub `forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md` § 34 (zwei Sitzungen am selben Auftrag; blinde Wächter beim
Briefkopf). Hier keine Forschungseinträge.

## Startauftrag zum Einfügen

```
Pro-Umbau 14 D weiter: Briefkopf in die anderen Apps nachziehen. Quelle ist Workflow-PDF assets/briefkopf.js (byte-1:1 kopieren, nie von Hand ändern). Reihenfolge: Workflow PDF Pro (Kern über upstream/ nachziehen), Mein WorkFloh (Anhänge, parallel zu Tomys), BookLedgerPro/Basic (Belege), Private Brain Pro (an die vorhandenen Kategorien anschließen, nicht doppelt), Familienakte. Vorher klären: Themenliste für Betriebe (BLP, WorkFloh).
Repos: Workflow-PDF, Workflow-PDF-Pro, Mein-WorkFloh, BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Meine-Familienakte, Kimhub (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, Workflow-PDF CLAUDE.md Abschnitt „Briefkopf lesen“, BookLedgerPro/BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14-C-D.md und den Abschluss der Parallel-Sitzung (A3 Rest).
Vorher prüfen, ob eine andere Sitzung in denselben Repos arbeitet (offene PRs, Zweige von heute) — nicht doppelt bauen.
Nichts veröffentlichen ohne mein Wort. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern. Keine Versionssprünge der Datenbank von außen.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen. Forschung nur in Kimhub. Abschluss mit Stundennachweis, Brief mit Startauftrag.
```
