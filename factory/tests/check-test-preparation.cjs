// Regression: reproducible offline packaging without any historical operator material.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'factory-preparation-'));
try {
 fs.cpSync(path.join(root,'factory'),path.join(temp,'factory'),{recursive:true,filter:file=>{
  const relative=path.relative(path.join(root,'factory'),file);
  return !relative.split(path.sep).some(part=>part==='local'||part==='__pycache__'||part==='.env'||part.startsWith('.env.')&&part!=='.env.example');
 }});
 function run(file,args=[],ok=true){
  const result=spawnSync(process.execPath,['factory/tests/'+file,...args],{cwd:temp,encoding:'utf8'});
  const output=result.stdout+result.stderr;
  if(ok)assert.equal(result.status,0,output);else assert.notEqual(result.status,0,output);
  return output;
 }
 assert(!fs.existsSync(path.join(temp,'factory/local')));
 assert.match(run('check-refinement-bridge.cjs',[],false),/prepare-test-artifacts.cjs/);
 assert.match(run('build-reservation-bridge.cjs',['--mapped'],false),/Copy factory\/config\/test.env.example/);
 const snapshots=()=>Object.fromEntries(fs.readdirSync(path.join(temp,'factory/tests')).filter(f=>f.endsWith('.json')).map(f=>[f,fs.readFileSync(path.join(temp,'factory/tests',f),'utf8')]));
 run('prepare-test-artifacts.cjs');
 const publicFiles=snapshots();
 run('prepare-test-artifacts.cjs',['--check']);
 assert.deepEqual(snapshots(),publicFiles);
 // Corrupt historical exports deliberately: builders must never consult them.
 fs.writeFileSync(path.join(temp,'factory/local/refine-us1-retry-mapped.json'),'invalid historical export');
 fs.writeFileSync(path.join(temp,'factory/local/us2/import-readback.json'),'invalid historical export');
 const config=path.join(temp,'test-config.env');
 fs.writeFileSync(config,'FACTORY_TARGET=test\nFACTORY_CONTROL_TABLE_ID=synthetic_table_123\n');
 for(const builder of ['build-refinement-bridge.cjs','build-reservation-bridge.cjs','build-refinement-schedule.cjs','build-reservation-schedule.cjs','build-tracking-test.cjs']){
  run(builder,['--env',config]);run(builder,['--env',config,'--check']);
 }
 assert.deepEqual(snapshots(),publicFiles,'Machine-specific mapping changed public review artifacts');
 for(const file of ['refinement-native-bridge/workflow.json','refinement-native-bridge/schedule-mapped.json','us2/native-bridge/workflow.json','us2/native-bridge/schedule-mapped.json','us3/tracking-test-mapped.json']){
  const graph=JSON.parse(fs.readFileSync(path.join(temp,'factory/local',file)));
  assert.equal(graph.active,false);
  for(const n of graph.nodes){
   assert(!n.credentials);
   if(n.type.endsWith('.dataTable'))assert.equal(n.parameters.dataTableId.value,'synthetic_table_123');
   if(n.type.endsWith('.httpRequest'))assert(n.parameters.url.includes('http://127.0.0.1:')&&!n.parameters.url.includes('https://'));
  }
 }
 fs.writeFileSync(config,'FACTORY_TARGET=operational\nFACTORY_CONTROL_TABLE_ID=synthetic_table_123\n');
 assert.match(run('prepare-test-artifacts.cjs',['--env',config],false),/FACTORY_TARGET=test/);
 fs.writeFileSync(config,'FACTORY_TARGET=test\nFACTORY_CONTROL_TABLE_ID=OWNER_SELECT_TABLE\n');
 assert.match(run('build-tracking-test.cjs',['--env',config],false),/placeholders are not accepted/);
 assert.match(run('build-refinement-bridge.cjs',['--env'],false),/requires a test configuration path/);
 const seed=path.join(temp,'factory/local/reservation-native-expression-fixtures.json');fs.unlinkSync(seed);
 assert.match(run('build-reservation-bridge.cjs',['--native-fixtures'],false),/check-reservation.cjs --native-fixtures/);
 console.log('PASS clean-checkout preparation/check; historical exports ignored; explicit mappings preserve public artifacts and fixture isolation; missing/invalid prerequisites rejected. No native/remote operations.');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
