// Collection plans are pure. Generated HTTP stages journal before each external write.
function publicText(value) {
 return String(value??'').replace(/(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]+/g,'[redacted]').replace(/Bearer\s+\S+/gi,'[redacted]').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'').slice(0,4096);
}
function collectionPlan(issue,comments,pulls,a) {
 demand(a.payload.issue_number===issue.number && a.payload.repository===REPOSITORY && issue.user?.id===OWNER_ID,'Wrong collection target');
 if(issue.state==='closed')return {action:'cancel',issue_number:issue.number};
 demand(!a.cancellation,'Cancelled result cannot publish');
 const managed=issue.labels.map(l=>typeof l==='string'?l:l.name).filter(l=>STATES.includes(l));
 demand(managed.length===1 && ['Building','Your QA'].includes(managed[0]),'Stale result cannot overwrite current state/approval');
 if(!a.result || !a.result.stopped_proof?.cgroup_empty)return {action:'wait',issue_number:issue.number};
 // US1 collects only done. Question/failure publication is added by US2/US3.
 if(a.result.outcome!=='done')return {action:'hold',issue_number:issue.number};
 const {pr,marker}=validateV2Association(issue,comments,pulls,a),r=a.result;
 const pr_body=`${marker}\nRefs #${issue.number}\n\n## Agent result\n${publicText(r.summary)}\n\nPushed SHA: ${r.pushed_sha}\n\n## Approved criteria and constraints\n${a.payload.specification}\n\n## Checks (agent-reported; not independently verified)\n${r.checks.map(c=>`- ${publicText(c.command)}: ${c.outcome}; revision ${publicText(c.tested_revision)}; environment ${publicText(c.environment)}; ${publicText(c.details)}`).join('\n') || 'No checks reported.'}\n\n## Unchecked criteria\n${r.unchecked_criteria.map(c=>'- '+publicText(c)).join('\n') || 'None reported by agent.'}\n\nOwner decides review and merge.\n`;
 const effect=a.effects.find(e=>e.kind==='pr');
 if(effect)demand(sortedJSON(effect.content)===sortedJSON({body:pr_body,head:a.payload.branch,base:'main',title:`Issue #${issue.number}: agent result`}), 'PR intent changed');
 if(pr)demand(pr.user?.id===OWNER_ID && pr.body===pr_body,'PR actor/body changed');
 if(!pr && effect)throw Error('Prior PR write unresolved; no blind POST retry');
 return {action:pr?'confirm_pr':'create_pr',issue_number:issue.number,pr_number:pr?.number??null,pr_body,pr_content:{body:pr_body,head:a.payload.branch,base:'main',title:`Issue #${issue.number}: agent result`},
 result_body:`<!-- factory:result:v2 ${JSON.stringify({...attemptMetadata(a),result:r.id,sha:r.pushed_sha,pr_number:pr?.number??null})} -->\nResult ready for owner review. Checks are agent-reported.\n`,target:'Your QA'};
}
module.exports = {publicText,collectionPlan};
