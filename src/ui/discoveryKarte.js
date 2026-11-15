// src/ui/discoveryKarte.js — Hilfe-Seite „Discovery“ (Klaus 2026-11-15: „Da wo der Sortierkern drin ist, Discovery/Button
// nachziehen“ · mit einbauen, Knopf in der Anleitung und unter „Über“ neben der Verbund-Karte). Die Seite zeigt, wie der
// Sortier-Kern des Datei-Organizers trainiert wurde (3D-Baum, Lern-Kreislauf, Kurzfilme, 13 Tonspuren). Sie liegt
// byte-gleich unter assets/discovery/ (Pin assets/discovery/HERKUNFT.json, nur über tools/discovery-nachziehen.mjs) und
// wird hier NICHT verändert. Sie lädt alles neben sich selbst, kein Netz.
//
// Geöffnet wird sie wie die Verbund-Karte (verbundKarte.js) in einem Vollbild-Rahmen über der App, nie als neues Fenster.
// „Schließen“, Esc und die Zurück-Taste (ein eigener Verlaufseintrag) schließen den Rahmen; im Rahmen zeigt die Seite
// selbst keinen Rückweg-Knopf.
import { el } from './dom.js';
import { t } from './i18n.js';
import { iconText } from './icons.js';

export const DISCOVERY_ORDNER = './assets/discovery/';
export const DISCOVERY_DATEI = DISCOVERY_ORDNER + 'discovery.html';

let _offen = null;
let _bereitgelegt = false;

/** PWA: Film und Tonspuren liegen nicht in der Schale (6 MB). Beim ersten Öffnen holt die App sie still nacheinander —
 *  der Worker legt sie dabei in seinen Discovery-Vorrat, danach läuft die Seite ohne Netz. In den Apps (Android/Windows)
 *  liegen die Dateien im Paket; ohne Worker oder im Datensparmodus geschieht nichts. Fehler bleiben still. */
export async function discoveryBereitlegen({ abruf = (u) => fetch(u) } = {}) {
  if (_bereitgelegt) return 0;
  if (typeof navigator === 'undefined' || !navigator.serviceWorker || !navigator.serviceWorker.controller) return 0;
  if (navigator.connection && navigator.connection.saveData) return 0;
  _bereitgelegt = true;
  let n = 0;
  try {
    const pin = await (await abruf(DISCOVERY_ORDNER + 'HERKUNFT.json')).json();
    for (const f of Object.keys(pin.dateien || {})) {
      if (!_offen) { _bereitgelegt = false; break; }   // Rahmen geschlossen: nicht weiterladen, beim nächsten Öffnen neu
      try { const r = await abruf(DISCOVERY_ORDNER + f); if (r && r.ok) { await r.arrayBuffer(); n++; } } catch { /* nächste Datei */ }
    }
  } catch { _bereitgelegt = false; }
  return n;
}

/** Öffnet die Seite im Vollbild-Rahmen. Ein zweiter Aufruf bei offener Seite tut nichts. */
export function discoveryOeffnen() {
  if (_offen) return _offen;
  const rahmen = el('iframe', { class: 'verbund-rahmen discovery-rahmen', 'data-discovery-rahmen': '', src: DISCOVERY_DATEI, title: t('discovery.titel'), allow: 'autoplay; fullscreen' });
  let ueberVerlauf = false;
  const zu = (vonZurueck = false) => {
    if (!_offen) return;
    _offen = null;
    overlay.remove();   // nimmt den Rahmen aus dem Dokument: Film, Ton und 3D der Seite enden damit
    document.removeEventListener('keydown', esc);
    window.removeEventListener('popstate', zurueck);
    // Mit „Schließen“ geschlossen: den eigenen Verlaufseintrag wieder abbauen, sonst bräuchte die Zurück-Taste zwei Tipps.
    if (!vonZurueck && ueberVerlauf && history.state && history.state.blpDiscovery) history.back();
  };
  const esc = (e) => { if (e.key === 'Escape') zu(); };
  // Die Seite kann im Rahmen selbst Verlaufseinträge anlegen (Sprungmarken, „Leichte Ansicht“). Zurück schließt nur,
  // wenn der eigene Eintrag wirklich verlassen ist.
  const zurueck = () => { if (!(history.state && history.state.blpDiscovery)) zu(true); };
  const overlay = el('div', { class: 'verbund-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('discovery.titel'), 'data-discovery': '' }, [
    el('div', { class: 'verbund-kopf' }, [
      el('strong', { class: 'verbund-titel', text: t('discovery.titel') }),
      el('button', { class: 'btn btn-sm btn-primary', type: 'button', 'data-discovery-zu': '', text: t('discovery.schliessen'), onClick: () => zu() }),
    ]),
    rahmen,
  ]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', esc);
  try {
    history.pushState({ ...(history.state || {}), blpDiscovery: true }, '', location.href);
    ueberVerlauf = true;
    window.addEventListener('popstate', zurueck);
  } catch { /* ohne Verlauf: Schließen und Esc genügen */ }
  _offen = { schliessen: () => zu(), overlay };
  discoveryBereitlegen();
  return _offen;
}

/** Kasten für Anleitung/„Über“ (direkt nach dem Verbund-Kasten): Titel, ⓘ-Satz (schlank.js legt ihn hinter das ⓘ), ein Knopf. */
export function discoveryKasten() {
  return el('div', { class: 'card', 'data-discovery-kasten': '' }, [
    el('h2', { class: 'card-title', text: t('discovery.titel') }),
    el('p', { class: 'muted small', text: t('discovery.info') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-sm', type: 'button', 'data-discovery-oeffnen': '', onClick: () => discoveryOeffnen() }, iconText('pb-eye', t('discovery.oeffnen'))),
    ]),
  ]);
}
