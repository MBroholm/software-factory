"""Named user units; missing invocation/cgroup evidence is unknown, never stopped."""
import os
import subprocess
from pathlib import Path
import uuid
import time

class Services:
    def name(self,id): return f'factory-attempt@{uuid.UUID(id)}.service'
    def command(self,*args):
        remaining=min(5,self.deadline-time.monotonic()) if getattr(self,'deadline',None) else 5
        if remaining<=0:raise TimeoutError('unit observation budget exhausted')
        r=subprocess.run(['systemctl','--user',*args],capture_output=True,text=True,timeout=remaining)
        if r.returncode: raise RuntimeError('user service-manager request failed')
        return r.stdout
    def start(self,id):
        self.command('start',self.name(id))
        return self.identity(id)
    def identity(self,id):
        # Worker runs in that exact invocation; systemctl reads supplement environment evidence.
        values=dict(line.split('=',1) for line in self.command('show',self.name(id),'--property=InvocationID,ActiveState,SubState,ControlGroup,Result').splitlines() if '=' in line)
        invocation=values.get('InvocationID')
        if not invocation: raise RuntimeError('unit invocation unknown')
        return {'unit_name':self.name(id),'boot_id':Path('/proc/sys/kernel/random/boot_id').read_text().strip(),'invocation_id':invocation}
    def stopped(self,id):
        identity=self.identity(id)
        values=dict(line.split('=',1) for line in self.command('show',self.name(id),'--property=ActiveState,SubState,ControlGroup,Result').splitlines() if '=' in line)
        group=values.get('ControlGroup','')
        quiescent=(values.get('ActiveState') in {'inactive','failed'} and values.get('SubState') in {'dead','failed'}) or (values.get('ActiveState')=='active' and values.get('SubState')=='exited')
        empty=not group and quiescent
        if group:
            root=Path('/sys/fs/cgroup')/group.lstrip('/')
            try:
                # cgroup.events populated covers descendants, unlike only checking main PID.
                events=dict(x.split() for x in (root/'cgroup.events').read_text().splitlines())
                empty=events.get('populated')=='0'
            except FileNotFoundError:
                if root.exists(): raise RuntimeError('cgroup population evidence unavailable')
                empty=quiescent
        return {**identity,'cgroup_empty':empty and quiescent}

    def stop(self,id):
        # systemd applies TimeoutStopSec and KillMode to the complete cgroup.
        self.command('stop',self.name(id))
    def observe(self,id):
        identity=self.identity(id)
        values=dict(line.split('=',1) for line in self.command('show',self.name(id),'--property=ActiveState,SubState,ActiveEnterTimestampMonotonic').splitlines() if '=' in line)
        proof=self.stopped(id)
        if any(proof[k]!=identity[k] for k in identity):raise RuntimeError('unit changed during observation')
        quiescent=(values.get('ActiveState') in {'inactive','failed'} and values.get('SubState') in {'dead','failed'}) or (values.get('ActiveState')=='active' and values.get('SubState')=='exited')
        return {**proof,'quiescent':quiescent,'active':not quiescent,'clock_safe':True}

    def verify_drained(self):
        import json
        units=json.loads(self.command('list-units','--all','--plain','--output=json','factory-attempt@*.service'))
        for unit in units:
            name=unit['unit']
            id=name.removeprefix('factory-attempt@').removesuffix('.service')
            observation=self.observe(id)
            if not observation['quiescent'] or not observation['cgroup_empty']:raise RuntimeError('worker remains live or unknown')
        return True
