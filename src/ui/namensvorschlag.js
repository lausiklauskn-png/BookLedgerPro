// src/ui/namensvorschlag.js — die Knöpfe „＋ Name" unter einem Text, der an die KI gehen soll.
// Nur im Pseudonym-Modus. Ein Tipp nimmt den Namen in „Weitere Namen" auf; der Vorschlag selbst
// verdeckt nichts. Namen sind Text, nie HTML.
import { el } from './dom.js';
import { t } from './i18n.js';
import { getSettings, updateSettings } from '../state.js';
import { ladeAnker } from '../ai/anker.js';
import { namensVorschlaege, nameAufnehmen } from '../ai/namensvorschlag.js';
import { namenImText } from '../ai/namensmuster.js';
import { handListe } from '../ai/anker.js';

/**
 * @param {() => string} textVon  liefert den aktuellen Text
 * @returns {{box: HTMLElement, aktualisiere: () => Promise<void>}}
 */
export function namenVorschlagBox(textVon) {
  const box = el('div', { class: 'hinweis small', 'data-namen-vorschlag': '', 'data-anzahl': '0' });
  box.hidden = true;
  let lauf = 0;
  async function aktualisiere() {
    const nr = ++lauf;
    const text = textVon() || '';
    if (getSettings().datenschutzModus !== 'pseudonym' || !text.trim()) { box.hidden = true; box.dataset.anzahl = '0'; return; }
    const s = getSettings();
    const anker = await ladeAnker(text);
    // Nach Muster verdeckte Namen (Klaus 2026-10-26): sie SIND schon Anker (ladeAnker) — hier sichtbar, gelb,
    // je Treffer rücknehmbar („kein Name" → „Nie verdecken"). Was ein Mensch eingetragen hat, zählt nicht dazu.
    const hand = new Set([...handListe(s.kiWeitereNamen), ...handListe(s.kiNieVerdecken)]);
    const muster = s.namensmuster === false ? [] : namenImText(text, { schutz: handListe(s.kiNieVerdecken) })
      .filter((m, i, arr) => !hand.has(m.wert) && arr.findIndex((x) => x.wert === m.wert) === i);
    const verdeckt = new Set(muster.map((m) => m.wert));
    const vs = (await namensVorschlaege(text, (anker || []).map((a) => a.wert))).filter((v) => !verdeckt.has(v.name));
    if (nr !== lauf) return;   // ein späterer Lauf hat schon gezeichnet
    box.dataset.anzahl = String(vs.length);
    box.dataset.verdeckt = String(muster.length);
    box.hidden = vs.length === 0 && muster.length === 0;
    box.replaceChildren();
    if (muster.length) {
      const zeile = el('div', { class: 'namen-verdeckt', 'data-namen-verdeckt': '' }, [el('span', { text: t('pseudonym.verdeckt') + ' ' })]);
      for (const m of muster) {
        zeile.appendChild(el('button', {
          class: 'btn btn-sm chip-verdeckt', type: 'button', 'data-verdeckt': m.wert, 'data-grund': m.grund,
          title: t('pseudonym.muster.' + m.grund) + ' — ' + t('pseudonym.verdeckt.zurueck'), text: '🛡 ' + m.wert + ' ✕',
          'aria-label': m.wert + ': ' + t('pseudonym.verdeckt.zurueck'),
          onClick: async () => {
            await updateSettings({ kiNieVerdecken: nameAufnehmen(getSettings().kiNieVerdecken, m.wert) });
            await aktualisiere();
          },
        }));
      }
      box.appendChild(zeile);
    }
    if (!vs.length) return;
    box.appendChild(el('span', { text: t('pseudonym.vorschlag') + ' ' }));
    for (const v of vs) {
      box.appendChild(el('button', {
        class: 'btn btn-sm', type: 'button', 'data-vorschlag': v.name, 'data-grund': v.grund,
        title: t('pseudonym.vorschlag.' + v.grund), text: '＋ ' + v.name,
        onClick: async () => {
          await updateSettings({ kiWeitereNamen: nameAufnehmen(getSettings().kiWeitereNamen, v.name) });
          await aktualisiere();
        },
      }));
    }
  }
  return { box, aktualisiere };
}
