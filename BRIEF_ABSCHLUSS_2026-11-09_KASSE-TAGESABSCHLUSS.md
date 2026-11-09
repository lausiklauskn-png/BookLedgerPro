# Abschluss 2026-11-09: Kasse & Tagesabschluss (Weg c, offene Ladenkasse)

**Gebaut, nicht veröffentlicht.** Zwei Entwurfs-PRs: BookLedgerPro (Branch `ccr-928a2344-tri4zq`) und Alis-Moderaum #84;
BookLedger Basic nachgezogen (eigener PR).

## Klaus' Antworten (2026-11-09)

- **F3** ja, mehrere Betriebe auf einem Gerät → „mehrere Betriebe“ bleibt.
- **F4** ELSTER-Herstellerregistrierung später.
- **F5** nur Fragen ans Geld; Arbeitstitel „BLP-Fragen“, **nur der Chef fragt** (Klaus unsicher, ob das besser ist → Arbeitstitel).
- **J3–J6:** Klaus fragte „Was wäre deine Entscheidung?“. Empfehlung: alle vier Ja (J5 zuerst nur Ausfüllhilfe, weil F4 später).
  **Sein Ja steht aus** – im Bauplan Abschnitt 8 vermerkt.

## Was gebaut ist

**Alis-Moderaum (PR #84):** Zahlart „Bar“ raus; „🧺 Bar · nur Bestand“ mit „Bargeld in die Kassenlade, abends zählen“
(Bewegung „Barverkauf (Kassenlade)“ ohne Preis/Zahlart, kein Bon, zählt nicht in die Umsatz-Übergabe); Karte vorgewählt;
„Alle Daten zurücksetzen“ im Echtbetrieb gesperrt; Cache v36. Probe `tests/smoke_kasse_lade.mjs` 22 grün, Gegenprobe 5/5 gefangen.

**BookLedgerPro – „Kasse & Shop“** (früher „Kassenbuch“, Route bleibt `kassenbuch`):
- **Tagesabschluss** (`src/domain/tagesabschluss.js` rein, `tagesabschluss-store.js`, `src/ui/views/tagesabschluss.js`):
  Anfangsbestand aus dem Kassenbuch (Vortag), gezählter Endbestand, Ausgaben (mit/ohne Vorsteuer), Bankeinzahlung,
  Privatentnahme/-einlage → Tageseinnahme = End − Anfang − schon gebuchte Kassenbewegungen + Ausgaben + Bank + Entnahme − Einlage;
  USt 19 % heraus; Fehlbetrag wird gemeldet, nie gebucht. Festschreiben: erst alles prüfen, dann Foto als Beleg, je Vorgang eine
  festgeschriebene Buchung (Kasse 1000 ↔ 8400/1776, 4980(+1576), 1200, 1800, 1890), Abschluss verschlüsselt, einer je Tag.
- **Sprache:** Feld „Oder sagen, was war“ mit Mikrofon; „Satz übernehmen“ füllt die Felder, Unklares wird gezeigt, nicht geraten.
- **Fehlende Tage** zwischen erstem Abschluss und gestern (Sonntag frei, „zu“ je Tag, gemerkt im Gerät).
- **Quittungsvorlage** (Kleinbetragsrechnung § 33 UStDV): ausgefüllt oder drei leere für den Quittungsblock, Name/Anschrift aus
  dem Firmenprofil, über 250 € Hinweis auf vollständige Rechnung; gedruckt wird nur das Blatt.
- Weg zur Shop-Übernahme als Kasten auf derselben Seite. `sw.js` v291.

## Proben (wahrheitsgemäß)

- `node tests/run.mjs` **2685 bestanden · 0 fehlgeschlagen** (neu Abschnitt „Tagesabschluss“, 30 Zeilen).
- `tests/smoke_tagesabschluss.mjs` **30 grün** (echter Tresor, Festschreiben mit Hash-Kette, Foto-Beleg, Verschlüsselung, Lücken,
  Quittung, 360 px). Gegenprobe in Wegwerf-Kopien: 6 Sabotagen (Bank vergessen, nicht festgeschrieben, Foto fehlt, Satz kennt Bank
  nicht, Druck ohne Quittungsklasse, zweiter Abschluss erlaubt) – **6/6 gefangen**.
- `smoke_design` 92 · `smoke_umbau4` 23 grün. `smoke_ohne_web` 26/2 ROT – **auf main genauso** (Tresorordner-Übernahme, unberührt).

## Grenzen / nicht geprüft

- Nicht am Tablet; echte Spracherkennung und Kamera nicht gemessen (Satz getippt, Foto als Datei).
- Korrektur eines festgeschriebenen Abschlusses nur über Storno der Buchungen; ein eigener „Abschluss stornieren“-Knopf fehlt.
- Ein nachträglicher Abschluss für einen früheren Tag ändert den Anfangsbestand späterer Tage nicht rückwirkend (die sind fest).
- Ruhetag nur Sonntag fest; „zu“-Tage liegen im localStorage des Geräts, nicht im Tresor.
- Die Tageseinnahme wird mit einem Satz (19 % oder 7 %) gerechnet; gemischte Sätze an einem Tag nicht.
- Übergabe Fassung 2 aus Alis-Moderaum (Tagessummen Karte/Online, über den Tresor) nicht gebaut.
- Rechtliche Einschätzung (offene Ladenkasse, Zählprotokoll, Kleinbetragsrechnung): mit dem Steuerberater bestätigen.

## Stundennachweis

- Erste Spur: 2026-11-09 ≈ 14:00 UTC (Sitzungsbeginn, aus Dateizeiten geschätzt); letzte Spur ≈ 14:45 UTC (dieser Abschluss).
- Ein Block, Klaus antwortete zwischendurch auf die Fragen. Obergrenze ≈ 45 min; aktive Zeit nicht gemessen. Klaus' Angabe geht vor.

## Nächste Sitzung

`BRIEF_SITZUNG_2026-11-09_NACH-KASSE.md`
