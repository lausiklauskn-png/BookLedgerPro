/* Bauauftrag (MD) — die Anweisung an die nächste Sitzung (Brief § 7c/7e).

   ⛔ KUNDENDATEN GEHEN NIE HINAUS. Jeder Inhalt (Freitext, Kundenfelder,
   „Weitere Namen und Begriffe") läuft durch Sage-Modul 25 (P), die Zuordnung
   Platzhalter ⟷ Klartext bleibt am Vorgang auf dem Gerät. Die Zahlen der App
   (Stunden, Euro, Kennungen, Datum) werden ERST DANACH eingesetzt — sie sind
   keine Kundendaten und dürfen nicht als ⟦BETRAG-…⟧ verdeckt werden.
   Letzte Sicherung: Modul 25 läuft noch einmal über die fertige Datei; findet
   es einen Klartext aus der Zuordnung oder eine Mailadresse, Telefonnummer,
   IBAN, einen Schlüssel oder eine Beleg-Nummer, geht NICHTS hinaus.
   Fehlt Modul 25, geht ebenfalls nichts hinaus.

   Der Stundensatz steht NIE in der Datei, auch nicht mit „Euro mitnehmen". */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var AKTIONEN = ["NEU BAUEN", "ANPASSEN", "ENTFERNEN", "UNVERÄNDERT", "NOCH NICHT GESCHÄTZT"];
  var PRUEF_SORTEN = ["SCHLUESSEL", "MAIL", "IBAN", "TELEFON", "RECHNUNG"];

  function namenListe(roh) {
    return String(roh || "").split(/\n/).map(function (n) { return n.trim(); }).filter(function (n) { return n.length >= 2; });
  }

  /* Was Modul 25 als bekannte Werte bekommt, und die festen Platzhalter. */
  function bekannte(v) {
    var values = [], seed = {};
    WN.KUNDENFELDER.forEach(function (f) {
      var w = String((v.kunde && v.kunde[f.id]) || "").trim();
      if (w.length >= 2) { values.push({ value: w, type: "KUNDE" }); seed[f.token] = w; }
    });
    namenListe(v.weitereNamen).forEach(function (n) { values.push({ value: n, type: "NAME" }); });
    return { values: values, seed: seed, teile: namensteile(v) };
  }
  /* Rückwärtstest 2026-11-13: der Vorname des Ansprechpartners stand allein im Freitext („klärt Sabine“) und ging
     im Klartext hinaus, obwohl der Kopf „verdeckt: ja“ sagt. Jeder Namensteil (ab 3 Buchstaben, ohne Anrede) wird
     deshalb als GANZES WORT durch den Platzhalter des Ansprechpartners ersetzt. Nicht über Modul 25: dessen letzte
     Sicherung sucht Klartext als Teilzeichenkette, und ein Nachname wie „Beispiel“ steckt auch in „Beispielwert“ –
     das hielt den ganzen Bauauftrag an (gefunden an einem neuen Beispiel, 2026-11-13). */
  function namensteile(v) {
    var teile = [];
    String((v.kunde && v.kunde.ansprechpartner) || "").split(/[\s,]+/).forEach(function (t) {
      t = t.replace(/^[^\p{L}]+|[^\p{L}-]+$/gu, "");
      if (t.length >= 3 && !/^(Herr|Frau|Dr|Prof)$/i.test(t) && teile.indexOf(t) < 0) teile.push(t);
    });
    return teile;
  }
  function teileErsetzen(t, teile) {
    teile.forEach(function (n) {
      var esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      t = t.replace(new RegExp("(^|[^\\p{L}])" + esc + "(?![\\p{L}])", "gu"), "$1⟦KUNDE-2⟧");
    });
    return t;
  }
  function zuordnungVon(v) {
    var b = bekannte(v), map = {};
    Object.keys(v.zuordnung || {}).forEach(function (k) { map[k] = v.zuordnung[k]; });
    Object.keys(b.seed).forEach(function (k) { map[k] = b.seed[k]; });
    return map;
  }

  /* Verdeckt alle Inhaltstexte. Gibt eine Funktion zurück, die einen Text
     verdeckt, und am Ende die gewachsene Zuordnung. */
  function verdecker(v, P) {
    var b = bekannte(v);
    var map = zuordnungVon(v);
    return {
      text: function (t) {
        t = String(t == null ? "" : t);
        if (!t || v.eigenesVorhaben) return t;
        var r = P.pseudonymize(t, { values: b.values, map: map });
        Object.keys(r.map).forEach(function (k) { map[k] = r.map[k]; });
        return teileErsetzen(r.text, b.teile);
      },
      map: function () { return map; },
      values: b.values,
    };
  }

  function zahlH(h) { return WN.geld.formatStunden(h, "de"); }
  function spanneH(von, bis) { return zahlH(von) + "–" + zahlH(bis); }
  function euroG(c) { return WN.geld.formatEuroGanz(c, "de"); }
  function zelle(t) { return String(t == null ? "" : t).replace(/\|/g, "/").replace(/[\r\n]+/g, " "); }
  function prioWort(p) { return p ? WN.PRIO_NAME[p].de : ""; }

  function nutzenText(e, opts) {
    var u = e.nutzen || {}, teile = [];
    if (u.stundenMonat != null && u.stundenMonat !== "") teile.push(zahlH(u.stundenMonat) + " h/Monat");
    if (opts.euro && u.euroMonat != null && u.euroMonat !== "") teile.push(euroG(Math.round(Number(u.euroMonat) * 100)) + "/Monat");
    if (u.text) teile.push(u.text);
    return teile.join(", ");
  }

  /* opts: { stunden: bool, euro: bool, datum } · tabellen: Katalog
     alt: vorige Fassung oder null (dann ist alles NEU BAUEN) */
  function erzeuge(v, alt, neu, opts, P, tabellen) {
    opts = { stunden: opts && opts.stunden !== false, euro: !!(opts && opts.euro), datum: (opts && opts.datum) || neu.datum };
    if (!P || typeof P.pseudonymize !== "function") return { ok: false, grund: "modul25" };
    var V = verdecker(v, P);
    var R = WN.rechnen;
    var leer = WN.fassungen.kopie(neu);
    leer.protokoll = WN.bedarf.leeresProtokoll(); leer.umfang = WN.fassungen.kopie(neu.umfang); leer.umfang.bausteine = [];
    var vg = WN.fassungen.vergleich(alt || leer, neu, tabellen);
    var sn = R.schaetze(neu, tabellen), sa = alt ? R.schaetze(alt, tabellen) : null;
    var kn = R.kostenNutzen(neu, sn, 24);
    var name = function (b) { return V.text(R.bausteinName(b, tabellen, "de")); };
    var L = [];
    L.push("---", "art: bauauftrag", "format: 1", "vorgang: " + v.id, "fassung: " + neu.nr,
      "vorher: " + (alt ? alt.nr : "-"), "fassungsdatum: " + (neu.datum || opts.datum), "datum: " + opts.datum, 'kunde: "⟦KUNDE-1⟧"',
      "verdeckt: " + (v.eigenesVorhaben ? "nein" : "ja"), "stunden: " + (opts.stunden ? "ja" : "nein"),
      "euro: " + (opts.euro ? "ja" : "nein"), 'repo: "Workflow-Needs"  # Werkzeug, das den Auftrag erzeugt hat — nicht das Ziel', "---", "");
    L.push("# Bauauftrag · Fassung " + neu.nr + (alt ? " (vorher " + alt.nr + ")" : ""), "");
    if (neu.anlass || neu.von) L.push("**Anlass:** " + (V.text(neu.anlass) || "–") + "  ·  **von:** " + ({ kunde: "Kunde", betrieb: "Betrieb", bau: "Befund beim Bau" }[neu.von] || "–"), "");
    if (v.titel) L.push("**Vorhaben:** " + V.text(v.titel), "");
    /* A5 (Klaus 2026-11-13): ohne Vorgänger ist der Auftrag ein Gesamtauftrag — auch bei Fassung 4. */
    if (!alt) L.push("**Gesamtauftrag:** keine frühere Fassung in diesem Auftrag — alles unter „Zu tun“ ist neu zu bauen. Das Datum der Fassung steht im Kopf (`fassungsdatum`), `datum` ist der Tag der Erzeugung.", "");

    /* A1 · Rahmen (Klaus 2026-11-13): Geräte, Datenort, Sicherung, Zusammenspiel, vorschlagen/selbst, nicht bauen — ganz oben,
       weil Bau-Agenten nach „Zu tun“ bauen und verstreute Angaben in Bereich 10–15 als Beiwerk lasen. */
    L.push("## Rahmen");
    var RA = WN.rahmen, ra = RA.von(neu.protokoll);
    var rz = [];
    if (RA.liste(ra, "geraete", "de")) rz.push("- Geräte: " + RA.liste(ra, "geraete", "de"));
    if (ra.offline) rz.push("- Ohne Internet: " + RA.name("offline", ra.offline, "de"));
    if (ra.abgleich) rz.push("- Abgleich zwischen Geräten: " + RA.name("abgleich", ra.abgleich, "de"));
    if (RA.liste(ra, "datenort", "de")) rz.push("- Daten liegen: " + RA.liste(ra, "datenort", "de"));
    if (RA.liste(ra, "sicherung", "de")) rz.push("- Sicherung: " + RA.liste(ra, "sicherung", "de"));
    var eig = [RA.liste(ra, "eigene", "de"), V.text(String(ra.eigeneText || "").trim())].filter(Boolean).join("; ");
    if (eig) rz.push("- Eigene Programme: " + eig);
    if (ra.ki) rz.push("- KI: " + RA.name("ki", ra.ki, "de"));
    var hand = { vorschlagen: [], selbst: [], egal: [] };
    WN.bedarf.bedarfe(neu.protokoll).forEach(function (e) { if (e.handeln && hand[e.handeln]) hand[e.handeln].push(e.id); });
    if (hand.vorschlagen.length) rz.push("- Schlägt vor, der Kunde bestätigt: " + hand.vorschlagen.join(", "));
    if (hand.selbst.length) rz.push("- Darf selbst handeln: " + hand.selbst.join(", "));
    if (opts.euro) {
      var bt = [];
      if (Number(ra.budgetEuro) > 0) bt.push(euroG(Math.round(Number(ra.budgetEuro) * 100)) + " einmalig");
      if (Number(ra.budgetMonatEuro) > 0) bt.push(euroG(Math.round(Number(ra.budgetMonatEuro) * 100)) + " im Monat" + (Number(ra.budgetMonate) > 0 ? " über " + ra.budgetMonate + " Monate" : "") + " (Rate, gilt den Kaufpreis ab" + (ra.budgetWartung ? ", Wartung inbegriffen" : "") + ")");
      if (bt.length) rz.push("- Budget-Rahmen des Kunden: " + bt.join(" + "));
    }
    var nb = RA.nicht(neu.protokoll);
    if (nb.length) rz.push("- Nicht bauen: " + nb.map(function (e) { return e.id + " " + V.text(e.text); }).join(" · "));
    if (!rz.length) rz.push("- noch nicht erfragt (Bereich 10, 12, 13, 15) — Geräte, Datenort und Sicherung beim Kunden klären, nicht annehmen");
    L.push.apply(L, rz); L.push("");

    /* Zu tun */
    L.push("## Zu tun (für die Sitzung)");
    var kopf = ["Aktion", "Kennung", "Was", "Größe"];
    if (opts.stunden) kopf.push("Stunden (Schätzung)");
    if (opts.euro) kopf.push("Preis netto (Schätzung)");
    kopf.push("deckt Bedarf");
    L.push("| " + kopf.join(" | ") + " |", "|" + kopf.map(function () { return "---"; }).join("|") + "|");
    var unveraendert = [];
    vg.bausteine.forEach(function (x) {
      if (x.aktion === "UNVERÄNDERT") { unveraendert.push(x.id); return; }
      var b = x.neu || x.alt, z = x.zNeu || x.zAlt;
      var was = name(b);
      if (x.aktion === "ANPASSEN" && x.zAlt && x.zNeu && x.zAlt.menge !== x.zNeu.menge) was += " ×" + zahlH(x.zAlt.menge) + " → ×" + zahlH(x.zNeu.menge);
      else if (x.zNeu && x.zNeu.menge !== 1) was += " ×" + zahlH(x.zNeu.menge);
      var gr = x.aktion === "ENTFERNEN" || !b.groesse ? (x.zNeu && x.zNeu.manuell ? "von Hand" : "–") : b.groesse.replace("gross", "groß");
      var z0 = [x.aktion, x.id, zelle(was), gr];
      if (opts.stunden) {
        if (x.aktion === "NOCH NICHT GESCHÄTZT") z0.push("–");
        else if (x.aktion === "NEU BAUEN") z0.push(spanneH(z.von, z.bis));
        else if (x.aktion === "ENTFERNEN") z0.push("−" + spanneH(x.zAlt.von, x.zAlt.bis));
        else { var dv = x.zNeu.von - x.zAlt.von, db = x.zNeu.bis - x.zAlt.bis; z0.push((dv >= 0 ? "+" : "−") + spanneH(Math.abs(dv), Math.abs(db))); }
      }
      if (opts.euro) {
        if (x.aktion === "NOCH NICHT GESCHÄTZT") z0.push("–");
        else if (x.aktion === "ENTFERNEN") z0.push("−" + euroG(Math.round((x.zAlt.kostenVon + x.zAlt.kostenBis) / 2)));
        else z0.push(euroG(Math.round((x.zNeu.kostenVon + x.zNeu.kostenBis) / 2)));
      }
      z0.push((b.deckt || []).join(", ") || "–");
      L.push("| " + z0.join(" | ") + " |");
    });
    if (unveraendert.length) {
      var zu = ["UNVERÄNDERT", unveraendert.join(", "), "–", "–"];
      if (opts.stunden) zu.push("–"); if (opts.euro) zu.push("–"); zu.push("–");
      L.push("| " + zu.join(" | ") + " |");
    }
    L.push("");

    /* A2 + A3 (Klaus 2026-11-13): je Baustein Vorlage, Wiederverwendung, Faktoren und die Abnahme aus Bereich 8. */
    var b8 = neu.protokoll.bereiche[8].eintraege, je = [], b8gedeckt = {};
    (neu.umfang.bausteine || []).forEach(function (b, i) {
      var z = sn.zeilen[i], teile = [];
      (z.weg || []).forEach(function (w) {
        if (w.art === "wv") teile.push("Vorlage " + (w.quelle ? V.text(w.quelle) : "–") + " (" + Math.round(w.anteil * 100) + " % wiederverwendet)");
        if (w.art === "faktoren") teile.push("Faktoren " + w.ids.map(function (id) { var fk = R.faktorVon ? R.faktorVon(tabellen, id) : null; return fk ? fk.name.de + " ×" + String(fk.mal).replace(".", ",") : id; }).join(", "));
        if (w.art === "manuell" && opts.stunden) teile.push("Stunden von Hand gesetzt");
      });
      var ab = b8.filter(function (e) { return (b.deckt || []).indexOf(e.id) >= 0; });
      ab.forEach(function (e) { b8gedeckt[e.id] = 1; });
      if (!teile.length && !ab.length) return;
      je.push("- " + b.id + (teile.length ? " · " + teile.join(" · ") : ""));
      ab.forEach(function (e) { je.push("  - Abnahme " + e.id + ": " + V.text(e.text)); });
    });
    var b8offen = b8.filter(function (e) { return !b8gedeckt[e.id]; });
    if (je.length || b8offen.length) {
      L.push("### Je Baustein: Vorlage und Abnahme");
      L.push.apply(L, je);
      if (b8offen.length) { L.push("- ohne Baustein (trotzdem abnehmen):"); b8offen.forEach(function (e) { L.push("  - " + e.id + ": " + V.text(e.text)); }); }
      L.push("");
    }

    /* Bedarfsprotokoll – Änderungen */
    L.push("## Bedarfsprotokoll – Änderungen");
    var n0 = 0;
    vg.bedarf.forEach(function (x) {
      if (x.status === "gleich") return;
      n0++;
      var e = x.neu || x.alt;
      var zusatz = [];
      if (x.nr === 6 && x.neu) { if (e.prio) zusatz.push(prioWort(e.prio)); var nt = nutzenText(e, opts); if (nt) zusatz.push("Nutzen: " + V.text(nt)); }
      var z = zusatz.length ? " (" + zusatz.join(", ") + ")" : "";
      if (x.status === "neu") L.push("- NEU " + x.id + " [Bereich " + x.nr + "]: „" + V.text(e.text) + "“" + z);
      else if (x.status === "entfallen") L.push("- ENTFALLEN " + x.id + " [Bereich " + x.nr + "]: „" + V.text(e.text) + "“");
      else L.push("- GEÄNDERT " + x.id + " [Bereich " + x.nr + "]: „" + V.text(x.alt.text) + "“ → „" + V.text(x.neu.text) + "“" + z);
    });
    if (!n0) L.push("- keine");
    L.push("");

    /* Offene Punkte */
    L.push("## Offene Punkte");
    /* Klaus 2026-11-14: eine offene Frage lässt sich als „geklärt“ abhaken (Datum, Antwort) — sie steht dann nicht mehr hier,
       sondern unter „Geklärt“ mit ihrer Antwort. */
    var alleO = neu.protokoll.bereiche[18].eintraege;
    var off = alleO.filter(function (e) { return !e.geklaert; }), klar = alleO.filter(function (e) { return !!e.geklaert; });
    if (!off.length) L.push("- keine");
    off.forEach(function (e) {
      var wer = [e.wer ? "klärt " + V.text(e.wer) : "", e.bis ? "bis " + e.bis : ""].filter(Boolean).join(" ");
      L.push("- " + e.id + ": " + V.text(e.text) + (wer ? " (" + wer + ")" : ""));
    });
    vg.bausteine.forEach(function (x) { if (x.aktion === "NOCH NICHT GESCHÄTZT") L.push("- " + x.id + " " + name(x.neu) + ": noch nicht geschätzt — offene Frage an Klaus"); });
    L.push("");
    if (klar.length) {
      L.push("### Geklärt (keine offene Frage mehr)");
      klar.forEach(function (e) { L.push("- " + e.id + ": " + V.text(e.text) + " — geklärt " + e.geklaert + (e.antwort ? ": " + V.text(e.antwort) : "")); });
      L.push("");
    }

    /* Summe */
    L.push("## Summe");
    var sz = [];
    if (opts.stunden) sz.push("Stunden " + (sa ? "F" + alt.nr + " " + spanneH(sa.stundenVon, sa.stundenBis) + " → " : "") + "F" + neu.nr + " " + spanneH(sn.stundenVon, sn.stundenBis));
    if (opts.euro) sz.push("Netto " + (sa ? "F" + alt.nr + " " + euroG(sa.kostenVon) + "–" + euroG(sa.kostenBis) + " → " : "") + "F" + neu.nr + " " + euroG(sn.kostenVon) + "–" + euroG(sn.kostenBis));
    var gl = kn.grenze >= 0 ? (kn.grenze > 0 ? "nach " + kn.zeilen[kn.grenze - 1].id : "vor " + kn.zeilen[0].id) : "keine";
    sz.push("Kosten-Nutzen: Grenzlinie " + gl);
    L.push(sz.join(" · "), "");
    /* Rückwärtstest 2026-11-13: alle Bau-Agenten rechneten die Zeilen nach und fanden die Summe „falsch“ —
       sie enthält Zuschläge, die nirgends standen. */
    if (opts.stunden) L.push("Die Summe enthält zusätzlich zu den Zeilen: " + (sn.firmenanpassung.bis ? "Anpassung an den Betrieb " + spanneH(sn.firmenanpassung.von, sn.firmenanpassung.bis) + " h, " : "") + "Abstimmung " + zahlH(sn.abstimmung.pct) + " % (" + spanneH(sn.abstimmung.von, sn.abstimmung.bis) + " h), Puffer " + zahlH(sn.puffer.pct) + " % (" + spanneH(sn.puffer.von, sn.puffer.bis) + " h)" + (sn.gewaehrleistung.stunden ? ", Fehlerbehebung nach Abnahme " + zahlH(sn.gewaehrleistung.stunden) + " h" : "") + ".", "");
    if (kn.grenze >= 0) L.push("Unter der Grenzlinie steht, was mehr kostet, als es im Zeitraum nutzt — der Kunde entscheidet es einzeln, auch wenn dort ein Muss steht.", "");

    /* Rechtsblätter und Sterne (Stufe 3): nur ja/nein und Zahlen — keine Unterschriften,
       keine Namen der Mitarbeiter (Kundendaten). */
    L.push("## Erklärungen und Sterne");
    L.push("- Verschwiegenheitserklärung aktiviert: " + (v.erklaerung && v.erklaerung.aktiviert ? "ja" : "nein") +
      " · Vereinbarung Zahlung/Rechte aktiviert: " + (v.vereinbarung && v.vereinbarung.aktiviert ? "ja" : "nein") +
      " · Wartungsvertrag aktiviert: " + (v.wartung && v.wartung.aktiviert ? "ja" : "nein"));
    var stB = WN.bedarf.sterneZusammen(v, "bedarf"), stA = WN.bedarf.sterneZusammen(v, "abnahme");
    var stIds = Object.keys(stB).concat(Object.keys(stA).filter(function (k) { return !stB[k]; })).sort();
    if (!stIds.length) L.push("- Sterne der Mitarbeiter: noch keine");
    stIds.forEach(function (id) {
      var f0 = function (z) { return z ? "Ø " + zahlH(z.schnitt) + " (" + z.anzahl + ")" : "–"; };
      L.push("- Sterne " + id + ": beim Bedarf " + f0(stB[id]) + " · bei der Abnahme " + f0(stA[id]));
    });
    L.push("");

    /* Vollständiger Stand: lesbar UND als JSON zum Wiedereinlesen */
    /* A4 (Klaus 2026-11-13): nur noch als JSON — vorher stand jeder Bedarf dreimal im Auftrag. */
    L.push("## Vollständiger Stand (zum Einlesen)");
    var stand = { bedarf: [], bausteine: [] };
    WN.bedarf.alleEintraege(neu.protokoll).forEach(function (x) {
      var e = x.e, o = { id: e.id, nr: x.nr, text: V.text(e.text), sichtbar: !!e.sichtbar };
      if (e.anzahl !== undefined) o.anzahl = e.anzahl;
      if (e.prio !== undefined) o.prio = e.prio;
      if (e.nutzen) { o.nutzen = { stundenMonat: e.nutzen.stundenMonat, text: V.text(e.nutzen.text || "") }; if (opts.euro) o.nutzen.euroMonat = e.nutzen.euroMonat; }
      if (e.wer !== undefined) { o.wer = V.text(e.wer); o.bis = e.bis; }
      if (e.geklaert) { o.geklaert = e.geklaert; if (e.antwort) o.antwort = V.text(e.antwort); }
      if (e.handeln) o.handeln = e.handeln;
      stand.bedarf.push(o);
    });
    stand.rahmen = { eigeneText: V.text(ra.eigeneText || "") };
    WN.RAHMEN_FELDER.forEach(function (k) { stand.rahmen[k] = ra[k]; });
    if (opts.euro) ["budgetEuro", "budgetMonatEuro", "budgetMonate", "budgetWartung"].forEach(function (k) { stand.rahmen[k] = ra[k]; });
    stand.nicht = nb.map(function (e) { return { id: e.id, text: V.text(e.text), sichtbar: !!e.sichtbar }; });
    (neu.umfang.bausteine || []).forEach(function (b, i) {
      var z = sn.zeilen[i];
      var o = { id: b.id, katalog: b.katalog || null, name: b.name ? V.text(b.name) : "", menge: b.menge, groesse: b.groesse || null,
        faktoren: (b.faktoren || []).slice(), deckt: (b.deckt || []).slice(), ermaessigt: !!b.ermaessigt };
      if (opts.stunden && b.manuell) o.manuell = b.manuell;
      stand.bausteine.push(o);
    });
    L.push("```json", JSON.stringify(stand), "```", "");
    var md = L.join("\n");

    if (!v.eigenesVorhaben) {
      var leck = P.findLeak(md, V.map());
      var funde = P.find(md, { values: V.values, types: PRUEF_SORTEN });
      if (leck || funde.length) {
        var f0 = funde[0];
        return { ok: false, grund: "sicherung", fund: leck || (f0 && f0.value), zeile: f0 ? f0.line : null };
      }
    }
    return { ok: true, md: md, zuordnung: V.map() };
  }

  /* ── Einlesen ── */
  function kopfLesen(md) {
    var m = /^---\n([\s\S]*?)\n---\n/.exec(String(md || "").replace(/\r\n/g, "\n"));
    if (!m) return null;
    var k = {};
    m[1].split("\n").forEach(function (z) {
      var t = /^([a-z]+):\s*(.*?)\s*(?:#.*)?$/.exec(z);
      if (t) k[t[1]] = t[2].replace(/^"(.*)"$/, "$1");
    });
    return k;
  }
  function einlesen(md, P) {
    var text = String(md || "").replace(/\r\n/g, "\n");
    var k = kopfLesen(text);
    if (!k) return { ok: false, grund: "kein Kopf (--- … ---) gefunden" };
    if (k.art !== "bauauftrag") return { ok: false, grund: "art ist „" + (k.art || "") + "“, erwartet „bauauftrag“" };
    if (k.format !== "1") return { ok: false, grund: "format „" + (k.format || "") + "“ wird nicht verstanden (erwartet 1)" };
    var j = /```json\n([\s\S]*?)\n```/.exec(text);
    if (!j) return { ok: false, grund: "der Abschnitt „Vollständiger Stand“ (JSON) fehlt" };
    var stand;
    try { stand = JSON.parse(j[1]); } catch (_e) { return { ok: false, grund: "der Stand (JSON) ist nicht lesbar" }; }
    if (!stand || !Array.isArray(stand.bedarf) || !Array.isArray(stand.bausteine)) return { ok: false, grund: "der Stand (JSON) ist unvollständig" };
    return { ok: true, kopf: k, stand: stand };
  }

  /* Platzhalter zurück in Klartext. Unbekannte bleiben stehen und werden genannt. */
  var TOKEN = /⟦[A-Z][A-Z0-9_]*-\d+⟧/g;
  function aufdecken(text, v, P) {
    var map = zuordnungVon(v);
    var t = String(text || "");
    var unbekannt = [];
    (t.match(TOKEN) || []).forEach(function (tok) { if (!Object.prototype.hasOwnProperty.call(map, tok) && unbekannt.indexOf(tok) < 0) unbekannt.push(tok); });
    var out = P && typeof P.rehydrate === "function" ? P.rehydrate(t, map)
      : t.replace(TOKEN, function (tok) { return Object.prototype.hasOwnProperty.call(map, tok) ? map[tok] : tok; });
    return { text: out, unbekannt: unbekannt };
  }

  /* Stand aus der MD in eine Fassung übertragen (Klartext wiederhergestellt).
     Was die Datei nicht trägt (Euro bei euro: nein, Stunden von Hand bei
     stunden: nein, interne Notizen, Satz), kommt aus `basis`. */
  function standAnwenden(stand, basis, v, P) {
    var f = WN.fassungen.kopie(basis);
    var unbekannt = [];
    function auf(t) { var r = aufdecken(t, v, P); r.unbekannt.forEach(function (u) { if (unbekannt.indexOf(u) < 0) unbekannt.push(u); }); return r.text; }
    var alteE = {};
    WN.bedarf.alleEintraege(basis.protokoll).forEach(function (x) { alteE[x.e.id] = x.e; });
    var notizen = {}, sicht = {};
    WN.BEREICHE.forEach(function (b) { notizen[b.nr] = basis.protokoll.bereiche[b.nr].notiz; sicht[b.nr] = basis.protokoll.bereiche[b.nr].sichtbar; });
    f.protokoll = WN.bedarf.leeresProtokoll();
    WN.BEREICHE.forEach(function (b) { f.protokoll.bereiche[b.nr].notiz = notizen[b.nr]; f.protokoll.bereiche[b.nr].sichtbar = sicht[b.nr]; });
    stand.bedarf.forEach(function (o) {
      var alt = alteE[o.id] || {};
      var e = { id: o.id, text: auf(o.text), sichtbar: !!o.sichtbar };
      if (o.anzahl !== undefined) e.anzahl = o.anzahl;
      if (o.prio !== undefined) e.prio = o.prio;
      if (o.nutzen) e.nutzen = { stundenMonat: o.nutzen.stundenMonat, euroMonat: o.nutzen.euroMonat !== undefined ? o.nutzen.euroMonat : (alt.nutzen ? alt.nutzen.euroMonat : null), text: auf(o.nutzen.text || "") };
      if (o.wer !== undefined) { e.wer = auf(o.wer); e.bis = o.bis; }
      if (o.geklaert) { e.geklaert = String(o.geklaert); if (o.antwort) e.antwort = auf(o.antwort); }
      if (o.handeln) e.handeln = o.handeln;
      if (f.protokoll.bereiche[o.nr]) f.protokoll.bereiche[o.nr].eintraege.push(e);
      zaehlerNach(v, o.id);
    });
    /* Rahmen und „nicht gewünscht“ (seit 2026-11-13); fehlen sie im Stand, bleibt der Rahmen der Basis. */
    var raAlt = WN.rahmen.von(basis.protokoll);
    if (stand.rahmen) {
      var ra = WN.rahmen.sicher(f.protokoll);
      WN.RAHMEN_FELDER.forEach(function (k) {
        if (WN.RAHMEN[k].mehrfach) ra[k] = Array.isArray(stand.rahmen[k]) ? stand.rahmen[k].slice() : [];
        else ra[k] = typeof stand.rahmen[k] === "string" ? stand.rahmen[k] : "";
      });
      ra.eigeneText = auf(stand.rahmen.eigeneText || "");
      ["budgetEuro", "budgetMonatEuro", "budgetMonate", "budgetWartung"].forEach(function (k) { ra[k] = stand.rahmen[k] !== undefined ? stand.rahmen[k] : raAlt[k]; });
    } else if (basis.protokoll.rahmen) f.protokoll.rahmen = WN.fassungen.kopie(basis.protokoll.rahmen);
    if (Array.isArray(stand.nicht)) {
      WN.rahmen.sicher(f.protokoll);
      f.protokoll.nicht = stand.nicht.map(function (n) { zaehlerNach(v, n.id); return { id: n.id, text: auf(n.text), sichtbar: !!n.sichtbar }; });
    } else if (basis.protokoll.nicht) f.protokoll.nicht = WN.fassungen.kopie(basis.protokoll.nicht);
    var alteB = {};
    (basis.umfang.bausteine || []).forEach(function (b) { alteB[b.id] = b; });
    f.umfang.bausteine = stand.bausteine.map(function (o) {
      var alt = alteB[o.id] || {};
      var b = { id: o.id, katalog: o.katalog || null, name: o.name ? auf(o.name) : "", menge: o.menge, groesse: o.groesse || null,
        faktoren: o.faktoren || [], deckt: o.deckt || [] };
      if (o.ermaessigt) b.ermaessigt = true;
      if (o.manuell) b.manuell = o.manuell; else if (alt.manuell) b.manuell = alt.manuell;
      if (alt.satzCent != null) b.satzCent = alt.satzCent;
      if (alt.wv != null) b.wv = alt.wv;
      zaehlerNach(v, o.id);
      return b;
    });
    return { fassung: f, unbekannt: unbekannt };
  }
  function zaehlerNach(v, id) {
    var m = /^([BKON])-(\d+)$/.exec(id || "");
    if (!m) return;
    v.zaehler = v.zaehler || {};
    v.zaehler[m[1]] = Math.max(v.zaehler[m[1]] || 0, Number(m[2]));
  }

  WN.bauauftrag = { erzeuge: erzeuge, einlesen: einlesen, aufdecken: aufdecken, standAnwenden: standAnwenden,
    kopfLesen: kopfLesen, zuordnungVon: zuordnungVon, bekannte: bekannte, namenListe: namenListe, AKTIONEN: AKTIONEN, PRUEF_SORTEN: PRUEF_SORTEN };
})(typeof window !== "undefined" ? window : globalThis);
