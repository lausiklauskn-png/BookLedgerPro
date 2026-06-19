# NAECHSTE_SITZUNG.md — Paste-fertiger Nachfolge-Brief

> **Zweck:** Diese Datei enthält den **kopierfertigen Brief** für die jeweils nächste Sitzung.
> Jede Sitzung MUSS diese Datei am Ende auf den dann nächsten Stand bringen (siehe Pflicht
> ganz unten). So entsteht eine **selbstfortschreibende Kette** ohne Reibungsverlust.
>
> **Bedienung:** Den Block zwischen den Markierungen `>>> COPY <<<` und `>>> END COPY <<<`
> komplett kopieren und als Auftrag in die neue Sitzung einfügen.

---

>>> COPY <<<

Projekt: BookLedgerPro (lausiklauskn-png/bookledgerpro).

START: Lies ZUERST `docs/PULS.md` ("START HIER") + `docs/BAUPLAN.md` + `docs/NACHFOLGE_PLAN.md` +
obersten `docs/SESSIONS.md`-Eintrag + `docs/OFFENE_PUNKTE.md`. Daraus ergibt sich alles.

STAND: Block 1 + 2 KOMPLETT · Block 3 (Liquidität) ausgebaut · Block 4 (V-Lohn) KOMPLETT (L1–L6,
`docs/LOHN.md`) · P6 (#167) · 5-Sitzungs-Sprint (Block 5) ABGESCHLOSSEN (S1·P9 #169 · S2·P10 #170 · S3·P3+P4 #171 ·
S4·P2 #172 · S5·P8 #173). **SW `v147`, Tests `1926/1926` grün, 127 JS-Module.**
**NEU ABGESTIMMT (2026-06-19, Nutzer): Thema = Sage-Mycel-Andock (Phase 5), Reihenfolge ZUERST Sage/Hub, DANN
Mein-WorkFloh.** Hintergrund-Brief + E2E-Spec-Frage stehen in `docs/SAGE_E2E_ANFRAGE.md`; Sequenz/Plan in
`docs/BAUPLAN.md` „Block 6 — Sage-Andock (Phase 5)".
**✅ SAGE HAT DIE E2E-FRAGE BEANTWORTET (2026-06-19, menschlich vermittelt): 1 JA / 2 JA / 3 JA mit Wie / 4 bestätigt.**
→ Grad-B-Pseudonymisierung (P9) ist der freigegebene **Sofortpfad** (kein Bump/Bau); echte E2E (X25519 „sealed box")
ist **Entwurf 0.2**, formaler `protocolVersion`-Bump erst nach Knoten-Deploy + Go (Sage-Hoheit, deren PR #302). Der
Relay-Schritt (Brief an Sage geben + Antwort einholen) ist damit **erledigt**.

⏭ AUFGABE DIESER SITZUNG — **Phase-5-Andock, Schritt 1: BLP zum echten SBKIM-Knoten machen** (Voraussetzung für ALLES
Weitere — ohne Spore kann BLP keinen Brief in den Briefkasten werfen). Konkret, **eine saubere PR**:
1. **Identität + Spore erzeugen** (Ed25519 via WebCrypto **in-app**; `sbkim/spore.json` mit den 9 Pflichtfeldern
   `createdAt/domain/embeddingModel/endpoint/id/nodeType/protocolVersion/publicKey/signature`; `id =
   base64url(SHA256(rawPub))`; kanonische Signier-Form = kompaktes JSON ohne `signature`, **rekursiv alphabetisch
   sortierte Schlüssel**, Ed25519, base64url ohne Padding). `domainVector` vorerst **`_demo`-Stub** markieren
   (→ Stufe `verified-spore`; echter Vektor/Transformers.js später → `verified-match`).
2. **`sbkim/SIGNAL.json`** aus dem Template füllen (`seq` ab 1, `nodeId`, `mailboxes`, `forNodes`, `ack:{}`).
3. **Headless-Beweis:** `node tools/verify_remote_spore.mjs sbkim/spore.json` muss **VALID** urteilen; reine
   Krypto-/Kanonisierungs-Helfer **node-getestet** (Signatur-Roundtrip, `id`-Ableitung, Sortier-Kanon).
4. ✅ **Brief `docs/SAGE_E2E_ANFRAGE.md` relayt — Sage hat geantwortet (2026-06-19): 1 JA / 2 JA / 3 JA mit Wie / 4
   bestätigt.** Entscheidung steht: Grad-B läuft **pseudonym (P9, ohne Spec-Änderung)** als Sofortpfad; X25519-E2E
   (Entwurf 0.2) folgt erst nach Knoten-Deploy + netzweitem Go (Sage-Hoheit). Dieser Schritt ist nicht mehr offen.

**Reihenfolge danach:** (Schritt 2) Sage/Hub-Registrierung + erster Handshake → `verified-spore`; (Schritt 3) vom Hub
aus WorkFloh-Pairing (Angebote ⇄ E-Mail/Lead-Aufbereitung über den Briefkasten); (Schritt 4) echter `domainVector` →
`verified-match`. Details: `docs/BAUPLAN.md` Block 6.

**🤝 ARBEITSAUFTRAG:** selbstständig nach Logik + Nutzen handeln, Kleines selbst entscheiden; **bei GRÖSSEREN
Konflikten/Unklarheiten INNEHALTEN und über `AskUserQuestion` rückfragen** (Datenmodell/GoBD/Krypto, Mehrdeutigkeit,
nicht build-frei/blockiert, echter Merge-Konflikt; **Hub-Registrierung/fremde Repos sind menschlich vermittelt — nie
selbst fremde Repos anfassen**). Merge-Konflikte zuerst selbst lösen (`git fetch origin main && git reset --hard
origin/main`, neu aufsetzen); nur den *inhaltlichen* Konflikt eskalieren.

RITUAL JE PR (sobald wieder gebaut wird, verbindlich):
1) `git fetch origin main && git reset --hard origin/main`; pro PR einen eigenen
   Branch `claude/<kurzbeschreibung>` von `origin/main` (bzw. den für die Sitzung vorgegebenen Branch).
2) Reine Logik ZUERST node-getestet (`node tests/run.mjs` muss grün bleiben/werden), dann
   UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser vorhanden).
3) `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen.
4) Draft-PR -> ready -> CI (smoke-test) abwarten -> **bei grün squash-mergen** (Freibrief)
   -> danach lokal `git reset --hard origin/main`.
5) Git-Identität: `user.email noreply@anthropic.com` / `user.name Claude`.

UNVERRÜCKBARE REGELN: DB-Suffix `bookledgerpro` NIEMALS ändern · build-frei (native
ES-Module, keine Bundler/CDNs/npm-Runtime) · Datendurabilität (Regel #2) · Krypto-/GoBD-/
DSGVO-Disziplin · EU-KI opt-in.

ABSCHLUSSBRIEF AM ENDE (PFLICHT — automatisch, ohne Rückfrage):
- `docs/PULS.md` „START HIER" auf den dann nächsten Schritt zeigen lassen + Kopf-Status
  (SW-Version/Testanzahl/Modulzahl) aktualisieren.
- In `docs/BAUPLAN.md` die erledigte(n) Schritt(e) abhaken (+ ggf. Plan fortschreiben);
  `docs/NACHFOLGE_PLAN.md` bei Bedarf pflegen.
- Obersten `docs/SESSIONS.md`-Eintrag schreiben (Was getan · Stand · Nächstes · offene Grenzen).
- `docs/OFFENE_PUNKTE.md` pflegen.
- **Diese Datei `docs/NAECHSTE_SITZUNG.md` neu schreiben**, sodass der COPY-Block auf den dann
  nächsten Schritt zeigt. **Solange der Sprint abgeschlossen und noch kein neues Thema abgestimmt ist, bleibt der
  COPY-Block auf „BESPRECHUNG mit dem Nutzer".** Sobald mit dem Nutzer ein neues Thema/ein neuer Sprint vereinbart
  ist, den COPY-Block auf den ersten Schritt davon setzen. Den Auftrag „ABSCHLUSSBRIEF AM ENDE (PFLICHT)" inkl.
  **dieser Selbst-Fortschreibungs-Anweisung beibehalten** (die Kette darf nie abreißen).
- Den fertigen COPY-Block am Sitzungsende auch im Chat ausgeben, damit er direkt in die
  nächste Sitzung eingefügt werden kann.

>>> END COPY <<<

---

**Stand dieses Briefes:** 2026-06-19, aktualisiert nach **Sage-Antwort auf die E2E-Frage** (menschlich vermittelt).
Neues Thema bleibt: **Sage-Mycel-Andock (Phase 5), Reihenfolge ZUERST Sage/Hub, DANN WorkFloh.** Stand: die
E2E-Frage (`docs/SAGE_E2E_ANFRAGE.md`) ist **beantwortet** — **1 JA / 2 JA / 3 JA mit Wie / 4 bestätigt**: Grad-B
läuft **pseudonym (P9)** als Sofortpfad, echte E2E (X25519, Entwurf 0.2) erst nach Knoten-Deploy + netzweitem Go
(Sage-Hoheit, deren PR #302). **Kein App-Code geändert** (reine Doku/Korrespondenz): Tests **1926/1926** · SW
**v147** · 127 JS-Module. **Nächste Sitzung = Phase-5-Schritt 1: BLP zum echten SBKIM-Knoten machen** (Spore/SIGNAL,
headless verifizierbar) — Details im COPY-Block oben. (Diese Zeile + den COPY-Block bei jeder Sitzung aktualisieren.)
