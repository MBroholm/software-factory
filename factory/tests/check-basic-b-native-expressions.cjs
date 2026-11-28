// Read-only native VM evaluation of synthetic US1–US4 parameters. No workflow imports or HTTP.
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=process.argv[2]||'/usr/local/lib/node_modules/n8n';
assert.equal(require(root+'/package.json').version,'2.48.8','Native n8n baseline mismatch');
const {Workflow,Expression,MAX_IN_PROCESS_WAIT_MS}=require(root+'/node_modules/n8n-workflow');
const {NodeExecutionContext}=require(root+'/node_modules/n8n-core/dist/execution-engine/node-execution-context/node-execution-context.js');
const {HttpRequestV3}=require(root+'/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/V3/HttpRequestV3.node.js');
const {Wait}=require(root+'/node_modules/n8n-nodes-base/dist/nodes/Wait/Wait.node.js');
const wait=new Wait();
const set=JSON.parse(fs.readFileSync(0,'utf8'));
const http=new HttpRequestV3({name:'httpRequest',displayName:'HTTP Request',group:['transform'],version:4.2,defaults:{name:'HTTP Request'},inputs:['main'],outputs:['main']});
const nodeTypes={getByNameAndVersion:type=>type.endsWith('.httpRequest')?http:type.endsWith('.wait')?wait:{description:{name:type.split('.').at(-1),properties:[],inputs:['main'],outputs:['main','main']}}};
async function main(){
 await Expression.initExpressionEngine({engine:'vm',poolSize:1,maxCodeCacheSize:256,bridgeTimeout:5000,bridgeMemoryLimit:128,sharedCaller:true});
 let checks=0;
 try{
  for(const n of set.graph.nodes){assert(n.type.endsWith('.stickyNote')?n.parameters.content?.trim():n.notes?.trim(),'Missing notes '+n.name);if(n.type.endsWith('.wait')){assert.equal(n.parameters.options?.acceptsResumeRequest??false,false);assert.equal(n.parameters.unit,'seconds');assert(MAX_IN_PROCESS_WAIT_MS>30000,'Durable wait threshold');}}
  assert(set.graph.nodes.some(n=>n.type.endsWith('.stickyNote')&&/^[0-9]+\./.test(n.name)),'Numbered stages required');
  const workflow=new Workflow({...structuredClone(set.graph),id:'offline-basic-b-us1',active:false,nodeTypes});
  for(const n of set.graph.nodes)workflow.getNode(n.name).parameters=structuredClone(n.parameters);
  for(const f of set.fixtures){
   const node=workflow.getNode(f.node),context={workflow,node,nodeType:nodeTypes.getByNameAndVersion(node.type),mode:'manual',runIndex:f.runIndex,runExecutionData:{resultData:{runData:f.runData}},connectionInputData:f.input,additionalKeys:{$execution:{id:f.execution_id}},executeData:{source:{main:f.source?[f.source]:[]}}};
   let value;try{value=NodeExecutionContext.prototype._getNodeParameter.call(context,f.path,0);}catch(e){throw Error(f.node+'.'+f.path+': '+e.message);}
   assert.deepEqual(JSON.parse(JSON.stringify(value)),f.expected,f.node+'.'+f.path);checks++;
   if(node.type.endsWith('.wait')&&f.path==='amount'){
    assert(Number.isFinite(value)&&value>0&&value*1000<MAX_IN_PROCESS_WAIT_MS,'Unsafe resolved Wait');
    let requested=false;await wait.execute({getNodeParameter:(name)=>NodeExecutionContext.prototype._getNodeParameter.call(context,name,0),getInputData:()=>f.input,putExecutionToWait:async(until,options)=>{assert.equal(options.acceptsResumeRequest,false);assert(Math.abs(until.getTime()-Date.now()-value*1000)<1000);requested=true;}});assert(requested);checks++;
   }
  }
  for(const node of set.graph.nodes.filter(n=>n.type.endsWith('.wait')))for(const seconds of [10,30]){
   const input=[{json:{retry_delay_seconds:seconds}}];let requested=false;
   await wait.execute({getInputData:()=>input,getNodeParameter:(name)=>workflow.expression.getParameterValue(node.parameters[name],null,0,0,node.name,input,'manual'),putExecutionToWait:async(until,options)=>{assert.equal(options.acceptsResumeRequest,false);const delta=until.getTime()-Date.now();assert(Math.abs(delta-seconds*1000)<1000);assert(delta<MAX_IN_PROCESS_WAIT_MS);requested=true;}});assert(requested);checks++;
  }
  for(const n of set.graph.nodes.filter(n=>n.parameters.options?.pagination)){
   const p=n.parameters.options.pagination.pagination;
   for(const page of [0,1]){assert.equal(workflow.expression.getParameterValue(p.parameters.parameters[0].value,null,0,0,n.name,[{json:{}}],'manual',{$pageCount:page}),page+1);checks++;}
   for(const [body,statusCode,expected]of [[[],200,true],[Array(100).fill({}),200,false],[{},200,true],[[],429,true]]){assert.equal(workflow.expression.getParameterValue(p.completeExpression,null,0,0,n.name,[{json:{}}],'manual',{$response:{body,statusCode}}),expected);checks++;}
  }
  console.log(`PASS ${set.graph.name}: ${checks} native VM expression/pagination checks. Synthetic inputs only.`);
 }finally{await Expression.disposeExpressionEngine();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
