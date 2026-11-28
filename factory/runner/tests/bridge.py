"""Private local graph-test bridge over stdin/stdout; never listens on a socket."""
import json
import sys
from pathlib import Path
from support import ASGIClient, GitHub, Git, Codex, Services, outcome
from factory_runner.ledger import Ledger
from factory_runner.api import create_app
from factory_runner.worker import Worker
from factory_runner.github import GitHub as CurrentGitHub
from types import SimpleNamespace

request=json.load(sys.stdin)
ledger=Ledger(Path(sys.argv[1])); bearer='fixture-only-bearer-not-a-real-secret'
if request.get('action')=='worker':
    id=request['id']; p=ledger.get(id)['payload']
    result=outcome()
    if request.get('outcome')=='question': result.update(outcome='question',question={'text':'Which format?','context':'Choose approved format.'})
    if request.get('outcome')=='stuck': result.update(outcome='stuck',stuck_reason='Fixture failure, partial work retained')
    canary=request.get('redaction_canary')
    if canary:
        result['stuck_reason'] += ': '+canary
    worker=Worker(ledger,GitHub(p),Git(),Codex(result),Services(),(canary,) if canary else ())
    worker.run(id); print(json.dumps(ledger.get(id)))
else:
    def dispatch(id):
        p=ledger.get(id)['payload']
        Worker(ledger,GitHub(p),Git(),Codex(outcome()),Services()).dispatch(id)
    world=request.get('github')
    def read(path):
        number=int(path.split('/')[1]);issue=next(i for i in world['issues'] if i['number']==number)
        if '/comments?' in path: return world['comments'] if 'page=1' in path else []
        if '/events?' in path: return [e for e in world['events'] if not e.get('issue') or e['issue']['number']==number] if 'page=1' in path else []
        return issue
    verifier=CurrentGitHub(SimpleNamespace(repository='MBroholm/software-factory',owner_id=202449424),read) if world else None
    client=ASGIClient(create_app(ledger,bearer,'MBroholm/software-factory',202449424,{'OWNER_CONFIGURE_MODEL_ID'},dispatch,github=verifier))
    response=client.request(request['method'],request['path'],json=request.get('body'),headers={'Authorization':'Bearer '+bearer})
    print(json.dumps({'statusCode':response.status_code,'body':response.json(),'headers':{}}))
