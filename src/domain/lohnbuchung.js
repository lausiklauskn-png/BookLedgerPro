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
