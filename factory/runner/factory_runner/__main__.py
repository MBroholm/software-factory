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
    p=argparse.ArgumentParser(); p.add_argument('command',choices=['preflight','serve','worker','pause','drain','inspect','backup','restore','resume','reconcile-unissued-push'])
    p.add_argument('--bundle');p.add_argument('--owner-record');p.add_argument('--config',required=True); p.add_argument('--attempt'); args=p.parse_args()
    c=Config.load(args.config); ledger=Ledger(c.database); services=Services()
    if args.command=='preflight':
        report=preflight(c,ledger); print(json.dumps(report)); return 0 if report['ok'] else 1
    worker=Worker(ledger,GitHub(c),Git(c),Codex(c),services,(secret(c.bearer_file),secret(c.github_token_file)))
    if args.command in {'pause','drain','inspect','backup','restore','resume','reconcile-unissued-push'}:
        from .reconciler import Reconciler
        from .recovery import Recovery
        recovery=Recovery(ledger,c,Reconciler(ledger,services,worker.git))
        if args.command=='pause':report=recovery.pause()
        elif args.command=='inspect':report=recovery.inspect()
        elif args.command=='resume':report=recovery.resume()
        elif args.command=='reconcile-unissued-push':
            if not args.attempt:p.error('--attempt required')
            report=recovery.reconcile_unissued_push(args.attempt,args.owner_record)
        elif args.command=='drain':
            recovery.pause();recovery.reconciler.reconcile();report=recovery.inspect()
        else:
            if not args.bundle:p.error('--bundle required')
            report=recovery.backup(args.bundle) if args.command=='backup' else recovery.restore(args.bundle,args.owner_record)
        print(json.dumps(report));return 0
    if args.command=='worker':
        if not args.attempt: p.error('--attempt required')
        worker.run(args.attempt); return 0
    from .reconciler import Reconciler
    reconciler=Reconciler(ledger,services,worker.git)
    reconciler.reconcile()
    report=preflight(c,ledger,allow_occupied=True)
    if not report['ok']: print(json.dumps(report)); return 1
    from .api import create_app
    import uvicorn
    def observe(id): reconciler.reconcile(id)
    app=create_app(ledger,secret(c.bearer_file),c.repository,c.owner_id,{c.model_config},worker.dispatch,lambda:True,observe,github=GitHub(c))
    uvicorn.run(app,host=c.bind,port=c.port,access_log=False)
    return 0

if __name__=='__main__': raise SystemExit(main())
