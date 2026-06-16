// src/domain/mahnwesen.js
// Mahnwesen / überfällige Forderungen (reine, testbare Logik). Ermittelt Fälligkeit,
// Überfälligkeit, Mahnstufe, Verzugszinsen (§ 288 BGB) und die Daten für ein
// Mahnschreiben. Kein Netz, kein DOM.
//
// EHRLICHER HINWEIS: Der Basiszinssatz (§ 247 BGB) ist veränderlich und muss aktuell
// gehalten werden (Einstellung `verzugBasiszinsProzent`). Verzugszinsen B2B = Basiszins
// + 9 %-Punkte, Verbraucher + 5 %-Punkte (§ 288 Abs. 1/2 BGB); 40-€-Pauschale nur B2B
// (§ 288 Abs. 5). Mahngebühren/USt-Behandlung sind Einzelfall → im Zweifel Berater.

// Tage zwischen zwei ISO-Daten (b - a) in ganzen Tagen, oder null.
function tageDiff(a, b) {
  if (!a || !b) return null;
  const da = Date.parse(a), db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

function addTage(iso, tage) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + (Number(tage) || 0));
  return d.toISOString().slice(0, 10);
}

/** Fälligkeitsdatum = Rechnungsdatum + Zahlungsziel (Tage, Default 14). */
export function faelligkeit(rechnungDatum, zielTage = 14) {
  return addTage(rechnungDatum, zielTage);
}

/** Tage überfällig (>0 wenn fällig + überschritten), sonst 0. */
export function tageUeberfaellig(faelligAm, heute) {
  const d = tageDiff(faelligAm, heute);
  return d != null && d > 0 ? d : 0;
}

// Standard-Schwellen (Tage überfällig) für die Mahnstufen. Konfigurierbar.
export const MAHN_SCHWELLEN = { erinnerung: 1, mahnung1: 14, mahnung2: 28, mahnung3: 42 };

/**
 * Schlägt anhand der Überfälligkeit eine Mahnstufe vor.
 * @returns {{stufe:0|1|2|3|4, label:string, mahnbar:boolean}}
 *  0 = offen (nicht überfällig) · 1 = Zahlungserinnerung · 2 = 1. Mahnung ·
 *  3 = 2. Mahnung · 4 = 3. Mahnung (Inkasso-Androhung)
 */
export function mahnstufe(tageUeber, schwellen = MAHN_SCHWELLEN) {
  const s = { ...MAHN_SCHWELLEN, ...schwellen };
  if (tageUeber >= s.mahnung3) return { stufe: 4, label: '3. Mahnung', mahnbar: true };
  if (tageUeber >= s.mahnung2) return { stufe: 3, label: '2. Mahnung', mahnbar: true };
  if (tageUeber >= s.mahnung1) return { stufe: 2, label: '1. Mahnung', mahnbar: true };
  if (tageUeber >= s.erinnerung) return { stufe: 1, label: 'Zahlungserinnerung', mahnbar: true };
  return { stufe: 0, label: 'offen', mahnbar: false };
}

/**
 * Verzugszinsen in Cent (§ 288 BGB), zeitanteilig (tage/365).
 * @param betragCent offener Betrag (brutto)
 * @param tage Verzugstage
 * @param opts.basiszinsProzent Basiszinssatz § 247 BGB (z. B. 3.37)
 * @param opts.b2b true = Unternehmer (+9 %-Punkte), false = Verbraucher (+5)
 */
export function verzugszinsenCent(betragCent, tage, opts = {}) {
  const basis = Number(opts.basiszinsProzent) || 0;
  const aufschlag = opts.b2b === false ? 5 : 9;
  const jahressatz = basis + aufschlag;
  const t = Math.max(0, Number(tage) || 0);
  return Math.round((Number(betragCent) || 0) * (jahressatz / 100) * (t / 365));
}

/** 40-€-Pauschale (§ 288 Abs. 5 BGB) — nur bei B2B-Verzug. */
export function mahnpauschaleCent(b2b = true, betragPauschaleCent = 4000) {
  return b2b === false ? 0 : betragPauschaleCent;
}

/**
 * Reichert offene Posten (aus zahlungsabgleich.offenePosten) um Fälligkeit/Überfälligkeit/
 * Mahnstufe an. `datum` der Posten = Rechnungsdatum.
 * @param posten Array von {id, betragCent, datum, referenz, name, …}
 * @param opts {heute, zielTage, schwellen}
 */
export function anreicherePosten(posten = [], opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const zielTage = opts.zielTage != null ? opts.zielTage : 14;
  return posten.map((p) => {
    const faelligAm = faelligkeit(p.datum, zielTage);
    const tage = tageUeberfaellig(faelligAm, heute);
    return { ...p, faelligAm, tageUeberfaellig: tage, ueberfaellig: tage > 0, mahnstufe: mahnstufe(tage, opts.schwellen) };
  });
}

/** Summe + Anzahl der überfälligen Forderungen (für Dashboard/Auswertung). */
export function ueberfaelligSummen(angereichertePosten = []) {
  const offen = angereichertePosten.filter((p) => p.ueberfaellig);
  return { anzahl: offen.length, summeCent: offen.reduce((s, p) => s + (p.betragCent || 0), 0) };
}

/**
 * Baut die Daten für ein Mahnschreiben zu EINEM offenen Posten.
 * @returns {{referenz, datum, faelligAm, tageUeberfaellig, stufe, stufeLabel,
 *   forderungCent, zinsenCent, pauschaleCent, gesamtCent, neueFrist, name}}
 */
export function mahnschreibenDaten(posten, opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const zielTage = opts.zielTage != null ? opts.zielTage : 14;
  const b2b = opts.b2b !== false;
  const faelligAm = posten.faelligAm || faelligkeit(posten.datum, zielTage);
  const tage = posten.tageUeberfaellig != null ? posten.tageUeberfaellig : tageUeberfaellig(faelligAm, heute);
  const st = posten.mahnstufe || mahnstufe(tage, opts.schwellen);
  const forderungCent = posten.betragCent || 0;
  // Zinsen/Pauschale erst ab „echter" Mahnung (Stufe ≥ 2), nicht bei bloßer Erinnerung.
  const mitKosten = st.stufe >= 2;
  const zinsenCent = mitKosten ? verzugszinsenCent(forderungCent, tage, { basiszinsProzent: opts.basiszinsProzent, b2b }) : 0;
  const pauschaleCent = mitKosten ? mahnpauschaleCent(b2b, opts.pauschaleCent) : 0;
  return {
    referenz: posten.referenz || '',
    name: posten.name || '',
    datum: heute,
    faelligAm,
    tageUeberfaellig: tage,
    stufe: st.stufe,
    stufeLabel: st.label,
    forderungCent,
    zinsenCent,
    pauschaleCent,
    gesamtCent: forderungCent + zinsenCent + pauschaleCent,
    neueFrist: addTage(heute, opts.neueFristTage != null ? opts.neueFristTage : 7),
  };
}
