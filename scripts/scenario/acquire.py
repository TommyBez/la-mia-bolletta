#!/usr/bin/env python3
"""Manual, anonymous Portale acquisition. No scheduler, user documents, or saved credentials.

Plan contains current official probe economics and all current Peak fingerprints.
Output is a candidate ONLY; validate/import with operator.ts after independent checks.
"""
from zoneinfo import ZoneInfo
import argparse
from datetime import datetime, timezone, date
from decimal import Decimal as D, getcontext
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
from http.cookiejar import CookieJar
import json
from pathlib import Path
import re
from urllib.parse import urlencode, urlparse
from urllib.request import build_opener, HTTPCookieProcessor, HTTPRedirectHandler, Request

getcontext().prec = 50
BASE = 'https://www.ilportaleofferte.it'
HOSTS = {'www.ilportaleofferte.it', 'www.arera.it'}


def official(url):
    u = urlparse(url)
    if u.scheme != 'https' or u.hostname not in HOSTS or u.username or u.password:
        raise ValueError('Only HTTPS Portale/ARERA source URLs are allowed')
    return url


class OfficialRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        official(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Form(HTMLParser):
    def __init__(self):
        super().__init__(); self.token = ''; self.active = False; self.fields = {}
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'input' and a.get('name') == 'csrf_token': self.token = a.get('value', '')
        if tag == 'form': self.active = a.get('id') == 'formDettaglioOffertaML'
        if self.active and tag == 'input' and 'name' in a: self.fields[a['name']] = a.get('value', '')
    def handle_endtag(self, tag):
        if tag == 'form': self.active = False


def dec(value): return format(D(str(value)), 'f')
def add_months(year, month, delta):
    n = year * 12 + month - 1 + delta
    return n // 12, n % 12 + 1


class Acquisition:
    def __init__(self, plan, out, now):
        self.plan, self.out, self.now = plan, out, now
        self.evidence = []; out.mkdir(parents=True, exist_ok=False)
        self.months = [f'{y}{m:02d}' for y, m in [add_months(now.year, now.month, i) for i in range(-13, -1)]]
        q = (now.month - 1) // 3
        self.quarters = [f'{now.year + (q+i)//4}-Q{(q+i)%4+1}' for i in range(4)]
        self.sources = []
        for source in plan['officialSources']:
            url = official(source['url'])
            op = build_opener(OfficialRedirect())
            content = op.open(url, timeout=60).read()
            self.sources.append(content.decode('utf-8-sig'))
            self.save(content, source.get('kind', 'official_offer'), 'xml' if b'<' in content[:200] else 'txt')

    def save(self, content, kind='sanitized_probe', extension='json'):
        if not isinstance(content, bytes): content = json.dumps(content, indent=2, ensure_ascii=False).encode()
        digest = sha256(content).hexdigest()
        key = f'scenario/{self.now:%Y-%m}/{digest}.{extension}'
        path = self.out / key
        path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)
        self.evidence.append({'blobKey': key, 'sha256': digest, 'kind': kind})
        return len(self.evidence)-1

    def historical_month(self, quarter, holdout=False):
        number = int(quarter[-1]); preferred = ([11, 1, 4, 7] if holdout else [12, 2, 5, 8])[(number-4)%4]
        matches = [m for m in self.months if int(m[-2:]) == preferred]
        if len(matches) != 1: raise ValueError('Historical quarter mapping is not uniquely available')
        return matches[0]

    def quote(self, recipe, allocations, annual=False):
        code, commodity = recipe['offerCode'], self.plan['commodity']
        if not any(code in source for source in self.sources): raise ValueError(f'Probe absent from current official source: {code}')
        op = build_opener(OfficialRedirect(), HTTPCookieProcessor(CookieJar()))
        electric = commodity == 'electricity'; kind = 'energiaElettrica' if electric else 'gas'
        form = Form(); form.feed(op.open(BASE + '/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?' + urlencode({'tipoOfferta': kind, 'cap-comune':'Pescara','code-istat':'068028','fornitura':''}), timeout=45).read().decode())
        if not form.token: raise ValueError('Official form changed: missing request token')
        check = {'offertaConfrontoRequest':{'codiceComune':'068028','commodityType':'ELETTRICO' if electric else 'GAS','tipoCliente':'DOMESTICO','codiceOfferta':code}}
        op.open(Request(BASE+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json', data=json.dumps(check).encode(), headers={'Content-Type':'application/json'}), timeout=45).read()
        totals = [sum(D(str(row[i])) for row in allocations.values()) for i in range(3)]
        total = sum(totals)
        d = {'commodityType':kind,'codiceIstatComune':'068028','capComuneDescr':'Pescara','dove':'casa','codiceOffertaConfronto':code,'tipoOfferta':'prezzoFisso' if recipe.get('offerType')=='fixed' else 'prezzoVariabile','clienteVulnerabile':'NO','usaConsumi':'NO','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':form.token,'offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}
        mono = recipe.get('band')=='F0'
        if electric:
            d.update(residente='SI' if recipe.get('resident',True) else 'NO',potenza=recipe.get('powerKw','3'),tipoTariffa='monoraria' if mono else 'fasce',conosci='SI',consumoAnnuo=dec(total),consumoAnnuoSomma=dec(total),consumoFascia1=dec(totals[0]),consumoFascia2=dec(totals[1]),consumoFascia3=dec(totals[2]),fer='false')
        else:
            d.update(categoriaUsoCot='CC',categoriaUsoAcq='AC',categoriaUsoRisc='RISC',classeContatore='1',conosciGas='SI',ConsumoAnnuoGas=dec(total),mesiGas='0',personeGas='',superficieAbitazione='')
            gas_usage = recipe.get('gasUsage', 'RISC')
            if gas_usage not in ('RISC', 'CC_AC'): raise ValueError('Unsupported synthetic gas usage')
            if gas_usage == 'CC_AC': d.pop('categoriaUsoRisc', None)
        monthly = []
        for month in reversed(self.months):
            amounts = allocations.get(month, [0,0,0]); row = {'competenza_consumi':month, **{f'delta_misure_f{i}':None for i in range(1,7)},'delta_misure_monoraria':None,'delta_misure_gas':None}
            if not electric: row['delta_misure_gas'] = float(sum(D(str(v)) for v in amounts))
            elif mono: row['delta_misure_monoraria'] = float(sum(D(str(v)) for v in amounts))
            else:
                for i in range(3): row[f'delta_misure_f{i+1}'] = float(amounts[i])
            monthly.append(row)
        if not annual:
            d.update(usaConsumi='SI',statoMisure='3',misureMensili=json.dumps(monthly),consumoAnnuo=dec(total))
            if electric: d['consumiTotaliEE']=json.dumps({'consF0':float(total),**{f'consF{i+1}':None if mono else float(totals[i]) for i in range(3)}})
        response = op.open(Request(BASE+'/portaleOfferte/it/confronta_offerte.page',data=urlencode(d).encode()),timeout=60).read().decode()
        f = Form(); f.feed(response)
        pos = response.find('<p class="codice_offerta"><strong>cod. </strong>'+code)
        found = re.search(r'vaiAlDettaglioML\(false,(\d+),true,(\d+),([^)]*)\)',response[pos:]) if pos>=0 else None
        if not found: raise ValueError(f'Offer no longer simulable for synthetic profile: {code}')
        f.fields.update(idOfferta=found[1],isOffertaConfronto='true',idTipoOfferta=found[2])
        tariff=found[3].strip().strip("'\"")
        if tariff: f.fields['tipoTariffa']=tariff
        response=op.open(Request(BASE+'/portaleOfferte/it/dettaglio_offerta_ml.page',data=urlencode(f.fields).encode()),timeout=60).read().decode()
        sale = re.search(r'Vendita di (?:energia elettrica|gas naturale)</th>.*?<strong>€\s*([\d.,]+)</strong>', response,re.S|re.I)
        match = re.search(r'name="currentFilterJSON"[^>]*value=\'(.*?)\'',response,re.S)
        if not sale or not match: raise ValueError('Official detail changed: missing sale or normalized profile')
        profile = json.loads(unescape(match[1]))
        if electric and (D(str(profile.get('potenza',-1)))!=D(recipe.get('powerKw','3')) or profile.get('residente') is not recipe.get('resident',True)): raise ValueError('Portal normalized physical profile differs from request')
        if D(str(profile.get('consumoTotale', -1)))!=total: raise ValueError('Portal normalized volume differs from requested volume')
        if electric and not mono:
            for i in range(3):
                if D(str(profile.get('consumiEE',{}).get(f'consF{i+1}',-1)))!=totals[i]: raise ValueError('Portal normalized annual bands differ from request')
        accepted = profile.get('misure_mensili')
        if not annual:
            if not accepted or len(accepted)!=12: raise ValueError('Portal did not accept monthly input')
            fields=['delta_misure_monoraria'] if mono else (['delta_misure_f1','delta_misure_f2','delta_misure_f3'] if electric else ['delta_misure_gas'])
            expected={r['competenza_consumi']:r for r in monthly}
            for row in accepted:
                for field in fields:
                    if D(str(row.get(field))) != D(str(expected[row['competenza_consumi']][field])): raise ValueError('Portal normalized monthly profile differs from request')
        # Save an allowlist of synthetic inputs and aggregate economic observations only.
        observed=dec(sale[1].replace('.','').replace(',','.'))
        fragment={'observedAt':datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),'offerCode':code,'source':BASE+'/portaleOfferte/it/dettaglio_offerta_ml.page','observedSales':observed,'syntheticMonthlyInput':monthly if not annual else None,'bands':[dec(v) for v in totals],'normalizedTotal':dec(profile['consumoTotale']),'powerKw':recipe.get('powerKw','3') if electric else None,'resident':recipe.get('resident',True) if electric else None,'monthlyAccepted':not annual}
        cost_start=response.find('<h3 class="header_comp_sepsa"')
        cost_end=response.find('<script',cost_start)
        cost=response[cost_start:cost_end] if cost_start>=0 and cost_end>cost_start else ''
        if cost and not re.search(r'csrf_token|currentFilterJSON|jsessionid|set-cookie',cost,re.I):
            fragment['unitEvidenceIndex']=self.save(cost.encode(),'official_method','html')
            fragment['unitEvidence']=self.evidence[fragment['unitEvidenceIndex']]
            fragment['unitaryRows']=[]
            for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',cost,re.S):
                cells=[' '.join(unescape(re.sub('<[^>]+>',' ',cell)).split()) for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',row,re.S)]
                if any(cell.upper() in ['PPE','PD','PCV','ONFIN','FUNZAU','PE','PUN'] for cell in cells): fragment['unitaryRows'].append(cells)
        ref=self.save(fragment)
        print(json.dumps({'event':'quote_complete','offerCode':code,'bands':[dec(v) for v in totals],'annual':annual}),flush=True)
        return observed, ref

    def run(self):
        s={'schemaVersion':1,'commodity':self.plan['commodity'],'acquisitionMonth':self.now.strftime('%Y-%m'),'acquiredAt':self.now.astimezone(timezone.utc).isoformat().replace('+00:00','Z'),'method':'portal-implicit-quarterly-v1','provenance':'inferred_from_official_simulator','coverageStart':f'{self.quarters[0][:4]}-{(int(self.quarters[0][-1])-1)*3+1:02d}-01','coverageEnd':'','catalogVersionId':self.plan['catalogVersionId'],'requiredAnnualFingerprints':sorted(p['fingerprint'] for p in self.plan.get('annualProbes',[])),'evidence':self.evidence,'coefficients':[],'calibrations':[],'holdouts':[],'annualSales':[]}
        y,m=add_months(int(s['coverageStart'][:4]),int(s['coverageStart'][5:7]),12)
        from datetime import timedelta
        s['coverageEnd']=(date(y,m,1)-timedelta(days=1)).isoformat()
        for recipe in self.plan['quarterlyProbes']:
            b=recipe['band']; bandindex=1 if b=='F23' else (int(b[-1])-1 if b in ['F1','F2','F3'] else 0)
            n=D(str(recipe.get('consumption',1200 if self.plan['commodity']=='gas' else 3000)))
            for q in self.quarters:
                vector=[0,0,0]; vector[bandindex]=float(n)
                observed, ref=self.quote(recipe,{self.historical_month(q):vector})
                price=((D(observed)-D(recipe['fixedAnnual']))/n-D(recipe['spread'])-D(recipe['additiveUnit']))/D(recipe['multiplier'])
                s['coefficients'].append({'quarter':q,'band':b,'index':'PSV' if self.plan['commodity']=='gas' else 'PUN','value':dec(price),'uncertainty':dec(D('.005')/n/D(recipe['multiplier'])),'unit':'EUR/Smc' if self.plan['commodity']=='gas' else 'EUR/kWh'})
                s['calibrations'].append({**{k:recipe[k] for k in ['offerCode','fixedAnnual','spread','additiveUnit','multiplier']},'id':f'cal-{b}-{q}','quarter':q,'band':b,'consumption':dec(n),'observedSales':observed,'evidenceIndex':ref})
            # Independent profile, volume, allocation, and (when configured) supplier economics.
            check={**recipe,**recipe['holdout']}; weights=[D('.1'),D('.2'),D('.3'),D('.4')]
            terms=[]; allocations={}; prediction=D(check['fixedAnnual']); uncertainty=D('.005')
            for q,weight in zip(self.quarters,weights):
                amount=n*weight; vector=[0,0,0]; vector[bandindex]=float(amount)
                allocations[self.historical_month(q,True)]=vector
                terms.append({'quarter':q,'band':b,'consumption':dec(amount)})
                c=next(c for c in s['coefficients'] if c['quarter']==q and c['band']==b)
                prediction+=amount*(D(c['value'])*D(check['multiplier'])+D(check['spread'])+D(check['additiveUnit']))
                uncertainty+=amount*D(check['multiplier'])*D(c['uncertainty'])
            self.save({'id':f'holdout-{b}','prediction':dec(prediction),'tolerance':dec(uncertainty),'allocations':allocations,'offerCode':check['offerCode']},'prediction_before_query')
            observed,ref=self.quote(check,allocations)
            s['holdouts'].append({**{k:check[k] for k in ['offerCode','fixedAnnual','spread','additiveUnit','multiplier']},'id':f'holdout-{b}','observedSales':observed,'terms':terms,'evidenceIndex':ref})
        for recipe in self.plan.get('annualProbes',[]):
            points=[]
            for i,bands in enumerate([[3000,0,0],[0,3000,0],[0,0,3000],[6000,0,0]]):
                sale,ref=self.quote(recipe,{self.months[-1]:bands},annual=True)
                points.append({'id':f'peak-cal-{recipe["fingerprint"]}-{i}','f1':str(bands[0]),'f2':str(bands[1]),'f3':str(bands[2]),'observedSales':sale,'evidenceIndex':ref,'powerKw':'3','resident':True})
            A=2*D(points[0]['observedSales'])-D(points[3]['observedSales'])
            slopes=[(D(p['observedSales'])-A)/3000 for p in points[:3]]
            annual={'fingerprint':recipe['fingerprint'],'offerCode':recipe['offerCode'],'supplierVat':recipe['supplierVat'],'fixedAnnual':dec(A),'f1':dec(slopes[0]),'f2':dec(slopes[1]),'f3':dec(slopes[2]),'includes':['all_components_of_official_sales_row'],'domain':{'minKwh':'2000','maxKwh':'6000','powerKw':['3','4.5','6'],'resident':[True,False]},'calibrations':points,'holdouts':[]}
            for i,bands in enumerate([[1234,987,1779],[700,400,900],[1500,2000,2500]]):
                predicted=A+sum(slope*D(value) for slope,value in zip(slopes,bands))
                self.save({'fingerprint':recipe['fingerprint'],'bands':bands,'prediction':dec(predicted)},'prediction_before_query')
                sale,ref=self.quote(recipe,{self.months[-1]:bands},annual=True)
                annual['holdouts'].append({'id':f'peak-hold-{recipe["fingerprint"]}-{i}','f1':str(bands[0]),'f2':str(bands[1]),'f3':str(bands[2]),'observedSales':sale,'evidenceIndex':ref,'powerKw':'3','resident':True})
            for power,resident in [('3',False),('4.5',True),('4.5',False),('6',True),('6',False)]:
                bands=[1234,987,1779]
                predicted=A+sum(slope*D(value) for slope,value in zip(slopes,bands))
                self.save({'fingerprint':recipe['fingerprint'],'bands':bands,'powerKw':power,'resident':resident,'prediction':dec(predicted)},'prediction_before_query')
                sale,ref=self.quote({**recipe,'powerKw':power,'resident':resident},{self.months[-1]:bands},annual=True)
                annual['holdouts'].append({'id':f'peak-physical-{recipe["fingerprint"]}-{power}-{resident}','f1':str(bands[0]),'f2':str(bands[1]),'f3':str(bands[2]),'observedSales':sale,'evidenceIndex':ref,'powerKw':power,'resident':resident})
            s['annualSales'].append(annual)
        (self.out/'snapshot.json').write_text(json.dumps(s,indent=2))
        print(json.dumps({'status':'candidate_requires_validation','output':str(self.out/'snapshot.json'),'quarterlyCoefficients':len(s['coefficients']),'annualFingerprints':len(s['annualSales'])}))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan',required=True,type=Path);parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args()
    plan=json.loads(args.plan.read_text())
    now=datetime.now(ZoneInfo('Europe/Rome'))
    if plan['acquisitionMonth']!=now.strftime('%Y-%m'): raise ValueError('Plan must be prepared for this month and current published catalog')
    Acquisition(plan,args.out,now).run()

if __name__=='__main__':
    try: main()
    except Exception as exc:
        # Never dump HTTP requests, cookies, tokens, or response bodies in errors.
        print(json.dumps({'status':'failed','reason':str(exc)[:240]}));raise SystemExit(1)
