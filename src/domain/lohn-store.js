// src/domain/lohn-store.js
// V-Lohn / Schritt L2 — verschlüsselte Store-Glue für Lohnläufe.
// Persistenz-Schicht UNTER der späteren Lohn-UI (Schritt L3), gebaut auf dem generischen
// verschlüsselten Record-Store (encstore) — exakt wie crm-store.js / angebote-store.js.
//
// DSGVO: Ein Lohnlauf enthält personenbezogene Entgeltdaten (Mitarbeiter, Brutto/Netto,
// Steuer/SV). Er wird daher verschlüsselt at rest gespeichert (encstore), gerätelokal.
//
// EHRLICHE ABGRENZUNG (wie lohnbuchung.js): BLP RECHNET die Lohnsteuer/SV NICHT — die Beträge
// stammen aus der Entgeltabrechnung des Lohnbüros/Beraters. Diese Glue speichert sie nur und
// erzeugt daraus auf Wunsch einen Buchungs-ENTWURF (Festschreiben bleibt manuell, GoBD).
//
// EHRLICHE GRENZE: IndexedDB/Krypto-Pfad → in der Build-Umgebung NICHT headless getestet
// (statisch geprüft). Die reine Logik (normalizeLohnlauf/lohnkontoAggregat/lohnBuchungEntwurf/
// lohnlaufBuchungsdatum) ist in domain/lohnbuchung.js node-getestet.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import {
  normalizeLohnlauf, lohnBuchungEntwurf, lohnlaufBuchungsdatum, validateLohnlauf,
} from './lohnbuchung.js';
import { saveEntwurf } from './store.js';

/**
 * Baut den zu persistierenden Lohnlauf-Record: stabile id/type/createdAt + die normalisierten
 * Felder aus lohnbuchung.js (abgeleitete Summen frisch gerechnet). `buchungId` verknüpft den
 * (später) erzeugten Buchungs-Entwurf. Idempotent.
 */
function baueLohnlaufRecord(l = {}) {
  const n = normalizeLohnlauf(l);
  return {
    id: l.id || neueId('lohnlauf'),
    type: 'lohnlauf',
    ...n,
    buchungId: l.buchungId ?? null,
    createdAt: l.createdAt || new Date().toISOString(),
  };
}

/** Speichert einen Lohnlauf (Neuanlage ODER Update). */
export async function saveLohnlauf(l) {
  return encPut(baueLohnlaufRecord(l));
}

export const listLohnlaeufe = () => encList('lohnlauf');
export const getLohnlauf = (id) => encGet(id);
export const deleteLohnlauf = (id) => encDel(id);

/**
 * Erzeugt aus einem gespeicherten Lohnlauf einen Buchungs-ENTWURF (Brutto-Methode) über die
 * reine Logik lohnBuchungEntwurf und verknüpft die Buchung am Lohnlauf (`buchungId`). Das
 * Buchungsdatum ist der Monatsletzte des Abrechnungsmonats (lohnlaufBuchungsdatum).
 * Festschreiben bleibt MANUELL (GoBD) — hier entsteht nur der Entwurf.
 * @param {string} id Lohnlauf-id
 * @returns {Promise<{buchung:object, entwurf:object, lohnlauf:object}>}
 * @throws wenn der Lohnlauf fehlt oder unvollständig ist (validateLohnlauf)
 */
export async function bucheLohnlauf(id) {
  const l = await getLohnlauf(id);
  if (!l) throw new Error('Lohnlauf nicht gefunden');
  const pruefung = validateLohnlauf(l);
  if (!pruefung.ok) throw new Error(pruefung.errors.join(' '));

  const datum = lohnlaufBuchungsdatum(l.monat);
  const entwurf = lohnBuchungEntwurf(l, { monat: l.monat, name: l.name, auszahlung: l.auszahlung, datum });
  if (!entwurf) throw new Error('Lohnlauf unvollständig — keine Buchung möglich.');

  const buchung = await saveEntwurf({
    datum: entwurf.datum,
    beschreibung: entwurf.beschreibung,
    zeilen: entwurf.zeilen,
  });
  const lohnlauf = await saveLohnlauf({ ...l, buchungId: buchung.id });
  return { buchung, entwurf, lohnlauf };
}
