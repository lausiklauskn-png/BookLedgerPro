# Nachfolge-Brief 2026-10-26 — Bau starten: Design-Grundlage + Privat

**Für die nächste Sitzung (Bau).** Zuerst lesen: `CLAUDE.md` → `docs/PULS.md` → dieser Brief →
`docs/design/SAMMLUNG-DESIGN-2026-10-26.md` (verbindliche Entscheidungen von Klaus) →
`docs/design/ELSTER-ERIC-RECHERCHE-2026-10-26.md` (erst für Schritt 5 nötig).

## Auftrag (Reihenfolge von Klaus, nicht umstellen)
**Privat zuerst.** Unternehmer-Modi erst, wenn Privat funktioniert. Jeder Schritt eigener PR.

1. **Design-Grundlage** (Sammlung A1–A5, B, C):
   - Themen Farbe × Hell/Dunkel (Tabelle A4), Startwert wie Private Brain Pro, letzte Wahl merken.
     Quelle der Farben: `Privat-Brain-Pro/native/design-tokens.css`; Nachtpetrol = heutiges `[data-theme=dark]`
     in `assets/tokens.css`, Hauptknopf `#0f766e` + Weiß. Nachtgraphit neu ableiten (Kontrast messen).
   - Strichsymbole: Satz aus `Privat-Brain-Pro/docs/design/umbau-2026-10-24/design-kit/icons.svg` kopieren
     (nicht abwandeln), BLP-Fachsymbole im selben Stil ergänzen. **3D-Bilder bleiben.**
   - Flache Knöpfe, Vollbild (`--maxw` weg), Seitenleiste einklappbar + Teilbild automatisch, Handy ☰-Menü.
   - **Schrift-Regel A5** mit Abnahme: Fotos bei 320/390/768/1024/1366 px + 200 % Schrift, automatische
     Überlauf-Prüfung (Playwright/Chromium ist in der Umgebung vorhanden).
   - Modus-Schalter neu: Privat · Kleinunternehmer · Selbstständig · Berater (ersetzt Einfach/Profi/Berater).
     Privat blendet alles Unternehmerische aus (F1–F3), Daten bleiben.
   - Nebenbei beheben: Claude/Anthropic-Texte in `src/ui/i18n.js`, Shamir-Knopf „Speichern".
2. **Workflow-PDF-Einbindung (wichtigster Funktionspunkt):** Erst in `Workflow-PDF-Pro` nachsehen, welche
   Übergabe (Teilen/Intent, Dateiformat, mitgelieferter OCR-Text) es heute gibt. **Plan mit 2–4 Varianten an
   Klaus, Antwort abwarten**, dann bauen. Eigene Scans: keine Prüfung; Dateien von außen: Prüfung.
3. **Haushaltsbuch** (Sammlung H): Beleg-Eingang, automatisch eintragen (KI-Autonomie-Schalter beachten,
   EU-KI nur nach Bestätigung), Monatsübersicht.
4. **Steuer-Zuordnung Privat** (Sammlung F „Privat im Detail"): Anlagen N, R, V, KAP, SO, Vorsorge,
   Sonderausgaben, agB, § 35a; Jahresübersicht. Fachlich prüfen, keine Steuerberatung behaupten.
5. **ELSTER** erst nach Klaus' Entscheidung D14 (siehe Abschlussbrief).

## Regeln, die hier leicht kaputtgehen
- Build-frei, keine CDNs; **DB-Suffix `bookledgerpro` nie ändern**; `CACHE_VERSION` in `sw.js` bei jeder
  Shell-Änderung erhöhen; Design additiv (kein `cursor:none`).
- Tests `node tests/run.mjs` (Stand 134/134) vor jedem Push; DOM-Teile ehrlich als „im Browser geprüft
  (Chromium der Sitzung)" vs. „am Gerät ungeprüft" kennzeichnen.
- Freibrief: mergen, wenn sinnvoll und CI grün. PULS + SESSIONS am Ende fortschreiben.
