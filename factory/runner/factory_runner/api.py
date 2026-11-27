"""Bounded authenticated API. Dispatch is quick; coding never runs in this process."""
import hmac
import json
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .contracts import MAX_BODY, validate
from .ledger import Conflict, Missing

def create_app(ledger, bearer, repository, owner_id, models, dispatch=None, ready=None, observe=None, github=None):
    if len(bearer)<32: raise ValueError('bearer too short')
    app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)
    class Boundary:
        def __init__(self, app): self.app=app
        async def __call__(self, scope, receive, send):
            if scope['type']!='http': return await self.app(scope,receive,send)
            headers=dict(scope.get('headers',[]))
            if not hmac.compare_digest(headers.get(b'authorization',b''), ('Bearer '+bearer).encode()):
                return await JSONResponse({'error':'unauthorized'},401)(scope,receive,send)
            chunks=[]; size=0
            while True:
                msg=await receive()
                if msg['type']=='http.disconnect': return
                chunk=msg.get('body',b''); size+=len(chunk)
                if size>MAX_BODY:
                    return await JSONResponse({'error':'body too large'},413)(scope,receive,send)
                chunks.append(chunk)
                if not msg.get('more_body',False): break
            delivered=False
            async def replay():
                nonlocal delivered
                if not delivered:
                    delivered=True
                    return {'type':'http.request','body':b''.join(chunks),'more_body':False}
                return await receive()
            await self.app(scope,replay,send)
    app.add_middleware(Boundary)
    def response(status,data): return JSONResponse(data,status)
    def unique_object(pairs):
        value={}
        for key,item in pairs:
            if key in value: raise ValueError('duplicate JSON key')
            value[key]=item
        return value
    async def body(request,kind):
        try: return validate(kind,json.loads(await request.body(),object_pairs_hook=unique_object))
        except Exception: raise ValueError('invalid contract') from None
    def identity(id):
        try:
            if str(uuid.UUID(id))!=id: raise ValueError()
        except Exception: raise ValueError('invalid attempt UUID') from None
    @app.exception_handler(ValueError)
    async def bad(request,exc): return response(422,{'error':str(exc)[:200]})
    @app.exception_handler(Conflict)
    async def conflict(request,exc): return response(409,{'error':str(exc)[:200]})
    @app.exception_handler(Missing)
    async def missing(request,exc): return response(404,{'error':'unknown attempt; reconcile before replacement'})
    @app.get('/v1/health')
    async def health():
        s=ledger.slot(); ok=not s['hold_reason'] and (ready() if ready else s['attempt_id'] is None)
        return response(200 if ok else 503,{'healthy':ok})
    @app.get('/v1/questions')
    async def questions(): return ledger.questions()
    @app.put('/v1/attempts/{id}/answer')
    async def answer(id,request:Request):
        identity(id); claim=await body(request,'answer')
        if github is None: return response(503,{'error':'independent source verifier unavailable'})
        a=ledger.get(id)
        try: github.verify_answer(a,claim)
        except Exception: raise Conflict('current answer/source cannot be confirmed') from None
        return ledger.claim_answer(id,claim)
    @app.get('/v1/slot')
    async def slot(): return ledger.slot()
    @app.get('/v1/attempts/{id}')
    async def read(id):
        identity(id)
        if observe: observe(id)
        return ledger.get(id)
    @app.put('/v1/attempts/{id}/reservation')
    async def reserve(id,request:Request):
        identity(id); p=await body(request,'reservation')
        if p['repository']!=repository or p['owner_author_id']!=owner_id or p['model_config'] not in models: raise ValueError('target/model not allowed')
        if ready is not None and not ready(): raise Conflict('startup reconciliation required')
        status,a=ledger.reserve(id,p); return response(status,{**a,'generation':ledger.slot()['generation']})
    @app.post('/v1/attempts/{id}/start')
    async def start(id,request:Request):
        identity(id); status,a=ledger.accept(id,await body(request,'start'))
        if status==202 and dispatch:
            try: dispatch(id)
            except Exception:
                ledger.hold(id,'dispatch acknowledgement unknown')
                return response(503,{'error':'accepted; dispatch unknown; reconcile same attempt'})
        return response(status,a)
    @app.put('/v1/attempts/{id}/cancellation')
    async def cancel(id,request:Request):
        identity(id); status,a=ledger.cancel(id,await body(request,'cancellation')); return response(status,a)
    @app.put('/v1/attempts/{id}/effects/{kind}')
    async def effect(id,kind,request:Request): identity(id); return ledger.effect(id,kind,await body(request,'effect'))
    @app.post('/v1/attempts/{id}/release')
    async def release(id,request:Request): identity(id); return ledger.release(id,await body(request,'release'))
    return app
