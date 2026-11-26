"""Read sanitized native execution traces using n8n's supported encrypted entity export.
Runs on Ubuntu. No direct SQL or instance encryption-key/credential access.
Only execution files are decrypted, with a new disposable export key, inside the test container.
"""
import io
import json
import subprocess
import zipfile

CONTAINER = 'factory-guard-test'
DIRECTORY = '/tmp/guard-trace-export'
KEY = '/tmp/guard-trace-export-key'


def execute(args, **kwargs):
    return subprocess.run(['docker','exec','-u','node',CONTAINER] + args,
                          capture_output=True, check=True, **kwargs)


# This key protects only this export; it is unrelated to instance secrets and never printed.
execute(['node','-e',"const fs=require('fs');fs.writeFileSync('/tmp/guard-trace-export-key',require('crypto').randomBytes(32).toString('hex'),{mode:0o600});"])
execute(['sh','-c','umask 077; n8n export:entities --outputDir=/tmp/guard-trace-export '
         '--includeExecutionHistoryDataTables=true --keyFile=/tmp/guard-trace-export-key'])
archive = execute(['cat',DIRECTORY + '/entities.zip']).stdout
with zipfile.ZipFile(io.BytesIO(archive)) as zf:
    files = {name: zf.read(name).decode() for name in zf.namelist()
             if name.startswith(('executionentity','executiondata')) and name.endswith('.jsonl')}
js = r'''
const fs=require('fs');
const {CipherAes256CBC}=require('/usr/local/lib/node_modules/n8n/node_modules/n8n-core/dist/encryption/aes-256-cbc.js');
const {parse}=require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const key=fs.readFileSync('/tmp/guard-trace-export-key','utf8').trim();
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
const allowed=new Set(['0ITfSwx2Yb69qfX5','Gussyro70lhzF3WT','NdYJRhC6UWLHW8Vb','CEGJ4lmhzku75vUr',
  'AGgK7NJFKTzU2vkr','hheODhtDH4vVt3xb','OqiOmuxC87o2rG0P','jjTILZ2XLFBjfaLN',
  'N5CiaS51bwjwQ133','dV09X3Pv4Cmd4krk','EtTipKHkEuutfggH']);
const output=[];
for(const entity of entities.filter(e=>allowed.has(e.workflowId))) {
  const record=data.get(String(entity.id));
  let details=null;
  if(record&&typeof record.data==='string') {
    try {details=parse(record.data);} catch { try{details=JSON.parse(record.data);}catch{} }
  } else if(record&&typeof record.data==='object') details=record.data;
  let snapshot=record?.workflowData;
  if(typeof snapshot==='string') { try{snapshot=JSON.parse(snapshot);}catch{snapshot=null;} }
  const result=details?.resultData;
  const runs=result?.runData||{};
  const reached=Object.entries(runs).map(([name,values])=>({name,status:values.at(-1)?.executionStatus}));
  const last=result?.lastNodeExecuted;
  let statusOutput=null,control=null,testCase=null;
  for(const [name,values] of Object.entries(runs)) {
    const value=values.at(-1)?.data?.main?.[0]?.[0]?.json;
    if(value?.body?.case) testCase=value.body.case;
    if(name.endsWith('Report completion')||name.endsWith('Report existing hold')) {
      statusOutput=value?.status;
      if(value?.control) {
        control=Object.fromEntries(['id','key','busy','execution_id','issue_number','started_at'].map(k=>[k,value.control[k]]));
      }
    }
  }
  output.push({id:String(entity.id),workflowId:entity.workflowId,workflowName:snapshot?.name,workflowVersion:snapshot?.versionId,mode:entity.mode,status:entity.status,
    startedAt:entity.startedAt,stoppedAt:entity.stoppedAt,case:testCase,lastNode:last,
    error:result?.error?.message,errorNode:result?.error?.node?.name,
    reached,statusOutput,control});
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
execute(['node','-e',"const fs=require('fs');fs.rmSync('/tmp/guard-trace-export',{recursive:true,force:true});fs.rmSync('/tmp/guard-trace-export-key',{force:true});fs.rmSync('/tmp/guard-native-evidence',{recursive:true,force:true});"])
