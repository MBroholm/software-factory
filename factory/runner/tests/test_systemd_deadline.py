"""Fast policy check plus explicit isolated Ubuntu 30-minute descendant exercise."""
import os
import platform
import subprocess
import time
import unittest
import uuid
from pathlib import Path

class Deadline(unittest.TestCase):
    def test_worker_policy_independent_of_api(self):
        text=(Path(__file__).parents[1]/'systemd/factory-attempt@.service').read_text()
        for line in ('Type=exec','RuntimeMaxSec=1795s','TimeoutStopSec=5s','KillMode=control-group','SendSIGKILL=yes','Restart=no'):
            self.assertIn(line,text.splitlines())
    @unittest.skipUnless(os.environ.get('FACTORY_ISOLATED_DEADLINE_TEST')=='yes','requires explicit isolated Ubuntu user-manager opt-in; takes 30 minutes')
    def test_actual_descendant_lifetime(self):
        self.assertEqual(platform.freedesktop_os_release().get('ID'),'ubuntu')
        self.assertNotEqual(os.getuid(),0)
        unit='factory-deadline-test-'+uuid.uuid4().hex
        start=time.monotonic()
        subprocess.run(['systemd-run','--user','--unit='+unit,'--property=Type=exec','--property=RuntimeMaxSec=1795s','--property=TimeoutStopSec=5s','--property=KillMode=control-group','--property=SendSIGKILL=yes','--property=Restart=no','/bin/sh','-c','sleep 3600 & wait'],check=True,capture_output=True)
        try:
            group=subprocess.check_output(['systemctl','--user','show',unit,'--property=ControlGroup','--value'],text=True).strip()
            self.assertTrue(group)
            root=Path('/sys/fs/cgroup')/group.lstrip('/')
            while time.monotonic()-start<1810:
                if not root.exists() or 'populated 0' in (root/'cgroup.events').read_text():break
                time.sleep(1)
            elapsed=time.monotonic()-start
            self.assertLessEqual(elapsed,1801,'elapsed lifetime exceeded budget (including observation tolerance)')
            self.assertGreater(elapsed,1790)
            print('isolated actual descendant lifetime seconds:',elapsed)
        finally:subprocess.run(['systemctl','--user','stop',unit],capture_output=True,timeout=10)
