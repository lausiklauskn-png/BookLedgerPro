// Prüft die mit NSIS installierte Windows-App über die Prüf-Schnittstelle des Prüfbaus (messprobe, Port 9223).
// Phase „erste“: Plattform, Version, Zugriffsschutz, Tresorordner anlegen (eigenes Passwort-Fenster), ablegen, lesen,
// Speichern unter …, „Öffnen mit“. Phase „neustart“: gemerkter Schlüssel (echte DPAPI) öffnet von selbst, Inhalt noch da,
// vergessen + von Hand entsperren. Nur im Prüfbau; der Auslieferungsbau hat keine Prüf-Schnittstelle.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawn} from 'node:child_process';
const phase=process.argv[2]||'erste',out=resolve(process.argv[3]||'windows-bericht.json');
const report={phase,quelle:process.env.BLP_SOURCE_COMMIT||'',gruen:[],fehler:[]};
const version=JSON.parse(await readFile(new URL('../src-tauri/tauri.conf.json',import.meta.url),'utf8')).version;
const ok=(name,value)=>{assert.ok(value,name);report.gruen.push(name);console.log('PASS '+name);};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const PASSWORT='CI-Tresor-ä-Probe-2026';
let browser,page;
async function verbinden(){for(let i=0;i<120;i++){try{browser=await chromium.connectOverCDP('http://127.0.0.1:9223');return;}catch{await pause(500);}}throw Error('Die installierte App hat die Prüf-Schnittstelle nicht geöffnet');}
const seiten=()=>browser.contexts().flatMap(c=>c.pages());
async function dialog(){
  for(let i=0;i<120;i++){const d=seiten().find(p=>p.url().includes('/windows/dialog/index.html'));if(d){await d.locator('#submit').waitFor({state:'visible'});return d;}await pause(250);}
  throw Error('Passwort-Fenster öffnete sich nicht');
}
const call=(plugin,method,args={})=>page.evaluate(async({plugin,method,args})=>{try{return await Capacitor.Plugins[plugin][method](args);}catch(e){return {fehler:e.code||String(e)};}},{plugin,method,args});
async function mitDialog(ausloesen,ausfuellen){
  await page.evaluate(ausloesen);
  const d=await dialog();await ausfuellen(d);
  await page.waitForFunction(()=>window.__probe,null,{timeout:120000});
  return page.evaluate(()=>{const r=window.__probe;window.__probe=null;return r;});
}
try{
  await verbinden();
  for(let i=0;i<120&&!page;i++){page=seiten().find(p=>/^https:\/\/tauri\.localhost\/(index\.html)?$/.test(p.url()));if(!page)await pause(250);}
  assert.ok(page,'Hauptfenster gefunden');
  page.on('pageerror',e=>report.fehler.push(String(e.stack||e.message).slice(0,800)));
  await page.waitForFunction(()=>window.BLPNative&&window.Capacitor,null,{timeout:90000});
  ok('Hülle meldet Windows',await page.evaluate(()=>BLPNative.plattform==='windows'&&document.documentElement.dataset.nativ==='windows'));
  ok('Version aus der App = tauri.conf.json',(await page.evaluate(()=>BLPNative.version()))===version);
  ok('Aufruf ohne Sitzungsschlüssel wird verweigert',await page.evaluate(async()=>{try{await __TAURI_INTERNALS__.invoke('blp_call',{plugin:'BlpFiles',method:'appInfo',options:{}});return false;}catch(e){return String(e).includes('NOT_ALLOWED');}}));
  ok('Methode außerhalb der Verträge wird verweigert',(await call('BlpTresor','loeschen')).fehler==='NOT_ALLOWED');
  ok('Tresorordner-Brücke vorhanden',await page.evaluate(()=>!!BLPNative.tresor&&typeof BLPNative.tresor.ablegen==='function'));
  ok('Spracherkennung antwortet (ob ein Mikrofon da ist, hängt vom Rechner ab)',typeof (await call('BlpSpeech','verfuegbar')).verfuegbar==='boolean');
  ok('Schließen-Frage ist eingehängt',await page.evaluate(()=>typeof window.__blpSchliessen==='function'));
  if(phase==='erste'){
    let z=await call('BlpTresor','zustand');ok('ohne Ordner: nichts gewählt',z.gewaehlt===false);
    z=await call('BlpTresor','ordnerWaehlen');ok('Ordner gewählt (Prüfordner) mit ganzem Pfad',z.gewaehlt===true&&z.pfad===process.env.BLP_WINDOWS_TEST_FOLDER);
    const angelegt=await mitDialog(()=>{window.__probe=null;BLPNative.tresor.anlegen(true).then(v=>window.__probe=v,e=>window.__probe={fehler:e.code});},async d=>{
      ok('Passwort-Fenster fragt zweimal und mit Hinweis',await d.locator('#repeat').isVisible()&&await d.locator('#notice').isVisible());
      await d.locator('#password').fill(PASSWORT);await d.locator('#repeat').fill(PASSWORT);await d.locator('#notice').check();await d.locator('#submit').click();
    });
    ok('Tresorordner angelegt, offen, gemerkt',angelegt.vorhanden&&angelegt.offen&&angelegt.gemerkt);
    const kopf=await readFile(resolve(process.env.BLP_WINDOWS_TEST_FOLDER,'tresorordner.json'),'utf8');
    ok('Kopf liegt im Ordner und enthält kein Passwort',kopf.includes('familyprojekt-tresorordner')&&!kopf.includes(PASSWORT));
    const e=await page.evaluate(async()=>{const b=new Blob([new Uint8Array(500000).map((_,i)=>i%251)],{type:'application/pdf'});return BLPNative.tresor.ablegen('bookledgerpro','Belege',b,'Windows-Probe.pdf','Probe',Date.now());});
    ok('Datei in Stücken ins eigene Fach gelegt',e&&e.groesse===500000);
    const gleich=await page.evaluate(async(id)=>{const f=await BLPNative.tresor.lesen('bookledgerpro',id);const u=new Uint8Array(await f.arrayBuffer());return u.length===500000&&u.every((v,i)=>v===i%251);},e.id);
    ok('zurückgelesen Byte für Byte gleich',gleich);
    ok('fremdes Fach bleibt gesperrt',(await call('BlpTresor','ablegenBeginnen',{fach:'private-brain',name:'x',datum:1})).fehler==='TRESOR_FACH_FREMD');
    await page.evaluate(()=>{const u=URL.createObjectURL(new Blob(['{"probe":1}'],{type:'application/json'}));return BLPNative.speichern(u,'BLP-Probe.json');});
    ok('Speichern unter … schreibt die Datei',(await readFile(resolve(process.env.BLP_WINDOWS_TEST_SAVE_FOLDER,'BLP-Probe.json'),'utf8'))==='{"probe":1}');
    const beleg=resolve(process.env.RUNNER_TEMP||'.','Beleg-Öffnen-mit.pdf');await writeFile(beleg,'%PDF-1.4\n%Probe\n');
    const zweiter=spawn(process.env.BLP_WINDOWS_TEST_EXE,[beleg],{windowsHide:true,stdio:'ignore'});
    assert.equal(await new Promise((r,j)=>{zweiter.once('error',j);zweiter.once('exit',r);}),0);
    let angekommen=false;
    for(let i=0;i<80&&!angekommen;i++){
      const p=await call('BlpIncoming','pending'),h=await call('BlpIncoming','history');
      angekommen=[...(p.files||[]),...((h.receipts||[]).flatMap(r=>r.files||[]))].some(f=>f.name==='Beleg-Öffnen-mit.pdf');
      if(!angekommen)await pause(250);
    }
    ok('„Öffnen mit“ (zweiter Programmstart) liefert die Datei an die laufende App',angekommen);
    ok('„In Dateien öffnen“ zeigt den Tresorordner',!(await call('BlpTresor','ordnerOeffnen',{welcher:'tresor'})).fehler);
    ok('andere Pro-App fehlt hier → klare Meldung',(await call('BlpTresor','appOeffnen',{app:'workflow-pdf-pro'})).fehler==='APP_FEHLT');
  }else{
    let z=await call('BlpTresor','zustand');
    ok('nach Neustart öffnet der gemerkte Schlüssel (DPAPI dieses Benutzers)',z.offen===true);
    const v=await call('BlpTresor','verzeichnis',{fach:'bookledgerpro'});
    ok('Inhalt aus dem ersten Start ist da',(v.eintraege||[]).some(e=>e.name==='Windows-Probe.pdf'));
    z=await call('BlpTresor','sperren',{vergessen:true});ok('sperren und vergessen',z.offen===false&&z.gemerkt===false);
    const falsch=await mitDialog(()=>{window.__probe=null;BLPNative.tresor.entsperren(false).then(v=>window.__probe=v,e=>window.__probe={fehler:e.code||'x'});},async d=>{
      ok('Entsperren fragt nur einmal',!await d.locator('#repeat').isVisible());
      await d.locator('#password').fill('falsches-Passwort-123');await d.locator('#submit').click();
    });
    ok('falsches Passwort öffnet nicht',!!falsch.fehler);
    const richtig=await mitDialog(()=>{window.__probe=null;BLPNative.tresor.entsperren(false).then(v=>window.__probe=v,e=>window.__probe={fehler:e.code||'x'});},async d=>{
      await d.locator('#password').fill(PASSWORT);await d.locator('#submit').click();
    });
    ok('richtiges Passwort öffnet',richtig.offen===true);
    const abbruch=await mitDialog(()=>{window.__probe=null;BLPNative.tresor.passwortAendern().then(v=>window.__probe=v,e=>window.__probe={fehler:e.code||'x'});},async d=>{await d.locator('#cancel').click();});
    ok('Abbrechen im Passwort-Fenster ändert nichts',abbruch.abgebrochen===true);
  }
  ok('keine Skriptfehler in der Seite',report.fehler.length===0);
}catch(error){report.fehler.push(String(error.stack||error.message));process.exitCode=1;console.error(error);}
finally{
  await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close().catch(()=>{});
}
