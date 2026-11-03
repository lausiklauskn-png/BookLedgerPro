// src/ui/woLiegtWas.js — Hilfe „Wo liegt was?“ (gemeinsamer Tresor-Plan aller Pro-Apps, Klaus 2026-11-03: „Ja zum Plan“).
// Gleicher Inhalt in jeder Pro-App, darunter app-eigen: Fach „BookLedgerPro“ (Sicherung/, Belege/), Eingang, Menüweg.
// Steht in der Tresorordner-Ansicht und unter Einstellungen › Tresor & Ablage (beide nur in der App, die PWA hat keinen Tresor).
import { el } from './dom.js';
import { t } from './i18n.js';

export const WLW_PUNKTE = ['wlw.1', 'wlw.2', 'wlw.3', 'wlw.4', 'wlw.5', 'wlw.6', 'wlw.7'];

/** Zuklappbarer Kasten; `offen` nur, wenn gerade ein falscher Ordner gewählt ist. */
export function woLiegtWas({ offen = false, kasten = true } = {}) {
  return el('details', { class: kasten ? 'card wo-liegt-was' : 'wo-liegt-was', 'data-wo-liegt-was': '', open: offen ? true : null }, [
    el('summary', { text: t('wlw.titel') }),
    el('ul', { class: 'small' }, WLW_PUNKTE.map((k) => el('li', { text: t(k) }))),
    el('p', { class: 'small', 'data-wlw-app': '', text: t('wlw.app') }),
    el('p', { class: 'small', 'data-wlw-weg': '', text: t('wlw.weg') }),
    el('p', { class: 'muted small', 'data-wlw-namen': '', text: t('wlw.namen') }),
  ]);
}
