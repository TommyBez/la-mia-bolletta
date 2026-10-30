#!/usr/bin/env python3
"""Independent numeric check of the current fixed optional-energy cohort; no price fallback."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from decimal import Decimal as D
from html import unescape
import argparse,json,re
from pathlib import Path
from zoneinfo import ZoneInfo
from acquire import Acquisition

def probe(job):
 item,source,root,now=job;out=root/item['economicFingerprint']
 a=Acquisition({'commodity':'electricity','officialSources':[{'url':source['url'],'kind':'official_offer'}]},out,now)
 if a.evidence[0]['sha256']!=source['sha256']:raise ValueError('Official XML changed before independent verification')
 a.save({'expectedAnnualCost':item['expectedAnnualCost'],'expectedSales':item['expectedSales'],'offerCode':item['offerCode'],'bands':['891','837','972']},'prediction_before_query')
 sale,ref=a.quote({'offerCode':item['offerCode'],'offerType':'fixed'},{a.months[-1]:[891,837,972]},annual=True)
 quote=json.loads((out/a.evidence[ref]['blobKey']).read_text());unit=a.evidence[quote['unitEvidenceIndex']];html=(out/unit['blobKey']).read_text()
 total=None
 for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',html,re.S):
  text=' '.join(unescape(re.sub('<[^>]+>',' ',row)).split())
  if text.startswith('Spesa annua stimata'):
   amount=re.search(r'([\d.]+,\d{2})',text)
   if amount:total=amount[1].replace('.','').replace(',','.')
 if total is None:raise ValueError('Official total missing')
 result={**item,'observedSales':sale,'observedAnnualCost':total,'difference':str(D(total)-D(item['expectedAnnualCost'])),'sourceEvidence':unit,'status':'qualified' if abs(D(total)-D(item['expectedAnnualCost']))<=D('.01') else 'divergence_requires_investigation'}
 (out/'evidence.json').write_text(json.dumps({'observedAt':now.astimezone(timezone.utc).isoformat(),'evidence':a.evidence},indent=2));(out/'result.json').write_text(json.dumps(result,indent=2));return result

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--plan',required=True,type=Path);p.add_argument('--out',required=True,type=Path);args=p.parse_args();plan=json.loads(args.plan.read_text());now=datetime.now(ZoneInfo('Europe/Rome'))
 with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(probe,[(item,plan['source'],args.out,now) for item in plan['probes']]))
 report={'observedAt':now.isoformat(),'catalogVersionId':plan['catalogVersionId'],'scenarioVersionId':plan['scenarioVersionId'],'results':results};(args.out/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':
 try:main()
 except Exception as exc:print(json.dumps({'status':'failed','reason':str(exc)[:240]}));raise SystemExit(1)
