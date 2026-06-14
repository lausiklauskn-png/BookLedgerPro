// src/sbkim/domainvector.js
// EHRLICHER HINWEIS: Dies ist ein DETERMINISTISCHER DEMO-Vektor (384-dim,
// L2-normalisiert), markiert als `_demo` gemäß INTERFACES §11.5. Es ist KEIN
// echtes Embedding. Ein echter `domainVector` (Transformers.js,
// Xenova/multilingual-e5-small, `passage:`-Präfix) ist Voraussetzung für
// `verified-match` und folgt, sobald die Bibliothek build-frei eingebunden ist.
// Bis dahin ermöglicht der Demo-Vektor `verified-spore` (reines Identitäts-Andocken).

const DIM = 384;

/** Einfacher deterministischer PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Erzeugt einen deterministischen, L2-normalisierten Demo-Vektor aus Stichworten.
 * @returns {{vector:number[], _demo:boolean, l2:number}}
 */
export function demoVector(keywords) {
  const text = (Array.isArray(keywords) ? keywords.join(' ') : String(keywords || '')).toLowerCase();
  const rnd = mulberry32(seedFromText(text) || 1);
  const v = new Array(DIM);
  let sumSq = 0;
  for (let i = 0; i < DIM; i++) {
    const x = rnd() * 2 - 1;
    v[i] = x;
    sumSq += x * x;
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < DIM; i++) v[i] = Math.round((v[i] / norm) * 1e6) / 1e6; // stabile Float-Schreibweise
  // L2 nach Rundung (annähernd 1)
  let l2 = 0; for (const x of v) l2 += x * x; l2 = Math.sqrt(l2);
  return { vector: v, _demo: true, l2 };
}

export const VECTOR_DIM = DIM;
