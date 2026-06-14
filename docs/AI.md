# KI-Konzept — On-Device-first, extern strikt opt-in (ehrlich)

BookLedgerPro nutzt KI, um aus Belegen Buchungsvorschläge zu machen — **ohne** den
Datenschutz- und Offline-Anspruch zu brechen.

## Zwei Ebenen

1. **On-Device (Standard, immer verfügbar, kein Netz):**
   - `ai/extract.js` — Regex-Heuristik: Bruttobetrag (bevorzugt Summen-Zeilen), Datum,
     USt-Satz, Vendor aus Beleg-**Text**.
   - `ai/categorize.js` — Schlüsselwort-Heuristik Vendor/Text → SKR03-Konto + Richtung
     (Einnahme/Ausgabe).
   - `ai/suggest.js` — setzt beides zu einem ausgeglichenen Buchungssatz zusammen
     (korrekte Soll/Haben-Seiten + USt-Aufteilung).
   - Alles rein, deterministisch, node-getestet.

2. **Externe KI (opt-in, BYOK):**
   - `ai/provider.js` — Claude (Anthropic) Vision per **eigenem API-Schlüssel**.
     Wandelt ein Beleg-**Bild** in dieselben Felder, die dann durch `categorize`/`suggest`
     laufen. Modelle: neueste Claude-Familie (Sonnet 4.6 Standard, Opus 4.8 für schwierige
     Belege, Haiku 4.5 günstig).

## Datenschutz-Regeln (verbindlich)
- Externe KI ist **standardmäßig aus**. Sie wird pro Mandant aktiviert.
- Der API-Schlüssel wird **verschlüsselt** (Sitzungs-Key) lokal gespeichert, nie im
  Klartext exportiert.
- **Jeder** externe Aufruf sendet Beleg-Daten an Anthropic und erfordert eine
  **ausdrückliche Bestätigung** in der UI („Beleg verlässt das Gerät").
- On-Device-Pfad bleibt vollwertig nutzbar, falls externe KI nie aktiviert wird.

## KI-Autonomie-Schalter (Einstellungen → wirksam)
- **Nur Vorschläge:** Vorschlag wird angezeigt, nichts gespeichert; Nutzer übernimmt.
- **Auto-Entwurf + Review:** Vorschlag wird automatisch als **Entwurf** gespeichert,
  sichtbar zur Prüfung.
- **Autonom bei hoher Konfidenz:** Entwurf wird still angelegt.
- **In KEINER Stufe** wird automatisch **festgeschrieben** — das bleibt ein bewusster,
  menschlicher Schritt (GoBD-Unveränderbarkeit). Bewusste, ehrliche Grenze.

## Ehrlich offen / geplant
- **Lokales OCR (Tesseract.js)** ist NICHT eingebunden. Bild→Text geht derzeit nur über
  Claude-Vision (BYOK) oder eingefügten/abgetippten Text. Vendoring der Bibliothek
  (build-frei) ist ein Folgeschritt (Phase 2.x).
- **Semantische On-Device-Embeddings (Transformers.js, `Xenova/multilingual-e5-small`,
  384-dim — wie Sage)** sind geplant; bis dahin Schlüsselwort-Heuristik.
- Der **Claude-API-Pfad ist korrekt implementiert, aber in der Bau-Umgebung nicht gegen
  die Live-API getestet** (kein Schlüssel/Netz). Vor produktiver Nutzung einmal real
  verifizieren.
