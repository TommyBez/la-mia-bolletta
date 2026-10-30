#!/usr/bin/env python3
"""Official ARERA legal names joined by exact VAT. No supplier website is read.
XLSX strings are decoded directly, without floating-point conversion of VAT.
"""
import argparse,json,re,hashlib,time
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urljoin
from zipfile import ZipFile
from io import BytesIO
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
PAGE='https://www.arera.it/area-operatori/ricerca-operatori'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,t,a):
  if t=='a':
   href=dict(a).get('href','')
   if '/ricercaoperatori/' in href and href.endswith('.zip'):self.links.append(urljoin(PAGE,href))
def parse_workbook(body):
 outer=ZipFile(BytesIO(body));files=[n for n in outer.namelist() if n.endswith('.xlsx')]
 if len(files)!=1:raise ValueError('Expected one official XLSX')
 z=ZipFile(BytesIO(outer.read(files[0])));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
 rows=[]
 for path in z.namelist():
  if not path.startswith('xl/worksheets/sheet') or not path.endswith('.xml'):continue
  for row in ET.fromstring(z.read(path)).findall('.//s:row',ns):
   cells={}
   for c in row.findall('s:c',ns):
    v=c.find('s:v',ns);v=v.text if v is not None else ''.join(c.itertext())
    if c.get('t')=='s':v=strings[int(v)]
    cells[re.sub(r'\d','',c.get('r'))]=v
   rows.append(cells)
 if not rows:raise ValueError('Empty official operator workbook')
 if rows[0].get('A')=='RAGIONE SOCIALE' and rows[0].get('B')=='PARTITA IVA':return rows[1:]
 if rows[0].get('A')=='Società' and rows[0].get('D')=='Partita IVA':return [{'A':r.get('A',''),'B':r.get('D','')} for r in rows[1:]]
 raise ValueError('Unexpected official seller columns')
p=argparse.ArgumentParser();p.add_argument('--out',default='src/modules/references/data/suppliers');p.add_argument('--required-vats-file');a=p.parse_args();out=Path(a.out);(out/'raw').mkdir(parents=True,exist_ok=True)
page=urlopen(PAGE,timeout=45).read();(out/'raw/arera-page.html').write_bytes(page);parser=Links();parser.feed(page.decode());urls=[u for u in parser.links if re.search('export-(mercato|gas)-vend',u)]
if len(urls)!=2:raise ValueError('Official seller ZIP links were not found uniquely')
required=set(json.loads(Path(a.required_vats_file).read_text())) if a.required_vats_file else set()
if required:
 general=[u for u in parser.links if 'operatori-export-' in u]
 if len(general)!=1:raise ValueError('General official operator ZIP link is ambiguous')
 urls+=general
by_vat={};invalid=[];sources=[];observed=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
for url in urls:
 body=urlopen(url,timeout=60).read();name=url.rsplit('/',1)[-1];(out/'raw'/name).write_bytes(body);sha=hashlib.sha256(body).hexdigest();sources.append({'url':url,'sha256':sha,'file':'raw/'+name})
 for row in parse_workbook(body):
  raw_vat=row.get('B','');name=row.get('A','').strip()
  if not raw_vat.isdigit() or len(raw_vat)>11 or not name:invalid.append({'sourceUrl':url,'sourceVat':raw_vat,'sourceName':name});continue
  vat=raw_vat.zfill(11)
  if 'operatori-export-' in url and (vat in by_vat or vat not in required):continue
  entry=by_vat.setdefault(vat,{'names':set(),'sourceUrls':set(),'sourceSha256':set(),'sourceVatValues':set()});entry['names'].add(name);entry['sourceUrls'].add(url);entry['sourceSha256'].add(sha);entry['sourceVatValues'].add(raw_vat)
suppliers=[];ambiguous=[]
for vat,entry in sorted(by_vat.items()):
 if len(entry['names'])!=1:ambiguous.append({'vat':vat,'names':sorted(entry['names'])});continue
 suppliers.append({'vat':vat,'name':next(iter(entry['names'])),'sourceUrls':sorted(entry['sourceUrls']),'sourceSha256':sorted(entry['sourceSha256']),'sourceVatValues':sorted(entry['sourceVatValues']),'observedAt':observed})
(out/'suppliers.json').write_text(json.dumps(suppliers,ensure_ascii=False,indent=2))
manifest={'sourcePage':PAGE,'observedAt':observed,'sources':sources,'supplierCount':len(suppliers),'requiredCatalogVats':len(required),'unresolvedRequiredVats':sorted(required-{s['vat'] for s in suppliers}),'ambiguous':ambiguous,'invalid':invalid,'join':'Exact source VAT as string; leading zeros preserved; left-padding to11 only; legal names from official registry; no commercial-name inference'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps({'suppliers':len(suppliers),'ambiguous':len(ambiguous),'invalid':len(invalid)}))
