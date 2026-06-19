// src/ui/views/legal.js — Recht & Dokumentation: GoBD-Verfahrensdokumentation,
// DSGVO-Datenschutz, Betroffenenrechte (Export/Löschen). In-App lesbar.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { exportBackupFile } from '../../core/backup.js';
import { wipeAll } from '../../core/db.js';
import { lockVault } from '../../core/vault.js';
import { siegel } from '../intro.js';
import { getSettings } from '../../state.js';
import { getAiConfig } from '../../ai/aiConfig.js';
import {
  AUTONOMIE_STUFEN, AUTONOMIE_GRENZEN, KLEINUNTERNEHMER_DRITTDATEN,
  aktiveAutonomieStufe, drittdatenHinweisRelevant,
} from '../../domain/aufklaerung.js';

const GOBD = [
  'BookLedgerPro setzt die GoBD-Grundsätze technisch um:',
  '• Unveränderbarkeit: Gebuchte (festgeschriebene) Sätze sind unveränderlich. Korrekturen erfolgen ausschließlich per Storno (Gegenbuchung), nie durch Löschen oder Überschreiben.',
  '• Nachvollziehbarkeit: Jede festgeschriebene Buchung erhält eine lückenlose, fortlaufende Nummer (Nummernkreis) und ist über eine kryptografische Hash-Kette (SHA-256) mit der Vorgängerbuchung verkettet. Manipulationen und Lücken werden bei der Prüfung erkannt (Auswertung → GoBD-Audit).',
  '• Vollständigkeit & Richtigkeit: Buchungen folgen der doppelten Buchführung (Soll = Haben).',
  '• Belegprinzip: Belege werden verschlüsselt archiviert und können mit Buchungen verknüpft werden.',
  '• Aufbewahrung: Daten liegen lokal. Für die gesetzliche Aufbewahrung (i.d.R. 10 Jahre) sind regelmäßige, verschlüsselte Backups zwingend — der Browser-Speicher allein genügt nicht (siehe Durabilitäts-Hinweise).',
  '• Maschinelle Auswertbarkeit: Export als CSV sowie DATEV-orientierte CSV; USt-VA-Kennzahlen werden aufbereitet.',
];

const DSGVO = [
  'Verantwortlich für die Verarbeitung sind Sie als Nutzer/in dieser lokal laufenden Anwendung.',
  '• Datensparsamkeit & lokale Verarbeitung: Alle Daten werden ausschließlich auf Ihrem Gerät gespeichert und mit AES-GCM-256 verschlüsselt (Schlüssel aus Ihrem Passwort, PBKDF2). Es gibt keinen Server, kein Tracking, keine Cookies.',
  '• Personenbezogene Daten (Kunden, Mitarbeiter, Zeiten) werden verschlüsselt gespeichert.',
  '• Externe EU-KI (Google Cloud Vision — EU-Endpoint für Texterkennung; Mistral — EU für Kontierung/Steuer-Assistent) ist standardmäßig deaktiviert und nur mit eigenem API-Schlüssel nutzbar. Eine Übertragung erfolgt ausschließlich nach ausdrücklicher Bestätigung und innerhalb der EU (DSGVO); es werden Datenminimierungs-Grundsätze angewendet (Steuer-Assistent sendet nur aggregierte Kennzahlen).',
  '• Auftragsverarbeitung (Art. 28 DSGVO): Wenn Sie die externe EU-KI aktivieren, verarbeiten die jeweiligen Anbieter (Google für Cloud Vision, Mistral AI) in Ihrem Auftrag Daten. Schließen Sie VOR der produktiven Nutzung mit personenbezogenen Daten den Auftragsverarbeitungsvertrag (AVV/DPA) des jeweiligen Anbieters ab und prüfen Sie dessen Datenschutzbedingungen. Verantwortliche/r im Sinne der DSGVO bleiben Sie; die App ist nur das lokale Werkzeug.',
  '• Technische Maßnahme „Pseudonymisieren" (Art. 32 DSGVO): Im optionalen Datenschutz-Modus (Einstellungen) werden bekannte Identifikatoren aus Ihren Stammdaten (Namen, Firma, IBAN, USt-IdNr., Steuernr., Adresse) vor dem Senden an die KI durch stabile Platzhalter ersetzt und in der Antwort zurückübersetzt. Die Beleg-Texterkennung sendet weiterhin das Bild; Pseudonymisierung wirkt nur auf gesendete Texte.',
  '• Betroffenenrechte: Auskunft/Datenübertragbarkeit über den verschlüsselten Gesamt-Export; Löschung über „Alle Daten löschen".',
];

let _host = null;

export function mountLegal(host) {
  _host = host;
  mount(_host, el('section', { class: 'view legal' }, [
    el('h1', { text: t('legal.title') }),
    siegel(),
    transparenzCard(),
    textCard(t('legal.gobd'), GOBD),
    textCard(t('legal.dsgvo'), DSGVO),
    avvCard(),
    autonomieCard(),
    drittdatenCard(),
    rightsCard(),
  ]));
}

// P3 — KI-Autonomiestufen: alle drei Stufen erklärt, die aktuell eingestellte markiert,
// darunter die feste Grenze (Festschreiben bleibt immer manuell — GoBD).
function autonomieCard() {
  const aktiv = aktiveAutonomieStufe(getSettings());
  const stufen = AUTONOMIE_STUFEN.map((s) => {
    const istAktiv = s.id === aktiv.id;
    return el('div', { class: 'legal-stufe' + (istAktiv ? ' legal-stufe-aktiv' : '') }, [
      el('h3', { class: 'small' }, [
        el('span', { text: s.titel }),
        istAktiv ? el('span', { class: 'badge badge-ok', text: ' ' + t('legal.autonomieAktiv') }) : null,
      ]),
      el('p', { class: 'muted small', text: s.kurz }),
      el('ul', { class: 'legal-liste small' }, s.punkte.map((p) => el('li', { text: p }))),
    ]);
  });
  return el('div', { class: 'card legal-card' }, [
    el('h2', { class: 'card-title', text: t('legal.autonomie') }),
    el('p', { class: 'small', text: t('legal.autonomieHint') }),
    ...stufen,
    el('h3', { class: 'small', text: t('legal.autonomieGrenzen') }),
    el('ul', { class: 'legal-liste small' }, AUTONOMIE_GRENZEN.map((g) => el('li', { text: g }))),
  ]);
}

// P4 — Kleinunternehmer & Drittdaten: § 19 UStG befreit nur von der USt, nicht von
// DSGVO/Aufbewahrung. Ist externe EU-KI konfiguriert, wird der AVV-Hinweis betont.
function drittdatenCard() {
  const betonung = el('p', { class: 'small note', hidden: true });
  getAiConfig().then((cfg) => {
    if (drittdatenHinweisRelevant(cfg)) {
      betonung.textContent = t('legal.drittdatenAiAktiv');
      betonung.hidden = false;
    }
  }).catch(() => {});
  return el('div', { class: 'card legal-card' }, [
    el('h2', { class: 'card-title', text: t('legal.drittdaten') }),
    el('p', { class: 'small', text: KLEINUNTERNEHMER_DRITTDATEN.einleitung }),
    betonung,
    el('ul', { class: 'legal-liste small' },
      KLEINUNTERNEHMER_DRITTDATEN.punkte.map((p) => el('li', { text: p }))),
  ]);
}

// Transparenz- & Zwischenstandsbericht — verlinkt die STETS AKTUELLE Datei
// docs/TRANSPARENZ_ZWISCHENSTAND.html (eine Quelle der Wahrheit): wird die HTML aktualisiert,
// zeigt die App beim nächsten Öffnen automatisch den neuen Stand. Öffnet in eigenem Tab; die
// Datei trägt einen „Als PDF speichern"-Knopf. Pfad ist relativ zur index.html (Routing ändert
// die URL nicht), funktioniert lokal wie auf GitHub Pages.
function transparenzCard() {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('legal.transparenzTitle') }),
    el('p', { class: 'small', text: t('legal.transparenzHint') }),
    el('div', { class: 'btn-row' }, [
      el('a', {
        class: 'btn btn-sm', href: 'docs/TRANSPARENZ_ZWISCHENSTAND.html',
        target: '_blank', rel: 'noopener noreferrer', text: t('legal.transparenzOpen'),
      }),
    ]),
  ]);
}

// AVV/DPA-Verträge der EU-KI-Anbieter — direkt zum Abschließen verlinkt (Entscheidung: umsetzen).
function avvCard() {
  const link = (href, text) => el('a', { class: 'btn btn-sm', href, target: '_blank', rel: 'noopener noreferrer', text });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('legal.avvTitle') }),
    el('p', { class: 'small', text: t('legal.avvHint') }),
    el('div', { class: 'btn-row' }, [
      link('https://cloud.google.com/terms/data-processing-addendum', t('legal.avvGoogle')),
      link('https://mistral.ai/terms/#data-processing-agreement', t('legal.avvMistral')),
    ]),
  ]);
}

function textCard(title, absaetze) {
  return el('div', { class: 'card legal-card' }, [
    el('h2', { class: 'card-title', text: title }),
    ...absaetze.map((p) => el('p', { class: 'small', text: p })),
  ]);
}

function rightsCard() {
  const status = el('p', { class: 'muted small' });
  const exportBtn = el('button', {
    class: 'btn', text: t('legal.export'),
    onClick: async () => {
      const pwd = prompt(t('lock.password'));
      if (!pwd) return;
      try { await exportBackupFile(pwd); status.textContent = t('onboard.backupDone'); }
      catch (e) { status.textContent = String(e.message || e); }
    },
  });
  const deleteBtn = el('button', {
    class: 'btn btn-danger', text: t('legal.delete'),
    onClick: async () => {
      if (!confirm(t('legal.confirmDelete'))) return;
      if (!confirm(t('legal.confirmDelete'))) return; // bewusst doppelt
      await wipeAll();
      lockVault();
      location.reload();
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('legal.rights') }),
    el('p', { class: 'muted small', text: t('legal.rightsHint') }),
    el('div', { class: 'btn-row' }, [exportBtn, deleteBtn]),
    status,
  ]);
}
