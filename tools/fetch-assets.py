import urllib.request, json, tarfile, io, pathlib, concurrent.futures, xml.etree.ElementTree as ET
root=pathlib.Path('/workspace/sites/kotori-nihongo/dist/assets')
meta=json.load(urllib.request.urlopen('https://registry.npmjs.org/kuromoji/0.1.2',timeout=30))
data=urllib.request.urlopen(meta['dist']['tarball'],timeout=60).read()
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as tar:
 for m in tar.getmembers():
  rel=m.name.removeprefix('package/')
  if m.isfile() and (rel=='build/kuromoji.js' or rel.startswith('dict/') or rel in ['LICENSE-2.0.txt','NOTICE.md']):
   p=root/'kuromoji'/rel
   p.parent.mkdir(parents=True,exist_ok=True)
   p.write_bytes(tar.extractfile(m).read())
chars='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
def fetch(ch):
 url=f'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{ord(ch):05x}.svg'
 raw=urllib.request.urlopen(url,timeout=30).read()
 svg=ET.fromstring(raw)
 paths=[x.attrib['d'] for x in svg.iter() if x.tag.endswith('}path') and 'd' in x.attrib]
 return ch,paths
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 strokes=dict(pool.map(fetch,chars))
(root/'strokes.json').write_text(json.dumps(strokes,ensure_ascii=False),encoding='utf-8')
licenses=root/'licenses';licenses.mkdir(exist_ok=True)
licenses.joinpath('KanjiVG-COPYING.txt').write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/KanjiVG/kanjivg/master/COPYING',timeout=30).read())
print(json.dumps({'kana':len(strokes),'kuromoji_bytes':sum(p.stat().st_size for p in (root/'kuromoji').rglob('*') if p.is_file())}))
