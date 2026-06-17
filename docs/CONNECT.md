# CONNECT.md — Offene Anbindung an andere Buchhaltungssoftware

BookLedgerPro ist **anbindbar in beide Richtungen** und bindet sich nicht an einen Anbieter:
Daten lassen sich über ein **offenes, versioniertes JSON-Austauschformat** ein- und ausgeben.
Damit kann **Mein-WorkFloh** (public) ebenso andocken wie **andere Buchhaltungssoftware**.

## Wo in der App
**Aufträge → Karte „Aus WorkFloh importieren":**
- **Import:** „Austausch-Datei wählen" (akzeptiert das Format unten **und** das alte WorkFloh-`{kunden,auftraege}`).
- **Export:** „Austausch-Datei exportieren" — lädt Kunden + Aufträge im offenen Format herunter.

## Format (Version 3)
```json
{
  "format": "bookledgerpro-austausch",
  "version": 3,
  "erzeugt": "2026-06-17T00:00:00.000Z",
  "kunden": [
    { "externId": "K-1001", "name": "Beispiel GmbH", "adresse": "Weg 2, 50667 Köln", "email": "a@b.de", "ustId": "DE123456789" }
  ],
  "auftraege": [
    { "externNummer": "A-2026-1", "kundeExternId": "K-1001", "titel": "Auftrag X",
      "positionen": [ { "beschreibung": "Leistung", "menge": 1, "einzelpreisCent": 100000, "ustSatz": 19 } ],
      "rechnung": { "nummer": "2026-0001", "datum": "2026-06-01", "leistungsdatum": "2026-06-01",
        "zahlungen": [ { "datum": "2026-06-05", "betragCent": 60000, "ref": "VZ-2026-0001" } ] } }
  ]
}
```
- **`rechnung` (optional, R4 Stufe 2 — Rechnungs-Übernahme):** eine bereits gestellte Rechnung.
  Beim Import erzeugt BLP daraus direkt einen Buchungs-Entwurf (Forderung an Erlöse + USt) mit der
  **gelieferten** Nummer/Datum (keine neue BLP-Nummer) und setzt den Auftrag auf „berechnet"
  (Festschreiben bleibt manuell, GoBD). Beim Export trägt ein **berechneter** Auftrag seine Rechnung
  reziprok mit.
- **`rechnung.zahlungen[]` (optional, R4-Rest — Zahlungs-/Teilzahlungs-Übernahme, v3):** in der
  Quelle bereits erfasste Zahlungseingänge `{ datum, betragCent|betrag, ref? }`. Beim Import erzeugt
  BLP je Zahlung einen Zahlungseingang-Buchungs-Entwurf (Bank an Forderung) + vermerkt die
  (Teil-)Zahlung am Auftrag (Auto-„bezahlt" bei Ausgleich; Festschreiben manuell, GoBD). Beim Export
  trägt ein berechneter Auftrag seine erfassten Zahlungen reziprok mit.
- **Abwärtskompatibel:** Ein „bare" `{ "kunden": [...], "auftraege": [...] }` ohne `format/version`
  wird ebenso akzeptiert wie Version 1/2 (ohne `rechnung`/`zahlungen`).
- `einzelpreisCent` (Integer) **oder** `einzelpreis` (Euro-String) sind erlaubt; fehlender `ustSatz` wird beim Import ergänzt (Default, editierbar).
- `externId`/`externNummer` dienen der **Idempotenz/Dedupe** (Mehrfach-Import erzeugt keine Dubletten).

## So bindet eine andere Software an
1. **An BLP liefern:** Datei im obigen Format erzeugen → in BLP über „Import" einlesen.
2. **Aus BLP übernehmen:** in BLP „Austausch-Datei exportieren" → in der anderen Software einlesen.
3. Verlinkung zur Partner-App: in **Einstellungen → „Verbundene App"** (URL hinterlegbar, öffnet die Partner-Seite). WorkFloh ist public und kann reziprok auf BLP verlinken.

## Ehrliche Grenzen
- Aktuell Datei-basiert (Import **und** Export). Eine **API/Push**-Anbindung (Echtzeit) ist noch nicht gebaut.
- Übertragen werden **Kunden + Aufträge** (inkl. Positionen), optional eine **bereits gestellte
  Rechnung** (R4 Stufe 2 → Buchungs-Entwurf/Forderung) und optional deren **(Teil-)Zahlungen**
  (R4-Rest → Zahlungseingang-Entwurf/Bank an Forderung). **Festschreiben** bleibt in BLP (GoBD).
- Offline-first/Krypto-Disziplin gewahrt; Anbindung ist **opt-in**, kein Zwang.
