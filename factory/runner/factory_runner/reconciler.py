"""Reconcile durable ownership against named units; never dispatch replacement work."""
import time
from .results import stuck

class Reconciler:
    def __init__(self,ledger,services,git=None):
        self.ledger=ledger;self.services=services;self.git=git
    def reconcile(self,id=None):
        deadline=time.monotonic()+4
        adapters=[x for x in (self.services,self.git) if x is not None]
        previous=[getattr(x,'deadline',None) for x in adapters]
        try:
            for adapter in adapters:adapter.deadline=deadline
            return self._reconcile(id)
        finally:
            for adapter,value in zip(adapters,previous):adapter.deadline=value
    def _reconcile(self,id=None):
        slot=self.ledger.slot();id=id or slot['attempt_id']
        if not id:return True
        a=self.ledger.get(id)
        if a['status']=='released' or (a['result'] and a['result']['stopped_proof']):return not bool(slot['hold_reason'])
        if slot['attempt_id']!=id:return False
        try:
            if a['status'] in {'reserved','accepted'}:
                # No dispatch claim exists: the transaction proves no worker was authorized.
                if not a['cancellation'] and a['status']=='reserved':return True
                proof={'unit_name':f'factory-attempt@{id}.service','boot_id':'not-dispatched','invocation_id':id,'cgroup_empty':True}
                self._interrupted(a,proof,'Cancelled before dispatch' if a['cancellation'] else 'Accepted execution interrupted before dispatch; explicit retry required',undispatched=True)
                return True
            observed=self.services.observe(id)
            identity={k:observed[k] for k in ('unit_name','boot_id','invocation_id')}
            if a['unit_identity'] and identity!=a['unit_identity']:raise RuntimeError('unit identity changed; owner recovery required')
            if not a['unit_identity']:
                dispatch=next((e for e in a['effects'] if e['kind']=='dispatch'),None)
                if not dispatch or identity['unit_name']!=a['unit_name']:raise RuntimeError('missing dispatch attribution')
                self.ledger.unit(id,identity)
            dispatch=next((e for e in a['effects'] if e['kind']=='dispatch'),None)
            if dispatch and dispatch['status']!='confirmed':
                self.ledger.effect(id,'dispatch',{'phase':'confirmed','content':dispatch['content'],'external':identity})
            if a['started_at'] is not None and self.ledger.clock()<a['started_at']: observed['clock_safe']=False
            if a['cancellation'] or (a['deadline'] is not None and self.ledger.clock()>=a['deadline']) or not observed.get('clock_safe',True):
                if not observed.get('quiescent') or not observed.get('cgroup_empty'):self.services.stop(id)
            if not observed.get('clock_safe',True):raise RuntimeError('clock uncertainty; runtime cannot be extended')
            if observed.get('quiescent') and observed.get('cgroup_empty'):
                proof={**identity,'cgroup_empty':True}
                if a['result']:self.ledger.confirm_stopped(id,proof)
                else:self._interrupted(a,proof,'Execution interrupted, cancelled or timed out; explicit owner retry required')
                # Only clear reconciliation-owned holds; effect/owner holds remain independent.
                with self.ledger.tx() as c:
                    c.execute("UPDATE reservation SET hold_reason=NULL WHERE attempt_id=? AND (hold_reason LIKE 'reconciliation:%' OR hold_reason IN ('unit start outcome unknown','dispatch acknowledgement unknown','stopped process evidence unknown'))",(id,))
            return not bool(self.ledger.slot()['hold_reason'])
        except Exception as exc:
            existing=self.ledger.slot()['hold_reason']
            if not existing or existing.startswith('reconciliation:'):self.ledger.hold(id,'reconciliation: '+type(exc).__name__+': '+str(exc)[:200])
            return False
    def _interrupted(self,a,proof,reason,undispatched=False):
        manifest=None
        if self.git:
            try:manifest=self.git.snapshot(a['payload'],a['id'])
            except Exception:pass # Unknown partial work stays on disk and cannot be reused without provenance.
        result={**stuck(reason),'id':a['id']+'-result','attempt':a['id'],'pushed_sha':None,
            'stopped_proof':proof,'cancelled':bool(a['cancellation']),'diagnostics':[],
            'manifest':manifest,'check_provenance':'no independent verification'}
        self.ledger.finish(a['id'],result,manifest,expected_status={'reserved','accepted'} if undispatched else None,unit_identity={k:v for k,v in proof.items() if k!='cgroup_empty'} if undispatched else None)
