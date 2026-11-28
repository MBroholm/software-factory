"""Fresh CLI invocation. No resume, shell, credential inheritance or model fallback."""
import json
import os
import subprocess
from pathlib import Path
from .results import validate_outcome

class Codex:
    def __init__(self,config): self.config=config
    def run(self,prompt,path,attempt):
        private=self.config.work_root/'attempts'/attempt
        private.mkdir(parents=True,exist_ok=False,mode=0o700)
        output=private/'result.json'; schema=Path(__file__).with_name('agent-result.json')
        env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':str(self.config.codex_home.parent),
             'CODEX_HOME':str(self.config.codex_home),'LANG':'C.UTF-8',
             'GIT_TERMINAL_PROMPT':'0','GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'credential.helper','GIT_CONFIG_VALUE_0':''}
        argv=['codex','-c','approval_policy="never"','exec','--ignore-user-config','--ignore-rules','--sandbox','workspace-write',
          '--model',self.config.model_id,'--cd',str(path),'--output-schema',str(schema),
          '--output-last-message',str(output),'--json','-']
        # Supervision/whole-tree timeout is owned by systemd, independent of API lifetime.
        process=subprocess.Popen(argv,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
        process.stdin.write(prompt.encode()); process.stdin.close()
        # Stream and bound retained diagnostics; continue draining after cap to avoid deadlock.
        with (private/'diagnostics.private').open('wb') as log:
            retained=0
            while chunk:=process.stdout.read(8192):
                keep=chunk[:max(0,65536-retained)]; log.write(keep); retained+=len(keep)
        rc=process.wait()
        if rc: raise RuntimeError('Codex exited nonzero; private bounded diagnostics retained')
        if not output.exists() or output.stat().st_size>262144: raise RuntimeError('missing/oversized outcome')
        return validate_outcome(json.loads(output.read_text()))
