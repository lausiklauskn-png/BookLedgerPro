/* Was das Haus verlässt — per WHITELIST gebaut (Muster: BookLedgerPro
   src/domain/angebote.js, externesAngebot/externePosition).

   ⛔ PRIME DIRECTIVE: Stundensatz, Stunden, Faktoren, Wiederverwendung,
   Markt-Tabellen, Kosten-Nutzen und interne Notizen erscheinen NIE auf einem
   Kundenausdruck. Jede Funktion hier liest aus dem Vorgang nur die Felder,
   die sie ausdrücklich nennt, und gibt ein NEUES Objekt zurück. Die Oberfläche
   zeichnet das Druckblatt allein aus diesem Objekt — nicht aus der Ansicht
   durch Verstecken (display:none ist kein Schutz).

   Namen (Brief § 14.4): „Bedarfsprotokoll" = für den Kunden, „Bedarfsanalyse"
   = für Klaus. Ein Kundenblatt trägt nie das Wort „Analyse". */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function firmaExtern(f) {
    f = f || {};
    return { name: String(f.name || ""), anschrift: String(f.anschrift || ""), kontakt: String(f.kontakt || ""),
      steuer: String(f.steuer || ""), bank: String(f.bank || ""), logo: /^data:image\/(png|jpeg|webp);base64,/.test(f.logo || "") ? f.logo : "" };
  }
  /* Kunde: Klartext, sonst LEER — nie ein Platzhalter. Platzhalter ⟦KUNDE-n⟧ gehören
     in die Bauauftrags-MD, nie auf ein Kundenblatt (Befund Klaus' Tablet 2026-10-07,
     „für: ⟦KUNDE-1⟧ / ⟦KUNDE-2⟧ / ⟦KUNDE-3⟧“). Das Druckblatt zeichnet für ein leeres
     Feld eine Schreiblinie zum Ausfüllen von Hand. ⚠ Tafel-Evolution: bis Stufe 2 stand
     hier der Platzhalter, „nie ein leeres Feld“. */
  function kundeExtern(v) {
    var k = {};
    WN.KUNDENFELDER.forEach(function (f) {
      k[f.id] = String((v.kunde && v.kunde[f.id]) || "").replace(/⟦[^⟧]*⟧/g, "").trim();
    });
    return k;
  }
  function eintragExtern(nr, e, sterne) {
    var o = { id: String(e.id), text: String(e.text || "") };
    if (nr === 6 && sterne && sterne[e.id]) o.sterne = { schnitt: sterne[e.id].schnitt, anzahl: sterne[e.id].anzahl };
    if (nr === 3) o.anzahl = Number(e.anzahl) || 0;
    if (nr === 18) { o.wer = String(e.wer || ""); o.bis = String(e.bis || ""); }
    return o;
  }

  /* Stufe 1 für den Kunden: nur Freigegebenes. Ein Bereich, in dem nichts
     freigegeben ist, fällt ganz weg. Prioritäten und Nutzen sind Angaben des
     Kunden und stehen in 16/17 je Bedarf. */
  function kundenProtokoll(v, f, firma) {
    var bereiche = [], aus = 0;
    var bed = WN.bedarf.bedarfe(f.protokoll);
    var bedFrei = (f.protokoll.bereiche[6].sichtbar ? bed : []).filter(function (e) { return e.sichtbar; });
    var sterne = WN.bedarf.sterneZusammen(v, "bedarf");
    WN.BEREICHE.forEach(function (b) {
      var roh = f.protokoll.bereiche[b.nr];
      var eintraege = [];
      if (b.art === "prio" || b.art === "nutzen") {
        if (roh.sichtbar) bedFrei.forEach(function (e) {
          if (b.art === "prio" && e.prio) eintraege.push({ id: e.id, text: String(e.text || ""), prio: e.prio });
          if (b.art === "nutzen" && WN.bedarf.hatNutzen(e)) eintraege.push({ id: e.id, text: String(e.text || ""),
            nutzen: { stundenMonat: e.nutzen.stundenMonat, euroMonat: e.nutzen.euroMonat, text: String(e.nutzen.text || "") } });
        });
      } else {
        roh.eintraege.forEach(function (e) {
          if (roh.sichtbar && e.sichtbar) eintraege.push(eintragExtern(b.nr, e, sterne)); else aus++;
        });
      }
      if (eintraege.length) bereiche.push({ nr: b.nr, eintraege: eintraege });
    });
    WN.BEREICHE.forEach(function (b) { if (String(f.protokoll.bereiche[b.nr].notiz || "").trim()) aus++; });
    return { art: "protokoll", firma: firmaExtern(firma), kunde: kundeExtern(v), vorgang: v.id,
      titel: String(v.titel || ""), fassung: f.nr, datum: f.datum, unterschrieben: f.unterschrieben || "",
      bereiche: bereiche, ausgeblendet: aus,
      erklaerungVom: v.erklaerung && v.erklaerung.aktiviert ? String(v.erklaerung.aktiviert) : "" };
  }

  /* Angebot (Stufe 3) */
  function angebotExtern(v, f, firma, ustEinst, tabellen, zeitraum, lang) {
    var R = WN.rechnen;
    var s = R.schaetze(f, tabellen);
    var kn = R.kostenNutzen(f, s, zeitraum);
    var pos = R.positionen(f, s, kn, tabellen, lang);
    var ust = WN.fassungen.ustVon(f, ustEinst);
    function ext(p) { return { beschreibung: String(p.beschreibung), nettoCent: Math.round(p.nettoCent),
      ustSatz: ust.modus === "p19" ? 0 : (p.ermaessigt ? 7 : Number(ust.satz)) }; }
    var haupt = pos.haupt.map(ext), optional = pos.optional.map(ext);
    var summen = R.ust(pos.haupt, ust);
    var ph = R.phasen(s);
    var a = f.angebot || {};
    return { art: "angebot", firma: firmaExtern(firma), kunde: kundeExtern(v), nummer: String(a.nummer || ""),
      titel: String(v.titel || ""), datum: String(a.datum || f.datum), gueltigBis: String(a.gueltigBis || ""),
      fassung: f.nr, positionen: haupt, optional: optional,
      summen: { p19: summen.p19, netto: summen.netto, zeilen: summen.zeilen.map(function (z) { return { satz: z.satz, netto: z.netto, ust: z.ust }; }), ust: summen.ust, brutto: summen.brutto },
      phasen: { bauWochen: ph.wochen[2].wochen, testWochen: ph.wochen[3].wochen },
      zahlung: String(a.zahlung || ""), zahlungNachTest: !!a.zahlungNachTest,
      gewaehrleistung: s.gewaehrleistung.stunden > 0 ? { umfang: s.gewaehrleistung.stunden } : null };
  }

  /* Nachtrag F(alt) → F(neu): nur Änderungen, die der Kunde sehen darf. */
  function nachtragExtern(v, alt, neu, firma, ustEinst, tabellen, zeitraum, lang) {
    var A = angebotExtern(v, alt, firma, ustEinst, tabellen, zeitraum, lang);
    var N = angebotExtern(v, neu, firma, ustEinst, tabellen, zeitraum, lang);
    var vg = WN.fassungen.vergleich(alt, neu, tabellen);
    var aend = [];
    vg.bedarf.forEach(function (x) {
      if (x.status === "gleich") return;
      var frei = function (f, e) { return !!e && e.sichtbar && f.protokoll.bereiche[x.nr].sichtbar; };
      if (!frei(alt, x.alt) && !frei(neu, x.neu)) return;
      aend.push({ id: x.id, art: x.status, alt: x.alt && frei(alt, x.alt) ? String(x.alt.text || "") : "",
        neu: x.neu && frei(neu, x.neu) ? String(x.neu.text || "") : "" });
    });
    var namen = function (f) { var m = {}; (f.umfang.bausteine || []).forEach(function (b) { m[b.id] = WN.rechnen.bausteinName(b, tabellen, lang); }); return m; };
    var na = namen(alt), nn = namen(neu);
    var leist = [];
    vg.bausteine.forEach(function (x) {
      if (x.status === "gleich") return;
      var text = x.status === "entfallen" ? na[x.id] : nn[x.id];
      if (x.status === "geaendert" && x.zAlt && x.zNeu && x.zAlt.menge !== x.zNeu.menge) text += " (" + x.zAlt.menge + "× → " + x.zNeu.menge + "×)";
      leist.push({ id: x.id, art: x.status, text: String(text || ""), offen: x.aktion === "NOCH NICHT GESCHÄTZT" });
    });
    var ph = WN.rechnen.phasen(WN.rechnen.schaetze(neu, tabellen));
    return { art: "nachtrag", firma: A.firma, kunde: A.kunde, nummer: A.nummer, titel: A.titel,
      fassungAlt: alt.nr, fassungNeu: neu.nr, datum: neu.datum, anlass: String(neu.anlass || ""),
      bedarf: aend, leistungen: leist,
      alt: { netto: A.summen.netto, brutto: A.summen.brutto }, neu: { netto: N.summen.netto, brutto: N.summen.brutto, p19: N.summen.p19 },
      diff: { netto: N.summen.netto - A.summen.netto, brutto: N.summen.brutto - A.summen.brutto },
      termin: WN.rechnen.datumPlus(neu.datum, ph.summeWochen) };
  }

  /* Bedarfsanalyse (für Klaus): alles — kein Whitelist-Zwang, aber eigener Titel. */
  function analyseIntern(v, f, firma, ustEinst, tabellen, zeitraum, lang) {
    var R = WN.rechnen;
    var s = R.schaetze(f, tabellen);
    return { art: "analyse", firma: firmaExtern(firma), kunde: kundeExtern(v), vorgang: v.id, titel: v.titel,
      fassung: f.nr, datum: f.datum, protokoll: f.protokoll, umfang: f.umfang, schaetzung: s,
      sichten: R.sichten(s, tabellen), kn: R.kostenNutzen(f, s, zeitraum), satzCent: f.satzCent };
  }


  /* ════ Rechtsblätter (Stufe 3 § 4): Verschwiegenheits- und Datenschutzerklärung ·
     Vereinbarung zu Zahlung und Nutzungsrechten · Wartungsvertrag.
     ⚠ ENTWÜRFE, kein Rechtsrat — die App sagt am Blatt „vor Verwendung prüfen lassen“.
     Verbindlich ist die deutsche Fassung; der Text bleibt deshalb Deutsch.
     Gebaut wie alles hier: nur aus genannten Feldern, ein NEUES Objekt.
     ⛔ Der Stundensatz steht NUR im Wartungsvertrag (Klaus' ausdrückliches Ja,
     2026-10-07: „Stundensatz im Wartungsvertrag — ja“). Erklärung und Vereinbarung
     tragen keinen; die 73-€-Probe misst beide Richtungen.
     Aktiviert = beide Unterschriften (oder „auf Papier unterschrieben“). Beim Aktivieren
     wird das Blatt EINGEFROREN: v[art].stand hält Text, Firma, Kunde, Zahlen fest. ════ */
  var RECHT_ARTEN = ["erklaerung", "vereinbarung", "wartung"];
  var TEXTFASSUNG = { erklaerung: 1, vereinbarung: 1, wartung: 1 };
  var TEXTSTAND = "2026-10-07";
  var TITEL = { erklaerung: "Verschwiegenheits- und Datenschutzerklärung", vereinbarung: "Vereinbarung zu Zahlung und Nutzungsrechten", wartung: "Wartungsvertrag" };
  function eurDe(c) { return WN.geld.formatEuro(c, "de"); }
  function wer(fi) { return String(fi.name || "").trim() || "der Auftragnehmer"; }
  function kundeWort(k) { return String(k.firma || "").trim() || "der Kunde"; }
  /* „Für den Auftragnehmer“, nicht „Für der Auftragnehmer“ (Klaus' Tablet 2026-10-07) */
  function fuerWen(F) { return "Für " + (F === "der Auftragnehmer" ? "den Auftragnehmer" : F); }
  /* Wer mit wem: beide Vertragsparteien mit Namen und Anschrift, leere Felder bleiben leer
     (das Blatt zeichnet dort eine Schreiblinie). Gilt auch für schon eingefrorene Blätter. */
  function parteien(b) {
    var fi = b.firma || {}, k = b.kunde || {};
    return { auftragnehmer: [fi.name, fi.anschrift, fi.kontakt].map(function (x) { return String(x || "").trim(); }),
      auftraggeber: [k.firma, k.ansprechpartner, k.anschrift, [k.mail, k.telefon].filter(Boolean).join(" · "), k.kundennummer ? "Kundennummer " + k.kundennummer : ""].map(function (x) { return String(x || "").trim(); }) };
  }
  function linksText(t) { return String(t || "").replace(/^Für der Auftragnehmer/, "Für den Auftragnehmer"); }
  /* Die Fassung, auf die sich Vereinbarung und Wartung beziehen: gewählt, sonst die jüngste unterschriebene, sonst die aktuelle */
  function bezugFassung(v, r) {
    var nr = r && r.fassung;
    var f = (v.fassungen || []).filter(function (x) { return x.nr === nr; })[0];
    if (f) return f;
    var u = (v.fassungen || []).filter(function (x) { return x.unterschrieben; });
    return u.length ? u[u.length - 1] : WN.fassungen.aktuelle(v);
  }
  function abschnitt(nr, titel, text, extra) { var o = { nr: nr, titel: titel, text: text }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }

  function erklaerungText(fi, k) {
    var F = wer(fi), K = kundeWort(k);
    return { einleitung: F + " erklärt gegenüber " + K + ":", abschnitte: [
      abschnitt(1, "Vertraulichkeit", "Alles, was Sie uns im Gespräch, in Dateien oder auf anderem Weg mitteilen, behandeln wir vertraulich und geben es nicht an Dritte weiter. Für Geschäftliches gilt das bis drei Jahre nach Ende der Zusammenarbeit. Für personenbezogene Daten gilt es ohne zeitliche Grenze."),
      abschnitt(2, "Zweck", "Ihre Angaben verwenden wir nur für das Bedarfsprotokoll, das Angebot und — wenn Sie uns beauftragen — für die Umsetzung."),
      abschnitt(3, "Rechtsgrundlage", "Art. 6 Abs. 1 lit. b DSGVO: vorvertragliche Maßnahmen auf Ihre Anfrage, nach einem Auftrag die Erfüllung des Vertrags."),
      abschnitt(4, "Wo Ihre Daten liegen", "Auf unserem Gerät, in einer App ohne Server. Sicherungen dieser App sind verschlüsselt (AES-256-GCM)."),
      abschnitt(5, "Hilfe durch eine KI", "Nehmen wir eine KI zu Hilfe, geht an sie nur ein Bauauftrag, in dem Ihr Name, Ihre Kontaktdaten und eingetragene Begriffe durch Platzhalter ersetzt sind. Was die Erkennung nicht von selbst findet, bleibt stehen, bis wir es eintragen — deshalb sehen wir jeden Bauauftrag vor dem Senden durch."),
      abschnitt(6, "Löschung", "Auf Ihren Wunsch löschen wir Ihre Angaben, spätestens nach Ablauf der gesetzlichen Aufbewahrungsfristen."),
      abschnitt(7, "Ihre Rechte", "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) und das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren." + (String(fi.kontakt || "").trim() ? " Kontakt: " + String(fi.kontakt).trim() + "." : "")),
    ], schluss: "Diese Erklärung bekommen Sie zum Mitnehmen — ausgedruckt oder per E-Mail. Sie verschenken keine Daten.",
      links: fuerWen(F) + " (verpflichtet sich)", rechts: K + " (Erhalt bestätigt)" };
  }
  function vereinbarungText(v, f, fi, k, ctx) {
    var F = wer(fi), K = kundeWort(k);
    var an = angebotExtern(v, f, fi, ctx.ust, ctx.tabellen, ctx.zeitraum, "de");
    var ziel = WN.bedarf.bedarfe(f.protokoll).filter(function (e) { return e.sichtbar && f.protokoll.bereiche[6].sichtbar; }).map(function (e) { return e.id; });
    var R = WN.rechnen, s = R.schaetze(f, ctx.tabellen), kn = R.kostenNutzen(f, s, ctx.zeitraum), pos = R.positionen(f, s, kn, ctx.tabellen, "de");
    var zeilen = pos.haupt.map(function (p) { return { kennung: /^K-\d+$/.test(p.id) ? p.id : "", leistung: String(p.beschreibung), deckt: (p.deckt || []).join(", "), nettoCent: Math.round(p.nettoCent) }; });
    return { einleitung: F + " und " + K + " vereinbaren für den Auftrag „" + String(v.titel || an.nummer) + "“:", abschnitte: [
      abschnitt(1, "Das Ziel steht fest", "Grundlage sind das Bedarfsprotokoll und das Angebot " + an.nummer + ", Fassung " + f.nr + ". Gemessen wird der Erfolg an den Bedarfen " + (ziel.join(", ") || "des Bedarfsprotokolls") + " und an der Bewertung der Mitarbeiter, die im jeweiligen Fachbereich arbeiten (1 bis 5 Sterne)."),
      abschnitt(2, "Zahlung erst nach Abschluss", "Vor dem Ende des Projekts wird nichts fällig. Nach der Abnahme am Ende des Praxistests entscheiden Sie."),
      abschnitt(3, "Sie zahlen, was Sie behalten", "Abgerechnet wird je Baustein: Sie zahlen die Bausteine, die Sie behalten. Was Sie nicht behalten, wird nicht berechnet; dafür erhalten Sie kein Nutzungsrecht. Die Bewertung der Mitarbeiter und die Kennungen des Bedarfsprotokolls sind die Grundlage des Abnahme-Gesprächs, keine Rechen-Automatik.", { tabelle: zeilen }),
      abschnitt(4, "Rechte am Bau", "Urheberrecht und alle Rechte an Code, Bausteinen, Vorlagen und Werkzeugen bleiben bei " + F + "; " + F + " darf sie für andere Kunden weiterverwenden. Mit der Zahlung erhalten Sie ein einfaches, nicht übertragbares, zeitlich unbegrenztes Nutzungsrecht für Ihren eigenen Betrieb. Änderungen an der App nimmt nur " + F + " vor; lassen Sie die App nicht von anderen ändern."),
      abschnitt(5, "Was Ihnen gehört, bleibt Ihres", "Ihre Daten, Texte, Bilder, Logos und Kundenlisten bleiben Ihr Eigentum. Wir verwenden sie für niemanden sonst."),
      abschnitt(6, "Ohne Zahlung", "Kommt es nach der Abnahme nicht zur vereinbarten Zahlung, wird die Bedienung der App gesperrt. Ihre Daten bleiben vollständig erhalten und lassen sich weiterhin exportieren; es geht nichts verloren. Eine App, die nicht mehr online geht, sieht die Sperre erst bei ihrer nächsten Aktualisierung."),
      abschnitt(7, "Aktualisierungen", "Aktualisierungen der App erhalten Sie automatisch, solange Sie das wünschen. In den ersten zwei Jahren ab Abnahme sind sie kostenlos. Ab dem dritten Jahr laufen sie über den Wartungsvertrag. Ohne Wartungsvertrag läuft die App in ihrer letzten Fassung weiter, ohne Sperre."),
      abschnitt(8, "Grundversion und Verbesserungen", "Ausgeliefert wird die Grundversion nach Fassung " + f.nr + ". Aktualisierungen sind Verbesserungen, die " + F + " von sich aus vornimmt. Wünschen Sie eine Verbesserung oder Erweiterung, wird sie gesondert abgerechnet — als Nachtrag zu diesem Auftrag oder als neuer Auftrag."),
    ], bezug: { nummer: an.nummer, fassung: f.nr, ziel: ziel }, summen: { netto: an.summen.netto, brutto: an.summen.brutto, p19: an.summen.p19 },
      links: fuerWen(F), rechts: K };
  }
  function wartungText(v, f, fi, k, ctx) {
    var F = wer(fi), K = kundeWort(k);
    var an = angebotExtern(v, f, fi, ctx.ust, ctx.tabellen, ctx.zeitraum, "de");
    var w = ctx.wartung || {};
    var frei = Number((f.umfang && f.umfang.gewaehrleistungH) || 0), wochen = Number(w.wochen) || 0, pausch = w.pauschaleCent == null ? null : Math.round(Number(w.pauschaleCent));
    var p19 = WN.fassungen.ustVon(f, ctx.ust).modus === "p19";
    return { einleitung: F + " und " + K + " vereinbaren die Wartung der App aus dem Angebot " + an.nummer + ", Fassung " + f.nr + ":", abschnitte: [
      abschnitt(1, "Gegenstand", "Wartung der ausgelieferten Grundversion (Fassung " + f.nr + "). Änderungen an der App nimmt nur " + F + " vor."),
      abschnitt(2, "Fehlerbehebung in der Anfangsphase", frei > 0 ? "Inklusive " + WN.geld.formatStunden(frei, "de") + " Stunden Fehlerbehebung in den ersten " + (wochen || "–") + " Wochen nach der Abnahme. Sie sind im Angebot schon eingerechnet." : "In diesem Auftrag sind keine Freistunden für die Anfangsphase eingerechnet."),
      abschnitt(3, "Aktualisierungen", "In den ersten zwei Jahren ab Abnahme kostenlos. Ab dem dritten Jahr gegen eine Jahrespauschale" + (pausch ? " von " + eurDe(pausch) + (p19 ? " (gemäß § 19 UStG ohne Umsatzsteuer)" : " netto zuzüglich Umsatzsteuer") : " nach gesondertem Angebot") + ". Ohne Wartungsvertrag läuft die App in ihrer letzten Fassung weiter, ohne Sperre."),
      abschnitt(4, "Abrechnung nach Zeitaufwand", "Was über die Freistunden und die Aktualisierungen hinausgeht, wird nach Zeitaufwand abgerechnet. Dazu zählen Fehlersuche, Änderung, Test und Abstimmung. Verbesserungen und Erweiterungen auf Ihren Wunsch kommen als Nachtrag oder als neuer Auftrag."),
      abschnitt(5, "Stundensatz", eurDe(f.satzCent) + (p19 ? " je Stunde (gemäß § 19 UStG ohne Umsatzsteuer)." : " netto je Stunde, zuzüglich Umsatzsteuer.")),
    ], bezug: { nummer: an.nummer, fassung: f.nr }, satzCent: f.satzCent, freistunden: frei, wochen: wochen, pauschaleCent: pausch,
      links: fuerWen(F), rechts: K };
  }
  /* ctx: { firma, ust, tabellen, zeitraum, wartung } */
  function rechtsblatt(v, art, ctx) {
    if (RECHT_ARTEN.indexOf(art) < 0) return null;
    ctx = ctx || {};
    var r = v[art] || {};
    var stand;
    if (r.aktiviert && r.stand) stand = JSON.parse(JSON.stringify(r.stand));
    else {
      var fi = firmaExtern(ctx.firma), k = kundeExtern(v), f = bezugFassung(v, r);
      var txt = art === "erklaerung" ? erklaerungText(fi, k) : art === "vereinbarung" ? vereinbarungText(v, f, fi, k, ctx) : wartungText(v, f, fi, k, ctx);
      txt.einleitung = txt.einleitung.charAt(0).toUpperCase() + txt.einleitung.slice(1);
      stand = { art: art, titel: TITEL[art], textFassung: TEXTFASSUNG[art], textStand: TEXTSTAND, entwurf: true, firma: fi, kunde: k, vorgang: v.id,
        vorhaben: String(v.titel || ""), fassung: art === "erklaerung" ? null : f.nr, text: txt };
    }
    stand.aktiviert = r.aktiviert ? String(r.aktiviert) : "";
    stand.papier = !!r.papier;
    stand.unterschriftBetrieb = /^data:image\/png;base64,/.test(r.unterschriftBetrieb || "") ? r.unterschriftBetrieb : "";
    stand.unterschriftKunde = /^data:image\/png;base64,/.test(r.unterschriftKunde || "") ? r.unterschriftKunde : "";
    return stand;
  }
  function erklaerungExtern(v, ctx) { return rechtsblatt(v, "erklaerung", ctx); }
  function vereinbarungExtern(v, ctx) { return rechtsblatt(v, "vereinbarung", ctx); }
  function wartungExtern(v, ctx) { return rechtsblatt(v, "wartung", ctx); }
  function kannAktivieren(v, art) { var r = v[art] || {}; return !r.aktiviert && (!!r.papier || (!!r.unterschriftBetrieb && !!r.unterschriftKunde)); }
  /* Friert ein. Gibt false zurück, wenn es schon aktiviert ist oder Unterschriften fehlen. */
  function aktivieren(v, art, ctx, datum) {
    if (!kannAktivieren(v, art)) return false;
    var r = v[art];
    var b = rechtsblatt(v, art, ctx);
    ["aktiviert", "papier", "unterschriftBetrieb", "unterschriftKunde"].forEach(function (k) { delete b[k]; });
    if (r.fassung == null && b.fassung != null) r.fassung = b.fassung;
    r.stand = b;
    r.aktiviert = datum || WN.fassungen.heute();
    return true;
  }
  /* Klartext für mailto: Betreff und Text (ohne Unterschriften). */
  function alsText(b) {
    var P = parteien(b), zeile = function (a) { return a.filter(Boolean).join(", ").replace(/\n/g, ", ") || "________________"; };
    var L = [b.titel + (b.vorhaben ? " — " + b.vorhaben : ""), "", "Auftragnehmer: " + zeile(P.auftragnehmer), "Auftraggeber: " + zeile(P.auftraggeber), "", b.text.einleitung, ""];
    b.text.abschnitte.forEach(function (a) {
      L.push(a.nr + ". " + a.titel, a.text);
      (a.tabelle || []).forEach(function (z) { L.push("   " + [z.kennung, z.leistung, z.deckt ? "deckt " + z.deckt : "", eurDe(z.nettoCent) + " netto"].filter(Boolean).join(" · ")); });
      L.push("");
    });
    if (b.text.schluss) L.push(b.text.schluss, "");
    L.push(b.aktiviert ? "Unterschrieben" + (b.papier ? " auf Papier" : "") + " am " + b.aktiviert.split("-").reverse().join(".") + "." : "Noch nicht unterschrieben.");
    L.push("", [b.firma.name, b.firma.anschrift.replace(/\n/g, ", "), b.firma.kontakt].filter(Boolean).join(" · "));
    return { betreff: b.titel + (b.vorhaben ? " — " + b.vorhaben : ""), text: L.join("\n") };
  }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* Das Druckblatt als eigenständige HTML-Datei (für die Übergabe an WorkFloh) */
  function alsHtml(b) {
    var H = ["<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><title>" + esc(b.titel) + "</title>",
      "<style>body{font:11pt/1.45 Georgia,serif;max-width:760px;margin:30px auto;padding:0 16px;color:#000}h1{font:700 17pt Arial,sans-serif}h2{font:700 11.5pt Arial,sans-serif;margin:14px 0 4px}table{border-collapse:collapse;width:100%;font:10pt Arial,sans-serif}td{border-bottom:1px solid #999;padding:3px 5px}.p{display:flex;gap:30px;font:10pt/1.4 Arial,sans-serif;margin:10px 0 16px}.p div{flex:1}.u{display:flex;gap:30px;margin-top:30px;break-inside:avoid}.u div{flex:1;font:9pt Arial,sans-serif}.u .s{min-height:60px;border-bottom:1px solid #000;margin-bottom:4px}.u img{max-height:70px;display:block}</style></head><body>",
      "<h1>" + esc(b.titel) + "</h1>", "<p>" + esc(b.vorhaben) + "</p>"];
    var P = parteien(b), spalte = function (titel, a) { return "<div><b>" + titel + "</b><br>" + (a.filter(Boolean).map(function (x) { return esc(x).replace(/\n/g, "<br>"); }).join("<br>") || "________________") + "</div>"; };
    H.push("<div class=\"p\">" + spalte("Auftragnehmer", P.auftragnehmer) + spalte("Auftraggeber", P.auftraggeber) + "</div>", "<p>" + esc(b.text.einleitung) + "</p>");
    b.text.abschnitte.forEach(function (a) {
      H.push("<h2>" + a.nr + ". " + esc(a.titel) + "</h2><p>" + esc(a.text) + "</p>");
      if (a.tabelle && a.tabelle.length) H.push("<table>" + a.tabelle.map(function (z) { return "<tr><td>" + esc(z.kennung) + "</td><td>" + esc(z.leistung) + "</td><td>" + esc(z.deckt) + "</td><td style=\"text-align:right\">" + esc(eurDe(z.nettoCent)) + "</td></tr>"; }).join("") + "</table>");
    });
    if (b.text.schluss) H.push("<p>" + esc(b.text.schluss) + "</p>");
    var uf = function (bild, txt) { return "<div><div class=\"s\">" + (bild ? "<img alt=\"\" src=\"" + bild + "\">" : "") + "</div>" + esc(txt) + "<br>Ort, Datum, Unterschrift</div>"; };
    H.push("<div class=\"u\">" + uf(b.unterschriftBetrieb, linksText(b.text.links)) + uf(b.unterschriftKunde, b.text.rechts) + "</div>");
    H.push("<p style=\"font:9pt Arial,sans-serif\">" + esc(b.aktiviert ? "Unterschrieben" + (b.papier ? " auf Papier" : "") + " am " + b.aktiviert.split("-").reverse().join(".") : "Noch nicht unterschrieben") + " · Textfassung " + b.textFassung + "</p></body></html>");
    return H.join("\n");
  }

  /* Sternebogen zum Ankreuzen (Stufe 3 § 4f A, zuerst auf Papier): nur freigegebene Bedarfe,
     keine Namen — der Mitarbeiter trägt Fachbereich und Kürzel von Hand ein. */
  function sterneBogenExtern(v, f, firma, zeitpunkt) {
    var bed = WN.bedarf.bedarfe(f.protokoll).filter(function (e) { return e.sichtbar && f.protokoll.bereiche[6].sichtbar; });
    return { art: "sternebogen", zeitpunkt: zeitpunkt === "abnahme" ? "abnahme" : "bedarf", firma: firmaExtern(firma), kunde: kundeExtern(v),
      vorgang: v.id, titel: String(v.titel || ""), fassung: f.nr, bedarfe: bed.map(function (e) { return { id: String(e.id), text: String(e.text || "") }; }) };
  }

  WN.aussen = { RECHT_ARTEN: RECHT_ARTEN, TEXTFASSUNG: TEXTFASSUNG, rechtsblatt: rechtsblatt, parteien: parteien, linksText: linksText, erklaerungExtern: erklaerungExtern, vereinbarungExtern: vereinbarungExtern,
    wartungExtern: wartungExtern, kannAktivieren: kannAktivieren, aktivieren: aktivieren, alsText: alsText, alsHtml: alsHtml, sterneBogenExtern: sterneBogenExtern, kundenProtokoll: kundenProtokoll, angebotExtern: angebotExtern, nachtragExtern: nachtragExtern,
    analyseIntern: analyseIntern, kundeExtern: kundeExtern, firmaExtern: firmaExtern };
})(typeof window !== "undefined" ? window : globalThis);
