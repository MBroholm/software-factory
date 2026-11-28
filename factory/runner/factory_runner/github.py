"""Independent, fully paginated GitHub read verification at launch and push."""
import json
import re
import urllib.request
import time
from datetime import datetime
from .contracts import digest, canonical, attempt_uuid
from .config import secret

def lf(s): return (s or '').replace('\r\n','\n').replace('\r','\n')
def jsjson(x): return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def timestamp(s): return datetime.fromisoformat(s.replace('Z','+00:00'))

class GitHub:
    def __init__(self,config,read=None):
        self.config=config; self.read=read or self._read; self.deadline=None
    def _read(self,path):
        req=urllib.request.Request('https://api.github.com/repos/'+self.config.repository+'/'+path,
          headers={'Authorization':'Bearer '+secret(self.config.github_token_file),'Accept':'application/vnd.github+json',
                   'X-GitHub-Api-Version':'2026-03-10'})
        remaining=10 if self.deadline is None else min(10,self.deadline-time.monotonic())
        if remaining<=0: raise TimeoutError('source verification budget exhausted')
        with urllib.request.urlopen(req,timeout=remaining) as r:
            data=r.read(2*1024*1024+1)
            if len(data)>2*1024*1024: raise ValueError('GitHub response too large')
            return json.loads(data)
    def pages(self,path):
        result=[]
        for page in range(1,101):
            if self.deadline is not None and time.monotonic()>=self.deadline: raise TimeoutError('source verification budget exhausted')
            batch=self.read(path+('&' if '?' in path else '?')+f'per_page=100&page={page}')
            if not isinstance(batch,list): raise ValueError('invalid GitHub page')
            result.extend(batch)
            if len(batch)<100:
                ids=[x['id'] for x in result]
                if len(ids)!=len(set(ids)): raise ValueError('duplicate GitHub pages')
                return result
        raise ValueError('incomplete GitHub pagination')
    def verify(self,p,building=True,marker_id=None,state_override=None):
        if p['repository']!=self.config.repository or p['owner_author_id']!=self.config.owner_id: raise ValueError('target mismatch')
        number=p['issue_number']; issue=self.read(f'issues/{number}')
        if issue.get('pull_request') or issue['number']!=number or issue['user']['id']!=self.config.owner_id or issue['state']!='open': raise ValueError('issue no longer eligible')
        managed={'Ideas','Refining','Ready for approval','Approved','Building','Your QA','Done','Waiting for you','Stuck'}
        labels=[l['name'] for l in issue['labels'] if l['name'] in managed]
        if labels!=[state_override or ('Building' if building else 'Approved')]: raise ValueError('issue state changed')
        comments=self.pages(f'issues/{number}/comments'); events=self.pages(f'issues/{number}/events')
        auth=p['authorization']
        if auth['kind'] not in {'initial','answer','retry'}: raise ValueError('unsupported authorization')
        approved=sorted((e for e in events if e.get('label',{}).get('name')=='Approved' and e['event'] in {'labeled','unlabeled'}),key=lambda e:e['id'])
        if building:
            removed=approved.pop() if approved else None
            if not removed or removed['event']!='unlabeled' or removed['actor']['id']!=self.config.owner_id: raise ValueError('missing Building transition lineage')
        current=approved[-1] if approved else None
        expected_current=auth['initial_approval_event'] if auth['kind']=='initial' else auth['approval_event']
        if not current or current['event']!='labeled' or current['actor']['id']!=self.config.owner_id or current['id']!=expected_current or current['created_at']!=auth['approved_entered_at']:
            raise ValueError('current approval lineage changed')
        event=next((e for e in events if e['id']==auth['initial_approval_event']),None)
        if not event or event['event']!='labeled' or event.get('label',{}).get('name')!='Approved' or event['actor']['id']!=self.config.owner_id:
            raise ValueError('original explicit approval missing')
        if auth['kind']=='answer' or p.get('history'):
            from .questions import answer_claim
            for captured in [*p.get('history',[]),*([p['continuation']] if 'continuation' in p else [])]:
                q=captured['question'];predecessor_id=q['id'].removesuffix('-q1')
                predecessor={'id':predecessor_id,'payload':p,'result':{'id':predecessor_id+'-result','question':{'text':q['text'],'context':q['context']}}}
                actual=answer_claim(predecessor,comments,self.config.owner_id)
                if actual['continuation']!=captured:
                    raise ValueError('consumed answer/question edited, deleted or ambiguous')
            if auth['kind']=='answer' and actual['authorization_id']!=auth['id']: raise ValueError('answer authorization mismatch')
        if auth['kind']=='retry':
            failures=[]
            for comment in comments:
                match=re.match(r'^<!-- factory:failure:v2 (\{[^\n]+\}) -->\n',comment['body'])
                if match:
                    metadata=json.loads(match[1])
                    if metadata.get('attempt')==p['predecessor']:
                        if comment['user']['id']!=self.config.owner_id or comment['created_at']!=comment['updated_at'] or timestamp(comment['created_at'])>=timestamp(current['created_at']):raise ValueError('retry failure evidence changed')
                        failures.append(comment)
            stuck_events=[e for e in events if e.get('label',{}).get('name')=='Stuck' and e['event']=='labeled' and timestamp(e['created_at'])<timestamp(current['created_at'])]
            if len(failures)!=1 or not stuck_events:raise ValueError('retry requires failure and subsequent owner approval')
        refinements=[]
        for c in comments:
            if not lf(c['body']).startswith('<!-- factory:refinement:v1'): continue
            match=re.fullmatch(r'<!-- factory:refinement:v1 (\{[^\n]+\}) -->\n([\s\S]*)',lf(c['body']))
            if not match or c['user']['id']!=self.config.owner_id or c['created_at']!=c['updated_at']: raise ValueError('invalid refinement')
            meta=json.loads(match[1]); text=match[2]
            ids=meta['captured_comment_ids']
            if meta['issue_number']!=number or meta['content_sha256']!=digest(text) or ids!=sorted(set(ids)) or meta['last_included_owner_comment_id']!=(ids[-1] if ids else 0): raise ValueError('refinement content changed')
            if meta['source_key']!=f"{number}:{meta['source_digest']}:{ids[-1] if ids else 0}:{meta['prompt_version']}": raise ValueError('refinement identity changed')
            refinements.append((c,meta,text))
        if not refinements: raise ValueError('missing refinement')
        c,meta,text=max(refinements,key=lambda x:x[0]['id'])
        if state_override is None and auth['kind']=='initial' and any(x['body'].startswith('<!-- factory:question:v2 ') and timestamp(x['created_at'])>timestamp(c['created_at']) for x in comments):
            raise ValueError('question continuation cannot be inferred as initial approval')
        src=p['source']
        if c['id']!=src['refinement_comment_id'] or digest(c['body'])!=src['refinement_body_sha256'] or text!=p['specification'] or digest(text)!=src['specification_digest'] or timestamp(c['updated_at'])>=timestamp(event['created_at']): raise ValueError('approved specification changed')
        captured=[]
        for id in src['captured_comment_ids']:
            found=next((x for x in comments if x['id']==id),None)
            if not found or found['user']['id']!=self.config.owner_id or re.match(r'^(?:<!--\s*)?factory:',lf(found['body'])): raise ValueError('captured source missing')
            captured.append({'id':id,'body':lf(found['body'])})
        source={'title':lf(issue['title']),'body':lf(issue['body']),'owner_comments':sorted(captured,key=lambda x:x['id'])}
        if src['captured_comment_ids']!=meta['captured_comment_ids'] or digest(jsjson(source))!=src['source_digest'] or meta['source_digest']!=src['source_digest']: raise ValueError('source changed')
        for d in p['discussion']:
            actual=next((x for x in comments if x['id']==d['id']),None)
            if not actual or actual['user']['id']!=self.config.owner_id or actual['body']!=d['body'] or digest(actual['body'])!=d['body_sha256']: raise ValueError('discussion changed')
        if building:
            expected={'repository':p['repository'],'issue':number,'attempt':attempt_uuid(p),
                      'initial_approval':auth['initial_approval_event'],'specification_digest':src['specification_digest']}
            markers=[]
            for comment in comments:
                if not comment['body'].startswith('<!-- factory:attempt:v2'): continue
                match=re.match(r'^<!-- factory:attempt:v2 (\{[^\n]+\}) -->\n',comment['body'])
                if not match or comment['user']['id']!=self.config.owner_id or comment['created_at']!=comment['updated_at']:
                    raise ValueError('attempt marker edited/untrusted')
                meta=json.loads(match[1])
                if meta.get('attempt')==expected['attempt']: markers.append((comment['id'],meta))
            if len(markers)!=1 or markers[0][1]!=expected or (marker_id is not None and markers[0][0]!=marker_id): raise ValueError('missing/mismatched immutable attempt marker')
        # A factory v2 marker is protocol evidence, never another human approval.
        for x in comments:
            if auth['kind']=='initial' and re.match(r'^<!-- factory:(?:authorization|answer):v2',lf(x['body'])) and str(event['id']) in x['body']:
                raise ValueError('ambiguous automated approval lineage')
        return True

    def verify_answer(self,a,claim):
        from .questions import answer_claim
        self.deadline=time.monotonic()+8
        try:
            self.verify(a['payload'],building=True,marker_id=a['start_body']['building']['marker_comment_id'],state_override='Waiting for you')
            actual=answer_claim(a,self.pages(f"issues/{a['issue_number']}/comments"),self.config.owner_id)
            if actual!=claim: raise ValueError('current answer does not match proposed durable claim')
            return True
        finally: self.deadline=None

    def verify_retry(self,predecessor,p):
        effect=next((e for e in predecessor['effects'] if e['kind']=='comment' and e['status']=='confirmed'),None)
        if not effect:raise ValueError('retry predecessor failure unconfirmed')
        comments=self.pages(f"issues/{p['issue_number']}/comments")
        matches=[c for c in comments if c['id']==effect['external']['comment_id']]
        if len(matches)!=1:raise ValueError('retry failure deleted')
        c=matches[0]
        if c['body']!=effect['content']['body'] or c['user']['id']!=self.config.owner_id or c['created_at']!=c['updated_at'] or timestamp(c['created_at'])>=timestamp(p['authorization']['approved_entered_at']):raise ValueError('retry failure edited or approval stale')
