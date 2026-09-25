export function parseContextResult(payload:unknown):Record<string,unknown>[] {
 const data=payload as {isError?:boolean;content?:{type:string;text?:string}[]};
 if(data.isError)throw new Error('Context tool failed');
 try {
  const text=data.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n');
  const result=JSON.parse(text||'').result;
  if(!Array.isArray(result)||result.some(v=>!v||typeof v!=='object'))throw new Error();
  return result;
 }catch{throw new Error('Context tool payload is invalid');}
}
export function validatedContextSelection(text:string,rows:Record<string,unknown>[]):string[]{
 try{
  const value:unknown=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,'').trim());
  if(!Array.isArray(value))return [];
  const ids=new Set(rows.map(r=>r._id));
  return [...new Set(value.filter((v):v is string=>typeof v==='string'&&ids.has(v)))].slice(0,4);
 }catch{return [];}
}
export function contextPassageQuery(refs:string[],editions:string[]):string {
 if(!refs.length||refs.length>6||refs.some(r=>!/^\d{1,3}:\d{1,3}$/.test(r)))throw new Error('Invalid verse anchors');
 const referenceFilter=refs.map(r=>`${JSON.stringify(r)} in entries[].verseKey`).join(' || ');
 return `*[_type == "libraryChunk" && verification == "imported_exact_anchor" && kind != "translation" && language in ["ar","en"] && !(_id in path("drafts.**")) && (${referenceFilter})${editions.length?` && edition in ${JSON.stringify(editions)}`:''}] | order(edition asc)[0...12]{edition,titleEnglish,"entries":entries[verseKey in ${JSON.stringify(refs)}][0...6]{verseKey,"citationId":^._id+"."+_key}}`;
}
