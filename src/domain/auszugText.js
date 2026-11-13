// src/domain/auszugText.js
// Leser „Text eines Kontoauszugs → Umsätze“ (rein, testbar, kein Netz, kein DOM).
// Quelle: der Text eines Kontoauszugs, wie er aus einem PDF (Textebene) oder aus der
// Texterkennung (OCR) kommt. Liefert dieselbe Form wie parseBankauszug (bankimport.js)
// mit format 'text' und zusätzlich je Umsatz `unsicher`/`grund`, `rechnungsnummern`,
// sowie `saldoStimmt` und `warnungen` für den ganzen Auszug.
//
// Allgemein gebaut, nicht für eine Bank: erkennt Umsatzzeilen am Datum vorn (TT.MM.,
// TT.MM.JJ, TT.MM.JJJJ, JJJJ-MM-TT, auch zwei Daten Buchung/Wert) und am Betrag hinten
// (Vorzeichen vorn oder hinten, „S“/„H“, „Soll“/„Haben“, CR/DR, oder getrennte Spalten
// Soll/Haben bzw. Belastung/Gutschrift über die Spaltenlage der Kopfzeile). Mehrzeilige
// Verwendungszwecke werden angehängt; Seitenumbrüche (Übertrag, Blatt/Seite, wiederholte
// Kopfzeile) und Fußzeilen (Hinweise der Bank) werden übersprungen.
//
// EHRLICHER HINWEIS: Der Text ist eine Lesung, keine Buchung. Darum rechnet der Leser
// Anfangssaldo + Umsätze gegen den Endsaldo (und, falls gedruckt, gegen „Summe
// Belastungen/Gutschriften“). Unleserliche Beträge (Texterkennung) werden nur dann
// eingesetzt, wenn genau eine Lesart die Gegenrechnung schließt — auch dann bleibt die
// Zeile „unsicher“. Stimmt die Gegenrechnung nicht, sind ALLE Umsätze unsicher. Keine
// Zeile wird still verworfen: was wie ein Umsatz aussieht, aber keinen lesbaren Betrag
// hat, kommt mit betragCent null und Grund zurück.

// ---------- kleine Helfer ----------

const BETRAG_KERN = String.raw`(?:\d{1,3}(?:[.']\d{3})+|\d+)[,.]\d{2}`;
// Betrag mit Vorzeichen/Kennzeichen, am Zeilenende (danach höchstens EUR/€).
const BETRAG_ENDE = new RegExp(String.raw`([+\-])?\s?(${BETRAG_KERN})(?![\d])\s?[.°'"]?\s?([+\-]|S\b|H\b|Soll\b|Haben\b|CR\b|DR\b|Cr\b|Dr\b)?\s*(?:EUR|€)?\s*$`, 'i');
const BETRAG_ALLE = new RegExp(String.raw`([+\-])?\s?(${BETRAG_KERN})(?![\d])\s?([+\-](?![\d])|S\b|H\b|Soll\b|Haben\b|CR\b|DR\b)?`, 'gi');

function centAus(kern) {
  // Letztes Trennzeichen vor genau zwei Ziffern ist das Komma; alles davor sind Tausender.
  const m = String(kern).match(/^(.*)[,.](\d{2})$/);
  if (!m) return null;
  const ganz = m[1].replace(/[.']/g, '');
  if (!/^\d+$/.test(ganz)) return null;
  return Number(ganz) * 100 + Number(m[2]);
}

function kennzeichenRichtung(vorne, hinten) {
  const h = String(hinten || '').toLowerCase();
  if (vorne === '-' || h === '-' || h === 's' || h === 'soll' || h === 'dr') return 'ausgabe';
  if (vorne === '+' || h === '+' || h === 'h' || h === 'haben' || h === 'cr') return 'einnahme';
  return null;
}

// Texterkennung: O/o statt 0, l/I statt 1 in Zifferngruppen.
function ziffernFix(s) {
  return String(s).replace(/[OoIl](?=[\d.,]*\d)|(?<=\d[\d.,]*)[OoIl]/g, (c) => (c === 'O' || c === 'o' ? '0' : '1'));
}

function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

// ---------- Datum ----------

const DATUM_VORN = /^\s*([0-9OoIl]{1,2})[.,]([0-9OoIl]{1,2})[.,]?((?:[0-9OoIl]{4}|[0-9OoIl]{2})(?![\d.,:]))?/;
const ISO_VORN = /^\s*(\d{4})-(\d{2})-(\d{2})/;

function zahl(s) { return Number(ziffernFix(s)); }

/** Liest ein oder zwei Daten am Zeilenanfang. @returns {{daten:Array<{t,m,j}>, rest:string}|null} */
function datenVorn(zeile) {
  let rest = zeile;
  const daten = [];
  for (let i = 0; i < 2; i++) {
    let m = rest.match(ISO_VORN);
    let d;
    if (m) d = { t: Number(m[3]), m: Number(m[2]), j: Number(m[1]) };
    else {
      m = rest.match(DATUM_VORN);
      if (!m) break;
      // „08.57“ (Uhrzeit) oder „1.OG“ sind kein Datum: Tag/Monat prüfen; ohne Jahr muss ein Punkt folgen,
      // es sei denn, ein zweites Datum oder Leerraum schließt sich an.
      d = { t: zahl(m[1]), m: zahl(m[2]), j: m[3] ? zahl(m[3]) : null };
      if (d.j != null && d.j < 100) d.j += 2000;
      const ende = m[0];
      if (!d.j && !/[.,]$/.test(ende) && i === 0 && !/^\s/.test(rest.slice(ende.length))) break;
      // Zweites Datum ohne Punkt nach einem ersten mit Punkt ist eine Uhrzeit („11.03. 16.04 GIROCARD“).
      if (i === 1 && !d.j && !/[.,]$/.test(ende) && daten[0] && daten[0]._punkt) break;
      d._punkt = /[.,]$/.test(ende);
    }
    if (!(d.t >= 1 && d.t <= 31 && d.m >= 1 && d.m <= 12)) break;
    daten.push(d);
    rest = rest.slice(m[0].length).replace(/^\s*[/|]?\s*/, (x) => (x.includes('/') || x.includes('|') ? ' ' : x));
    if (!/^\s/.test(rest) && rest.length) {
      // Datum klebt an Text („03.03.SEPA…“) — nur gelten lassen, wenn es ein vollständiges TT.MM. war.
      if (i === 0 && !/[.,]$/.test(m[0])) return null;
    }
  }
  if (!daten.length) return null;
  return { daten, rest };
}

function iso(d, jahrFuer) {
  if (!d) return '';
  const j = d.j || jahrFuer(d);
  if (!j) return '';
  return `${j}-${String(d.m).padStart(2, '0')}-${String(d.t).padStart(2, '0')}`;
}

// ---------- Zeilenarten ----------

const SALDO_WORT = /(kontostand|saldo|guthaben\s+(?:am|vom)|stand\s+(?:am|vom)|anfangsbestand|endbestand|schlussbestand)/i;
const SALDO_ALT = /(alt|anfang|vortrag|vorher|letzt|start|eröffnung|eroeffnung|vorig)/i;
const SALDO_NEU = /(neu|end|schluss|aktuell)/i;
const UEBERTRAG = /(übertrag|uebertrag|ubertrag|zwischensumme|vortrag\s+(?:auf|von)\s+(?:blatt|seite))/i;
const SEITE = /^\s*(?:(?:seite|blatt)\s+\d+(?:\s*(?:von|\/)\s*\d+)?|-\s*\d+\s*-)\s*$/i;
const SUMME = /\bsumme\b|\bsummen\b|\bgesamtumsatz|\bumsatzsumme/i;
// Hinweise der Bank am Fuß einer Seite — beenden einen Verwendungszweck.
const FUSS = /(einwendungen|kontoüberziehung|kontoueberziehung|sollzins|habenzins|bitte prüfen|bitte pruefen|vorstand|aufsichtsrat|handelsregister|\bhrb\b|\bgenr\b|amtsgericht|ust-?id|rechnungsabschluss\s+gilt|einlagensicherung|seite\s+\d+\s+von\s+\d+|blatt\s+\d+\s+von\s+\d+|kontoauszug\s+nr|auszug\s+nr)/i;
const TRENNER = /^\s*[-=_*·.]{8,}\s*$/;
const KOPF = /(bu-?tag|buchungs?tag|buchung|datum|valuta|wert(?:stellung)?)\b.*\b(betrag|umsatz|soll|haben|belastung|gutschrift|eur)\b/i;

// Buchungsarten (der „Vorgang“ in der Umsatzzeile), nach Richtung, wo sie eindeutig sind.
const ART_EIN = /(gutschrift|zahlungseingang|eingang|lohn|gehalt|rente|erstattung|zinsgutschrift|bareinzahlung|einzahlung|habenzins|überweisungseingang|ueberweisungseingang)/i;
const ART_AUS = /(lastschrift|abbuchung|kartenzahlung|kartenumsatz|girocard|maestro|debitkarte|entgelt|gebühr|gebuehr|barauszahlung|bargeldauszahlung|auszahlung|geldautomat|dauerauftrag|überweisung|ueberweisung|echtzeit|online-?banking|kontoführung|kontofuehrung|abschluss|sollzins)/i;
const BUCHUNGSART = /^(?:(?:sepa|basis|firmen|echtzeit|online|dauer|einzel|sammel|euro)[-\s]?)*(?:lastschrift(?:einzug)?|basislastschrift|überweisung(?:sgutschrift)?|ueberweisung(?:sgutschrift)?|gutschrift|dauerauftrag|kartenzahlung|kartenumsatz|girocard|entgelt(?:abrechnung|abschluss)?|abschluss|abrechnung|zinsen|rechnungsabschluss|bargeldauszahlung|barauszahlung|bareinzahlung|auszahlung|einzahlung|umbuchung|zahlungseingang|zahlungsausgang|lohn|gehalt|rente|storno|rückbuchung|rueckbuchung|retoure|kontoführung|kontofuehrung|gebühren|gebuehren)(?:\s+(?:girocard|maestro|visa|debit|inland|ausland|sepa|online|beleglos|lastschrift))*\b[\s:.-]*/i;
const BANKINTERN = /^(?:entgelt|abschluss|rechnungsabschluss|zinsen|kontoführung|kontofuehrung|gebühren|gebuehren|sollzins|habenzins)/i;
const BAR = /^(?:bargeld\w*|bar(?:auszahlung|einzahlung|geld)\w*|geldautomat\w*|auszahlung\s+(?:geldautomat|ga)\b|einzahlung\b)/i;
const FIRMENNAME = /\b(bank|sparkasse|eg|ag|gmbh|kasse|se|kg)\b/i;

// ---------- Rechnungsnummern ----------

// Kennwörter, nach denen eine Rechnungs-/Belegnummer steht (Groß/Klein egal).
const RE_KENN = String.raw`(?:rechnungs?(?:-?\s?(?:nummer|nr)\.?)?|rechn\.?|rg\.?\s?-?\s?nr\.?|rg\.?|re\.?\s?-?\s?nr\.?|re\.?|r\.?-?nr\.?|beleg(?:-?\s?nr\.?|nummer)?|invoice(?:\s?(?:no|nr|number|#)\.?)?|inv\.?\s?(?:no\.?)?|schlussrechnung|abschlagsrechnung|teilrechnung|gutschrift(?:s-?nr\.?)?)`;
const KENN_RE = new RegExp(String.raw`(?<![A-Za-zÄÖÜäöüß])${RE_KENN}(?:\s?(?:nr|no|nummer)\.?)?\s?[:.#]?\s?(?=[A-Z]{0,4}-?\d)`, 'gi');
// Die Nummer selbst (Groß-/Kleinschreibung zählt): Ziffern, Bindestriche, Schrägstriche, kurze Buchstabenteile
// („RE-2025-0102“, „2025-Q4-017“, „26-ER-0081447“, „2026/17“, „2026 0087“).
const NR_RE = /(?:[A-Z]{1,4}-?)?\d[\dA-Z]*(?:[-\/.](?=[\dA-Z]*\d|[A-Z]{1,3}[-\/]\d)[\dA-Z]+)*(?:\s\d{2,}(?=\s|$)|\s\d{3,}(?![\d,.]))*/y;
// Nummern mit Rechnungs-Vorsatz ohne Kennwort: RE-2025-0102, AR-2025-0231, SR-2026-164, GS-2025-0031.
const RE_VORSATZ = /(?<![A-Za-z0-9-])((?:RE|RG|AR|SR|GS|TR)-\d{2,4}[-\/]\d{2,}[\dA-Z-]*)/g;
// Übliche Belegnummer aus Kürzel, Jahr und laufender Nummer: AK-25-1047, ZM-2026-01877, B-2025-0417.
const JAHR_NR = /(?<![A-Za-z0-9-])([A-Z]{1,3}-(?:\d{2}|(?:19|20)\d{2})-\d{3,7})(?![\dA-Za-z-])/g;
// Was KEINE Rechnungsnummer ist (Kennwort direkt davor).
const KEINE_NR = /(kd|kunden?|kundennr|mandat|mandats|vertrag|vertrags|vk|kassenzeichen|kz|stnr|st\.?-?nr|steuer\w*|mitgl|mitglieds\w*|rv-?nr|iban|bic|auftrag|az|aktenzeichen|police|versicherungsschein|vs-?nr|personal\w*|ref|referenz|end-?to-?end|eref|mref|cred|gläubiger-?id|glaeubiger-?id)\.?\s?-?\s?(?:nr\.?|nummer)?\s?[:.]?\s?$/i;

/** Liest eine Nummer ab Stelle `ab` (für Rechnungsnummern). @returns {string} */
export function nummerAb(text, ab) {
  NR_RE.lastIndex = ab;
  const m = NR_RE.exec(String(text || ''));
  return m ? m[0] : '';
}

function nummernSammeln(liste) {
  const fest = (x) => x.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const out = [];
  for (const roh of liste) {
    const n = String(roh || '').trim().replace(/^[-\/.]+|[-\/.,;:]+$/g, '');
    if ((n.match(/\d/g) || []).length < 3) continue;
    if (/^\d{1,2}\.\d{1,2}\.(\d{2,4})?$/.test(n)) continue;          // Datum
    if (/^(19|20)\d{2}$/.test(n)) continue;                         // nur ein Jahr
    if (/^[A-Z]{2}\d{2}(?:\s?[0-9A-Z]{4}){3,}/.test(n)) continue;    // IBAN
    const k = fest(n);
    const i = out.findIndex((x) => fest(x).includes(k) || k.includes(fest(x)));
    if (i < 0) out.push(n);
    else if (k.length > fest(out[i]).length) out[i] = n;            // die längere Schreibweise behalten
  }
  return out;
}

/**
 * Rechnungsnummern aus einem Verwendungszweck (best-effort, lieber leer als falsch).
 * Kunden-, Mandats-, Vertragsnummern, Kassenzeichen, Steuernummern und IBAN sind keine.
 * @returns {string[]}
 */
export function rechnungsnummernAusZweck(zweck, opts = {}) {
  const s = String(zweck || '');
  const funde = [];
  let m;
  KENN_RE.lastIndex = 0;
  while ((m = KENN_RE.exec(s))) {
    const davor = s.slice(Math.max(0, m.index - 20), m.index);
    if (/(kd|kunden?|vertrag|mandat)[\s.-]*$/i.test(davor)) continue;
    const nr = nummerAb(s, m.index + m[0].length);
    if (nr) funde.push(nr);
  }
  // Kürzel-Jahr-Nummer ohne Kennwort nur bei Zahlungen, die wir leisten: bei Eingängen von Kassen und Ämtern
  // sind solche Kürzel meist Schadens-, Leistungs- oder Versichertennummern.
  for (const re of opts.richtung === 'ausgabe' ? [RE_VORSATZ, JAHR_NR] : [RE_VORSATZ]) {
    re.lastIndex = 0;
    while ((m = re.exec(s))) {
      if (KEINE_NR.test(s.slice(0, m.index))) continue;
      funde.push(m[1]);
    }
  }
  return nummernSammeln(funde);
}

// ---------- Betrag am Zeilenende ----------

/**
 * Liest den Betrag (oder zwei: Betrag + laufender Saldo) am Zeilenende.
 * @returns {{cent:number, vorne:string, hinten:string, start:number, ende:number, zweiter?:object}|{unleserlich:string, start:number}|null}
 */
function betragHinten(zeile, mitBuchstaben = false) {
  // Leerraum am Komma („1.177, 18H“, „1.142 ,378H“) gehört nicht in den Betrag.
  const z = zeile.replace(/\s+$/, '').replace(/(\d)\s?([,.])\s?(\d{2}(?:\S{0,3})?)$/, '$1$2$3');
  const fix = z.replace(/[0-9OoIl.,']+(?:\s?[SH5$8+\-])?\s*$/, (x) => ziffernFix(x));
  const m = fix.match(BETRAG_ENDE);
  if (m) {
    const cent = centAus(m[2]);
    if (cent != null) {
      const start = m.index + (m[0].length - m[0].replace(/^\s+/, '').length);
      const res = { cent, vorne: m[1] || '', hinten: m[3] || '', start, ende: fix.length };
      // Zweiter Betrag davor? (Spalten Betrag + Saldo, oder Soll + Haben)
      const davor = fix.slice(0, start).replace(/\s+$/, '');
      const m2 = davor.match(BETRAG_ENDE);
      if (m2 && /\s{2,}$|\s$/.test(fix.slice(0, start)) && centAus(m2[2]) != null) {
        const s2 = m2.index + (m2[0].length - m2[0].replace(/^\s+/, '').length);
        res.zweiter = { cent: centAus(m2[2]), vorne: m2[1] || '', hinten: m2[3] || '', start: s2, ende: davor.length };
      }
      return res;
    }
  }
  // Unleserlicher Betrag: Ziffernhaufen am Ende (z. B. „95,2055“, „3919535“, „23,190 5“).
  const u = fix.match(/(?:^|\s)((?:[\d.,']*\d[\d.,']*)(?:[°.]?\s?[\dSHsh$°]{1,3})?)\s*$/);
  if (u && (u[1].match(/\d/g) || []).length >= 3 && /[,.]|\d{5,}/.test(u[1])) {
    return { unleserlich: u[1], start: u.index + u[0].indexOf(u[1]) };
  }
  if (mitBuchstaben) {
    // Ganz verlesener Betrag mit Buchstaben dazwischen („1e1777, 1880“, „Ae177180h“): nur die Ziffern zählen.
    const w = fix.match(/(?:^|\s)((?:\S*\d\S*)(?:\s\S*\d\S*){0,2})\s*$/);
    if (w && (w[1].match(/\d/g) || []).length >= 4) return { unleserlich: w[1], start: w.index + w[0].indexOf(w[1]), ganzVerlesen: true };
  }
  return null;
}

// Mögliche Lesarten eines unleserlichen Betrags (Kosten steigen mit der Gewagtheit).
function lesarten(roh, mitKennzeichen) {
  const out = [];
  const s = roh.replace(/\s/g, '');
  const kenn = (rest) => {
    if (!rest) return { r: null, ok: true };
    // Kennzeichen hinten, davor höchstens ein verlesenes Zeichen (Leerraum als „5“, „°“, „.“).
    const m = rest.match(/^[\d°.'"]?([S5$sH8h])$/) || rest.match(/^([S5$s]{2}|[H8h]{2})$/);
    if (!m) return /^[\d°.'"]$/.test(rest) ? { r: null, ok: true, junk: true } : { r: null, ok: false };
    return { r: /[S5$s]/.test(m[1].slice(-1)) ? 'ausgabe' : 'einnahme', ok: mitKennzeichen };
  };
  if (/[^\d.,'°SHsh$]/.test(s)) return out;      // Buchstaben dazwischen: keine Lesart, nur die Gegenrechnung
  const komma = s.search(/[,.](?=\d{2}[^,.]*$)/);
  if (komma > 0) {
    const ganz = s.slice(0, komma).replace(/[.']/g, '');
    const cents = s.slice(komma + 1, komma + 3);
    const rest = s.slice(komma + 3);
    const k = kenn(rest);
    if (/^\d+$/.test(ganz) && k.ok) out.push({ cent: Number(ganz) * 100 + Number(cents), r: k.r, kosten: k.junk ? 2 : 1 });
  } else {
    const d = s.replace(/[.']/g, '');
    if (/^\d+$/.test(d)) {
      for (let i = 1; i <= d.length - 2; i++) {
        for (const sprung of [0, 1]) {   // 1 = das Komma wurde als Ziffer gelesen
          const c = d.slice(i + sprung, i + sprung + 2);
          if (c.length < 2) continue;
          const k = kenn(d.slice(i + sprung + 2));
          if (!k.ok) continue;
          out.push({ cent: Number(d.slice(0, i)) * 100 + Number(c), r: k.r, kosten: 2 + sprung + (k.junk ? 1 : 0) });
        }
      }
    }
  }
  return out;
}

// Passt ein aus der Gegenrechnung errechneter Betrag zu den gelesenen Ziffern?
// Gewichteter Abstand: überzählige gelesene Ziffern (Kennzeichen, Leerraum als Ziffer) kosten 0,5,
// eine falsch gelesene Ziffer 1, eine fehlende 1. Erlaubt höchstens 1,5 (2, wenn die erste Ziffer stimmt).
function passtZuZiffern(cent, roh) {
  const a = String(cent);
  const b = String(roh).replace(/[^\d]/g, '');
  if (!b) return false;
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) d[i][0] = i;
  for (let j = 1; j <= n; j++) d[0][j] = j * 0.5;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 0.5, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[m][n] <= (a[0] === b[0] ? 2 : 1.5) ? d[m][n] : false;
}

// ---------- Hauptleser ----------

/** Sieht der Text wie ein Kontoauszug aus (und nicht wie MT940/CAMT)? */
export function istAuszugText(text) {
  const s = String(text || '');
  if (/(^|\n):61:/.test(s) || /<(?:[\w.-]+:)?(?:Ntry|Stmt|BkToCstmrStmt)\b/.test(s)) return false;
  if (!/(kontoauszug|kontostand|saldo|\biban\b|buchungstag|bu-?tag|valuta|wertstellung|umsätze|umsaetze|auszug)/i.test(s)) return false;
  let n = 0;
  for (const z of s.replace(/\r\n?/g, '\n').split('\n')) {
    const d = datenVorn(z);
    if (d && betragHinten(d.rest)) n++;
    if (n >= 2) return true;
  }
  return false;
}

/**
 * Liest den Text eines Kontoauszugs.
 * @returns {{format:'text', konto:string, saldoStartCent:number|null, saldoEndeCent:number|null,
 *   umsaetze:Array<{valuta:string, buchung:string, betragCent:number|null, richtung:'einnahme'|'ausgabe',
 *   zweck:string, gegen:string, rechnungsnummern:string[], unsicher:boolean, grund:string}>,
 *   saldoStimmt:boolean, warnungen:Array<{code:string, [k:string]:any}>}}
 */
export function leseAuszugText(text) {
  const roh = String(text || '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[   ]/g, ' ').replace(/[−–]/g, '-');
  const zeilen = roh.split('\n');
  const warnungen = [];

  // Konto (IBAN), Texterkennung O→0 in den Ziffernstellen.
  let konto = '';
  const ib = roh.match(/\bIBAN\b[:\s]*([A-Z]{2}[0-9O]{2}(?:\s?[0-9A-Z]{4}){2,7}(?:\s?[0-9A-Z]{1,3})?)/);
  if (ib) konto = ib[1].replace(/\s/g, '').replace(/^([A-Z]{2})([0-9O]{2})/, (x, l, p) => l + p.replace(/O/g, '0'));
  else {
    const kn = roh.match(/\b(?:konto(?:-?nr\.?|nummer)?)[:\s]+(\d[\d\s]{5,14}\d)/i);
    if (kn) konto = kn[1].replace(/\s/g, '');
  }

  // Jahr für Daten ohne Jahr: Zeitraum „01.03.2025 bis 31.03.2025“, sonst das häufigste Jahr.
  const voll = (s) => { const m = ziffernFix(s).match(/(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})/); if (!m) return null; let j = Number(m[3]); if (j < 100) j += 2000; return { t: Number(m[1]), m: Number(m[2]), j }; };
  let von = null, bis = null;
  const zr = ziffernFix(roh).match(/(\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2}))\s*(?:bis|-|–)\s*(\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2}))/i);
  if (zr) { von = voll(zr[1]); bis = voll(zr[2]); }
  const jahre = {};
  for (const m of ziffernFix(roh).matchAll(/\b\d{1,2}\.\d{1,2}\.(20\d{2})\b/g)) jahre[m[1]] = (jahre[m[1]] || 0) + 1;
  for (const m of roh.matchAll(/\b(?:nr\.?|auszug)\s*\d{1,3}\s*\/\s*(20\d{2})\b/gi)) jahre[m[1]] = (jahre[m[1]] || 0) + 1;
  const haeufig = Object.entries(jahre).sort((a, b) => b[1] - a[1])[0];
  const jahrFuer = (d) => {
    if (von && bis) {
      if (von.j === bis.j) return von.j;
      return d.m >= von.m ? von.j : bis.j;               // Zeitraum über den Jahreswechsel
    }
    return haeufig ? Number(haeufig[0]) : null;
  };

  // Kopfzeile: Spaltenlage für getrennte Soll-/Haben-Spalten und Reihenfolge Buchung/Wert.
  let spalteAus = null, spalteEin = null, spalteSaldo = null, wertZuerst = false;
  for (const z of zeilen) {
    if (!KOPF.test(z)) continue;
    const l = z.toLowerCase();
    const pos = (re) => { const m = l.match(re); return m ? m.index + m[0].length : null; };
    spalteAus = pos(/\b(soll|belastung(?:en)?|lastschrift(?:en)?|ausgang|ausgänge|abgang|abgänge|abbuchung(?:en)?)\b(?:\s?(?:eur|€|in eur))?/);
    spalteEin = pos(/\b(haben|gutschrift(?:en)?|eingang|eingänge|zugang|zugänge)\b(?:\s?(?:eur|€|in eur))?/);
    spalteSaldo = pos(/\b(saldo|kontostand)\b/);
    const iw = l.search(/\b(wert|valuta)/), ib2 = l.search(/\b(bu-?tag|buchung)/);
    wertZuerst = iw >= 0 && ib2 >= 0 && iw < ib2;
    // Spalten nur, wenn die Kopfzeile wirklich Spalten hat (Leerraum dazwischen); nach der Texterkennung fehlt er.
    if (spalteAus != null && spalteEin != null
      && (Math.abs(spalteAus - spalteEin) < 4 || !/\s{3,}/.test(l.slice(Math.min(spalteAus, spalteEin) - 4, Math.max(spalteAus, spalteEin))))) { spalteAus = spalteEin = null; }
    break;
  }

  // Durchgang: Zeilen einordnen.
  const roheUmsaetze = [];
  let saldoStartCent = null, saldoEndeCent = null, summeAus = null, summeEin = null, postenLaut = null;
  let aktuell = null, ueberspringen = false, einzugBlock = null, saldoVerlesen = false;
  const saldoAus = (zeile) => {
    const b = betragHinten(zeile);
    if (!b) return null;
    if (b.unleserlich) {
      // Verlesener Saldo („12.671,734H“): nur wenn genau eine Lesart mit Kennzeichen bleibt.
      const l = lesarten(b.unleserlich, true).filter((x) => x.r);
      if (l.length !== 1) return null;
      saldoVerlesen = true;
      return l[0].r === 'ausgabe' ? -l[0].cent : l[0].cent;
    }
    const r = kennzeichenRichtung(b.vorne, b.hinten);
    return r === 'ausgabe' ? -b.cent : b.cent;
  };
  const blockEnde = () => { aktuell = null; einzugBlock = null; };

  for (let i = 0; i < zeilen.length; i++) {
    const zeile = zeilen[i];
    const t = zeile.trim();
    if (!t) continue;

    // Summenzeile(n) am Ende: „Summe Belastungen: 2.475,59 S  Summe Gutschriften: 4.246,13 H  Posten: 20“
    if (SUMME.test(t) && !datenVorn(zeile)) {
      const s = ziffernFix(t);
      const ma = s.match(new RegExp(String.raw`(?:belastung\w*|lastschrift\w*|soll|ausg[aä]ng\w*|abg[aä]ng\w*|abbuchung\w*)\D{0,12}?(${BETRAG_KERN})`, 'i'));
      const me = s.match(new RegExp(String.raw`(?:gutschrift\w*|haben|eing[aä]ng\w*|zug[aä]ng\w*)\D{0,12}?(${BETRAG_KERN})`, 'i'));
      if (ma) summeAus = centAus(ma[1]);
      if (me) summeEin = centAus(me[1]);
      const mp = s.match(/\b(?:posten|buchungen|umsätze|umsaetze|anzahl)\D{0,3}(\d{1,4})\b/i);
      if (mp) postenLaut = Number(mp[1]);
      blockEnde(); continue;
    }
    // Übertrag / Seitenwechsel: kein Umsatz; bis zur nächsten Umsatzzeile überspringen.
    if (UEBERTRAG.test(t) && !/kontostand|saldo/i.test(t.replace(UEBERTRAG, ''))) { blockEnde(); ueberspringen = true; continue; }
    if (SEITE.test(t)) { blockEnde(); ueberspringen = true; continue; }
    // Saldo-Zeile
    if (SALDO_WORT.test(t) && !(aktuell && !betragHinten(zeile))) {
      const wert = saldoAus(zeile);
      if (wert != null || /kontostand|saldo/i.test(t)) {
        const alt = SALDO_ALT.test(t), neu = SALDO_NEU.test(t) && !alt;
        if (wert != null) {
          if (alt || (!neu && !roheUmsaetze.length && saldoStartCent == null)) { if (saldoStartCent == null) saldoStartCent = wert; }
          else saldoEndeCent = wert;
        }
        blockEnde();
        if (UEBERTRAG.test(t)) ueberspringen = true;
        continue;
      }
    }
    if (TRENNER.test(t)) { blockEnde(); continue; }
    if (KOPF.test(t) && !datenVorn(zeile)) { blockEnde(); ueberspringen = false; continue; }

    // Umsatzzeile: Datum vorn, Betrag hinten.
    const dv = datenVorn(zeile);
    const mitArt = !!dv && (dv.daten.length >= 2 || BUCHUNGSART.test(dv.rest.trim()));
    let bh = dv ? betragHinten(dv.rest, mitArt) : null;
    // Umsatzzeile ohne lesbaren Betrag (zwei Daten oder Buchungsart vorn): nicht verwerfen, sondern unsicher führen.
    if (dv && !bh && mitArt && /[A-Za-zÄÖÜäöü]{3,}/.test(dv.rest)) {
      const w = dv.rest.replace(/\s+$/, '').match(/(\S+)$/);
      bh = { unleserlich: w && /\d/.test(w[1]) && !BUCHUNGSART.test(w[1]) ? w[1] : '', start: w && /\d/.test(w[1]) ? w.index : dv.rest.length, ganzVerlesen: true };
    }
    if (dv && bh && !(bh.unleserlich && dv.daten.length < 2 && !/[A-Za-zÄÖÜäöü]{3,}/.test(dv.rest.slice(0, bh.start)))) {
      ueberspringen = false;
      const [d1, d2] = dv.daten;
      const buchung = wertZuerst && d2 ? d2 : d1;
      const wert = wertZuerst && d2 ? d1 : (d2 || d1);
      let vorgang = dv.rest.slice(0, bh.start).trim();
      const u = {
        buchungD: buchung, wertD: wert, vorgang, folge: [],
        betrag: bh, spalte: zeile.length - dv.rest.length + (bh.unleserlich ? bh.start + bh.unleserlich.length : bh.ende),
        einzug: null,
      };
      roheUmsaetze.push(u);
      aktuell = u;
      continue;
    }
    if (ueberspringen) continue;
    if (FUSS.test(t)) { blockEnde(); ueberspringen = true; continue; }
    // Folgezeile eines Umsatzes (Gegenpartei, Verwendungszweck).
    if (aktuell) {
      const einzug = zeile.length - zeile.trimStart().length;
      if (einzugBlock == null) einzugBlock = einzug;
      else if (einzugBlock >= 6 && einzug < einzugBlock - 3) { blockEnde(); continue; }   // aus der Spalte gefallen
      aktuell.folge.push(t);
    }
  }

  // Schreibweise des Auszugs: Kennzeichen S/H? Vorzeichen? Spalten?
  const klar = roheUmsaetze.filter((u) => !u.betrag.unleserlich);
  const mitSH = klar.filter((u) => /^(s|h|soll|haben)$/i.test(u.betrag.hinten)).length;
  const mitMinus = klar.filter((u) => kennzeichenRichtung(u.betrag.vorne, u.betrag.hinten) === 'ausgabe').length;
  const mitKennzeichen = klar.length > 0 && mitSH * 2 >= klar.length;
  const vorzeichenStil = !mitKennzeichen && mitMinus > 0;

  const umsaetze = roheUmsaetze.map((u, idx) => {
    const b = u.betrag;
    let vorgang = u.vorgang;
    const folge = u.folge.slice();
    // Laufender Saldo als zweite Zahl: dann ist die vordere Zahl der Betrag.
    let haupt = b;
    if (!b.unleserlich && b.zweiter && spalteSaldo != null) haupt = b.zweiter;
    // Richtung
    let richtung = null, sicherR = 'hoch';
    if (!b.unleserlich) richtung = kennzeichenRichtung(haupt.vorne, haupt.hinten);
    if (!richtung && !b.unleserlich && spalteAus != null && spalteEin != null) {
      const ende = u.spalte;
      richtung = Math.abs(ende - spalteAus) < Math.abs(ende - spalteEin) ? 'ausgabe' : 'einnahme';
      sicherR = Math.min(Math.abs(ende - spalteAus), Math.abs(ende - spalteEin)) > 12 ? 'niedrig' : 'mittel';
    }
    if (!richtung && vorzeichenStil && !b.unleserlich) { richtung = 'einnahme'; sicherR = 'mittel'; }
    const artText = `${vorgang} ${folge.slice(0, 1).join(' ')}`;
    const artR = ART_EIN.test(vorgang) ? 'einnahme' : (ART_AUS.test(vorgang) ? 'ausgabe' : (ART_EIN.test(artText) ? 'einnahme' : (ART_AUS.test(artText) ? 'ausgabe' : null)));
    if (!richtung) { richtung = artR; sicherR = artR ? 'niedrig' : 'keine'; }

    // Gegenpartei und Zweck
    vorgang = vorgang.replace(/^[^A-Za-zÄÖÜäöü]*(?=[A-Za-zÄÖÜäöü])/, '');   // Reste eines verlesenen Datums vorn
    const art = vorgang.match(BUCHUNGSART);
    const restVorgang = art ? vorgang.slice(art[0].length).trim() : vorgang;
    const bankintern = BANKINTERN.test(vorgang);
    let gegen = '', zweckTeile = folge;
    if (!art && /[A-Za-zÄÖÜäöü]{3,}/.test(restVorgang) && folge.length === 0) { gegen = restVorgang; }
    else if (art && /[A-Za-zÄÖÜäöü]{3,}/.test(restVorgang) && restVorgang.length >= 4) { gegen = restVorgang; }
    else if (!art && /[A-Za-zÄÖÜäöü]{3,}/.test(restVorgang)) { gegen = restVorgang; }
    else if (BAR.test(vorgang)) { gegen = art ? art[0].trim() : vorgang; }   // Bargeld: keine Gegenpartei, die Buchungsart steht dafür
    else if (folge.length && (!bankintern || FIRMENNAME.test(folge[0]))) { gegen = folge[0]; zweckTeile = folge.slice(1); }
    const zweck = zweckTeile.join(' ').replace(/\s+/g, ' ').trim();

    // Lesarten für die Gegenrechnung
    const optionen = [];
    let grund = '';
    if (!b.unleserlich) {
      optionen.push({ cent: haupt.cent, r: richtung, kosten: 0 });
      if (sicherR !== 'hoch') {
        const anders = richtung === 'einnahme' ? 'ausgabe' : 'einnahme';
        optionen.push({ cent: haupt.cent, r: anders, kosten: sicherR === 'keine' ? 0 : (sicherR === 'niedrig' ? 1 : 2) });
        if (!richtung) optionen[0].r = 'ausgabe';
      }
    } else {
      grund = 'Betrag unleserlich';
      for (const l of lesarten(b.unleserlich, mitKennzeichen)) {
        const rs = l.r ? [l.r] : (richtung ? [richtung] : ['ausgabe', 'einnahme']);
        for (const r of rs) optionen.push({ cent: l.cent, r, kosten: l.kosten + (l.r || sicherR === 'hoch' ? 0 : 1) });
      }
      const rs = richtung ? [richtung] : ['ausgabe', 'einnahme'];
      for (const r of rs) optionen.push({ frei: true, r, kosten: 4, roh: b.unleserlich });
    }
    return {
      _i: idx, _optionen: optionen, _sicherR: sicherR,
      valuta: iso(u.wertD, jahrFuer), buchung: iso(u.buchungD, jahrFuer),
      betragCent: optionen[0] && !optionen[0].frei ? optionen[0].cent : null,
      richtung: (optionen[0] && optionen[0].r) || richtung || 'ausgabe',
      zweck, gegen, vorgang: art ? art[0].trim() : '',
      rechnungsnummern: [], _nrText: `${restVorgang && !gegen ? restVorgang + ' ' : ''}${zweck}`,
      unsicher: false, grund,
    };
  });

  // ---------- Gegenrechnung ----------
  const vorzeichen = (r) => (r === 'einnahme' ? 1 : -1);
  const bedingungen = [];
  if (saldoStartCent != null && saldoEndeCent != null) bedingungen.push({ art: 'netto', ziel: saldoEndeCent - saldoStartCent });
  if (summeAus != null) bedingungen.push({ art: 'ausgabe', ziel: summeAus });
  if (summeEin != null) bedingungen.push({ art: 'einnahme', ziel: summeEin });

  const pruefe = (wahl) => bedingungen.every((b) => {
    let s = 0;
    for (let k = 0; k < umsaetze.length; k++) {
      const o = wahl[k];
      if (o.cent == null) return false;
      if (b.art === 'netto') s += vorzeichen(o.r) * o.cent;
      else if (o.r === b.art) s += o.cent;
    }
    return s === b.ziel;
  });

  let saldoStimmt = false;
  let gewaehlt = umsaetze.map((u) => u._optionen[0] || { cent: null, r: u.richtung, kosten: 0 });
  let geaendert = new Set();
  let mehrdeutig = false;
  if (!bedingungen.length) {
    warnungen.push({ code: 'saldo-fehlt', detail: 'Anfangs- oder Endsaldo nicht lesbar – keine Gegenrechnung' });
  } else if (umsaetze.length && gewaehlt.every((o) => !o.frei) && pruefe(gewaehlt)) {
    saldoStimmt = true;
  } else if (umsaetze.length) {
    // Suche über die wackligen Zeilen: welche Lesart schließt die Gegenrechnung?
    const wackel = umsaetze.filter((u) => u._optionen.length > 1 || u._optionen.some((o) => o.frei)).map((u) => u._i);
    let raum = 1;
    for (const k of wackel) raum *= umsaetze[k]._optionen.length;
    if (wackel.length && raum <= 300000) {
      const loesungen = [];
      const wahl = gewaehlt.slice();
      const maxFrei = Math.max(1, bedingungen.filter((b) => b.art !== 'netto').length);
      const rek = (j, kosten, frei) => {
        if (j === wackel.length) {
          const w = wahl.map((o) => ({ ...o }));
          const freie = w.map((o, k) => (o.frei ? k : -1)).filter((k) => k >= 0);
          let zusatz = 0;
          if (freie.length) {
            // Freie Beträge aus den Bedingungen errechnen (je Richtung eine, sonst netto).
            for (const k of freie) {
              const b = bedingungen.find((x) => x.art === w[k].r) || bedingungen.find((x) => x.art === 'netto');
              let s = 0, offen = 0;
              for (let q = 0; q < w.length; q++) {
                if (w[q].frei) { if (b.art === 'netto' || w[q].r === b.art) offen++; continue; }
                if (b.art === 'netto') s += vorzeichen(w[q].r) * w[q].cent;
                else if (w[q].r === b.art) s += w[q].cent;
              }
              if (offen !== 1) return;
              const c = b.art === 'netto' ? (b.ziel - s) * vorzeichen(w[k].r) : b.ziel - s;
              const nah = c > 0 ? passtZuZiffern(c, w[k].roh) : false;
              if (nah === false) return;
              zusatz += nah;
              w[k] = { ...w[k], cent: c, frei: false, errechnet: true };
            }
          }
          if (pruefe(w)) loesungen.push({ w, kosten: kosten + zusatz });
          return;
        }
        const k = wackel[j];
        for (const o of umsaetze[k]._optionen) {
          if (o.frei && frei >= maxFrei) continue;
          wahl[k] = o;
          rek(j + 1, kosten + o.kosten, frei + (o.frei ? 1 : 0));
        }
        wahl[k] = gewaehlt[k];
      };
      rek(0, 0, 0);
      if (loesungen.length) {
        loesungen.sort((a, b) => a.kosten - b.kosten);
        const best = loesungen[0];
        const gleich = loesungen.filter((l) => l.kosten === best.kosten
          && l.w.some((o, k) => o.cent !== best.w[k].cent || o.r !== best.w[k].r));
        mehrdeutig = gleich.length > 0;
        gewaehlt = best.w;
        geaendert = new Set(wackel.filter((k) => best.w[k] !== umsaetze[k]._optionen[0] || best.w[k].errechnet
          || best.w[k].cent !== (umsaetze[k]._optionen[0] || {}).cent || best.w[k].r !== (umsaetze[k]._optionen[0] || {}).r));
        saldoStimmt = true;
      }
    }
  }

  // Ergebnis je Umsatz
  const differenz = () => {
    const b = bedingungen.find((x) => x.art === 'netto');
    if (!b) return null;
    const s = gewaehlt.reduce((a, o) => a + (o.cent == null ? 0 : vorzeichen(o.r) * o.cent), 0);
    return b.ziel - s;
  };
  const diff = saldoStimmt ? 0 : differenz();
  for (const u of umsaetze) {
    const o = gewaehlt[u._i];
    if (o && o.cent != null) { u.betragCent = o.cent; u.richtung = o.r || u.richtung; }
    else u.betragCent = null;
    const gruende = [];
    if (u.grund) gruende.push(u.grund);
    if (saldoStimmt && geaendert.has(u._i)) {
      gruende.push(o.errechnet ? 'Betrag aus der Saldo-Gegenrechnung errechnet' : 'Lesart über die Saldo-Gegenrechnung gewählt');
      if (mehrdeutig) gruende.push('mehrere Lesarten möglich');
    }
    if (!u.valuta) gruende.push('Datum ohne Jahr');
    if (u.betragCent == null) gruende.push('kein Betrag');
    if (!saldoStimmt) {
      gruende.push(bedingungen.length
        ? `Saldo-Gegenrechnung stimmt nicht${diff != null && diff !== 0 ? ` (Differenz ${(Math.abs(diff) / 100).toFixed(2).replace('.', ',')} EUR)` : ''}`
        : 'keine Saldo-Gegenrechnung möglich');
    }
    u.rechnungsnummern = rechnungsnummernAusZweck(u._nrText, { richtung: u.richtung });
    u.unsicher = gruende.length > 0;
    u.grund = [...new Set(gruende)].join('; ');
    delete u._i; delete u._optionen; delete u._sicherR; delete u._nrText;
  }

  if (!saldoStimmt && bedingungen.length && umsaetze.length) warnungen.push({ code: 'saldo-differenz', differenzCent: diff });
  if (saldoVerlesen) warnungen.push({ code: 'saldo-verlesen', detail: 'Saldo nur aus verlesenem Text gelesen' });
  if (postenLaut != null && postenLaut !== umsaetze.length) warnungen.push({ code: 'anzahl-abweichend', erwartet: postenLaut, gelesen: umsaetze.length });
  const unsicher = umsaetze.filter((u) => u.unsicher).length;
  if (unsicher) warnungen.push({ code: 'unsichere-umsaetze', anzahl: unsicher });
  if (!umsaetze.length) warnungen.push({ code: 'keine-umsaetze' });

  return { format: 'text', konto, saldoStartCent, saldoEndeCent, umsaetze, saldoStimmt, warnungen };
}
