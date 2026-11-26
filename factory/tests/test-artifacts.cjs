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
