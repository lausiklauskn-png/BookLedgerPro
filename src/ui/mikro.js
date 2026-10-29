// src/ui/mikro.js — 🎙 Mikrofon an JEDER Texteingabe, Sprachmarke je Feld, Wort-Speicher (Klaus 2026-10-26, Plan B1).
//
// Klaus: „überall, wo Texte eingegeben werden können, auch ein Mikrofon zum Texte einsprechen und die entsprechende
// Sprache." · „Langer Druck … ist etwas schwierig zu kommunizieren … besser in das Suchfeld mit die Sprache als DE,
// Englisch … mit einzugeben." · „Sprachwahl merken … den Speicher von der App müsste man auch löschen können … mit
// einem Speicher für das Wort merken. Das erleichtert das Ausfüllen."
//
// Was hier steht:
//   · Hinter jedem Textfeld (input ohne Typ / text / search, textarea) hängt eine flache Leiste `.mikro`:
//     🎙-Knopf (28 px, A5-Regel) und die SICHTBARE Sprachmarke „DE ▾" — ein Tipp öffnet die Liste, die Wahl wird
//     JE FELD gemerkt (settings.mikroSprachen[feldSchluessel]). Kein langer Druck.
//   · Erkannter Text wird AN DER CURSORSTELLE eingefügt (textEinfuegen), nie ersetzt; danach ein `input`-Ereignis,
//     damit die Ansicht es wie Tippen sieht.
//   · Engines wie in der SBKIM-Suche (ai/speech.js): Browser (Web Speech API; Audio geht an den Browser-Hersteller,
//     nicht EU — steht im Titel) oder EU (Google Speech-to-Text EU, eigener Schlüssel). EU-Politik „bindend" sperrt
//     die Browser-Engine. Fail-soft: kein Mikrofon/kein Recht → Hinweis im Titel, Feld bleibt tippbar.
//   · Wort-Speicher (settings.wortSpeicher[feldSchluessel]): einzeilige Felder merken ganze Eingaben → <datalist>
//     (die eigene Vervollständigung des Browsers); mehrzeilige Felder merken Wörter und zeigen beim Tippen bis zu
//     drei Ergänzungen als Chips. Der Speicher liegt im Tresor (verschlüsselt), geht nie an eine KI und ist in den
//     Einstellungen abschaltbar und löschbar.
//   · Angebracht wird NACH jedem Zeichnen (MutationObserver auf #app), einmal je Feld (data-mikro-ok).
//     Felder mit data-kein-mikro (die SBKIM-Suche hat ihr eigenes Mikrofon), Passwörter, Zahlen, Daten bleiben frei.
//
// Reine Helfer (feldSchluessel, textEinfuegen, Wort-Speicher) sind node-getestet (tests/run.mjs); der Browser-Teil
// in tests/smoke_mikro.mjs (echter Chromium, Spracherkennung gestellt).

import { el } from './dom.js';
import { t, getLang } from './i18n.js';
import { getSettings, updateSettings, getRoute } from '../state.js';
import { getAiConfig } from '../ai/aiConfig.js';
import { makeBrowserRecognizer, startRecording, recognizeEU, policyEngines, pickEngine, browserSpeechSupported, speechFehlerHinweis } from '../ai/speech.js';

/** Angebotene Sprachen: Code, Name, Marke. (Web Speech und Google Speech kennen alle.) */
export const SPRACHEN = Object.freeze([
  ['de-DE', 'Deutsch', 'DE'], ['en-US', 'English', 'EN'], ['ru-RU', 'Русский', 'RU'], ['pl-PL', 'Polski', 'PL'],
  ['uk-UA', 'Українська', 'UA'], ['tr-TR', 'Türkçe', 'TR'], ['fr-FR', 'Français', 'FR'], ['es-ES', 'Español', 'ES'],
  ['it-IT', 'Italiano', 'IT'], ['ar-SA', 'العربية', 'AR'],
]);
export const SPRACH_CODES = SPRACHEN.map(([c]) => c);
export const WORT_MAX = 300;        // Einträge je Feld
export const WORT_MIN = 2;          // Mindestlänge eines gemerkten Eintrags
export const VORSCHLAEGE_MAX = 3;

/** Sprache aus der App-Sprache (de → de-DE, en → en-US); unbekannt → de-DE. */
export function standardSprache(appLang) {
  return appLang === 'en' ? 'en-US' : 'de-DE';
}

/** Gültiger Code oder null. */
export function sprachCode(code) {
  return SPRACH_CODES.includes(code) ? code : null;
}

/** Marke zum Code („DE"), unbekannt → die ersten zwei Buchstaben groß. */
export function sprachMarke(code) {
  const e = SPRACHEN.find(([c]) => c === code);
  return e ? e[2] : String(code || '??').slice(0, 2).toUpperCase();
}

/**
 * Schlüssel eines Feldes für Sprach- und Wort-Speicher: Ansicht + stabiles Merkmal des Feldes
 * (data-mikro-key, name, id, aria-label, placeholder), zuletzt die Stelle unter den Textfeldern.
 * @param {{dataset?:object, name?:string, id?:string, getAttribute?:Function}} feld
 * @param {string} route
 * @param {number} [index]
 */
export function feldSchluessel(feld, route, index = 0) {
  const g = (k) => (feld && typeof feld.getAttribute === 'function' ? feld.getAttribute(k) : null) || '';
  const merkmal = (feld && feld.dataset && feld.dataset.mikroKey) || (feld && feld.name) || (feld && feld.id)
    || g('aria-label') || g('placeholder') || ('#' + index);
  return `${route || 'app'}:${String(merkmal).trim().slice(0, 60)}`;
}

/**
 * Fügt `text` an der Cursorstelle ein (ersetzt eine Markierung), setzt davor/danach ein Leerzeichen, wo keins ist.
 * @returns {{value:string, cursor:number}}
 */
export function textEinfuegen(value, selStart, selEnd, text) {
  const v = String(value == null ? '' : value);
  const s = Math.max(0, Math.min(Number.isInteger(selStart) ? selStart : v.length, v.length));
  const e = Math.max(s, Math.min(Number.isInteger(selEnd) ? selEnd : s, v.length));
  let neu = String(text == null ? '' : text).trim();
  if (!neu) return { value: v, cursor: e };
  const vor = v.slice(0, s), nach = v.slice(e);
  if (vor && !/\s$/.test(vor)) neu = ' ' + neu;
  if (nach && !/^\s/.test(nach)) neu = neu + ' ';
  return { value: vor + neu + nach, cursor: (vor + neu).length };
}

/** Wörter eines Textes für den Wort-Speicher (Buchstaben/Ziffern, ≥ WORT_MIN+1, keine reinen Zahlen). */
export function woerterAus(text) {
  const out = [];
  for (const w of String(text || '').split(/[^\p{L}\p{N}\-']+/u)) {
    const x = w.replace(/^[-']+|[-']+$/g, '');
    if (x.length > WORT_MIN && !/^\d+$/.test(x) && !out.includes(x)) out.push(x);
  }
  return out;
}

/**
 * Nimmt Einträge in den Wort-Speicher auf (rein, neues Objekt). Einzeilig: der ganze Wert; mehrzeilig: die Wörter.
 * Neueste vorn, entdoppelt, höchstens WORT_MAX je Feld.
 */
export function wortSpeicherAufnehmen(speicher, key, value, { mehrzeilig = false, max = WORT_MAX } = {}) {
  const alt = (speicher && Array.isArray(speicher[key])) ? speicher[key] : [];
  const neu = mehrzeilig ? woerterAus(value) : [String(value == null ? '' : value).trim()].filter((v) => v.length >= WORT_MIN);
  if (!neu.length) return speicher || {};
  const liste = [...neu, ...alt.filter((v) => !neu.includes(v))].slice(0, max);
  return { ...(speicher || {}), [key]: liste };
}

/** Bis zu n Vorschläge, die mit `prefix` beginnen (ohne Groß/Klein), nie der Prefix selbst. */
export function wortVorschlaege(speicher, key, prefix, n = VORSCHLAEGE_MAX) {
  const p = String(prefix || '').toLowerCase();
  if (p.length < 2) return [];
  const liste = (speicher && Array.isArray(speicher[key])) ? speicher[key] : [];
  return liste.filter((w) => w.toLowerCase().startsWith(p) && w.toLowerCase() !== p).slice(0, n);
}

/** Zahl aller gemerkten Einträge (für „löschen (N)"). */
export function wortSpeicherZahl(speicher) {
  return Object.values(speicher || {}).reduce((s, l) => s + (Array.isArray(l) ? l.length : 0), 0);
}

/** Das Wort, in dem der Cursor steht (für Ergänzungs-Chips). */
export function wortVorCursor(value, cursor) {
  const v = String(value || ''), c = Math.max(0, Math.min(Number.isInteger(cursor) ? cursor : v.length, v.length));
  const m = /[\p{L}\p{N}\-']+$/u.exec(v.slice(0, c));
  return m ? { wort: m[0], start: c - m[0].length, end: c } : null;
}

// ───────────────────────────── Browser-Teil ─────────────────────────────

const OHNE_TYP = new Set(['', 'text', 'search']);

/** Ist das Element ein Textfeld, das ein Mikrofon bekommt? */
export function istTextfeld(node) {
  if (!node || node.nodeType !== 1) return false;
  if (node.hasAttribute('data-kein-mikro') || node.disabled || node.readOnly) return false;
  if (node.tagName === 'TEXTAREA') return true;
  if (node.tagName !== 'INPUT') return false;
  return OHNE_TYP.has(String(node.getAttribute('type') || '').toLowerCase());
}

// Mikrofon nur, wo es Sinn hat (Klaus 2026-10-28, am Tablet: „Diese großen Mikrofone können weg, auch das DE“; in allen Pro-Apps
// gleich): an Suchfeldern und an echten Freitext-Notizen. Nicht an Beträgen, Daten, Namen, Positionen, Buchungstext. Der
// Wort-Speicher bleibt an jedem Textfeld (ohne sichtbare Leiste). Ausdrücklich: data-mikro (an) / data-kein-mikro (aus).
export const MIKRO_FREITEXT = /notiz|begr(?:ü|ue)nd|beschreib|description|bemerk|kommentar|vermerk|erl(?:ä|ae)uter|frage|note|reason|comment|remark|question/i;
export const MIKRO_SUCHE = /such|search|frage/i;
/** Bekommt dieses Textfeld Mikrofon und Sprachmarke? (Positivliste) */
export function mitMikrofon(node) {
  if (!istTextfeld(node)) return false;
  if (node.hasAttribute('data-mikro')) return true;
  const g = (k) => String(node.getAttribute(k) || '');
  const merkmal = [g('data-mikro-key'), g('name'), g('id'), g('aria-label'), g('placeholder'), g('class')].join(' ');
  const label = (node.closest && node.closest('label') ? node.closest('label').textContent : '') || '';
  if (node.tagName === 'INPUT') return g('type').toLowerCase() === 'search' || g('role') === 'searchbox' || MIKRO_SUCHE.test(merkmal)
    || !!(node.closest && node.closest('.suche-feld,.suche-kopf,[data-suche]'));
  return MIKRO_FREITEXT.test(merkmal + ' ' + label);
}

let _feldIndex = 0;
let _offeneListe = null;

function schliesseListe() {
  if (_offeneListe) { _offeneListe.hidden = true; _offeneListe = null; }
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => { if (_offeneListe && !_offeneListe.parentElement.contains(e.target)) schliesseListe(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') schliesseListe(); });
}

function feuerInput(feld) {
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  feld.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Setzt erkannten Text an der Cursorstelle ein. */
export function einsetzen(feld, text) {
  const { value, cursor } = textEinfuegen(feld.value, feld.selectionStart, feld.selectionEnd, text);
  if (value === feld.value) return;
  feld.value = value;
  try { feld.setSelectionRange(cursor, cursor); } catch { /* input ohne Auswahl */ }
  feuerInput(feld);
}

async function sprachePro(key) {
  const s = getSettings();
  const gem = sprachCode((s.mikroSprachen || {})[key]);
  if (gem) return gem;
  const std = sprachCode(s.mikroStandardSprache);
  return std || standardSprache(getLang());
}

async function spracheMerken(key, code) {
  const s = getSettings();
  await updateSettings({ mikroSprachen: { ...(s.mikroSprachen || {}), [key]: code } }, { still: true });
}

/** Hängt die Leiste an EIN Feld. */
function anbringen(feld) {
  if (feld.dataset.mikroOk) return;
  feld.dataset.mikroOk = '1';
  const route = getRoute();
  const key = feldSchluessel(feld, route, _feldIndex++);
  const mehrzeilig = feld.tagName === 'TEXTAREA';
  feld.dataset.mikroSchluessel = key;

  const status = el('span', { class: 'mikro-status muted small', 'aria-live': 'polite' });
  const marke = el('button', { class: 'btn btn-sm mikro-sprache', type: 'button', 'data-mikro-sprache': '', title: t('mikro.spracheTitel') });
  const liste = el('div', { class: 'mikro-liste', role: 'listbox', hidden: true });
  const knopf = el('button', { class: 'btn btn-sm mikro-knopf', type: 'button', 'data-mikro-knopf': '', 'aria-label': t('mikro.sprechen'), title: t('mikro.sprechen'), text: '🎙' });
  // In der App ohne Androids Sprachfenster (ältere Hülle) geht weder Web Speech noch Aufnahme → kein Mikrofon statt hängendem Feld.
  const appOhneSprache = typeof window !== 'undefined' && !!window.BLPNative && typeof window.BLPNative.sprechen !== 'function';
  const mitMik = mitMikrofon(feld) && !appOhneSprache;
  const leiste = mitMik ? el('span', { class: 'mikro', 'data-mikro': key }, [knopf, marke, status, liste])
    : el('span', { class: 'mikro mikro-ohne', 'data-mikro-ohne': key });

  const zeigeMarke = async () => { const code = await sprachePro(key); marke.textContent = sprachMarke(code) + ' ▾'; marke.dataset.code = code; marke.setAttribute('aria-label', t('mikro.spracheTitel') + ': ' + (SPRACHEN.find(([c]) => c === code) || [code, code])[1]); };
  liste.replaceChildren(...SPRACHEN.map(([code, name, kurz]) => el('button', {
    class: 'mikro-wahl', type: 'button', role: 'option', 'data-code': code, text: `${kurz} · ${name}`,
    onClick: async (e) => { e.stopPropagation(); await spracheMerken(key, code); await zeigeMarke(); schliesseListe(); knopf.focus(); },
  })));
  marke.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_offeneListe === liste) { schliesseListe(); return; }
    schliesseListe(); liste.hidden = false; _offeneListe = liste;
    const akt = liste.querySelector(`[data-code="${marke.dataset.code}"]`); if (akt) akt.focus();
  });
  if (mitMik) zeigeMarke();

  // Sprechen (Browser- oder EU-Engine)
  let aktiv = null;   // Web-Speech-Recognizer
  let aufnahme = null;   // EU-Aufnahme
  const ruhe = () => { knopf.textContent = '🎙'; knopf.classList.remove('mikro-an'); knopf.title = t('mikro.sprechen'); };
  knopf.addEventListener('click', async () => {
    status.textContent = '';
    const code = await sprachePro(key);
    let cfg = {};
    try { cfg = await getAiConfig(); } catch { /* Tresor zu */ }
    const engine = pickEngine(cfg.speechPolicy === 'bindend' ? 'bindend' : 'frei', 'browser', browserSpeechSupported());
    if (engine === 'browser') {
      if (aktiv) { aktiv.stop(); return; }
      const rec = makeBrowserRecognizer({ lang: code });
      if (!rec) { status.textContent = t('speech.unsupported'); return; }
      aktiv = rec; knopf.textContent = '⏹'; knopf.classList.add('mikro-an'); knopf.title = t('speech.listening') + ' · ' + t('mikro.hinweisBrowser');
      rec.onresult = (e) => { const tx = (((e.results || [])[0] || [])[0] || {}).transcript || ''; if (tx) { einsetzen(feld, tx); merkeWert(); } };
      // Jeder Fehler setzt den Knopf zurück (Befund Tablet 2026-10-28: blaues Feld blieb stehen, onend kam nie).
      rec.onerror = (e) => { status.textContent = speechFehlerHinweis(e && e.error) || t('speech.error').replace('%E%', String((e && e.error) || '')); aktiv = null; ruhe(); };
      rec.onend = () => { aktiv = null; ruhe(); };
      try { rec.start(); } catch { aktiv = null; ruhe(); }
      return;
    }
    if (aufnahme) {
      const ctl = aufnahme; aufnahme = null; knopf.setAttribute('disabled', ''); status.textContent = t('speech.transcribing');
      try {
        ctl.stop();
        const audio = await ctl.done;
        if (!cfg.speechKey) { status.textContent = t('speech.noKey'); return; }
        const alt = SPRACH_CODES.filter((c) => c !== code).slice(0, 3);
        const text = await recognizeEU(audio, { apiKey: cfg.speechKey, languageCode: code, alternativeLanguageCodes: alt });
        if (text) { einsetzen(feld, text); merkeWert(); status.textContent = ''; } else status.textContent = t('speech.empty');
      } catch (e) { status.textContent = speechFehlerHinweis(e && e.message) || t('speech.error').replace('%E%', String((e && e.message) || e)); }
      finally { knopf.removeAttribute('disabled'); ruhe(); }
      return;
    }
    try { aufnahme = await startRecording(); knopf.textContent = '⏹'; knopf.classList.add('mikro-an'); knopf.title = t('speech.recording'); }
    catch { status.textContent = t('speech.micDenied'); }
  });

  // Wort-Speicher
  let datalist = null;
  const zeigeWoerter = () => {
    const s = getSettings();
    if (s.wortSpeicherAn === false) return;
    const liste = (s.wortSpeicher || {})[key] || [];
    if (!mehrzeilig) {
      if (!liste.length) return;
      if (!datalist) { datalist = el('datalist', { id: 'mikro-dl-' + Math.random().toString(36).slice(2, 9) }); leiste.appendChild(datalist); if (!feld.getAttribute('list')) feld.setAttribute('list', datalist.id); }
      datalist.replaceChildren(...liste.slice(0, 30).map((v) => el('option', { value: v })));
    }
  };
  const merkeWert = async () => {
    const s = getSettings();
    if (s.wortSpeicherAn === false) return;
    const neu = wortSpeicherAufnehmen(s.wortSpeicher || {}, key, feld.value, { mehrzeilig });
    if (neu !== (s.wortSpeicher || {})) { await updateSettings({ wortSpeicher: neu }, { still: true }); zeigeWoerter(); }
  };
  feld.addEventListener('change', merkeWert);
  zeigeWoerter();
  if (mehrzeilig) {
    const chips = el('span', { class: 'mikro-woerter', 'data-mikro-woerter': '' });
    leiste.appendChild(chips);
    feld.addEventListener('input', () => {
      const s = getSettings();
      chips.replaceChildren();
      if (s.wortSpeicherAn === false) return;
      const w = wortVorCursor(feld.value, feld.selectionStart);
      if (!w) return;
      for (const v of wortVorschlaege(s.wortSpeicher || {}, key, w.wort)) {
        chips.appendChild(el('button', { class: 'btn btn-sm mikro-wort', type: 'button', 'data-wort': v, text: v, onClick: () => {
          const pos = wortVorCursor(feld.value, feld.selectionStart) || w;
          feld.value = feld.value.slice(0, pos.start) + v + feld.value.slice(pos.end);
          const c = pos.start + v.length; try { feld.setSelectionRange(c, c); } catch { /* ok */ }
          chips.replaceChildren(); feuerInput(feld); feld.focus();
        } }));
      }
    });
  }
  // Klaus 2026-10-29 spät: „Mikrofon, DE immer mit da rein, wo reingesprochen wird … nie eine neue Zeile anfangen“ — die Leiste
  // sitzt rechts IM Feld (Hülle .mikro-im-feld). Ohne Mikrofon bleibt nur der unsichtbare Wort-Speicher hinter dem Feld.
  if (mitMik) {
    const huelle = el('span', { class: 'mikro-im-feld' + (mehrzeilig ? ' mikro-mehrzeilig' : ''), 'data-mikro-huelle': '' });
    feld.before(huelle); huelle.append(feld, leiste);
  } else feld.after(leiste);
}

/** Hängt Mikrofone an alle Textfelder unter `root`. */
export function mikrofonAnbringen(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  let n = 0;
  for (const f of root.querySelectorAll('input, textarea')) {
    if (!istTextfeld(f)) continue;
    if (f.closest('.mikro')) continue;
    anbringen(f); n++;
  }
  return n;
}

let _beobachter = null;
/** Beobachtet #app (oder `root`) und bringt Mikrofone an neue Felder an — einmal aufrufen. */
export function mikrofonBeobachten(root) {
  const ziel = root || document.getElementById('app') || document.body;
  if (_beobachter) return _beobachter;
  mikrofonAnbringen(ziel);
  let timer = 0;
  _beobachter = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(() => mikrofonAnbringen(ziel), 30); });
  _beobachter.observe(ziel, { childList: true, subtree: true });
  return _beobachter;
}
