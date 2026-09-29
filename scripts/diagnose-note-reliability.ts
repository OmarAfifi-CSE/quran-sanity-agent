import {writeFile} from 'node:fs/promises';
import {generateResearchNotes,buildQuoteCatalog,resolveNoteQuoteIds} from '../web/src/lib/research-notes';
import type {GroundingSourceCitation} from '../web/src/lib/types';
async function main(){
 process.loadEnvFile('web/.env.local');
 const question='كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟';
 const response=await fetch('http://127.0.0.1:3000/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
 if(!response.ok)throw new Error('API unavailable');
 const answer=await response.json();
 const sources:GroundingSourceCitation[]=answer.citations;
 const rows=[];
 for(let attempt=0;attempt<3;attempt++){
  const events:{phase:string;text?:string}[]=[];
  const at=Date.now();
  const notes=await generateResearchNotes(question,sources,undefined,(phase,text)=>events.push({phase,text}));
  const issues=[];
  const generated=events.find(e=>e.phase==='generated')?.text;
  if(generated){
   try{
    const parsed=JSON.parse(generated.replace(/^```(?:json)?\s*|\s*```$/g,''));
    if(!resolveNoteQuoteIds(parsed,buildQuoteCatalog(sources),sources))issues.push('quote_id_validation_failed');
   }catch{issues.push('invalid_json');}
  }
  rows.push({attempt,elapsedMs:Date.now()-at,available:!!notes,issues,events,notes});
  console.log({attempt,available:!!notes,issues,phases:events.map(e=>e.phase)});
 }
 await writeFile('docs/audit/note-reliability-after.json',JSON.stringify({at:new Date().toISOString(),question,sourceIds:sources.map(s=>s.documentId),rows},null,2));
}
main().catch(()=>{console.error('Reliability diagnostic failed');process.exitCode=1;});
