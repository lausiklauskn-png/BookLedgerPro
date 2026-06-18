// src/domain/eingangsverzug.js
// Eingangsrechnungs-Verzug (Gegenseite) — Spiegelbild zum Mahnwesen, aber aus
// SCHULDNER-Sicht: Wir bekommen eine Eingangsrechnung (Kreditor) und zahlen sie ggf.
// zu spät. Dann (a) ist die eigene Überfälligkeit gestaffelt sichtbar (Liquidität/
// Skonto/Verzugsrisiko) und (b) wenn der Lieferant eine MAHNUNG mit Verzugszinsen +
// Mahngebühren schickt, lässt sich prüfen, ob die geforderten Beträge nach § 288 BGB
// überhaupt berechtigt sind, bevor man sie zahlt.
//
// Reine, cent-genaue Logik (node-getestet). Kein Netz, kein DOM. Persistenz/Anzeige:
// payables-store.js / ui/views/payables.js. Die §-288-Rechnung wird aus mahnwesen.js
// wiederverwendet (DRY — identische Formel wie auf der Forderungsseite).
//
// EHRLICHER HINWEIS (Recht): Verzug setzt grundsätzlich Fälligkeit + Mahnung ODER den
// Ablauf von 30 Tagen nach Fälligkeit/Rechnungszugang voraus (§ 286 BGB). Diese Logik
// rechnet auf Basis der TAGE ÜBERFÄLLIG — das ist eine Hilfs-Einordnung, KEINE
// Rechtsberatung. Der Basiszinssatz (§ 247 BGB) ist veränderlich (Einstellung
// `verzugBasiszinsProzent`). Verzugszinsen für eine Entgeltforderung gegenüber einem
// Nicht-Verbraucher = Basiszins + 9 %-Punkte, die 40-€-Pauschale (§ 288 Abs. 5 BGB)
// fällt einmal je Forderung an. Im Zweifel den Steuerberater/Anwalt fragen.

import { faelligAmVon, tageUeberfaellig, verzugszinsenCent, mahnpauschaleCent } from './mahnwesen.js';

// Standard-Zahlungsziel für Eingangsrechnungen (üblicher als die 14 Tage der
// Forderungsseite). Spiegelt payables.berechneFaelligAm / ZIEL_DEFAULT.
export const EINGANG_ZIEL_DEFAULT = 30;

// Toleranz (Cent) für den Plausibilitäts-Vergleich einer erhaltenen Mahnung. Die
// Verzugszinsen runden taggenau; ein paar Cent Abweichung sind kein „überhöht".
export const PRUEF_TOLERANZ_CENT = 5;

/** Staffel-Schwellen (Tage überfällig) für die Verzugsstufe der EIGENEN Zahlung. */
export const VERZUG_SCHWELLEN = { ueberfaellig: 1, deutlich: 14, stark: 42 };

/**
 * Verzugsstufe einer eigenen (noch offenen) Eingangsrechnung anhand der Tage
 * überfällig — Spiegel zu mahnwesen.mahnstufe, aber aus Schuldnersicht.
 * @param {number} tageUeber Tage über die Fälligkeit hinaus (≥0)
 * @param {{ueberfaellig?:number, deutlich?:number, stark?:number}} [schwellen]
 * @returns {{stufe:0|1|2|3, key:string, label:string, kritisch:boolean}}
 *  0 im Ziel · 1 überfällig · 2 deutlich überfällig · 3 stark überfällig
 */
export function verzugsstufe(tageUeber, schwellen = VERZUG_SCHWELLEN) {
  const s = { ...VERZUG_SCHWELLEN, ...schwellen };
  const t = Math.max(0, Number(tageUeber) || 0);
  if (t >= s.stark) return { stufe: 3, key: 'stark', label: 'stark überfällig', kritisch: true };
  if (t >= s.deutlich) return { stufe: 2, key: 'deutlich', label: 'deutlich überfällig', kritisch: true };
  if (t >= s.ueberfaellig) return { stufe: 1, key: 'ueberfaellig', label: 'überfällig', kritisch: false };
  return { stufe: 0, key: 'im_ziel', label: 'im Ziel', kritisch: false };
}

/** Klartext-Bezeichnung einer Verzugsstufe (0–3). */
export function verzugsstufeLabel(stufe) {
  return ['im Ziel', 'überfällig', 'deutlich überfällig', 'stark überfällig'][Math.max(0, Math.min(3, Number(stufe) || 0))];
}

/**
 * Offener (Brutto-)Betrag eines Postens. Akzeptiert das Posten-Format von
 * payables.offeneVerbindlichkeiten ({offenCent}) ebenso wie ein rohes {betragCent}.
 */
function offenVon(posten = {}) {
  if (posten.offenCent != null) return Math.round(Number(posten.offenCent) || 0);
  if (posten.betragCent != null) return Math.round(Number(posten.betragCent) || 0);
  return 0;
}

/**
 * Fälligkeit + Tage überfällig eines Verbindlichkeits-Postens bestimmen — nutzt bereits
 * angereicherte Felder (faelligAm/tageUeberfaellig), sonst aus Datum/Zahlungsziel.
 * @returns {{faelligAm:string, tage:number, imVerzug:boolean}}
 */
export function verzugsLage(posten = {}, opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const zielTage = opts.zielTage != null ? opts.zielTage : EINGANG_ZIEL_DEFAULT;
  const faelligAm = posten.faelligAm || faelligAmVon(posten, zielTage);
  const tage = posten.tageUeberfaellig != null
    ? Math.max(0, Number(posten.tageUeberfaellig) || 0)
    : tageUeberfaellig(faelligAm, heute);
  return { faelligAm, tage, imVerzug: tage > 0 };
}

/**
 * Verzugszinsen + Pauschale, die ein Lieferant für eine zu spät gezahlte Eingangs-
 * rechnung nach § 288 BGB BERECHTIGT fordern könnte. Wir sind hier der Schuldner; für
 * eine Entgeltforderung gegenüber einem Unternehmer (uns) gelten +9 %-Punkte und die
 * 40-€-Pauschale (`b2b`, Default true — unsere Firma ist kein Verbraucher).
 * @param {object} posten Verbindlichkeits-Posten ({offenCent|betragCent, datum, faelligAm, zahlungszielTage})
 * @param {{heute?:string, zielTage?:number, basiszinsProzent?:number, b2b?:boolean, pauschaleCent?:number}} [opts]
 * @returns {{faelligAm, tageUeberfaellig, imVerzug, offenCent, zinsenCent, pauschaleCent, gesamtCent}}
 */
export function berechtigteVerzugskosten(posten = {}, opts = {}) {
  const { faelligAm, tage, imVerzug } = verzugsLage(posten, opts);
  const offenCent = offenVon(posten);
  const b2b = opts.b2b !== false;
  const zinsenCent = imVerzug
    ? verzugszinsenCent(offenCent, tage, { basiszinsProzent: opts.basiszinsProzent, b2b })
    : 0;
  const pauschaleCent = imVerzug ? mahnpauschaleCent(b2b, opts.pauschaleCent) : 0;
  return { faelligAm, tageUeberfaellig: tage, imVerzug, offenCent, zinsenCent, pauschaleCent, gesamtCent: zinsenCent + pauschaleCent };
}

export const PRUEF_BEWERTUNG = {
  KEIN_VERZUG: 'kein_verzug',   // nicht überfällig → Forderung ohne Grundlage
  OHNE_ANGABE: 'ohne_angabe',   // im Verzug, aber keine geforderten Beträge eingegeben
  PLAUSIBEL: 'plausibel',       // gefordert ≤ berechtigt (+ Toleranz)
  UEBERHOEHT: 'ueberhoeht',     // gefordert > berechtigt
};

/**
 * Prüft eine vom Lieferanten ERHALTENE Mahnung: vergleicht die geforderten
 * Verzugszinsen/Mahngebühren mit dem nach § 288 BGB berechtigten Maximum.
 *
 * @param {object} posten Verbindlichkeits-Posten ({offenCent|betragCent, datum, faelligAm, zahlungszielTage})
 * @param {object} opts
 * @param {number} [opts.geforderteZinsenCent=0]   vom Lieferanten geforderte Verzugszinsen
 * @param {number} [opts.geforderteGebuehrenCent=0] geforderte Mahngebühren/Pauschale
 * @param {number} [opts.heute] ISO-Datum (Default heute)
 * @param {number} [opts.zielTage=30] Default-Zahlungsziel
 * @param {number} [opts.basiszinsProzent] Basiszinssatz § 247 BGB
 * @param {boolean}[opts.b2b=true] Schuldner (wir) ist Unternehmer
 * @param {number} [opts.toleranzCent=5] Rundungs-Toleranz
 * @returns {{faelligAm, tageUeberfaellig, imVerzug, offenCent,
 *   geforderteZinsenCent, geforderteGebuehrenCent, geforderterGesamtCent,
 *   berechtigteZinsenCent, berechtigteGebuehrenCent, berechtigterGesamtCent,
 *   zinsenDiffCent, gebuehrenDiffCent, gesamtDiffCent, bewertung}}
 */
export function pruefeErhalteneMahnung(posten = {}, opts = {}) {
  const berechtigt = berechtigteVerzugskosten(posten, opts);
  const toleranz = opts.toleranzCent != null ? Math.max(0, Number(opts.toleranzCent) || 0) : PRUEF_TOLERANZ_CENT;
  const geforderteZinsenCent = Math.max(0, Math.round(Number(opts.geforderteZinsenCent) || 0));
  const geforderteGebuehrenCent = Math.max(0, Math.round(Number(opts.geforderteGebuehrenCent) || 0));
  const geforderterGesamtCent = geforderteZinsenCent + geforderteGebuehrenCent;
  const berechtigterGesamtCent = berechtigt.zinsenCent + berechtigt.pauschaleCent;
  const gesamtDiffCent = geforderterGesamtCent - berechtigterGesamtCent;

  let bewertung;
  if (!berechtigt.imVerzug) bewertung = PRUEF_BEWERTUNG.KEIN_VERZUG;
  else if (geforderterGesamtCent === 0) bewertung = PRUEF_BEWERTUNG.OHNE_ANGABE;
  else if (gesamtDiffCent <= toleranz) bewertung = PRUEF_BEWERTUNG.PLAUSIBEL;
  else bewertung = PRUEF_BEWERTUNG.UEBERHOEHT;

  return {
    faelligAm: berechtigt.faelligAm,
    tageUeberfaellig: berechtigt.tageUeberfaellig,
    imVerzug: berechtigt.imVerzug,
    offenCent: berechtigt.offenCent,
    geforderteZinsenCent,
    geforderteGebuehrenCent,
    geforderterGesamtCent,
    berechtigteZinsenCent: berechtigt.zinsenCent,
    berechtigteGebuehrenCent: berechtigt.pauschaleCent,
    berechtigterGesamtCent,
    zinsenDiffCent: geforderteZinsenCent - berechtigt.zinsenCent,
    gebuehrenDiffCent: geforderteGebuehrenCent - berechtigt.pauschaleCent,
    gesamtDiffCent,
    bewertung,
  };
}

// ---- Buchung GEZAHLTER Verzugskosten (Zinsaufwand) — Spiegel zu R1 ----------
//
// Wenn wir eine BERECHTIGTE Lieferanten-Mahnung zahlen, ist das Spiegelbild zur
// Forderungsseite (mahnwesen.mahnbuchungEntwurf): dort entstand ein Zins-/Gebühren-
// ERTRAG, hier entsteht uns ein Zins-/Gebühren-AUFWAND.
//
// EHRLICHE USt-EINORDNUNG (identisch zu mahnwesen.js): Verzugszinsen und Mahngebühren
// sind nach h. M. (Abschn. 1.3 UStAE) nicht steuerbarer **echter Schadensersatz** — es
// fehlt der Leistungsaustausch. Daher KEINE Vorsteuer auf der Buchung; der volle Betrag
// ist Aufwand. Im Zweifel (z. B. vertraglich vereinbarte „Bearbeitungsgebühr") Berater.

/** Standard-Kontenzuordnung (SKR03) für die Buchung gezahlter Verzugskosten. */
export const VERZUG_AUFWAND_KONTEN = {
  zinsaufwand: '2100',      // Zinsen und ähnliche Aufwendungen (Soll)
  gebuehraufwand: '4980',   // Sonstige betriebliche Aufwendungen (Soll) — Spiegel zu 2700
  bank: '1200',             // Bank (Haben) — Standard-Gegenkonto bei Zahlung
  verbindlichkeit: '1600',  // Verbindlichkeiten aus L+L (Haben) — alternativ „auf Ziel"
};

/** Gegenkonto-Wahl für die Verzugskosten-Buchung: per Bank zahlen oder als Verbindlichkeit einbuchen. */
export const VERZUG_GEGENKONTO = { BANK: 'bank', VERBINDLICHKEIT: 'verbindlichkeit' };

/**
 * Baut die Buchungszeilen für gezahlte/zu zahlende Verzugszinsen + Mahngebühren
 * (ohne Vorsteuer — nicht steuerbarer Schadensersatz). Spiegel zu mahnbuchungZeilen.
 *
 *   Soll  Zinsen und ähnliche Aufwendungen (2100)    zinsen
 *   Soll  Sonstige betriebliche Aufwendungen (4980)  gebühren
 *   Haben Bank (1200) ODER Verbindlichkeiten (1600)  zinsen + gebühren
 *
 * @param {object} opts
 * @param {number} [opts.zinsenCent=0]    Verzugszinsen (Cent, ≥0)
 * @param {number} [opts.gebuehrenCent=0] Mahngebühren/Pauschale (Cent, ≥0)
 * @param {'bank'|'verbindlichkeit'} [opts.gegenkonto='bank'] Bank zahlen oder als Verbindlichkeit einbuchen
 * @param {object} [opts.konten] optionale Konto-Überschreibung (zinsaufwand/gebuehraufwand/bank/verbindlichkeit)
 * @returns {{zeilen:Array, summeCent:number, zinsenCent:number, gebuehrenCent:number, gegenkonto:string}}
 */
export function verzugAufwandZeilen(opts = {}) {
  const zinsenCent = Math.max(0, Math.round(Number(opts.zinsenCent) || 0));
  const gebuehrenCent = Math.max(0, Math.round(Number(opts.gebuehrenCent) || 0));
  const k = { ...VERZUG_AUFWAND_KONTEN, ...(opts.konten || {}) };
  const gegenkonto = opts.gegenkonto === VERZUG_GEGENKONTO.VERBINDLICHKEIT
    ? VERZUG_GEGENKONTO.VERBINDLICHKEIT : VERZUG_GEGENKONTO.BANK;
  const gegenkontoNr = gegenkonto === VERZUG_GEGENKONTO.VERBINDLICHKEIT ? k.verbindlichkeit : k.bank;
  const summeCent = zinsenCent + gebuehrenCent;
  const zeilen = [];
  if (summeCent > 0) {
    if (zinsenCent > 0) zeilen.push({ konto: k.zinsaufwand, seite: 'S', betrag: zinsenCent });
    if (gebuehrenCent > 0) zeilen.push({ konto: k.gebuehraufwand, seite: 'S', betrag: gebuehrenCent });
    zeilen.push({ konto: gegenkontoNr, seite: 'H', betrag: summeCent });
  }
  return { zeilen, summeCent, zinsenCent, gebuehrenCent, gegenkonto };
}

/**
 * Baut einen vollständigen Buchungs-ENTWURF (manuell, KEIN Auto-Festschreiben —
 * GoBD-Disziplin) für gezahlte Verzugszinsen/Mahngebühren. Spiegel zu
 * mahnwesen.mahnbuchungEntwurf. Gibt null zurück, wenn weder Zinsen noch Gebühren anfallen.
 * @returns {{datum, beschreibung, begruendung, zeilen, summeCent, zinsenCent, gebuehrenCent, gegenkonto}|null}
 */
export function verzugAufwandEntwurf(opts = {}) {
  const res = verzugAufwandZeilen(opts);
  if (!res.zeilen.length) return null;
  const teile = [];
  if (res.zinsenCent > 0) teile.push('Verzugszinsen');
  if (res.gebuehrenCent > 0) teile.push('Mahngebühren');
  const refTeil = opts.referenz ? ` Rechnung ${opts.referenz}` : '';
  const nameTeil = opts.name ? ` (${opts.name})` : '';
  return {
    datum: opts.datum || new Date().toISOString().slice(0, 10),
    beschreibung: `Gezahlte ${teile.join(' + ')}${refTeil}${nameTeil}`.trim(),
    begruendung: 'Gezahlte Verzugszinsen/Mahngebühren als nicht steuerbarer Schadensersatz (§ 288 BGB) — ohne Vorsteuer. Im Zweifel Steuerberater.',
    zeilen: res.zeilen,
    summeCent: res.summeCent,
    zinsenCent: res.zinsenCent,
    gebuehrenCent: res.gebuehrenCent,
    gegenkonto: res.gegenkonto,
  };
}

/**
 * Kennzahlen über die eigene Zahlungsdisziplin (für Dashboard/Auswertung): wie viele
 * offene Verbindlichkeiten sind überfällig, mit welcher Summe, und welches Verzugszins-
 * Risiko (berechtigte § 288-Zinsen) hängt daran. Erwartet bereits angereicherte Posten
 * (payables.anreichereVerbindlichkeiten → {offenCent, faelligAm, tageUeberfaellig}).
 * @returns {{anzahl, ueberfaelligAnzahl, ueberfaelligCent, zinsRisikoCent, kritischAnzahl}}
 */
export function verzugUebersicht(angereichertePosten = [], opts = {}) {
  let ueberfaelligAnzahl = 0, ueberfaelligCent = 0, zinsRisikoCent = 0, kritischAnzahl = 0;
  for (const p of angereichertePosten) {
    const { tage, imVerzug } = verzugsLage(p, opts);
    if (!imVerzug) continue;
    ueberfaelligAnzahl++;
    ueberfaelligCent += offenVon(p);
    zinsRisikoCent += berechtigteVerzugskosten(p, opts).zinsenCent;
    if (verzugsstufe(tage).kritisch) kritischAnzahl++;
  }
  return {
    anzahl: angereichertePosten.length,
    ueberfaelligAnzahl,
    ueberfaelligCent,
    zinsRisikoCent,
    kritischAnzahl,
  };
}
