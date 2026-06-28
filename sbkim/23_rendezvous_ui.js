/*
 * SBKIM — Modul 23 UI — Rendezvous-Floating-Knopf (öffentlich, app-agnostisch)
 *
 * Das app-eigene UI-Stück zu Modul 23 (Rendezvous). Klaus' Festlegung
 * 2026-06-28: ein **eigener kleiner Floating-Knopf** (wie family's „🔌 Andock-
 * Tool" / wie Modul 22), **öffentlich** sichtbar (kein ?dev-Gate). Self-mountet
 * einen dezenten 🌐-Knopf, der ein Mini-Panel mit den drei Rendezvous-Gesten
 * öffnet:
 *   🌐 Mit dem Netz verbinden   → SbkimRendezvous.connectAndAnnounce({createIdentity})
 *   👥 Wer ist im Raum?         → SbkimRendezvous.discover() → Karten + 🤝 Andocken
 *   📌 Nur neu anmelden         → SbkimRendezvous.announce()
 *
 * Dieses UI-Modul wird — wie Modul 23 selbst — **byte-1:1 in jede PWA kopiert**.
 * Die App parametrisiert nur:
 *   SbkimRendezvousUI.init({ nodeName, createIdentity, corner?, accent? })
 * - nodeName:       Anzeigename der eigenen Visitenkarte (z.B. "Mein Rezeptbuch").
 * - createIdentity: optional async () -> void; erzeugt die lebende Identität,
 *                   falls noch keine da ist (app-spezifisch, da Domänen-
 *                   Stichworte app-spezifisch sind). Fehlt sie + keine Identität,
 *                   meldet das Panel das ruhig (kein Throw).
 * - corner:         "bl" | "br" | "tl" | "tr" (Default "bl" = unten links).
 * - accent:         Akzentfarbe (Default greift CSS-Var --accent oder #6ee7d3).
 *
 * Komponiert ausschliesslich Modul 23 (SbkimRendezvous) — keine direkten
 * Aufrufe an Modul 02/03/05/05b. DOM-only, fail-soft, idempotent. Baut die
 * Elemente per createElement (keine innerHTML-Struktur) — stub- und real-DOM-fest.
 *
 * Public surface (window.SbkimRendezvousUI):
 *   init(opts) -> Promise<void>   (self-mount; idempotent)
 *   show() / hide() -> void
 *   isOpen() -> boolean
 *   _meta -> { version, mounted, open, nodeName, hasRendezvous }
 *
 * Verfassungstreu: alle Aktionen sind nutzer-ausgelöst (Knöpfe). Kein Dauer-
 * Piepser, kein Auto-Connect beim Laden (init mountet nur den Knopf).
 */
(function (global) {
  "use strict";

  var VERSION = "0.1";

  var cfg = { nodeName: "SBKIM-Knoten", createIdentity: null, corner: "bl", accent: null };
  var mounted = false;
  var btnEl = null, panelEl = null, outEl = null, cardsEl = null;

  function doc() { return global.document; }
  function rdv() { return global.SbkimRendezvous || null; }
  function accent() { return cfg.accent || "var(--accent,#6ee7d3)"; }

  function el(tag, css, text) {
    var d = doc();
    var e = d.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function cornerCss(corner, panel) {
    var off = panel ? "64px" : "14px";
    switch (corner) {
      case "br": return "right:14px;bottom:" + off;
      case "tl": return "left:14px;top:" + off;
      case "tr": return "right:14px;top:" + off;
      case "bl":
      default: return "left:14px;bottom:" + off;
    }
  }

  function setOut(text) { if (outEl) outEl.textContent = text; if (cardsEl) clear(cardsEl); }
  function appendOut(text) { if (outEl) outEl.textContent += text; }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function mount() {
    if (mounted) return;
    var d = doc();
    if (!d || !d.body) return;
    var ac = accent();
    var bs = "padding:7px 12px;border-radius:8px;border:1px solid " + ac + ";" +
      "background:rgba(110,231,211,.12);color:#eef2f8;cursor:pointer;font:inherit";
    var bsGhost = "padding:7px 12px;border-radius:8px;border:1px solid var(--line,#2a3340);" +
      "background:transparent;color:#eef2f8;cursor:pointer;font:inherit";

    btnEl = el("button", "position:fixed;" + cornerCss(cfg.corner, false) + ";z-index:2147483600;" +
      "font:600 .8rem var(--mono,system-ui,sans-serif);padding:8px 12px;border-radius:10px;" +
      "border:1px solid " + ac + ";background:rgba(10,12,20,.7);color:" + ac + ";cursor:pointer;" +
      "backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.35)", "🌐 Mit dem Netz verbinden");
    btnEl.type = "button";
    btnEl.id = "sbkim-rdv-btn";
    btnEl.title = "SBKIM-Rendezvous: dich im gemeinsamen Raum anmelden + andere Knoten finden.";

    panelEl = el("div", "position:fixed;" + cornerCss(cfg.corner, true) + ";z-index:2147483600;" +
      "width:min(420px,92vw);display:none;max-height:80vh;overflow-y:auto;-webkit-overflow-scrolling:touch;" +
      "background:rgba(10,12,20,.94);border:1px solid " + ac + ";border-radius:12px;padding:14px;" +
      "color:#eef2f8;font:.82rem/1.5 var(--sans,system-ui,sans-serif);backdrop-filter:blur(10px);" +
      "box-shadow:0 12px 34px rgba(0,0,0,.5)");
    panelEl.id = "sbkim-rdv-panel";

    var head = el("div", "display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px");
    head.appendChild(el("strong", "color:" + ac, "🌐 Mit dem Netz verbinden"));
    var closeBtn = el("button", "background:none;border:none;color:#9aa7b6;font-size:1.1rem;cursor:pointer", "✕");
    closeBtn.type = "button";
    head.appendChild(closeBtn);
    panelEl.appendChild(head);

    panelEl.appendChild(el("p", "margin:0 0 10px;color:#9aa7b6",
      "Triff andere SBKIM-Knoten im gemeinsamen Raum — server-los, direkt aus deinem Browser. Lass diesen Tab offen, damit du erreichbar bleibst."));

    var row = el("div", "display:flex;gap:8px;flex-wrap:wrap");
    var connectBtn = el("button", bs, "🌐 Mit dem Netz verbinden"); connectBtn.type = "button";
    var discoverBtn = el("button", bsGhost, "👥 Wer ist im Raum?"); discoverBtn.type = "button";
    var announceBtn = el("button", bsGhost, "📌 Nur neu anmelden"); announceBtn.type = "button";
    row.appendChild(connectBtn); row.appendChild(discoverBtn); row.appendChild(announceBtn);
    panelEl.appendChild(row);

    cardsEl = el("div", "margin-top:10px");
    cardsEl.id = "sbkim-rdv-cards";
    panelEl.appendChild(cardsEl);

    outEl = el("pre", "margin:10px 0 0;white-space:pre-wrap;word-break:break-word;" +
      "font:.74rem/1.5 var(--mono,monospace);color:#cfe0ff;max-height:42vh;overflow:auto");
    outEl.id = "sbkim-rdv-out";
    panelEl.appendChild(outEl);

    panelEl.appendChild(el("p", "margin:8px 0 0;color:#9aa7b6;font-size:.72rem",
      "Es wird nur deine öffentliche Visitenkarte (Spore) im Raum gezeigt — dein privater Schlüssel bleibt in diesem Browser."));

    d.body.appendChild(btnEl);
    d.body.appendChild(panelEl);

    btnEl.addEventListener("click", function () { toggle(); });
    closeBtn.addEventListener("click", function () { hide(); });
    connectBtn.addEventListener("click", function () { onConnect(); });
    discoverBtn.addEventListener("click", function () { onDiscover(); });
    announceBtn.addEventListener("click", function () { onAnnounce(); });

    mounted = true;
  }

  function ensureRdv() {
    var r = rdv();
    if (!r) { setOut("Modul 23 (SbkimRendezvous) nicht geladen."); return null; }
    try { r.configure({ nodeName: cfg.nodeName }); } catch (_e) {}
    return r;
  }

  function onConnect() {
    var r = ensureRdv();
    if (!r) return;
    setOut("→ Verbinde mit dem Netz …\n");
    r.connectAndAnnounce({ createIdentity: cfg.createIdentity || undefined }).then(function (res) {
      if (res.ok) {
        if (res.created) appendOut("✓ Identität erzeugt: " + res.nodeId + "\n");
        else appendOut("Identität vorhanden: " + res.nodeId + "\n");
        appendOut("✓ Du bist im Raum — deine Visitenkarte hängt, du lauschst.\n");
        appendOut("  Lass diesen Tab offen — eine geschlossene Seite ist nicht erreichbar.");
      } else {
        appendOut("✗ " + (res.reason || "Verbinden fehlgeschlagen.") +
          (cfg.createIdentity ? "\n(Bei Netz-/Modell-Fehler: Verbindung prüfen und nochmal.)" : ""));
      }
    }).catch(function (e) { appendOut("✗ Verbinden fehlgeschlagen: " + (e && e.message ? e.message : e)); });
  }

  function onAnnounce() {
    var r = ensureRdv();
    if (!r) return;
    setOut("→ Hefte deine Visitenkarte in den gemeinsamen Raum …\n");
    r.announce().then(function (res) {
      if (res.ok) appendOut("✓ Du bist im Raum (nodeId " + res.nodeId + "). Lass den Tab offen.");
      else appendOut("✗ " + (res.reason || "Anmelden fehlgeschlagen."));
    }).catch(function (e) { appendOut("✗ Anmelden fehlgeschlagen: " + (e && e.message ? e.message : e)); });
  }

  function onDiscover() {
    var r = ensureRdv();
    if (!r) return;
    setOut("👥 Lese den gemeinsamen Raum …\n");
    r.discover().then(function (res) {
      if (!res.ok) { setOut("✗ Raum-Lesen fehlgeschlagen: " + (res.reason || "(unbekannt)")); return; }
      renderCards(res.cards);
    }).catch(function (e) { setOut("✗ Raum-Lesen fehlgeschlagen: " + (e && e.message ? e.message : e)); });
  }

  function renderCards(cards) {
    if (outEl) outEl.textContent = "";
    if (!cardsEl) return;
    clear(cardsEl);
    if (!cards || cards.length === 0) {
      if (outEl) outEl.textContent = "Niemand (Fremdes) im Raum. Lass den Gegenknoten zuerst „🌐 Mit dem Netz verbinden“ drücken — dann hier nochmal „👥 Wer ist im Raum?“.";
      return;
    }
    var ac = accent();
    var bs = "padding:5px 10px;border-radius:8px;border:1px solid " + ac + ";" +
      "background:rgba(110,231,211,.12);color:#eef2f8;cursor:pointer;font:inherit";
    cardsEl.appendChild(el("div", "color:#9ff7df;margin-bottom:6px", "👥 " + cards.length + " Knoten im Raum:"));
    cards.forEach(function (c) {
      var ageTxt = c.ageSec < 60 ? "gerade eben" : (Math.floor(c.ageSec / 60) + " min");
      var rowEl = el("div", "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0;padding:6px 8px;" +
        "border:1px solid var(--line,#2a3340);border-radius:8px");
      var info = el("span", "flex:1;min-width:150px");
      info.appendChild(el("b", null, c.nodeName || "Knoten"));
      info.appendChild(el("br"));
      info.appendChild(el("span", "font:.66rem/1.3 var(--mono,monospace);color:#9aa7b6;word-break:break-all", c.nodeId));
      info.appendChild(el("br"));
      info.appendChild(el("span", "font-size:.7rem;color:#9aa7b6", "angemeldet " + ageTxt));
      rowEl.appendChild(info);
      var b = el("button", bs, "🤝 Andocken"); b.type = "button";
      b.addEventListener("click", function () { onHandshake(c); });
      rowEl.appendChild(b);
      cardsEl.appendChild(rowEl);
    });
  }

  function onHandshake(card) {
    var r = rdv();
    if (!r) { setOut("Modul 23 (SbkimRendezvous) nicht geladen."); return; }
    if (outEl) outEl.textContent = "🤝 Handshake an " + (card.nodeName || "Knoten") + " (lebende ID, max ~12 s) …";
    r.handshakeCard(card).then(function (res) {
      var oc = res && res.outcome;
      function line(s) { if (outEl) outEl.textContent += "\n" + s; }
      if (oc === "established") {
        line("✓ ANDOCK ETABLIERT mit " + (card.nodeName || "Knoten") + "! 🎉");
        line("   Server-loser Live-Cross-Knoten-Handshake — ihr seid verbunden.");
      } else if (oc === "rejected-local") {
        line("• Lokal abgelehnt — Bedeutungs-Ähnlichkeit " + (res.score != null ? Number(res.score).toFixed(4) : "?") + " < 0.80 (kein Fehler, zu verschiedene Domänen).");
      } else if (oc === "rejected") {
        line("• Vom Gegenknoten abgelehnt: " + (res.reason || "(kein Grund)"));
      } else if (oc === "timeout") {
        line("✗ " + (res.reason || "Keine Antwort — Knoten offline/nicht wach (Visitenkarte veraltet)."));
      } else {
        line("✗ Fehler: " + (res && res.reason ? res.reason : JSON.stringify(res)));
      }
    }).catch(function (e) { if (outEl) outEl.textContent += "\n✗ Fehler: " + (e && e.message ? e.message : e); });
  }

  function show() { if (panelEl) panelEl.style.display = "block"; }
  function hide() { if (panelEl) panelEl.style.display = "none"; }
  function isOpen() { return !!(panelEl && panelEl.style.display !== "none"); }
  function toggle() { if (isOpen()) hide(); else show(); }

  function applyOpts(opts) {
    if (!opts || typeof opts !== "object") return;
    if (typeof opts.nodeName === "string" && opts.nodeName.length > 0) cfg.nodeName = opts.nodeName;
    if (typeof opts.createIdentity === "function") cfg.createIdentity = opts.createIdentity;
    if (typeof opts.corner === "string") cfg.corner = opts.corner;
    if (typeof opts.accent === "string") cfg.accent = opts.accent;
  }

  function init(opts) {
    applyOpts(opts);
    var r = rdv();
    if (r) { try { r.configure({ nodeName: cfg.nodeName }); } catch (_e) {} }
    var d = doc();
    if (!d) return Promise.resolve();
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", mount);
    else mount();
    return Promise.resolve();
  }

  var api = {
    init: init,
    show: show,
    hide: hide,
    isOpen: isOpen,
    get _meta() {
      return { version: VERSION, mounted: mounted, open: isOpen(), nodeName: cfg.nodeName, hasRendezvous: rdv() !== null };
    },
  };

  global.SbkimRendezvousUI = api;

  if (typeof console !== "undefined" && console.info) {
    console.info("MODUL 23 UI RENDEZVOUS-KNOPF bereit (öffentlich, app-agnostisch), Funktionen: init/show/hide/isOpen");
  }
})(typeof window !== "undefined" ? window : globalThis);
