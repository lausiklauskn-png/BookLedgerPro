// Echter Kindprozess über stdio, mit Rückfragen an eine gestellte Hülle (protect/unprotect, folder, password).
// node windows/engine/protocol-test.mjs [java] [runtime]  — mit runtime: die tatsächlich gebündelte Laufzeit.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {tmpdir} from 'node:os';
import {join,resolve,delimiter} from 'node:path';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),test=await mkdtemp(join(tmpdir(),'blp-protokoll-'));
const java=process.argv[2]||'java',runtime=process.argv[3];
const classes=runtime?join(runtime,'engine/classes'):join(root,'windows/engine/build/classes'),lib=runtime?join(runtime,'engine/lib/*'):join(root,'windows/engine/build/lib/*');
const vault=join(test,'Tresor');await mkdir(vault);
const child=spawn(java,['-Dfile.encoding=UTF-8','-Dsun.jnu.encoding=UTF-8','-cp',[classes,lib].join(delimiter),'de.familyprojekt.bookledgerpro.EngineMain',join(test,'daten')],{stdio:['pipe','pipe','pipe'],windowsHide:true});
const exited=new Promise(r=>child.once('exit',r));
const pending=new Map(),key=randomBytes(32),events=[],hostCalls=[];let next=0;
const send=v=>child.stdin.write(JSON.stringify(v)+'\n');
let diag='';child.stderr.on('data',b=>{diag=(diag+b).slice(-8192);});
createInterface({input:child.stdout}).on('line',line=>{
  const v=JSON.parse(line);
  if(v.host){
    hostCalls.push(v.method);
    if(v.method==='folder'){send({replyTo:v.host,result:{path:vault}});return;}
    if(v.method==='password'){send({replyTo:v.host,result:{password:'Protokoll-Probe-2026',repeat:'Protokoll-Probe-2026'}});return;}
    if(!['protect','unprotect'].includes(v.method)){send({replyTo:v.host,error:'NOT_ALLOWED'});return;}
    const bytes=Buffer.from(v.options.data,'base64'),aad=Buffer.from(v.options.binding);let r;
    if(v.method==='protect'){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(aad);r=Buffer.concat([iv,c.update(bytes),c.final(),c.getAuthTag()]);}
    else{const d=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));d.setAAD(aad);d.setAuthTag(bytes.subarray(-16));r=Buffer.concat([d.update(bytes.subarray(12,-16)),d.final()]);}
    send({replyTo:v.host,result:{data:r.toString('base64')}});
  }else if(v.id){const p=pending.get(v.id);pending.delete(v.id);v.error?p.reject(Object.assign(Error(v.error),{code:v.error})):p.resolve(v.result);}
  else if(v.event){events.push(v.event);if(v.event==='Desktop:startupFailure')console.error('Startfehler: '+JSON.stringify(v.data));}
});
const call=(plugin,method,options={})=>new Promise((res,rej)=>{const id=String(++next);pending.set(id,{resolve:res,reject:rej});send({id,plugin,method,options});});
const frist=setTimeout(()=>{console.error('Zeitüberschreitung. '+diag);child.kill();process.exitCode=1;for(const p of pending.values())p.reject(Error('timeout'));},60000);
try{
  const info=await call('DesktopInternal','info');
  assert.equal(info.plattform,'windows');
  assert.equal(info.version,JSON.parse(await readFile(join(root,'windows/src-tauri/tauri.conf.json'),'utf8')).version);
  assert.equal((await call('BlpTresor','ordnerWaehlen')).gewaehlt,true);
  const z=await call('BlpTresor','anlegen',{merken:true});assert.equal(z.offen,true);
  assert.ok(hostCalls.includes('password')&&hostCalls.includes('protect'),'Passwort und DPAPI über die Hülle');
  await assert.rejects(call('Unbekannt','x'),/INVALID_INPUT/);
  console.log('PASS echter Kindprozess: Start, Rückfragen an die Hülle (Ordner, Passwort, DPAPI), Tresorordner angelegt');
}finally{clearTimeout(frist);child.stdin.end();await exited;await rm(test,{recursive:true,force:true});}
