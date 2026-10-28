// src/domain/tresorordner.js
// Gemeinsamer Tresorordner der Pro-Apps (Schritt C/C2, Klaus 2026-10-27) — REINE LOGIK ohne DOM/IndexedDB/Brücke.
// Die Ordnerschicht selbst ist nativ (de.familyprojekt.tresor, Quelle Workflow PDF Pro); hier steht nur, was die
// Web-App darüber wissen muss: Fächer, Format der automatischen Sicherung, wann sie fällig ist, Suche über die
// Inhaltsverzeichnisse (Wortsuche wie bei den Belegen).

import { normalisieren, suchwoerter, wortTreffer, ausschnitt } from './belegsuche.js';

/** Fächer in der Reihenfolge der Anzeige; `eigen` = BookLedgerPro schreibt, `eingang` = Übergabefach an BookLedgerPro. */
export const FAECHER = Object.freeze([
  { fach: 'bookledgerpro', ordner: 'BookLedgerPro', eigen: true },
  { fach: 'eingang-bookledgerpro', ordner: 'Eingang-BookLedgerPro', eingang: true },
  { fach: 'private-brain', ordner: 'Private Brain' },
  { fach: 'workflow-pdf-pro', ordner: 'Workflow PDF Pro' },
  { fach: 'eingang-workflowpdf', ordner: 'Eingang-WorkflowPDF' },
]);

export const SICHERUNG_MAGIC = 'BLPR-TRESORORDNER-SICHERUNG';
export const SICHERUNG_ORDNER = 'Sicherung';
export const BELEG_ORDNER = 'Belege';
/** Automatische Sicherung höchstens alle 10 Minuten, und nur wenn sich etwas geändert hat. */
export const SICHERUNG_ABSTAND_MS = 10 * 60 * 1000;

/**
 * Inhalt der automatischen Sicherung: der Rohbestand der App (`dumpAll()`), wie er in der IndexedDB liegt.
 * Die Buchungen darin sind schon mit dem Tresor-Schlüssel der App verschlüsselt; das Fach verschlüsselt die Datei
 * ein zweites Mal (PBV1). Zum Wiederherstellen braucht es also das Ordner-Passwort UND das App-Passwort (oder Shamir).
 */
export function sicherungInhalt(dump, { erstellt = new Date(), app = 'BookLedgerPro' } = {}) {
  if (!dump || typeof dump !== 'object') throw new Error('Sicherung: kein Bestand');
  return JSON.stringify({ magic: SICHERUNG_MAGIC, format: 1, erstellt: erstellt.toISOString(), app, data: {
    kv: dump.kv || {}, records: dump.records || [], files: dump.files || [],
  } });
}

/** Liest eine Sicherung aus dem Fach; wirft bei fremdem oder beschädigtem Inhalt. Ergebnis passt zu importSnapshot. */
export function sicherungLesen(text) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error('Sicherung beschädigt'); }
  if (!o || o.magic !== SICHERUNG_MAGIC || o.format !== 1 || !o.data || typeof o.data !== 'object') throw new Error('Keine BookLedgerPro-Sicherung aus dem Tresorordner');
  const { kv, records, files } = o.data;
  if (typeof kv !== 'object' || !Array.isArray(records) || !Array.isArray(files)) throw new Error('Sicherung beschädigt');
  return o;
}

/** Sortierbarer Name mit Zeitstempel. */
export function sicherungName(date = new Date()) {
  return `bookledgerpro-tresorordner-${date.toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
}

/** Kurzer, unverfänglicher Auszug fürs Inhaltsverzeichnis (keine Buchungsinhalte). */
export function sicherungAuszug(dump) {
  const r = (dump && dump.records || []).length, f = (dump && dump.files || []).length;
  return `Datensicherung BookLedgerPro · ${r} Datensätze · ${f} Belege`;
}

/** Schlüssel, die sich durch die Sicherung selbst ändern — sie dürfen den Fingerabdruck nicht bewegen. */
export const FLUECHTIG = Object.freeze(['lastBackupAt']);

/** Text, aus dem der Fingerabdruck des Bestands gerechnet wird (ohne flüchtige Merker). */
export function fingerabdruckText(dump) {
  const kv = {};
  for (const [k, v] of Object.entries((dump && dump.kv) || {})) if (!FLUECHTIG.includes(k)) kv[k] = v;
  return JSON.stringify({ kv, records: (dump && dump.records) || [], files: (dump && dump.files) || [] });
}

/** Fällig, wenn sich der Bestand geändert hat und die letzte Sicherung lange genug her ist (oder es keine gab). */
export function sicherungFaellig({ jetzt, letzteZeit = 0, letzterFingerabdruck = '', fingerabdruck, abstand = SICHERUNG_ABSTAND_MS, sofort = false } = {}) {
  if (!fingerabdruck) return false;
  if (fingerabdruck === letzterFingerabdruck) return false;
  if (sofort || !letzteZeit) return true;
  return jetzt - letzteZeit >= abstand;
}

export function istSicherung(e) { return !!(e && e.verschluesselung === 'fpt1' && String(e.verweis || '').startsWith(SICHERUNG_ORDNER + '/')); }

/** Kann BookLedgerPro die Datei öffnen? Nur im gemeinsamen Format; App-eigene Dateien (z. B. Private Brain) nicht. */
export function oeffenbar(e) { return !!(e && e.verschluesselung === 'fpt1'); }

/** Text, über den gesucht wird. */
export function eintragSuchtext(e) {
  return [e && e.name, e && e.auszug, e && e.art].filter(Boolean).join(' · ');
}

/**
 * Wortsuche über die Einträge aller Fächer (UND über alle Wörter, Umlaute/Daten normalisiert wie bei den Belegen).
 * @param {{fach:string, eintraege:object[]}[]} faecher
 * @returns {{fach:string, eintrag:object, ausschnitt:string}[]} neueste zuerst
 */
export function eintraegeSuchen(faecher, frage) {
  const woerter = suchwoerter(frage);
  const aus = [];
  for (const f of faecher || []) for (const e of f.eintraege || []) {
    const text = eintragSuchtext(e);
    if (!woerter.length || wortTreffer(text, woerter)) aus.push({ fach: f.fach, eintrag: e, ausschnitt: woerter.length ? ausschnitt(text, woerter) : (e.auszug || '') });
  }
  return aus.sort((a, b) => (b.eintrag.datum || 0) - (a.eintrag.datum || 0));
}

/** Für die Bedeutungssuche: ein Text je Eintrag (Name + Auszug), normalisiert gekürzt. */
export function bedeutungsText(e) { return normalisieren(eintragSuchtext(e)).slice(0, 600); }

/** Klartext für Fehlercodes der Brücke. */
export function fehlerText(code) {
  const c = String(code && code.message || code || '');
  const k = Object.keys(FEHLER).find((x) => c.includes(x));
  return k ? FEHLER[k] : 'Das ging nicht (' + (c || 'unbekannt') + ').';
}
const FEHLER = {
  TRESOR_PASSWORT_FALSCH: 'Das Passwort stimmt nicht. Es wurde nichts verändert.',
  TRESOR_PASSWORT_KURZ: 'Das Passwort braucht mindestens 10 Zeichen.',
  TRESOR_PASSWORT_UNGLEICH: 'Die beiden Passwörter sind nicht gleich.',
  TRESOR_DA: 'In diesem Ordner liegt schon ein Tresorordner. Bitte entsperren statt neu anlegen.',
  TRESOR_ORDNER_IST_FACH: 'Das ist der Ordner einer App (z. B. „Private Brain“). Bitte den Ordner darüber wählen.',
  TRESOR_KEIN_ORDNER: 'Noch kein Ordner gewählt.',
  TRESOR_GESPERRT: 'Der Tresorordner ist gesperrt.',
  TRESOR_ORDNER_NICHT_ERREICHBAR: 'Der Ordner ist gerade nicht erreichbar (SD-Karte, Freigabe?).',
  TRESOR_BESCHAEDIGT: 'Eine Datei im Tresorordner ist beschädigt oder wurde verändert. Nichts wurde überschrieben.',
  TRESOR_ERSATZ_INCOMPLETE: 'Es braucht mindestens drei Teile des Ersatzschlüssels.',
  TRESOR_ERSATZ_TYPO: 'Ein Teil des Ersatzschlüssels hat einen Tippfehler.',
  TRESOR_ERSATZ_UNBEKANNT: 'Diese Teile gehören nicht zu diesem Tresorordner (oder zu einem älteren Satz).',
  TRESOR_ERSATZ_MIXED: 'Die Teile stammen aus verschiedenen Sätzen.',
  TRESOR_ERSATZ_DUPLICATE: 'Ein Teil wurde doppelt eingegeben.',
  TRESOR_FACH_FREMD: 'In dieses Fach schreibt nur seine App. BookLedgerPro liest es nur.',
  TRESOR_NUR_IN_DER_APP: 'Diese Datei öffnet nur ihre eigene App.',
};

// ---- Tresorordner-Ansicht 1 → 2 → 4 → 3 (Klaus 2026-10-28) ----------------------------------------------------------

/** Kann BookLedgerPro diesen Eintrag als Beleg übernehmen? Gemeinsames Format, keine eigene Sicherung, nicht aus dem eigenen Fach. */
export function uebernehmbar(fach, e) { return !!(fach && fach.fach !== 'bookledgerpro' && oeffenbar(e) && !istSicherung(e)); }

/** 1 · „Neu im Tresorordner“: übernehmbare Einträge ohne Marke „übernommen“, neueste zuerst. */
export function neueEintraege(faecher) {
  const aus = [];
  for (const f of faecher || []) for (const e of f.eintraege || []) if (uebernehmbar(f, e) && !(f.marken && f.marken.has(e.id))) aus.push({ fach: f.fach, eintrag: e });
  return aus.sort((a, b) => (b.eintrag.datum || 0) - (a.eintrag.datum || 0));
}

/** 2 · Einträge eines Fachs nach Unterordner (erstes Stück des Verweises, z. B. „Mails“, „Belege“), Ordner alphabetisch,
 *  Einträge darin neueste zuerst. Einträge ohne Unterordner stehen in der Gruppe '' (vorn). */
export function unterordnerGruppen(eintraege) {
  const m = new Map();
  for (const e of eintraege || []) {
    const v = String((e && e.verweis) || ''), i = v.indexOf('/');
    const ordner = i > 0 ? v.slice(0, i) : '';
    if (!m.has(ordner)) m.set(ordner, []);
    m.get(ordner).push(e);
  }
  return [...m.entries()].sort((a, b) => (a[0] === '' ? -1 : b[0] === '' ? 1 : a[0].localeCompare(b[0], 'de')))
    .map(([ordner, liste]) => ({ ordner, eintraege: liste.sort((a, b) => (b.datum || 0) - (a.datum || 0)) }));
}

/** Die anderen Pro-Apps, die BookLedgerPro starten darf (Schlüssel = Kennung im Tresorordner). */
export const PRO_APPS = Object.freeze({ 'private-brain': 'Private Brain Pro', 'workflow-pdf-pro': 'Workflow PDF Pro' });

/** 3 · In welcher App öffnet sich ein Eintrag, den BookLedgerPro nicht lesen kann? Schreiber zuerst, sonst das Fach. */
export function appFuer(fach, e) {
  const k = (e && PRO_APPS[e.schreiber]) ? e.schreiber : (fach && PRO_APPS[fach.fach]) ? fach.fach : null;
  return k ? { app: k, name: PRO_APPS[k] } : null;
}
