package de.familyprojekt.bookledgerpro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.util.*;
import org.json.*;

/** Windows-Fassung von IncomingInbox (Android): derselbe Vertrag pending/read/acknowledge/history/restore/discardArchived
 *  für den Eingang in native/blp-native.js. Unter Windows kommen Dateien über „Öffnen mit“ (zweiter Programmstart mit
 *  Pfaden) — sie werden sofort als Kopie in den App-Speicher gelegt (mit SHA-256), das Original bleibt unberührt.
 *  Nur ausdrückliches Verwerfen löscht die Kopie; quittierte Lieferungen bleiben 14 Tage als Rückweg (Klebstoff räumt auf). */
final class DesktopInbox {
    static final int CHUNK=262144;
    static final long MAX_FILE=200L*1024*1024, MAX_TOTAL=512L*1024*1024;
    private final Path root;
    private final ArrayList<JSONObject> entries=new ArrayList<>();
    private InputStream input;private String reading;private long offset;private boolean done;

    DesktopInbox(Path root)throws Exception {
        this.root=root;DesktopFiles.noLinks(root);Files.createDirectories(root);
        try(DirectoryStream<Path> dirs=Files.newDirectoryStream(root)){
            for(Path dir:dirs){
                String name=dir.getFileName().toString();
                try{UUID.fromString(name);}catch(Exception fremd){continue;}
                try{
                    JSONObject e=new JSONObject(Files.readString(dir.resolve("receipt.json"),StandardCharsets.UTF_8));
                    if(!name.equals(e.getString("id")))throw new IOException();entries.add(e);
                }catch(Exception kaputt){entries.add(new JSONObject().put("id",name).put("at",Files.getLastModifiedTime(dir).toMillis()).put("problem",true).put("ready",false));}
            }
        }
        entries.sort(Comparator.comparingLong(e->e.optLong("at",0)));
    }

    synchronized JSONObject call(String method,JSONObject o)throws Exception {
        switch(method){
            case "pending": return pending();
            case "read": {byte[] b=read(o.optString("batch"),o.optString("id"),DesktopFiles.integer(o.opt("offset")));return new JSONObject().put("data",Base64.getEncoder().encodeToString(b)).put("done",done);}
            case "acknowledge": acknowledge(o.optString("id"),o.optBoolean("discard",false));return DesktopService.ja();
            case "history": return new JSONObject().put("receipts",history());
            case "restore": restore(o.optString("id"));EngineMain.event("BlpIncoming:available",new JSONObject());return DesktopService.ja();
            case "discardArchived": discardArchived(o.optString("id"));return DesktopService.ja();
            default: throw new IOException("INVALID_INPUT");
        }
    }

    private Path dir(String id)throws IOException {try{UUID.fromString(id);}catch(Exception x){throw new IOException("INCOMING_INVALID_TRANSFER");}return root.resolve(id);}
    private void save(JSONObject e)throws Exception {Path d=dir(e.getString("id"));Files.createDirectories(d);DesktopFiles.atomic(d.resolve("receipt.json"),e.toString().getBytes(StandardCharsets.UTF_8));}
    private long used(){long n=0;for(JSONObject e:entries){JSONArray f=e.optJSONArray("files");if(f!=null)for(int i=0;i<f.length();i++)n+=f.getJSONObject(i).optLong("size");}return n;}

    /** Eine Lieferung je Programmstart. Liefert die Zahl der angenommenen Dateien; nicht lesbare werden übergangen. */
    synchronized int receive(JSONArray paths)throws Exception {
        String id=UUID.randomUUID().toString();Path d=dir(id);Files.createDirectories(d);
        JSONArray files=new JSONArray();long total=used();
        for(int i=0;i<paths.length()&&i<64;i++){
            String fid=UUID.randomUUID().toString();Path target=d.resolve(fid+".bin");
            try{
                Path file=Path.of(paths.getString(i)).toAbsolutePath().normalize();DesktopFiles.noLinks(file);
                BasicFileAttributes before=Files.readAttributes(file,BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
                if(!before.isRegularFile()||before.size()>MAX_FILE||total+before.size()>MAX_TOTAL)throw new IOException();
                MessageDigest hash=MessageDigest.getInstance("SHA-256");long size=0;
                try(InputStream in=Files.newInputStream(file);FileOutputStream out=new FileOutputStream(target.toFile())){
                    byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1){out.write(b,0,n);hash.update(b,0,n);size+=n;if(size>MAX_FILE)throw new IOException();}
                    out.getFD().sync();
                }
                if(size!=before.size())throw new IOException();
                String name=DesktopFiles.filename(file.getFileName().toString());
                String mime=DesktopFiles.mime(Files.probeContentType(file));
                if("application/octet-stream".equals(mime))mime=mimeNachEndung(name);
                files.put(new JSONObject().put("id",fid).put("name",name).put("mime",mime).put("size",size).put("sha256",DesktopFiles.hex(hash.digest())));
                total+=size;
            }catch(Exception unlesbar){Files.deleteIfExists(target);}
        }
        JSONObject e=new JSONObject().put("id",id).put("at",System.currentTimeMillis()).put("ready",true).put("files",files);
        if(files.length()==0){e.put("problem",true).put("ready",false);}
        save(e);entries.add(e);return files.length();
    }
    static String mimeNachEndung(String name){
        String n=name.toLowerCase(Locale.ROOT);
        if(n.endsWith(".pdf"))return "application/pdf";
        if(n.endsWith(".eml"))return "message/rfc822";
        if(n.endsWith(".png"))return "image/png";
        if(n.endsWith(".jpg")||n.endsWith(".jpeg"))return "image/jpeg";
        if(n.endsWith(".webp"))return "image/webp";
        if(n.endsWith(".json"))return "application/json";
        if(n.endsWith(".xml"))return "application/xml";
        if(n.endsWith(".csv"))return "text/csv";
        if(n.endsWith(".txt"))return "text/plain";
        return "application/octet-stream";
    }

    private JSONObject first(){for(JSONObject e:entries)if(!e.optBoolean("archived"))return e;return null;}
    JSONObject pending()throws Exception {
        rewind();JSONObject e=first();if(e==null)return new JSONObject().put("empty",true);
        if(!e.optBoolean("ready"))return new JSONObject().put("id",e.getString("id")).put("problem",true);
        return new JSONObject().put("id",e.getString("id")).put("files",e.getJSONArray("files"));
    }
    byte[] read(String batch,String id,long requested)throws Exception {
        JSONObject e=first();if(e==null||!e.getString("id").equals(batch)||!e.optBoolean("ready"))throw new IOException("INCOMING_READ_FAILED");
        JSONObject item=null;JSONArray files=e.getJSONArray("files");for(int i=0;i<files.length();i++)if(files.getJSONObject(i).getString("id").equals(id))item=files.getJSONObject(i);
        if(item==null)throw new IOException("INCOMING_READ_FAILED");
        String ticket=batch+":"+id;
        if(!ticket.equals(reading)){
            if(requested!=0||reading!=null&&!done)throw new IOException("INCOMING_READ_FAILED");rewind();
            Path file=dir(batch).resolve(dir(id).getFileName()+".bin");
            if(Files.size(file)!=item.getLong("size"))throw new IOException("INCOMING_READ_FAILED");
            MessageDigest hash=MessageDigest.getInstance("SHA-256");
            try(InputStream v=Files.newInputStream(file)){byte[] b=new byte[65536];int n;while((n=v.read(b))!=-1)hash.update(b,0,n);}
            if(!DesktopFiles.hex(hash.digest()).equals(item.getString("sha256")))throw new IOException("INCOMING_READ_FAILED");
            input=Files.newInputStream(file);reading=ticket;
        }
        if(done||requested!=offset)throw new IOException("INCOMING_READ_FAILED");
        ByteArrayOutputStream out=new ByteArrayOutputStream(CHUNK);byte[] b=new byte[8192];
        while(out.size()<CHUNK){int n=input.read(b,0,Math.min(b.length,CHUNK-out.size()));if(n<0){input.close();input=null;done=true;break;}out.write(b,0,n);}
        offset+=out.size();return out.toByteArray();
    }
    void acknowledge(String id,boolean discard)throws Exception {
        JSONObject e=first();if(e==null||!e.getString("id").equals(id))throw new IOException("INCOMING_INVALID_TRANSFER");rewind();
        if(discard){remove(e);return;}
        JSONObject a=new JSONObject(e.toString()).put("archived",true);save(a);entries.set(entries.indexOf(e),a);
    }
    JSONArray history(){JSONArray out=new JSONArray();for(JSONObject e:entries)if(e.optBoolean("archived"))out.put(new JSONObject().put("id",e.getString("id")).put("at",e.optLong("at")).put("files",e.optJSONArray("files")));return out;}
    void restore(String id)throws Exception {for(JSONObject e:entries)if(e.getString("id").equals(id)&&e.optBoolean("archived")){e.put("archived",false);save(e);return;}throw new IOException("INCOMING_OPERATION_FAILED");}
    void discardArchived(String id)throws Exception {for(JSONObject e:new ArrayList<>(entries))if(e.getString("id").equals(id)&&e.optBoolean("archived")){remove(e);return;}throw new IOException("INCOMING_OPERATION_FAILED");}
    private void remove(JSONObject e)throws Exception {
        Path d=dir(e.getString("id"));
        if(Files.isDirectory(d,LinkOption.NOFOLLOW_LINKS))try(DirectoryStream<Path> s=Files.newDirectoryStream(d)){for(Path f:s)Files.delete(f);}
        Files.deleteIfExists(d);entries.remove(e);
    }
    private void rewind()throws IOException {if(input!=null)input.close();input=null;reading=null;offset=0;done=false;}
}
