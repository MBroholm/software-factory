// Versioned reservation policy; Basic B uses durable runner ownership and approval-time ordering.
function reservationCandidates(issues,queueEvents=null) {
  demand(new Set(issues.map(i=>i.number)).size===issues.length,'Duplicate issue pages');
  // Closed, non-owner and conflicting Building tasks also reserve the slot.
  if (issues.some(i=>!i.pull_request && i.labels?.some(l=>(typeof l==='string'?l:l.name)==='Building'))) return [];
  return issues.filter(i=>eligible(i) && i.labels?.some(l=>(typeof l==='string'?l:l.name)==='Approved'))
    .map(i=>{demand(state(i)==='Approved','Conflicting approval state');return i;}).sort((a,b)=>{
      if(!queueEvents)return a.number-b.number; // Historical v1 fixture policy.
      const entered=issue=>{
        const relevant=queueEvents.filter(e=>e.issue?.number===issue.number && e.label?.name==='Approved' && ['labeled','unlabeled'].includes(e.event)).sort((a,b)=>a.id-b.id);
        const event=relevant.at(-1);demand(event?.event==='labeled' && event.actor?.id===OWNER_ID && Number.isFinite(Date.parse(event.created_at)),'Missing queue approval history');
        return Date.parse(event.created_at);
      };
      return entered(a)-entered(b) || a.number-b.number;
    });
}
function approval(issue,comments,events,expectedState='Approved') {
  demand(eligible(issue) && state(issue)===expectedState,'Issue no longer eligible');
  demand(new Set(comments.map(c=>c.id)).size===comments.length,'Duplicate comments');
  demand(new Set(events.map(e=>e.id)).size===events.length,'Duplicate approval history');
  const relevant=events.filter(e=>['labeled','unlabeled'].includes(e.event) && e.label?.name==='Approved').sort((a,b)=>a.id-b.id);
  demand(relevant.every(e=>Number.isSafeInteger(e.id) && Number.isFinite(Date.parse(e.created_at))),'Invalid approval history');
  // After our transition, the last Approved event is our removal, not new approval.
  if(expectedState==='Building') {
    const removed=relevant.pop(); demand(removed?.event==='unlabeled' && removed.actor?.id===OWNER_ID,'Approval removal missing');
  }
  const event=relevant.at(-1);
  demand(event?.event==='labeled' && event.actor?.id===OWNER_ID,'Missing current explicit owner approval');
  const latest=history(comments,issue).at(-1);
  demand(latest,'Missing successful refinement');
  demand(Date.parse(latest.comment.created_at)<Date.parse(event.created_at)
    && Date.parse(latest.comment.updated_at)<Date.parse(event.created_at),'Refinement not before approval');
  demand(latest.comment.html_url===`https://github.com/${REPOSITORY}/issues/${issue.number}#issuecomment-${latest.comment.id}`,'Invalid refinement URL');
  const included=latest.meta.captured_comment_ids.map(id=>{
    const c=comments.find(c=>c.id===id);
    demand(c?.user?.id===OWNER_ID && !factoryComment(c) && typeof c.body==='string','Captured source missing/changed');return c;
  });
  demand(source(issue,included).source_digest===latest.meta.source_digest,'Approved source edited/deleted');
  return {issue_number:issue.number,approval_event_id:event.id,approval_actor_id:event.actor.id,approval_timestamp:event.created_at,
    refinement_comment_id:latest.comment.id,refinement_url:latest.comment.html_url,
    refinement_created_at:latest.comment.created_at,refinement_updated_at:latest.comment.updated_at,
    refinement_content_sha256:latest.meta.content_sha256,refinement_body_sha256:sha256(latest.comment.body),
    source_digest:latest.meta.source_digest,branch:`issue-${issue.number}`};
}
function sameApproval(original,current) {
  demand(JSON.stringify(original)===JSON.stringify(current),'Approval/refinement/source changed; inspect manually');
}
function baseline(pulls,number) {
  demand(new Set(pulls.map(p=>p.number)).size===pulls.length,'Duplicate PR pages');
  return pulls.filter(p=>p.head?.repo?.full_name===REPOSITORY && p.head.ref===`issue-${number}` && p.base?.ref==='main').map(p=>{
    demand(Number.isSafeInteger(p.number) && /^[0-9a-f]{40}$/.test(p.head.sha) && ['open','closed'].includes(p.state),'Invalid PR baseline');
    return {number:p.number,head_sha:p.head.sha,state:p.state};
  }).sort((a,b)=>a.number-b.number);
}
function checkHandoffs(comments,plan) {
  for(const c of comments) {
    if(!/^<!-- factory:handoff:v1\b/.test(lf(c.body))) continue;
    const m=lf(c.body).match(/^<!-- factory:handoff:v1 (\{[^\n]+\}) -->\n/);
    demand(m && c.user?.id===OWNER_ID && c.created_at===c.updated_at,'Invalid/edited handoff; manual recovery');
    let meta;try{meta=JSON.parse(m[1]);}catch{throw Error('Malformed handoff');}
    demand(meta.issue_number===plan.issue_number && Number.isSafeInteger(meta.approval_event_id),'Invalid handoff metadata');
    demand(meta.approval_event_id!==plan.approval_event_id,'Approval already handed off; manual recovery');
  }
}
function handoff(plan,prs,timestamp) {
  demand(Number.isFinite(Date.parse(timestamp)),'Invalid handoff timestamp');
  const metadata={...plan,baseline_prs:baseline(prs,plan.issue_number),timestamp};
  const body=`<!-- factory:handoff:v1 ${JSON.stringify(metadata)} -->\n## Manual build reservation\n\nIssue: https://github.com/${REPOSITORY}/issues/${plan.issue_number}\nApproved refinement: ${plan.refinement_url}\nApproval event: ${plan.approval_event_id} (${plan.approval_timestamp}); owner actor ${plan.approval_actor_id}.\nRefinement content SHA-256: ${plan.refinement_content_sha256}\nSource SHA-256: ${plan.source_digest}\nBranch: \`${plan.branch}\`; base: \`main\`.\n\nBuilding reserves the single slot; it does not confirm Codex has started. The owner must verify this approved input and launch Codex manually on Fedora using docs/manual-coding.md. Ask result-changing questions in the session and summarize answers/decisions on this issue. Expanded scope requires fresh explicit approval. Return changes in a linked pull request with actual checks and unchecked criteria. No agent was launched by this workflow.\n`;
  return {metadata,body};
}
module.exports = {reservationCandidates,approval,sameApproval,baseline,checkHandoffs,handoff};
