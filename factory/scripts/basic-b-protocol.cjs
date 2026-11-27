// Pure Basic B protocol. Packaged after canonical Basic A source/approval helpers.
function sortedJSON(value) {
 if(Array.isArray(value))return '['+value.map(sortedJSON).join(',')+']';
 if(value && typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+sortedJSON(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function attemptUUID(p) {
 // uuid5: namespace bytes followed by UTF-8 repository:issue:authorization.
 const ns='7b3a320e4a2458809c85067c9f68b3da';
 const raw=ns.match(/../g).map(x=>parseInt(x,16));
 // SHA-1 accepts bytes via the internal helper's UTF-8 encoder; use a byte-oriented variant.
 const text=`${p.repository}:${p.issue_number}:${p.authorization.id}`;
 const input=[...raw,...bytes(text)];
 const data=input,bits=data.length*8;data.push(128);while(data.length%64!==56)data.push(0);for(let i=7;i>=0;i--)data.push(Math.floor(bits/2**(8*i))&255);
 let h=[0x67452301,0xefcdab89,0x98badcfe,0x10325476,0xc3d2e1f0];const rot=(n,b)=>(n<<b)|(n>>>(32-b));
 for(let off=0;off<data.length;off+=64){const w=[];for(let i=0;i<16;i++)w[i]=(data[off+4*i]<<24)|(data[off+4*i+1]<<16)|(data[off+4*i+2]<<8)|data[off+4*i+3];for(let i=16;i<80;i++)w[i]=rot(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);let[a,b,c,d,e]=h;for(let i=0;i<80;i++){const f=i<20?(b&c)|(~b&d):i<40?b^c^d:i<60?(b&c)|(b&d)|(c&d):b^c^d,k=i<20?0x5a827999:i<40?0x6ed9eba1:i<60?0x8f1bbcdc:0xca62c1d6,t=(rot(a,5)+f+e+k+w[i])|0;[e,d,c,b,a]=[d,c,rot(b,30),a,t];}h=h.map((v,i)=>(v+[a,b,c,d,e][i])|0);}
 let x=h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('').slice(0,32).split('');x[12]='5';x[16]=((parseInt(x[16],16)&3)|8).toString(16);x=x.join('');return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}
function v2marked(comments,kind,number) {
 return comments.filter(c=>lf(c.body).startsWith(`<!-- factory:${kind}:v2`)).map(c=>{
  const match=lf(c.body).match(new RegExp(`^<!-- factory:${kind}:v2 (\\{[^\\n]+\\}) -->\\n`));
  demand(match && c.user?.id===OWNER_ID && c.created_at===c.updated_at,'Invalid/edited v2 marker');
  const meta=JSON.parse(match[1]);demand(meta.repository===REPOSITORY && meta.issue===number && typeof meta.attempt==='string' && /^[a-f0-9]{64}$/.test(meta.specification_digest),'Invalid v2 identity');return {comment:c,meta};
 });
}
function initialPayload(issue,comments,events,baseSha,modelConfig) {
 const plan=approval(issue,comments,events);
 demand(/^[a-f0-9]{40}$/.test(baseSha) && typeof modelConfig==='string' && modelConfig.length>0,'Missing configured base/model identifier');
 const refined=history(comments,issue).at(-1),spec=lf(refined.comment.body).split('\n').slice(1).join('\n');
 demand(!comments.some(c=>/^<!-- factory:(?:authorization|answer):v2/.test(lf(c.body))),'Derived authorization is not initial approval');
 checkHandoffs(comments,plan);
 demand(!v2marked(comments,'attempt',issue.number).some(m=>m.meta.initial_approval===plan.approval_event_id),'Approval already reserved');
 const p={contract_version:1,repository:REPOSITORY,issue_number:issue.number,owner_author_id:OWNER_ID,
 authorization:{id:`initial:${issue.number}:${plan.approval_event_id}`,kind:'initial',initial_approval_event:plan.approval_event_id,approved_entered_at:plan.approval_timestamp,references:[plan.approval_event_id]},
 source:{refinement_comment_id:plan.refinement_comment_id,refinement_body_sha256:plan.refinement_body_sha256,source_digest:plan.source_digest,specification_digest:sha256(spec),captured_comment_ids:refined.meta.captured_comment_ids},
 specification:spec,discussion:comments.filter(c=>c.user?.id===OWNER_ID && !/^(?:<!--\s*)?factory:/.test(lf(c.body))).map(c=>({id:c.id,body:c.body,body_sha256:sha256(c.body)})),
 predecessor:null,manifest:null,branch:plan.branch,base_sha:baseSha,model_config:modelConfig};
 demand(bytes(sortedJSON(p)).length<=262144,'Context too large; owner must split/refine');
 return {id:attemptUUID(p),payload:p,plan};
}
function attemptMetadata(a) {const p=a.payload;return {repository:p.repository,issue:p.issue_number,attempt:a.id,initial_approval:p.authorization.initial_approval_event,specification_digest:p.source.specification_digest};}
function attemptBody(a){return `<!-- factory:attempt:v2 ${JSON.stringify(attemptMetadata(a))} -->\n## Automated build reservation\n\nBranch: ${a.payload.branch}; approved event: ${a.payload.authorization.initial_approval_event}. Runner acceptance follows Building and marker readback. The durable runner slot survives workflow guard release.\n`;}
function validateV2Association(issue,comments,pulls,a) {
 demand(a && a.payload.repository===REPOSITORY && a.payload.issue_number===issue.number && a.payload.owner_author_id===OWNER_ID,'Ledger task mismatch');
 const markers=v2marked(comments,'attempt',issue.number).filter(m=>m.meta.attempt===a.id);
 demand(markers.length===1 && sortedJSON(markers[0].meta)===sortedJSON(attemptMetadata(a)),'Missing/changed current attempt marker');
 const r=a.result;demand(r && r.attempt===a.id && r.outcome==='done' && r.pushed_sha && r.stopped_proof?.cgroup_empty && !a.cancellation,'Result not safely done');
 const prMarker=`<!-- factory:pr:v2 ${JSON.stringify({...attemptMetadata(a),result:r.id,sha:r.pushed_sha})} -->`;
 const candidates=pulls.filter(pr=>pr.body?.startsWith(prMarker+'\n'));
 demand(candidates.length<=1,'Ambiguous exact PR');
 if(candidates.length){const pr=candidates[0];demand(pr.head?.repo?.full_name===REPOSITORY && pr.base?.repo?.full_name===REPOSITORY && pr.head.ref===a.payload.branch && pr.head.sha===r.pushed_sha && pr.base.ref==='main','PR head/base/SHA conflict');}
 // An existing branch PR with a different marker must never be repurposed.
 demand(!pulls.some(pr=>pr.head?.repo?.full_name===REPOSITORY && pr.head.ref===a.payload.branch && !candidates.includes(pr)),'Unrelated branch PR requires owner recovery');
 return {pr:candidates[0]??null,marker:prMarker};
}
module.exports = {sortedJSON,attemptUUID,v2marked,initialPayload,attemptMetadata,attemptBody,validateV2Association};
