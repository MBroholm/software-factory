// Local policy and exported graph checks. Native n8n evidence remains T019.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../scripts/refinement-runtime.cjs');
const policy=fs.readFileSync('factory/scripts/reservation-runtime.cjs','utf8').split('module.exports =')[0];
const P=vm.runInNewContext(`(()=>{${fs.readFileSync('factory/scripts/refinement-runtime.cjs','utf8').split('function analyze(')[0]}\n${policy}\nreturn {reservationCandidates,approval,sameApproval,baseline,checkHandoffs,handoff};})()`);
const clone=x=>JSON.parse(JSON.stringify(x));
const issue={number:1,title:'A guide',body:'Document only',user:{id:R.OWNER_ID},state:'open',labels:[{name:'Approved'},{name:'documentation'}]};
const time='2026-11-25T10:00:00Z',later='2026-11-25T11:00:00Z';
// Exported Code uses Date for guard/handoff timestamps. Freeze the fixture clock so
// regeneration/checking does not depend on when the test process runs.
class FixtureDate extends Date {constructor(...args){super(...(args.length?args:[later]));}static now(){return Date.parse(later);}}
const human={id:2,user:{id:R.OWNER_ID},body:'Keep it short',created_at:time,updated_at:time};
const meta={...R.source(issue,[human]),content_sha256:R.sha256('Guide')};
const refinement={id:3,user:{id:R.OWNER_ID},body:`<!-- factory:refinement:v1 ${JSON.stringify(meta)} -->\nGuide`,created_at:time,updated_at:time,html_url:'https://github.com/MBroholm/software-factory/issues/1#issuecomment-3'};
const comments=[human,refinement],events=[{id:4,event:'labeled',label:{name:'Approved'},actor:{id:R.OWNER_ID},created_at:later}];
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('valid owner approval and later session summary',()=>{const p=P.approval(issue,[...comments,{...human,id:8,body:'Session answer'}],events);assert.equal(p.approval_event_id,4);assert.equal(p.refinement_comment_id,3);});
for(const [name,edit] of [
 ['non-owner',f=>f.issue.user.id=9],['closed',f=>f.issue.state='closed'],['PR object',f=>f.issue.pull_request={}],
 ['conflicting labels',f=>f.issue.labels.push({name:'Ideas'})],['missing history',f=>f.events=[]],
 ['wrong approver',f=>f.events[0].actor.id=9],['later removal',f=>f.events.push({...f.events[0],id:5,event:'unlabeled'})],
 ['refinement after approval',f=>f.events[0].created_at=time],['edited refinement',f=>f.comments[1].updated_at=later],
 ['edited source',f=>f.comments[0].body='expanded'],['deleted source',f=>f.comments.shift()],
 ['changed title',f=>f.issue.title='New scope'],['invalid content digest',f=>f.comments[1].body+='!'],
 ['duplicate comments',f=>f.comments.push(f.comments[0])],['duplicate events',f=>f.events.push(f.events[0])]
])test('reject '+name,()=>{const f=clone({issue,comments,events});edit(f);assert.throws(()=>P.approval(f.issue,f.comments,f.events));});
test('single slot blocks even closed/non-owner/conflicting Building',()=>{for(const extra of [{state:'closed'},{user:{id:9}},{labels:[{name:'Building'},{name:'Done'}]}])assert.equal(P.reservationCandidates([issue,{...issue,number:2,labels:[{name:'Building'}],...extra}]).length,0);});
test('lowest number and non-owner exclusion',()=>assert.equal(P.reservationCandidates([{...issue,number:6},issue,{...issue,number:0,user:{id:9}}])[0].number,1));
test('handoff records exact approval and PR baseline',()=>{const p=P.approval(issue,comments,events);const h=P.handoff(p,[{number:7,head:{repo:{full_name:R.REPOSITORY},ref:'issue-1',sha:'a'.repeat(40)},base:{ref:'main'},state:'closed'}],later);assert.equal(h.metadata.baseline_prs[0].number,7);assert(h.body.includes('No agent was launched'));assert.throws(()=>P.checkHandoffs([{...human,body:h.body}],p));P.sameApproval(p,clone(p));assert.throws(()=>P.sameApproval(p,{...p,approval_event_id:5}));});
// Basic B retains this historical policy, but uses its own asynchronous graph harness.
if(process.argv.includes('--policy-only')) {console.log(`${count} historical reservation policy groups passed; exported Basic A graph checks not selected.`);process.exit(0);}
const graph=JSON.parse(fs.readFileSync('factory/workflows/reserve.json','utf8'));
test('US2 graph replaces skeleton and remains inactive',()=>{assert.equal(graph.active,false);assert(!graph.nodes.some(n=>n.name==='Skeleton work boundary'));assert(graph.nodes.some(n=>n.name==='Post handoff'));});
console.log(`${count} local scenario groups passed; native/import/live checks UNRUN.`);
const nodes=new Map(graph.nodes.map(n=>[n.name,n]));
const nativeFixtures=[];
function run({issues=[clone(issue)],discussion=clone(comments),history=clone(events),row={id:1,key:'global',busy:false,execution_id:'',issue_number:null,started_at:''},fault,start='Manual isolated test'}={}) {
 const outputs=new Map(),trace=[],calls=[],runData={};let name=start,input=[{json:{}}],error=null,previous=null;
 const env=()=>({Date:FixtureDate,$json:input[0]?.json,$input:{all:()=>input,first:()=>input[0]},$execution:{id:'reserve-test'},$:ref=>({first:()=>outputs.get(ref)?.[0],all:()=>outputs.get(ref)??[]})});
 const evaluate=v=>typeof v==='string'&&v.startsWith('={{')?vm.runInNewContext(`(${v.slice(3,-2).trim()})`,env()):v;
 try{for(let step=0;name;step++){
  assert(step<100);trace.push(name);const n=nodes.get(name),p=n.parameters;let result=input,branch=0;
  if(fault?.at===name&&fault.before)fault.before({issues,discussion,history,row});
  if(fault?.at===name&&fault.throw)throw Error('Injected failure');
  if(process.argv.includes('--native-fixtures') && !fault) {
   const collect=(value,path=[])=>{if(path.includes('pagination'))return;
    if(typeof value==='string'&&value.startsWith('={{'))nativeFixtures.push({label:start,node:name,path:path.join('.'),runIndex:0,expected:clone(evaluate(value)),input:clone(input),runData:clone(runData),source:previous?{previousNode:previous,previousNodeOutput:0,previousNodeRun:0}:null});
    else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))collect(v,[...path,k]);};collect(p);
  }
  if(n.type.endsWith('.code'))result=vm.runInNewContext(`(()=>{${p.jsCode}\n})()`,env(),{timeout:1000});
  else if(n.type.endsWith('.if'))branch=evaluate(p.conditions.conditions[0].leftValue)?0:1;
  else if(n.type.endsWith('.dataTable')){
   let selected=row?[row]:[];
   if(p.operation==='update'){
    selected=selected.filter(r=>p.filters.conditions.every(c=>c.condition==='isTrue'?r[c.keyName]===true:c.condition==='isFalse'?r[c.keyName]===false:String(r[c.keyName])===String(evaluate(c.keyValue))));
    for(const r of selected)for(const [k,v]of Object.entries(p.columns.value))r[k]=evaluate(v);
   }
   result=selected.length?selected.map(r=>({json:clone(r)})):[{json:{}}];
  }else if(n.type.endsWith('.httpRequest')){
   const url=evaluate(p.url),body=p.sendBody?evaluate(p.jsonBody):null;calls.push({name,url,method:p.method,body});
   const number=Number(url.match(/\/issues\/(\d+)/)?.[1]),target=issues.find(i=>i.number===number);let data,statusCode=200;
   if(url.includes('/issues?'))data=issues;
   else if(url.includes('/pulls?'))data=[];
   else if(url.endsWith('/events'))data=history;
   else if(url.endsWith('/comments')&&p.method==='GET')data=discussion;
   else if(url.endsWith('/comments')){data={id:10,user:{id:R.OWNER_ID},body:body.body,created_at:later,updated_at:later};discussion.push(data);statusCode=201;}
   else if(url.endsWith('/labels')){target.labels.push({name:'Building'});data=target.labels;history.push({id:5,event:'labeled',label:{name:'Building'},actor:{id:R.OWNER_ID},created_at:later});}
   else if(p.method==='DELETE'){target.labels=target.labels.filter(l=>l.name!=='Approved');data=target.labels;history.push({id:6,event:'unlabeled',label:{name:'Approved'},actor:{id:R.OWNER_ID},created_at:later});}
   else data=target;
   result=[{json:{statusCode,body:clone(data),headers:{}}}];
   if(fault?.at===name&&fault.after)throw Error('Unknown response after effect');
  }
  if(fault?.at===name&&fault.result)result=fault.result(result);
  outputs.set(name,result);runData[name]=[{data:{main:[clone(result)]},executionStatus:'success',startTime:0,executionTime:0,source:[]}];previous=name;const next=graph.connections[name]?.main?.[branch]??[];assert(next.length<=1);name=next[0]?.node;input=result;
 }}catch(e){error=e;}
 return {row,issues,discussion,history,trace,calls,error,output:input};
}
test('exported graph success releases busy while Building and handoff persist',()=>{
 const r=run();assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);assert.equal(r.row.issue_number,1);assert.equal(R.state(r.issues[0]),'Building');assert(r.issues[0].labels.some(l=>l.name==='documentation'));assert.equal(r.discussion.filter(c=>c.body.startsWith('<!-- factory:handoff')).length,1);
 const again=run({issues:r.issues,discussion:r.discussion,history:r.history,row:r.row});assert.equal(again.error,null);assert.equal(again.output[0].json.outcome,'no_work');assert(!again.calls.some(c=>c.method!=='GET'));
});
test('scheduled entry uses same success guard path',()=>{const r=run({start:'Poll inactive'});assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);assert.equal(R.state(r.issues[0]),'Building');});
test('missing control and failed acquire prevent HTTP work',()=>{for(const args of [{row:null},{fault:{at:'Acquire control',throw:true}}]){const r=run(args);assert(r.error);assert.equal(r.calls.length,0);assert(!r.trace.includes('Release control'));}});
test('exported no-work paths release acquired guard',()=>{for(const issues of [[],[{...clone(issue),labels:[{name:'Building'}]}],[{...clone(issue),user:{id:9}}]]){const r=run({issues});assert.equal(r.error,null);assert.equal(r.row.busy,false);assert.equal(r.output[0].json.outcome,'no_work');}});
test('held entry preserves context and makes no HTTP calls',()=>{const row={id:1,key:'global',busy:true,execution_id:'prior',issue_number:5,started_at:time};const r=run({row:clone(row)});assert.equal(r.error,null);assert.deepEqual(r.row,row);assert.equal(r.calls.length,0);});
for(const fault of [{at:'Validate approval',throw:true},{at:'Add Building',after:true},{at:'Remove Approved',after:true},{at:'Post handoff',after:true},{at:'Final validation',throw:true},{at:'Release control',throw:true},{at:'Check acquire receipt',throw:true},{at:'Read before release',throw:true},{at:'Recheck comments',before:({discussion})=>discussion[0].body='expanded'}]){
 test('exported failure holds: '+fault.at,()=>{const r=run({fault});assert(r.error);assert.equal(r.row.busy,true);assert(!r.trace.includes('Report completion'));const before=JSON.stringify(r.row);const held=run({issues:r.issues,discussion:r.discussion,history:r.history,row:r.row});assert.equal(held.error,null);assert.equal(JSON.stringify(held.row),before);assert.equal(held.calls.length,0);});
}
test('exported HTTP pages reject partial/error responses before writes',()=>{for(const json of [{statusCode:403,body:[],headers:{}},{statusCode:200,body:[],headers:{link:'<next>; rel="next"'}}]){const r=run({fault:{at:'Discover all issues',result:()=>[{json}]}});assert(r.error);assert.equal(r.row.busy,true);assert.equal(r.calls.length,1);}});
test('graph boundaries, notes and no write retries',()=>{for(const n of nodes.values()){
 if(!n.type.endsWith('.stickyNote'))assert(n.notes?.trim(),n.name);
 assert(!n.retryOnFail&&!n.continueOnFail&&!n.disabled);
 assert(!n.onError||n.onError==='stopWorkflow');
 if(n.type.endsWith('.httpRequest')){assert.equal(n.executeOnce,true);assert.equal(n.parameters.options.redirect.redirect.followRedirects,false);if(n.parameters.method==='POST'&&n.name==='Add Building')assert.equal(n.parameters.jsonBody,'={{ {labels:["Building"]} }}');}
 for(const branch of graph.connections[n.name]?.main??[])for(const edge of branch)assert(nodes.has(edge.node));
}});
console.log(`${count} total local policy/exported graph groups passed; native Data Table/VM/live evidence UNRUN.`);

if(process.argv.includes('--native-fixtures')) {
 fs.mkdirSync('factory/local',{recursive:true});
 fs.writeFileSync('factory/local/reservation-native-expression-fixtures.json',JSON.stringify({graph,fixtures:nativeFixtures}));
 console.log(`Prepared ${nativeFixtures.length} synthetic native VM parameter contexts`);
}
