package de.familyprojekt.bookledgerpro;

/**
 * „Mit Workflow PDF scannen“ (Pro-Umbau 6, Klaus 2026-10-29): BookLedgerPro öffnet den Scanner von Workflow PDF Pro direkt
 * über dessen Intent (Gegenstück: Workflow-PDF-Pro ScanDirekt.java, ab 1.0.8). Paket fest, übergeben wird nur der eigene Name
 * als Zusatz „von“ — keine Datei, keine Adresse. Zurück kommt der Scan wie bisher über „Teilen“ → BookLedgerPro.
 * Rein und ohne Android, damit die JVM-Probe die Werte gegen das Gegenstück prüfen kann.
 */
final class ScanAufruf {
    static final String AKTION = "de.familyprojekt.workflowpdf.pro.SCANNEN";
    static final String PAKET = "de.familyprojekt.workflowpdf.pro";
    static final String EXTRA_VON = "von";
    static final String VON = "BookLedgerPro";
    private ScanAufruf() {}

    /** Ergebnis an die Seite: „direkt“ = Scanner geht auf, „app“ = ältere Workflow PDF Pro ohne den Intent, nur gestartet. */
    static String weg(boolean direktGefunden, boolean appGefunden) {
        if (direktGefunden) return "direkt";
        if (appGefunden) return "app";
        return null;   // APP_FEHLT
    }
}
