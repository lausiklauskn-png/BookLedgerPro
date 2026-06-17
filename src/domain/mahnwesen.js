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

/**
 * Fälligkeitsdatum eines offenen Postens/einer Rechnung mit **Zahlungsziel JE POSTEN**
 * (A1-Rest): explizites `faelligAm` hat Vorrang, sonst Rechnungsdatum + posten-eigenes
 * `zahlungszielTage`, sonst Rechnungsdatum + `defaultZielTage`. So gilt ein je Auftrag/
 * Rechnung vereinbartes Ziel (14/30/60 …) statt nur des globalen Defaults aus den
 * Einstellungen. Spiegelbild zu payables.berechneFaelligAm (das hierher delegiert).
 * @param {{faelligAm?:string, datum?:string, zahlungszielTage?:?number}} posten
 * @param {number} [defaultZielTage=14]
 * @returns {string} JJJJ-MM-TT (oder '' ohne Datum)
 */
export function faelligAmVon(posten = {}, defaultZielTage = 14) {
  if (posten.faelligAm) return posten.faelligAm;
  if (!posten.datum) return '';
  const ziel = posten.zahlungszielTage != null ? posten.zahlungszielTage : defaultZielTage;
  return faelligkeit(posten.datum, ziel);
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

/** Klartext-Bezeichnung einer Mahnstufe (0–4). */
export function mahnStufeLabel(stufe) {
  return ['offen', 'Zahlungserinnerung', '1. Mahnung', '2. Mahnung', '3. Mahnung'][Math.max(0, Math.min(4, Number(stufe) || 0))];
}

/**
 * Höchste tatsächlich erfasste (gesendete) Mahnstufe eines Auftrags/einer Forderung.
 * Persistenter Verlauf in `auftrag.mahnungen` [{datum, stufe, zinsenCent, gebuehrenCent}].
 */
export function letzteMahnstufe(auftrag) {
  let max = 0;
  for (const m of (auftrag && auftrag.mahnungen) || []) max = Math.max(max, Number(m.stufe) || 0);
  return max;
}

/**
 * Schlägt die nächste zu sendende Mahnstufe vor — auf Basis des PERSISTENTEN Verlaufs:
 * ohne bisherige Mahnung die anhand der Überfälligkeit abgeleitete Stufe, sonst die
 * nächsthöhere nach der zuletzt gesendeten (gedeckelt bei 3. Mahnung = 4).
 * @returns {{stufe:0|1|2|3|4, label:string, mahnbar:boolean, letzteGesendet:number}}
 */
export function vorschlagNaechsteStufe(auftrag, tageUeber, schwellen) {
  const letzte = letzteMahnstufe(auftrag);
  const stufe = letzte === 0 ? mahnstufe(tageUeber, schwellen).stufe : Math.min(4, letzte + 1);
  return { stufe, label: mahnStufeLabel(stufe), mahnbar: stufe >= 1, letzteGesendet: letzte };
}

/** Summe der im Verlauf erfassten Verzugszinsen/Mahngebühren (Cent). */
export function mahnVerlaufSumme(auftrag) {
  let zinsenCent = 0, gebuehrenCent = 0;
  for (const m of (auftrag && auftrag.mahnungen) || []) {
    zinsenCent += Math.round(Number(m.zinsenCent) || 0);
    gebuehrenCent += Math.round(Number(m.gebuehrenCent) || 0);
  }
  return { zinsenCent, gebuehrenCent };
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
 * Ist der Kunde ein Unternehmer (B2B)? Entscheidet über den Verzugszins-Aufschlag
 * (B2B +9, Verbraucher +5 %-Punkte) und die 40-€-Pauschale (nur B2B). Default B2B,
 * wenn kein Kunde/keine Angabe vorliegt (konservativ — kein versehentliches Verbraucher-Privileg).
 */
export function kundeIstB2B(kunde) {
  return kunde ? !kunde.istVerbraucher : true;
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
    const faelligAm = faelligAmVon(p, zielTage);
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
  const faelligAm = posten.faelligAm || faelligAmVon(posten, zielTage);
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

// ---- Buchung von Verzugszinsen/Mahngebühren (R1) ----------------------------
//
// EHRLICHE USt-EINORDNUNG: Sowohl Verzugszinsen als auch Mahngebühren sind nach
// h. M. (Abschn. 1.3 UStAE) NICHT steuerbarer **echter Schadensersatz** — es fehlt
// der Leistungsaustausch. Daher KEINE Umsatzsteuer auf der Buchung; die Forderung
// gegen den säumigen Schuldner erhöht sich um den Brutto = Netto-Betrag. Im Zweifel
// (z. B. vertraglich vereinbarte „Bearbeitungsgebühr") den Berater fragen.

/** Standard-Kontenzuordnung (SKR03) für die Buchung von Verzugszinsen/Mahngebühren. */
export const MAHN_KONTEN = {
  forderung: '1400',      // Forderungen aus Lieferungen und Leistungen (Soll)
  zinsertrag: '2650',     // Sonstige Zinsen und ähnliche Erträge (Haben)
  gebuehrertrag: '2700',  // Sonstige betriebliche Erträge (Haben)
};

/**
 * Baut die Buchungszeilen für berechnete Verzugszinsen/Mahngebühren (ohne USt).
 *
 *   Soll  Forderungen (1400)             zinsen + gebühren
 *   Haben Zinserträge (2650)             zinsen
 *   Haben Sonstige betr. Erträge (2700)  gebühren
 *
 * @param opts.zinsenCent Verzugszinsen (Cent, ≥0)
 * @param opts.gebuehrenCent Mahngebühren/Pauschale (Cent, ≥0)
 * @param opts.konten optionale Konto-Überschreibung (forderung/zinsertrag/gebuehrertrag)
 * @returns {{zeilen:Array, summeCent:number, zinsenCent:number, gebuehrenCent:number}}
 */
export function mahnbuchungZeilen(opts = {}) {
  const zinsenCent = Math.max(0, Math.round(Number(opts.zinsenCent) || 0));
  const gebuehrenCent = Math.max(0, Math.round(Number(opts.gebuehrenCent) || 0));
  const k = { ...MAHN_KONTEN, ...(opts.konten || {}) };
  const summeCent = zinsenCent + gebuehrenCent;
  const zeilen = [];
  if (summeCent > 0) {
    zeilen.push({ konto: k.forderung, seite: 'S', betrag: summeCent });
    if (zinsenCent > 0) zeilen.push({ konto: k.zinsertrag, seite: 'H', betrag: zinsenCent });
    if (gebuehrenCent > 0) zeilen.push({ konto: k.gebuehrertrag, seite: 'H', betrag: gebuehrenCent });
  }
  return { zeilen, summeCent, zinsenCent, gebuehrenCent };
}

/**
 * Baut einen vollständigen Buchungs-ENTWURF (manuell, KEIN Auto-Festschreiben —
 * GoBD-Disziplin) für Verzugszinsen/Mahngebühren aus einem offenen Posten bzw. den
 * Mahnschreiben-Daten. Gibt null zurück, wenn weder Zinsen noch Gebühren anfallen.
 * @returns {{datum, beschreibung, begruendung, zeilen, summeCent, zinsenCent, gebuehrenCent}|null}
 */
export function mahnbuchungEntwurf(opts = {}) {
  const res = mahnbuchungZeilen(opts);
  if (!res.zeilen.length) return null;
  const teile = [];
  if (res.zinsenCent > 0) teile.push('Verzugszinsen');
  if (res.gebuehrenCent > 0) teile.push('Mahngebühren');
  const refTeil = opts.referenz ? ` Rechnung ${opts.referenz}` : '';
  const nameTeil = opts.name ? ` (${opts.name})` : '';
  return {
    datum: opts.datum || new Date().toISOString().slice(0, 10),
    beschreibung: `${teile.join(' + ')}${refTeil}${nameTeil}`.trim(),
    begruendung: 'Verzugszinsen/Mahngebühren als nicht steuerbarer Schadensersatz (§ 288 BGB) — ohne USt. Im Zweifel Steuerberater.',
    zeilen: res.zeilen,
    summeCent: res.summeCent,
    zinsenCent: res.zinsenCent,
    gebuehrenCent: res.gebuehrenCent,
  };
}
