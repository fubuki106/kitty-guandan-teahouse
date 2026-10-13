import {readFile,writeFile} from 'node:fs/promises';
const settingsPath=new URL('../deploy/cloudflare.json',import.meta.url);
const outputPath=new URL('../dist/server/wrangler.json',import.meta.url);
let settings,config;
try{settings=JSON.parse(await readFile(settingsPath,'utf8'));}catch{throw Error('Copy deploy/cloudflare.example.json to deploy/cloudflare.json and fill in your D1 database ID.');}
if(!/^[a-z][a-z0-9-]{0,62}$/.test(settings.name||''))throw Error('Invalid Worker name.');
if(!/^[a-f0-9-]{36}$/i.test(settings.database_id||'')||settings.database_id==='00000000-0000-4000-8000-000000000000')throw Error('Fill in the real database_id returned by wrangler d1 create.');
if(!settings.database_name||!settings.bucket_name)throw Error('database_name and bucket_name are required.');
if(settings.account_id&&!/^[a-f0-9]{32}$/i.test(settings.account_id))throw Error('Invalid account_id.');
try{config=JSON.parse(await readFile(outputPath,'utf8'));}catch{throw Error('Run npm run build first.');}
config.name=settings.name;config.topLevelName=settings.name;
if(settings.account_id)config.account_id=settings.account_id;
config.workers_dev=true;
config.d1_databases=[{binding:'DB',database_name:settings.database_name,database_id:settings.database_id,migrations_dir:'../../drizzle'}];
config.r2_buckets=[{binding:'BUCKET',bucket_name:settings.bucket_name}];
await writeFile(outputPath,JSON.stringify(config,null,2)+'\n');
console.log('Cloudflare configuration ready: '+settings.name);
