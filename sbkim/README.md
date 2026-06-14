# sbkim/ — SBKIM-Andock (Sage-Mycel)

Dieses Verzeichnis enthält die **veröffentlichten** SBKIM-Artefakte von BookLedgerPro.
Die Protokoll-Logik liegt in `src/sbkim/`, der headless-Verifizierer in
`tools/verify_remote_spore.mjs`. Verträge: `docs/SAGE_SYNC_BRIEFKASTEN.md` (Sync &
Briefkasten, INTERFACES §11) und `docs/SAGE_BROWSER_LEHREN.md`.

## Warum hier (noch) keine `spore.json` liegt

Die `spore.json` ist die **signierte** Visitenkarte des Knotens. Sie kann nur mit dem
**privaten Ed25519-Schlüssel** erzeugt werden, der **im Browser verschlüsselt** auf dem
Gerät des Nutzers liegt und es nie im Klartext verlässt. Eine echte Spore wird daher
**in der App** erzeugt (Ansicht „Mycel-Netz" → Identität erzeugen → „spore.json
herunterladen") und anschließend hierher committet. Es wird **bewusst keine** Spore mit
erfundener Signatur eingecheckt.

## Deploy-Schritte (Modul 09, menschlich vermittelt)

1. In der App eine **SBKIM-Identität erzeugen** (Ansicht „Mycel-Netz").
2. **`spore.json`** und **`SIGNAL.json`** herunterladen und hierher (`sbkim/`) committen + pushen.
3. Mit `node tools/verify_remote_spore.mjs sbkim/spore.json` lokal prüfen (Urteil VALID).
4. Bei einem **Geschwister-Knoten** um `verified-spore` bitten (über dessen `AUSTAUSCH`-Postfach)
   und im Sage-Hub `status.json` per PR registrieren lassen — **das berührt fremde Repos und
   ist der menschlich vermittelte Schritt** (nicht aus dieser App heraus).
5. Briefkasten-Ritual leben (Start/Ende, `ack`/`seq`) — siehe `docs/SAGE_SYNC_BRIEFKASTEN.md`.

## Dateien

- `spore.json` — wird durch den Deploy-Schritt erzeugt (s.o.).
- `SIGNAL.json` — Briefkasten-Aushang (Vorlage: `SIGNAL.template.json`).
- `AUSTAUSCH-<Knoten>.md` — Postfach je Gegenstelle (Vorlage: `AUSTAUSCH-template.md`).
- `<gegenseite>_inbox.json` / `.verify.md` — signatur-reine Kopie + Verifikationsbeleg.

## Kompatibilität (geprüft)

Der Verifizierer (`src/sbkim/spore.js` + `tools/verify_remote_spore.mjs`) wurde gegen eine
**echte Geschwister-Spore** (Mein-Tresor) getestet: `id == base64url(SHA256(pubkey))` und
Ed25519-Signatur über die kanonische Form (§11.1) → **VALID**. Damit ist BookLedgerPros
Spore-Format byte-kompatibel zum Netz.
