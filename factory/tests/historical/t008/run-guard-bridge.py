"""Explicit operator tests against the owner-imported isolated native n8n bridge.
Run on Ubuntu over the existing SSH connection. Stops on any unexpected result.
No automatic/finally reset, import, or production endpoint is implemented.
"""
import argparse
import concurrent.futures
import datetime
import json
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:5679/webhook/basic-a-guard-test/'
WORKFLOWS = ('refine', 'reserve', 'track')
FIELDS = ('key', 'busy', 'execution_id', 'issue_number', 'started_at')


def event(kind, **data):
    print(json.dumps(dict(time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                          event=kind, **data), separators=(',', ':')), flush=True)


def request(path, body=None, timeout=20):
    req = urllib.request.Request(BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Content-Type': 'application/json'} if body is not None else {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status, raw = response.status, response.read().decode()
    except urllib.error.HTTPError as exc:
        status, raw = exc.code, exc.read().decode()
    try:
        result = json.loads(raw)
    except ValueError:
        result = {'text': raw[:500]}
    if isinstance(result, list) and len(result) == 1:
        result = result[0]
    return status, result


def state():
    status, result = request('state')
    assert status == 200 and isinstance(result, dict) and 'control' in result, (status, result)
    return result


def row():
    rows = state()['control']
    assert len(rows) == 1, rows
    return rows[0]


def fixture(action, reason, current=None, values=None):
    assert reason
    body = dict(action=action, reason=reason)
    if current is not None:
        body['id'] = current['id']
    if values is not None:
        body['row'] = {key: values[key] for key in FIELDS}
    status, result = request('fixture', body)
    event('operator_fixture', request=body, http=status, response=result)
    assert status == 200 and result.get('action') == action, (status, result)


def idle(reason):
    before = row()
    if before['busy']:
        # Deliberate operator action after inspecting the previous recorded case. Not cleanup.
        fixture('update', reason, before, {**before, 'busy': False})
    after = row()
    assert after['busy'] is False
    event('inspected_idle', reason=reason, row=after)
    return after


def skip_all(reason, include=None):
    before = state()
    assert len(before['control']) == 1 and before['control'][0]['busy'] is True
    for index, name in enumerate(([include] if include else []) + list(WORKFLOWS)):
        requested_case = 'G05' if include and index == 0 else 'G15'
        status, result = request(name, {'case': requested_case})
        assert status == 200 and result.get('status') == 'skipped_held', (name, status, result)
        actual = {key: result['control'][key] for key in FIELDS}
        assert actual == {key: before['control'][0][key] for key in FIELDS}, (actual, before)
        assert state() == before, 'Held skip changed persisted state or effects'
        event('PASS', case='G15', workflow=name, reason=reason,
              held_execution=actual['execution_id'], response=result)


def test_case(name, case, expected_busy, effect_delta=0):
    idle('Inspect previous case/effects; explicitly prepare ' + name + ' ' + case)
    before = state()
    status, result = request(name, {'case': case})
    after = state()
    r = after['control'][0]
    expected_error = case not in ('G01', 'G02')
    assert (status >= 400) == expected_error, (name, case, status, result, after)
    assert len(after['control']) == 1 and r['busy'] is expected_busy, (name, case, after)
    assert len(after['effects']) == len(before['effects']) + effect_delta, (name, case, before, after)
    if case == 'G07':
        assert after == before, 'Failed acquisition changed persistent state'
    else:
        assert r['execution_id'] != before['control'][0]['execution_id'], (name, case, r)
        assert r['issue_number'] is None and r['started_at']
    if not expected_error:
        assert result.get('status') == 'released' and result.get('outcome') == ('success' if case == 'G02' else 'no_work'), result
    if effect_delta:
        assert after['effects'][-1]['case_id'] == 'G05-' + name + '-' + r['execution_id'], after
    event('PASS', workflow=name, case=case, http=status, response=result,
          before=before, after=after, expected_error=expected_error)
    if expected_busy:
        skip_all(name + ' ' + case + ' failure hold', include=name if case == 'G05' else None)
    return after


def malformed(name, variant):
    original = idle('Inspect previous case; prepare ' + name + ' G06 ' + variant)
    if variant == 'missing':
        fixture('delete', 'G06 missing-row fixture; disposable isolated row only', original)
    elif variant in ('duplicate', 'extra_key'):
        fixture('insert', 'G06 extra-row fixture', values={**original, 'key': 'other' if variant == 'extra_key' else 'global'})
    else:
        patch = {'key': 'wrong'} if variant == 'wrong_key' else {'issue_number': 0}
        fixture('update', 'G06 malformed-row fixture', original, {**original, **patch})
    before = state()
    status, result = request(name, {'case': 'G06'})
    after = state()
    assert status >= 400 and after == before, (name, variant, status, result, after)
    event('PASS', workflow=name, case='G06-' + variant, http=status, response=result,
          before=before, after=after)
    # Explicit test fixture repair after recording exact observed state, never automatic finally.
    if variant == 'missing':
        fixture('insert', 'Observed expected missing-row rejection; restore known isolated singleton', values=original)
    elif variant in ('duplicate', 'extra_key'):
        extra = [r for r in after['control'] if r['id'] != original['id']]
        assert len(extra) == 1
        fixture('delete', 'Observed expected extra-row rejection; remove only inserted fixture row', extra[0])
    else:
        fixture('update', 'Observed expected invalid-row rejection; restore inspected values', after['control'][0], original)
    assert row()['busy'] is False


def held_fixture(name, issue):
    old = idle('Prepare explicit G03 pre-held fixture')
    values = dict(key='global', busy=True, execution_id='held-fixture-' + str(issue),
                  issue_number=issue, started_at='2026-11-24T10:00:00.000Z')
    fixture('update', 'G03 pre-held fixture; no expiry/reset permitted', old, values)
    before = state()
    status, result = request(name, {'case': 'G03'})
    assert status == 200 and result.get('status') == 'skipped_held' and state() == before
    event('PASS', case='G03', workflow=name, issue_number=issue, response=result, state=before)


def crash(name):
    idle('Inspect previous hold; prepare controlled G14 in-flight restart for ' + name)
    before = state()
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(request, name, {'case': 'G14_DELAY'}, 50)
        # Main server serializes webhook executions, so a state webhook cannot observe the
        # held row while the delayed request occupies the slot. After restart, persisted busy
        # plus interrupted HTTP response establishes that acquisition preceded termination.
        time.sleep(3)
        assert not future.done(), 'Delay did not remain in flight; stop before restart'
        result = subprocess.run(['docker', 'restart', '-t', '1', 'factory-guard-test'],
                                capture_output=True, text=True, timeout=20)
        assert result.returncode == 0, result.stderr
        try:
            response = future.result(timeout=10)
        except Exception as exc:
            response = dict(interrupted=type(exc).__name__, message=str(exc)[:200])
    for attempt in range(20):
        try:
            after = state()
            break
        except (OSError, AssertionError):
            time.sleep(1)
    else:
        raise AssertionError('Test n8n did not become ready after restart')
    assert len(after['control']) == 1 and after['control'][0]['busy'] is True, after
    assert after['control'][0]['execution_id'] != before['control'][0]['execution_id'], after
    assert after['effects'] == before['effects']
    event('PASS', case='G14-inflight-restart', workflow=name, interrupted_response=response,
          before=before, after=after)
    skip_all('After ' + name + ' acquired execution interrupted by container restart')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=['inspect', 'pilot', 'faults', 'rows', 'restart', 'schedules'])
    args = parser.parse_args()
    event('initial_state', stage=args.stage, state=state())
    if args.stage == 'inspect':
        return
    if args.stage == 'pilot':
        skip_all('Inspect inherited owner-test hold before any deliberate reset')
        test_case('reserve', 'G05', True, 1)
        return
    if args.stage == 'faults':
        skip_all('Repeat exact reserve G05 request under its inspected pilot hold', include='reserve')
        for name in WORKFLOWS:
            # G01/G02 are bridge smoke checks, distinct from completed original manual tests.
            for case in ('G01', 'G02', 'G07', 'G08', 'G09', 'G10', 'G11', 'G12', 'G13', 'G16'):
                test_case(name, case, case in ('G08', 'G09', 'G10', 'G11', 'G16'))
            if name != 'reserve':
                test_case(name, 'G05', True, 1)
    elif args.stage == 'rows':
        for name in WORKFLOWS:
            for issue in (101, None):
                held_fixture(name, issue)
            for variant in ('duplicate', 'extra_key', 'wrong_key', 'invalid_issue', 'missing'):
                malformed(name, variant)
    elif args.stage == 'restart':
        for name in WORKFLOWS:
            crash(name)
    elif args.stage == 'schedules':
        ids = {'refine':'Gussyro70lhzF3WT', 'reserve':'NdYJRhC6UWLHW8Vb', 'track':'CEGJ4lmhzku75vUr'}
        for name, workflow_id in ids.items():
            old = idle('Inspect completed fault/restart test; prepare original isolated schedule ' + name)
            result = subprocess.run(['docker','exec','-u','node','factory-guard-test','n8n',
                'publish:workflow','--id=' + workflow_id], capture_output=True, text=True, timeout=30)
            assert result.returncode == 0, result.stderr + result.stdout
            event('schedule_published', workflow=name, workflow_id=workflow_id)
            deadline = time.monotonic() + 110
            while time.monotonic() < deadline:
                observed = row()
                if observed['execution_id'] != old['execution_id']:
                    assert observed['busy'] is False, observed
                    break
                time.sleep(2)
            else:
                raise AssertionError('Original schedule did not complete a no-work poll for ' + name)
            event('PASS', case='schedule-no-work', workflow=name, workflow_id=workflow_id, after_control=observed)
            fixture('update', 'Original isolated schedule held-entry fixture', observed, {**observed,'busy':True})
            held = state()
            # Wait over one unchanged 60-second interval; no manual mutating run during schedule.
            started = time.monotonic()
            while time.monotonic() - started < 65:
                time.sleep(5)
                assert state() == held, 'Original held schedule changed row/effect state'
            result = subprocess.run(['docker','exec','-u','node','factory-guard-test','n8n',
                'unpublish:workflow','--id=' + workflow_id], capture_output=True, text=True, timeout=30)
            assert result.returncode == 0, result.stderr + result.stdout
            # Publication service refreshes registrations on a 15-second interval. Drain before
            # the next original is enabled; held row protects any final already-queued poll.
            time.sleep(16)
            assert state() == held
            event('PASS', case='schedule-held-window', workflow=name, workflow_id=workflow_id,
                  state=held, observation_seconds=65, note='Native execution trace still required to identify scheduled skipped execution')
            event('schedule_unpublished', workflow=name, workflow_id=workflow_id)

    event('stage_complete', stage=args.stage, state=state())


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        event('STOP_UNEXPECTED', error=type(exc).__name__, detail=str(exc))
        raise
