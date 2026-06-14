# Sitzungs-Log

Chronologische Notizen über Sitzungen hinweg. Neueste oben. Pflicht-Felder:
**Datum · Was getan · Stand · Offen/Nächstes.**

---

## 2026-06-14 — KI-Berater im Beleg-Vorschlag (documents.js) konsistent

**Was getan** (Abrundung des KI-Berater-Features)
- Beleg-Vorschlag (Foto/PDF & Schnellerfassung) zeigt jetzt ebenfalls ein **Begründungs-
  Feld mit §-Bezug**: on-device aus `rechtsregeln.js` vorbefüllt (kein Netz), per Knopf
  „KI-Begründung" über Mistral (EU, opt-in) verfeinerbar; wird mit dem Entwurf gespeichert
  (`saveEntwurf({begruendung})`). Quelltext (OCR/Eingabe) fließt als Kontext ein.
- SW-Cache `v28→v29`. Keine neuen Module/Logik → bestehende **174/174 Tests** weiter grün.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check src/ui/views/documents.js`.
**Nicht verifiziert:** UI nicht headless-E2E geklickt (reine Wiring-Änderung; genutzte Logik
`onDeviceBegruendung`/`begruendeBuchung` ist node-getestet).

**Offen / Nächstes:** Regel-Set erweitern; EÜR §4(3) + DATEV-EXTF (eigener PR). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Berater mit Rechts-Grundlage (Begründung/Notiz mit §-Bezug)

**Was getan** (eigener PR nach Merge von #15)
- **Grounding statt Halluzination:** NEU `src/domain/rechtsregeln.js` — kuratiertes lokales
  Regel-Set (Bewirtung §4(5)2, Geschenke §4(5)1, GWG §6(2), Kfz-Privatnutzung §6(1)4,
  Telekommunikation, Reisekosten, Kleinunternehmer §19) mit Paragraph + Kurzregel +
  Doku-Hinweis. `findeRechtsregeln(kontext)` + `onDeviceBegruendung(kontext)`.
- **KI-Berater:** NEU `src/ai/berater.js` — `begruendeBuchung(kontext)` schlägt eine kurze
  Begründung MIT §-Bezug vor (Eigenbeleg/Notiz, „parat fürs Finanzamt"). Über Mistral (EU,
  BYOK) wird nur FORMULIERT, gegroundet auf die Regeln; ohne Mistral On-Device-Fallback aus
  den Regeln. `buildBegruendungMessages`/`parseBegruendung` rein & node-getestet. Disclaimer
  „keine Steuerberatung". Nutzer entscheidet/editiert.
- **Datenmodell:** `begruendung`-Feld an der Buchung (`store.js saveEntwurf`); in die GoBD-
  Hash-Kette aufgenommen, aber **rückwärtskompatibel** (nur gehasht wenn vorhanden →
  Altbestände behalten ihren Hash). `audit.js hashedFields` entsprechend angepasst.
- **UI Journal:** Begründungs-Textfeld + Knopf „KI-Begründung vorschlagen" (zeigt Quelle
  Mistral/on-device), Anzeige 📝 in der Tabelle. i18n de/en. SW-Cache `v27→v28`,
  `rechtsregeln.js`+`berater.js` in CORE_ASSETS, 56 JS-Module.
- `tests/run.mjs`: +12 (Rechtsregeln, Prompt/Parser, On-Device-Fallback). **174/174 grün**.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral-Begründung im Browser; das neue Journal-UI
(Begründungsfeld/KI-Knopf) nicht headless-E2E geklickt. Regel-Set ist bewusst kompakt
(erweiterbar), KEINE abschließende Rechtsberatung/Aktualitätsgarantie.

**Offen / Nächstes:** Regel-Set erweitern; Begründung auch im Beleg-Vorschlag (documents);
EÜR §4(3) Zufluss/Abfluss + zertifiziertes DATEV-EXTF. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — USt-Verprobung + Kleinunternehmer-Schalter (Berater-Substanz)

**Was getan** (Folge-Batch zur Profi-Härtung, gleiche PR-Branch)
- **USt-Verprobung** (`src/domain/taxes.js` → `verprobeUSt`): reiner Berater-Check, der die
  GEBUCHTE Vor-/Umsatzsteuer mit der aus Netto×Satz ERWARTETEN vergleicht (pro Buchung/Satz
  gerundet → keine Rundungs-Fehlalarme). Deckt vergessene/falsch gerechnete USt auf. In den
  Auswertungen als grün/rot-Karte (`verprobungCard`) mit „gebucht / erwartet (Abweichung)".
- **Kleinunternehmer-Schalter (§19 UStG)**: `kleinunternehmer` in den Einstellungen
  (Ja/Nein-Segment), `state.js`-Default `false`. Wird an `pruefeBuchung`/`buildVorschlag`
  durchgereicht → unterdrückt die USt-„vergessen"-Hinweise für §19-Nutzer.
- **Audit-Kette war bereits sichtbar** (Dashboard-Badge + Reports `auditCard` via
  `verifyAuditChain`) — nichts dupliziert.
- i18n de/en (reports.verprobung*, settings.kleinunternehmer, common.yes/no). SW-Cache `v26→v27`.
- `tests/run.mjs`: +6 `verprobeUSt`. **Gesamt 162/162 grün**.

**Verifiziert:** `node tests/run.mjs` → 162/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** neue UI (Verprobungs-Karte, Kleinunternehmer-Segment) nicht
headless-E2E geklickt. **EÜR §4(3)/DATEV** und **KI-Berater mit Rechts-Grundlage** sind als
eigene Folge-PRs geplant (zu groß für diesen Batch — Ehrlichkeits-Vertrag).

**Offen / Nächstes:** KI-Berater (Begründung/Notiz-Feld + kuratiertes Regel-Set
`rechtsregeln.js` + Prompt + UI); EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifiziert.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Profi-Härtung mit Spielraum: Kontoart-Richtung + Plausibilitäts-Hinweise

**Was getan**
- `src/ai/mistral.js`: neue reine, node-testbare Funktion **`resolveKategorie(parsed, kontoIndex)`**.
  Die Buchungs-**Richtung** (einnahme/ausgabe) wird jetzt VERBINDLICH aus der Kontoart
  abgeleitet (ERTRAG→einnahme, AUFWAND→ausgabe) statt der Modell-Antwort blind zu trauen.
  Folge: ein vom Modell falsch gelabeltes Erlöskonto („ausgabe") kann **keine falsche
  Soll/Haben-Buchung** mehr erzeugen. Nicht-Erfolgskonten (z.B. Bank 1200) werden
  abgelehnt → On-Device-Heuristik greift. `categorize()` nutzt jetzt diese Funktion.
- **Profi-Substanz mit Spielraum** (Leitlinie des Nutzers: „hart wie Diamant, aber
  bedienerfreundlich, mit Spielraum — keine Haken beim Eintragen, trotzdem Berater-tauglich"):
  - NEU `src/domain/pruefung.js` — reine `pruefeBuchung(buchung, idx, opts)` trennt **harte
    Fehler** (validateBuchung, nur festschreibe-relevant) von **nicht-blockierenden Hinweisen**:
    USt vergessen (nur Erlös/Output-VAT, low-noise), Zukunftsdatum, Datum vor letzter
    Festschreibung (zeitgerecht), fehlender Buchungstext, Soll=Haben-Konto;
    `opts.kleinunternehmer` unterdrückt USt-Hinweise. Plus `istFestschreibbar()`.
  - **Haken entfernt:** Journal-Formular speichert Entwürfe jetzt IMMER (vorher blockierte
    `validateBuchung` das Speichern); `buildVorschlag()` liefert IMMER einen Vorschlag (mit
    `fehler`/`warnungen` als Metadaten) statt `ok:false`. Streng bleibt nur `festschreiben()`.
  - **Hinweise sichtbar, Profi entscheidet:** Journal zeigt gelbe Hinweis-Karte nach dem
    Speichern; Festschreiben fragt bei Warnungen nach („… Trotzdem festschreiben?"); Beleg-
    Vorschlagskarte zeigt Hinweise. i18n (de/en) + `.hinweis`-Style. SW-Cache `v25 → v26`,
    `pruefung.js` in CORE_ASSETS, 54 JS-Module.
- `tests/run.mjs`: +6 `resolveKategorie`, +4 Vorschlag-Spielraum, +13 `pruefeBuchung`/
  Plausibilität. **Gesamt 156/156 grün** (vorher 134).

**Verifiziert:** `node tests/run.mjs` → 156 bestanden, 0 fehlgeschlagen; `node --check` für alle
geänderten UI-Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral im Browser; die neuen UI-Hinweise (Journal-Karte,
Festschreib-Dialog, Beleg-Karte) sind **nicht headless-E2E** geklickt — nur Logik node-getestet.
Kein Kleinunternehmer-Schalter in den Einstellungen (opts vorhanden, UI-Toggle offen).

**Offen / Nächstes:** Browser-Sichttest der Pipeline + neuer Hinweise; optional Kleinunternehmer-
Schalter in Einstellungen; Sage 5b. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Setup-Politur + Nachfolge-Brief

**Was getan**
- KI-Einstellungen: **„Verbindung testen"**-Knöpfe (Vision/Mistral), Direktlinks zur
  Schlüssel-Erstellung, Schritt-Anleitung + „Vision-API aktivieren"-Link, Persistenz-Hinweis,
  **Klartext-Fehlerhinweise** (`visionFehlerHinweis`: Vertex/Agent-Key, Referrer, API nicht
  aktiv, Abrechnung, Key ungültig). SW bis `v25`.
- **`docs/PULS.md` angelegt** — zentraler Nachfolge-Brief/Stand-Schnappschuss; in `CLAUDE.md`
  als Pflicht-Andockpunkt verankert.

**Live verifiziert (Nutzer-Sichttest):** Vision (EU) **aktiv ✓** + Mistral (EU) **aktiv ✓**.
Gelöst: Vertex/Agent-Express-Key taugt nicht für Vision → Standard-Cloud-Vision-Key nötig.

**Offen / Nächstes:** Beleg→Buchung-Pipeline im Browser durchklicken; Sage 5b (Spore in-app
erzeugen + Hub-Registrierung). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — EU-KI-Umstellung (Google Vision EU + Mistral EU)

**Was getan (auf Nutzerwunsch, Vorbild Mein-WorkFloh)**
- **Beleg-Texterkennung nur noch über Google Cloud Vision — EU-Endpoint** (`ai/vision.js`,
  `eu-vision.googleapis.com`): Bild → `images:annotate`, PDF → `files:annotate`,
  `DOCUMENT_TEXT_DETECTION`. **Kamera/Foto/Scanner/PDF** im Belege-Upload (`pickFile` mit
  `capture`).
- **Textsortierung/Kontierung + Steuer-Assistent über Mistral (EU)** (`ai/mistral.js`,
  `api.mistral.ai/v1`, OpenAI-kompatibel), mit **On-Device-Heuristik-Fallback**.
- Claude-Provider entfernt (`ai/provider.js` gelöscht); neue verschlüsselte Config
  `ai/aiConfig.js` (Vision-Key + Mistral-Key + Modell). Settings, documents- und reports-
  View angepasst. `taxAssist.js` nutzt jetzt Mistral.
- Tests **134/134** (Vision-Request/Parser, Mistral-Prompt/Parser). SW-Cache `v21`.
- CLAUDE.md Regel 8 + `docs/AI.md` auf EU-Stack umgestellt.

**Offen / Grenzen (ehrlich)**
- Vision-/Mistral-Pfade nicht gegen Live-APIs getestet (kein Schlüssel/Netz); reine
  Logik node-getestet. CORS/Live erst im echten Browser mit Schlüssel prüfen.

---

## 2026-06-14 — Phase 6.1: Bild-Assets / Branding

**Was getan**
- Vom Nutzer generierte 3D-Render-Bilder eingebunden (Teal/Mint-Marke):
  - **PWA-Icons**: `icon-192/512`, `maskable-512`, `apple-touch-icon`, `favicon-32`
    (Manifest + `index.html` + SW-Cache).
  - **Hero** `hero-lock.png` (transparent) am Sperrbildschirm; `shell()` nimmt jetzt ein
    **kontextabhängiges** Hero-Bild → Onboarding zeigt `onboard-key/-shamir/-backup`.
  - **7 Leerzustände** (`empty-*`) via neuer `emptyState`-Komponente in Journal/Belege/
    Kunden/Aufträge/Mitarbeiter/Auswertung/Mycel-Netz.
  - **`og-image.png`** (opak, Wortmarke als echter Text) + OG/Twitter-Meta-Tags.
- Bild-Aufbereitung mit Pillow (Alpha-Erhalt, Flood-Fill/weiche Matte gegen weiße/
  eingebackene Karo-Hintergründe). SW-Cache bis `v20`.

**Stand**
- Vollständiges, konsistentes Marken-Bildset; alle referenzierten Bilder vorhanden,
  121/121 Tests grün, i18n vollständig.

**Offen / Grenzen (ehrlich)**
- Lighthouse/Performance ungemessen (kein Headless-Browser); Browser-UI nicht E2E-getestet
  → **Sichttest** als nächster Schritt.

---

## 2026-06-14 — Phase 6: Design-Politur & Bilder

**Was getan**
- `domain/summary.js` (rein, getestet): Dashboard-Jahres-Kennzahlen (Ertrag/Aufwand/
  Überschuss/USt-Zahllast/festgeschrieben/Entwürfe).
- `ui/views/dashboard.js`: KPI-Karten + Zähler (Belege/Kunden/Aufträge) + Audit-Status +
  Schnellaktionen. Ersetzt das statische Dashboard.
- `ui/mycelCanvas.js`: dezente, animierte Mycel-Fäden am Sperrbildschirm — **additiv**
  (Browser-Lehre 8), `prefers-reduced-motion`-bewusst, beendet sich beim Entfernen aus DOM.
- Barrierefreiheit: Skip-Link, `:focus-visible`, `aria-current`/`aria-live`, `role=main`,
  Fokus-Ring-Token.
- Tests **121/121**; i18n-Vollständigkeit ok; SW-Cache `v7`.

**Stand**
- Visuell deutlich aufgewertet; Dashboard zeigt echte Zahlen; A11y-Grundlagen vorhanden.

**Offen / Grenzen (ehrlich)**
- **Echte promptgenerierte Bilder** (KI-Bildgenerierung) sind in dieser Umgebung nicht
  möglich → Hero/Illustrations-Assets bleiben offen (Phase 6.x).
- **Lighthouse/Performance** nicht gemessen (kein Headless-Browser).
- **Mycel-Canvas + alle UI** nicht headless E2E-getestet — nur statisch geprüft.

**Nächstes** — offene Sage-Schritte (5b/c/d, menschlich vermittelt) und/oder
Bild-Assets/Performance (6.x); ein manueller Browser-Durchlauf bleibt empfohlen.

---

## 2026-06-14 — Phase 5: Sage-Mycel-Symbiose (lokale Andock-Vorbereitung)

**Was getan**
- SBKIM-Protokoll `src/sbkim/`: `spore.js` (Ed25519-Keygen, Spore-Bau, Verifikation §11.2,
  kanonische Form §11.1, `id==base64url(SHA256(pubkey))`), `identity.js` (verschlüsselte
  Identität), `domainvector.js` (deterministischer `_demo`-Vektor 384-dim, §11.5),
  `signal.js` (SIGNAL.json §11.6).
- **Headless-Verifizierer** `tools/verify_remote_spore.mjs` (node:crypto, zero-dep).
- Ansicht „Mycel-Netz": Identität erzeugen, spore.json/SIGNAL.json herunterladen, fremde
  Spore prüfen. `sbkim/README.md` + Templates (SIGNAL, AUSTAUSCH).
- Tests **113/113** inkl. Verifizierer-Paar-Einigkeit (Browser ↔ headless) und
  Manipulationsprobe. SW-Cache `v6`.

**Wichtig (extern, gegenkontrolliert):** Mein nodeId-Derivat und die §11.1-Signatur wurden
gegen eine **echte Geschwister-Spore (Mein-Tresor)** geprüft → **VALID**. Format ist also
byte-kompatibel zum Netz.

**Stand**
- Andock ist **lokal vorbereitet**; kein fremdes Repo verändert.

**Offen / Grenzen (ehrlich)**
- **Keine echte `spore.json` im Repo** — sie wird in-app mit dem privaten Schlüssel erzeugt
  und vom Nutzer committet (kein erfundenes Signatur-File).
- `domainVector` ist `_demo` → nur `verified-spore`, nicht `verified-match` (echtes
  Embedding/Transformers.js = Phase 5c).
- Hub-Registrierung + Handshake = menschlich vermittelter Schritt (Phase 5b, fremde Repos).
- Symbiose-Import (Tresor/WorkFloh → Buchungen) = Phase 5d.
- Browser-UI nicht headless E2E-getestet.

**Nächstes** — Phase 5b/c/d (s.o.) bzw. Phase 6 (Design-Politur & Bilder).

---

## 2026-06-14 — Phase 4: Steuer & Export

**Was getan**
- `domain/export.js` (rein, getestet): Journal-CSV, DATEV-orientierte CSV, USt-VA-Kennzahlen
  (Kz 81/86/66/83), EÜR-CSV; CSV-Escaping + Cent→Komma.
- `ai/taxAssist.js`: Steuer-Assistent (opt-in Claude), sendet nur aggregierte Kennzahlen
  (Datenminimierung). Nicht live getestet.
- UI `reports.js`: USt-VA-Kennzahlen-Karte, Export-Buttons (CSV/DATEV/USt-VA/EÜR),
  Drucken→PDF (Print-CSS), Steuer-Assistent (wenn Claude konfiguriert).
- `ui/views/legal.js` + Nav „Recht & Doku": GoBD-Verfahrensdokumentation + DSGVO in-app,
  Betroffenenrechte (verschlüsselter Export, vollständiges Löschen).
- `docs/legal/Verfahrensdokumentation.md` + `docs/legal/Datenschutz.md`.
- Tests **98/98**; i18n-Vollständigkeit ok; SW-Cache `v5`.

**Stand**
- Steuerliche Aufbereitung (USt-VA-Kennzahlen, EÜR) + Exporte + Recht/Doku vorhanden.
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- DATEV = orientiert, kein zertifiziertes EXTF; **keine** ELSTER-Einreichung (nur Datenpaket).
- „PDF" = Browser-Druck (keine PDF-Bibliothek).
- Claude-Pfade (Belegerkennung, Steuer-Assistent) nicht live getestet.
- Browser-UI nicht headless E2E-getestet.

**Nächstes (Phase 5)** — Sage-Mycel-Symbiose: SBKIM-Client (Modul 09 kopieren),
Ed25519-Identität, `spore.json`, Synchronisationsvereinbarung/Briefkasten
(`docs/SAGE_SYNC_BRIEFKASTEN.md`), Symbiose (Belege aus Tresor, Aufträge aus WorkFloh).

---

## 2026-06-14 — Phase 3: Aufträge, Kunden, Mitarbeiter, Kostenstellen

**Was getan**
- Domäne (rein, getestet): `orders.js` (Positionen, Summen über mehrere USt-Sätze,
  Status-Flow), `invoicing.js` (Ausgangsrechnung → Buchungszeilen, mehrere Sätze),
  `employees.js` (Zeit-Summen/Kosten), `costcenters.js` (Auswertung je Kostenstelle).
- Verschlüsselter generischer Store `encstore.js` + `crm-store.js` (Kunden, Aufträge,
  Mitarbeiter, Zeiten verschlüsselt = DSGVO; Kostenstellen als Klartext-Stammdaten).
- Rechnung → automatische Buchung (`rechnungAusAuftrag` → Buchungs-Entwurf, Auftrag
  „berechnet"); Festschreiben bleibt manuell (GoBD).
- UI: Ansichten Kunden / Aufträge (Positionen-Editor, Status, Rechnung→Buchung) /
  Mitarbeiter+Zeiterfassung; Kostenstelle-Auswahl im Journal; Kostenstellen-Auswertung
  in der Auswertung. Nav erweitert.
- Tests **85/85**; i18n-Vollständigkeit ok; SW-Cache `v4`.

**Stand**
- Voller Auftrags-/CRM-Kreis: Kunde → Auftrag → Rechnung → Buchung; Zeiterfassung;
  Kostenstellen-Auswertung. Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser): alle Phase-1–3-
  Ansichten sind statisch geprüft, aber nicht klickend verifiziert → einmal manuell
  durchgehen.
- Rechnung erzeugt bisher kein PDF-Dokument (nur Buchung); PDF-Rechnung später.

**Nächstes (Phase 4)** — Steuer & Export: Steuer-Assistent (opt-in), USt-VA/EÜR-
Aufbereitung, Export (PDF/CSV, DATEV-CSV, ELSTER/ERiC-Datenpakete), DSGVO/GoBD-Doku in-app.

---

## 2026-06-14 — Phase 2: Belege & Erkennung (Kern)

**Was getan**
- Verschlüsselter Beleg-Store `domain/documents.js` (AES-GCM, Bild/PDF, Metadaten +
  Verknüpfung zu Buchungen).
- On-Device-Pipeline (rein, getestet): `ai/extract.js` (Betrag/Datum/USt/Vendor aus Text),
  `ai/categorize.js` (Schlüsselwort → SKR03-Konto + Richtung), `ai/suggest.js`
  (ausgeglichener Buchungssatz inkl. USt-Aufteilung).
- Externe KI `ai/provider.js`: Claude-Vision per BYOK (neueste Modelle), opt-in,
  verschlüsselter Schlüssel, Bestätigung vor Versand.
- UI `ui/views/documents.js`: Upload, Schnellerfassung aus Text, KI-Extraktion; **Autonomie-
  Schalter wirksam** (Vorschlag/Entwurf/auto). KI-Settings (BYOK) in Shell.
- Bugfix: doppelte Cent-Konvertierung in `baueBuchungZeilen` (nimmt jetzt `bruttoCents`).
- Tests **65/65**; i18n-Vollständigkeit geprüft; SW-Cache `v3`.
- `docs/AI.md` (KI-Konzept + ehrliche Grenzen).

**Stand**
- Beleg→Buchungsvorschlag funktioniert on-device (Text) und via Claude-Vision (BYOK).
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Lokales OCR (Tesseract.js) NICHT eingebunden** — Bild→Text nur via Claude-Vision/Text.
- **Embeddings (Transformers.js) ausstehend** — derzeit Schlüsselwort-Heuristik.
- **Claude-API-Pfad nicht live getestet** (kein Schlüssel/Netz).
- **Browser-UI nicht headless E2E-getestet.**

**Nächstes (Phase 3)** — Aufträge/Kunden/Mitarbeiter/Kostenstellen (WorkFloh-Domänenmodell),
Rechnung → automatische Buchung.

---

## 2026-06-14 — Phase 1: Buchhaltungs-Kern

**Was getan**
- Domänenlogik (rein, node-getestet): `domain/money.js` (Cent-genau, dt. Format),
  `domain/accounts.js` (SKR03-Auswahl, Konto-Arten, Saldo-Logik), `domain/journal.js`
  (doppelte Buchführung mehrzeilig, USt-Aufteilung brutto→netto+USt, Storno-Spiegelung),
  `domain/audit.js` (kanonische Form wie Sage §11.1, Hash-Kette, `verifyChain`),
  `domain/taxes.js` (Saldenliste, USt-Voranmeldung, EÜR vereinfacht, Periodenfilter).
- Persistenz `domain/store.js`: Konten-Seed, **verschlüsselte** Buchungen (AES-GCM mit
  Sitzungs-Key), **GoBD-Festschreibung** (lückenloser Nummernkreis + Hash-Kette),
  unveränderlich, Korrektur nur per `storno()`.
- UI: Ansichten Konten/Journal/Auswertung (`ui/views/*`), Neue-Buchung-Formular mit
  autom. USt-Konto-Wahl, Festschreiben/Storno, Audit-Status. In Shell + Nav verdrahtet.
- Tests erweitert auf **45/45** (inkl. Integration Festschreiben+Storno+Kette).
- SW-Cache auf `v2` gebumpt + neue Module precached (Browser-Lehre 4).

**Stand**
- Voll funktionsfähiger Buchhaltungs-Kern (Konten, Buchen, USt/EÜR, GoBD-Audit), Kernlogik
  echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser in der Umgebung):
  DOM/IndexedDB/Verschlüsselungs-Pfad ist sorgfältig gebaut + statisch geprüft, aber nicht
  klickend verifiziert. Erste reale Sitzung: Onboarding → Buchung → Festschreiben → Storno
  → Auswertung manuell durchklicken.
- Strenge §4-Abs.3-EStG-EÜR + Kostenstellen-UI später (Phase 3/4).

**Nächstes (Phase 2)** — Belege & Erkennung (verschlüsselter Beleg-Store, OCR lokal,
Extraktion → Buchungsvorschlag, KI-Autonomie-Schalter wirksam).

---

## 2026-06-14 — Phase 0: Fundament

**Was getan**
- Repo-Gerüst angelegt (build-frei, native ES-Module, PWA-Manifest, App-SW mit
  versioniertem Cache).
- Krypto (`src/core/crypto.js`): AES-GCM-256, PBKDF2 (600k), SHA-256, base64url.
- Shamir GF(256) (`src/core/shamir.js`): Split/Combine + Share-Kodierung.
- IndexedDB (`src/core/db.js`): KV/Records/Files, DB-Suffix `bookledgerpro`, Dump/Wipe.
- Datendurabilität (`src/core/durability.js`): `storage.persist()`, Quota, Backup-Status.
- Tresor (`src/core/vault.js`): Setup/Unlock, Sitzungs-Key, verschlüsselte Settings,
  Mandant-ID. Backup (`src/core/backup.js`): bauen/lesen/importieren.
- UI: DOM-Helfer, i18n (de/en), Theme (hell/dunkel/system), Mycel-Marke, Sperrbildschirm
  + Onboarding (Passwort → Shamir → erzwungenes erstes Backup), App-Shell mit Modus- und
  KI-Autonomie-Schaltern + Durabilitäts-Banner + Mandant-Indikator.
- Node-Smoke-Test (`tests/run.mjs`) für Krypto + Shamir, CI-Workflow.
- Docs: README, ARCHITECTURE, ROADMAP, CLAUDE/AGENTS, SAGE_BROWSER_LEHREN.

**Stand**
- App bootet, Onboarding/Unlock/Settings funktionieren lokal. Buchhaltungs-Kern noch leer
  (Ansichten Konten/Journal/Belege sind Platzhalter).

**Nachtrag (gleiche Sitzung)**
- Sage-**Synchronisationsvereinbarung & Briefkasten** analysiert (INTERFACES §11) und als
  `docs/SAGE_SYNC_BRIEFKASTEN.md` verankert (SIGNAL.json seq/ack, AUSTAUSCH-Postfächer,
  Inbox-Konvention, Signier-Norm, Start-/End-Ritual). In CLAUDE/ROADMAP/ARCHITECTURE/README
  verlinkt. Wird ab Phase 5 Pflicht.

**Offen / Nächstes (Phase 1)**
- Kontenplan + Buchungssätze (doppelte Buchführung), Journal, EÜR/USt.
- GoBD: Festschreibung, Storno, Audit-Hash-Kette (`core/audit.js`), Nummernkreise.
