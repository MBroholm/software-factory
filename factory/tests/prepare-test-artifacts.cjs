// Rebuild disposable offline inputs from tracked sources; never import or call n8n.
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const args=process.argv.slice(2),allowed=new Set(['--check','--mapped','--env']);
for(let i=0;i<args.length;i++){
 if(!allowed.has(args[i]))throw Error('Usage: node factory/tests/prepare-test-artifacts.cjs [--check] [--mapped] [--env PATH]');
 if(args[i]==='--env'&&(!args[++i]||args[i].startsWith('--')))throw Error('--env requires a path');
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
