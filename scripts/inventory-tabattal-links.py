"""Inventory source-code URL templates without fetching media or changing Tabattal."""
import pathlib,re,json,collections,urllib.parse
root=pathlib.Path(r'C:/Users/Omar/Documents/Flutter/tabattal')
out=pathlib.Path(__file__).resolve().parents[1]/'docs/audit/tabattal-links.json'
items={}
for file in (root/'lib').rglob('*.dart'):
    if file.name.startswith('app_localizations'):continue
    for line,text in enumerate(file.read_text(encoding='utf8').splitlines(),1):
        for url in re.findall(r'https?://[^\s\'"<>]+',text):
            if url in ('http://','https://'):continue
            host=urllib.parse.urlsplit(url).hostname
            kind='quran_api' if host=='api.quran.com' else 'audio' if host and any(x in host for x in ('mp3quran','quranicaudio','everyayah')) else 'other'
            item=items.setdefault(url,{'urlTemplate':url,'host':host,'kind':kind,'locations':[]})
            item['locations'].append({'file':file.relative_to(root).as_posix(),'line':line})
report={'source':str(root),'links':list(items.values()),'countsByKind':dict(collections.Counter(i['kind'] for i in items.values())),'handling':{'quran_api':'All20 enumerated tafsir editions and Tabattal translations20/33/134 downloaded; reports describe actual nonempty coverage.','audio':'Catalog/stream/timing templates identified; audio binaries are not textual scholarly evidence and were not bulk-downloaded.','other':'Application services, media placeholders and non-corpus links require per-link classification before use.'}}
out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report['countsByKind']))
