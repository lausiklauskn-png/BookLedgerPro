// src/domain/anfangsbestand-store.js
// Persistenz der Eröffnungs-/Anfangsbestände je Geldkonto und Wirtschaftsjahr.
// Stammdaten (keine personenbezogenen Daten) → Klartext-Records wie der Kontenplan.

import { recAll, recPut, recGet, recDel } from '../core/db.js';

function id(konto, jahr) { return `anfangsbestand:${konto}:${jahr}`; }

export async function getAnfangsbestand(konto, jahr) {
  const rec = await recGet(id(konto, jahr));
  return rec ? rec.betragCent : 0;
}

export async function setAnfangsbestand(konto, jahr, betragCent) {
  const b = Number(betragCent) || 0;
  if (b <= 0) { await recDel(id(konto, jahr)); return; }
  await recPut({ id: id(konto, jahr), type: 'anfangsbestand', konto: String(konto), jahr: Number(jahr), betragCent: b });
}

export async function listAnfangsbestaende() {
  return recAll('anfangsbestand');
}
