/* Beispiel-Vorgang „Boutique" (Brief § 12) — nach dem ABLAUF von Alis
   Moderaum, alle Angaben ERFUNDEN (.example-Adresse, keine echten Kunden).
   F1: eine Internetseite, unterschrieben · F2: Kurse bekommen eine eigene
   Seite (×2) · F3: Lagerbestand dazu (Warenwirtschaft), Newsletter entfällt,
   das Schaufenster wird größer. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function boutique(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-10-01");
    v.titel = "Internetseite für ein Modegeschäft";
    v.beispiel = true;   // zählt nicht für die Sicherungs-Erinnerung
    v.bid = "boutique";  // Kennung des Beispiels: zweimal laden legt keinen Doppel an
    v.kunde.firma = "Boutique Beispiel";
    v.kunde.ansprechpartner = "Erika Muster";
    v.kunde.mail = "kontakt@boutique.example";
    v.weitereNamen = "Lindenstraße-Passage";
    var f = v.fassungen[0];
    var p = f.protokoll;
    B.eintragNeu(v, p, 1, "Papier");
    B.eintragNeu(v, p, 2, "Kundenkontakt");
    B.eintragNeu(v, p, 3, "Inhaberin", { anzahl: 1 });
    B.eintragNeu(v, p, 4, "Kundinnen finden das Geschäft im Netz nicht");
    B.eintragNeu(v, p, 5, "Die Vorgänger-Agentur hat die alte Seite abgeschaltet", { sichtbar: false });
    var b6 = B.eintragNeu(v, p, 6, "Eine Internetseite für die Boutique");
    b6.prio = "muss"; b6.nutzen = { stundenMonat: 4, euroMonat: 300, text: "mehr Laufkundschaft" };
    var b7 = B.eintragNeu(v, p, 6, "Alte Fotos und Texte übernehmen");
    b7.prio = "kann"; b7.nutzen = { stundenMonat: 0.5, euroMonat: null, text: "" };
    var b8 = B.eintragNeu(v, p, 6, "Newsletter an Stammkundinnen");
    b8.prio = "kann"; b8.nutzen = { stundenMonat: null, euroMonat: 20, text: "" };
    p.bereiche[4].notiz = "Eindruck: Inhaberin unter Zeitdruck, Budget eher knapp.";
    var u = f.umfang;
    u.kundenStundenwertCent = 3000;
    function bs(katalog, name, groesse, deckt, menge) {
      var b = { id: B.neueKennung(v, "K"), katalog: katalog, name: name || "", menge: menge || 1, groesse: groesse,
        faktoren: [], deckt: deckt };
      u.bausteine.push(b);
      return b;
    }
    bs("seite", "", "mittel", [b6.id]);
    bs("altdaten", "", "klein", [b7.id]);
    bs(null, "Newsletter", "klein", [b8.id]);
    var shop = bs("shop", "", "klein", [b6.id]);
    f.angebot.datum = "2026-10-01";
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-02");

    /* F2: beim Bau zeigt sich — Kurse bekommen eine eigene Seite */
    var f2 = F.neueFassung(v, { anlass: "Kurse sollen eine eigene Seite bekommen", von: "bau", datum: "2026-10-05" }).fassung;
    f2.umfang.bausteine[0].menge = 2;
    f2.protokoll.bereiche[6].eintraege[0].text = "Zwei Seiten: Boutique und Kurse";
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-05");

    /* F3: Lagerbestand dazu, Newsletter entfällt */
    var f3 = F.neueFassung(v, { anlass: "Kundin wünscht Lagerbestand je Artikel", von: "kunde", datum: "2026-10-07" }).fassung;
    var p3 = f3.protokoll;
    p3.bereiche[6].eintraege = p3.bereiche[6].eintraege.filter(function (e) { return e.id !== b8.id; });
    var b9 = B.eintragNeu(v, p3, 6, "Lagerbestand je Artikel sehen");
    b9.prio = "muss"; b9.nutzen = { stundenMonat: 13, euroMonat: null, text: "etwa 3 h pro Woche" };
    B.eintragNeu(v, p3, 18, "Welche Kasse ist im Laden?", { wer: "Kundin", bis: "2026-10-14" });
    f3.umfang.bausteine = f3.umfang.bausteine.filter(function (b) { return b.name !== "Newsletter"; });
    f3.umfang.bausteine.forEach(function (b) { if (b.id === shop.id) b.groesse = "mittel"; });
    f3.umfang.bausteine.push({ id: B.neueKennung(v, "K"), katalog: null, name: "Warenwirtschaft", menge: 1, groesse: "mittel", faktoren: [], deckt: [b9.id] });
    return v;
  }

  /* ── Stufe 3: Register der Beispiele und gemeinsame Hilfen ──
     Jedes Beispiel liegt in assets/daten/beispiel-*.js und meldet sich hier an.
     Kundendaten der Beispiele sind ERFUNDEN (.example), kein echter Personenname. */
  var LISTE = [{ id: "boutique", name: { de: "Boutique (Testfall)", en: "Boutique (test case)" }, bauen: boutique, quelle: "erfunden" }];
  /* Rahmen (Klaus 2026-11-14): die Beispiele aus den fertigen Apps tragen die neuen Fragen (Geräte, Datenort, Sicherung, eigene
     Programme, KI, „Nicht gewünscht“, vorschlagen/selbst) — in jeder Fassung gleich; sonst stünde dort nur „noch nicht erfragt“.
     Angabe je Beispiel: rahmen {feld: wert}, nicht [Text], handeln [[Muster, "vorschlagen"|"selbst"|"egal"]]. */
  function rahmenAnwenden(b, v) {
    if (!b.rahmen && !b.nicht && !b.handeln && !b.muss) return v;
    /* Muss-Sätze (Bereich 8) aus der Rückwärtsprüfung K3: was den Bau-Agenten fehlte, steht jetzt so im Bedarf,
       wie ein Kunde es sagen würde — nur in der letzten Fassung (dort ist es vereinbart). */
    if (b.muss && v.fassungen && v.fassungen.length) {
      var letzte = v.fassungen[v.fassungen.length - 1];
      b.muss.forEach(function (t) { WN.bedarf.eintragNeu(v, letzte.protokoll, 8, t); });
    }
    var nichtE = null; /* eine Kennung N-nn je Punkt, in allen Fassungen dieselbe */
    (v.fassungen || []).forEach(function (f) {
      var p = f.protokoll;
      if (b.rahmen) {
        var r = WN.rahmen.sicher(p);
        Object.keys(b.rahmen).forEach(function (k) { var w = b.rahmen[k]; r[k] = Array.isArray(w) ? w.slice() : w; });
      }
      if (b.nicht) {
        if (!nichtE) nichtE = b.nicht.map(function (t) { return WN.rahmen.nichtNeu(v, p, t); });
        else { WN.rahmen.sicher(p); nichtE.forEach(function (e) { p.nicht.push(JSON.parse(JSON.stringify(e))); }); }
      }
      /* Rückwärtsprüfung K3 (2026-11-14): eine offene Frage, deren Frist vor dem Datum der Fassung liegt, war bis dahin
         geklärt — sonst stünde sie in F4 noch mit einer Frist aus F1 da (8 von 14 Bau-Agenten hielten das für einen Widerspruch).
         Seit Klaus' Ja (14.11.) wird sie abgehakt (geklärt am Tag ihrer Frist), nicht mehr entfernt. */
      if (f.datum) {
        var o = p.bereiche && p.bereiche[18];
        if (o && Array.isArray(o.eintraege)) o.eintraege.forEach(function (e) { if (e.bis && e.bis < f.datum && !e.geklaert) e.geklaert = e.bis; });
      }
      (b.handeln || []).forEach(function (h) {
        var re = new RegExp(h[0], "i");
        WN.bedarf.bedarfe(p).forEach(function (e) { if (!e.handeln && re.test(e.text)) e.handeln = h[1]; });
      });
    });
    return v;
  }
  function registrieren(b) {
    if (b.rahmen || b.nicht || b.handeln || b.muss) {
      var roh = b.bauen;
      b = Object.assign({}, b, { bauen: function () { return rahmenAnwenden(b, roh.apply(null, arguments)); } });
    }
    var i = LISTE.map(function (x) { return x.id; }).indexOf(b.id);
    if (i >= 0) LISTE[i] = b; else LISTE.push(b); /* ersetzen an derselben Stelle: die Reihenfolge der Auswahl bleibt */
  }
  /* Ein gespeicherter Vorgang gehört zu welchem Beispiel? Ältere Boutique-Vorgänge tragen noch kein bid. */
  function bidVon(v) { return v && v.beispiel ? (v.bid || (v.titel === "Internetseite für ein Modegeschäft" ? "boutique" : "")) : ""; }
  function hilfen(v) {
    var B = WN.bedarf;
    return {
      e: function (p, nr, text, extra) { return B.eintragNeu(v, p, nr, text, extra); },
      bed: function (p, text, prio, nutzen) {
        var e = B.eintragNeu(v, p, 6, text); e.prio = prio || "";
        if (nutzen) e.nutzen = { stundenMonat: nutzen.h == null ? null : nutzen.h, euroMonat: nutzen.eur == null ? null : nutzen.eur, text: nutzen.text || "" };
        return e;
      },
      bs: function (f, katalog, name, groesse, deckt, extra) {
        var b = Object.assign({ id: B.neueKennung(v, "K"), katalog: katalog, name: name || "", menge: 1, groesse: groesse || null, faktoren: [], deckt: deckt || [] }, extra || {});
        f.umfang.bausteine.push(b); return b;
      },
    };
  }

  /* Angaben zum Rahmen nachträglich an ein schon registriertes Beispiel hängen (Datei beispiel-rahmen.js, nach allen Beispielen geladen). */
  function rahmenSetzen(id, angaben) {
    var b = LISTE.filter(function (x) { return x.id === id; })[0];
    if (!b) return false;
    registrieren(Object.assign({}, b, angaben, { bauen: b.bauen }));
    return true;
  }
  WN.beispiel = { boutique: boutique, registrieren: registrieren, rahmenSetzen: rahmenSetzen, liste: function () { return LISTE.slice(); }, bidVon: bidVon, hilfen: hilfen };
})(typeof window !== "undefined" ? window : globalThis);
