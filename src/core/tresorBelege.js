// src/core/tresorBelege.js — Beleg-Originale ins eigene Fach des Tresorordners (Schritt C, Klaus 2026-10-27).
// Die Datensicherung enthält die Belege schon (verschlüsselt, nur für BookLedgerPro lesbar). Hier liegen sie zusätzlich
// EINZELN unter BookLedgerPro/Belege/ — im gemeinsamen Format, mit Textauszug im Inhaltsverzeichnis, damit die anderen
// Pro-Apps sie finden und öffnen können. Doppelt wird nichts: was im Fach schon mit gleichem SHA-256 liegt, bleibt.
// Braucht den entsperrten App-Tresor (Belege sind mit seinem Schlüssel verschlüsselt). Nie gelöscht wird etwas.

import { isUnlocked } from './vault.js';
import { listBelege, getBelegBytes, getBelegText } from '../domain/documents.js';
import { BELEG_ORDNER } from '../domain/tresorordner.js';

async function sha256Hex(bytes) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {object} tresor  window.BLPNative.tresor
 * @returns {Promise<{neu:number, schon:number, fehler:number, gesperrt?:boolean}>}
 */
let _lauf = null;
export function belegeInsFach(tresor, opts = {}) {
  // Immer nur ein Lauf (automatisch nach der Sicherung und per Knopf): sonst lägen Belege doppelt im Fach.
  const vorher = _lauf || Promise.resolve();
  const jetzt = vorher.catch(() => {}).then(() => belegeInsFachEinmal(tresor, opts));
  _lauf = jetzt.finally(() => { if (_lauf === jetzt) _lauf = null; });
  return jetzt;
}

async function belegeInsFachEinmal(tresor, { onFortschritt } = {}) {
  if (!isUnlocked()) return { neu: 0, schon: 0, fehler: 0, gesperrt: true };
  const da = new Set(((await tresor.verzeichnis('bookledgerpro')).eintraege || [])
    .filter((e) => String(e.verweis || '').startsWith(BELEG_ORDNER + '/')).map((e) => e.sha256));
  const belege = await listBelege();
  let neu = 0, schon = 0, fehler = 0;
  for (let i = 0; i < belege.length; i++) {
    const b = belege[i];
    if (onFortschritt) onFortschritt(i + 1, belege.length);
    try {
      const bytes = await getBelegBytes(b.id);
      if (!bytes) { fehler++; continue; }
      const sha = await sha256Hex(bytes);
      if (da.has(sha)) { schon++; continue; }
      let text = '';
      try { text = (await getBelegText(b.id)) || ''; } catch { /* ohne Text: nur Name */ }
      const datum = Date.parse(b.createdAt || '') || Date.now();
      await tresor.ablegen('bookledgerpro', BELEG_ORDNER, new Blob([bytes], { type: b.mediaType || 'application/octet-stream' }), b.name || 'Beleg', text, datum);
      da.add(sha); neu++;
    } catch { fehler++; }
  }
  return { neu, schon, fehler };
}
