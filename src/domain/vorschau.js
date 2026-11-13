// src/domain/vorschau.js — Schalter für Funktionen, die ihren Nachweis noch nicht bestanden haben (Klaus' Prüfregeln, Datei-Organizer
// docs/PRUEFSTAPEL-VERMIETER-2-REGELN.md): ab Werk AUS. Einschalten nur zum Ausprobieren (Entwickler):
//   localStorage.setItem('blpr_vorschau_auszugText', 'an')       // Kontoauszug als PDF-Text/Texterkennung → Umsätze
//   localStorage.setItem('blpr_vorschau_rechnungsnummer', 'an')  // Rechnungsnummer im Belegleser
// In Proben und Messwerkzeugen: globalThis.__BLP_VORSCHAU = { auszugText: true, rechnungsnummer: true }.
// Stand 13.11.2026 (fremder Stapel „Vermieter 2“): Auszug 89 % vollständig richtig (Gegenpartei teils das Buchungswort) – Grenze 90 %;
// Rechnungsnummer 5,6 % falsch – Grenze 5 %. Darum aus, bis ein neuer Stapel es zeigt.
export function vorschauAn(name) {
  try {
    if (globalThis.__BLP_VORSCHAU && name in globalThis.__BLP_VORSCHAU) return !!globalThis.__BLP_VORSCHAU[name];
    return globalThis.localStorage?.getItem('blpr_vorschau_' + name) === 'an';
  } catch { return false; }
}
