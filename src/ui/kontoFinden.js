// src/ui/kontoFinden.js — Knopf „Passendes Konto finden“ (Pro-Umbau 11, Klaus 2026-10-30, Ja zu m2).
// Die Kontosuche war ein Bereich der Seite „SBKIM-Suche“; jetzt steht sie dort, wo man sie braucht: in „Neue Buchung“ und bei den
// Konten. Erst sofort und ohne Modell über die Wörter (Kontoname + Alltags-Stichworte aus kontoSynonyme.js), auf Wunsch „Nach
// Bedeutung“ (dasselbe Sprachmodell wie die Belegsuche, lädt einmal) und nur mit Schalter eine KI-Prüfung (Mistral EU, Klaus m12).
// In „Neue Buchung“ setzt ein Tipp das Konto als Soll oder Haben; bei den Konten zeigt die Liste nur Nummer und Name.

import { el } from './dom.js';
import { t } from './i18n.js';
import { loadAccounts } from '../domain/store.js';
import { accountCorpusEntries, embedCorpus } from '../sbkim/searchCorpus.js';
import { kontoWortTreffer } from '../domain/ueberall.js';
import { getAiConfig } from '../ai/aiConfig.js';

let _vektoren = null;   // eingebettete Konten dieser Sitzung (nur RAM)

/**
 * @param {{ setzen?: (nummer:string, seite:'soll'|'haben') => void }} [opt]
 */
export function kontoFindenKnopf(opt = {}) {
  return el('button', { class: 'btn', type: 'button', 'data-konto-finden': '', text: t('kf.knopf'), onClick: () => kontoFindenDialog(opt) });
}

export async function kontoFindenDialog(opt = {}) {
  document.querySelector('[data-konto-finden-dialog]')?.closest('.modal-overlay')?.remove();
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('kf.knopf') });
  const zu = () => { overlay.remove(); document.removeEventListener('keydown', esc); };
  const esc = (e) => { if (e.key === 'Escape') zu(); };
  document.addEventListener('keydown', esc);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) zu(); });

  const konten = await loadAccounts().catch(() => []);
  const eintraege = accountCorpusEntries(konten);
  const input = el('input', { type: 'search', class: 'beleg-text', 'data-kf-frage': '', placeholder: t('kf.platzhalter'), 'data-mikro': '', 'data-mikro-key': 'kontofinden', 'aria-label': t('kf.knopf') });
  const status = el('p', { class: 'muted small', role: 'status', 'data-kf-status': '' });
  const liste = el('ul', { class: 'ue-ul', 'data-kf-liste': '' });
  const ki = el('input', { type: 'checkbox', role: 'switch', 'data-kf-ki': '' });

  const zeigen = (treffer, satz) => {
    status.textContent = satz || '';
    liste.replaceChildren(...treffer.map((x) => {
      const nr = String(x.anchorId || '').trim();
      return el('li', { class: 'ue-zeile', 'data-kf-konto': nr }, [
        el('strong', { text: x.label }),
        x.begruendung ? el('span', { class: 'muted small', text: x.begruendung }) : null,
        opt.setzen ? el('span', { class: 'btn-row' }, [
          el('button', { class: 'btn btn-sm', type: 'button', 'data-kf-soll': nr, text: t('kf.alsSoll'), onClick: () => { opt.setzen(nr, 'soll'); zu(); } }),
          el('button', { class: 'btn btn-sm', type: 'button', 'data-kf-haben': nr, text: t('kf.alsHaben'), onClick: () => { opt.setzen(nr, 'haben'); zu(); } }),
        ]) : null,
      ].filter(Boolean));
    }));
  };
  const woerter = () => {
    const q = input.value.trim();
    if (!q) return zeigen([], '');
    const tr = kontoWortTreffer(eintraege, q);
    zeigen(tr, tr.length ? '' : t('kf.keinWort'));
  };
  input.addEventListener('input', woerter);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); woerter(); } });

  const bedeutungKnopf = el('button', { class: 'btn', type: 'button', 'data-kf-bedeutung': '', text: t('kf.bedeutung'), onClick: async () => {
    const q = input.value.trim();
    if (!q) return;
    bedeutungKnopf.setAttribute('disabled', '');
    try {
      const { loadEmbedder } = await import('../sbkim/embed.js');
      const { sbkimHybridSearch } = await import('../sbkim/hybridSearch.js');
      const embedder = await loadEmbedder({ onStatus: (s) => { status.textContent = s; } });
      if (!_vektoren) _vektoren = await embedCorpus(eintraege, embedder.embedPassage, (d, n) => { status.textContent = t('kf.ordnet').replace('{d}', String(d)).replace('{n}', String(n)); });
      const cfg = ki.checked ? await getAiConfig().catch(() => ({})) : {};
      const res = await sbkimHybridSearch(q, _vektoren, { apiKey: ki.checked ? cfg.mistralKey : undefined, provider: 'mistral', euOnly: true, queryLabel: 'BookLedgerPro', model: cfg.mistralModel, k: 8, minScore: 0, embedQuery: embedder.embedQuery });
      zeigen((res.treffer || []).filter((x) => !x.ausgeschlossen), res.mode === 'richter' ? t('kf.kiGeprueft') : (ki.checked && res.mode !== 'richter' ? t('kf.kiNichtDa') : ''));
    } catch (e) {
      status.textContent = t('kf.fehler').replace('{e}', String((e && e.message) || e));
    } finally { bedeutungKnopf.removeAttribute('disabled'); }
  } });

  overlay.appendChild(el('div', { class: 'modal', 'data-konto-finden-dialog': '' }, [
    el('div', { class: 'vorschau-kopf' }, [
      el('h2', { class: 'vorschau-titel', text: t('kf.knopf') }),
      el('button', { class: 'btn btn-ghost btn-sm vorschau-x', type: 'button', 'aria-label': t('common.close'), title: t('common.close'), text: '✕', onClick: zu }),
    ]),
    el('p', { class: 'muted small', text: t('kf.kurz') }),
    input,
    el('div', { class: 'btn-row' }, [bedeutungKnopf]),
    el('label', { class: 'ue-ki-zeile' }, [ki, el('span', { text: t('kf.kiSchalter') })]),
    status,
    liste,
  ]));
  document.body.appendChild(overlay);
  input.focus();
}
