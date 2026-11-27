// Shared offline packaging. Never imports workflows or contacts a runner.
const fs=require('node:fs'),{createHash}=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>createHash('sha256').update(s).digest('hex');
function builder(kind){
 const w=JSON.parse(read('factory/scripts/guard-template.json'));
 w.nodes=w.nodes.filter(n=>!['Skeleton work boundary','Review and isolated testing only'].includes(n.name));delete w.connections['Skeleton work boundary'];
 const refinement=read('factory/scripts/refinement-runtime.cjs');
 const runtime=refinement.split('function analyze(')[0]+refinement.slice(refinement.indexOf('function pages('),refinement.indexOf('module.exports ='))+['reservation-runtime','basic-b-protocol','collection-runtime','question-runtime'].map(name=>read('factory/scripts/'+name+'.cjs').split('module.exports =')[0]).join('\n');
 const add=(name,type,parameters,notes)=>{const n={id:hash(kind+':'+name).slice(0,32),name,type:'n8n-nodes-base.'+type,typeVersion:{code:2,httpRequest:4.2,if:2.2,stickyNote:1}[type],position:[0,0],parameters,notes};w.nodes.push(n);return n;};
 const code=(name,body,notes)=>add(name,'code',{mode:'runOnceForAllItems',jsCode:runtime+'\n'+body},notes);
 const connect=(a,b,branch=0)=>{w.connections[a]??={main:[]};w.connections[a].main[branch]=[{node:b,type:'main',index:0}];};
 const chain=(...names)=>{for(let i=1;i<names.length;i++)connect(names[i-1],names[i]);};
 const cond=(name,expression,notes)=>add(name,'if',{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:hash(name).slice(0,12),leftValue:expression,rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}},notes);
 function http(name,url,{method='GET',body,paginated=false,runner=false}={},notes){
  const p={method,url,authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth',sendHeaders:true,headerParameters:{parameters:runner?[]:[{name:'Accept',value:'application/vnd.github+json'},{name:'X-GitHub-Api-Version',value:'2026-03-10'}]},options:{timeout:10000,redirect:{redirect:{followRedirects:false}},response:{response:{responseFormat:'json',fullResponse:true,neverError:true}}}};
  // Keep nested object closings separate from n8n's expression terminator.
  // VM tokenization treats adjacent `}}` as the end even inside an object expression.
  if(body)Object.assign(p,{sendBody:true,specifyBody:'json',jsonBody:'={{ '+body.slice(3,-2).trim().replace(/}}/g,'} }')+' }}'});
  if(paginated){p.sendQuery=true;p.queryParameters={parameters:[{name:'per_page',value:'100'}]};p.options.pagination={pagination:{paginationMode:'updateAParameterInEachRequest',parameters:{parameters:[{type:'qs',name:'page',value:'={{ $pageCount + 1 }}'}]},paginationCompleteWhen:'other',completeExpression:'={{ $response.statusCode !== 200 || !Array.isArray($response.body) || $response.body.length < 100 }}',limitPagesFetched:true,maxRequests:100,requestInterval:200}};}
  return Object.assign(add(name,'httpRequest',p,notes),{credentials:{httpHeaderAuth:{id:runner?'OWNER_SELECT_RUNNER_BEARER_CREDENTIAL':'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL',name:runner?'Basic B private runner bearer':'Basic B GitHub orchestrator'}},retryOnFail:false,executeOnce:true});
 }
 const response=name=>`$('${name}').first().json`,val=name=>response(name)+'.body',vals=name=>`pages($('${name}').all().map(i=>i.json))`;
 function receipt(name,previous,statuses){code(name,`const r=${response(previous)};demand(${JSON.stringify(statuses)}.includes(r.statusCode),'Unconfirmed ${previous}; retain guard/slot');return [{json:r.body}];`,'Require expected acknowledgement; timeout/unknown response holds without blind retries.');}
 code('No work',"return [{json:{acknowledged:true,outcome:'no_work',issue_number:null}}];",'Release only this execution guard; durable runner reservation remains unchanged.');connect('No work','Require acknowledged completion');
 function context(issueExpression){
  const n=structuredClone(w.nodes.find(n=>n.name==='Acquire control'));n.name='Set issue context';n.id=hash(kind+':context').slice(0,32);
  n.parameters.filters.conditions=[{keyName:'id',condition:'eq',keyValue:"={{ $('Prepare acquisition').first().json.id }}"},{keyName:'busy',condition:'isTrue'},{keyName:'execution_id',condition:'eq',keyValue:'={{ $execution.id }}'}];
  n.parameters.columns.value={issue_number:`={{ ${issueExpression} }}`};n.notes='Set selected issue diagnostic only while this execution owns the workflow guard.';w.nodes.push(n);
  code('Check issue context',`const rows=$input.all().map(i=>i.json),r=rows[0],e=$('Prepare acquisition').first().json;demand(rows.length===1 && r.id===e.id && r.key==='global' && r.busy===true && r.execution_id===e.execution_id && r.started_at===e.started_at && r.issue_number===${issueExpression},'Issue context unconfirmed');return [{json:r}];`,'Read update receipt and verify exact execution/issue ownership before writes.');chain('Set issue context','Check issue context');
 }
 function finish(){
  for(const name of ['Verify release ownership','Check release receipt','Confirm idle']){const n=w.nodes.find(n=>n.name===name);n.parameters.jsCode=n.parameters.jsCode.replace('row.issue_number !== expected.issue_number',"row.issue_number !== $('Require acknowledged completion').first().json.issue_number");}
  for(const n of w.nodes){if(!n.notes)n.notes=({
   'Manual isolated test':'Whole-workflow isolated entry only. Verify separate test destinations before execution.',
   'Poll inactive':'60-second schedule, inactive until reviewed owner manual adoption.',
   'Read control':'Read singleton workflow interlock; this does not own the runner task slot.',
   'Validate entry':'Validate exactly one well-typed global row. Unknown control state stops.',
   'Already held':'Skip work if another execution holds the guard; never expire or reset it.',
   'Report existing hold':'Report diagnostic hold without clearing it.',
   'Prepare acquisition':'Capture execution ID and time for compare-and-set acquisition.',
   'Acquire control':'Acquire idle guard conditionally; requires production workflow concurrency=1.',
   'Check acquire receipt':'Verify typed acquisition response before external work.',
   'Read acquired control':'Read persisted singleton rather than trusting write acknowledgement alone.',
   'Verify acquisition':'Require exact guard ownership before calls or mutations.',
   'Require acknowledged completion':'Only acknowledged submission/collection or no-work can release workflow guard.',
   'Read before release':'Read singleton again to prevent releasing another execution.',
   'Verify release ownership':'Check execution, time and completed issue context before clearing busy.',
   'Release control':'Clear workflow busy only. Runner slot release requires separate stopped/publication proof.',
   'Check release receipt':'Require busy=false with unchanged diagnostic ownership.',
   'Read released control':'Read persistence to confirm guard release.',
   'Confirm idle':'Fail closed if persisted idle state differs from acknowledgement.',
   'Report completion':'Report bounded orchestration completion, never infer agent completion from guard release.'
  })[n.name];if(!n.notes)throw Error('Missing note '+n.name);}
  w.name=`Basic B ${kind} — US2 INACTIVE`;w.active=false;w.pinData={};
  let i=0;for(const n of w.nodes){n.position=[i%7*320,Math.floor(i/7)*250];i++;}
  for(const [i,title,summary] of [[0,'Acquire workflow guard','Shared fail-stop short interlock; no automatic expiry or error-release.'],[1,'Read durable task state','Authenticated runner reads and complete GitHub history; unknown target or evidence stops.'],[2,'Journal and apply effects','Intent before write; no blind POST replay. Exact marker/head/base and source readback.'],[3,'Confirm and release','Reserve only acknowledges submission; collect releases durable slot only with stopped/publication proof. Owner reviews and manually imports matching artifacts.']])add(`${i+1}. ${title}`,'stickyNote',{content:`## ${i+1}. ${title}\n\n${summary}`,height:230,width:450}).position=[-500,i*850];
  const path=`factory/workflows/${kind}.json`,output=JSON.stringify(w,null,2)+'\n';if(process.argv.includes('--check')){if(read(path)!==output)throw Error(kind+'.json stale');console.log(kind+'.json matches source');}else fs.writeFileSync(path,output);
 }
 return {w,code,connect,chain,cond,http,receipt,response,val,vals,context,finish,base:'https://api.github.com/repos/MBroholm/software-factory',runner:'http://RUNNER_PRIVATE_HOST:8787/v1'};
}
module.exports={builder};
