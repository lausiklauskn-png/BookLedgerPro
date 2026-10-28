package de.familyprojekt.bookledgerpro;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Base64;
import org.json.JSONObject;

/** Kleine Einstellungsdatei der App (gewählter Tresorordner, gemerkter Schlüssel), mit Windows-DPAPI des angemeldeten
 *  Benutzers verschlüsselt (Hülle: CryptProtectData). Die Seite sieht sie nie. */
final class DesktopPrefs {
    private final Path file;
    private final DesktopService.Host host;
    private JSONObject data;
    DesktopPrefs(Path file,DesktopService.Host host)throws Exception {
        this.file=file;this.host=host;DesktopFiles.noLinks(file);
        data=Files.exists(file)?new JSONObject(new String(unprotect("einstellungen",Files.readAllBytes(file)),StandardCharsets.UTF_8)):new JSONObject();
    }
    byte[] protect(String binding,byte[] plain)throws Exception {
        return Base64.getDecoder().decode(host.call("protect",new JSONObject().put("binding",binding).put("data",Base64.getEncoder().encodeToString(plain))).getString("data"));
    }
    byte[] unprotect(String binding,byte[] sealed)throws Exception {
        return Base64.getDecoder().decode(host.call("unprotect",new JSONObject().put("binding",binding).put("data",Base64.getEncoder().encodeToString(sealed))).getString("data"));
    }
    synchronized boolean has(String key){return data.has(key);}
    synchronized String get(String key,String fallback){return data.optString(key,fallback);}
    /** Ändert und schreibt sofort; ohne Erfolg bleibt der alte Stand im Speicher. */
    synchronized void edit(java.util.function.Consumer<JSONObject> change)throws Exception {
        JSONObject next=new JSONObject(data.toString());change.accept(next);
        try{DesktopFiles.atomic(file,protect("einstellungen",next.toString().getBytes(StandardCharsets.UTF_8)));}
        catch(Exception e){throw new java.io.IOException("TRESOR_NICHT_VERFUEGBAR");}
        data=next;
    }
}
