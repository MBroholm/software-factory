// Synthetic GitHub only. Run inside factory-guard-test; never proxies external requests.
const http=require('node:http'),fs=require('node:fs');
const [fixtureFile,stateFile]=process.argv.slice(2);if(!fixtureFile||!stateFile)throw Error('fixture and NEW state paths required');
const scenarios=JSON.parse(fs.readFileSync(fixtureFile));
let state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile)):{scenario:null,issues:[],comments:[],events:[],pulls:[],calls:[]};
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2));save();
const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;if(body.length>65536){res.writeHead(413);res.end();return;}
 const url=new URL(req.url,'http://127.0.0.1'),path=url.pathname;let result,status=200;
 try {
 if(path==='/inspect'&&req.method==='GET')result=state;
 else if(path==='/prepare'&&req.method==='POST'){
  const input=JSON.parse(body);if(!Object.hasOwn(scenarios,input.scenario))throw Error('Unknown synthetic scenario');
  state={...structuredClone(scenarios[input.scenario]),scenario:input.scenario};save();result=state;
 }
 else if(path==='/repair'&&req.method==='POST'&&Number(process.argv[4])===18768){
  const input=JSON.parse(body);if(typeof input.reason!=='string'||input.reason.length<20||input.expectedScenario!==state.scenario)throw Error('Explicit inspected fixture repair reason/scenario required');
  if(!['partial-label','unknown-post','unexpected-before'].includes(state.scenario))throw Error('No known repair for this fixture');
  const previous=state.scenario;
  if(previous!=='unexpected-before'){
   if(state.comments.filter(c=>c.body.startsWith('<!-- factory:result:v1')).length!==1)throw Error('Inspect exact single committed marker before repair');
   state.issues[0].labels=state.issues[0].labels.filter(l=>l.name!=='Building');if(!state.issues[0].labels.some(l=>l.name==='Your QA'))state.issues[0].labels.push({name:'Your QA'});
  }
  state.operatorRepair={previous,reason:input.reason,at:new Date().toISOString()};state.scenario='open-result';save();result=state;
 }
 else if(path.startsWith('/github/repos/MBroholm/software-factory/')){
  const route=path.slice('/github/repos/MBroholm/software-factory/'.length);state.calls.push({method:req.method,path});
  const [,kind,number,tail,label]=route.match(/^(issues|pulls)(?:\/(\d+))?(?:\/(comments|events|labels))?(?:\/(.*))?$/)??[];
  if(!kind)throw Error('Unknown fixture route');const issue=state.issues.find(i=>i.number===Number(number));const data=body?JSON.parse(body):null;
  if(req.method==='GET'){
   if(!number)result=kind==='issues'?state.issues:state.pulls;
   else if(kind==='pulls')result=state.pulls.find(p=>p.number===Number(number));
   else if(tail==='comments')result=state.comments;
   else if(tail==='events')result=state.events;
   else {result=issue;if(state.scenario==='unexpected-before'){status=500;result={error:'Injected unexpected pre-write HTTP failure'};}}
   if(Array.isArray(result)){const page=Number(url.searchParams.get('page')??1);result=result.slice((page-1)*100,page*100);}
  }else if(issue&&tail==='comments'&&req.method==='POST'){
   const time=new Date().toISOString();result={id:Math.max(100,...state.comments.map(c=>c.id))+1,user:{id:202449424},body:data.body,created_at:time,updated_at:time};state.comments.push(result);status=201;
   if(state.scenario==='unknown-post')result={error:'Injected lost successful POST receipt'};
  }else if(issue&&tail==='labels'&&req.method==='POST'){
   for(const name of data.labels)if(!issue.labels.some(l=>l.name===name))issue.labels.push({name});result=issue.labels;
   if(state.scenario==='partial-label'){status=500;result={error:'Injected lost label-add receipt'};}
  }else if(issue&&tail==='labels'&&label&&req.method==='DELETE'){issue.labels=issue.labels.filter(l=>l.name!==decodeURIComponent(label));result=issue.labels;}
  else throw Error('Unknown fixture write');
  if(result===undefined){status=404;result={error:'Fixture not found'};}save();
 }else{status=404;result={error:'Not a synthetic route'};}
 }catch(e){status=400;result={error:e.message};}
 res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
});const port=Number(process.argv[4]??18767);if(![18767,18768].includes(port))throw Error('Only designated US3/US4 fixture ports allowed');
server.listen(port,'127.0.0.1',()=>console.log('Synthetic fixture listening on container loopback '+port));
