// Counts the corpus through the actual Context MCP tool, not the Content Lake API.
import { writeFile } from 'node:fs/promises';
process.loadEnvFile('web/.env.local');
const endpoint = new URL(process.env.SANITY_CONTEXT_MCP_URL);
if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'api.sanity.io' || !endpoint.pathname.startsWith('/v1/context/organizations/')) throw new Error('Invalid Context endpoint');
const query = '{"ayahs":count(*[_type=="ayah"]),"surahs":count(*[_type=="surah"]),"libraryChunks":count(*[_type=="libraryChunk"]),"sourceEditions":count(*[_type=="sourceEdition"]),"claims":count(*[_type=="interpretiveClaim"]),"drafts":count(*[_id in path("drafts.**")])}';
const response = await fetch(endpoint, {
  method:'POST',
  headers:{Authorization:`Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},
  body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'groq_query',arguments:{query}}}),
  signal:AbortSignal.timeout(30000),
});
const body = await response.json();
if (!response.ok || body.error || body.result?.isError) throw new Error(`Context corpus audit failed: HTTP ${response.status}; RPC ${body.error?.code ?? 'tool-error'}`);
const text = body.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
const tool = JSON.parse(text);
const counts = tool.result;
const passed = counts.ayahs===6236 && counts.surahs===114 && counts.libraryChunks===3177 && counts.sourceEditions===22 && counts.claims===12 && counts.drafts===0;
const report = {at:new Date().toISOString(),tool:'groq_query',counts,passed,note:'All canonical verses and imported library chunks are visible through the live Context filter. Counts do not certify interpretation accuracy or relevance.'};
await writeFile('docs/audit/context-corpus-counts.json', JSON.stringify(report,null,2));
console.log(report);
if (!passed) process.exitCode=1;
