// Offline sanitized summary of private native traces; no API/credential access.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const dir='factory/local/us3/',read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const events=read(dir+'native-events.json'),source=read('factory/workflows/track.json'),mapped=read(dir+'tracking-test-mapped.json');
const sourceCode=source.nodes.filter(n=>n.type.endsWith('.code'));
const results=events.filter(e=>e.execution_id).map(event=>{
 const trace=read(dir+'execution-'+event.execution_id+'.json'),effects=read(dir+'effects-'+event.execution_id+'.json');
 assert.equal(trace.workflowId,read(dir+'imported.json').id);assert.equal(trace.usedPrivateCredentials,false);
 assert.deepEqual(trace.workflowData.connections,mapped.connections);
 for(const n of sourceCode)assert.equal(trace.workflowData.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
 const markers=effects.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1')).map(c=>JSON.parse(c.body.match(/^<!-- factory:result:v1 (.*) -->/)[1]));
 const current=markers.filter(m=>m.approval_event_id===10);
 if(event.scenario==='rework-head')assert(current.length===1&&current[0].pr_number===7&&current[0].head_sha==='b'.repeat(40));
 if(event.scenario==='rework-new-pr')assert(current.length===1&&current[0].pr_number===8);
 if(event.scenario==='rework-stale')assert.equal(current.length,0);
 if(event.scenario==='pagination')for(const name of ['Discover tracked issues','Read comments','Read events','Read pulls']){
  const pages=trace.data.resultData.runData[name][0].data.main[0];assert.equal(pages.length,2);assert.equal(pages[0].json.body.length,100);assert(pages[1].json.body.length<100);
 }
 return {...event,version:trace.workflowVersionId,startedAt:trace.startedAt,stoppedAt:trace.stoppedAt,usedPrivateCredentials:trace.usedPrivateCredentials,markers,issue_states:effects.issues.filter(i=>i.number===1).map(i=>({number:i.number,state:i.state,labels:i.labels.map(l=>l.name)})),source_code_bodies_verified:sourceCode.length};
});
const scheduled=read(dir+'schedule-results.json');assert(scheduled.observed.length>=2);
const shutdown=read(dir+'shutdown.json');assert.equal(shutdown.active_workflows.length,0);assert.equal(shutdown.running,0);assert.equal(shutdown.waiting,0);assert.equal(shutdown.route_status,404);assert.equal(shutdown.row.busy,false);
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(createHash('sha256').update(execFileSync('git',['show',commit+':factory/workflows/track.json'])).digest('hex'),hash('factory/workflows/track.json'),'Source differs from reported commit');
const summary={source_commit:commit,test_helpers:'Uncommitted US3 test-only changes on that base; exact artifact hashes below.',source_sha256:hash('factory/workflows/track.json'),public_test_sha256:hash('factory/tests/tracking-test.json'),mapped_test_sha256:hash(dir+'tracking-test-mapped.json'),environment:{container:'factory-guard-test',image:'docker.n8n.io/n8nio/n8n:2.48.8',volume:'factory_guard_test_data',port:'127.0.0.1:5679',table:'IgWCIu94ieyHQRHS',http:'container 127.0.0.1:18767 only',saved_credentials_used:false},imported:read(dir+'imported.json'),cases:results,held_skips:events.filter(e=>e.held_skip),explicit_inspected_resets:events.filter(e=>e.operator_fixture_reset),scheduled:{...scheduled,effects:undefined},shutdown,limits:['Synthetic HTTP results, not real factory task runs','Operational owner review/manual matching-revision import still required','T026 broad guard/restart/release-fault matrix remains outstanding'],observer_interventions:['First scheduled tick succeeded; observer rejected engine-added empty Schedule Trigger parameters.notice. Schedule paused and exact field normalization added; original successful trace retained.','A collection attempt while unpublished received expected 404 from private fixture inspection; no workflow/state mutation. Republished same scheduled revision to observe unchanged tick.']};
fs.writeFileSync('evidence/review-native-results.json',JSON.stringify(summary,null,2)+'\n');
console.log('Verified/summarized '+results.length+' native cases, '+summary.held_skips.length+' held skips, '+scheduled.observed.length+' scheduled ticks.');
