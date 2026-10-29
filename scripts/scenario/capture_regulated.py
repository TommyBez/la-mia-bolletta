#!/usr/bin/env python3
"""Capture official displayed regulated unit prices; never infer missing values as zero."""
from zoneinfo import ZoneInfo
import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
from acquire import Acquisition

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True);p.add_argument('--out',required=True,type=Path);p.add_argument('--offers',required=True,nargs='+');p.add_argument('--pure-bands',action='store_true');p.add_argument('--bands',nargs=3,default=['990','930','1080']);p.add_argument('--offer-type',choices=['fixed','variable'],default='variable')
 args=p.parse_args();now=datetime.now(ZoneInfo('Europe/Rome'))
 plan={'commodity':'electricity','officialSources':[{'url':args.source,'kind':'official_offer'}]}
 capture=Acquisition(plan,args.out,now)
 for code in args.offers:
  for bands in ([[3000,0,0],[0,3000,0],[0,0,3000]] if args.pure_bands else [[float(v) for v in args.bands]]):
   capture.quote({'offerCode':code,'offerType':args.offer_type},{capture.months[-1]:bands},annual=True)
 (args.out/'evidence.json').write_text(json.dumps({'observedAt':now.isoformat(),'evidence':capture.evidence},indent=2))
 for e in capture.evidence:
  if e['kind']=='sanitized_probe':
   data=json.loads((args.out/e['blobKey']).read_text());print(json.dumps({'offerCode':data['offerCode'],'unitaryRows':data.get('unitaryRows',[]),'evidence':e}))
if __name__=='__main__':
 try:main()
 except Exception as exc:print(json.dumps({'status':'failed','reason':str(exc)[:220]}));raise SystemExit(1)
