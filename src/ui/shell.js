// src/ui/shell.js
// App-Shell: Kopf (Marke + Identitäts-/Mandant-Indikator), Durabilitäts-Banner,
// Navigation, Inhaltsbereich. Phase 0 zeigt Übersicht + Einstellungen; die
// Buchhaltungs-Ansichten folgen in den nächsten Phasen.

import { el, mount, clear } from './dom.js';
import { t, setLang, LANGS, istProApp } from './i18n.js';
import { kopfTitelBeobachten } from './kopfTitel.js';
import { applyTheme, FARBEN, HELLIGKEITEN, applySchrift, gemerkteSchrift, SCHRIFT_MIN, SCHRIFT_MAX, SCHRIFT_SCHRITT } from './theme.js';
import { icon, ladeSymbole } from './icons.js';
import { strichBeobachten } from './strich.js';
import { schlankBeobachten } from './schlank.js';
import { MycelMark, SiegelBadge, SiegelWappenGross } from './mycel.js';
import { identityExists, loadIdentity } from '../sbkim/identity.js';
import { CANONICAL_NODE_ID, SEAL_STAGE, NODE_PROFILE } from '../sbkim/nodeProfile.js';
import { checkAllPeers } from '../sbkim/peers.js';
import { getSettings, updateSettings, navigate, getRoute, subscribe, AI_LEVELS } from '../state.js';
import { WORKFLOH_ZIELE, zielKey } from '../domain/vorgang.js';
import { getMandantId, lockVault, changePassword } from '../core/vault.js';
import { ladeRegistry, speichereRegistry } from '../core/mandantenStore.js';
import { aktiverMandant, mandantenAuswahlListe, umbenenneMandant, entferneMandant, validateMandantName, istSandbox, sandboxAuswahlListe, naechsterTestName } from '../domain/mandanten.js';
import { erstelleSandboxTresor, wechsleZuSandbox, leereSandboxTresor, loescheSandboxTresor, loescheAlleSandboxes, behalteUndVerlasseSandbox } from '../core/sandboxStore.js';
import { durabilityStatus } from '../core/durability.js';
import { parseUebernahmeParam, merkeUebernahme, merkeUebernahmeFehler } from '../domain/uebernahmeExtern.js';

// Übergabe von Tomy-WorkFloh (?uebernahme=…, docs/UEBERNAHME_TOMY.md): einmal beim Laden
// einfangen, URL sofort säubern, Route auf Angebote stellen. Vorbefüllt wird NUR das
// Formular im Angebote-View — kein Auto-Speichern, GoBD-Pfade unberührt.
(function captureUebernahme() {
  try {
    const u = parseUebernahmeParam(location.search);
    if (!u) {
      /* Nicht mehr stumm: kam eine Übergabe mit, wurde sie aber nicht verstanden
       * (unbekannter Absender, veraltetes Format, Müll), dann sagt BLP das —
       * statt ganz normal und leer zu öffnen. Genau dieses Schweigen hat den
       * falschen Absender-Namen von Mein-WorkFloh monatelang verdeckt. */
      if (/[?&]uebernahme=/.test(location.search)) {
        merkeUebernahmeFehler();
        history.replaceState(null, '', location.pathname + location.hash);
        navigate('angebote');
      }
      return;
    }
    merkeUebernahme(u);
    history.replaceState(null, '', location.pathname + location.hash);
    // Shop-Summen → eigene Ansicht; WorkFloh-Auftrag → Angebote.
    navigate(u.art === 'buchhaltung-summen' ? 'shopbuchung' : 'angebote');
  } catch { /* fail-soft: App startet normal */ }
})();
import { geteiltParam, ohneGeteilt } from '../domain/workflowPdf.js';
import { merkeGeteilt, merkeGeteilteDateien } from './views/documents.js';

// Aus Androids Teilen-Liste (Klaus 2026-10-26, Schritt 2 V1): sw.js hat die Dateien abgelegt und auf
// ./?geteilt=1 geleitet. Der Parameter wird einmal gemerkt und sofort geputzt (⟳ liest nicht doppelt ein);
// die Belegseite holt die Dateien ab. „Öffnen mit" (file_handlers) kommt über launchQueue.
(function captureGeteilt() {
  try {
    const g = geteiltParam(location.search);
    if (g === null) return;
    merkeGeteilt(g);
    history.replaceState(null, '', ohneGeteilt(location.pathname, location.search, location.hash));
    navigate('documents');
  } catch { /* fail-soft */ }
  try {
    if ('launchQueue' in window && window.launchQueue && typeof window.launchQueue.setConsumer === 'function') {
      window.launchQueue.setConsumer(async (p) => {
        if (!p || !p.files || !p.files.length) return;
        const fs = [];
        for (const h of p.files) { try { fs.push(await h.getFile()); } catch { /* eine Datei nicht lesbar */ } }
        if (!fs.length) return;
        merkeGeteilteDateien(fs);
        navigate('documents');
      });
    }
  } catch { /* kein launchQueue */ }
})();
import { backupJetzt, restoreWaehlen, backupEinstellungen, onDatensicherungAktion } from './datensicherung.js';
import { mountAccounts } from './views/accounts.js';
import { mountAnlagen } from './views/anlagen.js';
import { mountKassenbuch } from './views/kassenbuch.js';
import { mountJournal } from './views/journal.js';
import { mountReports } from './views/reports.js';
import { mountBerichte } from './views/berichte.js';
import { mountSelbsttest } from './views/selbsttest.js';
import { getBuchungssperre, setBuchungssperre, ensureSeedKonten } from '../domain/store.js';
import { GEWINNERMITTLUNG, normalizeGewinnermittlung, BILANZ_GRUNDKONTO_NUMMERN } from '../domain/bilanzierung.js';
import { NUTZUNGSMODUS, NUTZUNGSMODUS_LISTE, nutzungsmodusVon, zeigeAnsicht, zeigeEinstellung, hatAusgeblendeteEinstellungen, moduswechsel, EINSTELLUNG, istPrivatmodus, zeigeFeature, FEATURE } from '../domain/nutzungsmodus.js';
import { RECHNUNGSSTELLE, normalizeRechnungsstelle, rechnungsstelleWechselHinweis } from '../domain/rechnungsstelle.js';
import { vergebeneRechnungsnummern } from '../domain/crm-store.js';
import { mountDocuments } from './views/documents.js';
import { mountPayables } from './views/payables.js';
import { mountCustomers } from './views/customers.js';
import { mountOrders } from './views/orders.js';
import { mountAngebote } from './views/angebote.js';
import { mountApp } from './views/apps.js';
import { mountShopbuchung } from './views/shopbuchung.js';
import { mountNachkalkulation } from './views/nachkalkulation.js';
import { mountLohn } from './views/lohn.js';
import { mountEmployees } from './views/employees.js';
import { mountLegal } from './views/legal.js';
import { mountNetwork } from './views/network.js';
import { mountSbkimSuche } from './views/sbkimsuche.js';
import { mountTresorordner, tresorordnerVerfuegbar, neuImTresorordner } from './views/tresorordner.js';
import { mikrofonBeobachten, SPRACHEN as MIKRO_SPRACHEN, wortSpeicherZahl } from './mikro.js';
import { mountSafebox } from './views/safebox.js';
import { mountDashboard } from './views/dashboard.js';
import { wirtschaftsjahrVon } from '../domain/geschaeftsjahr.js';
import { mountAnleitung } from './views/anleitung.js';
import { schluesselAbgleichSection } from './schluesselabgleich.js';
import { aboutContent } from './intro.js';
import { getAiConfig, saveAiConfig, MISTRAL_MODELS } from '../ai/aiConfig.js';
import { testVision } from '../ai/vision.js';
import { testMistral } from '../ai/mistral.js';
import { KI_MODI, erlaubteAnbieter, normalizeAnbieterWahl } from '../ai/anbieter.js';

// Navigation: Schlüssel · Beschriftung · Strichsymbol (assets/pb-icons.svg + assets/blp-icons.svg).
const NAV = [
  ['dashboard', 'nav.dashboard', 'blp-uebersicht'],
  ['journal', 'nav.journal', 'blp-journal'],
  ['kassenbuch', 'nav.kassenbuch', 'blp-kasse'],
  ['accounts', 'nav.accounts', 'blp-konto'],
  ['anlagen', 'nav.anlagen', 'blp-anlagen'],
  ['documents', 'nav.documents', 'blp-beleg'],
  ['payables', 'nav.payables', 'blp-verbindlichkeit'],
  ['orders', 'nav.orders', 'blp-auftrag'],
  ['calculate', 'nav.calculate', 'img:./apps/calculate/icons/icon-192.png'],   // Workflow Calculate 1:1 (Klaus 2026-10-26), ersetzt BLPs Angebote
  ['needs', 'nav.needs', 'img:./apps/needs/icons/icon-192.png'],               // Workflow Needs 1:1
  ['angebote', 'nav.angebote', 'blp-angebot'],   // alte BLP-Angebote: nur sichtbar mit settings.angeboteAlt (nutzungsmodus.zeigeAnsicht)
  ['shopbuchung', 'nav.shopbuchung', 'blp-shop'],
  ['nachkalkulation', 'nav.nachkalkulation', 'blp-waage'],
  ['customers', 'nav.customers', 'blp-kunde'],
  ['employees', 'nav.employees', 'blp-team'],
  ['lohn', 'nav.lohn', 'blp-lohn'],
  ['reports', 'nav.reports', 'blp-chart'],
  ['berichte', 'nav.berichte', 'blp-bericht'],
  ['network', 'nav.network', 'blp-mycel'],
  ['sbkimsuche', 'nav.sbkimsuche', 'pb-search'],
  ['safebox', 'nav.safebox', 'blp-safe'],
  ['tresorordner', 'nav.tresorordner', 'blp-tresorordner'],   // gemeinsamer Tresorordner — nur in der Android-App (window.BLPNative.tresor)
  ['legal', 'nav.legal', 'blp-paragraf'],
  ['anleitung', 'nav.anleitung', 'blp-hilfe'],
  ['selbsttest', 'nav.selbsttest', 'blp-pruef'],
  ['about', 'nav.about', 'pb-info'],
  ['settings', 'nav.settings', 'pb-settings'],
];

// Gruppen der Seitenleiste (Klaus 2026-10-26, Sammlung C1): Übersicht oben allein, Einstellungen unten
// allein, dazwischen sechs Gruppen. Jede NAV-Ansicht steht in genau einer Gruppe (tests/run.mjs prüft das).
// Eine Gruppe, deren Ansichten der Modus alle ausblendet, verschwindet mitsamt Überschrift.
export const NAV_GRUPPEN = [
  [null, ['dashboard']],
  ['nav.gruppe.buchen', ['documents', 'journal', 'kassenbuch', 'accounts', 'anlagen', 'payables']],
  ['nav.gruppe.verkauf', ['calculate', 'needs', 'orders', 'customers', 'shopbuchung', 'nachkalkulation']],
  ['nav.gruppe.team', ['employees', 'lohn']],
  ['nav.gruppe.auswerten', ['reports', 'berichte']],
  ['nav.gruppe.netz', ['network', 'sbkimsuche']],
  ['nav.gruppe.weiteres', ['angebote', 'safebox', 'tresorordner', 'legal', 'anleitung', 'selbsttest', 'about']],
  [null, ['settings']],
];
export const NAV_KEYS = NAV.map(([k]) => k);

// Zustand der Seitenleiste (A3): 'auf' | 'zu' von Hand (localStorage NAV_KEY) oder automatisch — im Teilbild
// (bis 1024 px) eingeklappt, darüber aufgeklappt. Am Handy (bis 640 px) gilt die ☰-Schublade, nicht dieser Zustand.
const NAV_KEY = 'blpr_leiste';
const TEILBILD = '(max-width: 1024px)';
function leisteGewuenscht() { try { return localStorage.getItem(NAV_KEY) || ''; } catch { return ''; } }
export function leisteEingeklappt(gewuenscht, teilbild) {
  if (gewuenscht === 'auf') return false;
  if (gewuenscht === 'zu') return true;
  return !!teilbild;
}
let _teilbildMql = null;

let _container = null;
let _onLock = () => {};
// Aktiver Mandant für den Header (Name + Gesamtzahl) — aus der unverschlüsselten
// Registry-kv-DB nachgeladen (vor dem Entsperren lesbar; getrennt von den Tresoren).
let _mandant = { id: null, name: null, count: 0, sandbox: false };

export function renderShell(container, { onLock } = {}) {
  // 🎙 an jeder Texteingabe (Klaus 2026-10-26): einmal anmelden, folgt jedem Neuzeichnen.
  try { mikrofonBeobachten(container); } catch { /* ohne MutationObserver: Felder bleiben tippbar */ }
  // Strichgrafiken statt Emojis in ALLEN Ansichten, Dialogen und Hinweisen (Pro-Umbau 4, Leitfaden § 5): einmal am <body>.
  try { strichBeobachten(document.body); schlankBeobachten(document.body); } catch { /* ohne Beobachter bleibt der Text */ }
  try { kopfTitelBeobachten(document.body); } catch { /* ohne Beobachter bleibt die Überschrift im Inhalt */ }
  _container = container;
  _onLock = onLock || (() => {});
  ladeSymbole();
  if (!_teilbildMql && window.matchMedia) {
    _teilbildMql = window.matchMedia(TEILBILD);
    // Fensterbreite wechselt (Teilbild ↔ Vollbild): Leiste nach Regel neu stellen, nur wenn nicht von Hand gesetzt.
    _teilbildMql.onchange = () => { if (!leisteGewuenscht()) paint(); };
  }
  subscribe(() => paint());
  paint();
  refreshDurability();
  refreshMandant();
}

// Lädt den aktiven Mandanten-Namen + die Mandantenzahl nach und zeichnet den Header neu.
// (DOM/IndexedDB-Pfad — statisch geprüft; die reine Registry-Logik ist node-getestet.)
async function refreshMandant() {
  try {
    const registry = await ladeRegistry();
    const akt = aktiverMandant(registry);
    _mandant = { id: akt?.id || null, name: akt?.name || null, count: registry.mandanten.length, sandbox: istSandbox(akt) };
  } catch { _mandant = { id: null, name: null, count: 0, sandbox: false }; }
  paint();
}

function paint() {
  const s = getSettings();
  const zu = leisteEingeklappt(leisteGewuenscht(), _teilbildMql ? _teilbildMql.matches : false);
  const frame = el('div', { class: 'app' + (zu ? ' nav-zu' : ''), 'data-modus': nutzungsmodusVon(s) }, [
    el('a', { class: 'skip-link', href: '#content' }, t('a11y.skip')),
    header(s),
    // Dauerhafter TEST-MODUS-Banner, solange ein Sandbox-/Test-Tresor aktiv ist (Spec).
    _mandant.sandbox ? testModusBanner() : null,
    el('div', { class: 'durability-slot', id: 'durability-slot' }),
    el('div', { class: 'app-body' }, [
      // Schublade am Handy: Tipp auf den Hintergrund schließt sie.
      el('div', { class: 'nav-hintergrund', onClick: schubladeSchliessen }),
      nav(zu),
      el('main', { class: 'content', id: 'content', role: 'main', tabindex: '-1' }),
    ]),
  ]);
  mount(_container, frame);
  renderRoute();
  refreshDurability();
}

function header(s) {
  // Mandanten-Pille (Klaus 2026-10-26: „LCxGYb7e — damit kann ich nichts anfangen"): nur, wenn es mehr als
  // einen Mandanten gibt und ein lesbarer Name da ist — dann sagt sie, welcher offen ist. Die interne
  // Tresor-Kennung erscheint hier nicht mehr; die DB-ID steht weiterhin auf der Übersicht (GoBD-Karte).
  const label = (_mandant.count > 1 && _mandant.name) ? _mandant.name : null;
  return el('header', { class: 'app-header' }, [
    // Hamburger nur im Handyformat sichtbar (CSS) — klappt die Navigation als Schublade auf.
    el('button', {
      class: 'nav-toggle', 'aria-label': t('a11y.menu'), 'aria-expanded': 'false', title: t('a11y.menu'),
      onClick: (e) => {
        const app = document.querySelector('.app');
        if (!app) return;
        const open = app.classList.toggle('nav-open');
        e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
      },
    }, [icon('pb-menu')]),
    el('div', { class: 'brand' }, [MycelMark(28), el('span', { class: 'brand-name', text: t('app.name') }),
      // Seitentitel klein im Kopf (kopfTitel.js) statt groß über dem Inhalt.
      el('span', { class: 'kopf-titel', 'data-kopf-titel': '', hidden: true })]),
    // Installieren OBEN in der Kopfleiste (Klaus 2026-10-18: „in den Einstellungen vermutet keiner,
    // dass er die App installieren kann"). Immer da, solange die App nicht installiert ist — nicht nur,
    // wenn Chrome es anbietet. Der Tipp geht an den Knopf von assets/installieren.js (byte-1:1 aus Sage,
    // verborgen in #install-quelle): EINE Klick-Logik für Kopf- und Einstellungen-Knopf.
    // Neben dem Namen, nicht in .header-right: am Handy steht er so in der ersten Zeile, wo Platz ist.
    installKopfKnopf(),
    el('div', { class: 'header-right' }, [
      flyingWidget(),
      label ? el('span', { class: 'mandant', title: t('mandant.label') }, [
        icon('blp-mandant'),
        el('span', { class: 'mandant-id', text: t('mandant.label') + ': ' + label }),
      ]) : null,
      // „Mandant wechseln" nur, wenn es mehr als einen Mandanten gibt (sonst wäre der
      // Wechsel ein reines Sperren auf denselben Tresor).
      (_mandant.count > 1 && zeigeFeature(s, FEATURE.MANDANTEN)) ? el('button', {
        class: 'btn btn-ghost btn-sm', text: t('mandant.switch'),
        onClick: mandantWechseln,
      }) : null,
      // Dezenter Aktualisieren-Knopf: leert SW-Registrierungen + Cache-Storage und lädt neu
      // (Hard-Reload-Ersatz für Klaus' Tablet, wo Service-Worker + HTTP-Cache hartnäckig sind).
      geschaeftsjahrKopf(s),
      // Thema (Klaus 2026-10-26): Palette-Knopf in der Kopfleiste, dieselbe Wahl wie in den Einstellungen.
      el('button', {
        class: 'btn btn-ghost btn-sm btn-icon thema-knopf', title: t('app.themeTitle'), 'aria-label': t('app.themeTitle'),
        'data-thema-knopf': '', onClick: (e) => themaPopover(e.currentTarget, s),
      }, [icon('blp-palette')]),
      // Schriftgröße (Klaus 2026-10-29): „ein kleines A, Punkt, Punkt, ein großes A … da weiß man, da kann die Schrift vergrößert werden“.
      el('button', {
        class: 'btn btn-ghost btn-sm schrift-knopf', type: 'button', title: t('app.schriftTitel'), 'aria-label': t('app.schriftTitel'),
        'data-schrift-knopf': '', 'aria-haspopup': 'dialog', onClick: (e) => schriftPopover(e.currentTarget),
      }, [el('span', { class: 'schrift-a klein', 'aria-hidden': 'true', text: 'A' }), el('span', { class: 'schrift-punkte', 'aria-hidden': 'true', text: '··' }), el('span', { class: 'schrift-a gross', 'aria-hidden': 'true', text: 'A' })]),
      el('button', {
        class: 'btn btn-ghost btn-sm btn-icon',
        title: t('app.reloadTitle'), 'aria-label': t('app.reload'),
        onClick: hardReloadApp,
      }, [icon('pb-refresh')]),
      el('button', {
        class: 'btn btn-ghost btn-sm sperren-knopf', title: t('settings.lock'), 'aria-label': t('settings.lock'),
        onClick: sperren,
      }, [icon('pb-lock'), el('span', { class: 'ic-text', text: t('settings.lock') })]),
    ]),
  ]);
}

// „Geschäftsjahr“ in der Kopfleiste (Leitfaden § 4, Klaus 2026-10-28: Kopfzeile trägt Kontext, die Startseite keinen Gruß).
// Abweichendes Wirtschaftsjahr: „2026/27“. Am Handy nur die Zahl (CSS blendet das Wort aus, der Titel nennt es).
function geschaeftsjahrKopf(s) {
  const wj = s.wirtschaftsjahrBeginn || '01-01';
  const jahr = wirtschaftsjahrVon(new Date().toISOString().slice(0, 10), wj);
  const text = wj === '01-01' ? String(jahr) : `${jahr}/${String(jahr + 1).slice(2)}`;
  const voll = t('app.geschaeftsjahr').replace('{jahr}', text);
  return el('span', { class: 'gj-kopf', 'data-geschaeftsjahr': '', title: t('app.geschaeftsjahrTitel').replace('{jahr}', text), 'aria-label': voll }, [
    el('span', { class: 'gj-wort', text: voll.replace(text, '').trim() + ' ' }), el('span', { class: 'gj-zahl', text }),
  ]);
}

// ── Thema: Farbe × Helligkeit ───────────────────────────────────────────────
// Reine Anzeige der Wahl; speichern tut themaWaehlen (Tresor + localStorage über applyTheme).
async function themaWaehlen(patch) {
  const s = { ...getSettings(), ...patch };
  applyTheme(s.theme, s.themeFarbe);
  await updateSettings(patch);
}
function themaWahl(s, { kompakt } = {}) {
  const seg = (label, key, options, current) => el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: label }),
    el('div', { class: 'segmented', role: 'group', 'aria-label': label },
      options.map(([val, lab, ic]) => el('button', {
        class: 'seg' + (current === val ? ' active' : ''), 'aria-pressed': current === val ? 'true' : 'false',
        'data-thema': key + '=' + val, onClick: () => themaWaehlen({ [key]: val }),
      }, [ic ? icon(ic) : null, el('span', { class: 'ic-text', text: lab })]))),
  ]);
  const hellIcon = { system: 'blp-geraet', light: 'blp-sonne', dark: 'blp-mond' };
  return el('div', { class: 'thema-wahl' + (kompakt ? ' kompakt' : '') }, [
    seg(t('settings.farbe'), 'themeFarbe', FARBEN.map((f) => [f, t('settings.farbe.' + f), null]), s.themeFarbe || 'blau'),
    seg(t('settings.helligkeit'), 'theme', HELLIGKEITEN.map((h) => [h, t('settings.theme.' + h), hellIcon[h]]), s.theme || 'system'),
    kompakt ? null : el('p', { class: 'muted small', text: t('settings.theme.hint') }),
  ]);
}
function themaPopover(anker, s) {
  const alt = document.querySelector('.thema-popover');
  if (alt) { alt.remove(); return; }
  const pop = el('div', { class: 'thema-popover', role: 'dialog', 'aria-label': t('app.themeTitle') }, [themaWahl(s, { kompakt: true })]);
  // Die Wahl im Popover soll sofort sichtbar sein: nach jedem Tipp neu zeichnen, Popover offen lassen.
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-thema]');
    if (!b) return;
    setTimeout(() => { const neu = themaWahl(getSettings(), { kompakt: true }); pop.replaceChildren(neu); }, 0);
  });
  const schliessen = (e) => {
    if (e && (pop.contains(e.target) || anker.contains(e.target))) return;
    pop.remove(); document.removeEventListener('click', schliessen, true); document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') schliessen(); };
  document.addEventListener('click', schliessen, true);
  document.addEventListener('keydown', onKey);
  anker.insertAdjacentElement('afterend', pop);
}

// Der Schieberegler für die Schriftgröße, oben unter dem Kopf (wie die Farbwahl). Wirkt sofort; gemerkt beim Loslassen.
function schriftPopover(anker) {
  const alt = document.querySelector('.schrift-popover');
  if (alt) { alt.remove(); return; }
  const jetzt = gemerkteSchrift();
  const wert = el('span', { class: 'schrift-wert', 'data-schrift-wert': '', text: jetzt + ' %' });
  const regler = el('input', { type: 'range', min: String(SCHRIFT_MIN), max: String(SCHRIFT_MAX), step: String(SCHRIFT_SCHRITT), value: String(jetzt),
    'data-schrift-regler': '', 'aria-label': t('app.schriftTitel'), 'aria-valuetext': jetzt + ' %' });
  const setzen = (v, merken) => { const p = applySchrift(v); regler.value = String(p); regler.setAttribute('aria-valuetext', p + ' %'); wert.textContent = p + ' %'; if (merken) updateSettings({ schrift: p }, { still: true }).catch(() => {}); };
  regler.addEventListener('input', () => setzen(regler.value, false));
  regler.addEventListener('change', () => setzen(regler.value, true));
  const normal = el('button', { class: 'btn btn-sm', type: 'button', 'data-schrift-normal': '', text: t('app.schriftNormal'), onClick: () => setzen(100, true) });
  const pop = el('div', { class: 'thema-popover schrift-popover', role: 'dialog', 'aria-label': t('app.schriftTitel') }, [
    el('div', { class: 'setting-label', text: t('app.schriftTitel') }),
    el('div', { class: 'schrift-zeile' }, [el('span', { class: 'schrift-a klein', 'aria-hidden': 'true', text: 'A' }), regler, el('span', { class: 'schrift-a gross', 'aria-hidden': 'true', text: 'A' })]),
    el('div', { class: 'btn-row' }, [wert, normal]),
  ]);
  const schliessen = (e) => {
    if (e && (pop.contains(e.target) || anker.contains(e.target))) return;
    pop.remove(); document.removeEventListener('click', schliessen, true); document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') schliessen(); };
  document.addEventListener('click', schliessen, true);
  document.addEventListener('keydown', onKey);
  anker.insertAdjacentElement('afterend', pop);
}

function schubladeSchliessen() {
  const app = document.querySelector('.app');
  if (app) app.classList.remove('nav-open');
  const k = document.querySelector('.nav-toggle');
  if (k) k.setAttribute('aria-expanded', 'false');
}

// ── Installieren-Knopf in der Kopfleiste ─────────────────────────────────────
// Als App (display-mode standalone usw.) oder nach `appinstalled` in diesem Tab: weg. Die Klasse
// html.app-installiert blendet auch den Einstellungen-Knopf aus (CSS, !important) — der Kanon-Knopf
// selbst kennt nur display-mode.
function alsAppLaeuft() {
  try {
    return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches ||
      matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  } catch { return false; }
}
let _installHorcht = false;
function installKopfKnopf() {
  if (!_installHorcht) {
    _installHorcht = true;
    window.addEventListener('appinstalled', () => document.documentElement.classList.add('app-installiert'));
  }
  const weg = alsAppLaeuft() || document.documentElement.classList.contains('app-installiert');
  return el('button', {
    class: 'btn btn-ghost btn-sm btn-icon install-kopf', id: 'install-kopf', text: '⬇',
    title: t('app.installTitle'), 'aria-label': t('app.install'), hidden: weg ? '' : null,
    onClick: () => {
      const k = document.getElementById('installieren') || document.getElementById('installieren-einstellungen');
      if (k) k.click(); else navigate('settings');
    },
  });
}

// ── Flying Widget (Modul-17-Idee, App-eigen) ─────────────────────────────────
// Ein schwebendes Lampen-Panel OBEN in der Kopfzeile, überall in der App sichtbar —
// fasst alle vier Funktionen in EINEM Widget zusammen (statt drei Einzel-Chips):
//   LEBT    — Identität vorhanden (grün) / kanonisch / abweichend (gelb) / keine (grau).
//   VERKEHR — Klick prüft die angeschlossenen Knoten live (pulst); grün = erreichbar.
//   FREMD   — wird rot, wenn ein fremder Zugriff erkannt wird (fremde postMessage-Quelle /
//             SW-Endpoint-Probe). Klick öffnet das Fremdzugriff-Fenster. (Membran-Idee.)
//   SIEGEL  — das Wappen; Klick öffnet das Siegel groß (Bronze/Gold, Drift = ausgegraut).
// Rein lokal/offline. Die volle Tiefe von Modul 15/16/17 (Allowlist, Replay, Self-Check)
// läuft weiterhin auf der SBKIM-Knotenseite (sbkim/mycelknoten.html).
function flyingWidget() {
  const lamp = (key, onClick) => el('button', {
    class: `fw-lamp fw-${key}`, title: t('fw.' + key + 'Title'), onClick,
  }, [el('span', { class: 'fw-dot' }), el('span', { class: 'fw-label', text: t('fw.' + key) })]);

  const lebt = lamp('lebt', () => navigate('network'));
  const verkehr = lamp('verkehr', () => verkehrCheck(verkehr));
  const fremd = lamp('fremd', () => openFremdModal());

  // SIEGEL-Lampe = das kleine Wappen (öffnet das Siegel-Modal).
  const siegelState = { drift: false, id: null };
  const siegel = el('button', {
    class: 'fw-lamp fw-siegel', 'data-stufe': SEAL_STAGE, style: 'display:none',
    title: t('siegel.checking'), 'aria-label': t('siegel.aria'),
    onClick: () => openSiegelModal(siegelState),
  }, [SiegelBadge(), el('span', { class: 'fw-label', text: t('fw.siegel') })]);

  // LEBT + SIEGEL aus der Identität ableiten (lokal).
  (async () => {
    try {
      if (!(await identityExists())) { lebt.classList.add('is-off'); lebt.title = t('fw.lebtNone'); return; }
      const ident = await loadIdentity();
      siegelState.id = ident ? ident.id : null;
      lebt.classList.add('is-on');
      siegel.style.display = '';
      if (ident && ident.id === CANONICAL_NODE_ID) {
        lebt.title = t('fw.lebtOk');
        siegel.title = SEAL_STAGE === 'verified-match' ? t('siegel.match') : t('siegel.spore');
      } else {
        lebt.classList.add('is-warn'); lebt.title = t('fw.lebtDrift');
        siegelState.drift = true; siegel.classList.add('is-drift'); siegel.title = t('siegel.driftTitle');
      }
    } catch { lebt.classList.add('is-off'); lebt.title = t('fw.lebtNone'); }
  })();

  // FREMD-Lampe an den Fremdzugriff-Wächter hängen.
  startFremdWatch();
  const refreshFremd = () => {
    const n = _fremd.events.length;
    fremd.classList.toggle('is-alert', n > 0);
    fremd.title = n > 0 ? t('fw.fremdAlert').replace('%N%', String(n)) : t('fw.fremdTitle');
  };
  _fremd.listeners.push(refreshFremd);
  refreshFremd();

  return el('div', { class: 'flying-widget', role: 'group', 'aria-label': t('fw.aria') }, [lebt, verkehr, fremd, siegel]);
}

// VERKEHR: prüft die angeschlossenen Knoten live und pulst dabei (opt-in, Klick).
async function verkehrCheck(lampEl) {
  lampEl.classList.add('is-pulse');
  lampEl.title = t('fw.verkehrChecking');
  try {
    const { summary } = await checkAllPeers();
    lampEl.classList.toggle('is-on', summary.reachable > 0);
    lampEl.title = t('fw.verkehrResult').replace('%R%', String(summary.reachable)).replace('%T%', String(summary.total));
  } catch { lampEl.title = t('fw.verkehrTitle'); }
  finally { setTimeout(() => lampEl.classList.remove('is-pulse'), 700); }
}

// FREMD/Membran-Wächter (lokal, RAM-only): meldet fremde postMessage-Quellen (z. B.
// KI-Browser-Agent / fremdes iframe) und SW-Endpoint-Proben über den Membran-Kanal.
// Wirft nie; offline-tauglich. Volle Modul-15-Tiefe (Allowlist/Replay) bleibt der
// SBKIM-Knotenseite vorbehalten.
const _fremd = { events: [], listeners: [], started: false };
function fremdNotify() { for (const fn of _fremd.listeners) { try { fn(); } catch { /* ignore */ } } }
function fremdRecord(kind, detail) {
  _fremd.events.push({ ts: Date.now(), kind, detail: String(detail || '') });
  if (_fremd.events.length > 50) _fremd.events.shift();
  fremdNotify();
}
function startFremdWatch() {
  if (_fremd.started) return;
  _fremd.started = true;
  try {
    window.addEventListener('message', (e) => {
      try {
        const origin = e.origin || '';
        if (origin && origin !== location.origin) fremdRecord('postMessage', origin);
      } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
  try {
    const bc = new BroadcastChannel('sbkim-membrane');
    bc.onmessage = (e) => {
      if (e && e.data && e.data.type === 'SBKIM_MEMBRANE_PROBE') fremdRecord('endpoint-probe', e.data.from);
    };
  } catch { /* BroadcastChannel evtl. nicht verfügbar — egal */ }
}

// Fremdzugriff-Fenster: listet erkannte Zugriffe, Test-Knopf (simuliert einen fremden
// Zugriff → Lampe wird rot), Leeren. Esc/Backdrop schließt.
function openFremdModal() {
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const list = el('div', { class: 'report-line-group' });
  const render = () => {
    list.replaceChildren();
    if (!_fremd.events.length) { list.append(el('p', { class: 'muted small', text: t('fw.fremdEmpty') })); return; }
    for (const ev of [..._fremd.events].reverse()) {
      list.append(el('div', { class: 'report-line' }, [
        el('span', { text: new Date(ev.ts).toLocaleTimeString() }),
        el('span', { class: 'mono small', text: ev.kind + ': ' + ev.detail }),
      ]));
    }
  };
  render();
  const testBtn = el('button', { class: 'btn', text: t('fw.fremdTest'), onClick: () => { fremdRecord('test', t('fw.fremdTestOrigin')); render(); } });
  const clearBtn = el('button', { class: 'btn', text: t('fw.fremdClear'), onClick: () => { _fremd.events.length = 0; fremdNotify(); render(); } });
  overlay.appendChild(el('div', { class: 'modal' }, [
    el('h2', { text: t('fw.fremdModalTitle') }),
    el('p', { class: 'muted small', text: t('fw.fremdIntro') }),
    list,
    el('div', { class: 'btn-row' }, [testBtn, clearBtn, el('button', { class: 'btn btn-primary', text: t('common.close'), onClick: close })]),
  ]));
  document.body.appendChild(overlay);
}

// Siegel-Modal: zeigt das Wappen GROSS (mit lesbarem Band) + die bezeugten Eckdaten
// („was drin ist"). Bei abweichender Identität eine ehrliche Warnung statt falschem
// „besiegelt". Esc oder Klick auf den Hintergrund schließt.
function openSiegelModal(state) {
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const stufe = SEAL_STAGE === 'verified-match' ? t('siegel.stageMatch') : t('siegel.stageSpore');
  const rows = [
    [t('siegel.fieldNode'), NODE_PROFILE.nodeName],
    ['nodeId', CANONICAL_NODE_ID],
    [t('siegel.fieldEndpoint'), NODE_PROFILE.endpoint],
    [t('siegel.fieldDomain'), NODE_PROFILE.domain],
    [t('siegel.fieldStage'), stufe],
  ];
  const dl = el('dl', { class: 'siegel-modal-dl' });
  for (const [k, v] of rows) { dl.append(el('dt', { text: k }), el('dd', { class: 'mono', text: v })); }

  overlay.appendChild(el('div', { class: 'modal siegel-modal' }, [
    el('h2', { text: t('siegel.modalTitle') }),
    state.drift ? el('div', { class: 'banner banner-warn', text: t('siegel.driftWarn').replace('%ID%', state.id || '—') }) : null,
    SiegelWappenGross(),
    el('p', { class: 'muted small', text: t('siegel.modalIntro') }),
    dl,
    el('p', { class: 'muted small', text: t('siegel.attests') }),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary', text: t('net.title'), onClick: () => { close(); navigate('network'); } }),
      el('button', { class: 'btn', text: t('common.close'), onClick: close }),
    ]),
  ]));
  document.body.appendChild(overlay);
}

// Mandant wechseln: Sitzungs-Key (DEK) verwerfen und neu booten. Der Boot zeigt bei
// mehr als einem Mandanten die Auswahl vor dem Entsperren (showLockScreen) — von dort
// wird der Ziel-Mandant gewählt und entsperrt. Aus einem Test-Tresor heraus erst der
// behalten/verwerfen-Dialog (nichts versehentlich liegen lassen).
function mandantWechseln() {
  if (_mandant.sandbox) { verlasseSandboxDialog(); return; }
  lockVault();
  _onLock();
}

// Sperren-Knopf: aus einem Test-Tresor heraus zuerst der behalten/verwerfen-Dialog,
// sonst direkt sperren + neu booten.
function sperren() {
  if (_mandant.sandbox) { verlasseSandboxDialog(); return; }
  lockVault();
  _onLock();
}

// Hard-Reload: Service-Worker-Registrierungen abmelden + Cache-Storage leeren, dann neu
// laden. Konsequent fail-soft (wirft nie); ein 2,5-s-Timeout garantiert das Neuladen auch,
// wenn eine der Aufräum-Zusagen hängt. Daten (IndexedDB/Tresore) bleiben unberührt — nur
// der Shell-Cache wird verworfen (Cache-Bust am Tablet).
export function hardReloadApp() {
  const done = () => { try { location.reload(true); } catch (_e) { try { location.reload(); } catch (__e) { /* ignore */ } } };
  let fired = false; const go = () => { if (fired) return; fired = true; done(); };
  try {
    const to = setTimeout(go, 2500);
    const tasks = [];
    if ('serviceWorker' in navigator) { tasks.push(navigator.serviceWorker.getRegistration().then((r) => r && r.unregister()) /* nur der EIGENE Worker — getRegistrations() meldete ALLE Apps des Ursprungs ab */.catch(() => {})); }
    if (window.caches && caches.keys) { tasks.push(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('blpr-')).map((k) => caches.delete(k)))) /* nur EIGENE Vorraete — caches gehoert dem Ursprung */.catch(() => {})); }
    Promise.all(tasks).then(() => { clearTimeout(to); go(); }).catch(() => { clearTimeout(to); go(); });
  } catch (_e) { go(); }
}

// Symbol eines Menüpunkts: Strichsymbol aus dem Sprite, oder das Original-Bild einer eingebetteten App (Klaus: erkennbar).
const navIcon = (ic) => (String(ic).startsWith('img:') ? el('img', { class: 'ic ic-img', src: ic.slice(4), alt: '', width: '20', height: '20' }) : icon(ic));

function nav(zu) {
  const route = getRoute();
  const s = getSettings();
  // Ansichten je Modus ausblenden (domain/nutzungsmodus.js, node-getestet); hier nur Filterung und Aufbau.
  const eintrag = ([key, label, ic]) => el('button', {
    class: 'nav-item' + (route === key ? ' active' : ''), title: t(label),
    'aria-current': route === key ? 'page' : null, 'data-nav': key,
    onClick: () => { navigate(key); schubladeSchliessen(); },
  }, [navIcon(ic), el('span', { class: 'ic-text', text: t(label) })]);
  const gruppen = NAV_GRUPPEN.map(([titel, keys]) => {
    const sichtbar = keys.filter((k) => zeigeAnsicht(s, k) && (k !== 'tresorordner' || tresorordnerVerfuegbar())).map((k) => NAV.find(([n]) => n === k)).filter(Boolean);
    if (!sichtbar.length) return null;
    return el('div', { class: 'nav-gruppe' + (titel ? '' : ' nav-gruppe-solo') }, [
      titel ? el('div', { class: 'nav-gruppe-titel', text: t(titel) }) : null,
      ...sichtbar.map(eintrag),
    ]);
  });
  // Ein-/Ausklappen (nur ab 641 px sichtbar, CSS): merkt die Wahl von Hand.
  const klapp = el('button', {
    class: 'nav-klapp', title: zu ? t('nav.ausklappen') : t('nav.einklappen'), 'aria-label': zu ? t('nav.ausklappen') : t('nav.einklappen'),
    'aria-expanded': zu ? 'false' : 'true',
    onClick: () => { try { localStorage.setItem(NAV_KEY, zu ? 'auf' : 'zu'); } catch { /* ignore */ } paint(); },
  }, [icon(zu ? 'blp-ausklappen' : 'blp-einklappen'), el('span', { class: 'ic-text', text: t('nav.einklappen') })]);
  return el('nav', { class: 'app-nav', 'aria-label': t('a11y.nav') }, [...gruppen, klapp]);
}

function renderRoute() {
  const content = document.getElementById('content');
  if (!content) return;
  const route = getRoute();
  if (route === 'dashboard') return void mountDashboard(content);
  if (route === 'settings') return mount(content, viewSettings());
  if (route === 'accounts') return void mountAccounts(content);
  if (route === 'anlagen') return void mountAnlagen(content);
  if (route === 'kassenbuch') return void mountKassenbuch(content);
  if (route === 'journal') return void mountJournal(content);
  if (route === 'reports') return void mountReports(content);
  if (route === 'berichte') return void mountBerichte(content);
  if (route === 'selbsttest') return void mountSelbsttest(content);
  if (route === 'documents') return void mountDocuments(content);
  if (route === 'payables') return void mountPayables(content);
  if (route === 'orders') return void mountOrders(content);
  if (route === 'angebote') return void mountAngebote(content);
  if (route === 'calculate') return void mountApp(content, 'calculate');
  if (route === 'needs') return void mountApp(content, 'needs');
  if (route === 'shopbuchung') return void mountShopbuchung(content);
  if (route === 'nachkalkulation') return void mountNachkalkulation(content);
  if (route === 'customers') return void mountCustomers(content);
  if (route === 'employees') return void mountEmployees(content);
  if (route === 'lohn') return void mountLohn(content);
  if (route === 'legal') return void mountLegal(content);
  if (route === 'about') return mount(content, el('section', { class: 'view' }, [aboutContent()]));
  if (route === 'anleitung') return void mountAnleitung(content);
  if (route === 'network') return void mountNetwork(content);
  if (route === 'sbkimsuche') return void mountSbkimSuche(content);
  if (route === 'safebox') return void mountSafebox(content);
  if (route === 'tresorordner') return void mountTresorordner(content);
  return mount(content, viewPlaceholder(route));
}

// ---- Durabilitäts-Banner ----------------------------------------------------

async function refreshDurability() {
  const slot = document.getElementById('durability-slot');
  if (!slot) return;
  const st = await durabilityStatus();
  clear(slot);
  if (st.level === 'ok') return;

  const msgs = [];
  // In der Pro-App räumt kein Browser den Speicher (Android hält die App-Daten): dort kein „nicht dauerhaft“-Banner.
  if (st.issues.includes('persist-denied') && !istProApp()) msgs.push(t('durability.persistDenied'));
  if (st.issues.includes('quota-pressure')) msgs.push(t('durability.quotaPressure'));
  if (st.issues.includes('no-backup')) msgs.push(t('durability.noBackup'));
  else if (st.issues.includes('backup-stale')) msgs.push(t('durability.backupStale'));

  slot.appendChild(el('div', { class: `banner banner-${st.level === 'critical' ? 'critical' : 'warn'}`, role: 'status', 'aria-live': 'polite' }, [
    el('span', { class: 'banner-text', text: msgs.join(' ') }),
    el('button', { class: 'btn btn-sm', text: t('durability.backupNow'), onClick: backupJetzt }),
  ]));
}

// Datensicherungs-Aktionen (Modul ui/datensicherung.js) frischen nach Backup/Restore
// das Durabilitäts-Banner auf.
onDatensicherungAktion(refreshDurability);

// ---- Test-Modus (Sandbox-Tresore, docs/TEST_MODUS.md) -----------------------

// Dauerhafter Banner, solange ein Test-Tresor aktiv ist: macht den Test-Modus unübersehbar
// und bietet den Ausstieg (behalten/verwerfen). „TEST-MODUS · Test „{name}" — echte Daten unberührt."
function testModusBanner() {
  return el('div', { class: 'banner banner-test', role: 'status', 'aria-live': 'polite' }, [
    el('span', { class: 'banner-text' }, [
      el('strong', { text: t('test.bannerTag') }),
      el('span', { text: ' ' + t('test.bannerText').replace('{name}', _mandant.name || '') }),
    ]),
    el('button', { class: 'btn btn-sm', text: t('test.verlassen'), onClick: verlasseSandboxDialog }),
  ]);
}

// „Test behalten oder verwerfen?" beim Verlassen (Sperren/Wechseln). Behalten → Eingaben
// bleiben für nächstes Mal; Verwerfen → der Test wird spurlos gelöscht (eigene DB). In
// beiden Fällen wird der Sitzungs-Key verworfen und neu gebootet. Echte Daten unberührt.
function verlasseSandboxDialog() {
  const id = _mandant.id;
  const name = _mandant.name || '';
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const schliessen = () => overlay.remove();

  const behalten = el('button', {
    class: 'btn btn-primary', text: t('test.behalten'),
    onClick: async () => {
      behalten.setAttribute('disabled', '');
      // Test bleibt erhalten; aktiver Tresor zurück auf einen echten Mandanten → nächster
      // Start landet in der echten Welt (der Test ist über „🧪 Tests" wieder erreichbar).
      try { await behalteUndVerlasseSandbox(); }
      catch (e) { alert(String(e.message || e)); }
      lockVault(); _onLock();
    },
  });
  const verwerfen = el('button', {
    class: 'btn btn-danger', text: t('test.verwerfen'),
    onClick: async () => {
      verwerfen.setAttribute('disabled', '');
      try { await loescheSandboxTresor(id); }
      catch (e) { alert(String(e.message || e)); }
      lockVault(); _onLock();
    },
  });
  const abbrechen = el('button', { class: 'btn', text: t('common.cancel'), onClick: schliessen });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) schliessen(); });
  overlay.appendChild(el('div', { class: 'modal' }, [
    el('h2', { text: t('test.verlassenTitle') }),
    el('p', { class: 'muted', text: t('test.verlassenIntro').replace('{name}', name) }),
    el('div', { class: 'btn-row' }, [behalten, verwerfen, abbrechen]),
  ]));
  document.body.appendChild(overlay);
}

// ---- Views ------------------------------------------------------------------

function viewSettings() {
  const s = getSettings();

  const seg = (label, key, options, current, onPick, hint) => el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: label }),
    el('div', { class: 'segmented' },
      options.map(([val, lab]) => el('button', {
        class: 'seg' + (current === val ? ' active' : ''),
        onClick: () => onPick(val),
      }, [el('span', { class: 'ic-text', text: lab })]))
    ),
    hint ? el('p', { class: 'muted small', text: hint }) : null,
  ]);

  // Modus (Klaus 2026-10-26): Privat · Kleinunternehmer · Selbstständig · Berater. Der Altwert „Verein" bleibt
  // wählbar, solange er gesetzt ist (D13 offen). Wechsel mit Rückfrage, wenn er § 19 ändert (F4).
  const modus = nutzungsmodusVon(s);
  const modusListe = modus === NUTZUNGSMODUS.VEREIN ? [...NUTZUNGSMODUS_LISTE, NUTZUNGSMODUS.VEREIN] : NUTZUNGSMODUS_LISTE;
  const zeige = (abschnitt, node) => (zeigeEinstellung(s, abschnitt) ? node : null);

  // data-einstellungen: hier hängt assets/installieren.js den Knopf „Installieren“ hinten an (Klaus 2026-10-18).
  return el('section', { class: 'view', 'data-einstellungen': '' }, [
    el('h1', { text: t('settings.title') }),

    // Pro-App (Leitfaden § 2, Klaus 2026-10-28): „Tresor & Ablage“ ganz oben — nur in der Android-App (BLPNative.tresor).
    tresorordnerVerfuegbar() ? tresorAblageSection() : null,

    seg(t('settings.modus'), 'nutzungsmodus',
      modusListe.map((m) => [m, t('settings.modus.' + m)]), modus,
      async (v) => {
        if (v === modus) return;
        const w = moduswechsel(s, v);
        if (w.rueckfrage && !confirm(t('settings.modus.rueckfrage'))) return;
        await updateSettings(w.patch); paint();
      },
      t('settings.modus.hint')),
    istPrivatmodus(s) ? el('p', { class: 'muted small', 'data-privat-hinweis': '', text: t('settings.modus.privatHinweis') }) : null,

    // F3: „Alle Einstellungen zeigen" — nur, wenn der Modus überhaupt etwas ausblendet.
    hatAusgeblendeteEinstellungen(s)
      ? seg(t('settings.alle'), 'alleEinstellungen',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.alleEinstellungen ? 'ja' : 'nein',
          async (v) => { await updateSettings({ alleEinstellungen: v === 'ja' }); paint(); }, t('settings.alle.hint'))
      : null,

    el('div', { class: 'setting' }, [
      el('div', { class: 'setting-label', text: t('settings.theme') }),
      themaWahl(s),
    ]),

    seg(t('settings.ai'), 'aiAutonomy',
      AI_LEVELS.map((a) => [a, t('settings.ai.' + a)]), s.aiAutonomy,
      (v) => updateSettings({ aiAutonomy: v }), t('settings.ai.hint')),

    zeige(EINSTELLUNG.KLEINUNTERNEHMER, seg(t('settings.kleinunternehmer'), 'kleinunternehmer',
      [['nein', t('common.no')], ['ja', t('common.yes')]], s.kleinunternehmer ? 'ja' : 'nein',
      async (v) => { await updateSettings({ kleinunternehmer: v === 'ja' }); paint(); },
      t('settings.kleinunternehmer.hint'))),

    zeige(EINSTELLUNG.GEWINNERMITTLUNG, gewinnermittlungSection(s)),

    zeige(EINSTELLUNG.RECHNUNGSSTELLE, rechnungsstelleSection(s)),

    mikroSection(s, seg),

    scanSection(s, seg),

    verbundSection(s, seg),

    seg(t('settings.datenschutz'), 'datenschutzModus',
      [['aus', t('settings.datenschutz.aus')], ['pseudonym', t('settings.datenschutz.pseudonym')]],
      s.datenschutzModus || 'pseudonym',
      async (v) => { await updateSettings({ datenschutzModus: v, datenschutzGewaehlt: true, datenschutzUmgestellt: false }); paint(); }, t('settings.datenschutz.hint')),
    s.datenschutzUmgestellt ? el('p', { class: 'muted small', 'data-datenschutz-umgestellt': '', text: t('settings.datenschutz.umgestellt') }) : null,

    // Von Hand (Klaus 2026-10-14, wie „Weitere Namen" im Sende-Prüfer): nur im Pseudonym-Modus.
    s.datenschutzModus === 'pseudonym' ? handListenSection(s) : null,

    // NER-Zusatz: nur im Pseudonym-Modus sinnvoll → konditional eingeblendet.
    s.datenschutzModus === 'pseudonym'
      ? seg(t('settings.datenschutz.ner'), 'nerPii',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.nerPii === false ? 'nein' : 'ja',
          (v) => updateSettings({ nerPii: v === 'ja' }), t('settings.datenschutz.nerHint'))
      : null,

    // Namen nach Muster (Klaus 2026-10-26): auch unbekannte Namen verdecken; Rücknahme je Treffer in der Belegansicht.
    s.datenschutzModus === 'pseudonym'
      ? seg(t('settings.datenschutz.namensmuster'), 'namensmuster',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.namensmuster === false ? 'nein' : 'ja',
          (v) => updateSettings({ namensmuster: v === 'ja' }), t('settings.datenschutz.namensmusterHint'))
      : null,

    // Dreistufiger Briefkasten (Mandant ⊃ Firma ⊃ Person) — nur im Pseudonym-Modus.
    s.datenschutzModus === 'pseudonym'
      ? seg(t('settings.datenschutz.briefkasten'), 'briefkastenScopes',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.briefkastenScopes === true ? 'ja' : 'nein',
          (v) => updateSettings({ briefkastenScopes: v === 'ja' }), t('settings.datenschutz.briefkastenHint'))
      : null,

    // P9: Datei-Import mit exaktem Schlüssel-Abgleich (Pseudonymisieren ↔ Re-Identifizieren
    // über Dateien hinweg). Reine Logik node-getestet; dieser Glue ist statisch geprüft.
    schluesselAbgleichSection(),

    seg(t('settings.lang'), 'lang',
      LANGS.map((l) => [l, l.toUpperCase()]), s.lang,
      async (v) => { setLang(v); await updateSettings({ lang: v }); paint(); }),

    aiConfigSection(),

    zeige(EINSTELLUNG.FIRMA, firmaSection(s)),

    zeige(EINSTELLUNG.DATEV, datevSection(s)),

    zeige(EINSTELLUNG.GESCHAEFTSJAHR, geschaeftsjahrSection(s)),

    zeige(EINSTELLUNG.PARTNER, partnerSection(s)),

    zeige(EINSTELLUNG.BUCHUNGSSPERRE, buchungssperreSection()),

    zeige(EINSTELLUNG.MANDANTEN, mandantenSection()),

    testModusSection(),

    passwortSection(),

    backupEinstellungen(),
  ]);
}

// Merkt sich kurz, dass das Firmenprofil gespeichert wurde (überlebt das Re-Render
// nach updateSettings, das sonst die „Gespeichert ✓"-Meldung sofort verwerfen würde).
let _firmaSaved = false;

// Mehrmandanten-Verwaltung (M3): umbenennen + entfernen. Die Registry liegt in einer
// eigenen, UNVERSCHLÜSSELTEN kv-DB (siehe core/mandantenStore.js) — daher async geladen.
// Reine Registry-Logik (umbenenneMandant/entferneMandant/…) ist node-getestet; dieser
// Glue-Pfad (DOM/IndexedDB) ist statisch geprüft (kein Headless-Browser).
function mandantenSection() {
  const host = el('div', { class: 'setting' });
  const render = async () => {
    let registry;
    try { registry = await ladeRegistry(); }
    catch {
      host.replaceChildren(
        el('div', { class: 'setting-label', text: t('settings.mandanten') }),
        el('p', { class: 'muted small', text: '—' }),
      );
      return;
    }
    const rows = mandantenAuswahlListe(registry).map((m) => mandantRow(m, registry, render));
    host.replaceChildren(
      el('div', { class: 'setting-label', text: t('settings.mandanten') }),
      el('p', { class: 'muted small', text: t('settings.mandantenHint') }),
      el('div', { class: 'mandant-admin' }, rows),
    );
  };
  render();
  return host;
}

// Eine Zeile der Mandanten-Verwaltung: Name bearbeiten + speichern, entfernen (nur mit
// Bestätigung; die Tresor-DB bleibt erhalten — kein Datenverlust). Der aktuell geöffnete
// Mandant kann nicht entfernt werden (man arbeitet gerade in ihm → erst wechseln).
function mandantRow(m, registry, rerender) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: m.name, maxlength: '60' });
  input.addEventListener('input', () => { status.textContent = ''; status.classList.remove('form-error'); });

  const save = el('button', {
    class: 'btn btn-sm', text: t('common.save'),
    onClick: async () => {
      const fehler = validateMandantName(input.value);
      if (fehler) { status.textContent = fehler; status.classList.add('form-error'); return; }
      try {
        await speichereRegistry(umbenenneMandant(registry, m.id, input.value));
        status.classList.remove('form-error');
        status.textContent = t('settings.saved');
        if (m.aktiv) refreshMandant(); // Header sofort mitziehen
      } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
    },
  });

  const remove = el('button', {
    class: 'btn btn-sm btn-danger', text: t('common.delete'),
    onClick: async () => {
      if (!confirm(t('mandant.confirmRemove').replace('{name}', m.name))) return;
      try {
        await speichereRegistry(entferneMandant(registry, m.id));
        refreshMandant(); // Header (Mandantenzahl) aktualisieren
        rerender();       // Liste neu zeichnen
      } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
    },
  });
  if (m.aktiv) { remove.setAttribute('disabled', ''); remove.title = t('mandant.removeActiveHint'); }

  return el('div', { class: 'mandant-admin-row' }, [
    input,
    m.aktiv ? el('span', { class: 'mandant-badge', text: t('mandant.current') }) : null,
    save, remove, status,
  ]);
}

// Test-Modus-Verwaltung in den Einstellungen (docs/TEST_MODUS.md). Innerhalb eines Tests:
// Test verlassen (behalten/verwerfen). Außerhalb (echter Mandant): Tests öffnen/leeren/
// löschen, neuen Test anlegen, „Alle Tests löschen". Öffnen/Anlegen verwirft den Sitzungs-
// Key und bootet neu (Passwort des Tests am Sperrbildschirm). Reine Lebenszyklus-Logik ist
// node-getestet; dieser DOM-/IndexedDB-Pfad ist statisch geprüft. Echte Daten bleiben unberührt.
function testModusSection() {
  const host = el('div', { class: 'setting' });
  const render = async () => {
    const kopf = [
      el('div', { class: 'setting-label', text: t('settings.test') }),
      el('p', { class: 'muted small', text: t('settings.testHint') }),
    ];

    if (_mandant.sandbox) {
      host.replaceChildren(
        ...kopf,
        el('p', { class: 'muted small', text: t('test.inTestNote').replace('{name}', _mandant.name || '') }),
        el('div', { class: 'btn-row' }, [
          el('button', { class: 'btn btn-sm', text: t('test.verlassen'), onClick: verlasseSandboxDialog }),
        ]),
      );
      return;
    }

    let registry;
    try { registry = await ladeRegistry(); }
    catch { host.replaceChildren(...kopf, el('p', { class: 'muted small', text: '—' })); return; }

    const tests = sandboxAuswahlListe(registry);
    const rows = tests.map((m) => el('div', { class: 'mandant-admin-row' }, [
      el('span', { class: 'mandant-name', text: m.name }),
      el('button', { class: 'btn btn-sm', text: t('test.oeffnen'), onClick: async () => { await wechsleZuSandbox(m.id); _onLock(); } }),
      el('button', { class: 'btn btn-sm', text: t('test.leeren'), onClick: async () => { if (!confirm(t('test.confirmLeeren').replace('{name}', m.name))) return; await leereSandboxTresor(m.id); render(); } }),
      el('button', { class: 'btn btn-sm btn-danger', text: t('common.delete'), onClick: async () => { if (!confirm(t('test.confirmLoeschen').replace('{name}', m.name))) return; await loescheSandboxTresor(m.id); render(); } }),
    ]));

    host.replaceChildren(
      ...kopf,
      tests.length ? el('div', { class: 'mandant-admin' }, rows) : el('p', { class: 'muted small', text: t('test.empty') }),
      el('div', { class: 'btn-row' }, [
        el('button', {
          class: 'btn btn-sm btn-primary', text: t('test.neu'),
          onClick: async () => {
            const name = prompt(t('test.name'), naechsterTestName(registry));
            if (name == null) return;
            const fehler = validateMandantName(name);
            if (fehler) { alert(fehler); return; }
            await erstelleSandboxTresor(name);
            _onLock(); // neu booten → Test-Onboarding (Passwort) am Sperrbildschirm
          },
        }),
        tests.length ? el('button', {
          class: 'btn btn-sm btn-danger', text: t('test.alleLoeschen'),
          onClick: async () => { if (!confirm(t('test.confirmAlle'))) return; await loescheAlleSandboxes(); render(); },
        }) : null,
      ]),
    );
  };
  render();
  return host;
}

// Passwort ändern (Envelope: wickelt nur den Daten-Schlüssel neu ein).
// ── Tresor & Ablage (Pro-App, Leitfaden § 2/§ 5, Klaus 2026-10-28) ──────────────────────────────────────────────
// Ablage von BookLedgerPro = Ordner „BookLedgerPro“ im Tresor (Sicherungen, Beleg-Originale); Tresor = der gemeinsame
// Tresorordner aller Pro-Apps. Je ● Zustand, ganzer Pfad, „In Dateien öffnen“; ein farbiger Knopf = nächster Schritt.
// Die Bausteine (Zustand, Pfadzeile, ⓘ) kommen aus der gemeinsamen Datei native/pro-bedienung.js (nur in der App geladen);
// fehlt sie, steht derselbe Inhalt als Text da. Passwörter nur im nativen Fenster. Mehr (anlegen, Ersatzschlüssel, Fächer)
// in der Ansicht „Tresorordner“. Geprüft mit gestellter Brücke in tests/smoke_tresorordner.mjs; am Gerät nicht gemessen.
let _taMeldung = '';
function tresorAblageSection() {
  const host = el('div', { class: 'setting tresor-ablage', 'data-tresor-ablage': '' });
  const b = window.BLPNative.tresor, P = window.ProBedienung || null;
  const pfadText = (z, unter) => {
    const sp = z.speicher === 'karte' ? t('ta.karte') + '/' : z.speicher === 'geraet' ? t('ta.geraet') + '/' : '';
    return sp + (z.pfad || z.ordner || '') + (unter ? '/' + unter : '');
  };
  const oeffnen = (welcher, pfad) => async () => {
    try { await b.ordnerOeffnen(welcher); }
    catch (e) {
      _taMeldung = /KEIN_DATEIEN_PROGRAMM/.test(String((e && (e.code || e.message)) || e)) ? t('ta.keinDateienProgramm').replace('{pfad}', pfad) : String((e && (e.code || e.message)) || e);
      render();
    }
  };
  const ortZeile = (offen, pfad, welcher, attr) => {
    if (P) { const z = P.ordnerZeile(pfad, oeffnen(welcher, pfad)); z.prepend(P.zustand(offen)); z.setAttribute(attr, ''); return z; }
    return el('p', { class: 'small', [attr]: '', text: `${offen ? '●' : '○'} ${pfad}` });
  };
  const tun = (fn) => async () => { _taMeldung = ''; try { await fn(); } catch (e) { _taMeldung = String((e && (e.code || e.message)) || e); } paint(); };
  const knopf = (text, onClick, haupt, attr) => el('button', { class: 'btn' + (haupt ? ' btn-primary' : ''), text, onClick, ...(attr ? { [attr]: '' } : {}) });
  async function render() {
    let z = {};
    try { z = await b.zustand(); } catch (e) { z = { problem: String((e && e.message) || e) }; }
    const offen = !!z.offen, kopf = el('div', { class: 'setting-label ta-kopf' }, [el('span', { text: t('ta.titel') })]);
    let infoInhalt = null;
    if (P) { const i = P.info('blp-tresor-ablage', t('ta.info')); kopf.append(i.knopf); infoInhalt = i.inhalt; }
    const ablage = [el('h4', { class: 'ta-unter', text: t('ta.ablage') })];
    if (z.gewaehlt && z.vorhanden) {
      ablage.push(ortZeile(offen, pfadText(z, 'BookLedgerPro'), 'ablage', 'data-ta-ablage-ort'));
      const letzte = (b.letzteSicherung && b.letzteSicherung()) || {};
      ablage.push(el('p', { class: 'muted small', 'data-ta-letzte': '', text: letzte.zeit ? t('tresor.letzteSicherung').replace('{zeit}', new Date(letzte.zeit).toLocaleString()) : t('tresor.nochKeineSicherung') }));
    } else ablage.push(el('p', { class: 'muted small', 'data-ta-nur-app': '', text: t('ta.nurApp') }));
    const tresor = [el('h4', { class: 'ta-unter', text: t('ta.tresor') })];
    const knoepfe = [];
    if (!z.gewaehlt) {
      tresor.push(el('p', { class: 'muted small', text: t('ta.keinOrdner') }));
      knoepfe.push(knopf(t('ta.waehlen'), tun(() => b.ordnerWaehlen()), true, 'data-ta-waehlen'));
    } else {
      tresor.push(ortZeile(offen, pfadText(z, ''), 'tresor', 'data-ta-tresor-ort'));
      if (z.erreichbar === false || !z.vorhanden) {
        if (z.erreichbar !== false) tresor.push(el('p', { class: 'muted small', text: t('ta.anlegenWeiter') }));
        knoepfe.push(knopf(t('ta.weiter'), () => navigate('tresorordner'), true, 'data-ta-weiter'));
      } else if (!offen) {
        knoepfe.push(knopf(t('ta.entsperren'), tun(() => b.entsperren(!!z.gemerkt)), true, 'data-ta-entsperren'));
      } else {
        // 1 · Neu im Tresorordner (von den anderen Pro-Apps) — die Zeile füllt sich, sobald gezählt ist.
        const neu = el('p', { class: 'small', 'data-ta-neu': '' });
        tresor.push(neu);
        neuImTresorordner().then((n) => { if (n) neu.textContent = t('tresor.neuHinweis').replace('{n}', String(n)); }).catch(() => {});
        knoepfe.push(knopf(t('tresor.jetztSichern'), tun(async () => { await b.sichern(); }), false, 'data-ta-sichern'));
        knoepfe.push(knopf(t('ta.sperren'), tun(() => b.sperren(false)), false, 'data-ta-sperren'));
      }
      knoepfe.push(knopf(t('ta.ansicht'), () => navigate('tresorordner'), false, 'data-ta-ansicht'));
    }
    host.replaceChildren(kopf, ...(infoInhalt ? [infoInhalt] : [el('p', { class: 'muted small', text: t('ta.info') })]),
      el('div', { class: 'ta-teil', 'data-ta-ablage': '' }, ablage),
      el('div', { class: 'ta-teil', 'data-ta-tresor': '' }, tresor),
      el('div', { class: 'btn-row' }, knoepfe),
      _taMeldung ? el('p', { class: 'small', role: 'status', 'data-ta-meldung': '', text: _taMeldung }) : null);
  }
  render();
  return host;
}

function passwortSection() {
  const alt = el('input', { type: 'password', placeholder: t('pw.current'), autocomplete: 'current-password' });
  const neu = el('input', { type: 'password', placeholder: t('pw.new'), autocomplete: 'new-password' });
  const neu2 = el('input', { type: 'password', placeholder: t('pw.repeat'), autocomplete: 'new-password' });
  const status = el('p', { class: 'muted small' });
  const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('pw.title') }),
    el('div', { class: 'pw-row' }, [
      el('img', { class: 'pw-key', src: './assets/img/onboard-key.png', alt: '', loading: 'lazy' }),
      el('div', { class: 'pw-form' }, [
        el('p', { class: 'muted small', text: t('pw.hint') }),
        el('div', { class: 'form-grid' }, [
          field(t('pw.current'), alt),
          field(t('pw.new'), neu),
          field(t('pw.repeat'), neu2),
        ]),
        el('div', { class: 'btn-row' }, [
          el('button', {
            class: 'btn btn-sm btn-primary', text: t('pw.change'),
            onClick: async () => {
              status.classList.remove('form-error');
              if (neu.value !== neu2.value) { status.textContent = t('onboard.mismatch'); status.classList.add('form-error'); return; }
              if (neu.value.length < 8) { status.textContent = t('onboard.tooShort'); status.classList.add('form-error'); return; }
              try {
                await changePassword(alt.value, neu.value);
                alt.value = neu.value = neu2.value = '';
                status.textContent = t('pw.done');
              } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
            },
          }),
          status,
        ]),
      ]),
    ]),
  ]);
}

// DATEV-EXTF-Stammdaten (Berater-/Mandantennummer) für den Buchungsstapel-Header.
function datevSection(s) {
  const d = s.datev || {};
  const status = el('span', { class: 'muted small' });
  const beraterNr = el('input', { type: 'text', value: d.beraterNr || '', placeholder: 'Berater-Nr.' });
  const mandantNr = el('input', { type: 'text', value: d.mandantNr || '', placeholder: 'Mandanten-Nr.' });
  const skl = el('input', { type: 'number', value: String(d.sachkontenlaenge || 4), style: 'width:6rem' });
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.datev') }),
    el('div', { class: 'form-grid' }, [
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.berater') }), beraterNr]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.mandant') }), mandantNr]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.skl') }), skl]),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm', text: t('common.save'),
        onClick: async () => {
          await updateSettings({ datev: { beraterNr: beraterNr.value.trim(), mandantNr: mandantNr.value.trim(), sachkontenlaenge: Number(skl.value) || 4 } });
          status.textContent = t('settings.saved');
        },
      }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.datev.hint') }),
  ]);
}

// Verbundene App (z.B. Mein-WorkFloh, public) — reziproke Verlinkung + offenes Austauschformat.
function partnerSection(s) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: s.partnerAppUrl || '', placeholder: 'https://…' });
  const openBtn = el('a', { class: 'btn btn-sm', target: '_blank', rel: 'noopener noreferrer', text: t('settings.partnerOpen') });
  const syncOpen = () => { const u = input.value.trim(); if (/^https?:\/\//.test(u)) { openBtn.href = u; openBtn.style.display = ''; } else { openBtn.style.display = 'none'; } };
  input.addEventListener('input', syncOpen); syncOpen();
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.partner') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', { class: 'btn btn-sm', text: t('common.save'), onClick: async () => { await updateSettings({ partnerAppUrl: input.value.trim() }); status.textContent = t('settings.saved'); } }),
      openBtn, status,
    ]),
    el('p', { class: 'muted small', text: t('settings.partnerHint') }),
  ]);
}

// Gewinnermittlungsart (B1): EÜR (§4 Abs.3) oder Bilanzierung (§4 Abs.1/§5 EStG).
// Beim Wechsel auf „Bilanz" werden die Bilanz-Grundkonten (Eigenkapital/Rückstellungen)
// in älteren Tresoren nachgezogen (ensureSeedKonten); neue Tresore haben sie schon im Seed.
// Reine Logik (bilanzierung.js) ist node-getestet; dieser Glue-/UI-Pfad ist statisch geprüft.
// EHRLICH: GuV/Bilanz-Auswertungen folgen (B2/B3) — hier wird nur Modus + Kontengrundlage gesetzt.
function gewinnermittlungSection(s) {
  const aktuell = normalizeGewinnermittlung(s.gewinnermittlung);
  const status = el('p', { class: 'muted small' });
  const segmented = el('div', { class: 'segmented' },
    [[GEWINNERMITTLUNG.EUER, t('settings.gewinn.euer')], [GEWINNERMITTLUNG.BILANZ, t('settings.gewinn.bilanz')]]
      .map(([val, lab]) => el('button', {
        class: 'seg' + (aktuell === val ? ' active' : ''),
        text: lab,
        onClick: async () => {
          if (val === aktuell) return;
          await updateSettings({ gewinnermittlung: val });
          if (val === GEWINNERMITTLUNG.BILANZ) {
            try {
              const n = await ensureSeedKonten([...BILANZ_GRUNDKONTO_NUMMERN]);
              status.textContent = n > 0 ? t('settings.gewinn.seeded').replace('{n}', String(n)) : t('settings.saved');
            } catch (e) { status.textContent = String(e.message || e); }
          }
          paint();
        },
      })));
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.gewinn') }),
    segmented,
    el('p', { class: 'muted small', text: t('settings.gewinn.hint') }),
    status,
  ]);
}

// Rechnungsstelle (§14-Nummernkreis-Hoheit, Katalog §7a): BLP stellt aus (blp)
// vs. externes Programm/Steuerberater (extern → BLP nur Vorlage). Wechsel weg von
// BLP wird mit Bestätigung abgesichert, sobald BLP schon §14-Nummern vergeben hat
// (GoBD-Lückenlosigkeit).
// Zwei Felder, je ein Eintrag pro Zeile. Gespeichert wird beim Verlassen des Felds.
// 🎙 Mikrofon und Wort-Speicher (Klaus 2026-10-26): Vorgabesprache, Wort-Speicher an/aus und löschen.
// Rundlauf WorkFloh (Klaus 2026-10-26, D21/D23): an welchen WorkFloh angenommene Angebote als Auftrag gehen.
function verbundSection(s, seg) {
  return el('div', { 'data-verbund-einstellungen': '' }, [
    seg(t('settings.workflohZiel'), 'workflohZiel',
      Object.entries(WORKFLOH_ZIELE).map(([k, z]) => [k, z.name]),
      zielKey(s.workflohZiel), (v) => updateSettings({ workflohZiel: v }), t('settings.workflohZiel.hint')),
  ]);
}

// Scan-Qualität (Klaus 2026-10-26: „je nach Größe oder je nach Qualität der Vorlage“) — gilt für Fotos, die
// still zum Scan-PDF werden, UND als Vorgabe für das Scanner-Fenster (dort je Scan änderbar).
function scanSection(s, seg) {
  return el('div', { 'data-scan-einstellungen': '' }, [
    seg(t('scan.qualitaet'), 'scanQualitaet',
      [['hoch', t('scan.qualitaet.hoch')], ['auto', t('scan.qualitaet.auto')], ['normal', t('scan.qualitaet.normal')], ['klein', t('scan.qualitaet.klein')]],
      s.scanQualitaet || 'hoch', (v) => updateSettings({ scanQualitaet: v }), t('scan.qualitaet.hint')),
  ]);
}

function mikroSection(s, seg) {
  const sel = el('select', { 'data-mikro-standard': '' }, [
    el('option', { value: 'auto' }, t('mikro.spracheAuto')),
    ...MIKRO_SPRACHEN.map(([code, name, kurz]) => el('option', { value: code }, `${kurz} · ${name}`)),
  ]);
  sel.value = s.mikroStandardSprache || 'auto';
  sel.addEventListener('change', () => updateSettings({ mikroStandardSprache: sel.value }, { still: true }));
  const zahl = wortSpeicherZahl(s.wortSpeicher);
  const loeschen = el('button', { class: 'btn btn-sm', type: 'button', 'data-wortspeicher-loeschen': '', disabled: zahl === 0,
    text: t('mikro.wortSpeicherLoeschen').replace('{n}', String(zahl)),
    onClick: async () => { if (!confirm(t('mikro.wortSpeicherLoeschenFrage'))) return; await updateSettings({ wortSpeicher: {}, mikroSprachen: {} }); paint(); } });
  return el('div', { 'data-mikro-einstellungen': '' }, [
    el('div', { class: 'setting' }, [
      el('div', { class: 'setting-label', text: t('mikro.titel') }), sel,
      el('p', { class: 'muted small', text: t('mikro.hint') }),
    ]),
    seg(t('mikro.wortSpeicher'), 'wortSpeicherAn',
      [['nein', t('common.no')], ['ja', t('common.yes')]], s.wortSpeicherAn === false ? 'nein' : 'ja',
      (v) => updateSettings({ wortSpeicherAn: v === 'ja' }), t('mikro.wortSpeicherHint')),
    el('div', { class: 'setting' }, [loeschen]),
  ]);
}

function handListenSection(s) {
  const feld = (key, label, hint, ph) => {
    const ta = el('textarea', { class: 'beleg-text', rows: '3', placeholder: ph, 'data-hand-liste': key, 'aria-label': label,
      text: (Array.isArray(s[key]) ? s[key] : []).join('\n') });
    ta.addEventListener('change', async () => {
      const liste = ta.value.split(/[\n;]+/).map((z) => z.trim()).filter((z) => z.length >= 2);
      // still: ohne Neuzeichnen — sonst ersetzte paint() das nächste Feld, in das gerade getippt wird.
      await updateSettings({ [key]: [...new Set(liste)] }, { still: true });
    });
    return el('div', { class: 'setting' }, [
      el('div', { class: 'setting-label', text: label }), ta, el('p', { class: 'muted small', text: hint }),
    ]);
  };
  return el('div', { 'data-hand-listen': '' }, [
    feld('kiWeitereNamen', t('settings.datenschutz.weitereNamen'), t('settings.datenschutz.weitereNamenHint'), 'Müller\nFrau Schneider'),
    feld('kiNieVerdecken', t('settings.datenschutz.nieVerdecken'), t('settings.datenschutz.nieVerdeckenHint'), 'Müller-Thurgau'),
  ]);
}

function rechnungsstelleSection(s) {
  const aktuell = normalizeRechnungsstelle(s.rechnungsstelle);
  const status = el('p', { class: 'muted small' });
  const segmented = el('div', { class: 'segmented' },
    [[RECHNUNGSSTELLE.BLP, t('settings.rechnungsstelle.blp')], [RECHNUNGSSTELLE.EXTERN, t('settings.rechnungsstelle.extern')]]
      .map(([val, lab]) => el('button', {
        class: 'seg' + (aktuell === val ? ' active' : ''),
        text: lab,
        onClick: async () => {
          if (val === aktuell) return;
          let vergeben = 0;
          try { vergeben = await vergebeneRechnungsnummern(); } catch { /* Zähler unlesbar → 0 (kein Block) */ }
          const hinweis = rechnungsstelleWechselHinweis(aktuell, val, { vergebeneNummern: vergeben });
          if (hinweis.warnen && !confirm(t('settings.rechnungsstelle.warnWechsel').replace('{n}', String(vergeben)))) return;
          await updateSettings({ rechnungsstelle: val });
          status.textContent = t('settings.saved');
          paint();
        },
      })));
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.rechnungsstelle') }),
    segmented,
    el('p', { class: 'muted small', text: t('settings.rechnungsstelle.hint') }),
    status,
  ]);
}

// Wirtschaftsjahr-Beginn (MM-TT) — Kalenderjahr (01-01) oder abweichend.
function geschaeftsjahrSection(s) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: s.wirtschaftsjahrBeginn || '01-01', placeholder: 'MM-TT' });
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.wj') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', {
        class: 'btn btn-sm', text: t('common.save'),
        onClick: async () => {
          const v = input.value.trim();
          if (!/^\d{2}-\d{2}$/.test(v)) { status.textContent = t('settings.wjError'); return; }
          await updateSettings({ wirtschaftsjahrBeginn: v }); status.textContent = t('settings.saved');
        },
      }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.wjHint') }),
  ]);
}

// Buchungssperre (Periodenabschluss): bis zu diesem Datum kann nicht mehr festgeschrieben werden.
function buchungssperreSection() {
  const input = el('input', { type: 'text', placeholder: 'YYYY-MM-DD' });
  const status = el('span', { class: 'muted small' });
  getBuchungssperre().then((d) => { input.value = d || ''; }).catch(() => {});
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.sperre') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', { class: 'btn btn-sm', text: t('common.save'), onClick: async () => { await setBuchungssperre(input.value.trim()); status.textContent = t('settings.saved'); } }),
      el('button', { class: 'btn btn-sm', text: t('settings.sperreClear'), onClick: async () => { input.value = ''; await setBuchungssperre(''); status.textContent = t('settings.saved'); } }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.sperreHint') }),
  ]);
}

// Firmenprofil (Rechnungssteller-Stammdaten, §14 UStG) — verschlüsselt in Settings.
function firmaSection(s) {
  const f = s.firma || {};
  const inp = (val, ph) => {
    const e = el('input', { type: 'text', value: val || '', placeholder: ph });
    e.addEventListener('input', () => { _firmaSaved = false; status.textContent = ''; });
    return e;
  };
  const status = el('span', { class: 'muted small', text: _firmaSaved ? t('settings.saved') : '' });
  const name = inp(f.name, t('settings.firma.name'));
  const anschrift = inp(f.anschrift, t('settings.firma.anschrift'));
  const steuernummer = inp(f.steuernummer, t('settings.firma.steuernummer'));
  const ustId = inp(f.ustId, t('settings.firma.ustId'));
  const iban = inp(f.iban, t('settings.firma.iban'));
  const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.firma') }),
    el('p', { class: 'muted small', text: t('settings.firma.hint') }),
    el('div', { class: 'form-grid' }, [
      field(t('settings.firma.name'), name),
      field(t('settings.firma.anschrift'), anschrift),
      field(t('settings.firma.steuernummer'), steuernummer),
      field(t('settings.firma.ustId'), ustId),
      field(t('settings.firma.iban'), iban),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm btn-primary', text: t('settings.save'),
        onClick: async () => {
          await updateSettings({ firma: {
            name: name.value.trim(), anschrift: anschrift.value.trim(),
            steuernummer: steuernummer.value.trim(), ustId: ustId.value.trim(), iban: iban.value.trim(),
          } });
          _firmaSaved = true;     // überlebt das durch updateSettings ausgelöste Re-Render
          paint();
        },
      }),
      status,
    ]),
  ]);
}

// BYOK-EU-KI-Konfiguration (Google Vision EU + Mistral EU). Lädt verschlüsselt nach.
function aiConfigSection() {
  const host = el('div', { class: 'setting' });
  (async () => {
    const cfg = await getAiConfig().catch(() => ({ visionKey: '', mistralKey: '', mistralModel: 'mistral-small-latest', anbieterWahl: undefined }));
    const visionKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'AIza… (Google Vision EU)', value: cfg.visionKey || '' });
    const mistralKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'Mistral API-Key (EU)', value: cfg.mistralKey || '' });
    const speechKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'AIza… (Google Speech-to-Text EU)', value: cfg.speechKey || '' });
    const model = el('select', {}, MISTRAL_MODELS.map((m) => el('option', { value: m.id }, m.label)));
    model.value = cfg.mistralModel;
    const status = el('p', { class: 'muted small' });

    // KI-Anbieter je Funktion (strikt EU). Ein Select je Modus, nur erlaubte (EU/lokale) Anbieter.
    const wahl = normalizeAnbieterWahl(cfg.anbieterWahl);
    const wahlSelects = {};
    const anbieterFeld = (modus) => {
      const sel = el('select', {}, erlaubteAnbieter(modus).map((a) => el('option', { value: a.id }, t('settings.aiProv.' + a.id))));
      sel.value = wahl[modus];
      wahlSelects[modus] = sel;
      return el('label', { class: 'field' }, [el('span', { text: t('settings.aiMode.' + modus) }), sel]);
    };
    const aktuelleWahl = () => { const w = {}; for (const m of KI_MODI) w[m] = wahlSelects[m].value; return w; };

    const aktuelleConfig = () => ({
      visionKey: visionKey.value.trim(), mistralKey: mistralKey.value.trim(),
      speechKey: speechKey.value.trim(),
      mistralModel: model.value, anbieterWahl: aktuelleWahl(),
    });

    const save = el('button', {
      class: 'btn', text: t('settings.aiSave'),
      onClick: async () => {
        await saveAiConfig(aktuelleConfig());
        status.textContent = t('settings.aiSaved') + ' ' + t('settings.aiPersistHint');
      },
    });

    // Test-Knopf: speichert erst, dann ruft die Live-API minimal an.
    const testRow = (label, runTest, getVal) => {
      const out = el('div', { class: 'test-status muted small' });
      const btn = el('button', {
        class: 'btn btn-sm', text: t('settings.aiTest'),
        onClick: async () => {
          await saveAiConfig(aktuelleConfig());
          if (!getVal()) { out.textContent = '—'; return; }
          out.textContent = '…';
          const r = await runTest();
          out.className = 'test-status small ' + (r.ok ? 'ok' : 'fail');
          out.replaceChildren(el('span', { text: r.ok ? t('settings.aiTestOk') : (t('settings.aiTestFail') + ' ' + r.message) }));
          if (!r.ok && r.hinweis) out.appendChild(el('div', { class: 'muted small', text: '→ ' + r.hinweis }));
        },
      });
      return el('div', { class: 'test-row' }, [el('span', { class: 'muted small', text: label }), btn, out]);
    };

    const keyLink = (href) => el('a', { class: 'provider-link small', href, target: '_blank', rel: 'noopener', text: t('settings.aiGetKey') });
    const fieldWithLink = (label, input, href) => el('label', { class: 'field' }, [
      el('span', {}, [el('span', { text: label }), el('span', { text: ' · ' }), keyLink(href)]),
      input,
    ]);

    host.replaceChildren(
      el('div', { class: 'setting-label', text: t('settings.aiExternal') }),
      fieldWithLink(t('settings.aiVisionKey'), visionKey, 'https://console.cloud.google.com/apis/credentials'),
      el('div', { class: 'vision-guide muted small' }, [
        el('p', { class: 'vision-guide-intro', text: t('settings.aiVisionGuide') }),
        el('ol', { class: 'vision-steps' }, [
          el('li', {}, [el('a', { class: 'provider-link', href: 'https://console.cloud.google.com/apis/library/vision.googleapis.com', target: '_blank', rel: 'noopener', text: t('settings.aiVisionStep1') })]),
          el('li', {}, [el('a', { class: 'provider-link', href: 'https://console.cloud.google.com/billing', target: '_blank', rel: 'noopener', text: t('settings.aiVisionStep2') })]),
          el('li', {}, [el('a', { class: 'provider-link', href: 'https://console.cloud.google.com/apis/credentials', target: '_blank', rel: 'noopener', text: t('settings.aiVisionStep3') })]),
        ]),
        el('p', { class: 'vision-guide-note', text: t('settings.aiVisionStepNote') }),
        el('details', { class: 'vision-walk' }, [
          el('summary', { text: t('settings.aiVisionWalkTitle') }),
          el('ol', { class: 'vision-walk-steps' }, t('settings.aiVisionWalk').split('\n').map((s) => el('li', { text: s }))),
          el('p', { class: 'vision-guide-note', text: t('settings.aiVisionWalkNote') }),
        ]),
      ]),
      fieldWithLink(t('settings.aiMistralKey'), mistralKey, 'https://console.mistral.ai/api-keys'),
      el('p', { class: 'muted small', text: t('settings.aiMistralHint') }),
      fieldWithLink(t('settings.aiSpeechKey'), speechKey, 'https://console.cloud.google.com/apis/credentials'),
      el('p', { class: 'muted small' }, [
        el('span', { text: t('settings.aiSpeechHint') + ' ' }),
        el('a', { class: 'provider-link', href: 'https://console.cloud.google.com/apis/library/speech.googleapis.com', target: '_blank', rel: 'noopener', text: t('settings.aiSpeechEnable') }),
      ]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.aiModel') }), model]),
      el('div', { class: 'setting-label', text: t('settings.aiProviderTitle') }),
      el('p', { class: 'muted small', text: t('settings.aiProviderHint') }),
      ...KI_MODI.map((m) => anbieterFeld(m)),
      el('div', { class: 'btn-row' }, [save]),
      testRow('Google Vision', testVision, () => visionKey.value.trim()),
      testRow('Mistral', testMistral, () => mistralKey.value.trim()),
      el('p', { class: 'muted small', text: t('settings.aiPrivacy') }),
      el('p', { class: 'muted small', text: t('settings.aiPersistHint') }),
      status,
    );
  })();
  return host;
}

function viewPlaceholder(route) {
  const labelKey = (NAV.find(([k]) => k === route) || [null, 'nav.dashboard'])[1];
  return el('section', { class: 'view' }, [
    el('h1', { text: t(labelKey) }),
    el('div', { class: 'card placeholder' }, [
      el('p', { class: 'muted', text: t('common.comingSoon') }),
    ]),
  ]);
}
