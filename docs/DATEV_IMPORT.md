# DATEV_IMPORT.md — DATEV-EXTF-Buchungsstapel importieren & prüfen

> Wie der DATEV-Export aus BookLedgerPro aufgebaut ist und wie man ihn (oder der Steuerberater)
> importiert. **Ehrliche Einordnung:** Das Format ist EXTF-**orientiert** (korrekter Header-Envelope
> v700/Format 21 v13 + Konto/Gegenkonto-Brutto-Modell + SKR03-Standard-Steuerschlüssel). „Berater-fest"
> heißt: Header/Schlüssel sind korrekt aufgebaut und gegen die Demo-Vergleichswerte getestet — die
> **endgültige Bestätigung** liefert ein realer Testimport in DATEV bzw. der Steuerberater.

## Export erzeugen
App → **Auswertung** → Export → **DATEV-CSV** → Datei `EXTF_Buchungsstapel_<Datum>.csv`.
Vorher unter **Einstellungen → DATEV-Export** Berater-Nr., Mandanten-Nr. und Sachkontenlänge
hinterlegen (vom Steuerberater erfragen). Für einen Trockentest ohne eigene Daten:
**Berichte → Demo-/Test-Export** (`datev/EXTF_Buchungsstapel.csv`).

## Aufbau
- **Kopfzeile:** `"EXTF";700;21;"Buchungsstapel";13;<Zeitstempel>;…;<Berater>;<Mandant>;<WJ-Beginn>;<Sachkontenlänge>;<von>;<bis>;"<Bezeichnung>";…;"EUR";…`
- **Spaltenüberschriften** (Zeile 2): Umsatz; S/H; WKZ; …; Konto; Gegenkonto; BU-Schlüssel; Belegdatum; Belegfeld 1; …; Buchungstext; Kostenstelle.
- **Datenzeilen:** Bruttobetrag (Komma-Dezimal), S/H, Konto, Gegenkonto, BU-Schlüssel, Belegdatum (TTMM — Jahr aus dem WJ im Header), Belegfeld 1 (= laufende Nr.), Buchungstext, Kostenstelle.

## Steuerschlüssel (BU) — SKR03-Standard
| Vorgang | Satz | BU-Schlüssel |
|---|---|---|
| Vorsteuer (Eingangsleistung) | 19 % | **9** |
| Vorsteuer | 7 % | **8** |
| Umsatzsteuer (Ausgangsleistung) | 19 % | **3** |
| Umsatzsteuer | 7 % | **2** |
| ohne Steuer | – | (leer) |

**Automatik vs. Split:**
- **Einfache Sätze** (2 Zeilen, oder 3 Zeilen mit genau einer Standard-Steuerzeile) werden als
  **ein** Satz mit **Bruttobetrag + BU-Schlüssel** exportiert — DATEV rechnet die Steuer heraus.
- **§13b / innergemeinschaftlicher Erwerb / Mehrfach-Splits** werden **zeilenweise und
  steuerneutral** (ohne BU-Schlüssel, ohne Gegenkonto) exportiert, da die Steuer bereits explizit
  auf eigenen Konten (1577/1787 bzw. 1574/1772) gebucht ist. So entsteht beim Import **keine
  doppelte** Steuer.

## Import (Kurz)
1. DATEV Rechnungswesen / „Unternehmen online" → Buchungsdaten → **Stapelverarbeitung/Import** →
   ASCII/EXTF-Format → Datei wählen.
2. Buchungsstapel **prüfen** (Protokoll), erst dann übernehmen.
3. Alternativ: Datei dem **Steuerberater** geben (er importiert in sein Kanzlei-Rechnungswesen).

## Prüf-Checkliste (gegen `docs/TESTDATEN.md`, Demo „klein")
- Kopf: Berater/Mandant/Sachkontenlänge wie eingestellt; WJ-Beginn `20260101`.
- Verkauf 19 %: Konto 1200 / Gegenkonto 8400 / BU **3** / Umsatz 119,00.
- Büro 19 %: Konto 4930 / Gegenkonto 1200 / BU **9** / Umsatz 119,00.
- §13b-Buchung: 4 Einzelzeilen, **kein** BU-Schlüssel, Gegenkonto leer.
- Summen/Saldo gegen SuSa (`euer/susa.csv`) abgleichen.

## Ehrliche Grenzen
- Steuerschlüssel-Tabelle ist **kontenrahmen-/versionsabhängig** (hier SKR03-Auswahl) — beim
  Berater/in DATEV gegenprüfen.
- Kein zertifiziertes 116-Spalten-EXTF; keine automatische Übernahme von §13b-BU-Schlüsseln.
- Endgültige „Berater-Festigkeit" = **ein realer DATEV-Testimport** (privat oder via Steuerberater).
