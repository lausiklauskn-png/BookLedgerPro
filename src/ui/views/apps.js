// src/ui/views/apps.js — Eingebettete Apps: Workflow Calculate (Angebotsplaner) und Workflow Needs (Bedarfsanalyse).
// Klaus 2026-10-26: „Calculate … eins zu eins übernehmen … Als Brücke … So dass ein separates Feld aufgeht oder
// separate Fenster" · „Workflow Needs … direkt von BookLedgerPro aus die Bedarfsanalyse starten" · „Die Emojis, die
// Bilder und alles kannst du mit übernehmen … eindeutig zu erkennen" · Calculate ersetzt BLPs eigene Angebote
// komplett (D15b); der Datenbestand ist der der App (D16a: gleicher Ursprung = dieselben Angebote wie die installierte
// Einzel-PWA). Die Apps liegen byte-1:1 unter apps/<app>/ (tools/apps-nachziehen.mjs, Pins in apps/HERKUNFT.json);
// hier ist nur der Rahmen: Leiste mit App-Bild, Vollbild, eigenes Fenster, Offline-Vorrat, das <iframe> (gleicher
// Ursprung), Thema per postMessage hinein, Übergabe (Datenvertrag v1) per postMessage heraus.
import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { getSettings, updateSettings, subscribe, navigate } from '../../state.js';
import { merkeUebernahme, merkeUebernahmeFehler } from '../../domain/uebernahmeExtern.js';
import { listAngebote } from '../../domain/angebote-store.js';
import { APPS_VORRAT, themaNachricht, uebernahmeAusAdresse, appDateien } from '../../domain/eingebettet.js';
import { resolveHelligkeit } from '../theme.js';

export const APPS = Object.freeze({
  calculate: { pfad: './apps/calculate/index.html', bild: './apps/calculate/icons/icon-192.png', name: 'Workflow Calculate', unter: 'apps.calculate.unter', titel: 'nav.calculate' },
  needs: { pfad: './apps/needs/index.html', bild: './apps/needs/icons/icon-192.png', name: 'Workflow Needs', unter: 'apps.needs.unter', titel: 'nav.needs' },
});

/** Welches Thema BLP zeigt: aus den Einstellungen (Wahrheit nach dem Entsperren, „system" nach dem Gerät aufgelöst),
 *  sonst vom <html>, das theme.js schon vor dem Entsperren setzt. */
function aktuellesThema() {
  const h = document.documentElement, s = getSettings();
  const geraetDunkel = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = s.theme ? resolveHelligkeit(s.theme, geraetDunkel) : h.getAttribute('data-theme');
  return themaNachricht(theme, s.themeFarbe || h.getAttribute('data-farbe'));
}

// Die App-Fenster leben DAUERHAFT außerhalb der Shell (#blp-app-frames am <body>): die Shell zeichnet sich bei jeder
// Einstellung neu (mount leert den Behälter) — ein <iframe> darin würde jedes Mal neu laden (gemessen: „Frame was
// detached" beim Thema-Wechsel). Darum: je App EIN Fenster, einmal geladen, über den Platzhalter der Ansicht gelegt
// (position: fixed, Maße vom Platzhalter), beim Seitenwechsel nur verborgen — Eingaben in der App bleiben erhalten.
const _frames = new Map();   // key → iframe
let _hoert = false;
let _beobachter = null;
function traeger() {
  let d = document.getElementById('blp-app-frames');
  if (!d) { d = el('div', { id: 'blp-app-frames' }); document.body.appendChild(d); }
  return d;
}
function frameFuer(key) {
  let f = _frames.get(key);
  if (f && f.isConnected) return f;
  const a = APPS[key];
  f = el('iframe', { class: 'app-frame', src: a.pfad, title: a.name, 'data-app-frame': key, allow: 'clipboard-write' });
  f.addEventListener('load', () => { try { f.contentWindow.postMessage(aktuellesThema(), location.origin); } catch { /* gleicher Ursprung, nie fremd */ } });
  traeger().appendChild(f);
  _frames.set(key, f);
  return f;
}
/** Legt das Fenster der angezeigten App über ihren Platzhalter; alle anderen verbergen. */
export function fensterLegen() {
  const platz = document.querySelector('[data-app-platz]');
  const akt = platz ? platz.getAttribute('data-app-platz') : null;
  for (const [key, f] of _frames) {
    if (key !== akt || !platz) { f.style.display = 'none'; continue; }
    const r = platz.getBoundingClientRect();
    const voll = !!platz.closest('.app-rahmen.vollbild');
    Object.assign(f.style, { display: 'block', position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: voll ? '61' : '5' });
  }
}
function hoeren() {
  if (_hoert) return; _hoert = true;
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const frame = [..._frames.values()].find((f) => f.contentWindow === e.source);
    if (!frame) return;   // nur unsere Fenster (Membran-Regel: fremde Quellen ignorieren)
    if (e.data.typ === 'blp-bereit') { try { e.source.postMessage(aktuellesThema(), location.origin); } catch { /* Fenster weg */ } }
    if (e.data.typ === 'blp-uebernahme') {
      const u = uebernahmeAusAdresse(e.data.url);
      if (u) merkeUebernahme(u); else merkeUebernahmeFehler();
      if (typeof window !== 'undefined') window.__blpAppsUebernahme = { app: e.data.app, ok: !!u };
      navigate(u && u.art === 'buchhaltung-summen' ? 'shopbuchung' : 'angebote');
    }
  });
  // Nach jedem Neuzeichnen der Shell (Einstellung, Seitenwechsel): Thema nachreichen, Fenster neu legen oder verbergen.
  subscribe(() => { const m = aktuellesThema(); for (const f of _frames.values()) { try { f.contentWindow.postMessage(m, location.origin); } catch { /* noch nicht geladen */ } } fensterLegen(); });
  window.addEventListener('resize', fensterLegen);
  window.addEventListener('scroll', fensterLegen, true);
  if (typeof ResizeObserver !== 'undefined') _beobachter = new ResizeObserver(fensterLegen);
  setInterval(fensterLegen, 400);   // Sicherheitsnetz (Leisten, Tastatur, Schublade) — billig: nur Maße lesen
}

/** Alle App-Dateien aus apps/HERKUNFT.json in den Vorrat legen (einmal, danach offline). */
export async function offlineBereitlegen(app, melde) {
  const r = await fetch('./apps/HERKUNFT.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('HERKUNFT.json ' + r.status);
  const liste = appDateien(await r.json(), app);
  if (!liste.length) throw new Error('App nicht in HERKUNFT.json');
  const c = await caches.open(APPS_VORRAT);
  let n = 0;
  for (const u of liste) {
    const res = await fetch(u, { cache: 'no-store' });
    if (!res.ok) throw new Error(u + ' ' + res.status);
    await c.put(new Request(u), res);
    n++; if (melde) melde(n, liste.length);
  }
  return n;
}

export function mountApp(host, key) {
  const a = APPS[key];
  if (!a) return;
  hoeren();
  const stand = el('span', { class: 'muted small', 'data-apps-offline-stand': '' });
  const rahmen = el('section', { class: 'app-rahmen', 'data-app': key });
  const platz = el('div', { class: 'app-frame-platz', 'data-app-platz': key });
  const alte = el('button', { class: 'btn btn-sm', type: 'button', hidden: true, 'data-apps-alte-angebote': '', onClick: () => { updateSettings({ angeboteAlt: true }, { still: true }); navigate('angebote'); } });
  if (key === 'calculate') listAngebote().then((l) => { if (l.length) { alte.textContent = t('apps.alteAngebote').replace('{n}', String(l.length)); alte.hidden = false; } }).catch(() => {});
  const leiste = el('div', { class: 'app-leiste' }, [
    el('img', { class: 'app-bild', src: a.bild, alt: '', width: '28', height: '28' }),
    el('div', { class: 'app-titel' }, [el('b', { text: a.name }), el('span', { class: 'muted small', text: t(a.unter) })]),
    el('div', { class: 'app-knoepfe' }, [
      alte,
      el('button', { class: 'btn btn-sm', type: 'button', 'data-apps-vollbild': '', text: t('apps.vollbild'), onClick: () => { rahmen.classList.toggle('vollbild'); fensterLegen(); } }),
      el('a', { class: 'btn btn-sm', href: a.pfad, target: '_blank', rel: 'noopener', 'data-apps-fenster': '', text: t('apps.fenster') }),
      el('button', { class: 'btn btn-sm', type: 'button', 'data-apps-offline': '', text: t('apps.offline'), onClick: async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try { const n = await offlineBereitlegen(key, (i, m) => { stand.textContent = t('apps.offlineLaeuft').replace('{i}', String(i)).replace('{m}', String(m)); }); stand.textContent = t('apps.offlineFertig').replace('{n}', String(n)); }
        catch (e) { stand.textContent = t('apps.offlineFehler').replace('{e}', String((e && e.message) || e)); }
        finally { b.disabled = false; }
      } }),
      stand,
    ]),
  ]);
  rahmen.append(leiste, platz);
  mount(host, rahmen);
  frameFuer(key);
  if (_beobachter) _beobachter.observe(platz);
  fensterLegen();
}
