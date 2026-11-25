// TEST ONLY. Synthetic GitHub on container loopback; no external network, credentials or DB.
const http=require('node:http'),fs=require('node:fs');
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const statePath=process.argv[3]||'/tmp/basic-a-us2-fixture-state.json';
const runs=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
const clone=x=>JSON.parse(JSON.stringify(x));
const save=()=>fs.writeFileSync(statePath,JSON.stringify(runs),{mode:0o600});
function fixture(name){
 if(!config.cases.includes(name))throw Error('Unknown case');
 const f=clone(config.fixtures);const s={case:name,issues:f.map(f=>f.issue),comments:Object.fromEntries(f.map(f=>[f.issue.number,f.comments])),events:Object.fromEntries(f.map(f=>[f.issue.number,f.events])),calls:[],posts:0,waitingAt:null};
 if(['occupied','closed-building','nonowner-building','conflicting-building'].includes(name)){const i=s.issues[1];i.labels[0].name='Building';if(name==='closed-building')i.state='closed';if(name==='nonowner-building')i.user.id=99;if(name==='conflicting-building')i.labels.push({name:'Done'});}
 if(name==='non-owner')for(const i of s.issues)i.user.id=99;
 if(name==='no-approval')s.events[101]=[];
 if(name==='wrong-approval')s.events[101][0].actor.id=99;
 if(name==='captured-edit')s.comments[101][0].body='Edited approved source';
 return s;
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://fixture');
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({synthetic:true,sourceSHA256:config.sourceSHA256}));}
  if(url.pathname==='/inspect'&&req.method==='GET'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(runs));}
  const name=req.headers['x-us2-case'],id=req.headers['x-us2-run'],node=req.headers['x-us2-node'];
  if(!config.cases.includes(name)||!/^\d+$/.test(id||'')||!node)throw Error('Explicit synthetic identity required');
  const s=runs[id]??=fixture(name);if(s.case!==name)throw Error('Run changed case');
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Fixture body too large');}
  const body=raw?JSON.parse(raw):null;
  s.calls.push({node,method:req.method,path:url.pathname,page:url.searchParams.get('page'),at:Date.now()});
  const number=Number(url.pathname.match(/\/issues\/(\d+)/)?.[1]),issue=s.issues.find(i=>i.number===number);
  const page=Number(url.searchParams.get('page')||1),paged=a=>a.slice((page-1)*100,page*100);
  let status=200,result,disconnect=false,wait=false;
  if(url.pathname.endsWith('/events'))result=paged(s.events[number]??[]);
  else if(url.pathname.endsWith('/comments')&&req.method==='GET')result=paged(s.comments[number]??[]);
  else if(url.pathname.endsWith('/comments')&&req.method==='POST'){
   s.posts++;const now=new Date().toISOString();result={id:100+s.posts,body:body.body,user:{id:config.owner},created_at:now,updated_at:now};s.comments[number].push(result);status=201;disconnect=name==='unknown-post';
  }else if(url.pathname.endsWith('/labels')&&req.method==='POST'){
   if(JSON.stringify(body)!==JSON.stringify({labels:['Building']}))throw Error('Only synthetic Building addition expected');
   if(!issue.labels.some(l=>l.name==='Building'))issue.labels.push({name:'Building'});
   result=issue.labels;s.events[number].push({id:31,event:'labeled',label:{name:'Building'},actor:{id:config.owner},created_at:new Date().toISOString()});
   if(name==='partial-label'){status=500;result={error:'Injected uncertain label result after synthetic side effect'};}
   if(name==='restart-reservation'){s.waitingAt='Add Building';wait=true;}
  }else if(url.pathname.endsWith('/labels/Approved')&&req.method==='DELETE'){
   issue.labels=issue.labels.filter(l=>l.name!=='Approved');result=issue.labels;s.events[number].push({id:32,event:'unlabeled',label:{name:'Approved'},actor:{id:config.owner},created_at:new Date().toISOString()});
  }else if(url.pathname.endsWith('/issues'))result=paged(s.issues);
  else if(url.pathname.endsWith('/pulls'))result=[];
  else if(issue&&req.method==='GET')result=issue;
  else {status=404;result={error:'Unknown synthetic route'};}
  save();if(disconnect)return req.socket.destroy();
  // Gives the operator time to restart the isolated container in flight. The persisted
  // fixture effect and native busy row survive; there is no auto-retry or fixture repair.
  if(wait)await new Promise(resolve=>setTimeout(resolve,25000));
  res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
});
server.listen(Number(process.argv[4]??18766),'127.0.0.1',()=>console.log(JSON.stringify({ready:true,loopback:true,port:server.address().port,sourceSHA256:config.sourceSHA256})));
