#!/usr/bin/env python3
"""Bounded concurrent acquisition and restart from completed, immutable monthly parts."""
from zoneinfo import ZoneInfo
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import shutil
from acquire import Acquisition


def run_part(job):
    plan, out, now = job
    digest = sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()
    if (out/'snapshot.json').exists():
        if (out/'plan.sha256').read_text()!=digest: raise ValueError('Part plan changed: use a new output directory')
        saved = json.loads((out/'snapshot.json').read_text())
        if saved['acquisitionMonth']!=now.strftime('%Y-%m'): raise ValueError('Cannot recycle an old monthly part')
        for evidence in saved['evidence']:
            if sha256((out/evidence['blobKey']).read_bytes()).hexdigest()!=evidence['sha256']: raise ValueError('Saved part digest mismatch')
        return out
    if out.exists(): shutil.rmtree(out)  # only an unfinished child of the explicit output directory
    Acquisition(plan, out, now).run()
    (out/'plan.sha256').write_text(digest)
    return out


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--plan',required=True,type=Path);p.add_argument('--out',required=True,type=Path)
    p.add_argument('--workers',type=int,default=3,choices=[1,2,3])
    args=p.parse_args();plan=json.loads(args.plan.read_text());now=datetime.now(ZoneInfo('Europe/Rome'))
    if plan['acquisitionMonth']!=now.strftime('%Y-%m'): raise ValueError('Plan must match the current month')
    jobs=[]
    for recipe in plan['quarterlyProbes']:
        part={**plan,'quarterlyProbes':[recipe],'annualProbes':[]}
        jobs.append((part,args.out/'parts'/f'quarter-{recipe["band"]}',now))
    for recipe in plan.get('annualProbes',[]):
        part={**plan,'quarterlyProbes':[],'annualProbes':[recipe]}
        jobs.append((part,args.out/'parts'/f'annual-{recipe["fingerprint"]}',now))
    paths=[]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures={pool.submit(run_part,job):job for job in jobs}
        try:
            for future in as_completed(futures): paths.append(future.result())
        except Exception:
            for future in futures: future.cancel()
            raise
    paths.sort()
    combined=None
    for path in paths:
        s=json.loads((path/'snapshot.json').read_text())
        if combined is None: combined={**s,**{k:[] for k in ['evidence','coefficients','calibrations','holdouts','annualSales','requiredAnnualFingerprints']}}
        offset=len(combined['evidence'])
        for probe in s['calibrations']+s['holdouts']: probe['evidenceIndex']+=offset
        for annual in s['annualSales']:
            for probe in annual['calibrations']+annual['holdouts']: probe['evidenceIndex']+=offset
        for k in ['evidence','coefficients','calibrations','holdouts','annualSales','requiredAnnualFingerprints']: combined[k]+=s[k]
        for evidence in s['evidence']:
            target=args.out/evidence['blobKey'];target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(path/evidence['blobKey'],target)
    if not combined: raise ValueError('Empty acquisition plan')
    combined['requiredAnnualFingerprints']=sorted(combined['requiredAnnualFingerprints'])
    if combined['annualSales']:
        from extend_peak import extend_snapshot
        combined=extend_snapshot(combined,args.out,plan,args.workers)
    (args.out/'snapshot.json').write_text(json.dumps(combined,indent=2))
    print(json.dumps({'status':'candidate_requires_validation','path':str(args.out/'snapshot.json'),'coefficients':len(combined['coefficients']),'annualFingerprints':len(combined['annualSales'])}))

if __name__=='__main__':
    try: main()
    except Exception as exc:
        print(json.dumps({'status':'failed','reason':str(exc)[:240]}));raise SystemExit(1)
