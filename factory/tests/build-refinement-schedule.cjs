// T031 offline test packaging only. Never imports, publishes or executes workflows.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const source=read('factory/workflows/refine.json'),bridge=read('factory/tests/refinement-bridge.json');
const {mapping}=require('./test-artifacts.cjs');
const {control}=mapping('US1');
const graph=structuredClone(source);graph.name='TEST ONLY — US1 scheduled refinement';graph.active=false;graph.pinData={};graph.settings=structuredClone(bridge.settings);
graph.nodes=graph.nodes.filter(n=>!n.type.endsWith('.manualTrigger'));delete graph.connections['Manual isolated test'];
const schedule=source.nodes.find(n=>n.type.endsWith('.scheduleTrigger'));assert(schedule);assert.deepEqual(source.connections[schedule.name].main[0],[{node:'Read control',type:'main',index:0}]);
for(const n of graph.nodes){
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId=structuredClone(control);
 if(n.type.endsWith('.httpRequest')){
  n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18765/github').replaceAll('https://generativelanguage.googleapis.com','http://127.0.0.1:18765/gemini');
  n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
  n.parameters.headerParameters.parameters.push({name:'X-US1-Case',value:'success'},{name:'X-US1-Run',value:'31001'},{name:'X-US1-Node',value:n.name},{name:'X-US1-Execution',value:'={{ $execution.id }}'});
  n.notes='T031 TEST ONLY: synthetic loopback HTTP, no credential. Session 31001 persists across scheduled executions; actual execution ID is logged separately. Source purpose follows.\n\n'+n.notes;
 }
}
schedule.notes='T031 uses this exact source Schedule Trigger and interval. Each tick enters Read control directly. Publish only in factory-guard-test, with every other schedule inactive.';
graph.nodes.find(n=>n.name===schedule.name).notes=schedule.notes;
// Separate operator inspection/reset endpoints; never on a scheduled completion/error path.
for(const name of ['Read isolated state','Read US1 fixture row','Report isolated state','Operator inspected reset','Validate inspected reset','Explicit isolated busy reset']){
 const n=structuredClone(bridge.nodes.find(x=>x.name===name));n.id='t031-'+n.id;
 if(n.type.endsWith('.webhook')){n.parameters.path=n.parameters.path.replace('basic-a-us1-test/','basic-a-us1-schedule/');n.webhookId='t031-'+n.webhookId;}
 graph.nodes.push(n);if(bridge.connections[name])graph.connections[name]=structuredClone(bridge.connections[name]);
}
const banner=graph.nodes.find(n=>n.name==='Review and isolated testing only');banner.parameters.content='## T031 TEST ONLY — scheduled entry\nExact source 60-second Schedule Trigger; synthetic HTTP only, no credentials. Session 31001 retains issue/comments across ticks. Operator adds revision after first success. Keep every other schedule inactive; unpublish/drain after unchanged poll. Never use production.';
for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(graph.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
for(const [name,connections] of Object.entries(source.connections))if(name!=='Manual isolated test')assert.deepEqual(graph.connections[name],connections);
assert.equal(graph.nodes.filter(n=>n.type.endsWith('.scheduleTrigger')).length,1);assert(!graph.nodes.some(n=>n.credentials));
for(const n of graph.nodes.filter(n=>n.type.endsWith('.dataTable')))n.parameters.dataTableId=structuredClone(control);
const publicGraph=structuredClone(graph);
for(const n of publicGraph.nodes.filter(n=>n.type.endsWith('.dataTable'))){const baseline=source.nodes.find(x=>x.name===n.name)??source.nodes.find(x=>x.name===(n.parameters.operation==='get'?'Read control':'Release control'));const original=n.parameters;n.parameters=structuredClone(baseline.parameters);if(n.name==='Explicit isolated busy reset'){n.parameters.filters=original.filters;n.parameters.columns.value=original.columns.value;}n.parameters.dataTableId={__rl:true,mode:'id',value:'OWNER_SELECT_ISOLATED_US1_CONTROL_TABLE'};}
const manifest={sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync('factory/workflows/refine.json')).digest('hex'),scheduleName:schedule.name,scheduleParameters:schedule.parameters,scheduleConnection:source.connections[schedule.name],sourceCodeBodiesUnchanged:source.nodes.filter(n=>n.type.endsWith('.code')).length,session:'31001',publicGraphSHA256:hash(publicGraph),active:false};
fs.mkdirSync('factory/local/refinement-native-bridge',{recursive:true});
const check=process.argv.includes('--check');function write(p,x){const s=JSON.stringify(x,null,2)+'\n';if(check)assert.equal(fs.readFileSync(p,'utf8'),s,p);else fs.writeFileSync(p,s,{mode:0o600});}
write('factory/tests/refinement-schedule.json',publicGraph);write('factory/tests/refinement-schedule-sources.json',manifest);write('factory/local/refinement-native-bridge/schedule-mapped.json',graph);
console.log(JSON.stringify(manifest));
