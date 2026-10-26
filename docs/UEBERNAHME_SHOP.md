# Übernahme: Shop-Warenwirtschaft → BookLedgerPro (Summen-Brücke)

**Datenvertrag `art:"buchhaltung-summen"`, v1.** Schwester des WorkFloh-Vertrags
(`docs/UEBERNAHME_TOMY.md`) — gleicher Transport (`?uebernahme=<base64url(JSON)>`, gleicher
GitHub-Pages-Origin), aber eine andere Nutzlast und ein anderes Ziel-View.

## Zweck

Eine Shop-Warenwirtschaft (z.B. **Alis-Moderaum** `warehouse.html`, künftig ein zweiter
Pflegeprodukt-Shop) führt Bestand/Inventur weiter **bei sich** — sie ist die eine Quelle der
Wahrheit fürs Lager. An BLP wandern **nur die Zahlen** eines Zeitraums:

- **Umsatz** = Σ Verkäufe (VK) − Σ Retouren (VK), brutto.
- **Wareneinkauf** = Σ Wareneingänge (EK), netto.

BLP macht daraus zwei **Buchungs-Entwürfe** (Umsatz, Wareneinkauf). Der Mensch prüft,
korrigiert und schreibt fest — **nichts wird automatisch festgeschrieben** (GoBD:
Nummernkreise, Festschreibung, Hash-Kette bleiben unberührt).

## Nutzlast (JSON, dann base64url in `?uebernahme=`)

```json
{
  "v": 1,
  "quelle": "alm-warehouse",
  "art": "buchhaltung-summen",
  "shop": "Alis-Moderaum",
  "periode": { "von": "2026-07-01", "bis": "2026-07-31" },
  "umsatzBruttoCent": 119000,
  "wareneinkaufCent": 50000,
  "ustSatz": 19,
  "geschaetzt": false
}
```

| Feld | Regel / Härtung (Parser `parseUebernahmeParam`) |
|---|---|
| `v` | muss `1` sein, sonst `null` |
| `quelle` | Whitelist: `alm-warehouse` \| `sbkim-shop` (generisch für weitere Shops); sonst `null` |
| `art` | `buchhaltung-summen` (sonst → WorkFloh-Angebots-Pfad) |
| `shop` | String, auf 60 Zeichen gekappt, Default `"Shop"` |
| `periode.von/bis` | nur `YYYY-MM-DD`, sonst `""` |
| `umsatzBruttoCent` | Integer-Cent, 0 … 100 Mrd., negativ → 0 |
| `wareneinkaufCent` | Integer-Cent, 0 … 100 Mrd., negativ → 0 |
| `ustSatz` | Whitelist `0` \| `7` \| `19`; sonst `19` |
| `geschaetzt` | Bool — true, wenn der Shop ältere Bewegungen ohne gespeicherten Preis mit dem heutigen Artikelpreis geschätzt hat |

Unbekannte Quelle/Version/Müll → `null` (fail-soft, BLP startet normal). Werte werden nie als
HTML gebaut (Views rendern über `el()`/`textContent`).

## Buchungs-Erzeugung (`src/domain/shopbuchung.js`)

Kontenzuordnung (SKR03), je `ustSatz`:

| Satz | Erlöse | USt | Wareneingang | Vorsteuer |
|---|---|---|---|---|
| 19 % | 8400 | 1776 | 3400 | 1576 |
| 7 % | 8300 | 1771 | 3300 | 1571 |
| 0 % (§19) | 8200 | – | 3400 | – |

Gegenkonten (**Annahme, im Entwurf korrigierbar**): Umsatz → **1200 Bank** (Online-Shop),
Wareneinkauf → **1600 Verbindlichkeiten** (später per Zahlungsabgleich ausgleichen).

**Annahmen (bewusst konservativ, im Entwurfstext benannt):** VK = **Brutto**-Kundenpreis
(→ netto + USt herausgerechnet); EK = **Netto**-Einkauf (→ + Vorsteuer). Buchungsdatum =
Perioden-Ende (`bis`).

Beispiel 19 %, Umsatz brutto 1.190 € / Einkauf netto 500 €:

```
Umsatz:   Soll 1200 Bank              1.190,00
          Haben 8400 Erlöse 19%       1.000,00
          Haben 1776 Umsatzsteuer 19%   190,00
Einkauf:  Soll 3400 Wareneingang 19%    500,00
          Soll 1576 Vorsteuer 19%        95,00
          Haben 1600 Verbindlichkeiten  595,00
```

Beide Buchungen sind **ausgeglichen** (Soll = Haben) und landen als **Entwurf** im Journal.

## Ziel-View

Route `shopbuchung` (`src/ui/views/shopbuchung.js`, Nav „Shop-Übernahme", nur `firma`-Modus).
Der Boot fängt die Übergabe ein, säubert die URL, routet hierher. Der View zeigt die Entwürfe
zur Prüfung; „Als Entwürfe speichern" ruft `ensureSeedKonten` + `saveEntwurf` und wechselt ins
Journal.

## Mehrere Shops / Mehr-Firmen

Jeder Shop ist eine eigene `warehouse.html`-Kopie mit eigenem DB-Präfix und eigenem `shop`-
Namen; über die generische Quelle `sbkim-shop` speist ein künftiger zweiter Shop denselben
Vertrag. Getrennte Firmen = getrennte **Mandanten** in BLP (Übergabe in den jeweils aktiven
Mandanten). Kein Hardcode auf einen bestimmten Shop.

## Absender (Shop-Seite)

`Alis-Moderaum/warehouse.html`, Daten-Tab → „An Buchhaltung übergeben": Zeitraum + USt-Wahl
(19 % / 7 % / Kleinunternehmer §19) + BLP-Adresse; `bookMovement` heftet seit dieser Version
`ekCent`/`vkCent` an jede Bewegung, damit der Betrag zum Zeitpunkt der Bewegung erhalten bleibt.
