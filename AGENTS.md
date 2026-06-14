# AGENTS.md

Dieses Repo nutzt **[`CLAUDE.md`](CLAUDE.md)** als zentralen Leitfaden für Agenten
und Mehr-Sitzungs-Arbeit. Bitte dort starten.

Kurz-Checkliste vor jeder Änderung:
- Build-frei (ES-Module, keine CDNs), läuft über `python3 -m http.server`.
- Datendurabilität nicht untergraben (siehe `docs/SAGE_BROWSER_LEHREN.md`).
- `node tests/run.mjs` grün.
- Bei Shell-Änderungen `CACHE_VERSION` in `sw.js` erhöhen.
- `docs/SESSIONS.md` am Ende fortschreiben.
