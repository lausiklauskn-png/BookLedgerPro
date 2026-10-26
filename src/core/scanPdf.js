// src/core/scanPdf.js — ein Foto wird beim Einlesen zum Scan-PDF (Klaus 2026-10-14:
// „Ja, Scan + Original behalten" · „wie bei Workflow PDF").
//
// Der Weg ist der stille Weg der WorkFlohs (assets/wfpdf/werkzeug.js): dieselbe Entscheidung wie
// im Scanner von Workflow PDF (WFP.Scanner.erkennen: Scanic-Modell, Scanic-Kanten, blatt.js;
// „sicher" nur, wenn zwei übereinstimmen — gemessen an 17 Testfotos: 0 sicher und falsch).
// Die Dateien liegen seit dem 2026-10-26 byte-1:1 unter assets/wfpdf/ (tools/wfpdf-nachziehen.mjs, Pins in
// assets/wfpdf/HERKUNFT.json) — Klaus: „der Scannerkern wird mit eingebaut“; vorher kamen sie von /Workflow-PDF/assets/.
// Das Scanic-Modell liegt unter vendor/scanic/, die Texterkennung unter vendor/tesseract/ (byte-gleich mit Workflow PDF).
//   · sicher erkannt   → das Blatt wird gerade gezogen, Seitengröße „Automatisch" (DIN-Form → A4)
//   · nicht sicher     → NICHTS wird abgeschnitten: das ganze Foto liegt mittig auf A4
//   · lädt nicht       → ebenso das ganze Foto, und das wird gesagt
// Qualität (Klaus 2026-10-14: „Die Qualität muss 100 % stimmen"): 300 dpi, JPEG 92 %. Gemessen
// in Sage mit Tesseract an 20 kleinen, blassen Zeilen: 300 dpi · 92 % → 0 falsch gelesen.
// ⚠ Das ORIGINALFOTO bleibt unverändert und verschlüsselt am Beleg (GoBD) — siehe documents.js.

export const SCAN_DPI = 300;
export const SCAN_JPEG_GUETE = 0.92;

// Qualität je Beleg wählbar (Klaus 2026-10-26: „je nach Größe oder je nach Qualität der Vorlage“).
// Vorgabe bleibt `hoch` = der gemessene feste Weg (300 dpi · 92 %, Klaus 2026-10-14). `auto` rechnet aus der
// Vorlage: so viele dpi, wie das Foto auf A4 hergibt — nie hochgerechnet, nie unter 150, nie über 300.
export const SCAN_STUFE_VORGABE = 'hoch';
export const SCAN_STUFEN = Object.freeze({
  auto:   { dpi: 0,   q: 0.92 },
  hoch:   { dpi: 300, q: 0.92 },
  normal: { dpi: 200, q: 0.88 },
  klein:  { dpi: 150, q: 0.80 },
});
export const SCAN_DPI_MIN = 150;
/** Welche dpi und JPEG-Güte ein Scan bekommt. Rein, ohne DOM. langeKantePx = längste Seite des Fotos. */
export function scanStufe(qualitaet, langeKantePx) {
  const stufe = SCAN_STUFEN[qualitaet] ? qualitaet : SCAN_STUFE_VORGABE;
  const st = SCAN_STUFEN[stufe];
  if (st.dpi) return { dpi: st.dpi, q: st.q, stufe, auto: false };
  // auto: A4 lange Kante = 11,69 Zoll; auf 10 gerundet, zwischen 150 und 300
  const roh = Math.round((Number(langeKantePx) || 0) / (A4_PT[1] / 72) / 10) * 10;
  const dpi = Math.max(SCAN_DPI_MIN, Math.min(SCAN_DPI, roh || SCAN_DPI));
  return { dpi, q: st.q, stufe: 'auto', auto: true };
}
export const SCAN_ERKENNUNG_KANTE = 2400;   // Erkennung auf verkleinertem Bild (wie die WorkFlohs)
export const SCAN_QUELLE_KANTE = 4000;      // Quelle fürs Entzerren: reicht für A4 mit 300 dpi (3508 px)
export const A4_PT = [595.28, 841.89];

const ENC = new TextEncoder();

/**
 * Baut ein einseitiges PDF aus einem JPEG (DCTDecode, unverändert eingebettet).
 * Rein, ohne DOM — in Node prüfbar.
 * @param {Uint8Array} jpeg  JPEG-Bytes (SOI … EOI)
 * @param {number} breitePx  Bildbreite in Pixeln
 * @param {number} hoehePx   Bildhöhe in Pixeln
 * @param {[number,number]} seitePt  Seitengröße in Punkt [Breite, Höhe]; das Bild füllt die Seite
 * @returns {Uint8Array}
 */
export function jpegZuPdf(jpeg, breitePx, hoehePx, seitePt) {
  if (!(jpeg instanceof Uint8Array) || jpeg[0] !== 0xFF || jpeg[1] !== 0xD8) throw new Error('jpegZuPdf: kein JPEG');
  const W = Math.round(breitePx), H = Math.round(hoehePx);
  if (!(W > 0 && H > 0)) throw new Error('jpegZuPdf: Bildmaß fehlt');
  const pw = +seitePt[0].toFixed(2), ph = +seitePt[1].toFixed(2);
  const inhalt = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  const teile = [];
  const offsets = [];
  let laenge = 0;
  const schreib = (x) => { const b = typeof x === 'string' ? ENC.encode(x) : x; teile.push(b); laenge += b.length; };
  schreib('%PDF-1.4\n');
  schreib(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));   // Binär-Marke (Bytes > 127)
  const objekt = (nr, kopf, strom) => {
    offsets[nr] = laenge;
    schreib(`${nr} 0 obj\n${kopf}\n`);
    if (strom) { schreib('stream\n'); schreib(strom); schreib('\nendstream\n'); }
    schreib('endobj\n');
  };
  objekt(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objekt(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objekt(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  objekt(4, `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  const inh = ENC.encode(inhalt);
  objekt(5, `<< /Length ${inh.length} >>`, inh);
  const xref = laenge;
  let x = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  schreib(x);
  schreib(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(laenge);
  let p = 0; for (const t of teile) { out.set(t, p); p += t.length; }
  return out;
}

/** Name des Scans: „rechnung.jpg" → „rechnung (Scan).pdf". */
export function scanName(name) {
  const basis = String(name || 'Foto').replace(/\.[^./\\]{1,5}$/, '');
  return basis + ' (Scan).pdf';
}

// ---- Browser ----------------------------------------------------------------

export const WFPDF_ASSETS = './assets/wfpdf/';
export const WFPDF_VENDOR = './vendor/';

const _skripte = new Map();
function skript(src) {
  if (_skripte.has(src)) return _skripte.get(src);
  const p = new Promise((ok, nein) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => ok(); s.onerror = () => nein(new Error('lädt nicht: ' + src.split('?')[0]));
    document.head.appendChild(s);
  });
  _skripte.set(src, p); p.catch(() => _skripte.delete(src));
  return p;
}

/** Nur pdf-lib (für das Angebots-PDF, Workflow-PDF-Rundlauf) — dieselbe byte-1:1-Kopie wie für den Scanner-Kern. */
export async function pdfLibLaden(basis) {
  if (!window.PDFLib) await skript(new URL(basis || WFPDF_ASSETS, location.href).href + 'pdf-lib.min.js');
  if (!window.PDFLib) throw new Error('pdf-lib meldet sich nicht');
  return window.PDFLib;
}

let _scanner = null;
/** Lädt den Scanner-Kern von Workflow PDF (zip.js, blatt.js, scan-bild.js, scanner.js) aus assets/wfpdf/ und setzt die Pfade. */
export function scannerLaden(basis) {
  if (_scanner) return _scanner;
  const a = new URL(basis || WFPDF_ASSETS, location.href).href;
  _scanner = (async () => {
    const W = () => window.WFP || {};
    if (!window.PDFLib) await skript(a + 'pdf-lib.min.js');   // der Kern erwartet PDFLib vom Wirt (wie Workflow PDF/WorkFlohs); fontkit + Noto holt er selbst über PF.vendor
    if (!W().Zip) await skript(a + 'zip.js');
    if (!W().Blatt) await skript(a + 'blatt.js');
    if (!W().ScanBild) await skript(a + 'scan-bild.js');
    if (!W().Scanner) await skript(a + 'scanner.js');
    if (!(W().Scanner && W().ScanBild)) throw new Error('Blatterkennung fehlt');
    const v = new URL(WFPDF_VENDOR, location.href).href;
    W().Scanner.pfade({ vendor: a, scanic: v + 'scanic/', ocr: v });
    return W().Scanner;
  })();
  _scanner.catch(() => { _scanner = null; });
  return _scanner;
}

async function bildAus(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* weiter */ }
    try { return await createImageBitmap(file); } catch { /* weiter */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode(); return img;
  } finally { URL.revokeObjectURL(url); }
}

function leinwand(bild, kante) {
  const w0 = bild.width || bild.naturalWidth, h0 = bild.height || bild.naturalHeight;
  const f = Math.min(1, kante / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * f)); c.height = Math.max(1, Math.round(h0 * f));
  const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(bild, 0, 0, c.width, c.height);
  return { c, f };
}

// Das ganze Foto mittig auf A4 (hoch oder quer), weißer Rand, nichts abgeschnitten — 300 dpi.
function aufA4(quelle, dpi = SCAN_DPI) {
  const quer = quelle.width > quelle.height;
  const seite = quer ? [A4_PT[1], A4_PT[0]] : A4_PT.slice();
  const W = Math.round(seite[0] / 72 * dpi), H = Math.round(seite[1] / 72 * dpi);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  const f = Math.min(W / quelle.width, H / quelle.height);
  const w = quelle.width * f, h = quelle.height * f;
  x.imageSmoothingQuality = 'high';
  x.drawImage(quelle, (W - w) / 2, (H - h) / 2, w, h);
  return { canvas: c, seite };
}

async function jpegBytes(canvas, q = SCAN_JPEG_GUETE) {
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', q));
  if (!blob) throw new Error('JPEG ließ sich nicht erzeugen');
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Macht aus einem Foto ein Scan-PDF. Wirft nur, wenn das Foto sich nicht dekodieren lässt.
 * @returns {Promise<{pdf:Uint8Array, name:string, sicher:boolean, grund:string, weg:string, seite:[number,number], px:[number,number]}>}
 */
export async function fotoZuScan(file, opt = {}) {
  const bild = await bildAus(file);
  const quelle = leinwand(bild, SCAN_QUELLE_KANTE);
  const erk = leinwand(quelle.c, SCAN_ERKENNUNG_KANTE);
  const w0 = bild.width || bild.naturalWidth, h0 = bild.height || bild.naturalHeight;
  if (bild.close) try { bild.close(); } catch { /* egal */ }
  const stufe = scanStufe(opt.qualitaet, Math.max(w0, h0));
  let sicher = false, grund = '', weg = 'scanner', ziel = null;
  let SC = null;
  try { SC = await scannerLaden(opt.basis); } catch (e) { weg = 'ohne-scanner'; grund = 'Blatterkennung nicht geladen (' + ((e && e.message) || e) + ')'; }
  if (SC) {
    try {
      const s = { foto: erk.c, manuell: false };
      await SC.erkennen(s);
      const e = s.erkennung || {};
      sicher = !!e.sicher; grund = e.grund || '';
      if (sicher) {
        const SB = window.WFP.ScanBild;
        const k = quelle.c.width / erk.c.width;                    // Ecken auf die große Quelle
        const ecken = s.ecken.map((p) => [p[0] * k, p[1] * k]);
        const m = SB.seitenMass(ecken, 'auto', stufe.dpi);
        const qx = quelle.c.getContext('2d', { willReadFrequently: true });
        const img = SB.entzerren(qx.getImageData(0, 0, quelle.c.width, quelle.c.height), ecken, m.W, m.H);
        const z = document.createElement('canvas'); z.width = img.width; z.height = img.height;
        z.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
        ziel = { canvas: z, seite: m.seite };
      }
    } catch (e) { sicher = false; grund = 'Blatterkennung lief nicht (' + ((e && e.message) || e) + ')'; }
  }
  if (!ziel) ziel = aufA4(quelle.c, stufe.dpi);
  const jpeg = await jpegBytes(ziel.canvas, stufe.q);
  const px = [ziel.canvas.width, ziel.canvas.height];
  const pdf = jpegZuPdf(jpeg, px[0], px[1], ziel.seite);
  ziel.canvas.width = ziel.canvas.height = 0; quelle.c.width = quelle.c.height = 0; erk.c.width = erk.c.height = 0;
  const r = { pdf, name: scanName(file.name), sicher, grund, weg, seite: ziel.seite, px, dpi: stufe.dpi, qualitaet: stufe.stufe };
  if (typeof window !== 'undefined') window.__blpScan = { name: r.name, sicher, grund, weg, seite: r.seite, px, dpi: stufe.dpi, qualitaet: stufe.stufe };   // Probe
  return r;
}
