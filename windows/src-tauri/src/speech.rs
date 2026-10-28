//! Local Windows SAPI dictation; no audio or text goes to a network service.
//! Klaus 2026-10-27: the app can be bound to one named microphone instead of
//! whatever Windows currently treats as its default recording device.
use std::sync::{Arc,atomic::{AtomicBool,Ordering}};

/// One recording device as SAPI lists it. `id` is SAPI's token id, `name` the
/// device name Windows reports (shortened by Windows to about 31 characters).
#[derive(Clone,Debug,PartialEq)]
pub struct Input{pub id:String,pub name:String,pub default:bool}

/// Picks the chosen device: first by its exact id, then by a unique name (an
/// unplugged and replugged USB/Bluetooth device can return with a new id).
/// None means the chosen microphone is not connected; never fall back silently.
pub fn pick<'a>(inputs:&'a [Input],id:&str,name:&str)->Option<&'a Input>{
    if let Some(found)=inputs.iter().find(|input|!id.is_empty()&&input.id==id){return Some(found);}
    let mut same=inputs.iter().filter(|input|!name.is_empty()&&input.name==name);
    match (same.next(),same.next()){(Some(found),None)=>Some(found),_=>None}
}

#[cfg(windows)]
mod sapi {
    use super::Input;
    use windows::{core::{PCWSTR,PWSTR},Win32::{Media::Speech::*,System::Com::*}};
    pub struct Apartment;
    impl Apartment {pub fn enter()->windows::core::Result<Self>{unsafe{CoInitializeEx(None,COINIT_MULTITHREADED).ok()?;}Ok(Self)}}
    impl Drop for Apartment {fn drop(&mut self){unsafe{CoUninitialize();}}}
    unsafe fn take(text:PWSTR)->String{let value=text.to_string().unwrap_or_default();CoTaskMemFree(Some(text.0 as _));value}
    /// All audio inputs SAPI knows, each with its token kept for SetInput.
    pub unsafe fn inputs()->windows::core::Result<Vec<(Input,ISpObjectToken)>>{
        let category:ISpObjectTokenCategory=CoCreateInstance(&SpObjectTokenCategory,None,CLSCTX_INPROC_SERVER)?;
        category.SetId(SPCAT_AUDIOIN,false)?;
        let default=category.GetDefaultTokenId().map(|id|take(id)).unwrap_or_default();
        let tokens=category.EnumTokens(PCWSTR::null(),PCWSTR::null())?;
        let mut out=Vec::new();
        loop{
            let mut token=None;let mut fetched=0;
            if tokens.Next(1,&mut token,Some(&mut fetched)).is_err()||fetched==0{break;}
            let Some(token)=token else{break};
            let Ok(id)=token.GetId().map(|id|take(id)) else{continue};
            let name=token.GetStringValue(PCWSTR::null()).map(|n|take(n)).unwrap_or_default();
            let name=name.trim().chars().take(200).collect::<String>();
            if id.is_empty()||name.is_empty()||out.iter().any(|(known,_):&(Input,ISpObjectToken)|known.id==id){continue;}
            out.push((Input{default:id.eq_ignore_ascii_case(&default),id,name},token));
            if out.len()>=64{break;}
        }
        Ok(out)
    }
}

#[cfg(windows)]
pub fn inputs()->Result<Vec<Input>,String>{
    let result=(||->windows::core::Result<Vec<Input>>{unsafe{
        let _apartment=sapi::Apartment::enter()?;
        Ok(sapi::inputs()?.into_iter().map(|(input,_)|input).collect())
    }})();
    result.map_err(|_|"SPEECH_UNAVAILABLE".into())
}
#[cfg(not(windows))]
pub fn inputs()->Result<Vec<Input>,String>{Err("SPEECH_UNAVAILABLE".into())}

/// `input_id`/`input_name` empty: Windows' default recording device (as before).
#[cfg(windows)]
pub fn recognize(language:&str,input_id:&str,input_name:&str,cancel:Arc<AtomicBool>)->Result<Option<String>,String>{
    use windows::{core::{HSTRING,PCWSTR,PWSTR,IUnknown,Interface},Win32::{Media::Speech::*,System::Com::*}};
    let language=match language{"de-DE"=>"407","en-US"=>"409","ru-RU"=>"419","pl-PL"=>"415",_=>return Err("INVALID_INPUT".into())};
    let chosen=!input_id.is_empty()||!input_name.is_empty();
    let missing=std::cell::Cell::new(false);
    let result=(||->windows::core::Result<Option<String>>{unsafe{
        let _apartment=sapi::Apartment::enter()?;
        let category:ISpObjectTokenCategory=CoCreateInstance(&SpObjectTokenCategory,None,CLSCTX_INPROC_SERVER)?;
        category.SetId(SPCAT_RECOGNIZERS,false)?;
        let engines=category.EnumTokens(&HSTRING::from(format!("Language={language}")),PCWSTR::null())?;
        let mut token=None;let mut fetched=0;engines.Next(1,&mut token,Some(&mut fetched))?;
        let token=token.ok_or_else(windows::core::Error::from_thread)?;
        let recognizer:ISpRecognizer=CoCreateInstance(&SpInprocRecognizer,None,CLSCTX_INPROC_SERVER)?;
        recognizer.SetRecognizer(&token)?;
        if chosen {
            let all=sapi::inputs()?;
            let listed:Vec<Input>=all.iter().map(|(input,_)|input.clone()).collect();
            let Some(found)=pick(&listed,input_id,input_name) else{missing.set(true);return Err(windows::core::Error::from_thread());};
            let (_,device)=all.iter().find(|(input,_)|input.id==found.id).expect("picked from this list");
            recognizer.SetInput(&device.cast::<IUnknown>()?,true)?;
        }else{
            let input_category:ISpObjectTokenCategory=CoCreateInstance(&SpObjectTokenCategory,None,CLSCTX_INPROC_SERVER)?;
            input_category.SetId(SPCAT_AUDIOIN,false)?;
            let id=input_category.GetDefaultTokenId()?;
            let input:ISpObjectToken=CoCreateInstance(&SpObjectToken,None,CLSCTX_INPROC_SERVER)?;
            let selected=input.SetId(PCWSTR::null(),PCWSTR(id.0),false);CoTaskMemFree(Some(id.0 as _));selected?;
            recognizer.SetInput(&input.cast::<IUnknown>()?,true)?;
        }
        let context=recognizer.CreateRecoContext()?;context.SetNotifyWin32Event()?;
        let interest=(1u64<<SPEI_RECOGNITION.0)|(1u64<<SPEI_RESERVED1.0)|(1u64<<SPEI_RESERVED2.0);
        context.SetInterest(interest,interest)?;
        let grammar=context.CreateGrammar(1)?;grammar.LoadDictation(PCWSTR::null(),SPLO_STATIC)?;
        grammar.SetDictationState(SPRS_ACTIVE)?;recognizer.SetRecoState(SPRST_ACTIVE)?;
        let deadline=std::time::Instant::now()+std::time::Duration::from_secs(60);
        while !cancel.load(Ordering::SeqCst)&&std::time::Instant::now()<deadline {
            let mut event=SPEVENT::default();let mut count=0;context.GetEvents(1,&mut event,&mut count)?;
            if count>0 {
                let event_id=(event._bitfield as u32&0xffff) as i32;
                let kind=((event._bitfield as u32>>16)&0xffff) as i32;
                if event.lParam.0!=0&&(kind==SPET_LPARAM_IS_OBJECT.0||kind==SPET_LPARAM_IS_TOKEN.0){
                    // Each queued event owns one COM reference; consume it exactly once.
                    let object=IUnknown::from_raw(event.lParam.0 as *mut _);
                    if event_id==SPEI_RECOGNITION.0 {
                        let result:ISpRecoResult=object.cast()?;let mut text=PWSTR::null();result.GetText(0,u32::MAX,true,&mut text,None)?;
                        let value=text.to_string();CoTaskMemFree(Some(text.0 as _));
                        let value=value?.chars().take(2000).collect::<String>();
                        grammar.SetDictationState(SPRS_INACTIVE)?;return Ok(Some(value));
                    }
                }else if event.lParam.0!=0&&(kind==SPET_LPARAM_IS_POINTER.0||kind==SPET_LPARAM_IS_STRING.0){CoTaskMemFree(Some(event.lParam.0 as _));}
            }else{std::thread::sleep(std::time::Duration::from_millis(100));}
        }
        grammar.SetDictationState(SPRS_INACTIVE)?;Ok(None)
    }})();
    result.map_err(|_|if missing.get(){"MICROPHONE_MISSING".into()}else{"SPEECH_UNAVAILABLE".into()})
}
#[cfg(not(windows))]
pub fn recognize(_:&str,_:&str,_:&str,_:Arc<AtomicBool>)->Result<Option<String>,String>{Err("SPEECH_UNAVAILABLE".into())}

#[cfg(test)]
mod tests {
    use super::*;
    fn list()->Vec<Input>{vec![
        Input{id:"A".into(),name:"Mikrofon (Realtek(R) Audio)".into(),default:true},
        Input{id:"B".into(),name:"Headset (Bluetooth)".into(),default:false},
        Input{id:"C".into(),name:"Mikrofon (USB Audio)".into(),default:false},
        Input{id:"D".into(),name:"Mikrofon (USB Audio)".into(),default:false},
    ]}
    #[test] fn exact_id_wins(){assert_eq!(pick(&list(),"B","egal").map(|i|i.id.as_str()),Some("B"));}
    #[test] fn unique_name_after_replug(){assert_eq!(pick(&list(),"X","Headset (Bluetooth)").map(|i|i.id.as_str()),Some("B"));}
    #[test] fn ambiguous_name_is_missing(){assert_eq!(pick(&list(),"X","Mikrofon (USB Audio)"),None);}
    #[test] fn unplugged_is_missing_never_default(){assert_eq!(pick(&list(),"X","Weg"),None);}
}
