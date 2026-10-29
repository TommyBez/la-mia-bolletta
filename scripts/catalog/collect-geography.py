#!/usr/bin/env python3
"""Resumable official geographic repertoire. Prefix queries avoid 7,894 lookups.
Only public Portal responses are stored. No session, token or supplier is used.
"""
import argparse,json,time,string,hashlib
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import quote
p=argparse.ArgumentParser();p.add_argument('--out',default='src/modules/references/data/portal-geography');p.add_argument('--force',action='store_true');a=p.parse_args()
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
url='https://www.ilportaleofferte.it/portaleOfferte/api/rs/it/portal/geoService.json?cap-comune='
for prefix in string.ascii_lowercase:
 path=out/(prefix+'.json')
 if path.exists() and not a.force:continue
 for attempt in range(4):
  try:
   body=urlopen(url+quote(prefix),timeout=45).read();data=json.loads(body)
   service=data['response']['result']['services'];items=service.get('item',[]);items=items if isinstance(items,list) else [items]
   if int(service['size'])!=len(items):raise ValueError('Truncated official prefix response')
   (out/(prefix+'.raw.json')).write_bytes(body)
   safe={'prefix':prefix,'source':url+quote(prefix),'observedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sha256':hashlib.sha256(body).hexdigest(),'items':items}
   path.write_text(json.dumps(safe,ensure_ascii=False,indent=2));print(prefix,len(items),flush=True);break
  except Exception as e:
   if attempt==3:raise
   time.sleep(2**attempt)
 time.sleep(.15)
allrows={}
for f in out.glob('?.json'):
 for row in json.loads(f.read_text())['items']:
  key=row['codIstat']
  if key in allrows and allrows[key]!=row:raise ValueError('Conflicting official municipality '+key)
  allrows[key]=row
summary={'observedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'prefixes':len(list(out.glob('?.json'))),'municipalities':len(allrows),'items':list(allrows.values())}
(out/'all.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
manifest={'sources':[{k:v for k,v in json.loads(f.read_text()).items() if k!='items'} for f in sorted(out.glob('?.json'))]}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Total',len(allrows),flush=True)
