"""Exact owner answer grammar and immutable question/answer lineage."""
import re
from datetime import datetime
from .contracts import digest
from .github import jsjson

def parse_answer(body,question_id):
    match=re.fullmatch(r'answer '+re.escape(question_id)+r': ([^\n]+(?:\n(?!scope:)[^\n]+)*)\nscope: (unchanged|changed)',body)
    if not match or not match[1].strip(): raise ValueError('matching answer and explicit scope line required')
    return {'text':match[1].strip(),'scope':match[2]}

def metadata(a):
    p=a['payload']
    return {'repository':p['repository'],'issue':p['issue_number'],'attempt':a['id'],
      'initial_approval':p['authorization']['initial_approval_event'],'specification_digest':p['source']['specification_digest']}

def question_body(a):
    q=a['result']['question'];qid=a['id']+'-q1'
    return '<!-- factory:question:v2 '+jsjson({**metadata(a),'question':qid,'result':a['result']['id']})+' -->\n## Question for owner\n\n'+q['text']+'\n\nDecision context: '+q['context']+'\n\nReply exactly:\n```text\nanswer '+qid+': <your answer>\nscope: unchanged\n```\n\nIf the answer expands scope, use scope: changed; refinement and renewed explicit owner approval are required.\n'

def answer_claim(a,comments,owner):
    qid=a['id']+'-q1';body=question_body(a)
    marked=[c for c in comments if c.get('body','').startswith('<!-- factory:question:v2') and qid in c['body']]
    if len(marked)!=1: raise ValueError('missing/competing question marker')
    q=marked[0]
    if q['body']!=body or q['user']['id']!=owner or q['created_at']!=q['updated_at']: raise ValueError('question changed or untrusted')
    candidates=[c for c in comments if c.get('user',{}).get('id')==owner and c.get('body','').startswith('answer '+qid+':') and datetime.fromisoformat(c['created_at'].replace('Z','+00:00'))>datetime.fromisoformat(q['created_at'].replace('Z','+00:00'))]
    if len(candidates)!=1: raise ValueError('missing/competing answers')
    c=candidates[0];answer=parse_answer(c['body'],qid)
    time=lambda s:datetime.fromisoformat(s.replace('Z','+00:00'))
    if answer['scope']!='unchanged' or c['created_at']!=c['updated_at'] or time(c['created_at'])<=time(q['created_at']): raise ValueError('answer changed, stale or scope expanded')
    return {'authorization_id':f"answer:{qid}:{c['id']}",'predecessor':a['id'],
      'initial_approval_event':a['payload']['authorization']['initial_approval_event'],'source':a['payload']['source'],
      'continuation':{'question':{'id':qid,'text':a['result']['question']['text'],'context':a['result']['question']['context'],
          'comment_id':q['id'],'body_sha256':digest(q['body']),'created_at':q['created_at']},
        'answer':{'id':c['id'],'body':c['body'],'text':answer['text'],'body_sha256':digest(c['body']),
                  'created_at':c['created_at'],'updated_at':c['updated_at']}}}
