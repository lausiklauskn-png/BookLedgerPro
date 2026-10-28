package de.familyprojekt.bookledgerpro;

import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.TresorOrdner;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.SecureRandom;
import java.security.PrivateKey;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.json.*;

/** Prüft die Windows-Engine ohne Windows: echte Verträge von DesktopService mit einer gestellten Hülle
 *  (DPAPI → AES-GCM mit Wegwerf-Schlüssel, Dialoge → feste Antworten). Gezählt wird jede Zeile; ein Fehler bricht ab. */
public final class EngineTests {
    static int ok=0;
    static void check(String name,boolean value){if(!value)throw new AssertionError("ROT: "+name);ok++;System.out.println("PASS "+name);}
    static String fehler(Runnable r){try{r.run();return "";}catch(RuntimeException e){Throwable c=e.getCause()!=null?e.getCause():e;return DesktopService.code(c);}}

    static final class Fake implements DesktopService.Host {
        final byte[] key=new byte[32];
        Path folder,save;String password="Probe-Passwort-2026",repeat=null;boolean cancel=false;
        final List<String> calls=new ArrayList<>();final List<JSONObject> shown=new ArrayList<>();
        Fake(){new SecureRandom().nextBytes(key);}
        public JSONObject call(String method,JSONObject o)throws Exception {
            calls.add(method);
            switch(method){
                case "protect": case "unprotect": {
                    byte[] in=Base64.getDecoder().decode(o.getString("data"));byte[] aad=o.getString("binding").getBytes(StandardCharsets.UTF_8);
                    Cipher c=Cipher.getInstance("AES/GCM/NoPadding");byte[] out;
                    if(method.equals("protect")){byte[] iv=new byte[12];new SecureRandom().nextBytes(iv);c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));c.updateAAD(aad);byte[] z=c.doFinal(in);out=new byte[12+z.length];System.arraycopy(iv,0,out,0,12);System.arraycopy(z,0,out,12,z.length);}
                    else{c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,in,0,12));c.updateAAD(aad);out=c.doFinal(in,12,in.length-12);}
                    return new JSONObject().put("data",Base64.getEncoder().encodeToString(out));
                }
                case "folder": return folder==null?new JSONObject().put("cancelled",true):new JSONObject().put("path",folder.toString());
                case "saveLocation": return save==null?new JSONObject().put("cancelled",true):new JSONObject().put("path",save.resolve(o.getString("name")).toString());
                case "password": shown.add(o);if(cancel)return new JSONObject().put("cancelled",true);return new JSONObject().put("password",password).put("repeat",repeat==null?password:repeat);
                case "showFolder": shown.add(o);return new JSONObject();
                case "startApp": throw new java.io.IOException("APP_FEHLT");
                default: throw new java.io.IOException("NOT_ALLOWED");
            }
        }
    }
    static JSONObject call(DesktopService s,String plugin,String method,JSONObject o){try{return s.call(plugin,method,o);}catch(Exception e){throw new RuntimeException(e);}}
    static JSONObject call(DesktopService s,String plugin,String method){return call(s,plugin,method,new JSONObject());}

    public static void main(String[] args)throws Exception {
        Path tmp=Files.createTempDirectory("blp-engine-");
        try{run(tmp);}finally{
            try(var w=Files.walk(tmp)){w.sorted(Comparator.reverseOrder()).forEach(p->p.toFile().delete());}
        }
        System.out.println(ok+" grün, 0 rot");
    }
    static void run(Path tmp)throws Exception {
        Fake host=new Fake();Path data=tmp.resolve("app"),vault=tmp.resolve("Tresor Ä ordner");Files.createDirectories(vault);
        DesktopService s=new DesktopService(data,host);
        JSONObject z=call(s,"BlpTresor","zustand");
        check("ohne Ordner: nicht gewählt, nicht offen",!z.getBoolean("gewaehlt")&&!z.getBoolean("offen"));
        check("Ordnerwahl abgebrochen ändert nichts",!call(s,"BlpTresor","ordnerWaehlen").getBoolean("gewaehlt")&&!call(s,"BlpTresor","zustand").getBoolean("gewaehlt"));
        host.folder=vault;z=call(s,"BlpTresor","ordnerWaehlen");
        check("Ordner gewählt mit ganzem Pfad und Namen",z.getBoolean("gewaehlt")&&z.getString("pfad").equals(vault.toString())&&z.getString("ordner").equals("Tresor Ä ordner")&&!z.getBoolean("vorhanden"));
        check("Einstellungsdatei liegt verschlüsselt (kein Pfad im Klartext)",!new String(Files.readAllBytes(data.resolve("einstellungen.dat")),StandardCharsets.ISO_8859_1).contains("Tresor"));
        host.cancel=true;
        check("Passwort-Dialog abgebrochen → abgebrochen, nichts angelegt",call(s,"BlpTresor","anlegen").optBoolean("abgebrochen")&&!Files.exists(vault.resolve(TresorOrdner.KOPF)));
        host.cancel=false;host.repeat="anders-anders-anders";
        check("ungleiche Wiederholung wird abgelehnt",fehler(()->call(s,"BlpTresor","anlegen")).equals("TRESOR_PASSWORT_UNGLEICH"));
        host.repeat=null;
        z=call(s,"BlpTresor","anlegen",new JSONObject().put("merken",true));
        check("Tresorordner angelegt und offen, gemerkt",z.getBoolean("vorhanden")&&z.getBoolean("offen")&&z.getBoolean("gemerkt"));
        check("Dialog bekam Modus create und zweimal",host.shown.get(host.shown.size()-1).getString("mode").equals("create")&&host.shown.get(host.shown.size()-1).getBoolean("zweimal"));
        check("Fächer gelistet (eigenes Fach dabei)",z.getJSONArray("faecher").toString().contains("bookledgerpro"));
        check("zweites Anlegen → TRESOR_DA",fehler(()->call(s,"BlpTresor","anlegen")).equals("TRESOR_DA"));

        byte[] inhalt=new byte[600_000];new SecureRandom().nextBytes(inhalt);
        String ticket=call(s,"BlpTresor","ablegenBeginnen",new JSONObject().put("fach","bookledgerpro").put("unterordner","Belege").put("name","Rechnung:2026?.pdf").put("art","application/pdf").put("auszug","Probe").put("datum",1761600000000L)).getString("ticket");
        for(int pos=0;pos<inhalt.length;pos+=196608){int n=Math.min(196608,inhalt.length-pos);call(s,"BlpTresor","ablegenTeil",new JSONObject().put("ticket",ticket).put("data",Base64.getEncoder().encodeToString(Arrays.copyOfRange(inhalt,pos,pos+n))));}
        JSONObject e=call(s,"BlpTresor","ablegenFertig",new JSONObject().put("ticket",ticket));
        check("abgelegt mit Windows-tauglichem Namen",e.getString("name").equals("Rechnung_2026_.pdf")&&e.getLong("groesse")==inhalt.length);
        check("fremdes Fach nicht beschreibbar",fehler(()->call(s,"BlpTresor","ablegenBeginnen",new JSONObject().put("fach","private-brain").put("name","x").put("datum",1))).equals("TRESOR_FACH_FREMD"));
        JSONObject v=call(s,"BlpTresor","verzeichnis",new JSONObject().put("fach","bookledgerpro"));
        check("Verzeichnis nennt den Eintrag",v.getJSONArray("eintraege").length()==1);
        JSONObject l=call(s,"BlpTresor","lesenOeffnen",new JSONObject().put("fach","bookledgerpro").put("id",e.getString("id")));
        java.io.ByteArrayOutputStream back=new java.io.ByteArrayOutputStream();boolean fertig=false;
        while(!fertig){JSONObject t=call(s,"BlpTresor","lesenTeil",new JSONObject().put("ticket",l.getString("ticket")));back.write(Base64.getDecoder().decode(t.getString("data")));fertig=t.getBoolean("fertig");}
        check("gelesen = abgelegt (Byte für Byte)",Arrays.equals(back.toByteArray(),inhalt));
        call(s,"BlpTresor","markieren",new JSONObject().put("fach","bookledgerpro").put("id",e.getString("id")));
        check("Marke gesetzt",call(s,"BlpTresor","verzeichnis",new JSONObject().put("fach","bookledgerpro")).getJSONArray("marken").toString().contains(e.getString("id")));
        check("kein Klartext des Inhalts im Ordner",!enthaelt(vault,Arrays.copyOfRange(inhalt,1000,1032)));
        call(s,"BlpTresor","ordnerOeffnen",new JSONObject().put("welcher","tresor"));
        check("„In Dateien öffnen“ zeigt den Tresorordner",host.shown.get(host.shown.size()-1).getString("path").equals(vault.toString()));
        check("„In ‹App› öffnen“ ohne installierte App → APP_FEHLT",fehler(()->call(s,"BlpTresor","appOeffnen",new JSONObject().put("app","workflow-pdf-pro"))).equals("APP_FEHLT"));

        z=call(s,"BlpTresor","sperren");
        check("von Hand gesperrt bleibt zu, trotz gemerktem Schlüssel",!z.getBoolean("offen")&&!call(s,"BlpTresor","zustand").getBoolean("offen"));
        check("gesperrt: Verzeichnis verweigert",fehler(()->call(s,"BlpTresor","verzeichnis",new JSONObject().put("fach","bookledgerpro"))).equals("TRESOR_GESPERRT"));
        DesktopService s2=new DesktopService(data,host);
        check("nach Neustart öffnet der gemerkte Schlüssel (DPAPI) von selbst",call(s2,"BlpTresor","zustand").getBoolean("offen"));
        Fake fremd=new Fake();fremd.folder=vault;
        check("anderer Windows-Benutzer (anderer DPAPI-Schlüssel) kann die Einstellungen nicht lesen",fehlerKonstruktor(data,fremd));
        z=call(s2,"BlpTresor","sperren",new JSONObject().put("vergessen",true));
        check("sperren + vergessen löscht den gemerkten Schlüssel",!z.getBoolean("gemerkt"));
        host.password="falsches-Passwort-123";
        check("falsches Passwort öffnet nicht",!fehler(()->call(s2,"BlpTresor","entsperren")).isEmpty()&&!call(s2,"BlpTresor","zustand").getBoolean("offen"));
        host.password="Probe-Passwort-2026";
        check("richtiges Passwort öffnet",call(s2,"BlpTresor","entsperren").getBoolean("offen"));
        host.password="Neues-Passwort-2026";
        check("Passwort geändert",call(s2,"BlpTresor","passwortAendern").getBoolean("geaendert"));
        JSONArray teile=call(s2,"BlpTresor","ersatzErstellen").getJSONArray("teile");
        check("fünf Ersatzschlüssel",teile.length()==5);
        call(s2,"BlpTresor","sperren",new JSONObject().put("vergessen",true));
        host.password="Wieder-Passwort-2026";
        JSONArray drei=new JSONArray().put(teile.get(0)).put(teile.get(2)).put(teile.get(4));
        check("drei Ersatzschlüssel + neues Passwort öffnen",call(s2,"BlpTresor","wiederherstellen",new JSONObject().put("teile",drei)).getBoolean("offen"));
        try(TresorOrdner t=TresorOrdner.oeffnen(new DateiAblage(vault.toFile()),"workflow-pdf-pro","Wieder-Passwort-2026")){
            check("eine andere Pro-App öffnet denselben Ordner mit dem neuen Passwort",t.verzeichnis("bookledgerpro").size()==1);
        }

        // Speichern unter …
        check("Speichern abgebrochen → saved false",!call(s,"BlpFiles","save",new JSONObject().put("name","a.json").put("data","e30=")).getBoolean("saved"));
        Path ziel=tmp.resolve("ziel");Files.createDirectories(ziel);host.save=ziel;
        check("Speichern schreibt genau die Bytes",call(s,"BlpFiles","save",new JSONObject().put("name","Sicherung.json").put("data",Base64.getEncoder().encodeToString("{\"a\":1}".getBytes()))).getBoolean("saved")&&Files.readString(ziel.resolve("Sicherung.json")).equals("{\"a\":1}"));
        check("Teilen unter Windows = Speichern unter",call(s,"BlpFiles","share",new JSONObject().put("name","b.txt").put("data","eA==")).getBoolean("saved")&&Files.exists(ziel.resolve("b.txt")));
        check("Version kommt aus tauri.conf.json",call(s,"BlpFiles","appInfo").getString("version").equals(DesktopBuild.VERSION));
        check("Windows-Dateinamen: Gerätenamen und Punkte am Ende",DesktopFiles.filename("con.txt").equals("_con.txt")&&DesktopFiles.filename("a. ").equals("a")&&DesktopFiles.filename("x<y>").equals("x_y_"));

        // Eingang („Öffnen mit“)
        Path f1=tmp.resolve("Beleg ü.pdf"),f2=tmp.resolve("mail.eml");Files.write(f1,new byte[300_000]);Files.writeString(f2,"Subject: x\r\n\r\nHallo");
        check("Öffnen mit: zwei Dateien angenommen, fehlende übergangen",call(s,"DesktopInternal","receive",new JSONObject().put("paths",new JSONArray().put(f1.toString()).put(f2.toString()).put(tmp.resolve("fehlt.pdf").toString()))).getInt("neu")==2);
        JSONObject p=call(s,"BlpIncoming","pending");JSONArray fs=p.getJSONArray("files");
        check("Eingang nennt Namen und Art",fs.getJSONObject(0).getString("name").equals("Beleg ü.pdf")&&fs.getJSONObject(0).getString("mime").equals("application/pdf")&&fs.getJSONObject(1).getString("mime").equals("message/rfc822"));
        long off=0;int stuecke=0;boolean done=false;
        while(!done){JSONObject r=call(s,"BlpIncoming","read",new JSONObject().put("batch",p.getString("id")).put("id",fs.getJSONObject(0).getString("id")).put("offset",off));off+=Base64.getDecoder().decode(r.getString("data")).length;done=r.getBoolean("done");stuecke++;}
        check("Eingang liest in Stücken vollständig",off==300_000&&stuecke==2);
        long offFalsch=off;check("Lesen an falscher Stelle verweigert",!fehler(()->call(s,"BlpIncoming","read",new JSONObject().put("batch",p.getString("id")).put("id",fs.getJSONObject(1).getString("id")).put("offset",offFalsch))).isEmpty());
        call(s,"BlpIncoming","acknowledge",new JSONObject().put("id",p.getString("id")));
        check("quittiert → leer, im Verlauf",call(s,"BlpIncoming","pending").optBoolean("empty")&&call(s,"BlpIncoming","history").getJSONArray("receipts").length()==1);
        check("Original nach dem Einlesen unberührt",Files.size(f1)==300_000);
        DesktopService s3=new DesktopService(data,host);
        check("Verlauf übersteht den Neustart",call(s3,"BlpIncoming","history").getJSONArray("receipts").length()==1);
        call(s3,"BlpIncoming","restore",new JSONObject().put("id",p.getString("id")));
        check("zurückgeholt → wieder offen",!call(s3,"BlpIncoming","pending").optBoolean("empty"));
        call(s3,"BlpIncoming","acknowledge",new JSONObject().put("id",p.getString("id")).put("discard",true));
        check("verworfen → Kopie gelöscht",call(s3,"BlpIncoming","pending").optBoolean("empty")&&!Files.exists(data.resolve("eingang-v1").resolve(p.getString("id"))));
        check("unbekannte Methode verweigert",fehler(()->call(s,"BlpTresor","loeschen")).equals("INVALID_INPUT"));
        updates(tmp);
    }

    // ---------- Updates von Klaus' Server (Wegwerf-Schlüssel, gestelltes Netz) ----------
    static final Map<String,byte[]> SERVER=new HashMap<>();
    static String sig(PrivateKey k,byte[] d)throws Exception{java.security.Signature s=java.security.Signature.getInstance("Ed25519");s.initSign(k);s.update(d);return Base64.getEncoder().encodeToString(s.sign());}
    static byte[] feed(String v,byte[] setup,String datei)throws Exception{
        return new JSONObject().put("format",1).put("app","bookledgerpro").put("version",v).put("windows",new JSONObject().put("datei",datei).put("groesse",setup.length)
            .put("sha256",DesktopFiles.hex(java.security.MessageDigest.getInstance("SHA-256").digest(setup)))).toString().getBytes(StandardCharsets.UTF_8);
    }
    static String fehlerU(java.util.concurrent.Callable<?> c){try{c.call();return "";}catch(Exception e){return DesktopService.code(e);}}
    static void updates(Path tmp)throws Exception{
        java.security.KeyPairGenerator g=java.security.KeyPairGenerator.getInstance("Ed25519");
        java.security.KeyPair echt=g.generateKeyPair(),fremd=g.generateKeyPair();
        String pub=Base64.getEncoder().encodeToString(echt.getPublic().getEncoded());
        List<String> geholt=new ArrayList<>();
        DesktopUpdates.Netz netz=new DesktopUpdates.Netz(){
            public byte[] holen(String url,long grenze)throws Exception{geholt.add(url);byte[] b=SERVER.get(url);if(b==null)throw new java.io.IOException("UPDATE_NICHT_ERREICHBAR");if(b.length>grenze)throw new java.io.IOException("UPDATE_UNGUELTIG");return b;}
            public java.io.InputStream strom(String url)throws Exception{geholt.add(url);byte[] b=SERVER.get(url);if(b==null)throw new java.io.IOException("UPDATE_NICHT_ERREICHBAR");return new java.io.ByteArrayInputStream(b);}
        };
        String B=DesktopUpdates.BASIS;Path ordner=tmp.resolve("update");
        DesktopUpdates u=new DesktopUpdates(ordner,netz,"0.1.1",pub);
        check("Update: Server nicht erreichbar → klare Meldung",fehlerU(u::pruefen).equals("UPDATE_NICHT_ERREICHBAR"));
        byte[] setup=new byte[3_000_000];new SecureRandom().nextBytes(setup);String datei="BookLedgerPro-Windows-0.1.2-x64-setup.exe";
        byte[] f=feed("0.1.2",setup,datei);
        SERVER.put(B+"aktuell.json",f);SERVER.put(B+"aktuell.json.sig",sig(fremd.getPrivate(),f).getBytes());SERVER.put(B+datei,setup);
        check("Update: fremde Unterschrift wird abgelehnt",fehlerU(u::pruefen).equals("UPDATE_UNTERSCHRIFT_FALSCH"));
        SERVER.put(B+"aktuell.json.sig",sig(echt.getPrivate(),f).getBytes());
        byte[] f2=f.clone();f2[f2.length-3]^=1;SERVER.put(B+"aktuell.json",f2);
        check("Update: veränderte Angaben mit alter Unterschrift → abgelehnt",fehlerU(u::pruefen).equals("UPDATE_UNTERSCHRIFT_FALSCH"));
        SERVER.put(B+"aktuell.json",f);
        JSONObject r=u.pruefen();
        check("Update: Neu 0.1.2 (installiert 0.1.1) mit Größe",r.optString("neu").equals("0.1.2")&&r.optString("installiert").equals("0.1.1")&&r.optLong("groesse")==setup.length);
        Path p=u.laden();
        check("Update: Setup geladen, Größe und SHA-256 stimmen, nur im Update-Ordner",Files.size(p)==setup.length&&p.startsWith(ordner)&&p.getFileName().toString().equals(datei));
        check("Update: Setup-Adresse = feste Basis + Name (nichts aus fremder Quelle)",geholt.stream().allMatch(x->x.startsWith(B)));
        SERVER.put(B+datei,Arrays.copyOf(setup,setup.length-1));u.pruefen();
        check("Update: abgeschnittenes Setup → beschädigt, nichts bleibt liegen",fehlerU(u::laden).equals("UPDATE_BESCHAEDIGT")&&!Files.exists(ordner.resolve(datei+".teil"))&&!Files.exists(ordner.resolve(datei)));
        byte[] alt=feed("0.1.0",setup,"BookLedgerPro-Windows-0.1.0-x64-setup.exe");SERVER.put(B+"aktuell.json",alt);SERVER.put(B+"aktuell.json.sig",sig(echt.getPrivate(),alt).getBytes());
        check("Update: alter echter Stand gilt nicht als neu",u.pruefen().optBoolean("aktuell"));
        byte[] gleich=feed("0.1.1",setup,"BookLedgerPro-Windows-0.1.1-x64-setup.exe");SERVER.put(B+"aktuell.json",gleich);SERVER.put(B+"aktuell.json.sig",sig(echt.getPrivate(),gleich).getBytes());
        check("Update: gleiche Version → „aktuell“",u.pruefen().optBoolean("aktuell")&&u.pruefen().optString("version").equals("0.1.1"));
        byte[] boese=feed("0.1.3",setup,"..\\..\\evil.exe");SERVER.put(B+"aktuell.json",boese);SERVER.put(B+"aktuell.json.sig",sig(echt.getPrivate(),boese).getBytes());
        check("Update: fremder Dateiname (auch unterschrieben) → abgelehnt",fehlerU(u::pruefen).equals("UPDATE_UNGUELTIG"));
        check("Update: ohne Prüfung kein Laden",fehlerU(u::laden).equals("UPDATE_NICHT_GEPRUEFT"));
        check("Update: Versionsvergleich",DesktopUpdates.neuer("0.10.0","0.9.9")&&!DesktopUpdates.neuer("0.1.1","0.1.1")&&!DesktopUpdates.neuer("1.0.0-x","0.1.0"));
        // Gleiche Unterschrift wie im Veröffentlichungs-Lauf (openssl pkeyutl -sign -rawin, Base64 mit Zeilenende).
        Path k=tmp.resolve("k.pem"),d=tmp.resolve("d.json"),sb=tmp.resolve("s.bin");
        if(new ProcessBuilder("openssl","genpkey","-algorithm","ed25519","-out",k.toString()).inheritIO().start().waitFor()==0){
            Files.write(d,f);
            new ProcessBuilder("openssl","pkeyutl","-sign","-rawin","-inkey",k.toString(),"-in",d.toString(),"-out",sb.toString()).inheritIO().start().waitFor();
            Process pp=new ProcessBuilder("openssl","pkey","-in",k.toString(),"-pubout","-outform","DER").start();byte[] der=pp.getInputStream().readAllBytes();pp.waitFor();
            String opub=Base64.getEncoder().encodeToString(der);
            SERVER.put(B+"aktuell.json",f);SERVER.put(B+"aktuell.json.sig",(Base64.getEncoder().encodeToString(Files.readAllBytes(sb))+"\n").getBytes());
            check("Update: Unterschrift von openssl (wie in GitHub) wird erkannt",new DesktopUpdates(ordner,netz,"0.1.1",opub).pruefen().optString("neu").equals("0.1.2"));
        } else System.out.println("(openssl fehlt: Gegenprobe mit openssl übersprungen)");
        check("Update: der eingebaute Schlüssel ist ein gültiger Ed25519-Schlüssel",java.security.KeyFactory.getInstance("Ed25519").generatePublic(new java.security.spec.X509EncodedKeySpec(Base64.getDecoder().decode(DesktopUpdates.SCHLUESSEL)))!=null);
    }
    static boolean fehlerKonstruktor(Path data,Fake host){try{new DesktopService(data,host);return false;}catch(Exception e){return true;}}
    static boolean enthaelt(Path dir,byte[] stueck)throws Exception {
        try(var w=Files.walk(dir)){
            for(Path p:(Iterable<Path>)w::iterator){if(!Files.isRegularFile(p))continue;byte[] b=Files.readAllBytes(p);
                outer:for(int i=0;i+stueck.length<=b.length;i++){for(int j=0;j<stueck.length;j++)if(b[i+j]!=stueck[j])continue outer;return true;}}
        }
        return false;
    }
}
