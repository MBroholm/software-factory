"""Untrusted final output; only allowlisted public fields leave the runner."""
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from .config import diagnostic

SCHEMA=json.loads(Path(__file__).with_name('agent-result.json').read_text())
def validate_outcome(value):
    try:
        Draft202012Validator(SCHEMA).validate(value)
        kind=value['outcome']
        if (kind=='question')!=(value['question'] is not None): raise ValueError('question condition')
        if (kind=='stuck')!=(value['stuck_reason'] is not None): raise ValueError('stuck condition')
    except Exception as exc: raise ValueError('invalid structured agent outcome') from exc
    return value

def stuck(reason):
    return {'outcome':'stuck','summary':'Execution stopped without a reviewable result.','question':None,
      'checks':[],'unchecked_criteria':['Task acceptance remains unchecked.'],'stuck_reason':diagnostic(reason)}

def public_outcome(value,secrets=()):
    validate_outcome(value)
    def clean(v):
        if isinstance(v,str): return diagnostic(v,secrets)
        if isinstance(v,list): return [clean(x) for x in v]
        if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
        return v
    return clean(value)
