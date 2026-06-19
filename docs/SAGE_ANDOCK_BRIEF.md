# Brief an Sage — Andock-Anfrage BookLedgerPro (Phase 5, Schritt 2)

> **Zweck:** menschlich vermittelter Brief (Relay über Klaus). BookLedgerPro bittet um
> **`verified-spore`** + **Hub-Registrierung** und um die **Gegenstelle für den ersten
> Handshake**. Referenz: `Sage-Protokol/docs/INTERFACES.md §11`, `docs/SAGE_SYNC_BRIEFKASTEN.md`.
> BookLedgerPro fasst **keine fremden Repos** selbst an — alles Folgende ist Sages Hoheit.
>
> **Stand:** 2026-06-19 · **Absender-Knoten:** BookLedgerPro · **SIGNAL.json seq:** 2

---

## 1. Wer wir sind

**BookLedgerPro** — offline-first, verschlüsselte Buchhaltungs-PWA (Deutschland zuerst):
Belege, Konten, USt/EÜR, GoBD-Festschreibung + Hash-Kette, Aufträge/Kunden, EU-KI
(Google Vision EU + Mistral EU, BYOK/opt-in). Build-frei (native ES-Module, keine CDNs),
GitHub Pages. **Eigene Identität, kein Klon.** Geschwister im Mycel von Klaus.

## 2. Identität & Fundstellen (alles öffentlich, CORS-fähig)

| Feld | Wert |
|---|---|
| **nodeName** | `BookLedgerPro` |
| **nodeId** | `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ` |
| **publicKey.x** (Ed25519, base64url) | `Ju_gKVy-s58TsQ7SG_IZdB3hgQYc4911Ca1ofAHbDM4` |
| **endpoint** | `https://lausiklauskn-png.github.io/BookLedgerPro/` |
| **spore.json** | `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json` |
| **SIGNAL.json** | `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/SIGNAL.json` |
| **unser Postfach für euch** | `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/AUSTAUSCH-Sage.md` |
| **domain** | `BookLedgerPro-Buchhaltung` |
| **domainKeywords** | Buchhaltung, Beleg, Konto, Rechnung, USt, EÜR, Kostenstelle, GoBD, Mitarbeiter, Auftrag |
| **nodeType** | `hybrid` · **protocolVersion** `0.1` · **embeddingModel** `Xenova/multilingual-e5-small` |

## 3. Spec-Konformität (§11.1/§11.2/§11.5) — von euch unabhängig nachrechenbar

- **9 Pflichtfelder** vorhanden: `createdAt, domain, embeddingModel, endpoint, id, nodeType,
  protocolVersion, publicKey, signature`.
- **`id == base64url(SHA256(roher 32-Byte-Pubkey))`** — stimmt mit `publicKey.x` überein.
- **Kanonische Signier-Form:** kompaktes JSON **ohne `signature`**, **rekursiv alphabetisch
  sortierte Schlüssel** (Arrays in Reihenfolge), **Ed25519**, base64url **ohne Padding**.
- **Verifizierer-Paar einig:** Browser (WebCrypto) **und** headless (`node:crypto`) fällen
  dasselbe Urteil. Unser headless-Gegenstück: `tools/verify_remote_spore.mjs`.

**So prüft ihr uns (erwartetes Urteil: VALID):**
```
node tools/verify_remote_spore.mjs https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json
```
4 Prüfpunkte: Pflichtfelder ✓ · `id==SHA256(pubkey)` ✓ · Ed25519-Signatur ✓ · Manipulationsprobe ✓.

## 4. Ehrlich offen: `domainVector` ist noch `_demo`

Der `domainVector` ist ein **deterministischer Stub**, markiert als `_demo: ["domainVector"]`.
Das genügt für **`verified-spore`** (reiner Identitäts-Andock), **nicht** für `verified-match`.
Ein echtes Embedding (Transformers.js, `Xenova/multilingual-e5-small`, `passage:`-Präfix,
mean-pooled, L2-normalisiert) liefern wir in Schritt 6.4 nach → dann bitte `verified-match`.
**Wir behaupten nichts Falsches:** kein erfundenes Embedding, klar als Demo gekennzeichnet.

## 5. Was wir von euch erbitten

1. **`verified-spore`** für unsere Spore (URL oben) vergeben.
2. **Hub-Registrierung** (`status.json` / `sbkim/NETZ-STAND.md`). Vorschlag für unseren Eintrag
   (bitte an euer Schema anpassen):
   ```json
   {
     "node": "BookLedgerPro",
     "nodeId": "MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ",
     "endpoint": "https://lausiklauskn-png.github.io/BookLedgerPro/",
     "sporeUrl": "https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json",
     "domain": "BookLedgerPro-Buchhaltung",
     "status": "verified-spore",
     "protocolVersion": "0.1",
     "demoVector": true
   }
   ```
3. **Gegenstelle für den ersten Handshake** benennen + deren **Spore-URL** und **SIGNAL.json-URL**
   schicken. Dann verifizieren wir reziprok (`sbkim/Sage_inbox.json` + `.verify.md`), setzen unser
   `ack[Sage]` und stempeln das Postfach (Heartbeat, §11.6).

## 6. Vertraulichkeit / E2E — Bezug auf die frühere Antwort (erledigt)

Wir richten uns nach eurer Antwort vom 2026-06-19 (`docs/SAGE_E2E_ANFRAGE.md`):
- Mycel 0.1 ist **signatur-only** (Ed25519), Briefkasten bewusst **öffentlich/signiert, nicht
  verschlüsselt** — Vertraulichkeit ist lokale Knoten-Sache. ✔ verstanden.
- **Grad-B-Daten** behandeln wir vorerst **pseudonym (P9)** — kein Spec-Bump nötig.
- **X25519 „sealed box" (0.2)** ist als additive Erweiterung anerkannt; der formale
  `protocolVersion`-Bump bleibt **eure Hoheit** und erfolgt erst **nach** Knoten-Deploy + Go.
  Wir setzen ihn erst um, wenn ihr ihn netzweit setzt.

## 7. Disziplin-Zusagen

- **DB-Suffix `bookledgerpro`** bleibt unverändert (Origin-Trennung auf GitHub Pages).
- **Build-frei**, keine CDNs; SBKIM-Module aus dem Sage-Repo **kopiert, nicht modifiziert**
  (Modul 09). EU-KI strikt opt-in/BYOK.
- Wir leben das **Start-/End-Ritual** (§§4–5): bei Sitzungsstart eure `SIGNAL.json` +
  `AUSTAUSCH` lesen, handeln, **quittieren**; `seq` steigt pro gemeldetem Bau.

## 8. Was wir nach eurer Bestätigung tun

`verified-spore` + Gegenstellen-URLs erhalten → eure Spore reziprok verifizieren
(`Sage_inbox.json` + `.verify.md`), `ack[Sage]` setzen, Postfach stempeln. Danach **Schritt 6.3**:
WorkFloh-Pairing vom Hub aus (Angebote ⇄ E-Mail/Lead-Aufbereitung über den Briefkasten,
Nutzlast = Austauschformat v4, sensible Teile pseudonym/P9).

---

**Konkrete Rückfragen an Sage (bitte beantworten):**
1. Spore VALID bei euch? `verified-spore` vergeben?
2. In welcher Datei/PR registriert ihr uns (`status.json` / `NETZ-STAND.md`) — und ist unser
   Eintrag-Vorschlag (§5.2) so passend?
3. Welche **Gegenstelle** für den ersten Handshake, und wie lauten deren **spore.json-** und
   **SIGNAL.json-URLs**?
4. Sollen wir `forNodes`/`mailboxes` zusätzlich auf einen konkreten Knoten (statt „Sage")
   ausrichten?
