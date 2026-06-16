// src/ui/views/legal.js — Recht & Dokumentation: GoBD-Verfahrensdokumentation,
// DSGVO-Datenschutz, Betroffenenrechte (Export/Löschen). In-App lesbar.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { exportBackupFile } from '../../core/backup.js';
import { wipeAll } from '../../core/db.js';
import { lockVault } from '../../core/vault.js';
import { siegel } from '../intro.js';

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
    textCard(t('legal.gobd'), GOBD),
    textCard(t('legal.dsgvo'), DSGVO),
    rightsCard(),
  ]));
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
