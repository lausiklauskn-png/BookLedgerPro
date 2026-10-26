# Übergabe von WorkFloh an BLP — Datenvertrag v1 (2026-07-05)

Klaus' Wunsch: Ein im **WorkFloh-Werkzeugverbund** (gleicher GitHub-Pages-Origin)
fertig bearbeiteter Werkstatt-Auftrag soll „nach Erledigt" in die große
Buchhaltung (BLP) zur **Rechnungserstellung** wandern.

**Zwei Absender, ein Vertrag:** Tomys WorkFloh (`Tomys-Hub/workfloh`, `quelle:'tomy-workfloh'`)
**und** Mein-WorkFloh (ISD⁺, `quelle:'isd-workfloh'`) senden denselben v1-Vertrag;
beide `quelle`-Werte sind in `UEBERNAHME_QUELLEN` freigeschaltet.

**Parallel-Regel (Klaus 2026-07-06):** Diese Datei ist der **kanonische Vertrag** für
beide Sender. Die Brücke läuft **immer parallel** — eine Verbesserung am einen WorkFloh
wird am anderen nachgezogen. Sender-Funktionen: ISD `wfBlp(modus)` (`Mein-WorkFloh/index.html`),
Tomy `ykBlpInvoice()` (`Tomys-Hub/workfloh/index.html`). Beide schicken `modus`. Wer den
Vertrag hier ändert (oder den Parser `src/domain/uebernahmeExtern.js`), spiegelt die Änderung
in **beiden** Sendern. **Bewusst nicht identisch:** Branding, kein geteilter Tresor, und
Tomys „Angebot erstellen" nutzt Tomys **eigenes** BookLedger (eigener Angebots-Nr.-Rückkanal),
während ISD die geteilte BLP nutzt.

**`modus` (`angebot`/`rechnung`, Pflege 2026-07-06):** WorkFloh schickt `modus` mit.
Er steuert **nur den Hinweis-Text** im Banner (Angebot vs. Rechnung) — **beide** Wege
landen im Angebote-Entwurf. Eine Rechnung wird **nie** automatisch erzeugt: Rechnungs-
nummer und GoBD-Festschreibung entstehen erst durch die bewusste, manuelle
Angebot→Rechnung-Strecke (§14 UStG: fortlaufende Nummer, danach unveränderlich). Bei
`modus:'rechnung'` weist der Banner den Weg dorthin; unbekannter Wert → `angebot`.

## Weg (bewusst mensch-geführt, GoBD-schonend)

1. Tomy-WorkFloh zeigt am fertigen/erledigten Auftrag den Knopf
   **„🧾 Rechnung in BLP"**. Er öffnet BLP mit
   `?uebernahme=<base64url(JSON)>` (gleicher Tab, gleicher Origin).
2. BLP fängt den Parameter beim Laden ein (`src/domain/uebernahmeExtern.js`),
   **säubert sofort die URL** (replaceState) und stellt die Route auf
   **Angebote**. Die Daten leben nur im RAM (Verbrauchs-Semantik).
3. Nach dem Entsperren zeigt der Angebote-View einen Hinweis-Banner und ein
   **vorbefülltes Formular** (Titel + Positionen). **Nichts wird automatisch
   gespeichert.** Der übergebene **Kunde** wird per Name einem vorhandenen
   Stammkunden **zugeordnet**; fehlt er, bietet der Banner **„Kunde anlegen"** an
   (reine Stammdaten, GoBD-neutral). Der Mensch prüft und legt an.
4. Ab da gilt die bestehende, getestete Strecke: Angebot → angenommen →
   **Rechnungs-Entwurf** (`domain/angebotUebernahme.js`), Festschreiben manuell.

## Vertrag v1 (JSON, base64url-kodiert im Parameter `uebernahme`)

```json
{
  "v": 1,
  "quelle": "tomy-workfloh",
  "modus": "angebot",
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

## Wer darf senden — und was die Liste wirklich leistet (2026-08-19)

BookLedgerPro hängt **nicht** an WorkFloh. WorkFloh ist einer von mehreren Absendern,
und der Transport `?uebernahme=<base64url(JSON)>` trägt bereits **zwei** verschiedene
Nutzlasten, gesteuert über das Feld `art`:

| `art` | was passiert | Vertrag |
|---|---|---|
| `angebot` (Vorgabe) | Werkstatt-Auftrag → Angebots-Formular | diese Datei |
| `buchhaltung-summen` | Zeitraum-Summen eines Shops → zwei Buchungs-Entwürfe | `UEBERNAHME_SHOP.md` |

Freigeschaltete Absender (`UEBERNAHME_QUELLEN` in `src/domain/uebernahmeExtern.js`):

| `quelle` | wer |
|---|---|
| `tomy-workfloh` | Tomys WorkFloh |
| `isd-workfloh` | Mein-WorkFloh |
| `alm-warehouse` | Alis-Moderaum, Warenwirtschaft |
| `sbkim-shop` | **der offene Platz** für ein fremdes Shop-Werkzeug |
| `workflow-calculate` | Workflow Calculate (Angebotsplaner, 2026-10-12) — `art` angebot, `modus` angebot; Positionen aus dem Kundenblatt, „Verpackung & Versand“ als eigene Position |

**Wie ein fremdes Werkzeug andockt.** Passt die Nutzlast zu einem der beiden Verträge,
genügt `quelle: "sbkim-shop"` — dafür ist der Platz da. Braucht es eine eigene Nutzlast,
kommen ein neues `art` und ein neuer Name dazu: ein kleiner, bewusster Schritt, kein Umbau.

**Die ehrliche Grenze.** Die Liste ist ein **Format-Schalter, kein Türschloss**. Sie sagt
BLP, wie eine Nutzlast zu lesen ist — sie beweist **nicht**, wer sie geschickt hat. Jeder
kann sich in seinem eigenen Aufruf `sbkim-shop` nennen. Der Schutz liegt woanders und ist
da: die Härtung unten (Längen, Wertebereiche, kein HTML) und die Regel, dass **nichts
automatisch gespeichert** wird. BLP füllt das Formular vor, der Mensch prüft und legt an;
Nummernkreise und Festschreibung bleiben unberührt.

**Und ein Fehlschlag ist nicht mehr stumm.** Kommt eine Übergabe an, die nicht verstanden
wird, sagt BLP das in einer Zeile über der Angebote-Ansicht — ohne zu zeigen, was drinstand.
Vorher öffnete die App ganz normal und leer. Genau dieses Schweigen hat verdeckt, dass
Mein-WorkFloh jahrelang `quelle:'workfloh'` schickte, einen Namen, den es hier nie gab.

## Härtung (Parser, node-getestet in `tests/run.mjs`)

- `v !== 1` oder **unbekannte `quelle`** (nicht aus der Liste oben) → `null`, und die App
  startet normal — sagt aber, dass etwas ankam und nicht verstanden wurde.
- Strings gekappt (titel/beschreibung 140, kundeName 80, Nummern 32 Zeichen).
- Max. 20 Positionen; `menge` 0–100 000; `einzelpreisCent` 0–1 000 000 00,
  gerundet; `ustSatz` nur 0/7/19 (sonst 19). Parameter > 20 kB → `null`.
- Werte werden nie als HTML verwendet (Views rendern über `el()`/textContent).
- `modus` nur `angebot`/`rechnung` (sonst `angebot`); steuert ausschließlich den Hinweis.
- `kundeName` wird per Name einem vorhandenen Kunden **zugeordnet**; sonst per Knopf
  **anlegbar** (kein automatisches Anlegen ohne Klick — der Mensch bestätigt).

## Grenzen / bewusst NICHT

- Kein Auto-Speichern, keine Nummernvergabe, kein Festschreiben — Hoheit
  bleibt beim Menschen (GoBD).
- Kein Rückkanal zu Tomy in v1 (die Rechnungs-Nr. wandert nicht zurück).
- Vertrag erweitern ⇒ `v` erhöhen und diese Datei zuerst pflegen
  (Spec vor Code).
