// src/sbkim/match.js — BLP-native Umsetzung des SBKIM Hybrid-Match nach Sage-Spec.
//
// WICHTIG (Ehrlichkeit): Dies ist KEINE verbatim Sage-Kopie. Sage (Spec-Owner) hat am
// 2026-06-21 ausdrücklich OPTION 1 freigegeben — „BLP-native nach Sage-Spec", weil BLP
// embed.js (gleiches Modell) + mistral.js (EU-Aufruf) bereits an Bord hat und ein
// Vendoring von Sage-Modul-03 nur Dopplung + neuen CDN (Regel-#1-Bruch) brächte.
// Interoperabilität entsteht über den VERTRAG, nicht über byte-gleichen Quelltext.
//
// UNVERÄNDERLICHE VERTRAGS-FLÄCHE (muss 1:1 zu Sage passen):
//   Verdict:     { label, anchorId, passt, score, begruendung }
//   Fail-soft:   Richter ist NIE eine Eintritts-Barriere — bei Netz-Fehler / keinem Key
//                gilt der Vorfilter (available:false), KEIN Throw.
//   attestation: { kind:"sbkim-hybrid-match-judgment", version, judgedAt, provider,
//                  model, region, queryLabel, verdicts[] }
//
// Vorfilter: BLPs embed.js (Opt-in-Modell, kein neuer CDN). Richter: Mistral EU (BYOK).

import { cosineSimilarity, loadEmbedder, EMBED_DIM } from './embed.js';

export const SBKIM_MATCH_SPEC = 'sbkim-hybrid-match';
export const PROVIDER_MIN_MATCH = 0.80;     // Schwelle Vorfilter (Sage-Spec)
export const HYBRID_MAX_CANDIDATES = 20;

const REGION = { mistral: 'eu', claude: 'us', openai: 'us', local: 'local' };

/** EU-strikt: ohne ausdrückliche Wahl ist der Anbieter immer Mistral (EU). */
function pickJudgeProvider(opts) {
  if (typeof opts.provider === 'string' && opts.provider) return opts.provider;
  return 'mistral';
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ---- Vorfilter (lokal, server-los) -----------------------------------------

/**
 * Grobe Kandidaten via lokaler Cosinus-Ähnlichkeit über den vorgerechneten Korpus.
 * @param {string} text  Suchanfrage
 * @param {number} [k=5] Top-k
 * `minScore` steuert die Untergrenze (Default = PROVIDER_MIN_MATCH 0.80, Sage-Vertrag für
 * strenges Knoten-Matching). Für eine SUCHE übergibt der Aufrufer eine niedrigere Grenze
 * (z. B. 0), damit der Vorfilter IMMER die besten Top-k durchreicht und der Richter (nicht
 * eine starre Schwelle) die eigentliche Auswahl trifft — „der Vorfilter ist nie eine Sackgasse".
 * @param {{corpus:Array<{label:string,anchorId?:string,passageVec:number[]}>, embedQuery?:(t:string)=>Promise<number[]>, minScore?:number}} options
 * @returns {Promise<Array<{label:string, score:number, anchorId:string|null}>>}
 */
export async function queryLocal(text, k = 5, options = {}) {
  const q = String(text == null ? '' : text).trim();
  if (!q) return [];
  const kk = Number.isInteger(k) && k > 0 ? k : 5;
  const minScore = typeof options.minScore === 'number' ? options.minScore : PROVIDER_MIN_MATCH;
  const corpus = Array.isArray(options.corpus) ? options.corpus : [];
  if (corpus.length === 0) return [];
  const embedQuery = options.embedQuery || (await loadEmbedder(options)).embedQuery;
  const qv = await embedQuery(q);
  const scored = [];
  for (const c of corpus) {
    if (!c || !Array.isArray(c.passageVec) || c.passageVec.length !== EMBED_DIM) continue;
    const score = cosineSimilarity(qv, c.passageVec);
    if (Number.isFinite(score) && score >= minScore) {
      scored.push({ label: c.label, score, anchorId: c.anchorId == null ? null : c.anchorId });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, kk);
}

// ---- Richter (opt-in, Mistral EU) ------------------------------------------

const RICHTER_SYSTEM =
  'Du bist ein semantischer Abgleich-Richter (SBKIM Hybrid-Match) für Buchhaltung. Zu einer ' +
  'Suchanfrage und einer NUMMERIERTEN Liste von Kandidaten entscheidest du je Kandidat, ob er ' +
  'zur Anfrage PASST. Vergib je Kandidat einen Score zwischen 0 und 1 und eine kurze deutsche ' +
  'Begründung (max 200 Zeichen). WICHTIG: Verwende AUSSCHLIESSLICH die vorgegebenen Kandidaten ' +
  'und referenziere sie NUR über ihre Nummer "id". Erfinde KEINE Kandidaten, Konten oder Nummern. ' +
  'Antworte AUSSCHLIESSLICH mit kompaktem JSON in der Form: ' +
  '{"verdicts":[{"id":1,"passt":true,"score":0.0,"begruendung":"..."}]}.';

/** Baut die Chat-Messages für den Richter (rein, testbar). Kandidaten sind nummeriert. */
export function buildRichterMessages(query, candidates) {
  const q = typeof query === 'string' ? query : (query && query.text) || '';
  const liste = (candidates || []).map((c, i) => {
    const cos = typeof c.cosine === 'number' ? ` | cosinus=${c.cosine.toFixed(3)}` : '';
    return `[${i + 1}] ${c.label} — ${String(c.text || c.label || '').slice(0, 200)}${cos}`;
  }).join('\n');
  return [
    { role: 'system', content: RICHTER_SYSTEM },
    { role: 'user', content: `Suchanfrage:\n${String(q).slice(0, 500)}\n\nKandidaten:\n${liste}` },
  ];
}

/**
 * Parst die Richter-Antwort zu Verdicts in der Vertrags-Form (rein, testbar).
 * SICHERHEIT: Kandidaten werden NUR aus unserer Liste aufgelöst (per `id`, sonst exaktes
 * Label) — `label`/`anchorId` kommen IMMER kanonisch aus dem Korpus, nie aus dem Modell-Echo.
 * Verdicts ohne Treffer in der Liste werden VERWORFEN (keine erfundenen Konten/Nummern).
 */
export function parseVerdicts(content, candidates) {
  const m = String(content == null ? '' : content).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j;
  try { j = JSON.parse(m[0]); } catch { return null; }
  const arr = Array.isArray(j.verdicts) ? j.verdicts : null;
  if (!arr) return null;
  const cands = Array.isArray(candidates) ? candidates : [];
  const byLabel = new Map();
  cands.forEach((c) => byLabel.set(c.label, c));
  const verdicts = [];
  for (const v of arr) {
    if (!v) continue;
    let c = null;
    if (Number.isInteger(v.id) && v.id >= 1 && v.id <= cands.length) c = cands[v.id - 1];
    else if (v.label != null && byLabel.has(v.label)) c = byLabel.get(v.label);
    if (!c) continue; // kein Treffer in unserer Liste → verwerfen (Schutz vor Halluzination)
    let score = Number(v.score);
    if (!Number.isFinite(score)) score = 0;
    score = Math.max(0, Math.min(1, score));
    verdicts.push({
      label: c.label,                               // KANONISCH aus dem Korpus
      anchorId: c.anchorId == null ? null : c.anchorId,
      passt: v.passt === true,
      score,
      begruendung: String(v.begruendung || '').slice(0, 200),
      cosine: typeof c.cosine === 'number' ? c.cosine : null,
    });
  }
  return verdicts;
}

/** Baut das signierbare attestation-Objekt (rein, testbar). Schema 1:1 zu Sage. */
export function buildAttestation({ provider, model, region, queryLabel, judgedAt, verdicts }) {
  return {
    kind: 'sbkim-hybrid-match-judgment',
    version: 1,
    judgedAt: judgedAt || null,
    provider,
    model,
    region,
    queryLabel: queryLabel || null,
    verdicts: (verdicts || []).map((v) => ({
      label: v.label, anchorId: v.anchorId, passt: v.passt, score: v.score, begruendung: v.begruendung,
    })),
  };
}

/**
 * Richter-Phase (opt-in). Schickt die Kandidaten zur Bewertung an Mistral (EU, BYOK).
 * FAIL-SOFT: wirft NIE — fehlt der Schlüssel oder bricht das Netz, kommt available:false
 * zurück und der Aufrufer fällt auf den Vorfilter zurück.
 * @param {string|{text:string,label?:string}} query
 * @param {Array<{label:string,text:string,cosine?:number,anchorId?:string}>} candidates
 * @param {{apiKey?:string, provider?:string, model?:string, maxTokens?:number, euOnly?:boolean, queryLabel?:string, _chat?:Function}} [options]
 * @returns {Promise<object>} HybridJudgmentResult (Sage-Spec)
 */
export async function hybridMatch(query, candidates, options = {}) {
  const opts = options || {};
  const provider = pickJudgeProvider(opts);
  const region = REGION[provider] || 'local';
  const model = opts.model || 'mistral-small-latest';
  const queryLabel = (query && typeof query === 'object' && query.label) || opts.queryLabel || null;
  const cands = Array.isArray(candidates) ? candidates.slice(0, HYBRID_MAX_CANDIDATES) : [];
  const fallbackCandidates = cands.map((c) => ({
    label: c.label, anchorId: c.anchorId == null ? null : c.anchorId,
    cosine: typeof c.cosine === 'number' ? c.cosine : null,
  }));
  const failSoft = (reason) => ({
    available: false, reason, provider, model, region,
    judgedAt: null, verdicts: null, fallbackCandidates, tokensUsed: null, attestation: null,
  });

  if (!opts.apiKey) return failSoft('Richter nicht opt-in (kein apiKey) — Vorfilter gilt.');
  if (provider !== 'mistral') return failSoft('BLP nutzt strikt EU (Mistral); Anbieter „' + provider + '" nicht verfügbar.');
  if (cands.length === 0) return failSoft('Keine Kandidaten für den Richter.');

  let content;
  try {
    const messages = buildRichterMessages(query, cands);
    const chatFn = opts._chat || (async (msgs, o) => (await import('../ai/mistral.js')).chat(msgs, o));
    content = await chatFn(messages, { maxTokens: opts.maxTokens || 600, temperature: 0 });
  } catch (e) {
    return failSoft('Richter nicht verfügbar (Netz/Schlüssel): ' + String((e && e.message) || e));
  }

  const verdicts = parseVerdicts(content, cands);
  if (!verdicts) return failSoft('Richter-Antwort nicht lesbar (kein gültiges JSON).');
  const judgedAt = todayISO();
  return {
    available: true, reason: null, provider, model, region, judgedAt,
    verdicts, fallbackCandidates, tokensUsed: null,
    attestation: buildAttestation({ provider, model, region, queryLabel, judgedAt, verdicts }),
  };
}
