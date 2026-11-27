// Offline US3 failure/closure stages; every effect has intent and exact readback.
function recoveryStages(b,attempt,issueUrl,a,plan){
 const {code,cond,http,receipt,chain,connect,response:r,val:v,vals}=b;
 const base='https://api.github.com/repos/MBroholm/software-factory';
 function effect(name,kind,phase,content,external){http(name,`={{ ${attempt} + '/effects/${kind}' }}`,{runner:true,method:'PUT',body:`={{ {phase:'${phase}',content:${content},external:${external}} }}`},'Record recovery intent before external write; reconcile exact evidence. Unknown writes retain the slot.');receipt(name+' receipt',name,[200]);chain(name,name+' receipt');}
 cond('Failure ready',"={{ ['post_failure','confirm_failure'].includes($json.action) }}",'Only a stopped current failure can publish Stuck. Active or uncertain work retains the slot.');
 effect('Journal failure','comment','intent',`{body:${plan}.body}`,'null');
 cond('Need failure post',`={{ ${plan}.action === 'post_failure' }}`,'An exact existing failure is reconciled; missing prior intent never permits blind repost.');
 http('Read before failure',`={{ ${issueUrl} }}`,{},'Re-read closure and current Building immediately before posting failure.');
 code('Allow failure post',`const x=${r('Read before failure')};demand(x.statusCode===200 && eligible(x.body) && state(x.body)==='Building','Failure target changed');return [{json:${plan}}];`,'Observed closure or renewed approval suppresses stale failure publication.');
 http('Post failure',`={{ ${issueUrl} + '/comments' }}`,{method:'POST',body:`={{ {body:${plan}.body} }}`},'Publish sanitized Stuck reason and retained-work references once.');receipt('Check failure post','Post failure',[201]);
 http('Read failure comments',`={{ ${issueUrl} + '/comments' }}`,{paginated:true},'Read back unedited exact failure marker and actor.');
 code('Verify failure comment',`const p=failurePlan(${v('Read result issue')},${vals('Read failure comments')},${a});demand(p.action==='confirm_failure','Failure readback missing');return [{json:p}];`,'Require current trusted attempt and exact comment before Stuck transition.');
 effect('Confirm failure','comment','confirmed',`{body:${plan}.body}`,"{comment_id:$('Verify failure comment').first().json.existing}");
 chain('Failure ready','Journal failure','Journal failure receipt','Need failure post');
 connect('Need failure post','Read before failure');chain('Read before failure','Allow failure post','Post failure','Check failure post','Read failure comments');connect('Need failure post','Read failure comments',1);
 chain('Read failure comments','Verify failure comment','Confirm failure');
 // Closure cancellation is durable and actively stops the named unit. Read its latest proof.
 http('Read cancelled attempt',`={{ ${attempt} }}`,{runner:true},'Read stopped proof after durable cancellation and whole-unit stop; acknowledgement alone is insufficient.');receipt('Check cancelled attempt','Read cancelled attempt',[200]);
 cond('Cancelled stopped',`={{ ${v('Read cancelled attempt')}.result?.stopped_proof?.cgroup_empty === true }}`,'Running or unknown cancellation retains reservation between polls.');
 for(const [prefix,target,start,source] of [['Failure','Stuck','Confirm failure receipt',a],['Closure','Done','Cancelled stopped',v('Read cancelled attempt')]]){
  const content=`{state:'${target}'}`;
  effect(prefix+' state intent','state','intent',content,'null');
  http(prefix+' fresh issue',`={{ ${issueUrl} }}`,{},'Re-read target state immediately before label changes; closure is independent of free-slot proof.');
  code(prefix+' transition',`const x=${r(prefix+' fresh issue')};demand(x.statusCode===200 && x.body.user?.id===OWNER_ID ${target==='Done'?"&& x.body.state==='closed'":"&& eligible(x.body)"},'Recovery target changed');const current=state(x.body);demand(${target==='Done'?"STATES.includes(current)":"['Building','Stuck'].includes(current)"},'Stale recovery state');return [{json:{current,needed:current!=='${target}'}}];`,'Preserve unrelated labels and refuse to overwrite a new approval with an old failure.');
  cond(prefix+' labels needed','={{ $json.needed }}','Already-persisted target skips mutation, then verifies state and stopped proof.');
  http(prefix+' add label',`={{ ${issueUrl} + '/labels' }}`,{method:'POST',body:`={{ {labels:['${target}']} }}`},'Add target label first; uncertainty holds without automatic retry.');receipt(prefix+' label receipt',prefix+' add label',[200]);
  http(prefix+' remove source',`={{ ${issueUrl} + '/labels/' + encodeURIComponent($('${prefix} transition').first().json.current) }}`,{method:'DELETE'},'Remove only observed prior managed label after target addition acknowledgement.');receipt(prefix+' removal receipt',prefix+' remove source',[200]);
  http(prefix+' final issue',`={{ ${issueUrl} }}`,{},'Read back sole target state before confirming state effect.');
  code(prefix+' verify state',`const x=${r(prefix+' final issue')};demand(x.statusCode===200 && x.body.user?.id===OWNER_ID && state(x.body)==='${target}' && x.body.state==='${target==='Done'?'closed':'open'}','Recovery state readback failed');return [{json:x.body}];`,'Complete state readback is required; a label never proves the worker stopped.');
  effect(prefix+' state confirmed','state','confirmed',content,`{state:'${target}',issue_number:${a}.payload.issue_number}`);
  http(prefix+' release',`={{ ${attempt} + '/release' }}`,{runner:true,method:'POST',body:`={{ {generation:${v('Read runner slot')}.generation,stopped_proof:${target==='Done'?v('Read cancelled attempt'):source}.result.stopped_proof,publication:{state:'${target}'}} }}`},'Compare generation, original unit stopped proof and every effect. Unknown push/PR/comment cannot be discarded by closure.');receipt(prefix+' release receipt',prefix+' release',[200]);
  code(prefix+' complete',`demand(${v(prefix+' release')}.status==='released','Recovery release unconfirmed');return [{json:{acknowledged:true,outcome:'success',issue_number:${a}.payload.issue_number}}];`,'Preserve historical result and partial work after safe release; retry needs a fresh owner event.');
  chain(start,prefix+' state intent',prefix+' state intent receipt',prefix+' fresh issue',prefix+' transition',prefix+' labels needed');
  connect(prefix+' labels needed',prefix+' add label');chain(prefix+' add label',prefix+' label receipt',prefix+' remove source',prefix+' removal receipt',prefix+' final issue');connect(prefix+' labels needed',prefix+' final issue',1);
  chain(prefix+' final issue',prefix+' verify state',prefix+' state confirmed');chain(prefix+' state confirmed receipt',prefix+' release',prefix+' release receipt',prefix+' complete','Require acknowledged completion');
 }
 connect('Question ready','Failure ready',1);connect('Failure ready','Complete read only',1);
 chain('Validate cancellation','Read cancelled attempt','Check cancelled attempt','Cancelled stopped');connect('Cancelled stopped','Complete read only',1);
}
module.exports={recoveryStages};
