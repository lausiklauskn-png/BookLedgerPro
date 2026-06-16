# PULS.md — Lückenloser Nachfolge-Brief (Stand-Schnappschuss)

> **Diese Datei ist der zentrale Andockpunkt für jede neue Sitzung.** Sie ergänzt
> `CLAUDE.md` (Regeln/Verträge), `ROADMAP.md` (Phasen-Checklisten) und `docs/SESSIONS.md`
> (Verlauf). Wer hier + im obersten SESSIONS-Eintrag liest, weiß **genau, wo es weitergeht**.
> Pflege: bei Sitzungsende oben „Letzter Stand" + „Nächste konkrete Schritte" aktualisieren.

**Letzte Aktualisierung:** 2026-06-16 · **Branch:** `claude/pseudonym-logic-module-8vx628`
· **main-Stand:** `6343357` · **Tests:** `node tests/run.mjs` → **246/246 grün**
· **SW-Cache:** `v47` · **60 JS-Module** · **12 Bild- + 5 Icon-Assets**
· **Neu:** `src/ai/pseudonym.js` (Datenschutz-Modi, Bau-Schritt 1 — tokenize/reidentify, rein/node-getestet).

---

## 0. BRAINSTORMING — zuerst klären (Funktionalität, ohne Code)
Am Sitzungsanfang mit dem Nutzer durchgehen; entscheidet über viele Bau-Wege:
1. **Zielgruppe/Rechtsform:** primär EÜR (Freiberufler/Kleinunternehmer) oder auch Bilanzierer (GmbH, GuV/Bilanz)?
2. **Kleinunternehmer §19:** soll das Onboarding danach fragen und global steuern (Rechnungen ohne USt, keine USt-VA)?
3. **E-Rechnung (XRechnung/ZUGFeRD):** B2B-Empfang in DE seit 2025 Pflicht — Erzeugen und/oder Einlesen? (großes Thema)
4. **Bank/Zahlungen:** Bankimport (CAMT/MT940) + Zahlungsabgleich? Macht die Ist-EÜR (§4 Abs.3) erst echt + Offene Posten.
5. **USt-VA-Abgabe:** bei Kennzahlen/CSV bleiben oder echte ELSTER/ERiC (nicht build-frei → Architektur-Entscheidung)?
6. **DATEV/Berater:** welches Format braucht der Berater konkret? Steuerschlüssel-Mapping mit ihm verifizieren (aktuell „EXTF-orientiert", nicht zertifiziert).
7. **Mandanten:** mehrere Firmen je Installation? Aktuell 1 Tresor = 1 Mandant.
8. **Geschäftsjahr:** immer Kalenderjahr? USt-VA monatlich/quartalsweise?
9. **WorkFloh-Anschluss — Umfang/Richtung:** nur Kunden+Aufträge (steht) oder auch Zeiten/Rechnungen/Zahlungen? nur Import oder Rückmeldung „berechnet"? Datei oder Sage-Sync?
10. **Betriebsprüfung/Aufbewahrung:** GoBD-Export (DSFinV-K/GDPdU), Fristen, Beleg-Originalarchiv?
11. **AVV/Datenschutz bei KI:** Auftragsverarbeitungsverträge mit Google/Mistral? Hinweis im Datenblatt?

---

## 1. Was BookLedgerPro ist (in einem Satz)
Offline-first, **verschlüsselte** Buchhaltungs-PWA (Deutschland zuerst), build-frei (native
ES-Module, keine CDNs, GitHub Pages), **EU-KI-gestützt** (Google Vision EU + Mistral EU),
GoBD/DSGVO als Architektur, vorbereitet als **Sage-Mycel**-Knoten (SBKIM).

## 2. Eckdaten / unveränderliche Fakten
- **Repo:** `lausiklauskn-png/bookledgerpro` · **Live-URL (KLEIN!):** `https://lausiklauskn-png.github.io/bookledgerpro/` (Großschreib-Variante 404't — Pfad case-sensitive)
- **DB-Suffix:** `bookledgerpro` (NIE ändern — gemeinsamer Origin auf GitHub Pages → sonst
  Kollision mit Geschwister-Apps, real beobachtet als `blocked-origin-collision`).
- **Arbeitsbranch:** `claude/general-discussion-x9xyk9`; pro Thema 1 PR, **Freibrief: mergen
  wenn sinnvoll & CI grün**. Nach Merge lokal `git reset --hard origin/main`.
- **SW-Cache:** bei jeder Shell-Änderung `CACHE_VERSION` in `sw.js` erhöhen (Browser-Lehre 4).
- **Verbindlich:** `docs/SAGE_BROWSER_LEHREN.md` (8 Browser-Lehren) + `docs/SAGE_SYNC_BRIEFKASTEN.md`
  (Sync/Briefkasten §11) + `docs/AI.md` (KI-Konzept EU).

## 3. Phasenstand (Details in ROADMAP.md)
| Phase | Inhalt | Stand |
|---|---|---|
| 0 | Fundament: Krypto (AES-GCM/PBKDF2), Shamir, IndexedDB, Durabilität, Tresor, Shell, Modi | ✅ in main |
| 1 | Buchhaltungs-Kern: SKR03, doppelte Buchführung, USt/EÜR, GoBD-Festschreibung + Hash-Kette | ✅ |
| 2 | Belege & Erkennung: verschl. Beleg-Store, Extraktion, Vorschlag, Autonomie-Schalter | ✅ |
| 3 | Aufträge/Kunden/Mitarbeiter/Kostenstellen, Rechnung→Buchung (verschlüsselt, DSGVO) | ✅ |
| 4 | Steuer & Export: USt-VA-Kennzahlen, EÜR, CSV/DATEV-orientiert, Recht-Doku in-app | ✅ |
| 5 | Sage-Mycel: SBKIM byte-kompatibel **lokal vorbereitet** | ◑ lokal fertig |
| 6 | Design-Politur: Dashboard-KPIs, Mycel-Canvas, A11y | ✅ |
| 6.1 | **Bild-Assets/Branding** (Icons, Hero, 7 Leerzustände, OG, Onboarding) — vom Nutzer 3D-generiert | ✅ |
| EU-KI | **Google Vision (EU) OCR + Mistral (EU) Kontierung/Steuer**, Claude entfernt | ✅ |

## 4. KI-Architektur (WICHTIG — EU, BYOK, opt-in)
- **OCR/Texterkennung NUR Google Cloud Vision, EU-Endpoint** `eu-vision.googleapis.com/v1`
  (`ai/vision.js`): Bild→`images:annotate`, PDF→`files:annotate`, `DOCUMENT_TEXT_DETECTION`,
  Auth `?key=`. Kamera/Foto/Scanner/PDF im Upload (`pickFile(accept, capture)`).
- **Kontierung + Steuer-Assistent NUR Mistral, EU** `api.mistral.ai/v1` (`ai/mistral.js`,
  OpenAI-kompatibel, Bearer). **Fallback** auf On-Device-Heuristik (`ai/categorize.js`),
  wenn Mistral nicht konfiguriert.
- Pipeline: `Foto/PDF → Vision EU (Text) → ai/extract (Felder) → Mistral EU (Konto) →
  ai/suggest (Vorschlag) → Entwurf` (Festschreiben bleibt manuell, GoBD).
- Config verschlüsselt: `ai/aiConfig.js` (`visionKey`, `mistralKey`, `mistralModel`),
  in Einstellungen mit **„Verbindung testen"**-Knöpfen, Direktlinks zur Schlüssel-Erstellung
  und Fehler-Klartext (`visionFehlerHinweis`). Vorbild: **Mein-WorkFloh** (gleiche Endpoints).

## 5. ✅ Live vom Nutzer verifiziert (Sichttests 2026-06-14)
- **Vision (EU): „aktiv ✓"** und **Mistral (EU): „aktiv ✓"** — beide EU-Dienste real verbunden.
  (Stolperstein: Vertex/Agent-Express-Key taugt NICHT für Vision → Standard-Cloud-Vision-Key.)
- **Geführter Browser-Sichttest (DeX/Chrome) — bestätigt:**
  - **Beleg→Buchung-Pipeline end-to-end** ✅: Schnellerfassung-Text → Erkennung (Betrag/Datum/USt/
    Vendor) → Kontierung **4930 + 1576 + 1200**, Konfidenz 90 % → Auto-Entwurf (Autonomie autonom).
  - **Plausibilität/Spielraum** ✅ (USt-vergessen-Hinweis, Entwurf trotzdem gespeichert).
  - **Entwurf-Lebenszyklus** ✅ (speichern · bearbeiten mit korrekter USt-Rückrechnung · löschen ·
    festschreiben mit Warn-Dialog · Storno → „Storno-Buchung").
  - **KI-Begründung (Mistral EU) mit §-Bezug** ✅ (z. B. „§ 4 Abs. 4 EStG" für Büromaterial).
  - **Rechnung §14** ✅ (Firmenprofil + Kunde → fortlaufende Nr. 2026-0001 → druckbar/PDF, alle
    Pflichtangaben).
  - **Auswertungen** ✅ (USt-Verprobung erkennt vergessene USt; EÜR vereinfacht + **EÜR Ist §4(3)**;
    USt-VA-Kennzahlen; GoBD-Audit; DATEV-EXTF-Export). **Zeiterfassung** ✅ (Std-Summe + Kosten).
  - Im Test gefunden & sofort gefixt (gemergt): Storno-Kaskade, KI-Kontoname, Firmenprofil-„✓",
    Position entfernen + Etikett-Umbruch, Steuer-Assistent „Claude"→**Mistral (EU)** (PRs #23–#27).

## 6. ⚠️ Ehrlich offen / ungetestet (nicht beschönigen)
- **NEU Plausibilitäts-Ebene mit Spielraum** (`src/domain/pruefung.js`): trennt harte Fehler
  (nur festschreibe-relevant) von nicht-blockierenden Hinweisen (USt vergessen, Zukunftsdatum,
  zeitgerecht, Buchungstext, Soll=Haben). Entwürfe immer speicherbar, Festschreiben bleibt streng.
  **Die neuen UI-Hinweise (Journal-Karte, Festschreib-Dialog, Beleg-Karte) sind nicht
  headless-E2E geklickt** — nur Logik node-getestet. Kein Kleinunternehmer-Schalter in den
  Einstellungen (opts vorhanden, UI-Toggle offen).
- **Browser-UI generell nicht headless E2E-getestet** (kein Headless-Browser in der
  Build-Umgebung) — Kernlogik ist node-getestet (134/134), DOM-Pfade statisch geprüft.
- **Sage Phase 5b/c/d offen** (menschlich vermittelt, fremde Repos):
  - 5b: echte `sbkim/spore.json` **in-app** erzeugen (Ansicht „Mycel-Netz") + committen +
    im Sage-Hub `status.json` registrieren + erster Handshake → `verified-spore`.
    (Bewusst KEINE erfundene spore.json eingecheckt.)
  - 5c: echter `domainVector` (Transformers.js, `Xenova/multilingual-e5-small`) statt
    `_demo` → `verified-match`.
  - 5d: Symbiose-Import (Belege aus **Mein-Tresor**, Aufträge aus **WorkFloh** → Buchungen).
  - Briefkasten-Ritual (§11.6, `docs/SAGE_SYNC_BRIEFKASTEN.md`) wird **erst aktiv**, wenn
    BookLedgerPro ein deployter Sage-Knoten ist.
- **Steuer-Recht-Resterledigung:** EÜR Zufluss/Abfluss (§4 Abs.3) ✅ (vereinfachtes Ist-Modell);
  DATEV-EXTF: Envelope + Konto/Gegenkonto + Standard-Steuerschlüssel ✅ (NICHT zertifiziert/116-Spalten); **keine** ELSTER/ERiC-Einreichung
  (nur Datenpaket). Rechnungsdokument mit §14-Pflichtangaben ✅ (druckbar via Browser-Print → PDF).
- **Performance/Lighthouse** nicht gemessen (kein Headless-Browser).
- **Lokales Offline-OCR** (Tesseract.js) nicht eingebunden — Vision EU ist der OCR-Pfad.
- **Git-Nebensache:** Abzweig `claude/eu-ki-vision-mistral` zeigt remote noch auf denselben
  Commit; der Git-Proxy erlaubt kein Branch-Löschen → bei Gelegenheit serverseitig entfernen.

## 6b. Folge-PRs
- ✅ **KI-Berater mit Rechts-Grundlage** umgesetzt: `begruendung`-Feld an der Buchung (in der
  Hash-Kette, rückwärtskompatibel); `domain/rechtsregeln.js` (kuratiertes §-Set) groundet
  `ai/berater.js` → Mistral formuliert, On-Device-Fallback; UI im Journal. „Keine Steuerberatung".
  ✅ auch im Beleg-Vorschlag (documents.js) integriert. Offen: Regel-Set erweitern.
- **EÜR §4(3) (Zufluss/Abfluss, Ist-Prinzip)** + **zertifiziertes DATEV-EXTF** — größer, eigener PR.

## 7. Nächste konkrete Schritte (Priorität)
1. **Brainstorming (Abschnitt 0) klären** — v. a. E-Rechnung, Bankimport, §19-Default, DATEV mit Berater.
2. **WorkFloh-Anschluss vollenden:** WorkFloh-Export auf `docs/WORKFLOH_IMPORT.md` ausrichten
   (oder WorkFloh-Repo/Beispiel-JSON bereitstellen) → echten End-to-End-Import testen
   (Menü „Aufträge" → „Aus WorkFloh importieren").
3. **Bild-Optimierung:** `cover.png` (~2,4 MB) / `onboard-key.png` (~1,8 MB) → WebP/kleiner
   (schnellerer Erststart, schlanker SW-Cache).
4. **Kleinbetrags-Regel (≤250 €, §33 UStDV)** an die KI-Begründung der UI verdrahten (`betragCent`).
5. **Browser-E2E** der neuen UI-Teile (Plausibilität, KI-Begründung, Rechnung-Druck, Auswertungen,
   Passwortwechsel) — bisher nur Logik node-getestet.
6. **Optional groß:** E-Rechnung (XRechnung/ZUGFeRD), Bankimport (CAMT), Sage 5b (Spore in-app +
   Hub-Registrierung; `node tools/verify_remote_spore.mjs sbkim/spore.json`), Lighthouse/Perf,
   lokaler OCR-Fallback (Tesseract).

## 8. Architektur-Landkarte (wo was liegt)
- `src/core/` crypto · shamir · db · durability · files · vault · backup
- `src/domain/` money · accounts · journal · pruefung · rechtsregeln · audit · taxes · store · documents · orders ·
  invoicing · employees · costcenters · encstore · crm-store · export · summary
- `src/ai/` extract · categorize · suggest · **aiConfig · vision · mistral** · taxAssist · **pseudonym** (Datenschutz-Modi)
- `src/sbkim/` spore · identity · domainvector · signal  (+ `tools/verify_remote_spore.mjs`)
- `src/ui/` dom · i18n · theme · mycel · mycelCanvas · empty · lock · shell ·
  `views/` dashboard · accounts · journal · reports · documents · customers · orders ·
  employees · legal · network
- `assets/` tokens.css · app.css · icon.svg · `icons/` (PWA) · `img/` (Hero/Leerzustände/OG/Onboarding)
- `sbkim/` (Repo-Root) README · SIGNAL.template.json · AUSTAUSCH-template.md (+ spore.json nach Deploy)
- `docs/` ARCHITECTURE · ROADMAP · PULS (diese Datei) · SESSIONS · AI · SAGE_BROWSER_LEHREN ·
  SAGE_SYNC_BRIEFKASTEN · `legal/` (Verfahrensdokumentation, Datenschutz)

## 9. Definition of Done (aus CLAUDE.md, verbindlich)
Pro Phase/Änderung: real implementiert (kein Fake) · `node tests/run.mjs` grün · CI grün ·
ROADMAP abgehakt · **PULS.md + SESSIONS.md fortgeschrieben** · PR mit ehrlicher Verifikation
(inkl. was NICHT geprüft wurde).

## 10. Verifikations-Schnellbefehle
```
node tests/run.mjs                       # 134/134 erwartet
python3 -m http.server 8000              # lokal testen → http://localhost:8000
node tools/verify_remote_spore.mjs <url> # SBKIM-Spore prüfen (VALID/UNGÜLTIG)
```
