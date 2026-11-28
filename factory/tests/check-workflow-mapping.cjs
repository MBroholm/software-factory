const assert=require('node:assert/strict'),fs=require('node:fs');
const {mapWorkflow}=require('../scripts/map-workflows.cjs');
const config={FACTORY_TARGET:'operational',FACTORY_RUNNER_CREDENTIAL_ID:'runner_test_1',FACTORY_RUNNER_URL:'http://192.168.16.1:8787',FACTORY_RUNNER_MODEL_CONFIG:'basic-b-test-sol',FACTORY_CONTROL_TABLE_ID:'table_test_1',FACTORY_GITHUB_CREDENTIAL_ID:'github_test_1',FACTORY_GEMINI_CREDENTIAL_ID:'gemini_test_1',FACTORY_GITHUB_CREDENTIAL_NAME:'Test GitHub',N8N_API_KEY:'NEVER_EMBED_THIS_SECRET'};
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
for(const name of ['refine','reserve','track','collect']){
 const source=JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`));
 test(name+' maps every reference without changing execution behavior',()=>{
  const changes=[]; const before=JSON.stringify(source),mapped=mapWorkflow(source,config,changes);
  assert(changes.some(change=>change.field==='parameters.url'));
  assert(changes.some(change=>change.field==='credentials.httpHeaderAuth'&&change.to.id==='runner_test_1'));
  assert(!JSON.stringify(changes).includes('NEVER_EMBED_THIS_SECRET'));
  assert.equal(JSON.stringify(source),before);assert.equal(mapped.active,false);
  assert.deepEqual(mapped.connections,source.connections);assert.deepEqual(mapped.settings,source.settings);
  for(let i=0;i<mapped.nodes.length;i++){
   const n=mapped.nodes[i],original=source.nodes[i],expected=structuredClone(original);
   if(n.type.endsWith('.dataTable'))expected.parameters.dataTableId={__rl:true,mode:'id',value:'table_test_1'};
   for(const c of Object.values(expected.credentials??{})){
    if(c.id.includes('GITHUB')){c.id='github_test_1';c.name='Test GitHub';}
    else if(c.id.includes('GEMINI'))c.id='gemini_test_1';
    else {assert.match(c.id,/RUNNER/);c.id='runner_test_1';expected.parameters.url=expected.parameters.url.replaceAll('http://RUNNER_PRIVATE_HOST:8787',config.FACTORY_RUNNER_URL);}
   }
   if(expected.parameters.jsCode)expected.parameters.jsCode=expected.parameters.jsCode.replaceAll('OWNER_CONFIGURE_MODEL_ID',config.FACTORY_RUNNER_MODEL_CONFIG);
   assert.deepEqual(n,expected);
  }
  assert(!JSON.stringify(mapped).includes('NEVER_EMBED_THIS_SECRET'));
  assert(!JSON.stringify(mapped).includes('OWNER_SELECT_'));
 });
 test(name+' rejects missing/unknown IDs',()=>{
  for(const value of ['', 'OWNER_SELECT_ME','FILL_THIS','={{ $env.KEY }}','invalid/id'])assert.throws(()=>mapWorkflow(source,{...config,FACTORY_CONTROL_TABLE_ID:value}));
  assert.throws(()=>mapWorkflow(source,{...config,FACTORY_GITHUB_CREDENTIAL_ID:''}));
  for(const options of [
   {FACTORY_TARGET:'test'}, {FACTORY_RUNNER_CREDENTIAL_ID:''}, {FACTORY_RUNNER_CREDENTIAL_ID:'github_test_1'},
   ...['https://192.168.16.1:8787','http://127.0.0.1:8787','http://8.8.8.8:8787','http://u:p@192.168.16.1:8787','http://192.168.16.1:8787/v1','http://192.168.16.1'].map(FACTORY_RUNNER_URL=>({FACTORY_RUNNER_URL})),
  ])assert.throws(()=>mapWorkflow(source,{...config,...options}));
  const broken=structuredClone(source);Object.values(broken.nodes.find(n=>n.credentials).credentials)[0].id='unexpected';assert.throws(()=>mapWorkflow(broken,config));
 });
}
test('Gemini required only by refinement',()=>{
 const cfg={...config,FACTORY_GEMINI_CREDENTIAL_ID:''};
 for(const name of ['reserve','track','collect'])mapWorkflow(JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`)),cfg);
 assert.throws(()=>mapWorkflow(JSON.parse(fs.readFileSync('factory/workflows/refine.json')),cfg));
});
test('reserve requires a valid explicit model configuration identifier',()=>{
 const source=JSON.parse(fs.readFileSync('factory/workflows/reserve.json'));
 for(const value of ['', 'OWNER_CONFIGURE_MODEL_ID', "bad'quote"])assert.throws(()=>mapWorkflow(source,{...config,FACTORY_RUNNER_MODEL_CONFIG:value}));
});
console.log(`${count} mapping groups passed.`);
