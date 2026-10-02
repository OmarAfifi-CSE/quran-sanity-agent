import fs from 'node:fs/promises';
const benchmark=JSON.parse(await fs.readFile('web/tests/fixtures/retrieval-benchmark-v1.json','utf8'));
const questions=benchmark.cases.map(c=>c.question);
const results=[];
for(const question of questions){
 const r=await fetch('http://localhost:3000/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question}),signal:AbortSignal.timeout(60000)});
 const answer=await r.json();
 const passages=(answer.citations||[]).filter(c=>c.documentType==='libraryPassage');
 const checks={httpOk:r.status===200,exactSelectedQuotes:passages.every(c=>!c.rawJsonSnippet.relevantExcerpt||String(c.rawJsonSnippet.primaryExcerpt).includes(String(c.rawJsonSnippet.relevantExcerpt))),notesHaveOriginalQuotes:(answer.researchNotes?.points||[]).every(p=>p.evidence.length>0&&p.evidence.every(e=>{const source=answer.citations?.find(c=>c.documentId===e.documentId);return source&&['primaryExcerpt','textUthmani','textEnglishTranslation'].some(field=>typeof source.rawJsonSnippet[field]==='string'&&source.rawJsonSnippet[field].includes(e.quote));}))};
 if(question.includes('Ibn Kathir'))checks.requestedAuthorOnly=passages.length>0&&passages.every(c=>['quran-com-14','quran-com-169'].includes(c.rawJsonSnippet.edition));
 if(question.includes('القرطبي'))checks.requestedAuthorOnly=passages.length>0&&passages.every(c=>c.rawJsonSnippet.edition==='quran-com-90');
 if(question.includes('Al-Razi')||question.includes('الزمخشري')){
  const author=question.includes('Al-Razi')?'Razi':'Zamakhshari';
  const claims=(answer.citations||[]).filter(c=>c.documentType==='interpretiveClaim');
  checks.noSubstituteAuthor=passages.length===0&&claims.length>0&&claims.every(c=>c.title.includes(author));
 }
 if(question.includes('against oneself'))checks.directJusticeReference=passages.some(c=>c.rawJsonSnippet.verseKey==='4:135');
 if(question.includes('التوكل'))checks.directActionAndRelianceAnchors=['12:67','3:159'].every(ref=>passages.some(c=>c.rawJsonSnippet.verseKey===ref));
 if(question.includes('quantum')||question.includes('115:1'))checks.noInventedReferences=answer.citations?.length===0;
 const expected=benchmark.cases.find(c=>c.question===question);
 if(expected.expectedAnchors)checks.expectedAnchors=expected.expectedAnchors.every(ref=>(answer.citations||[]).some(c=>c.rawJsonSnippet.verseKey===ref||c.documentId==='ayah-'+ref.replace(':','-')||c.rawJsonSnippet.ayah?._ref==='ayah-'+ref.replace(':','-')));
 results.push({question,http:r.status,status:answer.status,planner:answer.libraryPlanner,library:answer.libraryStatus,context:answer.contextStatus,contextTools:answer.contextTools,contextStrategy:answer.contextStrategy,contextFailure:answer.contextFailure,notesStatus:answer.notesStatus,researchNotes:answer.researchNotes,checks,elapsedMs:answer.elapsedMs,sources:answer.citations?.map(c=>({id:c.documentId,title:c.title,verseKey:c.rawJsonSnippet.verseKey})),text:answer.text});
 console.log(JSON.stringify({...results.at(-1),text:undefined,researchNotes:undefined}));
}
await fs.mkdir('docs/audit', {recursive:true});
await fs.writeFile('docs/audit/release-benchmark-v1.json',JSON.stringify({at:new Date().toISOString(),benchmarkVersion:benchmark.version,note:benchmark.scope,results},null,2));
if(results.some(r=>Object.values(r.checks).some(v=>!v)))process.exitCode=1;
