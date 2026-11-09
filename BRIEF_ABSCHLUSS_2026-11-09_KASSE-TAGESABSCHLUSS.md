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

**Nachtrag (Klaus' Fragen am selben Tag: Bonpflicht, Quittungen, „Spende von Oma“):**
- **Quittungen werden aufbewahrt, nicht gebucht:** eine in der App gedruckte Quittung wird als PDF-Beleg abgelegt (Datensatz
  `quittung`, verschlüsselt); im Tagesabschluss gibt es „Quittungen aus dem Block“ für Fotos der Durchschläge. Beim Festschreiben
  hängen alle Quittungen des Tages an der Einnahme-Buchung. Zeile „Heute in der App ausgestellt: n, Summe“; übersteigen die Quittungen
  die Einnahme → Hinweis. Drucken zeichnet die Seite nicht neu (ein angefangener Abschluss bleibt stehen).
- **Nachfrage bei auffällig hoher Einnahme** (`einnahmeAuffaellig`): mit ≥ 3 früheren Tagen „mehr als das Doppelte des Medians und
  ≥ 100 € darüber“, sonst „über 1.000 €“ (gewählt, nicht gemessen). Dann „War Privatgeld dabei?“ → „Ja – als Privateinlage eintragen“
  oder „Nein, stimmt so“; vorher kein Festschreiben, auch der Store lehnt ab. Antwort am Abschluss vermerkt. Kleine Beträge
  (200 € an einem 350-€-Tag) fängt keine Statistik – dafür bleibt das Feld „Privat eingelegt“.

## Zweiter Teil (Klaus' Abhak-Liste, alles Ja außer K4; Freibrief „nicht mehr nachfragen“)

- **K2 Abschluss stornieren**: Knopf in „Letzte Abschlüsse“, Rückfrage im Kasten, je Buchung eine festgeschriebene Gegenbuchung
  (`store.storno`), Abschluss als `tagesabschluss-storniert` aufbewahrt, Tag wieder offen.
- **K3 Ruhetage** zum Ankreuzen (`settings.kasseRuhetage`), „zu“-Tage jetzt in den verschlüsselten Einstellungen (`kasseGeschlossen`).
- **J3 Ausmisten**: Schalter „Profi-Funktionen“ (ab Werk aus, Berater immer an, im Modus Privat nicht gezeigt): Mitarbeiter, Lohn,
  Nachkalkulation, Kostenstellen, Bilanz-Wahl (wer bilanziert, behält sie). Nichts gelöscht. 48 alte Briefe → `docs/archiv/briefe/`.
- **Brücken** (Prüfung durch zwei Helfer, Befund unten): BookLedgerPro sucht jetzt **nach Bedeutung in den Fächern der anderen Pro-Apps**
  (`src/ui/tresorFund.js`), jede Zeile sagt „in Meine Familienakte“ usw.; Funde im gemeinsamen Format lassen sich **nur zum Lesen** öffnen;
  `FAECHER` kennt alle neun Fächer. Probe `tests/smoke_tresorfund.mjs` 13, Gegenprobe 2/2.
- **J5**: monatliche Erinnerung an die ELSTER-Herstellerregistrierung (geplante Aufgabe, jeden 1., 18:47 Uhr).
- Version **0.1.10** (Android Code 11, Windows gleich), `sw.js` v292.

### Befund Brücken (Code gelesen, nicht am Gerät)
- Tresor-Paket in BookLedgerPro, Familienakte, Private Brain Pro, Workflow PDF Pro byte-gleich (Pin `066498d`), neun Fächer.
- Familienakte schrieb eine **leere Kurzfassung** ins Tresor-Verzeichnis (nur Dateiname suchbar) und **antwortet nicht im Mycel** →
  in der Familienakte nachgebaut (eigener PR dort).
- Private Brain Pro → Familienakte: über Android-Teilen geht die ganze .eml mit Anhängen (für jeden Nutzer); über den Tresor kam nur
  eine .txt → in Private Brain Pro „An Familienakte“ mit der Roh-.eml (eigener PR dort). Familienakte las Anhänge nur auf oberster
  MIME-Ebene und ohne kodierte Dateinamen → dort repariert.
- Mycel tauscht nie Dateien, nur Zeilen (Titel · Datum · Betrag, im eigenen Netz kurzer Ausschnitt) mit Trefferwert; Dateien gehen
  über den Tresorordner (Übergabefächer) oder Android-Teilen.

## Proben (wahrheitsgemäß)

- `node tests/run.mjs` **2695 bestanden · 0 fehlgeschlagen** (Abschnitt „Tagesabschluss“, 40 Zeilen).
- `tests/smoke_tagesabschluss.mjs` **43 grün** (dreimal hintereinander; Nachtrag: Quittung als Beleg, Durchschläge, Nachfrage) (echter Tresor, Festschreiben mit Hash-Kette, Foto-Beleg, Verschlüsselung, Lücken,
  Quittung, 360 px). Gegenprobe in Wegwerf-Kopien: 6 Sabotagen (Bank vergessen, nicht festgeschrieben, Foto fehlt, Satz kennt Bank
  nicht, Druck ohne Quittungsklasse, zweiter Abschluss erlaubt) – **6/6 gefangen**; Nachtrag 5 weitere (Store prüft Bestätigung nicht,
  keine Nachfrage, Quittung nicht abgelegt, nicht verknüpft, Neuzeichnen nach Quittung) – **5/5 gefangen**.
- `smoke_design` 92 · `smoke_umbau4` 23 grün. `smoke_ohne_web` 26/2 ROT – **auf main genauso** (Tresorordner-Übernahme, unberührt).

## Grenzen / nicht geprüft

- Nicht am Tablet; echte Spracherkennung und Kamera nicht gemessen (Satz getippt, Foto als Datei).
- Korrektur eines festgeschriebenen Abschlusses nur über Storno der Buchungen; ein eigener „Abschluss stornieren“-Knopf fehlt.
- Ein nachträglicher Abschluss für einen früheren Tag ändert den Anfangsbestand späterer Tage nicht rückwirkend (die sind fest).
- Ruhetag nur Sonntag fest; „zu“-Tage liegen im localStorage des Geräts, nicht im Tresor.
- Die Tageseinnahme wird mit einem Satz (19 % oder 7 %) gerechnet; gemischte Sätze an einem Tag nicht.
- Übergabe Fassung 2 aus Alis-Moderaum (Tagessummen Karte/Online, über den Tresor) nicht gebaut.
- Rechtliche Einschätzung (offene Ladenkasse, Zählprotokoll, Kleinbetragsrechnung): mit dem Steuerberater bestätigen –
  besonders: Gutscheine über die Karten-Kasse (zählen wie Bargeld), Barverkauf „nur Bestand“ in der Warenwirtschaft.
- Eine Quittung über 250 € wird gedruckt und abgelegt (mit Hinweis), ist aber keine ausreichende Rechnung für Firmenkunden.
- Privat („Bargeld zählen“ im Haushaltsbuch) ist besprochen, nicht gebaut – gehört zu Bauplan Schritt 2.

## Stundennachweis

- Erste Spur: 2026-11-09 ≈ 14:00 UTC (Sitzungsbeginn, aus Dateizeiten geschätzt); letzte Spur ≈ 14:45 UTC (dieser Abschluss).
- Ein Block, Klaus antwortete zwischendurch auf die Fragen. Obergrenze ≈ 45 min; aktive Zeit nicht gemessen. Klaus' Angabe geht vor.

## Nächste Sitzung

`BRIEF_SITZUNG_2026-11-09_NACH-KASSE.md`
