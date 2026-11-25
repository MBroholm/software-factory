// Read synthetic fixtures on stdin; evaluate parameters only, never execute nodes/workflows.
// Run with the installed n8n packages, e.g. in the isolated test container. No credentials,
// HTTP/model calls, n8n imports, database access or guard resets are performed.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const packageRoot = process.argv[2] || '/usr/local/lib/node_modules/n8n';
const {Workflow,Expression} = require(`${packageRoot}/node_modules/n8n-workflow`);
const {NodeExecutionContext} = require(`${packageRoot}/node_modules/n8n-core/dist/execution-engine/node-execution-context/node-execution-context.js`);
const {HttpRequestV3} = require(`${packageRoot}/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/V3/HttpRequestV3.node.js`);
const fixtureSet = JSON.parse(fs.readFileSync(0,'utf8'));
const httpType = new HttpRequestV3({name:'httpRequest',displayName:'HTTP Request',group:['transform'],version:4.2,defaults:{name:'HTTP Request'},inputs:['main'],outputs:['main']});
const nodeTypes = {getByNameAndVersion:type=>type.endsWith('.httpRequest') ? httpType : {
  description:{name:type.split('.').at(-1),properties:[],inputs:['main'],outputs:['main','main']},
}};
const workflow = new Workflow({...structuredClone(fixtureSet.graph),id:'offline-expression-check',active:false,nodeTypes});
// Retain exact source parameters; stub descriptions for other node types must not add defaults.
for(const node of fixtureSet.graph.nodes) workflow.getNode(node.name).parameters = structuredClone(node.parameters);
const normalize = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const context = fixture => ({workflow,node:workflow.getNode(fixture.node),nodeType:nodeTypes.getByNameAndVersion(workflow.getNode(fixture.node).type),
  mode:'manual',runIndex:fixture.runIndex??0,runExecutionData:{resultData:{runData:fixture.runData}},
  connectionInputData:fixture.input,additionalKeys:{$execution:{id:'test'}},executeData:{source:{main:fixture.source?[fixture.source]:[]}},
});
async function main() {
  // Importing n8n-workflow alone silently uses legacy evaluation. The service defaults to VM.
  await Expression.initExpressionEngine({engine:'vm',poolSize:1,maxCodeCacheSize:256,bridgeTimeout:5000,bridgeMemoryLimit:128,sharedCaller:true});
  let checks=0;
  try {
    for(const fixture of fixtureSet.fixtures) {
      const value=NodeExecutionContext.prototype._getNodeParameter.call(context(fixture),fixture.path,0);
      assert.deepEqual(normalize(value),fixture.expected,`${fixture.label}: ${fixture.node}.${fixture.path}`);
      checks++;
    }
    const candidate=fixtureSet.fixtures.find(f=>f.label==='initial-refinement' && f.node==='Read source comments' && f.path==='url');
    assert(candidate,'Missing loop URL regression fixture');
    const node=workflow.getNode(candidate.node), saved=node.parameters.url;
    node.parameters.url="={{ ('https://api.github.com/repos/MBroholm/software-factory/issues/' + $('Each candidate').first(1, -1).json.number) + '/comments' }}";
    assert.equal(NodeExecutionContext.prototype._getNodeParameter.call(context(candidate),'url',0),undefined,'Original explicit -1 regression must reproduce in installed VM');
    node.parameters.url=saved;
    assert.equal(NodeExecutionContext.prototype._getNodeParameter.call(context(candidate),'url',0),'https://api.github.com/repos/MBroholm/software-factory/issues/1/comments');
    checks+=2;
    for(const node of fixtureSet.graph.nodes.filter(n=>n.parameters.options?.pagination)) {
      const p=node.parameters.options.pagination.pagination;
      for(const pageCount of [0,1]) {
        const value=workflow.expression.getParameterValue(p.parameters.parameters[0].value,null,0,0,node.name,[{json:{}}],'manual',{$pageCount:pageCount});
        assert.equal(value,pageCount+1,`${node.name}: page number`);checks++;
      }
      for(const [body,statusCode,expected] of [[[],200,true],[Array(100).fill({}),200,false],[{},200,true],[[],429,true]]) {
        const value=workflow.expression.getParameterValue(p.completeExpression,null,0,0,node.name,[{json:{}}],'manual',{$response:{body,statusCode}});
        assert.equal(value,expected,`${node.name}: pagination completion`);checks++;
      }
    }
    console.log(`PASS ${checks} native VM expression checks (${fixtureSet.fixtures.length} parameter contexts, explicit -1 regression and pagination).`);
    console.log('Parameter resolution only; full workflow, credentials, GitHub writes and Gemini use remain separately gated.');
  } finally { await Expression.disposeExpressionEngine(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
