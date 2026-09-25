import { writeFile } from 'node:fs/promises';
import { getCorpus } from '../web/src/lib/corpus';
import { discoverContextEvidence } from '../web/src/lib/context-mcp';
async function main() {
process.loadEnvFile('web/.env.local');
const corpus=await getCorpus();
const rows=[];
for(const question of ['Explain 2:255','كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟','كيف يعالج القرآن اليأس من رحمة الله؟']) {
 const at=Date.now();
 try { const result=await discoverContextEvidence(question,corpus); rows.push({question,elapsedMs:Date.now()-at,...result}); }
 catch(error) {
  let detail=error instanceof Error?error.message:String(error);
  for(const [name,value]of Object.entries(process.env))if(/TOKEN|KEY|SECRET/.test(name)&&value)detail=detail.replaceAll(value,'[REDACTED]');
  detail=detail.replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,500);
  rows.push({question,elapsedMs:Date.now()-at,errorName:error instanceof Error?error.name:'Unknown',detail});
 }
 console.log(rows.at(-1));
}
await writeFile('docs/audit/context-diagnosis.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
}
main().catch(()=>{console.error('Context diagnostic could not load the configured corpus.');process.exitCode=1;});
