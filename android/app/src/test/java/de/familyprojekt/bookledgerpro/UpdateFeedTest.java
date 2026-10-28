package de.familyprojekt.bookledgerpro;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

/** Updates vom eigenen Server unter Android: Unterschriften wie aus dem Veröffentlichungs-Lauf (openssl pkeyutl -sign -rawin,
 *  Base64), erzeugt mit Wegwerf-Schlüsseln (nicht Klaus' Schlüssel). */
public class UpdateFeedTest {
    static final String PUB = "MCowBQYDK2VwAyEAvBOLhr7pQjq/YZFnvxjIii1aRlPzCG0aiiqOqbwkLpY=";
    static final String SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    static byte[] feed(String datei, int code) {
        return ("{\"format\":1,\"app\":\"bookledgerpro\",\"version\":\"0.1.2\",\"android\":{\"datei\":\"" + datei + "\",\"groesse\":1234,\"sha256\":\"" + SHA + "\",\"versionCode\":" + code + "}}").getBytes(StandardCharsets.UTF_8);
    }
    static final byte[] NEU = feed("BookLedgerPro-0.1.2.apk", 3), BOESE = feed("../evil.apk", 3), CODE = feed("BookLedgerPro-0.1.2.apk", 2);
    static final byte[] NEU_SIG = "l8ptT2nRPJFq0OYbVCKry7MJWDG7/DEnEQNya6qBSb1mmh9FKgfLY5hh/89EnzMnBivuTuPhteuP0EO+tl3CDQ==\n".getBytes(StandardCharsets.US_ASCII);
    static final byte[] BOESE_SIG = "ZUsa1JlJNIi8UEqWBZiwgzKYTI2xmhZTzE7VLd9xM4xQghRlcUrXZ20TN/i08dcQXpjr01ykShp9FyUYfbY7AA==".getBytes(StandardCharsets.US_ASCII);
    static final byte[] CODE_SIG = "QAY5nmGuC1E6dUS01+ocXbR1yGSRe9pVtMepx+m15EEprXVtH51HU2vmuAqV/no34LfcgvwVXIaUHUCCV4M/Bw==".getBytes(StandardCharsets.US_ASCII);
    static final byte[] FREMD_SIG = "w2YLEiQ/7CWJtvMOI5JC6h1Z/dTl27ubDw+wSwzuw9JDrOtwsDOQCXdm69OIf33UY2n6C3NTgyC7CMN2gOgNBg==".getBytes(StandardCharsets.US_ASCII);
    static String fehler(byte[] f, byte[] s, String v, long c) {
        try { UpdateFeed.auswerten(f, s, v, c, PUB); return ""; } catch (IOException e) { return e.getMessage(); }
    }

    @Test public void neuereVersionMitEchterUnterschrift() throws Exception {
        UpdateFeed.Angebot a = UpdateFeed.auswerten(NEU, NEU_SIG, "0.1.1", 2, PUB);
        assertNotNull(a);
        assertEquals("0.1.2", a.version); assertEquals("BookLedgerPro-0.1.2.apk", a.datei); assertEquals(1234, a.groesse); assertEquals(3, a.versionCode);
    }
    @Test public void debugZusatzWirdIgnoriert() throws Exception { assertNotNull(UpdateFeed.auswerten(NEU, NEU_SIG, "0.1.1-debug", 2, PUB)); }
    @Test public void gleicheOderAeltereVersionIstAktuell() throws Exception {
        assertNull(UpdateFeed.auswerten(NEU, NEU_SIG, "0.1.2", 3, PUB));
        assertNull(UpdateFeed.auswerten(NEU, NEU_SIG, "0.2.0", 9, PUB));
    }
    @Test public void versionCodeMussSteigen() throws Exception { assertNull(UpdateFeed.auswerten(CODE, CODE_SIG, "0.1.1", 2, PUB)); }
    @Test public void fremdeUnterschrift() { assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(NEU, FREMD_SIG, "0.1.1", 2)); }
    @Test public void veraenderteAngaben() {
        byte[] f = NEU.clone(); f[f.length - 3] = '9';
        assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(f, NEU_SIG, "0.1.1", 2));
    }
    @Test public void kaputteUnterschrift() { assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(NEU, "@@@".getBytes(), "0.1.1", 2)); }
    @Test public void fremderDateinameAuchUnterschrieben() { assertEquals("UPDATE_UNGUELTIG", fehler(BOESE, BOESE_SIG, "0.1.1", 2)); }
    @Test public void eingebauterSchluesselIstGueltig() {
        byte[] k = UpdateFeed.b64(UpdateFeed.SCHLUESSEL);
        assertEquals(44, k.length);
        assertEquals(UpdateFeed.SCHLUESSEL, "MCowBQYDK2VwAyEAojPTWOhCLk0Cc+O6jKKf7yzdJglEaZ+ZBKF8PM7YLgs=");
    }
    @Test public void base64() {
        assertArrayEquals("ab".getBytes(), UpdateFeed.b64("YWI="));
        assertArrayEquals("abc".getBytes(), UpdateFeed.b64("YWJj"));
        assertArrayEquals("abcd".getBytes(), UpdateFeed.b64("YWJjZA"));
    }
    @Test public void versionsvergleich() {
        assertTrue(UpdateFeed.neuer("0.10.0", "0.9.9")); assertFalse(UpdateFeed.neuer("0.1.1", "0.1.1")); assertFalse(UpdateFeed.neuer("1.0.0-x", "0.1.0"));
    }
}
