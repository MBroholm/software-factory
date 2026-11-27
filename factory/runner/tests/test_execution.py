import tempfile
import unittest
from pathlib import Path
from support import payload, outcome, Clock, Services, GitHub, Git, Codex
from factory_runner.contracts import attempt_uuid
from factory_runner.ledger import Ledger, Conflict
from factory_runner.worker import Worker
from factory_runner.results import validate_outcome

class Execution(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.clock=Clock(); self.ledger=Ledger(Path(self.tmp.name)/'db',self.clock)
        self.p=payload(); self.id=attempt_uuid(self.p); self.ledger.reserve(self.id,self.p)
        self.ledger.accept(self.id,{'generation':1,'building':{'issue_number':1,'state':'Building','source_digest':self.p['source']['source_digest'],'marker_comment_id':77}})
        self.services=Services(); self.gh=GitHub(self.p); self.git=Git(); self.agent=Codex(outcome())
        self.worker=Worker(self.ledger,self.gh,self.git,self.agent,self.services)
    def test_success_and_exactly_one_claim(self):
        self.worker.dispatch(self.id); self.worker.run(self.id)
        a=self.ledger.get(self.id); self.assertEqual(a['result']['outcome'],'done')
        self.assertEqual(a['result']['pushed_sha'],'b'*40)
        self.assertIn(self.p['specification'],self.agent.prompts[0])
        self.assertEqual(a['result']['checks'][0]['tested_revision'],'b'*40)
        with self.assertRaises(Conflict): self.worker.run(self.id)
        self.assertEqual(len(self.agent.prompts),1)
        self.assertEqual(len(self.services.starts),1)
    def test_stale_source_prevents_agent(self):
        self.gh.valid=False; self.worker.dispatch(self.id); self.worker.run(self.id)
        self.assertEqual(self.agent.prompts,[]); self.assertEqual(self.git.pushes,[])
        self.assertEqual(self.ledger.get(self.id)['result']['outcome'],'stuck')
    def test_changed_before_push(self):
        original=self.agent.run
        def run(*args):
            r=original(*args); self.gh.valid=False; return r
        self.agent.run=run; self.worker.dispatch(self.id); self.worker.run(self.id)
        self.assertFalse(self.git.pushes)
    def test_no_diff_is_stuck(self):
        self.git.diff=False; self.worker.dispatch(self.id); self.worker.run(self.id)
        self.assertEqual(self.ledger.get(self.id)['result']['outcome'],'stuck')
    def test_dispatch_unknown_holds_and_cannot_repeat(self):
        self.services.at='after_dispatch'
        with self.assertRaises(RuntimeError): self.worker.dispatch(self.id)
        with self.assertRaises(Conflict): self.worker.dispatch(self.id)
        self.assertTrue(self.ledger.slot()['hold_reason'])
        self.assertEqual(len(self.services.starts),1)
    def test_outcome_conditions(self):
        for mutate in [lambda r:r.update(question={'text':'why','context':'decision'}),lambda r:r.update(unknown=True),lambda r:r['checks'][0].update(tested_revision=''),lambda r:r.update(summary='')]:
            r=outcome(); mutate(r)
            with self.assertRaises(ValueError): validate_outcome(r)
    def test_release_proof_and_generation(self):
        self.worker.dispatch(self.id); self.worker.run(self.id)
        for kind,content,external in [('pr',{'sha':'b'*40},{'number':3,'sha':'b'*40}),('state',{'state':'Your QA'},{'state':'Your QA','issue_number':1})]:
            self.ledger.effect(self.id,kind,{'phase':'intent','content':content,'external':None})
            self.ledger.effect(self.id,kind,{'phase':'confirmed','content':content,'external':external})
        a=self.ledger.get(self.id)
        body={'generation':2,'stopped_proof':a['result']['stopped_proof'],'publication':{'state':'Your QA','pr_number':3}}
        with self.assertRaises(Conflict): self.ledger.release(self.id,body)
        body['generation']=1; self.ledger.release(self.id,body); self.ledger.release(self.id,body)
        self.assertIsNone(self.ledger.slot()['attempt_id'])
        p=payload(2); self.ledger.reserve(attempt_uuid(p),p)
        with self.assertRaises(Conflict): self.ledger.release(self.id,body)
    def test_malformed_missing_and_nonzero_outcomes_become_stuck(self):
        for invalid in (None,{'outcome':'done'}):
            with self.subTest(invalid=invalid):
                # Each case uses a fresh distinct ledger and authorization.
                p=payload(10 if invalid is None else 11);id=attempt_uuid(p)
                from factory_runner.ledger import Ledger
                ledger=Ledger(Path(self.tmp.name)/(id+'.db'),self.clock);ledger.reserve(id,p)
                ledger.accept(id,{'generation':1,'building':{'issue_number':p['issue_number'],'state':'Building','source_digest':p['source']['source_digest'],'marker_comment_id':77}})
                worker=Worker(ledger,GitHub(p),Git(),Codex(invalid),Services());worker.dispatch(id);worker.run(id)
                self.assertEqual(ledger.get(id)['result']['outcome'],'stuck')
        self.agent.at='before_agent';self.worker.dispatch(self.id);self.worker.run(self.id)
        self.assertEqual(self.ledger.get(self.id)['result']['outcome'],'stuck')
        self.assertFalse(self.git.pushes)
    def test_stopped_evidence_matches_recorded_invocation(self):
        self.services.empty=False;self.worker.dispatch(self.id);self.worker.run(self.id)
        a=self.ledger.get(self.id);self.assertEqual(a['status'],'awaiting_stop')
        self.services.empty=True;proof=self.services.stopped(self.id)
        with self.assertRaises(Conflict):self.ledger.confirm_stopped(self.id,{**proof,'invocation_id':'other'})
        self.ledger.confirm_stopped(self.id,proof)
        a=self.ledger.get(self.id);self.assertEqual(a['status'],'terminal');self.assertEqual(a['result']['stopped_proof'],proof)
