import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from support import payload, outcome
from factory_runner.contracts import digest, attempt_uuid, validate
from factory_runner.github import GitHub, jsjson
from factory_runner.config import Config, diagnostic, private
from factory_runner.git import Git
from factory_runner.codex import Codex

class GitHubContract(unittest.TestCase):
    def setUp(self):
        self.p=payload(); p=self.p
        issue={'number':1,'user':{'id':7},'state':'open','labels':[{'name':'Building'}],'title':'Fixture','body':'source'}
        source=jsjson({'title':issue['title'],'body':issue['body'],'owner_comments':[]})
        p['source']['source_digest']=digest(source)
        text=p['specification']; meta={'issue_number':1,'source_digest':digest(source),'captured_comment_ids':[],
          'last_included_owner_comment_id':0,'content_sha256':digest(text),'prompt_version':'v3','source_key':f'1:{digest(source)}:0:v3'}
        comment={'id':12,'user':{'id':7},'body':'<!-- factory:refinement:v1 '+jsjson(meta)+' -->\n'+text,
                 'created_at':'2026-11-27T09:00:00Z','updated_at':'2026-11-27T09:00:00Z'}
        p['source']['refinement_body_sha256']=digest(comment['body'])
        events=[{'id':42,'event':'labeled','label':{'name':'Approved'},'actor':{'id':7},'created_at':'2026-11-27T10:00:00Z'},
                {'id':43,'event':'unlabeled','label':{'name':'Approved'},'actor':{'id':7},'created_at':'2026-11-27T11:00:00Z'}]
        self.data={'issues/1':issue,'issues/1/comments?per_page=100&page=1':[comment],
                   'issues/1/events?per_page=100&page=1':events}
        marker={'id':13,'user':{'id':7},'body':'<!-- factory:attempt:v2 '+jsjson({'repository':p['repository'],'issue':1,'attempt':attempt_uuid(p),'initial_approval':42,'specification_digest':p['source']['specification_digest']})+' -->\nBuild',
          'created_at':'2026-11-27T11:00:00Z','updated_at':'2026-11-27T11:00:00Z'}
        self.data['issues/1/comments?per_page=100&page=1'].append(marker)
        self.gh=GitHub(SimpleNamespace(repository='test/fixture',owner_id=7),lambda path:self.data[path])
    def test_fresh_then_source_edited(self):
        self.assertTrue(self.gh.verify(self.p))
        self.data['issues/1']['body']='edited'
        with self.assertRaises(ValueError): self.gh.verify(self.p)
    def test_nonowner_and_ambiguous_approval(self):
        self.data['issues/1']['user']['id']=8
        with self.assertRaises(ValueError): self.gh.verify(self.p)
        self.data['issues/1']['user']['id']=7
        self.data['issues/1/events?per_page=100&page=1'][-1]['event']='labeled'
        with self.assertRaises(ValueError): self.gh.verify(self.p)
    def test_pagination_and_duplicate_detection(self):
        pages={'x?per_page=100&page=1':[{'id':i} for i in range(100)],'x?per_page=100&page=2':[{'id':100}]}
        self.gh.read=pages.__getitem__; self.assertEqual(len(self.gh.pages('x')),101)
        pages['x?per_page=100&page=2']=[{'id':0}]
        with self.assertRaises(ValueError): self.gh.pages('x')
    def test_canonical_authorization(self):
        p=payload(); p['authorization']['id']='another-id'
        with self.assertRaises(ValueError): validate('reservation',p)

class GitContract(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        root=Path(self.temp.name); checkout=root/'checkout'; checkout.mkdir()
        self.run_git(['init','-b','main'],checkout)
        self.run_git(['config','user.name','Fixture'],checkout); self.run_git(['config','user.email','fixture@example.invalid'],checkout)
        (checkout/'fixture.txt').write_text('base\n');self.run_git(['add','fixture.txt'],checkout);self.run_git(['commit','-m','fixture'],checkout)
        self.run_git(['remote','add','origin','https://github.com/test/fixture.git'],checkout)
        self.config=SimpleNamespace(checkout=checkout,work_root=root/'private',git_helper=root/'helper')
        self.config.work_root.mkdir();self.git=Git(self.config);self.p=payload()
        self.p['base_sha']=self.run_git(['rev-parse','HEAD'],checkout)
        # Fake network only; all worktree/status/ancestry/snapshot operations use actual Git.
        self.original=self.git.run
        def adapter(args,path=None,transport=False,check=True):
            if args[0]=='fetch':
                (checkout/'.git'/'FETCH_HEAD').write_text(self.p['base_sha']+'\n');return ''
            if args[0]=='ls-remote':return ''
            return self.original(args,path,transport,check)
        self.git.run=adapter
    def run_git(self,args,path):
        return subprocess.run(['git',*args],cwd=path,capture_output=True,text=True,check=True).stdout.strip()
    def test_worktree_attribution_dirty_snapshot_and_no_discard(self):
        id=attempt_uuid(self.p); path=self.git.prepare(self.p,id)
        (path/'fixture.txt').write_text('changed\n');(path/'new.txt').write_text('retained\n')
        manifest=self.git.snapshot(self.p,id); self.assertEqual(manifest['base_sha'],self.p['base_sha'])
        self.assertTrue((Path(manifest['artifacts'][0])/'changes.patch').read_text())
        with self.assertRaises(RuntimeError):self.git.push(self.p,id,manifest)
        self.assertEqual((path/'new.txt').read_text(),'retained\n')
        with self.assertRaises(RuntimeError):self.git.prepare(self.p,id)
    def test_empty_branch_refused(self):
        id=attempt_uuid(self.p);self.git.prepare(self.p,id);manifest=self.git.snapshot(self.p,id)
        with self.assertRaises(RuntimeError):self.git.push(self.p,id,manifest)
    def test_changed_remote_refused(self):
        id=attempt_uuid(self.p);path=self.git.prepare(self.p,id)
        self.run_git(['remote','set-url','origin','https://example.invalid/other.git'],path)
        with self.assertRaises(RuntimeError):self.git.push(self.p,id,self.git.snapshot(self.p,id))

class PrivateBoundary(unittest.TestCase):
    def test_diagnostic_canaries(self):
        text=diagnostic('raw secret-canary Bearer hidden github_pat_abc sk-secret',('secret-canary',))
        self.assertNotIn('secret-canary',text);self.assertNotIn('hidden',text);self.assertNotIn('github_pat_abc',text)
    def test_world_readable_config_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'config';p.write_text('');p.chmod(0o644)
            with self.assertRaises(ValueError): private(p)
    def test_codex_arguments_and_controlled_environment(self):
        with tempfile.TemporaryDirectory() as tmp:
            c=SimpleNamespace(work_root=Path(tmp),codex_home=Path(tmp)/'auth',model_id='explicit-model')
            captured={}
            class Pipe:
                def write(self,x): captured['prompt']=x
                def close(self): pass
            class Proc:
                stdin=Pipe()
                def __init__(self):
                    import io
                    self.stdout=io.BytesIO(b'bounded diagnostics')
                def wait(self):return 0
            def spawn(argv,**kwargs):
                captured.update(argv=argv,kwargs=kwargs)
                Path(argv[argv.index('--output-last-message')+1]).write_text(json.dumps(outcome()))
                return Proc()
            with patch('factory_runner.codex.subprocess.Popen',side_effect=spawn):
                Codex(c).run('approved input',Path(tmp),'attempt')
            self.assertEqual(captured['prompt'],b'approved input')
            self.assertIn('workspace-write',captured['argv']);self.assertIn('explicit-model',captured['argv'])
            self.assertNotIn('GITHUB_TOKEN',captured['kwargs']['env']);self.assertNotIn('resume',captured['argv'])
            self.assertIn('--ignore-user-config',captured['argv'])
    def test_packaged_schema_matches_reviewed_schema(self):
        root=Path(__file__).resolve().parents[1]
        self.assertEqual((root/'schemas/agent-result.json').read_bytes(),(root/'factory_runner/agent-result.json').read_bytes())
