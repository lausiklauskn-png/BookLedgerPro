// src/sbkim/embed.js — echter Domänen-Vektor (e5-small) für die Hochstufung auf
// `verified-match`. Genau nach Sages Rezept (AUSTAUSCH-Sage.md Abschnitt 8):
//   Modell  : Xenova/multilingual-e5-small (transformers.js 2.17.2), quant. ONNX, 384-dim
//   Text    : "passage: " + [domain, domainDescription, domainKeywords.join(", ")]
//             .filter(Boolean).join(". ")
//   Pooling : mean (Attention-Maske) + L2-Normalisierung (Norm = 1), max 512 Tokens
//   Ausgabe : schlichtes number[]-Array im SIGNIERTEN spore.domainVector (kein Runden)
//
// Goldene Regeln: das ~118-MB-Modell kommt NIE ins Repo (nur der KB-Vektor wird
// committet). Das einmalige Modell-Laden ist ein ausdrücklicher OPT-IN-Andock-Schritt
// (Sage: „einmaliges Laden ≠ Betriebs-CDN"; Regel #8-Geist: opt-in, bestätigt) — die App
// lädt transformers.js NICHT von selbst und nicht im Offline-Shell.

export const EMBED_MODEL = 'Xenova/multilingual-e5-small';
export const EMBED_DIM = 384;
export const EMBED_MAX_TOKENS = 512;
// transformers.js 2.17.2 als ES-Modul (wird nur beim ausdrücklichen Opt-in geladen).
export const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

/**
 * Reiner Eingabetext-Aufbau nach Sages Formel — die „flexible, jederzeit änderbare
 * Beschreibung". Testbar, ohne Modell.
 * @param {{domain?:string, domainDescription?:string, domainKeywords?:string[]}} p
 * @returns {string} z. B. "passage: <domain>. <desc>. kw1, kw2, …"
 */
export function buildPassageText(p) {
  const kw = Array.isArray(p && p.domainKeywords) ? p.domainKeywords.join(', ') : '';
  const body = [p && p.domain, p && p.domainDescription, kw].filter(Boolean).join('. ');
  return 'passage: ' + body;
}

/**
 * cap-Text = was der Knoten BIETET (Angebot-Schicht des Drei-Schichten-Erkennens, Sage
 * Karte 04): Domäne + Beschreibung + Stichworte + Stamm-Kategorien. Rein, ohne Modell.
 */
export function buildCapText(p) {
  const kw = Array.isArray(p && p.domainKeywords) ? p.domainKeywords.join(', ') : '';
  const stamm = Array.isArray(p && p.stammCategories) ? p.stammCategories.join(', ') : '';
  const body = [p && p.domain, p && p.domainDescription, kw, stamm].filter(Boolean).join('. ');
  return 'passage: ' + body;
}

/**
 * needs-Text = was der Knoten SUCHT (Bedarf-Schicht): die Gast-Kategorien, die er aufnimmt.
 * Fehlen Gast-Kategorien, fällt der Bedarf auf die Domäne zurück (besser als leer). Rein.
 */
export function buildNeedsText(p) {
  const gast = Array.isArray(p && p.guestCategories) ? p.guestCategories.join(', ') : '';
  const body = (gast || (p && p.domain) || '').toString();
  return 'passage: ' + body;
}

/** Reine L2-Norm eines Vektors. */
export function l2norm(vec) {
  let s = 0;
  for (const x of vec) s += x * x;
  return Math.sqrt(s);
}

/** Reine Cosinus-Ähnlichkeit (für Selbst-Sanity & Vorschau; Sage rechnet final). */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return NaN;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}

/**
 * Erzeugt den ECHTEN 384-dim Domänen-Vektor im Browser (Netz, opt-in). Lädt einmalig
 * transformers.js + das e5-small-Modell, bettet den `passage:`-Text ein (mean-pool +
 * L2=1) und gibt ein schlichtes Array zurück. Wirft bei Fehler (vom Aufrufer gefangen).
 * @param {object} profile  NODE_PROFILE-artig (domain/domainDescription/domainKeywords)
 * @param {{transformersUrl?:string, onStatus?:(s:string)=>void}} [opts]
 * @returns {Promise<{vector:number[], model:string, dim:number, l2:number, text:string}>}
 */
export async function embedTexts(texts, opts = {}) {
  const url = opts.transformersUrl || TRANSFORMERS_URL;
  const say = typeof opts.onStatus === 'function' ? opts.onStatus : () => {};
  say('lädt transformers.js …');
  const tf = await import(/* @vite-ignore */ url);
  const pipeline = tf.pipeline || (tf.default && tf.default.pipeline);
  if (typeof pipeline !== 'function') throw new Error('transformers.js: pipeline() nicht gefunden');
  say('lädt Modell (einmalig) …');
  const extractor = await pipeline('feature-extraction', EMBED_MODEL, { quantized: true });
  const list = Array.isArray(texts) ? texts : [texts];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    say(`bettet ein (${i + 1}/${list.length}) …`);
    const o = await extractor(String(list[i] || ''), { pooling: 'mean', normalize: true });
    const vector = Array.from(o.data || o);
    if (vector.length !== EMBED_DIM) throw new Error('Unerwartete Vektor-Länge: ' + vector.length);
    out.push({ vector, l2: l2norm(vector), text: list[i] });
  }
  return out;
}

export async function embedDomainVector(profile, opts = {}) {
  const text = buildPassageText(profile);
  const [r] = await embedTexts([text], opts);
  return { vector: r.vector, model: EMBED_MODEL, dim: EMBED_DIM, l2: r.l2, text };
}

// ---- Wiederverwendbarer Embedder (für SBKIM-Suche / Vorfilter) --------------
// e5 nutzt unterschiedliche Präfixe für Anfrage vs. Passage.
export const EMBED_QUERY_PREFIX = 'query: ';
export const EMBED_PASSAGE_PREFIX = 'passage: ';

let _embedderPromise = null;

/**
 * Lädt EINMALIG (opt-in) transformers.js + e5-small und liefert wiederverwendbare
 * Einbettungs-Funktionen (`embedQuery`, `embedPassage`), jeweils L2-normiert (384-dim).
 * Singleton: das Modell wird nur einmal geladen und für alle Aufrufe wiederbenutzt
 * (kein Betriebs-CDN — exakt derselbe Opt-in-Pfad wie `embedDomainVector`). Bei Fehler
 * wird der Cache zurückgesetzt, damit ein erneuter Versuch möglich ist.
 * @param {{transformersUrl?:string, onStatus?:(s:string)=>void}} [opts]
 * @returns {Promise<{embedQuery:(t:string)=>Promise<number[]>, embedPassage:(t:string)=>Promise<number[]>}>}
 */
export async function loadEmbedder(opts = {}) {
  if (_embedderPromise) return _embedderPromise;
  const url = opts.transformersUrl || TRANSFORMERS_URL;
  const say = typeof opts.onStatus === 'function' ? opts.onStatus : () => {};
  const p = (async () => {
    say('lädt transformers.js …');
    const tf = await import(/* @vite-ignore */ url);
    const pipeline = tf.pipeline || (tf.default && tf.default.pipeline);
    if (typeof pipeline !== 'function') throw new Error('transformers.js: pipeline() nicht gefunden');
    say('lädt Modell (einmalig) …');
    const extractor = await pipeline('feature-extraction', EMBED_MODEL, { quantized: true });
    const embed = async (text) => {
      const out = await extractor(String(text || ''), { pooling: 'mean', normalize: true });
      const v = Array.from(out.data || out);
      if (v.length !== EMBED_DIM) throw new Error('Unerwartete Vektor-Länge: ' + v.length);
      return v;
    };
    return {
      embedQuery: (t) => embed(EMBED_QUERY_PREFIX + String(t || '')),
      embedPassage: (t) => embed(EMBED_PASSAGE_PREFIX + String(t || '')),
    };
  })();
  _embedderPromise = p;
  try { return await p; } catch (e) { _embedderPromise = null; throw e; }
}
