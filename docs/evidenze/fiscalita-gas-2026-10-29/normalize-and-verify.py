from pathlib import Path
from decimal import Decimal as D
import json,re,html,hashlib
root=Path(__file__).resolve().parent
probes=json.loads((root/'probes.json').read_text());result=[]
widths=list(map(D,['120','360','1080','2440']))
for c in probes:
 p=root/(c['istat']+'-cost.html')
 if not p.exists():continue
 s=p.read_text();rates={'excise':[],'regional':[]}
 for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',s,re.S):
  cells=[' '.join(html.unescape(re.sub('<[^>]+>',' ',x)).split()) for x in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',row,re.S)]
  key='excise'if any(x.startswith('Accisa -')for x in cells)else 'regional'if any(x.startswith('Add. reg.')for x in cells)else None
  if key:
   label=next(x for x in cells if x.startswith(('Accisa -','Add. reg.')))
   value=next(x for x in cells if re.fullmatch(r'[0-9]+,[0-9]+',x))
   rates[key].append({'label':label,'eur_smc':str(D(value.replace(',','.')))})
 assert len(rates['excise'])==4,(c,rates)
 assert len(rates['regional'])in[0,4],(c,rates)
 # Missing regional rows, if any, are not silently interpreted as zeros.
 if len(rates['regional'])!=4:raise AssertionError(('regional rows absent',c))
 sums={k:sum(w*D(r['eur_smc'])for w,r in zip(widths,rows))for k,rows in rates.items()}
 j=json.loads((root/(c['istat']+'.json')).read_text());tax=next(x for x in j['summary_rows']if x.startswith('Imposte '));observed=D(tax.split(' ')[1].replace('.','').replace(',','.'))
 total=sums['excise']+sums['regional'];assert abs(total-observed)<=D('.005'),(c,total,observed)
 exc=[r['eur_smc']for r in rates['excise']]
 group='ordinary'if list(map(D,exc))==list(map(D,['.044','.175','.17','.186']))else 'ex_cassa_mezzogiorno'if list(map(D,exc))==list(map(D,['.038','.135','.12','.15']))else'other'
 result.append({**c,'excise_group_observed':group,'rates':rates,'tax4000_predicted_unrounded_eur':str(total),'tax4000_observed_eur':str(observed),'rounding_compatible':True,'source':f'{c["istat"]}-cost.html'})
r={'observed_on':'2026-10-29','scope':'domestic4000Smc/year RISC; unit rates from official Portal detail, not supplier pages','complete_municipal_mapping':False,'regions_represented':sorted({x['region_code']for x in result}),'rows':result}
(root/'tax-matrix-observed.json').write_text(json.dumps(r,indent=2))
print('PASS',len(result),'municipal probes;',len(r['regions_represented']),'regions. No claim of complete municipal mapping.')
for r in result:print(r['town'],r['excise_group_observed'],[x['eur_smc']for x in r['rates']['regional']])

# Holdouts: re-use the 4000Smc rates, do not fit them to these volumes.
holdouts=[]
for code,vol in [('010025',500),('066049',1600)]:
 base=next(r for r in result if r['istat']==code)
 left=D(vol);ws=[]
 for width in map(D,['120','360','1080','1000000000']):
  q=min(left,width);ws.append(q);left-=q
 predicted=sum(w*D(rate['eur_smc'])for k in ['excise','regional']for w,rate in zip(ws,base['rates'][k]))
 value=json.loads((root/f'{code}-{vol}.json').read_text())
 observed=D(next(x for x in value['summary_rows']if x.startswith('Imposte ')).split(' ')[1].replace('.','').replace(',','.'))
 assert abs(predicted-observed)<=D('.005')
 holdouts.append({'istat':code,'volume_smc':vol,'predicted_unrounded_eur':str(predicted),'observed_eur':str(observed),'compatible':True})
(root/'holdout-results.json').write_text(json.dumps(holdouts,indent=2))
print('Two out-of-volume holdouts PASS',holdouts)
