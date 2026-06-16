// src/ui/views/anleitung.js — Eingebaute Gebrauchsanleitung + Installationshilfe.
// Mit Copy-Buttons: Beispieltext links kopieren, rechts (Splitscreen) in die App
// einfügen — Schritt für Schritt durch das ganze Programm, so wie wir es testen.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';

let _host = null;

export function mountAnleitung(host) {
  _host = host;
  mount(_host, el('section', { class: 'view anleitung' }, [
    el('h1', { text: t('guide.title') }),
    el('div', { class: 'hinweis' }, [
      el('strong', { class: 'small', text: t('guide.splitTitle') }),
      el('p', { class: 'small', text: t('guide.splitHint') }),
    ]),
    installCard(),
    schritteCard(),
    resetCard(),
  ]));
}

/** Textblock mit „Kopieren"-Knopf (für Copy-Paste in die App). */
function copyBlock(text) {
  const status = el('span', { class: 'muted small' });
  const pre = el('pre', { class: 'copy-text', text });
  const btn = el('button', {
    class: 'btn btn-sm', type: 'button', text: t('guide.copy'),
    onClick: async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
        else { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges(); }
        status.textContent = t('guide.copied');
      } catch { status.textContent = t('guide.copyManual'); }
    },
  });
  return el('div', { class: 'copy-block' }, [pre, el('div', { class: 'btn-row' }, [btn, status])]);
}

function schritt(nr, titel, zeilen, copy) {
  return el('div', { class: 'guide-step' }, [
    el('div', { class: 'guide-step-head' }, [
      el('span', { class: 'guide-num', text: String(nr) }),
      el('strong', { text: titel }),
    ]),
    el('ul', { class: 'guide-list' }, zeilen.map((z) => el('li', { class: 'small', text: z }))),
    copy ? copyBlock(copy) : null,
  ]);
}

function installCard() {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('guide.installTitle') }),
    el('ul', { class: 'guide-list' }, [
      el('li', { class: 'small', text: '1) Adresse im Browser öffnen: https://lausiklauskn-png.github.io/bookledgerpro/ (alles klein).' }),
      el('li', { class: 'small', text: '2) Optional als App installieren: Browser-Menü → „Zum Startbildschirm hinzufügen" / „App installieren" (läuft dann offline).' }),
      el('li', { class: 'small', text: '3) Erststart: Passwort festlegen → Shamir-Teile sichern → erstes verschlüsseltes Backup herunterladen. Daten bleiben lokal & verschlüsselt auf deinem Gerät.' }),
      el('li', { class: 'small', text: '4) Wichtig: Backup-Datei und Shamir-Teile getrennt & sicher aufbewahren — sie sind die einzige Wiederherstellung (Zero-Knowledge).' }),
      el('li', { class: 'small', text: '5) Optional KI (EU): Einstellungen → eigene Schlüssel für Google Vision (EU) und Mistral (EU) hinterlegen, „Verbindung testen". Ohne Schlüssel läuft alles on-device.' }),
    ]),
  ]);
}

function schritteCard() {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('guide.stepsTitle') }),
    el('p', { class: 'guide-highlight', text: t('guide.stepsHint') }),

    schritt(1, 'Beleg aus Text erfassen (Belege → Schnellerfassung)', [
      'Menü „Belege" → Feld „Schnellerfassung aus Text".',
      'Beispieltext rechts mit „Kopieren" holen und in das große Textfeld einfügen.',
      '„Analysieren" tippen → Buchungsvorschlag (Konto 4930 Bürobedarf + Vorsteuer + Bank, ~119 €).',
      'Optional „KI-Begründung vorschlagen", dann „Als Entwurf übernehmen".',
    ], 'Rechnung Nr. 2026-99\nBürobedarf Schmidt GmbH\nRechnungsdatum: 14.06.2026\nToner und Druckerpapier\nZwischensumme: 100,00\nzzgl. 19 % MwSt: 19,00\nGesamtbetrag: 119,00 EUR'),

    schritt(2, 'Buchung manuell im Journal', [
      'Menü „Journal" → „Neue Buchung".',
      'Buchungstext eintragen (z. B. den kopierten Text), Soll-Konto „1200 · Bank“, Haben-Konto „8400 · Erlöse 19% USt“.',
      'Betrag (brutto) 119, USt-Satz 19 % → „Als Entwurf speichern".',
      'Tipp: Hinweise (gelb) blockieren nicht — der Entwurf wird trotzdem gespeichert.',
    ], 'Testverkauf Beratung'),

    schritt(3, 'Entwurf bearbeiten · löschen · festschreiben', [
      'In der Journal-Tabelle beim Entwurf: „Bearbeiten" (Felder werden vorbefüllt), „Löschen" oder „Festschreiben".',
      'Festschreiben macht die Buchung unveränderlich (GoBD) — danach nur noch „Stornieren".',
    ]),

    schritt(4, 'Kunde anlegen (Menü „Kunden")', [
      'Name + Adresse eintragen → „Hinzufügen". Der Kunde erscheint in der Liste.',
    ], 'Beispiel Kunde GmbH\nKundenweg 2, 54321 Köln'),

    schritt(5, 'Auftrag mit Position (Menü „Aufträge")', [
      'Titel eingeben, Kunde wählen.',
      'Position: Beschreibung, Menge 10, Einzelpreis 100, USt 19 % → „Auftrag anlegen" (Brutto 1.190,00 €).',
    ], 'Beratung Juni'),

    schritt(6, 'Rechnung erzeugen & drucken', [
      'Im Auftrag „Rechnung → Buchung" (vergibt fortlaufende Nr. + Buchungsentwurf).',
      'Dann „Rechnung anzeigen" → druckbares §14-Dokument → „Drucken / PDF".',
      'Voraussetzung für vollständige Pflichtangaben: Firmenprofil in den Einstellungen ausfüllen.',
    ]),

    schritt(7, 'Auswertungen (Menü „Auswertung")', [
      'USt-Voranmeldung-Kennzahlen, EÜR (vereinfacht + Zufluss/Abfluss §4 Abs.3), USt-Verprobung, GoBD-Audit.',
      'Export: Journal-CSV, „DATEV (EXTF)“, USt-VA, EÜR; „Drucken / PDF".',
    ]),

    schritt(8, 'Mitarbeiter & Zeiterfassung (Menü „Mitarbeiter")', [
      'Mitarbeiter mit Stundenlohn anlegen, dann Zeiten (Dauer in Minuten) erfassen.',
      'Die Mitarbeiterzeile zeigt Summe der Stunden und Kosten (Stunden × Stundenlohn).',
    ]),
  ]);
}

function resetCard() {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('guide.resetTitle') }),
    el('ul', { class: 'guide-list' }, [
      el('li', { class: 'small', text: 'Beispiel-Entwürfe: in der Journal-Tabelle mit „Löschen" entfernen.' }),
      el('li', { class: 'small', text: 'Festgeschriebene Buchungen sind unveränderlich (GoBD) — Korrektur nur per „Stornieren".' }),
      el('li', { class: 'small', text: 'Kompletter Neustart (alles löschen): Recht & Doku → „Alle Daten löschen". Vorher Backup ziehen!' }),
    ]),
  ]);
}
