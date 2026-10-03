import {readFile,writeFile} from 'node:fs/promises';
const url='https://quran-sanity-agent-90gsrsu39-omar-afifi-team.vercel.app';
const health=JSON.parse(await readFile('docs/audit/deployment-health.json','utf8'));
const answer=JSON.parse(await readFile('docs/audit/deployment-answer.json','utf8'));
const anonymous=await fetch(`${url}/api/health`,{redirect:'manual',signal:AbortSignal.timeout(15000)});
const letters=text=>((text.match(/[\u0621-\u064a]/g)||[]).length>(text.match(/[a-z]/gi)||[]).length?'arabic':'english');
const checks={
 protectedFromAnonymous:anonymous.status===302&&anonymous.headers.get('location')?.startsWith('https://vercel.com/sso-api'),
 liveHealth:health.status==='ok'&&health.origin==='sanity',
 scriptureComplete:health.surahs===114&&health.ayahs===6236,
 libraryCount:health.library?.entries===116411&&health.library?.editions.length===25,
 claimsSourceChecked:health.sourceCheckedClaims===12&&health.specialistReviewedClaims===0,
 contextConfigured:health.contextConfigured===true,
 realContextRetrieved:answer.contextStatus==='connected'&&answer.contextTools?.includes('groq_query'),
 justiceAnchor:answer.citations?.some(c=>c.rawJsonSnippet.verseKey==='4:135'||c.documentId==='ayah-4-135'),
 noteQuotesLiteral:(answer.researchNotes?.points||[]).every(p=>p.evidence.length&&p.evidence.every(e=>{const c=answer.citations.find(c=>c.documentId===e.documentId);return c&&['primaryExcerpt','textUthmani','textEnglishTranslation'].some(field=>typeof c.rawJsonSnippet[field]==='string'&&c.rawJsonSnippet[field].includes(e.quote));})),
 englishNotes:(answer.researchNotes?.points||[]).every(p=>letters(p.text)==='english'),
};
const report={at:new Date().toISOString(),url,passed:Object.values(checks).every(Boolean),checks,notesStatus:answer.notesStatus,elapsedMs:answer.elapsedMs,anonymousHttp:anonymous.status,scope:'Owner-authenticated cloud health and one thematic query, plus anonymous protection check. Not public-scale or specialist validation.'};
await writeFile('docs/audit/deployment-verification.json',JSON.stringify(report,null,2));
console.log(report);if(!report.passed)process.exitCode=1;
