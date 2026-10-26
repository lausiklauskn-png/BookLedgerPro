// src/ui/namensvorschlag.js — die Knöpfe „＋ Name" unter einem Text, der an die KI gehen soll.
// Nur im Pseudonym-Modus. Ein Tipp nimmt den Namen in „Weitere Namen" auf; der Vorschlag selbst
// verdeckt nichts. Namen sind Text, nie HTML.
import { el } from './dom.js';
import { t } from './i18n.js';
import { getSettings, updateSettings } from '../state.js';
import { ladeAnker } from '../ai/anker.js';
import { namensVorschlaege, nameAufnehmen } from '../ai/namensvorschlag.js';

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
    const anker = await ladeAnker(text);
    const vs = await namensVorschlaege(text, (anker || []).map((a) => a.wert));
    if (nr !== lauf) return;   // ein späterer Lauf hat schon gezeichnet
    box.dataset.anzahl = String(vs.length);
    box.hidden = vs.length === 0;
    box.replaceChildren();
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
