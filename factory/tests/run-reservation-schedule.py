"""T032 observer on NAS. Never starts a workflow, resets a row or changes fixtures.
Owner imports/publishes only the reviewed schedule copy after inspecting/recovering the hold.
"""
import json
import subprocess
import time
import urllib.request


def row():
    with urllib.request.urlopen('http://127.0.0.1:5679/webhook/basic-a-us2-schedule/state', timeout=15) as response:
        value = json.load(response)
    if isinstance(value, list):
        assert len(value) == 1
        value = value[0]
    assert len(value['rows']) == 1
    return value['rows'][0]


def fixture():
    code = "fetch('http://127.0.0.1:18766/inspect').then(async r=>{if(!r.ok)throw Error('Fixture read failed');process.stdout.write(await r.text())}).catch(e=>{console.error(e);process.exitCode=1})"
    result = subprocess.run(['docker', 'exec', '-u', 'node', 'factory-guard-test', 'node', '-e', code], capture_output=True, check=True)
    return json.loads(result.stdout).get('32001')


def event(name, **values):
    print(json.dumps(dict(event=name, at=time.time(), **values)), flush=True)


before = row()
event('initial_observation', row=before, session=fixture())
assert before['busy'] is False, 'Held or in-flight row: stop and inspect; this observer never resets it'
deadline = time.monotonic() + 160
first = None
while time.monotonic() < deadline:
    session = fixture()
    current = row()
    if session and session['posts']:
        assert session['posts'] == 1
        labels = {i['number']: [label['name'] for label in i['labels']] for i in session['issues']}
        assert 'Building' in labels[101] and 'Approved' not in labels[101]
        assert 'Approved' in labels[102] and 'Building' not in labels[102]
        handoffs = [c for c in session['comments']['101'] if c['body'].startswith('<!-- factory:handoff:v1 ')]
        assert len(handoffs) == 1
        if current['busy'] is False:
            if first is None:
                first = (current, session)
                event('observed_reservation', row=current, session=session)
            elif current['execution_id'] != first[0]['execution_id']:
                assert session['comments'] == first[1]['comments']
                assert session['issues'] == first[1]['issues']
                assert session['events'] == first[1]['events']
                assert current['issue_number'] is None
                event('PASS_occupied_poll', row=current, session=session)
                break
    time.sleep(2)
else:
    raise AssertionError('Two completed scheduled ticks not observed within 160 seconds')
event('observation_complete', next='Verify native mode=trigger traces/fingerprints, then owner unpublishes/drains; inspect final row and fixture effects. No automatic reset.')
