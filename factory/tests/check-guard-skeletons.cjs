// Local JSON graph/code checks only. Native n8n/Data Table behavior remains T008.
// Run from repository root: node factory/tests/check-guard-skeletons.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const idle = () => ({id:1,key:'global',busy:false,execution_id:'',issue_number:null,started_at:''});
let checks = 0;
// Refine/reserve are now stories; their exported graphs have dedicated checkers.
for (const workflow of ['track']) {
  const graph = JSON.parse(fs.readFileSync(`factory/workflows/${workflow}.json`, 'utf8'));
  const nodes = new Map(graph.nodes.map(n => [n.name,n]));
  assert.equal(graph.active,false);
  assert.equal(nodes.size,graph.nodes.length);
  assert.deepEqual(graph.pinData,{});
  for (const n of nodes.values()) {
    assert(!n.continueOnFail && !n.retryOnFail && !n.disabled);
    assert(!n.onError || n.onError === 'stopWorkflow');
    assert(!n.credentials);
    assert(['code','dataTable','if','stickyNote','manualTrigger','scheduleTrigger'].some(t => n.type === `n8n-nodes-base.${t}`));
    for (const outputs of Object.values(graph.connections[n.name] || {}))
      for (const output of outputs) for (const edge of output) assert(nodes.has(edge.node));
    if (n.type.endsWith('.dataTable')) {
      assert.equal(n.alwaysOutputData,true);
      assert.equal(n.typeVersion,1.1);
      assert.equal(n.parameters.dataTableId.mode,'id');
      assert.equal(n.parameters.dataTableId.value,'OWNER_SELECT_ISOLATED_CONTROL_TABLE');
      assert(['get','update'].includes(n.parameters.operation));
      if(n.parameters.operation === 'get') {
        assert.equal(n.parameters.limit,2);
        assert.deepEqual(n.parameters.filters.conditions,[]);
      } else assert.equal(n.parameters.matchType,'allConditions');
    }
  }
  // Execute exported connections and actual Code node bodies with a minimal in-memory
  // Data Table stand-in. This intentionally does NOT emulate the n8n runtime.
  function run(rows, fault, start='Manual isolated test') {
    const outputs = new Map();
    const trace = [];
    let effects = 0;
    let name = start, input = [{json:{}}], error = null;
    const evaluate = (value, json) => typeof value === 'string' && value.startsWith('={{ ')
      ? vm.runInNewContext(value.slice(3,-2).trim(), {$json:json}) : value;
    try {
      for(let step=0; name; step++) {
        assert(step < 40,'unexpected cycle');
        trace.push(name);
        const n = nodes.get(name);
        let result = input, branch = 0;
        if(fault?.node === name && fault.kind === 'throw') throw Error('injected node failure');
        if(n.type.endsWith('.code')) {
          let source = n.parameters.jsCode;
          if(fault?.node === name && fault.kind === 'code') source = fault.source;
          if(fault?.node === name && fault.kind === 'afterEffect') {effects++; throw Error('unexpected after effect');}
          const items = input;
          result = vm.runInNewContext(`(function(){${source}\n})()`, {
            $input:{all:()=>items,first:()=>items[0]},$execution:{id:'test-execution'},
            $:ref=>({first:()=>outputs.get(ref)[0]}),
          },{timeout:1000});
        } else if(n.type.endsWith('.if')) {
          branch = input[0].json.busy === true ? 0 : 1;
        } else if(n.type.endsWith('.dataTable')) {
          const p = n.parameters;
          let selected;
          if(p.operation === 'get') selected = rows.slice(0,p.limit);
          else {
            const json = input[0].json;
            selected = rows.filter(row=>p.filters.conditions.every(c=>
              c.condition === 'isTrue' ? row[c.keyName] === true :
              c.condition === 'isFalse' ? row[c.keyName] === false :
              String(row[c.keyName]) === String(evaluate(c.keyValue,json))));
            for(const row of selected) for(const [key,value] of Object.entries(p.columns.value)) row[key] = evaluate(value,json);
          }
          result = selected.length ? selected.map(row=>({json:{...row}})) : [{json:{}}];
        }
        outputs.set(name,result);
        const next = graph.connections[name]?.main?.[branch] || [];
        assert(next.length <= 1,'unexpected fanout');
        name = next[0]?.node; input = result;
      }
    } catch(e) {error=e;}
    return {rows,trace,effects,error,output:input};
  }
  function heldAfterFailure(fault) {
    const r = run([idle()],fault);
    assert(r.error);
    assert.equal(r.rows[0].busy,true);
    assert.equal(r.rows[0].execution_id,'test-execution');
    assert(!r.trace.includes('Release control'));
    const snapshot=JSON.stringify(r.rows);
    const later = run(r.rows);
    assert.equal(later.error,null);
    assert(later.trace.includes('Report existing hold'));
    assert.equal(JSON.stringify(later.rows),snapshot);
    checks++;
    return r;
  }
  for(const start of ['Manual isolated test','Poll inactive']) {
    const r=run([idle()],null,start);
    assert.equal(r.error,null);
    assert.equal(r.rows[0].busy,false);
    assert(r.trace.includes('Confirm idle'));
    assert.equal(r.output[0].json.outcome,'no_work'); checks++;
  }
  const success=run([idle()],{node:'Skeleton work boundary',kind:'code',source:"return [{json:{outcome:'success',acknowledged:true}}];"});
  assert.equal(success.error,null);assert.equal(success.rows[0].busy,false);checks++;
  for(const issue_number of [101,null]) {
    const rows=[{...idle(),busy:true,execution_id:'prior',started_at:'2026-11-24T10:00:00.000Z',issue_number}];
    const before=JSON.stringify(rows),r=run(rows);
    assert.equal(r.error,null);assert.equal(JSON.stringify(rows),before);
    assert(!r.trace.includes('Acquire control'));checks++;
  }
  for(const rows of [[],[idle(),idle()],[{...idle(),key:'wrong'}],[{...idle(),busy:null}],[{...idle(),issue_number:0}],[{...idle(),execution_id:null}]]) {
    const r=run(rows);assert(r.error);assert(!r.trace.includes('Acquire control'));checks++;
  }
  const acquisition=run([idle()],{node:'Acquire control',kind:'throw'});
  assert(acquisition.error);assert.equal(acquisition.rows[0].busy,false);
  assert(!acquisition.trace.includes('Skeleton work boundary'));checks++;
  for(const node of ['Check acquire receipt','Verify acquisition','Require acknowledged completion','Verify release ownership']) {
    heldAfterFailure({node,kind:'code',source:'return (()=>{throw new Error("unexpected")})();'});
  }
  heldAfterFailure({node:'Skeleton work boundary',kind:'throw'});
  assert.equal(heldAfterFailure({node:'Skeleton work boundary',kind:'afterEffect'}).effects,1);
  for(const node of ['Check acquire receipt','Verify acquisition']) {
    const r=heldAfterFailure({node,kind:'code',source:nodes.get(node).parameters.jsCode.replace('const rows = $input.all().map(item => item.json);','const rows = [{}];')});
    assert(!r.trace.includes('Skeleton work boundary'));
  }
  heldAfterFailure({node:'Skeleton work boundary',kind:'code',source:"return [{json:{outcome:'success',acknowledged:false}}];"});
  const release=run([idle()],{node:'Release control',kind:'throw'});
  assert(release.error);assert.equal(release.rows[0].busy,true);assert(!release.trace.includes('Report completion'));checks++;
  for(const node of ['Check release receipt','Read released control','Confirm idle']) {
    const r=run([idle()],{node,kind:'throw'});
    assert(r.error);assert.equal(r.rows[0].busy,false);assert(!r.trace.includes('Report completion'));checks++;
  }
  console.log(`${workflow}: graph/code checks passed (native engine tests UNRUN)`);
}
console.log(`${checks} local scenarios passed; not a substitute for T008/T026.`);
