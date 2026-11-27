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
            CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY CHECK(id=1), paused INTEGER NOT NULL);
            INSERT OR IGNORE INTO control VALUES(1,0);
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
            CREATE TABLE IF NOT EXISTS questions (
              id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id),
              text TEXT NOT NULL, context TEXT NOT NULL, owner_answer_comment_id INTEGER,
              owner_answer_body_hash TEXT, consumed_by_attempt TEXT UNIQUE REFERENCES attempts(id), claim TEXT);
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
        q=c.execute('SELECT * FROM questions WHERE attempt_id=?',(id,)).fetchone()
        a['question']=dict(q) if q else None
        if a['question'] and a['question']['claim']: a['question']['claim']=json.loads(a['question']['claim'])
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
            if c.execute('SELECT paused FROM control WHERE id=1').fetchone()[0]: raise Conflict('runner paused')
            slot=c.execute('SELECT * FROM reservation WHERE id=1').fetchone()
            if slot['attempt_id'] or slot['hold_reason']: raise Conflict('slot occupied or held')
            auth=p['authorization']; aid=p['repository']+':'+auth['id']
            if c.execute('SELECT 1 FROM authorizations WHERE id=?',(aid,)).fetchone(): raise Conflict('authorization consumed')
            if auth['kind']=='answer': self._check_continuation(c,p)
            if auth['kind']=='retry': self._check_retry(c,p)
            c.execute('INSERT INTO tasks VALUES(?,?,?,?,?,?) ON CONFLICT(repository,issue_number) DO UPDATE SET current_attempt=excluded.current_attempt',
                      (p['repository'],p['issue_number'],p['owner_author_id'],p['branch'],id,None))
            c.execute('INSERT INTO authorizations VALUES(?,?,?,?,?,?,?,?,?)',(aid,p['repository'],p['issue_number'],auth['kind'],auth['initial_approval_event'],p['source']['specification_digest'],p['source']['source_digest'],canonical(auth['references']),auth['approved_entered_at']))
            c.execute('INSERT INTO attempts(id,repository,issue_number,predecessor,authorization_id,payload_hash,payload,base_sha,status) VALUES(?,?,?,?,?,?,?,?,?)',
                      (id,p['repository'],p['issue_number'],p['predecessor'],aid,digest(p),canonical(p),p['base_sha'],'reserved'))
            if auth['kind']=='answer':
                c.execute('UPDATE questions SET consumed_by_attempt=? WHERE attempt_id=? AND consumed_by_attempt IS NULL',(id,p['predecessor']))
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
            a=self._get(c,id)
            if a['unit_identity'] and a['unit_identity']!=identity: raise Conflict('unit identity immutable')
            c.execute('UPDATE attempts SET unit_identity=? WHERE id=?',(canonical(identity),id))
    def claim_worker(self,id,identity):
        identity={k:identity[k] for k in ('unit_name','boot_id','invocation_id')}
        with self.tx() as c:
            a=self._get(c,id); self._owned(c,id)
            if a['status']!='dispatching' or a['cancellation']: raise Conflict('worker already claimed or cancelled')
            if a['unit_identity'] and a['unit_identity']!=identity: raise Conflict('worker invocation mismatch')
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
    def finish(self,id,result,manifest=None,expected_status=None,unit_identity=None):
        with self.tx() as c:
            a=self._get(c,id)
            if expected_status is not None and a['status'] not in expected_status: raise Conflict('reconciliation raced dispatch')
            if unit_identity is not None:c.execute('UPDATE attempts SET unit_identity=? WHERE id=?',(canonical(unit_identity),id))
            if a['result']:
                if a['result']!=result: raise Conflict('immutable result conflict')
                return
            c.execute("UPDATE attempts SET result=?,result_id=?,status=?,stopped_at=? WHERE id=?",(canonical(result),result['id'],'terminal' if result['stopped_proof'] else 'awaiting_stop',self.clock() if result['stopped_proof'] else None,id))
            if result['outcome']=='question':
                q=result['question']
                c.execute('INSERT INTO questions(id,attempt_id,text,context) VALUES(?,?,?,?)',(id+'-q1',id,q['text'],q['context']))
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
    def questions(self):
        with self.connect() as c:
            return [self._get(c,row[0]) for row in c.execute('SELECT q.attempt_id FROM questions q JOIN attempts a ON a.id=q.attempt_id JOIN tasks t ON t.current_attempt=a.id WHERE q.consumed_by_attempt IS NULL ORDER BY q.id')]
    def claim_answer(self,id,claim):
        from .questions import parse_answer, question_body
        validate('answer',claim)
        with self.tx() as c:
            a=self._get(c,id);q=a['question'];p=a['payload']
            if a['status']!='released' or a['cancellation'] or not q or not a['result']['stopped_proof']:
                raise Conflict('question predecessor not safely released')
            if claim['predecessor']!=id or claim['source']!=p['source'] or claim['initial_approval_event']!=p['authorization']['initial_approval_event']:
                raise Conflict('question scope lineage mismatch')
            question=claim['continuation']['question'];answer=claim['continuation']['answer']
            comment=next((e for e in a['effects'] if e['kind']=='comment' and e['status']=='confirmed'),None)
            if not comment or question['id']!=q['id'] or question['text']!=q['text'] or question['context']!=q['context'] or question['body_sha256']!=digest(question_body(a)) or question['comment_id']!=comment['external'].get('comment_id'):
                raise Conflict('published question mismatch')
            parsed=parse_answer(answer['body'],q['id'])
            if parsed['scope']!='unchanged' or parsed['text']!=answer['text'] or digest(answer['body'])!=answer['body_sha256'] or answer['created_at']!=answer['updated_at'] or claim['authorization_id']!=f"answer:{q['id']}:{answer['id']}":
                raise Conflict('invalid captured answer')
            if q['claim']:
                if q['claim']!=claim: raise Conflict('answer claim immutable; owner recovery required')
                return q['claim']
            if q['consumed_by_attempt']: raise Conflict('question already consumed')
            current=c.execute('SELECT current_attempt FROM tasks WHERE repository=? AND issue_number=?',(p['repository'],p['issue_number'])).fetchone()[0]
            if current!=id: raise Conflict('stale question predecessor')
            c.execute('UPDATE questions SET owner_answer_comment_id=?,owner_answer_body_hash=?,claim=? WHERE attempt_id=?',(answer['id'],answer['body_sha256'],canonical(claim),id))
            return claim
    def _check_continuation(self,c,p):
        a=self._get(c,p['predecessor']);q=a['question'];old=a['payload']
        if a['status']!='released' or a['cancellation'] or not q or not q['claim'] or q['consumed_by_attempt']:
            raise Conflict('continuation predecessor unavailable')
        for field in ('repository','issue_number','owner_author_id','source','specification','branch','base_sha','model_config'):
            if p[field]!=old[field]: raise Conflict('approved input changed')
        if p.get('history',[])!=old.get('history',[])+([old['continuation']] if 'continuation' in old else []): raise Conflict('continuation history changed')
        if p['authorization']['initial_approval_event']!=q['claim']['initial_approval_event'] or p['continuation']!=q['claim']['continuation'] or p['authorization']['id']!=q['claim']['authorization_id'] or p['manifest']!=a['result']['manifest'] or p['discussion']!=old['discussion']:
            raise Conflict('answer/manifest is not the durable claim')
        current=c.execute('SELECT current_attempt FROM tasks WHERE repository=? AND issue_number=?',(p['repository'],p['issue_number'])).fetchone()[0]
        if current!=a['id']: raise Conflict('stale continuation')
    def continuation_payload(self,id,approved_entered_at,approval_event):
        from copy import deepcopy
        a=self.get(id);q=a['question']
        if not q or not q['claim']: raise Conflict('no durable answer claim')
        claim=q['claim'];p=deepcopy(a['payload'])
        p.update(predecessor=id,manifest=a['result']['manifest'],continuation=claim['continuation'],history=p.get('history',[])+([p['continuation']] if 'continuation' in p else []))
        answer=claim['continuation']['answer']
        p['authorization']={'id':claim['authorization_id'],'kind':'answer','initial_approval_event':claim['initial_approval_event'],
            'approved_entered_at':approved_entered_at,'references':[claim['initial_approval_event'],answer['id']],'approval_event':approval_event}
        return p
    def effect(self,id,kind,b):
        from .effects import journal
        validate('effect',b)
        return journal(self,id,kind,b)
    def release(self,id,b):
        from .effects import release
        validate('release',b)
        return release(self,id,b)

    def retries(self):
        with self.connect() as c:
            return [self._get(c,r[0]) for r in c.execute("SELECT a.id FROM attempts a JOIN tasks t ON t.current_attempt=a.id WHERE a.status='released' AND a.cancellation IS NULL AND json_extract(a.result,'$.outcome')='stuck' ORDER BY a.id")]
    def _check_retry(self,c,p):
        a=self._get(c,p['predecessor']);old=a['payload']
        current=c.execute('SELECT current_attempt FROM tasks WHERE repository=? AND issue_number=?',(p['repository'],p['issue_number'])).fetchone()
        if not current or current[0]!=a['id'] or a['status']!='released' or a['cancellation'] or a['result']['outcome']!='stuck' or not a['result']['stopped_proof'] or any(e['status']!='confirmed' for e in a['effects']):raise Conflict('retry predecessor not reconciled')
        for k in ('repository','issue_number','owner_author_id','branch'):
            if p[k]!=old[k]:raise Conflict('retry task changed')
        if p['manifest']!=a['result']['manifest']:raise Conflict('retry work provenance changed')
        if p['source']==old['source'] and p.get('history',[])!=old.get('history',[])+([old['continuation']] if 'continuation' in old else []):raise Conflict('retry history changed')
        if p['source']==old['source'] and (p['specification']!=old['specification'] or p['base_sha']!=old['base_sha'] or p['authorization']['initial_approval_event']!=old['authorization']['initial_approval_event']):raise Conflict('unchanged retry scope mismatch')
        if p['source']!=old['source'] and p['authorization']['initial_approval_event']!=p['authorization']['approval_event']:raise Conflict('changed retry requires renewed explicit approval')
