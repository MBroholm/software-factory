"""SQLite owns the durable slot; labels and workflow guards cannot release it."""
import json
import sqlite3
import time
from contextlib import contextmanager
from .contracts import canonical, digest, attempt_uuid, validate

class Conflict(Exception): pass
class Missing(Exception): pass

class Connection(sqlite3.Connection):
    def __exit__(self, *args):
        try: return super().__exit__(*args)
        finally: self.close()

class Ledger:
    def __init__(self, path, clock=time.time):
        self.path=str(path); self.clock=clock
        with self.connect() as c:
            c.executescript('''
            CREATE TABLE IF NOT EXISTS tasks (
              repository TEXT NOT NULL, issue_number INTEGER NOT NULL, owner_id INTEGER NOT NULL,
              branch TEXT NOT NULL, current_attempt TEXT, manifest TEXT,
              PRIMARY KEY(repository,issue_number));
            CREATE TABLE IF NOT EXISTS authorizations (
              id TEXT PRIMARY KEY, repository TEXT NOT NULL, issue_number INTEGER NOT NULL,
              kind TEXT NOT NULL, initial_approval_event INTEGER NOT NULL, specification_digest TEXT NOT NULL,
              source_digest TEXT NOT NULL, refs TEXT NOT NULL, approved_entered_at TEXT NOT NULL,
              FOREIGN KEY(repository,issue_number) REFERENCES tasks(repository,issue_number));
            CREATE TABLE IF NOT EXISTS attempts (
              id TEXT PRIMARY KEY, repository TEXT NOT NULL, issue_number INTEGER NOT NULL,
              predecessor TEXT REFERENCES attempts(id), authorization_id TEXT NOT NULL UNIQUE REFERENCES authorizations(id),
              payload_hash TEXT NOT NULL, payload TEXT NOT NULL, base_sha TEXT NOT NULL,
              status TEXT NOT NULL, accepted_at REAL, started_at REAL, deadline REAL, stopped_at REAL,
              unit_name TEXT, unit_identity TEXT, result_id TEXT, result TEXT, start_body TEXT,
              cancellation TEXT, release_evidence TEXT,
              FOREIGN KEY(repository,issue_number) REFERENCES tasks(repository,issue_number));
            CREATE TABLE IF NOT EXISTS reservation (
              id INTEGER PRIMARY KEY CHECK(id=1), attempt_id TEXT REFERENCES attempts(id),
              generation INTEGER NOT NULL, reserved_at REAL, hold_reason TEXT, release_evidence TEXT);
            INSERT OR IGNORE INTO reservation(id,generation) VALUES(1,0);
            CREATE TABLE IF NOT EXISTS effects (
              attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL, intent_hash TEXT NOT NULL,
              content TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','confirmed','unknown')),
              external TEXT, observed_at REAL NOT NULL, PRIMARY KEY(attempt_id,kind));
            ''')
    def connect(self):
        c=sqlite3.connect(self.path,timeout=2,isolation_level=None,factory=Connection); c.row_factory=sqlite3.Row
        c.execute('PRAGMA foreign_keys=ON'); c.execute('PRAGMA synchronous=FULL'); return c
    @contextmanager
    def tx(self):
        c=self.connect()
        try:
            c.execute('BEGIN IMMEDIATE'); yield c; c.commit()
        except Exception:
            c.rollback(); raise
        finally: c.close()
    def slot(self):
        with self.connect() as c: return dict(c.execute('SELECT * FROM reservation WHERE id=1').fetchone())
    def _get(self,c,id):
        a=c.execute('SELECT * FROM attempts WHERE id=?',(id,)).fetchone()
        if not a: raise Missing(id)
        a=dict(a)
        for key in ('payload','unit_identity','result','start_body','cancellation','release_evidence'):
            if a[key]: a[key]=json.loads(a[key])
        a['effects']=[{**dict(e),'content':json.loads(e['content']),'external':json.loads(e['external']) if e['external'] else None} for e in c.execute('SELECT * FROM effects WHERE attempt_id=? ORDER BY kind',(id,))]
        return a
    def get(self,id):
        with self.connect() as c: return self._get(c,id)
    def reserve(self,id,p):
        validate('reservation',p)
        if id!=attempt_uuid(p): raise Conflict('attempt identity mismatch')
        with self.tx() as c:
            old=c.execute('SELECT payload_hash FROM attempts WHERE id=?',(id,)).fetchone()
            if old:
                if old[0]!=digest(p): raise Conflict('immutable payload conflict')
                return 200,self._get(c,id)
            slot=c.execute('SELECT * FROM reservation WHERE id=1').fetchone()
            if slot['attempt_id'] or slot['hold_reason']: raise Conflict('slot occupied or held')
            auth=p['authorization']; aid=p['repository']+':'+auth['id']
            if c.execute('SELECT 1 FROM authorizations WHERE id=?',(aid,)).fetchone(): raise Conflict('authorization consumed')
            c.execute('INSERT INTO tasks VALUES(?,?,?,?,?,?) ON CONFLICT(repository,issue_number) DO UPDATE SET current_attempt=excluded.current_attempt',
                      (p['repository'],p['issue_number'],p['owner_author_id'],p['branch'],id,None))
            c.execute('INSERT INTO authorizations VALUES(?,?,?,?,?,?,?,?,?)',(aid,p['repository'],p['issue_number'],auth['kind'],auth['initial_approval_event'],p['source']['specification_digest'],p['source']['source_digest'],canonical(auth['references']),auth['approved_entered_at']))
            c.execute('INSERT INTO attempts(id,repository,issue_number,predecessor,authorization_id,payload_hash,payload,base_sha,status) VALUES(?,?,?,?,?,?,?,?,?)',
                      (id,p['repository'],p['issue_number'],p['predecessor'],aid,digest(p),canonical(p),p['base_sha'],'reserved'))
            c.execute('UPDATE reservation SET attempt_id=?,generation=generation+1,reserved_at=?,hold_reason=NULL,release_evidence=NULL WHERE id=1',(id,self.clock()))
            return 201,self._get(c,id)
    def _owned(self,c,id,generation=None):
        s=c.execute('SELECT * FROM reservation WHERE id=1').fetchone()
        if s['attempt_id']!=id or (generation is not None and s['generation']!=generation): raise Conflict('stale reservation generation')
        return s
    def accept(self,id,b):
        validate('start',b)
        with self.tx() as c:
            a=self._get(c,id); self._owned(c,id,b['generation'])
            if a['cancellation']: raise Conflict('cancelled')
            if b['building']['issue_number']!=a['issue_number'] or b['building']['source_digest']!=a['payload']['source']['source_digest']: raise Conflict('Building/source mismatch')
            if a['start_body']:
                if a['start_body']!=b: raise Conflict('start conflict')
                return 200,a
            if a['status']!='reserved': raise Conflict('not reserved')
            c.execute("UPDATE attempts SET status='accepted',accepted_at=?,start_body=? WHERE id=?",(self.clock(),canonical(b),id))
            return 202,self._get(c,id)
    def claim_dispatch(self,id):
        with self.tx() as c:
            a=self._get(c,id); self._owned(c,id)
            if a['status']!='accepted' or a['cancellation']: raise Conflict('dispatch already claimed or cancelled')
            c.execute("UPDATE attempts SET status='dispatching',unit_name=? WHERE id=?",(f'factory-attempt@{id}.service',id))
    def unit(self,id,identity):
        with self.tx() as c:
            c.execute('UPDATE attempts SET unit_identity=? WHERE id=?',(canonical(identity),id))
    def claim_worker(self,id,identity):
        with self.tx() as c:
            a=self._get(c,id); self._owned(c,id)
            if a['status']!='dispatching' or a['cancellation']: raise Conflict('worker already claimed or cancelled')
            now=self.clock()
            c.execute("UPDATE attempts SET status='running',started_at=?,deadline=?,unit_identity=? WHERE id=?",(now,now+1795,canonical(identity),id))
            return self._get(c,id)
    def hold(self,id,reason):
        with self.tx() as c:
            self._owned(c,id); c.execute('UPDATE reservation SET hold_reason=? WHERE id=1',(reason[:512],))
    def cancel(self,id,b):
        validate('cancellation',b)
        with self.tx() as c:
            a=self._get(c,id)
            if a['cancellation']:
                if a['cancellation']!=b: raise Conflict('cancellation conflict')
                return 200,a
            c.execute('UPDATE attempts SET cancellation=? WHERE id=?',(canonical(b),id))
            return 202,self._get(c,id)
    def finish(self,id,result,manifest=None):
        with self.tx() as c:
            a=self._get(c,id)
            if a['result']:
                if a['result']!=result: raise Conflict('immutable result conflict')
                return
            c.execute("UPDATE attempts SET result=?,result_id=?,status=?,stopped_at=? WHERE id=?",(canonical(result),result['id'],'terminal' if result['stopped_proof'] else 'awaiting_stop',self.clock() if result['stopped_proof'] else None,id))
            if manifest: c.execute('UPDATE tasks SET manifest=? WHERE repository=? AND issue_number=?',(canonical(manifest),a['repository'],a['issue_number']))
    def confirm_stopped(self,id,proof):
        with self.tx() as c:
            a=self._get(c,id)
            if not a['result'] or a['result']['stopped_proof']: return
            identity=a['unit_identity']
            if not identity or not proof.get('cgroup_empty') or any(proof.get(k)!=identity.get(k) for k in ('unit_name','boot_id','invocation_id')):
                raise Conflict('stopped invocation mismatch')
            r=a['result']; r['stopped_proof']=proof
            c.execute("UPDATE attempts SET result=?,stopped_at=?,status='terminal' WHERE id=?",(canonical(r),self.clock(),id))
    def effect(self,id,kind,b):
        from .effects import journal
        validate('effect',b)
        return journal(self,id,kind,b)
    def release(self,id,b):
        from .effects import release
        validate('release',b)
        return release(self,id,b)
