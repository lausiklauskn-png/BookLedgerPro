# BRIEF — BLP echtes Embedding via Hetzner-EU-Mirror → `verified-match`

**Datum:** 2026-07-20 · **Repo:** BookLedgerPro · **Branch:** eigener `claude/blp-embedding-eu-…`
**Art:** eigene Bau-Sitzung (Klaus' Entscheid). **Plan-vor-Code gilt.** Leitplanken unberührt:
build-frei-Geist, kein PII, echte Krypto, `node tests/run.mjs` = Beweis, Selbst-Merge nach Freibrief.

## 0. Ziel in einem Satz
BLP bekommt ein **echtes** semantisches Embedding (statt Demo-Stub), sodass Klaus **einmal** eine
**Spore v0.2 mit echtem `domainVector`** signieren kann → BLP wird echter **`verified-match`**-Knoten,
im Netz/Marktplatz **per Bedeutung** auffindbar — **komplett innerhalb der EU**.

## 1. Warum EU/Hetzner (Datenschutz-Begründung — verbindlich)
- Die Bedeutungssuche baut **nur auf der Domänen-Beschreibung** auf (was BLP „kann/sucht"), **nie**
  auf Buchhaltungsdaten. Belege/Kunden/Beträge werden **nie** eingebettet oder geteilt.
- Das Embedding rechnet **lokal im Browser**; der Text reist **nicht**. Nur die **Modell-Dateien**
  + die Bibliothek `transformers.js` werden **heruntergeladen**.
- **Knackpunkt:** der Default-Pfad lädt `transformers.js` von **jsdelivr (US)** und das Modell von
  **HuggingFace (US)** → IP-Transfer USA (DSGVO-relevant). **BLP liegt selbst auf GitHub Pages (US)**,
  „same-origin `/models/`" wäre also **auch US** — reicht NICHT.
- **Lösung:** beide Downloads von **Klaus' Hetzner (EU, CORS)**. Dann: **lokale Verarbeitung,
  EU-only-Download, kein US-Transfer.** Das ist die **eine, bewusste, nutzer-ausgelöste, klar
  benannte** Egress (Vier-Schichten-Pilz-Logik) — Regel #1 bleibt im Geist gewahrt.

## 2. Was Klaus VORHER per Termux auf Hetzner bereitstellt
1. **Bibliothek:** die `@xenova/transformers@2.17.2`-ESM-Datei(en) unter einer festen URL.
2. **Modell:** `Xenova/multilingual-e5-small` (config.json, tokenizer, onnx-Gewichte) unter
   `<HETZNER_BASIS_URL>/models/Xenova/multilingual-e5-small/…`.
3. **CORS:** `Access-Control-Allow-Origin` für die BLP-Origin (`https://lausiklauskn-png.github.io`)
   auf beiden Pfaden; korrekte Content-Types (kein SPA-`try_files`-Fallback → sonst liefert der
   Server HTML statt JSON und transformers.js wirft „Unexpected token '<'").
4. **Klaus trägt die genaue `<HETZNER_BASIS_URL>` beim Sitzungsstart ein** (offenes Feld).

## 3. Was die Bau-Sitzung tut
1. **Byte-Kopie** des echten Embedding-Moduls aus dem Baukasten nach `sbkim/03_embedding.js`
   (ersetzt/ergänzt BLPs Demo-`src/sbkim/domainvector.js`-Pfad — der Demo bleibt als Fallback,
   fail-soft). Quelle: `Sage-Protokol/src/modules/03_embedding.js` (Drift-Guard-tauglich).
2. **Quellen auf Hetzner umbiegen** (kein Umbau, Muster existiert in `pinnwand-widget.js`
   „Hetzner-Mirror" — Modell-URLs auf den Mirror biegen): `TRANSFORMERS_CDN` → Hetzner-URL,
   Modell-Root → `<HETZNER_BASIS_URL>/models/`.
3. **Siegel-Wizard nachrüsten:** den kanonischen `assets/siegel-inhalt.js` (🔑 Identität & Spore
   erzeugen · signieren+⬇ · Backup · Wiederherstellen · ✍ Semantik neu signieren) in BLP
   einbauten und im Siegel-Modal verdrahten (heute referenziert BLPs Siegel-Text den 🔑-Knopf,
   ohne dass er existiert). Skill: `status-leiste-siegel`. Reihenfolge Modul 17 vor 15/16.
4. **`node tests/run.mjs` grün** + Drift-Guard für die byte-kopierten Module.
5. **Operator-Schritt (Klaus' Browser):** Siegel → 🔑 → Identität (oder Backup wiederherstellen,
   falls nodeId `MyHVM7Pd…` erhalten bleiben soll) → **Spore signieren** (lädt Modell von Hetzner,
   rechnet echten Vektor lokal) → `spore.json` ⬇ → committen. Reziprok verifizieren (✔ VALID).
6. **NETZ-STAND.md (Sage)** nachziehen: BLP `verified-spore` → `verified-match` (echter Vektor),
   Score gegen Sage/Tomys/family neu rechnen.

## 4. TABU (unberührt lassen)
`PROVIDER_MIN_MATCH`/0.80-Andock-Riegel · DB-Suffix `bookledgerpro` · GoBD/DSGVO-Kern ·
kein PII in Spore/Code · Buchhaltungsdaten werden NIE eingebettet.

## 5. Offene Frage an Klaus
- Genaue **`<HETZNER_BASIS_URL>`** + ob CORS/Content-Types stehen (Termux-Schritt aus §2).
- **nodeId erhalten** (`MyHVM7Pd…` per Schlüssel-Backup wiederherstellen) **oder** neue nodeId
  akzeptieren (wie die anderen Wellen-Knoten)?

## 6. Pflichtlektüre + Abschluss-Befehl (Brief-Kette)
Vor der Arbeit: `CLAUDE.md` · dieser Brief · `docs/PULS.md` (oberster Stand) · `ROADMAP.md` ·
Skills `saubere-netz-anmeldung` + `status-leiste-siegel` · `sbkim/03_embedding.js` +
`pinnwand-widget.js`-Mirror-Muster (nur lesen). Am Ende: PULS + `docs/SESSIONS.md` fortschreiben,
Folge-Brief schreiben, PR mit ehrlicher Verifikation, Operator-Ergebnis (spore.json) nach Klaus'
Browser-Lauf committen.
