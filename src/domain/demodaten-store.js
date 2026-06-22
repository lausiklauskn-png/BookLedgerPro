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

import { ensureAccountsSeeded, saveEntwurf, festschreiben, storno } from './store.js';
import { setAnfangsbestand } from './anfangsbestand-store.js';
import { addAnlage } from './anlagen-store.js';
import { saveKunde, saveAuftrag, auftragZahlungHinzufuegen, saveMitarbeiter, saveZeit, ensureKostenstellenSeeded } from './crm-store.js';
import { saveEingangsrechnung, zahlungHinzufuegen, stornoEingangsrechnung } from './payables-store.js';
import { demoBefuellungsplan } from './demodaten.js';

/**
 * Befüllt den aktiven Tresor mit dem Demo-Mandanten. Reihenfolge: Konten sicherstellen →
 * Anfangsbestände → Anlagegüter → Buchungen (chronologisch als Entwurf speichern und sofort
 * festschreiben → lückenlose seq + Hash-Kette wie im Echtbetrieb). Beim Szenario „quartal"
 * zusätzlich: eine versehentliche Doppelbuchung STORNIEREN (GoBD) und die Stammdaten
 * (Kunden, Aufträge, Mitarbeiter+Zeiten, Eingangsrechnungen) über die echten CRM-/Payables-
 * APIs schreiben — damit auch diese Ansichten realistisch gefüllt sind.
 * @param {'klein'|'gross'|'quartal'} groesse
 * @returns {Promise<{groesse, konten, buchungen, storniert, anlagen, anfangsbestaende, kunden, auftraege, mitarbeiter, eingangsrechnungen}>}
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
  //    → lückenlose seq folgt dem Datum; GoBD-Hash-Kette entsteht real). `_key` merkt die
  //    festgeschriebene ID (für Auftrags-Verknüpfung); `_storno` storniert sie sofort wieder.
  let gebucht = 0, storniert = 0;
  const buchungIds = {};
  for (const e of plan.buchungenEntwuerfe) {
    const entwurf = await saveEntwurf(e);
    const fest = await festschreiben(entwurf.id);
    if (e._key) buchungIds[e._key] = fest.id;
    gebucht++;
    if (e._storno) { await storno(fest.id); storniert++; }
  }

  // 5) Stammdaten (nur „quartal" trägt welche). Eigener try/catch: ein Stammdaten-Hänger
  //    darf das bereits korrekt geschriebene Journal NICHT verwerfen (fail-soft).
  let kunden = 0, auftraege = 0, mitarbeiter = 0, eingangsrechnungen = 0;
  try {
    if ((plan.kunden || []).length || (plan.eingangsrechnungen || []).length || (plan.auftraege || []).length) {
      await ensureKostenstellenSeeded();
    }
    const kundeIds = {};
    for (const k of plan.kunden || []) {
      const { _key, ...rest } = k;
      const saved = await saveKunde(rest);
      if (_key) kundeIds[_key] = saved.id;
      kunden++;
    }
    for (const a of plan.auftraege || []) {
      const { _kundeKey, _buchungKey, _zahlungen, ...rest } = a;
      const auftrag = await saveAuftrag({
        ...rest,
        kundeId: kundeIds[_kundeKey] || null,
        rechnungBuchungId: _buchungKey ? (buchungIds[_buchungKey] || null) : null,
      });
      for (const z of _zahlungen || []) await auftragZahlungHinzufuegen(auftrag.id, z);
      auftraege++;
    }
    const maIds = {};
    for (const m of plan.mitarbeiter || []) {
      const { _key, ...rest } = m;
      const saved = await saveMitarbeiter(rest);
      if (_key) maIds[_key] = saved.id;
      mitarbeiter++;
    }
    for (const z of plan.zeiten || []) {
      const { _maKey, ...rest } = z;
      await saveZeit({ ...rest, mitarbeiterId: maIds[_maKey] || null });
    }
    for (const er of plan.eingangsrechnungen || []) {
      const { _key, _zahlungen, _storniert, ...rest } = er;
      const saved = await saveEingangsrechnung(rest);
      for (const z of _zahlungen || []) await zahlungHinzufuegen(saved.id, z);
      if (_storniert) await stornoEingangsrechnung(saved.id);
      eingangsrechnungen++;
    }
  } catch (ex) {
    console.warn('Demo-Stammdaten teilweise fehlgeschlagen:', ex);
  }

  return {
    groesse: plan.groesse,
    konten: plan.konten.length,
    buchungen: gebucht,
    storniert,
    anlagen: plan.anlagen.length,
    anfangsbestaende: plan.anfangsbestaende.length,
    kunden,
    auftraege,
    mitarbeiter,
    eingangsrechnungen,
  };
}
