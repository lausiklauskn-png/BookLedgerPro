// src/domain/geschaeftsjahr.js
// Wirtschaftsjahr (Geschäftsjahr) — auch abweichend vom Kalenderjahr. Reine, testbare Funktionen.
//
// WICHTIG: Die USt-Voranmeldung bleibt gesetzlich KALENDARISCH (Monat/Quartal/Kalenderjahr) —
// das abweichende Wirtschaftsjahr betrifft die Gewinnermittlung (EÜR), das Dashboard-„Geschäftsjahr"
// und den DATEV-EXTF-WJ-Beginn, NICHT die USt-VA-Perioden.

export const WJ_DEFAULT = '01-01'; // MM-TT; 01-01 = Kalenderjahr

function pad(n) { return String(n).padStart(2, '0'); }

function mmdd(wjBeginn) {
  const m = /^(\d{2})-(\d{2})$/.exec(wjBeginn || WJ_DEFAULT);
  return { mm: m ? Number(m[1]) : 1, dd: m ? Number(m[2]) : 1 };
}

/** Gültige MM-TT-Eingabe für den Wirtschaftsjahr-Beginn? */
export function validateWjBeginn(wjBeginn) {
  const m = /^(\d{2})-(\d{2})$/.exec(wjBeginn || '');
  if (!m) return false;
  const mo = Number(m[1]), d = Number(m[2]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 28; // ≤28: WJ-Beginn am Monatsende vermeiden
}

/**
 * Periode eines Wirtschaftsjahres (das im angegebenen Jahr beginnt): {von, bis}.
 * Bei 01-01 identisch zum Kalenderjahr. `bis` = Beginn +1 Jahr −1 Tag.
 */
export function wjPeriode(jahr, wjBeginn = WJ_DEFAULT) {
  const { mm, dd } = mmdd(wjBeginn);
  const von = `${jahr}-${pad(mm)}-${pad(dd)}`;
  const end = new Date(Date.UTC(Number(jahr) + 1, mm - 1, dd));
  end.setUTCDate(end.getUTCDate() - 1);
  const bis = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;
  return { von, bis };
}

/** Start-Jahr des Wirtschaftsjahres, in das ein Datum (YYYY-MM-DD) fällt. */
export function wirtschaftsjahrVon(datum, wjBeginn = WJ_DEFAULT) {
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(datum || '');
  if (!m) return null;
  const jahr = Number(m[1]);
  const p = wjPeriode(jahr, wjBeginn);
  return datum < p.von ? jahr - 1 : jahr; // vor dem WJ-Beginn → WJ begann im Vorjahr
}

/** WJ-Beginn als YYYYMMDD (für den DATEV-EXTF-Header). */
export function wjBeginnYYYYMMDD(jahr, wjBeginn = WJ_DEFAULT) {
  const { mm, dd } = mmdd(wjBeginn);
  return `${jahr}${pad(mm)}${pad(dd)}`;
}
