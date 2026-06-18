// src/domain/lohnbuchung.js
// Lohn-/Gehaltsbuchung nach der Brutto-Methode — reine, cent-genaue Buchungslogik (SKR03).
//
// WICHTIG (ehrliche Abgrenzung): Dieses Modul RECHNET KEINE Lohnsteuer und KEINE
// Sozialversicherungsbeiträge aus — es gibt keine amtlichen Lohnsteuertabellen, kein ELStAM,
// keine SV-Meldungen. Es nimmt die BEREITS BERECHNETEN Beträge entgegen (Brutto, Lohn-/
// Kirchensteuer + SolZ, SV-Arbeitnehmer- und -Arbeitgeberanteil) — typischerweise aus der
// Entgeltabrechnung des Lohnbüros/Steuerberaters bzw. eines Lohnprogramms — und bildet daraus
// die korrekte, ausgeglichene Buchung. Die App ist also die prüfungssichere Buchhaltungsschicht
// für die Lohnabrechnung, NICHT die Abrechnung selbst.
//
// Brutto-Methode (SKR03), verrechnete Konten:
//   Soll  4120 Gehälter (Bruttoarbeitslohn, Aufwand)
//   Soll  4130 Gesetzliche soziale Aufwendungen (Arbeitgeber-Anteil SV, Aufwand)
//   Haben 1200 Bank             (Netto-Auszahlung)            — oder 1740 „auf Ziel"
//   Haben 1741 Verb. Lohn-/Kirchensteuer (LSt + SolZ + KiSt → Finanzamt)
//   Haben 1742 Verb. soziale Sicherheit  (SV AN-Anteil + AG-Anteil → SV-Träger)
//
// Rechnerisch ausgeglichen: Soll = Brutto + AG-Anteil; Haben = Netto + Steuern + (AN+AG-Anteil);
// mit Netto = Brutto − Steuern − AN-Anteil folgt Haben = Brutto + AG-Anteil = Soll. ✓

/** Standard-Konten der Lohn-/Gehaltsbuchung (SKR03). Über opts.konten je Zeile überschreibbar. */
export const LOHN_KONTEN = {
  bruttolohn: '4120', // Gehälter (Aufwand, Soll) — Bruttoarbeitslohn; für Löhne ggf. '4110'
  agAnteil:   '4130', // Gesetzliche soziale Aufwendungen (Aufwand, Soll) — AG-Anteil SV
  bank:       '1200', // Bank (Haben) — Netto-Auszahlung bei sofortiger Zahlung
  nettoVerb:  '1740', // Verbindlichkeiten aus Lohn und Gehalt (Haben) — Netto „auf Ziel"
  steuer:     '1741', // Verbindlichkeiten Lohn-/Kirchensteuer (Haben) — ans Finanzamt
  sozial:     '1742', // Verbindlichkeiten soziale Sicherheit (Haben) — an die SV-Träger
};

/** Gegenkonto der Netto-Auszahlung: sofort über die Bank oder als Verbindlichkeit „auf Ziel". */
export const LOHN_AUSZAHLUNG = { BANK: 'bank', VERBINDLICHKEIT: 'verbindlichkeit' };

// Ganze, nicht-negative Cent (defensiv gegen Strings/NaN/Negatives).
const c = (v) => Math.max(0, Math.round(Number(v) || 0));

/**
 * Nettolohn = Brutto − (Lohnsteuer + SolZ + Kirchensteuer) − SV-Arbeitnehmeranteil. Rein.
 * @param {{bruttoCent?:number, lohnsteuerCent?:number, solzCent?:number, kirchensteuerCent?:number, svAnCent?:number}} e
 * @returns {number} Cent (kann 0 sein)
 */
export function lohnNettoCent(e = {}) {
  return c(e.bruttoCent) - c(e.lohnsteuerCent) - c(e.solzCent) - c(e.kirchensteuerCent) - c(e.svAnCent);
}

/**
 * Plausibilitätsprüfung eines Lohnlaufs (keine Rechtsprüfung): Brutto > 0, Abzüge übersteigen
 * den Brutto nicht, und — falls ein Netto mitgegeben wurde — passt es zu Brutto minus Abzügen. Rein.
 * @param {object} e Lohnlauf-Eingabe (siehe lohnBuchungZeilen)
 * @returns {{ok:boolean, errors:string[]}}
 */
export function validateLohnlauf(e = {}) {
  const errors = [];
  const brutto = c(e.bruttoCent);
  if (brutto <= 0) errors.push('Bruttoarbeitslohn muss größer als 0 sein.');
  const abzuege = c(e.lohnsteuerCent) + c(e.solzCent) + c(e.kirchensteuerCent) + c(e.svAnCent);
  if (abzuege > brutto) errors.push('Die Abzüge (Steuern + SV-Arbeitnehmeranteil) übersteigen den Bruttolohn.');
  if (e.nettoCent != null && c(e.nettoCent) !== lohnNettoCent(e)) {
    errors.push('Nettolohn passt nicht zu Brutto minus Abzügen.');
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Ausgeglichene Buchungszeilen (Brutto-Methode) aus einem Lohnlauf. Rein, cent-genau.
 * @param {{bruttoCent?:number, lohnsteuerCent?:number, solzCent?:number, kirchensteuerCent?:number,
 *   svAnCent?:number, svAgCent?:number}} e Beträge in Cent (≥0; aus der Entgeltabrechnung)
 * @param {{konten?:object, auszahlung?:string}} [opts] Konto-Override + Gegenkonto der Auszahlung
 * @returns {{zeilen:Array<{konto:string,seite:'S'|'H',betrag:number}>, nettoCent:number,
 *   steuerSummeCent:number, svSummeCent:number, bruttoCent:number, sollCent:number,
 *   habenCent:number, ausgeglichen:boolean, auszahlung:string}}
 */
export function lohnBuchungZeilen(e = {}, opts = {}) {
  const k = { ...LOHN_KONTEN, ...(opts.konten || {}) };
  const brutto = c(e.bruttoCent);
  const lohnsteuer = c(e.lohnsteuerCent), solz = c(e.solzCent), kirche = c(e.kirchensteuerCent);
  const svAn = c(e.svAnCent), svAg = c(e.svAgCent);
  const steuerSummeCent = lohnsteuer + solz + kirche;
  const svSummeCent = svAn + svAg;
  const nettoCent = brutto - steuerSummeCent - svAn; // = lohnNettoCent(e)
  const auszahlung = opts.auszahlung === LOHN_AUSZAHLUNG.VERBINDLICHKEIT
    ? LOHN_AUSZAHLUNG.VERBINDLICHKEIT : LOHN_AUSZAHLUNG.BANK;
  const nettoKonto = auszahlung === LOHN_AUSZAHLUNG.VERBINDLICHKEIT ? k.nettoVerb : k.bank;

  const zeilen = [];
  // Soll: Bruttoaufwand + Arbeitgeber-Anteil SV.
  zeilen.push({ konto: k.bruttolohn, seite: 'S', betrag: brutto });
  if (svAg > 0) zeilen.push({ konto: k.agAnteil, seite: 'S', betrag: svAg });
  // Haben: Netto-Auszahlung + abzuführende Steuern + SV-Beiträge (AN+AG).
  if (nettoCent > 0) zeilen.push({ konto: nettoKonto, seite: 'H', betrag: nettoCent });
  if (steuerSummeCent > 0) zeilen.push({ konto: k.steuer, seite: 'H', betrag: steuerSummeCent });
  if (svSummeCent > 0) zeilen.push({ konto: k.sozial, seite: 'H', betrag: svSummeCent });

  const sollCent = brutto + svAg;
  const habenCent = nettoCent + steuerSummeCent + svSummeCent;
  return {
    zeilen, nettoCent, steuerSummeCent, svSummeCent, bruttoCent: brutto,
    sollCent, habenCent, ausgeglichen: sollCent === habenCent, auszahlung,
  };
}

/**
 * Buchungs-ENTWURF aus einem Lohnlauf (null bei ungültiger Eingabe). Festschreiben bleibt manuell
 * (GoBD) — der Store/das UI ruft store.saveEntwurf. Rein.
 * @param {object} e Lohnlauf-Eingabe (siehe lohnBuchungZeilen)
 * @param {{konten?:object, auszahlung?:string, datum?:string, monat?:string, name?:string}} [opts]
 * @returns {?{datum:string, beschreibung:string, begruendung:string, zeilen:Array,
 *   bruttoCent:number, nettoCent:number, steuerSummeCent:number, svSummeCent:number, auszahlung:string}}
 */
export function lohnBuchungEntwurf(e = {}, opts = {}) {
  if (!validateLohnlauf(e).ok) return null;
  const res = lohnBuchungZeilen(e, opts);
  if (!res.zeilen.length || !res.ausgeglichen) return null;
  const monatTeil = opts.monat ? ` ${opts.monat}` : '';
  const nameTeil = opts.name ? ` (${opts.name})` : '';
  return {
    datum: opts.datum || new Date().toISOString().slice(0, 10),
    beschreibung: `Lohn/Gehalt${monatTeil}${nameTeil}`.trim(),
    begruendung: 'Lohn-/Gehaltsbuchung nach der Brutto-Methode (SKR03). Beträge wie eingegeben '
      + '(z. B. aus der Entgeltabrechnung des Lohnbüros/Steuerberaters); BookLedgerPro berechnet '
      + 'keine Lohnsteuer/Sozialversicherung. Festschreiben manuell (GoBD).',
    zeilen: res.zeilen,
    bruttoCent: res.bruttoCent,
    nettoCent: res.nettoCent,
    steuerSummeCent: res.steuerSummeCent,
    svSummeCent: res.svSummeCent,
    auszahlung: res.auszahlung,
  };
}

// 'YYYY-MM' oder '' (defensiv).
function monatNormal(m) {
  const s = String(m || '').slice(0, 7);
  return /^\d{4}-\d{2}$/.test(s) ? s : '';
}

/**
 * Normalisiert einen (persistierten) Lohnlauf: säubert die Cent-Eingaben und RECHNET die
 * abgeleiteten Felder (Netto/Steuersumme/SV-Summe) konsistent über `lohnBuchungZeilen` NACH —
 * eine einzige Wahrheitsquelle, egal was im Record stand. Rein.
 * @param {object} l roher Lohnlauf
 * @returns {{mitarbeiterId:?string, name:string, monat:string, bruttoCent:number,
 *   lohnsteuerCent:number, solzCent:number, kirchensteuerCent:number, svAnCent:number,
 *   svAgCent:number, nettoCent:number, steuerSummeCent:number, svSummeCent:number, auszahlung:string}}
 */
export function normalizeLohnlauf(l = {}) {
  const e = {
    bruttoCent: c(l.bruttoCent),
    lohnsteuerCent: c(l.lohnsteuerCent),
    solzCent: c(l.solzCent),
    kirchensteuerCent: c(l.kirchensteuerCent),
    svAnCent: c(l.svAnCent),
    svAgCent: c(l.svAgCent),
  };
  const r = lohnBuchungZeilen(e, { auszahlung: l.auszahlung });
  return {
    mitarbeiterId: l.mitarbeiterId ?? null,
    name: String(l.name || ''),
    monat: monatNormal(l.monat),
    ...e,
    nettoCent: r.nettoCent,
    steuerSummeCent: r.steuerSummeCent,
    svSummeCent: r.svSummeCent,
    auszahlung: r.auszahlung,
  };
}

/**
 * Buchungsdatum eines Lohnlaufs: der MONATSLETZTE des Abrechnungsmonats (Lohn wird i. d. R.
 * zum Monatsende gebucht). Ohne erkennbaren Monat → `heute` (Default: heutiges Datum). Rein.
 * @param {string} monat 'YYYY-MM'
 * @param {string} [heute] ISO-Datum (Fallback)
 * @returns {string} 'YYYY-MM-TT'
 */
export function lohnlaufBuchungsdatum(monat, heute) {
  const fallback = heute || new Date().toISOString().slice(0, 10);
  const m = monatNormal(monat);
  if (!m) return fallback;
  const [y, mm] = m.split('-').map(Number);
  const tag = new Date(Date.UTC(y, mm, 0)).getUTCDate(); // Tag 0 des Folgemonats = letzter Tag
  return `${m}-${String(tag).padStart(2, '0')}`;
}

/**
 * Lohnkonto-Aggregat: verdichtet viele Lohnläufe je Mitarbeiter (Jahressummen) + Gesamtsumme.
 * Optional auf ein `jahr` gefiltert (über den Abrechnungsmonat). Rein — die abgeleiteten Felder
 * jedes Laufs werden über `normalizeLohnlauf` frisch gerechnet (konsistent).
 * @param {Array} laeufe Lohnläufe (roh oder normalisiert)
 * @param {{jahr?:number|string}} [opts]
 * @returns {{jahr:?number, proMitarbeiter:Array, summe:{anzahl:number, bruttoCent:number,
 *   steuerSummeCent:number, svSummeCent:number, nettoCent:number, agAnteilCent:number}}}
 */
export function lohnkontoAggregat(laeufe = [], opts = {}) {
  const jahr = (opts.jahr != null && opts.jahr !== '') ? Number(opts.jahr) : null;
  const byId = new Map();
  const summe = { anzahl: 0, bruttoCent: 0, steuerSummeCent: 0, svSummeCent: 0, nettoCent: 0, agAnteilCent: 0 };
  for (const raw of laeufe || []) {
    if (!raw) continue;
    const l = normalizeLohnlauf(raw);
    const ljahr = l.monat ? Number(l.monat.slice(0, 4)) : null;
    if (jahr != null && ljahr !== jahr) continue;
    const id = l.mitarbeiterId != null ? String(l.mitarbeiterId) : (l.name || 'unbekannt');
    let m = byId.get(id);
    if (!m) {
      m = { mitarbeiterId: l.mitarbeiterId ?? null, name: l.name, anzahl: 0, bruttoCent: 0,
        steuerSummeCent: 0, svAnCent: 0, svAgCent: 0, svSummeCent: 0, nettoCent: 0, monate: [] };
      byId.set(id, m);
    }
    if (l.name && !m.name) m.name = l.name;
    m.anzahl++;
    m.bruttoCent += l.bruttoCent;
    m.steuerSummeCent += l.steuerSummeCent;
    m.svAnCent += l.svAnCent;
    m.svAgCent += l.svAgCent;
    m.svSummeCent += l.svSummeCent;
    m.nettoCent += l.nettoCent;
    if (l.monat && !m.monate.includes(l.monat)) m.monate.push(l.monat);
    summe.anzahl++;
    summe.bruttoCent += l.bruttoCent;
    summe.steuerSummeCent += l.steuerSummeCent;
    summe.svSummeCent += l.svSummeCent;
    summe.nettoCent += l.nettoCent;
    summe.agAnteilCent += l.svAgCent;
  }
  const proMitarbeiter = [...byId.values()]
    .map((m) => ({ ...m, monate: m.monate.slice().sort() }))
    .sort((a, b) => b.bruttoCent - a.bruttoCent || (a.name || '').localeCompare(b.name || ''));
  return { jahr, proMitarbeiter, summe };
}
