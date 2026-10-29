package de.familyprojekt.bookledgerpro;

import static org.junit.Assert.*;
import org.junit.Test;

public class ScanAufrufTest {
    /** Muss zum Gegenstück in Workflow PDF Pro passen (ScanDirekt.AKTION, Paket, Extra „von“ mit höchstens 40 Zeichen). */
    @Test public void werteWieWorkflowPdfPro() {
        assertEquals("de.familyprojekt.workflowpdf.pro.SCANNEN", ScanAufruf.AKTION);
        assertEquals("de.familyprojekt.workflowpdf.pro", ScanAufruf.PAKET);
        assertEquals("von", ScanAufruf.EXTRA_VON);
        assertEquals("BookLedgerPro", ScanAufruf.VON);
        assertTrue(ScanAufruf.VON.length() <= 40);
    }
    @Test public void wegDirektVorAppSonstFehlt() {
        assertEquals("direkt", ScanAufruf.weg(true, true));
        assertEquals("app", ScanAufruf.weg(false, true));
        assertNull(ScanAufruf.weg(false, false));
    }
}
