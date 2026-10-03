import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
process.loadEnvFile('web/.env.local');
const project=JSON.parse(await readFile('web/.vercel/project.json','utf8'));
const scope='omar-afifi-team';
const allowed=['NEXT_PUBLIC_SANITY_PROJECT_ID','NEXT_PUBLIC_SANITY_DATASET','NEXT_PUBLIC_SANITY_API_VERSION','SANITY_API_READ_TOKEN','SANITY_CONTEXT_MCP_URL','SANITY_ORGANIZATION_TOKEN','GEMINI_API_KEY'];
if(allowed.some(key=>!process.env[key]))throw new Error('Required preview configuration missing');
const configuration=[...allowed.map(key=>({key,value:process.env[key],type:'encrypted',target:['preview']})),...Object.entries({GEMINI_MODEL:'gemini-3.6-flash',QURAN_REQUESTS_PER_MINUTE:'12',QURAN_REQUESTS_PER_HOUR:'120',QURAN_MAX_CONCURRENT:'4',QURAN_TRUST_PROXY:'false',QURAN_RESEARCH_NOTES:'on'}).map(([key,value])=>({key,value,type:'encrypted',target:['preview']}))];
for(const row of configuration){
 const secret=!row.key.startsWith('NEXT_PUBLIC_');
 const result=spawnSync(process.env.ComSpec,['/d','/s','/c',`npx --yes vercel@60.1.3 env add ${row.key} preview --project ${project.projectId} --scope ${scope} --cwd web --force --yes ${secret?'--sensitive':'--no-sensitive'}`],{input:row.value,encoding:'utf8',env:{...process.env,VERCEL_TELEMETRY_DISABLED:'1'},windowsHide:true});
 if(result.status!==0){let diagnostic=String(result.error?.message||result.stderr||'No CLI diagnostic');for(const key of allowed)if(process.env[key])diagnostic=diagnostic.split(process.env[key]).join('[redacted]');throw new Error(`Preview environment upload failed: ${diagnostic.slice(0,1600)}`);}
 console.log({uploaded:row.key,target:'preview'});
}
console.log({writeTokenUploaded:false});
