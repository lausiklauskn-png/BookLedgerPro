// src/ui/proAppGeben.js — „An Pro-App geben …“ sichtbar in der Knopfzeile eines Belegs (Leitfaden § 5, Pro-Umbau 4).
//
// In der Pro-App (window.BLPNative.tresor): Auswahl der Pro-Apps. Ziel ist das Übergabefach der Empfänger-App im
// gemeinsamen Tresorordner — jede Pro-App darf dort ablegen, gelesen wird es von der Empfänger-App (Paket
// de.familyprojekt.tresor, Fach.darfSchreiben). Ist der Tresor gesperrt, fragt die App „Entsperren oder normal teilen?“ —
// nie still den anderen Weg. „Normal teilen“ ist immer ein eigener, sichtbarer Knopf (Androids Teilen-Auswahl).
// Als PWA (BookLedger Basic, Browser) gibt es keinen Tresorordner: der Knopf heißt ehrlich „Teilen …“ und teilt die Datei.
//
// ⚠ Benannte Grenzen: Private Brain hat im Tresor-Paket (Fach.java, gepflegt in Workflow PDF Pro) kein Übergabefach —
// dorthin geht es nur über „Normal teilen“ (Private Brain Pro steht in Androids Teilen-Liste). Workflow PDF Pro legt sein
// Fach „Eingang-WorkflowPDF“ an, zeigt es aber (Stand 2026-10-28) noch nicht in der App; die Datei liegt dort und ist in
// der Dateien-App und in der Tresorordner-Ansicht von BookLedgerPro zu sehen.

import { el } from './dom.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { dialog } from './belegDialoge.js';
import { getBelegBytes } from '../domain/documents.js';

/** Pro-Apps mit Übergabefach (slug = Fach im Tresorordner) bzw. ohne (nur über normales Teilen). */
export const ZIELE = [
  { app: 'workflow-pdf-pro', name: 'Workflow PDF Pro', fach: 'eingang-workflowpdf', ordner: 'Eingang-WorkflowPDF' },
  { app: 'private-brain', name: 'Private Brain Pro', fach: null, ordner: null },
];

const tresor = () => (typeof window !== 'undefined' && window.BLPNative && window.BLPNative.tresor) || null;
const meldung = (text) => { if (typeof window !== 'undefined') window.__blpGeben = { ...(window.__blpGeben || {}), text }; };

async function belegDatei(b) {
  const bytes = await getBelegBytes(b.id);
  if (!bytes) throw new Error(t('docs.geben.fehlt'));
  return new File([bytes], b.name || 'Beleg', { type: b.mediaType || 'application/octet-stream' });
}

/** Normal teilen (Android-Auswahl bzw. Web Share); ohne Teilen-Funktion wird die Datei gespeichert und das gesagt. */
export async function normalTeilen(b) {
  const datei = await belegDatei(b);
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [datei] })) {
    try { await navigator.share({ files: [datei], title: datei.name }); meldung('geteilt'); return 'geteilt'; }
    catch (e) { if (e && e.name === 'AbortError') { meldung('abgebrochen'); return 'abgebrochen'; } throw e; }
  }
  const url = URL.createObjectURL(datei);
  const a = el('a', { href: url, download: datei.name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  alert(t('docs.geben.gespeichert'));
  meldung('gespeichert');
  return 'gespeichert';
}

async function insFach(b, ziel) {
  const T = tresor();
  let z = await T.zustand().catch(() => null);
  if (!z || !z.offen) {
    const w = await dialog(t('docs.geben.gesperrtTitel'), [el('p', { text: t('docs.geben.gesperrtText').replace('{app}', ziel.name) })], [
      { text: t('beleg.abbrechen'), wert: null, data: 'data-geben-abbrechen' },
      { text: t('docs.geben.normal'), wert: 'normal', data: 'data-geben-normal' },
      { text: t('docs.geben.entsperren'), wert: 'entsperren', primaer: true, data: 'data-geben-entsperren' },
    ], { 'data-geben-gesperrt': '' });
    if (w === 'normal') return normalTeilen(b);
    if (w !== 'entsperren') { meldung('abgebrochen'); return 'abgebrochen'; }
    z = await T.entsperren(true).catch(() => null);
    if (!z || !z.offen) { alert(t('docs.geben.nichtEntsperrt')); meldung('gesperrt'); return 'gesperrt'; }
  }
  const datei = await belegDatei(b);
  await T.ablegen(ziel.fach, '', datei, datei.name, String(b.name || ''), Date.now());
  const text = t('docs.geben.abgelegt').replace('{app}', ziel.name).replace('{ordner}', ziel.ordner);
  meldung(text);
  alert(text);
  return 'abgelegt';
}

/** Auswahl der Pro-Apps (nur in der App). */
export async function anProAppGeben(b) {
  if (!tresor()) return normalTeilen(b);
  const w = await dialog(t('docs.geben.titel'), [
    el('p', { class: 'small', text: t('docs.geben.text') }),
    el('p', { class: 'small muted', 'data-geben-grenze': '', text: t('docs.geben.ohneFach').replace('{app}', 'Private Brain Pro') }),
  ], [
    { text: t('beleg.abbrechen'), wert: null, data: 'data-geben-abbrechen' },
    { text: t('docs.geben.normal'), wert: 'normal', data: 'data-geben-normal' },
    ...ZIELE.filter((z) => z.fach).map((z) => ({ text: z.name, wert: z.app, primaer: true, data: 'data-geben-' + z.app })),
  ], { 'data-geben-auswahl': '' });
  if (w === 'normal') return normalTeilen(b);
  const ziel = ZIELE.find((z) => z.app === w && z.fach);
  if (!ziel) { meldung('abgebrochen'); return 'abgebrochen'; }
  return insFach(b, ziel);
}

/** Der sichtbare Knopf in der Zeile (Symbol + Name; am Handy nur das Symbol, der Name steht im title). */
/** true in der Pro-App (Knopf heißt „An Pro-App geben …“), false als PWA („Teilen …“) — für die Spaltenbreite der Belegliste. */
export const gebenInApp = () => !!tresor();

// imMenue: derselbe Weg als beschrifteter Eintrag im ⋯-Menü (Befund Tablet 2026-10-29: nur das Symbol in der Zeile sagte nicht,
// was es tut). Eigene Marke data-geben-menue, damit [data-geben] eindeutig der Knopf in der Zeile bleibt.
export function gebenKnopf(b, { imMenue = false } = {}) {
  const app = !!tresor();
  const name = t(app ? 'docs.geben.knopf' : 'docs.geben.teilen');
  return el('button', {
    class: imMenue ? 'btn btn-sm geben-menue' : 'btn btn-sm geben-knopf', type: 'button', ...(imMenue ? { 'data-geben-menue': b.id } : { 'data-geben': b.id }), title: name, 'aria-label': name,
    onClick: () => (app ? anProAppGeben(b) : normalTeilen(b)).catch((e) => { meldung('fehler'); alert(t('docs.geben.fehler').replace('{e}', String((e && e.message) || e))); }),
  }, [icon('pb-send'), el('span', { class: 'geben-text', text: name })]);
}
