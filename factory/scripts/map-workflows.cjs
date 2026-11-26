#!/usr/bin/env node
// Offline packaging only. Credential references, never credential values, enter JSON.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const hash=s=>createHash('sha256').update(s).digest('hex');
function demand(ok,message){if(!ok)throw Error(message);}
function mapWorkflow(source,config){
 const required=key=>{const value=config[key]?.trim();demand(value && !value.startsWith('OWNER_SELECT') && !value.startsWith('FILL_'),`Fill ${key} in the mapping .env file`);demand(/^[A-Za-z0-9_-]+$/.test(value),`Invalid ID in ${key}`);return value;};
 const w=structuredClone(source);w.active=false;
 demand(!w.id&&!w.versionId,'Expected portable source workflow without instance identity');
 let tables=0,credentials=0;
 for(const n of w.nodes){
  if(n.type.endsWith('.dataTable')){
   demand(n.parameters.dataTableId?.value==='OWNER_SELECT_ISOLATED_CONTROL_TABLE',`Unexpected table reference in ${n.name}`);
   n.parameters.dataTableId={__rl:true,mode:'id',value:required('FACTORY_CONTROL_TABLE_ID')};tables++;
  }
  for(const [type,c]of Object.entries(n.credentials??{})){
   demand(type==='httpHeaderAuth','Unexpected credential type');
   const role={'OWNER_SELECT_GITHUB_HEADER_CREDENTIAL':'GITHUB','OWNER_SELECT_GEMINI_HEADER_CREDENTIAL':'GEMINI'}[c.id];
   demand(role,`Unexpected credential reference in ${n.name}`);
   c.id=required(`FACTORY_${role}_CREDENTIAL_ID`);
   c.name=config[`FACTORY_${role}_CREDENTIAL_NAME`]?.trim()||c.name;credentials++;
  }
 }
 demand(tables>0 && credentials>0,'Expected control and saved-credential mappings');
 demand(!JSON.stringify(w).includes('OWNER_SELECT_'),'Unresolved mapping placeholder');
 return w;
}
function main(args){
 let envFile,workflow='all',check=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--env')envFile=args[++i];
  else if(args[i]==='--workflow')workflow=args[++i];
  else if(args[i]==='--check')check=true;
  else if(args[i]==='--help'){console.log('node factory/scripts/map-workflows.cjs --env factory/local/test.env [--workflow all|refine|reserve|track] [--check]');return;}
  else throw Error('Unknown argument; use --help');
 }
 demand(envFile,'Provide --env; no implicit environment or production fallback');
 demand(['all','refine','reserve','track'].includes(workflow),'Invalid --workflow');
 const config=parseEnv(fs.readFileSync(path.resolve(root,envFile),'utf8'));
 demand(['test','operational'].includes(config.FACTORY_TARGET),'FACTORY_TARGET must be test or operational');
 const outputDir=path.join(root,'factory/local/mapped',config.FACTORY_TARGET);
 const files=new Map(),manifest={target:config.FACTORY_TARGET,active:false,workflows:{}};
 for(const name of workflow==='all'?['refine','reserve','track']:[workflow]){
  const source=fs.readFileSync(path.join(root,`factory/workflows/${name}.json`),'utf8');
  const mapped=JSON.stringify(mapWorkflow(JSON.parse(source),config),null,2)+'\n';
  files.set(`${name}.json`,mapped);manifest.workflows[name]={source_sha256:hash(source),mapped_sha256:hash(mapped)};
 }
 // Build/validate all outputs before writing. No URL, API key or .env contents in manifest.
 files.set(workflow==='all'?'manifest.json':`${workflow}-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
 if(!check)fs.mkdirSync(outputDir,{recursive:true,mode:0o700});
 for(const [name,content]of files){const destination=path.join(outputDir,name);
  if(check)demand(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')===content,`Mapped output missing/stale: factory/local/mapped/${config.FACTORY_TARGET}/${name}`);
  else{fs.writeFileSync(destination,content,{mode:0o600});fs.chmodSync(destination,0o600);}
 }
 console.log(`${check?'Verified':'Generated'} ${files.size-1} inactive workflow(s) in factory/local/mapped/${config.FACTORY_TARGET}/; no import or network calls.`);
}
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error(error.code==='ENOENT'?'Mapping input/output file missing; check --env and build outputs.':error.message);process.exitCode=1;}}
module.exports={mapWorkflow,main};
