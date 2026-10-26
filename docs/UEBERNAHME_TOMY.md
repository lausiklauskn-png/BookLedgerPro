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
| `workflow-needs` | Workflow Needs (Bedarfsanalyse, 2026-10-26, D22) — `art` angebot, `modus` angebot; jede Hauptposition des Angebots als 1 × Netto, Optionales bleibt draußen, kein Stundensatz |

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

## Vertrag v2 „Vorgang" — der Rundlauf (Klaus 2026-10-26, D21/D23)

Klaus: „Wenn in der Buchhaltung ein Angebot gemacht wird, dann sollte es weitergegeben werden können zum WorkFloh,
als Auftrag verarbeitet werden, wenn es angenommen wurde, genauso der Rückweg wieder." Reihenfolge R1 → R2 → R3,
parallel in **beiden** WorkFlohs. Reine Rechnung auf BLP-Seite: `src/domain/vorgang.js`; Empfänger in den WorkFlohs:
`vorgangEmpfangen()` (identisch in `Mein-WorkFloh/index.html` und `Tomys-Hub/workfloh/index.html`).

### R1 — BLP → WorkFloh: angenommenes Angebot wird Auftrag (gebaut 2026-10-26)

Am Angebot mit Status **angenommen** steht in BLP „🛠 Als Auftrag an Mein WorkFloh" (Ziel in Einstellungen →
„WorkFloh-Verbund", `settings.workflohZiel`: `mein-workfloh` | `tomy-workfloh`). BLP öffnet den WorkFloh mit
`?vorgang=<base64url(JSON)>` und vermerkt am Angebot `verweise.wfZiel` + `wfUebergabeAm`. Der WorkFloh legt den
Auftrag **zur Prüfung im Editor** an (Titel, Kunde mit E-Mail/Adresse/Telefon, Positionen als Beschreibung je Zeile,
Preis = Netto-Summe, Status `angenommen`/`angebot` falls in der Kette) und **speichert erst auf Tipp**; der Kunde wird
beim Speichern per Name/E-Mail zugeordnet oder angelegt. Der Auftrag trägt `blpAngebotNr`/`blpAngebotId`. Dieselbe
Angebotsnummer noch einmal → der vorhandene Auftrag wird geöffnet, nicht gedoppelt.

```json
{ "v": 2, "quelle": "bookledgerpro", "art": "auftrag",
  "verweise": { "blpAngebotNr": "AN-2026-0042", "blpAngebotId": "angebot_…", "wfAuftragNr": "" },
  "titel": "Vereins-Tassen", "kundeName": "SV Blau-Weiß 09",
  "kunde": { "adresse": "…", "email": "…", "telefon": "…", "ustId": "" },
  "positionen": [ { "beschreibung": "Tasse 11oz bedruckt", "menge": 10, "einzelpreisCent": 1290, "ustSatz": 19 } ],
  "status": "angenommen", "datum": "2026-10-26" }
```

Nur die externe Schicht: Netto-Einzelpreis und USt, **nie** `kalkulation` (Prime Directive). Härtung im Empfänger wie
hier: `v === 2`, `quelle` aus `VORGANG_QUELLEN`, `art === 'auftrag'`, Strings gekappt, max. 20 Positionen, Adresse
sofort gesäubert; Müll oder fremde Quelle → Toast „nicht lesbar", nichts angelegt.

### R2 — WorkFloh → BLP: die Rechnung hängt am selben Angebot (gebaut 2026-10-26)

`wfBlp` / `ykBlpInvoice` schicken im v1-Vertrag zusätzlich
`"verweise": { "blpAngebotNr", "blpAngebotId", "wfAuftragNr" }`. Findet BLP das Angebot (per Kennung, sonst Nummer),
legt es **keinen** neuen Entwurf an: Banner „Rückmeldung aus WorkFloh: Auftrag 2026-0007 gehört zu Angebot
AN-2026-0042", `verweise.wfAuftragNr`/`wfQuelle`/`wfRueckAm` am Angebot, die Zeile zeigt „→ WorkFloh-Auftrag 2026-0007",
und „Rechnung aus Angebot" (nur bei angenommen) erzeugt den Rechnungs-Entwurf „… (aus Angebot AN-2026-0042 ·
WorkFloh-Auftrag 2026-0007)". Ohne Treffer (unbekannte Nummer) gilt der Bestand: Formular vorbefüllt wie in v1.
Der Parser nimmt `v: 1` und `v: 2` an; ohne `verweise` bleibt alles wie vorher.

### R3 — BLP → WorkFloh: Stand der Rechnung zurück (gebaut 2026-10-26)

Am archivierten Angebot, das einen WorkFloh-Auftrag trägt (R2) und aus dem die Rechnung entstand („Rechnung aus Angebot"
vermerkt jetzt `verweise.rechnungBuchungId/rechnungNr/rechnungDatum`), stehen zwei Knöpfe: **„📤 Rechnung an WorkFloh
melden"** — nur eine **festgeschriebene** Buchung geht hinaus (ein Entwurf ist keine Rechnung: Hinweis, kein Sprung) — und
**„📤 Bezahlt an WorkFloh melden"** mit Datum (Angabe von Hand; BLP führt zum Angebot keinen Zahlungseingang). Ziel = R1-Ziel,
sonst die Quelle des R2-Rückwegs (`isd-workfloh` → Mein WorkFloh, `tomy-workfloh` → Tomys), sonst die Einstellung. Am
Angebot bleibt `verweise.wfStand`/`wfStandAm`/`wfBezahltAm`; gemeldete Knöpfe verschwinden, „bezahlt" schließt ab.

```json
{ "v": 2, "quelle": "bookledgerpro", "art": "status",
  "verweise": { "blpAngebotNr": "AN-2026-0042", "blpAngebotId": "angebot_…", "wfAuftragNr": "2026-0007" },
  "stand": "rechnung",            // oder "bezahlt"
  "rechnungNr": "R-2026-0001", "rechnungDatum": "2026-10-27", "bezahltAm": "", "datum": "2026-10-27" }
```

Der WorkFloh (`vorgangStandZeigen`, identisch in beiden) sucht den Auftrag über `wfAuftragNr` (sonst `blpAngebotId`/`-Nr`),
zeigt ein **Blatt** „Stand aus BookLedgerPro" und ändert **erst auf „Übernehmen"**: Notiz in der Akte („BookLedgerPro:
Rechnung R-2026-0001 festgeschrieben vom 27.10.2026" / „… bezahlt am …"), Felder `blpRechnungNr`/`blpRechnungAm`/
`blpBezahltAm` (im Editor unter „Verbund"), und **nur wenn die Statuskette** einen passenden Status kennt (`bezahlt`/
`abgerechnet` bzw. `abgerechnet`/`rechnung_gestellt`/`rechnung`) **und der Haken steht**, den Status. Unbekannter Auftrag
→ Toast „nicht gefunden", nichts geändert; unbekannter `stand` → „nicht lesbar". Härtung wie R1 (Strings gekappt, `v`/`quelle`
geprüft).

### Proben

BLP `tests/run.mjs` „Rundlauf WorkFloh ⇄ BLP" (+22) und „Rundlauf R3" (+8) · `tests/smoke_vorgang.mjs` (echter Tresor: R1 Adresse + Nutzlast
+ Vermerk + Ziel-Einstellung, R2 Treffer/kein Treffer, Rechnungs-Entwurf, R3 Entwurf-Halt/festgeschrieben/bezahlt mit Ziel aus der Quelle; 32 grün) · WorkFlohs `browser_vorgang.mjs`
(identisch; `scripts/` bzw. `tests/`: Editor zur Prüfung, nichts gespeichert, Speichern legt Auftrag + Kunde an, Sender
trägt Verweise, Doppel-Erkennung, Müll/fremde Quelle, Datenschutz). Gegenproben in Wegwerf-Kopien: je Sabotage eine
eigene rote Zeile (BLP 3 Fälle, WorkFloh 4 Fälle).

## Grenzen / bewusst NICHT

- Kein Auto-Speichern, keine Nummernvergabe, kein Festschreiben — Hoheit
  bleibt beim Menschen (GoBD).
- Der Rückkanal (Rechnungs-Nr., festgeschrieben, bezahlt) ist R3 (oben); „bezahlt" ist dort eine Angabe von Hand, kein Zahlungsabgleich.
- Vertrag erweitern ⇒ `v` erhöhen und diese Datei zuerst pflegen
  (Spec vor Code).
