// src/ui/tresorFund.js — Funde aus den Fächern der anderen Pro-Apps (Klaus 2026-11-09: „in BookLedgerPro nach Rechnungen und
// Quittungen suchen und mir wird gesagt, in welchem der Programme ich etwas finde … die Daten aus der Familienakte erhalten“).
//
// 1) Bedeutungssuche über die Inhaltsverzeichnisse aller Fächer (Name + Kurzfassung je Eintrag, e5-small wie die Belegsuche).
//    Nur mit eingeschalteter Bedeutungssuche (settings.bedeutungssuche === 'an'); Vektoren bleiben im Speicher dieser Sitzung.
// 2) Öffnen NUR ZUM LESEN: die Datei wird über die Tresor-Brücke gelesen (BLPNative.tresor.lesen) und in der Beleg-Vorschau
//    gezeigt. Nichts wird übernommen, verändert oder markiert; „Übernehmen“ bleibt der ausdrückliche Weg im Tresorordner.
// Ändern von Daten der anderen App (z. B. Familienakte) geht hier bewusst NICHT — das kommt mit der Geldkarte (Bauplan Schritt 2).

import { el } from './dom.js';
import { t } from './i18n.js';
import { getSettings, navigate } from '../state.js';
import { belegVorschau } from './belegVorschau.js';
import { FAECHER, bedeutungsText, eintraegeSuchen } from '../domain/tresorordner.js';

const _vektoren = new Map();   // fach|id|datum → Vektor (nur diese Sitzung)
const NAEHE_MIN = 0.8, HOECHSTENS = 12;

function cosinus(a, b) { let s = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return na && nb ? s / Math.sqrt(na * nb) : 0; }
export function appVonFach(fach) { const f = FAECHER.find((x) => x.fach === fach); return f ? (f.app || f.ordner) : fach; }

/**
 * Bedeutungs-Treffer im Tresor, ohne die Einträge, die schon die Wortsuche findet (keine Doppelzeilen).
 * @returns {Promise<object[]>} Zeilen im Format des gemeinsamen Kastens „Überall suchen“ (herkunft 'app', quelle 'tresor')
 */
export async function tresorBedeutung(bruecke, frage, { ohne = ['bookledgerpro'], embedder = null } = {}) {
  if (!bruecke || getSettings().bedeutungssuche !== 'an' || !String(frage || '').trim()) return [];
  let z = null; try { z = await bruecke.zustand(); } catch { /* zu */ }
  if (!z || !z.offen) return [];
  const faecher = [];
  for (const f of FAECHER) {
    if (ohne.includes(f.fach)) continue;
    try { const r = await bruecke.verzeichnis(f.fach); faecher.push({ fach: f.fach, eintraege: (r && r.eintraege) || [] }); } catch { /* Fach fehlt */ }
  }
  const wort = new Set(eintraegeSuchen(faecher, frage).map((x) => x.fach + '|' + x.eintrag.id));
  let emb = embedder || (typeof window !== 'undefined' && window.__blpEmbedderStub) || null;
  if (!emb) { const m = await import('../sbkim/embed.js'); emb = await m.loadEmbedder({}); }
  const q = await emb.embedQuery(frage);
  const aus = [];
  for (const f of faecher) for (const e of f.eintraege) {
    if (!e || !e.id || wort.has(f.fach + '|' + e.id)) continue;
    const key = f.fach + '|' + e.id + '|' + (e.datum || '');
    if (!_vektoren.has(key)) _vektoren.set(key, await emb.embedPassage(bedeutungsText(e)));
    const naehe = cosinus(q, _vektoren.get(key));
    if (naehe >= NAEHE_MIN) aus.push({ fach: f.fach, eintrag: e, naehe });
  }
  aus.sort((a, b) => b.naehe - a.naehe);
  return aus.slice(0, HOECHSTENS).map((x) => ({
    herkunft: 'app', quelle: 'tresor', gruppe: t('ue.tresorBedeutung'), typ: x.fach, id: String(x.eintrag.id),
    name: String(x.eintrag.name || x.eintrag.id).slice(0, 200),
    stelle: t('ue.inApp').replace('{app}', appVonFach(x.fach)) + (x.eintrag.auszug ? ' · ' + String(x.eintrag.auszug).slice(0, 140) : ''),
    oeffenbar: x.eintrag.verschluesselung === 'fpt1', daten: x.eintrag, naehe: Math.round(x.naehe * 100) / 100,
  }));
}

/** Öffnet einen Tresor-Fund nur zum Lesen (PDF/Bild in der Vorschau, sonst Text). */
export function tresorFundZeigen(bruecke, fach, eintrag) {
  let datei = null;
  const holen = async () => { if (!datei) datei = await bruecke.lesen(fach, eintrag.id); return datei; };
  return belegVorschau({ id: 'tresor:' + fach + ':' + eintrag.id, name: eintrag.name || eintrag.id, mediaType: eintrag.art || '', size: eintrag.groesse || 0,
    createdAt: eintrag.datum ? new Date(Number(eintrag.datum)).toISOString() : '' }, {
    angaben: [t('ue.inApp').replace('{app}', appVonFach(fach)) + ' · ' + t('ue.nurLesen')],
    quelle: {
      bytes: async () => new Uint8Array(await (await holen()).arrayBuffer()),
      text: async () => { const f = await holen(); return /^(text\/|message\/)/.test(f.type || eintrag.art || '') ? (await f.text()).slice(0, 20000) : String(eintrag.auszug || ''); },
      knoepfe: [el('button', { class: 'btn btn-sm', type: 'button', 'data-tresor-fund-uebernehmen': '', text: t('ue.zumTresorordner'),
        onClick: () => { document.querySelector('[data-beleg-vorschau]')?.closest('.modal-overlay')?.remove(); navigate('tresorordner'); } })],
    },
  });
}
