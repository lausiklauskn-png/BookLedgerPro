// src/ai/kiVorbereitung.js — was an die Texterkennung (Google Vision EU / Mistral OCR) geht,
// wird vorher gereinigt (Klaus 2026-10-14, Vorbild Workflow PDF #112/#113 und die Rezeptbücher).
//
// Bis hierher ging die ORIGINALDATEI hinaus: ein PDF samt Text, den man auf der Seite nicht
// sieht, ein Foto samt EXIF (Kamera, Ort). Jetzt:
//   · PDF  → jede Seite mit pdf.js GEZEICHNET (höchstens KI_PDF_SEITEN_MAX), mit 300 dpi nach der
//            echten Seitengröße, versteckter Text in der Kopie zugedeckt (WFP.Reinigung.versteckt/
//            zudecken), als JPEG 92 % ohne Metadaten.
//   · Foto → JPEG: die Bildpunkte gehen 1:1 hinaus, nur Metadaten-Abschnitte und alles hinter dem
//            Bildende werden abgeschnitten (Klaus 2026-10-14: „nur das Bösartige neu, den Rest 1:1").
//            Andere Formate → in voller Größe neu gezeichnet, PNG bleibt verlustfrei PNG.
// QUALITÄT (Klaus 2026-10-14: „Die Qualität muss 100 % stimmen"), gemessen mit der Texterkennung
// auf dem Gerät an kleiner, blassgrauer Schrift (20 Zeilen): 1400 px/JPEG 85 % → 9 Zeilen falsch,
// 300 dpi/JPEG 92 % → 0; PNG brachte nichts und wog beim Scan das Fünffache (Sage Bau 24.R).
// Das Original im Beleg-Archiv bleibt unverändert (GoBD).
//
// ⚠ GRENZEN, benannt: nur die ersten 10 Seiten gehen hinaus (das wird gesagt) · Text über einem
//   Foto oder über sichtbarer Schrift hat dort „Tinte" und bleibt · schräger Text wird nicht
//   beurteilt · ein Bild, das der Browser nicht dekodieren kann (z. B. HEIC), geht NICHT hinaus.

import { skriptLaden, reinigung, VENDOR_PDFJS } from '../domain/belegPruefung.js';

export const KI_PDF_SEITEN_MAX = 10;
export const KI_PDF_DPI = 300;
export const KI_PDF_MAX_KANTE = 5000;     // A3 bei 300 dpi = 4961 px; darüber (Plakate) gedeckelt
export const KI_JPEG_GUETE = 0.92;
export const KI_BILD_MAX_KANTE = 6000;    // nur gegen Riesenbilder; ein Handyfoto bleibt unverkleinert
export const KI_PNG_MAX_BYTES = 8 * 1024 * 1024;

async function pdfjs() {
  if (!window.pdfjsLib) {
    const basis = new URL(VENDOR_PDFJS, location.href).href;
    await skriptLaden(basis + 'pdf.min.js');
    if (!window.pdfjsLib) throw new Error('pdf.js meldet sich nicht');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = basis + 'pdf.worker.min.js';
  }
  return window.pdfjsLib;
}

/**
 * Ein PDF als gereinigte Seitenbilder.
 * @param {Uint8Array} bytes
 * @returns {Promise<{bilder:string[], liste:Array<{seite,text,grund}>, seiten:number, gesamt:number}>}
 */
export async function pdfFuersKi(bytes, opt = {}) {
  const RE = await reinigung();
  const L = await pdfjs();
  // ⚠ isEvalSupported:false — pdf.js 3.x konnte mit einer präparierten Schrift Code ausführen (CVE-2024-4367).
  const pdf = await L.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  const n = Math.min(pdf.numPages, KI_PDF_SEITEN_MAX), bilder = [], liste = [];
  for (let i = 1; i <= n; i++) {
    if (opt.onSeite) opt.onSeite(i, n);
    const p = await pdf.getPage(i);
    const v1 = p.getViewport({ scale: 1 });
    // 300 dpi nach der echten Seitengröße (1 pt = 1/72 Zoll), Riesenseiten gedeckelt.
    const vp = p.getViewport({ scale: Math.min(KI_PDF_DPI / 72, KI_PDF_MAX_KANTE / Math.max(v1.width, v1.height)) });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await p.render({ canvasContext: x, viewport: vp }).promise;
    const img = x.getImageData(0, 0, c.width, c.height);
    const tc = await p.getTextContent();
    let zu = 0;
    for (const t of tc.items) {
      if (!t.str || !t.str.trim()) continue;
      const tr = L.Util.transform(vp.transform, t.transform);
      if (Math.abs(Math.atan2(tr[1], tr[0])) > 0.05) continue;   // schräger Text: nicht beurteilt (Grenze)
      const st = { s: t.str, x: tr[4] / vp.scale, y: tr[5] / vp.scale, w: t.width, fh: Math.hypot(tr[2], tr[3]) / vp.scale };
      const g = RE.versteckt(st, img, vp.scale);
      if (g) { liste.push({ seite: i, text: t.str, grund: g }); RE.zudecken(img, st, vp.scale); zu++; }
    }
    if (zu) x.putImageData(img, 0, 0);
    const m = RE.datenAdresseOhneMeta(c.toDataURL('image/jpeg', KI_JPEG_GUETE));
    m.entfernt.forEach((e) => liste.push({ seite: i, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }));
    bilder.push(m.url);
    c.width = c.height = 0;
    try { p.cleanup(); } catch { /* egal */ }
  }
  const gesamt = pdf.numPages;
  try { pdf.destroy(); } catch { /* egal */ }
  return { bilder, liste, seiten: n, gesamt };
}

/**
 * PDF-Kopf (Producer/Creator) — für die Marke „Workfloh PDF" beim Ablegen (Klaus 2026-10-26, D12).
 * Fail-soft: {} wenn pdf.js nicht lädt oder das PDF keinen Kopf hat.
 */
export async function pdfKopf(bytes) {
  try {
    const L = await pdfjs();
    const pdf = await L.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
    const m = await pdf.getMetadata().catch(() => null);
    const info = (m && m.info) || {};
    try { pdf.destroy(); } catch { /* egal */ }
    return { producer: String(info.Producer || ''), creator: String(info.Creator || ''), keywords: String(info.Keywords || ''), title: String(info.Title || ''), seiten: pdf.numPages || 0 };
  } catch { return {}; }
}

/** Kleines Vorschaubild der ersten Seite (PNG-Data-URL) — für die Arbeitsstand-Datei an Workflow PDF (dort die Karte). Fail-soft ''. */
export async function pdfVorschaubild(bytes, breite = 160) {
  try {
    const L = await pdfjs();
    const pdf = await L.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
    const p = await pdf.getPage(1);
    const v0 = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: breite / v0.width });
    const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    try { pdf.destroy(); } catch { /* egal */ }
    return c.toDataURL('image/png');
  } catch { return ''; }
}

/**
 * Die Textebene eines PDFs (Klaus 2026-10-26): der erkannte Text eines Workflow-PDF-Scans liegt als
 * unsichtbare Textebene IM PDF — BookLedgerPro liest ihn mit pdf.js, ohne Vision und ohne Netz.
 * Gilt für jedes PDF mit Textebene (auch Rechnungen aus einem Programm). Höchstens KI_PDF_SEITEN_MAX Seiten.
 * ⚠ Versteckter Text (weiß, winzig) steht ebenfalls in der Textebene — deshalb geht der Text danach durch
 *   dieselbe Prüfung auf Anweisungen an eine KI wie der OCR-Text (kiTextFreigabe).
 * @returns {Promise<{text:string, seiten:number, gesamt:number, kopf:{producer:string,creator:string}}>}
 */
export async function pdfTextebene(bytes) {
  const { textebeneZuText } = await import('../domain/workflowPdf.js');
  const L = await pdfjs();
  const pdf = await L.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  const n = Math.min(pdf.numPages, KI_PDF_SEITEN_MAX), seiten = [];
  for (let i = 1; i <= n; i++) {
    const p = await pdf.getPage(i);
    const tc = await p.getTextContent();
    seiten.push(tc.items);
    try { p.cleanup(); } catch { /* egal */ }
  }
  const m = await pdf.getMetadata().catch(() => null);
  const info = (m && m.info) || {};
  const gesamt = pdf.numPages;
  try { pdf.destroy(); } catch { /* egal */ }
  return { text: textebeneZuText(seiten), seiten: n, gesamt, kopf: { producer: String(info.Producer || ''), creator: String(info.Creator || '') } };
}

/** Bild-Metadaten, die im ORIGINAL stecken — benannt, damit der Vermerk sagt, was nicht mitging. */
function metaImOriginal(RE, bytes, mime) {
  if (!/jpe?g$/i.test(mime || '')) return [];
  const r = RE.jpegOhneMeta(bytes);
  return r.entfernt || [];
}

/** Ende eines JPEG: das erste FF D9 nach dem ersten Bilddaten-Abschnitt (FF DA). In den
 *  Bilddaten ist jedes FF gestopft (FF 00) oder ein Neustart (FF D0–D7). -1 = nicht gefunden. */
export function jpegEnde(u8) {
  let i = 2;
  while (i + 4 <= u8.length && u8[i] === 0xFF && u8[i + 1] !== 0xDA) {
    const m = u8[i + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    i += 2 + ((u8[i + 2] << 8) | u8[i + 3]);
  }
  for (let k = i; k + 1 < u8.length; k++) if (u8[k] === 0xFF && u8[k + 1] === 0xD9) return k + 2;
  return -1;
}
function zuB64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }

/** JPEG 1:1: Metadaten und Angehängtes weg, Bildpunkte unverändert. null = nicht sauber zerlegbar. */
export function jpegEinsZuEins(RE, u8) {
  const r = RE.jpegOhneMeta(u8);
  if (!r || !r.geprueft) return null;
  const ende = jpegEnde(r.bytes);
  if (ende < 0) return null;
  const liste = (r.entfernt || []).map((e) => ({ seite: null, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }));
  let b = r.bytes;
  if (ende < b.length) {
    liste.push({ seite: null, text: 'Angehängtes hinter dem Bildende (' + (b.length - ende) + ' Byte)', grund: 'meta' });
    b = b.subarray(0, ende);
  }
  return { bilder: ['data:image/jpeg;base64,' + zuB64(b)], liste, seiten: 1, gesamt: 1, einsZuEins: true };
}

/**
 * Ein Foto für die Texterkennung: JPEG 1:1 ohne Metadaten und Angehängtes, sonst in voller Größe
 * neu gezeichnet (PNG bleibt PNG).
 * ⚠ NIE das Original: lässt sich das Bild nicht dekodieren, wird geworfen — nichts geht hinaus.
 * @returns {Promise<{bilder:string[], liste:Array<{seite,text,grund}>, seiten:1, gesamt:1}>}
 */
export async function bildFuersKi(bytes, mime) {
  const RE = await reinigung();
  if (bytes && bytes.length > 3 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
    const eins = jpegEinsZuEins(RE, bytes);
    if (eins) return eins;
  }
  let bild;
  try { bild = await createImageBitmap(new Blob([bytes], { type: mime || 'image/jpeg' })); }
  catch { throw new Error('Das Bild lässt sich hier nicht lesen — es wurde nichts gesendet.'); }
  const f = Math.min(1, KI_BILD_MAX_KANTE / Math.max(bild.width, bild.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bild.width * f)); c.height = Math.max(1, Math.round(bild.height * f));
  const x = c.getContext('2d');
  const png = /png$/i.test(mime || '');
  if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
  x.drawImage(bild, 0, 0, c.width, c.height);
  if (bild.close) bild.close();
  let url = png ? c.toDataURL('image/png') : '';
  if (!png || url.length * 0.75 > KI_PNG_MAX_BYTES) url = RE.datenAdresseOhneMeta(c.toDataURL('image/jpeg', KI_JPEG_GUETE)).url;
  c.width = c.height = 0;
  const liste = metaImOriginal(RE, bytes, mime).map((e) => ({ seite: null, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }));
  return { bilder: [url], liste, seiten: 1, gesamt: 1, einsZuEins: false };
}

/** Beide Wege hinter einer Tür. */
export async function belegFuersKi(bytes, mime, opt = {}) {
  return /pdf$/i.test(mime || '') ? pdfFuersKi(bytes, opt) : bildFuersKi(bytes, mime);
}
