"""Private config and read-only fail-closed deployment checks."""
import ipaddress
import os
import platform
import re
import shutil
import stat
import subprocess
import tomllib
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class Config:
    repository:str
    owner_id:int
    bind:str
    port:int
    database:Path
    work_root:Path
    checkout:Path
    bearer_file:Path
    github_token_file:Path
    codex_home:Path
    model_id:str
    model_config:str
    target_kind:str
    target_identity:str
    git_helper:Path
    @classmethod
    def load(cls,path):
        private(Path(path))
        data=tomllib.loads(Path(path).read_text())
        if set(data)!=set(cls.__dataclass_fields__): raise ValueError('unknown/missing configuration field')
        for key in ('database','work_root','checkout','bearer_file','github_token_file','codex_home','git_helper'): data[key]=Path(data[key])
        c=cls(**data); ip=ipaddress.ip_address(c.bind)
        if not ip.is_private or ip.is_unspecified or ip.is_multicast: raise ValueError('private explicit bind required')
        if c.target_kind not in {'isolated-test','operational'} or not c.target_identity: raise ValueError('explicit target required')
        if not re.fullmatch(r'[A-Za-z0-9_.-]+',c.model_id) or c.model_id.startswith('OWNER_') or not c.model_config: raise ValueError('explicit model required')
        if not re.fullmatch(r'[\w.-]+/[\w.-]+',c.repository) or type(c.owner_id)!=int or c.owner_id<1: raise ValueError('invalid target')
        return c

def private(path):
    st=path.stat()
    if st.st_uid!=os.getuid() or stat.S_IMODE(st.st_mode)&0o077: raise ValueError('private owner-only path required')
    if path.is_symlink(): raise ValueError('symlink config/secret rejected')

def secret(path):
    private(path); s=path.read_text().strip()
    if len(s)<32 or '\n' in s: raise ValueError('invalid secret file')
    return s

def diagnostic(message, secrets=()):
    text=str(message)
    for s in secrets:
        if s: text=text.replace(s,'[redacted]')
    text=re.sub(r'(?i)(?:bearer\s+|(?:gh[pousr]_|github_pat_|sk-)[a-zA-Z0-9_-]*)\S*','[redacted]',text)
    text=re.sub(r'[\x00-\x08\x0b-\x1f\x7f]','',text)
    return text[:4096]

def preflight(c,ledger,allow_occupied=False):
    errors=[]; versions={}
    def check(ok,name):
        if not ok: errors.append(name)
    check(platform.system()=='Linux' and 'ubuntu' in platform.freedesktop_os_release().get('ID',''),'Ubuntu required')
    check(os.getuid()!=0,'dedicated unprivileged account required')
    check(Path('/sys/fs/cgroup/cgroup.controllers').is_file(),'unified cgroup v2 required for descendant proof')
    for tool in ('git','codex','systemctl','loginctl'):
        check(bool(shutil.which(tool)),tool+' unavailable')
    for tool in ('git','codex'):
        if shutil.which(tool):
            r=subprocess.run([tool,'--version'],capture_output=True,text=True,timeout=5)
            versions[tool]=diagnostic(r.stdout.strip()); check(r.returncode==0,tool+' version failed')
    for p in (c.work_root,c.database.parent,c.codex_home,c.bearer_file,c.github_token_file,c.git_helper):
        try: private(p)
        except Exception: errors.append('private path check failed')
    try: secret(c.bearer_file); secret(c.github_token_file)
    except Exception: errors.append('credential unavailable')
    check((c.codex_home/'auth.json').is_file(),'owner Codex authentication unavailable')
    check(c.checkout.is_dir() and (c.checkout/'.git').exists(),'dedicated checkout unavailable')
    check(c.work_root.is_absolute() and c.database.is_absolute() and c.checkout.is_absolute(),'absolute paths required')
    check(not c.work_root.is_relative_to(c.checkout) and not c.database.is_relative_to(c.checkout),'private state must be outside checkout')
    check(c.target_identity==c.repository,'target identity mismatch')
    for cmd,label in [(['systemctl','--user','show-environment'],'user manager unavailable'),(['loginctl','show-user',str(os.getuid()),'--property=Linger','--value'],'linger unavailable')]:
        try:
            r=subprocess.run(cmd,capture_output=True,text=True,timeout=5)
            check(r.returncode==0 and (r.stdout.strip()=='yes' if label.startswith('linger') else True),label)
        except Exception: errors.append(label)
    # Inspect installed worker policy without starting or modifying any service.
    try:
        r=subprocess.run(['systemctl','--user','cat','factory-attempt@.service'],capture_output=True,text=True,timeout=5)
        required=('Type=exec','RuntimeMaxSec=1795s','TimeoutStopSec=5s','KillMode=control-group','SendSIGKILL=yes','Restart=no','RemainAfterExit=yes')
        lines={line.strip() for line in r.stdout.splitlines()}
        check(r.returncode==0 and all(line in lines for line in required),'reviewed worker supervision policy unavailable')
    except Exception: errors.append('worker supervision policy unavailable')
    if shutil.which('codex'):
        try:
            r=subprocess.run(['codex','exec','--help'],capture_output=True,text=True,timeout=5)
            check(r.returncode==0 and all(flag in r.stdout for flag in ('--ignore-user-config','--ignore-rules','--output-schema','--output-last-message','--sandbox','--model')),'Codex CLI contract unsupported')
        except Exception: errors.append('Codex CLI capability check failed')
    s=ledger.slot()
    if not allow_occupied: check(not s['attempt_id'] and not s['hold_reason'],'slot requires reconciliation')
    return {'ok':not errors,'errors':errors,'versions':versions,'target':c.target_kind}
