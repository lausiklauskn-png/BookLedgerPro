# CONNECT.md — Offene Anbindung an andere Buchhaltungssoftware

BookLedgerPro ist **anbindbar in beide Richtungen** und bindet sich nicht an einen Anbieter:
Daten lassen sich über ein **offenes, versioniertes JSON-Austauschformat** ein- und ausgeben.
Damit kann **Mein-WorkFloh** (public) ebenso andocken wie **andere Buchhaltungssoftware**.

## Wo in der App
**Aufträge → Karte „Aus WorkFloh importieren":**
- **Import:** „Austausch-Datei wählen" (akzeptiert das Format unten **und** das alte WorkFloh-`{kunden,auftraege}`).
- **Export:** „Austausch-Datei exportieren" — lädt Kunden + Aufträge im offenen Format herunter.

## Format (Version 1)
```json
{
  "format": "bookledgerpro-austausch",
  "version": 1,
  "erzeugt": "2026-06-17T00:00:00.000Z",
  "kunden": [
    { "externId": "K-1001", "name": "Beispiel GmbH", "adresse": "Weg 2, 50667 Köln", "email": "a@b.de", "ustId": "DE123456789" }
  ],
  "auftraege": [
    { "externNummer": "A-2026-1", "kundeExternId": "K-1001", "titel": "Auftrag X",
      "positionen": [ { "beschreibung": "Leistung", "menge": 1, "einzelpreisCent": 100000, "ustSatz": 19 } ] }
  ]
}
```
- **Abwärtskompatibel:** Ein „bare" `{ "kunden": [...], "auftraege": [...] }` ohne `format/version` wird ebenfalls akzeptiert.
- `einzelpreisCent` (Integer) **oder** `einzelpreis` (Euro-String) sind erlaubt; fehlender `ustSatz` wird beim Import ergänzt (Default, editierbar).
- `externId`/`externNummer` dienen der **Idempotenz/Dedupe** (Mehrfach-Import erzeugt keine Dubletten).

## So bindet eine andere Software an
1. **An BLP liefern:** Datei im obigen Format erzeugen → in BLP über „Import" einlesen.
2. **Aus BLP übernehmen:** in BLP „Austausch-Datei exportieren" → in der anderen Software einlesen.
3. Verlinkung zur Partner-App: in **Einstellungen → „Verbundene App"** (URL hinterlegbar, öffnet die Partner-Seite). WorkFloh ist public und kann reziprok auf BLP verlinken.

## Ehrliche Grenzen
- Aktuell Datei-basiert (Import **und** Export). Eine **API/Push**-Anbindung (Echtzeit) ist noch nicht gebaut.
- Übertragen werden **Kunden + Aufträge** (inkl. Positionen). Rechnung/USt-Buchung/Festschreibung erfolgen in BLP (GoBD bleibt hier).
- Offline-first/Krypto-Disziplin gewahrt; Anbindung ist **opt-in**, kein Zwang.
