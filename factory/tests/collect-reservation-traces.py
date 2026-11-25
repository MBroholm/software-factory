"""Read sanitized native execution traces using n8n's supported encrypted entity export.
Runs on Ubuntu. No direct SQL or instance encryption-key/credential access.
Only execution files are decrypted, with a new disposable export key, inside the test container.
"""
import io
import json
import subprocess
import zipfile

CONTAINER = 'factory-guard-test'
DIRECTORY = '/tmp/us2-native-trace-export'
KEY = '/tmp/us2-native-trace-export-key'


def execute(args, **kwargs):
    return subprocess.run(['docker','exec','-u','node',CONTAINER] + args,
                          capture_output=True, check=True, **kwargs)


# This key protects only this export; it is unrelated to instance secrets and never printed.
execute(['node','-e',"const fs=require('fs');fs.writeFileSync('/tmp/us2-native-trace-export-key',require('crypto').randomBytes(32).toString('hex'),{mode:0o600});"])
execute(['sh','-c','umask 077; n8n export:entities --outputDir=/tmp/us2-native-trace-export '
         '--includeExecutionHistoryDataTables=true --keyFile=/tmp/us2-native-trace-export-key'])
archive = execute(['cat',DIRECTORY + '/entities.zip']).stdout
with zipfile.ZipFile(io.BytesIO(archive)) as zf:
    files = {name: zf.read(name).decode() for name in zf.namelist()
             if name.startswith(('executionentity','executiondata')) and name.endswith('.jsonl')}
js = r'''
const fs=require('fs');
const {CipherAes256CBC}=require('/usr/local/lib/node_modules/n8n/node_modules/n8n-core/dist/encryption/aes-256-cbc.js');
const {parse}=require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const key=fs.readFileSync('/tmp/us2-native-trace-export-key','utf8').trim();
const files=JSON.parse(fs.readFileSync(0,'utf8'));
const cipher=new CipherAes256CBC();
const entities=[],data=new Map();
for(const [name,encrypted] of Object.entries(files)) {
  const plain=cipher.decrypt(encrypted.trim(),key);
  for(const line of plain.split('\n').filter(s=>s.trim())) {
    const row=JSON.parse(line);
    if(name.startsWith('executionentity')) entities.push(row);
    else data.set(String(row.executionId),row);
  }
}
const crypto=require('crypto');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const output=[];
for(const entity of entities) {
  const record=data.get(String(entity.id));
  let details=null;
  if(record&&typeof record.data==='string') {
    try {details=parse(record.data);} catch { try{details=JSON.parse(record.data);}catch{} }
  } else if(record&&typeof record.data==='object') details=record.data;
  let snapshot=record?.workflowData;
  if(typeof snapshot==='string') { try{snapshot=JSON.parse(snapshot);}catch{snapshot=null;} }
  if(!['Basic A reserve — US2 INACTIVE','TEST ONLY — Basic A US2 native fault bridge'].includes(snapshot?.name)) continue;
  const result=details?.resultData, runs=result?.runData||{};
  const first=name=>runs[name]?.at(-1)?.data?.main?.[0]?.[0]?.json;
  const completion=first('Report completion')||first('Report existing hold');
  output.push({id:String(entity.id),workflowId:entity.workflowId,workflowName:snapshot.name,
    mode:entity.mode,status:entity.status,startedAt:entity.startedAt,stoppedAt:entity.stoppedAt,
    case:first('US2 test entry')?.body?.case??'owner-manual',lastNode:result?.lastNodeExecuted,errorNode:result?.error?.node?.name,errorMessage:(result?.error?.message??runs[result?.lastNodeExecuted]?.at(-1)?.error?.message??'').slice(0,300),
    reached:Object.entries(runs).map(([name,entries])=>({name,runs:entries.length,status:entries.at(-1)?.executionStatus,
      timings:entries.map(e=>({startTime:e.startTime,executionTime:e.executionTime}))})),
    guard:first('Verify acquisition'),
    handoffReceipt: first('Check handoff receipt'),
    githubWrites:['Add Building','Remove Approved','Post handoff'].filter(name=>runs[name]).map(name=>({node:name,status:first(name)?.statusCode})),
    completion,codeHashes:Object.fromEntries(snapshot.nodes.filter(n=>n.type.endsWith('.code')).map(n=>[n.name,hash(n.parameters.jsCode)])),
    connectionsHash:hash(snapshot.connections)});
}

console.log(JSON.stringify(output));
'''
result = subprocess.run(['docker','exec','-i','-u','node',CONTAINER,'node','-e',js],
    input=json.dumps(files).encode(), capture_output=True)
if result.returncode:
    raise RuntimeError(result.stderr.decode()[:1500])
# Sanitized output only: no raw execution payload, resume token, credentials or account file.
records = json.loads(result.stdout)
print(json.dumps(records, separators=(',', ':')))
# Remove only artifacts created by this collector, after successful extraction.
execute(['node','-e',"const fs=require('fs');fs.rmSync('/tmp/us2-native-trace-export',{recursive:true,force:true});fs.rmSync('/tmp/us2-native-trace-export-key',{force:true});fs.rmSync('/tmp/us2-native-collector-work',{recursive:true,force:true});"])
