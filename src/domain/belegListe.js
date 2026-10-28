// src/domain/belegListe.js — Belegliste für Hunderte (Leitfaden § 5, Klaus 2026-10-28). Rein, ohne DOM, in Node geprüft.
//
// Eine Mail (MAIL_TYP) wird zur Gruppe: ihre Anhänge (mail.mailId = Kennung der Mail) stehen direkt darunter, aufklappbar.
// Ein Anhang, dessen Mail nicht (mehr) in der Liste steht, bleibt eine eigene Zeile. Die Reihenfolge der Liste bleibt;
// eine Gruppe steht dort, wo ihre Mail steht.

export const MAIL_TYP_LISTE = 'message/rfc822';

/** @returns {{beleg: object, anhaenge: object[]}[]} */
export function belegGruppen(belege, mailTyp = MAIL_TYP_LISTE) {
  const liste = Array.isArray(belege) ? belege : [];
  const mails = new Set(liste.filter((b) => b && b.mediaType === mailTyp).map((b) => b.id));
  const anhaenge = new Map();
  for (const b of liste) {
    const m = b && b.mail && b.mail.mailId;
    if (m && mails.has(m) && b.id !== m) { if (!anhaenge.has(m)) anhaenge.set(m, []); anhaenge.get(m).push(b); }
  }
  const unter = new Set([...anhaenge.values()].flat().map((b) => b.id));
  return liste.filter((b) => b && !unter.has(b.id)).map((b) => ({ beleg: b, anhaenge: anhaenge.get(b.id) || [] }));
}

/** Zustandssymbol der Prüfung (Strich-ID) — klein in der Zeile, der Satz steht im title. */
export const PRUEF_SYMBOL = { offen: 'blp-offen', eigen: 'blp-eigen', sauber: 'pb-check', warnung: 'pb-warning', ungeprueft: 'pb-info', laeuft: null };

/** Gemerkte zugeklappte Gruppen: „alle“ oder eine Liste von Mail-Kennungen. */
export function gruppeZu(merk, id) {
  if (!merk) return false;
  if (merk.alle === true) return !(merk.auf || []).includes(id);
  return (merk.zu || []).includes(id);
}
export function gruppeUmschalten(merk, id) {
  const m = { alle: !!(merk && merk.alle), zu: [...((merk && merk.zu) || [])], auf: [...((merk && merk.auf) || [])] };
  const jetztZu = gruppeZu(m, id);
  if (m.alle) { m.auf = jetztZu ? [...m.auf, id] : m.auf.filter((x) => x !== id); }
  else { m.zu = jetztZu ? m.zu.filter((x) => x !== id) : [...m.zu, id]; }
  return m;
}
export const alleZu = () => ({ alle: true, zu: [], auf: [] });
export const alleAuf = () => ({ alle: false, zu: [], auf: [] });
