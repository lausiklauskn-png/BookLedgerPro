# Abschluss 2026-11-09: Planung Neuausrichtung BookLedgerPro

**Nur Planung, nichts gebaut, nichts veröffentlicht.** Ergebnis: `docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md`
(PR #455, Entwurf, Branch `claude/bookledger-pro-improvements-hgn8je`, CI grün). Verweise: `docs/PULS.md`, `ROADMAP.md` Phase 8.

## Was geklärt wurde (Gespräch mit Klaus)

- **Ausrichtung:** Geld und Steuer für kleine Betriebe (Tomy, Alinas Moderaum, Perfect Skin, 19 % USt) und Familien
  (Haushaltsbuch, Anlage N). Keine Konkurrenz zu Profi-Werkzeugen. Klaus: „Mit dem Rest wäre ich einverstanden.“
- **Bleibt:** Kassenbuch, Shop-Buchung (Empfänger aus Alinas Moderaum), Rechnungen, Belege, USt/EÜR, DATEV.
  **Nachkalkulation** → Calculate/Needs. Lohn, Bilanz, Kostenstellen → raus bzw. „Profi“.
- **Grenze Familienakte:** Dokumente/Verträge/Erledigen dort, Geld/Steuer hier, ein Tresor. Brücke = **Geldkarte**.
- **Einfachheits-Regel:** ein Foto, sonst nichts (Workflow PDF erkennt, Original + PDF gespeichert, Familienakte legt ab,
  BookLedgerPro bucht ins Haushaltsbuch, Rückmeldung als eine Zeile). Ziel 0 Tipps nach dem Foto.
- **„Erledigt“ in der Familienakte bucht automatisch** (Zahlart bar → Kassenbuch, sonst Bank); Kassenbons sind sofort
  bezahlt; Einnahmen (Gehalt, Rente) auf demselben Weg; Startseite „Was bleibt übrig?“ mit Vorschau bis Monatsende.
- **Kasse Alinas Moderaum:** Befund (Code gelesen): Kasse schreibt nur in die Warenwirtschaft, Übergabe nur als
  Zeitraum-Summe und an die Web-Fassung statt die App; keine TSE, Bon-Zähler löschbar, Reset löscht Bewegungen.
  **Entschieden: Bargeld ja, Weg (c) offene Ladenkasse** – „Bar“ raus aus der Kasse, Tagesabschluss abends in
  BookLedgerPro (per Sprache/Foto), Quittung auf Wunsch von Hand. Mit dem Steuerberater bestätigen.
- **Ohne Tresor-Speicher:** heute holt BookLedgerPro nach (nichts verloren), aber ohne Zähler/Postausgang. Regel:
  Postausgang in allen Pro-Apps. **Entschieden: erst USB-Stick zum Umstecken, danach Abgleich im Mycel-Netz** (Schritt 9).
- **ELSTER** über die Windows-Fassung (Android legt Versandauftrag in den Tresor), **Regel-Paket je Jahr** statt KI-Raten,
  **Bank** in Stufen (GiroCode, SEPA-Datei, FinTS später), **Fristen**.

## Noch offen (Ja/Nein-Liste im Bauplan, Abschnitt 8)

J1/J2 im Gespräch zugestimmt (Ausrichtung, Geldkarte), aber nicht als Liste abgehakt; J3 (mit Ausmisten beginnen),
J4 (Regel-Paket), J5 (ELSTER über Windows), J6 (Bank in Stufen) offen. F3 (mehrere Betriebe auf einem Gerät),
F4 (ELSTER-Herstellerregistrierung beantragen), F5 (Private Brain Pro) offen.

## Ehrlich: was nicht geprüft ist

Familienakte und Alis-Moderaum nur gelesen, nicht ausgeführt. Postausgang-Verhalten von Familienakte und Workflow PDF Pro
nicht geprüft. Rechtliche Aussagen (TSE, offene Ladenkasse, Kleinbetragsrechnung) sind Einschätzungen, kein Rat.
Preise der Konkurrenz aus dem Gedächtnis.

## Stundennachweis

- Erste Spur im Repo: 2026-11-09 13:41 UTC (erster Commit); das Gespräch begann vorher (Analyse ohne Commit, nicht gemessen).
- Letzte Spur: 2026-11-09 ≈ 14:10 UTC (dieser Abschluss).
- Blöcke: ein zusammenhängender Block Planung/Gespräch; aktive Zeit nicht gemessen. Obergrenze ≈ 1 h ab erster Spur
  zuzüglich der Analysezeit davor. Klaus' eigene Angabe geht vor.

## Nächste Sitzung

`BRIEF_SITZUNG_2026-11-09_NACH-PLANUNG.md`
