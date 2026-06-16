// src/domain/bankimport.js
// Bankimport: liest einen Kontoauszug — MT940 (SWIFT) ODER CAMT.053 (ISO-20022-XML,
// moderner SEPA-Standard) — und liefert ein einheitliches Umsatz-Modell. Daraus lässt
// sich je Umsatz ein Buchungs-ENTWURF vorschlagen (über ai/suggest, wie Beleg/E-Rechnung).
// Reine, testbare Funktionen — kein Netz, kein DOM.
//
// EHRLICHER HINWEIS: deckt die in der Praxis üblichen Felder ab (MT940: :25:/:61:/:86:;
// CAMT.053: <Ntry> mit Betrag/Soll-Haben/Datum/Verwendungszweck/Gegenpartei). KEINE
// vollständige SWIFT-/ISO-20022-Validierung; exotische Bank-Dialekte können abweichen.
// Der Zahlungsabgleich (Matching auf offene Posten) folgt separat.

import { parseEuroToCents } from './money.js';

// YYMMDD → YYYY-MM-DD (Jahrhundert 20xx; MT940 nutzt 2-stellige Jahre).
function jahrDatum(yymmdd) {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  return `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}

// :86: aufbereiten: führenden Geschäftsvorfall-Code (z.B. „166") entfernen,
// strukturierte ?NN-Subfelder durch Leerzeichen ersetzen, Mehrfach-Leerraum kürzen.
function zweckText(roh) {
  return String(roh || '')
    .replace(/^\s*\d{3}/, '')        // führender GVC-Code
    .replace(/\?\d{2}/g, ' ')         // ?00 ?20 ?32 … Subfeld-Marker
    .replace(/\s+/g, ' ')
    .trim();
}

// Name der Gegenseite aus den :86:-Subfeldern ?32/?33 (best-effort).
function gegenName(roh) {
  const s = String(roh || '');
  const m32 = s.match(/\?3[23]([^?]*)/g);
  if (!m32) return '';
  return m32.map((x) => x.replace(/\?3[23]/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parst einen MT940-Kontoauszug.
 * @returns {{konto:string, umsaetze:Array<{valuta:string, betragCent:number, richtung:'einnahme'|'ausgabe', zweck:string, gegen:string}>}}
 */
export function parseMT940(text) {
  const zeilen = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  let konto = '';
  const umsaetze = [];
  let aktivesFeld = null; // 'umsatz86' während :86:-Block

  for (const zeile of zeilen) {
    const tag = zeile.match(/^:(\d{2}[A-Z]?):(.*)$/);
    if (tag) {
      const code = tag[1];
      const rest = tag[2];
      aktivesFeld = null;
      if (code === '25') {
        konto = rest.replace(/EUR$/i, '').trim();
      } else if (code === '61') {
        const m = rest.match(/^(\d{6})(\d{4})?(RC|RD|C|D)[A-Z]?([\d.,]+)/);
        if (m) {
          const [, valuta, , mark, betrag] = m;
          const einnahme = mark === 'C' || mark === 'RD'; // C = Gutschrift; RD = Storno einer Lastschrift
          umsaetze.push({
            valuta: jahrDatum(valuta),
            betragCent: parseEuroToCents(betrag),
            richtung: einnahme ? 'einnahme' : 'ausgabe',
            zweck: '',
            gegen: '',
          });
        }
      } else if (code === '86' && umsaetze.length) {
        const u = umsaetze[umsaetze.length - 1];
        u._roh = (u._roh || '') + rest;
        u.zweck = zweckText(u._roh);
        u.gegen = gegenName(u._roh);
        aktivesFeld = 'umsatz86';
      }
    } else if (aktivesFeld === 'umsatz86' && umsaetze.length) {
      // Fortsetzungszeile eines :86:-Blocks.
      const u = umsaetze[umsaetze.length - 1];
      u._roh = (u._roh || '') + zeile;
      u.zweck = zweckText(u._roh);
      u.gegen = gegenName(u._roh);
    }
  }
  for (const u of umsaetze) delete u._roh;
  return { konto, umsaetze };
}

/**
 * Bildet aus einem Bank-Umsatz das Extraktions-Objekt (wie ai/extract) für den
 * Buchungsvorschlag. Der Bruttobetrag ist der Umsatzbetrag; die Richtung kommt
 * VERBINDLICH aus dem Kontoauszug (Gutschrift = Einnahme, Lastschrift = Ausgabe) und
 * sollte die Kategorisierungs-Richtung überschreiben.
 * @returns {{betragBrutto:number, datum:string, ustSatz:null, vendor:string, richtung:'einnahme'|'ausgabe', confidence:number}}
 */
export function umsatzExtraktion(umsatz) {
  const u = umsatz || {};
  return {
    betragBrutto: u.betragCent != null ? u.betragCent : null,
    datum: u.valuta || null,
    ustSatz: null, // aus reinem Zahlungsfluss nicht ableitbar — Nutzer/Heuristik setzt USt
    vendor: u.gegen || u.zweck || '',
    richtung: u.richtung || 'ausgabe',
    confidence: u.betragCent != null && u.valuta ? 0.6 : 0.2,
  };
}

// ---- CAMT.053 (ISO 20022, XML) ---------------------------------------------

// Inneres des ERSTEN Elements mit lokalem Namen (Namespace-Präfix egal).
function camtBlock(xml, local) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`));
  return m ? m[1] : '';
}
// ALLE Elemente mit lokalem Namen (für die Umsatz-Einträge <Ntry>).
function camtAlle(xml, local) {
  const re = new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`, 'g');
  const out = []; let m;
  while ((m = re.exec(String(xml)))) out.push(m[1]);
  return out;
}
function camtText(xml, local) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`));
  return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim() : '';
}

/** Erkennt das Auszugsformat. @returns {'MT940'|'CAMT'|null} */
export function erkenneBankformat(text) {
  const s = String(text || '');
  if (/camt\.05[0-9]/i.test(s) || /<(?:[\w.-]+:)?Ntry\b/.test(s)) return 'CAMT';
  if (/(^|\n):2[05][A-Z]?:/.test(s) || /(^|\n):61:/.test(s)) return 'MT940';
  return null;
}

/** Parst einen CAMT.053-Auszug → gleiches Umsatz-Modell wie parseMT940. */
export function parseCAMT(xml) {
  const stmt = camtBlock(xml, 'Stmt') || String(xml);
  const acct = camtBlock(stmt, 'Acct');
  const konto = camtText(acct, 'IBAN') || camtText(camtBlock(acct, 'Othr'), 'Id');
  const umsaetze = [];
  for (const ntry of camtAlle(stmt, 'Ntry')) {
    const cd = camtText(ntry, 'CdtDbtInd').toUpperCase();
    const einnahme = cd === 'CRDT';
    const details = camtBlock(ntry, 'NtryDtls');
    // Datum: bevorzugt Valuta (ValDt), sonst Buchungsdatum (BookgDt).
    const valuta = camtText(camtBlock(ntry, 'ValDt'), 'Dt') || camtText(camtBlock(ntry, 'BookgDt'), 'Dt');
    const zweck = camtText(details || ntry, 'Ustrd');
    // Gegenpartei: bei Gutschrift der Zahler (Dbtr), bei Lastschrift der Empfänger (Cdtr).
    const parteien = camtBlock(details || ntry, 'RltdPties');
    const gegen = camtText(camtBlock(parteien, einnahme ? 'Dbtr' : 'Cdtr'), 'Nm')
      || camtText(camtBlock(parteien, 'Cdtr'), 'Nm') || camtText(camtBlock(parteien, 'Dbtr'), 'Nm');
    umsaetze.push({
      valuta: (valuta || '').slice(0, 10),
      betragCent: parseEuroToCents(camtText(ntry, 'Amt')),
      richtung: einnahme ? 'einnahme' : 'ausgabe',
      zweck: zweck || '',
      gegen: gegen || '',
    });
  }
  return { konto, umsaetze };
}

/**
 * Einheitlicher Einstieg: erkennt MT940 oder CAMT.053 und parst entsprechend.
 * @returns {{format:'MT940'|'CAMT'|null, konto:string, umsaetze:Array}}
 */
export function parseBankauszug(text) {
  const format = erkenneBankformat(text);
  if (format === 'CAMT') return { format, ...parseCAMT(text) };
  if (format === 'MT940') return { format, ...parseMT940(text) };
  return { format: null, konto: '', umsaetze: [] };
}
