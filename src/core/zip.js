// src/core/zip.js
// Minimaler ZIP-Writer (Methode 0 = „store", ohne Kompression), zero-dependency.
// Für build-freie Datenpakete (z.B. GoBD/GDPdU-Datenträgerüberlassung). Reine Funktionen.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (IEEE) über ein Byte-Array. */
export function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function strBytes(s) { return new TextEncoder().encode(s); }

function concat(arrs) {
  let len = 0; for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

const u16 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
const u32 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);

/**
 * Baut ein ZIP-Archiv (store/unkomprimiert) aus [{name, data}].
 * @param {Array<{name:string, data:(string|Uint8Array)}>} files
 * @returns {Uint8Array}
 */
export function zipFiles(files) {
  const dosTime = 0, dosDate = 0x21; // 1980-01-01, reproduzierbar
  const local = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = strBytes(f.name);
    const data = typeof f.data === 'string' ? strBytes(f.data) : f.data;
    const crc = crc32(data);
    const size = data.length;
    const lfh = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0),
      nameBytes, data,
    ]);
    local.push(lfh);
    central.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset), nameBytes,
    ]));
    offset += lfh.length;
  }
  const localBytes = concat(local);
  const centralBytes = concat(central);
  const eocd = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBytes.length), u32(localBytes.length), u16(0),
  ]);
  return concat([localBytes, centralBytes, eocd]);
}
