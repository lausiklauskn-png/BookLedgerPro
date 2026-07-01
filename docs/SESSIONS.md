# Sitzungs-Log

Chronologische Notizen über Sitzungen hinweg. Neueste oben. Pflicht-Felder:
**Datum · Was getan · Stand · Offen/Nächstes.**

---

## 2026-07-01 — Mistral OCR als EU-Option neben Google Vision (Strang B2)

**Was getan (Branch `claude/semantic-matching-mistral-ocr-raxbb9`, frisch auf `origin/main`; Tests 2109/2109):**
- **Mistral OCR (EU) als wählbarer OCR-Anbieter** neben Google Vision — netzweiter B2-Rollout
  (Sage-Brief 2026-07-01, Modul 24). Fügt sich in die vorhandene Anbieter-Registry:
  `src/ai/anbieter.js` — Mistral-`modi` um `'ocr'` erweitert (kein neuer Anbieter, EU-Dienst gewinnt
  einen Modus). Das registry-getriebene KI-Einstellungen-Dropdown (`shell.js` `erlaubteAnbieter('ocr')`)
  zeigt Mistral automatisch; `STANDARD_WAHL.ocr` bleibt `vision`.
- Neues `src/ai/mistralOcr.js` (build-frei, ES-Modul, nach SBKIM-Modul-24-Vertrag): `buildMistralOcrRequest`
  (Bild→image_url / PDF→document_url, data-URL), `parseMistralOcrText` (pages[].markdown|text),
  `ocrMistral(input, key)` (POST `api.mistral.ai/v1/ocr`, `mistral-ocr-latest`, Bearer BYOK), `testMistralOcr`.
- `src/ai/vision.js` `ocr()` dispatcht jetzt: `mistral` → `ocrMistral(cfg.mistralKey)`, `vision` → Vision,
  sonst „aus". `aiConfig.js` `isOcrAktiv()` erkennt beide EU-Pfade (visionKey **oder** mistralKey).
  Der vorhandene „Mistral"-Verbindungstest in den Einstellungen deckt den (geteilten) Schlüssel ab.
- `sw.js` `CACHE_VERSION` v188 → v189. Tests `node tests/run.mjs` **2109/2109 grün** (+9: Registry-OCR-Liste,
  normalizeAnbieterWahl(ocr:mistral), Mistral-OCR Body/Parser Bild+PDF+leer).

**Stand:** EU-KI-Disziplin gewahrt (Mistral = EU/Frankreich, BYOK, opt-in, kein Schlüssel im Code, kein PII);
Vision bleibt Default. Build-frei, keine CDNs.

**Offen/Nächstes:** Browser-Sichttest (OCR-Anbieter „Mistral" wählen + echten Beleg scannen) — wartet auf
Klaus. Optional: eigener OCR-spezifischer Verbindungstest (heute deckt der Mistral-Text-Test den Schlüssel ab).

## 2026-06-28 — Inhalts-treuer Domänen-Vektor (SBKIM-Andock: von der Hülle zum Inhalt)

**Was getan (Branch `claude/rest-rollout-threshold-calibration-l6c92u`, frisch auf `origin/main`; Tests 2101/2101):**
- `sbkim/02_spore.js` + `sbkim/03_embedding.js` **byte-1:1 aus Sage `src/modules/`** aktualisiert —
  neu `regenerateOwnSpore` (gleiche nodeId neu signiert) + `embedContentVector` (L2-normierter
  Zentroid aus vielen Inhalts-Schnipseln) + Allow-List-Felder `embeddingSource`/`embeddingVersion`.
  md5 identisch zur Sage-Quelle (Drift-Guard), Diff = exakt der Inhalts-Vektor-Block.
- `sbkim/sbkim-init.js` `rdvCreateIdentity` (Knopf „🌐 Mit dem Netz verbinden") baut den
  `domainVector` jetzt aus **Standard-Konto-Labels** (`sampleContent()`: SKR03-Auswahl +
  Standard-Kostenstellen, verbatim aus `src/domain/accounts.js`/`crm-store.js`, bewusst statisch)
  via `embedContentVector`. `embeddingSource`/`embeddingVersion` mit-signiert; fail-soft auf den
  Beschreibungs-Vektor.

**Stand:** Headless grün, byte-1:1 + JSON valide. `index.html`/`sw.js` unverändert (Glue-only).
SIGNAL seq 21→22, AUSTAUSCH-Sage + PULS fortgeschrieben.

**Datenschutz-Grenze (sensible App):** NUR öffentliche Standard-Labels eingebettet — NIE live
angelegte/umbenannte Konten/Kostenstellen (Klarnamen-Risiko), NIE Beträge/Belege/Buchungstexte/OCR.

**Offen/Nächstes:** Browser-Live durch Klaus — „Mit dem Netz verbinden" (Re-Sign, Schlüssel lokal) →
neue Spore mit Inhalts-Vektor; Sage misst `verified-match` vorher (0.813525)/nachher. Schwelle 0.80
netzweit neu kalibrieren (Sage-Folge nach Kalibrier-Boden-Messung). **Browser-Live-Match wartet auf Klaus.**

---

## 2026-06-22 (Spät-Abend) — UI-Politur: Segment-Schalter, Inhaltsbreite 1200px, mobile Button-Reihen

**Was getan (Branch `claude/bookledgerpro-ui-polish-m7ms49`, SW v183→v184, Tests 2101/2101):**
- **Segmentierte Schalter** (`.segmented`): mit langen Optionen (z. B. „KI-Autonomie": Nur Vorschläge /
  Auto-Entwurf + Review / Autonom bei hoher Konfidenz) brachen sie im Hochformat in den runden
  999px-Rahmen um → riesiger „Stadion"-Pill mit frei schwebendem Text (Nutzer-Screenshots 21:02).
  Fix: im `@media ≤640` als saubere volle-Breite-**Liste** (Spalte, gemäßigter Radius, je Option eine
  Zeile, aktive hervorgehoben). Desktop/Tablet-Pill unverändert.
- **Inhaltsbreite** (`--maxw` in `tokens.css`): 880px → **1200px** (Nutzer-Entscheidung; großer Monitor
  wirkte „nicht in voller Breite"). Kopfzeile spannt weiterhin randlos.
- **Mobile Aktions-Button-Reihen** (`.btn-row` im `@media ≤640`): in EINER Zeile lassen + bei
  Platzmangel **seitlich scrollen** (`overflow-x:auto`), statt umzubrechen → Container wächst nicht
  in die Höhe (Nutzer-Entscheidung). Scope via `:not(:has(input/select/textarea))` → reine
  Button-Leisten (Tabellen-Aktionen, Toolbars, Vorschlag/Beleg, Import); Formular-Reihen mit
  Eingabefeldern brechen weiter normal um. Progressive Enhancement (ohne `:has` gilt das alte Umbrechen).

**Aus Nutzer-Screenshots (Handy, 20:58–21:13) beobachtet:**
- ✅ Gut: Shamir-Backup, Gebrauchsanleitung, Header (21:13), Segment-Schalter mit kurzen Optionen.
- 🐞 Echter Bug (gefixt): Segment-Schalter-Umbruch (s. o.).
- ℹ️ **Cache-Artefakt (kein Code-Bug):** Lampen-Labels (LEBT/VERKEHR/FREMD) zeigten im Hochformat noch
  an → die `@media`-Ausblendung aus #233 ist in `main`, das Gerät lief auf altem SW-Cache. Daraus folgte
  auch der horizontale Überlauf/Links-Beschnitt bei 21:08 (breites Widget). **Hard-Refresh → v184** behebt es.

**Nicht im Browser verifiziert (ehrlich):** Die CSS-Wirkung ist node-seitig nicht testbar (kein Headless-
Browser). Optisch zu prüfen: Segment-Liste im Hochformat, 1200px-Breite am Monitor, Button-Reihen-Scroll.
`:has()`-Scope greift nur in modernen Browsern (Chrome 105+/Safari 15.4+) — sonst altes Verhalten.

**Offen / Nächstes:** Browser-Sicht-Tests obiger drei Punkte; Test-Marken abhaken; Sage cap/needs abwarten.

---

## 2026-06-22 (Abend) — ELSTER-Fix, Layout-Zentrierung, Handyformat (Hamburger) + Mobil-Politur

**Was getan (alles gemerged, main 5c82dca, SW v183, Tests 2101/2101):**
- **#230** ELSTER-Deep-Links (USt-VA/Lohnsteuer) zeigten auf veraltete, 404-ende Pfade →
  jetzt stabile Formular-Übersicht `…/alleformulare`.
- **#231** Vollbild-**Zentrierung**: `.content`/`.app-body` `min-width:0` (Flexbox-Überlauf-Falle),
  `.card.no-pad` → `overflow-x:auto`. Per Pixel-Messung verifiziert (Inhalt war rechts übergelaufen).
- **#232** **Handyformat**: Navigation als **Hamburger-Schublade ☰** (`shell.js` Hamburger +
  `aria-expanded`; `@media ≤640` Drawer auf/zu, scrollbar). Desktop/Tablet (Querformat) unverändert.
- **#233** Mobil-Politur: `.btn-row{align-items:center}` (Buttons nicht mehr in die Höhe gestreckt),
  `.mandant`-Chip + Header-Buttons `nowrap` (kein Wort-Umbruch „Test 1"/„Mandant wechseln"),
  Lampen-Labels im Hochformat ausgeblendet (nur Punkte) → Kopfzeile bleibt niedrig.

**Vom Nutzer am Gerät bestätigt:** Navi-Schublade öffnet/schließt/scrollt; Kopfzeile vollständig;
Querformat ok. Hamburger ☰ per Pixel-Analyse in Handy-Screenshots nachgewiesen.

**Offen / Nächstes:**
- **Button-Container im Hochformat zu hoch** (Nutzer-Wunsch: Buttons einzeln, Container nicht höher).
  Rückfragen WO/WIE noch offen → mit Nutzer klären (Default-Vorschlag: Tabellen-Aktionen eine Zeile
  + `overflow-x:auto`). 
- **Container-Breite großer Monitor** (880 vs 1200 vs voll) — Entscheidung offen (`--maxw`).
- Sicht-Tests/Test-Marken abhaken; Sage cap/needs abwarten.
- **Bild-Limit:** diese Sitzung konnte Screenshots nur per Pixel-Analyse prüfen; **frische Sitzung
  nötig**, um Bilder wieder zu sehen.

---

## 2026-06-22 — Beleg-Scans für die Quartal-Demo (Increment 2)

**Was getan**
- 6 vom Nutzer KI-generierte Beleg-Bilder (Tank/Bürobedarf/Bewirtung/§13b-Cloud/Blumen-Quittung/Hotel)
  mit Pillow komprimiert (JPEG, ~1000px, q82) nach `assets/demo/` (zusammen ~930 KB).
- `src/domain/demodaten.js`: `_beleg`-Schlüssel an den 5 passenden Buchungen + Liste `belege` für einen
  **unverbuchten** Beleg (Blumen-Quittung 50 €) — bewusst als OCR-/„Konto-Vorschlag (SBKIM-Richter)"-Test-Target.
  `demoEntwuerfe`/`demoBefuellungsplan` reichen `_beleg`/`belege` durch.
- `src/domain/demodaten-store.js`: `ladeDemoBeleg()` (fetch `assets/demo/` via import.meta.url → File);
  Beleg wird **vor** dem Festschreiben gespeichert (`belegRef` fließt in die Hash-Kette, GoBD-Belegprinzip),
  danach `linkBeleg` (Rückverweis). Alles fail-soft (offline/headless → Buchung ohne Beleg).
- +5 Node-Tests (5 Buchungen mit Beleg, Dateien existieren, 1 unverbuchter Beleg, Namen eindeutig,
  klein/gross-Regression). SW v178→v179.

**Stand:** `node tests/run.mjs` → **2101/2101 grün**.

**Offen / Nächstes:** Quartal-Demo inkl. Belege im Browser durchklicken (🔗 an Buchungen; OCR + Konto-Vorschlag
auf der unverbuchten Quittung). Test-Marken abhaken. Sage cap/needs weiter abwarten.

---

## 2026-06-22 — In-App-Test-Marken + „Quartal"-Demo (volles Q1, alle Bereiche)

**Was getan**
- **Test-Marken** (gemerged, PR #227): `src/ui/testmarke.js` — anklickbare Marke „🧪 Test offen"→„✅ getestet"
  (localStorage), co-located beim Knopf (fehlt der Knopf, fehlt die Marke). Marken: `beleg-ocr`, `beleg-richter`,
  `sbkim-konten`, `sbkim-knoten`. `docs/TESTPLAN.md`. Master-Schalter zum Ausblenden. SW v176→v177.
- **„Quartal"-Demo** (neu): drittes Szenario in `src/domain/demodaten.js` (`quartalSzenario`), wählbar im
  Test-Modus (`src/ui/lock.js`, Radio „Vierteljahr"). Volles Q1 2026: **21 Buchungen** (19/7/steuerfrei §4,
  §13b Reverse-Charge, Bewirtung 70/30, Kfz/Tank, Telefon, Reise 7+19, Personal Brutto-Methode, AfA, GWG,
  Bankgebühren) + **Storno** einer Doppelbuchung (GoBD) + Stammdaten (3 Kunden, 3 Aufträge inkl. berechnet
  +Teilzahlung, 2 Mitarbeiter+Zeiten, 3 Eingangsrechnungen bezahlt/offen/storniert). Glue `demodaten-store.js`
  schreibt alles über die **echten** APIs (`saveEntwurf→festschreiben`, `storno`, CRM-/Payables-APIs); Stammdaten
  in eigenem try/catch (fail-soft). i18n DE+EN.
- **+21 Node-Tests** (Balance, validateBuchung, Q1-Datum, genau 1 Storno, §13b/7%/steuerfrei vorhanden,
  SuSa Soll==Haben, USt-VA-Konsistenz, Plan-Stammdaten, klein/gross-Regression). SW v177→v178.

**Stand:** `node tests/run.mjs` → **2096/2096 grün**. Reine Demo-/Test-Infrastruktur; Echtbetrieb unberührt.

**Offen / Nächstes (ehrlich):**
- **Beleg-Scans für die Quartal-Demo** noch nicht eingebunden — Nutzer generiert KI-Bilder (Prompts geliefert),
  dann nach `assets/demo/` + in der Glue als verschlüsselte Belege an passende Buchungen hängen (Increment 2).
- **Quartal-Demo + Test-Marken im Browser nicht durchgeklickt** (kein Headless-Browser): Glue-Pfad statisch
  geprüft, reine Vorlage node-getestet. Im Browser zu verifizieren (Journal/EÜR/USt/Aufträge/Payables/Storno).

---

## 2026-06-22 — `belegRichter` in die Beleg-UI verdrahtet + Sages Gute-Nacht-Karte (seq 31) quittiert

**Was getan**
- **UI-Verdrahtung von `belegRichter` (Hauptaufgabe).** Im Beleg-Workflow (`src/ui/views/documents.js`)
  bekommt jede Buchungsvorschlag-Karte (`vorschlagKarte`) einen aufklappbaren `<details>`-Block
  **„Konto-Vorschlag (SBKIM-Richter)"** mit Knopf „Konto vorschlagen". Beim Klick:
  - lädt **opt-in** den Embedder (`loadEmbedder`, ~30 MB einmalig — exakt der Pfad der SBKIM-Suche),
  - extrahiert `vendor`/`ustSatz` aus dem Belegtext (`extractFromText`),
  - ruft `belegKontierung(quelltext, {vendor,ustSatz}, Object.values(_idx), {embedQuery,embedPassage,
    apiKey: mistralKey, provider:'mistral', model, k:5, onProgress})`,
  - rendert ranked SKR03-Konten mit Score + (Richter-Modus) Begründung; Modus-Banner für
    `nur-vorfilter` (kein Schlüssel) / `fail-soft-vorfilter` (Netz/JSON) / Richter.
  Greift in **allen** Vorschlags-Pfaden (Schnellerfassung, E-Rechnung, Bankimport, OCR-Beleg), weil
  `vorschlagKarte` überall `quelltext` erhält. **Rein informativ** — ändert die Buchung nicht.
- **i18n** DE+EN: 14 neue `docs.richter*`-Schlüssel. **SW:** `belegRichter.js` in die Precache-Liste
  aufgenommen, **`CACHE_VERSION` v175 → v176** (Shell berührt, Browser-Lehre 4).
- **Briefkasten-Ritual.** Sages `SIGNAL.json` = **seq 31** (war 30) → neue **Gute-Nacht-/Dankeschön-Karte**
  (kein Auftrag; „Über den Ursprung hinaus" = wir als 2. Sage-Meilenstein; Modul 22 aus unserer Sprach-
  Schicht; lockere Rück-Quittung erbeten). Quittiert: **`ack[Sage]` 30 → 31**, Antwort-Karte
  (`AUSTAUSCH-Sage.md` Abschnitt 18 + Verlauf), unsere **`SIGNAL.json` seq 18 → 19** (Bau-Bericht).
  Sages `spore.json` live **gegengeprüft → ✔ VALID, unverändert, weiterhin nur `domainVector`**
  (`Sage_inbox.verify.md` gestempelt) — cap/needs noch ausstehend bei Sage.

**Stand:** `node tests/run.mjs` → **2075/2075 grün** (reine UI-Verdrahtung, keine Logik-Tests betroffen).
SW-Cache **v176**. Branch `claude/sage-verify-belegruichter-ui-bo2wzy` von `origin/main` (fc136ca).

**Offen / Nächstes (ehrlich):**
- **belegRichter-UI im Browser noch NICHT durchgeklickt** (kein Headless-Browser): Modell-Laden (~30 MB)
  + echter Mistral-Richter-Lauf nur statisch/node-seitig geprüft. DOM-Verdrahtung mirror-t 1:1 die
  bereits live bewährte SBKIM-Suche (`sbkimsuche.js`), aber der End-to-End-Klickpfad ist user-zu-verifizieren.
- **Sage cap/needs** weiter abwarten → dann Badge `Schichten` prüfen + Erfolgs-Quittung.

---

## 2026-06-21 — Briefkasten-Check (Sage noch ohne cap/needs) + OCR→Embedding→Richter-Brücke gebaut

**Was getan**
- **Briefkasten-Start-Ritual:** Sages `SIGNAL.json` gelesen → unverändert **seq 30** (von uns bereits
  quittiert, `ack[Sage]=30`); Sages `spore.json` geprüft → trägt weiterhin **nur `domainVector`**, noch
  **kein `capVector`/`needsVector`**. ⇒ Drei-Schichten-Handshake bleibt **allein bei Sage** offen; auf
  unserer Seite nichts zu tun/pushen. Unsere committete Spore (auf `main`) trägt nachweislich alle drei
  Vektoren (je 384-dim), `SIGNAL` seq 18 — konsistent.
- **Wartezeit produktiv genutzt** (Sage bot „denken wir mit" an): die bisher **fehlende Brücke**
  „Beleg-OCR → Embedding → Richter" gebaut. Bislang lief OCR-Text nur in den Heuristik-/Mistral-
  Kontierungspfad; der fertige SBKIM-Vorfilter+Richter (`embed.js`/`match.js`) war **nie mit einem Beleg
  verbunden**. Neues Modul `src/ai/belegRichter.js`:
  - `buildBelegQuery(ocrText, extracted)` — **rein, testbar**: destilliert aus rohem, verrauschtem OCR
    eine knappe semantische Anfrage (Lieferant führt; Beträge/Datum/IBAN/Telefon/Floskeln entrauscht;
    USt-Hinweis in Worten; dedupliziert, gekappt).
  - `belegKontierung(ocrText, extracted, konten, opts)` — verdrahtet die volle Kette: Anfrage →
    On-Device-Einbettung (`accountCorpusEntries`+`embedCorpus`) → `sbkimHybridSearch` (Vorfilter +
    Richter opt-in, EU/Mistral, **fail-soft**) gegen die SKR03-Konten. Node-testbar via injizierten
    `embedQuery`/`embedPassage`/`_chat` (kein CDN).
- **Tests +20** (`tests/run.mjs`): Anfrage-Entrauschung, voller Vorfilter-Pfad (bester Treffer = Kfz-
  Konto 4530), Richter-Modus mit injiziertem `_chat`, fail-soft bei Netzfehler, ehrliche Leerfälle.

**Stand:** `node tests/run.mjs` → **2075/2075 grün**. Branch von `origin/main` (v175) abgezweigt. Kern
real implementiert + Node-getestet. **Keine** Shell-/SW-Änderung → kein `CACHE_VERSION`-Bump nötig.

**Offen / Nächstes (ehrlich):**
- **UI-Verdrahtung noch nicht erfolgt** — `belegRichter` ist eine getestete Bibliotheks-Brücke, aber im
  Beleg-Workflow (`src/ui/views/documents.js`) noch **nicht** als sichtbarer „Konto-Vorschlag (SBKIM-
  Richter)"-Knopf angebunden. Das ist der nächste, **browser-zu-verifizierende** Schritt (lädt den
  Embedder opt-in wie die SBKIM-Suche → SW-Bump fällig, sobald Shell berührt).
- **Sage cap/needs** weiterhin abwarten (Monitor auf Sages `spore.json`); sobald vorhanden → Badge
  `Schichten` in der App prüfen + Erfolgs-Quittung an Sage.

---

## 2026-06-21 — Drei-Schichten beidseitig besiegelt: Spore signiert (cap/needs) + Sage-Handshake abgeschlossen

> 🏁 **Sitzung formell abgeschlossen.** Drei-Schichten beidseitig besiegelt (PRs #219–#223),
> Abschlussbrief an Sage live (§17, `ack[Sage]=30`). Einziger offener Faden liegt bei Sage
> (eigene cap/needs); bei uns kein offener Punkt. Andockpunkt für die neue Sitzung: `docs/PULS.md`.

**Was getan**
- **Domänen-Textfeld editierbar** (`network.js`/`embeddingCard`): `<textarea>` statt read-only, Default
  = Profil-Text, e5-`passage:`-Präfix wird erzwungen. cap/needs bleiben aus dem Profil. i18n DE/EN.
  SW v174→**v175**. (PR #220)
- **Spore signiert & committet** (`sbkim/spore.json`): im Browser an Klaus' Gerät erzeugt — echte,
  signierte `domainVector`+`capVector`+`needsVector` (je 384-dim, L2=1, `nodeId MyHVM7Pd…` unverändert).
  Headless `verifySpore` → **VALID**. `SIGNAL.json` seq 17→**18**, Sage um eigene cap/needs gebeten
  (AUSTAUSCH-Sage §15). (PR #221)
- **Briefkasten-Ritual:** Sages seq 28/29 quittiert (`ack` 27→29, reine Status-Briefe, PR #222);
  danach **Sages Antwort seq 30** erhalten und quittiert (`ack`→**30**): unsere Spore reziprok VALID,
  `verified-match` hält (Cosinus **0.813525**), **§14 `matchDimensions`-Vertrag akzeptiert**.
  **Abschlussbrief** geschrieben (AUSTAUSCH-Sage §17) + Übergabe in `docs/PULS.md`.

**Stand:** Unsere Seite der Drei-Schichten ist **fertig, live und reziprok bestätigt**. Tests
**2055/2055**, SW v175.

**Offen / Nächstes:** **Die Warte** — Sage trägt eigene cap/needs erst in einer Folge-Sitzung an Klaus'
Tablet nach (Re-Sign über Modul 02, privater Schlüssel im Browser). Erst dann schaltet der Knopf
„🜲 mein Knoten ↔ Netz" für Sage von `Domäne` auf `Schichten`. Neue Sitzung: Sages `spore.json` auf
cap/needs prüfen; wenn da → in App verifizieren (Badge `Schichten`) + Erfolgs-Quittung. Details in PULS.

---

## 2026-06-21 — Knopf „mein Knoten ↔ Netz": Drei-Schichten in der Suche nutzbar

**Was getan**
- `src/ui/views/sbkimsuche.js`: neuer Knopf **„🜲 mein Knoten ↔ Netz"** (nur Knoten-Bereich). Lädt die
  eigene `sbkim/spore.json`, baut `queryNode` (`queryVec`/`queryCapVec`/`queryNeedsVec`), filtert den
  eigenen Knoten aus dem Korpus und ruft `sbkimHybridSearch(corpus, { queryNode })` → der
  Drei-Schichten-Vorfilter `queryLocalDimensions` wird real benutzt.
- Treffer zeigen ein **Modus-Badge** (`Domäne`/`Schichten`), so ist sichtbar, welcher Pfad lief.
- i18n DE/EN. SW **v174**. Tests **2055/2055** (Engine getestet; der Knopf ist View — nicht node-testbar).

**Stand:** Drei-Schichten-Engine jetzt in der Suche **auslösbar**. Läuft heute im domain-Modus
(Sporen ohne cap/needs); schaltet auf schichten, sobald beide Seiten cap/needs tragen.

**Offen / ehrlich:** Live-Klick/Mic/Embedding nicht node-testbar. Volle Schichten brauchen
signierte cap/needs auf BEIDEN Seiten (unsere Signierung + Sage).

---

## 2026-06-21 — Spore-Signierung mit cap/needs: Drei-Schichten in-App aktivierbar

**Was getan**
- `src/sbkim/embed.js`: `embedTexts(texts, opts)` (Modell EINMALIG laden, mehrere Texte einbetten);
  `embedDomainVector` darauf umgebaut (Vertrag unverändert).
- `src/sbkim/nodeProfile.js`: `STAMM_CATEGORIES` (Angebot/cap) + `GUEST_CATEGORIES` (Bedarf/needs)
  ins `NODE_PROFILE` → speisen `buildCapText`/`buildNeedsText`.
- `src/ui/views/network.js` (`embeddingCard`): „Echte Vektoren erzeugen" bettet nun **Domäne +
  cap + needs** ein und **signiert** alle drei in die Spore (`capVector`/`needsVector`); zeigt L2
  je Schicht; verifiziert vor dem Download. i18n DE/EN aktualisiert.
- Tests +6 → **2055/2055**. SW **v173**.

**Stand:** Aktivierung ist jetzt **ein Browser-Klick** (Netzwerk → Echte Vektoren erzeugen →
spore.json committen). Engine + Signierung real & getestet.

**Offen / ehrlich (Nutzer-/Netz-Schritt):** Das Signieren braucht den geräte-lokalen Schlüssel im
**Browser** — nicht headless ausführbar. Voller node↔node-Drei-Schichten-Match feuert erst, wenn
auch die **Gegenstelle** cap/needs trägt (Sage baut kompatibel). Optionaler UI-Knopf „mein Knoten
↔ Netz" steht aus. Embed/Signier-Live-Teil nicht node-testbar (Assembly/Profil/Signatur schon).

---

## 2026-06-21 — EU-Politik „frei/bindend" für die Spracheingabe (Regel #8, Cross-Pollination von Sage)

**Was getan**
- Sage hat unser Sprach-Muster nachgebaut (ihr „Modul 21") und die **EU-Politik frei/bindend**
  ergänzt. Zurück übernommen: `policyEngines(policy)` + `pickEngine(policy, desired, browserSupported)`
  in `src/ai/speech.js` (rein, headless-äquivalent), `aiConfig.speechPolicy` (Default `frei`).
- View `sbkimsuche.js`: Politik-Wähler in der Spracheingabe; **`bindend`** sperrt die Web-Speech-Engine
  (nur EU, strikte Datenresidenz), erzwingt `eu` via `pickEngine`; **`frei`** = beide. i18n DE/EN.
- Tests +9 → **2049/2049**. SW **v172**. Muster-Doc-Abschnitt „Spracheingabe" ergänzt.

**Stand:** EU-Politik live & getestet. (Keine Sage-Quittung — reiner Code, Nutzer-Wahl.)

**Offen / ehrlich:** Web-/Mic-Teile nicht node-testbar (Politik-Logik schon). Drei-Schichten-Aktivierung
(cap/needs neu signieren) weiter offen.

---

## 2026-06-21 — DREI-Schichten-Erkennen GEBAUT (Sage Karte 04): Engine + Suche-Wiring + Tests

**Was getan (echter Code, nicht nur Doku)**
- `src/sbkim/match.js`: **`matchDimensions`** (zwei Lanes cap/needs → Lane1 `cos(queryCap×passageNeeds)`,
  Lane2 `cos(queryNeeds×passageCap)`; Schicht-Score = Mittel der berechenbaren Lanes; overall;
  **Nur-Anbieter-Modus**; **synchroner Wurf** `DimensionsAllNullError` bei vier null),
  **`schichtApoptose`** (je Schicht 0.60; 1 drunter erlaubt, 2+ → Apoptose),
  **`queryLocalDimensions`** (Knoten↔Knoten-Vorfilter; Apoptose wirkt; Rückfall auf domainVector).
- `src/sbkim/hybridSearch.js`: `sbkimHybridSearch({ queryNode })` nutzt den Drei-Schichten-Vorfilter.
- `src/sbkim/spore.js`: `buildSpore` signiert optionale `capVector`/`needsVector` MIT (verifizierbar).
- `src/sbkim/searchCorpus.js`: `nodeCorpusEntries` hebt echte (nicht-`_demo`) cap/needs.
- `src/sbkim/embed.js`: `buildCapText` (Angebot) / `buildNeedsText` (Bedarf).
- Tests +24 → **2040/2040** grün. SW **v171**. Muster/Brief/PULS aktualisiert.

**Stand:** Engine gebaut, getestet, in die Suche verdrahtet. An Sage gemeldet (AUSTAUSCH §14, seq 17).

**Offen / ehrlich:** **Aktivierung** — die committete Spore trägt noch KEINE echten cap/needs; bis
zum Neu-Einbetten + **Neu-Signieren** (Browser) läuft der Knoten-Pfad im **Nur-Anbieter-Modus**
(domainVector). Freitext-UI bleibt bewusst einschichtig. Optionaler UI-Knopf „mein Knoten ↔ Netz"
sowie Sages Bestätigung der Lane-/Apoptose-Zuordnung stehen aus. DOM/Browser-Teile nicht node-testbar.

---

## 2026-06-21 — Spracheingabe (DE/EN/RU) für die SBKIM-Suche + EU-Weg vom Nutzer verifiziert [PRs #211–#213]

**Was getan**
- **Spracheingabe** als additive Eingabe-Schicht an die SBKIM-Suche (`src/ai/speech.js`): zwei umschaltbare
  Engines — **Browser** (Web Speech API) und **EU/BYOK** (Google **Cloud Speech-to-Text, EU-Endpoint**).
  Pipeline (Vorfilter→Richter, Fail-soft) bleibt **unberührt** — die Suche frisst nur den String (#211).
- **Mehrsprachig:** Sprach-Wähler **DE/EN/RU**; EU-Engine bekommt die übrigen Sprachen als
  `alternativeLanguageCodes`. Such-Logik war ohnehin mehrsprachig (multilingual-e5-small + Mistral) (#212).
- **UX-Fix (Nutzer-Befund):** erkannter/getippter Text verschwand nach der Suche, weil `repaint()` das Feld
  mit `value:''` neu baute → jetzt in `_query` gehalten, beim Neuzeichnen erhalten, Reset nur beim
  Schließen/Neu-Öffnen (#212).
- **Sage-Briefkasten-Ritual:** AUSTAUSCH-Sage **§12** (Brief zum Nachbauen), `SIGNAL` **seq → 15**,
  Muster verallgemeinert in `docs/SBKIM-SUCHE-MUSTER.md` (Abschnitt „Spracheingabe"). Push = Signal (#213).

**Browser-verifiziert (vom Nutzer, 2026-06-21):** BEIDE Spracheingabe-Engines. Der **EU-Weg end-to-end**
bestätigt — Schlüssel freigeschaltet, Erkennung sehr gut, und 🎤→EU-STT→Text→Richter ergab **dasselbe Urteil
wie beim Tippen** (gleicher Text ⇒ gleiches Verdict).

**Stand:** Spracheingabe live & verifiziert, an Sage gemeldet. SW **v170**, Tests **2016/2016** grün.

**Offen / ehrlich:** weitere Sprachen jederzeit per `SPEECH_LANGS`-Array; Modell-Laden/Mikro/Cloud-Antworten
bleiben browser-/netzgebunden (nicht in Node ausführbar); Mehrfach-Absichts-Trennung im Richter weiter offen;
attestation roh (Sages Signier-Helfer fehlt).

---

## 2026-06-21 — SBKIM-Suche: QA-Härtung + Rück-Aktion an Sage (Hybrid-Match-Richter komplett) [mehrere PRs #205–#208]

**Was getan (echtes Nutzer-QA → Härtung, dann Sage gemeldet)**
- Nutzer testete die SBKIM-Suche in zwei harten Runden; jeder Befund wurde behoben & im Browser bestätigt:
  - **Vorfilter leer** (0.80 zu hoch) → **Top-k** (`minScore:0`, #205).
  - **Kontonummer-Halluzination** (SKR04 „6800" statt Korpus „4630") → Richter referenziert per **`id`**,
    angezeigt wird immer das kanonische Konto; erfundene verworfen (#206).
  - **Recall-Lücke** (Alltagssprache) → **Konto-Synonyme** + k=10 + Transparenz „geprüfte Kandidaten" (#207).
  - **Zurückhaltung/Steuer** (Strafzettel fälschlich auf Kfz) → Prompt-Regel **Bußgeld §4 Abs.5 EStG nicht
    abzugsfähig → passt=false**, „spezifischstes Konto vor Sammelkonto"; im Re-Test korrekt abgelehnt (#208).
- **Browser-verifiziert:** `available:true` (mistral-large, eu); sinnvolle Urteile (Konten + Knoten-Metaphern
  wie „die Karte, die sich selbst kennt"→Sage); **Fail-soft bei WLAN-aus** („Richter nicht verfügbar — Vorfilter
  gilt" + lokale Treffer, kein Throw); Zurückhaltung (K7 Strafzettel + N4 Kochrezepte → „keiner passt").
- **Rück-Aktion an Sage** (AUSTAUSCH-Sage **§11**, `SIGNAL` **seq → 14**): a/b/c + erster Richter-Lauf +
  gefundene/behobene Bugs gemeldet. Das Pushen ist das Signal.

**Stand:** Hybrid-Match-Richter eingebaut, QA-gehärtet, Sage gemeldet. SW v167, Tests **2005/2005**.

**Offen / ehrlich:** Mehrfach-Absichten trennt der Richter noch nicht zuverlässig (Vorfilter-Grenze);
attestation roh (Signier-Helfer fehlt bei Sage). Sages Whitening/Schwellen-Brief weiter ausstehend.

---

## 2026-06-21 — SBKIM-Suche: zweiter Bereich „Knoten finden" + Muster-Doku [Branch `claude/sbkim-knoten-suche`]

**Was getan**
- **Ur-Gedanke umgesetzt:** zweiter Such-Bereich **„Knoten (Mycel)"** in der SBKIM-Suche — Korpus = Peer-Sporen
  (`spore.json` + `*_inbox.json`), findet **semantisch gleichwertige Knoten**. Eleganz: signierte Sporen tragen
  ihren echten `domainVector` bereits → wird **direkt als passageVec** genutzt (kein Korpus-Embedding, nur die
  Anfrage). View bekam einen **Bereichs-Umschalter Konten | Knoten**.
- **Neu in `searchCorpus.js`:** `buildNodeText`, `nodeCorpusEntries` (Vektor direkt aus Spore, sonst
  `needsEmbed`), `fetchNodeSpores` (same-origin, fail-soft), `embedMissingVectors`.
- **Muster dokumentiert:** `docs/SBKIM-SUCHE-MUSTER.md` — die mehrstufige semantische Suchmaschine als
  **wiederverwendbares** Muster (Schicht 1 Vektor-Vorfilter / Schicht 2 KI-Richter; Korpus austauschbar;
  Vertrags-Fläche; Rezept für neue Bereiche; Regel-#1/#8-Konformität). Genau das „Such-Engine"-Muster für
  andere Apps (Konten/Sporen/Apps).
- Klarstellung an den Nutzer: **Richter ≠ Vektor-Vergleich** — Schicht 1 macht den Cosinus, der **Richter
  (KI)** liest Bedeutung und urteilt; korrigiert das Anisotropie-Rauschen.
- i18n DE/EN, SW **v163**. Tests **1998/1998 grün** (+9: buildNodeText, nodeCorpusEntries inkl. _demo→needsEmbed,
  fetchNodeSpores fail-soft, embedMissingVectors).

**Stand:** Code steht, node-getestet. **Offen (wie zuvor):** erster echter Mistral-Richter-Lauf im Browser
(beide Bereiche) — Rück-Aktion an Sage. Whitening/Schwellen-Brief von Sage weiter ausstehend.

---

## 2026-06-21 — SBKIM Hybrid-Match-Richter ans Such-Feld (BLP-native nach Sage-Spec) [Branch `claude/sbkim-hybrid-match`]

**Was getan (Sage-Andock-Brief 2026-06-21 umgesetzt)**
- **Rück-Aktion (a/b/c) ermittelt:** (a) BLP hatte **kein** Such-Feld → neue Ansicht „SBKIM-Suche" (eigener
  Menüpunkt, vom Nutzer gewählt); (b) Mistral-Schlüssel zur Laufzeit = `getAiConfig().mistralKey` (RAM, BYOK);
  (c) Korpus = Konten (`loadAccounts`), pro Eintrag `passageVec` via Embedder.
- **Bau-Weg = OPTION 1 (BLP-native nach Sage-Spec)** — von Sage (Spec-Owner) freigegeben, weil BLP `embed.js`
  (gleiches Modell) + `mistral.js` (EU) schon hat; Vendoring von Sage-Modul-03 brächte nur Dopplung + neuen CDN
  (Regel-#1-Bruch). Byte-genaues Vendoring war ohnehin nicht möglich (nur WebFetch-Zusammenfassungen) — ehrlich
  als **BLP-native Umsetzung** markiert, NICHT als verbatim Sage-Kopie.
- **Neu:** `src/sbkim/match.js` (queryLocal-Vorfilter + hybridMatch-Richter + parseVerdicts/attestation),
  `src/sbkim/hybridSearch.js` (Helfer, 4 Modi), `src/sbkim/searchCorpus.js` (Konten→Korpus),
  `src/ui/views/sbkimsuche.js` (Ansicht), Embedder-Singleton `loadEmbedder()` in `embed.js` (Opt-in, kein neuer CDN).
  Nav+Route+i18n DE/EN, SW **v162**.
- **Vertrags-Fläche 1:1 zu Sage:** Verdict `{label,anchorId,passt,score,begruendung}`; Modi `vorfilter-leer|
  nur-vorfilter|fail-soft-vorfilter|richter`; **Fail-soft: Richter wirft NIE**; attestation-Schema 1:1.
- Tests **1989/1989 grün** (+21: Korpus, Vorfilter-Schwelle, Richter, Fail-soft ohne Throw, Score-Clamp,
  alle 4 Modi). Syntax-Check der Browser-Dateien grün.

**Stand:** Code steht, node-getestet. **Offen (Rück-Aktion an Sage):** der **erste echte Mistral-Richter-Lauf**
muss im **Browser** laufen (Modell-Laden ~30 MB + Mistral-Aufruf, kein Schlüssel/Netz in der Bau-Umgebung) —
das ist ein Nutzer-Schritt. Danach an Klaus melden: available:true? sinnvolle Urteile? Fail-soft sauber bei
abgezogenem Netz?

**Offen / Nächstes:** Browser-Lauf der SBKIM-Suche; ggf. attestation signieren (sobald Sage Signier-Helfer hat);
Sages Whitening/Schwellen-Neukalibrierung (separater Brief).

---

## 2026-06-21 — Google-Vision-Schlüssel: nummerierte Direkt-Link-Anleitung in den KI-Einstellungen [Branch `claude/vision-key-guide`]

**Was getan**
- Nutzer-Stolperstein erklärt: Google liefert `401 „API keys are not supported by this API"`, wenn der Key
  ein **Gemini-/Vertex-Schlüssel** ist statt eines **Cloud-Vision**-Schlüssels (oder Vision-API nicht aktiviert).
  Der App-eigene Fehler-Hinweis (`visionFehlerHinweis`) diagnostiziert das bereits korrekt.
- **UX verbessert (für alle Nutzer):** Aus dem einen Hinweis-Link wurde eine **nummerierte 3-Schritt-Kette**
  mit je einem Direkt-Link: 1) Cloud Vision API aktivieren · 2) Billing verknüpfen · 3) API-Schlüssel erstellen
  (+ Warnzeile „erst aktivieren, dann Schlüssel"). i18n DE/EN, kleines CSS (`.vision-steps`). SW **v160**.
- Hintergrund: Google kann (anders als Mistral/Anthropic) keinen 1-Klick-Key liefern — Projekt → Billing →
  API-Aktivierung sind Pflicht-Vorstufen; die Kette führt so nah wie möglich heran.

**Stand:** Tests **1968/1968 grün**. **Ungetestet:** Live-OCR gegen die echte Vision-API (kein Key/Netz in
der Bau-Umgebung) — Body-/Parser-/Fehler-Logik ist node-getestet.

**Nachtrag (nach echtem Nutzer-Durchlauf):** Der Nutzer hat den Schlüssel **live erfolgreich** erstellt
(Google Vision + Mistral `aktiv ✓`) — aber Googles Oberfläche schickt einen durch ein Wort-Wirrwarr
(„Anmeldedaten" = Login? Nein, = Schlüssel; weißer Knopf „Anmeldedaten erstellen" → falscher Assistent;
nur der **linke Menüpunkt „Anmeldedaten"** + **„+ Anmeldedaten erstellen ▾" → „API-Schlüssel"** ist richtig).
Daraus eine **aufklappbare Klick-für-Klick-Anleitung** (`<details>`) direkt unter dem Vision-Feld gebaut —
exakt die erprobte Abfolge inkl. der drei Sackgassen-Warnungen (Assistent/OAuth/Dienstkonto). SW **v161**.

**Offen / Nächstes:** Warten auf Sages angekündigten Brief (Match-Modell-Neuerung/Whitening). Optional Phase 5d.

---

## 2026-06-20 — 🏅 `verified-match` bestätigt (Phase 5c abgeschlossen) [Branch `claude/phase-5c-verified-match`]

**Was getan**
- Sage hat geantwortet (menschlich vermittelt): **Cosinus Sage ⟷ BookLedgerPro = 0.810579 ≥ 0.80 →
  verified-match** (Sage `SIGNAL` seq 27, `ack[BookLedgerPro]=11`).
- **Wert unabhängig nachgerechnet** (nicht grün übernommen): Skalarprodukt unserer `sbkim/spore.json` ×
  Sages `sbkim/Sage_inbox.json`, beide L2=1 → **0.810579, identisch auf 6 Stellen**.
- `SEAL_STAGE` in `src/sbkim/nodeProfile.js` → **`verified-match`** (Gold); Guardrail bleibt grün (kein `_demo`).
- Briefkasten: Quittung **AUSTAUSCH-Sage §10**, unsere `SIGNAL` **seq → 13**, `ack[Sage]=27`. SW **v159**
  (Shell-Änderung: Siegel-Stufe). Tests **1968/1968 grün**.
- Vorab den Briefkasten gelesen (Sages SIGNAL + unser Postfach bei Sage) — ehrlich festgestellt, dass die
  hohen Cosinus-Werte netzweit eng (0.806–0.849) clustern (e5-small-Anisotropie); 0.80 ist großzügig.

**Stand:** BookLedgerPro voll vernetzter `verified-match`-Knoten. Siegel im Kopf wird golden.

**Offen / Nächstes:** **Phase 5d** — Symbiose-Import (Belege aus Mein-Tresor, Aufträge aus WorkFloh →
Buchungen). **Ungetestet:** Browser-Darstellung des goldenen Siegels (Logik/Stufe node-getestet).

---

## 2026-06-20 — Echter Domänen-Vektor LIVE angedockt (Phase 5c) [Branch `claude/phase-5c-real-vector`]

**Was getan**
- Knoten-Betreiber durch den **Andock-Flow geleitet** (Schritt für Schritt, anhand seiner Screenshots):
  Identität war bereits kanonisch (`MyHVM7Pd…`) → in „Mycel-Netz" → **„Echten Vektor erzeugen"** geklickt →
  Modell einmalig geladen → neu signierte `spore.json` heruntergeladen.
- Hochgeladene Spore **unabhängig headless verifiziert** (Felder ✓ · id ✓ · **Signatur ✓** · Tamper ✓ →
  VALID; 384-dim, **kein `_demo`**, `embeddingModel` gesetzt) und nach **`sbkim/spore.json`** committet
  (ersetzt den `_demo`-Vektor).
- **Sage-Briefkasten-Ritual:** `SIGNAL.json` **seq → 11**, `AUSTAUSCH-Sage.md` **§9** (echter Vektor live,
  Bitte um Cosinus). Siegel-Stufe bewusst **noch `verified-spore`** (ehrlich bis Sages Bestätigung; Guardrail
  erzwingt das). Tests **1968/1968 grün**.

**Stand:** Spore mit echtem Vektor live auf `main`/raw. Wartet auf Sages Cosinus-Bestätigung (≥0.80).

**Offen / Nächstes:** Sage rechnet Cosinus → bei ≥0.80 `SEAL_STAGE` in `nodeProfile.js` auf `verified-match`
heben (1 Zeile, Guardrail erlaubt es dann) → Siegel golden. **Ungetestet:** der Browser-Lauf des Modell-Ladens
selbst (lief beim Nutzer real durch — Beleg: gültig signierte Spore); reine Logik ist node-getestet.

---

## 2026-06-20 — Mycel an die Oberfläche: Flying Widget + Siegel-Modal + Embedding-Vektorpfad [PRs #186–#196]

**Was getan (eine PR je Schritt, alle gemergt)**
- **Mycel an die Oberfläche:** Kopf-Status-Chip → **Siegel-Badge (Bronze/Gold)** → **Briefkasten/Verkehr**
  (Live-Peer-Status via `src/sbkim/peers.js`) → schließlich **ein „Flying Widget"** oben in der Kopfzeile
  (`LEBT · VERKEHR · FREMD · SIEGEL`), das die Einzel-Chips bündelt; FREMD = lokaler Fremdzugriff-Wächter
  (postMessage/SW-Probe, RAM-only), SIEGEL-Klick öffnet das **Siegel-Modal** (großes, lesbares Wappen +
  „was drin ist"). CSS-Kollision mit dem EU-Datenschutz-`.siegel-badge` behoben (→ `.kopf-siegel`/`.fw-*`).
- **Sage-Briefkasten (§11.6):** Siegel-Band-Korrekturen quittiert; **Embedding-Problem** geschildert
  (e5-small ~118 MB > GitHub-100-MB-Limit, kein CDN; Mistral falscher Raum) → **Sage hat geantwortet
  (seq 26), gelesen & quittiert** (`ack[Sage]=26`, unsere `seq`→10).
- **Embedding-Vektorpfad gebaut** (#196, nach Sages Rezept): `src/sbkim/embed.js` (`buildPassageText`,
  `embedDomainVector` via transformers.js 2.17.2 + `Xenova/multilingual-e5-small`, mean-pool+L2=1, opt-in,
  Modell nie ins Repo), Karte in „Mycel-Netz" baut + **re-signiert** die Spore mit echtem Vektor (ohne
  `_demo`). **Ehrlichkeits-Guardrail-Test:** SEAL_STAGE darf nie `verified-match` sein, solange Spore `_demo` trägt.

**Stand:** Tests **1968/1968 grün**, SW **v158**. Deployte Spore weiterhin `verified-spore` (committeter
`domainVector` ist `_demo`).

**Offen / Nächstes (Hand am Hebel):** echten Vektor erzeugen = (1) kanonische Identität `MyHVM7Pd…` in der App
importieren (Browser-Drift `l3fuWEco` korrigieren), (2) „Echten Vektor erzeugen" → `spore.json` herunterladen →
nach `sbkim/spore.json` committen, (3) `SIGNAL.json` seq +1 → Sage rechnet Cosinus (≥0.80 → `verified-match`),
dann `SEAL_STAGE` auf `verified-match` heben (Guardrail erzwingt Reihenfolge). **Ungetestet:** Browser-Lauf des
Modell-Ladens/Embeddings (DOM/Netz, nicht node-testbar) — reine Logik (Text/Pooling/Signatur) ist node-getestet.

---

## 2026-06-20 — Identität geradeziehen + Siegel/Andock-Seiten aus der App erreichbar [Branch `claude/identity-canonical-fix`]

**Was getan**
- **Identitäts-Diskrepanz behoben** (von Sage gemeldet: App zeigte `ZrBxTuAr…`, registriert ist
  `MyHVM7Pd…`). Ursache: „Identität erzeugen" (App **oder** die Standalone-HTMLs) mintet jeweils
  einen NEUEN Schlüssel. Fix: `CANONICAL_NODE_ID` in `nodeProfile.js` (= committete spore.json),
  In-App **Abweichungs-Warnung** + **`replaceIdentity()`** (Mycel-Netz) zum Import des kanonischen
  Schlüssels (`sbkim/.node-secret.json`). Node-Test hält `CANONICAL_NODE_ID` mit `spore.json` in Sync.
- **`sbkim/andock.html` vendort** (Siegel + Identität/Spore-Erzeugung). **CDN-Import von
  @xenova/transformers nach Regel #1 deaktiviert** (fail-soft, BLP-Vendor-Anpassung — analog
  `mycelknoten.html`/#176); Demo-Vektor bleibt nutzbar.
- **App-Verlinkung:** neue Karte in „Mycel-Netz" mit Knöpfen „Komplettes Knoten-Programm öffnen"
  (`sbkim/mycelknoten.html`) + „Andock- & Siegel-Seite öffnen" (`sbkim/andock.html`) + Warnung,
  dass diese Seiten NEUE Identitäten erzeugen (kanonische gilt). SW-Cache `v149`, i18n DE/EN.
- Tests **1947/1947 grün**.

**Klarstellung:** `mycelknoten.html` (live unter `…/BookLedgerPro/sbkim/mycelknoten.html`) kam aus
#176 (frühere Sitzung), war aber **nirgends aus der App verlinkt** → daher in der App nicht auffindbar.
`andock.html` war bis jetzt gar nicht im Repo.

**Offen / Nächstes:** Sage-Sonderbrief beantworten (Datenschutz/kanonische nodeId/Schlüssel-Tresor);
Nutzer importiert MyHVM7Pd in der App. Dann 6.3 WorkFloh · 6.4 echtes Embedding (+ E2E-Stichworte).

---

## 2026-06-19 — verified-spore mit SB·KIMTool·Point besiegelt (zweiter Peer) [Branch `claude/handshake-sbkimtoolpoint`]

**Was getan**
- SB·KIMTool·Point hat seine URLs relayt → **reziprok verifiziert**: Spore aus raw/main geholt
  → **VALID (4/4)**; `id` unabhängig nachgerechnet → MATCH (`CyunQNDRZZ3st8xGDYyK0ymJLNxn_S1UcIJpFKpXXNY`,
  = von Klaus genannt). Domain `SBKIM-Werkzeug-Point`, echter `domainVector`.
- Angelegt: `sbkim/SB-KIMTool-Point_inbox.json` (1:1-Kopie, VALID) + `_inbox.verify.md` (Prüf-Vermerk).
- Postfach `AUSTAUSCH-SBKIMToolPoint.md` → **umbenannt** zu `AUSTAUSCH-SB-KIMTool-Point.md`
  (deren Repo-Slug), Quittung gestempelt. `SIGNAL.json` → `seq` 5, `ack[SB-KIMTool-Point]=23`,
  mailbox-Key/URL angepasst.
- **6.4-Notiz** in BAUPLAN: echten `domainVector` mit Krypto-/E2E-Stichworten anreichern (Wunsch
  beider Peers), Re-Signatur mit BESTEHENDEM Schlüssel (nodeId `MyHVM7…` erhalten).
- Tests **1945/1945 grün**; alle SBKIM-JSON valide; deren inbox VALID.

**Stand:** Zwei Peers `verified-spore` beidseitig besiegelt (Sage + SB·KIMTool·Point).

**Offen / Nächstes:** Rück-Quittung an Klaus (s. Chat). 6.3 WorkFloh-Pairing · 6.4 echtes Embedding
(+ E2E-Stichworte) → `verified-match`, zuerst Build-frei-/CDN-Machbarkeit prüfen.

---

## 2026-06-19 — Zweiter Peer: Andock-Brief an SB·KIMTool·Point [Branch `claude/andock-sbkimtoolpoint`]

**Was getan**
- SB·KIMTool·Point hat uns **unabhängig reziprok verifiziert** (VALID 4/4, `verified-spore`,
  npm test 9/9, in deren `docs/KNOTEN.md`/`knoten.json`/`nodes.json`/`status.json` aufgenommen)
  und erwartet unseren Andock-Brief für die direkte Verbindung.
- **Unsere Seite eingerichtet:** `sbkim/AUSTAUSCH-SBKIMToolPoint.md` (Postfach + Brief: Dank für
  die reziproke Prüfung, Bitte um deren spore/SIGNAL-URLs + aktuelle seq). `SIGNAL.json` → `seq` 4,
  `mailboxes.SBKIMToolPoint` ergänzt, `ack[SBKIMToolPoint]=0` (deren seq noch unbekannt).
- Tests **1945/1945 grün**; SIGNAL.json valide.

**Offen / Nächstes:** deren spore.json/SIGNAL.json-URLs erhalten → reziprok verifizieren
(`SBKIMToolPoint_inbox.json` + `.verify.md`), `ack` setzen, Postfach stempeln.

---

## 2026-06-19 — Phase-5-Andock Schritt 2: verified-spore mit Sage besiegelt [Branch `claude/sage-handshake`]

**Was getan**
- **Andock-Brief an Sage** relayt (`docs/SAGE_ANDOCK_BRIEF.md`, #179) → Sage hat geantwortet:
  Spore **VALID (4/4)**, **`verified-spore`** vergeben, im Hub registriert (Sage PR #303;
  `status.json` endknoten[], `NETZ-STAND.md`, 📬-Knopf — BLP = 6. Peer).
- **Reziproker Handshake** (Sage = Gegenstelle, nodeId `nysOZE3…`): Sages Spore aus raw/main
  geholt + headless verifiziert → **VALID**; `id` unabhängig aus `publicKey.x` nachgerechnet
  → MATCH. `sbkim/Sage_inbox.json` (signatur-reine 1:1-Kopie) + `sbkim/Sage_inbox.verify.md`
  (Prüf-Vermerk) angelegt.
- **Briefkasten quittiert:** `SIGNAL.json` → `seq` 3, `ack[Sage]=22`, `forNodes` → `["*"]`
  (Netz-Symmetrie, Sages Empfehlung). `AUSTAUSCH-Sage.md` mit Quittungs-Zeile gestempelt.
- Tests **1945/1945 grün**; alle SBKIM-JSON valide; Sage_inbox VALID.

**Stand:** **`verified-spore` beidseitig besiegelt.** BLP ist registrierter SBKIM-Peer.

**Offen / Nächstes:** Quittung an Klaus zurück (Sages seq 22, ack=22, VALID, forNodes=["*"]).
Schritt 6.3 WorkFloh-Pairing. Schritt 6.4 echter `domainVector` → `verified-match` (Sage warnt:
Buchhaltung ist domänenfern zur Mycel-Bibliothek, Cosinus ≥ 0.80 nicht garantiert; „kein Match"
ist ein sauberes Ergebnis). Transformers.js/WASM **build-frei ohne CDN** (Regel #1) noch zu prüfen.

---

## 2026-06-19 — Phase-5-Andock Schritt 1 (echte spore.json) + Geheim-Fach [Branch `claude/phase-5-sbkim-integration-v1v0ed`]

**Was getan**
- **BLP ist ein echter SBKIM-Knoten:** echte, signierte `sbkim/spore.json` + `sbkim/SIGNAL.json`
  committet (headless gemintet via neuem `tools/mint_spore.mjs`, zero-dep). nodeId
  `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`; `domainVector` `_demo` → `verified-spore`.
  `node tools/verify_remote_spore.mjs sbkim/spore.json` → **VALID**.
- `src/sbkim/nodeProfile.js` = eine Quelle der Wahrheit (Domänen-Felder) → committete und
  In-App-Spore können nicht driften. `identity.js importIdentity()` + UI „Identität importieren"
  (Mycel-Netz): geminteten Schlüssel in den Tresor übernehmen (gleicher nodeId). Privater
  Schlüssel → `sbkim/.node-secret.json` (**gitignored**).
- **Geheim-Fach (Tresor im Tresor):** `src/core/safebox.js` — unabhängig verschlüsselter
  Bereich mit EIGENEM Code (eigener PBKDF2/AES-GCM-Schlüssel, Fach-Key nur im RAM wenn offen →
  Defense-in-Depth), eigenes Shamir-Backup + Recovery. Ansicht „Geheim-Fach" (Nav/Routing):
  Einträge Schlüssel/Text/Datei. Vorbild Mein-Tresor (Fächer-Tresor), gleicher Krypto-Kern.
- Tests nach Merge mit `origin/main`: **1945/1945 grün**. SW-Cache `v148`. i18n DE/EN.

**Stand:** auf veralteter Basis (`9ebcfe0`) entwickelt, dann sauber mit `origin/main` (SW v147,
1926 Tests) gemerged — alle Beiträge sind additiv (main hatte weder spore.json noch Geheim-Fach).

**Offen / Grenzen (ehrlich):** UI-/IndexedDB-Pfade nicht headless E2E getestet (Krypto-/Recovery-
Kern node-getestet). Schritt 2 (Hub-Registrierung + Handshake → `verified-spore`) menschlich
vermittelt, offen. Nutzer muss `sbkim/.node-secret.json` sichern (per ZIP übergeben / ins
Geheim-Fach legen).

---

## 2026-06-19 — Lebenden Mycel-Knoten regelkonform vendort (`sbkim/mycelknoten.html`) [Branch `claude/read-respond-messages-t92x7a`]

**Was getan**
- Den **lebenden SBKIM-Knoten** (Andock-Helfer mit echten Sage-Modulen 01/02/03/04/05/07/15/16/17,
  Live-Lampen, Wächter-Log, Widget) nach `sbkim/mycelknoten.html` vendort.
- **Konformitäts-Audit der Egress-Pfade** (alle 4 Treffer im Code nachgelesen, nicht geraten):
  - `cdn.jsdelivr.net` → transformers.js-Import (Modul 03 Embedding), feuerte beim Andocken via
    Checkbox `doEmbed`. **Verletzte Regel #1 (keine CDNs).**
  - `api.anthropic.com` → Modul 04 `explainMatchLLM` (Stufe-B-LLM), US-Endpoint hartcodiert,
    **schlafend** (an keinen Knopf verdrahtet). **Latent Regel #8 (EU-KI).**
  - `gemini.google.com` → **kein Aufruf**, nur Demo-String in einer Wächter-Log-Testzeile (kosmetisch).
  - `raw.githubusercontent.com` → Peer-Spore-Datenabruf (SBKIM-Protokoll, **konform**).
- **Entscheidung mit Nutzer (zweistufig):** jetzt verbinden, EU-KI später. Daher chirurgisch neutralisiert
  (SBKIM-Protokollkern 1:1, nur Egress-Pfade), alle Stellen klar als `BLP-Vendor-Anpassung` markiert:
  - Embedding/CDN deaktiviert: `loadTransformers()` lehnt fail-soft ab (kein dynamischer Import mehr),
    `doEmbed`-Checkbox entfernt, Andocken erzeugt **verified-spore ohne `domainVector`**.
  - Stufe-B-LLM deaktiviert: `explainMatchLLM` endet vor jedem `fetch` fail-soft (Aufrufer nutzt
    Stufe-A-Resultat); US-Endpoint-Konstante + Doku-Kommentar entschärft.
  - Gemini-Demo-String → `example.com`.
- **Verifikations-Scan:** Datei enthält **keine** `cdn.jsdelivr|api.anthropic|gemini.google|generativelanguage|openai|unpkg|esm.sh|googleapis`-Treffer mehr; verbleibend nur `raw.githubusercontent.com` (Protokoll-Datenabruf), `example.com` (Demo), `w3.org` (SVG-Namespace). Kein `import(<CDN>)` mehr.

**Stand**
- `node tests/run.mjs` **1926/1926 grün** (keine Regression). Regeln #1 + #8 in der vendorten Datei eingehalten.

**Offen / ungetestete Teile (ehrlich)**
- `mycelknoten.html` ist ein **Browser-/DOM-Artefakt** (IndexedDB/WebCrypto/DOM) — die Andock-/Lampen-/
  Spore-Funktion ist **nicht im Browser verifiziert** (Node-Suite deckt sie nicht ab).
- **Semantisches Matching fehlt bewusst** (kein `domainVector`): Andocken/Verbinden zu Sage/Mycel voll
  möglich, aber keine bedeutungsbasierte Entdeckung. **Nächste EU-Phase:** Matching via Mistral-EU
  (BYOK, opt-in) — Schwellen (`PROVIDER_MIN_MATCH=0.80`, e5-Kosinus) müssen für EU-Embeddings neu validiert werden.

---

## 2026-06-19 — Sage-Antwort auf die E2E-Frage erhalten (menschlich vermittelt) [Branch `claude/read-respond-messages-t92x7a`]

**Was getan (reine Doku/Korrespondenz — kein App-Code geändert)**
- Die in der Vorsitzung gestellte **E2E-Spec-Frage** (`docs/SAGE_E2E_ANFRAGE.md`, Frage 1–3 + Reihenfolge) an
  **Sage-Protokol** beantwortet bekommen (über den Nutzer relayt, da BLP noch kein deployter Knoten ist).
  **Sage-Antwort: 1 JA / 2 JA / 3 JA mit Wie / 4 bestätigt** (Datum 2026-06-19):
  - **1 JA:** Briefkasten ist in `protocolVersion 0.1` **bewusst** öffentlich/signiert (Ed25519), **nicht**
    verschlüsselt — Vertraulichkeit ist eine **lokale Knoten-Sache**. (Gedeckt durch BLPs eigene Quellen:
    `src/sbkim/spore.js`, `src/core/crypto.js` nur lokal, `docs/SAGE_SYNC_BRIEFKASTEN.md` Dead-Drop.)
  - **2 JA:** Grad-B-**Pseudonymisierung** (P9 „Schlüssel-Abgleich") ist der freigegebene **Sofortpfad** —
    kein Bump, kein Bau. Ehrliche Grenze: Metadaten leaken weiter (≠ Verschlüsselung).
  - **3 JA mit Wie:** echte E2E als **Entwurf 0.2** — X25519 „sealed box" `{v,epk,iv,ct}`
    (ECDH→HKDF-SHA256→AES-GCM-256), optionales Feld `encryptionPublicKey`, an libsodium `crypto_box_seal`
    angelehnt, additiv/abwärtskompatibel. Formaler `protocolVersion`-Bump bleibt **Sage-Hoheit**.
  - **4 bestätigt:** Reihenfolge BLP-Knoten → WorkFloh-Pairing → 0.2-Stellungnahme → Go → Bau.
- **Zwei Scope-Rückfragen von Sage beraten** (jeweils reversibilitäts-/reihenfolgentreu): Sage solle (1) Antwort +
  Entwurf-Doku ablegen, **kein** INTERFACES-/`protocolVersion`-Bump (bleibt 0.1), und (2) **kein** netzweites Signal
  (`SIGNAL.json` unverändert) feuern, solange BLP nicht deployt ist. Sage hat genau so umgesetzt (deren **PR #302**).
- **BLP-Doku additiv fortgeschrieben:** PULS-Pointer, OFFENE_PUNKTE ★-Abschnitt, BAUPLAN Block 6 (E2E-Befund +
  6.5 von „nur falls Sage bejaht" auf „bejaht, nach Knoten-Go" präzisiert), NAECHSTE_SITZUNG COPY-Block (Relay-Schritt
  als erledigt markiert). **Bewusst KEIN** sbkim-Postfach in BLP angelegt (noch kein Knoten → kein Postfach-Schein,
  `sbkim/README`-Disziplin).
- **Git-Hinweis:** Sitzungs-Branch war auf einen veralteten Commit aufgesetzt; vor dem Schreiben sauber auf
  `origin/main` (a6d7c13) neu aufgesetzt (Merge-Konflikt selbst gelöst, kein App-Code betroffen).

**Stand**
- E2E-Strang inhaltlich **geschlossen**. Tests **1926/1926** grün (unverändert, kein App-Code), SW **v147**, 127 Module.

**Offen / Nächstes**
- **⏭ Phase-5-Schritt 1 (6.1):** BLP zum echten SBKIM-Knoten machen — Ed25519-Identität + `sbkim/spore.json` +
  `SIGNAL.json`, headless `node tools/verify_remote_spore.mjs` = VALID, Krypto-/Kanon-Helfer node-getestet;
  `domainVector` vorerst `_demo`. (Echte Spore wird **in-app** erzeugt + committet — keine erfundene Spore eincheck.)
- **Grad-B-Pseudonymisierung** ist ab sofort nutzbar (P9), unabhängig vom Deploy. **6.5 (X25519/0.2)** erst nach
  Knoten-Go. **Mensch-blockiert:** 6.2/6.3 (Hub/WorkFloh, fremde Repos).

---

## 2026-06-19 — Besprechung + Richtungs-Entscheidung: Sage-Mycel-Andock (Phase 5) [Branch `claude/bookledgerpro-sprint-review-05m92f`]

**Was getan (reine Doku/Abstimmung — kein Code geändert)**
- **Bilanz** des 5-Sitzungs-Sprints (P9/P10/P3+P4/P2/P8) im Chat gezogen; Stand bestätigt: Tests **1926/1926** grün,
  SW **v147**, **127 JS-Module**.
- **Erörterung** mit dem Nutzer zu (a) Datenmigration (Excel→CSV-Weg ist build-frei; `.xlsx`/OCR/ZUGFeRD-Erzeugen
  nicht build-frei → bewusste Grenze), (b) Bedeutung von „build-frei" + Vendoring-Mittelweg (wie `core/qr.js`),
  (c) Sage/SBKIM: Siegel (Ed25519-Spore) + Briefkasten (Dead-Drop) + „beides durch einen Briefkasten" (ein Umschlag,
  Sensitivitäts-Weiche Grad A Klartext / Grad B pseudonym|verschlüsselt).
- **E2E-Frage aus der Quelle geklärt:** `Sage-Protokol/docs/INTERFACES.md` über den öffentlichen `raw`-Kanal gelesen →
  Mycel heute **signatur-only** (Ed25519), **keine** Nutzlast-Verschlüsselung, kein X25519, `protocolVersion 0.1`.
  E2E ist machbar, aber **additive Spec-Erweiterung** → **Sage entscheidet** („Spec vor Code").
- **Brief an Sage** geschrieben: `docs/SAGE_E2E_ANFRAGE.md` (Frage 1–3 + X25519-Vorschlag + Reihenfolge-Vorschlag),
  menschlich zu relayen bis BLP ein Knoten ist.
- **Neues Thema abgestimmt:** Sage-Andock (Phase 5), Reihenfolge **ZUERST Sage/Hub, DANN WorkFloh** →
  `docs/BAUPLAN.md` **Block 6** (6.1–6.5) angelegt; PULS/NAECHSTE_SITZUNG/OFFENE_PUNKTE fortgeschrieben.
- **Nebenbei:** Stop-Hook-Fehlalarm (geerbte main-Historie als „unverified") an der Wurzel behoben — Remote-Branch
  per **Fast-Forward** auf `origin/main` gebracht (kein Force, nichts verloren). Git-Identität gesetzt.

**Stand**
- Tests **1926/1926** grün (unverändert, kein Code). SW **v147**, 127 Module. Branch deckungsgleich mit `main`.

**Offen / Nächstes**
- **⏭ Phase-5-Schritt 1 (6.1):** BLP zum echten SBKIM-Knoten machen — Ed25519-Identität + `sbkim/spore.json` +
  `SIGNAL.json`, headless via `tools/verify_remote_spore.mjs` = VALID, Krypto-/Kanon-Helfer node-getestet;
  `domainVector` vorerst `_demo`. Brief `docs/SAGE_E2E_ANFRAGE.md` dem Nutzer zum Relayen geben.
- **Ehrliche Grenzen:** 6.2/6.3 (Hub-Registrierung, WorkFloh-Pairing) berühren **fremde Repos → menschlich
  vermittelt**; E2E (X25519) hängt an Sages Antwort; echter `domainVector` (6.4) ist build-frei noch zu prüfen.

---

## 2026-06-19 — Sprint S5: P8 — QR-Einzelteilen (vendored reiner JS-Encoder, lokal/kein Netz) [Branch `claude/qr-encoder-offline-j4179g`]

**Was getan**
- **P8** = „Datei-Kanal (Masse) + QR (Einzel-Teilen, lokal erzeugt)". Der Datei-Kanal war bereits **P9** (Sitzung 1);
  diese Sitzung liefert den **QR-Teil**: einzelne (pseudonyme) Schnipsel **lokal** als QR teilen, **ohne Netz**.
- **Build-frei-Befund (positiv):** ein QR-Encoder ist ein klar spezifizierter, abhängigkeitsfreier Algorithmus →
  als eigenes ES-Modul vendorbar (Regel #1 erfüllt, kein npm/CDN-Runtime). **NICHT blockiert.**
- **Reine Logik** `src/core/qr.js` (node-getestet, **+40 → 1926/1926**): Byte-Modus (UTF-8), Versionen 1–40,
  Fehlerkorrektur L/M/Q/H, automatische Maskenwahl. Algorithmus **portiert aus der MIT-lizenzierten „QR Code generator
  library" von Project Nayuki** (Lizenztext + Attribution im Dateikopf), neu als ES-Modul geschrieben. Exporte:
  `qrMatrix`/`qrSvg`/`qrSvgDataUri`/`qrMaxBytes` + getestete Bausteine `gfMul`/`reedSolomonComputeDivisor`/
  `formatInfoBits`/`versionInfoBits`/`getNumRawDataModules`/`getNumDataCodewords`/`getAlignmentPatternPositions`.
- **Test-Anker (unabhängig von der Implementierung):** Kapazität (v1 = 19/16/13/9, v5-H = 46, v7-L = 156),
  Rohmodul-Formel (208/359/1568), Format-Info BCH(15,5) Ground-Truth `0x5412` für (M,0) + 32-Werte-Nachrechnung mit
  zweiter, unabhängiger BCH-Schleife, Versions-Info BCH(18,6) Ground-Truth v7 = `0x07C94`, RS-Teiler `[3,2]`,
  GF(256)-Reduktion `gfMul(2,128)=29`, α^255=1, Ausrichtungspositionen (v2=[6,18], v7=[6,22,38]), Matrix-Struktur
  (Finder-Ecken/weißer Ring/Zentrum, Timing-Alternation, dunkles Modul, Größe = 4·Version+17), Determinismus,
  `QR_ZU_LANG`-Fehler bei Überlänge, SVG ohne Klartext-Leck + escapte Optionswerte.
- **UI** `src/ui/schluesselabgleich.js`: in der Export-/Pseudonymisier-Karte neuer Knopf „Als QR anzeigen (lokal)" →
  rendert das **pseudonyme Dokument** (nie die Schlüssel-Datei!) als Inline-SVG (`data:image/svg+xml`-URI) + „QR
  speichern (SVG)"; zu langer Text → ehrlicher Hinweis auf den Datei-Kanal. CSS `.qr-img` (weißer Grund, scharfe Kanten).
  i18n de+en (`schluessel.qrShow`/`qrSave`/`qrHint`/`qrTooLong`).
- **SW** `CACHE_VERSION` `v146 → v147`, `src/core/qr.js` precacht. **127 JS-Module.**

**Stand**
- `node tests/run.mjs` → **1926/1926 grün**. ASCII-Render + zwei Beispiel-SVGs erzeugt; Matrix strukturell korrekt
  (drei Finder, Ausrichtungsmuster, Timing, Ruhezone). Beispiel-QRs dem Nutzer zum Geräte-Scan geschickt.

**Offen / Nächstes**
- **⏭ BESPRECHUNG mit dem Nutzer** — der 5-Sitzungs-Sprint (P9→P10→P3+P4→P2→P8) ist **abgeschlossen**; NICHT
  selbstständig weiterlaufen, sondern Bilanz ziehen + neue Richtung abstimmen.
- **Ehrliche Grenze (ungetestet):** **physischer Scan-Test braucht ein echtes Gerät** — in der Build-Umgebung gibt es
  keinen QR-Scanner/SVG-Renderer (analog „kein Headless-Browser"). Die node-Anker validieren alle Algorithmus-Konstanten
  unabhängig; die Platzierung ist strukturell + per Determinismus geprüft, aber nicht maschinell zurück-dekodiert.
- DOM/`data:`-URI/Download statisch geprüft (kein Headless-Browser).

---

## 2026-06-19 — Sprint S4: P2 — KI-Anbieterwahl je Modus, strikt EU [Branch `claude/ai-provider-mode-selection-rsse5c`]

**Was getan**
- **P2** macht den KI-Anbieter **je Funktion (Modus) wählbar** — **strikt innerhalb der EU**, **KEIN neuer Anbieter**.
  Nicht-EU bleibt bewusst geschlossen/dormant (nie wählbar). Reine Logik zuerst node-getestet, dann UI „statisch geprüft".
- **Reine Logik** `src/ai/anbieter.js` (node-getestet, **+28 → 1886/1886**):
  - `KI_MODI` = `ocr|kontierung|steuer`; `KI_REGION` + `ERLAUBTE_REGIONEN` (`eu`+`lokal` → Nicht-EU dormant).
  - Registry `KI_ANBIETER` (vision EU/mistral EU/On-Device-Heuristik/aus, je `region`+`modi`), `STANDARD_WAHL`
    (verhaltensgleich zum bisher Festverdrahteten: vision/mistral/mistral).
  - Selektoren `regionErlaubt`/`istAnbieterErlaubt`/`erlaubteAnbieter`/`istWahlGueltig`/`normalizeAnbieterWahl`
    (unzulässige/Nicht-EU-Werte fallen auf den Standard zurück)/`aktiverAnbieter`/`istAus`/`istLokal`/`istEuCloud`.
- **Persistenz** `src/ai/aiConfig.js`: neues verschlüsseltes Feld `anbieterWahl` (in `getAiConfig`/`saveAiConfig` immer
  normalisiert) + Helfer `aktiverKiAnbieter`/`isOcrAktiv`/`isSteuerAssistentAktiv`/`nutzeMistralFuerKontierung`.
- **Netz-Rand verdrahtet:** `ai/vision.js ocr` wirft bei OCR=aus; `ai/mistral.js categorize` + `ai/berater.js
  begruendeBuchung` nutzen `nutzeMistralFuerKontierung` (Wahl „heuristik" erzwingt On-Device, **kein Versand**);
  Steuer-Assistent in `ui/views/reports.js` über `isSteuerAssistentAktiv`; OCR-Bereitschaft in `ui/views/documents.js`
  über `isOcrAktiv`.
- **UI** `src/ui/shell.js` (`aiConfigSection`): drei Anbieter-Selects (je Modus, nur erlaubte EU/lokale Anbieter) +
  EU-Hinweis; Speichern/Test schreiben `anbieterWahl` mit. i18n de+en (`settings.aiProviderTitle`/`…Hint`/`aiMode.*`/
  `aiProv.*`).
- **SW** `CACHE_VERSION` `v145 → v146`, `src/ai/anbieter.js` precacht. **126 JS-Module.**

**Stand**
- `node tests/run.mjs` → **1886/1886 grün**. Reine Logik (Registry/Selektoren/Normalisierung/EU-Guard) abgedeckt.
- Verhaltensgleich zum Bestand, solange die Standard-Wahl greift; die Wahl „heuristik"/„aus" schaltet Cloud-Versand
  je Funktion gezielt ab.

**Offen / Nächstes**
- Sprint-Pointer steht jetzt auf **S5 · P8 — QR-Einzelteilen** (vendored reiner JS-QR-Encoder; build-frei prüfen,
  sonst ehrlich als blockiert melden und rückfragen). **Danach: BESPRECHUNG mit dem Nutzer.**
- **Statisch geprüft, NICHT im Browser verifiziert:** die drei Selects + Speichern/Laden über IndexedDB
  (kein Headless-Browser in dieser Umgebung).
- **Bewusste Grenze:** der Modus „kontierung" bündelt Kontierung **und** Begründung (beide Mistral-Textfunktionen mit
  On-Device-Fallback); der Steuer-Assistent ist eigen (mistral ↔ aus, kein On-Device-Pendant).

---

## 2026-06-19 — Sprint S3: P3 + P4 — Aufklärungstexte (KI-Autonomiestufen + Kleinunternehmer/Drittdaten) [Branch `claude/autonomie-kleinunternehmer-docs-5uuq74`]

**Was getan**
- **P3 + P4** als In-App-Aufklärung in „Recht & Dokumentation". Reine Daten + Selektoren zuerst,
  node-getestet; dann UI „statisch geprüft" (kein Headless-Browser hier).
- **Reine Logik** `src/domain/aufklaerung.js` (node-getestet, **+22 → 1858/1858**):
  - `AUTONOMIE_STUFEN` — die drei App-Stufen `suggest`/`draft`/`auto` (deckungsgleich mit `state.AI_LEVELS`),
    je Titel, Kurztext und 3 erklärenden Punkten (was die KI tut, was manuell bleibt).
  - `AUTONOMIE_GRENZEN` — die harte Grenze in JEDER Stufe: **Festschreiben bleibt manuell** (GoBD), Korrektur
    nur per Storno, kein Datenabfluss ohne Bestätigung, Endverantwortung beim Nutzer.
  - `KLEINUNTERNEHMER_DRITTDATEN` — § 19 UStG befreit NUR von der USt, nicht von DSGVO/Aufbewahrung: Punkte zu
    Art. 6/13/14/28/32 DSGVO, Verarbeitungsverzeichnis-Schwelle Art. 30 Abs. 5, Aufbewahrung § 147 AO/§ 257 HGB
    vor Löschverlangen, verschlüsselte Belege Dritter, AVV bei externer EU-KI.
  - Selektoren `autonomieStufe(id)`, `aktiveAutonomieStufe(settings)` (Fallback `suggest`),
    `drittdatenHinweisRelevant(aiConfig)` (true sobald ein EU-KI-Schlüssel gesetzt ist).
- **UI** `src/ui/views/legal.js`: zwei neue Karten — „KI-Autonomiestufen" (alle drei Stufen erklärt, die aktuell
  in den Einstellungen gewählte Stufe markiert, darunter die festen Grenzen) und „Kleinunternehmer & fremde Daten"
  (Einleitung + Punkte; betont den AVV-Hinweis, wenn externe EU-KI konfiguriert ist — `getAiConfig()` async).
  i18n de+en (`legal.autonomie*`, `legal.drittdaten*`), neue CSS-Klassen (`legal-stufe`/`legal-liste`/`.note`).
- **SW** `CACHE_VERSION` `v144 → v145`, neues Modul precacht. **125 JS-Module.**

**Stand**
- `node tests/run.mjs` → **1858/1858 grün**. Reine Logik abgedeckt; Karten-Texte sind bewusst deutsch (wie die
  bestehenden GOBD/DSGVO-Blöcke), nur Titel/Hinweise sind i18n.

**Offen / Nächstes**
- Sprint-Pointer steht jetzt auf **S4 · P2 — KI-Anbieterwahl je Modus (strikt EU)**.
- **Statisch geprüft, NICHT im Browser verifiziert:** Darstellung/Hervorhebung der aktiven Stufe und der async
  AVV-Betonung (kein Headless-Browser in dieser Umgebung).

---

## 2026-06-19 — Sprint S2: P10 — handelnde Person als Besteller [Branch `claude/actor-orderer-invoice-rw7ec4`]

**Was getan**
- **P10** trägt jetzt die **handelnde Person als Besteller** (Ansprechpartner, der im Namen des Kunden bestellt hat)
  **additiv** durch Auftrag → Rechnung. Sauber getrennt vom Kunden (= Rechnungsempfänger).
- **Reine Logik** `src/domain/besteller.js` (node-getestet, **+26 → 1836/1836**):
  - `normalizeBesteller(value)` — akzeptiert String (= Name) oder Objekt `{name,funktion,email,telefon}`, trimmt alle
    Felder, **`null` ohne Name** (abwärtskompatibel zu Aufträgen ohne Besteller).
  - `validateBesteller(value)` — optional (leer/null gültig); Name-Pflicht nur, wenn Funktion/E-Mail/Telefon ohne Name
    angegeben sind; E-Mail formal geprüft; Name-Längen-Cap.
  - `bestellerLabel` („Max Müller (Einkauf)") + `bestellerKontaktzeile` („z. Hd. Max Müller (Einkauf)") — die
    Dokumentzeile zeigt **nur Name + Funktion**, NICHT E-Mail/Telefon (Prime Directive: nichts Internes/Überflüssiges
    nach außen; E-Mail/Telefon bleiben für die interne Kontaktaufnahme).
- **Verdrahtet:** `domain/orders.js` (`validateAuftrag` ruft `validateBesteller`; `AUFTRAG_EDIT_FELDER` enthält
  `besteller`), `domain/crm-store.js` (`saveAuftrag` persistiert `normalizeBesteller`; `importWorkFloh` reicht
  `besteller` durch), `domain/rechnung.js` (`baueRechnung` liefert Dokumentfeld `besteller`),
  `domain/importworkfloh.js` (`normalizeImport` reicht `besteller` roh durch).
- **UI** `ui/views/orders.js`: vier optionale Formularfelder (Name/Funktion/E-Mail/Telefon) + Hinweistext im
  Auftragsformular; Besteller-Label in der Auftragsliste; „z. Hd."-Zeile im Empfängerblock der druckbaren Rechnung.
  i18n de+en, SW `v144`, neues Modul `src/domain/besteller.js` precached.

**Stand**
- **Tests 1836/1836 grün · SW v144 · 124 JS-Module.** Sprint-Pointer **S2 (P10) erledigt → steht jetzt auf S3 (P3+P4).**
- GoBD: Besteller ist mutable CRM-Metadaten am Auftrag (kein Eingriff in die festgeschriebene Buchungs-Hash-Kette);
  die **Buchung** trägt KEINEN Besteller — er steht nur auf dem Dokument + im CRM-Record.

**Nächstes / Sprint**
- **S3 → P3 + P4 — Aufklärungstexte:** KI-Autonomiestufen (P3) + Kleinunternehmer-Pflichten bei Drittdaten (P4) als
  In-App-Texte in „Recht & Doku"/Einstellungen. Klein, build-frei.

**Offene Grenzen / ungetestet**
- DOM/IndexedDB/Datei-Picker statisch geprüft (kein Headless-Browser).
- Besteller fließt bewusst NICHT in die XRechnung (CII-Käuferkontakt BT-56/57) — möglicher Folgeschritt.
- „z. Hd."-Präfix ist fest deutsch (Deutschland-zuerst; das Rechnungsdokument ist deutschsprachig).

---

## 2026-06-19 — Sprint S1: P9 — Datei-Import mit exaktem Schlüssel-Abgleich [Branch `claude/p9-file-import-key-match-opvy4e`]

**Was getan**
- **P9** macht den Pseudonym-Round-Trip **dateibasiert / sitzungsübergreifend.** Bisher lebte die
  Token↔Klartext-Tabelle nur im RAM eines einzelnen `tokenize → senden → reidentify`-Durchlaufs.
- **Reine Logik** `src/ai/schluesselabgleich.js` (node-getestet, **+38 → 1810/1810**):
  - `gleicheAb(text, schluessel)` — **exakter Schlüssel-Abgleich**: jeder Token nur ersetzt, wenn sein Schlüssel exakt
    vorliegt (keine Heuristik); verlustfrei via `pseudonym.reidentify`; Bericht `ersetzt`/`fehlend`/`ungenutzt`/
    `vollstaendig` — **Token OHNE Schlüssel bleiben sichtbar stehen** (`[[…]]`), nichts wird erfunden.
  - `serialisiereSchluessel`/`parseSchluessel` — **Schlüssel-Datei = „Anker-Tresor"** (JSON `blp-schluessel` v1; enthält
    Klartext → bleibt gerätelokal). `parse` robust ggü. map-Liste + `{token:wert}`-Objekt + Fehlerfällen.
  - `tokenVorkommen`/`typAusToken`/`istToken`/`schluesselAusMap`/`abgleichBericht` (Zähler ohne Klartext)/`pruefeRoundtrip`
    (Selbsttest, auch mit Briefkasten-Scopes verlustfrei).
- **UI** `src/ui/schluesselabgleich.js` — zusammenklappbare Karte in den Einstellungen (unter „Datenschutz bei KI"):
  **1.** Klartext (einfügen/laden) → pseudonymes Dokument (Download) + Schlüssel-Datei (Anker-Tresor) via
  `ladeAnker`+`tokenize`; **2.** Antwort-Dokument + Schlüssel-Datei laden → `gleicheAb` → re-identifizierter Text +
  ehrlicher Bericht. Mount in `ui/shell.js`. i18n de+en, SW `v143`, neue Module precached.

**Stand**
- **Tests 1810/1810 grün · SW v143 · 123 JS-Module.** Sprint-Pointer **S1 (P9) erledigt → steht jetzt auf S2 (P10).**

**Nächstes / Sprint**
- **S2 → P10 — handelnde Person als Besteller** an Auftrag/Rechnung (Datenmodell **additiv** + UI-Feld; Prime Directive/
  GoBD). Danach S3 (P3+P4), S4 (P2), S5 (P8) — **EINER pro Sitzung, danach Besprechung.** COPY-Block: `docs/NAECHSTE_SITZUNG.md`.

**Offene Grenzen / ungetestet**
- Reine Logik node-getestet; **DOM/Datei-Picker/Download statisch geprüft** (kein Headless-Browser). Browser-Sichttest
  der Schlüssel-Abgleich-Karte steht beim Nutzer aus. Schlüssel-Datei wird (bewusst) **unverschlüsselt** als lokaler
  Download abgelegt — der Nutzer ist verantwortlich, sie nicht zusammen mit dem pseudonymen Dokument weiterzugeben
  (Warnhinweis in der UI). Eine optionale verschlüsselte Ablage des Anker-Tresors im Tresor ist ein möglicher Folgeschritt.

---

## 2026-06-19 — Transparenzbericht (HTML-Update + in-App-Link) · P6 CSV/vCard-Import · 5-Sitzungs-Sprint vereinbart

**Was getan**
- **#165** Transparenzbericht `docs/TRANSPARENZ_ZWISCHENSTAND.html` auf Stand 19.06. (Test-Modus/Datensicherung/Angebote/
  Liquidität/Lohn von „geplant" → ✓; K1–K6, Zahlen aktualisiert).
- **#166** Transparenzbericht **in der App** verlinkt: Karte in „Recht & Doku" → öffnet die EINE Quelle
  `docs/…html` (Navigationen netz-zuerst → stets aktuell; offline gecacht). SW-Navigations-Fallback verbessert.
- **#167 P6** Kundenimport aus **CSV und vCard** — reine Logik `domain/kundenimport.js` (`parseKundenCsv`/`parseVcard`/
  `normalizeKunde`/`importKundenAusText`, +18 → **1772/1772**) + Import-Karte `ui/views/customers.js` (verschlüsselt,
  vorhandene Namen übersprungen) + additives Feld `telefon` in `crm-store.saveKunde`. SW `v142`.

**Stand**
- **Tests 1772/1772 grün · SW v142 · 121 JS-Module.** Block 1+2 komplett · Block 3 (Liquidität) ausgebaut · Block 4
  (V-Lohn) komplett · P6 ✓.

**Nächstes / Vereinbarung (Nutzer 2026-06-19)**
- **5-Sitzungs-Sprint, EINER pro Sitzung, danach Besprechung:** S1 P9 (Schlüssel-genauer Import) · S2 P10 (Besteller-
  Person) · S3 P3+P4 (Aufklärungstexte) · S4 P2 (KI-Anbieterwahl, EU) · S5 P8 (QR, vendored Encoder). Plan in
  `docs/BAUPLAN.md` Block 5 + `docs/NAECHSTE_SITZUNG.md` (COPY-Block, Sprint-Pointer auf **S1 → P9**).
- **Arbeitsauftrag:** selbstständig nach Logik + Nutzen; **größere Konflikte/Unklarheiten über `AskUserQuestion`
  eskalieren** (Datenmodell/GoBD/Krypto, Mehrdeutigkeit, Regel-Konflikt, nicht-build-frei, Architektur-/Merge-Konflikt),
  Kleines selbst entscheiden.

**Offene Grenzen / ungetestet**
- Reine Logik node-getestet; DOM/IndexedDB **statisch geprüft** (kein Headless-Browser). Browser-Sichttest (Lohn-Ansicht,
  Transparenz-Link, Kundenimport) steht beim Nutzer aus.

---

## 2026-06-18 — V-Lohn: Lohn-Buchungskern KOMPLETT (L1–L6) + Liquiditäts-Treiber [mehrere Branches]

**Nachtrag (L4–L6):** Der Lohn-Track wurde in dieser Sitzung **vollständig** abgeschlossen.
- **#162 V-Lohn L4** — `lohnsteuerAnmeldung(laeufe,{monat})` + `export.buildLohnsteuerAnmeldungPaket` (CSV-Datenpaket,
  NICHT amtlich, kein Direktversand); UI-Karte „Lohnsteuer-Anmeldung (je Monat)" mit Download + ELSTER-Link (+10).
- **#163 V-Lohn L5** — `offeneLohnabgaben(buchungen)` (Saldo 1741/1742 aus festgeschriebenen Buchungen) +
  `lohnabgabeZahlungEntwurf` + Store `bucheLohnabgaben`; UI-Karte „Abzuführende Lohnabgaben (offen)" + „Als bezahlt
  buchen (Entwurf)" (+8).
- **L6** — `docs/LOHN.md` (Architektur/Workflow/Konten/ehrliche Grenzen/Test-Modus) + Abschlussbrief.
- **Endstand: Tests 1754/1754 grün, SW v140, 120 JS-Module. Block 4 (V-Lohn) KOMPLETT.** Nächstes: Mein-WorkFloh
  Test-Modus (eigenes Repo, Nutzer-Wunsch) bzw. Browser-Sichttest der Lohn-Ansicht.

---

## 2026-06-18 — V-Lohn: Lohn-Buchungskern L1–L3 (+ Liquiditäts-Treiber) [Branches `claude/bookledgerpro-liquidity-runway-0idq3p`, `claude/lohn-buchungskern`, `claude/lohn-store`, `claude/lohn-ui`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 (Liquidität) bis zur Reichweite ausgebaut. **Diese Sitzung:** zunächst Block 3
  um den **Liquiditäts-Treiber** ergänzt (#157), dann auf **Nutzer-Wunsch** ein **neuer, finiter Track gestartet:
  V-Lohn — Lohn-Buchungskern** (BAUPLAN Block 4). **Scope-Entscheidung des Nutzers (2026-06-18):** „Lohn-Buchungskern" —
  BLP **bucht** Lohn/Gehalt GoBD-sicher, **berechnet aber keine** Lohnsteuer/SV (kein ELStAM/DEÜV/amtl. Tabellen; die
  Beträge kommen aus der Entgeltabrechnung). Reihenfolge: erst Lohn in BLP, **danach** WorkFloh-Test-Modus (eigene Sitzung).

**Was getan**
- **#157 Liquiditäts-Treiber** — `domain/liquiditaet.js groessteFaellige` + UI-Liste „Größte anstehende Bewegungen" in
  der Liquiditäts-Karte (+14 → 1689).
- **#158 V-Lohn L1** — reine Logik `domain/lohnbuchung.js` (Brutto-Methode `lohnBuchungZeilen`/`lohnBuchungEntwurf`/
  `validateLohnlauf`/`lohnNettoCent`; Soll 4120 Brutto + 4130 AG-SV, Haben 1200/1740 Netto + 1741 Steuern + 1742 SV) +
  Seed-Konten `domain/accounts.js` 4110/1740/1741/1742 (+23). Entwurf `validateBuchung`-gültig.
- **#159 V-Lohn L2** — Store `domain/lohn-store.js` (verschlüsselt: save/list/get/delete + `bucheLohnlauf` → `saveEntwurf`,
  Datum = Monatsletzter) + reine `normalizeLohnlauf`/`lohnkontoAggregat`/`lohnlaufBuchungsdatum` (+22).
- **#160 V-Lohn L3** — UI `ui/views/lohn.js` (NAV „Lohn", privat/verein ausgeblendet): Lohnlauf-Formular + Live-Vorschau
  (Netto/Soll=Haben) → speichern → „Buchen (Entwurf)" → Lohnkonto je Mitarbeiter; `shell.js`/`nutzungsmodus.js`-Gating;
  i18n de+en (+1 NAV-Gating-Assertion). **End-to-end bedienbar.**

**Stand**
- **Tests 1735/1735 grün**, SW **v138**, 120 JS-Module. Vier PRs gemergt (#157–#160). V-Lohn L1–L3 von 6 erledigt.

**Offen / Nächstes**
- **V-Lohn L4** — monatliche Lohnsteuer-Anmeldung als Kennzahlen-Datenpaket (analog USt-VA); dann L5 SV-/LSt-Zahlungs-
  übersicht, L6 Doku `docs/LOHN.md` + Abschluss. Plan: `docs/BAUPLAN.md` Block 4.
- **Nutzer-Parallelwunsch:** Befehl an eine **Mein-WorkFloh**-Sitzung — Test-Modus nach `docs/TEST_MODUS.md` (⇄-Abschnitt).
- Optional weiterhin: Browser-Sichttest (kein Headless-Browser hier).

**Offene Grenzen / ungetestet**
- Lohn-Logik + Store-Aggregat node-getestet; **DOM/IndexedDB/Lohn-UI statisch geprüft** (kein Headless-Browser).
- Inhaltlich bewusst außen vor (eigenes, zertifiziertes Produkt): vollautomatische Brutto→Netto-Berechnung, SV-Meldungen
  (DEÜV), ELStAM, Beitragsnachweise. BLP ist die Buchungs-/Kontroll-Schicht, nicht die Abrechnung.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditäts-Treiber (größte anstehende Bewegungen) [Branch `claude/bookledgerpro-liquidity-runway-0idq3p`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut bis zur **Reichweite („Runway")** (Vorsitzung). Die Liquiditäts-Karte
  beantwortet inzwischen *wie viel* bald fällig ist (Summen), *wie tief* der Saldo sinkt (Tiefpunkt), *wie viel fehlt*
  (Deckungslücke) und *bis wann* das Geld reicht (Reichweite) — alles über **Summen/Salden**. **Befund:** Es fehlte die
  naheliegende Anschlussfrage „**woran** liegt das?": welche einzelne Forderung sich einzutreiben lohnt, welche
  Verbindlichkeit groß ansteht. Sauberer, build-freier Drill-down auf dieselbe Datengrundlage.

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +14 → **1689/1689**): **`groessteFaellige({forderungen,
  verbindlichkeiten, heute, horizontTage, limit})`** + Konstante `LIQUIDITAET_TREIBER_DEFAULT` (3). Liefert die nach
  offenem Betrag absteigend sortierten bald fälligen Posten aus DEMSELBEN Fenster wie `baldFaellig` (Fälligkeit ab heute
  … heute+Horizont, nicht überfällig), je Eintrag `{richtung:'ein'|'aus', betragCent, faelligAm, name, referenz}`, auf
  `limit` gekürzt; ≤0-Beträge raus; deterministische Sortierung (Betrag → früheste Fälligkeit → Name). Unterstützt
  `offenCent` (Verbindlichkeiten) wie `betragCent` (Forderungen).
- **`src/ui/views/dashboard.js`**: kleine Liste „Größte anstehende Bewegungen" in der Liquiditäts-Karte — Wer/Referenz/
  Datum links, vorzeichenbehafteter Betrag rechts (Eingang +/grün, Ausgang −/rot) über das bestehende `report-line`-
  Layout; gefüttert aus denselben angereicherten Posten (`forderungReport`/`verzugReport`). **Bucht nichts.**
- i18n de+en (`dashboard.liquidityDriversLabel`/`…DriverIn`/`…DriverOut`), **SW `v135`** (kein neues Modul).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1689/1689 grün** (`node tests/run.mjs`). SW `v135`,
  117 JS-Module. PR offen (Draft → ready → CI → Merge). **Hinweis:** entwickelt auf dem für die Sitzung vorgegebenen
  Branch `claude/bookledgerpro-liquidity-runway-0idq3p` (Feature + Abschlussbrief in einer PR, da die Sitzung an genau
  diesen Branch gebunden ist).

**Offen / Nächstes**
- Optional: Browser-Sichttest durch den Nutzer (kein Headless-Browser hier) — DOM/IndexedDB-Pfad der Liquiditäts-Karte
  (jetzt inkl. Treiber-Liste) bestätigen.
- Sonst: umgebungs-/menschen-blockierte Block-3-Punkte (Server-/Offsite-Backup-Ziel; WorkFloh-Gegenstücke) oder eine neue,
  mit dem Nutzer abgestimmte Idee. Bekannt blockiert: Lighthouse/Perf, lokales OCR, ZUGFeRD-Erzeugen, Sage 5b–d.

**Offene Grenzen / ungetestet**
- Reine Logik node-getestet; DOM/IndexedDB/Karten-Pfad **statisch geprüft** (kein Headless-Browser).
- Inhaltlich: reine Anzeige/Auswahl der größten Posten, keine Finanzberatung; nur über die bald fälligen, bekannten Posten.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditäts-Reichweite („Runway" — bis wann reicht das Geld?) [Branch `claude/bookledgerpro-block-3-cv4llc`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut bis zur **Mindestreserve** (#154). Die Liquiditäts-Karte zeigt schon
  Bestand/Eingänge/Ausgänge/Netto/Projektion, **Tiefpunkt** (tiefster Stand) und **Deckungslücke** (fehlender Betrag am
  Tiefpunkt). **Befund:** Es fehlte die intuitivste Antwort auf die im Karten-Code selbst gestellte Frage „reicht das
  Geld?" — nämlich **bis wann**. Der Tiefpunkt nennt den *tiefsten* Tag, die Reichweite den *frühesten* Engpass; rutscht
  der Saldo früh unter die Schwelle, erholt sich kurz und fällt später noch tiefer, ist die Reichweite schon früher
  erschöpft. Sauberer, build-freier Folgeschritt im Liquiditäts-Thema.

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +12 → **1675/1675**): **`liquiditaetsReichweite(verlauf, {reserveCent, heute})`**
  — der ERSTE Tag im Fenster, an dem der laufende Saldo (`liquiditaetsVerlauf.punkte[].saldoCent`) unter die Schwelle
  (Mindestreserve, Default 0 → echtes Minus; konsistent via `normalizeReserveCent`) fällt. Liefert
  `{bekannt, reicht, sofort, datum, tageBis, reserveCent, negativ}`: ohne Geldbestand `bekannt:false` (abwärtskompatibel),
  schon heute unter Schwelle `sofort:true`, hält das ganze Fenster `reicht:true`, `negativ` = echtes Minus vs. nur
  Reserve-Unterschreitung; `tageBis` nur mit `heute`.
- **`src/ui/views/dashboard.js`**: Klartext-Bilanz in der Liquiditäts-Karte — „reicht über N Tage" bzw. „reicht bis
  {datum}" (rot bei echtem Minus). Nur wenn es im Fenster **Ausgänge** gibt (sonst kann das Geld nicht knapp werden) und
  der Bestand bekannt ist; der „heute schon knapp"-Fall (`sofort`) bleibt der Ampel/Deckungslücke überlassen. **Bucht nichts.**
- i18n de+en (`dashboard.liquidityRunwayOk`/`…RunwayUntil`), **SW `v134`** (kein neues Modul).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1675/1675 grün** (`node tests/run.mjs`). SW `v134`,
  117 JS-Module. PR offen (Draft → ready → CI → Squash-Merge).

**Offen / Nächstes**
- Optional: Browser-Sichttest durch den Nutzer (kein Headless-Browser hier) — DOM/IndexedDB-Pfad der Liquiditäts-Karte
  (jetzt inkl. Reichweite-Bilanz) bestätigen.
- Sonst: umgebungs-/menschen-blockierte Block-3-Punkte (Server-/Offsite-Backup-Ziel; WorkFloh-Gegenstücke) oder eine neue,
  mit dem Nutzer abgestimmte Idee. Bekannt blockiert: Lighthouse/Perf, lokales OCR, ZUGFeRD-Erzeugen, Sage 5b–d.

**Offene Grenzen / ungetestet**
- Reine Logik node-getestet; DOM/IndexedDB/Karten-Pfad **statisch geprüft** (kein Headless-Browser).
- Inhaltlich: einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; Reichweite gilt nur über die bald fälligen,
  bekannten Posten (kein Forecast wiederkehrender Kosten).

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditäts-Mindestreserve (Puffer) in der Deckungslücke [Branch `claude/block3-liquidity-reserve`, PR #154]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut bis zur **Deckungslücke** (#153). **Befund:** Die Deckungslücke warnte
  bisher erst, wenn der laufende Saldo im Fenster ECHT unter null rutscht. Viele Betriebe wollen ihr Geld aber nicht bis
  auf null herunterfahren, sondern einen **Sicherheitspuffer (Mindestreserve)** halten. Sauberer, build-freier
  Folgeschritt im Liquiditäts-Thema: eine konfigurierbare Mindestreserve als Schwelle der Deckungslücke.

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +17 → **1663/1663**): `normalizeReserveCent(value)` (klemmt einen
  persistierten Reservebetrag auf ganze, nicht-negative Cent; ungültig/negativ → 0) + `deckungsluecke(verlauf, {reserveCent})`
  mit optionaler **Mindestreserve als Schwelle** — Default 0 → identisch zu vorher (abwärtskompatibel, bestehende Tests
  unverändert grün); die Lücke greift, sobald der Tiefpunkt unter die Schwelle fällt (`lueckeCent` = Schwelle − Tiefpunkt),
  neue Felder `reserveCent` + `negativ` (Tiefpunkt < 0 = echte Illiquidität vs. nur Reserve-Unterschreitung).
- **`src/state.js`**: Setting `liquiditaetReserveCent` (Default 0, gerätelokal/verschlüsselt).
- **`src/ui/views/dashboard.js`**: Euro-Eingabefeld „Mindestreserve (Puffer)" in der Liquiditäts-Karte (persistiert + neu
  zeichnen); der Lücken-Hinweis warnt **rot** (`hint-error`) bei echtem Minus und **mild** (`muted small`) bei reiner
  Reserve-Unterschreitung (eigene i18n-Variante mit Reserve-Betrag). **Bucht nichts.**
- i18n de+en (`dashboard.liquidityReserveLabel`/`…ReservePlaceholder`/`…ReserveGapHint`), **SW `v133`** (kein neues Modul).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1663/1663 grün** (`node tests/run.mjs`). SW `v133`.
  PR #154 squash-gemergt (CI smoke-test grün).

**Offen / Nächstes**
- Optional: Browser-Sichttest durch den Nutzer (kein Headless-Browser hier) — DOM/IndexedDB-Pfad der Liquiditäts-Karte
  (Mindestreserve-Eingabe + adaptive Lücken-Hinweise) bestätigen.
- Sonst: umgebungs-/menschen-blockierte Block-3-Punkte (Server-/Offsite-Backup-Ziel; WorkFloh-Gegenstücke) oder eine neue,
  mit dem Nutzer abgestimmte Idee. Bekannt blockiert: Lighthouse/Perf, lokales OCR, ZUGFeRD-Erzeugen, Sage 5b–d.

**Offene Grenzen / ungetestet**
- Reine Logik node-getestet; DOM/IndexedDB/Eingabefeld-Pfad **statisch geprüft** (kein Headless-Browser).
- Inhaltlich: einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; die Reserve ist ein frei gewählter Puffer.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditäts-Deckungslücke (Unterdeckung im Fenster) [Branch `claude/bookledgerpro-block-3-14vdtm`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut bis zum **Tiefpunkt** (laufender Saldo im Fenster, #152). **Befund:**
  Der Tiefpunkt-Hinweis zeigt den tiefsten Stand auch dann, wenn er positiv bleibt (reine Info „wird es eng"). Wenn
  der laufende Saldo aber ZWISCHENDURCH tatsächlich ins Minus rutscht — und sich bis zum Fenster-Ende wieder erholt
  (große Verbindlichkeit früh, ausgleichende Forderung spät) — bleibt der Engpass von der End-Saldo-Ampel
  (`liquiditaetsAmpel`, projiziert<0) unentdeckt, und es fehlt der konkrete **Finanzierungs-Betrag**. Sauberer,
  build-freier Folgeschritt: die **Deckungslücke** (Unterdeckung + Stichdatum) explizit beziffern.

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +8 → **1646/1646**): **`deckungsluecke(verlauf)`** — nimmt
  das Ergebnis von `liquiditaetsVerlauf` und liefert `{unterdeckung, lueckeCent, datum}`. Greift NUR, wenn der
  Tiefpunkt unter null fällt: `lueckeCent` = −`tiefpunktCent` (wie viel bis dahin zusätzlich gebraucht wird), `datum`
  = `tiefpunktDatum`. Tiefpunkt ≥ 0 / ohne Geldbestand / leeres Argument → keine Unterdeckung (abwärtskompatibel).
- **`src/ui/views/dashboard.js`**: Die Liquiditäts-Karte zeigt bei echter Unterdeckung einen **warnfarbenen
  Hinweis** „Unterdeckung: Bis zum {datum} fehlen … {betrag}" — unabhängig davon, ob der End-Saldo wieder positiv ist.
  **Bucht nichts.**
- i18n de+en (`dashboard.liquidityGapHint`), CSS `.hint-error` (additiv, nur Textfarbe), **SW `v132`** (kein neues
  Modul — alle berührten Dateien bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1646/1646 grün** (`node tests/run.mjs`). SW `v132`.
  117 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`deckungsluecke`) ist node-getestet (+8).
- **Ehrliche Grenze:** weiterhin einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung von Skonto/
  Teilzahlungen/Steuern); Bündelung je Tag (kein Intraday); Engpass nur innerhalb des gewählten Fensters. Keine
  Finanzberatung — nur Hinweis.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditäts-Tiefpunkt (laufender Saldo im Fenster) [Branch `claude/bookledgerpro-block-3-h56a44`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut (beide Überfälligkeits-KPIs + Liquiditätsvorschau mit Geldbestand +
  projiziertem Saldo #149 + wählbares Zeitfenster). **Befund:** Die Projektion (#149) prüft nur den Saldo am
  **Fenster-ENDE**. Der kann positiv sein, obwohl der laufende Saldo zwischendurch ins Minus rutscht (große
  Verbindlichkeit früh, ausgleichende Forderung spät). Das beantwortet „reicht das Geld?" unehrlich. Sauberer,
  build-freier Folgeschritt: einen **laufenden Saldo** über die Fälligkeiten rechnen und den **Tiefpunkt** (tiefster
  Stand + Datum) sichtbar machen.

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +17 → **1638/1638**): `liquiditaetsVerlauf({forderungen,
  verbindlichkeiten, heute, horizontTage, geldbestandCent})` — bündelt bald fällige Bewegungen je Fälligkeits-Tag,
  addiert sie chronologisch ab dem aktuellen Geldbestand auf und liefert `punkte[]` (Saldo nach jedem Bewegungs-Tag),
  `startCent`/`endeCent` sowie **`tiefpunktCent`/`tiefpunktDatum`** (Tiefpunkt startet beim heutigen Bestand). Ohne
  `geldbestandCent` bleiben die Saldo-Felder `null` (abwärtskompatibel).
- **`src/ui/views/dashboard.js`**: Die Liquiditäts-Karte zeigt zusätzlich einen **Tiefpunkt-Hinweis** — aber nur, wenn
  der laufende Saldo zwischendurch UNTER den End-Saldo fällt (sonst keine neue Information). **Bucht nichts.**
- i18n de+en (`dashboard.liquidityLow`/`liquidityLowHint`), **SW `v131`** (kein neues Modul — `liquiditaet.js` bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1638/1638 grün** (`node tests/run.mjs`). SW `v131`.
  117 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`liquiditaetsVerlauf`) ist node-getestet (+17).
- **Ehrliche Grenze:** weiterhin einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung von Skonto/
  Teilzahlungen/Steuern); Bündelung je Tag (kein Intraday); Tiefpunkt nur innerhalb des gewählten Fensters.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
  (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditätsvorschau — wählbares Zeitfenster [Branch `claude/bookledgerpro-block-3-oqyp8d`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut (beide Überfälligkeits-KPIs + Liquiditätsvorschau mit Geldbestand +
  Projektion #149). Befund: Die Liquiditäts-Karte rechnete fest mit **7 Tagen** — für die Frage „reicht das Geld?" ist mal
  „diese Woche", mal „dieses Quartal" relevant. Sauberer, build-freier Folgeschritt: das Zeitfenster wählbar machen
  (die reine Logik nahm `horizontTage` ohnehin schon entgegen). (Verbleibende explizite BAUPLAN-Punkte sind umgebungs-/
  menschen-blockiert.)

**Was getan**
- **`src/domain/liquiditaet.js`** (rein, node-getestet, +11 → **1621/1621**): `LIQUIDITAET_HORIZONT_OPTIONEN` (= [7,14,30,90])
  + `normalizeHorizont(value)` (klemmt persistierte/ungültige Werte auf eine kuratierte Option, Default 7).
- **`src/state.js`**: Setting `liquiditaetHorizontTage` (Default 7, gerätelokal/verschlüsselt im Tresor).
- **`src/ui/views/dashboard.js`**: `.segmented`-Umschalter (7/14/30/90 Tage) über den KPI-Kacheln der Liquiditäts-Karte →
  `updateSettings({liquiditaetHorizontTage})` + Dashboard-Neuzeichnung; `liquiditaetsVorschau` rechnet mit dem gewählten
  Horizont. **Bucht nichts.**
- i18n de+en (`dashboard.liquidityHorizonLabel`/`liquidityHorizonDays`), **SW `v130`** (kein neues Modul — `liquiditaet.js`
  bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut. **Tests 1621/1621 grün** (`node tests/run.mjs`). SW `v130`.
  117 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`normalizeHorizont`) ist node-getestet (+11).
- **Ehrliche Grenze:** weiterhin einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung); die Horizont-Optionen
  sind kuratiert (7/14/30/90), kein frei eingebbarer Wert.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
  (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Liquiditätsvorschau um Geldbestand + projizierten Saldo [Branch `claude/block-3-liquidity-preview-23iw49`, PR #149]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut, beide Überfälligkeits-KPIs + Liquiditätsvorschau (#147) auf dem Dashboard.
  Befund: Die Liquiditätsvorschau zeigte nur erwartete **Eingänge gegen Ausgänge** — sie beantwortete noch nicht die
  eigentliche Frage **„reicht das Geld?"**. Sauberer, build-freier, symmetrischer Folgeschritt: den aktuellen Geldbestand
  als Startwert heranziehen und projizieren. (Verbleibende explizite BAUPLAN-Punkte sind umgebungs-/menschen-blockiert.)

**Was getan**
- **`src/domain/liquiditaet.js`** (erweitert, rein, node-getestet, +25 → **1610/1610**): `GELDKONTO_BEREICHE` +
  `istGeldkonto(konto)` (nur AKTIV-Konten 1000–1099 Kasse / 1200–1299 Bank; Forderungen/Vorsteuer außen vor);
  `geldbestand(buchungen, konten, {stichtag})` (Saldo je Geldkonto Soll−Haben aus den **festgeschriebenen** Buchungen,
  Entwürfe zählen nicht, optional bis Stichtag); `liquiditaetsVorschau(opts.geldbestandCent)` ergänzt `geldbestandCent`
  + `projiziertCent` (Bestand + Netto; ohne Bestand bleiben beide `null` → **abwärtskompatibel**); `LIQUIDITAET_AMPEL`
  + `liquiditaetsAmpel` (kritisch bei projiziert < 0, Warnung wenn der Bestand allein die Ausgänge nicht deckt, sonst ok).
- **`src/ui/views/dashboard.js`**: die Liquiditäts-Karte zeigt zusätzlich „Kontostand (Kasse + Bank)" und „voraussichtlich
  in N Tagen" (ampelgefärbt) + einen ehrlichen Hinweis bei knapper/negativer Projektion; gefüttert aus den bereits
  geladenen `konten`/`buchungen` (kein zusätzlicher I/O). **Bucht nichts.**
- i18n de+en (`dashboard.liquidityBalance`/`liquidityProjected`/`liquidityWarnTight`/`liquidityWarnNegative`), **SW `v129`**
  (kein neues Modul).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Überfälligkeit beidseitig + Liquiditätsvorschau jetzt mit
  Geldbestand + Projektion).
- **Tests 1610/1610 grün** (`node tests/run.mjs`). SW `v129`. 117 JS-Module. PR #149 squash-gemergt (CI grün).

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`geldbestand`/`liquiditaetsVorschau`/
  `liquiditaetsAmpel`) ist node-getestet (+25).
- **Ehrliche Grenze:** einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung von Skonto/Teilzahlungen/
  Steuern); Geldkonto-Erkennung über die 4-stelligen SKR03-Nummernbereiche (SKR04/6-stellig nicht abgedeckt).
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Dashboard-KPI Liquiditätsvorschau (bald fällig) [Branch `claude/bookledgerpro-block-3-liquiditaet`, PR #147]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut, beide Überfälligkeits-KPIs auf dem Dashboard (Verbindlichkeiten #143 +
  Forderungen #145). Befund: Das Dashboard zeigte nur, was **bereits überfällig** ist — die vorausschauende Seite
  („was wird demnächst fällig, reicht die Liquidität?") fehlte. Sauberer, build-freier, symmetrischer Folgeschritt:
  dieselbe Posten-Basis vorwärts auswerten.

**Was getan**
- **`src/domain/liquiditaet.js`** (NEU, rein, node-getestet, +14 → **1585/1585**): `LIQUIDITAET_HORIZONT_DEFAULT` (7),
  `baldFaellig(angereichertePosten, {heute, horizontTage})` — Posten mit Fälligkeit im Fenster `[heute … heute+Horizont]`,
  die **noch nicht überfällig** sind (Fälligkeit < heute fällt heraus → keine Doppelzählung mit den Überfälligkeits-KPIs);
  liest `offenCent` (Verbindlichkeiten) **und** `betragCent` (Forderungen). `liquiditaetsVorschau({forderungen,
  verbindlichkeiten, …})` — eingehend/ausgehend/netto über denselben Horizont.
- **`src/ui/views/dashboard.js`**: Karte „Liquiditätsvorschau (bald fällig)" am Kopf — gefüttert aus denselben
  angereicherten Posten wie die Überfälligkeits-Karten (`forderungReport(...).angereichert` / `verzugReport(...).angereichert`).
  Nur im Firmen-/Vereins-Kontext sichtbar (Forderungen via `zeigeAnsicht 'orders'`, Verbindlichkeiten via `payables`; Privat
  blendet beide aus) UND wenn etwas bald fällig ist; **Netto** nur, wenn beide Seiten sichtbar. **Bucht nichts.**
- i18n de+en (`dashboard.liquidity*`), **SW `v128`** (`src/domain/liquiditaet.js` neu precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Überfälligkeit beidseitig + jetzt Liquiditätsvorschau).
- **Tests 1585/1585 grün** (`node tests/run.mjs`). SW `v128`. 117 JS-Module. PR #147 squash-gemergt (CI smoke-test grün).

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`baldFaellig`/`liquiditaetsVorschau`) ist node-getestet (+14).
- **Ehrliche Grenze:** einfache Planung nach **Fälligkeitsdatum**, keine Forecast-Modellierung (Skonto/Teilzahlungs-Wahrscheinlichkeit/Zinsen bewusst nicht); Standard-Zahlungsziele, wo kein posten-eigenes Ziel hinterlegt ist.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
  (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Dashboard-KPI überfällige Forderungen (Mahnwesen) [Branch `claude/block-3-dashboard-kpi-p2jpfc`, PR #145]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut (Eingangsrechnungs-Verzug #140 + Buchung Verzugskosten #141 +
  Verzugsrisiko-Übersicht #142 + Dashboard-KPI überfällige **Verbindlichkeiten** #143). Befund: Das Dashboard zeigte
  die **Schuldnerseite** (überfällige Verbindlichkeiten), aber die **Gläubigerseite** (überfällige Forderungen/
  Mahnwesen) fehlte — obwohl `docs/OFFENE_PUNKTE.md` (A1) genau diese Dashboard-Kennzahl als Intention dokumentiert und
  #143 selbst „spiegelt die für die Forderungsseite dokumentierte Dashboard-Intention" notiert. Sauberer, build-freier,
  symmetrischer Folgeschritt: dieselbe KPI-Idee für die Forderungsseite.

**Was getan**
- **`src/domain/mahnwesen.js`** (rein, node-getestet, +20 → **1571/1571**): `forderungUebersicht(angereichertePosten,
  opts)` → `{anzahl, ueberfaelligAnzahl, ueberfaelligCent, zinsRisikoCent, kritischAnzahl}` (Spiegel zu
  `eingangsverzug.verzugUebersicht`; kritisch ab 1. Mahnung/≥14 Tage; Zins-Potenzial = Σ §-288-Zinsen der überfälligen,
  b2b-Default konservativ true); `FORDERUNG_AMPEL` + `forderungAmpel(uebersicht)` (Spiegel zu `verzugAmpel`);
  `forderungReport(auftraege, opts)` (Ein-Aufruf-Einstieg `offenePosten` → `anreicherePosten` → `forderungUebersicht` —
  ganzer Pfad node-testbar; neuer Import `mahnwesen → zahlungsabgleich` ist zyklenfrei).
- **`src/ui/views/dashboard.js`**: Karte „Überfällige Forderungen (Mahnwesen)" am Kopf der Übersicht über
  `forderungReport`/`forderungAmpel` — KPI-Kacheln überfällige Anzahl/gesamt, überfällige Summe, **Verzugszins-Anspruch
  (§ 288)** (rot bei kritisch). Nur sichtbar bei aktivem Mahnwesen (`zeigeFeature(s, FEATURE.MAHNWESEN)`, in Privat
  ausgeblendet) UND wenn etwas überfällig ist; Klick → Berichte (Mahnwesen-Karte). **Bucht nichts.** Aufträge sind im
  Dashboard ohnehin schon geladen → keine zusätzliche Abfrage.
- i18n de+en (`dashboard.overdueReceivables*`), **SW `v127`** (keine neuen Module — alle bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Verzugs-KPI beidseitig — Verbindlichkeiten #143 + Forderungen #145 — auf dem Dashboard).
- **Tests 1571/1571 grün** (`node tests/run.mjs`). SW `v127`. 116 JS-Module. PR #145 squash-gemergt.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`forderungUebersicht`/`forderungAmpel`/`forderungReport`) ist node-getestet (+20).
- **Ehrliche Grenze:** Hilfs-Einordnung nach Tagen überfällig, **keine Rechtsberatung**; aggregiertes Zins-Potenzial mit konservativem B2B-Aufschlag (kein per-Kunde-B2B); Basiszinssatz (§ 247) aktuell halten.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Dashboard-KPI überfällige Verbindlichkeiten (eigene Zahlungsdisziplin) [Branch `claude/bookledgerpro-block-3-1z7x5i`, PR #143]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut (Eingangsrechnungs-Verzug #140 + Buchung Verzugskosten #141 +
  Verzugsrisiko-Übersicht in der Verbindlichkeiten-Ansicht #142). Befund: Die node-getestete KPI „eigene
  Zahlungsdisziplin" (`verzugReport`/`verzugUebersicht`) war nur sichtbar, wenn man die Verbindlichkeiten-Ansicht
  öffnet. Sauberer, build-freier Folgeschritt: dieselbe Logik **auf das Dashboard** bringen (spiegelt die in
  `docs/OFFENE_PUNKTE.md` dokumentierte Dashboard-Intention der Forderungsseite, jetzt für die Schuldnerseite).

**Was getan**
- **`src/domain/eingangsverzug.js`** `verzugAmpel(uebersicht)` (+ `VERZUG_AMPEL`, rein, node-getestet, +8 →
  **1551/1551**): Ampel-Stufe `ok|warnung|kritisch` aus der Verzugs-Übersicht für die KPI-Färbung — grün wenn nichts
  überfällig, rot („kritisch") sobald eine Verbindlichkeit ≥ 14 Tage überfällig ist, sonst gelb; defensiv (geklemmte/
  negative/inkonsistente Eingaben → `ok`).
- **`src/ui/views/dashboard.js`**: Karte **„Überfällige Verbindlichkeiten (eigene Zahlungsdisziplin)"** am Kopf der
  Übersicht über die node-getestete `verzugReport`/`verzugAmpel` — KPI-Kacheln überfällige Anzahl/gesamt, überfällige
  Summe, **Verzugszins-Risiko (§ 288)** (rot bei kritisch). Nur sichtbar im Firmen-/Vereins-Kontext
  (`zeigeAnsicht(s, 'payables')`, in Privat ausgeblendet) UND wenn etwas überfällig ist (sonst kein Lärm); Klick →
  Verbindlichkeiten-Ansicht. **Bucht nichts.** Eingangsrechnungen werden nur geladen, wenn die Ansicht im Kontext sichtbar ist.
- i18n de+en (`dashboard.overduePayables*`), **SW `v126`** (keine neuen Module — `dashboard.js`/`payables-store.js`/
  `eingangsverzug.js` bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Verzugs-KPI jetzt auch auf dem Dashboard).
- **Tests 1551/1551 grün** (`node tests/run.mjs`). SW `v126`. 116 JS-Module. PR #143 squash-gemergt.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`verzugAmpel`/`verzugReport`) ist node-getestet (+8).
- **Ehrliche Grenze:** Hilfs-Einordnung nach Tagen überfällig, **keine Rechtsberatung**; Basiszinssatz (§ 247) aktuell halten.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Verzugsrisiko-Übersicht in der Verbindlichkeiten-Ansicht [Branch `claude/bookledgerpro-block3-payables-0i5x2p`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 komplett; Block 3 ausgebaut (Eingangsrechnungs-Verzug #140 + Buchung gezahlter
  Verzugskosten #141). Befund: die in #140 angelegte, **node-getestete** KPI-Logik `verzugUebersicht`
  („eigene Zahlungsdisziplin": überfällige Anzahl/Summe + § 288-Zinsrisiko) war in **keiner UI** sichtbar.
  Sauberer, build-freier Folgeschritt: diese fertige Logik nutzbar machen.

**Was getan**
- **`src/domain/eingangsverzug.js`** `verzugReport(rechnungen, opts)` (rein, node-getestet, +7 → **1543/1543**):
  Ein-Aufruf-Einstieg von den **gespeicherten** Eingangsrechnungen zur KPI — `offeneVerbindlichkeiten`
  (`payables.js`) → `anreichereVerbindlichkeiten` → `verzugUebersicht`. Damit ist der ganze Pfad
  Roh-Rechnung → Kennzahl node-testbar; die UI ruft nur noch dies auf. (Import `eingangsverzug → payables`
  ist zyklenfrei: `payables` importiert nicht aus `eingangsverzug`.)
- **`src/ui/views/payables.js`**: neue Karte **„Verzugsrisiko (eigene Zahlungsdisziplin)"** am Kopf der
  Ansicht — KPI-Kacheln überfällige Posten (N/gesamt), überfällige Summe, **Verzugszins-Risiko (§ 288)**,
  davon kritisch (≥ 14 Tage). Nur sichtbar, wenn überhaupt etwas überfällig ist (sonst kein Lärm). **Bucht nichts.**
- i18n de+en (`pay.verzug.overview*`), **SW `v125`** (keine neuen Module — beide bereits precached).

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Verzugsrisiko-KPI jetzt sichtbar).
- **Tests 1543/1543 grün** (`node tests/run.mjs`). SW `v125`. 116 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`verzugReport`) ist node-getestet (+7).
- **Ehrliche Grenze:** Hilfs-Einordnung nach Tagen überfällig, **keine Rechtsberatung**; Basiszinssatz (§ 247) aktuell halten.
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Buchung gezahlter Verzugskosten (Zinsaufwand) [Branch `claude/block3-payables-default-interest-ou6j1d`]

**Ausgangslage / Auswahl**
- Empfohlener Folgeschritt zu „Eingangsrechnungs-Verzug (Gegenseite)" (#140): das **Buchen gezahlter
  Verzugskosten** aus Schuldnersicht — der Spiegel zu `mahnwesen.mahnbuchungEntwurf` (R1). Zahlt man eine
  **berechtigte** Lieferanten-Mahnung, entsteht uns Zins-/Gebühren-**AUFWAND** (statt des Ertrags auf der
  Forderungsseite).

**Was getan**
- **`src/domain/eingangsverzug.js`** (rein, node-getestet, +20 → **1536/1536**): `VERZUG_AUFWAND_KONTEN`
  (SKR03: Zinsaufwand **2100**, sonstiger betrieblicher Aufwand **4980** = Spiegel zu 2700, Bank **1200**,
  Verbindlichkeit **1600**) + `VERZUG_GEGENKONTO` (`bank`|`verbindlichkeit`); `verzugAufwandZeilen(opts)`
  (Soll 2100 Zinsen + Soll 4980 Gebühren AN Haben Bank/Verbindlichkeit; **ohne Vorsteuer** — nicht
  steuerbarer Schadensersatz, Abschn. 1.3 UStAE; ausgeglichen; nur Zinsen/nur Gebühren; Konto-Override);
  `verzugAufwandEntwurf(opts)` (vollständiger Buchungs-Entwurf mit Beschreibung/Begründung, `null` bei 0/0).
- **`src/ui/views/payables.js`**: in der Karte „Erhaltene Mahnung prüfen (§ 288 BGB)" neuer Abschnitt
  **„Verzugskosten buchen (Zinsaufwand)"** — Gegenkonto-Wahl (Bank sofort / Verbindlichkeit auf Ziel) +
  Knopf, der die eingegebenen **geforderten** Beträge als Buchungs-**ENTWURF** übernimmt
  (`ensureSeedKonten` + `saveEntwurf`); **Festschreiben bleibt manuell (GoBD)** — Hinweis aufs Journal.
- i18n de+en (`pay.verzug.book*`/`counterAccount`/`viaBank`/`viaLiability`), **SW `v124`** (keine neuen
  Module — alle editierten Dateien bereits precached). **+20 Tests → 1536/1536 grün.**

**Stand**
- Block 1 + Block 2 komplett; **Block 3** weiter ausgebaut (Eingangsrechnungs-Verzug **inkl. Buchung**).
- **Tests 1536/1536 grün** (`node tests/run.mjs`). SW `v124`. 116 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik ist node-getestet (+20).
- **Ehrliche Grenze:** bucht die **eingegebenen geforderten** Beträge (was man tatsächlich zahlt), keine
  automatische Deckelung auf das Berechtigte; USt-Einordnung als Schadensersatz (im Zweifel Steuerberater).
- **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
  Block-3-Punkte (Server-/Offsite-Backup-Ziel, WorkFloh-Gegenstücke) oder eine neue, abgestimmte Idee.

---

## 2026-06-18 — BAUPLAN Block 3: Eingangsrechnungs-Verzug (Gegenseite) — Mahnung prüfen (§ 288 BGB) [Branch `claude/bookledgerpro-bauplan-block-3-ogalj7`]

**Ausgangslage / Auswahl**
- Block 1 + Block 2 (inkl. aller UIs/Folgeschritte) komplett. Erster build-freier, unblockierter
  **Block-3**-Punkt: **Eingangsrechnungs-Verzug (Gegenseite) [SOLL]** — der Spiegel zum Mahnwesen, aber
  aus **Schuldnersicht** (wir bekommen eine Eingangsrechnung und zahlen ggf. zu spät).
- Befund: `payables.js` erkennt Überfälligkeit bereits (Fälligkeit/`ueberfaellig`/Tage). Der echte
  Mehrwert fehlte: (a) **gestaffelte Verzugsstufe** und (b) **Prüfung einer ERHALTENEN Mahnung** —
  sind die vom Lieferanten geforderten Verzugszinsen/Mahngebühren nach § 288 BGB überhaupt berechtigt,
  bevor man sie zahlt? Die §-288-Formel wird aus `mahnwesen.js` wiederverwendet (DRY, identisch zur
  Forderungsseite).

**Was getan**
- **`src/domain/eingangsverzug.js`** (NEU, rein, node-getestet): `verzugsstufe(tageUeber)` (0 im Ziel /
  1 überfällig / 2 deutlich / 3 stark, Schwellen 1/14/42, `kritisch`-Flag) + `verzugsstufeLabel`;
  `verzugsLage(posten, opts)` (Fälligkeit + Tage überfällig; angereicherte Felder haben Vorrang, sonst
  Datum+Zahlungsziel, Default 30); `berechtigteVerzugskosten(posten, opts)` (nach § 288 berechtigte
  Verzugszinsen via `verzugszinsenCent` + 40-€-Pauschale via `mahnpauschaleCent`, `b2b` Default true =
  unsere Firma ist kein Verbraucher); **`pruefeErhalteneMahnung(posten, opts)`** — vergleicht geforderte
  vs. berechtigte Zinsen/Gebühren → `bewertung` ∈ {`kein_verzug`, `ohne_angabe`, `plausibel`, `ueberhoeht`}
  mit Differenzen (Rundungs-Toleranz 5 Cent); `verzugUebersicht(angereichertePosten)` (Kennzahlen:
  überfällig-Anzahl/-Summe, Zinsrisiko = Σ § 288-Zinsen, kritisch-Anzahl).
- **`src/ui/views/payables.js`**: in der Verbindlichkeiten-Liste je überfälligem Posten ein **Verzugsstufen-
  Badge** (gelb/rot + Tage); neuer Knopf **„Mahnung prüfen"** an offenen Posten → Karte **„Erhaltene Mahnung
  prüfen (§ 288 BGB)"** mit Eingabe der geforderten Zinsen/Gebühren (€), **Live-Vergleich** gegen das
  Berechtigte + Bewertungs-Badge + ehrlicher § 286/§ 247-Disclaimer. Bucht nichts (reine Prüfung vor dem Zahlen).
- i18n de+en (`pay.stage.*`, `pay.verzug.*`), CSS (`.badge-error`/Badge-Abstand), **SW `v123`** + neues
  Modul precached. **+33 Tests → 1516/1516 grün.**

**Stand**
- Block 1 + Block 2 komplett; **Block 3 begonnen** — Eingangsrechnungs-Verzug (Mahnung-Prüfung) ergänzt.
- **Tests 1516/1516 grün** (`node tests/run.mjs`). SW `v123`. 116 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`eingangsverzug.js`) ist
  node-getestet (+33).
- **Ehrliche Grenze:** Hilfs-Einordnung nach Tagen überfällig, **keine Rechtsberatung** (§ 286 BGB: Verzug
  i. d. R. erst mit Mahnung oder 30 Tagen); Basiszinssatz (§ 247) muss aktuell gehalten werden. Die
  **Buchung** tatsächlich gezahlter Verzugszinsen/Mahngebühren (Zinsaufwand) ist bewusst ein separater
  Folgeschritt; bisher nur Prüfung/Anzeige.
- **Nächster Schritt (optional):** Buchung gezahlter Verzugskosten (Aufwand) als Folgeschritt; sonst
  weitere Block-3-Punkte (Server-Backup-Ziel/WorkFloh-Gegenstücke — beide umgebungs-/menschen-blockiert)
  oder Browser-Sichttest durch den Nutzer.

---

## 2026-06-18 — BAUPLAN Block 2 Folgeschritt: Zeit-Zuordnungs-UI je Kostenträger [Branch `claude/bookledgerpro-bauplan-block2-r7b23o`]

**Ausgangslage / Auswahl**
- Block 1 + Block-2-Kernkette (4–11) inkl. aller UIs komplett. Verbleibender optionaler Folgeschritt:
  echte **Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag** (bislang wurden Zeiten/Buchungen in der
  Nachkalkulation nur ANGEZEIGT). Reine Logik zuerst node-getestet, dann UI „statisch geprüft".
- **GoBD-Befund (entscheidend für den Schnitt):** `kostenstelle` ist Teil der festgeschriebenen
  Buchungs-**Hash-Kette** (`audit.hashedFields`). Festgeschriebene Buchungen/Belege lassen sich daher
  NICHT nachträglich umhängen. Saubere, GoBD-konforme Zuordnung ist nur bei **Zeiteinträgen** möglich
  (mutable CRM-Records, kein Hash). → Scope: **Zeit-Zuordnung** umgesetzt; für Buchungen/Belege ein
  ehrlicher Hinweis in der UI (Zuordnung passiert beim Buchen, danach GoBD-fix).

**Was getan**
- **`src/domain/nachkalkulation.js`** (rein, node-getestet): neuer Helfer **`aufgeloesteKostenstelle(zeit,
  auftragIndex)`** — EXPLIZITE Zuordnung (`zeit.kostenstelle`) gewinnt vor der Ableitung aus dem Auftrag
  (`auftragId → auftrag.kostenstelle`), Leer-String '' = bewusst „keiner" → null. `zeiteintraegeAusZeiten`
  nutzt ihn jetzt (rückwärtskompatibel: Zeiten ohne explizite Kostenstelle bleiben ihrem Auftrag zugeordnet).
- **`src/domain/crm-store.js`**: `saveZeit` persistiert das neue Feld `kostenstelle`; neue Funktion
  **`setZeitKostenstelle(id, kostenstelle)`** (lädt via encGet, setzt, encPut).
- **`src/domain/nachkalkulation-store.js`** (Glue): **`ladeZeitZuordnung()`** (Zeiten angereichert um
  `aufgeloesteKostenstelle`/`explizit` + Mitarbeiter-Index + distinkte Kostenträger aus den Angeboten) und
  **`zuordneZeit(zeitId, kostenstelle)`** (dünn auf `setZeitKostenstelle`).
- **`src/ui/views/nachkalkulation.js`**: neue Karte **„Zeiten zuordnen"** — Tabelle aller Zeiteinträge
  (Datum/Mitarbeiter/Dauer/Beschreibung) mit **Kostenträger-Select je Zeile** (Wert = aufgelöste
  Kostenstelle; „— keiner —" hebt auf), Herkunft-Tag „direkt zugeordnet" vs. „über Auftrag"; Änderung →
  `zuordneZeit` → reload. Beleg-Liste um den ehrlichen **GoBD-Hinweis** ergänzt.
- i18n de+en, **SW `v122`**. **+8 Tests → 1483/1483 grün.**

**Stand**
- Block 1 + Block-2-Kernkette (4–11) inkl. aller UIs komplett; **Zeit-Zuordnungs-UI ergänzt.**
- **Tests 1483/1483 grün** (`node tests/run.mjs`). SW `v122`. 115 JS-Module.

**Offen / Nächstes / Grenzen**
- **DOM/IndexedDB statisch geprüft** (kein Headless-Browser) — die reine Logik (`aufgeloesteKostenstelle`)
  + Join sind node-getestet.
- **Ehrliche Grenze:** Buchungs-/Beleg-→-Kostenträger-Zuordnung ist GoBD-fix (Kostenstelle beim Buchen
  gesetzt, danach hash-verriegelt) — daher nur Hinweis, kein Umhängen. MASCHINE-Zeit nicht je Eintrag
  trennbar (alle Zeiten = ARBEIT); `stundenlohnCent` als interner Kostensatz (kein AG-Gemeinkostenaufschlag).
- **Nächster Schritt (optional):** Schritt 4 der Datensicherung (Server-/Offsite-Ziel) — blockiert, solange
  kein eigener Server existiert. Sonst Browser-Sichttest durch den Nutzer.

---

## 2026-06-18 — BAUPLAN Block 2: Kalibrierte Vorwärtskalkulation im Angebots-Editor [Branch `claude/bookledgerpro-bauplan-blocks-jwodoj`]

**Ausgangslage / Auswahl**
- Block 1 + Block-2-Kernkette (4–11) inkl. aller UIs sind komplett. Aus den zwei optionalen Folgeschritten
  der **kleinere, klar abgegrenzte, an fertige reine Logik andockende**: die **kalibrierte Vorwärtskalkulation**
  im Angebots-Editor (`kalkuliereKalibriert` stand seit Schritt 10 node-getestet bereit, war aber im Editor
  noch nicht nutzbar). Reine Logik zuerst, dann UI „statisch geprüft".

**Was getan**
- **`src/domain/kalkulation.js`** (Kern): die Anwendungs-Primitiven **`kalibriereEingabe`**/**`kalkuliereKalibriert`**
  (Mengen-/Geld-Treiber je Kostenart skalieren) aus `kalibrierung.js` HIERHER verschoben — das ist eine reine
  Kern-Operation neben `kalkuliereVorwaerts`. **`src/domain/kalibrierung.js`** re-exportiert beide → öffentliche
  API + bestehende Tests unverändert grün.
- **`src/domain/produktschemata.js`**: neuer reiner **`kalkuliereSchemaKalibriert(schema, werte, zuschlaege,
  kalibrierung, faktoren)`** (Schema-Eingabe → `kalibriereEingabe` → Kern; ohne/Neutral-Faktoren identisch zu
  `kalkuliereSchema`).
- **`src/domain/angebote.js`**: `positionAusSchema` akzeptiert **`opts.faktoren`** → rechnet die interne
  Kalkulation kalibriert und merkt `kalkulation.kalibriert`/`faktoren`. Außendokument bleibt NEUTRAL
  (Whitelist, Prime Directive — im Test geprüft, dass „kalibriert/faktoren" nicht nach außen dringt).
- **`src/domain/nachkalkulation-store.js`**: `ladeKalibrierungFaktoren()` (Glue) reicht die konservativ
  gedeckelten `faktorWerte` (0,5–2,0) + die Stichprobengröße `anzahlVergleiche` an die UI durch.
- **`src/state.js`**: Setting `kalibrierungAnwenden` (Default false). **`src/ui/views/angebote.js`**: lädt die
  Faktoren beim Mount (Fehler → ohne Option, nie blockierend), Schalter „Erfahrungswerte anwenden (Kalibrierung
  aus N abgeschlossenen Aufträgen)" (nur sichtbar mit Historie), kalibrierte Positionen tragen ein
  „kalibriert"-Badge, Live-Deckungsbeitrag spiegelt die Kalibrierung automatisch. i18n de+en.
- **`sw.js`** `CACHE_VERSION` → **v121** (keine neue Datei; berührte Module bereits präcacht).

**Stand**
- `node tests/run.mjs` → **1475/1475 grün** (+9: `kalkuliereSchemaKalibriert` == manuell komponiert, Neutral-
  Faktor identisch, Material-Faktor wirkt nur aufs Material, `positionAusSchema(opts.faktoren)` markiert +
  rechnet kalibriert, Kalibrierung dringt nicht nach außen). `node --check` der berührten Module grün.

**Offen / Nächstes**
- **Optional (verbleibend):** echte **Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag** (heute werden vorhandene
  Zeiten/Buchungen nur angezeigt).
- **Ehrliche Grenzen:** lineare Korrektur (Faktoren skalieren Mengen-/Geld-Treiber, KEINE neue Formel; Sätze/
  Prozente/Zuschläge bleiben); Faktoren stammen aus der eigenen Historie und sind nur so gut wie diese (konservativ
  0,5–2,0 gedeckelt, ab 1 Vergleich wirksam); DOM/IndexedDB **statisch geprüft** (kein Headless-Browser) — die
  reine Logik ist node-getestet.

---

## 2026-06-18 — BAUPLAN Block 2: Standard-konto→Kostenart-Zuordnung (Nachkalkulation) [Branch `claude/bookledgerpro-bauplan-s9rjht`]

**Ausgangslage / Auswahl**
- Block 1 + Block-2-Kernkette (4–11) inkl. aller UIs sind komplett. Aus den drei optionalen Folgeschritten
  (`docs/BAUPLAN.md`/`docs/NAECHSTE_SITZUNG.md`) der **kleinste, voll node-testbare, build-freie**: die **feinere
  konto→Kostenart-Zuordnung** in der Nachkalkulation (heute zählten alle einem Kostenträger zugeordneten Aufwands-
  Buchungen pauschal als **Material** — ehrliche Grenze aus der Nachkalkulation-UI). Reine Logik zuerst node-getestet,
  Glue „statisch geprüft".

**Was getan**
- **`src/domain/nachkalkulation.js`** (reine Logik, node-getestet): neue Helfer
  **`kostenartFuerKonto(nummer)`** (SKR03-Kontenklasse → Kostenart: **3100–3199 Fremdleistungen → ZUKAUF**,
  **3000–3999 Wareneingang/RHB → MATERIAL**, **4100–4199 Personalaufwand → ARBEIT**; alles übrige → null) +
  **`standardKontoBlock(konten)`** (baut die `kontoBlock`-Map nur aus AUFWAND-Konten mit sicherer Zuordnung).
  Konten ohne sichere Zuordnung bleiben auf dem bisherigen Default MATERIAL; `opts.kontoBlock` (manuell)
  **gewinnt** weiterhin vor der Standard-Zuordnung. +22 Tests (**1466/1466**).
- **`src/domain/nachkalkulation-store.js`** (I/O-Glue): `ladeNachkalkulationKontext` baut `kontoBlock` via
  `standardKontoBlock(konten)` und reicht es in `kostentraegerAnalyse` durch → die UI klassifiziert Wareneingang/
  Fremdleistung/Lohn jetzt automatisch korrekt, ohne dass der Nutzer eine Map pflegen muss.
- **`sw.js`** `CACHE_VERSION` → **v120** (beide Module bereits präcacht, keine neue Datei).

**Stand**
- `node tests/run.mjs` → **1466/1466 grün** (+22). `node --check` der geänderten Module grün.

**Offen / Nächstes**
- **Optional (verbleibend):** echte **Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag** (heute werden vorhandene
  Zeiten/Buchungen nur angezeigt) + **kalibrierte Vorwärtskalkulation** (`kalkuliereKalibriert`, reine Logik steht)
  im Angebots-Editor.
- **Ehrliche Grenzen:** Heuristik nach Kontenklasse, **keine** betriebswirtschaftlich exakte Einzelkosten-Zuordnung;
  Class-4-Gemeinkosten (Miete/Versicherung/…) bleiben absichtlich unklassifiziert (→ Default Material, falls einem
  Kostenträger zugeordnet); MASCHINE wird NICHT aus Konten abgeleitet (kommt über die Zeiteinträge). Glue/IndexedDB
  **statisch geprüft** (kein Headless-Browser) — die reine Klassifikation ist node-getestet.

---

## 2026-06-18 — BAUPLAN Schritt 2d: Demo-Vorbefüllung für Test-Tresore [Branch `claude/bookledgerpro-block2-next-q7pfe4`]

**Ausgangslage / Auswahl**
- Nächster offener (optionaler) Schritt laut `docs/BAUPLAN.md`/`docs/NAECHSTE_SITZUNG.md`: die in 2c bewusst
  zurückgestellte **Demo-Vorbefüllung** (`domain/demodaten.js`) — ein neuer Test wahlweise **leer** oder
  **mit Demo-Daten**. Kleiner, in sich abgeschlossener Schritt; reine Logik zuerst node-getestet, Glue/UI
  ehrlich als „statisch geprüft" gekennzeichnet (kein Headless-Browser).

**Was getan**
- **`src/domain/demodaten.js`** (reine Logik, node-getestet): `demoEntwuerfe(mandant)` bringt die Demo-Buchungen
  in die chronologisch sortierte Entwurfs-Form `{datum, beschreibung, zeilen}` (immutabel; Zeilen sind Kopien) +
  `demoBefuellungsplan(groesse)` bündelt Konten/Anfangsbestände/Anlagen/Buchungs-Entwürfe. Test: jede Buchung
  `validateBuchung`-gültig + ausgeglichen, chronologisch, Eingabe unberührt. +10 Tests (**1444/1444**).
- **`src/domain/demodaten-store.js`** (neu, Store-Glue): `befuelleMitDemodaten(groesse)` schreibt in den **aktiven**
  (Sandbox-)Tresor über die bestehenden Stores + den **echten GoBD-Pfad**: `ensureAccountsSeeded` →
  `setAnfangsbestand` → `addAnlage` → je Buchung `saveEntwurf`+`festschreiben` (chronologisch → lückenlose seq +
  Hash-Kette wie im Echtbetrieb). Schreibt nur in die aktive DB (Sandbox-Infix; echte Mandanten unberührt).
- **`src/ui/lock.js`** `renderNeuerTest`: Radio-Wahl „Leer starten / Mit Demo-Daten" (Default leer) → reicht
  `demo:'klein'` ins Sandbox-Onboarding; nach `setupVault` (DEK aktiv) wird befüllt (Fehler → Test startet leer
  statt zu blockieren). **`src/ui/i18n.js`** (`test.inhalt`/`test.inhaltLeer`/`test.inhaltDemo`, de+en),
  **`assets/app.css`** (`.test-inhalt`/`.radio-row`), **`sw.js`** `CACHE_VERSION` → **v119** + Modul precached.

**Stand**
- `node tests/run.mjs` → **1444/1444 grün** (+10). `node --check` der geänderten Module grün.

**Offen / Nächstes**
- **Optional:** echte **Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag** + kalibrierte Vorwärtskalkulation
  (`kalkuliereKalibriert`) im Angebots-Editor; feinere konto→Kostenart-Zuordnung (heute Default Material).
- **Ehrliche Grenzen:** Demo-Vorbefüllung nur „klein" (deterministischer Demo-Mandant); Glue/DOM/IndexedDB
  **statisch geprüft** (kein Headless-Browser) — der Schreibpfad selbst (`saveEntwurf`/`festschreiben`) ist
  node-getestet, das Verdrahten im Browser-Onboarding nicht.

---

## 2026-06-18 — BAUPLAN Block 2: UI „Nachkalkulation/Kostenträger + Kalibrierung" [Branch `claude/bookledgerpro-bauplan-block2-csl88g`]

**Ausgangslage / Auswahl**
- Nächster offener (optionaler) Schritt laut `docs/BAUPLAN.md`/`docs/NAECHSTE_SITZUNG.md`: die **UI über der bereits
  fertigen, node-getesteten reinen Logik** `domain/nachkalkulation.js` (#130) + `domain/kalibrierung.js` (#131) —
  Soll/Ist je Kostenträger, Korrekturfaktoren, Angebots-Trefferquote. UI + I/O-Glue → DOM/IndexedDB ehrlich als
  **„statisch geprüft"** gekennzeichnet (kein Headless-Browser).

**Was getan**
- **`src/domain/nachkalkulation.js`** (reine Logik, node-getestet): neuer I/O-naher Helfer
  **`zeiteintraegeAusZeiten(zeiten, auftragIndex, mitarbeiterIndex)`** — bringt die gespeicherten Zeiteinträge
  (`{dauerMin, auftragId, mitarbeiterId}`) in die `istZeitkosten`-Form: Kostenträger (`kostenstelle`) aus dem
  Auftrag, Stundenkostensatz aus dem Mitarbeiter (`stundenlohnCent`); ohne auflösbaren Auftrag → null, ohne Satz → 0,
  alle Einträge als ARBEIT. +7 Tests (**1434/1434**).
- **`src/domain/nachkalkulation-store.js`** (neu, I/O-Glue): `ladeNachkalkulationKontext()` (Buchungen + Konten-Index
  + via Join aufbereitete Zeiteinträge) und **`nachkalkulationUebersicht()`** — je Kostenträger (Angebot mit
  Kostenstelle) `kostentraegerAnalyse`; daraus `korrekturFaktoren`/`faktorWerte` (konservativ auf 0,5–2,0 gedeckelt)
  + `trefferquote`/`trefferquoteJePreisniveau` über alle Angebote. Sendet NICHTS (Prime Directive; Digest ungenutzt).
- **`src/ui/views/nachkalkulation.js`** (neu, NAV „Nachkalkulation", in privat/verein ausgeblendet): Kostenträger-
  Auswahl → Soll/Ist-Tabelle je Kostenart (Abweichung € + %, rot/grün), Deckungsbeitrag Soll/Ist, zugeordnete
  Belege/Buchungen + erfasste Stunden; Kalibrierungs-Karte mit Korrekturfaktoren-Tabelle (Faktor/Median/Anzahl/
  verwendeter Multiplikator) + Trefferquote gesamt und je Preisniveau. Rein anzeigend — kein Druck/Export/KI.
- **`src/ui/shell.js`** (NAV-Eintrag + Route), **`src/domain/nutzungsmodus.js`** (Gating privat/verein wie `angebote`),
  **`src/ui/i18n.js`** (`nav.nachkalkulation` + `nachkalk.*`, de+en), **`assets/app.css`** (`.abw-hoch`/`.abw-tief`),
  **`sw.js`** `CACHE_VERSION` → **v118** + neue Module precached.

**Stand**
- `node tests/run.mjs` → **1434/1434 grün** (+7: `zeiteintraegeAusZeiten` + NAV-Gating für `nachkalkulation`).
  Syntax-Checks der neuen Module grün.

**Offen / Nächstes**
- **Optional, Folgeschritt:** echte **Zeiterfassung-/Beleg-Zuordnungs-UI** je Auftrag (heute werden vorhandene
  Zeiten/Buchungen nur angezeigt); kalibrierte Vorwärtskalkulation (`kalkuliereKalibriert`) im Angebots-Editor anbieten.
- **Optional: Demo-Vorbefüllung** (`domain/demodaten.js`) für neue Tests.
- **Ehrliche Grenzen:** kontoBlock-Default → alle Aufwands-Buchungen zählen als **Material** (feinere konto→Kostenart-
  Zuordnung später); `stundenlohnCent` als interner Kostensatz (kein AG-Gemeinkostenaufschlag); DOM/IndexedDB statisch geprüft.

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 8-UI: „Rechnung aus Angebot" (UI + Store-Glue) [Branch `claude/rechnung-aus-angebot-ui`]

**Ausgangslage / Auswahl**
- Laut `docs/BAUPLAN.md`/`docs/NAECHSTE_SITZUNG.md` ist der nächste Schritt die **UI über der bereits fertigen,
  node-getesteten reinen Logik** `domain/angebotUebernahme.js` (PR #129): ein Knopf „Rechnung aus Angebot" an einem
  angenommenen Angebot. Dieser Schritt ist **UI + Store-Glue (I/O)** → DOM/IndexedDB/kv-Zähler ehrlich als
  **„statisch geprüft"** gekennzeichnet (kein Headless-Browser). Keine neue reine Logik nötig.

**Was getan**
- **`src/domain/crm-store.js`**: den lückenlosen §14-Zähler refaktoriert — neues `naechsteRechnungSeq()` reserviert
  die nächste laufende Zahl (1-basiert), `naechsteRechnungsnummer()` baut darauf auf (Verhalten unverändert). So
  ziehen `rechnungAusAuftrag` **und** „Rechnung aus Angebot" (blp) aus **einem** §14-Kreis → lückenlos/kollisionsfrei.
  Neuer, **getrennter** Zähler `naechsteVorlaeufigeSeq()` (`vorlaeufigRechnungSeq`) für die vorläufigen
  Vorlagen-Nummern `ENT-JJJJ-NNNN` im extern-Modus (GoBD-neutral, tastet den §14-Kreis nicht an).
- **`src/domain/angebote-store.js`**: neue Store-Glue `rechnungAusAngebot(id)` — lädt das Angebot, validiert
  (`validateAngebotUebernahme`), wählt den Zähler je `rechnungsstelle` (`vergibtBlpNummern` → `naechsteRechnungSeq`
  bzw. `naechsteVorlaeufigeSeq`), baut den Entwurf über die reine Logik `angebotUebernahmeEntwurf` (Prime Directive:
  nur `externesAngebot`), speichert ihn als Buchungs-**Entwurf** (`store.saveEntwurf`) und setzt das Angebot
  **→ archiviert** (`angenommen → archiviert`). Festschreiben bleibt **manuell** (GoBD).
- **`src/ui/views/angebote.js`**: Knopf **„Rechnung aus Angebot"** in den Zeilen-Aktionen, nur sichtbar wenn
  `darfAngebotUebernehmen(a)` (angenommen + gültige AN-Nummer + Positionen). Confirm-Dialog → `rechnungAusAngebot` →
  Banner mit der vergebenen Nummer + Hinweis „im Journal prüfen und festschreiben" (eigener Text für die vorläufige
  `ENT-…`-Vorlage im extern-Modus). i18n de+en (`angebote.toInvoice`/`confirmInvoice`/`invoiceDone`/
  `invoiceDoneVorlaeufig`).
- **`sw.js`**: `CACHE_VERSION` → `v117` (alle Module waren bereits precached).

**Stand**
- `node tests/run.mjs` → **1427/1427 grün** (reine Logik war #129; dieser Schritt ist UI/Glue, keine neuen Tests).
  Import-Smoke (`angebote-store.js`) ohne Zyklus geladen. Syntax-Checks grün.

**Offen / Nächstes**
- **Optional (reine Logik steht): UI „Nachkalkulation/Kostenträger + Kalibrierung"** (Soll/Ist, Trefferquote —
  `nachkalkulation.js`/`kalibrierung.js`). **Optional: Demo-Vorbefüllung** (`domain/demodaten.js`).
- **Ehrliche Grenze:** DOM/IndexedDB/kv-Zähler nur statisch geprüft. Der echte Klickpfad (Angebot annehmen →
  „Rechnung aus Angebot" → Journal → Festschreiben) ist im Browser noch nicht vom Nutzer bestätigt.

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 11b: Adaptiver Baukasten — UI (Angebots-Ansicht + Store-Glue) [Branch `claude/baukasten-logic-step-11a-cbj8s8`]

**Ausgangslage / Auswahl**
- 11a (reine Logik, PR #132) gemergt; laut `docs/BAUPLAN.md` ist 11b die **UI über** `domain/baukasten.js` +
  `angebote.js` + `produktschemata.js`. Es existierte **keine Angebots-Ansicht und keine Store-Glue** für Angebote
  → beides in diesem Schritt gebaut. Die reine Logik darunter ist bereits node-getestet (1427/1427); 11b ist UI/Glue,
  daher **DOM/IndexedDB ehrlich als „statisch geprüft" gekennzeichnet** (kein Headless-Browser).

**Was getan**
- **`src/domain/angebote-store.js`** (NEU, verschlüsselte Store-Glue via `encstore`, analog `crm-store.js`):
  `saveAngebot` (normalisiert über `angebote.js`, vergibt beim ersten Speichern eine freie Angebotsnummer
  `AN-JJJJ-NNNN` via `vergebeAngebotsnummer`), `listAngebote`/`getAngebot`/`deleteAngebot`, `setzeAngebotStatusStore`
  (Status-Workflow `setzeAngebotStatus`, beim Verschicken ggf. Nummer nachziehen). **Positionen behalten ihre interne
  `kalkulation`** (`normalizeAngebotsposition` reicht sie durch) → der Live-Deckungsbeitrag überlebt Speichern/Laden.
- **`src/ui/views/angebote.js`** (NEU): Angebots-Ansicht mit **adaptivem Baukasten** —
  - **Karten je Leistungsart** sortiert via `baukastenPalette` + Schnellzeile `haeufigsteSchemata`; Karte tippen →
    **Schema-Felder** (aus `produktschemata.js`, Geld als €/Cent, sonst Dezimal) + Menge/USt ausfüllen →
    `positionAusSchema` → Position. **Beim Hinzufügen `zaehleNutzung`** → Nutzungsprofil **gerätelokal** in den
    (verschlüsselten) Settings (`state.js` `baukastenNutzungsprofil`), sodass häufig Genutztes nach oben rückt.
  - **Positionsliste mit Drag-and-drop** (`verschiebePosition`) **plus** Pfeil-Knöpfe ↑/↓
    (`verschiebeNachOben`/`-Unten`; DeX/Touch-tauglich, additiv — kein `cursor`-Trick).
  - **Live-Deckungsbeitrag** (`interneAuswertung`) neben den neutralen Summen, klar als **„intern — nicht im
    Angebot"** markiert (Prime Directive).
  - Status-Workflow (`ANGEBOT_STATUS_FLOW`), Archiv-Liste, **neutrales Angebotsdokument** (Druck) ausschließlich über
    `externesAngebot` (Whitelist) — Kalkulation/Marge leckt nie nach außen.
- **`src/ui/shell.js`**: NAV „Angebote" (zwischen Aufträge/Kunden) + Import + Route.
- **`src/domain/nutzungsmodus.js`**: `angebote` in `privat`/`verein` ausgeblendet (wie `orders`); NAV-Gating-Tests
  in `tests/run.mjs` entsprechend gestärkt.
- **`src/state.js`**: Default `baukastenNutzungsprofil: {}` (verschlüsselt im Tresor, gerätelokal).
- **`src/ui/i18n.js`**: `nav.angebote` + voller `angebote.*`-Strang **de + en** (Status-Namen vs. Aktions-Verben getrennt).
- **`assets/app.css`**: Stile für Palette/Karten/Schema-Form/Positionszeilen/Summen-Panel.
- **`sw.js`**: `CACHE_VERSION` `v115 → v116`; `angebote-store.js` + `views/angebote.js` precached.

**Stand**
- `node tests/run.mjs` → **1427/1427 grün** (reine Logik unverändert grün; Gating-Assertions für `angebote` ergänzt).
- SW `v116`. Prime Directive gewahrt: Kalkulation rein intern, Außendokument nur über `externesAngebot`-Whitelist.

**Offen / Grenzen (ehrlich)**
- **DOM/IndexedDB nicht headless E2E-getestet** (kein Headless-Browser) — Ansicht/Store statisch geprüft; die reine
  Logik darunter ist node-getestet. **Browser-Sichttest durch den Nutzer steht aus.**
- Globale Zuschläge (Gemeinkosten/Gewinn) wirken auf **neu hinzugefügte** Positionen; bestehende behalten ihre zum
  Hinzufüge-Zeitpunkt gespeicherte Kalkulation (bewusst — Snapshot; kein Massen-Neurechnen).

**Nächstes**
- **Block 2/Schritt 8-UI „Rechnung aus Angebot"** (reine Logik `angebotUebernahme.js` steht): Knopf am angenommenen
  Angebot → Buchungs-Entwurf über bestehenden Pfad, Nummernpolitik je `rechnungsstelle`, Angebot→archiviert.
- Optional: UI „Nachkalkulation/Kostenträger + Kalibrierung", Demo-Vorbefüllung (`domain/demodaten.js`).

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 11a: Adaptiver Baukasten — reine Sortier-/Zähl-Logik [PR #132, Branch `claude/block2-step11-position-builder-8vxryt`]

**Ausgangslage / Auswahl**
- Block 1 komplett; Block 2/Schritte 4–10 erledigt. Laut `docs/BAUPLAN.md` ist der nächste Schritt **Adaptiver
  Baukasten-UX** (`docs/KALKULATION_KATALOG.md` §3). Der Auftrag verlangt **„reine Sortier-/Zähl-Logik ZUERST
  node-getestet, dann UI"**. Da noch **keine Angebots-UI/-Ansicht** existiert (angebote.js ist rein, ohne UI/Store)
  und die Sitzungs-Regel „sauber & fehlerfrei, im Zweifel feiner schneiden" lautet, wurde Schritt 11 **sauber
  geteilt**: **11a = die reine Logik** (dieser PR), **11b = die UI darüber** (eigener Folge-PR, braucht zuvor eine
  Angebots-Ansicht + verschlüsselte Store-Glue).

**Was getan** (reine Logik node-getestet — **+33 → 1427/1427**)
- **`src/domain/baukasten.js`** (rein, node-getestet — kein DOM/IndexedDB):
  - **(1) Nutzungszähler je Leistungsart:** Profil `{ schemaId: {anzahl, zuletzt} }`. `leeresNutzungsprofil`,
    `normalizeNutzung` (säubert persistierte Profile: nur gültige String-IDs, nicht-negative Ganzzahlen, leere
    Einträge verworfen), `nutzungVon`/`anzahlVon`/`istGenutzt`, `zaehleNutzung(profil, schemaId, {jetzt, um})`
    (immutabel; Zeitstempel injizierbar für Determinismus; `um:` erhöht um >1).
  - **(2) Adaptive Palette:** `baukastenPalette(schemata, profil)` reichert je Schema `{anzahl, zuletzt, genutzt}`
    an und sortiert **häufig (anzahl↓) → zuletzt (zuletzt↓) → Katalog-Reihenfolge (Index↑, stabil)** — ungenutzte
    behalten ihre Reihenfolge unten. `sortiereSchemata` (nur die Schema-Objekte) + `haeufigsteSchemata(…, n)`
    (Schnellzugriffs-Zeile, **nur** genutzte, ≤ n).
  - **(3) Umsortieren (Drag-and-drop / Pfeile):** `verschiebePosition(positionen, von, nach)` — **immutabel** (neue
    Liste), klemmt das Ziel in [0, len-1], behält die Element-**Referenz** (keine Normalisierung → interne
    `kalkulation` unberührt), ungültiger `von` → flache Kopie; `verschiebeNachOben`/`verschiebeNachUnten`.
- **`tests/run.mjs`** — neuer Abschnitt „Adaptiver Baukasten" (Zähler immutabel/Mehrfach/Normalisierung; Sortierung
  häufig→zuletzt→Katalog inkl. Immutabilität; Palette-Anreicherung; Umsortieren inkl. Klemmen/Referenz/Grenzfälle).
- **`sw.js`** — `CACHE_VERSION` → **v115**, `./src/domain/baukasten.js` precached.

**Stand**
- `node tests/run.mjs` → **1427/1427 grün**. SW `v115`, **110 JS-Module**. Prime Directive gewahrt (Modul kennt nur
  Schema-IDs/Zähler/Reihenfolge — keine Marge, kein Außendokument).

**Offen / Nächstes**
- **Block 2/Schritt 11b — die UI** über `domain/baukasten.js` + `angebote.js` + `produktschemata.js`: Angebots-Ansicht
  mit Karten je Leistungsart (häufig genutzte oben, lokal persistiertes Nutzungsprofil), wachsende Positionsliste mit
  Drag-and-drop, Live-Deckungsbeitrag (`interneAuswertung`). **Braucht zuvor** eine Angebots-Ansicht + verschlüsselte
  Store-Glue (crm-store). DOM/IndexedDB werden dann „statisch geprüft" (kein Headless-Browser).
- Weiterhin optional offen: UI „Rechnung aus Angebot" (Schritt 8) bzw. „Nachkalkulation/Kostenträger + Kalibrierung"
  (Schritt 9/10); Demo-Vorbefüllung (`domain/demodaten.js`, 2c-Folgeschritt); Server-Backup-Ziel (blockiert).

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 10: Kalibrierung + Statistik/Vergleich (rein) [PR #131, Branch `claude/block2-step10-calibration-kzzatj`]

**Ausgangslage / Auswahl**
- Block 1 komplett; Block 2/Schritte 4–9 erledigt. Laut `docs/BAUPLAN.md` ist der nächste Schritt **Kalibrierung +
  Statistik/Vergleich** (`docs/KALKULATION_KATALOG.md` §5.1 USP „selbstlernende Kalkulation" + §5.3 Trefferquote je
  Preisniveau) — bewusst **reine Logik, ohne UI/Store** (eigener Folgeschritt). Baut direkt auf Schritt 9
  (`domain/nachkalkulation.js`) auf.

**Was getan** (reine Logik node-getestet — **+39 → 1394/1394**)
- **`src/domain/kalibrierung.js`** (rein, node-getestet):
  - **(1) Korrekturfaktoren je Kostenart** aus der eigenen Historie (Vor→Nachkalkulation):
    **`korrekturFaktoren(vergleiche)`** aggregiert die Soll/Ist-Vergleiche vieler Aufträge (Form `nachkalkulation().perBlock`)
    je Kostenart zu `faktor` (= ΣIST/ΣSOLL, geldgewichtet — große Aufträge zählen stärker), `medianFaktor` (Median der
    Einzel-Job-Faktoren, robust gegen Ausreißer), `abweichungProzent` und `anzahl` (verwertbare Stichprobe).
    **`faktorWerte(faktoren, opts)`** verdichtet konservativ zu reinen Multiplikatoren: `opts.minAnzahl` (zu wenig
    Historie → Faktor 1), `opts.min`/`opts.max` (Ausreißer deckeln), `opts.quelle` gewichtet|median; null/≤0 → 1 (neutral).
  - **Rückfluss in den Kern:** **`kalibriereEingabe(eingabe, faktoren)`** skaliert je Kostenart den Mengen-/Geld-Treiber
    (`betragCent`/`preisProM2Cent`/`ekCent`/`stunden`; Sätze/Prozente bleiben), **`kalkuliereKalibriert`** ruft danach
    `kalkuliereVorwaerts` — **keine neue Formel** (analog `produktschemata.js` „füttert nur den Kern").
  - **(2) Angebots-Trefferquote je Preisniveau:** **`angebotErgebnis`** (gewonnen/verloren/offen aus Status; `angenommen`
    → gewonnen, `abgelehnt` → verloren, sonst offen; `archiviert` bewusst mehrdeutig → offen, per `opts` überschreibbar),
    **`angebotMargeProzent`** (DB/Netto aus `interneAuswertung`), **`preisniveau`** (niedrig/mittel/hoch, Grenzen [15,30]
    konfigurierbar), **`trefferquote`** (gewonnen/verloren/offen + Quote) und **`trefferquoteJePreisniveau`**.
  - **(3)** **`kalibrierungsDigest(vergleiche, angebote, opts)`** = **PII-FREIE** Aggregat-Zusammenfassung (nur
    Kostenart-Faktoren + Margen-Kübel-Zähler) als möglicher Payload-Kandidat für eine **spätere, STRIKT opt-in + BYOK**
    pseudonyme KI-Analyse (Mistral EU, CLAUDE.md §8) — diese Schicht **SENDET NICHTS**.
- **`tests/run.mjs`** — drei neue Abschnitte (Korrekturfaktoren; Rückführung in den Kern inkl. m²/Zukauf/Montage +
  „mutiert Original nicht" + „leere Faktoren = identisch zum Kern"; Trefferquote je Preisniveau + PII-freier Digest).
- **`sw.js`** — `CACHE_VERSION` → **v114**, `./src/domain/kalibrierung.js` precached.

**Stand**
- `node tests/run.mjs` → **1394/1394 grün**. SW `v114`, **109 JS-Module**. Prime Directive gewahrt (alles rein intern;
  Digest PII-frei, sendet nichts).

**Offen / Nächstes**
- **Block 2/Schritt 11 — Adaptiver Baukasten-UX** (`docs/KALKULATION_KATALOG.md` §3): Positions-Baukasten mit
  Nutzungssortierung („häufig oben") + Drag-and-drop; erste **UI** über `domain/angebote.js`.
- **Ehrliche Grenzen:** reine Logik, **kein UI/Store** in diesem Schritt; Vergleiche/Angebote werden hereingereicht (die
  Persistenz `crm-store`/verschlüsselt ist die I/O-Schicht darüber). **Kein Headless-Browser** → keine DOM/IndexedDB-
  Prüfung nötig (es gibt keine UI in diesem PR). Die KI-Analyse ist **bewusst NICHT** verdrahtet (eigener opt-in/BYOK-
  Schritt mit Bestätigung) — `kalibrierungsDigest` liefert nur den fertigen, PII-freien Payload-Kandidaten.

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 9: Auftrags-Kostenträger + Nachkalkulation (rein) [PR #130, Branch `claude/block2-step9-cost-tracking-6aeqtl`]

**Ausgangslage / Auswahl**
- Block 1 komplett; Block 2/Schritte 4–8 erledigt. Laut `docs/BAUPLAN.md` ist der nächste Schritt **Auftrags-Kostenträger
  + Nachkalkulation** (`docs/KALKULATION_KATALOG.md` §5.1 USP „selbstlernende Kalkulation" + §6 Kostenträger) — bewusst
  **reine Logik, ohne UI/Store** (eigener Folgeschritt).
- Kern-USP: Vor- gegen Nachkalkulation je fertigem Auftrag → später Korrekturfaktoren aus der eigenen Historie (Schritt 10).

**Was getan** (reine Logik node-getestet — **+29 → 1355/1355**)
- **`src/domain/nachkalkulation.js`** (rein, node-getestet) — ein **Kostenträger** = Auftrag/Projekt über seine `kostenstelle`:
  - **`istkostenAusBuchungen(buchungen, kontoIndex, kostenstelle, opts)`** — IST-Material/Fremdleistung aus den
    Aufwands-Zeilen FESTGESCHRIEBENER Buchungen je `kostenstelle` (Soll mehrt Aufwand, wie `costcenters.js`); `perKonto`/
    `perBlock` (konto→Kostenart über `opts.kontoBlock`, Default Material); je beteiligte Buchung ein Beleg-Eintrag mit
    `belegRef`/`buchungId` (Beleg↔Buchung aus `store.js`).
  - **`istZeitkosten(zeiteintraege, opts)`** — IST-Zeit aus dem `employees.js`-Datenmodell (`{dauerMin}`) × internem
    Stundenkostensatz (eigener `kostensatzCentProStd` je Eintrag, sonst Default), Arbeit/Maschine getrennt.
  - **`istkosten({…})`** — Belege + Zeit über alle Kostenarten zusammengeführt.
  - **`sollkostenAusAngebot(angebot)`** — SOLL aus der Vorkalkulation: interne `kalkulation` je Position × Menge nach
    Kostenart (Σ Blöcke = Selbstkosten; Netto/DB konsistent mit `angebote.interneAuswertung`).
  - **`nachkalkulation(soll, ist, {nettoCent?})`** — Soll/Ist je Kostenart + gesamt: Abweichung (IST − SOLL) + Prozent
    (auf |SOLL|, bei SOLL=0 → null); Deckungsbeitrag SOLL (kalkuliert) gegen IST (Erlös − Ist-Kosten). `kostentraegerAnalyse`
    als Komfort-Einstieg (Soll+Ist+Vergleich in einem Aufruf, Kostenträger aus `angebot.kostenstelle`).
- **`sw.js`:** `CACHE_VERSION` → **v113**, Modul `./src/domain/nachkalkulation.js` precached.
- **`tests/run.mjs`:** +29 Prüfungen (Soll-Aggregation + Identität zu `interneAuswertung`; IST-Buchungen ignoriert
  Entwürfe/fremde Kostenträger, `belegRef` mitgeführt; IST-Zeit Default-/Eigensatz; IST gesamt; Vergleich je Kostenart +
  Summen + Prozent + DB; Ist-Netto-Override; `kostentraegerAnalyse` deckungsgleich).

**Stand**
- `node tests/run.mjs` → **1355/1355 grün**. PR #130 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 9 abgehakt, PULS „START HIER" + Kopf-Status + Footer auf Schritt 10,
  OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 10 — Kalibrierung + Statistik/Vergleich**: Korrekturfaktoren aus der eigenen Historie
  (Vor→Nachkalkulation), Angebots-Trefferquote; optional KI-Analyse (Mistral EU, opt-in, pseudonym). Danach Schritt 11
  (adaptiver Baukasten-UX).
- **Grenze (ehrlich):** reine Logik, **kein UI/Store** in diesem Schritt; kein Headless-Browser. Buchungen/Konten-Index/
  Zeiteinträge werden hereingereicht (I/O = `crm-store`, verschlüsselt, Folgeschritt). Die konto→Kostenart-Zuordnung
  (`kontoBlock`) ist betriebsabhängig → Default „Material", überschreibbar. **Folgeschritt offen:** UI „Nachkalkulation/
  Kostenträger" + Store-Glue (Zeiterfassung je Auftrag, Beleg-/Buchungs-Zuordnung); UI „Rechnung aus Angebot" (Schritt 8).

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 8: Angebot → Rechnung-Übernahme (rein) [PR #129, Branch `claude/quote-to-invoice-transfer-4gvaof`]

**Ausgangslage / Auswahl**
- Block 1 komplett; Block 2/Schritte 4–7 erledigt. Laut `docs/BAUPLAN.md` ist der nächste Schritt die **Angebot →
  Rechnung-Übernahme** (`docs/KALKULATION_KATALOG.md` §4/§7a) — bewusst **reine Logik, ohne UI** (eigener Folgeschritt).
- **Zwei getrennte Kreise (GoBD):** der freie Angebotskreis (`AN-JJJJ-NNNN`) und der strikte §14-Kreis bleiben getrennt;
  die Übernahme **referenziert** die Angebotsnummer, benutzt sie aber nie wieder.

**Was getan** (reine Logik node-getestet — **+28 → 1326/1326**)
- **`src/domain/angebotUebernahme.js`** (rein, node-getestet):
  - **`validateAngebotUebernahme`/`darfAngebotUebernehmen`** — übernehmbar nur bei Status `angenommen`, gültiger
    Angebotsnummer (Referenz) und mindestens einer Position (nicht-werfend, UI zeigt Gründe als Hinweis).
  - **`uebernahmeNummer({settings, seq, jahr})`** — Nummern-Politik je Setting `rechnungsstelle` (Schritt 4):
    `blp` → echte §14-Nummer (`formatRechnungsnummer`, `vorlaeufig=false`, Kreis `paragraph14`); `extern` → vorläufige
    Vorlage `ENT-JJJJ-NNNN` (`vorlaeufigeRechnungsnummer`, `vorlaeufig=true`, Kreis `vorlaeufig`). Default = `blp`.
  - **`angebotUebernahmeEntwurf`** — baut den Buchungs-/Rechnungs-Entwurf **ausschließlich** aus `externesAngebot`
    (Prime Directive, Whitelist) → Buchungszeilen über `invoicing.rechnungZeilen` (Soll Forderung / Haben Erlöse+USt),
    derselbe Kern wie `rechnungAusAuftrag`; `angebotsnummer` wird referenziert, nicht wiederverwendet; Klartext-
    Beschriftung „Rechnung …" (blp) vs. „Vorlage … (vorläufig)" (extern); Jahr aus `datum` ableitbar; kundeId/
    kostenstelle übernommen.
- **`sw.js`:** `CACHE_VERSION` → **v112**, Modul `./src/domain/angebotUebernahme.js` precached.
- **`tests/run.mjs`:** +28 Prüfungen (Übernehmbarkeit, Nummern-Politik blp/extern/Default, Entwurf-Aufbau,
  Referenz ≠ Wiederverwendung, Zeilen identisch zum direkten Kern, **Prime Directive: kein `kalkulation`/Marge/
  Selbstkosten im Entwurf-JSON**).

**Stand**
- `node tests/run.mjs` → **1326/1326 grün**. PR #129 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 8 abgehakt, PULS „START HIER" + Kopf-Status + Footer auf Schritt 9,
  OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 9 — Auftrags-Kostenträger + Nachkalkulation**: Material/Belege/Zeit je Auftrag sammeln
  (`payables`/`costcenters`/Belege/`belegRef`) → Soll/Ist-Vergleich. Danach 10 (Kalibrierung/Statistik) + 11 (Baukasten-UX).
- **Grenze (ehrlich):** reine Logik, **kein UI** in diesem Schritt; kein Headless-Browser. Die laufende Nummer (`seq`)
  kommt später aus einem Zähler je Kreis (I/O, `crm-store`) — diese Schicht bekommt `seq`/`jahr` hereingereicht.
  **Folgeschritt offen:** UI „Rechnung aus Angebot" + Store-Glue (Zähler je Kreis, `saveEntwurf`, Angebot→archiviert).

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 7: Angebote-Kern in BLP (rein, zwei Schichten) [PR #128, Branch `claude/block2-step7-quotation-8wfjxz`]

**Ausgangslage / Auswahl**
- Block 1 komplett; Block 2/Schritte 4 (`rechnungsstelle`) + 5 (Kalkulations-Kern) + 6 (Produkt-Schemata) erledigt. Laut
  `docs/BAUPLAN.md` ist der nächste Schritt der **Angebote-Kern** (`docs/KALKULATION_KATALOG.md` §3/§4/§5) — bewusst
  **ohne UI** in diesem Schritt (eigener Folgeschritt).
- **Prime Directive** (Katalog §0): Kalkulation rein intern, Angebot/Rechnung neutral nach außen — das Datenmodell speichert
  **beide** Schichten, druckt/exportiert aber **nur** die externe.

**Was getan** (reine Logik node-getestet — **+60 → 1298/1298**)
- **`src/domain/angebote.js`** (rein, node-getestet):
  - **Datenmodell zwei Schichten:** Position trägt externe Felder (`beschreibung`/`menge`/`einzelpreisCent`/`ustSatz`) +
    optional interne `kalkulation`. **`externesAngebot`/`externePosition`** bauen das Außendokument per **WHITELIST** →
    selbst neu hinzugefügte interne Felder können nie lecken (Test prüft: keine `kalkulation`/`marge`/`verschnitt`/
    `maschinensatz`/`selbstkosten`/`deckungsbeitrag` im JSON).
  - **Status-Lebenslauf** `ANGEBOT_STATUS` (entwurf/offen/angenommen/abgelehnt/archiviert) + `ANGEBOT_STATUS_FLOW`/
    `darfAngebotWechseln`/`setzeAngebotStatus` (neues Objekt, GoBD-neutral)/`archiviereAngebot` + Filter
    `aktiveAngebote`/`archivierteAngebote`/`angeboteNachStatus`.
  - **Freier Angebotsnummernkreis** `AN-JJJJ-NNNN` (klar getrennt vom strikten §14-Kreis): `formatAngebotsnummer`/
    `parseAngebotsnummer`/`istAngebotsnummer`/`naechsteAngebotsSeq` (pro Jahr fortlaufend, fremde Jahre/ungültige
    ignoriert)/`vergebeAngebotsnummer` (lässt bereits vergebene unverändert).
  - **Positions-Aggregation** `angebotSummen` = `orders.auftragSummen` (ein gemeinsamer cent-genauer Kern, keine zweite
    Rundungslogik); `externePosition` liefert Whitelist + Zeilen-Netto.
  - **Schema-Kopplung** `positionAusSchema` (verbindet Produkt-Schemata Schritt 6 + Kern Schritt 5): interne Kalkulation
    gespeichert, nach außen dringt **nur der Netto-Stückpreis**; `ustSatz` = `zuschlaege.ustProzent` (eine Quelle).
  - **`interneAuswertung`** (Selbstkosten/Netto/Deckungsbeitrag aggregiert × Menge — Live-Deckungsbeitrag, rein intern;
    Test: `interneAuswertung.netto === externesAngebot.netto`). `neuesAngebot`/`normalizeAngebotsposition`/`validateAngebot`
    (Entwurf ohne Nummer gültig; Nummer nur geprüft, wenn vorhanden).
- **`sw.js`:** `CACHE_VERSION` → **v111**, Modul `./src/domain/angebote.js` precached.
- **`tests/run.mjs`:** +60 Prüfungen über 6 Abschnitte (Status/Übergänge, Filter, Nummernkreis, Aggregation, Prime
  Directive, interne Auswertung, Factory/Validierung).

**Stand**
- `node tests/run.mjs` → **1298/1298 grün**. PR #128 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 7 abgehakt, PULS „START HIER" + Kopf-Status + Footer auf Schritt 8,
  OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 8 — Angebot → Rechnung-Übernahme**: angenommenes Angebot → bestehender Rechnungs-/Buchungspfad
  (`invoicing.js`/`rechnung.js`); je nach `rechnungsstelle` echte §14-Nummer (blp) oder vorläufige Vorlage `ENT-…`
  (extern); **referenziert** die Angebotsnummer, benutzt sie nicht wieder.
- **Grenze (ehrlich):** reine Logik, **kein UI** in diesem Schritt; kein Headless-Browser. Persistenz (verschlüsselt,
  crm-store) + adaptiver Baukasten (Katalog §3, Schritt 11) kommen später. `positionAusSchema` rechnet pro Stück
  (Menge default 1); die internen Startsätze bleiben neutrale Platzhalter zum Kalibrieren.

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 6: Produkt-Schemata (rein, füttert den Kern) [PR #127, Branch `claude/block2-produkt-schemata`]

**Ausgangslage / Auswahl**
- Block 1 komplett, Block 2/Schritt 4 (`rechnungsstelle`) + 5 (Kalkulations-Kern) erledigt. Laut `docs/BAUPLAN.md` ist der
  nächste Schritt die **Produkt-Schemata** — kalibrierbare Vorlagen je Leistungsart (`docs/KALKULATION_KATALOG.md` §1/§2),
  die den vorhandenen Kern (`domain/kalkulation.js`) füttern. Bewusst **ohne UI** in diesem Schritt (eigener Folgeschritt).
- Prime Directive (Katalog §0): rein intern — die Schicht erzeugt **kein** Außendokument; das neutrale Angebot/die Rechnung
  kommen erst in Schritt 7/8.

**Was getan** (reine Logik node-getestet — **+23 → 1238/1238**)
- **`src/domain/produktschemata.js`** (rein, node-getestet): die 6 Vorlagen **Folierung (m²)/Schild/Gravur/Leuchtreklame/
  Druck-Zukauf/Montage**. Jedes Schema definiert nur **Felder** (`PRODUKT_ART`/`BASIS`/`FELD_TYP`-Enums) + ein **`mapping`**
  auf die Kostenarten des Kerns (`material`/`maschine`/`arbeit`/`zukauf`/`montage`). Es rechnet nicht selbst — `kalkuliereSchema`
  ruft `kalkuliereVorwaerts`. Umrechnungen im Mapping: m²-Felder → Material, Gravur-**Minuten** → Maschinen-**Stunden**.
  - `feldDefaults`/`kalibrierbareFelder`/`kalibrierteDefaults`/`werteMitDefaults`: die „Hotspot"-Felder aus Katalog §1
    (Verschnitt/Verklebezeit/Fräszeit/Elektrik/Montage …) sind `kalibrierbar` markiert + überschreibbar; **feste Felder
    bleiben unangetastet** → sauberer Andockpunkt für die selbstlernende Kalibrierung (Schritt 9/10).
  - `baueKostenarten`/`schemaEingabe`/`kalkuliereSchema`; `validateSchema`/`validateAlleSchemata` (eindeutige Keys, gültige
    Enums, mapping liefert nur bekannte Kostenarten).
- **`sw.js`:** `CACHE_VERSION` → **v110**, Modul `./src/domain/produktschemata.js` precached.
- **`tests/run.mjs`:** +23 Prüfungen — u. a. **`kalkuliereSchema == direkter Kern-Aufruf`** (die Schicht verändert das
  Ergebnis nicht), Folie 24200 SK / Gravur 8300 / Leuchtreklame 35000 cent-genau, Kalibrierung überschreibt nur Hotspots,
  leere Mengen → 0.

**Stand**
- `node tests/run.mjs` → **1238/1238 grün**. PR #127 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 6 abgehakt, PULS „START HIER" + Kopf-Status auf Schritt 7, OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 7 — Angebote-Kern in BLP**: Angebots-Dokument (Positionen/Preise/USt) **+ interne Kalkulationsschicht**
  (Prime Directive: intern bleibt intern), eigener Angebotsnummernkreis, Status (Entwurf/offen/angenommen/abgelehnt/archiviert),
  Archiv. Nutzt Kern (5) + Schemata (6) + `rechnungsstelle` (4).
- **Grenze (ehrlich):** reine Logik, **kein UI** in diesem Schritt; kein Headless-Browser. Die Startsätze (Folienpreis,
  Maschinensatz, Handelsaufschlag …) sind neutrale Platzhalter zum Kalibrieren — kein Versprechen für einen konkreten Betrieb.

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 5: Kalkulations-Kern (rein, cent-genau) [PR #126, Branch `claude/block-2-calculation-core-bu1qag`]

**Ausgangslage / Auswahl**
- Block 1 komplett, Block 2/Schritt 4 (`rechnungsstelle`) erledigt. Laut `docs/BAUPLAN.md` ist der nächste Schritt der
  **Kalkulations-Kern** — reine Rechenlogik (`docs/KALKULATION_KATALOG.md` §2/§9), bewusst **ohne UI-Zwang** in diesem Schritt.
- Prime Directive (Katalog §0/§8): Kalkulation ist **rein intern** — der Kern erzeugt **kein** Außendokument; das neutrale
  Angebot/die Rechnung (Schritte 6/7) zeigt nie die Systematik (Marge/Maschinensatz/Verschnitt …).

**Was getan** (reine Logik zuerst node-getestet — **+34 → 1215/1215**)
- **`src/domain/kalkulation.js`** (rein, node-getestet, cent-genau wie `money.js`):
  - Kostenarten `KOSTENART`/`KOSTENART_LISTE` (material/maschine/arbeit/zukauf/montage).
  - Bausteine: `materialkosten` (pauschal **oder** m²-Formel `flaecheM2 × preisProM2 × (1+Verschnitt%)`),
    `zeitkosten`/`maschinenkosten`/`arbeitskosten` (Stunden × Satz Cent/Std), `zukaufkosten` (EK × (1+Handelsaufschlag%)),
    `montagekosten` (pauschal); Hilfen `rundeCent` (kaufmännisch, zentrale Rundungsstelle) + `prozentFaktor`.
  - **Vorwärts** `kalkuliereVorwaerts(input)` → Selbstkosten → Zuschlag Gemeinkosten% → Gewinn% → Netto → USt% → Brutto,
    je Stufe auf ganze Cent gerundet; liefert vollständige Aufschlüsselung inkl. `gemeinkostenBetrag`/`gewinnBetrag`/
    `deckungsbeitrag`.
  - USt-Umrechnung `bruttoVonNetto`/`nettoVonBrutto`.
  - **Rückwärts** `maxSelbstkosten(zielNetto, marge)` + `kalkuliereRueckwaerts(input)` (Ziel-Netto **oder** -Brutto)
    → max. zulässige Selbstkosten, Restbudget nach fixen Kosten, daraus **erlaubte Arbeitsstunden** — konservativ
    abgerundet (`floor`), überschreitet das Ziel nie.
- **`sw.js`:** `CACHE_VERSION` → **v109**, Modul `./src/domain/kalkulation.js` precached.
- **`tests/run.mjs`:** +34 Prüfungen (Bausteine, kompletter Vorwärtslauf 392€ SK → 540,96€ Netto → 643,74€ Brutto,
  USt-Umrechnung, Rückwärts-Roundtrip inkl. Zielbrutto + negatives Budget).

**Stand**
- `node tests/run.mjs` → **1215/1215 grün**; `node --check` für `kalkulation.js`/`sw.js`/`run.mjs` ok. PR #126 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 5 abgehakt, PULS „START HIER" + Kopf-Status auf Schritt 6, OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 6 — Produkt-Schemata** (`docs/KALKULATION_KATALOG.md` §1/§2): Folierung (m²)/Schild/Gravur/
  Leuchtreklame/Druck-Zukauf/Montage … als kalibrierbare Vorlagen, die den Kalkulations-Kern füttern.
- **Grenze (ehrlich):** Der Kern rechnet nur mit den eingegebenen Sätzen (erfindet nichts) — Kalibrierung/
  Nachkalkulation (Korrekturfaktoren aus der Historie) ist Schritt 9/10. Reine Logik, **kein UI** in diesem Schritt
  (kommt mit den Schemata/Angeboten).

---

## 2026-06-18 — BAUPLAN Block 2/Schritt 4: Setting `rechnungsstelle` (§14-Nummernkreis-Hoheit) [PR #125, Branch `claude/block-2-kalkulation-angebote-6z8pht`]

**Ausgangslage / Auswahl**
- Block 1 (Vertrauen/Sicherheit) war komplett (Schritt 1 + 2a–2c + 3). Laut `docs/BAUPLAN.md` ist der nächste Schritt
  der **erste Block-2-Enabler**: das Onboarding-/Einstellungs-Setting **`rechnungsstelle`** (`docs/KALKULATION_KATALOG.md` §7a).
- Bewusst klein + in sich abgeschlossen geschnitten: nur Setting + reine Politik + UI-Verdrahtung. Die **Konsumtion**
  (echte §14- vs. vorläufige Nummernvergabe, Dokument-Beschriftung, Export) gehört zu Block 2/Schritt 7+8 (Angebote/Rechnung).

**Was getan** (reine Logik zuerst node-getestet — **+23 → 1181/1181**)
- **`src/domain/rechnungsstelle.js`** (rein, node-getestet): `RECHNUNGSSTELLE` (`blp`|`extern`), `RECHNUNGSSTELLE_DEFAULT`
  = `blp` (additiv/sicher), `istRechnungsstelle`/`normalizeRechnungsstelle`/`rechnungsstelleVon`, Prädikate
  `istBlp|ExternRechnungsstelle`, `vergibtBlpNummern`; **vorläufige interne Nummer** `vorlaeufigeRechnungsnummer(seq,jahr)`
  → `ENT-JJJJ-NNNN` (KEINE §14-Nummer) + `istVorlaeufigeNummer`; **`rechnungsstelleWechselHinweis(aktuell,ziel,{vergebeneNummern})`**
  — blp→extern mit bereits vergebenen §14-Nummern ⇒ `{erlaubt:true, warnen:true, code:'blp-nummern-vergeben'}` (GoBD-
  Lückenlosigkeit; bestehende Nummern bleiben gültig, BLP vergibt keine neuen mehr), alle anderen Wechsel unkritisch.
- **`src/state.js`**: neues Setting `rechnungsstelle` (Default `blp`).
- **`src/domain/crm-store.js`**: `vergebeneRechnungsnummern()` (liest den §14-Zähler `rechnungSeq` → Grundlage für den
  Wechsel-Hinweis).
- **`src/ui/lock.js`**: Onboarding-Schritt **`stepRechnungsstelle`** zwischen §19-Profil und Backup („Wer stellt eure
  Rechnungen aus?").
- **`src/ui/shell.js`**: Einstellungs-Abschnitt **`rechnungsstelleSection`** (Segment-Umschalter); Wechsel weg von BLP holt
  `vergebeneRechnungsnummern`, zeigt bei `warnen` ein `confirm` und schaltet nur nach Bestätigung um.
- i18n de/en (`onboard.rechnungsstelle*`, `settings.rechnungsstelle*` inkl. `warnWechsel`), **SW `v108`** + Modul precached.

**Stand**
- `node tests/run.mjs` → **1181/1181 grün**; `node --check` für alle geänderten Module ok. PR #125 (Draft → ready → CI → merge).
- Docs fortgeschrieben: BAUPLAN Schritt 4 abgehakt, PULS „START HIER" + Kopf-Status auf Schritt 5, OFFENE_PUNKTE + NAECHSTE_SITZUNG.

**Offen / Nächstes**
- **Block 2/Schritt 5 — Kalkulations-Kern (rein)** (`docs/KALKULATION_KATALOG.md` §2/§9): Kostenarten + Zuschlags-/
  Maschinenstundensatz-/m²-Formel, vorwärts (Preis) **und** rückwärts (erlaubte Zeit/Kosten), cent-genau, node-getestet.
- **Grenze (ehrlich):** Das Setting steuert nur BLP (zwingt das externe Programm nicht); UI/IndexedDB statisch geprüft
  (kein Headless-Browser); die Nummernvergabe-/Beschriftungs-Konsumtion folgt erst in Schritt 7+8.

## 2026-06-18 — BAUPLAN Block 1/Schritt 3: Datensicherungs-UX + `backupStrategie` [PR #124, Branch `claude/backup-restore-ux-kd8ft9`]

**Ausgangslage / Auswahl**
- Block 1 Schritte 1 (Roundtrip-Selbsttest, PR #116) + 2a–2c (Test-Modus, PRs #118/#120/#122) waren erledigt.
  Nächster Schritt laut `docs/BAUPLAN.md`/`docs/DATENSICHERUNG.md`: **Datensicherungs-UX + `backupStrategie`** (Schritt 3).
- Bewusst **eine** zusammenhängende PR: Strategie ↔ gemerkter Ordner ↔ prominente Knöpfe sind voneinander abhängig;
  ein Aufteilen hätte Halb-Pfade erzeugt (Setting ohne Wirkung bzw. Knöpfe ohne Strategie).

**Was getan** (reine Logik zuerst node-getestet — **+17 → 1158/1158**)
- **`src/domain/backupStrategie.js`** (rein, node-getestet): `BACKUP_STRATEGIEN` (`download`|`ordner`), Default
  `download`, `normalizeBackupStrategie`, **`backupZiel`** (Ordner nur bei API + gemerktem Ordner → sonst
  konservativer **Download-Fallback**, nie blockieren — Pflicht #1), `backupDateiname` (sortierbar, Sekunden-Stempel),
  `istBackupDatei` (Drag-and-drop-Vorfilter an Endung/Magic).
- **`src/core/files.js`**: File-System-Access-Helfer `supportsDirectoryPicker`/`pickDirectory`/`ensureRwPermission`/
  `writeTextToDirectory` (statisch geprüft).
- **`src/core/backupOrdner.js`** (neu): gemerkter Zielordner **gerätelokal** in eigener, unverschlüsselter kv-DB
  (`blpr_backupordner_bookledgerpro` — DB-Suffix unverändert, Regel #3); `merkeBackupOrdner`/`ladeBackupOrdner`/
  `vergissBackupOrdner`. FileSystemDirectoryHandle ist strukturiert-klonbar → in IndexedDB speicherbar.
- **`src/core/backup.js`**: `exportBackupSmart(password, strategie)` — schreibt in den Ordner **oder** lädt herunter
  (Fallback bei fehlender API/abgelehnter Berechtigung); `exportBackupFile` nutzt jetzt `backupDateiname`.
- **`src/state.js`**: neues Setting `backupStrategie` (Default `download`).
- **`src/ui/datensicherung.js`** (neu): **eine** Quelle für Aktionen (`backupJetzt`/`restoreAusDatei`/`restoreWaehlen`),
  prominente **`datensicherungKarte()`** (Backup/Restore + **Drag-and-drop-Zone**) und **`backupEinstellungen()`**
  (Strategie-Umschalter + Zielordner-Verwaltung).
- **`src/ui/shell.js`**: Durabilitäts-Banner-Knopf + Einstellungen nutzen das Modul (`onDatensicherungAktion`
  → `refreshDurability`).
- **`src/ui/views/dashboard.js`**: prominente Datensicherungs-Karte (nicht nur im Banner).
- **`src/ui/lock.js`**: Onboarding lässt `backupStrategie` wählen + (bei API) Zielordner wählen; Erst-Backup via
  `exportBackupSmart`.
- i18n de/en (`backup.*`, `settings.backup.*`), CSS (Karte/Drop-Zone), **SW `v107`** + 3 neue Module precachen.

**Stand**
- `node tests/run.mjs` → **1158/1158 grün**; `node --check` für alle geänderten Module; CI (smoke-test) grün; **PR #124 gemergt**.
- **BAUPLAN Block 1 komplett** (Schritt 1 + 2a–2c + 3).

**Offen / Grenzen (ehrlich)**
- DOM/IndexedDB/File-System-Access-Pfade **statisch geprüft** (kein Headless-Browser): Ordner merken/schreiben,
  Drag-and-drop, Onboarding-Auswahl. File System Access nur Desktop-Chromium → Tablet/iOS/Firefox fallen via
  `backupZiel` (node-getestet) automatisch auf Download zurück.
- **Bewusst offen (`docs/DATENSICHERUNG.md` #4):** Server-Ziel (eigener Server existiert noch nicht) +
  konfigurierbare Erinnerungs-Kadenz (Durabilitäts-Banner erinnert weiterhin wöchentlich).

**Nächstes:** BAUPLAN **Block 2/Schritt 4 — Setting `rechnungsstelle`** (`docs/KALKULATION_KATALOG.md`); optional
kleiner 2c-Folgeschritt Demo-Vorbefüllung (`domain/demodaten.js`).

---

## 2026-06-18 — BAUPLAN Block 1/Schritt 2c: Test-Modus — **UI** [PR #122, Branch `claude/test-modus-ui-v71y2l`]

**Ausgangslage / Auswahl**
- Schritte 2a (Sandbox-Kern, PR #118) + 2b (Store-Glue, PR #120) waren erledigt. Nächster Schritt laut
  `docs/BAUPLAN.md`/`docs/NAECHSTE_SITZUNG.md`: die **Test-Modus-UI** (`docs/TEST_MODUS.md`, Schritt 2c).

**Was getan** (reine Helfer zuerst node-getestet — **+9 → 1141/1141**)
- **`src/domain/mandanten.js`** (rein, node-getestet): `aktiverSandbox(registry)` (aktiver Mandant nur,
  wenn Test-Tresor → Grundlage für Banner + Verlassen-Dialog), `naechsterTestName(registry)` (fortlaufender
  Default „Test N" über das Maximum vorhandener „Test N", keine Doppler nach Löschen).
- **Korrektur `src/core/mandantenStore.js` `initMandanten`:** richtet die aktive DB über `aktiveDbName()`
  (Sandbox-Flag beachtet) statt `dbNameFuer(id)` aus → ein „behaltener" Test landet beim nächsten Start
  wieder in SEINER Sandbox-DB, nicht versehentlich in einer echten.
- **`src/ui/lock.js`** (DOM, statisch geprüft): „🧪 Tests"-Einstieg am Sperrbildschirm (Auswahl + Unlock);
  Tests-Verwaltung `renderTestsAuswahl` (öffnen/leeren/löschen je Test, „Neuer Test" `renderNeuerTest`,
  „Alle Tests löschen"); **verschlanktes Test-Onboarding** (nur Test-Passwort, kein Shamir-/Backup-Gate —
  ein Test ist ausdrücklich kein Backup); ein aktiver Test wird beim Start direkt wieder geöffnet
  (`renderSandboxEinstieg`), mit klarem Rückweg zur echten Welt (`unlockLinks`).
- **`src/ui/shell.js`** (DOM, statisch geprüft): dauerhafter **TEST-MODUS-Banner** (`testModusBanner`) solange
  ein Test aktiv ist; Sperren/Wechseln aus einem Test über den **behalten/verwerfen-Dialog**
  (`verlasseSandboxDialog`); Test-Modus-Abschnitt in den Einstellungen (`testModusSection`).
- **`src/core/sandboxStore.js`:** `behalteUndVerlasseSandbox()` (Test behalten + aktiven Tresor zurück auf
  einen echten Mandanten → nächster Start in der echten Welt; Test bleibt über „🧪 Tests" erreichbar).
- **i18n** de/en (alle `test.*`-Strings), **CSS** (Banner/Modal/Tests-Liste), **`sw.js`** `CACHE_VERSION`
  v105 → **v106**.

**Stand**
- `node tests/run.mjs` → **1141/1141 grün** (+9). `node --check` aller geänderten Module ok. CI (smoke-test)
  grün, **PR #122 squash-gemergt**. SW **v106**, **99 JS-Module** (kein neues Modul).
- **BAUPLAN Block 1 Schritt 2 (Test-Modus) komplett (2a–2c) ✅.**

**Offen / Nächstes**
- **Nächster Schritt: BAUPLAN Block 1/Schritt 3 — Datensicherungs-UX + `backupStrategie`** (`docs/DATENSICHERUNG.md`):
  prominente Backup-/Restore-Knöpfe, gemerkter Zielordner, Drag-and-drop-Restore; Setting `backupStrategie`
  (Onboarding + Einstellungen). Danach **Block 2 (Kalkulation/Angebote)** fein geschnitten.
- **Offene Grenzen (ehrlich):** DOM-/IndexedDB-Pfade der Test-Modus-UI **nicht** headless E2E-getestet
  (kein Headless-Browser) — statisch geprüft; reine Helfer node-getestet. **Optionale Demo-Vorbefüllung**
  (`domain/demodaten.js`) bewusst als sauber abgegrenzter Folgeschritt offen (UI ohne sie vollständig
  nutzbar — man startet mit leerem Test). **Vermerk:** auch **Mein-WorkFloh** soll einen Test-Modus nach
  `docs/TEST_MODUS.md` (⇄-Abschnitt) bekommen (fremdes Repo, über den Nutzer).

---

## 2026-06-18 — BAUPLAN Block 1/Schritt 2 (Teil 2): Test-Modus — Store-Glue `core/sandboxStore.js` [PR #120, Branch `claude/sandbox-store-glue`]

**Ausgangslage / Auswahl**
- Schritt 2a (Sandbox-Kern, reine Logik) war erledigt (PR #118). Nächster, fein geschnittener Schritt:
  die **Store-Glue** — die dünne IndexedDB-/Verdrahtungsschicht über dem Kern (`docs/TEST_MODUS.md` 2b).

**Was getan** (reine Helfer zuerst node-getestet — **+9 → 1132/1132**)
- **Neu `src/core/sandboxStore.js`** (Glue, statisch geprüft): wegwerfbare Test-Tresore über die
  Mehrmandanten-Schicht — echte Daten technisch unberührt (eigene DBs, eigener Namens-Infix).
  - `erstelleSandboxTresor(name)` — Sandbox-Mandant registrieren, aktiv setzen, DEK verwerfen, aktive
    DB auf die (leere) Sandbox-DB schalten (Onboarding folgt). Berührt keinen echten Mandanten.
  - `wechsleZuSandbox(id)` (verweigert Nicht-Sandbox-IDs), `leereSandboxTresor(id)` (Inhalt weg, Eintrag
    bleibt), `loescheSandboxTresor(id)` (aus Registry + DB löschen, aktive DB rückt über `aktiveDbName`
    nach), `loescheAlleSandboxes()` („Alle Tests löschen"). Lösch-/Leer-Pfade verweigern Nicht-Sandboxes.
  - `raeumeVerwaisteSandboxesAuf()` — Boot-Aufräumen verwaister Test-DBs via `indexedDB.databases()`
    (belt & suspenders, nie eine echte/aktive DB); in `src/main.js` nach `initMandanten` verdrahtet
    (best-effort, blockiert den Start nie). `deleteDatabase`/`vorhandeneDbNamen` als API-Wrapper.
- **`src/domain/mandanten.js`** (rein, node-getestet): `sandboxDbNamen(registry)` (DB-Namen je Test) +
  `aktiveDbName(registry)` (aktive DB, Sandbox-Flag beachtet, Legacy-Fallback).
- **`src/core/mandantenStore.js`:** `wechsleAktivenMandant` nutzt jetzt `dbNameVon(mandant)` statt
  `dbNameFuer(id)` → korrekte DB auch für Test-Tresore (latenter Bug behoben).
- **`sw.js`:** `CACHE_VERSION` v104 → **v105**, `core/sandboxStore.js` precachet.

**Stand:** `node tests/run.mjs` **1132/1132 grün**; CI (2× smoke-test) grün; **PR #120 squash-gemergt**.

**Offen / Grenzen (ehrlich)**
- **UI fehlt noch** (Schritt 2c, eigene PR): „🧪 Tests"-Bereich (Sperrbildschirm/Einstellungen),
  dauerhafter **TEST-MODUS-Banner**, behalten/verwerfen-Dialog, optional Demo-Vorbefüllung
  (`domain/demodaten.js`).
- **Nicht headless E2E:** die echten IndexedDB-Operationen (`deleteDatabase`, `databases()`) und die
  `main.js`-Verdrahtung sind **statisch geprüft** (kein Headless-Browser); reine Auswahl-/Lebenszyklus-
  Logik ist node-getestet.
- **Nächster Schritt:** Test-Modus **UI** (Schritt 2c), dann Schritt 3 Backup-UX + `backupStrategie`,
  danach Block 2 (Kalkulation/Angebote).

---

## 2026-06-18 — BAUPLAN Block 1/Schritt 2 (Teil 1): Test-Modus — Sandbox-Kern (reine Schicht) [PR #118, Branch `claude/testmodus-sandbox-kern`]

**Ausgangslage / Auswahl**
- BAUPLAN Block 1/Schritt 1 (Roundtrip-Selbsttest) war erledigt → nächster Schritt **Test-Modus
  (Sandbox-Tresor)** (`docs/TEST_MODUS.md`). Fein geschnitten: **erst die reine Lebenszyklus-Logik**
  (node-testbar), Store-Glue + UI als eigene Folge-PRs.

**Was getan** (reine Logik zuerst, node-getestet — **+28 → 1123/1123**)
- **`src/domain/mandanten.js` (rein, kein IndexedDB):** Sandbox-/Test-Tresor als Mandant mit Flag
  `sandbox:true` über die vorhandene Mehrmandanten-Schicht.
  - `SANDBOX_INFIX` + `dbNameFuer(id, { sandbox })` → eigener DB-Infix `blpr_sandbox_<id>_bookledgerpro`;
    Sandbox wird **nie** auf die Legacy-/Bestands-DB abgebildet (echte Daten technisch unberührt);
    Suffix `bookledgerpro` bleibt (Regel #3). `dbNameVon(mandant)` + `istSandboxDbName(name)`
    (erkennt Test-DBs am Namen ohne Registry → Aufräum-Sicherheit).
  - `erstelleSandbox`/`istSandbox`; `echteMandanten`/`sandboxMandanten` trennen die Bereiche.
  - `mandantenAuswahlListe`/`brauchtMandantenAuswahl` blenden Sandboxes aus (Sperrbildschirm = nur
    echte Mandanten); neue `sandboxAuswahlListe` für den „🧪 Tests"-Bereich.
  - `entferneAlleSandboxes` („Alle Tests löschen", immutabel) + `verwaisteSandboxDbs` (verwaiste
    Test-DBs nach Absturz erkennen).
- **`sw.js`:** `CACHE_VERSION` v103 → **v104** (`mandanten.js` ist precached).

**Stand:** `node tests/run.mjs` **1123/1123 grün**; CI grün; **PR #118 squash-gemergt**.

**Offen / Grenzen (ehrlich)**
- Nur die **reine Schicht**. Es fehlen noch (eigene PRs):
  **(a) Store-Glue** `core/sandboxStore.js` (Sandbox-DB anlegen/wechseln/**leeren**/löschen,
  „alle aufräumen", Boot-Aufräumen verwaister Test-DBs via `indexedDB.databases()`);
  **(b) UI** „🧪 Tests"-Bereich + dauerhafter **TEST-MODUS-Banner** + behalten/verwerfen-Dialog +
  optional Demo-Vorbefüllung.
- **Nächster Schritt:** Test-Modus **Store-Glue** (`core/sandboxStore.js`), dann UI; danach
  Schritt 3 Backup-UX + `backupStrategie`.

---

## 2026-06-18 — BAUPLAN Block 1/Schritt 1: Backup→Restore-Roundtrip-Selbsttest [PR #116, Branch `claude/bookledgerpro-backup-restore-f03itw`]

**Ausgangslage / Auswahl**
- Start des `docs/BAUPLAN.md` (mit dem Nutzer 2026-06-17 vereinbart). **Block 1 zuerst (Vertrauen/Sicherheit)**,
  davon **Schritt 1: Backup→Restore-Roundtrip-Selbsttest** (`docs/DATENSICHERUNG.md`) — Datendurabilität ist
  **Pflicht-Feature #1** (CLAUDE.md Regel #2). Ziel: die Rettung **beweisen**, nicht behaupten.

**Was getan** (reine Logik zuerst, node-getestet — **+15 → 1095/1095**)
- **`src/core/backup.js` (rein, kein IndexedDB → node-/browser-testbar):**
  - `buildBackupFromSnapshot(snapshot, pw)` — baut den verschlüsselten Backup-Text aus einem **gegebenen**
    Snapshot (Form wie `dumpAll()`); `buildBackup` delegiert jetzt daran (Verhalten unverändert), sodass der
    Roundtrip **ohne** DB-Zugriff testbar ist.
  - `importProbe(parsed)` — spiegelt `importSnapshot('replace')` + `dumpAll()` in einem **In-Memory-
    Probespeicher** (kv replace, records/files **id-basiert** „letzter gewinnt", Reihenfolge erhalten).
  - `snapshotBytes(snapshot)` / `backupRoundtripSelbsttest(snapshot, pw)` — **byte-genauer** Vergleich
    Original ↔ wiederhergestellt; Fehler werden gefangen + als `{ok:false, fehler}` gemeldet.
- **`src/domain/selbsttest.js` (V10):** zwei neue Prüfungen — Roundtrip byte-genau + Restore lehnt falsches
  Passwort ab. (Selbsttest jetzt 13 statt 11 Einzelprüfungen.)
- **`tests/run.mjs`:** neue Sektion „Datensicherung: Backup→Restore-Roundtrip" (+15 Assertions): Roundtrip
  identisch, verschlüsselte Hülle **ohne Klartext**, MAGIC/Format, falsches Passwort abgelehnt,
  **Manipulationserkennung** (kein blindes Grün), id-Dedup, leerer Tresor.
- **`sw.js`:** `CACHE_VERSION` v102 → **v103** (`backup.js`/`selbsttest.js` waren bereits precached).

**Stand:** `node tests/run.mjs` **1095/1095 grün**; CI (push + pull_request) grün; **PR #116 squash-gemergt**.

**Offen / Grenzen (ehrlich)**
- Reine Roundtrip-/Vergleichslogik node-getestet. Der **echte `dumpAll`/IndexedDB-Pfad** mit Live-Daten läuft
  im Browser-Selbsttest, ist hier nur **statisch geprüft** (kein Headless-Browser).
- **Nächstes (BAUPLAN Block 1):** Schritt 2 **Test-Modus (Sandbox-Tresor)** (`docs/TEST_MODUS.md`),
  danach Schritt 3 **Backup-UX + `backupStrategie`** (`docs/DATENSICHERUNG.md`).

---

## 2026-06-17 — Edit bestehender Aufträge (GoBD-Guard) [Branch `claude/edit-auftraege`]

**Ausgangslage / Auswahl** (build-freier Rest-Korb leer → mit dem Nutzer abgestimmt, AskUserQuestion)
- Optionen: kleine Folge-Idee „Edit bestehender Aufträge" / „Eingangsrechnungs-Verzug" · Browser-Sichttest ·
  umgebungs-blockierte KANN-Punkte · neue Feature-Idee. Nutzer: **„keine Präferenz"** → empfohlene, am
  saubersten abgegrenzte Option umgesetzt: **Edit bestehender Aufträge**.
- Problem vorher: ein einmal angelegter Auftrag war **nicht mehr bearbeitbar** (Tippfehler/falscher Kunde/
  vergessene Position erzwangen Löschen + Neuanlage). Lücke seit Phase 3.

**Was getan** (reine Logik zuerst, node-getestet — **+21 → 1080/1080**)
- **`src/domain/orders.js` (rein):** `darfAuftragBearbeiten(auftrag)` — GoBD-Guard: editierbar nur solange
  **keine Rechnung gebucht** (`rechnungBuchungId`/`rechnungNummer` leer) **und keine (Teil-)Zahlung erfasst**
  und Status ∈ {angelegt, in_arbeit, erledigt}; sonst gesperrt (würde die gebuchte Forderung verfälschen).
  `anwendeAuftragEdit(bestehend, patch)` übernimmt **nur** die freigegebenen Felder `AUFTRAG_EDIT_FELDER`
  (Titel, Kunde, Kostenstelle, Zahlungsziel, Positionen) — Status/Zahlungen/Mahnungen/Rechnungsbezug/
  createdAt/id bleiben unveränderlich (per-Feld `hasOwnProperty`, `null` löscht das Zahlungsziel).
- **`src/domain/crm-store.js`:** `updateAuftrag(id, patch)` — lädt, prüft den Guard (wirft bei gesperrt),
  merged via `anwendeAuftragEdit`, validiert wie beim Anlegen (`validateAuftrag`), persistiert (`encPut`).
- **UI `src/ui/views/orders.js` (statisch geprüft):** „Bearbeiten"-Knopf je Auftrag **nur wenn**
  `darfAuftragBearbeiten`; Klick lädt den Auftrag in das (prefill-fähige) Formular (`_editAuftrag`), Überschrift
  „Auftrag bearbeiten", Submit „Speichern" + „Abbrechen", `updateAuftrag` statt `saveAuftrag`; Fehler werden im
  Formular angezeigt. `positionsRow(init)` prefillt Beschreibung/Menge/Preis/USt; `formatCents` für den Preis.
- **i18n** `orders.edit` de+en (übrige Knopf-Texte über bestehende `common.save/cancel/edit`).
- **SW-Cache** `v101 → v102` (kein neues Modul — nur bestehende, bereits precachte Dateien geändert).

**Stand:** `node tests/run.mjs` **1080/1080 grün**. Berührte Module `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- UI/Glue (`updateAuftrag`-Aufruf, Prefill, IndexedDB `encPut`) **statisch geprüft** — kein Headless-Browser.
  **Browser-Sichttest empfohlen:** Auftrag anlegen → „Bearbeiten" → Titel/Kunde/Position/Zahlungsziel ändern →
  „Speichern" → Werte stimmen; dann denselben Auftrag „berechnen" → „Bearbeiten" verschwindet (GoBD).
- Bewusst gesperrt: **berechnete/bezahlte Aufträge** sind nicht editierbar (Storno-Pfad bleibt der korrekte Weg).
- Eingangsrechnungs-Verzug der Gegenseite weiter offen [SOLL].

---

## 2026-06-17 — Zahlungsziel je Auftrag durabel + im Austauschformat (v4) [Branch `claude/bookledgerpro-next-steps-o185d5`]

**Ausgangslage / Auswahl** (build-freier Rest-Korb leer → mit dem Nutzer abgestimmt, AskUserQuestion)
- Optionen waren: zwei „große" Features (Mehrmandanten / Bilanzierung), eine kleine build-freie Folge-Idee,
  oder Browser-Sichttest. Beim Erkunden zeigte sich: **die „großen" Features (M-/B-Serie) sind bereits gebaut
  und gemergt** (`domain/mandanten.js`, `bilanz.js`, `bilanzierung.js` + UI). Der Nutzer wählte **„nach deiner
  Empfehlung"**. → empfohlen + umgesetzt: die Folge-Idee **„WorkFloh-`rechnung`-Block überträgt das Zahlungsziel"**.
- **Beim Implementieren echten Bug gefunden:** `crm-store.saveAuftrag` führt eine **Feld-Whitelist** und ließ
  `zahlungszielTage` (A1-Rest) **fallen** → das auftragsindividuelle Zahlungsziel ging beim Speichern verloren;
  Mahnwesen (`offenePosten`→`faelligAmVon`) und die gedruckte **„zahlbar bis"-Zeile** fielen nach dem Speichern
  **immer** auf den globalen Default zurück. A1-Rest + „zahlbar bis" waren damit faktisch wirkungslos. → Bugfix
  mit in denselben PR gezogen (gehört thematisch zusammen — ohne Persistenz ist die Übertragung sinnlos).

**Was getan** (reine Logik zuerst, node-getestet — **+8 → 1059/1059**)
- **Bugfix Persistenz (`src/domain/crm-store.js` `saveAuftrag`):** `zahlungszielTage` wird jetzt mit-persistiert
  (ganze Tage ≥ 0 oder null). Damit greifen A1-Rest (Mahnwesen-Fälligkeit) und „zahlbar bis" endlich durchgängig.
- **Übertragung (Austauschformat v4):** `connect.buildAustauschPaket` trägt `rechnung.zahlungszielTage` reziprok
  mit (nur bei eigenem Ziel; null → Feld weg); `AUSTAUSCH_VERSION` 3→**4** (abwärtskompatibel).
  `importworkfloh.normalizeRechnung` übernimmt das Ziel konservativ (Integer ≥ 0, sonst verworfen + Warnung);
  `crm-store.importWorkFloh` reicht es beim Import an `saveAuftrag` → der importierte Auftrag erbt dieselbe
  Fälligkeit wie die Ausgangsseite (statt des globalen Defaults der Gegenstelle).
- **Tests:** +8 (Export trägt/lässt-weg, 0-Tage-Sonderfall, Round-trip, ungültiges Ziel → verworfen + Warnung,
  Abwärtskompatibilität). Bestehende „v3"-Header-Assertion auf v4 nachgezogen.
- **Docs:** `docs/CONNECT.md` + `docs/WORKFLOH_IMPORT.md` auf v4 (neues Feld `rechnung.zahlungszielTage`).
- **SW-Cache** `v100 → v101` (kein neues Modul — nur bestehende, bereits precachte Dateien geändert).

**Stand:** `node tests/run.mjs` **1059/1059 grün**. Alle berührten Module `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- Der **`saveAuftrag`-Persistenz-Fix** läuft über IndexedDB (`encPut`) → **statisch geprüft**, kein Headless-Browser.
  Die reine Logik (Export/Normalisierung/Round-trip) ist node-getestet. **Browser-Sichttest empfohlen:** Auftrag mit
  Zahlungsziel anlegen → speichern → Mahnwesen/„zahlbar bis" prüfen; WorkFloh-Austauschdatei mit
  `rechnung.zahlungszielTage` importieren → geerbte Fälligkeit prüfen.
- **Kein Edit** bestehender Aufträge (weiter offene Folge-Idee); **Eingangsrechnungs-Verzug (Gegenseite)** weiter offen.

---

## 2026-06-17 — „zahlbar bis" auf der §14-Rechnung (Fälligkeitsdatum auf dem Druckdokument) [Branch `claude/bookledgerpro-next-steps-tshhqz`]

**Ausgangslage / Auswahl** (build-freier Rest-Korb leer → mit dem Nutzer abgestimmt, AskUserQuestion)
- Drei Wege standen offen (neues kleines build-freies Feature / Browser-Sichttest / umgebungs-blockierte
  KANN-Punkte). Der Nutzer wählte **neues Feature** und priorisierte die empfohlene Folge-Idee
  **„zahlbar bis" auf dem gedruckten §14-Rechnungsdokument** — der natürliche Folgeschritt nach A1-Rest
  (das auftragsindividuelle Zahlungsziel existiert seit A1-Rest, war aber auf der Rechnung nicht sichtbar).
- **Warum:** Das seit A1-Rest erfasste `zahlungszielTage` je Auftrag steuerte bisher nur die
  Mahnwesen-Fälligkeit; das gedruckte §14-Dokument zeigte kein Fälligkeitsdatum. Genuin build-frei,
  autonom, node-testbar → ein sauberer, in sich abgeschlossener PR.

**Was getan** (reine Logik zuerst, node-getestet — **+6 → 1051/1051**)
- **`src/domain/rechnung.js` `baueRechnung`:** neuer Parameter `defaultZielTage` (Default 14) + berechnetes
  Feld **`zahlbarBis`** (und mitgeführtes `zahlungszielTage`). Spiegelt **`mahnwesen.faelligAmVon`**
  (auftragseigenes `zahlungszielTage` vor globalem Default; ohne Rechnungsdatum bleibt das Feld leer →
  Entwurf ohne Fälligkeit). Import von `faelligAmVon` aus `mahnwesen.js` (kein Zyklus — mahnwesen importiert
  nichts). `pflichtangaben` **unverändert** (Fälligkeit ist KEINE §14-Pflichtangabe → bewusst nicht als
  Mangel geführt).
- **`src/ui/views/orders.js`:** `rechnungAnzeigen` reicht `defaultZielTage: s.zahlungszielTage` durch;
  das Druckdokument zeigt im Kopf neben Datum/Leistungsdatum eine Zeile **„zahlbar bis JJJJ-MM-TT"**
  (nur wenn vorhanden → Ternär `? span : null`).
- **i18n** `orders.payableUntil` de („zahlbar bis") + en („payable until").
- **Tests:** +6 Fälle in `tests/run.mjs` (auftragseigenes Ziel 30 → Datum; Default-Ziel; leeres Ziel ''
  zählt als „kein eigenes Ziel"; `zahlungszielTage`-Mitführung; ohne Datum leer).
- **SW-Cache** `v99 → v100` (kein neues Modul — nur bestehende Dateien geändert; rechnung.js bereits precached).

**Stand:** `node tests/run.mjs` **1051/1051 grün**. Alle berührten Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- UI/Glue **statisch geprüft** (kein Headless-Browser) → die neue „zahlbar bis"-Zeile auf der gedruckten
  Rechnung ist als **Browser-Sichttest** zu bestätigen.
- **Kein Edit** bestehender Aufträge (weiterhin offene Folge-Idee); **WorkFloh-`rechnung`-Block** überträgt
  weiterhin kein Zahlungsziel (Folge-Idee); **Eingangsrechnungs-Verzug (Gegenseite)** weiterhin offen.
- Build-freier Rest-Korb damit weiter im Wesentlichen leer → nächste Sitzung erneut **mit dem Nutzer
  abstimmen** (verbleibende kleine Folge-Ideen / Browser-Sichttest / umgebungs-blockierte KANN-Punkte).

---

## 2026-06-17 — A1-Rest: Zahlungsziel je Forderung (Fälligkeit aus auftragsindividuellem Ziel) [Branch `claude/bookledgerpro-next-steps-9v3kaz`]

**Ausgangslage / Auswahl** (build-freier Rest-Korb leer → mit dem Nutzer abgestimmt, AskUserQuestion)
- Vier Wege standen offen (neues build-freies Feature / Browser-Sichttest / umgebungs-blockiert). Der Nutzer
  fragte nach meiner Priorisierung → **empfohlen & umgesetzt: Zahlungsziel je Forderung** (offener [SOLL]-Punkt A1).
- **Warum:** Eingangsrechnungen (Verbindlichkeiten) trugen seit R3 ein **rechnungseigenes** `zahlungszielTage`
  (`payables.berechneFaelligAm`), **Forderungen** dagegen leiteten die Fälligkeit nur aus dem **globalen** Setting
  `zahlungszielTage` ab. Bei kundenindividuellen Zielen (14/30/60 Tage) war die Mahnwesen-Fälligkeit damit falsch.
  Genuin **build-frei, autonom, node-testbar** → ein sauberer, in sich abgeschlossener PR.

**Was getan** (reine Logik zuerst, node-getestet — **+16 → 1045/1045**)
- **`src/domain/mahnwesen.js`:** neuer reiner Helfer **`faelligAmVon(posten, defaultZielTage=14)`** —
  `posten.faelligAm` (Vorrang) → Rechnungsdatum + posten-eigenes `zahlungszielTage` → Rechnungsdatum + Default.
  `anreicherePosten` und `mahnschreibenDaten` nutzen ihn jetzt (statt des flachen `faelligkeit(datum, zielTage)`),
  honorieren also das **auftragsindividuelle Ziel**.
- **`src/domain/payables.js`:** `berechneFaelligAm` **delegiert** jetzt an `faelligAmVon` (identische Logik,
  Duplikat entfernt; Default-Ziel 30 für Eingangsrechnungen bleibt). Verhalten unverändert (Regression node-getestet).
- **`src/domain/zahlungsabgleich.js` `offenePosten`:** reicht `faelligAm` + `zahlungszielTage` des Auftrags in die
  Forderungs-Posten durch (Auftrag ohne Angabe → `''`/`null`).
- **`src/domain/orders.js` `validateAuftrag`:** optionales `zahlungszielTage` validiert (ganzzahlig ≥ 0).
- **UI (statisch geprüft):** `ui/views/orders.js` Auftragsformular bekommt ein Feld **„Zahlungsziel (Tage)"**
  (Platzhalter = globaler Default, leer = Standard) + Hinweistext; wird als `zahlungszielTage` gespeichert.
  i18n `orders.zahlungsziel`/`.hint` de+en.
- **SW-Cache** `v98 → v99` (kein neues Modul — nur bestehende Dateien geändert).

**Stand:** `node tests/run.mjs` **1045/1045 grün**. Alle berührten Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- **Kein Editieren** bestehender Aufträge (das Formular ist „neu anlegen" — das Ziel wird bei Anlage gesetzt; ein
  Edit-Pfad existiert bislang generell nicht). Das Ziel erscheint **nicht** auf dem gedruckten §14-Rechnungsdokument
  (`rechnung.js` bewusst nicht angefasst — wäre eigener Folgeschritt „zahlbar bis").
- **WorkFloh-`rechnung`-Block** überträgt (noch) kein Zahlungsziel — bewusst außen vor gelassen (Folge-Idee).
- UI/Glue **statisch geprüft** (kein Headless-Browser) → das Feld + die Mahnwesen-Fälligkeit sind als
  **Browser-Sichttest** zu bestätigen.

---

## 2026-06-17 — R5a-Rest: SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung [Branch `claude/bookledgerpro-swift-iso-validation-s852dy`]

**Ausgangslage / Auswahl** (Schritt nach R4-Rest, gemäß `docs/NACHFOLGE_PLAN.md`)
- Zwei gleichwertige Wege: **(A) Browser-Sichttest** (braucht den menschlichen Nutzer mit echtem Browser — hier
  keiner) oder **(B) build-freier Code-Korb**. Der Plan **empfiehlt B / R5a-Rest** als letzten verbliebenen
  build-freien Rest-Korb → autonome Code-Sitzung, R5a-Rest sauber umgesetzt.

**Was getan** (reine Logik zuerst, node-getestet — **+28 → 1029/1029**)
- **Neu `src/domain/bankschema.js`** (rein, kein Netz/DOM) — **Struktur-/Schema-Validierung** des Bankimports,
  bewusst getrennt von der **semantischen** `pruefeBankauszug()` (Saldo-Integrität) in `bankimport.js`:
  - `validiereMT940(text)` — SWIFT-FIN-Feldformate: Pflichtfelder `:20:/:25:/:28C:/:60a:/:62a:`, Feldformate
    (16x, 35x, `5n[/5n]`, Saldo `1!a6!n3!a15d`, Statement-Line `:61:` Front `6!n[4!n]2a[1!a]15d1!a3!c`), Datums-/
    Betrags-Plausibilität, Sequenz-Reihenfolge (als Warnung, dialekt-tolerant), `:28:`-statt-`:28C:`-Warnung,
    fehlender Geschäftsvorfall-Code → Warnung.
  - `validiereCAMT(xml)` — ISO-20022-Nachrichten-Struktur camt.052/.053/.054: Namespace→Variante/Version,
    Pflicht-Container (`BkToCstmrAcctRpt`/`BkToCstmrStmt`/`BkToCstmrDbtCdtNtfctn`, `GrpHdr`+`MsgId`+`CreDtTm`,
    Statement+`Id`+`Acct`); je `<Ntry>`: `<Amt>` mit **Ccy-Attribut** (ISO 4217), `CdtDbtInd` ∈ {CRDT,DBIT},
    Status `<Sts>`/Datum (Warnung wenn fehlt), für .053 Salden OPBD/CLBD (Warnung).
  - `validiereBankauszug(text)` — Format-Weiche (über `erkenneBankformat`); unbekannt → Fehler `format-unbekannt`.
  - **Konservativ:** klare Verstöße = **Fehler**, dialekt-strittige Punkte = **Warnungen** (nicht-blockierend).
- **UI (statisch geprüft):** `ui/views/documents.js` Bankimport zeigt jetzt `bankSchemaHinweis(schema)` (grün
  „Struktur ok" / gelb Hinweise / rot Verstöße) vor der Saldo-Plausibilität; i18n `docs.bankSchema*` de+en.
- **SW-Cache** `v97 → v98`; `src/domain/bankschema.js` ins Precache aufgenommen.

**Stand:** `node tests/run.mjs` **1029/1029 grün**. Alle berührten Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- **KEINE zertifizierte XSD-Validierung** (ein echter XSD-Validator ist nicht build-frei) und **KEINE**
  SWIFT-Netzwerk-Konformitätsprüfung — es wird **keine Konformität behauptet, die nicht belegt ist**. Reale
  Bank-Dialekte weichen ab → strittige Punkte bewusst als Warnungen; mit echten Bank-Auszügen weiter testen.
- UI/Glue (`documents.js`) **statisch geprüft** (kein Headless-Browser): der reale Schema-Hinweis im Bankimport
  ist als **Browser-Sichttest** zu bestätigen.
- **Build-freier Rest-Korb damit leer:** verbleibend nur noch umgebungs-/menschen-blockierte [KANN]-Punkte
  (R6/Rest) oder ein Browser-Sichttest oder eine neue, mit dem Nutzer vereinbarte Feature-Idee.

---

## 2026-06-17 — R4-Rest: Zahlungs-/Teilzahlungs-Übernahme aus WorkFloh (Austauschformat v3) [Branch `claude/bookledgerpro-next-steps-k8bcp8`]

**Ausgangslage / Auswahl** (Schritt nach R5c-Rest, gemäß `docs/NACHFOLGE_PLAN.md`)
- Zwei gleichwertige Wege standen offen: **(A) Browser-Sichttest** (verlangt den menschlichen Nutzer mit echtem
  Browser — hier keiner) oder **(B) build-freier Code-Korb**. Der Plan **empfiehlt B / R4-Rest** (höherer
  Geschäftswert) → autonome Code-Sitzung, R4-Rest sauber umgesetzt.

**Was getan** (reine Logik zuerst, node-getestet — **+18 → 1001/1001**)
- **`src/domain/importworkfloh.js`:** `normalizeRechnung` nimmt jetzt ein optionales `zahlungen[]` je Rechnung;
  neuer Helfer `normalizeZahlungen` (rein): gültiges ISO-Datum + positiver Betrag (Cent **oder** Euro-String),
  optionale `ref`; unvollständige Einträge werden verworfen + als Warnung gezählt (nichts erfunden).
- **`src/domain/invoicing.js`:** `validateZahlungsUebernahme(zahlung)` + `zahlungsUebernahmeEntwurf(rechnung, zahlung)`
  (rein): Zahlungseingang als Buchungs-ENTWURF **Soll Bank 1200 / Haben Forderung 1400** (gleicht die Forderung der
  Rechnungs-Übernahme cent-genau aus → korrekte Ist-EÜR §4 Abs.3 EStG). `BANK_KONTO` in `INVOICING_KONTEN` ergänzt.
- **`src/domain/crm-store.js` `importWorkFloh`:** nach der Rechnungs-Übernahme je gültiger Zahlung einen
  Zahlungseingang-Entwurf (`saveEntwurf`) + (Teil-)Zahlung am Auftrag (`zahlungen[]`); ist die Forderung danach
  ausgeglichen (`auftragOffen <= 0`), wird der Auftrag **„bezahlt"**. Rückgabe um `zahlungenUebernommen` erweitert.
- **`src/domain/connect.js`:** Austauschformat **v2 → v3**; ein berechneter Auftrag exportiert seine erfassten
  (gültigen) `zahlungen` reziprok im `rechnung`-Block (abwärtskompatibel — v1/v2 ohne `zahlungen` bleiben gültig).
- **UI (statisch geprüft):** `ui/views/orders.js` Import-Banner zählt übernommene Zahlungen; i18n `import.payments`
  de+en. **SW-Cache** `v96 → v97` (keine neuen Module → Precache unverändert, alle vier Module waren bereits gelistet).
- **Doku:** `docs/WORKFLOH_IMPORT.md` + `docs/CONNECT.md` auf v3 (Beispiel + Felder + Verhalten + Grenzen).

**Stand:** `node tests/run.mjs` **1001/1001 grün**. Alle berührten Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- **Festschreiben bleibt manuell** (GoBD) — die übernommenen Zahlungen sind Buchungs-Entwürfe.
- **Überzahlung** wird nicht gesondert behandelt: gemeldete Zahlungen werden faithfully gebucht/vermerkt (wie der
  bestehende manuelle Teilzahlungs-Pfad); summieren sie über Brutto, wird der Auftrag „bezahlt" und der Nutzer kann
  das manuell korrigieren.
- UI/Glue (`orders.js`) **statisch geprüft** (kein Headless-Browser): der reale Import-Lauf mit Zahlungs-Entwürfen
  ist als **Browser-Sichttest** zu bestätigen.
- **Weiterhin offen (R4-Familie):** API/Push (Echtzeit) statt Datei. **R5a-Rest** (echte SWIFT/ISO-20022-Schema-
  Validierung) bleibt der nächste build-freie Code-Korb.

---

## 2026-06-17 — R5c-Rest: NER-Scoping (Fremd-PII unter EXTERN-Scope) [Branch `claude/r5c-ner-scoping`]

**Ausgangslage / Auswahl** (Schritt nach R6/P2)
- **R6/Rest [KANN] ist umgebungs-/menschen-blockiert** und das verifiziert: **Lighthouse/Perf** braucht einen
  Headless-Browser (hier keiner); **lokales OCR** = Tesseract (wasm/npm-Runtime) ist **nicht build-frei**
  (geprüft: nichts vendored, Goldene Regel #1 verbietet CDNs/npm-Runtime); **ZUGFeRD-Erzeugen** braucht eine
  PDF/A-3-Lib (nicht build-frei); **Sage 5b–d** sind fremde Repos (menschlich vermittelt). Der „praktische
  nächste Schritt" laut Brief — ein **Browser-Sichttest** — verlangt den menschlichen Nutzer mit echtem Browser.
- Daher (gemäß Brief: „nächsten sinnvollen Korb abstimmen") **mit dem Nutzer abgestimmt** → Wahl: **R5c-Rest
  NER-Scoping** (build-frei, reine Logik, node-testbar, enge Fortsetzung der R5-Datenschutz-Familie).

**Was getan**
- **Reine Logik zuerst (node-getestet, +11 → 983/983):** `src/ai/ner.js`
  - Neuer Export `EXTERN_SCOPE = 'EXTERN'`; `piiAnker(text, {scope})` und `kombiniereAnker(exakt, text, {scope})`
    versehen die im Belegtext erkannten **Fremd-PII** (IBAN/E-Mail/USt-IdNr/Steuernr/Telefon Dritter) bei gesetztem
    Scope mit dem Präfix (`EXTERN_IBAN`, `EXTERN_EMAIL` …) → `pseudonym.tokenize()` erzeugt gruppierende, sichtbar
    externe Token (`[[EXTERN_IBAN_1]]`) statt flacher `[[IBAN_1]]`. Ohne Scope unverändert flach (abwärtskompatibel).
- **Glue (statisch geprüft):** `src/ai/anker.js ladeAnker()` reicht `EXTERN_SCOPE` an `kombiniereAnker` **nur**
  im Briefkasten-Modus (`briefkastenScopes === true`) durch; flacher Pseudonym-Modus bleibt flach. Exakte (gescopte)
  Stammdaten-Anker stehen weiter zuerst → behalten bei gleichem Wert ihren Typ-Vorrang (eigene/Mandanten-Entität
  schlägt EXTERN-Heuristik).
- **Transparenz-Badge lesbar (Nebenfix):** `t()` liefert bei fehlendem Schlüssel den Schlüssel selbst, daher zeigte
  der Badge scope-präfixierte Typen (schon bei R5c `FIRMA_2_IBAN`, jetzt auch `EXTERN_IBAN`) als rohen i18n-Schlüssel.
  Neuer `tOpt(key)` (i18n) liefert `null` statt Schlüssel → `documents.js` fällt sauber auf den Roh-Typ zurück.
- **SW-Cache** `v95 → v96` (keine neuen Module → Precache unverändert).

**Stand:** `node tests/run.mjs` **983/983 grün**. Alle berührten Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- **EIN gemeinsamer `EXTERN`-Scope** — verschiedene Drittparteien werden **NICHT** geclustert; das ginge aus flachem
  Belegtext nur heuristisch (FP-Risiko) → bewusst konservativ belassen.
- UI/Glue (`anker.js`/`documents.js`) **statisch geprüft** (kein Headless-Browser): der reale Briefkasten-Lauf mit
  EXTERN-Token + Badge ist als **Browser-Sichttest** zu bestätigen.

**Nächstes:** R6/Rest bleibt blockiert (Umgebung/Mensch). Build-freie Code-Körbe für die nächste Sitzung:
**R4-Rest** (Zahlungsstatus/Teilzahlungen aus WorkFloh übernehmen) oder **R5a-Rest** (echte SWIFT/ISO-20022-Schema-
Validierung) — oder Browser-Sichttest durch den Nutzer. Siehe `docs/NACHFOLGE_PLAN.md` / `docs/NAECHSTE_SITZUNG.md`.

---

## 2026-06-17 — R6/P2: Feature-Gates ansichtsintern konsumieren [Branch `claude/bookledgerpro-feature-gates-ixswxu`]

**Was getan** (Schritt **R6/P2** — die in R6/P1 definierten Gates jetzt in den Views lesen)
- **Reine Politik unverändert** (`domain/nutzungsmodus.js` bleibt wie node-getestet, 972/972). P2 ist reine
  **UI-Konsumption** der bestehenden `zeigeFeature`/`zeigeAnsicht`-Politik in den Ansichten, die im Privat-/
  Verein-Kontext sichtbar bleiben (dashboard/journal/documents/reports).
- **journal.js:** USt-Satz + Umsatzart (Reverse-Charge/innergem. Erwerb) + Bewirtungs-Split (70/30 inkl. USt)
  nur bei `FEATURE.UMSATZSTEUER`; Kostenstelle nur bei `FEATURE.KOSTENSTELLEN`. Submit erzwingt im Privat-Modus
  **0 %/Inland** (Felder ausgeblendet → keine versehentliche USt). Elemente werden weiter erzeugt (Closures intakt),
  nur nicht gemountet.
- **reports.js:** USt-Karten (USt-VA/Verprobung/Steuer-Assistent), Mahnwesen-Karte, Kreditoren-OP-Karte,
  Kostenstellen-Karte sowie der **DATEV-EXTF**-Export (`BERATER_EXPORT`) und **USt-VA-CSV** (`UMSATZSTEUER`)
  in der Export-Leiste je nach Modus ausgeblendet.
- **documents.js:** Kreditoren-OP „auf Ziel" (Verbindlichkeit) aus E-Rechnung-Empfang und OCR-Beleg nur bei
  `FEATURE.VERBINDLICHKEITEN`.
- **dashboard.js:** USt-Zahllast-KPI nur bei `UMSATZSTEUER`; Kunden-/Aufträge-KPI nur, wenn die jeweilige
  Ansicht im Modus sichtbar ist (`zeigeAnsicht('customers'|'orders')` → Privat blendet beide aus, Verein zeigt
  Kunden=Mitglieder).
- **Implementierungs-Detail:** `el()` filtert nur `null`-Kinder (nicht `false`) → durchgehend Ternär-Form
  `bedingung ? karte : null`. SW-Cache **v94 → v95** (keine neuen Module → Precache unverändert).

**Stand:** `node tests/run.mjs` **972/972 grün** (keine neue reine Logik). Vier View-Dateien `node --check`-sauber.

**Offen / Grenzen (ehrlich)**
- UI/Glue **statisch geprüft** (kein Headless-Browser) — der tatsächliche Modus-Wechsel + Ausblenden ist als
  **Browser-Sichttest** durch den Nutzer zu bestätigen.
- Gating = **Anzeige-Vereinfachung, keine rechtliche Sperre**; Routing/Buchungs-Engine unverändert.
- **Verein** behält per Politik USt/Verbindlichkeiten/Anlagen als Feature (nur deren NAV-Ansichten sind aus) —
  Policy bewusst nicht geändert (node-getestet/dokumentiert in `tests/run.mjs`).

**Nächstes:** R6/Rest (Lighthouse/Perf — Headless; lokales OCR — build-frei prüfen; ZUGFeRD-Erzeugen — PDF-Lib;
Sage 5b–d — fremde Repos) **oder** Browser-Sichttest — siehe `docs/NACHFOLGE_PLAN.md`.

---

## 2026-06-17 — R6/P1: Privat-/Bürger-Modus (Nutzungskontext firma/privat/verein) [Branch `claude/p1-privat-buerger-modus`, PR #99]

**Was getan** (Schritt **R6/P1** — erste, build-freie Scheibe aus dem R6-Korb)
- **Auswahl begründet:** R6 bündelt mehrere KANN-Optionen. Nach der Build-frei-Regel fallen ZUGFeRD-Erzeugen
  (PDF-Lib), Lighthouse (kein Headless-Browser), lokales Tesseract-OCR (npm/wasm-Runtime) und Sage 5b–d
  (fremde Repos) als saubere Einzelsitzung aus → der **Privat-/Bürger-Modus** ist die passende fein
  geschnittene Scheibe (analog M1/B1: erst reine Logik, dann minimal verdrahtet).
- **Reine Logik zuerst (node-getestet, +30 → 972/972):** `src/domain/nutzungsmodus.js`
  - Nutzungskontext **`firma|privat|verein`** (Default `firma` → Bestand unverändert) NEBEN dem bestehenden
    UI-Komplexitäts-`mode` (einfach/profi/berater) — bewusst getrennte Achsen.
  - `normalizeNutzungsmodus`/`nutzungsmodusVon` + Prädikate (`istFirmenmodus`/`istPrivatmodus`/`istVereinsmodus`).
  - **NAV-Ansichten-Gating** `zeigeAnsicht`/`sichtbareAnsichten` (Allowlist-Komplement; Firma = alles, Privat
    blendet `anlagen/payables/orders/customers/employees/berichte/network` aus, Verein blendet
    `anlagen/payables/orders/employees` aus → mit Berichten/Mitgliedern/Netz). Unbekannte Keys bleiben
    sichtbar (sicher additiv).
  - **Fachliche Feature-Gates** `zeigeFeature` + `FEATURE`/`FEATURE_LISTE` (umsatzsteuer/rechnungen/mahnwesen/
    anlagen/mitarbeiter/kostenstellen/verbindlichkeiten/beraterExport) — Grundlage für P2.
- **UI/Glue (statisch geprüft, kein Headless-Browser):** `ui/shell.js` filtert die NAV über `zeigeAnsicht`;
  neuer Einstellungs-Schalter „Nutzungskontext" (paint → NAV neu filtern); Setting `nutzungsmodus` in
  `state.js`; i18n de+en. SW-Cache **v94** (+ `src/domain/nutzungsmodus.js` precached).

**Stand:** `node tests/run.mjs` **972/972 grün** (+30). R6/P1 ✅, gemergt (PR #99, CI #342/#343 grün, squash).

**Offen / Grenzen (ehrlich)**
- Gating ist eine **kuratierte Anzeige-Vereinfachung, KEINE rechtliche Sperre** — im Zweifel „Firma" (zeigt alles).
- Routing bleibt intakt; ausgeblendete Ansichten sind nur nicht in der NAV (kein toter Pfad).
- **Feature-Gates** (`zeigeFeature`) sind definiert + getestet, werden aber noch **nicht** ansichtsintern
  konsumiert (USt-Felder, Rechnungs-/Mahn-Knöpfe …) → das ist **P2**.
- UI/Glue (NAV-Filter, Settings-Schalter) statisch geprüft; reine Gating-Politik node-getestet.

**Nächstes:** R6/P2 (Feature-Gates in den Views lesen) **oder** R6-Rest (Lighthouse/Perf, lokales OCR
build-frei-sauber, Sage 5b–d) **oder** Browser-Sichttest — siehe `docs/NACHFOLGE_PLAN.md`.

---

## 2026-06-17 — R5c: Dreistufiger Briefkasten (Mandant ⊃ Firma ⊃ Person) [Branch `claude/r5c-three-level-mailbox-twzjko`]

**Was getan** (Schritt **R5c** — Pseudonymisierung/CRM in die fachliche Hierarchie ordnen)
- **Reine Logik zuerst (node-getestet, +26 Tests → 942/942):** `src/ai/briefkasten.js`
  - `baueBriefkasten({mandant, firma, kunden, mitarbeiter})` baut den dreistufigen Baum:
    **Mandant** (Tenant/Tresor) ⊃ **Firma** ⊃ **Person**. Die **eigene Firma** (Firmenprofil) wird
    `FIRMA_1` (`eigen: true`), **Mitarbeiter** werden deren Personen; **Firmenkunden**
    (`istVerbraucher !== true`) werden weitere `FIRMA_n` mit ihren E-Mail/USt-IdNr/Adresse-Ankern;
    **Privatkunden** (`istVerbraucher === true`) werden Personen direkt am Mandanten. Firmen-Nummer
    **deterministisch nach Daten-Reihenfolge** → Scope bleibt stabil, egal in welcher Reihenfolge die
    Namen im Belegtext stehen.
  - `briefkastenAnker(bk)` plättet den Baum in eine entdoppelte, **scope-präfixierte** `{wert,typ}`-Liste.
    Da nur die `typ`-Strings die Hierarchie tragen, erzeugt das **bestehende** `pseudonym.tokenize` daraus
    gruppierende Token (`[[MANDANT_1]]`, `[[FIRMA_2_1]]`, `[[FIRMA_2_USTID_1]]`, `[[FIRMA_1_PERSON_1]]`,
    `[[MANDANT_PERSON_1]]`) — die KI erkennt, wer zu wem gehört, bei **gleichem Schutz** und
    **verlustfreier Re-Identifizierung** (kein Umbau an tokenize/reidentify/maskierungsBericht).
  - `briefkastenBericht(bk)` (Transparenz: Zähler je Ebene, **ohne Klartext**), `tokenizeBriefkasten`.
- **Glue/UI (statisch geprüft):** `ai/anker.js ladeAnker` routet bei Setting **`briefkastenScopes`**
  (Default **aus**, opt-in) über den Briefkasten statt der flachen `baueAnker`-Liste und liest den aktiven
  Mandanten best-effort aus der unverschlüsselten Registry (`core/mandantenStore` + `domain/mandanten`).
  NER-Kombination (`nerPii`) bleibt davor wirksam. UI-Schalter im **Pseudonym-Modus** (`shell.js`,
  konditional wie `nerPii`), i18n de+en.
- SW-Cache **v93** (+ `src/ai/briefkasten.js` precached).

**Stand:** `node tests/run.mjs` **942/942 grün** (+26). **R5 vollständig (R5a/R5b/R5c) ✅.** A+B + R1–R5 ✅.

**Offen / Grenzen (ehrlich)**
- Person-Attribute (E-Mail/USt-IdNr/Adresse) werden dem **Parent-Scope** (Firma bzw. Mandant) zugeordnet,
  nicht dem einzelnen Personen-Token — die feinste Bindung „dieses Attribut gehört zu genau dieser Person"
  bleibt offen (Personen-Nummern vergibt tokenize erst nach Text-Auftreten).
- **NER-Anker bleiben flach** (im Briefkasten-Modus werden die Stammdaten hierarchisch, die im Text
  erkannten PII Dritter weiterhin als flache `EMAIL/IBAN/…`-Anker ergänzt).
- Setting **Default aus** → bestehendes Verhalten unverändert, bis der Nutzer den Briefkasten aktiviert.
- UI/Glue (anker/shell/Registry-Lesepfad) **statisch geprüft** (kein Headless-Browser); reine Logik node-getestet.

**Nächstes:** R6 [KANN] (ZUGFeRD-Erzeugen nur falls build-frei, Lighthouse, lokales OCR, Privat-/Bürger-Modus,
Sage 5b–d) **oder** Browser-Sichttest — siehe `docs/NACHFOLGE_PLAN.md`.

---

## 2026-06-17 — R5a (Bankformate härten) + R5b (NER/PII über die Anker hinaus)

**Was getan**
- **R5a — Bankformate härten** (`src/domain/bankimport.js`, rein/node-getestet):
  - **CAMT-Container .052 (`<Rpt>`) und .054 (`<Ntfctn>`)** zusätzlich zu .053 (`<Stmt>`);
    `erkenneBankformat` erkennt die neuen Wurzel-Tags/Namespaces.
  - **Saldo-Parsing:** MT940 `:60F/:60M:` (Anfang) + `:62F/:62M:` (Schluss), CAMT `<Bal>`
    (OPBD/PRCD ↔ CLBD/CLAV), signiert über C/D bzw. CdtDbtInd → `parseMT940`/`parseCAMT`
    liefern `saldoStartCent`/`saldoEndeCent`.
  - **`pruefeBankauszug(parsed)`:** rechnet (Anfang ± Umsätze) gegen den Schlusssaldo und meldet
    `saldo-differenz`/`unvollstaendige-umsaetze`/`format-unbekannt`/`keine-umsaetze`.
  - **Strukturierte RmtInf** (CAMT `CdtrRefInf`/`EndToEndId` → `umsatz.ref` + in den Verwendungszweck,
    hilft dem Zahlungsabgleich, die Rechnungsnummer zu treffen).
  - UI (`documents.js`): Bankimport zeigt die Prüf-Hinweise; i18n de+en; Karten-Texte auf .052/.053/.054.
- **R5b — NER (PII über die Anker hinaus)** (`src/ai/ner.js`, rein/node-getestet):
  - `erkennePII(text)` erkennt **konservativ** E-Mail, IBAN (kompakt + gruppiert), USt-IdNr (DE/AT),
    Steuernr (FF/BBB/UUUU), Telefon (intl `+49`/`0049` + national mit Trenner, **ohne Punkt** → keine
    Datums-/Betragstreffer); löst Überlappungen Longest-Match auf; **kein BIC** (kollidiert mit
    Großwörtern wie „RECHNUNG").
  - `piiAnker`/`kombiniereAnker` ergänzen die Stammdaten-Anker um im Text gefundene PII **Dritter**
    (exakte Anker behalten Typ-Vorrang via `normalizeAnchors`) → fließen vor dem KI-Versand in
    `pseudonym.tokenize`. Setting **`nerPii`** (Default an, nur im Pseudonym-Modus sichtbar);
    `anker.ladeAnker(text)` + Call-Sites (journal/documents) reichen den Text durch.
  - i18n de+en inkl. `pseudonym.typ.TELEFON` + Settings-Toggle in `shell.js`.
- SW-Cache **v92** (+ `src/ai/ner.js` precached). **+31 Tests → 916/916 grün.**

**Stand**
- R5 in Teil-PRs: **R5a ✅, R5b ✅**; **R5c (dreistufiger Briefkasten, P7) offen**. A+B + R1–R4 weiterhin ✅.

**Offen / Grenzen (ehrlich)**
- Bankimport: Plausibilitäts-/Integritätsprüfung, **KEINE** SWIFT-/ISO-20022-Schema-Validierung; reale
  Bank-Dialekte (Sub-Felder, Sonderzeichen) nur best-effort.
- NER bewusst konservativ → erkennt **keine** freien Personennamen/BIC (FP-Vermeidung); kann selten zu
  viel maskieren (datenschutz-sichere Richtung).
- UI/Glue (documents/journal/shell) **statisch geprüft** (kein Headless-Browser); reine Logik node-getestet.

**Nächstes:** R5c (dreistufiger Briefkasten) oder R6/Sichttest — siehe `docs/NACHFOLGE_PLAN.md`.

---

## 2026-06-17 — R4 Stufe 2: Rechnungs-Übernahme aus WorkFloh [Branch `claude/r4-workfloh-invoice-import-jc3yd7`, PR #95]

**Was getan** (Schritt **R4** — A4 Stufe 2: bereits gestellte Rechnung statt nur Auftrag übernehmen)
- **Reine Logik zuerst (node-getestet, +22 Tests):**
  - `domain/importworkfloh.js` — `normalizeImport` normalisiert je Auftrag einen optionalen
    `rechnung`-Block `{nummer, datum, leistungsdatum?}`. Unvollständig/ungültig → verworfen
    (Auftrag bleibt „angelegt") + Warnung. Nichts wird erfunden.
  - `domain/invoicing.js` — `rechnungsUebernahmeEntwurf(auftrag, rechnung)` baut den Buchungs-
    Entwurf (Forderung 1400 an Erlöse 8xxx + USt 177x) mit der **WorkFloh-Nummer/-Datum**
    (keine neue BLP-Rechnungsnummer); `validateRechnungsUebernahme` prüft Nummer + ISO-Datum.
  - `domain/connect.js` — `buildAustauschPaket` jetzt **Format-Version 2** (abwärtskompatibel):
    berechnete Aufträge (`rechnungNummer`/`rechnungDatum`) tragen ihren `rechnung`-Block reziprok mit.
- **Glue/UI (statisch geprüft):** `crm-store.importWorkFloh` erzeugt bei gültiger Rechnung direkt
  einen Buchungs-Entwurf (`saveEntwurf`), setzt den Auftrag auf „berechnet" (Festschreiben bleibt
  manuell, GoBD) und meldet `rechnungenUebernommen`. `ui/views/orders.js`-Import-Banner zeigt die
  Zahl übernommener Rechnungen; i18n de+en (`import.invoices`).
- SW-Cache **v91**; Doku `docs/WORKFLOH_IMPORT.md` + `docs/CONNECT.md`.

**Stand:** `node tests/run.mjs` **885/885 grün** (+22). CI grün, PR #95 squash-gemergt.

**Nächstes:** R5 (Bankformate härten CAMT .052/.054 / SWIFT-Validierung, NER über Anker hinaus,
dreistufiger Briefkasten) **oder** Browser-Sichttest (WorkFloh-Datei mit Rechnung importieren →
Buchungsentwurf prüfen; OCR→Verbindlichkeit-Klickpfad). Details: `docs/NACHFOLGE_PLAN.md` (R).

**Offene Grenzen (ehrlich):** UI/IndexedDB nicht headless E2E-getestet (kein Headless-Browser) —
nur statisch geprüft; reine Logik node-getestet. **API/Push** (Echtzeit) und Übernahme von
**Zahlungsstatus/Teilzahlungen** einer übernommenen Rechnung bewusst noch offen (heute nur die
offene Forderung; Zahlungsabgleich erfolgt in BLP über den Bankimport).

---

## 2026-06-17 — R3: Verbindlichkeiten aus Foto/PDF + eigene Ansicht + Zahlungsziel je Rechnung [Branch `claude/payables-photo-pdf-r3-80rs6p`]

**Was getan** (Schritt **R3** — A2-Rest „eigene Verbindlichkeiten-Ansicht" + R3 „Foto/PDF-Beleg → Verbindlichkeit" + A1-Rest „Zahlungsziel je Rechnung")
- **Reine Logik zuerst (`src/domain/payables.js`, node-getestet, +25 Tests):**
  - `extraktionZuEingangsrechnung(ex, opts)` → bildet aus einem **OCR-/Extraktions-Ergebnis**
    (`ai/extract.extractFromText` ODER `erechnungLesen.eingangsrechnungExtraktion`:
    `{betragBrutto, datum, ustSatz, vendor, confidence}`) einen **Eingangsrechnungs-ENTWURF**. Aus Brutto + USt-Satz
    wird das **Netto cent-genau** abgeleitet; ohne erkannten Satz konservativ **0 %** (keine Vorsteuer). Felder werden
    **nicht erfunden** — fehlt Kreditor/Datum/Betrag, greift die Validierung (Nutzer ergänzt). Kein `bruttoCent` →
    Positionen treiben den Betrag (Buchung = gespeicherter Brutto).
  - **Zahlungsziel je Rechnung (A1):** neues Feld `zahlungszielTage` auf der Eingangsrechnung; `berechneFaelligAm(rechnung,
    defaultZielTage)` (Reihenfolge: explizites `faelligAm` → Datum + rechnungseigenes Ziel → Datum + Default 30).
    `offeneVerbindlichkeiten` reicht `zahlungszielTage` in die Posten durch; `anreichereVerbindlichkeiten` nutzt das
    **Zahlungsziel je Rechnung** vor dem globalen Default (auch die Auswertungs-OP-Liste profitiert automatisch).
    `validateEingangsrechnung` prüft `zahlungszielTage` (ganzzahlig ≥ 0). Store (`payables-store.js`) persistiert das Feld.
- **UI (statisch geprüft, kein Headless-Browser):**
  - **Neue Ansicht „Verbindlichkeiten"** (`src/ui/views/payables.js`, Nav nach „Belege"): Liste mit Status/Fälligkeit/
    offen/brutto, Formular zum **manuellen Anlegen/Bearbeiten** (Kreditor, Rechnungsnr., Datum, **Zahlungsziel (Tage)**,
    Netto, USt-Satz, Aufwandskonto via Datalist), optional **„auf Ziel" buchen** (Entwurf), **Stornieren**, **Löschen**
    (nur ungebucht, GoBD). Festschreiben bleibt manuell.
  - **Foto/PDF-Beleg → Verbindlichkeit** (`ui/views/documents.js`): nach OCR (Google Vision EU) bietet die
    Beleg-Extraktion jetzt **zusätzlich** „Verbindlichkeit aus diesem Beleg erfassen" (neben dem direkten
    Buchungsvorschlag) → `extraktionZuEingangsrechnung` → „auf Ziel" gebucht, erscheint im Zahlungsabgleich.
  - i18n de+en (`pay.*`, `docs.payableFromOcr`, `nav.payables`), SW `v90` (+ `views/payables.js` precached).

**Stand:** `node tests/run.mjs` **863/863 grün** (+25). Reine Logik node-getestet (Extraktion→Entwurf inkl. Netto-Ableitung/
0-%-Fallback/fehlende Felder, Zahlungsziel je Rechnung in `berechneFaelligAm`/OP-Liste/Validierung). UI/Glue statisch geprüft.

**Offen/Nächstes:** R-Abschnitt (Forderungs-/Verbindlichkeits-Soll) damit weitgehend rund. Nächster sinnvoller Schritt:
**Sichttest des OCR→Verbindlichkeit-Klickpfads** im Browser (Vision EU) + ggf. Phase-4-Rest (echte EÜR-Zufluss/-Abfluss,
PDF-Rechnung aus Auftrag) oder Sage 5b. **Grenze (ehrlich):** OCR-Extraktion ist best-effort (Heuristik) — Lieferant/Datum
werden bei Lücken mit Platzhalter/heute vorbelegt und sind in der Verbindlichkeiten-Ansicht nachzuarbeiten; Klickpfad nicht
headless E2E getestet.

---

## 2026-06-17 — R2b: Sammelzahlungen (eine Bankzahlung auf mehrere Rechnungen) [Branch `claude/batch-payments-r2b-mcmdwg`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **R2b** — A3-Rest, schließt das Zahlungsabgleich-Soll „Sammelzahlung" ab)
- **Reine Logik zuerst (`src/domain/zahlungsabgleich.js`, node-getestet, +22 Tests):**
  - `findeSammelzuordnung(umsatz, posten, opts)` → schlägt **Kombinationen** gleichgerichteter offener Posten vor,
    deren Summe der Zahlung **± Toleranz** (Rundungs-Cent) entspricht. **Tiefen-/Kandidatenbeschränkung**
    (`maxTeile=4`, `maxKandidaten=12`, Überschuss-Pruning) verhindert kombinatorische Explosion; **mindestens zwei
    Posten** je Kombination (Einzeltreffer deckt `findeKandidaten` ab). Score: exakte Summe + Referenz/Name im
    Verwendungszweck + Datumsnähe; weniger Teile bevorzugt → die UI nutzt das als **Score-Schwelle** und lässt den
    Nutzer **explizit** bestätigen.
  - `verteileSammelzahlung(zahlungCent, postenListe)` → verteilt den Zahlbetrag **der Reihe nach** auf die explizit
    gewählten Posten: jeder erhält `min(Restzahlung, offen)`, der letzte kann **teilbezahlt** werden (Rest bleibt
    offen). Übersteigt die Zahlung die Summe, bleibt der Überschuss `unverteiltCent` (UI warnt — keine erzwungene
    Überzahlung).
  - `sammelBuchungZeilen(umsatz, zuordnung, opts)` → **eine Zeile je Rechnung**: Einnahme = Soll Bank (Summe) /
    je Posten Haben Forderung; Ausgabe = je Posten Soll Verbindlichkeit / Haben Bank. Ausgeglichen (S = H).
- **UI (statisch geprüft, kein Headless-Browser):** Knopf **„◫ Sammelzahlung (mehrere Rechnungen)"** im Bankimport
  (`ui/views/documents.js`), wenn eine Kombination gefunden wird → **Auswahl-Panel** mit Checkboxen je offenem Posten
  (Vorschlag vorausgewählt), **laufende Summe** vs. Zahlbetrag mit Status (passt/über/unter), „Sammelzahlung verbuchen"
  → `verteileSammelzahlung` + `sammelBuchungZeilen` → **ein** `saveEntwurf` (manuell, **kein Auto-Festschreiben**, GoBD)
  + je Posten den zugeordneten (Teil-)Betrag als Zahlung erfasst. i18n de+en (`docs.bankSammel*`), CSS `.sammel-*`,
  SW `v89` (Logik im bereits precachten `zahlungsabgleich.js`, kein neues Modul).

**Stand:** `node tests/run.mjs` **838/838 grün** (+22). Reine Sammel-Logik node-getestet (Subset-Summe exakt/Toleranz/
≥2-Teile/Richtung/Ranking/Drei-Posten, Verteilung voll/Restbildung/Überzahlung, Buchungszeilen S=H je Richtung, leere
Fälle → null). UI/Glue statisch geprüft.

**Offen/Nächstes:** **R3** — Verbindlichkeiten aus **Foto/PDF-Belegen** + eigene Verbindlichkeiten-Ansicht (A2-Rest);
Zahlungsziel je Rechnung (A1-Rest). **Grenze (ehrlich):** Subset-Summe ist heuristisch (max. 4 Teile, 12 Kandidaten) —
sehr viele Klein-Posten mit identischen Beträgen könnten mehrdeutige Kombinationen liefern; deshalb **explizite
Nutzerauswahl** statt Auto-Buchung. Klickpfad nicht headless E2E getestet.

---

## 2026-06-17 — R2a: Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) [Branch `claude/r2-skonto-ust-korrektur-iwybxg`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **R2a** — A3-Rest, „R2" feiner geschnitten in R2a Skonto / R2b Sammelzahlung)
- **Reine Logik zuerst (`src/domain/skonto.js`, node-getestet):**
  - `SKONTO_KONTEN` — SKR03: gewährte Skonti **8730/8731/8736** (Erlösschmälerung Verkauf), erhaltene Skonti
    **3730/3731/3736** (Aufwandsminderung Einkauf), USt-Korrektur **1776/1771**, Vorsteuer-Korrektur **1576/1571**.
  - `skontoSplit(brutto, ustProzent)` → zerlegt einen Bruttobetrag in Netto + USt je Satz.
  - `skontoBuchungZeilen({richtung, offenCent, zahlungCent, ustProzent|saetze, konten?})` → gleicht den offenen
    Posten **komplett** aus: **Einnahme** (Forderung, Skonto gewährt) = Soll Bank + Soll gewährte Skonti (netto)
    + Soll USt (Korrektur) / Haben Forderung; **Ausgabe** (Verbindlichkeit, Skonto erhalten) = Soll Verbindlichkeit /
    Haben Bank + Haben erhaltene Skonti (netto) + Haben Vorsteuer (Korrektur). **Gemischte USt-Sätze** werden
    **proportional** je Brutto-Anteil aufgeteilt (größter-Rest-Methode, kein Cent-Verlust). Guards: kein Abzug /
    Überzahlung / keine Zahlung → `null`.
  - `skontoEntwurf(...)` → vollständiger Buchungs-**Entwurf** (Datum/Beschreibung/§17-Begründung) inkl. Skonto-Meta.
- **§17 UStG (ehrlich):** Zahlt der Kunde mit Skonto, mindert sich das Entgelt → beim **Ausgangsumsatz** sinkt die
  geschuldete **USt**, beim **Eingangsumsatz** die abziehbare **Vorsteuer** (§17 Abs. 1 UStG). Buchung gleicht den
  Posten exakt aus (Bank + Skonto-Netto + USt-/Vorsteuer-Korrektur = offener Brutto).
- **Posten-Anreicherung:** `zahlungsabgleich.offenePosten` (Forderungen) + `payables.offeneVerbindlichkeiten`
  (Kreditoren) tragen jetzt `saetze` = Brutto-Anteile je USt-Satz (aus `auftragSummen`/`eingangsrechnungSummen`).
- **UI (statisch geprüft, kein Headless-Browser):** Der bisherige Skonto-**Hinweis** im Bankimport
  (`ui/views/documents.js`) wird zum Knopf **„Skonto buchen (§17 UStG)"** → `skontoEntwurf` → `saveEntwurf`
  (manuell, **kein Auto-Festschreiben** — GoBD) und markiert den Posten als ausgeglichen. Teilzahlung bleibt davon
  getrennt (nur gezahlter Betrag, Rest offen). i18n de+en (`bankSkonto` neu betextet, `bankSkontoDone`/`bankSkontoUst`).
  SW `v88`, neues Modul precacht.

**Stand:** `node tests/run.mjs` **816/816 grün** (+33). Reine Skonto-Logik node-getestet (Split, Einnahme/Ausgabe
einzelner Satz, gemischte Sätze proportional, Ausgeglichenheit S=H, Guards, Entwurf-Begründung §17, Seed-Konten,
Integration mit `offenePosten.saetze`). UI/Glue statisch geprüft.

**Offen/Nächstes:** **R2b** — Sammelzahlungen (eine Bankzahlung auf mehrere offene Rechnungen → Mehrfach-Zuordnung
in der UI). **Grenze (ehrlich):** Skonto-Entwurf wird nicht auto-festgeschrieben; Klickpfad nicht headless E2E
getestet; bei gemischten Rechnungen wird der Skonto proportional je Brutto-Anteil je Satz verteilt (kaufmännisch
üblich) — exakte Rechnungsaufteilung im Zweifel mit Berater prüfen.

---

## 2026-06-17 — R1: Verzugszinsen/Mahngebühren buchen [Branch `claude/r1-delayed-interest-dunning-ckk0bb`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **R1** — A1-Rest, schließt das Mahnwesen-Soll „Buchung" ab)
- **Reine Logik zuerst (`src/domain/mahnwesen.js`, node-getestet):**
  - `MAHN_KONTEN` — SKR03-Kontenzuordnung: Forderungen **1400** (Soll) an Zinserträge **2650** /
    sonstige betriebliche Erträge **2700** (Haben).
  - `mahnbuchungZeilen({zinsenCent, gebuehrenCent, konten?})` → ausgeglichene Buchungszeilen
    (Soll Forderung an Haben Zinsertrag + Gebührenertrag), **ohne USt-Zeile**, mit Summe;
    nur Zinsen ODER nur Gebühren → 2 Zeilen; 0/0 → keine Zeilen.
  - `mahnbuchungEntwurf(...)` → vollständiger Buchungs-**Entwurf** (Datum/Beschreibung/Begründung)
    aus den `mahnschreibenDaten`; gibt `null` zurück, wenn nichts anfällt.
- **USt-Behandlung (ehrlich dokumentiert):** Verzugszinsen UND Mahngebühren sind nach h. M.
  (Abschn. 1.3 UStAE) **nicht steuerbarer echter Schadensersatz** → **keine Umsatzsteuer**; die
  Forderung gegen den Schuldner erhöht sich um den Betrag. Begründungstext + Hinweis „im Zweifel Berater".
- **UI (statisch geprüft, kein Headless-Browser):** Knopf **„Als Buchungsentwurf übernehmen"** im
  Mahnschreiben (`ui/views/reports.js zeigeMahnung`) nutzt die editierbaren Zinsen/Gebühren-Felder →
  `saveEntwurf` (manuell, **kein Auto-Festschreiben** — GoBD); `ensureSeedKonten` stellt 1400/2650/2700
  sicher. i18n de+en (`mahnBook`/`mahnBooked`/`mahnBookNone`, `mahnBookHint` aktualisiert). SW `v87`.

**Stand:** `node tests/run.mjs` **783/783 grün** (+23). Reine Buchungslogik node-getestet (Ausgeglichenheit,
keine USt-Zeile, Konto-Override, Entwurf aus §288-Mahnschreiben, `validateBuchung` leer). UI/Glue statisch geprüft.

**Offen/Nächstes:** **R2** — Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) + Sammelzahlungen
(eine Zahlung, mehrere Rechnungen). **Grenze (ehrlich):** USt-Freiheit gilt für echten Schadensersatz;
vertraglich vereinbarte Bearbeitungsgebühren können abweichen → Berater. Klickpfad nicht headless E2E getestet.

---

## 2026-06-17 — B3: Bilanzierung — Bilanz (Aktiva = Passiva) [Branch `claude/balance-sheet-b3-56djmn`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B3** — Abschnitt B Bilanzierung, schließt Abschnitt B ab)
- **Reine Logik zuerst (`src/domain/bilanz.js`, node-getestet):** `bilanz(buchungen, idx, stichtag, eröffnungssalden)`
  saldiert die **Bestandskonten** (Aktiv/Passiv) aus den **festgeschriebenen** Buchungen bis einschließlich Stichtag
  (`taxes.kontoBewegungen({bis: stichtag})`, Bestand kumulativ → kein `von`), Salden über die Mehrungsseite
  (`accounts.saldo`/`mehrungsSeite`), gegliedert nach `bilanzSeite` (B1) in **Aktiva**/**Passiva** (je {nummer,name,wert},
  nach Nummer sortiert, Null-Salden raus). Der **Jahresüberschuss/-fehlbetrag** der Erfolgskonten (Σ Erträge − Σ
  Aufwendungen über denselben Zeitraum) fließt als **Ergebnis ins Eigenkapital (Passiva)** → Grundgleichung
  **Aktiva = Passiva (inkl. Ergebnis)** mit `summePassivaMitErgebnis`, `bilanzsumme`, `differenz`, `ausgeglichen`.
  **Eröffnungssalden** via gebuchtem Saldenvortrag (Konto 9000) ODER über den Parameter `eröffnungssalden`
  (Kontonummer→Cent, Mehrungsseite-positiv; ausgeglichene Eröffnungsbilanz vorausgesetzt). Entwürfe (`seq==null`)
  zählen nicht.
- **`domain/export.js`:** `buildBilanzCsv(bilanz)` (Spalten Seite/Konto/Bezeichnung/Betrag, Stichtag-Kopf, Summe
  Aktiva, Passiva-Posten + Ergebnis, Summe Passiva inkl. Ergebnis, bei Unausgeglichenheit Differenz-Zeile).
- **UI (`ui/views/reports.js`, statisch geprüft):** **Bilanz-Karte** in „Auswertung" neben der GuV-Karte — **nur im
  Bilanz-Modus** (`istBilanzierung(getSettings())` gatet, B1-Schalter `gewinnermittlung`), Stichtag = Perioden-`bis`,
  Aktiva-/Passiva-Listen, Ergebnis-Posten, Ausgeglichen-Status (✓ oder Differenz), CSV-Export-Knopf + Druck.
- **i18n** (de+en) `reports.bilanz*`. **SW-Cache `v86`** (`bilanz.js`/`bilanzierung.js` bereits precached).
- **Tests 760/760** grün (+21 neue: Summengleichheit, Ergebnis ins EK, Eröffnungssalden (gebucht + reiner Bestand),
  Stichtag-Eingrenzung, greenfield-Ausgleich, unausgeglichene Eröffnungsbilanz → `ausgeglichen=false`/`differenz`,
  Erfolgskonten-Ausschluss, Entwurf-Ausschluss, CSV inkl. Differenz-Zeile).

**Stand:** B3 vollständig → **Abschnitt B (Bilanzierung) abgeschlossen** (B1+B2+B3). Reine Logik node-getestet
(760/760); UI/Glue (Bilanz-Karte, Modus-Gate über IndexedDB-Settings) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **R1 — Verzugszinsen/Mahngebühren buchen** (A1-Rest): Konto-Mapping + USt-Behandlung
(manuell, kein Auto-Buchen). Danach R2…R6 nach Bedarf (siehe NACHFOLGE_PLAN.md Abschnitt R).
**Grenze (ehrlich):** Bilanz im **Konten-Sinn** (Salden je Konto), **KEINE** amtliche §266-HGB-Gliederung, **kein**
Konzernabschluss, **keine** E-Bilanz-Taxonomie. Konten werden nach **Kontoart** zugeordnet, **nicht** nach
Saldovorzeichen umgegliedert (ein Bankkonto im Haben-Saldo bleibt negativ auf der Aktivseite). Eine separate
**Eröffnungsbilanz-Eingabemaske** gibt es noch nicht — Eröffnungssalden kommen aus gebuchten Saldenvorträgen (9000).

---

## 2026-06-17 — B2: Bilanzierung — GuV (Gewinn- und Verlustrechnung) [Branch `claude/bookledgerpro-b2-guv-n3r6or`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B2** — Abschnitt B Bilanzierung)
- **Reine Logik zuerst (`src/domain/bilanz.js`, NEU, node-getestet):** `gewinnUndVerlust(buchungen, idx, periode)`
  aggregiert die **Erfolgskonten** (Aufwand/Ertrag) aus den **festgeschriebenen** Buchungen je Periode
  (`taxes.kontoBewegungen`), bildet die Salden über die Mehrungsseite (`accounts.saldo`/`mehrungsSeite`),
  gliedert nach `guvSeite` (B1, `domain/bilanzierung.js`) in **Erträge**/**Aufwendungen** (je {nummer,name,wert},
  nach Nummer sortiert, Null-Salden raus), Summen, **Jahresüberschuss/-fehlbetrag = Σ Erträge − Σ Aufwendungen**.
  Bestands-/Steuerkonten (Bank, USt, VSt) bleiben außen vor; Entwürfe (`seq==null`) zählen nicht.
- **`domain/export.js`:** `buildGuvCsv(guv)` (Spalten Art/Konto/Bezeichnung/Betrag, Summen + Jahresüberschuss/
  -fehlbetrag je nach Vorzeichen).
- **UI (`ui/views/reports.js`, statisch geprüft):** GuV-Karte in „Auswertung" — **nur im Bilanz-Modus**
  sichtbar (`istBilanzierung(getSettings())` gatet die Ansicht, B1-Schalter `gewinnermittlung`), respektiert
  den Perioden-Filter, mit CSV-Export-Knopf + Druck.
- **i18n** (de+en) `reports.guv*`. **SW-Cache `v85`** + `bilanz.js` precached.
- **Tests 739/739** grün (+13 neue: Summen/Gliederung, Periodengrenze, Bestandskonten-Ausschluss, Entwurf-Ausschluss,
  CSV Überschuss/Fehlbetrag).

**Stand:** B2 vollständig. Reine Logik node-getestet (739/739); UI/Glue (GuV-Karte, Modus-Gate über
IndexedDB-Settings) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B3 — Bilanz.** `bilanz(buchungen, idx, stichtag, eröffnungssalden)` → Aktiva/Passiva aus den
Bestandskonten-Salden, Summengleichheit (Aktiva = Passiva), Eröffnungs-/Schlussbilanzkonto; Ansicht + CSV.
EHRLICH: keine Konzernabschlüsse/E-Bilanz-Taxonomie.

---

## 2026-06-17 — B1: Bilanzierung Modus + Kontengrundlage [Branch `claude/bilanzierung-b1-setup-4cx6s3`] (PR #87, gemergt)

**Was getan** (NACHFOLGE_PLAN.md, Schritt **B1** — startet Abschnitt B Bilanzierung)
- **Reine Logik zuerst (`src/domain/bilanzierung.js`, node-getestet):** Gewinnermittlungsart
  `GEWINNERMITTLUNG` (`euer` | `bilanz`) + `GEWINNERMITTLUNG_LISTE`, `istGewinnermittlung`,
  `normalizeGewinnermittlung` (Fallback EÜR), `istBilanzierung(settings)`. **Konten-Klassifikation**
  als Grundlage für B2/B3: `istBestandskonto`/`istErfolgskonto`, `abschlussBereich` (+`BEREICH`),
  `bilanzSeite` (aktiva/passiva), `guvSeite` (aufwand/ertrag), `klassifiziereKonto`. Konstante
  `BILANZ_GRUNDKONTO_NUMMERN`.
- **`accounts.js`:** Bilanz-Grundkonten **0800** (Gezeichnetes Kapital), **0840** (Kapitalrücklage),
  **0860** (Gewinn-/Verlustvortrag), **0970** (Sonstige Rückstellungen) in den SKR03-Seed ergänzt.
  **Saldenvortrag/Eröffnung 9000** war bereits vorhanden (geprüft).
- **`state.js`:** Setting `gewinnermittlung` mit **Default `'euer'`** → **Bestandsnutzer unverändert**.
- **`shell.js`:** Modus-Schalter „Gewinnermittlung" in den Einstellungen; Wechsel auf **Bilanz**
  zieht die Grundkonten in älteren Tresoren via `ensureSeedKonten` nach (neue Tresore haben sie im Seed).
- **i18n** (de+en) `settings.gewinn*`. **SW-Cache `v84`** + `bilanzierung.js` precached.
- **Tests 726/726** grün (+27 neue: Modus-Logik, Konten-Klassifikation, Seed-Grundkonten).

**Stand:** B1 vollständig + gemergt. Reine Logik node-getestet; UI/Glue (Settings-Schalter,
`ensureSeedKonten` über IndexedDB) **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B2 — GuV.** `domain/bilanz.js` (rein, node-getestet):
`gewinnUndVerlust(buchungen, idx, periode)` → Erträge/Aufwendungen gegliedert, Jahresüberschuss;
Ansicht + CSV. Dann B3 (Bilanz).
**Grenze (ehrlich):** Der Modus-Schalter setzt aktuell **nur Modus + Kontengrundlage** und ändert
**noch keine Berichte** — GuV/Bilanz folgen in B2/B3. **Keine** Konzernabschlüsse, **keine** E-Bilanz-Taxonomie.

---

## 2026-06-17 — M3: Shell-Mandanten-Indikator + Verwaltung [Branch `claude/m3-shell-tenant-mgmt-d13v6s`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **M3** — schließt Abschnitt A Mehrmandanten ab)
- **`ui/shell.js` Header:** zeigt jetzt den **aktiven Mandanten-Namen** (aus der Registry via
  `ladeRegistry`/`aktiverMandant`, async nachgeladen in `refreshMandant`, Fallback `getMandantId()`)
  statt der DB-ID. **„Mandant wechseln"**-Knopf (nur bei >1 Mandant): `lockVault()` + Reboot →
  der Boot zeigt die Auswahl (showLockScreen).
- **Einstellungen „Mandanten verwalten"** (`mandantenSection`/`mandantRow`): pro Mandant
  **umbenennen** (`validateMandantName` → `umbenenneMandant` → `speichereRegistry`, Header zieht
  bei aktivem Mandanten via `refreshMandant` mit) und **entfernen** (`entferneMandant` →
  `speichereRegistry`, **nur mit `confirm`**; Tresor-DB bleibt erhalten — kein Datenverlust).
  Der **aktuell geöffnete** Mandant ist nicht entfernbar (Button disabled + Hinweis).
- **i18n** (de+en): `mandant.current/confirmRemove/removeActiveHint`, `settings.mandanten(+Hint)`.
  **CSS** `.mandant-admin(-row)`. **SW-Cache `v83`** (Module bereits precached). Doku **`docs/MANDANTEN.md`** neu.
- **Tests 699/699** unverändert grün — reine Registry-Logik (`umbenenneMandant`/`entferneMandant`/
  `mandantenAuswahlListe`/`aktiverMandant`) war schon node-getestet; M3 ist reiner Glue/UI.

**Stand:** M3 vollständig → **Abschnitt A (Mehrmandantenfähigkeit) abgeschlossen** (M1✅ M2a✅ M2b✅ M3✅).
Reine Logik node-getestet; die neuen DOM-/IndexedDB-Pfade (Header-Nachladen, Verwaltungs-Sektion)
sind **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **B1 — Bilanzierung Modus + Kontengrundlage** (Setting `gewinnermittlung:'euer'|'bilanz'`,
Default `euer`, Bilanz-Grundkonten/Saldenvortrag, minimale UI; reine Klassifikation node-getestet).
**Grenze:** „Entfernen" = aus der Liste nehmen, kein Löschen + keine Re-Import-UI für eine entfernte,
aber vorhandene Tresor-DB (in `docs/MANDANTEN.md` als Grenze dokumentiert).

---

## 2026-06-17 — M2b: Sperrbildschirm Mandanten-Auswahl/-Anlage/-Wechsel [Branch `claude/lock-screen-tenant-selection-9uhoh8`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt **M2b** — Sperrbildschirm-UI, nutzt fertige M2a-Core)
- **Reine Logik zuerst (`domain/mandanten.js`, node-getestet):** `brauchtMandantenAuswahl(registry)`
  (Auswahl erst ab **>1** Mandant → verhaltensneutral für Bestandsnutzer) + `mandantenAuswahlListe(registry)`
  (stabil sortiert: ältester zuerst, Name als Tiebreak; aktiv markiert; immutabel).
- **`ui/lock.js`:** `showLockScreen` lädt die Registry und zeigt bei >1 Mandant **`renderMandantenAuswahl`**
  (Liste + „+ Neuer Mandant" + DSGVO-Hinweis). Auswahl → `wechsleAktivenMandant(id)` (DEK verwerfen +
  DB-Wechsel gekapselt) → entsperren. **`renderNeuerMandant`**: Name → `registriereMandant` →
  `wechsleAktivenMandant` → Onboarding (eigenes Passwort/Shamir/Backup) in der neuen, leeren Tresor-DB.
  Bei genau 1 Mandant direktes Entsperren + diskreter „+ Neuer Mandant"-Link (Bootstrap bis M3).
  `renderOnboarding` zeigt optional, für welchen Mandanten der Tresor eingerichtet wird.
- **i18n** (de+en) `mandant.*`-Keys inkl. DSGVO-Hinweis (Namen unverschlüsselt). **CSS** `.mandant-list/
  -item/-badge`, `.btn-link`. **SW-Cache `v82`** (betroffene Module waren bereits precached).
- **Tests 699/699** (+10: `brauchtMandantenAuswahl`-Schwelle, Sortierung/Tiebreak/aktiv-Markierung,
  Immutabilität, null-Sicherheit). `node tests/run.mjs` grün.

**Stand:** M2b vollständig. Reine Entscheid-/Sortierlogik node-getestet; die DOM-/IndexedDB-Pfade
(`lock.js`, Tresor-Umschaltung) sind **statisch geprüft** (kein Headless-Browser hier).
**Offen/Nächstes:** **M3** — Shell-Indikator: aktiver Mandant (Name aus Registry) im Header sichtbar,
„Mandant wechseln" + Verwaltung (umbenennen/entfernen, Bestätigung) in Einstellungen, Doku `docs/MANDANTEN.md`.
**Grenze:** Der 1→2-Bootstrap geht aktuell nur über den Lock-Link; der reguläre Shell-Trigger kommt in M3.

---

## 2026-06-17 — M2a: Mehrmandanten Core-Verdrahtung [Branch `claude/m2a-mandanten-core`]

**Was getan** (NACHFOLGE_PLAN.md, M2 gesplittet → **M2a** = Core, M2b = UI)
- **`core/db.js`:** aktive Tresor-DB ist jetzt **konfigurierbar** — `getActiveDbName`,
  `setActiveDbName` (mit Suffix-Schutz/No-op-Logik), `closeDb` (Verbindung schließen +
  Cache verwerfen), Export `LEGACY_DB_NAME`. Default bleibt der Legacy-Tresor → **kein
  Verhalten ändert sich**, solange nur ein Mandant existiert. `openDb` öffnet die aktive DB.
- **Neu `core/mandantenStore.js`:** unverschlüsselte Registry-DB `blpr_mandanten_bookledgerpro`
  (getrennt von Tresor-DBs, muss vor dem Entsperren lesbar sein). `ladeRegistry`/
  `speichereRegistry`; **`initMandanten`** (Boot: Alt-Tresor migrationsfrei als „Mandant 1"/
  ID `standard` registrieren, aktive DB ausrichten); `registriereMandant`; **`wechsleAktivenMandant`**
  (verwirft DEK via `lockVault`, schließt DB, richtet Ziel-DB aus, persistiert).
- **`mandanten.js`:** `REGISTRY_DB_NAME` ergänzt. **`main.js`:** Boot ruft `initMandanten()`
  vor dem Sperrbildschirm.
- **Tests 689/689** (+9: Registry-DB-Name/Suffix, aktive-DB-Umschaltung inkl. Suffix-Schutz/
  No-op). `node tests/run.mjs` grün. **SW-Cache `v81`**, neues Modul precached.

**Stand:** M2a vollständig (Core node-getestet/verhaltensneutral verdrahtet). IndexedDB-Glue
in `mandantenStore.js` statisch geprüft (kein Headless-Browser).
**Offen/Nächstes:** **M2b** — Sperrbildschirm-UI: bei >1 Mandant Auswahlliste, „Neuer Mandant"
(Onboarding in eigener DB), Wechsel über `wechsleAktivenMandant`; DSGVO-Hinweis (Namen
unverschlüsselt). Core dafür ist fertig nutzbar.

---

## 2026-06-17 — M1: Mehrmandanten-Fundament (reine Schicht) [Branch `claude/m1-mehrmandanten-fundament-0k6qiu`]

**Was getan** (NACHFOLGE_PLAN.md, Schritt M1 — „Fundament rein + Design")
- **Neues `src/domain/mandanten.js` (rein, kein IndexedDB-Zugriff):** Registry-Datenmodell
  `{mandanten:[{id,name,erstellt}], aktiv}` mit immutablen Operationen `addMandant`,
  `umbenenneMandant`, `entferneMandant`, `setzeAktiv`, `findeMandant`, `aktiverMandant`;
  `erstelleMandant`/`validateMandantName`/`neueMandantId`.
- **Speicher-Namensbildung `dbNameFuer(id)`:** Legacy/Default (ID `standard` oder leer) →
  unveränderter Bestandsname `blpr_bookledgerpro` (**migrationsfrei**); weitere Mandanten →
  `blpr_<id>_bookledgerpro`. **Suffix `bookledgerpro` bleibt** (Regel #3, keine Origin-Kollision).
- **`mitLegacyMandant`:** migrationsfreier Seed — leere Registry → Bestand als „Mandant 1"
  (ID `standard`) aktiv; vorhandene Registries bleiben unangetastet.
- **Design-Abschnitt** in `NACHFOLGE_PLAN.md` (Abschnitt A) ergänzt: 1 Mandant = 1 getrennter
  Tresor, unverschlüsselte Registry-DB für Sperrbildschirm-Auswahl, DEK-Verwerfen beim Wechsel.
- **Tests 680/680** (29 neu: Namensbildung inkl. Suffix/Legacy/ungültige ID, ID-/Namensprüfung,
  Registry-Ops immutabel, Legacy-Seed). `node tests/run.mjs` grün. **SW-Cache `v80`**, Modul precached.

**Stand:** M1 vollständig (reine Logik node-getestet; **keine** Tresor-Umverdrahtung — bewusst M2).
**Offen/Nächstes:** **M2** — Tresor je Mandant + Auswahl am Sperrbildschirm (`lock.js`/`vault.js`/
`core/db.js` DB-Namen konfigurierbar machen, Bestand als „Mandant 1" registrieren, Wechsel mit
sauberem DEK-Verwerfen). Design-Abschnitt in `NACHFOLGE_PLAN.md` ist verbindlich.

---

## 2026-06-16 — V2: §13b/Reverse-Charge + EU/Ausland (USt) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V2, „weiter laut PULS")
- **`baueReverseChargeZeilen` (journal.js)** + `UMSATZART`: Steuerschuldumkehr (§13b UStG /
  innergem. Erwerb) bucht **gleichzeitig** abziehbare Vorsteuer (Soll) und geschuldete USt
  (Haben); an den Lieferanten fließt nur der **Netto**-Betrag. Option „nicht abziehbar" →
  USt wird Kostenbestandteil. Buchung ist immer ausgeglichen.
- **Konten (accounts.js):** 1577/1787 (§13b VSt/USt), 1574/1772 (ig Erwerb VSt/USt),
  8125/8120 (steuerfreie ig Lieferung / Ausfuhr) mit neuen `rolle`-Markern; Map
  `REVERSE_CHARGE_KONTEN` + `STEUERFREI_ERLOES_KONTEN`. `store.ensureSeedKonten` zieht die
  Konten in älteren Tresoren nach.
- **USt-VA (export.js `buildUstVa`):** neue Kennzahlen **Kz 46/47/67** (§13b),
  **Kz 89/93/61** (ig Erwerb), **Kz 41/43** (steuerfrei); BMG aus Steuer/Satz; Kz 83
  inkl. RC (geschuldete USt erhöht, Vorsteuer mindert → hebt sich bei vollem Abzug auf).
  `ustVaToCsv` + Auswertungs-Karte zeigen die Kennzahlen (nur wenn ≠ 0).
- **UI:** Umsatzart-Auswahl (Inland / §13b / innergem. Erwerb) im Journal-Formular; bei
  Reverse-Charge gilt der Betrag als Netto. i18n de/en. SW-Cache `v64`.
- **Tests 472/472** (28 neu: Buchungszeilen, Ausgleich, USt-VA-Kennzahlen, Zahllast-
  Neutralisierung, §13b-only → Kz83=0, CSV).

**Stand:** V2 vollständig (Logik node-getestet, UI statisch geprüft — nicht headless-E2E).
**Offen/Ehrlich:** §13b modelliert für 19 % (Hauptfall Cloud/Software); exakte Kennzahl-
Zuordnung am amtlichen ELSTER-Formular/mit Berater zu verifizieren; E-Rechnungs-Empfang
erkennt die Umsatzart noch nicht automatisch (manuelle Wahl). **Nächstes:** V3 (Anlagevermögen
+ AfA + Anlagenverzeichnis), `docs/OFFENE_PUNKTE.md` Abschnitt V.

> Hinweis: Branch `claude/v2-ox8bu7` war zunächst auf veraltetem `main` (PR #63 Ist-EÜR);
> Ist-EÜR existierte bereits in `main` → #63 geschlossen, Branch auf `main` zurückgesetzt,
> V2 korrekt umgesetzt.

---

## 2026-06-17 — Nachfolge-Brief: Mehr-Sitzungs-Plan (je 1 PR/Sitzung) [Branch `claude/v2-ox8bu7`]

**Was getan** (reine Doku/Planung, kein Code — auf Nutzerwunsch)
- **`docs/NACHFOLGE_PLAN.md`** neu: geordneter Mehr-Sitzungs-Plan mit **Sitzungs-Ritual**
  (genau 1 PR pro Sitzung, sauber/fehlerfrei vor schnell, Abschlussbrief am Ende jeder Sitzung →
  konfliktfreier Start der nächsten). Reihenfolge: **A) Mehrmandanten M1→M2→M3** (Architektur
  „mehrere getrennte Tresore", DB-Suffix unverändert), **B) Bilanzierung B1→B2→B3** (GuV+Bilanz),
  **R) Rest-SOLL R1…R6**. Jeder Schritt mit konkretem Scope + Splitting-Hinweis.
- **`docs/PULS.md` „START HIER"** neu geschrieben: verweist auf den Plan, **nächste PR = M1**,
  Freibrief + Ritual ausdrücklich übergeben; veraltete/doppelte Blöcke entfernt.
- Tests **651/651** (unverändert; Doku-only). SW bleibt `v79`.

**Stand:** Plan steht. **Nächste Sitzung:** **M1** (Mehrmandanten-Fundament) — siehe NACHFOLGE_PLAN.md.

---

## 2026-06-17 — Punkt 7/A4: Offene Anbindung an andere Buchhaltungssoftware (Stufe 1) [Branch `claude/v2-ox8bu7`]

**Was getan** (A4 erweitert: WorkFloh public + generischer Konnektor)
- **`domain/connect.js`** (rein, node-getestet): versioniertes, offenes **Austauschformat**
  (`bookledgerpro-austausch` v1) — `buildAustauschPaket` (Export BLP→offen), `parseAustauschPaket`
  (Import, **abwärtskompatibel** zum bare WorkFloh-`{kunden,auftraege}`, lehnt Fremdformate ab).
- **Aufträge-Ansicht:** Import läuft jetzt über `parseAustauschPaket`→`normalizeImport` (akzeptiert
  beide Formate) + neuer **„Austausch-Datei exportieren"**-Knopf (Kunden+Aufträge offen herausgeben).
- **Einstellungen:** „Verbundene App"-URL (reziproke Verlinkung zu WorkFloh/anderer Software) + Öffnen-Link.
- **`docs/CONNECT.md`**: Format-Spezifikation + „so bindet andere Software an". i18n de/en. SW `v79`.
- Tests **651/651** (7 neu: Export-Header/Inhalt, Round-trip→normalizeImport, bare-Format, Fremdformat/Müll abgelehnt).

**Stand:** A4 Stufe 1 (datei-basiert, Import+Export+Link) erledigt. **Offen:** API/Push-Echtzeit,
Rechnungs-Übernahme statt nur Auftrag. **Nächste (groß):** Mehrmandantenfähigkeit → Bilanzierung.
> Hinweis: Mehrmandanten + Bilanzierung sind große Architektur-Brocken — je dedizierter PR.

---

## 2026-06-17 — Punkt 6: ZUGFeRD-Empfang + KoSIT-Pflichtfeld-Precheck [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/zugferd.js`** (rein, node-getestet): `extrahiereZugferdXml(pdfBytes)` — best-effort-
  Extraktion der eingebetteten CII/UBL-XML aus PDF; FlateDecode-Streams werden **build-frei** über
  natives `DecompressionStream('deflate')` entpackt. `kostPflichtfelder(parsed)` — KoSIT-orientierter
  EN16931-Pflichtfeld-Precheck (BT-1/2/27/112).
- **Belege → E-Rechnung-Empfang** akzeptiert jetzt zusätzlich **ZUGFeRD/Factur-X-PDF**: extrahiert die
  XML, nutzt den bestehenden CII/UBL-Parser, zeigt den **KoSIT-Precheck** (✓/⚠ fehlende Felder). i18n de/en.
  SW `v78` (+zugferd.js precached).
- Tests **644/644** (5 neu: rohe + Flate-komprimierte CII-Extraktion, kein-XML→null, KoSIT ok/fehlend).

**Stand:** Punkt 6 erledigt (Empfang). **Offen/Ehrlich:** ZUGFeRD-*Erzeugen* (XML in PDF/A-3 einbetten)
braucht eine PDF-Lib → nicht build-frei, bleibt offen; KoSIT-Precheck ist KEIN amtlicher Validator.
**Nächstes (groß):** A4 (WorkFloh public, beidseitige Verlinkung + generische Buchhaltungs-Anbindung)
→ Mehrmandanten → Bilanzierung.

---

## 2026-06-17 — Punkt 29: Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/aufbewahrung.js`** (rein, node-getestet): `aufbewahrungBis` (Jahr + 10, §147 AO),
  `istAufbewahrungspflichtig`, `darfBelegLoeschen` (Belegprinzip: verknüpfte Belege nie löschbar).
  Re-Export über `documents.js`.
- **Beleg-Verknüpfung:** Beim Beleg→Entwurf wird jetzt **`belegRef`** in die Buchung gesetzt
  (Teil der Hash-Kette, GoBD-Belegprinzip) zusätzlich zum rückwärtigen `linkBeleg` (buchungId).
- **Belege-Ansicht:** Spalte „aufbewahren bis"; **Löschen verknüpfter Belege blockiert**,
  Frist-Warnung bei noch laufender Aufbewahrung. i18n de/en. SW `v77` (+aufbewahrung.js precached).
- Tests **639/639** (7 neu). **A4-Scope erweitert (Nutzer 17.06.):** WorkFloh public →
  beidseitige Verlinkung + generische Anbindung an andere Buchhaltungssoftware (in OFFENE_PUNKTE/PULS notiert).

**Stand:** Punkt 29 erledigt; alle kleinen Folgepunkte (27/28/29/31) durch. **Nächstes (groß, je eigener PR,
Freibrief-Merge):** ZUGFeRD/KoSIT → A4 (erweitert) → Mehrmandanten → Bilanzierung.

---

## 2026-06-17 — Punkt 31: Steuerberater-Übergabe-Datenblatt [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`export.buildUebergabeText`** (rein, node-getestet): Klartext-Datenblatt mit Firmenprofil,
  Steuernummer/USt-IdNr., DATEV Berater/Mandant, Zeitraum, USt-VA-Kennzahlen, EÜR-Überschuss und
  Liste der **mitzugebenden Dateien** (DATEV-CSV, GoBD-ZIP, SuSa/Kontenblätter, USt-VA/ELSTER).
- **Karte „Übergabe an den Steuerberater"** in „Berichte" (`berichte.js`): zeigt das Datenblatt für
  den gewählten Zeitraum (echte Daten) + **Drucken→PDF** + **TXT-Download**. i18n de/en. SW `v76`.
- Tests **632/632** (4 neu). 

**Stand:** Punkt 31 erledigt. **Nächstes:** Punkt 29 (Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung),
danach die großen Optionen (ZUGFeRD/KoSIT, A4-WorkFloh, Mehrmandanten, Bilanzierung) je eigener PR.

---

## 2026-06-17 — Punkt 28: Abweichendes Wirtschaftsjahr [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`domain/geschaeftsjahr.js`** (rein, node-getestet): `wjPeriode(jahr, wjBeginn)` (Beginn +1J −1Tag,
  schaltjahr-sicher), `wirtschaftsjahrVon(datum)`, `wjBeginnYYYYMMDD`, `validateWjBeginn`.
- **`summary.jahrPeriode(jahr, wjBeginn='01-01')`** delegiert an `wjPeriode` (rückwärtskompatibel);
  `dashboardKennzahlen` nimmt optionalen `wjBeginn`.
- **Setting `wirtschaftsjahrBeginn`** (MM-TT, Default 01-01) + Einstellungen-Sektion „Wirtschaftsjahr".
- **Dashboard** zeigt WJ-Label + rechnet auf das laufende Wirtschaftsjahr; **DATEV-EXTF-Header**
  übernimmt den WJ-Beginn (`opts.wjBeginnMMDD`). **USt-VA bleibt bewusst kalendarisch** (Gesetz).
- i18n de/en, SW-Cache `v75` (+1 Modul). Tests **628/628** (10 neu).

**Stand:** Punkt 28 erledigt. **Nächstes:** Punkt 31 (Steuerberater-Übergabe-Datenblatt).

---

## 2026-06-17 — Punkt 27: §19-Kleinunternehmer-Abfrage im Onboarding [Branch `claude/v2-ox8bu7`]

**Was getan**
- **`lock.js`**: neuer Onboarding-Schritt `stepProfil()` zwischen Shamir-Sicherung und Pflicht-Backup —
  fragt „Kleinunternehmer §19?" (Ja/Nein) und speichert `kleinunternehmer` via `updateSettings`
  (Backup bleibt der erzwungene Gate-Schritt; Auswahl später in Einstellungen änderbar). i18n de/en.
- SW-Cache `v74`. Tests **618/618** (reine UI-Ergänzung, Onboarding nicht headless-E2E → Selbsttest/
  Checkliste decken Engine ab).

**Stand:** Punkt 27 erledigt. **Nächstes:** Punkt 28 (abweichendes Wirtschaftsjahr).

---

## 2026-06-17 — Entscheidungen Teil 1 (ELSTER-Link + AVV) + Nachfolge-Brief mit Freibrief [Branch `claude/v2-ox8bu7`]

**Was getan**
- **Nutzer-Entscheidungen festgehalten** (`OFFENE_PUNKTE.md` neuer Kopf-Abschnitt): ELSTER **JA**
  (Datenpaket + Link, kein ERiC), Mehrmandanten **JA**, Bilanzierung **JA**, AVV **umsetzen**;
  inkl. **festgelegter Bau-Reihenfolge** (je 1 PR, Freibrief-Merge) + neue Klein-Punkte 27/28/29/31.
- **ELSTER-Weiterleitung (Entscheidung, klein):** Link „Bei ELSTER eingeben ↗" in der Karte
  „USt-VA je Zeitraum" (`reports.js`) zusätzlich zum ELSTER-Datenpaket-Download.
- **AVV/DPA (Entscheidung, klein):** neue Karte in „Recht & Doku" (`legal.js`) mit Direktlinks
  zu **Google Cloud DPA** und **Mistral DPA** (Art. 28 DSGVO). i18n de/en. SW-Cache `v73`.
- **Neuer Nachfolge-Brief** in `PULS.md` („START HIER") mit **ausdrücklich weitergereichtem
  Freibrief** (selbstständiges Mergen bei grüner CI) + priorisierter Reihenfolge der nächsten PRs.
- Tests **618/618 grün** (reine UI/Doku-Ergänzung, keine Logikänderung).

**Stand:** Fahrplan V1–V10 komplett; Entscheidungen verankert; Reihenfolge der Folge-PRs steht.
**Nächstes (lt. Brief):** §19-Onboarding (27) → abweichendes Wirtschaftsjahr (28) → Übergabe-
Datenblatt (31) → Beleg-Verknüpfung/Aufbewahrung (29) → ZUGFeRD/KoSIT → A4 → Mehrmandanten → Bilanz.

---

## 2026-06-16 — V10: Browser-E2E (In-App-Selbstdiagnose + Abnahme-Checkliste) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V10 — letzter Punkt; Fahrplan V1–V10 damit komplett)
- **`domain/selbsttest.js`** (`runSelbsttest`, rein/async, offline): AES-GCM-Roundtrip + Ablehnung
  falsches Passwort, Shamir 2-von-3, GoBD-Hash-Kette + **Manipulationserkennung**, Geldrundung
  (de-Format), doppelte Buchführung (SuSa Soll=Haben), USt-VA-Zahllast (Demo „klein" = 159,00 €),
  EÜR == Anlage-EÜR, GDPdU-Tabelle vollständig, Export-Pipeline (Demo-ZIP).
- **Ansicht „Selbsttest"** (`ui/views/selbsttest.js`, neuer Nav-Eintrag/Route): führt die Diagnose
  aus, zeigt ✓/✗ je Prüfung + Zusammenfassung + „erneut ausführen". i18n de/en. SW-Cache `v72`.
- **`docs/ABNAHME_CHECKLISTE.md`**: manueller Klickpfad (Onboarding/Buchen/Belege/Rechnung/
  Auswertung/Berichte/Export/Backup/PWA/„ohne DATEV") für die DOM-/IndexedDB-Pfade.
- **Tests 618/618** (13 neu: runSelbsttest gesamt grün + jede Einzelprüfung).

**Stand:** **Profi-Readiness-Fahrplan V1–V10 vollständig abgeschlossen.** Logik node-getestet
(618), Kern-Engine zusätzlich in-App offline prüfbar; DOM-Pfade via Checkliste manuell. **Offen
(kein Pflicht-Fahrplan mehr):** A4 WorkFloh-Anbindung, Sage 5b–d, echter Praxistest des Nutzers
(Foto-OCR→App→Finanzamt, DATEV-Testimport via Steuerberater), optional V-Bilanz/V-Lohn/V-Multi.

---

## 2026-06-16 — V8: DATEV-EXTF berater-fest (vorbereitet) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V8, gleiche Sitzung)
- **`export.js`**: vollständiger EXTF-Header aus Einstellungen — **Berater-/Mandanten-Nr.,
  Sachkontenlänge, WJ-Beginn**, Bezeichnung. Neue Hilfsfunktion **`istEinfacherSatz`**:
  einfache Sätze (2 Zeilen, oder 3 Zeilen mit genau 1 Standard-Steuerzeile) → **ein** Satz mit
  Brutto + **BU-Schlüssel** (SKR03: Vorsteuer 9/8, USt 3/2); **§13b/innergem. Erwerb/Mehrfach-
  Splits → zeilenweiser, steuerneutraler Export OHNE BU/Gegenkonto** (verhindert Doppelsteuer
  beim Import — vorher falsch konsolidiert).
- **`state.js`** + **Einstellungen-Sektion „DATEV-Export"** (`shell.js`): Berater-/Mandanten-Nr.,
  Sachkontenlänge; Reports-Export übergibt sie an `buildDatevExtf`.
- **`docs/DATEV_IMPORT.md`**: Aufbau, BU-Schlüssel-Tabelle, Automatik-vs-Split, Import-Schritte,
  Prüf-Checkliste gegen die Demo-Werte, ehrliche Grenzen.
- **Tests 605/605** (13 neu: Header mit Berater/Mandant/SKL/WJ, BU 9 Ausgabe / BU 3 Einnahme,
  EXTF-Datenzeile, §13b-Split ohne BU + leeres Gegenkonto + alle Konten, 2-Zeilen-Satz BU leer).
  SW-Cache `v71`.

**Stand:** V8 vorbereitet & node-getestet. **Offen/Ehrlich:** endgültige „Berater-Festigkeit" =
**realer DATEV-Testimport** (privat/Steuerberater) — mit Demo-Export + TESTDATEN.md vorbereitbar;
kein zertifiziertes 116-Spalten-EXTF. **Nächstes/letzter Punkt:** V10 (Browser-E2E / In-App-
Selbstdiagnose, manuell).

---

## 2026-06-16 — V9: Korrektheit/Kleinfälle + Simulations-Testharness [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V9 + vom Nutzer gewünschte Testmöglichkeit, gleiche Sitzung)
- **`domain/kleinfaelle.js`** (rein, node-getestet): `kleinbetragsrechnung` (§33 UStDV, ≤250 €
  → reduzierte Pflichtangaben), `geschenkAbzug` (§4 Abs.5 Nr.1, 50 € netto → abzugsfähig/Konto/
  VSt), **`bewirtungAufteilung`** (§4 Abs.5 Nr.2, **rechnender** 70/30-Split, Vorsteuer 100%).
  Neue Konten 4654 (Bewirtung nicht abzugsf.) / 4635 (Geschenke nicht abzugsf.).
- **Periodensperre:** `pruefung.istGesperrt` + harte Sperre in `store.festschreiben`
  (kv `buchungssperreBis`) + Einstellung „Buchungssperre" (shell). `pruefeBuchung` liefert
  Sperr-Fehler + **Kleinunternehmer-Konsistenz-Warnung** (§19: kein USt/VSt-Konto).
- **Journal-UI:** Schnellbuchung **„Bewirtung 70/30"** (nutzt Betrag=netto/USt/Haben).
- **Simulations-Testmöglichkeit (Nutzerwunsch):** `domain/demodaten.js` — deterministischer
  Demo-Mandant **klein** (hand-geprüfte Sollwerte) **und groß** (Konsistenz im Maßstab);
  `demoExportDateien` erzeugt alle Formate. Berichte-Karte **„Demo-/Test-Export"** → lädt ZIP
  mit ECHTEN Dateien (DATEV-EXTF, ELSTER-USt-VA, EÜR/SuSa/Anlage-EÜR, Kassenbuch, Kontenblatt,
  Anlagenverzeichnis, GDPdU) — **ohne** DATEV/ELSTER-Zugang, **ohne** Berührung echter Daten.
  **`docs/TESTDATEN.md`** dokumentiert Buchungen + Vergleichswerte (USt-VA Kz83 159,00 €,
  EÜR −350,00 €, AfA 400 €, …) zum späteren Abgleich mit echtem DATEV/ELSTER.
- **Tests 592/592** (33 neu: Kleinfälle, Periodensperre, Kleinunternehmer-Warnung, Demo „klein"
  Goldwerte, Demo „groß" Invarianten, Demo-Export-ZIP). SW-Cache `v70` (+2 Module).

**Stand:** V9 vollständig; **alle MUSS-Punkte V2–V7 + V9 erledigt**. Logik node-getestet, UI
statisch geprüft. **Offen (nur SOLL):** V8 (DATEV-EXTF berater-fest — echter DATEV-Testimport;
teils via TESTDATEN.md simulierbar), V10 (Browser-E2E manuell). **Nutzer testet** privat in
1–2 Wochen (Foto-OCR → App → Finanzamt).

---

## 2026-06-16 — V7: GoBD-Betriebsprüfer-Export (GDPdU „Z3") [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V7, gleiche Sitzung)
- **`core/zip.js`** (rein, zero-dep): ZIP-Writer (Methode 0 „store") + `crc32` — für build-freie
  Binär-Datenpakete im Browser.
- **`domain/gdpdu.js`** (rein, node-getestet): `buildGdpduIndexXml` (GDPdU-Beschreibungs-
  standard, `<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2004.dtd">`, Tabellen mit Spaltentypen
  Date/Numeric/AlphaNumeric, Separator `;`, DecimalSymbol `,`), `gdpduCsvBuchungen` (nur
  festgeschrieben), `gdpduCsvKonten`, `buildGdpduPaket` (Dateiliste index.xml/buchungen.csv/
  konten.csv/info).
- **„Berichte"**: Karte **GoBD-Betriebsprüfer-Export** → baut ZIP via `zipFiles` und lädt
  `GoBD-GDPdU-Export-<Jahr>.zip` (Validity/Steuernummer aus Firmenprofil). i18n de/en.
  SW-Cache `v69` (+2 Module precached).
- **Tests 559/559** (16 neu: CRC-32-Referenzwert, ZIP-Signaturen/EOCD/Dateianzahl, GDPdU-CSV
  nur festgeschrieben + Spaltenkopf, index.xml DOCTYPE/Tabellen/Spaltentypen/Lieferant, Paket→ZIP).

**Stand:** V7 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
GDPdU-*orientiert* — die DTD wird bewusst NICHT mitgepackt (Prüfsoftware liefert sie),
vor echter Prüfung mit IDEA testen; **kein DSFinV-K** (Kassendaten). **Nächstes:** V8
(DATEV-EXTF berater-fest) — „SOLL"; alternativ V9 (Korrektheit/Kleinfälle, „SOLL").

---

## 2026-06-16 — V6: Anlage EÜR + Kontenblätter + SuSa [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V6, gleiche Sitzung)
- **`domain/berichte.js`** (rein, node-getestet): `summenSaldenliste` (SuSa = Saldenliste +
  Soll-/Haben-Gesamtsummen), `kontenblatt` (Kontoauszug je Konto, chronologisch, **laufender
  Saldo**, Entwürfe ausgeschlossen), `anlageEUR` (Erfolgskonten → **Anlage-EÜR-Gruppen**,
  netto, Überschuss = computeEUR) + `eurGruppeFuer` (Konto→Gruppe mit Fallback je Kontoart).
- **`domain/export.js`**: `buildSusaCsv`, `buildKontenblattCsv`, `buildAnlageEURCsv`.
- **Ansicht „Berichte"** (`ui/views/berichte.js`, neuer Nav-Eintrag/Route): Anlage-EÜR-
  Gruppierung (Einnahmen/Ausgaben/Überschuss), SuSa-Tabelle, Kontenblatt mit Konto-Auswahl;
  Periodenfilter; je CSV-Export. i18n de/en. SW-Cache `v68` (+2 Module precached).
- **Tests 543/543** (17 neu: SuSa Soll=Haben, Bank-Saldo, Kontenblatt laufender Saldo +
  Entwurf-Ausschluss, Gruppen-Zuordnung, Anlage-EÜR-Summen/Überschuss, USt/VSt nicht als
  Erfolg, CSV-Inhalte).

**Stand:** V6 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
Anlage-EÜR an der Formularstruktur *orientiert* — exakte **Zeilennummern** (jahresabhängig)
am amtlichen Formular/mit Berater prüfen. **Nächstes:** V7 (GoBD-Betriebsprüfer-Export
GDPdU/DSFinV-K „Z3"/IDEA + Beschreibungsdatei).

---

## 2026-06-16 — V5: USt-VA komplett (Zeitraum + Sondervorauszahlung + ELSTER-Paket) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V5, gleiche Sitzung)
- **`domain/umsatzsteuer.js`** (rein, node-getestet): `voranmeldungsperioden(typ, jahr)` für
  **monatlich/vierteljährlich/jährlich** (ELSTER-Zeitraum-Codes 01–12 / 41–44, Monatsenden
  schaltjahr-sicher via `Date`), `periodeIndexFuer`, **`sondervorauszahlung`** (Dauerfrist-
  verlängerung: 1/11 der Vorjahres-Zahllast, nur bei Zahllast > 0), `jahresZahllast` (Kz 83
  des Jahres via `buildUstVa`).
- **`domain/export.js`**: `buildElsterVaPaket(va, meta)` — strukturierte Übergabedatei
  (Kennzahlen 41/43/81/86/89/93/46/47/66/61/67/83 + Steuernummer/USt-IdNr./Zeitraum) mit
  Disclaimer „NICHT amtlich".
- **Auswertungen**: Karte **„USt-VA je Zeitraum"** (`reports.js`): Typ/Jahr/Periode wählbar,
  Zahllast + Sondervorauszahlungs-Hinweis (nur monatlich), **ELSTER-Datenpaket-Export** +
  Perioden-USt-VA-CSV. Setting **`vaZeitraum`** (Default vierteljährlich) persistiert.
  i18n de/en. SW-Cache `v67` (+1 Modul precached).
- **Tests 526/526** (16 neu: Perioden je Typ, Schaltjahr-Februar, ELSTER-Codes, Index-Mapping,
  Sondervorauszahlung 1/11 + Erstattung=0, jahresZahllast, ELSTER-Paket-Inhalt/Disclaimer).

**Stand:** V5 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
„ELSTER-Datenpaket" ist eine Übergabedatei, **KEIN** ERiC-XML/-Direktversand; Jahres-USt-
Erklärung (eigenes Formular) nicht abgebildet. **Nächstes:** V6 (Anlage EÜR amtliches
Zeilenschema + Kontenblätter + SuSa).

---

## 2026-06-16 — V4: Eröffnungs-/Anfangsbestände + GoBD-Kassenbuch [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V4, gleiche Sitzung)
- **`domain/kassenbuch.js`** (rein, node-getestet): `kassenbuchEintraege` (chronologische
  Kassenbewegungen aus festgeschriebenen Buchungen, sortiert nach Datum/seq), `kassenbericht`
  (Anfangsbestand + Σ Einnahmen − Σ Ausgaben = Endbestand, **laufender Bestand je Zeile**,
  **GoBD-Prüfung „Kasse nie negativ"** mit erster Verstoß-Stelle), `anfangsbestandZeilen`
  (Soll Geldkonto an Haben Saldenvortrag **9000**).
- **`domain/accounts.js`**: neues Konto **9000** Saldenvorträge/Anfangsbestände (rolle
  'saldenvortrag', erfolgs-/USt-neutral). **`anfangsbestand-store.js`**: Bestand je Konto+Jahr.
- **`domain/export.js`**: `buildKassenbuchCsv` (chronologisch, Anfangs-/Endbestand).
- **Ansicht „Kassenbuch"** (`ui/views/kassenbuch.js`, neuer Nav-Eintrag/Route): Geldkonto-/
  Jahr-Wahl, Anfangsbestand speichern + **als Buchungsentwurf**, Kassenbericht-Karte,
  Negativ-Warnung (GoBD), Bewegungstabelle mit laufendem Bestand, Kassenbuch-CSV. i18n de/en.
  SW-Cache `v66` (+4 Module precached).
- **Tests 510/510** (13 neu: Anfangsbestand-Zeilen, chronologische Filterung, Bank ≠ Kasse,
  Bericht-Summen/Endbestand, laufender Bestand, Negativ-Erkennung, CSV).

**Stand:** V4 vollständig (Logik node-getestet, UI statisch geprüft). **Offen/Ehrlich:**
offenes Kassenbuch — **KEINE** zertifizierte TSE/Kassensicherungsverordnung. **Nächstes:**
V5 (USt-VA komplett: Periodentyp + Dauerfristverlängerung + ELSTER-Datenpaket).

---

## 2026-06-16 — V3: Anlagevermögen + AfA + Anlagenverzeichnis [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V3, gleiche Sitzung wie V2)
- **`domain/anlagen.js`** (rein, node-getestet): AfA-Methoden **GWG-Sofortabschreibung**
  (§6 Abs.2, ≤ 800 € netto), **Sammelposten** (§6 Abs.2a, 250–1.000 €, 20 %/J. über 5 J.,
  ohne zeitanteilige Kürzung), **lineare AfA** (§7 Abs.1, **pro rata temporis** monatsgenau im
  Anschaffungs-/Schlussjahr). `klassifiziere`, `afaPlan*`, `anlageStatus`, `anlagenverzeichnis`,
  `afaBuchungZeilen` (Soll 4830/4855 an Anlagekonto), `normalizeAnlage`/`validateAnlage`.
- **`domain/anlagen-store.js`**: Stammdaten-CRUD (Klartext-Records `type:'anlage'`, wie Konten).
- **`domain/export.js`**: `buildAnlagenverzeichnisCsv` (AVEÜR-orientiert).
- **Ansicht „Anlagen"** (`ui/views/anlagen.js`, neuer Nav-Eintrag/Route): Erfassen/Bearbeiten
  (Methodenvorschlag nach Betrag), Anlagenverzeichnis je Wirtschaftsjahr mit Summen,
  **„AfA buchen"** → Buchungsentwurf (Festschreiben bleibt manuell, GoBD), AVEÜR-CSV-Export.
  i18n de/en. SW-Cache `v65` (+3 Module precached).
- **Tests 497/497** (25 neu: Klassifikation, Pläne GWG/linear-prorata/Sammelposten,
  Status, AfA-Buchung, Verzeichnis-Summen, CSV, Normalisierung/Validierung).

**Stand:** V3 vollständig (Logik node-getestet, UI statisch geprüft — nicht headless-E2E).
**Offen/Ehrlich:** AVEÜR-CSV ist AVEÜR-*orientiert* (kein amtliches Formular); GWG-250-€-
Aufzeichnungsgrenze, degressive AfA, Sonderabschreibungen, **Anlagenabgang/Verkauf** nicht
modelliert. **Nächstes:** V4 (Eröffnungs-/Anfangsbestände + GoBD-Kassenbuch).

---

## 2026-06-16 — V2: §13b/Reverse-Charge + EU/Ausland (USt) [Branch `claude/v2-ox8bu7`]

**Was getan** (Fahrplan-Punkt V2, „weiter laut PULS")
- **`baueReverseChargeZeilen` (journal.js)** + `UMSATZART`: Steuerschuldumkehr (§13b UStG /
  innergem. Erwerb) bucht **gleichzeitig** abziehbare Vorsteuer (Soll) und geschuldete USt
  (Haben); an den Lieferanten fließt nur der **Netto**-Betrag. Option „nicht abziehbar" →
  USt wird Kostenbestandteil. Buchung ist immer ausgeglichen.
- **Konten (accounts.js):** 1577/1787 (§13b VSt/USt), 1574/1772 (ig Erwerb VSt/USt),
  8125/8120 (steuerfreie ig Lieferung / Ausfuhr) mit neuen `rolle`-Markern; Map
  `REVERSE_CHARGE_KONTEN` + `STEUERFREI_ERLOES_KONTEN`. `store.ensureSeedKonten` zieht die
  Konten in älteren Tresoren nach.
- **USt-VA (export.js `buildUstVa`):** neue Kennzahlen **Kz 46/47/67** (§13b),
  **Kz 89/93/61** (ig Erwerb), **Kz 41/43** (steuerfrei); Kz 83 inkl. RC (hebt sich bei
  vollem Abzug auf). `ustVaToCsv` + Auswertungs-Karte zeigen die Kennzahlen (nur ≠ 0).
- **UI:** Umsatzart-Auswahl im Journal-Formular (Betrag = Netto bei RC). i18n de/en. SW `v64`.
- **Tests 472/472** (28 neu). PR #64 gemergt.

> Hinweis: Branch `claude/v2-ox8bu7` war zunächst auf veraltetem `main` (PR #63 Ist-EÜR);
> Ist-EÜR existierte bereits in `main` → #63 geschlossen, Branch auf `main` zurückgesetzt,
> V2/V3 korrekt umgesetzt.

---

## 2026-06-16 — Profi-Readiness-Fahrplan (V1–V10) + V1 Kontenrahmen

**Was getan**
- **Master-Plan verankert** (PR #60): `OFFENE_PUNKTE.md` Abschnitt „V. PROFI-READINESS" —
  ehrliches Audit + V1–V10 (damit kein Steuerberater/Prüfer wegen fehlender Pflicht-Bausteine
  ablehnt) + Scope-Annahmen (EÜR primär; Bilanz/Lohn eigene Spuren).
- **V1 umgesetzt:** Kontenrahmen 18 → **57 gängige SKR03-Konten** (`accounts.js`); **Konto
  anlegen/bearbeiten/löschen** im UI (`views/accounts.js`) mit `addKonto`/`updateKonto`/`deleteKonto`
  (`store.js`; Nummer unveränderlich, Löschen nur unbenutzt) + reine, node-getestete
  `validateKonto`/`normalizeKonto`. i18n de/en. SW `v62 → v63`.
- **14 neue Node-Tests** → `node tests/run.mjs` **444/444 grün**.

**Ehrlich offen:** UI nicht headless-E2E. Seed ist gängige Auswahl, NICHT vollständiger SKR03 —
weitere Konten frei anlegbar; vor DATEV-Export mit Berater abgleichen. SKR04-Profil später.

**Offen / Nächstes (Master-Plan):** **V2** §13b/Reverse-Charge + EU/Ausland, dann V3 AfA/Anlagen, …
**Details: `docs/OFFENE_PUNKTE.md` Abschnitt V.**

---

## 2026-06-16 — A1-Rest: Persistente Mahnstufe + manuelle Zins-/Gebühren-Erfassung

**Was getan**
- **Reine Logik** `mahnwesen.js` (node-getestet): `letzteMahnstufe`, `vorschlagNaechsteStufe`
  (nächste Stufe aus persistentem Verlauf statt nur aus Überfälligkeits-Tagen; Deckelung bei
  3. Mahnung), `mahnVerlaufSumme`, `mahnStufeLabel`.
- **Store** `crm-store.mahnungErfassen()` — Auftrag führt `mahnungen[]` (Datum/Stufe/Zinsen/
  Gebühren). **Bewusst keine Auto-Steuerlogik.**
- **UI** `reports.js`: Mahn-Karte zeigt „zuletzt gemahnt"; Mahnschreiben mit **editierbaren**
  Verzugszinsen/Mahngebühren (vorbelegt §288) + „Als gesendet vermerken" (zählt Stufe hoch);
  Hinweis, dass die Buchung der Zinsen/Gebühren separat im Journal erfolgt. i18n de/en.
- **8 neue Node-Tests** → `node tests/run.mjs` **430/430 grün**. SW-Cache `v61 → v62`.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. Auto-Buchung von Zinsen/Gebühren
bewusst NICHT (manuell/separat). Offen: Zahlungsziel je Rechnung, Eingangsrechnungs-Verzug
(Gegenseite); A3-Rest (Skonto-Buchung §17, Sammelzahlungen); A4 WorkFloh-Vollanbindung.

**Offen / Nächstes:** Zahlungsziel je Rechnung; A3-Rest; später A4. **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A3-Rest: Forderungs-Teilzahlung (OP-Tracking) + WorkFloh-Andock verankert

**Was getan**
- **Reine Logik** `orders.js`: `auftragGezahlt()`/`auftragOffen()` (node-getestet) — Auftrag führt
  jetzt `zahlungen[]`, offener Rest = Brutto − Teilzahlungen. `zahlungsabgleich.offenePosten`
  liefert den **offenen Rest** (statt Brutto); voll bezahlte „berechnet"-Aufträge fallen heraus.
- **Store** `crm-store.auftragZahlungHinzufuegen()` — erfasst (Teil-)Zahlung, markiert bei
  Ausgleich automatisch „bezahlt". (Browser-Pfad.)
- **UI** `documents.js`: Bankimport-Aktion „◑ Teilzahlung verbuchen" gilt jetzt **auch für
  Forderungen** (Bank an Forderung, Rest bleibt offen); exakte Zahlungen werden ebenfalls als
  Zahlung erfasst (Historie) — gemeinsamer Helfer `zahlungVerbuchen`.
- **Docs:** `OFFENE_PUNKTE.md` **A4 App-Anbindung / WorkFloh-Integration** verankert (Angebote/
  Arbeiten → Rechnung → BLP; als Option, spätere Sitzung; Seam: `importworkfloh.js`/`importWorkFloh`).
- **7 neue Node-Tests** → `node tests/run.mjs` **422/422 grün**. SW-Cache `v60 → v61`.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. Skonto-Buchung §17 weiterhin nur Hinweis;
Sammelzahlungen offen. WorkFloh-**Vollanbindung** bewusst noch nicht gebaut (nur Datei-Import-Seam +
verbindlich dokumentiert).

**Offen / Nächstes:** A3-Rest (Sammelzahlungen, Skonto-Buchung), A1-Rest (persistente Mahnstufe,
Zins-/Gebührenbuchung), später **A4 WorkFloh-Vollanbindung**. **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A1-Rest: B2B/Verbraucher je Kunde (korrekte Verzugszinsen)

**Was getan**
- **Kundenmodell** `crm-store.js`: Flag `istVerbraucher` (Default false = Unternehmer/B2B).
- **Reine Logik** `mahnwesen.kundeIstB2B(kunde)` (node-getestet; Default konservativ B2B).
- **UI** `customers.js`: Checkbox „Verbraucher (Privatperson)" im Kundenformular + Spalte „Art"
  in der Liste. `reports.js`: Mahnschreiben nutzt jetzt den Aufschlag **je Kunde** (Unternehmer
  +9, Verbraucher +5 %-Punkte über Basiszins) und die **40-€-Pauschale nur bei Unternehmern**.
  i18n de/en.
- **5 neue Node-Tests** → `node tests/run.mjs` **415/415 grün**. SW-Cache `v59 → v60`.
  `OFFENE_PUNKTE.md` A1-Teil „B2B/Verbraucher je Kunde" abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. A1-Rest weiterhin offen: **Mahnstufe
persistent** je Forderung, **Buchung** von Zinsen/Gebühren (Konto-Mapping + USt), Zahlungsziel je
Rechnung, Eingangsrechnungs-Verzug (Gegenseite).

**Offen / Nächstes:** A1-Rest (persistente Mahnstufe, Zins-/Gebührenbuchung); A3-Rest
(Forderungs-Teilzahlung, Skonto-Buchung §17, Sammelzahlungen). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A3 (Kern): Teilzahlung/Skonto/Toleranz-Matching im Zahlungsabgleich

**Was getan**
- **Reine Logik** `src/domain/zahlungsabgleich.js`: `findeKandidaten(umsatz, posten, opts)` —
  gerankte Kandidaten mit Art `exakt`/`toleranz` (Rundungs-Cent)/`skonto` (Zahlung knapp unter
  offen, ≤ skontoProzent → **Hinweis**, kein Auto-Buchen)/`teilzahlung` (Rest bleibt offen).
  Überzahlung wird konservativ nicht zugeordnet; Mehrdeutigkeit über Score (Referenz/Name/
  Datumsnähe). `findeOffenePosten` (exakt) bleibt unverändert.
- **UI** `src/ui/views/documents.js`: Bankimport bietet bei Verbindlichkeiten ohne exakten
  Treffer **„◑ Teilzahlung verbuchen"** → bucht gezahlten Betrag (Verbindlichkeit an Bank) +
  `zahlungHinzufuegen` (Rest bleibt offen, erscheint weiter in der OP-Liste); Skonto als Hinweis
  inkl. „USt-Korrektur §17 manuell". i18n de/en.
- **8 neue Node-Tests** → `node tests/run.mjs` **410/410 grün**. SW-Cache `v58 → v59`.
  `OFFENE_PUNKTE.md` A3-Kern abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E. **Teilzahlung bei Forderungen** fehlt
(Aufträge führen nur Status, keinen Rest); **Skonto-Buchung mit USt/§17-Korrektur** bewusst nicht
automatisiert; **Sammelzahlungen** (1 Zahlung → mehrere Rechnungen) offen.

**Offen / Nächstes:** A3-Rest (Forderungs-Teilzahlung, Skonto-Buchung, Sammelzahlung); A1-Rest
(Mahnwesen je Kunde/persistent/Buchung). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A2-Anschluss: OP-Liste „Offene Verbindlichkeiten" (Auswertungen)

**Was getan**
- **Reine Logik** `src/domain/payables.js` (node-getestet): `anreichereVerbindlichkeiten`
  (offene Posten + Fälligkeit/Überfälligkeit — nutzt rechnungseigene `faelligAm`, sonst
  Datum + Zahlungsziel, Default 30 Tage; keine Mahnstufe, da eigene Zahlungspflicht),
  `verbindlichkeitenSummen` (Summe/Anzahl + überfällig). Wiederverwendet `mahnwesen.faelligkeit`/
  `tageUeberfaellig`.
- **Export** `export.buildOffeneVerbindlichkeitenCsv` (OP-Liste als CSV, Summenzeile).
- **UI** `src/ui/views/reports.js`: neue Karte **„Offene Verbindlichkeiten (Kreditoren)"**
  (spiegelt „Offene Forderungen & Mahnwesen"): Tabelle Lieferant/Rechnung/Offen/Fällig +
  **Überfällig-Badge**, Summe + überfällige Summe, **CSV-Export-Knopf**. i18n de/en.
- **9 neue Node-Tests** → `node tests/run.mjs` **402/402 grün**. SW-Cache `v57 → v58`.
  `OFFENE_PUNKTE.md` A2-OP-Liste abgehakt.

**Ehrlich offen / ungetestet:** UI nicht headless-E2E (Kernlogik node-getestet). Noch kein
**Skonto**/Zahlungsbedingungen, kein manuelles Anlegen/Bearbeiten von Verbindlichkeiten
(heute nur via E-Rechnung-Import), Teilzahlungs-Matching = A3.

**Offen / Nächstes:** A3 (Teilzahlungen & unscharfes Matching im Zahlungsabgleich); A1-Rest
(Mahnwesen je Kunde/persistent/Buchung). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — A2: Eingangsrechnungen als offene Verbindlichkeiten (Posten-Quelle Zahlungsabgleich)

**Was getan**
- **Reine Logik** `src/domain/payables.js` (node-getestet): `eingangsrechnungZeilen`
  (Eingangsrechnung „auf Ziel": Aufwand + abziehbare Vorsteuer **an** Verbindlichkeiten 1600),
  `eingangsrechnungSummen`/`bruttoVonPositionen`/`rechnungBrutto`, `summeZahlungen`/`offenerBetrag`,
  `rechnungStatus` (offen/teilbezahlt/bezahlt/storniert), **`offeneVerbindlichkeiten`** (offene
  Kreditoren-Posten **im selben Format wie `zahlungsabgleich.offenePosten`**, `richtung:'ausgabe'`
  + `kind:'verbindlichkeit'`, `betragCent`=offener Rest, nach Fälligkeit sortiert),
  `summeOffeneVerbindlichkeiten`, `validateEingangsrechnung`.
- **Store** `src/domain/payables-store.js` (verschlüsselt via `encstore`): CRUD +
  `zahlungHinzufuegen` + `stornoEingangsrechnung` + `offeneVerbindlichkeitenPosten`.
  ⚠️ Browser-Pfad (Vault/IndexedDB) — nicht node-getestet.
- **UI-Einbindung** `src/ui/views/documents.js`: E-Rechnung-Empfang bekommt
  **„+ Als offene Verbindlichkeit erfassen"** (speichert Kreditorenrechnung + bucht „auf Ziel"
  als Entwurf, `buchungRef` verknüpft); **Bankimport** lädt jetzt Forderungen **und**
  Verbindlichkeiten → Ausgangszahlungen matchen offene Verbindlichkeiten (`findeOffenePosten`),
  buchen „Verbindlichkeit an Bank" und vermerken die Zahlung. i18n de/en.
- **40 neue Node-Tests** → `node tests/run.mjs` **393/393 grün**. SW-Cache `v56 → v57`
  (+ `payables.js`, `payables-store.js`). `OFFENE_PUNKTE.md` A2 abgehakt.

**Ehrlich offen / ungetestet**
- UI-Pfade (E-Rechnung-Erfassen, Bankimport-Verbindlichkeits-Abgleich) **nicht headless-E2E**
  getestet (kein Browser) — nur statisch/`node --check`. Kernlogik node-getestet.
- Keine eigene **Verbindlichkeiten-/OP-Liste**-Ansicht; Erfassung bislang aus E-Rechnung-XML
  (nicht aus Foto/PDF-Beleg). Teilzahlungs-/unscharfes Matching = A3 (offen).

**Offen / Nächstes:** Verbindlichkeiten-OP-Liste (Ansicht) + Skonto/Fälligkeit; A3 (Teilzahlungen/
unscharfes Matching); A1-Rest (Mahnwesen: B2B/VB je Kunde, persistente Mahnstufe, Buchung
Zinsen/Gebühren). **Details: `docs/OFFENE_PUNKTE.md`.**

---

## 2026-06-16 — Mahnwesen (A1-Kern): Fälligkeit/Überfälligkeit + Verzugszinsen + Mahnschreiben

**Was getan:** `src/domain/mahnwesen.js` (neu, rein/getestet): `faelligkeit`, `tageUeberfaellig`,
`mahnstufe` (Erinnerung→1./2./3. Mahnung), `verzugszinsenCent` (§288 BGB: B2B +9, Verbraucher +5
%-Punkte über Basiszins, zeitanteilig), `mahnpauschaleCent` (40 € B2B), `anreicherePosten`,
`ueberfaelligSummen`, `mahnschreibenDaten` (Zinsen/Pauschale erst ab „1. Mahnung"). UI: Auswertungen-
Karte **„Offene Forderungen & Mahnwesen"** (überfällig-Badge + Summe) mit **druckbarem
Mahnschreiben**. Settings `zahlungszielTage` (14) + `verzugBasiszinsProzent` (§247 BGB). i18n de/en,
`.badge-warn`-Style, SW `v55→v56`. **+20 Tests → 353/353 grün.**

**Ehrlich offen (OFFENE_PUNKTE A1):** B2B/Verbraucher global (nicht je Kunde); Mahnstufe nur
abgeleitet (nicht persistent); Buchung der Zinsen/Gebühren als Ertrag fehlt; Basiszinssatz muss
manuell aktuell gehalten werden; UI nicht headless-E2E.

---

## 2026-06-16 — Merkliste angelegt: docs/OFFENE_PUNKTE.md (inkl. Mahnwesen)

**Was getan (Nutzerwunsch):** Lebende Backlog-/Merkliste `docs/OFFENE_PUNKTE.md` angelegt —
unbedingt-beachten/nacharbeiten/verbessern, priorisiert (MUSS/SOLL/KANN). **Hochprioritär &
ausführlich: Mahnwesen / überfällige Forderungen** — Fälligkeit je Rechnung, automatische
Überfällig-Markierung (Dashboard/OP-Liste), Mahnstufen, Verzugszinsen (§288 BGB), Mahngebühren,
Mahnschreiben (druckbar), Buchung; zuerst reine node-testbare Kernlogik. Plus: Verbindlichkeiten
als OP-Quelle, Teilzahlungen, KoSIT-Validierung, ZUGFeRD, Format-Härtung, NER, E2E u. a.
Aus PULS verlinkt (§7.0 + Doku-Map). Reine Doku.

---

## 2026-06-16 — Klarstellung: Nicht-EU-KI ist dormant, nicht auswählbar

**Was getan (Nutzer-Korrektur):** Die Strategie-Formulierung in `docs/PULS.md` §0★ und
`docs/TRANSPARENZ_ZWISCHENSTAND.html` §0a/§8 präzisiert: **aktive KI-Nutzung bleibt strikt EU**
(Vision EU + Mistral EU, CLAUDE.md §8 unverändert). **Nicht-EU-Anbieter sind NICHT zur Auswahl
freigegeben** — nur als ruhende, strukturelle Option im Gerüst gedacht. „freie Anbieterwahl"
zuvor missverständlich → jetzt: Flexibilität **innerhalb der EU**; Nicht-EU-Öffnung nur per
ausdrücklicher, gesonderter Produktentscheidung. Reine Doku.

---

## 2026-06-16 — Zahlungsabgleich: offene Posten + Matching + Ausgleichsbuchung

**Was getan:** `src/domain/zahlungsabgleich.js` (neu, rein/getestet): `offenePosten(auftraege)`
(offene Forderungen aus Aufträgen mit Status „berechnet"), `findeOffenePosten(umsatz, posten)`
(konservativ: gleiche Richtung + exakter Betrag; Bewertung über Rechnungsnummer im Zweck +
Kundenname + Datumsnähe), `zahlungsBuchungZeilen()` (Einnahme → Bank an Forderung; Ausgabe →
Verbindlichkeit an Bank). Neuer Auftrags-Status **`bezahlt`** (orders.js + Flow). UI: Bank-Import
zeigt je passendem Umsatz „✓ Zahlung auf Rechnung …" → bucht Ausgleich + markiert Auftrag bezahlt;
sonst der normale Kategorisierungs-Vorschlag. SW `v54→v55`. **+10 Tests → 333/333 grün.**

**Ehrlich offen:** Verbindlichkeiten-Posten (Eingangsrechnungen) noch nicht als Quelle erfasst
(Logik ist richtungsneutral vorbereitet); **Teilzahlungen / unscharfes Matching** nicht abgedeckt
(nur exakter Betrag); UI nicht headless-E2E. Damit ist die Ist-EÜR §4(3) praktisch nutzbar
(Geldfluss ↔ offene Rechnungen), aber kein vollständiges OP-Management.

---

## 2026-06-16 — Bankimport (Schritt 2): CAMT.053 + Format-Weiche

**Was getan:** `src/domain/bankimport.js` um **CAMT.053** (ISO-20022-XML) erweitert: `parseCAMT()`
(namespace-tolerant, `<Ntry>` → Betrag/Soll-Haben/Valuta/Verwendungszweck/Gegenpartei — Cdtr bei
Lastschrift, Dbtr bei Gutschrift) liefert dasselbe Umsatz-Modell wie `parseMT940`. Neu
`erkenneBankformat()` + `parseBankauszug()` (Auto-Erkennung MT940/CAMT). UI (`documents.js`) nutzt
jetzt den einheitlichen Einstieg + akzeptiert `.xml`; i18n de/en; SW `v53→v54`. **+9 Tests →
323/323 grün** (CAMT-Parsing inkl. Richtung/Gegenpartei, Format-Weiche).

**Ehrlich offen:** keine vollständige ISO-20022-Validierung; **echter Zahlungsabgleich** (Matching
auf offene Forderungen/Verbindlichkeiten → Bank-gegen-Forderung-Buchung statt Erlös/Aufwand) ist
der direkt nächste Schritt und macht die Ist-EÜR §4(3) + offene Posten komplett.

---

## 2026-06-16 — Strategie verankert: Pseudonymisierung als Schlüssel-Enabler

**Was getan (auf Nutzerwunsch, „sehr wichtig"):** Den strategischen Kern festgehalten und
priorisiert — *Komfort UND Datenschutz zugleich* als Wettbewerbsvorteil; Vertrauen durch
technischen Beleg statt Reputation. Pseudonymisierung = **Schlüssel-Enabler (Bau-Schritt 1,
bereits gebaut)**, der freie Anbieterwahl im Einfach-Modus, einen Privat-/Bürger-Modus und das
Vertrauen freischaltet. Verankert in `docs/PULS.md` (neues §0★ Leitbild/Priorität) und in
`docs/TRANSPARENZ_ZWISCHENSTAND.html` (neuer Abschnitt §0a). 
**Offen/Entscheidung:** P2 (KI-Anbieterwahl je Modus) berührt die strenge EU-KI-Regel
(CLAUDE.md §8) → Produktentscheidung des Nutzers nötig, bevor gebaut wird.

---

## 2026-06-16 — Doku: Transparenz-/Zwischenstands-HTML aktualisiert

**Was getan:** Die kanonische, druckbare Transparenz-Doku `docs/TRANSPARENZ_ZWISCHENSTAND.html`
(vom Nutzer bereitgestellt, war veraltet: 134 Tests, Pseudonymisierung/AVV „geplant") ehrlich auf
den aktuellen Stand gebracht: **314/314 Tests**; Pseudonymisierung (§6) als **gebaut** markiert und
**wahrheitsgemäß als anker-basiert** beschrieben (nicht NER — diese Klarstellung war wichtig);
AVV (Art. 28/32) ✓; neuer §7 **E-Rechnung (erzeugen+empfangen) + Bankimport MT940**; P-Liste
(P1 ✓, P5 ✓, P7 teilweise) und §9-Stand aktualisiert. Druck-Button → PDF. Build-frei, keine
externen Ressourcen. Meine zwischenzeitlich erstellte `STATUS.html` wieder entfernt (konsolidiert).

**Ehrlich:** reines Doku-Artefakt; Statusangaben gespiegelt aus PULS/SESSIONS/ROADMAP, kein Test.

---

## 2026-06-16 — Bankimport (Schritt 1): MT940-Parser → Buchungsvorschläge

**Was getan**
- **`src/domain/bankimport.js`** (neu, rein/getestet): `parseMT940(text)` liest SWIFT-MT940
  (:25: Konto, :61: Umsatzzeile inkl. C/D/RC/RD-Vorzeichen + Valuta, :86: Verwendungszweck
  inkl. mehrzeiliger Fortsetzung + ?32/?33-Gegenname) → normalisierte Umsätze
  {valuta, betragCent, richtung, zweck, gegen}. `umsatzExtraktion()` mappt aufs
  `ai/extract`-Format (Richtung kommt verbindlich aus dem Auszug, USt-Satz offen).
- **UI:** Karte „Bankauszug importieren (MT940)" in Belegen (`documents.js`): Datei wählen →
  Umsatzliste → je Umsatz „→ Buchungsentwurf" (categorize auf Zweck, Richtung aus Auszug
  überschreibt, `buildVorschlag`, Vorschlagskarte). i18n de/en, CSS, SW `v52→v53`.
- **+11 Tests** (Lastschrift/Gutschrift, IBAN, Valuta, Zweck/Gegenname, mehrzeiliger :86:,
  Extraktion, leerer Auszug) → **314/314 grün**.

**Ehrlich offen / NICHT geprüft:** übliche MT940-Felder abgedeckt, KEINE vollständige
SWIFT-Validierung (exotische Bank-Dialekte können abweichen); UI nicht headless-E2E. USt-Satz
aus reinem Zahlungsfluss nicht ableitbar (Nutzer/Heuristik ergänzt). **Folgeschritte:**
CAMT.053 (XML, via vorhandenes block/tag-Muster), **echter Zahlungsabgleich** auf offene
Forderungen/Verbindlichkeiten (macht Ist-EÜR §4(3) + offene Posten komplett).

---

## 2026-06-16 — E-Rechnung (Schritt 2): Empfang/Einlesen (CII + UBL) → Vorschlag

**Was getan**
- **`src/domain/erechnungLesen.js`** (neu, rein/getestet): `parseEingangsrechnung(xml)` liest
  eine eingehende XRechnung in **beiden** Syntaxen (UN/CEFACT **CII** und OASIS **UBL**),
  namespace-tolerant über lokale Element-Namen + Block-Scoping (Verkäufer/Summen/Steuer).
  Extrahiert Nummer, Datum (102→ISO), Lieferant, Netto/USt/Brutto (Cent), USt-Satz, Format,
  Confidence. `eingangsrechnungExtraktion()` mappt aufs `ai/extract`-Format →
  bestehender `buildVorschlag` nutzbar. `erkenneFormat()`.
- **UI:** Karte „E-Rechnung empfangen (XRechnung XML)" in Belegen (`documents.js`): .xml wählen
  → parsen → Lieferant via `categorize` → Buchungsvorschlag (Vorschlagskarte, Autonomie/
  Datenschutz-Modus greifen mit). i18n de/en. SW `v51→v52` (+ `erechnungLesen.js` precached).
- **+15 Tests** → **303/303 grün**, darunter **CII Round-Trip** (eigene Erzeugung wieder
  eingelesen) und ein handgeschriebenes **UBL**-Beispiel + Unbekannt-Format-Fall.

**Ehrlich offen / NICHT geprüft:** best-effort Text-/Regex-Extraktion (kein Schema-Parsing,
kein CDATA/Kommentar-Handling), **nicht KoSIT-validiert**; **ZUGFeRD-PDF wird nicht ausgepackt**
(nur reine XML); UI nicht headless-E2E. Mehrsatz-Eingangsrechnungen werden auf einen
USt-Satz/Vorschlag vereinfacht (Entwurf, Nutzer prüft). **Folgeschritte:** ZUGFeRD-PDF-Extraktion
(PDF/A-3, evtl. nicht build-frei); Bankimport (CAMT/MT940) + Zahlungsabgleich.

---

## 2026-06-16 — E-Rechnung (Schritt 1): XRechnung/CII-Erzeugung aus Rechnung

**Was getan**
- **`src/domain/erechnung.js`** (neu, rein/getestet): `baueXRechnungCII(rechnung)` erzeugt aus
  dem vorhandenen Rechnungs-Dokument (`baueRechnung`) eine **UN/CEFACT CII-XML**, Profil
  EN16931/XRechnung 3.0 — mit Kern-Pflichtfeldern (Rechnungsnr. BT-1, Datum BT-2, Leistungs-
  datum, Verkäufer/Käufer + Adressen, USt-IdNr. BT-31, IBAN BT-84, Steueraufschlüsselung je
  Satz, Summen). `splitAdresse()` zerlegt Freitext-Adressen best-effort; XML-Escaping;
  Kleinunternehmer → Kategorie „E" + §19-Befreiungsgrund. `xRechnungDateiname()`.
- **UI:** Download-Knopf „XRechnung (XML)" im Rechnungs-Dokument (`orders.js`, `downloadText`).
  i18n de/en. SW `v50→v51` (+ `erechnung.js` precached).
- **+19 Tests** (Adress-Split, Regelfall 19%+7% inkl. Tag-Balance/Wohlgeformtheit & Escaping,
  Kleinunternehmer) → **288/288 grün**.

**Ehrlich offen / NICHT geprüft:** **NICHT gegen den KoSIT-Validator/Schematron geprüft**
(kein Validator in der Bau-Umgebung) — daher „XRechnung-**orientiert**", vor echtem Versand
validieren. Freitext-Adress-Split ist heuristisch (PLZ/Ort). UI-Download nicht headless-E2E.
**Folgeschritte:** ZUGFeRD (CII in PDF/A-3 einbetten — braucht PDF-Lib, evtl. nicht build-frei);
XRechnung-**Empfang** (eingehende XML parsen → Buchungsvorschlag); Bankimport (CAMT/MT940).

---

## 2026-06-16 — Datenschutz-Modi: AVV-Hinweis (Art. 28/32 DSGVO) — Topic abgeschlossen

**Was getan:** „Recht & Doku" (`ui/views/legal.js`) DSGVO-Sektion um zwei Punkte ergänzt:
**Auftragsverarbeitung (Art. 28)** — Anbieter (Google Cloud Vision, Mistral AI) sind bei
aktiver EU-KI Auftragsverarbeiter; Nutzer muss vor produktiver Nutzung mit Personendaten den
AVV/DPA abschließen, bleibt Verantwortliche/r. **Pseudonymisierung als techn. Maßnahme
(Art. 32)** — beschreibt den Datenschutz-Modus. SW `v49→v50`. Tests unverändert **269/269**
(reine Doku-Strings, keine Logik). **Datenschutz-Modi damit funktional rund** (KONZEPT §6.3).

**Ehrlich:** reine in-App-Doku, kein automatischer Test; AVV/DPA-Abschluss liegt beim Nutzer.

---

## 2026-06-16 — Datenschutz-Modi: Transparenz (§6.3) — Bericht + Vorschau

**Was getan**
- **`pseudonym.maskierungsBericht(map)`** (rein, getestet): fasst zusammen, wie viele
  Identifikatoren ersetzt wurden, aufgeschlüsselt nach Typ — **ohne Klartextwerte** (nur
  Zähler; Typ notfalls aus der Token-Form `[[TYP_N]]` abgeleitet).
- **Transparenz-Vorschau in Belegen** (`documents.js`): bei aktivem Datenschutz-Modus zeigt
  die Vorschlagskarte ein aufklappbares „🛡 N Identifikatoren pseudonymisiert an die EU-KI
  gesendet (2× Person, 1× Firma …)" samt **Vorschau des tatsächlich gesendeten Textes**
  (deterministisch dieselbe Maskierung wie der Versand). i18n de/en, CSS, SW `v48→v49`.
- **+5 Tests** → **269/269 grün**.

**Ehrlich offen / NICHT geprüft:** `maskierungsBericht` node-getestet; die UI-Vorschau
(documents.js) ist **nicht headless-E2E** geklickt. Vorschau gilt für den Kontierungs-
Belegtext (Hauptversand); die Berater-Begründung maskiert separat (kein eigener Badge).
Folgeschritte (KONZEPT §6.3): AVV-Hinweis im Datenblatt; Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 2: Pipeline-Verdrahtung + Modus

**Was getan**
- **Kritische Review von `src/ai/pseudonym.js`** → gehärtet (alle Round-Trips waren schon
  korrekt): opt-in **Wortgrenzen-Modus** (`{wortgrenze:true}`, Unicode-`\p{L}` korrekt für
  ä/ö/ü/ß) gegen Teilwort-Treffer (z.B. „Anna" in „Annahme"); **First-Char-Index** (Perf statt
  O(Text×Anker)); gemeinsames **`ANKER_TYP`**-Vokabular. Standard bleibt exakt (datenschutz-
  sicherste Richtung). +7 Tests.
- **`src/ai/anker.js`** (neu): `baueAnker({kunden,mitarbeiter,firma})` (rein, getestet) baut
  typisierte Anker (PERSON/FIRMA/EMAIL/IBAN/USTID/STEUERNR/ADRESSE), entdoppelt, < 3 Zeichen
  verworfen; `ladeAnker()` zieht CRM + Firmenprofil (Browser/IndexedDB).
- **Verdrahtung:** `mistral.categorize(text, idx, {anker})` maskiert den GESENDETEN Belegtext
  (Antwort `{konto,richtung}` → kein reidentify); `berater.begruendeBuchung(kontext, {anker})`
  maskiert Beschreibung/Belegtext und **re-identifiziert** die formulierte Antwort.
  Lokale Extraktion/Vorschlag laufen weiter auf dem ECHTEN Text.
- **Setting** `datenschutzModus` (`aus`|`pseudonym`, Default `aus`) in `state.js`; Umschalter in
  Einstellungen (`shell.js`) + i18n de/en; `documents.js` lädt Anker nur bei `pseudonym` und
  reicht sie an beide KI-Aufrufe. SW-Cache `v47→v48` (+ `pseudonym.js`/`anker.js` precached).
- **Konzept nachgereicht:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (Modi + Bau-Reihenfolge §6).
- **+11 Tests** (baueAnker, Wortgrenze, Belegtext-Komposition) → **264/264 grün**.

**Ehrlich offen / NICHT geprüft:** reine Logik node-getestet; `ladeAnker()`, Settings-Schalter
und documents.js-Verdrahtung **nicht headless-E2E**, Mistral nicht live getestet. Over-Masking-
Restrisiko bei sehr kurzen/gängigen Namen (Wortgrenze mildert, Round-Trip bleibt verlustfrei).
Folgeschritte (KONZEPT §6.3): maskierten Text vor Senden anzeigen (Transparenz), AVV-Hinweis,
Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 1: Pseudonym-Logik

**Was getan**
- Reines Logik-Modul **`src/ai/pseudonym.js`** angelegt (Datenschutz-Modi, Bau-Schritt 1):
  `tokenize()` ersetzt **exakte** bekannte Identifikatoren (Anker) durch **stabile** Token
  `[[TYP_N]]`, `reidentify()` macht es verlustfrei rückgängig. Longest-Match (überlappende
  Anker), Sonderzeichen-/Regex-sicher (Links-nach-rechts-Scan, kein Regex), Token-Nummern
  je Typ in Reihenfolge des ersten Auftretens, optionales `createRegistry()` für
  aufrufsübergreifend stabile Token, `normalizeAnchors()` (entdoppelt, Typ-Normalisierung).
  Kein Netz, keine Krypto im Modul — reine Abbildung; Übertragung bleibt opt-in.
- **23 Node-Tests** in `tests/run.mjs` ergänzt; nach Merge mit main → **246/246 grün**
  (Round-Trip, stabile Token, Longest-Match, Sonderzeichen, Register-Stabilität inkl.
  Präfix-Sicherheit `_1` vs `_11`, Objekt-Map in `reidentify`).
- main war beim PR-Merge weit voraus (223 Tests, SW v47, neue Module rechnung/pruefung/
  rechtsregeln/berater/importworkfloh); sauber zurückgemergt, alle Tests beider Seiten erhalten.

**Hinweis zur Vorlage:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (§6 Bau-Reihenfolge) existiert im
Repo (noch) nicht — gebaut wurde strikt nach der selbsttragenden Aufgaben-Spezifikation.
(`PULS.md §0 Brainstorming` existiert inzwischen auf main.) Diese Lücke ehrlich offen lassen.

**Offen / Nächstes:** Konzept-Doku `docs/KONZEPT_DATENSCHUTZ_MODI.md` nachreichen (Modi +
Bau-Reihenfolge festschreiben); Bau-Schritt 2 = Anker-Quelle aus CRM/verschl. Speicher
(`crm-store`) + Verdrahtung in die KI-Pipeline **vor** `ai/mistral.js` (Kontierung) und
`ai/berater.js` (Steuer-Assistent), mit opt-in/Bestätigung; reidentify auf die KI-Antwort.
**Nicht im Browser E2E getestet** — Kernlogik node-getestet.

---

## 2026-06-14 — EÜR nach Zufluss/Abfluss (§4 Abs.3 EStG, Ist-Prinzip)

**Was getan**
- `src/domain/taxes.js`: NEU `computeEURIst(buchungen, idx, periode, opts)` — Betriebseinnahmen/
  -ausgaben beim **Geldfluss** (§11 EStG, brutto), gerechnet aus Geldkonten-Bewegungen
  (Kasse/Bank). Erfasst direkte Barbuchungen **und Zahlungen früher gebuchter Rechnungen**
  (Forderung/Verbindlichkeit) zum Zahlungszeitpunkt; Privateinlagen/-entnahmen (Eigenkapital)
  zählen nicht. Reine, node-getestete Funktion.
- Reports: zusätzliche Karte „EÜR nach Zufluss/Abfluss (§4 Abs.3)"; bestehende periodengerechte
  EÜR bleibt als Soll-Sicht. i18n de/en. SW-Cache `v32→v33`.
- `tests/run.mjs`: +5 (Abfluss-Ausgabe, Rechnung zählt nicht, Zahlung als Einnahme, Privateinlage
  ausgeschlossen, Entwurf/Periode). **Gesamt 208/208 grün**.

**Verifiziert:** `node tests/run.mjs` → 208/0; `node --check`.
**EHRLICH:** vereinfachtes Ist-Modell für die üblichen Buchungsstile; Sonderfälle (durchlaufende
Posten, Anzahlungen, Sachentnahmen) nicht abgebildet — im Zweifel Berater. Geldkonten-Set
(1000/1200) und Forderung/Verbindlichkeit (1400/1600) per opts konfigurierbar.

---

## 2026-06-14 — DATEV-EXTF formkonform gehärtet (Konto/Gegenkonto + Steuerschlüssel)

**Was getan**
- `src/domain/export.js`: NEU `buildDatevExtf()` — **EXTF-Envelope** (Header `"EXTF";700;21;
  "Buchungsstapel";…` + Spaltenüberschriften) + Datenzeilen im **Konto/Gegenkonto-Brutto-Modell**.
  NEU `datevBuchungssatz()` (rein, testbar) verdichtet USt-Split-Buchungen zu EINEM Brutto-Satz
  mit **BU-/Steuerschlüssel** (SKR03: Vorsteuer 9/8, Umsatzsteuer 3/2), Belegdatum als TTMM.
- Reports-Export-Button nutzt jetzt EXTF (`EXTF_Buchungsstapel_*.csv`), Label „DATEV (EXTF)".
  Altes `buildDatevCsv` bleibt erhalten.
- SW-Cache `v31→v32`. `tests/run.mjs`: +7. **Gesamt 203/203 grün**.

**Verifiziert:** `node tests/run.mjs` → 203/0; `node --check`.
**EHRLICH (wichtig):** KEIN vollständig zertifiziertes 116-Spalten-EXTF. Steuerschlüssel-Mapping
deckt Standardsätze (0/7/19 %) ab und ist Kontenrahmen-/Versionsabhängig — **vor Übergabe mit
Berater/DATEV verifizieren**.

---

## 2026-06-14 — WorkFloh-Import (Empfangsseite) + Anleitung + ISO/IEC-Beleg + PW-Layout

**Was getan (mehrere PRs):**
- **Gebrauchsanleitung** als Menüpunkt „Anleitung" (Installations- + Schritt-für-Schritt-Teil)
  mit **Copy-Buttons** für Splitscreen. Hinweis „Beispieltexte…" in App-Grün/fett.
- **ISO/IEC-Beleg** im Siegel — korrekt als **Anbieter**-Zertifizierung (Google Cloud/Mistral),
  nicht als Eigen-Zertifikat. „Passwort ändern"-Layout (einspaltig + Abstand).
- **WorkFloh-Import (Empfangsseite)**: `src/domain/importworkfloh.js` (rein, node-getestet)
  + `crm-store.importWorkFloh` (Dedupe über externId/externNummer, USt-Ergänzung, Status
  „angelegt"); UI-Karte in Aufträgen („Aus WorkFloh importieren", JSON). Felder `externId`
  (Kunde) / `externNummer` (Auftrag) ergänzt. **Schema-Vertrag**: `docs/WORKFLOH_IMPORT.md`
  (WorkFloh exportiert dorthin — „Verknüpfung mit Buchhaltungssoftware"). +7 Node-Tests.

**Ehrlich offen:** WorkFloh-Repo war in dieser Sitzung nicht zugänglich (Scope + 403) → Schema
unilateral von BookLedgerPro definiert; WorkFloh-Seite muss darauf exportieren (oder Repo/Beispiel
nächste Sitzung). Import-Persistenz (IndexedDB) nur UI-testbar; Mapping node-getestet. SW `v47`,
Tests **223/223**.

---

## 2026-06-14 — Deckblatt/Siegel, neue 3D-Assets & „Passwort ändern" (Envelope-Krypto)

**Was getan (mehrere PRs):**
- **Deckblatt/Datenblatt** vor dem Login + Menüpunkt „Über" + **Konformitäts-Siegel** (nur
  nachprüfbare Aussagen: EU-Datenresidenz Vision EU/Mistral EU, AES-GCM-256 lokal, DSGVO/GoBD,
  Links zu echten Compliance-Programmen — KEIN erfundenes Zertifikat). Siegel auch in Recht & Doku.
- **Neue 3D-Assets:** ornamentaler Schlüssel (`onboard-key.png`) beim Passwort-Festlegen;
  Mycel-Buch-**Titelbild** (`cover.png`) oben aufs Deckblatt.
- **Tresor auf Envelope-Verschlüsselung umgestellt** (`src/core/vault.js`): zufälliger DEK
  verschlüsselt alle Daten, Passwort-KEK „wickelt" nur den DEK ein. **„Passwort ändern"** in
  den Einstellungen wickelt den DEK neu ein → **keine Daten-Neuverschlüsselung, Mandant-ID &
  Shamir bleiben stabil**. Alt-Tresore (v1) werden beim Entsperren **transparent migriert**
  (Daten unberührt, gleiche Mandant-ID). +6 Node-Tests (Envelope wrap/unwrap/PW-Wechsel).

**Ehrlich offen:** Bilder sind groß (~2 MB, optional optimieren). Envelope: bestehende v1-Migration
ist im Code node-getestet auf Krypto-Ebene; die DB-/Browser-Migration selbst nicht headless-E2E.
SW-Cache → `v42`, Tests **216/216**.

---

## 2026-06-14 — Geführter Browser-Sichttest (DeX/Chrome) + 5 Live-Fixes

**Was getan:** Kompletter, gemeinsam mit dem Nutzer durchgeführter Sichttest der neuen Features
auf der deployten PWA. **Bestätigt:** Beleg→Buchung-Pipeline end-to-end (Erkennung→Kontierung
4930/1576/1200, Konf. 90 %, Auto-Entwurf), Plausibilität/Spielraum, Entwurf-Lebenszyklus
(speichern/bearbeiten/löschen/festschreiben/storno), KI-Begründung mit §-Bezug (Mistral EU),
§14-Rechnung druckbar (Nr. 2026-0001), USt-Verprobung/EÜR-Ist/USt-VA/Audit/DATEV-EXTF,
Zeiterfassung (Std-Summe + Kosten korrekt).

**Im Test gefunden & sofort behoben (gemergt #23–#27):**
1. Storno-Endlos-Kaskade → Storno-Gegenbuchung nicht erneut stornierbar (#23).
2. KI-Begründung nannte Konto-Namen falsch → echte Kontierung mit Namen an Mistral (#24).
3. Firmenprofil „Gespeichert ✓" erschien nicht (Re-Render) → Flag überlebt Re-Render (#25).
4. Auftrag: Position entfernen fehlte + Status-Etikett umgebrochen (#26).
5. „Steuer-Assistent (Claude)/Anthropic" veraltet → **Mistral (EU)**; tote Claude-Keys raus (#27).

**Erkenntnis (kein Bug):** „0 h/0 €" beim Mitarbeiter war ein **Duplikat** „Klaus Nitzsche";
der korrekte zeigt 41h 40m / 1.250 € — Summen/Kosten rechnen korrekt.

**Verifiziert:** alles live im Browser bestätigt; `node tests/run.mjs` → 210/210; SW `v38`.
**Offen:** EXTF/EÜR-Ist sind vereinfacht (nicht zertifiziert); ELSTER-Einreichung weiterhin nur
Datenpaket; Sage 5b–d. Optional: Kleinbetrag-`betragCent` an KI-Begründung der UI verdrahten.

---

## 2026-06-14 — Rechtsregel-Set erweitert (mehr §-Grundlagen für KI-Berater)

**Was getan**
- `src/domain/rechtsregeln.js`: +7 kuratierte Regeln — Arbeitszimmer/Homeoffice (§4(5) 6b/6c),
  Fortbildung (§4(4)), Anlagevermögen/AfA >800 € (§7), Betriebsveranstaltung 110 € (§19(1)1a),
  nicht abziehbar: Bußgelder/privat (§4(5)8 / §12), Kleinbetragsrechnung ≤250 € (§33 UStDV,
  betragsbasiert). Bessere Grounding-Abdeckung für `begruendeBuchung`.
- `tests/run.mjs`: +5 (Fortbildung, Arbeitszimmer, Bußgeld, Kleinbetrag-Grenze). **196/196 grün**.

**Verifiziert:** `node tests/run.mjs` → 196/0; `node --check`.
**Hinweis:** UI reicht aktuell `betragCent` nicht an `begruendeBuchung` → Kleinbetragsregel greift
nur, wenn der Betrag mitgegeben wird (Logik vorhanden, optionale UI-Verdrahtung später).

---

## 2026-06-14 — Rechnungsdokument mit §14-UStG-Pflichtangaben (ausstellbare Rechnung)

**Was getan** (wichtige Produkt-Lücke: bisher nur Buchung, kein Rechnungsdokument)
- NEU `src/domain/rechnung.js` (rein, node-getestet): `baueRechnung({auftrag,kunde,firma,nummer,
  datum,leistungsdatum,kleinunternehmer})` → strukturiertes Dokument (Positionen mit Netto,
  Steuerzeilen je Satz, Summen, Kleinunternehmer-Variante ohne USt); `pflichtangaben(rechnung)`
  prüft § 14 Abs. 4 UStG (Aussteller-Name/Anschrift, Steuernr./USt-IdNr., Empfänger, Datum,
  fortlaufende Nummer, Leistungsbeschreibung, Leistungsdatum, Steuerausweis); `formatRechnungsnummer`.
- `crm-store`: **fortlaufende Rechnungsnummer** (`naechsteRechnungsnummer`, kv `rechnungSeq`,
  Format JAHR-NNNN) — bei `rechnungAusAuftrag` vergeben + `rechnungNummer`/`rechnungDatum` am Auftrag.
- **Firmenprofil** (`settings.firma`: name, anschrift, steuernummer, ustId, iban) — Formular in
  den Einstellungen (verschlüsselt gespeichert).
- **Orders-UI:** Knopf „Rechnung anzeigen" → druckbares Rechnungs-Dokument (window.print),
  §14-Lücken als Hinweis, Kleinunternehmer-Hinweis. Print-/Layout-CSS.
- i18n de/en; SW-Cache `v30→v31`, `rechnung.js` in CORE_ASSETS.
- `tests/run.mjs`: +11 (Aufbau, Summen mehrerer Sätze, Pflichtangaben vollständig/unvollständig,
  Kleinunternehmer, Nummern-Format). **Gesamt 191/191 grün**.

**Verifiziert:** `node tests/run.mjs` → 191/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Rechnungs-UI/Druck nicht headless-E2E geklickt; `naechsteRechnungsnummer`/
Firmenprofil-Persistenz nutzen IndexedDB/Vault (nicht node-getestet, Logik minimal).

**Offen / Nächstes:** EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifizieren; Regel-Set erweitern.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Entwurf bearbeiten & löschen (geschlossene Lücke im Bedien-Lebenszyklus)

**Was getan** (Feinschliff: wichtige Bedien-Lücke)
- Entwürfe konnten angelegt, aber weder **gelöscht** noch **bearbeitet** werden (durch die
  „immer speicherbar"-Änderung verschärft). Jetzt:
  - `store.deleteEntwurf(id)` — löscht nur Entwürfe (festgeschrieben → nur Storno).
  - `journal.formularAusBuchung(buchung, idx)` — **reine, node-getestete** Rekonstruktion der
    Formularfelder (Soll/Haben/Brutto/USt) aus den Zeilen, inkl. USt-Split-Erkennung.
  - Journal-Tabelle: pro Entwurf Knöpfe **Bearbeiten** (Formular vorbefüllen, speichert per id
    in-place) und **Löschen**; Formular-Titel/Button passen sich an; **Abbrechen** im Edit-Modus.
- i18n de/en; SW-Cache `v29→v30`.
- `tests/run.mjs`: +6 `formularAusBuchung` (Ausgabe/Einnahme mit USt, ohne USt, Notizfelder).
  **Gesamt 180/180 grün**.

**Verifiziert:** `node tests/run.mjs` → 180/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Journal-UI (Edit/Delete-Knöpfe) nicht headless-E2E geklickt; `deleteEntwurf`
nutzt IndexedDB (nicht node-getestet) — Logik ist aber minimal und analog zu bestehenden Pfaden.

**Offen / Nächstes:** EÜR §4(3) + DATEV-EXTF; Regel-Set erweitern. **Details: `docs/PULS.md`.**

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
