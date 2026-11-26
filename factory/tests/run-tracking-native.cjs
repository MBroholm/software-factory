// Main-engine isolated US3 tests. Explicit inspected reset is separate from workflow errors.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {api,settings,save,dir,registry,webhook}=require('./tracking-api.cjs');
const failures=new Set(['ambiguous','captured-edit','unchanged-reopen','unexpected-before','unknown-post','partial-label']);
const noWork=new Set(['no-result','no-candidate','rework-stale','reapproved']);
const row=async()=>{const value=await api(`/api/v1/data-tables/${settings().FACTORY_CONTROL_TABLE_ID}/rows?limit=100`);assert(!value.nextCursor&&value.data.length===1);return value.data[0];};
const one=value=>Array.isArray(value)?value[0]:value;
async function fixture(){const r=await webhook('inspect');assert.equal(r.status,200);return one(r.value);}
async function trace(id){const r=await api(`/api/v1/executions/${id}?includeData=true`);save('execution-'+id+'.json',r);return r;}
function record(result){const name='native-events.json';const p=path.join(dir,name);const all=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):[];all.push(result);save(name,all);}
async function invoke(scenario,repeat=false){
 const before=await row();assert.equal(before.busy,false,'Inspect held execution before another case');
 if(!repeat){const p=await webhook('prepare',{scenario});assert.equal(p.status,200);assert.equal(one(p.value).scenario,scenario);}
 const prepared=await fixture();assert.equal(prepared.scenario,scenario);
 const response=await webhook('run',{}),after=await row(),effects=await fixture();
 const execution=await trace(after.execution_id);assert.equal(execution.workflowId,registry().id);
 const fail=failures.has(scenario);assert.equal(execution.status,fail?'error':'success');assert.equal(after.busy,fail);
 const data=execution.data.resultData.runData;
 assert(data['Verify acquisition'],'Native acquisition not reached');
 if(fail)assert(!data['Release control'],'Failure reached release');else assert(data['Confirm idle'],'Native release not confirmed');
 const mapped=JSON.parse(fs.readFileSync(path.join(dir,'tracking-test-mapped.json')));
 for(const n of mapped.nodes.filter(n=>n.type.endsWith('.code'))){const actual=execution.workflowData.nodes.find(x=>x.name===n.name);assert.equal(actual.parameters.jsCode,n.parameters.jsCode,'Native Code fingerprint '+n.name);}
 assert.deepEqual(execution.workflowData.connections,mapped.connections);
 const writes=effects.calls.filter(c=>c.method!=='GET'),markers=effects.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1'));
 if(!fail){
  if(noWork.has(scenario)||repeat)assert.equal(writes.length,repeat?prepared.calls.filter(c=>c.method!=='GET').length:0);
  else {const target=['merged','owner-closed'].includes(scenario)?'Done':'Your QA';assert(effects.issues.find(i=>i.number===1).labels.some(l=>l.name===target));}
  if(scenario==='owner-closed')assert.equal(markers.length,0);
  else if(!noWork.has(scenario))assert.equal(markers.length,scenario.startsWith('rework-')?2:1);
 }
 const event={scenario,repeat,execution_id:after.execution_id,mode:execution.mode,status:execution.status,http:response.status,version:execution.workflowVersionId,before,after,nodes:Object.keys(data),writes,marker_count:markers.length,error:execution.data.resultData.error?.message??null};
 record(event);save('last-case.json',event);save('effects-'+after.execution_id+'.json',effects);
 if(fail){const held=await webhook('run',{});assert.equal(held.status,200);assert.equal(one(held.value).status,'skipped_held');assert.deepEqual(await row(),after);assert.deepEqual(await fixture(),effects);record({scenario,held_skip:true,owner_execution:after.execution_id});}
 console.log(`PASS ${scenario}${repeat?' repeated':''}: native ${after.execution_id} ${execution.status}, busy=${after.busy}`);
}
async function resetKnown(){
 const previous=JSON.parse(fs.readFileSync(path.join(dir,'last-case.json'))),before=await row();
 assert(failures.has(previous.scenario)&&previous.status==='error');assert.equal(before.execution_id,previous.execution_id);assert.equal(before.busy,true);
 const execution=await trace(before.execution_id);assert.equal(execution.status,'error');assert.equal(execution.workflowId,registry().id);
 for(const status of ['running','waiting']){const r=await api('/api/v1/executions?status='+status+'&limit=100');assert(!r.nextCursor&&!r.data.length);}
 const reason='Inspected completed US3 synthetic '+previous.scenario+' execution '+before.execution_id+'; preserve evidence and prepare next independent case';
 const result=await webhook('reset',{id:before.id,execution_id:before.execution_id,reason});assert.equal(result.status,200);const after=await row();assert.equal(after.busy,false);assert.equal(after.execution_id,before.execution_id);
 record({operator_fixture_reset:true,reason,before,after});console.log('Explicit inspected synthetic reset '+before.execution_id);
}
function scheduleFingerprint(execution,imported){
 assert.deepEqual(execution.workflowData.connections,imported.connections);
 for(const n of imported.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(execution.workflowData.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
 const expected=imported.nodes.find(n=>n.type.endsWith('.scheduleTrigger')),actual=execution.workflowData.nodes.find(n=>n.name===expected.name);
 const normalized=structuredClone(actual);if(Object.hasOwn(normalized.parameters,'notice')){assert.equal(normalized.parameters.notice,'');delete normalized.parameters.notice;}
 assert.deepEqual(normalized,expected); // Only the known empty engine notice is ignored.
}
async function collectSchedule(){
 const imported=JSON.parse(fs.readFileSync(path.join(dir,'scheduled-import-readback.json'))),all=[];
 let cursor;do{const page=await api('/api/v1/executions?workflowId='+registry().id+'&limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));all.push(...page.data);cursor=page.nextCursor;}while(cursor);
 const ticks=all.filter(e=>e.mode==='trigger').sort((a,b)=>Number(a.id)-Number(b.id));
 const observed=[];for(const item of ticks){
  const e=await trace(item.id);if(e.workflowVersionId!==imported.versionId)continue;assert.equal(e.status,'success');scheduleFingerprint(e,imported);
  const data=e.data.resultData.runData;assert(data['Confirm idle']);
  const posted=!!data['Post result marker'];if(observed.length===0)assert(posted,'First tick must demonstrate actual scheduled QA transition');else assert(!posted&&!data['Add result state']&&!data['Remove previous state'],'Later tick must not write');
  const output=data['Report completion'].at(-1).data.main[0][0].json;assert.equal(output.control.busy,false);
  observed.push({id:e.id,mode:e.mode,status:e.status,version:e.workflowVersionId,startedAt:e.startedAt,stoppedAt:e.stoppedAt,row:output.control,nodes:Object.keys(data),posted});
 }
 const effects=await fixture();assert.equal(effects.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1')).length,1);assert.equal(effects.calls.filter(c=>c.method!=='GET').length,3);
 save('schedule-results.json',{observed,effects,engine_metadata_delta:'Empty Schedule Trigger parameters.notice inserted by n8n; all other trigger fields, Code bodies and connections match.'});
 console.log('Verified '+observed.length+' completed scheduled tick(s)');return observed;
}
async function main(){const [command,name]=process.argv.slice(2);
 if(command==='case')await invoke(name);else if(command==='repeat')await invoke(name,true);else if(command==='reset-known')await resetKnown();
 else if(command==='prepare-schedule'){
  if((await row()).busy)await resetKnown();
  const all=await api('/api/v1/workflows?limit=100');assert(!all.nextCursor&&!all.data.some(w=>w.active&&w.id!==registry().id));
  const own=await api('/api/v1/workflows/'+registry().id);assert(own.nodes.filter(n=>n.type.endsWith('.scheduleTrigger')).every(n=>n.disabled));
  const prepared=await webhook('prepare',{scenario:'open-result'});assert.equal(prepared.status,200);
  save('schedule-before.json',{row:await row(),fixture:await fixture()});console.log('Prepared scheduled synthetic open result while schedules disabled');
 }else if(command==='collect-schedule'){await collectSchedule();
 }else if(command==='observe-schedule'){
  const start=Date.now(),observed=[];let writes;
  while(Date.now()-start<155000){
   const after=await row();
   if(!after.busy&&after.execution_id!==JSON.parse(fs.readFileSync(path.join(dir,'schedule-before.json'))).row.execution_id&&!observed.some(x=>x.id===after.execution_id)){
    const execution=await trace(after.execution_id);
    if(execution.mode==='trigger'&&execution.workflowId===registry().id){
     assert.equal(execution.status,'success');const effects=await fixture(),nodes=execution.data.resultData.runData;
     assert(nodes['Confirm idle']);assert.equal(effects.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1')).length,1);
     assert(effects.issues[0].labels.some(l=>l.name==='Your QA'));
     const currentWrites=effects.calls.filter(c=>c.method!=='GET');
     if(writes)assert.deepEqual(currentWrites,writes);else {writes=currentWrites;assert.equal(writes.length,3);}
     const imported=JSON.parse(fs.readFileSync(path.join(dir,'scheduled-import-readback.json')));
     assert.deepEqual(execution.workflowData.connections,imported.connections);
     scheduleFingerprint(execution,imported);
     observed.push({id:execution.id,mode:execution.mode,status:execution.status,version:execution.workflowVersionId,row:after,nodes:Object.keys(nodes)});
     console.log('PASS scheduled tick '+execution.id+' '+(observed.length===1?'QA transition':'unchanged no-write poll'));save('schedule-results.json',{observed,writes,effects});
     if(observed.length===2)return;
    }
   }
   await new Promise(resolve=>setTimeout(resolve,2000));
  }throw Error('Two scheduled successful ticks not observed within 155 seconds');
 }else if(command==='suite'){
  for(const scenario of ['closed-unmerged','no-result','no-candidate','session-comments','rework-stale','rework-head','rework-new-pr','reapproved','pagination','merged','owner-closed','ambiguous','captured-edit','unchanged-reopen','unexpected-before','unknown-post','partial-label']){
   if((await row()).busy)await resetKnown();await invoke(scenario);
  }
 }else throw Error('Use case NAME|repeat NAME|reset-known|suite');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
