// src/ui/intro.js
// Öffentliches Deckblatt / Datenblatt von BookLedgerPro.
// Wird VOR der Passworteingabe gezeigt (zum Informieren) und ist im Programm
// jederzeit über den Menüpunkt „Über" erreichbar.
//
// WICHTIG (Ehrlichkeit): Das Konformitäts-Siegel nennt nur NACHPRÜFBARE Aussagen
// (EU-Endpunkte, lokale Verschlüsselung, GoBD-Mechanik, BYOK/opt-in) und verlinkt
// die ECHTEN Compliance-Programme der Anbieter. Es behauptet KEIN eigenes Zertifikat.

import { el } from './dom.js';
import { t } from './i18n.js';
import { MycelMark } from './mycel.js';

const SKIP_KEY = 'blpr_intro_skip';

export function siegel() {
  return el('div', { class: 'siegel' }, [
    el('div', { class: 'siegel-badge' }, [
      el('span', { class: 'siegel-eu', text: 'EU' }),
      el('span', { class: 'siegel-badge-text', text: 'DSGVO · GoBD' }),
    ]),
    el('div', { class: 'siegel-body' }, [
      el('strong', { text: 'EU-Datenschutz & Konformität — nachprüfbar' }),
      el('ul', { class: 'siegel-liste' }, [
        el('li', { text: '100 % EU-Datenverarbeitung: Texterkennung über Google Cloud Vision (EU-Endpunkt), Kontierung/Steuer-Assistent über Mistral (EU/Frankreich).' }),
        el('li', { text: 'Offline-first & lokal Ende-zu-Ende verschlüsselt (AES-GCM-256, Schlüssel aus deinem Passwort) — kein Server, kein Tracking.' }),
        el('li', { text: 'DSGVO-konform gestaltet: Privacy by Design, externe KI nur opt-in mit deinem eigenen Schlüssel (BYOK), Datenminimierung.' }),
        el('li', { text: 'GoBD-Architektur: Festschreibung mit Hash-Kette, Storno statt Löschen, lückenlose Nummern.' }),
      ]),
      el('div', { class: 'siegel-anbieter' }, [
        el('img', { class: 'siegel-iso', src: './assets/img/iso-iec.jpg', alt: 'ISO/IEC', loading: 'lazy' }),
        el('span', { class: 'small', text: 'Anbieter-Zertifizierung: ISO/IEC 27001 / 27701 — Google Cloud (Vision) & Mistral (EU). Gilt für die genutzten EU-Dienste, nicht als Eigen-Zertifikat von BookLedgerPro.' }),
      ]),
      el('div', { class: 'siegel-links' }, [
        el('span', { class: 'muted small', text: 'Belege: ' }),
        el('a', { href: 'https://cloud.google.com/security/compliance', target: '_blank', rel: 'noopener', text: 'Google Cloud (ISO 27001/27701, C5/BSI, EU Cloud CoC)' }),
        el('span', { text: ' · ' }),
        el('a', { href: 'https://mistral.ai/terms', target: '_blank', rel: 'noopener', text: 'Mistral AI (EU)' }),
      ]),
    ]),
  ]);
}

function kiDatenblatt() {
  const punkt = (titel, text) => el('div', { class: 'datenblatt-item' }, [
    el('strong', { text: titel }),
    el('div', { class: 'muted small', text }),
  ]);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: 'Was die KI kann (EU, opt-in)' }),
    el('div', { class: 'datenblatt-grid' }, [
      punkt('Beleg-Texterkennung (OCR)', 'Foto/PDF → Text über Google Cloud Vision (EU-Endpunkt).'),
      punkt('Automatische Kontierung', 'SKR03-Kontovorschlag über Mistral (EU); On-Device-Heuristik als Fallback.'),
      punkt('Steuer-Assistent', 'Erklärt USt-Voranmeldung & EÜR in einfacher Sprache (Mistral EU) — keine Steuerberatung.'),
      punkt('KI-Begründung mit §-Bezug', 'Begründung/Notiz auf Basis hinterlegter Rechtsregeln (gegroundet), Mistral EU oder on-device.'),
      punkt('Du behältst die Kontrolle', 'Übertragung nur nach Bestätigung, nur in die EU, mit deinem Schlüssel. Festschreiben bleibt manuell (GoBD).'),
      punkt('Funktioniert auch ohne Cloud', 'Ohne KI-Schlüssel laufen On-Device-Heuristiken — die App bleibt voll nutzbar.'),
    ]),
  ]);
}

/** Wiederverwendbarer Deckblatt-Inhalt (für „Über"-Menü und Vor-Login-Overlay). */
export function aboutContent() {
  return el('div', { class: 'deckblatt' }, [
    el('div', { class: 'deckblatt-hero' }, [
      el('img', { class: 'deckblatt-cover', src: './assets/img/cover.png', alt: '', loading: 'eager' }),
      MycelMark(56),
      el('h1', { class: 'deckblatt-title', text: t('app.name') }),
      el('p', { class: 'deckblatt-tagline', text: 'Buchhaltung & Steuer — offline, verschlüsselt, EU-KI-gestützt.' }),
      el('div', { class: 'deckblatt-zielgruppen' }, [
        el('span', { class: 'pill', text: 'Laien' }),
        el('span', { class: 'pill', text: 'Kleinunternehmen' }),
        el('span', { class: 'pill', text: 'Profis' }),
        el('span', { class: 'pill', text: 'Berater' }),
      ]),
    ]),
    siegel(),
    kiDatenblatt(),
    el('p', { class: 'muted small', text: 'GoBD-Festschreibung mit Hash-Kette · USt-Voranmeldung & EÜR (auch §4 Abs.3) · §14-Rechnung · DATEV-Export. Details unter „Recht & Doku".' }),
  ]);
}

/**
 * Zeigt das Deckblatt VOR der Anmeldung. Löst auf, sobald „Zur Anmeldung" geklickt
 * wird. Mit „nicht mehr automatisch anzeigen" (lokal gemerkt) wird es übersprungen.
 * @returns {Promise<void>}
 */
export function showIntro(container) {
  if (localStorage.getItem(SKIP_KEY) === '1') return Promise.resolve();
  return new Promise((resolve) => {
    const skip = el('input', { type: 'checkbox' });
    const weiter = el('button', {
      class: 'btn btn-primary', text: t('intro.toLogin'),
      onClick: () => {
        if (skip.checked) localStorage.setItem(SKIP_KEY, '1');
        resolve();
      },
    });
    const view = el('div', { class: 'intro-screen' }, [
      el('div', { class: 'intro-scroll' }, [
        aboutContent(),
        el('label', { class: 'intro-skip' }, [skip, el('span', { text: t('intro.skip') })]),
        el('div', { class: 'btn-row' }, [weiter]),
      ]),
    ]);
    container.replaceChildren(view);
  });
}
