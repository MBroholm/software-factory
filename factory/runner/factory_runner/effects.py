"""Intent-before-write journal. An unknown write never becomes permission to retry."""
from .contracts import canonical, digest
from .ledger import Conflict

KINDS={'attempt','building','dispatch','push','pr','comment','state','scope_refinement'}
def journal(ledger,id,kind,b):
    if kind not in KINDS: raise ValueError('unknown effect kind')
    conflict=False
    with ledger.tx() as c:
        a=ledger._get(c,id)
        old=next((e for e in a['effects'] if e['kind']==kind),None)
        if not old:
            if not (kind=='scope_refinement' and a['status']=='released' and a['question'] and not a['question']['consumed_by_attempt']): ledger._owned(c,id)
            if b['phase']!='intent' or b['external'] is not None: raise Conflict('intent required first')
            if a['cancellation'] and kind not in {'state'}: raise Conflict('publication cancelled')
            c.execute('INSERT INTO effects VALUES(?,?,?,?,?,?,?)',(id,kind,digest(b['content']),canonical(b['content']),'pending',None,ledger.clock()))
        elif old['intent_hash']!=digest(b['content']) or (old['status']=='confirmed' and (b['phase']=='unknown' or (b['phase']=='confirmed' and old['external']!=b['external']))):
            conflict=True
            c.execute('UPDATE reservation SET hold_reason=? WHERE attempt_id=?',('effect conflict: '+kind,id))
        elif b['phase']=='confirmed':
            if not b['external']: raise Conflict('external confirmation required')
            c.execute("UPDATE effects SET status='confirmed',external=?,observed_at=? WHERE attempt_id=? AND kind=?",(canonical(b['external']),ledger.clock(),id,kind))
        elif b['phase']=='unknown':
            c.execute("UPDATE effects SET status='unknown',observed_at=? WHERE attempt_id=? AND kind=?",(ledger.clock(),id,kind))
            c.execute('UPDATE reservation SET hold_reason=? WHERE attempt_id=?',('unknown effect: '+kind,id))
        if b['phase']=='confirmed':
            unresolved=c.execute("SELECT 1 FROM effects WHERE attempt_id=? AND status='unknown'",(id,)).fetchone()
            if not unresolved:
                c.execute('UPDATE reservation SET hold_reason=NULL WHERE attempt_id=? AND hold_reason=?',(id,'unknown effect: '+kind))
        # Replaying an intent returns the existing state; callers must inspect it before external IO.
        result=ledger._get(c,id)
    if conflict: raise Conflict('effect content/confirmation conflict; held')
    return result

def release(ledger,id,b):
    with ledger.tx() as c:
        a=ledger._get(c,id); s=c.execute('SELECT * FROM reservation WHERE id=1').fetchone()
        if a['status']=='released' and s['attempt_id'] is None and s['generation']==b['generation'] and a['release_evidence']==b: return a
        ledger._owned(c,id,b['generation'])
        if s['hold_reason']: raise Conflict('reservation held')
        r=a['result']
        if a['status']!='terminal' or not r or not r['stopped_proof'] or r['stopped_proof']!=b['stopped_proof']: raise Conflict('no trusted stopped proof')
        if any(e['status']!='confirmed' for e in a['effects']): raise Conflict('effects unresolved')
        effects={e['kind']:e for e in a['effects']}; target=b['publication']['state']
        expected='Done' if a['cancellation'] else {'done':'Your QA','question':'Waiting for you','stuck':'Stuck'}[r['outcome']]
        if target!=expected: raise Conflict('publication outcome mismatch')
        state=effects.get('state',{}).get('external',{})
        if state.get('state')!=target or state.get('issue_number')!=a['issue_number']: raise Conflict('state unconfirmed')
        if expected=='Your QA':
            pr=effects.get('pr',{}).get('external',{}); push=effects.get('push',{}).get('external',{})
            if not r['pushed_sha'] or push.get('sha')!=r['pushed_sha'] or pr.get('sha')!=r['pushed_sha'] or pr.get('number')!=b['publication'].get('pr_number'): raise Conflict('PR/push mismatch')
        elif expected!='Done' and not effects.get('comment',{}).get('external',{}).get('comment_id'): raise Conflict('comment unconfirmed')
        c.execute("UPDATE attempts SET status='released',release_evidence=? WHERE id=?",(canonical(b),id))
        c.execute('UPDATE reservation SET attempt_id=NULL,release_evidence=? WHERE id=1',(canonical(b),))
        return ledger._get(c,id)
