// src/domain/aufbewahrung.js
// GoBD-/§147-AO-Aufbewahrung von Belegen — reine, testbare Funktionen (ohne Speicher-Abhängigkeit).

export const AUFBEWAHRUNG_JAHRE = 10; // §147 AO: Belege i.d.R. 10 Jahre

/** Aufbewahrungsfrist-Ende: Ende des Jahres + 10 Jahre (createdAt/Datum beginnt mit YYYY). */
export function aufbewahrungBis(createdAt) {
  const m = /^(\d{4})/.exec(String(createdAt || ''));
  const jahr = m ? Number(m[1]) : new Date().getFullYear();
  return `${jahr + AUFBEWAHRUNG_JAHRE}-12-31`;
}

/** Ist der Beleg zum Stichtag noch aufbewahrungspflichtig (Frist nicht abgelaufen)? */
export function istAufbewahrungspflichtig(beleg, heute) {
  if (!beleg) return false;
  const stichtag = heute || new Date().toISOString().slice(0, 10);
  return stichtag <= aufbewahrungBis(beleg.createdAt);
}

/** GoBD-Belegprinzip: verknüpfte Belege gar nicht löschbar; sonst erst nach Fristablauf. */
export function darfBelegLoeschen(beleg, heute) {
  if (!beleg) return false;
  if (beleg.buchungId) return false;
  return !istAufbewahrungspflichtig(beleg, heute);
}
