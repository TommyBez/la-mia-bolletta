#!/usr/bin/env python3
"""Acquire operational gas profile + excise/regional rates from official Portal.
One anonymous synthetic bootstrap per worker, then detail requests with municipality
changed in the public form. No household data, session cookies or CSRF persisted.
Checkpoint by Portal municipality; safe to rerun. All decimal prices are strings.
"""
import argparse,json,re,time,html,threading,hashlib
from pathlib import Path
from html.parser import HTMLParser
from urllib.request import build_opener,HTTPCookieProcessor,Request
from urllib.parse import urlencode,quote
from urllib.error import HTTPError,URLError
from email.utils import parsedate_to_datetime
import random
from http.cookiejar import CookieJar
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor,as_completed
BASE='https://www.ilportaleofferte.it';CODE='000971GSVML01XXPROD1300109202600'
class Form(HTMLParser):
 def __init__(self):super().__init__();self.token='';self.active=False;self.fields={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='input' and d.get('name')=='csrf_token':self.token=d.get('value','')
  if t=='form':self.active=d.get('id')=='formDettaglioOffertaML'
  if self.active and t=='input' and 'name' in d:self.fields[d['name']]=d.get('value','')
 def handle_endtag(self,t):
  if t=='form':self.active=False
class Probe:
 def __init__(self):self.op=build_opener(HTTPCookieProcessor(CookieJar()));self.bootstrap()
 def read(self,path,data=None):
  return self.op.open(Request(BASE+path,data=urlencode(data).encode() if data is not None else None),timeout=55).read().decode()
 def bootstrap(self):
  form=Form();form.feed(self.read('/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?tipoOfferta=gas&cap-comune=Torino&code-istat=001272&fornitura='))
  payload={'offertaConfrontoRequest':{'codiceComune':'001272','commodityType':'GAS','tipoCliente':'DOMESTICO','codiceOfferta':CODE}}
  self.op.open(Request(BASE+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'}),timeout=45).read()
  d={'commodityType':'gas','codiceIstatComune':'001272','capComuneDescr':'Torino','dove':'casa','codiceOffertaConfronto':CODE,'tipoOfferta':'prezzoVariabile','clienteVulnerabile':'NO','categoriaUsoCot':'CC','categoriaUsoAcq':'AC','categoriaUsoRisc':'RISC','classeContatore':'1','usaConsumi':'NO','conosciGas':'SI','ConsumoAnnuoGas':'4000','mesiGas':'0','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':form.token,'personeGas':'','superficieAbitazione':'','offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}
  s=self.read('/portaleOfferte/it/confronta_offerte.page',d);f=Form();f.feed(s)
  i=s.find('<p class="codice_offerta"><strong>cod. </strong>'+CODE);m=re.search(r'vaiAlDettaglioML\(false,(\d+),true,(\d+),\)',s[i:])
  if i<0 or not m:raise ValueError('Calibration offer not found in official Portal')
  self.fields=f.fields;self.fields.update(idOfferta=m[1],isOffertaConfronto='true',idTipoOfferta=m[2]);self.profile=json.loads(self.fields['currentFilterJSON'])
 def acquire(self,code,name):
  profile=dict(self.profile);profile.update(codiceComune=code,capComuneDescr=name)
  fields=dict(self.fields);fields['currentFilterJSON']=json.dumps(profile,separators=(',',':'))
  s=self.read('/portaleOfferte/it/dettaglio_offerta_ml.page',fields)
  normalized=re.search(r"""name="currentFilterJSON"[^>]*value='(.*?)'""",s,re.S)
  if not normalized:raise ValueError('Missing normalized synthetic profile')
  normalized=json.loads(html.unescape(normalized[1]))
  if str(normalized.get('codiceComune','')).zfill(6)!=code or Decimal(str(normalized.get('consumoGAS',0)))!=4000 or normalized.get('idCategoriaUso')!='RISC':raise ValueError('Portal normalized a different synthetic profile')
  rows=[]
  for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',s,re.S):
   cells=[' '.join(html.unescape(re.sub('<[^>]+>',' ',v)).split()) for v in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>',row,re.S)]
   if any(re.search(r'Accisa|Add[.] reg[.]',v,re.I) for v in cells):
    start=next(i for i,v in enumerate(cells) if re.search(r'Accisa|Add[.] reg[.]',v,re.I));rows.append(cells[start:])
  def rate(v):
   m=re.search(r'^\s*([\d.,]+)(?:\s|$)',v,re.I)
   if not m:raise ValueError('Missing tax unit rate: '+v)
   return str(Decimal(m[1].replace('.','').replace(',','.')))
  excise=[{'label':r[0],'eur_smc':rate(' '.join(r[1:]))} for r in rows if r[0].startswith('Accisa')]
  regional=[{'label':r[0],'eur_smc':rate(' '.join(r[1:]))} for r in rows if r[0].startswith('Add.')]
  sale=re.search(r'Vendita di gas naturale</th>.*?<strong>€ ([\d.,]+)</strong>',s,re.S)
  if len(excise)!=4 or len(regional)!=4 or not sale:raise ValueError('Incomplete official gas detail for '+code+' excise='+str(len(excise))+' regional='+str(len(regional))+' sale='+str(bool(sale))+' rows='+str(rows)[:600])
  amount=Decimal(sale[1].replace('.','').replace(',','.'))
  # Official v4.2 profiles + separately recovered quarterly PSV, zero-spread
  # calibration offer, fixed annual174. These are validation targets, not forecasts.
  candidates=[p for p,v in expected_profile_sales.items() if abs(v-amount)<=Decimal('.03')]
  if len(candidates)!=1:raise ValueError('Operational profile is not uniquely qualified for '+code+' sale '+str(amount))
  start=s.find('<h3 class="header_comp_sepsa"');ends=[i for i in [s.find('<script',start),s.find('</section>',start)] if i>start];cost=s[start:min(ends) if ends else len(s)]
  if re.search(r'csrf|currentFilterJSON|sessionid',cost,re.I):raise ValueError('Unexpected private session data in cost fragment')
  return {'portalCode':code,'name':name,'source':BASE+'/portaleOfferte/it/dettaglio_offerta_ml.page','observedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'syntheticAnnualSmc':'4000','usage':'RISC','calibrationOffer':CODE,'saleEur':str(amount),'operationalProfile':candidates[0],'rates':{'excise':excise,'regional':regional},'costFragmentSha256':hashlib.sha256(cost.encode()).hexdigest(),'calibrationScenarioSha256':hashlib.sha256(Path(a.scenario).read_bytes()).hexdigest(),'profileResidualEur':str(amount-expected_profile_sales[candidates[0]])},cost
p=argparse.ArgumentParser();p.add_argument('--out',default='src/modules/references/data/gas-observations');p.add_argument('--limit',type=int);p.add_argument('--workers',type=int,default=2);p.add_argument('--only');p.add_argument('--scenario',required=True,help='Qualified current gas scenario snapshot JSON');a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
scenario=json.loads(Path(a.scenario).read_text());coefficients={c['quarter']:Decimal(c['value']) for c in scenario['coefficients'] if c['index']=='PSV'}
if scenario['acquisitionMonth']!=time.strftime('%Y-%m'):raise ValueError('A current-month qualified scenario is required')
expected_profile_sales={}
profiles=json.loads(Path('src/modules/references/data/gas-profiles.json').read_text())['profiles']
for profile in profiles:
 if not profile['profile'].startswith('C1'):continue
 amount=Decimal(174)
 for month,percent in zip(profile['months'],profile['percentages']):
  year,m=month.split('-');quarter=f'{year}-Q{(int(m)-1)//3+1}';amount+=Decimal(4000)*Decimal(percent)/100*coefficients[quarter]
 expected_profile_sales[profile['profile']]=amount
items=json.loads(Path('src/modules/references/data/portal-geography/all.json').read_text())['items'];items=[r for r in items if r['esclusoOffertaGas']==0]
if a.only:items=[r for r in items if str(r['codIstat']).zfill(6) in a.only.split(',')]
items=[r for r in items if not (out/(str(r['codIstat']).zfill(6)+'.json')).exists()]
if a.limit:items=items[:a.limit]
local=threading.local()
def work(r):
 code=str(r['codIstat']).zfill(6)
 if (out/(code+'.json')).exists():return code,None
 for attempt in range(5):
  try:
   if not getattr(local,'probe',None):local.probe=Probe()
   data,cost=local.probe.acquire(code,r['denominazione']);(out/(code+'-cost.html')).write_text(cost);(out/(code+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2));time.sleep(.15);return code,None
  except Exception as e:
   local.probe=None
   if isinstance(e,ValueError) or attempt==4:return code,str(e)
   delay=min(60,2**attempt+random.random())
   if isinstance(e,HTTPError) and e.headers.get('Retry-After'):
    try:delay=max(delay,float(e.headers['Retry-After']))
    except ValueError:
     try:delay=max(delay,parsedate_to_datetime(e.headers['Retry-After']).timestamp()-time.time())
     except Exception:pass
   time.sleep(min(120,delay))
errors=[];completed=0
with ThreadPoolExecutor(max_workers=a.workers) as pool:
 for f in as_completed([pool.submit(work,r) for r in items]):
  code,error=f.result();completed+=1
  if error:errors.append({'portalCode':code,'error':error})
  if error or completed%50==0 or completed==len(items):print(json.dumps({'completed':completed,'total':len(items),'portalCode':code,'error':error}),flush=True)
(out/'errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
