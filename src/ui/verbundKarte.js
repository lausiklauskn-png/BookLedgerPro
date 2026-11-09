// src/ui/verbundKarte.js — Vorschau-Hilfe „Pro-App-Verbund“ (Klaus 2026-11-09: „Jetzt die Karte in die Apps einbauen“ ·
// „damit man sieht, aha, das könnte man noch machen“). Die Karte assets/pro-verbund.html wird nur in BookLedgerPro gepflegt
// (Pin assets/pro-verbund.herkunft.json, Kopie in andere Repos über tools/verbund-nachziehen.mjs) und hier NICHT verändert.
//
// Geöffnet wird sie in einem Vollbild-Rahmen über der App, nie als neues Fenster: in der Android-App gibt es kein zweites
// Fenster. „Schließen“, Esc und die Zurück-Taste (ein eigener Verlaufseintrag) schließen den Rahmen.
import { el } from './dom.js';
import { t } from './i18n.js';

export const VERBUND_DATEI = './assets/pro-verbund.html';

let _offen = null;

/** Öffnet die Karte im Vollbild-Rahmen. Ein zweiter Aufruf bei offener Karte tut nichts. */
export function verbundOeffnen() {
  if (_offen) return _offen;
  const rahmen = el('iframe', { class: 'verbund-rahmen', 'data-verbund-rahmen': '', src: VERBUND_DATEI, title: t('verbund.titel') });
  let ueberVerlauf = false;
  const zu = (vonZurueck = false) => {
    if (!_offen) return;
    _offen = null;
    overlay.remove();
    document.removeEventListener('keydown', esc);
    window.removeEventListener('popstate', zurueck);
    // Mit „Schließen“ geschlossen: den eigenen Verlaufseintrag wieder abbauen, sonst bräuchte die Zurück-Taste zwei Tipps.
    if (!vonZurueck && ueberVerlauf && history.state && history.state.blpVerbund) history.back();
  };
  const esc = (e) => { if (e.key === 'Escape') zu(); };
  const zurueck = () => zu(true);
  const overlay = el('div', { class: 'verbund-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('verbund.titel'), 'data-verbund': '' }, [
    el('div', { class: 'verbund-kopf' }, [
      el('strong', { class: 'verbund-titel', text: t('verbund.titel') }),
      el('button', { class: 'btn btn-sm btn-primary', type: 'button', 'data-verbund-zu': '', text: t('verbund.schliessen'), onClick: () => zu() }),
    ]),
    rahmen,
  ]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', esc);
  try {
    history.pushState({ ...(history.state || {}), blpVerbund: true }, '', location.href);
    ueberVerlauf = true;
    window.addEventListener('popstate', zurueck);
  } catch { /* ohne Verlauf: Schließen und Esc genügen */ }
  _offen = { schliessen: () => zu(), overlay };
  return _offen;
}

/** Kasten für Anleitung/„Über“: Titel, ⓘ-Satz (schlank.js legt ihn hinter das ⓘ), ein Knopf. */
export function verbundKasten() {
  return el('div', { class: 'card', 'data-verbund-kasten': '' }, [
    el('h2', { class: 'card-title', text: t('verbund.titel') }),
    el('p', { class: 'muted small', text: t('verbund.info') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-sm', type: 'button', 'data-verbund-oeffnen': '', text: t('verbund.oeffnen'), onClick: () => verbundOeffnen() }),
    ]),
  ]);
}
