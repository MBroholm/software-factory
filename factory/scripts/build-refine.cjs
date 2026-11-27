// Offline source packaging only. Never imports, activates or executes a workflow.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname,'../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const file = path.join(root,'factory/workflows/refine.json');
const workflow = JSON.parse(fs.readFileSync(file,'utf8'));
const runtime = ['refinement-runtime','reservation-runtime','basic-b-protocol','collection-runtime','question-runtime'].map(n=>read('factory/scripts/'+n+'.cjs').split('module.exports =')[0]).join('\n');
const prompt = read('factory/prompts/refinement.md'), template = read('factory/templates/task.md');
const schema = JSON.parse(read('factory/templates/refinement.schema.json'));
const artifacts = {prompt_sha256:hash(prompt),template_sha256:hash(template),runtime_sha256:hash(runtime),schema_sha256:hash(JSON.stringify(schema))};
function hash(s) { return createHash('sha256').update(s).digest('hex'); }
const guardNames = ['Manual isolated test','Poll inactive','Read control','Validate entry','Already held','Report existing hold','Prepare acquisition','Acquire control','Check acquire receipt','Read acquired control','Verify acquisition','Require acknowledged completion','Read before release','Verify release ownership','Release control','Check release receipt','Read released control','Confirm idle','Report completion'];
workflow.nodes = workflow.nodes.filter(n => guardNames.includes(n.name));
workflow.connections = Object.fromEntries(Object.entries(workflow.connections).filter(([name]) => guardNames.includes(name)));
for (const name of ['Verify release ownership','Check release receipt','Confirm idle']) {
  const n = workflow.nodes.find(n => n.name === name);
  n.parameters.jsCode = n.parameters.jsCode.replace('row.issue_number !== expected.issue_number', "row.issue_number !== $('Require acknowledged completion').first().json.issue_number");
}
function add(name,type,parameters,extra={}) {
  const n = {id:hash('refine:'+name).slice(0,32),name,type:`n8n-nodes-base.${type}`,typeVersion:{code:2,if:2.2,httpRequest:4.2,splitInBatches:3,stickyNote:1,dataTable:1.1,wait:1.1}[type],position:[2000+workflow.nodes.length*200,0],parameters,...extra};
  workflow.nodes.push(n); return n;
}
function code(name,body) { return add(name,'code',{mode:'runOnceForAllItems',jsCode:runtime+'\nreturn (() => {\n'+body+'\n})();'}); }
function connect(from,to,branch=0) {
  workflow.connections[from] ??= {main:[]};
  workflow.connections[from].main[branch] = [{node:to,type:'main',index:0}];
}
function chain(...names) { for(let i=1;i<names.length;i++) connect(names[i-1],names[i]); }
function gate(name,expression) {
  return add(name,'if',{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:hash(name).slice(0,16),leftValue:`={{ ${expression} }}`,rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}});
}
function http(name,url,{method='GET',body,paginated=false,gemini=false,runner=false}={}) {
  const parameters = {method,url,authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth',
    sendHeaders:true,headerParameters:{parameters:runner ? [] : gemini ? [{name:'Content-Type',value:'application/json'}] : [{name:'Accept',value:'application/vnd.github+json'},{name:'X-GitHub-Api-Version',value:'2026-03-10'}]},
    options:{timeout:gemini?120000:10000,redirect:{redirect:{followRedirects:false}},response:{response:{responseFormat:'json',fullResponse:true,neverError:true}}}};
  if (body) Object.assign(parameters,{sendBody:true,specifyBody:'json',jsonBody:'={{ '+body.slice(3,-2).trim().replace(/}}/g,'} }')+' }}'});
  if (paginated) {
    parameters.sendQuery = true;
    parameters.queryParameters = {parameters:[{name:'per_page',value:'100'}]};
    parameters.options.pagination = {pagination:{paginationMode:'updateAParameterInEachRequest',parameters:{parameters:[{type:'qs',name:'page',value:'={{ $pageCount + 1 }}'}]},
      paginationCompleteWhen:'other',completeExpression:'={{ $response.statusCode !== 200 || !Array.isArray($response.body) || $response.body.length < 100 }}',limitPagesFetched:true,maxRequests:100,requestInterval:200}};
  }
  return add(name,'httpRequest',parameters,{credentials:{httpHeaderAuth:{id:runner?'OWNER_SELECT_RUNNER_BEARER_CREDENTIAL':gemini?'OWNER_SELECT_GEMINI_HEADER_CREDENTIAL':'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL',name:runner?'Basic B private runner bearer':gemini?'Basic A Gemini x-goog-api-key':'Basic B GitHub orchestrator'}},retryOnFail:false,executeOnce:true});
}
const base = 'https://api.github.com/repos/MBroholm/software-factory/issues';
const issueURL = `('${base}/' + $('Plan revision').first().json.issue.number)`;
// Omit runIndex: n8n's latest-run default works in its VM evaluator, while
// an explicit -1 returned undefined in native HTTP parameter resolution.
const candidateURL = `('${base}/' + $('Each candidate').first(1).json.number)`;
const body = name => `$('${name}').first().json.body`;
const values = name => `pages($('${name}').all().map(i=>i.json))`;
const plan = `$('Plan revision').first().json`;
http('Discover issues',base+'?state=open&sort=created&direction=asc',{paginated:true});
code('Discover candidates',`const candidates = discover(pages($input.all().map(i=>i.json)));\nreturn candidates.length ? candidates.map(issue=>({json:issue})) : [{json:{no_candidates:true}}];`);
gate('Have candidates','!$json.no_candidates');
add('Each candidate','splitInBatches',{batchSize:1,options:{}});
// This node receives the candidate directly from the loop. Avoid cross-node lookup
// during HTTP parameter resolution; execution 748 resolved that lookup to undefined.
http('Read stage events',`={{ '${base}/' + $json.number + '/events' }}`,{paginated:true});
http('Read source comments',`={{ ${candidateURL} + '/comments' }}`,{paginated:true});
code('Plan revision',`const comments = ${values('Read source comments')};\nconst candidate=$('Each candidate').first(1).json;if(state(candidate)==='Waiting for you')return [{json:{issue:candidate,work:true,question_mode:true}}];const p = analyze(candidate, comments, ${values('Read stage events')});\np.issue_comment_watermark = Math.max(0,...comments.map(c=>c.id));\nreturn [{json:p}];`);
gate('New revision','$json.work');
code('No work',"return [{json:{outcome:'no_work',acknowledged:true,issue_number:null}}];");
const context = structuredClone(workflow.nodes.find(n=>n.name==='Acquire control'));
context.name = 'Set issue context'; context.id = hash(context.name).slice(0,32); context.position=[5200,0];
context.parameters.filters.conditions = [{keyName:'id',condition:'eq',keyValue:"={{ $('Prepare acquisition').first().json.id }}"},{keyName:'busy',condition:'isTrue'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $execution.id }}'}];
context.parameters.columns.value = {issue_number:`={{ ${plan}.issue.number }}`};
workflow.nodes.push(context);
code('Check issue context',`const row=$input.first().json, expected=$('Prepare acquisition').first().json;\ndemand($input.all().length===1 && row.id===expected.id && row.key==='global' && row.busy===true && row.execution_id===expected.execution_id && row.started_at===expected.started_at && row.issue_number===${plan}.issue.number,'Issue context update unconfirmed');\nreturn [{json:row}];`);
http('Reread source issue',`={{ ${issueURL} }}`);
http('Reread stage events',`={{ ${issueURL} + '/events' }}`,{paginated:true});
http('Reread source comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Validate before Refining',`demand($('Reread source issue').first().json.statusCode===200,'Issue read failed');\nconst p=${plan}, issue=${body('Reread source issue')}, comments=${values('Reread source comments')};\nunchanged(p,issue,comments,p.original_state);\nconst current=analyze(issue,comments,${values('Reread stage events')});\ndemand(current.meta.source_key===p.meta.source_key && current.stage_event===p.stage_event && current.history_snapshot===p.history_snapshot,'Source/history changed before transition');\nreturn [{json:p}];`);
function transition(prefix,target,sourceExpression,checkBody) {
  http(`Add ${prefix}`,`={{ ${issueURL} + '/labels' }}`,{method:'POST',body:`={{ {labels:[${JSON.stringify(target)}]} }}`});
  code(`Check added ${prefix}`,`const r=$input.first().json;\ndemand(r.statusCode===200 && Array.isArray(r.body),'Label addition unconfirmed');\nconst labels=r.body.map(l=>l.name), source=${sourceExpression};\ndemand(labels.includes(${JSON.stringify(target)}) && labels.includes(source) && labels.filter(l=>STATES.includes(l)).length===2,'Unexpected label addition');\n${checkBody || ''}\nreturn [{json:{source}}];`);
  http(`Remove ${prefix} source`,`={{ ${issueURL} + '/labels/' + encodeURIComponent($json.source) }}`,{method:'DELETE'});
  code(`Check removed ${prefix}`,`const r=$input.first().json;\ndemand(r.statusCode===200 && Array.isArray(r.body),'Label removal unconfirmed');\nconst labels=r.body.map(l=>l.name); demand(labels.includes(${JSON.stringify(target)}) && labels.filter(l=>STATES.includes(l)).length===1,'Unexpected label removal');\nreturn [{json:{acknowledged:true}}];`);
  chain(`Add ${prefix}`,`Check added ${prefix}`,`Remove ${prefix} source`,`Check removed ${prefix}`);
}
transition('Refining','Refining',`${plan}.original_state`);
http('Read Refining issue',`={{ ${issueURL} }}`);
http('Read Refining comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Prepare Gemini',`demand($('Read Refining issue').first().json.statusCode===200,'Issue read failed');\nconst p=${plan}; unchanged(p,${body('Read Refining issue')},${values('Read Refining comments')},'Refining');\nconst payload=p.existing ? null : request(p,${JSON.stringify(prompt)},${JSON.stringify(template)},${JSON.stringify(schema)});\nreturn [{json:{...p,payload,count_payload:payload?countRequest(payload):null,artifacts:${JSON.stringify(artifacts)}}}];`);
gate('Reuse marked output','$json.existing !== null');
http('Gemini countTokens','https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:countTokens',{method:'POST',body:'={{ $json.count_payload }}',gemini:true});
code('Check token budget',`const r=$input.first().json; demand(r.statusCode===200 && !r.body?.error,'Token count request failed; no inference or retry');\nconst payload=$('Prepare Gemini').first().json.payload;\nconst budget=checkTokenBudget(r.body,payload);\nreturn [{json:{payload,budget}}];`);
code('Initialize generation attempts',`const {payload,budget}=$input.first().json;\nreturn [{json:generationState({payload,budget,attempt:1,attempts:[],wait_before_seconds:0})}];`);
code('Generation state',`const current=generationState($input.first().json);\ndemand(current.budget.payload_sha256===$('Check token budget').first().json.budget.payload_sha256,'Generation payload changed from counted revision');\nreturn [{json:current}];`);
const generationGuard=structuredClone(workflow.nodes.find(n=>n.name==='Read acquired control'));
generationGuard.name='Read generation guard';generationGuard.id=hash(generationGuard.name).slice(0,32);workflow.nodes.push(generationGuard);
code('Verify generation guard',`const rows=$input.all().map(i=>i.json), expected=$('Prepare acquisition').first().json;\ndemand(rows.length===1,'Generation guard must be a singleton');\nconst row=rows[0]; demand(row.id===expected.id && row.key==='global' && row.busy===true && row.execution_id===expected.execution_id && row.started_at===expected.started_at && row.issue_number===${plan}.issue.number,'Generation guard ownership changed; retain hold');\nreturn [{json:$('Generation state').first().json}];`);
http('Read before generation',`={{ ${issueURL} }}`);
http('Comments before generation',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Prepare generation attempt',`demand($('Read before generation').first().json.statusCode===200,'Generation source read failed; retain guard');\nconst p=${plan}, issue=${body('Read before generation')}, comments=${values('Comments before generation')};\nunchanged(p,issue,comments,'Refining');\ndemand(JSON.stringify(history(comments,issue).map(r=>({id:r.comment.id,body:r.comment.body,updated_at:r.comment.updated_at})))===p.history_snapshot,'Refinement history changed before generation');\nreturn [{json:generationState($('Generation state').first().json)}];`);
http('Gemini generateContent','https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',{method:'POST',body:'={{ $json.payload }}',gemini:true});
code('Evaluate generation attempt',`return [{json:generationResult($input.first().json,$('Generation state').first().json)}];`);
gate('Retry unavailable','$json.retry');
add('Retry backoff','wait',{resume:'timeInterval',amount:'={{ $json.retry_delay_seconds }}',unit:'seconds'});
code('Validate and render',`const r=$input.first().json; demand(r.statusCode===200,'Generation response not successful; retain guard');\nconst result=validateOutput(r.body);\nreturn [{json:{body:render(${plan},result,${JSON.stringify(template)}),model_version:result.model_version,usage:result.usage}}];`);
http('Read before comment',`={{ ${issueURL} }}`);
http('Comments before post',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Validate before comment',`demand($('Read before comment').first().json.statusCode===200,'Issue read failed');\nconst comments=${values('Comments before post')}; unchanged(${plan},${body('Read before comment')},comments,'Refining');\ndemand(JSON.stringify(history(comments,${body('Read before comment')}).map(r=>({id:r.comment.id,body:r.comment.body,updated_at:r.comment.updated_at})))===${plan}.history_snapshot,'Refinement history changed');\nreturn [{json:$('Validate and render').first().json}];`);
http('Post refinement',`={{ ${issueURL} + '/comments' }}`,{method:'POST',body:'={{ {body:$json.body} }}'});
code('Check comment receipt',`const r=$input.first().json; demand(r.statusCode===201 && Number.isSafeInteger(r.body?.id) && r.body.user?.id===OWNER_ID && r.body.body===$('Validate and render').first().json.body,'Comment POST unconfirmed; never retry blindly');\nreturn [{json:{comment_id:r.body.id}}];`);
http('Read before Ready',`={{ ${issueURL} }}`);
http('Comments before Ready',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Validate before Ready',`demand($('Read before Ready').first().json.statusCode===200,'Issue read failed');\nconst p=${plan}, issue=${body('Read before Ready')}, comments=${values('Comments before Ready')};\nunchanged(p,issue,comments,'Refining');\nconst revisions=history(comments,issue), matches=revisions.filter(r=>r.meta.source_key===p.meta.source_key);\ndemand(matches.length===1 && revisions.at(-1)===matches[0], 'Current marked output not confirmed');\nif (p.existing) demand(matches[0].comment.body===p.existing.body,'Existing output changed');\nelse demand(matches[0].comment.body===$('Validate and render').first().json.body,'Posted output changed');\nreturn [{json:{acknowledged:true}}];`);
transition('Ready','Ready for approval',"'Refining'");
http('Read final issue',`={{ ${issueURL} }}`);
http('Read final comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Success',`demand($('Read final issue').first().json.statusCode===200,'Final issue read failed');\nconst p=${plan}, issue=${body('Read final issue')}, comments=${values('Read final comments')};\nunchanged(p,issue,comments,'Ready for approval');\nconst matches=history(comments,issue).filter(r=>r.meta.source_key===p.meta.source_key); demand(matches.length===1,'Final refinement missing');\nconst budget=p.existing?null:$('Check token budget').first().json.budget;\nconst generation=p.existing?null:$('Evaluate generation attempt').first().json.generation;\nreturn [{json:{outcome:'success',acknowledged:true,issue_number:p.issue.number,source_key:p.meta.source_key,refinement_comment_id:matches[0].comment.id,budget,generation}}];`);
gate('Question revision',"$json.question_mode === true || $('Plan revision').first().json.question_mode === true");
http('Read question registry','http://RUNNER_PRIVATE_HOST:8787/v1/questions',{runner:true});
http('Read Waiting issue',`={{ ${issueURL} }}`);
http('Read Waiting comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Plan owner answer',`demand($('Read question registry').first().json.statusCode===200 && $('Read Waiting issue').first().json.statusCode===200,'Question reads failed');const registry=${body('Read question registry')};demand(Array.isArray(registry),'Invalid question registry');const prior=registry.filter(a=>a.payload.issue_number===${plan}.issue.number && a.status==='released' && !a.question.consumed_by_attempt);demand(prior.length===1,'Missing/ambiguous released question');const decision=answerPlan(${body('Read Waiting issue')},${values('Read Waiting comments')},prior[0]);return [{json:{...decision,predecessor:prior[0].id}}];`);
gate('Have scoped answer',"$json.action === 'claim_answer'");
gate('Changed answer scope',"$json.action === 'refine_changed_scope'");
code('Report unanswered question',`const p=$('Plan owner answer').first().json;return [{json:{acknowledged:true,outcome:'no_work',issue_number:p.issue_number,question_decision:p.action,message:p.message??'Waiting for one matching owner answer.'}}];`);
const answerPlanRef="$('Plan owner answer').first().json",answerURL=`'http://RUNNER_PRIVATE_HOST:8787/v1/attempts/' + ${answerPlanRef}.predecessor`;
http('Persist scoped answer',`={{ ${answerURL} + '/answer' }}`,{runner:true,method:'PUT',body:`={{ ${answerPlanRef}.claim }}`});
code('Verify answer claim',`const r=$input.first().json;demand(r.statusCode===200 && sortedJSON(r.body)===sortedJSON(${answerPlanRef}.claim),'Answer claim unconfirmed');return [{json:r.body}];`);
http('Recheck answered issue',`={{ ${issueURL} }}`);
http('Recheck answered comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Validate before derived approval',`const r=$('Recheck answered issue').first().json;demand(r.statusCode===200,'Issue reread failed');const a=${body('Read question registry')}.find(a=>a.id===${answerPlanRef}.predecessor);const decision=answerPlan(r.body,${values('Recheck answered comments')},a);demand(decision.action==='claim_answer' && sortedJSON(decision.claim)===sortedJSON(${answerPlanRef}.claim),'Answer/source changed before derived approval');return [{json:decision}];`);
http('Add answered Approved',`={{ ${issueURL} + '/labels' }}`,{method:'POST',body:'={{ {labels:["Approved"]} }}'});
code('Check answered Approved',`const r=$input.first().json;demand(r.statusCode===200 && Array.isArray(r.body) && r.body.some(l=>l.name==='Approved') && r.body.some(l=>l.name==='Waiting for you') && r.body.filter(l=>STATES.includes(l.name)).length===2,'Derived approval addition unconfirmed');return [{json:{}}];`);
http('Remove answered Waiting',`={{ ${issueURL} + '/labels/Waiting%20for%20you' }}`,{method:'DELETE'});
code('Check answered Waiting removal',`const r=$input.first().json;demand(r.statusCode===200 && Array.isArray(r.body) && r.body.filter(l=>STATES.includes(l.name)).length===1 && r.body.some(l=>l.name==='Approved'),'Derived approval removal unconfirmed');return [{json:{}}];`);
http('Read answered final issue',`={{ ${issueURL} }}`);
http('Read answered final comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
http('Read answered final events',`={{ ${issueURL} + '/events' }}`,{paginated:true});
code('Verify answered approval',`const r=$('Read answered final issue').first().json;demand(r.statusCode===200 && eligible(r.body) && state(r.body)==='Approved','Derived approval readback failed');const old=${body('Read question registry')}.find(a=>a.id===${answerPlanRef}.predecessor),a={...old,question:{...old.question,claim:$('Verify answer claim').first().json}};const next=continuationPayload(r.body,${values('Read answered final comments')},${values('Read answered final events')},a);return [{json:{acknowledged:true,outcome:'success',issue_number:r.body.number,authorization_id:next.payload.authorization.id}}];`);
const scopeBody="{phase:'intent',content:{state:'Ideas'},external:null}";
http('Journal changed scope',`={{ ${answerURL} + '/effects/scope_refinement' }}`,{runner:true,method:'PUT',body:`={{ ${scopeBody} }}`});
code('Verify changed scope intent',`demand($input.first().json.statusCode===200,'Changed-scope intent unconfirmed');return [{json:{}}];`);
http('Recheck changed scope issue',`={{ ${issueURL} }}`);
http('Recheck changed scope comments',`={{ ${issueURL} + '/comments' }}`,{paginated:true});
code('Validate changed scope routing',`const r=$('Recheck changed scope issue').first().json;demand(r.statusCode===200,'Scope issue read failed');const a=${body('Read question registry')}.find(a=>a.id===${answerPlanRef}.predecessor);demand(answerPlan(r.body,${values('Recheck changed scope comments')},a).action==='refine_changed_scope','Scope reply changed');return [{json:{}}];`);
http('Add changed scope Ideas',`={{ ${issueURL} + '/labels' }}`,{method:'POST',body:'={{ {labels:["Ideas"]} }}'});
code('Check changed scope Ideas',`const r=$input.first().json;demand(r.statusCode===200 && Array.isArray(r.body) && r.body.some(l=>l.name==='Ideas') && r.body.some(l=>l.name==='Waiting for you') && r.body.filter(l=>STATES.includes(l.name)).length===2,'Changed scope addition unconfirmed');return [{json:{}}];`);
http('Remove changed scope Waiting',`={{ ${issueURL} + '/labels/Waiting%20for%20you' }}`,{method:'DELETE'});
code('Check changed scope removal',`demand($input.first().json.statusCode===200,'Changed scope removal unconfirmed');return [{json:{}}];`);
http('Read changed scope final issue',`={{ ${issueURL} }}`);
code('Verify changed scope state',`const r=$input.first().json;demand(r.statusCode===200 && eligible(r.body) && state(r.body)==='Ideas','Changed scope state unconfirmed');return [{json:{}}];`);
http('Confirm changed scope',`={{ ${answerURL} + '/effects/scope_refinement' }}`,{runner:true,method:'PUT',body:`={{ {phase:'confirmed',content:{state:'Ideas'},external:{state:'Ideas',issue_number:${plan}.issue.number}} }}`});
code('Complete changed scope',`demand($input.first().json.statusCode===200,'Changed scope confirmation failed');return [{json:{acknowledged:true,outcome:'success',issue_number:${plan}.issue.number,question_decision:'refinement_required'}}];`);
chain('Read question registry','Read Waiting issue','Read Waiting comments','Plan owner answer','Have scoped answer');connect('Have scoped answer','Persist scoped answer');connect('Have scoped answer','Changed answer scope',1);connect('Changed answer scope','Journal changed scope');connect('Changed answer scope','Report unanswered question',1);connect('Report unanswered question','Require acknowledged completion');
chain('Persist scoped answer','Verify answer claim','Recheck answered issue','Recheck answered comments','Validate before derived approval','Add answered Approved','Check answered Approved','Remove answered Waiting','Check answered Waiting removal','Read answered final issue','Read answered final comments','Read answered final events','Verify answered approval','Require acknowledged completion');
chain('Journal changed scope','Verify changed scope intent','Recheck changed scope issue','Recheck changed scope comments','Validate changed scope routing','Add changed scope Ideas','Check changed scope Ideas','Remove changed scope Waiting','Check changed scope removal','Read changed scope final issue','Verify changed scope state','Confirm changed scope','Complete changed scope','Require acknowledged completion');
workflow.nodes.find(n=>n.name==='Report completion').parameters.jsCode="const work=$('Require acknowledged completion').first().json;\nreturn [{json:{status:'released',outcome:work.outcome,question_decision:work.question_decision??null,message:work.message??null,authorization_id:work.authorization_id??null,...(work.outcome==='success'?{issue_number:work.issue_number,source_key:work.source_key,refinement_comment_id:work.refinement_comment_id,budget:work.budget,generation:work.generation}:{}),control:$input.first().json}}];";
chain('Verify acquisition','Discover issues','Discover candidates','Have candidates');
connect('Have candidates','Each candidate',0); connect('Have candidates','No work',1);
connect('Each candidate','No work',0); connect('Each candidate','Read stage events',1);
chain('Read stage events','Read source comments','Plan revision','New revision');
connect('New revision','Set issue context',0); connect('New revision','Each candidate',1);
chain('Set issue context','Check issue context','Question revision');connect('Question revision','Read question registry');connect('Question revision','Reread source issue',1);chain('Reread source issue','Reread stage events','Reread source comments','Validate before Refining','Add Refining');
chain('Check removed Refining','Read Refining issue','Read Refining comments','Prepare Gemini','Reuse marked output');
connect('Reuse marked output','Read before Ready',0); connect('Reuse marked output','Gemini countTokens',1);
chain('Gemini countTokens','Check token budget','Initialize generation attempts','Generation state','Read generation guard','Verify generation guard','Read before generation','Comments before generation','Prepare generation attempt','Gemini generateContent','Evaluate generation attempt','Retry unavailable');
connect('Retry unavailable','Retry backoff',0);connect('Retry unavailable','Validate and render',1);
connect('Retry backoff','Generation state');
chain('Validate and render','Read before comment','Comments before post','Validate before comment','Post refinement','Check comment receipt','Read before Ready');
chain('Read before Ready','Comments before Ready','Validate before Ready','Add Ready');
chain('Check removed Ready','Read final issue','Read final comments','Success','Require acknowledged completion');
connect('No work','Require acknowledged completion');
add('Review and isolated testing only','stickyNote',{content:'## US2 — INACTIVE, owner manual import after review\nMap EVERY Data Table to the same isolated control table. Map GitHub, Gemini and separate private runner bearer credentials privately; configure the reviewed runner address. No token values in this JSON. Execute whole workflow only with all schedules paused/drained. No stranded-state recovery or write retries. See evidence/refinement-validation.md. Runtime prompt v3 / template v1 embedded by build-refine.cjs. Production activation remains gated.',height:300,width:750});
workflow.name='Basic B refine — US2 INACTIVE'; workflow.active=false; workflow.pinData={};
// Document each operational node and group the canvas by purpose. No execution changes.
const stages = require('./refinement-notes.cjs');
const documented = new Set();
let stageY = 0;
for (const stage of stages) {
  const height = Math.max(440, Math.ceil(stage.nodes.length / 8) * 240);
  const note = add(stage.title,'stickyNote',{content:`## ${stage.title}\n\n${stage.summary}`,height,width:420,color:stage.color});
  note.position = [-480,stageY-60];
  stage.nodes.forEach(([name,notes,visible=false],i) => {
    const node = workflow.nodes.find(n=>n.name===name);
    if (!node || documented.has(name)) throw Error(`Invalid documentation entry: ${name}`);
    if (typeof notes !== 'string' || !notes.trim()) throw Error(`Empty node notes: ${name}`);
    documented.add(name);
    node.notes = notes;
    node.notesInFlow = visible;
    node.position = [(i%8)*300,stageY+Math.floor(i/8)*240];
  });
  stageY += height+160;
}
for (const node of workflow.nodes) {
  if (!node.type.endsWith('.stickyNote') && !documented.has(node.name)) throw Error(`Missing node notes: ${node.name}`);
}
workflow.nodes.find(n=>n.name==='Review and isolated testing only').position = [-480,-440];
workflow.meta={basicA:{scope:'US1 T010-T014',prompt_version:'v3',template_version:'v1',...artifacts}};
const serialized=JSON.stringify(workflow,null,2)+'\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file,'utf8')!==serialized) throw Error('Refine JSON differs from runtime sources; rebuild before review');
  console.log('Refine JSON matches reviewed runtime sources');
} else { fs.writeFileSync(file,serialized); console.log('Packaged inactive refine JSON offline; no import/execution'); }
