import {writeFile} from 'node:fs/promises';
const questions=['كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟','كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟','How does trust in God relate to taking practical means?'];
const rows=[];
for(const question of questions){
 const response=await fetch('http://127.0.0.1:3000/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3000'},body:JSON.stringify({question}),signal:AbortSignal.timeout(60000)});
 const answer=await response.json();
 const passages=(answer.citations||[]).filter(c=>c.documentType==='libraryPassage');
 const refs=[...new Set(passages.map(c=>c.rawJsonSnippet.verseKey))];
 const checks={httpOk:response.ok,noStaleMissingEvidenceMessage:!answer.text?.includes('لم أجد دليلًا مطابقًا'),bothDirectAnchors:['12:67','3:159'].every(ref=>refs.includes(ref)),contextConnected:answer.contextStatus==='connected',quotesExact:(answer.researchNotes?.points||[]).every(p=>p.evidence.every(e=>{const source=answer.citations.find(c=>c.documentId===e.documentId);return source&&['primaryExcerpt','textUthmani','textEnglishTranslation'].some(f=>typeof source.rawJsonSnippet[f]==='string'&&source.rawJsonSnippet[f].includes(e.quote));}))};
 rows.push({question,checks,refs,notesStatus:answer.notesStatus,notes:answer.researchNotes,contextTools:answer.contextTools,elapsedMs:answer.elapsedMs});
 console.log({question,checks,refs,notesStatus:answer.notesStatus});
}
const passed=rows.every(row=>Object.values(row.checks).every(Boolean));
await writeFile('docs/audit/tawakkul-evaluation.json',JSON.stringify({at:new Date().toISOString(),passed,rows,note:'Repeated compound-topic retrieval test, not expert semantic validation'},null,2));
if(!passed)process.exitCode=1;
