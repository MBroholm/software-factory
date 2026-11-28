import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fakes import Clock, Services, GitHub, Codex, Git

def payload(number=1):
    from factory_runner.contracts import digest
    spec='Goal: change the fixture. Constraints: preserve scope. Acceptance: actual check.'
    return {'contract_version':1,'repository':'test/fixture','issue_number':number,'owner_author_id':7,
      'authorization':{'id':f'initial:{number}:42','kind':'initial','initial_approval_event':42,
        'approved_entered_at':'2026-11-27T10:00:00Z','references':[42]},
      'source':{'refinement_comment_id':12,'refinement_body_sha256':'a'*64,'source_digest':'c'*64,
        'specification_digest':digest(spec),'captured_comment_ids':[]},
      'specification':spec,'discussion':[],'predecessor':None,'manifest':None,
      'branch':f'issue-{number}','base_sha':'a'*40,'model_config':'test'}

def outcome(kind='done'):
    return {'outcome':kind,'summary':'Changed fixture','question':None,'checks':[
      {'command':'python -m unittest','outcome':'passed','details':'one fixture check',
       'tested_revision':'b'*40,'environment':'fake isolated adapter'}],
      'unchecked_criteria':[],'stuck_reason':None}

class ASGIClient:
    """Exercise the full ASGI boundary without sockets, threads or third-party clients."""
    def __init__(self,app): self.app=app
    def request(self,method,path,json=None,headers=None):
        import asyncio
        import json as codec
        from types import SimpleNamespace
        data=codec.dumps(json).encode() if json is not None else b''
        messages=[]
        async def receive(): return {'type':'http.request','body':data,'more_body':False}
        async def send(message): messages.append(message)
        scope={'type':'http','asgi':{'version':'3.0'},'http_version':'1.1','method':method,
          'scheme':'http','path':path,'raw_path':path.encode(),'query_string':b'',
          'headers':[(k.lower().encode(),v.encode()) for k,v in (headers or {}).items()],
          'client':('127.0.0.1',1),'server':('127.0.0.1',80),'root_path':''}
        asyncio.run(self.app(scope,receive,send))
        body=b''.join(m.get('body',b'') for m in messages if m['type']=='http.response.body')
        return SimpleNamespace(status_code=messages[0]['status'],json=lambda:codec.loads(body))
