package de.familyprojekt.bookledgerpro;

import java.io.IOException;
import java.util.Locale;

/** Kleine Helfer der Hülle. Rein, ohne Android, in JVM-Tests geprüft. */
final class NativeUtil {
    /** Lesestück für Übergaben an die Web-App (256 KiB, wie in Workflow PDF Pro). */
    static final int CHUNK = 262144;
    /** Größte Datei, die die Web-App über die Brücke speichern oder teilen darf. */
    static final int MAX_BYTES = 100 * 1024 * 1024;
    private NativeUtil() { }

    static String hex(byte[] value) {
        StringBuilder out = new StringBuilder(value.length * 2);
        for (byte b : value) out.append(String.format(Locale.ROOT, "%02x", b & 255));
        return out.toString();
    }

    /** Dateiname ohne Steuerzeichen und Pfadtrenner; nie leer, nie "." oder "..". */
    static String filename(String value) {
        String name = value == null ? "Dokument" : value.replaceAll("[\\p{Cntrl}/\\\\]", "_").trim();
        if (name.isEmpty() || name.equals(".") || name.equals("..")) return "Dokument";
        if (name.length() > 180) name = name.substring(0, 180);
        return name;
    }

    /** Nur einfache Medientypen; sonst application/octet-stream. */
    static String mime(String value) {
        if (value == null) return "application/octet-stream";
        String m = value.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        return m.matches("[a-z0-9.+-]+/[a-z0-9.+-]+") ? m : "application/octet-stream";
    }

    static long integer(Object value) throws IOException {
        if (!(value instanceof Number)) throw new IOException("INVALID_NUMBER");
        double number = ((Number) value).doubleValue();
        if (!Double.isFinite(number) || number < 0 || number != Math.rint(number) || number > 9007199254740991d) throw new IOException("INVALID_NUMBER");
        return (long) number;
    }

    /** Eigene Apps unter lausiklauskn-png.github.io dürfen auch ohne Tipp im Browser geöffnet werden (Rundlauf). */
    static boolean eigeneAdresse(String scheme, String host) {
        return "https".equals(scheme) && "lausiklauskn-png.github.io".equals(host);
    }
}
