import fs from 'node:fs/promises';
import crypto from 'node:crypto';
process.loadEnvFile('web/.env.local');
const expected=JSON.parse(await fs.readFile('web/data/library.json','utf8'));
const project=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset=process.env.NEXT_PUBLIC_SANITY_DATASET||'production';
const token=process.env.SANITY_API_READ_TOKEN;
const url=new URL(`https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`);
url.searchParams.set('query','*[_type == "libraryChunk"]');url.searchParams.set('perspective','published');
const r=await fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(!r.ok)throw new Error(`Read failed ${r.status}`);
const {result}=await r.json();let entries=0;
for(const chunk of expected){
 const live=result.find(d=>d._id===chunk._id);
 if(!live || live.entries.length!==chunk.entries.length)throw new Error(`Missing entries ${chunk._id}`);
 for(const entry of chunk.entries){
  const actual=live.entries.find(e=>e._key===entry._key);
  for(const field of ['verseKey','surahNumber','ayahNumber','text','originalHtml','sha256'])if(actual?.[field]!==entry[field])throw new Error(`Mismatch ${chunk._id}/${entry._key}/${field}`);
  if(crypto.createHash('sha256').update(actual.originalHtml).digest('hex')!==actual.sha256)throw new Error('Content hash mismatch');
  entries++;
 }
}
const report={at:new Date().toISOString(),expectedDocuments:expected.length,actualDocuments:result.length,entriesCompared:entries,mismatches:0,comparison:'Exact original HTML, derived plain text, explicit verse key, ordinal and SHA-256 per entry'};
await fs.writeFile('docs/audit/library-live-verification.json',JSON.stringify(report,null,2));console.log(report);
