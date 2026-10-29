#!/usr/bin/env python3
"""Qualify the full linear domain from official XML and independent boundary/power probes."""
from zoneinfo import ZoneInfo
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from decimal import Decimal as D
from hashlib import sha256
import json
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
from acquire import Acquisition


def structural_record(xml,annual):
 root=ET.fromstring(xml)
 for e in root.iter():e.tag=e.tag.split('}')[-1]
 matches=[o for o in root.findall('offerta') if o.findtext('./IdentificativiOfferta/COD_OFFERTA')==annual['offerCode'] and o.findtext('./IdentificativiOfferta/PIVA_UTENTE')==annual['supplierVat']]
 if len(matches)!=1:raise ValueError('Official identity missing or duplicated')
 record=matches[0]
 intervals=record.findall('./ComponenteImpresa/IntervalloPrezzi')
 if any(i.find('CONSUMO_DA') is not None or i.find('CONSUMO_A') is not None or i.find('PeriodoValidita') is not None or i.findtext('UNITA_MISURA') not in ['01','03'] for i in intervals):raise ValueError('Annual source is not structurally linear and power-independent')
 for discount in record.findall('Sconto'):
  conditions=discount.findall('./Condizione/CONDIZIONE_APPLICAZIONE')
  if conditions and all(c.text=='00' for c in conditions):raise ValueError('Applicable discount requires an explicit structural treatment')
 return record


def extend_one(job):
 annual,plan,out,now,source_sha=job
 if (out/'extension.json').exists():
  cached=json.loads((out/'extension.json').read_text())
  if 'observedAt' not in cached:raise ValueError('Cached extension has no original acquisition timestamp; use a fresh output directory')
  if cached['sourceSha256']!=source_sha or cached['acquisitionMonth']!=now.strftime('%Y-%m'):raise ValueError('Cached extension belongs to another official source or month')
  for evidence in cached['evidence']:
   if sha256((out/evidence['blobKey']).read_bytes()).hexdigest()!=evidence['sha256']:raise ValueError('Extension evidence checksum mismatch')
  return cached,out
 if out.exists():shutil.rmtree(out)
 capture=Acquisition(plan,out,now)
 if capture.evidence[0]['sha256']!=source_sha:raise ValueError('Official offer source changed while qualifying Peak domain')
 record=structural_record(capture.sources[0],annual)
 minimum=D(record.findtext('./CaratteristicheOfferta/CONSUMO_MIN','0'));maximum=D(record.findtext('./CaratteristicheOfferta/CONSUMO_MAX','20000'))
 # Existing controls cover 2000..6000; the new small-volume control covers the lower edge.
 profiles=[('1000',['330','310','360'],'3',True)]
 if maximum>=20000:profiles.append(('20000',['6600','6200','7200'],'3',True))
 for power in ['10','20']:
  for resident in [True,False]:profiles.append((f'power-{power}-{resident}',['1234','987','1779'],power,resident))
 controls=[]
 for label,bands,power,resident in profiles:
  total=sum(D(n) for n in bands)
  if total<minimum or total>maximum:continue
  predicted=D(annual['fixedAnnual'])+sum(D(annual[f'f{i+1}'])*D(value) for i,value in enumerate(bands))
  capture.save({'fingerprint':annual['fingerprint'],'label':label,'bands':bands,'powerKw':power,'resident':resident,'prediction':format(predicted,'f')},'prediction_before_query')
  recipe={'offerCode':annual['offerCode'],'offerType':next(p['offerType'] for p in plan['annualProbes'] if p['fingerprint']==annual['fingerprint']),'powerKw':power,'resident':resident}
  sale,ref=capture.quote(recipe,{capture.months[-1]:[float(v) for v in bands]},annual=True)
  controls.append({'id':f'extended-{annual["fingerprint"]}-{label}','f1':bands[0],'f2':bands[1],'f3':bands[2],'observedSales':sale,'evidenceIndex':ref,'powerKw':power,'resident':resident})
 result={'observedAt':now.astimezone(timezone.utc).isoformat().replace('+00:00','Z'),'sourceSha256':source_sha,'acquisitionMonth':now.strftime('%Y-%m'),'fingerprint':annual['fingerprint'],'domain':{'minKwh':format(minimum,'f'),'maxKwh':format(min(maximum,D(20000)),'f'),'powerKw':sorted(set(['3','4.5','6']+[p['powerKw'] for p in controls]),key=D),'resident':[True,False],'powerIndependent':True},'controls':controls,'evidence':capture.evidence}
 (out/'extension.json').write_text(json.dumps(result,indent=2));return result,out


def extend_snapshot(snapshot,path,plan,workers=3):
 if not snapshot['annualSales']:return snapshot
 now=datetime.now(ZoneInfo('Europe/Rome'))
 source_index=next(i for i,e in enumerate(snapshot['evidence']) if e['kind']=='official_offer')
 source_sha=snapshot['evidence'][source_index]['sha256']
 jobs=[(annual,plan,path/'extensions'/annual['fingerprint'],now,source_sha) for annual in snapshot['annualSales']]
 with ThreadPoolExecutor(max_workers=workers) as pool:results=list(pool.map(extend_one,jobs))
 for extension,out in results:
  annual=next(a for a in snapshot['annualSales'] if a['fingerprint']==extension['fingerprint'])
  offset=len(snapshot['evidence'])
  for control in extension['controls']:control['evidenceIndex']+=offset
  annual['holdouts']+=extension['controls'];annual['domain']=extension['domain']
  annual['structuralQualification']={'method':'official-xml-linear-sales-v1','sourceEvidenceIndex':source_index,'economicFingerprint':annual['fingerprint'],'noConsumptionTiers':True,'noPowerCharges':True,'noPricePeriods':True,'noApplicableDiscounts':True}
  snapshot['evidence']+=extension['evidence']
  for e in extension['evidence']:
   target=path/e['blobKey'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(out/e['blobKey'],target)
 snapshot['acquiredAt']=max([snapshot['acquiredAt']]+[extension['observedAt'] for extension,_ in results],key=lambda v:datetime.fromisoformat(v.replace('Z','+00:00')))
 return snapshot


def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--snapshot',required=True,type=Path);p.add_argument('--plan',required=True,type=Path);p.add_argument('--workers',type=int,default=3,choices=[1,2,3]);args=p.parse_args()
 snapshot=json.loads(args.snapshot.read_text());plan=json.loads(args.plan.read_text())
 if snapshot['acquisitionMonth']!=datetime.now(ZoneInfo('Europe/Rome')).strftime('%Y-%m'):raise ValueError('No old-month extension')
 snapshot=extend_snapshot(snapshot,args.snapshot.parent,plan,args.workers)
 args.snapshot.write_text(json.dumps(snapshot,indent=2));print(json.dumps({'status':'extended_candidate_requires_validation','path':str(args.snapshot)}))
if __name__=='__main__':
 try:main()
 except Exception as exc:print(json.dumps({'status':'failed','reason':str(exc)[:240]}));raise SystemExit(1)
