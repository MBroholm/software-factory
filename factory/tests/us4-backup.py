"""T027 stopped test-volume restore rehearsal. Invoked remotely with private JSON on stdin.
Never prints API keys, environment values, backup paths or decrypted credentials.
Preserves the original volume and a private backup; clone has --network none and no ports.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time


def command(args, data=None):
    return subprocess.check_output(args, input=data, stderr=subprocess.PIPE)


def docker(*args, data=None):
    return command(['docker', *args], data)


def inventory(directory):
    return {str(p.relative_to(directory)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(Path(directory).rglob('*')) if p.is_file()}


request = json.load(sys.stdin)
original = 'factory-guard-test'
clone = 'factory-us4-restore'
volume = 'factory_us4_restore_data'
info = json.loads(docker('inspect', original))[0]
assert info['Config']['Image'] == 'docker.n8n.io/n8nio/n8n:2.48.8'
assert info['NetworkSettings']['Ports']['5678/tcp'] == [{'HostIp': '127.0.0.1', 'HostPort': '5679'}]
assert any(m.get('Name') == 'factory_guard_test_data' for m in info['Mounts'])
assert not docker('ps', '-a', '--filter', 'name=^/'+clone+'$', '--format', '{{.Names}}').strip()
assert not docker('volume', 'ls', '--filter', 'name=^'+volume+'$', '--format', '{{.Name}}').strip()
os.umask(0o077)
private = Path(tempfile.mkdtemp(prefix='factory-us4-private-backup-'))
(private/'container.env').write_text('\n'.join(info['Config']['Env'])+'\n')
# Both original and restored workflows are already paused/drained by the local adapter.
docker('stop', '--time', '10', original)
docker('cp', '-a', original+':/home/node/.n8n/.', str(private/'n8n'))
manifest = inventory(private/'n8n')
assert 'database.sqlite' in manifest and 'config' in manifest
(private/'manifest.json').write_text(json.dumps(manifest))
archive = private/'snapshot.tar'
command(['tar', '-cpf', str(archive), '-C', str(private), 'n8n', 'container.env', 'manifest.json'])
archive_hash = hashlib.sha256(archive.read_bytes()).hexdigest()
docker('start', original)
docker('volume', 'create', volume)
docker('create', '--name', clone, '--network', 'none', '--env-file', str(private/'container.env'),
       '--mount', 'type=volume,source='+volume+',target=/home/node/.n8n', info['Image'])
docker('cp', '-a', str(private/'n8n')+'/.', clone+':/home/node/.n8n')
verify = private/'restore-verify'
docker('cp', '-a', clone+':/home/node/.n8n/.', str(verify))
assert inventory(verify) == manifest, 'Stopped restored files differ'
docker('start', clone)
clone_info = json.loads(docker('inspect', clone))[0]
assert clone_info['HostConfig']['NetworkMode'] == 'none'
assert not clone_info['HostConfig']['PortBindings']
# Calls below stay inside the network-disabled clone's own localhost.
client = r"""let input='';process.stdin.on('data',c=>input+=c);process.stdin.on('end',async()=>{try{const d=JSON.parse(input);const r=await fetch('http://127.0.0.1:5678'+d.route,{method:d.method||'GET',headers:{'X-N8N-API-KEY':d.key,'Content-Type':'application/json'},body:d.body===undefined?undefined:JSON.stringify(d.body)});if(!r.ok)throw Error('HTTP '+r.status);process.stdout.write(await r.text());}catch(e){console.error(e.message);process.exitCode=1;}});"""


def api(route, method='GET', body=None):
    payload = {'key': request['api_key'], 'route': route, 'method': method}
    if body is not None:
        payload['body'] = body
    return json.loads(docker('exec', '-i', '-u', 'node', clone, 'node', '-e', client,
                             data=json.dumps(payload).encode()))


for attempt in range(45):
    try:
        workflows = api('/api/v1/workflows?limit=100')
        break
    except subprocess.CalledProcessError:
        time.sleep(1)
else:
    raise RuntimeError('Restore clone API did not become ready')
assert not workflows.get('nextCursor') and not any(w['active'] for w in workflows['data'])
assert sorted(w['id'] for w in workflows['data']) == sorted(request['workflow_ids'])
rows = api('/api/v1/data-tables/'+request['table_id']+'/rows?limit=100')
assert rows['data'] == request['rows']
for status in ['running', 'waiting']:
    assert not api('/api/v1/executions?status='+status+'&limit=100')['data']
# Exercise only the backed-up disposable credential, never historical GitHub/Gemini credentials.
server = "const http=require('http'),crypto=require('crypto');http.createServer((q,r)=>{const ok=crypto.createHash('sha256').update(q.headers['x-us4-restore-check']||'').digest('hex')==="+json.dumps(request['credential_sha256'])+";r.writeHead(ok?200:403,{'Content-Type':'application/json'});r.end(JSON.stringify({credential_restored:ok}));}).listen(18769,'127.0.0.1');"
docker('exec', '-d', '-u', 'node', clone, 'node', '-e', server)
body = {'name': 'TEST ONLY — US4 restored credential loopback', 'nodes': [
    {'id': 'restore-entry', 'name': 'Restore entry', 'type': 'n8n-nodes-base.webhook', 'typeVersion': 2.1,
     'position': [0, 0], 'webhookId': 'us4-restore-only',
     'parameters': {'httpMethod': 'POST', 'path': 'us4-restore-only', 'responseMode': 'lastNode', 'options': {}},
     'notes': 'TEST ONLY: private loopback restored-clone entry; no production authority.'},
    {'id': 'restore-check', 'name': 'Restored credential check', 'type': 'n8n-nodes-base.httpRequest',
     'typeVersion': 4.2, 'position': [300, 0],
     'parameters': {'url': 'http://127.0.0.1:18769', 'authentication': 'genericCredentialType',
                    'genericAuthType': 'httpHeaderAuth', 'options': {'timeout': 10000}},
     'credentials': {'httpHeaderAuth': {'id': request['credential_id'], 'name': 'US4 disposable restore check'}},
     'notes': 'TEST ONLY: decrypt only the disposable test credential and send to this network-disabled clone loopback.'}],
    'connections': {'Restore entry': {'main': [[{'node': 'Restored credential check', 'type': 'main', 'index': 0}]]}},
    'settings': {'executionOrder': 'v1', 'saveDataSuccessExecution': 'all'}}
w = api('/api/v1/workflows', 'POST', body)
api('/api/v1/workflows/'+w['id']+'/activate', 'POST', {'versionId': w['versionId']})
time.sleep(2)
result = api('/webhook/us4-restore-only', 'POST', {})
if isinstance(result, list):
    result = result[0]
assert result['credential_restored'] is True
executions = api('/api/v1/executions?workflowId='+w['id']+'&limit=1')['data']
assert executions[0]['status'] == 'success'
api('/api/v1/workflows/'+w['id']+'/deactivate', 'POST')
docker('stop', '--time', '10', clone)
report = {'image_id': info['Image'], 'source_container': original, 'source_volume': 'factory_guard_test_data',
          'restore_container': clone, 'restore_volume': volume, 'network': 'none', 'published_ports': [],
          'backup_sha256': archive_hash, 'file_count': len(manifest), 'all_stopped_file_hashes_equal': True,
          'workflow_count_restored': len(workflows['data']), 'all_restored_workflows_inactive': True,
          'control_rows_exact': True, 'restored_row': rows['data'][0], 'running': 0, 'waiting': 0,
          'test_credential_restored': True, 'credential_test_execution': executions[0]['id'],
          'credential_test_workflow': w['id'], 'clone_stopped': True,
          'original_volume_untouched': True, 'private_backup_retained': True,
          'limits': 'Only the designated test volume restored; no operational restore or ordinary task processing. Restored historical credentials remain encrypted and unused.'}
(private/'result.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
