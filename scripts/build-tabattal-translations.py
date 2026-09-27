"""Stage the remaining Tabattal translation; compare bundled editions without rewriting them."""
import pathlib,json,hashlib,re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data/staging/quran-api'
class Plain(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('sup','script','style'):self.skip+=1
        if tag in ('p','br','div') and not self.skip:self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('sup','script','style') and self.skip:self.skip-=1
        if tag in ('p','div') and not self.skip:self.parts.append('\n')
    def handle_data(self,text):
        if not self.skip:self.parts.append(text)
def plain(raw):
    p=Plain();p.feed(raw);return ''.join(p.parts).strip()
base=json.loads((ROOT/'web/data/library.json').read_text(encoding='utf8'))
canonical=json.loads((ROOT/'web/src/sanity/corpus.json').read_text(encoding='utf8'))
valid={f"{s['number']}:{a}" for s in canonical['surahs'] for a in range(1,s['totalAyahs']+1)}
comparison=[]
for rid in [20,33]:
    bundled={e['verseKey']:e for c in base if c['edition']==f'translation-{rid}' for e in c['entries']}
    remote=json.loads((DATA/f'translation-{rid}.json').read_text(encoding='utf8'))
    different=[e['verse_key'] for e in remote['translations'] if bundled[e['verse_key']]['originalHtml']!=e['text']]
    comparison.append({'resourceId':rid,'providerMetadata':remote['meta'],'compared':len(bundled),'originalHtmlDifferences':different,'policy':'Keep original bundled snapshot intact; provider identity is resource metadata, not proof of identical edition or license.'})
rid=134;payload=json.loads((DATA/f'translation-{rid}.json').read_text(encoding='utf8'))
entries=[]
for row in payload['translations']:
    key=row['verse_key'];s,a=map(int,key.split(':'));raw=row['text']
    if key not in valid or row['resource_id']!=rid or not plain(raw):raise ValueError('Invalid translation anchor')
    entries.append({'_key':f'v{s}-{a}','verseKey':key,'surahNumber':s,'ayahNumber':a,'ayah':{'_type':'reference','_ref':f'ayah-{s}-{a}'},'text':plain(raw),'originalHtml':raw,'sha256':hashlib.sha256(raw.encode()).hexdigest(),'sourceUrl':f'https://api.quran.com/api/v4/quran/translations/{rid}?fields=verse_key','upstreamRecordId':f'{rid}:{key}'})
if len(entries)!=6236 or len({e['verseKey'] for e in entries})!=6236:raise ValueError('Incomplete translation')
entries.sort(key=lambda e:(e['surahNumber'],e['ayahNumber']))
meta={'_id':'edition-quran-translation-134','_type':'sourceEdition','resourceId':rid,'title':payload['meta']['translation_name'],'author':payload['meta']['author_name'],'language':'indonesian','reviewStatus':'imported','sourceUrl':'https://api.quran.com/api/v4/resources/translations','directAnchors':6236,'chunks':114,'missingDirectAnchors':[],'coverageNote':'Indonesian translation, explicit provider verse anchors. Footnote markers omitted from readable text; original HTML retained. Not tafsir.'}
docs=[meta]
for s in range(1,115):
    items=[e for e in entries if e['surahNumber']==s]
    docs.append({'_id':f'library-quran-translation-134-{s:04d}','_type':'libraryChunk','edition':'quran-translation-134','sourceEdition':{'_type':'reference','_ref':meta['_id']},'titleArabic':'ترجمة مجمع الملك فهد — الإندونيسية','titleEnglish':meta['title'],'language':'id','kind':'translation','sourceAsset':'Quran.com API translation 134','sourceAssetSha256':hashlib.sha256(json.dumps(items,ensure_ascii=False).encode()).hexdigest(),'sourceLocator':'Translation resource 134; original verse keys; resource-and-verse composite locator','verification':'imported_exact_anchor','reviewNote':meta['coverageNote'],'entries':items})
(ROOT/'data/staging/tabattal-translation-import.json').write_text(json.dumps(docs,ensure_ascii=False),encoding='utf8')
(ROOT/'docs/audit/translation-snapshot-comparison.json').write_text(json.dumps(comparison,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'documents':len(docs),'newEntries':len(entries),'differences':{r['resourceId']:len(r['originalHtmlDifferences']) for r in comparison}}))
