// Explicit isolated stopped-volume restore rehearsal. No operational credentials decrypted.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID,createHash}=require('node:crypto');
const {api,settings}=require('./tracking-api.cjs'),{boundary}=require('./us4-guard.cjs'),{remote}=require('./us4-recovery.cjs');
(async()=>{
 const before=await boundary();assert(!before.running&&!before.waiting&&!before.workflows.some(w=>w.active));assert.equal(before.rows.length,1);assert.equal(before.rows[0].busy,false);
 const value=randomUUID(),cred=await api('/api/v1/credentials','POST',{name:'US4 disposable restore check',type:'httpHeaderAuth',data:{name:'X-US4-Restore-Check',value}});
 const manifest={before,credential_id:cred.id,credential_sha256:createHash('sha256').update(value).digest('hex')};fs.writeFileSync('factory/local/us4/backup-preflight.json',JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
 const code=fs.readFileSync('factory/tests/us4-backup.py','utf8'),command="python3 -c '"+code.replaceAll("'","'\\''")+"'";
 // Send private API key over existing SSH stdin only; never log payload or environment.
 const {execFileSync}=require('node:child_process');
 const output=execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10','broholm@nas',command],{input:JSON.stringify({api_key:settings().N8N_API_KEY,table_id:settings().FACTORY_CONTROL_TABLE_ID,rows:before.rows,workflow_ids:before.workflows.map(w=>w.id),credential_id:cred.id,credential_sha256:manifest.credential_sha256}),encoding:'utf8',timeout:180000,stdio:['pipe','pipe','pipe']});
 const result=JSON.parse(output);fs.writeFileSync('factory/local/us4/backup-results.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
 const after=await boundary();assert(!after.running&&!after.waiting&&!after.workflows.some(w=>w.active));assert.deepEqual(after.rows,before.rows);
 console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
