# KI-Konzept — On-Device-first + EU-Cloud, strikt opt-in (ehrlich)

BookLedgerPro nutzt KI, um aus Belegen Buchungsvorschläge zu machen — **datenschutz-
freundlich, mit Datenresidenz in der EU** und ohne den Offline-Anspruch zu brechen.

## Drei Ebenen

1. **On-Device (Standard, kein Netz):**
   - `ai/extract.js` — Regex-Heuristik: Bruttobetrag, Datum, USt-Satz, Vendor aus Beleg-
     **Text**.
   - `ai/categorize.js` — Schlüsselwort-Heuristik Vendor/Text → SKR03-Konto + Richtung.
     Dient zugleich als **Fallback**, wenn keine Cloud-KI konfiguriert ist.
   - `ai/suggest.js` — setzt beides zu einem ausgeglichenen Buchungssatz zusammen.

2. **Texterkennung (OCR) — Google Cloud Vision, EU-Endpoint** (`ai/vision.js`):
   - Endpoint **`https://eu-vision.googleapis.com/v1`** (Verarbeitung in der EU).
   - **Foto/Kamera/Scanner/Bild → `images:annotate`**, **PDF → `files:annotate`**,
     Feature `DOCUMENT_TEXT_DETECTION`, Text aus `fullTextAnnotation.text`.
   - Auth über eigenen API-Schlüssel (`?key=…`), BYOK. Vorgehen wie **Mein-WorkFloh**.

3. **Textsortierung/Kontierung + Steuer-Assistent — Mistral, EU** (`ai/mistral.js`):
   - **`https://api.mistral.ai/v1/chat/completions`** (OpenAI-kompatibel, Bearer-Key, EU).
   - Modelle `mistral-small-latest` (Standard) / `mistral-large-latest`.
   - Kontierung gibt nur ein erlaubtes SKR03-Konto + Richtung als JSON zurück; bei
     Nichtkonfiguration/Fehler **Fallback auf die On-Device-Heuristik**.

## Daten- & Datenschutz-Regeln (verbindlich)
- Cloud-KI ist **standardmäßig aus**. Schlüssel (Vision + Mistral) werden **verschlüsselt**
  lokal gespeichert (Sitzungs-Key), nie im Klartext exportiert.
- **Jede** Übertragung erfordert eine **ausdrückliche Bestätigung** (Beleg verlässt das
  Gerät → Verarbeitung in der EU).
- **Datenminimierung:** Der Steuer-Assistent sendet nur **aggregierte Kennzahlen**
  (keine Einzelbelege/Personendaten). Die Texterkennung sendet das gewählte Beleg-Bild/PDF
  nur auf Bestätigung.

## Pipeline (Beleg → Buchung)
`Foto/PDF` → **Google Vision EU** (OCR-Text) → `ai/extract` (Felder) →
**Mistral EU** (Kontierung, sonst Heuristik) → `ai/suggest` (Buchungsvorschlag) →
Entwurf (Festschreiben bleibt manuell, GoBD). Der **KI-Autonomie-Schalter** steuert, ob
der Vorschlag nur angezeigt oder automatisch als Entwurf gespeichert wird.

## Ehrlich offen / geplant
- **Vision-/Mistral-Pfade sind korrekt implementiert, aber in der Bau-Umgebung NICHT gegen
  die Live-APIs getestet** (kein Schlüssel/Netz). Reine Request-/Parser-Logik ist
  node-getestet; vor produktiver Nutzung einmal real verifizieren.
- Lokales Offline-OCR (z.B. Tesseract.js) und semantische On-Device-Embeddings sind weiter
  optionale Folgeschritte; der EU-Cloud-Pfad ist der primäre.
