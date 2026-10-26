/* Vorgänge und Fassungen (Brief § 7a). Eine Fassung ist ein vollständiger
   Stand aller drei Stufen. Eine UNTERSCHRIEBENE Fassung ist eingefroren:
   sie behält Stundensatz und Umsatzsteuer für immer. Nur die jüngste,
   nicht unterschriebene Fassung lässt sich bearbeiten. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  /* Kundenfelder und ihre FESTEN Platzhalter (§ 7e): dieselbe Firma heißt in
     F1 und F5 gleich, auch wenn sie erst später eingetragen wird. */
  WN.KUNDENFELDER = [
    { id: "firma", token: "⟦KUNDE-1⟧", name: { de: "Firma", en: "Company" } },
    { id: "ansprechpartner", token: "⟦KUNDE-2⟧", name: { de: "Ansprechpartner", en: "Contact person" } },
    { id: "anschrift", token: "⟦KUNDE-3⟧", name: { de: "Anschrift", en: "Address" } },
    { id: "mail", token: "⟦KUNDE-4⟧", name: { de: "E-Mail", en: "E-mail" } },
    { id: "telefon", token: "⟦KUNDE-5⟧", name: { de: "Telefon", en: "Phone" } },
    { id: "kundennummer", token: "⟦KUNDE-6⟧", name: { de: "Kundennummer", en: "Customer number" } },
  ];

  function kopie(x) { return JSON.parse(JSON.stringify(x)); }
  function heute() { return new Date().toISOString().slice(0, 10); }
  function vier(n) { return ("000" + n).slice(-4); }

  /* einst: { satzCent, ust:{modus,satz}, zeitraum } — die Vorgabe wird KOPIERT */
  function neuerVorgang(nr, einst, datum) {
    var d = datum || heute();
    var v = { id: "V-" + d.slice(0, 4) + "-" + vier(nr), titel: "", angelegt: d,
      kunde: {}, eigenesVorhaben: false, weitereNamen: "", zuordnung: {}, zaehler: { B: 0, K: 0, O: 0 }, fassungen: [] };
    WN.KUNDENFELDER.forEach(function (f) { v.kunde[f.id] = ""; });
    v.fassungen.push({ nr: 1, anlass: "", von: "", datum: d, unterschrieben: null,
      satzCent: einst && einst.satzCent != null ? einst.satzCent : 8000, ust: null,
      protokoll: WN.bedarf.leeresProtokoll(),
      umfang: { bausteine: [], firmenanpassung: { von: 2, bis: 6 }, abstimmungPct: 15, pufferPct: 20,
        kundenStundenwertCent: null, grenzeManuell: null,
        gewaehrleistungH: einst && einst.wartung && einst.wartung.freistunden != null ? Number(einst.wartung.freistunden) || 0 : 0 },
      angebot: { nummer: "AN-" + d.slice(0, 4) + "-" + vier(nr), datum: d, gueltigBis: WN.rechnen.datumPlus(d, 4),
        preisbasis: "mitte", zahlungNachTest: false, zahlung: "", ueber: {} } });
    return v;
  }

  function aktuelle(v) { return v.fassungen[v.fassungen.length - 1]; }
  function bearbeitbar(v, f) { return !!f && f === aktuelle(v) && !f.unterschrieben; }

  /* Neue Fassung: verlangt Anlass und „von wem" (§ 7a). */
  var VON = ["kunde", "betrieb", "bau"];
  function neueFassung(v, angaben) {
    var a = angaben || {};
    if (!String(a.anlass || "").trim()) return { ok: false, grund: "anlass" };
    if (VON.indexOf(a.von) < 0) return { ok: false, grund: "von" };
    var alt = aktuelle(v);
    var f = kopie(alt);
    f.nr = alt.nr + 1; f.anlass = String(a.anlass).trim(); f.von = a.von;
    f.datum = a.datum || heute(); f.unterschrieben = null; f.ust = null;
    v.fassungen.push(f);
    return { ok: true, fassung: f };
  }

  /* Unterschreiben friert Satz und Umsatzsteuer ein. */
  function unterschreiben(v, f, ustEinst, datum) {
    if (!f || f.unterschrieben) return false;
    f.unterschrieben = datum || heute();
    f.ust = kopie(ustEinst || { modus: "regel", satz: 19 });
    return true;
  }
  /* Welche Umsatzsteuer gilt: eingefroren oder die Einstellung von jetzt */
  function ustVon(f, ustEinst) { return f.ust ? f.ust : (ustEinst || { modus: "regel", satz: 19 }); }

  /* ── Vergleich F(n−1) → F(n) ── */
  function gleich(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function eintragKern(e) {
    var k = { text: e.text };
    ["anzahl", "prio", "nutzen", "wer", "bis"].forEach(function (n) { if (e[n] !== undefined) k[n] = e[n]; });
    return k;
  }
  function bausteinKern(b) {
    return { katalog: b.katalog || null, name: b.name || "", menge: b.menge, groesse: b.groesse || null,
      faktoren: (b.faktoren || []).slice().sort(), deckt: (b.deckt || []).slice().sort(),
      manuell: b.manuell || null, wv: b.wv == null ? null : b.wv, satzCent: b.satzCent == null ? null : b.satzCent,
      ermaessigt: !!b.ermaessigt };
  }

  function vergleich(alt, neu, tabellen) {
    var R = WN.rechnen;
    var out = { bedarf: [], bausteine: [], satz: null };
    var a = {}, n = {};
    WN.bedarf.alleEintraege(alt.protokoll).forEach(function (x) { a[x.e.id] = x; });
    WN.bedarf.alleEintraege(neu.protokoll).forEach(function (x) { n[x.e.id] = x; });
    var ids = Object.keys(a).concat(Object.keys(n).filter(function (id) { return !a[id]; }));
    ids.forEach(function (id) {
      var x = a[id], y = n[id];
      var st = !x ? "neu" : !y ? "entfallen" : gleich(eintragKern(x.e), eintragKern(y.e)) ? "gleich" : "geaendert";
      out.bedarf.push({ id: id, nr: (y || x).nr, status: st, alt: x ? x.e : null, neu: y ? y.e : null,
        sichtbarWechsel: !!(x && y && x.e.sichtbar !== y.e.sichtbar) });
    });
    var sa = R.schaetze(alt, tabellen), sn = R.schaetze(neu, tabellen);
    var ba = {}, bn = {};
    (alt.umfang.bausteine || []).forEach(function (b, i) { ba[b.id] = { b: b, z: sa.zeilen[i] }; });
    (neu.umfang.bausteine || []).forEach(function (b, i) { bn[b.id] = { b: b, z: sn.zeilen[i] }; });
    var kids = Object.keys(ba).concat(Object.keys(bn).filter(function (id) { return !ba[id]; }));
    function mitte(z) { return z && z.geschaetzt ? (z.von + z.bis) / 2 : 0; }
    function kost(z) { return z && z.geschaetzt ? Math.round((z.kostenVon + z.kostenBis) / 2) : 0; }
    kids.forEach(function (id) {
      var x = ba[id], y = bn[id];
      var st = !x ? "neu" : !y ? "entfallen" : gleich(bausteinKern(x.b), bausteinKern(y.b)) ? "gleich" : "geaendert";
      var aktion = st === "neu" ? "NEU BAUEN" : st === "entfallen" ? "ENTFERNEN" : st === "geaendert" ? "ANPASSEN" : "UNVERÄNDERT";
      if (y && !y.z.geschaetzt) aktion = "NOCH NICHT GESCHÄTZT";
      out.bausteine.push({ id: id, status: st, aktion: aktion, alt: x ? x.b : null, neu: y ? y.b : null,
        zAlt: x ? x.z : null, zNeu: y ? y.z : null,
        stundenDiff: mitte(y && y.z) - mitte(x && x.z), kostenDiff: kost(y && y.z) - kost(x && x.z) });
    });
    /* Satzänderung als eigene Zeile: was kostet DIE NEUE ARBEIT beim alten Satz? */
    if (alt.satzCent !== neu.satzCent) {
      var neuBeiAlt = kopie(neu); neuBeiAlt.satzCent = alt.satzCent;
      var s3 = R.schaetze(neuBeiAlt, tabellen);
      var m = function (s) { return Math.round((s.kostenVon + s.kostenBis) / 2); };
      out.satz = { alt: alt.satzCent, neu: neu.satzCent, effektCent: m(sn) - m(s3), arbeitCent: m(s3) - m(sa) };
    }
    out.summe = { stundenAlt: [sa.stundenVon, sa.stundenBis], stundenNeu: [sn.stundenVon, sn.stundenBis],
      kostenAlt: [sa.kostenVon, sa.kostenBis], kostenNeu: [sn.kostenVon, sn.kostenBis] };
    return out;
  }

  WN.fassungen = { neuerVorgang: neuerVorgang, aktuelle: aktuelle, bearbeitbar: bearbeitbar, neueFassung: neueFassung,
    unterschreiben: unterschreiben, ustVon: ustVon, vergleich: vergleich, kopie: kopie, heute: heute, VON: VON };
})(typeof window !== "undefined" ? window : globalThis);
