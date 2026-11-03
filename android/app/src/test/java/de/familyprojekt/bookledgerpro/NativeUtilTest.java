package de.familyprojekt.bookledgerpro;

import static org.junit.Assert.*;
import org.junit.Test;

public class NativeUtilTest {
    @Test public void dateinameOhnePfadUndSteuerzeichen() {
        assertEquals("a_b_c.pdf", NativeUtil.filename("a/b\\c.pdf"));
        assertEquals("Dokument", NativeUtil.filename(".."));
        assertEquals("Dokument", NativeUtil.filename(null));
        assertEquals("x_y", NativeUtil.filename("x\ny"));
    }
    @Test public void medientypNurEinfach() {
        assertEquals("application/pdf", NativeUtil.mime("application/pdf"));
        assertEquals("text/plain", NativeUtil.mime("text/plain;charset=utf-8"));
        assertEquals("application/octet-stream", NativeUtil.mime("x\"; drop"));
        assertEquals("application/octet-stream", NativeUtil.mime(null));
    }
    @Test public void nurEigeneAdresseOhneTipp() {
        assertTrue(NativeUtil.eigeneAdresse("https", "lausiklauskn-png.github.io"));
        assertFalse(NativeUtil.eigeneAdresse("http", "lausiklauskn-png.github.io"));
        assertFalse(NativeUtil.eigeneAdresse("https", "evil.example"));
        assertFalse(NativeUtil.eigeneAdresse("https", "lausiklauskn-png.github.io.evil.example"));
    }
    @Test public void zahlenStreng() throws Exception {
        assertEquals(5L, NativeUtil.integer(5));
        try { NativeUtil.integer(-1); fail(); } catch (java.io.IOException ok) { }
        try { NativeUtil.integer("5"); fail(); } catch (java.io.IOException ok) { }
    }
    @Test public void hexKlein() { assertEquals("00ff10", NativeUtil.hex(new byte[] {0, (byte) 255, 16})); }
    /** Befund SD-Karte 2026-11-03: Sicherungen per „Speichern unter“ lagen offen neben dem Tresor. */
    @Test public void speichernImTresorErkannt() {
        String baum = "1A2B-3C4D:Privat Brain Pro Hauptablageordner";
        assertTrue(NativeUtil.imTresor(baum, "1A2B-3C4D:Privat Brain Pro Hauptablageordner/bookledgerpro-backup.blpr.json"));
        assertTrue(NativeUtil.imTresor(baum, "1a2b-3c4d:privat brain pro hauptablageordner/BookLedgerPro/x.json"));
        assertTrue(NativeUtil.imTresor(null, "primary:Irgendwo/Tresorordner/x.json"));
        assertFalse(NativeUtil.imTresor(baum, "1A2B-3C4D:Privat Brain Pro Hauptablageordner alt/x.json"));
        assertFalse(NativeUtil.imTresor(baum, "primary:Download/bookledgerpro-backup.blpr.json"));
        assertFalse(NativeUtil.imTresor(baum, "primary:Privat Brain Pro Hauptablageordner/x.json"));
        assertFalse(NativeUtil.imTresor(null, "primary:Download/x.json"));
        assertFalse(NativeUtil.imTresor(baum, null));
        assertTrue(NativeUtil.imTresor("1A2B-3C4D:", "1A2B-3C4D:x.json"));
    }
}
