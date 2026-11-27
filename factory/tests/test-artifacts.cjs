// Offline test packaging inputs. Configuration selects a table; it does not verify isolation.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util');
const root=path.resolve(__dirname,'../..');
function mapping(story,args=process.argv.slice(2)) {
 const index=args.indexOf('--env');
 const mapped=args.includes('--mapped')||index>=0;
 const placeholder=`OWNER_SELECT_ISOLATED_${story}_CONTROL_TABLE`;
 if(!mapped)return {mapped:false,control:{__rl:true,mode:'id',value:placeholder}};
 const file=index>=0?args[index+1]:'factory/local/test.env';
 if(!file||file.startsWith('--'))throw Error('--env requires a test configuration path');
 let config;
 try{config=parseEnv(fs.readFileSync(path.resolve(root,file),'utf8'));}
 catch(error){throw Error(`Cannot read test configuration ${file}. Copy factory/config/test.env.example and fill the isolated test table ID. ${error.code??error.message}`);}
 if(config.FACTORY_TARGET!=='test')throw Error('Test artifacts require FACTORY_TARGET=test');
 const id=config.FACTORY_CONTROL_TABLE_ID;
 if(!id||! /^[A-Za-z0-9_-]+$/.test(id)||/OWNER_SELECT|PLACEHOLDER|REPLACE|YOUR_/i.test(id))throw Error('Fill FACTORY_CONTROL_TABLE_ID with the isolated test table ID; placeholders are not accepted');
 return {mapped:true,control:{__rl:true,mode:'id',value:id}};
}
function readGenerated(file,command){
 try{return fs.readFileSync(path.resolve(root,file),'utf8');}
 catch(error){if(error.code==='ENOENT')throw Error(`Missing generated test artifact ${file}. Run from the repository root: ${command}`);throw error;}
}
module.exports={mapping,readGenerated};

// Offline fixture mapping only: live identity/storage/credential scope still need readback.
function basicB(source,config){
 const need=key=>{const v=config[key]?.trim();if(!v||/OWNER_SELECT|PLACEHOLDER|REPLACE|YOUR_/i.test(v))throw Error('Missing test mapping '+key);return v;};
 if(need('FACTORY_TARGET')!=='test'||need('FACTORY_TEST_INSTANCE')!=='factory-guard-test'||!/^http:\/\/(127\.0\.0\.1|localhost):5679\/?$/.test(need('N8N_BASE_URL')))throw Error('Unknown isolated n8n target');
 const id=key=>{const v=need(key);if(!/^[A-Za-z0-9_-]+$/.test(v))throw Error('Invalid ID '+key);return v;};
 const table=id('FACTORY_CONTROL_TABLE_ID');if(table===id('FACTORY_OPERATIONAL_CONTROL_TABLE_ID'))throw Error('Operational control table rejected');
 const operational=need('FACTORY_OPERATIONAL_CREDENTIAL_IDS').split(',');
 const roles={};for(const role of ['GITHUB','GEMINI','RUNNER']){roles[role]=id(`FACTORY_${role}_CREDENTIAL_ID`);if(operational.includes(roles[role]))throw Error('Operational credential rejected');}
 if(new Set(Object.values(roles)).size!==3)throw Error('Separate role credentials required');
 const urls={};for(const role of ['RUNNER','GITHUB','MODEL']){
  const value=need(`FACTORY_TEST_${role}_URL`),u=new URL(value);
  if(u.protocol!=='http:'||!['127.0.0.1','localhost'].includes(u.hostname)||!u.port||['5678','5679','8787'].includes(u.port)||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('Unknown fixture destination '+role);
  urls[role]=u.origin;
 }
 if(new Set(Object.values(urls)).size!==3)throw Error('Separate fixture destinations required');
 const w=structuredClone(source);if(w.id||w.versionId||w.active)throw Error('Expected inactive portable source');w.active=false;w.pinData={};
 for(const n of w.nodes){
  if(n.type.endsWith('.dataTable')){if(n.parameters.dataTableId?.value!=='OWNER_SELECT_ISOLATED_CONTROL_TABLE')throw Error('Unknown table reference');n.parameters.dataTableId={__rl:true,mode:'id',value:table};}
  for(const [type,c]of Object.entries(n.credentials??{})){
   const role=/^OWNER_SELECT_(GITHUB|GEMINI|RUNNER)_(?:HEADER|BEARER)_CREDENTIAL$/.exec(c.id)?.[1];
   if(type!=='httpHeaderAuth'||!role)throw Error('Unknown credential reference');c.id=roles[role];c.name='Isolated '+role;
  }
  if(n.type.endsWith('.httpRequest')){
   const original=n.parameters.url;
   let url=original.replaceAll('http://RUNNER_PRIVATE_HOST:8787',urls.RUNNER).replaceAll('https://api.github.com',urls.GITHUB).replaceAll('https://generativelanguage.googleapis.com',urls.MODEL);
   if(url===original)throw Error('Unknown HTTP destination '+n.name);
   n.parameters.url=url;
  }
 }
 return w;
}
module.exports.basicB=basicB;
