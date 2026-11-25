"""Explicit sequential isolated US1 tests after owner manual import/publication.
Run on NAS through SSH. No imports, real GitHub/Gemini calls, direct SQL or finally resets.
"""
import argparse
import concurrent.futures
import json
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:5679/webhook/basic-a-us1-test/'
FIELDS = ('id', 'key', 'busy', 'execution_id', 'issue_number', 'started_at', 'updatedAt')
NO_WORK = {'non-owner', 'pr', 'closed', 'approved', 'ready-unchanged', 'non-owner-discussion', 'factory-marker'}
SUCCESS = {'success', 'retry-once', 'retry-twice', 'reuse', 'revision', 'pagination', 'later-candidate'}
READ_FAILURE = {'captured-edit', 'captured-delete', 'edited-marker', 'stranded', 'conflicting', 'unexpected-before', 'partial-label'}
COUNT_FAILURE = {'count-error', 'count-invalid', 'over-budget'}


def log(event, **fields):
    print(json.dumps(dict(event=event, at=time.time(), **fields), separators=(',', ':')), flush=True)


def request(route, body=None, timeout=100):
    req = urllib.request.Request(BASE + route, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            status, raw = r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read().decode()
    result = json.loads(raw)
    if isinstance(result, list) and len(result) == 1:
        result = result[0]
    return status, result


def row():
    status, result = request('state')
    assert status == 200 and len(result.get('rows', [])) == 1, (status, result)
    return result['rows'][0]


def fixture_state():
    code = "fetch('http://127.0.0.1:18765/inspect').then(async r=>{if(!r.ok)throw Error(r.status);process.stdout.write(await r.text())}).catch(e=>{console.error(e);process.exitCode=1})"
    r = subprocess.run(['docker', 'exec', 'factory-guard-test', 'node', '-e', code], check=True, capture_output=True)
    return json.loads(r.stdout)


def inspected_idle(reason):
    before = row()
    log('inspect_before_case', reason=reason, row=before)
    if before['busy']:
        known = fixture_state().get(before['execution_id'])
        assert known and known['case'] in READ_FAILURE | COUNT_FAILURE | set(['exhaust', 'retry-after-long', 'retry-after-invalid', 'other-503', 'quota', 'auth', 'server-500', 'transport', 'invalid-output', 'truncated', 'missing-usage', 'source-in-backoff', 'discussion-in-backoff', 'state-in-backoff', 'source-during-call', 'unknown-post', 'unexpected-after']), 'Unknown held execution; stop for owner inspection'
        # Only an explicit, recorded fixture action between completed inspected tests.
        status, result = request('fixture', dict(id=before['id'], expected_execution_id=before['execution_id'], reason=reason))
        log('operator_fixture_reset', reason=reason, before=before, http=status, response=result)
        assert status == 200, (status, result)
    after = row()
    assert after['busy'] is False, after
    return after


def skip_held(case):
    before = row()
    assert before['busy'] is True
    state_before = fixture_state()
    status, response = request('run', {'case': 'success'})
    assert status == 200 and response.get('status') == 'skipped_held', (status, response)
    assert {k: row().get(k) for k in FIELDS} == {k: before.get(k) for k in FIELDS}
    assert fixture_state() == state_before, 'Held poll reached synthetic HTTP effects'
    log('PASS_held_skip', case=case, row=before, response=response)


def case(name):
    before = inspected_idle('Inspected previous completed case and synthetic effects; prepare US1 ' + name)
    start = time.monotonic()
    status, response = request('run', {'case': name})
    elapsed = time.monotonic() - start
    after = row()
    state = fixture_state().get(after['execution_id'])
    assert state and state['case'] == name, (name, state, after)
    success = name in SUCCESS or name in NO_WORK
    assert (status == 200) is success, (name, status, response)
    assert after['busy'] is (not success), (name, after)
    expected_generation = 0 if name in NO_WORK | READ_FAILURE | COUNT_FAILURE | {'reuse'} else {'retry-once': 2, 'retry-twice': 3, 'exhaust': 3}.get(name, 1)
    assert state['generation'] == expected_generation, (name, state['generation'], expected_generation)
    expected_count = 0 if name in NO_WORK | READ_FAILURE | {'reuse'} else 1
    assert state['count'] == expected_count, (name, state['count'], expected_count)
    expected_posts = 1 if name in SUCCESS - {'reuse'} or name in {'unknown-post', 'unexpected-after'} else 0
    assert state['posts'] == expected_posts, (name, state['posts'], expected_posts)
    if expected_generation:
        assert len(set(state['modelBodies'])) == 1, 'Generation payload changed between retries'
        assert state['countBodies'] == [state['modelBodies'][0]], 'Counted and generated payload differ'
    generated = [c for c in state['calls'] if c['node'] == 'Gemini generateContent']
    for i, delay in enumerate([10, 30][:max(0, expected_generation-1)]):
        assert generated[i+1]['at'] - generated[i]['at'] >= delay*1000 - 100, (name, generated)
    if success:
        assert response.get('status') == 'released', response
        assert response.get('outcome') == ('no_work' if name in NO_WORK else 'success'), response
        if name not in NO_WORK:
            target = next(i for i in state['issues'] if i['number'] == (102 if name == 'later-candidate' else 101))
            assert [l['name'] for l in target['labels']] == ['documentation', 'Ready for approval'], target
        if expected_generation:
            assert response['generation']['attempt_count'] == expected_generation, response
    if name == 'pagination':
        for node in ['Discover issues', 'Read stage events', 'Read source comments']:
            assert any(c['node'] == node and c['page'] == '2' for c in state['calls']), (node, state['calls'])
    if name == 'unknown-post':
        assert len([c for c in state['comments']['101'] if c['body'].startswith('<!-- factory:refinement:v1')]) == 1
    if name == 'partial-label':
        assert {'Ideas', 'Refining'}.issubset({l['name'] for l in state['issues'][0]['labels']})
    log('PASS', case=name, http=status, elapsedSeconds=round(elapsed, 3), before=before, after=after,
        generation=state['generation'], count=state['count'], posts=state['posts'], response=response)
    if not success:
        skip_held(name)


def restart():
    idle_before = inspected_idle('Inspected completed suite; prepare controlled native US1 restart during backoff')
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        pending = pool.submit(request, 'run', {'case': 'restart-backoff'})
        deadline = time.monotonic() + 20
        selected = None
        while time.monotonic() < deadline:
            candidates = [(key, value) for key, value in fixture_state().items() if value['case'] == 'restart-backoff' and value['generation'] == 1]
            if candidates:
                selected = candidates[-1]
                break
            time.sleep(.2)
        assert selected, 'Did not observe first unavailable response'
        # State webhooks queue behind the serial main execution. Observe the fixture response
        # outside n8n, then inspect the persisted guard only after the controlled restart.
        assert not pending.done(), 'Backoff execution no longer in flight'
        log('restart_in_process_backoff', idle_before=idle_before, observed_execution=selected[0], synthetic=selected[1])
        subprocess.run(['docker', 'restart', '-t', '1', 'factory-guard-test'], check=True, capture_output=True)
        try:
            response = pending.result(timeout=20)
            log('interrupted_request_response', response=response)
        except Exception as e:
            log('interrupted_request', error=type(e).__name__)
    # Owner-imported bridge publication persists. Do not clear its held row.
    for _ in range(60):
        try:
            after = row()
            break
        except (OSError, ValueError, AssertionError):
            time.sleep(1)
    else:
        raise AssertionError('Isolated server did not return healthy')
    assert after['busy'] is True and after['execution_id'] == selected[0] and after['issue_number'] == 101, after
    log('PASS_restart_hold', idle_before=idle_before, after=after, next='Restart synthetic fixture process; run held-check stage. No reset.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=['inspect', 'pilot', 'suite', 'restart', 'held-check'])
    args = parser.parse_args()
    if args.stage == 'inspect':
        log('inspect', row=row(), fixtureRuns=len(fixture_state()))
    elif args.stage == 'pilot':
        case('success')
        case('retry-once')
    elif args.stage == 'suite':
        names = ['retry-twice', 'exhaust', 'retry-after-long', 'retry-after-invalid', 'other-503', 'quota', 'auth', 'server-500', 'transport', 'invalid-output', 'truncated', 'missing-usage', 'count-error', 'count-invalid', 'over-budget', 'source-in-backoff', 'discussion-in-backoff', 'state-in-backoff', 'source-during-call', 'non-owner', 'pr', 'closed', 'approved', 'ready-unchanged', 'non-owner-discussion', 'factory-marker', 'reuse', 'revision', 'captured-edit', 'captured-delete', 'edited-marker', 'stranded', 'conflicting', 'pagination', 'later-candidate', 'unknown-post', 'partial-label', 'unexpected-before', 'unexpected-after']
        for name in names:
            case(name)
    elif args.stage == 'restart':
        restart()
    else:
        skip_held('restart-backoff')
