import gzip, sqlite3, pathlib, json
source = pathlib.Path(r'C:/Users/Omar/Documents/Flutter/tabattal/assets/data/quran.db')
target = pathlib.Path('data/staging/tabattal/quran.sqlite').resolve()
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(gzip.decompress(source.read_bytes()))
db = sqlite3.connect(target.as_uri() + '?mode=ro', uri=True)
tables = db.execute("select name,sql from sqlite_master where type='table'").fetchall()
for name, sql in tables:
    quoted = '"' + name.replace('"', '""') + '"'
    count = db.execute('select count(*) from ' + quoted).fetchone()[0]
    print(json.dumps({'name':name,'count':count,'schema':sql},ensure_ascii=True))
for table in ['tafsir','translation']:
    print(table, db.execute(f'select resource_id,count(*),count(distinct verse_key) from {table} group by resource_id').fetchall())
    for row in db.execute(f'select verse_key,resource_id,substr(text,1,250) from {table} limit 2'):
        print(json.dumps(row,ensure_ascii=True))
