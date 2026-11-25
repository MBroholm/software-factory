// Credential-free synthetic HTTP fixture. Run ONLY inside factory-guard-test; loopback only.
const http=require('node:http'),fs=require('node:fs'),crypto=require('node:crypto');
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const statePath=process.argv[3]||'/tmp/basic-a-us1-fixture-state.json';
const runs=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const copy=x=>JSON.parse(JSON.stringify(x));
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const save=()=>fs.writeFileSync(statePath,JSON.stringify(runs),{mode:0o600});
function fixture(name){
 if(!config.cases.includes(name))throw Error('Unknown fixture');
 const s={case:name,issues:[copy(config.issue)],comments:{101:[]},events:{},calls:[],modelBodies:[],countBodies:[],generation:0,count:0,posts:0};
 const i=s.issues[0];
 const prior=['ready-unchanged','non-owner-discussion','factory-marker','reuse','revision','captured-edit','captured-delete','edited-marker','later-candidate'];
 if(prior.includes(name)){
  s.issues=[copy(config.priorIssue)];s.comments[101]=[copy(config.human),copy(config.marked)];
  if(name==='reuse')s.issues[0].labels[0].name='Ideas';
  if(name==='revision')s.comments[101].push({...copy(config.human),id:30,body:'Add a usage example.'});
  if(name==='non-owner-discussion')s.comments[101].push({...copy(config.human),id:30,body:'Not the owner.',user:{id:99}});
  if(name==='factory-marker')s.comments[101].push({...copy(config.human),id:30,body:'<!-- factory:handoff:v1 fixture -->'});
  if(name==='captured-edit')s.comments[101][0].body='Edited source';
  if(name==='captured-delete')s.comments[101].shift();
  if(name==='edited-marker')s.comments[101][1].body+='edited';
  if(name==='later-candidate')s.issues.push({...copy(config.issue),number:102});
 }
 if(name==='non-owner')i.user.id=99;
 if(name==='pr')i.pull_request={url:'synthetic-only'};
 if(name==='closed')i.state='closed';
 if(name==='approved')i.labels[0].name='Approved';
 if(name==='stranded')i.labels[0].name='Refining';
 if(name==='conflicting')i.labels.push({name:'Approved'});
 if(name==='pagination'){
  s.issues=Array.from({length:100},(_,j)=>({...copy(config.issue),number:1000+j,user:{id:99}})).concat([i]);
  s.comments[101]=Array.from({length:100},(_,j)=>({...copy(config.human),id:100+j,user:{id:99}})).concat([{...copy(config.human),id:201}]);
 }
 for(const issue of s.issues){
  const state=issue.labels[0].name;
  const ev={id:1,event:'labeled',label:{name:state},created_at:prior.includes(name)&&name!=='reuse'?'2026-11-24T09:30:00Z':'2026-11-24T09:00:00Z'};
  s.events[issue.number]=name==='pagination'?Array.from({length:100},(_,j)=>({id:j+1,event:'commented',created_at:'2026-11-24T08:00:00Z'})).concat([{...ev,id:101}]):[ev];
 }
 return s;
}
function ownerComment(s,number,body){const id=Math.max(20,...Object.values(s.comments).flat().map(c=>c.id))+1;const now=new Date().toISOString();return{id,body,user:{id:config.owner},created_at:now,updated_at:now};}
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://fixture');
 if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({synthetic:true,sourceSHA256:config.sourceSHA256,runs:Object.keys(runs).length}));return;}
 if(url.pathname==='/inspect'&&req.method==='GET'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(runs));return;}
 const name=req.headers['x-us1-case'],id=req.headers['x-us1-run'],node=req.headers['x-us1-node'];
 if(!name||!/^\d+$/.test(id||'')||!node||!config.cases.includes(name))throw Error('Synthetic request identity required');
 const s=runs[id]??=fixture(name);if(s.case!==name)throw Error('Run changed case');
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Oversize fixture request');}
 const input=raw?JSON.parse(raw):null;
 s.calls.push({node,method:req.method,path:url.pathname,page:url.searchParams.get('page'),at:Date.now(),bodySHA256:input?digest(input):null});
 let status=200,body,headers={},disconnect=false;
 const number=Number(url.pathname.match(/\/issues\/(\d+)/)?.[1]);const issue=s.issues.find(i=>i.number===number);
 const page=Number(url.searchParams.get('page')||1);const paged=a=>a.slice((page-1)*100,page*100);
 if(url.pathname.endsWith(':countTokens')){
  s.count++;const {model,...counted}=input.generateContentRequest;s.countBodies.push(digest(counted));body={totalTokens:name==='count-invalid'?'1000':name==='over-budget'?4000:1000};
  if(name==='count-error'){status=429;body={error:{status:'RESOURCE_EXHAUSTED'}};}
 }else if(url.pathname.endsWith(':generateContent')){
  s.generation++;s.modelBodies.push(digest(input));body=copy(config.model);
  const maximum={'retry-once':1,'retry-twice':2,'exhaust':3,'retry-after-long':1,'retry-after-invalid':1,'source-in-backoff':1,'discussion-in-backoff':1,'state-in-backoff':1,'restart-backoff':3,'cancel-backoff':3}[name]??0;
  if(s.generation<=maximum){status=503;body={error:{status:'UNAVAILABLE'}};}
  if(name==='retry-after-long')headers['Retry-After']='60';
  if(name==='retry-after-invalid')headers['Retry-After']='invalid';
  if(name==='other-503'){status=503;body={error:{status:'OTHER'}};}
  if(['quota','auth','server-500'].includes(name)){status={quota:429,auth:401,'server-500':500}[name];body={error:{status:name==='quota'?'RESOURCE_EXHAUSTED':'OTHER'}};}
  if(name==='transport')disconnect=true;
  if(name==='invalid-output')body.candidates[0].content.parts[0].text='not json';
  if(name==='truncated')body.candidates[0].finishReason='MAX_TOKENS';
  if(name==='missing-usage')delete body.usageMetadata;
  if(['source-in-backoff','source-during-call'].includes(name))s.issues.find(i=>i.number===101).body+=' changed';
  if(name==='discussion-in-backoff')s.comments[101].push(ownerComment(s,101,'New instructions.'));
  if(name==='state-in-backoff')s.issues.find(i=>i.number===101).labels[0].name='Approved';
 }else if(url.pathname.endsWith('/events'))body=paged(s.events[number]??[]);
 else if(url.pathname.endsWith('/comments')&&req.method==='GET')body=paged(s.comments[number]??[]);
 else if(url.pathname.endsWith('/comments')&&req.method==='POST'){
  s.posts++;body=ownerComment(s,number,input.body);(s.comments[number]??=[]).push(body);status=201;
  if(name==='unknown-post')disconnect=true;
 }else if(url.pathname.endsWith('/labels')&&req.method==='POST'){
  for(const label of input.labels)if(!issue.labels.some(l=>l.name===label))issue.labels.push({name:label});
  body=issue.labels;s.events[number].push({id:Math.max(...s.events[number].map(e=>e.id))+1,event:'labeled',label:{name:input.labels[0]},created_at:new Date().toISOString()});
  if(name==='partial-label'&&input.labels.includes('Refining')){status=500;body={error:'Injected response failure after label addition'};}
 }else if(url.pathname.includes('/labels/')&&req.method==='DELETE'){
  issue.labels=issue.labels.filter(l=>l.name!==decodeURIComponent(url.pathname.split('/').at(-1)));body=issue.labels;
 }else if(/\/issues$/.test(url.pathname))body=paged(s.issues);
 else if(issue)body=issue;
 else{status=404;body={error:'Unknown fixture route'};}
 save();if(disconnect){req.socket.destroy();return;}
 res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(body));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
});
server.listen(Number(process.argv[4]??18765),'127.0.0.1',()=>console.log(JSON.stringify({ready:true,port:server.address().port,loopback:true,synthetic:true,sourceSHA256:config.sourceSHA256})));
