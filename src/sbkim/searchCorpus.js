// src/sbkim/searchCorpus.js — durchsuchbarer Korpus aus den Konten (Andock-Punkt c).
// Pro Konto: label = "<nummer> <name>", text = Bedeutungs-Text (für den Richter),
// anchorId = Kontonummer (eindeutig). passageVec wird via Embedder vorgerechnet.

import { KONTOART } from '../domain/accounts.js';

const ART_LABEL = {
  [KONTOART.AKTIV]: 'Aktivkonto (Bestand)',
  [KONTOART.PASSIV]: 'Passivkonto (Bestand)',
  [KONTOART.AUFWAND]: 'Aufwandskonto (Kosten/Ausgaben)',
  [KONTOART.ERTRAG]: 'Ertragskonto (Erlöse/Einnahmen)',
};

/** Konten → Korpus-Einträge OHNE Vektor (rein, testbar). */
export function accountCorpusEntries(konten) {
  return (Array.isArray(konten) ? konten : [])
    .filter((k) => k && k.nummer)
    .map((k) => ({
      label: `${k.nummer} ${k.name || ''}`.trim(),
      text: `${k.name || ''} — ${ART_LABEL[k.art] || k.art || ''} (Konto ${k.nummer})`.replace(/^\s*—\s*/, '').trim(),
      anchorId: String(k.nummer),
    }));
}

/**
 * Rechnet pro Korpus-Eintrag den passageVec vor (opt-in: braucht den geladenen Embedder).
 * @param {Array<{label,text,anchorId}>} entries
 * @param {(text:string)=>Promise<number[]>} embedPassage
 * @param {(done:number,total:number)=>void} [onProgress]
 */
export async function embedCorpus(entries, embedPassage, onProgress) {
  const out = [];
  const list = Array.isArray(entries) ? entries : [];
  for (let i = 0; i < list.length; i++) {
    const passageVec = await embedPassage(list[i].text);
    out.push({ ...list[i], passageVec });
    if (typeof onProgress === 'function') onProgress(i + 1, list.length);
  }
  return out;
}
