// src/core/qr.js
// ──────────────────────────────────────────────────────────────────────────
// Vendored, reiner JS-QR-Encoder (build-frei: keine npm/CDN-Runtime, native
// ES-Module). Erzeugt QR-Codes **lokal, ohne Netz** — für P8 „QR-Einzelteilen".
// Wir benutzen bewusst KEINEN Online-QR-Dienst, weil der die (ggf. sensiblen)
// Daten erhalten würde; der ganze Sinn ist offline/datensparsam (Regel #1 + #4).
//
// Algorithmus portiert aus der „QR Code generator library" von Project Nayuki
// (https://www.nayuki.io/page/qr-code-generator-library), Lizenz **MIT** —
// hier als eigenständiges ES-Modul neu geschrieben (Byte-Modus, Versionen 1–40,
// Fehlerkorrektur L/M/Q/H, automatische Maskenwahl). Attribution + Lizenz:
//
//   Copyright (c) Project Nayuki. (MIT License)
//   Permission is hereby granted, free of charge, to any person obtaining a copy
//   of this software and associated documentation files (the "Software"), to deal
//   in the Software without restriction, including without limitation the rights
//   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//   copies of the Software, and to permit persons to whom the Software is
//   furnished to do so, subject to the above copyright notice and this permission
//   notice being included. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//   ANY KIND.
//
// Reine Logik (Matrix-Erzeugung) ist node-getestet; SVG-Bau ist reine
// String-Erzeugung (kein DOM) und ebenfalls node-prüfbar.
// ──────────────────────────────────────────────────────────────────────────

// Fehlerkorrektur-Stufen: ordinal = Tabellen-Index, formatBits = QR-Formatfeld.
export const ECL = Object.freeze({
  L: { name: 'L', ordinal: 0, formatBits: 1 },
  M: { name: 'M', ordinal: 1, formatBits: 0 },
  Q: { name: 'Q', ordinal: 2, formatBits: 3 },
  H: { name: 'H', ordinal: 3, formatBits: 2 },
});

const MIN_VERSION = 1;
const MAX_VERSION = 40;

// Strafpunkte für die Maskenbewertung (QR-Spezifikation).
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

// Anzahl der Fehlerkorrektur-Codewörter je Block, indiziert [ecl.ordinal][version]
// (Index 0 = ungültiger Platzhalter). Standardtabelle ISO/IEC 18004.
const ECC_CODEWORDS_PER_BLOCK = [
  // 1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // L
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // M
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Q
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // H
];

// Anzahl Fehlerkorrektur-Blöcke, indiziert [ecl.ordinal][version]. Standardtabelle.
const NUM_ERROR_CORRECTION_BLOCKS = [
  // 1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // L
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // M
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Q
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // H
];

function getBit(x, i) {
  return ((x >>> i) & 1) !== 0;
}

// Anzahl roher Datenmodule (Bits) je Version — geometrisch berechnet, keine Tabelle.
export function getNumRawDataModules(ver) {
  if (ver < MIN_VERSION || ver > MAX_VERSION) throw new RangeError('version');
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

// Anzahl der Nutzdaten-Codewörter (8-Bit) für (Version, EC-Stufe).
export function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8)
    - ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
}

// GF(256)-Multiplikation (Primpolynom 0x11D), tabellenfrei.
export function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xFF;
}

// Reed-Solomon: Teiler-Polynom vom Grad `degree`.
export function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255) throw new RangeError('degree');
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor); });
  }
  return result;
}

// 15-Bit-Formatinformation (EC-Stufe + Maske) inkl. BCH(15,5) + Maskenmuster.
export function formatInfoBits(ecl, mask) {
  const data = (ecl.formatBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

// 18-Bit-Versionsinformation (ab Version 7) inkl. BCH(18,6).
export function versionInfoBits(ver) {
  let rem = ver;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  return (ver << 12) | rem;
}

// Positionen der Ausrichtungsmuster für eine Version (leer bei Version 1).
export function getAlignmentPatternPositions(ver) {
  if (ver === 1) return [];
  const size = ver * 4 + 17;
  const numAlign = Math.floor(ver / 7) + 2;
  const step = (ver === 32) ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ---- UTF-8 ------------------------------------------------------------------
const _encoder = (typeof TextEncoder !== 'undefined') ? new TextEncoder() : null;
function utf8Bytes(text) {
  if (_encoder) return Array.from(_encoder.encode(text));
  // Fallback (sollte nirgends greifen — Node>=18/Browser haben TextEncoder).
  return Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
}

// ---- Byte-Modus: Bits → Codewörter -----------------------------------------
function chooseVersion(byteLen, ecl) {
  for (let ver = MIN_VERSION; ver <= MAX_VERSION; ver++) {
    const capacityBits = getNumDataCodewords(ver, ecl) * 8;
    const cci = ver <= 9 ? 8 : 16;
    const needed = 4 + cci + 8 * byteLen;
    if (needed <= capacityBits) return ver;
  }
  return -1;
}

function encodeDataCodewords(bytes, ver, ecl) {
  const bb = [];
  const appendBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  };
  const cci = ver <= 9 ? 8 : 16;
  appendBits(0x4, 4);          // Byte-Modus-Indikator
  appendBits(bytes.length, cci);
  for (const b of bytes) appendBits(b, 8);

  const capacityBits = getNumDataCodewords(ver, ecl) * 8;
  appendBits(0, Math.min(4, capacityBits - bb.length));   // Terminator
  appendBits(0, (8 - bb.length % 8) % 8);                 // auf Byte-Grenze
  for (let pad = 0xEC; bb.length < capacityBits; pad ^= 0xEC ^ 0x11) appendBits(pad, 8);

  const codewords = new Uint8Array(bb.length >>> 3);
  bb.forEach((bit, i) => { if (bit) codewords[i >>> 3] |= 1 << (7 - (i & 7)); });
  return codewords;
}

// Fehlerkorrektur anhängen + Blöcke verschachteln (Standard-Interleaving).
function addEccAndInterleave(data, ver, ecl) {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
  const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
  const numShortBlocks = numBlocks - rawCodewords % numBlocks;
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks = [];
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const dat = Array.from(data.slice(k, k + datLen));
    k += datLen;
    const ecc = reedSolomonComputeRemainder(dat, rsDiv);
    if (i < numShortBlocks) dat.push(0);   // Padding-Byte zum Längenausgleich
    blocks.push(dat.concat(ecc));
  }

  const result = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      // Padding-Byte in kurzen Blöcken überspringen.
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

// ---- Matrix -----------------------------------------------------------------
function newGrid(size, fill) {
  const g = new Array(size);
  for (let y = 0; y < size; y++) g[y] = new Array(size).fill(fill);
  return g;
}

function buildMatrix(allCodewords, ver, ecl) {
  const size = ver * 4 + 17;
  const modules = newGrid(size, false);
  const isFunction = newGrid(size, false);

  const setFn = (x, y, dark) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };
  const drawFinder = (x, y) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(x + dx, y + dy, dist !== 2 && dist !== 4);
      }
    }
  };
  const drawAlign = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  // Format-Bits (Maske wird später final gesetzt) + Versions-Bits zeichnen.
  const drawFormat = (mask) => {
    const bits = formatInfoBits(ecl, mask);
    for (let i = 0; i <= 5; i++) setFn(8, i, getBit(bits, i));
    setFn(8, 7, getBit(bits, 6));
    setFn(8, 8, getBit(bits, 7));
    setFn(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, getBit(bits, i));
    setFn(8, size - 8, true);   // immer dunkles Modul
  };
  const drawVersion = () => {
    if (ver < 7) return;
    const bits = versionInfoBits(ver);
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, color);
      setFn(b, a, color);
    }
  };

  // Timing-Muster.
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  // Finder + Separatoren.
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);
  // Ausrichtungsmuster (ohne die drei Finder-Ecken).
  const alignPos = getAlignmentPatternPositions(ver);
  const n = alignPos.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      drawAlign(alignPos[i], alignPos[j]);
    }
  }
  drawFormat(0);
  drawVersion();

  // Datenbits im Zickzack platzieren.
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bitIdx < totalBits) {
          modules[y][x] = getBit(allCodewords[bitIdx >>> 3], 7 - (bitIdx & 7));
          bitIdx++;
        }
      }
    }
  }

  // Maske anwenden (Datenmodule invertieren).
  const applyMask = (mask) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFunction[y][x]) continue;
        let invert = false;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
          default: break;
        }
        if (invert) modules[y][x] = !modules[y][x];
      }
    }
  };

  // Strafpunkte (Maskenbewertung).
  const addHistory = (runLen, hist) => {
    if (hist[0] === 0) runLen += size;   // heller Rand vor dem ersten Lauf
    hist.pop();
    hist.unshift(runLen);
  };
  const countPatterns = (hist) => {
    const k = hist[1];
    if (k <= 0) return 0;
    const core = hist[2] === k && hist[3] === k * 3 && hist[4] === k && hist[5] === k;
    return (core && hist[0] >= k * 4 && hist[6] >= k ? 1 : 0)
      + (core && hist[6] >= k * 4 && hist[0] >= k ? 1 : 0);
  };
  const terminateAndCount = (runColor, runLen, hist) => {
    if (runColor) { addHistory(runLen, hist); runLen = 0; }
    runLen += size;   // heller Rand am Ende
    addHistory(runLen, hist);
    return countPatterns(hist);
  };
  const penalty = () => {
    let result = 0;
    // Zeilen.
    for (let y = 0; y < size; y++) {
      let runColor = false; let runLen = 0; const hist = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < size; x++) {
        if (modules[y][x] === runColor) {
          runLen++;
          if (runLen === 5) result += PENALTY_N1; else if (runLen > 5) result++;
        } else {
          addHistory(runLen, hist);
          if (!runColor) result += countPatterns(hist) * PENALTY_N3;
          runColor = modules[y][x]; runLen = 1;
        }
      }
      result += terminateAndCount(runColor, runLen, hist) * PENALTY_N3;
    }
    // Spalten.
    for (let x = 0; x < size; x++) {
      let runColor = false; let runLen = 0; const hist = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < size; y++) {
        if (modules[y][x] === runColor) {
          runLen++;
          if (runLen === 5) result += PENALTY_N1; else if (runLen > 5) result++;
        } else {
          addHistory(runLen, hist);
          if (!runColor) result += countPatterns(hist) * PENALTY_N3;
          runColor = modules[y][x]; runLen = 1;
        }
      }
      result += terminateAndCount(runColor, runLen, hist) * PENALTY_N3;
    }
    // 2×2-Blöcke.
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    // Dunkelanteil vs. 50 %.
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
    const total = size * size;
    const kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += kk * PENALTY_N4;
    return result;
  };

  // Beste Maske wählen.
  let bestMask = 0; let minPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m); drawFormat(m);
    const p = penalty();
    if (p < minPenalty) { minPenalty = p; bestMask = m; }
    applyMask(m);   // rückgängig (XOR ist selbstinvers)
  }
  applyMask(bestMask); drawFormat(bestMask);

  return { version: ver, ecl: ecl.name, mask: bestMask, size, modules };
}

/**
 * Erzeugt eine QR-Matrix aus Text (Byte-Modus, UTF-8). LOKAL, kein Netz.
 * @param {string} text
 * @param {{ecl?: 'L'|'M'|'Q'|'H'}} [opts]
 * @returns {{version:number, ecl:string, mask:number, size:number, modules:boolean[][]}}
 * @throws {Error} Code `QR_ZU_LANG`, wenn der Text auch in Version 40 nicht passt.
 */
export function qrMatrix(text, opts = {}) {
  const ecl = ECL[String(opts.ecl || 'M').toUpperCase()] || ECL.M;
  const bytes = utf8Bytes(text == null ? '' : String(text));
  const ver = chooseVersion(bytes.length, ecl);
  if (ver < 0) {
    const err = new Error('QR_ZU_LANG');
    err.code = 'QR_ZU_LANG';
    throw err;
  }
  const dataCodewords = encodeDataCodewords(bytes, ver, ecl);
  const allCodewords = addEccAndInterleave(dataCodewords, ver, ecl);
  return buildMatrix(allCodewords, ver, ecl);
}

/**
 * Maximale Byte-Anzahl (UTF-8), die bei gegebener EC-Stufe in einen QR passt.
 * @param {'L'|'M'|'Q'|'H'} [eclName]
 * @returns {number}
 */
export function qrMaxBytes(eclName = 'M') {
  const ecl = ECL[String(eclName).toUpperCase()] || ECL.M;
  const capacityBits = getNumDataCodewords(MAX_VERSION, ecl) * 8;
  return Math.floor((capacityBits - 4 - 16) / 8);
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Rendert eine QR-Matrix (oder direkt Text) als SVG-String — reine Erzeugung,
 * kein DOM, kein Netz. Die Nutzdaten landen im QR, nicht im SVG-Markup.
 * @param {string|{size:number,modules:boolean[][]}} input  Text oder Matrix.
 * @param {{ecl?:string, scale?:number, margin?:number, dark?:string, light?:string}} [opts]
 * @returns {string} SVG.
 */
export function qrSvg(input, opts = {}) {
  const qr = (typeof input === 'string') ? qrMatrix(input, opts) : input;
  const scale = opts.scale || 4;
  const margin = (opts.margin == null) ? 4 : opts.margin;
  const dark = escapeAttr(opts.dark || '#000000');
  const light = escapeAttr(opts.light || '#ffffff');
  const dim = qr.size + margin * 2;
  const px = dim * scale;

  const parts = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) parts.push(`M${x + margin} ${y + margin}h1v1h-1z`);
    }
  }
  const path = parts.join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${px}" height="${px}" `
    + `viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="QR">`
    + `<rect width="100%" height="100%" fill="${light}"/>`
    + `<path d="${path}" fill="${dark}"/></svg>`;
}

/**
 * Bequemes Daten-URI für ein <img src>.
 * @param {string} text
 * @param {object} [opts]
 * @returns {string}
 */
export function qrSvgDataUri(text, opts = {}) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg(text, opts));
}
