// Synthetic T023 scenarios, shared by loopback HTTP and local packaging checks.
const fs=require('node:fs'),vm=require('node:vm');
function cases(base){
 const read=p=>fs.readFileSync(p,'utf8');
 const P=vm.runInNewContext(`(()=>{${read('factory/scripts/refinement-runtime.cjs').split('function analyze(')[0]}${read('factory/scripts/reservation-runtime.cjs').split('module.exports =')[0]}${read('factory/scripts/tracking-runtime.cjs').split('module.exports =')[0]}return {approval,handoff,trackingPlan};})()`);
 const seed=()=>JSON.parse(JSON.stringify({issues:[base.issue],comments:base.comments,events:base.events,pulls:base.prs,calls:[]}));
 const all={};const add=(name,edit=()=>{})=>{const s=seed();edit(s);all[name]=s;return s;};
 add('open-result');add('no-result',s=>s.pulls=[]);add('no-candidate',s=>s.issues=[]);
 add('merged',s=>Object.assign(s.pulls[0],{state:'closed',merged:true,merged_at:'2026-11-25T16:00:00Z'}));
 add('owner-closed',s=>{s.issues[0].state='closed';s.pulls=[];s.comments=[];s.events=[];});
 add('closed-unmerged',s=>s.pulls[0].state='closed');
 add('session-comments',s=>s.comments.push({...s.comments[0],id:30,body:'Session summary and in-scope review answer; unchanged scope.'}));
 add('ambiguous',s=>s.pulls.push({...s.pulls[0],number:8}));
 add('captured-edit',s=>s.comments[0].body='Changed captured scope');
 add('unchanged-reopen',s=>{const p=P.approval(s.issues[0],s.comments,s.events,'Building');s.comments[2].body=P.handoff(p,[{...s.pulls[0],state:'closed'}],'2026-11-25T12:00:00Z').body;});
 const oldResult=s=>{const p=P.trackingPlan(s.issues[0],s.comments,s.events,s.pulls);s.comments.push({...s.comments[0],id:31,body:p.body});};
 for(const name of ['rework-stale','rework-head','rework-new-pr'])add(name,s=>{
  oldResult(s);s.events.push({...s.events[0],id:10,created_at:'2026-11-25T14:00:00Z'},{...s.events[1],id:11,created_at:'2026-11-25T14:01:00Z'});
  const p=P.approval(s.issues[0],s.comments,s.events,'Building');s.comments.push({...s.comments[0],id:32,body:P.handoff(p,s.pulls,'2026-11-25T14:02:00Z').body,created_at:'2026-11-25T14:02:00Z',updated_at:'2026-11-25T14:02:00Z'});
  if(name==='rework-head'){s.pulls[0].head.sha='b'.repeat(40);s.pulls[0].updated_at='2026-11-25T15:00:00Z';}
  if(name==='rework-new-pr')s.pulls.push({...s.pulls[0],number:8,created_at:'2026-11-25T15:00:00Z',updated_at:'2026-11-25T15:00:00Z'});
 });
 add('reapproved',s=>{oldResult(s);s.issues[0].labels[0].name='Approved';s.events.push({...s.events[0],id:10,created_at:'2026-11-25T14:00:00Z'});});
 add('pagination',s=>{
  s.issues.unshift(...Array.from({length:100},(_,i)=>({...base.issue,number:100+i,user:{id:99}})));
  s.comments.unshift(...Array.from({length:100},(_,i)=>({...base.comments[0],id:1000+i,user:{id:99},body:'Unrelated discussion'})));
  s.events.unshift(...Array.from({length:100},(_,i)=>({id:1000+i,event:'labeled',label:{name:'documentation'},actor:{id:99},created_at:'2026-11-25T09:00:00Z'})));
  s.pulls.unshift(...Array.from({length:100},(_,i)=>({...base.prs[0],number:1000+i,head:{...base.prs[0].head,ref:'other-'+i}})));
 });
 for(const name of ['unexpected-before','unknown-post','partial-label'])add(name);
 return all;
}
module.exports={cases};
if(require.main===module){
 const all=cases(JSON.parse(fs.readFileSync('factory/local/us3/fixtures.json','utf8')));
 fs.writeFileSync('factory/local/us3/scenarios.json',JSON.stringify(all,null,2)+'\n');
 console.log('Prepared '+Object.keys(all).length+' synthetic US3 cases locally; no network/imports.');
}
