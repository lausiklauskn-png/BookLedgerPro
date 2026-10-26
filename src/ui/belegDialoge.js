// src/ui/belegDialoge.js — die Dialoge rund um Prüfung und Reinigung der Belege
// (Klaus 2026-10-14). Fremder Inhalt (Dateinamen, gefundene Zeilen, Angaben) steht
// IMMER als Text da, nie als HTML (el(..., {text}) setzt textContent).

import { el } from './dom.js';
import { t } from './i18n.js';
import { downloadText } from '../core/files.js';
import { berichtText } from '../domain/kiReinigung.js';

/** Der Drehkreis (Klaus 2026-10-14: „man muss zumindest sehen, dass da was passiert"). */
export function drehkreis() { return el('span', { class: 'pruef-dreh', 'aria-hidden': 'true' }); }

/**
 * Eine Arbeitsleiste unten am Schirm, solange etwas läuft, das dauert (Seiten zeichnen,
 * Texterkennung, Kontierung). Nicht modal: die Halte-Dialoge liegen darüber.
 * @returns {{setzen:(text:string)=>void, weg:()=>void}}
 */
export function arbeitsAnzeige(text) {
  const txt = el('span', { text });
  const leiste = el('div', { class: 'arbeits-leiste', role: 'status', 'aria-live': 'polite', 'data-arbeit': '' }, [drehkreis(), txt]);
  document.body.appendChild(leiste);
  const merke = (s) => { if (typeof window !== 'undefined') (window.__blpArbeit = window.__blpArbeit || []).push(s); };   // Probe
  merke(text);
  return {
    setzen(s) { txt.textContent = s; merke(s); },
    weg() { leiste.remove(); },
  };
}

/** Ein modaler Dialog. knoepfe: [{text, wert, primaer, data}] → Promise mit dem `wert`. */
export function dialog(titel, teile, knoepfe, attr = {}) {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
    const fertig = (w) => { overlay.remove(); document.removeEventListener('keydown', esc); resolve(w); };
    const esc = (e) => { if (e.key === 'Escape') fertig(null); };
    const box = el('div', { class: 'modal modal-weit', ...attr }, [
      el('h2', { text: titel }),
      ...teile.filter(Boolean),
      el('div', { class: 'btn-row' }, knoepfe.map((k) => el('button', {
        class: 'btn' + (k.primaer ? ' btn-primary' : ''), type: 'button', text: k.text,
        ...(k.data ? { [k.data]: '' } : {}),
        onClick: () => fertig(k.wert),
      }))),
    ]);
    overlay.appendChild(box);
    document.addEventListener('keydown', esc);
    document.body.appendChild(overlay);
  });
}

function grundText(g) {
  const RE = window.WFP && window.WFP.Reinigung;
  return (RE && RE.grundSatz(g)) || String(g || '');
}

/** Liste gefundener/entfernter Stücke (höchstens 8 sichtbar). */
function stueckListe(liste, attr) {
  const ul = el('ul', { class: 'hinweis-liste', [attr]: '' });
  for (const e of liste.slice(0, 8)) {
    ul.appendChild(el('li', { class: 'small', 'data-grund': e.grund || '' }, [
      el('strong', { text: grundText(e.grund) }),
      e.seite ? ` · ${t('beleg.seite')} ${e.seite}` : '',
      el('br'),
      `„${String(e.text || '').slice(0, 160)}"`,
    ]));
  }
  if (liste.length > 8) ul.appendChild(el('li', { class: 'small muted', text: t('beleg.mehr').replace('{n}', String(liste.length - 8)) }));
  return ul;
}

/** Halt vor dem Senden: versteckter Text gefunden. → true (ohne ihn senden) | false (abbrechen). */
export async function kiReinigungHalt(name, liste) {
  const w = await dialog(t('beleg.haltTitel'), [
    el('p', { text: t('beleg.haltText').replace('{n}', name || '') }),
    stueckListe(liste, 'data-ki-halt-liste'),
    el('p', { class: 'small', text: t('beleg.haltSchluss') }),
  ], [
    { text: t('beleg.abbrechen'), wert: false, data: 'data-ki-nein' },
    { text: t('beleg.ohneSenden'), wert: true, primaer: true, data: 'data-ki-ja' },
  ], { 'data-ki-halt': '' });
  return w === true;
}

/** Halt: der Beleg ist noch nie geprüft worden. → 'pruefen' | 'weiter' | null */
export function ungeprueftHalt(name) {
  return dialog(t('beleg.ungeprueftTitel'), [
    el('p', { text: t('beleg.ungeprueftText').replace('{n}', name || '') }),
  ], [
    { text: t('beleg.abbrechen'), wert: null, data: 'data-ungeprueft-abbrechen' },
    { text: t('beleg.ohnePruefung'), wert: 'weiter', data: 'data-ungeprueft-weiter' },
    { text: t('beleg.jetztPruefen'), wert: 'pruefen', primaer: true, data: 'data-ungeprueft-pruefen' },
  ], { 'data-ungeprueft-halt': '' });
}

/** Halt: der Beleg ist auffällig. → true (gereinigt senden) | false */
export async function auffaelligHalt(name, p, E) {
  const ul = el('ul', { class: 'hinweis-liste' });
  for (const f of (p && p.funde) || []) ul.appendChild(el('li', { class: 'small', 'data-kennung': f.kennung }, [
    el('strong', { text: (E && E.NAME[f.kennung]) || f.kennung }), ' — ' + (f.satz || ''),
  ]));
  const w = await dialog(t('beleg.auffaelligTitel'), [
    el('p', { text: t('beleg.auffaelligText').replace('{n}', name || '') }), ul,
    el('p', { class: 'small', text: t('beleg.auffaelligSchluss') }),
  ], [
    { text: t('beleg.abbrechen'), wert: false, data: 'data-auffaellig-nein' },
    { text: t('beleg.gereinigtSenden'), wert: true, primaer: true, data: 'data-auffaellig-ja' },
  ], { 'data-auffaellig-halt': '' });
  return w === true;
}

/** Halt: im erkannten Text steht eine Anweisung an eine KI. → 'ohne' | 'trotzdem' | 'lokal' */
export async function textHalt(zeilen) {
  const ul = el('ul', { class: 'hinweis-liste', 'data-text-halt-zeilen': '' },
    zeilen.slice(0, 6).map((z) => el('li', { class: 'small mono', text: `„${z.slice(0, 200)}"` })));
  const w = await dialog(t('beleg.textHaltTitel'), [
    el('p', { text: t('beleg.textHaltText') }), ul,
    el('p', { class: 'small', text: t('beleg.textHaltSchluss') }),
  ], [
    { text: t('beleg.nurLokal'), wert: 'lokal', data: 'data-text-lokal' },
    { text: t('beleg.trotzdem'), wert: 'trotzdem', data: 'data-text-trotzdem' },
    { text: t('beleg.ohneZeilen'), wert: 'ohne', primaer: true, data: 'data-text-ohne' },
  ], { 'data-text-halt': '' });
  return w || 'lokal';   // Esc = nichts zusätzlich hinaus
}

/**
 * Der Prüfbericht eines Belegs. aktionen: {erneut: async () => void}
 * @param {object|null} p  Ergebnis der Prüfung (null = noch nie geprüft)
 */
export async function pruefberichtZeigen(name, p, E, kiEntfernt, aktionen = {}) {
  const teile = [];
  const stand = p ? p.stand : 'offen';
  teile.push(el('p', { 'data-pruef-stand': stand, class: stand === 'warnung' ? 'form-error' : '',
    text: stand === 'warnung' ? t('beleg.standWarnung') : stand === 'sauber' ? t('beleg.standSauber')
      : stand === 'ungeprueft' ? t('beleg.standUngeprueft') : t('beleg.standOffen') }));
  if (p && p.zeit) teile.push(el('p', { class: 'muted small', text: `${t('beleg.geprueftAm')} ${String(p.zeit).slice(0, 16).replace('T', ' ')}` }));
  const funde = (p && p.funde) || [];
  if (funde.length) {
    teile.push(el('ul', { class: 'hinweis-liste', 'data-pruef-funde': '' }, funde.map((f) => el('li', { 'data-kennung': f.kennung }, [
      el('strong', { text: (E && E.NAME[f.kennung]) || f.kennung }), ' — ' + (f.satz || ''),
    ]))));
    const schritte = [];
    for (const f of funde) for (const s of (E && E.wasTun(f.kennung)) || []) if (!schritte.includes(s)) schritte.push(s);
    if (schritte.length) {
      teile.push(el('strong', { class: 'small', text: t('beleg.wasTun') }));
      teile.push(el('ol', { class: 'hinweis-liste', 'data-was-tun': '' }, schritte.map((s) => el('li', { class: 'small', text: s }))));
    }
  }
  if (p && p.markiert && /^data:image\/jpeg;base64,/.test(p.markiert)) {
    teile.push(el('img', { src: p.markiert, alt: t('beleg.markiert'), 'data-pruef-markiert': '', style: 'max-width:100%;border-radius:8px;margin-top:.5rem' }));
    teile.push(el('p', { class: 'muted small', text: t('beleg.markiertHinweis') }));
  }
  const herkunft = (p && p.herkunft) || [];
  if (herkunft.length) {
    const d = el('details', { 'data-herkunft-details': '' }, [el('summary', { class: 'small', text: t('beleg.herkunftDetails') })]);
    for (const h of herkunft) {
      d.appendChild(el('p', { class: 'small', text: h.satz || h.kennung }));
      const dl = el('dl', { class: 'siegel-modal-dl' });
      for (const [k, v] of h.daten || []) { dl.appendChild(el('dt', { text: k })); dl.appendChild(el('dd', { text: v })); }
      d.appendChild(dl);
    }
    d.appendChild(el('p', { class: 'muted small', text: t('beleg.herkunftHinweis') }));
    teile.push(el('div', { 'data-herkunft': '' }, [el('strong', { class: 'small', text: t('beleg.herkunft') }), d]));
  }
  const angaben = (p && p.angaben) || [];
  if (angaben.length) {
    teile.push(el('details', { 'data-angaben': '' }, [
      el('summary', { class: 'small', text: t('beleg.angaben').replace('{n}', String(angaben.length)) }),
      el('ul', { class: 'hinweis-liste' }, angaben.map((a) => el('li', { class: 'small', 'data-kennung': a.kennung }, [
        el('strong', { text: (E && E.ANGABE_NAME[a.kennung]) || a.kennung }), ' — ' + (a.satz || ''),
      ]))),
    ]));
  }
  for (const h of ((p && p.hinweise) || []).slice(0, 4)) teile.push(el('p', { class: 'muted small', text: h }));
  if (kiEntfernt && kiEntfernt.length) {
    teile.push(el('details', { 'data-ki-entfernt': '' }, [
      el('summary', { class: 'small', text: `🧽 ${t('beleg.kiEntfernt')} · ${kiEntfernt.length}` }),
      el('p', { class: 'muted small', text: t('beleg.kiEntferntText') }),
      el('ul', { class: 'hinweis-liste' }, kiEntfernt.map((v) => el('li', { class: 'small', 'data-grund': v.grund }, [
        el('strong', { text: grundText(v.grund) }), (v.seite ? ` · ${t('beleg.seite')} ${v.seite}` : '') + ` · ${String(v.zeit || '').slice(0, 10)} · ${v.weg || ''}`,
        el('br'), `„${v.text || ''}"`,
      ]))),
    ]));
  }
  teile.push(el('p', { class: 'muted small', text: t('beleg.keinVirus') }));
  const knoepfe = [{ text: t('common.close') || 'OK', wert: 'zu', primaer: true, data: 'data-pruef-ok' }];
  if (p) knoepfe.unshift({ text: t('beleg.berichtLaden'), wert: 'laden', data: 'data-bericht-laden' });
  if (aktionen.erneut) knoepfe.unshift({ text: p ? t('beleg.erneutPruefen') : t('beleg.jetztPruefen'), wert: 'erneut', data: 'data-pruef-erneut' });
  for (;;) {
    const w = await dialog(`${t('beleg.berichtTitel')}: ${name || ''}`, teile, knoepfe, { 'data-pruefbericht': stand });
    if (w === 'laden') {
      const txt = berichtText(name, p, { NAME: E && E.NAME, ANGABE_NAME: E && E.ANGABE_NAME, wasTun: E && E.wasTun, kiEntfernt });
      downloadText(`${String(name || 'Beleg').replace(/\.[a-z0-9]+$/i, '')}-Pruefbericht.txt`, '\uFEFF' + txt, 'text/plain');
      continue;
    }
    if (w === 'erneut' && aktionen.erneut) await aktionen.erneut();
    return w;
  }
}
