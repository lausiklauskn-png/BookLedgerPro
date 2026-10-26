// src/domain/anlagen.js
// Anlagevermögen + AfA (Absetzung für Abnutzung) — reine, testbare Funktionen.
//
// Drei Behandlungen für angeschaffte Wirtschaftsgüter (EÜR):
//  - GWG (§6 Abs.2 EStG): netto ≤ 800 € → Sofortabschreibung im Anschaffungsjahr.
//  - Sammelposten (§6 Abs.2a EStG): 250,01–1.000 € → Pool, gleichmäßig über 5 Jahre
//    (20 %/Jahr), KEINE zeitanteilige Kürzung, unabhängig vom Anschaffungsmonat.
//  - Lineare AfA (§7 Abs.1 EStG): > 800 € → linear über die betriebsgewöhnliche
//    Nutzungsdauer, im Anschaffungsjahr PRO RATA TEMPORIS (jeder angefangene Monat zählt).
//
// EHRLICHER HINWEIS: Sammelposten ist ein Jahres-Wahlrecht (dann müssen ALLE Güter von
// 250–1.000 € dieses Jahres in den Pool). GWG-Untergrenzen/Aufzeichnungspflicht (250 €),
// degressive AfA und Sonderabschreibungen sind nicht modelliert — im Zweifel Berater.

import { parseEuroToCents } from './money.js';

export const AFA_METHODE = { GWG: 'gwg', SAMMELPOSTEN: 'sammelposten', LINEAR: 'linear' };
export const AFA_METHODE_LISTE = [AFA_METHODE.GWG, AFA_METHODE.SAMMELPOSTEN, AFA_METHODE.LINEAR];

export const GWG_GRENZE_CENT = 80000;          // 800 € netto (GWG-Sofortabschreibung)
export const SAMMELPOSTEN_UNTER_CENT = 25000;  // > 250 € netto
export const SAMMELPOSTEN_OBER_CENT = 100000;  // ≤ 1.000 € netto
export const SAMMELPOSTEN_JAHRE = 5;

/** Vorschlag der AfA-Methode anhand der Netto-Anschaffungskosten (GWG vs. linear). */
export function klassifiziere(akNettoCents) {
  if (!Number.isInteger(akNettoCents) || akNettoCents <= 0) return AFA_METHODE.LINEAR;
  if (akNettoCents <= GWG_GRENZE_CENT) return AFA_METHODE.GWG;
  return AFA_METHODE.LINEAR;
}

/** Ist ein Sammelposten zulässig (250,01–1.000 € netto)? Wahlrecht, daher separat. */
export function sammelpostenZulaessig(akNettoCents) {
  return akNettoCents > SAMMELPOSTEN_UNTER_CENT && akNettoCents <= SAMMELPOSTEN_OBER_CENT;
}

function jahrUndMonat(datum) {
  const m = /^(\d{4})-(\d{2})/.exec(datum || '');
  return { jahr: m ? Number(m[1]) : new Date().getFullYear(), monat: m ? Number(m[2]) : 1 };
}

/** GWG: voller Aufwand im Anschaffungsjahr. */
export function afaPlanGwg(akNettoCents, anschaffungsdatum) {
  const { jahr } = jahrUndMonat(anschaffungsdatum);
  return [{ jahr, afa: akNettoCents, restbuchwert: 0 }];
}

/** Sammelposten: 20 % p.a. über 5 Jahre, ohne zeitanteilige Kürzung. */
export function afaPlanSammelposten(akNettoCents, anschaffungsdatum) {
  const { jahr } = jahrUndMonat(anschaffungsdatum);
  const jahresAfa = Math.round(akNettoCents / SAMMELPOSTEN_JAHRE);
  const plan = [];
  let rest = akNettoCents;
  for (let i = 0; i < SAMMELPOSTEN_JAHRE; i++) {
    const afa = i === SAMMELPOSTEN_JAHRE - 1 ? rest : jahresAfa; // letztes Jahr: Rundungsrest
    rest -= afa;
    plan.push({ jahr: jahr + i, afa, restbuchwert: rest });
  }
  return plan;
}

/** Lineare AfA pro rata temporis (monatsgenau im Anschaffungs-/Schlussjahr). */
export function afaPlanLinear(akNettoCents, nutzungsdauerJahre, anschaffungsdatum) {
  const ak = akNettoCents;
  const nd = Math.max(1, Math.round(Number(nutzungsdauerJahre) || 1));
  const { jahr: startJahr, monat: startMonat } = jahrUndMonat(anschaffungsdatum);
  const jahresAfa = Math.round(ak / nd);
  const monateErstesJahr = 12 - startMonat + 1; // angefangener Monat zählt voll
  const plan = [];
  let rest = ak;
  for (let i = 0; rest > 0 && i <= nd + 1; i++) {
    let afa = i === 0 ? Math.round((jahresAfa * monateErstesJahr) / 12) : jahresAfa;
    if (afa > rest || i === nd + 1) afa = rest; // Schlussjahr trägt den Restbuchwert
    rest -= afa;
    plan.push({ jahr: startJahr + i, afa, restbuchwert: rest });
  }
  return plan;
}

/** AfA-Plan (je Jahr {jahr, afa, restbuchwert}) für eine Anlage je nach Methode. */
export function afaPlan(anlage) {
  if (!anlage) return [];
  if (anlage.methode === AFA_METHODE.GWG) return afaPlanGwg(anlage.akNettoCents, anlage.anschaffungsdatum);
  if (anlage.methode === AFA_METHODE.SAMMELPOSTEN) return afaPlanSammelposten(anlage.akNettoCents, anlage.anschaffungsdatum);
  return afaPlanLinear(anlage.akNettoCents, anlage.nutzungsdauerJahre, anlage.anschaffungsdatum);
}

/** Status einer Anlage zu einem Wirtschaftsjahr: AfA des Jahres, kumuliert, Restbuchwert. */
export function anlageStatus(anlage, jahr) {
  const plan = afaPlan(anlage);
  let kumuliert = 0, afaJahr = 0;
  for (const p of plan) {
    if (p.jahr <= jahr) kumuliert += p.afa;
    if (p.jahr === jahr) afaJahr = p.afa;
  }
  return { afaJahr, kumuliert, restbuchwert: Math.max(0, anlage.akNettoCents - kumuliert) };
}

/** Anlagenverzeichnis zum Stichtag-Jahr: je Anlage angereichert + Summen. */
export function anlagenverzeichnis(anlagen, jahr) {
  const zeilen = (anlagen || []).map((a) => ({ ...a, ...anlageStatus(a, jahr) }));
  const summen = zeilen.reduce((s, z) => ({
    ak: s.ak + (z.akNettoCents || 0),
    afaJahr: s.afaJahr + z.afaJahr,
    kumuliert: s.kumuliert + z.kumuliert,
    restbuchwert: s.restbuchwert + z.restbuchwert,
  }), { ak: 0, afaJahr: 0, kumuliert: 0, restbuchwert: 0 });
  return { jahr, zeilen, summen };
}

// AfA-Aufwandskonto je Methode: GWG → Sofortabschreibung GWG (4855), sonst Abschreibungen (4830).
export const AFA_AUFWAND_KONTO = {
  [AFA_METHODE.GWG]: '4855', [AFA_METHODE.SAMMELPOSTEN]: '4830', [AFA_METHODE.LINEAR]: '4830',
};

/**
 * Buchungszeilen der AfA eines Jahres: Soll Abschreibungs-Aufwand an Haben Anlagekonto.
 * @returns {{betrag:number, zeilen:Array}|null} null, wenn in dem Jahr keine AfA anfällt
 */
export function afaBuchungZeilen(anlage, jahr) {
  const { afaJahr } = anlageStatus(anlage, jahr);
  if (afaJahr <= 0) return null;
  const aufwand = AFA_AUFWAND_KONTO[anlage.methode] || '4830';
  return {
    betrag: afaJahr,
    zeilen: [
      { konto: aufwand, seite: 'S', betrag: afaJahr },
      { konto: anlage.anlageKonto, seite: 'H', betrag: afaJahr },
    ],
  };
}

/** Normalisiert eine Anlage-Eingabe (Euro→Cent, Zahlen) auf das gespeicherte Format. */
export function normalizeAnlage(input) {
  const a = {
    bezeichnung: String(input.bezeichnung || '').trim(),
    anschaffungsdatum: String(input.anschaffungsdatum || '').trim(),
    methode: input.methode,
    anlageKonto: String(input.anlageKonto || '').trim(),
  };
  a.akNettoCents = Number.isInteger(input.akNettoCents) ? input.akNettoCents : parseEuroToCents(input.akNetto);
  if (a.methode === AFA_METHODE.LINEAR) a.nutzungsdauerJahre = Number(input.nutzungsdauerJahre) || 0;
  return a;
}

/** Validiert eine (normalisierte) Anlage. @returns {string[]} Fehlerliste (leer = ok). */
export function validateAnlage(a) {
  const errors = [];
  if (!a || !String(a.bezeichnung || '').trim()) errors.push('Bezeichnung fehlt.');
  if (!a || !Number.isInteger(a.akNettoCents) || a.akNettoCents <= 0) errors.push('Anschaffungskosten (netto) fehlen oder ungültig.');
  if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(a.anschaffungsdatum || '')) errors.push('Anschaffungsdatum ungültig (YYYY-MM-DD).');
  if (!a || !AFA_METHODE_LISTE.includes(a.methode)) errors.push('AfA-Methode ungültig.');
  if (a && a.methode === AFA_METHODE.LINEAR && (!Number.isInteger(a.nutzungsdauerJahre) || a.nutzungsdauerJahre < 1)) {
    errors.push('Nutzungsdauer (Jahre) fehlt.');
  }
  if (a && a.methode === AFA_METHODE.SAMMELPOSTEN && !sammelpostenZulaessig(a.akNettoCents)) {
    errors.push('Sammelposten nur für Netto 250,01–1.000 € zulässig.');
  }
  if (!a || !String(a.anlageKonto || '').trim()) errors.push('Anlagekonto fehlt.');
  return errors;
}
