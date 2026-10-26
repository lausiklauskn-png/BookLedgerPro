/* Übergabe an WorkFloh (Klaus 2026-10-07): „hier wird das Angebot zusammengestellt …
   Tomys Workflow nimmt den Auftrag an und verarbeitet ihn weiter bis zur Buchhaltung“.

   Geschrieben wird das Weiterleitungs-Bündel, das Mein WorkFloh UND Tomys Hub/workfloh
   schon einlesen („📥 Importieren“ → applyForwardBundle, in beiden byte-gleich):
     { wf: "forward", v: 1, ts, count, locked: 0, auftraege: [ Auftrag ] }
   Ein Auftrag trägt data:{nameFirma, ansprechpartner, email, erreichbarkeit, lieferadresse,
   preis, beschreibung, datum (TT.MM.JJJJ)} und files:[{name, mime, size, data: data-URL}] —
   so kommt jede Datei mit Namen und Art an (PDF als PDF, Mail als .eml).

   ⚠ GEBAUT NUR AUS DER WHITELIST: alles kommt aus WN.aussen.angebotExtern — kein
   Stundensatz, keine Stunden, keine internen Einträge. Ein neues Feld erscheint hier erst,
   wenn es dort ausdrücklich steht.
   ⚠ Status "angebot": den gibt es in beiden WorkFlohs. „angenommen“ kennt nur Tomys; ist
   die Fassung unterschrieben, steht das als Satz in der Beschreibung.
   ⚠ Die Kennung ist fest je Vorgang und Fassung ("wn-V-2026-0007-F3"): zweimal
   eingelesen → WorkFloh aktualisiert statt zu verdoppeln. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var PLATZHALTER = /⟦[^⟧]*⟧/g;

  function rein(s) { return String(s == null ? "" : s).replace(PLATZHALTER, "").trim(); }
  function tmj(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "")); return m ? m[3] + "." + m[2] + "." + m[1] : ""; }
  function eur(c) { return WN.geld.formatEuro(c, "de"); }

  /* Auftrag ohne Dateien (die hängt die Oberfläche an, sie sind Blobs) */
  function auftrag(v, f, einst, tabellen, jetzt) {
    var a = WN.aussen.angebotExtern(v, f, (einst && einst.firma) || {}, einst && einst.ust, tabellen, einst && einst.zeitraum, "de");
    var k = a.kunde || {};
    var zeilen = [];
    zeilen.push("Angebot " + a.nummer + " · Fassung " + a.fassung + " · " + tmj(a.datum) + (a.gueltigBis ? " · gültig bis " + tmj(a.gueltigBis) : ""));
    if (f.unterschrieben) zeilen.push("Unterschrieben am " + tmj(f.unterschrieben) + ".");
    zeilen.push("");
    a.positionen.forEach(function (p) { zeilen.push("• " + p.beschreibung + " — " + eur(p.nettoCent) + " netto"); });
    if (a.optional.length) {
      zeilen.push("", "Später / optional (nicht im Preis):");
      a.optional.forEach(function (p) { zeilen.push("• " + p.beschreibung + " — " + eur(p.nettoCent) + " netto"); });
    }
    zeilen.push("", "Summe netto " + eur(a.summen.netto) + (a.summen.p19 ? " · § 19 UStG, keine Umsatzsteuer" : " · USt " + eur(a.summen.ust)) + " · brutto " + eur(a.summen.brutto));
    if (a.phasen) zeilen.push("Bau etwa " + a.phasen.bauWochen + " Wochen, Praxistest etwa " + a.phasen.testWochen + " Wochen (Schätzung).");
    if (a.zahlung) zeilen.push("Zahlung: " + a.zahlung);
    zeilen.push("", "Aus Workflow-Needs übernommen.");
    var ts = jetzt || new Date().toISOString();
    return {
      id: "wn-" + v.id + "-F" + f.nr, nr: a.nummer, title: rein(a.titel) || a.nummer, status: "angebot",
      createdAt: ts, updatedAt: ts, projectId: null, folderId: null, kundeId: null,
      data: { nameFirma: rein(k.firma), ansprechpartner: rein(k.ansprechpartner), email: rein(k.mail), erreichbarkeit: rein(k.telefon),
        lieferadresse: rein(k.anschrift), preis: eur(a.summen.brutto) + " brutto", beschreibung: zeilen.join("\n"), datum: tmj(a.datum) },
      prod: {}, zeit: [], links: [], log: [], files: [],
    };
  }
  function buendel(auftraege, jetzt) {
    return { wf: "forward", v: 1, ts: jetzt || new Date().toISOString(), count: auftraege.length, locked: 0, quelle: "workflow-needs", auftraege: auftraege };
  }
  /* Blob → data-URL (in Node über Buffer, im Browser über FileReader) */
  function dataUrl(blob, typ) {
    return blob.arrayBuffer().then(function (buf) {
      var a = new Uint8Array(buf), s = "", i;
      for (i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
      return "data:" + (typ || "application/octet-stream") + ";base64," + g.btoa(s);
    });
  }
  function dateien(anhaenge) {
    return Promise.all((anhaenge || []).filter(function (x) { return x && x.blob; }).map(function (x) {
      return dataUrl(x.blob, x.typ).then(function (d) { return { name: x.name, mime: x.typ || "", size: x.groesse || 0, data: d }; });
    }));
  }
  /* Aktivierte Rechtsblätter als Datei zum Auftrag (Stufe 3, Frage 6): Erklärung und Vereinbarung,
     ERST WENN AKTIVIERT, als eigenständige HTML-Datei. ⛔ Der Wartungsvertrag geht NICHT mit — er
     trägt den Stundensatz, und die Übergabe bleibt ohne Satz. */
  var MIT = { erklaerung: "Verschwiegenheitserklaerung", vereinbarung: "Vereinbarung-Zahlung-Rechte" };
  function rechtsDateien(v, ctx) {
    return Object.keys(MIT).filter(function (art) { return v[art] && v[art].aktiviert; }).map(function (art) {
      var html = WN.aussen.alsHtml(WN.aussen.rechtsblatt(v, art, ctx));
      var bytes = new TextEncoder().encode(html), s = "", i;
      for (i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return { name: MIT[art] + "_" + v.id + ".html", mime: "text/html", size: bytes.length, data: "data:text/html;base64," + g.btoa(s) };
    });
  }
  /* ── An BookLedgerPro: Datenvertrag v1 (BookLedgerPro docs/UEBERNAHME_TOMY.md), quelle "workflow-needs" ──
     Klaus 2026-10-26 (D22): „Needs … Angebote für Software … beide über BLP". BLP prüft und kappt (Text 140, Nummern 32,
     höchstens 20 Positionen, USt 0/7/19) und füllt nur sein Angebots-Formular vor — gespeichert wird dort erst auf Klick.
     Gebaut NUR aus der Whitelist (WN.aussen.angebotExtern): jede Hauptposition als 1 × Netto, Optionales geht nicht mit
     (es steht nicht im Preis). Kein Stundensatz, keine Stunden. Dieselbe Bauart wie Workflow Calculate (WC.uebergabe). */
  var BLP_ZIEL = "https://lausiklauskn-png.github.io/BookLedgerPro/", BLP_MAX_POS = 20, BLP_MAX_LEN = 20000;
  function kappe(s, n) { s = rein(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  /* a = WN.aussen.angebotExtern(…) */
  function blpNutzlast(a) {
    var k = a.kunde || {};
    var pos = (a.positionen || []).map(function (p) {
      return { beschreibung: kappe(p.beschreibung, 140), menge: 1, einzelpreisCent: Math.round(p.nettoCent), ustSatz: [0, 7, 19].indexOf(Number(p.ustSatz)) >= 0 ? Number(p.ustSatz) : 19 };
    });
    return { v: 1, quelle: "workflow-needs", modus: "angebot", titel: kappe(a.titel || a.nummer, 140), kundeName: kappe(k.firma, 80),
      auftragNr: "", angebotsNr: kappe(a.nummer + (a.fassung > 1 ? "-F" + a.fassung : ""), 32), positionen: pos };
  }
  function b64u(text) {
    var bytes = new g.TextEncoder().encode(text), s = "", i;
    for (i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return g.btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  /* → { ok, url, nutzlast } oder { ok:false, grund } */
  function blpAdresse(a) {
    var n = blpNutzlast(a);
    if (!n.positionen.length) return { ok: false, grund: "keine Position im Angebot" };
    if (n.positionen.length > BLP_MAX_POS) return { ok: false, grund: "BookLedgerPro nimmt höchstens " + BLP_MAX_POS + " Positionen — dieses Angebot hat " + n.positionen.length };
    var p = b64u(JSON.stringify(n));
    if (p.length > BLP_MAX_LEN) return { ok: false, grund: "das Angebot ist für die Übergabe zu lang (BookLedgerPro nimmt bis 20 kB)" };
    return { ok: true, url: BLP_ZIEL + "?uebernahme=" + p, nutzlast: n };
  }

  function dateiname(v, f) { return "Auftrag_" + v.id + "-F" + f.nr + ".json"; }

  WN.uebergabe = { rechtsDateien: rechtsDateien, auftrag: auftrag, buendel: buendel, dateien: dateien, dateiname: dateiname, blpNutzlast: blpNutzlast, blpAdresse: blpAdresse, BLP_ZIEL: BLP_ZIEL };
})(typeof window !== "undefined" ? window : globalThis);
