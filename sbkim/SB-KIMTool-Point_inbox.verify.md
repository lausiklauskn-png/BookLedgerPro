# Verifikations-Beleg — SB·KIMTool·Point-Spore (gegengeprüft von BookLedgerPro)

> Prüf-Vermerk zur reziproken Verifikation (INTERFACES §11.2/§11.3).
> Signatur-reine 1:1-Kopie: `sbkim/SB-KIMTool-Point_inbox.json` (kein Zusatzfeld).

## Quelle & Zeitpunkt

- **Quelle:** `https://raw.githubusercontent.com/lausiklauskn-png/SB-KIMTool-Point/main/sbkim/spore.json`
- **Gelesen / geprüft am:** 2026-06-19
- **Verifizierer:** `tools/verify_remote_spore.mjs` (headless, `node:crypto`, zero-dep) —
  Verifizierer-Paar mit der Browser-Verifikation (`src/sbkim/spore.js`) einig.

## Identität der Gegenstelle

- **nodeName:** `SB-KIMTool-Point` (Anzeigename: SB·KIMTool·Point)
- **nodeId:** `CyunQNDRZZ3st8xGDYyK0ymJLNxn_S1UcIJpFKpXXNY`
- **publicKey.x (Ed25519):** `5RroAhzEdJtS_N2Ov6zi5aKbFJuCRywQBu_FuMhs5lo`
- **endpoint:** `https://lausiklauskn-png.github.io/SB-KIMTool-Point/`
- **domain:** `SBKIM-Werkzeug-Point` · **protocolVersion:** `0.1` · **createdAt:** `2026-05-30T21:20:23.223Z`
- **domainVector:** echt (kein `_demo`) → `verified-match`-fähig.

## 4 Prüfpunkte (§11.2) — Ergebnis: VALID (4/4)

| Prüfpunkt | Ergebnis |
|---|---|
| 9 Pflichtfelder vorhanden | ✔ |
| `id == base64url(SHA256(roher 32-Byte-Pubkey))` | ✔ (unabhängig nachgerechnet → MATCH, = von Klaus genannte nodeId) |
| Ed25519-Signatur über kanonische Form (§11.1) | ✔ |
| Manipulationsprobe (verfälschtes Feld fällt durch) | ✔ |

**Urteil: ✔ VALID.** Die gespeicherte 1:1-Kopie (`sbkim/SB-KIMTool-Point_inbox.json`)
verifiziert ebenfalls VALID.

## Reproduzieren

```
node tools/verify_remote_spore.mjs https://raw.githubusercontent.com/lausiklauskn-png/SB-KIMTool-Point/main/sbkim/spore.json
node tools/verify_remote_spore.mjs sbkim/SB-KIMTool-Point_inbox.json
```
