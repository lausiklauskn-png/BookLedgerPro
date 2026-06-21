// src/sbkim/hybridSearch.js — SBKIM Hybrid-Suche: Vorfilter (lokal) + Richter (opt-in)
// + Fail-soft. Vorlage: Sage docs/HYBRID-MATCH-EINBAU.md (main). BLP-native Umsetzung:
// nutzt ES-Module-Importe statt window-Globals (window.SbkimMatch). Vertrags-Fläche 1:1.
//
// Rückgabe-Modi (1:1 zu Sage):
//   "vorfilter-leer"       — Vorfilter findet nichts (kein Kandidat ≥ Schwelle)
//   "nur-vorfilter"        — kein apiKey → server-loser Default, Vorfilter ist das Ergebnis
//   "fail-soft-vorfilter"  — Richter nicht verfügbar (Netz/JSON) → Vorfilter gilt weiter
//   "richter"              — Richter-Urteil (nur passende Kandidaten, nach Score sortiert)
//
// Der Richter ist NIE eine Eintritts-Barriere: bei jedem Problem wird etwas Sinnvolles gezeigt.

import { queryLocal, queryLocalDimensions, hybridMatch } from './match.js';

/**
 * @param {string} text   Suchanfrage (Freitext-Modus)
 * @param {Array<{label:string,text:string,anchorId?:string,passageVec:number[],capVec?:number[],needsVec?:number[]}>} corpus
 * @param {{apiKey?:string, provider?:string, euOnly?:boolean, queryLabel?:string, model?:string,
 *          k?:number, minScore?:number, embedQuery?:Function, _chat?:Function,
 *          queryNode?:{queryCapVec?:number[],queryNeedsVec?:number[],queryVec?:number[]}}} [opts]
 * @returns {Promise<{mode:string, treffer:Array, reason?:string, attestation?:object}>}
 *
 * Zwei Vorfilter-Wege:
 *  • Freitext (Default): eine Schicht, `queryLocal` (Anfrage-Text → Cosinus gegen passageVec).
 *  • Knoten↔Knoten (`opts.queryNode` gesetzt): DREI-Schichten-Erkennen (`queryLocalDimensions`,
 *    Sage Karte 04) — zwei Lanes cap/needs, Apoptose bei 2+ Schichten < 0.60, Rückfall auf
 *    domainVector-Cosinus für Knoten ohne cap/needs (Nur-Anbieter-Modus).
 */
export async function sbkimHybridSearch(text, corpus, opts = {}) {
  opts = opts || {};
  const k = opts.k || 5;

  // 1. VORFILTER (lokal, server-los).
  const prelim = opts.queryNode
    ? queryLocalDimensions(corpus, opts.queryNode, k)
    : await queryLocal(text, k, { corpus, embedQuery: opts.embedQuery, minScore: opts.minScore });
  if (prelim.length === 0) return { mode: 'vorfilter-leer', treffer: [] };

  // Ohne Schlüssel: server-loser Default — Vorfilter ist das Ergebnis.
  if (!opts.apiKey) return { mode: 'nur-vorfilter', treffer: prelim };

  // 2. Kandidaten für den Richter aufbereiten (Bedeutungs-Text dazuholen).
  const byKey = new Map();
  for (const c of corpus) byKey.set(c.anchorId || c.label, c);
  const candidates = prelim.map((r) => {
    const src = byKey.get(r.anchorId || r.label) || {};
    return { label: r.label, text: src.text || r.label, cosine: r.score, anchorId: r.anchorId };
  });

  // 3. RICHTER (opt-in) — Mistral EU (BYOK).
  const judgment = await hybridMatch(
    { text, label: opts.queryLabel || null },
    candidates,
    {
      apiKey: opts.apiKey,
      provider: opts.provider || 'mistral',
      euOnly: opts.euOnly !== false,
      model: opts.model,
      _chat: opts._chat,
    },
  );

  // 4. FAIL-SOFT — Richter nicht verfügbar → Vorfilter gilt weiter.
  if (!judgment.available) return { mode: 'fail-soft-vorfilter', reason: judgment.reason, treffer: prelim };

  // 5. Richter-Urteil — nur passende Kandidaten, nach Score sortiert.
  //    `geprueft` = alle vorgelegten Kandidaten (Transparenz, wenn der Richter alle ablehnt).
  const treffer = judgment.verdicts.filter((v) => v.passt).sort((a, b) => b.score - a.score);
  return { mode: 'richter', treffer, attestation: judgment.attestation, geprueft: judgment.fallbackCandidates || [] };
}
