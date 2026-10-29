from pathlib import Path
from decimal import Decimal as D
import json,re
ROOT=Path(__file__).resolve().parent
profiles=json.loads((ROOT/'gas-profiles-2026-2027.json').read_text())['profiles']
quarters=json.loads((ROOT.parent/'sonda-au-gas-2026-10-28/monthly/direct-quarter-results.json').read_text())['calibration']
q=[D(x['implied_eur_smc']) for x in quarters for _ in range(3)]
def expected(row,volume):return D(174)+D(volume)*sum(D(x)*y/100 for x,y in zip(row['percentages'],q))
candidates={r['profile']:expected(r,1200) for r in profiles if r['profile'].startswith('C1')}
assert min(abs(a-b) for i,a in enumerate(candidates.values()) for j,b in enumerate(candidates.values()) if i!=j)>D('.02')
results=[]
for city in ['022205','022252','024027']:
 for file in (ROOT/'portal-probes'/city).glob('*.json'):
  d=json.loads(file.read_text());obs=D(d['sale'].replace('.','').replace(',','.'))
  compatible=[]
  for r in profiles:
   if not r['profile'].startswith('C1'):continue
   pred=expected(r,str(d['volume']))
   if abs(obs-pred)<=D('.02'):compatible.append({'profile':r['profile'],'predicted':str(pred),'observed':str(obs),'residual':str(obs-pred)})
  assert len(compatible)==1,(city,obs,compatible)
  results.append({'istat_code_used_by_portal':city,'volume_smc':d['volume'],'matches':compatible,'source_file':str(file.relative_to(ROOT))})
assert any(r['istat_code_used_by_portal']=='022252' and r['volume_smc']==600 for r in results)
for file in (ROOT/'portal-probes').rglob('*cost.html'):
 assert not re.search(r'csrf|currentFilterJSON|sessionid',file.read_text(),re.I),file
for f in ['geo-portoempedocle.json','geo-lampedusa.json']:
 d=json.loads((ROOT/'portal-probes'/f).read_text());assert d['response']['result']['services']['item']['esclusoOffertaGas']==1
out={'method':'Unique compatible annual energy-sale profile using published AU gas profiles, independently recovered quarterly PSV, known fixed174 and spread0; no taxes used.','tolerance_eur':'.02','candidates_at_1200_smc':{k:str(v) for k,v in candidates.items()},'results':results,'note':'Inference of Portal calculation profile, not replacement of legal climatic classification. Borgo600 uses coefficients fixed independently before response reading.'}
(ROOT/'portal-profile-checks.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
