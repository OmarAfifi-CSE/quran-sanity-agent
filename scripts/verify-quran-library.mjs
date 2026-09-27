import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import readline from 'node:readline';
process.loadEnvFile('web/.env.local');
const project=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset=process.env.NEXT_PUBLIC_SANITY_DATASET||'production',token=process.env.SANITY_API_READ_TOKEN;
let batch=[],documents=0,entries=0;
async function verify(){
 if(!batch.length)return;
 const url=`https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`;
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({query:'*[_id in $ids]',params:{ids:batch.map(d=>d._id)}})});
 if(!response.ok)throw new Error(`Verification read ${response.status}`);
 const {result}=await response.json();
 for(const expected of batch){
  const actual=result.find(d=>d._id===expected._id);if(!actual)throw new Error(`Missing ${expected._id}`);
  if(expected._type==='sourceEdition'){
   for(const field of ['resourceId','title','author','language','directAnchors','chunks'])if(actual[field]!==expected[field])throw new Error(`Edition mismatch ${expected._id}/${field}`);
  }else{
   if(actual.entries.length!==expected.entries.length||actual.sourceAssetSha256!==expected.sourceAssetSha256||actual.sourceEdition?._ref!==expected.sourceEdition._ref)throw new Error(`Chunk mismatch ${expected._id}`);
   for(const item of expected.entries){
    const found=actual.entries.find(e=>e._key===item._key);
    for(const field of ['verseKey','text','sha256','searchText','sourceUrl','upstreamRecordId'])if(found?.[field]!==item[field])throw new Error(`Entry mismatch ${expected._id}/${item._key}/${field}`);
    if(found.ayah?._ref!==item.ayah._ref)throw new Error('Broken verse relationship');entries++;
   }
  }
  documents++;
 }
 batch=[];
 if(documents%100<8)console.log({documents,entries});
}
for await(const line of readline.createInterface({input:createReadStream('data/staging/quran-api-import.ndjson'),crlfDelay:Infinity})){
 if(!line.trim())continue;batch.push(JSON.parse(line));if(batch.length===6)await verify();
}
await verify();
const report={at:new Date().toISOString(),project,dataset,documents,entries,mismatches:0,comparison:'Every published edition, chunk and entry compared with import source; exact readable text, source hash, search text, source URL, upstream ID, verse anchor and Sanity verse reference'};
await fs.writeFile('docs/audit/quran-api-live-verification.json',JSON.stringify(report,null,2));console.log(report);
