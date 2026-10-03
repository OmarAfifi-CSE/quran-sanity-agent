// Compare locally configured secret values without ever printing the values.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
process.loadEnvFile('web/.env.local');
const secrets=Object.entries(process.env).filter(([name,value])=>!name.startsWith('NEXT_PUBLIC_')&&/TOKEN|SECRET|(?:API_)?KEY$/.test(name)&&value?.length>=12);
async function files(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await files(target));else out.push(target);}return out;}
const matches=[];
const assets=await files('web/.next/static');
for(const file of assets){const body=await readFile(file,'utf8');for(const [name,value] of secrets)if(body.includes(value))matches.push({file,variable:name});}
const report={at:new Date().toISOString(),scope:'Next production static client assets only; does not certify deployment configuration',filesChecked:assets.length,secretVariablesChecked:secrets.map(([name])=>name),matches,passed:matches.length===0};
await writeFile('docs/audit/client-secrets.json',JSON.stringify(report,null,2));
console.log(report);if(!report.passed)process.exitCode=1;
