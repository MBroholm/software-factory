// Targeted T026 main-engine fixtures. Never targets operational n8n or external APIs.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {api,settings}=require('./tracking-api.cjs');
const dir='factory/local/us4',stories=['refine','reserve','track'];fs.mkdirSync(dir,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p)),save=(n,v)=>fs.writeFileSync(`${dir}/${n}.json`,JSON.stringify(v,null,2)+'\n',{mode:0o600});
const hash=s=>createHash('sha256').update(s).digest('hex');
const cases=['G01','G06-empty','G06-duplicate','G06-key','G06-context','G07','G08-empty','G08-wrong','G09-table','G09-empty','G10-unack','G10-error','G11','G12-throw','G12-empty','G13','G16'];
function packaged(story){
 const source=read(`factory/workflows/${story}.json`),w=structuredClone(source);w.name=`TEST ONLY — US4 ${story} guard`;w.active=false;
 w.settings={executionOrder:'v1',saveDataErrorExecution:'all',saveDataSuccessExecution:'all',saveManualExecutions:true};
 const expr="$('US4 test entry').first().json.body.case";
 for(const n of w.nodes){
  if(n.type.endsWith('.scheduleTrigger')){n.disabled=true;n.notes='TEST ONLY: disabled throughout native guard/recovery tests. '+n.notes;}
  if(n.type.endsWith('.dataTable')){n.notes='TEST ONLY: designated isolated singleton; named guard-fault cases deliberately use a nonexistent table. '+n.notes;
   const fault={'Acquire control':'G07','Read acquired control':'G09-table','Release control':'G11','Read released control':'G13'}[n.name];
   n.parameters.dataTableId={__rl:true,mode:'id',value:fault?`={{ ${expr} === '${fault}' ? 'US4_MISSING_TABLE' : '${settings().FACTORY_CONTROL_TABLE_ID}' }}`:settings().FACTORY_CONTROL_TABLE_ID};
  }
  if(n.type.endsWith('.httpRequest')){n.notes='TEST ONLY: credential-free synthetic container loopback, never the external API. '+n.notes;n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18768/github').replaceAll('https://generativelanguage.googleapis.com','http://127.0.0.1:18768/gemini');n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;}
 }
 function add(name,type,parameters,version=2){const n={id:hash('us4:'+story+':'+name).slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:version,parameters,position:[-1500,w.nodes.length*20],notes:'TEST ONLY: explicit isolated US4 fixture boundary. Never operational or automatic recovery.'};w.nodes.push(n);return n;}
 function link(a,b){w.connections[a]={main:[[{node:b,type:'main',index:0}]]};}
 const hook=add('US4 test entry','webhook',{httpMethod:'POST',path:`basic-a-us4/${story}`,responseMode:'lastNode',options:{}},2.1);hook.webhookId=hook.id;link(hook.name,'Read control');
 function before(target,body){const name='US4 before '+target;add(name,'code',{mode:'runOnceForAllItems',jsCode:`const testCase=${expr};\n${body}\nreturn $input.all();`});
  for(const edges of Object.values(w.connections))for(const branch of edges.main??[])for(const edge of branch??[])if(edge.node===target)edge.node=name;link(name,target);
 }
 before('Validate entry',"if(testCase==='G06-empty')return [{json:{}}];if(testCase==='G06-duplicate')return [...$input.all(),...$input.all()];if(testCase==='G06-key')return [{json:{...$input.first().json,key:'wrong'}}];if(testCase==='G06-context')return [{json:{...$input.first().json,issue_number:-1}}];");
 before('Check acquire receipt',"if(testCase==='G08-empty')return [{json:{}}];if(testCase==='G08-wrong')return [{json:{...$input.first().json,execution_id:'wrong'}}];");
 before('Verify acquisition',"if(testCase==='G09-empty')return [{json:{}}];");
 before('Require acknowledged completion',"if(testCase==='G10-unack')return [{json:{outcome:'success',acknowledged:false}}];if(testCase==='G10-error')return [{json:{error:'Synthetic error'}}];");
 before('Verify release ownership',"if(testCase==='G16')return [{json:{...$input.first().json,execution_id:'wrong'}}];");
 before('Check release receipt',"if(testCase==='G12-throw')throw Error('US4 lost release acknowledgement');if(testCase==='G12-empty')return [{json:{}}];");
 const delay='US4 in-flight restart boundary';add(delay,'code',{mode:'runOnceForAllItems',jsCode:`if(${expr}==='G14')await new Promise(resolve=>setTimeout(resolve,30000));return $input.all();`});
 const next=w.connections['Verify acquisition'];w.connections[delay]=next;link('Verify acquisition',delay);
 for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(w.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
 assert(w.nodes.every(n=>!n.credentials));for(const n of w.nodes.filter(n=>n.type.endsWith('.httpRequest')))assert(n.parameters.url.includes('http://127.0.0.1:18768/')&&!n.parameters.url.includes('https://'));
 save(story+'-mapped',w);return w;
}
async function boundary(){const [workflows,running,waiting,rows]=await Promise.all([api('/api/v1/workflows?limit=100'),api('/api/v1/executions?status=running&limit=100'),api('/api/v1/executions?status=waiting&limit=100'),api(`/api/v1/data-tables/${settings().FACTORY_CONTROL_TABLE_ID}/rows?limit=100`)]);for(const r of [workflows,running,waiting,rows])assert(!r.nextCursor);return {at:new Date().toISOString(),workflows:workflows.data.map(w=>({id:w.id,name:w.name,active:w.active})),running:running.data.length,waiting:waiting.data.length,rows:rows.data};}
const row=async()=>{const r=await api(`/api/v1/data-tables/${settings().FACTORY_CONTROL_TABLE_ID}/rows?limit=100`);assert.equal(r.data.length,1);return r.data[0];};
function record(v){const p=`${dir}/events.json`,all=fs.existsSync(p)?read(p):[];all.push(v);save('events',all);}
async function invoke(story,testCase){const r=await fetch(new URL(`/webhook/basic-a-us4/${story}`,settings().N8N_BASE_URL),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({case:testCase}),signal:AbortSignal.timeout(60000)});await r.text();return r.status;}
async function execution(story,id){const e=await api(`/api/v1/executions/${id}?includeData=true`);save('execution-'+id,e);assert.equal(e.workflowId,read(`${dir}/registry.json`)[story].id);const w=read(`${dir}/${story}-mapped.json`);assert.deepEqual(e.workflowData.connections,w.connections);for(const n of w.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(e.workflowData.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);assert.equal(e.usedPrivateCredentials,false);return e;}
async function resetKnown(){const b=await boundary();assert(!b.running&&!b.waiting);assert.equal(b.rows.length,1);const r=b.rows[0];if(!r.busy)return;
 const events=read(`${dir}/events.json`),known=events.findLast(e=>e.after?.execution_id===r.execution_id&&e.after.busy&&e.status==='error');assert(known,'Unknown hold: stop');assert.deepEqual(r,known.after);
 const e=await api(`/api/v1/executions/${r.execution_id}`);assert(['error','crashed','canceled'].includes(e.status));
 const result=await api(`/api/v1/data-tables/${settings().FACTORY_CONTROL_TABLE_ID}/rows/update`,'PATCH',{filter:{type:'and',filters:[{columnName:'id',condition:'eq',value:r.id},{columnName:'execution_id',condition:'eq',value:r.execution_id},{columnName:'busy',condition:'eq',value:true}]},data:{busy:false},returnData:true});
 assert.equal((await row()).busy,false);record({operator_reset:true,reason:'Inspected completed synthetic '+known.story+'/'+known.case+'; saved trace and unchanged held polls before next independent case',before:r,after:await row()});
}
async function runCase(story,testCase){await resetKnown();const before=await row(),http=await invoke(story,testCase),after=await row();let id=after.execution_id;
 if(testCase.startsWith('G06')||testCase==='G07'){const all=await api('/api/v1/executions?workflowId='+read(`${dir}/registry.json`)[story].id+'&limit=1');id=all.data[0].id;assert.deepEqual(after,before);}
 const e=await execution(story,id),data=e.data.resultData.runData;assert.equal(e.status,testCase==='G01'?'success':'error');
 if(testCase==='G01')assert(data['Confirm idle']);else assert(!data['Report completion']);
 const idle=testCase==='G01'||testCase.startsWith('G06')||testCase==='G07'||testCase.startsWith('G12')||testCase==='G13';assert.equal(after.busy,!idle);
 const event={story,case:testCase,id,http,status:e.status,version:e.workflowVersionId,before,after,nodes:Object.keys(data),error:e.data.resultData.error?.message??null};record(event);
 if(after.busy)for(const other of stories){const status=await invoke(other,'G01');assert.equal(status,200);assert.deepEqual(await row(),after);record({held_skip:true,story:other,owner:id,case:testCase});}
 console.log('PASS '+story+'/'+testCase+' execution '+id+' busy='+after.busy);
}
function normalizedNodes(nodes,expected){const copy=structuredClone(nodes);for(const n of copy){const original=expected.find(x=>x.name===n.name);if(n.type.endsWith('.wait')&&!original.webhookId)delete n.webhookId;}return copy;}
async function main(){const [command,a,b]=process.argv.slice(2);
 if(command==='inspect'){const result=await boundary();save('boundary',result);console.log(JSON.stringify(result));}
 else if(command==='install'){const before=await boundary();assert(!before.workflows.some(w=>w.active)&&!before.running&&!before.waiting);assert.equal(before.rows[0].busy,false);assert(!fs.existsSync(`${dir}/registry.json`));const registry={};for(const story of stories){const w=packaged(story);const existing=before.workflows.filter(x=>x.name===w.name);assert(existing.length<=1);const r=existing.length?await api('/api/v1/workflows/'+existing[0].id):await api('/api/v1/workflows','POST',{name:w.name,nodes:w.nodes,connections:w.connections,settings:w.settings});const back=await api('/api/v1/workflows/'+r.id);assert.equal(back.active,false);assert.deepEqual(normalizedNodes(back.nodes,w.nodes),w.nodes);assert.deepEqual(back.connections,w.connections);registry[story]={id:r.id,version:r.versionId,source_sha256:hash(fs.readFileSync(`factory/workflows/${story}.json`)),mapped_sha256:hash(fs.readFileSync(`${dir}/${story}-mapped.json`))};save(story+'-readback',back);}save('registry',registry);console.log(JSON.stringify(registry));}
 else if(command==='publish'||command==='unpublish'){for(const r of Object.values(read(`${dir}/registry.json`)))await api('/api/v1/workflows/'+r.id+(command==='publish'?'/activate':'/deactivate'),'POST',command==='publish'?{versionId:r.version}:undefined);console.log(command+' all three disabled-schedule fixture copies');}
 else if(command==='crash'){
  await resetKnown();const before=await row();const pending=invoke(a,'G14').catch(e=>({interrupted:e.name}));
  let acquired;for(let i=0;i<30;i++){const r=await row();if(r.busy&&r.execution_id!==before.execution_id){acquired=r;break;}await new Promise(resolve=>setTimeout(resolve,100));}
  assert(acquired,'No acquired live execution');await new Promise(resolve=>setTimeout(resolve,800));
  const live=await api('/api/v1/executions/'+acquired.execution_id);assert.equal(live.status,'running');
  save('crash-pending',{story:a,before,acquired});console.log('READY restart isolated container during '+a+' execution '+acquired.execution_id);
  const {execFileSync}=require('node:child_process');execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=10','broholm@nas','docker restart --time 1 factory-guard-test'],{timeout:20000,stdio:'pipe'});
  await pending;
  let after;for(let i=0;i<40;i++){try{after=await row();break;}catch{}await new Promise(resolve=>setTimeout(resolve,500));}
  assert.deepEqual(after,acquired);const e=await execution(a,after.execution_id);assert(['crashed','error','canceled'].includes(e.status));
  const event={story:a,case:'G14',id:e.id,status:'error',native_status:e.status,version:e.workflowVersionId,before,after,nodes:Object.keys(e.data?.resultData?.runData??{}),intervention:'Restarted only factory-guard-test in flight after native running/acquired confirmation; fixture process terminates with container; no replay.'};record(event);
  for(const other of stories){assert.equal(await invoke(other,'G01'),200);assert.deepEqual(await row(),after);record({held_skip:true,story:other,owner:e.id,case:'G14'});}
  console.log('PASS '+a+'/G14 persisted hold '+e.id+' native '+e.status+' with three unchanged held polls');
 }
 else if(command==='case')await runCase(a,b);
 else if(command==='suite')for(const story of stories)for(const testCase of cases)await runCase(story,testCase);
 else if(command==='reset-known')await resetKnown();
 else throw Error('Use inspect|install|publish|unpublish|case STORY CASE|suite|reset-known');
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={boundary,row,invoke,execution,record,resetKnown};
