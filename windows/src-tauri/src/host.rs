//! Die Hülle: hält die Engine, beantwortet ihre Rückfragen mit Fenstern des Systems (Passwort, Ordner, Speichern)
//! und reicht Aufrufe der Seite weiter. Nur Verträge aus bridge/contracts.json kommen von der Seite an.
use crate::{engine::Engine,win};
use base64::{Engine as _,engine::general_purpose::STANDARD as B64};
use serde_json::{Value,json};
use std::{path::PathBuf,sync::{Arc,Mutex,mpsc,atomic::{AtomicBool,AtomicU64,Ordering}},time::Duration};
use tauri::{Manager,WebviewUrl,WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

#[cfg(feature="messprobe")]
pub const BROWSER_ARGS:&str="--disable-features=msWebOOUI,msPdfOOUI --remote-debugging-port=9223 --remote-debugging-address=127.0.0.1";
#[cfg(not(feature="messprobe"))]
pub const BROWSER_ARGS:&str="--disable-features=msWebOOUI,msPdfOOUI";

/// Andere Pro-Apps für „In ‹App› öffnen“: feste Liste (Kennung im Tresor-Paket → Programm im Benutzerordner).
/// Übergeben wird nichts; die andere App öffnet ihren eigenen Bestand.
const PRO_APPS:&[(&str,&str,&str)]=&[
    ("private-brain","Private Brain Pro","private-brain-pro.exe"),
    ("workflow-pdf-pro","Workflow PDF Pro","workflow-pdf-pro.exe"),
];

pub struct Host {
    pub app:tauri::AppHandle,pub data:PathBuf,pub engine:Mutex<Option<Arc<Engine>>>,
    pub dialog:Mutex<Option<mpsc::Sender<Value>>>,pub dialog_config:Mutex<Value>,
    pub language:Mutex<String>,pub session:String,
    pub closing:AtomicBool,pub close_asked:AtomicU64,
}
impl Host {
    pub fn new(app:tauri::AppHandle)->Result<Arc<Self>,String>{
        let data=app.path().app_local_data_dir().map_err(|_|"STORAGE_UNAVAILABLE")?.join("engine");
        win::no_links(&data)?;std::fs::create_dir_all(&data).map_err(|_|"STORAGE_UNAVAILABLE")?;
        let mut token=[0u8;32];getrandom::fill(&mut token).map_err(|_|"APP_RUNTIME_UNAVAILABLE")?;
        Ok(Arc::new(Self{app,data,engine:Mutex::new(None),dialog:Mutex::new(None),dialog_config:Mutex::new(Value::Null),
            language:Mutex::new("de".into()),session:B64.encode(token),closing:AtomicBool::new(false),close_asked:AtomicU64::new(0)}))
    }
    pub fn start(self:&Arc<Self>)->Result<(),String>{
        let runtime=self.app.path().resource_dir().map_err(|_|"APP_RUNTIME_UNAVAILABLE")?.join("runtime");
        let engine=Engine::start(&runtime,&self.data,self)?;*self.engine.lock().unwrap()=Some(engine.clone());
        if let Err(error)=engine.call("DesktopInternal","info",json!({})){engine.stop();return Err(error);}Ok(())
    }
    pub fn authorized(&self,request:&tauri::ipc::Request<'_>)->bool {
        let value=request.headers().get("x-blp-session").and_then(|v|v.to_str().ok()).unwrap_or("");
        if value.len()!=self.session.len(){return false;}
        let difference=value.bytes().zip(self.session.bytes()).fold(0u8,|d,(a,b)|d|(a^b));
        difference==0&&request.headers().get("origin").is_none_or(|origin|origin.as_bytes()==b"https://tauri.localhost")
    }
    /// Aufruf aus der Seite (schon gegen contracts.json geprüft).
    pub fn call(&self,plugin:&str,method:&str,mut options:Value)->Result<Value,String>{
        if let Some(lang)=options.get("_language").and_then(Value::as_str){if ["de","en"].contains(&lang){*self.language.lock().unwrap()=lang.into();}}
        if let Some(map)=options.as_object_mut(){map.remove("_language");}
        if plugin=="BlpSpeech"{return self.speech(method,&options);}
        // Scanner über Windows-WIA: gemeinsamer Baustein (windows/scanner/scanner.rs, Quelle Workflow PDF Pro).
        if plugin=="ProScanner"{return crate::scanner::call(method,&options,&self.data.join("scanner-arbeit"));}
        if plugin=="BlpFenster"&&method=="schliessen"{
            self.closing.store(true,Ordering::SeqCst);
            let app=self.app.clone();let _=self.app.run_on_main_thread(move||{if let Some(w)=app.get_webview_window("main"){let _=w.close();}});
            return Ok(json!({}));
        }
        let limit=if plugin=="BlpFiles"&&["save","share"].contains(&method){140*1024*1024}else{2*1024*1024};
        if serde_json::to_vec(&options).map_err(|_|"INVALID_INPUT")?.len()>limit{return Err("INVALID_INPUT".into());}
        let engine=self.engine.lock().unwrap().clone().ok_or("APP_RUNTIME_UNAVAILABLE".to_owned())?;
        engine.call(plugin,method,options)
    }
    /// Windows-Spracherkennung (SAPI, lokal, ohne Netz) — derselbe Vertrag wie Androids Sprachfenster (BlpSpeechPlugin).
    fn speech(&self,method:&str,options:&Value)->Result<Value,String>{
        match method {
            "verfuegbar"=>Ok(json!({"verfuegbar":crate::speech::inputs().map(|i|!i.is_empty()).unwrap_or(false)})),
            "zuhoeren"=>{
                let language=match options.get("sprache").and_then(Value::as_str).unwrap_or("de-DE"){"en"|"en-US"|"en-GB"=>"en-US","ru"|"ru-RU"=>"ru-RU","pl"|"pl-PL"=>"pl-PL",_=>"de-DE"}.to_owned();
                let cancelled=Arc::new(AtomicBool::new(false));let stop=cancelled.clone();
                let worker=Box::new(move|sender:mpsc::Sender<Value>|{
                    let result=match crate::speech::recognize(&language,"","",stop){Ok(Some(text))=>json!({"text":text}),Ok(None)=>json!({"text":"","abgebrochen":true}),Err(code)=>json!({"speechError":code})};
                    let _=sender.send(result);
                });
                let result=self.show_dialog("speech",json!({}),Some(worker));cancelled.store(true,Ordering::SeqCst);
                let value=result?;
                if value.get("cancelled").and_then(Value::as_bool)==Some(true){return Ok(json!({"text":"","abgebrochen":true}));}
                if let Some(code)=value.get("speechError").and_then(Value::as_str){return Err(if code.starts_with("SPEECH_"){"SPRACHE_FEHLT".into()}else{code.into()});}
                Ok(value)
            }
            _=>Err("NOT_ALLOWED".into()),
        }
    }
    /// Rückfragen der Engine. Nie von der Seite erreichbar.
    pub fn private_call(&self,method:&str,o:Value)->Result<Value,String>{
        let text=|key:&str|o.get(key).and_then(Value::as_str).unwrap_or("").to_owned();
        match method {
            "protect"|"unprotect"=>{
                let mut bytes=zeroize::Zeroizing::new(B64.decode(text("data")).map_err(|_|"INVALID_INPUT")?);
                if bytes.len()>1024*1024||text("binding").len()>512{return Err("INVALID_INPUT".into());}
                let result=zeroize::Zeroizing::new(win::protect(&bytes,&text("binding"),method=="unprotect")?);
                bytes.clear();Ok(json!({"data":B64.encode(&*result)}))
            }
            "password"=>{
                let mode=text("mode");if !["create","unlock","change","restore"].contains(&mode.as_str()){return Err("INVALID_INPUT".into());}
                self.show_dialog("password",json!({"mode":mode,"titel":text("titel"),"text":text("text"),"zweimal":o.get("zweimal").and_then(Value::as_bool).unwrap_or(false)}),None)
            }
            "folder"=>{
                #[cfg(feature="messprobe")]
                if let Ok(folder)=std::env::var("BLP_WINDOWS_TEST_FOLDER"){
                    let path=PathBuf::from(folder);win::no_links(&path)?;
                    return Ok(json!({"path":path.to_str().ok_or("TRESOR_NICHT_VERFUEGBAR")?}));
                }
                match self.app.dialog().file().blocking_pick_folder(){
                    None=>Ok(json!({"cancelled":true})),
                    Some(file)=>{let path=file.into_path().map_err(|_|"TRESOR_NICHT_VERFUEGBAR")?;win::no_links(&path)?;Ok(json!({"path":path.to_str().ok_or("TRESOR_NICHT_VERFUEGBAR")?}))}
                }
            }
            "saveLocation"=>{
                let name=text("name");if name.is_empty()||name.len()>512||name.contains(['/','\\',':']){return Err("INVALID_INPUT".into());}
                #[cfg(feature="messprobe")]
                if let Ok(folder)=std::env::var("BLP_WINDOWS_TEST_SAVE_FOLDER"){
                    let path=PathBuf::from(folder).join(&name);win::no_links(&path)?;
                    return Ok(json!({"path":path.to_str().ok_or("SAVE_FAILED")?}));
                }
                match self.app.dialog().file().set_file_name(&name).blocking_save_file(){
                    None=>Ok(json!({"cancelled":true})),
                    Some(file)=>{let path=file.into_path().map_err(|_|"SAVE_FAILED")?;win::no_links(&path)?;Ok(json!({"path":path.to_str().ok_or("SAVE_FAILED")?}))}
                }
            }
            "showFolder"=>{
                let path=PathBuf::from(text("path"));win::no_links(&path)?;
                if !path.is_absolute()||!path.is_dir(){return Err("TRESOR_NICHT_VERFUEGBAR".into());}
                #[cfg(feature="messprobe")]
                if std::env::var("BLP_WINDOWS_TEST_FOLDER").is_ok(){let _=std::fs::write(self.data.join("probe-ordner.txt"),path.to_string_lossy().as_bytes());return Ok(json!({}));}
                win::open(path.to_str().ok_or("TRESOR_NICHT_VERFUEGBAR")?).map_err(|_|"KEIN_DATEIEN_PROGRAMM".to_string())?;Ok(json!({}))
            }
            "startApp"=>{
                let wanted=text("app");
                let Some((_,folder,exe))=PRO_APPS.iter().find(|(id,_,_)|*id==wanted) else {return Err("APP_UNBEKANNT".into())};
                let base=std::env::var("LOCALAPPDATA").map_err(|_|"APP_FEHLT")?;
                let path=PathBuf::from(base).join(folder).join(exe);
                if !path.is_file()||win::no_links(&path).is_err(){return Err("APP_FEHLT".into());}
                win::open(path.to_str().ok_or("APP_FEHLT")?).map_err(|_|"APP_FEHLT".to_string())?;Ok(json!({}))
            }
            "installer"=>{
                // Nur das geprüfte Setup aus dem eigenen Update-Ordner (SHA-256 und Unterschrift prüft die Engine).
                let path=PathBuf::from(text("path"));let ordner=self.data.join("cache").join("update");
                let name=path.file_name().and_then(|n|n.to_str()).unwrap_or("");
                if !path.starts_with(&ordner)||!name.starts_with("BookLedgerPro-Windows-")||!name.ends_with("-x64-setup.exe")||!path.is_file(){return Err("NOT_ALLOWED".into());}
                win::no_links(&path)?;
                #[cfg(feature="messprobe")]
                if std::env::var("BLP_WINDOWS_TEST_FOLDER").is_ok(){let _=std::fs::write(self.data.join("probe-installer.txt"),name.as_bytes());return Ok(json!({}));}
                win::open(path.to_str().ok_or("NOT_ALLOWED")?).map_err(|_|"UPDATE_START_FEHLER".to_string())?;
                // Die App geht zu, damit das Setup sie ersetzen kann.
                self.closing.store(true,Ordering::SeqCst);let app=self.app.clone();
                std::thread::spawn(move||{std::thread::sleep(Duration::from_millis(1500));app.exit(0);});
                Ok(json!({}))
            }
            _=>Err("NOT_ALLOWED".into()),
        }
    }
    fn show_dialog(&self,kind:&str,mut config:Value,work:Option<Box<dyn FnOnce(mpsc::Sender<Value>)+Send>>)->Result<Value,String>{
        let (send,receive)=mpsc::channel();
        {let mut current=self.dialog.lock().unwrap();if current.is_some(){return Err("DIALOG_OFFEN".into());}*current=Some(send.clone());}
        config["kind"]=json!(kind);config["language"]=json!(*self.language.lock().unwrap());*self.dialog_config.lock().unwrap()=config;
        let worker_send=send.clone();let app=self.app.clone();
        let initialization=format!("Object.defineProperty(window,'__BLP_DIALOG_SESSION',{{value:{},configurable:true}});",serde_json::to_string(&self.session).unwrap());
        self.app.run_on_main_thread(move||{
            let builder=WebviewWindowBuilder::new(&app,"native-dialog",WebviewUrl::App("windows/dialog/index.html".into()))
                .title("BookLedgerPro").inner_size(460.,460.).min_inner_size(360.,320.).resizable(true).always_on_top(true)
                .use_https_scheme(true).devtools(cfg!(feature="messprobe"))
                .additional_browser_args(BROWSER_ARGS)
                .initialization_script(initialization)
                .on_navigation(|url|url.scheme()=="https"&&url.host_str()==Some("tauri.localhost")&&url.path()=="/windows/dialog/index.html")
                .on_new_window(|_,_|tauri::webview::NewWindowResponse::Deny);
            if builder.build().is_err(){let _=send.send(json!({"cancelled":true}));}
            else if let Some(work)=work{std::thread::spawn(move||work(worker_send));}
        }).map_err(|_|"DIALOG_FEHLER")?;
        let result=receive.recv_timeout(Duration::from_secs(600)).map_err(|_|"DIALOG_ABGELAUFEN".to_owned());
        let app=self.app.clone();let _=self.app.run_on_main_thread(move||{if let Some(window)=app.get_webview_window("native-dialog"){let _=window.close();}});
        *self.dialog.lock().unwrap()=None;*self.dialog_config.lock().unwrap()=Value::Null;result
    }
    pub fn event(&self,name:&str,data:Value){
        let app=self.app.clone();let detail=json!({"name":name,"data":data});
        let _=self.app.run_on_main_thread(move||{if let Some(window)=app.get_webview_window("main"){
            let _=window.eval(format!("window.dispatchEvent(new CustomEvent('blp-native',{{detail:{}}}));",detail));
        }});
    }
    pub fn shutdown(&self){if let Some(engine)=self.engine.lock().unwrap().as_ref(){engine.stop();}}
    /// „Öffnen mit“ und Dateien auf dem Programmsymbol: Pfade aus dem (zweiten) Programmstart an den Eingang.
    pub fn receive(&self,arguments:Vec<String>,cwd:Option<String>){
        let paths:Vec<Value>=arguments.into_iter().skip(1).filter(|arg|!arg.starts_with('-')).filter_map(|arg|{
            let path=PathBuf::from(arg);let path=if path.is_absolute(){path}else{PathBuf::from(cwd.as_deref().unwrap_or(".")).join(path)};
            if path.is_file()&&win::no_links(&path).is_ok(){path.to_str().map(|s|json!(s))}else{None}
        }).collect();
        if paths.is_empty(){return;}
        let engine=self.engine.lock().unwrap().clone();if let Some(engine)=engine{let _=engine.call("DesktopInternal","receive",json!({"paths":paths}));}
    }
}
