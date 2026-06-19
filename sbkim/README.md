# sbkim/ — SBKIM-Andock (Sage-Mycel)

Dieses Verzeichnis enthält die **veröffentlichten** SBKIM-Artefakte von BookLedgerPro.
Die Protokoll-Logik liegt in `src/sbkim/`, der headless-Verifizierer in
`tools/verify_remote_spore.mjs`. Verträge: `docs/SAGE_SYNC_BRIEFKASTEN.md` (Sync &
Briefkasten, INTERFACES §11) und `docs/SAGE_BROWSER_LEHREN.md`.

## Identität dieses Knotens

Die `spore.json` ist die **signierte** Visitenkarte des Knotens. Sie kann nur mit dem
**privaten Ed25519-Schlüssel** erzeugt werden. Es gibt **zwei gleichwertige** Wege, eine
**echte** (nicht erfundene) Spore zu erzeugen — beide nutzen dieselbe Logik
(`src/sbkim/spore.js` + `src/sbkim/nodeProfile.js`), nur der Schlüssel-Ursprung
unterscheidet sich:

1. **In-App (Tresor-geboren):** Ansicht „Mycel-Netz" → „Identität erzeugen" → „spore.json
   herunterladen". Der private Schlüssel wird im Browser-Tresor geboren und verlässt das
   Gerät nie im Klartext.
2. **Headless (Minter):** `node tools/mint_spore.mjs` erzeugt `spore.json` + `SIGNAL.json`
   und legt den privaten Schlüssel in `sbkim/.node-secret.json` ab (**gitignored**). Dieser
   Schlüssel **muss** gesichert werden — am besten per „Bestehende Identität importieren"
   in der App-Ansicht „Mycel-Netz" in den Tresor übernehmen. So trägt die App **denselben
   nodeId** wie die committete Spore.

> **Krypto-Disziplin (#4):** `sbkim/.node-secret.json` wird **nie** committet. Geht der
> Schlüssel verloren, kann der Knoten nicht mehr signieren/rotieren → dann neue Identität
> erzeugen und `spore.json` mit `--force` neu minten (nodeId wechselt → Mycel neu andocken).

## Deploy-Schritte (Modul 09, menschlich vermittelt)

1. Identität erzeugen (In-App **oder** Headless-Minter, s.o.); Headless-Schlüssel in den
   Tresor importieren.
2. **`spore.json`** und **`SIGNAL.json`** liegen unter `sbkim/` und sind committet + gepusht.
3. Mit `node tools/verify_remote_spore.mjs sbkim/spore.json` lokal prüfen (Urteil VALID).
4. Bei einem **Geschwister-Knoten** um `verified-spore` bitten (über dessen `AUSTAUSCH`-Postfach)
   und im Sage-Hub `status.json` per PR registrieren lassen — **das berührt fremde Repos und
   ist der menschlich vermittelte Schritt** (nicht aus dieser App heraus).
5. Briefkasten-Ritual leben (Start/Ende, `ack`/`seq`) — siehe `docs/SAGE_SYNC_BRIEFKASTEN.md`.

## Dateien

- `spore.json` — signierte Visitenkarte des Knotens (headless gemintet, headless VALID).
- `SIGNAL.json` — Briefkasten-Aushang (Vorlage: `SIGNAL.template.json`).
- `.node-secret.json` — **privater** Ed25519-Schlüssel (gitignored, NIE committen).
- `AUSTAUSCH-<Knoten>.md` — Postfach je Gegenstelle (Vorlage: `AUSTAUSCH-template.md`).
- `<gegenseite>_inbox.json` / `.verify.md` — signatur-reine Kopie + Verifikationsbeleg.

## Kompatibilität (geprüft)

Der Verifizierer (`src/sbkim/spore.js` + `tools/verify_remote_spore.mjs`) wurde gegen eine
**echte Geschwister-Spore** (Mein-Tresor) getestet: `id == base64url(SHA256(pubkey))` und
Ed25519-Signatur über die kanonische Form (§11.1) → **VALID**. Damit ist BookLedgerPros
Spore-Format byte-kompatibel zum Netz.
