import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseContextResult,validatedContextSelection,contextPassageQuery} from '../src/lib/context-query';
test('selection cannot introduce an ID absent from actual Context rows',()=>{
 const rows=[{_id:'ayah-4-135',textUthmani:'actual text'},{_id:'ayah-16-111'}];
 assert.deepEqual(validatedContextSelection('["ayah-4-135","ayah-999-1"]',rows),['ayah-4-135']);
 assert.deepEqual(validatedContextSelection('',rows),[]);
 assert.deepEqual(validatedContextSelection('{"_id":"ayah-4-135"}',rows),[]);
 assert.deepEqual(validatedContextSelection('```json\n["ayah-4-135"]\n```',rows),['ayah-4-135']);
});
test('Context results reject tool errors and malformed payloads',()=>{
 assert.deepEqual(parseContextResult({content:[{type:'text',text:'{"result":[{"_id":"ayah-4-135"}]}'}]}),[{_id:'ayah-4-135'}]);
 assert.throws(()=>parseContextResult({isError:true,content:[{type:'text',text:'secret error'}]}),/Context tool failed/);
 assert.throws(()=>parseContextResult({content:[{type:'text',text:'not json'}]}),/Context tool payload/);
});
test('passage query uses bounded exact verse anchors and fixed publication gates',()=>{
 const q=contextPassageQuery(['4:135'],['quran-com-14']);
 assert.ok(q.includes('verification == "imported_exact_anchor"'));
 assert.ok(q.includes('"citationId"'));
 assert.ok(q.includes('"4:135"'));
 assert.ok(q.includes('[0...6]'));
 assert.throws(()=>contextPassageQuery(['4:135"] | *[]'],[]),/Invalid verse/);
});
