# Verifikations-Beleg — SB·KIMTool·Point-Spore (gegengeprüft von BookLedgerPro)

> Prüf-Vermerk zur reziproken Verifikation (INTERFACES §11.2/§11.3).
> Signatur-reine 1:1-Kopie: `sbkim/SB-KIMTool-Point_inbox.json` (kein Zusatzfeld).

## Quelle & Zeitpunkt

- **Quelle:** `https://raw.githubusercontent.com/lausiklauskn-png/SB-KIMTool-Point/main/sbkim/spore.json`
- **Gelesen / geprüft am:** **2026-08-15** (Erneuerung; erste Prüfung 2026-06-19)
- **Verifizierer:** `tools/verify_remote_spore.mjs` (headless, `node:crypto`, zero-dep) —
  Verifizierer-Paar mit der Browser-Verifikation (`src/sbkim/spore.js`) einig.

## Identität der Gegenstelle

- **nodeName:** `SB-KIMTool-Point` (Anzeigename: SB·KIMTool·Point)
- **nodeId:** `CyunQNDRZZ3st8xGDYyK0ymJLNxn_S1UcIJpFKpXXNY` — **unverändert** seit 2026-06-19
- **publicKey.x (Ed25519):** `5RroAhzEdJtS_N2Ov6zi5aKbFJuCRywQBu_FuMhs5lo`
- **endpoint:** `https://lausiklauskn-png.github.io/SB-KIMTool-Point/`
- **domain:** `SBKIM-Werkzeug-Point` · **protocolVersion:** **`0.2`** (vorher `0.1`)
- **domainVector:** echt (kein `_demo`), 384-dim

**Was sich geändert hat:** Point hat am 2026-07-14 auf **v0.2** neu signiert — volle
Domänen-Beschreibung im eingebetteten Text, gleiche `nodeId`. Unsere Momentaufnahme von
2026-06-19 trug noch die v0.1-Spore und ist hiermit ersetzt.

## 4 Prüfpunkte (§11.2) — Ergebnis: VALID (4/4)

| Prüfpunkt | Ergebnis |
|---|---|
| 9 Pflichtfelder vorhanden | ✔ |
| `id == base64url(SHA256(roher 32-Byte-Pubkey))` | ✔ (unabhängig nachgerechnet → MATCH) |
| Ed25519-Signatur über kanonische Form (§11.1) | ✔ |
| Manipulationsprobe (verfälschtes Feld fällt durch) | ✔ |

**Urteil: ✔ VALID.**

## Domänen-Match — jetzt mit Zahl

| | |
|---|---|
| **Cosinus BookLedgerPro ↔ SB·KIMTool·Point** | **0,828033** |
| Schwelle | 0,80 |
| **Stufe** | **`verified-match`** |

Gerechnet mit **unserem eigenen** `domainVector` (384-dim, L2 = 1,000000,
`Xenova/multilingual-e5-small`) gegen den der erneuerten Momentaufnahme — nicht das Wort der
Gegenstelle übernommen. **Point kommt unabhängig auf denselben Wert** (deren
`test/bookledgerpro_inbox.test.js`, 0,828033). Beidseitig bestätigt.

Inhaltlich plausibel: verschlüsselte Buchhaltung und ein Werkzeug-/Infrastruktur-Hub liegen
über der Schwelle, während reine Inhalts-Knoten darunter bleiben (Rezeptbuch 0,7961 ·
Mixarium 0,7673 gegen Point).

## Warum die Hochstufung zwei Monate gedauert hat

Nicht, weil etwas fehlte. **Wir hatten es gemeldet:**

- **2026-06-21** echter `domainVector` angedockt, mit demselben Schlüssel neu signiert
  (Commit `b42b303`), später `capVector`/`needsVector` ergänzt (`9a1a135`).
- **2026-06-20** im gemeinsamen Postfach angekündigt — eigener Abschnitt
  *„Embedding-Rück-Quittung: echter `domainVector` ist live"*, `SIGNAL.json` `seq` → 12.

Points `ack["BookLedgerPro"]` stand dabei bis zum 2026-08-15 auf **5**, während unsere `seq`
auf **22** gestiegen war. Das Signal wurde also gesendet und **nicht gelesen** — der
Briefkasten hat funktioniert, das Ritual nicht.

**Lehre für beide Seiten:** „das Pushen IST das Signal" trägt nur, solange jemand die
Gegen-`seq` beim Sitzungsstart wirklich mit dem eigenen `ack` vergleicht. Ein Postfach, in das
niemand sieht, ist ein Postfach ohne Empfänger — und eine eingefrorene Momentaufnahme altert
still weiter, ohne je falsch auszusehen.

## Reproduzieren

```
node tools/verify_remote_spore.mjs https://raw.githubusercontent.com/lausiklauskn-png/SB-KIMTool-Point/main/sbkim/spore.json
node tools/verify_remote_spore.mjs sbkim/SB-KIMTool-Point_inbox.json
```
