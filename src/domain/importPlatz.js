// src/domain/importPlatz.js — passt der Import in den Speicher? (Klaus 2026-10-14: „Ja, vorher prüfen")
//
// Vor dem Einlesen steht da: „X Dateien, Y MB, frei Z". Passt es nicht, wird gefragt. Eine
// einzelne Datei über 50 MB wird beim Namen genannt (sie kann den Browser bremsen).
// Rein, ohne DOM — in Node geprüft.
//
// Der Bedarf ist eine SCHÄTZUNG, keine Messung:
//   · PDF                 → so groß wie die Datei (verschlüsselt kommen 28 Byte dazu)
//   · Foto                → Original (bleibt verschlüsselt liegen) + Scan-PDF. Ein A4-Scan mit
//                           300 dpi und JPEG 92 % liegt meist bei 1–3 MB; gerechnet wird mit
//                           SCAN_SCHAETZUNG, höchstens aber dem Doppelten des Fotos + 1 MB.
//   · dazu 10 % Luft für Prüfbericht, Vorschau und die Datenbank selbst.
// Der freie Platz kommt aus navigator.storage.estimate() — das ist die Auskunft des BROWSERS,
// und sie ist auf manchen Geräten grob. Fehlt sie, heißt es „unbekannt", nie „passt".

export const GROSS_BYTES = 50 * 1024 * 1024;
export const SCAN_SCHAETZUNG = 3 * 1024 * 1024;
export const LUFT = 1.1;

function istBild(typ) { return /^image\//.test(String(typ || '')); }

/** Geschätzter Speicherbedarf einer Datei in Byte. */
export function bedarfVon(size, typ) {
  const n = Math.max(0, Number(size) || 0);
  if (istBild(typ)) return n + Math.min(SCAN_SCHAETZUNG, 2 * n + 1024 * 1024);
  return n;
}

/**
 * @param {Array<{file:{size:number,name?:string}, pfad?:string, typ?:string}>} nehmen  aus belegDateienWaehlen
 * @param {{quota?:number, usage?:number}|null} schaetzung  navigator.storage.estimate()
 * @returns {{anzahl:number, bytes:number, bedarf:number, frei:number|null, passt:boolean|null, gross:Array<{pfad:string,size:number}>}}
 */
export function platzPlan(nehmen, schaetzung) {
  const liste = Array.isArray(nehmen) ? nehmen : [];
  let bytes = 0, bedarf = 0;
  const gross = [];
  for (const n of liste) {
    const size = Number(n && n.file && n.file.size) || 0;
    const typ = (n && (n.typ || (n.file && n.file.type))) || '';
    bytes += size;
    bedarf += bedarfVon(size, typ);
    if (size > GROSS_BYTES) gross.push({ pfad: (n && n.pfad) || (n && n.file && n.file.name) || '?', size });
  }
  bedarf = Math.ceil(bedarf * LUFT);
  const q = schaetzung && Number(schaetzung.quota), u = schaetzung && Number(schaetzung.usage);
  const frei = Number.isFinite(q) && q > 0 && Number.isFinite(u) ? Math.max(0, q - u) : null;
  return { anzahl: liste.length, bytes, bedarf, frei, passt: frei == null ? null : bedarf <= frei, gross };
}

/** „12,3 MB" — für die Zeile vor dem Import. */
export function mb(n) {
  const v = (Number(n) || 0) / (1024 * 1024);
  return (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace('.', ',')) + ' MB';
}
