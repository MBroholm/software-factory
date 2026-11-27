"""Owner-operated pause/drain and coherent, private recovery bundles. No guard reset."""
import json
import shutil
import sqlite3
from contextlib import closing
from pathlib import Path
from .contracts import canonical,digest
from .ledger import Conflict,Ledger

def fingerprints(root):
    values={}
    for p in sorted(root.rglob('*')):
        name=str(p.relative_to(root))
        if name=='manifest.json':continue
        if p.is_symlink():values[name]='link:'+str(p.readlink())
        elif p.is_file():values[name]='file:'+digest(p.read_bytes().hex())
        elif p.is_dir():values[name]='directory'
        else:raise Conflict('unsupported bundle entry')
    return values

class Recovery:
    def __init__(self,ledger,config,reconciler):self.ledger=ledger;self.config=config;self.reconciler=reconciler
    def pause(self):
        with self.ledger.tx() as c:c.execute('UPDATE control SET paused=1 WHERE id=1')
        return self.inspect()
    def resume(self):
        self._safe()
        if self.reconciler:self.reconciler.services.verify_drained()
        with self.ledger.tx() as c:
            self._safe();c.execute('UPDATE control SET paused=0 WHERE id=1')
        return self.inspect()
    def inspect(self):
        s=self.ledger.slot()
        with self.ledger.connect() as c:paused=bool(c.execute('SELECT paused FROM control WHERE id=1').fetchone()[0])
        return {'paused':paused,'slot':s,'attempt':self.ledger.get(s['attempt_id']) if s['attempt_id'] else None}
    def drain(self):
        self.pause();self.reconciler.reconcile();return self.inspect()
    def reconcile_unissued_push(self, attempt, owner_record):
        """Recover the legacy dirty-worktree failure that preceded any Git push."""
        if not owner_record or not owner_record.strip() or len(owner_record) > 512:
            raise ValueError('recorded owner recovery decision required')

        def candidate(state):
            slot, a = state['slot'], state['attempt']
            if not state['paused'] or slot['attempt_id'] != attempt or slot['hold_reason'] != 'unknown effect: push':
                raise Conflict('paused matching push hold required')
            r = a['result'] or {}
            if (a['status'] != 'terminal' or a['cancellation'] or r.get('outcome') != 'stuck'
                    or r.get('stuck_reason') != 'RuntimeError: done left uncommitted work; retained'
                    or r.get('pushed_sha') or not (r.get('stopped_proof') or {}).get('cgroup_empty')):
                raise Conflict('legacy stopped pre-push failure evidence required')
            unresolved = [effect for effect in a['effects'] if effect['status'] != 'confirmed']
            if len(unresolved) != 1 or (unresolved[0]['kind'], unresolved[0]['status']) != ('push', 'unknown'):
                raise Conflict('push must be the only unresolved effect')
            return slot, a, unresolved[0]

        slot, a, effect = candidate(self.inspect())
        self.reconciler.services.verify_drained()
        git = self.reconciler.git
        payload = a['payload']
        branch = f"issue-{a['issue_number']}"
        if a['repository'] != self.config.repository or payload['branch'] != branch:
            raise Conflict('unexpected repository or branch')
        if git.run(['remote', 'get-url', 'origin']) != f"https://github.com/{a['repository']}.git":
            raise Conflict('unexpected Git remote')
        if git.run(['ls-remote', '--heads', 'origin', 'refs/heads/'+branch], transport=True):
            raise Conflict('remote branch exists')
        with self.ledger.tx() as c:
            current = dict(self.ledger._owned(c, attempt, slot['generation']))
            paused = bool(c.execute('SELECT paused FROM control WHERE id=1').fetchone()[0])
            _, checked, latest = candidate({'paused':paused, 'slot':current, 'attempt':self.ledger._get(c,attempt)})
            if latest != effect or checked['result'] != a['result']:
                raise Conflict('recovery evidence changed during readback')
            evidence = {'owner_record':owner_record.strip(), 'original_effect':effect,
                        'generation':slot['generation'], 'remote_branch_absent':True,
                        'stopped_proof':a['result']['stopped_proof'], 'observed_at':self.ledger.clock()}
            c.execute('INSERT INTO push_recovery VALUES (?,?)', (attempt,canonical(evidence)))
            c.execute("UPDATE effects SET status='confirmed', external=?, observed_at=? WHERE attempt_id=? AND kind='push'",
                      (canonical({'outcome':'not_issued'}),evidence['observed_at'],attempt))
            c.execute('UPDATE reservation SET hold_reason=NULL WHERE attempt_id=?', (attempt,))
        return {'attempt':attempt, 'push':'not_issued', 'generation':slot['generation']}

    def _safe(self):
        state=self.inspect()
        if not state['paused'] or state['slot']['attempt_id'] or state['slot']['hold_reason']:raise Conflict('pause and fully drain/reconcile before backup or restore')
        with self.ledger.connect() as c:
            if c.execute("SELECT 1 FROM attempts WHERE status!='released'").fetchone():raise Conflict('unresolved historical attempt')
    def backup(self,destination):
        self._safe()
        if self.reconciler:self.reconciler.services.verify_drained()
        target=Path(destination)
        if not target.is_absolute() or target.exists():raise ValueError('new absolute private bundle path required')
        resolved=target.resolve()
        if any(resolved.is_relative_to(p.resolve()) for p in (self.config.work_root,self.config.checkout)):raise ValueError('bundle must be outside copied directories')
        target.mkdir(mode=0o700)
        # Keep pause/reservation mutation lock through the coherent filesystem copy.
        with self.ledger.tx() as lock:
            self._safe()
            with self.ledger.connect() as source,closing(sqlite3.connect(target/'ledger.db')) as dest:source.backup(dest)
            shutil.copytree(self.config.work_root,target/'work',symlinks=True)
            shutil.copytree(self.config.checkout,target/'checkout',symlinks=True)
            files=fingerprints(target)
            record={'version':1,'database':str(self.config.database),'work_root':str(self.config.work_root),'checkout':str(self.config.checkout),'repository':self.config.repository,'files':files}
            (target/'manifest.json').write_text(canonical(record))
        return {'bundle':str(target),'manifest_sha256':digest(record)}
    def restore(self,bundle,owner_record):
        self._safe()
        if self.reconciler:self.reconciler.services.verify_drained()
        if not owner_record or len(owner_record)>512:raise ValueError('recorded owner recovery decision required')
        root=Path(bundle);record=json.loads((root/'manifest.json').read_text())
        expected={'database':str(self.config.database),'work_root':str(self.config.work_root),'checkout':str(self.config.checkout),'repository':self.config.repository}
        if any(record.get(k)!=v for k,v in expected.items()):raise Conflict('restore requires original absolute worktree paths and target')
        if fingerprints(root)!=record['files']:raise Conflict('bundle fingerprint mismatch')
        restored=Ledger(root/'ledger.db');other=Recovery(restored,self.config,self.reconciler);other._safe()
        # Never overwrite a ledger with fewer/different attempts or effects, even when empty now.
        with self.ledger.tx() as current,restored.connect() as source:
            self._safe()
            for table in ('attempts','effects','authorizations','questions','tasks','push_recovery'):
                before=[tuple(r) for r in current.execute('SELECT * FROM '+table)]
                after=[tuple(r) for r in source.execute('SELECT * FROM '+table)]
                if before!=after:raise Conflict('restore would replace retained history; owner recovery must reconcile it first')
            if self.config.work_root.exists() or self.config.checkout.exists():raise Conflict('retain current directories privately before restore; no overwrite allowed')
            shutil.copytree(root/'work',self.config.work_root,symlinks=True)
            shutil.copytree(root/'checkout',self.config.checkout,symlinks=True)
            # Exact history already matched; keep current SQLite identity/generation and paused state.
            (self.config.work_root/'recovery-record.json').write_text(canonical({'owner_record':owner_record,'bundle_manifest':digest(record)}))
        return {'restored':True,'paused':True}
