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
      ]
    }
  ]
}
```

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

## Verhalten beim Import

- **Dedupe:** Kunden über `externId` (sonst Name), Aufträge über `externNummer`.
  Bereits vorhandene Aufträge werden übersprungen (kein Duplikat).
- Aufträge kommen als Status **„angelegt"** herein — Rechnung/USt-Buchung erfolgt in
  BookLedgerPro (dort wird die USt geführt und festgeschrieben, GoBD).
- Tolerant: Euro- oder Cent-Preise, fehlende USt-Sätze werden ergänzt; fehlerhafte
  Einträge werden übersprungen und als Hinweis gezählt.

## Status / offen
- Datei-Import ✅ umgesetzt (`src/domain/importworkfloh.js` + `crm-store.importWorkFloh`).
- Automatischer Sage-Mycel-Sync (Briefkasten/SBKIM) statt Datei: späterer Ausbau (Phase 5d).
