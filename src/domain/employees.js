// src/domain/employees.js
// Mitarbeiter + Zeiterfassung (reine Helfer). Personenbezogene Daten — werden im
// Store verschlüsselt abgelegt (siehe crm-store.js / encstore.js).

export function validateMitarbeiter(m) {
  const errors = [];
  if (!m.name || !m.name.trim()) errors.push('Name fehlt.');
  if (m.stundenlohnCent != null && (!Number.isInteger(m.stundenlohnCent) || m.stundenlohnCent < 0)) {
    errors.push('Stundenlohn ungültig.');
  }
  return errors;
}

export function validateZeit(z) {
  const errors = [];
  if (!z.datum || !/^\d{4}-\d{2}-\d{2}$/.test(z.datum)) errors.push('Datum ungültig.');
  if (!Number.isFinite(Number(z.dauerMin)) || Number(z.dauerMin) <= 0) errors.push('Dauer (Minuten) muss positiv sein.');
  return errors;
}

/**
 * Summiert Zeiteinträge.
 * @param {Array} entries - {dauerMin}
 * @param {?number} stundenlohnCent
 * @returns {{minuten:number, stunden:number, kostenCent:?number}}
 */
export function zeitSummen(entries, stundenlohnCent = null) {
  const minuten = (entries || []).reduce((s, e) => s + (Number(e.dauerMin) || 0), 0);
  const stunden = minuten / 60;
  const kostenCent = stundenlohnCent != null ? Math.round(stunden * stundenlohnCent) : null;
  return { minuten, stunden, kostenCent };
}

/** Formatiert Minuten als "Hh Mm". */
export function formatDauer(minuten) {
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
