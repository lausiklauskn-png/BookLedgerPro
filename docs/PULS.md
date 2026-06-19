# PULS.md — Lückenloser Nachfolge-Brief (Stand-Schnappschuss)

> **Diese Datei ist der zentrale Andockpunkt für jede neue Sitzung.** Sie ergänzt
> `CLAUDE.md` (Regeln/Verträge), `ROADMAP.md` (Phasen-Checklisten) und `docs/SESSIONS.md`
> (Verlauf). Wer hier + im obersten SESSIONS-Eintrag liest, weiß **genau, wo es weitergeht**.
> Pflege: bei Sitzungsende oben „Letzter Stand" + „Nächste konkrete Schritte" aktualisieren.

**Letzte Aktualisierung:** 2026-06-19 · **Branch:** `claude/phase-5-sbkim-integration-v1v0ed`
· **Tests:** `node tests/run.mjs` → **142/142 grün** · **SW-Cache:** `v26`
· **Phase-5-Andock Schritt 1 erledigt:** echte `sbkim/spore.json` committet (headless VALID),
  nodeId `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`.

---

## 1. Was BookLedgerPro ist (in einem Satz)
Offline-first, **verschlüsselte** Buchhaltungs-PWA (Deutschland zuerst), build-frei (native
ES-Module, keine CDNs, GitHub Pages), **EU-KI-gestützt** (Google Vision EU + Mistral EU),
GoBD/DSGVO als Architektur, vorbereitet als **Sage-Mycel**-Knoten (SBKIM).

## 2. Eckdaten / unveränderliche Fakten
- **Repo:** `lausiklauskn-png/BookLedgerPro` · **Endpoint:** `https://lausiklauskn-png.github.io/BookLedgerPro/`
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
| 5 | Sage-Mycel: SBKIM byte-kompatibel; **Knoten geboren** (echte spore.json committet, headless VALID) | ◑ Andock-Schritt 1 |
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

## 5. ✅ Live vom Nutzer verifiziert (Sichttest 2026-06-14)
- **Vision (EU): „aktiv ✓"** und **Mistral (EU): „aktiv ✓"** — beide EU-Dienste real verbunden.
- Stolperstein gelöst: ein **Vertex/Agent-Express-Key** funktioniert NICHT für Vision
  (401 „API keys are not supported…") → es braucht einen **Standard-Cloud-Vision-API-Key**
  mit aktivierter Cloud Vision API. (App-seitig korrekt; reine Google-Key-Konfig.)

## 6. ⚠️ Ehrlich offen / ungetestet (nicht beschönigen)
- **Beleg→Buchung-Pipeline end-to-end im Browser** noch nicht vom Nutzer bestätigt
  (Vision+Mistral einzeln ✓, der durchgehende OCR→Vorschlag-Klickpfad steht als nächstes an).
- **Browser-UI generell nicht headless E2E-getestet** (kein Headless-Browser in der
  Build-Umgebung) — Kernlogik ist node-getestet (134/134), DOM-Pfade statisch geprüft.
- **Sage Phase 5b/c/d:**
  - 5b Schritt 1 **erledigt:** echte, signierte `sbkim/spore.json` + `SIGNAL.json` committet
    (headless via `tools/mint_spore.mjs`, `node tools/verify_remote_spore.mjs sbkim/spore.json`
    → **VALID**). **⚠ Privater Schlüssel** liegt in `sbkim/.node-secret.json` (gitignored) —
    **vom Nutzer zu sichern / per „Identität importieren" in den Tresor übernehmen**, sonst
    keine Rotation/Signatur möglich (Krypto-Disziplin #4).
  - 5b Schritt 2 **offen** (menschlich vermittelt, fremde Repos): im Sage-Hub `status.json`
    registrieren + erster Handshake bei Geschwister-Knoten → `verified-spore`.
  - 5c: echter `domainVector` (Transformers.js, `Xenova/multilingual-e5-small`) statt
    `_demo` → `verified-match`.
  - 5d: Symbiose-Import (Belege aus **Mein-Tresor**, Aufträge aus **WorkFloh** → Buchungen).
  - Briefkasten-Ritual (§11.6, `docs/SAGE_SYNC_BRIEFKASTEN.md`) wird **erst aktiv**, wenn
    BookLedgerPro ein deployter Sage-Knoten ist.
- **Steuer-Recht-Resterledigung:** strenge Zufluss-/Abfluss-EÜR (§4 Abs.3 EStG);
  zertifiziertes DATEV-EXTF + Steuerschlüssel-Mapping; **keine** ELSTER/ERiC-Einreichung
  (nur Datenpaket). PDF-Rechnung aus Auftrag fehlt (nur Buchung).
- **Performance/Lighthouse** nicht gemessen (kein Headless-Browser).
- **Lokales Offline-OCR** (Tesseract.js) nicht eingebunden — Vision EU ist der OCR-Pfad.
- **Git-Nebensache:** Abzweig `claude/eu-ki-vision-mistral` zeigt remote noch auf denselben
  Commit; der Git-Proxy erlaubt kein Branch-Löschen → bei Gelegenheit serverseitig entfernen.

## 7. Nächste konkrete Schritte (Priorität)
1. **Sichttest abschließen:** Beleg per Foto/PDF → „Texterkennung (Google Vision EU)" →
   Buchungsvorschlag prüfen (Brutto/Datum/USt/Konto, Soll=Haben) → Entwurf → Journal →
   Festschreiben. Auffälligkeiten an Extraktion (`ai/extract.js`) / Kontierungs-Prompt
   (`ai/mistral.js buildClassifyMessages`) nachjustieren.
2. **Sage 5b Schritt 2** (mit Nutzer als Vermittler): Knoten ist geboren & deploybar
   (`sbkim/spore.json` committet, headless VALID). Jetzt: privaten Schlüssel sichern/in den
   Tresor importieren; im Sage-Hub `status.json` registrieren; ersten Handshake bei einem
   Geschwister-Knoten anstoßen → `verified-spore`.
3. **Phase 4-Rest / Phase 5c-d** nach Bedarf: echte EÜR, PDF-Rechnung, echter domainVector,
   Symbiose-Import.
4. **Optional:** Lighthouse/Perf, weitere UX-Politur, lokaler OCR-Fallback.

## 8. Architektur-Landkarte (wo was liegt)
- `src/core/` crypto · shamir · db · durability · files · vault · backup
- `src/domain/` money · accounts · journal · audit · taxes · store · documents · orders ·
  invoicing · employees · costcenters · encstore · crm-store · export · summary
- `src/ai/` extract · categorize · suggest · **aiConfig · vision · mistral** · taxAssist
- `src/sbkim/` spore · identity (+ `importIdentity`) · domainvector · signal · **nodeProfile**
  (eine Quelle der Wahrheit) — Tools: `tools/verify_remote_spore.mjs` · **`tools/mint_spore.mjs`**
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
