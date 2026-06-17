# WorkFloh → BookLedgerPro — Import-Schema

BookLedgerPro nimmt Kunden + Aufträge aus **Mein-WorkFloh** über eine JSON-Datei
entgegen (Menü **Aufträge → „Aus WorkFloh importieren"**). Dieses Dokument ist der
**Vertrag** für die WorkFloh-Seite („Verknüpfung mit Buchhaltungssoftware"):
WorkFloh exportiert genau dieses Format, BookLedgerPro liest es.

## Format

```json
{
  "kunden": [
    {
      "externId": "K-1001",
      "name": "Beispiel Kunde GmbH",
      "adresse": "Kundenweg 2, 54321 Köln",
      "email": "kontakt@beispiel.de",
      "ustId": "DE123456789"
    }
  ],
  "auftraege": [
    {
      "externNummer": "A-2026-0007",
      "kundeExternId": "K-1001",
      "titel": "Beratung Juni",
      "positionen": [
        { "beschreibung": "Beratung", "menge": 10, "einzelpreisCent": 10000, "ustSatz": 19 }
      ],
      "rechnung": { "nummer": "2026-0042", "datum": "2026-06-10", "leistungsdatum": "2026-06-09" }
    }
  ]
}
```

`rechnung` ist **optional** (R4 Stufe 2 — Rechnungs-Übernahme). Fehlt der Block, kommt der
Auftrag wie bisher als „angelegt" herein (Rechnung wird in BLP gestellt).

## Felder

**Kunde**
- `externId` (empfohlen): stabile WorkFloh-Kundennummer → Dedupe & Verknüpfung.
- `name` (Pflicht), `adresse`, `email`, `ustId` (optional).

**Auftrag**
- `externNummer` (empfohlen): WorkFloh-Auftragsnummer → wird 1:1 behalten, Dedupe.
- `kundeExternId`: verweist auf `kunden[].externId`.
- `titel` (Pflicht, sonst aus `externNummer` abgeleitet).
- `positionen[]`:
  - `beschreibung`
  - `menge` (Zahl)
  - **Preis:** `einzelpreisCent` (Ganzzahl Cent) **oder** `einzelpreis` (Euro, z. B. `"100,00"`).
  - `ustSatz`: 0 | 7 | 19. **Fehlt der Satz, ergänzt BookLedgerPro 19 % (editierbar).**
- `rechnung` (optional, **R4 Stufe 2 — Rechnungs-Übernahme**): eine **bereits in WorkFloh
  gestellte** Rechnung.
  - `nummer` (Pflicht): die von **WorkFloh** vergebene, fortlaufende Rechnungsnummer. BLP
    übernimmt sie 1:1 und vergibt **keine eigene** Nummer (der Aussteller führt die Nummerierung).
  - `datum` (Pflicht, `JJJJ-MM-TT`): Rechnungsdatum.
  - `leistungsdatum` (optional, Default = `datum`).
  - Sind `nummer`/`datum` unvollständig oder ungültig, wird der **Rechnungsblock verworfen**
    (der Auftrag kommt als „angelegt" herein) und als Hinweis gezählt — nichts wird erfunden.

## Verhalten beim Import

- **Dedupe:** Kunden über `externId` (sonst Name), Aufträge über `externNummer`.
  Bereits vorhandene Aufträge werden übersprungen (kein Duplikat).
- Aufträge **ohne** `rechnung` kommen als Status **„angelegt"** herein — Rechnung/USt-Buchung
  erfolgt in BookLedgerPro (dort wird die USt geführt und festgeschrieben, GoBD).
- Aufträge **mit** gültiger `rechnung` (R4 Stufe 2): BLP erzeugt direkt einen **Buchungs-Entwurf**
  (Forderung an Erlöse + USt) mit der **WorkFloh-Nummer/-Datum** und setzt den Auftrag auf
  **„berechnet"**. **Festschreiben bleibt manuell** (GoBD). Die Vorsteuer/USt wird in BLP geführt.
- Tolerant: Euro- oder Cent-Preise, fehlende USt-Sätze werden ergänzt; fehlerhafte
  Einträge werden übersprungen und als Hinweis gezählt.

## Status / offen
- Datei-Import ✅ umgesetzt (`src/domain/importworkfloh.js` + `crm-store.importWorkFloh`).
- **Rechnungs-Übernahme (R4 Stufe 2) ✅** umgesetzt: `rechnung`-Block → Buchungs-Entwurf/Forderung
  (`invoicing.rechnungsUebernahmeEntwurf`/`validateRechnungsUebernahme`). Export trägt den Block
  reziprok mit (`connect.buildAustauschPaket`, Format-Version 2, abwärtskompatibel).
- **Offen:** API/Push (Echtzeit) statt Datei; Übernahme von **Zahlungsstatus** (bezahlt/Teilzahlung)
  aus WorkFloh (heute nur Forderung/Buchung). Automatischer Sage-Mycel-Sync (Briefkasten/SBKIM):
  späterer Ausbau (Phase 5d).
