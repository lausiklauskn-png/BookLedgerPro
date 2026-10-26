// src/domain/workflowPdfRundlauf.js — Angebot ⇄ Workflow PDF (Klaus 2026-10-26: „Wenn, dann beides. Also PDF teilen und
// Daten teilen.")
//
// HINWEG  BookLedgerPro → Workflow PDF: das Angebot wird ein echtes PDF (pdf-lib, Text, A4) UND eine Arbeitsstand-Datei
//         von Workflow PDF (`*.workfloh.json`, Format `workfloh-pdf-arbeitsstand`, Version 1): PDF + Felder. Die Felder sind
//         die Daten: Unterschrift des Auftraggebers, Ort/Datum, Haken „Angebot angenommen" — an genau den Stellen, an denen
//         das PDF seine Linien zeichnet. Workflow PDF liest die Datei über „📄 PDF oder Bild" oder Androids Teilen-Liste
//         (share_target nimmt .json), öffnet das Dokument, Klaus unterschreibt mit dem Finger, „PDF ausgeben (fest)".
// RÜCKWEG Workflow PDF → BookLedgerPro: das feste PDF wird geteilt (share_target hier) und beim Einlesen an der MARKE
//         erkannt: Keywords `blp-angebot=<id>;nr=<nummer>` (Workflow PDF lädt das PDF mit pdf-lib und setzt nur Title/
//         Producer/Creator — die Keywords bleiben) und zur Sicherheit dieselbe Marke als Textzeile am Fuß der Seite (die
//         Textebene überlebt jeden Export). Der Beleg wird dem Angebot zugeordnet (verweise.wfpdfBelegId); der Status
//         bleibt von Hand (nichts wird automatisch „angenommen").
//
// Reine Logik. Der PDF-Aufbau bekommt pdf-lib hineingereicht (im Browser window.PDFLib aus assets/wfpdf/, in Node die
// gepinnte Kopie) — so ist er ohne Browser prüfbar. Keine Kalkulation, kein Einkauf, keine Marge: Grundlage ist
// externesAngebot (die Whitelist), wie das Angebotsdokument in der App.

export const STAND_FORMAT = 'workfloh-pdf-arbeitsstand';     // wörtlich wie Workflow-PDF assets/app.js STAND_FORMAT
export const STAND_VERSION = 1;
export const MARKE_PREFIX = 'BookLedgerPro · Angebot';
export const PRODUCER = 'BookLedgerPro';
export const CREATOR = 'BookLedgerPro · Angebot';
export const A4 = Object.freeze({ w: 595.28, h: 841.89 });
const RAND = 50;

/** Die Marke als Textzeile (steht klein am Fuß jeder Seite und in den Keywords). */
export function angebotMarke(a) {
  return `${MARKE_PREFIX} ${String((a && a.nummer) || '—')} · ${String((a && a.id) || '')}`;
}
export function angebotKeywords(a) {
  return `blp-angebot=${String((a && a.id) || '')};nr=${String((a && a.nummer) || '')}`;
}
/**
 * Marke aus einem zurückgekommenen PDF lesen: zuerst Keywords, dann Text (Textebene).
 * @returns {{id:string, nummer:string}|null}
 */
export function angebotMarkeLesen(text, keywords) {
  const k = /blp-angebot=([A-Za-z0-9_:.-]{4,80});nr=([^;\s]{0,40})/.exec(String(keywords || ''));
  if (k) return { id: k[1], nummer: k[2] };
  const re = new RegExp(MARKE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(\\S{1,40})\\s+·\\s+([A-Za-z0-9_:.-]{4,80})');
  const m = re.exec(String(text || '').replace(/\s+/g, ' '));
  return m ? { id: m[2], nummer: m[1] === '—' ? '' : m[1] } : null;
}

/** Unterschriftsblock (Punkte vom unteren Rand aus, A4). Dieselben Maße für PDF-Linien und Felder. */
export const UNTERSCHRIFT = Object.freeze({
  hakenX: RAND, hakenY: 150, hakenKante: 12,                 // Haken „Angebot angenommen"
  datumX: RAND, datumW: 160, linieY: 95, linieH: 30,          // Ort, Datum
  sigX: 300, sigW: A4.w - RAND - 300,                          // Unterschrift Auftraggeber
});

/** Felder für den Arbeitsstand von Workflow PDF — in PROZENT der angezeigten Seite (x/y oben links), wie dort üblich. */
export function angebotFelder(seite = 0) {
  const U = UNTERSCHRIFT, pw = A4.w, ph = A4.h;
  const px = (x) => Math.round(x / pw * 10000) / 100, py = (yUnten, h) => Math.round((ph - yUnten - h) / ph * 10000) / 100;
  const pwid = (w) => Math.round(w / pw * 10000) / 100, phoe = (h) => Math.round(h / ph * 10000) / 100;
  const f = (id, type, label, x, yUnten, w, h, value) => ({ id: 'blp-' + id, page: seite, type, label, x: px(x), y: py(yUnten, h), w: pwid(w), h: phoe(h), value, herkunft: 'hand', geprueft: true, mehrzeilig: false });
  return [
    f('haken', 'check', 'Angebot angenommen', U.hakenX, U.hakenY, U.hakenKante, U.hakenKante, false),
    f('datum', 'datum', 'Ort, Datum', U.datumX, U.linieY, U.datumW, U.linieH, ''),
    f('unterschrift', 'unterschrift', 'Unterschrift Auftraggeber', U.sigX, U.linieY, U.sigW, U.linieH, ''),
  ];
}

/** Zeilen und Tabelle für das PDF, nur aus der Whitelist (externesAngebot) + Kunde/Firma (Stammdaten). */
export function angebotBlatt(doc, kunde = {}, firma = {}, texte = {}) {
  const T = Object.assign({ titel: 'Angebot', datum: 'Datum', gueltig: 'Gültig bis', pos: 'Position', menge: 'Menge', einzel: 'Einzelpreis', ust: 'USt', netto: 'Netto',
    summeNetto: 'Netto', summeBrutto: 'Brutto', ortDatum: 'Ort, Datum', unterschrift: 'Unterschrift Auftraggeber', angenommen: 'Angebot angenommen' }, texte || {});
  const euro = (c) => (Number(c || 0) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const kopf = [];
  if (firma.name) kopf.push(String(firma.name));
  if (firma.anschrift) kopf.push(...String(firma.anschrift).split(/\r?\n/).filter(Boolean));
  const anschrift = [];
  if (kunde.name) anschrift.push(String(kunde.name));
  if (kunde.adresse) anschrift.push(...String(kunde.adresse).split(/\r?\n|,\s*/).filter(Boolean));
  const meta = [];
  if (doc.datum) meta.push(`${T.datum}: ${tmj(doc.datum)}`);
  if (doc.gueltigBis) meta.push(`${T.gueltig}: ${tmj(doc.gueltigBis)}`);
  const zeilen = (doc.positionen || []).map((p) => [String(p.beschreibung || '—'), String(p.menge), euro(p.einzelpreisCent), `${p.ustSatz} %`, euro(p.netto)]);
  const summen = [[T.summeNetto, euro(doc.netto)], ...(doc.steuerzeilen || []).filter((z) => z.satz > 0).map((z) => [`USt ${z.satz} %`, euro(z.ust)]), [T.summeBrutto, euro(doc.brutto)]];
  return { titel: `${T.titel} ${doc.nummer || ''}`.trim(), untertitel: String(doc.titel || ''), kopf, anschrift, meta, spalten: [T.pos, T.menge, T.einzel, T.ust, T.netto], zeilen, summen,
    ortDatum: T.ortDatum, unterschrift: T.unterschrift, angenommen: T.angenommen, marke: angebotMarke(doc) };
}
function tmj(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso || ''); }

/** Nur WinAnsi-Zeichen (Helvetica, pdf-lib): alles andere wird „?" — besser als eine Ausnahme mitten im Bau. */
export function winAnsi(s) {
  return String(s == null ? '' : s).replace(/[^\u0000-\u007F -ÿŒœŠšŸŽžƒˆ˜–—‘’‚“”„†‡•…‰‹›€™]/g, '?');
}

/**
 * Das Angebot als PDF (A4, Helvetica, mehrseitig bei vielen Positionen). PDFLib wird hineingereicht.
 * @returns {Promise<{bytes:Uint8Array, seiten:number, feldSeite:number}>}
 */
export async function angebotPdfBauen(PDFLib, doc, { kunde = {}, firma = {}, texte = {} } = {}) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const B = angebotBlatt(doc, kunde, firma, texte);
  const pdf = await PDFDocument.create({ updateMetadata: false });   // sonst schreibt pdf-lib seinen eigenen Producer über unseren
  const font = await pdf.embedFont(StandardFonts.Helvetica), fett = await pdf.embedFont(StandardFonts.HelveticaBold);
  const grau = rgb(0.45, 0.45, 0.45), schwarz = rgb(0.1, 0.1, 0.1), linie = rgb(0.7, 0.7, 0.7);
  const breite = A4.w - 2 * RAND;
  const spaltenX = [RAND, RAND + breite * 0.52, RAND + breite * 0.62, RAND + breite * 0.78, RAND + breite * 0.87];
  const spaltenW = [breite * 0.52 - 6, breite * 0.10 - 6, breite * 0.16 - 6, breite * 0.09 - 6, breite * 0.13];
  const kuerzen = (s, w, f, g) => { s = winAnsi(s); while (s.length > 1 && f.widthOfTextAtSize(s, g) > w) s = s.slice(0, -2) + '…'; return s; };
  const rechts = (page, s, x, w, y, f, g, farbe) => page.drawText(s, { x: x + w - f.widthOfTextAtSize(s, g), y, size: g, font: f, color: farbe || schwarz });
  let page = pdf.addPage([A4.w, A4.h]), y = A4.h - RAND, seiten = 1;
  const fuss = (p) => { p.drawText(winAnsi(B.marke), { x: RAND, y: 28, size: 7, font, color: grau }); };
  const neueSeite = () => { fuss(page); page = pdf.addPage([A4.w, A4.h]); seiten++; y = A4.h - RAND; };
  const text = (s, g, f, farbe, x) => { page.drawText(winAnsi(s), { x: x == null ? RAND : x, y: y - g, size: g, font: f || font, color: farbe || schwarz }); y -= g * 1.35; };
  // Kopf: Firma rechts oben, Kunde links, Titel
  let ky = y;
  for (const z of B.kopf.slice(0, 5)) { rechts(page, kuerzen(z, 220, font, 9), A4.w - RAND - 220, 220, ky - 9, font, 9, grau); ky -= 12; }
  for (const z of B.anschrift.slice(0, 5)) text(z, 10);
  y -= 14;
  text(B.titel, 18, fett);
  if (B.untertitel) text(B.untertitel, 11, font, grau);
  for (const z of B.meta) text(z, 9, font, grau);
  y -= 8;
  // Tabelle
  const kopfzeile = () => {
    B.spalten.forEach((s, i) => { if (i === 0) page.drawText(winAnsi(s), { x: spaltenX[i], y: y - 9, size: 9, font: fett }); else rechts(page, winAnsi(s), spaltenX[i], spaltenW[i], y - 9, fett, 9); });
    y -= 14; page.drawLine({ start: { x: RAND, y }, end: { x: A4.w - RAND, y }, thickness: 0.6, color: linie }); y -= 6;
  };
  kopfzeile();
  for (const z of B.zeilen) {
    if (y < 230) { neueSeite(); kopfzeile(); }
    page.drawText(kuerzen(z[0], spaltenW[0], font, 9.5), { x: spaltenX[0], y: y - 9.5, size: 9.5, font });
    for (let i = 1; i < 5; i++) rechts(page, winAnsi(z[i]), spaltenX[i], spaltenW[i], y - 9.5, font, 9.5);
    y -= 15;
  }
  page.drawLine({ start: { x: RAND, y }, end: { x: A4.w - RAND, y }, thickness: 0.6, color: linie }); y -= 8;
  for (const [i, s] of B.summen.entries()) {
    const f = i === B.summen.length - 1 ? fett : font;
    page.drawText(winAnsi(s[0]), { x: spaltenX[2], y: y - 10, size: 10, font: f });
    rechts(page, winAnsi(s[1]), spaltenX[4], spaltenW[4], y - 10, f, 10);
    y -= 15;
  }
  // Unterschriftsblock immer auf der letzten Seite, feste Lage (dieselbe wie die Felder)
  if (y < 190) neueSeite();
  const U = UNTERSCHRIFT;
  page.drawRectangle({ x: U.hakenX, y: U.hakenY, width: U.hakenKante, height: U.hakenKante, borderColor: schwarz, borderWidth: 0.8 });
  page.drawText(winAnsi(B.angenommen), { x: U.hakenX + U.hakenKante + 6, y: U.hakenY + 2, size: 9.5, font });
  page.drawLine({ start: { x: U.datumX, y: U.linieY }, end: { x: U.datumX + U.datumW, y: U.linieY }, thickness: 0.6, color: schwarz });
  page.drawText(winAnsi(B.ortDatum), { x: U.datumX, y: U.linieY - 11, size: 8, font, color: grau });
  page.drawLine({ start: { x: U.sigX, y: U.linieY }, end: { x: U.sigX + U.sigW, y: U.linieY }, thickness: 0.6, color: schwarz });
  page.drawText(winAnsi(B.unterschrift), { x: U.sigX, y: U.linieY - 11, size: 8, font, color: grau });
  fuss(page);
  pdf.setTitle(B.titel); pdf.setProducer(PRODUCER); pdf.setCreator(CREATOR); pdf.setKeywords([angebotKeywords(doc)]); pdf.setSubject(B.marke);
  pdf.setCreationDate(new Date()); pdf.setModificationDate(new Date());
  return { bytes: await pdf.save(), seiten, feldSeite: seiten - 1 };
}

/** base64 ohne Zeilenumbrüche (Browser und Node). */
export function zuB64(u8) {
  if (typeof Buffer !== 'undefined' && Buffer.from) return Buffer.from(u8).toString('base64');
  let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s);
}

/**
 * Die Arbeitsstand-Datei für Workflow PDF: PDF + Felder (+ Vorschaubild, wenn vorhanden). Kennung je Angebot fest
 * (zweimal geteilt = dort aktualisiert statt verdoppelt, wie bei Workflow Needs → WorkFloh).
 * @returns {{name:string, inhalt:string}}
 */
export function arbeitsstandBauen(doc, pdfBytes, { seiten = 1, feldSeite = 0, thumb = '', jetzt = new Date().toISOString() } = {}) {
  const nummer = String(doc.nummer || doc.id || 'Angebot');
  const pages = Array.from({ length: Math.max(1, seiten) }, () => ({ w: A4.w, h: A4.h, t: [1, 0, 0, -1, 0, A4.h], rot: 0 }));
  const d = { id: 'blp-' + String(doc.id || nummer), name: `Angebot ${nummer}`, folderId: null, quelle: 'pdf', createdAt: jetzt, updatedAt: jetzt,
    pages, thumb: thumb || '', fields: angebotFelder(feldSeite), blp: { angebotId: String(doc.id || ''), nummer } };
  const inhalt = JSON.stringify({ format: STAND_FORMAT, version: STAND_VERSION, gesichert: jetzt, doc: d, pdf: zuB64(pdfBytes) });
  return { name: `Angebot-${nummer.replace(/[^\w.-]+/g, '_')}.workfloh.json`, inhalt };
}
