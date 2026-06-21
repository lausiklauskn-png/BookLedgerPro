// src/sbkim/searchCorpus.js — durchsuchbarer Korpus aus den Konten (Andock-Punkt c).
// Pro Konto: label = "<nummer> <name>", text = Bedeutungs-Text (für den Richter),
// anchorId = Kontonummer (eindeutig). passageVec wird via Embedder vorgerechnet.

import { KONTOART } from '../domain/accounts.js';
import { EMBED_DIM } from './embed.js';

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

// ---- Knoten-Korpus (Peer-Sporen) — der Ur-Gedanke: gleichwertige Knoten suchen ----
// Eleganz: signierte Sporen tragen ihren echten domainVector bereits in sich → er wird
// DIREKT als passageVec genutzt (kein Einbetten des Korpus nötig, nur die Anfrage).

export const NODE_SPORE_PATHS = [
  './sbkim/spore.json',                      // eigener Knoten (BookLedgerPro)
  './sbkim/Sage_inbox.json',                 // Peer-Spore (signatur-reine 1:1-Kopie)
  './sbkim/SB-KIMTool-Point_inbox.json',     // Peer-Spore
];

/** Bedeutungs-Text eines Knotens (rein). */
export function buildNodeText(spore) {
  const kw = Array.isArray(spore && spore.domainKeywords) ? spore.domainKeywords.join(', ') : '';
  return [spore && spore.domain, spore && spore.domainDescription, kw].filter(Boolean).join('. ');
}

/** Echter, nutzbarer domainVector (kein _demo, korrekte Dimension) — sonst null. */
function usableNodeVector(spore) {
  const v = spore && spore.domainVector;
  const demo = Array.isArray(spore && spore._demo) && spore._demo.includes('domainVector');
  return (!demo && Array.isArray(v) && v.length === EMBED_DIM) ? v : null;
}

/**
 * Sporen → Korpus-Einträge (rein). Hat eine Spore einen echten domainVector, wird er
 * direkt als passageVec genutzt; sonst `needsEmbed:true` (Text später einbetten).
 */
export function nodeCorpusEntries(spores) {
  return (Array.isArray(spores) ? spores : [])
    .filter((s) => s && s.nodeName)
    .map((s) => {
      const e = { label: s.nodeName, text: buildNodeText(s) || s.nodeName, anchorId: s.id || s.nodeName };
      const vec = usableNodeVector(s);
      if (vec) e.passageVec = vec; else e.needsEmbed = true;
      return e;
    });
}

/** Holt die Knoten-Sporen same-origin (fail-soft: fehlende/fehlerhafte werden übersprungen). */
export async function fetchNodeSpores(paths = NODE_SPORE_PATHS, fetchImpl = fetch) {
  const out = [];
  for (const p of (paths || [])) {
    try {
      const res = await fetchImpl(p, { cache: 'no-store' });
      if (res && res.ok) { const j = await res.json(); if (j && j.nodeName) out.push(j); }
    } catch { /* fail-soft: überspringen */ }
  }
  return out;
}

/** Füllt fehlende passageVec (needsEmbed) via Embedder nach (z. B. _demo-Sporen). */
export async function embedMissingVectors(entries, embedPassage) {
  const out = [];
  for (const e of (entries || [])) {
    if (e.needsEmbed && typeof embedPassage === 'function') {
      const rest = { label: e.label, text: e.text, anchorId: e.anchorId };
      out.push({ ...rest, passageVec: await embedPassage(e.text) });
    } else out.push(e);
  }
  return out;
}
