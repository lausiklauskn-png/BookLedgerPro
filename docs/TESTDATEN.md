# TESTDATEN.md — Simulations-Mandant & Vergleichswerte (ohne DATEV/ELSTER-Zugang)

> Zweck: Die Export-Formate mit **echten Dateiendungen** prüfen, **ohne** echten DATEV-/
> ELSTER-Zugang. Der Demo-Mandant ist **deterministisch** (`src/domain/demodaten.js`) — die
> hier dokumentierten Sollwerte sind in `tests/run.mjs` als automatische Tests hinterlegt
> (`node tests/run.mjs`). Beim späteren privaten Test gegen echtes DATEV/ELSTER bitte
> Abweichungen hier vermerken und die Mappings nachziehen.

## So erzeugst du die echten Dateien
In der App → **Berichte** → Karte **„Demo-/Test-Export"**:
- **Demo „klein" (ZIP)** bzw. **Demo „groß" (ZIP)** lädt ein ZIP mit echten Dateien herunter.
- Berührt deine echten Daten **nicht** (rein aus dem Demo-Mandanten erzeugt).

Inhalt des ZIP (Endungen/Ordner):
```
datev/EXTF_Buchungsstapel.csv      DATEV-EXTF (orientiert)
ust-va/ust-va-elster.csv           ELSTER-USt-VA-Datenpaket (kein ERiC-Versand)
euer/euer.csv                      EÜR (konten-basiert)
euer/susa.csv                      Summen- und Saldenliste
euer/anlage-euer.csv               Anlage-EÜR-Gruppierung
kasse/kassenbuch-1000.csv          Kassenbuch (laufender Bestand)
konten/kontenblatt-1200.csv        Kontenblatt Bank
anlagen/anlagenverzeichnis.csv     Anlagenverzeichnis (AfA)
gdpdu/index.xml + *.csv + info     GoBD/GDPdU „Z3"-Datenpaket
README.txt
```

## Mandant „klein" — Buchungen (Wirtschaftsjahr 2026)
Anfangsbestand Bank (1200): **5.000,00 €**. Alle Buchungen festgeschrieben.

| # | Datum | Vorgang | Buchung (Cent) |
|---|---|---|---|
| 1 | 15.01. | Ausgangsrechnung 19% | 1200 S 119000 / 8400 H 100000 / 1776 H 19000 |
| 2 | 10.02. | Ausgangsrechnung 7% | 1200 S 10700 / 8300 H 10000 / 1771 H 700 |
| 3 | 05.03. | Barverkauf steuerfrei | 1000 S 5000 / 8200 H 5000 |
| 4 | 20.03. | Miete | 4210 S 80000 / 1200 H 80000 |
| 5 | 08.04. | Bürobedarf 19% | 4930 S 10000 / 1576 S 1900 / 1200 H 11900 |
| 6 | 02.05. | Cloud §13b (Reverse-Charge) | 4950 S 10000 / 1577 S 1900 / 1787 H 1900 / 1200 H 10000 |
| 7 | 30.06. | AfA Laptop (linear) | 4830 S 40000 / 0400 H 40000 |
| 8 | 15.07. | Bewirtung 70/30 | 4650 S 7000 / 4654 S 3000 / 1576 S 1900 / 1200 H 11900 |

Anlage: **Laptop**, AK netto 1.200,00 €, linear, Nutzungsdauer 3 J., Anschaffung 10.01.2026.

### Erwartete Werte „klein" (Soll-Vergleich)
**USt-Voranmeldung (Jahr 2026):**
| Kennzahl | Bedeutung | Wert |
|---|---|---|
| Kz 81 | Umsätze 19% (BMG) | 1.000,00 € |
| (Steuer) | USt 19% | 190,00 € |
| Kz 86 | Umsätze 7% (BMG) | 100,00 € |
| (Steuer) | USt 7% | 7,00 € |
| Kz 66 | Vorsteuer (§15 Abs.1 Nr.1) | 38,00 € |
| Kz 46/47 | §13b BMG / Steuer | 100,00 € / 19,00 € |
| Kz 67 | Vorsteuer §13b | 19,00 € |
| **Kz 83** | **Zahllast** | **159,00 €** |

> §13b: Kz 47 (geschuldet) und Kz 67 (Vorsteuer) heben sich auf → wirken nicht auf die Zahllast.

**EÜR (Jahr 2026):** Einnahmen 1.150,00 € · Ausgaben 1.500,00 € · **Überschuss −350,00 €** (Verlust).
**Kassenbuch (Kasse 1000):** Endbestand **50,00 €** (nur Barverkauf #3, kein Anfangsbestand).
**AfA Laptop 2026:** 400,00 € · Restbuchwert 31.12.2026: **800,00 €**.
**GDPdU `buchungen.csv`:** 1 Kopfzeile + 23 Datenzeilen = **24 Zeilen**.
**SuSa:** Summe Soll = Summe Haben (doppelte Buchführung).

## Mandant „groß" — Volumen (Konsistenzprüfung)
Generiert (monatlich): 12× Umsatzerlöse 19% (je 50.000 € netto), 12× Personalkosten, 12× Miete,
12× Wareneinkauf 19%, 4× §13b (quartalsweise), 1× AfA Maschine; Anfangsbestand Bank 50.000 €.
Hier werden **Invarianten** geprüft (gelten für jede Betriebsgröße):
- SuSa: Summe Soll == Summe Haben.
- EÜR-Überschuss (`computeEUR`) == Anlage-EÜR-Überschuss (`anlageEUR`).
- USt-VA Kz 83 == Kz81-St + Kz86-St + Kz47 + Kz93 − Kz66 − Kz67 − Kz61.
- Kassen-/Bankbericht: Endbestand == Anfangsbestand + Σ Einnahmen − Σ Ausgaben.

## Abgleich mit echtem DATEV/ELSTER (privater Test, geplant)
1. Demo-ZIP herunterladen, Dateien öffnen, mit den Sollwerten oben vergleichen.
2. `ust-va/ust-va-elster.csv` gegen die Kennzahlen im ELSTER-Formular halten.
3. `datev/EXTF_Buchungsstapel.csv` einem DATEV-Testimport vorlegen (Steuerschlüssel/Header) → V8.
4. `gdpdu/` mit der Prüfsoftware (IDEA) testweise einlesen.
5. **Abweichungen hier dokumentieren** (Datum, Datei, erwartet/erhalten) → Mapping nachbessern.

> Ehrliche Grenzen: DATEV-EXTF & Anlage-EÜR sind *orientiert* (Zeilen/Steuerschlüssel jahres-/
> kontenrahmenabhängig); ELSTER-Paket ist kein ERiC-Versand; GDPdU ohne mitgelieferte DTD.
> Browser-/IndexedDB-Klickpfade sind nicht headless-E2E getestet (→ V10, manuell).
