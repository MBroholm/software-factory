"""Attributable worktrees and non-forced transport. Never discard unknown work."""
import hashlib
import json
import os
import subprocess
import time
from pathlib import Path
from .contracts import canonical, digest

class Git:
    def __init__(self,config): self.config=config
    def env(self,transport=False):
        e={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':str(self.config.work_root),'LANG':'C.UTF-8','GIT_TERMINAL_PROMPT':'0',
           'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'credential.helper','GIT_CONFIG_VALUE_0':str(self.config.git_helper) if transport else ''}
        return e
    def run(self,args,path=None,transport=False,check=True):
        remaining=min(60,self.deadline-time.monotonic()) if getattr(self,'deadline',None) else 60
        if remaining<=0:raise TimeoutError('Git observation budget exhausted')
        r=subprocess.run(['git',*args],cwd=path or self.config.checkout,env=self.env(transport),capture_output=True,timeout=remaining)
        if check and r.returncode: raise RuntimeError('Git operation failed: '+args[0])
        return r.stdout.decode('utf-8',errors='strict').rstrip('\n')
    def path(self,p): return self.config.work_root/'tasks'/str(p['issue_number'])
    def prepare(self,p,attempt):
        origin=self.run(['remote','get-url','origin'])
        if origin!='https://github.com/'+p['repository']+'.git': raise RuntimeError('unexpected Git remote')
        if self.run(['status','--porcelain']): raise RuntimeError('dedicated checkout has unknown dirty work')
        self.run(['fetch','--no-tags','origin','main'],transport=True)
        if p['predecessor']:
            self.run(['merge-base','--is-ancestor',p['base_sha'],'FETCH_HEAD'])
        elif self.run(['rev-parse','FETCH_HEAD'])!=p['base_sha']: raise RuntimeError('base moved; fresh approval snapshot required')
        path=self.path(p); path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        private=self.config.work_root/'manifests'; private.mkdir(exist_ok=True,mode=0o700)
        if p['predecessor']:
            manifest=p['manifest']
            previous=json.loads((private/(p['predecessor']+'.json')).read_text())
            if previous['attempt']!=p['predecessor'] or previous['repository']!=p['repository'] or previous['task']!=p['issue_number'] or not path.is_dir():
                raise RuntimeError('missing attributable predecessor work')
            observed=self.snapshot({**p,'predecessor':manifest['predecessor']},p['predecessor'],persist=False)
            if observed!=manifest: raise RuntimeError('partial work changed after stopped snapshot; owner recovery required')
            self.run(['merge-base','--is-ancestor',p['base_sha'],manifest['head_sha']],path)
            if self.run(['ls-remote','--heads','origin','refs/heads/'+p['branch']],path,True):
                raise RuntimeError('question branch unexpectedly published; owner recovery required')
            metadata={**previous,'attempt':attempt,'predecessor':p['predecessor']}
            (private/(attempt+'.json')).write_text(canonical(metadata))
            return path
        if path.exists() or self.run(['show-ref','--verify','refs/heads/'+p['branch']],check=False) or self.run(['ls-remote','--heads','origin','refs/heads/'+p['branch']],transport=True):
            raise RuntimeError('existing branch/worktree requires owner recovery')
        self.run(['worktree','add','-b',p['branch'],str(path),p['base_sha']])
        metadata={'task':p['issue_number'],'repository':p['repository'],'attempt':attempt,'predecessor':p['predecessor'],
                  'branch':p['branch'],'base_sha':p['base_sha']}
        private=self.config.work_root/'manifests'; private.mkdir(exist_ok=True,mode=0o700)
        (private/(attempt+'.json')).write_text(canonical(metadata))
        return path
    def snapshot(self,p,attempt,persist=True):
        path=self.path(p); private=self.config.work_root/'snapshots'/attempt
        meta=json.loads((self.config.work_root/'manifests'/(attempt+'.json')).read_text())
        if meta['attempt']!=attempt or meta['branch']!=p['branch'] or self.run(['branch','--show-current'],path)!=p['branch']: raise RuntimeError('unknown work provenance')
        if persist: private.mkdir(parents=True,exist_ok=True,mode=0o700)
        status=self.run(['status','--porcelain=v1','--untracked-files=all'],path)
        patch=self.run(['diff','--binary','HEAD'],path)
        if persist:
            (private/'status.txt').write_text(status); (private/'changes.patch').write_text(patch)
        # Retain untracked files in the original worktree; manifest records names/hashes, no deletion.
        untracked=self.run(['ls-files','--others','--exclude-standard','-z'],path)
        hashes={}
        for name in filter(None,untracked.split('\0')):
            f=path/name
            if f.is_symlink(): raise RuntimeError('untracked symlink requires owner inspection')
            hashes[name]=hashlib.sha256(f.read_bytes()).hexdigest()
        if persist: (private/'untracked.json').write_text(canonical(hashes))
        elif hashes!=json.loads((private/'untracked.json').read_text()): raise RuntimeError('untracked partial work changed')
        return {'task':{'repository':p['repository'],'issue_number':p['issue_number']},'predecessor':p['predecessor'],'branch':p['branch'],'base_sha':p['base_sha'],'head_sha':self.run(['rev-parse','HEAD'],path),
                'status_hash':digest(status),'patch_hash':digest(patch),'artifacts':[str(private)]}
    def push(self,p,attempt,manifest):
        path=self.path(p)
        if self.run(['remote','get-url','origin'],path)!='https://github.com/'+p['repository']+'.git': raise RuntimeError('remote changed during agent execution')
        if self.run(['branch','--show-current'],path)!=p['branch']: raise RuntimeError('branch changed')
        if self.run(['status','--porcelain'],path): raise RuntimeError('done left uncommitted work; retained')
        head=self.run(['rev-parse','HEAD'],path)
        if head!=manifest['head_sha'] or head==p['base_sha'] or not self.run(['diff','--name-only',p['base_sha'],head],path): raise RuntimeError('no diff or changed head')
        self.run(['merge-base','--is-ancestor',p['base_sha'],head],path)
        if self.run(['ls-remote','--heads','origin','refs/heads/'+p['branch']],path,True): raise RuntimeError('remote branch exists; hold for attribution')
        self.run(['push','origin',head+':refs/heads/'+p['branch']],path,True)
        remote=self.run(['ls-remote','--heads','origin','refs/heads/'+p['branch']],path,True)
        if remote.split()[0]!=head: raise RuntimeError('push readback mismatch')
        return head
