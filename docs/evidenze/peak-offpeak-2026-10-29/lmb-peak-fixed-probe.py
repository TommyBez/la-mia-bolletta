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
op=build_opener(HTTPCookieProcessor(CookieJar()));out=Path('/tmp/lmb-peak-fixed-results');out.mkdir(exist_ok=True)
p=P();p.feed(op.open(base+'/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?tipoOfferta=energiaElettrica&cap-comune=Pescara&code-istat=068028&fornitura=',timeout=30).read().decode())
v={'offertaConfrontoRequest':{'codiceComune':'068028','commodityType':'ELETTRICO','tipoCliente':'DOMESTICO','codiceOfferta':code}}
val=json.loads(op.open(Request(base+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json',data=json.dumps(v).encode(),headers={'Content-Type':'application/json'}),timeout=30).read())
(out/f'validation-{code}-{f1}-{f2}-{f3}.json').write_text(json.dumps(val,indent=2))
d={'commodityType':'energiaElettrica','codiceIstatComune':'068028','capComuneDescr':'Pescara','dove':'casa','codiceOffertaConfronto':code,'tipoOfferta':'prezzoFisso','clienteVulnerabile':'NO','residente':'SI','potenza':'3','tipoTariffa':'fasce','conosci':'SI','consumoAnnuoSomma':str(f1+int(f2)+int(f3)),'consumoFascia1':str(f1),'consumoFascia2':f2,'consumoFascia3':f3,'usaConsumi':'NO','fer':'false','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':p.token,'offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}
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
