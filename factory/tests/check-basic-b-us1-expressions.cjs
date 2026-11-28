// Read-only native VM evaluation of synthetic US1 parameters. No workflow imports or HTTP.
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=process.argv[2]||'/usr/local/lib/node_modules/n8n';
const {Workflow,Expression}=require(root+'/node_modules/n8n-workflow');
const {NodeExecutionContext}=require(root+'/node_modules/n8n-core/dist/execution-engine/node-execution-context/node-execution-context.js');
const {HttpRequestV3}=require(root+'/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/V3/HttpRequestV3.node.js');
const set=JSON.parse(fs.readFileSync(0,'utf8'));
const http=new HttpRequestV3({name:'httpRequest',displayName:'HTTP Request',group:['transform'],version:4.2,defaults:{name:'HTTP Request'},inputs:['main'],outputs:['main']});
const nodeTypes={getByNameAndVersion:type=>type.endsWith('.httpRequest')?http:{description:{name:type.split('.').at(-1),properties:[],inputs:['main'],outputs:['main','main']}}};
async function main(){
 await Expression.initExpressionEngine({engine:'vm',poolSize:1,maxCodeCacheSize:256,bridgeTimeout:5000,bridgeMemoryLimit:128,sharedCaller:true});
 let checks=0;
 try{
  const workflow=new Workflow({...structuredClone(set.graph),id:'offline-basic-b-us1',active:false,nodeTypes});
  for(const n of set.graph.nodes)workflow.getNode(n.name).parameters=structuredClone(n.parameters);
  for(const f of set.fixtures){
   const node=workflow.getNode(f.node),context={workflow,node,nodeType:nodeTypes.getByNameAndVersion(node.type),mode:'manual',runIndex:f.runIndex,runExecutionData:{resultData:{runData:f.runData}},connectionInputData:f.input,additionalKeys:{$execution:{id:f.execution_id}},executeData:{source:{main:f.source?[f.source]:[]}}};
   let value;try{value=NodeExecutionContext.prototype._getNodeParameter.call(context,f.path,0);}catch(e){throw Error(f.node+'.'+f.path+': '+e.message);}
   assert.deepEqual(JSON.parse(JSON.stringify(value)),f.expected,f.node+'.'+f.path);checks++;
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
