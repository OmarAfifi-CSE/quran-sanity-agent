import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import readline from 'node:readline';
process.loadEnvFile('web/.env.local');
const docs=[...JSON.parse(await fs.readFile('web/data/library.json','utf8')),...JSON.parse(await fs.readFile('data/staging/tabattal-translation-import.json','utf8'))].filter(d=>d._type==='libraryChunk').map(d=>({_id:d._id,hash:d.sourceAssetSha256,count:d.entries.length}));
for await(const line of readline.createInterface({input:createReadStream('data/staging/quran-api-import.ndjson'),crlfDelay:Infinity})){
 if(!line.trim())continue;const d=JSON.parse(line);if(d._type==='libraryChunk')docs.push({_id:d._id,hash:d.sourceAssetSha256,count:d.entries.length});
}
const project=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset=process.env.NEXT_PUBLIC_SANITY_DATASET||'production',token=process.env.SANITY_API_WRITE_TOKEN||process.env.SANITY_API_TOKEN;
const base=`https://${project}.api.sanity.io/v2025-01-01/data`,headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
async function read(){const r=await fetch(`${base}/query/${dataset}`,{method:'POST',headers,body:JSON.stringify({query:'*[_type=="libraryChunk"]{_id,_rev,sourceAssetSha256,entryCount}'})});if(!r.ok)throw new Error(`Read HTTP ${r.status}`);return (await r.json()).result;}
const current=new Map((await read()).map(d=>[d._id,d]));
const patches=docs.flatMap(d=>{const old=current.get(d._id);if(!old||old.sourceAssetSha256!==d.hash)throw new Error(`Source changed ${d._id}`);return old.entryCount===d.count?[]:[{patch:{id:d._id,ifRevisionID:old._rev,set:{entryCount:d.count}}}];});
if(!process.argv.includes('--apply')){console.log({patches:patches.length,entries:docs.reduce((n,d)=>n+d.count,0)});process.exit(0);}
const transactions=[];
for(let i=0;i<patches.length;i+=200){const r=await fetch(`${base}/mutate/${dataset}`,{method:'POST',headers,body:JSON.stringify({mutations:patches.slice(i,i+200)})});if(!r.ok)throw new Error(`Guarded count update HTTP ${r.status}; prior batches preserved`);transactions.push((await r.json()).transactionId);}
const actual=new Map((await read()).map(d=>[d._id,d.entryCount]));
if(docs.some(d=>actual.get(d._id)!==d.count))throw new Error('Count readback mismatch');
const report={at:new Date().toISOString(),documents:docs.length,entries:docs.reduce((n,d)=>n+d.count,0),verified:true,transactions};
await fs.writeFile('docs/audit/library-counts-receipt.json',JSON.stringify(report,null,2));console.log({documents:report.documents,entries:report.entries,verified:true});
