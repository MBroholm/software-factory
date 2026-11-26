// Offline, credential-free packaging of the finished reserve graph for T019 faults.
// Never imports, activates, calls APIs or resets a flag.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const R=require('../scripts/refinement-runtime.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const source=JSON.parse(read('factory/workflows/reserve.json'));
const {mapping,readGenerated}=require('./test-artifacts.cjs');
const {control}=mapping('US2');
const cases=['success','occupied','closed-building','nonowner-building','conflicting-building','non-owner','no-approval','wrong-approval','captured-edit','unexpected-before','unexpected-after','partial-label','unknown-post','restart-reservation'];
const graph=structuredClone(source);graph.name='TEST ONLY — Basic A US2 native fault bridge';graph.active=false;graph.pinData={};
graph.nodes=graph.nodes.filter(n=>n.name!=='Manual isolated test');delete graph.connections['Manual isolated test'];
for(const n of graph.nodes){
 if(n.name==='Owner review and manual import')n.parameters.content='## TEST ONLY — owner review and manual import\nImport as a NEW workflow into factory-guard-test only. Nine Data Table nodes share the existing isolated table; all HTTP nodes use fixed loopback fixture URLs and NO credentials. Keep Poll inactive disabled during manual cases. Publish only this test bridge for private webhooks after review; see factory/tests/reservation-bridge.md.';
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId=structuredClone(control);
 if(n.type.endsWith('.httpRequest')){
  n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18766/github');
  n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
  n.parameters.headerParameters.parameters.push({name:'X-US2-Case',value:"={{ $('US2 test entry').first().json.body.case }}"},{name:'X-US2-Run',value:'={{ $execution.id }}'},{name:'X-US2-Node',value:n.name});
  n.notes='TEST ONLY: fixed synthetic loopback HTTP, no credentials or real GitHub calls. '+n.notes;
 }
 const fault={'Prepare handoff':'unexpected-before','Check handoff receipt':'unexpected-after'}[n.name];
 if(fault){n.parameters.jsCode=`if ($('US2 test entry').first().json.body.case === '${fault}') throw new Error('Injected US2 ${fault}');\n`+n.parameters.jsCode;n.notes='TEST ONLY: explicit '+fault+' exception prefix; other cases retain source Code. '+n.notes;}
 if(n.type.endsWith('.scheduleTrigger')){n.disabled=true;n.notes='TEST ONLY: disabled during manual cases. Owner may enable/publish ONLY after the final suite leaves busy=true, to observe a native scheduled held skip; never run manual cases concurrently. '+n.notes;}
}
function add(name,type,parameters,notes,version=2,extra={}){const n={id:hash('us2-test:'+name).slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:version,position:[-1700,graph.nodes.length*20],parameters,notes,...extra};graph.nodes.push(n);return n;}
function connect(a,b){graph.connections[a]={main:[[{node:b,type:'main',index:0}]]};}
function hook(name,method,path){return add(name,'webhook',{httpMethod:method,path:'basic-a-us2-test/'+path,responseMode:'lastNode',options:{}},'Isolated operator endpoint on the existing private test instance; no production authority.',2.1,{webhookId:hash(name).slice(0,32)});}
hook('US2 test entry','POST','run');
add('Validate isolated US2 case','code',{mode:'runOnceForAllItems',jsCode:`const b=$input.first().json.body;if(!b||!${JSON.stringify(cases)}.includes(b.case))throw Error('Unknown isolated US2 case');return $input.all();`},'Whitelist the synthetic case before entering the unchanged shared guard.');
connect('US2 test entry','Validate isolated US2 case');connect('Validate isolated US2 case','Read control');
hook('Read US2 isolated state','GET','state');
const get=structuredClone(graph.nodes.find(n=>n.name==='Read control'));get.name='Read US2 fixture row';get.id=hash(get.name).slice(0,32);get.notes='Read only the mapped isolated table for operator inspection. No reset or execution.';get.position=[-1400,2800];graph.nodes.push(get);connect('Read US2 isolated state',get.name);
add('Report US2 isolated state','code',{mode:'runOnceForAllItems',jsCode:'return [{json:{rows:$input.all().map(x=>x.json).filter(x=>Number.isInteger(x.id))}}];'},'Return control-row diagnostics for explicit operator checks.');connect(get.name,'Report US2 isolated state');
hook('US2 inspected fixture reset','POST','fixture');
add('Validate US2 inspected reset','code',{mode:'runOnceForAllItems',jsCode:"const b=$input.first().json.body;if(!b||typeof b.reason!=='string'||b.reason.trim().length<12||!Number.isInteger(b.id)||typeof b.expected_execution_id!=='string'||!b.expected_execution_id)throw Error('Inspected row, expected execution and reason required');return [{json:b}];"},'Separate operator-only fixture reset after a completed inspected synthetic failure. Never connected to run/error/cleanup paths.');connect('US2 inspected fixture reset','Validate US2 inspected reset');
const reset=structuredClone(graph.nodes.find(n=>n.name==='Release control'));reset.name='US2 explicit isolated busy reset';reset.id=hash(reset.name).slice(0,32);reset.position=[-1400,3400];reset.notes='Explicit fixture action compares global row ID, busy and inspected execution. Clears only busy, preserving diagnostics. No automatic failure cleanup.';
reset.parameters.filters.conditions=[{keyName:'id',condition:'eq',keyValue:'={{ $json.id }}'},{keyName:'key',condition:'eq',keyValue:'global'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $json.expected_execution_id }}'},{keyName:'busy',condition:'isTrue'}];reset.parameters.columns.value={busy:false};graph.nodes.push(reset);connect('Validate US2 inspected reset',reset.name);
const positions={'US2 test entry':[-1800,0],'Validate isolated US2 case':[-1500,0],'Read US2 isolated state':[-1800,2800],'Report US2 isolated state':[-1100,2800],'US2 inspected fixture reset':[-1800,3400],'Validate US2 inspected reset':[-1500,3200]};for(const [name,pos]of Object.entries(positions))graph.nodes.find(n=>n.name===name).position=pos;
add('5. Isolated fixture boundary','stickyNote',{content:'## 5. TEST ONLY: US2 faults\nFixed loopback synthetic GitHub at port 18766. No credentials. Unchanged source Code/connections except documented exception prefixes and operator entry/state/reset paths. Schedule trigger DISABLED until final busy hold; owner enables only to verify scheduled skip. Never import into production. Operator reset is separate and must follow inspection of a completed fixture.',width:700,height:340,color:3},undefined,1).position=[-1900,-600];
for(const n of source.nodes.filter(n=>n.type.endsWith('.code'))){const actual=graph.nodes.find(x=>x.name===n.name);if(!['Prepare handoff','Check handoff receipt'].includes(n.name))assert.equal(actual.parameters.jsCode,n.parameters.jsCode);else assert(actual.parameters.jsCode.endsWith(n.parameters.jsCode));}
for(const [name,edges]of Object.entries(source.connections))if(name!=='Manual isolated test')assert.deepEqual(graph.connections[name],edges);
const time='2026-11-25T10:00:00Z';
function fixtureIssue(number){const i={number,title:'Synthetic documentation task',body:'Only document setup.',user:{id:R.OWNER_ID},state:'open',labels:[{name:'Approved'},{name:'documentation'}]};const human={id:10,body:'Keep the example short.',user:{id:R.OWNER_ID},created_at:time,updated_at:time};const content='Synthetic goal, constraints and checkable acceptance criteria.';const meta={...R.source(i,[human]),content_sha256:R.sha256(content)};const refined={id:20,body:`<!-- factory:refinement:v1 ${JSON.stringify(meta)} -->\n${content}`,html_url:`https://github.com/${R.REPOSITORY}/issues/${number}#issuecomment-20`,user:{id:R.OWNER_ID},created_at:time,updated_at:time};const event={id:30,event:'labeled',label:{name:'Approved'},actor:{id:R.OWNER_ID},created_at:'2026-11-25T11:00:00Z'};return {issue:i,comments:[human,refined],events:[event]};}
const dir='factory/local/us2/native-bridge';fs.mkdirSync(dir,{recursive:true});
const config={sourceSHA256:hash(read('factory/workflows/reserve.json')),owner:R.OWNER_ID,cases,fixtures:[fixtureIssue(101),fixtureIssue(102)]};
const out=JSON.stringify(graph,null,2)+'\n';const publicGraph=structuredClone(graph);for(const n of publicGraph.nodes.filter(n=>n.type.endsWith('.dataTable')))n.parameters.dataTableId={__rl:true,mode:'id',value:'OWNER_SELECT_ISOLATED_US2_CONTROL_TABLE'};
const outputs={[dir+'/workflow.json']:out,[dir+'/fixtures.json']:JSON.stringify(config,null,2)+'\n','factory/tests/reservation-bridge.json':JSON.stringify(publicGraph,null,2)+'\n'};
const manifest={sourceSHA256:config.sourceSHA256,mappedBridgeSHA256:hash(out),publicBridgeSHA256:hash(outputs['factory/tests/reservation-bridge.json']),cases,sourceCodeBodies:source.nodes.filter(n=>n.type.endsWith('.code')).length,faultPrefixes:['Prepare handoff','Check handoff receipt'],syntheticOnly:true,scheduledEntryInitiallyDisabled:true,active:false};const {mappedBridgeSHA256,...publicManifest}=manifest;outputs['factory/tests/reservation-bridge-sources.json']=JSON.stringify(publicManifest,null,2)+'\n';outputs[dir+'/manifest.json']=JSON.stringify(manifest,null,2)+'\n';
// Reuse source checker's synthetic contexts; extend only the new fixed fixture headers.
const fixturePath='factory/local/reservation-native-expression-fixtures.json';
if(process.argv.includes('--native-fixtures')){
 const original=JSON.parse(readGenerated(fixturePath,'node factory/tests/check-reservation.cjs --native-fixtures')),by=new Map(graph.nodes.map(n=>[n.name,n]));
 const contexts=original.fixtures.filter(f=>by.has(f.node)),added=[];
 for(const f of contexts.filter(f=>f.path==='url'&&by.get(f.node).type.endsWith('.httpRequest'))){
  by.get(f.node).parameters.headerParameters.parameters.forEach((p,i)=>{
   if(!p.name.startsWith('X-US2'))return;
   const expected={'X-US2-Case':'success','X-US2-Run':'reserve-test','X-US2-Node':f.node}[p.name];
   const runData=structuredClone(f.runData);runData['US2 test entry']=[{data:{main:[[{json:{body:{case:'success'}}}]]},executionStatus:'success',startTime:0,executionTime:0,source:[]}];
   added.push({...f,label:'bridge-'+f.label,path:`headerParameters.parameters.${i}.value`,runData,expected});
  });
 }
 for(const f of contexts)if(f.path==='url'&&typeof f.expected==='string')f.expected=f.expected.replaceAll('https://api.github.com','http://127.0.0.1:18766/github');
 outputs[dir+'/expression-fixtures.json']=JSON.stringify({graph,fixtures:[...contexts,...added]});
}
for(const [file,text]of Object.entries(outputs)){if(process.argv.includes('--check'))assert.equal(read(file),text,'Stale '+file);else fs.writeFileSync(file,text,{mode:0o600});}
console.log(JSON.stringify({artifact:dir+'/workflow.json',...manifest}));
