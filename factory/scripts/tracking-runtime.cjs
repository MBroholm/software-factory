// Conservative current-attempt association; no repair, merge or approval authority.
function trackingCandidates(issues) {
 demand(new Set(issues.map(i=>i.number)).size===issues.length,'Duplicate issue pages');
 return issues.filter(i=>!i.pull_request && i.user?.id===OWNER_ID && i.labels?.some(l=>STATES.includes(typeof l==='string'?l:l.name)) && (['Building','Your QA'].includes(state(i)) || (i.state==='closed' && state(i)!=='Done'))).sort((a,b)=>a.number-b.number);
}
function marked(comments,kind,number) {
 return comments.filter(c=>lf(c.body).startsWith(`<!-- factory:${kind}:v1`)).map(c=>{
  const m=lf(c.body).match(new RegExp(`^<!-- factory:${kind}:v1 (\\{[^\\n]+\\}) -->\\n`));
  demand(m && c.user?.id===OWNER_ID && c.created_at===c.updated_at,'Invalid/edited '+kind);
  const meta=JSON.parse(m[1]);demand(meta.issue_number===number && Number.isSafeInteger(meta.approval_event_id),'Invalid marker identity');return {comment:c,meta};
 });
}
function trackingPlan(issue,comments,events,pulls,ledger=null) {
 if(comments.some(c=>/^<!-- factory:attempt:v2\b/.test(lf(c.body))))return trackingV2Plan(issue,comments,events,pulls,ledger);
 const current=state(issue);demand(issue.user?.id===OWNER_ID && !issue.pull_request,'Invalid tracked issue');
 if(issue.state==='closed')return {issue_number:issue.number,from:current,target:'Done',result:null,body:null};
 demand(['Building','Your QA'].includes(current),'Tracking cannot override reapproval');
 const removals=events.filter(e=>e.label?.name==='Approved' && ['labeled','unlabeled'].includes(e.event)).sort((a,b)=>a.id-b.id);
 const removed=removals.pop(),approved=removals.at(-1);
 demand(removed?.event==='unlabeled' && removed.actor?.id===OWNER_ID && approved?.event==='labeled','Current reservation history missing');
 // Reuse canonical source/approval checks without treating QA as a new approval.
 const p=approval({...issue,labels:issue.labels.map(l=>(typeof l==='string'?l:l.name)===current?{name:'Building'}:l)},comments,events,'Building');
 const handoffs=marked(comments,'handoff',issue.number).filter(h=>h.meta.approval_event_id===p.approval_event_id);
 demand(handoffs.length===1,'Missing/duplicate current handoff');const h=handoffs[0];
 for(const [key,value] of Object.entries(p))demand(h.meta[key]===value,'Handoff scope/approval mismatch');
 demand(Array.isArray(h.meta.baseline_prs) && Date.parse(h.meta.timestamp)>=Date.parse(p.approval_timestamp),'Invalid handoff baseline/time');
 demand(new Set(h.meta.baseline_prs.map(b=>b.number)).size===h.meta.baseline_prs.length,'Duplicate baseline');
 demand(new Set(pulls.map(r=>r.number)).size===pulls.length,'Duplicate PR pages');
 const associated=pulls.filter(r=>r.head?.repo?.full_name===REPOSITORY && r.head.ref===p.branch && r.base?.ref==='main' && r.base?.repo?.full_name===REPOSITORY && (new RegExp(`(?:^|\\s)Refs #${issue.number}(?![0-9])`,'i').test(r.body??'') || new RegExp(`https://github\\.com/${REPOSITORY}/issues/${issue.number}(?![0-9])`).test(r.body??'')));
 const prior=marked(comments,'result',issue.number).filter(r=>r.meta.approval_event_id===p.approval_event_id);
 demand(prior.length<=1,'Duplicate current result markers');
 const candidates=associated.filter(r=>{
  const b=h.meta.baseline_prs.find(b=>b.number===r.number);
  if(prior[0]?.meta.pr_number===r.number)return true;
  if(!b){demand(Number.isFinite(Date.parse(r.created_at)) && Date.parse(r.created_at)>Date.parse(p.approval_timestamp),'Unbaselined old PR or unclear creation time');return true;}
  if(b.head_sha===r.head.sha){demand(!(b.state==='closed' && r.state==='open'),'Unchanged reopened result');return false;}
  demand(b.state==='open' && Date.parse(r.updated_at)>Date.parse(p.approval_timestamp),'Ambiguous baseline activity');return true;
 });
 demand(candidates.length<=1,'Ambiguous current results');
 if(!candidates.length){demand(!prior.length && current==='Building','Current result disappeared');return {issue_number:issue.number,from:current,target:null,result:null,body:null};}
 const r=candidates[0];demand(/^[a-f0-9]{40}$/.test(r.head.sha) && ['open','closed'].includes(r.state) && typeof r.merged==='boolean','Invalid detailed PR');
 demand(!r.merged || (r.state==='closed' && Number.isFinite(Date.parse(r.merged_at))),'Invalid merge evidence');
 if(prior.length)demand(prior[0].meta.pr_number===r.number && prior[0].meta.head_sha===r.head.sha,'Accepted result head changed; owner resolution required');
 const meta={issue_number:issue.number,approval_event_id:p.approval_event_id,pr_number:r.number,head_sha:r.head.sha};
 const body=prior.length?null:`<!-- factory:result:v1 ${JSON.stringify(meta)} -->\n## Result ready for owner review\n\nhttps://github.com/${REPOSITORY}/pull/${r.number}\nHead: ${r.head.sha}\nOwner decides review, merge, closure or explicitly approved rework.\n`;
 return {issue_number:issue.number,from:current,target:r.merged?'Done':'Your QA',result:meta,body};
}
function trackingV2Plan(issue,comments,events,pulls,a) {
 const current=state(issue);
 demand(issue.user?.id===OWNER_ID && !issue.pull_request,'Invalid tracked v2 issue');
 if(issue.state==='closed')return {issue_number:issue.number,from:current,target:'Done',result:null,body:null};
 demand(['Building','Your QA'].includes(current),'Old result cannot override renewed approval');
 demand(a && a.payload.issue_number===issue.number && a.payload.repository===REPOSITORY && !a.cancellation,'Missing/mismatched ledger result');
 if(a.payload.authorization.kind==='answer')validateContinuationComments(a.payload,comments);
 const p=approval({...issue,labels:issue.labels.map(l=>(typeof l==='string'?l:l.name)===current?{name:'Building'}:l)},comments,events,'Building');
 demand(p.approval_event_id===(a.payload.authorization.kind==='answer'?a.payload.authorization.approval_event:a.payload.authorization.initial_approval_event) && p.source_digest===a.payload.source.source_digest && p.refinement_body_sha256===a.payload.source.refinement_body_sha256,'Stale approval/source lineage');
 if(!a.result || !a.result.stopped_proof?.cgroup_empty || a.result.outcome!=='done'){
  demand(current==='Building','QA without stopped done result');return {issue_number:issue.number,from:current,target:null,result:null,body:null};
 }
 const {pr}=validateV2Association(issue,comments,pulls,a);
 const markers=v2marked(comments,'result',issue.number).filter(m=>m.meta.attempt===a.id);
 // Collector alone publishes and transitions Building to QA; tracker waits for its confirmed association.
 if(!markers.length){demand(current==='Building','Missing QA result marker');return {issue_number:issue.number,from:current,target:null,result:null,body:null};}
 demand(markers.length===1 && pr && markers[0].meta.pr_number===pr.number && markers[0].meta.sha===a.result.pushed_sha && markers[0].meta.result===a.result.id && sortedJSON(markers[0].meta)===sortedJSON({...attemptMetadata(a),result:a.result.id,sha:a.result.pushed_sha,pr_number:pr.number}),'Result marker/ledger conflict');
 demand(typeof pr.merged==='boolean' && (!pr.merged || (pr.state==='closed' && Number.isFinite(Date.parse(pr.merged_at)))),'Detailed merge proof missing');
 return {issue_number:issue.number,from:current,target:current==='Building'?null:(pr.merged?'Done':'Your QA'),result:{issue_number:issue.number,attempt:a.id,pr_number:pr.number,head_sha:a.result.pushed_sha},body:null};
}
module.exports = {trackingCandidates,marked,trackingPlan};
