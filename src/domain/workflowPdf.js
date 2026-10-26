// src/domain/workflowPdf.js — Einbindung von Workflow PDF (Klaus 2026-10-26, Bau-Brief Schritt 2, V1 + V2).
//
// Reine Logik ohne DOM, Netz und Datenbank — in Node geprüft (tests/run.mjs). Der Browser-Teil
// (Teilen-Empfang aus dem Vorrat, Textebene mit pdf.js) steht in src/domain/teilenEmpfang.js und
// src/ai/kiVorbereitung.js.
//
// Was Workflow PDF liefert (im Repo nachgesehen, Plan docs/design/WORKFLOW-PDF-EINBINDUNG-PLAN-2026-10-26.md):
//   · Scan-PDF per Teilen; mit „Durchsuchbar" liegt der erkannte Text als unsichtbare Textebene IM PDF.
//   · Marke im PDF-Kopf: Producer „Workfloh PDF", Creator „Workfloh PDF · Scannen" (pdf-lib setProducer/setCreator).
//   · Direktstart: ./?scan=1&von=<App> öffnet dort sofort den Scanner mit „Durchsuchbar".
//
// Klaus' Regel D12 (2026-10-26): eigene Scans aus Workflow PDF OHNE Datei-Prüfung, Dateien von außen MIT.
// Und (2026-10-26): die OCR-Textprüfung (Anweisung an eine KI) bleibt auch für eigene Scans — sie kostet
// nichts und schützt genau den Weg zur KI.
// ⚠ Ehrlich: die Marke ist kein Beweis. Jedes Programm kann „Workfloh PDF" in den PDF-Kopf schreiben.
//   Sie sagt nur: dieses PDF sieht aus wie ein eigener Scan. Wer es genau wissen will, prüft von Hand
//   (der Prüf-Knopf bleibt am Beleg).

export const HERKUNFT_WORKFLOW = 'workflow-pdf';
export const WORKFLOW_PRODUCER = 'Workfloh PDF';
export const WORKFLOW_CREATOR_SCAN = 'Workfloh PDF · Scannen';
export const WORKFLOW_PDF_URL = 'https://lausiklauskn-png.github.io/Workflow-PDF/';
export const WORKFLOW_PDF_PRO_PAKET = 'de.familyprojekt.workflowpdf.pro';
export const GETEILT_VORRAT = 'blpr-geteilt';          // Vorrat des Service-Workers für geteilte Dateien (überlebt ein neues CACHE_VERSION)
export const TEILEN_EMPFANG_PFAD = 'teilen-empfang';     // share_target.action (ohne ./) — sw.js fängt genau das ab
export const TEILEN_FELD = 'dateien';                     // share_target.params.files[0].name — der Worker liest genau dieses Feld
/** So viele Buchstaben muss die Textebene mindestens tragen, damit sie als erkannter Text gilt (sonst Vision). */
export const TEXTEBENE_MIN_BUCHSTABEN = 40;

/**
 * Ist das PDF (nach seinem Kopf) ein eigener Scan aus Workflow PDF?
 * @param {{producer?:string, creator?:string}|null} info — pdf.js getMetadata().info (Producer/Creator) oder eigene Felder
 */
export function istWorkflowScan(info) {
  if (!info) return false;
  const p = String(info.producer || info.Producer || '');
  const c = String(info.creator || info.Creator || '');
  return p.startsWith(WORKFLOW_PRODUCER) && c.includes('Scannen');
}

/** Herkunft eines Belegs beim Ablegen: 'workflow-pdf' für eigene Scans, sonst undefined. */
export function herkunftVon(info) {
  return istWorkflowScan(info) ? HERKUNFT_WORKFLOW : undefined;
}

/** Ist der Beleg (Metadaten) ein eigener Scan aus Workflow PDF? */
export function istEigenerScan(meta) {
  return !!(meta && meta.herkunft === HERKUNFT_WORKFLOW);
}

/** Reicht die Textebene als erkannter Text? (Buchstaben zählen, nicht Leerzeichen und Sonderzeichen.) */
export function textebeneReicht(text, min = TEXTEBENE_MIN_BUCHSTABEN) {
  const buchstaben = (String(text || '').match(/\p{L}|\p{N}/gu) || []).length;
  return buchstaben >= min;
}

/** Text aus pdf.js-Textstücken je Seite zu lesbaren Zeilen zusammensetzen (Zeilenwechsel, wo pdf.js einen meldet). */
export function textebeneZuText(seiten) {
  const teile = [];
  for (const items of seiten || []) {
    let zeile = '';
    const zeilen = [];
    for (const it of items || []) {
      if (it && typeof it.str === 'string' && it.str) zeile += (zeile && !/\s$/.test(zeile) && !/^\s/.test(it.str) ? ' ' : '') + it.str;
      if (it && it.hasEOL) { zeilen.push(zeile.trim()); zeile = ''; }
    }
    if (zeile.trim()) zeilen.push(zeile.trim());
    teile.push(zeilen.filter(Boolean).join('\n'));
  }
  return teile.filter(Boolean).join('\n\n').trim();
}

/**
 * Liest den Teilen-Parameter aus der Adresse (./?geteilt=1|0|fehler).
 * @returns {null|'1'|'0'|'fehler'} null = keine Übergabe
 */
export function geteiltParam(search) {
  const q = new URLSearchParams(String(search || ''));
  if (!q.has('geteilt')) return null;
  const g = q.get('geteilt');
  return g === '1' ? '1' : g === 'fehler' ? 'fehler' : '0';
}

/** Die Adresse ohne den Teilen-Parameter (für history.replaceState). */
export function ohneGeteilt(pathname, search, hash) {
  const q = new URLSearchParams(String(search || ''));
  q.delete('geteilt');
  return String(pathname || '') + (q.toString() ? '?' + q : '') + String(hash || '');
}

/**
 * Adresse, die Workflow PDF zum Scannen öffnet (V2). Auf Android ein intent://-Link auf die Pro-App mit
 * Rückfall auf die Web-Fassung; sonst die Web-Fassung direkt. Beide mit ?scan=1&von=BookLedgerPro.
 * ⚠ Ob Android die Pro-App über den Link öffnet, hängt davon ab, ob sie https-Links ihrer Adresse annimmt
 *   (App-Link in Workflow-PDF-Pro); sonst öffnet Chrome die Web-Fassung — der Scan geht dort genauso.
 */
export function workflowScanAdresse({ android = false, von = 'BookLedgerPro' } = {}) {
  const web = WORKFLOW_PDF_URL + '?scan=1&von=' + encodeURIComponent(von);
  if (!android) return web;
  const u = new URL(web);
  return 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=https;package=' + WORKFLOW_PDF_PRO_PAKET +
    ';S.browser_fallback_url=' + encodeURIComponent(web) + ';end';
}

/** Android nach dem User-Agent (kein Beweis, reicht für die Wahl des Links). */
export function istAndroid(userAgent) {
  return /Android/i.test(String(userAgent || ''));
}
