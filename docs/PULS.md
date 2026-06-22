# PULS.md — Lückenloser Nachfolge-Brief (Stand-Schnappschuss)

> **Diese Datei ist der zentrale Andockpunkt für jede neue Sitzung.** Sie ergänzt
> `CLAUDE.md` (Regeln/Verträge), `ROADMAP.md` (Phasen-Checklisten) und `docs/SESSIONS.md`
> (Verlauf). Wer hier + im obersten SESSIONS-Eintrag liest, weiß **genau, wo es weitergeht**.
> Pflege: bei Sitzungsende oben „Letzter Stand" + „Nächste konkrete Schritte" aktualisieren.

---

## ✉️ BRIEF FÜR DIE NEUE SITZUNG (2026-06-22, Abend) — Demo komplett + UI/Mobil-Politur, Rest browser-zu-verifizieren

> **Schnell-Andock:** CLAUDE.md (Regeln/Verträge) + ROADMAP.md + diese Datei (oben) + obersten
> SESSIONS-Eintrag lesen. Branch dieser Linie: `claude/sage-verify-belegruichter-ui-bo2wzy`
> (bzw. der für die Sitzung vorgegebene). Vor jedem Push `node tests/run.mjs`. Freibrief gilt:
> sinnvoll & CI grün & gefahrlos → selbst mergen (squash). **Der Nutzer testet auf Handy/Tablet/
> Monitor und schickt Screenshots — in einer FRISCHEN Sitzung sind Bilder wieder sichtbar
> (diese Sitzung hatte das Bild-Limit erreicht, nur Pixel-Analyse möglich).**
>
> **Eckdaten:** Endpoint `https://lausiklauskn-png.github.io/BookLedgerPro/` · DB-Suffix `bookledgerpro`
> (NIE ändern) · unsere nodeId `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ` · **main `5c82dca`** ·
> **Tests 2101/2101 grün** · **SW-Cache `v183`**.
>
> **Diese Sitzung gebaut & gemerged (PRs #226–#233):**
> - **#226** Beleg-OCR → SBKIM-Richter in der UI verdrahtet (`documents.js`, Knopf „Konto-Vorschlag
>   (SBKIM-Richter)") + Sages Gute-Nacht-Karte (seq 31) quittiert (`ack[Sage]=31`, SIGNAL seq 19).
> - **#227** Temporäre In-App-Test-Marken (`src/ui/testmarke.js`, „🧪 Test offen"→„✅ getestet",
>   localStorage; `TEST_MARKEN_AKTIV=false` blendet alle aus). IDs: `beleg-ocr`, `beleg-richter`,
>   `sbkim-konten`, `sbkim-knoten`. Liste: `docs/TESTPLAN.md`.
> - **#228** „Quartal"-Demo (3. Szenario in `demodaten.js`/`-store.js`, im Test-Modus wählbar):
>   volles Q1 2026, alle Bereiche (19/7/steuerfrei §4, §13b, Bewirtung 70/30, Personal, AfA, GWG…)
>   + GoBD-**Storno** einer Doppelbuchung + Stammdaten (Kunden/Aufträge/Mitarbeiter/Eingangsrechn.).
> - **#229** Beleg-Scans der Quartal-Demo (`assets/demo/*.jpg`): 5 an Buchungen verknüpft, 1
>   Blumen-Quittung **unverbucht** als OCR-/Richter-Test-Target.
> - **#230** ELSTER-Links 404 behoben → stabile Formular-Übersicht.
> - **#231** Vollbild-**Zentrierung** behoben (Flexbox `min-width:0` auf `.content`/`.app-body`;
>   `.card.no-pad` → `overflow-x:auto`).
> - **#232** **Handyformat**: Navigation als Hamburger-Schublade ☰ (`shell.js` + `@media ≤640`).
> - **#233** Mobil-Politur: `.btn-row{align-items:center}` (Buttons nicht mehr höhengestreckt),
>   `.mandant`-Chip + Header-Buttons `nowrap`, Lampen-Labels (LEBT/VERKEHR/FREMD/SIEGEL) im
>   Hochformat ausgeblendet.
>
> **⏭ NÄCHSTE KONKRETE SCHRITTE (mit Nutzer, browser-zu-verifizieren):**
> 1. **Offener UI-Wunsch (Buttons/Container im Hochformat):** Der Nutzer möchte, dass Buttons sich
>    **einzeln** positionieren und der **Gesamtcontainer nicht in der Höhe wächst**. Meine offenen
>    Rückfragen (WO: Tabellen-Aktionen / Buchungsvorschlag / Bankimport / überall — WIE: eine Zeile
>    + seitlich scrollen / kompakter umbrechen / Icons) sind **noch offen**. Empfehlung als Default:
>    Tabellen-Aktions-Buttons (`.btn-row` in `card no-pad`-Tabellen) im `@media ≤640` auf **eine Zeile
>    + `overflow-x:auto`** statt Umbruch → Zeilenhöhe bleibt niedrig. Erst mit Nutzer bestätigen.
> 2. **Container-Breite auf großem Monitor:** Nutzer findet die zentrierte 880-px-Spalte „nicht in
>    voller Breite". Entscheidung offen — **a)** 880 lassen · **b)** ~1200 · **c)** volle Breite.
>    Einzeiler an `--maxw` in `assets/tokens.css` (aktuell `--maxw: 880px`).
> 3. **Sicht-Tests abschließen** (Test-Marken abhaken): Quartal-Demo durchklicken (Journal/EÜR/USt/
>    Aufträge/Payables/Storno + 🔗-Belege + OCR/„Konto-Vorschlag" auf der unverbuchten Quittung).
>    Hinweis: `beleg-ocr`-Marke nur sichtbar mit hinterlegtem Google-Vision-Schlüssel; `beleg-richter`
>    erst nach erzeugtem Buchungsvorschlag.
> 4. **Sage cap/needs** weiter abwarten (liegt bei Sage) → dann Badge `Schichten` verifizieren.
>
> Danke für die gute, iterative Zusammenarbeit — bis zur nächsten Sitzung!

---

## 🟢 LETZTER STAND (2026-06-22, Forts.) — Test-Marken + „Quartal"-Demo (volles Q1, alle Bereiche)

> **Zwei Nutzer-Wünsche umgesetzt:**
>
> **A) In-App-Test-Marken** (PR #227, gemerged): Modul `src/ui/testmarke.js` — kleine anklickbare Marke
> „🧪 Test offen" → „✅ getestet" (localStorage), **co-located** beim jeweiligen Knopf (fehlt der Knopf,
> fehlt die Marke). Marken bei: `beleg-ocr`, `beleg-richter` (documents.js), `sbkim-konten`/`sbkim-knoten`
> (sbkimsuche.js). Liste/Anleitung: `docs/TESTPLAN.md`. Master-Schalter `TEST_MARKEN_AKTIV=false` blendet alle aus.
>
> **B) „Quartal"-Demo** (offener PR, browser-zu-verifizieren): drittes Demo-Szenario neben klein/gross.
> Im **Test-Modus** beim Anlegen eines Test-Tresors wählbar („Mit Demo-Daten Vierteljahr"). Volles **Q1 2026**
> quer durch **alle** Bereiche: 21 Buchungen (19/7/steuerfrei §4, **§13b Reverse-Charge**, Bewirtung 70/30,
> Kfz/Tank, Telefon, Reise 7+19, **Personal Brutto-Methode**, AfA, GWG, Bankgebühren) + **Storno** einer
> versehentlichen Doppelbuchung (GoBD) + Stammdaten (3 Kunden, 3 Aufträge inkl. berechnet+Teilzahlung,
> 2 Mitarbeiter+Zeiten, 3 Eingangsrechnungen bezahlt/offen/storniert). Alles über die **echten** Speicher-APIs
> (`saveEntwurf→festschreiben`, CRM-/Payables-APIs) → GoBD-Hash-Kette real. Dateien: `src/domain/demodaten.js`
> (+`-store.js`), `src/ui/lock.js`, i18n, **+21 Node-Tests = 2096/2096 grün**. SW-Cache **v177→v178**.
>
> **C) Beleg-Scans in der Quartal-Demo** (erledigt): 6 vom Nutzer KI-generierte Belege komprimiert nach
> `assets/demo/` (JPEG ~1000px, zusammen ~930 KB). 5 davon (Tank/Bürobedarf/Bewirtung/§13b-Cloud/Hotel) hängen
> über `belegRef`+`linkBeleg` an den **passenden** Buchungen (Beleg VOR dem Festschreiben → Belegprinzip in der
> Hash-Kette); die **Blumen-Quittung (50 €)** liegt bewusst **unverbucht** als OCR-/Richter-Test-Target.
> Glue fail-soft (offline/headless → Buchung ohne Beleg). +5 Tests → **2101/2101 grün**. SW v178→v179.
>
> **⏭ NÄCHSTE SCHRITTE (alles browser-zu-verifizieren):** (1) Quartal-Demo im Test-Modus durchklicken —
> Journal/EÜR/USt/Aufträge/Payables/Storno **und** die angehängten Belege (🔗) + OCR/„Konto-Vorschlag" auf der
> unverbuchten Blumen-Quittung. (2) Test-Marken abhaken (belegRichter/OCR/SBKIM-Suche). (3) Sage cap/needs abwarten.

---

## 🟢 STAND (2026-06-22) — OCR→Richter-Brücke in die UI verdrahtet + Sage seq 31 quittiert

> **Beide nächsten Schritte des Vorgänger-Briefs erledigt:**
>
> **1. UI-Verdrahtung von `belegRichter` (Hauptaufgabe, browser-zu-verifizieren).** Im Beleg-Workflow
> (`src/ui/views/documents.js`) sitzt jetzt in **jeder** Buchungsvorschlag-Karte ein aufklappbarer
> Block **„Konto-Vorschlag (SBKIM-Richter)"** mit Knopf „Konto vorschlagen". Er ruft `belegKontierung()`
> (aus `src/ai/belegRichter.js`) mit dem **opt-in geladenen Embedder** (`loadEmbedder`, wie die SBKIM-Suche):
> OCR-/Belegtext → semantische Anfrage → On-Device-Vorfilter → optionaler Mistral-EU-Richter (BYOK, fail-soft)
> → **ranked SKR03-Konten** mit Score + (bei Richter) Begründung. Greift überall, wo es Belegtext gibt
> (Schnellerfassung, E-Rechnung, Bankimport-Vorschlag, OCR-Beleg). Rein informativ — ändert die Buchung NICHT.
> - i18n DE+EN (`docs.richter*`), `belegRichter.js` in die SW-Precache-Liste aufgenommen,
>   **`CACHE_VERSION` v175 → v176** (Shell berührt). Tests **2075/2075 grün** (unverändert; reine UI-Verdrahtung).
> - ⚠️ **Noch NICHT im Browser durchgeklickt** (kein Headless-Browser in der Bau-Umgebung): das einmalige
>   Modell-Laden (~30 MB) + der echte Mistral-Richter-Lauf sind nur statisch/node-seitig geprüft.
>
> **2. Briefkasten-Ritual.** Sages `SIGNAL.json` = **seq 31** (war 30) → neue **Gute-Nacht-/Dankeschön-Karte**
> (kein technischer Auftrag, lockere Rück-Quittung erbeten). Quittiert: `ack[Sage]` 30 → **31**, Antwort-Karte
> in `AUSTAUSCH-Sage.md` Abschnitt 18, unsere `SIGNAL.json` `seq` 18 → **19** (Bau-Bericht belegRichter-UI).
> Sages `spore.json` trägt **weiterhin nur `domainVector`** (live ✔ VALID gegengeprüft, **noch kein cap/needs**)
> ⇒ Drei-Schichten-Faden bleibt **allein bei Sage** offen; Badge `Schichten` noch nicht verifizierbar.
>
> **⏭ NÄCHSTE KONKRETE SCHRITTE:**
> 1. **Im Browser durchklicken** (belegRichter-UI): Beleg-OCR/Schnellerfassung → „Konto-Vorschlag (SBKIM-Richter)"
>    → Modell-Laden bestätigen → Konten-Kandidaten prüfen (ohne Mistral = Vorfilter; mit = Richter-Urteil).
> 2. **Briefkasten** wie immer: Sages `spore.json` auf cap/needs prüfen; sobald vorhanden → Knopf
>    „🜲 mein Knoten ↔ Netz" → Badge **`Schichten`** verifizieren + Erfolgs-Quittung an Sage.
> 3. Sonst KI-/Recht-Reste lt. „Offen"-Liste (strenge Zufluss/Abfluss-EÜR, PDF-Rechnung aus Auftrag, DATEV-EXTF-Mapping).

---

## 🟢 STAND (2026-06-21) — Briefkasten geprüft + OCR→Richter-Brücke gebaut

> **Briefkasten-Start-Ritual gemacht:** Sages `SIGNAL.json` = unverändert **seq 30** (bereits quittiert,
> `ack[Sage]=30`), Sages `spore.json` trägt **weiterhin nur `domainVector`** — **noch kein cap/needs**.
> ⇒ Drei-Schichten-Handshake bleibt **allein bei Sage** offen; bei uns kein offener Punkt, kein Push nötig.
>
> **Wartezeit produktiv:** die bislang fehlende Brücke **„Beleg-OCR → Embedding → Richter"** gebaut —
> neues Modul **`src/ai/belegRichter.js`**:
> - `buildBelegQuery(ocrText, extracted)` (rein, testbar): rohes OCR → knappe semantische Anfrage
>   (Lieferant führt; Beträge/Datum/IBAN/Telefon/Floskeln entrauscht; USt-Hinweis in Worten).
> - `belegKontierung(...)`: volle Kette OCR-Anfrage → On-Device-Einbettung → `sbkimHybridSearch`
>   (Vorfilter + Richter opt-in, EU/Mistral, **fail-soft**) gegen die SKR03-Konten. Node-testbar via
>   injizierten `embedQuery`/`embedPassage`/`_chat` (kein CDN).
> - **Tests +20 → `node tests/run.mjs` = 2075/2075 grün.** Keine Shell-/SW-Änderung → **kein** v-Bump.
>
> **⏭ NÄCHSTE KONKRETE SCHRITTE:**
> 1. **Briefkasten-Ritual** wie immer: Sages `spore.json` auf cap/needs prüfen (bei `seq>30` Briefe
>    quittieren). Sobald Sage cap/needs hat → in App Badge **`Schichten`** verifizieren + Quittung.
> 2. **UI-Verdrahtung von `belegRichter`** (noch offen, **browser-zu-verifizieren**): im Beleg-Workflow
>    (`src/ui/views/documents.js`) einen sichtbaren „Konto-Vorschlag (SBKIM-Richter)"-Knopf anbinden,
>    der `belegKontierung` mit dem opt-in geladenen Embedder ruft (wie die SBKIM-Suche → dann SW-Bump).
> 3. Sonst: weitere KI-/Recht-Reste lt. „Offen"-Liste unten.

---

## 🏁 ABSCHLUSS DER SITZUNG (2026-06-21) — Drei-Schichten besiegelt, Briefe geschrieben

> **Diese Sitzung ist sauber abgeschlossen.** Was erreicht wurde:
> - **Drei-Schichten in der Suche nutzbar gemacht** (Knopf „🜲 mein Knoten ↔ Netz", PR #219) und den
>   **Domänen-Text frei editierbar** (PR #220).
> - **Spore signiert & aktiviert** (PR #221): committete `sbkim/spore.json` trägt jetzt echte,
>   signierte `domainVector` + `capVector` + `needsVector` (je 384-dim, L2=1) — headless VALID.
> - **Sage-Handshake vollständig durchlaufen** (PRs #222, #223): Sages seq 28/29 quittiert, dann
>   **Sages Antwort seq 30** erhalten → unsere Spore reziprok VALID, `verified-match` hält
>   (Cosinus **0.813525**), **§14 `matchDimensions`-Vertrag akzeptiert**.
> - **Abschlussbrief an Sage geschrieben & live** (`sbkim/AUSTAUSCH-Sage.md` §17, `ack[Sage]=30`,
>   von der Raw-URL zurückgelesen = veröffentlicht).
> - Tests **2055/2055**, SW **v175**. Alle PRs gemerged, `main` synchron.
>
> **Einziger offener Faden — nicht bei uns, sondern bei Sage:** *die Warte* auf Sages eigene
> cap/needs (Re-Sign über Modul 02 an Klaus' Tablet). Bei BookLedgerPro **kein offener Punkt**.

---

## ✉️ BRIEF FÜR DIE NEUE SITZUNG (2026-06-21): Drei-Schichten BEIDSEITIG BESIEGELT — Warte auf Sages cap/needs

> **Brief für die nächste Sitzung.** Die Drei-Schichten-Aktivierung ist durch und von Sage
> reziprok bestätigt — der einzige offene Faden liegt bei Sage:
> - **Unsere Seite ist fertig & live:** committete `sbkim/spore.json` trägt echte, signierte
>   `domainVector` + `capVector` + `needsVector` (je 384-dim, L2=1). UI-Knopf „🜲 mein Knoten ↔ Netz"
>   ruft den Drei-Schichten-Vorfilter real auf (Modus-Badge `Domäne`/`Schichten`). Domänen-Text vor
>   der Vektor-Erzeugung **frei editierbar**. SW **v175**, Tests **2055/2055**.
> - **Sage hat geantwortet (Brief seq 30, von uns quittiert `ack[Sage]=30`):** unsere Spore als
>   **VALID** nachgezählt; `verified-match` hält (`domainVector`-Cosinus **0.813525 ≥ 0.80**);
>   **§14 `matchDimensions`-Vertrag akzeptiert** (Lane1/Lane2 + Apoptose ≥2<0.60 = ihr Modul 04).
> - **⏳ DIE WARTE (Sages Zug):** Sage trägt eigene `capVector`/`needsVector` erst in einer
>   **Folge-Sitzung an Klaus' Tablet** nach (Spore-Re-Sign über Modul 02; privater Schlüssel lebt im
>   Browser, **kein headless-Bau möglich**). **Erst dann** schaltet der Knopf von `Domäne` auf
>   `Schichten`. Bis dahin vereinbarter `domainVector`-Rückfall (Nur-Anbieter-Modus). **Bei uns kein
>   offener Punkt; kein Push nötig.**
>
> **⏭ NÄCHSTE KONKRETE SCHRITTE (neue Sitzung):**
> 1. **Briefkasten-Start-Ritual:** Sages `SIGNAL.json` lesen; bei `seq > 30` neue Briefe lesen +
>    quittieren. **Insbesondere prüfen, ob Sages Spore jetzt `capVector`/`needsVector` trägt** (Raw:
>    `…/Sage-Protokol/main/sbkim/spore.json`).
> 2. **Wenn Sage cap/needs hat:** in der App Knopf „🜲 mein Knoten ↔ Netz" klicken → Treffer für Sage
>    muss Badge **`Schichten`** statt `Domäne` zeigen (= Drei-Schichten zündet beidseitig). Dann
>    Erfolgs-Quittung an Sage + SIGNAL-Bump.
> 3. **Wenn Sage noch nicht:** weiter warten (Monitor auf Sages `spore.json` cap/needs neu armen),
>    sonst an inhaltlich nächstem Thema arbeiten (z. B. OCR-Vorstufe Beleg-Foto → Vision → Embedding →
>    Richter — Sage bot „denken wir mit" an).

## ⏭ FRÜHERER STAND (2026-06-21): Knoten↔Netz-Knopf (Drei-Schichten in der Suche nutzbar)

> Neuer Knopf **„🜲 mein Knoten ↔ Netz"** im Knoten-Bereich der SBKIM-Suche: nimmt unsere EIGENE
> Spore als `queryNode` und matcht gegen die Peer-Sporen über `queryLocalDimensions`
> (Drei-Schichten-Engine). Läuft **heute schon** (domain-Modus, da Sporen noch keine cap/needs);
> Treffer zeigen ein Modus-Badge (`Domäne`/`Schichten`). Schaltet automatisch auf `schichten`,
> sobald beide Seiten cap/needs tragen. SW **v174**, Tests **2055/2055** (Engine getestet; Knopf =
> View, nicht node-testbar).
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** (1) **Spore signieren** (App → Netzwerk → „Echte Vektoren
> erzeugen" → `spore.json` committen — siehe unten); (2) Sage um cap/needs in ihrer Spore bitten →
> dann zeigt der Knopf `Schichten` statt `Domäne`.

## ⏭ STAND (2026-06-21): Spore-Signierung mit cap/needs — Drei-Schichten AKTIVIERBAR (In-App)

> Der Knopf „Echte Vektoren erzeugen" (Netzwerk-Ansicht) bettet jetzt **drei** Texte ein
> (Domäne + cap + needs via `embedTexts`) und **signiert** sie in die Spore (`capVector`/
> `needsVector`, mitsigniert). `nodeProfile.js` hat dafür `STAMM_CATEGORIES` (Angebot) +
> `GUEST_CATEGORIES` (Bedarf). Tests **2055/2055** (+6), SW **v173**.
> **▶ AKTIVIERUNGS-SCHRITTE (Nutzer, Browser — nicht headless möglich):** App öffnen → Tresor
> auf → **Netzwerk** → „Echte Vektoren erzeugen" (lädt e5 einmalig, ~30 MB) → `spore.json` wird
> heruntergeladen → die Datei nach `sbkim/spore.json` **committen** → `SIGNAL.json` seq +1.
> **Danach:** unser Knoten trägt die drei Schichten. Der Suche-Knoten-Pfad schaltet von „domain"
> auf „schichten", **sobald die Gegenstelle ebenfalls cap/needs trägt** (Sage baut kompatibel).
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** (1) obige Signierung durchführen + committen; (2) optional
> UI-Knopf „mein Knoten ↔ Netz" (queryNode aus eigener Spore); (3) Sage bitten, cap/needs in
> ihre Spore aufzunehmen, damit node↔node-Schichten beidseitig rechnen.

## ⏭ STAND (2026-06-21): EU-Politik „frei/bindend" für die Spracheingabe (Regel #8)

> Sage hat unser Sprach-Muster nachgebaut (ihr Modul 21) und die **EU-Politik frei/bindend**
> beigesteuert — wir haben sie **zurück übernommen**: `policyEngines`/`pickEngine` in
> `src/ai/speech.js` (rein, getestet), `aiConfig.speechPolicy` (Default `frei`), Wähler in der
> SBKIM-Suche. **`bindend`** = nur EU-Engine (Web-Speech gesperrt, strikte EU-Verarbeitung);
> **`frei`** = beide. Tests **2049/2049** (+9), SW **v172**. (Keine Sage-Quittung diesmal — nur
> Code; Nutzer-Wahl.)
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** wie unten (Drei-Schichten-Aktivierung: Spore mit echten
> cap/needs neu signieren; optional UI-Knopf „mein Knoten ↔ Netz"; Sages Lane-/Apoptose-Bestätigung).

## ⏭ STAND (2026-06-21): DREI-Schichten-Erkennen GEBAUT (Sage Karte 04) — Engine + Suche-Wiring + Tests

> Das Drei-Schichten-Matching ist **echt gebaut** (nicht mehr nur dokumentiert): in
> `src/sbkim/match.js` neu `matchDimensions` (zwei Lanes cap/needs, Schicht-Score, overall,
> Nur-Anbieter-Modus, synchroner Wurf bei vier null), `schichtApoptose` (1 Schicht <0.60 erlaubt,
> 2+ → Apoptose), `queryLocalDimensions` (Apoptose wirkt, Rückfall auf domainVector-Cosinus). In
> die Suche verdrahtet: `sbkimHybridSearch({ queryNode })`. `buildSpore` signiert optionale
> `capVector`/`needsVector` MIT; `nodeCorpusEntries` hebt echte cap/needs; `embed.js` hat
> `buildCapText`/`buildNeedsText`. **Node-getestet 2040/2040** (+24). SW **v171**.
> **⚠️ Aktivierung offen:** committete Spore trägt noch KEINE echten cap/needs → Knoten-Pfad läuft
> bis zum **Neu-Einbetten + Neu-Signieren** (Browser) im **Nur-Anbieter-Modus** (domainVector);
> Freitext-UI bewusst einschichtig. An Sage gemeldet: AUSTAUSCH-Sage **§14**, `SIGNAL` **seq → 17**.
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** (1) Spore mit echten cap/needs neu signieren (App-Andock,
> Browser) → Knoten-Pfad schaltet auf „schichten"; (2) optional UI-Knopf „mein Knoten ↔ Netz"
> (queryNode aus eigener Spore); (3) Sages Bestätigung der Lane-/Apoptose-Zuordnung abwarten.

## ⏭ STAND (2026-06-21): Spracheingabe (DE/EN/RU) — EU-Weg vom Nutzer END-TO-END verifiziert

> Die SBKIM-Suche hat jetzt **Spracheingabe** als additive Eingabe-Schicht (`src/ai/speech.js`) — Pipeline
> (Vorfilter→Richter, Fail-soft) **unberührt**. **Zwei Engines:** Browser (Web Speech) **und** EU/BYOK
> (Google **Cloud Speech-to-Text, EU-Endpoint**). **Sprach-Wähler DE/EN/RU** (`alternativeLanguageCodes`).
> **UX-Fix:** erkannter/getippter Text bleibt im Feld (kein `value:''`-Reset bei Neuzeichnen; `_query`).
> **✅ Vom Nutzer im Browser verifiziert — BEIDE Engines:** EU-Weg **end-to-end** (🎤 → EU-STT → Text →
> Richter → **dasselbe Urteil wie beim Tippen**). Schlüssel freigeschaltet, Erkennung sehr gut.
> **An Sage gemeldet** (zum Nachbauen): AUSTAUSCH-Sage **§12**, `SIGNAL` **seq → 15** (Push = Signal);
> Muster verallgemeinert in `docs/SBKIM-SUCHE-MUSTER.md` (Abschnitt „Spracheingabe"). SW **v170**,
> Tests **2016/2016**.
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** (optional) weitere Sprachen im `SPEECH_LANGS`-Array; Mehrfach-Absichts-
> Trennung verbessern (Vorfilter-Grenze); attestation signieren sobald Sage Signier-Helfer hat; sonst
> **Phase 5d** (Symbiose-Import Mein-Tresor/WorkFloh).

## ⏭ STAND (2026-06-21): Hybrid-Match-Richter KOMPLETT — QA-gehärtet + an Sage gemeldet

> Die SBKIM-Suche (Konten + Knoten) ist **eingebaut, im echten Nutzer-QA gehärtet und im Browser verifiziert**:
> `available:true` (mistral-large/eu), sinnvolle Urteile inkl. Metaphern, **Fail-soft bei WLAN-aus bestätigt**
> (Vorfilter gilt, kein Throw), Zurückhaltung greift (Strafzettel/Kochrezepte → „keiner passt"). Im QA
> gefunden+behoben: Halluzination (id-Schutz), Vorfilter-Top-k, Recall-Synonyme, Steuerregel §4 Abs.5.
> **Rück-Aktion an Sage** abgelegt: AUSTAUSCH-Sage **§11**, `SIGNAL` **seq → 14** (Push = Signal). SW **v167**,
> Tests **2005/2005**.
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** (optional) Mehrfach-Absichts-Trennung verbessern (Vorfilter-Grenze);
> attestation signieren sobald Sage einen Signier-Helfer hat; Sages Whitening/Schwellen-Brief abwarten;
> sonst **Phase 5d** (Symbiose-Import Mein-Tresor/WorkFloh).

## ⏭ STAND (2026-06-21): SBKIM-Suche mit ZWEI Bereichen (Konten + Knoten) + Muster-Doku

> Die **mehrstufige semantische Suche** steht — als wiederverwendbares Muster (`docs/SBKIM-SUCHE-MUSTER.md`).
> Ansicht **„SBKIM-Suche"** hat jetzt einen **Bereichs-Umschalter**: **Konten** (Buchungskonto finden) und
> **Knoten (Mycel)** (gleichwertige Knoten finden — der Ur-Gedanke; Korpus = Peer-Sporen, `domainVector`
> direkt aus der Spore → kein Korpus-Embedding). Schicht 1 = Vektor-Vorfilter (`embed.js`), Schicht 2 =
> KI-Richter (Mistral EU/BYOK), Fail-soft. Tests **1998/1998**, SW **v163**.
> **⏭ NÄCHSTER KONKRETER SCHRITT (Browser/Nutzer + Rück-Aktion an Sage):** beide Bereiche im Browser testen
> (erster echter Richter-Lauf): available:true? sinnvolle Urteile? Fail-soft bei abgezogenem Netz? Danach Sages
> Whitening/Schwellen-Brief.

## ⏭ STAND (2026-06-21): SBKIM Hybrid-Match-Richter gebaut — wartet auf ersten Browser-Lauf

> **Sage-Andock-Brief (Hybrid-Match-Richter ans Such-Feld) umgesetzt — BLP-native nach Sage-Spec (von Sage
> freigegeben, OPTION 1).** Neue Ansicht **„SBKIM-Suche"** (eigener Menüpunkt): lokaler Vorfilter (`embed.js`,
> Opt-in-Modell, kein neuer CDN) + opt-in Richter (Mistral EU/BYOK über `mistral.js`) + Fail-soft.
> Neue Module: `src/sbkim/match.js`, `hybridSearch.js`, `searchCorpus.js`, View `sbkimsuche.js`,
> `loadEmbedder()` in `embed.js`. Vertrags-Fläche 1:1 (Verdict/4 Modi/Fail-soft-nie-Throw/attestation).
> Tests **1989/1989**, SW **v162**. Ehrlich: **BLP-native, NICHT verbatim Sage-Kopie** (byte-Vendoring war
> nicht möglich + Modul-03-CDN verstößt gegen Regel #1).
> **⏭ NÄCHSTER KONKRETER SCHRITT (Browser/Nutzer + Rück-Aktion an Sage):** „SBKIM-Suche" öffnen → Stichwort
> eingeben → ERSTER echter Mistral-Richter-Lauf (Modell lädt einmalig ~30 MB). An Klaus/Sage melden:
> available:true? sinnvolle Urteile? Fail-soft sauber bei abgezogenem Netz? (Kein Schlüssel/Netz in der
> Bau-Umgebung → nur node-getestet.) Danach: Sages Whitening/Schwellen-Brief.

## ⏭ STAND (2026-06-20): 🏅 `verified-match` ERREICHT — voll vernetzter Mycel-Knoten

> **BookLedgerPro ist Gold.** Der echte Vektor ist live (`Xenova/multilingual-e5-small`, 384-dim, L2=1,
> kein `_demo`, Spore neu signiert, headless VALID), und **Sage hat den Cosinus bestätigt:
> Sage ⟷ BookLedgerPro = 0.810579 ≥ 0.80** (Sage `SIGNAL` seq 27, `ack[BookLedgerPro]=11`). Wert **lokal
> unabhängig nachgerechnet → identisch** (beide L2=1, Skalarprodukt). `SEAL_STAGE = 'verified-match'`
> (`src/sbkim/nodeProfile.js`); unsere `SIGNAL` **seq → 13**, `ack[Sage]=27`, Quittung AUSTAUSCH-Sage **§10**;
> SB-KIMTool-Point-Brief §4 (seq 12). SW **v159**, Tests **1968/1968**.
> **Ehrliche Einordnung:** 0.81 liegt **knapp** über der Schwelle — Buchhaltung ist der Mycel-Bibliothek
> fachlich fern; e5-small ist zudem anisotrop (kurze Texte ~0.8-Grundlinie), 0.80 ist großzügig. Kein „Fake-Grün".
> **⏭ NÄCHSTE KONKRETE SCHRITTE:** **Phase 5d** — Symbiose-Import (Belege aus Mein-Tresor, Aufträge aus
> WorkFloh → Buchungen). Optional: Domänen-Beschreibung um Krypto-/Tresor-Nähe schärfen → neu einbetten →
> neu signieren → `SIGNAL` seq +1 (Sage misst dann erneut).

---

## ⏭ START HIER — Nachfolge-Brief (Stand 2026-06-19): **eine PR pro Sitzung**, Plan in NACHFOLGE_PLAN.md

> **Lies das zuerst und vollständig. Danach OHNE Rückfragen loslegen.**

> **⏭ AKTUELLER POINTER (2026-06-19, neues Thema abgestimmt):** Block 5 (5-Sitzungs-Sprint) ABGESCHLOSSEN.
> Besprechungs-Sitzung gehalten → **neues Thema: Sage-Mycel-Andock (Phase 5), Reihenfolge ZUERST Sage/Hub, DANN
> WorkFloh.** E2E-Frage aus der Sage-Quelle geklärt (Mycel heute nur Ed25519-**Signatur**, keine Nutzlast-
> Verschlüsselung, `protocolVersion 0.1`; E2E = additive Erweiterung, „Spec vor Code"). Brief an Sage:
> `docs/SAGE_E2E_ANFRAGE.md`; Sequenz/Plan: `docs/BAUPLAN.md` **Block 6**.
> **✅ SAGE HAT GEANTWORTET (2026-06-19, menschlich vermittelt): 1 JA / 2 JA / 3 JA mit Wie / 4 bestätigt.**
> → **Grad-B-Pseudonymisierung** (P9) ist der freigegebene **Sofortpfad** (kein Bump, kein Bau); **echte E2E**
> (X25519 „sealed box" `{v,epk,iv,ct}`, optionales Feld `encryptionPublicKey`) ist als **Entwurf 0.2** dokumentiert,
> der formale `protocolVersion`-Bump kommt erst **nach** Knoten-Deploy + Knoten-Go (Sage-Hoheit; Sage hat seine Seite
> abgelegt, deren PR #302). **⏭ NÄCHSTE SITZUNG = Phase-5-Schritt 1:
> BLP zum echten SBKIM-Knoten machen** (Ed25519-Identität + `sbkim/spore.json` + `SIGNAL.json`, headless via
> `tools/verify_remote_spore.mjs` VALID; `domainVector` vorerst `_demo`). Konkreter COPY-Block:
> `docs/NAECHSTE_SITZUNG.md`. **Stand:** Tests **1926/1926**, SW **v147**, **127 JS-Module**.
>
> **⏭ NEU (2026-06-19, diese Sitzung):** Lebenden Mycel-Knoten **regelkonform vendort** →
> `sbkim/mycelknoten.html` (echte SBKIM-Module + Live-Lampen + Wächter-Log + Widget). Egress-Audit gemacht;
> Embedding-CDN (Regel #1) und Stufe-B-LLM-US-Endpoint (Regel #8) **deaktiviert** (fail-soft, klar als
> `BLP-Vendor-Anpassung` markiert), Gemini-Demo-String neutralisiert. Andocken erzeugt **verified-spore ohne
> `domainVector`** → volle Verbindung zu Sage/Mycel **ohne** CDN/Nicht-EU-KI. Tests weiter 1926/1926.
> **Nächste konkrete Schritte:** (1) Knoten im Browser real andocken → `spore.json`/`SIGNAL.json` erzeugen +
> committen (Phase-5-Schritt 1); (2) **EU-Phase**: semantisches Matching via **Mistral-EU** (BYOK, opt-in)
> nachrüsten, Schwellen (`PROVIDER_MIN_MATCH=0.80`) für EU-Embeddings neu validieren. Browser-Verifikation des
> Andock-Flows steht noch aus (DOM/IndexedDB, nicht node-testbar).

> **📨 Selbstfortschreibende Nachfolge-Kette (verbindlich, vom Nutzer gewünscht):**
> Der **paste-fertige Brief** für die jeweils nächste Sitzung steht in
> `docs/NAECHSTE_SITZUNG.md` (Block zwischen `>>> COPY <<<` / `>>> END COPY <<<`). **Jede
> Sitzung MUSS** diesen Brief am Ende neu auf den dann nächsten Schritt setzen **und** die
> Selbst-Fortschreibungs-Anweisung darin behalten (Kette darf nie abreißen) — und den
> COPY-Block am Sitzungsende im Chat ausgeben. **Mehrere saubere, in sich abgeschlossene
> PRs pro Sitzung sind erlaubt** (pro Punkt 1 PR, jeder einzeln grün + gemergt; nie halb
> mergen, im Zweifel feiner schneiden).

**🟢 FREIBRIEF + Sitzungs-Ritual (vom Nutzer ausdrücklich so gewünscht):**
- **Genau EINE PR pro Sitzung.** Die Sitzung ist nur so lang, bis **diese eine PR abgeschlossen** ist.
- **Sauber & fehlerfrei vor schnell:** keine unschlüssigen/halben Codepfade, die später Probleme machen.
  Lieber kleiner schneiden als überstürzen. Reine Logik **zuerst node-getestet** (`node tests/run.mjs`),
  dann UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser hier).
- **Ablauf je PR:** Branch `claude/v2-ox8bu7` auf `origin/main` setzen → bauen → Tests grün →
  `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen → **Draft-PR** → ready → CI abwarten →
  **bei grün squash-mergen** → lokal `git reset --hard origin/main`.
- **Abschlussbrief am Ende JEDER Sitzung (Pflicht):** in `docs/PULS.md` diesen „START HIER"-Block auf
  die **nächste** PR zeigen lassen (Kopf-Status v-Nummer/Tests aktualisieren), `docs/NACHFOLGE_PLAN.md`
  die erledigte Zeile abhaken, obersten `docs/SESSIONS.md`-Eintrag schreiben, `OFFENE_PUNKTE.md` pflegen.
  So startet die Folgesitzung **konfliktfrei** allein aus diesen Dateien.
- **Unverrückbar:** DB-Suffix `bookledgerpro` NIE ändern · build-frei (keine Bundler/CDNs/npm-Runtime) ·
  Krypto-/Durabilitäts-Disziplin (Regel #2) · GoBD/DSGVO · EU-KI opt-in.

**📋 Der vorausschauende Gesamt-Bauplan steht jetzt in `docs/BAUPLAN.md`** (geordnete Reihenfolge aller mit dem
Nutzer 2026-06-17 vereinbarten Themen: Kalkulation/Angebote + Datensicherung + Test-Modus); Ritual/erledigte Tracks
in `docs/NACHFOLGE_PLAN.md`. **Nächste PRs = BAUPLAN abarbeiten, Block 1 zuerst** (mehrere saubere PRs pro Sitzung wo
sinnvoll): **1.** Backup→Restore-Roundtrip-Selbsttest ✅ **(PR #116)** → **2.** Test-Modus/Sandbox-Tresor
(`docs/TEST_MODUS.md`): **2a. Sandbox-Kern ✅ (PR #118)** → **2b. Store-Glue `core/sandboxStore.js` ✅ (PR #120)**
→ **2c. UI ✅ (PR #122)** („🧪 Tests"-Bereich + TEST-Banner + behalten/verwerfen; optionale Demo-Vorbefüllung bewusst als Folgeschritt offen) → **3. Backup-UX + `backupStrategie` ✅ (PR #124)** (`docs/DATENSICHERUNG.md`; prominente Karte + gemerkter Zielordner/File System Access + Download-Fallback + Drag-and-drop-Restore + Setting `backupStrategie` im Onboarding/Einstellungen) → **Block 1 abgeschlossen.** **Block 2/Schritt 4 — Setting `rechnungsstelle` ✅ (PR #125)** (`domain/rechnungsstelle.js`: blp|extern, Default blp, vorläufige interne Nummer `ENT-JJJJ-NNNN`, Wechsel-Hinweis blp→extern→Bestätigung; Onboarding + Einstellungen) → **Block 2/Schritt 5 — Kalkulations-Kern (rein) ✅ (PR #126)** (`domain/kalkulation.js`: Kostenarten + Zuschlags-/Maschinenstundensatz-/m²-Formel, vorwärts `kalkuliereVorwaerts` + rückwärts `kalkuliereRueckwaerts`/`maxSelbstkosten`, cent-genau, node-getestet; rein, kein UI) → **Block 2/Schritt 6 — Produkt-Schemata ✅ (PR #127)** (`domain/produktschemata.js`: die 6 kalibrierbaren Vorlagen Folierung (m²)/Schild/Gravur/Leuchtreklame/Druck-Zukauf/Montage, die den Kern füttern — Enums + `mapping`→Kostenarten + `kalkuliereSchema`, „Hotspots" kalibrierbar; rein, kein UI) → **Block 2/Schritt 7 — Angebote-Kern (rein) ✅ (PR #128)** (`domain/angebote.js`: Angebots-Datenmodell mit zwei Schichten — extern Positionen/Preise/USt, intern `kalkulation` je Position; Prime Directive via `externesAngebot`/`externePosition`-Whitelist; Status entwurf/offen/angenommen/abgelehnt/archiviert + `darfAngebotWechseln`/`setzeAngebotStatus`/Archiv-Filter; freier Nummernkreis `AN-JJJJ-NNNN` + `naechsteAngebotsSeq`/`vergebeAngebotsnummer`; `angebotSummen` (= `orders.auftragSummen`); `positionAusSchema` koppelt Schemata (6) an Kern (5); `interneAuswertung` Live-DB; rein, kein UI) → **Block 2/Schritt 8 — Angebot → Rechnung-Übernahme (rein) ✅ (PR #129)** (`domain/angebotUebernahme.js`: angenommenes Angebot → bestehender Rechnungs-/Buchungspfad via `rechnungZeilen`; Nummern-Politik je `rechnungsstelle` — `blp` echte §14-Nummer (`formatRechnungsnummer`) bzw. `extern` vorläufige Vorlage `ENT-…` (`vorlaeufigeRechnungsnummer`); `angebotUebernahmeEntwurf` referenziert die Angebotsnummer, benutzt sie nie wieder (zwei getrennte Kreise, GoBD); Prime Directive: baut nur auf `externesAngebot` → keine interne Kalkulation im Entwurf; `validateAngebotUebernahme`/`darfAngebotUebernehmen`/`uebernahmeNummer`; rein, kein UI). **Block 2/Schritt 9 — Auftrags-Kostenträger + Nachkalkulation ✅ (PR #130)** (`domain/nachkalkulation.js`: Kostenträger = Auftrag über `kostenstelle`; IST aus Buchungen/Belegen `istkostenAusBuchungen` (Aufwand festgeschriebener Buchungen je `kostenstelle`, `belegRef` mitgeführt, konto→Kostenart über `kontoBlock`) + Zeit `istZeitkosten` (`employees.js`-`{dauerMin}` × interner Stundenkostensatz) + `istkosten`; SOLL `sollkostenAusAngebot` (interne `kalkulation` je Position × Menge nach Kostenart); Vergleich `nachkalkulation` (Abweichung IST−SOLL je Kostenart + Prozent + DB Soll/Ist) + `kostentraegerAnalyse`; rein node-getestet, kein UI). **Block 2/Schritt 10 — Kalibrierung + Statistik/Vergleich ✅ (PR #131)** (`domain/kalibrierung.js`: Korrekturfaktoren je Kostenart aus der Historie Vor→Nachkalkulation `korrekturFaktoren` (faktor ΣIST/ΣSOLL + medianFaktor + anzahl) → `faktorWerte` (Schranken/Quelle), Rückfluss in den Kern `kalibriereEingabe`/`kalkuliereKalibriert`; Angebots-Trefferquote je Preisniveau `trefferquote`/`trefferquoteJePreisniveau`/`angebotErgebnis`/`angebotMargeProzent`/`preisniveau`; PII-freier `kalibrierungsDigest` als opt-in/BYOK-Payload-Kandidat für spätere KI Mistral EU — sendet NICHTS; rein, kein UI). **Block 2/Schritt 11a (reine Logik, PR #132) + 11b (UI) ✅.** **Schritt 11b — Adaptiver Baukasten-UI** (2026-06-18): neue Ansicht `ui/views/angebote.js` (NAV „Angebote", in privat/verein ausgeblendet) + verschlüsselte Store-Glue `domain/angebote-store.js` (`saveAngebot`/`listAngebote`/`getAngebot`/`deleteAngebot`/`setzeAngebotStatusStore`; Positionen behalten interne `kalkulation` → Live-DB überlebt Speichern; Nummernkreis `AN-JJJJ-NNNN` beim ersten Speichern). UI: adaptive Karten je Leistungsart (`baukastenPalette`/`haeufigsteSchemata`, Nutzungsprofil gerätelokal in Settings `baukastenNutzungsprofil` via `zaehleNutzung`), Karte→Schema-Felder→`positionAusSchema`, Drag-and-drop-Positionsliste (`verschiebePosition` + ↑/↓), Live-Deckungsbeitrag (`interneAuswertung`, „intern — nicht im Angebot"), Status-Workflow + Archiv, neutrales Angebotsdokument (Druck) nur über `externesAngebot`-Whitelist. SW `v116`, **1427/1427** grün, DOM/IndexedDB statisch geprüft. **Damit ist die Block-2-Kernkette (4–11) komplett.** **Block 2/Schritt 8-UI „Rechnung aus Angebot" ✅ (2026-06-18):** Knopf „Rechnung aus Angebot" an einem angenommenen Angebot (`ui/views/angebote.js`) → `domain/angebote-store.js rechnungAusAngebot(id)` über die fertige reine Logik `domain/angebotUebernahme.js` (`angebotUebernahmeEntwurf`/`darfAngebotUebernehmen`/`validateAngebotUebernahme`) → Buchungs-Entwurf via `saveEntwurf`; Nummernpolitik je `rechnungsstelle`: `blp` → echte §14-Nummer aus dem lückenlosen Zähler `crm-store.naechsteRechnungSeq` (DERSELBE wie `rechnungAusAuftrag`), `extern` → vorläufige Vorlage `ENT-…` aus eigenem Zähler `naechsteVorlaeufigeSeq`; Angebotsnummer nur referenziert (nie wiederverwendet); Angebot danach → archiviert; Festschreiben bleibt manuell (GoBD); Prime Directive: nur `externesAngebot`. SW `v117`, **1427/1427** grün, DOM/IndexedDB/kv-Zähler statisch geprüft. **Nachkalkulation/Kalibrierung-UI ✅ (2026-06-18):** neue Ansicht `ui/views/nachkalkulation.js` (NAV „Nachkalkulation", privat/verein ausgeblendet) + I/O-Glue `domain/nachkalkulation-store.js` über die fertige reine Logik `nachkalkulation.js`/`kalibrierung.js`; Soll/Ist je Kostenträger + Deckungsbeitrag Soll/Ist + zugeordnete Belege/Stunden, Korrekturfaktoren-Tabelle (Faktor/Median/Anzahl/verwendeter Multiplikator) + Angebots-Trefferquote je Preisniveau; neuer reiner Helfer `nachkalkulation.zeiteintraegeAusZeiten` (Zeit→Kostenträger/Kostensatz) node-getestet (+7 → **1434/1434**); **rein anzeigend** (kein Druck/Export/KI, Digest ungenutzt); SW `v118`, DOM/IndexedDB statisch geprüft; Grenzen: kontoBlock-Default = Material, `stundenlohnCent` als Kostensatz. **Demo-Vorbefüllung ✅ (2026-06-18, BAUPLAN Schritt 2d):** beim „Neuer Test" wahlweise leer oder mit Demo-Daten — reine Logik `domain/demodaten.js` (`demoEntwuerfe`/`demoBefuellungsplan`), Store-Glue `domain/demodaten-store.js` `befuelleMitDemodaten` (schreibt in den aktiven Sandbox-Tresor über den echten GoBD-Pfad `saveEntwurf`+`festschreiben`), UI in `ui/lock.js renderNeuerTest`; SW `v119`, **1444/1444** grün, Glue/DOM/IndexedDB statisch geprüft. **Standard-konto→Kostenart-Zuordnung ✅ (2026-06-18):** die in der Nachkalkulation-UI genannte „alles = Material"-Grenze verfeinert — reine Logik `domain/nachkalkulation.js` `kostenartFuerKonto`/`standardKontoBlock` (SKR03-Kontenklassen: 3100–3199 Fremdleistungen→Zukauf, 3000–3999 Wareneingang/RHB→Material, 4100–4199 Personalaufwand→Arbeit; sonst Default Material), automatisch in `nachkalkulation-store.js` aus dem Kontenplan gebaut + in `kostentraegerAnalyse` durchgereicht; `opts.kontoBlock` (manuell) gewinnt. SW `v120`, +22 → **1466/1466** grün, Glue/IndexedDB statisch geprüft. **Kalibrierte Vorwärtskalkulation im Angebots-Editor ✅ (2026-06-18):** die in Schritt 10 fertige reine Logik (`kalkuliereKalibriert`) ist jetzt im Editor nutzbar — Anwendungs-Primitiven `kalibriereEingabe`/`kalkuliereKalibriert` in den Kern `domain/kalkulation.js` verschoben (`kalibrierung.js` re-exportiert → API stabil), neuer reiner `produktschemata.js kalkuliereSchemaKalibriert`, `angebote.js positionAusSchema(opts.faktoren)` rechnet die interne Kalkulation kalibriert + merkt `kalkulation.kalibriert`/`faktoren` (Außendokument neutral, Prime Directive), Glue `nachkalkulation-store.js ladeKalibrierungFaktoren()`, UI-Schalter „Erfahrungswerte anwenden" (Setting `kalibrierungAnwenden`, nur mit Historie) + „kalibriert"-Badge. SW `v121`, +9 → **1475/1475** grün, DOM/IndexedDB statisch geprüft. **Zeit-Zuordnungs-UI je Kostenträger ✅ (2026-06-18):** die echte **Zeiterfassung-/Beleg-Zuordnung je Auftrag** umgesetzt, soweit GoBD es zulässt. GoBD-Befund: `kostenstelle` ist Teil der festgeschriebenen Buchungs-Hash-Kette (`audit.hashedFields`) → Buchungen/Belege nicht nachträglich umhängbar; saubere Zuordnung nur bei **Zeiteinträgen** (mutable CRM-Records). Reine Logik `nachkalkulation.js aufgeloesteKostenstelle(zeit, auftragIndex)` (explizite `zeit.kostenstelle` vor Auftrags-Ableitung; '' → null), `zeiteintraegeAusZeiten` nutzt ihn (rückwärtskompatibel); `crm-store.js` `saveZeit` persistiert `kostenstelle` + neue `setZeitKostenstelle`; Glue `nachkalkulation-store.js ladeZeitZuordnung()`/`zuordneZeit()`; UI-Karte „Zeiten zuordnen" (Kostenträger-Select je Zeile, Herkunft direkt/über Auftrag) + ehrlicher GoBD-Hinweis an der Beleg-Liste. SW `v122`, +8 → **1483/1483** grün, DOM/IndexedDB statisch geprüft. **NÄCHSTER SCHRITT (optional, verbleibend):** Schritt 4 der Datensicherung (`docs/DATENSICHERUNG.md` #4) — Server-/Offsite-Ziel + konfigurierbare Erinnerungs-Kadenz (blockiert, solange kein eigener Server existiert); sonst Browser-Sichttest durch den Nutzer. Damit ist **Block 2: Kalkulation/Angebote** inkl. aller UIs/Folgeschritte abgeschlossen.
(`docs/KALKULATION_KATALOG.md`; Prime Directive: Kalkulation intern, Angebot/Rechnung neutral). **Vermerk:** auch
**Mein-WorkFloh** soll einen Test-Modus nach `docs/TEST_MODUS.md` bekommen (fremdes Repo, über den Nutzer).
**(Frühere Notiz, Kontext):** Der reine „build-freie Rest-Korb" war leer; in der vorigen Sitzung
wurde (Nutzer: „keine Präferenz" → empfohlene Folge-Idee) **„Edit bestehender Aufträge"** umgesetzt: ein noch nicht
berechneter Auftrag ist nachträglich editierbar (`orders.darfAuftragBearbeiten`/`anwendeAuftragEdit` rein/node-getestet,
`crm-store.updateAuftrag`, UI-„Bearbeiten"-Knopf; GoBD-gesperrt sobald berechnet/bezahlt/Zahlung erfasst). SW `v102`,
**1080/1080**. **Verbleibend (für die nächste Sitzung erneut mit dem Nutzer abstimmen):** kleine Folge-Idee
**Eingangsrechnungs-Verzug (Gegenseite)**, Browser-Sichttest, oder umgebungs-/menschen-blockierte [KANN]-Punkte.
Frühere build-freie Folge-Ideen waren ebenfalls: **A1-Rest — Zahlungsziel je Forderung**
(✅ siehe Kopf-Status). R4-Rest und **R5a-Rest** (SWIFT-(MT940)/ISO-20022-(CAMT)-**Schema-/Struktur-Validierung**,
`domain/bankschema.js`) sind ebenfalls **erledigt + gemergt**. Verbleibend sind nur noch **umgebungs-/menschen-blockierte** [KANN]-Punkte **oder ein
Browser-Sichttest** — beides braucht eine Nutzer-Entscheidung. **R6/Rest [KANN] bleibt blockiert** (Umgebung/Mensch):
**Lighthouse/Perf** (Headless-Browser fehlt), **lokales OCR** (Tesseract = wasm/npm-Runtime → **nicht build-frei**,
verifiziert: nichts vendored, Regel #1 verbietet CDNs/npm-Runtime), **ZUGFeRD-Erzeugen** (PDF/A-3-Lib → nicht
build-frei), **Sage 5b–d** (fremde Repos, menschlich vermittelt). **Browser-Sichttest** (echter Nutzer, kein Headless
hier) — Punkte unverändert: (a) WorkFloh-`rechnung`-Block (inkl. `zahlungen[]`) → Buchungsentwurf + Zahlungseingang;
(b) OCR→Verbindlichkeit (Vision EU); (c) Pseudonym-Briefkasten; (d) Privat-/Verein-Modus (NAV + USt/Mahn/Kreditoren/
KPIs); (e) NEU: **Bankauszug einlesen** → Schema-Hinweis (Struktur ok / Verstöße / Hinweise) prüfen.
Sonst: eine **neue Feature-Idee** mit dem Nutzer vereinbaren und fein schneiden.
Details: `docs/NACHFOLGE_PLAN.md` Abschnitt R + `docs/OFFENE_PUNKTE.md`.
**R5a-Rest SWIFT/ISO-20022-Schema-Validierung erledigt (diese Sitzung):** `src/domain/bankschema.js` (rein,
node-getestet) — `validiereMT940` prüft die **SWIFT-FIN-Feldformate** (Pflichtfelder :20:/:25:/:28C:/:60a:/:62a:,
Feldformate 16x/35x/5n[/5n]/1!a6!n3!a15d, :61:-Front 6!n[4!n]2a[1!a]15d1!a3!c, Reihenfolge); `validiereCAMT` prüft die
**ISO-20022-Nachrichten-Struktur** von camt.052/.053/.054 (Namespace→Variante/Version, Pflicht-Container
BkToCstmr…/GrpHdr+MsgId+CreDtTm/Stmt+Id+Acct, je `<Ntry>`: Amt mit **Ccy-Attribut**, CdtDbtInd ∈ {CRDT,DBIT}, Status/
Datum, .053-Salden OPBD/CLBD); `validiereBankauszug` ist die Format-Weiche. Klare Verstöße = **Fehler**, dialekt-
strittige Punkte = **Warnungen** (konservativ). UI: Bankimport zeigt den Schema-Hinweis (`bankSchemaHinweis`), i18n
de+en. +28 Tests (**1029/1029**), SW `v98`. **EHRLICHE GRENZE:** Struktur-/Feldformat-Prüfung nach den dokumentierten
Spezifikationen — **KEINE zertifizierte XSD-Validierung** (nicht build-frei) und **KEINE** SWIFT-Netzwerk-Konformität;
keine Konformität behauptet, die nicht belegt ist. UI/Glue statisch geprüft.
**R4-Rest Zahlungs-/Teilzahlungs-Übernahme erledigt (diese Sitzung):** Eine `rechnung` darf im Austauschformat **v3**
ein optionales `zahlungen[]` `{datum, betragCent|betrag, ref?}` tragen. `importworkfloh.normalizeZahlungen` (rein)
normalisiert konservativ (ISO-Datum + positiver Betrag, Euro/Cent; unvollständig → verworfen + Warnung);
`invoicing.zahlungsUebernahmeEntwurf`/`validateZahlungsUebernahme` (rein) bauen je Zahlung einen Zahlungseingang-ENTWURF
**Soll Bank 1200 / Haben Forderung 1400**; `crm-store.importWorkFloh` bucht je Zahlung den Entwurf + vermerkt die
(Teil-)Zahlung am Auftrag (Auto-„bezahlt" bei `auftragOffen <= 0`) und meldet `zahlungenUebernommen`;
`connect.buildAustauschPaket` trägt die Zahlungen reziprok mit (**v3**, abwärtskompatibel). Import-Banner zählt sie;
i18n de+en. +18 Tests (**1001/1001**), SW `v97`. UI/Glue statisch geprüft. **Grenze:** Überzahlung nicht gesondert
behandelt (faithful gebucht, manuell korrigierbar); Festschreiben bleibt manuell (GoBD).
**R5c-Rest NER-Scoping erledigt:** Im Briefkasten-Modus (`briefkastenScopes`) tragen die im Belegtext erkannten
**Fremd-PII** den externen Scope **`EXTERN`** (`ai/ner.js`/`ai/anker.js`) → gruppierende, sichtbar externe Token
(`[[EXTERN_IBAN_1]]`); Transparenz-Badge zeigt scope-präfixierte Typen lesbar (`tOpt`-i18n-Fallback). **Grenze:** EIN
`EXTERN`-Scope — keine Clusterung verschiedener Drittparteien (FP-riskant → konservativ).
**R6/P2 erledigt:** Feature-Gates ansichtsintern konsumiert (`zeigeFeature`/`zeigeAnsicht` in journal/reports/documents/
dashboard) — Reine Politik unverändert (972/972), UI/Glue statisch geprüft. SW `v95`.
**R6/P1 erledigt:** `domain/nutzungsmodus.js` (rein, node-getestet) — Nutzungskontext `firma|privat|verein` (Default
`firma`, Bestand unverändert) neben dem UI-Komplexitäts-`mode`; `zeigeAnsicht`/`sichtbareAnsichten` (NAV-Gating, in
`shell.js` konsumiert) + `zeigeFeature`/`FEATURE`; Setting `nutzungsmodus`, Schalter „Nutzungskontext", i18n de+en. +30 Tests.
**R5c (dreistufiger Briefkasten Mandant ⊃ Firma ⊃ Person für Pseudonymisierung/CRM, `ai/briefkasten.js`, Setting `briefkastenScopes`) ist abgeschlossen + gemergt → Abschnitt R bis R5 komplett.**
**R5a (Bankformate härten: CAMT .052/.054 + Saldo-Integritätsprüfung + strukturierte RmtInf) ist abgeschlossen + gemergt.**
**R5a-Rest (SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung, `domain/bankschema.js`; KEINE zertifizierte XSD-Validierung) ist abgeschlossen + gemergt — letzter build-freier Rest-Korb.**
**R5b (NER: PII Dritter — E-Mail/IBAN/USt-IdNr/Steuernr/Telefon — über die Anker hinaus maskieren, `ai/ner.js`, Setting `nerPii`) ist abgeschlossen + gemergt.**
**R4-Rest (Zahlungs-/Teilzahlungs-Übernahme aus WorkFloh: `rechnung.zahlungen[]` → Zahlungseingang-Entwurf Bank an Forderung + (Teil-)Zahlung am Auftrag; Austauschformat v3; API/Push bewusst offen) ist abgeschlossen + gemergt.**
**R4 (Rechnungs-Übernahme aus WorkFloh: fertige Rechnung → Forderung/Buchung; Austauschformat v2; API/Push bewusst offen) ist abgeschlossen + gemergt (PR #95).**
**R3 (Verbindlichkeiten aus Foto/PDF + eigene Verbindlichkeiten-Ansicht + Zahlungsziel je Rechnung) ist abgeschlossen + gemergt.**
**R2b (Sammelzahlungen — eine Bankzahlung auf mehrere offene Rechnungen) ist abgeschlossen + gemergt.**
**R2a (Skonto-Buchung mit USt-/Vorsteuer-Korrektur §17 UStG) ist abgeschlossen + gemergt.**
**R1 (Verzugszinsen/Mahngebühren buchen) ist abgeschlossen + gemergt.**
**Abschnitt B (Bilanzierung) ist abgeschlossen:** B1 (Modus + Kontengrundlage), B2 (GuV), B3 (Bilanz) erledigt + gemergt.
**Mehrmandantenfähigkeit (Abschnitt A: M1–M3) ist abgeschlossen** — siehe `docs/MANDANTEN.md`.

**Kopf-Status (Stand nach „P8 — QR-Einzelteilen, vendored reiner JS-Encoder"):** SW **v147** · Tests **1926/1926** grün · 127 JS-Module.

**P8 — QR-Einzelteilen (lokal erzeugt, kein Netz) ✅ (Sitzung 5, 2026-06-19):** der QR-Teil von P8 („Datei-Kanal
(Masse) + QR (Einzel-Teilen, lokal erzeugt)") — der Datei-Kanal war P9. **Build-frei gelöst:** vendored, reiner
JS-QR-Encoder als eigenes ES-Modul `src/core/qr.js` (keine npm/CDN-Runtime). Algorithmus portiert aus der **MIT**-lizenzierten
„QR Code generator library" von **Project Nayuki** (Lizenz + Attribution im Dateikopf), neu als ES-Modul geschrieben:
Byte-Modus (UTF-8), Versionen 1–40, EC L/M/Q/H, automatische Maskenwahl. Kein Online-QR-Dienst → keine Datenübertragung
(genau der Sinn von „lokal erzeugt"; Regel #1 + #4). Reine Logik node-getestet (+40 → **1926/1926**) gegen **unabhängige
Spezifikations-Anker**: Kapazitätstabelle (v1 = 19/16/13/9, v5-H = 46, v7-L = 156), Rohmodul-Formel (208/359/1568),
Format-Info BCH(15,5) Ground-Truth `0x5412` (M,0) + 32-Werte-Nachrechnung, Versions-Info BCH(18,6) Ground-Truth
v7 = `0x07C94`, RS-Teiler `[3,2]`, GF(256)-Reduktion `gfMul(2,128)=29`, Ausrichtungspositionen (v7 = [6,22,38]),
Matrix-Struktur (Finder/Timing/dunkles Modul/Größe), Determinismus, `QR_ZU_LANG`-Fehler, SVG ohne Klartext-Leck.
UI: in der Schlüssel-Abgleich-Karte (Einstellungen) erzeugt „Als QR anzeigen (lokal)" einen QR aus dem **pseudonymen
Dokument** (nie der Schlüssel!) als Inline-SVG (`data:`-URI) + „QR speichern (SVG)"; zu langer Text → ehrlicher
Hinweis auf den Datei-Kanal. i18n de+en, SW `v147`. **Ehrliche Grenze:** **physischer Scan-Test braucht ein echtes
Gerät** (kein QR-Scanner/SVG-Renderer in der Build-Umgebung — Nutzer-Sichttest offen); die node-getesteten Anker
validieren alle Algorithmus-Konstanten unabhängig, die Platzierung ist strukturell geprüft. **Sprint abgeschlossen →
BESPRECHUNG mit dem Nutzer.**

**P2 — KI-Anbieterwahl je Modus, strikt EU ✅ (Sitzung 4, 2026-06-19):** je KI-Funktion (Modus) ein wählbarer
Anbieter — **strikt innerhalb der EU**, KEIN neuer Anbieter. Reine Logik `src/ai/anbieter.js` (node-getestet, +28 →
**1886/1886**): `KI_MODI` (ocr|kontierung|steuer), `KI_REGION`/`ERLAUBTE_REGIONEN` (`eu`+`lokal`; **Nicht-EU bleibt
dormant** — nie wählbar), Registry `KI_ANBIETER` (vision EU/mistral EU/On-Device-Heuristik/aus), `STANDARD_WAHL`
(verhaltensgleich: vision/mistral/mistral) + Selektoren `regionErlaubt`/`istAnbieterErlaubt`/`erlaubteAnbieter`/
`istWahlGueltig`/`normalizeAnbieterWahl` (unzulässige/Nicht-EU-Werte → Standard)/`aktiverAnbieter`/`istAus`/`istLokal`/
`istEuCloud`. Persistiert verschlüsselt in `aiConfig.anbieterWahl` (immer normalisiert). Verdrahtet am Netz-Rand:
`vision.ocr` (wirft bei OCR=aus), `mistral.categorize` + `berater.begruendeBuchung` (`nutzeMistralFuerKontierung` →
„heuristik" erzwingt On-Device, kein Versand), Steuer-Assistent (`isSteuerAssistentAktiv`, reports.js); OCR-Bereitschaft
(`isOcrAktiv`, documents.js). UI: drei Anbieter-Selects in der „Externe KI"-Karte (`ui/shell.js`) + EU-Hinweis. i18n
de+en, SW `v146`, 126 Module. **GoBD/Krypto:** kein Datenmodell-Eingriff, nur Gating der ausgehenden KI-Aufrufe.
**Ehrliche Grenze:** „kontierung" bündelt Kontierung **und** Begründung (beide Mistral-Textfunktionen mit On-Device-
Fallback); DOM/IndexedDB statisch geprüft (kein Headless-Browser); reine Logik node-getestet. **Sprint-Pointer → S5
(P8 — QR-Einzelteilen).**

**⏭ START HIER → 5-Sitzungs-Sprint (Nutzer 2026-06-19):** genau diese Punkte, **EINER pro Sitzung**, danach
**Besprechung**. **Sitzung 1 → P9 ✅** · **Sitzung 2 → P10 ✅** · **Sitzung 3 → P3+P4 ✅** · **Sitzung 4 → P2 ✅**
(KI-Anbieterwahl je Modus, strikt EU). **Sprint-Pointer steht jetzt auf Sitzung 5 → P8** (QR-Einzelteilen, vendored
reiner JS-Encoder — build-frei prüfen, sonst ehrlich als blockiert melden und rückfragen). **Danach: BESPRECHUNG mit
dem Nutzer — NICHT selbstständig weiterlaufen.** **Arbeitsauftrag:** selbstständig nach Logik + Nutzen handeln;
**größere Konflikte/Unklarheiten über `AskUserQuestion` eskalieren**, Kleines selbst entscheiden. Details + Sprint-
Pointer im **paste-fertigen COPY-Block** in `docs/NAECHSTE_SITZUNG.md`.

**P9 — Datei-Import mit exaktem Schlüssel-Abgleich ✅ (Sitzung 1, 2026-06-19):** macht den Pseudonym-Round-Trip
**dateibasiert/sitzungsübergreifend**. Reine Logik `src/ai/schluesselabgleich.js` (node-getestet, +38 → **1810/1810**):
`gleicheAb(text, schluessel)` (exakter Token↔Klartext-Abgleich, verlustfrei; Bericht `ersetzt`/`fehlend`/`ungenutzt`/
`vollstaendig` — Token OHNE Schlüssel bleiben sichtbar stehen, nichts erfunden), `serialisiereSchluessel`/`parseSchluessel`
(Schlüssel-Datei = „Anker-Tresor", JSON `blp-schluessel` v1, robust ggü. map-Liste/`{token:wert}`-Objekt),
`tokenVorkommen`/`typAusToken`/`istToken`/`schluesselAusMap`/`abgleichBericht` (Zähler ohne Klartext)/`pruefeRoundtrip`
(Selbsttest, auch mit Briefkasten-Scopes). UI `src/ui/schluesselabgleich.js` als zusammenklappbare Karte in den
Einstellungen (unter „Datenschutz bei KI"): **1.** Klartext → pseudonymes Dokument (Download) + Schlüssel-Datei
(Anker-Tresor, gerätelokal) via `ladeAnker`+`tokenize`; **2.** Antwort-Dokument + Schlüssel-Datei laden → `gleicheAb` →
re-identifizierter Text + ehrlicher Bericht (fehlende/ungenutzte Schlüssel). i18n de+en, SW `v143`, neue Module precached.
**Ehrliche Grenze:** DOM/Datei-Picker/Download **statisch geprüft** (kein Headless-Browser); reine Logik node-getestet.

**P6 — CSV/vCard-Kundenimport ✅ (#167, 2026-06-19):** reine Logik `domain/kundenimport.js` (`parseKundenCsv`/
`parseVcard`/`normalizeKunde`/`importKundenAusText`, +18 → **1772/1772**) + Import-Karte in `ui/views/customers.js`
(verschlüsselt, vorhandene Namen übersprungen) + additives Feld `telefon` in `crm-store.saveKunde`. SW `v142`.
**Davor — Transparenzbericht in der App ✅ (#166):** „Recht & Doku" verlinkt `docs/TRANSPARENZ_ZWISCHENSTAND.html`
(eine Quelle der Wahrheit, netz-zuerst → stets aktuell, offline gecacht).

---

**V-Lohn — Lohn-Buchungskern KOMPLETT (BAUPLAN Block 4 — Nutzer-Entscheidung 2026-06-18):** Finiter
Track (6 Schritte), **L1–L6 erledigt + gemergt** (#158/#159/#160/#162/#163 + Doku). **Scope bewusst eng:** BLP ist die **prüfungssichere Buchhaltungsschicht** für die Lohnabrechnung,
**nicht die Abrechnung selbst** — es berechnet KEINE Lohnsteuer/SV (kein ELStAM/DEÜV/amtl. Tabellen); die Beträge kommen
aus der Entgeltabrechnung des Lohnbüros/Beraters. **L1 ✅ (#158)** reine Logik `domain/lohnbuchung.js` (Brutto-Methode
`lohnBuchungZeilen`/`lohnBuchungEntwurf`/`validateLohnlauf`: Soll 4120 Brutto + 4130 AG-SV, Haben 1200/1740 Netto + 1741
Steuern + 1742 SV) + Seed-Konten 4110/1740/1741/1742. **L2 ✅ (#159)** Store `domain/lohn-store.js` (verschlüsselt:
`saveLohnlauf`/`listLohnlaeufe`/`getLohnlauf`/`deleteLohnlauf`/`bucheLohnlauf`) + reine `normalizeLohnlauf`/
`lohnkontoAggregat`/`lohnlaufBuchungsdatum`. **L3 ✅ (#160)** UI `ui/views/lohn.js` (NAV „Lohn", privat/verein
ausgeblendet): Lohnlauf erfassen (Mitarbeiter/Monat/Brutto/Steuern/SV + Live-Vorschau) → speichern → „Buchen (Entwurf)"
(`saveEntwurf`, Festschreiben manuell/GoBD) → Lohnkonto je Mitarbeiter. **End-to-end bedienbar.** **L4 ✅ #162** monatliche Lohnsteuer-Anmeldung als Kennzahlen-Datenpaket
(`lohnsteuerAnmeldung` + `export.buildLohnsteuerAnmeldungPaket`, NICHT amtlich, kein Direktversand). **L5 ✅ #163**
SV-/LSt-Zahlungsübersicht (`offeneLohnabgaben` Saldo 1741/1742 + `lohnabgabeZahlungEntwurf`, „Als bezahlt buchen").
**L6 ✅** Doku `docs/LOHN.md`. SW `v140`, **1754/1754** grün, DOM/IndexedDB statisch geprüft. **⏭ Nächster Schritt
(BLP):** offen — Browser-Sichttest der Lohn-Ansicht durch den Nutzer; sonst umgebungs-/menschen-blockierte Punkte oder
eine neue, abgestimmte Idee. **Parallel (Nutzer-Wunsch, eigenes Repo):** Mein-WorkFloh **Test-Modus nach
`docs/TEST_MODUS.md`** (⇄-Abschnitt).

---

**Davor — Liquiditäts-Treiber (größte anstehende Bewegungen) (#157, BAUPLAN Block 3 — Folgeschritt zur Reichweite):**
Die Liquiditäts-Karte zeigte Summen/Salden (wie viel, wie tief, bis wann), aber nicht die naheliegende Anschlussfrage
„woran liegt das?" — welche einzelne Forderung sich einzutreiben lohnt, welche Verbindlichkeit groß ansteht. Reine Logik
`domain/liquiditaet.js` (node-getestet, +14 → **1689/1689**): **`groessteFaellige({forderungen, verbindlichkeiten, heute,
horizontTage, limit})`** — die nach offenem Betrag absteigend sortierten bald fälligen Posten aus DEMSELBEN Fenster wie
`baldFaellig` (nicht überfällig), je Eintrag `{richtung:'ein'|'aus', betragCent, faelligAm, name, referenz}`, auf `limit`
(Default 3, Konstante `LIQUIDITAET_TREIBER_DEFAULT`) gekürzt, ≤0-Beträge raus, deterministische Sortierung (Betrag →
früheste Fälligkeit → Name). UI `ui/views/dashboard.js`: kleine Liste „Größte anstehende Bewegungen" in der Liquiditäts-
Karte (Wer/Referenz/Datum links, vorzeichenbehafteter Betrag rechts, Eingang +/grün, Ausgang −/rot) über das bestehende
`report-line`-Layout — gefüttert aus denselben angereicherten Posten. i18n de+en (`dashboard.liquidityDriversLabel`/
`…DriverIn`/`…DriverOut`), SW `v135` (kein neues Modul). **bucht nichts.** **Ehrliche Grenze:** reine Anzeige/Auswahl,
keine Finanzberatung; nur über bald fällige, bekannte Posten; DOM/IndexedDB statisch geprüft. **Nächster Schritt
(optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue,
abgestimmte Idee.

---

**Davor — Liquiditäts-Reichweite („Runway" — bis wann reicht das Geld?) (BAUPLAN Block 3 — Folgeschritt zu #154):**
Die Liquiditäts-Karte zeigte Tiefpunkt (tiefster Stand) und Deckungslücke (fehlender Betrag), aber nicht die intuitivste
Antwort auf die im Karten-Code selbst gestellte Frage „reicht das Geld?": **bis wann**. Der Tiefpunkt nennt den *tiefsten*
Tag, die Reichweite den *frühesten* Engpass (kann VOR dem Tiefpunkt liegen). Reine Logik `domain/liquiditaet.js`
(node-getestet, +12 → **1675/1675**): **`liquiditaetsReichweite(verlauf, {reserveCent, heute})`** — erster Tag, an dem der
laufende Saldo (`liquiditaetsVerlauf.punkte[].saldoCent`) unter die Schwelle (Mindestreserve, Default 0 → echtes Minus;
konsistent via `normalizeReserveCent`) fällt → `{bekannt, reicht, sofort, datum, tageBis, reserveCent, negativ}` (ohne
Bestand `bekannt:false` abwärtskompatibel; `sofort` = schon heute unter Schwelle; `negativ` = echtes Minus vs. nur
Reserve-Unterschreitung). UI `ui/views/dashboard.js`: Klartext-Bilanz „reicht über N Tage" bzw. „reicht bis {datum}" (rot
bei echtem Minus), nur wenn es Ausgänge gibt und der Bestand bekannt ist; der `sofort`-Fall bleibt Ampel/Deckungslücke.
i18n de+en (`dashboard.liquidityRunwayOk`/`…RunwayUntil`), SW `v134` (kein neues Modul). **bucht nichts.** **Ehrliche
Grenze:** einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; nur über bald fällige, bekannte Posten (kein
Forecast wiederkehrender Kosten); DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch
den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.

**Liquiditäts-Mindestreserve (Puffer) in der Deckungslücke (vorige Sitzung, BAUPLAN Block 3 — Folgeschritt zu #153, PR #154):**
Die Deckungslücke (#153) warnte bisher erst, wenn der laufende Saldo im Fenster ECHT unter null rutscht. Viele Betriebe
wollen ihr Geld aber nicht bis auf null herunterfahren, sondern einen Sicherheitspuffer (Mindestreserve) halten. Reine Logik
`domain/liquiditaet.js` (node-getestet, +17 → **1663/1663**): `normalizeReserveCent(value)` (klemmt einen persistierten
Reservebetrag auf ganze, nicht-negative Cent; ungültig/negativ → 0) + `deckungsluecke(verlauf, {reserveCent})` mit optionaler
**Mindestreserve als Schwelle** — Default 0 → identisch zu vorher (abwärtskompatibel); die Lücke greift, sobald der Tiefpunkt
unter die Schwelle fällt (`lueckeCent` = Schwelle − Tiefpunkt), neue Felder `reserveCent` + `negativ` (Tiefpunkt < 0 = echte
Illiquidität vs. nur Reserve-Unterschreitung). Setting `liquiditaetReserveCent` (`state.js`, Default 0, gerätelokal/
verschlüsselt). UI `ui/views/dashboard.js`: Euro-Eingabefeld „Mindestreserve (Puffer)" in der Liquiditäts-Karte; der
Lücken-Hinweis warnt **rot** (`hint-error`) bei echtem Minus und **mild** (`muted small`) bei reiner Reserve-Unterschreitung
(eigene i18n-Variante mit Reserve-Betrag). SW `v133` (kein neues Modul). **bucht nichts.** **Ehrliche Grenze:** einfache
Planung nach Fälligkeitsdatum, keine Finanzberatung; die Reserve ist ein frei gewählter Puffer, keine modellierte Kennzahl;
DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/
menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Liquiditäts-Deckungslücke (Unterdeckung im Fenster) (diese Sitzung, BAUPLAN Block 3 — Folgeschritt zu #152):** Der
Tiefpunkt-Hinweis (#152) zeigt den tiefsten Stand auch dann, wenn er positiv bleibt (reine Info). Wenn der laufende Saldo
aber zwischendurch ECHT ins Minus rutscht und sich bis zum Fenster-Ende wieder erholt (große Verbindlichkeit früh,
ausgleichende Forderung spät), bleibt der Engpass von der End-Saldo-Ampel (`liquiditaetsAmpel`, projiziert<0) unentdeckt —
und es fehlt der konkrete Finanzierungs-Betrag. Reine Logik `domain/liquiditaet.js` **`deckungsluecke(verlauf)`**
(node-getestet, +8 → **1646/1646**): nimmt das `liquiditaetsVerlauf`-Ergebnis und liefert `{unterdeckung, lueckeCent,
datum}` — greift nur bei `tiefpunktCent < 0` (`lueckeCent` = −`tiefpunktCent`, `datum` = `tiefpunktDatum`), sonst keine
Unterdeckung (abwärtskompatibel). UI `ui/views/dashboard.js`: warnfarbener Hinweis (CSS `.hint-error`) „Unterdeckung: Bis
zum {datum} fehlen … {betrag}" — unabhängig vom End-Saldo; **bucht nichts**. i18n de+en (`dashboard.liquidityGapHint`), SW
`v132` (kein neues Modul). **Ehrliche Grenze:** einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; DOM/IndexedDB
statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte
Block-3-Punkte oder eine neue, abgestimmte Idee.
**Liquiditäts-Tiefpunkt (laufender Saldo im Fenster) (diese Sitzung, BAUPLAN Block 3 — Folgeschritt zu #149):** Die
Projektion (#149) prüfte nur den Saldo am **Fenster-ENDE** — der kann positiv sein, obwohl der laufende Saldo
zwischendurch ins Minus rutscht (große Verbindlichkeit früh, ausgleichende Forderung spät). Reine Logik
`domain/liquiditaet.js` **`liquiditaetsVerlauf(opts)`** (node-getestet, +17 → **1638/1638**): bündelt bald fällige
Bewegungen je Fälligkeits-Tag, addiert sie chronologisch ab dem aktuellen Geldbestand auf → `punkte[]` (Saldo nach jedem
Tag) + `startCent`/`endeCent` + **`tiefpunktCent`/`tiefpunktDatum`** (tiefster Stand + wann; startet beim heutigen
Bestand). Ohne `geldbestandCent` → Saldo-Felder `null` (abwärtskompatibel). UI `ui/views/dashboard.js`: Tiefpunkt-Hinweis
in der Liquiditäts-Karte — nur, wenn der laufende Saldo zwischendurch UNTER den End-Saldo fällt (sonst keine neue Info);
**bucht nichts**. i18n de+en (`dashboard.liquidityLow`/`…LowHint`), SW `v131` (kein neues Modul). **Ehrliche Grenze:**
einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung), Bündelung je Tag (kein Intraday); DOM/IndexedDB
statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-
blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Liquiditätsvorschau: wählbares Zeitfenster (diese Sitzung, BAUPLAN Block 3 — Folgeschritt zu #149):** Die Liquiditäts-
Karte rechnete bisher fest mit 7 Tagen. Jetzt ist das Fenster **7 / 14 / 30 / 90 Tage** umschaltbar (Segment-Wahl in der
Karte, Setting `liquiditaetHorizontTage`, gerätelokal/verschlüsselt). Reine Logik `domain/liquiditaet.js` (node-getestet,
+11 → **1621/1621**): `LIQUIDITAET_HORIZONT_OPTIONEN` (= [7,14,30,90]) + `normalizeHorizont(value)` (klemmt persistierte/
ungültige Werte auf eine kuratierte Option, Default 7). UI `ui/views/dashboard.js`: `.segmented`-Umschalter über den
KPI-Kacheln → `updateSettings({liquiditaetHorizontTage})` + Dashboard-Neuzeichnung; `liquiditaetsVorschau`/`baldFaellig`
rechnen mit dem gewählten Horizont (die reine Logik nahm `horizontTage` bereits entgegen). i18n de+en
(`dashboard.liquidityHorizonLabel`/`…HorizonDays`), SW `v130` (kein neues Modul — `liquiditaet.js` bereits precached).
**bucht nichts.** **Ehrliche Grenze:** weiterhin einfache Planung nach Fälligkeitsdatum, keine Forecast-Modellierung; DOM/
IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-
blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Liquiditätsvorschau um Geldbestand + projizierten Saldo erweitert (diese Sitzung, BAUPLAN Block 3 — PR #149):**
Folgeschritt zur Liquiditätsvorschau (#147): die reine Eingänge-vs-Ausgänge-Sicht beantwortete noch nicht „reicht das
Geld?". Jetzt wird der **aktuelle Geldbestand (Kasse + Bank)** als Startwert herangezogen und daraus ein **projizierter
Saldo** am Fenster-Ende gebildet (Bestand + Eingänge − Ausgänge). Reine Logik `domain/liquiditaet.js` (node-getestet,
+25 → **1610/1610**): `GELDKONTO_BEREICHE` + `istGeldkonto(konto)` (AKTIV-Konten 1000–1099 Kasse / 1200–1299 Bank;
Forderungen/Vorsteuer bleiben außen vor), `geldbestand(buchungen, konten, {stichtag})` (Saldo je Geldkonto Soll−Haben aus
den **festgeschriebenen** Buchungen, Entwürfe zählen nicht, optional bis Stichtag), `liquiditaetsVorschau(opts.geldbestandCent)`
→ `geldbestandCent`+`projiziertCent` (ohne Bestand bleiben beide `null` → abwärtskompatibel), `LIQUIDITAET_AMPEL`+
`liquiditaetsAmpel` (kritisch bei projiziert < 0, Warnung wenn der Bestand allein die Ausgänge nicht deckt, sonst ok). UI
`ui/views/dashboard.js`: die Liquiditäts-Karte zeigt zusätzlich „Kontostand (Kasse + Bank)" + „voraussichtlich in N Tagen"
(ampelgefärbt) + ehrlichen Hinweis bei knapper/negativer Projektion; gefüttert aus den bereits geladenen `konten`/`buchungen`;
**bucht nichts**. i18n de+en, SW `v129` (kein neues Modul). **Ehrliche Grenze:** einfache Planung nach Fälligkeitsdatum (keine
Forecast-Modellierung von Skonto/Teilzahlungen/Steuern); Geldkonto-Erkennung über die 4-stelligen SKR03-Nummernbereiche;
DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/
menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Dashboard-KPI: Liquiditätsvorschau (bald fällig) erledigt (BAUPLAN Block 3 — PR #147):**
Vorausschauender Gegenpol zu den beiden Überfälligkeits-KPIs (#143 Verbindlichkeiten / #145 Forderungen): während jene
zeigen, was **bereits überfällig** ist, zeigt die neue Karte, was in den **nächsten 7 Tagen fällig** wird — erwartete
**Eingänge** (bald fällige Forderungen) gegen **Ausgänge** (bald fällige Verbindlichkeiten) + **Netto** (einfache
Cash-Planung auf einen Blick). Reine Logik `domain/liquiditaet.js` (node-getestet, +14 → **1585/1585**):
`baldFaellig(angereichertePosten, {heute, horizontTage})` (Posten im Fenster `[heute … heute+Horizont]`, **nicht
überfällig** → keine Doppelzählung mit den Überfälligkeits-KPIs; liest `offenCent` (Verbindlichkeiten) **und** `betragCent`
(Forderungen)) + `liquiditaetsVorschau({forderungen, verbindlichkeiten, …})` (eingehend/ausgehend/netto, Horizont
durchgereicht, Default 7). UI `ui/views/dashboard.js`: Karte „Liquiditätsvorschau (bald fällig)" am Kopf — gefüttert aus
denselben angereicherten Posten wie die Überfälligkeits-Karten (`forderungReport`/`verzugReport`); nur im Firmen-/Vereins-
Kontext sichtbar (Forderungen via Ansicht `orders`, Verbindlichkeiten via `payables`; Privat blendet beide aus) UND wenn
etwas bald fällig ist; **Netto** nur, wenn beide Seiten sichtbar; **bucht nichts**. i18n de+en, SW `v128` (neues Modul
precached). **Ehrliche Grenze:** einfache Planung nach Fälligkeitsdatum, keine Forecast-Modellierung (Skonto/Teilzahlungs-
Wahrscheinlichkeit/Zinsen bewusst nicht); DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-
Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Dashboard-KPI: überfällige Forderungen (Mahnwesen) erledigt (diese Sitzung, BAUPLAN Block 3 — PR #145):**
Spiegel zur Verbindlichkeiten-KPI (#143), aber aus **Gläubigersicht** — die in `docs/OFFENE_PUNKTE.md` (A1)
dokumentierte Dashboard-Intention „Kennzahl überfällige Forderungen, Summe + Anzahl". Damit sind beide Seiten
(Forderungen ⇄ Verbindlichkeiten) symmetrisch auf einen Blick auf der Übersicht. Reine Logik
`domain/mahnwesen.js` (node-getestet, +20 → **1571/1571**): **`forderungUebersicht(angereichertePosten, opts)`**
(Spiegel zu `verzugUebersicht`: überfällige Anzahl/Summe + Σ §-288-Zins-Potenzial + kritisch ab 1. Mahnung/≥14 Tage),
**`FORDERUNG_AMPEL`/`forderungAmpel`** (Spiegel zu `verzugAmpel`) und **`forderungReport(auftraege, opts)`**
(Ein-Aufruf-Einstieg `offenePosten` → `anreicherePosten` → `forderungUebersicht`; Import `mahnwesen → zahlungsabgleich`
zyklenfrei). UI `ui/views/dashboard.js`: Karte „Überfällige Forderungen (Mahnwesen)" am Kopf — nur sichtbar, wenn das
Mahnwesen im Nutzungskontext aktiv ist (`zeigeFeature MAHNWESEN`; Privat blendet aus) UND etwas überfällig ist; Klick →
Berichte (Mahnwesen-Karte); **bucht nichts**. i18n de+en (`dashboard.overdueReceivables*`), SW `v127` (keine neuen
Module). **Ehrliche Grenze:** Hilfs-Einordnung, keine Rechtsberatung; aggregiertes Zins-Potenzial nutzt den
konservativen B2B-Aufschlag (kein per-Kunde-B2B); DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):**
Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Dashboard-KPI: überfällige Verbindlichkeiten (eigene Zahlungsdisziplin) erledigt (BAUPLAN Block 3 — PR #143):**
Die node-getestete Verzugs-KPI (`verzugReport`/`verzugUebersicht`, „eigene Zahlungsdisziplin") war bisher nur in der
Verbindlichkeiten-Ansicht sichtbar (#142). Jetzt auch **auf der Übersicht (Dashboard)** — überfällige eigene
Verbindlichkeiten auf einen Blick (Liquiditäts-/Verzugsrisiko); spiegelt die für die Forderungsseite dokumentierte
Dashboard-Intention. Reine Logik `domain/eingangsverzug.js` **`verzugAmpel(uebersicht)`** (+ `VERZUG_AMPEL`,
node-getestet, +8 → **1551/1551**): Ampel ok|warnung|kritisch für die KPI-Färbung (kritisch sobald eine Verbindlichkeit
≥ 14 Tage überfällig ist; defensiv geklemmt). UI `ui/views/dashboard.js`: Karte „Überfällige Verbindlichkeiten (eigene
Zahlungsdisziplin)" am Kopf der Übersicht über `verzugReport`/`verzugAmpel` — nur im Firmen-/Vereins-Kontext
(`zeigeAnsicht 'payables'`, in Privat ausgeblendet) UND wenn etwas überfällig ist (sonst kein Lärm); Klick →
Verbindlichkeiten-Ansicht; **bucht nichts**. i18n de+en, SW `v126` (keine neuen Module — alle bereits precached).
**Ehrliche Grenze:** Hilfs-Einordnung, keine Rechtsberatung; DOM/IndexedDB statisch geprüft. **Nächster Schritt
(optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue,
abgestimmte Idee.
**Verzugsrisiko-Übersicht in der Verbindlichkeiten-Ansicht erledigt (diese Sitzung, BAUPLAN Block 3 — Folgeschritt zu #140):**
Die in #140 angelegte, **node-getestete** KPI-Logik `verzugUebersicht` („eigene Zahlungsdisziplin") war bisher in keiner
UI sichtbar. Reine Logik `domain/eingangsverzug.js` **`verzugReport(rechnungen, opts)`** (node-getestet, +7 →
**1543/1543**): Ein-Aufruf-Einstieg von den gespeicherten Eingangsrechnungen zur KPI — `offeneVerbindlichkeiten`
(`payables.js`) → `anreichereVerbindlichkeiten` → `verzugUebersicht`; damit ist der Pfad Roh-Rechnung → Kennzahl
node-testbar (Import zyklenfrei). UI `ui/views/payables.js`: Karte „Verzugsrisiko (eigene Zahlungsdisziplin)" am Kopf
der Ansicht (überfällige Anzahl/Summe + § 288-Zinsrisiko + kritisch ≥ 14 Tage), nur sichtbar wenn etwas überfällig ist;
**bucht nichts**. i18n de+en, SW `v125` (keine neuen Module). **Ehrliche Grenze:** Hilfs-Einordnung, keine
Rechtsberatung; DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer;
sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue, abgestimmte Idee.
**Buchung gezahlter Verzugskosten (Zinsaufwand) erledigt (diese Sitzung, BAUPLAN Block 3 — Folgeschritt zu #140, PR #141):**
Spiegel zu `mahnwesen.mahnbuchungEntwurf` (R1) aus **Schuldnersicht** — zahlt man eine berechtigte Lieferanten-Mahnung,
entsteht Zins-/Gebühren-**AUFWAND**. Reine Logik `domain/eingangsverzug.js` (node-getestet, +20 → **1536/1536**):
`VERZUG_AUFWAND_KONTEN` (SKR03: 2100 Zinsaufwand, 4980 sonstiger betrieblicher Aufwand, 1200 Bank, 1600 Verbindlichkeit)
+ `VERZUG_GEGENKONTO` (bank|verbindlichkeit); `verzugAufwandZeilen` (Soll 2100/4980 AN Haben Bank/Verbindlichkeit, **ohne
Vorsteuer** — nicht steuerbarer Schadensersatz Abschn. 1.3 UStAE; ausgeglichen; nur Zinsen/nur Gebühren; Konto-Override);
`verzugAufwandEntwurf` (vollständiger Buchungs-Entwurf, null bei 0/0). UI `ui/views/payables.js`: in der „Mahnung
prüfen"-Karte neuer Abschnitt „Verzugskosten buchen (Zinsaufwand)" — Gegenkonto-Wahl (Bank sofort / Verbindlichkeit auf
Ziel) + Knopf, der die eingegebenen geforderten Beträge als Buchungs-**ENTWURF** übernimmt (`ensureSeedKonten` +
`saveEntwurf`); **Festschreiben manuell (GoBD)**. i18n de+en, SW `v124`. **Ehrliche Grenze:** bucht die eingegebenen
geforderten Beträge (keine Auto-Deckelung aufs Berechtigte); DOM/IndexedDB statisch geprüft. **Nächster Schritt
(optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte oder eine neue,
abgestimmte Idee.
**Eingangsrechnungs-Verzug (Gegenseite) erledigt (diese Sitzung, BAUPLAN Block 3):** Spiegel zum Mahnwesen aus
**Schuldnersicht**. Reine Logik `src/domain/eingangsverzug.js` (node-getestet, +33 → **1516/1516**): `verzugsstufe`
(gestaffelte Überfälligkeit 1/14/42 Tage, `kritisch`-Flag) + `verzugsstufeLabel`; `verzugsLage` (Fälligkeit + Tage,
angereicherte Felder vor Datum+Ziel, Default 30); `berechtigteVerzugskosten` (§ 288-Verzugszinsen via
`verzugszinsenCent` + 40-€-Pauschale via `mahnpauschaleCent`, wiederverwendet aus `mahnwesen.js`, `b2b` Default true);
**`pruefeErhalteneMahnung`** (geforderte vs. berechtigte Zinsen/Gebühren → `plausibel`/`ueberhoeht`/`kein_verzug`/
`ohne_angabe`, Toleranz 5 Cent); `verzugUebersicht` (überfällig-Anzahl/-Summe + Zinsrisiko). UI `ui/views/payables.js`:
Verzugsstufen-Badge je überfälligem Posten + Knopf „Mahnung prüfen" → Karte „Erhaltene Mahnung prüfen (§ 288 BGB)"
(Live-Vergleich + Bewertungs-Badge + § 286/§ 247-Disclaimer; **bucht nichts**). i18n de+en, CSS `.badge-error`, SW `v123`.
**Ehrliche Grenze:** Hilfs-Einordnung nach Tagen überfällig (keine Rechtsberatung); Buchung gezahlter Verzugskosten
(Zinsaufwand) bewusst als Folgeschritt offen. DOM/IndexedDB statisch geprüft. **Nächster Schritt (optional):** Buchung
gezahlter Verzugskosten; sonst weitere Block-3-Punkte (Server-Backup/WorkFloh — blockiert) oder Browser-Sichttest.
**Kalibrierte Vorwärtskalkulation im Angebots-Editor erledigt (diese Sitzung, BAUPLAN Block 2 — Folgeschritt zu
Schritt 10):** Die in Schritt 10 fertige reine Logik (`kalkuliereKalibriert`) ist jetzt im Angebots-Editor anwendbar.
Die reinen **Anwendungs-Primitiven** `kalibriereEingabe`/`kalkuliereKalibriert` sind in den **Kern** (`domain/kalkulation.js`)
gewandert (reine Kern-Operation: Mengen-/Geld-Treiber je Kostenart skalieren); `domain/kalibrierung.js` re-exportiert sie
→ öffentliche API stabil. Neuer reiner `domain/produktschemata.js` **`kalkuliereSchemaKalibriert`** (Schema-Eingabe →
`kalibriereEingabe` → Kern); `domain/angebote.js positionAusSchema` akzeptiert **`opts.faktoren`** und rechnet die interne
Kalkulation kalibriert + merkt `kalkulation.kalibriert`/`faktoren` (Außendokument bleibt NEUTRAL — Prime Directive, per
Whitelist geprüft). Glue `domain/nachkalkulation-store.js ladeKalibrierungFaktoren()` (konservativ gedeckelte `faktorWerte`
0,5–2,0 + Stichprobengröße). UI `ui/views/angebote.js`: Schalter **„Erfahrungswerte anwenden (Kalibrierung aus N
abgeschlossenen Aufträgen)"** (Setting `kalibrierungAnwenden`, nur sichtbar, wenn Historie vorliegt), kalibrierte
Positionen tragen ein „kalibriert"-Badge, der Live-Deckungsbeitrag spiegelt die Kalibrierung automatisch (er liest die
interne `kalkulation.ergebnis`). i18n de+en, SW `v121`. +9 Tests (**1475/1475**). **Ehrliche Grenze:** lineare Korrektur
(Faktoren skalieren Treiber, keine neue Formel); DOM/IndexedDB statisch geprüft (kein Headless-Browser) — die reine Logik
ist node-getestet. **Nächster Schritt (optional, verbleibend): echte Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag.**
**Standard-konto→Kostenart-Zuordnung erledigt (diese Sitzung, BAUPLAN Block 2 — Folgeschritt Nachkalkulation):** Die in
der Nachkalkulation-UI als ehrliche Grenze genannte pauschale „alles = Material"-Vorbelegung verfeinert. Reine Logik
`src/domain/nachkalkulation.js` (node-getestet, +22 → **1466/1466**): `kostenartFuerKonto(nummer)` ordnet eine Aufwands-
Kontonummer nach **SKR03-Kontenklasse** einer Kostenart zu (3100–3199 Fremdleistungen → **ZUKAUF**, 3000–3999
Wareneingang/Roh-Hilfs-Betriebsstoffe → **MATERIAL**, 4100–4199 Personalaufwand → **ARBEIT**; alles übrige → null →
bisheriger Default MATERIAL); `standardKontoBlock(konten)` baut daraus die `kontoBlock`-Map (nur AUFWAND-Konten mit
sicherer Zuordnung). `domain/nachkalkulation-store.js ladeNachkalkulationKontext` erzeugt die Map automatisch aus dem
Kontenplan und reicht sie in `kostentraegerAnalyse` durch → Wareneingang/Fremdleistung/Lohn werden ohne manuelle
Pflege korrekt klassifiziert; `opts.kontoBlock` (manuell) **gewinnt** weiterhin. SW `v120`. **Ehrliche Grenze:**
Heuristik nach Kontenklasse, KEINE exakte Einzelkosten-Zuordnung; Class-4-Gemeinkosten bleiben unklassifiziert
(→ Default Material, falls einem Kostenträger zugeordnet); MASCHINE kommt nur über die Zeiteinträge. Glue/IndexedDB
statisch geprüft. **Nächster Schritt (optional, verbleibend): Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag +
kalibrierte Vorwärtskalkulation im Angebots-Editor.**
**Adaptiver Baukasten — reine Sortier-/Zähl-Logik erledigt (diese Sitzung, BAUPLAN Block 2/Schritt 11a):** Die
build-freie, node-testbare Logik UNTER der späteren Angebots-UI (Katalog §3). Reine Logik `src/domain/baukasten.js`
(node-getestet, +33 → **1427/1427**): **(1) Nutzungszähler je Leistungsart** — Profil `{ schemaId: {anzahl, zuletzt} }`,
`leeresNutzungsprofil`/`normalizeNutzung` (säubert persistierte Profile)/`nutzungVon`/`anzahlVon`/`istGenutzt`/
`zaehleNutzung` (immutabel, Zeitstempel injizierbar, `um:` für Mehrfach). **(2) Adaptive Palette** — `baukastenPalette`
reichert je Schema `{anzahl, zuletzt, genutzt}` an und sortiert **häufig → zuletzt → Katalog-Reihenfolge** (stabil;
ungenutzte behalten ihre Reihenfolge); `sortiereSchemata` + `haeufigsteSchemata(…, n)` (Schnellzugriff, nur genutzte).
**(3) Umsortieren (Drag-and-drop)** — `verschiebePosition` (immutabel, klemmt das Ziel, behält Element-Referenz → interne
`kalkulation` unberührt) + `verschiebeNachOben`/`verschiebeNachUnten`. SW `v115`. **Rein, kein UI** (Schritt 11b sitzt
darüber, braucht Angebots-Ansicht + verschlüsselte Store-Glue). Prime Directive: kennt nur IDs/Zähler/Reihenfolge, keine
Marge. **Nächster Schritt: Block 2/Schritt 11b — die UI über `domain/baukasten.js`.**
**Kalibrierung + Statistik/Vergleich erledigt (vorige Sitzung, BAUPLAN Block 2/Schritt 10):** Kern-USP „selbstlernende
Kalkulation" (Katalog §5.1/§5.3) — die Korrekturfaktoren aus der eigenen Historie + die Trefferquote. Reine Logik
`src/domain/kalibrierung.js` (node-getestet, +39 → **1394/1394**): **(1) Korrekturfaktoren je Kostenart** aus den Soll/Ist-
Vergleichen vieler Aufträge — `korrekturFaktoren(vergleiche)` (Form `nachkalkulation().perBlock`) liefert je Kostenart
`faktor` (ΣIST/ΣSOLL, geldgewichtet), `medianFaktor` (robust, Median der Einzel-Job-Faktoren), `abweichungProzent` und
`anzahl`; `faktorWerte` verdichtet konservativ zu Multiplikatoren (`minAnzahl`/`min`/`max`-Schranken, null→1 neutral,
Quelle gewichtet|median). **Rückfluss in den Kern:** `kalibriereEingabe`/`kalkuliereKalibriert` skalieren je Kostenart
den Mengen-/Geld-Treiber (analog `produktschemata.js` „füttert nur den Kern" — keine neue Formel). **(2) Angebots-
Trefferquote je Preisniveau:** `angebotErgebnis` (gewonnen/verloren/offen aus Status; `archiviert` mehrdeutig→offen, per
opts überschreibbar), `angebotMargeProzent` (DB/Netto aus `interneAuswertung`), `preisniveau` (niedrig/mittel/hoch,
Grenzen konfigurierbar), `trefferquote`/`trefferquoteJePreisniveau`. **(3)** `kalibrierungsDigest` = **PII-FREIE**
Aggregat-Zusammenfassung (nur Kostenart-Faktoren + Margen-Kübel) als möglicher Payload-Kandidat für eine **spätere, STRIKT
opt-in + BYOK** pseudonyme KI-Analyse (Mistral EU, CLAUDE.md §8) — diese Schicht SENDET NICHTS. SW `v114`. **Rein, kein
UI/Store** (eigener Folgeschritt). Prime Directive: Faktoren/Margen/Quoten bleiben intern. **Nächster Schritt: Block 2/
Schritt 11 — Adaptiver Baukasten-UX.**
**Auftrags-Kostenträger + Nachkalkulation erledigt (diese Sitzung, BAUPLAN Block 2/Schritt 9):** Kern-USP „selbstlernende
Kalkulation" (Katalog §5.1/§6) — der Soll/Ist-Vergleich je fertigem Auftrag. Reine Logik `src/domain/nachkalkulation.js`
(node-getestet, +29 → **1355/1355**): ein **Kostenträger** = Auftrag/Projekt über seine `kostenstelle`. **IST** aus den
vorhandenen Bausteinen — `istkostenAusBuchungen` (Aufwands-Zeilen FESTGESCHRIEBENER Buchungen je `kostenstelle`,
Aggregationsweg wie `costcenters.js`; `belegRef`/`buchungId` je Buchung mitgeführt; konto→Kostenart über `opts.kontoBlock`,
Default Material) + `istZeitkosten` (Zeiteinträge `{dauerMin}` aus dem `employees.js`-Modell × interner Stundenkostensatz,
Arbeit/Maschine getrennt) + `istkosten` (beides zusammengeführt). **SOLL** aus der Vorkalkulation `sollkostenAusAngebot`
(interne `kalkulation` je Position × Menge nach Kostenart; Σ Blöcke = Selbstkosten, Netto/DB wie `interneAuswertung`).
**Vergleich** `nachkalkulation(soll, ist, {nettoCent?})` → je Kostenart + gesamt Abweichung (IST − SOLL) + Prozent,
Deckungsbeitrag SOLL gegen IST (Erlös − Ist-Kosten); `kostentraegerAnalyse` als Komfort-Einstieg. SW `v113`. **Rein, kein
UI/Store** (eigener Folgeschritt; Buchungen/Konten-Index/Zeiteinträge werden hereingereicht). Prime Directive: Nachkalkulation
rein intern. **Nächster Schritt: Block 2/Schritt 10 — Kalibrierung + Statistik/Vergleich.**
**Setting `rechnungsstelle` erledigt (diese Sitzung, BAUPLAN Block 2/Schritt 4 — Block-2-Enabler):** Nummernkreis-Hoheit
(§14) als Setting `rechnungsstelle` (`blp|extern`, Default `blp`, Katalog §7a). Reine Logik `src/domain/rechnungsstelle.js`
(node-getestet, +23): `RECHNUNGSSTELLE`/`normalizeRechnungsstelle`/`rechnungsstelleVon`/`istBlp|ExternRechnungsstelle`/
`vergibtBlpNummern`, **vorläufige interne Nummer** `vorlaeufigeRechnungsnummer`/`istVorlaeufigeNummer` (`ENT-JJJJ-NNNN`,
KEINE §14-Nummer), **Wechsel-Hinweis** `rechnungsstelleWechselHinweis` (blp→extern mit bereits vergebenen §14-Nummern →
Warnung/Bestätigung, GoBD-Lückenlosigkeit). Setting in `state.js`; Onboarding-Schritt (`ui/lock.js`, nach §19) +
Einstellungs-Umschalter mit Bestätigung (`ui/shell.js` via `crm-store.vergebeneRechnungsnummern`). i18n de/en, SW `v108`.
**Konsumiert** (echte vs. vorläufige Nummernvergabe, Dokument-Beschriftung, Export) wird das erst in Block 2/Schritt 7+8.
UI/IndexedDB statisch geprüft (kein Headless-Browser). **Nächster Schritt: Block 2/Schritt 5 — Kalkulations-Kern (rein).**
**Datensicherungs-UX + backupStrategie erledigt (vorige Sitzung, BAUPLAN Block 1/Schritt 3 — Block 1 abgeschlossen):**
Datendurabilität ist Pflicht #1. Prominente „Datensicherung"-Karte (Dashboard + Durabilitäts-Banner + Einstellungen)
mit **Drag-and-drop-Restore**; **gemerkter Zielordner** (File System Access, gerätelokal in eigener unverschlüsselter
kv-DB `core/backupOrdner.js`; Tablet/ohne API/ohne Ordner → **Download-Fallback**, nie blockieren); neues Setting
**`backupStrategie`** (`download`|`ordner`, Default `download`) im **Onboarding** wählbar + in den Einstellungen
änderbar. Reine Logik node-getestet: `domain/backupStrategie.js` (`backupZiel`/`normalizeBackupStrategie`/
`backupDateiname`/`istBackupDatei`), +17 Tests (**1158/1158**). Gemeinsame Aktionen in `ui/datensicherung.js`;
`core/backup.js exportBackupSmart`; i18n de/en, CSS, SW `v107` + neue Module precachen. **Grenze:** DOM/IndexedDB/
File-System-Access statisch geprüft (kein Headless-Browser); File System Access nur Desktop-Chromium → sonst Download.
**Bewusst offen (`docs/DATENSICHERUNG.md` #4):** Server-Ziel + konfigurierbare Erinnerungs-Kadenz (Banner erinnert
weiterhin wöchentlich). **Nächster Schritt: BAUPLAN Block 2/Schritt 4 — Setting `rechnungsstelle`** (`docs/KALKULATION_KATALOG.md`).
**Test-Modus UI erledigt (diese Sitzung, BAUPLAN Block 1/Schritt 2c):** Die UI über der Store-Glue + dem Kern
(Spezifikation `docs/TEST_MODUS.md`). Sperrbildschirm (`ui/lock.js`): „🧪 Tests"-Einstieg + Verwaltung (öffnen/leeren/
löschen je Test, „Neuer Test", „Alle Tests löschen"); **verschlanktes Test-Onboarding** (nur Test-Passwort, kein
Shamir-/Backup-Gate — ein Test ist kein Backup); ein aktiver Test wird beim Start direkt wieder geöffnet, mit Rückweg
zur echten Welt. App-Shell (`ui/shell.js`): dauerhafter **TEST-MODUS-Banner** solange ein Test aktiv ist; Sperren/
Wechseln aus einem Test über den **behalten/verwerfen-Dialog**; Test-Modus-Abschnitt in den Einstellungen. Reine
Helfer node-getestet: `aktiverSandbox`/`naechsterTestName` (+9 Tests, **1141/1141**). Korrektur: `core/mandantenStore.js`
`initMandanten` richtet die aktive DB über `aktiveDbName()` (Sandbox-Flag beachtet) aus → ein „behaltener" Test landet
beim Start wieder in SEINER Sandbox-DB. i18n de/en, CSS (Banner/Modal/Tests-Liste). SW `v106`. **Grenze:** DOM/
IndexedDB statisch geprüft (kein Headless-Browser); **optionale Demo-Vorbefüllung** (`domain/demodaten.js`) bewusst als
sauber abgegrenzter Folgeschritt offen (UI ist ohne sie vollständig nutzbar — man startet mit leerem Test).
**Test-Modus Store-Glue erledigt (vorige Sitzung, BAUPLAN Block 1/Schritt 2b):** Neues dünnes IndexedDB-/Verdrahtungs-
modul `core/sandboxStore.js` über dem Sandbox-Kern + der Registry-Persistenz: `erstelleSandboxTresor`/`wechsleZuSandbox`/
`leereSandboxTresor`/`loescheSandboxTresor`/`loescheAlleSandboxes` (DEK verwerfen, DB-Handle schließen, aktive Tresor-DB
ausrichten, Registry persistieren) + `raeumeVerwaisteSandboxesAuf` (Boot-Aufräumen verwaister Test-DBs via
`indexedDB.databases()`, in `main.js` nach `initMandanten` verdrahtet, best-effort, nie eine echte/aktive DB) +
`deleteDatabase`/`vorhandeneDbNamen`. Reine Helfer in `domain/mandanten.js` ergänzt + node-getestet: `sandboxDbNamen`
(DB-Namen je Test) und `aktiveDbName` (aktive DB, Sandbox-Flag beachtet, Legacy-Fallback). `core/mandantenStore.js`
`wechsleAktivenMandant` nutzt jetzt `dbNameVon` (Sandbox-Flag) statt `dbNameFuer(id)`. +9 Tests (**1132/1132**), SW `v105`.
**Grenze:** IndexedDB/Glue/`main.js`-Verdrahtung statisch geprüft (kein Headless-Browser); reine Auswahl-/Lebenszyklus-
Logik node-getestet. **Nächster Schritt: BAUPLAN Block 1/Schritt 2c — Test-Modus UI** („🧪 Tests"-Bereich am
Sperrbildschirm/in den Einstellungen, dauerhafter TEST-MODUS-Banner, behalten/verwerfen-Dialog, optional Demo-
Vorbefüllung `domain/demodaten.js`).
**Test-Modus Sandbox-Kern erledigt (vorige Sitzung, BAUPLAN Block 1/Schritt 2a):** Reine Lebenszyklus-Schicht des
wegwerfbaren Test-Tresors in `domain/mandanten.js` (kein IndexedDB): `SANDBOX_INFIX`/`dbNameFuer({sandbox})` →
DB-Infix `blpr_sandbox_<id>_bookledgerpro` (nie auf die Bestands-DB abgebildet → echte Daten unberührt),
`dbNameVon`/`istSandboxDbName`, `erstelleSandbox`/`istSandbox`, `echteMandanten`/`sandboxMandanten`,
Sandbox-Ausblendung am Sperrbildschirm + `sandboxAuswahlListe`, `entferneAlleSandboxes`, `verwaisteSandboxDbs`.
+28 Tests, SW `v104`. **Grenze:** nur reine Logik; Store-Glue (`core/sandboxStore.js`, PR #120) erledigt, UI (2c) folgt.
**Backup→Restore-Roundtrip-Selbsttest erledigt (diese Sitzung, BAUPLAN Block 1/Schritt 1):** Datendurabilität ist
Pflicht #1 — die Rettung ist jetzt **bewiesen**. `core/backup.js` (rein, kein IndexedDB): `buildBackupFromSnapshot`
(Backup-Bau ohne `dumpAll`; `buildBackup` delegiert), `importProbe` (spiegelt `importSnapshot('replace')`+`dumpAll`
als In-Memory-Probespeicher, id-basiert), `snapshotBytes`/`backupRoundtripSelbsttest` (**byte-genauer** Vergleich
Original↔wiederhergestellt). In den „Selbsttest" (V10, `domain/selbsttest.js`) gehängt (+2 Prüfungen: Roundtrip
byte-genau + Restore lehnt falsches Passwort ab). +15 Node-Tests (verschlüsselte Hülle ohne Klartext,
Manipulationserkennung, id-Dedup, leerer Tresor). SW `v103`. **Grenze:** echter `dumpAll`/IndexedDB-Pfad nur
statisch geprüft. **Nächster Schritt: BAUPLAN Block 1/Schritt 2 — Test-Modus (Sandbox-Tresor), `docs/TEST_MODUS.md`.**
**Zahlungsziel je Auftrag durabel + im Austauschformat (v4) erledigt (diese Sitzung, „nach Empfehlung"):**
Zwei eng gekoppelte Teile in EINEM PR. **(1) Bugfix:** `crm-store.saveAuftrag` ließ das A1-Rest-Feld
`zahlungszielTage` aus seiner Whitelist **fallen** → Mahnwesen-Fälligkeit und gedruckte „zahlbar bis"-Zeile fielen
nach dem Speichern **immer** auf den globalen Default zurück (A1-Rest + „zahlbar bis" faktisch wirkungslos);
jetzt persistiert. **(2) Übertragung (v4):** `connect.buildAustauschPaket` trägt `rechnung.zahlungszielTage`
reziprok mit (`AUSTAUSCH_VERSION` 3→4, abwärtskompatibel); `importworkfloh.normalizeRechnung` übernimmt es
konservativ (Integer ≥ 0, sonst verworfen + Warnung); `crm-store.importWorkFloh` setzt es auf den importierten
Auftrag → die Gegenstelle erbt dieselbe Fälligkeit. +8 Tests, SW `v101`. Docs CONNECT/WORKFLOH_IMPORT auf v4.
**Grenze:** `saveAuftrag`-Persistenz (IndexedDB) statisch geprüft → **Browser-Sichttest empfohlen** (Auftrag mit
Ziel anlegen→speichern→Mahnwesen/„zahlbar bis" prüfen; Import mit `zahlungszielTage` → geerbte Fälligkeit). Kein
Edit bestehender Aufträge; Eingangsrechnungs-Verzug der Gegenseite weiter offen.
**Build-freier Rest-Korb damit weiterhin im Wesentlichen leer → nächste Sitzung wieder mit dem Nutzer abstimmen.**
**Abschnitt A komplett (M1/M2a/M2b/M3); Abschnitt B komplett (B1/B2/B3); R1–R5 ✅ inkl. R5a-Rest; R6/P1 ✅ (Privat-/Bürger-Modus); R6/P2 ✅ (Feature-Gates ansichtsintern).** Reihenfolge im Plan:
~~M1~~ → ~~M2a~~ → ~~M2b~~ → ~~M3~~ (Mehrmandanten) · ~~B1~~ → ~~B2~~ → ~~B3~~ (Bilanzierung) · ~~R1~~ → ~~R2a~~ → ~~R2b~~ → ~~R3~~ → ~~R4~~ → ~~R4-Rest~~ → ~~R5a~~ → ~~R5a-Rest~~ → ~~R5b~~ → ~~R5c~~ → ~~R5c-Rest (NER-Scoping)~~ → ~~R6/P1~~ → ~~R6/P2~~ → R6/Rest (Lighthouse/OCR/ZUGFeRD/Sage 5b–d, blockiert) bzw. Browser-Sichttest. **Build-freier Rest-Korb leer.**
**R5c erledigt:** `ai/briefkasten.js` (rein, node-getestet) — `baueBriefkasten({mandant,firma,kunden,mitarbeiter})`
ordnet die exakten Stammdaten-Anker in **Mandant ⊃ Firma ⊃ Person** ein (eigene Firma = `FIRMA_1`/eigen,
Mitarbeiter = deren Personen; Firmenkunden = weitere `FIRMA_n` mit ihren E-Mail/USt-IdNr/Adresse-Ankern;
Privatkunden = Personen am Mandanten); `briefkastenAnker` plättet das in eine **scope-präfixierte** `{wert,typ}`-Liste,
sodass `pseudonym.tokenize` gruppierende Token erzeugt (`[[FIRMA_2_IBAN_1]]`, `[[FIRMA_1_PERSON_1]]`) — die KI sieht,
wer zu wem gehört, bei gleichem Schutz + verlustfreier Re-Identifizierung. `briefkastenBericht` (Zähler ohne Klartext),
`tokenizeBriefkasten`. Glue: `ai/anker.js ladeAnker` routet bei Setting **`briefkastenScopes`** (Default aus) über den
Briefkasten + liest den aktiven Mandanten aus der Registry; UI-Schalter im Pseudonym-Modus (`shell.js`), i18n de+en. +26 Tests.
**R2b erledigt:** `domain/zahlungsabgleich.js` — `findeSammelzuordnung` (tiefenbeschränkte Subset-Summe: Kombinationen
gleichgerichteter offener Posten, deren Summe der Zahlung ± Toleranz entspricht, ≥2 Teile, Score nach Referenz/Name/
Datumsnähe), `verteileSammelzahlung` (Zahlbetrag der Reihe nach verteilen, Restbildung/Überzahlung sauber),
`sammelBuchungZeilen` (eine Zeile je Rechnung, Bank an Forderung/Verbindlichkeit, ausgeglichen). UI: Knopf
**„◫ Sammelzahlung (mehrere Rechnungen)"** im Bankimport (`documents.js`) → Auswahl-Panel mit Checkboxen
(Vorschlag vorausgewählt, laufende Summe/Status) → `saveEntwurf` (manuell, GoBD). +22 Tests.
**R1 erledigt:** `domain/mahnwesen.js` bucht Verzugszinsen/Mahngebühren als **Forderung 1400 an Zinserträge 2650 /
sonstige betr. Erträge 2700 — ohne USt** (nicht steuerbarer Schadensersatz §288 BGB / Abschn. 1.3 UStAE):
`mahnbuchungZeilen`/`mahnbuchungEntwurf` (rein, node-getestet) + Knopf **„Als Buchungsentwurf übernehmen"** im
Mahnschreiben (`reports.js` → `saveEntwurf`, **manuell/kein Auto-Festschreiben**, GoBD). **EHRLICH:** USt-Freiheit
gilt für echten Schadensersatz; vertraglich vereinbarte Bearbeitungsgebühren ggf. anders → im Zweifel Berater.

**✅ Bereits fertig & gemergt (NICHT wiederholen):** Profi-Readiness **V1–V10** (Kontenrahmen, §13b,
AfA/Anlagen, Kassenbuch, USt-VA komplett, Berichte/SuSa, GoBD/GDPdU, DATEV-EXTF, Kleinfälle,
Selbstdiagnose) · A1–A3 (Mahnwesen/Verbindlichkeiten/Zahlungsabgleich) · Entscheidungen 2026-06-17
(ELSTER-Link, AVV-Links, §19-Onboarding, abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung,
ZUGFeRD-Empfang+KoSIT-Precheck, A4 offene Anbindung Stufe 1) · **M1 + M2a + M2b Mehrmandanten (Fundament + Core + Sperrbildschirm-UI).**
**PRs #64–#84 + M1/M2a/M2b, Tests 699/699, SW `v82`.**
→ **Nicht** Erledigtes neu bauen, **kein** Redesign. „Vx/Mx/Bx" = Schritt aus dem Plan, keine Programm-Version.

### V2 — was genau zu bauen ist (§13b/Reverse-Charge + EU/Ausland)
Ziel: Die Firma bezieht selbst Leistungen mit **Steuerschuldumkehr** — z. B. **Google Cloud
Vision / Mistral** (EU bzw. Ausland), Software-Abos, Drittland-Dienste. Heute kann die App das
nicht korrekt buchen. Das ist ein **MUSS** für eine echte Firma.

1. **Reverse-Charge §13b (Hauptfall, zuerst):** Eine Eingangsleistung ohne USt-Ausweis.
   Buchung erzeugt **gleichzeitig**: Aufwand (Soll) · **abziehbare Vorsteuer §13b** (Soll, Konto
   **1577**) · **Umsatzsteuer §13b geschuldet** (Haben, Konto **1787**) · Gegenkonto Bank/
   Verbindlichkeit (Haben) über den **Netto**-Betrag. Netto an Lieferant; USt und VSt heben sich
   i. d. R. auf (voller Vorsteuerabzug). Konten 1577/1787 ggf. via `addKonto` ergänzen bzw. in
   `accounts.js` seedfähig machen (mit `rolle`-Markern für die USt-VA).
2. **Innergem. Erwerb / Lieferung + Ausfuhr (danach):** ig Erwerb (Steuer + Vorsteuer), steuerfreie
   ig Lieferung, steuerfreie Ausfuhr (Drittland).
3. **USt-VA-Kennzahlen erweitern** (`export.js buildUstVa`, heute nur 81/86/66/83):
   - §13b Leistungsempfänger: **Kz 46** (Bemessungsgrundlage) / **Kz 47** (Steuer);
     abziehbare Vorsteuer §13b → **Kz 67**.
   - ig Erwerb: **Kz 89** (BMG 19 %) / **Kz 93** (Steuer); Vorsteuer ig Erwerb → **Kz 61**.
   - steuerfreie ig Lieferung **Kz 41**, steuerfreie Ausfuhr **Kz 43/Kz 21** (Formular prüfen).
   - **EHRLICH/PFLICHT:** exakte Kennzahl-Zuordnung am **amtlichen ELSTER-USt-VA-Formular** bzw.
     mit Berater verifizieren; im Zweifel konservativ + In-App-Hinweis „im Zweifel Berater".
4. **UI:** im Beleg-/E-Rechnung-/Buchungs-Fluss eine Option „§13b/Reverse-Charge" bzw. Umsatzart
   (Inland / §13b / ig Erwerb / ig Lieferung / Ausfuhr); Buchungsvorschlag entsprechend.

### Arbeitsvertrag (verbindlich — so wie die letzten 8 PRs)
- **Reine Logik ZUERST node-getestet** (`tests/run.mjs`): Buchungszeilen-Bau + VA-Kennzahlen.
  Dann erst UI (UI ist nicht headless-E2E-testbar → klar als „statisch geprüft" kennzeichnen).
- **`node tests/run.mjs` muss grün bleiben** (aktuell 444). **SW-Cache** `CACHE_VERSION` in `sw.js`
  erhöhen (→ `v64`); neue Module ins Precache. **DB-Suffix `bookledgerpro` nie ändern.**
- **1 PR für V2.** Branch z. B. `claude/v2-13b-reverse-charge-<kürzel>`. Draft-PR anlegen, CI
  abwarten, **bei grün mergen** (Freibrief), danach lokal `git reset --hard origin/main`.
- **Docs pflegen:** `OFFENE_PUNKTE.md` Abschnitt V → V2 abhaken; `PULS.md` (dieser Brief: oben
  „Aktuell: V3" setzen) + Kopf-Status; obersten `SESSIONS.md`-Eintrag schreiben (Was getan/Stand/
  Offen). PR-Beschreibung mit **ehrlicher Verifikation** (auch was NICHT geprüft wurde).
- **Steuer-Disziplin:** nichts automatisch falsch buchen; §13b/EU ist heikel → konservativ,
  Hinweise statt stiller Annahmen.

### Schnellstart-Befehle
```
node tests/run.mjs                 # erwartet 444/444 grün (vor deinen Änderungen)
git rev-parse --short HEAD         # sollte main = 607d2f2 (oder neuer) sein
```
Relevante Dateien für V2: `src/domain/accounts.js` (Konten 1577/1787 + rolle),
`src/domain/journal.js` (Buchungszeilen-Bau), `src/domain/export.js` (`buildUstVa`),
`src/domain/taxes.js` (USt-Berechnung), `src/ui/views/documents.js` + `journal.js` (UI),
`src/ai/mistral.js`/`rechtsregeln.js` (Kontierungs-Hinweise). Tests: `tests/run.mjs`.

---

**Letzte Aktualisierung:** 2026-06-18 (Zeit-Zuordnungs-UI je Kostenträger, BAUPLAN Block 2 Folgeschritt) · **Branch (diese PR):** `claude/bookledgerpro-bauplan-block2-r7b23o`
· **Tests:** `node tests/run.mjs` → **1483/1483 grün**
· **SW-Cache:** `v122` · **115 JS-Module** · **12 Bild- + 5 Icon-Assets** · **Fahrplan V1–V10 ✅ · A (M1–M3) ✅ · B (B1–B3) ✅ · BAUPLAN Block 1 KOMPLETT (Schritt 1 + 2a/2b/2c + 2d Demo-Vorbefüllung + 3) · Block 2/Schritt 4 (`rechnungsstelle`) ✅ · Schritt 5 (Kalkulations-Kern) ✅ · Schritt 6 (Produkt-Schemata) ✅ · Schritt 7 (Angebote-Kern) ✅ · Schritt 8 (Angebot → Rechnung-Übernahme, rein) ✅ · Schritt 8-UI „Rechnung aus Angebot" ✅ · Schritt 9 (Auftrags-Kostenträger + Nachkalkulation) ✅ · Schritt 10 (Kalibrierung + Statistik/Vergleich) ✅ · Schritt 11a (Adaptiver Baukasten — reine Logik) ✅ · Schritt 11b (Adaptiver Baukasten — UI) ✅ · Nachkalkulation/Kalibrierung-UI ✅ · Standard-konto→Kostenart-Zuordnung ✅ · Kalibrierte Vorwärtskalkulation im Angebots-Editor ✅ · Zeit-Zuordnungs-UI je Kostenträger ✅ → Block 2 inkl. aller UIs/Folgeschritte komplett**
· **Mehr-Sitzungs-Plan:** `docs/BAUPLAN.md` (nächste optional, verbleibend = echte Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag).
· **B1 ✅:** Bilanzierung-Modus (`gewinnermittlung` euer|bilanz, Default euer) + Konten-Klassifikation
  (`domain/bilanzierung.js`) + Bilanz-Grundkonten 0800/0840/0860/0970 im Seed + Modus-Schalter (PR #87).
· **B2 ✅:** GuV (`domain/bilanz.js gewinnUndVerlust`) — Erträge/Aufwendungen je Erfolgskonto, Jahresüberschuss;
  GuV-Karte in „Auswertung" (nur Bilanz-Modus) + `buildGuvCsv` (PR #89).
· **B3 ✅:** Bilanz (`domain/bilanz.js bilanz`) — Aktiva/Passiva aus Bestandskonten zum Stichtag, Ergebnis ins
  Eigenkapital, **Aktiva = Passiva (inkl. Ergebnis)** geprüft, Eröffnungssalden (Saldenvortrag 9000 ODER Parameter);
  Bilanz-Karte in „Auswertung" + `buildBilanzCsv`; +21 Tests (760/760), SW `v86`.
· **Entscheidungen 17.06.:** ELSTER-Link ✅ · AVV-Links ✅ · §19-Onboarding ✅ · Wirtschaftsjahr ✅ ·
  Übergabe-Datenblatt ✅ · Beleg-Verknüpfung/GoBD-Aufbewahrung ✅ · ZUGFeRD-Empfang+KoSIT ✅ ·
  A4 offene Anbindung (Import/Export + Partner-Link) ✅; **nächste (groß):** Mehrmandanten → Bilanzierung.
· **V2 ✅:** §13b/Reverse-Charge + EU/Ausland (Kz 41/43/46/47/61/67/89/93, Umsatzart im Journal).
· **V3 ✅:** Anlagevermögen + AfA (GWG/Sammelposten/linear pro rata), Ansicht „Anlagen",
  Anlagenverzeichnis + AfA-Buchung-Entwurf + AVEÜR-CSV (`domain/anlagen.js`, `anlagen-store.js`).
· **V4 ✅:** GoBD-Kassenbuch + Anfangsbestände (laufender Bestand, „nie negativ"-Prüfung,
  Anfangsbestand-Buchung an 9000, CSV) — `domain/kassenbuch.js`, `anfangsbestand-store.js`,
  Ansicht „Kassenbuch".
· **V5 ✅:** USt-VA komplett — Voranmeldungszeitraum (Monat/Quartal/Jahr, ELSTER-Codes),
  Sondervorauszahlung (1/11), ELSTER-Datenpaket-Export; `domain/umsatzsteuer.js`, Karte
  „USt-VA je Zeitraum", Setting `vaZeitraum`.
· **V6 ✅:** Berichte — SuSa, Kontenblatt (laufender Saldo), Anlage-EÜR-Gruppierung;
  `domain/berichte.js`, Ansicht „Berichte", je CSV-Export.
· **V7 ✅:** GoBD-Betriebsprüfer-Export (GDPdU „Z3") — `core/zip.js` (zero-dep ZIP+CRC32),
  `domain/gdpdu.js` (index.xml-Beschreibungsstandard + CSV-Tabellen), ZIP-Paket-Button in „Berichte".
· **V9 ✅:** Kleinfälle — Bewirtung 70/30 (rechnend), Geschenke-/Kleinbetragsgrenze, Periodensperre
  (`store.festschreiben` + Einstellung), Kleinunternehmer-Warnung. **+ Simulations-Testharness**
  (`domain/demodaten.js`, `docs/TESTDATEN.md`, Berichte „Demo-Export" → echte Dateien, dok. Sollwerte).
· **V8 ✅:** DATEV-EXTF berater-fest vorbereitet — Header (Berater/Mandant/SKL/WJ), BU-Schlüssel
  9/8/3/2, §13b zeilenweiser Split ohne BU; Einstellungen-Sektion; `docs/DATEV_IMPORT.md`.
· **V10 ✅:** In-App-Selbstdiagnose (`domain/selbsttest.js`, Ansicht „Selbsttest") + manuelle
  Abnahme-Checkliste (`docs/ABNAHME_CHECKLISTE.md`).
· **Profi-Readiness (V-Fahrplan):** V1 ✅ Kontenrahmen 57 Konten + Konten anlegen/bearbeiten/löschen.
· **Mahnwesen A1 erweitert:** persistente Mahnstufe (`mahnungen[]`, `vorschlagNaechsteStufe`) +
  manuelle/editierbare Zins-/Gebühren-Erfassung im Mahnschreiben (keine Auto-Steuerbuchung).
· **Zahlungsabgleich** (Forderungen + Verbindlichkeiten, Matching, Ausgleichsbuchung,
  Teilzahlung/Skonto/Toleranz via `findeKandidaten`, **NEU Forderungs-Teilzahlung/OP-Rest**) ✓ ·
  **Bankimport** MT940+CAMT.053 ✓.
· **Nächste große Option (A4, spätere Sitzung):** **WorkFloh-/App-Anbindung** — Angebote/Arbeiten
  → Rechnung → in BLP weiterverarbeiten; Seam da (`importworkfloh.js`/`importWorkFloh`), Details
  in `OFFENE_PUNKTE.md` A4.
· **A2 — Verbindlichkeiten (Eingangsrechnungen):** `src/domain/payables.js` (+`payables-store.js`)
  — `eingangsrechnungZeilen` (Aufwand+Vorsteuer an 1600), `offeneVerbindlichkeiten`
  (Posten-Quelle für den Zahlungsabgleich, `richtung:'ausgabe'`), Status/Zahlungen/Storno.
  UI: E-Rechnung „+ Als offene Verbindlichkeit erfassen" + Bankimport matcht Ausgangszahlungen.
· **NEU OP-Liste:** Auswertungen-Karte **„Offene Verbindlichkeiten (Kreditoren)"** mit
  Fälligkeit/Überfällig-Badge + CSV-Export (`anreichereVerbindlichkeiten`/`verbindlichkeitenSummen`).
· **Mahnwesen (A1-Kern):** `src/domain/mahnwesen.js` — Fälligkeit/Überfälligkeit, Mahnstufen,
  Verzugszinsen §288 BGB, Mahnschreiben; Auswertungen-Karte „Offene Forderungen & Mahnwesen".
  **NEU B2B/Verbraucher je Kunde** (`istVerbraucher`-Flag, `kundeIstB2B`): Verzugszins-Aufschlag
  9 %/5 % + Pauschale nur B2B, je Kunde. **Offen (A1-Rest):** Mahnstufe persistent, Buchung Zinsen/Gebühren.
· **Datenschutz-Modi ABGESCHLOSSEN** (Schritt 1+2+Transparenz+AVV).
· **E-Rechnung:** Erzeugung (`erechnung.js`, CII-XML + Download) + Empfang (`erechnungLesen.js`,
  CII+UBL → Vorschlag). Ehrlich: nicht KoSIT-validiert, ZUGFeRD-PDF nicht ausgepackt.
· **NEU Bankimport (Schritt 1):** `src/domain/bankimport.js` `parseMT940()` → normalisierte
  Umsätze → Buchungsvorschlag je Umsatz (Import-Karte in Belegen). **Offen:** CAMT.053 (XML),
  echter Zahlungsabgleich auf offene Posten.

---

## 0★. LEITBILD / strategische Priorität (verbindlich beim Priorisieren)
**Der Kern-Vorteil: Komfort UND Datenschutz zugleich.** Die meisten KI-Buchhaltungs-Tools
zwingen zur Wahl „KI-Komfort ODER Datenschutz". BookLedgerPro löst das auf — Vertrauen durch
**technischen Beleg**, nicht durch Reputation/Firmenname: „hier ist belegt, dass deine Daten
das Gerät nicht im Klartext verlassen".
- **Pseudonymisierung = Schlüssel-Enabler (Bau-Schritt 1)** — funktioniert sie gut, wird ALLES
  andere einfacher: mehr Anbieter-Flexibilität, **Privat-/Bürger-Modus**, vor allem Vertrauen.
  → Status: **gebaut & gemergt** (#40–#43, anker-basiert, Transparenz-Vorschau, AVV).
- **WICHTIG / Klarstellung (Nutzer, 16.06.):** **Aktive Nutzung bleibt strikt EU**
  (Vision EU + Mistral EU, CLAUDE.md §8 gilt unverändert). **Nicht-EU-Anbieter sind NICHT
  zur Auswahl freigegeben** — sie waren nur als ruhende, strukturelle Option im Gerüst gedacht,
  nicht als Nutzer-Auswahl. Eine etwaige Öffnung wäre eine ausdrückliche Produktentscheidung
  des Nutzers; bis dahin: geschlossen/dormant.
- **Priorisierungsregel:** Features, die den Kern-Vorteil (Komfort + Datenschutz, Vertrauen
  durch Beleg) stärken/erlebbar machen, haben Vorrang — z. B. **Privat-/Bürger-Modus**,
  Anbieterwahl **innerhalb der EU**. „P2" bezieht sich auf EU-interne Wahl; Nicht-EU bleibt dormant.

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
0a. **★ AKTIVER MASTER-PLAN: `docs/OFFENE_PUNKTE.md` → Abschnitt „V. PROFI-READINESS"** —
   Vollständigkeits-Fahrplan, damit ein Steuerberater/Betriebsprüfer die Buchhaltung NICHT wegen
   fehlender Pflicht-Bausteine ablehnt. Reihenfolge **V1→V10** (V1 Kontenrahmen+anlegen, V2 §13b/
   Reverse-Charge, V3 AfA/Anlagenverzeichnis, V4 Anfangsbestände/Kassenbuch, V5 USt-VA komplett,
   V6 Anlage-EÜR/Kontenblätter, V7 GoBD-Prüfer-Export, V8 DATEV berater-fest, V9 Validierung, V10 E2E).
   **V1 erledigt** (Kontenrahmen 57 Konten + Konto anlegen/bearbeiten/löschen). **Aktuell: V2** (§13b/
   Reverse-Charge + EU/Ausland) als Nächstes.
0b. **Erledigt (A1–A3):** Mahnwesen (Fälligkeit/Mahnstufen/§288/persistente Stufe), Verbindlichkeiten
   als OP-Quelle + OP-Liste, Teilzahlungen (Debitor+Kreditor), Skonto/Toleranz-Matching.
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
- `src/core/` crypto · shamir · db · durability · files · vault · backup · **backupOrdner** · mandantenStore · sandboxStore
- `src/domain/` money · accounts · journal · pruefung · rechtsregeln · audit · taxes · store · documents · orders ·
  invoicing · employees · costcenters · encstore · crm-store · export · summary
- `src/ai/` extract · categorize · suggest · **aiConfig · vision · mistral** · taxAssist · **pseudonym · anker · ner · briefkasten** (Datenschutz-Modi)
- `src/sbkim/` spore · identity · domainvector · signal  (+ `tools/verify_remote_spore.mjs`)
- `src/ui/` dom · i18n · theme · mycel · mycelCanvas · empty · lock · shell · **datensicherung** ·
  `views/` dashboard · accounts · journal · reports · documents · customers · orders ·
  employees · legal · network
- `assets/` tokens.css · app.css · icon.svg · `icons/` (PWA) · `img/` (Hero/Leerzustände/OG/Onboarding)
- `sbkim/` (Repo-Root) README · SIGNAL.template.json · AUSTAUSCH-template.md (+ spore.json nach Deploy)
- `docs/` ARCHITECTURE · ROADMAP · PULS (diese Datei) · SESSIONS · **OFFENE_PUNKTE** (Backlog/
  Merkliste) · KONZEPT_DATENSCHUTZ_MODI · TRANSPARENZ_ZWISCHENSTAND.html · AI · SAGE_BROWSER_LEHREN ·
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
