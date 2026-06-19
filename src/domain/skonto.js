// src/domain/skonto.js
// Skonto-Buchung mit USt-/Vorsteuer-Korrektur nach § 17 UStG (reine, testbare Logik —
// kein Netz, kein DOM). Wird ein offener Posten mit Skontoabzug bezahlt, mindert sich
// das Entgelt: beim Ausgangsumsatz (Forderung) sinkt die geschuldete USt, beim
// Eingangsumsatz (Verbindlichkeit) die abziehbare Vorsteuer — beides nach § 17 Abs. 1 UStG.
//
// EHRLICHER HINWEIS / GoBD: Dieser Modul liefert nur den Buchungs-ENTWURF. Festschreiben
// bleibt manuell (Korrektheit vor Bequemlichkeit). Der Skontobetrag (brutto = offen − gezahlt)
// wird je USt-Satz in Netto-Erlösschmälerung/-Aufwandsminderung und USt-/Vorsteuer-Korrektur
// zerlegt. Bei gemischten USt-Sätzen einer Rechnung wird der Skonto **proportional** zum
// Brutto-Anteil je Satz aufgeteilt (über `saetze`); ohne Angabe gilt der einzelne `ustProzent`.

// SKR03-Standardkonten für Skonti und die § 17-Korrektur.
export const SKONTO_KONTEN = {
  // Erlösschmälerung beim Verkauf (gewährter Skonto), je USt-Satz.
  gewaehrt: { 19: '8736', 7: '8731', 0: '8730' },
  // Aufwandsminderung beim Einkauf (erhaltener Skonto), je USt-Satz.
  erhalten: { 19: '3736', 7: '3731', 0: '3730' },
  // Korrekturkonten: geschuldete USt (Verkauf) bzw. abziehbare Vorsteuer (Einkauf).
  umsatzsteuer: { 19: '1776', 7: '1771' },
  vorsteuer: { 19: '1576', 7: '1571' },
  bank: '1200',
  forderung: '1400',
  verbindlichkeit: '1600',
};

/**
 * Zerlegt einen Brutto-Betrag in Netto + USt für einen einzelnen Steuersatz.
 * @returns {{nettoCent:number, ustCent:number}}
 */
export function skontoSplit(bruttoCent, ustProzent = 19) {
  const brutto = Math.round(Number(bruttoCent) || 0);
  const p = Number(ustProzent) || 0;
  if (p <= 0 || brutto <= 0) return { nettoCent: Math.max(0, brutto), ustCent: 0 };
  const nettoCent = Math.round(brutto / (1 + p / 100));
  return { nettoCent, ustCent: brutto - nettoCent };
}

// Verteilt `totalCent` exakt (Summe bleibt erhalten) proportional zu den Gewichten —
// größter-Rest-Methode, damit kein Cent verloren geht.
function verteile(totalCent, gewichte) {
  const sum = gewichte.reduce((s, w) => s + w, 0);
  if (sum <= 0) return gewichte.map(() => 0);
  const roh = gewichte.map((w) => (totalCent * w) / sum);
  const teil = roh.map((x) => Math.floor(x));
  let rest = totalCent - teil.reduce((s, x) => s + x, 0);
  const reihenfolge = roh
    .map((x, i) => [x - Math.floor(x), i])
    .sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < reihenfolge.length && rest > 0; k++, rest--) teil[reihenfolge[k][1]]++;
  return teil;
}

/** Normalisiert die Satz-Verteilung auf `[{ustProzent, bruttoCent}]` (positive Anteile). */
export function skontoSaetze(saetze) {
  return (saetze || [])
    .map((s) => ({
      ustProzent: Number(s.ustProzent) || 0,
      bruttoCent: Math.max(0, Math.round(Number(s.bruttoCent) || 0)),
    }))
    .filter((s) => s.bruttoCent > 0);
}

/**
 * Baut die vollständigen Buchungszeilen für eine Zahlung MIT Skontoabzug inkl.
 * § 17-Korrektur. Der offene Posten wird komplett ausgeglichen (Bank + Skonto-Netto +
 * USt-/Vorsteuer-Korrektur = offener Brutto-Betrag).
 *
 *  - Einnahme (Kunde zahlt Forderung, Skonto gewährt):
 *      Soll Bank (gezahlt) · Soll gewährte Skonti (netto) · Soll USt (Korrektur) /
 *      Haben Forderung (offen)
 *  - Ausgabe (wir zahlen Verbindlichkeit, Skonto erhalten):
 *      Soll Verbindlichkeit (offen) / Haben Bank (gezahlt) · Haben erhaltene Skonti (netto) ·
 *      Haben Vorsteuer (Korrektur)
 *
 * @param opts.richtung 'einnahme'|'ausgabe'
 * @param opts.offenCent offener Brutto-Posten
 * @param opts.zahlungCent tatsächlich geflossener (geringerer) Betrag
 * @param opts.ustProzent einzelner USt-Satz (Default 19), falls keine `saetze`
 * @param opts.saetze [{ustProzent, bruttoCent}] Brutto-Anteile je Satz (für gemischte Rechnungen)
 * @param opts.konten Konto-Überschreibung (Teil-Merge in SKONTO_KONTEN)
 * @returns {{zeilen, richtung, offenCent, zahlungCent, skontoBruttoCent, nettoSkontoCent, ustSkontoCent, saetze}|null}
 *   null, wenn kein gültiger Skonto-Fall (kein Abzug, Überzahlung, leere Zahlung).
 */
export function skontoBuchungZeilen(opts = {}) {
  const richtung = opts.richtung === 'ausgabe' ? 'ausgabe' : 'einnahme';
  const offenCent = Math.max(0, Math.round(Number(opts.offenCent) || 0));
  const zahlungCent = Math.max(0, Math.round(Number(opts.zahlungCent) || 0));
  const skontoBruttoCent = offenCent - zahlungCent;
  // Gültig nur: positiver Skontoabzug, echte Zahlung, kein Vollverzicht.
  if (skontoBruttoCent <= 0 || zahlungCent <= 0 || skontoBruttoCent >= offenCent) return null;

  const k = { ...SKONTO_KONTEN, ...(opts.konten || {}) };
  const bank = opts.bankKonto || k.bank;
  const gegenKonto = richtung === 'einnahme'
    ? (opts.forderungKonto || k.forderung)
    : (opts.verbindlichkeitKonto || k.verbindlichkeit);
  const skontoKontoMap = richtung === 'einnahme' ? k.gewaehrt : k.erhalten;
  const ustKontoMap = richtung === 'einnahme' ? k.umsatzsteuer : k.vorsteuer;

  // Satz-Verteilung bestimmen (explizit per `saetze`, sonst ein einzelner Satz).
  let saetze = skontoSaetze(opts.saetze);
  if (!saetze.length) {
    const p = opts.ustProzent != null ? Number(opts.ustProzent) : 19;
    saetze = [{ ustProzent: p, bruttoCent: offenCent }];
  }
  // Skonto-Brutto proportional zum Brutto-Anteil je Satz aufteilen (exakt, kein Cent-Verlust).
  const anteile = verteile(skontoBruttoCent, saetze.map((s) => s.bruttoCent));

  const teile = []; // {ustProzent, nettoCent, ustCent, skontoKonto, ustKonto}
  let nettoSkontoCent = 0, ustSkontoCent = 0;
  saetze.forEach((s, i) => {
    const anteil = anteile[i];
    if (anteil <= 0) return;
    const { nettoCent, ustCent } = skontoSplit(anteil, s.ustProzent);
    const skontoKonto = skontoKontoMap[s.ustProzent] || skontoKontoMap[0] || skontoKontoMap[19];
    const ustKonto = ustKontoMap[s.ustProzent] || null;
    nettoSkontoCent += nettoCent;
    ustSkontoCent += ustCent;
    teile.push({ ustProzent: s.ustProzent, nettoCent, ustCent, skontoKonto, ustKonto });
  });

  const zeilen = [];
  if (richtung === 'einnahme') {
    zeilen.push({ konto: bank, seite: 'S', betrag: zahlungCent });
    for (const t of teile) {
      // Ohne passendes USt-Konto (z. B. 0 %) bleibt der Bruttobetrag auf dem Skonto-Konto.
      const nettoBetrag = (t.ustCent > 0 && t.ustKonto) ? t.nettoCent : t.nettoCent + t.ustCent;
      zeilen.push({ konto: t.skontoKonto, seite: 'S', betrag: nettoBetrag });
      if (t.ustCent > 0 && t.ustKonto) zeilen.push({ konto: t.ustKonto, seite: 'S', betrag: t.ustCent });
    }
    zeilen.push({ konto: gegenKonto, seite: 'H', betrag: offenCent });
  } else {
    zeilen.push({ konto: gegenKonto, seite: 'S', betrag: offenCent });
    zeilen.push({ konto: bank, seite: 'H', betrag: zahlungCent });
    for (const t of teile) {
      const nettoBetrag = (t.ustCent > 0 && t.ustKonto) ? t.nettoCent : t.nettoCent + t.ustCent;
      zeilen.push({ konto: t.skontoKonto, seite: 'H', betrag: nettoBetrag });
      if (t.ustCent > 0 && t.ustKonto) zeilen.push({ konto: t.ustKonto, seite: 'H', betrag: t.ustCent });
    }
  }

  return {
    zeilen,
    richtung,
    offenCent,
    zahlungCent,
    skontoBruttoCent,
    nettoSkontoCent,
    ustSkontoCent,
    saetze: teile,
  };
}

/**
 * Vollständiger Buchungs-ENTWURF (manuell, KEIN Auto-Festschreiben — GoBD) für eine
 * Zahlung mit Skontoabzug inkl. § 17-Korrektur. Gibt null zurück, wenn kein Skonto-Fall.
 * @returns {{datum, beschreibung, begruendung, zeilen, ...meta}|null}
 */
export function skontoEntwurf(opts = {}) {
  const res = skontoBuchungZeilen(opts);
  if (!res) return null;
  const refTeil = opts.referenz ? ` Rechnung ${opts.referenz}` : '';
  const nameTeil = opts.name ? ` (${opts.name})` : '';
  const wort = res.richtung === 'einnahme'
    ? 'Zahlungseingang mit gewährtem Skonto'
    : 'Zahlungsausgang mit erhaltenem Skonto';
  const euro = (c) => (c / 100).toFixed(2).replace('.', ',');
  const korr = res.richtung === 'einnahme' ? 'Umsatzsteuer' : 'Vorsteuer';
  return {
    datum: opts.datum || new Date().toISOString().slice(0, 10),
    beschreibung: `${wort}${refTeil}${nameTeil}`.trim(),
    begruendung: `Skontoabzug ${euro(res.skontoBruttoCent)} € brutto (netto ${euro(res.nettoSkontoCent)} € + ${korr} ${euro(res.ustSkontoCent)} €); Entgeltminderung mit ${korr}-Korrektur nach § 17 Abs. 1 UStG. Manuell prüfen — im Zweifel Steuerberater.`,
    zeilen: res.zeilen,
    richtung: res.richtung,
    offenCent: res.offenCent,
    zahlungCent: res.zahlungCent,
    skontoBruttoCent: res.skontoBruttoCent,
    nettoSkontoCent: res.nettoSkontoCent,
    ustSkontoCent: res.ustSkontoCent,
  };
}
