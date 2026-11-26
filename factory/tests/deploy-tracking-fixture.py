"""Copy/start or stop only the US3 loopback fixture in the verified isolated container."""
import json
from pathlib import Path
import subprocess
import sys

SSH = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'broholm@nas']


def remote(command, content=None):
    result = subprocess.run(SSH + [command], input=content, capture_output=True, check=True)
    return result.stdout.decode()


if sys.argv[1:] == ['stop']:
    # Preserve state/logs, stop only the process whose command line matches this fixture.
    print(remote("docker exec -u node factory-guard-test sh -c 'p=$(cat /tmp/us3-fixture.pid); test -r /proc/$p/cmdline && tr \"\\000\" \" \" < /proc/$p/cmdline | grep -q /tmp/us3-tracking-fixture-server.cjs && kill $p'"))
    print(remote('docker exec -u node factory-guard-test node -e "fetch(\'http://127.0.0.1:18767/inspect\').then(()=>process.exit(1)).catch(e=>{if(e.cause?.code!==\'ECONNREFUSED\')process.exit(1);console.log(\'US3 fixture stopped; loopback connection refused\')})"'))
    checkpoint = Path('factory/local/us3/shutdown.json')
    if checkpoint.exists():
        report = json.loads(checkpoint.read_text())
        report['fixture_service_stopped'] = True
        checkpoint.write_text(json.dumps(report, indent=2) + '\n')
else:
    assert sys.argv[1:] == ['start'], 'Use start or stop'
    info = json.loads(remote('docker inspect factory-guard-test'))[0]
    assert info['Config']['Image'] == 'docker.n8n.io/n8nio/n8n:2.48.8'
    assert info['NetworkSettings']['Ports']['5678/tcp'] == [{'HostIp': '127.0.0.1', 'HostPort': '5679'}]
    assert any(m.get('Name') == 'factory_guard_test_data' for m in info['Mounts'])
    remote('docker exec -u node factory-guard-test test ! -e /tmp/us3-tracking-state.json')
    for source, dest in [('factory/tests/tracking-fixture-server.cjs', '/tmp/us3-tracking-fixture-server.cjs'),
                         ('factory/local/us3/scenarios.json', '/tmp/us3-tracking-scenarios.json')]:
        remote("docker exec -i -u node factory-guard-test sh -c 'cat > " + dest + "'", Path(source).read_bytes())
    print(remote("docker exec -d -u node factory-guard-test sh -c 'echo $$ > /tmp/us3-fixture.pid; exec node /tmp/us3-tracking-fixture-server.cjs /tmp/us3-tracking-scenarios.json /tmp/us3-tracking-state.json > /tmp/us3-tracking-fixture.log 2>&1'"))
    print('US3 fixture launched; verify /inspect before native execution. Existing state was not overwritten.')
