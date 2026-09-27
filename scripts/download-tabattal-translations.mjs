import fs from 'node:fs/promises';
const root='data/staging/quran-api';
const report=[];
for(const id of [20,33,134]){
 const url=`https://api.quran.com/api/v4/quran/translations/${id}?fields=verse_key`;
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error(`Translation ${id}: ${response.status}`);
 const body=await response.json();
 if(body.translations?.length!==6236||new Set(body.translations.map(t=>t.verse_key)).size!==6236||body.translations.some(t=>t.resource_id!==id||!t.text?.trim()))throw new Error(`Invalid translation coverage ${id}`);
 await fs.writeFile(`${root}/translation-${id}.json`,JSON.stringify(body));
 report.push({id,url,entries:body.translations.length,metadata:body.meta});
}
await fs.writeFile('docs/audit/tabattal-translations.json',JSON.stringify(report,null,2));console.log(report);
