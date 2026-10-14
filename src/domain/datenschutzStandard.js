// src/domain/datenschutzStandard.js — Pseudonymisieren ab Werk AN (Klaus 2026-10-14).
//
// Bis 2026-10-14 stand `datenschutzModus` ab Werk auf 'aus'. updateSettings() schreibt den
// GANZEN Einstellungs-Satz, also trägt jeder gespeicherte Bestand 'aus' — auch wer den Schalter
// nie angefasst hat. Ein bloß neuer Standard käme dort nie an.
//
// ⚠ TAFEL-EVOLUTION, BENANNT: Wer den Schalter NICHT selbst bedient hat (kein
// `datenschutzGewaehlt`), wird beim Laden EINMAL auf 'pseudonym' gestellt. Das ist die Richtung
// „mehr Schutz"; zurück geht es mit einem Tipp in den Einstellungen, und danach bleibt die Wahl
// (datenschutzGewaehlt: true). Wer vor diesem Stand bewusst 'aus' gewählt hatte, ist davon
// nicht zu unterscheiden und wird ebenfalls umgestellt — das sagt die Einstellungs-Karte.
// Rein, ohne DOM, node-getestet.

/** @param {object} gespeichert die geladenen Einstellungen (oder {}) @returns {object} neue Kopie */
export function datenschutzNachziehen(gespeichert) {
  const s = { ...(gespeichert || {}) };
  if (s.datenschutzGewaehlt === true) return s;
  if (s.datenschutzModus !== 'pseudonym') {
    s.datenschutzModus = 'pseudonym';
    s.datenschutzUmgestellt = true;   // für den Hinweis in den Einstellungen
  }
  return s;
}
