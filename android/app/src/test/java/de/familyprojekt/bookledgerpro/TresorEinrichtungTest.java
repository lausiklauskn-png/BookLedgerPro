package de.familyprojekt.bookledgerpro;

import de.familyprojekt.tresor.*;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.UUID;
import org.junit.Test;
import static org.junit.Assert.*;

/** Ein-Schritt-Tresor in BookLedgerPro: echte Dateien, echte Kanon-Kryptografie, nur erfundene Inhalte. */
public final class TresorEinrichtungTest {
    static final String PW = "erfundenes-Probe-Passwort";
    interface Wurf { void run() throws Exception; }
    static String code(Wurf w) { try { w.run(); return "kein Fehler"; } catch (Exception e) { return String.valueOf(e.getMessage()); } }
    static File leer() throws IOException { File d = Files.createTempDirectory("blp-einrichten").toFile(); d.deleteOnExit(); return d; }
    static int anzahl(File d) { String[] l = d.list(); return l == null ? 0 : l.length; }

    @Test public void leererSpeicherBekommtTresorMitFaechernUndLiesMich() throws Exception {
        File d = leer(); DateiAblage a = new DateiAblage(d);
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD-Karte");
        assertEquals(Hauptordner.ANLEGEN_HIER, e.art);
        assertEquals("TRESOR_PASSWORT_KURZ", code(() -> TresorEinrichtung.einrichten(a, e, null, "kurz")));
        assertEquals("Zu kurzes Passwort legt nichts an", 0, anzahl(d));
        TresorEinrichtung.Ergebnis r = TresorEinrichtung.einrichten(a, e, null, PW);
        try {
            assertTrue(r.angelegt); assertEquals("", r.pfad);
            assertTrue(new File(d, TresorOrdner.KOPF).isFile());
            assertTrue(new File(d, Hauptordner.LIES_MICH).isFile());
            assertTrue(r.tresor.fachBekannt(Fach.BOOKLEDGER.slug));
            assertTrue(r.tresor.fachBekannt(Fach.EINGANG_BOOKLEDGER.slug));
        } finally { r.tresor.close(); }
    }

    @Test public void speicherMitInhaltNeuerHauptordnerNameGeprueft() throws Exception {
        File d = leer(); Files.write(new File(d, "Urlaub.txt").toPath(), "erfunden".getBytes(StandardCharsets.UTF_8));
        File belegt = new File(d, "Belegt"); belegt.mkdir(); Files.write(new File(belegt, "x.txt").toPath(), new byte[] {1});
        DateiAblage a = new DateiAblage(d);
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "Gerät");
        assertEquals(Hauptordner.ANLEGEN_DARIN, e.art);
        assertEquals("TRESOR_NAME_UNGUELTIG", code(() -> TresorEinrichtung.einrichten(a, e, "Tresorordner", PW)));
        assertEquals("TRESOR_NAME_BELEGT", code(() -> TresorEinrichtung.einrichten(a, e, "Belegt", PW)));
        assertEquals("TRESOR_PASSWORT_KURZ", code(() -> TresorEinrichtung.einrichten(a, e, "Family-Projekt", "kurz")));
        assertEquals("Abgelehntes legt nichts an", 2, anzahl(d));
        TresorEinrichtung.Ergebnis r = TresorEinrichtung.einrichten(a, e, "", PW);
        r.tresor.close();
        assertEquals("Family-Projekt", r.pfad);
        assertTrue(new File(d, "Family-Projekt/" + TresorOrdner.KOPF).isFile());
        assertEquals(Hauptordner.GEFUNDEN, TresorEinrichtung.pruefen(a, "Gerät").art);
    }

    @Test public void vorhandenerTresorEinerAnderenAppWirdGeoeffnetNichtNeuAngelegt() throws Exception {
        File d = leer(); File alt = new File(d, "Privat Brain Pro Hauptablageordner"); alt.mkdir();
        String id;
        try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(alt), Fach.WORKFLOW_PDF_APP, PW)) { id = t.id(); }
        Files.write(new File(alt, Hauptordner.LIES_MICH).toPath(), "selbst bearbeitet".getBytes(StandardCharsets.UTF_8));
        DateiAblage a = new DateiAblage(d);
        Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(a, "SD-Karte");
        assertTrue(e.gefunden());
        String[] vorher = alt.list();
        assertEquals("TRESOR_PASSWORT_FALSCH", code(() -> TresorEinrichtung.einrichten(a, e, null, UUID.randomUUID().toString())));
        assertArrayEquals("Falsches Passwort verändert nichts", vorher, alt.list());
        TresorEinrichtung.Ergebnis r = TresorEinrichtung.einrichten(a, e, null, PW);
        try {
            assertFalse(r.angelegt); assertEquals(id, r.tresor.id()); assertEquals(alt.getName(), r.pfad);
            assertEquals("selbst bearbeitet", new String(Files.readAllBytes(new File(alt, Hauptordner.LIES_MICH).toPath()), StandardCharsets.UTF_8));
            assertTrue(r.tresor.fachBekannt(Fach.BOOKLEDGER.slug));
        } finally { r.tresor.close(); }
        assertEquals("Kein zweiter Tresor daneben", 1, anzahl(d));
    }

    @Test public void falscheWahlWirdAbgewiesen() throws Exception {
        File d = leer(); File fach = new File(d, "BookLedgerPro"); fach.mkdir();
        assertEquals("TRESOR_ORDNER_UNTERORDNER", code(() -> TresorEinrichtung.pruefen(new DateiAblage(fach), "primary:Family-Projekt/BookLedgerPro")));
        File eingang = new File(d, "Eingang-BookLedgerPro"); eingang.mkdir();
        assertEquals("TRESOR_ORDNER_UNTERORDNER", code(() -> TresorEinrichtung.pruefen(new DateiAblage(eingang), "Eingang-BookLedgerPro")));
        File zwei = new File(d, "zwei"); zwei.mkdir();
        for (String n : new String[] {"A", "B"}) { File t = new File(zwei, n); t.mkdir(); TresorOrdner.anlegen(new DateiAblage(t), Fach.WORKFLOW_PDF_APP, PW).close(); }
        assertEquals("TRESOR_ORDNER_MEHRERE", code(() -> TresorEinrichtung.pruefen(new DateiAblage(zwei), "zwei")));
        assertEquals(0, anzahl(fach)); assertEquals(0, anzahl(eingang));
    }
}
