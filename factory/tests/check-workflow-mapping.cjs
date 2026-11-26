const assert=require('node:assert/strict'),fs=require('node:fs');
const {mapWorkflow}=require('../scripts/map-workflows.cjs');
const config={FACTORY_CONTROL_TABLE_ID:'table_test_1',FACTORY_GITHUB_CREDENTIAL_ID:'github_test_1',FACTORY_GEMINI_CREDENTIAL_ID:'gemini_test_1',FACTORY_GITHUB_CREDENTIAL_NAME:'Test GitHub',N8N_API_KEY:'NEVER_EMBED_THIS_SECRET'};
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
for(const name of ['refine','reserve','track']){
 const source=JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`));
 test(name+' maps every reference without changing execution behavior',()=>{
  const before=JSON.stringify(source),mapped=mapWorkflow(source,config);
  assert.equal(JSON.stringify(source),before);assert.equal(mapped.active,false);
  assert.deepEqual(mapped.connections,source.connections);assert.deepEqual(mapped.settings,source.settings);
  for(let i=0;i<mapped.nodes.length;i++){
   const n=mapped.nodes[i],original=source.nodes[i],expected=structuredClone(original);
   if(n.type.endsWith('.dataTable'))expected.parameters.dataTableId={__rl:true,mode:'id',value:'table_test_1'};
   for(const c of Object.values(expected.credentials??{})){const github=c.id.includes('GITHUB');c.id=github?'github_test_1':'gemini_test_1';if(github)c.name='Test GitHub';}
   assert.deepEqual(n,expected);
  }
  assert(!JSON.stringify(mapped).includes('NEVER_EMBED_THIS_SECRET'));
  assert(!JSON.stringify(mapped).includes('OWNER_SELECT_'));
 });
 test(name+' rejects missing/unknown IDs',()=>{
  for(const value of ['', 'OWNER_SELECT_ME','FILL_THIS','={{ $env.KEY }}','invalid/id'])assert.throws(()=>mapWorkflow(source,{...config,FACTORY_CONTROL_TABLE_ID:value}));
  assert.throws(()=>mapWorkflow(source,{...config,FACTORY_GITHUB_CREDENTIAL_ID:''}));
  const broken=structuredClone(source);Object.values(broken.nodes.find(n=>n.credentials).credentials)[0].id='unexpected';assert.throws(()=>mapWorkflow(broken,config));
 });
}
test('Gemini required only by refinement',()=>{
 const cfg={...config,FACTORY_GEMINI_CREDENTIAL_ID:''};
 for(const name of ['reserve','track'])mapWorkflow(JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`)),cfg);
 assert.throws(()=>mapWorkflow(JSON.parse(fs.readFileSync('factory/workflows/refine.json')),cfg));
});
console.log(`${count} mapping groups passed.`);
