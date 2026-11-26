// US3 isolated-test API access only; no operational URL or credential export.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util');
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {readGenerated,mapping}=require('./test-artifacts.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'factory/local/us3');
function settings(){
 mapping('US3',['--mapped']);
 const c=parseEnv(fs.readFileSync(path.join(root,'factory/local/test.env'),'utf8'));
 const u=new URL(c.N8N_BASE_URL);
 if(c.FACTORY_TARGET!=='test'||!['127.0.0.1','localhost'].includes(u.hostname)||u.port!=='5679'||u.protocol!=='http:'||u.username||u.password)throw Error('Only designated loopback test instance :5679 allowed');
 if(!c.N8N_API_KEY)throw Error('Fill N8N_API_KEY in factory/local/test.env');
 return c;
}
async function api(route,method='GET',body){
 const c=settings();if(!route.startsWith('/api/v1/'))throw Error('Expected public API route');
 const r=await fetch(new URL(route,c.N8N_BASE_URL),{method,headers:{'X-N8N-API-KEY':c.N8N_API_KEY,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});
 const text=await r.text();if(!r.ok)throw Error(`Test API ${method} ${route.split('?')[0]}: HTTP ${r.status}`);
 return text?JSON.parse(text):null;
}
function save(name,value){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{mode:0o600});}
async function inspect(){
 const c=settings(),workflows=await api('/api/v1/workflows?limit=100');
 const tables=await api('/api/v1/data-tables?limit=100');
 const rows=await api(`/api/v1/data-tables/${encodeURIComponent(c.FACTORY_CONTROL_TABLE_ID)}/rows?limit=100`);
 const running=await api('/api/v1/executions?status=running&limit=100'),waiting=await api('/api/v1/executions?status=waiting&limit=100');
 const result={at:new Date().toISOString(),workflows,tables,rows,running,waiting};save('boundary-inspection.json',result);
 console.log(JSON.stringify({workflowCount:workflows.data.length,active:workflows.data.filter(w=>w.active).map(w=>({id:w.id,name:w.name})),tableId:c.FACTORY_CONTROL_TABLE_ID,rows,running:running.data.length,waiting:waiting.data.length,paginated:[workflows,tables,rows,running,waiting].some(x=>!!x.nextCursor)}));
 return result;
}
const hash=s=>createHash('sha256').update(s).digest('hex');
function registry(){return JSON.parse(readGenerated('factory/local/us3/imported.json','node factory/tests/tracking-api.cjs import (only after fresh isolation verification)'));}
function validate(w){
 assert.equal(w.name,'TEST ONLY — US3 tracking');assert.equal(w.active,false);assert(!w.id);
 const source=JSON.parse(fs.readFileSync(path.join(root,'factory/workflows/track.json')));
 for(const n of w.nodes){assert(!n.credentials);
  if(n.type.endsWith('.httpRequest'))assert(n.parameters.url.includes('http://127.0.0.1:18767')&&!n.parameters.url.includes('https://'));
  if(n.type.endsWith('.dataTable'))assert.equal(n.parameters.dataTableId.value,settings().FACTORY_CONTROL_TABLE_ID);
  if(n.type.endsWith('.scheduleTrigger'))assert(n.disabled);
 }
 for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(w.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
 for(const [name,edges] of Object.entries(source.connections))assert.deepEqual(w.connections[name],edges);
 return w;
}
async function install(){
 const before=await inspect();assert(!before.workflows.data.some(w=>w.active));assert(!before.running.data.length&&!before.waiting.data.length);
 assert.equal(before.rows.data.length,1);assert.equal(before.rows.data[0].busy,false);
 assert(!fs.existsSync(path.join(dir,'imported.json')),'Existing test registration: inspect instead of creating duplicate');
 const w=validate(JSON.parse(readGenerated('factory/local/us3/tracking-test-mapped.json','node factory/tests/prepare-test-artifacts.cjs --mapped')));
 const body={name:w.name,nodes:w.nodes,connections:w.connections,settings:w.settings};
 const result=await api('/api/v1/workflows','POST',body);
 save('imported.json',{id:result.id,versionId:result.versionId,source_sha256:hash(fs.readFileSync(path.join(root,'factory/workflows/track.json'))),mapped_sha256:hash(readGenerated('factory/local/us3/tracking-test-mapped.json','node factory/tests/prepare-test-artifacts.cjs --mapped'))});
 const readback=await api('/api/v1/workflows/'+result.id);save('import-readback.json',readback);
 assert.deepEqual(readback.nodes,w.nodes);assert.deepEqual(readback.connections,w.connections);assert.equal(readback.active,false);
 console.log('Imported and verified NEW isolated workflow '+result.id+' revision '+readback.versionId);
}
async function publish(active){const r=registry();const current=await api('/api/v1/workflows/'+r.id);assert.equal(current.name,'TEST ONLY — US3 tracking');
 if(active){const all=await api('/api/v1/workflows?limit=100');assert(!all.nextCursor&&!all.data.some(w=>w.active));}
 const value=await api('/api/v1/workflows/'+r.id+(active?'/activate':'/deactivate'),'POST',active?{versionId:current.versionId}:undefined);save(active?'published.json':'unpublished.json',value);console.log((active?'Published ':'Unpublished ')+r.id);
}
async function scheduled(){
 const r=registry(),current=await api('/api/v1/workflows/'+r.id);assert.equal(current.name,'TEST ONLY — US3 tracking');assert.equal(current.active,false);
 const w=validate(JSON.parse(readGenerated('factory/local/us3/tracking-test-mapped.json','node factory/tests/prepare-test-artifacts.cjs --mapped')));
 const n=w.nodes.find(n=>n.type.endsWith('.scheduleTrigger'));assert(n);n.disabled=false;
 n.notes='TEST ONLY: original source 60-second schedule, synthetic loopback only. Other workflows remain inactive; do not start manual work during scheduled observation.';
 const response=await api('/api/v1/workflows/'+r.id,'PUT',{name:w.name,nodes:w.nodes,connections:w.connections,settings:w.settings});
 const check=await api('/api/v1/workflows/'+r.id);assert.deepEqual(check.nodes,w.nodes);assert.deepEqual(check.connections,w.connections);assert.equal(check.active,false);
 save('scheduled-import-readback.json',check);console.log('Prepared original scheduled entry in isolated revision '+response.versionId);
}
async function webhook(route,body){assert(['run','prepare','inspect','reset'].includes(route));const c=settings();
 const r=await fetch(new URL('/webhook/basic-a-us3-test/'+route,c.N8N_BASE_URL),{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(120000)});
 const raw=await r.text();let value;try{value=JSON.parse(raw);}catch{value={raw:raw.slice(0,300)};}return {status:r.status,value};
}
async function shutdown(){
 const workflows=await api('/api/v1/workflows?limit=100'),running=await api('/api/v1/executions?status=running&limit=100'),waiting=await api('/api/v1/executions?status=waiting&limit=100');
 assert(!workflows.nextCursor&&!running.nextCursor&&!waiting.nextCursor);
 const rows=await api('/api/v1/data-tables/'+settings().FACTORY_CONTROL_TABLE_ID+'/rows?limit=100');assert.equal(rows.data.length,1);
 const endpoint=await webhook('inspect');
 const report={at:new Date().toISOString(),workflow_count:workflows.data.length,active_workflows:workflows.data.filter(w=>w.active).map(w=>w.id),running:running.data.length,waiting:waiting.data.length,row:rows.data[0],route_status:endpoint.status};
 save('shutdown.json',report);assert.equal(report.active_workflows.length,0);assert.equal(report.running,0);assert.equal(report.waiting,0);assert.equal(report.route_status,404);assert.equal(report.row.busy,false);console.log(JSON.stringify(report));
}
if(require.main===module){(async()=>{const command=process.argv[2];
 if(command==='inspect')await inspect();else if(command==='import')await install();else if(command==='publish')await publish(true);else if(command==='unpublish')await publish(false);else if(command==='schedule')await scheduled();else if(command==='shutdown-check')await shutdown();else throw Error('Use inspect|import|publish|unpublish|schedule|shutdown-check');
})().catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={api,settings,save,inspect,dir,registry,webhook};
