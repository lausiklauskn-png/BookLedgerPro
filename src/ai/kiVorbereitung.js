// src/ai/kiVorbereitung.js — was an die Texterkennung (Google Vision EU / Mistral OCR) geht,
// wird vorher gereinigt (Klaus 2026-10-14, Vorbild Workflow PDF #112/#113 und die Rezeptbücher).
//
// Bis hierher ging die ORIGINALDATEI hinaus: ein PDF samt Text, den man auf der Seite nicht
// sieht, ein Foto samt EXIF (Kamera, Ort). Jetzt:
//   · PDF  → jede Seite mit pdf.js GEZEICHNET (höchstens KI_PDF_SEITEN_MAX), versteckter Text in
//            der Kopie zugedeckt (WFP.Reinigung.versteckt/zudecken), als JPEG ohne Metadaten.
//   · Foto → auf einer Leinwand neu gezeichnet (lange Kante ≤ KI_BILD_KANTE), JPEG ohne Metadaten.
// Das Original im Beleg-Archiv bleibt unverändert (GoBD).
//
// ⚠ GRENZEN, benannt: nur die ersten 10 Seiten gehen hinaus (das wird gesagt) · Text über einem
//   Foto oder über sichtbarer Schrift hat dort „Tinte" und bleibt · schräger Text wird nicht
//   beurteilt · ein Bild, das der Browser nicht dekodieren kann (z. B. HEIC), geht NICHT hinaus.

import { skriptLaden, reinigung, VENDOR_PDFJS } from '../domain/belegPruefung.js';

export const KI_PDF_SEITEN_MAX = 10;
export const KI_PDF_KANTE = 1400;
export const KI_BILD_KANTE = 2000;

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
export async function pdfFuersKi(bytes) {
  const RE = await reinigung();
  const L = await pdfjs();
  // ⚠ isEvalSupported:false — pdf.js 3.x konnte mit einer präparierten Schrift Code ausführen (CVE-2024-4367).
  const pdf = await L.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  const n = Math.min(pdf.numPages, KI_PDF_SEITEN_MAX), bilder = [], liste = [];
  for (let i = 1; i <= n; i++) {
    const p = await pdf.getPage(i);
    const v1 = p.getViewport({ scale: 1 });
    const vp = p.getViewport({ scale: KI_PDF_KANTE / v1.width });
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
    const m = RE.datenAdresseOhneMeta(c.toDataURL('image/jpeg', 0.85));
    m.entfernt.forEach((e) => liste.push({ seite: i, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }));
    bilder.push(m.url);
    c.width = c.height = 0;
    try { p.cleanup(); } catch { /* egal */ }
  }
  const gesamt = pdf.numPages;
  try { pdf.destroy(); } catch { /* egal */ }
  return { bilder, liste, seiten: n, gesamt };
}

/** Bild-Metadaten, die im ORIGINAL stecken — benannt, damit der Vermerk sagt, was nicht mitging. */
function metaImOriginal(RE, bytes, mime) {
  if (!/jpe?g$/i.test(mime || '')) return [];
  const r = RE.jpegOhneMeta(bytes);
  return r.entfernt || [];
}

/**
 * Ein Foto neu gezeichnet: keine Metadaten, lange Kante gedeckelt.
 * ⚠ NIE das Original: lässt sich das Bild nicht dekodieren, wird geworfen — nichts geht hinaus.
 * @returns {Promise<{bilder:string[], liste:Array<{seite,text,grund}>, seiten:1, gesamt:1}>}
 */
export async function bildFuersKi(bytes, mime) {
  const RE = await reinigung();
  let bild;
  try { bild = await createImageBitmap(new Blob([bytes], { type: mime || 'image/jpeg' })); }
  catch { throw new Error('Das Bild lässt sich hier nicht lesen — es wurde nichts gesendet.'); }
  const f = Math.min(1, KI_BILD_KANTE / Math.max(bild.width, bild.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bild.width * f)); c.height = Math.max(1, Math.round(bild.height * f));
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(bild, 0, 0, c.width, c.height);
  if (bild.close) bild.close();
  const m = RE.datenAdresseOhneMeta(c.toDataURL('image/jpeg', 0.9));
  c.width = c.height = 0;
  const liste = metaImOriginal(RE, bytes, mime).map((e) => ({ seite: null, text: e.art + ' (' + e.bytes + ' Byte)', grund: 'meta' }));
  return { bilder: [m.url], liste, seiten: 1, gesamt: 1 };
}

/** Beide Wege hinter einer Tür. */
export async function belegFuersKi(bytes, mime) {
  return /pdf$/i.test(mime || '') ? pdfFuersKi(bytes) : bildFuersKi(bytes, mime);
}
