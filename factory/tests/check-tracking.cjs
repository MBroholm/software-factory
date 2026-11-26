const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../scripts/refinement-runtime.cjs');
const text=p=>fs.readFileSync(p,'utf8');
const P=vm.runInNewContext(`(()=>{${text('factory/scripts/refinement-runtime.cjs').split('function analyze(')[0]}${text('factory/scripts/reservation-runtime.cjs').split('module.exports =')[0]}${text('factory/scripts/tracking-runtime.cjs').split('module.exports =')[0]}return {approval,handoff,trackingPlan,trackingCandidates};})()`);
const clone=x=>JSON.parse(JSON.stringify(x));
const time='2026-11-25T10:00:00Z',approved='2026-11-25T11:00:00Z',later='2026-11-25T12:00:00Z';
const issue={number:1,title:'A guide',body:'Document only',user:{id:R.OWNER_ID},state:'open',labels:[{name:'Building'},{name:'documentation'}]};
const human={id:2,user:{id:R.OWNER_ID},body:'Keep short',created_at:time,updated_at:time};
const meta={...R.source(issue,[human]),content_sha256:R.sha256('Guide')};
const refinement={id:3,user:{id:R.OWNER_ID},body:`<!-- factory:refinement:v1 ${JSON.stringify(meta)} -->\nGuide`,created_at:time,updated_at:time,html_url:'https://github.com/MBroholm/software-factory/issues/1#issuecomment-3'};
const events=[{id:4,event:'labeled',label:{name:'Approved'},actor:{id:R.OWNER_ID},created_at:approved},{id:5,event:'unlabeled',label:{name:'Approved'},actor:{id:R.OWNER_ID},created_at:later}];
const plan=P.approval(issue,[human,refinement],events,'Building');
const handoff={...human,id:6,body:P.handoff(plan,[],later).body,created_at:later,updated_at:later};
const comments=[human,refinement,handoff];
const prs=[{number:7,head:{repo:{full_name:R.REPOSITORY},ref:'issue-1',sha:'a'.repeat(40)},base:{repo:{full_name:R.REPOSITORY},ref:'main'},body:'Refs #1',state:'open',merged:false,merged_at:null,created_at:'2026-11-25T13:00:00Z',updated_at:'2026-11-25T13:00:00Z'}];
const graph=JSON.parse(text('factory/workflows/track.json'));
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const nodes=new Map(graph.nodes.map(n=>[n.name,n]));
const nativeFixtures=[];
function run({issues=[clone(issue)],discussion=clone(comments),history=clone(events),pulls=clone(prs),row={id:1,key:'global',busy:false,execution_id:'',issue_number:null,started_at:''},fault,start='Manual isolated test'}={}) {
 const outputs=new Map(),trace=[],calls=[],runData={};let name=start,input=[{json:{}}],error=null,previous=null;
 const env=()=>({$json:input[0]?.json,$input:{all:()=>input,first:()=>input[0]},$execution:{id:'track-test'},$:ref=>({first:()=>outputs.get(ref)?.[0],all:()=>outputs.get(ref)??[]})});
 const evaluate=v=>typeof v==='string'&&v.startsWith('={{')?vm.runInNewContext(`(${v.slice(3,-2).trim()})`,env()):v;
 try{for(let step=0;name;step++){
  assert(step<100);trace.push(name);const n=nodes.get(name),p=n.parameters;let result=input,branch=0;
  if(fault?.at===name&&fault.before)fault.before({issues,discussion,history,pulls,row});
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
   else if(url.includes('/pulls?'))data=pulls;
   else if(url.match(/\/pulls\/\d+$/))data=pulls.find(p=>p.number===Number(url.split('/').at(-1)));
   else if(url.endsWith('/events'))data=history;
   else if(url.endsWith('/comments')&&p.method==='GET')data=discussion;
   else if(url.endsWith('/comments')){data={id:100,user:{id:R.OWNER_ID},body:body.body,created_at:later,updated_at:later};discussion.push(data);statusCode=201;}
   else if(url.endsWith('/labels')){target.labels.push({name:body.labels[0]});data=target.labels;}
   else if(p.method==='DELETE'){target.labels=target.labels.filter(l=>l.name!==decodeURIComponent(url.split('/').at(-1)));data=target.labels;}
   else data=target;
   result=[{json:{statusCode,body:clone(data),headers:{}}}];
   if(fault?.at===name&&fault.after)throw Error('Unknown response after effect');
  }
  if(fault?.at===name&&fault.result)result=fault.result(result);
  outputs.set(name,result);runData[name]=[{data:{main:[clone(result)]},executionStatus:'success',startTime:0,executionTime:0,source:[]}];previous=name;const next=graph.connections[name]?.main?.[branch]??[];assert(next.length<=1);name=next[0]?.node;input=result;
 }}catch(e){error=e;}
 return {row,issues,discussion,history,trace,calls,error,output:input,pulls};
}
test('open result QA then repeated poll has no writes/duplicate marker',()=>{const r=run();assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);assert.equal(R.state(r.issues[0]),'Your QA');assert.equal(r.discussion.length,4);const a=run(r);assert.equal(a.error,null,a.error?.stack);assert.equal(a.calls.filter(c=>c.method!=='GET').length,0);});
test('PR arriving after a no-result read waits for next poll without holding busy',()=>{
 const r=run({pulls:[],fault:{at:'Read ready',before:({pulls})=>pulls.push(clone(prs[0]))}});
 assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);
 assert.equal(R.state(r.issues[0]),'Building');assert(!r.calls.some(c=>c.method!=='GET'));
 assert(!r.trace.includes('Recheck issue'));assert(!r.trace.includes('Final issue'));
 const next=run(r);assert.equal(next.error,null,next.error?.stack);
 assert.equal(next.row.busy,false);assert.equal(R.state(next.issues[0]),'Your QA');
 assert.equal(next.discussion.filter(c=>c.body.startsWith('<!-- factory:result:v1')).length,1);
 const unchanged=run(next);assert.equal(unchanged.error,null,unchanged.error?.stack);
 assert(!unchanged.trace.includes('Recheck issue'));assert.equal(unchanged.calls.filter(c=>c.method!=='GET').length,0);
});
test('merge arriving after unchanged QA read waits for next poll',()=>{
 const first=run();assert.equal(first.error,null,first.error?.stack);
 const r=run({...first,fault:{at:'Read ready',before:({pulls})=>Object.assign(pulls[0],{state:'closed',merged:true,merged_at:later})}});
 assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);
 assert.equal(R.state(r.issues[0]),'Your QA');assert(!r.calls.some(c=>c.method!=='GET'));
 const next=run(r);assert.equal(next.error,null,next.error?.stack);assert.equal(R.state(next.issues[0]),'Done');assert.equal(next.row.busy,false);
});
test('PR head change before a planned write still holds without writing',()=>{
 const r=run({fault:{at:'Recheck issue',before:({pulls})=>pulls[0].head.sha='b'.repeat(40)}});
 assert.match(r.error?.message??'',/Tracking evidence changed/);assert.equal(r.row.busy,true);
 assert(!r.calls.some(c=>c.method!=='GET'));assert(!r.trace.includes('Release control'));
});
test('authoritative merge detail completes',()=>{const r=run({pulls:[{...clone(prs[0]),state:'closed',merged:true,merged_at:later}]});assert.equal(r.error,null,r.error?.stack);assert.equal(R.state(r.issues[0]),'Done');assert.equal(r.row.busy,false);});
test('merge comes from detail even when list omits merge status',()=>{const merged={...clone(prs[0]),state:'closed',merged:true,merged_at:later};const r=run({pulls:[merged],fault:{at:'Read pulls',result:items=>{const out=clone(items);delete out[0].json.body[0].merged;delete out[0].json.body[0].merged_at;return out;}}});assert.equal(r.error,null,r.error?.stack);assert.equal(R.state(r.issues[0]),'Done');});
test('closed unmerged open issue stays QA',()=>{const r=run({pulls:[{...clone(prs[0]),state:'closed'}]});assert.equal(r.error,null,r.error?.stack);assert.equal(R.state(r.issues[0]),'Your QA');});
test('owner closed issue completes without PR/handoff',()=>{const r=run({issues:[{...clone(issue),state:'closed'}],discussion:[],history:[],pulls:[]});assert.equal(r.error,null,r.error?.stack);assert.equal(R.state(r.issues[0]),'Done');});
test('no result/no issues/reapproved task release without writes',()=>{for(const args of [{pulls:[]},{issues:[]},{issues:[{...clone(issue),labels:[{name:'Approved'}]}]}]){const r=run(args);assert.equal(r.error,null,r.error?.stack);assert.equal(r.row.busy,false);assert(!r.calls.some(c=>c.method!=='GET'));}});
test('later session and in-scope rework comments preserve captured digest',()=>{const r=run({discussion:[...clone(comments),{...human,id:9,body:'Session decision: unchanged scope'}]});assert.equal(r.error,null,r.error?.stack);});
for(const [name,edit] of [['ambiguous PRs',f=>f.pulls.push({...f.pulls[0],number:8})],['edited captured source',f=>f.discussion[0].body='changed'],['deleted handoff',f=>f.discussion.pop()],['edited handoff',f=>f.discussion[2].updated_at=approved],['new approval without handoff',f=>f.history.push({...events[0],id:9,created_at:'2026-11-25T14:00:00Z'})]])test(name+' holds',()=>{const f={discussion:clone(comments),history:clone(events),pulls:clone(prs)};edit(f);const r=run(f);assert(r.error);assert.equal(r.row.busy,true);assert(!r.trace.includes('Release control'));});
test('baseline stale/new head/reopen distinction',()=>{const old={...clone(prs[0]),created_at:time,updated_at:time};const c=clone(comments);c[2].body=P.handoff(plan,[old],later).body;assert.equal(P.trackingPlan(issue,c,events,[old]).target,null);const fresh={...old,head:{...old.head,sha:'b'.repeat(40)},updated_at:'2026-11-25T13:00:00Z'};assert.equal(P.trackingPlan(issue,c,events,[fresh]).target,'Your QA');c[2].body=P.handoff(plan,[{...old,state:'closed'}],later).body;assert.throws(()=>P.trackingPlan(issue,c,events,[old]));});
for(const at of ['Recheck plan','Post result marker','Add result state','Remove previous state','Final ready','Release control'])test('failure holds at '+at,()=>{const r=run({fault:{at,...(['Post result marker','Add result state','Remove previous state'].includes(at)?{after:true}:{throw:true})}});assert(r.error);assert.equal(r.row.busy,true);assert(!r.trace.includes('Report completion'));const held=run({row:r.row});assert.equal(held.calls.length,0);assert.equal(held.row.execution_id,'track-test');});
test('acquisition failure prevents HTTP',()=>{for(const args of [{row:null},{fault:{at:'Acquire control',throw:true}}]){const r=run(args);assert(r.error);assert.equal(r.calls.length,0);}});
test('pagination errors retain hold',()=>{const r=run({fault:{at:'Discover tracked issues',result:()=>[{json:{statusCode:403,body:[],headers:{}}}]}});assert(r.error);assert.equal(r.row.busy,true);});
test('all operational notes and safe graph edges',()=>{assert.equal(graph.active,false);for(const n of nodes.values()){if(!n.type.endsWith('.stickyNote'))assert(n.notes?.trim(),n.name);assert(!n.continueOnFail&&!n.retryOnFail);for(const branch of graph.connections[n.name]?.main??[])for(const e of branch)assert(nodes.has(e.node));}});
console.log(`${count} local exported-graph/policy groups passed; native runtime UNRUN`);
if(process.argv.includes('--fixtures')){fs.mkdirSync('factory/local/us3',{recursive:true});fs.writeFileSync('factory/local/us3/fixtures.json',JSON.stringify({issue,comments,events,prs},null,2)+'\n');}
