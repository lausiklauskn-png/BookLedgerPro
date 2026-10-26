// src/domain/besteller.js
// „Handelnde Person" als Besteller eines Auftrags/einer Rechnung (P10).
// Additives Modell: die konkrete Person, die IM NAMEN des Kunden bestellt hat
// (Ansprechpartner) — sauber getrennt vom Kunden selbst (= Rechnungsempfänger).
// Auf dem AUSGEHENDEN Dokument erscheint sie nur als knappe „z. Hd."-Zeile
// (Name + Funktion = kundeneigene Daten); E-Mail/Telefon bleiben dem Dokument
// fern und dienen nur der internen Kontaktaufnahme. Reine, testbare Funktionen.
// Prime Directive/GoBD: nichts Internes nach außen — hier wird nichts gebucht.

const clean = (v) => String(v == null ? '' : v).trim();

/**
 * Normalisiert die handelnde Person (Besteller). Akzeptiert einen String (= Name)
 * oder ein Objekt {name, funktion, email, telefon}. Liefert ein additives Objekt
 * mit getrimmten Feldern — oder `null`, wenn kein Name vorliegt (ohne Name keine
 * handelnde Person; abwärtskompatibel zu Aufträgen ganz ohne Besteller).
 * @returns {?{name:string, funktion:string, email:string, telefon:string}}
 */
export function normalizeBesteller(value) {
  if (value == null) return null;
  const obj = typeof value === 'object' ? value : { name: value };
  const name = clean(obj.name);
  if (!name) return null; // ohne Name keine handelnde Person
  return {
    name,
    funktion: clean(obj.funktion),
    email: clean(obj.email),
    telefon: clean(obj.telefon),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Prüft die optionalen Angaben der handelnden Person. Leer/null ist gültig (das
 * Feld ist optional). Ein Objekt mit Funktion/E-Mail/Telefon, aber ohne Name, ist
 * unvollständig (Name nachfordern). Bei vorhandenem Namen wird die Länge begrenzt
 * und die E-Mail (falls angegeben) formal geprüft.
 * @returns {string[]} fehlende/ungültige Angaben
 */
export function validateBesteller(value) {
  const errors = [];
  if (value == null || value === '') return errors; // optional
  const b = normalizeBesteller(value);
  if (!b) {
    const hatRest = typeof value === 'object'
      && (clean(value.funktion) || clean(value.email) || clean(value.telefon));
    if (hatRest) errors.push('Name der handelnden Person (Besteller) fehlt.');
    return errors;
  }
  if (b.name.length > 120) errors.push('Name der handelnden Person ist zu lang.');
  if (b.email && !EMAIL_RE.test(b.email)) errors.push('E-Mail der handelnden Person ist ungültig.');
  return errors;
}

/**
 * Kompakte Anzeige für die handelnde Person, z. B. „Max Müller (Einkauf)".
 * Leer, wenn keine Person hinterlegt ist.
 */
export function bestellerLabel(value) {
  const b = normalizeBesteller(value);
  if (!b) return '';
  return b.funktion ? `${b.name} (${b.funktion})` : b.name;
}

/**
 * „z. Hd."-Kontaktzeile für das ausgehende Rechnungs-/Auftragsdokument
 * (Ansprechpartner beim Empfänger). Bewusst nur Name + Funktion — knappe, übliche
 * Form; die kundeneigenen Kontaktdaten (E-Mail/Telefon) bleiben dem Dokument fern.
 * Leer, wenn keine Person hinterlegt ist.
 */
export function bestellerKontaktzeile(value) {
  const b = normalizeBesteller(value);
  if (!b) return '';
  return b.funktion ? `z. Hd. ${b.name} (${b.funktion})` : `z. Hd. ${b.name}`;
}
