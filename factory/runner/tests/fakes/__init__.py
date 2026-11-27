"""Deterministic external adapters. Never contact live services."""
from copy import deepcopy

class Clock:
    def __init__(self): self.value = 1800000000.0
    def __call__(self): return self.value
    def advance(self, seconds): self.value += seconds

class Faults:
    def __init__(self): self.at = None
    def hit(self, boundary):
        if self.at == boundary: raise RuntimeError('injected ' + boundary)

class Services(Faults):
    def __init__(self):
        super().__init__(); self.starts = []; self.empty = True
    def start(self, attempt):
        self.hit('before_dispatch'); self.starts.append(attempt); self.hit('after_dispatch')
        return {'boot_id':'fake-boot','invocation_id':'fake-invocation','unit_name':f'factory-attempt@{attempt}.service'}
    def stopped(self, attempt):
        return {'unit_name':f'factory-attempt@{attempt}.service','boot_id':'fake-boot',
                'invocation_id':'fake-invocation','cgroup_empty':self.empty}

class GitHub(Faults):
    def __init__(self, payload): super().__init__(); self.payload=deepcopy(payload); self.valid=True; self.reads=0
    def verify(self, payload, building=True, marker_id=None):
        self.reads+=1; self.hit('before_source_read')
        if not self.valid or payload != self.payload: raise RuntimeError('current issue/source changed')
        self.hit('after_source_read'); return True

class Codex(Faults):
    def __init__(self, result): super().__init__(); self.result=result; self.prompts=[]
    def run(self, prompt, path, attempt):
        self.hit('before_agent'); self.prompts.append(prompt); self.hit('after_agent')
        return deepcopy(self.result)

class Git(Faults):
    def __init__(self): super().__init__(); self.pushes=[]; self.diff=True
    def prepare(self, payload, attempt): return '/fake/worktree'
    def snapshot(self, payload, attempt): return {'task':{'repository':payload['repository'],'issue_number':payload['issue_number']},'predecessor':payload['predecessor'],'branch':payload['branch'],'base_sha':payload['base_sha'],'head_sha':'b'*40,'status_hash':'c'*64,'patch_hash':'d'*64,'artifacts':[]}
    def push(self, payload, attempt, manifest):
        self.hit('before_push')
        if not self.diff: raise RuntimeError('no diff')
        self.pushes.append(attempt); self.hit('after_push'); return manifest['head_sha']
