# Übernahme aus einer Schwester-App (`?uebernahme=`)

Stand: 2026-07-05 · Modul: `src/domain/uebernahme.js` · Ansicht: `src/ui/views/orders.js`

## Zweck
Eine Schwester-App (aktuell **Mein-WorkFloh**, Quelle `isd-workfloh`) kann einen
fertigen Auftrag an BookLedgerPro übergeben, indem sie BLP mit dem URL-Parameter
`?uebernahme=<base64url(JSON)>` öffnet. BLP **befüllt damit nur das Aufträge-Formular
als Entwurf vor** — es speichert und bucht **nichts** automatisch.

## GoBD-Haltung (wichtig)
Die Übernahme ist reine **Vorbelegung eines prüfbaren Entwurfs**. Der Nutzer prüft die
Felder, speichert den Auftrag bewusst und erzeugt die Rechnung/Buchung danach wie gewohnt
manuell (`rechnungAusAuftrag` → Journal). Die GoBD-relevante Festschreibung bleibt
vollständig in Nutzerhand. Es wird kein Konto, keine Buchung und kein Beleg automatisch
angelegt. Kein Klartext verlässt das Gerät.

## Datenvertrag v1
JSON-Objekt, base64url-kodiert (`btoa` über UTF-8-Bytes, `+/`→`-_`, `=`-Padding entfernt):

```json
{
  "v": 1,
  "quelle": "isd-workfloh",
  "modus": "angebot",            // "angebot" | "rechnung" (Default: angebot)
  "titel": "Schild Müller & Söhne",
  "kundeName": "Müller GmbH",
  "auftragNr": "2026-0042",
  "angebotsNr": "",
  "positionen": [
    { "beschreibung": "Werbeschild 2×1 m", "menge": 10, "einzelpreisCent": 4990, "ustSatz": 19 }
  ]
}
```

- **`v`** muss `1` sein, sonst wird die Übernahme ignoriert (`null`).
- **`positionen`** braucht mindestens eine verwertbare Position (Beschreibung oder Preis),
  sonst `null`.
- **`ustSatz`** wird auf einen in BLP erlaubten Satz (0/7/19) eingerastet, sonst 19 %.
- **`menge`** ohne/ungültig → 1. **`einzelpreisCent`** wird zu ganzen Cent gerundet.
- Alle Strings werden längenbegrenzt (Titel/Kunde ≤ 200, Nr./Quelle ≤ 60 Zeichen).

## Ablauf in BLP
1. `main.js` liest beim Start (nach Unlock) `parseUebernahmeQuery(location.search)`.
2. Bei Treffer: Übernahme in einen RAM-Puffer legen (`setPendingUebernahme`),
   URL per `history.replaceState` säubern (kein Re-Trigger bei Hard-Reload),
   `navigate('orders')`.
3. `orders.js` holt den Puffer einmalig (`takePendingUebernahme`) und befüllt das Formular:
   Titel, Positionen (Beschreibung/Menge/Preis/USt), Kunde per Namensabgleich.
4. Fehlt der Kunde in BLP, zeigt ein Banner **„Kunde anlegen"** — ein Klick legt den
   Kunden mit dem übergebenen Namen an und ordnet ihn zu (Formular bleibt erhalten).

## Modus (offene Feinheit)
`modus` (`angebot` vs. `rechnung`) wird derzeit nur im Banner angezeigt — beide landen im
selben Aufträge-Entwurf, weil BLP genau **eine** GoBD-saubere Strecke Auftrag → Rechnung
kennt. Ein separater Angebots-/Rechnungs-Einsprung wäre eine bewusste Erweiterung und
sollte nicht ohne Abstimmung an der GoBD-Strecke gebaut werden.

## Gegenseite
Sender: `Mein-WorkFloh/index.html`, Funktion `wfBlp(modus)` (Buttons „💶 Angebot erstellen"
/ „🧾 Rechnung in BLP"). Der Encoder dort ist die maßgebliche Referenz für den Vertrag.

## Test
`tests/run.mjs` → Sektion „Übernahme aus Schwester-App": deckt den echten WorkFloh-Encoder,
Roundtrip (inkl. Umlaute), Fehlerfälle (falsche Version, leere Positionen, Müll-base64),
USt-Einrastung und Modus-Default ab. Der DOM-Pfad (Vorbelegung + „Kunde anlegen") wurde
zusätzlich headless im Browser (Chromium) durchgefahren.
