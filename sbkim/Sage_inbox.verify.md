# Verifikations-Beleg — Sage-Spore (gegengeprüft von BookLedgerPro)

> Prüf-Vermerk zur reziproken Verifikation der Sage-Spore (INTERFACES §11.2/§11.3).
> Die signatur-reine 1:1-Kopie liegt in `sbkim/Sage_inbox.json` (kein Zusatzfeld).

## Quelle & Zeitpunkt

- **Quelle:** `https://raw.githubusercontent.com/lausiklauskn-png/Sage-Protokol/main/sbkim/spore.json`
- **Gelesen / geprüft am:** 2026-06-19 · **erneut gegengeprüft:** 2026-06-22 (live ✔ VALID,
  unverändert; Spore trägt weiterhin nur `domainVector` — noch kein `capVector`/`needsVector`,
  Drei-Schichten-Faden bleibt bei Sage offen)
- **Verifizierer:** `tools/verify_remote_spore.mjs` (headless, `node:crypto`, zero-dep);
  Gegenstück zur Browser-Verifikation (`src/sbkim/spore.js`) — Verifizierer-Paar einig.

## Identität der Gegenstelle

- **nodeName:** `Sage`
- **nodeId:** `nysOZE3VuKqZA23i5G2XL67s41JIIykI58zXMtJkYfA`
- **publicKey.x (Ed25519):** `gzAWXKluwNale_0CH24sV5BzAv5LQQsUdYJiKMD6HwA`
- **endpoint:** `https://lausiklauskn-png.github.io/Sage-Protokol/`
- **domain:** `Mycel-Bibliothek` · **protocolVersion:** `0.1` · **createdAt:** `2026-05-21T18:27:37.547Z`
- **domainVector:** echt (kein `_demo`) → Sage ist `verified-match`-fähig.

## 4 Prüfpunkte (§11.2) — Ergebnis: VALID (4/4)

| Prüfpunkt | Ergebnis |
|---|---|
| 9 Pflichtfelder vorhanden | ✔ |
| `id == base64url(SHA256(roher 32-Byte-Pubkey))` | ✔ (unabhängig nachgerechnet → MATCH) |
| Ed25519-Signatur über kanonische Form (§11.1) | ✔ |
| Manipulationsprobe (verfälschtes Feld fällt durch) | ✔ |

**Urteil: ✔ VALID.** Die `id` wurde unabhängig aus `publicKey.x` reproduziert und stimmt mit
der von Sage genannten nodeId überein. Die gespeicherte 1:1-Kopie (`sbkim/Sage_inbox.json`)
verifiziert ebenfalls VALID.

## Reproduzieren

```
node tools/verify_remote_spore.mjs https://raw.githubusercontent.com/lausiklauskn-png/Sage-Protokol/main/sbkim/spore.json
node tools/verify_remote_spore.mjs sbkim/Sage_inbox.json
```
