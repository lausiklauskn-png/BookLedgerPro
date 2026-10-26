// src/domain/bankschema.js
// Schema-/Struktur-Validierung des Bankimports — SWIFT MT940 (Feldformate) und
// ISO 20022 CAMT (.052/.053/.054, Nachrichten-Struktur). REINE Funktionen, kein
// Netz, kein DOM. Ergänzt `pruefeBankauszug()` aus `bankimport.js`:
//   • `pruefeBankauszug()` = SEMANTISCHE Integrität des bereits geparsten Auszugs
//     (Schlusssaldo == Anfangssaldo ± Umsätze, fehlende Felder).
//   • dieses Modul = STRUKTUR/FORMAT des ROH-Auszugs gegen die dokumentierten
//     SWIFT-/ISO-20022-Vorgaben (Pflichtfelder, Feldformate, Reihenfolge,
//     Nachrichten-Container, Amt-Währungsattribut, CdtDbtInd-Werte …).
//
// EHRLICHE GRENZE (nicht beschönigen): Dies ist eine **Struktur-/Feldformat-Prüfung
// nach den dokumentierten Spezifikationen** (SWIFT FIN MT940-Feldbeschreibung bzw.
// die ISO-20022-Nachrichten-Struktur von camt.052/053/054) — KEINE zertifizierte
// XSD-Validierung (ein echter XSD-Validator ist nicht build-frei) und KEINE
// SWIFT-Netzwerk-Konformitätsprüfung. Es wird KEINE Konformität behauptet, die nicht
// belegt ist; reale Bank-Dialekte weichen ab → strittige Punkte sind WARNUNGEN
// (nicht-blockierend), nur klare Verstöße sind FEHLER. Konservativ: im Zweifel mild.

import { parseEuroToCents } from './money.js';
import { erkenneBankformat } from './bankimport.js';

// ---- gemeinsame Format-Helfer ----------------------------------------------

// YYMMDD (MT940-Datum, 2-stelliges Jahr) plausibel? Nur Monat/Tag im Bereich.
function gueltigYYMMDD(s) {
  if (!/^\d{6}$/.test(s)) return false;
  const mm = +s.slice(2, 4), dd = +s.slice(4, 6);
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}
// MMDD (MT940 Buchungsdatum im :61:) plausibel?
function gueltigMMDD(s) {
  if (!/^\d{4}$/.test(s)) return false;
  const mm = +s.slice(0, 2), dd = +s.slice(2, 4);
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}
// SWIFT-Betrag „15d": Ziffern mit genau EINEM Dezimalkomma, gesamt ≤ 15 Zeichen
// (inkl. Komma), mindestens eine Ziffer. (Punkt ist im FIN-Format NICHT erlaubt.)
function gueltigBetrag15d(s) {
  if (!/^\d{1,15}(,\d*)?$/.test(s)) return false;
  return s.length <= 15;
}

// ---- MT940 (SWIFT) ----------------------------------------------------------

// Roh-Auszug in Felder zerlegen; Fortsetzungszeilen (z. B. mehrzeiliges :86:
// oder das 34x-Zusatzfeld eines :61:) werden an das vorige Feld angehängt.
// `wert` = erste Zeile (für Formatprüfung), `roh` = inkl. Fortsetzung.
function mt940Felder(text) {
  const zeilen = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const felder = [];
  for (const z of zeilen) {
    const m = z.match(/^:(\d{2}[A-Z]?):(.*)$/);
    if (m) {
      felder.push({ tag: m[1], wert: m[2], roh: m[2] });
    } else if (felder.length && z.trim() !== '' && z.trim() !== '-') {
      felder[felder.length - 1].roh += `\n${z}`;
    }
  }
  return felder;
}

// Saldo-Feld (:60a:/:62a:/:64:/:65:) prüfen → {ok, currency?}.
// Form 1!a6!n3!a15d: C|D, YYMMDD, 3-Buchstaben-Währung, Betrag.
function pruefeSaldoFeld(wert) {
  const m = String(wert).trim().match(/^([CD])(\d{6})([A-Z]{3})(.+)$/);
  if (!m) return { ok: false };
  if (!gueltigYYMMDD(m[2])) return { ok: false, grund: 'datum' };
  if (!gueltigBetrag15d(m[4])) return { ok: false, grund: 'betrag' };
  return { ok: true, currency: m[3] };
}

// Statement-Line :61: prüfen. Front: 6!n[4!n]2a[1!a]15d1!a3!c…
// Pflicht hier: gültiges Valuta-Datum, D/C-Markierung, gültiger Betrag.
function pruefe61(wert, fehler, warnungen) {
  const v = String(wert);
  const m = v.match(/^(\d{6})(\d{4})?(RC|RD|EC|ED|C|D)([A-Z])?(\d{1,15}(?:,\d*)?)([A-Z][A-Z0-9]{3})?/);
  if (!m) { fehler.push({ code: 'format', tag: '61', detail: '6!n[4!n]2a[1!a]15d1!a3!c' }); return; }
  if (!gueltigYYMMDD(m[1])) fehler.push({ code: 'datum', tag: '61', detail: 'Valuta YYMMDD' });
  if (m[2] && !gueltigMMDD(m[2])) warnungen.push({ code: 'datum', tag: '61', detail: 'Buchungsdatum MMDD' });
  if (!gueltigBetrag15d(m[5])) fehler.push({ code: 'format', tag: '61', detail: 'Betrag 15d' });
  // Geschäftsvorfall-Code 1!a3!c (z. B. NTRF/NMSC) ist Pflicht laut Spezifikation,
  // wird von manchen Exporten weggelassen → Warnung, kein Fehler.
  if (!m[6]) warnungen.push({ code: 'gvc-fehlt', tag: '61' });
}

/**
 * Validiert einen MT940-Auszug strukturell gegen die SWIFT-FIN-Feldbeschreibung.
 * @returns {{ok:boolean, format:'MT940', fehler:Array<{code:string,tag?:string,detail?:string}>,
 *   warnungen:Array, tags:string[], anzahlUmsaetze:number}}
 */
export function validiereMT940(text) {
  const fehler = [];
  const warnungen = [];
  const felder = mt940Felder(text);
  const tags = felder.map((f) => f.tag);
  if (!felder.length) {
    fehler.push({ code: 'leer' });
    return { ok: false, format: 'MT940', fehler, warnungen, tags, anzahlUmsaetze: 0 };
  }

  const hat = (t) => tags.includes(t);
  // Pflichtfelder: :20: :25: :28C: :60a: :62a:
  if (!hat('20')) fehler.push({ code: 'pflichtfeld-fehlt', tag: '20' });
  if (!hat('25')) fehler.push({ code: 'pflichtfeld-fehlt', tag: '25' });
  if (!hat('28C')) {
    if (hat('28')) warnungen.push({ code: 'feld-nichtstandard', tag: '28', detail: 'erwartet :28C:' });
    else fehler.push({ code: 'pflichtfeld-fehlt', tag: '28C' });
  }
  if (!hat('60F') && !hat('60M')) fehler.push({ code: 'pflichtfeld-fehlt', tag: '60a' });
  if (!hat('62F') && !hat('62M')) fehler.push({ code: 'pflichtfeld-fehlt', tag: '62a' });

  // Feldformate je Feld.
  let waehrung = null;
  let umsaetze = 0;
  for (const f of felder) {
    const v = f.wert.trim();
    switch (f.tag) {
      case '20':
      case '21':
        if (v.length < 1 || v.length > 16) fehler.push({ code: 'format', tag: f.tag, detail: 'max 16 Zeichen (16x)' });
        break;
      case '25':
        if (v.length < 1 || v.length > 35) fehler.push({ code: 'format', tag: '25', detail: 'max 35 Zeichen (35x)' });
        break;
      case '28C':
      case '28':
        if (!/^\d{1,5}(\/\d{1,5})?$/.test(v)) fehler.push({ code: 'format', tag: f.tag, detail: '5n[/5n]' });
        break;
      case '60F': case '60M': case '62F': case '62M': case '64': case '65': {
        const r = pruefeSaldoFeld(v);
        if (!r.ok) fehler.push({ code: 'format', tag: f.tag, detail: '1!a6!n3!a15d' });
        else if (waehrung && r.currency && r.currency !== waehrung) warnungen.push({ code: 'waehrung-uneinheitlich', tag: f.tag, detail: `${waehrung}/${r.currency}` });
        else if (r.currency && !waehrung) waehrung = r.currency;
        break;
      }
      case '61':
        umsaetze++;
        pruefe61(f.wert, fehler, warnungen);
        break;
      case '86':
        // 6*65x → max 6 Zeilen à 65 Zeichen; nur grobe Obergrenze als Warnung.
        if (f.roh.replace(/\n/g, '').length > 6 * 65) warnungen.push({ code: 'feld-lang', tag: '86' });
        break;
      default:
        warnungen.push({ code: 'feld-unbekannt', tag: f.tag });
    }
  }

  // Reihenfolge (SWIFT-Sequenz) als WARNUNG (Dialekte ordnen teils um):
  // :20: < :25: < :28C: < :60a: < (:61:/:86:) < :62a:.
  const erstesVon = (...ts) => {
    for (let i = 0; i < tags.length; i++) if (ts.includes(tags[i])) return i;
    return -1;
  };
  const i20 = erstesVon('20'), i25 = erstesVon('25'), i28 = erstesVon('28C', '28');
  const i60 = erstesVon('60F', '60M'), i62 = erstesVon('62F', '62M');
  const folge = [['20', i20], ['25', i25], ['28C', i28], ['60a', i60], ['62a', i62]].filter(([, i]) => i >= 0);
  for (let k = 1; k < folge.length; k++) {
    if (folge[k][1] < folge[k - 1][1]) warnungen.push({ code: 'reihenfolge', tag: folge[k][0], detail: `nach ${folge[k - 1][0]} erwartet` });
  }
  // :61:/:86: müssen zwischen :60a: und :62a: liegen.
  if (i60 >= 0 && i62 >= 0) {
    felder.forEach((f, i) => {
      if (f.tag === '61' && (i < i60 || i > i62)) warnungen.push({ code: 'reihenfolge', tag: '61', detail: 'zwischen :60a: und :62a: erwartet' });
    });
  }

  return { ok: fehler.length === 0, format: 'MT940', fehler, warnungen, tags, anzahlUmsaetze: umsaetze };
}

// ---- CAMT (ISO 20022, XML) --------------------------------------------------

// Erstes Element mit lokalem Namen (Namespace-Präfix egal) → Innentext.
function xmlBlock(xml, local) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`));
  return m ? m[1] : null;
}
// Alle Elemente mit lokalem Namen → Liste der Innentexte.
function xmlAlle(xml, local) {
  const re = new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`, 'g');
  const out = []; let m;
  while ((m = re.exec(String(xml)))) out.push(m[1]);
  return out;
}
// Selbst-schließende oder leere Elemente (z. B. <Sts><Cd>BOOK</Cd></Sts>) sicher
// als „vorhanden" erkennen.
function xmlHat(xml, local) {
  return new RegExp(`<(?:[\\w.-]+:)?${local}\\b`).test(String(xml));
}
// Öffnendes-Tag-Attribute des ersten Elements (für <Amt Ccy="EUR">).
function xmlAttr(xml, local, attr) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b([^>]*)>`));
  if (!m) return null;
  const a = m[1].match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`));
  return a ? a[1] : null;
}

const CAMT_VARIANTEN = {
  '052': { container: 'BkToCstmrAcctRpt', stmt: 'Rpt', name: 'camt.052 (Intraday-Report)' },
  '053': { container: 'BkToCstmrStmt', stmt: 'Stmt', name: 'camt.053 (Tagesauszug)' },
  '054': { container: 'BkToCstmrDbtCdtNtfctn', stmt: 'Ntfctn', name: 'camt.054 (Soll-/Haben-Avis)' },
};

/**
 * Validiert einen CAMT-Auszug strukturell gegen die ISO-20022-Nachrichten-Struktur
 * von camt.052/.053/.054 (Pflicht-Container/Elemente, Amt-Währungsattribut,
 * CdtDbtInd-Werte, Datums-/Status-Angaben). KEINE XSD-Validierung.
 * @returns {{ok:boolean, format:'CAMT', variante:string|null, version:string|null,
 *   fehler:Array, warnungen:Array, anzahlUmsaetze:number}}
 */
export function validiereCAMT(xml) {
  const s = String(xml || '');
  const fehler = [];
  const warnungen = [];

  // 1) Wurzel <Document> + Namespace → Variante/Version bestimmen.
  if (!xmlHat(s, 'Document')) warnungen.push({ code: 'wurzel-fehlt', detail: '<Document> nicht gefunden' });
  const ns = s.match(/urn:iso:std:iso:20022:tech:xsd:camt\.(05[234])\.001\.(\d{2})/i);
  let variante = ns ? ns[1] : null;
  const version = ns ? ns[2] : null;
  if (!variante) {
    // Fallback: Variante über den vorhandenen Statement-Container erkennen.
    for (const [v, def] of Object.entries(CAMT_VARIANTEN)) if (xmlHat(s, def.stmt)) { variante = v; break; }
    warnungen.push({ code: 'namespace-unbekannt', detail: 'kein camt.05x-XSD-Namespace erkannt' });
  }
  const def = variante ? CAMT_VARIANTEN[variante] : null;

  // 2) Nachrichten-Container (BkToCstmr…) muss zur Variante passen.
  if (def && !xmlHat(s, def.container)) fehler.push({ code: 'container-fehlt', detail: `<${def.container}> erwartet (${def.name})` });

  // 3) Group Header: <GrpHdr> mit <MsgId> + <CreDtTm> (Pflicht in allen camt).
  const grpHdr = xmlBlock(s, 'GrpHdr');
  if (!grpHdr) fehler.push({ code: 'pflicht-fehlt', detail: '<GrpHdr>' });
  else {
    if (!xmlHat(grpHdr, 'MsgId')) fehler.push({ code: 'pflicht-fehlt', detail: '<GrpHdr>/<MsgId>' });
    if (!xmlHat(grpHdr, 'CreDtTm')) fehler.push({ code: 'pflicht-fehlt', detail: '<GrpHdr>/<CreDtTm>' });
  }

  // 4) Statement-Container (<Stmt>/<Rpt>/<Ntfctn>) mit <Id> + <Acct> (Pflicht).
  const stmt = def ? xmlBlock(s, def.stmt) : (xmlBlock(s, 'Stmt') || xmlBlock(s, 'Rpt') || xmlBlock(s, 'Ntfctn'));
  if (!stmt) {
    fehler.push({ code: 'statement-fehlt', detail: def ? `<${def.stmt}>` : '<Stmt>/<Rpt>/<Ntfctn>' });
  } else {
    if (!xmlHat(stmt, 'Id')) fehler.push({ code: 'pflicht-fehlt', detail: 'Statement/<Id>' });
    if (!xmlHat(stmt, 'Acct')) fehler.push({ code: 'pflicht-fehlt', detail: 'Statement/<Acct>' });
  }

  // 5) Salden: camt.053 verlangt mindestens Anfangs- (OPBD) und Schluss-Saldo (CLBD).
  if (stmt && variante === '053') {
    const codes = xmlAlle(stmt, 'Bal').map((b) => (xmlBlock(b, 'Tp') ? (xmlBlock(xmlBlock(b, 'Tp'), 'Cd') || '') : '').toUpperCase());
    if (!codes.some((c) => c === 'OPBD' || c === 'PRCD')) warnungen.push({ code: 'saldo-fehlt', detail: 'kein Anfangssaldo (OPBD/PRCD)' });
    if (!codes.some((c) => c === 'CLBD' || c === 'CLAV')) warnungen.push({ code: 'saldo-fehlt', detail: 'kein Schlusssaldo (CLBD/CLAV)' });
  }

  // 6) Umsätze <Ntry>: Amt mit Ccy, CdtDbtInd ∈ {CRDT,DBIT}, Status, Datum.
  const ntries = stmt ? xmlAlle(stmt, 'Ntry') : xmlAlle(s, 'Ntry');
  ntries.forEach((n, i) => {
    const idx = i + 1;
    if (!xmlHat(n, 'Amt')) {
      fehler.push({ code: 'ntry-amt-fehlt', detail: `Ntry #${idx}` });
    } else {
      const ccy = xmlAttr(n, 'Amt', 'Ccy');
      if (!ccy) fehler.push({ code: 'ntry-ccy-fehlt', detail: `Ntry #${idx}: <Amt> ohne Ccy-Attribut` });
      else if (!/^[A-Z]{3}$/.test(ccy)) fehler.push({ code: 'ntry-ccy-format', detail: `Ntry #${idx}: Ccy="${ccy}"` });
      if (parseEuroToCents((xmlBlock(n, 'Amt') || '').trim()) == null) fehler.push({ code: 'ntry-amt-format', detail: `Ntry #${idx}` });
    }
    const cdi = (xmlBlock(n, 'CdtDbtInd') || '').trim().toUpperCase();
    if (!cdi) fehler.push({ code: 'ntry-cdtdbt-fehlt', detail: `Ntry #${idx}` });
    else if (cdi !== 'CRDT' && cdi !== 'DBIT') fehler.push({ code: 'ntry-cdtdbt-wert', detail: `Ntry #${idx}: "${cdi}"` });
    // Status <Sts> (BOOK/PDNG/INFO) ist Pflicht laut XSD; viele Exporte lassen ihn weg → Warnung.
    if (!xmlHat(n, 'Sts')) warnungen.push({ code: 'ntry-status-fehlt', detail: `Ntry #${idx}` });
    // Mindestens ein Datum (BookgDt/ValDt mit Dt oder DtTm).
    if (!xmlHat(n, 'BookgDt') && !xmlHat(n, 'ValDt')) warnungen.push({ code: 'ntry-datum-fehlt', detail: `Ntry #${idx}` });
  });

  return { ok: fehler.length === 0, format: 'CAMT', variante, version, fehler, warnungen, anzahlUmsaetze: ntries.length };
}

/**
 * Einheitlicher Einstieg: erkennt MT940 oder CAMT (über `erkenneBankformat`) und
 * validiert strukturell. Unbekanntes Format → ein Fehler `format-unbekannt`.
 * @returns {{ok:boolean, format:string|null, fehler:Array, warnungen:Array, [k:string]:any}}
 */
export function validiereBankauszug(text) {
  const format = erkenneBankformat(text);
  if (format === 'MT940') return validiereMT940(text);
  if (format === 'CAMT') return validiereCAMT(text);
  return { ok: false, format: null, fehler: [{ code: 'format-unbekannt' }], warnungen: [], anzahlUmsaetze: 0 };
}
