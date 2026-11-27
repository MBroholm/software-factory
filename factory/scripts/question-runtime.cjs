// Pure US2 question/answer contracts. No model-based scope classifier or implicit approval.
function questionBody(a) {
 const q=a.result.question,id=a.id+'-q1';
 return `<!-- factory:question:v2 ${JSON.stringify({...attemptMetadata(a),question:id,result:a.result.id})} -->\n## Question for owner\n\n${q.text}\n\nDecision context: ${q.context}\n\nReply exactly:\n\`\`\`text\nanswer ${id}: <your answer>\nscope: unchanged\n\`\`\`\n\nIf the answer expands scope, use scope: changed; refinement and renewed explicit owner approval are required.\n`;
}
function questionPlan(issue,comments,a) {
 demand(eligible(issue) && a.payload.issue_number===issue.number && a.payload.repository===REPOSITORY && !a.cancellation,'Invalid question target');
 const labels=issue.labels.map(l=>typeof l==='string'?l:l.name).filter(l=>STATES.includes(l));
 demand(labels.length===1 && ['Building','Waiting for you'].includes(labels[0]),'Stale question cannot overwrite new state');
 demand(a.result?.outcome==='question' && a.result.stopped_proof?.cgroup_empty && a.result.question?.text && a.result.question?.context,'Question lacks trusted stopped outcome');
 const attempt=v2marked(comments,'attempt',issue.number).filter(x=>x.meta.attempt===a.id);
 demand(attempt.length===1 && sortedJSON(attempt[0].meta)===sortedJSON(attemptMetadata(a)),'Question attempt identity changed');
 const body=questionBody(a),marked=v2marked(comments,'question',issue.number).filter(x=>x.meta.attempt===a.id);
 demand(marked.length<=1 && (!marked.length || marked[0].comment.body===body),'Question marker changed/duplicate');
 const prior=a.effects.find(e=>e.kind==='comment');
 demand(marked.length || !prior,'Prior question write unresolved; no blind POST retry');
 return {action:marked.length?'confirm_question':'post_question',body,existing:marked[0]?.comment.id??null,target:'Waiting for you',issue_number:issue.number};
}
function parseOwnerAnswer(body,id) {
 const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const match=String(body).match(new RegExp('^answer '+escaped+': ([^\\n]+(?:\\n(?!scope:)[^\\n]+)*)\\nscope: (unchanged|changed)$'));
 return match && match[0]===String(body) && match[1].trim()?{text:match[1].trim(),scope:match[2]}:null;
}
function answerPlan(issue,comments,a) {
 demand(eligible(issue) && issue.labels.filter(l=>STATES.includes(typeof l==='string'?l:l.name)).length===1 && issue.labels.some(l=>(typeof l==='string'?l:l.name)==='Waiting for you'),'Question no longer Waiting');
 questionPlan(issue,comments,a);
 demand(a.status==='released' && !a.cancellation,'Question not safely released');
 const id=a.id+'-q1',question=comments.find(c=>c.body===questionBody(a));demand(question,'Published question missing');
 const candidates=comments.filter(c=>c.user?.id===OWNER_ID && c.body.startsWith(`answer ${id}:`) && Date.parse(c.created_at)>Date.parse(question.created_at));
 demand(candidates.length<=1,'Competing owner answers; owner resolution required');
 if(!candidates.length)return {action:'wait',issue_number:issue.number};
 const answer=candidates[0];demand(answer.created_at===answer.updated_at,'Edited answer requires owner recovery');
 const parsed=parseOwnerAnswer(answer.body,id);
 if(!parsed)return {action:'needs_scope_confirmation',issue_number:issue.number,message:`Reply answer ${id}: <your answer> followed by a separate scope: unchanged line; changed scope requires refinement.`};
 if(parsed.scope==='changed')return {action:'refine_changed_scope',issue_number:issue.number,answer_id:answer.id};
 // Existing captured source/approved specification must remain byte-identical.
 const refined=history(comments,issue).at(-1);demand(refined?.comment.id===a.payload.source.refinement_comment_id && sha256(refined.comment.body)===a.payload.source.refinement_body_sha256,'Approved refinement changed');
 const captured=a.payload.source.captured_comment_ids.map(id=>{const c=comments.find(c=>c.id===id && c.user?.id===OWNER_ID && !factoryComment(c));demand(c,'Captured source missing');return c;});
 demand(source(issue,captured).source_digest===a.payload.source.source_digest,'Approved source changed');
 const claim={authorization_id:`answer:${id}:${answer.id}`,predecessor:a.id,initial_approval_event:a.payload.authorization.initial_approval_event,source:a.payload.source,
 continuation:{question:{id,text:a.result.question.text,context:a.result.question.context,comment_id:question.id,body_sha256:sha256(question.body),created_at:question.created_at},
 answer:{id:answer.id,body:answer.body,text:parsed.text,body_sha256:sha256(answer.body),created_at:answer.created_at,updated_at:answer.updated_at}}};
 if(a.question?.claim)demand(sortedJSON(a.question.claim)===sortedJSON(claim),'Previously claimed answer changed');
 return {action:'claim_answer',claim,issue_number:issue.number};
}
function continuationPayload(issue,comments,events,a,expectedState='Approved') {
 demand(a.question?.claim && !a.question.consumed_by_attempt,'No unconsumed durable answer claim');
 // Validate source and exact answer again using the Waiting policy without changing remote labels.
 const waiting={...issue,labels:issue.labels.map(l=>STATES.includes(typeof l==='string'?l:l.name)?{name:'Waiting for you'}:l)};
 demand(answerPlan(waiting,comments,a).action==='claim_answer','Answer no longer eligible');
 const relevant=events.filter(e=>e.label?.name==='Approved' && ['labeled','unlabeled'].includes(e.event)).sort((a,b)=>a.id-b.id);
 if(expectedState==='Building'){const removed=relevant.pop();demand(removed?.event==='unlabeled' && removed.actor?.id===OWNER_ID,'Derived approval removal missing');}
 const event=relevant.at(-1);demand(event?.event==='labeled' && event.actor?.id===OWNER_ID && Date.parse(event.created_at)>Date.parse(a.question.claim.continuation.answer.created_at),'Missing answer-derived Approved event');
 const p=JSON.parse(JSON.stringify(a.payload)),claim=a.question.claim;
 p.authorization={id:claim.authorization_id,kind:'answer',initial_approval_event:claim.initial_approval_event,approved_entered_at:event.created_at,references:[claim.initial_approval_event,claim.continuation.answer.id],approval_event:event.id};
 p.history=[...(p.history??[]),...(p.continuation?[p.continuation]:[])];p.predecessor=a.id;p.manifest=a.result.manifest;p.continuation=claim.continuation;
 demand(p.manifest,'Missing attributable partial-work manifest');
 return {id:attemptUUID(p),payload:p,plan:{kind:'answer',approval_event_id:event.id,source_digest:p.source.source_digest}};
}
function validateContinuationComments(p,comments) {
 if(p.authorization.kind!=='answer')return;
 for(const c of [...(p.history??[]),p.continuation]){
 const q=c.question,answer=c.answer,predecessorId=q.id.slice(0,-3);
 const predecessor={id:predecessorId,payload:p,result:{id:predecessorId+'-result',question:{text:q.text,context:q.context}}};
 const questions=comments.filter(x=>x.id===q.comment_id);
 demand(questions.length===1 && questions[0].user?.id===OWNER_ID && questions[0].created_at===questions[0].updated_at && questions[0].body===questionBody(predecessor) && sha256(questions[0].body)===q.body_sha256,'Consumed question changed/deleted');
 const answers=comments.filter(x=>x.user?.id===OWNER_ID && x.body.startsWith(`answer ${q.id}:`) && Date.parse(x.created_at)>Date.parse(q.created_at));
 demand(answers.length===1 && answers[0].id===answer.id && answers[0].body===answer.body && answers[0].created_at===answer.created_at && answers[0].updated_at===answer.updated_at && sha256(answers[0].body)===answer.body_sha256,'Consumed answer changed/deleted/competing');
 }
}
function selectBuildCandidate(issues,events,questions) {
 demand(!issues.some(i=>!i.pull_request && i.labels?.some(l=>(typeof l==='string'?l:l.name)==='Building')),'Orphan Building requires owner reconciliation');
 const candidates=issues.filter(i=>eligible(i) && i.labels?.some(l=>(typeof l==='string'?l:l.name)==='Approved'));
 const key=i=>{
  const derived=questions.filter(a=>a.payload.issue_number===i.number && a.question?.claim && !a.question.consumed_by_attempt);
  demand(derived.length<=1,'Ambiguous continuation queue');
  const event=events.filter(e=>e.issue?.number===i.number && e.label?.name==='Approved' && ['labeled','unlabeled'].includes(e.event)).sort((a,b)=>a.id-b.id).at(-1);
  demand(event?.event==='labeled' && Number.isFinite(Date.parse(event.created_at)),'Missing Approved-entry queue history');
  return [derived.length?0:1,Date.parse(event.created_at),i.number];
 };
 return candidates.map(i=>({issue:i,key:key(i)})).sort((a,b)=>a.key[0]-b.key[0]||a.key[1]-b.key[1]||a.key[2]-b.key[2])[0]?.issue??null;
}
module.exports = {questionBody,questionPlan,parseOwnerAnswer,answerPlan,continuationPayload,selectBuildCandidate,validateContinuationComments};
