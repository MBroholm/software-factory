const assert=require('node:assert/strict'),fs=require('node:fs');
const {basicB}=require('./test-artifacts.cjs');
const config={FACTORY_TARGET:'test',FACTORY_TEST_INSTANCE:'factory-guard-test',N8N_BASE_URL:'http://127.0.0.1:5679',FACTORY_CONTROL_TABLE_ID:'test_table',FACTORY_OPERATIONAL_CONTROL_TABLE_ID:'prod_table',FACTORY_GITHUB_CREDENTIAL_ID:'test_github',FACTORY_GEMINI_CREDENTIAL_ID:'test_gemini',FACTORY_RUNNER_CREDENTIAL_ID:'test_runner',FACTORY_TEST_RUNNER_URL:'http://127.0.0.1:8788',FACTORY_TEST_GITHUB_URL:'http://127.0.0.1:8790',FACTORY_TEST_MODEL_URL:'http://127.0.0.1:8791',FACTORY_OPERATIONAL_CREDENTIAL_IDS:'prod_github,prod_runner'};
for(const name of ['refine','reserve','track','collect']){
 const source=JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`)),copy=JSON.stringify(source),mapped=basicB(source,config);
 assert.equal(mapped.active,false);assert.equal(JSON.stringify(source),copy);assert.deepEqual(mapped.connections,source.connections);
 assert(!JSON.stringify(mapped).includes('RUNNER_PRIVATE_HOST'));assert(!JSON.stringify(mapped).includes('https://api.github.com'));
 for(const [key,value] of Object.entries({FACTORY_TARGET:'operational',FACTORY_TEST_INSTANCE:'unknown',FACTORY_CONTROL_TABLE_ID:'prod_table',FACTORY_RUNNER_CREDENTIAL_ID:'prod_runner',FACTORY_TEST_RUNNER_URL:'https://example.com',FACTORY_TEST_GITHUB_URL:'http://localhost:5678'}))assert.throws(()=>basicB(source,{...config,[key]:value}),key);
 for(const key of Object.keys(config))assert.throws(()=>basicB(source,{...config,[key]:''}),key);
}
console.log('PASS four inactive Basic B copies; missing/unknown/operational destinations rejected before output. Offline declarations do not prove live isolation.');
