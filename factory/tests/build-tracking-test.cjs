// Offline test-copy packaging; T033 must pass before any native import/execution.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file='factory/tests/tracking-test.json';
const source=JSON.parse(fs.readFileSync('factory/workflows/track.json','utf8'));
const w=structuredClone(source);w.name='TEST ONLY — US3 tracking';w.active=false;
for(const n of w.nodes){
 if(n.type.endsWith('.dataTable'))n.parameters.dataTableId.value='IgWCIu94ieyHQRHS';
 if(n.type.endsWith('.httpRequest')){
  n.parameters.url=n.parameters.url.replaceAll('https://api.github.com','http://127.0.0.1:18767/github');
  n.parameters.authentication='none';delete n.parameters.genericAuthType;delete n.credentials;
  n.notes='TEST ONLY: credential-free synthetic loopback destination. '+n.notes;
 }
 if(n.type.endsWith('.scheduleTrigger')){n.disabled=true;n.notes='TEST ONLY: disabled until isolated scheduled test setup is verified. '+n.notes;}
}
assert(w.nodes.every(n=>!n.credentials));
assert(w.nodes.filter(n=>n.type.endsWith('.httpRequest')).every(n=>n.parameters.url.includes('http://127.0.0.1:18767/github')&&!n.parameters.url.includes('api.github.com')));
for(const n of source.nodes.filter(n=>n.type.endsWith('.code')))assert.equal(w.nodes.find(x=>x.name===n.name).parameters.jsCode,n.parameters.jsCode);
assert.deepEqual(w.connections,source.connections);
const output=JSON.stringify(w,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),output);else fs.writeFileSync(file,output);
console.log('Tracking isolated copy: unchanged Code/connections; fixed loopback, no credentials, disabled schedule. SHA-256 '+crypto.createHash('sha256').update(output).digest('hex'));
