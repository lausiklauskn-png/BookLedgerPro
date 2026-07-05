# Übergabe von Tomy-WorkFloh an BLP — Datenvertrag v1 (2026-07-05)

Klaus' Wunsch: Ein im **Tomy-Werkzeugverbund** (`Tomys-Hub`, gleicher
GitHub-Pages-Origin) fertig bearbeiteter Werkstatt-Auftrag soll „nach Erledigt"
in die große Buchhaltung (BLP) zur **Rechnungserstellung** wandern.

## Weg (bewusst mensch-geführt, GoBD-schonend)

1. Tomy-WorkFloh zeigt am fertigen/erledigten Auftrag den Knopf
   **„🧾 Rechnung in BLP"**. Er öffnet BLP mit
   `?uebernahme=<base64url(JSON)>` (gleicher Tab, gleicher Origin).
2. BLP fängt den Parameter beim Laden ein (`src/domain/uebernahmeExtern.js`),
   **säubert sofort die URL** (replaceState) und stellt die Route auf
   **Angebote**. Die Daten leben nur im RAM (Verbrauchs-Semantik).
3. Nach dem Entsperren zeigt der Angebote-View einen Hinweis-Banner und ein
   **vorbefülltes Formular** (Titel + Positionen). **Nichts wird automatisch
   gespeichert** — der Mensch prüft, wählt ggf. Kunde/Kostenstelle, legt an.
4. Ab da gilt die bestehende, getestete Strecke: Angebot → angenommen →
   **Rechnungs-Entwurf** (`domain/angebotUebernahme.js`), Festschreiben manuell.

## Vertrag v1 (JSON, base64url-kodiert im Parameter `uebernahme`)

```json
{
  "v": 1,
  "quelle": "tomy-workfloh",
  "titel": "Vereins-Tassen",
  "kundeName": "SV Blau-Weiß 09",
  "auftragNr": "2026-0001",
  "angebotsNr": "A-2026-0001",
  "positionen": [
    { "beschreibung": "Tasse 11oz bedruckt (Digitaldruck)",
      "menge": 10, "einzelpreisCent": 1290, "ustSatz": 19 }
  ]
}
```

## Härtung (Parser, node-getestet in `tests/run.mjs`)

- `v !== 1` oder unbekannte `quelle` → `null` (App startet normal).
- Strings gekappt (titel/beschreibung 140, kundeName 80, Nummern 32 Zeichen).
- Max. 20 Positionen; `menge` 0–100 000; `einzelpreisCent` 0–1 000 000 00,
  gerundet; `ustSatz` nur 0/7/19 (sonst 19). Parameter > 20 kB → `null`.
- Werte werden nie als HTML verwendet (Views rendern über `el()`/textContent).
- `kundeName` wird NICHT automatisch als CRM-Kunde angelegt — er steht im
  Banner; die Kunden-Zuordnung trifft der Mensch im Formular.

## Grenzen / bewusst NICHT

- Kein Auto-Speichern, keine Nummernvergabe, kein Festschreiben — Hoheit
  bleibt beim Menschen (GoBD).
- Kein Rückkanal zu Tomy in v1 (die Rechnungs-Nr. wandert nicht zurück).
- Vertrag erweitern ⇒ `v` erhöhen und diese Datei zuerst pflegen
  (Spec vor Code).
