# Plan: Rundlauf Angebot ⇄ Auftrag ⇄ Rechnung zwischen BookLedgerPro und den WorkFlohs (2026-10-26)

**Nur Plan, nichts gebaut.** Klaus (2026-10-26): „Mein WorkFloh und Tomys WorkFloh sollten auch eine Integration in
BookLedgerPro haben … Angebote, die in BookLedgerPro erstellt werden oder in Calculate oder auch in Needs, sollten in
WorkFloh weitergegeben werden können und von WorkFloh weiter zur Buchhaltung und von der Buchhaltung wieder zurück zum
WorkFloh. Wenn in der Buchhaltung ein Angebot gemacht wird, dann sollte es weitergegeben werden können zum WorkFloh, als
Auftrag verarbeitet werden, wenn es angenommen wurde, genauso der Rückweg wieder."

## Was heute schon da ist (gemessen im Code, Stand 2026-10-26)

| Weg | Wie | Stand |
|---|---|---|
| **WorkFloh → BLP, Angebot** | Knopf „💶 Angebot in BLP" am Auftrag → `wfBlp('angebot')` → BLP `?uebernahme=<base64url(JSON)>` (Datenvertrag v1, `docs/UEBERNAHME_TOMY.md`) → Angebots-Formular vorbefüllt, Kunde per Name zugeordnet, nichts automatisch gespeichert | **gebaut**, Mein-WorkFloh (`isd-workfloh`) und Tomys WorkFloh (`tomy-workfloh`) parallel |
| **WorkFloh → BLP, Rechnung** | Knopf „🧾 Rechnung in BLP" nur an einem fertigen Auftrag → `wfBlp('rechnung')` → dasselbe Formular, Banner weist auf „Rechnung aus Angebot" (GoBD: Rechnungsnummer entsteht nur manuell) | **gebaut** |
| **WorkFloh → BLP, Datei** | Menü Aufträge → „Aus WorkFloh importieren" (JSON mit Kunden, Aufträgen, optional Rechnung + Zahlungen, `docs/WORKFLOH_IMPORT.md`) | **gebaut** (Export auf WorkFloh-Seite ist der offene Teil dieses Vertrags) |
| **Calculate → BLP** | im eingebetteten Angebotsplaner „🧾 An BookLedgerPro" → Brücke fängt den Sprung (`blp-uebernahme`) → Angebots-Formular (v1, Quelle `workflow-calculate`) | **gebaut** (#354) |
| **Needs → BLP** | keine Übergabe; Needs ist eine Bedarfsanalyse ohne Positionen/Preise | — |
| **BLP → WorkFloh** | — | **fehlt ganz**: kein Knopf, kein Vertrag, kein Empfänger in WorkFloh |
| **Status zurück** (Auftrag fertig / Rechnung gestellt / bezahlt) | WorkFloh schickt `auftragNr` mit; BLP merkt sie am Angebot, meldet aber nichts zurück | **fehlt**: der Rückkanal |

Alle Apps liegen unter **derselben Adresse** (`lausiklauskn-png.github.io/…`), deshalb trägt der Weg per Adresse
(`?uebernahme=`) ohne Server. Für die **nativen** Fassungen (BookLedgerPro Pro, später WorkFloh Pro) ist derselbe
Vertrag als **Teilen-Datei** (`.json`, eine Datei je Übergabe) der Weg — Android-Teilen kennt beide Apps.

## Was gebaut werden soll: ein Vertrag, drei Richtungen

**Datenvertrag v2 „Vorgang"** — dieselbe JSON-Hülle wie v1 (`quelle`, `art`), erweitert um Verweise, damit der Rundlauf
zusammenhält:

```json
{ "v": 2, "quelle": "bookledgerpro", "art": "auftrag",
  "verweise": { "blpAngebotNr": "A-2026-0012", "blpKundeId": "k_…", "wfAuftragNr": "" },
  "titel": "Vereins-Tassen", "kundeName": "SV Blau-Weiß 09", "kunde": { "adresse": "…", "email": "…" },
  "positionen": [ { "beschreibung": "…", "menge": 10, "einzelpreisCent": 1290, "ustSatz": 19 } ],
  "status": "angenommen", "datum": "2026-10-26" }
```

| Schritt | Richtung | Auslöser und Ergebnis |
|---|---|---|
| **R1 BLP → WorkFloh: Auftrag anlegen** | hin | Am **angenommenen** Angebot in BLP (Status `angenommen`, Calculate-Angebote laufen über dasselbe Formular) steht **„🛠 Als Auftrag an WorkFloh"** (Wahl: Mein WorkFloh · Tomys WorkFloh, gemerkt). BLP öffnet WorkFloh mit `?vorgang=<base64url(JSON)>`; WorkFloh legt **einen neuen Auftrag im Status „angebot"/„freigabe"** an (Kunde per Name/externId zugeordnet oder angelegt, Positionen in die Auftragsfelder), zeigt ihn **zur Prüfung** und speichert erst auf Tipp. Der Auftrag trägt `blpAngebotNr`; BLP merkt am Angebot „→ WorkFloh A-2026-0007" (Feld `wfAuftragNr`, sobald WorkFloh es zurückmeldet, siehe R3). |
| **R2 WorkFloh → BLP: Rechnung** | zurück | **gibt es** („🧾 Rechnung in BLP"). Neu: schickt `verweise.blpAngebotNr` mit; BLP hängt den Rechnungs-Entwurf an **dasselbe** Angebot statt ein zweites anzulegen (heute: immer neues Formular). |
| **R3 Status zurück: BLP → WorkFloh** | zurück | Wenn in BLP die Rechnung festgeschrieben oder als bezahlt verbucht ist: **„↩ Stand an WorkFloh melden"** → `?vorgang=` mit `art: "status"`, `wfAuftragNr`, `rechnungNr`, `bezahltAm`. WorkFloh setzt den Auftrag auf „Abgerechnet"/„Bezahlt" (neue Stufen am Ende seiner Statuskette) und zeigt Rechnungsnummer und Datum am Auftrag. |
| **R4 Needs** | hin | Bedarfsanalyse hat keine Preise. Sinnvoll: Needs → Calculate (Bedarf wird Angebot) ist Sache der beiden Apps; BLP greift erst beim Angebot. **Kein eigener BLP-Weg** (Frage D22). |

**Regeln, die bleiben:** nichts wird automatisch gespeichert, immer Vorschau und ein Tipp (GoBD, Klaus' Linie seit v1) ·
Rechnungsnummern entstehen nur in BLP · der Kunde wird per Name/externId zugeordnet, nie still doppelt angelegt · jede
Übergabe hat die Verbrauchs-Semantik (Adresse sofort gesäubert, Daten nur im RAM) · der Vertrag steht **einmal** in
`docs/UEBERNAHME_TOMY.md` (v2 ergänzt v1, v1 bleibt lesbar) und wird in **beiden** WorkFlohs parallel gebaut (Klaus' Regel
2026-07-06). Die zwei Adressen (`?uebernahme=` in BLP, `?vorgang=` in WorkFloh) sind der PWA-Weg; dieselbe JSON als
`.json`-Datei über Teilen/„Öffnen mit" ist der Weg der nativen Apps (BLP nimmt heute PDF/Bilder an, `.json` kommt dazu).

## Umfang je Repo

- **BookLedgerPro:** `src/domain/vorgang.js` (reine Rechnung: v2 bauen/lesen, Verweise, Status), Knopf am angenommenen
  Angebot, Statusmeldung an WorkFloh, `uebernahmeExtern.js` liest `verweise` und hängt R2 ans vorhandene Angebot,
  `share_target` nimmt `.json` an, Proben (`run.mjs`, `smoke_teilen`), Vertrag in `docs/UEBERNAHME_TOMY.md`.
- **Mein-WorkFloh und Tomys WorkFloh (parallel):** Empfänger `?vorgang=` (Auftrag anlegen mit Vorschau, Status setzen),
  `wfBlp` schickt `verweise`, zwei neue Statusstufen, Proben (`browser_*.mjs`), Datenschutz-Text (BLP öffnet die andere App).
- **Calculate/Needs:** nichts; der Weg läuft über BLPs Angebot.

## Fragen an Klaus

- **D21 Reihenfolge:** R1 (BLP → WorkFloh Auftrag) zuerst, dann R2-Verweis, dann R3 Status? Oder R3 vor R2?
- **D22 Needs:** kein eigener BLP-Weg, sondern Needs → Calculate → BLP — einverstanden?
- **D23 Tomys WorkFloh:** parallel in beiden WorkFlohs bauen (Regel 2026-07-06) — auch wenn Tomy sein eigenes BookLedger nutzt?
- **D24 Einordnung:** vor oder nach Steuer/ELSTER (D17–D20) und Ü1 Übersetzung? Vorschlag: R1 + R2 als **ein** PR-Paar
  (BLP + Mein-WorkFloh) vor Ü1, weil es Klaus' Alltag (Angebot → Auftrag) direkt trägt; R3 danach.

## Grenzen, vorab benannt

- Kein Server, kein Abgleich im Hintergrund: jeder Schritt ist ein Tipp in der einen App und eine Vorschau in der anderen.
- Die nativen Apps teilen keinen Speicher; dort geht nur Teilen/„Öffnen mit" (nicht gemessen, bis WorkFloh Pro existiert).
- Doppelte Aufträge, wenn R1 zweimal getippt wird: WorkFloh erkennt `blpAngebotNr` und fragt „schon vorhanden — öffnen oder neu?".
