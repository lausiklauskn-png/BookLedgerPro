// src/state.js
// Zentraler App-Zustand + Settings. Settings werden verschlüsselt im Tresor
// gespeichert (vault.saveSettings/loadSettings). Einfaches Pub/Sub.

import { saveSettings, loadSettings } from './core/vault.js';
import { datenschutzNachziehen } from './domain/datenschutzStandard.js';
import { modusNachziehen } from './domain/nutzungsmodus.js';

export const AI_LEVELS = ['suggest', 'draft', 'auto'];
export const DATENSCHUTZ_MODI = ['aus', 'pseudonym']; // KI-Datensparsamkeit

const DEFAULTS = Object.freeze({
  // Modus (Klaus 2026-10-26): privat | kleinunternehmer | selbststaendig | berater — ersetzt Einfach/Profi/Berater
  // und Firma/Privat/Verein. Alte Werte zieht domain/nutzungsmodus.modusNachziehen beim Laden nach (Daten bleiben).
  nutzungsmodus: 'selbststaendig',
  alleEinstellungen: false, // F3: zeigt auch die im Modus ausgeblendeten Einstellungen
  theme: 'system',      // system / light / dark (Helligkeit)
  themeFarbe: 'blau',   // blau / graphit / petrol (Farbe) — Start wie Private Brain Pro
  lang: 'de',
  aiAutonomy: 'suggest', // suggest / draft / auto
  taxProfile: 'DE',     // Deutschland zuerst
  kleinunternehmer: false, // §19 UStG — unterdrückt USt-Hinweise
  gewinnermittlung: 'euer', // euer (§4 Abs.3) | bilanz (§4 Abs.1/§5 EStG) — Default EÜR (Bestand unverändert)
  workflohZiel: 'mein-workfloh', // Rundlauf (Klaus 2026-10-26): angenommene Angebote gehen als Auftrag an diesen WorkFloh (domain/vorgang.js)
  rechnungsstelle: 'blp', // blp | extern — Nummernkreis-Hoheit (§14): BLP vergibt echte Nummern (blp) vs. externes Programm/Steuerberater (extern → BLP nur Vorlage). Default blp (Bestand unverändert), Katalog §7a
  datenschutzModus: 'pseudonym', // aus | pseudonym — ersetzt bekannte Identifikatoren vor KI-Versand. Ab Werk AN seit 2026-10-14 (Klaus); vorher 'aus'
  datenschutzGewaehlt: false, // true, sobald der Nutzer den Schalter selbst bedient hat (domain/datenschutzStandard.js)
  kiWeitereNamen: [], // von Hand: wird vor dem KI-Versand immer verdeckt (ai/anker.handAnker)
  kiNieVerdecken: [], // von Hand: bleibt wörtlich stehen, schirmt Namen darin ab (z. B. „Müller-Thurgau")
  nerPii: true, // im Pseudonym-Modus zusätzlich erkannte PII Dritter (E-Mail/IBAN/USt-IdNr/Tel.) maskieren
  namensmuster: true, // im Pseudonym-Modus Namen nach Muster verdecken (Anrede, z. Hd., Vor-+Nachname, Firma); Rücknahme über kiNieVerdecken (Klaus 2026-10-26)
  mikroSprachen: {}, // Sprache fürs Einsprechen je Feld (feldSchluessel → 'de-DE'), Klaus 2026-10-26: sichtbare Marke, je Feld gemerkt
  mikroStandardSprache: 'auto', // Vorgabe für Felder ohne eigene Wahl: 'auto' = App-Sprache oder ein Code aus ui/mikro.js SPRACHEN
  wortSpeicherAn: true, // Wort-Speicher (Vervollständigung aus früheren Eingaben), löschbar in den Einstellungen
  wortSpeicher: {}, // feldSchluessel → [Einträge] (verschlüsselt im Tresor, nie an eine KI)
  bedeutungssuche: 'aus', // Suche nach Bedeutung über Belege: 'an' lädt das e5-Modell (einmalig, 118 MB) und ordnet Belege mit Text ein (Klaus 2026-10-26, A1)
  belegsucheWeit: true, // Wortsuche auch in Buchungen, Kunden, Aufträgen (A2)
  angeboteAlt: false, // alte BLP-Angebote im Menü zeigen (Workflow Calculate ersetzt sie, Klaus 2026-10-26)
  backupStrategie: 'download', // download | ordner — Ziel der Datensicherung (Ordner braucht File System Access; sonst Download-Fallback)
  zahlungszielTage: 14,    // Standard-Zahlungsziel für Fälligkeit/Mahnwesen
  liquiditaetHorizontTage: 7, // Zeitfenster (Tage) der Dashboard-Liquiditätsvorschau (7|14|30|90, domain/liquiditaet.js); umschaltbar in der Liquiditäts-Karte
  liquiditaetReserveCent: 0, // gewünschte Mindestreserve/Liquiditätspuffer (Cent); 0 = keine — die Deckungslücke warnt schon, wenn der laufende Saldo unter diesen Puffer rutscht (domain/liquiditaet.js deckungsluecke)
  vaZeitraum: 'vierteljaehrlich', // USt-Voranmeldungszeitraum: monatlich/vierteljaehrlich/jaehrlich
  wirtschaftsjahrBeginn: '01-01', // MM-TT; 01-01 = Kalenderjahr (abweichendes WJ möglich)
  verzugBasiszinsProzent: 3.37, // Basiszinssatz §247 BGB — REGELMÄSSIG AKTUALISIEREN
  firma: { name: '', anschrift: '', steuernummer: '', ustId: '', iban: '' }, // Aussteller-Stammdaten (Rechnung §14)
  datev: { beraterNr: '', mandantNr: '', sachkontenlaenge: 4 }, // für DATEV-EXTF-Header (Berater/Mandant)
  partnerAppUrl: '', // verbundene App (z.B. Mein-WorkFloh) — reziproke Verlinkung
  baukastenNutzungsprofil: {}, // { schemaId: {anzahl, zuletzt} } — adaptiver Angebots-Baukasten (Katalog §3): häufig genutzte Leistungsarten rutschen nach oben. Gerätelokal (verschlüsselt im Tresor), reines IDs/Zähler-Profil (keine Marge), domain/baukasten.js
  kalibrierungAnwenden: false, // beim Anlegen einer Angebotsposition die Korrekturfaktoren aus der eigenen Historie (Vor→Nachkalkulation, domain/kalibrierung.js faktorWerte) auf die interne Kalkulation anwenden (kalkuliereKalibriert). Default aus; nur wirksam, wenn Historie vorliegt. Rein intern (Prime Directive), Katalog §5.1
});

const _state = { settings: { ...DEFAULTS }, route: 'dashboard' };
const _subs = new Set();

export function getSettings() { return { ..._state.settings }; }
export function getRoute() { return _state.route; }

export function subscribe(fn) { _subs.add(fn); return () => _subs.delete(fn); }
function emit() { for (const fn of _subs) fn(_state); }

/** Lädt Settings aus dem Tresor (nach Unlock). */
export async function hydrateSettings() {
  const loaded = await loadSettings();
  _state.settings = { ...DEFAULTS, ...modusNachziehen(datenschutzNachziehen(loaded || {})) };
  emit();
  return getSettings();
}

/** Aktualisiert Settings (teilweise), persistiert verschlüsselt, benachrichtigt.
 *  `opts.still`: speichern, ohne die Oberfläche neu zu zeichnen — für Eingabefelder, deren
 *  Wert sonst nichts auf der Seite ändert (Neuzeichnen nähme dem nächsten Feld Fokus und
 *  Getipptes, gemessen in tests/smoke_handnamen.mjs). */
export async function updateSettings(patch, opts = {}) {
  _state.settings = { ...DEFAULTS, ..._state.settings, ...patch };
  await saveSettings(_state.settings);
  if (opts.still !== true) emit();
  return getSettings();
}

export function navigate(route) { _state.route = route; emit(); }
