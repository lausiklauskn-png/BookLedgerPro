# Sage-Protokoll & Browser-Lehren — verbindliche Referenz

Quelle der Lehren: `Sage-Protokol/docs/OBSERVATORIUM_BROWSER.md` („Browser sind wie
schwarze Löcher") — reale Befunde aus dem Andock-Betrieb (Klaus, 2026-05). Für eine
**Buchhaltung** wiegen sie schwerer als für die Rezept-Apps: Datenverlust ist hier
GoBD-rechtswidrig und existenzbedrohend. Dieses Dokument ist **verbindlich**.

---

## Teil A — Sage/SBKIM in Kürze

**SBKIM** (Semantisch-Empfangendes Bidirektionales KI-Matching) ist ein serverloses
P2P-„Mycel" für kleine PWAs:

- **Identität:** Ed25519-Keypair in IndexedDB → deterministische `nodeId` aus dem Public
  Key. **Eine PWA = eine Identität**, origin- **und instanzgebunden**.
- **Domäne:** 384-dim L2-normalisierter `domainVector` (On-Device-Embedding,
  `Xenova/multilingual-e5-small`). Zwei Knoten „anastomosieren" bei Cosinus-Match ≥ 0.80.
- **Spore:** signierte Visitenkarte unter `<endpoint>/sbkim/spore.json` (Spore + Public-Key
  + Signatur, **kein Private-Key**).
- **Hub:** `status.json` vermittelt nur den Erstkontakt; danach direkt zwischen Knoten.
- **Transport:** BroadcastChannel (same-origin **+ same-instance**, lokal) und
  HTTP/Service-Worker-Anastomose (`POST /sbkim/anastomosis`, cross-origin).
- **Andock-Vertrag (Modul 09, 11 Schritte):** Dateien **kopieren, nicht modifizieren**;
  Reihenfolge der `<script>`-Tags verbindlich; kein Crawler/Discovery, kein Auto-Re-Publish.

Für BookLedgerPro relevant ab **Phase 5**. Bis dahin gelten die Browser-Lehren bereits jetzt.

---

## Teil B — Die acht Browser-Lehren

1. **Browser-Instanzen sind getrennter als gedacht.** DeX-Chrome ≠ Tablet-Chrome,
   Chrome-Profile, Inkognito, Standalone-PWA vs. Tab → je eigene IndexedDB, eigene SW,
   eigene Identität. BroadcastChannel trägt nur **same-instance**.
2. **IndexedDB ist persistent, aber nicht unsterblich.** Quota-Druck, „Sitedaten löschen",
   „beim Schließen löschen", PWA-Deinstallation, seltene Update-Migrationsfehler können
   alles reklamieren. Klaus hat real Identitäten verloren. **Pages-`spore.json` ist KEIN
   Backup** (kein Private-Key).
3. **BroadcastChannel = same-origin UND same-instance.** Mobile-Chrome suspendiert
   Hintergrund-Tabs → Handshake-Timeout. Cross-Device nur über HTTP/SW-Pfad.
4. **SW-Cache + Updates brauchen File-Rename / Version-Bump.** Browser-HTTP-Cache +
   App-SW-Cache + Pages-CDN cachen aggressiv; `git push` allein reicht nicht.
5. **Eruda ≠ Chrome-DevTools** (Tablet): kein top-level `await`, `copy()` teils blockiert,
   abgeschnittene Ausgaben → Diagnose per Datei-Download.
6. **Termux + Android-Storage als Brücke** — real wird am Tablet (DeX + Termux +
   `python -m http.server`) gebaut/getestet. **Keine schweren Build-Ketten.**
7. **DeX = ernsthafte Test-Plattform** (separate Instanz, weniger Tab-Suspendierung,
   Multi-Window, Maus+Tastatur).
8. **DeX-Cursor-Overlay nicht überschreibbar:** `cursor: none`/Custom-Cursor werden
   ignoriert; nur `cursor: pointer` greift. Effekte als **Addition** (Canvas) zeichnen.

---

## Teil C — Hard-Rules für BookLedgerPro (Probleme von vornherein vermeiden)

| Lehre | Konsequenz im Code |
|---|---|
| 2 | **Datendurabilität #1.** `requestPersistence()` beim Boot; `durabilityStatus()`-Banner; Onboarding **erzwingt erstes Backup**; Shamir-Key-Sicherung. → `core/durability.js`, `core/backup.js`, `ui/lock.js` |
| 1 | **Identität/Bücher pro Instanz.** Mandant-Indikator im Header; Export/Import zum Instanz-/Geräte-Transfer; Single-Instance-Disziplin dokumentiert. |
| 1, 9* | **DB-Suffix `bookledgerpro`** für alle DBs → keine `blocked-origin-collision`. → `core/db.js` (`DB_SUFFIX`) |
| 4 | **`CACHE_VERSION` in `sw.js`** bei Shell-Änderungen erhöhen (oder Datei umbenennen). App-SW darf Buchungslogik **nicht stale** ausliefern. |
| 3 | **Sync (Phase 5):** lokal BroadcastChannel (beide Tabs sichtbar), cross-device HTTP/SW; Timeouts/Suspendierung einplanen, idempotente Konfliktlösung. |
| 8 | **Design-Effekte additiv** (Canvas-Overlay), nie `cursor: none`; Pointer-Lock meiden. |
| 5, 6 | **Dev-Workflow tablet-tauglich:** Diagnose per Datei-Download (`core/files.js`), keine top-level-`await`-Snippets, `python3 -m http.server` als Referenz. |

\* „Lehre 9" = Origin-Bindung aus Sage Modul 09 (Pages-Project-Sites teilen den Origin).

---

## Teil D — Pflege

Neue Browser-Befunde hier **unten** anhängen (Datum + Hardware + Repro + Workaround),
bestehende nicht überschreiben — Befund bleibt Befund. Analog zur Pflege-Konvention der
Original-Doku im Sage-Repo.
