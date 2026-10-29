"""Offline audit of official export files. Usage: python scan-history.py DIR ...
Output: audit.json beside this script. No network; only PO_Offerte_* XML files.
Separate default/specific prices; flag different periods for review, not proof.
"""
import sys,json,hashlib,itertools,collections
from pathlib import Path
import xml.etree.ElementTree as E
N={'n':'http://www.acquirenteunico.it/schemas/SII_AU/OffertaRetail/01'}
def t(e,k):return e.findtext('n:'+k,'',N)
def period(e):
 p=e.find('n:PeriodoValidita',N)
 return None if p is None else {c.tag.split('}')[-1]:c.text for c in p}
def default(e):return not(t(e,'CONSUMO_DA') or t(e,'CONSUMO_A') or period(e))
def obj(e):return {c.tag.split('}')[-1]:obj(c) if len(c) else c.text for c in e}
manifest=[];pairs=[];inversions=[];seen=set();codes=set();unsorted=0
for arg in sys.argv[1:]:
 for f in sorted(Path(arg).glob('PO_Offerte_*_MLIBERO_*.xml')):
  if f.name in seen:continue
  seen.add(f.name);r=E.parse(f).getroot();day=f.stem[-8:]
  url=f'https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/{day[:4]}_{int(day[4:6])}/{f.name}'
  manifest.append({'file':f.name,'url':url,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'records':len(r)})
  for o in r:
   ident=o.find('n:IdentificativiOfferta',N);code=t(ident,'COD_OFFERTA');codes.add(code)
   for co in o.findall('n:ComponenteImpresa',N):
    ints=co.findall('n:IntervalloPrezzi',N);prices=[float(t(x,'PREZZO')) for x in ints]
    unsorted+=int(prices!=sorted(prices))
    for (i,a),(j,b) in itertools.combinations(enumerate(ints),2):
     if t(a,'UNITA_MISURA')!=t(b,'UNITA_MISURA') or t(a,'FASCIA_COMPONENTE')!=t(b,'FASCIA_COMPONENTE') or default(a)!=default(b):continue
     lo=max(float(t(a,'CONSUMO_DA')or 0),float(t(b,'CONSUMO_DA')or 0));hi=min(float(t(a,'CONSUMO_A')or 'inf'),float(t(b,'CONSUMO_A')or 'inf'))
     if lo>hi:continue
     if t(a,'PREZZO')==t(b,'PREZZO') and t(a,'TIPO_PREZZO')==t(b,'TIPO_PREZZO') and period(a)==period(b):continue
     q={'file':f.name,'code':code,'component':t(co,'NOME'),'positions':[i,j],'first':obj(a),'second':obj(b),'same_period':period(a)==period(b),'first_price_higher':float(t(a,'PREZZO'))>float(t(b,'PREZZO'))}
     pairs.append(q)
     if q['first_price_higher']:inversions.append(q)
result={'scope':'Sibling intervals in same component, band, unit and default/specific class; overlapping consumption. Different periods require manual temporal review.','manifest':manifest,'summary':{'exports':len(manifest),'records_including_repeats':sum(m['records'] for m in manifest),'distinct_offer_codes':len(codes),'potential_pairs':len(pairs),'higher_first_candidates':len(inversions),'components_with_any_decreasing_prices':unsorted},'pairs':pairs,'higher_first_candidates':inversions}
Path(__file__).with_name('audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result['summary']))
