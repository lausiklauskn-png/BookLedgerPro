// src/domain/ueberall.js — „Überall suchen“ und das Antwortrecht im Mycel (Pro-Umbau 11, Klaus 2026-10-30) — REINE LOGIK.
// Klaus' Ziel: „arbeitsplatzübergreifend Dokumente und Notizen in den Programmen im Netz finden“. Eine Suche, eine Liste,
// jede Zeile sagt, woher sie kommt: diese App (Belege, Buchungen, Kunden, Aufträge), die eingebetteten Apps (Angebotsplaner =
// Workflow Calculate, Bedarfsanalyse = Workflow Needs), der Tresorordner der Pro-Apps (nur in der App) und auf Wunsch das Netz.
// Kein DOM, keine IndexedDB, keine Brücke — in tests/run.mjs node-geprüft; die Ansicht steht in src/ui/views/sbkimsuche.js.

import { suchwoerter, wortTreffer, ausschnitt, normalisieren } from './belegsuche.js';

/** Herkunft einer Trefferzeile, in der Reihenfolge der Liste. */
export const HERKUNFT = Object.freeze(['app', 'calculate', 'needs', 'tresor', 'netz']);

/** Höchstens so viele Zeilen je Herkunft (die Liste bleibt lesbar; „mehr“ zeigt die jeweilige Ansicht). */
export const JE_HERKUNFT_MAX = 25;

/** Höchstens so viele Belege bietet BookLedgerPro dem Netz an (je Antwort gehen ohnehin nur die besten k zurück). */
export const NETZ_KORPUS_MAX = 300;

const txt = (v) => (v === undefined || v === null ? '' : String(v));

/** Text eines Angebots aus Workflow Calculate (Datenbank „WorkflowCalculate1“, Fach „angebote“). */
export function calculateText(a, kunden = []) {
  if (!a) return '';
  const k = (kunden || []).find((x) => x && x.id === a.kundeId) || a.kunde || {};
  return [a.nummer, a.titel, k.name, k.nr, a.status === 'gestellt' ? 'gestellt' : 'Entwurf',
    ...(Array.isArray(a.positionen) ? a.positionen.map((p) => p && (p.titel || p.vorlage)) : [])].filter(Boolean).map(txt).join(' · ');
}

/** Text eines Vorgangs aus Workflow Needs (Datenbank „WorkflowNeeds1“, Fach „vorgaenge“). */
export function needsText(v) {
  if (!v) return '';
  const k = v.kunde || {};
  return [v.titel, k.firma, k.name, v.id, v.notiz, v.beschreibung].filter(Boolean).map(txt).join(' · ');
}

/** Kunde aus Calculate. */
export function calculateKundeText(k) { return k ? [k.name, k.nr, k.anschrift].filter(Boolean).map(txt).join(' · ') : ''; }

/**
 * Wortsuche über die Daten der eingebetteten Apps (UND über alle Wörter, normalisiert wie bei den Belegen).
 * @param {{angebote?:object[], kunden?:object[], vorgaenge?:object[]}} daten
 * @returns {{herkunft:'calculate'|'needs', typ:string, id:string, name:string, stelle:string}[]}
 */
export function appsSuchen(daten, frage) {
  const woerter = suchwoerter(frage);
  if (!woerter.length) return [];
  const aus = [];
  const d = daten || {};
  for (const a of d.angebote || []) {
    const text = calculateText(a, d.kunden);
    if (wortTreffer(text, woerter)) aus.push({ herkunft: 'calculate', typ: 'angebot', id: txt(a.id), name: [a.nummer, a.titel].filter(Boolean).join(' · ') || txt(a.id), stelle: ausschnitt(text, woerter) });
  }
  for (const k of d.kunden || []) {
    const text = calculateKundeText(k);
    if (wortTreffer(text, woerter)) aus.push({ herkunft: 'calculate', typ: 'kunde', id: txt(k.id), name: txt(k.name) || txt(k.id), stelle: ausschnitt(text, woerter) });
  }
  for (const v of d.vorgaenge || []) {
    const text = needsText(v);
    if (wortTreffer(text, woerter)) aus.push({ herkunft: 'needs', typ: 'vorgang', id: txt(v.id), name: txt(v.titel) || txt(v.id), stelle: ausschnitt(text, woerter) });
  }
  return aus;
}

/** Wortsuche über die Konten (Knopf „Passendes Konto finden“, ohne Modell): Treffer nach Zahl der Wörter, dann Nummer. */
export function kontoWortTreffer(eintraege, frage, max = 8) {
  const woerter = suchwoerter(frage);
  if (!woerter.length) return [];
  const aus = [];
  for (const e of eintraege || []) {
    const n = normalisieren((e.label || '') + ' ' + (e.text || ''));
    const zahl = woerter.filter((w) => n.includes(w)).length;
    if (zahl) aus.push({ ...e, zahl });
  }
  return aus.sort((a, b) => b.zahl - a.zahl || String(a.anchorId).localeCompare(String(b.anchorId))).slice(0, max);
}

/** Betrag einer Buchung (größte Zeile = Bruttobetrag) als „123,45 €“ — nur für die Netz-Zeile eines Belegs. */
export function buchungsBetrag(b) {
  if (!b) return '';
  // Beträge stehen in ganzen Cent (money.js); die größte Zeile ist der Bruttobetrag.
  const max = Math.max(0, ...(b.zeilen || []).map((z) => Math.abs(Number(z && z.betrag) || 0)));
  if (!max) return '';
  return (max / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

/**
 * Was BookLedgerPro dem Netz von einem Beleg zeigt (Klaus m3: „nur Titel, Datum, Betrag, nie der Inhalt“).
 * Bewusst KEIN Belegtext, keine Positionen, keine Kunden: der erkannte Text bleibt verschlüsselt auf dem Gerät.
 * @param {object[]} belege   Beleg-Metadaten (listBelege)
 * @param {Map<string,object>|object} [buchungen] Buchung je Kennung (für den Betrag)
 * @returns {{label:string, text:string, anchorId:string}[]}
 */
export function netzKorpusEintraege(belege, buchungen) {
  const hol = (id) => (!id || !buchungen) ? null : (buchungen instanceof Map ? buchungen.get(id) : buchungen[id]);
  return (belege || []).slice(0, NETZ_KORPUS_MAX).filter((b) => b && b.id).map((b) => {
    const datum = txt(b.belegDatum || (b.mail && b.mail.datum) || txt(b.createdAt).slice(0, 10));
    const betrag = buchungsBetrag(hol(b.buchungId));
    const titel = txt(b.name).replace(/\.[a-z0-9]{2,4}$/i, '').slice(0, 120);
    const label = ['Beleg', titel, datum, betrag].filter(Boolean).join(' · ');
    return { label, text: label, anchorId: 'beleg:' + b.id };
  });
}

/** Antworten aus dem Netz (Modul 23 askNode) in Trefferzeilen; fremder Text bleibt Text (Anzeige über textContent). */
export function netzZeilen(antworten) {
  const aus = [];
  for (const a of antworten || []) {
    if (!a || !a.ok || !Array.isArray(a.results)) continue;
    for (const r of a.results.slice(0, 10)) {
      const label = txt(r && r.label).slice(0, 200);
      if (!label) continue;
      aus.push({ herkunft: 'netz', typ: 'knoten', id: txt(r.anchorId) || label, name: label,
        stelle: txt(a.nodeName || a.fromName || '').slice(0, 80), knoten: txt(a.nodeName || a.fromName || a.fromNodeId || '').slice(0, 80),
        bestaetigt: !!a.bestaetigt, score: typeof r.score === 'number' ? r.score : null });
    }
  }
  return aus;
}

/** Ordnet Treffer nach Herkunft (Reihenfolge HERKUNFT) und kappt je Herkunft. */
export function gruppieren(treffer, max = JE_HERKUNFT_MAX) {
  const g = new Map(HERKUNFT.map((h) => [h, []]));
  for (const t of treffer || []) { const l = g.get(t.herkunft); if (l && l.length < max) l.push(t); }
  return [...g.entries()].filter(([, l]) => l.length).map(([herkunft, liste]) => ({ herkunft, liste }));
}

/** Prüfung durch eine KI (Klaus m12): nur auf Schalter, nur Titel und Fundstelle, höchstens 12 Zeilen. */
export function kiKandidaten(treffer, max = 12) {
  return (treffer || []).filter((t) => t && t.herkunft !== 'netz').slice(0, max)
    .map((t) => ({ label: t.name, text: [t.name, t.stelle].filter(Boolean).join(' — ').slice(0, 400), cosine: 0.5, anchorId: t.herkunft + ':' + t.typ + ':' + t.id }));
}
