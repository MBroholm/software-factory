// Offline packaging of a credential-free isolated native-engine test copy. Never imports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const R=require('../scripts/refinement-runtime.cjs');
const source=JSON.parse(read('factory/workflows/refine.json'));
const {mapping}=require('./test-artifacts.cjs');
const {mapped:mappingReady,control}=mapping('US1');
const check=process.argv.includes('--check');
function write(file,body){if(check)assert.equal(fs.readFileSync(file,'utf8'),body,'Generated bridge differs: '+file);else fs.writeFileSync(file,body,{mode:0o600});}
const cases=['success','retry-once','retry-twice','exhaust','retry-after-long','retry-after-invalid','other-503','quota','auth','server-500','transport','invalid-output','truncated','missing-usage','count-error','count-invalid','over-budget','source-in-backoff','discussion-in-backoff','state-in-backoff','source-during-call','non-owner','pr','closed','approved','ready-unchanged','non-owner-discussion','factory-marker','reuse','revision','captured-edit','captured-delete','edited-marker','stranded','conflicting','pagination','later-candidate','unknown-post','partial-label','unexpected-before','unexpected-after','restart-backoff','cancel-backoff'];
const graph=structuredClone(source);
graph.name='TEST ONLY — Basic A US1 native fault bridge';graph.active=false;graph.settings={executionOrder:'v1',saveDataErrorExecution:'all',saveDataSuccessExecution:'all',saveManualExecutions:true};graph.pinData={};
graph.nodes=graph.nodes.filter(n=>!['n8n-nodes-base.manualTrigger','n8n-nodes-base.scheduleTrigger'].includes(n.type));
delete graph.connections['Manual isolated test'];delete graph.connections['Poll inactive'];
const B="$('US1 test entry').first().json.body";
for(const n of graph.nodes){
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId=structuredClone(control);
 if(n.type.endsWith('.httpRequest')){
   n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18765/github').replaceAll('https://generativelanguage.googleapis.com','http://127.0.0.1:18765/gemini');
   n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
   n.notes='TEST ONLY: this request uses synthetic loopback HTTP and has no saved credential. The following source-node purpose is simulated here.\n\n'+n.notes;
   n.parameters.headerParameters.parameters.push({name:'X-US1-Case',value:`={{ ${B}.case }}`},{name:'X-US1-Run',value:'={{ $execution.id }}'},{name:'X-US1-Node',value:n.name});
 }
 const injected={'Validate before Refining':'unexpected-before','Check comment receipt':'unexpected-after'}[n.name];
 if(injected){n.notes='TEST ONLY: adds an explicit exception for '+injected+'; otherwise preserves the original Code.\n\n'+n.notes;n.parameters.jsCode=`if (${B}.case === '${injected}') throw new Error('Injected US1 ${injected}');\n`+n.parameters.jsCode;}
}
function add(name,type,parameters,version=2,extra={}){
 const n={id:hash('us1-test:'+name).slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:version,parameters,position:[-1000,graph.nodes.length*100],notes:'Isolated US1 test harness only. '+name+'. No production or external API authority.',...extra};graph.nodes.push(n);return n;
}
function link(a,b){graph.connections[a]={main:[[{node:b,type:'main',index:0}]]};}
function hook(name,method,route){return add(name,'webhook',{httpMethod:method,path:'basic-a-us1-test/'+route,responseMode:'lastNode',options:{}},2.1,{webhookId:hash(name).slice(0,32)});}
hook('US1 test entry','POST','run');
add('Validate isolated case','code',{mode:'runOnceForAllItems',jsCode:`const b=$input.first().json.body; if(!b || !${JSON.stringify(cases)}.includes(b.case))throw new Error('Unknown isolated US1 case'); return $input.all();`});
link('US1 test entry','Validate isolated case');link('Validate isolated case','Read control');
hook('Read isolated state','GET','state');
const get=structuredClone(graph.nodes.find(n=>n.name==='Read control'));get.id=hash('fixture-state').slice(0,32);get.name='Read US1 fixture row';get.notes='Reads the actual isolated control table for operator inspection; no mutation.';graph.nodes.push(get);link('Read isolated state',get.name);
add('Report isolated state','code',{mode:'runOnceForAllItems',jsCode:'return [{json:{rows:$input.all().map(x=>x.json).filter(x=>Number.isInteger(x.id))}}];'});link(get.name,'Report isolated state');
hook('Operator inspected reset','POST','fixture');
add('Validate inspected reset','code',{mode:'runOnceForAllItems',jsCode:`const b=$input.first().json.body;if(!b || typeof b.reason!=='string' || b.reason.trim().length<12 || !Number.isInteger(b.id) || typeof b.expected_execution_id!=='string' || !b.expected_execution_id)throw new Error('Inspected row, execution and reason required');return [{json:b}];`});
link('Operator inspected reset','Validate inspected reset');
const reset=structuredClone(graph.nodes.find(n=>n.name==='Release control'));reset.id=hash('fixture-reset').slice(0,32);reset.name='Explicit isolated busy reset';reset.notes='Operator-only fixture action after inspecting a completed test and side effects. Compares row ID and expected execution; clears only busy. Never called by failure paths.';
reset.parameters.filters.conditions=[{keyName:'id',condition:'eq',keyValue:'={{ $json.id }}'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $json.expected_execution_id }}'},{keyName:'busy',condition:'isTrue'}];reset.parameters.columns.value={busy:false};graph.nodes.push(reset);link('Validate inspected reset',reset.name);
const positions={'US1 test entry':[-1800,-400],'Validate isolated case':[-1500,-400],'Read isolated state':[-1800,2200],'Read US1 fixture row':[-1500,2200],'Report isolated state':[-1200,2200],'Operator inspected reset':[-1800,2600],'Validate inspected reset':[-1500,2600],'Explicit isolated busy reset':[-1200,2600]};
for(const [name,position] of Object.entries(positions))graph.nodes.find(n=>n.name===name).position=position;
add('Isolated test boundary','stickyNote',{content:'## TEST ONLY: US1 fault validation\nSynthetic GitHub/Gemini HTTP on container loopback; no credentials or schedules. Native guard uses only the isolated US1 table. Operator reset is separate and requires inspected row context/reason. Never import into production.',width:650,height:260,color:3},1).position=[-1850,-800];
// All production transform Code bodies are unchanged except two explicitly prefixed fault points.
const pureCode=source.nodes.filter(n=>n.type.endsWith('.code')&&!['Validate before Refining','Check comment receipt'].includes(n.name));
for(const n of pureCode)assert.equal(graph.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
for(const [name,edges] of Object.entries(source.connections))if(graph.nodes.some(n=>n.name===name))assert.deepEqual(graph.connections[name],edges);
assert(!graph.nodes.some(n=>n.credentials || n.type.endsWith('.scheduleTrigger')));
for(const n of graph.nodes.filter(n=>n.type.endsWith('.httpRequest')))assert(!n.parameters.url.includes('https://'));
for(const n of graph.nodes.filter(n=>n.type.endsWith('.code')))new (Object.getPrototypeOf(async function(){}).constructor)(n.parameters.jsCode);
const issue=(number=101,labels=['Ideas','documentation'])=>({number,title:'Add a setup guide',body:'Change documentation only.',user:{id:R.OWNER_ID},state:'open',labels:labels.map(name=>({name}))});
const comment=(id,body,owner=R.OWNER_ID)=>({id,body,user:{id:owner},created_at:'2026-11-24T10:00:00Z',updated_at:'2026-11-24T10:00:00Z'});
const final={goal:'Add a setup guide.',rationale:'Reason not supplied.',constraints:['Change documentation only.'],acceptance_criteria:['The setup guide exists.'],questions:[]};
const model={candidates:[{finishReason:'STOP',content:{role:'model',parts:[{text:JSON.stringify(final)}]}}],usageMetadata:{promptTokenCount:1000,candidatesTokenCount:100,totalTokenCount:1100},modelVersion:'synthetic-fixture-only'};
const human=comment(10,'Keep the example short.');const priorIssue=issue(101,['Ready for approval','documentation']);
const plan={issue:priorIssue,meta:R.source(priorIssue,[human])};
const marked=comment(20,R.render(plan,R.validateOutput(model),read('factory/templates/task.md')));
const out='factory/local/refinement-native-bridge';fs.mkdirSync(path.join(root,out),{recursive:true});
write(path.join(root,out,'workflow.json'),JSON.stringify(graph,null,2)+'\n');
const publicGraph=structuredClone(graph);
for(const n of publicGraph.nodes.filter(n=>n.type.endsWith('.dataTable'))){
 const baseline=source.nodes.find(x=>x.name===n.name)??source.nodes.find(x=>x.name===(n.parameters.operation==='get'?'Read control':'Release control'));
 const original=n.parameters;n.parameters=structuredClone(baseline.parameters);
 if(n.name==='Explicit isolated busy reset'){n.parameters.filters=original.filters;n.parameters.columns.value=original.columns.value;}
 n.parameters.dataTableId={__rl:true,mode:'id',value:'OWNER_SELECT_ISOLATED_US1_CONTROL_TABLE'};
}
write(path.join(root,'factory/tests/refinement-bridge.json'),JSON.stringify(publicGraph,null,2)+'\n');
const config={sourceSHA256:hash(read('factory/workflows/refine.json')),cases,issue:issue(),priorIssue,human,marked,model,owner:R.OWNER_ID};
write(path.join(root,out,'fixtures.json'),JSON.stringify(config,null,2)+'\n');
const manifest={sourceSHA256:config.sourceSHA256,bridgeSHA256:hash(JSON.stringify(graph,null,2)+'\n'),cases,tableMappingFrom:'explicit test configuration with --mapped/--env; otherwise placeholder',productionCodeBodiesUnchanged:pureCode.length,faultPrefixes:['Validate before Refining','Check comment receipt'],httpChanges:['loopback URL base','no credentials','three fixture headers'],nativeTypesRetained:['HTTP Request','Data Table','Code','IF','Split In Batches','Wait'],noSchedules:true,active:false};
write(path.join(root,out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const {bridgeSHA256,...publicManifest}=manifest;write(path.join(root,'factory/tests/refinement-bridge-sources.json'),JSON.stringify({...publicManifest,publicBridgeSHA256:hash(JSON.stringify(publicGraph,null,2)+'\n')},null,2)+'\n');
console.log(JSON.stringify({artifact:out+'/workflow.json',mappingReady,cases:cases.length,nodes:graph.nodes.length,sourceSHA256:config.sourceSHA256,bridgeSHA256:manifest.bridgeSHA256}));
