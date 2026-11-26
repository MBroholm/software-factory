// Offline packaging only; never imports, activates or runs workflows.
const fs=require('node:fs'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const file='factory/workflows/reserve.json';
// Shared unchanged T007 guard template; independent of story workflow outputs.
const w=JSON.parse(read('factory/scripts/guard-template.json'));
w.nodes=w.nodes.filter(n=>!['Skeleton work boundary','Review and isolated testing only'].includes(n.name));
delete w.connections['Skeleton work boundary'];
const refinement=read('factory/scripts/refinement-runtime.cjs');
const runtime=refinement.split('function analyze(')[0]+refinement.slice(refinement.indexOf('function pages('),refinement.indexOf('module.exports ='))+read('factory/scripts/reservation-runtime.cjs').split('module.exports =')[0];
function add(name,type,parameters,notes){const n={id:hash('reserve:'+name).slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:{code:2,httpRequest:4.2,if:2.2,stickyNote:1}[type],position:[0,0],parameters,notes};w.nodes.push(n);return n;}
function code(name,body,notes){return add(name,'code',{mode:'runOnceForAllItems',jsCode:runtime+'\n'+body},notes);}
function chain(...names){for(let i=1;i<names.length;i++)connect(names[i-1],names[i]);}
function connect(a,b,branch=0){w.connections[a]??={main:[]};w.connections[a].main[branch]=[{node:b,type:'main',index:0}];}
function http(name,url,{method='GET',body,paginated=false}={},notes){const p={method,url,authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth',sendHeaders:true,headerParameters:{parameters:[{name:'Accept',value:'application/vnd.github+json'},{name:'X-GitHub-Api-Version',value:'2026-03-10'}]},options:{timeout:30000,redirect:{redirect:{followRedirects:false}},response:{response:{responseFormat:'json',fullResponse:true,neverError:true}}}};
 if(body)Object.assign(p,{sendBody:true,specifyBody:'json',jsonBody:body});
 if(paginated){p.sendQuery=true;p.queryParameters={parameters:[{name:'per_page',value:'100'}]};p.options.pagination={pagination:{paginationMode:'updateAParameterInEachRequest',parameters:{parameters:[{type:'qs',name:'page',value:'={{ $pageCount + 1 }}'}]},paginationCompleteWhen:'other',completeExpression:'={{ $response.statusCode !== 200 || !Array.isArray($response.body) || $response.body.length < 100 }}',limitPagesFetched:true,maxRequests:100,requestInterval:200}};}
 return Object.assign(add(name,'httpRequest',p,notes),{credentials:{httpHeaderAuth:{id:'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL',name:'Basic A GitHub Authorization'}},retryOnFail:false,executeOnce:true});}
const base='https://api.github.com/repos/MBroholm/software-factory';
const selected="$('Select candidate').first().json";
const plan="$('Validate approval').first().json";
const url=`('${base}/issues/' + ${selected}.issue.number)`;
const vals=name=>`pages($('${name}').all().map(i=>i.json))`;
const response=name=>`$('${name}').first().json`;
http('Discover all issues',base+'/issues?state=all&sort=created&direction=asc',{paginated:true},'Read every issue, including closed/non-owner Building conflicts. Pagination failures hold the acquired guard.');
code('Select candidate',`const candidates=reservationCandidates(pages($input.all().map(i=>i.json)));\nreturn [{json:{issue:candidates[0]??null}}];`,'Any Building issue blocks selection. Otherwise choose the lowest-numbered open owner Approved task. Malformed approval states fail closed.');
add('Have candidate','if',{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:'candidate',leftValue:'={{ $json.issue !== null }}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}},'No candidate or occupied slot uses acknowledged no-work release; a candidate proceeds to approval evidence checks.');
code('No work',"return [{json:{outcome:'no_work',acknowledged:true,issue_number:null}}];",'Release only this execution interlock. Existing Building reservations persist.');
http('Read approval events',`={{ ${url} + '/events' }}`,{paginated:true},'Read complete label history. Require current owner Approved event, not assignment or inferred approval.');
http('Read approved comments',`={{ ${url} + '/comments' }}`,{paginated:true},'Read refinement/captured source and prior handoff evidence. Later session comments do not enter the captured digest.');
code('Validate approval',`const p=approval(${selected}.issue,${vals('Read approved comments')},${vals('Read approval events')});\ncheckHandoffs(${vals('Read approved comments')},p);return [{json:p}];`,'Validate latest unedited refinement and owner event ID/actor/time, captured source digest and absence of a handoff for this attempt. Missing/edited history holds, never approves.');
const context=structuredClone(w.nodes.find(n=>n.name==='Acquire control'));context.name='Set issue context';context.id=hash(context.name).slice(0,32);
context.parameters.filters.conditions=[{keyName:'id',condition:'eq',keyValue:"={{ $('Prepare acquisition').first().json.id }}"},{keyName:'busy',condition:'isTrue'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $execution.id }}'}];
context.parameters.columns.value={issue_number:`={{ ${plan}.issue_number }}`};context.notes='Set diagnostic issue only while this execution owns the busy row. Failure retains hold.';w.nodes.push(context);
code('Check issue context',`const rows=$input.all().map(i=>i.json),r=rows[0],e=$('Prepare acquisition').first().json;\ndemand(rows.length===1 && r.id===e.id && r.key==='global' && r.busy===true && r.execution_id===e.execution_id && r.started_at===e.started_at && r.issue_number===${plan}.issue_number,'Issue context unconfirmed');return [{json:r}];`,'Confirm singleton update receipt and ownership before any GitHub mutation.');
http('Read PR baseline',base+'/pulls?state=all&sort=created&direction=asc',{paginated:true},'Capture same-repository issue-N/main PR numbers, head SHAs and states, including old closed results for later rework discrimination.');
http('Recheck slot',base+'/issues?state=all&sort=created&direction=asc',{paginated:true},'Repeat whole-repository slot discovery immediately before transition to detect intervening reservations. A changed slot stops held for inspection.');
http('Recheck issue',`={{ ${url} }}`,{},'Re-read open/author/labels/title/body immediately before transition; do not trust discovery snapshot.');
http('Recheck events',`={{ ${url} + '/events' }}`,{paginated:true},'Re-read approval event to detect removal/reapproval before reservation.');
http('Recheck comments',`={{ ${url} + '/comments' }}`,{paginated:true},'Re-read captured inputs, refinement and handoffs to detect source/history edits before mutation.');
code('Prepare handoff',`const r=${response('Recheck issue')};demand(r.statusCode===200,'Issue reread failed');\nconst candidates=reservationCandidates(${vals('Recheck slot')});demand(candidates[0]?.number===${plan}.issue_number,'Slot/queue changed before reservation');\nsameApproval(${plan},approval(r.body,${vals('Recheck comments')},${vals('Recheck events')}));\ncheckHandoffs(${vals('Recheck comments')},${plan});\nreturn [{json:handoff(${plan},${vals('Read PR baseline')},new Date().toISOString())}];`,'Require unchanged approval/source and free slot. Freeze deterministic attempt metadata and PR baseline before writes; no automatic repair.');
http('Add Building',`={{ ${url} + '/labels' }}`,{method:'POST',body:'={{ {labels:["Building"]} }}'},'Reserve before manual launch by adding Building first. No retry on unknown response; partial transition holds for manual recovery.');
code('Check Building receipt',`const r=$input.first().json;demand(r.statusCode===200 && Array.isArray(r.body),'Building write unconfirmed');const labels=r.body.map(l=>l.name);\ndemand(labels.includes('Building') && labels.includes('Approved') && labels.filter(l=>STATES.includes(l)).length===2,'Unexpected Building receipt');return [{json:{acknowledged:true}}];`,'Confirm both source and target labels in addition receipt. Unrelated labels are preserved by additive operations.');
http('Remove Approved',`={{ ${url} + '/labels/Approved' }}`,{method:'DELETE'},'Remove only Approved after acknowledged Building addition. Never adds Approved or replaces unrelated labels.');
code('Check removal receipt',`const r=$input.first().json;demand(r.statusCode===200 && Array.isArray(r.body),'Approved removal unconfirmed');const labels=r.body.map(l=>l.name);demand(labels.includes('Building') && labels.filter(l=>STATES.includes(l)).length===1,'Partial reservation');return [{json:{acknowledged:true}}];`,'Require sole Building state; uncertain removal leaves busy and reservation for owner reconciliation.');
function verifyStage(prefix){
 http(prefix+' issue',`={{ ${url} }}`,{},'Confirm reserved issue still open, owner-authored and solely Building before proceeding.');
 http(prefix+' events',`={{ ${url} + '/events' }}`,{paginated:true},'Confirm original owner approval and acknowledged removal still define this attempt; newer history holds.');
 http(prefix+' comments',`={{ ${url} + '/comments' }}`,{paginated:true},'Check refinement/source and handoff comment evidence again; edits must not silently authorize changed scope.');
 code(prefix+' validation',`const r=${response(prefix+' issue')};demand(r.statusCode===200,'Reserved issue read failed');sameApproval(${plan},approval(r.body,${vals(prefix+' comments')},${vals(prefix+' events')},'Building'));\n${prefix==='Before post'?`checkHandoffs(${vals(prefix+' comments')},${plan});`:`const matches=${vals(prefix+' comments')}.filter(c=>c.body===$('Prepare handoff').first().json.body);demand(matches.length===1 && matches[0].id===$('Check handoff receipt').first().json.comment_id && matches[0].user?.id===OWNER_ID && matches[0].created_at===matches[0].updated_at,'Handoff readback unconfirmed');`}\nreturn [{json:{outcome:'success',acknowledged:true,issue_number:${plan}.issue_number}}];`,'Revalidate exact approval/refinement/source snapshot. Only confirmed consistent reservation and handoff may release busy.');
 chain(prefix+' issue',prefix+' events',prefix+' comments',prefix+' validation');
}
verifyStage('Before post');
http('Post handoff',`={{ ${url} + '/comments' }}`,{method:'POST',body:"={{ {body:$('Prepare handoff').first().json.body} }}"},'Post one marked handoff keyed by approval event. Unknown POST outcome holds; never retry blindly or launch an agent.');
code('Check handoff receipt',`const r=$input.first().json;demand(r.statusCode===201 && Number.isSafeInteger(r.body?.id) && r.body.user?.id===OWNER_ID && r.body.body===$('Prepare handoff').first().json.body,'Handoff POST unconfirmed');return [{json:{comment_id:r.body.id}}];`,'Require created-comment status, ID, expected actor and exact body before final readback.');
verifyStage('Final');
for(const name of ['Verify release ownership','Check release receipt','Confirm idle']) {const n=w.nodes.find(n=>n.name===name);n.parameters.jsCode=n.parameters.jsCode.replace('row.issue_number !== expected.issue_number',"row.issue_number !== $('Require acknowledged completion').first().json.issue_number");}
chain('Verify acquisition','Discover all issues','Select candidate','Have candidate');connect('Have candidate','Read approval events');connect('Have candidate','No work',1);
chain('Read approval events','Read approved comments','Validate approval','Set issue context','Check issue context','Read PR baseline','Recheck slot','Recheck issue','Recheck events','Recheck comments','Prepare handoff','Add Building','Check Building receipt','Remove Approved','Check removal receipt','Before post issue');
chain('Before post validation','Post handoff','Check handoff receipt','Final issue');chain('Final validation','Require acknowledged completion');connect('No work','Require acknowledged completion');
w.name='Basic A reserve — US2 INACTIVE';w.active=false;w.pinData={};
// Every operational node has source-maintained notes; common guard text follows its actual role.
for(const n of w.nodes){if(!n.notes)n.notes=({
 'Manual isolated test':'Whole-workflow isolated entry only, with all mutating schedules paused/drained.',
 'Poll inactive':'60-second scheduled entry; owner activation requires reviewed manual import and native validation.',
 'Read control':'Read up to two rows to expose missing/duplicate singleton control state.',
 'Validate entry':'Validate one global row and typed context; malformed state stops before remote work.',
 'Already held':'A busy row skips all work and preserves the previous execution hold.',
 'Report existing hold':'Expose held diagnostic context without changing or releasing it.',
 'Prepare acquisition':'Prepare execution ID, start time and nullable issue context for conditional acquisition.',
 'Acquire control':'Conditionally set busy on idle global row. This is a serialized interlock, not a distributed lock.',
 'Check acquire receipt':'Require exact acquisition receipt; failed/unknown acquisition prevents remote work.',
 'Read acquired control':'Reread persisted row to verify acquisition rather than assuming update success.',
 'Verify acquisition':'Require this execution owns the singleton busy row before GitHub calls.',
 'Require acknowledged completion':'Only acknowledged success/no-work reaches release. Errors have no release edge.',
 'Read before release':'Reread singleton to prevent release of another execution hold.',
 'Verify release ownership':'Check execution/start/selected issue against acquired and completed context before release.',
 'Release control':'Clear busy only, after acknowledged work. Building and diagnostic fields persist.',
 'Check release receipt':'Verify busy=false receipt and unchanged execution/issue context; uncertainty is not success.',
 'Read released control':'Reread persistence to confirm idle instead of trusting the update receipt alone.',
 'Confirm idle':'Require confirmed idle singleton with unchanged diagnostics before reporting completion.',
 'Report completion':'Report acknowledged outcome and confirmed row; this does not confirm manual Codex launch.'
 })[n.name];if(!n.notes)throw Error('Missing notes '+n.name);}
const groups=[['1. Acquire execution guard',w.nodes.slice(0,11).map(n=>n.name),'Skip existing holds; acquire and verify before remote work.'],['2. Select and validate approval',['Discover all issues','Select candidate','Have candidate','No work','Read approval events','Read approved comments','Validate approval','Set issue context','Check issue context','Read PR baseline'],'All Building issues block. Owner approval and exact captured source are mandatory.'],['3. Reserve and post handoff',['Recheck slot','Recheck issue','Recheck events','Recheck comments','Prepare handoff','Add Building','Check Building receipt','Remove Approved','Check removal receipt',...['Before post issue','Before post events','Before post comments','Before post validation'],'Post handoff','Check handoff receipt',...['Final issue','Final events','Final comments','Final validation']],'Recheck before writes; add Building, remove Approved, post/read back handoff. Unknown effects retain busy. No launcher.'],['4. Release acknowledged execution',['Require acknowledged completion','Read before release','Verify release ownership','Release control','Check release receipt','Read released control','Confirm idle','Report completion'],'Release short-lived busy only after acknowledged success/no-work. Building survives restart and delayed launch.']];
const documented=new Set();groups.forEach(([title,names,summary],g)=>{add(title,'stickyNote',{content:`## ${title}\n\n${summary}`,height:300,width:400},undefined).position=[-460,g*1000];names.forEach((name,i)=>{const n=w.nodes.find(n=>n.name===name);if(!n||documented.has(name))throw Error('Invalid layout '+name);documented.add(name);n.position=[i%7*300,g*1000+Math.floor(i/7)*240];});});
for(const n of w.nodes)if(!n.type.endsWith('.stickyNote')&&!documented.has(n.name))throw Error('Missing layout '+n.name);
add('Owner review and manual import','stickyNote',{content:'## US2 inactive import handoff\nOwner reviews JSON in PR and manually imports. Map every Data Table to the SAME isolated control table and each HTTP node to saved GitHub Authorization header credential. No Gemini credential needed. Never execute individual mutation nodes. See evidence/manual-build-validation.md; native/live T019 remains required.',height:300,width:700}).position=[0,-440];
const output=JSON.stringify(w,null,2)+'\n';if(process.argv.includes('--check')){if(read(file)!==output)throw Error('reserve.json stale; rebuild');console.log('reserve.json matches source');}else fs.writeFileSync(file,output);
