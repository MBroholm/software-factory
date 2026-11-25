// Offline source packaging only. Never imports, activates or executes a workflow.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname,'../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const file = path.join(root,'factory/workflows/refine.json');
const workflow = JSON.parse(fs.readFileSync(file,'utf8'));
const runtime = read('factory/scripts/refinement-runtime.cjs').split('module.exports =')[0];
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
  const n = {id:hash('refine:'+name).slice(0,32),name,type:`n8n-nodes-base.${type}`,typeVersion:{code:2,if:2.2,httpRequest:4.2,splitInBatches:3,stickyNote:1,dataTable:1.1}[type],position:[2000+workflow.nodes.length*200,0],parameters,...extra};
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
function http(name,url,{method='GET',body,paginated=false,gemini=false}={}) {
  const parameters = {method,url,authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth',
    sendHeaders:true,headerParameters:{parameters:gemini ? [{name:'Content-Type',value:'application/json'}] : [{name:'Accept',value:'application/vnd.github+json'},{name:'X-GitHub-Api-Version',value:'2026-03-10'}]},
    options:{timeout:gemini?120000:30000,redirect:{redirect:{followRedirects:false}},response:{response:{responseFormat:'json',fullResponse:true,neverError:true}}}};
  if (body) Object.assign(parameters,{sendBody:true,specifyBody:'json',jsonBody:body});
  if (paginated) {
    parameters.sendQuery = true;
    parameters.queryParameters = {parameters:[{name:'per_page',value:'100'}]};
    parameters.options.pagination = {pagination:{paginationMode:'updateAParameterInEachRequest',parameters:{parameters:[{type:'qs',name:'page',value:'={{ $pageCount + 1 }}'}]},
      paginationCompleteWhen:'other',completeExpression:'={{ $response.statusCode !== 200 || !Array.isArray($response.body) || $response.body.length < 100 }}',limitPagesFetched:true,maxRequests:100,requestInterval:200}};
  }
  return add(name,'httpRequest',parameters,{credentials:{httpHeaderAuth:{id:gemini?'OWNER_SELECT_GEMINI_HEADER_CREDENTIAL':'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL',name:gemini?'Basic A Gemini x-goog-api-key':'Basic A GitHub Authorization'}},retryOnFail:false});
}
const base = 'https://api.github.com/repos/MBroholm/software-factory/issues';
const issueURL = `('${base}/' + $('Plan revision').first().json.issue.number)`;
const candidateURL = `('${base}/' + $('Each candidate').first(1, -1).json.number)`;
const body = name => `$('${name}').first().json.body`;
const values = name => `pages($('${name}').all().map(i=>i.json))`;
const plan = `$('Plan revision').first().json`;
http('Discover issues',base+'?state=open&sort=created&direction=asc',{paginated:true});
code('Discover candidates',`const candidates = discover(pages($input.all().map(i=>i.json)));\nreturn candidates.length ? candidates.map(issue=>({json:issue})) : [{json:{no_candidates:true}}];`);
gate('Have candidates','!$json.no_candidates');
add('Each candidate','splitInBatches',{batchSize:1,options:{}});
http('Read stage events',`={{ ${candidateURL} + '/events' }}`,{paginated:true});
http('Read source comments',`={{ ${candidateURL} + '/comments' }}`,{paginated:true});
code('Plan revision',`const comments = ${values('Read source comments')};\nconst p = analyze($('Each candidate').first(1, -1).json, comments, ${values('Read stage events')});\np.issue_comment_watermark = Math.max(0,...comments.map(c=>c.id));\nreturn [{json:p}];`);
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
code('Prepare Gemini',`demand($('Read Refining issue').first().json.statusCode===200,'Issue read failed');\nconst p=${plan}; unchanged(p,${body('Read Refining issue')},${values('Read Refining comments')},'Refining');\nconst payload=p.existing ? null : request(p,${JSON.stringify(prompt)},${JSON.stringify(template)},${JSON.stringify(schema)});\nreturn [{json:{...p,payload,artifacts:${JSON.stringify(artifacts)}}}];`);
gate('Reuse marked output','$json.existing !== null');
http('Gemini generateContent','https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',{method:'POST',body:'={{ $json.payload }}',gemini:true});
code('Validate and render',`const r=$input.first().json; demand(r.statusCode===200,'Gemini request failed; inspect private execution, no retry');\nconst result=validateOutput(r.body);\nreturn [{json:{body:render(${plan},result,${JSON.stringify(template)}),model_version:result.model_version,usage:result.usage}}];`);
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
code('Success',`demand($('Read final issue').first().json.statusCode===200,'Final issue read failed');\nconst p=${plan}, issue=${body('Read final issue')}, comments=${values('Read final comments')};\nunchanged(p,issue,comments,'Ready for approval');\nconst matches=history(comments,issue).filter(r=>r.meta.source_key===p.meta.source_key); demand(matches.length===1,'Final refinement missing');\nreturn [{json:{outcome:'success',acknowledged:true,issue_number:p.issue.number,source_key:p.meta.source_key,refinement_comment_id:matches[0].comment.id}}];`);
chain('Verify acquisition','Discover issues','Discover candidates','Have candidates');
connect('Have candidates','Each candidate',0); connect('Have candidates','No work',1);
connect('Each candidate','No work',0); connect('Each candidate','Read stage events',1);
chain('Read stage events','Read source comments','Plan revision','New revision');
connect('New revision','Set issue context',0); connect('New revision','Each candidate',1);
chain('Set issue context','Check issue context','Reread source issue','Reread stage events','Reread source comments','Validate before Refining','Add Refining');
chain('Check removed Refining','Read Refining issue','Read Refining comments','Prepare Gemini','Reuse marked output');
connect('Reuse marked output','Read before Ready',0); connect('Reuse marked output','Gemini generateContent',1);
chain('Gemini generateContent','Validate and render','Read before comment','Comments before post','Validate before comment','Post refinement','Check comment receipt','Read before Ready');
chain('Read before Ready','Comments before Ready','Validate before Ready','Add Ready');
chain('Check removed Ready','Read final issue','Read final comments','Success','Require acknowledged completion');
connect('No work','Require acknowledged completion');
add('Review and isolated testing only','stickyNote',{content:'## US1 — INACTIVE, owner manual import after review\nMap EVERY Data Table to the same isolated control table. Map GitHub Authorization header and Gemini x-goog-api-key credentials privately. No token values in this JSON. Execute whole workflow only with all schedules paused/drained. No stranded-state recovery or write retries. See evidence/refinement-validation.md. Runtime prompt v3 / template v1 embedded by build-refine.cjs. Production activation remains gated.',height:300,width:750});
workflow.name='Basic A refine — US1 INACTIVE'; workflow.active=false; workflow.pinData={};
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
