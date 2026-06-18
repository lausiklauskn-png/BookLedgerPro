// src/domain/demodaten-store.js
// Store-Glue für die OPTIONALE Demo-Vorbefüllung eines Test-Tresors (docs/TEST_MODUS.md):
// die DÜNNE IndexedDB-/Schreib-Schicht über dem reinen Vorbefüllungs-Plan
// (domain/demodaten.js `demoBefuellungsplan`). Schreibt den deterministischen Demo-Mandanten
// in den AKTUELL entsperrten Tresor — gedacht für einen frisch angelegten Sandbox-Tresor,
// damit man sofort mit realistischen Daten (Journal, EÜR, USt-VA, Anlagen, Kassenbuch …)
// üben kann, statt mit einem leeren Test zu starten.
//
// Aufgabenteilung (verbindlich, damit testbar):
//  • REINE Aufbereitung (welche Records, in welcher Reihenfolge, Buchungen in Entwurfs-Form)
//    lebt in `domain/demodaten.js` und ist NODE-GETESTET.
//  • DIESES Modul macht nur die echten Schreib-Operationen über die bestehenden Stores und
//    den ECHTEN GoBD-Pfad (`saveEntwurf` → `festschreiben`). Dieser Glue-Pfad ist „statisch
//    geprüft" (kein Headless-Browser in der Build-Umgebung).
//
// Sicherheit: schreibt ausschließlich in den AKTIVEN Tresor. Im Test-Modus ist das die
// Sandbox-DB (eigener Namens-Infix, Suffix `bookledgerpro` bleibt) — echte Mandanten-DBs
// werden NICHT berührt. Der Aufrufer (ui/lock.js) ruft dies nur für einen frischen Sandbox-
// Tresor unmittelbar nach dem Onboarding auf.

import { ensureAccountsSeeded, saveEntwurf, festschreiben } from './store.js';
import { setAnfangsbestand } from './anfangsbestand-store.js';
import { addAnlage } from './anlagen-store.js';
import { demoBefuellungsplan } from './demodaten.js';

/**
 * Befüllt den aktiven Tresor mit dem Demo-Mandanten. Reihenfolge: Konten sicherstellen →
 * Anfangsbestände → Anlagegüter → Buchungen (chronologisch als Entwurf speichern und sofort
 * festschreiben → lückenlose seq + Hash-Kette wie im Echtbetrieb).
 * @param {'klein'|'gross'} groesse
 * @returns {Promise<{groesse, konten:number, buchungen:number, anlagen:number, anfangsbestaende:number}>}
 */
export async function befuelleMitDemodaten(groesse = 'klein') {
  const plan = demoBefuellungsplan(groesse);

  // 1) Kontenrahmen sicherstellen (der Demo-Mandant nutzt nur Standard-SKR03-Konten).
  await ensureAccountsSeeded();

  // 2) Anfangsbestände (z. B. Bank-/Kassenanfangsbestand).
  for (const a of plan.anfangsbestaende) {
    await setAnfangsbestand(a.konto, a.jahr, a.betragCent);
  }

  // 3) Anlagegüter (Anlagenverzeichnis/AfA).
  for (const anlage of plan.anlagen) {
    await addAnlage(anlage);
  }

  // 4) Buchungen über den ECHTEN Pfad: Entwurf → festschreiben (chronologische Reihenfolge
  //    → lückenlose seq folgt dem Datum; GoBD-Hash-Kette entsteht real).
  let gebucht = 0;
  for (const e of plan.buchungenEntwuerfe) {
    const entwurf = await saveEntwurf(e);
    await festschreiben(entwurf.id);
    gebucht++;
  }

  return {
    groesse: plan.groesse,
    konten: plan.konten.length,
    buchungen: gebucht,
    anlagen: plan.anlagen.length,
    anfangsbestaende: plan.anfangsbestaende.length,
  };
}
