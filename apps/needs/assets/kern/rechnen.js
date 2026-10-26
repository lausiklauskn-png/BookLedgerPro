/* Stufe 2 · Umfang und Schätzung (intern) — reine Rechnung, ohne DOM.
   Brief § 5b–5d, § 8. Stunden bleiben ungerundet; Geld in ganzen Cent, je
   Posten einmal gerundet. Jede Zahl ist eine SCHÄTZUNG, keine Messung.

   Satz-Ebenen (§ 5c), die genaueste gewinnt:
     Baustein (bs.satzCent) → Fassung des Vorgangs (fassung.satzCent) → Vorgabe.
   Die Vorgabe aus den Einstellungen wird beim Anlegen des Vorgangs KOPIERT;
   eine spätere Änderung der Vorgabe ändert bestehende Vorgänge nicht. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var G = function () { return WN.geld; };

  function zahl(x) { if (x == null || x === "") return null; var n = Number(x); return Number.isFinite(n) ? n : null; }
  function katalogVon(tabellen, id) {
    var liste = (tabellen && tabellen.bausteine) || WN.BAUSTEINE || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }
  function faktorVon(tabellen, id) {
    var liste = (tabellen && tabellen.faktoren) || WN.FAKTOREN || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }
  function bausteinName(bs, tabellen, lang) {
    if (bs.name) return bs.name;
    var k = katalogVon(tabellen, bs.katalog);
    return k ? (k.name[lang || "de"] || k.name.de) : "?";
  }

  /* Eine Rechenzeile je Baustein. geschaetzt=false → „noch nicht geschätzt",
     zählt in keiner Summe mit (keine geratene Zahl). */
  function bausteinRechnen(bs, fassung, tabellen) {
    var k = katalogVon(tabellen, bs.katalog) || (bs.groesse ? katalogVon(tabellen, "neu") : null);
    var menge = Math.max(0, zahl(bs.menge) == null ? 1 : zahl(bs.menge));
    var satz = zahl(bs.satzCent) != null ? zahl(bs.satzCent) : fassung.satzCent;
    var weg = [];
    var r = { id: bs.id, menge: menge, groesse: bs.groesse || null, satzCent: satz,
      satzEigen: zahl(bs.satzCent) != null, geschaetzt: false, manuell: false, von: 0, bis: 0, weg: weg };
    var mv = bs.manuell && zahl(bs.manuell.von), mb = bs.manuell && zahl(bs.manuell.bis);
    if (mv != null && mb != null) {
      r.von = Math.min(mv, mb); r.bis = Math.max(mv, mb); r.geschaetzt = true; r.manuell = true;
      weg.push({ art: "manuell", von: r.von, bis: r.bis });
    } else if (k && bs.groesse && k.spannen[bs.groesse]) {
      var sp = k.spannen[bs.groesse];
      var von = sp[0] * menge, bis = sp[1] * menge;
      weg.push({ art: "spanne", groesse: bs.groesse, menge: menge, von: von, bis: bis });
      var wv = zahl(bs.wv) != null ? zahl(bs.wv) : (k.wv || 0);
      if (wv) {
        von *= (1 - wv); bis *= (1 - wv);
        weg.push({ art: "wv", anteil: wv, quelle: k.vorlage || "", von: von, bis: bis });
      }
      var mal = 1;
      (bs.faktoren || []).forEach(function (id) { var f = faktorVon(tabellen, id); if (f) mal *= f.mal; });
      if (mal !== 1) {
        von *= mal; bis *= mal;
        weg.push({ art: "faktoren", mal: mal, ids: (bs.faktoren || []).slice(), von: von, bis: bis });
      }
      r.von = von; r.bis = bis; r.geschaetzt = true;
    }
    r.kostenVon = r.geschaetzt ? Math.round(r.von * satz) : 0;
    r.kostenBis = r.geschaetzt ? Math.round(r.bis * satz) : 0;
    weg.push({ art: "satz", satzCent: satz, eigen: r.satzEigen });
    return r;
  }

  function schaetze(fassung, tabellen) {
    var u = fassung.umfang || {};
    var zeilen = (u.bausteine || []).map(function (bs) { return bausteinRechnen(bs, fassung, tabellen); });
    var s = { zeilen: zeilen, offen: [] };
    var bv = 0, bb = 0, kv = 0, kb = 0;
    zeilen.forEach(function (z) {
      if (!z.geschaetzt) { s.offen.push(z.id); return; }
      bv += z.von; bb += z.bis; kv += z.kostenVon; kb += z.kostenBis;
    });
    var fa = u.firmenanpassung || {};
    var fav = zahl(fa.von) || 0, fab = zahl(fa.bis) || 0;
    var summeV = bv + fav, summeB = bb + fab;
    var ap = zahl(u.abstimmungPct) == null ? 15 : zahl(u.abstimmungPct);
    var pp = zahl(u.pufferPct) == null ? 20 : zahl(u.pufferPct);
    s.bausteineVon = bv; s.bausteineBis = bb;
    s.firmenanpassung = { von: fav, bis: fab, kostenVon: Math.round(fav * fassung.satzCent), kostenBis: Math.round(fab * fassung.satzCent) };
    s.abstimmung = { pct: ap, von: summeV * ap / 100, bis: summeB * ap / 100 };
    s.puffer = { pct: pp, von: summeV * pp / 100, bis: summeB * pp / 100 };
    ["abstimmung", "puffer"].forEach(function (n) {
      s[n].kostenVon = Math.round(s[n].von * fassung.satzCent);
      s[n].kostenBis = Math.round(s[n].bis * fassung.satzCent);
    });
    /* Gewährleistung in der Anfangsphase (Stufe 3 § 4f D): Freistunden, „nur kalkuliert“ — intern ein
       eigener Posten, im Angebot steckt er anteilig in den Preisen (über den Zuschlag); der Kunde sieht nur
       „inklusive n Stunden Fehlerbehebung“. Fehlt das Feld (Vorgänge vor Stufe 3), ist es 0. */
    var gw = Math.max(0, zahl(u.gewaehrleistungH) || 0);
    s.gewaehrleistung = { stunden: gw, kostenVon: Math.round(gw * fassung.satzCent), kostenBis: Math.round(gw * fassung.satzCent) };
    s.stundenVon = summeV + s.abstimmung.von + s.puffer.von + gw;
    s.stundenBis = summeB + s.abstimmung.bis + s.puffer.bis + gw;
    s.kostenVon = kv + s.firmenanpassung.kostenVon + s.abstimmung.kostenVon + s.puffer.kostenVon + s.gewaehrleistung.kostenVon;
    s.kostenBis = kb + s.firmenanpassung.kostenBis + s.abstimmung.kostenBis + s.puffer.kostenBis + s.gewaehrleistung.kostenBis;
    var mitteBasis = (summeV + summeB) / 2;
    s.zuschlag = (ap + pp) / 100 + (gw && mitteBasis > 0 ? gw / mitteBasis : 0);
    s.satzCent = fassung.satzCent;
    return s;
  }

  /* Tage zu 8 Stunden (Anzeige) */
  function tage(h) { return h / 8; }

  /* ── Preis: drei Sichten, beschriftet als Orientierung (§ 5c) ── */
  function marktZeile(tabellen, id) {
    var liste = (tabellen && tabellen.markt) || WN.MARKT || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }
  function sichten(s, tabellen) {
    var m = marktZeile(tabellen, WN.MARKT_VERGLEICH);
    var pflege = marktZeile(tabellen, "pflege");
    var lage = "";
    if (m) {
      if (s.kostenBis < m.vonCent) lage = "darunter";
      else if (s.kostenVon > m.bisCent) lage = "darueber";
      else lage = "innerhalb";
    }
    return {
      kosten: { von: s.kostenVon, bis: s.kostenBis },
      markt: m ? { von: m.vonCent, bis: m.bisCent, quelle: m.quelle, name: m.name, lage: lage } : null,
      auftragsbau: { einmalig: Math.round((s.kostenVon + s.kostenBis) / 2),
        pflegeVon: pflege ? pflege.vonCent : null, pflegeBis: pflege ? pflege.bisCent : null },
    };
  }

  /* ── Umsatzsteuer (§ 5c): § 19 oder Regelbesteuerung, 7 % je Position ── */
  function ust(positionen, einstellung) {
    var e = einstellung || { modus: "regel", satz: 19 };
    var netto = 0, perSatz = {};
    positionen.forEach(function (p) {
      netto += p.nettoCent;
      if (e.modus === "p19") return;
      var satz = p.ermaessigt ? 7 : (zahl(e.satz) == null ? 19 : zahl(e.satz));
      perSatz[satz] = (perSatz[satz] || 0) + p.nettoCent;
    });
    var zeilen = Object.keys(perSatz).map(Number).sort(function (a, b) { return b - a; })
      .filter(function (s) { return perSatz[s] > 0; })
      .map(function (s) { return { satz: s, netto: perSatz[s], ust: Math.round(perSatz[s] * s / 100) }; });
    var u = zeilen.reduce(function (a, z) { return a + z.ust; }, 0);
    return { p19: e.modus === "p19", netto: netto, zeilen: zeilen, ust: u, brutto: netto + u };
  }

  /* ── Kosten-Nutzen (§ 5d) ── */
  var PRIO_RANG = { muss: 0, soll: 1, kann: 2, "": 3 };
  function bedarfNutzenMonat(e, stundenwertCent) {
    var u = e.nutzen || {};
    var h = zahl(u.stundenMonat), eu = zahl(u.euroMonat);
    var hatH = h != null && u.stundenMonat !== "" && stundenwertCent != null;
    var hatE = eu != null && u.euroMonat !== "";
    if (!hatH && !hatE) return null;
    return Math.round((hatH ? h * stundenwertCent : 0) + (hatE ? eu * 100 : 0));
  }
  function kostenNutzen(fassung, s, zeitraumMonate) {
    var u = fassung.umfang || {};
    var monate = zahl(zeitraumMonate) || 24;
    var stundenwert = zahl(u.kundenStundenwertCent);
    var bedarfe = WN.bedarf.bedarfe(fassung.protokoll);
    var abdecker = {};
    (u.bausteine || []).forEach(function (bs) {
      (bs.deckt || []).forEach(function (id) { (abdecker[id] = abdecker[id] || []).push(bs.id); });
    });
    var rows = [];
    (u.bausteine || []).forEach(function (bs, i) {
      var z = s.zeilen[i];
      if (!z.geschaetzt) return;
      var prio = "", nutzen = null;
      (bs.deckt || []).forEach(function (id) {
        var e = bedarfe.filter(function (x) { return x.id === id; })[0];
        if (!e) return;
        if (e.prio && PRIO_RANG[e.prio] < PRIO_RANG[prio]) prio = e.prio;
        var n = bedarfNutzenMonat(e, stundenwert);
        if (n != null) nutzen = (nutzen || 0) + n / abdecker[id].length;
      });
      var kosten = Math.round((z.kostenVon + z.kostenBis) / 2 * (1 + s.zuschlag));
      rows.push({ id: bs.id, prio: prio, kosten: kosten,
        nutzenMonat: nutzen == null ? null : Math.round(nutzen),
        nutzenZeitraum: nutzen == null ? null : Math.round(nutzen * monate) });
    });
    rows.sort(function (a, b) {
      var p = PRIO_RANG[a.prio] - PRIO_RANG[b.prio];
      if (p) return p;
      var ra = a.nutzenMonat == null ? -1 : a.nutzenMonat / Math.max(1, a.kosten);
      var rb = b.nutzenMonat == null ? -1 : b.nutzenMonat / Math.max(1, b.kosten);
      return rb - ra;
    });
    var kumK = 0, kumN = 0, grenze = -1;
    rows.forEach(function (r, i) {
      kumK += r.kosten; if (r.nutzenMonat != null) kumN += r.nutzenMonat;
      r.kumKosten = kumK; r.kumNutzenMonat = kumN; r.kumNutzenZeitraum = kumN * monate;
      r.amortMonate = kumN > 0 ? kumK / kumN : null;
      r.ueber = r.nutzenZeitraum != null && r.kosten > r.nutzenZeitraum;
      if (grenze < 0 && r.ueber) grenze = i;
    });
    var auto = grenze;
    var m = u.grenzeManuell;
    if (m === "keine") grenze = -1;
    else if (m) { var j = rows.map(function (r) { return r.id; }).indexOf(m); if (j >= 0) grenze = j; }
    return { monate: monate, zeilen: rows, grenze: grenze, grenzeAuto: auto, manuell: !!m,
      stundenwertFehlt: stundenwert == null };
  }

  /* ── Phasen- und Testplan (§ 8) ── */
  var SCHWELLEN = [{ bis: 20, bau: 1, test: 2, name: "klein" }, { bis: 60, bau: 2, test: 3, name: "mittel" }, { bis: Infinity, bau: 3, test: 4, name: "gross" }];
  function phasen(s) {
    var h = (s.stundenVon + s.stundenBis) / 2;
    var st = SCHWELLEN.filter(function (x) { return h <= x.bis; })[0];
    return { groesse: st.name, wochen: [
      { id: "protokoll", wochen: 0 }, { id: "angebot", wochen: 0 },
      { id: "bau", wochen: st.bau }, { id: "test", wochen: st.test },
      { id: "abnahme", wochen: 0 }, { id: "betrieb", wochen: null }],
      summeWochen: st.bau + st.test };
  }
  function datumPlus(iso, wochen) {
    var d = new Date((iso || "2026-01-01") + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + Math.round(wochen * 7));
    return d.toISOString().slice(0, 10);
  }

  /* ── Positionen fürs Angebot (Stufe 3). Preis je Baustein = Kosten (Preisbasis)
     + sein Anteil an Abstimmung und Puffer. Bausteine unter der Grenzlinie
     kommen in „später / optional". Handeingaben (fassung.angebot.ueber[id])
     gewinnen und sind markiert. */
  function positionen(fassung, s, kn, tabellen, lang) {
    var u = fassung.umfang || {};
    var basis = (fassung.angebot && fassung.angebot.preisbasis) || "mitte";
    var ueber = (fassung.angebot && fassung.angebot.ueber) || {};
    function preis(von, bis) {
      var k = basis === "von" ? von : basis === "bis" ? bis : (von + bis) / 2;
      return Math.round(k * (1 + s.zuschlag));
    }
    var unten = {};
    if (kn.grenze >= 0) kn.zeilen.slice(kn.grenze).forEach(function (r) { unten[r.id] = true; });
    var haupt = [], optional = [];
    (u.bausteine || []).forEach(function (bs, i) {
      var z = s.zeilen[i];
      if (!z.geschaetzt) return;
      var name = bausteinName(bs, tabellen, lang);
      var p = { id: bs.id, beschreibung: z.menge !== 1 ? name + " (" + G().formatStunden(z.menge, lang) + "×)" : name,
        nettoCent: preis(z.kostenVon, z.kostenBis), ermaessigt: !!bs.ermaessigt, deckt: (bs.deckt || []).slice() };
      anwenden(p, ueber[bs.id]);
      (unten[bs.id] ? optional : haupt).push(p);
    });
    if (s.firmenanpassung.bis > 0 || s.firmenanpassung.von > 0) {
      var p = { id: "anpassung", beschreibung: lang === "en" ? "Adaptation to your business (logo, colours, terms, fields)" : "Anpassung an Ihren Betrieb (Logo, Farben, Begriffe, Felder)",
        nettoCent: preis(s.firmenanpassung.kostenVon, s.firmenanpassung.kostenBis), ermaessigt: false, deckt: [] };
      anwenden(p, ueber.anpassung);
      haupt.push(p);
    }
    return { haupt: haupt, optional: optional, basis: basis };
  }
  function anwenden(p, h) {
    if (!h) return;
    if (h.beschreibung) { p.beschreibung = h.beschreibung; p.manuell = true; }
    if (zahl(h.nettoCent) != null) { p.nettoCent = Math.round(zahl(h.nettoCent)); p.manuell = true; }
  }

  /* Kalibrierung gegen echte Aufträge (Brief Stufe 2, Punkt 5) — INTERN. Ist-Stunden stehen am
     Vorgang (v.ist = { "<Fassung>": Stunden }), nicht an der eingefrorenen Fassung, und nur für
     unterschriebene Fassungen. Abweichung gegen die Mitte der Schätzung. */
  function istVergleich(vorgaenge, tabellen) {
    var out = [];
    (vorgaenge || []).forEach(function (v) {
      Object.keys(v.ist || {}).forEach(function (nr) {
        var ist = zahl(v.ist[nr]); if (ist == null || ist < 0) return;
        var f = (v.fassungen || []).filter(function (x) { return String(x.nr) === String(nr) && x.unterschrieben; })[0];
        if (!f) return;
        var s = schaetze(f, tabellen), mitte = (s.stundenVon + s.stundenBis) / 2;
        out.push({ vorgang: v.id, titel: v.titel || "", fassung: f.nr, von: s.stundenVon, bis: s.stundenBis, ist: ist,
          abweichungPct: mitte > 0 ? Math.round((ist - mitte) / mitte * 100) : null, imRahmen: ist >= s.stundenVon && ist <= s.stundenBis,
          /* Was es gekostet hätte: Ist-Stunden × Satz der Fassung (netto, intern) — neben der geschätzten Spanne */
          kostenVon: s.kostenVon, kostenBis: s.kostenBis, satzCent: f.satzCent, istKostenCent: Math.round(ist * f.satzCent) });
      });
    });
    return out;
  }

  WN.rechnen = { schaetze: schaetze, bausteinRechnen: bausteinRechnen, sichten: sichten, ust: ust,
    kostenNutzen: kostenNutzen, bedarfNutzenMonat: bedarfNutzenMonat, phasen: phasen, datumPlus: datumPlus,
    positionen: positionen, tage: tage, katalogVon: katalogVon, faktorVon: faktorVon, bausteinName: bausteinName,
    istVergleich: istVergleich, SCHWELLEN: SCHWELLEN };
})(typeof window !== "undefined" ? window : globalThis);
