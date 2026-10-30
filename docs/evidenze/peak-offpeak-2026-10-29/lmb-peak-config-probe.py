from html.parser import HTMLParser
from pathlib import Path
from urllib.request import build_opener,HTTPCookieProcessor,Request
from urllib.parse import urlencode
from http.cookiejar import CookieJar
import json,re,sys,html
base='https://www.ilportaleofferte.it'
class P(HTMLParser):
 def __init__(self):super().__init__();self.token='';self.active=False;self.d={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='input'and d.get('name')=='csrf_token':self.token=d.get('value','')
  if t=='form':self.active=d.get('id')=='formDettaglioOffertaML'
  if self.active and t=='input'and'name'in d:self.d[d['name']]=d.get('value','')
 def handle_endtag(self,t):
  if t=='form':self.active=False
code=sys.argv[4] if len(sys.argv)>4 else '001686ESVFL00XXES3PC1026DO000000';f2=sys.argv[1];f3=sys.argv[2];f1=int(sys.argv[3])if len(sys.argv)>3 else 1000
op=build_opener(HTTPCookieProcessor(CookieJar()));out=Path('/tmp/lmb-peak-config-results') / sys.argv[5];out.mkdir(exist_ok=True,parents=True)
p=P();p.feed(op.open(base+'/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?tipoOfferta=energiaElettrica&cap-comune=Pescara&code-istat=068028&fornitura=',timeout=30).read().decode())
v={'offertaConfrontoRequest':{'codiceComune':'068028','commodityType':'ELETTRICO','tipoCliente':'DOMESTICO','codiceOfferta':code}}
val=json.loads(op.open(Request(base+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json',data=json.dumps(v).encode(),headers={'Content-Type':'application/json'}),timeout=30).read())
(out/f'validation-{code}-{f1}-{f2}-{f3}.json').write_text(json.dumps(val,indent=2))
d={'commodityType':'energiaElettrica','codiceIstatComune':'068028','capComuneDescr':'Pescara','dove':'casa','codiceOffertaConfronto':code,'tipoOfferta':'prezzoVariabile','clienteVulnerabile':'NO','residente':'SI','potenza':'3','tipoTariffa':'fasce','conosci':'SI','consumoAnnuoSomma':str(f1+int(f2)+int(f3)),'consumoFascia1':str(f1),'consumoFascia2':f2,'consumoFascia3':f3,'usaConsumi':'NO','fer':'false','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':p.token,'offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}

# Synthetic analyst-supplied monthly input, no actual supply identifier or authenticated endpoint.
month=sys.argv[5]
months=[f'{y}{m:02d}' for y,m in [(2025,m) for m in range(9,13)]+[(2026,m) for m in range(1,9)]]
assert month in months or month in ['flat','holdout','mixedholdout']
monthly=[]
for mo in months:
 active=mo==month or month=='flat'
 monthly.append({'competenza_consumi':mo,'delta_misure_f1':(f1/12 if month=='flat' else f1) if active else 0,'delta_misure_f2':(int(f2)/12 if month=='flat' else int(f2)) if active else 0,'delta_misure_f3':(int(f3)/12 if month=='flat' else int(f3)) if active else 0,'delta_misure_f4':None,'delta_misure_f5':None,'delta_misure_f6':None,'delta_misure_monoraria':None,'delta_misure_gas':None})
if month=='holdout':
 for item in monthly:
  item['delta_misure_f1']={'202511':600,'202601':900,'202604':1200,'202607':300}.get(item['competenza_consumi'],0)
  item['delta_misure_f2']=0
  item['delta_misure_f3']=0
if month=='mixedholdout':
 for item in monthly:
  q={'202511':[100,200,300],'202601':[200,300,100],'202604':[300,100,200],'202607':[400,400,400]}.get(item['competenza_consumi'],[0,0,0])
  for i in range(3):item[f'delta_misure_f{i+1}']=q[i]
monthly=list(reversed(monthly))
conf={f'f_{day}': ('32-2,80-1,96-2' if day in ['lunedi','martedi','mercoledi','giovedi','venerdi'] else '96-2') for day in ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica','festivo']}
d['configurazioneFasce']=json.dumps(conf)

d.update(usaConsumi='SI',statoMisure='3',misureMensili=json.dumps(monthly),consumoAnnuo=str(f1+int(f2)+int(f3)),consumiTotaliEE=json.dumps({'consF0':f1+int(f2)+int(f3),'consF1':f1,'consF2':int(f2),'consF3':int(f3)}))
(out/'synthetic-monthly-input.json').write_text(json.dumps(monthly,indent=2))

s=op.open(Request(base+'/portaleOfferte/it/confronta_offerte.page',data=urlencode(d).encode()),timeout=30).read().decode();p=P();p.feed(s)
i=s.find('<p class="codice_offerta"><strong>cod. </strong>'+code);m=re.search(r'vaiAlDettaglioML\(false,(\d+),true,(\d+),([^)]*)\)',s[i:]);assert i>=0 and m,'offer not found'
p.d.update(idOfferta=m[1],isOffertaConfronto='true',idTipoOfferta=m[2],tipoTariffa=m[3].strip().strip("'\""))
s=op.open(Request(base+'/portaleOfferte/it/dettaglio_offerta_ml.page',data=urlencode(p.d).encode()),timeout=30).read().decode()
rows=[]
for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',s,re.S):
 if '<th'in row:rows.append(' '.join(html.unescape(re.sub('<[^>]+>',' ',row)).split()))
match=re.search(r'name="currentFilterJSON"[^>]*value=\'(.*?)\'',s,re.S)
profile=json.loads(html.unescape(match.group(1)))if match else None
r={'code':code,'requested_bands':[f1,int(f2),int(f3)],'detail_type':m[2],'detail_tariff':m[3],'rows':rows,'profile':profile}
(out/f'profile-{code}-{f1}-{f2}-{f3}.json').write_text(json.dumps(r,indent=2))
start=s.find('<h3 class="header_comp_sepsa"');end=s.find('<script',start)
cost=s[start:end]if start>=0 else''
assert not re.search(r'csrf|currentFilterJSON|sessionid',cost,re.I)
(out/f'cost-{code}-{f1}-{f2}-{f3}.html').write_text(cost)
print(json.dumps(r))
