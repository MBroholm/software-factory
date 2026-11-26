// T032 offline packaging only; no import, activation, HTTP or guard mutation.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=read('factory/workflows/reserve.json');
const bridge=read('factory/tests/reservation-bridge.json');
const {mapping}=require('./test-artifacts.cjs');
const {control}=mapping('US2');
const graph=structuredClone(source);
graph.name='TEST ONLY — US2 scheduled reservation';graph.active=false;graph.pinData={};
graph.nodes=graph.nodes.filter(n=>!n.type.endsWith('.manualTrigger'));
delete graph.connections['Manual isolated test'];
const session='32001';
for(const n of graph.nodes){
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId=structuredClone(control);
 if(n.type.endsWith('.httpRequest')){
  n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18766/github');
  n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
  n.parameters.headerParameters.parameters.push({name:'X-US2-Case',value:'success'},{name:'X-US2-Run',value:session},{name:'X-US2-Node',value:n.name});
  n.notes='T032 TEST ONLY: credential-free loopback HTTP. Persistent synthetic session 32001 spans ticks. '+n.notes;
 }
}
const schedule=graph.nodes.find(n=>n.type.endsWith('.scheduleTrigger'));
assert(schedule&&!schedule.disabled);
schedule.notes='T032: exact source Schedule Trigger/60-second interval enters the unchanged guard. Owner publishes only this isolated test schedule after reviewed manual import and inspected hold recovery.';
for(const name of ['Read US2 isolated state','Read US2 fixture row','Report US2 isolated state','US2 inspected fixture reset','Validate US2 inspected reset','US2 explicit isolated busy reset']){
 const n=structuredClone(bridge.nodes.find(x=>x.name===name));assert(n);n.id='t032-'+n.id;
 if(n.type.endsWith('.webhook')){n.parameters.path=n.parameters.path.replace('basic-a-us2-test/','basic-a-us2-schedule/');n.webhookId='t032-'+n.webhookId;}
 graph.nodes.push(n);if(bridge.connections[name])graph.connections[name]=structuredClone(bridge.connections[name]);
}
graph.nodes.find(n=>n.name==='Owner review and manual import').parameters.content='## T032 TEST ONLY — scheduled reservation\nExact source schedule and Code; persistent synthetic HTTP session 32001, no credentials. Owner manually imports into factory-guard-test only. Inspect retained 1369 hold before deliberate recovery. No other schedule or manual mutator may run. Unpublish/drain after successful reservation and occupied-slot poll.';
for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(graph.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
for(const [name,edges]of Object.entries(source.connections))if(name!=='Manual isolated test')assert.deepEqual(graph.connections[name],edges);
assert.deepEqual(schedule.parameters,source.nodes.find(n=>n.name===schedule.name).parameters);
assert(!graph.nodes.some(n=>n.credentials||n.type.endsWith('.manualTrigger')));
for(const n of graph.nodes.filter(n=>n.type.endsWith('.httpRequest'))){assert(n.parameters.url.includes('http://127.0.0.1:18766/github'));assert(!n.parameters.url.includes('https://'));assert(!n.retryOnFail);}
for(const n of graph.nodes.filter(n=>n.type.endsWith('.dataTable')))n.parameters.dataTableId=structuredClone(control);
const publicGraph=structuredClone(graph);
for(const n of publicGraph.nodes.filter(n=>n.type.endsWith('.dataTable')))n.parameters.dataTableId={__rl:true,mode:'id',value:'OWNER_SELECT_ISOLATED_US2_CONTROL_TABLE'};
const manifest={sourceSHA256:hash(fs.readFileSync('factory/workflows/reserve.json')),sourceCodeBodiesUnchanged:source.nodes.filter(n=>n.type.endsWith('.code')).length,sourceConnectionsPreserved:true,scheduleParameters:schedule.parameters,session,syntheticOnly:true,active:false,publicGraphSHA256:hash(JSON.stringify(publicGraph,null,2)+'\n')};
fs.mkdirSync('factory/local/us2/native-bridge',{recursive:true});
const dir='factory/local/us2/native-bridge';
for(const [path,value]of Object.entries({'factory/tests/reservation-schedule.json':publicGraph,'factory/tests/reservation-schedule-sources.json':manifest,[dir+'/schedule-mapped.json']:graph})){
 const text=JSON.stringify(value,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),text,path);else fs.writeFileSync(path,text,{mode:0o600});
}
console.log(JSON.stringify(manifest));
