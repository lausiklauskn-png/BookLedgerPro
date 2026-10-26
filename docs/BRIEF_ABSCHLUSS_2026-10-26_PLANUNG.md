# Abschlussbrief 2026-10-26 — Plansitzung Design & Privat-Modus

**Art der Sitzung:** reine Plan-/Sammelsitzung mit Klaus. **Kein App-Code geändert.**
Branch `claude/blp-design-improvements-24b1xa`, PR #345.

## Was getan
- Ist-Stand der App lokal mit Chromium/Playwright fotografiert (390 px Handy, 1366 px breit), alle 11 Ansichten
  + Einrichtung. 8 Bilder in `docs/design/ist-2026-10-26/`.
- Mit Klaus alle Design- und Funktionswünsche gesammelt und entschieden:
  **`docs/design/SAMMLUNG-DESIGN-2026-10-26.md`** (Abschnitte A–H, Fragenliste D, Reihenfolge E).
- ELSTER/ERiC/Hersteller-ID recherchiert (Forschungseintrag):
  **`docs/design/ELSTER-ERIC-RECHERCHE-2026-10-26.md`**.
- ROADMAP um Phase 7 (Umbau, Privat zuerst) ergänzt, PULS und SESSIONS fortgeschrieben,
  Nachfolge-Brief `docs/BRIEF_NACHFOLGE_2026-10-26_BAU-PRIVAT.md` geschrieben.

## Entschieden (Kurzfassung, Details in der Sammlung)
- Strichsymbole (gemeinsamer Satz mit Private Brain Pro); **3D-Bilder bleiben** (Illustrationen).
- Flache Knöpfe (sichtbar ~28–32 px, Touch ≥ 44 px), **Vollbild**, Seitenleiste einklappbar, im Teilbild
  automatisch eingeklappt, am Handy **☰-Menü**.
- **Schrift ohne Fehler** bei jeder Breite (Regel A5, mit automatischer Überlauf-Prüfung).
- **Themen = Farbe (Blau, Graphit, Petrol) × Hell/Dunkel/wie Gerät**. Dunkel: Nachtblau, *Nachtgraphit* (neu),
  **Nachtpetrol** (= heutiges BLP-Dunkel). Nachtpetrol-Hauptknopf `#0f766e` + weiße Schrift (5,5 : 1).
  Start wie Private Brain Pro, danach zuletzt gewähltes Thema merken.
- **Modus nach Nutzerart** ersetzt Einfach/Profi/Berater: **Privat**, Kleinunternehmer, Selbstständig, Berater
  (Verein später eigener Modus). Ausgeblendet = nicht gelöscht; „Alle Einstellungen zeigen".
- **Privat** = private Einkommensteuer: Arbeitnehmer, Arbeitslose, **Rentner**, **Vermieter (Anlage V)**, Ehrenamt;
  alle nötigen Anlagen zuschaltbar.
- **Haushaltsbuch** in Privat: Bon/Rechnung fotografieren, aus **Workflow PDF** (Scan + OCR dort) übernehmen,
  teilen, einfügen → automatisch eintragen → Steuerpunkte. Eigene Scans ohne Prüfung, Dateien von außen geprüft.
- **Reihenfolge:** Design-Grundlage → **Workflow-PDF-Einbindung (wichtigster Punkt)** → Haushaltsbuch →
  Steuer-Zuordnung Privat → ELSTER → erst dann Unternehmer-Modi.
- **Produktplan:** Dieses Repo wird später native App (BookLedgerPro); vorher Klon in neues Repo als PWA
  (Name offen, **eigene DB-Endung nötig**).

## ⚠ Wichtig: Abgleich mit aktuellem main
Der Arbeitszweig lag **328 Commits hinter `main`**; Fotos und Befunde der Sitzung zeigten zuerst einen Stand vom Juni.
Beim Zusammenführen bemerkt, `main` (b924a7a) eingemischt, Ist-Bilder neu aufgenommen und Abschnitt B der Sammlung
neu geprüft. Klaus' Entscheidungen bleiben gültig. Inzwischen vorhanden: ☰-Menü am Handy, Kleinunternehmer-Frage
in der Einrichtung, 1200-px-Breite, Anthropic-Texte behoben. Neu gefunden: 24 Menüpunkte ohne Gruppen, abgeschnittene
Auswahlfelder/Knöpfe, schwebende Mycel-/Siegel-Leisten über Inhalten. Modus-Schalter wirkt weiter nirgends.

## Verifikation
- `node tests/run.mjs` → **2284/0** auf dem zusammengeführten Stand (kein App-Code geändert).
- Bilder nur im Chromium der Sitzung; **kein** Tablet-/DeX-/Gerätetest.
- ELSTER-Recherche: elster.de war aus der Umgebung **nicht abrufbar**; Belege über Suchauszüge + Open-Source-Projekte,
  ausdrücklich zu bestätigen.

## Offen für Klaus
- **D14 ELSTER-Weg:** Vorschlag (a) überall zuerst Ausfüllhilfe, (b) direktes Senden in der Windows-App,
  (c) Android nur über eigenen Server = Steuerdaten verlassen das Gerät → eigene Entscheidung.
  Entwickler-Registrierung bei ELSTER früh beantragen?
- **D10** Name des PWA-Klons + DB-Endung (Vorschlag `bookledger`); Zeitpunkt.
- **D13** Modus „Verein" später?
- **D7** Bilder (Petrol-Ton) in Blau/Graphit nur ansehen, nicht ändern.
