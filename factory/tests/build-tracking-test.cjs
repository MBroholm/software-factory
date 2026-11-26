// Offline test-copy packaging; T033 must pass before any native import/execution.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{parseEnv}=require('node:util');
const file='factory/tests/tracking-test.json';
const source=JSON.parse(fs.readFileSync('factory/workflows/track.json','utf8'));
const w=structuredClone(source);w.name='TEST ONLY — US3 tracking';w.active=false;
const mapping=process.argv.includes('--mapped')?parseEnv(fs.readFileSync('factory/local/test.env','utf8')):null;
if(mapping)assert.equal(mapping.FACTORY_TARGET,'test');
const control=mapping?.FACTORY_CONTROL_TABLE_ID??'OWNER_SELECT_ISOLATED_US3_CONTROL_TABLE';
assert(/^[A-Za-z0-9_-]+$/.test(control));
for(const n of w.nodes){
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId.value=control;
 if(n.type.endsWith('.httpRequest')){
  n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18767/github');
  n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
  n.notes='TEST ONLY: credential-free synthetic loopback destination. '+n.notes;
 }
 if(n.type.endsWith('.scheduleTrigger')){n.disabled=true;n.notes='TEST ONLY: disabled until isolated scheduled test setup is verified. '+n.notes;}
}
assert(w.nodes.every(n=>!n.credentials));
assert(w.nodes.filter(n=>n.type.endsWith('.httpRequest')).every(n=>n.parameters.url.includes('http://127.0.0.1:18767/github')&&!n.parameters.url.includes('api.github.com')));
for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(w.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
assert.deepEqual(w.connections,source.connections);
const connect=(a,b)=>{w.connections[a]={main:[[{node:b,type:'main',index:0}]]};};
function add(name,type,parameters,version=2){const n={id:crypto.createHash('sha256').update('us3:'+name).digest('hex').slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:version,position:[-1000,w.nodes.length*20],parameters,notes:'TEST ONLY: private isolated operator path; never connected to operational error recovery.'};w.nodes.push(n);return n;}
function hook(name,method,path){const n=add(name,'webhook',{httpMethod:method,path:'basic-a-us3-test/'+path,responseMode:'lastNode',options:{}},2.1);n.webhookId=n.id;return n;}
hook('US3 test entry','POST','run');connect('US3 test entry','Read control');
for(const [route,method,destination]of [['prepare','POST','/prepare'],['inspect','GET','/inspect']]){
 const name='US3 fixture '+route;hook(name,method,route);
 const n=add(name+' HTTP','httpRequest',{method,url:'http://127.0.0.1:18767'+destination,options:{timeout:10000,redirect:{redirect:{followRedirects:false}},response:{response:{responseFormat:'json'}}}},4.2);
 if(method==='POST')Object.assign(n.parameters,{sendBody:true,specifyBody:'json',jsonBody:'={{ $json.body }}'});
 connect(name,n.name);
}
hook('US3 inspected reset','POST','reset');
add('Validate US3 inspected reset','code',{mode:'runOnceForAllItems',jsCode:"const b=$input.first().json.body;if(!b||b.id!==1||typeof b.execution_id!=='string'||!b.execution_id||typeof b.reason!=='string'||b.reason.length<12)throw Error('Inspected completed fixture execution and reason required');return [{json:b}];"});connect('US3 inspected reset','Validate US3 inspected reset');
const reset=structuredClone(w.nodes.find(n=>n.name==='Release control'));reset.id='us3-explicit-reset';reset.name='US3 explicit fixture reset';reset.notes='TEST ONLY: explicit operator reset of an inspected completed synthetic failure; compares exact row and execution. Never on work/error paths.';reset.parameters.filters.conditions=[{keyName:'id',condition:'eq',keyValue:'={{ $json.id }}'},{keyName:'key',condition:'eq',keyValue:'global'},{keyName:'busy',condition:'isTrue'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $json.execution_id }}'}];reset.parameters.columns.value={busy:false};w.nodes.push(reset);connect('Validate US3 inspected reset',reset.name);
const output=JSON.stringify(w,null,2)+'\n';
const destination=mapping?'factory/local/us3/tracking-test-mapped.json':file;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(destination,'utf8'),output);else fs.writeFileSync(destination,output,{mode:0o600});
console.log('Tracking isolated copy: unchanged Code/connections; fixed loopback, no credentials, disabled schedule. SHA-256 '+crypto.createHash('sha256').update(output).digest('hex'));
