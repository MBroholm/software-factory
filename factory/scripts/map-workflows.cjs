#!/usr/bin/env node
// Offline packaging only. Credential references, never credential values, enter JSON.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const hash=s=>createHash('sha256').update(s).digest('hex');
function demand(ok,message){if(!ok)throw Error(message);}
function privateRunnerOrigin(value){
 let url;
 try { url=new URL(value); } catch { throw Error('Fill FACTORY_RUNNER_URL with a private HTTP origin'); }
 const octets=url.hostname.split('.').map(Number);
 const [first,second]=octets;
 const privateAddress=octets.length===4 && (first===10 || (first===172 && second>=16 && second<=31) || (first===192 && second===168));
 demand(privateAddress && url.protocol==='http:' && url.pathname==='/' && !url.username && !url.password &&
  !url.search && !url.hash && url.port, 'FACTORY_RUNNER_URL must be a private IPv4 HTTP origin with an explicit port');
 return url.origin;
}
function mapWorkflow(source,config,changes=[]){
 const required=key=>{const value=config[key]?.trim();demand(value && !value.startsWith('OWNER_SELECT') && !value.startsWith('FILL_'),`Fill ${key} in the mapping .env file`);demand(/^[A-Za-z0-9_-]+$/.test(value),`Invalid ID in ${key}`);return value;};
 const w=structuredClone(source);w.active=false;
 demand(!w.id&&!w.versionId,'Expected portable source workflow without instance identity');
 const basicB=w.nodes.some(n=>Object.values(n.credentials??{}).some(c=>c.id==='OWNER_SELECT_RUNNER_BEARER_CREDENTIAL'));
 let runnerOrigin;
 if(basicB){
  demand(config.FACTORY_TARGET==='operational','Use the separate Basic B fixture mapper for test copies');
  runnerOrigin=privateRunnerOrigin(config.FACTORY_RUNNER_URL);
  const runnerId=required('FACTORY_RUNNER_CREDENTIAL_ID');
  demand(![config.FACTORY_GITHUB_CREDENTIAL_ID?.trim(),config.FACTORY_GEMINI_CREDENTIAL_ID?.trim()].includes(runnerId),
   'Runner bearer requires its own saved credential');
 }
 let tables=0,credentials=0;
 for(const n of w.nodes){
  if(n.type.endsWith('.dataTable')){
   demand(n.parameters.dataTableId?.value==='OWNER_SELECT_ISOLATED_CONTROL_TABLE',`Unexpected table reference in ${n.name}`);
   const value=required('FACTORY_CONTROL_TABLE_ID');
   n.parameters.dataTableId={__rl:true,mode:'id',value};tables++;
   changes.push({node:n.name,field:'parameters.dataTableId.value',from:'OWNER_SELECT_ISOLATED_CONTROL_TABLE',to:value});
  }
  for(const [type,c]of Object.entries(n.credentials??{})){
   demand(type==='httpHeaderAuth','Unexpected credential type');
   const role={'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL':'GITHUB','OWNER_SELECT_GEMINI_HEADER_CREDENTIAL':'GEMINI','OWNER_SELECT_RUNNER_BEARER_CREDENTIAL':'RUNNER'}[c.id];
   demand(role,`Unexpected credential reference in ${n.name}`);
   const before={...c};
   c.id=required(`FACTORY_${role}_CREDENTIAL_ID`);
   c.name=config[`FACTORY_${role}_CREDENTIAL_NAME`]?.trim()||c.name;credentials++;
   changes.push({node:n.name,field:'credentials.httpHeaderAuth',from:before,to:{...c}});
   if(role==='RUNNER'){
    const beforeUrl=n.parameters.url;
    const placeholder='http://RUNNER_PRIVATE_HOST:8787';
    demand(n.type.endsWith('.httpRequest') && typeof beforeUrl==='string' &&
     beforeUrl.includes(placeholder+'/v1/'),'Unexpected runner destination in '+n.name);
    n.parameters.url=beforeUrl.replaceAll(placeholder,runnerOrigin);
    changes.push({node:n.name,field:'parameters.url',from:beforeUrl,to:n.parameters.url});
   }
  }
  if(n.type.endsWith('.code') && n.parameters.jsCode.includes('OWNER_CONFIGURE_MODEL_ID')){
   const model=required('FACTORY_RUNNER_MODEL_CONFIG');
   demand(!model.startsWith('OWNER_'),'Configure an explicit runner model identifier');
   n.parameters.jsCode=n.parameters.jsCode.replaceAll('OWNER_CONFIGURE_MODEL_ID',model);
   changes.push({node:n.name,field:'parameters.jsCode',replace:'OWNER_CONFIGURE_MODEL_ID',with:model});
  }
 }
 demand(tables>0 && credentials>0,'Expected control and saved-credential mappings');
 demand(!/(OWNER_SELECT_|RUNNER_PRIVATE_HOST|OWNER_CONFIGURE_MODEL_ID)/.test(JSON.stringify(w)),'Unresolved mapping placeholder');
 return w;
}
function main(args){
 let envFile,workflow='all',check=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--env')envFile=args[++i];
  else if(args[i]==='--workflow')workflow=args[++i];
  else if(args[i]==='--check')check=true;
  else if(args[i]==='--help'){console.log('node factory/scripts/map-workflows.cjs --env factory/local/operational.env [--workflow all|refine|reserve|track|collect] [--check]');return;}
  else throw Error('Unknown argument; use --help');
 }
 demand(envFile,'Provide --env; no implicit environment or production fallback');
 demand(['all','refine','reserve','track','collect'].includes(workflow),'Invalid --workflow');
 const config=parseEnv(fs.readFileSync(path.resolve(root,envFile),'utf8'));
 demand(['test','operational'].includes(config.FACTORY_TARGET),'FACTORY_TARGET must be test or operational');
 const relativeOutput=path.join('factory/local/mapped',config.FACTORY_TARGET,'basic-b');
 const outputDir=path.join(root,relativeOutput);
 const files=new Map(),manifest={target:config.FACTORY_TARGET,active:false,workflows:{}};
 for(const name of workflow==='all'?['refine','reserve','track','collect']:[workflow]){
  const source=fs.readFileSync(path.join(root,`factory/workflows/${name}.json`),'utf8');
  const changes=[];
  const mapped=JSON.stringify(mapWorkflow(JSON.parse(source),config,changes),null,2)+'\n';
  files.set(`${name}.json`,mapped);manifest.workflows[name]={source_sha256:hash(source),mapped_sha256:hash(mapped),changes};
 }
 // Build/validate all outputs before writing. Manifest contains mapping deltas, never secret values.
 files.set(workflow==='all'?'manifest.json':`${workflow}-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
 if(!check)fs.mkdirSync(outputDir,{recursive:true,mode:0o700});
 for(const [name,content]of files){const destination=path.join(outputDir,name);
  if(check)demand(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')===content,`Mapped output missing/stale: ${relativeOutput}/${name}`);
  else{fs.writeFileSync(destination,content,{mode:0o600});fs.chmodSync(destination,0o600);}
 }
 console.log(`${check?'Verified':'Generated'} ${files.size-1} inactive workflow(s) in ${relativeOutput}/; no import or network calls.`);
}
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error(error.code==='ENOENT'?'Mapping input/output file missing; check --env and build outputs.':error.message);process.exitCode=1;}}
module.exports={mapWorkflow,main};
