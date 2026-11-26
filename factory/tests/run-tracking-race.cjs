// Focused native regression. Only the verified isolated API/loopback fixture is used.
// Run after T033 and fixture startup; never imports or executes production workflows.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {api,settings}=require('./tracking-api.cjs');
const dir='factory/local/tracking-race';fs.mkdirSync(dir,{recursive:true});
const save=(name,value)=>fs.writeFileSync(`${dir}/${name}.json`,JSON.stringify(value,null,2)+'\n',{mode:0o600});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function boundary(){
 const results=await Promise.all(['/api/v1/workflows?limit=100','/api/v1/executions?status=running&limit=100','/api/v1/executions?status=waiting&limit=100',`/api/v1/data-tables/${settings().FACTORY_CONTROL_TABLE_ID}/rows?limit=100`].map(p=>api(p)));
 for(const r of results)assert(!r.nextCursor);assert(!results[1].data.length&&!results[2].data.length);assert.equal(results[3].data.length,1);
 return {workflows:results[0].data,row:results[3].data[0]};
}
async function hook(route,body){
 const r=await fetch(settings().N8N_BASE_URL+'/webhook/basic-a-tracking-race/'+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(120000)});
 const text=await r.text();let value;try{value=JSON.parse(text);}catch{value={status:r.status};}return {status:r.status,value};
}
const one=v=>Array.isArray(v)?v[0]:v;
async function main(){
 const before=await boundary();assert(!before.workflows.some(w=>w.active));assert.equal(before.row.busy,false,'Inspect existing hold; this test never resets automatically');
 assert(!fs.existsSync(`${dir}/registry.json`),'Existing native run: inspect retained evidence rather than duplicate it');
 const source=JSON.parse(fs.readFileSync('factory/workflows/track.json'));
 const w=JSON.parse(fs.readFileSync('factory/local/us3/tracking-test-mapped.json'));
 w.name='TEST ONLY — tracking no-work race';
 for(const n of w.nodes){
  assert(!n.credentials);if(n.type.endsWith('.httpRequest'))assert(n.parameters.url.includes('http://127.0.0.1:18767'));
  if(n.type.endsWith('.dataTable'))assert.equal(n.parameters.dataTableId.value,settings().FACTORY_CONTROL_TABLE_ID);
  if(n.type.endsWith('.scheduleTrigger'))assert(n.disabled);
  if(n.type.endsWith('.webhook')){n.parameters.path=n.parameters.path.replace('basic-a-us3-test','basic-a-tracking-race');n.webhookId='tracking-race-'+n.id;}
 }
 for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(w.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
 for(const [name,edges]of Object.entries(source.connections))assert.deepEqual(w.connections[name],edges);
 save('mapped',w);save('boundary',before);
 const imported=await api('/api/v1/workflows','POST',{name:w.name,nodes:w.nodes,connections:w.connections,settings:{executionOrder:'v1',saveDataSuccessExecution:'all',saveDataErrorExecution:'all'}});
 save('registry',{id:imported.id,versionId:imported.versionId,source_sha256:hash(fs.readFileSync('factory/workflows/track.json')),mapped_sha256:hash(JSON.stringify(w))});
 const readback=await api('/api/v1/workflows/'+imported.id);assert.deepEqual(readback.nodes,w.nodes);assert.deepEqual(readback.connections,w.connections);
 await api('/api/v1/workflows/'+imported.id+'/activate','POST',{versionId:readback.versionId});
 const events=[];
 try{
  // Wait only for registration, never retry a test execution or write.
  let ready=false;for(let i=0;i<20;i++){if((await hook('inspect')).status===200){ready=true;break;}await new Promise(r=>setTimeout(r,250));}assert(ready);
  async function run(label,{prepare,fail=false,held=false,noWork=false}={}){
   if(prepare)assert.equal((await hook('prepare',{scenario:prepare})).status,200);
   const old=(await boundary()).row;
   const response=await hook('run',{}),after=(await boundary()).row;
   const effects=one((await hook('inspect')).value);
   if(held){assert.equal(response.status,200);assert.equal(one(response.value).status,'skipped_held');assert.deepEqual(after,old);events.push({label,held:true,row:after});save('events',events);return;}
   assert.notEqual(after.execution_id,old.execution_id);
   const e=await api(`/api/v1/executions/${after.execution_id}?includeData=true`);save('execution-'+e.id,e);save('effects-'+e.id,effects);
   assert.equal(e.workflowId,imported.id);assert.equal(e.status,fail?'error':'success');assert.equal(after.busy,fail);
   assert.deepEqual(e.workflowData.connections,w.connections);
   for(const n of w.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(e.workflowData.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
   const runs=e.data.resultData.runData,markerCount=effects.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1')).length;
   const writes=effects.calls.filter(c=>c.method!=='GET');
   if(noWork){assert(runs['No tracked changes']);assert(!runs['Recheck issue']&&!runs['Final issue']);assert(!runs['Post result marker']);}
   if(!fail)assert(runs['Confirm idle']);else assert(!runs['Release control']);
   if(label==='arrival idle'){assert.equal(writes.length,0);assert.equal(markerCount,0);assert(effects.pulls.length===1);}
   if(label==='next poll QA'){assert.equal(markerCount,1);assert.equal(writes.length,3);assert(effects.issues[0].labels.some(l=>l.name==='Your QA'));}
   if(label==='unchanged QA'){assert.equal(writes.length,3);assert.equal(markerCount,1);}
   if(fail){assert.equal(markerCount,1);assert.equal(writes.length,1);}
   events.push({label,id:e.id,status:e.status,mode:e.mode,version:e.workflowVersionId,before:old,after,nodes:Object.keys(runs),writes:writes.length,markerCount,error:e.data.resultData.error?.message??null});save('events',events);
   console.log('PASS '+label+': execution '+e.id+', busy='+after.busy);
  }
  await run('arrival idle',{prepare:'arriving-result',noWork:true});
  await run('next poll QA');await run('unchanged QA',{noWork:true});
  await run('unknown POST hold',{prepare:'unknown-post',fail:true});await run('later held skip',{held:true});
 }finally{
  await api('/api/v1/workflows/'+imported.id+'/deactivate','POST');
  const end=await boundary();assert(!end.workflows.some(w=>w.active));save('shutdown',end);
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
