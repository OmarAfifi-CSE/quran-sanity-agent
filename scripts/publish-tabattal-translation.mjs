import fs from 'node:fs/promises';
process.loadEnvFile('web/.env.local');
const docs=JSON.parse(await fs.readFile('data/staging/tabattal-translation-import.json','utf8'));
const project=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset=process.env.NEXT_PUBLIC_SANITY_DATASET||'production';
const token=process.env.SANITY_API_WRITE_TOKEN||process.env.SANITY_API_TOKEN;
if(docs.length!==115||docs.some(d=>!['edition-quran-translation-134','library-quran-translation-134-'].some(p=>d._id.startsWith(p))))throw new Error('Unexpected translation import');
if(!process.argv.includes('--apply')){console.log({documents:docs.length,entries:6236,operation:'createIfNotExists'});process.exit(0);}
if(!token||!project)throw new Error('Missing configuration');
const base=`https://${project}.api.sanity.io/v2025-01-01/data`;
const headers={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
const transactions=[];
for(let i=0;i<docs.length;i+=5){
 const batch=docs.slice(i,i+5);
 const response=await fetch(`${base}/mutate/${dataset}`,{method:'POST',headers,body:JSON.stringify({mutations:batch.map(d=>({createIfNotExists:d}))})});
 if(!response.ok)throw new Error(`Import failed HTTP ${response.status}; safe to resume`);
 transactions.push((await response.json()).transactionId);
 const read=await fetch(`${base}/query/${dataset}`,{method:'POST',headers,body:JSON.stringify({query:'*[_id in $ids]',params:{ids:batch.map(d=>d._id)}})});
 if(!read.ok)throw new Error(`Readback HTTP ${read.status}`);
 const {result}=await read.json();
 for(const expected of batch){
  const actual=result.find(d=>d._id===expected._id);if(!actual)throw new Error('Missing document');
  for(const [field,value] of Object.entries(expected))if(JSON.stringify(actual[field])!==JSON.stringify(value)){
   // Object property order is not semantically significant in Sanity responses.
   const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
   if(JSON.stringify(canonical(actual[field]))!==JSON.stringify(canonical(value)))throw new Error(`Readback mismatch ${expected._id}/${field}`);
  }
 }
}
const receipt={at:new Date().toISOString(),documents:115,entries:6236,verifiedExact:true,transactions};
await fs.writeFile('docs/audit/translation-134-import-receipt.json',JSON.stringify(receipt,null,2));
console.log({documents:115,entries:6236,verifiedExact:true});
