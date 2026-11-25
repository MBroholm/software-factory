// Test fixture packaging and the HTTP simulator itself, not the native workflow.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..');const directory=fs.mkdtempSync(path.join(os.tmpdir(),'us1-fixture-check-'));
const config=JSON.parse(fs.readFileSync(path.join(root,'factory/local/refinement-native-bridge/fixtures.json')));
const graph=JSON.parse(fs.readFileSync(path.join(root,'factory/local/refinement-native-bridge/workflow.json')));
const names=new Set(graph.nodes.map(n=>n.name));assert.equal(names.size,graph.nodes.length);assert.equal(graph.active,false);
for(const n of graph.nodes){if(!n.type.endsWith('.stickyNote'))assert(n.notes?.trim(),n.name+' lacks notes');assert(!n.credentials&&!n.retryOnFail&&!n.continueOnFail);assert(!n.type.endsWith('.scheduleTrigger'));if(n.type.endsWith('.httpRequest'))assert(n.parameters.url.includes('http://127.0.0.1:18765/')&&!n.parameters.url.includes('https://'));}
for(const branches of Object.values(graph.connections))for(const targets of branches.main)for(const target of targets??[])assert(names.has(target.node),target.node);

const child=spawn(process.execPath,[path.join(__dirname,'refinement-fixture-server.cjs'),path.join(root,'factory/local/refinement-native-bridge/fixtures.json'),path.join(directory,'state.json'),'0'],{stdio:['ignore','pipe','pipe']});
let stderr='';child.stderr.on('data',b=>stderr+=b);
(async()=>{
 const ready=await new Promise((resolve,reject)=>{child.once('exit',code=>reject(Error(`Fixture exited ${code}: ${stderr}`)));child.stdout.once('data',b=>resolve(JSON.parse(String(b))));child.once('error',reject);});
 assert(ready.loopback&&ready.synthetic);const base=`http://127.0.0.1:${ready.port}`;
 async function call(name,id,node,route,body){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{'X-US1-Case':name,'X-US1-Run':String(id),'X-US1-Node':node,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),headers:r.headers};}
 let id=0;
 for(const name of config.cases){
  id++;const r=await call(name,id,'Discover issues','/github/repos/MBroholm/software-factory/issues?page=1');assert.equal(r.status,200);assert(Array.isArray(r.body));
 }
 const payload={contents:[{role:'user',parts:[{text:'synthetic task'}]}]};
 for(const [name,expected] of [['retry-once',[503,200]],['retry-twice',[503,503,200]],['exhaust',[503,503,503]]]){
  id++;for(const status of expected){const r=await call(name,id,'Gemini generateContent','/gemini/v1beta/models/test:generateContent',payload);assert.equal(r.status,status);}
 }
 id++;const c=await call('success',id,'Gemini countTokens','/gemini/v1beta/models/test:countTokens',{generateContentRequest:{model:'models/test',...payload}});assert.equal(c.body.totalTokens,1000);
 await call('success',id,'Gemini generateContent','/gemini/v1beta/models/test:generateContent',payload);
 const s=await (await fetch(base+'/inspect')).json();assert.equal(s[id].countBodies[0],s[id].modelBodies[0]);
 id++;const p1=await call('pagination',id,'Discover issues','/github/repos/MBroholm/software-factory/issues?page=1');const p2=await call('pagination',id,'Discover issues','/github/repos/MBroholm/software-factory/issues?page=2');assert.equal(p1.body.length,100);assert.equal(p2.body.length,1);
 id++;await assert.rejects(call('transport',id,'Gemini generateContent','/gemini/v1beta/models/test:generateContent',payload));
 console.log(`PASS ${config.cases.length} fixture initializations, retry response sequences, payload identity, pagination and actual dropped connection. Fixture checks only; native workflow not run.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{child.kill();fs.rmSync(directory,{recursive:true,force:true});});
