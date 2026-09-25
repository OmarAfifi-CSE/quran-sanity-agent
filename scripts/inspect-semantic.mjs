import {writeFile} from 'node:fs/promises';
process.loadEnvFile('web/.env.local');
const rows=[];
for(const question of ['كيف يعالج القرآن اليأس من رحمة الله؟','despair of God mercy and hope in forgiveness','كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟','trust in God and take practical precautions']){
 const query=`*[_type=="ayah"] | score(text::semanticSimilarity(${JSON.stringify(question)})) | order(_score desc)[0...6]{_id,textUthmani,textEnglishTranslation,"verseKey":string(surah->number)+":"+string(ayahNumber)}`;
 const r=await fetch(process.env.SANITY_CONTEXT_MCP_URL,{method:'POST',headers:{Authorization:`Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'groq_query',arguments:{query}}}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();const text=data.result?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n');
 const result=JSON.parse(text).result;
 rows.push({question,result});console.log({question,candidates:result?.map(v=>({id:v._id,verseKey:v.verseKey,text:v.textEnglishTranslation?.slice(0,180)}))});
}
await writeFile('docs/audit/semantic-language-diagnosis.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
