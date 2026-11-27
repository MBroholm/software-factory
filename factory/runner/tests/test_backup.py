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
