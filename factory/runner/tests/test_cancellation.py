from test_recovery import Recovery
from factory_runner.ledger import Conflict

class Cancellation(Recovery):
    def test_before_dispatch_suppresses_start(self):
        self.accept();self.l.cancel(self.id,{'reason':'issue closed','closure_reference':'issue:1:closed'})
        self.r.reconcile()
        with self.assertRaises(Conflict):self.w.dispatch(self.id)
        self.assertFalse(self.s.starts);self.assertTrue(self.l.get(self.id)['result']['stopped_proof'])
    def test_active_cancel_requires_empty_tree(self):
        self.accept();self.w.dispatch(self.id);self.l.claim_worker(self.id,self.s.stopped(self.id))
        self.l.cancel(self.id,{'reason':'issue closed','closure_reference':'issue:1:closed'})
        calls=[];self.s.stop=lambda id:calls.append(id);self.observation(False)
        self.r.reconcile();self.assertEqual(calls,[self.id]);self.assertIsNone(self.l.get(self.id)['result'])
        self.observation(True);self.r.reconcile();self.assertTrue(self.l.get(self.id)['result']['cancelled'])
    def test_expired_worker_stops_without_new_deadline(self):
        self.accept();self.w.dispatch(self.id);self.l.claim_worker(self.id,self.s.stopped(self.id));self.observation(False)
        calls=[];self.s.stop=lambda id:calls.append(id);self.clock.advance(1800);self.r.reconcile()
        self.assertEqual(calls,[self.id]);self.assertIsNone(self.l.get(self.id)['result'])
    def test_cancellation_observed_after_agent_prevents_push(self):
        self.accept()
        original=self.w.codex.run
        def run(*args):
            result=original(*args)
            self.l.cancel(self.id,{'reason':'issue closed','closure_reference':'issue:1:closed'})
            return result
        self.w.codex.run=run;self.w.dispatch(self.id);self.w.run(self.id)
        self.assertFalse(self.w.git.pushes);self.assertTrue(self.l.get(self.id)['result']['cancelled'])
