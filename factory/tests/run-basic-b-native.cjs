// Local fake fixtures and optional read-only installed n8n VM. Never imports workflows.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const args=process.argv.slice(2);let nativeRoot,remoteVM=false;
for(let i=0;i<args.length;i++){if(args[i]==='--n8n-root'&&args[i+1])nativeRoot=path.resolve(args[++i]);else if(args[i]==='--remote-vm')remoteVM=true;else throw Error('Usage: node factory/tests/run-basic-b-native.cjs [--n8n-root PATH | --remote-vm]');}
const out='factory/local/basic-b-native';fs.mkdirSync(out,{recursive:true});
const report={revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),versions:{node:process.version},mode:'local-fake-adapters',native:nativeRoot||remoteVM?'requested':'not run: provide --n8n-root for installed 2.48.8',checks:[],hashes:{},concurrency:'Deployment workflow concurrency=1 must be verified before any scheduled import/execution; offline graphs cannot prove instance settings.'};
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const dir of ['factory/scripts','factory/workflows','factory/tests','factory/runner/factory_runner'])for(const name of fs.readdirSync(dir).sort()){
 const file=dir+'/'+name;if(fs.statSync(file).isFile())report.hashes[file]=hash(fs.readFileSync(file));
}
function run(command,argv,input){const r=spawnSync(command,argv,{encoding:'utf8',input,timeout:300000});report.checks.push({command:[command,...argv].join(' '),status:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});fs.writeFileSync(out+'/validation.json',JSON.stringify(report,null,2)+'\n');process.stdout.write(r.stdout||'');if(r.status!==0)throw Error(r.stderr||r.error?.message||'Validation failed');}
for(const name of ['refine','reserve','track','collect'])run(process.execPath,[`factory/scripts/build-${name}.cjs`,'--check']);
for(const [file,options]of [['check-basic-b-preparation.cjs',[]],['check-refinement.cjs',[]],['check-reservation.cjs',['--policy-only']],['check-tracking.cjs',[]],['basic-b-execution.cjs',[]],['basic-b-questions.cjs',[]],['basic-b-review.cjs',[]],['basic-b-workflows.cjs',['--recovery','--review','--native-fixtures']]])run(process.execPath,['factory/tests/'+file,...options]);
for(const name of ['refine','reserve','track','collect']){
 const graph=JSON.parse(fs.readFileSync(`factory/workflows/${name}.json`));if(graph.active)throw Error('Source must remain inactive');
 for(const n of graph.nodes)if(!(n.type.endsWith('.stickyNote')?n.parameters.content?.trim():n.notes?.trim()))throw Error('Missing node notes '+n.name);
 if(!graph.nodes.some(n=>n.type.endsWith('.stickyNote')&&/^\d+\./.test(n.name)))throw Error('Missing numbered stages');
 if(nativeRoot)run(process.execPath,['factory/tests/check-basic-b-native-expressions.cjs',nativeRoot],fs.readFileSync(`${out}/${name}-expressions.json`,'utf8'));
}
if(nativeRoot)run(process.execPath,['factory/tests/check-refinement-native-waits.cjs',nativeRoot]);
if(remoteVM)run('python3',['factory/tests/run-basic-b-us1-expressions.py','--waits']);
report.native=nativeRoot||remoteVM?'passed: n8n 2.48.8 VM, pagination and Wait checks':report.native;
report.test_copy_deltas='No imported copies; synthetic parameter contexts only. prepare-test-artifacts.cjs --basic-b records mapped-copy deltas separately.';
fs.writeFileSync(out+'/validation.json',JSON.stringify(report,null,2)+'\n');
console.log('Local validation recorded. Native status: '+report.native);
