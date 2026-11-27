"""Strict wire contracts, canonical hashes and stable authorization identities."""
import hashlib
import json
import uuid
from jsonschema import Draft202012Validator

MAX_BODY = 256 * 1024
NAMESPACE = uuid.UUID('7b3a320e-4a24-5880-9c85-067c9f68b3da')

def canonical(value): return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
def digest(value): return hashlib.sha256((value if isinstance(value,str) else canonical(value)).encode()).hexdigest()
def attempt_uuid(payload):
    return str(uuid.uuid5(NAMESPACE, f"{payload['repository']}:{payload['issue_number']}:{payload['authorization']['id']}"))
def obj(props, required=None):
    return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
def string(size=8192): return {'type':'string','minLength':1,'maxLength':size}
def array(items, maximum=1000): return {'type':'array','items':items,'maxItems':maximum}
INT={'type':'integer','minimum':1}
SHA={'type':'string','pattern':'^[a-f0-9]{40}$'}
HASH={'type':'string','pattern':'^[a-f0-9]{64}$'}
NULLABLE=lambda schema:{'anyOf':[schema,{'type':'null'}]}
AUTH=obj({'id':string(160),'kind':{'enum':['initial','answer','retry','rework']},
 'initial_approval_event':INT,'approved_entered_at':{'type':'string','format':'date-time'},'references':array(INT,100),'approval_event':INT},['id','kind','initial_approval_event','approved_entered_at','references'])
SOURCE=obj({'refinement_comment_id':INT,'refinement_body_sha256':HASH,'source_digest':HASH,
 'specification_digest':HASH,'captured_comment_ids':array(INT)})
DISCUSSION=obj({'id':INT,'body':string(32768),'body_sha256':HASH})
MANIFEST=obj({'task':obj({'repository':string(200),'issue_number':INT}),'predecessor':NULLABLE(string(36)),'branch':string(100),'base_sha':SHA,'head_sha':SHA,'status_hash':HASH,'patch_hash':HASH,'artifacts':array(string(1024),100)})
CONTINUATION=obj({'question':obj({'id':string(40),'text':string(4096),'context':string(4096),'comment_id':INT,'body_sha256':HASH,'created_at':{'type':'string','format':'date-time'}}),
 'answer':obj({'id':INT,'body':string(32768),'text':string(8192),'body_sha256':HASH,'created_at':{'type':'string','format':'date-time'},'updated_at':{'type':'string','format':'date-time'}})})
CLAIM=obj({'authorization_id':string(160),'predecessor':string(36),'initial_approval_event':INT,'source':SOURCE,'continuation':CONTINUATION})
RESERVATION=obj({'contract_version':{'const':1},'repository':string(200),'issue_number':INT,
 'owner_author_id':INT,'authorization':AUTH,'source':SOURCE,'specification':string(131072),
 'discussion':array(DISCUSSION),'predecessor':NULLABLE(string(36)),'manifest':NULLABLE(MANIFEST),
 'branch':string(100),'base_sha':SHA,'model_config':string(100),'continuation':CONTINUATION,'history':array(CONTINUATION,100)},['contract_version','repository','issue_number','owner_author_id','authorization','source','specification','discussion','predecessor','manifest','branch','base_sha','model_config'])
START=obj({'generation':INT,'building':obj({'issue_number':INT,'state':{'const':'Building'},'source_digest':HASH,'marker_comment_id':INT})})
CANCELLATION=obj({'reason':string(512),'closure_reference':string(512)})
# External references are typed/allowlisted per effect rather than arbitrary unbounded objects.
EXTERNAL=obj({'number':INT,'sha':SHA,'state':{'enum':['Your QA','Waiting for you','Stuck','Done','Building','Ideas']},
 'issue_number':INT,'comment_id':INT,'unit_name':string(100),'invocation_id':string(100),'boot_id':string(100)},[])
CONTENT=obj({'body':string(131072),'sha':SHA,'state':{'enum':['Your QA','Waiting for you','Stuck','Done','Building','Ideas']},
 'head':string(100),'base':{'const':'main'},'title':string(200),'marker':string(8192)},[])
EFFECT=obj({'phase':{'enum':['intent','confirmed','unknown']},'content':CONTENT,'external':NULLABLE(EXTERNAL)})
STOP=obj({'cgroup_empty':{'const':True},'unit_name':string(100),'boot_id':string(100),'invocation_id':string(100)},['cgroup_empty'])
RELEASE=obj({'generation':INT,'stopped_proof':STOP,'publication':obj({'state':{'enum':['Your QA','Waiting for you','Stuck','Done','Building','Ideas']},'pr_number':INT},['state'])})
SCHEMAS={'answer':CLAIM,'reservation':RESERVATION,'start':START,'cancellation':CANCELLATION,'effect':EFFECT,'release':RELEASE}

def validate(kind, value):
    try:
        Draft202012Validator(SCHEMAS[kind],format_checker=Draft202012Validator.FORMAT_CHECKER).validate(value)
        if len(canonical(value).encode()) > MAX_BODY: raise ValueError('context too large')
        if kind=='reservation':
            a=value['authorization']
            if a['kind']=='initial':
                if a['id']!=f"initial:{value['issue_number']}:{a['initial_approval_event']}" or a['references']!=[a['initial_approval_event']] or 'approval_event' in a or 'continuation' in value or 'history' in value or value['predecessor'] is not None or value['manifest'] is not None:
                    raise ValueError('initial authorization identity mismatch')
            elif a['kind']=='answer':
                q=value['continuation']['question'];answer=value['continuation']['answer']
                if q['id']!=value['predecessor']+'-q1' or a['id']!=f"answer:{q['id']}:{answer['id']}" or a['references']!=[a['initial_approval_event'],answer['id']] or not a.get('approval_event') or not value['manifest']:
                    raise ValueError('answer lineage mismatch')
                from .questions import parse_answer
                parsed=parse_answer(answer['body'],q['id'])
                if parsed['scope']!='unchanged' or parsed['text']!=answer['text'] or digest(answer['body'])!=answer['body_sha256'] or answer['created_at']!=answer['updated_at']:
                    raise ValueError('invalid captured answer')
            else: raise ValueError('unsupported authorization kind')
            if value['branch']!=f"issue-{value['issue_number']}": raise ValueError('branch mismatch')
            if digest(value['specification'])!=value['source']['specification_digest']: raise ValueError('specification digest mismatch')
            for c in value['discussion']:
                if digest(c['body'])!=c['body_sha256']: raise ValueError('discussion digest mismatch')
    except Exception as exc:
        raise ValueError('invalid '+kind+' contract') from exc
    return value
