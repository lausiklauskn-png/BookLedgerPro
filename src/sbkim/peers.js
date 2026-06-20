// src/sbkim/peers.js — Briefkasten/Verkehr: Live-Status der angeschlossenen SBKIM-Knoten.
// Liest NUR die öffentliche SIGNAL.json der Gegenstellen (raw/main) — keine Geheimnisse,
// kein Schreiben. Offline-first: jeder Fehlerpfad wird zu „nicht erreichbar" (kein Wurf).
//
// Die PEERS-Liste ist die „angeschlossenen Repos" — heute die zwei Handshake-Knoten.
// Sie ist bewusst hier zentral, damit ein künftiger „Verbinde dein Repo"-Assistent
// (White-Label) sie nur erweitern muss.

export const PEERS = [
  { name: 'Sage', signalUrl: 'https://raw.githubusercontent.com/lausiklauskn-png/Sage-Protokol/main/sbkim/SIGNAL.json' },
  { name: 'SB-KIMTool-Point', signalUrl: 'https://raw.githubusercontent.com/lausiklauskn-png/SB-KIMTool-Point/main/sbkim/SIGNAL.json' },
];

/**
 * Pure: macht aus einer (gefetchten) SIGNAL-Nutzlast bzw. einem Fehler eine Status-Zeile.
 * @param {{name:string}} peer
 * @param {object|null} payload  geparste SIGNAL.json ODER { error: '…' }
 */
export function classifyPeer(peer, payload) {
  if (!payload || payload.error) {
    return { name: peer.name, reachable: false, seq: null, headline: '', error: (payload && payload.error) || 'offline' };
  }
  const seq = Number.isInteger(payload.seq) ? payload.seq : null;
  return { name: peer.name, reachable: true, seq, headline: typeof payload.headline === 'string' ? payload.headline : '', error: null };
}

/** Pure: Zusammenfassung „R von T erreichbar". */
export function summarizePeers(rows) {
  const reachable = rows.filter((r) => r.reachable).length;
  return { reachable, total: rows.length };
}

/**
 * Holt den Status EINES Peers (Netz). Wirft NIE — Fehler → nicht erreichbar.
 * Nutzt AbortController-Timeout, damit ein hängender Peer den Check nicht blockiert.
 */
export async function fetchPeerStatus(peer, { timeoutMs = 6000, fetchImpl = fetch } = {}) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(peer.signalUrl, { signal: ctrl.signal, cache: 'no-store' });
    } finally { clearTimeout(timer); }
    if (!res.ok) return classifyPeer(peer, { error: 'HTTP ' + res.status });
    const json = await res.json();
    return classifyPeer(peer, json);
  } catch {
    return classifyPeer(peer, { error: 'offline' });
  }
}

/** Holt alle Peers parallel; gibt Status-Zeilen + Zusammenfassung. */
export async function checkAllPeers(opts = {}) {
  const rows = await Promise.all(PEERS.map((p) => fetchPeerStatus(p, opts)));
  return { rows, summary: summarizePeers(rows) };
}
