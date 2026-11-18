// src/domain/xlsxZeilen.js
// Excel-Datei (.xlsx) → Zeilen aus Zellen (Text), für denselben Leser wie CSV (bankCsv.js).
// Build-frei, ohne fremdes Paket (Klaus 2026-11-18): .xlsx ist ein ZIP mit XML; entpackt wird mit dem
// DecompressionStream des Browsers (auch in Node ≥ 18). Reine Funktion — kein Netz, kein DOM.
//
// Gelesen wird: Arbeitsmappe → erstes (oder genanntes) Blatt, gemeinsame Texte, Zahlen, Wahrheitswerte,
// Texte in der Zelle; Zellen im Datumsformat werden 'JJJJ-MM-TT'. Zahlen kommen mit Punkt als Dezimalzeichen.
// EHRLICHE GRENZEN: keine Formeln (nur der gespeicherte Wert), keine alten .xls-Dateien (dort „als CSV
// speichern“), keine verschlüsselten Mappen, ZIP64 nicht; die Prüfsumme der ZIP-Einträge wird nicht geprüft.

const td = new TextDecoder('utf-8');

function u16(b, o) { return b[o] | (b[o + 1] << 8); }
function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}

/** Liest das Inhaltsverzeichnis eines ZIP. @returns {Map<string,{methode:number, start:number, laenge:number}>} */
export function zipVerzeichnis(bytes) {
  const b = bytes;
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
    if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('keine-zip-datei');
  const anzahl = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const eintraege = new Map();
  for (let n = 0; n < anzahl; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error('zip-verzeichnis-kaputt');
    const methode = u16(b, p + 10), laenge = u32(b, p + 20);
    const nameL = u16(b, p + 28), extraL = u16(b, p + 30), kommL = u16(b, p + 32);
    const lokal = u32(b, p + 42);
    const name = td.decode(b.subarray(p + 46, p + 46 + nameL));
    if (u32(b, lokal) !== 0x04034b50) throw new Error('zip-eintrag-kaputt');
    const start = lokal + 30 + u16(b, lokal + 26) + u16(b, lokal + 28);
    eintraege.set(name, { methode, start, laenge });
    p += 46 + nameL + extraL + kommL;
  }
  return eintraege;
}

/** Entpackt einen Eintrag als Text (oder null, wenn es ihn nicht gibt). */
export async function zipText(bytes, verzeichnis, name) {
  const e = verzeichnis.get(name) || verzeichnis.get(name.replace(/^\//, ''));
  if (!e) return null;
  const roh = bytes.subarray(e.start, e.start + e.laenge);
  if (e.methode === 0) return td.decode(roh);
  if (e.methode === 8) return td.decode(await inflateRaw(roh));
  throw new Error('zip-methode-' + e.methode);
}

function xmlEnt(s) {
  return String(s).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
// Text aller <t>-Knoten (Rich Text hat mehrere <r><t>…</t></r>; <rPh> ist Lautschrift und bleibt weg).
function tText(xml) {
  const ohne = String(xml).replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, '');
  let out = '';
  const re = /<(?:\w+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?t>)/g; let m;
  while ((m = re.exec(ohne))) out += xmlEnt(m[1] || '');
  return out;
}
function attr(tag, name) {
  const m = String(tag).match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? xmlEnt(m[1]) : null;
}

// Eingebaute Zahlenformate für Datum/Zeit (ECMA-376, 18.8.30).
const DATUM_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
function datumsStile(stylesXml) {
  if (!stylesXml) return [];
  const eigene = {};
  const reF = /<(?:\w+:)?numFmt\b[^>]*>/g; let m;
  while ((m = reF.exec(stylesXml))) {
    const id = +attr(m[0], 'numFmtId'), code = String(attr(m[0], 'formatCode') || '').replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
    eigene[id] = /[dy]/i.test(code);   // Tag oder Jahr im Format = Datum (Zeit allein „hh:mm“ bleibt Zahl)
  }
  const xfs = (stylesXml.match(/<(?:\w+:)?cellXfs\b[\s\S]*?<\/(?:\w+:)?cellXfs>/) || [''])[0];
  const out = [];
  const reX = /<(?:\w+:)?xf\b[^>]*>/g;
  while ((m = reX.exec(xfs))) {
    const id = +attr(m[0], 'numFmtId');
    out.push(DATUM_IDS.has(id) || !!eigene[id]);
  }
  return out;
}

// Excel-Seriennummer (System 1900) → 'JJJJ-MM-TT'. 1904-System über `datum1904`.
export function excelDatum(zahl, datum1904 = false) {
  const n = Math.floor(Number(zahl));
  if (!Number.isFinite(n) || n <= 0) return '';
  const ms = datum1904 ? Date.UTC(1904, 0, 1) + n * 86400000 : Date.UTC(1899, 11, 30) + n * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function spalteNr(ref) {
  const m = String(ref || '').match(/^([A-Z]+)/);
  if (!m) return -1;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function zahlText(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return String(Math.round(n * 1e6) / 1e6);   // Fließkomma-Reste (0.30000000000000004) weg
}

/**
 * Liest eine .xlsx-Datei in Zeilen.
 * @param {Uint8Array|ArrayBuffer} daten
 * @param {{blatt?: number|string}} opts erstes Blatt (0) ab Werk; Zahl = Nummer, Text = Name
 * @returns {Promise<{blaetter:string[], blatt:string, zeilen:string[][]}>}
 */
export async function xlsxZeilen(daten, opts = {}) {
  const bytes = daten instanceof Uint8Array ? daten : new Uint8Array(daten || []);
  if (bytes.length < 4 || u32(bytes, 0) !== 0x04034b50) {
    // D0 CF 11 E0 = alte .xls (OLE) — nicht gelesen
    if (bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new Error('alte-xls');
    throw new Error('keine-xlsx-datei');
  }
  const vz = zipVerzeichnis(bytes);
  const mappe = await zipText(bytes, vz, 'xl/workbook.xml');
  if (!mappe) throw new Error('keine-xlsx-datei');
  const rels = (await zipText(bytes, vz, 'xl/_rels/workbook.xml.rels')) || '';
  const datum1904 = /<(?:\w+:)?workbookPr\b[^>]*\bdate1904="(1|true)"/.test(mappe);
  const blaetter = [];
  const reS = /<(?:\w+:)?sheet\b[^>]*>/g; let m;
  while ((m = reS.exec(mappe))) blaetter.push({ name: attr(m[0], 'name') || '', rid: attr(m[0], 'r:id') || attr(m[0], 'id') });
  if (!blaetter.length) throw new Error('keine-blaetter');
  const wahl = typeof opts.blatt === 'string' ? blaetter.find((b) => b.name === opts.blatt) : blaetter[Number(opts.blatt) || 0];
  if (!wahl) throw new Error('blatt-fehlt');
  let ziel = null;
  const reR = /<(?:\w+:)?Relationship\b[^>]*>/g;
  while ((m = reR.exec(rels))) if (attr(m[0], 'Id') === wahl.rid) ziel = attr(m[0], 'Target');
  const pfad = !ziel ? `xl/worksheets/sheet${blaetter.indexOf(wahl) + 1}.xml`
    : ziel.startsWith('/') ? ziel.slice(1) : 'xl/' + ziel.replace(/^\.\//, '');
  const blattXml = await zipText(bytes, vz, pfad);
  if (!blattXml) throw new Error('blatt-fehlt');

  const geteilt = [];
  const sst = await zipText(bytes, vz, 'xl/sharedStrings.xml');
  if (sst) { const reSi = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>|<(?:\w+:)?si\b[^>]*\/>/g; while ((m = reSi.exec(sst))) geteilt.push(tText(m[1] || '')); }
  const istDatumStil = datumsStile(await zipText(bytes, vz, 'xl/styles.xml'));

  const zeilen = [];
  const reRow = /<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g;
  while ((m = reRow.exec(blattXml))) {
    const rNr = Number(attr(m[1], 'r')) || zeilen.length + 1;
    const zeile = [];
    const reC = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g; let c;
    while ((c = reC.exec(m[2]))) {
      const kopf = c[1], innen = c[2] || '';
      const typ = attr(kopf, 't') || 'n', stil = Number(attr(kopf, 's') || 0);
      let i = spalteNr(attr(kopf, 'r'));
      if (i < 0) i = zeile.length;
      const v = (innen.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/) || [])[1];
      let wert = '';
      if (typ === 's') wert = geteilt[Number(v)] ?? '';
      else if (typ === 'inlineStr') wert = tText(innen);
      else if (typ === 'str' || typ === 'e') wert = xmlEnt(v || '');
      else if (typ === 'b') wert = v === '1' ? 'WAHR' : 'FALSCH';
      else if (typ === 'd') wert = String(v || '').slice(0, 10);
      else if (v != null && v !== '') wert = istDatumStil[stil] ? excelDatum(v, datum1904) : zahlText(v);
      while (zeile.length < i) zeile.push('');
      zeile[i] = String(wert).trim();
    }
    while (zeilen.length < rNr - 1) zeilen.push([]);
    zeilen.push(zeile);
  }
  // Leere Zeilen weg (wie beim CSV-Leser), Reihenfolge bleibt.
  return { blaetter: blaetter.map((b) => b.name), blatt: wahl.name, zeilen: zeilen.filter((r) => r.some((x) => x !== '')) };
}
