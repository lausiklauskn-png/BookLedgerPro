// src/domain/kalkulation.js
// BAUPLAN Block 2 / Schritt 5 — Kalkulations-Kern (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §2 (Rechenformel) + §9 (Bau-Reihenfolge).
//
// PRIME DIRECTIVE (Katalog §0/§8): Kalkulation ist REIN INTERN. Diese Schicht rechnet
// nur mit den eigenen Sätzen (Maschinensatz, interner Stundenkostensatz, Marge,
// Gemeinkosten, Verschnitt …) — sie erzeugt KEIN Außendokument. Das neutrale
// Angebot/die Rechnung kommt erst in den Schritten 7/8 und zeigt nie die Systematik.
//
// CENT-GENAU: Geld läuft als ganzzahlige Cent (wie domain/money.js). Es wird an jeder
// definierten Stufe auf ganze Cent gerundet (kaufmännisch, Math.round) — keine
// Float-Schleppfehler. Zeiten laufen als Dezimal-Stunden, Flächen als Dezimal-m².
//
// RECHENFORMEL (Katalog §2):
//   Selbstkosten = Material(+Verschnitt%) + Maschinenzeit×Maschinensatz
//                + Arbeitszeit×interner-Std-Kostensatz
//                + Zukauf×(1+Handelsaufschlag%) + Montage/Anfahrt
//   Netto (Angebotspreis) = Selbstkosten × (1+Gemeinkosten%) × (1+Gewinn%)
//   Brutto                = Netto × (1+USt%)
// Rückwärts: bei gegebenem Zielpreis/Marge → wie viel Selbstkosten/Zeit darf rein.
//
// EHRLICHE GRENZE: Der Kern rechnet nur mit den eingegebenen Sätzen — er erfindet nichts.
// Kalibrierung/Nachkalkulation (Korrekturfaktoren aus der Historie) ist Schritt 9/10.

/** Endliche Zahl oder 0 (schützt vor NaN/undefined/null in der Eingabe). */
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Auf ganze Cent runden (kaufmännisch). Zentrale Rundungsstelle des Kerns. */
export function rundeCent(x) {
  return Math.round(num(x));
}

/** Prozent-Faktor: 12 → 1.12, 0/fehlend → 1.0. */
export function prozentFaktor(prozent) {
  return 1 + num(prozent) / 100;
}

// ── Kostenarten (Kostentreiber, Katalog §1) ─────────────────────────────────
export const KOSTENART = Object.freeze({
  MATERIAL: 'material',   // Werkstoff (+ Verschnitt%), pauschal ODER über m²
  MASCHINE: 'maschine',   // Maschinenzeit × Maschinenstundensatz
  ARBEIT: 'arbeit',       // Arbeitszeit × interner Stundenkostensatz
  ZUKAUF: 'zukauf',       // eingekauft & weiterverkauft (EK × (1+Handelsaufschlag%))
  MONTAGE: 'montage',     // Montage/Anfahrt (pauschal in Cent; Schema-Schicht füllt)
});

export const KOSTENART_LISTE = [
  KOSTENART.MATERIAL, KOSTENART.MASCHINE, KOSTENART.ARBEIT, KOSTENART.ZUKAUF, KOSTENART.MONTAGE,
];

// ── Einzelne Kostenarten (rein, je für sich von der Schema-Schicht nutzbar) ──

/**
 * Material-Basis in Cent: entweder über die Fläche (m²-Formel) ODER pauschal.
 * Ist `flaecheM2`/`preisProM2Cent` gesetzt → Fläche × Preis/m²; sonst `betragCent`.
 */
function materialBasisCent(m = {}) {
  if (m.flaecheM2 != null || m.preisProM2Cent != null) {
    return num(m.flaecheM2) * num(m.preisProM2Cent);
  }
  return num(m.betragCent);
}

/**
 * Materialkosten inkl. Verschnitt. `{ betragCent, verschnittProzent }` ODER
 * `{ flaecheM2, preisProM2Cent, verschnittProzent }` (m²-Formel). → ganze Cent.
 */
export function materialkosten(m = {}) {
  return rundeCent(materialBasisCent(m) * prozentFaktor(m.verschnittProzent));
}

/**
 * Reine m²-Materialkosten (explizit für die Schema-Schicht, Schritt 6):
 * Fläche × Preis/m² × (1+Verschnitt%). → ganze Cent.
 */
export function m2Materialkosten({ flaecheM2 = 0, preisProM2Cent = 0, verschnittProzent = 0 } = {}) {
  return materialkosten({ flaecheM2, preisProM2Cent, verschnittProzent });
}

/** Zeitkosten: Stunden × Satz (Cent/Std). Basis für Maschine UND Arbeit. → ganze Cent. */
export function zeitkosten({ stunden = 0, satzCentProStd = 0 } = {}) {
  return rundeCent(num(stunden) * num(satzCentProStd));
}

/** Maschinenkosten = Maschinenzeit × Maschinenstundensatz. → ganze Cent. */
export function maschinenkosten(opts = {}) {
  return zeitkosten(opts);
}

/** Arbeitskosten = Arbeitszeit × interner Stundenkostensatz. → ganze Cent. */
export function arbeitskosten(opts = {}) {
  return zeitkosten(opts);
}

/** Zukauf/Handel: EK × (1+Handelsaufschlag%). → ganze Cent. */
export function zukaufkosten({ ekCent = 0, handelsaufschlagProzent = 0 } = {}) {
  return rundeCent(num(ekCent) * prozentFaktor(handelsaufschlagProzent));
}

/** Montage/Anfahrt: pauschaler Cent-Betrag (Schema-Schicht rechnet ihn ggf. aus). */
export function montagekosten(m = {}) {
  return rundeCent(num(m.betragCent));
}

// ── Vorwärts: Kosten → Preis (Katalog §2) ───────────────────────────────────

/**
 * Vorwärtskalkulation: Kostenarten → Selbstkosten → Netto → Brutto, cent-genau.
 *
 * @param {{
 *   material?: object, maschine?: object, arbeit?: object, zukauf?: object, montage?: object,
 *   gemeinkostenProzent?: number, gewinnProzent?: number, ustProzent?: number,
 * }} input
 * @returns {{
 *   material:number, maschine:number, arbeit:number, zukauf:number, montage:number,
 *   selbstkosten:number, gemeinkostenBetrag:number, gewinnBetrag:number,
 *   netto:number, ustBetrag:number, brutto:number, deckungsbeitrag:number,
 * }} alle Beträge in ganzen Cent.
 */
export function kalkuliereVorwaerts(input = {}) {
  const material = materialkosten(input.material || {});
  const maschine = maschinenkosten(input.maschine || {});
  const arbeit = arbeitskosten(input.arbeit || {});
  const zukauf = zukaufkosten(input.zukauf || {});
  const montage = montagekosten(input.montage || {});

  const selbstkosten = material + maschine + arbeit + zukauf + montage;

  // Zuschlagskalkulation: Gemeinkosten- dann Gewinnzuschlag, je auf ganze Cent gerundet.
  const nachGemeinkosten = rundeCent(selbstkosten * prozentFaktor(input.gemeinkostenProzent));
  const netto = rundeCent(nachGemeinkosten * prozentFaktor(input.gewinnProzent));
  const ustBetrag = rundeCent(netto * num(input.ustProzent) / 100);
  const brutto = netto + ustBetrag;

  return {
    material, maschine, arbeit, zukauf, montage,
    selbstkosten,
    gemeinkostenBetrag: nachGemeinkosten - selbstkosten,
    gewinnBetrag: netto - nachGemeinkosten,
    netto,
    ustBetrag,
    brutto,
    deckungsbeitrag: netto - selbstkosten,
  };
}

// ── USt-Umrechnung (cent-genau) ─────────────────────────────────────────────

/** Brutto aus Netto: { ustBetragCent, bruttoCent }. */
export function bruttoVonNetto(nettoCent, ustProzent = 0) {
  const ustBetragCent = rundeCent(num(nettoCent) * num(ustProzent) / 100);
  return { ustBetragCent, bruttoCent: num(nettoCent) + ustBetragCent };
}

/** Netto aus Brutto (gerundet): brutto / (1+USt%). → ganze Cent. */
export function nettoVonBrutto(bruttoCent, ustProzent = 0) {
  return rundeCent(num(bruttoCent) / prozentFaktor(ustProzent));
}

// ── Rückwärts: Zielpreis/Marge → erlaubte Kosten/Zeit (Katalog §2/§5.2) ──────

/**
 * Maximal zulässige Selbstkosten bei gegebenem Ziel-Nettopreis und Marge.
 * = Zielpreis / ((1+Gemeinkosten%) × (1+Gewinn%)). KONSERVATIV abgerundet
 * (Math.floor), damit der gerechnete Preis das Ziel nie überschreitet.
 */
export function maxSelbstkosten(zielNettoCent, { gemeinkostenProzent = 0, gewinnProzent = 0 } = {}) {
  const faktor = prozentFaktor(gemeinkostenProzent) * prozentFaktor(gewinnProzent);
  if (faktor <= 0) return 0;
  return Math.floor(num(zielNettoCent) / faktor);
}

/**
 * Rückwärtskalkulation: „Wie viel darf rein?" bei gegebenem Zielpreis.
 * Liefert max. Selbstkosten, das Restbudget nach bereits fixen Kosten und die
 * daraus erlaubten Arbeitsstunden (bei gegebenem Stundensatz). Alles konservativ
 * abgerundet (man unterschreitet das Ziel eher, als es zu reißen).
 *
 * @param {{
 *   zielNettoCent?: number, zielBruttoCent?: number, ustProzent?: number,
 *   gemeinkostenProzent?: number, gewinnProzent?: number,
 *   fixeKostenCent?: number, stundensatzCentProStd?: number,
 * }} input — entweder `zielNettoCent` ODER `zielBruttoCent` (+ `ustProzent`).
 * @returns {{ zielNettoCent:number, maxSelbstkostenCent:number, budgetCent:number,
 *   maxStunden:number, reichtAus:boolean }}
 */
export function kalkuliereRueckwaerts(input = {}) {
  const zielNettoCent = input.zielNettoCent != null
    ? num(input.zielNettoCent)
    : nettoVonBrutto(input.zielBruttoCent, input.ustProzent);

  const maxSelbstkostenCent = maxSelbstkosten(zielNettoCent, input);
  const fixeKostenCent = num(input.fixeKostenCent);
  const budgetCent = maxSelbstkostenCent - fixeKostenCent;

  const satz = num(input.stundensatzCentProStd);
  // Auf 2 Nachkomma-Stunden ABGERUNDET (konservativ) — nie mehr Zeit ausweisen, als ins Budget passt.
  const maxStunden = budgetCent > 0 && satz > 0
    ? Math.floor((budgetCent / satz) * 100) / 100
    : 0;

  return {
    zielNettoCent,
    maxSelbstkostenCent,
    budgetCent,
    maxStunden,
    reichtAus: budgetCent >= 0,
  };
}
