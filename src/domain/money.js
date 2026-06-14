// src/domain/money.js
// Geld wird intern als ganzzahlige Cent gespeichert (keine Float-Rundungsfehler).
// Anzeige/Eingabe in deutschem Format (Komma als Dezimaltrenner).

/** Parst eine deutsche Betragseingabe ("1.234,56" oder "1234.56" oder "12") zu Cent. */
export function parseEuroToCents(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    // Deutsches Format: Punkte sind Tausendertrenner, Komma ist Dezimaltrenner.
    s = s.replace(/\./g, '').replace(',', '.');
  }
  // sonst: Punkt als Dezimaltrenner (oder keiner)
  const val = Number(s);
  if (!Number.isFinite(val)) return NaN;
  return Math.round(val * 100);
}

/** Formatiert Cent als deutschen Betrag, ohne Währungssymbol ("1.234,56"). */
export function formatCents(cents) {
  const n = (cents || 0) / 100;
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Wie formatCents, mit Euro-Zeichen. */
export function formatEuro(cents) {
  return formatCents(cents) + ' €';
}

export function isValidCents(cents) {
  return Number.isInteger(cents) && cents >= 0;
}
