import {test} from 'node:test';
import assert from 'node:assert/strict';
import {thematicVerseKeys} from '../src/lib/research';
import {localCorpus} from '../src/lib/corpus';
test('compound reliance/action query gets actual precaution and consultation candidate anchors',()=>{
 const refs=thematicVerseKeys('كيف يجمع القرآن بين التوكل والأخذ بالأسباب؟');
 assert.deepEqual(refs,['12:67','3:159']);
 assert.deepEqual(thematicVerseKeys('How does trust in God relate to taking practical means?'),refs);
 const ayahs=localCorpus().ayahs;
 assert.ok(ayahs.find(a=>a._id==='ayah-12-67')?.textUthmani.includes('بَابٍۢ'));
 assert.ok(ayahs.find(a=>a._id==='ayah-3-159')?.textUthmani.includes('وَشَاوِرْهُمْ'));
 for(const q of ['justice even against oneself','quantum blockchain','ما معنى التوكل؟'])assert.deepEqual(thematicVerseKeys(q),[]);
});
