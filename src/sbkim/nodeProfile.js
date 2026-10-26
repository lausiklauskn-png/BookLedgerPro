// src/sbkim/nodeProfile.js
// Eine einzige Quelle der Wahrheit für das Domänen-Profil des BookLedgerPro-Knotens.
// Wird sowohl von der In-App-Erzeugung (ui/views/network.js) als auch vom
// Headless-Minter (tools/mint_spore.mjs) genutzt → die committete sbkim/spore.json
// kann NIE von der in der App erzeugten Spore abweichen (gleiche Felder, gleiche
// kanonische Signier-Form). Nur die Schlüssel (Identität) unterscheiden sich.

import { ENDPOINT } from './signal.js';

/**
 * Kanonische, dauerhafte nodeId von BookLedgerPro = die der **committeten**, im
 * Sage-Hub registrierten und von den Peers (Sage, SB·KIMTool·Point) verifizierten
 * Spore (`sbkim/spore.json`). Die App MUSS diese Identität tragen (Schlüssel-Import),
 * sonst „wandert" die Identität und alte Spore/Hub-Einträge werden ungültig.
 * Ein Node-Test hält diese Konstante mit `sbkim/spore.json` in Sync.
 */
export const CANONICAL_NODE_ID = 'MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ';

/**
 * Aktuelle Siegel-Stufe des Knotens (steuert Bronze/Gold im Kopf-Badge, wie Sages
 * `data-stufe`). Seit 2026-06-20 `verified-match` (Gold): die committete Spore trägt
 * den ECHTEN `domainVector` (e5-small, 384-dim, L2=1, kein `_demo`), und Sage hat den
 * Cosinus bestätigt: **Sage ⟷ BookLedgerPro = 0.810579 ≥ 0.80** (Sage `SIGNAL` seq 27,
 * `ack[BookLedgerPro]=11`; lokal unabhängig nachgerechnet → identisch). KEIN Fake: die
 * Stufe entspricht der Realität; ein Node-Test verbietet Gold, solange `_demo` gesetzt ist.
 */
export const SEAL_STAGE = 'verified-match';

/** Domänen-Stichworte (CLAUDE.md „Sage-Andock"): speisen domainVector + Spore. */
export const KEYWORDS = ['Buchhaltung', 'Beleg', 'Konto', 'Rechnung', 'USt', 'EÜR', 'Kostenstelle', 'GoBD', 'Mitarbeiter', 'Auftrag'];

/**
 * Angebot (cap) / Bedarf (needs) für das Drei-Schichten-Erkennen (Sage Karte 04).
 * stammCategories = was BookLedgerPro BIETET; guestCategories = was es vom Netz AUFNIMMT.
 * Speisen `buildCapText`/`buildNeedsText` → signierter `capVector`/`needsVector` der Spore.
 */
export const STAMM_CATEGORIES = ['Buchhaltung', 'Beleg-Verbuchung', 'Kontierung', 'USt-Voranmeldung', 'EÜR', 'GoBD-Festschreibung', 'Auswertungen'];
export const GUEST_CATEGORIES = ['Eingangsrechnung', 'Bankumsatz', 'Kundendaten', 'Auftragsdaten', 'Beleg-Scan', 'OCR-Text'];

/** Unveränderliche Domänen-Felder der Spore (ohne Schlüssel/Vektor). */
export const NODE_PROFILE = {
  domain: 'BookLedgerPro-Buchhaltung',
  domainDescription: 'Offline-first, verschlüsselte Buchhaltung: Belege, Konten, USt/EÜR, GoBD, Aufträge.',
  domainKeywords: KEYWORDS,
  endpoint: ENDPOINT,
  nodeName: 'BookLedgerPro',
  stammCategories: STAMM_CATEGORIES,
  guestCategories: GUEST_CATEGORIES,
};
