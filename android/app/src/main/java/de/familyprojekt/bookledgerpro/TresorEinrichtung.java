package de.familyprojekt.bookledgerpro;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.Hauptordner;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.IOException;

/**
 * „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04), gerätefrei und ohne Android-Klassen, damit JUnit es prüfen kann.
 * Vorbild Workflow PDF Pro ProVaultPlugin.tresorEinrichten und Familienakte ProTresorAdapter.einrichten.
 * Der Nutzer wählt nur den Speicher; der Tresor-Hauptordner wird am Inhalt gefunden oder (Name frei, Vorschlag
 * „Family-Projekt“) angelegt. Ein falsches Passwort schreibt nichts; ungültige Wahl wird abgewiesen, bevor etwas entsteht.
 */
public final class TresorEinrichtung {
    private TresorEinrichtung() { }

    public static final class Ergebnis {
        public final TresorOrdner tresor;
        /** Hauptordner relativ zum gewählten Speicher ("" = der gewählte Ordner selbst). */
        public final String pfad;
        public final boolean angelegt;
        Ergebnis(TresorOrdner tresor, String pfad, boolean angelegt) { this.tresor = tresor; this.pfad = pfad; this.angelegt = angelegt; }
    }

    /** Nur lesend, vor jeder Passwortfrage. */
    public static Hauptordner.Ergebnis pruefen(Ablage gewaehlt, String ordnerName) throws IOException {
        Hauptordner.Ergebnis e = Hauptordner.suchen(gewaehlt, letzterTeil(ordnerName));
        if (e.gefunden()) return e;
        if (Hauptordner.UNTERORDNER.equals(e.art) || istFachName(ordnerName)) throw new IOException("TRESOR_ORDNER_UNTERORDNER");
        // MEHRERE und alles Unbekannte: TRESOR_ORDNER_<art>, nichts angelegt.
        if (!e.anlegen()) throw new IOException("TRESOR_ORDNER_" + e.art);
        return e;
    }

    /** Gefunden: mit dem Passwort öffnen (falsch → TRESOR_PASSWORT_FALSCH, nichts geschrieben). Sonst Name und Länge
     *  prüfen, dann Hauptordner, Tresor und die Fächer von BookLedgerPro anlegen. In beiden Fällen die Lies-mich-Datei. */
    public static Ergebnis einrichten(Ablage gewaehlt, Hauptordner.Ergebnis e, String neuerName, CharSequence passwort) throws IOException {
        if (e.gefunden()) {
            Ablage haupt = Hauptordner.ablage(gewaehlt, e, null);
            TresorOrdner t = TresorOrdner.oeffnen(haupt, Fach.BOOKLEDGER_APP, passwort);
            boolean gut = false;
            try { t.fachAnlegen(Fach.BOOKLEDGER.slug); liesMich(haupt); gut = true; return new Ergebnis(t, e.pfad, false); }
            finally { if (!gut) t.close(); }
        }
        if (!e.anlegen()) throw new IOException("TRESOR_ORDNER_" + e.art);
        if (passwort == null || Character.codePointCount(passwort, 0, passwort.length()) < TresorOrdner.MIN_PASSWORT)
            throw new IOException("TRESOR_PASSWORT_KURZ");
        String name = Hauptordner.ANLEGEN_DARIN.equals(e.art) ? Hauptordner.name(neuerName) : "";
        Ablage haupt = Hauptordner.ablage(gewaehlt, e, name);
        TresorOrdner t = TresorOrdner.anlegen(haupt, Fach.BOOKLEDGER_APP, passwort);
        boolean gut = false;
        try {
            t.fachAnlegen(Fach.BOOKLEDGER.slug);
            t.fachAnlegen(Fach.EINGANG_BOOKLEDGER.slug);
            liesMich(haupt);
            gut = true;
            return new Ergebnis(t, name, true);
        } finally { if (!gut) t.close(); }
    }

    private static void liesMich(Ablage haupt) {
        try { Hauptordner.liesMichAnlegen(haupt); } catch (IOException zusatz) { /* Lies-mich ist ein Zusatz */ }
    }

    static String letzterTeil(String n) {
        if (n == null) return "";
        String s = n.replace('\\', '/');
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        s = s.substring(s.lastIndexOf('/') + 1);
        if (s.contains(":")) s = s.substring(s.indexOf(':') + 1);
        return s.trim();
    }

    static boolean istFachName(String n) {
        String s = letzterTeil(n);
        if (s.isEmpty()) return false;
        if (s.equalsIgnoreCase(TresorOrdner.VERWALTUNG)) return true;
        for (Fach f : Fach.ALLE) if (s.equalsIgnoreCase(f.ordner)) return true;
        return s.regionMatches(true, 0, "Eingang-", 0, 8);
    }
}
