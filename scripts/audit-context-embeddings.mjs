import { writeFile } from 'node:fs/promises';
process.loadEnvFile('web/.env.local');
const query = '*[_type=="ayah"] | score(text::semanticSimilarity("justice even against yourself")) | order(_score desc)[0...5]{_id,ayahNumber,_score}';
const response = await fetch(process.env.SANITY_CONTEXT_MCP_URL, {
  method:'POST', headers:{Authorization:`Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},
  body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'groq_query',arguments:{query}}}), signal:AbortSignal.timeout(45000),
});
const body = await response.json();
const content = body.result?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n');
let result;
try { result=JSON.parse(content).result; } catch { result=null; }
let error = body.error?.message ?? (body.result?.isError ? content : null);
for (const [name,value] of Object.entries(process.env)) if (/TOKEN|KEY|SECRET/.test(name) && value) error=error?.replaceAll(value,'[REDACTED]');
const passed=response.ok && !body.error && !body.result?.isError && Array.isArray(result) && result.some(v=>v._id==='ayah-4-135');
const report={at:new Date().toISOString(),query,passed,result,error,note:'Semantic scores measure retrieval ranking, not religious accuracy. Large documents may exceed the ten embedding chunks per document limit; exact GROQ remains available for the complete corpus.'};
await writeFile('docs/audit/context-embeddings.json',JSON.stringify(report,null,2));
console.log(report);
if(!passed)process.exitCode=1;
