//! Windows-Adapter der Hülle. Auf anderen Systemen (Prüflauf unter Linux) melden sie „nicht verfügbar“.
use std::path::Path;

#[cfg(windows)]
pub fn startup_error(){
    use windows::{core::HSTRING,Win32::UI::WindowsAndMessaging::{MessageBoxW,MB_OK,MB_ICONERROR}};
    unsafe{MessageBoxW(None,&HSTRING::from("BookLedgerPro konnte nicht starten. Deine Daten wurden nicht zurückgesetzt. Bitte Installation und freien Speicher prüfen.\n\nBookLedgerPro could not start. Your data was not reset.\n\nAPP_START_FAILED"),&HSTRING::from("BookLedgerPro"),MB_OK|MB_ICONERROR);}
}
#[cfg(not(windows))]
pub fn startup_error(){}

/// Kein Verweis (Symlink, Junction) auf dem ganzen Weg.
pub fn no_links(path:&Path)->Result<(),String> {
    let mut current=std::path::PathBuf::new();
    for part in path.components() {
        current.push(part);
        match std::fs::symlink_metadata(&current) {
            Ok(meta)=>{
                if meta.file_type().is_symlink() {return Err("ORDNER_VERWEIS".into());}
                #[cfg(windows)] {use std::os::windows::fs::MetadataExt;if meta.file_attributes()&0x400!=0{return Err("ORDNER_VERWEIS".into());}}
            }
            Err(error) if error.kind()==std::io::ErrorKind::NotFound=>{},
            Err(_)=>return Err("ORDNER_VERWEIS".into()),
        }
    } Ok(())
}

/// DPAPI des angemeldeten Windows-Benutzers; die Bindung geht als zusätzliche Entropie ein.
#[cfg(windows)]
pub fn protect(data:&[u8],binding:&str,decrypt:bool)->Result<Vec<u8>,String>{
    use windows::{core::PCWSTR,Win32::{Foundation::{HLOCAL,LocalFree},Security::Cryptography::{CryptProtectData,CryptUnprotectData,CRYPTPROTECT_UI_FORBIDDEN,CRYPT_INTEGER_BLOB}}};
    let entropy=format!("bookledgerpro-windows|{}",binding).into_bytes();
    let blob=|bytes:&[u8]|CRYPT_INTEGER_BLOB{cbData:bytes.len() as u32,pbData:bytes.as_ptr() as *mut u8};
    let (input,extra)=(blob(data),blob(&entropy));let mut output=CRYPT_INTEGER_BLOB::default();
    unsafe{
        let result=if decrypt {CryptUnprotectData(&input,None,Some(&extra),None,None,CRYPTPROTECT_UI_FORBIDDEN,&mut output)}
            else {CryptProtectData(&input,PCWSTR::null(),Some(&extra),None,None,CRYPTPROTECT_UI_FORBIDDEN,&mut output)};
        result.map_err(|_|"TRESOR_NICHT_VERFUEGBAR")?;
        let bytes=if output.cbData==0{Vec::new()}else{std::slice::from_raw_parts(output.pbData,output.cbData as usize).to_vec()};
        std::ptr::write_bytes(output.pbData,0,output.cbData as usize);let _=LocalFree(Some(HLOCAL(output.pbData as *mut core::ffi::c_void)));Ok(bytes)
    }
}
#[cfg(not(windows))]
pub fn protect(_:&[u8],_:&str,_:bool)->Result<Vec<u8>,String>{Err("TRESOR_NICHT_VERFUEGBAR".into())}

/// Öffnet Adresse, Ordner oder Programm mit dem, was Windows dafür vorsieht (Browser, Explorer, das Programm selbst).
#[cfg(windows)]
pub fn open(target:&str)->Result<(),String>{
    use windows::{core::{HSTRING,PCWSTR},Win32::UI::{Shell::ShellExecuteW,WindowsAndMessaging::SW_SHOWNORMAL}};
    let result=unsafe{ShellExecuteW(None,&HSTRING::from("open"),&HSTRING::from(target),PCWSTR::null(),PCWSTR::null(),SW_SHOWNORMAL)};
    if result.0 as isize>32{Ok(())}else{Err("FILE_UNAVAILABLE".into())}
}
#[cfg(not(windows))]
pub fn open(_:&str)->Result<(),String>{Err("FILE_UNAVAILABLE".into())}

/// Schließen oder Absturz der App beendet auch die Java-Engine.
pub struct Job(usize);
#[cfg(windows)]
impl Job {
    pub fn attach(child:&std::process::Child)->Result<Self,String>{
        use std::os::windows::io::AsRawHandle;
        use windows::{core::PCWSTR,Win32::{Foundation::{HANDLE,CloseHandle},System::JobObjects::*}};
        unsafe{
            let handle=CreateJobObjectW(None,PCWSTR::null()).map_err(|_|"APP_RUNTIME_UNAVAILABLE")?;
            let mut information=JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();information.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let result=SetInformationJobObject(handle,JobObjectExtendedLimitInformation,&information as *const _ as *const core::ffi::c_void,std::mem::size_of_val(&information) as u32)
                .and_then(|_|AssignProcessToJobObject(handle,HANDLE(child.as_raw_handle())));
            if result.is_err(){let _=CloseHandle(handle);return Err("APP_RUNTIME_UNAVAILABLE".into());}
            Ok(Self(handle.0 as usize))
        }
    }
}
#[cfg(windows)]
impl Drop for Job {fn drop(&mut self){unsafe{let _=windows::Win32::Foundation::CloseHandle(windows::Win32::Foundation::HANDLE(self.0 as *mut core::ffi::c_void));}}}
#[cfg(not(windows))]
impl Job {pub fn attach(_:&std::process::Child)->Result<Self,String>{Ok(Self(0))}}
