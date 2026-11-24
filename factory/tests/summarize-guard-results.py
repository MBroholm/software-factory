"""Create sanitized, trace-checked evidence from explicit native test runs."""
import collections
import datetime
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCAL = ROOT / 'factory/local/guard-validation'
traces = json.loads((LOCAL / 'native-traces.json').read_text())
by_id = {r['id']: r for r in traces}
output, fixture_count = [], 0


def stamp(value):
    parsed = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=datetime.timezone.utc)


for stage in ('pilot', 'faults', 'rows', 'restart'):
    records = [json.loads(line) for line in (LOCAL / (stage + '.jsonl')).read_text().splitlines()]
    assert not any(r['event'] == 'STOP_UNEXPECTED' for r in records)
    fixture_count += sum(r['event'] == 'operator_fixture' for r in records)
    for record in records:
        if record['event'] != 'PASS':
            continue
        case, workflow = record['case'], record['workflow']
        source_case = 'G06' if case.startswith('G06-') else 'G14_DELAY' if case.startswith('G14-') else case
        trace = None
        if case.startswith('G14-'):
            trace = by_id[record['after']['control'][0]['execution_id']]
            assert trace['status'] == 'crashed', trace
        else:
            candidates = [t for t in traces if t['workflowId'] == '0ITfSwx2Yb69qfX5' and
                          t.get('case') == source_case and
                          t.get('lastNode', '').startswith(workflow + ': ') and
                          0 <= (stamp(record['time']) - stamp(t['startedAt'])).total_seconds() < 30]
            if candidates:
                trace = max(candidates, key=lambda t: stamp(t['startedAt']))
            # For the exact G05 held rerun, skip_all labels its evidence G15.
            if case == 'G15' and (not trace or trace.get('statusOutput') != 'skipped_held'):
                candidates = [t for t in traces if t['workflowId'] == '0ITfSwx2Yb69qfX5' and
                              t.get('statusOutput') == 'skipped_held' and
                              t.get('lastNode', '').startswith(workflow + ': ') and
                              0 <= (stamp(record['time']) - stamp(t['startedAt'])).total_seconds() < 30]
                trace = max(candidates, key=lambda t: stamp(t['startedAt'])) if candidates else None
        assert trace, (stage, case, workflow, 'Missing native trace')
        names = [n['name'] for n in trace['reached']]
        if case == 'G15' or case == 'G03':
            assert trace['status'] == 'success' and trace['statusOutput'] == 'skipped_held', trace
            assert workflow + ': Acquire control' not in names and workflow + ': Release control' not in names
        elif case in ('G01', 'G02'):
            assert trace['status'] == 'success' and trace['statusOutput'] == 'released', trace
        elif case.startswith('G14-'):
            pass
        else:
            assert trace['status'] == 'error', trace
            target = {'G05':'Skeleton work boundary', 'G07':'Acquire control', 'G08':'Check acquire receipt',
                      'G09':'Read acquired control', 'G10':'Require acknowledged completion',
                      'G11':'Release control', 'G12':'Check release receipt', 'G13':'Read released control',
                      'G16':'Verify release ownership'}.get(case, 'Validate entry' if case.startswith('G06-') else None)
            assert trace['lastNode'] == workflow + ': ' + target, trace
            if case not in ('G11','G12','G13'):
                assert workflow + ': Release control' not in names, trace
            if case.startswith('G06-') or case == 'G07':
                assert workflow + ': Skeleton work boundary' not in names
            if case == 'G05':
                assert any(n['name'] == workflow + ': Insert test effect' and n['status'] == 'success'
                           for n in trace['reached']), trace
        item = dict(result='PASS', stage=stage, workflow=workflow, case=case, time=record['time'],
                    execution_id=trace['id'], native_status=trace['status'], workflow_version=trace.get('workflowVersion'), last_node=trace.get('lastNode'),
                    error=trace.get('error'), reached=trace['reached'])
        for key in ('before', 'after', 'state'):
            if key in record:
                snap = record[key]
                item[key + '_control'] = snap['control']
                item[key + '_effect_count'] = len(snap['effects'])
        if 'held_execution' in record:
            item['held_execution'] = record['held_execution']
        output.append(item)

assert len(output) == 130, len(output)
schedules = []
schedule_file = LOCAL / 'schedules.jsonl'
if schedule_file.exists():
    observed = [json.loads(line) for line in schedule_file.read_text().splitlines()]
    if observed[-1]['event'] == 'stage_complete':
        assert not any(r['event']=='STOP_UNEXPECTED' for r in observed)
        fixture_count += sum(r['event']=='operator_fixture' for r in observed)
        for event in observed:
            if event['event'] != 'PASS':
                continue
            workflow, case = event['workflow'], event['case']
            if case == 'schedule-no-work':
                trace = by_id[event['after_control']['execution_id']]
                assert trace['workflowId'] == event['workflow_id'] and trace['mode'] == 'trigger'
                assert trace['status'] == 'success' and trace['statusOutput'] == 'released'
                assert trace['control']['busy'] is False
            else:
                held = event['state']['control'][0]
                successful = [t for t in traces if t['workflowId']==event['workflow_id'] and
                              t['mode']=='trigger' and t['status']=='success' and
                              t.get('statusOutput')=='skipped_held' and
                              t.get('control',{}).get('execution_id')==held['execution_id'] and
                              stamp(t['startedAt']) < stamp(event['time'])]
                assert successful, (workflow, 'No native scheduled held-exit trace')
                trace = max(successful, key=lambda t:stamp(t['startedAt']))
                assert all(trace['control'][key]==held[key] for key in ('key','busy','execution_id','issue_number','started_at'))
                assert 'Acquire control' not in [n['name'] for n in trace['reached']]
                assert 'Release control' not in [n['name'] for n in trace['reached']]
            schedules.append(dict(workflow=workflow,case=case,result='PASS',execution_id=trace['id'],
                                  workflow_id=trace['workflowId'],workflow_version=trace.get('workflowVersion'),
                                  native_mode=trace['mode'],native_status=trace['status'],
                                  last_node=trace['lastNode'],control=trace['control'],reached=trace['reached']))
        assert len(schedules)==6
counts = collections.Counter(r['case'] for r in output)
report = dict(bridge_id='0ITfSwx2Yb69qfX5', bridge_version='2c36bf8c-6531-4ec4-bc77-4402ba3b8d83',
              source='Native n8n 2.48.8 HTTP executions and supported execution-history export',
              primary_checks=sum(r['case'] != 'G15' for r in output),
              held_skip_checks=counts['G15'], schedule_checks=len(schedules), schedules=schedules, explicit_fixture_operations=fixture_count,
              counts=dict(counts), checks=output)
closure_file = LOCAL / 'closure.json'
if closure_file.exists():
    closure = json.loads(closure_file.read_text())
    assert closure['bridge_http_after_unpublish'] == 404 and closure['health'] == 200
    assert len(closure['workflows']) == 11 and all(not w['active'] for w in closure['workflows'])
    assert closure['final_state']['control'][0]['busy'] is True
    assert len(closure['final_state']['effects']) == 4
    report['closure'] = closure
metadata = {key: value for key, value in report.items() if key != 'checks'}
serialized = json.dumps(metadata, indent=2)[:-1].rstrip() + ',\n  \"checks\": [\n'
serialized += ',\n'.join('    ' + json.dumps(record, separators=(',', ':')) for record in output)
serialized += '\n  ]\n}\n'
assert json.loads(serialized) == report
(ROOT / 'evidence/guard-bridge-results.json').write_text(serialized)
print(json.dumps({k:v for k,v in report.items() if k not in ('checks','schedules','closure')}, indent=2))
