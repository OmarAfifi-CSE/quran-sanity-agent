import { writeFile } from 'node:fs/promises';
import { generateResearchNotes } from '../web/src/lib/research-notes';
async function main(){
 process.loadEnvFile('web/.env.local');
 const rows=[];
 for(const question of ['Explain 2:255','كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟']){
  const answer=await (await fetch('http://localhost:3000/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})})).json();
  const events:{phase:string;text?:string}[]=[];
  const notes=await generateResearchNotes(question,answer.citations,undefined,(phase,text)=>events.push({phase,text}));
  rows.push({question,notes,events});
  console.log({question,available:!!notes,phases:events.map(e=>e.phase)});
 }
 await writeFile('docs/audit/notes-diagnosis.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
}
main().catch(()=>{console.error('Notes diagnostic failed');process.exitCode=1;});
