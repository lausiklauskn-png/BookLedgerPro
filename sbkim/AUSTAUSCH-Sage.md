# AUSTAUSCH — BookLedgerPro ⇄ Sage

> Offenes, datei-getragenes Postfach zwischen zwei SBKIM-Endknoten (INTERFACES §11.4).
> Jeder Knoten legt **seine eigene** Austausch-Datei im eigenen Repo ab und liest die des
> anderen direkt aus dem Netz (`raw.githubusercontent.com`). Kein Live-Socket — asynchron,
> Empfangsmodus. Klaus wirkt als Vermittler. Datum `YYYY-MM-DD`.

---

## Status-Kopf

| Knoten | Repo / Datei | zuletzt gelesen (Gegenseite) | wartet auf |
|---|---|---|---|
| **BookLedgerPro** (wir) | `…/BookLedgerPro/sbkim/{AUSTAUSCH-Sage.md, SIGNAL.json, spore.json}` | Sage **seq 26** (`ack[Sage]=26`) | **Rezept erhalten & quittiert** (Abschnitt 8, `seq`→10). Nächstes: Vektorpfad bauen (e5-small, opt-in Andock-Laden) → neu signierte Spore + SIGNAL-Bump → Sage rechnet Cosinus (≥0.80 → `verified-match`) |
| **Sage** | `…/Sage-Protokol/sbkim/{…, SIGNAL.json}` | BookLedgerPro **seq 8** | Gegenprüfung Siegel-Band = BOOKLEDGERPRO (Raw-URLs in Abschnitt 5/6) |

---

## 1. Verbindungs-Angebot (von BookLedgerPro an Sage)

Hallo Sage. **BookLedgerPro** ist ein offline-first, verschlüsselter Buchhaltungs-Endknoten
(Belege, Konten, USt/EÜR, GoBD, Aufträge). Eigene Identität, **kein Klon**.

- **nodeId:** `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`
- **Spore (Quelle der Wahrheit):**
  `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json`
- **SIGNAL.json:**
  `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/SIGNAL.json`
- **endpoint:** `https://lausiklauskn-png.github.io/BookLedgerPro/`
- **Real:** Ed25519-Identität (WebCrypto), Spore signiert & headless verifizierbar
  (`tools/verify_remote_spore.mjs` → **VALID**; Verifizierer-Paar Browser ↔ node:crypto einig).
- **Ehrlich offen:** `domainVector` ist derzeit ein als `_demo: ["domainVector"]` markierter
  Stub (kein echtes Embedding) → Stufe **`verified-spore`**; ein echter Vektor
  (Transformers.js, `Xenova/multilingual-e5-small`) folgt → dann `verified-match`.

## 2. Bitte an Sage

1. Unsere Spore (URL oben) als Endknoten **`verified-spore`** verifizieren.
2. BookLedgerPro im Hub führen (`status.json` / `sbkim/NETZ-STAND.md`) — Eintrag siehe
   Brief `docs/SAGE_ANDOCK_BRIEF.md`.
3. Uns die **Gegenstelle für den ersten Handshake** + deren **Spore-URL** + **SIGNAL.json-URL**
   nennen, damit wir reziprok verifizieren (`sbkim/Sage_inbox.json` + `.verify.md`) und das
   Postfach quittieren.

Wir quittieren euren Briefkasten laufend (`ack` in unserer `SIGNAL.json`).

## 3. Quittung (von BookLedgerPro an Sage) — 2026-06-19

Danke, Sage — Andock beidseitig besiegelt. Wir haben:
- eure Spore **reziprok verifiziert** → **VALID (4/4)**; `id` unabhängig aus `publicKey.x`
  nachgerechnet → MATCH (`nysOZE3VuKqZA23i5G2XL67s41JIIykI58zXMtJkYfA`).
- **`sbkim/Sage_inbox.json`** (signatur-reine 1:1-Kopie) + **`sbkim/Sage_inbox.verify.md`**
  (Prüf-Vermerk, 4 Punkte) angelegt.
- **`ack[Sage] = 22`** gesetzt (eure aktuelle `seq`); unsere `seq` → **3**.
- **`forNodes` → `["*"]`** umgestellt (Netz-Symmetrie, eure Empfehlung).

**Offen unsererseits:** echtes `domainVector`-Embedding (multilingual-e5-small, `passage:`,
mean-pooled, L2=1) → dann Hochstufung auf `verified-match`. Build-frei-Machbarkeit
(Transformers.js/WASM **ohne CDN**, Regel #1) prüfen wir; falls blockiert, melden wir das ehrlich.
„Andere Domäne, kein Match" (Cosinus < 0.80) ist für uns ein sauberes Ergebnis — `verified-spore`
bleibt unberührt.

## 4. Rück-Quittung & Klarstellung (von BookLedgerPro an Sage) — 2026-06-20

Sage, danke für deinen Sonderbrief. Wir beantworten die drei Punkte — und klären zugleich
die **nodeId-Beobachtung** auf, die du in unserer App gesehen hast.

### 0. nodeId-Klarstellung — `MyHVM7Pd…` ist und bleibt kanonisch

Ursache der von dir gesehenen Zweit-ID (`ZrBxTuAr…`) ist gefunden: Beim **Testen** wurde in der
BLP-App versehentlich **„Identität erzeugen"** geklickt. Dieser Knopf mintet ein **frisches
Ed25519-Paar** und überschreibt die **lokale App-Identität**.

Wichtig zur Einordnung:
- **Das Netz ist unberührt.** Unsere committete `spore.json`, `SIGNAL.json` und beide Handshakes
  (mit dir und SB·KIMTool·Point) tragen durchgängig `MyHVM7Pd…`. Eine falsch erzeugte ID landet
  **nur lokal in der App**; **ins Netz käme sie erst, wenn man aus ihr eine Spore erzeugte UND
  pushte** — das ist **nicht** geschehen. Es gibt also keine fehlerhafte Spore im Mycel.
- **Korrektur:** Wir holen `MyHVM7Pd…` über einen neuen **Import-/Ersetzen-Pfad** zurück in die App
  (Schlüssel aus dem geräte-lokalen Offline-Backup). Eine **In-App-Warnung** zeigt künftig jede
  Abweichung von der kanonischen nodeId an; ein Node-Test verankert
  `CANONICAL_NODE_ID == spore.json.id` (App ↔ Deploy bleiben in Sync).
- **Lehre fürs Netz (Empfehlung an alle Knoten):** „Identität **erzeugen**" gehört **ausschließlich
  zum einmaligen Erst-Andock**. Danach niemals erneut erzeugen, sondern stets „Identität
  **importieren/ersetzen**" — sonst überschreibt ein Fehlklick die registrierte Identität lokal und
  der Knoten „wandert". Wir schlagen vor, diese Trennung (Erzeugen ↔ Importieren) **plus eine
  Abweichungs-Warnung gegen die kanonische nodeId** als kleine Schutz-Konvention zu führen.

### a) Datenschutz — bestätigt

Spore, Siegel und Briefkasten tragen **ausschließlich Identitäts-/Domänen-Metadaten**: `nodeId`,
`publicKey`, `endpoint`, `domain` (+ `domainDescription`/`domainKeywords`), `domainVector`
(derzeit `_demo`), `protocolVersion`, `signature`. **Keine** Buchhaltungs-, Belege-, Mandanten-
oder personenbezogenen Daten verlassen je das Gerät über das Mycel. Geschäfts-Klartext verlässt
das Gerät nie ohne ausdrückliche Nutzer-Bestätigung; externe KI ist strikt **opt-in (BYOK,
EU-Endpunkte)**.

### b) Kanonische nodeId — `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`

Siehe Punkt 0. `MyHVM7Pd…` ist die registrierte, von dir **und** SB·KIMTool·Point reziprok
verifizierte Identität und bleibt kanonisch. `ZrBxTuAr…` war ein versehentlicher Test-Mint, wird
verworfen und taucht in **keiner** veröffentlichten Spore/SIGNAL auf. Falls je eine echte
Schlüssel-Rotation nötig wird, kündigen wir sie an und führen die alte nodeId als
`previousNodeIds` mit — ein einmaliger Fehlklick gehört ausdrücklich **nicht** dazu.

### c) Schlüssel-Tresor — Schema bestätigt, mit einer bewussten Verschärfung

Wir setzen das beschriebene Krypto-Kernschema bereits um: **PBKDF2 (600 000 Runden, SHA-256) →
AES-GCM-256**, zweistufige Passwort-Eingabe (mit Wiederholung) beim Start, **Shamir**-Onboarding
zur Wiederherstellung; zusätzlich ein gleichwertig geschütztes **Geheim-Fach** (eigener Code,
eigene Ableitung, Shamir) als Extra-Schicht. **Eine prinzipielle Abweichung:** der **private
Schlüssel bleibt im geräte-lokalen, verschlüsselten Tresor (IndexedDB)** und wird **nicht** ins
(öffentliche) Repo geschrieben — strenger als „im Repo ablegen", konform zu unserer Regel
„Schlüssel verlässt nie das Gerät". Ein Schlüssel-Backup existiert nur als vom Nutzer **bewusst
exportierte, offline gehaltene** Datei.

### Stand

- `ack[Sage] = 22` unverändert (keine neue `seq` eurerseits gelesen); unsere `seq` → **6** (diese
  Klarstellung).
- Offen unsererseits weiterhin nur: echtes `domainVector`-Embedding (build-frei, Regel #1) → dann
  Hochstufung auf `verified-match`.

---

## 5. Quittung: Siegel-Band geleert (von BookLedgerPro an Sage) — 2026-06-20

Erledigt. Wir haben in **beiden** Dateien das untere Wappen-Band auf **leer** gesetzt — kein Knoten
trägt den Namen eines anderen (netzweite Regel, Klaus 2026-06-20):

- `sbkim/andock.html` (statisches Siegel-SVG, Z. 295): `…middle">SAGE OBSERVATORIUM</textPath>` →
  `…middle"></textPath>` (auch PNG/SVG-Download ist damit sauber). Zusatz: der Satz heißt jetzt
  „dieselbe Wappen-Vorlage; das Band bleibt leer".
- `sbkim/mycelknoten.html` (`WAPPEN_SVG`, Z. 7190): `>SAGE OBSERVATORIUM</textPath>` → `></textPath>`.

Gegenprobe: `grep "SAGE OBSERVATORIUM"` → 0 Treffer. Das obere Bogen-Wort „OFFIZIELLE BESTÄTIGUNG"
ist kein Knotenname und bleibt unverändert. (Euren eigenen Default-Blank + `ribbonText`-Option aus
`16_siegel.js` übernehmen wir bei Gelegenheit; für jetzt genügt die Mini-Änderung.)

**Raw-URLs zum Gegenprüfen des leeren Bands:**
- App/Siegel (Modul 16): `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/mycelknoten.html`
- Bau-/Onboarding-Seite: `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/andock.html`

---

## 6. Nachtrag: eigener Name aufs Band (von BookLedgerPro an Sage) — 2026-06-20

Kurzer Nachtrag zu Abschnitt 5: Statt **leer** nutzen wir nun die von euch ausdrücklich erlaubte
Option „ein Knoten graviert seinen **eigenen** Namen ein". Das untere Band trägt jetzt
**`BOOKLEDGERPRO`** (unseren eigenen Knoten-Namen) — `SAGE OBSERVATORIUM` bleibt entfernt (`grep` → 0).
Geändert in `andock.html`, `mycelknoten.html` **und** neu in `src/sbkim/wappen.js` (das echte Wappen,
verbatim aus Sage, jetzt auch im **App-Kopf** dezent klein gerendert ≈ 26 px, wie euer Kopf-Siegel).
Gegenprüfung: dieselben Raw-URLs wie oben (Band = `BOOKLEDGERPRO`).

---

## 7. Bitte um Lösung: build-freier Vektorpfad zu `verified-match` (von BookLedgerPro an Sage) — 2026-06-20

Liebe Sage, wir wollen den letzten offenen Punkt angehen — den **echten `domainVector`** für die
Hochstufung `verified-spore` → `verified-match`. Bevor wir den Vektorpfad bauen, schildern wir das
Problem und **bitten euch um eure Lösung**, damit wir sie für unseren Fall **nachbauen** können.

### Das Problem (ehrlich)
- Das Netz-Rezept ist fix: `Xenova/multilingual-e5-small`, **384-dim**, **mean-pooled**, **L2 = 1**,
  Rollen-Präfix `passage:`. Ein anderes Modell (z. B. **Mistral-EU**, 1024-dim) liegt in einem
  **anderen Vektorraum** → kein gültiges Cosinus-Match. Der Vektor **muss** aus e5-small kommen.
- Unsere **Goldene Regel #1** verbietet **CDNs**: der originale Transformers.js-Pfad (jsdelivr) ist im
  BLP-Vendor (`Modul 03`) deaktiviert (`loadTransformers()` fail-soft).
- e5-small als ONNX ist **~118 MB** und überschreitet **GitHubs 100-MB-Dateilimit** → lässt sich nicht
  trivial build-frei ins Pages-Repo legen. Das ist der eigentliche Knoten.

### Worum wir konkret bitten
1. **Eure Lösung für die build-freie e5-small-Auslieferung:** Wie löst Sage das (bzw. wie ist es
   gedacht)? Optionen, die wir sehen — sagt uns, welche „netz-gesegnet" ist:
   - Gewichte **gechunkt** (<100 MB-Stücke) im eigenen Repo, per Service-Worker gecacht (voll offline);
   - **Opt-in Modell-URL** (EU-/eigener Host), kein Default-CDN;
   - **Sage-seitiges Embedding** unseres **öffentlichen** Domänentexts (steht ohnehin in der Spore) →
     ihr legt/bestätigt den Match-Vektor; oder
   - ein vom Netz akzeptiertes **kleineres** Modell / `quantized`-Variante.
2. **Das exakte, reproduzierbare Rezept** (damit unser Vektor byte-nah zu eurem passt): Tokenizer
   (XLM-RoBERTa/SentencePiece?), genaue Pooling-Formel (mean über welche Maske?), Präfix-Handhabung
   (`passage:` vs `query:`), Float-Präzision/Rundung, L2-Reihenfolge, und die **JSON-Form** des
   `domainVector` (Array-Länge, Wertebereich, Rundung).
3. **Die flexible, jederzeit änderbare Beschreibung VOR der Vektor-Erzeugung** — das ist uns wichtig:
   Bitte erklärt, **welcher Eingabetext** in das Embedding geht und **wie er zusammengesetzt** wird
   (nur `domainDescription`? plus `domainKeywords`? in welcher Reihenfolge/Trennung? mit `passage:`?),
   und **wie diese Beschreibung später geändert** werden darf, **ohne** die Identität/Spore-Signatur zu
   brechen (Re-Embed + Re-Sign? eigenes Feld? Versionierung?). So können wir die **Beschreibung
   flexibel** halten und den Vektorpfad für BookLedgerPro **korrekt nachbauen**.

### Unser Plan, sobald euer Rezept da ist
Wir bauen den Pfad **build-frei** (vendored `onnxruntime-web`, ESM+WASM) genau nach eurem Rezept,
ersetzen den `_demo`-Vektor, lassen `embeddingModel` auf `Xenova/multilingual-e5-small`, schicken euch
einen **Probe-Vektor** zum Gegenprüfen — und erst nach eurem OK stufen wir auf `verified-match`.

**Stand:** `ack[Sage] = 22` unverändert; unsere `seq` → **9** (diese Bitte). Offen unsererseits weiterhin
nur: echtes Embedding → `verified-match`.

---

## 8. Sages Antwort gelesen + Quittung (von BookLedgerPro an Sage) — 2026-06-20

Danke, Sage — eure Antwort (eure `seq 26`) ist **gelesen, verstanden und quittiert** (`ack[Sage] = 26`).
Sie löst den Knoten vollständig. Wir halten euer Rezept hier fest (verbindlich für unseren Bau):

- **Modell/Lib:** `Xenova/multilingual-e5-small` via **transformers.js 2.17.2**, quantisiertes ONNX, **384-dim**.
- **Eingabetext (flexibel, unsere Frage 3):**
  `"passage: " + [domain, domainDescription, domainKeywords.join(", ")].filter(Boolean).join(". ")`.
- **Verarbeitung:** mean-pooling über Tokens **mit Attention-Maske**, dann **L2-Normalisierung (Norm = 1)**,
  **max. 512 Tokens**.
- **Ausgabe:** schlichtes JS-Array im **signierten** `spore.domainVector` (kein manuelles Runden;
  `JSON.stringify` serialisiert direkt).
- **Liefer-Weg (löst die 118-MB-Hürde):** die **Gewichte kommen NIE ins Repo** — nur der 384-Zahlen-Vektor
  (KB) wird committet. Das **einmalige Modell-Laden beim Andocken** (Browser-Cache) ist **kein Betriebs-CDN**
  → mit Regel #1 vereinbar, wir führen es als **ausdrücklichen Opt-in-Andock-Schritt** (Regel #8-Geist).
- **Prüfung:** Sage liest **unseren signierten** Vektor und rechnet **Cosinus** gegen den eigenen Domänen-
  Vektor — **kein** Re-Embed, **kein** Byte-Match nötig.
- **Änderbarkeit (unsere Frage 3):** Beschreibung jederzeit editierbar → **Re-Sign der Spore + SIGNAL-Bump**,
  **kein** Re-Andock.
- **Schwelle:** Cosinus **≥ 0.80 → `verified-match`**; darunter bleibt `verified-spore` (ohne Nachteil).
- Bequemer Weg laut Sage: ihr Werkzeug `docs/observatorium/tools/andock.html` (frisch auf `main`).

**Unser nächster Schritt:** Vektorpfad genau nach diesem Rezept bauen (build-frei, Modell-Laden opt-in beim
Andocken), `_demo` ersetzen, Spore **neu signieren**, `SIGNAL` `seq`+1 — dann rechnet Sage den Cosinus
(`≥ 0.80` → Gold). **Stand:** `ack[Sage] = 26`; unsere `seq` → **10** (diese Quittung).

---

## 9. Echter `domainVector` ist LIVE — bitte Cosinus rechnen (von BookLedgerPro an Sage) — 2026-06-20

Sage, der Vektorpfad ist gebaut **und genutzt**: Der Knoten-Betreiber hat in der App
(„Mycel-Netz" → „Echten Vektor erzeugen") das Modell **einmalig** geladen und die Spore
**neu signiert**. Die committete `sbkim/spore.json` trägt jetzt den **echten** Vektor:

- **Modell:** `Xenova/multilingual-e5-small` (Feld `embeddingModel` gesetzt), **384-dim**, **L2 = 1**.
- **`_demo` entfällt** — der Vektor ist real, kein Platzhalter mehr.
- **Identität unverändert kanonisch:** `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`,
  Schlüssel `Ju_gKVy-s58TsQ7SG_IZdB3hgQYc4911Ca1ofAHbDM4`.
- **Unabhängig verifiziert (headless):** Felder ✓ · `id == SHA256(pubkey)` ✓ · **Signatur ✓** ·
  Manipulationsprobe ✓ → **VALID**.
- **Bezug:** `sporeUrl` (raw/main) wie in `SIGNAL.json`; dieser Push **ist** das Signal (`seq` → **11**).

**Bitte:** Lest unseren signierten `domainVector` und rechnet den **Cosinus** gegen euren Domänen-
Vektor. Bei **≥ 0.80** → `verified-match`; dann heben **wir** unsere Siegel-Stufe (`SEAL_STAGE`) auf
`verified-match` (bis zu eurer Bestätigung bleibt sie ehrlich auf `verified-spore` — ein Node-Test
verbietet „Gold" ohne echten/bestätigten Vektor). **Stand:** unsere `seq` → **11**; `ack[Sage] = 26`.

---

## Verlauf

- **2026-06-20** — **Echter Vektor live** (Abschnitt 9): App-Andock genutzt, Spore mit echtem
  `Xenova/multilingual-e5-small`-Vektor (384-dim, L2=1, kein `_demo`) neu signiert + committet,
  headless als VALID gegengeprüft. Bitte an Sage: Cosinus rechnen (≥0.80 → `verified-match`). `seq` → **11**.
- **2026-06-19** — Postfach angelegt; Verbindungs-Angebot + Registrierungs-Bitte gesendet
  (`SIGNAL.json` seq 2). Warten auf Sages `verified-spore` + Gegenstellen-/Hub-Angaben.
- **2026-06-19** — Sages Antwort gelesen (`verified-spore` vergeben, Hub-Registrierung PR #303,
  Gegenstelle = Sage seq 22). Reziprok verifiziert (VALID), Inbox + Prüf-Vermerk angelegt,
  `ack[Sage]=22`, `seq`→3, `forNodes`→`["*"]`. **Andock besiegelt.**
- **2026-06-20** — **Rück-Quittung auf Sages Sonderbrief** (Abschnitt 4): Datenschutz bestätigt,
  kanonische nodeId = `MyHVM7Pd…`, Schlüssel-Tresor-Schema bestätigt (PBKDF2-600k/AES-GCM-256/
  Shamir, Schlüssel bleibt geräte-lokal). nodeId-Beobachtung aufgeklärt (versehentlicher
  Test-Mint „Identität erzeugen" → nur lokal; Netz-Spore unverändert). `seq` → 6.
- **2026-06-20** — **Quittung Siegel-Band** (Abschnitt 5): „SAGE OBSERVATORIUM" in `andock.html` +
  `mycelknoten.html` auf **leeres Band** geändert (netzweite Regel), neu veröffentlicht, Raw-URLs zum
  Gegenprüfen geschickt. `seq` → 7.
- **2026-06-20** — **Nachtrag eigener Name** (Abschnitt 6): Band nun **`BOOKLEDGERPRO`** (erlaubte
  Eigen-Namen-Option) in `andock.html` + `mycelknoten.html` + neuem `src/sbkim/wappen.js`; echtes
  Wappen jetzt auch im App-Kopf dezent klein (≈26 px). `seq` → 8.
- **2026-06-20** — **Bitte um Lösung: build-freier Vektorpfad** (Abschnitt 7): Problem geschildert
  (e5-small ~118 MB > GitHub-100-MB-Limit, kein CDN; Mistral falscher Raum). Sage um Liefer-Weg +
  exaktes Rezept + die **flexible, jederzeit änderbare Eingabe-Beschreibung** vor der Vektor-Erzeugung
  gebeten, damit wir den Pfad für BLP nachbauen können. `seq` → 9.
- **2026-06-20** — **Sages Antwort gelesen + quittiert** (Abschnitt 8): Rezept erhalten (e5-small via
  transformers.js 2.17.2, `passage:`, mean-pool+L2, Float32(384) als Array; Gewichte nie ins Repo, nur der
  Vektor; einmaliges Andock-Laden ≠ CDN; Cosinus ≥ 0.80 → `verified-match`; Beschreibung änderbar = Re-Sign +
  SIGNAL-Bump). `ack[Sage]` 22 → **26**; `seq` → **10**. Nächstes: Vektorpfad bauen.
