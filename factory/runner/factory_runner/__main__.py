"""Explicit preflight, API and worker entry points. Never provision services."""
import argparse
import json
import os
from .config import Config, preflight, secret
from .ledger import Ledger
from .services import Services
from .github import GitHub
from .git import Git
from .codex import Codex
from .worker import Worker

def main():
    os.umask(0o077)
    p=argparse.ArgumentParser(); p.add_argument('command',choices=['preflight','serve','worker'])
    p.add_argument('--config',required=True); p.add_argument('--attempt'); args=p.parse_args()
    c=Config.load(args.config); ledger=Ledger(c.database); services=Services()
    if args.command=='preflight':
        report=preflight(c,ledger); print(json.dumps(report)); return 0 if report['ok'] else 1
    worker=Worker(ledger,GitHub(c),Git(c),Codex(c),services,(secret(c.bearer_file),secret(c.github_token_file)))
    if args.command=='worker':
        if not args.attempt: p.error('--attempt required')
        worker.run(args.attempt); return 0
    # This increment refuses occupied-slot startup; full restart reconciliation is US3.
    report=preflight(c,ledger)
    if not report['ok']: print(json.dumps(report)); return 1
    from .api import create_app
    import uvicorn
    def observe(id):
        a=ledger.get(id)
        if a['result'] and not a['result']['stopped_proof']:
            try:
                proof=services.stopped(id)
                if proof.get('cgroup_empty'): ledger.confirm_stopped(id,proof)
            except Exception: ledger.hold(id,'stopped process evidence unknown')
    app=create_app(ledger,secret(c.bearer_file),c.repository,c.owner_id,{c.model_config},worker.dispatch,lambda:True,observe)
    uvicorn.run(app,host=c.bind,port=c.port,access_log=False)
    return 0

if __name__=='__main__': raise SystemExit(main())
