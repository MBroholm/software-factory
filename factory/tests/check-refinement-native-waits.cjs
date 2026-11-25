const assert=require('node:assert/strict');
// Real elapsed waits and cancellation in installed n8n core; no workflows or persisted rows.
const root=(process.argv[2]||'/usr/local/lib/node_modules/n8n')+'/node_modules/';
const {BaseExecuteContext}=require(root+'n8n-core/dist/execution-engine/node-execution-context/base-execute-context.js');
const {MAX_IN_PROCESS_WAIT_MS}=require(root+'n8n-workflow');
(async()=>{
const results=[];
for(const seconds of [10,30]){
 const c={runExecutionData:{},additionalData:{setExecutionStatus:()=>{throw Error('Durable wait reached');}}};
 const start=Date.now();await BaseExecuteContext.prototype.putExecutionToWait.call(c,new Date(start+seconds*1000),{acceptsResumeRequest:false});
 const elapsed=Date.now()-start;assert(elapsed>=seconds*1000-50&&elapsed<seconds*1000+5000);assert(!c.runExecutionData.waitTill);assert(seconds*1000<MAX_IN_PROCESS_WAIT_MS);results.push({seconds,elapsedMs:elapsed,durable:false});
}
const controller=new AbortController();const c={abortSignal:controller.signal,runExecutionData:{},additionalData:{setExecutionStatus:()=>{throw Error('Durable wait reached');}}};
const start=Date.now();const timer=setTimeout(()=>controller.abort(),500);
await BaseExecuteContext.prototype.putExecutionToWait.call(c,new Date(start+30000),{acceptsResumeRequest:false});clearTimeout(timer);
assert(Date.now()-start<3000);assert(!c.runExecutionData.waitTill);
console.log(JSON.stringify({status:'PASS',realWaits:results,cancelledWaitElapsedMs:Date.now()-start,limit:'Core helper only; no workflow routing or persisted guard tested'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
