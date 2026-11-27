// Execute the generated reserve/collect/track graphs against real SQLite API + fake externals.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const fixture=require('./basic-b-execution.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
const python=process.env.FACTORY_TEST_PYTHON||'factory/local/basic-b-venv/bin/python';
function setup(){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basic-b-graph-')),db=path.join(tmp,'ledger.db');
 const world={time:'2026-11-27T11:00:00Z',issues:[clone(fixture.issue)],comments:[clone(fixture.comment)],events:clone(fixture.events),pulls:[],calls:[],writes:[],trace:[],row:{id:1,key:'global',busy:false,execution_id:'',issue_number:null,started_at:''},tmp,db};
 world.runner=request=>JSON.parse(execFileSync(python,['factory/runner/tests/bridge.py',db],{input:JSON.stringify({...request,github:{issues:world.issues,comments:world.comments,events:world.events}}),encoding:'utf8',timeout:10000}));
 return world;
}
let execution=0;const nativeSets=new Map();
function run(kind,w,fault=null){
 const graph=JSON.parse(fs.readFileSync(`factory/workflows/${kind}.json`)),nodes=new Map(graph.nodes.map(n=>[n.name,n])),outputs=new Map();
 let name='Manual isolated test',input=[{json:{}}],error=null,previous=null;const runData={};const exec='graph-'+(++execution),trace=[];
 const env=()=>({$json:input[0]?.json,$input:{first:()=>input[0],all:()=>input},$execution:{id:exec},$:ref=>({first:()=>outputs.get(ref)?.[0],all:()=>outputs.get(ref)??[]})});
 const evaluate=v=>typeof v==='string'&&v.startsWith('={{')?vm.runInNewContext('('+v.slice(3,-2).trim()+')',env()):v;
 try{for(let i=0;name;i++){
  assert(i<200,'graph loop');trace.push(name);const n=nodes.get(name),p=n.parameters;let result=input,branch=0;
  if(fault?.at===name && fault.before)fault.before(w);
  if(process.argv.includes('--native-fixtures') && !fault){
   if(!nativeSets.has(kind))nativeSets.set(kind,{graph,fixtures:[]});
   const collect=(value,parts=[])=>{
    if(parts.includes('pagination'))return;
    if(typeof value==='string' && value.startsWith('={{'))nativeSets.get(kind).fixtures.push({label:kind,node:name,path:parts.join('.'),runIndex:0,execution_id:exec,expected:clone(evaluate(value)),input:clone(input),runData:clone(runData),source:previous?{previousNode:previous,previousNodeOutput:0,previousNodeRun:0}:null});
    else if(value && typeof value==='object')for(const [key,v] of Object.entries(value))collect(v,[...parts,key]);
   };collect(p);
  }
  if(n.type.endsWith('.code'))result=vm.runInNewContext('(()=>{'+p.jsCode+'\n})()',env(),{timeout:1000});
  else if(n.type.endsWith('.splitInBatches')){result=[input[0]];branch=1;}
  else if(n.type.endsWith('.if'))branch=evaluate(p.conditions.conditions[0].leftValue)?0:1;
  else if(n.type.endsWith('.dataTable')){
   let selected=[w.row];if(p.operation==='update'){
    selected=selected.filter(r=>p.filters.conditions.every(c=>c.condition==='isTrue'?r[c.keyName]===true:c.condition==='isFalse'?r[c.keyName]===false:String(r[c.keyName])===String(evaluate(c.keyValue))));
    for(const r of selected)for(const [k,v]of Object.entries(p.columns.value))r[k]=evaluate(v);
   }result=selected.length?selected.map(r=>({json:clone(r)})):[{json:{}}];
  }else if(n.type.endsWith('.httpRequest')){
   const url=evaluate(p.url),body=p.sendBody?evaluate(p.jsonBody):null,method=p.method;
   w.calls.push({name,method,url,body});let response;
   if(url.startsWith('http://RUNNER_PRIVATE_HOST'))response=w.runner({method,path:new URL(url).pathname,body});
   else{
    let data,statusCode=200;const number=Number(url.match(/\/issues\/(\d+)/)?.[1]),issue=w.issues.find(x=>x.number===number);
    if(url.includes('/issues?'))data=w.issues;
    else if(url.endsWith('/issues/events'))data=w.events.map(e=>({...e,issue:e.issue??{number:w.issues[0].number}}));
    else if(url.includes('/git/ref/heads/main'))data={object:{sha:'a'.repeat(40)}};
    else if(url.includes('/pulls?'))data=w.pulls;
    else if(/\/pulls\/\d+$/.test(url))data=w.pulls.find(pr=>pr.number===Number(url.split('/').at(-1)));
    else if(url.endsWith('/pulls') && method==='POST'){
     data={number:w.pulls.length+1,user:{id:202449424},body:body.body,head:{ref:body.head,sha:'b'.repeat(40),repo:{full_name:'MBroholm/software-factory'}},base:{ref:'main',repo:{full_name:'MBroholm/software-factory'}},state:'open',merged:false,merged_at:null};w.pulls.push(data);statusCode=201;
    }else if(url.endsWith('/comments') && method==='GET')data=w.comments;
    else if(url.endsWith('/comments')){
     data={id:100+w.comments.length,user:{id:202449424},body:body.body,created_at:w.time,updated_at:w.time};w.comments.push(data);statusCode=201;
    }else if(url.endsWith('/events'))data=w.events.filter(e=>!e.issue||e.issue.number===number);
    else if(url.endsWith('/labels') && method==='POST'){
     for(const label of body.labels){if(!issue.labels.some(x=>x.name===label))issue.labels.push({name:label});w.events.push({id:Math.max(99,...w.events.map(e=>e.id))+1,event:'labeled',label:{name:label},actor:{id:202449424},created_at:w.time});}data=issue.labels;
    }else if(method==='DELETE'){
     const label=decodeURIComponent(url.split('/').at(-1));issue.labels=issue.labels.filter(x=>x.name!==label);w.events.push({id:Math.max(99,...w.events.map(e=>e.id))+1,event:'unlabeled',label:{name:label},actor:{id:202449424},created_at:w.time});data=issue.labels;
    }else data=issue;
    if(method!=='GET')w.writes.push({name,method,url,body});response={statusCode,body:clone(data),headers:{}};
   }
   if(fault?.at===name && fault.after)throw Error('Lost acknowledgement after '+name);
   result=[{json:response}];
  }
  outputs.set(name,clone(result));runData[name]=[{startTime:0,executionTime:0,source:previous?[{previousNode:previous}]:[],data:{main:n.type.endsWith('.splitInBatches')?[[],clone(result)]:[clone(result)]}}];input=result;previous=name;name=graph.connections[name]?.main?.[branch]?.[0]?.node;
 }}catch(e){error=e;}
 w.trace.push(...trace);return {error,trace,outputs};
}
function must(kind,w,fault){const r=run(kind,w,fault);assert.equal(r.error,null,r.error?.stack);return r;}
function slot(w){return w.runner({method:'GET',path:'/v1/slot'}).body;}
function build(w){must('reserve',w);const id=slot(w).attempt_id;assert(id);assert.equal(w.row.busy,false);assert.equal(w.issues[0].labels[0].name,'Building');assert(w.trace.indexOf('Reserve runner')<w.trace.indexOf('Add Building'));assert(w.trace.indexOf('Final Building issue')<w.trace.indexOf('Start attempt'));const a=w.runner({method:'GET',path:'/v1/attempts/'+id}).body;assert.equal(a.status,'dispatching');return id;}
let count=0;
function test(name,fn){if(process.argv.includes('--recovery-only') && !/stopped failure|lost failure|closed released/.test(name))return;const w=setup();try{fn(w);count++;console.log('PASS '+name);}finally{fs.rmSync(w.tmp,{recursive:true,force:true});}}
test('reserve async, blocked second task, supervised fake agent, exact PR, QA and safe release',w=>{
 const id=build(w);must('reserve',w);assert.equal(slot(w).attempt_id,id);
 w.runner({action:'worker',id});must('collect',w);assert.equal(slot(w).attempt_id,null);assert.equal(w.pulls.length,1);assert.equal(w.issues[0].labels[0].name,'Your QA');assert.equal(w.row.busy,false);
 must('collect',w);must('track',w);assert.equal(w.pulls.length,1);assert.equal(w.comments.filter(c=>c.body.startsWith('<!-- factory:result:v2')).length,1);
 w.pulls[0].state='closed';must('track',w);assert.equal(w.issues[0].labels[0].name,'Your QA');
 w.pulls[0].merged=true;w.pulls[0].merged_at='2026-11-27T12:00:00Z';must('track',w);assert.equal(w.issues[0].labels[0].name,'Done');
});
test('lost PR acknowledgement holds then reconciles exact existing PR without duplicate POST',w=>{
 const id=build(w);w.runner({action:'worker',id});const r=run('collect',w,{at:'Create review PR',after:true});assert(r.error);assert(w.row.busy);assert.equal(slot(w).attempt_id,id);assert.equal(w.pulls.length,1);
 // Simulate explicit owner guard recovery, preserving the independent ledger and remote effects.
 w.row.busy=false;must('collect',w);assert.equal(w.pulls.length,1);assert.equal(slot(w).attempt_id,null);
});
test('closure after stopped result records cancellation, Done and safe release',w=>{
 const id=build(w);w.runner({action:'worker',id});w.issues[0].state='closed';must('collect',w);assert.equal(w.pulls.length,0);assert.equal(slot(w).attempt_id,null);assert.equal(w.issues[0].labels[0].name,'Done');assert(w.runner({method:'GET',path:'/v1/attempts/'+id}).body.cancellation);
});
test('non-owner and stale approval do not launch',w=>{
 w.issues[0].user.id=9;must('reserve',w);assert.equal(slot(w).attempt_id,null);
 w.issues[0].user.id=202449424;w.issues[0].body='changed';assert(run('reserve',w).error);assert.equal(slot(w).attempt_id,null);
});
test('orphan Building blocks empty-ledger activation',w=>{w.issues[0].labels=[{name:'Building'}];assert(run('reserve',w).error);assert.equal(slot(w).attempt_id,null);});
test('stale QA result cannot overwrite renewed owner Approved',w=>{
 const id=build(w);w.runner({action:'worker',id});w.issues[0].labels=[{name:'Approved'}];assert(run('collect',w).error);assert.equal(w.pulls.length,0);assert.equal(slot(w).attempt_id,id);
});
test('question once, stopped Waiting release, durable answer before Approved and fresh priority continuation',w=>{
 const id=build(w);w.runner({action:'worker',id,outcome:'question'});must('collect',w);
 assert.equal(slot(w).attempt_id,null);assert.equal(w.issues[0].labels[0].name,'Waiting for you');
 const questions=()=>w.comments.filter(c=>c.body.startsWith('<!-- factory:question:v2'));
 assert.equal(questions().length,1);must('collect',w);assert.equal(questions().length,1);
 w.comments.push({id:200,user:{id:202449424},body:`answer ${id}-q1: Use JSON.\nscope: unchanged`,created_at:'2026-11-27T12:00:00Z',updated_at:'2026-11-27T12:00:00Z'});w.time='2026-11-27T13:00:00Z';
 const refined=must('refine',w);assert.equal(w.issues[0].labels[0].name,'Approved');assert(refined.trace.indexOf('Persist scoped answer')<refined.trace.indexOf('Add answered Approved'));
 const predecessor=w.runner({method:'GET',path:'/v1/attempts/'+id}).body;assert(predecessor.question.claim);
 w.issues.push({...clone(fixture.issue),number:1});w.events.push({...clone(fixture.events[0]),id:1,issue:{number:1},created_at:'2026-11-27T09:30:00Z'});
 must('reserve',w);const next=slot(w).attempt_id;assert.notEqual(next,id);const blocked=must('reserve',w);assert(!blocked.trace.includes('Discover all issues'));assert.equal(slot(w).attempt_id,next);
 const a=w.runner({method:'GET',path:'/v1/attempts/'+next}).body;assert.equal(a.payload.authorization.kind,'answer');assert.equal(a.payload.continuation.answer.text,'Use JSON.');assert.equal(a.payload.predecessor,id);
 w.runner({action:'worker',id:next});must('collect',w);assert.equal(w.issues[0].labels[0].name,'Your QA');assert.equal(w.pulls.length,1);must('track',w);
});
test('missing scope stays Waiting; changed scope returns to refinement without approval',w=>{
 const id=build(w);w.runner({action:'worker',id,outcome:'question'});must('collect',w);
 const reply={id:200,user:{id:202449424},body:`answer ${id}-q1: Expand scope.`,created_at:'2026-11-27T12:00:00Z',updated_at:'2026-11-27T12:00:00Z'};w.comments.push(reply);w.time='2026-11-27T13:00:00Z';
 const waiting=must('refine',w);assert.equal(w.issues[0].labels[0].name,'Waiting for you');assert(waiting.trace.includes('Report unanswered question'));
 reply.body+=`\nscope: changed`;must('refine',w);assert.equal(w.issues[0].labels[0].name,'Ideas');assert(!w.writes.some(x=>x.name==='Add answered Approved'));
 const a=w.runner({method:'GET',path:'/v1/attempts/'+id}).body;assert.equal(a.question.claim,null);
});
test('lost question acknowledgement reconciles one marker and releases only with readback',w=>{
 const id=build(w);w.runner({action:'worker',id,outcome:'question'});assert(run('collect',w,{at:'Post owner question',after:true}).error);assert.equal(slot(w).attempt_id,id);assert(w.row.busy);
 w.row.busy=false;must('collect',w);assert.equal(slot(w).attempt_id,null);assert.equal(w.comments.filter(c=>c.body.startsWith('<!-- factory:question:v2')).length,1);
});
if(process.argv.includes('--recovery')) {
 test('stopped failure publishes once, releases Stuck and fresh owner retry preserves predecessor',w=>{
  const id=build(w);w.runner({action:'worker',id,outcome:'stuck'});must('collect',w);
  assert.equal(slot(w).attempt_id,null);assert.equal(w.issues[0].labels[0].name,'Stuck');
  must('collect',w);assert.equal(w.comments.filter(c=>c.body.startsWith('<!-- factory:failure:v2')).length,1);
  w.issues[0].labels=[{name:'Approved'}];w.time='2026-11-27T13:00:00Z';
  w.events.push({id:900,event:'labeled',label:{name:'Approved'},actor:{id:202449424},issue:{number:w.issues[0].number},created_at:w.time});
  must('reserve',w);const next=slot(w).attempt_id;assert.notEqual(next,id);
  const a=w.runner({method:'GET',path:'/v1/attempts/'+next}).body;assert.equal(a.payload.authorization.kind,'retry');assert.equal(a.payload.predecessor,id);
  w.runner({action:'worker',id:next});must('collect',w);assert.equal(w.pulls.length,1);
 });
 test('lost failure response reconciles without duplicate POST',w=>{
  const id=build(w);w.runner({action:'worker',id,outcome:'stuck'});assert(run('collect',w,{at:'Post failure',after:true}).error);
  assert.equal(slot(w).attempt_id,id);w.row.busy=false;must('collect',w);assert.equal(slot(w).attempt_id,null);assert.equal(w.comments.filter(c=>c.body.startsWith('<!-- factory:failure:v2')).length,1);
 });
 test('closed released Waiting and Stuck tasks are cancelled and labelled Done',w=>{
  const id=build(w);w.runner({action:'worker',id,outcome:'question'});must('collect',w);w.issues[0].state='closed';must('track',w);
  assert.equal(w.issues[0].labels[0].name,'Done');assert(w.runner({method:'GET',path:'/v1/attempts/'+id}).body.cancellation);assert.equal(slot(w).attempt_id,null);
 });
}
console.log(`${count} generated Basic B graph scenarios passed using real SQLite/API and fake external effects.`);

if(process.argv.includes('--native-fixtures')){fs.mkdirSync('factory/local/basic-b-native',{recursive:true});for(const [kind,set]of nativeSets)fs.writeFileSync(`factory/local/basic-b-native/${kind}-expressions.json`,JSON.stringify(set));}
