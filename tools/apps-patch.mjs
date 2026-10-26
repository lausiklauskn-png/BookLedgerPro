// tools/apps-patch.mjs — die EINE kontrollierte Abweichung je eingebetteter App (Klaus 2026-10-26, Calculate/Needs):
// Workflow Calculate und Workflow Needs liegen byte-1:1 unter apps/<app>/ (tools/apps-nachziehen.mjs, Pins in
// apps/HERKUNFT.json). Nur index.html wird beim Kopieren verändert, und zwar genau so — reine Funktion, node-getestet:
//   1. die BLP-Brücke (apps/blp-bruecke.js) direkt nach der SBKIM-Schublade, vor jedem Modul der App
//   2. das BLP-Thema (apps/blp-thema.css) als letztes Stylesheet im Kopf
//   3. KEIN eigener Service Worker in der Einbettung: die App-Dateien kommen aus dem Vorrat von BookLedgerPro.
//      (Der eigene Worker der App hätte unter dem Ursprung lausiklauskn-png.github.io denselben Vorratsnamen wie die
//      installierte Einzel-PWA — eine ältere Kopie in BLP würde beim Aktivieren deren Vorrat löschen.)
export const BRUECKE_ZEILE = '<script src="../blp-bruecke.js?v=1"></script>';
export const THEMA_ZEILE = '<link rel="stylesheet" href="../blp-thema.css?v=1">';
export const SW_ERSATZ = '<!-- BookLedgerPro: kein eigener Service Worker in der Einbettung — der Vorrat kommt von BLP (apps/HERKUNFT.json) -->';

const SCHUBLADE = /<script>window\.SBKIM_DB_SUFFIX = "[a-z]+";<\/script>/;
const SW_BLOCK = /<script>\s*if \("serviceWorker" in navigator && location\.protocol !== "file:"\) \{\s*navigator\.serviceWorker\.register\("sw\.js"\)\.catch\(function \(\) \{\}\);\s*\}\s*<\/script>/;

/** @returns {{html:string, aenderungen:string[]}} wirft, wenn eine Stelle fehlt (dann ist die App anders gebaut — nicht raten). */
export function patchIndex(html) {
  const s = String(html);
  if (!SCHUBLADE.test(s)) throw new Error('index.html: SBKIM-Schublade nicht gefunden');
  if (!s.includes('</head>')) throw new Error('index.html: </head> fehlt');
  if (!SW_BLOCK.test(s)) throw new Error('index.html: Service-Worker-Anmeldung nicht gefunden');
  if (s.includes(BRUECKE_ZEILE) || s.includes(THEMA_ZEILE)) throw new Error('index.html: ist schon gepatcht');
  let out = s.replace(SCHUBLADE, (m) => m + '\n' + BRUECKE_ZEILE);
  out = out.replace('</head>', THEMA_ZEILE + '\n</head>');
  out = out.replace(SW_BLOCK, SW_ERSATZ);
  return { html: out, aenderungen: ['Brücke nach der SBKIM-Schublade', 'BLP-Thema als letztes Stylesheet', 'Service-Worker-Anmeldung entfernt'] };
}

/** Prüft eine gepatchte index.html (für tests/run.mjs): alle drei Abweichungen da, sonst nichts Verdächtiges. */
export function istGepatcht(html) {
  const s = String(html);
  return s.includes(BRUECKE_ZEILE) && s.includes(THEMA_ZEILE) && s.includes(SW_ERSATZ) && !/serviceWorker\.register/.test(s)
    && s.indexOf(BRUECKE_ZEILE) < s.indexOf('<script src="assets/') && s.indexOf(BRUECKE_ZEILE) < s.indexOf('<script src="modules/');
}
