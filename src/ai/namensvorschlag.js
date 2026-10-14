// src/ai/namensvorschlag.js — Namensvorschläge wie im Sende-Prüfer (Klaus 2026-10-14:
// „wie der Sendeprüfer … Namen wie Herr oder Frau aus der Grußformel ableiten").
//
// Die Erkennung ist Sage-Modul 25 (`sbkim/25_pseudonym.js`, byte-1:1, gepinnt in tests/run.mjs):
// Wörter nach Herr/Frau, aus der Begrüßung („Hallo Petra,") und aus der Grußformel.
// ⚠ EIN VORSCHLAG VERDECKT NICHTS (Klaus 2026-10-02: „gut, solange es ein Vorschlag bleibt").
// Erst ein Tipp trägt den Namen in „Weitere Namen" (settings.kiWeitereNamen) ein.
// Schon bekannte Namen und alles unter „Nie verdecken" werden nicht vorgeschlagen.
// Fehlt Modul 25, gibt es keine Vorschläge (fail-soft) — verdeckt wird wie vorher.

let _laden = null;
function modul25() {
  if (!_laden) _laden = import('../../sbkim/25_pseudonym.js').then(() => globalThis.SbkimPseudonym || null).catch(() => null);
  return _laden;
}

/**
 * @param {string} text  der Text, der an die KI gehen soll
 * @param {string[]} bekannt  Namen/Begriffe, die schon verdeckt oder ausdrücklich geschützt sind
 * @returns {Promise<{name:string, grund:'anrede'|'begruessung'|'grussformel', zeile:number}[]>}
 */
export async function namensVorschlaege(text, bekannt = []) {
  const P = await modul25();
  if (!P || typeof P.suggestNames !== 'function' || !text) return [];
  const werte = [...new Set((bekannt || []).map((w) => String(w == null ? '' : w).trim()).filter(Boolean))];
  try {
    return P.suggestNames(String(text), { values: werte }).map((v) => ({ name: v.name, grund: v.grund, zeile: v.line }));
  } catch { return []; }
}

/** Nimmt einen Namen in die Liste „Weitere Namen" auf (rein). @returns {string[]} neue Liste */
export function nameAufnehmen(liste, name) {
  const alt = Array.isArray(liste) ? liste.slice() : [];
  const n = String(name == null ? '' : name).trim();
  if (n.length >= 2 && !alt.includes(n)) alt.push(n);
  return alt;
}
