from pathlib import Path
from decimal import Decimal as D
import json
root=Path(__file__).resolve().parent
r=json.loads((root/'quarter-results.json').read_text())
cal=r['calibration']
assert len(cal)==4
for holdout in r['holdouts']:
 code,mode=holdout['code'],holdout['mode']
 candidates=list((root/'ordered-controls'/mode).glob(f'profile-{code}-*.json'))
 assert len(candidates)==1
 v=json.loads(candidates[0].read_text())
 obs=D(v['rows'][0].split('€')[1].strip().replace('.','').replace(',','.'))
 assert obs==D(holdout['observed'])
 monthly={x['competenza_consumi']:x for x in v['profile']['misure_mensili']}
 months=['202511','202601','202604','202607']
 predicted=D(120)
 for quarter,month in zip(cal,months):
  m=monthly[month]
  for i in range(1,4):
   coeff=(D(quarter[f'F{i}']['sale_eur'])-120)/3000
   predicted+=D(str(m[f'delta_misure_f{i}']))*coeff
 if code=='001686ESVFL00XXES2PC1026DO000000':predicted+=D(24)+D('.0055')*3000
 if code=='044848ESVFL01XX0000POWERHOME4ALL':predicted-=D('.0077')*3000
 assert abs(obs-predicted)<=D('.02'),(code,obs,predicted)
 assert predicted==D(holdout['expected'])
 assert v['profile']['consumiEE']['consF0']==3000
 assert sum(D(str(m['delta_misure_f1']))+D(str(m['delta_misure_f2']))+D(str(m['delta_misure_f3'])) for m in monthly.values())==3000
 print(code,mode,'predicted',predicted,'observed',obs,'PASS')
# Invariance controls: chronology and constant-monthly equivalence.
for mode,expected in [('202512',D('1011.23')),('flat',D('832.09'))]:
 v=json.loads(next((root/'ordered-controls'/mode).glob('profile-*.json')).read_text())
 obs=D(v['rows'][0].split('€')[1].strip().replace('.','').replace(',','.'))
 assert obs==expected
print('Four independent temporal holdouts and two controls PASS')
