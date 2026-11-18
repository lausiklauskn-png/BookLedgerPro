// src/domain/portemonnaieImport.js
// Monatsdatei des Portemonnaies („Portemonnaie-Monat“, Fassung 1) — ein Format, ein Leser.
// Die Private Akte schreibt sie einmal im Monat (Fächer Bargeld und Bank); BookLedgerPro
// (Pro und Basic) macht daraus Buchungs-ENTWÜRFE: Kasse 1000 bzw. Bank 1200 gegen ein
// vorgeschlagenes Konto. Festgeschrieben wird erst auf Tipp (GoBD). Reine Funktionen —
// kein Netz, kein DOM. Schreiben (baueMonatsdatei) und Lesen liegen hier zusammen, damit
// beide Seiten dieselbe Fassung sprechen (die Akte holt die Datei als Klon mit Pin).
//
// Form (JSON):
// { format: 'portemonnaie-monat', fassung: 1, quelle, monat: 'JJJJ-MM', erstellt: ISO,
//   faecher: [ { id, art: 'bargeld'|'bank', name, konto?: '…1234', anfangCent, endeCent,
//               summeReinCent, summeRausCent,
//               posten: [ { id, datum, cent (>0), richtung: 'rein'|'raus', text, wofuer?,
//                           beleg?: Kennung des Bons/Auszugs, vomKonto?: true (Barabhebung im Bargeld),
//                           zumBargeld?: true (dieselbe Abhebung im Bankfach) } ] } ] }
//
// EHRLICHER HINWEIS: das vorgeschlagene Gegenkonto ist ab Werk Privatentnahme (1800) bzw.
// Privateinlage (1890) — eine Vorgabe, keine Kontierung. Wer es genauer will, reicht
// `kontoFuer` hinein (z. B. die Kontoregeln aus ai/categorize).

export const MONATSDATEI_FORMAT = 'portemonnaie-monat';
export const MONATSDATEI_FASSUNG = 1;
export const STANDARD_KONTEN = Object.freeze({ kasse: '1000', bank: '1200', ausgabe: '1800', einnahme: '1890' });

const MONAT = /^\d{4}-(0[1-9]|1[0-2])$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;

function ganz(n) { return Number.isInteger(n) ? n : 0; }

/**
 * Baut die Monatsdatei aus den Fächern. Posten außerhalb des Monats werden nicht übernommen;
 * Summen und Endbestand rechnet die Funktion selbst.
 * @param {{monat:string, quelle?:string, erstellt?:string, faecher:Array<{id?:string, art:'bargeld'|'bank', name:string,
 *   konto?:string, anfangCent?:number, posten:Array<{id:string, datum:string, cent:number, richtung:'rein'|'raus',
 *   text?:string, wofuer?:string, beleg?:string|null, vomKonto?:boolean, zumBargeld?:boolean}>}>}} e
 */
export function baueMonatsdatei(e) {
  if (!MONAT.test(String(e && e.monat))) throw new Error('Monat fehlt (JJJJ-MM).');
  const faecher = (e.faecher || []).map((f, i) => {
    const posten = (f.posten || []).filter((p) => String(p.datum || '').slice(0, 7) === e.monat).map((p) => {
      const q = { id: String(p.id), datum: p.datum, cent: Math.abs(ganz(p.cent)), richtung: p.richtung === 'rein' ? 'rein' : 'raus', text: String(p.text || '').slice(0, 200) };
      if (p.wofuer) q.wofuer = String(p.wofuer).slice(0, 120);
      if (p.beleg) q.beleg = String(p.beleg);
      if (p.vomKonto) q.vomKonto = true;
      if (p.zumBargeld) q.zumBargeld = true;
      return q;
    }).sort((a, b) => a.datum.localeCompare(b.datum) || a.id.localeCompare(b.id));
    const rein = posten.filter((p) => p.richtung === 'rein').reduce((s, p) => s + p.cent, 0);
    const raus = posten.filter((p) => p.richtung === 'raus').reduce((s, p) => s + p.cent, 0);
    const anfang = ganz(f.anfangCent);
    const fach = { id: String(f.id || `${f.art}-${i + 1}`), art: f.art === 'bank' ? 'bank' : 'bargeld', name: String(f.name || (f.art === 'bank' ? 'Bank' : 'Bargeld')) };
    if (f.konto) fach.konto = String(f.konto).replace(/\s/g, '').slice(-4).replace(/^/, '…');
    return Object.assign(fach, { anfangCent: anfang, summeReinCent: rein, summeRausCent: raus, endeCent: anfang + rein - raus, posten });
  });
  return { format: MONATSDATEI_FORMAT, fassung: MONATSDATEI_FASSUNG, quelle: String(e.quelle || 'private-akte'), monat: e.monat, erstellt: e.erstellt || new Date().toISOString(), faecher };
}

/** Dateiname für die Übergabe. */
export function monatsdateiName(datei) { return `portemonnaie-${datei.monat}.json`; }

/** Sieht der Text/das Objekt wie eine Monatsdatei aus? (schnelle Prüfung vor dem Lesen) */
export function istMonatsdatei(x) {
  if (typeof x === 'string') return /"format"\s*:\s*"portemonnaie-monat"/.test(x);
  return !!x && x.format === MONATSDATEI_FORMAT;
}

/**
 * Liest und prüft eine Monatsdatei.
 * @returns {{ok:boolean, fehler:string[], warnungen:Array<{code:string, [k:string]:any}>, datei:object|null}}
 */
export function leseMonatsdatei(eingabe) {
  const fehler = [], warnungen = [];
  let d = eingabe;
  if (typeof eingabe === 'string') {
    try { d = JSON.parse(eingabe.replace(/^﻿/, '')); } catch { return { ok: false, fehler: ['kein-json'], warnungen, datei: null }; }
  }
  if (!d || d.format !== MONATSDATEI_FORMAT) return { ok: false, fehler: ['format'], warnungen, datei: null };
  if (d.fassung !== MONATSDATEI_FASSUNG) return { ok: false, fehler: ['fassung'], warnungen, datei: null };
  if (!MONAT.test(String(d.monat))) fehler.push('monat');
  if (!Array.isArray(d.faecher)) fehler.push('faecher');
  for (const f of d.faecher || []) {
    if (f.art !== 'bargeld' && f.art !== 'bank') fehler.push(`fach-art:${f.id}`);
    if (!Array.isArray(f.posten)) { fehler.push(`fach-posten:${f.id}`); continue; }
    let rein = 0, raus = 0;
    for (const p of f.posten) {
      if (!TAG.test(String(p.datum)) || !Number.isInteger(p.cent) || p.cent < 0 || (p.richtung !== 'rein' && p.richtung !== 'raus')) { fehler.push(`posten:${p.id}`); continue; }
      if (String(p.datum).slice(0, 7) !== d.monat) warnungen.push({ code: 'posten-ausserhalb', fach: f.id, posten: p.id });
      if (p.richtung === 'rein') rein += p.cent; else raus += p.cent;
    }
    if (Number.isInteger(f.anfangCent) && Number.isInteger(f.endeCent) && f.anfangCent + rein - raus !== f.endeCent) {
      warnungen.push({ code: 'bestand-differenz', fach: f.id, differenzCent: f.endeCent - (f.anfangCent + rein - raus) });
    }
  }
  return { ok: fehler.length === 0, fehler, warnungen, datei: fehler.length ? null : d };
}

/**
 * Monatsdatei → Buchungs-Entwürfe (Form wie saveEntwurf: datum, beschreibung, begruendung, zeilen).
 * - Bargeld: Kasse gegen Gegenkonto; eine Barabhebung (vomKonto) wird Kasse an Bank.
 * - Bank: Bank gegen Gegenkonto; die Abhebung (zumBargeld) wird übersprungen, wenn das Bargeld
 *   dabei ist — sonst stünde sie doppelt. Mit `nurBargeld` bleibt das Bankfach ganz weg
 *   (dann liest BookLedgerPro den Kontoauszug selbst).
 * @param {object} datei  aus leseMonatsdatei(...).datei
 * @param {{konten?:Partial<typeof STANDARD_KONTEN>, nurBargeld?:boolean,
 *   kontoFuer?:(posten:object, fach:object)=>string|null, bankKontoFuer?:(fach:object)=>string|null}} opts
 * @returns {{entwuerfe:Array<{datum:string, beschreibung:string, begruendung:string, zeilen:Array<{konto:string, seite:'S'|'H', betrag:number}>, herkunft:{fach:string, posten:string}}>,
 *   uebersprungen:Array<{fach:string, posten:string, grund:string}>}}
 */
export function monatsdateiEntwuerfe(datei, opts = {}) {
  const k = { ...STANDARD_KONTEN, ...(opts.konten || {}) };
  const entwuerfe = [], uebersprungen = [];
  const faecher = (datei && datei.faecher) || [];
  const mitBargeld = faecher.some((f) => f.art === 'bargeld');
  const bankKonto = (f) => (opts.bankKontoFuer && opts.bankKontoFuer(f)) || k.bank;
  const ersteBank = faecher.find((f) => f.art === 'bank');
  for (const f of faecher) {
    if (f.art === 'bank' && opts.nurBargeld) { for (const p of f.posten) uebersprungen.push({ fach: f.id, posten: p.id, grund: 'nur-bargeld' }); continue; }
    const eigen = f.art === 'bank' ? bankKonto(f) : k.kasse;
    for (const p of f.posten) {
      if (!p.cent) { uebersprungen.push({ fach: f.id, posten: p.id, grund: 'null-betrag' }); continue; }
      if (f.art === 'bank' && p.zumBargeld && mitBargeld) { uebersprungen.push({ fach: f.id, posten: p.id, grund: 'im-bargeld' }); continue; }
      const text = [p.text, p.wofuer ? `wofür: ${p.wofuer}` : ''].filter(Boolean).join(' · ');
      const herkunft = { fach: f.id, posten: p.id };
      if (f.art === 'bargeld' && p.vomKonto) {
        // Barabhebung: Geld wandert vom Konto in die Kasse (bzw. bei „raus“ zurück aufs Konto).
        const bk = ersteBank ? bankKonto(ersteBank) : k.bank;
        const rein = p.richtung === 'rein';
        entwuerfe.push({
          datum: p.datum, beschreibung: (rein ? 'Barabhebung' : 'Bareinzahlung') + (p.text ? ` · ${p.text}` : ''),
          begruendung: `Portemonnaie ${datei.monat}, ${f.name}: ${rein ? 'vom Konto ins Bargeld' : 'vom Bargeld aufs Konto'} – bei der Bank nicht noch einmal buchen.`,
          zeilen: rein ? [{ konto: k.kasse, seite: 'S', betrag: p.cent }, { konto: bk, seite: 'H', betrag: p.cent }]
            : [{ konto: bk, seite: 'S', betrag: p.cent }, { konto: k.kasse, seite: 'H', betrag: p.cent }],
          herkunft,
        });
        continue;
      }
      const gegen = (opts.kontoFuer && opts.kontoFuer(p, f)) || (p.richtung === 'rein' ? k.einnahme : k.ausgabe);
      const zeilen = p.richtung === 'rein'
        ? [{ konto: eigen, seite: 'S', betrag: p.cent }, { konto: gegen, seite: 'H', betrag: p.cent }]
        : [{ konto: gegen, seite: 'S', betrag: p.cent }, { konto: eigen, seite: 'H', betrag: p.cent }];
      entwuerfe.push({ datum: p.datum, beschreibung: text || (p.richtung === 'rein' ? 'Einnahme' : 'Ausgabe'), begruendung: `Portemonnaie ${datei.monat}, ${f.name}${f.konto ? ' ' + f.konto : ''}${p.beleg ? ' · mit Beleg' : ''}`, zeilen, herkunft });
    }
  }
  return { entwuerfe, uebersprungen };
}
