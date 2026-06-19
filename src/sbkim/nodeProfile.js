// src/sbkim/nodeProfile.js
// Eine einzige Quelle der Wahrheit für das Domänen-Profil des BookLedgerPro-Knotens.
// Wird sowohl von der In-App-Erzeugung (ui/views/network.js) als auch vom
// Headless-Minter (tools/mint_spore.mjs) genutzt → die committete sbkim/spore.json
// kann NIE von der in der App erzeugten Spore abweichen (gleiche Felder, gleiche
// kanonische Signier-Form). Nur die Schlüssel (Identität) unterscheiden sich.

import { ENDPOINT } from './signal.js';

/** Domänen-Stichworte (CLAUDE.md „Sage-Andock"): speisen domainVector + Spore. */
export const KEYWORDS = ['Buchhaltung', 'Beleg', 'Konto', 'Rechnung', 'USt', 'EÜR', 'Kostenstelle', 'GoBD', 'Mitarbeiter', 'Auftrag'];

/** Unveränderliche Domänen-Felder der Spore (ohne Schlüssel/Vektor). */
export const NODE_PROFILE = {
  domain: 'BookLedgerPro-Buchhaltung',
  domainDescription: 'Offline-first, verschlüsselte Buchhaltung: Belege, Konten, USt/EÜR, GoBD, Aufträge.',
  domainKeywords: KEYWORDS,
  endpoint: ENDPOINT,
  nodeName: 'BookLedgerPro',
};
