// src/domain/kundenimport.js
// Reiner Import von Kundendaten aus CSV und vCard (.vcf) — zusätzlich zum WorkFloh-JSON
// (connect.js) und der WorkFloh-Übernahme. Liefert normalisierte Kunden im BLP-Schema
// {name, email, adresse, ustId, telefon, istVerbraucher}. Kein DOM, kein Netz — node-getestet.
// Die UI (ui/views/customers.js) liest die Datei (core/files.readFileText) und speichert via
// crm-store.saveKunde (verschlüsselt at rest, DSGVO).

// ---------------------------------------------------------------- CSV ----------

// Eine CSV-Zeile in Felder zerlegen — unterstützt "…"-Quoting mit ""-Escape und den
// gewählten Trenner. (Bewusste Grenze: eingebettete Zeilenumbrüche in Quotes nicht unterstützt.)
function splitCsvLine(line, delim) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') { inQ = true; }
    else if (c === delim) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Spaltenkopf (lowercase, ohne BOM/Punkt) → BLP-Feld. Deutsche + englische Synonyme.
const HEADER_MAP = {
  name: 'name', kunde: 'name', kundenname: 'name', firma: 'name', company: 'name', fullname: 'name', 'full name': 'name', 'voller name': 'name',
  email: 'email', 'e-mail': 'email', mail: 'email', 'e mail': 'email', 'email-adresse': 'email',
  adresse: 'adresse', anschrift: 'adresse', address: 'adresse', strasse: 'adresse', 'straße': 'adresse', street: 'adresse',
  ustid: 'ustId', 'ust-id': 'ustId', 'ust-idnr': 'ustId', ustidnr: 'ustId', 'umsatzsteuer-id': 'ustId', vat: 'ustId', vatid: 'ustId', 'vat id': 'ustId', 'ust id': 'ustId', 'ust-idnr.': 'ustId',
  telefon: 'telefon', tel: 'telefon', phone: 'telefon', telefonnummer: 'telefon', mobil: 'telefon', mobile: 'telefon',
  verbraucher: 'istVerbraucher', privat: 'istVerbraucher', privatkunde: 'istVerbraucher', b2c: 'istVerbraucher', consumer: 'istVerbraucher',
  typ: 'typ', kundentyp: 'typ', type: 'typ', art: 'typ',
};

const istWahr = (v) => /^(ja|yes|true|1|x|wahr)$/i.test(String(v || '').trim());
const istVerbraucherTyp = (v) => /privat|verbrauch|b2c|consumer|endkunde/i.test(String(v || ''));

/**
 * Parst eine Kunden-CSV (mit Kopfzeile). Erkennt `;` oder `,` als Trenner. Mappt gängige
 * Spaltennamen (DE/EN). Ohne erkennbare Name-/E-Mail-Spalte → []. Rein.
 * @param {string} text
 * @returns {Array<object>} rohe Kundenobjekte (vor normalizeKunde)
 */
export function parseKundenCsv(text) {
  const clean = String(text || '').replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const delim = lines[0].split(';').length >= lines[0].split(',').length ? ';' : ',';
  const header = splitCsvLine(lines[0], delim).map((h) => h.toLowerCase().replace(/\.$/, '').trim());
  const cols = header.map((h) => HEADER_MAP[h] || null);
  if (!cols.some((c) => c === 'name' || c === 'email')) return [];
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const felder = splitCsvLine(lines[i], delim);
    const roh = {};
    cols.forEach((field, idx) => {
      const wert = felder[idx];
      if (!field || wert == null || wert === '') return;
      if (field === 'istVerbraucher') roh.istVerbraucher = istWahr(wert);
      else if (field === 'typ') roh.istVerbraucher = istVerbraucherTyp(wert);
      else roh[field] = wert;
    });
    out.push(roh);
  }
  return out;
}

// -------------------------------------------------------------- vCard ----------

function vcardUnescape(v) {
  return String(v || '').replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function vcardToKunde(c) {
  let name = vcardUnescape(c.FN || '');
  if (!name && c.N) { const p = c.N.split(';'); name = `${vcardUnescape(p[1] || '')} ${vcardUnescape(p[0] || '')}`.trim(); }
  if (!name && c.ORG) name = vcardUnescape(c.ORG.split(';')[0]);
  let adresse = '';
  if (c.ADR) {
    const p = c.ADR.split(';').map(vcardUnescape); // pobox;ext;street;locality;region;postal;country
    adresse = [p[2] || '', [p[5] || '', p[3] || ''].filter(Boolean).join(' '), p[6] || ''].filter(Boolean).join(', ');
  }
  return { name, email: vcardUnescape(c.EMAIL || ''), telefon: vcardUnescape(c.TEL || ''), adresse };
}

/**
 * Parst eine vCard-Datei (.vcf, eine oder mehrere Karten). Entfaltet Fortsetzungszeilen,
 * nimmt je Eigenschaft das erste Vorkommen. Rein.
 * @param {string} text
 * @returns {Array<object>} rohe Kundenobjekte (vor normalizeKunde)
 */
export function parseVcard(text) {
  const raw = String(text || '');
  if (!/BEGIN:VCARD/i.test(raw)) return [];
  const unfolded = raw.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, ''); // RFC-6350-Zeilenfaltung
  const out = [];
  let cur = null;
  for (const line of unfolded.split('\n')) {
    const L = line.trim();
    if (/^BEGIN:VCARD$/i.test(L)) { cur = {}; continue; }
    if (/^END:VCARD$/i.test(L)) { if (cur) out.push(vcardToKunde(cur)); cur = null; continue; }
    if (!cur) continue;
    const ci = L.indexOf(':');
    if (ci < 0) continue;
    const prop = L.slice(0, ci).split(';')[0].toUpperCase();
    if (!(prop in cur)) cur[prop] = L.slice(ci + 1);
  }
  return out;
}

// ------------------------------------------------------------ gemeinsam --------

/**
 * Normalisiert ein rohes Importobjekt auf das BLP-Kundenschema. Trimmt, Default istVerbraucher
 * false. Gibt null zurück, wenn weder Name noch E-Mail vorhanden sind (Müll überspringen). Rein.
 * @param {object} roh
 * @returns {?{name:string, email:string, adresse:string, ustId:string, telefon:string, istVerbraucher:boolean}}
 */
export function normalizeKunde(roh = {}) {
  const k = {
    name: String(roh.name || '').trim(),
    email: String(roh.email || '').trim(),
    adresse: String(roh.adresse || '').trim(),
    ustId: String(roh.ustId || '').trim(),
    telefon: String(roh.telefon || '').trim(),
    istVerbraucher: !!roh.istVerbraucher,
  };
  return (k.name || k.email) ? k : null;
}

/**
 * Auto-Erkennung CSV vs. vCard + Normalisierung → fertige Kundenliste für saveKunde. Rein.
 * @param {string} text Dateiinhalt
 * @returns {Array<object>} normalisierte Kunden (ohne Müll)
 */
export function importKundenAusText(text) {
  const raw = String(text || '');
  const roh = /BEGIN:VCARD/i.test(raw) ? parseVcard(raw) : parseKundenCsv(raw);
  return roh.map(normalizeKunde).filter(Boolean);
}
