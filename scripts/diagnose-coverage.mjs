process.loadEnvFile('web/.env.local');
const endpoint=`https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2025-01-01/data/query/production`;
for(const query of ['{"chunks":count(*[_type=="libraryChunk"]),"entries":math::sum(*[_type=="libraryChunk"]{"n":count(entries)}[].n)}','*[_type=="sourceEdition"]{"edition":_id,"titleEnglish":title,language,"entries":math::sum(*[_type=="libraryChunk" && edition==string::replace(^._id,"edition-","")]{"n":count(entries)}[].n)}']){
 const start=Date.now();
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.SANITY_API_READ_TOKEN}`},body:JSON.stringify({query}),signal:AbortSignal.timeout(30000)});
 const body=await response.json();console.log({http:response.status,elapsedMs:Date.now()-start,error:body.error?.description,result:body.result});
}
