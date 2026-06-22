# TESTPLAN — offene Browser-Tests (temporär)

> Diese Liste gehört zu den **In-App-Test-Marken** (`src/ui/testmarke.js`). An jeder Stelle
> mit offenem Browser-Test sitzt in der App eine kleine Marke **„🧪 Test offen"** → antippen
> macht **„✅ getestet"** (in `localStorage` gemerkt, übersteht Reload).
>
> **Prinzip:** Die Marke sitzt direkt beim zu testenden Knopf. **Fehlt der Knopf, fehlt die
> Marke** — so fällt ein „unsichtbar fehlender" Knopf beim Abhaken sofort auf.
>
> **Wenn alles abgehakt ist:** mir „beendet" sagen. **Entfernen** dann so:
> 1. `TEST_MARKEN_AKTIV = false` in `src/ui/testmarke.js` → alle Marken weg (Code bleibt),
>    oder direkt die `testMarke(...)`-Aufrufe + diese Datei + das Modul + die CSS-Regel löschen.
> 2. `CACHE_VERSION` in `sw.js` erhöhen (Shell-Änderung).

## Offene Tests (Marken-IDs)

| ID (localStorage `blpr.testmarke.<ID>`) | Wo in der App | Was prüfen |
|---|---|---|
| `beleg-ocr` | **Belege** → Beleg-Liste → Knopf **„Texterkennung (Google Vision EU)"** (nur sichtbar, wenn Vision konfiguriert) | Beleg fotografieren/hochladen → Texterkennung → es erscheint eine **Buchungsvorschlag-Karte** (Datum/Betrag/Konto plausibel). |
| `beleg-richter` | **Belege** → in jeder **Buchungsvorschlag-Karte** → aufklappbar **„Konto-Vorschlag (SBKIM-Richter)"** → Knopf **„Konto vorschlagen"** | Aufklappen → „Konto vorschlagen" → beim 1. Mal lädt das Embedding-Modell (~30 MB) → es kommen **Konten-Kandidaten mit Score** (ohne Mistral-Schlüssel: Vorfilter; mit: Richter-Urteil + Begründung). |
| `sbkim-konten` | **SBKIM-Suche** → Bereich **„Konten"** → Knopf **„Suchen"** | Stichwort (z. B. „Tanken") → „Suchen" → passende Konten erscheinen (Modell-Laden beim 1. Mal). |
| `sbkim-knoten` | **SBKIM-Suche** → Bereich **„Knoten (Mycel)"** → Knopf **„🜲 mein Knoten ↔ Netz"** | „🜲 mein Knoten ↔ Netz" → andere Mycel-Knoten erscheinen; Badge zeigt **`Domäne`** (solange Sage kein cap/needs hat; später **`Schichten`**). |

## Hinweis zum Abhaken

- Eine Marke, die du **nicht** finden/abhaken kannst, bedeutet: der zugehörige Knopf wird
  nicht angezeigt → das ist selbst ein Befund (bitte melden, an welcher Stelle).
- `beleg-ocr` erscheint nur, wenn der Google-Vision-Schlüssel in den KI-Einstellungen
  hinterlegt **und** „aktiv ✓" ist — sonst ist der OCR-Knopf (korrekterweise) ausgeblendet.
