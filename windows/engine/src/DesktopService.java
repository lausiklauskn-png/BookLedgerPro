package de.familyprojekt.bookledgerpro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Base64;
import org.json.*;

/** Benannte Geräteverträge für denselben Klebstoff native/blp-native.js wie unter Android. Die Seite ruft nur die
 *  Methoden aus windows/bridge/contracts.json; alles, was ein Fenster des Systems braucht (Passwort, Ordner, Speichern),
 *  fragt die Engine bei der Hülle nach (Host), nie die Seite. */
final class DesktopService {
    interface Host { JSONObject call(String method,JSONObject options)throws Exception; }
    /** Größte Datei, die die Seite über die Brücke speichern darf (wie NativeUtil.MAX_BYTES unter Android). */
    static final int MAX_BYTES=100*1024*1024;
    final Path directory;
    private final Host host;
    final DesktopPrefs prefs;
    final DesktopTresor tresor;
    final DesktopInbox inbox;
    final DesktopUpdates updates;

    DesktopService(Path directory,Host host)throws Exception {
        this.directory=directory.toAbsolutePath().normalize();this.host=host;
        DesktopFiles.noLinks(this.directory);Files.createDirectories(this.directory);
        prefs=new DesktopPrefs(this.directory.resolve("einstellungen.dat"),host);
        tresor=new DesktopTresor(this,host);
        inbox=new DesktopInbox(this.directory.resolve("eingang-v1"));
        updates=new DesktopUpdates(this.directory.resolve("cache/update"));
    }

    static String code(Throwable e){
        String m=e==null?null:e.getMessage();
        return m!=null&&m.matches("[A-Z_]{3,60}")?m:"APP_FEHLER";
    }
    static JSONObject ja(){return new JSONObject();}

    JSONObject call(String plugin,String method,JSONObject options)throws Exception {
        JSONObject o=options==null?new JSONObject():options;
        return switch(plugin){
            case "BlpFiles" -> files(method,o);
            case "BlpTresor" -> tresor.call(method,o);
            case "BlpIncoming" -> inbox.call(method,o);
            case "BlpUpdates" -> {
                if(method.equals("pruefen"))yield updates.pruefen();
                if(method.equals("installieren")){Path setup=updates.laden();host.call("installer",new JSONObject().put("path",setup.toString()));yield new JSONObject().put("gestartet",true);}
                throw new IOException("INVALID_INPUT");
            }
            case "DesktopInternal" -> {
                if(method.equals("receive")){int n=inbox.receive(o.getJSONArray("paths"));EngineMain.event("BlpIncoming:available",new JSONObject().put("neu",n));yield new JSONObject().put("neu",n);}
                if(method.equals("info"))yield new JSONObject().put("plattform","windows").put("version",DesktopBuild.VERSION);
                throw new IOException("INVALID_INPUT");
            }
            default -> throw new IOException("INVALID_INPUT");
        };
    }

    private static byte[] decode(JSONObject o)throws IOException {
        String data=o.optString("data",null);if(data==null)throw new IOException("FILE_INVALID");
        if(data.length()>MAX_BYTES/3*4+8)throw new IOException("FILE_INVALID");
        try{return Base64.getMimeDecoder().decode(data);}catch(IllegalArgumentException kaputt){throw new IOException("FILE_INVALID");}
    }

    /** Speichern unter … (auch für „Teilen“: unter Windows gibt es keine Teilen-Liste wie unter Android, die Datei geht
     *  dorthin, wo der Mensch im Windows-Dialog hinzeigt). */
    private JSONObject files(String method,JSONObject o)throws Exception {
        switch(method){
            case "appInfo": return new JSONObject().put("version",DesktopBuild.VERSION);
            case "save": case "share": {
                byte[] bytes=decode(o);
                String name=DesktopFiles.filename(o.optString("name",null));
                JSONObject wahl=host.call("saveLocation",new JSONObject().put("name",name));
                if(wahl.optBoolean("cancelled"))return new JSONObject().put("saved",false).put("shared",false);
                Path ziel=Path.of(wahl.getString("path")).toAbsolutePath().normalize();
                DesktopFiles.noLinks(ziel);
                try{DesktopFiles.atomic(ziel,bytes);}catch(IOException e){throw new IOException("SAVE_FAILED");}
                return new JSONObject().put("saved",true).put("shared",false).put("pfad",ziel.toString());
            }
            default: throw new IOException("INVALID_INPUT");
        }
    }

    static String utf8(byte[] b){return new String(b,StandardCharsets.UTF_8);}
}
