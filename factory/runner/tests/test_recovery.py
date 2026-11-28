import tempfile
import unittest
from pathlib import Path
from support import payload, outcome, Clock, GitHub, Git, Codex, Services
from factory_runner.ledger import Ledger, Conflict
from factory_runner.contracts import attempt_uuid
from factory_runner.worker import Worker
from factory_runner.reconciler import Reconciler

class Recovery(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.clock=Clock();self.l=Ledger(Path(self.tmp.name)/'db',self.clock)
        self.p=payload();self.id=attempt_uuid(self.p);self.l.reserve(self.id,self.p)
        self.s=Services();self.w=Worker(self.l,GitHub(self.p),Git(),Codex(outcome()),self.s)
        self.r=Reconciler(self.l,self.s,self.w.git)
    def accept(self):
        self.l.accept(self.id,{'generation':1,'building':{'issue_number':1,'state':'Building','source_digest':self.p['source']['source_digest'],'marker_comment_id':77}})
    def observation(self,empty=False):
        self.s.observe=lambda id:{**self.s.stopped(id),'cgroup_empty':empty,'quiescent':empty,'active':not empty,'clock_safe':True}
    def test_reserved_and_accepted_restart_never_dispatch(self):
        self.r.reconcile();self.accept();self.r.reconcile()
        self.assertFalse(self.s.starts);self.assertTrue(self.l.slot()['attempt_id'])
        self.assertEqual(self.l.get(self.id)['result']['outcome'],'stuck')
    def test_live_deadline_unchanged(self):
        self.accept();self.w.dispatch(self.id);self.observation(False)
        self.l.claim_worker(self.id,self.s.stopped(self.id));deadline=self.l.get(self.id)['deadline']
        self.clock.advance(30);self.r.reconcile()
        self.assertEqual(self.l.get(self.id)['deadline'],deadline);self.assertIsNone(self.l.get(self.id)['result'])
    def test_interrupted_and_delivered_results(self):
        self.accept();self.w.dispatch(self.id);self.l.claim_worker(self.id,self.s.stopped(self.id));self.observation(True)
        self.r.reconcile();a=self.l.get(self.id)
        self.assertEqual(a['result']['outcome'],'stuck');self.assertEqual(a['status'],'terminal')
        self.r.reconcile();self.assertEqual(a['result'],self.l.get(self.id)['result'])
    def test_unknown_and_reused_identity_hold(self):
        self.accept();self.w.dispatch(self.id)
        self.s.observe=lambda id:{**self.s.stopped(id),'invocation_id':'reused','cgroup_empty':True,'quiescent':True}
        self.r.reconcile();self.assertTrue(self.l.slot()['hold_reason']);self.assertIsNone(self.l.get(self.id)['result'])
    def test_lost_dispatch_ack_reconciles_exact_unit(self):
        self.accept();self.s.at='after_dispatch'
        with self.assertRaises(RuntimeError):self.w.dispatch(self.id)
        self.observation(True);self.r.reconcile()
        self.assertEqual(len(self.s.starts),1);self.assertEqual(self.l.get(self.id)['status'],'terminal')
    def test_unknown_push_outage_cannot_release(self):
        self.accept();self.w.dispatch(self.id);self.w.git.at='after_push';self.w.run(self.id)
        self.observation(True);self.r.reconcile()
        self.assertTrue(self.l.slot()['hold_reason']);self.assertEqual(len(self.w.git.pushes),1)
    def test_missing_unit_and_clock_uncertainty_hold(self):
        self.accept();self.w.dispatch(self.id)
        def unavailable(id):raise RuntimeError('manager unavailable')
        self.s.observe=unavailable;self.r.reconcile();self.assertTrue(self.l.slot()['hold_reason'])
        self.observation(False);observe=self.s.observe
        self.s.observe=lambda id:{**observe(id),'clock_safe':False}
        self.r.reconcile();self.assertTrue(self.l.slot()['hold_reason'])

    def test_api_restart_lost_acceptance_and_result_remain_stable(self):
        self.accept();self.w.dispatch(self.id);self.w.run(self.id)
        original=self.l.get(self.id)
        restarted=Ledger(self.l.path,self.clock);r=Reconciler(restarted,self.s,self.w.git)
        r.reconcile();self.assertEqual(restarted.get(self.id)['result'],original['result'])
        with self.assertRaises(Conflict):self.w.dispatch(self.id)
    def test_dispatch_reconciliation_cannot_finish_a_racing_worker(self):
        self.accept()
        original=self.l.finish
        def race(*args,**kwargs):
            self.w.dispatch(self.id)
            return original(*args,**kwargs)
        self.l.finish=race;self.r.reconcile()
        self.assertEqual(self.l.get(self.id)['status'],'dispatching')
        self.assertIsNone(self.l.get(self.id)['result']);self.assertTrue(self.l.slot()['hold_reason'])
    def test_retry_failure_comment_must_match_durable_body_and_identity(self):
        from factory_runner.github import GitHub as CurrentGitHub
        from types import SimpleNamespace
        comment={'id':8,'body':'trusted failure','user':{'id':7},'created_at':'2026-11-27T09:00:00Z','updated_at':'2026-11-27T09:00:00Z'}
        prior={'effects':[{'kind':'comment','status':'confirmed','content':{'body':'trusted failure'},'external':{'comment_id':8}}]}
        gh=CurrentGitHub(SimpleNamespace(owner_id=7),lambda path:[comment])
        gh.verify_retry(prior,self.p)
        comment['body']='edited failure'
        with self.assertRaises(ValueError):gh.verify_retry(prior,self.p)
