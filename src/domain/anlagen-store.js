// src/domain/anlagen-store.js
// Persistenz des Anlagenverzeichnisses. Anlagegüter sind Stammdaten (keine personen-
// bezogenen Daten) und werden — wie der Kontenplan — als Klartext-Records gespeichert.

import { recAll, recPut, recGet, recDel } from '../core/db.js';
import { normalizeAnlage, validateAnlage } from './anlagen.js';

export async function listAnlagen() {
  const a = await recAll('anlage');
  a.sort((x, y) => String(x.anschaffungsdatum || '').localeCompare(String(y.anschaffungsdatum || '')));
  return a;
}

export async function addAnlage(input) {
  const a = normalizeAnlage(input);
  const fehler = validateAnlage(a);
  if (fehler.length) throw new Error('Anlage ungültig: ' + fehler.join(' '));
  const id = input.id || `anlage:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rec = { id, type: 'anlage', ...a };
  await recPut(rec);
  return rec;
}

export async function updateAnlage(id, input) {
  const rec = await recGet(id);
  if (!rec) throw new Error('Anlage nicht gefunden');
  const a = normalizeAnlage(input);
  const fehler = validateAnlage(a);
  if (fehler.length) throw new Error('Anlage ungültig: ' + fehler.join(' '));
  const aktualisiert = { id, type: 'anlage', ...a };
  await recPut(aktualisiert);
  return aktualisiert;
}

export async function deleteAnlage(id) {
  await recDel(id);
}
