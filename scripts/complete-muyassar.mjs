import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const chunks=JSON.parse(await fs.readFile('web/data/library.json','utf8'));
const coverage=JSON.parse(await fs.readFile('docs/audit/tabattal-coverage.json','utf8'));
const missing=coverage.editions.find(e=>e.edition==='muyassar').missingDirectAnchors;
const needed=new Set(missing), found=new Map(), receipts=[];
const corpus=JSON.parse(await fs.readFile('web/src/sanity/corpus.json','utf8'));
const valid=new Set(corpus.ayahs.map(a=>a._id.replace(/^ayah-/,'').replace('-',':')));
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
 while(cursor<missing.length){
  const key=missing[cursor++];if(found.has(key))continue;
  const url=`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${key}`;
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Group fetch ${key}: ${response.status}`);
  const payload=await response.json();const t=payload.tafsir;
  if(t?.resource_id!==16||typeof t.text!=='string'||!t.text.trim()||!t.verses?.[key])throw new Error(`Invalid explicit mapping ${key}`);
  const group=Object.keys(t.verses);
  if(group.some(k=>!valid.has(k)))throw new Error(`Invalid Quran anchor ${key}`);
  const sha=crypto.createHash('sha256').update(t.text).digest('hex');
  receipts.push({url,requested:key,group,textSha256:sha});
  for(const ref of group.filter(k=>needed.has(k))){
   const [surahNumber,ayahNumber]=ref.split(':').map(Number);
   if(found.has(ref)&&found.get(ref).sha256!==sha)throw new Error(`Conflicting group ${ref}`);
   found.set(ref,{_key:`v${surahNumber}-${ayahNumber}`,verseKey:ref,surahNumber,ayahNumber,text:t.text.replace(/<[^>]*>/g,'').trim(),originalHtml:t.text,sha256:sha,sourceUrl:url,explicitGroup:group});
  }
 }
}));
if(found.size!==missing.length)throw new Error(`Incomplete ${found.size}/${missing.length}`);
const additions=[];
for(let chapter=1;chapter<=114;chapter++){
 const entries=[...found.values()].filter(e=>e.surahNumber===chapter).sort((a,b)=>a.ayahNumber-b.ayahNumber);
 if(!entries.length)continue;
 // Each supplemental group remains distinct from the source database snapshot.
 additions.push({_id:`library-tabattal-muyassar-group-${String(chapter).padStart(3,'0')}`,_type:'libraryChunk',edition:'muyassar-grouped',titleArabic:'التفسير الميسر — مجموعات مثبتة من المصدر',titleEnglish:'Al-Muyassar — explicit source groups',language:'ar',kind:'tafsir',sourceAsset:'Quran.com API v4, resource 16',sourceAssetSha256:crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex'),sourceLocator:'tafsirs/16/by_ayah; explicit verses map',verification:'imported_exact_anchor',reviewNote:'Verse membership is explicitly listed by the source API. Imported passage, not specialist review.',entries});
}
const output=[...chunks.filter(c=>c.edition!=='muyassar-grouped'),...additions];
await fs.writeFile('web/data/library.json',JSON.stringify(output));
await fs.writeFile('web/data/library-manifest.json',JSON.stringify({documents:output.length,entries:output.reduce((n,c)=>n+c.entries.length,0),editions:[...new Set(output.map(c=>c.edition))].map(edition=>({edition,entries:output.filter(c=>c.edition===edition).reduce((n,c)=>n+c.entries.length,0)}))},null,2));
await fs.writeFile('docs/audit/muyassar-group-mapping.json',JSON.stringify({at:new Date().toISOString(),resolved:found.size,remaining:0,documents:additions.length,receipts},null,2));
console.log({resolved:found.size,newDocuments:additions.length,totalDocuments:output.length,totalEntries:output.reduce((n,c)=>n+c.entries.length,0)});
