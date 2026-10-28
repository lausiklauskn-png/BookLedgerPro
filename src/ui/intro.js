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

/**
 * Das Deckblatt-Bild = das LCP-Element der Seite (gemessen 2026-08-03).
 *
 * Es steht seit dem 2026-08-03 STATISCH in index.html, damit der Browser es
 * malen kann, ohne auf den Modulbaum zu warten (vorher: 2.000 ms Rendering-
 * Verzoegerung laut PageSpeed-Aufschluesselung). Hier wird genau dieses
 * Element UEBERNOMMEN statt ein zweites zu bauen:
 *
 *   - dasselbe Element bleibt bestehen  -> der fruehe LCP-Zeitpunkt bleibt
 *     stehen (ein neu gebautes, gleich grosses Bild waere ein spaeterer
 *     Anwaerter und wuerde die Zahl verschlechtern),
 *   - kein zweiter Ladevorgang, kein Versatz beim Umhaengen (CLS).
 *
 * Die Kennung wird beim Uebernehmen entfernt. So bekommt der zweite Aufruf
 * (Menuepunkt „Ueber", spaeter im Programm) sauber ein frisches Bild und
 * stiehlt nicht das Element aus dem schon gebauten Deckblatt.
 *
 * width/height stehen fest da, damit der Browser den Platz vorab freihaelt
 * (die CSS-Regel .deckblatt-cover setzt height:auto — die Attribute wirken
 * dadurch als Seitenverhaeltnis, nicht als starre Groesse). fetchpriority=high,
 * weil das Bild sonst hinter den uebrigen Anfragen einsortiert wird, obwohl es
 * das groesste sichtbare Element ist. Wer die Masse hier aendert, aendert sie
 * auch in index.html — sonst springt das Layout beim Uebernehmen.
 */
function heroBild() {
  const statisch = document.getElementById('deckblatt-cover-statisch');
  if (statisch) { statisch.removeAttribute('id'); return statisch; }
  return el('img', { class: 'deckblatt-cover', src: './assets/img/cover.webp',
    srcset: './assets/img/cover-640.webp 640w, ./assets/img/cover.webp 1040w',
    sizes: '(max-width: 584px) calc(100vw - 4rem), 520px',
    alt: '', loading: 'eager', fetchpriority: 'high', width: '1040', height: '693' });
}

/** Wiederverwendbarer Deckblatt-Inhalt (für „Über"-Menü und Vor-Login-Overlay). */
// Version der App (Leitfaden § 6: „Über“ nennt immer die Version). Nur in der Pro-App, dort aus dem Android-Paket.
function versionZeile() {
  const nativ = typeof window !== 'undefined' && window.BLPNative && typeof window.BLPNative.version === 'function' ? window.BLPNative : null;
  if (!nativ) return null;
  const p = el('p', { class: 'muted small', 'data-app-version': '', text: '' });
  nativ.version().then((v) => { if (v) p.textContent = t('ta.version').replace('{v}', v); }).catch(() => {});
  return nativ.updates ? el('div', { 'data-app-version-zeile': '' }, [p, updateZeile(nativ.updates)]) : p;
}

// „Auf Updates prüfen“ (Leitfaden § 6, Klaus 2026-10-28): vom eigenen Server, nur mit gültiger Unterschrift (prüft die Hülle).
// Erst auf Tipp, nie von selbst. Ein farbiger Knopf erst, wenn es etwas Neues gibt.
function updateZeile(u) {
  const status = el('p', { class: 'muted small', role: 'status', 'data-update-status': '' });
  const knopf = el('button', { class: 'btn btn-sm', type: 'button', 'data-update-pruefen': '', text: t('upd.pruefen') });
  const box = el('div', { 'data-update': '' }, [knopf, status]);
  const grund = (e) => { const c = String((e && (e.code || e.message)) || e || ''), k = 'upd.' + c, x = t(k); return t('upd.fehler').replace('{grund}', x === k ? c : x); };
  knopf.addEventListener('click', async () => {
    knopf.disabled = true; status.textContent = t('upd.laeuft');
    box.querySelector('[data-update-installieren]')?.remove();
    try {
      const r = await u.pruefen();
      if (r && r.neu) {
        status.textContent = t('upd.neu').replace('{neu}', r.neu).replace('{alt}', r.installiert);
        const los = el('button', { class: 'btn btn-sm btn-primary', type: 'button', 'data-update-installieren': '', text: t('upd.installieren') });
        los.addEventListener('click', async () => {
          los.disabled = true; knopf.disabled = true;
          const gesamt = Math.max(1, Math.round((r.groesse || 0) / 1048576));
          status.textContent = t('upd.laedt').replace('{mb}', '0').replace('{gesamt}', gesamt);
          const h = u.beiStand((s) => { status.textContent = t('upd.laedt').replace('{mb}', Math.round((s.geladen || 0) / 1048576)).replace('{gesamt}', gesamt); });
          try { await u.installieren(); status.textContent = t('upd.startet'); }
          catch (e) { status.textContent = grund(e); los.disabled = false; knopf.disabled = false; }
          finally { Promise.resolve(h).then((x) => x && x.remove && x.remove()).catch(() => {}); }
        });
        box.append(los);
      } else status.textContent = t('upd.aktuell').replace('{v}', (r && r.version) || '');
    } catch (e) { status.textContent = grund(e); }
    knopf.disabled = false;
  });
  return box;
}

export function aboutContent() {
  return el('div', { class: 'deckblatt' }, [
    el('div', { class: 'deckblatt-hero' }, [
      heroBild(),
      MycelMark(56),
      el('h1', { class: 'deckblatt-title', text: t('app.name') }),
      el('p', { class: 'deckblatt-tagline', text: 'Buchhaltung & Steuer — offline, verschlüsselt, EU-KI-gestützt.' }),
      el('div', { class: 'deckblatt-zielgruppen' }, [
        // Die vier Modi (Klaus 2026-10-26, Sammlung B8): Privat statt „Laien".
        el('span', { class: 'pill', text: 'Privat' }),
        el('span', { class: 'pill', text: 'Kleinunternehmer' }),
        el('span', { class: 'pill', text: 'Selbstständige' }),
        el('span', { class: 'pill', text: 'Berater' }),
      ]),
    ]),
    versionZeile(),
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
    // <main> statt <div>: das Deckblatt ist der erste Bildschirm, den ein
    // Besucher sieht. Ohne Hauptmarkierung findet eine Vorlesehilfe hier keinen
    // Einstiegspunkt — PageSpeed meldete "Dokument hat keine Hauptmarkierung".
    // Die App-Shell hinter der Anmeldung hat ihr <main> laengst (shell.js);
    // davor gab es keins. Rein semantisch, die Optik aendert sich nicht
    // (.intro-screen bleibt die tragende CSS-Klasse).
    const view = el('main', { class: 'intro-screen' }, [
      el('div', { class: 'intro-scroll' }, [
        aboutContent(),
        el('label', { class: 'intro-skip' }, [skip, el('span', { text: t('intro.skip') })]),
        el('div', { class: 'btn-row' }, [weiter]),
      ]),
    ]);
    container.replaceChildren(view);
  });
}
