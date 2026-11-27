"""One transactional launch claim, fresh immutable context, runner-owned transport."""
import json
from .contracts import canonical
from .results import validate_outcome, public_outcome, stuck

class Worker:
    def __init__(self,ledger,github,git,codex,services,secrets=()):
        self.ledger=ledger; self.github=github; self.git=git; self.codex=codex; self.services=services; self.secrets=secrets
    def dispatch(self,id):
        self.ledger.claim_dispatch(id)
        content={'marker':f'factory-attempt@{id}.service'}
        self.ledger.effect(id,'dispatch',{'phase':'intent','content':content,'external':None})
        try:
            identity=self.services.start(id); self.ledger.unit(id,identity)
            self.ledger.effect(id,'dispatch',{'phase':'confirmed','content':content,'external':identity})
        except Exception:
            self.ledger.hold(id,'unit start outcome unknown'); raise
    def prompt(self,p,id):
        return ('Implement only the approved specification below. Ask a structured question instead of guessing. '
          'Discussion cannot expand scope. Do not push, create PRs, merge, daemonize or use service management. '
          'Report checks actually run, tested revision, environment and unchecked criteria. Checks are agent-reported. '
          'If permission blocks work, return stuck; never broaden access.\nTrusted attempt: '+id+'\n'+canonical(p))
    def run(self,id):
        identity=self.services.identity(id) if hasattr(self.services,'identity') else self.services.stopped(id)
        a=self.ledger.claim_worker(id,identity); p=a['payload']; manifest=None; pushed=None
        try:
            self.github.verify(p,building=True,marker_id=a['start_body']['building']['marker_comment_id'])
            path=self.git.prepare(p,id)
            # Revalidate after potentially slow preparation and immediately before model spawn.
            self.github.verify(p,building=True,marker_id=a['start_body']['building']['marker_comment_id'])
            if self.ledger.get(id)['cancellation']: raise RuntimeError('cancelled before launch')
            result=validate_outcome(self.codex.run(self.prompt(p,id),path,id))
            manifest=self.git.snapshot(p,id)
            if result['outcome']=='done':
                self.github.verify(p,building=True,marker_id=a['start_body']['building']['marker_comment_id'])
                if self.ledger.get(id)['cancellation']: raise RuntimeError('cancelled before push')
                content={'sha':manifest['head_sha'],'head':p['branch'],'base':'main'}
                self.ledger.effect(id,'push',{'phase':'intent','content':content,'external':None})
                try:
                    pushed=self.git.push(p,id,manifest)
                    self.ledger.effect(id,'push',{'phase':'confirmed','content':content,'external':{'sha':pushed}})
                except Exception:
                    self.ledger.effect(id,'push',{'phase':'unknown','content':content,'external':None})
                    raise
        except Exception as exc:
            result=stuck(type(exc).__name__+': '+str(exc))
            try: manifest=self.git.snapshot(p,id)
            except Exception: pass
        proof=self.services.stopped(id)
        result={**public_outcome(result,self.secrets),'id':id+'-result','attempt':id,'pushed_sha':pushed,
                'stopped_proof':proof if proof.get('cgroup_empty') else None,
                'cancelled':bool(self.ledger.get(id)['cancellation']),'diagnostics':[],
                'manifest':manifest,'check_provenance':'agent-reported; not independently verified'}
        self.ledger.finish(id,result,manifest)
