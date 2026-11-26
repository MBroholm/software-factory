"""Build one manually imported, isolated n8n test workflow from the three guard exports."""
import copy
import hashlib
import json
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

ROOT = Path(__file__).resolve().parents[2]
CONTROL = 'I1JBIePgy75Ecnlp'
EFFECTS = '8fCAvfPK5z11XeRJ'
NODES, EDGES, SOURCES = [], {}, {}
CASES = ['G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09',
         'G10', 'G11', 'G12', 'G13', 'G14_DELAY', 'G15', 'G16']


def identity(name):
    return str(uuid5(NAMESPACE_URL, 'basic-a-isolated-test-bridge/' + name))


def node(name, kind, parameters, x, y, version=2, **extra):
    item = dict(id=identity(name), name=name, type='n8n-nodes-base.' + kind,
                typeVersion=version, parameters=parameters, position=[x, y], **extra)
    NODES.append(item)
    return item


def link(source, target, branch=0):
    out = EDGES.setdefault(source, {'main': []})['main']
    while len(out) <= branch:
        out.append([])
    out[branch].append(dict(node=target, type='main', index=0))


def code(name, source, x, y):
    return node(name, 'code', dict(mode='runOnceForAllItems', jsCode=source), x, y)


def webhook(name, method, path, x, y):
    return node(name, 'webhook', dict(httpMethod=method, path=path, responseMode='lastNode',
                options={}), x, y, version=2.1, webhookId=identity(name))


def conditional(name, expression, x, y):
    return node(name, 'if', {'conditions': {'options': {'caseSensitive': True, 'leftValue': '',
        'typeValidation': 'strict', 'version': 2}, 'conditions': [{'id': identity(name),
        'leftValue': '={{ ' + expression + ' }}', 'rightValue': True,
        'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}],
        'combinator': 'and'}, 'options': {}}, x, y, version=2.2)


def table(name, operation, table_id, x, y, values=None, conditions=None, limit=100):
    params = dict(resource='row', operation=operation,
                  dataTableId={'__rl': True, 'mode': 'id', 'value': table_id},
                  matchType='allConditions', filters={'conditions': conditions or []})
    if operation == 'get':
        params.update(returnAll=False, limit=limit)
    elif operation != 'deleteRows':
        params['columns'] = dict(mappingMode='defineBelow', value=values, matchingColumns=[],
            schema=[dict(id=k, displayName=k, required=False, defaultMatch=False, display=True,
                         type='boolean' if k == 'busy' else 'number' if k == 'issue_number' else 'string',
                         canBeUsedToMatch=True) for k in values],
            attemptToConvertTypes=False, convertFieldsToString=False)
    params['options'] = {}
    return node(name, 'dataTable', params, x, y, version=1.1, alwaysOutputData=True)


for index, workflow in enumerate(['refine', 'reserve', 'track']):
    path = ROOT / f'factory/workflows/{workflow}.json'
    SOURCES[workflow] = hashlib.sha256(path.read_bytes()).hexdigest()
    original = json.loads(path.read_text())
    prefix = workflow + ': '
    entry = prefix + 'Test entry'
    body = "$('" + entry + "').first().json.body"
    case = '(' + body + '.case)'
    y = index * 800
    webhook(entry, 'POST', 'basic-a-guard-test/' + workflow, -700, y)
    code(prefix + 'Validate test request', f'''const body = {body};
if (!body || !{json.dumps(CASES)}.includes(body.case)) throw new Error('Unknown isolated test case');
return $input.all();''', -450, y)
    link(entry, prefix + 'Validate test request')
    link(prefix + 'Validate test request', prefix + 'Read control')
    kept = {n['name'] for n in original['nodes'] if n['type'].split('.')[-1]
            not in ('manualTrigger', 'scheduleTrigger', 'stickyNote')}
    for raw in original['nodes']:
        if raw['name'] not in kept:
            continue
        n = copy.deepcopy(raw)
        old_name = n['name']
        n['name'], n['id'] = prefix + old_name, identity(prefix + old_name)
        n['position'][1] += y
        if n['type'].endswith('.dataTable'):
            n['parameters']['dataTableId']['value'] = CONTROL
            fault = {'Acquire control': 'G07', 'Read acquired control': 'G09',
                     'Release control': 'G11', 'Read released control': 'G13'}.get(old_name)
            if fault:
                n['parameters']['dataTableId']['value'] = (
                    '={{ ' + case + ' === ' + json.dumps(fault) +
                    ' ? "INTENTIONALLY_MISSING_GUARD_TEST_TABLE" : "' + CONTROL + '" }}')
        if n['type'].endswith('.code'):
            src = n['parameters']['jsCode']
            for ref in kept:
                src = src.replace("$('" + ref + "')", "$('" + prefix + ref + "')")
            if old_name == 'Skeleton work boundary':
                src = f'''const testCase = {case};
if (['G04','G05'].includes(testCase)) throw new Error('injected ' + testCase + ' {workflow} boundary fault');
if (testCase === 'G10') return [{{json:{{outcome:'success',acknowledged:false}}}}];
return [{{json:{{outcome:testCase === 'G02' ? 'success' : 'no_work',acknowledged:true}}}}];'''
            if old_name == 'Check acquire receipt':
                src = src.replace('const rows = $input.all().map(item => item.json);',
                    f"const rows = {case} === 'G08' ? [{{}}] : $input.all().map(item => item.json);")
            if old_name == 'Check release receipt':
                src = f"if ({case} === 'G12') throw new Error('injected lost release acknowledgement');\n" + src
            if old_name == 'Verify release ownership':
                src = src.replace('const row = rows[0];',
                    f"const row = rows[0];\nif ({case} === 'G16') row.execution_id = 'injected-other-execution';")
            n['parameters']['jsCode'] = src
        NODES.append(n)
    for source, channels in original['connections'].items():
        if source not in kept:
            continue
        for branch, targets in enumerate(channels['main']):
            for target in targets:
                if target['node'] in kept:
                    link(prefix + source, prefix + target['node'], branch)
    # Actual persistent effect on only the post-effect case, before the original work boundary.
    EDGES[prefix + 'Verify acquisition'] = {'main': [[]]}
    delay = prefix + 'Optional crash window'
    code(delay, f'''if ({case} === 'G14_DELAY') await new Promise(resolve => setTimeout(resolve, 30000));
return $input.all();''', 1850, y)
    link(prefix + 'Verify acquisition', delay)
    choose = prefix + 'Post-effect case'
    conditional(choose, case + " === 'G05'", 1950, y)
    link(delay, choose)
    effect = prefix + 'Insert test effect'
    table(effect, 'insert', EFFECTS, 2100, y - 200,
          {'case_id': '={{ "G05-' + workflow + '-" + String($execution.id) }}'})
    link(choose, effect, 0)
    link(choose, prefix + 'Skeleton work boundary', 1)
    link(effect, prefix + 'Skeleton work boundary')

# Read-only state endpoint, using native Data Table nodes rather than internal SQL.
webhook('Read test state', 'GET', 'basic-a-guard-test/state', -700, 2600)
table('Read fixture control', 'get', CONTROL, -450, 2600)
code('Capture fixture control', 'return [{json:{control:$input.all().map(x=>x.json).filter(x=>Number.isInteger(x.id))}}];', -200, 2600)
table('Read fixture effects', 'get', EFFECTS, 50, 2600)
code('Report test state', "return [{json:{control:$('Capture fixture control').first().json.control,effects:$input.all().map(x=>x.json).filter(x=>Number.isInteger(x.id))}}];", 300, 2600)
for a, b in zip(['Read test state','Read fixture control','Capture fixture control','Read fixture effects'],
                ['Read fixture control','Capture fixture control','Read fixture effects','Report test state']):
    link(a, b)

# Explicit operator fixture requests. No reset is attached to a failing test or finally path.
webhook('Operator fixture request', 'POST', 'basic-a-guard-test/fixture', -700, 3100)
code('Validate fixture request', '''const b = $input.first().json.body;
if (!b || !['update','insert','delete'].includes(b.action) || typeof b.reason !== 'string' || !b.reason.trim())
  throw new Error('Explicit operator action/reason required');
if (b.action !== 'insert' && (!Number.isInteger(b.id) || b.id < 1)) throw new Error('Fixture row ID required');
if (b.action !== 'delete') {
  const r=b.row;
  if (!r || typeof r.key !== 'string' || typeof r.busy !== 'boolean' ||
      typeof r.execution_id !== 'string' || typeof r.started_at !== 'string' ||
      !(r.issue_number === null || Number.isInteger(r.issue_number))) throw new Error('Invalid fixture types');
}
return [{json:b}];''', -450, 3100)
link('Operator fixture request', 'Validate fixture request')
conditional('Fixture update?', "$json.action === 'update'", -200, 3100)
conditional('Fixture insert?', "$json.action === 'insert'", 50, 3350)
link('Validate fixture request', 'Fixture update?')
link('Fixture update?', 'Fixture insert?', 1)
values = {k: '={{ $json.row.' + k + ' }}' for k in ['key','busy','execution_id','issue_number','started_at']}
condition = [{'keyName':'id','condition':'eq','keyValue':'={{ $json.id }}'}]
table('Operator update fixture', 'update', CONTROL, 300, 3000, values, condition)
table('Operator insert fixture', 'insert', CONTROL, 300, 3250, values)
table('Operator delete fixture', 'deleteRows', CONTROL, 300, 3500, conditions=condition)
link('Fixture update?', 'Operator update fixture', 0)
link('Fixture insert?', 'Operator insert fixture', 0)
link('Fixture insert?', 'Operator delete fixture', 1)
for name in ['Operator update fixture','Operator insert fixture','Operator delete fixture']:
    link(name, 'Report fixture acknowledgement')
code('Report fixture acknowledgement', "return [{json:{action:$('Validate fixture request').first().json.action,reason:$('Validate fixture request').first().json.reason,rows:$input.all().map(x=>x.json)}}];", 650, 3250)

node('ISOLATED TEST BRIDGE — REVIEW BEFORE IMPORT', 'stickyNote', {'content':
     '## Test-only native n8n bridge\nOwner manually imports and publishes in factory-guard-test ONLY. '
     'No schedules or credentials. Loopback-only access. Fixed test control/effects table IDs. '
     'Fault requests run the three copied guard paths. Fixture endpoints modify/delete ONLY disposable '
     'test control rows on explicit operator requests; never connected to automatic error recovery. '
     'Unpublish after tests. See factory/tests/guard-bridge.md.', 'height': 300, 'width': 700},
     -700, -550, version=1)
output = dict(name='Basic A — ISOLATED guard validation bridge', active=False, nodes=NODES,
              connections=EDGES, settings={'executionOrder':'v1','timezone':'Europe/Copenhagen',
              'saveDataErrorExecution':'all','saveDataSuccessExecution':'all','saveManualExecutions':True},
              pinData={})
(ROOT / 'factory/tests/guard-bridge.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n')
(ROOT / 'factory/tests/guard-bridge-sources.json').write_text(json.dumps(SOURCES, indent=2)+'\n')
print(f'Built one inactive test-only workflow: {len(NODES)} nodes, {len(EDGES)} connected sources')
