import concurrent.futures
import tempfile
import time
import unittest
from pathlib import Path
from support import payload, Clock
from factory_runner.contracts import attempt_uuid
from factory_runner.ledger import Ledger, Conflict
from factory_runner.api import create_app
from support import ASGIClient

class LedgerAPI(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/'ledger.db'; self.clock=Clock()
        self.ledger=Ledger(self.path, self.clock)
        self.p=payload(); self.id=attempt_uuid(self.p); self.calls=[]
        self.client=ASGIClient(create_app(self.ledger,'x'*32,'test/fixture',7,{'test'},self.calls.append))
        self.headers={'Authorization':'Bearer '+'x'*32}
    def req(self,method,path,body=None,headers=None):
        return self.client.request(method,'/v1/'+path,json=body,headers=self.headers if headers is None else headers)
    def reserve(self): return self.req('PUT',f'attempts/{self.id}/reservation',self.p)
    def test_auth_including_reads(self):
        for method,path in [('GET','health'),('GET','slot'),('GET','questions'),('PUT',f'attempts/{self.id}/answer'),('GET',f'attempts/{self.id}'),('PUT',f'attempts/{self.id}/reservation')]:
            for h in ({},{'Authorization':'Bearer wrong'}):
                self.assertEqual(self.req(method,path,self.p if method=='PUT' else None,h).status_code,401)
    def test_replay_and_payload_conflicts(self):
        self.assertEqual(self.reserve().status_code,201)
        self.assertEqual(self.reserve().status_code,200)
        self.p['specification']+='edited'
        self.assertEqual(self.reserve().status_code,422)
        self.assertEqual(self.req('GET','attempts/nope').status_code,422)
        self.assertEqual(self.req('GET','attempts/00000000-0000-0000-0000-000000000000').status_code,404)
    def test_singleton_concurrent_and_restart(self):
        def claim(n):
            p=payload(n)
            try: return Ledger(self.path,self.clock).reserve(attempt_uuid(p),p)[0]
            except Conflict: return 409
        with concurrent.futures.ThreadPoolExecutor(8) as pool: results=list(pool.map(claim,range(1,9)))
        self.assertEqual(results.count(201),1)
        self.assertEqual(results.count(409),7)
        self.assertIsNotNone(Ledger(self.path).slot()['attempt_id'])
    def test_accept_commits_and_single_dispatch(self):
        self.reserve(); start={'generation':1,'building':{'issue_number':1,'state':'Building','source_digest':self.p['source']['source_digest'],'marker_comment_id':77}}
        begin=time.monotonic(); self.assertEqual(self.req('POST',f'attempts/{self.id}/start',start).status_code,202)
        self.assertLess(time.monotonic()-begin,2)
        self.assertEqual(self.req('POST',f'attempts/{self.id}/start',start).status_code,200)
        self.assertEqual(len(self.calls),1)
        self.assertEqual(Ledger(self.path).get(self.id)['status'],'accepted')
        start['generation']=2
        self.assertEqual(self.req('POST',f'attempts/{self.id}/start',start).status_code,409)
    def test_journal_and_safe_release(self):
        self.reserve()
        effect={'phase':'intent','content':{'body':'review'},'external':None}
        uri=f'attempts/{self.id}/effects/pr'
        self.assertEqual(self.req('PUT',uri,effect).status_code,200)
        self.assertEqual(self.req('PUT',uri,effect).status_code,200)
        release={'generation':1,'stopped_proof':{'cgroup_empty':True},'publication':{'state':'Your QA'}}
        self.assertEqual(self.req('POST',f'attempts/{self.id}/release',release).status_code,409)
        effect['phase']='confirmed'; effect['external']={'number':1,'sha':'b'*40}
        self.assertEqual(self.req('PUT',uri,effect).status_code,200)
        effect['external']['number']=2
        self.assertEqual(self.req('PUT',uri,effect).status_code,409)
        self.assertTrue(self.ledger.slot()['hold_reason'])
    def test_limits_overrides_and_cancel(self):
        self.p['command']='whoami'; self.assertEqual(self.reserve().status_code,422)
        self.assertEqual(self.req('PUT',f'attempts/{self.id}/reservation',{'huge':'z'*262145}).status_code,413)
        del self.p['command']; self.reserve()
        uri=f'attempts/{self.id}/cancellation'; b={'reason':'closed','closure_reference':'issue:1:closed'}
        self.assertEqual(self.req('PUT',uri,b).status_code,202)
        self.assertEqual(self.req('PUT',uri,b).status_code,200)
        self.assertEqual(self.req('GET','health').status_code,503)
        self.assertEqual(self.req('GET',f'attempts/{self.id}').json()['cancellation'],b)
    def test_changed_valid_payload_same_id_conflicts(self):
        from factory_runner.contracts import digest
        self.reserve();self.p['specification']='Different valid scope';self.p['source']['specification_digest']=digest(self.p['specification'])
        self.assertEqual(self.reserve().status_code,409)
        self.assertNotEqual(self.ledger.get(self.id)['payload']['specification'],self.p['specification'])
    def test_confirmed_intent_replay_and_unknown_reconciliation(self):
        self.reserve();uri=f'attempts/{self.id}/effects/pr';content={'body':'review'}
        for phase,external in [('intent',None),('unknown',None),('confirmed',{'number':3,'sha':'b'*40}),('intent',None)]:
            self.assertEqual(self.req('PUT',uri,{'phase':phase,'content':content,'external':external}).status_code,200)
        self.assertIsNone(self.ledger.slot()['hold_reason'])
        self.assertEqual(self.ledger.get(self.id)['effects'][0]['status'],'confirmed')
    def test_start_must_match_building_and_release_proof_cannot_be_invented(self):
        self.reserve()
        self.assertEqual(self.req('POST',f'attempts/{self.id}/start',{'generation':1,'building':{'issue_number':2,'state':'Building','source_digest':'c'*64,'marker_comment_id':77}}).status_code,409)
        self.assertEqual(self.req('POST',f'attempts/{self.id}/start',{'generation':1,'building':{'issue_number':1,'state':'Approved','source_digest':'c'*64,'marker_comment_id':77}}).status_code,422)
        self.assertEqual(self.req('POST',f'attempts/{self.id}/release',{'generation':1,'stopped_proof':{'cgroup_empty':True},'publication':{'state':'Your QA','pr_number':3}}).status_code,409)
