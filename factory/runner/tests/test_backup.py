import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from support import payload
from factory_runner.ledger import Ledger,Conflict
from factory_runner.contracts import attempt_uuid
from factory_runner.recovery import Recovery

class Backup(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.work=self.root/'work';self.work.mkdir();(self.work/'retained').write_text('partial')
        self.checkout=self.root/'checkout';self.checkout.mkdir();(self.checkout/'source').write_text('source')
        self.l=Ledger(self.root/'db');self.c=SimpleNamespace(work_root=self.work,checkout=self.checkout,database=self.root/'db',repository='test/fixture')
        self.r=Recovery(self.l,self.c,None)
    def test_reconcile_legacy_unissued_push_keeps_original_effect(self):
        p = payload()
        self.c.repository = p['repository']
        attempt = attempt_uuid(p)
        self.l.reserve(attempt, p)
        with self.l.tx() as c:
            c.execute("UPDATE attempts SET status='terminal', result=? WHERE id=?", (json.dumps({
                'outcome':'stuck', 'stuck_reason':'RuntimeError: done left uncommitted work; retained',
                'stopped_proof':{'cgroup_empty':True}, 'pushed_sha':None}), attempt))
        effect = {'sha':p['base_sha'], 'head':p['branch'], 'base':'main'}
        for phase in ('intent', 'unknown'):
            self.l.effect(attempt, 'push', {'phase':phase, 'content':effect, 'external':None})
        remote = ['unexpected ref']
        git = SimpleNamespace(run=lambda args, **kw:
            f"https://github.com/{p['repository']}.git" if args[0] == 'remote' else remote[0])
        self.r.reconciler = SimpleNamespace(git=git, services=SimpleNamespace(verify_drained=lambda:True))

        with self.assertRaisesRegex(Conflict, 'paused'):
            self.r.reconcile_unissued_push(attempt, 'owner decision')
        self.r.pause()
        with self.assertRaisesRegex(Conflict, 'branch exists'):
            self.r.reconcile_unissued_push(attempt, 'owner decision')
        self.assertEqual(self.l.slot()['hold_reason'], 'unknown effect: push')
        remote[0] = ''
        self.assertEqual(self.r.reconcile_unissued_push(attempt, 'owner decision')['push'], 'not_issued')
        self.assertEqual(self.l.slot()['attempt_id'], attempt)
        self.assertIsNone(self.l.slot()['hold_reason'])
        self.assertEqual(self.l.get(attempt)['effects'][0]['external'], {'outcome':'not_issued'})
        with self.l.connect() as c:
            audit = json.loads(c.execute('SELECT evidence FROM push_recovery WHERE attempt_id=?',
                                         (attempt,)).fetchone()[0])
        self.assertEqual(audit['original_effect']['status'], 'unknown')
        self.assertEqual(audit['owner_record'], 'owner decision')

    def test_pause_blocks_reservation_and_unpaused_backup(self):
        with self.assertRaises(Conflict):self.r.backup(self.root/'bundle')
        self.r.pause();p=payload()
        with self.assertRaises(Conflict):self.l.reserve(attempt_uuid(p),p)
    def test_active_slot_refuses_backup(self):
        p=payload();self.l.reserve(attempt_uuid(p),p);self.r.pause()
        with self.assertRaises(Conflict):self.r.backup(self.root/'bundle')
    def test_bundle_contains_history_work_and_checkout_and_tamper_refused(self):
        self.r.pause();self.r.backup(self.root/'bundle')
        self.assertEqual((self.root/'bundle/work/retained').read_text(),'partial')
        self.assertEqual((self.root/'bundle/checkout/source').read_text(),'source')
        (self.root/'bundle/work/retained').write_text('tampered')
        with self.assertRaises(Conflict):self.r.restore(self.root/'bundle','owner test recovery')
    def test_stale_restore_refused(self):
        self.r.pause();self.r.backup(self.root/'bundle')
        with self.l.tx() as c:c.execute('UPDATE control SET paused=0 WHERE id=1')
        p=payload();self.l.reserve(attempt_uuid(p),p);self.r.pause()
        with self.assertRaises(Conflict):self.r.restore(self.root/'bundle','owner test recovery')

    def test_coherent_restore_keeps_paused_history_and_restores_original_paths(self):
        self.r.pause();self.r.backup(self.root/'bundle')
        self.work.rename(self.root/'retained-work');self.checkout.rename(self.root/'retained-checkout')
        report=self.r.restore(self.root/'bundle','owner fixture: stopped, effects reconciled, original directories retained')
        self.assertTrue(report['paused']);self.assertEqual((self.work/'retained').read_text(),'partial')
        self.assertEqual((self.checkout/'source').read_text(),'source')
    def test_backup_rejects_recursive_destination_and_resume_is_explicit(self):
        self.r.pause()
        with self.assertRaises(ValueError):self.r.backup(self.work/'bundle')
        self.r.resume();p=payload();self.l.reserve(attempt_uuid(p),p)
        with self.assertRaises(Conflict):self.r.resume()
