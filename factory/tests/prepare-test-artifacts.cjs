// Rebuild disposable offline inputs from tracked sources; never import or call n8n.
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const args=process.argv.slice(2),allowed=new Set(['--check','--mapped','--env','--basic-b']);
for(let i=0;i<args.length;i++){
 if(!allowed.has(args[i]))throw Error('Usage: node factory/tests/prepare-test-artifacts.cjs [--check] [--mapped] [--env PATH]');
 if(args[i]==='--env'&&(!args[++i]||args[i].startsWith('--')))throw Error('--env requires a path');
}
if(args.includes('--basic-b')){
 const fs=require('node:fs'),{parseEnv}=require('node:util'),{createHash}=require('node:crypto');
 const index=args.indexOf('--env');if(index<0)throw Error('--basic-b requires --env with explicit isolated destinations');
 const config=parseEnv(fs.readFileSync(args[index+1],'utf8')),files={};
 const hash=s=>createHash('sha256').update(s).digest('hex');
 const manifest={target:'test',active:false,live_isolation_verified:false,workflows:{}};
 for(const name of ['refine','reserve','track','collect']){
  const source=fs.readFileSync(`factory/workflows/${name}.json`,'utf8'),graph=JSON.parse(source);
  const mapped=require('./test-artifacts.cjs').basicB(graph,config),content=JSON.stringify(mapped,null,2)+'\n';
  files[name+'.json']=content;
  manifest.workflows[name]={source_sha256:hash(source),mapped_sha256:hash(content),deltas:graph.nodes.flatMap((n,i)=>JSON.stringify(n)===JSON.stringify(mapped.nodes[i])?[]:[{node:n.name,before:n,after:mapped.nodes[i]}])};
 }
 files['manifest.json']=JSON.stringify(manifest,null,2)+'\n';
 const out='factory/local/basic-b-test';
 if(!args.includes('--check'))fs.mkdirSync(out,{recursive:true,mode:0o700});
 for(const [name,content]of Object.entries(files)){
  if(args.includes('--check')){if(fs.readFileSync(out+'/'+name,'utf8')!==content)throw Error('Stale Basic B test copy '+name);}
  else fs.writeFileSync(out+'/'+name,content,{mode:0o600});
 }
 console.log('Prepared four inactive Basic B copies with hashes/deltas. No imports or live isolation claim.');
 process.exit(0);
}
// Validate requested mapping before generating any artifacts.
require('./test-artifacts.cjs').mapping('US1',args);
const root=path.resolve(__dirname,'../..');
const run=(file,options=[])=>execFileSync(process.execPath,['factory/'+file,...options],{cwd:root,stdio:'inherit'});
for(const name of ['refine','reserve','track'])run(`scripts/build-${name}.cjs`,['--check']);
run('tests/check-refinement.cjs',['--native-fixtures']);
run('tests/check-reservation.cjs',['--native-fixtures']);
run('tests/check-tracking.cjs',['--fixtures']);
run('tests/tracking-cases.cjs');
run('tests/build-refinement-bridge.cjs',args);
run('tests/build-reservation-bridge.cjs',[...args,'--native-fixtures']);
run('tests/build-refinement-schedule.cjs',args);
run('tests/build-reservation-schedule.cjs',args);
run('tests/build-tracking-test.cjs',args);
console.log('Offline test inputs ready. Native import/execution still requires fresh isolation verification.');
