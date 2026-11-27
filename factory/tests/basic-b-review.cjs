// Local owner-review regressions. No network, credentials or external writes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fixture=require('./basic-b-execution.cjs');
const runtime=['refinement-runtime','reservation-runtime','basic-b-protocol','collection-runtime','question-runtime','tracking-runtime'].map(n=>fs.readFileSync('factory/scripts/'+n+'.cjs','utf8').split('module.exports =')[0]).join('\n');
const f=vm.runInNewContext(`(()=>{${runtime}\nreturn {trackingPlan,attemptBody,attemptMetadata,collectionPlan,handoff,approval,baseline,analyze};})()`);
const clone=x=>JSON.parse(JSON.stringify(x)),owner=202449424;
const a={id:fixture.input.id,payload:fixture.input.payload,status:'released',cancellation:null,effects:[{status:'confirmed'}],result:{id:fixture.input.id+'-result',attempt:fixture.input.id,outcome:'done',pushed_sha:'b'.repeat(40),stopped_proof:{cgroup_empty:true},checks:[],unchecked_criteria:[]}};
const c=(id,body,time='2026-11-27T11:00:00Z')=>({id,body,user:{id:owner},created_at:time,updated_at:time});
const attempt=c(55,f.attemptBody(a)),building={...fixture.issue,labels:[{name:'Building'}]},qa={...building,labels:[{name:'Your QA'}]};
const pr={number:3,body:f.collectionPlan(building,[fixture.comment,attempt],[],a).pr_body,head:{ref:'issue-23',sha:'b'.repeat(40),repo:{full_name:'MBroholm/software-factory'}},base:{ref:'main',repo:{full_name:'MBroholm/software-factory'}},state:'open',merged:false,updated_at:'2026-11-27T11:00:00Z'};
const result=c(56,`<!-- factory:result:v2 ${JSON.stringify({...f.attemptMetadata(a),result:a.result.id,sha:a.result.pushed_sha,pr_number:3})} -->\nResult`);
const events=[...fixture.events,{id:43,event:'unlabeled',label:{name:'Approved'},actor:{id:owner},created_at:'2026-11-27T10:01:00Z'}];
const comments=[fixture.comment,attempt,result];
assert.equal(f.trackingPlan(qa,comments,events,[pr],a).target,'Your QA');
assert.equal(f.trackingPlan(qa,comments,events,[{...pr,state:'closed'}],a).target,'Your QA');
assert.equal(f.trackingPlan(qa,comments,events,[{...pr,state:'closed',merged:true,merged_at:'2026-11-27T11:30:00Z'}],a).target,'Done');
assert.equal(f.trackingPlan({...qa,state:'closed'},comments,events,[pr],a).target,'Done');
assert.throws(()=>f.trackingPlan(fixture.issue,comments,events,[pr],a));
// Explicit owner approval and a new manual handoff bind rework to the existing open PR.
const reapproved=[...events,{id:60,event:'labeled',label:{name:'Approved'},actor:{id:owner},created_at:'2026-11-27T12:00:00Z'}];
const plan=f.approval(fixture.issue,comments,reapproved);
const manual=c(65,f.handoff(plan,[pr],'2026-11-27T12:01:00Z').body,'2026-11-27T12:01:00Z');
const reworkEvents=[...reapproved,{id:61,event:'unlabeled',label:{name:'Approved'},actor:{id:owner},created_at:'2026-11-27T12:02:00Z'}];
const changed={...pr,head:{...pr.head,sha:'c'.repeat(40)},updated_at:'2026-11-27T13:00:00Z'};
const rework=f.trackingPlan(building,[...comments,manual],reworkEvents,[changed],a);
assert.equal(rework.target,'Your QA');assert.equal(rework.result.pr_number,3);assert.equal(rework.result.head_sha,'c'.repeat(40));
assert.equal(f.trackingPlan(building,[...comments,manual],reworkEvents,[pr],a).target,null);
for(const bad of [{status:'running'},{effects:[{status:'unknown'}]},{cancellation:{reason:'closed'}},{result:{...a.result,stopped_proof:null}}])assert.throws(()=>f.trackingPlan(building,[...comments,manual],reworkEvents,[changed],{...a,...bad}));
assert.throws(()=>f.trackingPlan(building,[...comments,{...manual,updated_at:'edited'}],reworkEvents,[changed],a));
assert.throws(()=>f.trackingPlan(building,[...comments,manual],reworkEvents,[{...changed,number:4}],a));
assert.throws(()=>f.trackingPlan(building,[...comments,manual],reworkEvents,[changed,{...changed,number:4}],a));
assert.throws(()=>f.trackingPlan(building,[...comments,manual],reworkEvents.map(e=>e.id===60?{...e,actor:{id:9}}:e),[changed],a));
const refinement=f.analyze({...fixture.issue,labels:[{name:'Ready for approval'}]},comments,[{id:44,event:'labeled',label:{name:'Ready for approval'},created_at:'2026-11-27T11:00:00Z'}]);
assert.equal(refinement.work,false);
// Repeated manual rework uses the accepted manual SHA, never inventing a runner push.
const accepted=c(70,rework.body,'2026-11-27T13:01:00Z');
const againApproved=[...reworkEvents,{id:80,event:'labeled',label:{name:'Approved'},actor:{id:owner},created_at:'2026-11-27T14:00:00Z'}];
const nextPlan=f.approval(fixture.issue,[...comments,manual,accepted],againApproved);
const nextManual=c(85,f.handoff(nextPlan,[changed],'2026-11-27T14:01:00Z').body,'2026-11-27T14:01:00Z');
const againEvents=[...againApproved,{id:81,event:'unlabeled',label:{name:'Approved'},actor:{id:owner},created_at:'2026-11-27T14:02:00Z'}];
assert.equal(f.trackingPlan(building,[...comments,manual,accepted,nextManual],againEvents,[{...changed,head:{...changed.head,sha:'d'.repeat(40)},updated_at:'2026-11-27T15:00:00Z'}],a).target,'Your QA');
assert.equal(f.baseline([pr,{...pr,number:2}],23)[0].number,2);
// Retry review binds current approval, while retaining the original initial approval lineage.
const retried=clone(a);retried.payload.authorization={...a.payload.authorization,kind:'retry',approval_event:60};
const retryComments=[fixture.comment,c(55,f.attemptBody(retried)),result];
assert.equal(f.trackingPlan(qa,retryComments,reworkEvents,[pr],retried).target,'Your QA');
console.log('Basic B review fixtures passed: v2 merge/closure, explicit manual rework, exact PR, safe predecessor and unchanged refinement.');
