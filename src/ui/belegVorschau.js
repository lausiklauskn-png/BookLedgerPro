// src/ui/belegVorschau.js — Vorschau eines Belegs (Befund Tablet 2026-10-29, Klaus: „ich klicke einfach rauf, sehe nur den Text,
// aber ich kann da nicht sehen, was das für ein Dokument ist. Damit kann ich auch nicht löschen oder auch nicht weitergeben.“)
//
// Ein Tipp auf den Namen öffnet dieses Fenster: oben Name und Angaben, in der Mitte das Dokument selbst (PDF-Seiten mit pdf.js,
// Bild als Bild, sonst der erkannte Text), unten „An Pro-App geben …“ bzw. „Teilen …“, „Löschen“ und „Schließen“.
// Alles bleibt auf dem Gerät; pdf.js läuft mit isEvalSupported:false (wie überall in BLP). PDFs zeigen zuerst 3 Seiten,
// weitere auf Tipp.

import { el } from './dom.js';
import { t } from './i18n.js';
import { getBelegBytes, getBelegText } from '../domain/documents.js';
import { pdfVorschau } from '../ai/kiVorbereitung.js';
import { gebenKnopf } from './proAppGeben.js';

const ZUERST = 3;
const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(1) + ' KB');

/** Öffnet die Vorschau. loeschen: async () => true, wenn gelöscht (dieselbe Regel wie im ⋯-Menü). */
export function belegVorschau(b, { loeschen, angaben = [] } = {}) {
  document.querySelector('[data-beleg-vorschau]')?.closest('.modal-overlay')?.remove();
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': b.name || '' });
  const flaeche = el('div', { class: 'vorschau-flaeche', 'data-vorschau-flaeche': '' }, [el('p', { class: 'muted small', text: t('docs.vorschau.laedt') })]);
  const textSlot = el('div', { class: 'vorschau-text-slot' });
  let pdf = null, url = null;
  const zu = () => {
    overlay.remove(); document.removeEventListener('keydown', esc);
    if (pdf) pdf.schliessen(); if (url) URL.revokeObjectURL(url);
  };
  const esc = (e) => { if (e.key === 'Escape') zu(); };
  const loeschKnopf = el('button', { class: 'btn btn-sm', type: 'button', 'data-vorschau-loeschen': '', text: t('common.delete'),
    onClick: async () => { if (loeschen && (await loeschen())) zu(); } });
  const box = el('div', { class: 'modal modal-weit beleg-vorschau', 'data-beleg-vorschau': b.id }, [
    // Befund Tablet 2026-10-29 abends: ein X oben rechts schließt, ohne nach unten zu rollen.
    el('div', { class: 'vorschau-kopf' }, [
      el('h2', { class: 'vorschau-titel', text: b.name || '' }),
      el('button', { class: 'btn btn-ghost btn-sm vorschau-x', type: 'button', 'data-vorschau-x': '', title: t('docs.vorschau.schliessen'), 'aria-label': t('docs.vorschau.schliessen'), text: '✕', onClick: () => zu() }),
    ]),
    el('p', { class: 'muted small', text: [(b.mediaType || ''), kb(b.size || 0), (b.createdAt || '').slice(0, 10)].filter(Boolean).join(' · ') }),
    ...angaben.filter(Boolean).map((a) => el('p', { class: 'muted small', text: a })),
    flaeche,
    textSlot,
    el('div', { class: 'btn-row vorschau-knoepfe' }, [
      gebenKnopf(b, { imMenue: true }),
      loeschKnopf,
      el('button', { class: 'btn btn-sm btn-primary', type: 'button', 'data-vorschau-zu': '', text: t('docs.vorschau.schliessen'), onClick: zu }),
    ]),
  ]);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) zu(); });
  overlay.appendChild(box);
  document.addEventListener('keydown', esc);
  document.body.appendChild(overlay);

  const textZeigen = async (immer) => {
    const text = await getBelegText(b.id).catch(() => '');
    if (!text) { if (immer) textSlot.replaceChildren(el('p', { class: 'muted small', text: t('docs.vorschau.keine') })); return; }
    textSlot.replaceChildren(el('details', { class: 'vorschau-text', ...(immer ? { open: true } : {}) }, [
      el('summary', { class: 'small', text: t('docs.vorschau.text') }),
      el('pre', { class: 'vorschau-pre', text: String(text).slice(0, 20000) }),
    ]));
  };

  (async () => {
    try {
      const bytes = await getBelegBytes(b.id);
      if (!bytes) throw new Error('keine Bytes');
      const art = b.mediaType || '';
      if (art === 'application/pdf') {
        pdf = await pdfVorschau(bytes, Math.max(280, Math.min(900, flaeche.clientWidth || 600)));
        flaeche.replaceChildren();
        let naechste = 1;
        const zeichnen = async (bis) => {
          for (; naechste <= Math.min(bis, pdf.gesamt); naechste++) {
            const c = await pdf.seite(naechste);
            c.className = 'vorschau-seite';
            c.setAttribute('aria-label', t('docs.vorschau.seiten').replace('{n}', String(naechste)).replace('{g}', String(pdf.gesamt)));
            flaeche.appendChild(c);
          }
          flaeche.querySelector('[data-vorschau-mehr]')?.remove();
          if (naechste <= pdf.gesamt) flaeche.appendChild(el('button', { class: 'btn btn-sm', type: 'button', 'data-vorschau-mehr': '',
            text: t('docs.vorschau.mehrSeiten') + ' (' + (pdf.gesamt - naechste + 1) + ')', onClick: () => zeichnen(naechste + 4) }));
        };
        await zeichnen(ZUERST);
        await textZeigen(false);
      } else if (/^image\/(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(art)) {
        url = URL.createObjectURL(new Blob([bytes], { type: art }));
        flaeche.replaceChildren(el('img', { class: 'vorschau-bild', src: url, alt: b.name || '' }));
        await textZeigen(false);
      } else {
        flaeche.replaceChildren();
        await textZeigen(true);
      }
      if (typeof window !== 'undefined') window.__blpVorschau = { id: b.id, seiten: flaeche.querySelectorAll('canvas').length, bild: !!flaeche.querySelector('img') };   // Probe
    } catch {
      flaeche.replaceChildren(el('p', { class: 'muted small', 'data-vorschau-fehler': '', text: t('docs.vorschau.fehler') }));
      await textZeigen(true);
    }
  })();
  return overlay;
}
