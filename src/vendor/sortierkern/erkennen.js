// Erzeugt aus Datei-Organizer lib/erkennen.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { KATEGORIE_WOERTER, UNKLAR } from "./kategorien.js";
const w = (wert, sicher, grund) => ({ wert, sicher, grund, quelle: "regel" });
const klein = (s) => s.toLowerCase();
const SCHRIFTSTUECKE = ["Mahnung", "Rechnung", "Bescheid", "K\xFCndigung", "Vertrag", "Kontoauszug", "Abrechnung", "Befund", "Termin", "Aufforderung", "Angebot/Werbung", "Kassenbon", "Bescheinigung", "Brief", "Foto", "Unklar"];
const ART_REGELN = [
  { art: "Mahnung", muster: /\b(\d\.\s*)?mahnung\b|zahlungserinnerung|letzte zahlungsaufforderung/, wort: "Mahnung" },
  { art: "Kontoauszug", muster: /kontoauszug/, wort: "Kontoauszug" },
  { art: "Abrechnung", muster: /\w*abrechnung\b/, wort: "Abrechnung" },
  { art: "Bescheid", muster: /\bbescheid\b|steuerbescheid|bewilligungsbescheid/, wort: "Bescheid" },
  { art: "K\xFCndigung", muster: /\bkündigung\b|kündigungsbestätigung/, wort: "K\xFCndigung" },
  { art: "Befund", muster: /\bbefund|arztbrief|laborwerte|laborbefund|entlassungsbrief/, wort: "Befund" },
  { art: "Rechnung", muster: /\brechnung\b|rechnungsnummer|rechnungsbetrag|beitragsrechnung|rechnungsdatum|zahlbar bis|your receipt/, wort: "Rechnung" },
  { art: "Termin", muster: /terminbestätigung|\beinladung\b|ihr termin|terminvereinbarung|\btermin am\b/, wort: "Termin/Einladung" },
  { art: "Aufforderung", muster: /bitte teilen sie uns|aufforderung|wir bitten sie,? (uns|bis)|bitte reichen sie|bitte senden sie/, wort: "Aufforderung" },
  { art: "Vertrag", muster: /\b\w*vertrag\b|vertragsbestätigung|vertragsunterlagen|versicherungsschein/, wort: "Vertrag" },
  { art: "Bescheinigung", muster: /\bbescheinigung\b|meldebescheinigung|lohnsteuerbescheinigung|zuwendungsbestätigung|eheurkunde|geburtsurkunde|\burkunde\b|arbeitsunfähigkeitsbescheinigung/, wort: "Bescheinigung" },
  { art: "Kassenbon", muster: /kassenbon|\bbon-nr|summe eur|bar gegeben|kartenzahlung/, wort: "Kassenbon" },
  { art: "Angebot/Werbung", muster: /angebot der woche|nur für kurze zeit|jetzt bestellen|newsletter|rabatt|gutschein/, wort: "Werbung" }
];
function erkenneSchriftstueck(kopf, betreff = "") {
  const vorne = klein(`${betreff}
${kopf.slice(0, 700)}`);
  const alles = klein(kopf);
  for (const r of ART_REGELN) if (r.muster.test(vorne)) return w(r.art, true, `\u201E${r.wort}\u201C im Kopf oder Betreff`);
  for (const r of ART_REGELN) if (r.muster.test(alles)) return w(r.art, false, `\u201E${r.wort}\u201C erst weiter unten im Text`);
  if (/sehr geehrte|liebe |hallo /.test(alles)) return w("Brief", false, "Anrede gefunden, aber kein klares Wort f\xFCr die Art");
  return w(UNKLAR, false, "kein Merkmal f\xFCr die Art gefunden");
}
const MONATE = ["januar", "februar", "m\xE4rz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
function datumeImText(t) {
  const aus = [];
  for (const m of t.matchAll(/\b(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4}|\d{2})\b/g)) {
    const j = m[3].length === 2 ? 2e3 + Number(m[3]) : Number(m[3]);
    const iso = isoDatum(j, Number(m[2]), Number(m[1]));
    if (iso) aus.push({ iso, pos: m.index ?? 0 });
  }
  for (const m of klein(t).matchAll(/\b(\d{1,2})\.\s?(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s(\d{4})\b/g)) {
    const iso = isoDatum(Number(m[3]), MONATE.indexOf(m[2]) + 1, Number(m[1]));
    if (iso) aus.push({ iso, pos: m.index ?? 0 });
  }
  return aus.sort((a, b) => a.pos - b.pos);
}
function isoDatum(j, m, t) {
  if (j < 1990 || j > 2100 || m < 1 || m > 12 || t < 1 || t > 31) return null;
  const d = new Date(Date.UTC(j, m - 1, t));
  if (d.getUTCMonth() !== m - 1) return null;
  return d.toISOString().slice(0, 10);
}
function erkenneDatum(kopf) {
  const m = kopf.match(/(?:datum|briefdatum)\s*:?\s*(\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4})/i) || kopf.match(/(?:^|\n)[^\n]{0,60}?[A-ZÄÖÜ][a-zäöüß-]+(?:\s[a-zäöüßA-ZÄÖÜ.-]+)?,\s*(?:den\s*)?(\d{1,2}\.\s?\d{1,2}\.\s?\d{4})\s*(?:\n|$)/) || kopf.match(/[A-ZÄÖÜ][a-zäöüß-]+,\s*(?:den\s*)?(\d{1,2}\.\s?\d{1,2}\.\s?\d{4})/);
  if (m) {
    const d = datumeImText(m[1])[0];
    if (d) return w(d.iso, true, `Briefdatum \u201E${m[0].trim()}\u201C`);
  }
  const zeile = kopf.slice(0, 1200).match(/(?:^|\n)[ \t]*(\d{1,2}\.\s?\d{1,2}\.\s?\d{4}|\d{1,2}\.\s?(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s\d{4})[ \t]*(?:\n|$)/i);
  if (zeile) {
    const d = datumeImText(zeile[1])[0];
    if (d) return w(d.iso, true, `Datumszeile \u201E${zeile[1]}\u201C`);
  }
  const kurz = kopf.slice(0, 900);
  const alle = datumeImText(kurz).filter((d) => !/(?:\bvom|\bv\.|\bbis|\bam|\bden|\bdem|\bab|\bzum|\bseit|\bper|\bgeb\.|geboren|\bum|anreise|abreise|beginn|termin|\bwann)\s*(?:\(?\w{2,10}\.?,?\s+)?$/i.test(kurz.slice(Math.max(0, d.pos - 25), d.pos)));
  const erstes = alle[0] || datumeImText(kurz)[0];
  return erstes ? w(erstes.iso, false, "erstes Datum im Kopf") : void 0;
}
const NUMMER_REGELN = [
  { art: "Kundennummer", muster: /(?:kunden(?:-?nr\.?|nummer)|kd\.?-?nr\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{2,20}[A-Z0-9])/i },
  { art: "Rechnungsnummer", muster: /(?:rechnungs(?:-?nr\.?|nummer)|rg\.?-?nr\.?|beleg(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i },
  { art: "Vertragsnummer", muster: /(?:vertrags(?:-?nr\.?|nummer)|versicherungs(?:-?nr\.?|nummer|schein-?nr\.?)|police(?:n-?nr\.?|nummer)?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{2,20}[A-Z0-9])/i },
  { art: "Aktenzeichen", muster: /(?:aktenzeichen|\baz\.?|geschäftszeichen|zeichen)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ .]{2,24}[A-Z0-9])/i },
  { art: "Steuernummer", muster: /(?:steuer(?:-?nr\.?|nummer))\s*[:.]?\s*(\d{2,3}\/\d{3}\/\d{4,5})/i },
  { art: "Mitgliedsnummer", muster: /(?:mitglieds(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,20})/i },
  { art: "Auftragsnummer", muster: /(?:auftrags(?:-?nr\.?|nummer)|bestell(?:-?nr\.?|nummer)|order(?:-?nr\.?| number))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i },
  { art: "Personalnummer", muster: /(?:personal(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{1,15})/i },
  { art: "Z\xE4hlernummer", muster: /(?:zähler(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{3,20}[A-Z0-9])/i },
  { art: "Sendungsnummer", muster: /(?:sendungs(?:-?nr\.?|nummer)|tracking)\s*[:.]?\s*([A-Z0-9]{8,30})/i }
];
function erkenneNummern(t) {
  const aus = [];
  const gesehen = /* @__PURE__ */ new Set();
  const neu = (art, wert) => {
    const k = `${art}|${wert}`;
    if (!gesehen.has(k)) {
      gesehen.add(k);
      aus.push({ art, wert });
    }
  };
  for (const r of NUMMER_REGELN) {
    const m = t.match(r.muster);
    if (m) neu(r.art, m[1].trim().replace(/\s{2,}/g, " "));
  }
  const iban = t.match(/\b([A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?)\b/);
  if (iban) {
    const roh = iban[1].replace(/\s/g, "");
    neu("IBAN", `${roh.slice(0, 4)} \u2026 ${roh.slice(-4)}`);
  }
  for (const k of kennzeichenImText(t)) neu("Kennzeichen", k);
  return aus;
}
function kennzeichenImText(t) {
  const aus = /* @__PURE__ */ new Set();
  for (const m of t.matchAll(/\b([A-ZÄÖÜ]{1,3})[- ]([A-Z]{1,2})[ -]?(\d{1,4})([EH])?\b/g)) {
    const umfeld = klein(t.slice(Math.max(0, (m.index ?? 0) - 40), m.index ?? 0));
    if (/kennzeichen|kfz|fahrzeug|amtl/.test(umfeld) || m[0].includes("-")) aus.add(`${m[1]}-${m[2]} ${m[3]}${m[4] || ""}`);
  }
  return [...aus];
}
const NACH_ART = { Kontoauszug: "Finanzen & Konten", Befund: "Gesundheit & Pflege", Kassenbon: "Eink\xE4ufe, Rechnungen & Garantien" };
const STARKE_SIGNALE = [
  [/lohnsteuerbescheinigung/, "Steuern & Beh\xF6rden"],
  [/umsatzsteuer-voranmeldung/, "Steuern & Beh\xF6rden"],
  [/einnahmenüberschussrechnung|jahresabschluss|betriebswirtschaftliche auswertung/, "Steuern & Beh\xF6rden"],
  [/zuwendungsbestätigung/, "Steuern & Beh\xF6rden"],
  [/schenkungsteuer/, "Steuern & Beh\xF6rden"],
  [/rundfunkbeitrag/, "Steuern & Beh\xF6rden"],
  [/meldebescheinigung zur sozialversicherung|jahresmeldung/, "Rente, Arbeit & Sozialversicherung"],
  [/renteninformation|rentenanpassung|bezügemitteilung/, "Rente, Arbeit & Sozialversicherung"],
  [/schenkungsvertrag|vorsorgevollmacht|testament/, "Erbschaft, Vollmachten & Vorsorge"],
  [/arbeitsunfähigkeitsbescheinigung|befundbericht|arztbrief/, "Gesundheit & Pflege"],
  [/kindergeld|unterhaltsvorschuss|elterngeld/, "Familie & pers\xF6nliche Dokumente"],
  [/medizinischen rehabilitation|\breha\b|mutter-kind/, "Gesundheit & Pflege"],
  [/wohngeld/, "Haus & Wohnung"],
  [/\bliter\b|eur\/l\b|zapfsäule|tankstelle/, "Auto & Mobilit\xE4t"]
];
const WORT_ZEICHEN = /[a-zäöüß0-9]/;
function wortAnfang(text, wort) {
  for (let i = text.indexOf(wort); i >= 0; i = text.indexOf(wort, i + 1)) if (i === 0 || !WORT_ZEICHEN.test(text[i - 1])) return true;
  return false;
}
function erkenneKategorie(text, absender = "", art = "") {
  const t = ` ${klein(text)} `, a = ` ${klein(absender)} `;
  const punkte = [];
  for (const [k, worte] of Object.entries(KATEGORIE_WOERTER)) {
    let p = 0;
    const treffer = [];
    for (const wort of worte) {
      if (a.includes(wort.trim())) {
        p += 3;
        treffer.push(wort);
      } else if (wortAnfang(t, wort)) {
        p += 1;
        treffer.push(wort);
      }
    }
    if (NACH_ART[art] === k) {
      p += 2;
      treffer.push(art);
    }
    for (const [signal, kat] of STARKE_SIGNALE) if (kat === k && signal.test(t)) {
      p += 6;
      treffer.unshift(signal.source.replace(/\\b|\\/g, ""));
    }
    if (p) punkte.push({ k, p, worte: treffer });
  }
  punkte.sort((x, y) => y.p - x.p);
  if (!punkte.length) return w(art === "Brief" || art === "Unklar" ? "Korrespondenz" : UNKLAR, false, "kein Wort eines Lebensbereichs gefunden");
  const [erster, zweiter] = punkte;
  const sicher = erster.p >= 3 && (!zweiter || erster.p - zweiter.p >= 2);
  return w(erster.k, sicher, `W\xF6rter: ${erster.worte.slice(0, 3).join(", ")}${zweiter && !sicher ? ` \u2013 knapp vor \u201E${zweiter.k}\u201C` : ""}`);
}
const FIRMA = /\b(gmbh|ag|kg|ggmbh|e\.\s?v\.|e\.\s?k\.|eg|ohg|mbh|ug|se|mvz|vvag|partg|a\.\s?g\.|stadtwerke|dr\.|zahnarzt|kita|hort|markt|stadt|gemeinde|landkreis|landesbetrieb|jobcenter|agentur|universität|hochschule|notariat|studierendenwerk|gewerkschaft|apotheke|optik|inkasso|auskunftei|tankstelle|bäckerei|drogerie|baumarkt|discount|frischmarkt|magistrat|rechtsanwälte|rechtsanwalt|elektro|physio)\b|(amt|kasse|schule|gymnasium|gericht|werke|versicherung|gesellschaft|zentrum|stelle|behörde|kammer|genossenschaft|service|praxis|klinik|klinikum|labor|verein|verband|büro|institut|kanzlei|beratung|verwaltung|bank|sparkasse|verlag|haus|therapie|rentenversicherung|stiftung|kolleg|bibliothek|stätte|betrieb|dienst|handel|versand|markt|technik|werkstatt|hotel|hostel|bahn|energie|assekuranz|gärtnerei|tischlerei|pflege|leasing)\b/i;
const RECHTSFORM = /\b(gmbh|ag|kg|ggmbh|e\.\s?v\.|e\.\s?k\.|eg|ohg|mbh|ug|se|vvag|partg|a\.\s?g\.|aps|s\.p\.a\.)(?=$|[\s,.·|)])/i;
const STRASSE = /\s*[.,·•|'°:–-]?\s+[A-ZÄÖÜa-zäöüß][\wäöüß-]*(straße|strasse|str\.|weg|platz|ring|kai|allee|gasse|damm|hof|markt|chaussee|stieg|wall|fleet|passage)\s*\d+.*$/i;
const TITEL = /^(meldebescheinigung|gehaltsabrechnung|abrechnung|ausdruck|rechnung|bescheid|kontoauszug|bescheinigung|lohnsteuer|vertrag|befund|einladung|mahnung|angebot)\b/i;
const kuerze = (z) => z.replace(STRASSE, "").replace(/\s*[.,·•|'°:–-]\s*$/, "").trim();
const ANREDE_ZEILE = /^(sehr geehrte|liebe|lieber|liebes|hallo|hi\b|hey\b|guten (tag|morgen|abend)|moin|servus|werte|mein(e)? liebe|grüß)/i;
const EMPFAENGER_ZEILE = /^(herrn|herr|frau|familie|eheleute|an|firma)\b|^(fam\.|z\.\s?hd)/i;
const ORT_DATUM = /^[A-ZÄÖÜ][\wäöüß.-]*(?:\s[\wäöüß.-]+){0,2},\s*(?:den\s+|im\s+|am\s+)?(?:\d|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i;
const GRUSSFORMEL = /(mit (?:\w+ )?(?:grüßen|gruß|grüssen|gruss)|(?:freundliche|viele|herzliche|liebe|beste|sportliche|schöne|sonnige|kollegiale)[rn]? (?:grüße|grüsse|gruß)\b|^\s*(?:grüße|gruß|lg|vg|mfg)\b|hochachtungsvoll|in stillem gedenken|im namen (?:aller|der)|in dankbarkeit|^\s*herzlichst?\s*$|alles liebe|alles gute\s*$|sei(?:d)? (?:fest |lieb )?(?:gedrückt|umarmt|gegrüßt)|bis bald|in liebe|es grüßt|es grüßen|\b(?:dein|deine|euer|eure|ihr|ihre)\s*$)/i;
const DATUM_IN_ZEILE = /\b\d{1,2}\.\s?\d{1,2}\.\s?(\d{4}|\d{2})?\b|\b\d{1,2}\.\s?(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b|\b(im|den|am)\s+(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b|\d\.\s*advent/i;
const ADRESS_SPUR = /\b\d{5}\b|postfach|\btel\b|telefon|\bfax\b|[a-zäöüß.](straße|strasse|str\.|weg|platz|ring|allee|gasse|damm|chaussee)\s*\d|\s\d{1,3}[a-z]?\s*$/i;
const KEIN_NAME = /^(az\b|aktenzeichen|(kunden|vertrags|rechnungs|steuer|mitglieds?|versicherungs|versicherten|personal|buchungs|auftrags|bestell|beleg|vorgangs)[\s.-]*(nr|nummer|konto|id\b|zeichen)|vers\.|kassenzeichen|datum\b|seite\b|blatt\b|bon\b|beleg\b|kasse\b|tel\b|telefon|fax\b|ust\b|st\.?-?nr|iban\b|ihr zeichen|unser zeichen|betreff|betr\.|per einschreiben|einschreiben|einwurf|persönlich|vertraulich|kopie\b|abschrift\b|zwischen\b|und\b|nachrichtlich|(käufer|käuferin|mieter|mieterin|kunde|kundin|empfänger|auftraggeber|versicherungsnehmer|inhaber|inhalt|betreiber)\s*:|[-–—=*_#>•]+\s|\d+[.)]?\s)/i;
const SCHRIFTSTUECK_WORT = /(vertrag|urkunde|bescheinigung|bescheid|rechnung|abrechnung|mahnung|protokoll|vereinbarung|nachweis|vollmacht|erklärung|quittung|beleg|angebot|voranschlag|auszug|mitteilung|information|einladung|kündigung|antrag|zeugnis|erinnerung|bestätigung|schein|plan|liste|ordner|karton|kiste|ablage|bitte|achtung|wichtig|aushang|notiz)/i;
const GESPERRT = (s) => /^(?:[A-ZÄÖÜ]\s){3,}/.test(s + " ");
const GROSS = (s) => /[A-ZÄÖÜ]{3}/.test(s) && s === s.toUpperCase();
const WORT_ENDE = new RegExp(`${SCHRIFTSTUECK_WORT.source}$`, "i");
function istTitel(s) {
  if (TITEL.test(s) || GESPERRT(s) || /^\(/.test(s) || /^[*#=_-]{2,}/.test(s) || GROSS(s) && SCHRIFTSTUECK_WORT.test(s)) return true;
  const worte = s.split(/\s+/), erstes = worte[0].replace(/[:.,]$/, "");
  return WORT_ENDE.test(erstes) && (worte.length === 1 || GROSS(erstes) || /^([a-zäöü]|nr\b|\d)/.test(worte[1]));
}
const GEBIET = /^(stadt|gemeinde|markt|landkreis|kreis|land|freistaat|magistrat|kreisverwaltung|stadtverwaltung|verbandsgemeinde|amt)\b|^\S*(amt|gericht|präsidium|ministerium|behörde)\b/i;
const EIGENE_STELLE = /^(amt\b|klinik|institut|eigenbetrieb|fachbereich|fakultät|zentrum)/i;
function nameAusZeile(zeile, fuss = false) {
  const spalten = zeile.trim().split(/\s{2,}|\t+/).map((s2) => s2.trim()).filter(Boolean);
  const ETIKETT = /^(arbeitgeber|absender|von|aussteller|verkäufer|verkäuferin|vermieter|vermieterin|auftragnehmer|anbieter|lieferant|firma)\s*:\s*/i;
  if (spalten.length > 1 && ETIKETT.test(spalten[0] + " ")) spalten.shift();
  let s = spalten.find((x) => !istTitel(x) && !KEIN_NAME.test(x) && !/^[\d\s.,:/-]+$/.test(x)) || "";
  s = s.replace(/^(arbeitgeber|absender|von|aussteller|verkäufer|verkäuferin|vermieter|vermieterin|auftragnehmer|anbieter|lieferant|firma)\s*:\s*/i, "");
  s = s.split(/\s+[·•|]\s+|\s+\/\/\s+/)[0];
  s = s.replace(/\s+(inh\.|inhaber(in)?\b|c\/o\b).*$/i, "").replace(/\s*\([^)]*\)?\s*$/, "");
  s = s.replace(/[\s–—-]+$/, "");
  const strich = s.split(/\s+[–—-]\s+/);
  if (strich.length > 1) {
    const rest = strich.slice(1).join(" \u2013 ");
    s = !fuss && (GEBIET.test(strich[0]) || EIGENE_STELLE.test(rest)) && !/^(ihr|ihre)\b/i.test(rest) && !istTitel(strich[1]) ? strich.filter((x, i) => i === 0 || !istTitel(x) && !/^team\b|(kasse|service|kundendienst)$/i.test(x)).join(" \u2013 ") : strich[0];
  }
  s = s.replace(/,\s*(?=[^,]*\d).*$/, "");
  if (fuss) s = s.replace(/,.*$/, "");
  s = s.replace(/\s+(D-|DK-|A-|CH-)?\d{5}\s+\S.*$/, "");
  s = kuerze(s);
  s = s.replace(/\s+(?:den\s+|vom\s+)?\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}$/, "").replace(/\s+\d{1,2}[./]\d{2,4}$/, "");
  const haus = s.match(/^(\S+\s+\S+.*?)\s+(?:(?:im|am|an der|auf dem|auf der|zum|zur|in der|unter(?:e|en)?|ober(?:e|en)?)\s+)?[A-ZÄÖÜ][\wäöüß.-]*\s+\d{1,4}[a-z]?$/);
  if (haus) s = haus[1];
  return s.replace(/\s*[.,;:·•|–—-]+\s*$/, "").replace(/\s{2,}/g, " ").trim();
}
const namensartig = (s) => s.length >= 3 && s.length <= 64 && s.split(/\s+/).length <= 8 && /^["„]?[A-ZÄÖÜ]|^\d+\S/.test(s) && !/[!?]$|[a-zäöüß]\.$/.test(s.replace(/(e\.\s?v|e\.\s?k|a\.\s?g|co|dr|str|inh)\.$/i, "")) && !ANREDE_ZEILE.test(s) && !EMPFAENGER_ZEILE.test(s) && !DATUM_IN_ZEILE.test(s) && !/\d,\d{2}|@|\b(ist|sind|wird|werden|haben|hat|bitte|wir|sie|ich)\b/i.test(s);
const istMailKopf = (zeilen) => {
  const k = zeilen.slice(0, 7);
  return k.some((z) => /^(von|from)\s*:.*@/i.test(z)) || k.some((z) => /^(von|from)\s*:/i.test(z)) && k.some((z) => /^(betreff|subject|datum|date|gesendet|an|to)\s*:/i.test(z)) || /^(betreff|subject)\s*:/i.test(k[0] || "") && !k.some((z) => EMPFAENGER_ZEILE.test(z));
};
function erkenneAbsender(kopf) {
  const alle = kopf.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  if (istMailKopf(alle)) return void 0;
  const zeilen = alle.filter((z) => !TITEL.test(z)).slice(0, 18);
  let i = 0;
  while (i < zeilen.length && i < 6) {
    const z = zeilen[i];
    if (ANREDE_ZEILE.test(z) || EMPFAENGER_ZEILE.test(z)) break;
    if (ORT_DATUM.test(z)) {
      i++;
      continue;
    }
    const n = nameAusZeile(z);
    if (n && namensartig(n) && !istTitel(n) && !KEIN_NAME.test(n)) {
      const firma = FIRMA.test(n);
      const spur = ADRESS_SPUR.test(z.slice(Math.min(z.length, n.length))) || zeilen.slice(i + 1, i + 4).some((x) => ADRESS_SPUR.test(x) && !EMPFAENGER_ZEILE.test(x));
      if (firma) return w(n, i === 0 || spur, i === 0 ? "Briefkopf oben" : "Briefkopf oben (nach der \xDCberschrift)");
      if (spur) return w(n, i === 0, "erste Zeile mit Anschrift darunter");
      if (i === 0 && !GROSS(n)) return w(n, false, "erste Zeile, ohne Firmenmerkmal");
      if (i === 0 && GROSS(n) && !SCHRIFTSTUECK_WORT.test(n)) return w(n, false, "erste Zeile, ohne Firmenmerkmal");
    }
    i++;
  }
  for (const z of zeilen) {
    const m = z.match(/^(.+?)\s+[·|•]\s+.+\d{5}\s/);
    if (m && FIRMA.test(m[1]) && !EMPFAENGER_ZEILE.test(z)) {
      const n = nameAusZeile(z);
      if (n.length >= 3) return w(n, true, "Absenderzeile \xFCber der Anschrift");
    }
  }
  for (const roh of zeilen.slice(0, 6)) {
    if (ANREDE_ZEILE.test(roh)) break;
    const z = nameAusZeile(roh);
    if (z && FIRMA.test(z) && z.length <= 70 && !EMPFAENGER_ZEILE.test(roh) && !istTitel(z) && namensartig(z)) return w(z, false, "Zeile mit Firmenmerkmal im Kopf");
  }
  return void 0;
}
const umschrift = (s) => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");
const ROLLE_VORNE = /^(?:(?:ihr|ihre|dein|deine|euer|eure|das|vom|von der|von)\s+)?(?:(?:team|serviceteam|kundenservice)\s+(?:von|der|des|vom)\s+)?(?:(?:leitung|geschäftsführung|sekretariat|vorstand|i\.\s?a\.|i\.\s?v\.)\s+)?/i;
function absenderAusMail(zeilen) {
  const von = zeilen.slice(0, 7).find((z) => /^(von|from)\s*:/i.test(z))?.replace(/^(von|from)\s*:\s*/i, "") || "";
  const adr = von.match(/[\w.+-]+@([\w.-]+)/);
  const anzeige = von.replace(/<[^>]*>/, "").replace(/[\w.+-]+@[\w.-]+/, "").replace(/["']/g, "").trim();
  const koerper = zeilen.filter((z) => !/^(von|from|an|to|cc|betreff|subject|datum|date|gesendet)\s*:/i.test(z));
  const marken = adr ? adr[1].toLowerCase().split(/[.-]/).slice(0, -1).filter((t) => t.length >= 4 && !/^(mail|email|post|info|service|online|shop|news|kunden|portal)$/.test(t)) : [];
  const passt = (name) => {
    const u = umschrift(name);
    return marken.some((t) => u.includes(t) || name.split(/[\s-]+/).some((wort) => wort.length >= 6 && t.includes(umschrift(wort)) && umschrift(wort).length >= 6));
  };
  const kandidat = (z) => {
    const n = nameAusZeile(z.replace(ROLLE_VORNE, ""), true);
    return n && namensartig(n) && n.split(/\s+/).length <= 6 && !/^\d/.test(n) ? n : "";
  };
  if (anzeige && passt(anzeige) && namensartig(anzeige) && !/^(ihr|ihre|dein|deine)\b/i.test(anzeige)) return w(anzeige, true, "Anzeigename in \u201EVon:\u201C, passt zur Adresse");
  if (marken.length) for (const z of [...koerper].reverse()) {
    const n = kandidat(z);
    if (n && passt(n)) return w(n, true, "Fu\xDFzeile der Mail, passt zur Absenderadresse");
  }
  for (const z of koerper.slice(-3).reverse()) {
    const n = kandidat(z);
    if (n && RECHTSFORM.test(n)) return w(n, true, "Fu\xDFzeile der Mail");
  }
  if (anzeige && !/^(ihr|ihre|dein|deine)\b/i.test(anzeige) && namensartig(anzeige)) return w(anzeige, Boolean(adr), "Anzeigename in \u201EVon:\u201C");
  if (marken.length) {
    for (const z of zeilen) for (const m of z.matchAll(/[A-ZÄÖÜ][\wäöüß-]+(?:\s+(?:(?:am|für|und|&|y)\s+)?[A-ZÄÖÜ][\wäöüß-]+){0,4}/g)) {
      const n = m[0].replace(/^(Ihr|Ihre|Dein|Deine|Sie|Wir|Der|Die|Das)\s+/, "");
      if (passt(n) && n.split(/\s+/).length >= 2) return w(n.replace(/[.,]$/, ""), false, "Name im Text, passt zur Absenderadresse");
    }
  }
  return void 0;
}
function absenderAusGruss(text) {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  const mail = istMailKopf(zeilen);
  if (mail) {
    const m = absenderAusMail(zeilen);
    if (m) return m;
  }
  let g = -1;
  for (let i = zeilen.length - 1; i >= 0; i--) if (GRUSSFORMEL.test(zeilen[i]) && zeilen[i].length <= 60) {
    g = i;
    break;
  }
  if (g >= 0) {
    const nach = zeilen.slice(g + 1, g + 5).filter((z) => !/^(ps|p\.s\.|anlage|anlagen|tel|telefon|fax|mobil)\b/i.test(z));
    for (const z of nach) {
      const n = nameAusZeile(z.replace(ROLLE_VORNE, ""), true);
      if (n && FIRMA.test(n) && namensartig(n)) return w(n, true, "unter der Gru\xDFformel");
    }
    const selbe = zeilen[g].match(/(?:grüße|gruß|grüsse|gedrückt|umarmt|liebe|bald)\s*,?\s+(?:von\s+)?(?:(?:dein|deine|deiner|deinem|euer|eure|eurer|ihr|ihre)\s+)?([A-ZÄÖÜ][\wäöüß-]+(?:\s+(?:&|und|u\.)?\s*[A-ZÄÖÜ][\wäöüß-]+){0,3})\s*$/);
    const roh = (nach[0] && !/^(i\.\s?a\.|i\.\s?v\.|im auftrag)\s*$/i.test(nach[0]) ? nach[0] : nach[1]) || "";
    const name = roh.replace(/^(?:(?:dein|deine|euer|eure|ihr|ihre)\s+)/i, "").replace(/^(i\.\s?a\.|i\.\s?v\.)\s*/i, "").replace(/,.*$/, "").replace(/\s*\(.*$/, "").trim();
    if (name && /^[A-ZÄÖÜ][\wäöüß.-]*(?:\s+(?:&|und|u\.|von|van|de)?\s*[A-ZÄÖÜ][\wäöüß.-]*){0,3}$/.test(name) && !DATUM_IN_ZEILE.test(name) && name.length <= 40) return w(name, false, "Unterschrift unter der Gru\xDFformel");
    if (selbe && !/^(Grüße|Gruß)$/.test(selbe[1])) return w(selbe[1], false, "Unterschrift in der Gru\xDFzeile");
  }
  for (const z of zeilen.slice(-6).reverse()) {
    const m = z.match(/^(?:dein|deine|euer|eure|ihr|ihre)\s+([A-ZÄÖÜ][\wäöüß-]+(?:\s+[A-ZÄÖÜ][\wäöüß-]+){0,2})\s*(?:\(.*)?$/i);
    if (m && !/team|service|kunden/i.test(m[1])) return w(m[1], false, "Unterschrift am Schluss");
  }
  for (const z of zeilen.slice(-3).reverse()) {
    const n = nameAusZeile(z.replace(ROLLE_VORNE, ""), true);
    if (n && RECHTSFORM.test(n) && namensartig(n) && n.split(/\s+/).length <= 6) return w(n, mail, "Fu\xDFzeile");
  }
  return void 0;
}
function erkenneBetrifft(text) {
  const anrede = text.match(/sehr geehrte[r]?\s+(frau|herr)\s+((?:dr\.\s+)?[A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)?)/i);
  if (anrede) return w(`${anrede[1][0].toUpperCase()}${anrede[1].slice(1).toLowerCase()} ${anrede[2]}`, true, `Anrede \u201E${anrede[0].trim()}\u201C`);
  const anredeFamilie = text.match(/(?:sehr geehrte|liebe)\s+familie\s+([A-ZÄÖÜ][\wäöüß-]+)/i);
  if (anredeFamilie) return w(`Familie ${anredeFamilie[1]}`, true, `Anrede \u201E${anredeFamilie[0].trim()}\u201C`);
  const rolle = text.match(/(?:patient(?:in)?|schüler(?:in)?|kind|versicherte[r]?)\s*:\s*([A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)?)/i);
  if (rolle) return w(rolle[1], true, `\u201E${rolle[0].trim()}\u201C`);
  const feld = text.match(/^(herrn|frau)\s*\n?\s*([A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)+)/im);
  if (feld) return w(`${/herrn/i.test(feld[1]) ? "Herr" : "Frau"} ${feld[2].split(" ").slice(-1)[0]}`, true, "Anschriftfeld");
  const familie = text.match(/^familie\s+([A-ZÄÖÜ][\wäöüß-]+)/im);
  if (familie) return w(`Familie ${familie[1]}`, true, "Anschriftfeld \u201EFamilie \u2026\u201C");
  const k = kennzeichenImText(text)[0];
  if (k) return w(`Fahrzeug ${k}`, true, "Kennzeichen im Text");
  if (/sehr geehrte damen und herren|liebe eltern|liebe kundin|lieber kunde/i.test(text)) return w("allgemein", false, "allgemeine Anrede");
  return void 0;
}
const MONAT_RE = "januar|februar|m\xE4rz|april|mai|juni|juli|august|september|oktober|november|dezember";
const MONAT_KURZ = { jan: 1, feb: 2, "m\xE4r": 3, mrz: 3, apr: 4, mai: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, okt: 10, nov: 11, dez: 12 };
function datumsStellen(t, bezug) {
  const aus = [];
  const mitJahr = (tag, monat, jahr) => {
    if (jahr) return { iso: isoDatum(jahr.length === 2 ? 2e3 + Number(jahr) : Number(jahr), monat, tag), ohneJahr: false };
    if (!bezug) return { iso: null, ohneJahr: true };
    const j = Number(bezug.slice(0, 4));
    const dies = isoDatum(j, monat, tag);
    const grenze = /* @__PURE__ */ new Date(`${bezug}T12:00:00Z`);
    grenze.setUTCDate(grenze.getUTCDate() - 21);
    return { iso: dies && dies >= grenze.toISOString().slice(0, 10) ? dies : isoDatum(j + 1, monat, tag), ohneJahr: true };
  };
  const re = new RegExp(`\\b(\\d{1,2})\\.\\s?(?:(\\d{1,2})\\.(?:\\s?(\\d{4}|\\d{2})(?!\\d|[.,]\\d))?|(${MONAT_RE}|jan|feb|m\xE4r|mrz|apr|jun|jul|aug|sept?|okt|nov|dez)\\.?(?:\\s(\\d{4}))?(?![a-z\xE4\xF6\xFC]))`, "gi");
  for (const m of t.matchAll(re)) {
    const tag = Number(m[1]);
    const monat = m[2] ? Number(m[2]) : MONATE.indexOf(m[4].toLowerCase()) + 1 || MONAT_KURZ[m[4].toLowerCase()] || 0;
    const { iso, ohneJahr } = mitJahr(tag, monat, m[2] ? m[3] : m[5]);
    const pos = m.index ?? 0;
    if (iso && !/[\d,]$/.test(t.slice(Math.max(0, pos - 1), pos))) aus.push({ iso, pos, ende: pos + m[0].length, ohneJahr });
  }
  return aus;
}
const WOCHENTAG = "(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag|mo|di|mi|do|fr|sa|so)\\.?,?\\s+(?:den\\s+|dem\\s+|der\\s+)?";
const HANDLUNG = /überw|zahl|begleich|ausgleich|ausgegl|entricht|einzureich|einreich|reichen sie|nachreich|nachzureich|zusend|senden|schick|zurück|vorleg|vorzuleg|melde|mitteil|mitzuteil|antwort|äußer|abgeb|abzugeb|abgabe|rückgabe|bescheid|vornehm|vorzunehm|erledig|erwarte|eingang|\bbitte|bitten|holen|abhol|teilen sie|beheb|gleichen|gebunden|übermitt|nachprüf|konto\b|iban|zurückzuführ|aufzuforder|fordere|fordern|eingehen|eingegangen sein|vorliegen|brauchen wir|benötigen wir|anmeld|nachhol|nachzuhol|unterschr|ausfüll|ausgefüllt|beseitig|entfern|herunter|kürzen|schneid|frist|fällig|restbetrag|restzahlung|anzahlung|erstatten|nachweis|buchen sie|sagen sie|geben sie|gebt|sagt|meldet/i;
const KEINE_FRIST = /kündig|widerspr|widerruf|einspruch|klage|gültig|garantie|gewährleist|umtausch|original|verlänger|laufzeit|befristet|bewillig|zeitraum|\bzeit\b|\bgilt\b|gelten|abgelaufen|versichert|preisbindung|abgebucht|eingezogen|ziehen wir|buchen wir|erhalten sie|überweisen wir|zahlen wir|erstatten wir|endet|ablauf|beginn|gebunden|zinsbindung|beitragszahlung|leistungsdauer|stichtag|\bläuft|\bhalte[nt]?\b|nur bis|bei (?:abschluss|zahlung|bestellung|buchung)\b|\bskonto|\d\.\s*(?:\([^)]*\)\s*)?(?:–|-|bis)\s*(?:zum\s+)?$|\d{1,2}\.\d{1,2}\.(?:\d{2,4})?\s*(?:–|-|bis)\s*(?:zum\s+)?(?:[a-z]{2}\.?,?\s+)?$|\b(?:19|20)\d{2}\s*(?:–|-|bis)\s*$/i;
const ohneVerneinung = (x) => x.replace(/rücklastschrift\w*/gi, "").replace(/(?:kein\w*|nicht|ohne)\b[^.]{0,60}?(?:lastschrift\w*|mandat|einzug\w*)/gi, "").replace(/(?:lastschrift\w*|mandat|einzug\w*)[^.]{0,50}?(?:nicht vor|nicht erteilt|nicht vorliegt|fehlt)/gi, "").replace(/(?:sofern|falls|wenn)\b[^.]{0,80}?(?:lastschrift\w*|mandat|einzug\w*|abbuch\w*)[^.]*/gi, "");
const ABBUCHUNG = /abbuch|abgebucht|buchen wir|ziehen wir|eingezogen|einzug|lastschrift|sepa-mandat|belasten wir|wird belastet/i;
const TERMIN_WORT = /termin|wann\s*:|tag\s*:|beginn\s*:|am\s*:|abfahrt|reserviert|gebucht|einladung|kommen sie|findet statt|bitte erscheinen|kommt am|kommt!?\s|vorbei/i;
function satzUm(t, pos, ende) {
  const vorRoh = t.slice(Math.max(0, pos - 170), pos), nachRoh = t.slice(ende, ende + 110);
  const schnitt = Math.max(...[...vorRoh.matchAll(/[.!?]\s+(?=[A-ZÄÖÜ„"])|\s[•*]\s|\s-\s(?=[A-ZÄÖÜ])|-{3,}\s|(?:€|EUR)\s+(?=[A-ZÄÖÜ][a-zäöü])/g)].map((m) => (m.index ?? 0) + m[0].length), 0);
  const nachEnde = nachRoh.search(/[.!?](\s+[A-ZÄÖÜ„"]|\s*$)/);
  return { vor: vorRoh.slice(schnitt), nach: nachEnde >= 0 ? nachRoh.slice(0, nachEnde) : nachRoh };
}
function erkenneFrist(text, dokumentDatum, datumSicher = true) {
  const t = text.replace(/\s+/g, " ");
  const stellen = datumsStellen(t, dokumentDatum);
  const tun = [], faellig = [], termin = [];
  const zuFrueh = (iso) => datumSicher && !!dokumentDatum && iso < dokumentDatum, zuFern = (iso) => datumSicher && !!dokumentDatum && Date.parse(iso) - Date.parse(dokumentDatum) > 548 * 864e5;
  for (const s of stellen) {
    if (zuFrueh(s.iso) || zuFern(s.iso)) continue;
    const { vor, nach } = satzUm(t, s.pos, s.ende);
    if (/^\s*\S*\s*(?:\S+\s+){0,3}(?:\d+(?:,\d+)?\s*%\s*)?\bskonto/i.test(nach)) continue;
    if (/\d{1,2}\.(?:\d{1,2}\.)?(?:\d{2,4})?\s*(?:\([^)]*\)\s*)?(?:–|-|bis)\s*(?:zum\s+)?(?:[a-z]{2}\.?,?\s+)?$|\b(?:19|20)\d{2}\s*(?:–|-|bis)\s*$/i.test(t.slice(Math.max(0, s.pos - 30), s.pos))) continue;
    const klein2 = (x) => x.toLowerCase();
    const zitat = `${vor.slice(-45)}${t.slice(s.pos, s.ende)}`.trim();
    const direkt = klein2(vor.slice(-60));
    const nah = klein2(vor.slice(-90));
    const bitte = Math.max(nah.lastIndexOf("bitte"), nah.lastIndexOf("fordere"), nah.lastIndexOf("fordern"));
    const teilsatz = (bitte >= 0 ? nah.slice(bitte) : nah.slice(-60)) + " " + klein2(nach.split(/[,;(]/)[0].slice(0, 45));
    const bis = new RegExp(`(?:\\bbis|sp\xE4testens|\\balso|das ist der|das w\xE4re der)\\s*(?:sp\xE4testens\\s+|zum\\s+|am\\s+|bis\\s+|zum\\s+ablauf\\s+des\\s+|einschlie\xDFlich\\s+|ende\\s+\\S+\\s+|(?:[a-z\xE4\xF6\xFC]+\\s+){1,4}(?=\\())?\\(?(?:${WOCHENTAG})?(?:den\\s+|dem\\s+)?$`, "i").test(direkt);
    if (bis && !KEINE_FRIST.test(teilsatz) && (/spätestens/.test(direkt) || HANDLUNG.test(klein2(vor) + " " + klein2(nach)))) {
      tun.push({ iso: s.iso, grund: `\u201E${zitat}\u201C`, pos: s.pos });
      continue;
    }
    const zahl = /(zahlbar\s+(?:bis|zum|bis zum|am)|fällig(?:keit(?:en)?)?\s*(?:am|zum|bis|:)?|zahlungsziel\s*:?|zahlungsziel[^.(]{0,20}\(|zahlungstermine?\s*:?|stichtag\s*:?|frist(?:ende)?\s*:|zahlungsfrist\s*:?|letzter\s+termin\s*:?)\s*(?:[a-zäöü]{2,4}\.?,?\s+)?$/i.test(direkt) && !/hauptfällig|jährlich|monatlich|quartal|jeweils/i.test(direkt) || /^\s*(?:\S+\s+){0,2}fällig\b/i.test(nach) && /\bam\s+$/i.test(direkt) && !/jeweils|jährlich/i.test(direkt) || /fällig\w*\b[^.]{0,45}\bam\s+$/i.test(direkt) && !/hauptfällig/i.test(direkt);
    if (zahl && !ABBUCHUNG.test(ohneVerneinung(klein2(t.slice(Math.max(0, s.pos - 160), s.ende + 120)))) && !(dokumentDatum && Date.parse(s.iso) - Date.parse(dokumentDatum) > 400 * 864e5) && !/abgelaufen|verstrichen|\bwar\b|gewesen/.test(klein2(nach.slice(0, 40)))) {
      faellig.push({ iso: s.iso, grund: `\u201E${zitat}\u201C`, pos: s.pos });
      continue;
    }
    const uhr = /^\)?[,;:]?\s*(?:zeit\s*:\s*)?(?:um\s*:?\s*|ab\s+|von\s+|bis\s+|zwischen\s+|zw\.\s+|gegen\s+|ca\.\s+)?\d{1,2}(?:[:.]\d{2})?(?:\s*(?:–|-|bis|und)\s*(?:ca\.\s*)?\d{1,2}(?:[:.]\d{2})?)?\s*uhr|^\)?[,;]?\s*(?:um|zwischen|zw\.)\s*:?\s*\d{1,2}[:.]\d{2}|^[,:]?\s+\d{1,2}:\d{2}\b/i.test(nach) || /^\s*[–-]\s*(?:bitte\s+)?(?:um|ab|bis|zwischen)\s*\d{1,2}[:.]\d{2}/i.test(nach);
    const tagDavor = new RegExp(`(?:^|[\\s:(])${WOCHENTAG}$`, "i").test(direkt);
    const etikett = /(?:termin|wann|tag|abfahrt|am|datum des termins|datum)\s*:\s*(?:\S+\s+)?$/i.test(direkt);
    const ohneUhr = /(?:(?:aufnahme\w*|anreise\w*)\s+ist\s+|(?:erster|nächster|ihr|neuer)\s+termin\s*:?\s*|(?:termin|wann|tag|beginn)\s*:\s*(?=\S+\s))(?:\S+\s+)?$/i.test(direkt) && (tagDavor || /termin\s*:?\s*$/i.test(direkt));
    const vermerk = /(?:gebucht|bestellt|angenommen|erstellt|gedruckt|eingegangen|erhalten|ausgestellt|endet|ablauf|beginn|versicherungsbeginn|lieferbeginn)\s*:?\s+(?:am\s+)?$/i.test(direkt);
    const mailkopf = /(?:datum|gesendet|date|sent|vom)\s*:\s*(?:\S+\s+)?$/i.test(direkt) || /(?:kasse|bon|beleg)\b/i.test(nach.slice(0, 30));
    if (!mailkopf && !vermerk && ohneUhr && !uhr) termin.push({ iso: s.iso, grund: `Termin \u201E${zitat}\u201C`, pos: s.pos, sicher: false });
    else if (!mailkopf && !vermerk && uhr && (tagDavor || etikett || /\b(?:am|auf)\s+(?:\S+\s+)?$/i.test(direkt)) && !KEINE_FRIST.test(klein2(vor.replace(/\([^)]*\)/g, "").slice(-60)))) {
      termin.push({ iso: s.iso, grund: `Termin \u201E${zitat}\u201C`, pos: s.pos, sicher: TERMIN_WORT.test(vor.slice(-120)) && (tagDavor || etikett) });
    }
  }
  if (tun.length) {
    const f = datumSicher && dokumentDatum ? tun[0] : tun[tun.length - 1];
    return w(f.iso, !(dokumentDatum && Date.parse(f.iso) - Date.parse(dokumentDatum) > 400 * 864e5), f.grund);
  }
  if (faellig.length) {
    const f = faellig[0];
    return w(f.iso, true, f.grund);
  }
  if (termin.length) {
    const f = termin[0];
    return w(f.iso, f.sicher, f.grund);
  }
  const tage = t.match(/(?:zahlbar|zahlen|zahlung|überweisen|begleichen|ausgleich)[^.]{0,60}?(?:innerhalb|binnen)\s+(?:von\s+)?(\d{1,3})\s+tagen/i);
  if (tage && dokumentDatum && !ABBUCHUNG.test(t)) {
    const d = /* @__PURE__ */ new Date(`${dokumentDatum}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Number(tage[1]));
    return w(d.toISOString().slice(0, 10), false, `\u201E${tage[0].slice(-40)}\u201C ab Briefdatum gerechnet`);
  }
  return void 0;
}
function erkenneBetrag(text) {
  const t = text.replace(/\s+/g, " ");
  const genannt = t.match(/(?:gesamtbetrag|rechnungsbetrag|zu zahlen|betrag|summe|offener betrag)[^0-9]{0,30}(\d{1,3}(?:\.\d{3})*,\d{2})\s?(?:€|eur)/i) || t.match(/(?:summe|gesamt|total|zu zahlen)\s*(?:eur|€)?\s*:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})(?!\d)/i);
  if (genannt) return w(`${genannt[1]} \u20AC`, true, `\u201E${genannt[0].trim()}\u201C`);
  const alle = [...t.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s?(?:€|eur)\b/gi)].map((m) => m[1]);
  if (!alle.length) return void 0;
  const zahl = (s) => Number(s.replace(/\./g, "").replace(",", "."));
  const groesster = alle.sort((a, b) => zahl(b) - zahl(a))[0];
  return w(`${groesster} \u20AC`, false, "gr\xF6\xDFter Betrag im Text");
}
function dringlichkeit(frist, heute) {
  if (!frist) return "keine Frist";
  if (frist < heute) return "Frist \xFCberschritten";
  const tage = (Date.parse(`${frist}T12:00:00Z`) - Date.parse(`${heute}T12:00:00Z`)) / 864e5;
  return tage <= 7 ? "diese Woche" : "sp\xE4ter";
}
export {
  SCHRIFTSTUECKE,
  absenderAusGruss,
  datumeImText,
  dringlichkeit,
  erkenneAbsender,
  erkenneBetrag,
  erkenneBetrifft,
  erkenneDatum,
  erkenneFrist,
  erkenneKategorie,
  erkenneNummern,
  erkenneSchriftstueck,
  isoDatum,
  kennzeichenImText,
  nameAusZeile
};
