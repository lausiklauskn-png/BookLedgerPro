// src/domain/payables-store.js
// Persistenz der Eingangsrechnungen (Kreditorenrechnungen). Verschlüsselt at rest
// (AES-GCM via encstore) — enthält Lieferantendaten, daher wie personenbezogene Records.
// Die Ableitung offener Verbindlichkeiten und der Buchungszeilen liegt in payables.js
// (rein, node-getestet); hier nur Laden/Speichern + Zahlungen + Verdrahtung.
//
// ⚠️ Browser-Pfad: nutzt Vault/IndexedDB → NICHT im Node-Test abgedeckt.

import { encPut, encGet, encList, encDel, neueId } from './encstore.js';
import {
  validateEingangsrechnung, rechnungBrutto, offeneVerbindlichkeiten,
  rechnungStatus, eingangsrechnungZeilen, ER_STATUS,
} from './payables.js';

const TYPE = 'eingangsrechnung';

/** Speichert/aktualisiert eine Eingangsrechnung (validiert, vergibt id + Brutto-Cache). */
export async function saveEingangsrechnung(rechnung) {
  const fehler = validateEingangsrechnung(rechnung);
  if (fehler.length) throw new Error('Eingangsrechnung ungültig: ' + fehler.join(' '));
  const r = {
    id: rechnung.id || neueId('er'),
    type: TYPE,
    kreditor: String(rechnung.kreditor).trim(),
    rechnungsnr: rechnung.rechnungsnr || '',
    datum: rechnung.datum,
    faelligAm: rechnung.faelligAm || '',
    positionen: rechnung.positionen || [],
    bruttoCent: rechnungBrutto(rechnung),
    zahlungen: rechnung.zahlungen || [],
    buchungRef: rechnung.buchungRef || null,
    storniert: !!rechnung.storniert,
    notiz: rechnung.notiz || '',
    createdAt: rechnung.createdAt || new Date().toISOString(),
  };
  await encPut(r);
  return r;
}

export async function getEingangsrechnung(id) {
  return encGet(id);
}

export async function listEingangsrechnungen() {
  const list = await encList(TYPE);
  list.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  return list;
}

export async function deleteEingangsrechnung(id) {
  await encDel(id);
}

/** Erfasst eine geleistete Zahlung gegen eine Eingangsrechnung. */
export async function zahlungHinzufuegen(id, zahlung) {
  const r = await getEingangsrechnung(id);
  if (!r) throw new Error('Eingangsrechnung nicht gefunden');
  const betrag = Math.round(Number(zahlung.betragCent) || 0);
  if (!(betrag > 0)) throw new Error('Zahlbetrag muss positiv sein');
  r.zahlungen = [...(r.zahlungen || []), {
    datum: zahlung.datum || new Date().toISOString().slice(0, 10),
    betragCent: betrag,
    ref: zahlung.ref || null,
  }];
  await encPut(r);
  return r;
}

/** Markiert eine Eingangsrechnung als storniert (fällt aus den offenen Posten heraus). */
export async function stornoEingangsrechnung(id) {
  const r = await getEingangsrechnung(id);
  if (!r) throw new Error('Eingangsrechnung nicht gefunden');
  r.storniert = true;
  await encPut(r);
  return r;
}

/** Lädt alle Rechnungen und leitet die offenen Verbindlichkeits-Posten ab (Zahlungsabgleich). */
export async function offeneVerbindlichkeitenPosten(opts = {}) {
  return offeneVerbindlichkeiten(await listEingangsrechnungen(), opts);
}

/** Status einer einzelnen Rechnung. */
export async function statusVon(id) {
  const r = await getEingangsrechnung(id);
  return r ? rechnungStatus(r) : null;
}

export { eingangsrechnungZeilen, ER_STATUS };
