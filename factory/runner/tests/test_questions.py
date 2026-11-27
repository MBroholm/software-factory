import concurrent.futures
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from support import payload, outcome, Clock, GitHub, Git, Codex, Services, ASGIClient
from factory_runner.contracts import attempt_uuid, digest
from factory_runner.ledger import Ledger, Conflict
from factory_runner.worker import Worker
from factory_runner.questions import parse_answer, question_body, answer_claim

class Questions(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.ledger=Ledger(Path(self.tmp.name)/'db',Clock());self.p=payload();self.id=attempt_uuid(self.p)
        self.ledger.reserve(self.id,self.p)
        self.ledger.accept(self.id,{'generation':1,'building':{'issue_number':1,'state':'Building','source_digest':self.p['source']['source_digest'],'marker_comment_id':77}})
        result=outcome();result.update(outcome='question',question={'text':'Which format?','context':'Choose approved format.'})
        worker=Worker(self.ledger,GitHub(self.p),Git(),Codex(result),Services());worker.dispatch(self.id);worker.run(self.id)
        self.a=self.ledger.get(self.id);self.qid=self.id+'-q1'
        self.question={'id':80,'body':question_body(self.a),'user':{'id':7},'created_at':'2026-11-27T11:00:00Z','updated_at':'2026-11-27T11:00:00Z'}
        self.answer={'id':90,'body':f'answer {self.qid}: Use JSON.\nscope: unchanged','user':{'id':7},'created_at':'2026-11-27T12:00:00Z','updated_at':'2026-11-27T12:00:00Z'}
    def release_question(self):
        for kind,content,external in [('comment',{'body':question_body(self.a)},{'comment_id':80}),('state',{'state':'Waiting for you'},{'state':'Waiting for you','issue_number':1})]:
            self.ledger.effect(self.id,kind,{'phase':'intent','content':content,'external':None})
            self.ledger.effect(self.id,kind,{'phase':'confirmed','content':content,'external':external})
        self.ledger.release(self.id,{'generation':1,'stopped_proof':self.a['result']['stopped_proof'],'publication':{'state':'Waiting for you'}})
    def claim(self,comments=None):
        self.release_question()
        claim=answer_claim(self.a,[self.question,self.answer] if comments is None else comments,7)
        return self.ledger.claim_answer(self.id,claim)
    def test_question_persisted_with_trusted_identity_and_single_claim(self):
        self.assertEqual(self.a['question']['id'],self.qid)
        self.assertIn(f'answer {self.qid}: <your answer>\nscope: unchanged',question_body(self.a))
        claim=self.claim();self.assertEqual(claim['continuation']['answer']['text'],'Use JSON.')
        self.assertEqual(self.ledger.claim_answer(self.id,claim),claim)
        self.assertEqual(self.ledger.questions()[0]['question']['claim'],claim)
    def test_grammar_authorship_freshness_and_ambiguity(self):
        for change in ({'body':f'answer {self.qid}: \nscope: unchanged'}, {'body':f'answer wrong: yes\nscope: unchanged'}, {'body':self.answer['body']+'\n'},
          {'body':f'answer {self.qid}: yes'}, {'body':f'answer {self.qid}: yes\nscope: changed'},
          {'user':{'id':8}}, {'updated_at':'2026-11-27T13:00:00Z'}, {'created_at':'2026-11-27T10:00:00Z'}):
            with self.subTest(change=change),self.assertRaises(ValueError):
                answer_claim(self.a,[self.question,{**self.answer,**change}],7)
        with self.assertRaises(ValueError):answer_claim(self.a,[self.question,self.answer,{**self.answer,'id':91}],7)
        with self.assertRaises(ValueError):answer_claim(self.a,[self.answer],7)
        with self.assertRaises(ValueError):answer_claim(self.a,[{**self.question,'body':self.question['body']+'edited'},self.answer],7)
        with self.assertRaises(ValueError):answer_claim(self.a,[self.question,{**self.answer,'body':'<!-- factory:answer:v2 {} -->\n'+self.answer['body']}],7)
    def test_concurrent_consumption_and_immutable_continuation(self):
        claim=self.claim();p=self.ledger.continuation_payload(self.id,'2026-11-27T13:00:00Z',101)
        id=attempt_uuid(p)
        with concurrent.futures.ThreadPoolExecutor(5) as pool:
            results=list(pool.map(lambda _:self.ledger.reserve(id,p)[0],range(5)))
        self.assertEqual(results.count(201),1);self.assertEqual(results.count(200),4)
        self.assertEqual(self.ledger.get(id)['payload']['specification'],self.p['specification'])
        self.assertEqual(p['predecessor'],self.id);self.assertEqual(p['manifest'],self.a['result']['manifest'])
        self.ledger.accept(id,{'generation':2,'building':{'issue_number':1,'state':'Building','source_digest':p['source']['source_digest'],'marker_comment_id':110}})
        agent=Codex(outcome());worker=Worker(self.ledger,GitHub(p),Git(),agent,Services());worker.dispatch(id);worker.run(id)
        self.assertIn('Which format?',agent.prompts[0]);self.assertIn('Use JSON.',agent.prompts[0])
        self.assertIn(self.p['specification'],agent.prompts[0]);self.assertNotEqual(id,self.id)
        forged=deepcopy(p);forged['continuation']['answer']['text']='Expanded scope'
        with self.assertRaises((Conflict,ValueError)):self.ledger.reserve(attempt_uuid(forged),forged)
    def test_claim_requires_released_stopped_predecessor_and_unchanged_source(self):
        c=answer_claim(self.a,[self.question,self.answer],7)
        with self.assertRaises(Conflict):self.ledger.claim_answer(self.id,c)
        self.release_question();self.ledger.claim_answer(self.id,c)
        p=self.ledger.continuation_payload(self.id,'2026-11-27T13:00:00Z',101)
        p['source']['source_digest']='e'*64
        with self.assertRaises(Conflict):self.ledger.reserve(attempt_uuid(p),p)
    def test_edited_or_competing_consumed_answer_rejected(self):
        claim=self.claim();changed=deepcopy(claim);changed['continuation']['answer']['body_sha256']='e'*64
        with self.assertRaises(Conflict):self.ledger.claim_answer(self.id,changed)
    def test_answer_cannot_be_initial_approval(self):
        self.assertEqual(parse_answer(self.answer['body'],self.qid)['scope'],'unchanged')
        p=deepcopy(self.p);p['authorization']['kind']='answer'
        with self.assertRaises(ValueError):self.ledger.reserve(attempt_uuid(p),p)
    def test_second_question_preserves_earlier_question_answer_history(self):
        self.claim();p=self.ledger.continuation_payload(self.id,'2026-11-27T13:00:00Z',101);id=attempt_uuid(p)
        self.ledger.reserve(id,p);self.ledger.accept(id,{'generation':2,'building':{'issue_number':1,'state':'Building','source_digest':p['source']['source_digest'],'marker_comment_id':110}})
        result=outcome();result.update(outcome='question',question={'text':'Which indentation?','context':'Keep the approved format.'})
        worker=Worker(self.ledger,GitHub(p),Git(),Codex(result),Services());worker.dispatch(id);worker.run(id);a=self.ledger.get(id)
        question={'id':120,'body':question_body(a),'user':{'id':7},'created_at':'2026-11-27T14:00:00Z','updated_at':'2026-11-27T14:00:00Z'}
        answer={'id':130,'body':f'answer {id}-q1: Two spaces.\nscope: unchanged','user':{'id':7},'created_at':'2026-11-27T15:00:00Z','updated_at':'2026-11-27T15:00:00Z'}
        for kind,content,external in [('comment',{'body':question_body(a)},{'comment_id':120}),('state',{'state':'Waiting for you'},{'state':'Waiting for you','issue_number':1})]:
            self.ledger.effect(id,kind,{'phase':'intent','content':content,'external':None});self.ledger.effect(id,kind,{'phase':'confirmed','content':content,'external':external})
        self.ledger.release(id,{'generation':2,'stopped_proof':a['result']['stopped_proof'],'publication':{'state':'Waiting for you'}})
        self.ledger.claim_answer(id,answer_claim(a,[question,answer],7))
        next=self.ledger.continuation_payload(id,'2026-11-27T16:00:00Z',140)
        self.assertEqual(next['history'],[p['continuation']]);self.assertEqual(next['continuation']['answer']['text'],'Two spaces.')
        self.ledger.reserve(attempt_uuid(next),next)
