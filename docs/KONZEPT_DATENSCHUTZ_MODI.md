# KONZEPT — Datenschutz-Modi (KI-Datensparsamkeit)

> Status: Bau-Schritt 1 + 2 umgesetzt (siehe §6). Dieses Dokument wurde während der
> Umsetzung nachgereicht (es war in frühen Aufgaben referenziert, aber noch nicht im
> Repo). Es schreibt die Modi und die Bau-Reihenfolge verbindlich fest.

## 1. Ziel
Wenn Belegtexte zur Kontierung/Begründung an die **EU-KI (Mistral)** gehen, sollen
**bekannte personenbezogene/eigene Identifikatoren** das Gerät möglichst nicht im
Klartext verlassen — ohne die fachliche Qualität (Konto, Richtung, Begründung) zu
verlieren. DSGVO-Datenminimierung als Architektur, nicht als nachträglicher Aufsatz
(CLAUDE.md Regel 4, 5, 8).

## 2. Grundidee — Pseudonymisierung mit Re-Identifizierung
Die App kennt ihre Identifikatoren bereits **exakt** aus den eigenen Stammdaten
(Kunden, Mitarbeiter, Firmenprofil). Vor dem Senden werden diese **exakten Anker**
durch **stabile Token** ersetzt (`[[TYP_N]]`); die KI sieht nur Platzhalter, antwortet,
und die Antwort wird **verlustfrei re-identifiziert**. Kein NER/keine Heuristik →
deterministisch, build-frei, node-testbar.

> „Anker = exakter Identifikator". Bewusst KEINE Mustererkennung fremder Daten
> (z.B. Vendor-Namen auf Eingangsrechnungen): die App maskiert nur, was sie sicher
> als eigen/personenbezogen kennt. Über-Maskieren ist datenschutz-seitig die sichere
> Richtung (eher zu viel als zu wenig).

## 3. Modi (Setting `datenschutzModus`)
- **`aus`** (Standard): Belegtext geht unverändert an Mistral (bestehendes Verhalten).
- **`pseudonym`**: bekannte Anker werden vor dem Versand maskiert, Antwort
  re-identifiziert.

Cloud-KI ist ohnehin **opt-in/BYOK** und standardmäßig aus; der Modus wirkt nur, wenn
Mistral konfiguriert ist. Die **Beleg-Texterkennung (Google Vision)** sendet weiterhin
das **Bild** (separat bestätigt) — Bild-Pseudonymisierung ist NICHT Teil dieses Konzepts.

## 4. Was maskiert wird / was nicht
- **Maskiert (Anker, `ai/anker.js`):** Kunden-/Mitarbeiter-/Firmenname, Anschrift,
  IBAN, USt-IdNr., Steuernummer, E-Mail. Sehr kurze Werte (< 3 Zeichen) verworfen.
- **Bewusst NICHT maskiert:** Betrag, Datum, USt-Satz, Kontonummern — die braucht die
  KI für die Kontierung; sie sind nicht personenbeziehbar im Sinne des Schutzbedarfs.

## 5. Architektur / Wo was liegt
- `src/ai/pseudonym.js` — **reines Logik-Modul** (Bau-Schritt 1): `tokenize`/
  `reidentify`, stabile Token, Longest-Match, opt-in Wortgrenzen-Modus, First-Char-Index,
  `ANKER_TYP`-Vokabular. Kein Netz/keine Krypto.
- `src/ai/anker.js` — **Anker-Quelle** (Bau-Schritt 2): `baueAnker()` (rein, getestet)
  + `ladeAnker()` (liest CRM/Settings; Browser/IndexedDB).
- `src/ai/mistral.js` `categorize(text, idx, {anker})` — maskiert den GESENDETEN Text;
  Antwort ist `{konto,richtung}` → kein reidentify nötig.
- `src/ai/berater.js` `begruendeBuchung(kontext, {anker})` — maskiert Beschreibung/
  Belegtext, **re-identifiziert** die formulierte Antwort (sie kann den Text zitieren).
- `src/ui/views/documents.js` — lädt Anker nur bei Modus `pseudonym` und reicht sie an
  beide KI-Aufrufe.
- `src/state.js` — `datenschutzModus` (Default `aus`); `src/ui/shell.js` — Umschalter in
  den Einstellungen; `src/ui/i18n.js` — Texte de/en.

## 6. Bau-Reihenfolge
1. **Reines Logik-Modul** `pseudonym.js` + Node-Tests. ✅ (PR #40; danach gehärtet:
   Wortgrenzen-Modus, First-Char-Index, `ANKER_TYP`.)
2. **Anker-Quelle + Pipeline-Verdrahtung + Modus-Schalter** (dieses Schritts):
   `anker.js`, Einhängen in `mistral.categorize`/`berater.begruendeBuchung`, Setting +
   UI-Schalter, SW-Cache-Bump. ✅
3. **Folgeschritte (offen):**
   - Steuer-Assistent (`taxAssist`/`mistral.erklaereSteuer`) sendet bereits nur
     **aggregierte Kennzahlen** (Datenminimierung) — Pseudonymisierung dort optional.
   - Sichtbarkeits-/Vertrauens-UI: dem Nutzer den maskierten Text vor dem Senden
     **anzeigen** (Transparenz), evtl. Zähler „N Identifikatoren ersetzt".
   - Bild-/OCR-Pfad (Vision) bleibt bewusst außen vor (Bild kann nicht
     anker-basiert maskiert werden); ggf. späterer Hinweis-/Schwärzungs-Workflow.
   - AVV-Hinweis im Datenblatt (Mistral/Google als Auftragsverarbeiter).

## 7. Ehrlich offen / NICHT geprüft
- Reine Logik (`pseudonym.js`, `anker.baueAnker`) ist **node-getestet** (264/264).
- `ladeAnker()` und die UI-Verdrahtung (documents.js, Settings-Schalter) sind
  **nicht headless-E2E** geprüft (kein Headless-Browser in der Bau-Umgebung) und die
  Mistral-Pfade nicht gegen die Live-API getestet.
- Over-Masking-Restrisiko: ein kurzer/gängiger Kundenname kann legitime Vorkommen
  überdecken; der Wortgrenzen-Modus mildert das, ist aber keine Garantie. Round-Trip
  bleibt in jedem Fall verlustfrei.
