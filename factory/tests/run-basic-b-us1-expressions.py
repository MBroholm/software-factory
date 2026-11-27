"""Read-only VM checks in the existing designated isolated n8n container.

Streams synthetic fixtures to node; no files, imports, HTTP requests, table mutations or
credentials are used. SSH access must be separately authorized in the development session.
"""
import json
import shlex
import subprocess
import sys
from pathlib import Path

ssh=['ssh','-o','BatchMode=yes','-o','ConnectTimeout=10','broholm@nas']
info=json.loads(subprocess.run(ssh+['docker inspect factory-guard-test'],capture_output=True,text=True,check=True).stdout)[0]
if info['Config']['Image']!='docker.n8n.io/n8nio/n8n:2.48.8': raise SystemExit('Unknown test image')
ports=info['NetworkSettings']['Ports'].get('5678/tcp',[])
if not ports or any(x['HostIp']!='127.0.0.1' or x['HostPort']!='5679' for x in ports): raise SystemExit('Unknown isolated editor boundary')
# Select libraries by exact designated container. The payload has no host paths or secrets.
script=Path('factory/tests/check-basic-b-us1-expressions.cjs').read_text()
command='docker exec -i factory-guard-test node -e '+shlex.quote(script)
for kind in ('reserve','collect','track','refine'):
    fixture=Path('factory/local/basic-b-native')/(kind+'-expressions.json')
    if not fixture.is_file(): raise SystemExit('Generate synthetic graph fixtures first')
    result=subprocess.run(ssh+[command],input=fixture.read_bytes(),capture_output=True,timeout=55)
    print(result.stdout.decode(),end='')
    if result.returncode:
        print(result.stderr.decode());raise SystemExit(result.returncode)

if '--waits' in sys.argv:
    wait_script=Path('factory/tests/check-refinement-native-waits.cjs').read_text()
    result=subprocess.run(ssh+['docker exec -i factory-guard-test node -e '+shlex.quote(wait_script)],capture_output=True,timeout=55)
    print(result.stdout.decode(),end='')
    if result.returncode:
        print(result.stderr.decode());raise SystemExit(result.returncode)
