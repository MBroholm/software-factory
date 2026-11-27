"""Private local graph-test bridge over stdin/stdout; never listens on a socket."""
import json
import sys
from pathlib import Path
from support import ASGIClient, GitHub, Git, Codex, Services, outcome
from factory_runner.ledger import Ledger
from factory_runner.api import create_app
from factory_runner.worker import Worker

request=json.load(sys.stdin)
ledger=Ledger(Path(sys.argv[1])); bearer='fixture-only-bearer-not-a-real-secret'
if request.get('action')=='worker':
    id=request['id']; p=ledger.get(id)['payload']
    worker=Worker(ledger,GitHub(p),Git(),Codex(outcome()),Services())
    worker.run(id); print(json.dumps(ledger.get(id)))
else:
    def dispatch(id):
        p=ledger.get(id)['payload']
        Worker(ledger,GitHub(p),Git(),Codex(outcome()),Services()).dispatch(id)
    client=ASGIClient(create_app(ledger,bearer,'MBroholm/software-factory',202449424,{'OWNER_CONFIGURE_MODEL_ID'},dispatch))
    response=client.request(request['method'],request['path'],json=request.get('body'),headers={'Authorization':'Bearer '+bearer})
    print(json.dumps({'statusCode':response.status_code,'body':response.json(),'headers':{}}))
