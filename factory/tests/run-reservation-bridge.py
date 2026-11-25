"""Explicit sequential T019 operator tests on NAS, after owner import/publication.
Synthetic loopback HTTP only; native isolated Data Table; no imports or real API calls.
No finally reset. A failed assertion stops. Fixture reset requires an inspected completed case.
"""
import argparse
import concurrent.futures
import json
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:5679/webhook/basic-a-us2-test/'
STATE = '/tmp/basic-a-us2-fixture-state.json'
NO_WORK = {'occupied', 'closed-building', 'nonowner-building', 'conflicting-building', 'non-owner'}
FAILURES = {'no-approval', 'wrong-approval', 'captured-edit', 'unexpected-before',
            'unexpected-after', 'partial-label', 'unknown-post'}
CASES = ['success', 'occupied', 'closed-building', 'nonowner-building', 'conflicting-building',
         'non-owner', 'no-approval', 'wrong-approval', 'captured-edit', 'unexpected-before',
         'unexpected-after', 'partial-label', 'unknown-post']


def log(event, **fields):
    print(json.dumps(dict(event=event, at=time.time(), **fields), separators=(',', ':')), flush=True)


def request(route, body=None, timeout=90):
    req = urllib.request.Request(BASE + route,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    result = json.loads(raw)
    if isinstance(result, list) and len(result) == 1:
        result = result[0]
    return status, result


def row():
    status, result = request('state')
    assert status == 200 and len(result.get('rows', [])) == 1, (status, result)
    return result['rows'][0]


def effects():
    # The fixture file persists across container restart; inspection does not need the server.
    code = "const fs=require('fs');process.stdout.write(fs.readFileSync('/tmp/basic-a-us2-fixture-state.json','utf8'))"
    r = subprocess.run(['docker', 'exec', 'factory-guard-test', 'node', '-e', code], check=True, capture_output=True)
    return json.loads(r.stdout)


def prepare_idle(reason):
    before = row()
    log('inspect_before_case', reason=reason, row=before)
    if before['busy']:
        known = effects().get(before['execution_id'])
        assert known and known['case'] in FAILURES and not known['waitingAt'], 'Unknown or interrupted hold; owner inspection required'
        # Separate, explicit fixture action, only between completed expected-failure cases.
        status, result = request('fixture', dict(id=before['id'], expected_execution_id=before['execution_id'], reason=reason))
        log('operator_inspected_fixture_reset', before=before, reason=reason, http=status, response=result)
        assert status == 200, (status, result)
    after = row()
    assert after['busy'] is False, after
    return after


def held_skip(case):
    before, state = row(), effects()
    assert before['busy'] is True
    status, response = request('run', {'case': 'success'})
    assert status == 200 and response['status'] == 'skipped_held', (status, response)
    assert row() == before and effects() == state, 'Held poll changed row or reached synthetic HTTP'
    log('PASS_held_skip', case=case, row=before, response=response)


def case(name):
    prepare_idle('Inspected prior completed synthetic case; prepare US2 ' + name)
    status, response = request('run', {'case': name})
    after = row()
    state = effects().get(after['execution_id'])
    assert state and state['case'] == name, (name, state, after)
    success = name not in FAILURES
    assert (status == 200) is success, (name, status, response)
    assert after['busy'] is (not success), (name, after)
    expected_posts = 1 if name in {'success', 'unexpected-after', 'unknown-post'} else 0
    assert state['posts'] == expected_posts, (name, state)
    labels = [l['name'] for l in state['issues'][0]['labels']]
    if name in {'success', 'unexpected-after', 'unknown-post'}:
        assert labels == ['documentation', 'Building'], labels
        assert [l['name'] for l in state['issues'][1]['labels']] == ['Approved', 'documentation']
    elif name == 'partial-label':
        assert set(labels) == {'Approved', 'documentation', 'Building'}, labels
    if success:
        assert response['status'] == 'released' and response['outcome'] == ('no_work' if name in NO_WORK else 'success')
    else:
        assert status >= 400
        held_skip(name)
    log('PASS_case', case=name, http=status, row=after, response=response,
        labels=labels, posts=state['posts'], calls=state['calls'])


def restart_reservation():
    idle_before = prepare_idle('Inspected completed synthetic suite and prior restart observation; prepare controlled in-flight restart')
    existing = set(effects())
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(request, 'run', {'case': 'restart-reservation'})
        deadline = time.monotonic() + 20
        selected = None
        while time.monotonic() < deadline:
            candidates = [(key, value) for key, value in effects().items()
                          if key not in existing and value['case'] == 'restart-reservation'
                          and value['waitingAt'] == 'Add Building']
            if candidates:
                assert len(candidates) == 1, 'Ambiguous in-flight fixture; preserve state'
                selected = candidates[0]
                break
            time.sleep(0.2)
        assert selected, 'Did not observe new in-flight synthetic label addition; do not restart blindly'
        execution_id, state = selected
        assert not future.done(), 'Execution completed before restart; stop instead of claiming interruption'
        assert state['posts'] == 0
        assert set(l['name'] for l in state['issues'][0]['labels']) == {'Approved', 'documentation', 'Building'}
        # Reuse the US1 lesson: state webhooks queue behind this serialized live execution.
        # Observe the persisted synthetic effect outside n8n, then read the guard after restart.
        log('inspected_before_restart', idle_before=idle_before, observed_execution=execution_id, effect=state)
        subprocess.run(['docker', 'restart', '-t', '1', 'factory-guard-test'], check=True, capture_output=True)
        log('restarted_isolated_container', container='factory-guard-test')
        try:
            status, response = future.result(timeout=20)
            log('interrupted_request_result', http=status, response=response)
        except Exception as error:
            log('interrupted_request_error', type=type(error).__name__)
        deadline = time.monotonic() + 45
        while time.monotonic() < deadline:
            try:
                after = row()
                break
            except (OSError, ValueError, AssertionError):
                time.sleep(0.5)
        else:
            raise AssertionError('Isolated n8n did not become ready; preserve hold and inspect')
        assert after['id'] == idle_before['id'] and after['key'] == 'global'
        assert after['busy'] is True and after['execution_id'] == execution_id and after['issue_number'] == 101, after
        assert effects().get(execution_id) == state, 'Restart changed fixture effects'
        held_skip('restart-reservation')
        log('PASS_restart_retention', idle_before=idle_before, row=after, effect=state)
        log('FINAL_HOLD_PRESERVED', row=row(), schedule='Still disabled; owner-only scheduled held-skip step next')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    stage = parser.add_mutually_exclusive_group()
    stage.add_argument('--restart', action='store_true', help='Explicitly restart only the isolated container after the regular suite')
    stage.add_argument('--restart-only', action='store_true', help='Run only the remaining inspected restart case; retain regular-suite results')
    args = parser.parse_args()
    log('begin', scope='isolated US2 synthetic suite; no real GitHub/provider writes')
    if not args.restart_only:
        for name in CASES:
            case(name)
    if args.restart or args.restart_only:
        restart_reservation()
    else:
        log('FINAL_HOLD_PRESERVED', row=row(), remaining='In-flight restart and scheduled held skip unrun')
