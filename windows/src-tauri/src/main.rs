#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//! BookLedgerPro für Windows: Tauri 2 / WebView2 mit derselben Oberfläche wie die Android-App (Vorbild Private Brain Pro).
mod engine;
mod host;
mod win;
mod speech;
use host::Host;
use serde_json::{Value,json};
use std::sync::{Arc,atomic::Ordering};
use tauri::{Manager,WebviewWindow,WebviewUrl,WebviewWindowBuilder};

fn eigene_seite(url:&tauri::Url)->bool{url.scheme()=="https"&&url.host_str()==Some("tauri.localhost")}

#[tauri::command]
async fn blp_call(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,request:tauri::ipc::Request<'_>,plugin:String,method:String,options:Value)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if !host.authorized(&request)||window.label()!="main"||!eigene_seite(&url)||!["/","/index.html"].contains(&url.path()){return Err("NOT_ALLOWED".into());}
    let allowed:Value=serde_json::from_str(include_str!("../../bridge/contracts.json")).map_err(|_|"APP_CONFIGURATION_INVALID")?;
    if !allowed.get(&plugin).and_then(Value::as_array).is_some_and(|methods|methods.iter().any(|m|m.as_str()==Some(&method))){return Err("NOT_ALLOWED".into());}
    let host=host.inner().clone();tauri::async_runtime::spawn_blocking(move||host.call(&plugin,&method,options)).await.map_err(|_|"APP_RUNTIME_UNAVAILABLE".to_string())?
}
#[tauri::command]
fn blp_dialog(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,request:tauri::ipc::Request<'_>,action:String,fields:Option<Value>)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if !host.authorized(&request)||window.label()!="native-dialog"||!eigene_seite(&url)||url.path()!="/windows/dialog/index.html"{return Err("NOT_ALLOWED".into());}
    if action=="config"{return Ok(host.dialog_config.lock().unwrap().clone());}
    let value=match action.as_str(){"cancel"=>json!({"cancelled":true}),"submit"=>fields.unwrap_or(Value::Null),_=>return Err("NOT_ALLOWED".into())};
    if serde_json::to_vec(&value).map_err(|_|"INVALID_INPUT")?.len()>16384{return Err("INVALID_INPUT".into());}
    host.dialog.lock().unwrap().as_ref().ok_or("DIALOG_FEHLER")?.send(value).map_err(|_|"DIALOG_FEHLER")?;Ok(json!({"ok":true}))
}
fn main(){
    let result=tauri::Builder::default().plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app,arguments,cwd|{
            if let Some(window)=app.get_webview_window("main"){let _=window.unminimize();let _=window.set_focus();}
            if let Some(host)=app.try_state::<Arc<Host>>(){let host=host.inner().clone();std::thread::spawn(move||host.receive(arguments,Some(cwd)));}
        }))
        .invoke_handler(tauri::generate_handler![blp_call,blp_dialog])
        .setup(|app|{
            let host=Host::new(app.handle().clone()).map_err(std::io::Error::other)?;host.start().map_err(std::io::Error::other)?;app.manage(host.clone());
            WebviewWindowBuilder::new(app,"main",WebviewUrl::App("index.html".into()))
                .title("BookLedgerPro").inner_size(1280.,860.).min_inner_size(360.,480.).use_https_scheme(true)
                .devtools(cfg!(feature="messprobe")).disable_drag_drop_handler()
                .additional_browser_args(host::BROWSER_ARGS)
                .initialization_script(include_str!("../../bridge/capacitor-tauri.js").replace("__BLP_SESSION_TOKEN__",&serde_json::to_string(&host.session).unwrap()))
                // Eigene Seiten bleiben im Fenster; Adressen nach draußen gehen an den Browser bzw. das Mailprogramm, nie in dieses Fenster.
                .on_navigation(|url|{
                    if eigene_seite(url){return ["/","/index.html","/impressum.html","/datenschutz.html","/sicherheit.html"].contains(&url.path())||url.path().starts_with("/apps/");}
                    if ["https","http","mailto"].contains(&url.scheme())&&url.username().is_empty()&&url.password().is_none(){let _=win::open(url.as_str());}
                    false
                })
                .on_new_window(|url,_|{
                    if ["https","http","mailto"].contains(&url.scheme())&&!eigene_seite(&url)&&url.username().is_empty()&&url.password().is_none(){let _=win::open(url.as_str());}
                    tauri::webview::NewWindowResponse::Deny
                })
                .build()?;
            let arguments=std::env::args().collect();std::thread::spawn(move||host.receive(arguments,None));Ok(())
        })
        .on_window_event(|window,event|{
            let Some(host)=window.app_handle().try_state::<Arc<Host>>() else {return};
            match event {
                // Läuft noch eine Aufgabe (Sicherung, Einordnen, Prüfen), fragt die Seite nach. Zweites Schließen innerhalb
                // von 15 Sekunden schließt immer (falls die Seite nicht antwortet).
                tauri::WindowEvent::CloseRequested{api,..} if window.label()=="main"=>{
                    if host.closing.load(Ordering::SeqCst){return;}
                    let now=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d|d.as_secs()).unwrap_or(0);
                    let before=host.close_asked.swap(now,Ordering::SeqCst);
                    if before!=0&&now.saturating_sub(before)<15{return;}
                    api.prevent_close();
                    if let Some(main)=window.app_handle().get_webview_window("main"){let _=main.eval("window.__blpSchliessen?window.__blpSchliessen():window.dispatchEvent(new CustomEvent('blp-schliessen'))");}
                }
                tauri::WindowEvent::Destroyed=>{
                    if window.label()=="native-dialog"{if let Some(sender)=host.dialog.lock().unwrap().as_ref(){let _=sender.send(json!({"cancelled":true}));}}
                    if window.label()=="main"{host.shutdown();window.app_handle().exit(0);}
                }
                _=>{}
            }
        }).run(tauri::generate_context!());
    if result.is_err(){win::startup_error();std::process::exit(1);}
}
