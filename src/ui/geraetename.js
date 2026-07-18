// src/ui/geraetename.js — frei wählbarer „Gerätename" (Anzeige-/Spitzname).
//
// Zweck: mehrere Instanzen derselben App (z. B. DeX + Tablet) sind im Rendezvous-
// Raum sonst nur an der kryptischen Kennung unterscheidbar. Der Gerätename macht
// daraus „BookLedgerPro · Klaus-Handy" vs „BookLedgerPro · Klaus-DeX".
//
// SICHERHEIT (Pflicht): Der Gerätename ist selbst-behauptet und NICHT
// authentifiziert. Er ist ein ANZEIGE-HINWEIS, NIE ein Vertrauens-Beweis — jeder
// (auch ein Fremder auf dem family-projekt.de-Marktplatz) kann sich jeden Namen
// geben. Darum wird der Name IMMER zusammen mit der Kennung (nodeId) gezeigt; die
// Rendezvous-Karten-Anzeige (23_rendezvous_ui.js) rendert den Namen ohnehin mit
// der vollständigen nodeId darunter.
//
// KEIN Spore-Re-Sign: der Name geht NICHT in generateOwnSpore({nodeName}). Die
// signierte Identität behält ihren kanonischen App-Namen („BookLedgerPro"). Nur
// die ANZEIGE / der Rendezvous-Announce bekommt den Zusatz.
//
// Speicher: localStorage-Schlüssel `sbkim_geraetename` — bewusst OHNE App-Suffix,
// da die Absicht „dieses Gerät heißt X" gilt (zwei Instanzen = getrennte
// localStorage-Töpfe → verschiedene Namen). Fail-soft, ~40 Zeichen.

export const LS_GERAETENAME = 'sbkim_geraetename';

/** Liest den frei gewählten Gerätenamen (Freitext, ~40 Zeichen, fail-soft). */
export function getGeraetename() {
  try { return (localStorage.getItem(LS_GERAETENAME) || '').trim().slice(0, 40); }
  catch { return ''; }
}

/** Speichert den Gerätenamen (fail-soft; kein Throw, wenn localStorage fehlt). */
export function setGeraetename(v) {
  try { localStorage.setItem(LS_GERAETENAME, String(v || '').trim().slice(0, 40)); }
  catch { /* fail-soft */ }
}

/**
 * Anzeige-Name = Basis-App-Name + optionaler Gerätename
 * („BookLedgerPro · Klaus-Handy"). NUR an die Anzeige/den Announce geben —
 * NIE an generateOwnSpore/buildSpore (das würde die Signatur ändern).
 */
export function displayNodeName(base) {
  const b = String(base || '').trim();
  const g = getGeraetename();
  return g ? (b + ' · ' + g) : b;
}

/** Kurzform einer Kennung (nodeId) für die kompakte Anzeige neben dem Namen. */
export function shortKennung(id) {
  const s = String(id || '');
  return s.length > 14 ? s.slice(0, 8) + '…' + s.slice(-4) : s;
}
