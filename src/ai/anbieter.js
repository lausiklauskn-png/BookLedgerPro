// src/ai/anbieter.js
// KI-Anbieterwahl je Modus (Funktion) — STRIKT innerhalb der EU.
//
// Reine Logik (node-getestet): Registry der erlaubten KI-Anbieter, Modi (Funktionen)
// und Selektoren, mit denen die App je Funktion (OCR, Kontierung, Steuer-Assistent)
// einen Anbieter wählt. Es wird KEIN neuer Anbieter eingeführt — nur die bereits
// vorhandenen EU-Dienste (Google Vision EU für OCR, Mistral EU für Text) sowie die
// On-Device-Heuristik bzw. „aus" sind wählbar.
//
// STRIKT EU: Anbieter tragen eine `region`. Wählbar sind ausschließlich Anbieter aus
// `ERLAUBTE_REGIONEN` (EU + lokal/On-Device). **Nicht-EU bleibt bewusst geschlossen/
// dormant** — ein Anbieter mit `region: 'nicht-eu'` (oder `dormant: true`) ist nie
// wählbar; die App hält keinen aktiven Nicht-EU-Anbieter. So bleibt die Architektur
// für eine spätere, ausdrücklich freigegebene Erweiterung offen, ohne heute einen
// Datenabfluss außerhalb der EU zu ermöglichen.

/** KI-Funktionen („Modi"), je eigener Anbieter wählbar. */
export const KI_MODI = Object.freeze(['ocr', 'kontierung', 'steuer']);

/** Regionen eines Anbieters. */
export const KI_REGION = Object.freeze({ EU: 'eu', LOKAL: 'lokal', NICHT_EU: 'nicht-eu' });

/** Regionen, aus denen ein Anbieter gewählt werden DARF (alles andere bleibt dormant). */
export const ERLAUBTE_REGIONEN = Object.freeze(['eu', 'lokal']);

/**
 * Anbieter-Registry. `modi` = Funktionen, für die der Anbieter überhaupt in Frage
 * kommt. `aus` = „keine KI für diese Funktion" (immer für jede Funktion wählbar).
 * KEIN neuer Anbieter: nur Vision (EU), Mistral (EU), On-Device-Heuristik, aus.
 */
export const KI_ANBIETER = Object.freeze({
  vision:    Object.freeze({ id: 'vision',    region: 'eu',    modi: ['ocr'] }),
  mistral:   Object.freeze({ id: 'mistral',   region: 'eu',    modi: ['ocr', 'kontierung', 'steuer'] }),
  heuristik: Object.freeze({ id: 'heuristik', region: 'lokal', modi: ['kontierung'] }),
  aus:       Object.freeze({ id: 'aus',       region: 'lokal', modi: ['ocr', 'kontierung', 'steuer'] }),
});

/** Standard-Wahl je Modus — verhaltensgleich zum bisherigen Festverdrahteten. */
export const STANDARD_WAHL = Object.freeze({ ocr: 'vision', kontierung: 'mistral', steuer: 'mistral' });

/** True, wenn die Region aus einem erlaubten (EU/lokalen) Raum stammt. */
export function regionErlaubt(region) {
  return ERLAUBTE_REGIONEN.includes(region);
}

/** True, wenn der Anbieter existiert, nicht dormant ist und in einer erlaubten Region liegt. */
export function istAnbieterErlaubt(id) {
  const a = KI_ANBIETER[id];
  return Boolean(a && !a.dormant && regionErlaubt(a.region));
}

/** Liefert die für einen Modus wählbaren Anbieter-Objekte (nur EU/lokal, nicht dormant). */
export function erlaubteAnbieter(modus) {
  if (!KI_MODI.includes(modus)) return [];
  return Object.values(KI_ANBIETER).filter((a) => a.modi.includes(modus) && istAnbieterErlaubt(a.id));
}

/** True, wenn `id` für `modus` eine gültige, erlaubte Wahl ist. */
export function istWahlGueltig(modus, id) {
  return erlaubteAnbieter(modus).some((a) => a.id === id);
}

/**
 * Normalisiert eine (teilweise/ungültige) Anbieter-Wahl auf `{ocr,kontierung,steuer}`.
 * Unbekannte/unzulässige (z. B. Nicht-EU) Werte fallen auf den Standard zurück.
 */
export function normalizeAnbieterWahl(wahl) {
  const w = wahl && typeof wahl === 'object' ? wahl : {};
  const out = {};
  for (const m of KI_MODI) out[m] = istWahlGueltig(m, w[m]) ? w[m] : STANDARD_WAHL[m];
  return out;
}

/** Aktiver Anbieter-Id für einen Modus (nach Normalisierung). */
export function aktiverAnbieter(modus, wahl) {
  return normalizeAnbieterWahl(wahl)[modus];
}

/** True, wenn der aktive Anbieter dieses Modus „aus" ist (keine KI). */
export function istAus(modus, wahl) {
  return aktiverAnbieter(modus, wahl) === 'aus';
}

/** True, wenn der aktive Anbieter dieses Modus die On-Device-Heuristik ist (kein Versand). */
export function istLokal(modus, wahl) {
  const a = KI_ANBIETER[aktiverAnbieter(modus, wahl)];
  return Boolean(a && a.region === 'lokal');
}

/** True, wenn der aktive Anbieter dieses Modus ein EU-Cloud-Dienst ist (Versand in die EU). */
export function istEuCloud(modus, wahl) {
  const a = KI_ANBIETER[aktiverAnbieter(modus, wahl)];
  return Boolean(a && a.region === 'eu');
}
