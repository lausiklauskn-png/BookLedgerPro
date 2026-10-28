package de.familyprojekt.bookledgerpro;

import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.Normalizer;
import java.util.*;
import org.json.*;

/**
 * Windows-Fassung von BlpTresorPlugin (Android): dieselben Methoden, dieselben Antworten, dasselbe byte-gleiche Paket
 * de.familyprojekt.tresor — nur mit DateiAblage statt SafAblage. Passwort ausschließlich im eigenen Dialog-Fenster der
 * Hülle (nie über die Seite), „Merken“ über Windows-DPAPI des angemeldeten Benutzers statt Android-Schlüsselspeicher.
 * BookLedgerPro schreibt nur ins eigene Fach und ins Eingangsfach; fremde Fächer liest es.
 */
final class DesktopTresor {
    private static final String APP=Fach.BOOKLEDGER_APP, APP_ORDNER="BookLedgerPro";
    private static final int CHUNK=262144;
    private final DesktopService service;
    private final DesktopService.Host host;
    private TresorOrdner offen;
    private boolean vonHandGesperrt;
    private final Map<String,Ablegen> ablegen=new HashMap<>();
    private final Map<String,InputStream> lesen=new HashMap<>();
    private static final class Ablegen{String fach,unterordner,name,art,auszug;long datum,groesse;File datei;}

    DesktopTresor(DesktopService service,DesktopService.Host host){this.service=service;this.host=host;}

    private DesktopPrefs prefs(){return service.prefs;}
    private Path ordner()throws IOException {
        String p=prefs().get("ordner",null);if(p==null)throw new IOException("TRESOR_KEIN_ORDNER");
        Path pfad=Path.of(p);DesktopFiles.noLinks(pfad);
        if(!Files.isDirectory(pfad))throw new IOException("TRESOR_NICHT_VERFUEGBAR");
        return pfad;
    }
    private DateiAblage ablage()throws IOException {return new DateiAblage(ordner().toFile());}

    synchronized JSONObject call(String method,JSONObject o)throws Exception {
        switch(method){
            case "zustand": return zustand();
            case "ordnerWaehlen": return ordnerWaehlen();
            case "ordnerOeffnen": return ordnerOeffnen(o.optString("welcher","tresor"));
            case "appOeffnen": return host.call("startApp",new JSONObject().put("app",o.optString("app","")));
            case "anlegen": return anlegen(o.optBoolean("merken",false));
            case "entsperren": return entsperren(o.optBoolean("merken",false));
            case "passwortAendern": return passwortAendern();
            case "wiederherstellen": return wiederherstellen(o.optJSONArray("teile"));
            case "ersatzErstellen": return ersatzErstellen();
            case "sperren": return sperren(o.optBoolean("vergessen",false));
            case "ablegenBeginnen": return ablegenBeginnen(o);
            case "ablegenTeil": return ablegenTeil(o);
            case "ablegenFertig": return ablegenFertig(o);
            case "ablegenAbbrechen": {Ablegen a=ablegen.remove(o.optString("ticket"));if(a!=null)a.datei.delete();return DesktopService.ja();}
            case "verzeichnis": return verzeichnis(o.optString("fach"));
            case "lesenOeffnen": return lesenOeffnen(o.optString("fach"),o.optString("id"));
            case "lesenTeil": return lesenTeil(o.optString("ticket"));
            case "markieren": {offenPruefen();offen.markeSetzen(o.optString("fach"),o.optString("id"));return DesktopService.ja();}
            default: throw new IOException("INVALID_INPUT");
        }
    }

    // ---------- Zustand ----------
    JSONObject zustand()throws Exception {
        JSONObject z=new JSONObject();
        z.put("gewaehlt",prefs().has("ordner")).put("ordner",prefs().get("name","")).put("gemerkt",prefs().has("merken"));
        // Ganzer Pfad (Leitfaden § 5). Unter Windows ist das der Laufwerkspfad selbst, ohne Speicher-Vorsatz.
        z.put("pfad",prefs().get("ordner","")).put("speicher","");
        z.put("offen",offen!=null);
        if(!prefs().has("ordner"))return z;
        try{
            DateiAblage a=ablage();
            boolean da=TresorOrdner.vorhanden(a);
            z.put("erreichbar",true).put("vorhanden",da);
            z.put("istFachOrdner",!da&&a.gibtEs("tresor.json")&&!a.gibtEs(TresorOrdner.KOPF));
            if(da)z.put("kennung",TresorOrdner.kennung(a));
            if(offen==null&&da&&prefs().has("merken")&&!vonHandGesperrt)entsperrenGemerkt(a);
            z.put("offen",offen!=null);
            if(offen!=null){
                JSONArray faecher=new JSONArray();
                for(Map<String,Object> f:offen.faecher())faecher.put(new JSONObject(f));
                z.put("faecher",faecher).put("ersatz",new JSONObject(offen.ersatzInfo()));
            }
        }catch(IOException e){z.put("erreichbar",false).put("problem",DesktopService.code(e));}
        return z;
    }

    private JSONObject ordnerOeffnen(String welcher)throws Exception {
        Path p=ordner();
        if("ablage".equals(welcher)&&Files.isDirectory(p.resolve(APP_ORDNER),LinkOption.NOFOLLOW_LINKS))p=p.resolve(APP_ORDNER);
        DesktopFiles.noLinks(p);
        host.call("showFolder",new JSONObject().put("path",p.toString()));
        return DesktopService.ja();
    }

    private JSONObject ordnerWaehlen()throws Exception {
        JSONObject wahl=host.call("folder",new JSONObject());
        if(wahl.optBoolean("cancelled"))return new JSONObject().put("gewaehlt",false);
        Path pfad=Path.of(wahl.getString("path")).toAbsolutePath().normalize();
        DesktopFiles.noLinks(pfad);
        if(!Files.isDirectory(pfad))throw new IOException("TRESOR_NICHT_VERFUEGBAR");
        schliessen();
        Path name=pfad.getFileName();
        // Ein anderer Ordner: der gemerkte Schlüssel gehört zum alten und wird vergessen.
        prefs().edit(p->{p.put("ordner",pfad.toString());p.put("name",name==null?pfad.toString():name.toString());p.remove("merken");p.remove("kennung");});
        return zustand();
    }

    // ---------- Passwort (nur im Dialog der Hülle) ----------
    private static final class Passwort implements AutoCloseable {
        final char[] eins,zwei;Passwort(char[] a,char[] b){eins=a;zwei=b;}
        @Override public void close(){Arrays.fill(eins,'\0');if(zwei!=null)Arrays.fill(zwei,'\0');}
    }
    /** null = abgebrochen. */
    private Passwort dialog(String modus,String titel,String text,boolean zweimal)throws Exception {
        JSONObject r=host.call("password",new JSONObject().put("mode",modus).put("titel",titel).put("text",text==null?"":text).put("zweimal",zweimal));
        if(r.optBoolean("cancelled"))return null;
        char[] a=r.optString("password","").toCharArray(),b=zweimal?r.optString("repeat","").toCharArray():null;
        Passwort p=new Passwort(a,b);
        if(zweimal){
            String x=Normalizer.normalize(new String(a),Normalizer.Form.NFC),y=Normalizer.normalize(new String(b),Normalizer.Form.NFC);
            if(!x.equals(y)){p.close();throw new IOException("TRESOR_PASSWORT_UNGLEICH");}
        }
        return p;
    }
    private static JSONObject abgebrochen(){return new JSONObject().put("abgebrochen",true);}

    private JSONObject anlegen(boolean merken)throws Exception {
        DateiAblage a=ablage();
        if(TresorOrdner.vorhanden(a))throw new IOException("TRESOR_DA");
        if(a.gibtEs("tresor.json"))throw new IOException("TRESOR_ORDNER_IST_FACH");
        try(Passwort p=dialog("create","Tresorordner anlegen","Ein Passwort für alle Pro-Apps. Es verlässt den Rechner nie.",true)){
            if(p==null)return abgebrochen();
            TresorOrdner t=TresorOrdner.anlegen(a,APP,java.nio.CharBuffer.wrap(p.eins));
            uebernehmen(t,merken);
            t.fachAnlegen(Fach.BOOKLEDGER.slug);
            t.fachAnlegen(Fach.EINGANG_BOOKLEDGER.slug);
            return zustand();
        }
    }
    private JSONObject entsperren(boolean merken)throws Exception {
        DateiAblage a=ablage();
        try(Passwort p=dialog("unlock","Tresorordner entsperren",null,false)){
            if(p==null)return abgebrochen();
            TresorOrdner t=TresorOrdner.oeffnen(a,APP,java.nio.CharBuffer.wrap(p.eins));
            uebernehmen(t,merken);
            t.fachAnlegen(Fach.BOOKLEDGER.slug);
            return zustand();
        }
    }
    private JSONObject passwortAendern()throws Exception {
        offenPruefen();
        try(Passwort p=dialog("change","Neues Passwort","Gilt für alle Pro-Apps in diesem Ordner.",true)){
            if(p==null)return abgebrochen();
            offenPruefen();offen.passwortAendern(java.nio.CharBuffer.wrap(p.eins));
            return new JSONObject().put("geaendert",true);
        }
    }
    private JSONObject wiederherstellen(JSONArray roh)throws Exception {
        List<String> teile=new ArrayList<>();
        if(roh==null)throw new IOException("TRESOR_ERSATZ_INCOMPLETE");
        for(int i=0;i<roh.length();i++)teile.add(String.valueOf(roh.get(i)));
        DateiAblage a=ablage();
        try(Passwort p=dialog("restore","Neues Passwort setzen","Die Ersatzschlüssel stimmen, wenn das neue Passwort angenommen wird.",true)){
            if(p==null)return abgebrochen();
            TresorOrdner t=TresorOrdner.wiederherstellen(a,APP,teile,java.nio.CharBuffer.wrap(p.eins));
            uebernehmen(t,false);
            return zustand();
        }
    }
    private JSONObject ersatzErstellen()throws Exception {
        offenPruefen();
        JSONArray teile=new JSONArray();for(String t:offen.ersatzErstellen(5,3))teile.put(t);
        return new JSONObject().put("teile",teile).put("n",5).put("k",3);
    }
    private JSONObject sperren(boolean vergessen)throws Exception {
        schliessen();vonHandGesperrt=true;
        if(vergessen)prefs().edit(p->{p.remove("merken");p.remove("kennung");});
        return zustand();
    }
    private void offenPruefen()throws IOException {if(offen==null)throw new IOException("TRESOR_GESPERRT");}

    private void uebernehmen(TresorOrdner t,boolean merken)throws Exception {
        schliessen();vonHandGesperrt=false;offen=t;
        if(merken)merken(t);
    }
    void schliessen(){
        for(InputStream in:lesen.values())try{in.close();}catch(IOException ignoriert){}
        lesen.clear();
        for(Ablegen a:ablegen.values())a.datei.delete();
        ablegen.clear();
        if(offen!=null)offen.close();
        offen=null;
    }

    // ---------- Merken über DPAPI ----------
    private static String bindung(String id){return "familyprojekt-tresorordner|"+id+"|geraet|"+APP;}
    private void merken(TresorOrdner t)throws Exception {
        byte[] haupt=t.hauptschluesselKopie();
        try{
            String wert=Base64.getEncoder().encodeToString(prefs().protect(bindung(t.id()),haupt));
            prefs().edit(p->{p.put("merken",wert);p.put("kennung",t.id());});
        }finally{Arrays.fill(haupt,(byte)0);}
    }
    private void entsperrenGemerkt(DateiAblage a){
        byte[] haupt=null;
        try{
            String id=TresorOrdner.kennung(a);
            if(!id.equals(prefs().get("kennung","")))return;
            haupt=prefs().unprotect(bindung(id),Base64.getDecoder().decode(prefs().get("merken","")));
            if(haupt.length!=32)return;
            offen=TresorOrdner.mitHauptschluessel(a,APP,haupt);
        }catch(Exception e){offen=null;}
        finally{if(haupt!=null)Arrays.fill(haupt,(byte)0);}
    }

    // ---------- Ablegen in Stücken ----------
    private JSONObject ablegenBeginnen(JSONObject o)throws Exception {
        offenPruefen();
        Ablegen a=new Ablegen();
        a.fach=o.optString("fach",Fach.BOOKLEDGER.slug);
        if(!Fach.nachSlug(a.fach).darfSchreiben(APP))throw new IOException("TRESOR_FACH_FREMD");
        a.unterordner=o.optString("unterordner","");
        a.name=DesktopFiles.filename(o.optString("name",null));
        a.art=DesktopFiles.mime(o.optString("art",null));
        a.auszug=o.optString("auszug","");
        a.datum=DesktopFiles.integer(o.opt("datum"));
        Path dir=service.directory.resolve("cache/tresor-ablegen");Files.createDirectories(dir);DesktopFiles.noLinks(dir);
        a.datei=Files.createTempFile(dir,"ablegen-",".tmp").toFile();
        String ticket=UUID.randomUUID().toString();ablegen.put(ticket,a);
        return new JSONObject().put("ticket",ticket);
    }
    private JSONObject ablegenTeil(JSONObject o)throws Exception {
        Ablegen a=ablegen.get(o.optString("ticket"));
        if(a==null)throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
        byte[] b;try{b=Base64.getMimeDecoder().decode(o.optString("data",""));}catch(IllegalArgumentException x){throw new IOException("FILE_INVALID");}
        if(a.groesse+b.length>1L<<30)throw new IOException("TRESOR_DATEI_ZU_GROSS");
        try(FileOutputStream out=new FileOutputStream(a.datei,true)){out.write(b);}
        a.groesse+=b.length;
        return new JSONObject().put("groesse",a.groesse);
    }
    private JSONObject ablegenFertig(JSONObject o)throws Exception {
        Ablegen a=ablegen.remove(o.optString("ticket"));
        try{
            if(a==null)throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
            offenPruefen();
            try(InputStream in=new FileInputStream(a.datei)){
                Eintrag e=offen.ablegen(a.fach,a.unterordner,a.name,a.art,a.datum,in,a.auszug);
                return new JSONObject(e.alsMap());
            }
        }finally{if(a!=null)a.datei.delete();}
    }

    // ---------- Lesen ----------
    private JSONObject verzeichnis(String fach)throws Exception {
        offenPruefen();
        JSONArray liste=new JSONArray();for(Eintrag e:offen.verzeichnis(fach))liste.put(new JSONObject(e.alsMap()));
        JSONArray marken=new JSONArray();for(String m:offen.marken(fach))marken.put(m);
        return new JSONObject().put("eintraege",liste).put("marken",marken);
    }
    private JSONObject lesenOeffnen(String fach,String id)throws Exception {
        offenPruefen();
        Eintrag gefunden=null;for(Eintrag e:offen.verzeichnis(fach))if(e.id.equals(id))gefunden=e;
        if(gefunden==null)throw new IOException("TRESOR_EINTRAG_FEHLT");
        String ticket=UUID.randomUUID().toString();lesen.put(ticket,offen.oeffnen(fach,gefunden));
        return new JSONObject().put("ticket",ticket).put("groesse",gefunden.groesse).put("name",gefunden.name).put("art",gefunden.art);
    }
    private JSONObject lesenTeil(String ticket)throws Exception {
        InputStream in=lesen.get(ticket);
        try{
            if(in==null)throw new IOException("TRESOR_UEBERGABE_UNGUELTIG");
            byte[] puffer=new byte[CHUNK];int n=0,r;
            while(n<puffer.length&&(r=in.read(puffer,n,puffer.length-n))!=-1)n+=r;
            boolean fertig=n<puffer.length;
            if(fertig){lesen.remove(ticket);in.close();}
            return new JSONObject().put("data",Base64.getEncoder().encodeToString(Arrays.copyOf(puffer,n))).put("fertig",fertig);
        }catch(Exception e){
            lesen.remove(ticket);if(in!=null)try{in.close();}catch(IOException ignoriert){}
            throw e;
        }
    }
}
