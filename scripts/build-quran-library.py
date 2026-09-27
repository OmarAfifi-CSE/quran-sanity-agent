"""Convert downloaded source snapshots to bounded Sanity documents; never infer anchors."""
import pathlib,json,hashlib,re,unicodedata
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data/staging/quran-api'
class Text(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.out=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.skip+=1
        if tag in ('p','br','div','h1','h2','h3','li'):self.out.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style') and self.skip:self.skip-=1
        if tag in ('p','div','h1','h2','h3','li'):self.out.append('\n')
    def handle_data(self,data):
        if not self.skip:self.out.append(data)
def plain(raw):
    p=Text();p.feed(raw);return re.sub(r'\n{3,}','\n\n',''.join(p.out)).strip()
def norm(text):
    text=unicodedata.normalize('NFKD',text).lower()
    text=re.sub('[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]','',text)
    text=text.translate(str.maketrans('أإآٱىة','اااايه'))
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in text).split())
catalog=json.loads((DATA/'tafsir-catalog.json').read_text(encoding='utf8'))['tafsirs']
report=json.loads((ROOT/'docs/audit/quran-api-download.json').read_text(encoding='utf8'))
if report['completedResources']!=len(catalog):raise ValueError('Wait for all resource downloads before building')
if any(r['errors'] or r['invalidKeys'] or r['duplicateKeys'] for r in report['resources']):raise ValueError('Resolve failed pages before building')
out=ROOT/'data/staging/quran-api-import.ndjson'
summaries=[]; count=0
with out.open('w',encoding='utf8') as target:
    for resource in catalog:
        rid=resource['id'];edition=f'quran-com-{rid}';entries=[]
        for file in sorted((DATA/f'tafsir-{rid}').glob('*.json')):
            payload=json.loads(file.read_text(encoding='utf8'))
            for row in payload['tafsirs']:
                raw=row.get('text') or '';text=plain(raw)
                if not text:continue
                key=row['verse_key'];s,a=map(int,key.split(':'))
                entries.append({'_key':f'v{s}-{a}','verseKey':key,'surahNumber':s,'ayahNumber':a,'ayah':{'_type':'reference','_ref':f'ayah-{s}-{a}'},'text':text,'originalHtml':raw,'sha256':hashlib.sha256(raw.encode()).hexdigest(),'searchText':norm(text),'sourceUrl':f'https://api.quran.com/api/v4/tafsirs/{rid}/by_chapter/{s}?per_page=50&page={file.stem.split(".")[1]}','upstreamRecordId':str(row['id'])})
        entries.sort(key=lambda e:(e['surahNumber'],e['ayahNumber']))
        # Original HTML is preserved in the immutable downloaded snapshots.
        # Sanity keeps readable text, normalized search text, URL and original hash.
        for entry in entries: entry.pop('originalHtml')
        if len({e['verseKey'] for e in entries})!=len(entries):raise ValueError(f'Duplicate anchors {rid}')
        shards=[];current=[];size=0
        for entry in entries:
            cost=len(json.dumps(entry,ensure_ascii=False).encode())
            if cost>850000:raise ValueError(f'Entry exceeds document budget {rid} {entry["verseKey"]}')
            if current and (size+cost>600000 or current[0]['surahNumber']!=entry['surahNumber']):shards.append(current);current=[];size=0
            current.append(entry);size+=cost
        if current:shards.append(current)
        audit=next(r for r in report['resources'] if r['id']==rid)
        metadata={'_id':f'edition-{edition}','_type':'sourceEdition','resourceId':rid,'title':resource['name'],'author':resource['author_name'],'language':resource['language_name'],'slug':resource['slug'],'sourceUrl':'https://api.quran.com/api/v4/resources/tafsirs','directAnchors':len(entries),'missingDirectAnchors':audit['missing'],'reviewStatus':'imported','coverageNote':'Counts describe explicit nonempty verse anchors. Missing anchors may be grouped or unavailable; no preceding-verse inference.','chunks':len(shards)}
        target.write(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n');count+=1
        summaries.append(metadata)
        for i,items in enumerate(shards):
            chunk={'_id':f'library-quran-api-{rid}-{i+1:04d}','_type':'libraryChunk','edition':edition,'sourceEdition':{'_type':'reference','_ref':metadata['_id']},'titleArabic':resource['name'],'titleEnglish':resource['translated_name']['name'],'language':{'arabic':'ar','english':'en','bengali':'bn','urdu':'ur','russian':'ru','Kurdish':'ku'}.get(resource['language_name'],resource['language_name']),'kind':'tafsir','sourceAsset':f'Quran.com API resource {rid}','sourceAssetSha256':hashlib.sha256(json.dumps(items,ensure_ascii=False).encode()).hexdigest(),'sourceLocator':f'Tafsir resource {rid}; source record IDs and verse keys preserved','verification':'imported_exact_anchor','reviewNote':'Verbatim imported source copy with explicit verse anchor, not specialist review or hadith authentication.','searchText':' '.join(e['searchText'] for e in items),'entries':items}
            chunk['searchText']=' '.join(sorted({word for entry in items for word in entry['searchText'].split()}))
            target.write(json.dumps(chunk,ensure_ascii=False,separators=(',',':'))+'\n');count+=1
manifest={'documents':count,'editions':summaries,'entries':sum(s['directAnchors'] for s in summaries),'fileBytes':out.stat().st_size}
(ROOT/'docs/audit/quran-api-import-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(ROOT/'web/data/edition-catalog.json').write_text(json.dumps(summaries,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps({'documents':count,'editions':len(summaries),'entries':manifest['entries'],'bytes':manifest['fileBytes']}))
