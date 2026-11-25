"""T031 operator: observe only real scheduled ticks; never start the workflow manually.
Run on NAS after owner manual import/publication. Stops on unexpected state; no finally reset.
"""
import json
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:5679/webhook/basic-a-us1-schedule/'


def event(name, **data):
    print(json.dumps(dict(event=name, at=time.time(), **data)), flush=True)


def request(route, body=None):
    req = urllib.request.Request(BASE+route, data=json.dumps(body).encode() if body else None,
                                 headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        value=json.load(r)
    return value[0] if isinstance(value,list) and len(value)==1 else value


def row():
    r=request('state')['rows']
    assert len(r)==1, r
    return r[0]


def fixture(route='inspect', body=None):
    # Only container loopback; serialized native state webhooks never drive test work.
    options={'method':'POST','headers':{'Content-Type':'application/json'},'body':json.dumps(body)} if body else {}
    code="fetch('http://127.0.0.1:18765/schedule/"+route+"',"+json.dumps(options)+").then(async r=>{if(!r.ok)throw Error(await r.text());process.stdout.write(await r.text())}).catch(e=>{console.error(e);process.exitCode=1})"
    r=subprocess.run(['docker','exec','-u','node','factory-guard-test','node','-e',code],capture_output=True,check=True)
    return json.loads(r.stdout)


def completed(expected_posts, timeout=100):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        s=fixture()
        if s and s['posts']>=expected_posts:
            assert s['posts']==expected_posts, s
            current=row()
            if current['busy'] is False and any(l['name']=='Ready for approval' for l in s['issues'][0]['labels']):
                return s,current
        time.sleep(2)
    raise AssertionError('Scheduled refinement did not complete within observed window')


before=row();event('inspect_before_schedule_test',row=before)
assert not fixture(), 'Session 31001 already exists; inspect it rather than replaying'
if before['busy']:
    assert before['execution_id']=='1218' and before['issue_number']==101, 'Unknown hold; stop for owner'
    # Known cancelled test, explicitly inspected before a new independent test.
    result=request('fixture',dict(id=before['id'],expected_execution_id='1218',reason='Inspected cancelled 1218 hold and retained evidence; owner imported scheduled test; deliberate isolated reset for T031'))
    event('operator_inspected_reset',before=before,response=result)
assert row()['busy'] is False
first,first_row=completed(1)
assert first['generation']==1 and first['count']==1
first_id=first_row['execution_id'];assert first_id!='1218'
assert first['modelBodies']==first['countBodies']
assert len(first['comments']['101'])==1
event('scheduled_initial_refinement',execution=first_id,row=first_row,calls=first['calls'],posts=first['posts'])
revision=fixture('revision',{'reason':'Observed first scheduled refinement Ready with acknowledged idle guard; explicitly add synthetic owner revision for T031'})
event('operator_revision_request',revision=revision)
second,second_row=completed(2)
second_id=second_row['execution_id'];assert second_id!=first_id
assert second['generation']==2 and second['count']==2
assert len(second['comments']['101'])==3
assert second['comments']['101'][0]==first['comments']['101'][0], 'Previous refinement was overwritten'
assert second['comments']['101'][1]['id']==revision['commentId']
assert second['modelBodies']==second['countBodies']
event('scheduled_owner_revision',execution=second_id,row=second_row,posts=second['posts'],comments=second['comments']['101'])
deadline=time.monotonic()+100
while time.monotonic()<deadline:
    s=fixture();current=row()
    if current['execution_id']!=second_id and current['busy'] is False:
        assert s['generation']==2 and s['count']==2 and s['posts']==2
        assert s['comments']==second['comments']
        assert not any(l['name']=='Approved' for l in s['issues'][0]['labels'])
        event('PASS_scheduled_unchanged',execution=current['execution_id'],row=current,session=s)
        break
    time.sleep(2)
else:
    raise AssertionError('Unchanged scheduled poll did not finish')
event('stage_complete',executions=[first_id,second_id,current['execution_id']],next='Unpublish/drain scheduled test, collect native trigger-mode traces and inspect final row. No automatic reset.')
