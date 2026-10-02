import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateResearchNotes,sourceWindows,buildQuoteCatalog,resolveNoteQuoteIds,researchNoteLanguage,notesMatchQuestionLanguage } from '../src/lib/research-notes';
import type { GroundingSourceCitation } from '../src/lib/types';
const source:GroundingSourceCitation={documentId:'library-quran-api-14-0014.v4-135',documentType:'libraryPassage',title:'Ibn Kathir · 4:135',rawJsonSnippet:{primaryExcerpt:'Stand firm for justice, even against yourselves or your parents and relatives.',verification:'imported_exact_anchor'}};
const valid={points:[{text:'Justice includes testimony against oneself.',evidence:[{documentId:source.documentId,quote:'Stand firm for justice, even against yourselves'}]}],gaps:['These passages do not cover every interpretation.']};

test('explanatory notes follow the question language while original quotations keep their source language',()=>{
 assert.equal(researchNoteLanguage('Explain العدل in 4:135'),'english');
 assert.equal(researchNoteLanguage('كيف يبين القرآن العدل؟'),'arabic');
 assert.equal(notesMatchQuestionLanguage(valid,'Explain justice'),true);
 assert.equal(notesMatchQuestionLanguage({...valid,points:[{...valid.points[0],text:'تأمر الآية المؤمنين بالقيام بالعدل والشهادة لله.'}]},'Explain justice'),false);
 assert.equal(notesMatchQuestionLanguage(valid,'كيف يبين القرآن العدل؟'),false);
});

test('generated note references resolve to server-selected original quotes rather than copied model text',()=>{
 const catalog=buildQuoteCatalog([source]);
 assert.ok(catalog.length>0);
 const input={points:[{text:valid.points[0].text,evidence:[{quoteId:catalog[0].quoteId,quote:'Invented replacement'}]}],gaps:[]};
 const notes=resolveNoteQuoteIds(input,catalog,[source]);
 assert.equal(notes?.points[0].evidence[0].quote,catalog[0].quote);
 assert.equal(notes?.points[0].evidence[0].documentId,source.documentId);
 assert.equal(resolveNoteQuoteIds({...input,points:[{...input.points[0],evidence:[{quoteId:'q999-999'}]}]},catalog,[source]),null);
});

test('quote catalog never stitches source windows, alters Unicode, or exceeds citation bounds',()=>{
 const original='تمهيد '.repeat(1000)+'قوله تعالى هذا بيان التوكل مع العمل والأخذ بالأسباب. '+ 'شرح '.repeat(2000)+'وفي الختام يذكر التوكل على الله بعد المشورة.';
 const long={...source,rawJsonSnippet:{primaryExcerpt:original}};
 const catalog=buildQuoteCatalog([long]);
 assert.ok(catalog.length>0);
 for(const row of catalog){assert.ok(original.includes(row.quote));assert.ok(row.quote.length>=20&&row.quote.length<=350);assert.ok(!row.quote.includes('separate source excerpt'));}
 const duplicate=[catalog[0],catalog[0]];
 assert.equal(resolveNoteQuoteIds({points:[{text:'test',evidence:[{quoteId:catalog[0].quoteId}]}],gaps:[]},duplicate,[long]),null);
});
test('research notes require original citation IDs and verbatim source quotations',()=>{
 assert.deepEqual(validateResearchNotes(valid,[source]),valid);
 assert.equal(validateResearchNotes({...valid,points:[{...valid.points[0],evidence:[{documentId:'ayah-999-1',quote:valid.points[0].evidence[0].quote}]}]},[source]),null);
 assert.equal(validateResearchNotes({...valid,points:[{...valid.points[0],evidence:[{documentId:source.documentId,quote:'This fabricated sentence is not in the source.'}]}]},[source]),null);
});
test('empty, oversized, ambiguous and injected note payloads cannot become answers',()=>{
 for(const data of [null,{}, {points:[],gaps:[]}, {...valid,points:Array(5).fill(valid.points[0])}, {...valid,points:[{text:'[Sanity: evil-source]',evidence:valid.points[0].evidence}]}, {...valid,points:[{...valid.points[0],evidence:[]}]}])assert.equal(validateResearchNotes(data,[source]),null);
 assert.equal(validateResearchNotes(valid,[{...source,rawJsonSnippet:{primaryExcerpt:'different source'}}]),null);
 assert.equal(validateResearchNotes(valid,[source,{...source,rawJsonSnippet:{primaryExcerpt:'conflicting duplicate ID'}}]),null);
});
test('reading notes cannot authenticate narrations on behalf of the platform',()=>{
 assert.equal(validateResearchNotes({...valid,points:[{...valid.points[0],text:'Authentic hadith proves this supernatural benefit.'}]},[source]),null);
 assert.equal(validateResearchNotes({...valid,points:[{...valid.points[0],text:'ثبت بإجماع العلماء وصحة الحديث هذا الحكم.'}]},[source]),null);
});
test('long source windows include explanatory sections and reject stitched quotations',()=>{
 const text='Intro '.repeat(1000)+"Allah's statement Al-Hayy means the Ever-Living. "+'Middle '.repeat(1000)+'Ending explanation.';
 const window=sourceWindows(text);
 assert.ok(window.includes("Al-Hayy means the Ever-Living"));
 assert.ok(window.includes('Ending explanation.'));
 assert.ok(window.length<4300);
 const fabricated=window.slice(490,550);
 assert.equal(validateResearchNotes({...valid,points:[{...valid.points[0],evidence:[{documentId:source.documentId,quote:fabricated}]}]},[{...source,rawJsonSnippet:{primaryExcerpt:text}}]),null);
});
