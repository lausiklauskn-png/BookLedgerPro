// src/ui/scanner.js — 📷 Scannen in BookLedgerPro mit dem Scanner-Kern von Workflow PDF (Klaus 2026-10-26: „der
// Scannerkern wird mit eingebaut … einfotografierte Bilder sofort in PDFs umgewandelt … Seitenpunkte festlegen oder
// automatisch … Auslesen per OCR und Vektorisieren … Wort- und Bedeutungssuche").
//
// Die Maschine (assets/wfpdf/scanner.js, scan-bild.js, blatt.js, zip.js; pdf-lib, fontkit, Noto; vendor/scanic) ist
// byte-1:1 aus Workflow PDF (tools/wfpdf-nachziehen.mjs, Pins in assets/wfpdf/HERKUNFT.json). Hier steht nur der
// Klebstoff — dieselben Rückrufe wie in Workflow PDF und den WorkFlohs (toast · dialog · frage · fortschritt · laden):
// Foto/Galerie → Blatt finden (Scanic-Modell, Kanten, blatt.js; unsicher = „bitte prüfen", nie still schneiden) →
// Ecken ziehen → gerade ziehen → Filter → Texterkennung (Tesseract, vendor/tesseract, auf dem Gerät) → PDF mit Textebene
// (Marke „Workfloh PDF · Scannen" = eigener Scan) → „Als Beleg ablegen". Der Beleg geht durch denselben Import wie
// „Mehrere Belege hochladen"; der erkannte Text wird gleich am Beleg gemerkt (verschlüsselt) → Wort- und Bedeutungssuche.
// „Durchsuchbar" ist für BLP immer an (ohne Text gäbe es nichts zu suchen).
import { scannerLaden as kernLaden } from '../core/scanPdf.js';

export const SCANNER_CSS = './assets/wfpdf/scanner.css?v=1';
let _css = null;
function cssLaden() {
  if (_css) return _css;
  _css = new Promise((ok, nein) => {
    if (document.querySelector('link[data-scanner-css]')) return ok();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = SCANNER_CSS; l.setAttribute('data-scanner-css', '');
    l.onload = () => ok(); l.onerror = () => nein(new Error('scanner.css lädt nicht'));
    document.head.appendChild(l);
  });
  _css.catch(() => { _css = null; });
  return _css;
}
export async function scannerBereit() {
  await cssLaden();
  return kernLaden();
}

const h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let _toastUhr = null;
export function toast(text, ms = 4200) {
  let t = document.getElementById('toasts');
  if (!t) { t = document.createElement('div'); t.id = 'toasts'; t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  const e = document.createElement('div'); e.className = 'toast'; e.textContent = String(text);
  t.replaceChildren(e);
  clearTimeout(_toastUhr); _toastUhr = setTimeout(() => { if (e.isConnected) e.remove(); }, ms);
  if (typeof window !== 'undefined') window.__blpToast = String(text);   // Probe
}
// Dieselben Rückrufe wie in Workflow PDF (app.js) und den WorkFlohs (werkzeug.js): HTML kommt aus dem Kern selbst.
export function scanDialog(html, onMount) {
  const g = document.createElement('div'); g.className = 'scan-dlg-grund';
  g.innerHTML = '<div class="scan-dlg" role="dialog" aria-modal="true">' + html + '</div>';
  const zu = () => { g.remove(); document.removeEventListener('keydown', escK); };
  const escK = (e) => { if (e.key === 'Escape') zu(); };
  g.addEventListener('click', (e) => { if (e.target === g) zu(); });
  document.addEventListener('keydown', escK);
  document.body.appendChild(g);
  if (onMount) onMount(g.querySelector('.scan-dlg'), zu);
  return zu;
}
export function scanFrage(titel, text, ja, nein) {
  return new Promise((res) => scanDialog('<h2>' + h(titel) + '</h2><div>' + text + '</div><div class="zeile"><button class="knopf" data-n>' + h(nein || 'Abbrechen') + '</button><button class="knopf rot" data-j>' + h(ja || 'OK') + '</button></div>',
    (d, zu) => { d.querySelector('[data-j]').onclick = () => { zu(); res(true); }; d.querySelector('[data-n]').onclick = () => { zu(); res(false); }; d.querySelector('[data-j]').focus(); }));
}
export function scanFortschritt(titel) {
  let el = null, tx = null;
  const zu = scanDialog('<h2>' + h(titel) + '</h2><div class="fortschritt"><i></i></div><p class="hinweis" data-t>…</p>', (d) => { el = d.querySelector('.fortschritt i'); tx = d.querySelector('[data-t]'); });
  return { setze(anteil, text) { if (el) el.style.width = Math.round(Math.min(1, Math.max(0, anteil)) * 100) + '%'; if (tx && text) tx.textContent = text; }, zu };
}
export function laden(dateiname, bytes, typ) {
  const blob = new Blob([bytes], { type: typ || 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = dateiname; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob;
}
export const dateiName = (s) => (String(s || 'Scan').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'Scan');

/**
 * Öffnet den Scanner. opt.start: 'kamera' | 'galerie' | undefined · opt.dateien: Bilder, die gleich hineinkommen ·
 * opt.fertig(file): bekommt das fertige PDF (File, Marke „Workfloh PDF · Scannen") · opt.titel/fertigText.
 * Wirft, wenn der Kern nicht lädt (beim ersten Mal ist das Scanic-Modell 3,5 MB; danach aus dem Vorrat).
 */
export const KERN_QUALITAET = Object.freeze({ auto: 'hoch', hoch: 'hoch', normal: 'normal', klein: 'klein' });

export async function scannen(opt = {}) {
  const SC = await scannerBereit();
  const r = SC.oeffnen({
    titel: opt.titel || 'Scannen', fertigText: opt.fertigText || 'Als Beleg ablegen',
    start: opt.dateien && opt.dateien.length ? undefined : opt.start,
    name: opt.name || ('Scan ' + new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })),
    ort: 'in BookLedgerPro', ortKurz: 'in BookLedgerPro',
    toast, dialog: scanDialog, frage: scanFrage, fortschritt: scanFortschritt, laden,
    ablegen: null,
    fertig: async (bytes, info) => {
      const file = new File([bytes], dateiName(info && info.name) + '.pdf', { type: 'application/pdf' });
      if (typeof window !== 'undefined') window.__blpScanFertig = { name: file.name, bytes: bytes.length };   // Probe
      if (opt.fertig) await opt.fertig(file, info);
    },
  });
  // BLP: immer mit Textebene (Klaus: „Auslesen per OCR … damit das leichter gefunden werden kann") — die gemerkte
  // Wahl aus Workflow PDF (wfpdf_scan_v1, gleicher Ursprung) gilt hier nicht.
  const st = SC.zustand && SC.zustand();
  if (st) {
    st.durchsuchbar = true;                                   // Textebene ist der Zweck (Suche, Steuer)
    // Qualität aus den BLP-Einstellungen (Klaus 2026-10-26). Der Kern kennt hoch 200 · normal 150 · klein 110 dpi;
    // BLPs „hoch“ und „auto“ nehmen dort „hoch“, die Wahl im Scanner-Fenster bleibt je Scan möglich.
    const q = KERN_QUALITAET[opt.qualitaet || 'hoch']; if (q) st.qualitaet = q;
  }
  if (opt.dateien && opt.dateien.length) await SC.hinzu([...opt.dateien]);
  return r;
}
