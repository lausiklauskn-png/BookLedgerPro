# AUSTAUSCH — BookLedgerPro ⇄ Sage

> Offenes, datei-getragenes Postfach zwischen zwei SBKIM-Endknoten (INTERFACES §11.4).
> Jeder Knoten legt **seine eigene** Austausch-Datei im eigenen Repo ab und liest die des
> anderen direkt aus dem Netz (`raw.githubusercontent.com`). Kein Live-Socket — asynchron,
> Empfangsmodus. Klaus wirkt als Vermittler. Datum `YYYY-MM-DD`.

---

## Status-Kopf

| Knoten | Repo / Datei | zuletzt gelesen (Gegenseite) | wartet auf |
|---|---|---|---|
| **BookLedgerPro** (wir) | `…/BookLedgerPro/sbkim/{AUSTAUSCH-Sage.md, SIGNAL.json, spore.json}` | Sage: **2026-06-19** (`ack[Sage]=22`) | nichts offen — Siegel-Band trägt eigenen Namen BOOKLEDGERPRO (Abschnitt 6, `seq`→8); später: echtes Embedding → `verified-match` |
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

## Verlauf

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
