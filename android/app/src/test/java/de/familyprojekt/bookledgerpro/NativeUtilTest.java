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
}
