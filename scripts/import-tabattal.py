"""Read supplied asset; preserve exact source HTML and explicit verse anchors."""
import gzip, sqlite3, pathlib, json, hashlib, re
from html.parser import HTMLParser
SOURCE = pathlib.Path(r'C:/Users/Omar/Documents/Flutter/tabattal/assets/data/quran.db')
ROOT = pathlib.Path(__file__).resolve().parents[1]
class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.parts=[]; self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','sup'): self.skip+=1
        if tag in ('p','br','div') and not self.skip: self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style','sup') and self.skip: self.skip-=1
        if tag in ('p','div') and not self.skip: self.parts.append('\n')
    def handle_data(self,data):
        if not self.skip: self.parts.append(data)
def plain(html):
    parser=PlainText(); parser.feed(html); return ''.join(parser.parts).strip()
payload=SOURCE.read_bytes(); digest=hashlib.sha256(payload).hexdigest()
db=sqlite3.connect(':memory:'); db.deserialize(gzip.decompress(payload)); db.execute('PRAGMA query_only=ON')
corpus=json.loads((ROOT/'web/src/sanity/corpus.json').read_text(encoding='utf8'))
valid={f"{s['number']}:{a}" for s in corpus['surahs'] for a in range(1,s['totalAyahs']+1)}
configs=[('tafsir',16,'muyassar','التفسير الميسر','Al-Muyassar','ar','tafsir'),('translation',20,'translation-20','ترجمة المورد 20','Translation resource 20','en','translation'),('translation',33,'translation-33','ترجمة المورد 33','Translation resource 33','id','translation'),('ghareeb',None,'ghareeb','غريب القرآن — نسخة تبتل','Quran vocabulary — Tabattal copy','ar','glossary')]
docs=[]; reports=[]
for table,rid,edition,titleAr,titleEn,language,kind in configs:
    rows=db.execute(f'SELECT verse_key,text FROM {table}'+(' WHERE resource_id=?' if rid else ''),(rid,) if rid else ()).fetchall()
    seen=set(); entries=[]
    for key,raw in rows:
        if key not in valid or key in seen: raise ValueError(f'Invalid/duplicate anchor: {edition} {key}')
        seen.add(key)
        if not raw or not plain(raw): continue
        s,a=map(int,key.split(':'))
        entries.append({'_key':f'v{s}-{a}','verseKey':key,'surahNumber':s,'ayahNumber':a,'text':plain(raw),'originalHtml':raw,'sha256':hashlib.sha256(raw.encode()).hexdigest()})
    entries.sort(key=lambda e:(e['surahNumber'],e['ayahNumber']))
    shards=[]; current=[]; size=0
    for entry in entries:
        cost=len(json.dumps(entry,ensure_ascii=False).encode())
        if current and (size+cost>180000 or current[0]['surahNumber']!=entry['surahNumber']): shards.append(current);current=[];size=0
        current.append(entry);size+=cost
    if current: shards.append(current)
    for i,items in enumerate(shards):
        docs.append({'_id':f'library-tabattal-{edition}-{i+1:04d}','_type':'libraryChunk','edition':edition,'titleArabic':titleAr,'titleEnglish':titleEn,'language':language,'kind':kind,'sourceAsset':'tabattal/assets/data/quran.db','sourceAssetSha256':digest,'sourceLocator':f'{table}'+(f'; resource_id={rid}' if rid else ''),'verification':'imported_exact_anchor','reviewNote':'Imported text with explicit database verse keys. Not specialist reviewed. Missing verse anchors are not inferred. Translation footnote markers omitted from plain text; original HTML preserved.','entries':items})
    reports.append({'edition':edition,'rows':len(rows),'nonempty':len(entries),'chunks':len(shards),'missingDirectAnchors':sorted(valid-{e['verseKey'] for e in entries},key=lambda k:tuple(map(int,k.split(':'))))})
out=ROOT/'web/data';out.mkdir(exist_ok=True)
(out/'library.json').write_text(json.dumps(docs,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(ROOT/'data/staging/tabattal/library.ndjson').write_text('\n'.join(json.dumps(d,ensure_ascii=False,separators=(',',':')) for d in docs)+'\n',encoding='utf8')
report={'sourceAsset':str(SOURCE),'sourceAssetSha256':digest,'documents':len(docs),'entries':sum(r['nonempty'] for r in reports),'editions':reports,'excluded':['quran_search: verified Tanzil corpus retained','quran_words: layout and glyph data, not commentary evidence'],'noInferredRanges':True}
(ROOT/'docs/audit/tabattal-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({**report,'editions':[{**r,'missingDirectAnchors':len(r['missingDirectAnchors'])} for r in reports]},ensure_ascii=True,indent=2))
