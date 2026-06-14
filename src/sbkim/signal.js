// src/sbkim/signal.js
// Briefkasten-Aushang SIGNAL.json (INTERFACES §11.6). Maschinenlesbares Signal:
// seq/ack-Herzschlag. "Das Pushen IST das Signal."

export const ENDPOINT = 'https://lausiklauskn-png.github.io/BookLedgerPro/';
export const SPORE_URL = 'https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json';

/** Baut ein SIGNAL.json-Objekt nach Pflicht-Schema (§11.6). */
export function buildSignal({ nodeId, seq = 1, headline = '', lastBuild, forNodes = ['*'], mailboxes = {}, ack = {} }) {
  return {
    node: 'BookLedgerPro',
    lastBuild: lastBuild || new Date().toISOString().slice(0, 10),
    seq,
    headline,
    sporeUrl: SPORE_URL,
    nodeId: nodeId || null,
    mailboxes,
    forNodes,
    ack,
    _doc: 'Maschinenlesbarer Briefkasten-Aushang (INTERFACES §11.6). seq steigt +1 pro gemeldetem Bau; Gegenseite liest bei Sitzungsstart, vergleicht mit ihrem ack und quittiert. Server-los: das Pushen dieser Datei IST das Signal.',
  };
}
