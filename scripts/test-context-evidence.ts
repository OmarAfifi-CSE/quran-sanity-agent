import { writeFile } from "node:fs/promises";
import { getCorpus, isReviewed } from "../web/src/lib/corpus";
import { discoverContextEvidence } from "../web/src/lib/context-mcp";
import { resolveContextLibraryCitations } from "../web/src/lib/library";

async function main() {
  process.loadEnvFile("web/.env.local");
  if (process.argv[3]) process.env.SANITY_CONTEXT_MCP_URL = process.argv[3];
  const corpus = await getCorpus();
  const question = process.argv[2] || "What did Ibn Kathir mean by Al-Asr in 103:1?";
  const started = Date.now();
  const result = await discoverContextEvidence(question, corpus);
  const library = await resolveContextLibraryCitations(result.ids, question);
  const accepted = result.ids.filter(id => corpus.ayahs.some(a=>a._id===id) || corpus.claims.some(c=>c._id===id && isReviewed(c)) || library.some(c=>c.documentId===id));
  const report = {at:new Date().toISOString(),question,status:result.status,tools:result.tools,selectedIds:result.ids,resolvedOriginalIds:accepted,libraryPassages:library.length,elapsedMs:Date.now()-started,passed:result.status==="connected" && result.tools.some(t=>["knowledge_base_read","groq_query"].includes(t)) && accepted.length>0,note:"Actual model/tool retrieval; selected IDs appeared in tool results and resolve to original corpus records. This does not certify comprehensive coverage or specialist-reviewed interpretation."};
  await writeFile(process.argv[3] ? "docs/audit/context-groq-evidence-test.json" : "docs/audit/context-evidence-test.json",JSON.stringify(report,null,2));
  console.log(report);
  if(!report.passed)process.exitCode=1;
}
main().catch(async (error)=>{
  let detail = String(error?.message || "Unknown retrieval failure");
  for (const [name, value] of Object.entries(process.env))
    if (/(TOKEN|KEY|SECRET)/.test(name) && value) detail = detail.split(value).join("[redacted]");
  detail = detail.replace(/https?:\/\/\S+/g, "[URL omitted]").slice(0, 300);
  const report = {at:new Date().toISOString(),passed:false,errorName:error?.name,detail};
  await writeFile(process.argv[3] ? "docs/audit/context-groq-evidence-test.json" : "docs/audit/context-evidence-test.json", JSON.stringify(report,null,2));
  console.error(report); process.exitCode=1;
});
